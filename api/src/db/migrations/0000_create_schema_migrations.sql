-- Migration: 0000_create_schema_migrations.sql
-- Description: Create the schema_migrations table to track applied migrations
-- Author: Migration System
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS schema_migrations;

-- =====================================================
-- CREATE SCHEMA MIGRATIONS TRACKING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "schema_migrations" (
  "version" varchar(255) PRIMARY KEY NOT NULL,
  "applied_at" timestamp with time zone DEFAULT now() NOT NULL,
  "execution_time_ms" integer,
  "checksum" varchar(64)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_schema_migrations_applied_at" ON "schema_migrations" ("applied_at");

-- Insert this migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('0000_create_schema_migrations', NOW())
ON CONFLICT ("version") DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
