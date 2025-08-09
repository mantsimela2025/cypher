const express = require('express');
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

/**
 * @swagger
 * /api/v1/settings/public:
 *   get:
 *     summary: Get public settings (no authentication required)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: Settings grouped by category
 */
router.get('/public', settingsController.getPublicSettings);

// Apply authentication to all other routes
router.use(authenticateToken);

// ==================== SETTINGS CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get all settings with filtering and pagination
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public visibility
 *       - in: query
 *         name: isEditable
 *         schema:
 *           type: boolean
 *         description: Filter by editability
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in key and description
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [key, category, dataType, createdAt, updatedAt]
 *           default: category
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  requirePermission('settings', 'view'),
  settingsController.getAllSettings
);

/**
 * @swagger
 * /api/v1/settings:
 *   post:
 *     summary: Create new setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 maxLength: 255
 *                 description: Unique setting key
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: object
 *                   - type: array
 *                 description: Setting value
 *               dataType:
 *                 type: string
 *                 enum: [string, number, boolean, json, array]
 *                 default: string
 *                 description: Data type of the value
 *               category:
 *                 type: string
 *                 maxLength: 255
 *                 default: general
 *                 description: Setting category
 *               description:
 *                 type: string
 *                 description: Setting description
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *                 description: Whether setting is publicly accessible
 *               isEditable:
 *                 type: boolean
 *                 default: true
 *                 description: Whether setting can be edited
 *     responses:
 *       201:
 *         description: Setting created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Setting key already exists
 */
router.post('/', 
  requirePermission('settings', 'create'),
  settingsController.createSetting
);

/**
 * @swagger
 * /api/v1/settings/{id}:
 *   get:
 *     summary: Get setting by ID
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Setting ID
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 *       404:
 *         description: Setting not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:id', 
  requirePermission('settings', 'view'),
  settingsController.getSettingById
);

/**
 * @swagger
 * /api/v1/settings/{id}:
 *   put:
 *     summary: Update setting by ID
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Setting ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: object
 *                   - type: array
 *                 description: Setting value
 *               dataType:
 *                 type: string
 *                 enum: [string, number, boolean, json, array]
 *                 description: Data type of the value
 *               category:
 *                 type: string
 *                 maxLength: 255
 *                 description: Setting category
 *               description:
 *                 type: string
 *                 description: Setting description
 *               isPublic:
 *                 type: boolean
 *                 description: Whether setting is publicly accessible
 *               isEditable:
 *                 type: boolean
 *                 description: Whether setting can be edited
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions or setting not editable
 *       404:
 *         description: Setting not found
 */
router.put('/:id', 
  requirePermission('settings', 'edit'),
  settingsController.updateSetting
);

/**
 * @swagger
 * /api/v1/settings/{id}:
 *   delete:
 *     summary: Delete setting by ID
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Setting ID
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions or setting not deletable
 *       404:
 *         description: Setting not found
 */
router.delete('/:id', 
  requirePermission('settings', 'delete'),
  settingsController.deleteSetting
);

/**
 * @swagger
 * /api/v1/settings/key/{key}:
 *   get:
 *     summary: Get setting by key
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 *       404:
 *         description: Setting not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/key/:key', 
  requirePermission('settings', 'view'),
  settingsController.getSettingByKey
);

/**
 * @swagger
 * /api/v1/settings/key/{key}:
 *   put:
 *     summary: Update setting by key
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 oneOf:
 *                   - type: string
 *                   - type: number
 *                   - type: boolean
 *                   - type: object
 *                   - type: array
 *                 description: Setting value
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions or setting not editable
 *       404:
 *         description: Setting not found
 */
router.put('/key/:key', 
  requirePermission('settings', 'edit'),
  settingsController.updateSettingByKey
);

// ==================== UTILITY ROUTES ====================

/**
 * @swagger
 * /api/v1/settings/categories:
 *   get:
 *     summary: Get all setting categories
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       count:
 *                         type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/categories', 
  requirePermission('settings', 'view'),
  settingsController.getCategories
);

/**
 * @swagger
 * /api/v1/settings/bulk-update:
 *   put:
 *     summary: Bulk update multiple settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               oneOf:
 *                 - type: string
 *                 - type: number
 *                 - type: boolean
 *                 - type: object
 *                 - type: array
 *             example:
 *               app_name: "My Application"
 *               max_users: 1000
 *               enable_notifications: true
 *     responses:
 *       200:
 *         description: Bulk update completed
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
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           setting:
 *                             type: object
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/bulk-update', 
  requirePermission('settings', 'edit'),
  settingsController.bulkUpdateSettings
);

module.exports = router;
