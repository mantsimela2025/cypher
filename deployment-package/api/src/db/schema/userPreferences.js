const { pgTable, serial, integer, varchar, jsonb, timestamp } = require('drizzle-orm/pg-core');
const { users } = require('./users');

const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  preferenceKey: varchar('preference_key', { length: 100 }).notNull(),
  preferenceValue: jsonb('preference_value').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  userPreferences,
};
