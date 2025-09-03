const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for data management
const errorSeverityEnum = pgEnum('enum_error_severity', ['low', 'medium', 'high', 'critical']);
const integrationTypeEnum = pgEnum('enum_integration_type', ['api', 'database', 'file', 'webhook', 'sftp']);
const authTypeEnum = pgEnum('enum_auth_type', ['none', 'basic', 'bearer', 'oauth', 'api_key', 'certificate']);

// Errors table - for tracking processing errors
const errors = pgTable('errors', {
  id: serial('id').primaryKey(),
  batchId: varchar('batch_id', { length: 100 }),
  tableName: varchar('table_name', { length: 100 }),
  recordId: varchar('record_id', { length: 100 }),
  errorType: varchar('error_type', { length: 50 }).notNull(),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message').notNull(),
  stackTrace: text('stack_trace'),
  context: jsonb('context').default('{}'),
  severity: errorSeverityEnum('severity').default('medium').notNull(),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: integer('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolution: text('resolution'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  batchIdIdx: index('idx_errors_batch_id').on(table.batchId),
  tableNameIdx: index('idx_errors_table_name').on(table.tableName),
  errorTypeIdx: index('idx_errors_error_type').on(table.errorType),
  severityIdx: index('idx_errors_severity').on(table.severity),
  resolvedIdx: index('idx_errors_resolved').on(table.isResolved),
  createdAtIdx: index('idx_errors_created_at').on(table.createdAt),
}));

// Data Quality table - for tracking data quality metrics
const dataQuality = pgTable('data_quality', {
  id: serial('id').primaryKey(),
  batchId: varchar('batch_id', { length: 100 }),
  tableName: varchar('table_name', { length: 100 }),
  columnName: varchar('column_name', { length: 100 }),
  qualityMetric: varchar('quality_metric', { length: 50 }).notNull(),
  expectedValue: text('expected_value'),
  actualValue: text('actual_value'),
  score: numeric('score', { precision: 5, scale: 2 }),
  threshold: numeric('threshold', { precision: 5, scale: 2 }),
  passed: boolean('passed').notNull(),
  details: jsonb('details').default('{}'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  batchIdIdx: index('idx_data_quality_batch_id').on(table.batchId),
  tableNameIdx: index('idx_data_quality_table_name').on(table.tableName),
  metricIdx: index('idx_data_quality_metric').on(table.qualityMetric),
  passedIdx: index('idx_data_quality_passed').on(table.passed),
  checkedAtIdx: index('idx_data_quality_checked_at').on(table.checkedAt),
  tableColumnIdx: index('idx_data_quality_table_column').on(table.tableName, table.columnName),
}));

// Data Freshness table - for tracking data freshness
const dataFreshness = pgTable('data_freshness', {
  id: serial('id').primaryKey(),
  tableName: varchar('table_name', { length: 100 }).notNull(),
  dataSource: varchar('data_source', { length: 50 }).notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull(),
  expectedFrequency: integer('expected_frequency'), // minutes
  freshnessScore: numeric('freshness_score', { precision: 5, scale: 2 }),
  isStale: boolean('is_stale').default(false),
  staleSince: timestamp('stale_since', { withTimezone: true }),
  recordCount: integer('record_count'),
  metadata: jsonb('metadata').default('{}'),
  checkedAt: timestamp('checked_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tableNameIdx: index('idx_data_freshness_table_name').on(table.tableName),
  dataSourceIdx: index('idx_data_freshness_data_source').on(table.dataSource),
  lastUpdatedIdx: index('idx_data_freshness_last_updated').on(table.lastUpdated),
  staleIdx: index('idx_data_freshness_stale').on(table.isStale),
  checkedAtIdx: index('idx_data_freshness_checked_at').on(table.checkedAt),
  tableSourceIdx: index('idx_data_freshness_table_source').on(table.tableName, table.dataSource),
}));

// Integrations table - for external system integrations
const integrations = pgTable('integrations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: integrationTypeEnum('type').notNull(),
  description: text('description'),
  endpoint: varchar('endpoint', { length: 500 }),
  authType: authTypeEnum('auth_type'),
  authConfig: jsonb('auth_config').default('{}'),
  configuration: jsonb('configuration').default('{}'),
  isActive: boolean('is_active').default(true).notNull(),
  isHealthy: boolean('is_healthy').default(true),
  lastSync: timestamp('last_sync', { withTimezone: true }),
  lastHealthCheck: timestamp('last_health_check', { withTimezone: true }),
  syncInterval: integer('sync_interval').default(3600), // seconds
  timeout: integer('timeout').default(30), // seconds
  retryCount: integer('retry_count').default(3),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  lastError: text('last_error'),
  version: varchar('version', { length: 20 }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_integrations_name').on(table.name),
  typeIdx: index('idx_integrations_type').on(table.type),
  activeIdx: index('idx_integrations_active').on(table.isActive),
  healthyIdx: index('idx_integrations_healthy').on(table.isHealthy),
  lastSyncIdx: index('idx_integrations_last_sync').on(table.lastSync),
}));

// Import Jobs table
const importJobs = pgTable('import_jobs', {
  id: serial('id').primaryKey(),
  integrationId: integer('integration_id').references(() => integrations.id),
  fileName: varchar('file_name', { length: 255 }),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  fileType: varchar('file_type', { length: 50 }),
  targetTable: varchar('target_table', { length: 100 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  totalRecords: integer('total_records').default(0),
  processedRecords: integer('processed_records').default(0),
  successfulRecords: integer('successful_records').default(0),
  failedRecords: integer('failed_records').default(0),
  validationErrors: jsonb('validation_errors').default('[]'),
  mapping: jsonb('mapping').default('{}'),
  configuration: jsonb('configuration').default('{}'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  integrationIdIdx: index('idx_import_jobs_integration_id').on(table.integrationId),
  statusIdx: index('idx_import_jobs_status').on(table.status),
  targetTableIdx: index('idx_import_jobs_target_table').on(table.targetTable),
  createdAtIdx: index('idx_import_jobs_created_at').on(table.createdAt),
  fileNameIdx: index('idx_import_jobs_file_name').on(table.fileName),
}));

// Export Jobs table
const exportJobs = pgTable('export_jobs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  exportType: varchar('export_type', { length: 50 }).notNull(), // 'csv', 'json', 'xml', 'pdf'
  format: varchar('format', { length: 20 }).default('csv').notNull(),
  sourceQuery: text('source_query'),
  sourceTables: text('source_tables').array(),
  filters: jsonb('filters').default('{}'),
  configuration: jsonb('configuration').default('{}'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  filePath: varchar('file_path', { length: 500 }),
  fileSize: integer('file_size'),
  recordCount: integer('record_count'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  downloadCount: integer('download_count').default(0),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_export_jobs_name').on(table.name),
  exportTypeIdx: index('idx_export_jobs_export_type').on(table.exportType),
  statusIdx: index('idx_export_jobs_status').on(table.status),
  createdByIdx: index('idx_export_jobs_created_by').on(table.createdBy),
  createdAtIdx: index('idx_export_jobs_created_at').on(table.createdAt),
  expiresAtIdx: index('idx_export_jobs_expires_at').on(table.expiresAt),
}));

module.exports = {
  errors,
  dataQuality,
  dataFreshness,
  integrations,
  importJobs,
  exportJobs,
  // Export enums
  errorSeverityEnum,
  integrationTypeEnum,
  authTypeEnum,
};
