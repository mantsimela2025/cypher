const { pgTable, serial, varchar, text, timestamp, boolean, index } = require('drizzle-orm/pg-core');

const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_roles_name').on(table.name),
  activeIdx: index('idx_roles_active').on(table.isActive),
}));

module.exports = {
  roles,
};
