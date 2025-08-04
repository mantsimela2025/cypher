const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE AUDIT LOG ROUTES ====================

/**
 * @swagger
 * /api/v1/audit-logs:
 *   post:
 *     summary: Create audit log entry
 *     tags: [Audit Logs - Core]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - resourceType
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [create, read, update, delete, login, logout, access, export, import, approve, reject, submit, revoke, upload, download, search, view, modify, execute, configure, backup, restore, sync, migrate, deploy, rollback]
 *                 description: Action performed
 *               resourceType:
 *                 type: string
 *                 maxLength: 255
 *                 description: Type of resource affected
 *                 example: "user"
 *               resourceId:
 *                 type: string
 *                 maxLength: 255
 *                 description: ID of the specific resource
 *                 example: "123"
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Human-readable description of the action
 *               level:
 *                 type: string
 *                 enum: [debug, info, warn, error, critical]
 *                 default: info
 *                 description: Log level
 *               oldValues:
 *                 type: object
 *                 description: Previous values (for update operations)
 *               newValues:
 *                 type: object
 *                 description: New values (for create/update operations)
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *               success:
 *                 type: boolean
 *                 default: true
 *                 description: Whether the action was successful
 *               errorMessage:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Error message if action failed
 *               duration:
 *                 type: integer
 *                 minimum: 0
 *                 description: Duration of the action in milliseconds
 *     responses:
 *       201:
 *         description: Audit log created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  requirePermission('audit_logs', 'create'),
  auditLogController.createAuditLog
);

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Get audit logs with filtering and pagination
 *     tags: [Audit Logs - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, login, logout, access, export, import, approve, reject, submit, revoke, upload, download, search, view, modify, execute, configure, backup, restore, sync, migrate, deploy, rollback]
 *         description: Filter by action
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: resourceId
 *         schema:
 *           type: string
 *         description: Filter by resource ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [debug, info, warn, error, critical]
 *         description: Filter by log level
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success status
 *       - in: query
 *         name: ipAddress
 *         schema:
 *           type: string
 *         description: Filter by IP address
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: Filter by session ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by start date (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by end date (ISO format)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in description, resource type, and resource ID
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
 *           default: 50
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, action, level, success]
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
 *         description: Audit logs retrieved successfully
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
 *                       userId:
 *                         type: integer
 *                       action:
 *                         type: string
 *                       resourceType:
 *                         type: string
 *                       resourceId:
 *                         type: string
 *                       description:
 *                         type: string
 *                       ipAddress:
 *                         type: string
 *                       level:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       userName:
 *                         type: string
 *                       userEmail:
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
 */
router.get('/', 
  requirePermission('audit_logs', 'read'),
  auditLogController.getAuditLogs
);

/**
 * @swagger
 * /api/v1/audit-logs/{logId}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit Logs - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 *       404:
 *         description: Audit log not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:logId', 
  requirePermission('audit_logs', 'read'),
  auditLogController.getAuditLogById
);

// ==================== ANALYTICS & REPORTING ROUTES ====================

/**
 * @swagger
 * /api/v1/audit-logs/stats:
 *   get:
 *     summary: Get audit log statistics
 *     tags: [Audit Logs - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Time range for statistics
 *     responses:
 *       200:
 *         description: Audit log statistics retrieved successfully
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
 *                     timeRange:
 *                       type: string
 *                     totalLogs:
 *                       type: integer
 *                     uniqueUsers:
 *                       type: integer
 *                     averageDuration:
 *                       type: number
 *                     actionDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     resourceTypeDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           resourceType:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     levelDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           level:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     successDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           success:
 *                             type: boolean
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/stats',
  requirePermission('audit_logs', 'read'),
  auditLogController.getAuditLogStats
);

/**
 * @swagger
 * /api/v1/audit-logs/users/{userId}/timeline:
 *   get:
 *     summary: Get user activity timeline
 *     tags: [Audit Logs - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d]
 *           default: 7d
 *         description: Time range for timeline
 *     responses:
 *       200:
 *         description: User activity timeline retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/users/:userId/timeline',
  requirePermission('audit_logs', 'read'),
  auditLogController.getUserActivityTimeline
);

/**
 * @swagger
 * /api/v1/audit-logs/resources/history:
 *   get:
 *     summary: Get resource access history
 *     tags: [Audit Logs - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resourceType
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource type
 *       - in: query
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d]
 *           default: 30d
 *         description: Time range for history
 *     responses:
 *       200:
 *         description: Resource access history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/resources/history',
  requirePermission('audit_logs', 'read'),
  auditLogController.getResourceAccessHistory
);

/**
 * @swagger
 * /api/v1/audit-logs/security/events:
 *   get:
 *     summary: Get security events (failed actions, errors, etc.)
 *     tags: [Audit Logs - Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for security events
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [warn, error, critical]
 *           default: warn
 *         description: Minimum log level for security events
 *     responses:
 *       200:
 *         description: Security events retrieved successfully
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
 *                     timeRange:
 *                       type: string
 *                     level:
 *                       type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           userId:
 *                             type: integer
 *                           action:
 *                             type: string
 *                           resourceType:
 *                             type: string
 *                           ipAddress:
 *                             type: string
 *                           level:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           errorMessage:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     totalEvents:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/security/events',
  requirePermission('audit_logs', 'read'),
  auditLogController.getSecurityEvents
);

/**
 * @swagger
 * /api/v1/audit-logs/search:
 *   get:
 *     summary: Search audit logs with advanced filtering
 *     tags: [Audit Logs - Search]
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
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, login, logout, access, export, import, approve, reject, submit, revoke, upload, download, search, view, modify, execute, configure, backup, restore, sync, migrate, deploy, rollback]
 *         description: Filter by action
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [debug, info, warn, error, critical]
 *         description: Filter by log level
 *       - in: query
 *         name: success
 *         schema:
 *           type: boolean
 *         description: Filter by success status
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d]
 *           default: 30d
 *         description: Time range for search
 *     responses:
 *       200:
 *         description: Audit log search completed successfully
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/search',
  requirePermission('audit_logs', 'read'),
  auditLogController.searchAuditLogs
);

// ==================== COMPLIANCE & EXPORT ROUTES ====================

/**
 * @swagger
 * /api/v1/audit-logs/export:
 *   get:
 *     summary: Export audit logs for compliance
 *     tags: [Audit Logs - Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for export (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for export (ISO format)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: resourceType
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [create, read, update, delete, login, logout, access, export, import, approve, reject, submit, revoke, upload, download, search, view, modify, execute, configure, backup, restore, sync, migrate, deploy, rollback]
 *         description: Filter by action
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: Export format
 *     responses:
 *       200:
 *         description: Audit logs exported successfully
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
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                     format:
 *                       type: string
 *                     exportedAt:
 *                       type: string
 *                       format: date-time
 *                     totalRecords:
 *                       type: integer
 *                     filters:
 *                       type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/export',
  requirePermission('audit_logs', 'export'),
  auditLogController.exportAuditLogs
);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @swagger
 * /api/v1/audit-logs/bulk:
 *   post:
 *     summary: Create bulk audit log entries
 *     tags: [Audit Logs - Bulk]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auditLogs
 *             properties:
 *               auditLogs:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - action
 *                     - resourceType
 *                   properties:
 *                     action:
 *                       type: string
 *                       enum: [create, read, update, delete, login, logout, access, export, import, approve, reject, submit, revoke, upload, download, search, view, modify, execute, configure, backup, restore, sync, migrate, deploy, rollback]
 *                     resourceType:
 *                       type: string
 *                       maxLength: 255
 *                     resourceId:
 *                       type: string
 *                       maxLength: 255
 *                     description:
 *                       type: string
 *                       maxLength: 5000
 *                     level:
 *                       type: string
 *                       enum: [debug, info, warn, error, critical]
 *                       default: info
 *                     oldValues:
 *                       type: object
 *                     newValues:
 *                       type: object
 *                     metadata:
 *                       type: object
 *                     success:
 *                       type: boolean
 *                       default: true
 *                     errorMessage:
 *                       type: string
 *                       maxLength: 5000
 *                     duration:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       201:
 *         description: Bulk audit logs created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/bulk',
  requirePermission('audit_logs', 'create'),
  auditLogController.createBulkAuditLogs
);

// ==================== HELPER ROUTES ====================

/**
 * @swagger
 * /api/v1/audit-logs/log-action:
 *   post:
 *     summary: Log current user action (convenience endpoint)
 *     tags: [Audit Logs - Helpers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - resourceType
 *               - description
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [create, read, update, delete, login, logout, access, export, import, approve, reject, submit, revoke, upload, download, search, view, modify, execute, configure, backup, restore, sync, migrate, deploy, rollback]
 *                 description: Action performed
 *               resourceType:
 *                 type: string
 *                 maxLength: 255
 *                 description: Type of resource affected
 *               resourceId:
 *                 type: string
 *                 maxLength: 255
 *                 description: ID of the specific resource
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Human-readable description of the action
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: User action logged successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/log-action',
  requirePermission('audit_logs', 'create'),
  auditLogController.logUserAction
);

module.exports = router;
