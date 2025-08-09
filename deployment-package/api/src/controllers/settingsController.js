const settingsService = require('../services/settingsService');
const Joi = require('joi');

class SettingsController {

  // ==================== CRUD OPERATIONS ====================

  /**
   * Get all settings with filtering and pagination
   */
  async getAllSettings(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        category: Joi.string().max(255),
        isPublic: Joi.boolean(),
        isEditable: Joi.boolean(),
        search: Joi.string().max(255),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50),
        sortBy: Joi.string().valid('key', 'category', 'dataType', 'createdAt', 'updatedAt').default('category'),
        sortOrder: Joi.string().valid('asc', 'desc').default('asc')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { page, limit, sortBy, sortOrder, ...filters } = value;

      const result = await settingsService.getAllSettings(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Settings retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get setting by ID
   */
  async getSettingById(req, res) {
    try {
      const { id } = req.params;

      // Validate parameters
      const schema = Joi.object({
        id: Joi.number().integer().required()
      });

      const { error } = schema.validate({ id: parseInt(id) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid setting ID', 
          details: error.details 
        });
      }

      const setting = await settingsService.getSettingById(parseInt(id));

      res.json({
        message: 'Setting retrieved successfully',
        data: setting
      });

    } catch (error) {
      console.error('Error getting setting by ID:', error);
      
      if (error.message === 'Setting not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Setting not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get setting by key
   */
  async getSettingByKey(req, res) {
    try {
      const { key } = req.params;

      // Validate parameters
      const schema = Joi.object({
        key: Joi.string().max(255).required()
      });

      const { error } = schema.validate({ key });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid setting key', 
          details: error.details 
        });
      }

      const setting = await settingsService.getSettingByKey(key);

      res.json({
        message: 'Setting retrieved successfully',
        data: setting
      });

    } catch (error) {
      console.error('Error getting setting by key:', error);
      
      if (error.message === 'Setting not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Setting not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get public settings (no authentication required)
   */
  async getPublicSettings(req, res) {
    try {
      const publicSettings = await settingsService.getPublicSettings();

      res.json({
        message: 'Public settings retrieved successfully',
        data: publicSettings
      });

    } catch (error) {
      console.error('Error getting public settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create new setting
   */
  async createSetting(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        key: Joi.string().max(255).required(),
        value: Joi.alternatives().try(
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array()
        ).allow(null),
        dataType: Joi.string().valid('string', 'number', 'boolean', 'json', 'array').default('string'),
        category: Joi.string().max(255).default('general'),
        description: Joi.string().allow(null),
        isPublic: Joi.boolean().default(false),
        isEditable: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newSetting = await settingsService.createSetting(value, req.user.id);

      res.status(201).json({
        message: 'Setting created successfully',
        data: newSetting
      });

    } catch (error) {
      console.error('Error creating setting:', error);
      
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'Setting key already exists' 
        });
      }
      
      if (error.message.includes('Invalid value')) {
        return res.status(400).json({ 
          error: 'Invalid value', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update setting
   */
  async updateSetting(req, res) {
    try {
      const { id } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        id: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ id: parseInt(id) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid setting ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        value: Joi.alternatives().try(
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array()
        ).allow(null),
        dataType: Joi.string().valid('string', 'number', 'boolean', 'json', 'array'),
        category: Joi.string().max(255),
        description: Joi.string().allow(null),
        isPublic: Joi.boolean(),
        isEditable: Joi.boolean()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedSetting = await settingsService.updateSetting(parseInt(id), value, req.user.id);

      res.json({
        message: 'Setting updated successfully',
        data: updatedSetting
      });

    } catch (error) {
      console.error('Error updating setting:', error);
      
      if (error.message === 'Setting not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Setting not found' 
        });
      }
      
      if (error.message === 'Setting is not editable') {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'Setting is not editable' 
        });
      }
      
      if (error.message.includes('Invalid value')) {
        return res.status(400).json({ 
          error: 'Invalid value', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update setting by key
   */
  async updateSettingByKey(req, res) {
    try {
      const { key } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        key: Joi.string().max(255).required()
      });

      const { error: paramError } = paramSchema.validate({ key });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid setting key', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        value: Joi.alternatives().try(
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array()
        ).allow(null).required()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedSetting = await settingsService.updateSettingByKey(key, value.value, req.user.id);

      res.json({
        message: 'Setting updated successfully',
        data: updatedSetting
      });

    } catch (error) {
      console.error('Error updating setting by key:', error);
      
      if (error.message === 'Setting not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Setting not found' 
        });
      }
      
      if (error.message === 'Setting is not editable') {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'Setting is not editable' 
        });
      }
      
      if (error.message.includes('Invalid value')) {
        return res.status(400).json({ 
          error: 'Invalid value', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete setting
   */
  async deleteSetting(req, res) {
    try {
      const { id } = req.params;

      // Validate parameters
      const schema = Joi.object({
        id: Joi.number().integer().required()
      });

      const { error } = schema.validate({ id: parseInt(id) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid setting ID', 
          details: error.details 
        });
      }

      const result = await settingsService.deleteSetting(parseInt(id), req.user.id);

      res.json({
        message: result.message,
        data: { success: result.success }
      });

    } catch (error) {
      console.error('Error deleting setting:', error);
      
      if (error.message === 'Setting not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Setting not found' 
        });
      }
      
      if (error.message === 'Setting is not deletable') {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'Setting is not deletable' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== UTILITY ENDPOINTS ====================

  /**
   * Get settings categories
   */
  async getCategories(req, res) {
    try {
      const categories = await settingsService.getCategories();

      res.json({
        message: 'Categories retrieved successfully',
        data: categories
      });

    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Bulk update settings
   */
  async bulkUpdateSettings(req, res) {
    try {
      // Validate request body
      const schema = Joi.object().pattern(
        Joi.string().max(255),
        Joi.alternatives().try(
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array()
        ).allow(null)
      );

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const results = await settingsService.bulkUpdateSettings(value, req.user.id);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      res.json({
        message: `Bulk update completed: ${successCount} successful, ${failureCount} failed`,
        data: {
          results,
          summary: {
            total: results.length,
            successful: successCount,
            failed: failureCount
          }
        }
      });

    } catch (error) {
      console.error('Error bulk updating settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new SettingsController();
