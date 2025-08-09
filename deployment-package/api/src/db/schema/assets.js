const { pgTable, serial, varchar, timestamp, boolean, jsonb, integer, uuid, numeric } = require('drizzle-orm/pg-core');
const { systems } = require('./systems');

const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').notNull().unique(),
  hostname: varchar('hostname', { length: 255 }),
  netbiosName: varchar('netbios_name', { length: 100 }),
  systemId: varchar('system_id', { length: 50 }).references(() => systems.systemId),
  hasAgent: boolean('has_agent').default(false),
  hasPluginResults: boolean('has_plugin_results').default(false),
  firstSeen: timestamp('first_seen'),
  lastSeen: timestamp('last_seen'),
  exposureScore: integer('exposure_score'),
  acrScore: numeric('acr_score', { precision: 3, scale: 1 }),
  criticalityRating: varchar('criticality_rating', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  source: varchar('source', { length: 50 }).default('tenable'),
  batchId: uuid('batch_id'),
  rawJson: jsonb('raw_json'),
});

const assetSystems = pgTable('asset_systems', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }),
  operatingSystem: varchar('operating_system', { length: 255 }),
  systemType: varchar('system_type', { length: 100 }),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

const systemAssets = pgTable('system_assets', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).references(() => systems.systemId, { onDelete: 'cascade' }),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }),
  assignmentType: varchar('assignment_type', { length: 50 }).default('direct'),
  createdAt: timestamp('created_at').defaultNow(),
});

const assetRiskMapping = pgTable('asset_risk_mapping', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid'),
  existingAssetId: integer('existing_asset_id'),
  riskModelId: integer('risk_model_id'),
  costCenterId: integer('cost_center_id'),
  mappingConfidence: numeric('mapping_confidence', { precision: 3, scale: 2 }).default('0.85'),
  mappingMethod: varchar('mapping_method', { length: 50 }).default('automatic'),
  mappingCriteria: jsonb('mapping_criteria'),
  verifiedBy: integer('verified_by'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

const assetTags = pgTable('asset_tags', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }),
  tagKey: varchar('tag_key', { length: 100 }).notNull(),
  tagValue: varchar('tag_value', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const assetNetwork = pgTable('asset_network', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }),
  fqdn: varchar('fqdn', { length: 255 }),
  ipv4Address: varchar('ipv4_address'), // Using inet type in SQL
  macAddress: varchar('mac_address'), // Using macaddr type in SQL
  networkType: varchar('network_type', { length: 50 }),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = {
  assets,
  assetSystems,
  systemAssets,
  assetRiskMapping,
  assetTags,
  assetNetwork,
};
