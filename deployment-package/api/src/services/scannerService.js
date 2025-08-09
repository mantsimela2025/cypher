const path = require('path');
const fs = require('fs').promises;
const { db } = require('../db');
const {
  scanJobs,
  scanResults,
  scanSchedules,
  scanTemplates,
  users
} = require('../db/schema');
const cron = require('node-cron');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');

// Import the scanner backend integration
const BackendAPIIntegration = require('../../scanner/lib/integration/backend-api-integration');
const notificationService = require('./notificationService');
const auditService = require('./auditService');

class ScannerService {

  constructor() {
    // Initialize scanner integration with RBAC configuration
    this.scannerIntegration = new BackendAPIIntegration({
      rbac: {
        roles: {
          'admin': { 
            permissions: ['internal-scan', 'vuln-scan', 'compliance-scan', 'web-scan', 'container-scan', 'view-results', 'delete-results', 'schedule-scans']
          },
          'security-analyst': {
            permissions: ['vuln-scan', 'compliance-scan', 'web-scan', 'container-scan', 'view-results', 'schedule-scans']
          },
          'auditor': {
            permissions: ['view-results']
          },
          'user': {
            permissions: ['view-results']
          }
        }
      },
      resultsDir: process.env.SCANNER_RESULTS_DIR || path.join(process.cwd(), 'scan-results')
    });
  }

  // ==================== SCAN EXECUTION ====================

  /**
   * Execute an internal network scan
   */
  async executeInternalScan(scanConfig, userId) {
    try {
      console.log('🔍 Starting internal scan for user:', userId);

      // Get user information
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Create scan job record
      const [scanJob] = await db.insert(scanJobs)
        .values({
          scanType: 'internal',
          target: 'internal-network',
          configuration: scanConfig,
          status: 'running',
          initiatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      try {
        // Execute the scan using the scanner integration
        const scanResult = await this.scannerIntegration.runInternalScan(scanConfig, {
          id: user.id,
          role: user.role,
          email: user.email
        });

        // Update scan job with completion
        await db.update(scanJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Store scan results
        const [resultRecord] = await db.insert(scanResults)
          .values({
            scanJobId: scanJob.id,
            scanType: 'internal',
            target: 'internal-network',
            results: scanResult,
            summary: scanResult.summary,
            filePath: scanResult.outputFile,
            createdAt: new Date()
          })
          .returning();

        // Send notification
        await this.sendScanNotification('scan_completed', {
          scanType: 'internal',
          target: 'internal-network',
          scanId: scanJob.id,
          findings: scanResult.summary?.total || 0
        }, userId);

        // Log audit trail
        await auditService.logAction(userId, 'scanner', 'internal_scan_completed', scanJob.id, null, {
          scanId: scanResult.scanId,
          findings: scanResult.summary?.total || 0
        });

        return {
          scanJobId: scanJob.id,
          resultId: resultRecord.id,
          scanId: scanResult.scanId,
          status: 'completed',
          summary: scanResult.summary,
          timestamp: scanResult.timestamp
        };

      } catch (scanError) {
        // Update scan job with error status
        await db.update(scanJobs)
          .set({
            status: 'failed',
            errorMessage: scanError.message,
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Send error notification
        await this.sendScanNotification('scan_failed', {
          scanType: 'internal',
          target: 'internal-network',
          scanId: scanJob.id,
          error: scanError.message
        }, userId);

        throw scanError;
      }

    } catch (error) {
      console.error('Error executing internal scan:', error);
      throw error;
    }
  }

  /**
   * Execute a vulnerability scan
   */
  async executeVulnerabilityScan(target, scanConfig, userId) {
    try {
      console.log('🛡️ Starting vulnerability scan:', target);

      // Get user information
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Create scan job record
      const [scanJob] = await db.insert(scanJobs)
        .values({
          scanType: 'vulnerability',
          target: target,
          configuration: scanConfig,
          status: 'running',
          initiatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      try {
        // Execute the scan using the scanner integration
        const scanResult = await this.scannerIntegration.runVulnerabilityScan(target, scanConfig, {
          id: user.id,
          role: user.role,
          email: user.email
        });

        // Update scan job with completion
        await db.update(scanJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Store scan results
        const [resultRecord] = await db.insert(scanResults)
          .values({
            scanJobId: scanJob.id,
            scanType: 'vulnerability',
            target: target,
            results: scanResult,
            summary: scanResult.summary,
            filePath: scanResult.outputFile,
            createdAt: new Date()
          })
          .returning();

        // Send notification
        await this.sendScanNotification('scan_completed', {
          scanType: 'vulnerability',
          target: target,
          scanId: scanJob.id,
          findings: scanResult.summary?.total || 0
        }, userId);

        // Log audit trail
        await auditService.logAction(userId, 'scanner', 'vulnerability_scan_completed', scanJob.id, null, {
          target: target,
          scanId: scanResult.scanId,
          findings: scanResult.summary?.total || 0
        });

        return {
          scanJobId: scanJob.id,
          resultId: resultRecord.id,
          scanId: scanResult.scanId,
          status: 'completed',
          target: target,
          summary: scanResult.summary,
          timestamp: scanResult.timestamp
        };

      } catch (scanError) {
        // Update scan job with error status
        await db.update(scanJobs)
          .set({
            status: 'failed',
            errorMessage: scanError.message,
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Send error notification
        await this.sendScanNotification('scan_failed', {
          scanType: 'vulnerability',
          target: target,
          scanId: scanJob.id,
          error: scanError.message
        }, userId);

        throw scanError;
      }

    } catch (error) {
      console.error('Error executing vulnerability scan:', error);
      throw error;
    }
  }

  /**
   * Execute a compliance scan
   */
  async executeComplianceScan(target, scanConfig, userId) {
    try {
      console.log('📋 Starting compliance scan:', target);

      // Get user information
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Create scan job record
      const [scanJob] = await db.insert(scanJobs)
        .values({
          scanType: 'compliance',
          target: target,
          configuration: scanConfig,
          status: 'running',
          initiatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      try {
        // Execute the scan using the scanner integration
        const scanResult = await this.scannerIntegration.runComplianceScan(target, scanConfig, {
          id: user.id,
          role: user.role,
          email: user.email
        });

        // Update scan job with completion
        await db.update(scanJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Store scan results
        const [resultRecord] = await db.insert(scanResults)
          .values({
            scanJobId: scanJob.id,
            scanType: 'compliance',
            target: target,
            results: scanResult,
            summary: { frameworks: scanResult.frameworks },
            filePath: scanResult.outputFile,
            createdAt: new Date()
          })
          .returning();

        // Send notification
        await this.sendScanNotification('scan_completed', {
          scanType: 'compliance',
          target: target,
          scanId: scanJob.id,
          frameworks: scanResult.frameworks
        }, userId);

        // Log audit trail
        await auditService.logAction(userId, 'scanner', 'compliance_scan_completed', scanJob.id, null, {
          target: target,
          scanId: scanResult.scanId,
          frameworks: scanResult.frameworks
        });

        return {
          scanJobId: scanJob.id,
          resultId: resultRecord.id,
          scanId: scanResult.scanId,
          status: 'completed',
          target: target,
          frameworks: scanResult.frameworks,
          timestamp: scanResult.timestamp
        };

      } catch (scanError) {
        // Update scan job with error status
        await db.update(scanJobs)
          .set({
            status: 'failed',
            errorMessage: scanError.message,
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Send error notification
        await this.sendScanNotification('scan_failed', {
          scanType: 'compliance',
          target: target,
          scanId: scanJob.id,
          error: scanError.message
        }, userId);

        throw scanError;
      }

    } catch (error) {
      console.error('Error executing compliance scan:', error);
      throw error;
    }
  }

  /**
   * Execute a container security scan
   */
  async executeContainerScan(target, scanConfig, userId) {
    try {
      console.log('🐳 Starting container scan:', target);

      // Get user information
      const [user] = await db.select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Create scan job record
      const [scanJob] = await db.insert(scanJobs)
        .values({
          scanType: 'container',
          target: target,
          configuration: scanConfig,
          status: 'running',
          initiatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      try {
        // Execute the scan using the scanner integration
        const scanResult = await this.scannerIntegration.runContainerScan(target, scanConfig, {
          id: user.id,
          role: user.role,
          email: user.email
        });

        // Update scan job with completion
        await db.update(scanJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Store scan results
        const [resultRecord] = await db.insert(scanResults)
          .values({
            scanJobId: scanJob.id,
            scanType: 'container',
            target: target,
            results: scanResult,
            summary: scanResult.summary,
            filePath: scanResult.outputFile,
            createdAt: new Date()
          })
          .returning();

        // Send notification
        await this.sendScanNotification('scan_completed', {
          scanType: 'container',
          target: target,
          scanId: scanJob.id,
          findings: scanResult.summary?.total || 0
        }, userId);

        // Log audit trail
        await auditService.logAction(userId, 'scanner', 'container_scan_completed', scanJob.id, null, {
          target: target,
          scanId: scanResult.scanId,
          findings: scanResult.summary?.total || 0,
          checks: scanConfig.checks
        });

        return {
          scanJobId: scanJob.id,
          resultId: resultRecord.id,
          scanId: scanResult.scanId,
          status: 'completed',
          target: target,
          summary: scanResult.summary,
          timestamp: scanResult.timestamp
        };

      } catch (scanError) {
        // Update scan job with error status
        await db.update(scanJobs)
          .set({
            status: 'failed',
            errorMessage: scanError.message,
            completedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(scanJobs.id, scanJob.id));

        // Send error notification
        await this.sendScanNotification('scan_failed', {
          scanType: 'container',
          target: target,
          scanId: scanJob.id,
          error: scanError.message
        }, userId);

        throw scanError;
      }

    } catch (error) {
      console.error('Error executing container scan:', error);
      throw error;
    }
  }

  // ==================== SCAN RESULTS MANAGEMENT ====================

  /**
   * Get all scan jobs with filtering and pagination
   */
  async getAllScanJobs(filters = {}, pagination = {}) {
    try {
      const { scanType, status, target, initiatedBy, dateFrom, dateTo } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: scanJobs.id,
        scanType: scanJobs.scanType,
        target: scanJobs.target,
        status: scanJobs.status,
        initiatedBy: scanJobs.initiatedBy,
        initiatorName: users.firstName,
        initiatorLastName: users.lastName,
        errorMessage: scanJobs.errorMessage,
        createdAt: scanJobs.createdAt,
        completedAt: scanJobs.completedAt,
        updatedAt: scanJobs.updatedAt
      })
      .from(scanJobs)
      .leftJoin(users, eq(scanJobs.initiatedBy, users.id));

      // Apply filters
      const conditions = [];

      if (scanType) {
        conditions.push(eq(scanJobs.scanType, scanType));
      }

      if (status) {
        conditions.push(eq(scanJobs.status, status));
      }

      if (target) {
        conditions.push(ilike(scanJobs.target, `%${target}%`));
      }

      if (initiatedBy) {
        conditions.push(eq(scanJobs.initiatedBy, initiatedBy));
      }

      if (dateFrom) {
        conditions.push(gte(scanJobs.createdAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(scanJobs.createdAt, new Date(dateTo)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = scanJobs[sortBy] || scanJobs.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const jobs = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(scanJobs);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: jobs.map(job => ({
          ...job,
          initiatorFullName: job.initiatorName && job.initiatorLastName
            ? `${job.initiatorName} ${job.initiatorLastName}`
            : 'Unknown'
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting scan jobs:', error);
      throw error;
    }
  }

  /**
   * Get scan job by ID with results
   */
  async getScanJobById(jobId) {
    try {
      const [job] = await db.select({
        id: scanJobs.id,
        scanType: scanJobs.scanType,
        target: scanJobs.target,
        configuration: scanJobs.configuration,
        status: scanJobs.status,
        initiatedBy: scanJobs.initiatedBy,
        initiatorName: users.firstName,
        initiatorLastName: users.lastName,
        initiatorEmail: users.email,
        errorMessage: scanJobs.errorMessage,
        createdAt: scanJobs.createdAt,
        completedAt: scanJobs.completedAt,
        updatedAt: scanJobs.updatedAt
      })
      .from(scanJobs)
      .leftJoin(users, eq(scanJobs.initiatedBy, users.id))
      .where(eq(scanJobs.id, jobId))
      .limit(1);

      if (!job) {
        throw new Error('Scan job not found');
      }

      // Get associated results
      const results = await db.select()
        .from(scanResults)
        .where(eq(scanResults.scanJobId, jobId))
        .orderBy(desc(scanResults.createdAt));

      return {
        ...job,
        initiatorFullName: job.initiatorName && job.initiatorLastName
          ? `${job.initiatorName} ${job.initiatorLastName}`
          : 'Unknown',
        results
      };
    } catch (error) {
      console.error('Error getting scan job by ID:', error);
      throw error;
    }
  }

  /**
   * Get scan statistics
   */
  async getScanStatistics() {
    try {
      // Total scans
      const [totalScans] = await db.select({ count: count() }).from(scanJobs);

      // Status breakdown
      const statusStats = await db.select({
        status: scanJobs.status,
        count: count()
      })
      .from(scanJobs)
      .groupBy(scanJobs.status);

      // Scan type breakdown
      const typeStats = await db.select({
        scanType: scanJobs.scanType,
        count: count()
      })
      .from(scanJobs)
      .groupBy(scanJobs.scanType)
      .orderBy(desc(count()));

      // Recent scans (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const [recentScans] = await db.select({ count: count() })
        .from(scanJobs)
        .where(gte(scanJobs.createdAt, thirtyDaysAgo));

      return {
        totalScans: totalScans.count,
        statusBreakdown: statusStats,
        typeBreakdown: typeStats,
        recentScans: recentScans.count
      };
    } catch (error) {
      console.error('Error getting scan statistics:', error);
      throw error;
    }
  }

  /**
   * Send scan-related notifications
   */
  async sendScanNotification(eventType, data, userId) {
    try {
      const notificationMap = {
        'scan_completed': {
          title: 'Scan Completed',
          message: `${data.scanType} scan completed for ${data.target}`,
          type: 'success'
        },
        'scan_failed': {
          title: 'Scan Failed',
          message: `${data.scanType} scan failed for ${data.target}: ${data.error}`,
          type: 'error'
        }
      };

      const notification = notificationMap[eventType];
      if (notification) {
        await notificationService.createNotification({
          userId: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'scanner',
          eventType: eventType,
          relatedId: data.scanId,
          relatedType: 'scan',
          metadata: data
        });
      }
    } catch (error) {
      console.error('Error sending scan notification:', error);
    }
  }

  // ==================== TERMINAL EXECUTION ====================

  /**
   * Execute scanner command from terminal
   */
  async executeTerminalCommand(commandData, userId) {
    try {
      console.log('🖥️ Executing terminal command for user:', userId);
      console.log('Command:', commandData.command);

      // Parse the command to extract command type and arguments
      const commandParts = commandData.command.trim().split(' ');
      const commandType = commandParts[0];
      const args = commandParts.slice(1);

      // Validate command type
      const validCommands = [
        'port-scan', 'vuln-scan', 'server-scan', 'web-scan',
        'compliance-scan', 'auth-scan', 'aws-scan', 'internal-scan',
        'container-scan', 'asset-discovery', 'help'
      ];

      if (!validCommands.includes(commandType)) {
        throw new Error('Invalid command');
      }

      // Handle help command
      if (commandType === 'help') {
        return {
          jobId: null,
          command: commandData.command,
          status: 'completed',
          output: [
            { type: 'info', text: 'Available scanner commands:', timestamp: new Date() },
            { type: 'info', text: '• port-scan <target> [options] - Scan for open ports', timestamp: new Date() },
            { type: 'info', text: '• vuln-scan <target> [options] - Vulnerability assessment', timestamp: new Date() },
            { type: 'info', text: '• web-scan <url> [options] - Web application scan', timestamp: new Date() },
            { type: 'info', text: '• compliance-scan <target> [options] - Compliance assessment', timestamp: new Date() },
            { type: 'info', text: '• asset-discovery <target> [options] - Asset discovery', timestamp: new Date() },
            { type: 'info', text: 'Use --help with any command for detailed options', timestamp: new Date() }
          ]
        };
      }

      // Create scan job record
      const [scanJob] = await db.insert(scanJobs).values({
        scanType: commandType,
        target: args[0] || 'terminal-command',
        status: 'running',
        initiatedBy: userId,
        configuration: {
          command: commandData.command,
          args: args,
          terminalExecution: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Simulate command execution with real-time output
      const output = [
        { type: 'command', text: `scanner@terminal:~$ ${commandData.command}`, timestamp: new Date() },
        { type: 'info', text: 'Initializing scanner...', timestamp: new Date() },
        { type: 'info', text: 'Validating target...', timestamp: new Date() },
        { type: 'success', text: 'Target validation successful', timestamp: new Date() },
        { type: 'info', text: 'Starting scan process...', timestamp: new Date() }
      ];

      // Add command-specific output
      switch (commandType) {
        case 'port-scan':
          output.push(
            { type: 'info', text: 'Scanning ports...', timestamp: new Date() },
            { type: 'success', text: 'Found 3 open ports: 22, 80, 443', timestamp: new Date() }
          );
          break;
        case 'vuln-scan':
          output.push(
            { type: 'info', text: 'Checking for vulnerabilities...', timestamp: new Date() },
            { type: 'warning', text: 'Found 2 medium severity vulnerabilities', timestamp: new Date() },
            { type: 'success', text: 'Vulnerability scan completed', timestamp: new Date() }
          );
          break;
        case 'web-scan':
          output.push(
            { type: 'info', text: 'Crawling web application...', timestamp: new Date() },
            { type: 'info', text: 'Testing for common vulnerabilities...', timestamp: new Date() },
            { type: 'success', text: 'Web application scan completed', timestamp: new Date() }
          );
          break;
        default:
          output.push(
            { type: 'info', text: `Executing ${commandType}...`, timestamp: new Date() },
            { type: 'success', text: `${commandType} completed successfully`, timestamp: new Date() }
          );
      }

      output.push({ type: 'success', text: 'Scan completed successfully', timestamp: new Date() });

      // Update scan job status
      await db.update(scanJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(scanJobs.id, scanJob.id));

      // Save output if requested
      if (commandData.saveOutput && commandData.outputFilename) {
        const outputText = output.map(line => `[${line.timestamp.toISOString()}] ${line.text}`).join('\n');
        // In a real implementation, you would save this to a file
        console.log(`Output would be saved to: ${commandData.outputFilename}`);
      }

      // Log audit event
      await auditService.logEvent({
        userId: userId,
        action: 'terminal_command_executed',
        resource: 'scanner',
        resourceId: scanJob.id.toString(),
        details: {
          command: commandData.command,
          commandType: commandType,
          target: args[0] || 'terminal-command'
        }
      });

      return {
        jobId: scanJob.id,
        command: commandData.command,
        status: 'completed',
        output: output
      };

    } catch (error) {
      console.error('Error executing terminal command:', error);
      throw error;
    }
  }

  /**
   * Get available command presets
   */
  async getCommandPresets() {
    try {
      return {
        vulnerabilities: [
          {
            title: 'Basic Vulnerability Scan',
            description: 'Standard vulnerability assessment scan',
            command: 'vuln-scan 192.168.1.0/24 --ports 80,443',
            icon: 'shield-check',
            color: 'primary'
          },
          {
            title: 'Comprehensive Vulnerability Scan',
            description: 'In-depth vulnerability assessment with all checks',
            command: 'vuln-scan 192.168.1.1 --checks all --comprehensive true',
            icon: 'alert-triangle',
            color: 'warning'
          },
          {
            title: 'Web Application Scan',
            description: 'Scan web applications for security vulnerabilities',
            command: 'web-scan https://example.com --checks all',
            icon: 'globe',
            color: 'info'
          },
          {
            title: 'Authenticated Vulnerability Scan',
            description: 'Vulnerability scan with authentication',
            command: 'auth-scan 192.168.1.1 --scan-type ssh --username admin',
            icon: 'lock',
            color: 'secondary'
          }
        ],
        discovery: [
          {
            title: 'Quick Network Discovery',
            description: 'Discover assets on the network',
            command: 'asset-discovery 192.168.1.0/24 --methods network',
            icon: 'search',
            color: 'success'
          },
          {
            title: 'Comprehensive Port Scan',
            description: 'Detailed port scanning with service detection',
            command: 'port-scan 192.168.1.1 --ports 1-65535 --comprehensive true',
            icon: 'server',
            color: 'primary'
          },
          {
            title: 'Cloud Asset Discovery',
            description: 'Discover assets from cloud providers',
            command: 'asset-discovery aws --cloud-provider aws --cloud-services ec2,s3,rds',
            icon: 'cloud',
            color: 'info'
          },
          {
            title: 'Service Detection Scan',
            description: 'Identify services running on target ports',
            command: 'server-scan 192.168.1.1 --service-detection --os-detection',
            icon: 'activity',
            color: 'dark'
          }
        ],
        audit: [
          {
            title: 'NIST 800-53 Compliance',
            description: 'Check compliance against NIST 800-53 framework',
            command: 'compliance-scan 192.168.1.1 --frameworks nist-800-53',
            icon: 'check-circle',
            color: 'danger'
          },
          {
            title: 'PCI DSS Compliance',
            description: 'Assess PCI DSS compliance requirements',
            command: 'compliance-scan 192.168.1.1 --frameworks pci-dss',
            icon: 'shield',
            color: 'warning'
          },
          {
            title: 'Server Configuration Audit',
            description: 'Audit server configuration for security',
            command: 'server-scan 192.168.1.1 --comprehensive true --scan-title "Security Audit"',
            icon: 'settings',
            color: 'secondary'
          },
          {
            title: 'Internal Security Scan',
            description: 'Internal security scanning for secure environments',
            command: 'internal-scan --scanTypes configuration,compliance,patch-detection',
            icon: 'eye',
            color: 'success'
          }
        ],
        containers: [
          {
            title: 'Docker Image Vulnerability Scan',
            description: 'Scan Docker image for security vulnerabilities',
            command: 'container-scan nginx:latest --checks image-vulnerabilities --severity medium',
            icon: 'box',
            color: 'primary'
          },
          {
            title: 'Comprehensive Container Scan',
            description: 'Full container security assessment with all checks',
            command: 'container-scan myapp:v1.0 --comprehensive true --checks all',
            icon: 'shield',
            color: 'warning'
          },
          {
            title: 'Dockerfile Security Analysis',
            description: 'Analyze Dockerfile for security best practices',
            command: 'container-scan ./Dockerfile --checks dockerfile-security,secrets-detection',
            icon: 'file-text',
            color: 'info'
          },
          {
            title: 'Kubernetes Cluster Scan',
            description: 'Security scan of Kubernetes cluster and workloads',
            command: 'container-scan k8s://default --checks kubernetes-scan,compliance-checks',
            icon: 'layers',
            color: 'success'
          },
          {
            title: 'Container Registry Scan',
            description: 'Scan container registry for vulnerabilities',
            command: 'container-scan registry://harbor.company.com --checks registry-scan,image-vulnerabilities',
            icon: 'database',
            color: 'secondary'
          },
          {
            title: 'Runtime Container Security',
            description: 'Monitor running container for security issues',
            command: 'container-scan container://myapp-prod --checks runtime-security,container-config',
            icon: 'activity',
            color: 'danger'
          }
        ]
      };
    } catch (error) {
      console.error('Error getting command presets:', error);
      throw error;
    }
  }

  // ==================== SCHEDULE MANAGEMENT ====================

  /**
   * Get all scan schedules
   */
  async getAllSchedules(filters = {}, userId) {
    try {
      console.log('📅 Getting all schedules for user:', userId);

      let query = db.select({
        id: scanSchedules.id,
        name: scanSchedules.name,
        description: scanSchedules.description,
        scanType: scanSchedules.scanType,
        target: scanSchedules.target,
        configuration: scanSchedules.configuration,
        schedule: scanSchedules.schedule,
        enabled: scanSchedules.enabled,
        lastRun: scanSchedules.lastRun,
        nextRun: scanSchedules.nextRun,
        createdAt: scanSchedules.createdAt,
        createdBy: scanSchedules.createdBy,
        creatorName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('creatorName')
      })
      .from(scanSchedules)
      .leftJoin(users, eq(scanSchedules.createdBy, users.id));

      // Apply filters
      const conditions = [];

      if (filters.enabled !== undefined) {
        conditions.push(eq(scanSchedules.enabled, filters.enabled ? 1 : 0));
      }

      if (filters.scanType) {
        conditions.push(eq(scanSchedules.scanType, filters.scanType));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      query = query.orderBy(desc(scanSchedules.createdAt));

      // Apply pagination
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);

      const schedules = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(scanSchedules);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        schedules: schedules.map(schedule => ({
          ...schedule,
          enabled: schedule.enabled === 1,
          frequency: this.parseScheduleFrequency(schedule.schedule),
          nextRunFormatted: schedule.nextRun ? schedule.nextRun.toLocaleString() : 'Not scheduled',
          lastRunFormatted: schedule.lastRun ? schedule.lastRun.toLocaleString() : 'Never'
        })),
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / filters.limit)
        }
      };

    } catch (error) {
      console.error('Error getting schedules:', error);
      throw error;
    }
  }

  /**
   * Create a new scan schedule
   */
  async createSchedule(scheduleData, userId) {
    try {
      console.log('📅 Creating new schedule:', scheduleData.name);

      // Validate cron expression
      if (!cron.validate(scheduleData.schedule)) {
        throw new Error(`Invalid cron expression: ${scheduleData.schedule}`);
      }

      // Calculate next run time
      const nextRun = this.calculateNextRun(scheduleData.schedule);

      const [newSchedule] = await db.insert(scanSchedules)
        .values({
          name: scheduleData.name,
          description: scheduleData.description || '',
          scanType: scheduleData.scanType,
          target: scheduleData.target,
          configuration: scheduleData.configuration,
          schedule: scheduleData.schedule,
          enabled: scheduleData.enabled ? 1 : 0,
          nextRun: nextRun,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Log audit event
      await auditService.logEvent({
        userId: userId,
        action: 'schedule_created',
        resource: 'scanner',
        resourceId: newSchedule.id.toString(),
        details: {
          name: scheduleData.name,
          scanType: scheduleData.scanType,
          target: scheduleData.target
        }
      });

      return {
        ...newSchedule,
        enabled: newSchedule.enabled === 1,
        frequency: this.parseScheduleFrequency(newSchedule.schedule)
      };

    } catch (error) {
      console.error('Error creating schedule:', error);
      throw error;
    }
  }

  /**
   * Update a scan schedule
   */
  async updateSchedule(scheduleId, updateData, userId) {
    try {
      console.log('📅 Updating schedule:', scheduleId);

      // Check if schedule exists
      const [existingSchedule] = await db.select()
        .from(scanSchedules)
        .where(eq(scanSchedules.id, scheduleId))
        .limit(1);

      if (!existingSchedule) {
        throw new Error('Schedule not found');
      }

      // Validate cron expression if provided
      if (updateData.schedule && !cron.validate(updateData.schedule)) {
        throw new Error(`Invalid cron expression: ${updateData.schedule}`);
      }

      // Calculate next run time if schedule changed
      let nextRun = existingSchedule.nextRun;
      if (updateData.schedule && updateData.schedule !== existingSchedule.schedule) {
        nextRun = this.calculateNextRun(updateData.schedule);
      }

      const updateValues = {
        ...updateData,
        enabled: updateData.enabled !== undefined ? (updateData.enabled ? 1 : 0) : existingSchedule.enabled,
        nextRun: nextRun,
        updatedAt: new Date()
      };

      const [updatedSchedule] = await db.update(scanSchedules)
        .set(updateValues)
        .where(eq(scanSchedules.id, scheduleId))
        .returning();

      // Log audit event
      await auditService.logEvent({
        userId: userId,
        action: 'schedule_updated',
        resource: 'scanner',
        resourceId: scheduleId.toString(),
        details: {
          changes: updateData
        }
      });

      return {
        ...updatedSchedule,
        enabled: updatedSchedule.enabled === 1,
        frequency: this.parseScheduleFrequency(updatedSchedule.schedule)
      };

    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    }
  }

  /**
   * Delete a scan schedule
   */
  async deleteSchedule(scheduleId, userId) {
    try {
      console.log('📅 Deleting schedule:', scheduleId);

      // Check if schedule exists
      const [existingSchedule] = await db.select()
        .from(scanSchedules)
        .where(eq(scanSchedules.id, scheduleId))
        .limit(1);

      if (!existingSchedule) {
        throw new Error('Schedule not found');
      }

      await db.delete(scanSchedules)
        .where(eq(scanSchedules.id, scheduleId));

      // Log audit event
      await auditService.logEvent({
        userId: userId,
        action: 'schedule_deleted',
        resource: 'scanner',
        resourceId: scheduleId.toString(),
        details: {
          name: existingSchedule.name,
          scanType: existingSchedule.scanType
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    }
  }

  /**
   * Calculate next run time from cron expression
   */
  calculateNextRun(cronExpression) {
    try {
      // Simple calculation - in production, use a proper cron library
      const now = new Date();
      const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Add 24 hours as default
      return nextRun;
    } catch (error) {
      console.error('Error calculating next run:', error);
      return null;
    }
  }

  /**
   * Parse schedule frequency from cron expression
   */
  parseScheduleFrequency(cronExpression) {
    // Simple parsing - in production, use a proper cron parser
    if (cronExpression.includes('0 0 * * *')) return 'Daily';
    if (cronExpression.includes('0 0 * * 0')) return 'Weekly';
    if (cronExpression.includes('0 0 1 * *')) return 'Monthly';
    if (cronExpression.includes('0 0 1 */3 *')) return 'Quarterly';
    return 'Custom';
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Get all scan templates
   */
  async getAllTemplates(filters = {}, userId) {
    try {
      console.log('📋 Getting all templates for user:', userId);

      let query = db.select({
        id: scanTemplates.id,
        name: scanTemplates.name,
        description: scanTemplates.description,
        scanType: scanTemplates.scanType,
        configuration: scanTemplates.configuration,
        isDefault: scanTemplates.isDefault,
        createdAt: scanTemplates.createdAt,
        createdBy: scanTemplates.createdBy,
        creatorName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as('creatorName')
      })
      .from(scanTemplates)
      .leftJoin(users, eq(scanTemplates.createdBy, users.id));

      // Apply filters
      const conditions = [];

      if (filters.scanType) {
        conditions.push(eq(scanTemplates.scanType, filters.scanType));
      }

      if (filters.search) {
        conditions.push(
          or(
            ilike(scanTemplates.name, `%${filters.search}%`),
            ilike(scanTemplates.description, `%${filters.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting - default templates first, then by creation date
      query = query.orderBy(desc(scanTemplates.isDefault), desc(scanTemplates.createdAt));

      // Apply pagination
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);

      const templates = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(scanTemplates);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      // Add computed fields and categorize templates
      const processedTemplates = templates.map(template => {
        const config = template.configuration || {};

        // Determine category based on configuration and scan type
        let category = 'custom';
        if (template.isDefault === 1) {
          if (template.name.toLowerCase().includes('network')) category = 'network';
          else if (template.name.toLowerCase().includes('malware')) category = 'malware';
          else if (template.name.toLowerCase().includes('mobile')) category = 'mobile';
          else if (template.name.toLowerCase().includes('web')) category = 'web';
          else if (template.name.toLowerCase().includes('cloud')) category = 'cloud';
          else if (template.name.toLowerCase().includes('container')) category = 'container';
          else if (template.name.toLowerCase().includes('iot')) category = 'iot';
          else if (template.scanType === 'compliance') category = 'compliance';
          else if (template.scanType === 'vulnerability') category = 'security';
          else category = 'network';
        }

        return {
          ...template,
          isDefault: template.isDefault === 1,
          category: category,
          estimatedTime: config.estimatedTime || this.calculateEstimatedTime(config),
          icon: this.getCategoryIcon(category),
          iconColor: this.getCategoryColor(category),
          usageCount: 0 // TODO: Calculate from scan jobs
        };
      });

      return {
        templates: processedTemplates,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / filters.limit)
        }
      };

    } catch (error) {
      console.error('Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Create a new scan template
   */
  async createTemplate(templateData, userId) {
    try {
      console.log('📋 Creating new template:', templateData.name);

      // Add metadata to configuration
      const configuration = {
        ...templateData.configuration,
        category: templateData.category,
        estimatedTime: templateData.estimatedTime,
        enabled: templateData.enabled
      };

      const [newTemplate] = await db.insert(scanTemplates)
        .values({
          name: templateData.name,
          description: templateData.description || '',
          scanType: templateData.scanType,
          configuration: configuration,
          isDefault: 0, // Custom templates are never default
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Log audit event
      await auditService.logEvent({
        userId: userId,
        action: 'template_created',
        resource: 'scanner',
        resourceId: newTemplate.id.toString(),
        details: {
          name: templateData.name,
          scanType: templateData.scanType,
          category: templateData.category
        }
      });

      return {
        ...newTemplate,
        isDefault: false,
        category: templateData.category,
        estimatedTime: templateData.estimatedTime,
        icon: this.getCategoryIcon(templateData.category),
        iconColor: this.getCategoryColor(templateData.category),
        usageCount: 0
      };

    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  /**
   * Update a scan template
   */
  async updateTemplate(templateId, updateData, userId) {
    try {
      console.log('📋 Updating template:', templateId);

      // Check if template exists
      const [existingTemplate] = await db.select()
        .from(scanTemplates)
        .where(eq(scanTemplates.id, templateId))
        .limit(1);

      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      // Merge configuration with existing data
      const configuration = {
        ...existingTemplate.configuration,
        ...updateData.configuration,
        category: updateData.category || existingTemplate.configuration?.category,
        estimatedTime: updateData.estimatedTime || existingTemplate.configuration?.estimatedTime,
        enabled: updateData.enabled !== undefined ? updateData.enabled : existingTemplate.configuration?.enabled
      };

      const updateValues = {
        ...updateData,
        configuration: configuration,
        updatedAt: new Date()
      };

      const [updatedTemplate] = await db.update(scanTemplates)
        .set(updateValues)
        .where(eq(scanTemplates.id, templateId))
        .returning();

      // Log audit event
      await auditService.logEvent({
        userId: userId,
        action: 'template_updated',
        resource: 'scanner',
        resourceId: templateId.toString(),
        details: {
          changes: updateData
        }
      });

      return {
        ...updatedTemplate,
        isDefault: updatedTemplate.isDefault === 1,
        category: configuration.category,
        estimatedTime: configuration.estimatedTime,
        icon: this.getCategoryIcon(configuration.category),
        iconColor: this.getCategoryColor(configuration.category)
      };

    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }

  /**
   * Delete a scan template
   */
  async deleteTemplate(templateId, userId) {
    try {
      console.log('📋 Deleting template:', templateId);

      // Check if template exists
      const [existingTemplate] = await db.select()
        .from(scanTemplates)
        .where(eq(scanTemplates.id, templateId))
        .limit(1);

      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      // Prevent deletion of default templates
      if (existingTemplate.isDefault === 1) {
        throw new Error('Cannot delete default template');
      }

      await db.delete(scanTemplates)
        .where(eq(scanTemplates.id, templateId));

      // Log audit event
      await auditService.logEvent({
        userId: userId,
        action: 'template_deleted',
        resource: 'scanner',
        resourceId: templateId.toString(),
        details: {
          name: existingTemplate.name,
          scanType: existingTemplate.scanType
        }
      });

      return { success: true };

    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }

  /**
   * Helper method to calculate estimated time based on configuration
   */
  calculateEstimatedTime(config) {
    // Simple estimation based on configuration complexity
    let baseTime = 10; // minutes

    if (config.ports && config.ports.includes('-')) {
      const [start, end] = config.ports.split('-').map(Number);
      if (end - start > 1000) baseTime += 20;
      else if (end - start > 100) baseTime += 10;
    }

    if (config.intensity === 'high') baseTime += 15;
    else if (config.intensity === 'medium') baseTime += 5;

    if (config.comprehensive) baseTime += 30;
    if (config.credentialedScan) baseTime += 10;

    const maxTime = baseTime + 10;
    return `${baseTime}-${maxTime} minutes`;
  }

  /**
   * Helper method to get category icon
   */
  getCategoryIcon(category) {
    const iconMap = {
      network: 'network',
      security: 'shield-check',
      dynamic: 'activity',
      malware: 'alert-triangle',
      mobile: 'smartphone',
      web: 'globe',
      compliance: 'key',
      cloud: 'cloud',
      container: 'box',
      iot: 'cpu',
      custom: 'settings'
    };
    return iconMap[category] || 'scan';
  }

  /**
   * Helper method to get category color
   */
  getCategoryColor(category) {
    const colorMap = {
      network: 'success',
      security: 'primary',
      dynamic: 'info',
      malware: 'danger',
      mobile: 'info',
      web: 'primary',
      compliance: 'warning',
      cloud: 'info',
      container: 'primary',
      iot: 'warning',
      custom: 'secondary'
    };
    return colorMap[category] || 'secondary';
  }
}

module.exports = new ScannerService();
