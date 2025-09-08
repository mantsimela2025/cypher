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
import { log } from './config';

// Enhanced API client following CYPHER standards
const rmfApiClient = {
  async get(endpoint) {
    log.api(`🌐 RMF API GET: ${endpoint}`);
    const response = await apiClient.get(`/rmf${endpoint}`);
    log.api(`✅ RMF API Response:`, response);
    return response;
  },

  async post(endpoint, data) {
    log.api(`🌐 RMF API POST: ${endpoint}`, data);
    const response = await apiClient.post(`/rmf${endpoint}`, data);
    log.api(`✅ RMF API Response:`, response);
    return response;
  },

  async put(endpoint, data) {
    log.api(`🌐 RMF API PUT: ${endpoint}`, data);
    const response = await apiClient.put(`/rmf${endpoint}`, data);
    log.api(`✅ RMF API Response:`, response);
    return response;
  },

  async patch(endpoint, data) {
    log.api(`🌐 RMF API PATCH: ${endpoint}`, data);
    const response = await apiClient.patch(`/rmf${endpoint}`, data);
    log.api(`✅ RMF API Response:`, response);
    return response;
  },

  async delete(endpoint) {
    log.api(`🌐 RMF API DELETE: ${endpoint}`);
    const response = await apiClient.delete(`/rmf${endpoint}`);
    log.api(`✅ RMF API Response:`, response);
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
      log.api('🤖 Requesting AI control selection for:', systemData.name);

      const response = await rmfApiClient.post('/ai/control-selection', systemData);

      log.api('✅ AI control selection completed:', response);
      return response;

    } catch (error) {
      log.error('❌ AI control selection failed:', error);
      throw new Error(error.response?.data?.message || 'AI control selection failed');
    }
  },

  /**
   * Generate POA&M with AI
   */
  async generatePOAM(poamData) {
    try {
      log.api('🤖 RMF AI API - Generating POA&M for system:', poamData.systemName);
      const response = await rmfApiClient.post('/ai/generate-poam', poamData);
      log.api('✅ RMF AI API - POA&M generated with', response.data?.items?.length || 0, 'items');
      return response;
    } catch (error) {
      log.error('❌ RMF AI API - POA&M generation failed:', error.message);
      throw new Error(error.response?.data?.message || 'POA&M generation failed');
    }
  },

  /**
   * Test AI service
   */
  async testAI() {
    try {
      log.api('🤖 RMF AI API - Testing AI service');
      const response = await rmfApiClient.post('/ai/test', {});
      log.api('✅ RMF AI API - Test completed');
      return response;
    } catch (error) {
      log.error('❌ RMF AI API - Test failed:', error.message);
      throw new Error(error.response?.data?.message || 'AI test failed');
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

/**
 * RMF Steps API
 */
export const rmfStepsApi = {
  /**
   * Get steps for a project
   */
  async getProjectSteps(projectId) {
    try {
      log.api('🌐 RMF Steps API - Getting steps for project:', projectId);
      const response = await rmfApiClient.get(`/projects/${projectId}/steps`);
      log.api('✅ RMF Steps API - Steps retrieved:', response.data?.length || 0);
      return response;
    } catch (error) {
      log.error('❌ RMF Steps API - Get project steps failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch project steps');
    }
  },

  /**
   * Update step status
   */
  async updateStep(projectId, stepName, updateData) {
    try {
      log.api('🌐 RMF Steps API - Updating step:', stepName, 'for project:', projectId);
      const response = await rmfApiClient.patch(`/projects/${projectId}/steps/${stepName}`, updateData);
      log.api('✅ RMF Steps API - Step updated:', stepName);
      return response;
    } catch (error) {
      log.error('❌ RMF Steps API - Update step failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to update step');
    }
  },

  /**
   * Approve step
   */
  async approveStep(projectId, stepName, approvalData) {
    try {
      log.api('🌐 RMF Steps API - Approving step:', stepName, 'for project:', projectId);
      const response = await rmfApiClient.post(`/projects/${projectId}/steps/${stepName}/approve`, approvalData);
      log.api('✅ RMF Steps API - Step approved:', stepName);
      return response;
    } catch (error) {
      log.error('❌ RMF Steps API - Approve step failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to approve step');
    }
  }
};

/**
 * RMF Categorization API
 */
export const rmfCategorizationApi = {
  /**
   * Get system categorization
   */
  async getCategorization(projectId) {
    try {
      log.api('🌐 RMF Categorization API - Getting categorization for project:', projectId);
      const response = await rmfApiClient.get(`/projects/${projectId}/categorization`);
      log.api('✅ RMF Categorization API - Categorization retrieved');
      return response;
    } catch (error) {
      log.error('❌ RMF Categorization API - Get categorization failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to get categorization');
    }
  },

  /**
   * Set system categorization
   */
  async setCategorization(projectId, categorizationData) {
    try {
      log.api('🌐 RMF Categorization API - Setting categorization for project:', projectId);
      const response = await rmfApiClient.put(`/projects/${projectId}/categorization`, categorizationData);
      log.api('✅ RMF Categorization API - Categorization set');
      return response;
    } catch (error) {
      log.error('❌ RMF Categorization API - Set categorization failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to set categorization');
    }
  },

  /**
   * Get system information types
   */
  async getSystemInfoTypes(projectId) {
    try {
      log.api('🌐 RMF Categorization API - Getting info types for project:', projectId);
      const response = await rmfApiClient.get(`/projects/${projectId}/system-info-types`);
      log.api('✅ RMF Categorization API - Info types retrieved:', response.data?.length || 0);
      return response;
    } catch (error) {
      log.error('❌ RMF Categorization API - Get info types failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to get system info types');
    }
  },

  /**
   * Add system information type
   */
  async addSystemInfoType(projectId, infoTypeData) {
    try {
      log.api('🌐 RMF Categorization API - Adding info type to project:', projectId);
      const response = await rmfApiClient.post(`/projects/${projectId}/system-info-types`, infoTypeData);
      log.api('✅ RMF Categorization API - Info type added:', response.data?.id);
      return response;
    } catch (error) {
      log.error('❌ RMF Categorization API - Add info type failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to add system info type');
    }
  }
};

/**
 * RMF Control Selection API
 */
export const rmfControlSelectionApi = {
  /**
   * Get control selection for project
   */
  async getControlSelection(projectId) {
    try {
      log.api('🌐 RMF Control Selection API - Getting selection for project:', projectId);
      const response = await rmfApiClient.get(`/projects/${projectId}/control-selection`);
      log.api('✅ RMF Control Selection API - Selection retrieved');
      return response;
    } catch (error) {
      log.error('❌ RMF Control Selection API - Get selection failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to get control selection');
    }
  },

  /**
   * Set control selection for project
   */
  async setControlSelection(projectId, selectionData) {
    try {
      log.api('🌐 RMF Control Selection API - Setting selection for project:', projectId);
      const response = await rmfApiClient.put(`/projects/${projectId}/control-selection`, selectionData);
      log.api('✅ RMF Control Selection API - Selection set');
      return response;
    } catch (error) {
      log.error('❌ RMF Control Selection API - Set selection failed:', error.message);
      throw new Error(error.response?.data?.message || 'Failed to set control selection');
    }
  }
};

export default {
  projects: rmfProjectsApi,
  steps: rmfStepsApi,
  categorization: rmfCategorizationApi,
  controlSelection: rmfControlSelectionApi,
  ai: rmfAIApi
};
