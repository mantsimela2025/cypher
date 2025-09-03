const { pgTable, serial, varchar, text, timestamp, integer, boolean } = require('drizzle-orm/pg-core');
const { users, roles } = require('./users');

// App Modules - Core application modules that can be enabled/disabled
const appModules = pgTable('app_modules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  enabled: boolean('enabled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Module Navigation - Navigation items for each module
const moduleNavigation = pgTable('module_navigation', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => appModules.id, { onDelete: 'cascade' }).notNull(),
  navLabel: varchar('nav_label', { length: 100 }).notNull(),
  navPath: varchar('nav_path', { length: 255 }).notNull(),
  navIcon: varchar('nav_icon', { length: 100 }),
  navOrder: integer('nav_order').default(0).notNull(),
  parentId: integer('parent_id').references(() => moduleNavigation.id, { onDelete: 'cascade' }), // For nested navigation
  isVisible: boolean('is_visible').default(true).notNull(),
  requiresPermission: varchar('requires_permission', { length: 100 }), // Optional specific permission required
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Module Preferences - User-specific module preferences and customizations
const userModulePreferences = pgTable('user_module_preferences', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  moduleId: integer('module_id').references(() => appModules.id, { onDelete: 'cascade' }).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(), // User can hide modules they have access to
  customOrder: integer('custom_order'), // User can reorder navigation
  preferences: text('preferences'), // JSON string for additional preferences
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Module Dependencies - Define dependencies between modules
const moduleDependencies = pgTable('module_dependencies', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => appModules.id, { onDelete: 'cascade' }).notNull(),
  dependsOnModuleId: integer('depends_on_module_id').references(() => appModules.id, { onDelete: 'cascade' }).notNull(),
  isRequired: boolean('is_required').default(true).notNull(), // Whether dependency is required or optional
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Module Settings - Configuration settings for each module
const moduleSettings = pgTable('module_settings', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => appModules.id, { onDelete: 'cascade' }).notNull(),
  settingKey: varchar('setting_key', { length: 100 }).notNull(),
  settingValue: text('setting_value'),
  settingType: varchar('setting_type', { length: 50 }).default('string').notNull(), // string, number, boolean, json
  description: text('description'),
  isUserConfigurable: boolean('is_user_configurable').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Module Audit Log - Track module configuration changes
const moduleAuditLog = pgTable('module_audit_log', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => appModules.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(), // enabled, disabled, permission_changed, etc.
  entityType: varchar('entity_type', { length: 50 }).notNull(), // module, navigation, permission, setting
  entityId: integer('entity_id'),
  oldValues: text('old_values'), // JSON string of old values
  newValues: text('new_values'), // JSON string of new values
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// Module Analytics - Track module usage and performance
const moduleAnalytics = pgTable('module_analytics', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').references(() => appModules.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 50 }).notNull(), // view, create, edit, delete, etc.
  eventData: text('event_data'), // JSON string for additional event data
  sessionId: varchar('session_id', { length: 100 }),
  duration: integer('duration'), // Time spent in milliseconds
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  appModules,
  moduleNavigation,
  userModulePreferences,
  moduleDependencies,
  moduleSettings,
  moduleAuditLog,
  moduleAnalytics,
};
