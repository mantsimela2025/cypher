const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const poamController = require('../controllers/poamController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Validation middleware helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// ==================== POAM MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/poams:
 *   get:
 *     summary: Get POAMs with filtering, sorting, and pagination
 *     tags: [POAMs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of POAMs per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Draft, Under Review, Approved, Rejected, Closed]
 *         description: Filter by POAM status
 *       - in: query
 *         name: riskRating
 *         schema:
 *           type: string
 *           enum: [Very Low, Low, Moderate, High, Very High]
 *         description: Filter by risk rating
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [Low, Moderate, High, Critical]
 *         description: Filter by severity
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *         description: Filter by assigned user ID
 *       - in: query
 *         name: scheduledCompletionDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by scheduled completion date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: scheduledCompletionDate
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in POAM title and description
 *     responses:
 *       200:
 *         description: POAMs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/',
  requirePermission('poam:read'),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isIn(['Draft', 'Under Review', 'Approved', 'Rejected', 'Closed']),
    query('riskRating').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    query('severity').optional().isIn(['Low', 'Moderate', 'High', 'Critical']),
    query('assignedTo').optional().isInt().toInt(),
    query('scheduledCompletionDate').optional().isISO8601().toDate(),
    query('sort').optional().isString(),
    query('order').optional().isIn(['asc', 'desc']),
    query('search').optional().isString().trim()
  ],
  handleValidationErrors,
  poamController.getAllPOAMs
);

/**
 * @swagger
 * /api/v1/poams/{id}:
 *   get:
 *     summary: Get POAM by ID
 *     tags: [POAMs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: POAM ID
 *     responses:
 *       200:
 *         description: POAM details retrieved successfully
 *       404:
 *         description: POAM not found
 */
router.get('/:id',
  requirePermission('poam:read'),
  [
    param('id').isInt({ min: 1 }).toInt()
  ],
  handleValidationErrors,
  poamController.getPOAMById
);

/**
 * @swagger
 * /api/v1/poams:
 *   post:
 *     summary: Create a new POAM
 *     tags: [POAMs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vulnerabilityId
 *               - title
 *               - description
 *               - severity
 *               - scheduledCompletionDate
 *             properties:
 *               vulnerabilityId:
 *                 type: integer
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [Low, Moderate, High, Critical]
 *               riskRating:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               scheduledCompletionDate:
 *                 type: string
 *                 format: date
 *               assignedTo:
 *                 type: integer
 *               businessImpact:
 *                 type: string
 *               likelihood:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               currentImpact:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               residualImpact:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               recommendations:
 *                 type: string
 *               externalReferences:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: POAM created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
  requirePermission('poam:create'),
  [
    body('vulnerabilityId').isInt({ min: 1 }).toInt(),
    body('title').isString().trim().isLength({ min: 1, max: 255 }),
    body('description').isString().trim().isLength({ min: 1 }),
    body('severity').isIn(['Low', 'Moderate', 'High', 'Critical']),
    body('riskRating').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('scheduledCompletionDate').isISO8601().toDate(),
    body('assignedTo').optional().isInt({ min: 1 }).toInt(),
    body('businessImpact').optional().isString().trim(),
    body('likelihood').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('currentImpact').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('residualImpact').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('recommendations').optional().isString().trim(),
    body('externalReferences').optional().isString().trim(),
    body('notes').optional().isString().trim()
  ],
  handleValidationErrors,
  poamController.createPOAM
);

/**
 * @swagger
 * /api/v1/poams/{id}:
 *   put:
 *     summary: Update an existing POAM
 *     tags: [POAMs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
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
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [Low, Moderate, High, Critical]
 *               riskRating:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               scheduledCompletionDate:
 *                 type: string
 *                 format: date
 *               assignedTo:
 *                 type: integer
 *               businessImpact:
 *                 type: string
 *               likelihood:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               currentImpact:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               residualImpact:
 *                 type: string
 *                 enum: [Very Low, Low, Moderate, High, Very High]
 *               recommendations:
 *                 type: string
 *               externalReferences:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: POAM updated successfully
 *       404:
 *         description: POAM not found
 */
router.put('/:id',
  requirePermission('poam:update'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('title').optional().isString().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().isString().trim().isLength({ min: 1 }),
    body('severity').optional().isIn(['Low', 'Moderate', 'High', 'Critical']),
    body('riskRating').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('scheduledCompletionDate').optional().isISO8601().toDate(),
    body('assignedTo').optional().isInt({ min: 1 }).toInt(),
    body('businessImpact').optional().isString().trim(),
    body('likelihood').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('currentImpact').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('residualImpact').optional().isIn(['Very Low', 'Low', 'Moderate', 'High', 'Very High']),
    body('recommendations').optional().isString().trim(),
    body('externalReferences').optional().isString().trim(),
    body('notes').optional().isString().trim()
  ],
  handleValidationErrors,
  poamController.updatePOAM
);

/**
 * @swagger
 * /api/v1/poams/{id}:
 *   delete:
 *     summary: Delete a POAM
 *     tags: [POAMs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: POAM deleted successfully
 *       404:
 *         description: POAM not found
 */
router.delete('/:id',
  requirePermission('poam:delete'),
  [
    param('id').isInt({ min: 1 }).toInt()
  ],
  handleValidationErrors,
  poamController.deletePOAM
);

// ==================== POAM STATUS MANAGEMENT ====================

/**
 * @swagger
 * /api/v1/poams/{id}/status:
 *   patch:
 *     summary: Update POAM status
 *     tags: [POAMs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Draft, Under Review, Approved, Rejected, Closed]
 *               statusChangeReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: POAM status updated successfully
 */
router.patch('/:id/status',
  requirePermission('poam:update'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('status').isIn(['Draft', 'Under Review', 'Approved', 'Rejected', 'Closed']),
    body('statusChangeReason').optional().isString().trim()
  ],
  handleValidationErrors,
  poamController.updatePOAMStatus
);

// ==================== POAM AUTO-GENERATION ====================

/**
 * @swagger
 * /api/v1/poams/generate-from-vulnerability:
 *   post:
 *     summary: Auto-generate POAM from vulnerability
 *     tags: [POAMs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vulnerabilityId
 *               - scheduledCompletionDate
 *             properties:
 *               vulnerabilityId:
 *                 type: integer
 *               scheduledCompletionDate:
 *                 type: string
 *                 format: date
 *               assignedTo:
 *                 type: integer
 *               additionalNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: POAM generated successfully from vulnerability
 *       404:
 *         description: Vulnerability not found
 */
router.post('/generate-from-vulnerability',
  requirePermission('poam:create'),
  [
    body('vulnerabilityId').isInt({ min: 1 }).toInt(),
    body('scheduledCompletionDate').isISO8601().toDate(),
    body('assignedTo').optional().isInt({ min: 1 }).toInt(),
    body('additionalNotes').optional().isString().trim()
  ],
  handleValidationErrors,
  poamController.generateFromVulnerability
);

// ==================== POAM MILESTONES MANAGEMENT ====================

/**
 * @swagger
 * /api/v1/poams/{id}/milestones:
 *   get:
 *     summary: Get POAM milestones
 *     tags: [POAM Milestones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: POAM milestones retrieved successfully
 */
router.get('/:id/milestones',
  requirePermission('poam:read'),
  [
    param('id').isInt({ min: 1 }).toInt()
  ],
  handleValidationErrors,
  poamController.getPOAMMilestones
);

/**
 * @swagger
 * /api/v1/poams/{id}/milestones:
 *   post:
 *     summary: Add milestone to POAM
 *     tags: [POAM Milestones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - dueDate
 *             properties:
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed, Overdue]
 *                 default: Pending
 *     responses:
 *       201:
 *         description: Milestone added successfully
 */
router.post('/:id/milestones',
  requirePermission('poam:update'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('description').isString().trim().isLength({ min: 1 }),
    body('dueDate').isISO8601().toDate(),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Overdue'])
  ],
  handleValidationErrors,
  poamController.addPOAMMilestone
);

/**
 * @swagger
 * /api/v1/poams/milestones/{milestoneId}:
 *   put:
 *     summary: Update POAM milestone
 *     tags: [POAM Milestones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Milestone updated successfully
 */
router.put('/milestones/:milestoneId',
  requirePermission('poam:update'),
  [
    param('milestoneId').isInt({ min: 1 }).toInt(),
    body('description').optional().isString().trim().isLength({ min: 1 }),
    body('dueDate').optional().isISO8601().toDate(),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed', 'Overdue'])
  ],
  handleValidationErrors,
  poamController.updatePOAMMilestone
);

/**
 * @swagger
 * /api/v1/poams/milestones/{milestoneId}:
 *   delete:
 *     summary: Delete POAM milestone
 *     tags: [POAM Milestones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Milestone deleted successfully
 */
router.delete('/milestones/:milestoneId',
  requirePermission('poam:delete'),
  [
    param('milestoneId').isInt({ min: 1 }).toInt()
  ],
  handleValidationErrors,
  poamController.deletePOAMMilestone
);

// ==================== POAM ASSETS MANAGEMENT ====================

/**
 * @swagger
 * /api/v1/poams/{id}/assets:
 *   get:
 *     summary: Get assets associated with POAM
 *     tags: [POAM Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: POAM assets retrieved successfully
 */
router.get('/:id/assets',
  requirePermission('poam:read'),
  [
    param('id').isInt({ min: 1 }).toInt()
  ],
  handleValidationErrors,
  poamController.getPOAMAssets
);

/**
 * @swagger
 * /api/v1/poams/{id}/assets:
 *   post:
 *     summary: Associate asset with POAM
 *     tags: [POAM Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetUuid
 *             properties:
 *               assetUuid:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Asset associated with POAM successfully
 */
router.post('/:id/assets',
  requirePermission('poam:update'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('assetUuid').isUUID()
  ],
  handleValidationErrors,
  poamController.addPOAMAsset
);

/**
 * @swagger
 * /api/v1/poams/{id}/assets/{assetUuid}:
 *   delete:
 *     summary: Remove asset from POAM
 *     tags: [POAM Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset removed from POAM successfully
 */
router.delete('/:id/assets/:assetUuid',
  requirePermission('poam:update'),
  [
    param('id').isInt({ min: 1 }).toInt(),
    param('assetUuid').isUUID()
  ],
  handleValidationErrors,
  poamController.removePOAMAsset
);

// ==================== POAM ANALYTICS AND REPORTING ====================

/**
 * @swagger
 * /api/v1/poams/summary:
 *   get:
 *     summary: Get POAM summary statistics
 *     tags: [POAM Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: POAM summary statistics retrieved successfully
 */
router.get('/summary',
  requirePermission('poam:read'),
  poamController.getPOAMSummary
);

/**
 * @swagger
 * /api/v1/poams/overdue:
 *   get:
 *     summary: Get overdue POAMs
 *     tags: [POAM Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue POAMs retrieved successfully
 */
router.get('/overdue',
  requirePermission('poam:read'),
  poamController.getOverduePOAMs
);

/**
 * @swagger
 * /api/v1/poams/due-soon:
 *   get:
 *     summary: Get POAMs due within specified days
 *     tags: [POAM Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: POAMs due soon retrieved successfully
 */
router.get('/due-soon',
  requirePermission('poam:read'),
  [
    query('days').optional().isInt({ min: 1 }).toInt()
  ],
  handleValidationErrors,
  poamController.getPOAMsDueSoon
);

module.exports = router;