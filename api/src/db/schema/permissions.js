const { pgTable, serial, varchar, text, timestamp, boolean, index } = require('drizzle-orm/pg-core');

const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  module: varchar('module', { length: 50 }),
  action: varchar('action', { length: 50 }),
  resource: varchar('resource', { length: 50 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_permissions_name').on(table.name),
  moduleIdx: index('idx_permissions_module').on(table.module),
  activeIdx: index('idx_permissions_active').on(table.isActive),
  moduleActionIdx: index('idx_permissions_module_action').on(table.module, table.action),
}));

module.exports = {
  permissions,
};
