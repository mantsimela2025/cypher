-- =====================================================
-- ADDITIONAL MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================
-- Description: Add remaining foreign key constraints found after ERD analysis
-- 
-- =====================================================

BEGIN;

-- 1. asset_vulnerabilities -> assets (asset_id)
DO $$
BEGIN
  RAISE NOTICE 'Adding additional missing foreign key constraints...';
  
  -- Clean up orphaned records first
  DELETE FROM "asset_vulnerabilities"
  WHERE "asset_id" NOT IN (SELECT "id" FROM "assets");
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'asset_vulnerabilities_asset_id_fkey'
      AND table_name = 'asset_vulnerabilities'
  ) THEN
    ALTER TABLE "asset_vulnerabilities"
    ADD CONSTRAINT "asset_vulnerabilities_asset_id_fkey"
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_vulnerabilities.asset_id -> assets.id';
  ELSE
    RAISE NOTICE 'Exists: asset_vulnerabilities.asset_id -> assets.id';
  END IF;
END $$;

-- 2. asset_vulnerabilities -> vulnerabilities (vulnerability_id)
DO $$
BEGIN
  -- Clean up orphaned records first
  DELETE FROM "asset_vulnerabilities"
  WHERE "vulnerability_id" NOT IN (SELECT "id" FROM "vulnerabilities");
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'asset_vulnerabilities_vulnerability_id_fkey'
      AND table_name = 'asset_vulnerabilities'
  ) THEN
    ALTER TABLE "asset_vulnerabilities"
    ADD CONSTRAINT "asset_vulnerabilities_vulnerability_id_fkey"
    FOREIGN KEY ("vulnerability_id") REFERENCES "vulnerabilities"("id") ON DELETE CASCADE;
    RAISE NOTICE 'Added: asset_vulnerabilities.vulnerability_id -> vulnerabilities.id';
  ELSE
    RAISE NOTICE 'Exists: asset_vulnerabilities.vulnerability_id -> vulnerabilities.id';
  END IF;
END $$;

-- Check if attack_surface_mapping needs asset_id foreign key
-- Note: Currently only has system_id, but checking if asset_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attack_surface_mapping'
      AND column_name = 'asset_id'
  ) THEN
    -- Clean up orphaned records first
    DELETE FROM "attack_surface_mapping"
    WHERE "asset_id" IS NOT NULL
      AND "asset_id" NOT IN (SELECT "id" FROM "assets");
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'attack_surface_mapping_asset_id_fkey'
        AND table_name = 'attack_surface_mapping'
    ) THEN
      ALTER TABLE "attack_surface_mapping"
      ADD CONSTRAINT "attack_surface_mapping_asset_id_fkey"
      FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;
      RAISE NOTICE 'Added: attack_surface_mapping.asset_id -> assets.id';
    ELSE
      RAISE NOTICE 'Exists: attack_surface_mapping.asset_id -> assets.id';
    END IF;
  ELSE
    RAISE NOTICE 'Column asset_id does not exist in attack_surface_mapping table';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'SUCCESS: Additional foreign key constraints have been added!';
  RAISE NOTICE 'asset_vulnerabilities table is now properly linked to assets and vulnerabilities';
  RAISE NOTICE '==============================================';
END $$;

COMMIT;