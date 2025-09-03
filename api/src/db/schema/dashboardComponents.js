const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for dashboard components
const themeTypeEnum = pgEnum('enum_theme_type', ['light', 'dark', 'auto', 'custom']);
const widgetTypeEnum = pgEnum('enum_widget_type', ['chart', 'table', 'metric', 'text', 'image', 'iframe', 'custom']);
const chartTypeEnum = pgEnum('enum_chart_type', ['line', 'bar', 'pie', 'doughnut', 'area', 'scatter', 'gauge', 'heatmap']);
const widgetSizeEnum = pgEnum('enum_widget_size', ['small', 'medium', 'large', 'extra_large', 'custom']);

// Dashboard Themes table
const dashboardThemes = pgTable('dashboard_themes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  themeType: themeTypeEnum('theme_type').default('light').notNull(),
  colorPalette: jsonb('color_palette').notNull(), // Primary, secondary, accent colors
  typography: jsonb('typography').default('{}'), // Font families, sizes, weights
  spacing: jsonb('spacing').default('{}'), // Margins, paddings, gaps
  borderRadius: jsonb('border_radius').default('{}'), // Border radius values
  shadows: jsonb('shadows').default('{}'), // Box shadow definitions
  customCss: text('custom_css'), // Additional CSS overrides
  isDefault: boolean('is_default').default(false),
  isPublic: boolean('is_public').default(false),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  previewImage: varchar('preview_image', { length: 500 }), // URL to theme preview
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_dashboard_themes_name').on(table.name),
  themeTypeIdx: index('idx_dashboard_themes_theme_type').on(table.themeType),
  defaultIdx: index('idx_dashboard_themes_default').on(table.isDefault),
  publicIdx: index('idx_dashboard_themes_public').on(table.isPublic),
  activeIdx: index('idx_dashboard_themes_active').on(table.isActive),
  usageCountIdx: index('idx_dashboard_themes_usage_count').on(table.usageCount),
  createdByIdx: index('idx_dashboard_themes_created_by').on(table.createdBy),
}));

// Dashboard Widgets table
const dashboardWidgets = pgTable('dashboard_widgets', {
  id: serial('id').primaryKey(),
  dashboardId: integer('dashboard_id').notNull(), // References dashboards.id
  widgetId: varchar('widget_id', { length: 100 }).notNull(), // Unique within dashboard
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  widgetType: widgetTypeEnum('widget_type').notNull(),
  chartType: chartTypeEnum('chart_type'), // Only for chart widgets
  size: widgetSizeEnum('size').default('medium'),
  position: jsonb('position').notNull(), // x, y, width, height
  configuration: jsonb('configuration').notNull(), // Widget-specific config
  dataSource: jsonb('data_source').notNull(), // Query, API endpoint, etc.
  refreshInterval: integer('refresh_interval').default(300), // seconds
  isVisible: boolean('is_visible').default(true),
  isInteractive: boolean('is_interactive').default(true),
  permissions: jsonb('permissions').default('{}'), // View/edit permissions
  styling: jsonb('styling').default('{}'), // Custom styling overrides
  filters: jsonb('filters').default('{}'), // Applied filters
  lastRefreshed: timestamp('last_refreshed', { withTimezone: true }),
  lastError: text('last_error'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dashboardWidgetUnique: unique('unique_dashboard_widget').on(table.dashboardId, table.widgetId),
  dashboardIdIdx: index('idx_dashboard_widgets_dashboard_id').on(table.dashboardId),
  widgetTypeIdx: index('idx_dashboard_widgets_widget_type').on(table.widgetType),
  chartTypeIdx: index('idx_dashboard_widgets_chart_type').on(table.chartType),
  visibleIdx: index('idx_dashboard_widgets_visible').on(table.isVisible),
  lastRefreshedIdx: index('idx_dashboard_widgets_last_refreshed').on(table.lastRefreshed),
  createdByIdx: index('idx_dashboard_widgets_created_by').on(table.createdBy),
}));

// Widget Templates table
const widgetTemplates = pgTable('widget_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'security', 'compliance', 'analytics', etc.
  widgetType: widgetTypeEnum('widget_type').notNull(),
  chartType: chartTypeEnum('chart_type'), // Only for chart widgets
  defaultSize: widgetSizeEnum('default_size').default('medium'),
  templateConfiguration: jsonb('template_configuration').notNull(),
  defaultDataSource: jsonb('default_data_source').default('{}'),
  requiredFields: text('required_fields').array(), // Required data fields
  optionalFields: text('optional_fields').array(), // Optional data fields
  defaultStyling: jsonb('default_styling').default('{}'),
  previewImage: varchar('preview_image', { length: 500 }),
  documentation: text('documentation'), // Usage instructions
  isPublic: boolean('is_public').default(true),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  rating: integer('rating'), // 1-5 stars
  ratingCount: integer('rating_count').default(0),
  tags: text('tags').array(),
  version: varchar('version', { length: 20 }).default('1.0'),
  minVersion: varchar('min_version', { length: 20 }), // Minimum app version required
  maxVersion: varchar('max_version', { length: 20 }), // Maximum app version supported
  dependencies: text('dependencies').array(), // Required plugins/modules
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_widget_templates_name').on(table.name),
  categoryIdx: index('idx_widget_templates_category').on(table.category),
  widgetTypeIdx: index('idx_widget_templates_widget_type').on(table.widgetType),
  chartTypeIdx: index('idx_widget_templates_chart_type').on(table.chartType),
  publicIdx: index('idx_widget_templates_public').on(table.isPublic),
  activeIdx: index('idx_widget_templates_active').on(table.isActive),
  usageCountIdx: index('idx_widget_templates_usage_count').on(table.usageCount),
  ratingIdx: index('idx_widget_templates_rating').on(table.rating),
  tagsIdx: index('idx_widget_templates_tags').on(table.tags),
  createdByIdx: index('idx_widget_templates_created_by').on(table.createdBy),
}));

module.exports = {
  dashboardThemes,
  dashboardWidgets,
  widgetTemplates,
  // Export enums
  themeTypeEnum,
  widgetTypeEnum,
  chartTypeEnum,
  widgetSizeEnum,
};
