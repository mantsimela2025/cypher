const express = require('express');
const patchController = require('../controllers/patchController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== PATCH CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/patches:
 *   post:
 *     summary: Create a new patch
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patchId
 *               - title
 *               - vendor
 *               - severity
 *               - type
 *             properties:
 *               patchId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               vendor:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [critical, high, medium, low, informational]
 *               type:
 *                 type: string
 *                 enum: [security, bug_fix, feature, enhancement, maintenance]
 *               releaseDate:
 *                 type: string
 *                 format: date-time
 *               rebootRequired:
 *                 type: boolean
 *               downloadSize:
 *                 type: integer
 *               estimatedDowntime:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Patch created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Patch ID already exists
 */
router.post('/',
  requireRole(['admin']),
  patchController.validateCreatePatch(),
  patchController.createPatch
);

/**
 * @swagger
 * /api/v1/patches:
 *   get:
 *     summary: Get patches with filtering and pagination
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, releaseDate, severity, vendor, title]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patches retrieved successfully
 */
router.get('/',
  requireRole(['admin', 'user']),
  patchController.validatePatchQuery(),
  patchController.getPatches
);

/**
 * @swagger
 * /api/v1/patches/{id}:
 *   get:
 *     summary: Get a specific patch
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patch retrieved successfully
 *       404:
 *         description: Patch not found
 */
router.get('/:id',
  requireRole(['admin', 'user']),
  patchController.validateUUID(),
  patchController.getPatchById
);

/**
 * @swagger
 * /api/v1/patches/{id}:
 *   put:
 *     summary: Update a patch
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *               severity:
 *                 type: string
 *                 enum: [critical, high, medium, low, informational]
 *               status:
 *                 type: string
 *                 enum: [available, pending_approval, approved, scheduled, in_progress, completed, failed, cancelled, superseded]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patch updated successfully
 *       404:
 *         description: Patch not found
 */
router.put('/:id',
  requireRole(['admin']),
  patchController.validateUUID(),
  patchController.validateUpdatePatch(),
  patchController.updatePatch
);

/**
 * @swagger
 * /api/v1/patches/{id}:
 *   delete:
 *     summary: Delete a patch
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patch deleted successfully
 *       404:
 *         description: Patch not found
 */
router.delete('/:id',
  requireRole(['admin']),
  patchController.validateUUID(),
  patchController.deletePatch
);

// ==================== PATCH VULNERABILITY MAPPING ROUTES ====================

/**
 * @swagger
 * /api/v1/patches/{id}/vulnerabilities:
 *   post:
 *     summary: Link patch to vulnerabilities
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vulnerabilityIds
 *             properties:
 *               vulnerabilityIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Vulnerabilities linked successfully
 */
router.post('/:id/vulnerabilities',
  requireRole(['admin']),
  patchController.validateUUID(),
  patchController.validatePatchVulnerabilityLink(),
  patchController.linkPatchToVulnerabilities
);

router.get('/:id/vulnerabilities',
  requireRole(['admin', 'user']),
  patchController.validateUUID(),
  patchController.getPatchVulnerabilities
);

router.delete('/:id/vulnerabilities/:vulnerabilityId',
  requireRole(['admin']),
  patchController.validateUUID(),
  patchController.unlinkPatchFromVulnerability
);

// ==================== PATCH ASSET MAPPING ROUTES ====================

/**
 * @swagger
 * /api/v1/patches/{id}/assets:
 *   post:
 *     summary: Link patch to assets
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetUuids
 *             properties:
 *               assetUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Assets linked successfully
 */
router.post('/:id/assets',
  requireRole(['admin']),
  patchController.validateUUID(),
  patchController.validatePatchAssetLink(),
  patchController.linkPatchToAssets
);

router.get('/:id/assets',
  requireRole(['admin', 'user']),
  patchController.validateUUID(),
  patchController.getPatchAssets
);

/**
 * @swagger
 * /api/v1/patches/{id}/assets/{assetUuid}:
 *   put:
 *     summary: Update patch asset status
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *                 enum: [pending, success, failed, cancelled]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Asset status updated successfully
 */
router.put('/:id/assets/:assetUuid',
  requireRole(['admin']),
  patchController.validateUUID(),
  patchController.validateAssetStatusUpdate(),
  patchController.updatePatchAssetStatus
);

// ==================== ANALYTICS & REPORTING ROUTES ====================

/**
 * @swagger
 * /api/v1/patches/analytics:
 *   get:
 *     summary: Get patch analytics
 *     tags: [Patch Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics',
  requireRole(['admin', 'user']),
  patchController.getPatchAnalytics
);

/**
 * @swagger
 * /api/v1/patches/compliance-report:
 *   get:
 *     summary: Get compliance report
 *     tags: [Patch Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: frameworks
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Compliance report retrieved successfully
 */
router.get('/compliance-report',
  requireRole(['admin', 'user']),
  patchController.getComplianceReport
);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @swagger
 * /api/v1/patches/bulk/update-status:
 *   put:
 *     summary: Bulk update patch status
 *     tags: [Patch Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patchIds
 *               - status
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               status:
 *                 type: string
 *                 enum: [available, pending_approval, approved, scheduled, cancelled]
 *     responses:
 *       200:
 *         description: Patches updated successfully
 */
router.put('/bulk/update-status',
  requireRole(['admin']),
  patchController.bulkUpdatePatchStatus
);

router.delete('/bulk/delete',
  requireRole(['admin']),
  patchController.bulkDeletePatches
);

module.exports = router;