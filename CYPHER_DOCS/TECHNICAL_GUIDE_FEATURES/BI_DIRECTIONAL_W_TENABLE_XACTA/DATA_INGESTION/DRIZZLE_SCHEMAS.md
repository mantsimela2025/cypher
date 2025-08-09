# Data Ingestion Drizzle Schemas

## Overview

This document contains the complete TypeScript Drizzle ORM schema definitions for the Data Ingestion system. These schemas provide type-safe database interactions and automatic TypeScript type generation for all ingestion-related tables.

## Import Requirements

```typescript
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, jsonb, uuid, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
```

## Core Schema Definitions

### 1. Operational Tables

#### Ingestion Batches
```typescript
export const ingestionBatches = pgTable('ingestion_batches', {
  id: serial('id').primaryKey(),
  batchId: uuid('batch_id').notNull().unique(),
  sourceSystem: varchar('source_system', { length: 50 }).notNull(),
  batchType: varchar('batch_type', { length: 50 }),
  fileName: varchar('file_name', { length: 255 }),
  totalRecords: integer('total_records'),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),
  status: varchar('status', { length: 50 }).default('in_progress'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  errorDetails: text('error_details'),
  createdBy: integer('created_by'),
  metadata: jsonb('metadata')
});

export type IngestionBatch = typeof ingestionBatches.$inferSelect;
export type NewIngestionBatch = typeof ingestionBatches.$inferInsert;
```

#### Ingestion Errors
```typescript
export const ingestionErrors = pgTable('ingestion_errors', {
  id: serial('id').primaryKey(),
  batchId: uuid('batch_id').references(() => ingestionBatches.batchId, { onDelete: 'cascade' }),
  tableName: varchar('table_name', { length: 100 }),
  recordIdentifier: varchar('record_identifier', { length: 255 }),
  errorType: varchar('error_type', { length: 100 }),
  errorMessage: text('error_message'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionError = typeof ingestionErrors.$inferSelect;
export type NewIngestionError = typeof ingestionErrors.$inferInsert;
```

#### Ingestion Data Quality
```typescript
export const ingestionDataQuality = pgTable('ingestion_data_quality', {
  id: serial('id').primaryKey(),
  batchId: uuid('batch_id').references(() => ingestionBatches.batchId, { onDelete: 'cascade' }),
  tableName: varchar('table_name', { length: 100 }),
  qualityMetric: varchar('quality_metric', { length: 100 }),
  metricValue: decimal('metric_value', { precision: 5, scale: 2 }),
  details: jsonb('details'),
  measuredAt: timestamp('measured_at').defaultNow()
});

export type IngestionDataQuality = typeof ingestionDataQuality.$inferSelect;
export type NewIngestionDataQuality = typeof ingestionDataQuality.$inferInsert;
```

### 2. System Management Tables

#### Ingestion Systems
```typescript
export const ingestionSystems = pgTable('ingestion_systems', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  uuid: uuid('uuid').notNull().unique(),
  status: varchar('status', { length: 50 }),
  authorizationBoundary: text('authorization_boundary'),
  systemType: varchar('system_type', { length: 100 }),
  responsibleOrganization: varchar('responsible_organization', { length: 255 }),
  systemOwner: varchar('system_owner', { length: 255 }),
  informationSystemSecurityOfficer: varchar('information_system_security_officer', { length: 255 }),
  authorizingOfficial: varchar('authorizing_official', { length: 255 }),
  lastAssessmentDate: timestamp('last_assessment_date'),
  authorizationDate: timestamp('authorization_date'),
  authorizationTerminationDate: timestamp('authorization_termination_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ingestionSource: varchar('ingestion_source', { length: 50 }),
  ingestionBatchId: uuid('ingestion_batch_id'),
  rawJson: jsonb('raw_json')
});

export type IngestionSystem = typeof ingestionSystems.$inferSelect;
export type NewIngestionSystem = typeof ingestionSystems.$inferInsert;
```

#### Ingestion System Impact Levels
```typescript
export const ingestionSystemImpactLevels = pgTable('ingestion_system_impact_levels', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).references(() => ingestionSystems.systemId, { onDelete: 'cascade' }),
  confidentialityImpact: varchar('confidentiality_impact', { length: 20 }),
  integrityImpact: varchar('integrity_impact', { length: 20 }),
  availabilityImpact: varchar('availability_impact', { length: 20 }),
  overallImpact: varchar('overall_impact', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionSystemImpactLevel = typeof ingestionSystemImpactLevels.$inferSelect;
export type NewIngestionSystemImpactLevel = typeof ingestionSystemImpactLevels.$inferInsert;
```

### 3. Asset Management Tables

#### Ingestion Assets
```typescript
export const ingestionAssets = pgTable('ingestion_assets', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').notNull().unique(),
  hostname: varchar('hostname', { length: 255 }),
  netbiosName: varchar('netbios_name', { length: 100 }),
  systemId: varchar('system_id', { length: 50 }),
  hasAgent: boolean('has_agent'),
  hasPluginResults: boolean('has_plugin_results'),
  firstSeen: timestamp('first_seen'),
  lastSeen: timestamp('last_seen'),
  exposureScore: integer('exposure_score'),
  acrScore: decimal('acr_score', { precision: 3, scale: 1 }),
  criticalityRating: varchar('criticality_rating', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ingestionSource: varchar('ingestion_source', { length: 50 }),
  ingestionBatchId: uuid('ingestion_batch_id'),
  rawJson: jsonb('raw_json')
});

export type IngestionAsset = typeof ingestionAssets.$inferSelect;
export type NewIngestionAsset = typeof ingestionAssets.$inferInsert;
```

#### Ingestion Asset Systems
```typescript
export const ingestionAssetSystems = pgTable('ingestion_asset_systems', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => ingestionAssets.assetUuid, { onDelete: 'cascade' }),
  operatingSystem: varchar('operating_system', { length: 255 }),
  systemType: varchar('system_type', { length: 255 }),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionAssetSystem = typeof ingestionAssetSystems.$inferSelect;
export type NewIngestionAssetSystem = typeof ingestionAssetSystems.$inferInsert;
```

#### Ingestion Asset Network
```typescript
export const ingestionAssetNetwork = pgTable('ingestion_asset_network', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => ingestionAssets.assetUuid, { onDelete: 'cascade' }),
  macAddress: varchar('mac_address', { length: 17 }),
  ipv4Address: varchar('ipv4_address', { length: 15 }),
  ipv6Address: varchar('ipv6_address', { length: 45 }),
  fqdn: varchar('fqdn', { length: 255 }),
  netbiosWorkgroup: varchar('netbios_workgroup', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionAssetNetwork = typeof ingestionAssetNetwork.$inferSelect;
export type NewIngestionAssetNetwork = typeof ingestionAssetNetwork.$inferInsert;
```

#### Ingestion Asset Tags
```typescript
export const ingestionAssetTags = pgTable('ingestion_asset_tags', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => ingestionAssets.assetUuid, { onDelete: 'cascade' }),
  tagKey: varchar('tag_key', { length: 100 }).notNull(),
  tagValue: varchar('tag_value', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniqueAssetTag: unique().on(table.assetUuid, table.tagKey)
}));

export type IngestionAssetTag = typeof ingestionAssetTags.$inferSelect;
export type NewIngestionAssetTag = typeof ingestionAssetTags.$inferInsert;
```

### 4. Vulnerability Management Tables

#### Ingestion Vulnerabilities
```typescript
export const ingestionVulnerabilities = pgTable('ingestion_vulnerabilities', {
  id: serial('id').primaryKey(),
  batchId: uuid('batch_id').references(() => ingestionBatches.batchId),
  pluginId: varchar('plugin_id', { length: 50 }).notNull(),
  vulnerabilityName: varchar('vulnerability_name', { length: 500 }).notNull(),
  severity: varchar('severity', { length: 20 }).notNull(),
  cvssScore: decimal('cvss_score', { precision: 4, scale: 2 }),
  cvssVector: varchar('cvss_vector', { length: 200 }),
  description: text('description'),
  solution: text('solution'),
  state: varchar('state', { length: 20 }),
  firstFound: timestamp('first_found'),
  lastFound: timestamp('last_found'),
  assetUuid: varchar('asset_uuid', { length: 255 }).notNull(),
  poamId: integer('poam_id'),
  controlId: integer('control_id'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type IngestionVulnerability = typeof ingestionVulnerabilities.$inferSelect;
export type NewIngestionVulnerability = typeof ingestionVulnerabilities.$inferInsert;
```

#### Ingestion Vulnerability CVEs
```typescript
export const ingestionVulnerabilityCves = pgTable('ingestion_vulnerability_cves', {
  id: serial('id').primaryKey(),
  vulnerabilityId: integer('vulnerability_id').references(() => ingestionVulnerabilities.id, { onDelete: 'cascade' }),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  batchId: uuid('batch_id').references(() => ingestionBatches.batchId),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionVulnerabilityCve = typeof ingestionVulnerabilityCves.$inferSelect;
export type NewIngestionVulnerabilityCve = typeof ingestionVulnerabilityCves.$inferInsert;
```

### 5. Control Management Tables

#### Ingestion Controls
```typescript
export const ingestionControls = pgTable('ingestion_controls', {
  id: serial('id').primaryKey(),
  controlId: varchar('control_id', { length: 50 }).notNull(),
  controlTitle: varchar('control_title', { length: 500 }),
  family: varchar('family', { length: 100 }),
  implementationStatus: varchar('implementation_status', { length: 50 }),
  assessmentStatus: varchar('assessment_status', { length: 50 }),
  controlOrigination: varchar('control_origination', { length: 100 }),
  implementationGuidance: text('implementation_guidance'),
  assessmentProcedures: text('assessment_procedures'),
  systemId: varchar('system_id', { length: 50 }),
  responsibleRole: varchar('responsible_role', { length: 255 }),
  lastAssessed: timestamp('last_assessed'),
  nextAssessmentDue: timestamp('next_assessment_due'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ingestionSource: varchar('ingestion_source', { length: 50 }),
  ingestionBatchId: uuid('ingestion_batch_id'),
  rawJson: jsonb('raw_json')
});

export type IngestionControl = typeof ingestionControls.$inferSelect;
export type NewIngestionControl = typeof ingestionControls.$inferInsert;
```

#### Ingestion Control Findings
```typescript
export const ingestionControlFindings = pgTable('ingestion_control_findings', {
  id: serial('id').primaryKey(),
  controlId: integer('control_id').references(() => ingestionControls.id, { onDelete: 'cascade' }),
  findingId: varchar('finding_id', { length: 100 }),
  findingType: varchar('finding_type', { length: 50 }),
  severity: varchar('severity', { length: 20 }),
  description: text('description'),
  recommendation: text('recommendation'),
  status: varchar('status', { length: 50 }),
  identifiedDate: timestamp('identified_date'),
  targetResolutionDate: timestamp('target_resolution_date'),
  actualResolutionDate: timestamp('actual_resolution_date'),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionControlFinding = typeof ingestionControlFindings.$inferSelect;
export type NewIngestionControlFinding = typeof ingestionControlFindings.$inferInsert;
```

#### Ingestion Control Evidence
```typescript
export const ingestionControlEvidence = pgTable('ingestion_control_evidence', {
  id: serial('id').primaryKey(),
  controlId: integer('control_id').references(() => ingestionControls.id, { onDelete: 'cascade' }),
  evidenceType: varchar('evidence_type', { length: 100 }),
  evidenceDescription: text('evidence_description'),
  documentReference: varchar('document_reference', { length: 255 }),
  collectionDate: timestamp('collection_date'),
  evidenceStatus: varchar('evidence_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionControlEvidence = typeof ingestionControlEvidence.$inferSelect;
export type NewIngestionControlEvidence = typeof ingestionControlEvidence.$inferInsert;
```

### 6. POAM Management Tables

#### Ingestion POAMs
```typescript
export const ingestionPoams = pgTable('ingestion_poams', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).notNull().unique(),
  systemId: varchar('system_id', { length: 50 }),
  weaknessDescription: text('weakness_description'),
  weaknessDetectionSource: varchar('weakness_detection_source', { length: 255 }),
  remediationPlan: text('remediation_plan'),
  resourcesRequired: text('resources_required'),
  scheduledCompletion: timestamp('scheduled_completion'),
  milestoneChanges: text('milestone_changes'),
  sourceOfDiscovery: varchar('source_of_discovery', { length: 255 }),
  status: varchar('status', { length: 50 }),
  comments: text('comments'),
  rawWeaknessDescription: text('raw_weakness_description'),
  weaknessRiskLevel: varchar('weakness_risk_level', { length: 20 }),
  likelihood: varchar('likelihood', { length: 20 }),
  impact: varchar('impact', { length: 20 }),
  impactDescription: text('impact_description'),
  residualRiskLevel: varchar('residual_risk_level', { length: 20 }),
  recommendations: text('recommendations'),
  riskRating: varchar('risk_rating', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ingestionSource: varchar('ingestion_source', { length: 50 }),
  ingestionBatchId: uuid('ingestion_batch_id'),
  rawJson: jsonb('raw_json')
});

export type IngestionPoam = typeof ingestionPoams.$inferSelect;
export type NewIngestionPoam = typeof ingestionPoams.$inferInsert;
```

#### Ingestion POAM Milestones
```typescript
export const ingestionPoamMilestones = pgTable('ingestion_poam_milestones', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).references(() => ingestionPoams.poamId, { onDelete: 'cascade' }),
  milestoneId: varchar('milestone_id', { length: 100 }),
  milestoneDescription: text('milestone_description'),
  scheduledCompletion: timestamp('scheduled_completion'),
  actualCompletion: timestamp('actual_completion'),
  status: varchar('status', { length: 50 }),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow()
});

export type IngestionPoamMilestone = typeof ingestionPoamMilestones.$inferSelect;
export type NewIngestionPoamMilestone = typeof ingestionPoamMilestones.$inferInsert;
```

#### Ingestion POAM Assets
```typescript
export const ingestionPoamAssets = pgTable('ingestion_poam_assets', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).references(() => ingestionPoams.poamId, { onDelete: 'cascade' }),
  assetUuid: uuid('asset_uuid').references(() => ingestionAssets.assetUuid, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).default('affected_by'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniquePoamAsset: unique().on(table.poamId, table.assetUuid)
}));

export type IngestionPoamAsset = typeof ingestionPoamAssets.$inferSelect;
export type NewIngestionPoamAsset = typeof ingestionPoamAssets.$inferInsert;
```

#### Ingestion POAM CVEs
```typescript
export const ingestionPoamCves = pgTable('ingestion_poam_cves', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).references(() => ingestionPoams.poamId, { onDelete: 'cascade' }),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  relationshipType: varchar('relationship_type', { length: 50 }).default('addresses'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniquePoamCve: unique().on(table.poamId, table.cveId)
}));

export type IngestionPoamCve = typeof ingestionPoamCves.$inferSelect;
export type NewIngestionPoamCve = typeof ingestionPoamCves.$inferInsert;
```

### 7. Cross-Reference Tables

#### Ingestion System Assets
```typescript
export const ingestionSystemAssets = pgTable('ingestion_system_assets', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).references(() => ingestionSystems.systemId, { onDelete: 'cascade' }),
  assetUuid: uuid('asset_uuid').references(() => ingestionAssets.assetUuid, { onDelete: 'cascade' }),
  assignmentType: varchar('assignment_type', { length: 50 }).default('direct'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  uniqueSystemAsset: unique().on(table.systemId, table.assetUuid)
}));

export type IngestionSystemAsset = typeof ingestionSystemAssets.$inferSelect;
export type NewIngestionSystemAsset = typeof ingestionSystemAssets.$inferInsert;
```

### 8. Scheduling Tables

#### Ingestion Schedules
```typescript
export const ingestionSchedules = pgTable('ingestion_schedules', {
  id: serial('id').primaryKey(),
  scheduleName: varchar('schedule_name', { length: 255 }).notNull(),
  sourceSystem: varchar('source_system', { length: 50 }).notNull(),
  dataType: varchar('data_type', { length: 50 }).notNull(),
  cronExpression: varchar('cron_expression', { length: 100 }),
  isActive: boolean('is_active').default(true),
  lastExecution: timestamp('last_execution'),
  nextExecution: timestamp('next_execution'),
  configuration: jsonb('configuration'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type IngestionSchedule = typeof ingestionSchedules.$inferSelect;
export type NewIngestionSchedule = typeof ingestionSchedules.$inferInsert;
```

#### Ingestion Job Executions
```typescript
export const ingestionJobExecutions = pgTable('ingestion_job_executions', {
  id: serial('id').primaryKey(),
  scheduleId: integer('schedule_id').references(() => ingestionSchedules.id, { onDelete: 'cascade' }),
  batchId: uuid('batch_id').references(() => ingestionBatches.batchId),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  status: varchar('status', { length: 50 }),
  recordsProcessed: integer('records_processed'),
  executionTimeSeconds: integer('execution_time_seconds'),
  errorMessage: text('error_message')
});

export type IngestionJobExecution = typeof ingestionJobExecutions.$inferSelect;
export type NewIngestionJobExecution = typeof ingestionJobExecutions.$inferInsert;
```

## Drizzle Relations

### System Relations
```typescript
export const ingestionSystemsRelations = relations(ingestionSystems, ({ many, one }) => ({
  assets: many(ingestionAssets),
  controls: many(ingestionControls),
  poams: many(ingestionPoams),
  systemAssets: many(ingestionSystemAssets),
  impactLevels: many(ingestionSystemImpactLevels)
}));
```

### Asset Relations
```typescript
export const ingestionAssetsRelations = relations(ingestionAssets, ({ many, one }) => ({
  vulnerabilities: many(ingestionVulnerabilities),
  assetSystems: many(ingestionAssetSystems),
  assetNetwork: many(ingestionAssetNetwork),
  assetTags: many(ingestionAssetTags),
  systemAssets: many(ingestionSystemAssets),
  poamAssets: many(ingestionPoamAssets)
}));
```

### Vulnerability Relations
```typescript
export const ingestionVulnerabilitiesRelations = relations(ingestionVulnerabilities, ({ many, one }) => ({
  asset: one(ingestionAssets, {
    fields: [ingestionVulnerabilities.assetUuid],
    references: [ingestionAssets.assetUuid]
  }),
  cves: many(ingestionVulnerabilityCves),
  batch: one(ingestionBatches, {
    fields: [ingestionVulnerabilities.batchId],
    references: [ingestionBatches.batchId]
  })
}));
```

### Control Relations
```typescript
export const ingestionControlsRelations = relations(ingestionControls, ({ many, one }) => ({
  findings: many(ingestionControlFindings),
  evidence: many(ingestionControlEvidence),
  system: one(ingestionSystems, {
    fields: [ingestionControls.systemId],
    references: [ingestionSystems.systemId]
  })
}));
```

### POAM Relations
```typescript
export const ingestionPoamsRelations = relations(ingestionPoams, ({ many, one }) => ({
  milestones: many(ingestionPoamMilestones),
  poamAssets: many(ingestionPoamAssets),
  poamCves: many(ingestionPoamCves),
  system: one(ingestionSystems, {
    fields: [ingestionPoams.systemId],
    references: [ingestionSystems.systemId]
  })
}));
```

### Batch Relations
```typescript
export const ingestionBatchesRelations = relations(ingestionBatches, ({ many }) => ({
  vulnerabilities: many(ingestionVulnerabilities),
  errors: many(ingestionErrors),
  dataQuality: many(ingestionDataQuality),
  jobExecutions: many(ingestionJobExecutions)
}));
```

## Type Exports

### Comprehensive Type Definitions
```typescript
// Union types for enums
export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type ImpactLevel = 'Low' | 'Moderate' | 'High';
export type BatchStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type VulnerabilityState = 'Open' | 'Fixed' | 'Accepted' | 'False Positive';
export type ControlStatus = 'Implemented' | 'Partially Implemented' | 'Not Implemented' | 'Not Applicable';
export type PoamStatus = 'Open' | 'In Progress' | 'Completed' | 'Cancelled';

// Complex type definitions
export interface IngestionStatistics {
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  totalAssets: number;
  totalVulnerabilities: number;
  totalControls: number;
  totalPoams: number;
  averageProcessingTime: number;
}

export interface VulnerabilityBySeverity {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export interface SystemSummary {
  systemId: string;
  name: string;
  totalAssets: number;
  totalVulnerabilities: number;
  vulnerabilityBreakdown: VulnerabilityBySeverity;
  totalControls: number;
  totalPoams: number;
  averageExposureScore: number;
}
```

## Usage Examples

### Creating a New Batch
```typescript
import { ingestionBatches, type NewIngestionBatch } from '@shared/schema';

const newBatch: NewIngestionBatch = {
  batchId: crypto.randomUUID(),
  sourceSystem: 'tenable',
  batchType: 'vulnerabilities',
  fileName: 'vulnerability_export.json',
  totalRecords: 1500,
  createdBy: userId
};

const batch = await db.insert(ingestionBatches).values(newBatch).returning();
```

### Querying with Relations
```typescript
import { ingestionSystems, ingestionAssets, ingestionVulnerabilities } from '@shared/schema';
import { eq, count, desc } from 'drizzle-orm';

const systemsWithStats = await db
  .select({
    system: ingestionSystems,
    assetCount: count(ingestionAssets.id),
    vulnerabilityCount: count(ingestionVulnerabilities.id)
  })
  .from(ingestionSystems)
  .leftJoin(ingestionAssets, eq(ingestionSystems.systemId, ingestionAssets.systemId))
  .leftJoin(ingestionVulnerabilities, eq(ingestionAssets.assetUuid, ingestionVulnerabilities.assetUuid))
  .groupBy(ingestionSystems.id)
  .orderBy(desc(count(ingestionVulnerabilities.id)));
```

### Type-Safe Updates
```typescript
import { ingestionBatches } from '@shared/schema';
import { eq } from 'drizzle-orm';

const updateBatch = await db
  .update(ingestionBatches)
  .set({
    status: 'completed',
    completedAt: new Date(),
    successfulRecords: 1450,
    failedRecords: 50
  })
  .where(eq(ingestionBatches.batchId, batchId))
  .returning();
```

## Migration Support

### Automatic Schema Generation
```typescript
// Generate migrations automatically
// npm run db:generate
// npm run db:push

// The Drizzle schemas automatically handle:
// - Table creation with proper constraints
// - Index generation for performance
// - Foreign key relationships
// - Type safety enforcement
```

---

These Drizzle schemas provide complete type safety for all data ingestion operations while maintaining the complex hierarchical relationships required for enterprise security data management.