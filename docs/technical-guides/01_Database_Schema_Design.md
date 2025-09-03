# Database Schema Design - Technical Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the Asset Management database schema using Drizzle ORM with PostgreSQL. It covers core tables, relationships, indexes, constraints, and seed data.

---

## 🗄️ **Task CYPHER-AM-001: Database Schema Implementation**

### **Prerequisites**
- PostgreSQL database configured
- Drizzle ORM setup complete
- Node.js v20.16.0+ installed
- CYPHER project environment ready

---

## 📋 **Subtask AM-001-1: Core Asset Database Schema**

### **Files to Create:**
```
api/src/db/schema/assetCategories.js
api/src/db/schema/assetTypes.js
api/src/db/schema/assetLocations.js
api/src/db/schema/assets.js
docs/database/asset_management_erd.md
```

### **Step 1: Create Asset Categories Schema**
```javascript
// api/src/db/schema/assetCategories.js
const { pgTable, serial, varchar, text, timestamp, boolean, index } = require('drizzle-orm/pg-core');

const assetCategories = pgTable('asset_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., 'HW', 'SW', 'NET'
  color: varchar('color', { length: 7 }).default('#3498db'), // Hex color for UI
  icon: varchar('icon', { length: 50 }).default('server'), // Icon name for UI
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: serial('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_asset_categories_name').on(table.name),
  codeIdx: index('idx_asset_categories_code').on(table.code),
  activeIdx: index('idx_asset_categories_active').on(table.isActive),
}));

module.exports = { assetCategories };
```

### **Step 2: Create Asset Types Schema**
```javascript
// api/src/db/schema/assetTypes.js
const { pgTable, serial, varchar, text, timestamp, boolean, integer, index } = require('drizzle-orm/pg-core');
const { assetCategories } = require('./assetCategories');

const assetTypes = pgTable('asset_types', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => assetCategories.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  code: varchar('code', { length: 20 }).notNull(), // e.g., 'SRV', 'WKS', 'RTR'
  defaultSpecs: text('default_specs'), // JSON string of default specifications
  requiresSerial: boolean('requires_serial').default(true),
  requiresLocation: boolean('requires_location').default(true),
  requiresWarranty: boolean('requires_warranty').default(false),
  depreciationRate: integer('depreciation_rate').default(20), // Percentage per year
  expectedLifespan: integer('expected_lifespan').default(60), // Months
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: serial('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_asset_types_category').on(table.categoryId),
  nameIdx: index('idx_asset_types_name').on(table.name),
  codeIdx: index('idx_asset_types_code').on(table.code),
  activeIdx: index('idx_asset_types_active').on(table.isActive),
}));

module.exports = { assetTypes };
```

### **Step 3: Create Asset Locations Schema**
```javascript
// api/src/db/schema/assetLocations.js
const { pgTable, serial, varchar, text, timestamp, boolean, integer, decimal, index } = require('drizzle-orm/pg-core');

const assetLocations = pgTable('asset_locations', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references(() => assetLocations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  code: varchar('code', { length: 20 }).notNull().unique(), // e.g., 'DC1-R1-U10'
  type: varchar('type', { length: 50 }).notNull(), // 'building', 'floor', 'room', 'rack', 'shelf'
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  country: varchar('country', { length: 50 }),
  postalCode: varchar('postal_code', { length: 20 }),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  capacity: integer('capacity'), // Maximum assets this location can hold
  currentCount: integer('current_count').default(0), // Current number of assets
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: serial('sort_order'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  parentIdx: index('idx_asset_locations_parent').on(table.parentId),
  nameIdx: index('idx_asset_locations_name').on(table.name),
  codeIdx: index('idx_asset_locations_code').on(table.code),
  typeIdx: index('idx_asset_locations_type').on(table.type),
  activeIdx: index('idx_asset_locations_active').on(table.isActive),
}));

module.exports = { assetLocations };
```

### **Step 4: Create Core Assets Schema**
```javascript
// api/src/db/schema/assets.js
const { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  decimal, 
  jsonb,
  pgEnum,
  index,
  unique
} = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { assetTypes } = require('./assetTypes');
const { assetLocations } = require('./assetLocations');

// Asset status enum
const assetStatusEnum = pgEnum('enum_asset_status', [
  'planned', 'ordered', 'received', 'deployed', 'active', 'maintenance', 'retired', 'disposed'
]);

// Asset condition enum
const assetConditionEnum = pgEnum('enum_asset_condition', [
  'excellent', 'good', 'fair', 'poor', 'damaged'
]);

const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  
  // Basic Information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  assetTypeId: integer('asset_type_id').references(() => assetTypes.id).notNull(),
  
  // Identification
  assetTag: varchar('asset_tag', { length: 100 }).unique(),
  serialNumber: varchar('serial_number', { length: 255 }),
  barcode: varchar('barcode', { length: 255 }),
  
  // Manufacturer Information
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 255 }),
  modelNumber: varchar('model_number', { length: 255 }),
  
  // Location and Assignment
  locationId: integer('location_id').references(() => assetLocations.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  
  // Status and Condition
  status: assetStatusEnum('status').default('planned').notNull(),
  condition: assetConditionEnum('condition').default('good'),
  
  // Financial Information
  purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }),
  currentValue: decimal('current_value', { precision: 12, scale: 2 }),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  
  // Warranty Information
  warrantyProvider: varchar('warranty_provider', { length: 255 }),
  warrantyStartDate: timestamp('warranty_start_date', { withTimezone: true }),
  warrantyEndDate: timestamp('warranty_end_date', { withTimezone: true }),
  warrantyType: varchar('warranty_type', { length: 100 }), // 'manufacturer', 'extended', 'service'
  
  // Technical Specifications (JSON)
  specifications: jsonb('specifications').default('{}'),
  
  // Network Information
  ipAddress: varchar('ip_address', { length: 45 }),
  macAddress: varchar('mac_address', { length: 17 }),
  hostname: varchar('hostname', { length: 255 }),
  
  // Lifecycle Dates
  deploymentDate: timestamp('deployment_date', { withTimezone: true }),
  retirementDate: timestamp('retirement_date', { withTimezone: true }),
  disposalDate: timestamp('disposal_date', { withTimezone: true }),
  
  // Maintenance
  lastMaintenanceDate: timestamp('last_maintenance_date', { withTimezone: true }),
  nextMaintenanceDate: timestamp('next_maintenance_date', { withTimezone: true }),
  maintenanceInterval: integer('maintenance_interval'), // Days
  
  // Compliance and Security
  complianceStatus: varchar('compliance_status', { length: 100 }),
  securityClassification: varchar('security_classification', { length: 50 }),
  
  // Custom Fields
  customFields: jsonb('custom_fields').default('{}'),
  tags: varchar('tags', { length: 255 }).array().default([]),
  
  // Audit Fields
  createdBy: integer('created_by').references(() => users.id).notNull(),
  updatedBy: integer('updated_by').references(() => users.id),
  deletedBy: integer('deleted_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  
  // Soft delete flag
  isDeleted: boolean('is_deleted').default(false).notNull(),
}, (table) => ({
  // Primary indexes
  nameIdx: index('idx_assets_name').on(table.name),
  assetTagIdx: index('idx_assets_asset_tag').on(table.assetTag),
  serialIdx: index('idx_assets_serial').on(table.serialNumber),
  
  // Foreign key indexes
  typeIdx: index('idx_assets_type').on(table.assetTypeId),
  locationIdx: index('idx_assets_location').on(table.locationId),
  assignedIdx: index('idx_assets_assigned').on(table.assignedTo),
  
  // Status and condition indexes
  statusIdx: index('idx_assets_status').on(table.status),
  conditionIdx: index('idx_assets_condition').on(table.condition),
  
  // Date indexes for queries
  purchaseDateIdx: index('idx_assets_purchase_date').on(table.purchaseDate),
  warrantyEndIdx: index('idx_assets_warranty_end').on(table.warrantyEndDate),
  
  // Network indexes
  ipIdx: index('idx_assets_ip').on(table.ipAddress),
  hostnameIdx: index('idx_assets_hostname').on(table.hostname),
  
  // Soft delete index
  deletedIdx: index('idx_assets_deleted').on(table.isDeleted),
  
  // Composite indexes for common queries
  statusLocationIdx: index('idx_assets_status_location').on(table.status, table.locationId),
  typeStatusIdx: index('idx_assets_type_status').on(table.assetTypeId, table.status),
  
  // Unique constraints
  assetTagUnique: unique('unique_asset_tag').on(table.assetTag),
  serialUnique: unique('unique_serial_number').on(table.serialNumber),
}));

module.exports = { 
  assets, 
  assetStatusEnum, 
  assetConditionEnum 
};
```

### **Step 5: Update Database Schema Index**
```javascript
// api/src/db/schema/index.js
// Add to existing exports
const { assetCategories } = require('./assetCategories');
const { assetTypes } = require('./assetTypes');
const { assetLocations } = require('./assetLocations');
const { assets, assetStatusEnum, assetConditionEnum } = require('./assets');

module.exports = {
  // ... existing exports
  
  // Asset Management
  assetCategories,
  assetTypes,
  assetLocations,
  assets,
  assetStatusEnum,
  assetConditionEnum,
};
```

### **Testing Instructions:**
1. Run migration to create tables: `npm run db:migrate`
2. Verify all tables created successfully
3. Test foreign key constraints
4. Validate enum values work correctly
5. Check indexes are created properly

---

## 📝 **Next Steps**

1. **Continue to [Asset Relationships](./01_Database_Schema_Design_Part2.md)** - Implement asset relationships and dependencies
2. **Review [Validation Schemas](./01_Database_Schema_Design_Part3.md)** - Create Zod validation and TypeScript interfaces
3. **Setup [Seed Data](./01_Database_Schema_Design_Part4.md)** - Create sample data and RBAC integration

---

## 🔗 **Related Documents**

- [Asset Management Integration Examples](../Asset_Management_Integration_Examples.md)
- [CYPHER Asset Management JIRA Task Breakdown](../CYPHER_Asset_Management_Jira_Task_Breakdown.md)
- [Technical Guide Index](./00_Asset_Management_Technical_Guide_Index.md)
