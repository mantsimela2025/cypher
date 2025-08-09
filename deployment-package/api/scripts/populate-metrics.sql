-- =====================================================
-- Comprehensive Metrics Population Script
-- Based on Tenable's metrics and cybersecurity best practices
-- =====================================================

-- Clear existing metrics (optional - uncomment if needed)
-- DELETE FROM metrics;

-- =====================================================
-- SYSTEM METRICS
-- =====================================================

-- System Count Metrics
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('total_systems', 'Total number of systems in inventory', 'count', 'systems', (SELECT COUNT(*) FROM systems), 'systems', '{"scope": "all"}', 'database', 'daily', NOW(), '{"table": "systems", "query_type": "count"}'),

('systems_by_impact_high', 'Number of high impact systems', 'count', 'systems', (SELECT COUNT(*) FROM systems WHERE impact_level = 'High'), 'systems', '{"impact_level": "High"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "impact_level=High"}'),

('systems_by_impact_moderate', 'Number of moderate impact systems', 'count', 'systems', (SELECT COUNT(*) FROM systems WHERE impact_level = 'Moderate'), 'systems', '{"impact_level": "Moderate"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "impact_level=Moderate"}'),

('systems_by_impact_low', 'Number of low impact systems', 'count', 'systems', (SELECT COUNT(*) FROM systems WHERE impact_level = 'Low'), 'systems', '{"impact_level": "Low"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "impact_level=Low"}'),

-- System Authorization Status
('systems_authorized', 'Number of authorized systems', 'count', 'systems', (SELECT COUNT(*) FROM systems WHERE authorization_status = 'Authorized'), 'systems', '{"authorization_status": "Authorized"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "authorization_status=Authorized"}'),

('systems_pending_authorization', 'Number of systems pending authorization', 'count', 'systems', (SELECT COUNT(*) FROM systems WHERE authorization_status = 'Pending'), 'systems', '{"authorization_status": "Pending"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "authorization_status=Pending"}'),

-- System Health Metrics
('systems_compliance_percentage', 'Percentage of systems in compliance', 'percentage', 'systems', 
  ROUND((SELECT COUNT(*) * 100.0 FROM systems WHERE authorization_status = 'Authorized') / NULLIF((SELECT COUNT(*) FROM systems), 0), 2), 
  'percent', '{"metric_type": "compliance"}', 'calculated', 'daily', NOW(), '{"calculation": "authorized_systems / total_systems * 100"}');

-- =====================================================
-- ASSET METRICS
-- =====================================================

-- Asset Count Metrics
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('total_assets', 'Total number of assets in inventory', 'count', 'assets', (SELECT COUNT(*) FROM assets), 'assets', '{"scope": "all"}', 'database', 'daily', NOW(), '{"table": "assets", "query_type": "count"}'),

('assets_with_agent', 'Number of assets with Tenable agent installed', 'count', 'assets', (SELECT COUNT(*) FROM assets WHERE has_agent = true), 'assets', '{"agent_status": "installed"}', 'database', 'daily', NOW(), '{"table": "assets", "filter": "has_agent=true"}'),

('assets_without_agent', 'Number of assets without Tenable agent', 'count', 'assets', (SELECT COUNT(*) FROM assets WHERE has_agent = false OR has_agent IS NULL), 'assets', '{"agent_status": "not_installed"}', 'database', 'daily', NOW(), '{"table": "assets", "filter": "has_agent=false"}'),

('assets_with_plugin_results', 'Number of assets with vulnerability scan results', 'count', 'assets', (SELECT COUNT(*) FROM assets WHERE has_plugin_results = true), 'assets', '{"scan_status": "scanned"}', 'database', 'daily', NOW(), '{"table": "assets", "filter": "has_plugin_results=true"}'),

-- Asset Coverage Metrics (Tenable-style)
('asset_coverage_percentage', 'Percentage of assets with active scanning', 'percentage', 'assets', 
  ROUND((SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0), 2), 
  'percent', '{"metric_type": "coverage"}', 'calculated', 'daily', NOW(), '{"calculation": "scanned_assets / total_assets * 100"}'),

('agent_deployment_percentage', 'Percentage of assets with Tenable agent deployed', 'percentage', 'assets', 
  ROUND((SELECT COUNT(*) * 100.0 FROM assets WHERE has_agent = true) / NULLIF((SELECT COUNT(*) FROM assets), 0), 2), 
  'percent', '{"metric_type": "agent_deployment"}', 'calculated', 'daily', NOW(), '{"calculation": "assets_with_agent / total_assets * 100"}'),

-- Asset Freshness Metrics
('assets_seen_last_7_days', 'Assets seen in the last 7 days', 'count', 'assets', 
  (SELECT COUNT(*) FROM assets WHERE last_seen >= NOW() - INTERVAL '7 days'), 
  'assets', '{"timeframe": "7_days"}', 'database', 'daily', NOW(), '{"table": "assets", "filter": "last_seen >= NOW() - INTERVAL 7 days"}'),

('assets_seen_last_30_days', 'Assets seen in the last 30 days', 'count', 'assets', 
  (SELECT COUNT(*) FROM assets WHERE last_seen >= NOW() - INTERVAL '30 days'), 
  'assets', '{"timeframe": "30_days"}', 'database', 'daily', NOW(), '{"table": "assets", "filter": "last_seen >= NOW() - INTERVAL 30 days"}'),

('assets_stale', 'Assets not seen in over 30 days', 'count', 'assets', 
  (SELECT COUNT(*) FROM assets WHERE last_seen < NOW() - INTERVAL '30 days' OR last_seen IS NULL), 
  'assets', '{"status": "stale"}', 'database', 'daily', NOW(), '{"table": "assets", "filter": "last_seen < NOW() - INTERVAL 30 days OR last_seen IS NULL"}');

-- =====================================================
-- VULNERABILITY METRICS (Tenable-style)
-- =====================================================

-- Core Vulnerability Counts
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('total_vulnerabilities', 'Total number of vulnerabilities', 'count', 'vulnerabilities', (SELECT COUNT(*) FROM vulnerabilities), 'vulnerabilities', '{"scope": "all"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "query_type": "count"}'),

('vulnerabilities_critical', 'Number of critical severity vulnerabilities', 'count', 'vulnerabilities', (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Critical'), 'vulnerabilities', '{"severity": "Critical"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "severity_name=Critical"}'),

('vulnerabilities_high', 'Number of high severity vulnerabilities', 'count', 'vulnerabilities', (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'High'), 'vulnerabilities', '{"severity": "High"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "severity_name=High"}'),

('vulnerabilities_medium', 'Number of medium severity vulnerabilities', 'count', 'vulnerabilities', (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Medium'), 'vulnerabilities', '{"severity": "Medium"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "severity_name=Medium"}'),

('vulnerabilities_low', 'Number of low severity vulnerabilities', 'count', 'vulnerabilities', (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Low'), 'vulnerabilities', '{"severity": "Low"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "severity_name=Low"}'),

-- Vulnerability State Metrics
('vulnerabilities_open', 'Number of open vulnerabilities', 'count', 'vulnerabilities', (SELECT COUNT(*) FROM vulnerabilities WHERE state = 'Open'), 'vulnerabilities', '{"state": "Open"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "state=Open"}'),

('vulnerabilities_fixed', 'Number of fixed vulnerabilities', 'count', 'vulnerabilities', (SELECT COUNT(*) FROM vulnerabilities WHERE state = 'Fixed'), 'vulnerabilities', '{"state": "Fixed"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "state=Fixed"}'),

-- Critical Vulnerability Metrics (Tenable-style)
('critical_open_vulnerabilities', 'Number of open critical vulnerabilities', 'count', 'vulnerabilities', 
  (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Open'), 
  'vulnerabilities', '{"severity": "Critical", "state": "Open"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "severity_name=Critical AND state=Open"}'),

('high_open_vulnerabilities', 'Number of open high severity vulnerabilities', 'count', 'vulnerabilities', 
  (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'High' AND state = 'Open'), 
  'vulnerabilities', '{"severity": "High", "state": "Open"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "severity_name=High AND state=Open"}'),

-- CVSS Score Metrics
('avg_cvss_score', 'Average CVSS v3 base score across all vulnerabilities', 'gauge', 'vulnerabilities', 
  ROUND((SELECT AVG(cvss3_base_score) FROM vulnerabilities WHERE cvss3_base_score IS NOT NULL), 2), 
  'score', '{"metric_type": "cvss_average"}', 'calculated', 'daily', NOW(), '{"calculation": "AVG(cvss3_base_score)"}'),

('avg_cvss_critical', 'Average CVSS score for critical vulnerabilities', 'gauge', 'vulnerabilities', 
  ROUND((SELECT AVG(cvss3_base_score) FROM vulnerabilities WHERE severity_name = 'Critical' AND cvss3_base_score IS NOT NULL), 2), 
  'score', '{"severity": "Critical", "metric_type": "cvss_average"}', 'calculated', 'daily', NOW(), '{"calculation": "AVG(cvss3_base_score) WHERE severity=Critical"}'),

-- Vulnerability Age Metrics (Tenable-style)
('vulnerabilities_age_0_7_days', 'Vulnerabilities discovered in last 7 days', 'count', 'vulnerabilities', 
  (SELECT COUNT(*) FROM vulnerabilities WHERE first_found >= NOW() - INTERVAL '7 days'), 
  'vulnerabilities', '{"age_range": "0-7_days"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "first_found >= NOW() - INTERVAL 7 days"}'),

('vulnerabilities_age_8_30_days', 'Vulnerabilities discovered 8-30 days ago', 'count', 'vulnerabilities', 
  (SELECT COUNT(*) FROM vulnerabilities WHERE first_found >= NOW() - INTERVAL '30 days' AND first_found < NOW() - INTERVAL '7 days'), 
  'vulnerabilities', '{"age_range": "8-30_days"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "first_found between 7-30 days ago"}'),

('vulnerabilities_age_31_90_days', 'Vulnerabilities discovered 31-90 days ago', 'count', 'vulnerabilities', 
  (SELECT COUNT(*) FROM vulnerabilities WHERE first_found >= NOW() - INTERVAL '90 days' AND first_found < NOW() - INTERVAL '30 days'), 
  'vulnerabilities', '{"age_range": "31-90_days"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "first_found between 30-90 days ago"}'),

('vulnerabilities_age_over_90_days', 'Vulnerabilities discovered over 90 days ago', 'count', 'vulnerabilities',
  (SELECT COUNT(*) FROM vulnerabilities WHERE first_found < NOW() - INTERVAL '90 days'),
  'vulnerabilities', '{"age_range": "over_90_days"}', 'database', 'daily', NOW(), '{"table": "vulnerabilities", "filter": "first_found < NOW() - INTERVAL 90 days"}');

-- =====================================================
-- TENABLE-SPECIFIC METRICS
-- =====================================================

-- Vulnerability Family Distribution (Top 10)
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata)
SELECT
  'vuln_family_' || LOWER(REPLACE(plugin_family, ' ', '_')) || '_count',
  'Number of vulnerabilities in ' || plugin_family || ' family',
  'count',
  'vulnerabilities',
  COUNT(*),
  'vulnerabilities',
  ('{"plugin_family": "' || plugin_family || '"}')::jsonb,
  'database',
  'daily',
  NOW(),
  ('{"table": "vulnerabilities", "filter": "plugin_family=' || plugin_family || '"}')::jsonb
FROM vulnerabilities
WHERE plugin_family IS NOT NULL
GROUP BY plugin_family
ORDER BY COUNT(*) DESC
LIMIT 10;

-- Risk Score Metrics (simulated Tenable-style scores)
INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
-- Cyber Exposure Score (CES) - simulated based on critical/high vulnerabilities
('cyber_exposure_score', 'Simulated Cyber Exposure Score (0-1000)', 'gauge', 'risk_scores',
  LEAST(1000, ROUND(
    (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Critical' AND state = 'Open') * 10 +
    (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'High' AND state = 'Open') * 5 +
    (SELECT COUNT(*) FROM vulnerabilities WHERE severity_name = 'Medium' AND state = 'Open') * 2
  )),
  'score', '{"score_type": "CES", "range": "0-1000"}', 'calculated', 'daily', NOW(),
  '{"calculation": "weighted_sum_of_open_vulnerabilities", "weights": {"critical": 10, "high": 5, "medium": 2}}'),

-- Asset Exposure Score (AES) - average per asset
('avg_asset_exposure_score', 'Average Asset Exposure Score', 'gauge', 'risk_scores',
  ROUND((SELECT AVG(vuln_count * 50) FROM (
    SELECT COUNT(*) as vuln_count
    FROM vulnerabilities v
    WHERE state = 'Open'
    GROUP BY asset_uuid
  ) asset_vulns), 2),
  'score', '{"score_type": "AES", "range": "0-1000"}', 'calculated', 'daily', NOW(),
  '{"calculation": "average_vulnerabilities_per_asset * 50"}'),

-- Remediation Metrics
('remediation_rate_7_days', 'Percentage of vulnerabilities fixed in last 7 days', 'percentage', 'remediation',
  ROUND((SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed' AND last_found >= NOW() - INTERVAL '7 days') /
        NULLIF((SELECT COUNT(*) FROM vulnerabilities WHERE last_found >= NOW() - INTERVAL '7 days'), 0), 2),
  'percent', '{"timeframe": "7_days"}', 'calculated', 'daily', NOW(),
  '{"calculation": "fixed_vulnerabilities_7d / total_vulnerabilities_7d * 100"}'),

('remediation_rate_30_days', 'Percentage of vulnerabilities fixed in last 30 days', 'percentage', 'remediation',
  ROUND((SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed' AND last_found >= NOW() - INTERVAL '30 days') /
        NULLIF((SELECT COUNT(*) FROM vulnerabilities WHERE last_found >= NOW() - INTERVAL '30 days'), 0), 2),
  'percent', '{"timeframe": "30_days"}', 'calculated', 'daily', NOW(),
  '{"calculation": "fixed_vulnerabilities_30d / total_vulnerabilities_30d * 100"}'),

-- Assessment Maturity Grade (simulated based on scan coverage)
('assessment_maturity_grade', 'Assessment Maturity Grade (A-F)', 'gauge', 'maturity',
  CASE
    WHEN (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) >= 95 THEN 4.0  -- A
    WHEN (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) >= 85 THEN 3.0  -- B
    WHEN (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) >= 75 THEN 2.0  -- C
    WHEN (SELECT COUNT(*) * 100.0 FROM assets WHERE has_plugin_results = true) / NULLIF((SELECT COUNT(*) FROM assets), 0) >= 65 THEN 1.0  -- D
    ELSE 0.0  -- F
  END,
  'grade', '{"grade_type": "assessment_maturity", "scale": "A-F"}', 'calculated', 'daily', NOW(),
  '{"calculation": "based_on_scan_coverage_percentage", "thresholds": {"A": 95, "B": 85, "C": 75, "D": 65}}'),

-- Remediation Maturity Grade (simulated based on fix rate)
('remediation_maturity_grade', 'Remediation Maturity Grade (A-F)', 'gauge', 'maturity',
  CASE
    WHEN (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) >= 80 THEN 4.0  -- A
    WHEN (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) >= 65 THEN 3.0  -- B
    WHEN (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) >= 50 THEN 2.0  -- C
    WHEN (SELECT COUNT(*) * 100.0 FROM vulnerabilities WHERE state = 'Fixed') / NULLIF((SELECT COUNT(*) FROM vulnerabilities), 0) >= 35 THEN 1.0  -- D
    ELSE 0.0  -- F
  END,
  'grade', '{"grade_type": "remediation_maturity", "scale": "A-F"}', 'calculated', 'daily', NOW(),
  '{"calculation": "based_on_fix_rate_percentage", "thresholds": {"A": 80, "B": 65, "C": 50, "D": 35}}');

-- =====================================================
-- PATCH METRICS
-- =====================================================

INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('total_patches', 'Total number of patches available', 'count', 'patches', (SELECT COUNT(*) FROM patches), 'patches', '{"scope": "all"}', 'database', 'daily', NOW(), '{"table": "patches", "query_type": "count"}'),

('patches_critical', 'Number of critical severity patches', 'count', 'patches', (SELECT COUNT(*) FROM patches WHERE severity = 'Critical'), 'patches', '{"severity": "Critical"}', 'database', 'daily', NOW(), '{"table": "patches", "filter": "severity=Critical"}'),

('patches_high', 'Number of high severity patches', 'count', 'patches', (SELECT COUNT(*) FROM patches WHERE severity = 'High'), 'patches', '{"severity": "High"}', 'database', 'daily', NOW(), '{"table": "patches", "filter": "severity=High"}'),

-- Patch Age Metrics
('patches_age_0_30_days', 'Patches released in last 30 days', 'count', 'patches',
  (SELECT COUNT(*) FROM patches WHERE release_date >= NOW() - INTERVAL '30 days'),
  'patches', '{"age_range": "0-30_days"}', 'database', 'daily', NOW(), '{"table": "patches", "filter": "release_date >= NOW() - INTERVAL 30 days"}'),

('patches_age_over_30_days', 'Patches available for over 30 days', 'count', 'patches',
  (SELECT COUNT(*) FROM patches WHERE release_date < NOW() - INTERVAL '30 days'),
  'patches', '{"age_range": "over_30_days"}', 'database', 'daily', NOW(), '{"table": "patches", "filter": "release_date < NOW() - INTERVAL 30 days"}');

-- =====================================================
-- SUMMARY STATISTICS
-- =====================================================

-- Display summary of inserted metrics
SELECT 'Metrics population completed!' as status;
SELECT
  category,
  COUNT(*) as metric_count,
  MIN(last_calculated) as earliest_calculation,
  MAX(last_calculated) as latest_calculation
FROM metrics
GROUP BY category
ORDER BY category;
