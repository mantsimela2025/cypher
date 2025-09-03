-- Migration: systems/0009_systems_analysis_correlation.sql
-- Description: Create cross-system correlations and enterprise risk aggregation tables
-- Author: Systems Management Team
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS enterprise_risk_aggregation, cross_system_correlations CASCADE; DROP TYPE IF EXISTS risk_level CASCADE;

-- =====================================================
-- RISK ANALYSIS ENUMS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE "risk_level" AS ENUM(
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CROSS-SYSTEM CORRELATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "cross_system_correlations" (
  "id" serial PRIMARY KEY NOT NULL,
  "correlation_id" varchar(100) NOT NULL UNIQUE,
  
  -- Correlation Classification
  "correlation_type" varchar(100) NOT NULL, -- 'vulnerability_pattern', 'attack_path', 'shared_risk'
  "title" varchar(500) NOT NULL,
  "description" text,
  
  -- Affected Systems
  "system_ids" jsonb NOT NULL, -- Array of affected system IDs
  
  -- Risk Assessment
  "severity" varchar(20) NOT NULL,
  "confidence" decimal(3, 2) NOT NULL,
  "risk_score" decimal(5, 2),
  
  -- Analysis Data
  "correlation_data" jsonb NOT NULL,
  "ai_analysis" jsonb,
  "recommendations" jsonb DEFAULT '[]',
  
  -- Lifecycle Tracking
  "detected_at" timestamp with time zone NOT NULL,
  "last_updated" timestamp with time zone DEFAULT now(),
  "status" varchar(50) DEFAULT 'active', -- 'active', 'resolved', 'false_positive'
  "assigned_to" integer,
  
  -- Audit Fields
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "cross_system_correlations_assigned_to_users_id_fk" 
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id")
);

-- Indexes for cross-system correlations
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_correlation_id" ON "cross_system_correlations" ("correlation_id");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_type" ON "cross_system_correlations" ("correlation_type");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_severity" ON "cross_system_correlations" ("severity");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_confidence" ON "cross_system_correlations" ("confidence");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_risk_score" ON "cross_system_correlations" ("risk_score");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_status" ON "cross_system_correlations" ("status");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_detected_at" ON "cross_system_correlations" ("detected_at");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_assigned_to" ON "cross_system_correlations" ("assigned_to");

-- JSON indexes for correlation analysis
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_system_ids_gin" ON "cross_system_correlations" USING gin("system_ids");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_data_gin" ON "cross_system_correlations" USING gin("correlation_data");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_ai_analysis_gin" ON "cross_system_correlations" USING gin("ai_analysis");
CREATE INDEX IF NOT EXISTS "idx_cross_correlations_recommendations_gin" ON "cross_system_correlations" USING gin("recommendations");

-- =====================================================
-- ENTERPRISE RISK AGGREGATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "enterprise_risk_aggregation" (
  "id" serial PRIMARY KEY NOT NULL,
  "aggregation_date" timestamp with time zone NOT NULL,
  "period_type" varchar(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  
  -- Overall Risk Metrics
  "total_systems" integer NOT NULL,
  "systems_assessed" integer NOT NULL,
  "overall_risk_score" decimal(5, 2) NOT NULL,
  "risk_level" "risk_level" NOT NULL,
  
  -- Vulnerability Metrics
  "critical_vulnerabilities" integer DEFAULT 0,
  "high_vulnerabilities" integer DEFAULT 0,
  
  -- Compliance and Control Metrics
  "compliance_score" decimal(5, 2),
  "control_effectiveness" decimal(5, 2),
  "threat_exposure" decimal(5, 2),
  "business_impact_score" decimal(5, 2),
  
  -- Trend Analysis
  "risk_trends" jsonb DEFAULT '{}',
  "top_risks" jsonb DEFAULT '[]',
  "recommendations" jsonb DEFAULT '[]',
  "benchmark_data" jsonb DEFAULT '{}',
  
  -- Audit Fields
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for enterprise risk aggregation
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_aggregation_date" ON "enterprise_risk_aggregation" ("aggregation_date");
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_period_type" ON "enterprise_risk_aggregation" ("period_type");
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_overall_score" ON "enterprise_risk_aggregation" ("overall_risk_score");
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_level" ON "enterprise_risk_aggregation" ("risk_level");

-- Composite index for time-series queries
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_date_period" ON "enterprise_risk_aggregation" ("aggregation_date", "period_type");

-- JSON indexes for trend analysis
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_trends_gin" ON "enterprise_risk_aggregation" USING gin("risk_trends");
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_top_risks_gin" ON "enterprise_risk_aggregation" USING gin("top_risks");
CREATE INDEX IF NOT EXISTS "idx_enterprise_risk_recommendations_gin" ON "enterprise_risk_aggregation" USING gin("recommendations");

-- =====================================================
-- CORRELATION AND RISK CONSTRAINTS
-- =====================================================

-- Correlation confidence validation
ALTER TABLE "cross_system_correlations" ADD CONSTRAINT IF NOT EXISTS "chk_cross_correlations_confidence_valid" 
CHECK ("confidence" >= 0.0 AND "confidence" <= 1.0);

-- Risk score validation
ALTER TABLE "cross_system_correlations" ADD CONSTRAINT IF NOT EXISTS "chk_cross_correlations_risk_score_valid" 
CHECK ("risk_score" IS NULL OR ("risk_score" >= 0 AND "risk_score" <= 100));

-- Severity validation
ALTER TABLE "cross_system_correlations" ADD CONSTRAINT IF NOT EXISTS "chk_cross_correlations_severity_valid" 
CHECK ("severity" IN ('low', 'medium', 'high', 'critical'));

-- Status validation
ALTER TABLE "cross_system_correlations" ADD CONSTRAINT IF NOT EXISTS "chk_cross_correlations_status_valid" 
CHECK ("status" IN ('active', 'resolved', 'false_positive', 'investigating'));

-- Enterprise risk aggregation constraints
ALTER TABLE "enterprise_risk_aggregation" ADD CONSTRAINT IF NOT EXISTS "chk_enterprise_risk_systems_logical" 
CHECK ("systems_assessed" <= "total_systems" AND "systems_assessed" >= 0);

ALTER TABLE "enterprise_risk_aggregation" ADD CONSTRAINT IF NOT EXISTS "chk_enterprise_risk_score_valid" 
CHECK ("overall_risk_score" >= 0 AND "overall_risk_score" <= 100);

ALTER TABLE "enterprise_risk_aggregation" ADD CONSTRAINT IF NOT EXISTS "chk_enterprise_risk_period_valid" 
CHECK ("period_type" IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'));

-- =====================================================
-- CORRELATION ANALYSIS FUNCTIONS
-- =====================================================

-- Function to get correlations affecting a specific system
CREATE OR REPLACE FUNCTION get_system_correlations(
  p_system_id INTEGER
) RETURNS TABLE(
  correlation_id VARCHAR,
  correlation_type VARCHAR,
  title VARCHAR,
  severity VARCHAR,
  confidence DECIMAL,
  risk_score DECIMAL,
  status VARCHAR,
  detected_at TIMESTAMP,
  affected_systems_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csc.correlation_id,
    csc.correlation_type,
    csc.title,
    csc.severity,
    csc.confidence,
    csc.risk_score,
    csc.status,
    csc.detected_at,
    jsonb_array_length(csc.system_ids) as affected_systems_count
  FROM cross_system_correlations csc
  WHERE csc.system_ids ? p_system_id::text
  ORDER BY 
    CASE csc.severity 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
    END,
    csc.detected_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get correlation statistics by type
CREATE OR REPLACE FUNCTION get_correlation_statistics(
  p_days_back INTEGER DEFAULT 30
) RETURNS TABLE(
  correlation_type VARCHAR,
  total_correlations INTEGER,
  active_correlations INTEGER,
  critical_correlations INTEGER,
  high_correlations INTEGER,
  avg_confidence DECIMAL,
  avg_risk_score DECIMAL,
  avg_systems_affected DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csc.correlation_type,
    COUNT(*)::INTEGER as total_correlations,
    COUNT(CASE WHEN csc.status = 'active' THEN 1 END)::INTEGER as active_correlations,
    COUNT(CASE WHEN csc.severity = 'critical' THEN 1 END)::INTEGER as critical_correlations,
    COUNT(CASE WHEN csc.severity = 'high' THEN 1 END)::INTEGER as high_correlations,
    ROUND(AVG(csc.confidence), 2) as avg_confidence,
    ROUND(AVG(csc.risk_score), 2) as avg_risk_score,
    ROUND(AVG(jsonb_array_length(csc.system_ids)), 1) as avg_systems_affected
  FROM cross_system_correlations csc
  WHERE csc.detected_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY csc.correlation_type
  ORDER BY total_correlations DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to generate enterprise risk aggregation
CREATE OR REPLACE FUNCTION generate_enterprise_risk_aggregation(
  p_period_type VARCHAR DEFAULT 'daily'
) RETURNS INTEGER AS $$
DECLARE
  v_total_systems INTEGER;
  v_systems_assessed INTEGER;
  v_overall_risk_score DECIMAL;
  v_risk_level risk_level;
  v_critical_vulns INTEGER;
  v_high_vulns INTEGER;
  v_compliance_score DECIMAL;
  v_aggregation_date TIMESTAMP;
  inserted_id INTEGER;
BEGIN
  -- Set aggregation date based on period type
  CASE p_period_type
    WHEN 'daily' THEN v_aggregation_date := DATE_TRUNC('day', NOW());
    WHEN 'weekly' THEN v_aggregation_date := DATE_TRUNC('week', NOW());
    WHEN 'monthly' THEN v_aggregation_date := DATE_TRUNC('month', NOW());
    ELSE v_aggregation_date := DATE_TRUNC('day', NOW());
  END CASE;
  
  -- Calculate metrics
  SELECT COUNT(*) INTO v_total_systems FROM systems;
  
  SELECT COUNT(*) INTO v_systems_assessed 
  FROM system_security_posture 
  WHERE last_assessment >= v_aggregation_date - INTERVAL '30 days';
  
  SELECT COALESCE(AVG(overall_score), 0) INTO v_overall_risk_score
  FROM system_security_posture 
  WHERE last_assessment >= v_aggregation_date - INTERVAL '30 days';
  
  -- Determine risk level based on overall score
  CASE 
    WHEN v_overall_risk_score >= 90 THEN v_risk_level := 'low';
    WHEN v_overall_risk_score >= 70 THEN v_risk_level := 'medium';
    WHEN v_overall_risk_score >= 50 THEN v_risk_level := 'high';
    ELSE v_risk_level := 'critical';
  END CASE;
  
  -- Count vulnerabilities (placeholder - would integrate with vulnerability data)
  v_critical_vulns := 0;
  v_high_vulns := 0;
  
  -- Calculate compliance score
  SELECT COALESCE(AVG(compliance_score), 0) INTO v_compliance_score
  FROM system_security_posture 
  WHERE last_assessment >= v_aggregation_date - INTERVAL '30 days';
  
  -- Insert aggregation record
  INSERT INTO enterprise_risk_aggregation (
    aggregation_date, period_type, total_systems, systems_assessed,
    overall_risk_score, risk_level, critical_vulnerabilities, high_vulnerabilities,
    compliance_score
  ) VALUES (
    v_aggregation_date, p_period_type, v_total_systems, v_systems_assessed,
    v_overall_risk_score, v_risk_level, v_critical_vulns, v_high_vulns,
    v_compliance_score
  ) RETURNING id INTO inserted_id;
  
  RETURN inserted_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CORRELATION REPORTING VIEWS
-- =====================================================

-- View for active correlations dashboard
CREATE OR REPLACE VIEW active_correlations_dashboard AS
SELECT 
  csc.correlation_id,
  csc.correlation_type,
  csc.title,
  csc.severity,
  csc.confidence,
  csc.risk_score,
  csc.detected_at,
  EXTRACT(DAY FROM (NOW() - csc.detected_at))::INTEGER as days_active,
  jsonb_array_length(csc.system_ids) as systems_affected,
  csc.assigned_to,
  u.first_name || ' ' || u.last_name as assigned_to_name,
  CASE 
    WHEN csc.severity = 'critical' AND csc.detected_at < NOW() - INTERVAL '1 day' THEN 'overdue'
    WHEN csc.severity = 'high' AND csc.detected_at < NOW() - INTERVAL '3 days' THEN 'overdue'
    WHEN csc.severity = 'medium' AND csc.detected_at < NOW() - INTERVAL '7 days' THEN 'overdue'
    ELSE 'on_time'
  END as resolution_status
FROM cross_system_correlations csc
LEFT JOIN users u ON csc.assigned_to = u.id
WHERE csc.status = 'active'
ORDER BY 
  CASE csc.severity 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    WHEN 'low' THEN 4 
  END,
  csc.detected_at ASC;

-- View for enterprise risk trends
CREATE OR REPLACE VIEW enterprise_risk_trends AS
SELECT 
  era.aggregation_date,
  era.period_type,
  era.overall_risk_score,
  era.risk_level,
  era.total_systems,
  era.systems_assessed,
  ROUND((era.systems_assessed::DECIMAL / era.total_systems * 100), 2) as assessment_coverage,
  era.compliance_score,
  era.control_effectiveness,
  era.threat_exposure,
  LAG(era.overall_risk_score) OVER (
    PARTITION BY era.period_type 
    ORDER BY era.aggregation_date
  ) as previous_risk_score,
  era.overall_risk_score - LAG(era.overall_risk_score) OVER (
    PARTITION BY era.period_type 
    ORDER BY era.aggregation_date
  ) as risk_score_change
FROM enterprise_risk_aggregation era
ORDER BY era.aggregation_date DESC, era.period_type;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('systems/0009_systems_analysis_correlation', NOW())
ON CONFLICT ("version") DO NOTHING;
