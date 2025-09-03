-- Migration: systems/0008_systems_security_posture.sql
-- Description: Create system security posture and configuration drift tracking tables
-- Author: Systems Management Team
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS system_configuration_drift, system_security_posture CASCADE; DROP TYPE IF EXISTS posture_status, drift_severity CASCADE;

-- =====================================================
-- SECURITY POSTURE ENUMS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE "posture_status" AS ENUM(
    'excellent', 'good', 'fair', 'poor', 'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "drift_severity" AS ENUM(
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- SYSTEM SECURITY POSTURE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "system_security_posture" (
  "id" serial PRIMARY KEY NOT NULL,
  "system_id" integer NOT NULL,
  
  -- Overall Security Scores (0-100)
  "overall_score" decimal(5, 2) NOT NULL,
  "posture_status" "posture_status" NOT NULL,
  
  -- Component Scores
  "vulnerability_score" decimal(5, 2),
  "configuration_score" decimal(5, 2),
  "patch_score" decimal(5, 2),
  "compliance_score" decimal(5, 2),
  "control_effectiveness" decimal(5, 2),
  "threat_exposure" decimal(5, 2),
  "business_impact" decimal(5, 2),
  
  -- Risk Analysis
  "risk_factors" jsonb DEFAULT '{}',
  "recommendations" jsonb DEFAULT '[]',
  
  -- Assessment Information
  "last_assessment" timestamp with time zone NOT NULL,
  "next_assessment" timestamp with time zone,
  "assessed_by" varchar(100),
  
  -- Audit Fields
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraint
  CONSTRAINT "system_security_posture_system_id_systems_id_fk" 
    FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE cascade
);

-- Indexes for system security posture
CREATE INDEX IF NOT EXISTS "idx_security_posture_system_id" ON "system_security_posture" ("system_id");
CREATE INDEX IF NOT EXISTS "idx_security_posture_overall_score" ON "system_security_posture" ("overall_score");
CREATE INDEX IF NOT EXISTS "idx_security_posture_status" ON "system_security_posture" ("posture_status");
CREATE INDEX IF NOT EXISTS "idx_security_posture_last_assessment" ON "system_security_posture" ("last_assessment");
CREATE INDEX IF NOT EXISTS "idx_security_posture_next_assessment" ON "system_security_posture" ("next_assessment");

-- Component score indexes for reporting
CREATE INDEX IF NOT EXISTS "idx_security_posture_vulnerability_score" ON "system_security_posture" ("vulnerability_score");
CREATE INDEX IF NOT EXISTS "idx_security_posture_compliance_score" ON "system_security_posture" ("compliance_score");
CREATE INDEX IF NOT EXISTS "idx_security_posture_patch_score" ON "system_security_posture" ("patch_score");

-- JSON indexes for risk analysis
CREATE INDEX IF NOT EXISTS "idx_security_posture_risk_factors_gin" ON "system_security_posture" USING gin("risk_factors");
CREATE INDEX IF NOT EXISTS "idx_security_posture_recommendations_gin" ON "system_security_posture" USING gin("recommendations");

-- =====================================================
-- SYSTEM CONFIGURATION DRIFT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "system_configuration_drift" (
  "id" serial PRIMARY KEY NOT NULL,
  "system_id" integer NOT NULL,
  
  -- Drift Classification
  "drift_type" varchar(100) NOT NULL, -- 'configuration', 'patch', 'service', 'security'
  "severity" "drift_severity" NOT NULL,
  "title" varchar(500) NOT NULL,
  "description" text,
  
  -- Configuration Values
  "current_value" text,
  "expected_value" text,
  "previous_value" text,
  
  -- Detection and Analysis
  "detection_method" varchar(100),
  "impact_assessment" text,
  "remediation_steps" jsonb DEFAULT '[]',
  "business_impact" varchar(50),
  
  -- Lifecycle Tracking
  "detected_at" timestamp with time zone NOT NULL,
  "acknowledged_at" timestamp with time zone,
  "resolved_at" timestamp with time zone,
  "acknowledged_by" integer,
  "resolved_by" integer,
  "status" varchar(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'accepted'
  
  -- Additional Metadata
  "metadata" jsonb DEFAULT '{}',
  
  -- Audit Fields
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "system_configuration_drift_system_id_systems_id_fk" 
    FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE cascade,
  CONSTRAINT "system_configuration_drift_acknowledged_by_users_id_fk" 
    FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id"),
  CONSTRAINT "system_configuration_drift_resolved_by_users_id_fk" 
    FOREIGN KEY ("resolved_by") REFERENCES "users"("id")
);

-- Indexes for system configuration drift
CREATE INDEX IF NOT EXISTS "idx_config_drift_system_id" ON "system_configuration_drift" ("system_id");
CREATE INDEX IF NOT EXISTS "idx_config_drift_type" ON "system_configuration_drift" ("drift_type");
CREATE INDEX IF NOT EXISTS "idx_config_drift_severity" ON "system_configuration_drift" ("severity");
CREATE INDEX IF NOT EXISTS "idx_config_drift_status" ON "system_configuration_drift" ("status");
CREATE INDEX IF NOT EXISTS "idx_config_drift_detected_at" ON "system_configuration_drift" ("detected_at");
CREATE INDEX IF NOT EXISTS "idx_config_drift_acknowledged_by" ON "system_configuration_drift" ("acknowledged_by");
CREATE INDEX IF NOT EXISTS "idx_config_drift_resolved_by" ON "system_configuration_drift" ("resolved_by");

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_config_drift_system_severity_status" ON "system_configuration_drift" ("system_id", "severity", "status");
CREATE INDEX IF NOT EXISTS "idx_config_drift_type_severity" ON "system_configuration_drift" ("drift_type", "severity");

-- JSON indexes
CREATE INDEX IF NOT EXISTS "idx_config_drift_remediation_gin" ON "system_configuration_drift" USING gin("remediation_steps");
CREATE INDEX IF NOT EXISTS "idx_config_drift_metadata_gin" ON "system_configuration_drift" USING gin("metadata");

-- =====================================================
-- SECURITY POSTURE CONSTRAINTS
-- =====================================================

-- Score validation constraints (0-100)
ALTER TABLE "system_security_posture" ADD CONSTRAINT IF NOT EXISTS "chk_security_posture_overall_score_valid" 
CHECK ("overall_score" >= 0 AND "overall_score" <= 100);

ALTER TABLE "system_security_posture" ADD CONSTRAINT IF NOT EXISTS "chk_security_posture_vulnerability_score_valid" 
CHECK ("vulnerability_score" IS NULL OR ("vulnerability_score" >= 0 AND "vulnerability_score" <= 100));

ALTER TABLE "system_security_posture" ADD CONSTRAINT IF NOT EXISTS "chk_security_posture_compliance_score_valid" 
CHECK ("compliance_score" IS NULL OR ("compliance_score" >= 0 AND "compliance_score" <= 100));

ALTER TABLE "system_security_posture" ADD CONSTRAINT IF NOT EXISTS "chk_security_posture_patch_score_valid" 
CHECK ("patch_score" IS NULL OR ("patch_score" >= 0 AND "patch_score" <= 100));

-- Assessment date validation
ALTER TABLE "system_security_posture" ADD CONSTRAINT IF NOT EXISTS "chk_security_posture_assessment_dates_logical" 
CHECK ("last_assessment" <= CURRENT_TIMESTAMP AND ("next_assessment" IS NULL OR "next_assessment" > "last_assessment"));

-- Configuration drift status validation
ALTER TABLE "system_configuration_drift" ADD CONSTRAINT IF NOT EXISTS "chk_config_drift_status_valid" 
CHECK ("status" IN ('open', 'acknowledged', 'resolved', 'accepted'));

-- Drift lifecycle date validation
ALTER TABLE "system_configuration_drift" ADD CONSTRAINT IF NOT EXISTS "chk_config_drift_dates_logical" 
CHECK (
  ("acknowledged_at" IS NULL OR "acknowledged_at" >= "detected_at") AND
  ("resolved_at" IS NULL OR "resolved_at" >= "detected_at") AND
  ("acknowledged_at" IS NULL OR "resolved_at" IS NULL OR "resolved_at" >= "acknowledged_at")
);

-- =====================================================
-- SECURITY POSTURE MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get systems by security posture status
CREATE OR REPLACE FUNCTION get_systems_by_posture_status(
  p_posture_status posture_status
) RETURNS TABLE(
  system_id VARCHAR,
  system_name VARCHAR,
  overall_score DECIMAL,
  last_assessment TIMESTAMP,
  days_since_assessment INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.system_id,
    s.name,
    sp.overall_score,
    sp.last_assessment,
    EXTRACT(DAY FROM (NOW() - sp.last_assessment))::INTEGER
  FROM systems s
  JOIN system_security_posture sp ON s.id = sp.system_id
  WHERE sp.posture_status = p_posture_status
  ORDER BY sp.overall_score ASC, sp.last_assessment DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get configuration drift summary
CREATE OR REPLACE FUNCTION get_configuration_drift_summary(
  p_system_id INTEGER DEFAULT NULL
) RETURNS TABLE(
  drift_type VARCHAR,
  total_drifts INTEGER,
  open_drifts INTEGER,
  critical_drifts INTEGER,
  high_drifts INTEGER,
  avg_resolution_days DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.drift_type,
    COUNT(*)::INTEGER as total_drifts,
    COUNT(CASE WHEN cd.status = 'open' THEN 1 END)::INTEGER as open_drifts,
    COUNT(CASE WHEN cd.severity = 'critical' THEN 1 END)::INTEGER as critical_drifts,
    COUNT(CASE WHEN cd.severity = 'high' THEN 1 END)::INTEGER as high_drifts,
    ROUND(AVG(
      CASE 
        WHEN cd.resolved_at IS NOT NULL THEN 
          EXTRACT(DAY FROM (cd.resolved_at - cd.detected_at))
        ELSE NULL 
      END
    ), 1) as avg_resolution_days
  FROM system_configuration_drift cd
  WHERE (p_system_id IS NULL OR cd.system_id = p_system_id)
  GROUP BY cd.drift_type
  ORDER BY total_drifts DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get security posture trends
CREATE OR REPLACE FUNCTION get_security_posture_trends(
  p_days_back INTEGER DEFAULT 90
) RETURNS TABLE(
  assessment_date DATE,
  avg_overall_score DECIMAL,
  systems_assessed INTEGER,
  excellent_count INTEGER,
  good_count INTEGER,
  fair_count INTEGER,
  poor_count INTEGER,
  critical_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.last_assessment::DATE,
    ROUND(AVG(sp.overall_score), 2) as avg_overall_score,
    COUNT(*)::INTEGER as systems_assessed,
    COUNT(CASE WHEN sp.posture_status = 'excellent' THEN 1 END)::INTEGER as excellent_count,
    COUNT(CASE WHEN sp.posture_status = 'good' THEN 1 END)::INTEGER as good_count,
    COUNT(CASE WHEN sp.posture_status = 'fair' THEN 1 END)::INTEGER as fair_count,
    COUNT(CASE WHEN sp.posture_status = 'poor' THEN 1 END)::INTEGER as poor_count,
    COUNT(CASE WHEN sp.posture_status = 'critical' THEN 1 END)::INTEGER as critical_count
  FROM system_security_posture sp
  WHERE sp.last_assessment >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY sp.last_assessment::DATE
  ORDER BY sp.last_assessment::DATE DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECURITY POSTURE REPORTING VIEWS
-- =====================================================

-- View for security posture dashboard
CREATE OR REPLACE VIEW security_posture_dashboard AS
SELECT 
  s.system_id,
  s.name as system_name,
  s.system_type,
  s.system_owner,
  sp.overall_score,
  sp.posture_status,
  sp.vulnerability_score,
  sp.compliance_score,
  sp.patch_score,
  sp.last_assessment,
  EXTRACT(DAY FROM (NOW() - sp.last_assessment))::INTEGER as days_since_assessment,
  COUNT(cd.id) as open_drift_count,
  COUNT(CASE WHEN cd.severity IN ('critical', 'high') THEN 1 END) as critical_drift_count
FROM systems s
LEFT JOIN system_security_posture sp ON s.id = sp.system_id
LEFT JOIN system_configuration_drift cd ON s.id = cd.system_id AND cd.status = 'open'
GROUP BY s.id, s.system_id, s.name, s.system_type, s.system_owner, 
         sp.overall_score, sp.posture_status, sp.vulnerability_score, 
         sp.compliance_score, sp.patch_score, sp.last_assessment
ORDER BY sp.overall_score ASC NULLS LAST;

-- View for configuration drift alerts
CREATE OR REPLACE VIEW configuration_drift_alerts AS
SELECT 
  cd.id,
  s.system_id,
  s.name as system_name,
  cd.drift_type,
  cd.severity,
  cd.title,
  cd.status,
  cd.detected_at,
  EXTRACT(DAY FROM (NOW() - cd.detected_at))::INTEGER as days_open,
  cd.business_impact,
  CASE 
    WHEN cd.severity = 'critical' AND cd.detected_at < NOW() - INTERVAL '1 day' THEN 'overdue'
    WHEN cd.severity = 'high' AND cd.detected_at < NOW() - INTERVAL '3 days' THEN 'overdue'
    WHEN cd.severity = 'medium' AND cd.detected_at < NOW() - INTERVAL '7 days' THEN 'overdue'
    WHEN cd.severity = 'low' AND cd.detected_at < NOW() - INTERVAL '30 days' THEN 'overdue'
    ELSE 'on_time'
  END as resolution_status
FROM system_configuration_drift cd
JOIN systems s ON cd.system_id = s.id
WHERE cd.status IN ('open', 'acknowledged')
ORDER BY 
  CASE cd.severity 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    WHEN 'low' THEN 4 
  END,
  cd.detected_at ASC;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('systems/0008_systems_security_posture', NOW())
ON CONFLICT ("version") DO NOTHING;
