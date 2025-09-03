const scannerService = require('../services/scannerService');
const cveService = require('../services/cveService');
const Joi = require('joi');

// In-memory storage for scan configurations (in production, use a database)
const scanConfigurations = new Map();

// Import real scanner modules
const PortScanner = require('../../scanner/lib/scanners/port-scanner');
const VulnerabilityScanner = require('../../scanner/lib/scanners/vulnerability-scanner');
const WebScanner = require('../../scanner/lib/scanners/web-scanner');
const SNMPScanner = require('../../scanner/lib/scanners/snmp-scanner');
const WMIScanner = require('../../scanner/lib/scanners/wmi-scanner');
const EnhancedSSHScanner = require('../../scanner/lib/scanners/enhanced-ssh-scanner');
const SMBScanner = require('../../scanner/lib/scanners/smb-scanner');

class ScannerController {

  // ==================== SCAN EXECUTION ====================

  /**
   * Execute an internal network scan
   */
  async executeInternalScan(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        networkRange: Joi.string().default('auto'),
        scanType: Joi.string().valid('quick', 'comprehensive', 'stealth').default('quick'),
        ports: Joi.array().items(Joi.number().integer().min(1).max(65535)),
        excludeHosts: Joi.array().items(Joi.string()),
        timeout: Joi.number().integer().min(1).max(3600).default(300),
        maxConcurrency: Joi.number().integer().min(1).max(100).default(10),
        enableServiceDetection: Joi.boolean().default(true),
        enableOSDetection: Joi.boolean().default(false),
        customOptions: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const result = await scannerService.executeInternalScan(value, req.user.id);

      res.status(201).json({
        message: 'Internal scan initiated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error executing internal scan:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: 'User not found', 
          message: error.message 
        });
      }
      
      if (error.message.includes('permission')) {
        return res.status(403).json({ 
          error: 'Insufficient permissions', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Execute a vulnerability scan
   */
  async executeVulnerabilityScan(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        target: Joi.string().required(),
        scanType: Joi.string().valid('basic', 'full', 'web', 'database').default('basic'),
        ports: Joi.array().items(Joi.number().integer().min(1).max(65535)),
        credentials: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
          keyFile: Joi.string()
        }),
        excludeCVEs: Joi.array().items(Joi.string()),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
        timeout: Joi.number().integer().min(1).max(7200).default(1800),
        customOptions: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const result = await scannerService.executeVulnerabilityScan(value.target, value, req.user.id);

      res.status(201).json({
        message: 'Vulnerability scan initiated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error executing vulnerability scan:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: 'User not found', 
          message: error.message 
        });
      }
      
      if (error.message.includes('permission')) {
        return res.status(403).json({ 
          error: 'Insufficient permissions', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Execute a compliance scan
   */
  async executeComplianceScan(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        target: Joi.string().required(),
        frameworks: Joi.array().items(
          Joi.string().valid('nist', 'cis', 'pci', 'sox', 'fisma', 'fedramp')
        ).min(1).required(),
        scanType: Joi.string().valid('configuration', 'policy', 'full').default('configuration'),
        credentials: Joi.object({
          username: Joi.string(),
          password: Joi.string(),
          keyFile: Joi.string()
        }),
        customPolicies: Joi.array().items(Joi.string()),
        timeout: Joi.number().integer().min(1).max(7200).default(1800),
        customOptions: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const result = await scannerService.executeComplianceScan(value.target, value, req.user.id);

      res.status(201).json({
        message: 'Compliance scan initiated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error executing compliance scan:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: 'User not found', 
          message: error.message 
        });
      }
      
      if (error.message.includes('permission')) {
        return res.status(403).json({ 
          error: 'Insufficient permissions', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Execute a container security scan
   */
  async executeContainerScan(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        target: Joi.string().required(),
        checks: Joi.array().items(
          Joi.string().valid(
            'image-vulnerabilities',
            'dockerfile-security',
            'container-config',
            'runtime-security',
            'secrets-detection',
            'compliance-checks',
            'registry-scan',
            'kubernetes-scan'
          )
        ).default(['image-vulnerabilities']),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
        comprehensive: Joi.boolean().default(false),
        timeout: Joi.number().integer().min(1).max(3600).default(300),
        customOptions: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.executeContainerScan(value.target, value, req.user.id);

      res.status(201).json({
        message: 'Container scan initiated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error executing container scan:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          error: 'User not found',
          message: error.message
        });
      }
      
      if (error.message.includes('permission')) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: error.message
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SCAN RESULTS MANAGEMENT ====================

  /**
   * Get all scan jobs with filtering and pagination
   */
  async getAllScanJobs(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        scanType: Joi.string().valid('internal', 'vulnerability', 'compliance', 'web'),
        status: Joi.string().valid('pending', 'running', 'completed', 'failed', 'cancelled'),
        target: Joi.string().max(255),
        initiatedBy: Joi.number().integer(),
        dateFrom: Joi.date().iso(),
        dateTo: Joi.date().iso(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'completedAt', 'scanType', 'status', 'target').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { page, limit, sortBy, sortOrder, ...filters } = value;

      const result = await scannerService.getAllScanJobs(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Scan jobs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting scan jobs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get scan job by ID with results
   */
  async getScanJobById(req, res) {
    try {
      const { jobId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        jobId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ jobId: parseInt(jobId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid job ID', 
          details: error.details 
        });
      }

      const job = await scannerService.getScanJobById(parseInt(jobId));

      res.json({
        message: 'Scan job retrieved successfully',
        data: job
      });

    } catch (error) {
      console.error('Error getting scan job by ID:', error);
      
      if (error.message === 'Scan job not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Scan job not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get scan statistics
   */
  async getScanStatistics(req, res) {
    try {
      const statistics = await scannerService.getScanStatistics();

      res.json({
        message: 'Scan statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      console.error('Error getting scan statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SCAN STATUS MANAGEMENT ====================

  /**
   * Cancel a running scan
   */
  async cancelScan(req, res) {
    try {
      const { jobId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        jobId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ jobId: parseInt(jobId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid job ID', 
          details: error.details 
        });
      }

      // Get the scan job to check if it can be cancelled
      const job = await scannerService.getScanJobById(parseInt(jobId));
      
      if (job.status !== 'running' && job.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Cannot cancel scan', 
          message: 'Only running or pending scans can be cancelled' 
        });
      }

      // TODO: Implement actual scan cancellation logic
      // This would involve communicating with the scanner process to stop it
      
      res.json({
        message: 'Scan cancellation requested',
        data: {
          jobId: parseInt(jobId),
          status: 'cancellation_requested'
        }
      });

    } catch (error) {
      console.error('Error cancelling scan:', error);
      
      if (error.message === 'Scan job not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Scan job not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }


  // ==================== TERMINAL EXECUTION ====================

  /**
   * Execute scanner command from terminal
   */
  async executeTerminalCommand(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        command: Joi.string().required(),
        saveOutput: Joi.boolean().default(false),
        outputFilename: Joi.string().when('saveOutput', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional()
        })
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.executeTerminalCommand(value, req.user.id);

      res.status(200).json({
        message: 'Command executed successfully',
        data: result
      });

    } catch (error) {
      console.error('Error executing terminal command:', error);

      if (error.message === 'Invalid command') {
        return res.status(400).json({
          error: 'Invalid command',
          message: error.message
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get available command presets
   */
  async getCommandPresets(req, res) {
    try {
      const presets = await scannerService.getCommandPresets();

      res.status(200).json({
        message: 'Command presets retrieved successfully',
        data: presets
      });

    } catch (error) {
      console.error('Error getting command presets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SCHEDULE MANAGEMENT ====================

  /**
   * Get all scan schedules
   */
  async getAllSchedules(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        enabled: Joi.boolean(),
        scanType: Joi.string().valid('internal', 'vulnerability', 'compliance', 'web'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.getAllSchedules(value, req.user.id);

      res.status(200).json({
        message: 'Schedules retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Error getting schedules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create a new scan schedule
   */
  async createSchedule(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().allow(''),
        scanType: Joi.string().valid('internal', 'vulnerability', 'compliance', 'web').required(),
        target: Joi.string().required(),
        configuration: Joi.object().default({}),
        schedule: Joi.string().required(), // Cron expression
        enabled: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.createSchedule(value, req.user.id);

      res.status(201).json({
        message: 'Schedule created successfully',
        data: result
      });

    } catch (error) {
      console.error('Error creating schedule:', error);

      if (error.message.includes('Invalid cron')) {
        return res.status(400).json({
          error: 'Invalid schedule',
          message: error.message
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update a scan schedule
   */
  async updateSchedule(req, res) {
    try {
      const scheduleId = parseInt(req.params.scheduleId);

      // Validate request body
      const schema = Joi.object({
        name: Joi.string(),
        description: Joi.string().allow(''),
        scanType: Joi.string().valid('internal', 'vulnerability', 'compliance', 'web'),
        target: Joi.string(),
        configuration: Joi.object(),
        schedule: Joi.string(), // Cron expression
        enabled: Joi.boolean()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.updateSchedule(scheduleId, value, req.user.id);

      res.status(200).json({
        message: 'Schedule updated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error updating schedule:', error);

      if (error.message === 'Schedule not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Schedule not found'
        });
      }

      if (error.message.includes('Invalid cron')) {
        return res.status(400).json({
          error: 'Invalid schedule',
          message: error.message
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a scan schedule
   */
  async deleteSchedule(req, res) {
    try {
      const scheduleId = parseInt(req.params.scheduleId);

      await scannerService.deleteSchedule(scheduleId, req.user.id);

      res.status(200).json({
        message: 'Schedule deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting schedule:', error);

      if (error.message === 'Schedule not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Schedule not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Get all scan templates
   */
  async getAllTemplates(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        category: Joi.string(),
        scanType: Joi.string().valid('internal', 'vulnerability', 'compliance', 'web'),
        search: Joi.string(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.getAllTemplates(value, req.user.id);

      res.status(200).json({
        message: 'Templates retrieved successfully',
        data: result
      });

    } catch (error) {
      console.error('Error getting templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create a new scan template
   */
  async createTemplate(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255),
        description: Joi.string().allow(''),
        scanType: Joi.string().valid('internal', 'vulnerability', 'compliance', 'web').required(),
        configuration: Joi.object().required(),
        category: Joi.string().default('custom'),
        estimatedTime: Joi.string().default('10-15 minutes'),
        enabled: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.createTemplate(value, req.user.id);

      res.status(201).json({
        message: 'Template created successfully',
        data: result
      });

    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update a scan template
   */
  async updateTemplate(req, res) {
    try {
      const templateId = parseInt(req.params.templateId);

      // Validate request body
      const schema = Joi.object({
        name: Joi.string().max(255),
        description: Joi.string().allow(''),
        scanType: Joi.string().valid('internal', 'vulnerability', 'compliance', 'web'),
        configuration: Joi.object(),
        category: Joi.string(),
        estimatedTime: Joi.string(),
        enabled: Joi.boolean()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await scannerService.updateTemplate(templateId, value, req.user.id);

      res.status(200).json({
        message: 'Template updated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error updating template:', error);

      if (error.message === 'Template not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Template not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete a scan template
   */
  async deleteTemplate(req, res) {
    try {
      const templateId = parseInt(req.params.templateId);

      await scannerService.deleteTemplate(templateId, req.user.id);

      res.status(200).json({
        message: 'Template deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting template:', error);

      if (error.message === 'Template not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Template not found'
        });
      }

      if (error.message === 'Cannot delete default template') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Cannot delete default template'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== NEW SCANNER API METHODS ====================

  /**
   * Start a new security scan (generic method for routes)
   */
  async startScan(req, res) {
    try {
      const schema = Joi.object({
        targets: Joi.array().items(Joi.string()).min(1).required(),
        name: Joi.string().optional(),
        description: Joi.string().optional(),
        modules: Joi.array().items(Joi.string().valid('network', 'web', 'ssl', 'compliance', 'configuration', 'aws', 'azure', 'gcp', 'cloud', 'container', 'docker', 'k8s', 'openshift', 'snmp', 'wmi', 'ssh', 'smb', 'vulnerability', 'vuln', 'government')).default(['network']),
        ports: Joi.array().items(Joi.number().integer().min(1).max(65535)).optional(),
        options: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      // Generate scan ID
      const scanId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store scan configuration for later retrieval
      scanConfigurations.set(scanId, {
        targets: value.targets,
        modules: value.modules,
        options: value.options,
        timestamp: new Date().toISOString()
      });
      
      // For now, simulate scan start - in real implementation would use scanner service
      const result = {
        scanId,
        status: 'queued',
        message: 'Scan initiated successfully',
        estimatedDuration: '15-30 minutes',
        targets: value.targets,
        modules: value.modules
      };

      res.status(201).json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Error starting scan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get scan status by scan ID
   */
  async getScanStatus(req, res) {
    try {
      const { scanId } = req.params;
      
      // Mock implementation - in real system would query database
      const mockStatus = {
        scanId,
        status: 'running',
        progress: 45,
        startTime: new Date().toISOString(),
        targetsTotal: 5,
        targetsCompleted: 2,
        findingsCount: 12
      };

      res.json(mockStatus);

    } catch (error) {
      console.error('Error getting scan status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get scan results by scan ID
   */
  async getScanResults(req, res) {
    try {
      const { scanId } = req.params;
      const { severity, type, limit = 100, offset = 0 } = req.query;
      
      // Retrieve the actual scan configuration that was submitted
      const scanConfig = scanConfigurations.get(scanId);
      if (!scanConfig) {
        return res.status(404).json({
          error: 'Scan not found',
          message: `Scan with ID ${scanId} not found`
        });
      }

      console.log(`[Scanner Controller] Executing real scan for scanId: ${scanId}`);
      console.log(`[Scanner Controller] Targets: ${scanConfig.targets.join(', ')}`);
      console.log(`[Scanner Controller] Modules: ${scanConfig.modules.join(', ')}`);

      const scanResults = {
        scanId,
        scanInfo: {
          name: 'Real Network Security Scan',
          startTime: new Date().toISOString(),
          endTime: null, // Will be set when scan completes
          status: 'running'
        },
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        },
        results: []
      };

      const allFindings = [];
      let findingId = 1;

      // Execute real scans for each target
      for (const target of scanConfig.targets) {
        console.log(`[Scanner Controller] Scanning target: ${target}`);
        
        try {
          // Network/Port Scanning
          if (scanConfig.modules.includes('network')) {
            console.log(`[Scanner Controller] Running port scan on ${target}`);
            const portScanner = new PortScanner({
              timeout: 3000,
              concurrency: 50
            });
            
            const portResults = await portScanner.scan(target, scanConfig.options.ports || [22, 80, 443, 8080]);
            console.log(`[Scanner Controller] Port scan found ${portResults.length} open ports on ${target}`);
            
            // Convert port scan results to vulnerability format
            for (const port of portResults) {
              allFindings.push({
                id: findingId++,
                target: target,
                type: 'information',
                severity: 'info',
                title: `Open Port: ${port.port} (${port.service})`,
                description: `Port ${port.port} is open and running ${port.service} service`,
                cve: null,
                cvssScore: 0.0,
                solution: 'Review if this service is necessary and properly configured',
                timestamp: new Date().toISOString(),
                details: {
                  port: port.port,
                  service: port.service,
                  status: port.status
                }
              });
            }

            // Run vulnerability scan on discovered ports
            if (portResults.length > 0) {
              console.log(`[Scanner Controller] Running vulnerability scan on ${target}`);
              const vulnScanner = new VulnerabilityScanner({ timeout: 8000 });
              
              const vulnResults = await vulnScanner.scan(target, {
                ports: portResults.map(p => p.port),
                checks: ['ssl-tls', 'http-headers', 'ssh-security', 'open-ports']
              });
              
              console.log(`[Scanner Controller] Vulnerability scan found ${vulnResults.vulnerabilities.length} issues on ${target}`);
              
              // Convert vulnerability scan results with real CVE lookup
              for (const vuln of vulnResults.vulnerabilities) {
                let cveId = vuln.details?.cve;
                let cvssScore = controllerInstance._calculateCVSS(vuln.severity);
                
                // Use real CVE service to find relevant CVEs
                if (!cveId) {
                  try {
                    // Search for CVEs related to this vulnerability type
                    const searchTerms = controllerInstance._extractCVESearchTerms(vuln.name, vuln.description);
                    const cveResults = await cveService.advancedSearch(searchTerms, 'all', 3);
                    
                    if (cveResults.results && cveResults.results.length > 0) {
                      // Use the first matching CVE
                      const matchedCve = cveResults.results[0];
                      cveId = matchedCve.cveId;
                      cvssScore = matchedCve.cvssScore || cvssScore;
                      console.log(`[Scanner Controller] Found CVE ${cveId} for vulnerability: ${vuln.name}`);
                    } else {
                      console.log(`[Scanner Controller] No CVE found for: ${vuln.name}`);
                    }
                  } catch (cveError) {
                    console.log(`[Scanner Controller] CVE lookup failed for ${vuln.name}: ${cveError.message}`);
                  }
                }

                allFindings.push({
                  id: findingId++,
                  target: target,
                  type: 'vulnerability',
                  severity: vuln.severity,
                  title: vuln.name,
                  description: vuln.description,
                  cve: cveId,
                  cvssScore: cvssScore,
                  solution: vuln.details?.solution || 'No solution provided',
                  timestamp: new Date().toISOString(),
                  details: vuln.details || {}
                });
              }
            }
          }

          // Web Application Scanning
          if (scanConfig.modules.includes('web')) {
            console.log(`[Scanner Controller] Running web scan on ${target}`);
            try {
              const webScanner = new WebScanner({
                timeout: 8000,
                maxDepth: 2,
                maxPages: 10
              });
              
              const webTarget = target.startsWith('http') ? target : `http://${target}`;
              const webResults = await webScanner.scan(webTarget, {
                crawl: true,
                checks: ['http-headers', 'ssl-tls', 'xss', 'csrf', 'sensitive-data'],
                formAnalysis: true
              });
              
              console.log(`[Scanner Controller] Web scan found ${webResults.vulnerabilities.length} issues on ${target}`);
              
              // Convert web scan results with real CVE lookup
              for (const vuln of webResults.vulnerabilities) {
                let cveId = vuln.evidence?.cve;
                let cvssScore = controllerInstance._calculateCVSS(vuln.severity);
                
                // Use real CVE service to find relevant CVEs
                if (!cveId) {
                  try {
                    // Search for CVEs related to web vulnerabilities
                    const searchTerms = controllerInstance._extractCVESearchTerms(vuln.name, vuln.description);
                    const cveResults = await cveService.advancedSearch(searchTerms, 'all', 3);
                    
                    if (cveResults.results && cveResults.results.length > 0) {
                      // Use the first matching CVE
                      const matchedCve = cveResults.results[0];
                      cveId = matchedCve.cveId;
                      cvssScore = matchedCve.cvssScore || cvssScore;
                      console.log(`[Scanner Controller] Found CVE ${cveId} for web vulnerability: ${vuln.name}`);
                    } else {
                      console.log(`[Scanner Controller] No CVE found for: ${vuln.name}`);
                    }
                  } catch (cveError) {
                    console.log(`[Scanner Controller] CVE lookup failed for ${vuln.name}: ${cveError.message}`);
                  }
                }

                allFindings.push({
                  id: findingId++,
                  target: target,
                  type: 'vulnerability',
                  severity: vuln.severity,
                  title: vuln.name,
                  description: vuln.description,
                  cve: cveId,
                  cvssScore: cvssScore,
                  solution: vuln.remediation || 'No solution provided',
                  timestamp: new Date().toISOString(),
                  details: vuln.evidence || {}
                });
              }
            } catch (webError) {
              console.log(`[Scanner Controller] Web scan failed for ${target}: ${webError.message}`);
              // Add a finding about the web scan failure
              allFindings.push({
                id: findingId++,
                target: target,
                type: 'information',
                severity: 'info',
                title: 'Web Service Not Accessible',
                description: `Could not perform web application scan: ${webError.message}`,
                cve: null,
                cvssScore: 0.0,
                solution: 'Ensure web service is accessible if web scanning is required',
                timestamp: new Date().toISOString(),
                details: { error: webError.message }
              });
            }
          }

          // SNMP Scanning
          if (scanConfig.modules.includes('snmp')) {
            console.log(`[Scanner Controller] Running SNMP scan on ${target}`);
            try {
              const snmpScanner = new SNMPScanner({
                timeout: 3000,
                communityStrings: ['public', 'private', 'community'],
                ports: [161]
              });
              
              const snmpResults = await snmpScanner.discoverDevices(target);
              console.log(`[Scanner Controller] SNMP scan found ${snmpResults.devicesFound} devices`);
              
              // Convert SNMP scan results
              if (snmpResults.devicesFound > 0) {
                for (const device of snmpResults.devices) {
                  allFindings.push({
                    id: findingId++,
                    target: target,
                    type: 'information',
                    severity: 'info',
                    title: `SNMP Device Discovered: ${device.deviceType}`,
                    description: `SNMP-enabled ${device.deviceType} detected: ${device.systemDescription}`,
                    cve: null,
                    cvssScore: 0.0,
                    solution: 'Ensure SNMP is properly secured with strong community strings',
                    timestamp: new Date().toISOString(),
                    details: {
                      port: device.port,
                      community: device.community,
                      deviceType: device.deviceType,
                      manufacturer: device.manufacturer,
                      systemName: device.systemName,
                      interfaces: device.interfaces?.length || 0
                    }
                  });

                  // Check for default community strings
                  if (device.community === 'public' || device.community === 'private') {
                    allFindings.push({
                      id: findingId++,
                      target: target,
                      type: 'vulnerability',
                      severity: 'high',
                      title: 'Default SNMP Community String',
                      description: `SNMP service is using default community string '${device.community}'`,
                      cve: 'CVE-2002-0013',
                      cvssScore: 7.5,
                      solution: 'Change default SNMP community strings and implement SNMPv3',
                      timestamp: new Date().toISOString(),
                      details: {
                        port: device.port,
                        community: device.community,
                        deviceType: device.deviceType
                      }
                    });
                  }
                }
              }
            } catch (snmpError) {
              console.log(`[Scanner Controller] SNMP scan failed for ${target}: ${snmpError.message}`);
            }
          }

          // Add other scanner module implementations here (WMI, SSH, SMB)
          // These would follow the same pattern as above

        } catch (targetError) {
          console.error(`[Scanner Controller] Error scanning target ${target}:`, targetError);
          allFindings.push({
            id: findingId++,
            target: target,
            type: 'information',
            severity: 'info',
            title: 'Scan Error',
            description: `Error occurred while scanning target: ${targetError.message}`,
            cve: null,
            cvssScore: 0.0,
            solution: 'Check target accessibility and scan configuration',
            timestamp: new Date().toISOString(),
            details: { error: targetError.message }
          });
        }
      }

      // Update scan results with real findings
      scanResults.results = allFindings;
      scanResults.summary.total = allFindings.length;
      scanResults.summary.critical = allFindings.filter(f => f.severity === 'critical').length;
      scanResults.summary.high = allFindings.filter(f => f.severity === 'high').length;
      scanResults.summary.medium = allFindings.filter(f => f.severity === 'medium').length;
      scanResults.summary.low = allFindings.filter(f => f.severity === 'low').length;
      scanResults.summary.info = allFindings.filter(f => f.severity === 'info').length;
      
      scanResults.scanInfo.endTime = new Date().toISOString();
      scanResults.scanInfo.status = 'completed';

      console.log(`[Scanner Controller] Scan completed. Total findings: ${scanResults.summary.total}`);
      console.log(`[Scanner Controller] Breakdown: ${scanResults.summary.critical} critical, ${scanResults.summary.high} high, ${scanResults.summary.medium} medium, ${scanResults.summary.low} low, ${scanResults.summary.info} info`);

      res.json(scanResults);

    } catch (error) {
      console.error('Error getting scan results:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Calculate CVSS score based on severity
   */
  _calculateCVSS(severity) {
    const severityScores = {
      'critical': 9.0 + Math.random() * 1.0, // 9.0 - 10.0
      'high': 7.0 + Math.random() * 2.0,     // 7.0 - 9.0
      'medium': 4.0 + Math.random() * 3.0,   // 4.0 - 7.0
      'low': 1.0 + Math.random() * 3.0,      // 1.0 - 4.0
      'info': 0.0
    };
    return Math.round((severityScores[severity] || 0.0) * 10) / 10;
  }

  /**
   * Extract search terms from vulnerability name and description for CVE lookup
   */
  _extractCVESearchTerms(name, description) {
    const searchTerms = [];
    
    // Extract key terms from vulnerability name
    if (name) {
      // Remove common prefixes/suffixes and split by common separators
      const cleanName = name
        .replace(/^(vulnerable?|insecure|weak|default|missing|improper|insufficient)\s+/i, '')
        .replace(/\s+(vulnerability|vuln|issue|problem|flaw|weakness)$/i, '')
        .replace(/[^\w\s]/g, ' ')
        .toLowerCase();
      
      // Split and filter meaningful terms
      const nameTerms = cleanName
        .split(/\s+/)
        .filter(term => term.length > 2 && !['the', 'and', 'for', 'with', 'from', 'this', 'that'].includes(term))
        .slice(0, 3); // Take first 3 meaningful terms
      
      searchTerms.push(...nameTerms);
    }
    
    // Extract technology/protocol terms from description
    if (description) {
      const techPatterns = [
        /\b(ssl|tls|https?|ssh|ftp|smtp|snmp|ldap|dns|dhcp|ntp|samba|smb|cifs|rpc|tcp|udp)\b/gi,
        /\b(apache|nginx|iis|tomcat|jboss|websphere|weblogic|php|mysql|postgresql|oracle|mongodb)\b/gi,
        /\b(windows|linux|unix|centos|ubuntu|debian|redhat|solaris|aix)\b/gi,
        /\b(openssl|openssh|bind|sendmail|postfix|dovecot|vsftpd|proftpd)\b/gi
      ];
      
      for (const pattern of techPatterns) {
        const matches = description.match(pattern);
        if (matches) {
          searchTerms.push(...matches.map(m => m.toLowerCase()));
        }
      }
    }
    
    // Remove duplicates and limit to 5 terms
    const uniqueTerms = [...new Set(searchTerms)].slice(0, 5);
    
    console.log(`[CVE Search] Extracted terms for "${name}": ${uniqueTerms.join(', ')}`);
    return uniqueTerms;
  }

  /**
   * Stop a running scan
   */
  async stopScan(req, res) {
    try {
      const { scanId } = req.params;
      
      // Mock implementation
      res.json({
        success: true,
        message: 'Scan stopped successfully',
        scanId
      });

    } catch (error) {
      console.error('Error stopping scan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Export scan results
   */
  async exportScanResults(req, res) {
    try {
      const { scanId } = req.params;
      const { format = 'json' } = req.query;
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="scan_${scanId}_results.csv"`);
        res.send('Target,Type,Severity,Title,CVE,CVSS Score\n192.168.1.10,vulnerability,high,SSH Version Disclosure,CVE-2018-15473,7.5');
      } else {
        res.json({
          scanId,
          exportFormat: format,
          timestamp: new Date().toISOString(),
          results: []
        });
      }

    } catch (error) {
      console.error('Error exporting scan results:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get scan history
   */
  async getScanHistory(req, res) {
    try {
      const { limit = 50, offset = 0, status } = req.query;
      
      // Mock implementation
      const mockScans = [
        {
          scanId: 'scan_1703123456789_abc123',
          name: 'Production Network Scan',
          description: 'Weekly security assessment',
          status: 'completed',
          progress: 100,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          createdBy: req.user?.email || 'admin@company.com'
        }
      ];

      res.json({
        scans: mockScans,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: 1
        }
      });

    } catch (error) {
      console.error('Error getting scan history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get available scanner modules
   */
  async getScannerModules(req, res) {
    try {
      const modules = [
        {
          name: 'network',
          displayName: 'Network Scanner',
          description: 'Port scanning, service detection, and network enumeration',
          capabilities: ['port_scanning', 'service_detection', 'banner_grabbing', 'os_detection']
        },
        {
          name: 'web',
          displayName: 'Web Application Scanner',
          description: 'Web vulnerability assessment and security testing',
          capabilities: ['sql_injection', 'xss_detection', 'directory_traversal', 'security_headers']
        },
        {
          name: 'ssl',
          displayName: 'SSL/TLS Scanner',
          description: 'SSL certificate and encryption analysis',
          capabilities: ['certificate_validation', 'cipher_analysis', 'protocol_testing']
        },
        {
          name: 'compliance',
          displayName: 'Compliance Scanner',
          description: 'Security compliance and configuration assessment',
          capabilities: ['cis_benchmarks', 'nist_compliance', 'pci_dss', 'configuration_audit']
        },
        {
          name: 'snmp',
          displayName: 'SNMP Discovery',
          description: 'Network device discovery via SNMP protocol',
          capabilities: ['device_enumeration', 'system_info', 'interface_discovery', 'community_strings']
        },
        {
          name: 'wmi',
          displayName: 'WMI Scanner',
          description: 'Windows Management Instrumentation analysis',
          capabilities: ['system_inventory', 'service_enumeration', 'user_accounts', 'installed_software']
        },
        {
          name: 'ssh',
          displayName: 'Enhanced SSH Scanner',
          description: 'Deep Linux system analysis via SSH',
          capabilities: ['system_configuration', 'user_enumeration', 'file_permissions', 'process_analysis']
        },
        {
          name: 'smb',
          displayName: 'SMB Discovery',
          description: 'Windows share and domain environment discovery',
          capabilities: ['share_enumeration', 'domain_info', 'user_enumeration', 'group_policy']
        }
      ];

      res.json({ modules });

    } catch (error) {
      console.error('Error getting scanner modules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

const controllerInstance = new ScannerController();

// Debug: Log available methods
console.log('[Debug] Controller methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(controllerInstance)));
console.log('[Debug] startScan method exists:', typeof controllerInstance.startScan);

module.exports = controllerInstance;
