const crypto = require('crypto');
const { db } = require('../../db');
const { webhookConfigurations, webhookLogs } = require('../../db/schema');
const { eq, and, desc } = require('drizzle-orm');
const tenableService = require('./tenableService');
const xactaService = require('./xactaService');

/**
 * Webhook Management Service
 * Handles real-time integration with external APIs through webhooks
 */
class WebhookService {
  constructor() {
    this.registeredWebhooks = new Map();
    this.eventHandlers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize webhook service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load existing webhook configurations
      await this.loadWebhookConfigurations();
      
      // Register event handlers
      this.registerEventHandlers();
      
      this.isInitialized = true;
      console.log('✅ Webhook service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize webhook service:', error);
      throw error;
    }
  }

  /**
   * Load webhook configurations from database
   */
  async loadWebhookConfigurations() {
    try {
      const webhooks = await db.select()
        .from(webhookConfigurations)
        .where(eq(webhookConfigurations.enabled, true));

      for (const webhook of webhooks) {
        this.registeredWebhooks.set(webhook.id, webhook);
      }

      console.log(`📡 Loaded ${webhooks.length} webhook configurations`);
    } catch (error) {
      console.error('Failed to load webhook configurations:', error);
    }
  }

  /**
   * Register webhook event handlers
   */
  registerEventHandlers() {
    // Tenable event handlers
    this.eventHandlers.set('tenable.scan.completed', this.handleTenableScanCompleted.bind(this));
    this.eventHandlers.set('tenable.asset.created', this.handleTenableAssetCreated.bind(this));
    this.eventHandlers.set('tenable.asset.updated', this.handleTenableAssetUpdated.bind(this));
    this.eventHandlers.set('tenable.vulnerability.found', this.handleTenableVulnerabilityFound.bind(this));
    this.eventHandlers.set('tenable.vulnerability.fixed', this.handleTenableVulnerabilityFixed.bind(this));

    // Xacta event handlers
    this.eventHandlers.set('xacta.control.updated', this.handleXactaControlUpdated.bind(this));
    this.eventHandlers.set('xacta.poam.created', this.handleXactaPoamCreated.bind(this));
    this.eventHandlers.set('xacta.poam.updated', this.handleXactaPoamUpdated.bind(this));
    this.eventHandlers.set('xacta.assessment.completed', this.handleXactaAssessmentCompleted.bind(this));

    console.log(`🎯 Registered ${this.eventHandlers.size} webhook event handlers`);
  }

  /**
   * Create webhook configuration
   */
  async createWebhook(webhookData) {
    try {
      const {
        name,
        service,
        url,
        events,
        secret,
        enabled = true,
        retryAttempts = 3,
        timeout = 30000
      } = webhookData;

      // Generate webhook secret if not provided
      const webhookSecret = secret || this.generateWebhookSecret();

      const [webhook] = await db.insert(webhookConfigurations)
        .values({
          name,
          service,
          url,
          events: JSON.stringify(events),
          secret: webhookSecret,
          enabled,
          retryAttempts,
          timeout,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Register with external service
      await this.registerWithExternalService(service, webhook);

      // Cache the webhook configuration
      this.registeredWebhooks.set(webhook.id, webhook);

      console.log(`✅ Created webhook: ${name} for ${service}`);
      return webhook;

    } catch (error) {
      console.error('Error creating webhook:', error);
      throw error;
    }
  }

  /**
   * Register webhook with external service
   */
  async registerWithExternalService(service, webhook) {
    try {
      switch (service) {
        case 'tenable':
          await tenableService.createWebhook({
            name: webhook.name,
            url: webhook.url,
            events: JSON.parse(webhook.events),
            secret: webhook.secret
          });
          break;
        
        case 'xacta':
          await xactaService.createWebhook({
            name: webhook.name,
            url: webhook.url,
            events: JSON.parse(webhook.events),
            secret: webhook.secret
          });
          break;
        
        default:
          throw new Error(`Unsupported service: ${service}`);
      }
    } catch (error) {
      console.error(`Failed to register webhook with ${service}:`, error);
      throw error;
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(service, eventType, payload, signature) {
    const startTime = new Date();
    let logEntry;

    try {
      // Find webhook configuration
      const webhook = Array.from(this.registeredWebhooks.values())
        .find(w => w.service === service && JSON.parse(w.events).includes(eventType));

      if (!webhook) {
        throw new Error(`No webhook configuration found for ${service}.${eventType}`);
      }

      // Verify webhook signature
      if (!this.verifyWebhookSignature(payload, signature, webhook.secret)) {
        throw new Error('Invalid webhook signature');
      }

      // Log webhook receipt
      [logEntry] = await db.insert(webhookLogs)
        .values({
          webhookId: webhook.id,
          service,
          eventType,
          payload: JSON.stringify(payload),
          signature,
          status: 'processing',
          receivedAt: startTime
        })
        .returning({ id: webhookLogs.id });

      // Process the event
      const eventKey = `${service}.${eventType}`;
      const handler = this.eventHandlers.get(eventKey);

      if (!handler) {
        throw new Error(`No handler found for event: ${eventKey}`);
      }

      const result = await handler(payload, webhook);

      // Update log with success
      await db.update(webhookLogs)
        .set({
          status: 'completed',
          processedAt: new Date(),
          duration: Date.now() - startTime.getTime(),
          result: JSON.stringify(result)
        })
        .where(eq(webhookLogs.id, logEntry.id));

      console.log(`✅ Processed webhook: ${service}.${eventType}`);
      return result;

    } catch (error) {
      console.error(`❌ Webhook processing failed: ${service}.${eventType}`, error);

      // Update log with failure
      if (logEntry) {
        await db.update(webhookLogs)
          .set({
            status: 'failed',
            processedAt: new Date(),
            duration: Date.now() - startTime.getTime(),
            error: error.message
          })
          .where(eq(webhookLogs.id, logEntry.id));
      }

      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature, secret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Generate webhook secret
   */
  generateWebhookSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Event Handlers

  /**
   * Handle Tenable scan completed event
   */
  async handleTenableScanCompleted(payload, webhook) {
    console.log('🔍 Processing Tenable scan completed event');
    
    const { scan_id, scan_uuid, status, targets } = payload;
    
    // Trigger immediate sync of scan results
    if (status === 'completed') {
      await tenableService.syncScanResults(scan_id);
    }

    return {
      action: 'scan_sync_triggered',
      scanId: scan_id,
      scanUuid: scan_uuid,
      targets: targets?.length || 0
    };
  }

  /**
   * Handle Tenable asset created event
   */
  async handleTenableAssetCreated(payload, webhook) {
    console.log('🖥️ Processing Tenable asset created event');
    
    const { asset } = payload;
    
    // Sync the new asset
    await tenableService.syncSingleAsset(asset.id);

    return {
      action: 'asset_synced',
      assetId: asset.id,
      hostname: asset.hostname
    };
  }

  /**
   * Handle Tenable asset updated event
   */
  async handleTenableAssetUpdated(payload, webhook) {
    console.log('🔄 Processing Tenable asset updated event');
    
    const { asset } = payload;
    
    // Update the asset
    await tenableService.syncSingleAsset(asset.id);

    return {
      action: 'asset_updated',
      assetId: asset.id,
      hostname: asset.hostname
    };
  }

  /**
   * Handle Tenable vulnerability found event
   */
  async handleTenableVulnerabilityFound(payload, webhook) {
    console.log('🚨 Processing Tenable vulnerability found event');
    
    const { vulnerability, asset } = payload;
    
    // Sync the vulnerability
    await tenableService.syncSingleVulnerability(vulnerability.plugin_id, asset.id);

    return {
      action: 'vulnerability_synced',
      pluginId: vulnerability.plugin_id,
      assetId: asset.id,
      severity: vulnerability.severity
    };
  }

  /**
   * Handle Tenable vulnerability fixed event
   */
  async handleTenableVulnerabilityFixed(payload, webhook) {
    console.log('✅ Processing Tenable vulnerability fixed event');
    
    const { vulnerability, asset } = payload;
    
    // Update vulnerability status
    await tenableService.updateVulnerabilityStatus(vulnerability.plugin_id, asset.id, 'fixed');

    return {
      action: 'vulnerability_fixed',
      pluginId: vulnerability.plugin_id,
      assetId: asset.id
    };
  }

  /**
   * Handle Xacta control updated event
   */
  async handleXactaControlUpdated(payload, webhook) {
    console.log('🛡️ Processing Xacta control updated event');
    
    const { control } = payload;
    
    // Sync the updated control
    await xactaService.syncSingleControl(control.id);

    return {
      action: 'control_synced',
      controlId: control.id,
      controlNumber: control.control_number
    };
  }

  /**
   * Handle Xacta POAM created event
   */
  async handleXactaPoamCreated(payload, webhook) {
    console.log('📋 Processing Xacta POAM created event');
    
    const { poam } = payload;
    
    // Sync the new POAM
    await xactaService.syncSinglePoam(poam.id);

    return {
      action: 'poam_synced',
      poamId: poam.id,
      title: poam.title
    };
  }

  /**
   * Handle Xacta POAM updated event
   */
  async handleXactaPoamUpdated(payload, webhook) {
    console.log('🔄 Processing Xacta POAM updated event');
    
    const { poam } = payload;
    
    // Update the POAM
    await xactaService.syncSinglePoam(poam.id);

    return {
      action: 'poam_updated',
      poamId: poam.id,
      status: poam.status
    };
  }

  /**
   * Handle Xacta assessment completed event
   */
  async handleXactaAssessmentCompleted(payload, webhook) {
    console.log('📊 Processing Xacta assessment completed event');
    
    const { assessment } = payload;
    
    // Trigger full control sync for the assessment
    await xactaService.syncAssessmentControls(assessment.id);

    return {
      action: 'assessment_controls_synced',
      assessmentId: assessment.id,
      controlCount: assessment.control_count || 0
    };
  }

  /**
   * Get webhook configurations
   */
  async getWebhooks(filters = {}) {
    try {
      let query = db.select().from(webhookConfigurations);

      if (filters.service) {
        query = query.where(eq(webhookConfigurations.service, filters.service));
      }

      if (filters.enabled !== undefined) {
        query = query.where(eq(webhookConfigurations.enabled, filters.enabled));
      }

      const webhooks = await query.orderBy(desc(webhookConfigurations.createdAt));
      return webhooks;
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw error;
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(id, updateData) {
    try {
      const [updatedWebhook] = await db.update(webhookConfigurations)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(webhookConfigurations.id, id))
        .returning();

      // Update cache
      if (updatedWebhook) {
        this.registeredWebhooks.set(id, updatedWebhook);
      }

      return updatedWebhook;
    } catch (error) {
      console.error('Error updating webhook:', error);
      throw error;
    }
  }

  /**
   * Delete webhook configuration
   */
  async deleteWebhook(id) {
    try {
      const webhook = this.registeredWebhooks.get(id);
      
      if (webhook) {
        // Unregister from external service
        await this.unregisterFromExternalService(webhook.service, webhook);
        
        // Remove from database
        await db.delete(webhookConfigurations)
          .where(eq(webhookConfigurations.id, id));
        
        // Remove from cache
        this.registeredWebhooks.delete(id);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting webhook:', error);
      throw error;
    }
  }

  /**
   * Unregister webhook from external service
   */
  async unregisterFromExternalService(service, webhook) {
    try {
      switch (service) {
        case 'tenable':
          await tenableService.deleteWebhook(webhook.externalId);
          break;
        
        case 'xacta':
          await xactaService.deleteWebhook(webhook.externalId);
          break;
        
        default:
          console.warn(`No unregister method for service: ${service}`);
      }
    } catch (error) {
      console.error(`Failed to unregister webhook from ${service}:`, error);
      // Don't throw - allow local deletion to proceed
    }
  }

  /**
   * Get webhook logs
   */
  async getWebhookLogs(filters = {}) {
    try {
      let query = db.select().from(webhookLogs);

      if (filters.webhookId) {
        query = query.where(eq(webhookLogs.webhookId, filters.webhookId));
      }

      if (filters.service) {
        query = query.where(eq(webhookLogs.service, filters.service));
      }

      if (filters.status) {
        query = query.where(eq(webhookLogs.status, filters.status));
      }

      const logs = await query
        .orderBy(desc(webhookLogs.receivedAt))
        .limit(filters.limit || 100);

      return logs;
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      throw error;
    }
  }
}

module.exports = new WebhookService();
