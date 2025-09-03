const express = require('express');
const procedureController = require('../controllers/procedureController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== PROCEDURE CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/procedures:
 *   post:
 *     summary: Create a new procedure
 *     tags: [Procedures]
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
 *               - procedureType
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Procedure title
 *                 example: "Incident Response Procedure"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Procedure description
 *                 example: "Step-by-step procedure for responding to security incidents"
 *               procedureType:
 *                 type: string
 *                 enum: [standard_operating_procedure, work_instruction, process_flow, checklist, guideline, emergency_procedure, maintenance_procedure, security_procedure, compliance_procedure, training_procedure, audit_procedure, incident_response_procedure, other]
 *                 description: Type of procedure
 *                 example: "incident_response_procedure"
 *               relatedPolicyId:
 *                 type: integer
 *                 description: ID of related policy
 *               content:
 *                 type: string
 *                 description: Procedure content
 *               steps:
 *                 type: object
 *                 description: Procedure steps in structured format
 *               resources:
 *                 type: object
 *                 description: Required resources and references
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the procedure becomes effective
 *               reviewDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the procedure should be reviewed
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Procedure created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', 
  requireRole(['admin']),
  procedureController.createProcedure
);

/**
 * @swagger
 * /api/v1/procedures:
 *   get:
 *     summary: Get all procedures with filtering and pagination
 *     tags: [Procedures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, under_review, approved, published, archived, expired]
 *         description: Filter by procedure status
 *       - in: query
 *         name: procedureType
 *         schema:
 *           type: string
 *           enum: [standard_operating_procedure, work_instruction, process_flow, checklist, guideline, emergency_procedure, maintenance_procedure, security_procedure, compliance_procedure, training_procedure, audit_procedure, incident_response_procedure, other]
 *         description: Filter by procedure type
 *       - in: query
 *         name: relatedPolicyId
 *         schema:
 *           type: integer
 *         description: Filter by related policy ID
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
 *           enum: [createdAt, updatedAt, title, status, procedureType, effectiveDate]
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
 *         description: Procedures retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  requireRole(['admin', 'user']),
  procedureController.getAllProcedures
);

/**
 * @swagger
 * /api/v1/procedures/{procedureId}:
 *   get:
 *     summary: Get procedure by ID
 *     tags: [Procedures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: procedureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Procedure ID
 *     responses:
 *       200:
 *         description: Procedure retrieved successfully
 *       404:
 *         description: Procedure not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:procedureId', 
  requireRole(['admin', 'user']),
  procedureController.getProcedureById
);

/**
 * @swagger
 * /api/v1/procedures/{procedureId}:
 *   put:
 *     summary: Update procedure
 *     tags: [Procedures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: procedureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Procedure ID
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
 *               procedureType:
 *                 type: string
 *                 enum: [standard_operating_procedure, work_instruction, process_flow, checklist, guideline, emergency_procedure, maintenance_procedure, security_procedure, compliance_procedure, training_procedure, audit_procedure, incident_response_procedure, other]
 *               relatedPolicyId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [draft, under_review, approved, published, archived, expired]
 *               version:
 *                 type: string
 *                 maxLength: 20
 *               content:
 *                 type: string
 *               steps:
 *                 type: object
 *               resources:
 *                 type: object
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
 *         description: Procedure updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Procedure not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:procedureId', 
  requireRole(['admin']),
  procedureController.updateProcedure
);

/**
 * @swagger
 * /api/v1/procedures/{procedureId}:
 *   delete:
 *     summary: Delete procedure
 *     tags: [Procedures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: procedureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Procedure ID
 *     responses:
 *       200:
 *         description: Procedure deleted successfully
 *       404:
 *         description: Procedure not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:procedureId',
  requireRole(['admin']),
  procedureController.deleteProcedure
);

// ==================== PROCEDURE WORKFLOW ROUTES ====================

/**
 * @swagger
 * /api/v1/procedures/{procedureId}/approve:
 *   patch:
 *     summary: Approve procedure
 *     tags: [Procedures - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: procedureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Procedure ID
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
 *         description: Procedure approved successfully
 *       404:
 *         description: Procedure not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:procedureId/approve',
  requireRole(['admin']),
  procedureController.approveProcedure
);

/**
 * @swagger
 * /api/v1/procedures/{procedureId}/publish:
 *   patch:
 *     summary: Publish procedure
 *     tags: [Procedures - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: procedureId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Procedure ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *                 description: When the procedure becomes effective (defaults to now)
 *     responses:
 *       200:
 *         description: Procedure published successfully
 *       404:
 *         description: Procedure not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:procedureId/publish',
  requireRole(['admin']),
  procedureController.publishProcedure
);

// ==================== AI-ASSISTED PROCEDURE GENERATION ROUTES ====================

/**
 * @swagger
 * /api/v1/procedures/ai/generate:
 *   post:
 *     summary: Generate procedure using AI
 *     tags: [Procedures - AI Generation]
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
 *               - procedureType
 *               - prompt
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 description: Procedure title
 *                 example: "Password Reset Procedure"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Procedure description
 *               procedureType:
 *                 type: string
 *                 enum: [standard_operating_procedure, work_instruction, process_flow, checklist, guideline, emergency_procedure, maintenance_procedure, security_procedure, compliance_procedure, training_procedure, audit_procedure, incident_response_procedure, other]
 *                 description: Type of procedure
 *                 example: "security_procedure"
 *               relatedPolicyId:
 *                 type: integer
 *                 description: ID of related policy
 *               prompt:
 *                 type: string
 *                 maxLength: 2000
 *                 description: AI generation prompt
 *                 example: "Create a detailed step-by-step procedure for IT staff to reset user passwords securely, including verification steps and documentation requirements"
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
 *               requirements:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Specific requirements for the procedure
 *               assetContext:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Asset-related context
 *               aiParameters:
 *                 type: object
 *                 description: AI model parameters (temperature, max_tokens, etc.)
 *     responses:
 *       201:
 *         description: Procedure generated successfully with AI assistance
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
 *                     procedure:
 *                       type: object
 *                       description: Generated procedure object
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
  procedureController.generateProcedureWithAI
);

// ==================== ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/v1/procedures/analytics:
 *   get:
 *     summary: Get procedure analytics
 *     tags: [Procedures - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Procedure analytics retrieved successfully
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
 *                           procedureType:
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
  procedureController.getProcedureAnalytics
);

module.exports = router;
