/**
 * Systems API utility functions
 * Handles all API calls related to systems management
 */

const API_BASE_URL = 'http://localhost:3001/api/v1/systems';

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
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
    const queryString = buildQueryString(params);
    const url = queryString ? `${API_BASE_URL}?${queryString}` : API_BASE_URL;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  /**
   * Get systems statistics
   */
  async getSystemsStats() {
    const response = await fetch(`${API_BASE_URL}/stats`);
    return handleResponse(response);
  },

  /**
   * Get system by ID
   */
  async getSystemById(id, include = '') {
    const url = include ? `${API_BASE_URL}/${id}?include=${include}` : `${API_BASE_URL}/${id}`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  /**
   * Get assets for a system
   */
  async getSystemAssets(id, params = {}) {
    const queryString = buildQueryString(params);
    const url = queryString 
      ? `${API_BASE_URL}/${id}/assets?${queryString}` 
      : `${API_BASE_URL}/${id}/assets`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  /**
   * Get vulnerabilities for a system
   */
  async getSystemVulnerabilities(id, params = {}) {
    const queryString = buildQueryString(params);
    const url = queryString 
      ? `${API_BASE_URL}/${id}/vulnerabilities?${queryString}` 
      : `${API_BASE_URL}/${id}/vulnerabilities`;
    
    const response = await fetch(url);
    return handleResponse(response);
  },

  /**
   * Get compliance status for a system
   */
  async getSystemCompliance(id) {
    const response = await fetch(`${API_BASE_URL}/${id}/compliance`);
    return handleResponse(response);
  },

  /**
   * Get analytics for a system
   */
  async getSystemAnalytics(id, timeRange = '30d') {
    const response = await fetch(`${API_BASE_URL}/${id}/analytics?timeRange=${timeRange}`);
    return handleResponse(response);
  },

  /**
   * Create new system
   */
  async createSystem(systemData) {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(systemData),
    });
    return handleResponse(response);
  },

  /**
   * Update system
   */
  async updateSystem(id, systemData) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(systemData),
    });
    return handleResponse(response);
  },

  /**
   * Delete system
   */
  async deleteSystem(id) {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  /**
   * Bulk operations on systems
   */
  async bulkOperations(operation, systemIds, data = {}) {
    const response = await fetch(`${API_BASE_URL}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        systemIds,
        data,
      }),
    });
    return handleResponse(response);
  },

  /**
   * Sync systems from external sources
   */
  async syncSystems(source = 'xacta', filters = {}) {
    const response = await fetch(`${API_BASE_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source,
        filters,
      }),
    });
    return handleResponse(response);
  },

  /**
   * Export systems data
   */
  async exportSystems(format = 'csv', filters = {}) {
    const queryString = buildQueryString({ format, ...filters });
    const url = queryString ? `${API_BASE_URL}/export?${queryString}` : `${API_BASE_URL}/export`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    
    // For file downloads, return the blob
    return response.blob();
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
