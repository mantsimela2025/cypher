import { apiClient } from './apiClient';
import { log } from './config';

export const assetRiskMappingApi = {
  // Get risk mappings for a specific asset
  async getRiskMappings(assetUuid, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (assetUuid) params.append('assetUuid', assetUuid);
      if (filters.riskModelId) params.append('riskModelId', filters.riskModelId);
      if (filters.costCenterId) params.append('costCenterId', filters.costCenterId);
      if (filters.mappingMethod) params.append('mappingMethod', filters.mappingMethod);
      if (filters.minConfidence) params.append('minConfidence', filters.minConfidence);
      if (filters.verified !== undefined) params.append('verified', filters.verified);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const endpoint = params.toString() ? `/asset-management/risk-mapping?${params}` : '/asset-management/risk-mapping';
      log.api('Getting risk mappings for asset:', assetUuid, 'with filters:', filters);
      return await apiClient.get(endpoint);
    } catch (error) {
      log.error('Failed to fetch risk mappings:', error.message);
      throw error;
    }
  },

  // Get risk mapping by ID
  async getRiskMappingById(id) {
    try {
      log.api('Getting risk mapping by ID:', id);
      return await apiClient.get(`/asset-management/risk-mapping/${id}`);
    } catch (error) {
      log.error('Failed to fetch risk mapping record:', error.message);
      throw error;
    }
  },

  // Create new risk mapping record
  async createRiskMapping(mappingData) {
    try {
      log.api('Creating new risk mapping record');
      return await apiClient.post('/asset-management/risk-mapping', mappingData);
    } catch (error) {
      log.error('Failed to create risk mapping record:', error.message);
      throw error;
    }
  },

  // Update risk mapping record
  async updateRiskMapping(id, mappingData) {
    try {
      log.api('Updating risk mapping record:', id);
      return await apiClient.put(`/asset-management/risk-mapping/${id}`, mappingData);
    } catch (error) {
      log.error('Failed to update risk mapping record:', error.message);
      throw error;
    }
  },

  // Delete risk mapping record
  async deleteRiskMapping(id) {
    try {
      log.api('Deleting risk mapping record:', id);
      return await apiClient.delete(`/asset-management/risk-mapping/${id}`);
    } catch (error) {
      log.error('Failed to delete risk mapping record:', error.message);
      throw error;
    }
  },

  // Verify risk mapping
  async verifyRiskMapping(id, verificationData) {
    try {
      log.api('Verifying risk mapping:', id);
      return await apiClient.post(`/asset-management/risk-mapping/${id}/verify`, verificationData);
    } catch (error) {
      log.error('Failed to verify risk mapping:', error.message);
      throw error;
    }
  },

  // Get risk mapping analytics
  async getRiskAnalytics(assetUuid) {
    try {
      log.api('Getting risk analytics for asset:', assetUuid);
      return await apiClient.get(`/asset-management/analytics/risk-mapping/${assetUuid}`);
    } catch (error) {
      log.error('Failed to fetch risk analytics:', error.message);
      throw error;
    }
  },

  // Helper function to get confidence level badge color
  getConfidenceBadgeColor(confidence) {
    const conf = parseFloat(confidence);
    if (conf >= 0.9) return 'success';
    if (conf >= 0.8) return 'info';
    if (conf >= 0.7) return 'warning';
    return 'danger';
  },

  // Helper function to format confidence percentage
  formatConfidence(confidence) {
    if (!confidence) return '0%';
    return `${Math.round(parseFloat(confidence) * 100)}%`;
  },

  // Helper function to get mapping method badge color
  getMethodBadgeColor(method) {
    switch (method) {
      case 'manual': return 'primary';
      case 'automatic': return 'info';
      case 'hybrid': return 'warning';
      default: return 'secondary';
    }
  },

  // Helper function to format mapping method
  formatMappingMethod(method) {
    if (!method) return 'Unknown';
    return method.charAt(0).toUpperCase() + method.slice(1);
  },

  // Helper function to get verification status
  getVerificationStatus(mapping) {
    if (mapping.verifiedAt && mapping.verifiedBy) {
      return {
        status: 'verified',
        label: 'Verified',
        color: 'success',
        date: new Date(mapping.verifiedAt).toLocaleDateString()
      };
    }
    return {
      status: 'unverified',
      label: 'Unverified',
      color: 'warning',
      date: null
    };
  },

  // Helper function to parse mapping criteria
  parseMappingCriteria(criteria) {
    if (!criteria) return [];
    
    try {
      const parsed = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
      
      if (parsed.criteria && Array.isArray(parsed.criteria)) {
        return parsed.criteria.map((criterion, index) => ({
          name: criterion,
          score: parsed.scores?.[index] || 0,
          weight: parsed.weights?.[index] || 1
        }));
      }
      
      return [];
    } catch (error) {
      console.warn('Failed to parse mapping criteria:', error);
      return [];
    }
  },

  // Helper function to calculate weighted confidence score
  calculateWeightedConfidence(criteria) {
    if (!criteria || criteria.length === 0) return 0;
    
    const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 1), 0);
    const weightedSum = criteria.reduce((sum, c) => sum + (c.score * (c.weight || 1)), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  },

  // Helper function to get risk level based on model ID
  getRiskLevel(riskModelId) {
    if (!riskModelId) return { level: 'unknown', color: 'secondary' };
    
    // Based on the seeding script patterns
    if (riskModelId >= 101 && riskModelId <= 105) {
      return { level: 'high', color: 'danger' };
    } else if (riskModelId >= 201 && riskModelId <= 210) {
      return { level: 'medium', color: 'warning' };
    } else if (riskModelId >= 301 && riskModelId <= 315) {
      return { level: 'low', color: 'success' };
    } else {
      return { level: 'unknown', color: 'secondary' };
    }
  },

  // Helper function to get cost center name
  getCostCenterName(costCenterId) {
    if (!costCenterId) return 'Unknown';
    
    // Based on the seeding script patterns
    const costCenterMap = {
      1001: 'Infrastructure',
      1002: 'Security Operations',
      1003: 'Development',
      1004: 'Quality Assurance',
      1005: 'Production Support',
      1006: 'Network Operations',
      1007: 'Database Administration',
      1008: 'Business Intelligence',
      1009: 'Compliance',
      1010: 'General IT'
    };
    
    return costCenterMap[costCenterId] || `Cost Center ${costCenterId}`;
  },

  // Helper function to validate mapping data
  validateMappingData(data) {
    const errors = [];
    
    if (!data.assetUuid) {
      errors.push('Asset UUID is required');
    }
    
    if (data.mappingConfidence !== undefined) {
      const conf = parseFloat(data.mappingConfidence);
      if (isNaN(conf) || conf < 0 || conf > 1) {
        errors.push('Mapping confidence must be between 0 and 1');
      }
    }
    
    if (data.mappingMethod && !['automatic', 'manual', 'hybrid'].includes(data.mappingMethod)) {
      errors.push('Mapping method must be automatic, manual, or hybrid');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
