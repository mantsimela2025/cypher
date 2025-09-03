-- Migration: performance/0003_performance_indexes.sql
-- Description: Add advanced performance indexes, constraints, and optimization features
-- Author: Asset Management System
-- Date: 2024-01-19
-- Rollback: DROP INDEX IF EXISTS [all indexes listed below]; DROP FUNCTION IF EXISTS [all functions listed below] CASCADE;

-- =====================================================
-- ADVANCED PERFORMANCE INDEXES
-- =====================================================

-- Full-text search indexes for assets
CREATE INDEX IF NOT EXISTS "idx_assets_fulltext_search" ON "assets" 
USING gin(to_tsvector('english', 
  "name" || ' ' || 
  COALESCE("description", '') || ' ' || 
  COALESCE("manufacturer", '') || ' ' || 
  COALESCE("model", '') || ' ' ||
  COALESCE("asset_tag", '') || ' ' ||
  COALESCE("serial_number", '')
));

-- JSON indexes for specifications and custom fields
CREATE INDEX IF NOT EXISTS "idx_assets_specifications_gin" ON "assets" USING gin("specifications");
CREATE INDEX IF NOT EXISTS "idx_assets_custom_fields_gin" ON "assets" USING gin("custom_fields");

-- Array index for tags
CREATE INDEX IF NOT EXISTS "idx_assets_tags_gin" ON "assets" USING gin("tags");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "idx_assets_status_type_location" ON "assets" 
("status", "asset_type_id", "location_id") WHERE "is_deleted" = false;

CREATE INDEX IF NOT EXISTS "idx_assets_active_by_type" ON "assets" 
("asset_type_id", "status") WHERE "is_deleted" = false AND "status" IN ('active', 'deployed');

-- Date range indexes for reporting and filtering
CREATE INDEX IF NOT EXISTS "idx_assets_purchase_date_range" ON "assets" 
("purchase_date") WHERE "purchase_date" IS NOT NULL AND "is_deleted" = false;

CREATE INDEX IF NOT EXISTS "idx_assets_created_date_range" ON "assets" 
("created_at") WHERE "is_deleted" = false;

-- Warranty expiration index for alerts
CREATE INDEX IF NOT EXISTS "idx_assets_warranty_expiring" ON "assets" 
("warranty_end_date") WHERE "warranty_end_date" IS NOT NULL AND "is_deleted" = false;

-- Network-related indexes
CREATE INDEX IF NOT EXISTS "idx_assets_network_info" ON "assets" 
("ip_address", "hostname") WHERE "ip_address" IS NOT NULL OR "hostname" IS NOT NULL;

-- Maintenance indexes
CREATE INDEX IF NOT EXISTS "idx_assets_maintenance_due" ON "assets" 
("next_maintenance_date") WHERE "next_maintenance_date" IS NOT NULL AND "is_deleted" = false;

-- Assignment and ownership indexes
CREATE INDEX IF NOT EXISTS "idx_assets_assigned_active" ON "assets" 
("assigned_to", "status") WHERE "assigned_to" IS NOT NULL AND "is_deleted" = false;

-- Financial reporting indexes
CREATE INDEX IF NOT EXISTS "idx_assets_financial_active" ON "assets" 
("purchase_price", "current_value", "purchase_date") 
WHERE "purchase_price" IS NOT NULL AND "is_deleted" = false;

-- =====================================================
-- UNIQUE CONSTRAINTS WITH CONDITIONS
-- =====================================================

-- Asset tag uniqueness (only for non-deleted assets)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_assets_asset_tag_unique" 
ON "assets" ("asset_tag") 
WHERE "asset_tag" IS NOT NULL AND "is_deleted" = false;

-- Serial number uniqueness within manufacturer (only for non-deleted assets)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_assets_serial_manufacturer_unique" 
ON "assets" ("serial_number", "manufacturer") 
WHERE "serial_number" IS NOT NULL AND "manufacturer" IS NOT NULL AND "is_deleted" = false;

-- IP address uniqueness (only for active assets)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_assets_ip_address_unique" 
ON "assets" ("ip_address") 
WHERE "ip_address" IS NOT NULL AND "status" IN ('active', 'deployed') AND "is_deleted" = false;

-- Hostname uniqueness (only for active assets)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_assets_hostname_unique" 
ON "assets" ("hostname") 
WHERE "hostname" IS NOT NULL AND "status" IN ('active', 'deployed') AND "is_deleted" = false;

-- =====================================================
-- ADVANCED CHECK CONSTRAINTS
-- =====================================================

-- Lifecycle dates validation
ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_lifecycle_dates" 
CHECK (
  ("purchase_date" IS NULL OR "deployment_date" IS NULL OR "purchase_date" <= "deployment_date") AND
  ("deployment_date" IS NULL OR "retirement_date" IS NULL OR "deployment_date" <= "retirement_date") AND
  ("retirement_date" IS NULL OR "disposal_date" IS NULL OR "retirement_date" <= "disposal_date")
);

-- Network information validation
ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_ip_address_format" 
CHECK ("ip_address" IS NULL OR "ip_address" ~ '^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$');

ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_mac_address_format" 
CHECK ("mac_address" IS NULL OR "mac_address" ~ '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$');

-- Financial constraints
ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_depreciation_logical" 
CHECK ("purchase_price" IS NULL OR "current_value" IS NULL OR "current_value" <= "purchase_price" * 1.5);

-- =====================================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function to update asset current value based on depreciation
CREATE OR REPLACE FUNCTION calculate_asset_depreciation(
  p_asset_id INTEGER,
  p_depreciation_rate DECIMAL DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  v_purchase_price DECIMAL;
  v_purchase_date TIMESTAMP;
  v_depreciation_rate DECIMAL;
  v_age_years DECIMAL;
  v_depreciated_value DECIMAL;
BEGIN
  -- Get asset information
  SELECT a.purchase_price, a.purchase_date, at.depreciation_rate
  INTO v_purchase_price, v_purchase_date, v_depreciation_rate
  FROM assets a
  JOIN asset_types at ON a.asset_type_id = at.id
  WHERE a.id = p_asset_id;
  
  -- Use provided rate or default from asset type
  v_depreciation_rate := COALESCE(p_depreciation_rate, v_depreciation_rate, 20);
  
  -- Calculate age in years
  v_age_years := EXTRACT(EPOCH FROM (NOW() - v_purchase_date)) / (365.25 * 24 * 3600);
  
  -- Calculate depreciated value (straight-line depreciation)
  v_depreciated_value := v_purchase_price * (1 - (v_depreciation_rate / 100.0 * v_age_years));
  
  -- Ensure minimum value (10% of original)
  v_depreciated_value := GREATEST(v_depreciated_value, v_purchase_price * 0.1);
  
  RETURN ROUND(v_depreciated_value, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get assets requiring maintenance
CREATE OR REPLACE FUNCTION get_assets_requiring_maintenance(
  p_days_ahead INTEGER DEFAULT 30
) RETURNS TABLE(
  asset_id INTEGER,
  asset_name VARCHAR,
  asset_tag VARCHAR,
  next_maintenance_date TIMESTAMP,
  days_until_maintenance INTEGER,
  maintenance_type VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.asset_tag,
    a.next_maintenance_date,
    EXTRACT(DAY FROM (a.next_maintenance_date - NOW()))::INTEGER,
    CASE 
      WHEN a.next_maintenance_date <= NOW() THEN 'overdue'
      WHEN a.next_maintenance_date <= NOW() + INTERVAL '7 days' THEN 'urgent'
      WHEN a.next_maintenance_date <= NOW() + INTERVAL '30 days' THEN 'upcoming'
      ELSE 'scheduled'
    END
  FROM assets a
  WHERE a.next_maintenance_date IS NOT NULL
    AND a.next_maintenance_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND a.is_deleted = false
    AND a.status IN ('active', 'deployed', 'maintenance')
  ORDER BY a.next_maintenance_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get warranty expiration alerts
CREATE OR REPLACE FUNCTION get_warranty_expiration_alerts(
  p_days_ahead INTEGER DEFAULT 90
) RETURNS TABLE(
  asset_id INTEGER,
  asset_name VARCHAR,
  asset_tag VARCHAR,
  warranty_end_date TIMESTAMP,
  days_until_expiry INTEGER,
  warranty_provider VARCHAR,
  urgency_level VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.name,
    a.asset_tag,
    a.warranty_end_date,
    EXTRACT(DAY FROM (a.warranty_end_date - NOW()))::INTEGER,
    a.warranty_provider,
    CASE 
      WHEN a.warranty_end_date <= NOW() THEN 'expired'
      WHEN a.warranty_end_date <= NOW() + INTERVAL '30 days' THEN 'critical'
      WHEN a.warranty_end_date <= NOW() + INTERVAL '60 days' THEN 'warning'
      ELSE 'notice'
    END
  FROM assets a
  WHERE a.warranty_end_date IS NOT NULL
    AND a.warranty_end_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND a.is_deleted = false
    AND a.status IN ('active', 'deployed', 'maintenance')
  ORDER BY a.warranty_end_date ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED MAINTENANCE FUNCTIONS
-- =====================================================

-- Function to update location current counts
CREATE OR REPLACE FUNCTION update_location_asset_counts() RETURNS VOID AS $$
BEGIN
  UPDATE asset_locations 
  SET current_count = (
    SELECT COUNT(*)
    FROM assets 
    WHERE location_id = asset_locations.id 
      AND is_deleted = false
      AND status IN ('active', 'deployed', 'maintenance')
  );
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old soft-deleted records
CREATE OR REPLACE FUNCTION cleanup_old_deleted_assets(
  p_days_old INTEGER DEFAULT 365
) RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM assets 
  WHERE is_deleted = true 
    AND deleted_at < NOW() - (p_days_old || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STATISTICS AND MONITORING VIEWS
-- =====================================================

-- View for asset statistics by type
CREATE OR REPLACE VIEW asset_stats_by_type AS
SELECT 
  at.name as asset_type_name,
  at.code as asset_type_code,
  ac.name as category_name,
  COUNT(a.id) as total_assets,
  COUNT(CASE WHEN a.status = 'active' THEN 1 END) as active_assets,
  COUNT(CASE WHEN a.status = 'maintenance' THEN 1 END) as maintenance_assets,
  COUNT(CASE WHEN a.status = 'retired' THEN 1 END) as retired_assets,
  COALESCE(SUM(a.current_value), 0) as total_value,
  COALESCE(AVG(a.current_value), 0) as average_value
FROM asset_types at
LEFT JOIN asset_categories ac ON at.category_id = ac.id
LEFT JOIN assets a ON at.id = a.asset_type_id AND a.is_deleted = false
GROUP BY at.id, at.name, at.code, ac.name
ORDER BY total_assets DESC;

-- View for location utilization
CREATE OR REPLACE VIEW location_utilization AS
SELECT 
  al.name as location_name,
  al.code as location_code,
  al.type as location_type,
  al.capacity,
  al.current_count,
  CASE 
    WHEN al.capacity IS NULL THEN NULL
    ELSE ROUND((al.current_count::DECIMAL / al.capacity * 100), 2)
  END as utilization_percentage,
  CASE 
    WHEN al.capacity IS NULL THEN 'unlimited'
    WHEN al.current_count >= al.capacity THEN 'full'
    WHEN al.current_count >= al.capacity * 0.9 THEN 'high'
    WHEN al.current_count >= al.capacity * 0.7 THEN 'medium'
    ELSE 'low'
  END as utilization_level
FROM asset_locations al
WHERE al.is_active = true
ORDER BY utilization_percentage DESC NULLS LAST;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('performance/0003_performance_indexes', NOW())
ON CONFLICT ("version") DO NOTHING;
