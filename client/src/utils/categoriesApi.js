import { apiClient } from './apiClient';
import { log } from './config';

export const categoriesApi = {
  /**
   * Get all categories with optional filtering
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      const endpoint = params.toString() ? `/categories?${params}` : '/categories';
      log.api('Getting all categories with filters:', filters);
      return await apiClient.get(endpoint);
    } catch (error) {
      log.error('Failed to fetch categories:', error.message);
      throw error;
    }
  },

  /**
   * Get category by ID
   */
  async getById(id) {
    try {
      log.api('Getting category by ID:', id);
      return await apiClient.get(`/categories/${id}`);
    } catch (error) {
      log.error('Failed to fetch category:', error.message);
      throw error;
    }
  },

  /**
   * Create new category
   */
  async create(categoryData) {
    try {
      log.api('Creating new category');
      return await apiClient.post('/categories', categoryData);
    } catch (error) {
      log.error('Failed to create category:', error.message);
      throw error;
    }
  },

  /**
   * Update existing category
   */
  async update(id, categoryData) {
    try {
      log.api('Updating category:', id);
      return await apiClient.put(`/categories/${id}`, categoryData);
    } catch (error) {
      log.error('Failed to update category:', error.message);
      throw error;
    }
  },

  /**
   * Delete category
   */
  async delete(id) {
    try {
      log.api('Deleting category:', id);
      return await apiClient.delete(`/categories/${id}`);
    } catch (error) {
      log.error('Failed to delete category:', error.message);
      throw error;
    }
  },

  /**
   * Get category hierarchy (categories with their children)
   */
  async getHierarchy() {
    try {
      log.api('Getting category hierarchy');
      return await apiClient.get('/categories/hierarchy');
    } catch (error) {
      log.error('Failed to fetch category hierarchy:', error.message);
      throw error;
    }
  },

  /**
   * Get subcategories for a specific parent category
   */
  async getSubcategories(parentId) {
    try {
      log.api('Getting subcategories for parent:', parentId);
      return await apiClient.get(`/categories/${parentId}/subcategories`);
    } catch (error) {
      log.error('Failed to fetch subcategories:', error.message);
      throw error;
    }
  },

  /**
   * Get documents in a specific category
   */
  async getCategoryDocuments(categoryId, filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      return await apiClient.get(`/categories/${categoryId}/documents?${params}`, {
        
        
      });
      
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch category documents');
    }
  },

  /**
   * Move category to different parent
   */
  async moveCategory(categoryId, newParentId) {
    try {
      return await apiClient.get(`/categories/${categoryId}/move`, {
        method: 'PUT',
        
        body: JSON.stringify({ parentId: newParentId })
      });
      
    } catch (error) {
      throw new Error(error.message || 'Failed to move category');
    }
  },

  /**
   * Bulk operations on categories
   */
  async bulkOperation(operation, categoryIds, data = {}) {
    try {
      return await apiClient.get(`/categories/bulk`, {
        method: 'POST',
        
        body: JSON.stringify({
          operation,
          categoryIds,
          ...data
        })
      });
      
    } catch (error) {
      throw new Error(error.message || `Failed to perform bulk ${operation}`);
    }
  },

  /**
   * Get category statistics
   */
  async getStatistics() {
    try {
      return await apiClient.get(`/categories/statistics`, {
        
        
      });
      
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch category statistics');
    }
  },

  /**
   * Search categories
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      return await apiClient.get(`/categories/search?${params}`, {
        
        
      });
      
    } catch (error) {
      throw new Error(error.message || 'Failed to search categories');
    }
  }
};

export default categoriesApi;