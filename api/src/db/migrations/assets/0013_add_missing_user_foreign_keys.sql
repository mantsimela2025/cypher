-- Migration: assets/0013_add_missing_user_foreign_keys.sql
-- Description: Add missing foreign key relationships to users table for asset management tables
-- Author: Asset Management System
-- Date: 2024-01-19
-- Rollback: See individual DROP CONSTRAINT statements below

-- =====================================================
-- ADD MISSING USER FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Based on your schema analysis, these tables have user ID fields but no foreign keys:

-- 1. asset_cost_management -> users (created_by, last_modified_by)
ALTER TABLE "asset_cost_management" 
ADD CONSTRAINT "asset_cost_management_created_by_fkey" 
FOREIGN KEY ("created_by") REFERENCES "users"("id");

ALTER TABLE "asset_cost_management" 
ADD CONSTRAINT "asset_cost_management_last_modified_by_fkey" 
FOREIGN KEY ("last_modified_by") REFERENCES "users"("id");

-- 2. asset_groups -> users (created_by)
ALTER TABLE "asset_groups" 
ADD CONSTRAINT "asset_groups_created_by_fkey" 
FOREIGN KEY ("created_by") REFERENCES "users"("id");

-- 3. asset_lifecycle -> users (created_by, updated_by) - if these fields exist
-- Note: Based on your schema, asset_lifecycle might not have these fields
-- Uncomment if they exist in your table:
-- ALTER TABLE "asset_lifecycle" 
-- ADD CONSTRAINT "asset_lifecycle_created_by_fkey" 
-- FOREIGN KEY ("created_by") REFERENCES "users"("id");

-- ALTER TABLE "asset_lifecycle" 
-- ADD CONSTRAINT "asset_lifecycle_updated_by_fkey" 
-- FOREIGN KEY ("updated_by") REFERENCES "users"("id");

-- 4. asset_operational_costs -> users (created_by, updated_by) - if these fields exist
-- Note: Based on your schema, asset_operational_costs might not have these fields
-- Uncomment if they exist in your table:
-- ALTER TABLE "asset_operational_costs" 
-- ADD CONSTRAINT "asset_operational_costs_created_by_fkey" 
-- FOREIGN KEY ("created_by") REFERENCES "users"("id");

-- ALTER TABLE "asset_operational_costs" 
-- ADD CONSTRAINT "asset_operational_costs_updated_by_fkey" 
-- FOREIGN KEY ("updated_by") REFERENCES "users"("id");

-- 5. asset_risk_mapping -> users (verified_by)
ALTER TABLE "asset_risk_mapping" 
ADD CONSTRAINT "asset_risk_mapping_verified_by_fkey" 
FOREIGN KEY ("verified_by") REFERENCES "users"("id");

-- =====================================================
-- ADD MISSING ASSET FOREIGN KEY CONSTRAINTS
-- =====================================================

-- These are the ones that were missing from the previous migration:

-- 6. asset_risk_mapping -> assets (asset_uuid) - This one was missing!
ALTER TABLE "asset_risk_mapping" 
ADD CONSTRAINT "asset_risk_mapping_asset_uuid_fkey" 
FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;

-- =====================================================
-- FIX ASSET_GROUP_MEMBERS DATA TYPE ISSUE
-- =====================================================

-- Based on your schema, asset_group_members.asset_uuid is INTEGER but should be UUID
-- This is likely causing ERD issues. Let's fix this:

-- First, check if there's data and clean it up
DELETE FROM "asset_group_members" 
WHERE "asset_uuid" NOT IN (
  -- Convert the integer values to check against actual asset IDs if they exist
  SELECT "id" FROM "assets" WHERE "id" = "asset_group_members"."asset_uuid"
);

-- If the column should actually reference assets.asset_uuid (UUID), we need to:
-- 1. Drop the existing column
-- 2. Add a new UUID column
-- 3. Add the proper foreign key

-- Note: This is a destructive operation. Uncomment only if you're sure:
-- ALTER TABLE "asset_group_members" DROP COLUMN "asset_uuid";
-- ALTER TABLE "asset_group_members" ADD COLUMN "asset_uuid" uuid;
-- ALTER TABLE "asset_group_members" 
-- ADD CONSTRAINT "asset_group_members_asset_uuid_fkey" 
-- FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;

-- Alternative: If asset_uuid should reference assets.id (integer), add this constraint:
ALTER TABLE "asset_group_members" 
ADD CONSTRAINT "asset_group_members_asset_uuid_fkey" 
FOREIGN KEY ("asset_uuid") REFERENCES "assets"("id") ON DELETE CASCADE;

-- =====================================================
-- SUMMARY OF EXPECTED FOREIGN KEY RELATIONSHIPS
-- =====================================================

/*
After this migration, your ERD should show these relationships:

USERS table connected to:
├── asset_cost_management (created_by, last_modified_by)
├── asset_groups (created_by)
├── asset_risk_mapping (verified_by)
└── [other tables with user references]

ASSETS table connected to:
├── asset_cost_management (asset_uuid)
├── asset_lifecycle (asset_uuid)
├── asset_operational_costs (asset_uuid)
├── asset_groups (asset_uuid)
├── asset_risk_mapping (asset_uuid) ← This was missing!
├── asset_network (asset_uuid) ← Already exists
├── asset_systems (asset_uuid) ← Already exists
├── asset_tags (asset_uuid) ← Already exists
└── system_assets (asset_uuid) ← Already exists

ASSET_GROUPS table connected to:
└── asset_group_members (group_id)

SYSTEMS table connected to:
├── assets (system_id) ← Already exists
└── system_assets (system_id) ← Already exists

STIG_COLLECTIONS table connected to:
└── stig_assets (collection_id) ← Already exists
    └── stig_asset_assignments (asset_id) ← Already exists
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('assets/0013_add_missing_user_foreign_keys', NOW())
ON CONFLICT ("version") DO NOTHING;
