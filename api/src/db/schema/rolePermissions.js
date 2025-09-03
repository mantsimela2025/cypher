const { pgTable, serial, integer, timestamp, index, unique } = require('drizzle-orm/pg-core');
const { roles } = require('./roles');
const { permissions } = require('./permissions');

const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: integer('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  rolePermissionUnique: unique('unique_role_permission').on(table.roleId, table.permissionId),
  roleIdx: index('idx_role_permissions_role').on(table.roleId),
  permissionIdx: index('idx_role_permissions_permission').on(table.permissionId),
}));

module.exports = {
  rolePermissions,
};
