const express = require('express');
const aiAssistanceController = require('../controllers/aiAssistanceController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== AI ASSISTANCE REQUEST ROUTES ====================

/**
 * @swagger
 * /api/v1/ai-assistance/requests:
 *   post:
 *     summary: Create a new AI assistance request
 *     tags: [AI Assistance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestType
 *               - title
 *               - description
 *             properties:
 *               requestType:
 *                 type: string
 *                 enum: [threat_analysis, incident_response, compliance_guidance, policy_generation, risk_assessment, vulnerability_analysis, forensic_analysis, training_content, documentation, code_review, configuration_review, threat_hunting, malware_analysis, network_analysis, log_analysis]
 *                 description: Type of AI assistance requested
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Title of the assistance request
 *               description:
 *                 type: string
 *                 description: Detailed description of what assistance is needed
 *               context:
 *                 type: object
 *                 description: Additional context data for the AI analysis
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: medium
 *               relatedEntityType:
 *                 type: string
 *                 maxLength: 50
 *                 description: Type of related entity (asset, vulnerability, incident, etc.)
 *               relatedEntityId:
 *                 type: integer
 *                 description: ID of related entity
 *               classificationLevel:
 *                 type: string
 *                 enum: [unclassified, cui, confidential, secret]
 *                 default: unclassified
 *               sensitiveData:
 *                 type: boolean
 *                 default: false
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: AI assistance request created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/requests', 
  requireRole(['admin']),
  aiAssistanceController.createAssistanceRequest
);

/**
 * @swagger
 * /api/v1/ai-assistance/requests:
 *   get:
 *     summary: Get all AI assistance requests with filtering and pagination
 *     tags: [AI Assistance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: requestType
 *         schema:
 *           type: string
 *           enum: [threat_analysis, incident_response, compliance_guidance, policy_generation, risk_assessment, vulnerability_analysis, forensic_analysis, training_content, documentation, code_review, configuration_review, threat_hunting, malware_analysis, network_analysis, log_analysis]
 *         description: Filter by request type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, requires_review, approved, rejected]
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in title and description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, title, priority, status]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: AI assistance requests retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/requests', 
  requireRole(['admin', 'user']),
  aiAssistanceController.getAllAssistanceRequests
);

/**
 * @swagger
 * /api/v1/ai-assistance/requests/{requestId}:
 *   get:
 *     summary: Get AI assistance request by ID
 *     tags: [AI Assistance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: AI assistance request ID
 *     responses:
 *       200:
 *         description: AI assistance request retrieved successfully
 *       404:
 *         description: AI assistance request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/requests/:requestId', 
  requireRole(['admin', 'user']),
  aiAssistanceController.getAssistanceRequestById
);

/**
 * @swagger
 * /api/v1/ai-assistance/requests/{requestId}/process:
 *   post:
 *     summary: Process AI assistance request
 *     tags: [AI Assistance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: AI assistance request ID
 *     responses:
 *       200:
 *         description: AI assistance request processed successfully
 *       404:
 *         description: AI assistance request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/requests/:requestId/process', 
  requireRole(['admin']),
  aiAssistanceController.processAssistanceRequest
);

/**
 * @swagger
 * /api/v1/ai-assistance/requests/{requestId}/feedback:
 *   put:
 *     summary: Update AI assistance request feedback
 *     tags: [AI Assistance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: AI assistance request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qualityRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Quality rating (1-5)
 *               userFeedback:
 *                 type: string
 *                 description: User feedback text
 *               usefulness:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Usefulness rating (1-5)
 *               implementationStatus:
 *                 type: string
 *                 enum: [not_implemented, in_progress, completed, failed]
 *                 description: Implementation status
 *               implementationNotes:
 *                 type: string
 *                 description: Implementation notes
 *               effectiveness:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Effectiveness rating (1-5)
 *     responses:
 *       200:
 *         description: AI assistance request feedback updated successfully
 *       404:
 *         description: AI assistance request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/requests/:requestId/feedback', 
  requireRole(['admin']),
  aiAssistanceController.updateRequestFeedback
);

// ==================== SPECIALIZED AI ASSISTANCE ROUTES ====================

/**
 * @swagger
 * /api/v1/ai-assistance/threat-intelligence:
 *   post:
 *     summary: Generate threat intelligence report
 *     tags: [AI Assistance - Specialized]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - indicators
 *             properties:
 *               indicators:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: List of threat indicators (IPs, domains, hashes, etc.)
 *               context:
 *                 type: object
 *                 description: Additional context for analysis
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 default: high
 *     responses:
 *       201:
 *         description: Threat intelligence report generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/threat-intelligence', 
  requireRole(['admin']),
  aiAssistanceController.generateThreatIntelligenceReport
);

/**
 * @swagger
 * /api/v1/ai-assistance/incident-response:
 *   post:
 *     summary: Generate incident response playbook
 *     tags: [AI Assistance - Specialized]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - incidentType
 *               - severity
 *             properties:
 *               incidentType:
 *                 type: string
 *                 description: Type of incident (malware, data breach, etc.)
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *                 description: Incident severity level
 *               context:
 *                 type: object
 *                 description: Additional incident context
 *     responses:
 *       201:
 *         description: Incident response playbook generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/incident-response', 
  requireRole(['admin']),
  aiAssistanceController.generateIncidentResponsePlaybook
);

/**
 * @swagger
 * /api/v1/ai-assistance/compliance:
 *   post:
 *     summary: Generate compliance assessment
 *     tags: [AI Assistance - Specialized]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - framework
 *               - controls
 *             properties:
 *               framework:
 *                 type: string
 *                 description: Compliance framework (NIST, FISMA, FedRAMP, etc.)
 *               controls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 description: List of controls to assess
 *               context:
 *                 type: object
 *                 description: Additional assessment context
 *     responses:
 *       201:
 *         description: Compliance assessment generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/compliance',
  requireRole(['admin']),
  aiAssistanceController.generateComplianceAssessment
);

/**
 * @swagger
 * /api/v1/ai-assistance/policy:
 *   post:
 *     summary: Generate security policy
 *     tags: [AI Assistance - Specialized]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - policyType
 *               - requirements
 *             properties:
 *               policyType:
 *                 type: string
 *                 description: Type of policy to generate
 *               requirements:
 *                 type: string
 *                 description: Policy requirements and specifications
 *               context:
 *                 type: object
 *                 description: Additional policy context
 *     responses:
 *       201:
 *         description: Security policy generated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/policy',
  requireRole(['admin']),
  aiAssistanceController.generateSecurityPolicy
);

/**
 * @swagger
 * /api/v1/ai-assistance/vulnerability-analysis:
 *   post:
 *     summary: Analyze vulnerability impact
 *     tags: [AI Assistance - Specialized]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vulnerability
 *               - assets
 *             properties:
 *               vulnerability:
 *                 type: object
 *                 description: Vulnerability details
 *               assets:
 *                 type: array
 *                 items:
 *                   type: object
 *                 description: Affected assets
 *               context:
 *                 type: object
 *                 description: Additional analysis context
 *     responses:
 *       201:
 *         description: Vulnerability impact analysis completed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/vulnerability-analysis',
  requireRole(['admin']),
  aiAssistanceController.analyzeVulnerabilityImpact
);

/**
 * @swagger
 * /api/v1/ai-assistance/analytics:
 *   get:
 *     summary: Get AI assistance analytics and statistics
 *     tags: [AI Assistance - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           pattern: ^\d+[mhdw]$
 *           default: 24h
 *         description: Time frame for analytics (e.g., 1h, 24h, 7d, 30d)
 *     responses:
 *       200:
 *         description: AI assistance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timeframe:
 *                   type: string
 *                   description: Requested timeframe
 *                 requests:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total requests
 *                     pending:
 *                       type: integer
 *                       description: Pending requests
 *                     processing:
 *                       type: integer
 *                       description: Processing requests
 *                     completed:
 *                       type: integer
 *                       description: Completed requests
 *                     failed:
 *                       type: integer
 *                       description: Failed requests
 *                 requestTypes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       requestType:
 *                         type: string
 *                       count:
 *                         type: integer
 *                 performance:
 *                   type: object
 *                   properties:
 *                     avgProcessingTime:
 *                       type: integer
 *                       description: Average processing time in milliseconds
 *                     avgTokensUsed:
 *                       type: integer
 *                       description: Average tokens used per request
 *                     totalCost:
 *                       type: number
 *                       description: Total cost in dollars
 *                 knowledgeBase:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total knowledge base entries
 *                     validated:
 *                       type: integer
 *                       description: Validated entries
 *                     avgRating:
 *                       type: number
 *                       description: Average rating
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/analytics',
  requireRole(['admin', 'user']),
  aiAssistanceController.getAiAnalytics
);

// ==================== KNOWLEDGE BASE ROUTES ====================

/**
 * @swagger
 * /api/v1/ai-assistance/knowledge-base/search:
 *   get:
 *     summary: Search AI knowledge base
 *     tags: [AI Assistance - Knowledge Base]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *           maxLength: 200
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by category
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by subcategory
 *       - in: query
 *         name: isValidated
 *         schema:
 *           type: boolean
 *         description: Filter by validation status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, createdAt, rating, viewCount]
 *           default: relevance
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Knowledge base search completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/knowledge-base/search',
  requireRole(['admin', 'user']),
  aiAssistanceController.searchKnowledgeBase
);

module.exports = router;
