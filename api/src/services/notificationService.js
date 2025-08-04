const { db } = require('../db');
const { 
  notifications, 
  notificationChannels, 
  notificationTemplates,
  notificationSubscriptions,
  notificationDeliveries,
  users 
} = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, or, like, ilike, count, sum, isNull, isNotNull, inArray } = require('drizzle-orm');

class NotificationService {

  // ==================== CORE NOTIFICATIONS ====================

  /**
   * Create notification
   */
  async createNotification(notificationData, userId = null) {
    try {
      console.log('📢 Creating notification:', notificationData.title);

      const [newNotification] = await db.insert(notifications)
        .values({
          ...notificationData,
          userId: notificationData.userId || userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(userId, filters = {}, pagination = {}) {
    try {
      const { 
        type, 
        read, 
        module, 
        eventType,
        priority,
        startDate,
        endDate
      } = filters;
      
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = pagination;

      let query = db.select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        read: notifications.read,
        readAt: notifications.readAt,
        module: notifications.module,
        eventType: notifications.eventType,
        relatedId: notifications.relatedId,
        relatedType: notifications.relatedType,
        metadata: notifications.metadata,
        priority: notifications.priority,
        expiresAt: notifications.expiresAt,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt
      })
      .from(notifications)
      .where(eq(notifications.userId, userId));

      // Apply filters
      const conditions = [eq(notifications.userId, userId)];

      if (type) {
        conditions.push(eq(notifications.type, type));
      }

      if (read !== undefined) {
        conditions.push(eq(notifications.read, read));
      }

      if (module) {
        conditions.push(eq(notifications.module, module));
      }

      if (eventType) {
        conditions.push(eq(notifications.eventType, eventType));
      }

      if (priority) {
        conditions.push(eq(notifications.priority, priority));
      }

      if (startDate) {
        conditions.push(gte(notifications.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(notifications.createdAt, new Date(endDate)));
      }

      // Filter out expired notifications
      conditions.push(
        or(
          isNull(notifications.expiresAt),
          gte(notifications.expiresAt, new Date())
        )
      );

      if (conditions.length > 1) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = notifications[sortBy] || notifications.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const userNotifications = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(notifications);
      if (conditions.length > 1) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: userNotifications,
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
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      console.log('👁️ Marking notification as read:', notificationId);

      const [updatedNotification] = await db.update(notifications)
        .set({
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .returning();

      if (!updatedNotification) {
        throw new Error('Notification not found or access denied');
      }

      return updatedNotification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId, filters = {}) {
    try {
      console.log('👁️ Marking all notifications as read for user:', userId);

      const conditions = [
        eq(notifications.userId, userId),
        eq(notifications.read, false)
      ];

      // Apply optional filters
      if (filters.type) {
        conditions.push(eq(notifications.type, filters.type));
      }

      if (filters.module) {
        conditions.push(eq(notifications.module, filters.module));
      }

      const result = await db.update(notifications)
        .set({
          read: true,
          readAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(...conditions));

      return { updatedCount: result.rowCount || 0 };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      console.log('🗑️ Deleting notification:', notificationId);

      // Check if notification exists and belongs to user
      const [existingNotification] = await db.select()
        .from(notifications)
        .where(and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        ))
        .limit(1);

      if (!existingNotification) {
        throw new Error('Notification not found or access denied');
      }

      // Delete the notification
      await db.delete(notifications)
        .where(eq(notifications.id, notificationId));

      return { success: true, deletedNotification: existingNotification };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for user
   */
  async getUserNotificationStats(userId) {
    try {
      // Get counts by status
      const [stats] = await db.select({
        total: count(),
        unread: sql`COUNT(CASE WHEN read = false THEN 1 END)`,
        read: sql`COUNT(CASE WHEN read = true THEN 1 END)`,
        highPriority: sql`COUNT(CASE WHEN priority >= 3 THEN 1 END)`,
        expired: sql`COUNT(CASE WHEN expires_at < NOW() THEN 1 END)`
      })
      .from(notifications)
      .where(eq(notifications.userId, userId));

      // Get counts by type
      const typeStats = await db.select({
        type: notifications.type,
        count: count(),
        unreadCount: sql`COUNT(CASE WHEN read = false THEN 1 END)`
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .groupBy(notifications.type)
      .orderBy(desc(count()));

      // Get counts by module
      const moduleStats = await db.select({
        module: notifications.module,
        count: count(),
        unreadCount: sql`COUNT(CASE WHEN read = false THEN 1 END)`
      })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        isNotNull(notifications.module)
      ))
      .groupBy(notifications.module)
      .orderBy(desc(count()));

      return {
        overview: stats,
        byType: typeStats,
        byModule: moduleStats
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION CHANNELS ====================

  /**
   * Create notification channel
   */
  async createChannel(channelData, userId) {
    try {
      console.log('📡 Creating notification channel:', channelData.name);

      const [newChannel] = await db.insert(notificationChannels)
        .values({
          ...channelData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newChannel;
    } catch (error) {
      console.error('Error creating notification channel:', error);
      throw error;
    }
  }

  /**
   * Get all notification channels
   */
  async getAllChannels(activeOnly = true) {
    try {
      let query = db.select({
        id: notificationChannels.id,
        name: notificationChannels.name,
        channelType: notificationChannels.channelType,
        config: notificationChannels.config,
        isActive: notificationChannels.isActive,
        description: notificationChannels.description,
        rateLimitPerMinute: notificationChannels.rateLimitPerMinute,
        rateLimitPerHour: notificationChannels.rateLimitPerHour,
        retryAttempts: notificationChannels.retryAttempts,
        retryDelay: notificationChannels.retryDelay,
        createdBy: notificationChannels.createdBy,
        createdAt: notificationChannels.createdAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName
      })
      .from(notificationChannels)
      .leftJoin(users, eq(notificationChannels.createdBy, users.id));

      if (activeOnly) {
        query = query.where(eq(notificationChannels.isActive, true));
      }

      const channels = await query.orderBy(asc(notificationChannels.name));
      return channels;
    } catch (error) {
      console.error('Error getting notification channels:', error);
      throw error;
    }
  }

  /**
   * Update notification channel
   */
  async updateChannel(channelId, updateData, userId) {
    try {
      console.log('📡 Updating notification channel:', channelId);

      const [updatedChannel] = await db.update(notificationChannels)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(notificationChannels.id, channelId))
        .returning();

      if (!updatedChannel) {
        throw new Error('Notification channel not found');
      }

      return updatedChannel;
    } catch (error) {
      console.error('Error updating notification channel:', error);
      throw error;
    }
  }

  /**
   * Delete notification channel
   */
  async deleteChannel(channelId, userId) {
    try {
      console.log('🗑️ Deleting notification channel:', channelId);

      // Check if channel exists
      const [existingChannel] = await db.select()
        .from(notificationChannels)
        .where(eq(notificationChannels.id, channelId))
        .limit(1);

      if (!existingChannel) {
        throw new Error('Notification channel not found');
      }

      // Delete the channel
      await db.delete(notificationChannels)
        .where(eq(notificationChannels.id, channelId));

      return { success: true, deletedChannel: existingChannel };
    } catch (error) {
      console.error('Error deleting notification channel:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION TEMPLATES ====================

  /**
   * Create notification template
   */
  async createTemplate(templateData, userId) {
    try {
      console.log('📝 Creating notification template:', templateData.name);

      const [newTemplate] = await db.insert(notificationTemplates)
        .values({
          ...templateData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newTemplate;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  }

  /**
   * Get all notification templates
   */
  async getAllTemplates(filters = {}) {
    try {
      const { module, eventType, activeOnly = true } = filters;

      let query = db.select({
        id: notificationTemplates.id,
        module: notificationTemplates.module,
        eventType: notificationTemplates.eventType,
        name: notificationTemplates.name,
        subject: notificationTemplates.subject,
        body: notificationTemplates.body,
        format: notificationTemplates.format,
        isActive: notificationTemplates.isActive,
        variables: notificationTemplates.variables,
        conditions: notificationTemplates.conditions,
        version: notificationTemplates.version,
        parentId: notificationTemplates.parentId,
        createdBy: notificationTemplates.createdBy,
        createdAt: notificationTemplates.createdAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName
      })
      .from(notificationTemplates)
      .leftJoin(users, eq(notificationTemplates.createdBy, users.id));

      const conditions = [];

      if (module) {
        conditions.push(eq(notificationTemplates.module, module));
      }

      if (eventType) {
        conditions.push(eq(notificationTemplates.eventType, eventType));
      }

      if (activeOnly) {
        conditions.push(eq(notificationTemplates.isActive, true));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const templates = await query.orderBy(asc(notificationTemplates.module), asc(notificationTemplates.eventType));
      return templates;
    } catch (error) {
      console.error('Error getting notification templates:', error);
      throw error;
    }
  }

  /**
   * Get template by module and event type
   */
  async getTemplateByModuleAndEvent(module, eventType) {
    try {
      const [template] = await db.select()
        .from(notificationTemplates)
        .where(and(
          eq(notificationTemplates.module, module),
          eq(notificationTemplates.eventType, eventType),
          eq(notificationTemplates.isActive, true)
        ))
        .orderBy(desc(notificationTemplates.version))
        .limit(1);

      return template;
    } catch (error) {
      console.error('Error getting template by module and event:', error);
      throw error;
    }
  }

  /**
   * Update notification template
   */
  async updateTemplate(templateId, updateData, userId) {
    try {
      console.log('📝 Updating notification template:', templateId);

      const [updatedTemplate] = await db.update(notificationTemplates)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(notificationTemplates.id, templateId))
        .returning();

      if (!updatedTemplate) {
        throw new Error('Notification template not found');
      }

      return updatedTemplate;
    } catch (error) {
      console.error('Error updating notification template:', error);
      throw error;
    }
  }

  /**
   * Delete notification template
   */
  async deleteTemplate(templateId, userId) {
    try {
      console.log('🗑️ Deleting notification template:', templateId);

      // Check if template exists
      const [existingTemplate] = await db.select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.id, templateId))
        .limit(1);

      if (!existingTemplate) {
        throw new Error('Notification template not found');
      }

      // Delete the template
      await db.delete(notificationTemplates)
        .where(eq(notificationTemplates.id, templateId));

      return { success: true, deletedTemplate: existingTemplate };
    } catch (error) {
      console.error('Error deleting notification template:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
