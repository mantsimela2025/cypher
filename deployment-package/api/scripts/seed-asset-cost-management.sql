-- Asset Cost Management Seeding Script
-- This script populates the asset_cost_management table with realistic cost data
-- mapped to existing assets in the database

-- Using actual enum values from your database:
-- Cost types: acquisition, operational, maintenance, licensing, support, training, disposal

-- Clear existing cost management data (optional - uncomment if needed)
-- DELETE FROM asset_cost_management;

-- Insert cost management data for existing assets
-- Method 1: Acquisition costs for servers
INSERT INTO asset_cost_management (
    cost_type,
    amount,
    currency,
    billing_cycle,
    start_date,
    end_date,
    vendor,
    contract_number,
    purchase_order,
    invoice_number,
    cost_center,
    budget_code,
    notes,
    attachments,
    metadata,
    created_by,
    last_modified_by,
    created_at,
    updated_at,
    asset_uuid
)
SELECT
    'acquisition'::enum_asset_cost_management_cost_type,
    CASE
        WHEN a.hostname LIKE '%server%' THEN (8000 + random() * 12000)::numeric(15,2)  -- $8K-20K for servers
        WHEN a.hostname LIKE '%db%' THEN (12000 + random() * 18000)::numeric(15,2)     -- $12K-30K for database servers
        WHEN a.hostname LIKE '%web%' THEN (6000 + random() * 9000)::numeric(15,2)      -- $6K-15K for web servers
        WHEN a.hostname LIKE '%app%' THEN (7000 + random() * 8000)::numeric(15,2)      -- $7K-15K for app servers
        ELSE (5000 + random() * 10000)::numeric(15,2)                                  -- $5K-15K default
    END,
    'USD',
    'one_time'::enum_asset_cost_management_billing_cycle,
    (CURRENT_DATE - INTERVAL '1 year' * (1 + random() * 3))::date,  -- Purchase 1-4 years ago
    NULL,
    CASE
        WHEN a.hostname LIKE '%server%' OR a.hostname LIKE '%db%' THEN 'Dell Technologies'
        WHEN a.hostname LIKE '%web%' THEN 'HPE'
        WHEN a.hostname LIKE '%app%' THEN 'Lenovo'
        WHEN a.hostname LIKE '%storage%' THEN 'NetApp'
        WHEN a.hostname LIKE '%switch%' OR a.hostname LIKE '%router%' THEN 'Cisco Systems'
        ELSE 'Dell Technologies'
    END,
    'CONT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((1000 + (a.id % 9000))::text, 4, '0'),
    'PO-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((10000 + (a.id % 90000))::text, 5, '0'),
    'INV-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((100000 + (a.id % 900000))::text, 6, '0'),
    CASE
        WHEN a.system_id = 'SYS-001' THEN 'IT-INFRASTRUCTURE'
        WHEN a.system_id = 'SYS-002' THEN 'IT-SECURITY'
        WHEN a.system_id = 'SYS-003' THEN 'IT-OPERATIONS'
        WHEN a.system_id = 'SYS-004' THEN 'IT-DEVELOPMENT'
        WHEN a.system_id = 'SYS-005' THEN 'IT-CLOUD'
        ELSE 'IT-GENERAL'
    END,
    'CAPEX-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-Q' || EXTRACT(QUARTER FROM CURRENT_DATE),
    'Hardware purchase - ' || a.hostname || ' - ' ||
    CASE
        WHEN a.hostname LIKE '%server%' THEN 'Production server for critical workloads'
        WHEN a.hostname LIKE '%db%' THEN 'Database server for enterprise applications'
        WHEN a.hostname LIKE '%web%' THEN 'Web server for public-facing applications'
        WHEN a.hostname LIKE '%app%' THEN 'Application server for business services'
        ELSE 'General purpose server infrastructure'
    END,
    '[]'::jsonb,
    '{"procurement_method": "competitive_bid", "warranty_years": 3, "depreciation_schedule": "straight_line"}'::jsonb,
    1,  -- created_by (assuming user ID 1 exists)
    1,  -- last_modified_by
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    a.asset_uuid
FROM assets a
WHERE a.hostname LIKE '%server%' OR a.hostname LIKE '%db%' OR a.hostname LIKE '%web%' OR a.hostname LIKE '%app%'
ORDER BY a.id
LIMIT 15;

-- Method 2: Software licenses for all assets
INSERT INTO asset_cost_management (
    cost_type,
    amount,
    currency,
    billing_cycle,
    start_date,
    end_date,
    vendor,
    contract_number,
    cost_center,
    budget_code,
    notes,
    created_by,
    last_modified_by,
    created_at,
    updated_at,
    asset_uuid
)
SELECT
    'licensing'::enum_asset_cost_management_cost_type,
    CASE
        WHEN a.hostname LIKE '%server%' THEN (500 + random() * 1500)::numeric(15,2)    -- $500-2000 for server licenses
        WHEN a.hostname LIKE '%workstation%' THEN (200 + random() * 300)::numeric(15,2) -- $200-500 for workstation licenses
        ELSE (300 + random() * 700)::numeric(15,2)                                     -- $300-1000 default
    END,
    'USD',
    'annual'::enum_asset_cost_management_billing_cycle,
    CURRENT_DATE - INTERVAL '6 months',
    CURRENT_DATE + INTERVAL '6 months',
    CASE
        WHEN a.hostname LIKE '%server%' THEN 'Microsoft Corporation'
        WHEN a.hostname LIKE '%linux%' THEN 'Red Hat Inc'
        WHEN a.hostname LIKE '%workstation%' THEN 'Microsoft Corporation'
        ELSE 'Various Software Vendors'
    END,
    'LIC-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((2000 + (a.id % 8000))::text, 4, '0'),
    CASE
        WHEN a.system_id = 'SYS-001' THEN 'IT-INFRASTRUCTURE'
        WHEN a.system_id = 'SYS-002' THEN 'IT-SECURITY'
        ELSE 'IT-GENERAL'
    END,
    'OPEX-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-SOFTWARE',
    'Annual software licensing - ' || a.hostname,
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    a.asset_uuid
FROM assets a
ORDER BY a.id
LIMIT 20;

-- Method 3: Maintenance contracts for critical assets
INSERT INTO asset_cost_management (
    cost_type,
    amount,
    currency,
    billing_cycle,
    start_date,
    end_date,
    vendor,
    contract_number,
    cost_center,
    budget_code,
    notes,
    created_by,
    last_modified_by,
    created_at,
    updated_at,
    asset_uuid
)
SELECT
    'maintenance'::enum_asset_cost_management_cost_type,
    CASE
        WHEN a.criticality_rating = 'high' THEN (1200 + random() * 1800)::numeric(15,2)     -- $1200-3000 for high criticality
        WHEN a.criticality_rating = 'medium' THEN (800 + random() * 1200)::numeric(15,2)    -- $800-2000 for medium criticality
        ELSE (400 + random() * 600)::numeric(15,2)                                          -- $400-1000 for low criticality
    END,
    'USD',
    'annual'::enum_asset_cost_management_billing_cycle,
    CURRENT_DATE - INTERVAL '3 months',
    CURRENT_DATE + INTERVAL '9 months',
    CASE
        WHEN a.hostname LIKE '%server%' THEN 'Dell ProSupport'
        WHEN a.hostname LIKE '%switch%' OR a.hostname LIKE '%router%' THEN 'Cisco SmartNet'
        WHEN a.hostname LIKE '%storage%' THEN 'NetApp Support'
        ELSE 'Vendor Support Services'
    END,
    'MAINT-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((3000 + (a.id % 7000))::text, 4, '0'),
    'IT-OPERATIONS',
    'OPEX-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-MAINTENANCE',
    'Annual maintenance contract - ' || a.hostname || ' - ' || a.criticality_rating || ' priority',
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    a.asset_uuid
FROM assets a
WHERE a.criticality_rating IN ('high', 'medium')
ORDER BY a.criticality_rating DESC, a.id
LIMIT 12;

-- Method 4: Cloud operational costs
INSERT INTO asset_cost_management (
    cost_type,
    amount,
    currency,
    billing_cycle,
    start_date,
    vendor,
    cost_center,
    budget_code,
    notes,
    created_by,
    last_modified_by,
    created_at,
    updated_at,
    asset_uuid
)
SELECT
    'operational'::enum_asset_cost_management_cost_type,
    (150 + random() * 350)::numeric(15,2),  -- $150-500 monthly
    'USD',
    'monthly'::enum_asset_cost_management_billing_cycle,
    CURRENT_DATE - INTERVAL '2 months',
    CASE
        WHEN a.hostname LIKE '%cloud%' THEN 'Amazon Web Services'
        WHEN a.hostname LIKE '%azure%' THEN 'Microsoft Azure'
        ELSE 'Cloud Service Provider'
    END,
    'IT-CLOUD',
    'OPEX-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-CLOUD',
    'Monthly cloud operational costs - ' || a.hostname,
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    a.asset_uuid
FROM assets a
WHERE a.system_id = 'SYS-005' OR a.hostname LIKE '%cloud%'
ORDER BY a.id
LIMIT 8;

-- Method 5: Support contracts for workstations
INSERT INTO asset_cost_management (
    cost_type,
    amount,
    currency,
    billing_cycle,
    start_date,
    end_date,
    vendor,
    contract_number,
    cost_center,
    budget_code,
    notes,
    created_by,
    last_modified_by,
    created_at,
    updated_at,
    asset_uuid
)
SELECT
    'support'::enum_asset_cost_management_cost_type,
    (200 + random() * 300)::numeric(15,2),  -- $200-500 for support
    'USD',
    'annual'::enum_asset_cost_management_billing_cycle,
    CURRENT_DATE - INTERVAL '4 months',
    CURRENT_DATE + INTERVAL '8 months',
    'IT Support Services Inc',
    'SUP-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD((4000 + (a.id % 6000))::text, 4, '0'),
    'IT-SUPPORT',
    'OPEX-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-SUPPORT',
    'Annual support contract - ' || a.hostname,
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    a.asset_uuid
FROM assets a
WHERE a.hostname LIKE '%workstation%' OR a.hostname LIKE '%laptop%' OR a.hostname LIKE '%pc%'
ORDER BY a.id
LIMIT 10;

-- Verification queries
SELECT 'COST MANAGEMENT DATA CREATED:' as section;
SELECT
    acm.cost_type,
    COUNT(*) as record_count,
    AVG(acm.amount::numeric) as avg_amount,
    SUM(acm.amount::numeric) as total_amount
FROM asset_cost_management acm
GROUP BY acm.cost_type
ORDER BY acm.cost_type;

SELECT 'COST BY SYSTEM:' as section;
SELECT
    a.system_id,
    COUNT(acm.id) as cost_records,
    SUM(acm.amount::numeric) as total_cost
FROM assets a
LEFT JOIN asset_cost_management acm ON a.asset_uuid = acm.asset_uuid
GROUP BY a.system_id
ORDER BY a.system_id;

SELECT 'SAMPLE COST RECORDS:' as section;
SELECT
    a.hostname,
    acm.cost_type,
    acm.amount,
    acm.vendor,
    acm.billing_cycle,
    acm.cost_center
FROM asset_cost_management acm
JOIN assets a ON acm.asset_uuid = a.asset_uuid
ORDER BY acm.amount DESC
LIMIT 10;


