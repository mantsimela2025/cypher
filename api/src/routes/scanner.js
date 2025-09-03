const express = require('express');
const scannerController = require('../controllers/scannerController');
const { requireAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validate controller import
if (!scannerController || typeof scannerController !== 'object') {
  throw new Error('Scanner controller not properly imported');
}

const router = express.Router();

/**
 * Security Scanner API Routes
 * Comprehensive vulnerability scanning and security assessment endpoints
 */

// Validation rules
const startScanValidation = [
  body('targets').isArray({ min: 1 }).withMessage('Targets must be a non-empty array'),
  body('targets.*').notEmpty().withMessage('Each target must be a valid string'),
  body('name').optional().isString().isLength({ min: 1, max: 255 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('modules').optional().isArray(),
  body('modules.*').optional().isIn(['network', 'web', 'ssl', 'compliance', 'configuration', 'aws', 'azure', 'gcp', 'cloud', 'container', 'docker', 'k8s', 'openshift', 'snmp', 'wmi', 'ssh', 'smb', 'vulnerability', 'vuln', 'government']),
  body('ports').optional().isArray(),
  body('ports.*').optional().isInt({ min: 1, max: 65535 })
];

const scanIdValidation = [
  param('scanId').notEmpty().withMessage('Scan ID is required')
];

const scanHistoryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
  query('status').optional().isIn(['queued', 'running', 'completed', 'failed', 'stopped'])
];

const exportValidation = [
  param('scanId').notEmpty().withMessage('Scan ID is required'),
  query('format').optional().isIn(['json', 'csv']).withMessage('Format must be json or csv')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     ScanRequest:
 *       type: object
 *       required:
 *         - targets
 *       properties:
 *         name:
 *           type: string
 *           description: Name for the scan
 *           example: "Production Network Scan"
 *         description:
 *           type: string
 *           description: Description of the scan
 *           example: "Comprehensive security assessment of production infrastructure"
 *         targets:
 *           type: array
 *           items:
 *             type: string
 *           description: List of targets to scan (IPs, hostnames, URLs)
 *           example: ["192.168.1.0/24", "example.com", "https://app.example.com"]
 *         modules:
 *           type: array
 *           items:
 *             type: string
 *             enum: [network, web, ssl, compliance, configuration, aws, container, docker, openshift]
 *           description: Scanner modules to enable
 *           example: ["network", "web", "ssl"]
 *         ports:
 *           type: array
 *           items:
 *             type: integer
 *           description: Specific ports to scan
 *           example: [22, 80, 443, 3389]
 *         options:
 *           type: object
 *           description: Additional scanning options
 *     
 *     ScanStatus:
 *       type: object
 *       properties:
 *         scanId:
 *           type: string
 *           example: "scan_1703123456789_abc123"
 *         status:
 *           type: string
 *           enum: [queued, running, completed, failed, stopped]
 *           example: "running"
 *         progress:
 *           type: number
 *           description: Completion percentage (0-100)
 *           example: 75
 *         startTime:
 *           type: string
 *           format: date-time
 *         endTime:
 *           type: string
 *           format: date-time
 *         targetsTotal:
 *           type: integer
 *           example: 10
 *         targetsCompleted:
 *           type: integer
 *           example: 7
 *         findingsCount:
 *           type: integer
 *           example: 25
 *     
 *     ScanFinding:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         target:
 *           type: string
 *           example: "192.168.1.10"
 *         type:
 *           type: string
 *           example: "vulnerability"
 *         severity:
 *           type: string
 *           enum: [critical, high, medium, low, info]
 *           example: "high"
 *         title:
 *           type: string
 *           example: "Outdated SSH Version"
 *         description:
 *           type: string
 *           example: "SSH version 7.4 may have known vulnerabilities"
 *         cve:
 *           type: string
 *           example: "CVE-2018-15473"
 *         cvssScore:
 *           type: number
 *           example: 8.0
 *         solution:
 *           type: string
 *           example: "Update SSH to the latest version"
 *         timestamp:
 *           type: string
 *           format: date-time
 *         details:
 *           type: object
 *           description: Additional finding details
 */

/**
 * @swagger
 * /api/scanner/scan:
 *   post:
 *     tags: [Security Scanner]
 *     summary: Start a new security scan
 *     description: Initiates a comprehensive security assessment of specified targets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScanRequest'
 *     responses:
 *       201:
 *         description: Scan started successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 scanId:
 *                   type: string
 *                 message:
 *                   type: string
 *                 estimatedDuration:
 *                   type: string
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/scan', requireAuth, startScanValidation, validateRequest, scannerController.startScan);

/**
 * @swagger
 * /api/scanner/scan/{scanId}/status:
 *   get:
 *     tags: [Security Scanner]
 *     summary: Get scan status
 *     description: Retrieve the current status and progress of a running or completed scan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scan identifier
 *     responses:
 *       200:
 *         description: Scan status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScanStatus'
 *       404:
 *         description: Scan not found
 *       500:
 *         description: Internal server error
 */
router.get('/scan/:scanId/status', requireAuth, scanIdValidation, validateRequest, scannerController.getScanStatus);

/**
 * @swagger
 * /api/scanner/scan/{scanId}/results:
 *   get:
 *     tags: [Security Scanner]
 *     summary: Get scan results
 *     description: Retrieve detailed security findings from a completed scan
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scan identifier
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [critical, high, medium, low, info]
 *         description: Filter by severity level
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by finding type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of results to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of results to skip
 *     responses:
 *       200:
 *         description: Scan results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scanId:
 *                   type: string
 *                 scanInfo:
 *                   type: object
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     critical:
 *                       type: integer
 *                     high:
 *                       type: integer
 *                     medium:
 *                       type: integer
 *                     low:
 *                       type: integer
 *                     info:
 *                       type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScanFinding'
 *       404:
 *         description: Scan not found
 *       500:
 *         description: Internal server error
 */
router.get('/scan/:scanId/results', requireAuth, scanIdValidation, validateRequest, scannerController.getScanResults);

/**
 * @swagger
 * /api/scanner/scan/{scanId}/stop:
 *   post:
 *     tags: [Security Scanner]
 *     summary: Stop a running scan
 *     description: Immediately stop a scan that is currently running
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scan identifier
 *     responses:
 *       200:
 *         description: Scan stopped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Scan not found
 *       500:
 *         description: Internal server error
 */
router.post('/scan/:scanId/stop', requireAuth, scanIdValidation, validateRequest, scannerController.stopScan);

/**
 * @swagger
 * /api/scanner/scan/{scanId}/export:
 *   get:
 *     tags: [Security Scanner]
 *     summary: Export scan results
 *     description: Export scan results in various formats (JSON, CSV)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique scan identifier
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Scan results exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *           text/csv:
 *             schema:
 *               type: string
 *       400:
 *         description: Invalid export format
 *       404:
 *         description: Scan not found
 *       500:
 *         description: Internal server error
 */
router.get('/scan/:scanId/export', requireAuth, exportValidation, validateRequest, scannerController.exportScanResults);

/**
 * @swagger
 * /api/scanner/scans:
 *   get:
 *     tags: [Security Scanner]
 *     summary: Get scan history
 *     description: Retrieve a list of previous and current scans
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of scans to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of scans to skip
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [queued, running, completed, failed, stopped]
 *         description: Filter by scan status
 *     responses:
 *       200:
 *         description: Scan history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       scanId:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       progress:
 *                         type: number
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                       createdBy:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/scans', requireAuth, scanHistoryValidation, validateRequest, scannerController.getScanHistory);

/**
 * @swagger
 * /api/scanner/modules:
 *   get:
 *     tags: [Security Scanner]
 *     summary: Get available scanner modules
 *     description: Retrieve a list of available scanning modules and their capabilities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scanner modules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: "network"
 *                       displayName:
 *                         type: string
 *                         example: "Network Scanner"
 *                       description:
 *                         type: string
 *                         example: "Port scanning, service detection, and network enumeration"
 *                       capabilities:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["port_scanning", "service_detection", "banner_grabbing"]
 *       500:
 *         description: Internal server error
 */
router.get('/modules', requireAuth, scannerController.getScannerModules);

/**
 * @swagger
 * tags:
 *   - name: Security Scanner
 *     description: Vulnerability scanning and security assessment operations
 */

module.exports = router;
