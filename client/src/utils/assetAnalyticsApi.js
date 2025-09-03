/**
 * Asset Analytics API Utility
 * Following API Development Best Practices Guide patterns
 */

import { apiClient } from './apiClient';
import { cacheUtils } from './apiCache';

export const assetAnalyticsApi = {
  /**
   * Get analytics dashboard data
   * @param {Object} params - Query parameters
   * @param {string} params.costCenter - Filter by cost center
   * @param {string} params.timeRange - Time range (30d, 90d, 1y, 2y)
   * @param {boolean} params.includeForecasts - Include forecast data
   * @param {boolean} params.includeLifecycle - Include lifecycle data
   */
  async getDashboardData(params = {}) {
    try {
      console.log('🌐 Fetching asset analytics dashboard data...');
      
      // Use apiClient for automatic token refresh
      const endpoint = `/asset-analytics/dashboard?${new URLSearchParams(params)}`;
      const result = await apiClient.get(endpoint);
      
      console.log('✅ Dashboard data received:', result);
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      
      // Session timeout is handled by apiClient
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load dashboard data: ${error.message}`);
    }
  },

  /**
   * Get portfolio-wide analytics summary
   */
  async getPortfolioSummary() {
    try {
      console.log('🌐 Fetching portfolio summary...');
      
      const result = await apiClient.get('/asset-analytics/portfolio-summary');
      
      console.log('✅ Portfolio summary received:', result);
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Failed to fetch portfolio summary:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load portfolio summary: ${error.message}`);
    }
  },

  /**
   * Get asset ROI analysis
   * @param {string} assetUuid - Asset UUID
   * @param {Object} params - Analysis parameters
   */
  async getAssetROI(assetUuid, params = {}) {
    try {
      console.log(`🌐 Fetching ROI analysis for asset ${assetUuid}...`);
      
      const endpoint = `/asset-analytics/roi/${assetUuid}?${new URLSearchParams(params)}`;
      const result = await apiClient.get(endpoint);
      
      console.log('✅ ROI analysis received:', result);
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Failed to fetch ROI analysis:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load ROI analysis: ${error.message}`);
    }
  },

  /**
   * Get asset depreciation analysis
   * @param {string} assetUuid - Asset UUID
   * @param {Object} params - Analysis parameters
   */
  async getAssetDepreciation(assetUuid, params = {}) {
    try {
      console.log(`🌐 Fetching depreciation analysis for asset ${assetUuid}...`);
      
      const endpoint = `/asset-analytics/depreciation/${assetUuid}?${new URLSearchParams(params)}`;
      const result = await apiClient.get(endpoint);
      
      console.log('✅ Depreciation analysis received:', result);
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Failed to fetch depreciation analysis:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load depreciation analysis: ${error.message}`);
    }
  },

  /**
   * Get comprehensive financial analysis
   * @param {string} assetUuid - Asset UUID
   * @param {Object} params - Analysis parameters
   */
  async getFinancialAnalysis(assetUuid, params = {}) {
    try {
      console.log(`🌐 Fetching financial analysis for asset ${assetUuid}...`);
      
      const endpoint = `/asset-analytics/financial-analysis/${assetUuid}?${new URLSearchParams(params)}`;
      const result = await apiClient.get(endpoint);
      
      console.log('✅ Financial analysis received:', result);
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Failed to fetch financial analysis:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load financial analysis: ${error.message}`);
    }
  },

  /**
   * Get cost forecast for asset
   * @param {string} assetUuid - Asset UUID
   * @param {Object} params - Forecast parameters
   */
  async getCostForecast(assetUuid, params = {}) {
    try {
      console.log(`🌐 Fetching cost forecast for asset ${assetUuid}...`);
      
      const endpoint = `/asset-analytics/forecast/${assetUuid}?${new URLSearchParams(params)}`;
      const result = await apiClient.get(endpoint);
      
      console.log('✅ Cost forecast received:', result);
      return {
        success: true,
        data: result.data,
        message: result.message
      };
    } catch (error) {
      console.error('❌ Failed to fetch cost forecast:', error);
      
      if (error.message.includes('Session expired')) {
        throw error;
      }
      
      throw new Error(`Failed to load cost forecast: ${error.message}`);
    }
  },

  /**
   * Clear analytics cache
   * Use this after data modifications that affect analytics
   */
  clearCache() {
    console.log('🧹 Clearing asset analytics cache...');
    cacheUtils.invalidateResource('asset-analytics');
    cacheUtils.invalidateResource('dashboard');
    cacheUtils.invalidateResource('portfolio');
  },

  /**
   * Refresh dashboard data
   * Clears cache and refetches data
   */
  async refreshDashboard(params = {}) {
    try {
      console.log('🔄 Refreshing dashboard data...');
      
      // Clear cache first
      this.clearCache();
      
      // Fetch fresh data
      return await this.getDashboardData(params);
    } catch (error) {
      console.error('❌ Failed to refresh dashboard:', error);
      throw error;
    }
  }
};
