const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE NOTIFICATIONS ROUTES ====================

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create notification
 *     tags: [Notifications - Core]
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
 *               - message
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: Target user ID (optional, defaults to current user)
 *               title:
 *                 type: string
 *                 maxLength: 255
 *                 description: Notification title
 *                 example: "Security Alert"
 *               message:
 *                 type: string
 *                 description: Notification message
 *                 example: "Suspicious login attempt detected"
 *               type:
 *                 type: string
 *                 enum: [info, success, warning, error, alert, reminder, system, security]
 *                 default: info
 *                 description: Notification type
 *               module:
 *                 type: string
 *                 maxLength: 50
 *                 description: Source module
 *                 example: "security"
 *               eventType:
 *                 type: string
 *                 maxLength: 50
 *                 description: Event type
 *                 example: "login_attempt"
 *               relatedId:
 *                 type: integer
 *                 description: Related entity ID
 *               relatedType:
 *                 type: string
 *                 maxLength: 50
 *                 description: Related entity type
 *                 example: "user"
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Expiration date
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *                 default: 1
 *                 description: Priority level (1=low, 2=medium, 3=high, 4=urgent)
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  requirePermission('notifications', 'create'),
  notificationController.createNotification
);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, success, warning, error, alert, reminder, system, security]
 *         description: Filter by notification type
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by module
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by event type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 4
 *         description: Filter by priority level
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
 *           enum: [createdAt, updatedAt, title, type, priority]
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
 *         description: User notifications retrieved successfully
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
 *                       message:
 *                         type: string
 *                       type:
 *                         type: string
 *                       read:
 *                         type: boolean
 *                       readAt:
 *                         type: string
 *                         format: date-time
 *                       module:
 *                         type: string
 *                       eventType:
 *                         type: string
 *                       priority:
 *                         type: integer
 *                       createdAt:
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
 */
router.get('/', 
  requirePermission('notifications', 'read'),
  notificationController.getUserNotifications
);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *       404:
 *         description: Notification not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.patch('/:notificationId/read', 
  requirePermission('notifications', 'update'),
  notificationController.markAsRead
);

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications - Core]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [info, success, warning, error, alert, reminder, system, security]
 *                 description: Only mark notifications of this type as read
 *               module:
 *                 type: string
 *                 maxLength: 50
 *                 description: Only mark notifications from this module as read
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/read-all', 
  requirePermission('notifications', 'update'),
  notificationController.markAllAsRead
);

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.delete('/:notificationId', 
  requirePermission('notifications', 'delete'),
  notificationController.deleteNotification
);

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
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
 *                     overview:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         unread:
 *                           type: integer
 *                         read:
 *                           type: integer
 *                         highPriority:
 *                           type: integer
 *                         expired:
 *                           type: integer
 *                     byType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           unreadCount:
 *                             type: integer
 *                     byModule:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           module:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           unreadCount:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/stats',
  requirePermission('notifications', 'read'),
  notificationController.getNotificationStats
);

// ==================== NOTIFICATION CHANNELS ROUTES ====================

/**
 * @swagger
 * /api/v1/notifications/channels:
 *   post:
 *     summary: Create notification channel
 *     tags: [Notifications - Channels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - channelType
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Channel name
 *                 example: "Email Notifications"
 *               channelType:
 *                 type: string
 *                 enum: [email, sms, push, webhook, slack, teams, discord, in_app]
 *                 description: Channel type
 *               config:
 *                 type: object
 *                 description: Channel configuration
 *                 example: {"smtp_host": "smtp.gmail.com", "smtp_port": 587}
 *               description:
 *                 type: string
 *                 description: Channel description
 *               rateLimitPerMinute:
 *                 type: integer
 *                 minimum: 1
 *                 default: 60
 *                 description: Rate limit per minute
 *               rateLimitPerHour:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1000
 *                 description: Rate limit per hour
 *               retryAttempts:
 *                 type: integer
 *                 minimum: 0
 *                 default: 3
 *                 description: Number of retry attempts
 *               retryDelay:
 *                 type: integer
 *                 minimum: 0
 *                 default: 300
 *                 description: Retry delay in seconds
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether channel is active
 *     responses:
 *       201:
 *         description: Notification channel created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/channels',
  requirePermission('notifications', 'admin'),
  notificationController.createChannel
);

/**
 * @swagger
 * /api/v1/notifications/channels:
 *   get:
 *     summary: Get all notification channels
 *     tags: [Notifications - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active channels
 *     responses:
 *       200:
 *         description: Notification channels retrieved successfully
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
 *                       name:
 *                         type: string
 *                       channelType:
 *                         type: string
 *                       config:
 *                         type: object
 *                       isActive:
 *                         type: boolean
 *                       description:
 *                         type: string
 *                       rateLimitPerMinute:
 *                         type: integer
 *                       rateLimitPerHour:
 *                         type: integer
 *                       retryAttempts:
 *                         type: integer
 *                       retryDelay:
 *                         type: integer
 *                       createdBy:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       createdByName:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/channels',
  requirePermission('notifications', 'read'),
  notificationController.getAllChannels
);

/**
 * @swagger
 * /api/v1/notifications/channels/{channelId}:
 *   put:
 *     summary: Update notification channel
 *     tags: [Notifications - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               channelType:
 *                 type: string
 *                 enum: [email, sms, push, webhook, slack, teams, discord, in_app]
 *               config:
 *                 type: object
 *               description:
 *                 type: string
 *               rateLimitPerMinute:
 *                 type: integer
 *                 minimum: 1
 *               rateLimitPerHour:
 *                 type: integer
 *                 minimum: 1
 *               retryAttempts:
 *                 type: integer
 *                 minimum: 0
 *               retryDelay:
 *                 type: integer
 *                 minimum: 0
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification channel updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Channel not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/channels/:channelId',
  requirePermission('notifications', 'admin'),
  notificationController.updateChannel
);

/**
 * @swagger
 * /api/v1/notifications/channels/{channelId}:
 *   delete:
 *     summary: Delete notification channel
 *     tags: [Notifications - Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Channel ID
 *     responses:
 *       200:
 *         description: Notification channel deleted successfully
 *       404:
 *         description: Channel not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/channels/:channelId',
  requirePermission('notifications', 'admin'),
  notificationController.deleteChannel
);

// ==================== NOTIFICATION TEMPLATES ROUTES ====================

/**
 * @swagger
 * /api/v1/notifications/templates:
 *   post:
 *     summary: Create notification template
 *     tags: [Notifications - Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - module
 *               - eventType
 *               - name
 *               - subject
 *               - body
 *             properties:
 *               module:
 *                 type: string
 *                 maxLength: 50
 *                 description: Module name
 *                 example: "security"
 *               eventType:
 *                 type: string
 *                 maxLength: 50
 *                 description: Event type
 *                 example: "login_attempt"
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template name
 *                 example: "Security Alert Template"
 *               subject:
 *                 type: string
 *                 description: Template subject
 *                 example: "Security Alert: {{event_type}}"
 *               body:
 *                 type: string
 *                 description: Template body
 *                 example: "Hello {{user_name}}, we detected a {{event_type}} on your account."
 *               format:
 *                 type: string
 *                 enum: [html, text, markdown, json]
 *                 default: html
 *                 description: Template format
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Template variables
 *                 example: ["user_name", "event_type", "timestamp"]
 *               conditions:
 *                 type: object
 *                 description: Conditional logic
 *               version:
 *                 type: integer
 *                 minimum: 1
 *                 default: 1
 *                 description: Template version
 *               parentId:
 *                 type: integer
 *                 description: Parent template ID
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether template is active
 *     responses:
 *       201:
 *         description: Notification template created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/templates',
  requirePermission('notifications', 'admin'),
  notificationController.createTemplate
);

/**
 * @swagger
 * /api/v1/notifications/templates:
 *   get:
 *     summary: Get all notification templates
 *     tags: [Notifications - Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by module
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by event type
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active templates
 *     responses:
 *       200:
 *         description: Notification templates retrieved successfully
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
 *                       module:
 *                         type: string
 *                       eventType:
 *                         type: string
 *                       name:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       body:
 *                         type: string
 *                       format:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       variables:
 *                         type: array
 *                         items:
 *                           type: string
 *                       version:
 *                         type: integer
 *                       createdBy:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       createdByName:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/templates',
  requirePermission('notifications', 'read'),
  notificationController.getAllTemplates
);

module.exports = router;
