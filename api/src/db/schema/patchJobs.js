const { pgTable, serial, varchar, text, timestamp, boolean, integer, uuid, pgEnum, decimal, jsonb, index } = require('drizzle-orm/pg-core');
const { patches } = require('./patches');
const { assets } = require('./assets');
const { users } = require('./users');

// Enums for patch job management
const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'running',
  'paused',
  'completed',
  'failed',
  'cancelled',
  'timeout',
  'skipped'
]);

const jobTypeEnum = pgEnum('job_type', [
  'install',
  'uninstall',
  'scan',
  'validate',
  'rollback',
  'test'
]);

const executionModeEnum = pgEnum('execution_mode', [
  'immediate',
  'scheduled',
  'maintenance_window',
  'batch',
  'staged'
]);

const jobPriorityEnum = pgEnum('job_priority', [
  'low',
  'normal', 
  'high',
  'critical',
  'emergency'
]);

// Main patch jobs table - tracks patch execution jobs
const patchJobs = pgTable('patch_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobName: varchar('job_name', { length: 255 }).notNull(),
  description: text('description'),
  patchId: uuid('patch_id').references(() => patches.id, { onDelete: 'cascade' }),
  jobType: jobTypeEnum('job_type').notNull(),
  status: jobStatusEnum('status').default('queued').notNull(),
  priority: jobPriorityEnum('priority').default('normal').notNull(),
  executionMode: executionModeEnum('execution_mode').default('immediate').notNull(),
  
  // Scheduling
  scheduledStartTime: timestamp('scheduled_start_time'),
  actualStartTime: timestamp('actual_start_time'),
  completedTime: timestamp('completed_time'),
  estimatedDuration: integer('estimated_duration'), // Minutes
  actualDuration: integer('actual_duration'), // Minutes
  
  // Targeting
  targetAssets: text('target_assets'), // JSON array of asset UUIDs
  targetGroups: text('target_groups'), // JSON array of asset group IDs
  targetFilter: jsonb('target_filter'), // Dynamic filter criteria
  totalTargets: integer('total_targets').default(0),
  
  // Execution details
  executeParallel: boolean('execute_parallel').default(false),
  maxConcurrency: integer('max_concurrency').default(1),
  continueOnError: boolean('continue_on_error').default(false),
  requireApproval: boolean('require_approval').default(true),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  
  // Progress tracking
  completedTargets: integer('completed_targets').default(0),
  successfulTargets: integer('successful_targets').default(0),
  failedTargets: integer('failed_targets').default(0),
  skippedTargets: integer('skipped_targets').default(0),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2 }).default('0.00'),
  
  // Results
  exitCode: integer('exit_code'),
  errorMessage: text('error_message'),
  logOutput: text('log_output'),
  executionSummary: jsonb('execution_summary'),
  
  // Metadata
  parentJobId: uuid('parent_job_id').references(() => patchJobs.id),
  batchId: uuid('batch_id'), // Groups related jobs
  maintenanceWindowId: uuid('maintenance_window_id'),
  rollbackJobId: uuid('rollback_job_id').references(() => patchJobs.id),
  
  // Audit
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    statusIdx: index('idx_patch_jobs_status').on(table.status),
    scheduledStartIdx: index('idx_patch_jobs_scheduled_start').on(table.scheduledStartTime),
    patchIdIdx: index('idx_patch_jobs_patch_id').on(table.patchId),
    priorityIdx: index('idx_patch_jobs_priority').on(table.priority),
    createdByIdx: index('idx_patch_jobs_created_by').on(table.createdBy),
    batchIdIdx: index('idx_patch_jobs_batch_id').on(table.batchId),
  };
});

// Patch job targets - individual asset execution tracking
const patchJobTargets = pgTable('patch_job_targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').references(() => patchJobs.id, { onDelete: 'cascade' }).notNull(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }).notNull(),
  status: jobStatusEnum('status').default('queued').notNull(),
  
  // Execution timing
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  duration: integer('duration'), // Seconds
  
  // Results
  exitCode: integer('exit_code'),
  stdout: text('stdout'),
  stderr: text('stderr'),
  errorMessage: text('error_message'),
  
  // Pre-execution checks
  preChecksPassed: boolean('pre_checks_passed'),
  preCheckResults: jsonb('pre_check_results'),
  
  // Post-execution validation
  postValidationPassed: boolean('post_validation_passed'),
  postValidationResults: jsonb('post_validation_results'),
  
  // Retry logic
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  lastRetryAt: timestamp('last_retry_at'),
  
  // Metadata
  executorId: varchar('executor_id', { length: 100 }), // Agent/worker ID
  executorVersion: varchar('executor_version', { length: 50 }),
  rawResults: jsonb('raw_results'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    jobAssetIdx: index('idx_patch_job_targets_job_asset').on(table.jobId, table.assetUuid),
    statusIdx: index('idx_patch_job_targets_status').on(table.status),
    assetIdx: index('idx_patch_job_targets_asset').on(table.assetUuid),
  };
});

// Patch job logs - detailed execution logging
const patchJobLogs = pgTable('patch_job_logs', {
  id: serial('id').primaryKey(),
  jobId: uuid('job_id').references(() => patchJobs.id, { onDelete: 'cascade' }).notNull(),
  targetId: uuid('target_id').references(() => patchJobTargets.id, { onDelete: 'cascade' }),
  logLevel: varchar('log_level', { length: 20 }).notNull(), // DEBUG, INFO, WARN, ERROR
  message: text('message').notNull(),
  component: varchar('component', { length: 100 }), // scheduler, executor, validator, etc.
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    jobIdIdx: index('idx_patch_job_logs_job_id').on(table.jobId),
    timestampIdx: index('idx_patch_job_logs_timestamp').on(table.timestamp),
    logLevelIdx: index('idx_patch_job_logs_level').on(table.logLevel),
  };
});

// Patch job dependencies - tracks job execution order
const patchJobDependencies = pgTable('patch_job_dependencies', {
  id: serial('id').primaryKey(),
  jobId: uuid('job_id').references(() => patchJobs.id, { onDelete: 'cascade' }).notNull(),
  dependsOnJobId: uuid('depends_on_job_id').references(() => patchJobs.id, { onDelete: 'cascade' }).notNull(),
  dependencyType: varchar('dependency_type', { length: 50 }).notNull(), // prerequisite, blocking, soft
  isOptional: boolean('is_optional').default(false),
  failureAction: varchar('failure_action', { length: 50 }).default('block'), // block, continue, skip
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

module.exports = {
  patchJobs,
  patchJobTargets,
  patchJobLogs,
  patchJobDependencies,
  jobStatusEnum,
  jobTypeEnum,
  executionModeEnum,
  jobPriorityEnum,
};