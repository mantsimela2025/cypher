-- Systems Management Database Verification Script
-- Run with: psql -d rasdashdev01 -h rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com -U rasdashadmin -f verify_systems_management_setup.sql

\echo '🗄️ Systems Management Database Verification'
\echo '==========================================='
\echo ''

-- Test database connection
\echo '🔌 Testing database connection...'
SELECT 'Database connection successful!' as status, NOW() as timestamp;
\echo ''

-- Check if custom enums exist
\echo '🏷️ Verifying custom enums...'
\echo '============================='
SELECT 
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ All enums created successfully'
        ELSE '❌ Missing enums: ' || (5 - COUNT(*))::text
    END as enum_status,
    COUNT(*) as enums_found
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('discovery_status', 'posture_status', 'drift_severity', 'risk_level', 'environment_type');

-- List all custom enums
\echo ''
\echo '📋 Custom Enums:'
SELECT typname as enum_name, 
       array_to_string(enum_range(NULL::discovery_status), ', ') as values
FROM pg_type 
WHERE typname = 'discovery_status'
UNION ALL
SELECT typname as enum_name, 
       array_to_string(enum_range(NULL::posture_status), ', ') as values
FROM pg_type 
WHERE typname = 'posture_status'
UNION ALL
SELECT typname as enum_name, 
       array_to_string(enum_range(NULL::drift_severity), ', ') as values
FROM pg_type 
WHERE typname = 'drift_severity'
UNION ALL
SELECT typname as enum_name, 
       array_to_string(enum_range(NULL::risk_level), ', ') as values
FROM pg_type 
WHERE typname = 'risk_level'
UNION ALL
SELECT typname as enum_name, 
       array_to_string(enum_range(NULL::environment_type), ', ') as values
FROM pg_type 
WHERE typname = 'environment_type';

\echo ''

-- Check if all tables exist
\echo '📋 Verifying Systems Management tables...'
\echo '=========================================='
WITH expected_tables AS (
    SELECT unnest(ARRAY[
        'system_discovery_scans',
        'system_discovery_results', 
        'system_security_posture',
        'system_configuration_drift',
        'cross_system_correlations',
        'enterprise_risk_aggregation',
        'attack_surface_mapping',
        'business_impact_analysis',
        'system_compliance_mapping',
        'system_threat_modeling'
    ]) as table_name
),
existing_tables AS (
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'system_discovery_scans',
        'system_discovery_results', 
        'system_security_posture',
        'system_configuration_drift',
        'cross_system_correlations',
        'enterprise_risk_aggregation',
        'attack_surface_mapping',
        'business_impact_analysis',
        'system_compliance_mapping',
        'system_threat_modeling'
    )
)
SELECT 
    CASE 
        WHEN COUNT(et.table_name) = COUNT(ext.table_name) THEN '✅ All tables created successfully'
        ELSE '❌ Missing tables: ' || (COUNT(et.table_name) - COUNT(ext.table_name))::text
    END as table_status,
    COUNT(ext.table_name) as tables_found,
    COUNT(et.table_name) as tables_expected
FROM expected_tables et
LEFT JOIN existing_tables ext ON et.table_name = ext.table_name;

-- List all Systems Management tables with row counts
\echo ''
\echo '📊 Table Details:'
SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅'
        ELSE '❌'
    END as status,
    COALESCE(
        (SELECT reltuples::bigint 
         FROM pg_class 
         WHERE relname = t.table_name), 0
    ) as estimated_rows
FROM (
    VALUES 
        ('system_discovery_scans'),
        ('system_discovery_results'),
        ('system_security_posture'),
        ('system_configuration_drift'),
        ('cross_system_correlations'),
        ('enterprise_risk_aggregation'),
        ('attack_surface_mapping'),
        ('business_impact_analysis'),
        ('system_compliance_mapping'),
        ('system_threat_modeling')
) as expected(table_name)
LEFT JOIN information_schema.tables t 
    ON expected.table_name = t.table_name 
    AND t.table_schema = 'public'
ORDER BY expected.table_name;

\echo ''

-- Check if systems table was enhanced
\echo '🔧 Verifying systems table enhancements...'
\echo '=========================================='
SELECT 
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ All columns added successfully'
        ELSE '❌ Missing columns: ' || (3 - COUNT(*))::text
    END as column_status,
    COUNT(*) as columns_found
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'systems'
AND column_name IN ('discovery_confidence', 'last_discovery_date', 'environment');

-- List enhanced columns
\echo ''
\echo '📋 Enhanced Systems Table Columns:'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'systems'
AND column_name IN ('discovery_confidence', 'last_discovery_date', 'environment')
ORDER BY column_name;

\echo ''

-- Check indexes
\echo '📇 Verifying database indexes...'
\echo '================================'
SELECT 
    COUNT(*) as total_indexes,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Indexes created successfully'
        ELSE '⚠️ No custom indexes found'
    END as index_status
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
    'system_discovery_scans',
    'system_discovery_results', 
    'system_security_posture',
    'system_configuration_drift',
    'cross_system_correlations',
    'enterprise_risk_aggregation',
    'attack_surface_mapping',
    'business_impact_analysis',
    'system_compliance_mapping',
    'system_threat_modeling',
    'systems'
)
AND indexname LIKE 'idx_%';

-- List some key indexes
\echo ''
\echo '📋 Key Indexes:'
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('system_discovery_scans', 'system_security_posture', 'system_configuration_drift')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname
LIMIT 10;

\echo ''

-- Check sample data
\echo '📊 Verifying sample data...'
\echo '==========================='
SELECT 
    COUNT(*) as sample_scans,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Sample data inserted successfully'
        ELSE '⚠️ No sample data found'
    END as sample_status
FROM system_discovery_scans;

-- Show sample discovery scans
\echo ''
\echo '📋 Sample Discovery Scans:'
SELECT 
    id,
    name,
    status,
    systems_found,
    started_at
FROM system_discovery_scans
ORDER BY started_at DESC
LIMIT 5;

\echo ''

-- Test basic functionality
\echo '🧪 Testing basic functionality...'
\echo '================================='

-- Test inserting a test record
INSERT INTO system_discovery_scans (
    name, 
    description, 
    methods, 
    targets, 
    status
) VALUES (
    'Verification Test Scan',
    'Test scan created during verification',
    '["network_scan"]',
    '["127.0.0.1"]',
    'pending'
) ON CONFLICT DO NOTHING;

-- Verify the insert worked
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Insert test successful'
        ELSE '❌ Insert test failed'
    END as insert_test_status
FROM system_discovery_scans 
WHERE name = 'Verification Test Scan';

-- Clean up test record
DELETE FROM system_discovery_scans 
WHERE name = 'Verification Test Scan';

\echo ''

-- Final summary
\echo '🎯 Verification Summary:'
\echo '======================='

WITH verification_results AS (
    SELECT 
        'Enums' as component,
        CASE WHEN COUNT(*) = 5 THEN 'PASSED' ELSE 'FAILED' END as status
    FROM pg_type 
    WHERE typtype = 'e' 
    AND typname IN ('discovery_status', 'posture_status', 'drift_severity', 'risk_level', 'environment_type')
    
    UNION ALL
    
    SELECT 
        'Tables' as component,
        CASE WHEN COUNT(*) = 10 THEN 'PASSED' ELSE 'FAILED' END as status
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
        'system_discovery_scans', 'system_discovery_results', 'system_security_posture',
        'system_configuration_drift', 'cross_system_correlations', 'enterprise_risk_aggregation',
        'attack_surface_mapping', 'business_impact_analysis', 'system_compliance_mapping',
        'system_threat_modeling'
    )
    
    UNION ALL
    
    SELECT 
        'Systems Columns' as component,
        CASE WHEN COUNT(*) = 3 THEN 'PASSED' ELSE 'FAILED' END as status
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'systems'
    AND column_name IN ('discovery_confidence', 'last_discovery_date', 'environment')
    
    UNION ALL
    
    SELECT 
        'Indexes' as component,
        CASE WHEN COUNT(*) > 0 THEN 'PASSED' ELSE 'FAILED' END as status
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
    AND tablename IN (
        'system_discovery_scans', 'system_discovery_results', 'system_security_posture',
        'system_configuration_drift', 'cross_system_correlations', 'enterprise_risk_aggregation',
        'attack_surface_mapping', 'business_impact_analysis', 'system_compliance_mapping',
        'system_threat_modeling', 'systems'
    )
)
SELECT 
    component,
    CASE 
        WHEN status = 'PASSED' THEN '✅ PASSED'
        ELSE '❌ FAILED'
    END as verification_status
FROM verification_results
ORDER BY component;

-- Overall status
WITH overall_check AS (
    SELECT COUNT(*) as total_checks,
           SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) as passed_checks
    FROM (
        SELECT CASE WHEN COUNT(*) = 5 THEN 'PASSED' ELSE 'FAILED' END as status
        FROM pg_type WHERE typtype = 'e' AND typname IN ('discovery_status', 'posture_status', 'drift_severity', 'risk_level', 'environment_type')
        UNION ALL
        SELECT CASE WHEN COUNT(*) = 10 THEN 'PASSED' ELSE 'FAILED' END as status
        FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
            'system_discovery_scans', 'system_discovery_results', 'system_security_posture',
            'system_configuration_drift', 'cross_system_correlations', 'enterprise_risk_aggregation',
            'attack_surface_mapping', 'business_impact_analysis', 'system_compliance_mapping', 'system_threat_modeling'
        )
        UNION ALL
        SELECT CASE WHEN COUNT(*) = 3 THEN 'PASSED' ELSE 'FAILED' END as status
        FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'systems'
        AND column_name IN ('discovery_confidence', 'last_discovery_date', 'environment')
        UNION ALL
        SELECT CASE WHEN COUNT(*) > 0 THEN 'PASSED' ELSE 'FAILED' END as status
        FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
    ) checks
)
SELECT 
    CASE 
        WHEN passed_checks = total_checks THEN '🎉 SUCCESS: All verification checks passed!'
        ELSE '⚠️ WARNING: ' || (total_checks - passed_checks)::text || ' checks failed'
    END as overall_status,
    passed_checks || '/' || total_checks as score
FROM overall_check;

\echo ''
\echo '📋 Next Steps:'
\echo '1. Start the API server: npm run dev'
\echo '2. Test the new endpoints using the API test scripts'
\echo '3. Begin using the Systems Management features'
\echo ''
\echo '🚀 Systems Management Database Setup Complete!'
