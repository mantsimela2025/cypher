const aiPatchService = require('../services/aiPatchService');
const { body, param, query, validationResult } = require('express-validator');

class PatchAIController {

  // ==================== VALIDATION MIDDLEWARE ====================

  validatePatchIds() {
    return [
      body('patchIds').isArray({ min: 1 }).withMessage('Patch IDs array is required'),
      body('patchIds.*').isUUID().withMessage('Each patch ID must be valid UUID')
    ];
  }

  validateAssetUuids() {
    return [
      body('assetUuids').isArray({ min: 1 }).withMessage('Asset UUIDs array is required'),
      body('assetUuids.*').isUUID().withMessage('Each asset UUID must be valid')
    ];
  }

  validatePrioritizationCriteria() {
    return [
      body('criteria').optional().isObject().withMessage('Criteria must be object'),
      body('criteria.businessImpact').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid business impact'),
      body('criteria.technicalComplexity').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid technical complexity'),
      body('criteria.riskTolerance').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid risk tolerance'),
      body('criteria.maintenanceWindows').optional().isArray().withMessage('Maintenance windows must be array'),
      body('criteria.excludeRebootRequired').optional().isBoolean().withMessage('Exclude reboot required must be boolean')
    ];
  }

  validateRiskAssessmentParams() {
    return [
      body('assessmentType').optional().isIn(['comprehensive', 'quick', 'security_focused', 'compliance_focused']).withMessage('Invalid assessment type'),
      body('includeAssetAnalysis').optional().isBoolean().withMessage('Include asset analysis must be boolean'),
      body('includeVulnerabilityCorrelation').optional().isBoolean().withMessage('Include vulnerability correlation must be boolean'),
      body('riskFactors').optional().isArray().withMessage('Risk factors must be array')
    ];
  }

  validateDeploymentParams() {
    return [
      body('deploymentGoals').optional().isArray().withMessage('Deployment goals must be array'),
      body('deploymentGoals.*').optional().isIn(['minimize_downtime', 'maximize_security', 'ensure_compliance', 'optimize_resources']).withMessage('Invalid deployment goal'),
      body('constraints').optional().isObject().withMessage('Constraints must be object'),
      body('constraints.maxDowntime').optional().isInt({ min: 0 }).withMessage('Max downtime must be positive integer'),
      body('constraints.maintenanceWindows').optional().isArray().withMessage('Maintenance windows must be array'),
      body('constraints.excludeAssets').optional().isArray().withMessage('Exclude assets must be array'),
      body('preferredStrategy').optional().isIn(['rolling', 'blue_green', 'canary', 'all_at_once', 'phased']).withMessage('Invalid preferred strategy')
    ];
  }

  validateAnalysisQuery() {
    return [
      query('includeRecommendations').optional().isBoolean().withMessage('Include recommendations must be boolean'),
      query('includeRiskAssessment').optional().isBoolean().withMessage('Include risk assessment must be boolean'),
      query('includeImpactAnalysis').optional().isBoolean().withMessage('Include impact analysis must be boolean'),
      query('depth').optional().isIn(['basic', 'detailed', 'comprehensive']).withMessage('Invalid analysis depth')
    ];
  }

  validateUUID() {
    return [
      param('id').isUUID().withMessage('Invalid UUID format')
    ];
  }

  validateComplianceFrameworks() {
    return [
      body('frameworks').isArray({ min: 1 }).withMessage('Frameworks array is required'),
      body('frameworks.*').isIn(['soc2', 'iso27001', 'pci_dss', 'hipaa', 'gdpr', 'nist', 'cis']).withMessage('Invalid framework'),
      body('includeRecommendations').optional().isBoolean().withMessage('Include recommendations must be boolean')
    ];
  }

  // ==================== PATCH PRIORITIZATION ====================

  async prioritizePatches(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds, criteria } = req.body;
      const result = await aiPatchService.prioritizePatches(patchIds, criteria);
      
      res.json({
        message: 'Patches prioritized successfully',
        data: result
      });
    } catch (error) {
      console.error('Error prioritizing patches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPrioritizationRecommendations(req, res) {
    try {
      // Extract filters
      const filters = {};
      if (req.query.severity) {
        filters.severity = req.query.severity;
      }
      if (req.query.vendor) {
        filters.vendor = req.query.vendor;
      }
      if (req.query.type) {
        filters.type = req.query.type;
      }
      if (req.query.businessImpact) {
        filters.businessImpact = req.query.businessImpact;
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit);
      }

      const result = await aiPatchService.getPrioritizationRecommendations(filters);
      
      res.json({
        message: 'Prioritization recommendations retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting prioritization recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== RISK ASSESSMENT ====================

  async assessPatchRisk(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: patchId } = req.params;
      const { assessmentType, includeAssetAnalysis, includeVulnerabilityCorrelation, riskFactors } = req.body;

      const result = await aiPatchService.assessPatchRisk(
        patchId, 
        assessmentType, 
        includeAssetAnalysis, 
        includeVulnerabilityCorrelation, 
        riskFactors
      );
      
      res.json({
        message: 'Patch risk assessment completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error assessing patch risk:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async assessMultiplePatchRisk(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds, assessmentType, includeAssetAnalysis, includeVulnerabilityCorrelation, riskFactors } = req.body;

      const result = await aiPatchService.assessMultiplePatchRisk(
        patchIds, 
        assessmentType, 
        includeAssetAnalysis, 
        includeVulnerabilityCorrelation, 
        riskFactors
      );
      
      res.json({
        message: 'Multiple patch risk assessment completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error assessing multiple patch risk:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRiskTrends(req, res) {
    try {
      // Extract filters for risk trends
      const filters = {};
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }
      if (req.query.vendor) {
        filters.vendor = req.query.vendor;
      }
      if (req.query.severity) {
        filters.severity = req.query.severity;
      }

      const result = await aiPatchService.getRiskTrends(filters);
      
      res.json({
        message: 'Risk trends retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting risk trends:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DEPLOYMENT STRATEGY ====================

  async recommendDeploymentStrategy(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds, assetUuids, deploymentGoals, constraints, preferredStrategy } = req.body;

      const result = await aiPatchService.recommendDeploymentStrategy(
        patchIds, 
        assetUuids, 
        deploymentGoals, 
        constraints, 
        preferredStrategy
      );
      
      res.json({
        message: 'Deployment strategy recommended successfully',
        data: result
      });
    } catch (error) {
      console.error('Error recommending deployment strategy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async optimizeDeploymentPlan(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { deploymentPlan, optimizationGoals, constraints } = req.body;

      const result = await aiPatchService.optimizeDeploymentPlan(
        deploymentPlan, 
        optimizationGoals, 
        constraints
      );
      
      res.json({
        message: 'Deployment plan optimized successfully',
        data: result
      });
    } catch (error) {
      console.error('Error optimizing deployment plan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== PATCH ANALYSIS ====================

  async analyzePatch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: patchId } = req.params;
      const includeRecommendations = req.query.includeRecommendations === 'true';
      const includeRiskAssessment = req.query.includeRiskAssessment === 'true';
      const includeImpactAnalysis = req.query.includeImpactAnalysis === 'true';
      const depth = req.query.depth || 'detailed';

      const result = await aiPatchService.analyzePatch(
        patchId, 
        includeRecommendations, 
        includeRiskAssessment, 
        includeImpactAnalysis, 
        depth
      );
      
      res.json({
        message: 'Patch analysis completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error analyzing patch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async analyzePatches(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds } = req.body;
      const includeRecommendations = req.query.includeRecommendations === 'true';
      const includeRiskAssessment = req.query.includeRiskAssessment === 'true';
      const includeImpactAnalysis = req.query.includeImpactAnalysis === 'true';
      const depth = req.query.depth || 'detailed';

      const result = await aiPatchService.analyzePatches(
        patchIds, 
        includeRecommendations, 
        includeRiskAssessment, 
        includeImpactAnalysis, 
        depth
      );
      
      res.json({
        message: 'Patches analysis completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error analyzing patches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ASSET IMPACT ANALYSIS ====================

  async analyzeAssetImpact(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds, assetUuids } = req.body;
      const result = await aiPatchService.analyzeAssetImpact(patchIds, assetUuids);
      
      res.json({
        message: 'Asset impact analysis completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error analyzing asset impact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAssetRiskProfile(req, res) {
    try {
      const { assetUuid } = req.params;
      const includePatchRecommendations = req.query.includePatchRecommendations === 'true';

      const result = await aiPatchService.getAssetRiskProfile(assetUuid, includePatchRecommendations);
      
      res.json({
        message: 'Asset risk profile retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting asset risk profile:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== VULNERABILITY CORRELATION ====================

  async correlateVulnerabilities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds } = req.body;
      const result = await aiPatchService.correlateVulnerabilities(patchIds);
      
      res.json({
        message: 'Vulnerability correlation completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error correlating vulnerabilities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getVulnerabilityTrends(req, res) {
    try {
      // Extract filters for vulnerability trends
      const filters = {};
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }
      if (req.query.severity) {
        filters.severity = req.query.severity;
      }
      if (req.query.vendor) {
        filters.vendor = req.query.vendor;
      }

      const result = await aiPatchService.getVulnerabilityTrends(filters);
      
      res.json({
        message: 'Vulnerability trends retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting vulnerability trends:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== COMPLIANCE ANALYSIS ====================

  async analyzeCompliance(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds, frameworks, includeRecommendations } = req.body;

      const result = await aiPatchService.analyzeCompliance(
        patchIds, 
        frameworks, 
        includeRecommendations
      );
      
      res.json({
        message: 'Compliance analysis completed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error analyzing compliance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getComplianceGaps(req, res) {
    try {
      const { framework } = req.params;
      
      if (!['soc2', 'iso27001', 'pci_dss', 'hipaa', 'gdpr', 'nist', 'cis'].includes(framework)) {
        return res.status(400).json({ error: 'Invalid compliance framework' });
      }

      const result = await aiPatchService.getComplianceGaps(framework);
      
      res.json({
        message: 'Compliance gaps retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting compliance gaps:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== RECOMMENDATIONS & EXPLANATIONS ====================

  async getRecommendationExplanation(req, res) {
    try {
      const { recommendationId } = req.params;
      const includeDetails = req.query.includeDetails === 'true';

      const result = await aiPatchService.getRecommendationExplanation(
        parseInt(recommendationId), 
        includeDetails
      );
      
      if (!result) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }
      
      res.json({
        message: 'Recommendation explanation retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting recommendation explanation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async generateActionPlan(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { patchIds, priorities, constraints } = req.body;

      const result = await aiPatchService.generateActionPlan(patchIds, priorities, constraints);
      
      res.json({
        message: 'Action plan generated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error generating action plan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & INSIGHTS ====================

  async getAIInsights(req, res) {
    try {
      // Extract filters for AI insights
      const filters = {};
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }
      if (req.query.category) {
        filters.category = req.query.category;
      }
      if (req.query.priority) {
        filters.priority = req.query.priority;
      }

      const result = await aiPatchService.getAIInsights(filters);
      
      res.json({
        message: 'AI insights retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting AI insights:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPredictiveAnalytics(req, res) {
    try {
      // Extract parameters for predictive analytics
      const timeframe = req.query.timeframe || '30d';
      const includeRecommendations = req.query.includeRecommendations === 'true';

      const result = await aiPatchService.getPredictiveAnalytics(timeframe, includeRecommendations);
      
      res.json({
        message: 'Predictive analytics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting predictive analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== MODEL TRAINING & FEEDBACK ====================

  async provideFeedback(req, res) {
    try {
      const { recommendationId, feedback, rating, comments } = req.body;

      if (!recommendationId || !feedback || !rating) {
        return res.status(400).json({ error: 'Recommendation ID, feedback, and rating are required' });
      }

      if (![1, 2, 3, 4, 5].includes(rating)) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      const result = await aiPatchService.provideFeedback(
        recommendationId, 
        feedback, 
        rating, 
        comments, 
        req.user.id
      );
      
      res.json({
        message: 'Feedback provided successfully',
        data: result
      });
    } catch (error) {
      console.error('Error providing feedback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getModelMetrics(req, res) {
    try {
      const result = await aiPatchService.getModelMetrics();
      
      res.json({
        message: 'Model metrics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error getting model metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(req, res) {
    try {
      const result = await aiPatchService.healthCheck();
      
      res.json({
        message: 'AI service health check completed',
        data: result
      });
    } catch (error) {
      console.error('Error in AI service health check:', error);
      res.status(500).json({ error: 'AI service health check failed' });
    }
  }
}

module.exports = new PatchAIController();