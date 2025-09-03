const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index, unique, uuid } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { assets } = require('./assets');

// Enums for STIG and security management
const stigStatusEnum = pgEnum('enum_stig_status', ['not_reviewed', 'open', 'not_applicable', 'not_a_finding', 'informational']);
const severityEnum = pgEnum('enum_severity', ['low', 'medium', 'high', 'critical']);
const mappingTypeEnum = pgEnum('enum_mapping_type', ['direct', 'inherited', 'derived', 'custom']);

// STIG Assets table
const stigAssets = pgTable('stig_assets', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid), // References assets.asset_uuid
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  stigTitle: varchar('stig_title', { length: 255 }).notNull(),
  stigVersion: varchar('stig_version', { length: 50 }),
  stigRelease: varchar('stig_release', { length: 50 }),
  assignedDate: timestamp('assigned_date', { withTimezone: true }).defaultNow(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completionDate: timestamp('completion_date', { withTimezone: true }),
  overallStatus: varchar('overall_status', { length: 50 }).default('in_progress'),
  totalFindings: integer('total_findings').default(0),
  openFindings: integer('open_findings').default(0),
  notApplicableFindings: integer('not_applicable_findings').default(0),
  notAFindingCount: integer('not_a_finding_count').default(0),
  compliancePercentage: integer('compliance_percentage').default(0),
  assignedTo: integer('assigned_to').references(() => users.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assetUuidIdx: index('idx_stig_assets_asset_uuid').on(table.assetUuid),
  stigIdIdx: index('idx_stig_assets_stig_id').on(table.stigId),
  overallStatusIdx: index('idx_stig_assets_overall_status').on(table.overallStatus),
  assignedToIdx: index('idx_stig_assets_assigned_to').on(table.assignedTo),
  dueDateIdx: index('idx_stig_assets_due_date').on(table.dueDate),
  compliancePercentageIdx: index('idx_stig_assets_compliance_percentage').on(table.compliancePercentage),
}));

// STIG Asset Assignments table
const stigAssetAssignments = pgTable('stig_asset_assignments', {
  id: serial('id').primaryKey(),
  stigAssetId: integer('stig_asset_id').references(() => stigAssets.id, { onDelete: 'cascade' }).notNull(),
  assignedTo: integer('assigned_to').references(() => users.id).notNull(),
  assignedBy: integer('assigned_by').references(() => users.id).notNull(),
  assignmentType: varchar('assignment_type', { length: 50 }).default('primary'), // 'primary', 'secondary', 'reviewer'
  assignedDate: timestamp('assigned_date', { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedDate: timestamp('completed_date', { withTimezone: true }),
  status: varchar('status', { length: 50 }).default('assigned'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
}, (table) => ({
  stigAssetAssignedUnique: unique('unique_stig_asset_assigned').on(table.stigAssetId, table.assignedTo, table.assignmentType),
  stigAssetIdIdx: index('idx_stig_asset_assignments_stig_asset_id').on(table.stigAssetId),
  assignedToIdx: index('idx_stig_asset_assignments_assigned_to').on(table.assignedTo),
  assignedByIdx: index('idx_stig_asset_assignments_assigned_by').on(table.assignedBy),
  assignmentTypeIdx: index('idx_stig_asset_assignments_assignment_type').on(table.assignmentType),
  statusIdx: index('idx_stig_asset_assignments_status').on(table.status),
  dueDateIdx: index('idx_stig_asset_assignments_due_date').on(table.dueDate),
  activeIdx: index('idx_stig_asset_assignments_active').on(table.isActive),
}));

// STIG Collections table
const stigCollections = pgTable('stig_collections', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  collectionType: varchar('collection_type', { length: 50 }).notNull(), // 'baseline', 'custom', 'compliance_framework'
  stigIds: text('stig_ids').array().notNull(), // Array of STIG IDs
  applicableAssetTypes: text('applicable_asset_types').array(),
  complianceFramework: varchar('compliance_framework', { length: 100 }),
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  version: varchar('version', { length: 20 }).default('1.0'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_stig_collections_name').on(table.name),
  collectionTypeIdx: index('idx_stig_collections_collection_type').on(table.collectionType),
  complianceFrameworkIdx: index('idx_stig_collections_compliance_framework').on(table.complianceFramework),
  activeIdx: index('idx_stig_collections_active').on(table.isActive),
  defaultIdx: index('idx_stig_collections_default').on(table.isDefault),
  effectiveDateIdx: index('idx_stig_collections_effective_date').on(table.effectiveDate),
}));

// STIG Downloads table
const stigDownloads = pgTable('stig_downloads', {
  id: serial('id').primaryKey(),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  stigTitle: varchar('stig_title', { length: 255 }).notNull(),
  version: varchar('version', { length: 50 }),
  release: varchar('release', { length: 50 }),
  downloadUrl: varchar('download_url', { length: 500 }),
  localFilePath: varchar('local_file_path', { length: 500 }),
  fileSize: integer('file_size'),
  fileHash: varchar('file_hash', { length: 64 }), // SHA-256 hash
  downloadDate: timestamp('download_date', { withTimezone: true }).defaultNow(),
  publishDate: timestamp('publish_date', { withTimezone: true }),
  isLatest: boolean('is_latest').default(false),
  isActive: boolean('is_active').default(true),
  downloadedBy: integer('downloaded_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
}, (table) => ({
  stigIdIdx: index('idx_stig_downloads_stig_id').on(table.stigId),
  versionIdx: index('idx_stig_downloads_version').on(table.version),
  latestIdx: index('idx_stig_downloads_latest').on(table.isLatest),
  activeIdx: index('idx_stig_downloads_active').on(table.isActive),
  downloadDateIdx: index('idx_stig_downloads_download_date').on(table.downloadDate),
  publishDateIdx: index('idx_stig_downloads_publish_date').on(table.publishDate),
}));

// STIG Mappings table
const stigMappings = pgTable('stig_mappings', {
  id: serial('id').primaryKey(),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'cve', 'cwe', 'nist_control', 'iso_control'
  sourceId: varchar('source_id', { length: 100 }).notNull(),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  stigRuleId: varchar('stig_rule_id', { length: 100 }).notNull(),
  mappingType: mappingTypeEnum('mapping_type').default('direct').notNull(),
  confidence: integer('confidence'), // 1-100 percentage
  description: text('description'),
  rationale: text('rationale'),
  isActive: boolean('is_active').default(true),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sourceStigUnique: unique('unique_source_stig_mapping').on(table.sourceType, table.sourceId, table.stigId, table.stigRuleId),
  sourceTypeIdx: index('idx_stig_mappings_source_type').on(table.sourceType),
  sourceIdIdx: index('idx_stig_mappings_source_id').on(table.sourceId),
  stigIdIdx: index('idx_stig_mappings_stig_id').on(table.stigId),
  stigRuleIdIdx: index('idx_stig_mappings_stig_rule_id').on(table.stigRuleId),
  mappingTypeIdx: index('idx_stig_mappings_mapping_type').on(table.mappingType),
  activeIdx: index('idx_stig_mappings_active').on(table.isActive),
  confidenceIdx: index('idx_stig_mappings_confidence').on(table.confidence),
}));

// STIG Reviews table
const stigReviews = pgTable('stig_reviews', {
  id: serial('id').primaryKey(),
  stigAssetId: integer('stig_asset_id').references(() => stigAssets.id, { onDelete: 'cascade' }).notNull(),
  reviewType: varchar('review_type', { length: 50 }).notNull(), // 'initial', 'periodic', 'final', 'exception'
  reviewStatus: varchar('review_status', { length: 50 }).default('in_progress'),
  reviewDate: timestamp('review_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedDate: timestamp('completed_date', { withTimezone: true }),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  findings: text('findings'),
  recommendations: text('recommendations'),
  exceptions: text('exceptions'),
  riskAcceptance: text('risk_acceptance'),
  nextReviewDate: timestamp('next_review_date', { withTimezone: true }),
  attachments: text('attachments').array(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  stigAssetIdIdx: index('idx_stig_reviews_stig_asset_id').on(table.stigAssetId),
  reviewTypeIdx: index('idx_stig_reviews_review_type').on(table.reviewType),
  reviewStatusIdx: index('idx_stig_reviews_review_status').on(table.reviewStatus),
  reviewDateIdx: index('idx_stig_reviews_review_date').on(table.reviewDate),
  dueDateIdx: index('idx_stig_reviews_due_date').on(table.dueDate),
  reviewedByIdx: index('idx_stig_reviews_reviewed_by').on(table.reviewedBy),
  nextReviewDateIdx: index('idx_stig_reviews_next_review_date').on(table.nextReviewDate),
}));

// STIG Rules table
const stigRules = pgTable('stig_rules', {
  id: serial('id').primaryKey(),
  stigId: varchar('stig_id', { length: 100 }).notNull(),
  ruleId: varchar('rule_id', { length: 100 }).notNull(),
  vulnId: varchar('vuln_id', { length: 100 }),
  groupTitle: varchar('group_title', { length: 255 }),
  ruleTitle: varchar('rule_title', { length: 255 }).notNull(),
  description: text('description'),
  checkText: text('check_text'),
  fixText: text('fix_text'),
  severity: severityEnum('severity'),
  weight: numeric('weight', { precision: 3, scale: 1 }),
  cciRefs: text('cci_refs').array(), // CCI reference numbers
  nistRefs: text('nist_refs').array(), // NIST control references
  stigVersion: varchar('stig_version', { length: 50 }),
  stigRelease: varchar('stig_release', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  stigRuleUnique: unique('unique_stig_rule').on(table.stigId, table.ruleId),
  stigIdIdx: index('idx_stig_rules_stig_id').on(table.stigId),
  ruleIdIdx: index('idx_stig_rules_rule_id').on(table.ruleId),
  vulnIdIdx: index('idx_stig_rules_vuln_id').on(table.vulnId),
  severityIdx: index('idx_stig_rules_severity').on(table.severity),
  activeIdx: index('idx_stig_rules_active').on(table.isActive),
  stigVersionIdx: index('idx_stig_rules_stig_version').on(table.stigVersion),
}));

// Attack Surface Mapping table
const attackSurfaceMapping = pgTable('attack_surface_mapping', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id), // References assets.id
  systemId: integer('system_id'), // References systems.id
  surfaceType: varchar('surface_type', { length: 50 }).notNull(), // 'network', 'application', 'physical', 'human'
  exposureLevel: varchar('exposure_level', { length: 50 }).notNull(), // 'internal', 'external', 'dmz', 'public'
  attackVector: varchar('attack_vector', { length: 100 }).notNull(),
  entryPoint: varchar('entry_point', { length: 255 }),
  description: text('description'),
  riskLevel: varchar('risk_level', { length: 20 }).default('medium'),
  mitigations: text('mitigations').array(),
  controls: text('controls').array(), // Security controls in place
  vulnerabilities: text('vulnerabilities').array(), // Associated vulnerability IDs
  threatActors: text('threat_actors').array(),
  attackScenarios: text('attack_scenarios').array(),
  businessImpact: text('business_impact'),
  lastAssessed: timestamp('last_assessed', { withTimezone: true }),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessedBy: integer('assessed_by').references(() => users.id),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assetIdIdx: index('idx_attack_surface_mapping_asset_id').on(table.assetId),
  systemIdIdx: index('idx_attack_surface_mapping_system_id').on(table.systemId),
  surfaceTypeIdx: index('idx_attack_surface_mapping_surface_type').on(table.surfaceType),
  exposureLevelIdx: index('idx_attack_surface_mapping_exposure_level').on(table.exposureLevel),
  attackVectorIdx: index('idx_attack_surface_mapping_attack_vector').on(table.attackVector),
  riskLevelIdx: index('idx_attack_surface_mapping_risk_level').on(table.riskLevel),
  lastAssessedIdx: index('idx_attack_surface_mapping_last_assessed').on(table.lastAssessed),
  nextAssessmentIdx: index('idx_attack_surface_mapping_next_assessment').on(table.nextAssessment),
  activeIdx: index('idx_attack_surface_mapping_active').on(table.isActive),
}));

module.exports = {
  stigAssets,
  stigAssetAssignments,
  stigCollections,
  stigDownloads,
  stigMappings,
  stigReviews,
  stigRules,
  attackSurfaceMapping,
  // Export enums
  stigStatusEnum,
  severityEnum,
  mappingTypeEnum,
};
