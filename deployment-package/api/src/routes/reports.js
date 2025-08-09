const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== REPORT TEMPLATE ROUTES ====================

/**
 * @swagger
 * /api/v1/reports/templates:
 *   post:
 *     summary: Create a new report template
 *     tags: [Report Templates]
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
 *               - module
 *               - templateData
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template name
 *                 example: "Monthly Security Report Template"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Template description
 *                 example: "Template for generating monthly security reports"
 *               module:
 *                 type: string
 *                 maxLength: 50
 *                 description: Module or system the template belongs to
 *                 example: "security"
 *               templateData:
 *                 type: object
 *                 description: Template configuration data
 *                 example: { "sections": ["overview", "incidents", "metrics"], "format": "standard" }
 *               isSystem:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is a system template
 *     responses:
 *       201:
 *         description: Report template created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/templates', 
  requirePermission('reports', 'write'),
  reportController.createTemplate
);

/**
 * @swagger
 * /api/v1/reports/templates:
 *   get:
 *     summary: Get all report templates with filtering and pagination
 *     tags: [Report Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by module
 *       - in: query
 *         name: isSystem
 *         schema:
 *           type: boolean
 *         description: Filter by system templates
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in name, description, and module
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
 *           enum: [createdAt, updatedAt, name, module]
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
 *         description: Report templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/templates', 
  requirePermission('reports', 'read'),
  reportController.getAllTemplates
);

/**
 * @swagger
 * /api/v1/reports/templates/{templateId}:
 *   get:
 *     summary: Get report template by ID
 *     tags: [Report Templates]
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
 *         description: Report template retrieved successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/templates/:templateId', 
  requirePermission('reports', 'read'),
  reportController.getTemplateById
);

/**
 * @swagger
 * /api/v1/reports/templates/{templateId}:
 *   put:
 *     summary: Update report template
 *     tags: [Report Templates]
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
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               module:
 *                 type: string
 *                 maxLength: 50
 *               templateData:
 *                 type: object
 *               isSystem:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Report template updated successfully
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
  requirePermission('reports', 'write'),
  reportController.updateTemplate
);

/**
 * @swagger
 * /api/v1/reports/templates/{templateId}:
 *   delete:
 *     summary: Delete report template
 *     tags: [Report Templates]
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
 *         description: Report template deleted successfully
 *       404:
 *         description: Template not found
 *       409:
 *         description: Template is being used and cannot be deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/templates/:templateId', 
  requirePermission('reports', 'admin'),
  reportController.deleteTemplate
);

// ==================== REPORT CONFIGURATION ROUTES ====================

/**
 * @swagger
 * /api/v1/reports/configurations:
 *   post:
 *     summary: Create a new report configuration
 *     tags: [Report Configurations]
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
 *               - templateId
 *             properties:
 *               name:
 *                 type: string
 *                 description: Configuration name
 *                 example: "Weekly Security Dashboard"
 *               templateId:
 *                 type: integer
 *                 description: ID of the template to use
 *                 example: 1
 *               parameters:
 *                 type: object
 *                 description: Configuration parameters
 *                 example: { "dateRange": "7d", "includeCharts": true }
 *     responses:
 *       201:
 *         description: Report configuration created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/configurations', 
  requirePermission('reports', 'write'),
  reportController.createConfiguration
);

/**
 * @swagger
 * /api/v1/reports/configurations:
 *   get:
 *     summary: Get all report configurations with filtering and pagination
 *     tags: [Report Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: templateId
 *         schema:
 *           type: integer
 *         description: Filter by template ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in name and template name
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
 *           enum: [createdAt, updatedAt, name]
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
 *         description: Report configurations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/configurations', 
  requirePermission('reports', 'read'),
  reportController.getAllConfigurations
);

/**
 * @swagger
 * /api/v1/reports/configurations/{configId}:
 *   get:
 *     summary: Get report configuration by ID
 *     tags: [Report Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Configuration ID
 *     responses:
 *       200:
 *         description: Report configuration retrieved successfully
 *       404:
 *         description: Configuration not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/configurations/:configId',
  requirePermission('reports', 'read'),
  reportController.getConfigurationById
);

// ==================== REPORT GENERATION ROUTES ====================

/**
 * @swagger
 * /api/v1/reports:
 *   post:
 *     summary: Generate a new report
 *     tags: [Reports]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Report name
 *                 example: "Monthly Security Report - January 2024"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Report description
 *                 example: "Comprehensive security report for January 2024"
 *               type:
 *                 type: string
 *                 enum: [dashboard, metrics, analytics, compliance, audit, security, asset, vulnerability, policy, procedure, user_activity, system_performance, financial, operational, custom]
 *                 description: Type of report
 *                 example: "security"
 *               format:
 *                 type: string
 *                 enum: [pdf, excel, csv, json, html, word, powerpoint]
 *                 default: pdf
 *                 description: Output format
 *               parameters:
 *                 type: object
 *                 description: Report parameters
 *                 example: { "dateRange": "30d", "includeCharts": true, "severity": "high" }
 *               templateId:
 *                 type: integer
 *                 description: Template ID to use
 *               configurationId:
 *                 type: integer
 *                 description: Configuration ID to use
 *               scheduleId:
 *                 type: integer
 *                 description: Schedule ID if this is a scheduled report
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: When to generate the report
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: When the report expires
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Report generation started successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/',
  requirePermission('reports', 'write'),
  reportController.generateReport
);

/**
 * @swagger
 * /api/v1/reports:
 *   get:
 *     summary: Get all reports with filtering and pagination
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [dashboard, metrics, analytics, compliance, audit, security, asset, vulnerability, policy, procedure, user_activity, system_performance, financial, operational, custom]
 *         description: Filter by report type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, generating, completed, failed, scheduled, cancelled, expired]
 *         description: Filter by report status
 *       - in: query
 *         name: generatedBy
 *         schema:
 *           type: integer
 *         description: Filter by user who generated the report
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from creation date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to creation date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in name and description
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
 *           enum: [createdAt, updatedAt, name, generatedAt, type, status]
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
 *         description: Reports retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/',
  requirePermission('reports', 'read'),
  reportController.getAllReports
);

/**
 * @swagger
 * /api/v1/reports/{reportId}:
 *   get:
 *     summary: Get report by ID
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report retrieved successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:reportId',
  requirePermission('reports', 'read'),
  reportController.getReportById
);

/**
 * @swagger
 * /api/v1/reports/{reportId}/download:
 *   get:
 *     summary: Download report file
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report file downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Report file not available
 *       404:
 *         description: Report or file not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:reportId/download',
  requirePermission('reports', 'read'),
  reportController.downloadReport
);

/**
 * @swagger
 * /api/v1/reports/{reportId}:
 *   delete:
 *     summary: Delete report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Report ID
 *     responses:
 *       200:
 *         description: Report deleted successfully
 *       404:
 *         description: Report not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:reportId',
  requirePermission('reports', 'admin'),
  reportController.deleteReport
);

module.exports = router;
