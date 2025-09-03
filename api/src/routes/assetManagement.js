const express = require('express');
const assetManagementController = require('../controllers/assetManagementController');
const { authenticateToken, requireRole } = require('../middleware/auth');

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
  requireRole(['admin']),
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
  requireRole(['admin', 'user']),
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
  requireRole(['admin', 'user']),
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
  requireRole(['admin']),
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
  requireRole(['admin']),
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
  requireRole(['admin']),
  assetManagementController.createLifecycleRecord
);

router.get('/lifecycle',
  requireRole(['admin', 'user']),
  assetManagementController.getLifecycleRecords
);

router.get('/lifecycle/:id',
  requireRole(['admin', 'user']),
  assetManagementController.getLifecycleRecordById
);

router.put('/lifecycle/:id',
  requireRole(['admin']),
  assetManagementController.updateLifecycleRecord
);

router.delete('/lifecycle/:id',
  requireRole(['admin']),
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
  requireRole(['admin']),
  assetManagementController.createOperationalCost
);

router.get('/operational-costs',
  requireRole(['admin', 'user']),
  assetManagementController.getOperationalCosts
);

router.get('/operational-costs/:id',
  requireRole(['admin', 'user']),
  assetManagementController.getOperationalCostById
);

router.put('/operational-costs/:id',
  requireRole(['admin']),
  assetManagementController.updateOperationalCost
);

router.delete('/operational-costs/:id',
  requireRole(['admin']),
  assetManagementController.deleteOperationalCost
);

// ==================== RISK MAPPING ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-management/risk-mapping:
 *   post:
 *     summary: Create a new risk mapping record
 *     tags: [Risk Mapping]
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
 *               assetUuid:
 *                 type: string
 *                 format: uuid
 *               existingAssetId:
 *                 type: integer
 *               riskModelId:
 *                 type: integer
 *               costCenterId:
 *                 type: integer
 *               mappingConfidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *               mappingMethod:
 *                 type: string
 *                 enum: [automatic, manual, hybrid]
 *               mappingCriteria:
 *                 type: object
 *     responses:
 *       201:
 *         description: Risk mapping record created successfully
 */
router.post('/risk-mapping',
  requireRole(['admin']),
  assetManagementController.createRiskMapping
);

router.get('/risk-mapping',
  requireRole(['admin', 'user']),
  assetManagementController.getRiskMappings
);

router.get('/risk-mapping/:id',
  requireRole(['admin', 'user']),
  assetManagementController.getRiskMappingById
);

router.put('/risk-mapping/:id',
  requireRole(['admin']),
  assetManagementController.updateRiskMapping
);

router.delete('/risk-mapping/:id',
  requireRole(['admin']),
  assetManagementController.deleteRiskMapping
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
  requireRole(['admin', 'user']),
  assetManagementController.getCostAnalytics
);

// ==================== ASSET DETAIL VIEWS ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-management/assets:
 *   get:
 *     summary: Get paginated list of assets with basic details
 *     tags: [Asset Details]
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
 *           default: hostname
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *       - in: query
 *         name: hostname
 *         schema:
 *           type: string
 *       - in: query
 *         name: ipAddress
 *         schema:
 *           type: string
 *       - in: query
 *         name: operatingSystem
 *         schema:
 *           type: string
 *       - in: query
 *         name: assetType
 *         schema:
 *           type: string
 *       - in: query
 *         name: criticality
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: environment
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasVulnerabilities
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Assets with details retrieved successfully
 */
router.get('/assets',
  requireRole(['admin', 'user']),
  assetManagementController.getAssetsWithDetails
);

/**
 * @swagger
 * /api/v1/asset-management/assets/{assetUuid}/complete-detail:
 *   get:
 *     summary: Get comprehensive asset details with all related information
 *     tags: [Asset Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset complete details retrieved successfully
 *       404:
 *         description: Asset not found
 */
router.get('/assets/:assetUuid/complete-detail',
  requireRole(['admin', 'user']),
  assetManagementController.getAssetCompleteDetail
);

/**
 * @swagger
 * /api/v1/asset-management/assets/{assetUuid}/basic-detail:
 *   get:
 *     summary: Get basic asset details
 *     tags: [Asset Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset basic details retrieved successfully
 *       404:
 *         description: Asset not found
 */
router.get('/assets/:assetUuid/basic-detail',
  requireRole(['admin', 'user']),
  assetManagementController.getAssetBasicDetail
);

/**
 * @swagger
 * /api/v1/asset-management/assets/{assetUuid}/network-detail:
 *   get:
 *     summary: Get asset network details
 *     tags: [Asset Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset network details retrieved successfully
 *       404:
 *         description: Asset network details not found
 */
router.get('/assets/:assetUuid/network-detail',
  requireRole(['admin', 'user']),
  assetManagementController.getAssetNetworkDetail
);

/**
 * @swagger
 * /api/v1/asset-management/assets/{assetUuid}/vulnerabilities-summary:
 *   get:
 *     summary: Get asset vulnerabilities summary
 *     tags: [Asset Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset vulnerabilities summary retrieved successfully
 *       404:
 *         description: Asset vulnerabilities summary not found
 */
router.get('/assets/:assetUuid/vulnerabilities-summary',
  requireRole(['admin', 'user']),
  assetManagementController.getAssetVulnerabilitiesSummary
);

/**
 * @swagger
 * /api/v1/asset-management/assets/{assetUuid}/cost-summary:
 *   get:
 *     summary: Get asset cost summary
 *     tags: [Asset Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset cost summary retrieved successfully
 *       404:
 *         description: Asset cost summary not found
 */
router.get('/assets/:assetUuid/cost-summary',
  requireRole(['admin', 'user']),
  assetManagementController.getAssetCostSummary
);

/**
 * @swagger
 * /api/v1/asset-management/assets/{assetUuid}/tags-detail:
 *   get:
 *     summary: Get asset tags details
 *     tags: [Asset Details]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Asset tags retrieved successfully
 */
router.get('/assets/:assetUuid/tags-detail',
  requireRole(['admin', 'user']),
  assetManagementController.getAssetTagsDetail
);

module.exports = router;
