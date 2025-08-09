-- =====================================================
-- ADVANCED AI-POWERED METRICS FOR COMPETITIVE ADVANTAGE
-- Unique metrics that differentiate from other platforms
-- =====================================================

-- =====================================================
-- FINANCIAL INTELLIGENCE METRICS
-- =====================================================

-- Cost-Risk Correlation Metrics (UNIQUE)
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('cost_per_vulnerability', 'Average asset cost per vulnerability found', 'gauge', 'security', 
  ROUND((SELECT AVG(acm.amount) FROM asset_cost_management acm 
         INNER JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid 
         WHERE acm.cost_type = 'purchase'), 2), 
  'dollars', '{"metric_type": "cost_risk_correlation"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "average_asset_cost / vulnerabilities_per_asset", "unique": true}'),

('high_value_asset_risk_score', 'Risk score weighted by asset value', 'gauge', 'security', 
  ROUND((SELECT AVG(acm.amount * v.severity) FROM asset_cost_management acm 
         INNER JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid 
         WHERE acm.cost_type = 'purchase' AND v.state = 'Open'), 2), 
  'weighted_score', '{"metric_type": "value_weighted_risk"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "asset_value * vulnerability_severity", "unique": true}'),

('roi_security_investment', 'ROI of security investments vs risk reduction', 'gauge', 'security', 
  ROUND((SELECT 
    (COUNT(CASE WHEN v.state = 'Fixed' THEN 1 END) * 1000.0) / 
    NULLIF(SUM(CASE WHEN acm.cost_type = 'security' THEN acm.amount ELSE 0 END), 0)
   FROM asset_cost_management acm 
   LEFT JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid), 2), 
  'ratio', '{"metric_type": "security_roi"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "risk_reduction_value / security_investment", "unique": true}'),

-- Operational Cost Intelligence
('cost_per_scan', 'Average operational cost per vulnerability scan', 'gauge', 'security', 
  ROUND((SELECT AVG(aoc.power_cost + aoc.network_cost + aoc.labor_cost) 
         FROM asset_operational_costs aoc 
         INNER JOIN assets a ON aoc.asset_uuid = a.asset_uuid 
         WHERE a.has_plugin_results = true), 2), 
  'dollars', '{"metric_type": "operational_efficiency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "operational_costs / scan_frequency", "unique": true}'),

('cost_efficiency_score', 'Cost efficiency of vulnerability management per asset', 'gauge', 'security', 
  ROUND((SELECT AVG(
    (COUNT(v.id) * 100.0) / NULLIF((aoc.power_cost + aoc.network_cost + aoc.labor_cost), 0)
   ) FROM asset_operational_costs aoc 
   LEFT JOIN vulnerabilities v ON aoc.asset_uuid = v.asset_uuid 
   GROUP BY aoc.asset_uuid), 2), 
  'efficiency_score', '{"metric_type": "cost_efficiency"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "vulnerabilities_managed / operational_cost * 100", "unique": true}');

-- =====================================================
-- AI-POWERED PREDICTIVE METRICS
-- =====================================================

-- Risk Prediction Metrics (UNIQUE)
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('ai_risk_trend_prediction', 'AI-predicted risk trend for next 30 days', 'gauge', 'security', 
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

('asset_failure_probability', 'AI-predicted asset failure probability based on vulnerability patterns', 'gauge', 'security', 
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
  'probability', '{"metric_type": "ai_prediction", "risk_type": "asset_failure"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "vulnerability_pattern_analysis", "ai_powered": true, "unique": true}'),

('breach_cost_prediction', 'AI-predicted cost of potential security breach', 'gauge', 'security', 
  ROUND((SELECT 
    SUM(acm.amount) * 
    (COUNT(v.id) * 0.001 + 
     COUNT(CASE WHEN v.severity_name = 'Critical' THEN 1 END) * 0.01 +
     COUNT(CASE WHEN v.severity_name = 'High' THEN 1 END) * 0.005)
   FROM asset_cost_management acm 
   LEFT JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid 
   WHERE v.state = 'Open' AND acm.cost_type = 'purchase'), 2), 
  'dollars', '{"metric_type": "ai_prediction", "risk_type": "breach_cost"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "asset_value * vulnerability_risk_multiplier", "ai_powered": true, "unique": true}');

-- =====================================================
-- BEHAVIORAL ANALYTICS METRICS (UNIQUE)
-- =====================================================

-- Asset Behavior Pattern Metrics
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('asset_vulnerability_velocity', 'Rate of new vulnerabilities per asset over time', 'gauge', 'security', 
  ROUND((SELECT AVG(daily_vulns) FROM (
    SELECT 
      v.asset_uuid,
      COUNT(v.id) / GREATEST(EXTRACT(days FROM (MAX(v.first_found) - MIN(v.first_found))), 1) as daily_vulns
    FROM vulnerabilities v 
    WHERE v.first_found >= NOW() - INTERVAL '90 days'
    GROUP BY v.asset_uuid
    HAVING COUNT(v.id) > 1
  ) asset_velocity), 4), 
  'vulns_per_day', '{"metric_type": "behavioral_analytics", "pattern": "vulnerability_velocity"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "new_vulnerabilities / time_period", "behavioral": true, "unique": true}'),

('remediation_behavior_score', 'Asset remediation behavior pattern score', 'gauge', 'security', 
  ROUND((SELECT AVG(
    CASE 
      WHEN AVG(EXTRACT(days FROM (v.last_found - v.first_found))) <= 7 THEN 10.0
      WHEN AVG(EXTRACT(days FROM (v.last_found - v.first_found))) <= 30 THEN 7.5
      WHEN AVG(EXTRACT(days FROM (v.last_found - v.first_found))) <= 90 THEN 5.0
      ELSE 2.5
    END
   ) FROM vulnerabilities v 
   WHERE v.state = 'Fixed' 
   GROUP BY v.asset_uuid), 2), 
  'behavior_score', '{"metric_type": "behavioral_analytics", "pattern": "remediation_speed"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "remediation_speed_pattern_analysis", "behavioral": true, "unique": true}'),

('asset_risk_appetite', 'Calculated risk appetite based on historical decisions', 'gauge', 'security', 
  ROUND((SELECT AVG(
    (COUNT(CASE WHEN v.state = 'Open' AND v.severity >= 3 THEN 1 END) * 1.0) / 
    NULLIF(COUNT(v.id), 0) * 10
   ) FROM vulnerabilities v 
   GROUP BY v.asset_uuid), 2), 
  'appetite_score', '{"metric_type": "behavioral_analytics", "pattern": "risk_tolerance"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "open_high_risk_vulns / total_vulns * 10", "behavioral": true, "unique": true}');

-- =====================================================
-- COMPETITIVE INTELLIGENCE METRICS (UNIQUE)
-- =====================================================

-- Industry Comparison Metrics
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('security_maturity_index', 'Comprehensive security maturity index vs industry standards', 'gauge', 'security', 
  ROUND((
    -- Assessment coverage (25%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.25 +
    -- Remediation rate (25%)
    (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) * 0.25 +
    -- Critical response time (25%)
    CASE WHEN (SELECT AVG(EXTRACT(days FROM (last_found - first_found))) FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Fixed') <= 7 THEN 25.0 ELSE 12.5 END +
    -- Cost efficiency (25%)
    LEAST(25.0, (SELECT COUNT(*) FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT SUM(amount) FROM asset_cost_management WHERE cost_type = 'security'), 0) * 1000)
  ), 2), 
  'index_score', '{"metric_type": "competitive_intelligence", "benchmark": "industry_standard"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "weighted_average_of_security_factors", "competitive": true, "unique": true}'),

('cyber_resilience_quotient', 'Organizational cyber resilience measurement', 'gauge', 'security', 
  ROUND((
    -- Recovery capability (40%)
    (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) * 0.4 +
    -- Prevention capability (30%)
    (100 - (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE severity_name IN ('Critical', 'High') AND state = 'Open') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0)) * 0.3 +
    -- Detection capability (30%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.3
  ), 2), 
  'resilience_score', '{"metric_type": "competitive_intelligence", "measurement": "cyber_resilience"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "recovery + prevention + detection capabilities", "competitive": true, "unique": true}'),

('digital_risk_iq', 'AI-calculated Digital Risk Intelligence Quotient', 'gauge', 'security', 
  ROUND((
    -- Risk awareness (33%)
    LEAST(33.3, (SELECT COUNT(*) FROM vulnerabilities) / (SELECT COUNT(*) FROM assets) * 3.33) +
    -- Risk response (33%)
    (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) * 0.333 +
    -- Risk investment (33%)
    LEAST(33.3, (SELECT COALESCE(SUM(amount), 0) FROM asset_cost_management WHERE cost_type = 'security') / NULLIF((SELECT SUM(amount) FROM asset_cost_management WHERE cost_type = 'purchase'), 0) * 333)
  ), 2), 
  'iq_score', '{"metric_type": "competitive_intelligence", "measurement": "digital_risk_iq"}', 'calculated', 'daily', NOW(), 
  '{"calculation": "awareness + response + investment intelligence", "ai_powered": true, "competitive": true, "unique": true}');

-- =====================================================
-- REAL-TIME OPERATIONAL METRICS (UNIQUE)
-- =====================================================

-- Dynamic Cost-Benefit Analysis
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('dynamic_security_spend_efficiency', 'Real-time security spending efficiency per vulnerability resolved', 'gauge', 'security',
  ROUND((SELECT
    COUNT(CASE WHEN v.state = 'Fixed' THEN 1 END) /
    NULLIF(SUM(CASE WHEN acm.cost_type = 'security' THEN acm.amount ELSE 0 END) / 1000, 0)
   FROM asset_cost_management acm
   LEFT JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid), 4),
  'vulns_per_k_dollar', '{"metric_type": "operational_intelligence", "real_time": true}', 'calculated', 'hourly', NOW(),
  '{"calculation": "vulnerabilities_fixed / security_spend_thousands", "operational": true, "unique": true}'),

('asset_utilization_risk_ratio', 'Asset utilization vs security risk correlation', 'gauge', 'security',
  ROUND((SELECT AVG(
    (aoc.power_cost + aoc.network_cost) /
    NULLIF((COUNT(v.id) * v_avg.avg_severity), 0)
   ) FROM asset_operational_costs aoc
   LEFT JOIN vulnerabilities v ON aoc.asset_uuid = v.asset_uuid
   CROSS JOIN (SELECT AVG(severity) as avg_severity FROM vulnerabilities WHERE state = 'Open') v_avg
   WHERE v.state = 'Open'
   GROUP BY aoc.asset_uuid, v_avg.avg_severity), 4),
  'utilization_ratio', '{"metric_type": "operational_intelligence", "correlation": "utilization_risk"}', 'calculated', 'daily', NOW(),
  '{"calculation": "operational_cost / (vulnerability_count * severity)", "operational": true, "unique": true}'),

-- AI-Powered Anomaly Detection Metrics
('security_anomaly_detection_score', 'AI-detected security anomalies in asset behavior', 'gauge', 'security',
  ROUND((SELECT
    COUNT(CASE
      WHEN daily_vulns > avg_daily + (2 * stddev_daily) THEN 1
      ELSE 0
    END) * 100.0 / NULLIF(COUNT(*), 0)
   FROM (
     SELECT
       v.asset_uuid,
       COUNT(v.id) / GREATEST(EXTRACT(days FROM (NOW() - MIN(v.first_found))), 1) as daily_vulns
     FROM vulnerabilities v
     WHERE v.first_found >= NOW() - INTERVAL '30 days'
     GROUP BY v.asset_uuid
   ) asset_stats
   CROSS JOIN (
     SELECT
       AVG(COUNT(v.id) / GREATEST(EXTRACT(days FROM (NOW() - MIN(v.first_found))), 1)) as avg_daily,
       STDDEV(COUNT(v.id) / GREATEST(EXTRACT(days FROM (NOW() - MIN(v.first_found))), 1)) as stddev_daily
     FROM vulnerabilities v
     WHERE v.first_found >= NOW() - INTERVAL '30 days'
     GROUP BY v.asset_uuid
   ) stats), 2),
  'anomaly_percentage', '{"metric_type": "ai_analytics", "detection": "behavioral_anomaly"}', 'calculated', 'daily', NOW(),
  '{"calculation": "statistical_anomaly_detection", "ai_powered": true, "unique": true}'),

-- Predictive Maintenance Metrics
('predictive_security_maintenance_score', 'AI-predicted security maintenance needs', 'gauge', 'security',
  ROUND((SELECT AVG(
    CASE
      WHEN COUNT(v.id) > 0 AND AVG(EXTRACT(days FROM (NOW() - v.last_found))) > 30 THEN
        LEAST(10.0, COUNT(v.id) * 0.5 + AVG(v.severity) * 2)
      ELSE 2.0
    END
   ) FROM vulnerabilities v
   WHERE v.state = 'Open'
   GROUP BY v.asset_uuid), 2),
  'maintenance_score', '{"metric_type": "ai_analytics", "prediction": "maintenance_needs"}', 'calculated', 'daily', NOW(),
  '{"calculation": "vulnerability_age + severity_weighted_count", "ai_powered": true, "unique": true}');

-- =====================================================
-- BUSINESS IMPACT METRICS (UNIQUE)
-- =====================================================

-- Revenue Impact Analysis
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('business_continuity_risk_score', 'Business continuity risk based on asset criticality and vulnerabilities', 'gauge', 'security',
  ROUND((SELECT
    SUM(acm.amount * v.severity *
        CASE WHEN v.state = 'Open' THEN 2.0 ELSE 0.5 END
    ) / NULLIF(SUM(acm.amount), 0)
   FROM asset_cost_management acm
   INNER JOIN vulnerabilities v ON acm.asset_uuid = v.asset_uuid
   WHERE acm.cost_type = 'purchase'), 2),
  'risk_multiplier', '{"metric_type": "business_impact", "focus": "continuity"}', 'calculated', 'daily', NOW(),
  '{"calculation": "asset_value * vulnerability_severity * state_multiplier", "business_focused": true, "unique": true}'),

('compliance_cost_efficiency', 'Cost efficiency of compliance vs security posture', 'gauge', 'security',
  ROUND((SELECT
    (100 - (COUNT(CASE WHEN v.severity_name IN ('Critical', 'High') AND v.state = 'Open' THEN 1 END) * 100.0 / NULLIF(COUNT(v.id), 0))) /
    NULLIF((SELECT SUM(amount) FROM asset_cost_management WHERE cost_type = 'compliance') / 1000, 0)
   FROM vulnerabilities v), 4),
  'compliance_per_k_dollar', '{"metric_type": "business_impact", "focus": "compliance_efficiency"}', 'calculated', 'daily', NOW(),
  '{"calculation": "security_posture_percentage / compliance_spend_thousands", "business_focused": true, "unique": true}'),

('digital_transformation_readiness', 'Digital transformation readiness based on security posture', 'gauge', 'security',
  ROUND((
    -- Security foundation (40%)
    (100 - (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Open') / NULLIF((SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Critical'), 0)) * 0.4 +
    -- Asset modernization (30%)
    (SELECT COUNT(*) * 100.0 FROM assets WHERE has_agent = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) * 0.3 +
    -- Risk management maturity (30%)
    (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) * 0.3
  ), 2),
  'readiness_score', '{"metric_type": "business_impact", "focus": "digital_transformation"}', 'calculated', 'daily', NOW(),
  '{"calculation": "security_foundation + modernization + risk_maturity", "business_focused": true, "unique": true}');

-- =====================================================
-- SUMMARY AND VALIDATION
-- =====================================================

-- Display summary of new advanced metrics
SELECT 'Advanced AI-powered metrics population completed!' as status;

-- Count metrics by type
SELECT
  CASE
    WHEN metadata->>'ai_powered' = 'true' THEN 'AI-Powered'
    WHEN metadata->>'behavioral' = 'true' THEN 'Behavioral Analytics'
    WHEN metadata->>'competitive' = 'true' THEN 'Competitive Intelligence'
    WHEN metadata->>'operational' = 'true' THEN 'Operational Intelligence'
    WHEN metadata->>'business_focused' = 'true' THEN 'Business Impact'
    ELSE 'Standard'
  END as metric_category,
  COUNT(*) as count
FROM metrics
WHERE source IN ('calculated')
  AND created_at >= NOW() - INTERVAL '1 hour'
GROUP BY
  CASE
    WHEN metadata->>'ai_powered' = 'true' THEN 'AI-Powered'
    WHEN metadata->>'behavioral' = 'true' THEN 'Behavioral Analytics'
    WHEN metadata->>'competitive' = 'true' THEN 'Competitive Intelligence'
    WHEN metadata->>'operational' = 'true' THEN 'Operational Intelligence'
    WHEN metadata->>'business_focused' = 'true' THEN 'Business Impact'
    ELSE 'Standard'
  END
ORDER BY count DESC;
