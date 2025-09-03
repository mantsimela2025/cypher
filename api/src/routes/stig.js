const express = require('express');
const stigController = require('../controllers/stigController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== STIG LIBRARY ROUTES ====================

/**
 * @swagger
 * /api/v1/stig/library:
 *   post:
 *     summary: Create a new STIG library entry
 *     tags: [STIG Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stigId
 *               - title
 *               - description
 *               - version
 *               - severity
 *             properties:
 *               stigId:
 *                 type: string
 *                 maxLength: 50
 *                 description: Unique STIG identifier
 *                 example: "RHEL-07-010010"
 *               title:
 *                 type: string
 *                 description: STIG rule title
 *                 example: "The Red Hat Enterprise Linux operating system must be configured so that the file permissions, ownership, and group membership of system files and commands match the vendor values."
 *               description:
 *                 type: string
 *                 description: Detailed description of the STIG rule
 *               version:
 *                 type: string
 *                 maxLength: 20
 *                 description: STIG version
 *                 example: "1.0"
 *               releaseDate:
 *                 type: string
 *                 format: date
 *                 description: STIG release date
 *               category:
 *                 type: string
 *                 maxLength: 100
 *                 description: STIG category
 *                 example: "operating_system"
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Severity level
 *               status:
 *                 type: string
 *                 enum: [active, deprecated, draft, superseded]
 *                 default: active
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Supported platforms
 *                 example: ["linux", "rhel"]
 *               automationSupported:
 *                 type: boolean
 *                 default: false
 *                 description: Whether automation is supported
 *               requiresManualReview:
 *                 type: boolean
 *                 default: true
 *                 description: Whether manual review is required
 *               estimatedFixTime:
 *                 type: integer
 *                 minimum: 0
 *                 description: Estimated fix time in minutes
 *               businessImpact:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Business impact level
 *               technicalComplexity:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Technical complexity level
 *     responses:
 *       201:
 *         description: STIG library entry created successfully
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: STIG ID already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/library', 
  requireRole(['admin']),
  stigController.createStigLibraryEntry
);

/**
 * @swagger
 * /api/v1/stig/library:
 *   get:
 *     summary: Get all STIG library entries with filtering and pagination
 *     tags: [STIG Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by category
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, deprecated, draft, superseded]
 *         description: Filter by status
 *       - in: query
 *         name: platform
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by platform
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in title, description, STIG ID, rule ID, or vulnerability ID
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
 *           enum: [createdAt, updatedAt, title, severity, category, releaseDate]
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
 *         description: STIG library entries retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/library', 
  requireRole(['admin', 'user']),
  stigController.getAllStigLibraryEntries
);

/**
 * @swagger
 * /api/v1/stig/library/{stigId}:
 *   get:
 *     summary: Get STIG library entry by ID
 *     tags: [STIG Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stigId
 *         required: true
 *         schema:
 *           type: integer
 *         description: STIG library entry ID
 *     responses:
 *       200:
 *         description: STIG library entry retrieved successfully
 *       404:
 *         description: STIG library entry not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/library/:stigId', 
  requireRole(['admin', 'user']),
  stigController.getStigLibraryEntryById
);

/**
 * @swagger
 * /api/v1/stig/library/{stigId}:
 *   put:
 *     summary: Update STIG library entry
 *     tags: [STIG Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stigId
 *         required: true
 *         schema:
 *           type: integer
 *         description: STIG library entry ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               version:
 *                 type: string
 *                 maxLength: 20
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               status:
 *                 type: string
 *                 enum: [active, deprecated, draft, superseded]
 *               platforms:
 *                 type: array
 *                 items:
 *                   type: string
 *               automationSupported:
 *                 type: boolean
 *               requiresManualReview:
 *                 type: boolean
 *               estimatedFixTime:
 *                 type: integer
 *                 minimum: 0
 *               businessImpact:
 *                 type: string
 *                 enum: [low, medium, high]
 *               technicalComplexity:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: STIG library entry updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: STIG library entry not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/library/:stigId', 
  requireRole(['admin']),
  stigController.updateStigLibraryEntry
);

/**
 * @swagger
 * /api/v1/stig/library/{stigId}:
 *   delete:
 *     summary: Delete STIG library entry
 *     tags: [STIG Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stigId
 *         required: true
 *         schema:
 *           type: integer
 *         description: STIG library entry ID
 *     responses:
 *       200:
 *         description: STIG library entry deleted successfully
 *       404:
 *         description: STIG library entry not found
 *       409:
 *         description: STIG is being used and cannot be deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/library/:stigId', 
  requireRole(['admin']),
  stigController.deleteStigLibraryEntry
);

/**
 * @swagger
 * /api/v1/stig/import/xml:
 *   post:
 *     summary: Import STIG from XML file
 *     tags: [STIG Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               xmlFile:
 *                 type: string
 *                 format: binary
 *                 description: STIG XML file to import
 *     responses:
 *       201:
 *         description: STIG imported from XML successfully
 *       400:
 *         description: Invalid XML file or format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/import/xml', 
  requireRole(['admin']),
  stigController.uploadXml,
  stigController.importStigFromXml
);

/**
 * @swagger
 * /api/v1/stig/download/disa:
 *   post:
 *     summary: Download STIG from DISA repository
 *     tags: [STIG Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stigIdentifier
 *             properties:
 *               stigIdentifier:
 *                 type: string
 *                 description: STIG identifier to download
 *                 example: "RHEL_7_STIG"
 *               version:
 *                 type: string
 *                 description: Specific version to download
 *               autoImport:
 *                 type: boolean
 *                 default: true
 *                 description: Automatically import after download
 *     responses:
 *       201:
 *         description: STIG downloaded from DISA successfully
 *       404:
 *         description: STIG not found in DISA repository
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/download/disa',
  requireRole(['admin']),
  stigController.downloadStigFromDisa
);

// ==================== STIG CHECKLIST ROUTES ====================

/**
 * @swagger
 * /api/v1/stig/checklists:
 *   post:
 *     summary: Create a new STIG checklist
 *     tags: [STIG Checklists]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetId
 *               - benchmarkId
 *               - title
 *             properties:
 *               assetId:
 *                 type: integer
 *                 description: Asset ID for the checklist
 *               benchmarkId:
 *                 type: string
 *                 maxLength: 255
 *                 description: STIG benchmark identifier
 *                 example: "RHEL_7_STIG"
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Checklist title
 *                 example: "RHEL 7 STIG Checklist - Production Server"
 *               version:
 *                 type: string
 *                 maxLength: 255
 *                 description: STIG version
 *               targetType:
 *                 type: string
 *                 maxLength: 255
 *                 description: Target system type
 *                 example: "linux_server"
 *               assignedTo:
 *                 type: integer
 *                 description: User ID assigned to the checklist
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 description: Due date for completion
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               estimatedEffort:
 *                 type: integer
 *                 minimum: 0
 *                 description: Estimated effort in hours
 *               scanFrequency:
 *                 type: string
 *                 enum: [daily, weekly, monthly]
 *                 description: Automated scan frequency
 *               automatedScanEnabled:
 *                 type: boolean
 *                 default: false
 *               businessJustification:
 *                 type: string
 *                 description: Business justification for the checklist
 *     responses:
 *       201:
 *         description: STIG checklist created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/checklists',
  requireRole(['admin']),
  stigController.createStigChecklist
);

/**
 * @swagger
 * /api/v1/stig/checklists:
 *   get:
 *     summary: Get all STIG checklists with filtering and pagination
 *     tags: [STIG Checklists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetId
 *         schema:
 *           type: integer
 *         description: Filter by asset ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not_started, in_progress, completed, reviewed, approved, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in title, benchmark ID, or target type
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
 *           enum: [createdAt, updatedAt, title, status, priority, dueDate]
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
 *         description: STIG checklists retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/checklists',
  requireRole(['admin', 'user']),
  stigController.getAllStigChecklists
);

/**
 * @swagger
 * /api/v1/stig/checklists/{checklistId}:
 *   get:
 *     summary: Get STIG checklist by ID
 *     tags: [STIG Checklists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Checklist ID
 *     responses:
 *       200:
 *         description: STIG checklist retrieved successfully
 *       404:
 *         description: STIG checklist not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/checklists/:checklistId',
  requireRole(['admin', 'user']),
  stigController.getStigChecklistById
);

/**
 * @swagger
 * /api/v1/stig/checklists/{checklistId}:
 *   put:
 *     summary: Update STIG checklist
 *     tags: [STIG Checklists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Checklist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               status:
 *                 type: string
 *                 enum: [not_started, in_progress, completed, reviewed, approved, rejected]
 *               assignedTo:
 *                 type: integer
 *               reviewedBy:
 *                 type: integer
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               estimatedEffort:
 *                 type: integer
 *                 minimum: 0
 *               actualEffort:
 *                 type: integer
 *                 minimum: 0
 *               businessJustification:
 *                 type: string
 *               technicalJustification:
 *                 type: string
 *               compensatingControls:
 *                 type: string
 *               residualRisk:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               mitigation:
 *                 type: string
 *     responses:
 *       200:
 *         description: STIG checklist updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: STIG checklist not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/checklists/:checklistId',
  requireRole(['admin']),
  stigController.updateStigChecklist
);

/**
 * @swagger
 * /api/v1/stig/checklists/{checklistId}:
 *   delete:
 *     summary: Delete STIG checklist
 *     tags: [STIG Checklists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Checklist ID
 *     responses:
 *       200:
 *         description: STIG checklist deleted successfully
 *       404:
 *         description: STIG checklist not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/checklists/:checklistId',
  requireRole(['admin']),
  stigController.deleteStigChecklist
);

/**
 * @swagger
 * /api/v1/stig/checklists/{checklistId}/assign:
 *   post:
 *     summary: Assign STIG checklist to user
 *     tags: [STIG Checklists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: checklistId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Checklist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignedTo
 *             properties:
 *               assignedTo:
 *                 type: integer
 *                 description: User ID to assign the checklist to
 *     responses:
 *       200:
 *         description: STIG checklist assigned successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: STIG checklist not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/checklists/:checklistId/assign',
  requireRole(['admin']),
  stigController.assignStigChecklist
);

/**
 * @swagger
 * /api/v1/stig/analytics:
 *   get:
 *     summary: Get STIG analytics and statistics
 *     tags: [STIG Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: STIG analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 library:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total STIG library entries
 *                     active:
 *                       type: integer
 *                       description: Active STIG entries
 *                     deprecated:
 *                       type: integer
 *                       description: Deprecated STIG entries
 *                     critical:
 *                       type: integer
 *                       description: Critical severity STIGs
 *                     high:
 *                       type: integer
 *                       description: High severity STIGs
 *                     medium:
 *                       type: integer
 *                       description: Medium severity STIGs
 *                     low:
 *                       type: integer
 *                       description: Low severity STIGs
 *                 checklists:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total checklists
 *                     notStarted:
 *                       type: integer
 *                       description: Not started checklists
 *                     inProgress:
 *                       type: integer
 *                       description: In progress checklists
 *                     completed:
 *                       type: integer
 *                       description: Completed checklists
 *                     reviewed:
 *                       type: integer
 *                       description: Reviewed checklists
 *                     approved:
 *                       type: integer
 *                       description: Approved checklists
 *                 assessments:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total assessments
 *                     pending:
 *                       type: integer
 *                       description: Pending assessments
 *                     inProgress:
 *                       type: integer
 *                       description: In progress assessments
 *                     completed:
 *                       type: integer
 *                       description: Completed assessments
 *                     compliant:
 *                       type: integer
 *                       description: Compliant assessments
 *                     nonCompliant:
 *                       type: integer
 *                       description: Non-compliant assessments
 *                     notApplicable:
 *                       type: integer
 *                       description: Not applicable assessments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/analytics',
  requireRole(['admin', 'user']),
  stigController.getStigAnalytics
);

module.exports = router;
