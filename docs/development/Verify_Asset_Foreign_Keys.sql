-- Verification Script: Check Asset Management Foreign Key Relationships
-- Run this after migration 0012 to verify all foreign keys were created correctly

-- =====================================================
-- CHECK ALL ASSET-RELATED FOREIGN KEY CONSTRAINTS
-- =====================================================

SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  CASE 
    WHEN tc.constraint_name LIKE '%asset_cost_management%' THEN '✅ ADDED BY MIGRATION'
    WHEN tc.constraint_name LIKE '%asset_lifecycle%' THEN '✅ ADDED BY MIGRATION'
    WHEN tc.constraint_name LIKE '%asset_operational_costs%' THEN '✅ ADDED BY MIGRATION'
    WHEN tc.constraint_name LIKE '%asset_groups%' THEN '✅ ADDED BY MIGRATION'
    WHEN tc.constraint_name LIKE '%asset_group_members%' THEN '✅ ADDED BY MIGRATION'
    ELSE '✓ EXISTING'
  END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name LIKE 'asset%' OR tc.table_name LIKE 'system_assets' OR tc.table_name LIKE 'stig_%')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- EXPECTED FOREIGN KEY RELATIONSHIPS
-- =====================================================

-- This query shows what foreign keys should exist after the migration
WITH expected_relationships AS (
  SELECT 'assets' as table_name, 'system_id' as column_name, 'systems' as ref_table, 'system_id' as ref_column, 'EXISTING' as expected_status
  UNION ALL SELECT 'asset_cost_management', 'asset_uuid', 'assets', 'asset_uuid', 'ADDED BY MIGRATION'
  UNION ALL SELECT 'asset_lifecycle', 'asset_uuid', 'assets', 'asset_uuid', 'ADDED BY MIGRATION'
  UNION ALL SELECT 'asset_operational_costs', 'asset_uuid', 'assets', 'asset_uuid', 'ADDED BY MIGRATION'
  UNION ALL SELECT 'asset_groups', 'asset_uuid', 'assets', 'asset_uuid', 'ADDED BY MIGRATION'
  UNION ALL SELECT 'asset_group_members', 'group_id', 'asset_groups', 'id', 'ADDED BY MIGRATION'
  UNION ALL SELECT 'asset_network', 'asset_uuid', 'assets', 'asset_uuid', 'EXISTING'
  UNION ALL SELECT 'asset_systems', 'asset_uuid', 'assets', 'asset_uuid', 'EXISTING'
  UNION ALL SELECT 'asset_tags', 'asset_uuid', 'assets', 'asset_uuid', 'EXISTING'
  UNION ALL SELECT 'system_assets', 'asset_uuid', 'assets', 'asset_uuid', 'EXISTING'
  UNION ALL SELECT 'system_assets', 'system_id', 'systems', 'system_id', 'EXISTING'
  UNION ALL SELECT 'stig_assets', 'collection_id', 'stig_collections', 'id', 'EXISTING'
  UNION ALL SELECT 'stig_asset_assignments', 'asset_id', 'stig_assets', 'id', 'EXISTING'
)
SELECT 
  er.table_name,
  er.column_name,
  er.ref_table,
  er.ref_column,
  er.expected_status,
  CASE 
    WHEN tc.constraint_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as actual_status
FROM expected_relationships er
LEFT JOIN information_schema.table_constraints tc 
  ON tc.table_name = er.table_name 
  AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.key_column_usage kcu
  ON kcu.constraint_name = tc.constraint_name
  AND kcu.column_name = er.column_name
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_name = er.ref_table
  AND ccu.column_name = er.ref_column
ORDER BY er.table_name, er.column_name;

-- =====================================================
-- CHECK FOR ORPHANED RECORDS (SHOULD BE NONE AFTER MIGRATION)
-- =====================================================

-- Check for orphaned records in asset_cost_management
SELECT 'asset_cost_management' as table_name, COUNT(*) as orphaned_records
FROM asset_cost_management acm
LEFT JOIN assets a ON acm.asset_uuid = a.asset_uuid
WHERE acm.asset_uuid IS NOT NULL AND a.asset_uuid IS NULL

UNION ALL

-- Check for orphaned records in asset_lifecycle
SELECT 'asset_lifecycle', COUNT(*)
FROM asset_lifecycle al
LEFT JOIN assets a ON al.asset_uuid = a.asset_uuid
WHERE al.asset_uuid IS NOT NULL AND a.asset_uuid IS NULL

UNION ALL

-- Check for orphaned records in asset_operational_costs
SELECT 'asset_operational_costs', COUNT(*)
FROM asset_operational_costs aoc
LEFT JOIN assets a ON aoc.asset_uuid = a.asset_uuid
WHERE aoc.asset_uuid IS NOT NULL AND a.asset_uuid IS NULL

UNION ALL

-- Check for orphaned records in asset_groups
SELECT 'asset_groups', COUNT(*)
FROM asset_groups ag
LEFT JOIN assets a ON ag.asset_uuid = a.asset_uuid
WHERE ag.asset_uuid IS NOT NULL AND a.asset_uuid IS NULL

UNION ALL

-- Check for orphaned records in asset_group_members
SELECT 'asset_group_members', COUNT(*)
FROM asset_group_members agm
LEFT JOIN asset_groups ag ON agm.group_id = ag.id
WHERE ag.id IS NULL;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================

-- Count of foreign key constraints by table
SELECT 
  tc.table_name,
  COUNT(*) as foreign_key_count,
  STRING_AGG(kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name, ', ') as relationships
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name LIKE 'asset%' OR tc.table_name LIKE 'system_assets' OR tc.table_name LIKE 'stig_%')
GROUP BY tc.table_name
ORDER BY tc.table_name;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
After running migration 0012, execute this verification script to ensure:

1. All expected foreign key constraints exist
2. No orphaned records remain in the database
3. Entity relationship diagrams will now show proper connections

Expected Results:
- 13 total foreign key relationships for asset management
- 0 orphaned records in all tables
- All relationships marked as "EXISTS" in the verification queries

If any foreign keys are missing or orphaned records exist, 
the migration may need to be re-run or data issues addressed.
*/
