const { pgTable, serial, varchar, text, timestamp, boolean, jsonb, pgEnum } = require('drizzle-orm/pg-core');

// Define enums for sync jobs
const syncServiceEnum = pgEnum('sync_service', [
  'tenable',
  'xacta', 
  'qualys',
  'rapid7',
  'correlation',
  'enrichment'
]);

const syncJobs = pgTable('sync_jobs', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  service: syncServiceEnum('service').notNull(),
  schedule: varchar('schedule', { length: 100 }).notNull(), // Cron expression
  config: jsonb('config').default({}), // Job-specific configuration
  enabled: boolean('enabled').default(true),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  maxRetries: varchar('max_retries', { length: 10 }).default('3'),
  retryDelay: varchar('retry_delay', { length: 10 }).default('60'), // seconds
  timeout: varchar('timeout', { length: 10 }).default('3600'), // seconds
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  syncJobs,
  syncServiceEnum,
};
