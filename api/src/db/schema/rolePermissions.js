const { pgTable, serial, integer } = require('drizzle-orm/pg-core');
const { roles } = require('./roles');
const { permissions } = require('./permissions');

const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id').notNull().references(() => roles.id),
  permissionId: integer('permission_id').notNull().references(() => permissions.id),
});

module.exports = {
  rolePermissions,
};
