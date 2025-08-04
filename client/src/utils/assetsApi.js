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
  return response.json();
};

export const assetsApi = {
  // Get assets with pagination and filtering
  async getAssets(params = {}) {
    const queryParams = new URLSearchParams(params);

    // Use the proper assets endpoint
    const url = `${API_BASE_URL}/integrations/tenable/assets?${queryParams}`;
    console.log('🌐 Making API call to:', url);

    const response = await fetch(url, {
      headers: createHeaders(),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    return handleResponse(response);
  },

  // Get asset details by UUID
  async getAssetDetails(assetUuid) {
    const response = await fetch(`${API_BASE_URL}/integrations/tenable/assets/${assetUuid}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get asset network information
  async getAssetNetwork(assetUuid) {
    const response = await fetch(`${API_BASE_URL}/integrations/tenable/assets/${assetUuid}/network`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get asset vulnerabilities
  async getAssetVulnerabilities(assetUuid, params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/integrations/tenable/assets/${assetUuid}/vulnerabilities?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Asset Management API calls
  async getAssetCosts(assetUuid, params = {}) {
    const queryParams = new URLSearchParams({ assetUuid, ...params });
    const response = await fetch(`${API_BASE_URL}/asset-management/costs?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  async getAssetLifecycle(assetUuid, params = {}) {
    const queryParams = new URLSearchParams({ assetUuid, ...params });
    const response = await fetch(`${API_BASE_URL}/asset-management/lifecycle?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  async getAssetOperationalCosts(assetUuid, params = {}) {
    const queryParams = new URLSearchParams({ assetUuid, ...params });
    const response = await fetch(`${API_BASE_URL}/asset-management/operational-costs?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  async getAssetRiskMapping(assetUuid, params = {}) {
    const queryParams = new URLSearchParams({ assetUuid, ...params });
    const response = await fetch(`${API_BASE_URL}/asset-management/risk-mappings?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Create new cost record
  async createCostRecord(data) {
    const response = await fetch(`${API_BASE_URL}/asset-management/costs`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Create new lifecycle record
  async createLifecycleRecord(data) {
    const response = await fetch(`${API_BASE_URL}/asset-management/lifecycle`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Update cost record
  async updateCostRecord(id, data) {
    const response = await fetch(`${API_BASE_URL}/asset-management/costs/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Delete cost record
  async deleteCostRecord(id) {
    const response = await fetch(`${API_BASE_URL}/asset-management/costs/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get cost analytics for an asset
  async getCostAnalytics(assetUuid, dateRange = {}) {
    const queryParams = new URLSearchParams(dateRange);
    const response = await fetch(`${API_BASE_URL}/asset-management/analytics/costs/${assetUuid}?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  }
};
