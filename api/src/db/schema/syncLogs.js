const { pgTable, serial, integer, varchar, timestamp, jsonb, pgEnum } = require('drizzle-orm/pg-core');
const { syncJobs } = require('./syncJobs');

// Define enums for sync logs
const syncStatusEnum = pgEnum('sync_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout'
]);

const syncLogs = pgTable('sync_logs', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => syncJobs.id),
  service: varchar('service', { length: 50 }).notNull(),
  status: syncStatusEnum('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // Duration in seconds
  recordsProcessed: integer('records_processed').default(0),
  recordsCreated: integer('records_created').default(0),
  recordsUpdated: integer('records_updated').default(0),
  recordsSkipped: integer('records_skipped').default(0),
  recordsErrored: integer('records_errored').default(0),
  config: jsonb('config'), // Configuration used for this sync
  result: jsonb('result'), // Detailed sync results
  errors: jsonb('errors').default([]), // Array of error messages
  metadata: jsonb('metadata').default({}), // Additional metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  syncLogs,
  syncStatusEnum,
};
