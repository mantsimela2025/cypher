const { pgTable, serial, varchar, text, timestamp, integer, jsonb } = require('drizzle-orm/pg-core');

const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  messageId: varchar('message_id', { length: 255 }), // SES Message ID
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  senderEmail: varchar('sender_email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  category: varchar('category', { length: 100 }), // test, notification, template, etc.
  templateId: varchar('template_id', { length: 100 }), // for template emails
  status: varchar('status', { length: 50 }).notNull().default('sent'), // sent, failed, bounced, delivered
  serviceName: varchar('service_name', { length: 100 }).notNull().default('Amazon SES'),
  errorMessage: text('error_message'), // if failed
  metadata: jsonb('metadata'), // additional data like template variables, etc.
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

module.exports = { emailLogs };
