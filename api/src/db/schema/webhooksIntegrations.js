const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for webhooks and integrations
const webhookStatusEnum = pgEnum('enum_webhook_status', ['active', 'inactive', 'failed', 'disabled']);
const deliveryStatusEnum = pgEnum('enum_delivery_status', ['pending', 'delivered', 'failed', 'retrying']);
const httpMethodEnum = pgEnum('enum_http_method', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const securityTypeEnum = pgEnum('enum_security_type', ['none', 'basic', 'bearer', 'hmac', 'oauth']);

// Webhook Configurations table
const webhookConfigurations = pgTable('webhook_configurations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  url: varchar('url', { length: 500 }).notNull(),
  method: httpMethodEnum('method').default('POST').notNull(),
  headers: jsonb('headers').default('{}'),
  events: text('events').array().notNull(), // Array of event types to listen for
  isActive: boolean('is_active').default(true),
  status: webhookStatusEnum('status').default('active'),
  secretKey: varchar('secret_key', { length: 255 }), // For HMAC verification
  timeout: integer('timeout').default(30), // seconds
  retryCount: integer('retry_count').default(3),
  retryDelay: integer('retry_delay').default(60), // seconds
  lastTriggered: timestamp('last_triggered', { withTimezone: true }),
  successCount: integer('success_count').default(0),
  failureCount: integer('failure_count').default(0),
  lastError: text('last_error'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_webhook_configurations_name').on(table.name),
  urlIdx: index('idx_webhook_configurations_url').on(table.url),
  activeIdx: index('idx_webhook_configurations_active').on(table.isActive),
  statusIdx: index('idx_webhook_configurations_status').on(table.status),
  lastTriggeredIdx: index('idx_webhook_configurations_last_triggered').on(table.lastTriggered),
  eventsIdx: index('idx_webhook_configurations_events').on(table.events),
}));

// Webhook Deliveries table
const webhookDeliveries = pgTable('webhook_deliveries', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id, { onDelete: 'cascade' }).notNull(),
  deliveryId: varchar('delivery_id', { length: 100 }).notNull().unique(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: deliveryStatusEnum('status').default('pending').notNull(),
  httpStatusCode: integer('http_status_code'),
  responseBody: text('response_body'),
  responseHeaders: jsonb('response_headers').default('{}'),
  requestHeaders: jsonb('request_headers').default('{}'),
  attemptCount: integer('attempt_count').default(0),
  maxAttempts: integer('max_attempts').default(3),
  nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  duration: integer('duration'), // milliseconds
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  webhookIdIdx: index('idx_webhook_deliveries_webhook_id').on(table.webhookId),
  deliveryIdIdx: index('idx_webhook_deliveries_delivery_id').on(table.deliveryId),
  eventTypeIdx: index('idx_webhook_deliveries_event_type').on(table.eventType),
  statusIdx: index('idx_webhook_deliveries_status').on(table.status),
  nextAttemptIdx: index('idx_webhook_deliveries_next_attempt').on(table.nextAttemptAt),
  createdAtIdx: index('idx_webhook_deliveries_created_at').on(table.createdAt),
  deliveredAtIdx: index('idx_webhook_deliveries_delivered_at').on(table.deliveredAt),
}));

// Webhook Logs table
const webhookLogs = pgTable('webhook_logs', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id),
  deliveryId: varchar('delivery_id', { length: 100 }),
  logLevel: varchar('log_level', { length: 20 }).default('info'), // 'debug', 'info', 'warn', 'error'
  message: text('message').notNull(),
  details: jsonb('details').default('{}'),
  stackTrace: text('stack_trace'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  webhookIdIdx: index('idx_webhook_logs_webhook_id').on(table.webhookId),
  deliveryIdIdx: index('idx_webhook_logs_delivery_id').on(table.deliveryId),
  logLevelIdx: index('idx_webhook_logs_log_level').on(table.logLevel),
  createdAtIdx: index('idx_webhook_logs_created_at').on(table.createdAt),
}));

// Webhook Rate Limits table
const webhookRateLimits = pgTable('webhook_rate_limits', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id, { onDelete: 'cascade' }).notNull(),
  timeWindow: integer('time_window').default(3600), // seconds (1 hour)
  maxRequests: integer('max_requests').default(1000),
  currentRequests: integer('current_requests').default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).defaultNow(),
  isBlocked: boolean('is_blocked').default(false),
  blockedUntil: timestamp('blocked_until', { withTimezone: true }),
  lastRequest: timestamp('last_request', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  webhookIdUnique: unique('unique_webhook_rate_limit').on(table.webhookId),
  webhookIdIdx: index('idx_webhook_rate_limits_webhook_id').on(table.webhookId),
  windowStartIdx: index('idx_webhook_rate_limits_window_start').on(table.windowStart),
  blockedIdx: index('idx_webhook_rate_limits_blocked').on(table.isBlocked),
  blockedUntilIdx: index('idx_webhook_rate_limits_blocked_until').on(table.blockedUntil),
}));

// Webhook Security table
const webhookSecurity = pgTable('webhook_security', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id, { onDelete: 'cascade' }).notNull(),
  securityType: securityTypeEnum('security_type').notNull(),
  configuration: jsonb('configuration').default('{}'), // Security-specific config
  isEnabled: boolean('is_enabled').default(true),
  lastRotated: timestamp('last_rotated', { withTimezone: true }),
  rotationInterval: integer('rotation_interval'), // days
  allowedIps: text('allowed_ips').array(),
  blockedIps: text('blocked_ips').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  webhookIdUnique: unique('unique_webhook_security').on(table.webhookId),
  webhookIdIdx: index('idx_webhook_security_webhook_id').on(table.webhookId),
  securityTypeIdx: index('idx_webhook_security_security_type').on(table.securityType),
  enabledIdx: index('idx_webhook_security_enabled').on(table.isEnabled),
  lastRotatedIdx: index('idx_webhook_security_last_rotated').on(table.lastRotated),
}));

// Webhook Subscriptions table
const webhookSubscriptions = pgTable('webhook_subscriptions', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id, { onDelete: 'cascade' }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // 'user', 'system', 'vulnerability', etc.
  entityId: integer('entity_id'), // Specific entity ID, null for all entities of type
  eventTypes: text('event_types').array().notNull(), // Specific events to subscribe to
  filters: jsonb('filters').default('{}'), // Additional filtering criteria
  isActive: boolean('is_active').default(true),
  subscribedBy: integer('subscribed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  webhookEntityUnique: unique('unique_webhook_entity_subscription').on(table.webhookId, table.entityType, table.entityId),
  webhookIdIdx: index('idx_webhook_subscriptions_webhook_id').on(table.webhookId),
  entityTypeIdx: index('idx_webhook_subscriptions_entity_type').on(table.entityType),
  entityIdIdx: index('idx_webhook_subscriptions_entity_id').on(table.entityId),
  activeIdx: index('idx_webhook_subscriptions_active').on(table.isActive),
  subscribedByIdx: index('idx_webhook_subscriptions_subscribed_by').on(table.subscribedBy),
}));

// Import History table
const importHistory = pgTable('import_history', {
  id: serial('id').primaryKey(),
  importJobId: integer('import_job_id'), // References import_jobs.id
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  fileHash: varchar('file_hash', { length: 64 }), // SHA-256 hash
  sourceSystem: varchar('source_system', { length: 100 }),
  targetTable: varchar('target_table', { length: 100 }).notNull(),
  importType: varchar('import_type', { length: 50 }).notNull(), // 'full', 'incremental', 'upsert'
  status: varchar('status', { length: 50 }).default('completed').notNull(),
  recordsImported: integer('records_imported').default(0),
  recordsSkipped: integer('records_skipped').default(0),
  recordsErrored: integer('records_errored').default(0),
  validationErrors: jsonb('validation_errors').default('[]'),
  transformationRules: jsonb('transformation_rules').default('{}'),
  mapping: jsonb('mapping').default('{}'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // seconds
  importedBy: integer('imported_by').references(() => users.id),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  importJobIdIdx: index('idx_import_history_import_job_id').on(table.importJobId),
  fileNameIdx: index('idx_import_history_file_name').on(table.fileName),
  fileHashIdx: index('idx_import_history_file_hash').on(table.fileHash),
  sourceSystemIdx: index('idx_import_history_source_system').on(table.sourceSystem),
  targetTableIdx: index('idx_import_history_target_table').on(table.targetTable),
  statusIdx: index('idx_import_history_status').on(table.status),
  importedByIdx: index('idx_import_history_imported_by').on(table.importedBy),
  completedAtIdx: index('idx_import_history_completed_at').on(table.completedAt),
}));

module.exports = {
  webhookConfigurations,
  webhookDeliveries,
  webhookLogs,
  webhookRateLimits,
  webhookSecurity,
  webhookSubscriptions,
  importHistory,
  // Export enums
  webhookStatusEnum,
  deliveryStatusEnum,
  httpMethodEnum,
  securityTypeEnum,
};
