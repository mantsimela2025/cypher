-- Migration: assets/0002_asset_relationships.sql
-- Description: Create asset relationships, dependencies, and groups tables
-- Author: Asset Management System
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS asset_group_memberships, asset_groups, asset_dependencies, asset_relationships CASCADE; DROP TYPE IF EXISTS enum_asset_relationship_type, enum_asset_dependency_type, enum_asset_dependency_status, enum_asset_group_type CASCADE;

-- =====================================================
-- ASSET RELATIONSHIP ENUMS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE "enum_asset_relationship_type" AS ENUM(
    'depends_on', 'part_of', 'connects_to', 'manages', 
    'hosts', 'uses', 'backup_of', 'replaces', 'similar_to'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_asset_dependency_type" AS ENUM(
    'critical', 'important', 'moderate', 'low'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_asset_dependency_status" AS ENUM(
    'active', 'inactive', 'planned', 'deprecated'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_asset_group_type" AS ENUM(
    'functional', 'location', 'project', 'maintenance', 'security', 'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ASSET RELATIONSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_relationships" (
  "id" serial PRIMARY KEY NOT NULL,
  "source_asset_id" integer NOT NULL,
  "target_asset_id" integer NOT NULL,
  "relationship_type" "enum_asset_relationship_type" NOT NULL,
  "description" text,
  "strength" integer DEFAULT 1,
  "is_active" boolean DEFAULT true NOT NULL,
  "valid_from" timestamp with time zone DEFAULT now(),
  "valid_to" timestamp with time zone,
  "created_by" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "asset_relationships_source_asset_id_assets_id_fk" 
    FOREIGN KEY ("source_asset_id") REFERENCES "assets"("id") ON DELETE cascade,
  CONSTRAINT "asset_relationships_target_asset_id_assets_id_fk" 
    FOREIGN KEY ("target_asset_id") REFERENCES "assets"("id") ON DELETE cascade,
  CONSTRAINT "asset_relationships_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id"),
    
  -- Business Rule Constraints
  CONSTRAINT "chk_relationship_not_self" 
    CHECK ("source_asset_id" != "target_asset_id"),
  CONSTRAINT "chk_relationship_strength_valid" 
    CHECK ("strength" >= 1 AND "strength" <= 10)
);

-- Indexes for asset relationships
CREATE INDEX IF NOT EXISTS "idx_asset_relationships_source" ON "asset_relationships" ("source_asset_id");
CREATE INDEX IF NOT EXISTS "idx_asset_relationships_target" ON "asset_relationships" ("target_asset_id");
CREATE INDEX IF NOT EXISTS "idx_asset_relationships_type" ON "asset_relationships" ("relationship_type");
CREATE INDEX IF NOT EXISTS "idx_asset_relationships_active" ON "asset_relationships" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_asset_relationships_source_type" ON "asset_relationships" ("source_asset_id", "relationship_type");

-- =====================================================
-- ASSET DEPENDENCIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_dependencies" (
  "id" serial PRIMARY KEY NOT NULL,
  "dependent_asset_id" integer NOT NULL,
  "depends_on_asset_id" integer NOT NULL,
  "dependency_type" "enum_asset_dependency_type" NOT NULL,
  "status" "enum_asset_dependency_status" DEFAULT 'active' NOT NULL,
  "description" text,
  "impact_description" text,
  "recovery_time" integer,
  "alternative_asset_id" integer,
  "is_circular" boolean DEFAULT false,
  "valid_from" timestamp with time zone DEFAULT now(),
  "valid_to" timestamp with time zone,
  "created_by" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "asset_dependencies_dependent_asset_id_assets_id_fk" 
    FOREIGN KEY ("dependent_asset_id") REFERENCES "assets"("id") ON DELETE cascade,
  CONSTRAINT "asset_dependencies_depends_on_asset_id_assets_id_fk" 
    FOREIGN KEY ("depends_on_asset_id") REFERENCES "assets"("id") ON DELETE cascade,
  CONSTRAINT "asset_dependencies_alternative_asset_id_assets_id_fk" 
    FOREIGN KEY ("alternative_asset_id") REFERENCES "assets"("id"),
  CONSTRAINT "asset_dependencies_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id"),
    
  -- Business Rule Constraints
  CONSTRAINT "chk_dependency_not_self" 
    CHECK ("dependent_asset_id" != "depends_on_asset_id"),
  CONSTRAINT "chk_dependency_recovery_time_positive" 
    CHECK ("recovery_time" IS NULL OR "recovery_time" >= 0)
);

-- Indexes for asset dependencies
CREATE INDEX IF NOT EXISTS "idx_asset_dependencies_dependent" ON "asset_dependencies" ("dependent_asset_id");
CREATE INDEX IF NOT EXISTS "idx_asset_dependencies_depends_on" ON "asset_dependencies" ("depends_on_asset_id");
CREATE INDEX IF NOT EXISTS "idx_asset_dependencies_type" ON "asset_dependencies" ("dependency_type");
CREATE INDEX IF NOT EXISTS "idx_asset_dependencies_status" ON "asset_dependencies" ("status");
CREATE INDEX IF NOT EXISTS "idx_asset_dependencies_circular" ON "asset_dependencies" ("is_circular");
CREATE INDEX IF NOT EXISTS "idx_asset_dependencies_dependent_type" ON "asset_dependencies" ("dependent_asset_id", "dependency_type");

-- =====================================================
-- ASSET GROUPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_groups" (
  "id" serial PRIMARY KEY NOT NULL,
  "parent_id" integer,
  "name" varchar(255) NOT NULL,
  "description" text,
  "group_type" "enum_asset_group_type" NOT NULL,
  "color" varchar(7) DEFAULT '#3498db',
  "icon" varchar(50) DEFAULT 'folder',
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0,
  "created_by" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "asset_groups_parent_id_asset_groups_id_fk" 
    FOREIGN KEY ("parent_id") REFERENCES "asset_groups"("id") ON DELETE cascade,
  CONSTRAINT "asset_groups_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
);

-- Indexes for asset groups
CREATE INDEX IF NOT EXISTS "idx_asset_groups_parent" ON "asset_groups" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_asset_groups_name" ON "asset_groups" ("name");
CREATE INDEX IF NOT EXISTS "idx_asset_groups_type" ON "asset_groups" ("group_type");
CREATE INDEX IF NOT EXISTS "idx_asset_groups_active" ON "asset_groups" ("is_active");

-- =====================================================
-- ASSET GROUP MEMBERSHIPS TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_group_memberships" (
  "id" serial PRIMARY KEY NOT NULL,
  "asset_id" integer NOT NULL,
  "group_id" integer NOT NULL,
  "is_primary" boolean DEFAULT false,
  "added_by" integer NOT NULL,
  "added_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "asset_group_memberships_asset_id_assets_id_fk" 
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE cascade,
  CONSTRAINT "asset_group_memberships_group_id_asset_groups_id_fk" 
    FOREIGN KEY ("group_id") REFERENCES "asset_groups"("id") ON DELETE cascade,
  CONSTRAINT "asset_group_memberships_added_by_users_id_fk" 
    FOREIGN KEY ("added_by") REFERENCES "users"("id"),
    
  -- Unique constraint to prevent duplicate memberships
  CONSTRAINT "unique_asset_group_membership" UNIQUE("asset_id", "group_id")
);

-- Indexes for asset group memberships
CREATE INDEX IF NOT EXISTS "idx_asset_group_memberships_asset" ON "asset_group_memberships" ("asset_id");
CREATE INDEX IF NOT EXISTS "idx_asset_group_memberships_group" ON "asset_group_memberships" ("group_id");
CREATE INDEX IF NOT EXISTS "idx_asset_group_memberships_primary" ON "asset_group_memberships" ("is_primary");

-- =====================================================
-- ADDITIONAL BUSINESS RULE FUNCTIONS
-- =====================================================

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency(
  p_dependent_asset_id INTEGER,
  p_depends_on_asset_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  circular_found BOOLEAN := FALSE;
BEGIN
  -- Use recursive CTE to check for circular dependencies
  WITH RECURSIVE dependency_chain AS (
    -- Base case: direct dependency
    SELECT depends_on_asset_id as asset_id, 1 as depth
    FROM asset_dependencies 
    WHERE dependent_asset_id = p_depends_on_asset_id 
      AND status = 'active'
    
    UNION ALL
    
    -- Recursive case: follow the chain
    SELECT ad.depends_on_asset_id, dc.depth + 1
    FROM asset_dependencies ad
    JOIN dependency_chain dc ON ad.dependent_asset_id = dc.asset_id
    WHERE dc.depth < 10 -- Prevent infinite recursion
      AND ad.status = 'active'
  )
  SELECT EXISTS(
    SELECT 1 FROM dependency_chain 
    WHERE asset_id = p_dependent_asset_id
  ) INTO circular_found;
  
  RETURN circular_found;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically detect circular dependencies
CREATE OR REPLACE FUNCTION prevent_circular_dependencies()
RETURNS TRIGGER AS $$
BEGIN
  IF check_circular_dependency(NEW.dependent_asset_id, NEW.depends_on_asset_id) THEN
    RAISE EXCEPTION 'Circular dependency detected between assets % and %', 
      NEW.dependent_asset_id, NEW.depends_on_asset_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to asset_dependencies table
DROP TRIGGER IF EXISTS trigger_prevent_circular_dependencies ON asset_dependencies;
CREATE TRIGGER trigger_prevent_circular_dependencies
  BEFORE INSERT OR UPDATE ON asset_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION prevent_circular_dependencies();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('assets/0002_asset_relationships', NOW())
ON CONFLICT ("version") DO NOTHING;
