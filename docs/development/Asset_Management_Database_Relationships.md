# CYPHER Asset Management - Database Relationships Guide

## 🎯 **Overview**

This guide explains the complete database relationship structure for the CYPHER Asset Management system, including how to generate accurate entity relationship diagrams (ERDs) that show all foreign key associations.

---

## 🔧 **Database Schema Architecture**

### **Dual Schema Design**
The CYPHER system uses a **dual schema approach** to support both:
1. **Existing Tenable-based assets** (vulnerability management focused)
2. **New comprehensive asset management** (full lifecycle management)

### **Schema Integration**
- **Bridge tables** connect the two schemas
- **Mapping tables** provide translation between systems
- **Unified views** present consolidated data

---

## 📊 **Core Entity Relationships**

### **1. Asset Management Core Tables**

#### **Primary Hierarchy:**
```
asset_categories (1) ──→ (∞) asset_types
asset_types (1) ──→ (∞) assets
asset_locations (1) ──→ (∞) assets
asset_locations (1) ──→ (∞) asset_locations (self-referencing)
users (1) ──→ (∞) assets (created_by, updated_by, assigned_to)
```

#### **Supporting Relationships:**
```
assets (1) ──→ (∞) asset_relationships (source_asset_id)
assets (1) ──→ (∞) asset_relationships (target_asset_id)
assets (1) ──→ (∞) asset_dependencies (dependent_asset_id)
assets (1) ──→ (∞) asset_dependencies (depends_on_asset_id)
assets (1) ──→ (∞) asset_group_memberships
asset_groups (1) ──→ (∞) asset_group_memberships
```

### **2. Tenable Integration Tables**

#### **Tenable Asset Relationships:**
```
assets (tenable) (1) ──→ (∞) asset_systems
assets (tenable) (1) ──→ (∞) asset_network
assets (tenable) (1) ──→ (∞) asset_tags
assets (tenable) (1) ──→ (∞) asset_cost_management
assets (tenable) (1) ──→ (∞) asset_lifecycle
assets (tenable) (1) ──→ (∞) asset_operational_costs
assets (tenable) (1) ──→ (∞) asset_risk_mapping
systems (1) ──→ (∞) system_assets
```

### **3. Bridge and Mapping Tables**

#### **Schema Integration:**
```
assets (tenable) (1) ──→ (1) asset_schema_mapping
assets (asset_mgmt) (1) ──→ (1) asset_schema_mapping
```

---

## 🔗 **Foreign Key Relationships**

### **Asset Management Tables**

#### **assets table:**
- `asset_type_id` → `asset_types.id`
- `location_id` → `asset_locations.id`
- `assigned_to` → `users.id`
- `created_by` → `users.id`
- `updated_by` → `users.id`
- `deleted_by` → `users.id`
- `asset_category_id` → `asset_categories.id` *(added in migration 0012)*
- `asset_location_id` → `asset_locations.id` *(added in migration 0012)*

#### **asset_types table:**
- `category_id` → `asset_categories.id`

#### **asset_locations table:**
- `parent_id` → `asset_locations.id` (self-referencing)

#### **asset_relationships table:**
- `source_asset_id` → `assets.id`
- `target_asset_id` → `assets.id`
- `created_by` → `users.id`

#### **asset_dependencies table:**
- `dependent_asset_id` → `assets.id`
- `depends_on_asset_id` → `assets.id`
- `alternative_asset_id` → `assets.id`
- `created_by` → `users.id`

#### **asset_groups table:**
- `parent_id` → `asset_groups.id` (self-referencing)
- `created_by` → `users.id`

#### **asset_group_memberships table:**
- `asset_id` → `assets.id`
- `group_id` → `asset_groups.id`
- `added_by` → `users.id`

### **Tenable Integration Tables**

#### **asset_cost_management table:**
- `asset_uuid` → `assets.asset_uuid`
- `created_by` → `users.id`
- `last_modified_by` → `users.id`

#### **asset_groups table (Tenable):**
- `asset_uuid` → `assets.asset_uuid`
- `created_by` → `users.id`

#### **asset_group_members table:**
- `group_id` → `asset_groups.id`
- `asset_uuid` → `assets.asset_uuid`
- `added_by` → `users.id`

#### **asset_lifecycle table:**
- `asset_uuid` → `assets.asset_uuid`
- `created_by` → `users.id`
- `updated_by` → `users.id`

#### **asset_operational_costs table:**
- `asset_uuid` → `assets.asset_uuid`
- `created_by` → `users.id`
- `updated_by` → `users.id`

#### **asset_risk_mapping table:**
- `asset_uuid` → `assets.asset_uuid`
- `created_by` → `users.id`
- `verified_by` → `users.id`

#### **asset_tags table:**
- `asset_uuid` → `assets.asset_uuid`

#### **system_assets table:**
- `system_id` → `systems.system_id`
- `asset_uuid` → `assets.asset_uuid`

#### **asset_systems table:**
- `asset_uuid` → `assets.asset_uuid`

#### **asset_network table:**
- `asset_uuid` → `assets.asset_uuid`

### **Bridge Tables**

#### **asset_schema_mapping table:**
- `tenable_asset_uuid` → `assets.asset_uuid` (Tenable assets)
- `asset_management_id` → `assets.id` (Asset management assets)
- `created_by` → `users.id`
- `verified_by` → `users.id`

---

## 🛠️ **Generating Entity Relationship Diagrams**

### **Database Tools Configuration**

#### **For Complete ERD Generation:**

1. **Include All Tables:**
   ```sql
   -- Core Asset Management
   asset_categories, asset_types, asset_locations, assets
   
   -- Relationships and Groups
   asset_relationships, asset_dependencies, asset_groups, asset_group_memberships
   
   -- Tenable Integration
   asset_cost_management, asset_lifecycle, asset_operational_costs
   asset_risk_mapping, asset_tags, system_assets, asset_systems, asset_network
   
   -- Bridge Tables
   asset_schema_mapping
   
   -- Supporting Tables
   users, systems
   ```

2. **Foreign Key Constraints to Verify:**
   ```sql
   -- Check all foreign key constraints exist
   SELECT 
     tc.table_name, 
     kcu.column_name, 
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
   WHERE tc.constraint_type = 'FOREIGN KEY' 
     AND tc.table_name LIKE 'asset%'
   ORDER BY tc.table_name, kcu.column_name;
   ```

### **ERD Tool Recommendations**

#### **1. pgAdmin 4:**
- Right-click database → "Generate ERD"
- Include all asset-related tables
- Show foreign key relationships
- Export as PNG/SVG

#### **2. DBeaver:**
- Database → ER Diagram
- Select all asset management tables
- Configure to show foreign keys
- Export diagram

#### **3. dbdiagram.io:**
```sql
// Example DBML for key relationships
Table asset_categories {
  id integer [pk]
  name varchar(100)
  code varchar(20)
}

Table asset_types {
  id integer [pk]
  category_id integer [ref: > asset_categories.id]
  name varchar(100)
  code varchar(20)
}

Table assets {
  id integer [pk]
  asset_type_id integer [ref: > asset_types.id]
  location_id integer [ref: > asset_locations.id]
  assigned_to integer [ref: > users.id]
  created_by integer [ref: > users.id]
}
```

#### **4. SchemaSpy:**
```bash
# Generate comprehensive documentation with ERDs
java -jar schemaspy.jar -t pgsql -host localhost -db cypher -u username -p password -o output_dir
```

---

## 🔍 **Troubleshooting Missing Relationships**

### **Common Issues:**

#### **1. Missing Foreign Key Constraints:**
```sql
-- Run migration 0012 to add missing constraints
npm run db:migrate
```

#### **2. Orphaned Records:**
```sql
-- Check for orphaned records that prevent FK creation
SELECT * FROM asset_cost_management acm
LEFT JOIN assets a ON acm.asset_uuid = a.asset_uuid
WHERE a.asset_uuid IS NULL;
```

#### **3. Data Type Mismatches:**
```sql
-- Verify column types match between related tables
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('assets', 'asset_types', 'asset_categories')
  AND column_name IN ('id', 'asset_type_id', 'category_id');
```

### **Validation Queries:**

#### **Check All Asset Management Relationships:**
```sql
-- Verify all expected foreign keys exist
WITH expected_fks AS (
  SELECT 'assets' as table_name, 'asset_type_id' as column_name, 'asset_types' as ref_table, 'id' as ref_column
  UNION ALL SELECT 'assets', 'location_id', 'asset_locations', 'id'
  UNION ALL SELECT 'assets', 'assigned_to', 'users', 'id'
  UNION ALL SELECT 'asset_types', 'category_id', 'asset_categories', 'id'
  UNION ALL SELECT 'asset_cost_management', 'asset_uuid', 'assets', 'asset_uuid'
  -- Add more expected relationships...
)
SELECT 
  efk.*,
  CASE WHEN tc.constraint_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as fk_status
FROM expected_fks efk
LEFT JOIN information_schema.table_constraints tc ON tc.table_name = efk.table_name AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name AND kcu.column_name = efk.column_name;
```

---

## 📋 **Migration Checklist**

### **Before Generating ERD:**

- [ ] Run all asset management migrations
- [ ] Execute migration 0012 (fix foreign keys)
- [ ] Verify no orphaned records exist
- [ ] Check all foreign key constraints are created
- [ ] Validate data types match between related tables

### **ERD Generation Steps:**

1. **Connect to database** with full schema access
2. **Select all asset-related tables** (see list above)
3. **Include foreign key relationships** in diagram settings
4. **Show table details** (columns, data types, constraints)
5. **Export high-resolution diagram** (PNG/SVG)
6. **Verify all expected relationships** are visible

---

## 🎯 **Expected ERD Structure**

Your completed ERD should show:

- **Central assets table** connected to all supporting tables
- **Hierarchical relationships** (categories → types → assets)
- **Self-referencing relationships** (locations, groups)
- **Many-to-many relationships** (asset groups, relationships)
- **Bridge connections** between Tenable and Asset Management schemas
- **User audit trails** (created_by, updated_by relationships)

The migration 0012 ensures all these relationships are properly defined with foreign key constraints, making them visible in any ERD generation tool.

---

**Note:** After running migration 0012, regenerate your ERD to see all the missing relationships that have been added!
