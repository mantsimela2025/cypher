const API_BASE_URL = 'http://localhost:3001/api/v1/asset-management';

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('accessToken');
  console.log('🔑 Token exists:', !!token);
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      console.log('🕒 Token expired:', isExpired);
      console.log('🕒 Token expires at:', new Date(payload.exp * 1000));
    } catch (e) {
      console.log('⚠️ Could not parse token');
    }
  }
  return token;
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

export const assetManagementApi = {
  // ==================== ASSET LIFECYCLE ====================
  
  /**
   * Create a new lifecycle record
   */
  createLifecycleRecord: async (data) => {
    const response = await fetch(`${API_BASE_URL}/lifecycle`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Get lifecycle records with optional filters
   */
  getLifecycleRecords: async (filters = {}) => {
    const params = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/lifecycle?${params.toString()}` : `${API_BASE_URL}/lifecycle`;
    console.log('🌐 Making lifecycle API call to:', url);
    console.log('🔑 Headers:', createHeaders());

    const response = await fetch(url, {
      headers: createHeaders(),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    return handleResponse(response);
  },

  /**
   * Get a specific lifecycle record by ID
   */
  getLifecycleRecordById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/lifecycle/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update a lifecycle record
   */
  updateLifecycleRecord: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/lifecycle/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Delete a lifecycle record
   */
  deleteLifecycleRecord: async (id) => {
    const response = await fetch(`${API_BASE_URL}/lifecycle/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // ==================== ASSET COST MANAGEMENT ====================
  
  /**
   * Create a new cost record
   */
  createCostRecord: async (data) => {
    const response = await fetch(`${API_BASE_URL}/costs`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Get cost records with optional filters
   */
  getCostRecords: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/costs?${params.toString()}` : `${API_BASE_URL}/costs`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get a specific cost record by ID
   */
  getCostRecordById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/costs/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update a cost record
   */
  updateCostRecord: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/costs/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Delete a cost record
   */
  deleteCostRecord: async (id) => {
    const response = await fetch(`${API_BASE_URL}/costs/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // ==================== OPERATIONAL COSTS ====================
  
  /**
   * Create a new operational cost record
   */
  createOperationalCost: async (data) => {
    const response = await fetch(`${API_BASE_URL}/operational-costs`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Get operational costs with optional filters
   */
  getOperationalCosts: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/operational-costs?${params.toString()}` : `${API_BASE_URL}/operational-costs`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get a specific operational cost record by ID
   */
  getOperationalCostById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/operational-costs/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update an operational cost record
   */
  updateOperationalCost: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/operational-costs/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Delete an operational cost record
   */
  deleteOperationalCost: async (id) => {
    const response = await fetch(`${API_BASE_URL}/operational-costs/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // ==================== RISK MAPPING ====================
  
  /**
   * Create a new risk mapping record
   */
  createRiskMapping: async (data) => {
    const response = await fetch(`${API_BASE_URL}/risk-mapping`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Get risk mappings with optional filters
   */
  getRiskMappings: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/risk-mapping?${params.toString()}` : `${API_BASE_URL}/risk-mapping`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get a specific risk mapping record by ID
   */
  getRiskMappingById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/risk-mapping/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update a risk mapping record
   */
  updateRiskMapping: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/risk-mapping/${id}`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Delete a risk mapping record
   */
  deleteRiskMapping: async (id) => {
    const response = await fetch(`${API_BASE_URL}/risk-mapping/${id}`, {
      method: 'DELETE',
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // ==================== ANALYTICS ====================
  
  /**
   * Get cost analysis data
   */
  getCostAnalysis: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/analytics/cost-analysis?${params.toString()}` : `${API_BASE_URL}/analytics/cost-analysis`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get lifecycle analysis data
   */
  getLifecycleAnalysis: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/analytics/lifecycle-analysis?${params.toString()}` : `${API_BASE_URL}/analytics/lifecycle-analysis`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get ROI calculations
   */
  getROICalculations: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/analytics/roi-calculations?${params.toString()}` : `${API_BASE_URL}/analytics/roi-calculations`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Get cost optimization recommendations
   */
  getCostOptimization: async (filters = {}) => {
    const params = new URLSearchParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    const url = params.toString() ? `${API_BASE_URL}/analytics/cost-optimization?${params.toString()}` : `${API_BASE_URL}/analytics/cost-optimization`;
    const response = await fetch(url, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  }
};

export default assetManagementApi;
