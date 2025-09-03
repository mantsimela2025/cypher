-- Migration: systems/0006_initial_systems_schema.sql
-- Description: Create core systems management tables (systems, impact levels)
-- Author: Systems Management Team
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS system_impact_levels, systems CASCADE;

-- =====================================================
-- CORE SYSTEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "systems" (
  "id" serial PRIMARY KEY NOT NULL,
  "system_id" varchar(50) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "uuid" uuid NOT NULL UNIQUE,
  "status" varchar(50) NOT NULL,
  
  -- Authorization and Boundary Information
  "authorization_boundary" text,
  "system_type" varchar(100),
  "responsible_organization" varchar(255),
  "system_owner" varchar(255),
  "information_system_security_officer" varchar(255),
  "authorizing_official" varchar(255),
  
  -- Assessment and Authorization Dates
  "last_assessment_date" timestamp,
  "authorization_date" timestamp,
  "authorization_termination_date" timestamp,
  
  -- System Metadata
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  "source" varchar(50) DEFAULT 'xacta',
  "batch_id" uuid,
  "raw_json" jsonb,
  
  -- Impact Levels (CIA Triad)
  "confidentiality_impact" varchar(20),
  "integrity_impact" varchar(20),
  "availability_impact" varchar(20)
);

-- Basic indexes for systems table
CREATE INDEX IF NOT EXISTS "idx_systems_system_id" ON "systems" ("system_id");
CREATE INDEX IF NOT EXISTS "idx_systems_name" ON "systems" ("name");
CREATE INDEX IF NOT EXISTS "idx_systems_uuid" ON "systems" ("uuid");
CREATE INDEX IF NOT EXISTS "idx_systems_status" ON "systems" ("status");
CREATE INDEX IF NOT EXISTS "idx_systems_type" ON "systems" ("system_type");
CREATE INDEX IF NOT EXISTS "idx_systems_owner" ON "systems" ("system_owner");
CREATE INDEX IF NOT EXISTS "idx_systems_source" ON "systems" ("source");
CREATE INDEX IF NOT EXISTS "idx_systems_batch" ON "systems" ("batch_id");

-- Date-based indexes for reporting
CREATE INDEX IF NOT EXISTS "idx_systems_last_assessment" ON "systems" ("last_assessment_date");
CREATE INDEX IF NOT EXISTS "idx_systems_authorization_date" ON "systems" ("authorization_date");
CREATE INDEX IF NOT EXISTS "idx_systems_auth_termination" ON "systems" ("authorization_termination_date");

-- Impact level indexes
CREATE INDEX IF NOT EXISTS "idx_systems_confidentiality" ON "systems" ("confidentiality_impact");
CREATE INDEX IF NOT EXISTS "idx_systems_integrity" ON "systems" ("integrity_impact");
CREATE INDEX IF NOT EXISTS "idx_systems_availability" ON "systems" ("availability_impact");

-- JSON index for raw data
CREATE INDEX IF NOT EXISTS "idx_systems_raw_json_gin" ON "systems" USING gin("raw_json");

-- =====================================================
-- SYSTEM IMPACT LEVELS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "system_impact_levels" (
  "id" serial PRIMARY KEY NOT NULL,
  "system_id" varchar(50) NOT NULL,
  "confidentiality" varchar(20) NOT NULL,
  "integrity" varchar(20) NOT NULL,
  "availability" varchar(20) NOT NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Key Constraint
  CONSTRAINT "system_impact_levels_system_id_systems_system_id_fk" 
    FOREIGN KEY ("system_id") REFERENCES "systems"("system_id") ON DELETE cascade
);

-- Indexes for system impact levels
CREATE INDEX IF NOT EXISTS "idx_system_impact_levels_system_id" ON "system_impact_levels" ("system_id");
CREATE INDEX IF NOT EXISTS "idx_system_impact_levels_confidentiality" ON "system_impact_levels" ("confidentiality");
CREATE INDEX IF NOT EXISTS "idx_system_impact_levels_integrity" ON "system_impact_levels" ("integrity");
CREATE INDEX IF NOT EXISTS "idx_system_impact_levels_availability" ON "system_impact_levels" ("availability");

-- =====================================================
-- SYSTEM STATUS AND IMPACT CONSTRAINTS
-- =====================================================

-- System status constraints
ALTER TABLE "systems" ADD CONSTRAINT IF NOT EXISTS "chk_systems_status_valid" 
CHECK ("status" IN ('operational', 'under_development', 'under_major_modification', 'disposition', 'other'));

-- Impact level constraints
ALTER TABLE "systems" ADD CONSTRAINT IF NOT EXISTS "chk_systems_confidentiality_impact_valid" 
CHECK ("confidentiality_impact" IS NULL OR "confidentiality_impact" IN ('low', 'moderate', 'high'));

ALTER TABLE "systems" ADD CONSTRAINT IF NOT EXISTS "chk_systems_integrity_impact_valid" 
CHECK ("integrity_impact" IS NULL OR "integrity_impact" IN ('low', 'moderate', 'high'));

ALTER TABLE "systems" ADD CONSTRAINT IF NOT EXISTS "chk_systems_availability_impact_valid" 
CHECK ("availability_impact" IS NULL OR "availability_impact" IN ('low', 'moderate', 'high'));

-- Impact levels table constraints
ALTER TABLE "system_impact_levels" ADD CONSTRAINT IF NOT EXISTS "chk_impact_levels_confidentiality_valid" 
CHECK ("confidentiality" IN ('low', 'moderate', 'high'));

ALTER TABLE "system_impact_levels" ADD CONSTRAINT IF NOT EXISTS "chk_impact_levels_integrity_valid" 
CHECK ("integrity" IN ('low', 'moderate', 'high'));

ALTER TABLE "system_impact_levels" ADD CONSTRAINT IF NOT EXISTS "chk_impact_levels_availability_valid" 
CHECK ("availability" IN ('low', 'moderate', 'high'));

-- Date validation constraints
ALTER TABLE "systems" ADD CONSTRAINT IF NOT EXISTS "chk_systems_authorization_dates_logical" 
CHECK ("authorization_date" IS NULL OR "authorization_termination_date" IS NULL OR "authorization_date" <= "authorization_termination_date");

ALTER TABLE "systems" ADD CONSTRAINT IF NOT EXISTS "chk_systems_assessment_date_logical" 
CHECK ("last_assessment_date" IS NULL OR "last_assessment_date" <= CURRENT_TIMESTAMP);

-- =====================================================
-- SYSTEM MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get systems by impact level
CREATE OR REPLACE FUNCTION get_systems_by_impact_level(
  p_impact_type VARCHAR,
  p_impact_level VARCHAR
) RETURNS TABLE(
  system_id VARCHAR,
  system_name VARCHAR,
  system_type VARCHAR,
  system_owner VARCHAR,
  impact_level VARCHAR
) AS $$
BEGIN
  IF p_impact_type = 'confidentiality' THEN
    RETURN QUERY
    SELECT s.system_id, s.name, s.system_type, s.system_owner, s.confidentiality_impact
    FROM systems s
    WHERE s.confidentiality_impact = p_impact_level;
  ELSIF p_impact_type = 'integrity' THEN
    RETURN QUERY
    SELECT s.system_id, s.name, s.system_type, s.system_owner, s.integrity_impact
    FROM systems s
    WHERE s.integrity_impact = p_impact_level;
  ELSIF p_impact_type = 'availability' THEN
    RETURN QUERY
    SELECT s.system_id, s.name, s.system_type, s.system_owner, s.availability_impact
    FROM systems s
    WHERE s.availability_impact = p_impact_level;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get systems requiring assessment
CREATE OR REPLACE FUNCTION get_systems_requiring_assessment(
  p_days_overdue INTEGER DEFAULT 365
) RETURNS TABLE(
  system_id VARCHAR,
  system_name VARCHAR,
  system_owner VARCHAR,
  last_assessment_date TIMESTAMP,
  days_overdue INTEGER,
  urgency_level VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.system_id,
    s.name,
    s.system_owner,
    s.last_assessment_date,
    EXTRACT(DAY FROM (NOW() - s.last_assessment_date))::INTEGER,
    CASE 
      WHEN s.last_assessment_date IS NULL THEN 'never_assessed'
      WHEN s.last_assessment_date < NOW() - INTERVAL '2 years' THEN 'critical'
      WHEN s.last_assessment_date < NOW() - INTERVAL '18 months' THEN 'high'
      WHEN s.last_assessment_date < NOW() - INTERVAL '1 year' THEN 'medium'
      ELSE 'low'
    END
  FROM systems s
  WHERE s.last_assessment_date IS NULL 
     OR s.last_assessment_date < NOW() - (p_days_overdue || ' days')::INTERVAL
  ORDER BY s.last_assessment_date ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- Function to get authorization expiration alerts
CREATE OR REPLACE FUNCTION get_authorization_expiration_alerts(
  p_days_ahead INTEGER DEFAULT 90
) RETURNS TABLE(
  system_id VARCHAR,
  system_name VARCHAR,
  system_owner VARCHAR,
  authorization_termination_date TIMESTAMP,
  days_until_expiry INTEGER,
  urgency_level VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.system_id,
    s.name,
    s.system_owner,
    s.authorization_termination_date,
    EXTRACT(DAY FROM (s.authorization_termination_date - NOW()))::INTEGER,
    CASE 
      WHEN s.authorization_termination_date <= NOW() THEN 'expired'
      WHEN s.authorization_termination_date <= NOW() + INTERVAL '30 days' THEN 'critical'
      WHEN s.authorization_termination_date <= NOW() + INTERVAL '60 days' THEN 'high'
      ELSE 'medium'
    END
  FROM systems s
  WHERE s.authorization_termination_date IS NOT NULL
    AND s.authorization_termination_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
  ORDER BY s.authorization_termination_date ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SYSTEM STATISTICS VIEWS
-- =====================================================

-- View for system statistics by type
CREATE OR REPLACE VIEW system_stats_by_type AS
SELECT 
  s.system_type,
  COUNT(*) as total_systems,
  COUNT(CASE WHEN s.status = 'operational' THEN 1 END) as operational_systems,
  COUNT(CASE WHEN s.status = 'under_development' THEN 1 END) as development_systems,
  COUNT(CASE WHEN s.confidentiality_impact = 'high' THEN 1 END) as high_confidentiality,
  COUNT(CASE WHEN s.integrity_impact = 'high' THEN 1 END) as high_integrity,
  COUNT(CASE WHEN s.availability_impact = 'high' THEN 1 END) as high_availability,
  COUNT(CASE WHEN s.last_assessment_date < NOW() - INTERVAL '1 year' OR s.last_assessment_date IS NULL THEN 1 END) as assessment_overdue
FROM systems s
GROUP BY s.system_type
ORDER BY total_systems DESC;

-- View for system authorization status
CREATE OR REPLACE VIEW system_authorization_status AS
SELECT 
  s.system_id,
  s.name,
  s.system_owner,
  s.authorization_date,
  s.authorization_termination_date,
  CASE 
    WHEN s.authorization_termination_date IS NULL THEN 'no_expiration'
    WHEN s.authorization_termination_date <= NOW() THEN 'expired'
    WHEN s.authorization_termination_date <= NOW() + INTERVAL '30 days' THEN 'expiring_soon'
    WHEN s.authorization_termination_date <= NOW() + INTERVAL '90 days' THEN 'expiring_warning'
    ELSE 'valid'
  END as authorization_status,
  CASE 
    WHEN s.authorization_termination_date IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (s.authorization_termination_date - NOW()))::INTEGER
  END as days_until_expiry
FROM systems s
ORDER BY s.authorization_termination_date ASC NULLS LAST;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('systems/0006_initial_systems_schema', NOW())
ON CONFLICT ("version") DO NOTHING;
