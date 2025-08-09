const { pgTable, serial, varchar, text, timestamp, integer, jsonb, pgEnum } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for policies
const policyStatusEnum = pgEnum('enum_policies_status', [
  'draft', 
  'under_review', 
  'approved', 
  'published', 
  'archived', 
  'expired'
]);

const policyTypeEnum = pgEnum('enum_policies_policy_type', [
  'security',
  'privacy',
  'compliance',
  'operational',
  'hr',
  'financial',
  'it',
  'risk_management',
  'business_continuity',
  'data_governance',
  'vendor_management',
  'incident_response',
  'access_control',
  'change_management',
  'asset_management',
  'other'
]);

// Define enums for procedures
const procedureStatusEnum = pgEnum('enum_procedures_status', [
  'draft',
  'under_review',
  'approved',
  'published',
  'archived',
  'expired'
]);

const procedureTypeEnum = pgEnum('enum_procedures_procedure_type', [
  'standard_operating_procedure',
  'work_instruction',
  'process_flow',
  'checklist',
  'guideline',
  'emergency_procedure',
  'maintenance_procedure',
  'security_procedure',
  'compliance_procedure',
  'training_procedure',
  'audit_procedure',
  'incident_response_procedure',
  'other'
]);

// Define enums for policy procedures
const policyProcedureStatusEnum = pgEnum('enum_policy_procedures_status', [
  'draft',
  'approved',
  'published',
  'archived'
]);

// Define enums for workflows
const workflowTypeEnum = pgEnum('enum_policy_workflows_workflow_type', [
  'policy_creation',
  'policy_review',
  'policy_approval',
  'policy_update',
  'procedure_creation',
  'procedure_review',
  'procedure_approval',
  'procedure_update',
  'compliance_review',
  'audit_preparation',
  'training_development',
  'other'
]);

const workflowStatusEnum = pgEnum('enum_policy_workflows_status', [
  'Not Started',
  'In Progress',
  'Under Review',
  'Approved',
  'Completed',
  'On Hold',
  'Cancelled'
]);

// Policies table
const policies = pgTable('policies', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  policyType: policyTypeEnum('policy_type').notNull(),
  status: policyStatusEnum('status').default('draft'),
  version: varchar('version', { length: 20 }).default('1.0'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  reviewDate: timestamp('review_date', { withTimezone: true }),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  content: text('content'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Procedures table
const procedures = pgTable('procedures', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  procedureType: procedureTypeEnum('procedure_type').notNull(),
  relatedPolicyId: integer('related_policy_id').references(() => policies.id),
  status: procedureStatusEnum('status').default('draft'),
  version: varchar('version', { length: 20 }).default('1.0'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  reviewDate: timestamp('review_date', { withTimezone: true }),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  steps: jsonb('steps').default('{}'),
  resources: jsonb('resources').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  content: text('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Policy procedures (linking table with additional fields)
const policyProcedures = pgTable('policy_procedures', {
  id: serial('id').primaryKey(),
  policyId: integer('policy_id').notNull().references(() => policies.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  steps: text('steps').array().default([]),
  version: varchar('version', { length: 255 }),
  status: policyProcedureStatusEnum('status').default('draft').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Policy workflows
const policyWorkflows = pgTable('policy_workflows', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  workflowType: workflowTypeEnum('workflow_type').notNull(),
  status: workflowStatusEnum('status').default('In Progress').notNull(),
  assignedTo: integer('assigned_to').references(() => users.id),
  dueDate: timestamp('due_date', { withTimezone: true }),
  stage: varchar('stage', { length: 255 }),
  progress: integer('progress').default(0).notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Policy workflow history
const policyWorkflowHistory = pgTable('policy_workflow_history', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').notNull().references(() => policyWorkflows.id),
  action: varchar('action', { length: 255 }).notNull(),
  details: text('details'),
  performedBy: integer('performed_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Policy workflow policies (linking table)
const policyWorkflowPolicies = pgTable('policy_workflow_policies', {
  id: serial('id').primaryKey(),
  workflowId: integer('workflow_id').notNull().references(() => policyWorkflows.id),
  policyId: integer('policy_id').notNull().references(() => policies.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  policies,
  procedures,
  policyProcedures,
  policyWorkflows,
  policyWorkflowHistory,
  policyWorkflowPolicies,
  // Export enums
  policyStatusEnum,
  policyTypeEnum,
  procedureStatusEnum,
  procedureTypeEnum,
  policyProcedureStatusEnum,
  workflowTypeEnum,
  workflowStatusEnum,
};
