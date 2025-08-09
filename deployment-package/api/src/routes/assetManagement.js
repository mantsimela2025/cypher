const express = require('express');
const assetManagementController = require('../controllers/assetManagementController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== ASSET COST MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-management/costs:
 *   post:
 *     summary: Create a new cost record
 *     tags: [Asset Cost Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - costType
 *               - amount
 *               - assetUuid
 *             properties:
 *               costType:
 *                 type: string
 *                 enum: [purchase, lease, maintenance, support, license, subscription, upgrade, repair, insurance, other]
 *               amount:
 *                 type: number
 *                 format: decimal
 *               currency:
 *                 type: string
 *                 default: USD
 *               billingCycle:
 *                 type: string
 *                 enum: [one_time, monthly, quarterly, semi_annual, annual, biennial]
 *               vendor:
 *                 type: string
 *               assetUuid:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Cost record created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/costs',
  requirePermission('asset_management:create'),
  assetManagementController.createCostRecord
);

/**
 * @swagger
 * /api/v1/asset-management/costs:
 *   get:
 *     summary: Get cost records with filtering and pagination
 *     tags: [Asset Cost Management]
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
 *         name: costType
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *       - in: query
 *         name: assetUuid
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Cost records retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/costs',
  requirePermission('asset_management:read'),
  assetManagementController.getCostRecords
);

/**
 * @swagger
 * /api/v1/asset-management/costs/{id}:
 *   get:
 *     summary: Get a specific cost record
 *     tags: [Asset Cost Management]
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
 *         description: Cost record retrieved successfully
 *       404:
 *         description: Cost record not found
 */
router.get('/costs/:id', 
  requirePermission('asset_management:read'),
  assetManagementController.getCostRecordById
);

/**
 * @swagger
 * /api/v1/asset-management/costs/{id}:
 *   put:
 *     summary: Update a cost record
 *     tags: [Asset Cost Management]
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
 *               amount:
 *                 type: number
 *               vendor:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cost record updated successfully
 *       404:
 *         description: Cost record not found
 */
router.put('/costs/:id', 
  requirePermission('asset_management:update'),
  assetManagementController.updateCostRecord
);

/**
 * @swagger
 * /api/v1/asset-management/costs/{id}:
 *   delete:
 *     summary: Delete a cost record
 *     tags: [Asset Cost Management]
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
 *         description: Cost record deleted successfully
 *       404:
 *         description: Cost record not found
 */
router.delete('/costs/:id', 
  requirePermission('asset_management:delete'),
  assetManagementController.deleteCostRecord
);

// ==================== ASSET LIFECYCLE ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-management/lifecycle:
 *   post:
 *     summary: Create a new lifecycle record
 *     tags: [Asset Lifecycle]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetUuid
 *             properties:
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *               warrantyEndDate:
 *                 type: string
 *                 format: date
 *               replacementCycleMonths:
 *                 type: integer
 *               assetUuid:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Lifecycle record created successfully
 */
router.post('/lifecycle',
  requirePermission('asset_management:create'),
  assetManagementController.createLifecycleRecord
);

router.get('/lifecycle',
  requirePermission('asset_management:read'),
  assetManagementController.getLifecycleRecords
);

router.get('/lifecycle/:id',
  requirePermission('asset_management:read'),
  assetManagementController.getLifecycleRecordById
);

router.put('/lifecycle/:id',
  requirePermission('asset_management:update'),
  assetManagementController.updateLifecycleRecord
);

router.delete('/lifecycle/:id',
  requirePermission('asset_management:delete'),
  assetManagementController.deleteLifecycleRecord
);

// ==================== OPERATIONAL COSTS ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-management/operational-costs:
 *   post:
 *     summary: Create a new operational cost record
 *     tags: [Operational Costs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - yearMonth
 *               - assetUuid
 *             properties:
 *               yearMonth:
 *                 type: string
 *                 format: date
 *               powerCost:
 *                 type: number
 *               spaceCost:
 *                 type: number
 *               networkCost:
 *                 type: number
 *               assetUuid:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Operational cost record created successfully
 */
router.post('/operational-costs',
  requirePermission('asset_management:create'),
  assetManagementController.createOperationalCost
);

router.get('/operational-costs',
  requirePermission('asset_management:read'),
  assetManagementController.getOperationalCosts
);

router.get('/operational-costs/:id',
  requirePermission('asset_management:read'),
  assetManagementController.getOperationalCostById
);

router.put('/operational-costs/:id',
  requirePermission('asset_management:update'),
  assetManagementController.updateOperationalCost
);

router.delete('/operational-costs/:id',
  requirePermission('asset_management:delete'),
  assetManagementController.deleteOperationalCost
);

// ==================== ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-management/analytics/costs/{assetUuid}:
 *   get:
 *     summary: Get cost analytics for an asset
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Cost analytics retrieved successfully
 */
router.get('/analytics/costs/:assetUuid', 
  requirePermission('asset_management:read'),
  assetManagementController.getCostAnalytics
);

module.exports = router;
