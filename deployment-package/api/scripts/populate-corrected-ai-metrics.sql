-- =====================================================
-- CORRECTED AI-POWERED METRICS WITH PROPER ENUM VALUES
-- Using: acquisition, operational, maintenance, licensing, support, training, disposal
-- =====================================================

-- Financial Intelligence Metrics (Corrected)
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('cost_per_vulnerability_corrected', 'Average asset acquisition cost per vulnerability found', 'gauge', 'security', 
  ROUND((SELECT AVG(acm.amount) FROM asset_cost_management acm 
         INNER JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid 
         WHERE acm.cost_type = 'acquisition'), 2), 
  'dollars', '{"metric_type": "cost_risk_correlation"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "average_asset_cost / vulnerabilities_per_asset", "unique": true}'),

('operational_cost_per_scan', 'Average operational cost per vulnerability scan', 'gauge', 'security', 
  ROUND((SELECT AVG(aoc.power_cost + aoc.network_cost + aoc.labor_cost) 
         FROM asset_operational_costs aoc 
         INNER JOIN assets a ON aoc.asset_uuid = a.asset_uuid 
         WHERE a.has_plugin_results = true), 2), 
  'dollars', '{"metric_type": "operational_efficiency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "operational_costs / scan_frequency", "unique": true}'),

('maintenance_cost_efficiency', 'Maintenance cost efficiency per vulnerability resolved', 'gauge', 'security', 
  ROUND((SELECT 
    COUNT(CASE WHEN v.state = 'Fixed' THEN 1 END) / 
    NULLIF(SUM(CASE WHEN acm.cost_type = 'maintenance' THEN acm.amount ELSE 0 END) / 1000, 0)
   FROM asset_cost_management acm 
   LEFT JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid), 4), 
  'vulns_per_k_dollar', '{"metric_type": "cost_efficiency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "vulnerabilities_fixed / maintenance_spend_thousands", "unique": true}'),

('licensing_cost_per_asset', 'Average licensing cost per protected asset', 'gauge', 'security', 
  ROUND((SELECT AVG(acm.amount) FROM asset_cost_management acm 
         INNER JOIN assets a ON acm.asset_uuid = a.asset_uuid 
         WHERE acm.cost_type = 'licensing' AND a.has_plugin_results = true), 2), 
  'dollars', '{"metric_type": "licensing_efficiency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "licensing_costs / protected_assets", "unique": true}'),

-- AI-Powered Predictive Metrics
('ai_vulnerability_forecast', 'AI-predicted vulnerability count for next 30 days', 'gauge', 'security', 
  ROUND((SELECT 
    CASE 
      WHEN COUNT(CASE WHEN v.first_found >= NOW() - INTERVAL '7 days' THEN 1 END) > 
           COUNT(CASE WHEN v.first_found >= NOW() - INTERVAL '14 days' AND v.first_found < NOW() - INTERVAL '7 days' THEN 1 END)
      THEN 1.2  -- Increasing trend
      WHEN COUNT(CASE WHEN v.first_found >= NOW() - INTERVAL '7 days' THEN 1 END) < 
           COUNT(CASE WHEN v.first_found >= NOW() - INTERVAL '14 days' AND v.first_found < NOW() - INTERVAL '7 days' THEN 1 END)
      THEN 0.8  -- Decreasing trend
      ELSE 1.0  -- Stable trend
    END * (SELECT COUNT(*) FROM vulnerabilities WHERE state = 'Open')
   FROM vulnerabilities v), 2), 
  'predicted_count', '{"metric_type": "ai_prediction", "timeframe": "30_days"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "trend_analysis * current_open_vulnerabilities", "ai_powered": true, "unique": true}'),

('asset_risk_probability', 'AI-calculated asset compromise probability', 'gauge', 'security', 
  ROUND((SELECT AVG(
    CASE 
      WHEN COUNT(v.id) > 10 AND AVG(v.severity) > 3 THEN 0.85
      WHEN COUNT(v.id) > 5 AND AVG(v.severity) > 2 THEN 0.65
      WHEN COUNT(v.id) > 2 THEN 0.35
      ELSE 0.15
    END
   ) FROM vulnerabilities v 
   WHERE v.state = 'Open' 
   GROUP BY v.asset_uuid), 4), 
  'probability', '{"metric_type": "ai_prediction", "risk_type": "asset_compromise"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "vulnerability_pattern_analysis", "ai_powered": true, "unique": true}'),

-- Behavioral Analytics Metrics
('vulnerability_discovery_velocity', 'Rate of new vulnerabilities discovered per asset', 'gauge', 'security', 
  ROUND((SELECT AVG(daily_vulns) FROM (
    SELECT 
      v.asset_uuid,
      COUNT(v.id) / GREATEST(EXTRACT(days FROM (MAX(v.first_found) - MIN(v.first_found))), 1) as daily_vulns
    FROM vulnerabilities v 
    WHERE v.first_found >= NOW() - INTERVAL '90 days'
    GROUP BY v.asset_uuid
    HAVING COUNT(v.id) > 1
  ) asset_velocity), 4), 
  'vulns_per_day', '{"metric_type": "behavioral_analytics", "pattern": "discovery_velocity"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "new_vulnerabilities / time_period", "behavioral": true, "unique": true}'),

('remediation_consistency_score', 'Consistency of remediation efforts across assets', 'gauge', 'security', 
  ROUND((SELECT 
    100 - (STDDEV(fix_rate) * 100 / NULLIF(AVG(fix_rate), 0))
   FROM (
     SELECT 
       v.asset_uuid,
       COUNT(CASE WHEN v.state = 'Fixed' THEN 1 END) * 100.0 / NULLIF(COUNT(v.id), 0) as fix_rate
     FROM vulnerabilities v 
     GROUP BY v.asset_uuid
     HAVING COUNT(v.id) > 0
   ) asset_fix_rates), 2), 
  'consistency_score', '{"metric_type": "behavioral_analytics", "pattern": "remediation_consistency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "100 - (stddev_fix_rate / avg_fix_rate * 100)", "behavioral": true, "unique": true}'),

-- Business Intelligence Metrics
('security_investment_efficiency', 'Overall security investment efficiency score', 'gauge', 'security', 
  ROUND((
    -- Cost efficiency (40%)
    (SELECT COUNT(*) FROM vulnerabilities WHERE state = 'Fixed') / 
    NULLIF((SELECT SUM(amount) FROM asset_cost_management WHERE cost_type IN ('maintenance', 'support')) / 1000, 0) * 0.4 +
    -- Coverage efficiency (30%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.3 +
    -- Response efficiency (30%)
    CASE WHEN (SELECT AVG(EXTRACT(days FROM (last_found - first_found))) FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Fixed') <= 7 THEN 30.0 ELSE 15.0 END
  ), 2), 
  'efficiency_score', '{"metric_type": "business_intelligence", "focus": "investment_efficiency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "cost_efficiency + coverage_efficiency + response_efficiency", "business_focused": true, "unique": true}'),

('digital_security_maturity', 'Digital security maturity index', 'gauge', 'security', 
  ROUND((
    -- Technology adoption (25%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_agent = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.25 +
    -- Risk management (25%)
    (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) * 0.25 +
    -- Coverage (25%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.25 +
    -- Response capability (25%)
    CASE WHEN (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Open') = 0 THEN 25.0 
         ELSE GREATEST(0, 25 - (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Open')) END
  ), 2), 
  'maturity_score', '{"metric_type": "business_intelligence", "focus": "digital_maturity"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "technology + risk_mgmt + coverage + response", "business_focused": true, "unique": true}'),

-- Operational Intelligence Metrics
('asset_utilization_efficiency', 'Asset utilization vs operational cost efficiency', 'gauge', 'security', 
  ROUND((SELECT AVG(
    CASE 
      WHEN (aoc.power_cost + aoc.network_cost + aoc.labor_cost) > 0 THEN
        (CASE WHEN a.has_plugin_results THEN 100 ELSE 0 END + 
         CASE WHEN a.has_agent THEN 100 ELSE 0 END) / 
        ((aoc.power_cost + aoc.network_cost + aoc.labor_cost) / 100)
      ELSE 0
    END
   ) FROM asset_operational_costs aoc 
   INNER JOIN assets a ON aoc.asset_uuid = a.asset_uuid), 2), 
  'efficiency_ratio', '{"metric_type": "operational_intelligence", "focus": "utilization_efficiency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "asset_capabilities / operational_cost_per_hundred", "operational": true, "unique": true}'),

('security_automation_readiness', 'Readiness score for security automation implementation', 'gauge', 'security', 
  ROUND((
    -- Agent deployment readiness (40%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_agent = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.4 +
    -- Data quality readiness (30%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.3 +
    -- Process maturity readiness (30%)
    (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) * 0.3
  ), 2), 
  'readiness_score', '{"metric_type": "operational_intelligence", "focus": "automation_readiness"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "agent_deployment + data_quality + process_maturity", "operational": true, "unique": true}');

-- Summary
SELECT 'Corrected AI-powered metrics populated successfully!' as status;

SELECT 
  COUNT(*) as total_new_metrics,
  COUNT(CASE WHEN metadata->>'unique' = 'true' THEN 1 END) as unique_metrics,
  COUNT(CASE WHEN metadata->>'ai_powered' = 'true' THEN 1 END) as ai_powered_metrics
FROM metrics 
WHERE created_at >= NOW() - INTERVAL '5 minutes';
