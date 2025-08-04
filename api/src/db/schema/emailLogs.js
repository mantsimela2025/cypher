const { pgTable, serial, varchar, text, timestamp, pgEnum } = require('drizzle-orm/pg-core');

// Define the status enum for email logs
const emailLogStatusEnum = pgEnum('enum_email_logs_status', [
  'pending',
  'sent', 
  'delivered',
  'failed',
  'bounced',
  'rejected'
]);

const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  subject: varchar('subject', { length: 255 }).notNull(),
  from: varchar('from', { length: 255 }).notNull(),
  to: varchar('to', { length: 255 }).notNull(),
  cc: varchar('cc', { length: 255 }).default(''),
  bcc: varchar('bcc', { length: 255 }).default(''),
  body: text('body'),
  htmlBody: text('html_body'),
  status: emailLogStatusEnum('status').notNull(),
  category: varchar('category', { length: 255 }),
  serviceName: varchar('service_name', { length: 255 }),
  responseMessage: text('response_message'),
  relatedEntityType: varchar('related_entity_type', { length: 255 }),
  relatedEntityId: varchar('related_entity_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  emailLogs,
  emailLogStatusEnum,
};
