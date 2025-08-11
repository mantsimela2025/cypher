const { db } = require('../db');
const {
  patchSchedules,
  scheduleExecutions,
  scheduleConditions,
  scheduleExclusions,
  scheduleNotifications,
  patches,
  users
} = require('../db/schema');
const { eq, and, gte, lte, like, desc, asc, sql, or, inArray, isNull, isNotNull } = require('drizzle-orm');
const cron = require('node-cron');

class PatchScheduleService {
  
  // ==================== SCHEDULE MANAGEMENT ====================
  
  async createSchedule(data, userId) {
    const scheduleData = {
      ...data,
      createdBy: userId,
      updatedBy: userId
    };
    
    // Validate cron expression if provided
    if (scheduleData.cronExpression) {
      if (!cron.validate(scheduleData.cronExpression)) {
        throw new Error('Invalid cron expression');
      }
    }

    // Calculate next run time
    if (scheduleData.scheduleType === 'recurring' && scheduleData.cronExpression) {
      scheduleData.nextRunTime = this._calculateNextRunTime(
        scheduleData.cronExpression, 
        scheduleData.startDate,
        scheduleData.timezone || 'UTC'
      );
    } else if (scheduleData.scheduleType === 'one_time') {
      scheduleData.nextRunTime = scheduleData.startDate;
    }
    
    const [result] = await db.insert(patchSchedules)
      .values(scheduleData)
      .returning();
    
    return result;
  }

  async getSchedules(filters = {}, pagination = {}) {
    console.log('🔍 Service getSchedules called with:', { filters, pagination });

    // Test if table exists by running a simple count query
    try {
      console.log('🧪 Testing patch_schedules table existence...');
      const testResult = await db.select({ count: sql`count(*)` }).from(patchSchedules);
      console.log('✅ Patch schedules table exists, count:', testResult);
    } catch (testError) {
      console.error('❌ Patch schedules table test failed:', testError.message);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        }
      };
    }

    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = db.select({
      // Main schedule fields
      id: patchSchedules.id,
      name: patchSchedules.name,
      description: patchSchedules.description,
      scheduleType: patchSchedules.scheduleType,
      status: patchSchedules.status,
      startDate: patchSchedules.startDate,
      endDate: patchSchedules.endDate,
      nextRunTime: patchSchedules.nextRunTime,
      lastRunTime: patchSchedules.lastRunTime,
      recurrencePattern: patchSchedules.recurrencePattern,
      cronExpression: patchSchedules.cronExpression,
      timezone: patchSchedules.timezone,
      recurrenceInterval: patchSchedules.recurrenceInterval,
      autoApprove: patchSchedules.autoApprove,
      requireApproval: patchSchedules.requireApproval,
      maxConcurrentJobs: patchSchedules.maxConcurrentJobs,
      continueOnError: patchSchedules.continueOnError,
      maintenanceWindowType: patchSchedules.maintenanceWindowType,
      maintenanceWindowStart: patchSchedules.maintenanceWindowStart,
      maintenanceWindowEnd: patchSchedules.maintenanceWindowEnd,
      maintenanceWindowDays: patchSchedules.maintenanceWindowDays,
      enableAutoRollback: patchSchedules.enableAutoRollback,
      rollbackThreshold: patchSchedules.rollbackThreshold,
      totalRuns: patchSchedules.totalRuns,
      successfulRuns: patchSchedules.successfulRuns,
      failedRuns: patchSchedules.failedRuns,
      averageRunDuration: patchSchedules.averageRunDuration,
      isTemplate: patchSchedules.isTemplate,
      createdBy: patchSchedules.createdBy,
      createdAt: patchSchedules.createdAt,
      updatedAt: patchSchedules.updatedAt,
      
      // Creator details
      creatorUsername: users.username,
      creatorEmail: users.email,
      
      // Calculate time until next run
      timeUntilNextRun: sql`CASE 
        WHEN ${patchSchedules.nextRunTime} IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (${patchSchedules.nextRunTime} - NOW())) / 3600
        ELSE NULL 
      END`,
      
      // Calculate success rate
      successRate: sql`CASE 
        WHEN ${patchSchedules.totalRuns} > 0 
        THEN ROUND(${patchSchedules.successfulRuns} * 100.0 / ${patchSchedules.totalRuns}, 2)
        ELSE NULL 
      END`
    })
    .from(patchSchedules)
    .leftJoin(users, eq(patchSchedules.createdBy, users.id));

    // Apply filters
    const conditions = this._buildScheduleFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = patchSchedules[sortBy] || patchSchedules.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(patchSchedules)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  async getScheduleById(id) {
    const [result] = await db.select({
      // Full schedule data
      id: patchSchedules.id,
      name: patchSchedules.name,
      description: patchSchedules.description,
      scheduleType: patchSchedules.scheduleType,
      status: patchSchedules.status,
      startDate: patchSchedules.startDate,
      endDate: patchSchedules.endDate,
      nextRunTime: patchSchedules.nextRunTime,
      lastRunTime: patchSchedules.lastRunTime,
      recurrencePattern: patchSchedules.recurrencePattern,
      cronExpression: patchSchedules.cronExpression,
      timezone: patchSchedules.timezone,
      recurrenceInterval: patchSchedules.recurrenceInterval,
      patchIds: patchSchedules.patchIds,
      patchCriteria: patchSchedules.patchCriteria,
      targetAssets: patchSchedules.targetAssets,
      targetGroups: patchSchedules.targetGroups,
      targetFilter: patchSchedules.targetFilter,
      autoApprove: patchSchedules.autoApprove,
      requireApproval: patchSchedules.requireApproval,
      maxConcurrentJobs: patchSchedules.maxConcurrentJobs,
      continueOnError: patchSchedules.continueOnError,
      maintenanceWindowType: patchSchedules.maintenanceWindowType,
      maintenanceWindowStart: patchSchedules.maintenanceWindowStart,
      maintenanceWindowEnd: patchSchedules.maintenanceWindowEnd,
      maintenanceWindowDays: patchSchedules.maintenanceWindowDays,
      maxMaintenanceDuration: patchSchedules.maxMaintenanceDuration,
      enableAutoRollback: patchSchedules.enableAutoRollback,
      rollbackThreshold: patchSchedules.rollbackThreshold,
      rollbackDelayMinutes: patchSchedules.rollbackDelayMinutes,
      notifyOnStart: patchSchedules.notifyOnStart,
      notifyOnComplete: patchSchedules.notifyOnComplete,
      notifyOnError: patchSchedules.notifyOnError,
      notificationTargets: patchSchedules.notificationTargets,
      totalRuns: patchSchedules.totalRuns,
      successfulRuns: patchSchedules.successfulRuns,
      failedRuns: patchSchedules.failedRuns,
      averageRunDuration: patchSchedules.averageRunDuration,
      lastExecutionSummary: patchSchedules.lastExecutionSummary,
      isTemplate: patchSchedules.isTemplate,
      templateSource: patchSchedules.templateSource,
      tags: patchSchedules.tags,
      createdBy: patchSchedules.createdBy,
      updatedBy: patchSchedules.updatedBy,
      createdAt: patchSchedules.createdAt,
      updatedAt: patchSchedules.updatedAt
    })
    .from(patchSchedules)
    .where(eq(patchSchedules.id, id))
    .limit(1);
    
    return result;
  }

  async updateSchedule(id, data, userId) {
    const updateData = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date()
    };

    // Validate cron expression if provided
    if (updateData.cronExpression) {
      if (!cron.validate(updateData.cronExpression)) {
        throw new Error('Invalid cron expression');
      }
    }

    // Recalculate next run time if schedule details changed
    if (updateData.cronExpression || updateData.startDate || updateData.scheduleType) {
      if (updateData.scheduleType === 'recurring' && updateData.cronExpression) {
        updateData.nextRunTime = this._calculateNextRunTime(
          updateData.cronExpression, 
          updateData.startDate,
          updateData.timezone || 'UTC'
        );
      } else if (updateData.scheduleType === 'one_time') {
        updateData.nextRunTime = updateData.startDate;
      }
    }

    const [result] = await db.update(patchSchedules)
      .set(updateData)
      .where(eq(patchSchedules.id, id))
      .returning();
    
    return result;
  }

  async deleteSchedule(id) {
    const [result] = await db.delete(patchSchedules)
      .where(eq(patchSchedules.id, id))
      .returning();
    
    return result;
  }

  // ==================== SCHEDULE EXECUTION CONTROL ====================
  
  async activateSchedule(id, userId) {
    const updateData = {
      status: 'active',
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchSchedules)
      .set(updateData)
      .where(eq(patchSchedules.id, id))
      .returning();

    return result;
  }

  async pauseSchedule(id, userId) {
    const updateData = {
      status: 'paused',
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchSchedules)
      .set(updateData)
      .where(eq(patchSchedules.id, id))
      .returning();

    return result;
  }

  async disableSchedule(id, userId) {
    const updateData = {
      status: 'disabled',
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchSchedules)
      .set(updateData)
      .where(eq(patchSchedules.id, id))
      .returning();

    return result;
  }

  async executeScheduleNow(scheduleId, userId) {
    const schedule = await this.getScheduleById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    // Create execution record
    const execution = await this.createExecution(scheduleId, 'started', userId);
    
    try {
      // Execute schedule logic here
      // This would typically involve creating patch jobs based on schedule criteria
      const jobs = await this._createJobsFromSchedule(schedule, execution.id);
      
      // Update execution with job information
      await this.updateExecution(execution.id, {
        status: 'completed',
        totalJobs: jobs.length,
        generatedJobIds: JSON.stringify(jobs.map(j => j.id)),
        endTime: new Date(),
        duration: Math.floor((new Date() - new Date(execution.startTime)) / (1000 * 60))
      });

      // Update schedule statistics
      await this.updateScheduleStats(scheduleId, true, execution.duration);

      return { execution, jobs };
    } catch (error) {
      await this.updateExecution(execution.id, {
        status: 'failed',
        errorMessage: error.message,
        endTime: new Date()
      });

      await this.updateScheduleStats(scheduleId, false);
      throw error;
    }
  }

  // ==================== SCHEDULE EXECUTION HISTORY ====================
  
  async createExecution(scheduleId, status, userId) {
    const executionData = {
      scheduleId,
      executionTime: new Date(),
      status,
      startTime: new Date()
    };

    const [result] = await db.insert(scheduleExecutions)
      .values(executionData)
      .returning();

    return result;
  }

  async updateExecution(executionId, data) {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const [result] = await db.update(scheduleExecutions)
      .set(updateData)
      .where(eq(scheduleExecutions.id, executionId))
      .returning();

    return result;
  }

  async getScheduleExecutions(scheduleId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    const results = await db.select()
      .from(scheduleExecutions)
      .where(eq(scheduleExecutions.scheduleId, scheduleId))
      .orderBy(desc(scheduleExecutions.executionTime))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(scheduleExecutions)
      .where(eq(scheduleExecutions.scheduleId, scheduleId));

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  // ==================== SCHEDULE CONDITIONS ====================
  
  async createCondition(scheduleId, conditionData) {
    const condition = {
      scheduleId,
      ...conditionData
    };

    const [result] = await db.insert(scheduleConditions)
      .values(condition)
      .returning();

    return result;
  }

  async getScheduleConditions(scheduleId) {
    const results = await db.select()
      .from(scheduleConditions)
      .where(eq(scheduleConditions.scheduleId, scheduleId))
      .orderBy(scheduleConditions.createdAt);

    return results;
  }

  async deleteCondition(conditionId) {
    const [result] = await db.delete(scheduleConditions)
      .where(eq(scheduleConditions.id, conditionId))
      .returning();

    return result;
  }

  // ==================== SCHEDULE EXCLUSIONS ====================
  
  async createExclusion(scheduleId, exclusionData) {
    const exclusion = {
      scheduleId,
      ...exclusionData
    };

    const [result] = await db.insert(scheduleExclusions)
      .values(exclusion)
      .returning();

    return result;
  }

  async getScheduleExclusions(scheduleId) {
    const results = await db.select()
      .from(scheduleExclusions)
      .where(eq(scheduleExclusions.scheduleId, scheduleId))
      .orderBy(scheduleExclusions.createdAt);

    return results;
  }

  async deleteExclusion(exclusionId) {
    const [result] = await db.delete(scheduleExclusions)
      .where(eq(scheduleExclusions.id, exclusionId))
      .returning();

    return result;
  }

  // ==================== SCHEDULE UTILITIES ====================
  
  async getActiveSchedules() {
    const results = await db.select()
      .from(patchSchedules)
      .where(and(
        eq(patchSchedules.status, 'active'),
        or(
          isNull(patchSchedules.endDate),
          gte(patchSchedules.endDate, new Date())
        )
      ))
      .orderBy(patchSchedules.nextRunTime);

    return results;
  }

  async getDueSchedules() {
    const now = new Date();
    
    const results = await db.select()
      .from(patchSchedules)
      .where(and(
        eq(patchSchedules.status, 'active'),
        lte(patchSchedules.nextRunTime, now),
        or(
          isNull(patchSchedules.endDate),
          gte(patchSchedules.endDate, now)
        )
      ))
      .orderBy(patchSchedules.nextRunTime);

    return results;
  }

  async updateScheduleStats(scheduleId, success, duration = null) {
    const schedule = await this.getScheduleById(scheduleId);
    const newTotalRuns = (schedule.totalRuns || 0) + 1;
    const newSuccessfulRuns = success ? (schedule.successfulRuns || 0) + 1 : schedule.successfulRuns;
    const newFailedRuns = !success ? (schedule.failedRuns || 0) + 1 : schedule.failedRuns;
    
    // Calculate new average duration
    let newAverageDuration = schedule.averageRunDuration;
    if (duration && success) {
      const totalDuration = (schedule.averageRunDuration || 0) * (schedule.successfulRuns || 0) + duration;
      newAverageDuration = Math.round(totalDuration / newSuccessfulRuns);
    }

    // Calculate next run time for recurring schedules
    let nextRunTime = schedule.nextRunTime;
    if (schedule.scheduleType === 'recurring' && schedule.cronExpression) {
      nextRunTime = this._calculateNextRunTime(
        schedule.cronExpression,
        new Date(),
        schedule.timezone || 'UTC'
      );
    } else if (schedule.scheduleType === 'one_time') {
      nextRunTime = null; // One-time schedules don't repeat
    }

    await db.update(patchSchedules)
      .set({
        totalRuns: newTotalRuns,
        successfulRuns: newSuccessfulRuns,
        failedRuns: newFailedRuns,
        averageRunDuration: newAverageDuration,
        lastRunTime: new Date(),
        nextRunTime,
        updatedAt: new Date()
      })
      .where(eq(patchSchedules.id, scheduleId));
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getScheduleAnalytics(filters = {}) {
    // Schedule status distribution
    const statusDistribution = await db.select({
      status: patchSchedules.status,
      count: sql`COUNT(*)`,
      percentage: sql`ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2)`
    })
    .from(patchSchedules)
    .groupBy(patchSchedules.status);

    // Schedule type distribution
    const typeDistribution = await db.select({
      scheduleType: patchSchedules.scheduleType,
      count: sql`COUNT(*)`,
      avgSuccessRate: sql`ROUND(AVG(
        CASE WHEN total_runs > 0 THEN successful_runs * 100.0 / total_runs ELSE 0 END
      ), 2)`
    })
    .from(patchSchedules)
    .groupBy(patchSchedules.scheduleType);

    // Execution success rates
    const successRates = await db.select({
      scheduleType: patchSchedules.scheduleType,
      totalSchedules: sql`COUNT(*)`,
      totalExecutions: sql`SUM(${patchSchedules.totalRuns})`,
      successfulExecutions: sql`SUM(${patchSchedules.successfulRuns})`,
      failedExecutions: sql`SUM(${patchSchedules.failedRuns})`,
      overallSuccessRate: sql`ROUND(
        SUM(${patchSchedules.successfulRuns}) * 100.0 / 
        NULLIF(SUM(${patchSchedules.totalRuns}), 0), 2
      )`
    })
    .from(patchSchedules)
    .groupBy(patchSchedules.scheduleType);

    // Upcoming schedules
    const upcomingSchedules = await db.select({
      id: patchSchedules.id,
      name: patchSchedules.name,
      scheduleType: patchSchedules.scheduleType,
      nextRunTime: patchSchedules.nextRunTime,
      hoursUntilRun: sql`ROUND(
        EXTRACT(EPOCH FROM (${patchSchedules.nextRunTime} - NOW())) / 3600, 2
      )`
    })
    .from(patchSchedules)
    .where(and(
      eq(patchSchedules.status, 'active'),
      isNotNull(patchSchedules.nextRunTime),
      gte(patchSchedules.nextRunTime, new Date())
    ))
    .orderBy(patchSchedules.nextRunTime)
    .limit(10);

    return {
      statusDistribution,
      typeDistribution,
      successRates,
      upcomingSchedules,
      summary: {
        totalSchedules: statusDistribution.reduce((sum, item) => sum + parseInt(item.count), 0),
        activeSchedules: statusDistribution.find(s => s.status === 'active')?.count || 0,
        pausedSchedules: statusDistribution.find(s => s.status === 'paused')?.count || 0,
        upcomingCount: upcomingSchedules.length
      }
    };
  }

  // ==================== HELPER METHODS ====================
  
  _calculateNextRunTime(cronExpression, fromDate, timezone = 'UTC') {
    try {
      const task = cron.schedule(cronExpression, () => {}, { 
        scheduled: false,
        timezone 
      });
      
      // For simplicity, we'll calculate the next run time from the current time
      // In a real implementation, you'd want to use a proper cron parser
      const now = new Date();
      const nextRun = new Date(now.getTime() + 60000); // Add 1 minute as placeholder
      
      return nextRun;
    } catch (error) {
      console.error('Error calculating next run time:', error);
      return null;
    }
  }

  async _createJobsFromSchedule(schedule, executionId) {
    // This is a placeholder for the job creation logic
    // In a real implementation, this would:
    // 1. Evaluate schedule criteria to determine which patches to deploy
    // 2. Evaluate target criteria to determine which assets to target
    // 3. Create patch jobs for the selected patch/asset combinations
    // 4. Return the created job objects
    
    console.log('Creating jobs from schedule:', schedule.id, 'execution:', executionId);
    return []; // Placeholder
  }

  _buildScheduleFilters(filters) {
    const conditions = [];
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(patchSchedules.status, filters.status));
      } else {
        conditions.push(eq(patchSchedules.status, filters.status));
      }
    }
    if (filters.scheduleType) {
      if (Array.isArray(filters.scheduleType)) {
        conditions.push(inArray(patchSchedules.scheduleType, filters.scheduleType));
      } else {
        conditions.push(eq(patchSchedules.scheduleType, filters.scheduleType));
      }
    }
    if (filters.isTemplate !== undefined) {
      conditions.push(eq(patchSchedules.isTemplate, filters.isTemplate));
    }
    if (filters.createdBy) {
      conditions.push(eq(patchSchedules.createdBy, filters.createdBy));
    }
    if (filters.search) {
      conditions.push(or(
        like(patchSchedules.name, `%${filters.search}%`),
        like(patchSchedules.description, `%${filters.search}%`)
      ));
    }
    if (filters.nextRunFrom) {
      conditions.push(gte(patchSchedules.nextRunTime, filters.nextRunFrom));
    }
    if (filters.nextRunTo) {
      conditions.push(lte(patchSchedules.nextRunTime, filters.nextRunTo));
    }
    if (filters.createdFrom) {
      conditions.push(gte(patchSchedules.createdAt, filters.createdFrom));
    }
    if (filters.createdTo) {
      conditions.push(lte(patchSchedules.createdAt, filters.createdTo));
    }
    if (filters.autoApprove !== undefined) {
      conditions.push(eq(patchSchedules.autoApprove, filters.autoApprove));
    }
    if (filters.hasMaintenanceWindow !== undefined) {
      if (filters.hasMaintenanceWindow) {
        conditions.push(isNotNull(patchSchedules.maintenanceWindowType));
      } else {
        conditions.push(isNull(patchSchedules.maintenanceWindowType));
      }
    }
    
    return conditions;
  }
}

module.exports = new PatchScheduleService();