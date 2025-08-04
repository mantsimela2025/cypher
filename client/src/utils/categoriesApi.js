const API_BASE_URL = 'http://localhost:3001/api/v1';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

// Create headers with auth token
const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

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

      const response = await fetch(`${API_BASE_URL}/categories?${params}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },

  /**
   * Get category by ID
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch category');
    }
  },

  /**
   * Create new category
   */
  async create(categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(categoryData)
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to create category');
    }
  },

  /**
   * Update existing category
   */
  async update(id, categoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify(categoryData)
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update category');
    }
  },

  /**
   * Delete category
   */
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to delete category');
    }
  },

  /**
   * Get category hierarchy (categories with their children)
   */
  async getHierarchy() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/hierarchy`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch category hierarchy');
    }
  },

  /**
   * Get subcategories for a specific parent category
   */
  async getSubcategories(parentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${parentId}/subcategories`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch subcategories');
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

      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/documents?${params}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch category documents');
    }
  },

  /**
   * Move category to different parent
   */
  async moveCategory(categoryId, newParentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/move`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify({ parentId: newParentId })
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to move category');
    }
  },

  /**
   * Bulk operations on categories
   */
  async bulkOperation(operation, categoryIds, data = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/bulk`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify({
          operation,
          categoryIds,
          ...data
        })
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || `Failed to perform bulk ${operation}`);
    }
  },

  /**
   * Get category statistics
   */
  async getStatistics() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/statistics`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
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

      const response = await fetch(`${API_BASE_URL}/categories/search?${params}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to search categories');
    }
  }
};

export default categoriesApi;