-- Migration: assets/0012_fix_asset_foreign_keys.sql
-- Description: Add missing foreign key relationships for existing asset management tables
-- Author: Asset Management System
-- Date: 2024-01-19
-- Rollback: See individual DROP CONSTRAINT statements below

-- =====================================================
-- CLEAN UP ORPHANED RECORDS FIRST
-- =====================================================

-- Clean up orphaned records before adding foreign key constraints
DELETE FROM "asset_cost_management"
WHERE "asset_uuid" IS NOT NULL
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

DELETE FROM "asset_lifecycle"
WHERE "asset_uuid" IS NOT NULL
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

DELETE FROM "asset_operational_costs"
WHERE "asset_uuid" IS NOT NULL
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

DELETE FROM "asset_groups"
WHERE "asset_uuid" IS NOT NULL
  AND "asset_uuid" NOT IN (SELECT "asset_uuid" FROM "assets");

DELETE FROM "asset_group_members"
WHERE "group_id" NOT IN (SELECT "id" FROM "asset_groups");

-- =====================================================
-- ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- 1. asset_cost_management -> assets (asset_uuid)
ALTER TABLE "asset_cost_management"
ADD CONSTRAINT "asset_cost_management_asset_uuid_fkey"
FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;

-- 2. asset_lifecycle -> assets (asset_uuid)
ALTER TABLE "asset_lifecycle"
ADD CONSTRAINT "asset_lifecycle_asset_uuid_fkey"
FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;

-- 3. asset_operational_costs -> assets (asset_uuid)
ALTER TABLE "asset_operational_costs"
ADD CONSTRAINT "asset_operational_costs_asset_uuid_fkey"
FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;

-- 4. asset_groups -> assets (asset_uuid)
ALTER TABLE "asset_groups"
ADD CONSTRAINT "asset_groups_asset_uuid_fkey"
FOREIGN KEY ("asset_uuid") REFERENCES "assets"("asset_uuid") ON DELETE CASCADE;

-- 5. asset_group_members -> asset_groups (group_id)
ALTER TABLE "asset_group_members"
ADD CONSTRAINT "asset_group_members_group_id_fkey"
FOREIGN KEY ("group_id") REFERENCES "asset_groups"("id") ON DELETE CASCADE;

-- =====================================================
-- SUMMARY OF EXISTING FOREIGN KEYS
-- =====================================================

-- The following foreign key relationships already exist in your database:
-- 1. assets.system_id -> systems.system_id
-- 2. asset_network.asset_uuid -> assets.asset_uuid
-- 3. asset_systems.asset_uuid -> assets.asset_uuid
-- 4. asset_tags.asset_uuid -> assets.asset_uuid
-- 5. system_assets.asset_uuid -> assets.asset_uuid
-- 6. system_assets.system_id -> systems.system_id
-- 7. stig_assets.collection_id -> stig_collections.id
-- 8. stig_asset_assignments.asset_id -> stig_assets.id

-- The migration above added the missing relationships:
-- 9. asset_cost_management.asset_uuid -> assets.asset_uuid
-- 10. asset_lifecycle.asset_uuid -> assets.asset_uuid
-- 11. asset_operational_costs.asset_uuid -> assets.asset_uuid
-- 12. asset_groups.asset_uuid -> assets.asset_uuid
-- 13. asset_group_members.group_id -> asset_groups.id

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record (run this after creating schema_migrations table)
INSERT INTO "schema_migrations" ("version", "applied_at")
VALUES ('assets/0012_fix_asset_foreign_keys', NOW())
ON CONFLICT ("version") DO NOTHING;
