const { client } = require('../db');

class SystemMetricsController {

  /**
   * Get all system, asset, and vulnerability metrics
   */
  async getAllMetrics(req, res) {
    try {
      const { category, type, source } = req.query;
      
      let whereConditions = ['is_active = true'];
      let params = [];

      if (category) {
        whereConditions.push(`category = $${params.length + 1}`);
        params.push(category);
      }

      if (type) {
        whereConditions.push(`type = $${params.length + 1}`);
        params.push(type);
      }

      if (source) {
        whereConditions.push(`source = $${params.length + 1}`);
        params.push(source);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const query = `
        SELECT 
          id, name, description, type, category, value, unit, 
          labels, threshold, source, aggregation_period, 
          last_calculated, metadata, created_at, updated_at
        FROM metrics 
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN name LIKE '%system%' THEN 1
            WHEN name LIKE '%asset%' THEN 2
            WHEN name LIKE '%vulnerabilit%' THEN 3
            WHEN name LIKE '%patch%' THEN 4
            ELSE 5
          END,
          name
      `;

      const metrics = await client.unsafe(query, params);

      res.json({
        success: true,
        data: metrics,
        total: metrics.length
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching metrics',
        error: error.message
      });
    }
  }

  /**
   * Get metrics grouped by category
   */
  async getMetricsByCategory(req, res) {
    try {
      const metrics = await client`
        SELECT 
          id, name, description, type, category, value, unit, 
          labels, threshold, source, aggregation_period, 
          last_calculated, metadata
        FROM metrics 
        WHERE is_active = true
        ORDER BY name
      `;

      const grouped = {
        systems: [],
        assets: [],
        vulnerabilities: [],
        patches: [],
        risk_scores: [],
        maturity: []
      };

      metrics.forEach(metric => {
        if (metric.name.includes('system')) {
          grouped.systems.push(metric);
        } else if (metric.name.includes('asset')) {
          grouped.assets.push(metric);
        } else if (metric.name.includes('vulnerabilit') || metric.name.includes('critical_open') || 
                   metric.name.includes('high_open') || metric.name.includes('cvss')) {
          grouped.vulnerabilities.push(metric);
        } else if (metric.name.includes('patch')) {
          grouped.patches.push(metric);
        } else if (metric.name.includes('cyber_exposure') || metric.name.includes('exposure_score')) {
          grouped.risk_scores.push(metric);
        } else if (metric.name.includes('maturity') || metric.name.includes('grade') || 
                   metric.name.includes('remediation_rate')) {
          grouped.maturity.push(metric);
        }
      });

      res.json({
        success: true,
        data: grouped,
        summary: {
          total_metrics: metrics.length,
          systems: grouped.systems.length,
          assets: grouped.assets.length,
          vulnerabilities: grouped.vulnerabilities.length,
          patches: grouped.patches.length,
          risk_scores: grouped.risk_scores.length,
          maturity: grouped.maturity.length
        }
      });

    } catch (error) {
      console.error('Error grouping metrics by category:', error);
      res.status(500).json({
        success: false,
        message: 'Error grouping metrics by category',
        error: error.message
      });
    }
  }

  /**
   * Get dashboard summary metrics
   */
  async getDashboardSummary(req, res) {
    try {
      const keyMetrics = await client`
        SELECT name, value, unit, description, last_calculated
        FROM metrics 
        WHERE name IN (
          'total_systems',
          'total_assets', 
          'total_vulnerabilities_new',
          'vulnerabilities_critical_new',
          'vulnerabilities_open_new',
          'vulnerabilities_fixed_new',
          'critical_open_vulnerabilities_new',
          'high_open_vulnerabilities_new',
          'cyber_exposure_score',
          'asset_coverage_percentage',
          'agent_deployment_percentage',
          'assessment_maturity_grade',
          'remediation_maturity_grade',
          'avg_cvss_score',
          'remediation_rate_30_days'
        )
        AND is_active = true
        ORDER BY name
      `;

      const summary = {};
      keyMetrics.forEach(metric => {
        summary[metric.name] = {
          value: parseFloat(metric.value),
          unit: metric.unit,
          description: metric.description,
          last_calculated: metric.last_calculated
        };
      });

      // Calculate additional insights
      const totalVulns = summary.total_vulnerabilities_new?.value || 0;
      const criticalVulns = summary.vulnerabilities_critical_new?.value || 0;
      const openVulns = summary.vulnerabilities_open_new?.value || 0;
      const fixedVulns = summary.vulnerabilities_fixed_new?.value || 0;

      const insights = {
        critical_risk_percentage: totalVulns > 0 ? ((criticalVulns / totalVulns) * 100).toFixed(1) : 0,
        overall_remediation_rate: totalVulns > 0 ? ((fixedVulns / totalVulns) * 100).toFixed(1) : 0,
        open_vulnerability_percentage: totalVulns > 0 ? ((openVulns / totalVulns) * 100).toFixed(1) : 0,
        risk_level: summary.cyber_exposure_score?.value > 700 ? 'HIGH' : 
                   summary.cyber_exposure_score?.value > 400 ? 'MEDIUM' : 'LOW'
      };

      res.json({
        success: true,
        data: {
          metrics: summary,
          insights,
          last_updated: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard summary',
        error: error.message
      });
    }
  }

  /**
   * Update all metrics (recalculate values)
   */
  async updateAllMetrics(req, res) {
    try {
      console.log('🔄 Starting metrics update...');
      
      // Update system metrics
      await this.updateSystemMetrics();
      
      // Update asset metrics  
      await this.updateAssetMetrics();
      
      // Update vulnerability metrics
      await this.updateVulnerabilityMetrics();
      
      // Update patch metrics
      await this.updatePatchMetrics();
      
      // Update risk and maturity metrics
      await this.updateRiskMetrics();
      
      console.log('✅ All metrics updated successfully');
      
      res.json({
        success: true,
        message: 'All metrics updated successfully',
        updated_at: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error updating metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating metrics',
        error: error.message
      });
    }
  }

  /**
   * Update system metrics
   */
  async updateSystemMetrics() {
    const updates = [
      {
        name: 'total_systems',
        value: await client`SELECT COUNT(*) as count FROM systems`.then(r => r[0].count)
      },
      {
        name: 'systems_by_status_active',
        value: await client`SELECT COUNT(*) as count FROM systems WHERE status = 'Active'`.then(r => r[0].count)
      },
      {
        name: 'systems_with_assets',
        value: await client`
          SELECT COUNT(DISTINCT s.id) as count FROM systems s 
          INNER JOIN assets a ON s.system_id = a.system_id
        `.then(r => r[0].count)
      }
    ];

    for (const update of updates) {
      await client`
        UPDATE metrics 
        SET value = ${update.value}, last_calculated = NOW(), updated_at = NOW()
        WHERE name = ${update.name}
      `;
    }
  }

  /**
   * Update asset metrics
   */
  async updateAssetMetrics() {
    const updates = [
      {
        name: 'total_assets',
        value: await client`SELECT COUNT(*) as count FROM assets`.then(r => r[0].count)
      },
      {
        name: 'assets_with_agent',
        value: await client`SELECT COUNT(*) as count FROM assets WHERE has_agent = true`.then(r => r[0].count)
      },
      {
        name: 'assets_with_plugin_results',
        value: await client`SELECT COUNT(*) as count FROM assets WHERE has_plugin_results = true`.then(r => r[0].count)
      }
    ];

    for (const update of updates) {
      await client`
        UPDATE metrics 
        SET value = ${update.value}, last_calculated = NOW(), updated_at = NOW()
        WHERE name = ${update.name}
      `;
    }

    // Update calculated percentages
    const totalAssets = await client`SELECT COUNT(*) as count FROM assets`.then(r => r[0].count);
    const assetsWithAgent = await client`SELECT COUNT(*) as count FROM assets WHERE has_agent = true`.then(r => r[0].count);
    const assetsWithResults = await client`SELECT COUNT(*) as count FROM assets WHERE has_plugin_results = true`.then(r => r[0].count);

    if (totalAssets > 0) {
      await client`
        UPDATE metrics 
        SET value = ${Math.round((assetsWithAgent / totalAssets) * 100 * 100) / 100}, last_calculated = NOW(), updated_at = NOW()
        WHERE name = 'agent_deployment_percentage'
      `;

      await client`
        UPDATE metrics 
        SET value = ${Math.round((assetsWithResults / totalAssets) * 100 * 100) / 100}, last_calculated = NOW(), updated_at = NOW()
        WHERE name = 'asset_coverage_percentage'
      `;
    }
  }

  /**
   * Update vulnerability metrics
   */
  async updateVulnerabilityMetrics() {
    const updates = [
      {
        name: 'total_vulnerabilities_new',
        value: await client`SELECT COUNT(*) as count FROM vulnerabilities`.then(r => r[0].count)
      },
      {
        name: 'vulnerabilities_critical_new',
        value: await client`SELECT COUNT(*) as count FROM vulnerabilities WHERE severity_name = 'Critical'`.then(r => r[0].count)
      },
      {
        name: 'vulnerabilities_open_new',
        value: await client`SELECT COUNT(*) as count FROM vulnerabilities WHERE state = 'Open'`.then(r => r[0].count)
      },
      {
        name: 'vulnerabilities_fixed_new',
        value: await client`SELECT COUNT(*) as count FROM vulnerabilities WHERE state = 'Fixed'`.then(r => r[0].count)
      },
      {
        name: 'critical_open_vulnerabilities_new',
        value: await client`SELECT COUNT(*) as count FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Open'`.then(r => r[0].count)
      }
    ];

    for (const update of updates) {
      await client`
        UPDATE metrics 
        SET value = ${update.value}, last_calculated = NOW(), updated_at = NOW()
        WHERE name = ${update.name}
      `;
    }
  }

  /**
   * Update patch metrics
   */
  async updatePatchMetrics() {
    const updates = [
      {
        name: 'total_patches',
        value: await client`SELECT COUNT(*) as count FROM patches`.then(r => r[0].count)
      },
      {
        name: 'patches_critical',
        value: await client`SELECT COUNT(*) as count FROM patches WHERE severity = 'Critical'`.then(r => r[0].count)
      }
    ];

    for (const update of updates) {
      await client`
        UPDATE metrics 
        SET value = ${update.value}, last_calculated = NOW(), updated_at = NOW()
        WHERE name = ${update.name}
      `;
    }
  }

  /**
   * Update risk and maturity metrics
   */
  async updateRiskMetrics() {
    // Update Cyber Exposure Score
    const criticalOpen = await client`SELECT COUNT(*) as count FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Open'`.then(r => r[0].count);
    const highOpen = await client`SELECT COUNT(*) as count FROM vulnerabilities WHERE severity_name = 'High' AND state = 'Open'`.then(r => r[0].count);
    const mediumOpen = await client`SELECT COUNT(*) as count FROM vulnerabilities WHERE severity_name = 'Medium' AND state = 'Open'`.then(r => r[0].count);
    
    const cesScore = Math.min(1000, criticalOpen * 10 + highOpen * 5 + mediumOpen * 2);
    
    await client`
      UPDATE metrics 
      SET value = ${cesScore}, last_calculated = NOW(), updated_at = NOW()
      WHERE name = 'cyber_exposure_score'
    `;
  }

  /**
   * Get specific metric by name
   */
  async getMetricByName(req, res) {
    try {
      const { name } = req.params;
      
      const metric = await client`
        SELECT * FROM metrics WHERE name = ${name} AND is_active = true
      `;

      if (metric.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Metric not found'
        });
      }

      res.json({
        success: true,
        data: metric[0]
      });

    } catch (error) {
      console.error('Error fetching metric by name:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching metric',
        error: error.message
      });
    }
  }
}

module.exports = new SystemMetricsController();
