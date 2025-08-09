const { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean, pgEnum } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for reports
const reportTypeEnum = pgEnum('enum_reports_type', [
  'dashboard',
  'metrics',
  'analytics',
  'compliance',
  'audit',
  'security',
  'asset',
  'vulnerability',
  'policy',
  'procedure',
  'user_activity',
  'system_performance',
  'financial',
  'operational',
  'custom'
]);

const reportStatusEnum = pgEnum('enum_reports_status', [
  'draft',
  'generating',
  'completed',
  'failed',
  'scheduled',
  'cancelled',
  'expired'
]);

const reportFormatEnum = pgEnum('enum_reports_format', [
  'pdf',
  'excel',
  'csv',
  'json',
  'html',
  'word',
  'powerpoint'
]);

const scheduleFrequencyEnum = pgEnum('enum_schedule_frequency', [
  'once',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom'
]);

// Report Templates table
const reportTemplates = pgTable('report_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  module: varchar('module', { length: 50 }).notNull(),
  templateData: jsonb('template_data').default('{}').notNull(),
  isSystem: boolean('is_system').default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Report Configurations table
const reportConfigurations = pgTable('report_configurations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  templateId: integer('template_id').notNull().references(() => reportTemplates.id),
  parameters: jsonb('parameters').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Report Schedules table
const reportSchedules = pgTable('report_schedules', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  configurationId: integer('configuration_id').notNull().references(() => reportConfigurations.id),
  frequency: scheduleFrequencyEnum('frequency').notNull(),
  cronExpression: varchar('cron_expression', { length: 100 }), // For custom schedules
  nextRun: timestamp('next_run', { withTimezone: true }),
  lastRun: timestamp('last_run', { withTimezone: true }),
  recipients: jsonb('recipients').default('[]'),
  deliveryMethod: varchar('delivery_method', { length: 50 }).default('email'), // email, download, api
  active: boolean('active').default(true),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Reports table (main reports)
const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: reportTypeEnum('type').notNull(),
  status: reportStatusEnum('status').default('draft').notNull(),
  format: reportFormatEnum('format').default('pdf'),
  parameters: jsonb('parameters').default('{}'),
  filePath: varchar('file_path', { length: 255 }),
  fileSize: integer('file_size'),
  generatedAt: timestamp('generated_at', { withTimezone: true }),
  generatedBy: integer('generated_by').references(() => users.id),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  isRecurring: boolean('is_recurring').default(false),
  recurringSchedule: varchar('recurring_schedule', { length: 255 }),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  templateId: integer('template_id').references(() => reportTemplates.id),
  configurationId: integer('configuration_id').references(() => reportConfigurations.id),
  scheduleId: integer('schedule_id').references(() => reportSchedules.id),
  downloadCount: integer('download_count').default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Report Executions table (for tracking execution history)
const reportExecutions = pgTable('report_executions', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').references(() => reports.id),
  scheduleId: integer('schedule_id').references(() => reportSchedules.id),
  status: reportStatusEnum('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // in milliseconds
  recordCount: integer('record_count'),
  fileSize: integer('file_size'),
  errorMessage: text('error_message'),
  executedBy: integer('executed_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Report Shares table (for sharing reports with users/groups)
const reportShares = pgTable('report_shares', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').notNull().references(() => reports.id),
  sharedWith: integer('shared_with').references(() => users.id), // null for public shares
  sharedBy: integer('shared_by').notNull().references(() => users.id),
  accessLevel: varchar('access_level', { length: 20 }).default('view'), // view, download, edit
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  accessCount: integer('access_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  shareToken: varchar('share_token', { length: 100 }), // for public shares
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Report Subscriptions table (for users to subscribe to reports)
const reportSubscriptions = pgTable('report_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  reportId: integer('report_id').references(() => reports.id),
  scheduleId: integer('schedule_id').references(() => reportSchedules.id),
  deliveryMethod: varchar('delivery_method', { length: 50 }).default('email'),
  deliveryAddress: varchar('delivery_address', { length: 255 }), // email address, webhook URL, etc.
  isActive: boolean('is_active').default(true),
  lastDeliveredAt: timestamp('last_delivered_at', { withTimezone: true }),
  deliveryCount: integer('delivery_count').default(0),
  preferences: jsonb('preferences').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Report Analytics table (for tracking report usage and performance)
const reportAnalytics = pgTable('report_analytics', {
  id: serial('id').primaryKey(),
  reportId: integer('report_id').references(() => reports.id),
  templateId: integer('template_id').references(() => reportTemplates.id),
  date: timestamp('date', { withTimezone: true }).notNull(),
  generationCount: integer('generation_count').default(0),
  downloadCount: integer('download_count').default(0),
  shareCount: integer('share_count').default(0),
  viewCount: integer('view_count').default(0),
  averageGenerationTime: integer('average_generation_time'), // in milliseconds
  totalFileSize: integer('total_file_size'), // in bytes
  errorCount: integer('error_count').default(0),
  uniqueUsers: integer('unique_users').default(0),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  reportTemplates,
  reportConfigurations,
  reportSchedules,
  reports,
  reportExecutions,
  reportShares,
  reportSubscriptions,
  reportAnalytics,
  // Export enums
  reportTypeEnum,
  reportStatusEnum,
  reportFormatEnum,
  scheduleFrequencyEnum,
};
