const { pgTable, serial, varchar, text, timestamp, pgEnum, boolean, integer, jsonb } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define the type enum for email templates
const emailTemplateTypeEnum = pgEnum('enum_email_templates_type', [
  'welcome',
  'password_reset',
  'access_request',
  'notification',
  'marketing',
  'system',
  'custom'
]);

// Define the status enum for email templates
const emailTemplateStatusEnum = pgEnum('enum_email_templates_status', [
  'draft',
  'active',
  'inactive',
  'archived'
]);

const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body').notNull(),
  type: emailTemplateTypeEnum('type').notNull(),
  status: emailTemplateStatusEnum('status').default('draft').notNull(),
  variables: varchar('variables', { length: 255 }).array().default([]),
  isHtml: boolean('is_html').default(false),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
  version: varchar('version', { length: 255 }),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  emailTemplates,
  emailTemplateTypeEnum,
  emailTemplateStatusEnum,
};
