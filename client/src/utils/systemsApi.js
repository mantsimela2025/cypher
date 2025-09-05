/**
 * Systems API utility functions
 * Handles all API calls related to systems management
 */

import { apiClient } from './apiClient';
import { cacheUtils } from './apiCache';

// Enhanced API request with automatic token refresh and cache management
const makeApiRequest = async (endpoint, options = {}) => {
  try {
    console.log(`🌐 Making systems API request to: ${endpoint}`);

    // Use apiClient which handles token refresh automatically
    const response = await apiClient.get(endpoint, options);

    console.log('✅ Systems API request successful');
    return response;
  } catch (error) {
    console.error('❌ Systems API request failed:', error);

    // Handle specific error cases
    if (error.message.includes('Session expired') || error.message.includes('token')) {
      console.log('🔄 Session expired, clearing cache and redirecting to login');
      cacheUtils.clear(); // Clear all cached data
      // The apiClient already handles logout and redirect
    }

    throw error;
  }
};



// Helper function to build query string
const buildQueryString = (params) => {
  const filteredParams = Object.entries(params)
    .filter(([key, value]) => value !== null && value !== undefined && value !== '')
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  
  return new URLSearchParams(filteredParams).toString();
};

export const systemsApi = {
  /**
   * Get all systems with filtering and pagination
   */
  async getSystems(params = {}) {
    try {
      const queryString = buildQueryString(params);
      const endpoint = queryString ? `/systems?${queryString}` : '/systems';

      // Use enhanced API request with automatic token refresh
      const result = await makeApiRequest(endpoint);

      console.log('📊 Systems data received:', {
        count: result.data?.length || 0,
        pagination: result.pagination
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch systems:', error);

      // If it's a session timeout, the apiClient already handled it
      if (error.message.includes('Session expired')) {
        throw error;
      }

      // For other errors, provide a user-friendly message
      throw new Error(`Failed to load systems: ${error.message}`);
    }
  },

  /**
   * Get systems statistics
   */
  async getSystemsStats() {
    console.log('🌐 Getting systems statistics');
    return await apiClient.get('/systems/stats');
  },

  /**
   * Get system by ID
   */
  async getSystemById(id, include = '') {
    const endpoint = include ? `/systems/${id}?include=${include}` : `/systems/${id}`;
    console.log('🌐 Getting system by ID:', id);
    return await apiClient.get(endpoint);
  },

  /**
   * Get assets for a system
   */
  async getSystemAssets(id, params = {}) {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `/systems/${id}/assets?${queryString}`
      : `/systems/${id}/assets`;

    console.log('🌐 Getting assets for system:', id);
    return await apiClient.get(endpoint);
  },

  /**
   * Get vulnerabilities for a system
   */
  async getSystemVulnerabilities(id, params = {}) {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `/systems/${id}/vulnerabilities?${queryString}`
      : `/systems/${id}/vulnerabilities`;

    console.log('🌐 Getting vulnerabilities for system:', id);
    return await apiClient.get(endpoint);
  },

  /**
   * Get compliance status for a system
   */
  async getSystemCompliance(id) {
    console.log('🌐 Getting compliance for system:', id);
    return await apiClient.get(`/systems/${id}/compliance`);
  },

  /**
   * Get analytics for a system
   */
  async getSystemAnalytics(id, timeRange = '30d') {
    console.log('🌐 Getting analytics for system:', id, 'timeRange:', timeRange);
    return await apiClient.get(`/systems/${id}/analytics?timeRange=${timeRange}`);
  },

  /**
   * Create new system
   */
  async createSystem(systemData) {
    console.log('🌐 Creating new system');
    return await apiClient.post('/systems', systemData);
  },

  /**
   * Update system
   */
  async updateSystem(id, systemData) {
    console.log('🌐 Updating system:', id);
    return await apiClient.put(`/systems/${id}`, systemData);
  },

  /**
   * Delete system
   */
  async deleteSystem(id) {
    console.log('🌐 Deleting system:', id);
    return await apiClient.delete(`/systems/${id}`);
  },

  /**
   * Bulk operations on systems
   */
  async bulkOperations(operation, systemIds, data = {}) {
    console.log('🌐 Performing bulk operation:', operation, 'on', systemIds.length, 'systems');
    return await apiClient.post('/systems/bulk', {
      operation,
      systemIds,
      data,
    });
  },

  /**
   * Sync systems from external sources
   */
  async syncSystems(source = 'xacta', filters = {}) {
    console.log('🌐 Syncing systems from source:', source);
    return await apiClient.post('/systems/sync', {
      source,
      filters,
    });
  },

  /**
   * Export systems data
   */
  async exportSystems(format = 'csv', filters = {}) {
    const queryString = buildQueryString({ format, ...filters });
    const endpoint = queryString ? `/systems/export?${queryString}` : '/systems/export';

    console.log('🌐 Exporting systems data in format:', format);

    // For file downloads, we need to use a different approach with apiClient
    // This will need to be handled specially for blob responses
    try {
      const response = await apiClient.get(endpoint, { responseType: 'blob' });
      return response;
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Export failed: ${error.message}`);
    }
  },

  /**
   * Download exported file
   */
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};

export default systemsApi;
