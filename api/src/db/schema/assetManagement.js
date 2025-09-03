const { pgTable, serial, varchar, text, timestamp, jsonb, integer, numeric, uuid, date, pgEnum, decimal, unique, index } = require('drizzle-orm/pg-core');
const { assets } = require('./assets');
const { users } = require('./users');

// Define enums for asset cost management
const costTypeEnum = pgEnum('enum_asset_cost_management_cost_type', [
  'purchase',
  'lease',
  'maintenance',
  'support',
  'license',
  'subscription',
  'upgrade',
  'repair',
  'insurance',
  'other'
]);

const billingCycleEnum = pgEnum('enum_asset_cost_management_billing_cycle', [
  'one_time',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'biennial'
]);

// Define enum for asset risk mapping method
const mappingMethodEnum = pgEnum('enum_asset_risk_mapping_method', [
  'automatic',
  'manual',
  'hybrid',
  'agent_based',
  'scan_based'
]);

// Define enum for system asset assignment type
const assignmentTypeEnum = pgEnum('enum_system_assets_assignment_type', [
  'primary',
  'secondary',
  'shared',
  'direct'
]);

const assetCostManagement = pgTable('asset_cost_management', {
  id: serial('id').primaryKey(),
  costType: costTypeEnum('cost_type').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD'),
  billingCycle: billingCycleEnum('billing_cycle').default('one_time'),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  vendor: varchar('vendor', { length: 255 }),
  contractNumber: varchar('contract_number', { length: 255 }),
  purchaseOrder: varchar('purchase_order', { length: 255 }),
  invoiceNumber: varchar('invoice_number', { length: 255 }),
  costCenter: varchar('cost_center', { length: 255 }),
  budgetCode: varchar('budget_code', { length: 255 }),
  notes: text('notes'),
  attachments: jsonb('attachments').default('[]'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  lastModifiedBy: integer('last_modified_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid)
}, (table) => {
  return {
    // Indexes for performance optimization
    assetUuidIdx: index('idx_asset_cost_management_asset_uuid').on(table.assetUuid),
    costTypeIdx: index('idx_asset_cost_management_cost_type').on(table.costType),
    vendorIdx: index('idx_asset_cost_management_vendor').on(table.vendor),
    costCenterIdx: index('idx_asset_cost_management_cost_center').on(table.costCenter),
    createdAtIdx: index('idx_asset_cost_management_created_at').on(table.createdAt),
    amountIdx: index('idx_asset_cost_management_amount').on(table.amount)
  };
});

const assetGroups = pgTable('asset_groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid),
});

const assetGroupMembers = pgTable('asset_group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').references(() => assetGroups.id).notNull(),
  assetUuid: integer('asset_uuid').notNull().references(() => assets.id), // Note: This should probably be uuid type, but matching your schema
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const assetLifecycle = pgTable('asset_lifecycle', {
  id: serial('id').primaryKey(),
  purchaseDate: date('purchase_date'),
  warrantyEndDate: date('warranty_end_date'),
  manufacturerEolDate: date('manufacturer_eol_date'),
  internalEolDate: date('internal_eol_date'),
  replacementCycleMonths: integer('replacement_cycle_months'),
  estimatedReplacementCost: decimal('estimated_replacement_cost', { precision: 15, scale: 2 }),
  replacementBudgetYear: integer('replacement_budget_year'),
  replacementBudgetQuarter: integer('replacement_budget_quarter'),
  replacementNotes: text('replacement_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid)
}, (table) => {
  return {
    // Indexes for performance optimization
    assetUuidIdx: index('idx_asset_lifecycle_asset_uuid').on(table.assetUuid),
    warrantyEndDateIdx: index('idx_asset_lifecycle_warranty_end_date').on(table.warrantyEndDate),
    internalEolDateIdx: index('idx_asset_lifecycle_internal_eol_date').on(table.internalEolDate),
    replacementBudgetYearIdx: index('idx_asset_lifecycle_replacement_budget_year').on(table.replacementBudgetYear),
    purchaseDateIdx: index('idx_asset_lifecycle_purchase_date').on(table.purchaseDate),
    // Unique constraint to ensure one lifecycle record per asset
    assetUuidUnique: unique('asset_lifecycle_asset_uuid_unique').on(table.assetUuid)
  };
});

// Asset operational costs table
const assetOperationalCosts = pgTable('asset_operational_costs', {
  id: serial('id').primaryKey(),
  yearMonth: date('year_month').notNull(),
  powerCost: decimal('power_cost', { precision: 15, scale: 2 }),
  spaceCost: decimal('space_cost', { precision: 15, scale: 2 }),
  networkCost: decimal('network_cost', { precision: 15, scale: 2 }),
  storageCost: decimal('storage_cost', { precision: 15, scale: 2 }),
  laborCost: decimal('labor_cost', { precision: 15, scale: 2 }),
  otherCosts: decimal('other_costs', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid)
}, (table) => {
  return {
    // Indexes for performance optimization
    assetUuidIdx: index('idx_asset_operational_costs_asset_uuid').on(table.assetUuid),
    yearMonthIdx: index('idx_asset_operational_costs_year_month').on(table.yearMonth),
    assetYearMonthIdx: index('idx_asset_operational_costs_asset_year_month').on(table.assetUuid, table.yearMonth),
    // Unique constraint to prevent duplicate entries for same asset and month
    assetYearMonthUnique: unique('asset_operational_costs_asset_year_month_unique').on(table.assetUuid, table.yearMonth)
  };
});

// Asset risk mapping table
const assetRiskMapping = pgTable('asset_risk_mapping', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid),
  existingAssetId: integer('existing_asset_id'),
  riskModelId: integer('risk_model_id'),
  costCenterId: integer('cost_center_id'),
  mappingConfidence: decimal('mapping_confidence', { precision: 3, scale: 2 }).default('0.85'),
  mappingMethod: mappingMethodEnum('mapping_method').default('automatic'),
  mappingCriteria: jsonb('mapping_criteria'),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => {
  return {
    // Unique constraint on asset_uuid and existing_asset_id combination
    assetUuidExistingAssetKey: unique('asset_risk_mapping_asset_uuid_existing__key').on(table.assetUuid, table.existingAssetId),
    // Indexes for performance
    assetUuidIdx: index('idx_asset_risk_mapping_asset_uuid').on(table.assetUuid),
    existingAssetIdx: index('idx_asset_risk_mapping_existing_asset').on(table.existingAssetId),
    riskModelIdIdx: index('idx_asset_risk_mapping_risk_model_id').on(table.riskModelId),
    costCenterIdIdx: index('idx_asset_risk_mapping_cost_center_id').on(table.costCenterId),
    mappingMethodIdx: index('idx_asset_risk_mapping_mapping_method').on(table.mappingMethod),
    mappingConfidenceIdx: index('idx_asset_risk_mapping_mapping_confidence').on(table.mappingConfidence),
    verifiedByIdx: index('idx_asset_risk_mapping_verified_by').on(table.verifiedBy)
  };
});

// Asset Tags table
const assetTags = pgTable('asset_tags', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').notNull().references(() => assets.assetUuid, { onDelete: 'cascade' }),
  tagKey: varchar('tag_key', { length: 255 }).notNull(),
  tagValue: varchar('tag_value', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    assetUuidIdx: index('idx_asset_tags_asset_uuid').on(table.assetUuid),
    tagKeyIdx: index('idx_asset_tags_tag_key').on(table.tagKey),
    tagValueIdx: index('idx_asset_tags_tag_value').on(table.tagValue),
    tagKeyValueIdx: index('idx_asset_tags_key_value').on(table.tagKey, table.tagValue)
  };
});

// System Assets table (many-to-many relationship between systems and assets)
const systemAssets = pgTable('system_assets', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).notNull(),
  assetUuid: uuid('asset_uuid').notNull().references(() => assets.assetUuid, { onDelete: 'cascade' }),
  assignmentType: assignmentTypeEnum('assignment_type').default('direct'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    systemIdIdx: index('idx_system_assets_system_id').on(table.systemId),
    assetUuidIdx: index('idx_system_assets_asset_uuid').on(table.assetUuid),
    assignmentTypeIdx: index('idx_system_assets_assignment_type').on(table.assignmentType),
    systemAssetUniqueIdx: unique('unique_system_asset_assignment').on(table.systemId, table.assetUuid, table.assignmentType)
  };
});

module.exports = {
  assetCostManagement,
  assetGroups,
  assetGroupMembers,
  assetLifecycle,
  assetOperationalCosts,
  assetRiskMapping,
  assetTags,
  systemAssets,
  costTypeEnum,
  billingCycleEnum,
  mappingMethodEnum,
  assignmentTypeEnum,
};
