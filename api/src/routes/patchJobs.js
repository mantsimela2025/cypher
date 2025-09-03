const express = require('express');
const patchJobsController = require('../controllers/patchJobsController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== PATCH JOB CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-jobs:
 *   post:
 *     summary: Create a new patch job
 *     tags: [Patch Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patchId
 *               - executionType
 *             properties:
 *               patchId:
 *                 type: string
 *                 format: uuid
 *               executionType:
 *                 type: string
 *                 enum: [immediate, scheduled, maintenance_window]
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               maintenanceWindowId:
 *                 type: integer
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               maxRetries:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 10
 *               timeoutMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1440
 *               rollbackOnFailure:
 *                 type: boolean
 *               requiresApproval:
 *                 type: boolean
 *               notificationSettings:
 *                 type: object
 *               executionSettings:
 *                 type: object
 *     responses:
 *       201:
 *         description: Patch job created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
  requireRole(['admin', 'user']),
  patchJobsController.validateCreateJob(),
  patchJobsController.createJob
);

/**
 * @swagger
 * /api/v1/patch-jobs:
 *   get:
 *     summary: Get patch jobs with filtering and pagination
 *     tags: [Patch Jobs]
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
 *           enum: [createdAt, scheduledFor, startedAt, completedAt, priority, status]
 *       - in: query
 *         name: status
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: executionType
 *         schema:
 *           type: string
 *       - in: query
 *         name: patchId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Patch jobs retrieved successfully
 */
router.get('/',
  requireRole(['admin', 'user']),
  patchJobsController.validateJobQuery(),
  patchJobsController.getJobs
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}:
 *   get:
 *     summary: Get a specific patch job
 *     tags: [Patch Jobs]
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
 *         description: Patch job retrieved successfully
 *       404:
 *         description: Patch job not found
 */
router.get('/:id',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.getJobById
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}:
 *   put:
 *     summary: Update a patch job
 *     tags: [Patch Jobs]
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
 *               priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               maxRetries:
 *                 type: integer
 *               timeoutMinutes:
 *                 type: integer
 *               rollbackOnFailure:
 *                 type: boolean
 *               notificationSettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Patch job updated successfully
 *       404:
 *         description: Patch job not found
 */
router.put('/:id',
  requireRole(['admin']),
  patchJobsController.validateUUID(),
  patchJobsController.validateUpdateJob(),
  patchJobsController.updateJob
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}:
 *   delete:
 *     summary: Delete a patch job
 *     tags: [Patch Jobs]
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
 *         description: Patch job deleted successfully
 *       404:
 *         description: Patch job not found
 */
router.delete('/:id',
  requireRole(['admin']),
  patchJobsController.validateUUID(),
  patchJobsController.deleteJob
);

// ==================== JOB EXECUTION CONTROL ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/start:
 *   post:
 *     summary: Start a patch job
 *     tags: [Patch Job Control]
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
 *         description: Patch job started successfully
 *       404:
 *         description: Patch job not found
 *       409:
 *         description: Job cannot be started
 */
router.post('/:id/start',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.startJob
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/pause:
 *   post:
 *     summary: Pause a patch job
 *     tags: [Patch Job Control]
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
 *         description: Patch job paused successfully
 *       404:
 *         description: Patch job not found
 */
router.post('/:id/pause',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.pauseJob
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/resume:
 *   post:
 *     summary: Resume a patch job
 *     tags: [Patch Job Control]
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
 *         description: Patch job resumed successfully
 *       404:
 *         description: Patch job not found
 */
router.post('/:id/resume',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.resumeJob
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/cancel:
 *   post:
 *     summary: Cancel a patch job
 *     tags: [Patch Job Control]
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
 *         description: Patch job cancelled successfully
 *       404:
 *         description: Patch job not found
 */
router.post('/:id/cancel',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.cancelJob
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/rollback:
 *   post:
 *     summary: Rollback a patch job
 *     tags: [Patch Job Control]
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
 *         description: Patch job rollback initiated successfully
 *       404:
 *         description: Patch job not found
 */
router.post('/:id/rollback',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.rollbackJob
);

// ==================== JOB TARGETS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/targets:
 *   post:
 *     summary: Add targets to a patch job
 *     tags: [Patch Job Targets]
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
 *             required:
 *               - targets
 *             properties:
 *               targets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - assetUuid
 *                   properties:
 *                     assetUuid:
 *                       type: string
 *                       format: uuid
 *                     executionOrder:
 *                       type: integer
 *                     isRequired:
 *                       type: boolean
 *     responses:
 *       201:
 *         description: Targets added successfully
 */
router.post('/:id/targets',
  requireRole(['admin']),
  patchJobsController.validateUUID(),
  patchJobsController.validateAddTargets(),
  patchJobsController.addJobTargets
);

router.get('/:id/targets',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.getJobTargets
);

router.delete('/:id/targets/:targetId',
  requireRole(['admin']),
  patchJobsController.validateUUID(),
  patchJobsController.removeJobTarget
);

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/targets/{targetId}/status:
 *   put:
 *     summary: Update job target status
 *     tags: [Patch Job Targets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: targetId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, running, completed, failed, cancelled, skipped]
 *               notes:
 *                 type: string
 *               errorDetails:
 *                 type: string
 *     responses:
 *       200:
 *         description: Target status updated successfully
 */
router.put('/:id/targets/:targetId/status',
  requireRole(['admin']),
  patchJobsController.validateUUID(),
  patchJobsController.validateUpdateTargetStatus(),
  patchJobsController.updateJobTargetStatus
);

// ==================== JOB DEPENDENCIES ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/dependencies:
 *   post:
 *     summary: Add job dependency
 *     tags: [Patch Job Dependencies]
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
 *             required:
 *               - dependsOnJobId
 *             properties:
 *               dependsOnJobId:
 *                 type: string
 *                 format: uuid
 *               dependencyType:
 *                 type: string
 *                 enum: [blocks, requires_success]
 *                 default: blocks
 *     responses:
 *       201:
 *         description: Dependency added successfully
 *       409:
 *         description: Circular dependency detected
 */
router.post('/:id/dependencies',
  requireRole(['admin']),
  patchJobsController.validateUUID(),
  patchJobsController.validateJobDependency(),
  patchJobsController.addJobDependency
);

router.get('/:id/dependencies',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.getJobDependencies
);

router.delete('/:id/dependencies/:dependencyId',
  requireRole(['admin']),
  patchJobsController.validateUUID(),
  patchJobsController.removeJobDependency
);

// ==================== JOB LOGS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-jobs/{id}/logs:
 *   get:
 *     summary: Get job logs
 *     tags: [Patch Job Logs]
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
 *           default: 100
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *       - in: query
 *         name: component
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job logs retrieved successfully
 */
router.get('/:id/logs',
  requireRole(['admin', 'user']),
  patchJobsController.validateUUID(),
  patchJobsController.getJobLogs
);

// ==================== ANALYTICS & REPORTING ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-jobs/analytics:
 *   get:
 *     summary: Get job analytics
 *     tags: [Patch Job Analytics]
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
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: executionType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 */
router.get('/analytics',
  requireRole(['admin', 'user']),
  patchJobsController.getJobAnalytics
);

/**
 * @swagger
 * /api/v1/patch-jobs/execution-report:
 *   get:
 *     summary: Get execution report
 *     tags: [Patch Job Analytics]
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
 *         name: includeTargets
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: includeLogs
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Execution report retrieved successfully
 */
router.get('/execution-report',
  requireRole(['admin', 'user']),
  patchJobsController.getExecutionReport
);

// ==================== BULK OPERATIONS ROUTES ====================

/**
 * @swagger
 * /api/v1/patch-jobs/bulk/update-status:
 *   put:
 *     summary: Bulk update job status
 *     tags: [Patch Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobIds
 *               - status
 *             properties:
 *               jobIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               status:
 *                 type: string
 *                 enum: [cancelled, paused]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Jobs updated successfully
 */
router.put('/bulk/update-status',
  requireRole(['admin', 'user']),
  patchJobsController.bulkUpdateJobStatus
);

module.exports = router;