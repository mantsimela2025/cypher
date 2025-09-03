const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { roles } = require('./roles');

// Enums for advanced security
const complianceStatusEnum = pgEnum('enum_compliance_status', ['compliant', 'non_compliant', 'partially_compliant', 'not_assessed']);
const controlStatusEnum = pgEnum('enum_control_status', ['implemented', 'partially_implemented', 'not_implemented', 'not_applicable']);
const assessmentStatusEnum = pgEnum('enum_assessment_status', ['pending', 'in_progress', 'completed', 'failed', 'cancelled']);

// Role Module Permissions table
const roleModulePermissions = pgTable('role_module_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  moduleId: integer('module_id').notNull(), // References app_modules.id
  canView: boolean('can_view').default(false).notNull(),
  canCreate: boolean('can_create').default(false).notNull(),
  canEdit: boolean('can_edit').default(false).notNull(),
  canDelete: boolean('can_delete').default(false).notNull(),
  canAdmin: boolean('can_admin').default(false).notNull(),
  canExport: boolean('can_export').default(false).notNull(),
  canImport: boolean('can_import').default(false).notNull(),
  restrictions: jsonb('restrictions').default('{}'), // Additional restrictions
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  roleModuleUnique: unique('unique_role_module').on(table.roleId, table.moduleId),
  roleIdx: index('idx_role_module_permissions_role').on(table.roleId),
  moduleIdx: index('idx_role_module_permissions_module').on(table.moduleId),
  viewIdx: index('idx_role_module_permissions_view').on(table.canView),
  adminIdx: index('idx_role_module_permissions_admin').on(table.canAdmin),
}));

// Role Navigation Permissions table
const roleNavigationPermissions = pgTable('role_navigation_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  navigationId: integer('navigation_id').notNull(), // References module_navigation.id
  canAccess: boolean('can_access').default(false).notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),
  conditions: jsonb('conditions').default('{}'), // Conditional access rules
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  roleNavUnique: unique('unique_role_navigation').on(table.roleId, table.navigationId),
  roleIdx: index('idx_role_navigation_permissions_role').on(table.roleId),
  navigationIdx: index('idx_role_navigation_permissions_navigation').on(table.navigationId),
  accessIdx: index('idx_role_navigation_permissions_access').on(table.canAccess),
  visibleIdx: index('idx_role_navigation_permissions_visible').on(table.isVisible),
}));

// SSP Controls table (System Security Plan Controls)
const sspControls = pgTable('ssp_controls', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').notNull(), // References systems.id
  controlId: varchar('control_id', { length: 50 }).notNull(), // e.g., 'AC-1', 'AU-2'
  controlFamily: varchar('control_family', { length: 50 }).notNull(),
  controlName: varchar('control_name', { length: 255 }).notNull(),
  controlDescription: text('control_description'),
  implementationStatus: controlStatusEnum('implementation_status').default('not_implemented'),
  implementationDescription: text('implementation_description'),
  responsibleRole: varchar('responsible_role', { length: 100 }),
  implementationGuidance: text('implementation_guidance'),
  assessmentProcedures: text('assessment_procedures'),
  parameters: jsonb('parameters').default('{}'),
  supplementalGuidance: text('supplemental_guidance'),
  controlEnhancements: text('control_enhancements').array(),
  relatedControls: text('related_controls').array(),
  lastAssessed: timestamp('last_assessed', { withTimezone: true }),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessedBy: integer('assessed_by').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  systemControlUnique: unique('unique_system_control').on(table.systemId, table.controlId),
  systemIdx: index('idx_ssp_controls_system').on(table.systemId),
  controlIdIdx: index('idx_ssp_controls_control_id').on(table.controlId),
  controlFamilyIdx: index('idx_ssp_controls_family').on(table.controlFamily),
  implementationStatusIdx: index('idx_ssp_controls_implementation_status').on(table.implementationStatus),
  lastAssessedIdx: index('idx_ssp_controls_last_assessed').on(table.lastAssessed),
  nextAssessmentIdx: index('idx_ssp_controls_next_assessment').on(table.nextAssessment),
}));

// SSP POAM Mappings table (System Security Plan - Plan of Action & Milestones)
const sspPoamMappings = pgTable('ssp_poam_mappings', {
  id: serial('id').primaryKey(),
  sspControlId: integer('ssp_control_id').references(() => sspControls.id, { onDelete: 'cascade' }).notNull(),
  poamId: integer('poam_id').notNull(), // References poams.id
  mappingType: varchar('mapping_type', { length: 50 }).default('remediation'), // 'remediation', 'enhancement', 'monitoring'
  description: text('description'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sspPoamUnique: unique('unique_ssp_poam').on(table.sspControlId, table.poamId),
  sspControlIdx: index('idx_ssp_poam_mappings_ssp_control').on(table.sspControlId),
  poamIdx: index('idx_ssp_poam_mappings_poam').on(table.poamId),
  mappingTypeIdx: index('idx_ssp_poam_mappings_type').on(table.mappingType),
  priorityIdx: index('idx_ssp_poam_mappings_priority').on(table.priority),
}));

// Compliance Controls table
const complianceControls = pgTable('compliance_controls', {
  id: serial('id').primaryKey(),
  frameworkId: integer('framework_id').notNull(), // References compliance_frameworks.id
  controlId: varchar('control_id', { length: 100 }).notNull(),
  controlName: varchar('control_name', { length: 255 }).notNull(),
  controlDescription: text('control_description'),
  controlObjective: text('control_objective'),
  controlType: varchar('control_type', { length: 50 }), // 'preventive', 'detective', 'corrective'
  controlCategory: varchar('control_category', { length: 100 }),
  riskLevel: varchar('risk_level', { length: 20 }),
  testingFrequency: varchar('testing_frequency', { length: 50 }),
  testingProcedure: text('testing_procedure'),
  evidenceRequirements: text('evidence_requirements').array(),
  automationLevel: varchar('automation_level', { length: 50 }), // 'manual', 'semi_automated', 'automated'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  frameworkControlUnique: unique('unique_framework_control').on(table.frameworkId, table.controlId),
  frameworkIdx: index('idx_compliance_controls_framework').on(table.frameworkId),
  controlIdIdx: index('idx_compliance_controls_control_id').on(table.controlId),
  controlTypeIdx: index('idx_compliance_controls_type').on(table.controlType),
  controlCategoryIdx: index('idx_compliance_controls_category').on(table.controlCategory),
  riskLevelIdx: index('idx_compliance_controls_risk_level').on(table.riskLevel),
  activeIdx: index('idx_compliance_controls_active').on(table.isActive),
}));

// Compliance Frameworks table
const complianceFrameworks = pgTable('compliance_frameworks', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  shortName: varchar('short_name', { length: 50 }).notNull().unique(),
  description: text('description'),
  version: varchar('version', { length: 20 }),
  publisher: varchar('publisher', { length: 255 }),
  publicationDate: timestamp('publication_date', { withTimezone: true }),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  scope: text('scope'),
  applicability: text('applicability'),
  requirements: jsonb('requirements').default('{}'),
  controlFamilies: text('control_families').array(),
  isActive: boolean('is_active').default(true),
  isMandatory: boolean('is_mandatory').default(false),
  documentUrl: varchar('document_url', { length: 500 }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_compliance_frameworks_name').on(table.name),
  shortNameIdx: index('idx_compliance_frameworks_short_name').on(table.shortName),
  activeIdx: index('idx_compliance_frameworks_active').on(table.isActive),
  mandatoryIdx: index('idx_compliance_frameworks_mandatory').on(table.isMandatory),
  effectiveDateIdx: index('idx_compliance_frameworks_effective_date').on(table.effectiveDate),
}));

// Control Compliance Status table
const controlComplianceStatus = pgTable('control_compliance_status', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').notNull(), // References systems.id
  complianceControlId: integer('compliance_control_id').references(() => complianceControls.id).notNull(),
  status: complianceStatusEnum('status').default('not_assessed'),
  compliancePercentage: integer('compliance_percentage'), // 0-100
  lastAssessmentDate: timestamp('last_assessment_date', { withTimezone: true }),
  nextAssessmentDate: timestamp('next_assessment_date', { withTimezone: true }),
  assessmentMethod: varchar('assessment_method', { length: 100 }),
  findings: text('findings'),
  recommendations: text('recommendations'),
  evidenceProvided: text('evidence_provided').array(),
  assessedBy: integer('assessed_by').references(() => users.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  remediation: text('remediation'),
  remediationDueDate: timestamp('remediation_due_date', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  systemControlUnique: unique('unique_system_compliance_control').on(table.systemId, table.complianceControlId),
  systemIdx: index('idx_control_compliance_status_system').on(table.systemId),
  complianceControlIdx: index('idx_control_compliance_status_control').on(table.complianceControlId),
  statusIdx: index('idx_control_compliance_status_status').on(table.status),
  lastAssessmentIdx: index('idx_control_compliance_status_last_assessment').on(table.lastAssessmentDate),
  nextAssessmentIdx: index('idx_control_compliance_status_next_assessment').on(table.nextAssessmentDate),
  remediationDueDateIdx: index('idx_control_compliance_status_remediation_due').on(table.remediationDueDate),
}));

module.exports = {
  roleModulePermissions,
  roleNavigationPermissions,
  sspControls,
  sspPoamMappings,
  complianceControls,
  complianceFrameworks,
  controlComplianceStatus,
  // Export enums
  complianceStatusEnum,
  controlStatusEnum,
  assessmentStatusEnum,
};
