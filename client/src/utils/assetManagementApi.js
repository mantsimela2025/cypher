import { apiClient } from './apiClient';
import { log } from './config';

export const assetManagementApi = {
  // ==================== ASSET LIFECYCLE ====================
  
  /**
   * Create a new lifecycle record
   */
  createLifecycleRecord: async (data) => {
    log.api('Creating new lifecycle record');
    return await apiClient.post('/asset-management/lifecycle', data);
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

    const endpoint = params.toString() ? `/asset-management/lifecycle?${params.toString()}` : '/asset-management/lifecycle';
    log.api('Getting lifecycle records with filters:', filters);
    return await apiClient.get(endpoint);
  },

  /**
   * Get a specific lifecycle record by ID
   */
  getLifecycleRecordById: async (id) => {
    log.api('Getting lifecycle record by ID:', id);
    return await apiClient.get(`/asset-management/lifecycle/${id}`);
  },

  /**
   * Update a lifecycle record
   */
  updateLifecycleRecord: async (id, data) => {
    log.api('Updating lifecycle record:', id);
    return await apiClient.put(`/asset-management/lifecycle/${id}`, data);
  },

  /**
   * Delete a lifecycle record
   */
  deleteLifecycleRecord: async (id) => {
    log.api('Deleting lifecycle record:', id);
    return await apiClient.delete(`/asset-management/lifecycle/${id}`);
  },

  // ==================== ASSET COST MANAGEMENT ====================
  
  /**
   * Create a new cost record
   */
  createCostRecord: async (data) => {
    log.api('Creating new cost record');
    return await apiClient.post('/asset-management/costs', data);
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

    const endpoint = params.toString() ? `/asset-management/costs?${params.toString()}` : '/asset-management/costs';
    log.api('Getting cost records with filters:', filters);
    return await apiClient.get(endpoint);
  },

  /**
   * Get a specific cost record by ID
   */
  getCostRecordById: async (id) => {
    log.api('Getting cost record by ID:', id);
    return await apiClient.get(`/asset-management/costs/${id}`);
  },

  /**
   * Update a cost record
   */
  updateCostRecord: async (id, data) => {
    log.api('Updating cost record:', id);
    return await apiClient.put(`/asset-management/costs/${id}`, data);
  },

  /**
   * Delete a cost record
   */
  deleteCostRecord: async (id) => {
    log.api('Deleting cost record:', id);
    return await apiClient.delete(`/asset-management/costs/${id}`);
  },

  // ==================== OPERATIONAL COSTS ====================
  
  /**
   * Create a new operational cost record
   */
  createOperationalCost: async (data) => {
    log.api('Creating new operational cost record');
    return await apiClient.post('/asset-management/operational-costs', data);
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

    const endpoint = params.toString() ? `/asset-management/operational-costs?${params.toString()}` : '/asset-management/operational-costs';
    log.api('Getting operational costs with filters:', filters);
    return await apiClient.get(endpoint);
  },

  /**
   * Get a specific operational cost record by ID
   */
  getOperationalCostById: async (id) => {
    log.api('Getting operational cost by ID:', id);
    return await apiClient.get(`/asset-management/operational-costs/${id}`);
  },

  /**
   * Update an operational cost record
   */
  updateOperationalCost: async (id, data) => {
    log.api('Updating operational cost:', id);
    return await apiClient.put(`/asset-management/operational-costs/${id}`, data);
  },

  /**
   * Delete an operational cost record
   */
  deleteOperationalCost: async (id) => {
    log.api('Deleting operational cost:', id);
    return await apiClient.delete(`/asset-management/operational-costs/${id}`);
  },

  // ==================== RISK MAPPING ====================
  
  /**
   * Create a new risk mapping record
   */
  createRiskMapping: async (data) => {
    log.api('Creating new risk mapping record');
    return await apiClient.post('/asset-management/risk-mapping', data);
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

    const endpoint = params.toString() ? `/asset-management/risk-mapping?${params.toString()}` : '/asset-management/risk-mapping';
    log.api('Getting risk mappings with filters:', filters);
    return await apiClient.get(endpoint);
  },

  /**
   * Get a specific risk mapping record by ID
   */
  getRiskMappingById: async (id) => {
    log.api('Getting risk mapping by ID:', id);
    return await apiClient.get(`/asset-management/risk-mapping/${id}`);
  },

  /**
   * Update a risk mapping record
   */
  updateRiskMapping: async (id, data) => {
    log.api('Updating risk mapping:', id);
    return await apiClient.put(`/asset-management/risk-mapping/${id}`, data);
  },

  /**
   * Delete a risk mapping record
   */
  deleteRiskMapping: async (id) => {
    log.api('Deleting risk mapping:', id);
    return await apiClient.delete(`/asset-management/risk-mapping/${id}`);
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

    const endpoint = params.toString() ? `/asset-management/analytics/cost-analysis?${params.toString()}` : '/asset-management/analytics/cost-analysis';
    log.api('Getting cost analysis with filters:', filters);
    return await apiClient.get(endpoint);
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

    const endpoint = params.toString() ? `/asset-management/analytics/lifecycle-analysis?${params.toString()}` : '/asset-management/analytics/lifecycle-analysis';
    log.api('Getting lifecycle analysis with filters:', filters);
    return await apiClient.get(endpoint);
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

    const endpoint = params.toString() ? `/asset-management/analytics/roi-calculations?${params.toString()}` : '/asset-management/analytics/roi-calculations';
    log.api('Getting ROI calculations with filters:', filters);
    return await apiClient.get(endpoint);
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

    const endpoint = params.toString() ? `/asset-management/analytics/cost-optimization?${params.toString()}` : '/asset-management/analytics/cost-optimization';
    log.api('Getting cost optimization with filters:', filters);
    return await apiClient.get(endpoint);
  }
};
