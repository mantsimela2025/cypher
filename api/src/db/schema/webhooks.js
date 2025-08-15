const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, pgEnum } = require('drizzle-orm/pg-core');

// Define enums for webhooks
const webhookServiceEnum = pgEnum('webhook_service', [
  'tenable',
  'xacta',
  'qualys',
  'rapid7',
  'nessus',
  'openvas'
]);

const webhookStatusEnum = pgEnum('webhook_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'timeout',
  'cancelled'
]);

// Webhook configurations table
const webhookConfigurations = pgTable('webhook_configurations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  service: webhookServiceEnum('service').notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  events: jsonb('events').notNull(), // Array of event types to listen for
  secret: varchar('secret', { length: 255 }).notNull(),
  enabled: boolean('enabled').default(true),
  retryAttempts: integer('retry_attempts').default(3),
  timeout: integer('timeout').default(30000), // Timeout in milliseconds
  lastTriggered: timestamp('last_triggered', { withTimezone: true }),
  externalId: varchar('external_id', { length: 255 }), // ID from external service
  headers: jsonb('headers').default({}), // Custom headers to send
  metadata: jsonb('metadata').default({}), // Additional configuration
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Webhook logs table
const webhookLogs = pgTable('webhook_logs', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id),
  service: webhookServiceEnum('service').notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  signature: varchar('signature', { length: 255 }),
  status: webhookStatusEnum('status').notNull(),
  httpStatus: integer('http_status'),
  duration: integer('duration'), // Processing duration in milliseconds
  retryCount: integer('retry_count').default(0),
  result: jsonb('result'), // Processing result
  error: text('error'), // Error message if failed
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
});

// Webhook delivery attempts table (for outgoing webhooks)
const webhookDeliveries = pgTable('webhook_deliveries', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  targetUrl: varchar('target_url', { length: 500 }).notNull(),
  status: webhookStatusEnum('status').notNull(),
  httpStatus: integer('http_status'),
  responseBody: text('response_body'),
  responseHeaders: jsonb('response_headers'),
  duration: integer('duration'), // Request duration in milliseconds
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  metadata: jsonb('metadata').default({}),
});

// Webhook subscriptions table (for managing event subscriptions)
const webhookSubscriptions = pgTable('webhook_subscriptions', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  filters: jsonb('filters').default({}), // Event filtering criteria
  transformations: jsonb('transformations').default({}), // Data transformation rules
  enabled: boolean('enabled').default(true),
  priority: integer('priority').default(0), // Processing priority
  rateLimit: integer('rate_limit'), // Max events per minute
  rateLimitWindow: integer('rate_limit_window').default(60), // Rate limit window in seconds
  lastProcessed: timestamp('last_processed', { withTimezone: true }),
  processedCount: integer('processed_count').default(0),
  errorCount: integer('error_count').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Webhook rate limiting table
const webhookRateLimits = pgTable('webhook_rate_limits', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id),
  eventType: varchar('event_type', { length: 100 }),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
  requestCount: integer('request_count').default(0),
  limit: integer('limit').notNull(),
  exceeded: boolean('exceeded').default(false),
  resetAt: timestamp('reset_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Webhook security table (for managing webhook security settings)
const webhookSecurity = pgTable('webhook_security', {
  id: serial('id').primaryKey(),
  webhookId: integer('webhook_id').references(() => webhookConfigurations.id),
  allowedIps: jsonb('allowed_ips').default([]), // Array of allowed IP addresses/ranges
  allowedUserAgents: jsonb('allowed_user_agents').default([]), // Array of allowed user agents
  requireSignature: boolean('require_signature').default(true),
  signatureHeader: varchar('signature_header', { length: 100 }).default('X-Webhook-Signature'),
  signatureAlgorithm: varchar('signature_algorithm', { length: 50 }).default('sha256'),
  encryptPayload: boolean('encrypt_payload').default(false),
  encryptionKey: varchar('encryption_key', { length: 255 }),
  maxPayloadSize: integer('max_payload_size').default(1048576), // 1MB default
  timeoutSeconds: integer('timeout_seconds').default(30),
  sslVerify: boolean('ssl_verify').default(true),
  customHeaders: jsonb('custom_headers').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  webhookConfigurations,
  webhookLogs,
  webhookDeliveries,
  webhookSubscriptions,
  webhookRateLimits,
  webhookSecurity,
  webhookServiceEnum,
  webhookStatusEnum,
};
