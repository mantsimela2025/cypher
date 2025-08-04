const naturalLanguageQueryService = require('../services/naturalLanguageQueryService');
const Joi = require('joi');

class NaturalLanguageQueryController {

  // ==================== CORE NL QUERY ENDPOINTS ====================

  /**
   * Process natural language query with conversational AI
   */
  async processQuery(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        query: Joi.string().required().min(3).max(1000),
        conversationContext: Joi.object().default({}),
        includeVisualization: Joi.boolean().default(true),
        includeRecommendations: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const { query, conversationContext, includeVisualization, includeRecommendations } = value;
      const userId = req.user.id;

      console.log('🤖 Processing natural language query from user:', userId);

      // Process the natural language query
      const result = await naturalLanguageQueryService.processNaturalLanguageQuery(
        query, 
        userId, 
        conversationContext
      );

      // Filter response based on request options
      const response = {
        queryId: result.queryId,
        conversationalResponse: result.conversationalResponse,
        confidence: result.confidence,
        executionTime: result.executionTime,
        suggestedFollowUps: result.suggestedFollowUps
      };

      // Include data if requested (default: true for API consumers)
      if (req.query.includeData !== 'false') {
        response.data = result.data;
        response.summary = result.summary;
      }

      // Include visualization suggestions if requested
      if (includeVisualization && result.conversationalResponse?.dataVisualization) {
        response.visualization = result.conversationalResponse.dataVisualization;
      }

      // Include recommendations if requested
      if (includeRecommendations && result.conversationalResponse?.recommendations) {
        response.recommendations = result.conversationalResponse.recommendations;
      }

      res.json({
        message: 'Query processed successfully',
        data: response
      });

    } catch (error) {
      console.error('Error processing natural language query:', error);
      
      if (error.message.includes('Failed to generate SQL')) {
        return res.status(400).json({ 
          error: 'Unable to understand query', 
          message: 'Please try rephrasing your question or be more specific.',
          suggestions: [
            'Try asking about specific assets, vulnerabilities, or compliance status',
            'Include time ranges like "this month" or "last quarter"',
            'Be specific about what you want to know'
          ]
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Continue multi-turn conversation
   */
  async continueConversation(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        followUpQuery: Joi.string().required().min(3).max(1000),
        originalQueryId: Joi.number().integer().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const { followUpQuery, originalQueryId } = value;
      const userId = req.user.id;

      console.log('🔄 Continuing conversation for user:', userId);

      // Continue the conversation
      const result = await naturalLanguageQueryService.continueConversation(
        followUpQuery, 
        originalQueryId, 
        userId
      );

      res.json({
        message: 'Conversation continued successfully',
        data: {
          queryId: result.queryId,
          conversationalResponse: result.conversationalResponse,
          data: result.data,
          summary: result.summary,
          confidence: result.confidence,
          suggestedFollowUps: result.suggestedFollowUps,
          executionTime: result.executionTime
        }
      });

    } catch (error) {
      console.error('Error continuing conversation:', error);
      
      if (error.message.includes('Original query not found')) {
        return res.status(404).json({ 
          error: 'Original query not found',
          message: 'The conversation context could not be found. Please start a new query.'
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== QUERY MANAGEMENT ENDPOINTS ====================

  /**
   * Get user's query history
   */
  async getQueryHistory(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        limit: Joi.number().integer().min(1).max(100).default(20),
        status: Joi.string().valid('pending', 'processing', 'completed', 'failed', 'cancelled'),
        queryType: Joi.string().valid(
          'asset_search', 'cost_analysis', 'vulnerability_report', 
          'compliance_check', 'lifecycle_planning', 'operational_metrics', 
          'risk_assessment', 'general_query'
        )
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { limit, status, queryType } = value;
      const userId = req.user.id;

      // Get query history
      const queries = await naturalLanguageQueryService.getUserQueryHistory(userId, limit);

      // Filter by status and queryType if provided
      let filteredQueries = queries;
      if (status) {
        filteredQueries = filteredQueries.filter(q => q.status === status);
      }
      if (queryType) {
        filteredQueries = filteredQueries.filter(q => q.queryType === queryType);
      }

      res.json({
        message: 'Query history retrieved successfully',
        data: {
          queries: filteredQueries,
          total: filteredQueries.length,
          filters: { status, queryType, limit }
        }
      });

    } catch (error) {
      console.error('Error getting query history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Submit feedback for a query
   */
  async submitFeedback(req, res) {
    try {
      const { queryId } = req.params;

      // Validate request body
      const schema = Joi.object({
        feedback: Joi.string().valid(
          'helpful', 'not_helpful', 'partially_helpful', 'incorrect', 'needs_improvement'
        ).required(),
        comment: Joi.string().max(1000).allow('', null)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const { feedback, comment } = value;
      const userId = req.user.id;

      // Submit feedback
      const updatedQuery = await naturalLanguageQueryService.submitQueryFeedback(
        parseInt(queryId), 
        userId, 
        feedback, 
        comment
      );

      if (!updatedQuery) {
        return res.status(404).json({ 
          error: 'Query not found',
          message: 'The specified query could not be found or you do not have permission to provide feedback.'
        });
      }

      res.json({
        message: 'Feedback submitted successfully',
        data: {
          queryId: updatedQuery.id,
          feedback: updatedQuery.feedback,
          feedbackComment: updatedQuery.feedbackComment
        }
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & INSIGHTS ENDPOINTS ====================

  /**
   * Get query analytics and insights
   */
  async getQueryAnalytics(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        timeRange: Joi.string().valid('7d', '30d', '90d').default('30d'),
        includeUserStats: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { timeRange, includeUserStats } = value;

      // Get analytics (admin only for system-wide analytics)
      if (req.user.role !== 'admin' && includeUserStats) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: 'Only administrators can view system-wide analytics.'
        });
      }

      const analytics = await naturalLanguageQueryService.getQueryAnalytics(timeRange);

      res.json({
        message: 'Query analytics retrieved successfully',
        data: {
          timeRange,
          analytics,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error getting query analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== CONVERSATIONAL AI ENDPOINTS ====================

  /**
   * Get suggested queries based on user context
   */
  async getSuggestedQueries(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        category: Joi.string().valid(
          'vulnerability_management', 'compliance', 'risk_assessment', 
          'asset_management', 'trending'
        ),
        limit: Joi.number().integer().min(1).max(20).default(10)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { category, limit } = value;

      // Generate suggested queries based on category and user context
      const suggestions = this._generateSuggestedQueries(category, req.user, limit);

      res.json({
        message: 'Suggested queries retrieved successfully',
        data: {
          category,
          suggestions,
          userContext: {
            role: req.user.role,
            department: req.user.department
          }
        }
      });

    } catch (error) {
      console.error('Error getting suggested queries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get conversational AI capabilities and examples
   */
  async getAICapabilities(req, res) {
    try {
      const capabilities = {
        supportedQueryTypes: [
          {
            type: 'vulnerability_analysis',
            description: 'Analyze vulnerabilities across your environment',
            examples: [
              'Show me all critical vulnerabilities affecting our web servers',
              'What are the trending vulnerabilities this month?',
              'Which assets have the most high-severity vulnerabilities?'
            ]
          },
          {
            type: 'compliance_inquiries',
            description: 'Check compliance status and requirements',
            examples: [
              'What is our current NIST 800-53 compliance status?',
              'Which controls are not implemented?',
              'Show me compliance gaps that need immediate attention'
            ]
          },
          {
            type: 'risk_assessment',
            description: 'Assess and analyze security risks',
            examples: [
              'Which systems pose the highest risk to our organization?',
              'Show me risk trends over the last quarter',
              'What are the top risk factors in our environment?'
            ]
          },
          {
            type: 'remediation_tracking',
            description: 'Track remediation efforts and POAMs',
            examples: [
              'What is the status of POAMs due this month?',
              'Show me overdue remediation items',
              'How is our remediation progress trending?'
            ]
          },
          {
            type: 'executive_insights',
            description: 'Strategic insights for leadership',
            examples: [
              'How has our security posture improved over the last quarter?',
              'What are the key security metrics for the board report?',
              'Show me business impact of current security issues'
            ]
          }
        ],
        conversationalFeatures: [
          'Multi-turn conversations with context awareness',
          'Natural language to SQL conversion',
          'Executive-level summaries and insights',
          'Business impact analysis',
          'Actionable recommendations',
          'Data visualization suggestions'
        ],
        supportedTimeRanges: [
          'this week', 'last week', 'this month', 'last month',
          'this quarter', 'last quarter', 'this year', 'last year'
        ],
        supportedAssetTypes: [
          'web servers', 'database servers', 'workstations', 
          'network devices', 'mobile devices', 'cloud resources'
        ]
      };

      res.json({
        message: 'AI capabilities retrieved successfully',
        data: capabilities
      });

    } catch (error) {
      console.error('Error getting AI capabilities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== HELPER METHODS ====================

  _generateSuggestedQueries(category, user, limit) {
    const suggestions = {
      vulnerability_management: [
        'Show me all critical vulnerabilities in our environment',
        'What vulnerabilities were discovered this week?',
        'Which assets have the most vulnerabilities?',
        'Show me vulnerability trends over the past 3 months',
        'What are the top CVEs affecting our systems?'
      ],
      compliance: [
        'What is our current compliance status?',
        'Which controls need immediate attention?',
        'Show me POAMs due this month',
        'What are our compliance gaps?',
        'How is our NIST 800-53 implementation progressing?'
      ],
      risk_assessment: [
        'Which systems pose the highest risk?',
        'Show me our risk posture over time',
        'What are the top risk factors?',
        'Which assets need immediate attention?',
        'How has our risk profile changed?'
      ],
      asset_management: [
        'Show me all web servers in our environment',
        'Which assets are approaching end of life?',
        'What is our asset inventory status?',
        'Show me assets with outdated software',
        'Which systems need security updates?'
      ],
      trending: [
        'What are the trending security issues this month?',
        'Show me recent security incidents',
        'What vulnerabilities are trending in our industry?',
        'How is our security posture compared to last quarter?',
        'What are the emerging threats we should know about?'
      ]
    };

    const categoryQueries = suggestions[category] || suggestions.vulnerability_management;
    
    // Shuffle and limit results
    return categoryQueries
      .sort(() => 0.5 - Math.random())
      .slice(0, limit)
      .map((query, index) => ({
        id: index + 1,
        query,
        category,
        estimatedComplexity: this._estimateQueryComplexity(query)
      }));
  }

  _estimateQueryComplexity(query) {
    const complexKeywords = ['trend', 'over time', 'compare', 'analysis', 'correlation'];
    const simpleKeywords = ['show', 'list', 'what', 'which'];
    
    const hasComplexKeywords = complexKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );
    const hasSimpleKeywords = simpleKeywords.some(keyword => 
      query.toLowerCase().includes(keyword)
    );

    if (hasComplexKeywords) return 'complex';
    if (hasSimpleKeywords) return 'simple';
    return 'moderate';
  }
}

module.exports = new NaturalLanguageQueryController();
