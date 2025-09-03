-- Migration: systems/0007_systems_discovery_management.sql
-- Description: Create system discovery and scanning tables
-- Author: Systems Management Team
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS system_discovery_results, system_discovery_scans CASCADE; DROP TYPE IF EXISTS discovery_status, environment_type CASCADE;

-- =====================================================
-- SYSTEM DISCOVERY ENUMS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE "discovery_status" AS ENUM(
    'pending', 'running', 'completed', 'failed', 'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "environment_type" AS ENUM(
    'on-premises', 'cloud', 'hybrid'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- SYSTEM DISCOVERY SCANS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "system_discovery_scans" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  
  -- Discovery Configuration
  "methods" jsonb NOT NULL, -- Array of discovery methods used
  "targets" jsonb NOT NULL, -- Array of targets (IP ranges, domains, etc.)
  "schedule" varchar(100), -- CRON expression for scheduled scans
  "options" jsonb DEFAULT '{}', -- Scan options and configuration
  
  -- Execution Status
  "status" "discovery_status" DEFAULT 'pending',
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "systems_found" integer DEFAULT 0,
  "results" jsonb, -- Aggregated scan results
  "error_message" text,
  
  -- Audit Fields
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for system discovery scans
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_name" ON "system_discovery_scans" ("name");
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_status" ON "system_discovery_scans" ("status");
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_started_at" ON "system_discovery_scans" ("started_at");
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_completed_at" ON "system_discovery_scans" ("completed_at");

-- JSON indexes for discovery configuration
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_methods_gin" ON "system_discovery_scans" USING gin("methods");
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_targets_gin" ON "system_discovery_scans" USING gin("targets");
CREATE INDEX IF NOT EXISTS "idx_discovery_scans_results_gin" ON "system_discovery_scans" USING gin("results");

-- =====================================================
-- SYSTEM DISCOVERY RESULTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "system_discovery_results" (
  "id" serial PRIMARY KEY NOT NULL,
  "scan_id" integer NOT NULL,
  "system_identifier" varchar(255) NOT NULL,
  "discovery_data" jsonb NOT NULL,
  "confidence" decimal(3, 2) DEFAULT 0.5,
  "methods" jsonb NOT NULL,
  "processed" boolean DEFAULT false,
  "system_id" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "system_discovery_results_scan_id_system_discovery_scans_id_fk" 
    FOREIGN KEY ("scan_id") REFERENCES "system_discovery_scans"("id") ON DELETE cascade,
  CONSTRAINT "system_discovery_results_system_id_systems_id_fk" 
    FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE set null
);

-- Indexes for system discovery results
CREATE INDEX IF NOT EXISTS "idx_discovery_results_scan_id" ON "system_discovery_results" ("scan_id");
CREATE INDEX IF NOT EXISTS "idx_discovery_results_system_identifier" ON "system_discovery_results" ("system_identifier");
CREATE INDEX IF NOT EXISTS "idx_discovery_results_confidence" ON "system_discovery_results" ("confidence");
CREATE INDEX IF NOT EXISTS "idx_discovery_results_processed" ON "system_discovery_results" ("processed");
CREATE INDEX IF NOT EXISTS "idx_discovery_results_system_id" ON "system_discovery_results" ("system_id");

-- JSON indexes for discovery data
CREATE INDEX IF NOT EXISTS "idx_discovery_results_data_gin" ON "system_discovery_results" USING gin("discovery_data");
CREATE INDEX IF NOT EXISTS "idx_discovery_results_methods_gin" ON "system_discovery_results" USING gin("methods");

-- =====================================================
-- EXTEND SYSTEMS TABLE WITH DISCOVERY FIELDS
-- =====================================================

-- Add discovery-related columns to systems table
ALTER TABLE "systems" ADD COLUMN IF NOT EXISTS "discovery_confidence" decimal(3, 2);
ALTER TABLE "systems" ADD COLUMN IF NOT EXISTS "last_discovery_date" timestamp with time zone;
ALTER TABLE "systems" ADD COLUMN IF NOT EXISTS "environment" "environment_type";

-- Add indexes for new discovery columns
CREATE INDEX IF NOT EXISTS "idx_systems_discovery_confidence" ON "systems" ("discovery_confidence");
CREATE INDEX IF NOT EXISTS "idx_systems_last_discovery" ON "systems" ("last_discovery_date");
CREATE INDEX IF NOT EXISTS "idx_systems_environment" ON "systems" ("environment");

-- =====================================================
-- DISCOVERY VALIDATION CONSTRAINTS
-- =====================================================

-- Discovery confidence constraints
ALTER TABLE "system_discovery_results" ADD CONSTRAINT IF NOT EXISTS "chk_discovery_results_confidence_valid" 
CHECK ("confidence" >= 0.0 AND "confidence" <= 1.0);

ALTER TABLE "systems" ADD CONSTRAINT IF NOT EXISTS "chk_systems_discovery_confidence_valid" 
CHECK ("discovery_confidence" IS NULL OR ("discovery_confidence" >= 0.0 AND "discovery_confidence" <= 1.0));

-- Systems found constraint
ALTER TABLE "system_discovery_scans" ADD CONSTRAINT IF NOT EXISTS "chk_discovery_scans_systems_found_positive" 
CHECK ("systems_found" >= 0);

-- Date validation constraints
ALTER TABLE "system_discovery_scans" ADD CONSTRAINT IF NOT EXISTS "chk_discovery_scans_dates_logical" 
CHECK ("started_at" IS NULL OR "completed_at" IS NULL OR "started_at" <= "completed_at");

-- =====================================================
-- DISCOVERY MANAGEMENT FUNCTIONS
-- =====================================================

-- Function to get discovery scan statistics
CREATE OR REPLACE FUNCTION get_discovery_scan_stats(
  p_scan_id INTEGER
) RETURNS TABLE(
  scan_name VARCHAR,
  status discovery_status,
  systems_found INTEGER,
  systems_processed INTEGER,
  high_confidence_results INTEGER,
  duration_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.name,
    ds.status,
    ds.systems_found,
    COUNT(dr.id)::INTEGER as systems_processed,
    COUNT(CASE WHEN dr.confidence >= 0.8 THEN 1 END)::INTEGER as high_confidence_results,
    CASE 
      WHEN ds.started_at IS NOT NULL AND ds.completed_at IS NOT NULL THEN
        EXTRACT(EPOCH FROM (ds.completed_at - ds.started_at))::INTEGER / 60
      ELSE NULL
    END as duration_minutes
  FROM system_discovery_scans ds
  LEFT JOIN system_discovery_results dr ON ds.id = dr.scan_id
  WHERE ds.id = p_scan_id
  GROUP BY ds.id, ds.name, ds.status, ds.systems_found, ds.started_at, ds.completed_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get unprocessed discovery results
CREATE OR REPLACE FUNCTION get_unprocessed_discovery_results(
  p_confidence_threshold DECIMAL DEFAULT 0.7
) RETURNS TABLE(
  result_id INTEGER,
  scan_name VARCHAR,
  system_identifier VARCHAR,
  confidence DECIMAL,
  discovery_data JSONB,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.id,
    ds.name,
    dr.system_identifier,
    dr.confidence,
    dr.discovery_data,
    dr.created_at
  FROM system_discovery_results dr
  JOIN system_discovery_scans ds ON dr.scan_id = ds.id
  WHERE dr.processed = false
    AND dr.confidence >= p_confidence_threshold
  ORDER BY dr.confidence DESC, dr.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to mark discovery results as processed
CREATE OR REPLACE FUNCTION mark_discovery_results_processed(
  p_result_ids INTEGER[],
  p_system_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE system_discovery_results 
  SET 
    processed = true,
    system_id = COALESCE(p_system_id, system_id)
  WHERE id = ANY(p_result_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get discovery coverage by environment
CREATE OR REPLACE FUNCTION get_discovery_coverage_stats() 
RETURNS TABLE(
  environment environment_type,
  total_systems INTEGER,
  discovered_systems INTEGER,
  coverage_percentage DECIMAL,
  avg_confidence DECIMAL,
  last_discovery_date TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.environment,
    COUNT(*)::INTEGER as total_systems,
    COUNT(CASE WHEN s.last_discovery_date IS NOT NULL THEN 1 END)::INTEGER as discovered_systems,
    ROUND(
      (COUNT(CASE WHEN s.last_discovery_date IS NOT NULL THEN 1 END)::DECIMAL / COUNT(*) * 100), 2
    ) as coverage_percentage,
    ROUND(AVG(s.discovery_confidence), 2) as avg_confidence,
    MAX(s.last_discovery_date) as last_discovery_date
  FROM systems s
  WHERE s.environment IS NOT NULL
  GROUP BY s.environment
  ORDER BY coverage_percentage DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DISCOVERY AUTOMATION TRIGGERS
-- =====================================================

-- Function to update discovery statistics
CREATE OR REPLACE FUNCTION update_discovery_scan_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update systems_found count when discovery results are added
  IF TG_OP = 'INSERT' THEN
    UPDATE system_discovery_scans 
    SET systems_found = (
      SELECT COUNT(*) FROM system_discovery_results 
      WHERE scan_id = NEW.scan_id
    )
    WHERE id = NEW.scan_id;
    
    RETURN NEW;
  END IF;
  
  -- Update systems_found count when discovery results are deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE system_discovery_scans 
    SET systems_found = (
      SELECT COUNT(*) FROM system_discovery_results 
      WHERE scan_id = OLD.scan_id
    )
    WHERE id = OLD.scan_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to automatically update discovery statistics
DROP TRIGGER IF EXISTS trigger_update_discovery_scan_stats ON system_discovery_results;
CREATE TRIGGER trigger_update_discovery_scan_stats
  AFTER INSERT OR DELETE ON system_discovery_results
  FOR EACH ROW
  EXECUTE FUNCTION update_discovery_scan_stats();

-- =====================================================
-- DISCOVERY REPORTING VIEWS
-- =====================================================

-- View for discovery scan summary
CREATE OR REPLACE VIEW discovery_scan_summary AS
SELECT 
  ds.id,
  ds.name,
  ds.status,
  ds.started_at,
  ds.completed_at,
  ds.systems_found,
  COUNT(dr.id) as results_count,
  COUNT(CASE WHEN dr.processed = true THEN 1 END) as processed_count,
  COUNT(CASE WHEN dr.confidence >= 0.8 THEN 1 END) as high_confidence_count,
  ROUND(AVG(dr.confidence), 2) as avg_confidence,
  CASE 
    WHEN ds.started_at IS NOT NULL AND ds.completed_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (ds.completed_at - ds.started_at))::INTEGER / 60
    ELSE NULL
  END as duration_minutes
FROM system_discovery_scans ds
LEFT JOIN system_discovery_results dr ON ds.id = dr.scan_id
GROUP BY ds.id, ds.name, ds.status, ds.started_at, ds.completed_at, ds.systems_found
ORDER BY ds.created_at DESC;

-- View for systems discovery status
CREATE OR REPLACE VIEW systems_discovery_status AS
SELECT 
  s.id,
  s.system_id,
  s.name,
  s.environment,
  s.last_discovery_date,
  s.discovery_confidence,
  CASE 
    WHEN s.last_discovery_date IS NULL THEN 'never_discovered'
    WHEN s.last_discovery_date < NOW() - INTERVAL '30 days' THEN 'stale'
    WHEN s.last_discovery_date < NOW() - INTERVAL '7 days' THEN 'outdated'
    ELSE 'current'
  END as discovery_status,
  CASE 
    WHEN s.discovery_confidence IS NULL THEN 'unknown'
    WHEN s.discovery_confidence >= 0.9 THEN 'very_high'
    WHEN s.discovery_confidence >= 0.8 THEN 'high'
    WHEN s.discovery_confidence >= 0.6 THEN 'medium'
    ELSE 'low'
  END as confidence_level
FROM systems s
ORDER BY s.last_discovery_date DESC NULLS LAST;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('systems/0007_systems_discovery_management', NOW())
ON CONFLICT ("version") DO NOTHING;
