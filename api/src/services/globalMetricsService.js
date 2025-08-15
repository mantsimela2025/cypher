const { client } = require('../db');
const { metrics } = require('../db/schema');
const { eq, and, isNotNull, inArray } = require('drizzle-orm');

/**
 * Global Metrics Service
 * Provides centralized access to metrics across the entire application
 * Supports dynamic query execution and real-time metric calculations
 */
class GlobalMetricsService {

  /**
   * Get metric by name with real-time calculation
   * @param {string} metricName - Name of the metric
   * @param {boolean} forceRefresh - Force recalculation even if recently calculated
   * @returns {Object} Metric with current value
   */
  async getMetricByName(metricName, forceRefresh = false) {
    try {
      console.log(`📊 Getting metric: ${metricName}`);

      // Get metric definition
      const metric = await client`
        SELECT * FROM metrics 
        WHERE name = ${metricName} AND is_active = true
        LIMIT 1
      `;

      if (metric.length === 0) {
        throw new Error(`Metric '${metricName}' not found`);
      }

      const metricData = metric[0];

      // Check if we need to refresh the value
      const shouldRefresh = forceRefresh || 
        !metricData.last_calculated || 
        this.isStale(metricData.last_calculated, metricData.aggregation_period);

      if (shouldRefresh && metricData.query) {
        const calculatedValue = await this.executeMetricQuery(metricData.query);
        
        // Update the metric value
        await client`
          UPDATE metrics 
          SET 
            value = ${calculatedValue},
            last_calculated = NOW(),
            updated_at = NOW()
          WHERE id = ${metricData.id}
        `;

        metricData.value = calculatedValue;
        metricData.last_calculated = new Date();
      }

      return metricData;
    } catch (error) {
      console.error(`Error getting metric ${metricName}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple metrics by names
   * @param {string[]} metricNames - Array of metric names
   * @param {boolean} forceRefresh - Force recalculation
   * @returns {Object} Object with metric names as keys and metric data as values
   */
  async getMetricsByNames(metricNames, forceRefresh = false) {
    try {
      console.log(`📊 Getting metrics: ${metricNames.join(', ')}`);

      const results = {};
      
      // Process metrics in parallel for better performance
      const promises = metricNames.map(async (name) => {
        try {
          const metric = await this.getMetricByName(name, forceRefresh);
          results[name] = metric;
        } catch (error) {
          console.warn(`Failed to get metric ${name}:`, error.message);
          results[name] = null;
        }
      });

      await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error getting multiple metrics:', error);
      throw error;
    }
  }

  /**
   * Get metrics by category with real-time values
   * @param {string} category - Metric category
   * @param {boolean} forceRefresh - Force recalculation
   * @returns {Array} Array of metrics with current values
   */
  async getMetricsByCategory(category, forceRefresh = false) {
    try {
      console.log(`📊 Getting metrics for category: ${category}`);

      // Get all metrics in category
      const metrics = await client`
        SELECT * FROM metrics 
        WHERE category = ${category} AND is_active = true
        ORDER BY name
      `;

      // Refresh values if needed
      for (const metric of metrics) {
        const shouldRefresh = forceRefresh || 
          !metric.last_calculated || 
          this.isStale(metric.last_calculated, metric.aggregation_period);

        if (shouldRefresh && metric.query) {
          try {
            const calculatedValue = await this.executeMetricQuery(metric.query);
            
            // Update the metric value
            await client`
              UPDATE metrics 
              SET 
                value = ${calculatedValue},
                last_calculated = NOW(),
                updated_at = NOW()
              WHERE id = ${metric.id}
            `;

            metric.value = calculatedValue;
            metric.last_calculated = new Date();
          } catch (error) {
            console.warn(`Failed to calculate metric ${metric.name}:`, error.message);
          }
        }
      }

      return metrics;
    } catch (error) {
      console.error(`Error getting metrics for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get vulnerability metrics specifically
   * @param {boolean} forceRefresh - Force recalculation
   * @returns {Object} Vulnerability metrics object
   */
  async getVulnerabilityMetrics(forceRefresh = false) {
    try {
      const vulnerabilityMetricNames = [
        'total_vulnerabilities',
        'critical_vulnerabilities', 
        'high_vulnerabilities',
        'medium_vulnerabilities',
        'low_vulnerabilities',
        'vulnerability_resolution_rate'
      ];

      const metrics = await this.getMetricsByNames(vulnerabilityMetricNames, forceRefresh);

      // Format for vulnerability dashboard
      return {
        total: metrics.total_vulnerabilities?.value || 0,
        critical: metrics.critical_vulnerabilities?.value || 0,
        high: metrics.high_vulnerabilities?.value || 0,
        medium: metrics.medium_vulnerabilities?.value || 0,
        low: metrics.low_vulnerabilities?.value || 0,
        resolutionRate: metrics.vulnerability_resolution_rate?.value || 0,
        lastCalculated: Math.max(
          ...Object.values(metrics)
            .filter(m => m?.last_calculated)
            .map(m => new Date(m.last_calculated).getTime())
        )
      };
    } catch (error) {
      console.error('Error getting vulnerability metrics:', error);
      throw error;
    }
  }

  /**
   * Execute a metric query and return the calculated value
   * @param {string} query - SQL query to execute
   * @returns {number} Calculated value
   */
  async executeMetricQuery(query) {
    try {
      console.log(`🔢 Executing metric query: ${query.substring(0, 100)}...`);

      const result = await client.unsafe(query);

      // Extract numeric value from result
      if (result.length > 0) {
        const firstRow = result[0];
        // Look for common column names that contain the value
        const value = firstRow.count || firstRow.value || firstRow.total ||
                     Object.values(firstRow).find(val => typeof val === 'number') || 0;

        return parseFloat(value) || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error executing metric query:', error);
      throw new Error(`Query execution failed: ${error.message}`);
    }
  }

  /**
   * Check if a metric value is stale based on aggregation period
   * @param {Date} lastCalculated - When the metric was last calculated
   * @param {string} aggregationPeriod - How often the metric should be refreshed
   * @returns {boolean} True if the metric is stale
   */
  isStale(lastCalculated, aggregationPeriod) {
    if (!lastCalculated) return true;

    const now = new Date();
    const lastCalc = new Date(lastCalculated);
    const diffMinutes = (now - lastCalc) / (1000 * 60);

    switch (aggregationPeriod) {
      case 'real_time':
        return diffMinutes > 1; // Refresh every minute
      case 'hourly':
        return diffMinutes > 60; // Refresh every hour
      case 'daily':
        return diffMinutes > (24 * 60); // Refresh every day
      case 'weekly':
        return diffMinutes > (7 * 24 * 60); // Refresh every week
      default:
        return diffMinutes > 5; // Default: refresh every 5 minutes
    }
  }

  /**
   * Refresh all metrics in a category
   * @param {string} category - Category to refresh
   * @returns {Object} Results of the refresh operation
   */
  async refreshMetricsByCategory(category) {
    try {
      console.log(`🔄 Refreshing all metrics in category: ${category}`);

      const metrics = await client`
        SELECT id, name, query FROM metrics
        WHERE category = ${category} AND is_active = true AND query IS NOT NULL
      `;

      const results = [];

      for (const metric of metrics) {
        try {
          const calculatedValue = await this.executeMetricQuery(metric.query);

          await client`
            UPDATE metrics
            SET
              value = ${calculatedValue},
              last_calculated = NOW(),
              updated_at = NOW()
            WHERE id = ${metric.id}
          `;

          results.push({
            id: metric.id,
            name: metric.name,
            success: true,
            value: calculatedValue
          });
        } catch (error) {
          results.push({
            id: metric.id,
            name: metric.name,
            success: false,
            error: error.message
          });
        }
      }

      return {
        category,
        totalMetrics: metrics.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error(`Error refreshing metrics for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics with real-time values
   * @param {string} dashboardType - Type of dashboard (vulnerability, system, etc.)
   * @param {boolean} forceRefresh - Force recalculation
   * @returns {Object} Dashboard metrics
   */
  async getDashboardMetrics(dashboardType, forceRefresh = false) {
    try {
      switch (dashboardType) {
        case 'vulnerability':
          return await this.getVulnerabilityMetrics(forceRefresh);

        case 'system':
          return await this.getSystemMetrics(forceRefresh);

        case 'asset':
          return await this.getAssetMetrics(forceRefresh);

        default:
          throw new Error(`Unknown dashboard type: ${dashboardType}`);
      }
    } catch (error) {
      console.error(`Error getting dashboard metrics for ${dashboardType}:`, error);
      throw error;
    }
  }

  /**
   * Get system metrics
   * @param {boolean} forceRefresh - Force recalculation
   * @returns {Object} System metrics
   */
  async getSystemMetrics(forceRefresh = false) {
    const systemMetricNames = [
      'total_systems',
      'active_systems',
      'systems_by_impact_high',
      'systems_by_impact_medium',
      'systems_by_impact_low'
    ];

    const metrics = await this.getMetricsByNames(systemMetricNames, forceRefresh);

    return {
      total: metrics.total_systems?.value || 0,
      active: metrics.active_systems?.value || 0,
      highImpact: metrics.systems_by_impact_high?.value || 0,
      mediumImpact: metrics.systems_by_impact_medium?.value || 0,
      lowImpact: metrics.systems_by_impact_low?.value || 0
    };
  }

  /**
   * Get asset metrics
   * @param {boolean} forceRefresh - Force recalculation
   * @returns {Object} Asset metrics
   */
  async getAssetMetrics(forceRefresh = false) {
    const assetMetricNames = [
      'total_assets',
      'assets_with_agent',
      'assets_without_agent',
      'assets_with_plugin_results'
    ];

    const metrics = await this.getMetricsByNames(assetMetricNames, forceRefresh);

    return {
      total: metrics.total_assets?.value || 0,
      withAgent: metrics.assets_with_agent?.value || 0,
      withoutAgent: metrics.assets_without_agent?.value || 0,
      scanned: metrics.assets_with_plugin_results?.value || 0
    };
  }
}

// Export singleton instance
module.exports = new GlobalMetricsService();
