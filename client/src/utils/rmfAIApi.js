/**
 * RMF AI API Utilities
 * Frontend API layer for AI-powered RMF operations
 * Following CYPHER API best practices
 */

import { apiClient } from './apiClient';
import { cacheUtils } from './apiCache';

export const rmfAIApi = {
  /**
   * AI-powered system categorization
   * @param {Object} systemData - System information for categorization
   * @returns {Promise<Object>} Categorization results
   */
  async categorizeSystem(systemData) {
    try {
      console.log('🤖 Starting AI system categorization...');
      
      // ✅ Use apiClient for automatic token refresh (following best practices)
      const result = await apiClient.post('/rmf/ai/categorize', systemData);
      
      console.log('✅ AI categorization completed:', result);
      
      // Clear related cache after successful categorization
      if (systemData.systemId) {
        cacheUtils.invalidateResource(`rmf-systems-${systemData.systemId}`);
        cacheUtils.invalidateResource('rmf-projects');
      }
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'System categorization completed successfully'
      };
    } catch (error) {
      console.error('❌ Failed to categorize system:', error);
      
      // ✅ Session timeout is handled by apiClient (following best practices)
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to categorize system: ${error.message}`);
    }
  },

  /**
   * Get categorization history for a system
   * @param {number} systemId - System ID
   * @returns {Promise<Object>} Categorization history
   */
  async getCategorizationHistory(systemId) {
    try {
      console.log(`🔍 Fetching categorization history for system ${systemId}...`);
      
      const result = await apiClient.get(`/rmf/ai/categorization-history/${systemId}`);
      
      console.log('✅ Categorization history retrieved:', result);
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'Categorization history retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Failed to get categorization history:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load categorization history: ${error.message}`);
    }
  },

  /**
   * Check AI service health
   * @returns {Promise<Object>} Health status
   */
  async checkAIHealth() {
    try {
      console.log('🏥 Checking AI service health...');
      
      const result = await apiClient.get('/rmf/ai/health');
      
      console.log('✅ AI health check completed:', result);
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'AI health check completed'
      };
    } catch (error) {
      console.error('❌ AI health check failed:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`AI health check failed: ${error.message}`);
    }
  },

  /**
   * Get AI service statistics
   * @param {string} timeframe - Time period for stats (1 hour, 24 hours, 7 days, 30 days)
   * @returns {Promise<Object>} AI statistics
   */
  async getAIStats(timeframe = '24 hours') {
    try {
      console.log(`📊 Fetching AI stats for ${timeframe}...`);
      
      const params = new URLSearchParams({ timeframe });
      const result = await apiClient.get(`/rmf/ai/stats?${params}`);
      
      console.log('✅ AI stats retrieved:', result);
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'AI statistics retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Failed to get AI stats:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load AI statistics: ${error.message}`);
    }
  },

  /**
   * Test AI service with sample data
   * @returns {Promise<Object>} Test results
   */
  async testAI() {
    try {
      console.log('🧪 Running AI service test...');
      
      const result = await apiClient.post('/rmf/ai/test', {});
      
      console.log('✅ AI test completed:', result);
      
      return {
        success: true,
        data: result.data,
        message: result.message || 'AI test completed successfully'
      };
    } catch (error) {
      console.error('❌ AI test failed:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`AI test failed: ${error.message}`);
    }
  },

  /**
   * Validate system data before sending to AI
   * @param {Object} systemData - System data to validate
   * @returns {Object} Validation result
   */
  validateSystemData(systemData) {
    const errors = [];
    
    if (!systemData.name || systemData.name.trim().length < 2) {
      errors.push('System name is required and must be at least 2 characters');
    }
    
    if (!systemData.description || systemData.description.trim().length < 10) {
      errors.push('System description is required and must be at least 10 characters');
    }
    
    if (systemData.dataTypes && !Array.isArray(systemData.dataTypes)) {
      errors.push('Data types must be an array');
    }
    
    if (systemData.businessProcesses && !Array.isArray(systemData.businessProcesses)) {
      errors.push('Business processes must be an array');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Format categorization result for display
   * @param {Object} categorization - Raw categorization result
   * @returns {Object} Formatted result
   */
  formatCategorizationResult(categorization) {
    if (!categorization) return null;
    
    return {
      ...categorization,
      impactLevels: {
        confidentiality: {
          level: categorization.confidentiality,
          color: this.getImpactColor(categorization.confidentiality),
          description: this.getImpactDescription('confidentiality', categorization.confidentiality)
        },
        integrity: {
          level: categorization.integrity,
          color: this.getImpactColor(categorization.integrity),
          description: this.getImpactDescription('integrity', categorization.integrity)
        },
        availability: {
          level: categorization.availability,
          color: this.getImpactColor(categorization.availability),
          description: this.getImpactDescription('availability', categorization.availability)
        }
      },
      overallImpact: {
        level: categorization.overall,
        color: this.getImpactColor(categorization.overall),
        description: `Overall system impact level: ${categorization.overall}`
      }
    };
  },

  /**
   * Get color for impact level
   * @param {string} level - Impact level (LOW, MODERATE, HIGH)
   * @returns {string} Color class
   */
  getImpactColor(level) {
    switch (level?.toUpperCase()) {
      case 'LOW': return 'success';
      case 'MODERATE': return 'warning';
      case 'HIGH': return 'danger';
      default: return 'secondary';
    }
  },

  /**
   * Get description for impact level
   * @param {string} category - Impact category
   * @param {string} level - Impact level
   * @returns {string} Description
   */
  getImpactDescription(category, level) {
    const descriptions = {
      confidentiality: {
        LOW: 'Limited adverse effect if information is disclosed',
        MODERATE: 'Serious adverse effect if information is disclosed',
        HIGH: 'Severe or catastrophic effect if information is disclosed'
      },
      integrity: {
        LOW: 'Limited adverse effect if information is modified',
        MODERATE: 'Serious adverse effect if information is modified',
        HIGH: 'Severe or catastrophic effect if information is modified'
      },
      availability: {
        LOW: 'Limited adverse effect if information is unavailable',
        MODERATE: 'Serious adverse effect if information is unavailable',
        HIGH: 'Severe or catastrophic effect if information is unavailable'
      }
    };
    
    return descriptions[category]?.[level?.toUpperCase()] || 'Impact level description not available';
  }
};
