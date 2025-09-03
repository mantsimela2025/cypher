const express = require('express');
const patchAIController = require('../controllers/patchAIController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== PATCH PRIORITIZATION ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/prioritize:
 *   post:
 *     summary: Prioritize patches using AI
 *     tags: [Patch AI - Prioritization]
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
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               criteria:
 *                 type: object
 *                 properties:
 *                   businessImpact:
 *                     type: string
 *                     enum: [low, medium, high, critical]
 *                   technicalComplexity:
 *                     type: string
 *                     enum: [low, medium, high]
 *                   riskTolerance:
 *                     type: string
 *                     enum: [low, medium, high]
 *                   maintenanceWindows:
 *                     type: array
 *                   excludeRebootRequired:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Patches prioritized successfully
 */
router.post('/prioritize',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.validatePrioritizationCriteria(),
  patchAIController.prioritizePatches
);

/**
 * @swagger
 * /api/v1/patch-ai/prioritization-recommendations:
 *   get:
 *     summary: Get AI prioritization recommendations
 *     tags: [Patch AI - Prioritization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessImpact
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prioritization recommendations retrieved successfully
 */
router.get('/prioritization-recommendations',
  requireRole(['admin', 'user']),
  patchAIController.getPrioritizationRecommendations
);

// ==================== RISK ASSESSMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/risk-assessment/{id}:
 *   post:
 *     summary: Assess risk for a single patch
 *     tags: [Patch AI - Risk Assessment]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assessmentType:
 *                 type: string
 *                 enum: [comprehensive, quick, security_focused, compliance_focused]
 *                 default: comprehensive
 *               includeAssetAnalysis:
 *                 type: boolean
 *                 default: true
 *               includeVulnerabilityCorrelation:
 *                 type: boolean
 *                 default: true
 *               riskFactors:
 *                 type: array
 *     responses:
 *       200:
 *         description: Risk assessment completed successfully
 */
router.post('/risk-assessment/:id',
  requireRole(['admin', 'user']),
  patchAIController.validateUUID(),
  patchAIController.validateRiskAssessmentParams(),
  patchAIController.assessPatchRisk
);

/**
 * @swagger
 * /api/v1/patch-ai/risk-assessment/multiple:
 *   post:
 *     summary: Assess risk for multiple patches
 *     tags: [Patch AI - Risk Assessment]
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
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               assessmentType:
 *                 type: string
 *                 enum: [comprehensive, quick, security_focused, compliance_focused]
 *               includeAssetAnalysis:
 *                 type: boolean
 *               includeVulnerabilityCorrelation:
 *                 type: boolean
 *               riskFactors:
 *                 type: array
 *     responses:
 *       200:
 *         description: Multiple patch risk assessment completed successfully
 */
router.post('/risk-assessment/multiple',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.validateRiskAssessmentParams(),
  patchAIController.assessMultiplePatchRisk
);

/**
 * @swagger
 * /api/v1/patch-ai/risk-trends:
 *   get:
 *     summary: Get risk trends analysis
 *     tags: [Patch AI - Risk Assessment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Risk trends retrieved successfully
 */
router.get('/risk-trends',
  requireRole(['admin', 'user']),
  patchAIController.getRiskTrends
);

// ==================== DEPLOYMENT STRATEGY ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/deployment-strategy:
 *   post:
 *     summary: Get AI deployment strategy recommendations
 *     tags: [Patch AI - Deployment Strategy]
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
 *               - assetUuids
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               assetUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               deploymentGoals:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [minimize_downtime, maximize_security, ensure_compliance, optimize_resources]
 *               constraints:
 *                 type: object
 *                 properties:
 *                   maxDowntime:
 *                     type: integer
 *                   maintenanceWindows:
 *                     type: array
 *                   excludeAssets:
 *                     type: array
 *               preferredStrategy:
 *                 type: string
 *                 enum: [rolling, blue_green, canary, all_at_once, phased]
 *     responses:
 *       200:
 *         description: Deployment strategy recommended successfully
 */
router.post('/deployment-strategy',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.validateAssetUuids(),
  patchAIController.validateDeploymentParams(),
  patchAIController.recommendDeploymentStrategy
);

/**
 * @swagger
 * /api/v1/patch-ai/optimize-deployment:
 *   post:
 *     summary: Optimize existing deployment plan
 *     tags: [Patch AI - Deployment Strategy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deploymentPlan
 *             properties:
 *               deploymentPlan:
 *                 type: object
 *               optimizationGoals:
 *                 type: array
 *               constraints:
 *                 type: object
 *     responses:
 *       200:
 *         description: Deployment plan optimized successfully
 */
router.post('/optimize-deployment',
  requireRole(['admin', 'user']),
  patchAIController.optimizeDeploymentPlan
);

// ==================== PATCH ANALYSIS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/analyze/{id}:
 *   get:
 *     summary: Analyze a single patch
 *     tags: [Patch AI - Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeRiskAssessment
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeImpactAnalysis
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: depth
 *         schema:
 *           type: string
 *           enum: [basic, detailed, comprehensive]
 *           default: detailed
 *     responses:
 *       200:
 *         description: Patch analysis completed successfully
 */
router.get('/analyze/:id',
  requireRole(['admin', 'user']),
  patchAIController.validateUUID(),
  patchAIController.validateAnalysisQuery(),
  patchAIController.analyzePatch
);

/**
 * @swagger
 * /api/v1/patch-ai/analyze/multiple:
 *   post:
 *     summary: Analyze multiple patches
 *     tags: [Patch AI - Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeRiskAssessment
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeImpactAnalysis
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: depth
 *         schema:
 *           type: string
 *           enum: [basic, detailed, comprehensive]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patchIds
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Patches analysis completed successfully
 */
router.post('/analyze/multiple',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.validateAnalysisQuery(),
  patchAIController.analyzePatches
);

// ==================== ASSET IMPACT ANALYSIS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/asset-impact:
 *   post:
 *     summary: Analyze asset impact for patches
 *     tags: [Patch AI - Asset Impact]
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
 *               - assetUuids
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               assetUuids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Asset impact analysis completed successfully
 */
router.post('/asset-impact',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.validateAssetUuids(),
  patchAIController.analyzeAssetImpact
);

/**
 * @swagger
 * /api/v1/patch-ai/asset-risk-profile/{assetUuid}:
 *   get:
 *     summary: Get asset risk profile
 *     tags: [Patch AI - Asset Impact]
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
 *         name: includePatchRecommendations
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Asset risk profile retrieved successfully
 */
router.get('/asset-risk-profile/:assetUuid',
  requireRole(['admin', 'user']),
  patchAIController.getAssetRiskProfile
);

// ==================== VULNERABILITY CORRELATION ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/correlate-vulnerabilities:
 *   post:
 *     summary: Correlate vulnerabilities with patches
 *     tags: [Patch AI - Vulnerability Analysis]
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
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Vulnerability correlation completed successfully
 */
router.post('/correlate-vulnerabilities',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.correlateVulnerabilities
);

/**
 * @swagger
 * /api/v1/patch-ai/vulnerability-trends:
 *   get:
 *     summary: Get vulnerability trends
 *     tags: [Patch AI - Vulnerability Analysis]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vulnerability trends retrieved successfully
 */
router.get('/vulnerability-trends',
  requireRole(['admin', 'user']),
  patchAIController.getVulnerabilityTrends
);

// ==================== COMPLIANCE ANALYSIS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/compliance-analysis:
 *   post:
 *     summary: Analyze compliance for patches
 *     tags: [Patch AI - Compliance]
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
 *               - frameworks
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               frameworks:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [soc2, iso27001, pci_dss, hipaa, gdpr, nist, cis]
 *               includeRecommendations:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Compliance analysis completed successfully
 */
router.post('/compliance-analysis',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.validateComplianceFrameworks(),
  patchAIController.analyzeCompliance
);

/**
 * @swagger
 * /api/v1/patch-ai/compliance-gaps/{framework}:
 *   get:
 *     summary: Get compliance gaps for a framework
 *     tags: [Patch AI - Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: framework
 *         required: true
 *         schema:
 *           type: string
 *           enum: [soc2, iso27001, pci_dss, hipaa, gdpr, nist, cis]
 *     responses:
 *       200:
 *         description: Compliance gaps retrieved successfully
 *       400:
 *         description: Invalid compliance framework
 */
router.get('/compliance-gaps/:framework',
  requireRole(['admin', 'user']),
  patchAIController.getComplianceGaps
);

// ==================== RECOMMENDATIONS & EXPLANATIONS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/recommendation-explanation/{recommendationId}:
 *   get:
 *     summary: Get explanation for a recommendation
 *     tags: [Patch AI - Recommendations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recommendationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Recommendation explanation retrieved successfully
 *       404:
 *         description: Recommendation not found
 */
router.get('/recommendation-explanation/:recommendationId',
  requireRole(['admin', 'user']),
  patchAIController.getRecommendationExplanation
);

/**
 * @swagger
 * /api/v1/patch-ai/action-plan:
 *   post:
 *     summary: Generate action plan
 *     tags: [Patch AI - Recommendations]
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
 *             properties:
 *               patchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               priorities:
 *                 type: object
 *               constraints:
 *                 type: object
 *     responses:
 *       200:
 *         description: Action plan generated successfully
 */
router.post('/action-plan',
  requireRole(['admin', 'user']),
  patchAIController.validatePatchIds(),
  patchAIController.generateActionPlan
);

// ==================== ANALYTICS & INSIGHTS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/insights:
 *   get:
 *     summary: Get AI insights
 *     tags: [Patch AI - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI insights retrieved successfully
 */
router.get('/insights',
  requireRole(['admin', 'user']),
  patchAIController.getAIInsights
);

/**
 * @swagger
 * /api/v1/patch-ai/predictive-analytics:
 *   get:
 *     summary: Get predictive analytics
 *     tags: [Patch AI - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           default: 30d
 *       - in: query
 *         name: includeRecommendations
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Predictive analytics retrieved successfully
 */
router.get('/predictive-analytics',
  requireRole(['admin', 'user']),
  patchAIController.getPredictiveAnalytics
);

// ==================== MODEL TRAINING & FEEDBACK ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-ai/feedback:
 *   post:
 *     summary: Provide feedback on AI recommendation
 *     tags: [Patch AI - Feedback]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recommendationId
 *               - feedback
 *               - rating
 *             properties:
 *               recommendationId:
 *                 type: integer
 *               feedback:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback provided successfully
 */
router.post('/feedback',
  requireRole(['admin', 'user']),
  patchAIController.provideFeedback
);

/**
 * @swagger
 * /api/v1/patch-ai/model-metrics:
 *   get:
 *     summary: Get AI model metrics
 *     tags: [Patch AI - Model]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Model metrics retrieved successfully
 */
router.get('/model-metrics',
  requireRole(['admin']),
  patchAIController.getModelMetrics
);

// ==================== HEALTH CHECK ROUTE ====================

/**
 * @swagger
 * /api/v1/patch-ai/health:
 *   get:
 *     summary: AI service health check
 *     tags: [Patch AI - System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI service is healthy
 *       500:
 *         description: AI service health check failed
 */
router.get('/health',
  requireRole(['admin', 'user']),
  patchAIController.healthCheck
);

module.exports = router;