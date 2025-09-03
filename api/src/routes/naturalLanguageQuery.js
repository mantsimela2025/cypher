const express = require('express');
const naturalLanguageQueryController = require('../controllers/naturalLanguageQueryController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE NL QUERY ROUTES ====================

/**
 * @swagger
 * /api/v1/nl-query/process:
 *   post:
 *     summary: Process natural language query with conversational AI
 *     tags: [Natural Language Query - Core]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 1000
 *                 example: "Show me all critical vulnerabilities affecting our web servers"
 *               conversationContext:
 *                 type: object
 *                 description: Context from previous conversation turns
 *                 example: {}
 *               includeVisualization:
 *                 type: boolean
 *                 default: true
 *                 description: Include data visualization suggestions
 *               includeRecommendations:
 *                 type: boolean
 *                 default: true
 *                 description: Include actionable recommendations
 *     parameters:
 *       - in: query
 *         name: includeData
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'true'
 *         description: Include raw data in response
 *     responses:
 *       200:
 *         description: Query processed successfully
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
 *                     queryId:
 *                       type: integer
 *                     conversationalResponse:
 *                       type: object
 *                       properties:
 *                         mainResponse:
 *                           type: string
 *                         insights:
 *                           type: array
 *                           items:
 *                             type: string
 *                         businessImpact:
 *                           type: string
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: object
 *                         executiveSummary:
 *                           type: string
 *                     confidence:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 1
 *                     executionTime:
 *                       type: number
 *                     suggestedFollowUps:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid request or unable to understand query
 *       401:
 *         description: Unauthorized
 */
router.post('/process', 
  requireRole(['admin']),
  naturalLanguageQueryController.processQuery
);

/**
 * @swagger
 * /api/v1/nl-query/continue:
 *   post:
 *     summary: Continue multi-turn conversation
 *     tags: [Natural Language Query - Core]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - followUpQuery
 *               - originalQueryId
 *             properties:
 *               followUpQuery:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 1000
 *                 example: "Which of these vulnerabilities affect our most critical systems?"
 *               originalQueryId:
 *                 type: integer
 *                 example: 123
 *     responses:
 *       200:
 *         description: Conversation continued successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Original query not found
 *       401:
 *         description: Unauthorized
 */
router.post('/continue', 
  requireRole(['admin']),
  naturalLanguageQueryController.continueConversation
);

// ==================== QUERY MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/nl-query/history:
 *   get:
 *     summary: Get user's query history
 *     tags: [Natural Language Query - Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled]
 *       - in: query
 *         name: queryType
 *         schema:
 *           type: string
 *           enum: [asset_search, cost_analysis, vulnerability_report, compliance_check, lifecycle_planning, operational_metrics, risk_assessment, general_query]
 *     responses:
 *       200:
 *         description: Query history retrieved successfully
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
 *                     queries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           query:
 *                             type: string
 *                           status:
 *                             type: string
 *                           queryType:
 *                             type: string
 *                           confidence:
 *                             type: number
 *                           executionTime:
 *                             type: number
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/history', 
  requireRole(['admin', 'user']),
  naturalLanguageQueryController.getQueryHistory
);

/**
 * @swagger
 * /api/v1/nl-query/{queryId}/feedback:
 *   post:
 *     summary: Submit feedback for a query
 *     tags: [Natural Language Query - Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: queryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback
 *             properties:
 *               feedback:
 *                 type: string
 *                 enum: [helpful, not_helpful, partially_helpful, incorrect, needs_improvement]
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "The response was helpful but could include more specific recommendations"
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Query not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:queryId/feedback', 
  requireRole(['admin']),
  naturalLanguageQueryController.submitFeedback
);

// ==================== ANALYTICS & INSIGHTS ROUTES ====================

/**
 * @swagger
 * /api/v1/nl-query/analytics:
 *   get:
 *     summary: Get query analytics and insights (Admin only)
 *     tags: [Natural Language Query - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *       - in: query
 *         name: includeUserStats
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Query analytics retrieved successfully
 *       403:
 *         description: Insufficient permissions
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', 
  requireRole(['admin', 'user']),
  naturalLanguageQueryController.getQueryAnalytics
);

// ==================== CONVERSATIONAL AI ROUTES ====================

/**
 * @swagger
 * /api/v1/nl-query/suggestions:
 *   get:
 *     summary: Get suggested queries based on user context
 *     tags: [Natural Language Query - AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [vulnerability_management, compliance, risk_assessment, asset_management, trending]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *     responses:
 *       200:
 *         description: Suggested queries retrieved successfully
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
 *                     category:
 *                       type: string
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           query:
 *                             type: string
 *                           category:
 *                             type: string
 *                           estimatedComplexity:
 *                             type: string
 *                             enum: [simple, moderate, complex]
 *       401:
 *         description: Unauthorized
 */
router.get('/suggestions', 
  requireRole(['admin', 'user']),
  naturalLanguageQueryController.getSuggestedQueries
);

/**
 * @swagger
 * /api/v1/nl-query/capabilities:
 *   get:
 *     summary: Get conversational AI capabilities and examples
 *     tags: [Natural Language Query - AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI capabilities retrieved successfully
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
 *                     supportedQueryTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           examples:
 *                             type: array
 *                             items:
 *                               type: string
 *                     conversationalFeatures:
 *                       type: array
 *                       items:
 *                         type: string
 *                     supportedTimeRanges:
 *                       type: array
 *                       items:
 *                         type: string
 *                     supportedAssetTypes:
 *                       type: array
 *                       items:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/capabilities', 
  requireRole(['admin', 'user']),
  naturalLanguageQueryController.getAICapabilities
);

module.exports = router;
