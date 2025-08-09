const { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  pgEnum,
  index,
  unique
} = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for authorizations_to_operate table
const atoTypeEnum = pgEnum('enum_authorizations_to_operate_type', [
  'full',
  'interim',
  'provisional',
  'conditional'
]);

const atoStatusEnum = pgEnum('enum_authorizations_to_operate_status', [
  'draft',
  'submitted',
  'under_review',
  'pending_approval',
  'approved',
  'rejected',
  'expired',
  'revoked'
]);

// Define enums for ato_workflow_history table
const atoWorkflowApprovalRoleEnum = pgEnum('enum_ato_workflow_history_approval_role', [
  'system_owner',
  'authorizing_official',
  'security_officer',
  'privacy_officer',
  'risk_executive',
  'cio',
  'ciso',
  'reviewer',
  'approver'
]);

const atoWorkflowStageEnum = pgEnum('enum_ato_workflow_history_workflow_stage', [
  'initial_submission',
  'security_review',
  'privacy_review',
  'risk_assessment',
  'technical_review',
  'management_review',
  'final_approval',
  'continuous_monitoring',
  'reauthorization'
]);

// Authorizations to Operate table
const authorizationsToOperate = pgTable('authorizations_to_operate', {
  id: serial('id').primaryKey(),
  sspId: integer('ssp_id').notNull(), // References system security plan
  type: atoTypeEnum('type').default('full').notNull(),
  status: atoStatusEnum('status').default('draft').notNull(),
  submissionDate: timestamp('submission_date', { withTimezone: true }),
  approvalDate: timestamp('approval_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  authorizedBy: integer('authorized_by').references(() => users.id),
  authorizationMemo: text('authorization_memo'),
  authorizationConditions: text('authorization_conditions'),
  riskLevel: varchar('risk_level', { length: 50 }),
  continuousMonitoringPlan: text('continuous_monitoring_plan'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    // Indexes for performance optimization
    sspIdIdx: index('idx_authorizations_to_operate_ssp_id').on(table.sspId),
    statusIdx: index('idx_authorizations_to_operate_status').on(table.status),
    typeIdx: index('idx_authorizations_to_operate_type').on(table.type),
    authorizedByIdx: index('idx_authorizations_to_operate_authorized_by').on(table.authorizedBy),
    submissionDateIdx: index('idx_authorizations_to_operate_submission_date').on(table.submissionDate),
    approvalDateIdx: index('idx_authorizations_to_operate_approval_date').on(table.approvalDate),
    expirationDateIdx: index('idx_authorizations_to_operate_expiration_date').on(table.expirationDate),
    riskLevelIdx: index('idx_authorizations_to_operate_risk_level').on(table.riskLevel),
    createdAtIdx: index('idx_authorizations_to_operate_created_at').on(table.createdAt),
    // Composite indexes for common query patterns
    statusTypeIdx: index('idx_authorizations_to_operate_status_type').on(table.status, table.type),
    sspStatusIdx: index('idx_authorizations_to_operate_ssp_status').on(table.sspId, table.status),
    expirationStatusIdx: index('idx_authorizations_to_operate_expiration_status').on(table.expirationDate, table.status),
    // Unique constraint to ensure one active ATO per SSP
    sspActiveAtoUnique: unique('authorizations_to_operate_ssp_active_unique').on(table.sspId, table.status)
  };
});

// ATO Workflow History table
const atoWorkflowHistory = pgTable('ato_workflow_history', {
  id: serial('id').primaryKey(),
  atoId: integer('ato_id').notNull().references(() => authorizationsToOperate.id),
  action: varchar('action', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  comments: text('comments'),
  performedBy: integer('performed_by').notNull().references(() => users.id),
  performedAt: timestamp('performed_at', { withTimezone: true }).defaultNow().notNull(),
  approvalRole: atoWorkflowApprovalRoleEnum('approval_role'),
  workflowStage: atoWorkflowStageEnum('workflow_stage').default('initial_submission').notNull(),
  signature: text('signature')
}, (table) => {
  return {
    // Indexes for performance optimization
    atoIdIdx: index('idx_ato_workflow_history_ato_id').on(table.atoId),
    actionIdx: index('idx_ato_workflow_history_action').on(table.action),
    statusIdx: index('idx_ato_workflow_history_status').on(table.status),
    performedByIdx: index('idx_ato_workflow_history_performed_by').on(table.performedBy),
    performedAtIdx: index('idx_ato_workflow_history_performed_at').on(table.performedAt),
    approvalRoleIdx: index('idx_ato_workflow_history_approval_role').on(table.approvalRole),
    workflowStageIdx: index('idx_ato_workflow_history_workflow_stage').on(table.workflowStage),
    // Composite indexes for common query patterns
    atoActionIdx: index('idx_ato_workflow_history_ato_action').on(table.atoId, table.action),
    atoStageIdx: index('idx_ato_workflow_history_ato_stage').on(table.atoId, table.workflowStage),
    atoPerformedIdx: index('idx_ato_workflow_history_ato_performed').on(table.atoId, table.performedAt),
    stageStatusIdx: index('idx_ato_workflow_history_stage_status').on(table.workflowStage, table.status),
    roleActionIdx: index('idx_ato_workflow_history_role_action').on(table.approvalRole, table.action)
  };
});

// ATO Documents table
const atoDocuments = pgTable('ato_documents', {
  id: serial('id').primaryKey(),
  atoId: integer('ato_id').notNull().references(() => authorizationsToOperate.id),
  documentType: varchar('document_type', { length: 100 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileLocation: varchar('file_location', { length: 500 }).notNull(),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    // Indexes for performance optimization
    atoIdIdx: index('idx_ato_documents_ato_id').on(table.atoId),
    documentTypeIdx: index('idx_ato_documents_document_type').on(table.documentType),
    fileNameIdx: index('idx_ato_documents_file_name').on(table.fileName),
    uploadedByIdx: index('idx_ato_documents_uploaded_by').on(table.uploadedBy),
    uploadedAtIdx: index('idx_ato_documents_uploaded_at').on(table.uploadedAt),
    // Composite indexes for common query patterns
    atoDocumentTypeIdx: index('idx_ato_documents_ato_document_type').on(table.atoId, table.documentType),
    atoUploadedIdx: index('idx_ato_documents_ato_uploaded').on(table.atoId, table.uploadedAt),
    typeUploadedIdx: index('idx_ato_documents_type_uploaded').on(table.documentType, table.uploadedAt),
    // Unique constraint to prevent duplicate document types per ATO
    atoDocumentTypeUnique: unique('ato_documents_ato_document_type_unique').on(table.atoId, table.documentType, table.fileName)
  };
});

module.exports = {
  authorizationsToOperate,
  atoWorkflowHistory,
  atoDocuments,
  atoTypeEnum,
  atoStatusEnum,
  atoWorkflowApprovalRoleEnum,
  atoWorkflowStageEnum
};
