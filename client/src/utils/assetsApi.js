import { apiClient } from './apiClient';
import { cacheUtils } from './apiCache';

// Enhanced API request with automatic token refresh and cache management
const makeApiRequest = async (endpoint, options = {}) => {
  try {
    console.log(`🌐 Making API request to: ${endpoint}`);

    // Use apiClient which handles token refresh automatically
    const response = await apiClient.get(endpoint, options);

    console.log('✅ API request successful');
    return response;
  } catch (error) {
    console.error('❌ API request failed:', error);

    // Handle specific error cases
    if (error.message.includes('Session expired') || error.message.includes('token')) {
      console.log('🔄 Session expired, clearing cache and redirecting to login');
      cacheUtils.clear(); // Clear all cached data
      // The apiClient already handles logout and redirect
    }

    throw error;
  }
};

// Legacy support - keeping for backward compatibility
const getAuthToken = () => {
  const token = localStorage.getItem('accessToken');
  console.log('🔑 Getting auth token:', token ? 'Found' : 'Not found');
  return token;
};

const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    // Handle specific error cases
    if (response.status === 401) {
      console.log('🔄 Token expired, clearing cache');
      cacheUtils.clear();
      throw new Error('Invalid token');
    }

    throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const assetsApi = {
  // Get assets with pagination and filtering
  async getAssets(params = {}) {
    const queryParams = new URLSearchParams(params);
    const endpoint = `/assets?${queryParams}`;

    try {
      // Use enhanced API request with automatic token refresh
      const result = await makeApiRequest(endpoint);

      console.log('📊 Assets data received:', {
        count: result.data?.length || 0,
        pagination: result.pagination
      });

      // Transform the response to match frontend expectations
      return {
        success: true,
        data: {
          assets: result.data || [],
          pagination: result.pagination || {}
        }
      };
    } catch (error) {
      console.error('❌ Failed to fetch assets:', error);

      // If it's a session timeout, the apiClient already handled it
      if (error.message.includes('Session expired')) {
        throw error; // Re-throw to let calling component handle
      }

      // For other errors, provide a user-friendly message
      throw new Error(`Failed to load assets: ${error.message}`);
    }
  },

  // Get asset details by UUID
  async getAssetDetails(assetUuid) {
    const response = await fetch(`${API_BASE_URL}/assets/${assetUuid}`, {
      headers: createHeaders(),
    });
    const result = await handleResponse(response);

    // Transform to match expected structure
    return {
      success: true,
      data: result.data
    };
  },

  // Get asset network information
  async getAssetNetwork(assetUuid) {
    // For now, return the asset details which include network info
    const assetDetails = await this.getAssetDetails(assetUuid);

    // Transform to match expected network data structure
    return {
      success: true,
      data: [{
        isPrimary: true,
        ipv4Address: assetDetails.data?.ipv4Address,
        fqdn: assetDetails.data?.fqdn,
        macAddress: assetDetails.data?.macAddress,
        networkType: assetDetails.data?.networkType
      }]
    };
  },

  // Get asset vulnerabilities
  async getAssetVulnerabilities(assetUuid, params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/asset-management/assets/${assetUuid}/vulnerabilities-summary`, {
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
  },

  // Create new asset
  async createAsset(data) {
    try {
      console.log('🌐 Creating asset with data:', data);

      // Use enhanced API client with automatic token refresh
      const result = await apiClient.post('/assets', data);

      console.log('✅ Asset created successfully:', result);

      // Clear assets cache to force refresh
      cacheUtils.invalidateResource('assets');

      // Transform response to match expected structure
      return {
        success: true,
        data: result.data,
        message: result.message || 'Asset created successfully'
      };
    } catch (error) {
      console.error('❌ Failed to create asset:', error);

      // If it's a session timeout, the apiClient already handled it
      if (error.message.includes('Session expired')) {
        throw error;
      }

      // For other errors, provide a user-friendly message
      throw new Error(`Failed to create asset: ${error.message}`);
    }
  }
};
