const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for patch, license, and miscellaneous
const approvalStatusEnum = pgEnum('enum_approval_status', ['pending', 'approved', 'rejected', 'expired']);
const executionStatusEnum = pgEnum('enum_execution_status', ['scheduled', 'running', 'completed', 'failed', 'cancelled']);
const exploitTypeEnum = pgEnum('enum_exploit_type', ['remote', 'local', 'web', 'network', 'physical', 'social']);
const exploitStatusEnum = pgEnum('enum_exploit_status', ['proof_of_concept', 'functional', 'weaponized', 'patched']);

// Patch Approval History table
const patchApprovalHistory = pgTable('patch_approval_history', {
  id: serial('id').primaryKey(),
  patchId: integer('patch_id').notNull(), // References patches.id
  approvalRequestId: integer('approval_request_id'), // References patch_approvals.id
  requestedBy: integer('requested_by').references(() => users.id).notNull(),
  approvedBy: integer('approved_by').references(() => users.id),
  approvalStatus: approvalStatusEnum('approval_status').default('pending').notNull(),
  requestDate: timestamp('request_date', { withTimezone: true }).defaultNow().notNull(),
  approvalDate: timestamp('approval_date', { withTimezone: true }),
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
  urgencyLevel: varchar('urgency_level', { length: 20 }).default('medium'),
  businessJustification: text('business_justification'),
  technicalJustification: text('technical_justification'),
  riskAssessment: text('risk_assessment'),
  impactAnalysis: text('impact_analysis'),
  rollbackPlan: text('rollback_plan'),
  testingPlan: text('testing_plan'),
  affectedSystems: text('affected_systems').array(),
  maintenanceWindow: jsonb('maintenance_window').default('{}'),
  approverComments: text('approver_comments'),
  rejectionReason: text('rejection_reason'),
  conditions: text('conditions').array(),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  patchIdIdx: index('idx_patch_approval_history_patch_id').on(table.patchId),
  approvalRequestIdIdx: index('idx_patch_approval_history_approval_request_id').on(table.approvalRequestId),
  requestedByIdx: index('idx_patch_approval_history_requested_by').on(table.requestedBy),
  approvedByIdx: index('idx_patch_approval_history_approved_by').on(table.approvedBy),
  approvalStatusIdx: index('idx_patch_approval_history_approval_status').on(table.approvalStatus),
  requestDateIdx: index('idx_patch_approval_history_request_date').on(table.requestDate),
  scheduledDateIdx: index('idx_patch_approval_history_scheduled_date').on(table.scheduledDate),
  urgencyLevelIdx: index('idx_patch_approval_history_urgency_level').on(table.urgencyLevel),
}));

// Patch Schedule Executions table
const patchScheduleExecutions = pgTable('patch_schedule_executions', {
  id: serial('id').primaryKey(),
  scheduleId: integer('schedule_id').notNull(), // References patch_schedules.id
  executionId: varchar('execution_id', { length: 100 }).notNull().unique(),
  patchIds: text('patch_ids').array().notNull(), // Array of patch IDs
  targetAssets: text('target_assets').array(), // Asset IDs
  executionStatus: executionStatusEnum('execution_status').default('scheduled').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }),
  endTime: timestamp('end_time', { withTimezone: true }),
  duration: integer('duration'), // seconds
  totalPatches: integer('total_patches').default(0),
  successfulPatches: integer('successful_patches').default(0),
  failedPatches: integer('failed_patches').default(0),
  skippedPatches: integer('skipped_patches').default(0),
  totalAssets: integer('total_assets').default(0),
  successfulAssets: integer('successful_assets').default(0),
  failedAssets: integer('failed_assets').default(0),
  executionLogs: text('execution_logs'),
  errorSummary: text('error_summary'),
  rollbackRequired: boolean('rollback_required').default(false),
  rollbackCompleted: boolean('rollback_completed').default(false),
  rollbackLogs: text('rollback_logs'),
  preExecutionChecks: jsonb('pre_execution_checks').default('{}'),
  postExecutionChecks: jsonb('post_execution_checks').default('{}'),
  executedBy: integer('executed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  scheduleIdIdx: index('idx_patch_schedule_executions_schedule_id').on(table.scheduleId),
  executionIdIdx: index('idx_patch_schedule_executions_execution_id').on(table.executionId),
  executionStatusIdx: index('idx_patch_schedule_executions_execution_status').on(table.executionStatus),
  startTimeIdx: index('idx_patch_schedule_executions_start_time').on(table.startTime),
  endTimeIdx: index('idx_patch_schedule_executions_end_time').on(table.endTime),
  executedByIdx: index('idx_patch_schedule_executions_executed_by').on(table.executedBy),
  rollbackRequiredIdx: index('idx_patch_schedule_executions_rollback_required').on(table.rollbackRequired),
}));

// Patches Orphan table
const patchesOrphan = pgTable('patches_orphan', {
  id: serial('id').primaryKey(),
  originalPatchId: integer('original_patch_id'), // Original patch ID before becoming orphan
  patchName: varchar('patch_name', { length: 255 }).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  product: varchar('product', { length: 255 }),
  version: varchar('version', { length: 100 }),
  patchVersion: varchar('patch_version', { length: 100 }),
  releaseDate: timestamp('release_date', { withTimezone: true }),
  orphanedDate: timestamp('orphaned_date', { withTimezone: true }).defaultNow().notNull(),
  orphanReason: varchar('orphan_reason', { length: 100 }).notNull(), // 'product_discontinued', 'vendor_acquired', 'superseded', 'recalled'
  description: text('description'),
  affectedAssets: text('affected_assets').array(),
  replacementPatch: integer('replacement_patch'), // References patches.id
  removalDate: timestamp('removal_date', { withTimezone: true }),
  archiveLocation: varchar('archive_location', { length: 500 }),
  retentionPeriod: integer('retention_period').default(2555), // days (7 years default)
  legalHold: boolean('legal_hold').default(false),
  businessJustification: text('business_justification'),
  disposalApproval: integer('disposal_approval').references(() => users.id),
  disposalDate: timestamp('disposal_date', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  originalPatchIdIdx: index('idx_patches_orphan_original_patch_id').on(table.originalPatchId),
  patchNameIdx: index('idx_patches_orphan_patch_name').on(table.patchName),
  vendorIdx: index('idx_patches_orphan_vendor').on(table.vendor),
  orphanedDateIdx: index('idx_patches_orphan_orphaned_date').on(table.orphanedDate),
  orphanReasonIdx: index('idx_patches_orphan_orphan_reason').on(table.orphanReason),
  replacementPatchIdx: index('idx_patches_orphan_replacement_patch').on(table.replacementPatch),
  removalDateIdx: index('idx_patches_orphan_removal_date').on(table.removalDate),
  legalHoldIdx: index('idx_patches_orphan_legal_hold').on(table.legalHold),
}));

// License Types table
const licenseTypes = pgTable('license_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'commercial', 'open_source', 'proprietary', 'freeware'
  licenseModel: varchar('license_model', { length: 100 }), // 'perpetual', 'subscription', 'usage_based', 'concurrent'
  isCommercial: boolean('is_commercial').default(true),
  allowsRedistribution: boolean('allows_redistribution').default(false),
  allowsModification: boolean('allows_modification').default(false),
  requiresAttribution: boolean('requires_attribution').default(false),
  requiresSourceDisclosure: boolean('requires_source_disclosure').default(false),
  copyleftType: varchar('copyleft_type', { length: 50 }), // 'none', 'weak', 'strong', 'network'
  compatibleLicenses: text('compatible_licenses').array(),
  incompatibleLicenses: text('incompatible_licenses').array(),
  legalText: text('legal_text'),
  summaryText: text('summary_text'),
  officialUrl: varchar('official_url', { length: 500 }),
  spdxIdentifier: varchar('spdx_identifier', { length: 100 }),
  osiApproved: boolean('osi_approved').default(false),
  fsfApproved: boolean('fsf_approved').default(false),
  isActive: boolean('is_active').default(true),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_license_types_name').on(table.name),
  categoryIdx: index('idx_license_types_category').on(table.category),
  licenseModelIdx: index('idx_license_types_license_model').on(table.licenseModel),
  commercialIdx: index('idx_license_types_commercial').on(table.isCommercial),
  spdxIdentifierIdx: index('idx_license_types_spdx_identifier').on(table.spdxIdentifier),
  osiApprovedIdx: index('idx_license_types_osi_approved').on(table.osiApproved),
  activeIdx: index('idx_license_types_active').on(table.isActive),
}));

// Licenses table
const licenses = pgTable('licenses', {
  id: serial('id').primaryKey(),
  licenseTypeId: integer('license_type_id').references(() => licenseTypes.id).notNull(),
  softwareAssetId: integer('software_asset_id'), // References software_assets.id
  licenseKey: varchar('license_key', { length: 500 }),
  licenseName: varchar('license_name', { length: 255 }),
  vendor: varchar('vendor', { length: 255 }),
  product: varchar('product', { length: 255 }),
  version: varchar('version', { length: 100 }),
  edition: varchar('edition', { length: 100 }),
  purchaseDate: timestamp('purchase_date', { withTimezone: true }),
  activationDate: timestamp('activation_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  renewalDate: timestamp('renewal_date', { withTimezone: true }),
  totalLicenses: integer('total_licenses').notNull(),
  usedLicenses: integer('used_licenses').default(0),
  availableLicenses: integer('available_licenses').default(0),
  costPerLicense: numeric('cost_per_license', { precision: 10, scale: 2 }),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  purchaseOrderNumber: varchar('purchase_order_number', { length: 100 }),
  contractNumber: varchar('contract_number', { length: 100 }),
  supportIncluded: boolean('support_included').default(false),
  supportExpirationDate: timestamp('support_expiration_date', { withTimezone: true }),
  maintenanceIncluded: boolean('maintenance_included').default(false),
  maintenanceExpirationDate: timestamp('maintenance_expiration_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  complianceStatus: varchar('compliance_status', { length: 50 }).default('compliant'),
  lastAudit: timestamp('last_audit', { withTimezone: true }),
  nextAudit: timestamp('next_audit', { withTimezone: true }),
  notes: text('notes'),
  attachments: text('attachments').array(),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  managedBy: integer('managed_by').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  licenseTypeIdIdx: index('idx_licenses_license_type_id').on(table.licenseTypeId),
  softwareAssetIdIdx: index('idx_licenses_software_asset_id').on(table.softwareAssetId),
  licenseKeyIdx: index('idx_licenses_license_key').on(table.licenseKey),
  vendorIdx: index('idx_licenses_vendor').on(table.vendor),
  productIdx: index('idx_licenses_product').on(table.product),
  expirationDateIdx: index('idx_licenses_expiration_date').on(table.expirationDate),
  renewalDateIdx: index('idx_licenses_renewal_date').on(table.renewalDate),
  activeIdx: index('idx_licenses_active').on(table.isActive),
  complianceStatusIdx: index('idx_licenses_compliance_status').on(table.complianceStatus),
  managedByIdx: index('idx_licenses_managed_by').on(table.managedBy),
}));

// License Costs table
const licenseCosts = pgTable('license_costs', {
  id: serial('id').primaryKey(),
  licenseId: integer('license_id').references(() => licenses.id, { onDelete: 'cascade' }).notNull(),
  costType: varchar('cost_type', { length: 50 }).notNull(), // 'initial', 'renewal', 'upgrade', 'support', 'maintenance'
  costAmount: numeric('cost_amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  billingPeriod: varchar('billing_period', { length: 20 }), // 'one_time', 'monthly', 'quarterly', 'annually'
  costDate: timestamp('cost_date', { withTimezone: true }).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  paidDate: timestamp('paid_date', { withTimezone: true }),
  isPaid: boolean('is_paid').default(false),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  purchaseOrderNumber: varchar('purchase_order_number', { length: 100 }),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  costCenterId: integer('cost_center_id'), // References cost_centers.id
  budgetId: integer('budget_id'), // References cost_budgets.id
  notes: text('notes'),
  attachments: text('attachments').array(),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  licenseIdIdx: index('idx_license_costs_license_id').on(table.licenseId),
  costTypeIdx: index('idx_license_costs_cost_type').on(table.costType),
  costDateIdx: index('idx_license_costs_cost_date').on(table.costDate),
  dueDateIdx: index('idx_license_costs_due_date').on(table.dueDate),
  paidIdx: index('idx_license_costs_paid').on(table.isPaid),
  costCenterIdIdx: index('idx_license_costs_cost_center_id').on(table.costCenterId),
  budgetIdIdx: index('idx_license_costs_budget_id').on(table.budgetId),
}));

// Exploits table
const exploits = pgTable('exploits', {
  id: serial('id').primaryKey(),
  exploitName: varchar('exploit_name', { length: 255 }).notNull(),
  exploitId: varchar('exploit_id', { length: 100 }).unique(), // CVE, EDB-ID, etc.
  exploitType: exploitTypeEnum('exploit_type').notNull(),
  status: exploitStatusEnum('status').default('proof_of_concept').notNull(),
  cveId: varchar('cve_id', { length: 20 }), // Associated CVE
  vulnerabilityId: integer('vulnerability_id'), // References vulnerabilities.id
  description: text('description'),
  technicalDetails: text('technical_details'),
  exploitCode: text('exploit_code'),
  payload: text('payload'),
  targetPlatforms: text('target_platforms').array(),
  targetVersions: text('target_versions').array(),
  prerequisites: text('prerequisites').array(),
  difficulty: varchar('difficulty', { length: 20 }), // 'low', 'medium', 'high'
  reliability: varchar('reliability', { length: 20 }), // 'low', 'medium', 'high'
  impact: varchar('impact', { length: 20 }), // 'low', 'medium', 'high', 'critical'
  discoveredBy: varchar('discovered_by', { length: 255 }),
  discoveryDate: timestamp('discovery_date', { withTimezone: true }),
  publishedDate: timestamp('published_date', { withTimezone: true }),
  lastModified: timestamp('last_modified', { withTimezone: true }),
  sourceUrl: varchar('source_url', { length: 500 }),
  references: text('references').array(),
  mitigations: text('mitigations').array(),
  detectionMethods: text('detection_methods').array(),
  isPublic: boolean('is_public').default(false),
  isActive: boolean('is_active').default(true),
  threatLevel: varchar('threat_level', { length: 20 }),
  exploitKitUsage: boolean('exploit_kit_usage').default(false),
  inTheWild: boolean('in_the_wild').default(false),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  addedBy: integer('added_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  exploitNameIdx: index('idx_exploits_exploit_name').on(table.exploitName),
  exploitIdIdx: index('idx_exploits_exploit_id').on(table.exploitId),
  exploitTypeIdx: index('idx_exploits_exploit_type').on(table.exploitType),
  statusIdx: index('idx_exploits_status').on(table.status),
  cveIdIdx: index('idx_exploits_cve_id').on(table.cveId),
  vulnerabilityIdIdx: index('idx_exploits_vulnerability_id').on(table.vulnerabilityId),
  difficultyIdx: index('idx_exploits_difficulty').on(table.difficulty),
  impactIdx: index('idx_exploits_impact').on(table.impact),
  publicIdx: index('idx_exploits_public').on(table.isPublic),
  activeIdx: index('idx_exploits_active').on(table.isActive),
  threatLevelIdx: index('idx_exploits_threat_level').on(table.threatLevel),
  inTheWildIdx: index('idx_exploits_in_the_wild').on(table.inTheWild),
  publishedDateIdx: index('idx_exploits_published_date').on(table.publishedDate),
}));

// Business Impact Analysis table
const businessImpactAnalysis = pgTable('business_impact_analysis', {
  id: serial('id').primaryKey(),
  analysisName: varchar('analysis_name', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // 'system', 'asset', 'process', 'service'
  entityId: integer('entity_id').notNull(),
  analysisType: varchar('analysis_type', { length: 50 }).notNull(), // 'bia', 'risk_assessment', 'impact_study'
  businessFunction: varchar('business_function', { length: 255 }),
  criticalityLevel: varchar('criticality_level', { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  rto: integer('rto'), // Recovery Time Objective (hours)
  rpo: integer('rpo'), // Recovery Point Objective (hours)
  mto: integer('mto'), // Maximum Tolerable Outage (hours)
  financialImpact: jsonb('financial_impact').default('{}'), // Per hour/day/week
  operationalImpact: text('operational_impact'),
  reputationalImpact: text('reputational_impact'),
  legalImpact: text('legal_impact'),
  customerImpact: text('customer_impact'),
  supplierImpact: text('supplier_impact'),
  dependencies: text('dependencies').array(),
  upstreamDependencies: text('upstream_dependencies').array(),
  downstreamDependencies: text('downstream_dependencies').array(),
  peakOperatingTimes: jsonb('peak_operating_times').default('{}'),
  minimumStaffing: integer('minimum_staffing'),
  alternativeProcesses: text('alternative_processes'),
  workarounds: text('workarounds'),
  lastReview: timestamp('last_review', { withTimezone: true }),
  nextReview: timestamp('next_review', { withTimezone: true }),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  analysisNameIdx: index('idx_business_impact_analysis_analysis_name').on(table.analysisName),
  entityIdx: index('idx_business_impact_analysis_entity').on(table.entityType, table.entityId),
  criticalityLevelIdx: index('idx_business_impact_analysis_criticality_level').on(table.criticalityLevel),
  nextReviewIdx: index('idx_business_impact_analysis_next_review').on(table.nextReview),
}));

// Conflict Resolutions table
const conflictResolutions = pgTable('conflict_resolutions', {
  id: serial('id').primaryKey(),
  conflictType: varchar('conflict_type', { length: 100 }).notNull(), // 'data_conflict', 'schedule_conflict', 'resource_conflict'
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  conflictDescription: text('conflict_description').notNull(),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionMethod: varchar('resolution_method', { length: 100 }),
  resolutionDescription: text('resolution_description'),
  isResolved: boolean('is_resolved').default(false),
  priority: varchar('priority', { length: 20 }).default('medium'),
  assignedTo: integer('assigned_to').references(() => users.id),
  resolvedBy: integer('resolved_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  conflictTypeIdx: index('idx_conflict_resolutions_conflict_type').on(table.conflictType),
  entityIdx: index('idx_conflict_resolutions_entity').on(table.entityType, table.entityId),
  resolvedIdx: index('idx_conflict_resolutions_resolved').on(table.isResolved),
  priorityIdx: index('idx_conflict_resolutions_priority').on(table.priority),
}));

// CPE Mappings table
const cpeMappings = pgTable('cpe_mappings', {
  id: serial('id').primaryKey(),
  cpeUri: varchar('cpe_uri', { length: 500 }).notNull(),
  assetId: integer('asset_id'), // References assets.id
  softwareAssetId: integer('software_asset_id'), // References software_assets.id
  vendor: varchar('vendor', { length: 255 }),
  product: varchar('product', { length: 255 }),
  version: varchar('version', { length: 100 }),
  update: varchar('update', { length: 100 }),
  edition: varchar('edition', { length: 100 }),
  language: varchar('language', { length: 10 }),
  swEdition: varchar('sw_edition', { length: 100 }),
  targetSw: varchar('target_sw', { length: 100 }),
  targetHw: varchar('target_hw', { length: 100 }),
  other: varchar('other', { length: 100 }),
  confidence: integer('confidence'), // 1-100 percentage
  isActive: boolean('is_active').default(true),
  lastVerified: timestamp('last_verified', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cpeUriIdx: index('idx_cpe_mappings_cpe_uri').on(table.cpeUri),
  assetIdIdx: index('idx_cpe_mappings_asset_id').on(table.assetId),
  softwareAssetIdIdx: index('idx_cpe_mappings_software_asset_id').on(table.softwareAssetId),
  vendorProductIdx: index('idx_cpe_mappings_vendor_product').on(table.vendor, table.product),
  activeIdx: index('idx_cpe_mappings_active').on(table.isActive),
}));

// Cross System Correlations table
const crossSystemCorrelations = pgTable('cross_system_correlations', {
  id: serial('id').primaryKey(),
  sourceSystemId: integer('source_system_id').notNull(),
  targetSystemId: integer('target_system_id').notNull(),
  correlationType: varchar('correlation_type', { length: 100 }).notNull(),
  correlationStrength: numeric('correlation_strength', { precision: 5, scale: 4 }),
  description: text('description'),
  lastCalculated: timestamp('last_calculated', { withTimezone: true }).defaultNow(),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'),
}, (table) => ({
  sourceSystemIdx: index('idx_cross_system_correlations_source_system').on(table.sourceSystemId),
  targetSystemIdx: index('idx_cross_system_correlations_target_system').on(table.targetSystemId),
  correlationTypeIdx: index('idx_cross_system_correlations_correlation_type').on(table.correlationType),
  activeIdx: index('idx_cross_system_correlations_active').on(table.isActive),
}));

// Data Conflicts table
const dataConflicts = pgTable('data_conflicts', {
  id: serial('id').primaryKey(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: varchar('record_id', { length: 100 }).notNull(),
  fieldName: varchar('field_name', { length: 100 }).notNull(),
  conflictType: varchar('conflict_type', { length: 50 }).notNull(),
  sourceValue: text('source_value'),
  targetValue: text('target_value'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  isResolved: boolean('is_resolved').default(false),
  resolutionMethod: varchar('resolution_method', { length: 100 }),
  metadata: jsonb('metadata').default('{}'),
}, (table) => ({
  tableRecordIdx: index('idx_data_conflicts_table_record').on(table.tableName, table.recordId),
  conflictTypeIdx: index('idx_data_conflicts_conflict_type').on(table.conflictType),
  resolvedIdx: index('idx_data_conflicts_resolved').on(table.isResolved),
}));

// Data Contexts table
const dataContexts = pgTable('data_contexts', {
  id: serial('id').primaryKey(),
  contextName: varchar('context_name', { length: 255 }).notNull(),
  contextType: varchar('context_type', { length: 100 }).notNull(),
  description: text('description'),
  scope: jsonb('scope').default('{}'),
  rules: jsonb('rules').default('{}'),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  contextNameIdx: index('idx_data_contexts_context_name').on(table.contextName),
  contextTypeIdx: index('idx_data_contexts_context_type').on(table.contextType),
  activeIdx: index('idx_data_contexts_active').on(table.isActive),
}));

// Enterprise Risk Aggregation table
const enterpriseRiskAggregation = pgTable('enterprise_risk_aggregation', {
  id: serial('id').primaryKey(),
  aggregationDate: timestamp('aggregation_date', { withTimezone: true }).defaultNow(),
  riskCategory: varchar('risk_category', { length: 100 }).notNull(),
  totalRiskScore: numeric('total_risk_score', { precision: 10, scale: 4 }),
  averageRiskScore: numeric('average_risk_score', { precision: 10, scale: 4 }),
  riskCount: integer('risk_count').default(0),
  highRiskCount: integer('high_risk_count').default(0),
  mediumRiskCount: integer('medium_risk_count').default(0),
  lowRiskCount: integer('low_risk_count').default(0),
  trendDirection: varchar('trend_direction', { length: 20 }),
  metadata: jsonb('metadata').default('{}'),
}, (table) => ({
  aggregationDateIdx: index('idx_enterprise_risk_aggregation_aggregation_date').on(table.aggregationDate),
  riskCategoryIdx: index('idx_enterprise_risk_aggregation_risk_category').on(table.riskCategory),
}));

// Remediation Cost Entries table
const remediationCostEntries = pgTable('remediation_cost_entries', {
  id: serial('id').primaryKey(),
  vulnerabilityId: integer('vulnerability_id'), // References vulnerabilities.id
  poamId: integer('poam_id'), // References poams.id
  costType: varchar('cost_type', { length: 50 }).notNull(),
  estimatedCost: numeric('estimated_cost', { precision: 12, scale: 2 }),
  actualCost: numeric('actual_cost', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  costDate: timestamp('cost_date', { withTimezone: true }).defaultNow(),
  description: text('description'),
  metadata: jsonb('metadata').default('{}'),
}, (table) => ({
  vulnerabilityIdIdx: index('idx_remediation_cost_entries_vulnerability_id').on(table.vulnerabilityId),
  poamIdIdx: index('idx_remediation_cost_entries_poam_id').on(table.poamId),
  costTypeIdx: index('idx_remediation_cost_entries_cost_type').on(table.costType),
}));

// Vendor Map table
const vendorMap = pgTable('vendor_map', {
  id: serial('id').primaryKey(),
  vendorName: varchar('vendor_name', { length: 255 }).notNull(),
  normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
  aliases: text('aliases').array(),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  vendorNameIdx: index('idx_vendor_map_vendor_name').on(table.vendorName),
  normalizedNameIdx: index('idx_vendor_map_normalized_name').on(table.normalizedName),
  activeIdx: index('idx_vendor_map_active').on(table.isActive),
}));

// Vulnerability Databases table
const vulnerabilityDatabases = pgTable('vulnerability_databases', {
  id: serial('id').primaryKey(),
  databaseName: varchar('database_name', { length: 255 }).notNull(),
  databaseType: varchar('database_type', { length: 100 }).notNull(),
  url: varchar('url', { length: 500 }),
  apiEndpoint: varchar('api_endpoint', { length: 500 }),
  lastSync: timestamp('last_sync', { withTimezone: true }),
  syncInterval: integer('sync_interval').default(86400), // seconds
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  databaseNameIdx: index('idx_vulnerability_databases_database_name').on(table.databaseName),
  databaseTypeIdx: index('idx_vulnerability_databases_database_type').on(table.databaseType),
  activeIdx: index('idx_vulnerability_databases_active').on(table.isActive),
}));

module.exports = {
  patchApprovalHistory,
  patchScheduleExecutions,
  patchesOrphan,
  licenseTypes,
  licenses,
  licenseCosts,
  exploits,
  businessImpactAnalysis,
  conflictResolutions,
  cpeMappings,
  crossSystemCorrelations,
  dataConflicts,
  dataContexts,
  enterpriseRiskAggregation,
  remediationCostEntries,
  vendorMap,
  vulnerabilityDatabases,
  // Export enums
  approvalStatusEnum,
  executionStatusEnum,
  exploitTypeEnum,
  exploitStatusEnum,
};
