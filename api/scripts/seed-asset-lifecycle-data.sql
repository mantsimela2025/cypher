-- =====================================================
-- Asset Lifecycle Data SQL Script
-- =====================================================
-- This script creates sample data for the asset_lifecycle table
-- Run this AFTER assets are already created in the database
--
-- IMPORTANT: Every asset MUST have at least one lifecycle record
-- This is essential for asset management, budgeting, and replacement planning

-- Clear existing asset_lifecycle data
DELETE FROM asset_lifecycle;

-- Reset sequence if needed
-- ALTER SEQUENCE asset_lifecycle_id_seq RESTART WITH 1;

-- Insert Asset Lifecycle Data for ALL assets
-- This ensures every asset gets a lifecycle record with realistic data
INSERT INTO public.asset_lifecycle (
    id, 
    asset_uuid,
    purchase_date, 
    warranty_end_date, 
    manufacturer_eol_date, 
    internal_eol_date, 
    replacement_cycle_months, 
    estimated_replacement_cost, 
    replacement_budget_year, 
    replacement_budget_quarter, 
    replacement_notes, 
    created_at, 
    updated_at
)
SELECT 
    nextval('asset_lifecycle_id_seq'::regclass),
    a.asset_uuid,
    -- Purchase date: Random date between 1-5 years ago
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4))::date,
    -- Warranty end date: Purchase date + 1-3 years
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4) + INTERVAL '1 year' * (1 + random() * 2))::date,
    -- Manufacturer EOL: Purchase date + 3-7 years
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4) + INTERVAL '1 year' * (3 + random() * 4))::date,
    -- Internal EOL: Purchase date + 2-5 years
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4) + INTERVAL '1 year' * (2 + random() * 3))::date,
    -- Replacement cycle based on asset type
    CASE 
        WHEN a.hostname LIKE '%server%' THEN 60  -- 5 years for servers
        WHEN a.hostname LIKE '%workstation%' OR a.hostname LIKE '%laptop%' OR a.hostname LIKE '%pc%' THEN 36  -- 3 years for workstations
        WHEN a.hostname LIKE '%switch%' OR a.hostname LIKE '%router%' OR a.hostname LIKE '%fw%' THEN 84  -- 7 years for network equipment
        WHEN a.hostname LIKE '%storage%' OR a.hostname LIKE '%san%' OR a.hostname LIKE '%nas%' THEN 72  -- 6 years for storage
        ELSE 48  -- 4 years default
    END,
    -- Estimated replacement cost based on asset type
    CASE 
        WHEN a.hostname LIKE '%server%' THEN (5000 + random() * 15000)::numeric(10,2)  -- $5K-20K for servers
        WHEN a.hostname LIKE '%workstation%' OR a.hostname LIKE '%laptop%' OR a.hostname LIKE '%pc%' THEN (800 + random() * 2200)::numeric(10,2)  -- $800-3K for workstations
        WHEN a.hostname LIKE '%switch%' OR a.hostname LIKE '%router%' THEN (2000 + random() * 8000)::numeric(10,2)  -- $2K-10K for network equipment
        WHEN a.hostname LIKE '%fw%' THEN (3000 + random() * 12000)::numeric(10,2)  -- $3K-15K for firewalls
        WHEN a.hostname LIKE '%storage%' OR a.hostname LIKE '%san%' OR a.hostname LIKE '%nas%' THEN (8000 + random() * 22000)::numeric(10,2)  -- $8K-30K for storage
        ELSE (1000 + random() * 4000)::numeric(10,2)  -- $1K-5K default
    END,
    -- Budget year: Current year + 1-3 years based on remaining lifecycle
    EXTRACT(YEAR FROM CURRENT_DATE) + (1 + (random() * 2)::int),
    -- Budget quarter: Random quarter 1-4
    (1 + (random() * 3)::int),
    -- Replacement notes based on asset type
    CASE 
        WHEN a.hostname LIKE '%server%' THEN 'Server hardware refresh - consider virtualization consolidation'
        WHEN a.hostname LIKE '%workstation%' OR a.hostname LIKE '%laptop%' OR a.hostname LIKE '%pc%' THEN 'End-user device replacement - evaluate remote work requirements'
        WHEN a.hostname LIKE '%switch%' OR a.hostname LIKE '%router%' THEN 'Network infrastructure upgrade - assess bandwidth requirements'
        WHEN a.hostname LIKE '%fw%' THEN 'Security appliance replacement - ensure latest threat protection'
        WHEN a.hostname LIKE '%storage%' OR a.hostname LIKE '%san%' OR a.hostname LIKE '%nas%' THEN 'Storage system upgrade - evaluate cloud migration options'
        ELSE 'Standard asset replacement cycle - review business requirements'
    END,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM assets a
ORDER BY a.id;

-- Insert additional lifecycle records for critical assets (servers) with extended warranties
INSERT INTO public.asset_lifecycle (
    id, 
    asset_uuid,
    purchase_date, 
    warranty_end_date, 
    manufacturer_eol_date, 
    internal_eol_date, 
    replacement_cycle_months, 
    estimated_replacement_cost, 
    replacement_budget_year, 
    replacement_budget_quarter, 
    replacement_notes, 
    created_at, 
    updated_at
)
SELECT 
    nextval('asset_lifecycle_id_seq'::regclass),
    a.asset_uuid,
    -- Extended warranty purchase (6 months after original)
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4) + INTERVAL '6 months')::date,
    -- Extended warranty end date: Original + 2 more years
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4) + INTERVAL '1 year' * (3 + random() * 2))::date,
    -- Same manufacturer EOL
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4) + INTERVAL '1 year' * (3 + random() * 4))::date,
    -- Same internal EOL
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 4) + INTERVAL '1 year' * (2 + random() * 3))::date,
    60,  -- 5 years for servers
    (2000 + random() * 5000)::numeric(10,2),  -- Extended warranty cost
    EXTRACT(YEAR FROM CURRENT_DATE) + (1 + (random() * 2)::int),
    (1 + (random() * 3)::int),
    'Extended warranty coverage - critical production system',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.hostname LIKE '%server%' AND a.criticality_rating IN ('high', 'critical')
ORDER BY a.id
LIMIT 5;

-- Verify the inserts
SELECT 
    al.id,
    al.asset_uuid,
    a.hostname,
    al.purchase_date,
    al.warranty_end_date,
    al.manufacturer_eol_date,
    al.internal_eol_date,
    al.replacement_cycle_months,
    al.estimated_replacement_cost,
    al.replacement_budget_year,
    al.replacement_budget_quarter,
    LEFT(al.replacement_notes, 50) || '...' as notes_preview
FROM asset_lifecycle al
JOIN assets a ON al.asset_uuid = a.asset_uuid
ORDER BY al.id;

-- Show summary statistics
SELECT 
    CASE 
        WHEN replacement_cycle_months = 36 THEN 'Workstations (3yr)'
        WHEN replacement_cycle_months = 48 THEN 'Default (4yr)'
        WHEN replacement_cycle_months = 60 THEN 'Servers (5yr)'
        WHEN replacement_cycle_months = 72 THEN 'Storage (6yr)'
        WHEN replacement_cycle_months = 84 THEN 'Network (7yr)'
        ELSE 'Other'
    END as asset_category,
    COUNT(*) as count,
    AVG(estimated_replacement_cost)::numeric(10,2) as avg_replacement_cost,
    SUM(estimated_replacement_cost)::numeric(10,2) as total_replacement_cost
FROM asset_lifecycle
GROUP BY replacement_cycle_months
ORDER BY replacement_cycle_months;

-- Show assets without lifecycle records (should be 0)
SELECT COUNT(*) as assets_without_lifecycle
FROM assets a
LEFT JOIN asset_lifecycle al ON a.asset_uuid = al.asset_uuid
WHERE al.asset_uuid IS NULL;

-- Show total counts
SELECT 
    (SELECT COUNT(*) FROM assets) as total_assets,
    (SELECT COUNT(*) FROM asset_lifecycle) as total_lifecycle_records,
    (SELECT COUNT(DISTINCT asset_uuid) FROM asset_lifecycle) as assets_with_lifecycle;

COMMIT;
