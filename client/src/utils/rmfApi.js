/**
 * RMF API Utility
 * Handles all RMF-related API calls
 */

import { apiClient } from './apiClient';

// Use the existing API client that already handles authentication
const rmfApiClient = {
  async get(endpoint) {
    const response = await apiClient.get(`/rmf${endpoint}`);
    return response;
  },

  async post(endpoint, data) {
    const response = await apiClient.post(`/rmf${endpoint}`, data);
    return response;
  },

  async put(endpoint, data) {
    const response = await apiClient.put(`/rmf${endpoint}`, data);
    return response;
  },

  async delete(endpoint) {
    const response = await apiClient.delete(`/rmf${endpoint}`);
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
      
      // Map frontend form data to backend API format
      const apiData = {
        title: projectData.name || projectData.title, // Backend expects 'title'
        description: projectData.description,
        environment: projectData.systemType || 'cloud', // Map systemType to environment
        sponsor_org: projectData.owner || null,
        target_authorization_date: projectData.dueDate || null,
        current_step: 'categorize',
        status: 'active'
      };
      
      const response = await rmfApiClient.post('/projects', apiData);

      console.log('✅ Project created successfully:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Failed to create RMF project:', error);
      throw new Error(error.response?.data?.message || 'Failed to create project');
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
