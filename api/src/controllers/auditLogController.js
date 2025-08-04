const auditLogService = require('../services/auditLogService');
const Joi = require('joi');

class AuditLogController {

  // ==================== CORE AUDIT LOG OPERATIONS ====================

  /**
   * Create audit log entry
   */
  async createAuditLog(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        action: Joi.string().valid(
          'create', 'read', 'update', 'delete', 'login', 'logout', 'access', 
          'export', 'import', 'approve', 'reject', 'submit', 'revoke', 
          'upload', 'download', 'search', 'view', 'modify', 'execute', 
          'configure', 'backup', 'restore', 'sync', 'migrate', 'deploy', 'rollback'
        ).required(),
        resourceType: Joi.string().required().max(255),
        resourceId: Joi.string().max(255),
        description: Joi.string().max(5000),
        level: Joi.string().valid('debug', 'info', 'warn', 'error', 'critical').default('info'),
        oldValues: Joi.object().default({}),
        newValues: Joi.object().default({}),
        metadata: Joi.object().default({}),
        success: Joi.boolean().default(true),
        errorMessage: Joi.string().max(5000),
        duration: Joi.number().integer().min(0)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      // Add request context
      const auditData = {
        ...value,
        userId: req.user?.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      };

      // Create audit log
      const auditLog = await auditLogService.createAuditLog(auditData);

      if (!auditLog) {
        return res.status(500).json({ 
          error: 'Failed to create audit log' 
        });
      }

      res.status(201).json({
        message: 'Audit log created successfully',
        data: auditLog
      });

    } catch (error) {
      console.error('Error creating audit log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        userId: Joi.number().integer(),
        action: Joi.string().valid(
          'create', 'read', 'update', 'delete', 'login', 'logout', 'access', 
          'export', 'import', 'approve', 'reject', 'submit', 'revoke', 
          'upload', 'download', 'search', 'view', 'modify', 'execute', 
          'configure', 'backup', 'restore', 'sync', 'migrate', 'deploy', 'rollback'
        ),
        resourceType: Joi.string().max(255),
        resourceId: Joi.string().max(255),
        level: Joi.string().valid('debug', 'info', 'warn', 'error', 'critical'),
        success: Joi.boolean(),
        ipAddress: Joi.string().max(255),
        sessionId: Joi.string().max(255),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'action', 'level', 'success').default('createdAt'),
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

      // Get audit logs
      const result = await auditLogService.getAuditLogs(filters, { page, limit, sortBy, sortOrder });

      res.json({
        message: 'Audit logs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(req, res) {
    try {
      const { logId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        logId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ logId: parseInt(logId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid log ID', 
          details: error.details 
        });
      }

      // Get audit log
      const auditLog = await auditLogService.getAuditLogById(parseInt(logId));

      res.json({
        message: 'Audit log retrieved successfully',
        data: auditLog
      });

    } catch (error) {
      console.error('Error getting audit log:', error);
      
      if (error.message === 'Audit log not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Audit log not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        timeRange: Joi.string().valid('1h', '24h', '7d', '30d', '90d', '1y').default('30d')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { timeRange } = value;

      // Get statistics
      const stats = await auditLogService.getAuditLogStats(timeRange);

      res.json({
        message: 'Audit log statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('Error getting audit log stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(req, res) {
    try {
      const { userId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        userId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ userId: parseInt(userId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid user ID', 
          details: paramError.details 
        });
      }

      // Validate query parameters
      const querySchema = Joi.object({
        timeRange: Joi.string().valid('1h', '24h', '7d', '30d', '90d').default('7d')
      });

      const { error: queryError, value } = querySchema.validate(req.query);
      if (queryError) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: queryError.details 
        });
      }

      const { timeRange } = value;

      // Get user activity timeline
      const timeline = await auditLogService.getUserActivityTimeline(parseInt(userId), timeRange);

      res.json({
        message: 'User activity timeline retrieved successfully',
        data: {
          userId: parseInt(userId),
          timeRange,
          timeline,
          totalActivities: timeline.length
        }
      });

    } catch (error) {
      console.error('Error getting user activity timeline:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get resource access history
   */
  async getResourceAccessHistory(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        resourceType: Joi.string().required().max(255),
        resourceId: Joi.string().required().max(255),
        timeRange: Joi.string().valid('1h', '24h', '7d', '30d', '90d').default('30d')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { resourceType, resourceId, timeRange } = value;

      // Get resource access history
      const history = await auditLogService.getResourceAccessHistory(resourceType, resourceId, timeRange);

      res.json({
        message: 'Resource access history retrieved successfully',
        data: {
          resourceType,
          resourceId,
          timeRange,
          history,
          totalAccesses: history.length
        }
      });

    } catch (error) {
      console.error('Error getting resource access history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get security events
   */
  async getSecurityEvents(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        timeRange: Joi.string().valid('1h', '24h', '7d', '30d').default('24h'),
        level: Joi.string().valid('warn', 'error', 'critical').default('warn')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { timeRange, level } = value;

      // Get security events
      const securityEvents = await auditLogService.getSecurityEvents(timeRange, level);

      res.json({
        message: 'Security events retrieved successfully',
        data: {
          timeRange,
          level,
          events: securityEvents,
          totalEvents: securityEvents.length
        }
      });

    } catch (error) {
      console.error('Error getting security events:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        q: Joi.string().required().min(2).max(100),
        userId: Joi.number().integer(),
        action: Joi.string().valid(
          'create', 'read', 'update', 'delete', 'login', 'logout', 'access', 
          'export', 'import', 'approve', 'reject', 'submit', 'revoke', 
          'upload', 'download', 'search', 'view', 'modify', 'execute', 
          'configure', 'backup', 'restore', 'sync', 'migrate', 'deploy', 'rollback'
        ),
        resourceType: Joi.string().max(255),
        level: Joi.string().valid('debug', 'info', 'warn', 'error', 'critical'),
        success: Joi.boolean(),
        timeRange: Joi.string().valid('1h', '24h', '7d', '30d', '90d').default('30d')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { q: searchTerm, ...filters } = value;

      // Search audit logs
      const results = await auditLogService.searchAuditLogs(searchTerm, filters);

      res.json({
        message: 'Audit log search completed successfully',
        data: {
          searchTerm,
          filters,
          results,
          totalResults: results.length
        }
      });

    } catch (error) {
      console.error('Error searching audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== COMPLIANCE & EXPORT ====================

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso(),
        userId: Joi.number().integer(),
        resourceType: Joi.string().max(255),
        action: Joi.string().valid(
          'create', 'read', 'update', 'delete', 'login', 'logout', 'access',
          'export', 'import', 'approve', 'reject', 'submit', 'revoke',
          'upload', 'download', 'search', 'view', 'modify', 'execute',
          'configure', 'backup', 'restore', 'sync', 'migrate', 'deploy', 'rollback'
        ),
        format: Joi.string().valid('json', 'csv').default('json')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const { format, ...filters } = value;

      // Export audit logs
      const exportResult = await auditLogService.exportAuditLogs(filters, format);

      // Log the export action
      await auditLogService.logUserAction(
        req.user?.id,
        'export',
        'audit_logs',
        null,
        `Exported ${exportResult.totalRecords} audit logs`,
        { filters, format },
        req
      );

      res.json({
        message: 'Audit logs exported successfully',
        data: exportResult
      });

    } catch (error) {
      console.error('Error exporting audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Create bulk audit log entries
   */
  async createBulkAuditLogs(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        auditLogs: Joi.array().items(
          Joi.object({
            action: Joi.string().valid(
              'create', 'read', 'update', 'delete', 'login', 'logout', 'access',
              'export', 'import', 'approve', 'reject', 'submit', 'revoke',
              'upload', 'download', 'search', 'view', 'modify', 'execute',
              'configure', 'backup', 'restore', 'sync', 'migrate', 'deploy', 'rollback'
            ).required(),
            resourceType: Joi.string().required().max(255),
            resourceId: Joi.string().max(255),
            description: Joi.string().max(5000),
            level: Joi.string().valid('debug', 'info', 'warn', 'error', 'critical').default('info'),
            oldValues: Joi.object().default({}),
            newValues: Joi.object().default({}),
            metadata: Joi.object().default({}),
            success: Joi.boolean().default(true),
            errorMessage: Joi.string().max(5000),
            duration: Joi.number().integer().min(0)
          })
        ).required().min(1).max(100)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      // Add request context to each audit log
      const auditLogsData = value.auditLogs.map(auditData => ({
        ...auditData,
        userId: req.user?.id,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
        sessionId: req.sessionID
      }));

      // Create bulk audit logs
      const auditLogs = await auditLogService.createBulkAuditLogs(auditLogsData);

      res.status(201).json({
        message: 'Bulk audit logs created successfully',
        data: {
          created: auditLogs.length,
          auditLogs
        }
      });

    } catch (error) {
      console.error('Error creating bulk audit logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Log current user action (convenience endpoint)
   */
  async logUserAction(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        action: Joi.string().valid(
          'create', 'read', 'update', 'delete', 'login', 'logout', 'access',
          'export', 'import', 'approve', 'reject', 'submit', 'revoke',
          'upload', 'download', 'search', 'view', 'modify', 'execute',
          'configure', 'backup', 'restore', 'sync', 'migrate', 'deploy', 'rollback'
        ).required(),
        resourceType: Joi.string().required().max(255),
        resourceId: Joi.string().max(255),
        description: Joi.string().required().max(5000),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const { action, resourceType, resourceId, description, metadata } = value;

      // Log user action
      const auditLog = await auditLogService.logUserAction(
        req.user?.id,
        action,
        resourceType,
        resourceId,
        description,
        metadata,
        req
      );

      if (!auditLog) {
        return res.status(500).json({
          error: 'Failed to log user action'
        });
      }

      res.status(201).json({
        message: 'User action logged successfully',
        data: auditLog
      });

    } catch (error) {
      console.error('Error logging user action:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AuditLogController();
