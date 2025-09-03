-- =====================================================
-- MANUAL SCRIPT: Add Missing Asset Management Foreign Keys
-- =====================================================
-- Description: Add all missing foreign key relationships for asset management tables
-- Author: Asset Management System
-- Date: 2024-01-19
-- 
-- INSTRUCTIONS:
-- 1. Run this script directly in your PostgreSQL database
-- 2. This will add foreign key constraints that are missing from your current schema
-- 3. The script will clean up orphaned data before adding constraints
-- 4. After running, regenerate your ERD to see all relationships
--
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- STEP 1: CLEAN UP ORPHANED DATA
-- =====================================================

\echo 'Step 1: Cleaning up orphaned data before adding foreign key constraints...'

-- Clean up asset_cost_management orphaned records
DELETE FROM "asset_cost_management" 
WHERE "asset_uuid" IS NOT NULL 
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

-- Clean up asset_lifecycle orphaned records  
DELETE FROM "asset_lifecycle" 
WHERE "asset_uuid" IS NOT NULL 
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

-- Clean up asset_operational_costs orphaned records
DELETE FROM "asset_operational_costs" 
WHERE "asset_uuid" IS NOT NULL 
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

-- Clean up asset_groups orphaned records
DELETE FROM "asset_groups" 
WHERE "asset_uuid" IS NOT NULL 
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

-- Clean up asset_group_members orphaned group references
DELETE FROM "asset_group_members" 
WHERE "group_id" NOT IN (SELECT "id" FROM "asset_groups");

-- Clean up asset_risk_mapping orphaned records
DELETE FROM "asset_risk_mapping" 
WHERE "asset_uuid" IS NOT NULL 
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

-- Clean up user references (set to NULL if user doesn't exist)
UPDATE "asset_cost_management" 
SET "created_by" = NULL 
WHERE "created_by" IS NOT NULL 
  AND "created_by" NOT IN (SELECT "id" FROM "users");

UPDATE "asset_cost_management" 
SET "last_modified_by" = NULL 
WHERE "last_modified_by" IS NOT NULL 
  AND "last_modified_by" NOT IN (SELECT "id" FROM "users");

UPDATE "asset_groups" 
SET "created_by" = 1 
WHERE "created_by" NOT IN (SELECT "id" FROM "users");

UPDATE "asset_risk_mapping" 
SET "verified_by" = NULL 
WHERE "verified_by" IS NOT NULL 
  AND "verified_by" NOT IN (SELECT "id" FROM "users");

\echo 'Step 1 Complete: Orphaned data cleaned up.'

-- =====================================================
-- STEP 2: ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

\echo 'Step 2: Adding missing foreign key constraints...'

-- 1. asset_cost_management -> assets (asset_uuid) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_cost_management_asset_uuid_fkey'
      AND table_name = 'asset_cost_management'
  ) THEN
    ALTER TABLE "asset_cost_management" 
    ADD CONSTRAINT "asset_cost_management_asset_uuid_fkey" 
    FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_cost_management.asset_uuid -> assets.asset_uuid';
  ELSE
    RAISE NOTICE 'Exists: asset_cost_management.asset_uuid -> assets.asset_uuid';
  END IF;
END $$;

-- 2. asset_cost_management -> users (created_by) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_cost_management_created_by_fkey'
      AND table_name = 'asset_cost_management'
  ) THEN
    ALTER TABLE "asset_cost_management" 
    ADD CONSTRAINT "asset_cost_management_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id");
    RAISE NOTICE 'Added: asset_cost_management.created_by -> users.id';
  ELSE
    RAISE NOTICE 'Exists: asset_cost_management.created_by -> users.id';
  END IF;
END $$;

-- 3. asset_cost_management -> users (last_modified_by) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_cost_management_last_modified_by_fkey'
      AND table_name = 'asset_cost_management'
  ) THEN
    ALTER TABLE "asset_cost_management" 
    ADD CONSTRAINT "asset_cost_management_last_modified_by_fkey" 
    FOREIGN KEY ("last_modified_by") REFERENCES "users"("id");
    RAISE NOTICE 'Added: asset_cost_management.last_modified_by -> users.id';
  ELSE
    RAISE NOTICE 'Exists: asset_cost_management.last_modified_by -> users.id';
  END IF;
END $$;

-- 4. asset_lifecycle -> assets (asset_uuid) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_lifecycle_asset_uuid_fkey'
      AND table_name = 'asset_lifecycle'
  ) THEN
    ALTER TABLE "asset_lifecycle" 
    ADD CONSTRAINT "asset_lifecycle_asset_uuid_fkey" 
    FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_lifecycle.asset_uuid -> assets.asset_uuid';
  ELSE
    RAISE NOTICE 'Exists: asset_lifecycle.asset_uuid -> assets.asset_uuid';
  END IF;
END $$;

-- 5. asset_operational_costs -> assets (asset_uuid) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_operational_costs_asset_uuid_fkey'
      AND table_name = 'asset_operational_costs'
  ) THEN
    ALTER TABLE "asset_operational_costs" 
    ADD CONSTRAINT "asset_operational_costs_asset_uuid_fkey" 
    FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_operational_costs.asset_uuid -> assets.asset_uuid';
  ELSE
    RAISE NOTICE 'Exists: asset_operational_costs.asset_uuid -> assets.asset_uuid';
  END IF;
END $$;

-- 6. asset_groups -> assets (asset_uuid) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_groups_asset_uuid_fkey'
      AND table_name = 'asset_groups'
  ) THEN
    ALTER TABLE "asset_groups" 
    ADD CONSTRAINT "asset_groups_asset_uuid_fkey" 
    FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_groups.asset_uuid -> assets.asset_uuid';
  ELSE
    RAISE NOTICE 'Exists: asset_groups.asset_uuid -> assets.asset_uuid';
  END IF;
END $$;

-- 7. asset_groups -> users (created_by) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_groups_created_by_fkey'
      AND table_name = 'asset_groups'
  ) THEN
    ALTER TABLE "asset_groups" 
    ADD CONSTRAINT "asset_groups_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id");
    RAISE NOTICE 'Added: asset_groups.created_by -> users.id';
  ELSE
    RAISE NOTICE 'Exists: asset_groups.created_by -> users.id';
  END IF;
END $$;

-- 8. asset_group_members -> asset_groups (group_id) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_group_members_group_id_fkey'
      AND table_name = 'asset_group_members'
  ) THEN
    ALTER TABLE "asset_group_members" 
    ADD CONSTRAINT "asset_group_members_group_id_fkey" 
    FOREIGN KEY ("group_id") REFERENCES "asset_groups"("id") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_group_members.group_id -> asset_groups.id';
  ELSE
    RAISE NOTICE 'Exists: asset_group_members.group_id -> asset_groups.id';
  END IF;
END $$;

-- 9. asset_group_members -> assets (asset_uuid as integer) - MISSING
-- Note: Your schema shows asset_uuid as integer, referencing assets.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_group_members_asset_uuid_fkey'
      AND table_name = 'asset_group_members'
  ) THEN
    ALTER TABLE "asset_group_members" 
    ADD CONSTRAINT "asset_group_members_asset_uuid_fkey" 
    FOREIGN KEY ("asset_uuid") REFERENCES "assets"("id") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_group_members.asset_uuid -> assets.id';
  ELSE
    RAISE NOTICE 'Exists: asset_group_members.asset_uuid -> assets.id';
  END IF;
END $$;

-- 10. asset_risk_mapping -> assets (asset_uuid) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_risk_mapping_asset_uuid_fkey'
      AND table_name = 'asset_risk_mapping'
  ) THEN
    ALTER TABLE "asset_risk_mapping" 
    ADD CONSTRAINT "asset_risk_mapping_asset_uuid_fkey" 
    FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_risk_mapping.asset_uuid -> assets.asset_uuid';
  ELSE
    RAISE NOTICE 'Exists: asset_risk_mapping.asset_uuid -> assets.asset_uuid';
  END IF;
END $$;

-- 11. asset_risk_mapping -> users (verified_by) - MISSING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asset_risk_mapping_verified_by_fkey'
      AND table_name = 'asset_risk_mapping'
  ) THEN
    ALTER TABLE "asset_risk_mapping" 
    ADD CONSTRAINT "asset_risk_mapping_verified_by_fkey" 
    FOREIGN KEY ("verified_by") REFERENCES "users"("id");
    RAISE NOTICE 'Added: asset_risk_mapping.verified_by -> users.id';
  ELSE
    RAISE NOTICE 'Exists: asset_risk_mapping.verified_by -> users.id';
  END IF;
END $$;

-- 12. stig_assets -> assets (asset_uuid) - MISSING (if needed)
-- Note: This creates a relationship between STIG assets and main assets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stig_assets_asset_uuid_fkey'
      AND table_name = 'stig_assets'
  ) THEN
    -- Clean up orphaned records first
    DELETE FROM "stig_assets" 
    WHERE "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");
    
    ALTER TABLE "stig_assets" 
    ADD CONSTRAINT "stig_assets_asset_uuid_fkey" 
    FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;
    RAISE NOTICE 'Added: stig_assets.asset_uuid -> assets.asset_uuid';
  ELSE
    RAISE NOTICE 'Exists: stig_assets.asset_uuid -> assets.asset_uuid';
  END IF;
END $$;

\echo 'Step 2 Complete: All missing foreign key constraints added.'

-- =====================================================
-- STEP 3: VERIFICATION
-- =====================================================

\echo 'Step 3: Verifying foreign key constraints...'

-- Show all asset-related foreign key constraints
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name LIKE 'asset%' OR tc.table_name LIKE 'stig_assets')
ORDER BY tc.table_name, kcu.column_name;

-- Commit the transaction
COMMIT;

\echo '=============================================='
\echo 'SUCCESS: All missing foreign key constraints have been added!'
\echo 'Your ERD should now show all relationships between:'
\echo '- Assets table connected to all asset management tables'
\echo '- Users table connected to audit fields'
\echo '- Asset groups connected to asset group members'
\echo '- STIG assets connected to main assets table'
\echo '=============================================='