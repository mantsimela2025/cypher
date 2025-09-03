-- Migration: performance/0010_systems_performance_indexes.sql
-- Description: Add advanced performance indexes and optimization for systems management
-- Author: Systems Management Team
-- Date: 2024-01-19
-- Rollback: DROP INDEX IF EXISTS [all indexes listed below]; DROP FUNCTION IF EXISTS [all functions listed below] CASCADE;

-- =====================================================
-- ADVANCED SYSTEMS PERFORMANCE INDEXES
-- =====================================================

-- Full-text search indexes for systems
CREATE INDEX IF NOT EXISTS "idx_systems_fulltext_search" ON "systems" 
USING gin(to_tsvector('english', 
  "name" || ' ' || 
  COALESCE("system_id", '') || ' ' || 
  COALESCE("system_type", '') || ' ' || 
  COALESCE("system_owner", '') || ' ' ||
  COALESCE("responsible_organization", '') || ' ' ||
  COALESCE("authorization_boundary", '')
));

-- Composite indexes for common system queries
CREATE INDEX IF NOT EXISTS "idx_systems_status_type_owner" ON "systems" 
("status", "system_type", "system_owner");

CREATE INDEX IF NOT EXISTS "idx_systems_impact_levels" ON "systems" 
("confidentiality_impact", "integrity_impact", "availability_impact");

-- Authorization and assessment date range indexes
CREATE INDEX IF NOT EXISTS "idx_systems_authorization_active" ON "systems" 
("authorization_date", "authorization_termination_date") 
WHERE "authorization_termination_date" IS NULL OR "authorization_termination_date" > NOW();

CREATE INDEX IF NOT EXISTS "idx_systems_assessment_overdue" ON "systems" 
("last_assessment_date") 
WHERE "last_assessment_date" IS NULL OR "last_assessment_date" < NOW() - INTERVAL '1 year';

-- Discovery and environment indexes
CREATE INDEX IF NOT EXISTS "idx_systems_discovery_status" ON "systems" 
("last_discovery_date", "discovery_confidence") 
WHERE "last_discovery_date" IS NOT NULL;

-- =====================================================
-- SECURITY POSTURE PERFORMANCE INDEXES
-- =====================================================

-- Composite indexes for security posture queries
CREATE INDEX IF NOT EXISTS "idx_security_posture_score_status" ON "system_security_posture" 
("overall_score", "posture_status", "last_assessment");

CREATE INDEX IF NOT EXISTS "idx_security_posture_component_scores" ON "system_security_posture" 
("vulnerability_score", "compliance_score", "patch_score");

-- Assessment scheduling indexes
CREATE INDEX IF NOT EXISTS "idx_security_posture_next_assessment" ON "system_security_posture" 
("next_assessment") WHERE "next_assessment" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_security_posture_overdue_assessment" ON "system_security_posture" 
("last_assessment") WHERE "last_assessment" < NOW() - INTERVAL '6 months';

-- =====================================================
-- CONFIGURATION DRIFT PERFORMANCE INDEXES
-- =====================================================

-- Active drift monitoring indexes
CREATE INDEX IF NOT EXISTS "idx_config_drift_active_critical" ON "system_configuration_drift" 
("system_id", "severity", "detected_at") 
WHERE "status" IN ('open', 'acknowledged') AND "severity" IN ('critical', 'high');

-- Resolution tracking indexes
CREATE INDEX IF NOT EXISTS "idx_config_drift_resolution_time" ON "system_configuration_drift" 
("detected_at", "resolved_at") WHERE "resolved_at" IS NOT NULL;

-- Business impact analysis indexes
CREATE INDEX IF NOT EXISTS "idx_config_drift_business_impact" ON "system_configuration_drift" 
("business_impact", "severity", "status");

-- =====================================================
-- DISCOVERY PERFORMANCE INDEXES
-- =====================================================

-- Discovery scan performance indexes
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_active" ON "system_discovery_scans" 
("status", "started_at") WHERE "status" IN ('pending', 'running');

CREATE INDEX IF NOT EXISTS "idx_discovery_scans_completed_recent" ON "system_discovery_scans" 
("completed_at", "systems_found") WHERE "completed_at" >= NOW() - INTERVAL '30 days';

-- Discovery results processing indexes
CREATE INDEX IF NOT EXISTS "idx_discovery_results_unprocessed_high_confidence" ON "system_discovery_results" 
("scan_id", "confidence", "created_at") 
WHERE "processed" = false AND "confidence" >= 0.7;

-- =====================================================
-- CORRELATION ANALYSIS PERFORMANCE INDEXES
-- =====================================================

-- Active correlations monitoring
CREATE INDEX IF NOT EXISTS "idx_correlations_active_high_risk" ON "cross_system_correlations" 
("severity", "risk_score", "detected_at") 
WHERE "status" = 'active' AND "severity" IN ('critical', 'high');

-- System correlation lookup optimization
CREATE INDEX IF NOT EXISTS "idx_correlations_system_lookup" ON "cross_system_correlations" 
USING gin("system_ids") WHERE "status" = 'active';

-- =====================================================
-- ENTERPRISE RISK AGGREGATION INDEXES
-- =====================================================

-- Time-series analysis indexes
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_time_series" ON "enterprise_risk_aggregation" 
("period_type", "aggregation_date", "overall_risk_score");

-- Risk level trending
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_level_trends" ON "enterprise_risk_aggregation" 
("risk_level", "aggregation_date") WHERE "period_type" = 'daily';

-- =====================================================
-- SYSTEMS PERFORMANCE OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to get systems requiring immediate attention
CREATE OR REPLACE FUNCTION get_systems_requiring_attention() 
RETURNS TABLE(
  system_id VARCHAR,
  system_name VARCHAR,
  attention_type VARCHAR,
  priority INTEGER,
  description TEXT,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  -- Authorization expiring soon
  SELECT 
    s.system_id,
    s.name,
    'authorization_expiring'::VARCHAR,
    1 as priority,
    'Authorization expires in ' || EXTRACT(DAY FROM (s.authorization_termination_date - NOW()))::TEXT || ' days',
    NULL::INTEGER
  FROM systems s
  WHERE s.authorization_termination_date IS NOT NULL 
    AND s.authorization_termination_date <= NOW() + INTERVAL '30 days'
    AND s.authorization_termination_date > NOW()
  
  UNION ALL
  
  -- Authorization expired
  SELECT 
    s.system_id,
    s.name,
    'authorization_expired'::VARCHAR,
    0 as priority,
    'Authorization expired ' || EXTRACT(DAY FROM (NOW() - s.authorization_termination_date))::TEXT || ' days ago',
    EXTRACT(DAY FROM (NOW() - s.authorization_termination_date))::INTEGER
  FROM systems s
  WHERE s.authorization_termination_date IS NOT NULL 
    AND s.authorization_termination_date <= NOW()
  
  UNION ALL
  
  -- Assessment overdue
  SELECT 
    s.system_id,
    s.name,
    'assessment_overdue'::VARCHAR,
    2 as priority,
    'Assessment overdue by ' || EXTRACT(DAY FROM (NOW() - s.last_assessment_date))::TEXT || ' days',
    EXTRACT(DAY FROM (NOW() - s.last_assessment_date))::INTEGER
  FROM systems s
  WHERE s.last_assessment_date IS NOT NULL 
    AND s.last_assessment_date < NOW() - INTERVAL '1 year'
  
  UNION ALL
  
  -- Never assessed
  SELECT 
    s.system_id,
    s.name,
    'never_assessed'::VARCHAR,
    1 as priority,
    'System has never been assessed',
    NULL::INTEGER
  FROM systems s
  WHERE s.last_assessment_date IS NULL
  
  UNION ALL
  
  -- Critical security posture
  SELECT 
    s.system_id,
    s.name,
    'critical_security_posture'::VARCHAR,
    0 as priority,
    'Critical security posture (score: ' || sp.overall_score::TEXT || ')',
    NULL::INTEGER
  FROM systems s
  JOIN system_security_posture sp ON s.id = sp.system_id
  WHERE sp.posture_status = 'critical'
  
  UNION ALL
  
  -- Critical configuration drift
  SELECT 
    s.system_id,
    s.name,
    'critical_configuration_drift'::VARCHAR,
    0 as priority,
    'Critical configuration drift detected',
    EXTRACT(DAY FROM (NOW() - cd.detected_at))::INTEGER
  FROM systems s
  JOIN system_configuration_drift cd ON s.id = cd.system_id
  WHERE cd.severity = 'critical' AND cd.status IN ('open', 'acknowledged')
  
  ORDER BY priority ASC, days_overdue DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary(
  p_system_id INTEGER
) RETURNS TABLE(
  system_id VARCHAR,
  system_name VARCHAR,
  overall_health_score DECIMAL,
  health_status VARCHAR,
  authorization_status VARCHAR,
  security_posture VARCHAR,
  active_drifts INTEGER,
  critical_correlations INTEGER,
  last_assessment_days INTEGER,
  recommendations JSONB
) AS $$
DECLARE
  v_system_record RECORD;
  v_health_score DECIMAL := 100;
  v_health_status VARCHAR := 'excellent';
  v_auth_status VARCHAR := 'valid';
  v_recommendations JSONB := '[]'::JSONB;
BEGIN
  -- Get system basic info
  SELECT s.system_id, s.name, s.authorization_termination_date, s.last_assessment_date
  INTO v_system_record
  FROM systems s WHERE s.id = p_system_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate authorization status
  IF v_system_record.authorization_termination_date IS NOT NULL THEN
    IF v_system_record.authorization_termination_date <= NOW() THEN
      v_auth_status := 'expired';
      v_health_score := v_health_score - 30;
      v_recommendations := v_recommendations || '["Renew system authorization immediately"]'::JSONB;
    ELSIF v_system_record.authorization_termination_date <= NOW() + INTERVAL '30 days' THEN
      v_auth_status := 'expiring_soon';
      v_health_score := v_health_score - 10;
      v_recommendations := v_recommendations || '["Schedule authorization renewal"]'::JSONB;
    END IF;
  END IF;
  
  -- Adjust health score based on assessment age
  IF v_system_record.last_assessment_date IS NULL THEN
    v_health_score := v_health_score - 25;
    v_recommendations := v_recommendations || '["Conduct initial security assessment"]'::JSONB;
  ELSIF v_system_record.last_assessment_date < NOW() - INTERVAL '1 year' THEN
    v_health_score := v_health_score - 15;
    v_recommendations := v_recommendations || '["Schedule security assessment update"]'::JSONB;
  END IF;
  
  -- Determine overall health status
  CASE 
    WHEN v_health_score >= 90 THEN v_health_status := 'excellent';
    WHEN v_health_score >= 80 THEN v_health_status := 'good';
    WHEN v_health_score >= 70 THEN v_health_status := 'fair';
    WHEN v_health_score >= 60 THEN v_health_status := 'poor';
    ELSE v_health_status := 'critical';
  END CASE;
  
  RETURN QUERY
  SELECT 
    v_system_record.system_id,
    v_system_record.name,
    v_health_score,
    v_health_status,
    v_auth_status,
    COALESCE(sp.posture_status::VARCHAR, 'unknown'),
    COUNT(DISTINCT cd.id)::INTEGER as active_drifts,
    COUNT(DISTINCT csc.id)::INTEGER as critical_correlations,
    CASE 
      WHEN v_system_record.last_assessment_date IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (NOW() - v_system_record.last_assessment_date))::INTEGER
    END as last_assessment_days,
    v_recommendations
  FROM systems s
  LEFT JOIN system_security_posture sp ON s.id = sp.system_id
  LEFT JOIN system_configuration_drift cd ON s.id = cd.system_id AND cd.status IN ('open', 'acknowledged')
  LEFT JOIN cross_system_correlations csc ON csc.system_ids ? s.id::TEXT AND csc.status = 'active' AND csc.severity IN ('critical', 'high')
  WHERE s.id = p_system_id
  GROUP BY s.system_id, s.name, sp.posture_status;
END;
$$ LANGUAGE plpgsql;

-- Function to optimize system data cleanup
CREATE OR REPLACE FUNCTION cleanup_old_system_data(
  p_days_old INTEGER DEFAULT 365
) RETURNS TABLE(
  cleanup_type VARCHAR,
  records_cleaned INTEGER
) AS $$
DECLARE
  v_discovery_results_cleaned INTEGER;
  v_old_aggregations_cleaned INTEGER;
  v_resolved_correlations_cleaned INTEGER;
BEGIN
  -- Clean up old discovery results (keep only recent and unprocessed)
  DELETE FROM system_discovery_results 
  WHERE processed = true 
    AND created_at < NOW() - (p_days_old || ' days')::INTERVAL;
  GET DIAGNOSTICS v_discovery_results_cleaned = ROW_COUNT;
  
  -- Clean up old enterprise risk aggregations (keep daily for 1 year, weekly for 2 years, monthly for 5 years)
  DELETE FROM enterprise_risk_aggregation 
  WHERE (
    (period_type = 'daily' AND aggregation_date < NOW() - INTERVAL '1 year') OR
    (period_type = 'weekly' AND aggregation_date < NOW() - INTERVAL '2 years') OR
    (period_type = 'monthly' AND aggregation_date < NOW() - INTERVAL '5 years')
  );
  GET DIAGNOSTICS v_old_aggregations_cleaned = ROW_COUNT;
  
  -- Clean up old resolved correlations
  DELETE FROM cross_system_correlations 
  WHERE status = 'resolved' 
    AND updated_at < NOW() - (p_days_old || ' days')::INTERVAL;
  GET DIAGNOSTICS v_resolved_correlations_cleaned = ROW_COUNT;
  
  -- Return cleanup summary
  RETURN QUERY VALUES 
    ('discovery_results', v_discovery_results_cleaned),
    ('risk_aggregations', v_old_aggregations_cleaned),
    ('resolved_correlations', v_resolved_correlations_cleaned);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SYSTEMS MONITORING VIEWS
-- =====================================================

-- View for systems dashboard with key metrics
CREATE OR REPLACE VIEW systems_dashboard_summary AS
SELECT 
  s.system_id,
  s.name,
  s.system_type,
  s.status,
  s.system_owner,
  
  -- Authorization status
  CASE 
    WHEN s.authorization_termination_date IS NULL THEN 'no_expiration'
    WHEN s.authorization_termination_date <= NOW() THEN 'expired'
    WHEN s.authorization_termination_date <= NOW() + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END as authorization_status,
  
  -- Assessment status
  CASE 
    WHEN s.last_assessment_date IS NULL THEN 'never_assessed'
    WHEN s.last_assessment_date < NOW() - INTERVAL '2 years' THEN 'critical_overdue'
    WHEN s.last_assessment_date < NOW() - INTERVAL '1 year' THEN 'overdue'
    WHEN s.last_assessment_date < NOW() - INTERVAL '6 months' THEN 'due_soon'
    ELSE 'current'
  END as assessment_status,
  
  -- Security posture
  COALESCE(sp.posture_status::VARCHAR, 'unknown') as security_posture,
  sp.overall_score as security_score,
  
  -- Active issues
  COUNT(DISTINCT cd.id) as active_drifts,
  COUNT(DISTINCT CASE WHEN cd.severity IN ('critical', 'high') THEN cd.id END) as critical_drifts,
  
  -- Discovery status
  CASE 
    WHEN s.last_discovery_date IS NULL THEN 'never_discovered'
    WHEN s.last_discovery_date < NOW() - INTERVAL '30 days' THEN 'stale'
    ELSE 'current'
  END as discovery_status,
  
  s.last_assessment_date,
  s.authorization_termination_date,
  s.last_discovery_date
  
FROM systems s
LEFT JOIN system_security_posture sp ON s.id = sp.system_id
LEFT JOIN system_configuration_drift cd ON s.id = cd.system_id AND cd.status IN ('open', 'acknowledged')
GROUP BY s.id, s.system_id, s.name, s.system_type, s.status, s.system_owner,
         s.authorization_termination_date, s.last_assessment_date, s.last_discovery_date,
         sp.posture_status, sp.overall_score
ORDER BY s.name;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('performance/0010_systems_performance_indexes', NOW())
ON CONFLICT ("version") DO NOTHING;
