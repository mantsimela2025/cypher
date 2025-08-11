const { pgTable, serial, varchar, text, timestamp, boolean, integer, uuid, pgEnum, decimal, jsonb, index } = require('drizzle-orm/pg-core');
const { patches } = require('./patches');
const { users } = require('./users');
const { patchJobs } = require('./patchJobs');

// Enums for patch scheduling
const scheduleStatusEnum = pgEnum('schedule_status', [
  'active',
  'paused',
  'disabled',
  'expired',
  'completed'
]);

const scheduleTypeEnum = pgEnum('schedule_type', [
  'immediate',
  'recurring',
  'one_time',
  'maintenance_window',
  'conditional'
]);

const recurrencePatternEnum = pgEnum('recurrence_pattern', [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom_cron'
]);

const maintenanceWindowTypeEnum = pgEnum('maintenance_window_type', [
  'planned',
  'emergency',
  'rolling',
  'blue_green'
]);

// Main patch schedules table - manages patch deployment scheduling
const patchSchedules = pgTable('patch_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Schedule configuration
  scheduleType: scheduleTypeEnum('schedule_type').notNull(),
  status: scheduleStatusEnum('status').default('active').notNull(),
  
  // Timing
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  nextRunTime: timestamp('next_run_time'),
  lastRunTime: timestamp('last_run_time'),
  
  // Recurrence settings
  recurrencePattern: recurrencePatternEnum('recurrence_pattern'),
  cronExpression: varchar('cron_expression', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  recurrenceInterval: integer('recurrence_interval').default(1),
  
  // Target configuration
  patchIds: text('patch_ids'), // JSON array of specific patch IDs
  patchCriteria: jsonb('patch_criteria'), // Dynamic patch selection criteria
  targetAssets: text('target_assets'), // JSON array of asset UUIDs
  targetGroups: text('target_groups'), // JSON array of asset group IDs
  targetFilter: jsonb('target_filter'), // Dynamic asset selection criteria
  
  // Execution settings
  autoApprove: boolean('auto_approve').default(false),
  requireApproval: boolean('require_approval').default(true),
  maxConcurrentJobs: integer('max_concurrent_jobs').default(1),
  continueOnError: boolean('continue_on_error').default(false),
  
  // Maintenance window settings
  maintenanceWindowType: maintenanceWindowTypeEnum('maintenance_window_type'),
  maintenanceWindowStart: varchar('maintenance_window_start', { length: 8 }), // HH:MM:SS format
  maintenanceWindowEnd: varchar('maintenance_window_end', { length: 8 }), // HH:MM:SS format
  maintenanceWindowDays: text('maintenance_window_days'), // JSON array of days [0-6]
  maxMaintenanceDuration: integer('max_maintenance_duration'), // Minutes
  
  // Rollback settings
  enableAutoRollback: boolean('enable_auto_rollback').default(false),
  rollbackThreshold: decimal('rollback_threshold', { precision: 5, scale: 2 }).default('10.00'), // Failure percentage
  rollbackDelayMinutes: integer('rollback_delay_minutes').default(60),
  
  // Notification settings
  notifyOnStart: boolean('notify_on_start').default(true),
  notifyOnComplete: boolean('notify_on_complete').default(true),
  notifyOnError: boolean('notify_on_error').default(true),
  notificationTargets: text('notification_targets'), // JSON array of user/group IDs
  
  // Execution statistics
  totalRuns: integer('total_runs').default(0),
  successfulRuns: integer('successful_runs').default(0),
  failedRuns: integer('failed_runs').default(0),
  averageRunDuration: integer('average_run_duration'), // Minutes
  lastExecutionSummary: jsonb('last_execution_summary'),
  
  // Metadata
  isTemplate: boolean('is_template').default(false),
  templateSource: uuid('template_source').references(() => patchSchedules.id),
  tags: text('tags'), // JSON array of tags
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index('idx_patch_schedules_status').on(table.status),
    nextRunIdx: index('idx_patch_schedules_next_run').on(table.nextRunTime),
    typeIdx: index('idx_patch_schedules_type').on(table.scheduleType),
    createdByIdx: index('idx_patch_schedules_created_by').on(table.createdBy),
    templateIdx: index('idx_patch_schedules_template').on(table.isTemplate),
  };
});

// Schedule execution history - tracks schedule runs
const scheduleExecutions = pgTable('schedule_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  scheduleId: uuid('schedule_id').references(() => patchSchedules.id, { onDelete: 'cascade' }).notNull(),
  executionTime: timestamp('execution_time').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // started, completed, failed, cancelled
  
  // Generated jobs
  totalJobs: integer('total_jobs').default(0),
  completedJobs: integer('completed_jobs').default(0),
  failedJobs: integer('failed_jobs').default(0),
  
  // Execution details
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // Minutes
  errorMessage: text('error_message'),
  executionSummary: jsonb('execution_summary'),
  
  // Generated job IDs for tracking
  generatedJobIds: text('generated_job_ids'), // JSON array of job UUIDs
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    scheduleExecIdx: index('idx_schedule_executions_schedule').on(table.scheduleId),
    executionTimeIdx: index('idx_schedule_executions_time').on(table.executionTime),
    statusIdx: index('idx_schedule_executions_status').on(table.status),
  };
});

// Schedule conditions - conditional scheduling rules
const scheduleConditions = pgTable('schedule_conditions', {
  id: serial('id').primaryKey(),
  scheduleId: uuid('schedule_id').references(() => patchSchedules.id, { onDelete: 'cascade' }).notNull(),
  conditionType: varchar('condition_type', { length: 50 }).notNull(), // vulnerability_severity, patch_age, compliance_deadline
  conditionOperator: varchar('condition_operator', { length: 20 }).notNull(), // equals, greater_than, less_than, contains
  conditionValue: varchar('condition_value', { length: 255 }).notNull(),
  isRequired: boolean('is_required').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schedule exclusions - blackout periods and exclusions
const scheduleExclusions = pgTable('schedule_exclusions', {
  id: serial('id').primaryKey(),
  scheduleId: uuid('schedule_id').references(() => patchSchedules.id, { onDelete: 'cascade' }).notNull(),
  exclusionType: varchar('exclusion_type', { length: 50 }).notNull(), // date_range, blackout_window, holiday, maintenance
  
  // Time-based exclusions
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  startTime: varchar('start_time', { length: 8 }), // HH:MM:SS
  endTime: varchar('end_time', { length: 8 }), // HH:MM:SS
  excludedDays: text('excluded_days'), // JSON array of days [0-6]
  
  // Asset-based exclusions
  excludedAssets: text('excluded_assets'), // JSON array of asset UUIDs
  excludedGroups: text('excluded_groups'), // JSON array of group IDs
  
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Schedule notifications - track notification history
const scheduleNotifications = pgTable('schedule_notifications', {
  id: serial('id').primaryKey(),
  scheduleId: uuid('schedule_id').references(() => patchSchedules.id, { onDelete: 'cascade' }).notNull(),
  executionId: uuid('execution_id').references(() => scheduleExecutions.id, { onDelete: 'cascade' }),
  notificationType: varchar('notification_type', { length: 50 }).notNull(), // start, complete, error, approval_needed
  recipient: varchar('recipient', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  message: text('message'),
  status: varchar('status', { length: 50 }).notNull(), // pending, sent, failed
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

module.exports = {
  patchSchedules,
  scheduleExecutions,
  scheduleConditions,
  scheduleExclusions,
  scheduleNotifications,
  scheduleStatusEnum,
  scheduleTypeEnum,
  recurrencePatternEnum,
  maintenanceWindowTypeEnum,
};