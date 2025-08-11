const { db } = require('../db');
const {
  patchJobs,
  patchJobTargets,
  patchJobLogs,
  patchJobDependencies,
  patches,
  assets,
  users
} = require('../db/schema');
const { eq, and, gte, lte, like, desc, asc, sql, or, inArray, isNull, isNotNull } = require('drizzle-orm');

class PatchExecutionService {
  
  // ==================== JOB MANAGEMENT ====================
  
  async createJob(data, userId) {
    const jobData = {
      ...data,
      createdBy: userId,
      updatedBy: userId
    };
    
    const [result] = await db.insert(patchJobs)
      .values(jobData)
      .returning();
    
    return result;
  }

  async getJobs(filters = {}, pagination = {}) {
    console.log('🔍 Service getJobs called with:', { filters, pagination });

    // Test if table exists by running a simple count query
    try {
      console.log('🧪 Testing patch_jobs table existence...');
      const testResult = await db.select({ count: sql`count(*)` }).from(patchJobs);
      console.log('✅ Patch jobs table exists, count:', testResult);
    } catch (testError) {
      console.error('❌ Patch jobs table test failed:', testError.message);
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
      // Main job fields
      id: patchJobs.id,
      jobName: patchJobs.jobName,
      description: patchJobs.description,
      patchId: patchJobs.patchId,
      jobType: patchJobs.jobType,
      status: patchJobs.status,
      priority: patchJobs.priority,
      executionMode: patchJobs.executionMode,
      scheduledStartTime: patchJobs.scheduledStartTime,
      actualStartTime: patchJobs.actualStartTime,
      completedTime: patchJobs.completedTime,
      estimatedDuration: patchJobs.estimatedDuration,
      actualDuration: patchJobs.actualDuration,
      totalTargets: patchJobs.totalTargets,
      completedTargets: patchJobs.completedTargets,
      successfulTargets: patchJobs.successfulTargets,
      failedTargets: patchJobs.failedTargets,
      skippedTargets: patchJobs.skippedTargets,
      progressPercentage: patchJobs.progressPercentage,
      exitCode: patchJobs.exitCode,
      errorMessage: patchJobs.errorMessage,
      parentJobId: patchJobs.parentJobId,
      batchId: patchJobs.batchId,
      requireApproval: patchJobs.requireApproval,
      approvedBy: patchJobs.approvedBy,
      approvedAt: patchJobs.approvedAt,
      createdBy: patchJobs.createdBy,
      createdAt: patchJobs.createdAt,
      updatedAt: patchJobs.updatedAt,
      
      // Patch details
      patchTitle: patches.title,
      patchSeverity: patches.severity,
      patchVendor: patches.vendor,
      
      // Creator details
      creatorUsername: users.username,
      creatorEmail: users.email,
      
      // Calculate execution time if running
      executionTimeMinutes: sql`CASE 
        WHEN ${patchJobs.status} = 'running' AND ${patchJobs.actualStartTime} IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (NOW() - ${patchJobs.actualStartTime})) / 60 
        WHEN ${patchJobs.actualDuration} IS NOT NULL 
        THEN ${patchJobs.actualDuration}
        ELSE NULL 
      END`,
      
      // Calculate estimated completion time
      estimatedCompletionTime: sql`CASE 
        WHEN ${patchJobs.status} = 'running' AND ${patchJobs.actualStartTime} IS NOT NULL AND ${patchJobs.estimatedDuration} IS NOT NULL
        THEN ${patchJobs.actualStartTime} + INTERVAL '1 minute' * ${patchJobs.estimatedDuration}
        ELSE NULL 
      END`
    })
    .from(patchJobs)
    .leftJoin(patches, eq(patchJobs.patchId, patches.id))
    .leftJoin(users, eq(patchJobs.createdBy, users.id));

    // Apply filters
    const conditions = this._buildJobFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = patchJobs[sortBy] || patchJobs.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(patchJobs)
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

  async getJobById(id) {
    const [result] = await db.select({
      // Full job data
      id: patchJobs.id,
      jobName: patchJobs.jobName,
      description: patchJobs.description,
      patchId: patchJobs.patchId,
      jobType: patchJobs.jobType,
      status: patchJobs.status,
      priority: patchJobs.priority,
      executionMode: patchJobs.executionMode,
      scheduledStartTime: patchJobs.scheduledStartTime,
      actualStartTime: patchJobs.actualStartTime,
      completedTime: patchJobs.completedTime,
      estimatedDuration: patchJobs.estimatedDuration,
      actualDuration: patchJobs.actualDuration,
      targetAssets: patchJobs.targetAssets,
      targetGroups: patchJobs.targetGroups,
      targetFilter: patchJobs.targetFilter,
      totalTargets: patchJobs.totalTargets,
      executeParallel: patchJobs.executeParallel,
      maxConcurrency: patchJobs.maxConcurrency,
      continueOnError: patchJobs.continueOnError,
      requireApproval: patchJobs.requireApproval,
      approvedBy: patchJobs.approvedBy,
      approvedAt: patchJobs.approvedAt,
      completedTargets: patchJobs.completedTargets,
      successfulTargets: patchJobs.successfulTargets,
      failedTargets: patchJobs.failedTargets,
      skippedTargets: patchJobs.skippedTargets,
      progressPercentage: patchJobs.progressPercentage,
      exitCode: patchJobs.exitCode,
      errorMessage: patchJobs.errorMessage,
      logOutput: patchJobs.logOutput,
      executionSummary: patchJobs.executionSummary,
      parentJobId: patchJobs.parentJobId,
      batchId: patchJobs.batchId,
      maintenanceWindowId: patchJobs.maintenanceWindowId,
      rollbackJobId: patchJobs.rollbackJobId,
      createdBy: patchJobs.createdBy,
      updatedBy: patchJobs.updatedBy,
      createdAt: patchJobs.createdAt,
      updatedAt: patchJobs.updatedAt
    })
    .from(patchJobs)
    .where(eq(patchJobs.id, id))
    .limit(1);
    
    return result;
  }

  async updateJob(id, data, userId) {
    const updateData = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobs)
      .set(updateData)
      .where(eq(patchJobs.id, id))
      .returning();
    
    return result;
  }

  async deleteJob(id) {
    const [result] = await db.delete(patchJobs)
      .where(eq(patchJobs.id, id))
      .returning();
    
    return result;
  }

  // ==================== JOB EXECUTION CONTROL ====================
  
  async startJob(id, userId) {
    const updateData = {
      status: 'running',
      actualStartTime: new Date(),
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobs)
      .set(updateData)
      .where(and(
        eq(patchJobs.id, id),
        eq(patchJobs.status, 'queued')
      ))
      .returning();

    if (result) {
      await this.addJobLog(id, 'INFO', 'Job started', 'scheduler');
    }

    return result;
  }

  async pauseJob(id, userId) {
    const updateData = {
      status: 'paused',
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobs)
      .set(updateData)
      .where(and(
        eq(patchJobs.id, id),
        eq(patchJobs.status, 'running')
      ))
      .returning();

    if (result) {
      await this.addJobLog(id, 'WARN', 'Job paused by user', 'scheduler');
    }

    return result;
  }

  async resumeJob(id, userId) {
    const updateData = {
      status: 'running',
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobs)
      .set(updateData)
      .where(and(
        eq(patchJobs.id, id),
        eq(patchJobs.status, 'paused')
      ))
      .returning();

    if (result) {
      await this.addJobLog(id, 'INFO', 'Job resumed by user', 'scheduler');
    }

    return result;
  }

  async cancelJob(id, userId, reason = null) {
    const updateData = {
      status: 'cancelled',
      completedTime: new Date(),
      errorMessage: reason,
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobs)
      .set(updateData)
      .where(and(
        eq(patchJobs.id, id),
        inArray(patchJobs.status, ['queued', 'running', 'paused'])
      ))
      .returning();

    if (result) {
      await this.addJobLog(id, 'ERROR', `Job cancelled: ${reason || 'No reason provided'}`, 'scheduler');
    }

    return result;
  }

  async completeJob(id, executionSummary, userId) {
    // Calculate actual duration
    const job = await this.getJobById(id);
    const actualDuration = job.actualStartTime ? 
      Math.floor((new Date() - new Date(job.actualStartTime)) / (1000 * 60)) : null;

    const updateData = {
      status: 'completed',
      completedTime: new Date(),
      actualDuration,
      progressPercentage: 100.00,
      executionSummary,
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobs)
      .set(updateData)
      .where(eq(patchJobs.id, id))
      .returning();

    if (result) {
      await this.addJobLog(id, 'INFO', 'Job completed successfully', 'scheduler', { executionSummary });
    }

    return result;
  }

  async failJob(id, errorMessage, exitCode = null, userId) {
    // Calculate actual duration
    const job = await this.getJobById(id);
    const actualDuration = job.actualStartTime ? 
      Math.floor((new Date() - new Date(job.actualStartTime)) / (1000 * 60)) : null;

    const updateData = {
      status: 'failed',
      completedTime: new Date(),
      actualDuration,
      errorMessage,
      exitCode,
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobs)
      .set(updateData)
      .where(eq(patchJobs.id, id))
      .returning();

    if (result) {
      await this.addJobLog(id, 'ERROR', `Job failed: ${errorMessage}`, 'scheduler', { exitCode });
    }

    return result;
  }

  // ==================== JOB TARGETS MANAGEMENT ====================
  
  async createJobTargets(jobId, assetUuids) {
    const targets = assetUuids.map(assetUuid => ({
      jobId,
      assetUuid,
      status: 'queued'
    }));

    const results = await db.insert(patchJobTargets)
      .values(targets)
      .returning();

    // Update job total targets count
    await db.update(patchJobs)
      .set({ 
        totalTargets: results.length,
        updatedAt: new Date()
      })
      .where(eq(patchJobs.id, jobId));

    return results;
  }

  async getJobTargets(jobId, filters = {}) {
    let query = db.select({
      id: patchJobTargets.id,
      jobId: patchJobTargets.jobId,
      assetUuid: patchJobTargets.assetUuid,
      status: patchJobTargets.status,
      startTime: patchJobTargets.startTime,
      endTime: patchJobTargets.endTime,
      duration: patchJobTargets.duration,
      exitCode: patchJobTargets.exitCode,
      stdout: patchJobTargets.stdout,
      stderr: patchJobTargets.stderr,
      errorMessage: patchJobTargets.errorMessage,
      preChecksPassed: patchJobTargets.preChecksPassed,
      postValidationPassed: patchJobTargets.postValidationPassed,
      retryCount: patchJobTargets.retryCount,
      maxRetries: patchJobTargets.maxRetries,
      executorId: patchJobTargets.executorId,
      createdAt: patchJobTargets.createdAt,
      updatedAt: patchJobTargets.updatedAt,
      // Asset details
      hostname: assets.hostname,
      ipv4: assets.ipv4,
      operatingSystem: assets.operatingSystem,
      osVersion: assets.osVersion
    })
    .from(patchJobTargets)
    .leftJoin(assets, eq(patchJobTargets.assetUuid, assets.assetUuid))
    .where(eq(patchJobTargets.jobId, jobId));

    // Apply filters
    if (filters.status) {
      query = query.where(eq(patchJobTargets.status, filters.status));
    }

    const results = await query.orderBy(patchJobTargets.createdAt);
    return results;
  }

  async updateJobTarget(targetId, data) {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchJobTargets)
      .set(updateData)
      .where(eq(patchJobTargets.id, targetId))
      .returning();

    // Update job progress if target completed
    if (data.status && ['completed', 'failed', 'skipped'].includes(data.status)) {
      await this.updateJobProgress(result.jobId);
    }

    return result;
  }

  async updateJobProgress(jobId) {
    // Get current target counts
    const targetStats = await db.select({
      totalTargets: sql`COUNT(*)`,
      completedTargets: sql`COUNT(CASE WHEN status IN ('completed', 'failed', 'skipped') THEN 1 END)`,
      successfulTargets: sql`COUNT(CASE WHEN status = 'completed' THEN 1 END)`,
      failedTargets: sql`COUNT(CASE WHEN status = 'failed' THEN 1 END)`,
      skippedTargets: sql`COUNT(CASE WHEN status = 'skipped' THEN 1 END)`
    })
    .from(patchJobTargets)
    .where(eq(patchJobTargets.jobId, jobId));

    const stats = targetStats[0];
    const progressPercentage = stats.totalTargets > 0 ? 
      (stats.completedTargets * 100 / stats.totalTargets) : 0;

    // Update job progress
    await db.update(patchJobs)
      .set({
        totalTargets: stats.totalTargets,
        completedTargets: stats.completedTargets,
        successfulTargets: stats.successfulTargets,
        failedTargets: stats.failedTargets,
        skippedTargets: stats.skippedTargets,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        updatedAt: new Date()
      })
      .where(eq(patchJobs.id, jobId));

    return stats;
  }

  // ==================== JOB LOGGING ====================
  
  async addJobLog(jobId, logLevel, message, component = 'system', metadata = null) {
    const logData = {
      jobId,
      logLevel,
      message,
      component,
      metadata: metadata ? JSON.stringify(metadata) : null
    };

    const [result] = await db.insert(patchJobLogs)
      .values(logData)
      .returning();

    return result;
  }

  async getJobLogs(jobId, filters = {}) {
    const { logLevel, component, limit = 1000 } = filters;

    let query = db.select()
      .from(patchJobLogs)
      .where(eq(patchJobLogs.jobId, jobId));

    if (logLevel) {
      query = query.where(eq(patchJobLogs.logLevel, logLevel));
    }
    if (component) {
      query = query.where(eq(patchJobLogs.component, component));
    }

    const results = await query
      .orderBy(desc(patchJobLogs.timestamp))
      .limit(limit);

    return results;
  }

  // ==================== JOB DEPENDENCIES ====================
  
  async createJobDependency(jobId, dependsOnJobId, dependencyType, isOptional = false, failureAction = 'block') {
    const dependencyData = {
      jobId,
      dependsOnJobId,
      dependencyType,
      isOptional,
      failureAction
    };

    const [result] = await db.insert(patchJobDependencies)
      .values(dependencyData)
      .returning();

    return result;
  }

  async getJobDependencies(jobId) {
    const results = await db.select({
      id: patchJobDependencies.id,
      jobId: patchJobDependencies.jobId,
      dependsOnJobId: patchJobDependencies.dependsOnJobId,
      dependencyType: patchJobDependencies.dependencyType,
      isOptional: patchJobDependencies.isOptional,
      failureAction: patchJobDependencies.failureAction,
      // Dependency job details
      dependencyJobName: sql`dj.job_name`,
      dependencyJobStatus: sql`dj.status`,
      dependencyJobCompletedTime: sql`dj.completed_time`
    })
    .from(patchJobDependencies)
    .leftJoin(patchJobs, eq(patchJobDependencies.dependsOnJobId, patchJobs.id))
    .where(eq(patchJobDependencies.jobId, jobId));

    return results;
  }

  async canJobStart(jobId) {
    const dependencies = await this.getJobDependencies(jobId);
    
    for (const dep of dependencies) {
      if (!dep.isOptional && dep.dependencyJobStatus !== 'completed') {
        return {
          canStart: false,
          reason: `Waiting for dependency job "${dep.dependencyJobName}" to complete`
        };
      }
    }

    return { canStart: true };
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getJobAnalytics(filters = {}) {
    // Job status distribution
    const statusDistribution = await db.select({
      status: patchJobs.status,
      count: sql`COUNT(*)`,
      percentage: sql`ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2)`
    })
    .from(patchJobs)
    .groupBy(patchJobs.status);

    // Job type distribution
    const typeDistribution = await db.select({
      jobType: patchJobs.jobType,
      count: sql`COUNT(*)`,
      avgDuration: sql`ROUND(AVG(${patchJobs.actualDuration}), 2)`
    })
    .from(patchJobs)
    .where(isNotNull(patchJobs.actualDuration))
    .groupBy(patchJobs.jobType);

    // Success rates by priority
    const successRates = await db.select({
      priority: patchJobs.priority,
      totalJobs: sql`COUNT(*)`,
      successfulJobs: sql`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
      failedJobs: sql`SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)`,
      successRate: sql`ROUND(
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
      )`
    })
    .from(patchJobs)
    .groupBy(patchJobs.priority);

    // Execution time trends
    const executionTrends = await db.select({
      date: sql`DATE(${patchJobs.createdAt})`,
      totalJobs: sql`COUNT(*)`,
      avgDuration: sql`ROUND(AVG(${patchJobs.actualDuration}), 2)`,
      maxDuration: sql`MAX(${patchJobs.actualDuration})`,
      minDuration: sql`MIN(${patchJobs.actualDuration})`
    })
    .from(patchJobs)
    .where(isNotNull(patchJobs.actualDuration))
    .groupBy(sql`DATE(${patchJobs.createdAt})`)
    .orderBy(sql`DATE(${patchJobs.createdAt})`)
    .limit(30);

    return {
      statusDistribution,
      typeDistribution,
      successRates,
      executionTrends,
      summary: {
        totalJobs: statusDistribution.reduce((sum, item) => sum + parseInt(item.count), 0),
        runningJobs: statusDistribution.find(s => s.status === 'running')?.count || 0,
        completedJobs: statusDistribution.find(s => s.status === 'completed')?.count || 0,
        failedJobs: statusDistribution.find(s => s.status === 'failed')?.count || 0
      }
    };
  }

  // ==================== HELPER METHODS ====================
  
  _buildJobFilters(filters) {
    const conditions = [];
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(patchJobs.status, filters.status));
      } else {
        conditions.push(eq(patchJobs.status, filters.status));
      }
    }
    if (filters.jobType) {
      if (Array.isArray(filters.jobType)) {
        conditions.push(inArray(patchJobs.jobType, filters.jobType));
      } else {
        conditions.push(eq(patchJobs.jobType, filters.jobType));
      }
    }
    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        conditions.push(inArray(patchJobs.priority, filters.priority));
      } else {
        conditions.push(eq(patchJobs.priority, filters.priority));
      }
    }
    if (filters.executionMode) {
      conditions.push(eq(patchJobs.executionMode, filters.executionMode));
    }
    if (filters.patchId) {
      conditions.push(eq(patchJobs.patchId, filters.patchId));
    }
    if (filters.createdBy) {
      conditions.push(eq(patchJobs.createdBy, filters.createdBy));
    }
    if (filters.batchId) {
      conditions.push(eq(patchJobs.batchId, filters.batchId));
    }
    if (filters.search) {
      conditions.push(or(
        like(patchJobs.jobName, `%${filters.search}%`),
        like(patchJobs.description, `%${filters.search}%`)
      ));
    }
    if (filters.scheduledFrom) {
      conditions.push(gte(patchJobs.scheduledStartTime, filters.scheduledFrom));
    }
    if (filters.scheduledTo) {
      conditions.push(lte(patchJobs.scheduledStartTime, filters.scheduledTo));
    }
    if (filters.createdFrom) {
      conditions.push(gte(patchJobs.createdAt, filters.createdFrom));
    }
    if (filters.createdTo) {
      conditions.push(lte(patchJobs.createdAt, filters.createdTo));
    }
    if (filters.requireApproval !== undefined) {
      conditions.push(eq(patchJobs.requireApproval, filters.requireApproval));
    }
    if (filters.approved !== undefined) {
      if (filters.approved) {
        conditions.push(isNotNull(patchJobs.approvedBy));
      } else {
        conditions.push(isNull(patchJobs.approvedBy));
      }
    }
    
    return conditions;
  }
}

module.exports = new PatchExecutionService();