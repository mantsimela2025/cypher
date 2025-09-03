-- Setup Script: Create schema_migrations table
-- Run this directly in your database before running migrations

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

-- Verify table was created
SELECT 'schema_migrations table created successfully' as status;

-- Show table structure
\d schema_migrations;
