const metricsService = require('../services/metricsService');
const Joi = require('joi');

class MetricsController {

  // ==================== CORE METRICS OPERATIONS ====================

  /**
   * Create new metric
   */
  async createMetric(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255),
        description: Joi.string().max(5000),
        type: Joi.string().valid(
          'counter', 'gauge', 'histogram', 'summary', 'percentage', 'ratio', 'trend', 'status'
        ).required(),
        category: Joi.string().valid(
          'systems', 'assets', 'vulnerabilities', 'compliance', 'performance', 
          'security', 'financial', 'operational', 'user_activity', 'network', 
          'infrastructure', 'applications'
        ),
        query: Joi.string().required().max(10000),
        value: Joi.number().default(0),
        unit: Joi.string().max(255),
        labels: Joi.object().default({}),
        threshold: Joi.object().default({}),
        source: Joi.string().max(255),
        aggregationPeriod: Joi.string().max(255),
        isActive: Joi.boolean().default(true),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Create metric
      const newMetric = await metricsService.createMetric(value, userId);

      res.status(201).json({
        message: 'Metric created successfully',
        data: newMetric
      });

    } catch (error) {
      console.error('Error creating metric:', error);
      
      if (error.message.includes('Invalid SQL query')) {
        return res.status(400).json({ 
          error: 'Invalid SQL query', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get metric by ID
   */
  async getMetricById(req, res) {
    try {
      const { metricId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        metricId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ metricId: parseInt(metricId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid metric ID', 
          details: error.details 
        });
      }

      // Get metric
      const metric = await metricsService.getMetricById(parseInt(metricId));

      res.json({
        message: 'Metric retrieved successfully',
        data: metric
      });

    } catch (error) {
      console.error('Error getting metric:', error);
      
      if (error.message === 'Metric not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Metric not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update metric
   */
  async updateMetric(req, res) {
    try {
      const { metricId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        metricId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ metricId: parseInt(metricId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid metric ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(255),
        description: Joi.string().max(5000),
        type: Joi.string().valid(
          'counter', 'gauge', 'histogram', 'summary', 'percentage', 'ratio', 'trend', 'status'
        ),
        category: Joi.string().valid(
          'systems', 'assets', 'vulnerabilities', 'compliance', 'performance', 
          'security', 'financial', 'operational', 'user_activity', 'network', 
          'infrastructure', 'applications'
        ),
        query: Joi.string().max(10000),
        value: Joi.number(),
        unit: Joi.string().max(255),
        labels: Joi.object(),
        threshold: Joi.object(),
        source: Joi.string().max(255),
        aggregationPeriod: Joi.string().max(255),
        isActive: Joi.boolean(),
        metadata: Joi.object()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const userId = req.user.id;

      // Update metric
      const updatedMetric = await metricsService.updateMetric(parseInt(metricId), value, userId);

      res.json({
        message: 'Metric updated successfully',
        data: updatedMetric
      });

    } catch (error) {
      console.error('Error updating metric:', error);
      
      if (error.message === 'Metric not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Metric not found' 
        });
      }
      
      if (error.message.includes('Invalid SQL query')) {
        return res.status(400).json({ 
          error: 'Invalid SQL query', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete metric
   */
  async deleteMetric(req, res) {
    try {
      const { metricId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        metricId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ metricId: parseInt(metricId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid metric ID', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Delete metric
      const result = await metricsService.deleteMetric(parseInt(metricId), userId);

      res.json({
        message: 'Metric deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting metric:', error);
      
      if (error.message === 'Metric not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Metric not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all metrics with filtering and pagination
   */
  async getAllMetrics(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        type: Joi.string().valid(
          'counter', 'gauge', 'histogram', 'summary', 'percentage', 'ratio', 'trend', 'status'
        ),
        category: Joi.string().valid(
          'systems', 'assets', 'vulnerabilities', 'compliance', 'performance', 
          'security', 'financial', 'operational', 'user_activity', 'network', 
          'infrastructure', 'applications'
        ),
        isActive: Joi.boolean(),
        createdBy: Joi.number().integer(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'type', 'category', 'value').default('createdAt'),
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

      // Get metrics
      const result = await metricsService.getAllMetrics(filters, { page, limit, sortBy, sortOrder });

      res.json({
        message: 'Metrics retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting all metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== METRIC CALCULATION ====================

  /**
   * Calculate metric value
   */
  async calculateMetric(req, res) {
    try {
      const { metricId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        metricId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ metricId: parseInt(metricId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid metric ID', 
          details: error.details 
        });
      }

      // Calculate metric
      const result = await metricsService.calculateMetric(parseInt(metricId));

      res.json({
        message: 'Metric calculated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error calculating metric:', error);
      
      if (error.message === 'Metric not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Metric not found' 
        });
      }
      
      if (error.message === 'Metric has no query defined') {
        return res.status(400).json({ 
          error: 'Invalid operation', 
          message: 'Metric has no query defined' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Calculate all active metrics
   */
  async calculateAllMetrics(req, res) {
    try {
      // Calculate all metrics
      const result = await metricsService.calculateAllMetrics();

      res.json({
        message: 'All metrics calculated successfully',
        data: result
      });

    } catch (error) {
      console.error('Error calculating all metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get metrics by category
   */
  async getMetricsByCategory(req, res) {
    try {
      // Get metrics by category
      const categoryStats = await metricsService.getMetricsByCategory();

      res.json({
        message: 'Metrics by category retrieved successfully',
        data: categoryStats
      });

    } catch (error) {
      console.error('Error getting metrics by category:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get metrics by type
   */
  async getMetricsByType(req, res) {
    try {
      // Get metrics by type
      const typeStats = await metricsService.getMetricsByType();

      res.json({
        message: 'Metrics by type retrieved successfully',
        data: typeStats
      });

    } catch (error) {
      console.error('Error getting metrics by type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Search metrics
   */
  async searchMetrics(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        q: Joi.string().required().min(2).max(100),
        type: Joi.string().valid(
          'counter', 'gauge', 'histogram', 'summary', 'percentage', 'ratio', 'trend', 'status'
        ),
        category: Joi.string().valid(
          'systems', 'assets', 'vulnerabilities', 'compliance', 'performance',
          'security', 'financial', 'operational', 'user_activity', 'network',
          'infrastructure', 'applications'
        ),
        isActive: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const { q: searchTerm, ...filters } = value;

      // Search metrics
      const results = await metricsService.searchMetrics(searchTerm, filters);

      res.json({
        message: 'Metric search completed successfully',
        data: {
          searchTerm,
          filters,
          results,
          count: results.length
        }
      });

    } catch (error) {
      console.error('Error searching metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== CHART TYPES MANAGEMENT ====================

  /**
   * Create chart type
   */
  async createChartType(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(100),
        type: Joi.string().valid(
          'line', 'bar', 'pie', 'doughnut', 'area', 'scatter', 'bubble',
          'radar', 'polar', 'gauge', 'table', 'number', 'progress', 'heatmap', 'treemap'
        ).required(),
        description: Joi.string().max(5000),
        defaultConfig: Joi.object().default({}),
        supportedMetricTypes: Joi.array().items(Joi.string()).default([]),
        isActive: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      // Create chart type
      const newChartType = await metricsService.createChartType(value);

      res.status(201).json({
        message: 'Chart type created successfully',
        data: newChartType
      });

    } catch (error) {
      console.error('Error creating chart type:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all chart types
   */
  async getAllChartTypes(req, res) {
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

      // Get chart types
      const chartTypes = await metricsService.getAllChartTypes(activeOnly);

      res.json({
        message: 'Chart types retrieved successfully',
        data: chartTypes
      });

    } catch (error) {
      console.error('Error getting chart types:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== CHART CONFIGURATIONS MANAGEMENT ====================

  /**
   * Create chart configuration
   */
  async createChartConfiguration(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(100),
        description: Joi.string().max(5000),
        colorPalette: Joi.array().items(Joi.string()).default([]),
        defaultWidth: Joi.number().integer().min(100).max(2000).default(400),
        defaultHeight: Joi.number().integer().min(100).max(2000).default(300),
        fontFamily: Joi.string().max(100).default('Arial, sans-serif'),
        fontSize: Joi.number().integer().min(8).max(24).default(12),
        theme: Joi.string().valid('light', 'dark', 'custom').default('light'),
        gridConfig: Joi.object().default({}),
        legendConfig: Joi.object().default({}),
        tooltipConfig: Joi.object().default({}),
        animationConfig: Joi.object().default({}),
        isDefault: Joi.boolean().default(false),
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

      // Create chart configuration
      const newConfig = await metricsService.createChartConfiguration(value, userId);

      res.status(201).json({
        message: 'Chart configuration created successfully',
        data: newConfig
      });

    } catch (error) {
      console.error('Error creating chart configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all chart configurations
   */
  async getAllChartConfigurations(req, res) {
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

      // Get chart configurations
      const configs = await metricsService.getAllChartConfigurations(activeOnly);

      res.json({
        message: 'Chart configurations retrieved successfully',
        data: configs
      });

    } catch (error) {
      console.error('Error getting chart configurations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get default chart configuration
   */
  async getDefaultChartConfiguration(req, res) {
    try {
      // Get default chart configuration
      const defaultConfig = await metricsService.getDefaultChartConfiguration();

      if (!defaultConfig) {
        return res.status(404).json({
          error: 'Not found',
          message: 'No default chart configuration found'
        });
      }

      res.json({
        message: 'Default chart configuration retrieved successfully',
        data: defaultConfig
      });

    } catch (error) {
      console.error('Error getting default chart configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update chart configuration
   */
  async updateChartConfiguration(req, res) {
    try {
      const { configId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        configId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ configId: parseInt(configId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid configuration ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(100),
        description: Joi.string().max(5000),
        colorPalette: Joi.array().items(Joi.string()),
        defaultWidth: Joi.number().integer().min(100).max(2000),
        defaultHeight: Joi.number().integer().min(100).max(2000),
        fontFamily: Joi.string().max(100),
        fontSize: Joi.number().integer().min(8).max(24),
        theme: Joi.string().valid('light', 'dark', 'custom'),
        gridConfig: Joi.object(),
        legendConfig: Joi.object(),
        tooltipConfig: Joi.object(),
        animationConfig: Joi.object(),
        isDefault: Joi.boolean(),
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

      // Update chart configuration
      const updatedConfig = await metricsService.updateChartConfiguration(parseInt(configId), value, userId);

      res.json({
        message: 'Chart configuration updated successfully',
        data: updatedConfig
      });

    } catch (error) {
      console.error('Error updating chart configuration:', error);

      if (error.message === 'Chart configuration not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Chart configuration not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DASHBOARD CREATOR METHODS ====================

  /**
   * Get metrics for dashboard creator
   */
  async getMetricsForDashboardCreator(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        category: Joi.string().valid(
          'systems', 'assets', 'vulnerabilities', 'compliance', 'performance',
          'security', 'financial', 'operational', 'user_activity', 'network',
          'infrastructure', 'applications'
        ),
        search: Joi.string().max(255)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      // Get metrics for dashboard creator
      const metrics = await metricsService.getMetricsForDashboardCreator(value);

      res.json({
        message: 'Metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      console.error('Error getting metrics for dashboard creator:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new MetricsController();
