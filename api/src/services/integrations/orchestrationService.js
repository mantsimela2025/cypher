const cron = require('node-cron');
const tenableService = require('./tenableService');
const xactaService = require('./xactaService');
const { db } = require('../../db');
const { syncJobs, syncLogs } = require('../../db/schema');
const { eq, desc } = require('drizzle-orm');

/**
 * External Data Integration Orchestration Service
 * Manages scheduled synchronization, conflict resolution, and data enrichment
 */
class OrchestrationService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isInitialized = false;
    this.syncInProgress = new Set();
  }

  /**
   * Initialize orchestration service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize external services
      await tenableService.initialize();
      await xactaService.initialize();

      // Load and schedule sync jobs from database
      await this.loadScheduledJobs();

      this.isInitialized = true;
      console.log('✅ Orchestration service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize orchestration service:', error);
      throw error;
    }
  }

  /**
   * Load scheduled jobs from database
   */
  async loadScheduledJobs() {
    try {
      const jobs = await db.select().from(syncJobs).where(eq(syncJobs.enabled, true));
      
      for (const job of jobs) {
        await this.scheduleJob(job);
      }

      console.log(`📅 Loaded ${jobs.length} scheduled sync jobs`);
    } catch (error) {
      console.error('Failed to load scheduled jobs:', error);
    }
  }

  /**
   * Schedule a sync job
   */
  async scheduleJob(jobConfig) {
    const { id, name, service, schedule, config } = jobConfig;

    // Validate cron expression
    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron expression: ${schedule}`);
    }

    // Cancel existing job if it exists
    if (this.scheduledJobs.has(id)) {
      this.scheduledJobs.get(id).destroy();
    }

    // Create new scheduled job
    const task = cron.schedule(schedule, async () => {
      await this.executeSyncJob(jobConfig);
    }, {
      scheduled: true,
      timezone: config.timezone || 'UTC'
    });

    this.scheduledJobs.set(id, task);
    console.log(`📅 Scheduled job: ${name} (${schedule})`);
  }

  /**
   * Execute a sync job
   */
  async executeSyncJob(jobConfig) {
    const { id, name, service, config } = jobConfig;
    const jobKey = `${service}-${id}`;

    // Prevent concurrent execution of the same job
    if (this.syncInProgress.has(jobKey)) {
      console.log(`⏭️ Skipping ${name} - already in progress`);
      return;
    }

    this.syncInProgress.add(jobKey);
    const startTime = new Date();

    try {
      console.log(`🔄 Starting sync job: ${name}`);

      // Log job start
      const [logEntry] = await db.insert(syncLogs).values({
        jobId: id,
        service,
        status: 'running',
        startedAt: startTime,
        config: JSON.stringify(config)
      }).returning({ id: syncLogs.id });

      let result;
      switch (service) {
        case 'tenable':
          result = await this.executeTenableSync(config);
          break;
        case 'xacta':
          result = await this.executeXactaSync(config);
          break;
        case 'correlation':
          result = await this.executeCorrelationSync(config);
          break;
        default:
          throw new Error(`Unknown service: ${service}`);
      }

      // Log successful completion
      await db.update(syncLogs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          recordsProcessed: result.total,
          recordsCreated: result.created,
          recordsUpdated: result.updated,
          errors: JSON.stringify(result.errors || []),
          result: JSON.stringify(result)
        })
        .where(eq(syncLogs.id, logEntry.id));

      console.log(`✅ Completed sync job: ${name} (${result.total} records processed)`);

    } catch (error) {
      console.error(`❌ Sync job failed: ${name}`, error);

      // Log failure
      await db.update(syncLogs)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errors: JSON.stringify([{ error: error.message, stack: error.stack }])
        })
        .where(eq(syncLogs.id, logEntry.id));

      // Implement exponential backoff for retries
      await this.handleSyncFailure(jobConfig, error);

    } finally {
      this.syncInProgress.delete(jobKey);
    }
  }

  /**
   * Execute Tenable synchronization
   */
  async executeTenableSync(config) {
    const filters = config.filters || {};
    
    // Add delta sync support - only sync data changed since last sync
    if (config.deltaSync) {
      const lastSync = await this.getLastSuccessfulSync('tenable');
      if (lastSync) {
        filters.last_seen = lastSync.completedAt.toISOString();
      }
    }

    return await tenableService.syncVulnerabilities(filters);
  }

  /**
   * Execute Xacta synchronization
   */
  async executeXactaSync(config) {
    const filters = config.filters || {};
    return await xactaService.syncControls(filters);
  }

  /**
   * Execute correlation between Tenable and Xacta data
   */
  async executeCorrelationSync(config) {
    console.log('🔗 Starting Tenable-Xacta correlation...');
    
    // This would implement AI-powered correlation between vulnerabilities and controls
    // For now, return mock correlation results
    return {
      total: 0,
      created: 0,
      updated: 0,
      correlations: []
    };
  }

  /**
   * Handle sync failure with exponential backoff
   */
  async handleSyncFailure(jobConfig, error) {
    const { id, retryCount = 0, maxRetries = 3 } = jobConfig;

    if (retryCount < maxRetries) {
      const backoffDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      
      console.log(`🔄 Retrying sync job ${id} in ${backoffDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      setTimeout(async () => {
        await this.executeSyncJob({
          ...jobConfig,
          retryCount: retryCount + 1
        });
      }, backoffDelay);
    } else {
      console.error(`❌ Sync job ${id} failed after ${maxRetries} retries`);
      // Could send alert notification here
    }
  }

  /**
   * Get last successful sync for a service
   */
  async getLastSuccessfulSync(service) {
    const [lastSync] = await db.select()
      .from(syncLogs)
      .where(eq(syncLogs.service, service))
      .where(eq(syncLogs.status, 'completed'))
      .orderBy(desc(syncLogs.completedAt))
      .limit(1);

    return lastSync;
  }

  /**
   * Create a new sync job
   */
  async createSyncJob(jobData) {
    const [job] = await db.insert(syncJobs).values({
      ...jobData,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    if (job.enabled) {
      await this.scheduleJob(job);
    }

    return job;
  }

  /**
   * Update sync job
   */
  async updateSyncJob(jobId, updateData) {
    const [job] = await db.update(syncJobs)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(syncJobs.id, jobId))
      .returning();

    // Reschedule if job is enabled
    if (job.enabled) {
      await this.scheduleJob(job);
    } else {
      // Cancel job if disabled
      if (this.scheduledJobs.has(jobId)) {
        this.scheduledJobs.get(jobId).destroy();
        this.scheduledJobs.delete(jobId);
      }
    }

    return job;
  }

  /**
   * Trigger manual sync
   */
  async triggerManualSync(service, config = {}) {
    const jobConfig = {
      id: `manual-${Date.now()}`,
      name: `Manual ${service} sync`,
      service,
      config,
      schedule: null // No schedule for manual jobs
    };

    return await this.executeSyncJob(jobConfig);
  }

  /**
   * Get sync status for all services
   */
  async getSyncStatus() {
    const tenableStatus = await tenableService.getSyncStatus();
    const xactaStatus = await xactaService.getSyncStatus();
    
    const recentLogs = await db.select()
      .from(syncLogs)
      .orderBy(desc(syncLogs.startedAt))
      .limit(10);

    return {
      services: {
        tenable: tenableStatus,
        xacta: xactaStatus
      },
      scheduledJobs: this.scheduledJobs.size,
      activeJobs: this.syncInProgress.size,
      recentLogs,
      health: this.getOverallHealth([tenableStatus, xactaStatus])
    };
  }

  /**
   * Get overall health status
   */
  getOverallHealth(serviceStatuses) {
    const allHealthy = serviceStatuses.every(status => status.health === 'healthy');
    const anyUnhealthy = serviceStatuses.some(status => status.health === 'unhealthy');
    
    if (allHealthy) return 'healthy';
    if (anyUnhealthy) return 'unhealthy';
    return 'degraded';
  }

  /**
   * Shutdown orchestration service
   */
  async shutdown() {
    console.log('🛑 Shutting down orchestration service...');
    
    // Cancel all scheduled jobs
    for (const [jobId, task] of this.scheduledJobs) {
      task.destroy();
    }
    
    this.scheduledJobs.clear();
    this.isInitialized = false;
    
    console.log('✅ Orchestration service shutdown complete');
  }
}

// Create and export singleton instance
const orchestrationService = new OrchestrationService();

module.exports = orchestrationService;
