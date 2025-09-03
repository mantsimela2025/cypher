# CYPHER Asset Management - Database Migration Guide

## 🎯 **Overview**

This guide provides comprehensive instructions for running database migrations in the CYPHER Asset Management system. Our migration system uses a professional, organized approach with categorized subfolders and automated tracking.

---

## 📋 **Prerequisites**

### **Environment Setup**
```bash
# Required environment variables in .env file
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development  # or production, staging, test
```

### **Dependencies**
```bash
# Ensure these packages are installed
npm install pg dotenv
```

### **Database Connection Test**
```bash
# Test your database connection
psql $DATABASE_URL -c "SELECT current_user, current_database();"
```

---

## 🚀 **Quick Start Commands**

### **Basic Migration Commands**
```bash
# Run all pending migrations
npm run db:migrate

# Check migration status
npm run db:migrate:status

# Validate migration integrity
npm run db:migrate:validate

# Complete database setup (migrate + seed)
npm run db:setup
```

### **Direct Script Execution**
```bash
# Alternative ways to run migrations
node api/src/db/migrations/migrate.js
node api/src/db/migrations/migrate.js status
node api/src/db/migrations/migrate.js validate
```

---

## 📁 **Migration Structure**

### **Organized Categories**
```
/api/src/db/migrations/
├── assets/                    # Core asset management tables
│   ├── 0001_initial_asset_schema.sql
│   └── 0002_asset_relationships.sql
├── performance/               # Performance optimization
│   └── 0003_performance_indexes.sql
├── permissions/               # RBAC and permissions
│   └── 0004_asset_permissions.sql
├── seed/                      # Initial data
│   └── 0005_seed_data.sql
├── migrate.js                 # Migration runner script
└── README.md                  # Technical documentation
```

---

## 🔧 **Detailed Command Reference**

### **1. Running Migrations**

#### **Standard Migration Run**
```bash
npm run db:migrate
```
**What it does:**
- Scans all migration subfolders
- Identifies pending migrations
- Executes them in numerical order
- Records completion in `schema_migrations` table
- Provides detailed execution logs

**Example Output:**
```
🚀 Starting database migrations...

📋 Found 3 pending migration(s):
   - assets/0001_initial_asset_schema (assets)
   - performance/0003_performance_indexes (performance)
   - seed/0005_seed_data (seed)

📄 Running migration: assets/0001_initial_asset_schema
✅ Migration completed: assets/0001_initial_asset_schema (1,234ms)

📄 Running migration: performance/0003_performance_indexes
✅ Migration completed: performance/0003_performance_indexes (2,103ms)

📄 Running migration: seed/0005_seed_data
✅ Migration completed: seed/0005_seed_data (445ms)

🎉 Successfully applied 3 migration(s)!
```

### **2. Checking Migration Status**

#### **Status Check**
```bash
npm run db:migrate:status
```
**What it shows:**
- All available migrations
- Which ones are applied vs pending
- Application timestamps and execution times
- Migration categories

**Example Output:**
```
📊 Migration Status:

✅ assets/0001_initial_asset_schema (assets) - Applied on 1/19/2024, 10:30:15 AM (1,234ms)
✅ assets/0002_asset_relationships (assets) - Applied on 1/19/2024, 10:31:45 AM (856ms)
✅ performance/0003_performance_indexes (performance) - Applied on 1/19/2024, 10:32:30 AM (2,103ms)
✅ permissions/0004_asset_permissions (permissions) - Applied on 1/19/2024, 10:33:15 AM (445ms)
⏳ seed/0005_seed_data (seed) - Pending

📈 Summary: 4 applied, 1 pending
```

### **3. Validating Migration Integrity**

#### **Checksum Validation**
```bash
npm run db:migrate:validate
```
**What it does:**
- Calculates checksums for all migration files
- Compares with stored checksums from when migrations were applied
- Detects if any applied migrations have been modified
- Ensures database integrity

**Example Output:**
```
🔍 Validating migration checksums...

✅ assets/0001_initial_asset_schema - Checksum valid
✅ assets/0002_asset_relationships - Checksum valid
❌ performance/0003_performance_indexes - Checksum mismatch!
   Applied: a1b2c3d4e5f6g7h8
   Current: x9y8z7w6v5u4t3s2

⚠️  Some migrations have been modified after being applied!
   This could indicate tampering or version control issues.
```

### **4. Emergency Rollback (Use with Caution)**

#### **Rollback Last Migration**
```bash
npm run db:migrate:rollback
```
**⚠️ WARNING:** This only removes the migration record from tracking table. It does NOT undo the database changes!

**What it does:**
- Removes the last applied migration from `schema_migrations` table
- Allows the migration to be re-run
- **Does not reverse database changes**

**Example Output:**
```
⚠️  Rolling back last migration...

🔄 Rolling back migration: seed/0005_seed_data
⚠️  WARNING: This will remove the migration record but NOT undo the changes!
   You must manually undo the database changes if needed.

✅ Migration record removed: seed/0005_seed_data
⚠️  Remember to manually undo database changes if necessary!
```

---

## 📊 **NPM Scripts Configuration**

### **Add to package.json**
```json
{
  "scripts": {
    "db:migrate": "node src/db/migrations/migrate.js",
    "db:migrate:status": "node src/db/migrations/migrate.js status",
    "db:migrate:validate": "node src/db/migrations/migrate.js validate",
    "db:migrate:rollback": "node src/db/migrations/migrate.js rollback",
    "db:setup": "npm run db:migrate",
    "db:reset": "npm run db:migrate:rollback && npm run db:migrate",
    "db:fresh": "npm run db:drop && npm run db:migrate"
  }
}
```

---

## 🔄 **Development Workflows**

### **New Developer Setup**
```bash
# 1. Clone repository
git clone <repository-url>
cd cypher

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 4. Run migrations
npm run db:migrate

# 5. Verify setup
npm run db:migrate:status
```

### **Daily Development Workflow**
```bash
# 1. Pull latest changes
git pull origin main

# 2. Check for new migrations
npm run db:migrate:status

# 3. Run any pending migrations
npm run db:migrate

# 4. Validate integrity (optional)
npm run db:migrate:validate

# 5. Start development
npm run dev
```

### **Before Committing Changes**
```bash
# 1. Ensure all migrations are applied
npm run db:migrate:status

# 2. Validate migration integrity
npm run db:migrate:validate

# 3. Test your changes
npm test

# 4. Commit and push
git add .
git commit -m "feat: add new asset feature"
git push
```

---

## 🏗️ **Creating New Migrations**

### **Step-by-Step Process**

#### **1. Choose Appropriate Category**
- **`assets/`** - Core asset tables, relationships, business logic
- **`performance/`** - Indexes, constraints, optimization functions
- **`permissions/`** - RBAC, permissions, access control
- **`seed/`** - Initial data, test data, reference data
- **`maintenance/`** - Cleanup scripts, data migrations
- **`features/`** - New feature-specific tables and logic

#### **2. Create Migration File**
```bash
# Example: Adding asset maintenance tracking
touch api/src/db/migrations/assets/0006_asset_maintenance_tracking.sql
```

#### **3. Migration Template**
```sql
-- Migration: assets/0006_asset_maintenance_tracking.sql
-- Description: Add maintenance tracking tables and functionality
-- Author: Your Name
-- Date: 2024-01-19
-- Rollback: DROP TABLE IF EXISTS asset_maintenance_logs, asset_maintenance_schedules CASCADE;

-- =====================================================
-- ASSET MAINTENANCE SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS "asset_maintenance_schedules" (
  "id" serial PRIMARY KEY NOT NULL,
  "asset_id" integer NOT NULL,
  "maintenance_type" varchar(100) NOT NULL,
  "frequency_days" integer NOT NULL,
  "next_due_date" timestamp with time zone NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  
  CONSTRAINT "asset_maintenance_schedules_asset_id_assets_id_fk" 
    FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE cascade,
  CONSTRAINT "asset_maintenance_schedules_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_maintenance_schedules_asset" 
ON "asset_maintenance_schedules" ("asset_id");

CREATE INDEX IF NOT EXISTS "idx_maintenance_schedules_due_date" 
ON "asset_maintenance_schedules" ("next_due_date");

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('assets/0006_asset_maintenance_tracking', NOW())
ON CONFLICT ("version") DO NOTHING;
```

#### **4. Test Migration**
```bash
# Test on development database
npm run db:migrate

# Verify it was applied
npm run db:migrate:status

# Validate integrity
npm run db:migrate:validate
```

---

## 🚨 **Troubleshooting**

### **Common Issues and Solutions**

#### **Migration Fails with Permission Error**
```bash
# Check database connection and permissions
psql $DATABASE_URL -c "SELECT current_user, current_database();"

# Ensure user has CREATE, ALTER, DROP permissions
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;
```

#### **Checksum Validation Fails**
```bash
# Someone modified an applied migration file
# Option 1: Revert the file to original state
git checkout HEAD -- api/src/db/migrations/path/to/file.sql

# Option 2: Create a new migration for the changes
# Don't modify already-applied migrations!
```

#### **Migration Hangs or Times Out**
```bash
# Check for table locks
SELECT * FROM pg_locks WHERE NOT granted;

# Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

# May need to run during maintenance window
```

#### **Need to Rollback Changes**
```bash
# ⚠️ DANGEROUS - Only removes tracking record
npm run db:migrate:rollback

# You must manually undo database changes:
psql $DATABASE_URL -c "DROP TABLE IF EXISTS new_table_name CASCADE;"
```

---

## 🔒 **Production Considerations**

### **Before Production Deployment**
1. **Backup database** before running migrations
2. **Test migrations** thoroughly in staging environment
3. **Plan maintenance window** for large migrations
4. **Monitor performance** during and after execution
5. **Have rollback plan** ready

### **Production Migration Checklist**
- [ ] Database backup completed
- [ ] Staging environment tested successfully
- [ ] Maintenance window scheduled
- [ ] Team notified of deployment
- [ ] Rollback procedures documented
- [ ] Monitoring alerts configured

### **Production Commands**
```bash
# Set production environment
export NODE_ENV=production

# Run with extra logging
npm run db:migrate 2>&1 | tee migration.log

# Monitor progress
tail -f migration.log
```

---

## 📞 **Getting Help**

### **For Migration Issues:**
1. Check this guide first
2. Review migration logs for error details
3. Consult the technical README in `/migrations/`
4. Contact the database team
5. Check existing GitHub issues

### **Emergency Contacts:**
- **Database Team:** database-team@company.com
- **DevOps Team:** devops@company.com
- **On-Call Engineer:** Use PagerDuty escalation

---

## 📚 **Related Documentation**

- [Database Schema Design Guide](../technical-guides/01_Database_Schema_Design.md)
- [Asset Management Technical Implementation](../technical-guides/)
- [CYPHER Development Setup Guide](./Development_Setup_Guide.md)
- [Database Backup and Recovery Procedures](./Database_Backup_Guide.md)

---

**Remember:** Migrations are powerful tools that directly modify your database. Always test thoroughly and have backups before running in production! 🚀
