const categoriesService = require('../services/categoriesService');
const Joi = require('joi');

class CategoriesController {

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create a new category
   */
  async createCategory(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255).trim(),
        description: Joi.string().allow('').max(1000).trim(),
        parentId: Joi.number().integer().allow(null),
        status: Joi.string().valid('active', 'inactive', 'draft').default('active'),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newCategory = await categoriesService.createCategory(value, req.user.id);

      res.status(201).json({
        message: 'Category created successfully',
        data: newCategory
      });

    } catch (error) {
      console.error('Error creating category:', error);
      
      if (error.message.includes('Parent category not found')) {
        return res.status(404).json({ 
          error: 'Parent not found', 
          message: error.message 
        });
      }
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: 'Duplicate name', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all categories with filtering and pagination
   */
  async getAllCategories(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        search: Joi.string().max(255),
        status: Joi.string().valid('active', 'inactive', 'draft'),
        parentId: Joi.number().integer().allow(null),
        hasParent: Joi.boolean(),
        createdBy: Joi.number().integer(),
        includeDocumentCount: Joi.boolean().default(true),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50),
        sortBy: Joi.string().valid('name', 'createdAt', 'updatedAt', 'status').default('name'),
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

      const result = await categoriesService.getAllCategories(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Categories retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get category by ID with full details
   */
  async getCategoryById(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        categoryId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ categoryId: parseInt(categoryId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid category ID', 
          details: error.details 
        });
      }

      const category = await categoriesService.getCategoryById(parseInt(categoryId));

      res.json({
        message: 'Category retrieved successfully',
        data: category
      });

    } catch (error) {
      console.error('Error getting category by ID:', error);
      
      if (error.message === 'Category not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Category not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update category
   */
  async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        categoryId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ categoryId: parseInt(categoryId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid category ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(255).trim(),
        description: Joi.string().allow('').max(1000).trim(),
        parentId: Joi.number().integer().allow(null),
        status: Joi.string().valid('active', 'inactive', 'draft'),
        metadata: Joi.object()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedCategory = await categoriesService.updateCategory(
        parseInt(categoryId), 
        value, 
        req.user.id
      );

      res.json({
        message: 'Category updated successfully',
        data: updatedCategory
      });

    } catch (error) {
      console.error('Error updating category:', error);
      
      if (error.message === 'Category not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Category not found' 
        });
      }
      
      if (error.message.includes('Parent category not found')) {
        return res.status(404).json({ 
          error: 'Parent not found', 
          message: error.message 
        });
      }
      
      if (error.message.includes('circular reference')) {
        return res.status(400).json({ 
          error: 'Invalid parent', 
          message: error.message 
        });
      }
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({ 
          error: 'Duplicate name', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        categoryId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ categoryId: parseInt(categoryId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid category ID', 
          details: error.details 
        });
      }

      const result = await categoriesService.deleteCategory(parseInt(categoryId), req.user.id);

      res.json({
        message: result.message,
        data: result
      });

    } catch (error) {
      console.error('Error deleting category:', error);
      
      if (error.message === 'Category not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Category not found' 
        });
      }
      
      if (error.message.includes('Cannot delete category')) {
        return res.status(409).json({ 
          error: 'Cannot delete', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== HIERARCHY OPERATIONS ====================

  /**
   * Get subcategories of a category
   */
  async getSubcategories(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        categoryId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ categoryId: parseInt(categoryId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid category ID', 
          details: error.details 
        });
      }

      const subcategories = await categoriesService.getSubcategories(parseInt(categoryId));

      res.json({
        message: 'Subcategories retrieved successfully',
        data: subcategories
      });

    } catch (error) {
      console.error('Error getting subcategories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get category hierarchy (tree structure)
   */
  async getCategoryHierarchy(req, res) {
    try {
      const hierarchy = await categoriesService.getCategoryHierarchy();

      res.json({
        message: 'Category hierarchy retrieved successfully',
        data: hierarchy
      });

    } catch (error) {
      console.error('Error getting category hierarchy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        categoryId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ categoryId: parseInt(categoryId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid category ID', 
          details: error.details 
        });
      }

      const path = await categoriesService.getCategoryPath(parseInt(categoryId));

      res.json({
        message: 'Category path retrieved successfully',
        data: path
      });

    } catch (error) {
      console.error('Error getting category path:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DOCUMENT OPERATIONS ====================

  /**
   * Get documents in a category
   */
  async getCategoryDocuments(req, res) {
    try {
      const { categoryId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        categoryId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ categoryId: parseInt(categoryId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid category ID', 
          details: paramError.details 
        });
      }

      // Validate query parameters
      const querySchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
      });

      const { error: queryError, value } = querySchema.validate(req.query);
      if (queryError) {
        return res.status(400).json({ 
          error: 'Invalid query parameters', 
          details: queryError.details 
        });
      }

      const result = await categoriesService.getCategoryDocuments(
        parseInt(categoryId), 
        { page: value.page, limit: value.limit }
      );

      res.json({
        message: 'Category documents retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting category documents:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== STATISTICS AND ANALYTICS ====================

  /**
   * Get category statistics
   */
  async getCategoryStatistics(req, res) {
    try {
      const statistics = await categoriesService.getCategoryStatistics();

      res.json({
        message: 'Category statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      console.error('Error getting category statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk delete categories
   */
  async bulkDeleteCategories(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        categoryIds: Joi.array().items(Joi.number().integer()).min(1).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each category deletion
      for (const categoryId of value.categoryIds) {
        try {
          const result = await categoriesService.deleteCategory(categoryId, req.user.id);
          results.successful.push({ id: categoryId, message: result.message });
        } catch (error) {
          results.failed.push({ id: categoryId, error: error.message });
        }
      }

      res.json({
        message: `Bulk delete completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
        data: results
      });

    } catch (error) {
      console.error('Error bulk deleting categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Bulk update category status
   */
  async bulkUpdateStatus(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        categoryIds: Joi.array().items(Joi.number().integer()).min(1).required(),
        status: Joi.string().valid('active', 'inactive', 'draft').required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each category update
      for (const categoryId of value.categoryIds) {
        try {
          const result = await categoriesService.updateCategory(
            categoryId, 
            { status: value.status }, 
            req.user.id
          );
          results.successful.push({ id: categoryId, data: result });
        } catch (error) {
          results.failed.push({ id: categoryId, error: error.message });
        }
      }

      res.json({
        message: `Bulk status update completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
        data: results
      });

    } catch (error) {
      console.error('Error bulk updating category status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new CategoriesController();