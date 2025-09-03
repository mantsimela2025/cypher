# CYPHER Asset Management - Database Migrations

## Overview
This directory contains SQL migration scripts for the CYPHER Asset Management system. Migrations are organized into logical subfolders and executed in order, tracked to ensure consistent database schema across all environments.

---

## 📁 **Migration Structure**

### **Organized by Category:**
```
/db/migrations/
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
└── README.md                  # This documentation
```

### **Current Migrations:**
1. **`assets/0001_initial_asset_schema.sql`** - Core asset management tables
2. **`assets/0002_asset_relationships.sql`** - Asset relationships and dependencies
3. **`performance/0003_performance_indexes.sql`** - Advanced indexes and optimization
4. **`permissions/0004_asset_permissions.sql`** - Asset management permissions and RBAC
5. **`seed/0005_seed_data.sql`** - Initial seed data for categories, types, and locations

---

## 🚀 **Running Migrations**

### **Prerequisites:**
```bash
# Ensure environment variables are set
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=development  # or production
```

### **Basic Commands:**
```bash
# Run all pending migrations
node api/src/db/migrations/migrate.js

# Or using npm script (add to package.json)
npm run db:migrate

# Show migration status
node api/src/db/migrations/migrate.js status

# Validate migration checksums
node api/src/db/migrations/migrate.js validate

# Rollback last migration (DANGEROUS!)
node api/src/db/migrations/migrate.js rollback
```

### **NPM Scripts (Add to package.json):**
```json
{
  "scripts": {
    "db:migrate": "node src/db/migrations/migrate.js",
    "db:migrate:status": "node src/db/migrations/migrate.js status",
    "db:migrate:validate": "node src/db/migrations/migrate.js validate",
    "db:migrate:rollback": "node src/db/migrations/migrate.js rollback",
    "db:setup": "npm run db:migrate && npm run db:seed"
  }
}
```

---

## 📋 **Migration Details**

### **Migration assets/0001: Initial Asset Schema**
**Purpose:** Creates the foundation tables for asset management
**Location:** `assets/0001_initial_asset_schema.sql`
**Tables Created:**
- `asset_categories` - Asset categorization (Hardware, Software, etc.)
- `asset_types` - Specific asset types within categories
- `asset_locations` - Hierarchical location structure
- `assets` - Core asset table with comprehensive tracking

**Key Features:**
- Hierarchical location structure (Building > Floor > Room > Rack)
- Comprehensive asset tracking (financial, technical, lifecycle)
- Soft delete pattern with audit fields
- JSON fields for specifications and custom data
- Basic indexes for performance

### **Migration assets/0002: Asset Relationships**
**Purpose:** Adds relationship and dependency tracking between assets
**Location:** `assets/0002_asset_relationships.sql`
**Tables Created:**
- `asset_relationships` - General asset relationships
- `asset_dependencies` - Critical dependency tracking
- `asset_groups` - Asset grouping functionality
- `asset_group_memberships` - Many-to-many group assignments

**Key Features:**
- Circular dependency detection with triggers
- Relationship strength and impact tracking
- Hierarchical asset groups
- Business rule validation functions

### **Migration performance/0003: Performance Indexes**
**Purpose:** Adds advanced indexes and optimization features
**Location:** `performance/0003_performance_indexes.sql`
**Features Added:**
- Full-text search indexes for asset discovery
- JSON indexes for specifications and custom fields
- Composite indexes for common query patterns
- Advanced check constraints for data validation
- Performance monitoring functions
- Automated maintenance functions

### **Migration permissions/0004: Asset Permissions**
**Purpose:** Integrates with CYPHER RBAC system
**Location:** `permissions/0004_asset_permissions.sql`
**Permissions Added:**
- 30+ granular asset management permissions
- Role-based permission assignments (admin, moderator, user)
- Asset-specific access control functions
- Permission validation utilities
- Reporting views for permission auditing

### **Migration seed/0005: Seed Data**
**Purpose:** Provides initial data for development and testing
**Location:** `seed/0005_seed_data.sql`
**Data Included:**
- 8 asset categories with proper icons and colors
- 20+ asset types with realistic specifications
- Hierarchical location structure (4 buildings, multiple floors/rooms/racks)
- Sample assets for testing (servers, workstations, laptops)
- Proper foreign key relationships and data integrity

---

## 🔧 **Migration System Features**

### **Tracking and Validation:**
- **Migration Tracking:** `schema_migrations` table tracks applied migrations
- **Checksum Validation:** Detects if applied migrations have been modified
- **Execution Timing:** Records how long each migration took
- **Transaction Safety:** Each migration runs in a transaction

### **Safety Features:**
- **Rollback Information:** Each migration includes rollback instructions
- **Conflict Handling:** Uses `ON CONFLICT` clauses to prevent duplicate data
- **Validation Functions:** Business rule validation at database level
- **Error Handling:** Comprehensive error reporting and transaction rollback

### **Development Features:**
- **Status Reporting:** See which migrations are applied/pending
- **Checksum Validation:** Ensure migration integrity
- **Detailed Logging:** Comprehensive output for debugging
- **Environment Awareness:** Different behavior for dev/prod

---

## 📊 **Migration Status Example**

```bash
$ npm run db:migrate:status

📊 Migration Status:

✅ assets/0001_initial_asset_schema (assets) - Applied on 1/19/2024, 10:30:15 AM (1,234ms)
✅ assets/0002_asset_relationships (assets) - Applied on 1/19/2024, 10:31:45 AM (856ms)
✅ performance/0003_performance_indexes (performance) - Applied on 1/19/2024, 10:32:30 AM (2,103ms)
✅ permissions/0004_asset_permissions (permissions) - Applied on 1/19/2024, 10:33:15 AM (445ms)
⏳ seed/0005_seed_data (seed) - Pending

📈 Summary: 4 applied, 1 pending
```

---

## ⚠️ **Important Notes**

### **Production Considerations:**
1. **Always backup** the database before running migrations in production
2. **Test migrations** thoroughly in staging environment first
3. **Plan downtime** for large migrations that may lock tables
4. **Monitor performance** during and after migration execution
5. **Have rollback plan** ready in case of issues

### **Development Workflow:**
1. **Pull latest code** to get new migration files
2. **Run migration status** to see what needs to be applied
3. **Run migrations** to update your local database
4. **Validate checksums** if you suspect file changes
5. **Test your changes** against the updated schema

### **Creating New Migrations:**
1. **Choose appropriate subfolder:** `assets/`, `performance/`, `permissions/`, `seed/`, etc.
2. **Follow naming convention:** `NNNN_descriptive_name.sql`
3. **Include rollback instructions** in comments at the top
4. **Update migration version** in INSERT statement: `'subfolder/NNNN_descriptive_name'`
5. **Use transactions** and proper error handling
6. **Test thoroughly** before committing
7. **Update this README** with migration details

### **Subfolder Guidelines:**
- **`assets/`** - Core asset tables, relationships, business logic
- **`performance/`** - Indexes, constraints, optimization functions
- **`permissions/`** - RBAC, permissions, access control
- **`seed/`** - Initial data, test data, reference data
- **`maintenance/`** - Cleanup scripts, data migrations
- **`features/`** - New feature-specific tables and logic

---

## 🔗 **Related Documentation**

- [Database Schema Design Guide](../../technical-guides/01_Database_Schema_Design.md)
- [Asset Management Integration Examples](../../Asset_Management_Integration_Examples.md)
- [CYPHER Asset Management JIRA Task Breakdown](../../CYPHER_Asset_Management_Jira_Task_Breakdown.md)

---

## 🆘 **Troubleshooting**

### **Common Issues:**

**Migration fails with permission error:**
```bash
# Check database connection and permissions
psql $DATABASE_URL -c "SELECT current_user, current_database();"
```

**Checksum validation fails:**
```bash
# Someone modified an applied migration file
# Either revert the file or create a new migration for the changes
```

**Migration hangs or times out:**
```bash
# Check for table locks or long-running queries
# May need to run during maintenance window
```

**Rollback needed:**
```bash
# Use with extreme caution - only removes tracking record
npm run db:migrate:rollback
# You must manually undo the database changes!
```

For additional help, consult the technical implementation guides or contact the development team.
