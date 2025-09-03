# Database Schema Design Part 2 - Asset Relationships & Dependencies

## Overview
This guide covers implementing asset relationships, dependencies, and grouping functionality for the Asset Management system.

---

## 📋 **Subtask AM-001-3: Asset Relationships and Dependencies**

### **Files to Create:**
```
api/src/db/schema/assetRelationships.js
api/src/db/schema/assetDependencies.js
api/src/db/schema/assetGroups.js
api/src/utils/assetRelationshipValidation.js
```

### **Step 1: Create Asset Relationships Schema**
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

### **Step 2: Create Asset Dependencies Schema**
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

### **Step 3: Create Asset Groups Schema**
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

### **Step 4: Create Relationship Validation Utilities**
```javascript
// api/src/utils/assetRelationshipValidation.js
const { db } = require('../db');
const { assetDependencies, assetRelationships, assets } = require('../db/schema');
const { eq, and, ne } = require('drizzle-orm');

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
  
  /**
   * Validate dependency creation
   */
  async validateDependency(dependentAssetId, dependsOnAssetId, dependencyType) {
    // Prevent self-dependencies
    if (dependentAssetId === dependsOnAssetId) {
      throw new Error('Asset cannot depend on itself');
    }
    
    // Check for circular dependencies
    const hasCircular = await this.checkCircularDependency(dependentAssetId, dependsOnAssetId);
    if (hasCircular) {
      throw new Error('This dependency would create a circular dependency');
    }
    
    // Check for duplicate dependencies
    const existing = await db.select()
      .from(assetDependencies)
      .where(and(
        eq(assetDependencies.dependentAssetId, dependentAssetId),
        eq(assetDependencies.dependsOnAssetId, dependsOnAssetId),
        eq(assetDependencies.status, 'active')
      ));
    
    if (existing.length > 0) {
      throw new Error('This dependency already exists');
    }
    
    return true;
  }
  
  /**
   * Get all assets that depend on a given asset
   */
  async getDependentAssets(assetId) {
    return await db.select({
      dependentAsset: {
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag
      },
      dependency: {
        id: assetDependencies.id,
        dependencyType: assetDependencies.dependencyType,
        impactDescription: assetDependencies.impactDescription,
        recoveryTime: assetDependencies.recoveryTime
      }
    })
    .from(assetDependencies)
    .leftJoin(assets, eq(assetDependencies.dependentAssetId, assets.id))
    .where(and(
      eq(assetDependencies.dependsOnAssetId, assetId),
      eq(assetDependencies.status, 'active')
    ));
  }
  
  /**
   * Get all assets that a given asset depends on
   */
  async getAssetDependencies(assetId) {
    return await db.select({
      dependsOnAsset: {
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag
      },
      dependency: {
        id: assetDependencies.id,
        dependencyType: assetDependencies.dependencyType,
        impactDescription: assetDependencies.impactDescription,
        recoveryTime: assetDependencies.recoveryTime
      }
    })
    .from(assetDependencies)
    .leftJoin(assets, eq(assetDependencies.dependsOnAssetId, assets.id))
    .where(and(
      eq(assetDependencies.dependentAssetId, assetId),
      eq(assetDependencies.status, 'active')
    ));
  }
}

module.exports = new AssetRelationshipValidator();
```

### **Step 5: Update Schema Index**
```javascript
// api/src/db/schema/index.js
// Add to existing exports
const { assetRelationships, relationshipTypeEnum } = require('./assetRelationships');
const { assetDependencies, dependencyTypeEnum, dependencyStatusEnum } = require('./assetDependencies');
const { assetGroups, assetGroupMemberships, groupTypeEnum } = require('./assetGroups');

module.exports = {
  // ... existing exports
  
  // Asset Relationships
  assetRelationships,
  relationshipTypeEnum,
  assetDependencies,
  dependencyTypeEnum,
  dependencyStatusEnum,
  assetGroups,
  assetGroupMemberships,
  groupTypeEnum,
};
```

### **Testing Instructions:**
1. Create test relationships between assets
2. Test circular dependency detection with various scenarios
3. Validate relationship constraints work correctly
4. Test group membership operations
5. Verify cascade delete operations work as expected
6. Test dependency chain building with complex hierarchies

---

## 📝 **Next Steps**

1. **Continue to [Validation & TypeScript](./01_Database_Schema_Design_Part3.md)** - Create validation schemas and TypeScript interfaces
2. **Setup [Performance & Constraints](./01_Database_Schema_Design_Part4.md)** - Add advanced indexes and constraints
3. **Create [Seed Data](./01_Database_Schema_Design_Part5.md)** - Setup sample data and RBAC integration

---

## 🔗 **Related Documents**

- [Database Schema Design Part 1](./01_Database_Schema_Design.md)
- [Technical Guide Index](./00_Asset_Management_Technical_Guide_Index.md)
