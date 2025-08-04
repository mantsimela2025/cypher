const { db } = require('../db');
const { auditLogs, users } = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, or, like, ilike, count, sum, isNull, isNotNull } = require('drizzle-orm');

class AuditLogService {

  // ==================== CORE AUDIT LOGGING ====================

  /**
   * Create audit log entry
   */
  async createAuditLog(auditData) {
    try {
      console.log('📝 Creating audit log entry:', auditData.action, auditData.resourceType);

      // Validate required fields
      if (!auditData.action || !auditData.resourceType) {
        throw new Error('Action and resourceType are required for audit logging');
      }

      // Create audit log entry
      const [auditLog] = await db.insert(auditLogs)
        .values({
          userId: auditData.userId || null,
          action: auditData.action,
          resourceType: auditData.resourceType,
          resourceId: auditData.resourceId || null,
          description: auditData.description || null,
          ipAddress: auditData.ipAddress || null,
          userAgent: auditData.userAgent || null,
          level: auditData.level || 'info',
          oldValues: auditData.oldValues || {},
          newValues: auditData.newValues || {},
          metadata: auditData.metadata || {},
          sessionId: auditData.sessionId || null,
          success: auditData.success !== undefined ? auditData.success : true,
          errorMessage: auditData.errorMessage || null,
          duration: auditData.duration || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error to prevent audit logging from breaking main functionality
      return null;
    }
  }

  /**
   * Bulk create audit log entries
   */
  async createBulkAuditLogs(auditDataArray) {
    try {
      console.log('📝 Creating bulk audit log entries:', auditDataArray.length);

      const validatedData = auditDataArray.map(auditData => ({
        userId: auditData.userId || null,
        action: auditData.action,
        resourceType: auditData.resourceType,
        resourceId: auditData.resourceId || null,
        description: auditData.description || null,
        ipAddress: auditData.ipAddress || null,
        userAgent: auditData.userAgent || null,
        level: auditData.level || 'info',
        oldValues: auditData.oldValues || {},
        newValues: auditData.newValues || {},
        metadata: auditData.metadata || {},
        sessionId: auditData.sessionId || null,
        success: auditData.success !== undefined ? auditData.success : true,
        errorMessage: auditData.errorMessage || null,
        duration: auditData.duration || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const auditLogEntries = await db.insert(auditLogs)
        .values(validatedData)
        .returning();

      return auditLogEntries;
    } catch (error) {
      console.error('Error creating bulk audit logs:', error);
      return [];
    }
  }

  // ==================== AUDIT LOG RETRIEVAL ====================

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters = {}, pagination = {}) {
    try {
      const { 
        userId, 
        action, 
        resourceType, 
        resourceId, 
        level, 
        success,
        ipAddress,
        sessionId,
        startDate, 
        endDate,
        search 
      } = filters;
      
      const { 
        page = 1, 
        limit = 50, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = pagination;

      let query = db.select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        description: auditLogs.description,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        level: auditLogs.level,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        metadata: auditLogs.metadata,
        sessionId: auditLogs.sessionId,
        success: auditLogs.success,
        errorMessage: auditLogs.errorMessage,
        duration: auditLogs.duration,
        createdAt: auditLogs.createdAt,
        updatedAt: auditLogs.updatedAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id));

      // Apply filters
      const conditions = [];

      if (userId) {
        conditions.push(eq(auditLogs.userId, userId));
      }

      if (action) {
        conditions.push(eq(auditLogs.action, action));
      }

      if (resourceType) {
        conditions.push(eq(auditLogs.resourceType, resourceType));
      }

      if (resourceId) {
        conditions.push(eq(auditLogs.resourceId, resourceId));
      }

      if (level) {
        conditions.push(eq(auditLogs.level, level));
      }

      if (success !== undefined) {
        conditions.push(eq(auditLogs.success, success));
      }

      if (ipAddress) {
        conditions.push(eq(auditLogs.ipAddress, ipAddress));
      }

      if (sessionId) {
        conditions.push(eq(auditLogs.sessionId, sessionId));
      }

      if (startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
      }

      if (search) {
        conditions.push(
          or(
            ilike(auditLogs.description, `%${search}%`),
            ilike(auditLogs.resourceType, `%${search}%`),
            ilike(auditLogs.resourceId, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = auditLogs[sortBy] || auditLogs.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const logs = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(auditLogs);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: logs,
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
      console.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(logId) {
    try {
      const [auditLog] = await db.select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        description: auditLogs.description,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        level: auditLogs.level,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        metadata: auditLogs.metadata,
        sessionId: auditLogs.sessionId,
        success: auditLogs.success,
        errorMessage: auditLogs.errorMessage,
        duration: auditLogs.duration,
        createdAt: auditLogs.createdAt,
        updatedAt: auditLogs.updatedAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.id, logId))
      .limit(1);

      if (!auditLog) {
        throw new Error('Audit log not found');
      }

      return auditLog;
    } catch (error) {
      console.error('Error getting audit log by ID:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(timeRange = '30d') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      // Get action distribution
      const actionStats = await db.select({
        action: auditLogs.action,
        count: count()
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, dateFilter))
      .groupBy(auditLogs.action)
      .orderBy(desc(count()));

      // Get resource type distribution
      const resourceStats = await db.select({
        resourceType: auditLogs.resourceType,
        count: count()
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, dateFilter))
      .groupBy(auditLogs.resourceType)
      .orderBy(desc(count()));

      // Get level distribution
      const levelStats = await db.select({
        level: auditLogs.level,
        count: count()
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, dateFilter))
      .groupBy(auditLogs.level);

      // Get success/failure stats
      const successStats = await db.select({
        success: auditLogs.success,
        count: count()
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, dateFilter))
      .groupBy(auditLogs.success);

      // Get total logs count
      const [totalLogs] = await db.select({
        count: count()
      })
      .from(auditLogs)
      .where(gte(auditLogs.createdAt, dateFilter));

      // Get unique users count
      const [uniqueUsers] = await db.select({
        count: sql`COUNT(DISTINCT user_id)`
      })
      .from(auditLogs)
      .where(and(
        gte(auditLogs.createdAt, dateFilter),
        isNotNull(auditLogs.userId)
      ));

      // Get average duration
      const [avgDuration] = await db.select({
        average: sql`AVG(duration)`
      })
      .from(auditLogs)
      .where(and(
        gte(auditLogs.createdAt, dateFilter),
        isNotNull(auditLogs.duration)
      ));

      return {
        timeRange,
        totalLogs: totalLogs.count,
        uniqueUsers: uniqueUsers.count,
        averageDuration: avgDuration.average || 0,
        actionDistribution: actionStats,
        resourceTypeDistribution: resourceStats,
        levelDistribution: levelStats,
        successDistribution: successStats,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting audit log stats:', error);
      throw error;
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(userId, timeRange = '7d') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const timeline = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        description: auditLogs.description,
        level: auditLogs.level,
        success: auditLogs.success,
        duration: auditLogs.duration,
        createdAt: auditLogs.createdAt
      })
      .from(auditLogs)
      .where(and(
        eq(auditLogs.userId, userId),
        gte(auditLogs.createdAt, dateFilter)
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);

      return timeline;
    } catch (error) {
      console.error('Error getting user activity timeline:', error);
      throw error;
    }
  }

  /**
   * Get resource access history
   */
  async getResourceAccessHistory(resourceType, resourceId, timeRange = '30d') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const history = await db.select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        description: auditLogs.description,
        ipAddress: auditLogs.ipAddress,
        level: auditLogs.level,
        success: auditLogs.success,
        createdAt: auditLogs.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(
        eq(auditLogs.resourceType, resourceType),
        eq(auditLogs.resourceId, resourceId),
        gte(auditLogs.createdAt, dateFilter)
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(200);

      return history;
    } catch (error) {
      console.error('Error getting resource access history:', error);
      throw error;
    }
  }

  /**
   * Get security events (failed actions, errors, etc.)
   */
  async getSecurityEvents(timeRange = '24h', level = 'warn') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      const securityEvents = await db.select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        description: auditLogs.description,
        ipAddress: auditLogs.ipAddress,
        level: auditLogs.level,
        success: auditLogs.success,
        errorMessage: auditLogs.errorMessage,
        createdAt: auditLogs.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(and(
        gte(auditLogs.createdAt, dateFilter),
        or(
          eq(auditLogs.success, false),
          eq(auditLogs.level, level),
          eq(auditLogs.level, 'error'),
          eq(auditLogs.level, 'critical')
        )
      ))
      .orderBy(desc(auditLogs.createdAt))
      .limit(500);

      return securityEvents;
    } catch (error) {
      console.error('Error getting security events:', error);
      throw error;
    }
  }

  /**
   * Search audit logs with advanced filtering
   */
  async searchAuditLogs(searchTerm, filters = {}) {
    try {
      const { userId, action, resourceType, level, success, timeRange = '30d' } = filters;
      const dateFilter = this._getDateFilter(timeRange);

      let query = db.select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        resourceType: auditLogs.resourceType,
        resourceId: auditLogs.resourceId,
        description: auditLogs.description,
        ipAddress: auditLogs.ipAddress,
        level: auditLogs.level,
        success: auditLogs.success,
        createdAt: auditLogs.createdAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id));

      const conditions = [gte(auditLogs.createdAt, dateFilter)];

      // Search in multiple fields
      if (searchTerm) {
        conditions.push(
          or(
            ilike(auditLogs.description, `%${searchTerm}%`),
            ilike(auditLogs.resourceType, `%${searchTerm}%`),
            ilike(auditLogs.resourceId, `%${searchTerm}%`),
            ilike(auditLogs.errorMessage, `%${searchTerm}%`),
            ilike(users.email, `%${searchTerm}%`)
          )
        );
      }

      // Apply filters
      if (userId) conditions.push(eq(auditLogs.userId, userId));
      if (action) conditions.push(eq(auditLogs.action, action));
      if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType));
      if (level) conditions.push(eq(auditLogs.level, level));
      if (success !== undefined) conditions.push(eq(auditLogs.success, success));

      const results = await query
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);

      return results;
    } catch (error) {
      console.error('Error searching audit logs:', error);
      throw error;
    }
  }

  // ==================== COMPLIANCE & EXPORT ====================

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(filters = {}, format = 'json') {
    try {
      const { startDate, endDate, userId, resourceType, action } = filters;

      let query = db.select()
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id));

      const conditions = [];

      if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
      if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
      if (userId) conditions.push(eq(auditLogs.userId, userId));
      if (resourceType) conditions.push(eq(auditLogs.resourceType, resourceType));
      if (action) conditions.push(eq(auditLogs.action, action));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const logs = await query.orderBy(asc(auditLogs.createdAt));

      // Format for export
      const exportData = logs.map(log => ({
        id: log.audit_logs.id,
        timestamp: log.audit_logs.createdAt,
        user: log.users ? `${log.users.firstName} ${log.users.lastName} (${log.users.email})` : 'System',
        action: log.audit_logs.action,
        resource: `${log.audit_logs.resourceType}${log.audit_logs.resourceId ? ':' + log.audit_logs.resourceId : ''}`,
        description: log.audit_logs.description,
        ipAddress: log.audit_logs.ipAddress,
        level: log.audit_logs.level,
        success: log.audit_logs.success,
        duration: log.audit_logs.duration,
        errorMessage: log.audit_logs.errorMessage
      }));

      return {
        data: exportData,
        format,
        exportedAt: new Date(),
        totalRecords: exportData.length,
        filters
      };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  _getDateFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // ==================== HELPER METHODS FOR OTHER SERVICES ====================

  /**
   * Log user action (helper method for other services)
   */
  async logUserAction(userId, action, resourceType, resourceId, description, metadata = {}, req = null) {
    const auditData = {
      userId,
      action,
      resourceType,
      resourceId,
      description,
      metadata,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID
    };

    return await this.createAuditLog(auditData);
  }

  /**
   * Log system action (helper method for system operations)
   */
  async logSystemAction(action, resourceType, resourceId, description, metadata = {}) {
    const auditData = {
      userId: null, // System action
      action,
      resourceType,
      resourceId,
      description,
      metadata,
      level: 'info'
    };

    return await this.createAuditLog(auditData);
  }

  /**
   * Log error (helper method for error logging)
   */
  async logError(userId, action, resourceType, resourceId, errorMessage, metadata = {}, req = null) {
    const auditData = {
      userId,
      action,
      resourceType,
      resourceId,
      description: `Error during ${action}`,
      errorMessage,
      metadata,
      level: 'error',
      success: false,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID
    };

    return await this.createAuditLog(auditData);
  }

  /**
   * Simplified logAction method for backward compatibility
   */
  async logAction(userId, resourceType, action, resourceId, oldValues = null, newValues = null) {
    return await this.createAuditLog({
      userId,
      action,
      resourceType,
      resourceId,
      oldValues,
      newValues,
      level: 'info',
      success: true
    });
  }
}

module.exports = new AuditLogService();
