const reportService = require('../services/reportService');
const Joi = require('joi');
const fs = require('fs').promises;
const path = require('path');

class ReportController {

  // ==================== REPORT TEMPLATE OPERATIONS ====================

  /**
   * Create report template
   */
  async createTemplate(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(100).trim(),
        description: Joi.string().max(1000).trim(),
        module: Joi.string().required().max(50).trim(),
        templateData: Joi.object().required(),
        isSystem: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newTemplate = await reportService.createTemplate(value, req.user.id);

      res.status(201).json({
        message: 'Report template created successfully',
        data: newTemplate
      });

    } catch (error) {
      console.error('Error creating report template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all report templates
   */
  async getAllTemplates(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        module: Joi.string().max(50),
        isSystem: Joi.boolean(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'module').default('createdAt'),
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

      const result = await reportService.getAllTemplates(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Report templates retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting report templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get report template by ID
   */
  async getTemplateById(req, res) {
    try {
      const { templateId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        templateId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ templateId: parseInt(templateId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid template ID', 
          details: error.details 
        });
      }

      const template = await reportService.getTemplateById(parseInt(templateId));

      res.json({
        message: 'Report template retrieved successfully',
        data: template
      });

    } catch (error) {
      console.error('Error getting report template by ID:', error);
      
      if (error.message === 'Report template not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Report template not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update report template
   */
  async updateTemplate(req, res) {
    try {
      const { templateId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        templateId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ templateId: parseInt(templateId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid template ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(100).trim(),
        description: Joi.string().max(1000).trim(),
        module: Joi.string().max(50).trim(),
        templateData: Joi.object(),
        isSystem: Joi.boolean()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedTemplate = await reportService.updateTemplate(parseInt(templateId), value, req.user.id);

      res.json({
        message: 'Report template updated successfully',
        data: updatedTemplate
      });

    } catch (error) {
      console.error('Error updating report template:', error);
      
      if (error.message === 'Report template not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Report template not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete report template
   */
  async deleteTemplate(req, res) {
    try {
      const { templateId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        templateId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ templateId: parseInt(templateId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid template ID', 
          details: error.details 
        });
      }

      const result = await reportService.deleteTemplate(parseInt(templateId), req.user.id);

      res.json({
        message: 'Report template deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting report template:', error);
      
      if (error.message === 'Report template not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Report template not found' 
        });
      }

      if (error.message.includes('Cannot delete template that is being used')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== REPORT CONFIGURATION OPERATIONS ====================

  /**
   * Create report configuration
   */
  async createConfiguration(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().trim(),
        templateId: Joi.number().integer().required(),
        parameters: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newConfiguration = await reportService.createConfiguration(value, req.user.id);

      res.status(201).json({
        message: 'Report configuration created successfully',
        data: newConfiguration
      });

    } catch (error) {
      console.error('Error creating report configuration:', error);
      
      if (error.message === 'Report template not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Report template not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all report configurations
   */
  async getAllConfigurations(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        templateId: Joi.number().integer(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name').default('createdAt'),
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

      const result = await reportService.getAllConfigurations(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Report configurations retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting report configurations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get report configuration by ID
   */
  async getConfigurationById(req, res) {
    try {
      const { configId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        configId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ configId: parseInt(configId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid configuration ID', 
          details: error.details 
        });
      }

      const configuration = await reportService.getConfigurationById(parseInt(configId));

      res.json({
        message: 'Report configuration retrieved successfully',
        data: configuration
      });

    } catch (error) {
      console.error('Error getting report configuration by ID:', error);
      
      if (error.message === 'Report configuration not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Report configuration not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== REPORT GENERATION OPERATIONS ====================

  /**
   * Generate report
   */
  async generateReport(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255).trim(),
        description: Joi.string().max(1000).trim(),
        type: Joi.string().valid('dashboard', 'metrics', 'analytics', 'compliance', 'audit', 'security', 'asset', 'vulnerability', 'policy', 'procedure', 'user_activity', 'system_performance', 'financial', 'operational', 'custom').required(),
        format: Joi.string().valid('pdf', 'excel', 'csv', 'json', 'html', 'word', 'powerpoint').default('pdf'),
        parameters: Joi.object().default({}),
        templateId: Joi.number().integer(),
        configurationId: Joi.number().integer(),
        scheduleId: Joi.number().integer(),
        scheduledFor: Joi.date().iso(),
        expiresAt: Joi.date().iso(),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const newReport = await reportService.generateReport(value, req.user.id);

      res.status(201).json({
        message: 'Report generation started successfully',
        data: newReport
      });

    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all reports
   */
  async getAllReports(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        type: Joi.string().valid('dashboard', 'metrics', 'analytics', 'compliance', 'audit', 'security', 'asset', 'vulnerability', 'policy', 'procedure', 'user_activity', 'system_performance', 'financial', 'operational', 'custom'),
        status: Joi.string().valid('draft', 'generating', 'completed', 'failed', 'scheduled', 'cancelled', 'expired'),
        generatedBy: Joi.number().integer(),
        startDate: Joi.date().iso(),
        endDate: Joi.date().iso(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'generatedAt', 'type', 'status').default('createdAt'),
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

      const result = await reportService.getAllReports(
        filters,
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Reports retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting reports:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get report by ID
   */
  async getReportById(req, res) {
    try {
      const { reportId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        reportId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ reportId: parseInt(reportId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid report ID',
          details: error.details
        });
      }

      const report = await reportService.getReportById(parseInt(reportId));

      res.json({
        message: 'Report retrieved successfully',
        data: report
      });

    } catch (error) {
      console.error('Error getting report by ID:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Report not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Download report file
   */
  async downloadReport(req, res) {
    try {
      const { reportId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        reportId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ reportId: parseInt(reportId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid report ID',
          details: error.details
        });
      }

      const report = await reportService.getReportById(parseInt(reportId));

      if (!report.filePath || report.status !== 'completed') {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Report file is not available for download'
        });
      }

      // Check if file exists
      try {
        await fs.access(report.filePath);
      } catch (fileError) {
        return res.status(404).json({
          error: 'Not found',
          message: 'Report file not found'
        });
      }

      // Set appropriate headers
      const filename = path.basename(report.filePath);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');

      // Stream the file
      const fileStream = require('fs').createReadStream(report.filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Error downloading report:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Report not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete report
   */
  async deleteReport(req, res) {
    try {
      const { reportId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        reportId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ reportId: parseInt(reportId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid report ID',
          details: error.details
        });
      }

      const result = await reportService.deleteReport(parseInt(reportId), req.user.id);

      res.json({
        message: 'Report deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting report:', error);

      if (error.message === 'Report not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Report not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new ReportController();
