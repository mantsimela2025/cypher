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

export const assetOperationalCostsApi = {
  // Get operational costs for a specific asset
  async getOperationalCosts(assetUuid, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (assetUuid) params.append('assetUuid', assetUuid);
      if (filters.yearFrom) params.append('yearFrom', filters.yearFrom);
      if (filters.yearTo) params.append('yearTo', filters.yearTo);
      if (filters.yearMonth) params.append('yearMonth', filters.yearMonth);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await fetch(`${API_BASE_URL}/asset-management/operational-costs?${params}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch operational costs');
    }
  },

  // Get operational cost by ID
  async getOperationalCostById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-management/operational-costs/${id}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch operational cost record');
    }
  },

  // Create new operational cost record
  async createOperationalCost(costData) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-management/operational-costs`, {
        method: 'POST',
        headers: createHeaders(),
        body: JSON.stringify(costData)
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to create operational cost record');
    }
  },

  // Update operational cost record
  async updateOperationalCost(id, costData) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-management/operational-costs/${id}`, {
        method: 'PUT',
        headers: createHeaders(),
        body: JSON.stringify(costData)
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to update operational cost record');
    }
  },

  // Delete operational cost record
  async deleteOperationalCost(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/asset-management/operational-costs/${id}`, {
        method: 'DELETE',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to delete operational cost record');
    }
  },

  // Get cost analytics for an asset
  async getCostAnalytics(assetUuid, period = '12months') {
    try {
      const params = new URLSearchParams();
      params.append('period', period);

      const response = await fetch(`${API_BASE_URL}/asset-management/analytics/operational-costs/${assetUuid}?${params}`, {
        method: 'GET',
        headers: createHeaders(),
      });
      return await handleResponse(response);
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch cost analytics');
    }
  },

  // Helper function to format currency
  formatCurrency(amount, currency = 'USD') {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(parseFloat(amount));
  },

  // Helper function to calculate total monthly cost
  calculateTotalCost(costRecord) {
    if (!costRecord) return 0;
    
    const costs = [
      costRecord.powerCost,
      costRecord.spaceCost,
      costRecord.networkCost,
      costRecord.storageCost,
      costRecord.laborCost,
      costRecord.otherCosts
    ];

    return costs.reduce((total, cost) => {
      return total + (parseFloat(cost) || 0);
    }, 0);
  },

  // Helper function to get cost breakdown
  getCostBreakdown(costRecord) {
    if (!costRecord) return [];

    return [
      { label: 'Power', value: parseFloat(costRecord.powerCost) || 0, color: 'warning' },
      { label: 'Space', value: parseFloat(costRecord.spaceCost) || 0, color: 'info' },
      { label: 'Network', value: parseFloat(costRecord.networkCost) || 0, color: 'primary' },
      { label: 'Storage', value: parseFloat(costRecord.storageCost) || 0, color: 'success' },
      { label: 'Labor', value: parseFloat(costRecord.laborCost) || 0, color: 'secondary' },
      { label: 'Other', value: parseFloat(costRecord.otherCosts) || 0, color: 'light' }
    ].filter(item => item.value > 0);
  },

  // Helper function to format date for API
  formatDateForApi(date) {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
  },

  // Helper function to get current month in API format
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  },

  // Helper function to get last N months for filtering
  getLastNMonths(n = 12) {
    const months = [];
    const now = new Date();
    
    for (let i = 0; i < n; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push({
        value: `${year}-${month}-01`,
        label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      });
    }
    
    return months;
  }
};
