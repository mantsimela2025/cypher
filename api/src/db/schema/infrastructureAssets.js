const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for infrastructure and assets
const cloudProviderEnum = pgEnum('enum_cloud_provider', ['aws', 'azure', 'gcp', 'oracle', 'ibm', 'alibaba', 'other']);
const assetStateEnum = pgEnum('enum_asset_state', ['running', 'stopped', 'terminated', 'pending', 'unknown']);
const licenseTypeEnum = pgEnum('enum_license_type', ['perpetual', 'subscription', 'usage_based', 'open_source', 'trial']);
const diagramTypeEnum = pgEnum('enum_diagram_type', ['network', 'architecture', 'flow', 'security', 'compliance', 'custom']);

// Cloud Assets table
const cloudAssets = pgTable('cloud_assets', {
  id: serial('id').primaryKey(),
  assetId: varchar('asset_id', { length: 255 }), // References assets.id if linked
  cloudProvider: cloudProviderEnum('cloud_provider').notNull(),
  region: varchar('region', { length: 100 }),
  availabilityZone: varchar('availability_zone', { length: 100 }),
  resourceId: varchar('resource_id', { length: 255 }).notNull(), // Cloud provider's resource ID
  resourceType: varchar('resource_type', { length: 100 }).notNull(), // EC2, RDS, S3, etc.
  resourceName: varchar('resource_name', { length: 255 }),
  state: assetStateEnum('state'),
  instanceType: varchar('instance_type', { length: 100 }),
  publicIp: varchar('public_ip', { length: 45 }),
  privateIp: varchar('private_ip', { length: 45 }),
  vpcId: varchar('vpc_id', { length: 100 }),
  subnetId: varchar('subnet_id', { length: 100 }),
  securityGroups: text('security_groups').array(),
  tags: jsonb('tags').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  costPerHour: numeric('cost_per_hour', { precision: 10, scale: 6 }),
  monthlyCost: numeric('monthly_cost', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  launchedAt: timestamp('launched_at', { withTimezone: true }),
  lastSeen: timestamp('last_seen', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assetIdIdx: index('idx_cloud_assets_asset_id').on(table.assetId),
  cloudProviderIdx: index('idx_cloud_assets_cloud_provider').on(table.cloudProvider),
  regionIdx: index('idx_cloud_assets_region').on(table.region),
  resourceIdIdx: index('idx_cloud_assets_resource_id').on(table.resourceId),
  resourceTypeIdx: index('idx_cloud_assets_resource_type').on(table.resourceType),
  stateIdx: index('idx_cloud_assets_state').on(table.state),
  vpcIdIdx: index('idx_cloud_assets_vpc_id').on(table.vpcId),
  activeIdx: index('idx_cloud_assets_active').on(table.isActive),
  lastSeenIdx: index('idx_cloud_assets_last_seen').on(table.lastSeen),
}));

// Cloud Cost Mapping table
const cloudCostMapping = pgTable('cloud_cost_mapping', {
  id: serial('id').primaryKey(),
  cloudAssetId: integer('cloud_asset_id').references(() => cloudAssets.id),
  costCenterId: integer('cost_center_id'), // References cost_centers.id
  allocationPercentage: numeric('allocation_percentage', { precision: 5, scale: 2 }).default(100),
  costCategory: varchar('cost_category', { length: 100 }),
  billingPeriod: varchar('billing_period', { length: 20 }), // 'monthly', 'daily', 'hourly'
  actualCost: numeric('actual_cost', { precision: 12, scale: 2 }),
  budgetedCost: numeric('budgeted_cost', { precision: 12, scale: 2 }),
  variance: numeric('variance', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  cloudAssetIdIdx: index('idx_cloud_cost_mapping_cloud_asset_id').on(table.cloudAssetId),
  costCenterIdIdx: index('idx_cloud_cost_mapping_cost_center_id').on(table.costCenterId),
  billingPeriodIdx: index('idx_cloud_cost_mapping_billing_period').on(table.billingPeriod),
  periodStartIdx: index('idx_cloud_cost_mapping_period_start').on(table.periodStart),
  costCategoryIdx: index('idx_cloud_cost_mapping_cost_category').on(table.costCategory),
}));

// Software Assets table
const softwareAssets = pgTable('software_assets', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id'), // References assets.id if linked
  name: varchar('name', { length: 255 }).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  version: varchar('version', { length: 100 }),
  edition: varchar('edition', { length: 100 }),
  licenseKey: varchar('license_key', { length: 500 }),
  licenseType: licenseTypeEnum('license_type'),
  licenseCount: integer('license_count'),
  usedLicenses: integer('used_licenses').default(0),
  availableLicenses: integer('available_licenses').default(0),
  installPath: varchar('install_path', { length: 500 }),
  installDate: timestamp('install_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  supportEndDate: timestamp('support_end_date', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  isCritical: boolean('is_critical').default(false),
  complianceStatus: varchar('compliance_status', { length: 50 }),
  vulnerabilityCount: integer('vulnerability_count').default(0),
  lastScan: timestamp('last_scan', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  assetIdIdx: index('idx_software_assets_asset_id').on(table.assetId),
  nameIdx: index('idx_software_assets_name').on(table.name),
  vendorIdx: index('idx_software_assets_vendor').on(table.vendor),
  licenseTypeIdx: index('idx_software_assets_license_type').on(table.licenseType),
  activeIdx: index('idx_software_assets_active').on(table.isActive),
  criticalIdx: index('idx_software_assets_critical').on(table.isCritical),
  expirationDateIdx: index('idx_software_assets_expiration_date').on(table.expirationDate),
  complianceStatusIdx: index('idx_software_assets_compliance_status').on(table.complianceStatus),
}));

// Software Lifecycle table
const softwareLifecycle = pgTable('software_lifecycle', {
  id: serial('id').primaryKey(),
  softwareAssetId: integer('software_asset_id').references(() => softwareAssets.id, { onDelete: 'cascade' }).notNull(),
  lifecycleStage: varchar('lifecycle_stage', { length: 50 }).notNull(), // 'planning', 'development', 'testing', 'production', 'maintenance', 'retirement'
  stageStartDate: timestamp('stage_start_date', { withTimezone: true }),
  stageEndDate: timestamp('stage_end_date', { withTimezone: true }),
  plannedEndDate: timestamp('planned_end_date', { withTimezone: true }),
  actualEndDate: timestamp('actual_end_date', { withTimezone: true }),
  milestones: jsonb('milestones').default('[]'),
  risks: text('risks').array(),
  dependencies: text('dependencies').array(),
  stakeholders: text('stakeholders').array(),
  budget: numeric('budget', { precision: 12, scale: 2 }),
  actualCost: numeric('actual_cost', { precision: 12, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  softwareAssetIdIdx: index('idx_software_lifecycle_software_asset_id').on(table.softwareAssetId),
  lifecycleStageIdx: index('idx_software_lifecycle_lifecycle_stage').on(table.lifecycleStage),
  stageStartDateIdx: index('idx_software_lifecycle_stage_start_date').on(table.stageStartDate),
  plannedEndDateIdx: index('idx_software_lifecycle_planned_end_date').on(table.plannedEndDate),
}));

// Network Diagrams table
const networkDiagrams = pgTable('network_diagrams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  diagramType: diagramTypeEnum('diagram_type').default('network'),
  systemId: integer('system_id'), // References systems.id if linked to a specific system
  networkScope: varchar('network_scope', { length: 100 }), // 'lan', 'wan', 'dmz', 'cloud', 'hybrid'
  diagramData: jsonb('diagram_data').notNull(), // Diagram structure and elements
  layout: jsonb('layout').default('{}'), // Layout configuration
  styling: jsonb('styling').default('{}'), // Visual styling
  version: varchar('version', { length: 20 }).default('1.0'),
  isPublic: boolean('is_public').default(false),
  isActive: boolean('is_active').default(true),
  lastModified: timestamp('last_modified', { withTimezone: true }).defaultNow(),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  modifiedBy: integer('modified_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_network_diagrams_name').on(table.name),
  diagramTypeIdx: index('idx_network_diagrams_diagram_type').on(table.diagramType),
  systemIdIdx: index('idx_network_diagrams_system_id').on(table.systemId),
  networkScopeIdx: index('idx_network_diagrams_network_scope').on(table.networkScope),
  publicIdx: index('idx_network_diagrams_public').on(table.isPublic),
  activeIdx: index('idx_network_diagrams_active').on(table.isActive),
  lastModifiedIdx: index('idx_network_diagrams_last_modified').on(table.lastModified),
  createdByIdx: index('idx_network_diagrams_created_by').on(table.createdBy),
}));

module.exports = {
  cloudAssets,
  cloudCostMapping,
  softwareAssets,
  softwareLifecycle,
  networkDiagrams,
  // Export enums
  cloudProviderEnum,
  assetStateEnum,
  licenseTypeEnum,
  diagramTypeEnum,
};
