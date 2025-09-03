/**
 * RMF AI Controller
 * Handles AI-powered RMF operations following CYPHER API best practices
 */

const { validationResult } = require('express-validator');
const rmfAIService = require('../../services/ai/rmfAIService');

class AIController {
  /**
   * AI-powered system categorization
   * POST /api/rmf/ai/categorize
   */
  async categorizeSystem(req, res, next) {
    try {
      // ✅ Validation check (following best practices)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const systemData = req.body;
      const userId = req.user?.id;

      console.log(`🤖 AI Categorization request for system: ${systemData.name}`);

      // Perform AI categorization
      const categorizationResult = await rmfAIService.categorizeSystem(systemData);

      // Save results if systemId provided
      let savedResult = null;
      if (systemData.systemId) {
        savedResult = await rmfAIService.saveCategorization(
          systemData.systemId, 
          categorizationResult, 
          userId
        );
      }

      // ✅ Standard success response format
      res.status(200).json({
        success: true,
        data: {
          categorization: categorizationResult,
          saved: savedResult ? true : false,
          savedId: savedResult?.id || null
        },
        message: 'System categorization completed successfully'
      });

    } catch (error) {
      console.error('❌ AI categorization error:', error.message);
      
      // ✅ Let global error handler manage it (following best practices)
      next(error);
    }
  }

  /**
   * Get categorization history for a system
   * GET /api/rmf/ai/categorization-history/:systemId
   */
  async getCategorizationHistory(req, res, next) {
    try {
      const { systemId } = req.params;

      if (!systemId) {
        return res.status(400).json({
          success: false,
          message: 'System ID is required'
        });
      }

      const history = await rmfAIService.getCategorizationHistory(systemId);

      // ✅ Standard success response format
      res.status(200).json({
        success: true,
        data: history,
        message: 'Categorization history retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Get categorization history error:', error.message);
      next(error);
    }
  }

  /**
   * AI service health check
   * GET /api/rmf/ai/health
   */
  async healthCheck(req, res, next) {
    try {
      const healthStatus = await rmfAIService.healthCheck();

      const statusCode = healthStatus.status === 'healthy' ? 200 : 503;

      res.status(statusCode).json({
        success: healthStatus.status === 'healthy',
        data: healthStatus,
        message: `AI service is ${healthStatus.status}`
      });

    } catch (error) {
      console.error('❌ AI health check error:', error.message);
      next(error);
    }
  }

  /**
   * Get AI service statistics
   * GET /api/rmf/ai/stats
   */
  async getAIStats(req, res, next) {
    try {
      const timeframe = req.query.timeframe || '24 hours';
      const stats = await rmfAIService.getAIStats(timeframe);

      // ✅ Standard success response format
      res.status(200).json({
        success: true,
        data: {
          timeframe,
          statistics: stats
        },
        message: 'AI statistics retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Get AI stats error:', error.message);
      next(error);
    }
  }

  /**
   * Test AI service with sample data
   * POST /api/rmf/ai/test
   */
  async testAI(req, res, next) {
    try {
      // Sample system data for testing
      const testSystemData = {
        name: 'Test System',
        description: 'A test system for AI categorization validation',
        dataTypes: ['Business Confidential', 'Customer Data'],
        businessProcesses: ['Customer Service', 'Data Processing'],
        environment: 'Cloud',
        userBase: 'Internal employees and external customers'
      };

      console.log('🧪 Running AI test categorization...');

      const result = await rmfAIService.categorizeSystem(testSystemData);

      // ✅ Standard success response format
      res.status(200).json({
        success: true,
        data: {
          testData: testSystemData,
          result: result
        },
        message: 'AI test completed successfully'
      });

    } catch (error) {
      console.error('❌ AI test error:', error.message);
      next(error);
    }
  }
}

module.exports = new AIController();
