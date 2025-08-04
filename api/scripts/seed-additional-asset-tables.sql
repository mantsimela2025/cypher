-- =====================================================
-- Additional Asset Tables Seed Data SQL Script
-- =====================================================
-- This script populates asset_operational_costs, asset_risk_mapping, 
-- asset_tags, and system_assets tables with realistic data
-- Run this AFTER assets and systems tables are populated

-- =====================================================
-- 1. ASSET OPERATIONAL COSTS
-- =====================================================
-- Generate monthly operational costs for the last 12 months for all assets

-- Clear existing data
DELETE FROM asset_operational_costs;

-- Insert operational costs for each asset for the last 12 months
INSERT INTO asset_operational_costs (
    id, year_month, power_cost, space_cost, network_cost, storage_cost,
    labor_cost, other_costs, notes, created_at, updated_at, asset_uuid
)
SELECT
    nextval('asset_operational_costs_id_seq'::regclass),
    date_month::date,
    -- Power costs based on asset type
    CASE
        WHEN a.hostname LIKE '%server%' THEN (150 + random() * 200)::numeric(10,2)  -- $150-350/month
        WHEN a.hostname LIKE '%db%' THEN (200 + random() * 300)::numeric(10,2)      -- $200-500/month
        WHEN a.hostname LIKE '%workstation%' THEN (45 + random() * 55)::numeric(10,2) -- $45-100/month
        WHEN a.hostname LIKE '%laptop%' THEN (15 + random() * 25)::numeric(10,2)    -- $15-40/month
        ELSE (80 + random() * 120)::numeric(10,2)                                   -- $80-200/month default
    END,
    -- Space costs (rack space, office space)
    CASE
        WHEN a.hostname LIKE '%server%' THEN (100 + random() * 150)::numeric(10,2)  -- $100-250/month
        WHEN a.hostname LIKE '%workstation%' THEN (50 + random() * 50)::numeric(10,2) -- $50-100/month
        WHEN a.hostname LIKE '%laptop%' THEN 0                                      -- No space cost for laptops
        ELSE (75 + random() * 75)::numeric(10,2)                                    -- $75-150/month default
    END,
    -- Network costs
    CASE
        WHEN a.hostname LIKE '%server%' THEN (25 + random() * 75)::numeric(10,2)    -- $25-100/month
        WHEN a.hostname LIKE '%fw%' OR a.hostname LIKE '%sw%' THEN (50 + random() * 150)::numeric(10,2) -- $50-200/month
        ELSE (10 + random() * 40)::numeric(10,2)                                    -- $10-50/month default
    END,
    -- Storage costs
    CASE
        WHEN a.hostname LIKE '%db%' THEN (200 + random() * 400)::numeric(10,2)      -- $200-600/month
        WHEN a.hostname LIKE '%server%' THEN (50 + random() * 150)::numeric(10,2)   -- $50-200/month
        WHEN a.hostname LIKE '%backup%' THEN (300 + random() * 500)::numeric(10,2)  -- $300-800/month
        ELSE (20 + random() * 80)::numeric(10,2)                                    -- $20-100/month default
    END,
    -- Labor costs (maintenance, support)
    CASE
        WHEN a.hostname LIKE '%server%' THEN (200 + random() * 300)::numeric(10,2)  -- $200-500/month
        WHEN a.hostname LIKE '%db%' THEN (300 + random() * 400)::numeric(10,2)      -- $300-700/month
        WHEN a.hostname LIKE '%workstation%' THEN (50 + random() * 100)::numeric(10,2) -- $50-150/month
        ELSE (100 + random() * 200)::numeric(10,2)                                  -- $100-300/month default
    END,
    -- Other costs (licenses, misc)
    (25 + random() * 75)::numeric(10,2),                                            -- $25-100/month
    -- Notes
    'Monthly operational costs for ' || TO_CHAR(date_month, 'Month YYYY'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    a.asset_uuid
FROM 
    assets a
CROSS JOIN 
    generate_series(
        DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months'),
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
    ) AS date_month
WHERE a.asset_uuid IS NOT NULL;

-- =====================================================
-- 2. ASSET RISK MAPPING
-- =====================================================
-- Map assets to risk models and cost centers

-- Clear existing data
DELETE FROM asset_risk_mapping;

-- Insert risk mappings for all assets
INSERT INTO asset_risk_mapping (
    id, asset_uuid, existing_asset_id, risk_model_id, cost_center_id, 
    mapping_confidence, mapping_method, mapping_criteria, verified_by, 
    verified_at, created_at, updated_at
)
SELECT
    nextval('asset_risk_mapping_id_seq'::regclass),
    a.asset_uuid,
    a.id,  -- Use the asset's database ID as existing_asset_id
    -- Risk model ID based on asset type and criticality
    CASE
        WHEN a.criticality_rating = 'high' THEN (101 + (a.id % 5))     -- Risk models 101-105 for high criticality
        WHEN a.criticality_rating = 'medium' THEN (201 + (a.id % 10))  -- Risk models 201-210 for medium criticality
        WHEN a.criticality_rating = 'low' THEN (301 + (a.id % 15))     -- Risk models 301-315 for low criticality
        ELSE (401 + (a.id % 5))                                        -- Risk models 401-405 for unknown
    END,
    -- Cost center ID based on system and asset type
    CASE
        WHEN a.system_id = 'SYS-001' THEN 1001  -- Infrastructure cost center
        WHEN a.system_id = 'SYS-002' THEN 1002  -- Development cost center
        WHEN a.system_id = 'SYS-003' THEN 1003  -- Production cost center
        WHEN a.system_id = 'SYS-004' THEN 1004  -- Security cost center
        WHEN a.system_id = 'SYS-005' THEN 1005  -- Cloud cost center
        ELSE 1000                                -- General IT cost center
    END,
    -- Mapping confidence based on data quality
    CASE
        WHEN a.has_agent = true AND a.has_plugin_results = true THEN (0.90 + random() * 0.09)::numeric(3,2)  -- 0.90-0.99
        WHEN a.has_agent = true OR a.has_plugin_results = true THEN (0.75 + random() * 0.14)::numeric(3,2)   -- 0.75-0.89
        ELSE (0.60 + random() * 0.14)::numeric(3,2)                                                          -- 0.60-0.74
    END,
    -- Mapping method
    CASE
        WHEN a.has_agent = true THEN 'agent_based'
        WHEN a.has_plugin_results = true THEN 'scan_based'
        ELSE 'manual'
    END,
    -- Mapping criteria (as JSON)
    JSON_BUILD_OBJECT(
        'asset_type', COALESCE(a.hostname, 'unknown'),
        'system_id', COALESCE(a.system_id, 'unknown'),
        'criticality_rating', COALESCE(a.criticality_rating, 'unknown'),
        'exposure_score', COALESCE(a.exposure_score, 0),
        'has_agent', COALESCE(a.has_agent, false),
        'has_plugin_results', COALESCE(a.has_plugin_results, false)
    )::jsonb,
    -- Verified by (user ID - using 1 for system admin)
    1,
    -- Verified at (random time in last 30 days)
    CURRENT_TIMESTAMP - INTERVAL '1 day' * (random() * 30),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL;

-- =====================================================
-- 3. ASSET TAGS
-- =====================================================
-- Add various tags to assets for categorization and management

-- Clear existing data
DELETE FROM asset_tags;

-- Insert environment tags
INSERT INTO asset_tags (id, asset_uuid, tag_key, tag_value, created_at)
SELECT
    nextval('asset_tags_id_seq'::regclass),
    a.asset_uuid,
    'environment',
    CASE
        WHEN a.system_id = 'SYS-001' THEN 'infrastructure'
        WHEN a.system_id = 'SYS-002' THEN 'development'
        WHEN a.system_id = 'SYS-003' THEN 'production'
        WHEN a.system_id = 'SYS-004' THEN 'security'
        WHEN a.system_id = 'SYS-005' THEN 'cloud'
        ELSE 'general'
    END,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL;

-- Insert asset type tags
INSERT INTO asset_tags (id, asset_uuid, tag_key, tag_value, created_at)
SELECT
    nextval('asset_tags_id_seq'::regclass),
    a.asset_uuid,
    'asset_type',
    CASE
        WHEN a.hostname LIKE '%server%' THEN 'server'
        WHEN a.hostname LIKE '%workstation%' THEN 'workstation'
        WHEN a.hostname LIKE '%laptop%' THEN 'laptop'
        WHEN a.hostname LIKE '%printer%' THEN 'printer'
        WHEN a.hostname LIKE '%scanner%' THEN 'scanner'
        WHEN a.hostname LIKE '%fw%' THEN 'firewall'
        WHEN a.hostname LIKE '%sw%' THEN 'switch'
        WHEN a.hostname LIKE '%ups%' THEN 'ups'
        ELSE 'other'
    END,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL;

-- Insert criticality tags
INSERT INTO asset_tags (id, asset_uuid, tag_key, tag_value, created_at)
SELECT
    nextval('asset_tags_id_seq'::regclass),
    a.asset_uuid,
    'criticality',
    COALESCE(a.criticality_rating, 'unknown'),
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL;

-- Insert location tags (simulated data centers and offices)
INSERT INTO asset_tags (id, asset_uuid, tag_key, tag_value, created_at)
SELECT
    nextval('asset_tags_id_seq'::regclass),
    a.asset_uuid,
    'location',
    CASE
        WHEN a.id % 4 = 0 THEN 'datacenter-east'
        WHEN a.id % 4 = 1 THEN 'datacenter-west'
        WHEN a.id % 4 = 2 THEN 'office-hq'
        ELSE 'office-branch'
    END,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL;

-- Insert department tags
INSERT INTO asset_tags (id, asset_uuid, tag_key, tag_value, created_at)
SELECT
    nextval('asset_tags_id_seq'::regclass),
    a.asset_uuid,
    'department',
    CASE
        WHEN a.hostname LIKE '%web%' OR a.hostname LIKE '%app%' THEN 'engineering'
        WHEN a.hostname LIKE '%db%' THEN 'data'
        WHEN a.hostname LIKE '%mail%' OR a.hostname LIKE '%file%' THEN 'operations'
        WHEN a.hostname LIKE '%workstation%' OR a.hostname LIKE '%laptop%' THEN 'general'
        WHEN a.hostname LIKE '%fw%' OR a.hostname LIKE '%sw%' THEN 'network'
        ELSE 'infrastructure'
    END,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL;

-- Insert compliance tags
INSERT INTO asset_tags (id, asset_uuid, tag_key, tag_value, created_at)
SELECT
    nextval('asset_tags_id_seq'::regclass),
    a.asset_uuid,
    'compliance',
    CASE
        WHEN a.criticality_rating = 'high' THEN 'sox-compliant'
        WHEN a.hostname LIKE '%db%' THEN 'pci-dss'
        WHEN a.system_id = 'SYS-004' THEN 'fisma-moderate'
        ELSE 'standard'
    END,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL;

-- =====================================================
-- 4. SYSTEM ASSETS
-- =====================================================
-- Link assets to systems (many-to-many relationship)

-- Clear existing data
DELETE FROM system_assets;

-- Insert primary system assignments (each asset belongs to its primary system)
INSERT INTO system_assets (id, system_id, asset_uuid, assignment_type, created_at)
SELECT
    nextval('system_assets_id_seq'::regclass),
    a.system_id,
    a.asset_uuid,
    'primary',
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL AND a.system_id IS NOT NULL;

-- Insert secondary system assignments (some assets support multiple systems)
-- Database servers might support multiple applications
INSERT INTO system_assets (id, system_id, asset_uuid, assignment_type, created_at)
SELECT
    nextval('system_assets_id_seq'::regclass),
    CASE
        WHEN a.system_id = 'SYS-001' THEN 'SYS-002'  -- Infrastructure also supports development
        WHEN a.system_id = 'SYS-002' THEN 'SYS-003'  -- Development also supports production
        ELSE 'SYS-001'                               -- Others also support infrastructure
    END,
    a.asset_uuid,
    'secondary',
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.asset_uuid IS NOT NULL 
  AND a.system_id IS NOT NULL
  AND a.hostname LIKE '%db%'  -- Only database servers have secondary assignments
  AND random() > 0.5;         -- 50% chance of secondary assignment

-- Insert shared system assignments (network infrastructure shared across systems)
INSERT INTO system_assets (id, system_id, asset_uuid, assignment_type, created_at)
SELECT
    nextval('system_assets_id_seq'::regclass),
    s.system_id,
    a.asset_uuid,
    'shared',
    CURRENT_TIMESTAMP
FROM assets a
CROSS JOIN (
    SELECT DISTINCT system_id FROM systems WHERE system_id != 'SYS-004'  -- Exclude security system
) s
WHERE a.asset_uuid IS NOT NULL
  AND (a.hostname LIKE '%fw%' OR a.hostname LIKE '%sw%' OR a.hostname LIKE '%dns%' OR a.hostname LIKE '%dhcp%')
  AND s.system_id != a.system_id;  -- Don't duplicate primary assignment

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show summary of populated data
SELECT 'ASSET OPERATIONAL COSTS:' as section;
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT asset_uuid) as unique_assets,
    MIN(year_month) as earliest_month,
    MAX(year_month) as latest_month,
    ROUND(AVG(power_cost + space_cost + network_cost + storage_cost + labor_cost + other_costs), 2) as avg_monthly_cost
FROM asset_operational_costs;

SELECT 'ASSET RISK MAPPING:' as section;
SELECT 
    COUNT(*) as total_mappings,
    COUNT(DISTINCT asset_uuid) as unique_assets,
    ROUND(AVG(mapping_confidence), 2) as avg_confidence,
    COUNT(CASE WHEN mapping_method = 'agent_based' THEN 1 END) as agent_based,
    COUNT(CASE WHEN mapping_method = 'scan_based' THEN 1 END) as scan_based,
    COUNT(CASE WHEN mapping_method = 'manual' THEN 1 END) as manual
FROM asset_risk_mapping;

SELECT 'ASSET TAGS:' as section;
SELECT 
    COUNT(*) as total_tags,
    COUNT(DISTINCT asset_uuid) as unique_assets,
    COUNT(DISTINCT tag_key) as unique_tag_keys
FROM asset_tags;

SELECT 'TAG BREAKDOWN:' as section;
SELECT 
    tag_key,
    COUNT(*) as tag_count,
    COUNT(DISTINCT tag_value) as unique_values
FROM asset_tags
GROUP BY tag_key
ORDER BY tag_key;

SELECT 'SYSTEM ASSETS:' as section;
SELECT 
    COUNT(*) as total_assignments,
    COUNT(DISTINCT asset_uuid) as unique_assets,
    COUNT(DISTINCT system_id) as unique_systems,
    COUNT(CASE WHEN assignment_type = 'primary' THEN 1 END) as primary_assignments,
    COUNT(CASE WHEN assignment_type = 'secondary' THEN 1 END) as secondary_assignments,
    COUNT(CASE WHEN assignment_type = 'shared' THEN 1 END) as shared_assignments
FROM system_assets;

SELECT 'SYSTEM ASSIGNMENT BREAKDOWN:' as section;
SELECT 
    system_id,
    assignment_type,
    COUNT(*) as asset_count
FROM system_assets
GROUP BY system_id, assignment_type
ORDER BY system_id, assignment_type;
