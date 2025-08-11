const { pgTable, serial, varchar, text, timestamp, boolean, integer, uuid, pgEnum, decimal, jsonb, index } = require('drizzle-orm/pg-core');
const { patches } = require('./patches');
const { patchJobs } = require('./patchJobs');
const { patchSchedules } = require('./patchSchedules');
const { users } = require('./users');

// Enums for patch approval workflow
const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'expired',
  'delegated'
]);

const approvalTypeEnum = pgEnum('approval_type', [
  'patch_deployment',
  'emergency_patch',
  'rollback',
  'schedule_change',
  'bulk_operation'
]);

const approvalLevelEnum = pgEnum('approval_level', [
  'l1_technical',
  'l2_management', 
  'l3_executive',
  'security_review',
  'change_board'
]);

const delegationReasonEnum = pgEnum('delegation_reason', [
  'out_of_office',
  'conflict_of_interest',
  'insufficient_expertise',
  'workload_management'
]);

// Main patch approvals table - manages approval workflows
const patchApprovals = pgTable('patch_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Request details
  approvalType: approvalTypeEnum('approval_type').notNull(),
  status: approvalStatusEnum('status').default('pending').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // low, normal, high, critical
  
  // Related entities
  patchId: uuid('patch_id').references(() => patches.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => patchJobs.id, { onDelete: 'cascade' }),
  scheduleId: uuid('schedule_id').references(() => patchSchedules.id, { onDelete: 'cascade' }),
  
  // Request information
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description').notNull(),
  justification: text('justification').notNull(),
  businessImpact: text('business_impact'),
  technicalDetails: text('technical_details'),
  riskAssessment: text('risk_assessment'),
  rollbackPlan: text('rollback_plan'),
  
  // Approval requirements
  requiredApprovalLevel: approvalLevelEnum('required_approval_level').notNull(),
  requiresUnanimous: boolean('requires_unanimous').default(false),
  minimumApprovers: integer('minimum_approvers').default(1),
  
  // Timing
  requestedExecutionTime: timestamp('requested_execution_time'),
  approvalDeadline: timestamp('approval_deadline'),
  emergencyOverride: boolean('emergency_override').default(false),
  
  // Affected scope
  affectedAssets: text('affected_assets'), // JSON array of asset UUIDs
  affectedServices: text('affected_services'), // JSON array of service names
  estimatedDowntime: integer('estimated_downtime'), // Minutes
  maintenanceWindow: jsonb('maintenance_window'),
  
  // Final decision
  finalDecision: approvalStatusEnum('final_decision'),
  finalDecisionBy: uuid('final_decision_by').references(() => users.id),
  finalDecisionAt: timestamp('final_decision_at'),
  finalDecisionNotes: text('final_decision_notes'),
  
  // Auto-approval rules
  autoApprovalRuleId: varchar('auto_approval_rule_id', { length: 100 }),
  autoApprovedAt: timestamp('auto_approved_at'),
  
  // Audit trail
  requestedBy: uuid('requested_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index('idx_patch_approvals_status').on(table.status),
    typeIdx: index('idx_patch_approvals_type').on(table.approvalType),
    requestedByIdx: index('idx_patch_approvals_requested_by').on(table.requestedBy),
    deadlineIdx: index('idx_patch_approvals_deadline').on(table.approvalDeadline),
    patchIdIdx: index('idx_patch_approvals_patch_id').on(table.patchId),
  };
});

// Individual approver responses
const approvalResponses = pgTable('approval_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  approvalId: uuid('approval_id').references(() => patchApprovals.id, { onDelete: 'cascade' }).notNull(),
  approverId: uuid('approver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  approvalLevel: approvalLevelEnum('approval_level').notNull(),
  
  // Response
  response: approvalStatusEnum('response').notNull(), // approved, rejected, delegated
  responseDate: timestamp('response_date').notNull(),
  comments: text('comments'),
  conditions: text('conditions'), // Any conditions attached to approval
  
  // Delegation
  delegatedTo: uuid('delegated_to').references(() => users.id),
  delegationReason: delegationReasonEnum('delegation_reason'),
  delegationNotes: text('delegation_notes'),
  
  // Metadata
  responseMethod: varchar('response_method', { length: 50 }).default('manual'), // manual, auto, api
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    approvalApproverIdx: index('idx_approval_responses_approval_approver').on(table.approvalId, table.approverId),
    approverIdx: index('idx_approval_responses_approver').on(table.approverId),
    responseDateIdx: index('idx_approval_responses_date').on(table.responseDate),
  };
});

// Approval workflow templates - define standard approval processes
const approvalWorkflows = pgTable('approval_workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  approvalType: approvalTypeEnum('approval_type').notNull(),
  
  // Workflow configuration
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  requiredLevels: text('required_levels'), // JSON array of approval levels
  minimumApproversPerLevel: jsonb('minimum_approvers_per_level'),
  requiresUnanimous: boolean('requires_unanimous').default(false),
  
  // Auto-approval conditions
  autoApprovalEnabled: boolean('auto_approval_enabled').default(false),
  autoApprovalCriteria: jsonb('auto_approval_criteria'),
  
  // Timing
  defaultDeadlineHours: integer('default_deadline_hours').default(24),
  escalationTimeoutHours: integer('escalation_timeout_hours').default(4),
  
  // Notification settings
  notifyOnSubmission: boolean('notify_on_submission').default(true),
  notifyOnApproval: boolean('notify_on_approval').default(true),
  notifyOnRejection: boolean('notify_on_rejection').default(true),
  reminderIntervalHours: integer('reminder_interval_hours').default(4),
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflow approvers - defines who can approve at each level
const workflowApprovers = pgTable('workflow_approvers', {
  id: serial('id').primaryKey(),
  workflowId: uuid('workflow_id').references(() => approvalWorkflows.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  approvalLevel: approvalLevelEnum('approval_level').notNull(),
  
  // Approver settings
  isBackup: boolean('is_backup').default(false),
  isPrimary: boolean('is_primary').default(false),
  maxConcurrentApprovals: integer('max_concurrent_approvals').default(10),
  
  // Availability
  isActive: boolean('is_active').default(true),
  outOfOfficeStart: timestamp('out_of_office_start'),
  outOfOfficeEnd: timestamp('out_of_office_end'),
  backupApproverId: uuid('backup_approver_id').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Approval notifications - track notification history
const approvalNotifications = pgTable('approval_notifications', {
  id: serial('id').primaryKey(),
  approvalId: uuid('approval_id').references(() => patchApprovals.id, { onDelete: 'cascade' }).notNull(),
  recipientId: uuid('recipient_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  notificationType: varchar('notification_type', { length: 50 }).notNull(), // request, reminder, approved, rejected
  subject: varchar('subject', { length: 500 }),
  message: text('message'),
  
  status: varchar('status', { length: 50 }).notNull(), // pending, sent, failed, read
  sentAt: timestamp('sent_at'),
  readAt: timestamp('read_at'),
  errorMessage: text('error_message'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Approval audit log - comprehensive audit trail
const approvalAuditLog = pgTable('approval_audit_log', {
  id: serial('id').primaryKey(),
  approvalId: uuid('approval_id').references(() => patchApprovals.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id),
  
  action: varchar('action', { length: 100 }).notNull(), // created, approved, rejected, delegated, cancelled, escalated
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  details: text('details'),
  
  // Context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  sessionId: varchar('session_id', { length: 100 }),
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    approvalActionIdx: index('idx_approval_audit_approval_action').on(table.approvalId, table.action),
    timestampIdx: index('idx_approval_audit_timestamp').on(table.timestamp),
    userActionIdx: index('idx_approval_audit_user_action').on(table.userId, table.action),
  };
});

module.exports = {
  patchApprovals,
  approvalResponses,
  approvalWorkflows,
  workflowApprovers,
  approvalNotifications,
  approvalAuditLog,
  approvalStatusEnum,
  approvalTypeEnum,
  approvalLevelEnum,
  delegationReasonEnum,
};