const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const orchestrationService = require('../services/integrations/orchestrationService');
const webhookService = require('../services/integrations/webhookService');
const dataEnrichmentService = require('../services/integrations/dataEnrichmentService');
const conflictResolutionService = require('../services/integrations/conflictResolutionService');
const healthMonitoringService = require('../services/integrations/healthMonitoringService');

/**
 * Integration Configuration API Routes
 * Manages integration settings, sync schedules, webhook configurations, and monitoring
 */

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// HEALTH MONITORING ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/integrations/health
 * Get comprehensive integration health dashboard
 */
router.get('/health', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const dashboard = await healthMonitoringService.getHealthDashboard();
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching health dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health dashboard',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/integrations/health/cached
 * Get cached health metrics for faster response
 */
router.get('/health/cached', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const cachedMetrics = healthMonitoringService.getCachedHealthMetrics();
    
    if (!cachedMetrics) {
      return res.status(404).json({
        success: false,
        error: 'No cached health metrics available'
      });
    }

    res.json({
      success: true,
      data: cachedMetrics
    });
  } catch (error) {
    console.error('Error fetching cached health metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cached health metrics',
      details: error.message
    });
  }
});

// ============================================================================
// SYNC JOB MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/integrations/sync/jobs
 * Get all sync jobs with optional filtering
 */
router.get('/sync/jobs', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { service, enabled, limit = 50, offset = 0 } = req.query;
    
    const filters = {};
    if (service) filters.service = service;
    if (enabled !== undefined) filters.enabled = enabled === 'true';

    const jobs = await orchestrationService.getSyncJobs(filters, { limit: parseInt(limit), offset: parseInt(offset) });
    
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error fetching sync jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync jobs',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/sync/jobs
 * Create a new sync job
 */
router.post('/sync/jobs', requireRole(['admin']), async (req, res) => {
  try {
    const jobData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'service', 'schedule'];
    const missingFields = requiredFields.filter(field => !jobData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    const job = await orchestrationService.createSyncJob(jobData);
    
    res.status(201).json({
      success: true,
      data: job,
      message: 'Sync job created successfully'
    });
  } catch (error) {
    console.error('Error creating sync job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sync job',
      details: error.message
    });
  }
});

/**
 * PUT /api/v1/integrations/sync/jobs/:id
 * Update a sync job
 */
router.put('/sync/jobs/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedJob = await orchestrationService.updateSyncJob(parseInt(id), updateData);
    
    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found'
      });
    }

    res.json({
      success: true,
      data: updatedJob,
      message: 'Sync job updated successfully'
    });
  } catch (error) {
    console.error('Error updating sync job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update sync job',
      details: error.message
    });
  }
});

/**
 * DELETE /api/v1/integrations/sync/jobs/:id
 * Delete a sync job
 */
router.delete('/sync/jobs/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await orchestrationService.deleteSyncJob(parseInt(id));
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found'
      });
    }

    res.json({
      success: true,
      message: 'Sync job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sync job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete sync job',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/sync/jobs/:id/execute
 * Manually execute a sync job
 */
router.post('/sync/jobs/:id/execute', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await orchestrationService.executeSyncJobById(parseInt(id));
    
    res.json({
      success: true,
      data: result,
      message: 'Sync job execution started'
    });
  } catch (error) {
    console.error('Error executing sync job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute sync job',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/integrations/sync/logs
 * Get sync execution logs
 */
router.get('/sync/logs', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { service, status, limit = 100, offset = 0 } = req.query;
    
    const filters = {};
    if (service) filters.service = service;
    if (status) filters.status = status;

    const logs = await orchestrationService.getSyncLogs(filters, { limit: parseInt(limit), offset: parseInt(offset) });
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync logs',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/integrations/sync/stats
 * Get sync statistics
 */
router.get('/sync/stats', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const stats = await orchestrationService.getSyncStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching sync stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sync stats',
      details: error.message
    });
  }
});

// ============================================================================
// WEBHOOK MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/integrations/webhooks
 * Get all webhook configurations
 */
router.get('/webhooks', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { service, enabled } = req.query;
    
    const filters = {};
    if (service) filters.service = service;
    if (enabled !== undefined) filters.enabled = enabled === 'true';

    const webhooks = await webhookService.getWebhooks(filters);
    
    res.json({
      success: true,
      data: webhooks
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhooks',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/webhooks
 * Create a new webhook configuration
 */
router.post('/webhooks', requireRole(['admin']), async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'service', 'url', 'events'];
    const missingFields = requiredFields.filter(field => !webhookData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    const webhook = await webhookService.createWebhook(webhookData);
    
    res.status(201).json({
      success: true,
      data: webhook,
      message: 'Webhook created successfully'
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create webhook',
      details: error.message
    });
  }
});

/**
 * PUT /api/v1/integrations/webhooks/:id
 * Update a webhook configuration
 */
router.put('/webhooks/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedWebhook = await webhookService.updateWebhook(parseInt(id), updateData);
    
    if (!updatedWebhook) {
      return res.status(404).json({
        success: false,
        error: 'Webhook not found'
      });
    }

    res.json({
      success: true,
      data: updatedWebhook,
      message: 'Webhook updated successfully'
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update webhook',
      details: error.message
    });
  }
});

/**
 * DELETE /api/v1/integrations/webhooks/:id
 * Delete a webhook configuration
 */
router.delete('/webhooks/:id', requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await webhookService.deleteWebhook(parseInt(id));
    
    res.json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/integrations/webhooks/logs
 * Get webhook execution logs
 */
router.get('/webhooks/logs', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { service, status, webhookId, limit = 100 } = req.query;
    
    const filters = {};
    if (service) filters.service = service;
    if (status) filters.status = status;
    if (webhookId) filters.webhookId = parseInt(webhookId);
    if (limit) filters.limit = parseInt(limit);

    const logs = await webhookService.getWebhookLogs(filters);
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhook logs',
      details: error.message
    });
  }
});

// ============================================================================
// CONFLICT RESOLUTION ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/integrations/conflicts
 * Get data conflicts with optional filtering
 */
router.get('/conflicts', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { entityType, severity, status, limit = 100 } = req.query;

    const filters = {};
    if (entityType) filters.entityType = entityType;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);

    const conflicts = await conflictResolutionService.getPendingConflicts(filters);

    res.json({
      success: true,
      data: conflicts
    });
  } catch (error) {
    console.error('Error fetching conflicts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conflicts',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/conflicts/:id/resolve
 * Manually resolve a conflict
 */
router.post('/conflicts/:id/resolve', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, resolvedValue, reasoning } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!action || !reasoning) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: action and reasoning are required'
      });
    }

    const resolution = {
      action,
      resolvedValue,
      reasoning
    };

    const result = await conflictResolutionService.manuallyResolveConflict(parseInt(id), resolution, userId);

    res.json({
      success: true,
      data: result,
      message: 'Conflict resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve conflict',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/integrations/conflicts/stats
 * Get conflict resolution statistics
 */
router.get('/conflicts/stats', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { entityType } = req.query;

    const filters = {};
    if (entityType) filters.entityType = entityType;

    const stats = await conflictResolutionService.getConflictStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching conflict stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conflict stats',
      details: error.message
    });
  }
});

// ============================================================================
// DATA ENRICHMENT ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/integrations/enrichment/vulnerability/:id
 * Enrich a specific vulnerability
 */
router.post('/enrichment/vulnerability/:id', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const options = req.body || {};

    const result = await dataEnrichmentService.enrichVulnerability(parseInt(id), options);

    res.json({
      success: true,
      data: result,
      message: 'Vulnerability enriched successfully'
    });
  } catch (error) {
    console.error('Error enriching vulnerability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich vulnerability',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/enrichment/vulnerabilities/bulk
 * Bulk enrich multiple vulnerabilities
 */
router.post('/enrichment/vulnerabilities/bulk', requireRole(['admin']), async (req, res) => {
  try {
    const { vulnerabilityIds, options = {} } = req.body;

    if (!vulnerabilityIds || !Array.isArray(vulnerabilityIds)) {
      return res.status(400).json({
        success: false,
        error: 'vulnerabilityIds must be an array'
      });
    }

    const result = await dataEnrichmentService.bulkEnrichVulnerabilities(vulnerabilityIds, options);

    res.json({
      success: true,
      data: result,
      message: 'Bulk enrichment started successfully'
    });
  } catch (error) {
    console.error('Error starting bulk enrichment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start bulk enrichment',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/integrations/enrichment/stats
 * Get data enrichment statistics
 */
router.get('/enrichment/stats', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const stats = await dataEnrichmentService.getEnrichmentStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching enrichment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enrichment stats',
      details: error.message
    });
  }
});

// ============================================================================
// WEBHOOK PROCESSING ENDPOINTS (for external services to call)
// ============================================================================

/**
 * POST /api/v1/integrations/webhooks/tenable
 * Process incoming Tenable webhooks
 */
router.post('/webhooks/tenable', async (req, res) => {
  try {
    const signature = req.headers['x-tenable-signature'];
    const eventType = req.headers['x-tenable-event'];
    const payload = req.body;

    const result = await webhookService.processWebhook('tenable', eventType, payload, signature);

    res.json({
      success: true,
      data: result,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Error processing Tenable webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/integrations/webhooks/xacta
 * Process incoming Xacta webhooks
 */
router.post('/webhooks/xacta', async (req, res) => {
  try {
    const signature = req.headers['x-xacta-signature'];
    const eventType = req.headers['x-xacta-event'];
    const payload = req.body;

    const result = await webhookService.processWebhook('xacta', eventType, payload, signature);

    res.json({
      success: true,
      data: result,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Error processing Xacta webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process webhook',
      details: error.message
    });
  }
});

module.exports = router;
