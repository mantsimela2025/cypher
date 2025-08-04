const { pgTable, serial, integer, timestamp } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { roles } = require('./roles');

const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  roleId: integer('role_id').notNull().references(() => roles.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow(),
  assignedBy: integer('assigned_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  userRoles,
};
