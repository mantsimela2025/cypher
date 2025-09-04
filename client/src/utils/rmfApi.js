/**
 * RMF API Utility
 * Handles all RMF-related API calls following CYPHER development standards
 *
 * Standards:
 * - Uses existing apiClient for automatic token refresh
 * - Consistent error handling and logging
 * - Proper data transformation
 * - Cache invalidation where appropriate
 */

import { apiClient } from './apiClient';

// Enhanced API client following CYPHER standards
const rmfApiClient = {
  async get(endpoint) {
    console.log(`🌐 RMF API GET: ${endpoint}`);
    const response = await apiClient.get(`/rmf${endpoint}`);
    console.log(`✅ RMF API Response:`, response);
    return response;
  },

  async post(endpoint, data) {
    console.log(`🌐 RMF API POST: ${endpoint}`, data);
    const response = await apiClient.post(`/rmf${endpoint}`, data);
    console.log(`✅ RMF API Response:`, response);
    return response;
  },

  async put(endpoint, data) {
    console.log(`🌐 RMF API PUT: ${endpoint}`, data);
    const response = await apiClient.put(`/rmf${endpoint}`, data);
    console.log(`✅ RMF API Response:`, response);
    return response;
  },

  async delete(endpoint) {
    console.log(`🌐 RMF API DELETE: ${endpoint}`);
    const response = await apiClient.delete(`/rmf${endpoint}`);
    console.log(`✅ RMF API Response:`, response);
    return response;
  }
};

/**
 * RMF Projects API
 */
export const rmfProjectsApi = {
  /**
   * Create a new RMF project
   */
  async createProject(projectData) {
    try {
      console.log('🚀 Creating RMF project:', projectData);

      // ✅ CYPHER Standard: Validate required fields
      if (!projectData.name || !projectData.description) {
        throw new Error('Project name and description are required');
      }

      // ✅ CYPHER Standard: Map frontend form data to backend API format
      const apiData = {
        title: projectData.name || projectData.title, // Backend expects 'title'
        description: projectData.description,
        environment: projectData.systemType || projectData.environment || 'cloud',
        sponsor_org: projectData.owner || projectData.sponsor_org || null,
        target_authorization_date: projectData.dueDate || projectData.target_authorization_date || null,
        current_step: 'categorize',
        status: 'active'
      };

      console.log('📤 Sending API data:', apiData);

      const response = await rmfApiClient.post('/projects', apiData);

      // ✅ CYPHER Standard: Validate response structure
      if (!response || !response.success) {
        throw new Error(response?.error || 'Invalid response from server');
      }

      console.log('✅ Project created successfully:', response);

      // ✅ CYPHER Standard: Return consistent response format
      return {
        success: true,
        data: response.data,
        message: response.message || 'Project created successfully'
      };

    } catch (error) {
      console.error('❌ Failed to create RMF project:', error);

      // ✅ CYPHER Standard: Enhanced error handling
      if (error.message.includes('Session expired')) {
        throw error; // Let apiClient handle session expiry
      }

      throw new Error(`Failed to create project: ${error.message}`);
    }
  },

  /**
   * Get all RMF projects
   */
  async getProjects(options = {}) {
    try {
      const params = {
        page: options.page || 1,
        limit: options.limit || 50,
        sortBy: options.sortBy || 'created_at',
        sortOrder: options.sortOrder || 'desc'
      };
      
      const response = await rmfApiClient.get(`/projects?${new URLSearchParams(params)}`);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to fetch RMF projects:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch projects');
    }
  },

  /**
   * Get a specific RMF project by ID
   */
  async getProject(projectId) {
    try {
      const response = await rmfApiClient.get(`/projects/${projectId}`);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to fetch RMF project:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch project');
    }
  },

  /**
   * Update an RMF project
   */
  async updateProject(projectId, updateData) {
    try {
      const response = await rmfApiClient.put(`/projects/${projectId}`, updateData);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to update RMF project:', error);
      throw new Error(error.response?.data?.message || 'Failed to update project');
    }
  },

  /**
   * Delete an RMF project
   */
  async deleteProject(projectId) {
    try {
      const response = await rmfApiClient.delete(`/projects/${projectId}`);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to delete RMF project:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete project');
    }
  }
};

/**
 * RMF AI API
 */
export const rmfAIApi = {
  /**
   * Get AI service health status
   */
  async healthCheck() {
    try {
      const response = await rmfApiClient.get('/ai/health');
      return response;
    } catch (error) {
      console.error('❌ AI health check failed:', error);
      throw new Error(error.response?.data?.message || 'AI health check failed');
    }
  },

  /**
   * Categorize a system using AI
   */
  async categorizeSystem(systemData) {
    try {
      console.log('🤖 Requesting AI categorization for:', systemData.name);
      
      const response = await rmfApiClient.post('/ai/categorize', systemData);

      console.log('✅ AI categorization completed:', response);
      return response;
      
    } catch (error) {
      console.error('❌ AI categorization failed:', error);
      throw new Error(error.response?.data?.message || 'AI categorization failed');
    }
  },

  /**
   * Get categorization history for a system
   */
  async getCategorizationHistory(systemId) {
    try {
      const response = await rmfApiClient.get(`/ai/categorization-history/${systemId}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch categorization history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch categorization history');
    }
  },

  /**
   * AI-powered security control selection
   */
  async selectSecurityControls(systemData) {
    try {
      console.log('🤖 Requesting AI control selection for:', systemData.name);

      const response = await rmfApiClient.post('/ai/select-controls', systemData);

      console.log('✅ AI control selection completed:', response);
      return response;

    } catch (error) {
      console.error('❌ AI control selection failed:', error);
      throw new Error(error.response?.data?.message || 'AI control selection failed');
    }
  },

  /**
   * Get AI usage statistics
   */
  async getAIStats(timeframe = '24h') {
    try {
      const response = await rmfApiClient.get(`/ai/stats?timeframe=${timeframe}`);
      return response;
    } catch (error) {
      console.error('❌ Failed to fetch AI stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch AI stats');
    }
  }
};

export default {
  projects: rmfProjectsApi,
  ai: rmfAIApi
};
