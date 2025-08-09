const express = require('express');
const scannerController = require('../controllers/scannerController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== SCAN EXECUTION ROUTES ====================

/**
 * @swagger
 * /api/v1/scanner/internal-scan:
 *   post:
 *     summary: Execute an internal network scan
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               networkRange:
 *                 type: string
 *                 default: auto
 *                 description: Network range to scan (auto-detect if not specified)
 *               scanType:
 *                 type: string
 *                 enum: [quick, comprehensive, stealth]
 *                 default: quick
 *                 description: Type of scan to perform
 *               ports:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 65535
 *                 description: Specific ports to scan
 *               excludeHosts:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Hosts to exclude from scan
 *               timeout:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 3600
 *                 default: 300
 *                 description: Scan timeout in seconds
 *               maxConcurrency:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *                 description: Maximum concurrent connections
 *               enableServiceDetection:
 *                 type: boolean
 *                 default: true
 *                 description: Enable service detection
 *               enableOSDetection:
 *                 type: boolean
 *                 default: false
 *                 description: Enable OS detection
 *               customOptions:
 *                 type: object
 *                 description: Additional custom scan options
 *     responses:
 *       201:
 *         description: Internal scan initiated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/internal-scan', 
  requirePermission('scanner', 'internal-scan'),
  scannerController.executeInternalScan
);

/**
 * @swagger
 * /api/v1/scanner/vulnerability-scan:
 *   post:
 *     summary: Execute a vulnerability scan
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *             properties:
 *               target:
 *                 type: string
 *                 description: Target host or IP address to scan
 *               scanType:
 *                 type: string
 *                 enum: [basic, full, web, database]
 *                 default: basic
 *                 description: Type of vulnerability scan
 *               ports:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 1
 *                   maximum: 65535
 *                 description: Specific ports to scan
 *               credentials:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   password:
 *                     type: string
 *                   keyFile:
 *                     type: string
 *                 description: Authentication credentials for authenticated scans
 *               excludeCVEs:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: CVE IDs to exclude from scan
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *                 description: Minimum severity level to report
 *               timeout:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7200
 *                 default: 1800
 *                 description: Scan timeout in seconds
 *               customOptions:
 *                 type: object
 *                 description: Additional custom scan options
 *     responses:
 *       201:
 *         description: Vulnerability scan initiated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/vulnerability-scan', 
  requirePermission('scanner', 'vuln-scan'),
  scannerController.executeVulnerabilityScan
);

/**
 * @swagger
 * /api/v1/scanner/compliance-scan:
 *   post:
 *     summary: Execute a compliance scan
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *               - frameworks
 *             properties:
 *               target:
 *                 type: string
 *                 description: Target host or IP address to scan
 *               frameworks:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [nist, cis, pci, sox, fisma, fedramp]
 *                 minItems: 1
 *                 description: Compliance frameworks to check against
 *               scanType:
 *                 type: string
 *                 enum: [configuration, policy, full]
 *                 default: configuration
 *                 description: Type of compliance scan
 *               credentials:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   password:
 *                     type: string
 *                   keyFile:
 *                     type: string
 *                 description: Authentication credentials for authenticated scans
 *               customPolicies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Custom policy files to include
 *               timeout:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 7200
 *                 default: 1800
 *                 description: Scan timeout in seconds
 *               customOptions:
 *                 type: object
 *                 description: Additional custom scan options
 *     responses:
 *       201:
 *         description: Compliance scan initiated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/compliance-scan', 
  requirePermission('scanner', 'compliance-scan'),
  scannerController.executeComplianceScan
);

/**
 * @swagger
 * /api/v1/scanner/container-scan:
 *   post:
 *     summary: Execute a container security scan
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - target
 *             properties:
 *               target:
 *                 type: string
 *                 description: Container image, registry, or Kubernetes cluster to scan
 *               checks:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [image-vulnerabilities, dockerfile-security, container-config, runtime-security, secrets-detection, compliance-checks, registry-scan, kubernetes-scan]
 *                 description: Specific checks to run
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *                 description: Minimum severity level to report
 *               comprehensive:
 *                 type: boolean
 *                 default: false
 *                 description: Run comprehensive scan with all checks
 *               timeout:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 3600
 *                 default: 300
 *                 description: Scan timeout in seconds
 *               customOptions:
 *                 type: object
 *                 description: Additional custom scan options
 *     responses:
 *       201:
 *         description: Container scan initiated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.post('/container-scan',
  requirePermission('scanner', 'container-scan'),
  scannerController.executeContainerScan
);

// ==================== SCAN RESULTS MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/scanner/jobs:
 *   get:
 *     summary: Get all scan jobs with filtering and pagination
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: scanType
 *         schema:
 *           type: string
 *           enum: [internal, vulnerability, compliance, web]
 *         description: Filter by scan type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, running, completed, failed, cancelled]
 *         description: Filter by scan status
 *       - in: query
 *         name: target
 *         schema:
 *           type: string
 *         description: Filter by target (partial match)
 *       - in: query
 *         name: initiatedBy
 *         schema:
 *           type: integer
 *         description: Filter by user who initiated the scan
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date from
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date to
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, completedAt, scanType, status, target]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Scan jobs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/jobs', 
  requirePermission('scanner', 'view-results'),
  scannerController.getAllScanJobs
);

/**
 * @swagger
 * /api/v1/scanner/jobs/{jobId}:
 *   get:
 *     summary: Get scan job by ID with results
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scan job ID
 *     responses:
 *       200:
 *         description: Scan job retrieved successfully
 *       404:
 *         description: Scan job not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/jobs/:jobId', 
  requirePermission('scanner', 'view-results'),
  scannerController.getScanJobById
);

/**
 * @swagger
 * /api/v1/scanner/statistics:
 *   get:
 *     summary: Get scan statistics and analytics
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scan statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalScans:
 *                       type: integer
 *                     statusBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     typeBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           scanType:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     recentScans:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/statistics',
  requirePermission('scanner', 'view-results'),
  scannerController.getScanStatistics
);

// ==================== TERMINAL EXECUTION ROUTES ====================

/**
 * @swagger
 * /api/v1/scanner/terminal/execute:
 *   post:
 *     summary: Execute scanner command from terminal
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - command
 *             properties:
 *               command:
 *                 type: string
 *                 description: Scanner command to execute
 *               saveOutput:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to save output to file
 *               outputFilename:
 *                 type: string
 *                 description: Filename for saved output
 *     responses:
 *       200:
 *         description: Command executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: integer
 *                     command:
 *                       type: string
 *                     status:
 *                       type: string
 *                     output:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           text:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *       400:
 *         description: Invalid command
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/terminal/execute',
  requirePermission('scanner', 'terminal-execute'),
  scannerController.executeTerminalCommand
);

/**
 * @swagger
 * /api/v1/scanner/terminal/presets:
 *   get:
 *     summary: Get available command presets
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Command presets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     vulnerabilities:
 *                       type: array
 *                       items:
 *                         type: object
 *                     discovery:
 *                       type: array
 *                       items:
 *                         type: object
 *                     audit:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/terminal/presets',
  requirePermission('scanner', 'view-presets'),
  scannerController.getCommandPresets
);

// ==================== SCHEDULE MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/scanner/schedules:
 *   get:
 *     summary: Get all scan schedules
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *         description: Filter by enabled status
 *       - in: query
 *         name: scanType
 *         schema:
 *           type: string
 *         description: Filter by scan type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Schedules retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/schedules',
  requirePermission('scanner', 'view-schedules'),
  scannerController.getAllSchedules
);

/**
 * @swagger
 * /api/v1/scanner/schedules:
 *   post:
 *     summary: Create a new scan schedule
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scanType
 *               - target
 *               - schedule
 *             properties:
 *               name:
 *                 type: string
 *                 description: Schedule name
 *               description:
 *                 type: string
 *                 description: Schedule description
 *               scanType:
 *                 type: string
 *                 enum: [internal, vulnerability, compliance, web]
 *                 description: Type of scan to schedule
 *               target:
 *                 type: string
 *                 description: Target for the scan
 *               configuration:
 *                 type: object
 *                 description: Scan configuration
 *               schedule:
 *                 type: string
 *                 description: Cron expression for schedule
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: Whether schedule is enabled
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/schedules',
  requirePermission('scanner', 'create-schedules'),
  scannerController.createSchedule
);

/**
 * @swagger
 * /api/v1/scanner/schedules/{scheduleId}:
 *   put:
 *     summary: Update a scan schedule
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               scanType:
 *                 type: string
 *                 enum: [internal, vulnerability, compliance, web]
 *               target:
 *                 type: string
 *               configuration:
 *                 type: object
 *               schedule:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Schedule not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/schedules/:scheduleId',
  requirePermission('scanner', 'edit-schedules'),
  scannerController.updateSchedule
);

/**
 * @swagger
 * /api/v1/scanner/schedules/{scheduleId}:
 *   delete:
 *     summary: Delete a scan schedule
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       404:
 *         description: Schedule not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/schedules/:scheduleId',
  requirePermission('scanner', 'delete-schedules'),
  scannerController.deleteSchedule
);

// ==================== TEMPLATE MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/scanner/templates:
 *   get:
 *     summary: Get all scan templates
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by template category
 *       - in: query
 *         name: scanType
 *         schema:
 *           type: string
 *           enum: [internal, vulnerability, compliance, web]
 *         description: Filter by scan type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search templates by name or description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/templates',
  requirePermission('scanner', 'view-templates'),
  scannerController.getAllTemplates
);

/**
 * @swagger
 * /api/v1/scanner/templates:
 *   post:
 *     summary: Create a new scan template
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - scanType
 *               - configuration
 *             properties:
 *               name:
 *                 type: string
 *                 description: Template name
 *               description:
 *                 type: string
 *                 description: Template description
 *               scanType:
 *                 type: string
 *                 enum: [internal, vulnerability, compliance, web]
 *                 description: Type of scan template
 *               configuration:
 *                 type: object
 *                 description: Template configuration
 *               category:
 *                 type: string
 *                 description: Template category
 *               estimatedTime:
 *                 type: string
 *                 description: Estimated execution time
 *               enabled:
 *                 type: boolean
 *                 default: true
 *                 description: Whether template is enabled
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/templates',
  requirePermission('scanner', 'create-templates'),
  scannerController.createTemplate
);

/**
 * @swagger
 * /api/v1/scanner/templates/{templateId}:
 *   put:
 *     summary: Update a scan template
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               scanType:
 *                 type: string
 *                 enum: [internal, vulnerability, compliance, web]
 *               configuration:
 *                 type: object
 *               category:
 *                 type: string
 *               estimatedTime:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/templates/:templateId',
  requirePermission('scanner', 'edit-templates'),
  scannerController.updateTemplate
);

/**
 * @swagger
 * /api/v1/scanner/templates/{templateId}:
 *   delete:
 *     summary: Delete a scan template
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/templates/:templateId',
  requirePermission('scanner', 'delete-templates'),
  scannerController.deleteTemplate
);

// ==================== SCAN STATUS MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/scanner/jobs/{jobId}/cancel:
 *   post:
 *     summary: Cancel a running scan
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scan job ID
 *     responses:
 *       200:
 *         description: Scan cancellation requested
 *       400:
 *         description: Cannot cancel scan (not running or pending)
 *       404:
 *         description: Scan job not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/jobs/:jobId/cancel',
  requirePermission('scanner', 'admin'),
  scannerController.cancelScan
);

/**
 * @swagger
 * /api/v1/scanner/jobs/{jobId}/status:
 *   get:
 *     summary: Get scan status
 *     tags: [Scanner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Scan job ID
 *     responses:
 *       200:
 *         description: Scan status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: integer
 *                     scanType:
 *                       type: string
 *                     target:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, running, completed, failed, cancelled]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                     errorMessage:
 *                       type: string
 *       404:
 *         description: Scan job not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/jobs/:jobId/status',
  requirePermission('scanner', 'view-results'),
  scannerController.getScanStatus
);

module.exports = router;
