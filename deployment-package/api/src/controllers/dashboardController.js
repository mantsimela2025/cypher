const dashboardService = require('../services/dashboardService');
const Joi = require('joi');

class DashboardController {

  // ==================== GLOBAL DASHBOARDS ====================

  /**
   * Create global dashboard (admin only)
   */
  async createGlobalDashboard(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255),
        description: Joi.string().max(5000),
        layout: Joi.object().default({}),
        isDefault: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Create global dashboard
      const newDashboard = await dashboardService.createGlobalDashboard(value, userId);

      res.status(201).json({
        message: 'Global dashboard created successfully',
        data: newDashboard
      });

    } catch (error) {
      console.error('Error creating global dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all global dashboards
   */
  async getGlobalDashboards(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        includeMetrics: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { includeMetrics } = value;

      // Get global dashboards
      const globalDashboards = await dashboardService.getGlobalDashboards(includeMetrics);

      res.json({
        message: 'Global dashboards retrieved successfully',
        data: globalDashboards
      });

    } catch (error) {
      console.error('Error getting global dashboards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update global dashboard
   */
  async updateGlobalDashboard(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ dashboardId: parseInt(dashboardId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid dashboard ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(255),
        description: Joi.string().max(5000),
        layout: Joi.object(),
        isDefault: Joi.boolean()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const userId = req.user.id;

      // Update global dashboard
      const updatedDashboard = await dashboardService.updateGlobalDashboard(parseInt(dashboardId), value, userId);

      res.json({
        message: 'Global dashboard updated successfully',
        data: updatedDashboard
      });

    } catch (error) {
      console.error('Error updating global dashboard:', error);
      
      if (error.message === 'Global dashboard not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Global dashboard not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete global dashboard
   */
  async deleteGlobalDashboard(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ dashboardId: parseInt(dashboardId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid dashboard ID', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Delete global dashboard
      const result = await dashboardService.deleteGlobalDashboard(parseInt(dashboardId), userId);

      res.json({
        message: 'Global dashboard deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting global dashboard:', error);
      
      if (error.message === 'Global dashboard not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Global dashboard not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== USER DASHBOARDS ====================

  /**
   * Create user dashboard
   */
  async createUserDashboard(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(100),
        isDefault: Joi.boolean().default(false),
        layout: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Create user dashboard
      const newDashboard = await dashboardService.createUserDashboard(value, userId);

      res.status(201).json({
        message: 'User dashboard created successfully',
        data: newDashboard
      });

    } catch (error) {
      console.error('Error creating user dashboard:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user dashboards
   */
  async getUserDashboards(req, res) {
    try {
      const userId = req.user.id;

      // Get user dashboards
      const userDashboards = await dashboardService.getUserDashboards(userId);

      res.json({
        message: 'User dashboards retrieved successfully',
        data: userDashboards
      });

    } catch (error) {
      console.error('Error getting user dashboards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update user dashboard
   */
  async updateUserDashboard(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ dashboardId: parseInt(dashboardId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid dashboard ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(100),
        isDefault: Joi.boolean(),
        layout: Joi.object()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const userId = req.user.id;

      // Update user dashboard
      const updatedDashboard = await dashboardService.updateUserDashboard(parseInt(dashboardId), value, userId);

      res.json({
        message: 'User dashboard updated successfully',
        data: updatedDashboard
      });

    } catch (error) {
      console.error('Error updating user dashboard:', error);
      
      if (error.message === 'User dashboard not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'User dashboard not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DASHBOARD METRICS MANAGEMENT ====================

  /**
   * Add metric to dashboard
   */
  async addMetricToDashboard(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ dashboardId: parseInt(dashboardId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid dashboard ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        metricId: Joi.number().integer().required(),
        chartTypeId: Joi.number().integer(),
        chartConfigId: Joi.number().integer(),
        position: Joi.number().integer().min(1),
        width: Joi.number().integer().min(100).max(2000).default(400),
        height: Joi.number().integer().min(100).max(2000).default(300),
        config: Joi.object().default({}),
        refreshInterval: Joi.number().integer().min(30).max(3600).default(300)
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const userId = req.user.id;

      // Add metric to dashboard
      const dashboardMetric = await dashboardService.addMetricToDashboard(parseInt(dashboardId), value, userId);

      res.status(201).json({
        message: 'Metric added to dashboard successfully',
        data: dashboardMetric
      });

    } catch (error) {
      console.error('Error adding metric to dashboard:', error);

      if (error.message === 'Dashboard not found or access denied') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard not found or access denied'
        });
      }

      if (error.message === 'Metric already exists on this dashboard') {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Metric already exists on this dashboard'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ dashboardId: parseInt(dashboardId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid dashboard ID',
          details: error.details
        });
      }

      // Get dashboard metrics
      const dashboardMetrics = await dashboardService.getDashboardMetrics(parseInt(dashboardId));

      res.json({
        message: 'Dashboard metrics retrieved successfully',
        data: dashboardMetrics
      });

    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update dashboard metric
   */
  async updateDashboardMetric(req, res) {
    try {
      const { dashboardMetricId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        dashboardMetricId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ dashboardMetricId: parseInt(dashboardMetricId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid dashboard metric ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        chartTypeId: Joi.number().integer(),
        chartConfigId: Joi.number().integer(),
        position: Joi.number().integer().min(1),
        width: Joi.number().integer().min(100).max(2000),
        height: Joi.number().integer().min(100).max(2000),
        config: Joi.object(),
        isVisible: Joi.boolean(),
        refreshInterval: Joi.number().integer().min(30).max(3600)
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const userId = req.user.id;

      // Update dashboard metric
      const updatedDashboardMetric = await dashboardService.updateDashboardMetric(parseInt(dashboardMetricId), value, userId);

      res.json({
        message: 'Dashboard metric updated successfully',
        data: updatedDashboardMetric
      });

    } catch (error) {
      console.error('Error updating dashboard metric:', error);

      if (error.message === 'Dashboard metric not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard metric not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Remove metric from dashboard
   */
  async removeMetricFromDashboard(req, res) {
    try {
      const { dashboardMetricId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        dashboardMetricId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ dashboardMetricId: parseInt(dashboardMetricId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid dashboard metric ID',
          details: error.details
        });
      }

      const userId = req.user.id;

      // Remove metric from dashboard
      const result = await dashboardService.removeMetricFromDashboard(parseInt(dashboardMetricId), userId);

      res.json({
        message: 'Metric removed from dashboard successfully',
        data: result
      });

    } catch (error) {
      console.error('Error removing metric from dashboard:', error);

      if (error.message === 'Dashboard metric not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard metric not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DASHBOARD SHARING ====================

  /**
   * Share dashboard with user
   */
  async shareDashboard(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ dashboardId: parseInt(dashboardId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid dashboard ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        userId: Joi.number().integer().required(),
        permission: Joi.string().valid('view', 'edit', 'admin').default('view')
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const currentUserId = req.user.id;

      // Share dashboard
      const share = await dashboardService.shareDashboard(parseInt(dashboardId), value.userId, value.permission, currentUserId);

      res.status(201).json({
        message: 'Dashboard shared successfully',
        data: share
      });

    } catch (error) {
      console.error('Error sharing dashboard:', error);

      if (error.message === 'Dashboard not found or access denied') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard not found or access denied'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard shares
   */
  async getDashboardShares(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ dashboardId: parseInt(dashboardId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid dashboard ID',
          details: error.details
        });
      }

      // Get dashboard shares
      const shares = await dashboardService.getDashboardShares(parseInt(dashboardId));

      res.json({
        message: 'Dashboard shares retrieved successfully',
        data: shares
      });

    } catch (error) {
      console.error('Error getting dashboard shares:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Remove dashboard share
   */
  async removeDashboardShare(req, res) {
    try {
      const { shareId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        shareId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ shareId: parseInt(shareId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid share ID',
          details: error.details
        });
      }

      const userId = req.user.id;

      // Remove dashboard share
      const result = await dashboardService.removeDashboardShare(parseInt(shareId), userId);

      res.json({
        message: 'Dashboard share removed successfully',
        data: result
      });

    } catch (error) {
      console.error('Error removing dashboard share:', error);

      if (error.message === 'Dashboard share not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard share not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DASHBOARD ACCESS ====================

  /**
   * Get dashboard by ID
   */
  async getDashboardById(req, res) {
    try {
      const { dashboardId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        dashboardId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ dashboardId: parseInt(dashboardId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid dashboard ID',
          details: paramError.details
        });
      }

      // Validate query parameters
      const querySchema = Joi.object({
        includeMetrics: Joi.boolean().default(false)
      });

      const { error: queryError, value } = querySchema.validate(req.query);
      if (queryError) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: queryError.details
        });
      }

      const { includeMetrics } = value;
      const userId = req.user.id;

      // Get dashboard
      const dashboard = await dashboardService.getDashboardById(parseInt(dashboardId), userId, includeMetrics);

      if (!dashboard) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard not found or access denied'
        });
      }

      res.json({
        message: 'Dashboard retrieved successfully',
        data: dashboard
      });

    } catch (error) {
      console.error('Error getting dashboard by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all accessible dashboards for user
   */
  async getAccessibleDashboards(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        includeMetrics: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const { includeMetrics } = value;
      const userId = req.user.id;

      // Get accessible dashboards
      const dashboards = await dashboardService.getAccessibleDashboards(userId, includeMetrics);

      res.json({
        message: 'Accessible dashboards retrieved successfully',
        data: dashboards
      });

    } catch (error) {
      console.error('Error getting accessible dashboards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DASHBOARD CREATOR METHODS ====================

  /**
   * Create dashboard with widgets (Dashboard Creator)
   */
  async createDashboardWithWidgets(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255),
        description: Joi.string().max(5000),
        layout: Joi.object().default({}),
        widgets: Joi.array().default([]),
        isPublished: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const userId = req.user.id;

      // Create dashboard with widgets
      const newDashboard = await dashboardService.createDashboardWithWidgets(value, userId);

      res.status(201).json({
        message: 'Dashboard created successfully',
        data: newDashboard
      });

    } catch (error) {
      console.error('Error creating dashboard with widgets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user's created dashboards (for My Dashboards page)
   */
  async getUserCreatedDashboards(req, res) {
    try {
      const userId = req.user.id;

      // Get user's created dashboards
      const dashboards = await dashboardService.getUserCreatedDashboards(userId);

      res.json({
        message: 'User dashboards retrieved successfully',
        data: dashboards
      });

    } catch (error) {
      console.error('Error getting user created dashboards:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get dashboard for editing
   */
  async getDashboardForEditing(req, res) {
    try {
      const { dashboardId } = req.params;
      const userId = req.user.id;

      // Validate dashboard ID
      if (!dashboardId || isNaN(parseInt(dashboardId))) {
        return res.status(400).json({
          error: 'Invalid dashboard ID'
        });
      }

      // Get dashboard for editing
      const dashboard = await dashboardService.getDashboardForEditing(parseInt(dashboardId), userId);

      res.json({
        message: 'Dashboard retrieved successfully',
        data: dashboard
      });

    } catch (error) {
      console.error('Error getting dashboard for editing:', error);

      if (error.message === 'Dashboard not found or access denied') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard not found or access denied'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update dashboard widgets
   */
  async updateDashboardWidgets(req, res) {
    try {
      const { dashboardId } = req.params;
      const userId = req.user.id;

      // Validate dashboard ID
      if (!dashboardId || isNaN(parseInt(dashboardId))) {
        return res.status(400).json({
          error: 'Invalid dashboard ID'
        });
      }

      // Validate request body
      const schema = Joi.object({
        widgets: Joi.array().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      // Update dashboard widgets
      const updatedDashboard = await dashboardService.updateDashboardWidgets(
        parseInt(dashboardId),
        value.widgets,
        userId
      );

      res.json({
        message: 'Dashboard widgets updated successfully',
        data: updatedDashboard
      });

    } catch (error) {
      console.error('Error updating dashboard widgets:', error);

      if (error.message === 'Dashboard not found or access denied') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard not found or access denied'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Publish/unpublish dashboard
   */
  async publishDashboard(req, res) {
    try {
      const { dashboardId } = req.params;
      const userId = req.user.id;

      // Validate dashboard ID
      if (!dashboardId || isNaN(parseInt(dashboardId))) {
        return res.status(400).json({
          error: 'Invalid dashboard ID'
        });
      }

      // Validate request body
      const schema = Joi.object({
        isPublished: Joi.boolean().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      // Publish/unpublish dashboard
      const updatedDashboard = await dashboardService.publishDashboard(
        parseInt(dashboardId),
        value.isPublished,
        userId
      );

      res.json({
        message: `Dashboard ${value.isPublished ? 'published' : 'unpublished'} successfully`,
        data: updatedDashboard
      });

    } catch (error) {
      console.error('Error publishing dashboard:', error);

      if (error.message === 'Dashboard not found or access denied') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard not found or access denied'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(req, res) {
    try {
      const { dashboardId } = req.params;
      const userId = req.user.id;

      // Validate dashboard ID
      if (!dashboardId || isNaN(parseInt(dashboardId))) {
        return res.status(400).json({
          error: 'Invalid dashboard ID'
        });
      }

      // Delete dashboard
      const deletedDashboard = await dashboardService.deleteDashboard(parseInt(dashboardId), userId);

      res.json({
        message: 'Dashboard deleted successfully',
        data: deletedDashboard
      });

    } catch (error) {
      console.error('Error deleting dashboard:', error);

      if (error.message === 'Dashboard not found or access denied') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Dashboard not found or access denied'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new DashboardController();
