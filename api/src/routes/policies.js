const express = require('express');
const policyController = require('../controllers/policyController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== POLICY CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/policies:
 *   post:
 *     summary: Create a new policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - policyType
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Policy title
 *                 example: "Information Security Policy"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Policy description
 *                 example: "This policy establishes guidelines for information security"
 *               policyType:
 *                 type: string
 *                 enum: [security, privacy, compliance, operational, hr, financial, it, risk_management, business_continuity, data_governance, vendor_management, incident_response, access_control, change_management, asset_management, other]
 *                 description: Type of policy
 *                 example: "security"
 *               content:
 *                 type: string
 *                 description: Policy content
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the policy becomes effective
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the policy should be reviewed
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Policy created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', 
  requireRole(['admin']),
  policyController.createPolicy
);

/**
 * @swagger
 * /api/v1/policies:
 *   get:
 *     summary: Get all policies with filtering and pagination
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, under_review, approved, published, archived, expired]
 *         description: Filter by policy status
 *       - in: query
 *         name: policyType
 *         schema:
 *           type: string
 *           enum: [security, privacy, compliance, operational, hr, financial, it, risk_management, business_continuity, data_governance, vendor_management, incident_response, access_control, change_management, asset_management, other]
 *         description: Filter by policy type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in title, description, and content
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from creation date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to creation date
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *       - in: query
 *         name: approvedBy
 *         schema:
 *           type: integer
 *         description: Filter by approver user ID
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
 *           enum: [createdAt, updatedAt, title, status, policyType, effectiveDate]
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
 *         description: Policies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       policyType:
 *                         type: string
 *                       status:
 *                         type: string
 *                       version:
 *                         type: string
 *                       effectiveDate:
 *                         type: string
 *                         format: date-time
 *                       reviewDate:
 *                         type: string
 *                         format: date-time
 *                       approvedBy:
 *                         type: integer
 *                       approvedAt:
 *                         type: string
 *                         format: date-time
 *                       createdBy:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalCount:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  requireRole(['admin', 'user']),
  policyController.getAllPolicies
);

/**
 * @swagger
 * /api/v1/policies/{policyId}:
 *   get:
 *     summary: Get policy by ID
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     responses:
 *       200:
 *         description: Policy retrieved successfully
 *       404:
 *         description: Policy not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:policyId', 
  requireRole(['admin', 'user']),
  policyController.getPolicyById
);

/**
 * @swagger
 * /api/v1/policies/{policyId}:
 *   put:
 *     summary: Update policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               policyType:
 *                 type: string
 *                 enum: [security, privacy, compliance, operational, hr, financial, it, risk_management, business_continuity, data_governance, vendor_management, incident_response, access_control, change_management, asset_management, other]
 *               status:
 *                 type: string
 *                 enum: [draft, under_review, approved, published, archived, expired]
 *               version:
 *                 type: string
 *                 maxLength: 20
 *               content:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Policy updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Policy not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:policyId', 
  requireRole(['admin']),
  policyController.updatePolicy
);

/**
 * @swagger
 * /api/v1/policies/{policyId}:
 *   delete:
 *     summary: Delete policy
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     responses:
 *       200:
 *         description: Policy deleted successfully
 *       404:
 *         description: Policy not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:policyId',
  requireRole(['admin']),
  policyController.deletePolicy
);

// ==================== POLICY WORKFLOW ROUTES ====================

/**
 * @swagger
 * /api/v1/policies/{policyId}/approve:
 *   patch:
 *     summary: Approve policy
 *     tags: [Policies - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvalNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional approval notes
 *     responses:
 *       200:
 *         description: Policy approved successfully
 *       404:
 *         description: Policy not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:policyId/approve',
  requireRole(['admin']),
  policyController.approvePolicy
);

/**
 * @swagger
 * /api/v1/policies/{policyId}/publish:
 *   patch:
 *     summary: Publish policy
 *     tags: [Policies - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the policy becomes effective (defaults to now)
 *     responses:
 *       200:
 *         description: Policy published successfully
 *       404:
 *         description: Policy not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:policyId/publish',
  requireRole(['admin']),
  policyController.publishPolicy
);

// ==================== AI-ASSISTED POLICY GENERATION ROUTES ====================

/**
 * @swagger
 * /api/v1/policies/ai/generate:
 *   post:
 *     summary: Generate policy using AI
 *     tags: [Policies - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - policyType
 *               - prompt
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Policy title
 *                 example: "Remote Work Security Policy"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Policy description
 *               policyType:
 *                 type: string
 *                 enum: [security, privacy, compliance, operational, hr, financial, it, risk_management, business_continuity, data_governance, vendor_management, incident_response, access_control, change_management, asset_management, other]
 *                 description: Type of policy
 *                 example: "security"
 *               prompt:
 *                 type: string
 *                 maxLength: 2000
 *                 description: AI generation prompt
 *                 example: "Create a comprehensive remote work security policy that covers VPN usage, device security, and data protection requirements"
 *               mode:
 *                 type: string
 *                 enum: [full_generation, template_based, enhancement]
 *                 default: full_generation
 *                 description: AI generation mode
 *               aiProvider:
 *                 type: string
 *                 enum: [openai, anthropic, azure_openai]
 *                 default: openai
 *                 description: AI provider to use
 *               modelName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Specific AI model to use
 *               organizationContext:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Organization-specific context
 *               complianceRequirements:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Compliance requirements to consider
 *               assetContext:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Asset-related context
 *               aiParameters:
 *                 type: object
 *                 description: AI model parameters (temperature, max_tokens, etc.)
 *     responses:
 *       201:
 *         description: Policy generated successfully with AI assistance
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
 *                     policy:
 *                       type: object
 *                       description: Generated policy object
 *                     aiRequest:
 *                       type: object
 *                       description: AI generation request details
 *                     generationResult:
 *                       type: object
 *                       description: AI generation result details
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: AI generation failed
 */
router.post('/ai/generate',
  requireRole(['admin']),
  policyController.generatePolicyWithAI
);

/**
 * @swagger
 * /api/v1/policies/{policyId}/ai/enhance:
 *   post:
 *     summary: Enhance existing policy with AI
 *     tags: [Policies - AI Generation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: policyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Policy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *               - prompt
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Enhancement description
 *                 example: "Improve policy clarity and add compliance requirements"
 *               prompt:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Enhancement prompt
 *                 example: "Enhance this policy to improve clarity, add specific compliance requirements, and ensure it follows industry best practices"
 *               type:
 *                 type: string
 *                 enum: [clarity, completeness, compliance, structure]
 *                 default: completeness
 *                 description: Type of enhancement
 *               requirements:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Specific requirements for enhancement
 *               aiProvider:
 *                 type: string
 *                 enum: [openai, anthropic, azure_openai]
 *                 default: openai
 *                 description: AI provider to use
 *               modelName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Specific AI model to use
 *     responses:
 *       200:
 *         description: Policy enhanced successfully with AI assistance
 *       404:
 *         description: Policy not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: AI enhancement failed
 */
router.post('/:policyId/ai/enhance',
  requireRole(['admin']),
  policyController.enhancePolicyWithAI
);

// ==================== ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/v1/policies/analytics:
 *   get:
 *     summary: Get policy analytics
 *     tags: [Policies - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Policy analytics retrieved successfully
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
 *                     overall:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         draft:
 *                           type: integer
 *                         underReview:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         published:
 *                           type: integer
 *                         archived:
 *                           type: integer
 *                         expired:
 *                           type: integer
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           policyType:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           published:
 *                             type: integer
 *                           draft:
 *                             type: integer
 *                     recent:
 *                       type: object
 *                       properties:
 *                         created:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         updated:
 *                           type: integer
 *                     dueForReview:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/analytics',
  requireRole(['admin', 'user']),
  policyController.getPolicyAnalytics
);

/**
 * @swagger
 * /api/v1/policies/ai/analytics:
 *   get:
 *     summary: Get AI generation analytics
 *     tags: [Policies - AI Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to date
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [openai, anthropic, azure_openai]
 *         description: Filter by AI provider
 *       - in: query
 *         name: generationType
 *         schema:
 *           type: string
 *           enum: [policy, policy_update]
 *         description: Filter by generation type
 *     responses:
 *       200:
 *         description: AI generation analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/ai/analytics',
  requireRole(['admin', 'user']),
  policyController.getAIGenerationAnalytics
);

module.exports = router;
