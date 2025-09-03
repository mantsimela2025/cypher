const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for compliance and documentation
const classificationLevelEnum = pgEnum('enum_classification_level', ['unclassified', 'cui', 'confidential', 'secret', 'top_secret']);
const documentStatusEnum = pgEnum('enum_document_status', ['draft', 'review', 'approved', 'published', 'archived', 'expired']);
const referenceTypeEnum = pgEnum('enum_reference_type', ['standard', 'regulation', 'guideline', 'policy', 'procedure', 'framework']);

// Information Classification Items table
const informationClassificationItems = pgTable('information_classification_items', {
  id: serial('id').primaryKey(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  itemType: varchar('item_type', { length: 100 }).notNull(), // 'data_element', 'system', 'document', 'process'
  classificationLevel: classificationLevelEnum('classification_level').notNull(),
  classificationRationale: text('classification_rationale'),
  dataCategory: varchar('data_category', { length: 100 }),
  sensitivityLevel: varchar('sensitivity_level', { length: 50 }),
  handlingInstructions: text('handling_instructions'),
  accessRequirements: text('access_requirements'),
  storageRequirements: text('storage_requirements'),
  transmissionRequirements: text('transmission_requirements'),
  retentionPeriod: integer('retention_period'), // days
  disposalMethod: varchar('disposal_method', { length: 100 }),
  legalRequirements: text('legal_requirements').array(),
  regulatoryRequirements: text('regulatory_requirements').array(),
  businessJustification: text('business_justification'),
  riskAssessment: text('risk_assessment'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  reviewDate: timestamp('review_date', { withTimezone: true }),
  nextReview: timestamp('next_review', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  itemNameIdx: index('idx_information_classification_items_item_name').on(table.itemName),
  itemTypeIdx: index('idx_information_classification_items_item_type').on(table.itemType),
  classificationLevelIdx: index('idx_information_classification_items_classification_level').on(table.classificationLevel),
  dataCategoryIdx: index('idx_information_classification_items_data_category').on(table.dataCategory),
  sensitivityLevelIdx: index('idx_information_classification_items_sensitivity_level').on(table.sensitivityLevel),
  activeIdx: index('idx_information_classification_items_active').on(table.isActive),
  nextReviewIdx: index('idx_information_classification_items_next_review').on(table.nextReview),
  approvedByIdx: index('idx_information_classification_items_approved_by').on(table.approvedBy),
}));

// Security Classification Guide table
const securityClassificationGuide = pgTable('security_classification_guide', {
  id: serial('id').primaryKey(),
  guideName: varchar('guide_name', { length: 255 }).notNull(),
  guideVersion: varchar('guide_version', { length: 20 }).default('1.0'),
  description: text('description'),
  scope: text('scope'),
  applicableSystemId: integer('applicable_system_id'), // References systems.id
  classificationAuthority: varchar('classification_authority', { length: 255 }),
  derivedFrom: varchar('derived_from', { length: 255 }),
  classificationDate: timestamp('classification_date', { withTimezone: true }),
  declassificationDate: timestamp('declassification_date', { withTimezone: true }),
  classificationElements: jsonb('classification_elements').notNull(), // Detailed classification rules
  markingInstructions: text('marking_instructions'),
  handlingCaveats: text('handling_caveats').array(),
  disseminationControls: text('dissemination_controls').array(),
  foreignRelease: boolean('foreign_release').default(false),
  foreignReleaseCountries: text('foreign_release_countries').array(),
  exemptions: text('exemptions'),
  specialHandling: text('special_handling'),
  reviewCycle: integer('review_cycle').default(365), // days
  lastReview: timestamp('last_review', { withTimezone: true }),
  nextReview: timestamp('next_review', { withTimezone: true }),
  status: documentStatusEnum('status').default('draft'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  supersedes: integer('supersedes').references(() => securityClassificationGuide.id),
  relatedGuides: text('related_guides').array(),
  attachments: text('attachments').array(),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  guideNameIdx: index('idx_security_classification_guide_guide_name').on(table.guideName),
  guideVersionIdx: index('idx_security_classification_guide_guide_version').on(table.guideVersion),
  systemIdIdx: index('idx_security_classification_guide_system_id').on(table.applicableSystemId),
  statusIdx: index('idx_security_classification_guide_status').on(table.status),
  effectiveDateIdx: index('idx_security_classification_guide_effective_date').on(table.effectiveDate),
  expirationDateIdx: index('idx_security_classification_guide_expiration_date').on(table.expirationDate),
  nextReviewIdx: index('idx_security_classification_guide_next_review').on(table.nextReview),
  approvedByIdx: index('idx_security_classification_guide_approved_by').on(table.approvedBy),
  supersedesIdx: index('idx_security_classification_guide_supersedes').on(table.supersedes),
}));

// References table
const references = pgTable('references', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 500 }).notNull(),
  referenceType: referenceTypeEnum('reference_type').notNull(),
  identifier: varchar('identifier', { length: 100 }), // Standard number, regulation code, etc.
  version: varchar('version', { length: 50 }),
  publisher: varchar('publisher', { length: 255 }),
  publicationDate: timestamp('publication_date', { withTimezone: true }),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  url: varchar('url', { length: 500 }),
  documentPath: varchar('document_path', { length: 500 }),
  abstract: text('abstract'),
  keywords: text('keywords').array(),
  scope: text('scope'),
  applicability: text('applicability'),
  relatedReferences: text('related_references').array(), // Reference IDs
  supersedes: integer('supersedes').references(() => references.id),
  supersededBy: integer('superseded_by').references(() => references.id),
  isActive: boolean('is_active').default(true),
  isMandatory: boolean('is_mandatory').default(false),
  complianceRequired: boolean('compliance_required').default(false),
  industryDomain: varchar('industry_domain', { length: 100 }),
  geographicScope: varchar('geographic_scope', { length: 100 }),
  language: varchar('language', { length: 10 }).default('en'),
  accessLevel: varchar('access_level', { length: 50 }).default('public'),
  downloadCount: integer('download_count').default(0),
  lastAccessed: timestamp('last_accessed', { withTimezone: true }),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  addedBy: integer('added_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  titleIdx: index('idx_references_title').on(table.title),
  referenceTypeIdx: index('idx_references_reference_type').on(table.referenceType),
  identifierIdx: index('idx_references_identifier').on(table.identifier),
  publisherIdx: index('idx_references_publisher').on(table.publisher),
  activeIdx: index('idx_references_active').on(table.isActive),
  mandatoryIdx: index('idx_references_mandatory').on(table.isMandatory),
  complianceRequiredIdx: index('idx_references_compliance_required').on(table.complianceRequired),
  industryDomainIdx: index('idx_references_industry_domain').on(table.industryDomain),
  effectiveDateIdx: index('idx_references_effective_date').on(table.effectiveDate),
  expirationDateIdx: index('idx_references_expiration_date').on(table.expirationDate),
  supersedesIdx: index('idx_references_supersedes').on(table.supersedes),
  supersededByIdx: index('idx_references_superseded_by').on(table.supersededBy),
  tagsIdx: index('idx_references_tags').on(table.tags),
}));

// Plan of Action Milestones table
const planOfActionMilestones = pgTable('plan_of_action_milestones', {
  id: serial('id').primaryKey(),
  poamId: integer('poam_id').notNull(), // References poams.id
  milestoneNumber: integer('milestone_number').notNull(),
  description: text('description').notNull(),
  plannedStartDate: timestamp('planned_start_date', { withTimezone: true }),
  plannedEndDate: timestamp('planned_end_date', { withTimezone: true }),
  actualStartDate: timestamp('actual_start_date', { withTimezone: true }),
  actualEndDate: timestamp('actual_end_date', { withTimezone: true }),
  status: varchar('status', { length: 50 }).default('not_started'), // 'not_started', 'in_progress', 'completed', 'delayed', 'cancelled'
  percentComplete: integer('percent_complete').default(0),
  deliverables: text('deliverables').array(),
  dependencies: text('dependencies').array(),
  resources: text('resources').array(),
  budget: integer('budget'),
  actualCost: integer('actual_cost'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  assignedTo: integer('assigned_to').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  completedBy: integer('completed_by').references(() => users.id),
  notes: text('notes'),
  riskFactors: text('risk_factors').array(),
  successCriteria: text('success_criteria'),
  evidenceOfCompletion: text('evidence_of_completion'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  poamMilestoneUnique: unique('unique_poam_milestone').on(table.poamId, table.milestoneNumber),
  poamIdIdx: index('idx_plan_of_action_milestones_poam_id').on(table.poamId),
  milestoneNumberIdx: index('idx_plan_of_action_milestones_milestone_number').on(table.milestoneNumber),
  statusIdx: index('idx_plan_of_action_milestones_status').on(table.status),
  plannedEndDateIdx: index('idx_plan_of_action_milestones_planned_end_date').on(table.plannedEndDate),
  actualEndDateIdx: index('idx_plan_of_action_milestones_actual_end_date').on(table.actualEndDate),
  assignedToIdx: index('idx_plan_of_action_milestones_assigned_to').on(table.assignedTo),
  percentCompleteIdx: index('idx_plan_of_action_milestones_percent_complete').on(table.percentComplete),
}));

// POAM Signatures table
const poamSignatures = pgTable('poam_signatures', {
  id: serial('id').primaryKey(),
  poamId: integer('poam_id').notNull(), // References poams.id
  signatureType: varchar('signature_type', { length: 50 }).notNull(), // 'author', 'reviewer', 'approver', 'authorizing_official'
  signerRole: varchar('signer_role', { length: 100 }).notNull(),
  signerName: varchar('signer_name', { length: 255 }).notNull(),
  signerTitle: varchar('signer_title', { length: 255 }),
  signerOrganization: varchar('signer_organization', { length: 255 }),
  signerId: integer('signer_id').references(() => users.id),
  signatureDate: timestamp('signature_date', { withTimezone: true }),
  signatureMethod: varchar('signature_method', { length: 50 }), // 'digital', 'electronic', 'wet_signature'
  signatureData: text('signature_data'), // Encrypted signature data
  certificateId: varchar('certificate_id', { length: 255 }),
  isRequired: boolean('is_required').default(true),
  isSigned: boolean('is_signed').default(false),
  delegatedTo: integer('delegated_to').references(() => users.id),
  delegationReason: text('delegation_reason'),
  comments: text('comments'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  poamSignerUnique: unique('unique_poam_signer').on(table.poamId, table.signatureType, table.signerRole),
  poamIdIdx: index('idx_poam_signatures_poam_id').on(table.poamId),
  signatureTypeIdx: index('idx_poam_signatures_signature_type').on(table.signatureType),
  signerIdIdx: index('idx_poam_signatures_signer_id').on(table.signerId),
  signatureDateIdx: index('idx_poam_signatures_signature_date').on(table.signatureDate),
  requiredIdx: index('idx_poam_signatures_required').on(table.isRequired),
  signedIdx: index('idx_poam_signatures_signed').on(table.isSigned),
  delegatedToIdx: index('idx_poam_signatures_delegated_to').on(table.delegatedTo),
}));

// Generated Reports table
const generatedReports = pgTable('generated_reports', {
  id: serial('id').primaryKey(),
  reportName: varchar('report_name', { length: 255 }).notNull(),
  reportType: varchar('report_type', { length: 100 }).notNull(),
  reportFormat: varchar('report_format', { length: 20 }).default('pdf'), // 'pdf', 'excel', 'csv', 'html'
  description: text('description'),
  parameters: jsonb('parameters').default('{}'),
  filters: jsonb('filters').default('{}'),
  dataSource: varchar('data_source', { length: 100 }),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  recordCount: integer('record_count'),
  generationTime: integer('generation_time'), // seconds
  status: varchar('status', { length: 50 }).default('completed'),
  errorMessage: text('error_message'),
  scheduledRun: boolean('scheduled_run').default(false),
  scheduleId: integer('schedule_id'), // References schedules.id
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  downloadCount: integer('download_count').default(0),
  lastDownloaded: timestamp('last_downloaded', { withTimezone: true }),
  isPublic: boolean('is_public').default(false),
  sharedWith: text('shared_with').array(), // User IDs or roles
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  generatedBy: integer('generated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  reportNameIdx: index('idx_generated_reports_report_name').on(table.reportName),
  reportTypeIdx: index('idx_generated_reports_report_type').on(table.reportType),
  statusIdx: index('idx_generated_reports_status').on(table.status),
  scheduledRunIdx: index('idx_generated_reports_scheduled_run').on(table.scheduledRun),
  scheduleIdIdx: index('idx_generated_reports_schedule_id').on(table.scheduleId),
  expiresAtIdx: index('idx_generated_reports_expires_at').on(table.expiresAt),
  publicIdx: index('idx_generated_reports_public').on(table.isPublic),
  generatedByIdx: index('idx_generated_reports_generated_by').on(table.generatedBy),
  createdAtIdx: index('idx_generated_reports_created_at').on(table.createdAt),
}));

module.exports = {
  informationClassificationItems,
  securityClassificationGuide,
  references,
  planOfActionMilestones,
  poamSignatures,
  generatedReports,
  // Export enums
  classificationLevelEnum,
  documentStatusEnum,
  referenceTypeEnum,
};
