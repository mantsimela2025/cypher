const assetAnalyticsService = require('../services/assetAnalyticsService');
const Joi = require('joi');

class AssetAnalyticsController {

  // ==================== COST FORECASTING & BUDGETING ====================

  /**
   * Generate cost forecasts for assets
   */
  async generateCostForecast(req, res) {
    try {
      const { assetUuid } = req.params;
      
      // Validate query parameters
      const schema = Joi.object({
        forecastMonths: Joi.number().integer().min(1).max(60).default(12),
        includeInflation: Joi.boolean().default(true),
        inflationRate: Joi.number().min(0).max(0.20).default(0.03),
        confidenceLevel: Joi.number().valid(0.90, 0.95, 0.99).default(0.95)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const forecast = await assetAnalyticsService.generateCostForecast({
        assetUuid,
        ...value
      });

      res.json({
        message: 'Cost forecast generated successfully',
        data: forecast
      });

    } catch (error) {
      console.error('Error generating cost forecast:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate budget planning recommendations
   */
  async generateBudgetPlan(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        costCenter: Joi.string().max(255),
        budgetYear: Joi.number().integer().min(2020).max(2050).default(new Date().getFullYear() + 1),
        includeCapex: Joi.boolean().default(true),
        includeOpex: Joi.boolean().default(true),
        riskBuffer: Joi.number().min(0).max(0.50).default(0.10)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const budgetPlan = await assetAnalyticsService.generateBudgetPlan(value);

      res.json({
        message: 'Budget plan generated successfully',
        data: budgetPlan
      });

    } catch (error) {
      console.error('Error generating budget plan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== LIFECYCLE PLANNING & REPLACEMENT SCHEDULING ====================

  /**
   * Generate comprehensive lifecycle planning analysis
   */
  async generateLifecyclePlan(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        planningHorizon: Joi.number().integer().min(12).max(120).default(60),
        replacementThreshold: Joi.number().min(0.5).max(1.0).default(0.8),
        includeRiskAssessment: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const lifecyclePlan = await assetAnalyticsService.generateLifecyclePlan(value);

      res.json({
        message: 'Lifecycle plan generated successfully',
        data: lifecyclePlan
      });

    } catch (error) {
      console.error('Error generating lifecycle plan:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Optimize replacement scheduling with budget constraints
   */
  async optimizeReplacementSchedule(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        budgetConstraint: Joi.number().min(0),
        prioritizeBy: Joi.string().valid('risk', 'cost', 'age').default('risk'),
        allowBudgetReallocation: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const optimizedSchedule = await assetAnalyticsService.optimizeReplacementSchedule(value);

      res.json({
        message: 'Replacement schedule optimized successfully',
        data: optimizedSchedule
      });

    } catch (error) {
      console.error('Error optimizing replacement schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ROI & DEPRECIATION CALCULATIONS ====================

  /**
   * Calculate Return on Investment (ROI) for an asset
   */
  async calculateROI(req, res) {
    try {
      const { assetUuid } = req.params;
      
      // Validate query parameters
      const schema = Joi.object({
        analysisMethod: Joi.string().valid('simple', 'comprehensive', 'npv').default('comprehensive'),
        discountRate: Joi.number().min(0).max(0.30).default(0.08),
        includeOpportunityValue: Joi.boolean().default(true),
        timeHorizon: Joi.number().integer().min(12).max(120).default(60)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const roiAnalysis = await assetAnalyticsService.calculateROI(assetUuid, value);

      res.json({
        message: 'ROI analysis completed successfully',
        data: roiAnalysis
      });

    } catch (error) {
      console.error('Error calculating ROI:', error);
      if (error.message.includes('No cost data found')) {
        return res.status(404).json({ error: 'No cost data found for asset' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Calculate asset depreciation using multiple methods
   */
  async calculateDepreciation(req, res) {
    try {
      const { assetUuid } = req.params;
      
      // Validate query parameters
      const schema = Joi.object({
        methods: Joi.array().items(
          Joi.string().valid('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production')
        ).default(['straight_line', 'declining_balance']),
        decliningBalanceRate: Joi.number().min(0.05).max(0.50).default(0.20),
        salvageValuePercent: Joi.number().min(0).max(0.50).default(0.10)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const depreciationAnalysis = await assetAnalyticsService.calculateDepreciation(assetUuid, value);

      res.json({
        message: 'Depreciation analysis completed successfully',
        data: depreciationAnalysis
      });

    } catch (error) {
      console.error('Error calculating depreciation:', error);
      if (error.message.includes('Insufficient data')) {
        return res.status(404).json({ error: 'Insufficient data for depreciation calculation' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Generate comprehensive financial analysis combining ROI and depreciation
   */
  async generateFinancialAnalysis(req, res) {
    try {
      const { assetUuid } = req.params;
      
      // Validate query parameters
      const schema = Joi.object({
        includeROI: Joi.boolean().default(true),
        includeDepreciation: Joi.boolean().default(true),
        includeTCO: Joi.boolean().default(true),
        analysisHorizon: Joi.number().integer().min(12).max(120).default(60)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const financialAnalysis = await assetAnalyticsService.generateFinancialAnalysis(assetUuid, value);

      res.json({
        message: 'Financial analysis completed successfully',
        data: financialAnalysis
      });

    } catch (error) {
      console.error('Error generating financial analysis:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DASHBOARD & SUMMARY ANALYTICS ====================

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        costCenter: Joi.string().max(255),
        timeRange: Joi.string().valid('30d', '90d', '1y', '2y').default('1y'),
        includeForecasts: Joi.boolean().default(true),
        includeLifecycle: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      // Generate dashboard data by combining multiple analytics
      const dashboardData = {
        generatedAt: new Date(),
        timeRange: value.timeRange,
        costCenter: value.costCenter
      };

      // Add budget plan if requested
      if (value.includeForecasts) {
        dashboardData.budgetPlan = await assetAnalyticsService.generateBudgetPlan({
          costCenter: value.costCenter
        });
      }

      // Add lifecycle plan if requested
      if (value.includeLifecycle) {
        dashboardData.lifecyclePlan = await assetAnalyticsService.generateLifecyclePlan({
          planningHorizon: value.timeRange === '2y' ? 24 : 12
        });
      }

      res.json({
        message: 'Analytics dashboard data retrieved successfully',
        data: dashboardData
      });

    } catch (error) {
      console.error('Error generating analytics dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get portfolio-wide analytics summary
   */
  async getPortfolioSummary(req, res) {
    try {
      // This would aggregate analytics across all assets
      const summary = {
        generatedAt: new Date(),
        message: 'Portfolio analytics summary',
        note: 'This endpoint would aggregate data across all assets in the portfolio'
      };

      res.json({
        message: 'Portfolio summary retrieved successfully',
        data: summary
      });

    } catch (error) {
      console.error('Error generating portfolio summary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AssetAnalyticsController();
