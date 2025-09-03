# Asset Management - Technical Implementation Guide

## Overview
This document provides detailed technical implementation guidance for each task in the CYPHER Asset Management JIRA breakdown. It includes step-by-step coding instructions, file structures, code examples, and best practices for developers.

---

## 📋 **Epic: CYPHER-AM-EPIC-001 - Asset Management System Implementation**

### Prerequisites
- Node.js v20.16.0+ installed
- PostgreSQL database configured
- CYPHER project setup complete
- Drizzle ORM configured
- Existing authentication and RBAC system functional

---

## 🗄️ **Story 1: Database Schema Design & Implementation**

### **Task CYPHER-AM-001: Design and Implement Asset Management Database Schema**

#### **Subtask CYPHER-AM-001-1: Design Core Asset Database Schema**

**Files to Create/Modify:**
```
api/src/db/schema/assets.js
api/src/db/schema/assetCategories.js
api/src/db/schema/assetTypes.js
api/src/db/schema/assetLocations.js
docs/database/asset_management_erd.md
```

**Step 1: Create Asset Categories Schema**
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

**Step 2: Create Asset Types Schema**
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

**Step 3: Create Asset Locations Schema**
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

**Step 4: Create Core Assets Schema**
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
  'planned',
  'ordered', 
  'received',
  'deployed',
  'active',
  'maintenance',
  'retired',
  'disposed'
]);

// Asset condition enum
const assetConditionEnum = pgEnum('enum_asset_condition', [
  'excellent',
  'good',
  'fair',
  'poor',
  'damaged'
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

**Step 5: Create Entity Relationship Diagram**
```markdown
# Asset Management ERD

## Core Tables Relationships

```
asset_categories (1) ----< (M) asset_types
asset_types (1) ----< (M) assets
asset_locations (1) ----< (M) assets
asset_locations (1) ----< (M) asset_locations (self-referencing)
users (1) ----< (M) assets (createdBy, updatedBy, assignedTo)
```

## Table Descriptions

### asset_categories
- Primary categorization (Hardware, Software, Network, etc.)
- Used for high-level grouping and reporting

### asset_types  
- Specific types within categories (Server, Workstation, Router, etc.)
- Contains default specifications and requirements

### asset_locations
- Hierarchical location structure (Building > Floor > Room > Rack)
- Supports geographical coordinates for mapping

### assets
- Core asset table with comprehensive tracking
- Includes financial, technical, and lifecycle information
- Soft delete pattern for data retention
```

**Testing Instructions:**
1. Run migration to create tables
2. Insert sample data for categories, types, and locations
3. Verify foreign key constraints work correctly
4. Test indexes with sample queries
5. Validate enum values work as expected

---

#### **Subtask CYPHER-AM-001-2: Implement Core Asset Tables**

**Implementation Steps:**

**Step 1: Update Database Schema Index**
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

**Step 2: Create Zod Validation Schemas**
```javascript
// api/src/validation/assetSchemas.js
const { z } = require('zod');

// Asset Category Schema
const assetCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_]+$/),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().positive().optional(),
});

// Asset Type Schema
const assetTypeSchema = z.object({
  categoryId: z.number().int().positive(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_]+$/),
  defaultSpecs: z.string().optional(),
  requiresSerial: z.boolean().default(true),
  requiresLocation: z.boolean().default(true),
  requiresWarranty: z.boolean().default(false),
  depreciationRate: z.number().int().min(0).max(100).default(20),
  expectedLifespan: z.number().int().positive().default(60),
  isActive: z.boolean().default(true),
});

// Asset Location Schema
const assetLocationSchema = z.object({
  parentId: z.number().int().positive().optional(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  code: z.string().min(1).max(20).regex(/^[A-Z0-9_-]+$/),
  type: z.enum(['building', 'floor', 'room', 'rack', 'shelf', 'zone']),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  country: z.string().max(50).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  capacity: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

// Core Asset Schema
const assetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  assetTypeId: z.number().int().positive(),
  assetTag: z.string().max(100).optional(),
  serialNumber: z.string().max(255).optional(),
  barcode: z.string().max(255).optional(),
  manufacturer: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  modelNumber: z.string().max(255).optional(),
  locationId: z.number().int().positive().optional(),
  assignedTo: z.number().int().positive().optional(),
  status: z.enum(['planned', 'ordered', 'received', 'deployed', 'active', 'maintenance', 'retired', 'disposed']).default('planned'),
  condition: z.enum(['excellent', 'good', 'fair', 'poor', 'damaged']).default('good'),
  purchasePrice: z.number().positive().optional(),
  currentValue: z.number().positive().optional(),
  purchaseDate: z.string().datetime().optional(),
  warrantyProvider: z.string().max(255).optional(),
  warrantyStartDate: z.string().datetime().optional(),
  warrantyEndDate: z.string().datetime().optional(),
  warrantyType: z.enum(['manufacturer', 'extended', 'service']).optional(),
  specifications: z.record(z.any()).default({}),
  ipAddress: z.string().ip().optional(),
  macAddress: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/).optional(),
  hostname: z.string().max(255).optional(),
  deploymentDate: z.string().datetime().optional(),
  retirementDate: z.string().datetime().optional(),
  disposalDate: z.string().datetime().optional(),
  lastMaintenanceDate: z.string().datetime().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  maintenanceInterval: z.number().int().positive().optional(),
  complianceStatus: z.string().max(100).optional(),
  securityClassification: z.enum(['public', 'internal', 'confidential', 'restricted']).optional(),
  customFields: z.record(z.any()).default({}),
  tags: z.array(z.string()).default([]),
});

// Update schemas for API operations
const createAssetSchema = assetSchema;
const updateAssetSchema = assetSchema.partial();

module.exports = {
  assetCategorySchema,
  assetTypeSchema,
  assetLocationSchema,
  assetSchema,
  createAssetSchema,
  updateAssetSchema,
};
```

**Step 3: Generate TypeScript Interfaces**
```typescript
// api/src/types/assetTypes.ts
export interface AssetCategory {
  id: number;
  name: string;
  description?: string;
  code: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetType {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  code: string;
  defaultSpecs?: string;
  requiresSerial: boolean;
  requiresLocation: boolean;
  requiresWarranty: boolean;
  depreciationRate: number;
  expectedLifespan: number;
  isActive: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetLocation {
  id: number;
  parentId?: number;
  name: string;
  description?: string;
  code: string;
  type: 'building' | 'floor' | 'room' | 'rack' | 'shelf' | 'zone';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  currentCount: number;
  isActive: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AssetStatus = 'planned' | 'ordered' | 'received' | 'deployed' | 'active' | 'maintenance' | 'retired' | 'disposed';
export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
export type WarrantyType = 'manufacturer' | 'extended' | 'service';
export type SecurityClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface Asset {
  id: number;
  name: string;
  description?: string;
  assetTypeId: number;
  assetTag?: string;
  serialNumber?: string;
  barcode?: string;
  manufacturer?: string;
  model?: string;
  modelNumber?: string;
  locationId?: number;
  assignedTo?: number;
  status: AssetStatus;
  condition: AssetCondition;
  purchasePrice?: number;
  currentValue?: number;
  purchaseDate?: Date;
  warrantyProvider?: string;
  warrantyStartDate?: Date;
  warrantyEndDate?: Date;
  warrantyType?: WarrantyType;
  specifications: Record<string, any>;
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  deploymentDate?: Date;
  retirementDate?: Date;
  disposalDate?: Date;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceInterval?: number;
  complianceStatus?: string;
  securityClassification?: SecurityClassification;
  customFields: Record<string, any>;
  tags: string[];
  createdBy: number;
  updatedBy?: number;
  deletedBy?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isDeleted: boolean;
}

// API Request/Response types
export interface CreateAssetRequest {
  name: string;
  description?: string;
  assetTypeId: number;
  assetTag?: string;
  serialNumber?: string;
  // ... other fields
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {}

export interface AssetResponse extends Asset {
  assetType?: AssetType;
  location?: AssetLocation;
  assignedUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}
```

**Testing Instructions:**
1. Run database migration to create all tables
2. Test Zod validation with valid and invalid data
3. Verify TypeScript interfaces compile correctly
4. Test foreign key relationships
5. Validate enum constraints work properly

---

#### **Subtask CYPHER-AM-001-3: Implement Asset Relationships and Dependencies**

**Files to Create:**
```
api/src/db/schema/assetRelationships.js
api/src/db/schema/assetDependencies.js
api/src/db/schema/assetGroups.js
```

**Step 1: Create Asset Relationships Schema**
```javascript
// api/src/db/schema/assetRelationships.js
const { pgTable, serial, integer, varchar, text, timestamp, boolean, pgEnum, index } = require('drizzle-orm/pg-core');
const { assets } = require('./assets');
const { users } = require('./users');

// Relationship type enum
const relationshipTypeEnum = pgEnum('enum_asset_relationship_type', [
  'depends_on',      // Asset A depends on Asset B
  'part_of',         // Asset A is part of Asset B
  'connects_to',     // Asset A connects to Asset B
  'manages',         // Asset A manages Asset B
  'hosts',           // Asset A hosts Asset B
  'uses',            // Asset A uses Asset B
  'backup_of',       // Asset A is backup of Asset B
  'replaces',        // Asset A replaces Asset B
  'similar_to'       // Asset A is similar to Asset B
]);

const assetRelationships = pgTable('asset_relationships', {
  id: serial('id').primaryKey(),
  sourceAssetId: integer('source_asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  targetAssetId: integer('target_asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  relationshipType: relationshipTypeEnum('relationship_type').notNull(),
  description: text('description'),
  strength: integer('strength').default(1), // 1-10 scale for relationship importance
  isActive: boolean('is_active').default(true).notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceIdx: index('idx_asset_relationships_source').on(table.sourceAssetId),
  targetIdx: index('idx_asset_relationships_target').on(table.targetAssetId),
  typeIdx: index('idx_asset_relationships_type').on(table.relationshipType),
  activeIdx: index('idx_asset_relationships_active').on(table.isActive),
  // Composite index for common queries
  sourceTypeIdx: index('idx_asset_relationships_source_type').on(table.sourceAssetId, table.relationshipType),
}));

module.exports = { assetRelationships, relationshipTypeEnum };
```

**Step 2: Create Asset Dependencies Schema**
```javascript
// api/src/db/schema/assetDependencies.js
const { pgTable, serial, integer, varchar, text, timestamp, boolean, pgEnum, index } = require('drizzle-orm/pg-core');
const { assets } = require('./assets');
const { users } = require('./users');

// Dependency type enum
const dependencyTypeEnum = pgEnum('enum_asset_dependency_type', [
  'critical',        // Critical dependency - failure causes immediate impact
  'important',       // Important dependency - failure causes significant impact
  'moderate',        // Moderate dependency - failure causes some impact
  'low'             // Low dependency - failure causes minimal impact
]);

// Dependency status enum
const dependencyStatusEnum = pgEnum('enum_asset_dependency_status', [
  'active',
  'inactive',
  'planned',
  'deprecated'
]);

const assetDependencies = pgTable('asset_dependencies', {
  id: serial('id').primaryKey(),
  dependentAssetId: integer('dependent_asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  dependsOnAssetId: integer('depends_on_asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  dependencyType: dependencyTypeEnum('dependency_type').notNull(),
  status: dependencyStatusEnum('status').default('active').notNull(),
  description: text('description'),
  impactDescription: text('impact_description'), // What happens if dependency fails
  recoveryTime: integer('recovery_time'), // Minutes to recover if dependency fails
  alternativeAssetId: integer('alternative_asset_id').references(() => assets.id), // Backup/alternative asset
  isCircular: boolean('is_circular').default(false), // Flag for circular dependency detection
  validFrom: timestamp('valid_from', { withTimezone: true }).defaultNow(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dependentIdx: index('idx_asset_dependencies_dependent').on(table.dependentAssetId),
  dependsOnIdx: index('idx_asset_dependencies_depends_on').on(table.dependsOnAssetId),
  typeIdx: index('idx_asset_dependencies_type').on(table.dependencyType),
  statusIdx: index('idx_asset_dependencies_status').on(table.status),
  circularIdx: index('idx_asset_dependencies_circular').on(table.isCircular),
  // Composite indexes
  dependentTypeIdx: index('idx_asset_dependencies_dependent_type').on(table.dependentAssetId, table.dependencyType),
}));

module.exports = { assetDependencies, dependencyTypeEnum, dependencyStatusEnum };
```

**Step 3: Create Asset Groups Schema**
```javascript
// api/src/db/schema/assetGroups.js
const { pgTable, serial, integer, varchar, text, timestamp, boolean, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { assets } = require('./assets');
const { users } = require('./users');

// Group type enum
const groupTypeEnum = pgEnum('enum_asset_group_type', [
  'functional',      // Grouped by function (e.g., Web Servers)
  'location',        // Grouped by location (e.g., Data Center 1)
  'project',         // Grouped by project (e.g., ERP Implementation)
  'maintenance',     // Grouped for maintenance (e.g., Monthly Maintenance)
  'security',        // Grouped by security level (e.g., High Security)
  'custom'          // Custom grouping
]);

const assetGroups = pgTable('asset_groups', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id').references(() => assetGroups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  groupType: groupTypeEnum('group_type').notNull(),
  color: varchar('color', { length: 7 }).default('#3498db'),
  icon: varchar('icon', { length: 50 }).default('folder'),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  parentIdx: index('idx_asset_groups_parent').on(table.parentId),
  nameIdx: index('idx_asset_groups_name').on(table.name),
  typeIdx: index('idx_asset_groups_type').on(table.groupType),
  activeIdx: index('idx_asset_groups_active').on(table.isActive),
}));

// Asset Group Memberships (Many-to-Many relationship)
const assetGroupMemberships = pgTable('asset_group_memberships', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'cascade' }).notNull(),
  groupId: integer('group_id').references(() => assetGroups.id, { onDelete: 'cascade' }).notNull(),
  isPrimary: boolean('is_primary').default(false), // Primary group for the asset
  addedBy: integer('added_by').references(() => users.id).notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assetIdx: index('idx_asset_group_memberships_asset').on(table.assetId),
  groupIdx: index('idx_asset_group_memberships_group').on(table.groupId),
  primaryIdx: index('idx_asset_group_memberships_primary').on(table.isPrimary),
  // Unique constraint to prevent duplicate memberships
  assetGroupUnique: unique('unique_asset_group_membership').on(table.assetId, table.groupId),
}));

module.exports = {
  assetGroups,
  assetGroupMemberships,
  groupTypeEnum
};
```

**Step 4: Create Relationship Validation Functions**
```javascript
// api/src/utils/assetRelationshipValidation.js
const { db } = require('../db');
const { assetDependencies, assetRelationships } = require('../db/schema');
const { eq, and, or } = require('drizzle-orm');

class AssetRelationshipValidator {

  /**
   * Check for circular dependencies
   */
  async checkCircularDependency(dependentAssetId, dependsOnAssetId, excludeId = null) {
    const visited = new Set();
    const recursionStack = new Set();

    return await this.hasCircularDependencyRecursive(
      dependentAssetId,
      dependsOnAssetId,
      visited,
      recursionStack,
      excludeId
    );
  }

  async hasCircularDependencyRecursive(currentAsset, targetAsset, visited, recursionStack, excludeId) {
    if (currentAsset === targetAsset) {
      return true; // Circular dependency found
    }

    if (visited.has(currentAsset)) {
      return recursionStack.has(currentAsset);
    }

    visited.add(currentAsset);
    recursionStack.add(currentAsset);

    // Get all dependencies of current asset
    let query = db.select({ dependsOnAssetId: assetDependencies.dependsOnAssetId })
      .from(assetDependencies)
      .where(eq(assetDependencies.dependentAssetId, currentAsset));

    if (excludeId) {
      query = query.where(ne(assetDependencies.id, excludeId));
    }

    const dependencies = await query;

    for (const dep of dependencies) {
      if (await this.hasCircularDependencyRecursive(
        dep.dependsOnAssetId,
        targetAsset,
        visited,
        recursionStack,
        excludeId
      )) {
        return true;
      }
    }

    recursionStack.delete(currentAsset);
    return false;
  }

  /**
   * Validate relationship constraints
   */
  async validateRelationship(sourceAssetId, targetAssetId, relationshipType) {
    // Prevent self-relationships
    if (sourceAssetId === targetAssetId) {
      throw new Error('Asset cannot have a relationship with itself');
    }

    // Check for duplicate relationships
    const existing = await db.select()
      .from(assetRelationships)
      .where(and(
        eq(assetRelationships.sourceAssetId, sourceAssetId),
        eq(assetRelationships.targetAssetId, targetAssetId),
        eq(assetRelationships.relationshipType, relationshipType),
        eq(assetRelationships.isActive, true)
      ));

    if (existing.length > 0) {
      throw new Error('This relationship already exists');
    }

    // Validate specific relationship rules
    await this.validateRelationshipRules(sourceAssetId, targetAssetId, relationshipType);

    return true;
  }

  async validateRelationshipRules(sourceAssetId, targetAssetId, relationshipType) {
    // Add specific business rules here
    // Example: A server cannot be part of a workstation
    // Example: Network equipment cannot depend on end-user devices

    // Get asset types for validation
    const [sourceAsset] = await db.select({ assetTypeId: assets.assetTypeId })
      .from(assets)
      .where(eq(assets.id, sourceAssetId));

    const [targetAsset] = await db.select({ assetTypeId: assets.assetTypeId })
      .from(assets)
      .where(eq(assets.id, targetAssetId));

    // Implement business rules based on asset types and relationship types
    // This is where you'd add domain-specific validation logic
  }

  /**
   * Get dependency chain for an asset
   */
  async getDependencyChain(assetId, maxDepth = 10) {
    const chain = [];
    const visited = new Set();

    await this.buildDependencyChain(assetId, chain, visited, 0, maxDepth);

    return chain;
  }

  async buildDependencyChain(assetId, chain, visited, depth, maxDepth) {
    if (depth >= maxDepth || visited.has(assetId)) {
      return;
    }

    visited.add(assetId);

    const dependencies = await db.select()
      .from(assetDependencies)
      .where(eq(assetDependencies.dependentAssetId, assetId));

    for (const dep of dependencies) {
      chain.push({
        level: depth,
        dependentAssetId: dep.dependentAssetId,
        dependsOnAssetId: dep.dependsOnAssetId,
        dependencyType: dep.dependencyType,
        impactDescription: dep.impactDescription
      });

      await this.buildDependencyChain(dep.dependsOnAssetId, chain, visited, depth + 1, maxDepth);
    }
  }
}

module.exports = new AssetRelationshipValidator();
```

**Testing Instructions:**
1. Create test relationships between assets
2. Test circular dependency detection
3. Validate relationship constraints
4. Test group membership operations
5. Verify cascade delete operations work correctly

---

#### **Subtask CYPHER-AM-001-4: Implement Performance Indexes and Constraints**

**Step 1: Create Advanced Indexes**
```sql
-- api/src/db/migrations/add_asset_performance_indexes.sql

-- Full-text search indexes
CREATE INDEX CONCURRENTLY idx_assets_fulltext_search
ON assets USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(manufacturer, '') || ' ' || COALESCE(model, '')));

-- Composite indexes for common filter combinations
CREATE INDEX CONCURRENTLY idx_assets_status_type_location
ON assets (status, asset_type_id, location_id) WHERE is_deleted = false;

CREATE INDEX CONCURRENTLY idx_assets_warranty_expiring
ON assets (warranty_end_date) WHERE warranty_end_date IS NOT NULL AND is_deleted = false;

-- Partial indexes for active assets only
CREATE INDEX CONCURRENTLY idx_assets_active_by_type
ON assets (asset_type_id, status) WHERE is_deleted = false AND status IN ('active', 'deployed');

-- JSON indexes for specifications and custom fields
CREATE INDEX CONCURRENTLY idx_assets_specifications_gin
ON assets USING gin(specifications);

CREATE INDEX CONCURRENTLY idx_assets_custom_fields_gin
ON assets USING gin(custom_fields);

-- Array index for tags
CREATE INDEX CONCURRENTLY idx_assets_tags_gin
ON assets USING gin(tags);

-- Date range indexes for reporting
CREATE INDEX CONCURRENTLY idx_assets_purchase_date_range
ON assets (purchase_date) WHERE purchase_date IS NOT NULL AND is_deleted = false;

CREATE INDEX CONCURRENTLY idx_assets_created_date_range
ON assets (created_at) WHERE is_deleted = false;

-- Network-related indexes
CREATE INDEX CONCURRENTLY idx_assets_network_info
ON assets (ip_address, hostname) WHERE ip_address IS NOT NULL OR hostname IS NOT NULL;

-- Maintenance indexes
CREATE INDEX CONCURRENTLY idx_assets_maintenance_due
ON assets (next_maintenance_date) WHERE next_maintenance_date IS NOT NULL AND is_deleted = false;
```

**Step 2: Add Database Constraints**
```sql
-- api/src/db/migrations/add_asset_constraints.sql

-- Check constraints
ALTER TABLE assets ADD CONSTRAINT chk_assets_purchase_price_positive
CHECK (purchase_price IS NULL OR purchase_price >= 0);

ALTER TABLE assets ADD CONSTRAINT chk_assets_current_value_positive
CHECK (current_value IS NULL OR current_value >= 0);

ALTER TABLE assets ADD CONSTRAINT chk_assets_warranty_dates
CHECK (warranty_start_date IS NULL OR warranty_end_date IS NULL OR warranty_start_date <= warranty_end_date);

ALTER TABLE assets ADD CONSTRAINT chk_assets_lifecycle_dates
CHECK (
  (purchase_date IS NULL OR deployment_date IS NULL OR purchase_date <= deployment_date) AND
  (deployment_date IS NULL OR retirement_date IS NULL OR deployment_date <= retirement_date) AND
  (retirement_date IS NULL OR disposal_date IS NULL OR retirement_date <= disposal_date)
);

ALTER TABLE assets ADD CONSTRAINT chk_assets_maintenance_interval_positive
CHECK (maintenance_interval IS NULL OR maintenance_interval > 0);

-- Unique constraints with conditions
CREATE UNIQUE INDEX idx_assets_asset_tag_unique
ON assets (asset_tag) WHERE asset_tag IS NOT NULL AND is_deleted = false;

CREATE UNIQUE INDEX idx_assets_serial_manufacturer_unique
ON assets (serial_number, manufacturer) WHERE serial_number IS NOT NULL AND manufacturer IS NOT NULL AND is_deleted = false;

-- Location capacity constraints
ALTER TABLE asset_locations ADD CONSTRAINT chk_location_capacity_positive
CHECK (capacity IS NULL OR capacity > 0);

ALTER TABLE asset_locations ADD CONSTRAINT chk_location_current_count_valid
CHECK (current_count >= 0 AND (capacity IS NULL OR current_count <= capacity));

-- Relationship constraints
ALTER TABLE asset_relationships ADD CONSTRAINT chk_relationship_not_self
CHECK (source_asset_id != target_asset_id);

ALTER TABLE asset_relationships ADD CONSTRAINT chk_relationship_strength_valid
CHECK (strength >= 1 AND strength <= 10);

-- Dependency constraints
ALTER TABLE asset_dependencies ADD CONSTRAINT chk_dependency_not_self
CHECK (dependent_asset_id != depends_on_asset_id);

ALTER TABLE asset_dependencies ADD CONSTRAINT chk_dependency_recovery_time_positive
CHECK (recovery_time IS NULL OR recovery_time >= 0);
```

**Step 3: Create Performance Monitoring Queries**
```javascript
// api/src/utils/assetPerformanceQueries.js
const { db } = require('../db');
const { sql } = require('drizzle-orm');

class AssetPerformanceQueries {

  /**
   * Get query performance statistics
   */
  async getQueryPerformanceStats() {
    const stats = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation,
        most_common_vals,
        most_common_freqs
      FROM pg_stats
      WHERE schemaname = 'public'
        AND tablename LIKE 'asset%'
      ORDER BY tablename, attname;
    `);

    return stats.rows;
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats() {
    const stats = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND tablename LIKE 'asset%'
      ORDER BY idx_scan DESC;
    `);

    return stats.rows;
  }

  /**
   * Get table size information
   */
  async getTableSizeStats() {
    const stats = await db.execute(sql`
      SELECT
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE 'asset%'
      ORDER BY size_bytes DESC;
    `);

    return stats.rows;
  }

  /**
   * Analyze query performance for common asset operations
   */
  async analyzeCommonQueries() {
    const queries = [
      {
        name: 'Get assets by status',
        query: sql`EXPLAIN ANALYZE SELECT * FROM assets WHERE status = 'active' AND is_deleted = false LIMIT 100;`
      },
      {
        name: 'Get assets by type and location',
        query: sql`EXPLAIN ANALYZE SELECT * FROM assets WHERE asset_type_id = 1 AND location_id = 1 AND is_deleted = false;`
      },
      {
        name: 'Search assets by name',
        query: sql`EXPLAIN ANALYZE SELECT * FROM assets WHERE name ILIKE '%server%' AND is_deleted = false LIMIT 50;`
      },
      {
        name: 'Get expiring warranties',
        query: sql`EXPLAIN ANALYZE SELECT * FROM assets WHERE warranty_end_date BETWEEN NOW() AND NOW() + INTERVAL '30 days' AND is_deleted = false;`
      }
    ];

    const results = [];
    for (const query of queries) {
      try {
        const result = await db.execute(query.query);
        results.push({
          name: query.name,
          executionPlan: result.rows
        });
      } catch (error) {
        results.push({
          name: query.name,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new AssetPerformanceQueries();
```

**Testing Instructions:**
1. Run performance analysis on sample data
2. Test query execution times with different data volumes
3. Verify constraint violations are properly caught
4. Monitor index usage with real queries
5. Benchmark full-text search performance

---

#### **Subtask CYPHER-AM-001-5: Create Database Seed Data and RBAC Integration**

**Step 1: Create Asset Permissions Seed Data**
```javascript
// api/src/db/seeds/assetPermissions.js
const { db } = require('../db');
const { permissions, roles, rolePermissions } = require('../db/schema');
const { eq, and } = require('drizzle-orm');

const ASSET_PERMISSIONS = [
  {
    name: 'asset.view',
    description: 'View assets and asset details',
    module: 'asset_management'
  },
  {
    name: 'asset.create',
    description: 'Create new assets',
    module: 'asset_management'
  },
  {
    name: 'asset.edit',
    description: 'Edit existing assets',
    module: 'asset_management'
  },
  {
    name: 'asset.delete',
    description: 'Delete assets (soft delete)',
    module: 'asset_management'
  },
  {
    name: 'asset.bulk_operations',
    description: 'Perform bulk asset operations',
    module: 'asset_management'
  },
  {
    name: 'asset.export',
    description: 'Export asset data to various formats',
    module: 'asset_management'
  },
  {
    name: 'asset.import',
    description: 'Import asset data from files',
    module: 'asset_management'
  },
  {
    name: 'asset.discovery',
    description: 'Run automated asset discovery scans',
    module: 'asset_management'
  },
  {
    name: 'asset.admin',
    description: 'Full asset management administration',
    module: 'asset_management'
  }
];

const ROLE_PERMISSION_MAPPINGS = {
  admin: [
    'asset.view', 'asset.create', 'asset.edit', 'asset.delete',
    'asset.bulk_operations', 'asset.export', 'asset.import',
    'asset.discovery', 'asset.admin'
  ],
  moderator: [
    'asset.view', 'asset.create', 'asset.edit',
    'asset.export', 'asset.import', 'asset.bulk_operations'
  ],
  user: [
    'asset.view', 'asset.create', 'asset.edit'
  ]
};

async function seedAssetPermissions() {
  console.log('🔐 Seeding asset management permissions...');

  try {
    // Insert permissions
    for (const permission of ASSET_PERMISSIONS) {
      const existing = await db.select()
        .from(permissions)
        .where(eq(permissions.name, permission.name));

      if (existing.length === 0) {
        await db.insert(permissions).values(permission);
        console.log(`✅ Created permission: ${permission.name}`);
      } else {
        console.log(`⏭️ Permission already exists: ${permission.name}`);
      }
    }

    // Assign permissions to roles
    for (const [roleName, permissionNames] of Object.entries(ROLE_PERMISSION_MAPPINGS)) {
      const [role] = await db.select()
        .from(roles)
        .where(eq(roles.name, roleName));

      if (!role) {
        console.log(`⚠️ Role not found: ${roleName}`);
        continue;
      }

      for (const permissionName of permissionNames) {
        const [permission] = await db.select()
          .from(permissions)
          .where(eq(permissions.name, permissionName));

        if (!permission) {
          console.log(`⚠️ Permission not found: ${permissionName}`);
          continue;
        }

        const existing = await db.select()
          .from(rolePermissions)
          .where(and(
            eq(rolePermissions.roleId, role.id),
            eq(rolePermissions.permissionId, permission.id)
          ));

        if (existing.length === 0) {
          await db.insert(rolePermissions).values({
            roleId: role.id,
            permissionId: permission.id
          });
          console.log(`✅ Assigned ${permissionName} to ${roleName}`);
        }
      }
    }

    console.log('✅ Asset permissions seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding asset permissions:', error);
    throw error;
  }
}

module.exports = { seedAssetPermissions, ASSET_PERMISSIONS, ROLE_PERMISSION_MAPPINGS };
```

**Step 2: Create Asset Categories and Types Seed Data**
```javascript
// api/src/db/seeds/assetCategoriesAndTypes.js
const { db } = require('../db');
const { assetCategories, assetTypes } = require('../db/schema');
const { eq } = require('drizzle-orm');

const ASSET_CATEGORIES = [
  {
    name: 'Hardware',
    description: 'Physical computing equipment and devices',
    code: 'HW',
    color: '#3498db',
    icon: 'server',
    sortOrder: 1
  },
  {
    name: 'Software',
    description: 'Software applications and licenses',
    code: 'SW',
    color: '#9b59b6',
    icon: 'code',
    sortOrder: 2
  },
  {
    name: 'Network',
    description: 'Network infrastructure and equipment',
    code: 'NET',
    color: '#e74c3c',
    icon: 'network-wired',
    sortOrder: 3
  },
  {
    name: 'Security',
    description: 'Security devices and systems',
    code: 'SEC',
    color: '#f39c12',
    icon: 'shield-alt',
    sortOrder: 4
  },
  {
    name: 'Storage',
    description: 'Data storage systems and devices',
    code: 'STO',
    color: '#27ae60',
    icon: 'hdd',
    sortOrder: 5
  },
  {
    name: 'Mobile',
    description: 'Mobile devices and tablets',
    code: 'MOB',
    color: '#16a085',
    icon: 'mobile-alt',
    sortOrder: 6
  }
];

const ASSET_TYPES = [
  // Hardware Types
  {
    categoryCode: 'HW',
    name: 'Server',
    description: 'Physical or virtual servers',
    code: 'SRV',
    defaultSpecs: JSON.stringify({
      cpu: 'Intel Xeon',
      ram: '32GB',
      storage: '1TB SSD',
      network: 'Gigabit Ethernet'
    }),
    requiresSerial: true,
    requiresLocation: true,
    requiresWarranty: true,
    depreciationRate: 25,
    expectedLifespan: 60
  },
  {
    categoryCode: 'HW',
    name: 'Workstation',
    description: 'Desktop computers and workstations',
    code: 'WKS',
    defaultSpecs: JSON.stringify({
      cpu: 'Intel Core i7',
      ram: '16GB',
      storage: '512GB SSD',
      graphics: 'Integrated'
    }),
    requiresSerial: true,
    requiresLocation: true,
    requiresWarranty: true,
    depreciationRate: 30,
    expectedLifespan: 48
  },
  {
    categoryCode: 'HW',
    name: 'Laptop',
    description: 'Portable computers and laptops',
    code: 'LAP',
    defaultSpecs: JSON.stringify({
      cpu: 'Intel Core i5',
      ram: '8GB',
      storage: '256GB SSD',
      screen: '14 inch'
    }),
    requiresSerial: true,
    requiresLocation: false,
    requiresWarranty: true,
    depreciationRate: 35,
    expectedLifespan: 36
  },
  // Network Types
  {
    categoryCode: 'NET',
    name: 'Router',
    description: 'Network routing equipment',
    code: 'RTR',
    defaultSpecs: JSON.stringify({
      ports: '24',
      speed: 'Gigabit',
      protocol: 'IPv4/IPv6'
    }),
    requiresSerial: true,
    requiresLocation: true,
    requiresWarranty: true,
    depreciationRate: 20,
    expectedLifespan: 84
  },
  {
    categoryCode: 'NET',
    name: 'Switch',
    description: 'Network switching equipment',
    code: 'SWI',
    defaultSpecs: JSON.stringify({
      ports: '48',
      speed: 'Gigabit',
      management: 'Managed'
    }),
    requiresSerial: true,
    requiresLocation: true,
    requiresWarranty: true,
    depreciationRate: 20,
    expectedLifespan: 84
  },
  // Software Types
  {
    categoryCode: 'SW',
    name: 'Operating System',
    description: 'Operating system licenses',
    code: 'OS',
    defaultSpecs: JSON.stringify({
      type: 'Server',
      edition: 'Standard',
      architecture: 'x64'
    }),
    requiresSerial: false,
    requiresLocation: false,
    requiresWarranty: false,
    depreciationRate: 0,
    expectedLifespan: 120
  },
  {
    categoryCode: 'SW',
    name: 'Application',
    description: 'Software applications and licenses',
    code: 'APP',
    defaultSpecs: JSON.stringify({
      type: 'Enterprise',
      users: '100',
      support: 'Premium'
    }),
    requiresSerial: false,
    requiresLocation: false,
    requiresWarranty: false,
    depreciationRate: 10,
    expectedLifespan: 60
  }
];

async function seedAssetCategoriesAndTypes() {
  console.log('📂 Seeding asset categories and types...');

  try {
    // Insert categories
    const categoryMap = new Map();

    for (const category of ASSET_CATEGORIES) {
      const existing = await db.select()
        .from(assetCategories)
        .where(eq(assetCategories.code, category.code));

      if (existing.length === 0) {
        const [newCategory] = await db.insert(assetCategories)
          .values(category)
          .returning();
        categoryMap.set(category.code, newCategory.id);
        console.log(`✅ Created category: ${category.name}`);
      } else {
        categoryMap.set(category.code, existing[0].id);
        console.log(`⏭️ Category already exists: ${category.name}`);
      }
    }

    // Insert types
    for (const type of ASSET_TYPES) {
      const categoryId = categoryMap.get(type.categoryCode);
      if (!categoryId) {
        console.log(`⚠️ Category not found for type: ${type.name}`);
        continue;
      }

      const existing = await db.select()
        .from(assetTypes)
        .where(eq(assetTypes.code, type.code));

      if (existing.length === 0) {
        await db.insert(assetTypes).values({
          ...type,
          categoryId,
          categoryCode: undefined // Remove categoryCode as it's not in the schema
        });
        console.log(`✅ Created asset type: ${type.name}`);
      } else {
        console.log(`⏭️ Asset type already exists: ${type.name}`);
      }
    }

    console.log('✅ Asset categories and types seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding asset categories and types:', error);
    throw error;
  }
}

module.exports = { seedAssetCategoriesAndTypes, ASSET_CATEGORIES, ASSET_TYPES };
```

**Step 3: Create Asset Locations Seed Data**
```javascript
// api/src/db/seeds/assetLocations.js
const { db } = require('../db');
const { assetLocations } = require('../db/schema');
const { eq } = require('drizzle-orm');

const ASSET_LOCATIONS = [
  // Buildings
  {
    name: 'Headquarters',
    description: 'Main office building',
    code: 'HQ',
    type: 'building',
    address: '123 Business Ave',
    city: 'Tech City',
    state: 'CA',
    country: 'USA',
    postalCode: '12345',
    latitude: 37.7749,
    longitude: -122.4194,
    capacity: 1000,
    sortOrder: 1
  },
  {
    name: 'Data Center 1',
    description: 'Primary data center facility',
    code: 'DC1',
    type: 'building',
    address: '456 Server St',
    city: 'Data City',
    state: 'TX',
    country: 'USA',
    postalCode: '67890',
    latitude: 32.7767,
    longitude: -96.7970,
    capacity: 500,
    sortOrder: 2
  },
  // Floors (will be linked to buildings after creation)
  {
    parentCode: 'HQ',
    name: 'Floor 1',
    description: 'Ground floor - Reception and common areas',
    code: 'HQ-F1',
    type: 'floor',
    capacity: 100,
    sortOrder: 1
  },
  {
    parentCode: 'HQ',
    name: 'Floor 2',
    description: 'Second floor - Development teams',
    code: 'HQ-F2',
    type: 'floor',
    capacity: 150,
    sortOrder: 2
  },
  {
    parentCode: 'DC1',
    name: 'Server Floor',
    description: 'Main server floor',
    code: 'DC1-SF',
    type: 'floor',
    capacity: 400,
    sortOrder: 1
  },
  // Rooms
  {
    parentCode: 'HQ-F2',
    name: 'Development Room A',
    description: 'Development team workspace',
    code: 'HQ-F2-DEVA',
    type: 'room',
    capacity: 25,
    sortOrder: 1
  },
  {
    parentCode: 'DC1-SF',
    name: 'Server Room A',
    description: 'Primary server room',
    code: 'DC1-SF-SRA',
    type: 'room',
    capacity: 100,
    sortOrder: 1
  },
  // Racks
  {
    parentCode: 'DC1-SF-SRA',
    name: 'Rack 1',
    description: 'Server rack 1',
    code: 'DC1-SF-SRA-R1',
    type: 'rack',
    capacity: 42,
    sortOrder: 1
  },
  {
    parentCode: 'DC1-SF-SRA',
    name: 'Rack 2',
    description: 'Server rack 2',
    code: 'DC1-SF-SRA-R2',
    type: 'rack',
    capacity: 42,
    sortOrder: 2
  }
];

async function seedAssetLocations() {
  console.log('📍 Seeding asset locations...');

  try {
    const locationMap = new Map();

    // First pass: Create locations without parents
    for (const location of ASSET_LOCATIONS) {
      if (!location.parentCode) {
        const existing = await db.select()
          .from(assetLocations)
          .where(eq(assetLocations.code, location.code));

        if (existing.length === 0) {
          const [newLocation] = await db.insert(assetLocations)
            .values({
              ...location,
              parentCode: undefined
            })
            .returning();
          locationMap.set(location.code, newLocation.id);
          console.log(`✅ Created location: ${location.name}`);
        } else {
          locationMap.set(location.code, existing[0].id);
          console.log(`⏭️ Location already exists: ${location.name}`);
        }
      }
    }

    // Second pass: Create locations with parents
    for (const location of ASSET_LOCATIONS) {
      if (location.parentCode) {
        const parentId = locationMap.get(location.parentCode);
        if (!parentId) {
          console.log(`⚠️ Parent location not found for: ${location.name}`);
          continue;
        }

        const existing = await db.select()
          .from(assetLocations)
          .where(eq(assetLocations.code, location.code));

        if (existing.length === 0) {
          const [newLocation] = await db.insert(assetLocations)
            .values({
              ...location,
              parentId,
              parentCode: undefined
            })
            .returning();
          locationMap.set(location.code, newLocation.id);
          console.log(`✅ Created location: ${location.name}`);
        } else {
          locationMap.set(location.code, existing[0].id);
          console.log(`⏭️ Location already exists: ${location.name}`);
        }
      }
    }

    console.log('✅ Asset locations seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding asset locations:', error);
    throw error;
  }
}

module.exports = { seedAssetLocations, ASSET_LOCATIONS };
```

**Step 4: Create Sample Assets Seed Data**
```javascript
// api/src/db/seeds/sampleAssets.js
const { db } = require('../db');
const { assets, assetTypes, assetLocations, users } = require('../db/schema');
const { eq } = require('drizzle-orm');

async function seedSampleAssets() {
  console.log('💻 Seeding sample assets...');

  try {
    // Get required reference data
    const [serverType] = await db.select().from(assetTypes).where(eq(assetTypes.code, 'SRV'));
    const [workstationType] = await db.select().from(assetTypes).where(eq(assetTypes.code, 'WKS'));
    const [laptopType] = await db.select().from(assetTypes).where(eq(assetTypes.code, 'LAP'));
    const [rack1] = await db.select().from(assetLocations).where(eq(assetLocations.code, 'DC1-SF-SRA-R1'));
    const [devRoom] = await db.select().from(assetLocations).where(eq(assetLocations.code, 'HQ-F2-DEVA'));
    const [adminUser] = await db.select().from(users).where(eq(users.role, 'admin'));

    if (!serverType || !workstationType || !laptopType || !rack1 || !devRoom || !adminUser) {
      console.log('⚠️ Required reference data not found, skipping sample assets');
      return;
    }

    const sampleAssets = [
      // Servers
      {
        name: 'Web Server 01',
        description: 'Primary web application server',
        assetTypeId: serverType.id,
        assetTag: 'SRV-WEB-001',
        serialNumber: 'DL380-12345',
        manufacturer: 'HPE',
        model: 'ProLiant DL380 Gen10',
        locationId: rack1.id,
        status: 'active',
        condition: 'excellent',
        purchasePrice: 5000.00,
        currentValue: 3500.00,
        purchaseDate: new Date('2023-01-15'),
        warrantyProvider: 'HPE',
        warrantyStartDate: new Date('2023-01-15'),
        warrantyEndDate: new Date('2026-01-15'),
        warrantyType: 'manufacturer',
        specifications: {
          cpu: 'Intel Xeon Silver 4214R',
          ram: '64GB DDR4',
          storage: '2x 1TB SSD RAID1',
          network: '4x 1GbE',
          power: '800W Redundant'
        },
        ipAddress: '192.168.1.10',
        hostname: 'web-srv-01',
        deploymentDate: new Date('2023-01-20'),
        lastMaintenanceDate: new Date('2024-01-15'),
        nextMaintenanceDate: new Date('2024-07-15'),
        maintenanceInterval: 180,
        complianceStatus: 'Compliant',
        securityClassification: 'internal',
        tags: ['production', 'web', 'critical'],
        createdBy: adminUser.id
      },
      {
        name: 'Database Server 01',
        description: 'Primary database server',
        assetTypeId: serverType.id,
        assetTag: 'SRV-DB-001',
        serialNumber: 'DL380-67890',
        manufacturer: 'HPE',
        model: 'ProLiant DL380 Gen10',
        locationId: rack1.id,
        status: 'active',
        condition: 'excellent',
        purchasePrice: 7500.00,
        currentValue: 5250.00,
        purchaseDate: new Date('2023-02-01'),
        warrantyProvider: 'HPE',
        warrantyStartDate: new Date('2023-02-01'),
        warrantyEndDate: new Date('2026-02-01'),
        warrantyType: 'manufacturer',
        specifications: {
          cpu: '2x Intel Xeon Gold 5218R',
          ram: '128GB DDR4',
          storage: '4x 2TB SSD RAID10',
          network: '4x 1GbE',
          power: '800W Redundant'
        },
        ipAddress: '192.168.1.20',
        hostname: 'db-srv-01',
        deploymentDate: new Date('2023-02-05'),
        lastMaintenanceDate: new Date('2024-02-01'),
        nextMaintenanceDate: new Date('2024-08-01'),
        maintenanceInterval: 180,
        complianceStatus: 'Compliant',
        securityClassification: 'confidential',
        tags: ['production', 'database', 'critical'],
        createdBy: adminUser.id
      },
      // Workstations
      {
        name: 'Developer Workstation 01',
        description: 'Development workstation for senior developer',
        assetTypeId: workstationType.id,
        assetTag: 'WKS-DEV-001',
        serialNumber: 'OPTIPLEX-11111',
        manufacturer: 'Dell',
        model: 'OptiPlex 7090',
        locationId: devRoom.id,
        assignedTo: adminUser.id,
        status: 'active',
        condition: 'good',
        purchasePrice: 1200.00,
        currentValue: 800.00,
        purchaseDate: new Date('2023-03-01'),
        warrantyProvider: 'Dell',
        warrantyStartDate: new Date('2023-03-01'),
        warrantyEndDate: new Date('2026-03-01'),
        warrantyType: 'manufacturer',
        specifications: {
          cpu: 'Intel Core i7-11700',
          ram: '32GB DDR4',
          storage: '1TB NVMe SSD',
          graphics: 'Intel UHD Graphics 750',
          network: 'Gigabit Ethernet'
        },
        ipAddress: '192.168.2.10',
        hostname: 'dev-wks-01',
        deploymentDate: new Date('2023-03-05'),
        complianceStatus: 'Compliant',
        securityClassification: 'internal',
        tags: ['development', 'workstation'],
        createdBy: adminUser.id
      },
      // Laptops
      {
        name: 'Manager Laptop 01',
        description: 'Laptop for department manager',
        assetTypeId: laptopType.id,
        assetTag: 'LAP-MGR-001',
        serialNumber: 'LATITUDE-22222',
        manufacturer: 'Dell',
        model: 'Latitude 5520',
        assignedTo: adminUser.id,
        status: 'active',
        condition: 'good',
        purchasePrice: 1500.00,
        currentValue: 900.00,
        purchaseDate: new Date('2023-04-01'),
        warrantyProvider: 'Dell',
        warrantyStartDate: new Date('2023-04-01'),
        warrantyEndDate: new Date('2026-04-01'),
        warrantyType: 'manufacturer',
        specifications: {
          cpu: 'Intel Core i7-1165G7',
          ram: '16GB DDR4',
          storage: '512GB NVMe SSD',
          screen: '15.6 inch FHD',
          graphics: 'Intel Iris Xe'
        },
        hostname: 'mgr-lap-01',
        deploymentDate: new Date('2023-04-05'),
        complianceStatus: 'Compliant',
        securityClassification: 'internal',
        tags: ['laptop', 'management', 'mobile'],
        createdBy: adminUser.id
      }
    ];

    // Insert sample assets
    for (const asset of sampleAssets) {
      const existing = await db.select()
        .from(assets)
        .where(eq(assets.assetTag, asset.assetTag));

      if (existing.length === 0) {
        await db.insert(assets).values(asset);
        console.log(`✅ Created sample asset: ${asset.name}`);
      } else {
        console.log(`⏭️ Sample asset already exists: ${asset.name}`);
      }
    }

    console.log('✅ Sample assets seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding sample assets:', error);
    throw error;
  }
}

module.exports = { seedSampleAssets };
```

**Step 5: Create Master Seed Script**
```javascript
// api/src/db/seeds/index.js
const { seedAssetPermissions } = require('./assetPermissions');
const { seedAssetCategoriesAndTypes } = require('./assetCategoriesAndTypes');
const { seedAssetLocations } = require('./assetLocations');
const { seedSampleAssets } = require('./sampleAssets');

async function seedAssetManagement() {
  console.log('🌱 Starting Asset Management seed process...');

  try {
    // Seed in correct order due to dependencies
    await seedAssetPermissions();
    await seedAssetCategoriesAndTypes();
    await seedAssetLocations();
    await seedSampleAssets();

    console.log('🎉 Asset Management seed process completed successfully!');

  } catch (error) {
    console.error('💥 Asset Management seed process failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedAssetManagement()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { seedAssetManagement };
```

**Testing Instructions:**
1. Run the seed script: `node api/src/db/seeds/index.js`
2. Verify permissions are created and assigned to roles
3. Check that categories, types, and locations are properly linked
4. Validate sample assets have correct relationships
5. Test that foreign key constraints work correctly

---

## ⚙️ **Story 2: Backend Storage Layer Implementation**

### **Task CYPHER-AM-002: Implement Asset Storage Layer**

#### **Subtask CYPHER-AM-002-1: Implement Core Asset CRUD Operations**

**Files to Create:**
```
api/src/services/AssetManagementService.js
api/src/utils/assetValidation.js
api/src/utils/assetTransforms.js
```

**Step 1: Create Asset Management Service**
```javascript
// api/src/services/AssetManagementService.js
const { db } = require('../db');
const {
  assets,
  assetTypes,
  assetLocations,
  assetCategories,
  users
} = require('../db/schema');
const { eq, and, or, like, ilike, isNull, isNotNull, inArray, desc, asc, sql, count } = require('drizzle-orm');
const { auditLogService } = require('./auditLogService');
const { createAssetSchema, updateAssetSchema } = require('../validation/assetSchemas');
const { AssetTransforms } = require('../utils/assetTransforms');
const { AssetValidator } = require('../utils/assetValidation');

class AssetManagementService {

  constructor() {
    this.transforms = new AssetTransforms();
    this.validator = new AssetValidator();
  }

  // ==================== CREATE OPERATIONS ====================

  /**
   * Create a new asset
   */
  async createAsset(assetData, userId, req = null) {
    const transaction = await db.transaction();

    try {
      // Validate input data
      const validatedData = createAssetSchema.parse(assetData);

      // Business validation
      await this.validator.validateAssetCreation(validatedData, transaction);

      // Transform data for storage
      const transformedData = await this.transforms.transformForStorage(validatedData, userId);

      // Create the asset
      const [newAsset] = await transaction.insert(assets).values({
        ...transformedData,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Update location current count if location specified
      if (newAsset.locationId) {
        await this.updateLocationCount(newAsset.locationId, 1, transaction);
      }

      // Log the creation using existing AuditLogService
      await auditLogService.logUserAction(
        userId,
        'asset_created',
        'asset',
        newAsset.id,
        `Created asset: ${newAsset.name}`,
        {
          assetData: newAsset,
          assetType: validatedData.assetTypeId,
          location: validatedData.locationId
        },
        req
      );

      await transaction.commit();

      // Return asset with related data
      return await this.getAssetById(newAsset.id);

    } catch (error) {
      await transaction.rollback();

      // Log the failed attempt
      if (userId) {
        await auditLogService.logUserAction(
          userId,
          'asset_creation_failed',
          'asset',
          null,
          `Failed to create asset: ${error.message}`,
          { assetData, error: error.message },
          req
        );
      }

      throw error;
    }
  }

  /**
   * Create multiple assets (bulk creation)
   */
  async createAssetsBulk(assetsData, userId, req = null) {
    const transaction = await db.transaction();
    const batchId = `bulk_create_${Date.now()}_${userId}`;

    try {
      const createdAssets = [];
      const errors = [];

      for (let i = 0; i < assetsData.length; i++) {
        try {
          const assetData = assetsData[i];

          // Validate each asset
          const validatedData = createAssetSchema.parse(assetData);
          await this.validator.validateAssetCreation(validatedData, transaction);

          // Transform data
          const transformedData = await this.transforms.transformForStorage(validatedData, userId);

          // Create asset
          const [newAsset] = await transaction.insert(assets).values({
            ...transformedData,
            createdBy: userId,
            updatedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();

          createdAssets.push(newAsset);

          // Update location count
          if (newAsset.locationId) {
            await this.updateLocationCount(newAsset.locationId, 1, transaction);
          }

        } catch (error) {
          errors.push({
            index: i,
            data: assetsData[i],
            error: error.message
          });
        }
      }

      // Log bulk operation
      await auditLogService.logUserAction(
        userId,
        'asset_bulk_created',
        'asset',
        null,
        `Bulk created ${createdAssets.length} assets`,
        {
          batchId,
          successCount: createdAssets.length,
          errorCount: errors.length,
          errors: errors.slice(0, 10) // Limit error details
        },
        req
      );

      await transaction.commit();

      return {
        batchId,
        createdAssets,
        errors,
        successCount: createdAssets.length,
        errorCount: errors.length
      };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==================== READ OPERATIONS ====================

  /**
   * Get asset by ID with related data
   */
  async getAssetById(assetId, includeRelations = true) {
    try {
      let query = db.select({
        // Asset fields
        id: assets.id,
        name: assets.name,
        description: assets.description,
        assetTag: assets.assetTag,
        serialNumber: assets.serialNumber,
        barcode: assets.barcode,
        manufacturer: assets.manufacturer,
        model: assets.model,
        modelNumber: assets.modelNumber,
        status: assets.status,
        condition: assets.condition,
        purchasePrice: assets.purchasePrice,
        currentValue: assets.currentValue,
        purchaseDate: assets.purchaseDate,
        warrantyProvider: assets.warrantyProvider,
        warrantyStartDate: assets.warrantyStartDate,
        warrantyEndDate: assets.warrantyEndDate,
        warrantyType: assets.warrantyType,
        specifications: assets.specifications,
        ipAddress: assets.ipAddress,
        macAddress: assets.macAddress,
        hostname: assets.hostname,
        deploymentDate: assets.deploymentDate,
        retirementDate: assets.retirementDate,
        disposalDate: assets.disposalDate,
        lastMaintenanceDate: assets.lastMaintenanceDate,
        nextMaintenanceDate: assets.nextMaintenanceDate,
        maintenanceInterval: assets.maintenanceInterval,
        complianceStatus: assets.complianceStatus,
        securityClassification: assets.securityClassification,
        customFields: assets.customFields,
        tags: assets.tags,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        isDeleted: assets.isDeleted,

        // Related data
        ...(includeRelations && {
          assetType: {
            id: assetTypes.id,
            name: assetTypes.name,
            code: assetTypes.code,
            categoryId: assetTypes.categoryId
          },
          location: {
            id: assetLocations.id,
            name: assetLocations.name,
            code: assetLocations.code,
            type: assetLocations.type
          },
          assignedUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          }
        })
      })
      .from(assets);

      if (includeRelations) {
        query = query
          .leftJoin(assetTypes, eq(assets.assetTypeId, assetTypes.id))
          .leftJoin(assetLocations, eq(assets.locationId, assetLocations.id))
          .leftJoin(users, eq(assets.assignedTo, users.id));
      }

      const [asset] = await query
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ));

      if (!asset) {
        throw new Error('Asset not found');
      }

      return this.transforms.transformForResponse(asset);

    } catch (error) {
      console.error('Error getting asset by ID:', error);
      throw error;
    }
  }

  /**
   * Get assets with filtering, sorting, and pagination
   */
  async getAssets(filters = {}, pagination = {}, sorting = {}) {
    try {
      const {
        search,
        assetTypeIds,
        locationIds,
        statuses,
        conditions,
        assignedTo,
        tags,
        manufacturerIds,
        warrantyExpiring,
        dateRange,
        customFilters
      } = filters;

      const {
        page = 1,
        limit = 50,
        offset = (page - 1) * limit
      } = pagination;

      const {
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = sorting;

      // Build base query
      let query = db.select({
        id: assets.id,
        name: assets.name,
        description: assets.description,
        assetTag: assets.assetTag,
        serialNumber: assets.serialNumber,
        manufacturer: assets.manufacturer,
        model: assets.model,
        status: assets.status,
        condition: assets.condition,
        purchasePrice: assets.purchasePrice,
        currentValue: assets.currentValue,
        purchaseDate: assets.purchaseDate,
        warrantyEndDate: assets.warrantyEndDate,
        ipAddress: assets.ipAddress,
        hostname: assets.hostname,
        tags: assets.tags,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,

        // Related data
        assetType: {
          id: assetTypes.id,
          name: assetTypes.name,
          code: assetTypes.code
        },
        location: {
          id: assetLocations.id,
          name: assetLocations.name,
          code: assetLocations.code
        },
        assignedUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(assets)
      .leftJoin(assetTypes, eq(assets.assetTypeId, assetTypes.id))
      .leftJoin(assetLocations, eq(assets.locationId, assetLocations.id))
      .leftJoin(users, eq(assets.assignedTo, users.id));

      // Build WHERE conditions
      const conditions = [eq(assets.isDeleted, false)];

      // Search filter
      if (search) {
        conditions.push(
          or(
            ilike(assets.name, `%${search}%`),
            ilike(assets.description, `%${search}%`),
            ilike(assets.assetTag, `%${search}%`),
            ilike(assets.serialNumber, `%${search}%`),
            ilike(assets.manufacturer, `%${search}%`),
            ilike(assets.model, `%${search}%`),
            ilike(assets.hostname, `%${search}%`)
          )
        );
      }

      // Asset type filter
      if (assetTypeIds && assetTypeIds.length > 0) {
        conditions.push(inArray(assets.assetTypeId, assetTypeIds));
      }

      // Location filter
      if (locationIds && locationIds.length > 0) {
        conditions.push(inArray(assets.locationId, locationIds));
      }

      // Status filter
      if (statuses && statuses.length > 0) {
        conditions.push(inArray(assets.status, statuses));
      }

      // Condition filter
      if (conditions && conditions.length > 0) {
        conditions.push(inArray(assets.condition, conditions));
      }

      // Assigned user filter
      if (assignedTo) {
        if (assignedTo === 'unassigned') {
          conditions.push(isNull(assets.assignedTo));
        } else {
          conditions.push(eq(assets.assignedTo, assignedTo));
        }
      }

      // Tags filter
      if (tags && tags.length > 0) {
        conditions.push(
          or(...tags.map(tag => sql`${assets.tags} @> ${JSON.stringify([tag])}`))
        );
      }

      // Warranty expiring filter
      if (warrantyExpiring) {
        const daysAhead = warrantyExpiring.days || 30;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        conditions.push(
          and(
            isNotNull(assets.warrantyEndDate),
            sql`${assets.warrantyEndDate} BETWEEN NOW() AND ${futureDate}`
          )
        );
      }

      // Date range filter
      if (dateRange) {
        const { field = 'createdAt', startDate, endDate } = dateRange;
        if (startDate) {
          conditions.push(sql`${assets[field]} >= ${startDate}`);
        }
        if (endDate) {
          conditions.push(sql`${assets[field]} <= ${endDate}`);
        }
      }

      // Apply all conditions
      query = query.where(and(...conditions));

      // Apply sorting
      const sortColumn = assets[sortBy] || assets.createdAt;
      query = query.orderBy(sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn));

      // Apply pagination
      query = query.limit(limit).offset(offset);

      // Execute query
      const results = await query;

      // Get total count for pagination
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(assets)
        .leftJoin(assetTypes, eq(assets.assetTypeId, assetTypes.id))
        .leftJoin(assetLocations, eq(assets.locationId, assetLocations.id))
        .leftJoin(users, eq(assets.assignedTo, users.id))
        .where(and(...conditions));

      return {
        data: results.map(asset => this.transforms.transformForResponse(asset)),
        pagination: {
          page,
          limit,
          offset,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: offset + limit < totalCount,
          hasPreviousPage: page > 1
        }
      };

    } catch (error) {
      console.error('Error getting assets:', error);
      throw error;
    }
  }

  // ==================== UPDATE OPERATIONS ====================

  /**
   * Update an asset
   */
  async updateAsset(assetId, updates, userId, req = null) {
    const transaction = await db.transaction();

    try {
      // Get the current asset for comparison
      const [currentAsset] = await transaction.select()
        .from(assets)
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ));

      if (!currentAsset) {
        throw new Error('Asset not found');
      }

      // Validate update data
      const validatedUpdates = updateAssetSchema.parse(updates);

      // Business validation
      await this.validator.validateAssetUpdate(assetId, validatedUpdates, currentAsset, transaction);

      // Transform updates for storage
      const transformedUpdates = await this.transforms.transformForStorage(validatedUpdates, userId);

      // Update the asset
      const [updatedAsset] = await transaction
        .update(assets)
        .set({
          ...transformedUpdates,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(assets.id, assetId))
        .returning();

      // Update location counts if location changed
      if (currentAsset.locationId !== updatedAsset.locationId) {
        if (currentAsset.locationId) {
          await this.updateLocationCount(currentAsset.locationId, -1, transaction);
        }
        if (updatedAsset.locationId) {
          await this.updateLocationCount(updatedAsset.locationId, 1, transaction);
        }
      }

      // Log the update with old and new values
      await auditLogService.logUserAction(
        userId,
        'asset_updated',
        'asset',
        assetId,
        `Updated asset: ${updatedAsset.name}`,
        {
          oldValues: currentAsset,
          newValues: updatedAsset,
          changes: this.getChangedFields(currentAsset, updatedAsset)
        },
        req
      );

      await transaction.commit();

      // Return updated asset with related data
      return await this.getAssetById(assetId);

    } catch (error) {
      await transaction.rollback();

      // Log failed update
      await auditLogService.logUserAction(
        userId,
        'asset_update_failed',
        'asset',
        assetId,
        `Failed to update asset: ${error.message}`,
        { updates, error: error.message },
        req
      );

      throw error;
    }
  }

  // ==================== DELETE OPERATIONS ====================

  /**
   * Soft delete an asset
   */
  async deleteAsset(assetId, userId, req = null, permanent = false) {
    const transaction = await db.transaction();

    try {
      const [asset] = await transaction.select()
        .from(assets)
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, false)
        ));

      if (!asset) {
        throw new Error('Asset not found');
      }

      // Business validation for deletion
      await this.validator.validateAssetDeletion(assetId, asset, transaction);

      if (permanent) {
        // Hard delete
        await transaction.delete(assets).where(eq(assets.id, assetId));

        await auditLogService.logUserAction(
          userId,
          'asset_permanently_deleted',
          'asset',
          assetId,
          `Permanently deleted asset: ${asset.name}`,
          { deletedAsset: asset },
          req
        );
      } else {
        // Soft delete
        const [deletedAsset] = await transaction
          .update(assets)
          .set({
            isDeleted: true,
            deletedBy: userId,
            deletedAt: new Date(),
            updatedBy: userId,
            updatedAt: new Date()
          })
          .where(eq(assets.id, assetId))
          .returning();

        await auditLogService.logUserAction(
          userId,
          'asset_deleted',
          'asset',
          assetId,
          `Deleted asset: ${asset.name}`,
          { deletedAsset },
          req
        );
      }

      // Update location count
      if (asset.locationId) {
        await this.updateLocationCount(asset.locationId, -1, transaction);
      }

      await transaction.commit();
      return asset;

    } catch (error) {
      await transaction.rollback();

      await auditLogService.logUserAction(
        userId,
        'asset_delete_failed',
        'asset',
        assetId,
        `Failed to delete asset: ${error.message}`,
        { error: error.message },
        req
      );

      throw error;
    }
  }

  /**
   * Restore a soft-deleted asset
   */
  async restoreAsset(assetId, userId, req = null) {
    const transaction = await db.transaction();

    try {
      const [asset] = await transaction.select()
        .from(assets)
        .where(and(
          eq(assets.id, assetId),
          eq(assets.isDeleted, true)
        ));

      if (!asset) {
        throw new Error('Deleted asset not found');
      }

      // Restore the asset
      const [restoredAsset] = await transaction
        .update(assets)
        .set({
          isDeleted: false,
          deletedBy: null,
          deletedAt: null,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(assets.id, assetId))
        .returning();

      // Update location count
      if (restoredAsset.locationId) {
        await this.updateLocationCount(restoredAsset.locationId, 1, transaction);
      }

      await auditLogService.logUserAction(
        userId,
        'asset_restored',
        'asset',
        assetId,
        `Restored asset: ${restoredAsset.name}`,
        { restoredAsset },
        req
      );

      await transaction.commit();
      return await this.getAssetById(assetId);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Update location current count
   */
  async updateLocationCount(locationId, delta, transaction = db) {
    await transaction
      .update(assetLocations)
      .set({
        currentCount: sql`${assetLocations.currentCount} + ${delta}`,
        updatedAt: new Date()
      })
      .where(eq(assetLocations.id, locationId));
  }

  /**
   * Get changed fields between old and new values
   */
  getChangedFields(oldValues, newValues) {
    const changes = {};
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = {
          from: oldValues[key],
          to: newValues[key]
        };
      }
    }
    return changes;
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(filters = {}) {
    try {
      const baseConditions = [eq(assets.isDeleted, false)];

      // Apply filters if provided
      if (filters.locationIds) {
        baseConditions.push(inArray(assets.locationId, filters.locationIds));
      }
      if (filters.assetTypeIds) {
        baseConditions.push(inArray(assets.assetTypeId, filters.assetTypeIds));
      }

      const stats = await db
        .select({
          totalAssets: count(),
          totalValue: sql`COALESCE(SUM(${assets.currentValue}), 0)`,
          averageValue: sql`COALESCE(AVG(${assets.currentValue}), 0)`,
          statusBreakdown: sql`
            JSON_OBJECT_AGG(
              ${assets.status},
              COUNT(*)
            )
          `,
          conditionBreakdown: sql`
            JSON_OBJECT_AGG(
              ${assets.condition},
              COUNT(*)
            )
          `
        })
        .from(assets)
        .where(and(...baseConditions));

      return stats[0];

    } catch (error) {
      console.error('Error getting asset stats:', error);
      throw error;
    }
  }
}

module.exports = new AssetManagementService();
```

**Testing Instructions:**
1. Test CRUD operations with valid and invalid data
2. Verify audit logging is working for all operations
3. Test bulk operations with mixed success/failure scenarios
4. Validate business rules and constraints
5. Test pagination and filtering with large datasets
6. Verify soft delete and restore functionality
