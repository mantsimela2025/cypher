const aiCostOptimizationService = require('../services/aiCostOptimizationService');
const Joi = require('joi');

class AICostOptimizationController {

  // ==================== AI COST OPTIMIZATION ENDPOINTS ====================

  /**
   * Generate comprehensive AI-powered cost optimization recommendations
   */
  async generateOptimizationRecommendations(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        assetUuid: Joi.string().uuid(),
        costCenter: Joi.string().max(255),
        analysisDepth: Joi.string().valid('basic', 'comprehensive', 'deep').default('comprehensive'),
        optimizationGoals: Joi.array().items(
          Joi.string().valid('reduce_costs', 'improve_efficiency', 'minimize_risk', 'enhance_performance')
        ).default(['reduce_costs', 'improve_efficiency']),
        timeHorizon: Joi.number().integer().min(3).max(24).default(12),
        confidenceThreshold: Joi.number().min(0.1).max(1.0).default(0.7)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      console.log('🤖 Generating AI cost optimization recommendations...');
      const recommendations = await aiCostOptimizationService.generateCostOptimizationRecommendations(value);

      res.json({
        message: 'AI cost optimization analysis completed successfully',
        data: recommendations
      });

    } catch (error) {
      console.error('Error generating optimization recommendations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Perform real-time cost anomaly detection
   */
  async detectCostAnomalies(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        assetUuid: Joi.string().uuid(),
        costCenter: Joi.string().max(255),
        lookbackPeriod: Joi.number().integer().min(1).max(12).default(6),
        sensitivityLevel: Joi.string().valid('low', 'medium', 'high').default('medium'),
        alertThreshold: Joi.number().min(1.0).max(5.0).default(2.0)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      console.log('🔍 Detecting cost anomalies...');
      const anomalies = await aiCostOptimizationService.detectCostAnomalies(value);

      res.json({
        message: 'Cost anomaly detection completed successfully',
        data: anomalies
      });

    } catch (error) {
      console.error('Error detecting cost anomalies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate AI-powered cost optimization strategies
   */
  async generateOptimizationStrategies(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        portfolioScope: Joi.string().valid('all', 'cost_center', 'asset_type').default('all'),
        optimizationTarget: Joi.number().min(0.05).max(0.50).default(0.15), // 5-50% cost reduction
        riskTolerance: Joi.string().valid('low', 'medium', 'high').default('medium'),
        timeframe: Joi.string().valid('monthly', 'quarterly', 'annually').default('quarterly')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      console.log('📊 Generating optimization strategies...');
      const strategies = await aiCostOptimizationService.generateOptimizationStrategies(value);

      res.json({
        message: 'Cost optimization strategies generated successfully',
        data: strategies
      });

    } catch (error) {
      console.error('Error generating optimization strategies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate predictive cost model using machine learning
   */
  async generatePredictiveCostModel(req, res) {
    try {
      const { assetUuid } = req.params;

      // Validate query parameters
      const schema = Joi.object({
        modelType: Joi.string().valid('linear', 'polynomial', 'ensemble').default('ensemble'),
        predictionHorizon: Joi.number().integer().min(1).max(24).default(12),
        includeExternalFactors: Joi.boolean().default(true),
        validationSplit: Joi.number().min(0.1).max(0.4).default(0.2)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      console.log('🧠 Training predictive cost model...');
      const model = await aiCostOptimizationService.generatePredictiveCostModel({
        assetUuid,
        ...value
      });

      res.json({
        message: 'Predictive cost model generated successfully',
        data: model
      });

    } catch (error) {
      console.error('Error generating predictive cost model:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SPECIALIZED AI ANALYSIS ENDPOINTS ====================

  /**
   * Get AI-powered vendor optimization recommendations
   */
  async getVendorOptimization(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        costCenter: Joi.string().max(255),
        minSpend: Joi.number().min(0).default(1000),
        consolidationThreshold: Joi.number().min(0.1).max(0.5).default(0.15)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      // Generate full optimization recommendations and filter for vendor-specific ones
      const fullRecommendations = await aiCostOptimizationService.generateCostOptimizationRecommendations({
        costCenter: value.costCenter,
        optimizationGoals: ['reduce_costs'],
        confidenceThreshold: 0.6
      });

      // Filter for vendor-related recommendations
      const vendorRecommendations = fullRecommendations.recommendations.filter(rec => 
        rec.type === 'vendor_consolidation' || rec.category === 'procurement_optimization'
      );

      res.json({
        message: 'Vendor optimization analysis completed successfully',
        data: {
          analysisId: fullRecommendations.analysisId,
          generatedAt: fullRecommendations.generatedAt,
          vendorRecommendations,
          summary: {
            totalOpportunities: vendorRecommendations.length,
            totalPotentialSavings: vendorRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0),
            averageConfidence: vendorRecommendations.reduce((sum, rec) => sum + rec.confidence, 0) / vendorRecommendations.length
          }
        }
      });

    } catch (error) {
      console.error('Error in vendor optimization analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AI-powered license optimization recommendations
   */
  async getLicenseOptimization(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        costCenter: Joi.string().max(255),
        licenseType: Joi.string().valid('software', 'subscription', 'all').default('all'),
        utilizationThreshold: Joi.number().min(0.1).max(1.0).default(0.7)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      // Generate full optimization recommendations and filter for license-specific ones
      const fullRecommendations = await aiCostOptimizationService.generateCostOptimizationRecommendations({
        costCenter: value.costCenter,
        optimizationGoals: ['reduce_costs', 'improve_efficiency'],
        confidenceThreshold: 0.6
      });

      // Filter for license-related recommendations
      const licenseRecommendations = fullRecommendations.recommendations.filter(rec => 
        rec.type === 'license_optimization' || rec.category === 'software_optimization'
      );

      res.json({
        message: 'License optimization analysis completed successfully',
        data: {
          analysisId: fullRecommendations.analysisId,
          generatedAt: fullRecommendations.generatedAt,
          licenseRecommendations,
          summary: {
            totalOpportunities: licenseRecommendations.length,
            totalPotentialSavings: licenseRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0),
            averageROI: licenseRecommendations.reduce((sum, rec) => sum + (rec.roi || 0), 0) / licenseRecommendations.length
          }
        }
      });

    } catch (error) {
      console.error('Error in license optimization analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AI-powered operational efficiency recommendations
   */
  async getOperationalEfficiency(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        assetUuid: Joi.string().uuid(),
        costCenter: Joi.string().max(255),
        efficiencyMetrics: Joi.array().items(
          Joi.string().valid('power', 'space', 'network', 'storage', 'labor')
        ).default(['power', 'space']),
        benchmarkPeriod: Joi.number().integer().min(3).max(12).default(6)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      // Generate full optimization recommendations and filter for operational efficiency
      const fullRecommendations = await aiCostOptimizationService.generateCostOptimizationRecommendations({
        assetUuid: value.assetUuid,
        costCenter: value.costCenter,
        optimizationGoals: ['improve_efficiency'],
        confidenceThreshold: 0.6
      });

      // Filter for operational efficiency recommendations
      const efficiencyRecommendations = fullRecommendations.recommendations.filter(rec => 
        rec.category === 'operational_efficiency'
      );

      res.json({
        message: 'Operational efficiency analysis completed successfully',
        data: {
          analysisId: fullRecommendations.analysisId,
          generatedAt: fullRecommendations.generatedAt,
          efficiencyRecommendations,
          aiInsights: fullRecommendations.aiInsights,
          summary: {
            totalOpportunities: efficiencyRecommendations.length,
            totalPotentialSavings: efficiencyRecommendations.reduce((sum, rec) => sum + rec.potentialSavings, 0),
            optimizationScore: fullRecommendations.aiInsights.optimizationScore
          }
        }
      });

    } catch (error) {
      console.error('Error in operational efficiency analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== AI INSIGHTS & DASHBOARD ENDPOINTS ====================

  /**
   * Get AI-powered cost optimization dashboard
   */
  async getOptimizationDashboard(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        costCenter: Joi.string().max(255),
        timeRange: Joi.string().valid('30d', '90d', '6m', '1y').default('90d'),
        includeAnomalies: Joi.boolean().default(true),
        includeRecommendations: Joi.boolean().default(true),
        includeForecasts: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      console.log('📊 Generating AI optimization dashboard...');

      const dashboardData = {
        generatedAt: new Date(),
        timeRange: value.timeRange,
        costCenter: value.costCenter
      };

      // Get optimization recommendations if requested
      if (value.includeRecommendations) {
        const recommendations = await aiCostOptimizationService.generateCostOptimizationRecommendations({
          costCenter: value.costCenter,
          analysisDepth: 'basic',
          confidenceThreshold: 0.6
        });
        
        dashboardData.recommendations = {
          total: recommendations.recommendations.length,
          quickWins: recommendations.implementationPlan.phase1.recommendations.length,
          totalPotentialSavings: recommendations.potentialSavings.totalPotentialSavings,
          optimizationScore: recommendations.aiInsights.optimizationScore
        };
      }

      // Get anomalies if requested
      if (value.includeAnomalies) {
        const anomalies = await aiCostOptimizationService.detectCostAnomalies({
          costCenter: value.costCenter,
          lookbackPeriod: 3,
          sensitivityLevel: 'medium'
        });
        
        dashboardData.anomalies = {
          total: anomalies.anomalies.length,
          highSeverity: anomalies.summary.highSeverityCount,
          estimatedImpact: anomalies.summary.estimatedImpact
        };
      }

      res.json({
        message: 'AI optimization dashboard generated successfully',
        data: dashboardData
      });

    } catch (error) {
      console.error('Error generating optimization dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AI cost optimization insights summary
   */
  async getOptimizationInsights(req, res) {
    try {
      // Generate a comprehensive analysis for insights
      const insights = await aiCostOptimizationService.generateCostOptimizationRecommendations({
        analysisDepth: 'comprehensive',
        optimizationGoals: ['reduce_costs', 'improve_efficiency', 'minimize_risk'],
        confidenceThreshold: 0.5
      });

      // Extract key insights
      const keyInsights = {
        generatedAt: new Date(),
        optimizationPotential: {
          score: insights.aiInsights.optimizationScore,
          interpretation: this._interpretOptimizationScore(insights.aiInsights.optimizationScore),
          topOpportunities: insights.recommendations.slice(0, 3).map(rec => ({
            title: rec.title,
            potentialSavings: rec.potentialSavings,
            confidence: rec.confidence,
            effort: rec.effort
          }))
        },
        spendingPatterns: insights.aiInsights.spendingPatterns,
        anomalySummary: {
          totalDetected: insights.aiInsights.detectedAnomalies.length,
          categories: [...new Set(insights.aiInsights.detectedAnomalies.map(a => a.type))]
        },
        implementationRoadmap: {
          quickWins: insights.implementationPlan.phase1.totalSavings,
          mediumTerm: insights.implementationPlan.phase2.totalSavings,
          longTerm: insights.implementationPlan.phase3.totalSavings
        }
      };

      res.json({
        message: 'AI cost optimization insights generated successfully',
        data: keyInsights
      });

    } catch (error) {
      console.error('Error generating optimization insights:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== HELPER METHODS ====================

  _interpretOptimizationScore(score) {
    if (score >= 80) return 'Excellent optimization potential';
    if (score >= 60) return 'Good optimization opportunities';
    if (score >= 40) return 'Moderate optimization potential';
    if (score >= 20) return 'Limited optimization opportunities';
    return 'Minimal optimization potential';
  }
}

module.exports = new AICostOptimizationController();
