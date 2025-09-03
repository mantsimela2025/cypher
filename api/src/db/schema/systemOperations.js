const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for system operations
const backupTypeEnum = pgEnum('enum_backup_type', ['full', 'incremental', 'differential']);
const backupStatusEnum = pgEnum('enum_backup_status', ['pending', 'running', 'completed', 'failed', 'cancelled']);
const batchStatusEnum = pgEnum('enum_batch_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
const deploymentStatusEnum = pgEnum('enum_deployment_status', ['pending', 'deploying', 'completed', 'failed', 'rolled_back']);
const deploymentTypeEnum = pgEnum('enum_deployment_type', ['full', 'hotfix', 'rollback', 'patch']);

// Backup Jobs table
const backupJobs = pgTable('backup_jobs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  backupType: backupTypeEnum('backup_type').notNull(),
  schedule: varchar('schedule', { length: 255 }).notNull(), // cron expression
  targetPath: varchar('target_path', { length: 500 }).notNull(),
  sourcePaths: text('source_paths').array().notNull(),
  compressionType: varchar('compression_type', { length: 20 }).default('gzip'),
  encryptionEnabled: boolean('encryption_enabled').default(false),
  retentionDays: integer('retention_days').default(30),
  isActive: boolean('is_active').default(true).notNull(),
  lastRun: timestamp('last_run', { withTimezone: true }),
  nextRun: timestamp('next_run', { withTimezone: true }),
  lastStatus: backupStatusEnum('last_status'),
  lastDuration: integer('last_duration'), // seconds
  lastSize: integer('last_size'), // bytes
  runCount: integer('run_count').default(0),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  configuration: jsonb('configuration').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_backup_jobs_name').on(table.name),
  typeIdx: index('idx_backup_jobs_type').on(table.backupType),
  activeIdx: index('idx_backup_jobs_active').on(table.isActive),
  nextRunIdx: index('idx_backup_jobs_next_run').on(table.nextRun),
  statusIdx: index('idx_backup_jobs_status').on(table.lastStatus),
}));

// Batches table - for data processing batches
const batches = pgTable('batches', {
  id: serial('id').primaryKey(),
  batchId: varchar('batch_id', { length: 100 }).notNull().unique(),
  sourceSystem: varchar('source_system', { length: 50 }).notNull(),
  dataType: varchar('data_type', { length: 50 }).notNull(),
  status: batchStatusEnum('status').default('pending').notNull(),
  totalRecords: integer('total_records').default(0),
  processedRecords: integer('processed_records').default(0),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  processingTime: integer('processing_time'), // seconds
  configuration: jsonb('configuration').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  errorSummary: text('error_summary'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  batchIdIdx: index('idx_batches_batch_id').on(table.batchId),
  sourceSystemIdx: index('idx_batches_source_system').on(table.sourceSystem),
  statusIdx: index('idx_batches_status').on(table.status),
  dataTypeIdx: index('idx_batches_data_type').on(table.dataType),
  createdAtIdx: index('idx_batches_created_at').on(table.createdAt),
  sourceDataIdx: index('idx_batches_source_data').on(table.sourceSystem, table.dataType),
}));

// Deployments table
const deployments = pgTable('deployments', {
  id: serial('id').primaryKey(),
  version: varchar('version', { length: 50 }).notNull(),
  environment: varchar('environment', { length: 50 }).notNull(),
  status: deploymentStatusEnum('status').default('pending').notNull(),
  deploymentType: deploymentTypeEnum('deployment_type').notNull(),
  branch: varchar('branch', { length: 100 }),
  commitHash: varchar('commit_hash', { length: 40 }),
  commitMessage: text('commit_message'),
  releaseNotes: text('release_notes'),
  configuration: jsonb('configuration').default('{}'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // seconds
  deployedBy: integer('deployed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  rollbackDeploymentId: integer('rollback_deployment_id').references(() => deployments.id),
  logs: text('logs'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  versionIdx: index('idx_deployments_version').on(table.version),
  environmentIdx: index('idx_deployments_environment').on(table.environment),
  statusIdx: index('idx_deployments_status').on(table.status),
  deploymentTypeIdx: index('idx_deployments_deployment_type').on(table.deploymentType),
  deployedByIdx: index('idx_deployments_deployed_by').on(table.deployedBy),
  startedAtIdx: index('idx_deployments_started_at').on(table.startedAt),
  envVersionIdx: index('idx_deployments_env_version').on(table.environment, table.version),
}));

// Schedules table - for scheduling various operations
const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  jobType: varchar('job_type', { length: 50 }).notNull(), // 'backup', 'scan', 'report', 'sync', etc.
  cronExpression: varchar('cron_expression', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastRun: timestamp('last_run', { withTimezone: true }),
  nextRun: timestamp('next_run', { withTimezone: true }),
  runCount: integer('run_count').default(0).notNull(),
  successCount: integer('success_count').default(0).notNull(),
  failureCount: integer('failure_count').default(0).notNull(),
  configuration: jsonb('configuration').default('{}'),
  timeout: integer('timeout').default(3600), // seconds
  retryCount: integer('retry_count').default(3),
  retryDelay: integer('retry_delay').default(60), // seconds
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_schedules_name').on(table.name),
  jobTypeIdx: index('idx_schedules_job_type').on(table.jobType),
  activeIdx: index('idx_schedules_active').on(table.isActive),
  nextRunIdx: index('idx_schedules_next_run').on(table.nextRun),
  cronIdx: index('idx_schedules_cron').on(table.cronExpression),
}));

// Job Executions table - for tracking scheduled job executions
const jobExecutions = pgTable('job_executions', {
  id: serial('id').primaryKey(),
  scheduleId: integer('schedule_id').references(() => schedules.id),
  batchId: varchar('batch_id', { length: 100 }),
  jobType: varchar('job_type', { length: 50 }).notNull(),
  jobName: varchar('job_name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // seconds
  recordsProcessed: integer('records_processed').default(0),
  recordsSuccessful: integer('records_successful').default(0),
  recordsFailed: integer('records_failed').default(0),
  configuration: jsonb('configuration').default('{}'),
  result: jsonb('result').default('{}'),
  errorMessage: text('error_message'),
  logs: text('logs'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  scheduleIdIdx: index('idx_job_executions_schedule_id').on(table.scheduleId),
  batchIdIdx: index('idx_job_executions_batch_id').on(table.batchId),
  jobTypeIdx: index('idx_job_executions_job_type').on(table.jobType),
  statusIdx: index('idx_job_executions_status').on(table.status),
  startedAtIdx: index('idx_job_executions_started_at').on(table.startedAt),
  completedAtIdx: index('idx_job_executions_completed_at').on(table.completedAt),
  nextRetryIdx: index('idx_job_executions_next_retry').on(table.nextRetryAt),
}));

module.exports = {
  backupJobs,
  batches,
  deployments,
  schedules,
  jobExecutions,
  // Export enums for use in other files
  backupTypeEnum,
  backupStatusEnum,
  batchStatusEnum,
  deploymentStatusEnum,
  deploymentTypeEnum,
};
