const express = require('express');
const accessRequestController = require('../controllers/accessRequestController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// ==================== PUBLIC ACCESS REQUEST ROUTES ====================

/**
 * @swagger
 * /api/v1/access-requests/submit:
 *   post:
 *     summary: Submit access request (public endpoint)
 *     tags: [Access Requests - Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *                 description: First name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 description: Email address
 *                 example: "john.doe@example.com"
 *               reason:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Reason for requesting access
 *                 example: "I need access to review security reports for my department"
 *     responses:
 *       201:
 *         description: Access request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access request submitted successfully. You will receive an email confirmation shortly."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending]
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Pending request already exists for this email
 */
router.post('/submit', accessRequestController.submitAccessRequest);

// Apply authentication to admin routes
router.use(authenticateToken);

// ==================== ADMIN ACCESS REQUEST ROUTES ====================

/**
 * @swagger
 * /api/v1/access-requests:
 *   get:
 *     summary: Get all access requests (admin only)
 *     tags: [Access Requests - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by request status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in name, email, or reason
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
 *         name: processedBy
 *         schema:
 *           type: integer
 *         description: Filter by admin who processed the request
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
 *           enum: [createdAt, updatedAt, firstName, lastName, email, status, processedAt]
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
 *         description: Access requests retrieved successfully
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
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, approved, rejected]
 *                       reason:
 *                         type: string
 *                       rejectionReason:
 *                         type: string
 *                       processedAt:
 *                         type: string
 *                         format: date-time
 *                       processedBy:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       processedByName:
 *                         type: string
 *                       processedByEmail:
 *                         type: string
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
  requirePermission('access_requests_read'),
  accessRequestController.getAllAccessRequests
);

/**
 * @swagger
 * /api/v1/access-requests/stats:
 *   get:
 *     summary: Get access request statistics (admin only)
 *     tags: [Access Requests - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Access request statistics retrieved successfully
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
 *                           description: Total number of requests
 *                         pending:
 *                           type: integer
 *                           description: Number of pending requests
 *                         approved:
 *                           type: integer
 *                           description: Number of approved requests
 *                         rejected:
 *                           type: integer
 *                           description: Number of rejected requests
 *                     monthly:
 *                       type: array
 *                       description: Monthly statistics for the last 12 months
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             format: date-time
 *                           total:
 *                             type: integer
 *                           pending:
 *                             type: integer
 *                           approved:
 *                             type: integer
 *                           rejected:
 *                             type: integer
 *                     recent:
 *                       type: object
 *                       description: Statistics for the last 30 days
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         approved:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/stats',
  requirePermission('access_requests_read'),
  accessRequestController.getAccessRequestStats
);

/**
 * @swagger
 * /api/v1/access-requests/{requestId}:
 *   get:
 *     summary: Get access request by ID (admin only)
 *     tags: [Access Requests - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Access request ID
 *     responses:
 *       200:
 *         description: Access request retrieved successfully
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
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected]
 *                     reason:
 *                       type: string
 *                     rejectionReason:
 *                       type: string
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *                     processedBy:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     processedByName:
 *                       type: string
 *                     processedByEmail:
 *                       type: string
 *       404:
 *         description: Access request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:requestId',
  requirePermission('access_requests_read'),
  accessRequestController.getAccessRequestById
);

/**
 * @swagger
 * /api/v1/access-requests/{requestId}/approve:
 *   patch:
 *     summary: Approve access request (admin only)
 *     tags: [Access Requests - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Access request ID
 *     responses:
 *       200:
 *         description: Access request approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access request approved successfully. User account has been created and notifications sent."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [approved]
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *                     processedBy:
 *                       type: integer
 *       404:
 *         description: Access request not found
 *       409:
 *         description: Access request already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:requestId/approve',
  requirePermission('access_requests_admin'),
  accessRequestController.approveAccessRequest
);

/**
 * @swagger
 * /api/v1/access-requests/{requestId}/reject:
 *   patch:
 *     summary: Reject access request (admin only)
 *     tags: [Access Requests - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Access request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Reason for rejection
 *                 example: "Insufficient business justification provided"
 *     responses:
 *       200:
 *         description: Access request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access request rejected successfully. Notification sent to requester."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [rejected]
 *                     rejectionReason:
 *                       type: string
 *                     processedAt:
 *                       type: string
 *                       format: date-time
 *                     processedBy:
 *                       type: integer
 *       404:
 *         description: Access request not found
 *       409:
 *         description: Access request already processed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.patch('/:requestId/reject',
  requirePermission('access_requests_admin'),
  accessRequestController.rejectAccessRequest
);

/**
 * @swagger
 * /api/v1/access-requests/{requestId}:
 *   delete:
 *     summary: Delete access request (admin only)
 *     tags: [Access Requests - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Access request ID
 *     responses:
 *       200:
 *         description: Access request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access request deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     deletedRequest:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         status:
 *                           type: string
 *       404:
 *         description: Access request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:requestId',
  requirePermission('access_requests_admin'),
  accessRequestController.deleteAccessRequest
);


module.exports = router;
