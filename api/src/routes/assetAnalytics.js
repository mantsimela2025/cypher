const express = require('express');
const assetAnalyticsController = require('../controllers/assetAnalyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== COST FORECASTING & BUDGETING ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-analytics/forecast/{assetUuid}:
 *   get:
 *     summary: Generate cost forecasts for an asset
 *     tags: [Asset Analytics - Forecasting]
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
 *         name: forecastMonths
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 60
 *           default: 12
 *       - in: query
 *         name: includeInflation
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: inflationRate
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 0.20
 *           default: 0.03
 *       - in: query
 *         name: confidenceLevel
 *         schema:
 *           type: number
 *           enum: [0.90, 0.95, 0.99]
 *           default: 0.95
 *     responses:
 *       200:
 *         description: Cost forecast generated successfully
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
 *                     forecasts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           forecastedCost:
 *                             type: number
 *                           lowerBound:
 *                             type: number
 *                           upperBound:
 *                             type: number
 *                     budgetRecommendations:
 *                       type: object
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/forecast/:assetUuid', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.generateCostForecast
);

/**
 * @swagger
 * /api/v1/asset-analytics/budget-plan:
 *   get:
 *     summary: Generate budget planning recommendations
 *     tags: [Asset Analytics - Budgeting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: costCenter
 *         schema:
 *           type: string
 *       - in: query
 *         name: budgetYear
 *         schema:
 *           type: integer
 *           minimum: 2020
 *           maximum: 2050
 *       - in: query
 *         name: includeCapex
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeOpex
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: riskBuffer
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 0.50
 *           default: 0.10
 *     responses:
 *       200:
 *         description: Budget plan generated successfully
 */
router.get('/budget-plan', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.generateBudgetPlan
);

// ==================== LIFECYCLE PLANNING & REPLACEMENT SCHEDULING ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-analytics/lifecycle-plan:
 *   get:
 *     summary: Generate comprehensive lifecycle planning analysis
 *     tags: [Asset Analytics - Lifecycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: planningHorizon
 *         schema:
 *           type: integer
 *           minimum: 12
 *           maximum: 120
 *           default: 60
 *       - in: query
 *         name: replacementThreshold
 *         schema:
 *           type: number
 *           minimum: 0.5
 *           maximum: 1.0
 *           default: 0.8
 *       - in: query
 *         name: includeRiskAssessment
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Lifecycle plan generated successfully
 */
router.get('/lifecycle-plan', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.generateLifecyclePlan
);

/**
 * @swagger
 * /api/v1/asset-analytics/replacement-schedule:
 *   get:
 *     summary: Optimize replacement scheduling with budget constraints
 *     tags: [Asset Analytics - Lifecycle]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: budgetConstraint
 *         schema:
 *           type: number
 *           minimum: 0
 *       - in: query
 *         name: prioritizeBy
 *         schema:
 *           type: string
 *           enum: [risk, cost, age]
 *           default: risk
 *       - in: query
 *         name: allowBudgetReallocation
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Replacement schedule optimized successfully
 */
router.get('/replacement-schedule', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.optimizeReplacementSchedule
);

// ==================== ROI & DEPRECIATION ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-analytics/roi/{assetUuid}:
 *   get:
 *     summary: Calculate Return on Investment (ROI) for an asset
 *     tags: [Asset Analytics - Financial]
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
 *         name: analysisMethod
 *         schema:
 *           type: string
 *           enum: [simple, comprehensive, npv]
 *           default: comprehensive
 *       - in: query
 *         name: discountRate
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 0.30
 *           default: 0.08
 *       - in: query
 *         name: timeHorizon
 *         schema:
 *           type: integer
 *           minimum: 12
 *           maximum: 120
 *           default: 60
 *     responses:
 *       200:
 *         description: ROI analysis completed successfully
 *       404:
 *         description: No cost data found for asset
 */
router.get('/roi/:assetUuid', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.calculateROI
);

/**
 * @swagger
 * /api/v1/asset-analytics/depreciation/{assetUuid}:
 *   get:
 *     summary: Calculate asset depreciation using multiple methods
 *     tags: [Asset Analytics - Financial]
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
 *         name: methods
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [straight_line, declining_balance, sum_of_years, units_of_production]
 *       - in: query
 *         name: decliningBalanceRate
 *         schema:
 *           type: number
 *           minimum: 0.05
 *           maximum: 0.50
 *           default: 0.20
 *       - in: query
 *         name: salvageValuePercent
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 0.50
 *           default: 0.10
 *     responses:
 *       200:
 *         description: Depreciation analysis completed successfully
 *       404:
 *         description: Insufficient data for depreciation calculation
 */
router.get('/depreciation/:assetUuid', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.calculateDepreciation
);

/**
 * @swagger
 * /api/v1/asset-analytics/financial-analysis/{assetUuid}:
 *   get:
 *     summary: Generate comprehensive financial analysis combining ROI and depreciation
 *     tags: [Asset Analytics - Financial]
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
 *         name: includeROI
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeDepreciation
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeTCO
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: analysisHorizon
 *         schema:
 *           type: integer
 *           minimum: 12
 *           maximum: 120
 *           default: 60
 *     responses:
 *       200:
 *         description: Financial analysis completed successfully
 */
router.get('/financial-analysis/:assetUuid', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.generateFinancialAnalysis
);

// ==================== DASHBOARD & SUMMARY ROUTES ====================

/**
 * @swagger
 * /api/v1/asset-analytics/dashboard:
 *   get:
 *     summary: Get analytics dashboard data
 *     tags: [Asset Analytics - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: costCenter
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [30d, 90d, 1y, 2y]
 *           default: 1y
 *       - in: query
 *         name: includeForecasts
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeLifecycle
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Analytics dashboard data retrieved successfully
 */
router.get('/dashboard', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.getAnalyticsDashboard
);

/**
 * @swagger
 * /api/v1/asset-analytics/portfolio-summary:
 *   get:
 *     summary: Get portfolio-wide analytics summary
 *     tags: [Asset Analytics - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portfolio summary retrieved successfully
 */
router.get('/portfolio-summary', 
  requireRole(['admin', 'user']),
  assetAnalyticsController.getPortfolioSummary
);

module.exports = router;
