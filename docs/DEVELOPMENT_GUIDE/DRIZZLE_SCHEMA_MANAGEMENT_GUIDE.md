# Drizzle Schema Management Guide

## 🎯 Overview

This guide helps you manage and verify Drizzle ORM schemas for all database tables in the CYPHER application, ensuring complete coverage and consistency between your database structure and TypeScript definitions.

## 📋 Table of Contents

1. [Quick Schema Coverage Check](#quick-schema-coverage-check)
2. [Detailed Schema Analysis](#detailed-schema-analysis)
3. [Current Schema Status](#current-schema-status)
4. [Creating Missing Schemas](#creating-missing-schemas)
5. [Schema Best Practices](#schema-best-practices)
6. [Troubleshooting](#troubleshooting)

## 🔍 Quick Schema Coverage Check

### **Method 1: Using the Quick Check Script**
```bash
# Navigate to API directory
cd api

# Run quick schema coverage check
node scripts/quick-schema-check.js
```

**Expected Output:**
```
🔍 Quick Schema Coverage Check
==============================

📊 Database Tables: 45
📋 Drizzle Schemas: 42
✅ Coverage: 93% (42/45)

❌ Tables Missing Drizzle Schemas:
==================================
   • scan_jobs
   • scan_results
   • scan_schedules
```

### **Method 2: Using the DB Query Tool**
```bash
# Use the existing db-query tool
node scripts/db-query.js coverage
```

### **Method 3: Using the Detailed Analysis Script**
```bash
# Run comprehensive schema analysis
node scripts/check-drizzle-schema-coverage.js
```

### **Method 4: Massive Schema Analysis (NEW - For 234 Tables)**
```bash
# Analyze all 234 tables with categorization and phased approach
node scripts/analyze-massive-schema.js
```

**This specialized script provides:**
- Complete analysis of all 234 database tables
- Categorization by functional area (Security, SIEM, AI, etc.)
- Phased implementation recommendations
- Priority-based approach for manageable development
- File structure recommendations for organizing schemas

## 📊 Detailed Schema Analysis

### **What the Detailed Script Provides:**

1. **Complete Coverage Report**
   - Lists all matched tables with their schemas
   - Shows missing schemas with column details
   - Identifies orphaned schemas (no corresponding table)

2. **Auto-Generated Schema Templates**
   - Creates Drizzle schema code for missing tables
   - Maps PostgreSQL types to Drizzle types
   - Includes proper defaults and constraints

3. **Actionable Recommendations**
   - Step-by-step instructions for fixing issues
   - Best practices for schema management

### **Sample Detailed Output:**
```
✅ TABLES WITH DRIZZLE SCHEMAS:
===============================
   assets (15 columns) -> assets
   systems (25 columns) -> systems
   users (12 columns) -> users
   vulnerabilities (18 columns) -> vulnerabilities

❌ TABLES MISSING DRIZZLE SCHEMAS:
==================================

📋 SCAN_JOBS (8 columns):
   • id: integer (not null)
   • name: character varying (not null)
   • status: character varying (not null default: 'pending')
   • created_at: timestamp with time zone (not null default: CURRENT_TIMESTAMP)

🛠️  GENERATING SCHEMA TEMPLATES:
================================

// Schema for scan_jobs
const scanJobs = pgTable('scan_jobs', {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  status: varchar({ length: 50 }).notNull().default('pending'),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
```

## 📋 Current Schema Status - MASSIVE DATABASE!

**🚨 IMPORTANT: Your database has 234 tables!** This is a comprehensive enterprise system.

### **📊 Coverage Analysis:**
- **Total Database Tables**: 234
- **Existing Drizzle Schemas**: 23
- **Missing Schemas**: 211
- **Current Coverage**: ~10%

### **✅ Existing Schemas (23 tables covered):**
- `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `user_preferences`
- `access_requests`, `email_logs`, `email_templates`
- `systems`, `assets`, `vulnerabilities`, `poams`, `controls`, `cves`
- `asset_cost_management`, `asset_groups`, `asset_lifecycle`, `asset_vulnerabilities`
- `artifacts`, `artifact_categories`, `artifact_references`, `artifact_tags`

### **❌ Major Missing Schema Categories (211 tables):**

#### **🔒 Security & Scanning (Critical Priority)**
- `scan_jobs`, `scan_results`, `scan_schedules`, `scan_targets`, `scan_policies`
- `scan_reports`, `scan_templates`, `scan_findings`
- `vulnerability_*` tables (cost analysis, patches, references, etc.)

#### **🛡️ SIEM & Monitoring (High Priority)**
- `siem_events`, `siem_alerts`, `siem_log_sources`, `siem_rules`
- `siem_incidents`, `siem_analytics`, `siem_dashboards`, `siem_threat_intelligence`

#### **🤖 AI & Automation (High Priority)**
- `ai_assistance_requests`, `notifications`, `notification_*` tables
- `nlq_*` tables (chat, queries, data sources, etc.)

#### **🔧 Patch Management (High Priority)**
- `patch_jobs`, `patch_schedules`, `patches`, `patch_approvals`
- `patch_*` tables (targets, notes, logs, dependencies, etc.)

#### **📋 STIG & Compliance (Medium Priority)**
- `stig_assessments`, `stig_reviews`, `stig_scan_results`, `stig_assets`
- `stig_*` tables (AI assistance, fix status, assignments, etc.)

#### **📄 Document Management (Medium Priority)**
- `documents`, `document_versions`, `document_shares`, `document_comments`
- `document_*` tables (analytics, favorites, changes, templates)

#### **🔄 Workflows & Automation (Medium Priority)**
- `workflows`, `workflow_edges`, `workflow_instances`, `workflow_nodes`
- `workflow_triggers`, `workflow_executions`

#### **📊 Dashboards & UI (Low Priority)**
- `dashboards`, `dashboard_widgets`, `dashboard_metrics`, `dashboard_shares`
- `user_dashboards`, `widget_templates`

#### **🔗 Integrations & APIs (Low Priority)**
- `integrations`, `import_jobs`, `export_jobs`, `webhook_*` tables
- API and data integration tables

#### **🏢 System Management (Low Priority)**
- `system_*` tables (compliance, configuration, discovery, etc.)
- `asset_*` tables (network, systems, tags, operational costs)

### **🎯 Recommended Phased Approach:**
Given the massive scope (211 missing schemas), implement in phases:
1. **Phase 1**: Security & Scanning (8 tables) - Critical
2. **Phase 2**: SIEM & Monitoring (8 tables) - High Priority
3. **Phase 3**: AI & Automation (6 tables) - High Priority
4. **Phase 4**: Patch Management (9 tables) - High Priority
5. **Phase 5**: STIG & Compliance (7 tables) - Medium Priority
6. **Phase 6**: Document Management (8 tables) - Medium Priority

## 🛠️ Creating Missing Schemas

### **Step 1: Run the Coverage Check**
```bash
cd api
node scripts/check-drizzle-schema-coverage.js
```

### **Step 2: Use Generated Templates**
The script will generate Drizzle schema templates for missing tables. Copy these templates and:

1. **Create schema files** in `api/src/db/schema/`
2. **Add proper imports** and exports
3. **Update the main schema index**

### **Step 3: Example Schema Creation**

**File: `api/src/db/schema/scanner.js`**
```javascript
import { pgTable, serial, varchar, text, integer, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const scanJobs = pgTable('scan_jobs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scanType: varchar('scan_type', { length: 50 }).notNull(),
  target: varchar('target', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  configuration: jsonb('configuration').default({}),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const scanResults = pgTable('scan_results', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => scanJobs.id).notNull(),
  resultData: jsonb('result_data').notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

### **Step 4: Update Schema Index**

**File: `api/src/db/schema/index.js`**
```javascript
// Add to existing exports
export * from './scanner.js';
export * from './siem.js';
export * from './ai-assistance.js';
// ... other new schema files
```

## 📝 Schema Best Practices

### **1. Naming Conventions**
```javascript
// ✅ Good: Consistent naming
export const scanJobs = pgTable('scan_jobs', { ... });
export const scanResults = pgTable('scan_results', { ... });

// ❌ Avoid: Inconsistent naming
export const ScanJob = pgTable('scan_jobs', { ... });
export const scan_result = pgTable('scan_results', { ... });
```

### **2. Foreign Key Relationships**
```javascript
// ✅ Good: Proper foreign key references
export const scanJobs = pgTable('scan_jobs', {
  createdBy: integer('created_by').references(() => users.id).notNull(),
});

// ❌ Avoid: Missing foreign key constraints
export const scanJobs = pgTable('scan_jobs', {
  createdBy: integer('created_by').notNull(), // No reference
});
```

### **3. Default Values and Constraints**
```javascript
// ✅ Good: Proper defaults and constraints
export const scanJobs = pgTable('scan_jobs', {
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  enabled: boolean('enabled').notNull().default(true),
});
```

### **4. TypeScript Integration**
```javascript
// ✅ Good: Export types for TypeScript
export type ScanJob = typeof scanJobs.$inferSelect;
export type NewScanJob = typeof scanJobs.$inferInsert;
```

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. Schema Not Found Error**
```
Error: Table "scan_jobs" not found in schema
```
**Solution:** The table exists in database but missing Drizzle schema
```bash
node scripts/check-drizzle-schema-coverage.js
# Follow the generated template to create the schema
```

#### **2. Type Mapping Issues**
```
Error: Cannot map PostgreSQL type "custom_enum" to Drizzle
```
**Solution:** Create custom enum types
```javascript
import { pgEnum } from 'drizzle-orm/pg-core';

export const scanStatusEnum = pgEnum('scan_status', ['pending', 'running', 'completed', 'failed']);

export const scanJobs = pgTable('scan_jobs', {
  status: scanStatusEnum('status').notNull().default('pending'),
});
```

#### **3. Import/Export Issues**
```
Error: Cannot import schema from index
```
**Solution:** Check schema index file exports
```javascript
// In api/src/db/schema/index.js
export * from './scanner.js';
export * from './siem.js';
// Make sure all schema files are exported
```

### **Verification Commands:**
```bash
# Check if all schemas are properly imported
node -e "console.log(Object.keys(require('./src/db/schema')))"

# Test database connection with schemas
node scripts/db-query.js tables

# Verify schema coverage
node scripts/quick-schema-check.js
```

## 📊 Monitoring Schema Coverage

### **Regular Checks:**
1. **After Database Migrations** - Always check schema coverage
2. **Before Releases** - Ensure 100% coverage
3. **During Development** - Check when adding new tables

### **Automated Checks:**
Add to your CI/CD pipeline:
```bash
# In your GitHub Actions or GitLab CI
- name: Check Drizzle Schema Coverage
  run: |
    cd api
    npm run schema:check || exit 1
```

**Package.json script:**
```json
{
  "scripts": {
    "schema:check": "node scripts/quick-schema-check.js",
    "schema:analyze": "node scripts/check-drizzle-schema-coverage.js"
  }
}
```

## 🎯 Next Steps

1. **Run the coverage check** to see your current status
2. **Create missing schemas** using the generated templates
3. **Update your schema index** to include new schemas
4. **Test the schemas** with your existing services
5. **Set up automated monitoring** for future changes

---

**Last Updated:** December 2024  
**Status:** ✅ **Schema Management Tools Ready**  
**Coverage Goal:** 100% of database tables have Drizzle schemas
