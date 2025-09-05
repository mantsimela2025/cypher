import { apiClient } from './apiClient';
import { log } from './config';

/**
 * Global Metrics API Client
 * Provides access to real-time metrics across the application
 */
export const globalMetricsApi = {
  
  /**
   * Get vulnerability metrics with real-time calculation
   * @param {boolean} forceRefresh - Force recalculation of metrics
   * @returns {Promise<Object>} Vulnerability metrics
   */
  async getVulnerabilityMetrics(forceRefresh = false) {
    const endpoint = forceRefresh ? '/global-metrics/vulnerability?forceRefresh=true' : '/global-metrics/vulnerability';
    log.api('Getting vulnerability metrics, forceRefresh:', forceRefresh);
    return await apiClient.get(endpoint);
  },

  /**
   * Get system metrics with real-time calculation
   * @param {boolean} forceRefresh - Force recalculation of metrics
   * @returns {Promise<Object>} System metrics
   */
  async getSystemMetrics(forceRefresh = false) {
    const endpoint = forceRefresh ? '/global-metrics/system?forceRefresh=true' : '/global-metrics/system';
    log.api('Getting system metrics, forceRefresh:', forceRefresh);
    return await apiClient.get(endpoint);
  },

  /**
   * Get asset metrics with real-time calculation
   * @param {boolean} forceRefresh - Force recalculation of metrics
   * @returns {Promise<Object>} Asset metrics
   */
  async getAssetMetrics(forceRefresh = false) {
    const endpoint = forceRefresh ? '/global-metrics/asset?forceRefresh=true' : '/global-metrics/asset';
    log.api('Getting asset metrics, forceRefresh:', forceRefresh);
    return await apiClient.get(endpoint);
  },

  /**
   * Get dashboard metrics by type
   * @param {string} dashboardType - Type of dashboard (vulnerability, system, asset)
   * @param {boolean} forceRefresh - Force recalculation of metrics
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics(dashboardType, forceRefresh = false) {
    const endpoint = forceRefresh ? `/global-metrics/dashboard/${dashboardType}?forceRefresh=true` : `/global-metrics/dashboard/${dashboardType}`;
    log.api('Getting dashboard metrics for type:', dashboardType, 'forceRefresh:', forceRefresh);
    return await apiClient.get(endpoint);
  },

  /**
   * Get a specific metric by name
   * @param {string} metricName - Name of the metric
   * @param {boolean} forceRefresh - Force recalculation of metric
   * @returns {Promise<Object>} Metric data
   */
  async getMetricByName(metricName, forceRefresh = false) {
    const endpoint = forceRefresh ? `/global-metrics/metric/${metricName}?forceRefresh=true` : `/global-metrics/metric/${metricName}`;
    log.api('Getting metric by name:', metricName, 'forceRefresh:', forceRefresh);
    return await apiClient.get(endpoint);
  },

  /**
   * Refresh all metrics in a category
   * @param {string} category - Metric category to refresh
   * @returns {Promise<Object>} Refresh results
   */
  async refreshMetricsByCategory(category) {
    log.api('Refreshing metrics for category:', category);
    return await apiClient.post(`/global-metrics/category/${category}/refresh`);
  },

  /**
   * Get multiple metrics by names (convenience method)
   * @param {string[]} metricNames - Array of metric names
   * @param {boolean} forceRefresh - Force recalculation of metrics
   * @returns {Promise<Object>} Object with metric names as keys
   */
  async getMetricsByNames(metricNames, forceRefresh = false) {
    const promises = metricNames.map(name => 
      this.getMetricByName(name, forceRefresh).catch(error => {
        log.warn(`Failed to get metric ${name}:`, error.message);
        return null;
      })
    );

    const results = await Promise.all(promises);
    
    const metricsObject = {};
    metricNames.forEach((name, index) => {
      metricsObject[name] = results[index]?.data || null;
    });

    return metricsObject;
  }
};

/**
 * React Hook for using global metrics
 * @param {string} metricType - Type of metrics to fetch (vulnerability, system, asset)
 * @param {boolean} autoRefresh - Whether to auto-refresh metrics
 * @param {number} refreshInterval - Refresh interval in milliseconds
 */
export const useGlobalMetrics = (metricType, autoRefresh = false, refreshInterval = 300000) => {
  const [metrics, setMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  const fetchMetrics = React.useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (metricType) {
        case 'vulnerability':
          response = await globalMetricsApi.getVulnerabilityMetrics(forceRefresh);
          break;
        case 'system':
          response = await globalMetricsApi.getSystemMetrics(forceRefresh);
          break;
        case 'asset':
          response = await globalMetricsApi.getAssetMetrics(forceRefresh);
          break;
        default:
          throw new Error(`Unknown metric type: ${metricType}`);
      }

      setMetrics(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${metricType} metrics:`, err);
    } finally {
      setLoading(false);
    }
  }, [metricType]);

  // Initial fetch
  React.useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Auto-refresh
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  const refresh = React.useCallback(() => {
    fetchMetrics(true);
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

/**
 * React Hook for using a specific metric by name
 * @param {string} metricName - Name of the metric
 * @param {boolean} autoRefresh - Whether to auto-refresh the metric
 * @param {number} refreshInterval - Refresh interval in milliseconds
 */
export const useMetric = (metricName, autoRefresh = false, refreshInterval = 300000) => {
  const [metric, setMetric] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [lastUpdated, setLastUpdated] = React.useState(null);

  const fetchMetric = React.useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await globalMetricsApi.getMetricByName(metricName, forceRefresh);
      setMetric(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching metric ${metricName}:`, err);
    } finally {
      setLoading(false);
    }
  }, [metricName]);

  // Initial fetch
  React.useEffect(() => {
    fetchMetric();
  }, [fetchMetric]);

  // Auto-refresh
  React.useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetric();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetric]);

  const refresh = React.useCallback(() => {
    fetchMetric(true);
  }, [fetchMetric]);

  return {
    metric,
    loading,
    error,
    lastUpdated,
    refresh
  };
};
