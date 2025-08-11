const patchExecutionService = require('../services/patchExecutionService');
const { body, param, query, validationResult } = require('express-validator');

class PatchJobsController {

  // ==================== VALIDATION MIDDLEWARE ====================

  validateCreateJob() {
    return [
      body('patchId').isUUID().withMessage('Valid patch ID is required'),
      body('executionType').isIn(['immediate', 'scheduled', 'maintenance_window']).withMessage('Invalid execution type'),
      body('scheduledFor').optional().isISO8601().withMessage('Invalid scheduled date'),
      body('maintenanceWindowId').optional().isInt({ min: 1 }).withMessage('Invalid maintenance window ID'),
      body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
      body('maxRetries').optional().isInt({ min: 0, max: 10 }).withMessage('Max retries must be between 0 and 10'),
      body('timeoutMinutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Timeout must be between 1 and 1440 minutes'),
      body('rollbackOnFailure').optional().isBoolean().withMessage('Rollback on failure must be boolean'),
      body('requiresApproval').optional().isBoolean().withMessage('Requires approval must be boolean'),
      body('notificationSettings').optional().isObject().withMessage('Notification settings must be object'),
      body('executionSettings').optional().isObject().withMessage('Execution settings must be object')
    ];
  }

  validateUpdateJob() {
    return [
      body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
      body('scheduledFor').optional().isISO8601().withMessage('Invalid scheduled date'),
      body('maxRetries').optional().isInt({ min: 0, max: 10 }).withMessage('Max retries must be between 0 and 10'),
      body('timeoutMinutes').optional().isInt({ min: 1, max: 1440 }).withMessage('Timeout must be between 1 and 1440 minutes'),
      body('rollbackOnFailure').optional().isBoolean().withMessage('Rollback on failure must be boolean'),
      body('notificationSettings').optional().isObject().withMessage('Notification settings must be object'),
      body('executionSettings').optional().isObject().withMessage('Execution settings must be object')
    ];
  }

  validateJobQuery() {
    return [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('sortBy').optional().isIn(['createdAt', 'scheduledFor', 'startedAt', 'completedAt', 'priority', 'status']).withMessage('Invalid sort field'),
      query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
      query('status').optional(),
      query('executionType').optional(),
      query('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
      query('scheduledDateFrom').optional().isISO8601().withMessage('Invalid from date'),
      query('scheduledDateTo').optional().isISO8601().withMessage('Invalid to date'),
      query('patchId').optional().isUUID().withMessage('Invalid patch ID'),
      query('createdBy').optional().isInt({ min: 1 }).withMessage('Created by must be positive integer')
    ];
  }

  validateUUID() {
    return [
      param('id').isUUID().withMessage('Invalid UUID format')
    ];
  }

  validateAddTargets() {
    return [
      body('targets').isArray({ min: 1 }).withMessage('Targets array is required'),
      body('targets.*.assetUuid').isUUID().withMessage('Each target must have valid asset UUID'),
      body('targets.*.executionOrder').optional().isInt({ min: 1 }).withMessage('Execution order must be positive integer'),
      body('targets.*.isRequired').optional().isBoolean().withMessage('Is required must be boolean')
    ];
  }

  validateUpdateTargetStatus() {
    return [
      body('status').isIn(['pending', 'running', 'completed', 'failed', 'cancelled', 'skipped']).withMessage('Invalid status'),
      body('notes').optional().isString().withMessage('Notes must be string'),
      body('errorDetails').optional().isString().withMessage('Error details must be string')
    ];
  }

  validateJobDependency() {
    return [
      body('dependsOnJobId').isUUID().withMessage('Valid job ID dependency is required'),
      body('dependencyType').optional().isIn(['blocks', 'requires_success']).withMessage('Invalid dependency type')
    ];
  }

  // ==================== JOB MANAGEMENT ====================

  async createJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const result = await patchExecutionService.createJob(req.body, req.user.id);
      
      res.status(201).json({
        message: 'Patch job created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getJobs(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      // Extract and validate pagination parameters
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      // Extract filters
      const filters = {};
      if (req.query.status) {
        filters.status = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
      }
      if (req.query.executionType) {
        filters.executionType = req.query.executionType;
      }
      if (req.query.priority) {
        filters.priority = parseInt(req.query.priority);
      }
      if (req.query.scheduledDateFrom) {
        filters.scheduledDateFrom = new Date(req.query.scheduledDateFrom);
      }
      if (req.query.scheduledDateTo) {
        filters.scheduledDateTo = new Date(req.query.scheduledDateTo);
      }
      if (req.query.patchId) {
        filters.patchId = req.query.patchId;
      }
      if (req.query.createdBy) {
        filters.createdBy = parseInt(req.query.createdBy);
      }

      const result = await patchExecutionService.getJobs(filters, pagination);
      res.json(result);
    } catch (error) {
      console.error('Error fetching patch jobs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getJobById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchExecutionService.getJobById(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found' });
      }
      
      res.json({ data: result });
    } catch (error) {
      console.error('Error fetching patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchExecutionService.updateJob(id, req.body, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found' });
      }
      
      res.json({
        message: 'Patch job updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchExecutionService.deleteJob(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found' });
      }
      
      res.json({ message: 'Patch job deleted successfully' });
    } catch (error) {
      console.error('Error deleting patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== JOB EXECUTION CONTROL ====================

  async startJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchExecutionService.startJob(id, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found or cannot be started' });
      }
      
      res.json({
        message: 'Patch job started successfully',
        data: result
      });
    } catch (error) {
      console.error('Error starting patch job:', error);
      if (error.message.includes('Job is not in a startable state')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async pauseJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchExecutionService.pauseJob(id, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found or cannot be paused' });
      }
      
      res.json({
        message: 'Patch job paused successfully',
        data: result
      });
    } catch (error) {
      console.error('Error pausing patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async resumeJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchExecutionService.resumeJob(id, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found or cannot be resumed' });
      }
      
      res.json({
        message: 'Patch job resumed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error resuming patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async cancelJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const { reason } = req.body;
      
      const result = await patchExecutionService.cancelJob(id, req.user.id, reason);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found or cannot be cancelled' });
      }
      
      res.json({
        message: 'Patch job cancelled successfully',
        data: result
      });
    } catch (error) {
      console.error('Error cancelling patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async rollbackJob(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const { reason } = req.body;
      
      const result = await patchExecutionService.rollbackJob(id, req.user.id, reason);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch job not found or cannot be rolled back' });
      }
      
      res.json({
        message: 'Patch job rollback initiated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error rolling back patch job:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== JOB TARGETS MANAGEMENT ====================

  async addJobTargets(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: jobId } = req.params;
      const { targets } = req.body;

      const result = await patchExecutionService.addJobTargets(jobId, targets, req.user.id);
      
      res.status(201).json({
        message: 'Targets added to job successfully',
        data: result
      });
    } catch (error) {
      console.error('Error adding job targets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeJobTarget(req, res) {
    try {
      const { id: jobId, targetId } = req.params;

      const result = await patchExecutionService.removeJobTarget(jobId, parseInt(targetId));
      
      if (!result) {
        return res.status(404).json({ error: 'Job target not found' });
      }
      
      res.json({ message: 'Target removed from job successfully' });
    } catch (error) {
      console.error('Error removing job target:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateJobTargetStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: jobId, targetId } = req.params;
      const { status, notes, errorDetails } = req.body;

      const result = await patchExecutionService.updateJobTargetStatus(
        parseInt(targetId), 
        status, 
        notes, 
        errorDetails
      );
      
      if (!result) {
        return res.status(404).json({ error: 'Job target not found' });
      }
      
      res.json({
        message: 'Job target status updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating job target status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getJobTargets(req, res) {
    try {
      const { id: jobId } = req.params;
      
      const result = await patchExecutionService.getJobTargets(jobId);
      
      res.json({
        data: result,
        count: result.length
      });
    } catch (error) {
      console.error('Error fetching job targets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== JOB DEPENDENCIES ====================

  async addJobDependency(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: jobId } = req.params;
      const { dependsOnJobId, dependencyType } = req.body;

      const result = await patchExecutionService.addJobDependency(
        jobId, 
        dependsOnJobId, 
        dependencyType || 'blocks'
      );
      
      res.status(201).json({
        message: 'Job dependency added successfully',
        data: result
      });
    } catch (error) {
      console.error('Error adding job dependency:', error);
      if (error.message.includes('Circular dependency')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async removeJobDependency(req, res) {
    try {
      const { id: jobId, dependencyId } = req.params;

      const result = await patchExecutionService.removeJobDependency(parseInt(dependencyId));
      
      if (!result) {
        return res.status(404).json({ error: 'Job dependency not found' });
      }
      
      res.json({ message: 'Job dependency removed successfully' });
    } catch (error) {
      console.error('Error removing job dependency:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getJobDependencies(req, res) {
    try {
      const { id: jobId } = req.params;
      
      const result = await patchExecutionService.getJobDependencies(jobId);
      
      res.json({
        data: result,
        count: result.length
      });
    } catch (error) {
      console.error('Error fetching job dependencies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== JOB LOGS ====================

  async getJobLogs(req, res) {
    try {
      const { id: jobId } = req.params;
      
      // Extract pagination for logs
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 100,
        sortBy: req.query.sortBy || 'timestamp',
        sortOrder: req.query.sortOrder || 'desc'
      };

      // Extract filters
      const filters = {};
      if (req.query.level) {
        filters.level = req.query.level;
      }
      if (req.query.component) {
        filters.component = req.query.component;
      }
      if (req.query.timestampFrom) {
        filters.timestampFrom = new Date(req.query.timestampFrom);
      }
      if (req.query.timestampTo) {
        filters.timestampTo = new Date(req.query.timestampTo);
      }

      const result = await patchExecutionService.getJobLogs(jobId, filters, pagination);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching job logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getJobAnalytics(req, res) {
    try {
      // Extract filters for analytics
      const filters = {};
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.executionType) {
        filters.executionType = req.query.executionType;
      }

      const result = await patchExecutionService.getJobAnalytics(filters);
      
      res.json({
        message: 'Job analytics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching job analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getExecutionReport(req, res) {
    try {
      // Extract filters for execution report
      const filters = {};
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }
      if (req.query.includeTargets) {
        filters.includeTargets = req.query.includeTargets === 'true';
      }
      if (req.query.includeLogs) {
        filters.includeLogs = req.query.includeLogs === 'true';
      }

      const result = await patchExecutionService.getExecutionReport(filters);
      
      res.json({
        message: 'Execution report retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching execution report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkUpdateJobStatus(req, res) {
    try {
      const { jobIds, status, reason } = req.body;

      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        return res.status(400).json({ error: 'Job IDs array is required' });
      }

      if (!['cancelled', 'paused'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status for bulk operation' });
      }

      const results = await Promise.all(
        jobIds.map(async (jobId) => {
          try {
            if (status === 'cancelled') {
              return await patchExecutionService.cancelJob(jobId, req.user.id, reason);
            } else if (status === 'paused') {
              return await patchExecutionService.pauseJob(jobId, req.user.id);
            }
          } catch (error) {
            console.error(`Error updating job ${jobId}:`, error);
            return null;
          }
        })
      );

      const successCount = results.filter(result => result !== null).length;
      
      res.json({
        message: `${successCount} jobs updated successfully`,
        successCount,
        totalCount: jobIds.length
      });
    } catch (error) {
      console.error('Error bulk updating job status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new PatchJobsController();