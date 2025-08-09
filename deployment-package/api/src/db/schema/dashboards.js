const { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  pgEnum,
  jsonb,
  boolean,
  numeric,
  index,
  unique
} = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for dashboard and metrics tables
const dashboardSharesPermissionEnum = pgEnum('enum_dashboard_shares_permission', [
  'view',
  'edit',
  'admin'
]);

const metricsTypeEnum = pgEnum('enum_metrics_type', [
  'counter',
  'gauge',
  'histogram',
  'summary',
  'percentage',
  'ratio',
  'trend',
  'status'
]);

const metricsCategoryEnum = pgEnum('enum_metrics_category', [
  'systems',
  'assets',
  'vulnerabilities',
  'compliance',
  'performance',
  'security',
  'financial',
  'operational',
  'user_activity',
  'network',
  'infrastructure',
  'applications'
]);

const chartTypeEnum = pgEnum('enum_chart_type', [
  'line',
  'bar',
  'pie',
  'doughnut',
  'area',
  'scatter',
  'bubble',
  'radar',
  'polar',
  'gauge',
  'table',
  'number',
  'progress',
  'heatmap',
  'treemap'
]);

// Metrics table - stores metric definitions with SQL queries
const metrics = pgTable('metrics', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: metricsTypeEnum('type').notNull(),
  category: metricsCategoryEnum('category'),
  query: text('query').notNull(), // SQL query to calculate the metric
  value: numeric('value', { precision: 15, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 255 }),
  labels: jsonb('labels').default('{}'),
  threshold: jsonb('threshold').default('{}'),
  source: varchar('source', { length: 255 }),
  aggregationPeriod: varchar('aggregation_period', { length: 255 }),
  lastCalculated: timestamp('last_calculated', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    nameIdx: index('metrics_name').on(table.name),
    typeIdx: index('metrics_type').on(table.type),
    categoryIdx: index('metrics_category').on(table.category),
    activeIdx: index('metrics_active').on(table.isActive),
    createdByIdx: index('metrics_created_by').on(table.createdBy),
    lastCalculatedIdx: index('metrics_last_calculated').on(table.lastCalculated),
    // Composite indexes
    typeCategoryIdx: index('metrics_type_category').on(table.type, table.category),
    activeTypeIdx: index('metrics_active_type').on(table.isActive, table.type),
    createdByActiveIdx: index('metrics_created_by_active').on(table.createdBy, table.isActive)
  };
});

// Chart Types table - defines available chart types and their configurations
const chartTypes = pgTable('chart_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: chartTypeEnum('type').notNull(),
  description: text('description'),
  defaultConfig: jsonb('default_config').default('{}'),
  supportedMetricTypes: jsonb('supported_metric_types').default('[]'), // Array of metric types this chart supports
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    nameIdx: index('chart_types_name').on(table.name),
    typeIdx: index('chart_types_type').on(table.type),
    activeIdx: index('chart_types_active').on(table.isActive),
    nameUnique: unique('chart_types_name_unique').on(table.name)
  };
});

// Chart Configurations table - global chart styling and configuration
const chartConfigurations = pgTable('chart_configurations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  colorPalette: jsonb('color_palette').default('[]'), // Array of colors
  defaultWidth: integer('default_width').default(400),
  defaultHeight: integer('default_height').default(300),
  fontFamily: varchar('font_family', { length: 100 }).default('Arial, sans-serif'),
  fontSize: integer('font_size').default(12),
  theme: varchar('theme', { length: 50 }).default('light'), // light, dark, custom
  gridConfig: jsonb('grid_config').default('{}'),
  legendConfig: jsonb('legend_config').default('{}'),
  tooltipConfig: jsonb('tooltip_config').default('{}'),
  animationConfig: jsonb('animation_config').default('{}'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    nameIdx: index('chart_configurations_name').on(table.name),
    themeIdx: index('chart_configurations_theme').on(table.theme),
    defaultIdx: index('chart_configurations_default').on(table.isDefault),
    activeIdx: index('chart_configurations_active').on(table.isActive),
    createdByIdx: index('chart_configurations_created_by').on(table.createdBy),
    nameUnique: unique('chart_configurations_name_unique').on(table.name)
  };
});

// Dashboards table (existing structure)
const dashboards = pgTable('dashboards', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  layout: jsonb('layout').default('{}'),
  widgets: jsonb('widgets').default('[]'), // Added for dashboard creator
  isDefault: boolean('is_default').default(false),
  isGlobal: boolean('is_global').default(false), // Added for global dashboards
  isPublished: boolean('is_published').default(false), // Added for dashboard creator
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    nameIdx: index('dashboards_name').on(table.name),
    defaultIdx: index('dashboards_default').on(table.isDefault),
    globalIdx: index('dashboards_global').on(table.isGlobal),
    publishedIdx: index('dashboards_published').on(table.isPublished), // Added for dashboard creator
    createdByIdx: index('dashboards_created_by').on(table.createdBy),
    // Composite indexes
    globalDefaultIdx: index('dashboards_global_default').on(table.isGlobal, table.isDefault),
    createdByGlobalIdx: index('dashboards_created_by_global').on(table.createdBy, table.isGlobal),
    userPublishedIdx: index('dashboards_user_published').on(table.createdBy, table.isPublished) // Added for dashboard creator
  };
});

// Dashboard Metrics table - links metrics to dashboards with positioning
const dashboardMetrics = pgTable('dashboard_metrics', {
  id: serial('id').primaryKey(),
  dashboardId: integer('dashboard_id').notNull().references(() => dashboards.id, { onDelete: 'cascade' }),
  metricId: integer('metric_id').notNull().references(() => metrics.id, { onDelete: 'cascade' }),
  chartTypeId: integer('chart_type_id').references(() => chartTypes.id),
  chartConfigId: integer('chart_config_id').references(() => chartConfigurations.id),
  position: integer('position'),
  width: integer('width').default(400),
  height: integer('height').default(300),
  chartType: varchar('chart_type', { length: 50 }), // Deprecated, use chartTypeId
  config: jsonb('config').default('{}'), // Override configuration for this specific metric
  isVisible: boolean('is_visible').default(true),
  refreshInterval: integer('refresh_interval').default(300), // Seconds
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    dashboardIdIdx: index('dashboard_metrics_dashboard_id').on(table.dashboardId),
    metricIdIdx: index('dashboard_metrics_metric_id').on(table.metricId),
    chartTypeIdIdx: index('dashboard_metrics_chart_type_id').on(table.chartTypeId),
    positionIdx: index('dashboard_metrics_position').on(table.position),
    visibleIdx: index('dashboard_metrics_visible').on(table.isVisible),
    // Composite indexes
    dashboardPositionIdx: index('dashboard_metrics_dashboard_position').on(table.dashboardId, table.position),
    dashboardVisibleIdx: index('dashboard_metrics_dashboard_visible').on(table.dashboardId, table.isVisible),
    // Unique constraint to prevent duplicate metrics on same dashboard
    dashboardMetricUnique: unique('dashboard_metrics_dashboard_metric_unique').on(table.dashboardId, table.metricId)
  };
});

// Dashboard Shares table - controls access to dashboards
const dashboardShares = pgTable('dashboard_shares', {
  id: serial('id').primaryKey(),
  dashboardId: integer('dashboard_id').notNull().references(() => dashboards.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: dashboardSharesPermissionEnum('permission').default('view').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    dashboardIdIdx: index('dashboard_shares_dashboard_id').on(table.dashboardId),
    userIdIdx: index('dashboard_shares_user_id').on(table.userId),
    permissionIdx: index('dashboard_shares_permission').on(table.permission),
    // Composite indexes
    dashboardUserIdx: index('dashboard_shares_dashboard_user').on(table.dashboardId, table.userId),
    userPermissionIdx: index('dashboard_shares_user_permission').on(table.userId, table.permission),
    // Unique constraint to prevent duplicate shares
    dashboardUserUnique: unique('dashboard_shares_dashboard_user_unique').on(table.dashboardId, table.userId)
  };
});

// User Dashboards table (existing structure)
const userDashboards = pgTable('user_dashboards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  layout: jsonb('layout').default('{}').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    userIdIdx: index('user_dashboards_user_id').on(table.userId),
    nameIdx: index('user_dashboards_name').on(table.name),
    defaultIdx: index('user_dashboards_default').on(table.isDefault),
    // Composite indexes
    userDefaultIdx: index('user_dashboards_user_default').on(table.userId, table.isDefault),
    userNameIdx: index('user_dashboards_user_name').on(table.userId, table.name)
  };
});

module.exports = {
  metrics,
  chartTypes,
  chartConfigurations,
  dashboards,
  dashboardMetrics,
  dashboardShares,
  userDashboards,
  dashboardSharesPermissionEnum,
  metricsTypeEnum,
  metricsCategoryEnum,
  chartTypeEnum
};
