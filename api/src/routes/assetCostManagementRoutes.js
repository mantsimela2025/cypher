const express = require('express');
const router = express.Router();
const assetCostManagementController = require('../controllers/assetCostManagementController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AssetCostManagement:
 *       type: object
 *       required:
 *         - assetUuid
 *         - costType
 *         - amount
 *         - currency
 *         - billingCycle
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated unique identifier
 *         assetUuid:
 *           type: string
 *           format: uuid
 *           description: UUID of the associated asset
 *         costType:
 *           type: string
 *           enum: [acquisition, operational, maintenance, licensing, support, training, disposal]
 *           description: Type of cost
 *         amount:
 *           type: number
 *           format: decimal
 *           description: Cost amount
 *         currency:
 *           type: string
 *           default: USD
 *           description: Currency code
 *         billingCycle:
 *           type: string
 *           enum: [one_time, monthly, quarterly, annual, custom]
 *           description: Billing cycle
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of the cost period
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date of the cost period
 *         vendor:
 *           type: string
 *           description: Vendor name
 *         contractNumber:
 *           type: string
 *           description: Contract number
 *         purchaseOrder:
 *           type: string
 *           description: Purchase order number
 *         invoiceNumber:
 *           type: string
 *           description: Invoice number
 *         costCenter:
 *           type: string
 *           description: Cost center
 *         budgetCode:
 *           type: string
 *           description: Budget code
 *         notes:
 *           type: string
 *           description: Additional notes
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *           description: File attachments
 *         metadata:
 *           type: object
 *           description: Additional metadata
 *         createdBy:
 *           type: integer
 *           description: ID of user who created the record
 *         lastModifiedBy:
 *           type: integer
 *           description: ID of user who last modified the record
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */

/**
 * @swagger
 * /api/v1/asset-management/costs:
 *   get:
 *     summary: Get all cost records with optional filters
 *     tags: [Asset Cost Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetUuid
 *         schema:
 *           type: string
 *         description: Filter by asset UUID
 *       - in: query
 *         name: costType
 *         schema:
 *           type: string
 *           enum: [acquisition, operational, maintenance, licensing, support, training, disposal]
 *         description: Filter by cost type
 *       - in: query
 *         name: billingCycle
 *         schema:
 *           type: string
 *           enum: [one_time, monthly, quarterly, annual, custom]
 *         description: Filter by billing cycle
 *     responses:
 *       200:
 *         description: Cost records retrieved successfully
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
 *                     $ref: '#/components/schemas/AssetCostManagement'
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/', authenticateToken, assetCostManagementController.getAllCosts);

/**
 * @swagger
 * /api/v1/asset-management/costs/{id}:
 *   get:
 *     summary: Get a specific cost record by ID
 *     tags: [Asset Cost Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cost record ID
 *     responses:
 *       200:
 *         description: Cost record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssetCostManagement'
 *                 message:
 *                   type: string
 *       404:
 *         description: Cost record not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', authenticateToken, assetCostManagementController.getCostById);

/**
 * @swagger
 * /api/v1/asset-management/costs/asset/{assetUuid}:
 *   get:
 *     summary: Get all cost records for a specific asset
 *     tags: [Asset Cost Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset UUID
 *     responses:
 *       200:
 *         description: Cost records retrieved successfully
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
 *                     $ref: '#/components/schemas/AssetCostManagement'
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/asset/:assetUuid', authenticateToken, assetCostManagementController.getCostsByAssetUuid);

/**
 * @swagger
 * /api/v1/asset-management/costs/asset/{assetUuid}/summary:
 *   get:
 *     summary: Get cost summary for a specific asset
 *     tags: [Asset Cost Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetUuid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Asset UUID
 *     responses:
 *       200:
 *         description: Cost summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCosts:
 *                       type: number
 *                     costsByType:
 *                       type: object
 *                     costsByBillingCycle:
 *                       type: object
 *                     recordCount:
 *                       type: integer
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get('/asset/:assetUuid/summary', authenticateToken, assetCostManagementController.getCostSummary);

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
 *             $ref: '#/components/schemas/AssetCostManagement'
 *     responses:
 *       201:
 *         description: Cost record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssetCostManagement'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, assetCostManagementController.createCost);

/**
 * @swagger
 * /api/v1/asset-management/costs/{id}:
 *   put:
 *     summary: Update an existing cost record
 *     tags: [Asset Cost Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Cost record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssetCostManagement'
 *     responses:
 *       200:
 *         description: Cost record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssetCostManagement'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Cost record not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateToken, assetCostManagementController.updateCost);

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
 *         description: Cost record ID
 *     responses:
 *       200:
 *         description: Cost record deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AssetCostManagement'
 *                 message:
 *                   type: string
 *       404:
 *         description: Cost record not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', authenticateToken, assetCostManagementController.deleteCost);

module.exports = router;
