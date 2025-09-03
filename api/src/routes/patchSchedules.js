const express = require('express');
const patchSchedulesController = require('../controllers/patchSchedulesController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== PATCH SCHEDULE CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-schedules:
 *   post:
 *     summary: Create a new patch schedule
 *     tags: [Patch Schedules]
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
 *               - cronExpression
 *             properties:
 *               name:
 *                 type: string
 *               cronExpression:
 *                 type: string
 *               description:
 *                 type: string
 *               patchId:
 *                 type: string
 *                 format: uuid
 *               patchCriteria:
 *                 type: object
 *               targetAssets:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               maintenanceWindowId:
 *                 type: integer
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               maxConcurrentJobs:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *               retryOnFailure:
 *                 type: boolean
 *               maxRetries:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *               rollbackOnFailure:
 *                 type: boolean
 *               requiresApproval:
 *                 type: boolean
 *               notificationSettings:
 *                 type: object
 *               executionConditions:
 *                 type: object
 *     responses:
 *       201:
 *         description: Patch schedule created successfully
 *       400:
 *         description: Validation error or invalid CRON expression
 */
router.post('/',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateCreateSchedule(),
  patchSchedulesController.createSchedule
);

/**
 * @swagger
 * /api/v1/patch-schedules:
 *   get:
 *     summary: Get patch schedules with filtering and pagination
 *     tags: [Patch Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, nextExecution, lastExecution]
 *       - in: query
 *         name: isEnabled
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: patchId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Patch schedules retrieved successfully
 */
router.get('/',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateScheduleQuery(),
  patchSchedulesController.getSchedules
);

/**
 * @swagger
 * /api/v1/patch-schedules/{id}:
 *   get:
 *     summary: Get a specific patch schedule
 *     tags: [Patch Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patch schedule retrieved successfully
 *       404:
 *         description: Patch schedule not found
 */
router.get('/:id',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateUUID(),
  patchSchedulesController.getScheduleById
);

/**
 * @swagger
 * /api/v1/patch-schedules/{id}:
 *   put:
 *     summary: Update a patch schedule
 *     tags: [Patch Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cronExpression:
 *                 type: string
 *               description:
 *                 type: string
 *               patchCriteria:
 *                 type: object
 *               targetAssets:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               priority:
 *                 type: integer
 *               maxConcurrentJobs:
 *                 type: integer
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Patch schedule updated successfully
 *       404:
 *         description: Patch schedule not found
 *       400:
 *         description: Invalid CRON expression
 */
router.put('/:id',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateUUID(),
  patchSchedulesController.validateUpdateSchedule(),
  patchSchedulesController.updateSchedule
);

/**
 * @swagger
 * /api/v1/patch-schedules/{id}:
 *   delete:
 *     summary: Delete a patch schedule
 *     tags: [Patch Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patch schedule deleted successfully
 *       404:
 *         description: Patch schedule not found
 */
router.delete('/:id',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateUUID(),
  patchSchedulesController.deleteSchedule
);

// ==================== SCHEDULE CONTROL ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-schedules/{id}/enable:
 *   post:
 *     summary: Enable a patch schedule
 *     tags: [Patch Schedule Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patch schedule enabled successfully
 *       404:
 *         description: Patch schedule not found
 */
router.post('/:id/enable',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateUUID(),
  patchSchedulesController.enableSchedule
);

/**
 * @swagger
 * /api/v1/patch-schedules/{id}/disable:
 *   post:
 *     summary: Disable a patch schedule
 *     tags: [Patch Schedule Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patch schedule disabled successfully
 *       404:
 *         description: Patch schedule not found
 */
router.post('/:id/disable',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateUUID(),
  patchSchedulesController.disableSchedule
);

/**
 * @swagger
 * /api/v1/patch-schedules/{id}/trigger:
 *   post:
 *     summary: Trigger a patch schedule now
 *     tags: [Patch Schedule Control]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patch schedule triggered successfully
 *       404:
 *         description: Patch schedule not found
 */
router.post('/:id/trigger',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateUUID(),
  patchSchedulesController.triggerScheduleNow
);

// ==================== CRON VALIDATION ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-schedules/validate-cron:
 *   post:
 *     summary: Validate a CRON expression
 *     tags: [Patch Schedule Utilities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cronExpression
 *             properties:
 *               cronExpression:
 *                 type: string
 *     responses:
 *       200:
 *         description: CRON expression is valid
 *       400:
 *         description: Invalid CRON expression
 */
router.post('/validate-cron',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateCronExpressionInput(),
  patchSchedulesController.validateCronExpression
);

/**
 * @swagger
 * /api/v1/patch-schedules/next-executions:
 *   post:
 *     summary: Get next execution times for a CRON expression
 *     tags: [Patch Schedule Utilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           default: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cronExpression
 *             properties:
 *               cronExpression:
 *                 type: string
 *     responses:
 *       200:
 *         description: Next executions calculated successfully
 *       400:
 *         description: Invalid CRON expression
 */
router.post('/next-executions',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateCronExpressionInput(),
  patchSchedulesController.getNextExecutions
);

// ==================== MAINTENANCE WINDOWS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-schedules/maintenance-windows:
 *   post:
 *     summary: Create a maintenance window
 *     tags: [Maintenance Windows]
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
 *               - startTime
 *               - endTime
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               timezone:
 *                 type: string
 *               recurrence:
 *                 type: object
 *               allowedDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *               blackoutDates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *     responses:
 *       201:
 *         description: Maintenance window created successfully
 */
router.post('/maintenance-windows',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateMaintenanceWindow(),
  patchSchedulesController.createMaintenanceWindow
);

/**
 * @swagger
 * /api/v1/patch-schedules/maintenance-windows:
 *   get:
 *     summary: Get all maintenance windows
 *     tags: [Maintenance Windows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance windows retrieved successfully
 */
router.get('/maintenance-windows',
  requireRole(['admin', 'user']),
  patchSchedulesController.getMaintenanceWindows
);

/**
 * @swagger
 * /api/v1/patch-schedules/maintenance-windows/{id}:
 *   put:
 *     summary: Update a maintenance window
 *     tags: [Maintenance Windows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               timezone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance window updated successfully
 *       404:
 *         description: Maintenance window not found
 */
router.put('/maintenance-windows/:id',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateMaintenanceWindow(),
  patchSchedulesController.updateMaintenanceWindow
);

router.delete('/maintenance-windows/:id',
  requireRole(['admin', 'user']),
  patchSchedulesController.deleteMaintenanceWindow
);

// ==================== EXECUTION HISTORY ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-schedules/{id}/history:
 *   get:
 *     summary: Get schedule execution history
 *     tags: [Patch Schedule History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: executionTimeFrom
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: executionTimeTo
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Execution history retrieved successfully
 */
router.get('/:id/history',
  requireRole(['admin', 'user']),
  patchSchedulesController.validateUUID(),
  patchSchedulesController.getScheduleExecutionHistory
);

// ==================== ANALYTICS & REPORTING ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-schedules/analytics:
 *   get:
 *     summary: Get schedule analytics
 *     tags: [Patch Schedule Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: scheduleId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics',
  requireRole(['admin', 'user']),
  patchSchedulesController.getScheduleAnalytics
);

/**
 * @swagger
 * /api/v1/patch-schedules/execution-calendar:
 *   get:
 *     summary: Get execution calendar
 *     tags: [Patch Schedule Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Execution calendar retrieved successfully
 *       400:
 *         description: Month and year are required
 */
router.get('/execution-calendar',
  requireRole(['admin', 'user']),
  patchSchedulesController.getExecutionCalendar
);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-schedules/bulk/enable:
 *   put:
 *     summary: Bulk enable schedules
 *     tags: [Patch Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleIds
 *             properties:
 *               scheduleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Schedules enabled successfully
 */
router.put('/bulk/enable',
  requireRole(['admin', 'user']),
  patchSchedulesController.bulkEnableSchedules
);

/**
 * @swagger
 * /api/v1/patch-schedules/bulk/disable:
 *   put:
 *     summary: Bulk disable schedules
 *     tags: [Patch Schedules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleIds
 *             properties:
 *               scheduleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Schedules disabled successfully
 */
router.put('/bulk/disable',
  requireRole(['admin', 'user']),
  patchSchedulesController.bulkDisableSchedules
);

router.delete('/bulk/delete',
  requireRole(['admin', 'user']),
  patchSchedulesController.bulkDeleteSchedules
);

module.exports = router;