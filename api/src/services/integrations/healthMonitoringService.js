const { db } = require('../../db');
const { 
  syncLogs, 
  syncJobs, 
  webhookLogs, 
  dataConflicts,
  vulnerabilityRiskScores,
  assets,
  vulnerabilities
} = require('../../db/schema');
const { eq, and, sql, desc, gte, lte, count } = require('drizzle-orm');

/**
 * Integration Health Monitoring Service
 * Provides comprehensive monitoring dashboard showing sync status, data quality metrics, and integration health indicators
 */
class HealthMonitoringService {
  constructor() {
    this.isInitialized = false;
    this.healthMetrics = new Map();
    this.alertThresholds = new Map();
    this.monitoringInterval = null;
  }

  /**
   * Initialize health monitoring service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Setup alert thresholds
      this.setupAlertThresholds();
      
      // Start continuous monitoring
      this.startContinuousMonitoring();
      
      this.isInitialized = true;
      console.log('✅ Integration health monitoring service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize health monitoring service:', error);
      throw error;
    }
  }

  /**
   * Setup default alert thresholds
   */
  setupAlertThresholds() {
    this.alertThresholds.set('sync_failure_rate', { warning: 10, critical: 25 }); // Percentage
    this.alertThresholds.set('webhook_failure_rate', { warning: 5, critical: 15 }); // Percentage
    this.alertThresholds.set('data_quality_score', { warning: 80, critical: 60 }); // Score out of 100
    this.alertThresholds.set('conflict_rate', { warning: 5, critical: 10 }); // Percentage
    this.alertThresholds.set('sync_latency', { warning: 300, critical: 600 }); // Seconds
    this.alertThresholds.set('enrichment_coverage', { warning: 80, critical: 60 }); // Percentage

    console.log(`⚠️ Setup ${this.alertThresholds.size} alert thresholds`);
  }

  /**
   * Start continuous monitoring
   */
  startContinuousMonitoring() {
    // Update health metrics every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.updateHealthMetrics();
    }, 5 * 60 * 1000);

    console.log('📊 Started continuous health monitoring');
  }

  /**
   * Get comprehensive integration health dashboard
   */
  async getHealthDashboard() {
    try {
      const dashboard = {
        overview: await this.getHealthOverview(),
        syncHealth: await this.getSyncHealth(),
        webhookHealth: await this.getWebhookHealth(),
        dataQuality: await this.getDataQualityMetrics(),
        conflictMetrics: await this.getConflictMetrics(),
        enrichmentMetrics: await this.getEnrichmentMetrics(),
        systemHealth: await this.getSystemHealth(),
        alerts: await this.getActiveAlerts(),
        trends: await this.getHealthTrends(),
        lastUpdated: new Date()
      };

      return dashboard;
    } catch (error) {
      console.error('Error generating health dashboard:', error);
      throw error;
    }
  }

  /**
   * Get health overview
   */
  async getHealthOverview() {
    try {
      const [syncStats] = await db.select({
        totalSyncs: sql`COUNT(*)`,
        successfulSyncs: sql`COUNT(*) FILTER (WHERE status = 'completed')`,
        failedSyncs: sql`COUNT(*) FILTER (WHERE status = 'failed')`,
        runningSyncs: sql`COUNT(*) FILTER (WHERE status = 'running')`
      }).from(syncLogs)
      .where(gte(syncLogs.startedAt, sql`NOW() - INTERVAL '24 hours'`));

      const [webhookStats] = await db.select({
        totalWebhooks: sql`COUNT(*)`,
        successfulWebhooks: sql`COUNT(*) FILTER (WHERE status = 'completed')`,
        failedWebhooks: sql`COUNT(*) FILTER (WHERE status = 'failed')`
      }).from(webhookLogs)
      .where(gte(webhookLogs.receivedAt, sql`NOW() - INTERVAL '24 hours'`));

      const [conflictStats] = await db.select({
        totalConflicts: sql`COUNT(*)`,
        resolvedConflicts: sql`COUNT(*) FILTER (WHERE status = 'resolved')`,
        pendingConflicts: sql`COUNT(*) FILTER (WHERE status = 'pending')`
      }).from(dataConflicts)
      .where(gte(dataConflicts.detectedAt, sql`NOW() - INTERVAL '24 hours'`));

      const syncSuccessRate = syncStats.totalSyncs > 0 
        ? (syncStats.successfulSyncs / syncStats.totalSyncs) * 100 
        : 100;

      const webhookSuccessRate = webhookStats.totalWebhooks > 0 
        ? (webhookStats.successfulWebhooks / webhookStats.totalWebhooks) * 100 
        : 100;

      const conflictResolutionRate = conflictStats.totalConflicts > 0 
        ? (conflictStats.resolvedConflicts / conflictStats.totalConflicts) * 100 
        : 100;

      return {
        overallHealth: this.calculateOverallHealth(syncSuccessRate, webhookSuccessRate, conflictResolutionRate),
        syncSuccessRate: Math.round(syncSuccessRate * 100) / 100,
        webhookSuccessRate: Math.round(webhookSuccessRate * 100) / 100,
        conflictResolutionRate: Math.round(conflictResolutionRate * 100) / 100,
        activeSyncs: syncStats.runningSyncs,
        pendingConflicts: conflictStats.pendingConflicts,
        last24Hours: {
          syncs: syncStats.totalSyncs,
          webhooks: webhookStats.totalWebhooks,
          conflicts: conflictStats.totalConflicts
        }
      };
    } catch (error) {
      console.error('Error getting health overview:', error);
      throw error;
    }
  }

  /**
   * Calculate overall health score
   */
  calculateOverallHealth(syncRate, webhookRate, conflictRate) {
    const weights = { sync: 0.4, webhook: 0.3, conflict: 0.3 };
    const score = (syncRate * weights.sync) + (webhookRate * weights.webhook) + (conflictRate * weights.conflict);
    
    if (score >= 95) return { status: 'excellent', score: Math.round(score) };
    if (score >= 85) return { status: 'good', score: Math.round(score) };
    if (score >= 70) return { status: 'fair', score: Math.round(score) };
    if (score >= 50) return { status: 'poor', score: Math.round(score) };
    return { status: 'critical', score: Math.round(score) };
  }

  /**
   * Get sync health metrics
   */
  async getSyncHealth() {
    try {
      const [stats] = await db.select({
        totalJobs: sql`COUNT(DISTINCT ${syncJobs.id})`,
        activeJobs: sql`COUNT(DISTINCT ${syncJobs.id}) FILTER (WHERE ${syncJobs.enabled} = true)`,
        avgDuration: sql`AVG(${syncLogs.duration})`,
        maxDuration: sql`MAX(${syncLogs.duration})`,
        recentFailures: sql`COUNT(*) FILTER (WHERE ${syncLogs.status} = 'failed' AND ${syncLogs.startedAt} >= NOW() - INTERVAL '1 hour')`
      })
      .from(syncJobs)
      .leftJoin(syncLogs, eq(syncJobs.id, syncLogs.jobId))
      .where(gte(syncLogs.startedAt, sql`NOW() - INTERVAL '24 hours'`));

      const serviceHealth = await db.select({
        service: syncLogs.service,
        successCount: sql`COUNT(*) FILTER (WHERE status = 'completed')`,
        failureCount: sql`COUNT(*) FILTER (WHERE status = 'failed')`,
        avgDuration: sql`AVG(duration)`,
        lastSync: sql`MAX(completed_at)`
      })
      .from(syncLogs)
      .where(gte(syncLogs.startedAt, sql`NOW() - INTERVAL '24 hours'`))
      .groupBy(syncLogs.service);

      return {
        overview: stats,
        byService: serviceHealth.map(service => ({
          ...service,
          successRate: service.successCount > 0 
            ? Math.round((service.successCount / (service.successCount + service.failureCount)) * 100)
            : 0,
          avgDurationMinutes: service.avgDuration ? Math.round(service.avgDuration / 60000) : 0
        }))
      };
    } catch (error) {
      console.error('Error getting sync health:', error);
      throw error;
    }
  }

  /**
   * Get webhook health metrics
   */
  async getWebhookHealth() {
    try {
      const [stats] = await db.select({
        totalWebhooks: sql`COUNT(*)`,
        successfulWebhooks: sql`COUNT(*) FILTER (WHERE status = 'completed')`,
        failedWebhooks: sql`COUNT(*) FILTER (WHERE status = 'failed')`,
        avgProcessingTime: sql`AVG(duration)`,
        maxProcessingTime: sql`MAX(duration)`
      })
      .from(webhookLogs)
      .where(gte(webhookLogs.receivedAt, sql`NOW() - INTERVAL '24 hours'`));

      const serviceHealth = await db.select({
        service: webhookLogs.service,
        eventType: webhookLogs.eventType,
        successCount: sql`COUNT(*) FILTER (WHERE status = 'completed')`,
        failureCount: sql`COUNT(*) FILTER (WHERE status = 'failed')`,
        avgDuration: sql`AVG(duration)`
      })
      .from(webhookLogs)
      .where(gte(webhookLogs.receivedAt, sql`NOW() - INTERVAL '24 hours'`))
      .groupBy(webhookLogs.service, webhookLogs.eventType);

      return {
        overview: {
          ...stats,
          successRate: stats.totalWebhooks > 0 
            ? Math.round((stats.successfulWebhooks / stats.totalWebhooks) * 100)
            : 100,
          avgProcessingTimeMs: stats.avgProcessingTime || 0
        },
        byServiceAndEvent: serviceHealth.map(item => ({
          ...item,
          successRate: item.successCount > 0 
            ? Math.round((item.successCount / (item.successCount + item.failureCount)) * 100)
            : 0
        }))
      };
    } catch (error) {
      console.error('Error getting webhook health:', error);
      throw error;
    }
  }

  /**
   * Get data quality metrics
   */
  async getDataQualityMetrics() {
    try {
      const [assetQuality] = await db.select({
        totalAssets: sql`COUNT(*)`,
        assetsWithHostname: sql`COUNT(*) FILTER (WHERE hostname IS NOT NULL AND hostname != '')`,
        assetsWithIP: sql`COUNT(*) FILTER (WHERE ip_address IS NOT NULL AND ip_address != '')`,
        assetsWithOS: sql`COUNT(*) FILTER (WHERE operating_system IS NOT NULL AND operating_system != '')`,
        duplicateAssets: sql`COUNT(*) - COUNT(DISTINCT COALESCE(hostname, ip_address))`
      }).from(assets);

      const [vulnQuality] = await db.select({
        totalVulns: sql`COUNT(*)`,
        vulnsWithCVSS: sql`COUNT(*) FILTER (WHERE cvss_score IS NOT NULL)`,
        vulnsWithSolution: sql`COUNT(*) FILTER (WHERE solution IS NOT NULL AND solution != '')`,
        enrichedVulns: sql`COUNT(DISTINCT ${vulnerabilityRiskScores.vulnerabilityId})`
      })
      .from(vulnerabilities)
      .leftJoin(vulnerabilityRiskScores, eq(vulnerabilities.id, vulnerabilityRiskScores.vulnerabilityId));

      const assetCompletenessScore = assetQuality.totalAssets > 0 
        ? ((assetQuality.assetsWithHostname + assetQuality.assetsWithIP + assetQuality.assetsWithOS) / (assetQuality.totalAssets * 3)) * 100
        : 100;

      const vulnCompletenessScore = vulnQuality.totalVulns > 0 
        ? ((vulnQuality.vulnsWithCVSS + vulnQuality.vulnsWithSolution) / (vulnQuality.totalVulns * 2)) * 100
        : 100;

      const enrichmentCoverage = vulnQuality.totalVulns > 0 
        ? (vulnQuality.enrichedVulns / vulnQuality.totalVulns) * 100
        : 0;

      return {
        overallScore: Math.round((assetCompletenessScore + vulnCompletenessScore + enrichmentCoverage) / 3),
        assets: {
          total: assetQuality.totalAssets,
          completenessScore: Math.round(assetCompletenessScore),
          withHostname: assetQuality.assetsWithHostname,
          withIP: assetQuality.assetsWithIP,
          withOS: assetQuality.assetsWithOS,
          duplicates: assetQuality.duplicateAssets
        },
        vulnerabilities: {
          total: vulnQuality.totalVulns,
          completenessScore: Math.round(vulnCompletenessScore),
          withCVSS: vulnQuality.vulnsWithCVSS,
          withSolution: vulnQuality.vulnsWithSolution,
          enriched: vulnQuality.enrichedVulns,
          enrichmentCoverage: Math.round(enrichmentCoverage)
        }
      };
    } catch (error) {
      console.error('Error getting data quality metrics:', error);
      throw error;
    }
  }

  /**
   * Get conflict metrics
   */
  async getConflictMetrics() {
    try {
      const [stats] = await db.select({
        totalConflicts: sql`COUNT(*)`,
        resolvedConflicts: sql`COUNT(*) FILTER (WHERE status = 'resolved')`,
        pendingConflicts: sql`COUNT(*) FILTER (WHERE status = 'pending')`,
        highSeverityConflicts: sql`COUNT(*) FILTER (WHERE severity = 'high')`,
        autoResolvedConflicts: sql`COUNT(*) FILTER (WHERE status = 'resolved' AND resolved_by = 'system')`
      })
      .from(dataConflicts)
      .where(gte(dataConflicts.detectedAt, sql`NOW() - INTERVAL '24 hours'`));

      const conflictsByType = await db.select({
        conflictType: dataConflicts.conflictType,
        count: sql`COUNT(*)`,
        resolvedCount: sql`COUNT(*) FILTER (WHERE status = 'resolved')`
      })
      .from(dataConflicts)
      .where(gte(dataConflicts.detectedAt, sql`NOW() - INTERVAL '7 days'`))
      .groupBy(dataConflicts.conflictType)
      .orderBy(desc(sql`COUNT(*)`));

      const resolutionRate = stats.totalConflicts > 0 
        ? (stats.resolvedConflicts / stats.totalConflicts) * 100 
        : 100;

      const autoResolutionRate = stats.resolvedConflicts > 0 
        ? (stats.autoResolvedConflicts / stats.resolvedConflicts) * 100 
        : 0;

      return {
        overview: {
          ...stats,
          resolutionRate: Math.round(resolutionRate),
          autoResolutionRate: Math.round(autoResolutionRate)
        },
        byType: conflictsByType.map(item => ({
          ...item,
          resolutionRate: item.count > 0 ? Math.round((item.resolvedCount / item.count) * 100) : 0
        }))
      };
    } catch (error) {
      console.error('Error getting conflict metrics:', error);
      throw error;
    }
  }

  /**
   * Get enrichment metrics
   */
  async getEnrichmentMetrics() {
    try {
      const [stats] = await db.select({
        totalVulnerabilities: sql`COUNT(DISTINCT ${vulnerabilities.id})`,
        enrichedVulnerabilities: sql`COUNT(DISTINCT ${vulnerabilityRiskScores.vulnerabilityId})`,
        avgRiskScore: sql`AVG(${vulnerabilityRiskScores.riskScore})`,
        highRiskCount: sql`COUNT(*) FILTER (WHERE ${vulnerabilityRiskScores.riskScore} >= 7)`,
        avgConfidence: sql`AVG(${vulnerabilityRiskScores.confidence})`
      })
      .from(vulnerabilities)
      .leftJoin(vulnerabilityRiskScores, eq(vulnerabilities.id, vulnerabilityRiskScores.vulnerabilityId));

      const enrichmentCoverage = stats.totalVulnerabilities > 0 
        ? (stats.enrichedVulnerabilities / stats.totalVulnerabilities) * 100 
        : 0;

      return {
        coverage: Math.round(enrichmentCoverage),
        totalVulnerabilities: stats.totalVulnerabilities,
        enrichedVulnerabilities: stats.enrichedVulnerabilities,
        averageRiskScore: stats.avgRiskScore ? Math.round(stats.avgRiskScore * 100) / 100 : 0,
        highRiskCount: stats.highRiskCount,
        averageConfidence: stats.avgConfidence ? Math.round(stats.avgConfidence * 100) / 100 : 0
      };
    } catch (error) {
      console.error('Error getting enrichment metrics:', error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    try {
      // Database connection health
      const dbHealth = await this.checkDatabaseHealth();
      
      // External service connectivity
      const serviceHealth = await this.checkExternalServiceHealth();
      
      // Memory and performance metrics (mock implementation)
      const performanceMetrics = this.getPerformanceMetrics();

      return {
        database: dbHealth,
        externalServices: serviceHealth,
        performance: performanceMetrics,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      throw error;
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await db.select({ test: sql`1` }).limit(1);
      const responseTime = Date.now() - start;

      return {
        status: 'healthy',
        responseTime,
        connected: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  /**
   * Check external service health
   */
  async checkExternalServiceHealth() {
    // Mock implementation - in reality, this would ping external APIs
    return {
      tenable: { status: 'healthy', responseTime: 150, lastCheck: new Date() },
      xacta: { status: 'healthy', responseTime: 200, lastCheck: new Date() }
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      uptime: Math.round(process.uptime()),
      cpuUsage: process.cpuUsage()
    };
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    const alerts = [];
    
    // Check sync failure rate
    const syncFailureRate = await this.calculateSyncFailureRate();
    if (syncFailureRate > this.alertThresholds.get('sync_failure_rate').warning) {
      alerts.push({
        type: 'sync_failure_rate',
        severity: syncFailureRate > this.alertThresholds.get('sync_failure_rate').critical ? 'critical' : 'warning',
        message: `Sync failure rate is ${syncFailureRate}%`,
        value: syncFailureRate,
        threshold: this.alertThresholds.get('sync_failure_rate')
      });
    }

    // Check webhook failure rate
    const webhookFailureRate = await this.calculateWebhookFailureRate();
    if (webhookFailureRate > this.alertThresholds.get('webhook_failure_rate').warning) {
      alerts.push({
        type: 'webhook_failure_rate',
        severity: webhookFailureRate > this.alertThresholds.get('webhook_failure_rate').critical ? 'critical' : 'warning',
        message: `Webhook failure rate is ${webhookFailureRate}%`,
        value: webhookFailureRate,
        threshold: this.alertThresholds.get('webhook_failure_rate')
      });
    }

    return alerts;
  }

  /**
   * Calculate sync failure rate
   */
  async calculateSyncFailureRate() {
    try {
      const [stats] = await db.select({
        total: sql`COUNT(*)`,
        failed: sql`COUNT(*) FILTER (WHERE status = 'failed')`
      })
      .from(syncLogs)
      .where(gte(syncLogs.startedAt, sql`NOW() - INTERVAL '1 hour'`));

      return stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
    } catch (error) {
      console.error('Error calculating sync failure rate:', error);
      return 0;
    }
  }

  /**
   * Calculate webhook failure rate
   */
  async calculateWebhookFailureRate() {
    try {
      const [stats] = await db.select({
        total: sql`COUNT(*)`,
        failed: sql`COUNT(*) FILTER (WHERE status = 'failed')`
      })
      .from(webhookLogs)
      .where(gte(webhookLogs.receivedAt, sql`NOW() - INTERVAL '1 hour'`));

      return stats.total > 0 ? (stats.failed / stats.total) * 100 : 0;
    } catch (error) {
      console.error('Error calculating webhook failure rate:', error);
      return 0;
    }
  }

  /**
   * Get health trends
   */
  async getHealthTrends() {
    try {
      // Get hourly sync success rates for the last 24 hours
      const syncTrends = await db.select({
        hour: sql`date_trunc('hour', ${syncLogs.startedAt})`,
        total: sql`COUNT(*)`,
        successful: sql`COUNT(*) FILTER (WHERE status = 'completed')`
      })
      .from(syncLogs)
      .where(gte(syncLogs.startedAt, sql`NOW() - INTERVAL '24 hours'`))
      .groupBy(sql`date_trunc('hour', ${syncLogs.startedAt})`)
      .orderBy(sql`date_trunc('hour', ${syncLogs.startedAt})`);

      // Get hourly webhook success rates for the last 24 hours
      const webhookTrends = await db.select({
        hour: sql`date_trunc('hour', ${webhookLogs.receivedAt})`,
        total: sql`COUNT(*)`,
        successful: sql`COUNT(*) FILTER (WHERE status = 'completed')`
      })
      .from(webhookLogs)
      .where(gte(webhookLogs.receivedAt, sql`NOW() - INTERVAL '24 hours'`))
      .groupBy(sql`date_trunc('hour', ${webhookLogs.receivedAt})`)
      .orderBy(sql`date_trunc('hour', ${webhookLogs.receivedAt})`);

      return {
        syncSuccessRate: syncTrends.map(item => ({
          timestamp: item.hour,
          successRate: item.total > 0 ? (item.successful / item.total) * 100 : 100
        })),
        webhookSuccessRate: webhookTrends.map(item => ({
          timestamp: item.hour,
          successRate: item.total > 0 ? (item.successful / item.total) * 100 : 100
        }))
      };
    } catch (error) {
      console.error('Error getting health trends:', error);
      return { syncSuccessRate: [], webhookSuccessRate: [] };
    }
  }

  /**
   * Update health metrics cache
   */
  async updateHealthMetrics() {
    try {
      const metrics = await this.getHealthDashboard();
      this.healthMetrics.set('latest', metrics);
      this.healthMetrics.set('lastUpdated', new Date());
      
      console.log('📊 Updated health metrics cache');
    } catch (error) {
      console.error('Error updating health metrics:', error);
    }
  }

  /**
   * Get cached health metrics
   */
  getCachedHealthMetrics() {
    return this.healthMetrics.get('latest') || null;
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Stopped health monitoring');
    }
  }
}

module.exports = new HealthMonitoringService();
