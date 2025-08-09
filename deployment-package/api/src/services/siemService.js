const { db } = require('../db');
const { 
  siemLogSources,
  siemRules,
  siemEvents,
  siemAlerts,
  siemDashboards,
  siemIncidents,
  siemThreatIntelligence,
  siemAnalytics,
  users
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');
const { Client } = require('@elastic/elasticsearch');
const notificationService = require('./notificationService');

class SiemService {
  constructor() {
    // Initialize Elasticsearch client if available
    this.elasticsearchClient = null;
    this.initializeElasticsearch();
  }

  /**
   * Initialize Elasticsearch connection
   */
  async initializeElasticsearch() {
    try {
      if (process.env.ELASTICSEARCH_URL) {
        this.elasticsearchClient = new Client({
          node: process.env.ELASTICSEARCH_URL,
          auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production'
          }
        });

        // Test connection
        await this.elasticsearchClient.ping();
        console.log('✅ Elasticsearch connected successfully');
      } else {
        console.log('ℹ️ Elasticsearch not configured, using PostgreSQL only');
      }
    } catch (error) {
      console.error('❌ Elasticsearch connection failed:', error.message);
      this.elasticsearchClient = null;
    }
  }

  // ==================== LOG SOURCE MANAGEMENT ====================

  /**
   * Create log source
   */
  async createLogSource(sourceData, userId) {
    try {
      console.log('📡 Creating SIEM log source:', sourceData.name);

      const [newSource] = await db.insert(siemLogSources)
        .values({
          ...sourceData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Send notification
      await this.sendSiemNotification('log_source_created', newSource, userId);

      return newSource;
    } catch (error) {
      console.error('Error creating log source:', error);
      throw error;
    }
  }

  /**
   * Get all log sources
   */
  async getAllLogSources(filters = {}, pagination = {}) {
    try {
      const { type, status, search } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select()
        .from(siemLogSources);

      // Apply filters
      const conditions = [];

      if (type) {
        conditions.push(eq(siemLogSources.type, type));
      }

      if (status) {
        conditions.push(eq(siemLogSources.status, status));
      }

      if (search) {
        conditions.push(
          sql`(
            ${siemLogSources.name} ILIKE ${`%${search}%`} OR 
            ${siemLogSources.type} ILIKE ${`%${search}%`} OR
            ${siemLogSources.endpoint} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = siemLogSources[sortBy] || siemLogSources.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const sources = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(siemLogSources);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: sources,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting log sources:', error);
      throw error;
    }
  }

  // ==================== EVENT MANAGEMENT ====================

  /**
   * Create SIEM event
   */
  async createEvent(eventData, userId = null) {
    try {
      console.log('🚨 Creating SIEM event:', eventData.eventType);

      const [newEvent] = await db.insert(siemEvents)
        .values({
          ...eventData,
          receivedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Index in Elasticsearch if available
      if (this.elasticsearchClient) {
        await this.indexEventInElasticsearch(newEvent);
      }

      // Check for rule matches
      await this.processEventRules(newEvent);

      // Send notification for high/critical events
      if (['high', 'critical'].includes(newEvent.severity)) {
        await this.sendSiemNotification('high_severity_event', newEvent, userId);
      }

      return newEvent;
    } catch (error) {
      console.error('Error creating SIEM event:', error);
      throw error;
    }
  }

  /**
   * Get all events with advanced filtering
   */
  async getAllEvents(filters = {}, pagination = {}) {
    try {
      const { 
        sourceId, 
        eventType, 
        severity, 
        status, 
        startDate, 
        endDate, 
        sourceIp, 
        destinationIp, 
        username,
        search 
      } = filters;
      const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = pagination;

      // Use Elasticsearch for search if available and search query provided
      if (this.elasticsearchClient && search) {
        return await this.searchEventsInElasticsearch(filters, pagination);
      }

      let query = db.select({
        id: siemEvents.id,
        sourceId: siemEvents.sourceId,
        timestamp: siemEvents.timestamp,
        eventType: siemEvents.eventType,
        severity: siemEvents.severity,
        status: siemEvents.status,
        summary: siemEvents.summary,
        sourceIp: siemEvents.sourceIp,
        destinationIp: siemEvents.destinationIp,
        username: siemEvents.username,
        processName: siemEvents.processName,
        assignedTo: siemEvents.assignedTo,
        createdAt: siemEvents.createdAt,
        updatedAt: siemEvents.updatedAt
      })
      .from(siemEvents);

      // Apply filters
      const conditions = [];

      if (sourceId) {
        conditions.push(eq(siemEvents.sourceId, sourceId));
      }

      if (eventType) {
        conditions.push(eq(siemEvents.eventType, eventType));
      }

      if (severity) {
        conditions.push(eq(siemEvents.severity, severity));
      }

      if (status) {
        conditions.push(eq(siemEvents.status, status));
      }

      if (startDate) {
        conditions.push(gte(siemEvents.timestamp, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(siemEvents.timestamp, new Date(endDate)));
      }

      if (sourceIp) {
        conditions.push(eq(siemEvents.sourceIp, sourceIp));
      }

      if (destinationIp) {
        conditions.push(eq(siemEvents.destinationIp, destinationIp));
      }

      if (username) {
        conditions.push(eq(siemEvents.username, username));
      }

      if (search) {
        conditions.push(
          sql`(
            ${siemEvents.summary} ILIKE ${`%${search}%`} OR 
            ${siemEvents.eventType} ILIKE ${`%${search}%`} OR
            ${siemEvents.sourceIp} ILIKE ${`%${search}%`} OR
            ${siemEvents.destinationIp} ILIKE ${`%${search}%`} OR
            ${siemEvents.username} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = siemEvents[sortBy] || siemEvents.timestamp;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const events = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(siemEvents);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: events,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting SIEM events:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  async getEventById(eventId) {
    try {
      const [event] = await db.select()
        .from(siemEvents)
        .where(eq(siemEvents.id, eventId))
        .limit(1);

      if (!event) {
        throw new Error('SIEM event not found');
      }

      return event;
    } catch (error) {
      console.error('Error getting SIEM event by ID:', error);
      throw error;
    }
  }

  /**
   * Update event status
   */
  async updateEventStatus(eventId, status, userId, notes = null) {
    try {
      console.log('📝 Updating SIEM event status:', eventId, status);

      const updateData = {
        status,
        updatedAt: new Date()
      };

      if (notes) {
        updateData.investigationNotes = notes;
      }

      if (status === 'closed') {
        updateData.closedAt = new Date();
      }

      const [updatedEvent] = await db.update(siemEvents)
        .set(updateData)
        .where(eq(siemEvents.id, eventId))
        .returning();

      // Update in Elasticsearch if available
      if (this.elasticsearchClient) {
        await this.updateEventInElasticsearch(updatedEvent);
      }

      // Send notification
      await this.sendSiemNotification('event_status_updated', updatedEvent, userId);

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event status:', error);
      throw error;
    }
  }

  // ==================== ALERT MANAGEMENT ====================

  /**
   * Create SIEM alert
   */
  async createAlert(alertData, userId = null) {
    try {
      console.log('🚨 Creating SIEM alert:', alertData.title);

      const [newAlert] = await db.insert(siemAlerts)
        .values({
          ...alertData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Index in Elasticsearch if available
      if (this.elasticsearchClient) {
        await this.indexAlertInElasticsearch(newAlert);
      }

      // Send notification for new alert
      await this.sendSiemNotification('alert_created', newAlert, userId);

      return newAlert;
    } catch (error) {
      console.error('Error creating SIEM alert:', error);
      throw error;
    }
  }

  /**
   * Get all alerts
   */
  async getAllAlerts(filters = {}, pagination = {}) {
    try {
      const { ruleId, severity, status, assignedTo, search } = filters;
      const { page = 1, limit = 20, sortBy = 'firstSeen', sortOrder = 'desc' } = pagination;

      let query = db.select()
        .from(siemAlerts);

      // Apply filters
      const conditions = [];

      if (ruleId) {
        conditions.push(eq(siemAlerts.ruleId, ruleId));
      }

      if (severity) {
        conditions.push(eq(siemAlerts.severity, severity));
      }

      if (status) {
        conditions.push(eq(siemAlerts.status, status));
      }

      if (assignedTo) {
        conditions.push(eq(siemAlerts.assignedTo, assignedTo));
      }

      if (search) {
        conditions.push(
          sql`(
            ${siemAlerts.title} ILIKE ${`%${search}%`} OR 
            ${siemAlerts.description} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = siemAlerts[sortBy] || siemAlerts.firstSeen;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const alerts = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(siemAlerts);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: alerts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting SIEM alerts:', error);
      throw error;
    }
  }

  // ==================== ELASTICSEARCH INTEGRATION ====================

  /**
   * Index event in Elasticsearch
   */
  async indexEventInElasticsearch(event) {
    if (!this.elasticsearchClient) return;

    try {
      const indexName = `siem-events-${new Date().toISOString().slice(0, 7)}`; // Monthly indices

      await this.elasticsearchClient.index({
        index: indexName,
        id: event.id.toString(),
        body: {
          ...event,
          '@timestamp': event.timestamp,
          event_category: 'security',
          event_dataset: 'siem.events'
        }
      });

      console.log(`📊 Event ${event.id} indexed in Elasticsearch`);
    } catch (error) {
      console.error('Error indexing event in Elasticsearch:', error);
      // Don't throw error to avoid breaking main flow
    }
  }

  /**
   * Update event in Elasticsearch
   */
  async updateEventInElasticsearch(event) {
    if (!this.elasticsearchClient) return;

    try {
      const indexName = `siem-events-${new Date(event.timestamp).toISOString().slice(0, 7)}`;

      await this.elasticsearchClient.update({
        index: indexName,
        id: event.id.toString(),
        body: {
          doc: {
            ...event,
            '@timestamp': event.timestamp,
            updated_at: new Date()
          }
        }
      });

      console.log(`📊 Event ${event.id} updated in Elasticsearch`);
    } catch (error) {
      console.error('Error updating event in Elasticsearch:', error);
    }
  }

  /**
   * Search events in Elasticsearch
   */
  async searchEventsInElasticsearch(filters, pagination) {
    if (!this.elasticsearchClient) {
      // Fallback to PostgreSQL
      return await this.getAllEvents(filters, pagination);
    }

    try {
      const { search, severity, eventType, startDate, endDate } = filters;
      const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = pagination;

      const query = {
        bool: {
          must: [],
          filter: []
        }
      };

      // Full-text search
      if (search) {
        query.bool.must.push({
          multi_match: {
            query: search,
            fields: ['summary^2', 'event_type', 'source_ip', 'destination_ip', 'username', 'details.*'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      }

      // Filters
      if (severity) {
        query.bool.filter.push({ term: { severity } });
      }

      if (eventType) {
        query.bool.filter.push({ term: { event_type: eventType } });
      }

      if (startDate || endDate) {
        const dateRange = {};
        if (startDate) dateRange.gte = startDate;
        if (endDate) dateRange.lte = endDate;

        query.bool.filter.push({
          range: { '@timestamp': dateRange }
        });
      }

      const searchParams = {
        index: 'siem-events-*',
        body: {
          query,
          sort: [{ [sortBy === 'timestamp' ? '@timestamp' : sortBy]: { order: sortOrder } }],
          from: (page - 1) * limit,
          size: limit,
          _source: {
            excludes: ['raw_data'] // Exclude large fields for performance
          }
        }
      };

      const response = await this.elasticsearchClient.search(searchParams);

      return {
        data: response.body.hits.hits.map(hit => ({
          id: parseInt(hit._id),
          ...hit._source,
          _score: hit._score
        })),
        pagination: {
          page,
          limit,
          totalCount: response.body.hits.total.value,
          totalPages: Math.ceil(response.body.hits.total.value / limit),
          hasNextPage: page < Math.ceil(response.body.hits.total.value / limit),
          hasPreviousPage: page > 1
        },
        searchMetadata: {
          took: response.body.took,
          maxScore: response.body.hits.max_score
        }
      };
    } catch (error) {
      console.error('Error searching events in Elasticsearch:', error);
      // Fallback to PostgreSQL
      return await this.getAllEvents(filters, pagination);
    }
  }

  /**
   * Index alert in Elasticsearch
   */
  async indexAlertInElasticsearch(alert) {
    if (!this.elasticsearchClient) return;

    try {
      const indexName = `siem-alerts-${new Date().toISOString().slice(0, 7)}`;

      await this.elasticsearchClient.index({
        index: indexName,
        id: alert.id.toString(),
        body: {
          ...alert,
          '@timestamp': alert.firstSeen,
          event_category: 'security',
          event_dataset: 'siem.alerts'
        }
      });

      console.log(`📊 Alert ${alert.id} indexed in Elasticsearch`);
    } catch (error) {
      console.error('Error indexing alert in Elasticsearch:', error);
    }
  }

  // ==================== ANALYTICS ====================

  /**
   * Get SIEM analytics
   */
  async getSiemAnalytics(timeframe = '24h') {
    try {
      const timeframeDuration = this.parseTimeframe(timeframe);
      const startTime = new Date(Date.now() - timeframeDuration);

      // Event statistics
      const [eventStats] = await db.select({
        total: count(),
        critical: count(sql`CASE WHEN ${siemEvents.severity} = 'critical' THEN 1 END`),
        high: count(sql`CASE WHEN ${siemEvents.severity} = 'high' THEN 1 END`),
        medium: count(sql`CASE WHEN ${siemEvents.severity} = 'medium' THEN 1 END`),
        low: count(sql`CASE WHEN ${siemEvents.severity} = 'low' THEN 1 END`)
      }).from(siemEvents)
        .where(gte(siemEvents.timestamp, startTime));

      // Alert statistics
      const [alertStats] = await db.select({
        total: count(),
        new: count(sql`CASE WHEN ${siemAlerts.status} = 'new' THEN 1 END`),
        investigating: count(sql`CASE WHEN ${siemAlerts.status} = 'investigating' THEN 1 END`),
        resolved: count(sql`CASE WHEN ${siemAlerts.status} = 'resolved' THEN 1 END`),
        falsePositive: count(sql`CASE WHEN ${siemAlerts.status} = 'false_positive' THEN 1 END`)
      }).from(siemAlerts)
        .where(gte(siemAlerts.firstSeen, startTime));

      // Top event types
      const topEventTypes = await db.select({
        eventType: siemEvents.eventType,
        count: count()
      }).from(siemEvents)
        .where(gte(siemEvents.timestamp, startTime))
        .groupBy(siemEvents.eventType)
        .orderBy(desc(count()))
        .limit(10);

      return {
        timeframe,
        events: eventStats,
        alerts: alertStats,
        topEventTypes,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting SIEM analytics:', error);
      throw error;
    }
  }

  /**
   * Parse timeframe string to milliseconds
   */
  parseTimeframe(timeframe) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };

    const match = timeframe.match(/^(\d+)([mhdw])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

    const [, value, unit] = match;
    return parseInt(value) * units[unit];
  }

  // ==================== HELPER METHODS ====================

  /**
   * Send SIEM-related notifications
   */
  async sendSiemNotification(eventType, data, userId) {
    try {
      const notificationMap = {
        'log_source_created': {
          title: 'SIEM Log Source Created',
          message: `New log source created: ${data.name}`,
          type: 'info'
        },
        'high_severity_event': {
          title: 'High Severity Security Event',
          message: `${data.severity.toUpperCase()} event detected: ${data.summary}`,
          type: 'warning'
        },
        'alert_created': {
          title: 'Security Alert Generated',
          message: `New security alert: ${data.title}`,
          type: 'warning'
        },
        'event_status_updated': {
          title: 'Event Status Updated',
          message: `Event status changed to: ${data.status}`,
          type: 'info'
        }
      };

      const notification = notificationMap[eventType];
      if (notification && userId) {
        await notificationService.createNotification({
          userId: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'siem',
          eventType: eventType,
          relatedId: data.id,
          relatedType: 'siem',
          metadata: data
        });
      }
    } catch (error) {
      console.error('Error sending SIEM notification:', error);
    }
  }
}

module.exports = new SiemService();
