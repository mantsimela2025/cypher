const express = require('express');
const atoController = require('../controllers/atoController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/ato:
 *   post:
 *     summary: Create new Authorization to Operate
 *     tags: [ATO - Core]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sspId
 *             properties:
 *               sspId:
 *                 type: integer
 *                 description: System Security Plan ID
 *                 example: 1
 *               type:
 *                 type: string
 *                 enum: [full, interim, provisional, conditional]
 *                 default: full
 *                 description: Type of ATO
 *               riskLevel:
 *                 type: string
 *                 enum: [low, moderate, high]
 *                 description: Risk level assessment
 *               authorizationMemo:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Authorization memorandum
 *               authorizationConditions:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Conditions and requirements
 *               continuousMonitoringPlan:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Continuous monitoring plan
 *     responses:
 *       201:
 *         description: ATO created successfully
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Active ATO already exists for this SSP
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  requirePermission('ato', 'create'),
  atoController.createATO
);

/**
 * @swagger
 * /api/v1/ato:
 *   get:
 *     summary: Get all ATOs with filtering and pagination
 *     tags: [ATO - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, under_review, pending_approval, approved, rejected, expired, revoked]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, interim, provisional, conditional]
 *       - in: query
 *         name: sspId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [low, moderate, high]
 *       - in: query
 *         name: expiringWithinDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *       - in: query
 *         name: authorizedBy
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, submissionDate, approvalDate, expirationDate]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: ATOs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', 
  requirePermission('ato', 'read'),
  atoController.getAllATOs
);

/**
 * @swagger
 * /api/v1/ato/{atoId}:
 *   get:
 *     summary: Get ATO by ID
 *     tags: [ATO - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: includeHistory
 *         schema:
 *           type: boolean
 *           default: false
 *       - in: query
 *         name: includeDocuments
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: ATO retrieved successfully
 *       404:
 *         description: ATO not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:atoId', 
  requirePermission('ato', 'read'),
  atoController.getATOById
);

/**
 * @swagger
 * /api/v1/ato/{atoId}:
 *   put:
 *     summary: Update ATO
 *     tags: [ATO - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [full, interim, provisional, conditional]
 *               riskLevel:
 *                 type: string
 *                 enum: [low, moderate, high]
 *               authorizationMemo:
 *                 type: string
 *                 maxLength: 5000
 *               authorizationConditions:
 *                 type: string
 *                 maxLength: 5000
 *               continuousMonitoringPlan:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       200:
 *         description: ATO updated successfully
 *       400:
 *         description: Invalid request or ATO cannot be updated
 *       404:
 *         description: ATO not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:atoId', 
  requirePermission('ato', 'update'),
  atoController.updateATO
);

/**
 * @swagger
 * /api/v1/ato/{atoId}:
 *   delete:
 *     summary: Delete ATO (soft delete)
 *     tags: [ATO - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for deletion
 *     responses:
 *       200:
 *         description: ATO deleted successfully
 *       400:
 *         description: Only draft ATOs can be deleted
 *       404:
 *         description: ATO not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:atoId', 
  requirePermission('ato', 'delete'),
  atoController.deleteATO
);

// ==================== WORKFLOW MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/ato/{atoId}/submit:
 *   post:
 *     summary: Submit ATO for review
 *     tags: [ATO - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Submission comments
 *     responses:
 *       200:
 *         description: ATO submitted successfully
 *       400:
 *         description: Only draft ATOs can be submitted
 *       404:
 *         description: ATO not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:atoId/submit', 
  requirePermission('ato', 'update'),
  atoController.submitATO
);

/**
 * @swagger
 * /api/v1/ato/{atoId}/review:
 *   post:
 *     summary: Review ATO (approve, reject, or request changes)
 *     tags: [ATO - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, request_changes]
 *                 description: Review action
 *               comments:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Review comments
 *               approvalRole:
 *                 type: string
 *                 enum: [system_owner, authorizing_official, security_officer, privacy_officer, risk_executive, cio, ciso, reviewer, approver]
 *                 default: reviewer
 *                 description: Role of the reviewer
 *               signature:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Digital signature
 *     responses:
 *       200:
 *         description: ATO review completed successfully
 *       400:
 *         description: Invalid action or ATO not in reviewable status
 *       404:
 *         description: ATO not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:atoId/review', 
  requirePermission('ato', 'approve'),
  atoController.reviewATO
);

/**
 * @swagger
 * /api/v1/ato/{atoId}/revoke:
 *   post:
 *     summary: Revoke ATO
 *     tags: [ATO - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Reason for revocation
 *               approvalRole:
 *                 type: string
 *                 enum: [authorizing_official, cio, ciso, risk_executive]
 *                 default: authorizing_official
 *                 description: Role authorizing the revocation
 *     responses:
 *       200:
 *         description: ATO revoked successfully
 *       400:
 *         description: Only approved ATOs can be revoked
 *       404:
 *         description: ATO not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:atoId/revoke',
  requirePermission('ato', 'revoke'),
  atoController.revokeATO
);

// ==================== WORKFLOW HISTORY ROUTES ====================

/**
 * @swagger
 * /api/v1/ato/{atoId}/history:
 *   get:
 *     summary: Get ATO workflow history
 *     tags: [ATO - Workflow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ATO workflow history retrieved successfully
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
 *                       action:
 *                         type: string
 *                       status:
 *                         type: string
 *                       comments:
 *                         type: string
 *                       performedBy:
 *                         type: integer
 *                       performedAt:
 *                         type: string
 *                         format: date-time
 *                       approvalRole:
 *                         type: string
 *                       workflowStage:
 *                         type: string
 *                       performedByName:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/:atoId/history',
  requirePermission('ato', 'read'),
  atoController.getATOWorkflowHistory
);

// ==================== DOCUMENT MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/ato/{atoId}/documents:
 *   post:
 *     summary: Upload ATO document
 *     tags: [ATO - Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
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
 *               - documentType
 *               - fileName
 *               - fileLocation
 *             properties:
 *               documentType:
 *                 type: string
 *                 maxLength: 100
 *                 description: Type of document (SSP, SAR, POA&M, etc.)
 *                 example: "System Security Plan"
 *               fileName:
 *                 type: string
 *                 maxLength: 255
 *                 description: Name of the file
 *                 example: "SSP_v1.2.pdf"
 *               fileLocation:
 *                 type: string
 *                 maxLength: 500
 *                 description: Secure file storage location
 *                 example: "/secure/ato/documents/ssp_v1.2.pdf"
 *     responses:
 *       201:
 *         description: ATO document uploaded successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: ATO not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:atoId/documents',
  requirePermission('ato', 'update'),
  atoController.uploadATODocument
);

/**
 * @swagger
 * /api/v1/ato/{atoId}/documents:
 *   get:
 *     summary: Get ATO documents
 *     tags: [ATO - Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: atoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ATO documents retrieved successfully
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
 *                       documentType:
 *                         type: string
 *                       fileName:
 *                         type: string
 *                       fileLocation:
 *                         type: string
 *                       uploadedBy:
 *                         type: integer
 *                       uploadedAt:
 *                         type: string
 *                         format: date-time
 *                       uploadedByName:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/:atoId/documents',
  requirePermission('ato', 'read'),
  atoController.getATODocuments
);

/**
 * @swagger
 * /api/v1/ato/documents/{documentId}:
 *   delete:
 *     summary: Delete ATO document
 *     tags: [ATO - Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ATO document deleted successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/documents/:documentId',
  requirePermission('ato', 'delete'),
  atoController.deleteATODocument
);

// ==================== ANALYTICS & REPORTING ROUTES ====================

/**
 * @swagger
 * /api/v1/ato/dashboard/stats:
 *   get:
 *     summary: Get ATO dashboard statistics
 *     tags: [ATO - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ATO dashboard statistics retrieved successfully
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
 *                     statusDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     typeDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     expiringCount:
 *                       type: integer
 *                     expiredCount:
 *                       type: integer
 *                     recentActivityCount:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/stats',
  requirePermission('ato', 'read'),
  atoController.getATODashboardStats
);

/**
 * @swagger
 * /api/v1/ato/expiring:
 *   get:
 *     summary: Get expiring ATOs
 *     tags: [ATO - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 90
 *         description: Number of days ahead to check for expiring ATOs
 *     responses:
 *       200:
 *         description: Expiring ATOs retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/expiring',
  requirePermission('ato', 'read'),
  atoController.getExpiringATOs
);

/**
 * @swagger
 * /api/v1/ato/metrics/workflow:
 *   get:
 *     summary: Get ATO workflow performance metrics
 *     tags: [ATO - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time range for metrics
 *     responses:
 *       200:
 *         description: ATO workflow metrics retrieved successfully
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
 *                     averageApprovalDays:
 *                       type: number
 *                     approvedCount:
 *                       type: integer
 *                     stageDistribution:
 *                       type: array
 *                     roleActivity:
 *                       type: array
 *                     timeRange:
 *                       type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/metrics/workflow',
  requirePermission('ato', 'read'),
  atoController.getWorkflowMetrics
);

/**
 * @swagger
 * /api/v1/ato/search:
 *   get:
 *     summary: Search ATOs
 *     tags: [ATO - Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, under_review, pending_approval, approved, rejected, expired, revoked]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [full, interim, provisional, conditional]
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [low, moderate, high]
 *     responses:
 *       200:
 *         description: ATO search completed successfully
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
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     searchTerm:
 *                       type: string
 *                     filters:
 *                       type: object
 *                     count:
 *                       type: integer
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/search',
  requirePermission('ato', 'read'),
  atoController.searchATOs
);

module.exports = router;
