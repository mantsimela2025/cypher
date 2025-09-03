const express = require('express');
const assetController = require('../controllers/assetController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE ASSET CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/assets:
 *   post:
 *     summary: Create a new asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hostname
 *             properties:
 *               hostname:
 *                 type: string
 *                 maxLength: 255
 *                 example: "web-server-01"
 *               netbiosName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "WEBSRV01"
 *               systemId:
 *                 type: string
 *                 maxLength: 50
 *                 example: "SYS-001"
 *               hasAgent:
 *                 type: boolean
 *                 default: false
 *               hasPluginResults:
 *                 type: boolean
 *                 default: false
 *               exposureScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 1000
 *               acrScore:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 10
 *               criticalityRating:
 *                 type: string
 *                 enum: [low, moderate, high, critical]
 *               source:
 *                 type: string
 *                 maxLength: 50
 *                 default: "manual"
 *               operatingSystem:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Windows Server 2019"
 *               systemType:
 *                 type: string
 *                 maxLength: 100
 *                 example: "server"
 *               fqdn:
 *                 type: string
 *                 maxLength: 255
 *                 example: "web-server-01.company.com"
 *               ipv4Address:
 *                 type: string
 *                 format: ipv4
 *                 example: "192.168.1.100"
 *               macAddress:
 *                 type: string
 *                 pattern: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
 *                 example: "00:1B:44:11:3A:B7"
 *               networkType:
 *                 type: string
 *                 maxLength: 50
 *                 example: "ethernet"
 *     responses:
 *       201:
 *         description: Asset created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Asset with hostname already exists
 */
router.post('/',
  requireRole(['admin']),
  assetController.createAsset
);

/**
 * @swagger
 * /api/v1/assets:
 *   get:
 *     summary: Get assets with filtering and pagination
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [hostname, createdAt, updatedAt, lastSeen, firstSeen, exposureScore, acrScore, criticalityRating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: hostname
 *         schema:
 *           type: string
 *         description: Filter by hostname (partial match)
 *       - in: query
 *         name: criticalityRating
 *         schema:
 *           type: string
 *           enum: [low, moderate, high, critical]
 *       - in: query
 *         name: hasAgent
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: operatingSystem
 *         schema:
 *           type: string
 *         description: Filter by operating system (partial match)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across hostname, netbios name, OS, FQDN, and IP
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 */
router.get('/',
  requireRole(['admin', 'user']),
  assetController.getAssets
);

/**
 * @swagger
 * /api/v1/assets/search:
 *   get:
 *     summary: Search assets with advanced filtering
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid search query
 */
router.get('/search',
  requireRole(['admin', 'user']),
  assetController.searchAssets
);

/**
 * @swagger
 * /api/v1/assets/{assetUuid}:
 *   get:
 *     summary: Get a specific asset by UUID
 *     tags: [Assets]
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
 *         description: Asset retrieved successfully
 *       404:
 *         description: Asset not found
 */
router.get('/:assetUuid',
  requireRole(['admin', 'user']),
  assetController.getAssetById
);

/**
 * @swagger
 * /api/v1/assets/{assetUuid}:
 *   put:
 *     summary: Update an asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             properties:
 *               hostname:
 *                 type: string
 *                 maxLength: 255
 *               criticalityRating:
 *                 type: string
 *                 enum: [low, moderate, high, critical]
 *               operatingSystem:
 *                 type: string
 *                 maxLength: 255
 *               ipv4Address:
 *                 type: string
 *                 format: ipv4
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Asset with hostname already exists
 */
router.put('/:assetUuid',
  requireRole(['admin']),
  assetController.updateAsset
);

/**
 * @swagger
 * /api/v1/assets/{assetUuid}:
 *   delete:
 *     summary: Delete an asset
 *     tags: [Assets]
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
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force delete even if asset has related data
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 *       409:
 *         description: Asset has related data (use force=true to override)
 */
router.delete('/:assetUuid',
  requireRole(['admin']),
  assetController.deleteAsset
);

// ==================== BULK OPERATIONS ====================

/**
 * @swagger
 * /api/v1/assets/bulk/update:
 *   post:
 *     summary: Bulk update multiple assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetUuids
 *               - updates
 *             properties:
 *               assetUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 100
 *               updates:
 *                 type: object
 *                 properties:
 *                   criticalityRating:
 *                     type: string
 *                     enum: [low, moderate, high, critical]
 *                   hasAgent:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Assets updated successfully
 *       400:
 *         description: Validation error
 */
router.post('/bulk/update',
  requireRole(['admin']),
  assetController.bulkUpdateAssets
);

/**
 * @swagger
 * /api/v1/assets/bulk/delete:
 *   post:
 *     summary: Bulk delete multiple assets
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
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
 *                 minItems: 1
 *                 maxItems: 100
 *               force:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Assets deleted successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Some assets have related data
 */
router.post('/bulk/delete',
  requireRole(['admin']),
  assetController.bulkDeleteAssets
);

module.exports = router;
