const scannerService = require('../services/scannerService');
const Joi = require('joi');

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

  /**
   * Get scan status
   */
  async getScanStatus(req, res) {
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
        message: 'Scan status retrieved successfully',
        data: {
          jobId: job.id,
          scanType: job.scanType,
          target: job.target,
          status: job.status,
          createdAt: job.createdAt,
          completedAt: job.completedAt,
          errorMessage: job.errorMessage
        }
      });

    } catch (error) {
      console.error('Error getting scan status:', error);
      
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
}

module.exports = new ScannerController();
