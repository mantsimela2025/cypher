const patchScheduleService = require('../services/patchScheduleService');
const { body, param, query, validationResult } = require('express-validator');

class PatchSchedulesController {

  // ==================== VALIDATION MIDDLEWARE ====================

  validateCreateSchedule() {
    return [
      body('name').notEmpty().withMessage('Schedule name is required'),
      body('cronExpression').notEmpty().withMessage('CRON expression is required'),
      body('patchId').optional().isUUID().withMessage('Invalid patch ID'),
      body('patchCriteria').optional().isObject().withMessage('Patch criteria must be object'),
      body('targetAssets').optional().isArray().withMessage('Target assets must be array'),
      body('targetAssets.*').optional().isUUID().withMessage('Each target asset must be valid UUID'),
      body('maintenanceWindowId').optional().isInt({ min: 1 }).withMessage('Invalid maintenance window ID'),
      body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
      body('maxConcurrentJobs').optional().isInt({ min: 1, max: 100 }).withMessage('Max concurrent jobs must be between 1 and 100'),
      body('retryOnFailure').optional().isBoolean().withMessage('Retry on failure must be boolean'),
      body('maxRetries').optional().isInt({ min: 0, max: 10 }).withMessage('Max retries must be between 0 and 10'),
      body('rollbackOnFailure').optional().isBoolean().withMessage('Rollback on failure must be boolean'),
      body('requiresApproval').optional().isBoolean().withMessage('Requires approval must be boolean'),
      body('notificationSettings').optional().isObject().withMessage('Notification settings must be object'),
      body('executionConditions').optional().isObject().withMessage('Execution conditions must be object')
    ];
  }

  validateUpdateSchedule() {
    return [
      body('name').optional().notEmpty().withMessage('Schedule name cannot be empty'),
      body('cronExpression').optional().notEmpty().withMessage('CRON expression cannot be empty'),
      body('patchId').optional().isUUID().withMessage('Invalid patch ID'),
      body('patchCriteria').optional().isObject().withMessage('Patch criteria must be object'),
      body('targetAssets').optional().isArray().withMessage('Target assets must be array'),
      body('targetAssets.*').optional().isUUID().withMessage('Each target asset must be valid UUID'),
      body('maintenanceWindowId').optional().isInt({ min: 1 }).withMessage('Invalid maintenance window ID'),
      body('priority').optional().isInt({ min: 1, max: 5 }).withMessage('Priority must be between 1 and 5'),
      body('maxConcurrentJobs').optional().isInt({ min: 1, max: 100 }).withMessage('Max concurrent jobs must be between 1 and 100'),
      body('retryOnFailure').optional().isBoolean().withMessage('Retry on failure must be boolean'),
      body('maxRetries').optional().isInt({ min: 0, max: 10 }).withMessage('Max retries must be between 0 and 10'),
      body('rollbackOnFailure').optional().isBoolean().withMessage('Rollback on failure must be boolean'),
      body('requiresApproval').optional().isBoolean().withMessage('Requires approval must be boolean'),
      body('notificationSettings').optional().isObject().withMessage('Notification settings must be object'),
      body('executionConditions').optional().isObject().withMessage('Execution conditions must be object'),
      body('isEnabled').optional().isBoolean().withMessage('Is enabled must be boolean')
    ];
  }

  validateScheduleQuery() {
    return [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name', 'nextExecution', 'lastExecution']).withMessage('Invalid sort field'),
      query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
      query('isEnabled').optional().isBoolean().withMessage('Is enabled must be boolean'),
      query('patchId').optional().isUUID().withMessage('Invalid patch ID'),
      query('search').optional().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
      query('createdBy').optional().isInt({ min: 1 }).withMessage('Created by must be positive integer'),
      query('nextExecutionFrom').optional().isISO8601().withMessage('Invalid from date'),
      query('nextExecutionTo').optional().isISO8601().withMessage('Invalid to date')
    ];
  }

  validateUUID() {
    return [
      param('id').isUUID().withMessage('Invalid UUID format')
    ];
  }

  validateCronExpressionInput() {
    return [
      body('cronExpression').notEmpty().withMessage('CRON expression is required')
    ];
  }

  validateMaintenanceWindow() {
    return [
      body('name').notEmpty().withMessage('Window name is required'),
      body('description').optional().isString().withMessage('Description must be string'),
      body('startTime').isISO8601().withMessage('Valid start time is required'),
      body('endTime').isISO8601().withMessage('Valid end time is required'),
      body('timezone').optional().isString().withMessage('Timezone must be string'),
      body('recurrence').optional().isObject().withMessage('Recurrence must be object'),
      body('allowedDays').optional().isArray().withMessage('Allowed days must be array'),
      body('allowedDays.*').optional().isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).withMessage('Invalid day'),
      body('blackoutDates').optional().isArray().withMessage('Blackout dates must be array'),
      body('blackoutDates.*').optional().isISO8601().withMessage('Each blackout date must be valid')
    ];
  }

  // ==================== SCHEDULE MANAGEMENT ====================

  async createSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const result = await patchScheduleService.createSchedule(req.body, req.user.id);
      
      res.status(201).json({
        message: 'Patch schedule created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating patch schedule:', error);
      if (error.message.includes('Invalid CRON expression')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getSchedules(req, res) {
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
      if (req.query.isEnabled !== undefined) {
        filters.isEnabled = req.query.isEnabled === 'true';
      }
      if (req.query.patchId) {
        filters.patchId = req.query.patchId;
      }
      if (req.query.search) {
        filters.search = req.query.search;
      }
      if (req.query.createdBy) {
        filters.createdBy = parseInt(req.query.createdBy);
      }
      if (req.query.nextExecutionFrom) {
        filters.nextExecutionFrom = new Date(req.query.nextExecutionFrom);
      }
      if (req.query.nextExecutionTo) {
        filters.nextExecutionTo = new Date(req.query.nextExecutionTo);
      }

      const result = await patchScheduleService.getSchedules(filters, pagination);
      res.json(result);
    } catch (error) {
      console.error('Error fetching patch schedules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getScheduleById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchScheduleService.getScheduleById(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch schedule not found' });
      }
      
      res.json({ data: result });
    } catch (error) {
      console.error('Error fetching patch schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchScheduleService.updateSchedule(id, req.body, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch schedule not found' });
      }
      
      res.json({
        message: 'Patch schedule updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating patch schedule:', error);
      if (error.message.includes('Invalid CRON expression')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchScheduleService.deleteSchedule(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch schedule not found' });
      }
      
      res.json({ message: 'Patch schedule deleted successfully' });
    } catch (error) {
      console.error('Error deleting patch schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SCHEDULE CONTROL ====================

  async enableSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchScheduleService.enableSchedule(id, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch schedule not found' });
      }
      
      res.json({
        message: 'Patch schedule enabled successfully',
        data: result
      });
    } catch (error) {
      console.error('Error enabling patch schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async disableSchedule(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchScheduleService.disableSchedule(id, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch schedule not found' });
      }
      
      res.json({
        message: 'Patch schedule disabled successfully',
        data: result
      });
    } catch (error) {
      console.error('Error disabling patch schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async triggerScheduleNow(req, res) {
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
      
      const result = await patchScheduleService.triggerScheduleNow(id, req.user.id, reason);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch schedule not found or cannot be triggered' });
      }
      
      res.json({
        message: 'Patch schedule triggered successfully',
        data: result
      });
    } catch (error) {
      console.error('Error triggering patch schedule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== CRON VALIDATION ====================

  async validateCronExpression(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { cronExpression } = req.body;
      const result = await patchScheduleService.validateCronExpression(cronExpression);
      
      res.json({
        message: 'CRON expression validated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error validating CRON expression:', error);
      if (error.message.includes('Invalid CRON expression')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getNextExecutions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { cronExpression } = req.body;
      const count = parseInt(req.query.count) || 5;
      
      const result = await patchScheduleService.getNextExecutions(cronExpression, count);
      
      res.json({
        message: 'Next executions calculated successfully',
        data: result,
        count: result.length
      });
    } catch (error) {
      console.error('Error calculating next executions:', error);
      if (error.message.includes('Invalid CRON expression')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== MAINTENANCE WINDOWS ====================

  async createMaintenanceWindow(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const result = await patchScheduleService.createMaintenanceWindow(req.body, req.user.id);
      
      res.status(201).json({
        message: 'Maintenance window created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating maintenance window:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMaintenanceWindows(req, res) {
    try {
      const result = await patchScheduleService.getMaintenanceWindows();
      
      res.json({
        data: result,
        count: result.length
      });
    } catch (error) {
      console.error('Error fetching maintenance windows:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateMaintenanceWindow(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchScheduleService.updateMaintenanceWindow(parseInt(id), req.body, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Maintenance window not found' });
      }
      
      res.json({
        message: 'Maintenance window updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating maintenance window:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteMaintenanceWindow(req, res) {
    try {
      const { id } = req.params;
      const result = await patchScheduleService.deleteMaintenanceWindow(parseInt(id));
      
      if (!result) {
        return res.status(404).json({ error: 'Maintenance window not found' });
      }
      
      res.json({ message: 'Maintenance window deleted successfully' });
    } catch (error) {
      console.error('Error deleting maintenance window:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== EXECUTION HISTORY ====================

  async getScheduleExecutionHistory(req, res) {
    try {
      const { id } = req.params;
      
      // Extract pagination
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'executionTime',
        sortOrder: req.query.sortOrder || 'desc'
      };

      // Extract filters
      const filters = {};
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.executionTimeFrom) {
        filters.executionTimeFrom = new Date(req.query.executionTimeFrom);
      }
      if (req.query.executionTimeTo) {
        filters.executionTimeTo = new Date(req.query.executionTimeTo);
      }

      const result = await patchScheduleService.getScheduleExecutionHistory(id, filters, pagination);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching schedule execution history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getScheduleAnalytics(req, res) {
    try {
      // Extract filters for analytics
      const filters = {};
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }
      if (req.query.scheduleId) {
        filters.scheduleId = req.query.scheduleId;
      }

      const result = await patchScheduleService.getScheduleAnalytics(filters);
      
      res.json({
        message: 'Schedule analytics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching schedule analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getExecutionCalendar(req, res) {
    try {
      const { month, year } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({ error: 'Month and year are required' });
      }

      const result = await patchScheduleService.getExecutionCalendar(
        parseInt(year), 
        parseInt(month)
      );
      
      res.json({
        message: 'Execution calendar retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching execution calendar:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkEnableSchedules(req, res) {
    try {
      const { scheduleIds } = req.body;

      if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        return res.status(400).json({ error: 'Schedule IDs array is required' });
      }

      const results = await Promise.all(
        scheduleIds.map(scheduleId => patchScheduleService.enableSchedule(scheduleId, req.user.id))
      );

      const successCount = results.filter(result => result !== null).length;
      
      res.json({
        message: `${successCount} schedules enabled successfully`,
        successCount,
        totalCount: scheduleIds.length
      });
    } catch (error) {
      console.error('Error bulk enabling schedules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async bulkDisableSchedules(req, res) {
    try {
      const { scheduleIds } = req.body;

      if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        return res.status(400).json({ error: 'Schedule IDs array is required' });
      }

      const results = await Promise.all(
        scheduleIds.map(scheduleId => patchScheduleService.disableSchedule(scheduleId, req.user.id))
      );

      const successCount = results.filter(result => result !== null).length;
      
      res.json({
        message: `${successCount} schedules disabled successfully`,
        successCount,
        totalCount: scheduleIds.length
      });
    } catch (error) {
      console.error('Error bulk disabling schedules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async bulkDeleteSchedules(req, res) {
    try {
      const { scheduleIds } = req.body;

      if (!Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        return res.status(400).json({ error: 'Schedule IDs array is required' });
      }

      const results = await Promise.all(
        scheduleIds.map(scheduleId => patchScheduleService.deleteSchedule(scheduleId))
      );

      const successCount = results.filter(result => result !== null).length;
      
      res.json({
        message: `${successCount} schedules deleted successfully`,
        successCount,
        totalCount: scheduleIds.length
      });
    } catch (error) {
      console.error('Error bulk deleting schedules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new PatchSchedulesController();