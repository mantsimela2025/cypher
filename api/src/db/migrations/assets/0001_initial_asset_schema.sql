-- Migration: assets/0001_initial_asset_schema.sql
-- Description: Create core asset management tables (categories, types, locations, assets)
-- Author: Asset Management System
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS assets, asset_locations, asset_types, asset_categories CASCADE; DROP TYPE IF EXISTS enum_asset_status, enum_asset_condition CASCADE;

-- =====================================================
-- ASSET CATEGORIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "code" varchar(20) NOT NULL,
  "color" varchar(7) DEFAULT '#3498db',
  "icon" varchar(50) DEFAULT 'server',
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" serial NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "asset_categories_name_unique" UNIQUE("name"),
  CONSTRAINT "asset_categories_code_unique" UNIQUE("code")
);

-- Basic indexes for asset categories
CREATE INDEX IF NOT EXISTS "idx_asset_categories_name" ON "asset_categories" ("name");
CREATE INDEX IF NOT EXISTS "idx_asset_categories_code" ON "asset_categories" ("code");
CREATE INDEX IF NOT EXISTS "idx_asset_categories_active" ON "asset_categories" ("is_active");

-- =====================================================
-- ASSET TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_types" (
  "id" serial PRIMARY KEY NOT NULL,
  "category_id" integer NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "code" varchar(20) NOT NULL,
  "default_specs" text,
  "requires_serial" boolean DEFAULT true,
  "requires_location" boolean DEFAULT true,
  "requires_warranty" boolean DEFAULT false,
  "depreciation_rate" integer DEFAULT 20,
  "expected_lifespan" integer DEFAULT 60,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" serial NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "asset_types_category_id_asset_categories_id_fk" 
    FOREIGN KEY ("category_id") REFERENCES "asset_categories"("id") ON DELETE cascade
);

-- Basic indexes for asset types
CREATE INDEX IF NOT EXISTS "idx_asset_types_category" ON "asset_types" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_asset_types_name" ON "asset_types" ("name");
CREATE INDEX IF NOT EXISTS "idx_asset_types_code" ON "asset_types" ("code");
CREATE INDEX IF NOT EXISTS "idx_asset_types_active" ON "asset_types" ("is_active");

-- =====================================================
-- ASSET LOCATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_locations" (
  "id" serial PRIMARY KEY NOT NULL,
  "parent_id" integer,
  "name" varchar(100) NOT NULL,
  "description" text,
  "code" varchar(20) NOT NULL,
  "type" varchar(50) NOT NULL,
  "address" text,
  "city" varchar(100),
  "state" varchar(50),
  "country" varchar(50),
  "postal_code" varchar(20),
  "latitude" numeric(10, 8),
  "longitude" numeric(11, 8),
  "capacity" integer,
  "current_count" integer DEFAULT 0,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" serial NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "asset_locations_code_unique" UNIQUE("code"),
  CONSTRAINT "asset_locations_parent_id_asset_locations_id_fk" 
    FOREIGN KEY ("parent_id") REFERENCES "asset_locations"("id") ON DELETE cascade
);

-- Basic indexes for asset locations
CREATE INDEX IF NOT EXISTS "idx_asset_locations_parent" ON "asset_locations" ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_asset_locations_name" ON "asset_locations" ("name");
CREATE INDEX IF NOT EXISTS "idx_asset_locations_code" ON "asset_locations" ("code");
CREATE INDEX IF NOT EXISTS "idx_asset_locations_type" ON "asset_locations" ("type");
CREATE INDEX IF NOT EXISTS "idx_asset_locations_active" ON "asset_locations" ("is_active");

-- Location capacity constraints
ALTER TABLE "asset_locations" ADD CONSTRAINT IF NOT EXISTS "chk_location_capacity_positive" 
CHECK ("capacity" IS NULL OR "capacity" > 0);

ALTER TABLE "asset_locations" ADD CONSTRAINT IF NOT EXISTS "chk_location_current_count_valid" 
CHECK ("current_count" >= 0 AND ("capacity" IS NULL OR "current_count" <= "capacity"));

-- =====================================================
-- ASSET ENUMS
-- =====================================================
DO $$ BEGIN
  CREATE TYPE "enum_asset_status" AS ENUM(
    'planned', 'ordered', 'received', 'deployed', 
    'active', 'maintenance', 'retired', 'disposed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "enum_asset_condition" AS ENUM(
    'excellent', 'good', 'fair', 'poor', 'damaged'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- CORE ASSETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "assets" (
  "id" serial PRIMARY KEY NOT NULL,
  
  -- Basic Information
  "name" varchar(255) NOT NULL,
  "description" text,
  "asset_type_id" integer NOT NULL,
  
  -- Identification
  "asset_tag" varchar(100),
  "serial_number" varchar(255),
  "barcode" varchar(255),
  
  -- Manufacturer Information
  "manufacturer" varchar(255),
  "model" varchar(255),
  "model_number" varchar(255),
  
  -- Location and Assignment
  "location_id" integer,
  "assigned_to" integer,
  
  -- Status and Condition
  "status" "enum_asset_status" DEFAULT 'planned' NOT NULL,
  "condition" "enum_asset_condition" DEFAULT 'good',
  
  -- Financial Information
  "purchase_price" numeric(12, 2),
  "current_value" numeric(12, 2),
  "purchase_date" timestamp with time zone,
  
  -- Warranty Information
  "warranty_provider" varchar(255),
  "warranty_start_date" timestamp with time zone,
  "warranty_end_date" timestamp with time zone,
  "warranty_type" varchar(100),
  
  -- Technical Specifications (JSON)
  "specifications" jsonb DEFAULT '{}',
  
  -- Network Information
  "ip_address" varchar(45),
  "mac_address" varchar(17),
  "hostname" varchar(255),
  
  -- Lifecycle Dates
  "deployment_date" timestamp with time zone,
  "retirement_date" timestamp with time zone,
  "disposal_date" timestamp with time zone,
  
  -- Maintenance
  "last_maintenance_date" timestamp with time zone,
  "next_maintenance_date" timestamp with time zone,
  "maintenance_interval" integer,
  
  -- Compliance and Security
  "compliance_status" varchar(100),
  "security_classification" varchar(50),
  
  -- Custom Fields
  "custom_fields" jsonb DEFAULT '{}',
  "tags" varchar(255)[] DEFAULT '{}',
  
  -- Audit Fields
  "created_by" integer NOT NULL,
  "updated_by" integer,
  "deleted_by" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  
  -- Soft delete flag
  "is_deleted" boolean DEFAULT false NOT NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT "assets_asset_type_id_asset_types_id_fk" 
    FOREIGN KEY ("asset_type_id") REFERENCES "asset_types"("id"),
  CONSTRAINT "assets_location_id_asset_locations_id_fk" 
    FOREIGN KEY ("location_id") REFERENCES "asset_locations"("id"),
  CONSTRAINT "assets_assigned_to_users_id_fk" 
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id"),
  CONSTRAINT "assets_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  CONSTRAINT "assets_updated_by_users_id_fk" 
    FOREIGN KEY ("updated_by") REFERENCES "users"("id"),
  CONSTRAINT "assets_deleted_by_users_id_fk" 
    FOREIGN KEY ("deleted_by") REFERENCES "users"("id")
);

-- Basic indexes for assets table
CREATE INDEX IF NOT EXISTS "idx_assets_name" ON "assets" ("name");
CREATE INDEX IF NOT EXISTS "idx_assets_asset_tag" ON "assets" ("asset_tag");
CREATE INDEX IF NOT EXISTS "idx_assets_serial" ON "assets" ("serial_number");
CREATE INDEX IF NOT EXISTS "idx_assets_type" ON "assets" ("asset_type_id");
CREATE INDEX IF NOT EXISTS "idx_assets_location" ON "assets" ("location_id");
CREATE INDEX IF NOT EXISTS "idx_assets_assigned" ON "assets" ("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_assets_status" ON "assets" ("status");
CREATE INDEX IF NOT EXISTS "idx_assets_condition" ON "assets" ("condition");
CREATE INDEX IF NOT EXISTS "idx_assets_deleted" ON "assets" ("is_deleted");

-- Basic constraints for assets
ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_purchase_price_positive" 
CHECK ("purchase_price" IS NULL OR "purchase_price" >= 0);

ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_current_value_positive" 
CHECK ("current_value" IS NULL OR "current_value" >= 0);

ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_warranty_dates" 
CHECK ("warranty_start_date" IS NULL OR "warranty_end_date" IS NULL OR "warranty_start_date" <= "warranty_end_date");

ALTER TABLE "assets" ADD CONSTRAINT IF NOT EXISTS "chk_assets_maintenance_interval_positive" 
CHECK ("maintenance_interval" IS NULL OR "maintenance_interval" > 0);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('assets/0001_initial_asset_schema', NOW())
ON CONFLICT ("version") DO NOTHING;
