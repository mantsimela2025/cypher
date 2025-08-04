const { pgTable, serial, varchar, text, timestamp, boolean, pgEnum } = require('drizzle-orm/pg-core');

// Enum for setting data types
const settingDataTypeEnum = pgEnum('setting_data_type', ['string', 'number', 'boolean', 'json', 'array']);

// Settings table - application configuration settings
const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value'),
  dataType: settingDataTypeEnum('data_type').default('string').notNull(),
  category: varchar('category', { length: 255 }).default('general').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false).notNull(),
  isEditable: boolean('is_editable').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

module.exports = {
  settings,
  settingDataTypeEnum
};
