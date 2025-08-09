# STIG Management Drizzle Schemas

## Overview

This document contains all TypeScript schema definitions using Drizzle ORM for the STIG Management system. These schemas provide type safety, validation, and database interaction patterns.

## Schema File Location
**Path**: `shared/stig-schema.ts`

## Core Table Schemas

### 1. stigMappings
**Purpose**: Master catalog of STIG to system mappings

```typescript
export const stigMappings = pgTable('stig_mappings', {
  id: serial('id').primaryKey(),
  operatingSystem: varchar('operating_system', { length: 255 }),
  osVersion: varchar('os_version', { length: 100 }),
  applicationName: varchar('application_name', { length: 255 }),
  applicationVersion: varchar('application_version', { length: 100 }),
  systemType: varchar('system_type', { length: 100 }),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  stigTitle: varchar('stig_title', { length: 500 }).notNull(),
  stigVersion: varchar('stig_version', { length: 50 }),
  priority: integer('priority').default(1),
  downloadUrl: varchar('download_url', { length: 1000 }),
  fileType: varchar('file_type', { length: 20 }).default('zip'),
  confidenceScore: integer('confidence_score').default(100), // 0-100
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 2. stigDownloads
**Purpose**: Track STIG file downloads and caching

```typescript
export const stigDownloads = pgTable('stig_downloads', {
  id: uuid('id').primaryKey(),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  stigTitle: varchar('stig_title', { length: 500 }).notNull(),
  version: varchar('version', { length: 50 }),
  releaseDate: timestamp('release_date'),
  downloadUrl: varchar('download_url', { length: 1000 }),
  localPath: varchar('local_path', { length: 500 }),
  fileSize: integer('file_size'), // bytes
  downloadStatus: varchar('download_status', { length: 50 }).default('pending'), // pending, downloading, completed, failed
  downloadedAt: timestamp('downloaded_at'),
  lastChecked: timestamp('last_checked'),
  checksum: varchar('checksum', { length: 64 }),
  metadata: jsonb('metadata'), // Additional STIG metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 3. stigCollections
**Purpose**: Logical groupings of assets for compliance management

```typescript
export const stigCollections = pgTable('stig_collections', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: varchar('created_by', { length: 100 }),
  isActive: boolean('is_active').default(true),
  settings: jsonb('settings'), // Collection-specific settings
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 4. stigAssets
**Purpose**: Assets managed within STIG collections

```typescript
export const stigAssets = pgTable('stig_assets', {
  id: uuid('id').primaryKey(),
  collectionId: uuid('collection_id').references(() => stigCollections.id, { onDelete: 'cascade' }),
  assetId: integer('asset_id'), // Reference to main assets table
  name: varchar('name', { length: 255 }).notNull(),
  hostname: varchar('hostname', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  operatingSystem: varchar('operating_system', { length: 255 }),
  osVersion: varchar('os_version', { length: 100 }),
  assetType: varchar('asset_type', { length: 100 }),
  systemRole: varchar('system_role', { length: 100 }),
  environment: varchar('environment', { length: 50 }),
  criticality: varchar('criticality', { length: 20 }),
  labels: jsonb('labels'), // Array of asset labels
  metadata: jsonb('metadata'), // Additional asset information
  lastScan: timestamp('last_scan'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 5. stigAssetAssignments
**Purpose**: Track STIG assignments to specific assets

```typescript
export const stigAssetAssignments = pgTable('stig_asset_assignments', {
  id: uuid('id').primaryKey(),
  assetId: uuid('asset_id').references(() => stigAssets.id, { onDelete: 'cascade' }),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  stigTitle: varchar('stig_title', { length: 500 }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  assignedBy: varchar('assigned_by', { length: 100 }),
  status: varchar('status', { length: 50 }).default('assigned'), // assigned, in_progress, completed
  priority: integer('priority').default(2),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 6. stigRules
**Purpose**: Individual STIG rules/controls within a STIG document

```typescript
export const stigRules = pgTable('stig_rules', {
  id: uuid('id').primaryKey(),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  ruleId: varchar('rule_id', { length: 100 }).notNull(), // V-219147, etc.
  ruleTitle: text('rule_title').notNull(),
  severity: varchar('severity', { length: 20 }).notNull(), // CAT I, CAT II, CAT III
  category: varchar('category', { length: 20 }).notNull(), // CAT1, CAT2, CAT3
  groupTitle: text('group_title'),
  description: text('description'),
  checkText: text('check_text'),
  fixText: text('fix_text'),
  cciRefs: jsonb('cci_refs'), // Array of CCI references
  nistRefs: jsonb('nist_refs'), // Array of NIST references
  stigRef: varchar('stig_ref', { length: 100 }),
  legacyIds: jsonb('legacy_ids'), // Legacy rule IDs
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 7. stigReviews
**Purpose**: Track compliance review status for individual rules

```typescript
export const stigReviews = pgTable('stig_reviews', {
  id: uuid('id').primaryKey(),
  assetId: uuid('asset_id').references(() => stigAssets.id, { onDelete: 'cascade' }),
  ruleId: uuid('rule_id').references(() => stigRules.id, { onDelete: 'cascade' }),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  reviewerId: varchar('reviewer_id', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull(), // Open, NotAFinding, Not_Applicable, Not_Reviewed
  result: varchar('result', { length: 50 }).notNull(), // Pass, Fail, Unknown
  detail: text('detail'), // Review details/findings
  comment: text('comment'), // Reviewer comments
  severity: varchar('severity', { length: 20 }),
  isSubmitted: boolean('is_submitted').default(false),
  submittedAt: timestamp('submitted_at'),
  reviewDate: timestamp('review_date').defaultNow(),
  lastModified: timestamp('last_modified').defaultNow(),
  lastModifiedBy: varchar('last_modified_by', { length: 100 }),
  metadata: jsonb('metadata'), // Additional review data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 8. stigUserGrants
**Purpose**: Role-based access control for STIG collections

```typescript
export const stigUserGrants = pgTable('stig_user_grants', {
  id: uuid('id').primaryKey(),
  collectionId: uuid('collection_id').references(() => stigCollections.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 100 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // Owner, Manager, User, Restricted
  accessLevel: varchar('access_level', { length: 50 }).default('read'), // read, write, admin
  assetRestrictions: jsonb('asset_restrictions'), // Specific asset access rules
  stigRestrictions: jsonb('stig_restrictions'), // Specific STIG access rules
  grantedBy: varchar('granted_by', { length: 100 }),
  grantedAt: timestamp('granted_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

## Type Definitions

### Base Types
```typescript
export type StigMapping = typeof stigMappings.$inferSelect;
export type InsertStigMapping = typeof stigMappings.$inferInsert;

export type StigDownload = typeof stigDownloads.$inferSelect;
export type InsertStigDownload = typeof stigDownloads.$inferInsert;

export type StigCollection = typeof stigCollections.$inferSelect;
export type InsertStigCollection = typeof stigCollections.$inferInsert;

export type StigAsset = typeof stigAssets.$inferSelect;
export type InsertStigAsset = typeof stigAssets.$inferInsert;

export type StigAssetAssignment = typeof stigAssetAssignments.$inferSelect;
export type InsertStigAssetAssignment = typeof stigAssetAssignments.$inferInsert;

export type StigRule = typeof stigRules.$inferSelect;
export type InsertStigRule = typeof stigRules.$inferInsert;

export type StigReview = typeof stigReviews.$inferSelect;
export type InsertStigReview = typeof stigReviews.$inferInsert;

export type StigUserGrant = typeof stigUserGrants.$inferSelect;
export type InsertStigUserGrant = typeof stigUserGrants.$inferInsert;
```

### Enum Types
```typescript
export enum DownloadStatus {
  PENDING = 'pending',
  DOWNLOADING = 'downloading',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export enum AssignmentStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NOT_APPLICABLE = 'not_applicable'
}

export enum ReviewStatus {
  NOT_REVIEWED = 'not_reviewed',
  OPEN = 'open',
  NOT_A_FINDING = 'not_a_finding',
  NOT_APPLICABLE = 'not_applicable'
}

export enum ReviewResult {
  PASS = 'pass',
  FAIL = 'fail',
  UNKNOWN = 'unknown'
}

export enum StigSeverity {
  CAT_I = 'CAT I',
  CAT_II = 'CAT II',
  CAT_III = 'CAT III'
}

export enum AssetCriticality {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum UserRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  USER = 'user',
  RESTRICTED = 'restricted'
}

export enum AccessLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}
```

## Validation Schemas

### Insert Schemas (Zod)
```typescript
export const insertStigMappingSchema = createInsertSchema(stigMappings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStigDownloadSchema = createInsertSchema(stigDownloads).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStigCollectionSchema = createInsertSchema(stigCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStigAssetSchema = createInsertSchema(stigAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStigAssetAssignmentSchema = createInsertSchema(stigAssetAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStigRuleSchema = createInsertSchema(stigRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStigReviewSchema = createInsertSchema(stigReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertStigUserGrantSchema = createInsertSchema(stigUserGrants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
```

### Extended Validation Schemas
```typescript
export const createCollectionSchema = insertStigCollectionSchema.extend({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  settings: z.object({
    autoAssignSTIGs: z.boolean().default(true),
    defaultEnvironment: z.string().default('production'),
    notifications: z.object({
      onAssignment: z.boolean().default(true),
      onCompletion: z.boolean().default(true)
    }).optional()
  }).optional()
});

export const createAssetSchema = insertStigAssetSchema.extend({
  name: z.string().min(1).max(255),
  hostname: z.string().optional(),
  ipAddress: z.string().ip().optional(),
  operatingSystem: z.string().optional(),
  environment: z.enum(['production', 'staging', 'development', 'test']).optional(),
  criticality: z.enum(['critical', 'high', 'medium', 'low']).optional()
});

export const createReviewSchema = insertStigReviewSchema.extend({
  status: z.enum(['not_reviewed', 'open', 'not_a_finding', 'not_applicable']),
  result: z.enum(['pass', 'fail', 'unknown']),
  detail: z.string().optional(),
  comment: z.string().optional()
});
```

## Database Relations

### Foreign Key Relationships
```typescript
// Collection to Assets (One-to-Many)
export const collectionsRelations = relations(stigCollections, ({ many }) => ({
  assets: many(stigAssets),
  userGrants: many(stigUserGrants)
}));

// Assets to Assignments (One-to-Many)
export const assetsRelations = relations(stigAssets, ({ one, many }) => ({
  collection: one(stigCollections, {
    fields: [stigAssets.collectionId],
    references: [stigCollections.id]
  }),
  assignments: many(stigAssetAssignments),
  reviews: many(stigReviews)
}));

// Assignments to Reviews (One-to-Many via rules)
export const assignmentsRelations = relations(stigAssetAssignments, ({ one }) => ({
  asset: one(stigAssets, {
    fields: [stigAssetAssignments.assetId],
    references: [stigAssets.id]
  })
}));

// Rules to Reviews (One-to-Many)
export const rulesRelations = relations(stigRules, ({ many }) => ({
  reviews: many(stigReviews)
}));

// Reviews to Assets and Rules (Many-to-One)
export const reviewsRelations = relations(stigReviews, ({ one }) => ({
  asset: one(stigAssets, {
    fields: [stigReviews.assetId],
    references: [stigAssets.id]
  }),
  rule: one(stigRules, {
    fields: [stigReviews.ruleId],
    references: [stigRules.id]
  })
}));
```

## Query Helpers

### Common Query Patterns
```typescript
// Get all collections with asset counts
export const getCollectionsWithCounts = async (db: DrizzleDB) => {
  return await db
    .select({
      collection: stigCollections,
      assetCount: count(stigAssets.id)
    })
    .from(stigCollections)
    .leftJoin(stigAssets, eq(stigCollections.id, stigAssets.collectionId))
    .where(eq(stigCollections.isActive, true))
    .groupBy(stigCollections.id);
};

// Get assets with their assignments
export const getAssetsWithAssignments = async (db: DrizzleDB, collectionId: string) => {
  return await db
    .select({
      asset: stigAssets,
      assignmentCount: count(stigAssetAssignments.id)
    })
    .from(stigAssets)
    .leftJoin(stigAssetAssignments, eq(stigAssets.id, stigAssetAssignments.assetId))
    .where(eq(stigAssets.collectionId, collectionId))
    .groupBy(stigAssets.id);
};

// Get compliance summary for asset
export const getAssetComplianceStatus = async (db: DrizzleDB, assetId: string) => {
  return await db
    .select({
      status: stigReviews.status,
      count: count()
    })
    .from(stigReviews)
    .where(eq(stigReviews.assetId, assetId))
    .groupBy(stigReviews.status);
};
```

## Migration Support

### Schema Evolution
```typescript
// Example migration for adding new columns
export const addComplianceScore = {
  up: async (db: DrizzleDB) => {
    await db.execute(sql`
      ALTER TABLE stig_assets 
      ADD COLUMN compliance_score INTEGER DEFAULT 0,
      ADD COLUMN last_compliance_check TIMESTAMP
    `);
  },
  down: async (db: DrizzleDB) => {
    await db.execute(sql`
      ALTER TABLE stig_assets 
      DROP COLUMN compliance_score,
      DROP COLUMN last_compliance_check
    `);
  }
};
```

These Drizzle schemas provide complete type safety, validation, and database interaction capabilities for the STIG Management system, enabling seamless integration with TypeScript applications and comprehensive data modeling for enterprise security compliance management.