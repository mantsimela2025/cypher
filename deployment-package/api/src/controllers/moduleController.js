const moduleService = require('../services/moduleService');
const Joi = require('joi');

class ModuleController {

  // ==================== MODULE MANAGEMENT ====================

  /**
   * Create a new application module
   */
  async createModule(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(100).trim(),
        description: Joi.string().allow('').trim(),
        enabled: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newModule = await moduleService.createModule(value, req.user.id);

      res.status(201).json({
        message: 'Module created successfully',
        data: newModule
      });

    } catch (error) {
      console.error('Error creating module:', error);
      
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'Module with this name already exists' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all modules with filtering and pagination
   */
  async getAllModules(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        enabled: Joi.boolean(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('name', 'enabled', 'createdAt', 'updatedAt').default('name'),
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

      const result = await moduleService.getAllModules(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Modules retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting modules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get module by ID with full details
   */
  async getModuleById(req, res) {
    try {
      const { moduleId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        moduleId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ moduleId: parseInt(moduleId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid module ID', 
          details: error.details 
        });
      }

      const module = await moduleService.getModuleById(parseInt(moduleId));

      res.json({
        message: 'Module retrieved successfully',
        data: module
      });

    } catch (error) {
      console.error('Error getting module by ID:', error);
      
      if (error.message === 'Module not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Module not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update module
   */
  async updateModule(req, res) {
    try {
      const { moduleId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        moduleId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ moduleId: parseInt(moduleId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid module ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(100).trim(),
        description: Joi.string().allow('').trim(),
        enabled: Joi.boolean()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedModule = await moduleService.updateModule(parseInt(moduleId), value, req.user.id);

      res.json({
        message: 'Module updated successfully',
        data: updatedModule
      });

    } catch (error) {
      console.error('Error updating module:', error);
      
      if (error.message === 'Module not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Module not found' 
        });
      }
      
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'Module with this name already exists' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete module
   */
  async deleteModule(req, res) {
    try {
      const { moduleId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        moduleId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ moduleId: parseInt(moduleId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid module ID', 
          details: error.details 
        });
      }

      const result = await moduleService.deleteModule(parseInt(moduleId), req.user.id);

      res.json({
        message: result.message,
        data: result
      });

    } catch (error) {
      console.error('Error deleting module:', error);
      
      if (error.message === 'Module not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Module not found' 
        });
      }
      
      if (error.message.includes('other modules depend on it')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Toggle module enabled status
   */
  async toggleModuleStatus(req, res) {
    try {
      const { moduleId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        moduleId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ moduleId: parseInt(moduleId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid module ID', 
          details: error.details 
        });
      }

      const updatedModule = await moduleService.toggleModuleStatus(parseInt(moduleId), req.user.id);

      res.json({
        message: `Module ${updatedModule.enabled ? 'enabled' : 'disabled'} successfully`,
        data: updatedModule
      });

    } catch (error) {
      console.error('Error toggling module status:', error);
      
      if (error.message === 'Module not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Module not found' 
        });
      }
      
      if (error.message.includes('required dependencies are disabled')) {
        return res.status(409).json({ 
          error: 'Dependency conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== NAVIGATION MANAGEMENT ====================

  /**
   * Create navigation item
   */
  async createNavigation(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        moduleId: Joi.number().integer().required(),
        navLabel: Joi.string().required().max(100).trim(),
        navPath: Joi.string().required().max(255).trim(),
        navIcon: Joi.string().max(100).trim(),
        navOrder: Joi.number().integer().default(0),
        parentId: Joi.number().integer(),
        isVisible: Joi.boolean().default(true),
        requiresPermission: Joi.string().max(100).trim()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newNavigation = await moduleService.createNavigation(value, req.user.id);

      res.status(201).json({
        message: 'Navigation item created successfully',
        data: newNavigation
      });

    } catch (error) {
      console.error('Error creating navigation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get navigation for module
   */
  async getModuleNavigation(req, res) {
    try {
      const { moduleId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        moduleId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ moduleId: parseInt(moduleId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid module ID', 
          details: error.details 
        });
      }

      const navigation = await moduleService.getModuleNavigation(parseInt(moduleId));

      res.json({
        message: 'Module navigation retrieved successfully',
        data: navigation
      });

    } catch (error) {
      console.error('Error getting module navigation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get user's accessible navigation
   */
  async getUserNavigation(req, res) {
    try {
      const navigation = await moduleService.getUserNavigation(req.user.id);

      res.json({
        message: 'User navigation retrieved successfully',
        data: navigation
      });

    } catch (error) {
      console.error('Error getting user navigation:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'User not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== PERMISSION MANAGEMENT ====================

  /**
   * Set role permissions for module
   */
  async setRoleModulePermissions(req, res) {
    try {
      const { roleId, moduleId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        roleId: Joi.number().integer().required(),
        moduleId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({
        roleId: parseInt(roleId),
        moduleId: parseInt(moduleId)
      });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        canView: Joi.boolean().default(true),
        canCreate: Joi.boolean().default(false),
        canEdit: Joi.boolean().default(false),
        canDelete: Joi.boolean().default(false),
        canAdmin: Joi.boolean().default(false)
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const permissions = await moduleService.setRoleModulePermissions(
        parseInt(roleId),
        parseInt(moduleId),
        value,
        req.user.id
      );

      res.json({
        message: 'Role module permissions set successfully',
        data: permissions
      });

    } catch (error) {
      console.error('Error setting role module permissions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get role permissions for module
   */
  async getRoleModulePermissions(req, res) {
    try {
      const { roleId, moduleId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        roleId: Joi.number().integer().required(),
        moduleId: Joi.number().integer().required()
      });

      const { error } = schema.validate({
        roleId: parseInt(roleId),
        moduleId: parseInt(moduleId)
      });
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const permissions = await moduleService.getRoleModulePermissions(
        parseInt(roleId),
        parseInt(moduleId)
      );

      res.json({
        message: 'Role module permissions retrieved successfully',
        data: permissions
      });

    } catch (error) {
      console.error('Error getting role module permissions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Check user permission for module
   */
  async checkUserModulePermission(req, res) {
    try {
      const { moduleId, permission } = req.params;

      // Validate parameters
      const schema = Joi.object({
        moduleId: Joi.number().integer().required(),
        permission: Joi.string().valid('canView', 'canCreate', 'canEdit', 'canDelete', 'canAdmin').required()
      });

      const { error } = schema.validate({
        moduleId: parseInt(moduleId),
        permission
      });
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const hasPermission = await moduleService.checkUserModulePermission(
        req.user.id,
        parseInt(moduleId),
        permission
      );

      res.json({
        message: 'User module permission checked successfully',
        data: {
          userId: req.user.id,
          moduleId: parseInt(moduleId),
          permission,
          hasPermission
        }
      });

    } catch (error) {
      console.error('Error checking user module permission:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new ModuleController();
