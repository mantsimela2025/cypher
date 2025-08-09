const express = require('express');
const aiCostOptimizationController = require('../controllers/aiCostOptimizationController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== AI COST OPTIMIZATION ROUTES ====================

/**
 * @swagger
 * /api/v1/ai-cost-optimization/recommendations:
 *   get:
 *     summary: Generate comprehensive AI-powered cost optimization recommendations
 *     tags: [AI Cost Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetUuid
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: costCenter
 *         schema:
 *           type: string
 *       - in: query
 *         name: analysisDepth
 *         schema:
 *           type: string
 *           enum: [basic, comprehensive, deep]
 *           default: comprehensive
 *       - in: query
 *         name: optimizationGoals
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [reduce_costs, improve_efficiency, minimize_risk, enhance_performance]
 *       - in: query
 *         name: timeHorizon
 *         schema:
 *           type: integer
 *           minimum: 3
 *           maximum: 24
 *           default: 12
 *       - in: query
 *         name: confidenceThreshold
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 1.0
 *           default: 0.7
 *     responses:
 *       200:
 *         description: AI cost optimization analysis completed successfully
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
 *                     analysisId:
 *                       type: string
 *                     aiInsights:
 *                       type: object
 *                       properties:
 *                         optimizationScore:
 *                           type: integer
 *                         spendingPatterns:
 *                           type: array
 *                         detectedAnomalies:
 *                           type: array
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           title:
 *                             type: string
 *                           potentialSavings:
 *                             type: number
 *                           confidence:
 *                             type: number
 *                           aiScore:
 *                             type: number
 *                     potentialSavings:
 *                       type: object
 *                       properties:
 *                         totalPotentialSavings:
 *                           type: number
 *                         netSavings:
 *                           type: number
 *                         roi:
 *                           type: number
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.generateOptimizationRecommendations
);

/**
 * @swagger
 * /api/v1/ai-cost-optimization/anomalies:
 *   get:
 *     summary: Perform real-time cost anomaly detection using AI
 *     tags: [AI Cost Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetUuid
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: costCenter
 *         schema:
 *           type: string
 *       - in: query
 *         name: lookbackPeriod
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           default: 6
 *       - in: query
 *         name: sensitivityLevel
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *       - in: query
 *         name: alertThreshold
 *         schema:
 *           type: number
 *           minimum: 1.0
 *           maximum: 5.0
 *           default: 2.0
 *     responses:
 *       200:
 *         description: Cost anomaly detection completed successfully
 */
router.get('/anomalies', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.detectCostAnomalies
);

/**
 * @swagger
 * /api/v1/ai-cost-optimization/strategies:
 *   get:
 *     summary: Generate AI-powered cost optimization strategies
 *     tags: [AI Cost Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: portfolioScope
 *         schema:
 *           type: string
 *           enum: [all, cost_center, asset_type]
 *           default: all
 *       - in: query
 *         name: optimizationTarget
 *         schema:
 *           type: number
 *           minimum: 0.05
 *           maximum: 0.50
 *           default: 0.15
 *       - in: query
 *         name: riskTolerance
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *           default: medium
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, annually]
 *           default: quarterly
 *     responses:
 *       200:
 *         description: Cost optimization strategies generated successfully
 */
router.get('/strategies', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.generateOptimizationStrategies
);

/**
 * @swagger
 * /api/v1/ai-cost-optimization/predictive-model/{assetUuid}:
 *   get:
 *     summary: Generate predictive cost model using machine learning
 *     tags: [AI Cost Optimization]
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
 *         name: modelType
 *         schema:
 *           type: string
 *           enum: [linear, polynomial, ensemble]
 *           default: ensemble
 *       - in: query
 *         name: predictionHorizon
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 12
 *       - in: query
 *         name: includeExternalFactors
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: validationSplit
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 0.4
 *           default: 0.2
 *     responses:
 *       200:
 *         description: Predictive cost model generated successfully
 */
router.get('/predictive-model/:assetUuid', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.generatePredictiveCostModel
);

// ==================== SPECIALIZED AI ANALYSIS ROUTES ====================

/**
 * @swagger
 * /api/v1/ai-cost-optimization/vendor-optimization:
 *   get:
 *     summary: Get AI-powered vendor optimization recommendations
 *     tags: [AI Cost Optimization - Specialized]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: costCenter
 *         schema:
 *           type: string
 *       - in: query
 *         name: minSpend
 *         schema:
 *           type: number
 *           minimum: 0
 *           default: 1000
 *       - in: query
 *         name: consolidationThreshold
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 0.5
 *           default: 0.15
 *     responses:
 *       200:
 *         description: Vendor optimization analysis completed successfully
 */
router.get('/vendor-optimization', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.getVendorOptimization
);

/**
 * @swagger
 * /api/v1/ai-cost-optimization/license-optimization:
 *   get:
 *     summary: Get AI-powered license optimization recommendations
 *     tags: [AI Cost Optimization - Specialized]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: costCenter
 *         schema:
 *           type: string
 *       - in: query
 *         name: licenseType
 *         schema:
 *           type: string
 *           enum: [software, subscription, all]
 *           default: all
 *       - in: query
 *         name: utilizationThreshold
 *         schema:
 *           type: number
 *           minimum: 0.1
 *           maximum: 1.0
 *           default: 0.7
 *     responses:
 *       200:
 *         description: License optimization analysis completed successfully
 */
router.get('/license-optimization', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.getLicenseOptimization
);

/**
 * @swagger
 * /api/v1/ai-cost-optimization/operational-efficiency:
 *   get:
 *     summary: Get AI-powered operational efficiency recommendations
 *     tags: [AI Cost Optimization - Specialized]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetUuid
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: costCenter
 *         schema:
 *           type: string
 *       - in: query
 *         name: efficiencyMetrics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [power, space, network, storage, labor]
 *       - in: query
 *         name: benchmarkPeriod
 *         schema:
 *           type: integer
 *           minimum: 3
 *           maximum: 12
 *           default: 6
 *     responses:
 *       200:
 *         description: Operational efficiency analysis completed successfully
 */
router.get('/operational-efficiency', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.getOperationalEfficiency
);

// ==================== AI INSIGHTS & DASHBOARD ROUTES ====================

/**
 * @swagger
 * /api/v1/ai-cost-optimization/dashboard:
 *   get:
 *     summary: Get AI-powered cost optimization dashboard
 *     tags: [AI Cost Optimization - Dashboard]
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
 *           enum: [30d, 90d, 6m, 1y]
 *           default: 90d
 *       - in: query
 *         name: includeAnomalies
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeForecasts
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: AI optimization dashboard generated successfully
 */
router.get('/dashboard', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.getOptimizationDashboard
);

/**
 * @swagger
 * /api/v1/ai-cost-optimization/insights:
 *   get:
 *     summary: Get AI cost optimization insights summary
 *     tags: [AI Cost Optimization - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI cost optimization insights generated successfully
 */
router.get('/insights', 
  requirePermission('ai_cost_optimization', 'read'),
  aiCostOptimizationController.getOptimizationInsights
);

module.exports = router;
