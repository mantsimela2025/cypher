const { pgTable, serial, integer, timestamp, boolean, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { roles } = require('./roles');

const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  assignedBy: integer('assigned_by').references(() => users.id),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userRoleUnique: unique('unique_user_role').on(table.userId, table.roleId),
  userIdx: index('idx_user_roles_user').on(table.userId),
  roleIdx: index('idx_user_roles_role').on(table.roleId),
  activeIdx: index('idx_user_roles_active').on(table.isActive),
  expiresIdx: index('idx_user_roles_expires').on(table.expiresAt),
}));

module.exports = {
  userRoles,
};
