const notificationService = require('../services/notificationService');
const Joi = require('joi');

class NotificationController {

  // ==================== CORE NOTIFICATIONS ====================

  /**
   * Create notification
   */
  async createNotification(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        userId: Joi.number().integer(),
        title: Joi.string().required().max(255),
        message: Joi.string().required(),
        type: Joi.string().valid(
          'info', 'success', 'warning', 'error', 'alert', 'reminder', 'system', 'security'
        ).default('info'),
        module: Joi.string().max(50),
        eventType: Joi.string().max(50),
        relatedId: Joi.number().integer(),
        relatedType: Joi.string().max(50),
        metadata: Joi.object().default({}),
        expiresAt: Joi.date(),
        priority: Joi.number().integer().min(1).max(4).default(1)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Create notification
      const newNotification = await notificationService.createNotification(value, userId);

      res.status(201).json({
        message: 'Notification created successfully',
        data: newNotification
      });

    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        type: Joi.string().valid(
          'info', 'success', 'warning', 'error', 'alert', 'reminder', 'system', 'security'
        ),
        read: Joi.boolean(),
        module: Joi.string().max(50),
        eventType: Joi.string().max(50),
        priority: Joi.number().integer().min(1).max(4),
        startDate: Joi.date(),
        endDate: Joi.date(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'type', 'priority').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { page, limit, sortBy, sortOrder, ...filters } = value;
      const userId = req.user.id;

      // Get user notifications
      const result = await notificationService.getUserNotifications(
        userId, 
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'User notifications retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting user notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        notificationId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ notificationId: parseInt(notificationId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid notification ID', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Mark notification as read
      const updatedNotification = await notificationService.markAsRead(parseInt(notificationId), userId);

      res.json({
        message: 'Notification marked as read successfully',
        data: updatedNotification
      });

    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      if (error.message === 'Notification not found or access denied') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Notification not found or access denied' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        type: Joi.string().valid(
          'info', 'success', 'warning', 'error', 'alert', 'reminder', 'system', 'security'
        ),
        module: Joi.string().max(50)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Mark all notifications as read
      const result = await notificationService.markAllAsRead(userId, value);

      res.json({
        message: 'All notifications marked as read successfully',
        data: result
      });

    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        notificationId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ notificationId: parseInt(notificationId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid notification ID', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Delete notification
      const result = await notificationService.deleteNotification(parseInt(notificationId), userId);

      res.json({
        message: 'Notification deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting notification:', error);
      
      if (error.message === 'Notification not found or access denied') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Notification not found or access denied' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;

      // Get notification statistics
      const stats = await notificationService.getUserNotificationStats(userId);

      res.json({
        message: 'Notification statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('Error getting notification statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== NOTIFICATION CHANNELS ====================

  /**
   * Create notification channel
   */
  async createChannel(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(100),
        channelType: Joi.string().valid(
          'email', 'sms', 'push', 'webhook', 'slack', 'teams', 'discord', 'in_app'
        ).required(),
        config: Joi.object().default({}),
        description: Joi.string(),
        rateLimitPerMinute: Joi.number().integer().min(1).default(60),
        rateLimitPerHour: Joi.number().integer().min(1).default(1000),
        retryAttempts: Joi.number().integer().min(0).default(3),
        retryDelay: Joi.number().integer().min(0).default(300),
        isActive: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Create notification channel
      const newChannel = await notificationService.createChannel(value, userId);

      res.status(201).json({
        message: 'Notification channel created successfully',
        data: newChannel
      });

    } catch (error) {
      console.error('Error creating notification channel:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all notification channels
   */
  async getAllChannels(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        activeOnly: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { activeOnly } = value;

      // Get notification channels
      const channels = await notificationService.getAllChannels(activeOnly);

      res.json({
        message: 'Notification channels retrieved successfully',
        data: channels
      });

    } catch (error) {
      console.error('Error getting notification channels:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update notification channel
   */
  async updateChannel(req, res) {
    try {
      const { channelId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        channelId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ channelId: parseInt(channelId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid channel ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(100),
        channelType: Joi.string().valid(
          'email', 'sms', 'push', 'webhook', 'slack', 'teams', 'discord', 'in_app'
        ),
        config: Joi.object(),
        description: Joi.string(),
        rateLimitPerMinute: Joi.number().integer().min(1),
        rateLimitPerHour: Joi.number().integer().min(1),
        retryAttempts: Joi.number().integer().min(0),
        retryDelay: Joi.number().integer().min(0),
        isActive: Joi.boolean()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const userId = req.user.id;

      // Update notification channel
      const updatedChannel = await notificationService.updateChannel(parseInt(channelId), value, userId);

      res.json({
        message: 'Notification channel updated successfully',
        data: updatedChannel
      });

    } catch (error) {
      console.error('Error updating notification channel:', error);

      if (error.message === 'Notification channel not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Notification channel not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete notification channel
   */
  async deleteChannel(req, res) {
    try {
      const { channelId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        channelId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ channelId: parseInt(channelId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid channel ID',
          details: error.details
        });
      }

      const userId = req.user.id;

      // Delete notification channel
      const result = await notificationService.deleteChannel(parseInt(channelId), userId);

      res.json({
        message: 'Notification channel deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting notification channel:', error);

      if (error.message === 'Notification channel not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Notification channel not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== NOTIFICATION TEMPLATES ====================

  /**
   * Create notification template
   */
  async createTemplate(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        module: Joi.string().required().max(50),
        eventType: Joi.string().required().max(50),
        name: Joi.string().required().max(100),
        subject: Joi.string().required(),
        body: Joi.string().required(),
        format: Joi.string().valid('html', 'text', 'markdown', 'json').default('html'),
        variables: Joi.array().items(Joi.string()).default([]),
        conditions: Joi.object().default({}),
        version: Joi.number().integer().min(1).default(1),
        parentId: Joi.number().integer(),
        isActive: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const userId = req.user.id;

      // Create notification template
      const newTemplate = await notificationService.createTemplate(value, userId);

      res.status(201).json({
        message: 'Notification template created successfully',
        data: newTemplate
      });

    } catch (error) {
      console.error('Error creating notification template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all notification templates
   */
  async getAllTemplates(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        module: Joi.string().max(50),
        eventType: Joi.string().max(50),
        activeOnly: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      // Get notification templates
      const templates = await notificationService.getAllTemplates(value);

      res.json({
        message: 'Notification templates retrieved successfully',
        data: templates
      });

    } catch (error) {
      console.error('Error getting notification templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new NotificationController();
