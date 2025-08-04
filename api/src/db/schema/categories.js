const { pgTable, serial, text, integer, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { users } = require('./users');

const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').default(''),
  parentId: integer('parent_id').references(() => categories.id),
  status: text('status').default('active').notNull(), // active, inactive, draft
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  updatedBy: integer('updated_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  categories,
};