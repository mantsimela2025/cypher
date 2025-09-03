const { pgView, serial, uuid, varchar, boolean, timestamp, integer, numeric, text, date, bigint } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');

// Database views for comprehensive asset details with proper column definitions
const assetDetailView = pgView("asset_detail_view", {
  asset_id: integer('asset_id'),
  asset_uuid: uuid('asset_uuid'),
  hostname: varchar('hostname', { length: 255 }),
  netbios_name: varchar('netbios_name', { length: 100 }),
  system_id: varchar('system_id', { length: 50 }),
  has_agent: boolean('has_agent'),
  has_plugin_results: boolean('has_plugin_results'),
  first_seen: timestamp('first_seen'),
  last_seen: timestamp('last_seen'),
  exposure_score: integer('exposure_score'),
  acr_score: numeric('acr_score', { precision: 3, scale: 1 }),
  criticality_rating: varchar('criticality_rating', { length: 20 }),
  source: varchar('source', { length: 50 }),
  asset_created_at: timestamp('asset_created_at'),
  asset_updated_at: timestamp('asset_updated_at'),
  system_name: varchar('system_name', { length: 255 }),
  system_type: varchar('system_type', { length: 100 }),
  system_environment: varchar('system_environment', { length: 50 }),
  responsible_organization: varchar('responsible_organization', { length: 255 }),
  system_owner: varchar('system_owner', { length: 255 }),
  authorizing_official: varchar('authorizing_official', { length: 255 }),
  system_status: varchar('system_status', { length: 50 }),
  authorization_boundary: text('authorization_boundary'),
  fqdn: varchar('fqdn', { length: 255 }),
  ipv4_address: varchar('ipv4_address'), // inet type
  mac_address: varchar('mac_address'), // macaddr type
  network_type: varchar('network_type', { length: 50 }),
  operating_system: varchar('operating_system', { length: 255 }),
  asset_system_type: varchar('asset_system_type', { length: 100 }),
  is_primary_system: boolean('is_primary_system'),
  purchase_date: date('purchase_date'),
  warranty_end_date: date('warranty_end_date'),
  manufacturer_eol_date: date('manufacturer_eol_date'),
  internal_eol_date: date('internal_eol_date'),
  replacement_cycle_months: integer('replacement_cycle_months'),
  estimated_replacement_cost: numeric('estimated_replacement_cost', { precision: 12, scale: 2 }),
  vulnerability_count: bigint('vulnerability_count', { mode: 'number' }),
  active_vulnerability_count: bigint('active_vulnerability_count', { mode: 'number' }),
  cost_record_count: bigint('cost_record_count', { mode: 'number' }),
  total_cost: numeric('total_cost', { precision: 12, scale: 2 }),
  tag_count: bigint('tag_count', { mode: 'number' })
}).as(sql`SELECT * FROM asset_detail_view`);

const assetNetworkDetailView = pgView("asset_network_detail_view", {
  asset_uuid: uuid('asset_uuid'),
  hostname: varchar('hostname', { length: 255 }),
  network_interfaces: text('network_interfaces') // JSON field
}).as(sql`SELECT * FROM asset_network_detail_view`);

const assetVulnerabilitiesSummaryView = pgView("asset_vulnerabilities_summary_view", {
  asset_uuid: uuid('asset_uuid'),
  hostname: varchar('hostname', { length: 255 }),
  total_vulnerabilities: bigint('total_vulnerabilities', { mode: 'number' }),
  active_vulnerabilities: bigint('active_vulnerabilities', { mode: 'number' }),
  mitigated_vulnerabilities: bigint('mitigated_vulnerabilities', { mode: 'number' }),
  confirmed_vulnerabilities: bigint('confirmed_vulnerabilities', { mode: 'number' }),
  false_positive_vulnerabilities: bigint('false_positive_vulnerabilities', { mode: 'number' }),
  critical_vulnerabilities: bigint('critical_vulnerabilities', { mode: 'number' }),
  high_vulnerabilities: bigint('high_vulnerabilities', { mode: 'number' }),
  avg_risk_score: numeric('avg_risk_score', { precision: 5, scale: 2 })
}).as(sql`SELECT * FROM asset_vulnerabilities_summary_view`);

const assetCostSummaryView = pgView("asset_cost_summary_view", {
  asset_uuid: uuid('asset_uuid'),
  hostname: varchar('hostname', { length: 255 }),
  cost_record_count: bigint('cost_record_count', { mode: 'number' }),
  total_amount: numeric('total_amount', { precision: 12, scale: 2 }),
  acquisition_costs: numeric('acquisition_costs', { precision: 12, scale: 2 }),
  maintenance_costs: numeric('maintenance_costs', { precision: 12, scale: 2 }),
  licensing_costs: numeric('licensing_costs', { precision: 12, scale: 2 }),
  operational_costs: numeric('operational_costs', { precision: 12, scale: 2 }),
  cost_details: text('cost_details') // JSON field
}).as(sql`SELECT * FROM asset_cost_summary_view`);

const assetTagsView = pgView("asset_tags_view", {
  asset_uuid: uuid('asset_uuid'),
  hostname: varchar('hostname', { length: 255 }),
  tags: text('tags') // JSON field
}).as(sql`SELECT * FROM asset_tags_view`);

const assetCompleteDetailView = pgView("asset_complete_detail_view", {
  // All fields from asset_detail_view
  asset_id: integer('asset_id'),
  asset_uuid: uuid('asset_uuid'),
  hostname: varchar('hostname', { length: 255 }),
  netbios_name: varchar('netbios_name', { length: 100 }),
  system_id: varchar('system_id', { length: 50 }),
  has_agent: boolean('has_agent'),
  has_plugin_results: boolean('has_plugin_results'),
  first_seen: timestamp('first_seen'),
  last_seen: timestamp('last_seen'),
  exposure_score: integer('exposure_score'),
  acr_score: numeric('acr_score', { precision: 3, scale: 1 }),
  criticality_rating: varchar('criticality_rating', { length: 20 }),
  source: varchar('source', { length: 50 }),
  asset_created_at: timestamp('asset_created_at'),
  asset_updated_at: timestamp('asset_updated_at'),
  system_name: varchar('system_name', { length: 255 }),
  system_type: varchar('system_type', { length: 100 }),
  system_environment: varchar('system_environment', { length: 50 }),
  responsible_organization: varchar('responsible_organization', { length: 255 }),
  system_owner: varchar('system_owner', { length: 255 }),
  authorizing_official: varchar('authorizing_official', { length: 255 }),
  system_status: varchar('system_status', { length: 50 }),
  authorization_boundary: text('authorization_boundary'),
  fqdn: varchar('fqdn', { length: 255 }),
  ipv4_address: varchar('ipv4_address'),
  mac_address: varchar('mac_address'),
  network_type: varchar('network_type', { length: 50 }),
  operating_system: varchar('operating_system', { length: 255 }),
  asset_system_type: varchar('asset_system_type', { length: 100 }),
  is_primary_system: boolean('is_primary_system'),
  purchase_date: date('purchase_date'),
  warranty_end_date: date('warranty_end_date'),
  manufacturer_eol_date: date('manufacturer_eol_date'),
  internal_eol_date: date('internal_eol_date'),
  replacement_cycle_months: integer('replacement_cycle_months'),
  estimated_replacement_cost: numeric('estimated_replacement_cost', { precision: 12, scale: 2 }),
  vulnerability_count: bigint('vulnerability_count', { mode: 'number' }),
  active_vulnerability_count: bigint('active_vulnerability_count', { mode: 'number' }),
  cost_record_count: bigint('cost_record_count', { mode: 'number' }),
  total_cost: numeric('total_cost', { precision: 12, scale: 2 }),
  tag_count: bigint('tag_count', { mode: 'number' }),
  // Additional fields from other views
  total_vulnerabilities: bigint('total_vulnerabilities', { mode: 'number' }),
  active_vulnerabilities: bigint('active_vulnerabilities', { mode: 'number' }),
  mitigated_vulnerabilities: bigint('mitigated_vulnerabilities', { mode: 'number' }),
  confirmed_vulnerabilities: bigint('confirmed_vulnerabilities', { mode: 'number' }),
  false_positive_vulnerabilities: bigint('false_positive_vulnerabilities', { mode: 'number' }),
  critical_vulnerabilities: bigint('critical_vulnerabilities', { mode: 'number' }),
  high_vulnerabilities: bigint('high_vulnerabilities', { mode: 'number' }),
  avg_risk_score: numeric('avg_risk_score', { precision: 5, scale: 2 }),
  total_cost_amount: numeric('total_cost_amount', { precision: 12, scale: 2 }), // Fixed: was total_amount
  acquisition_costs: numeric('acquisition_costs', { precision: 12, scale: 2 }),
  maintenance_costs: numeric('maintenance_costs', { precision: 12, scale: 2 }),
  licensing_costs: numeric('licensing_costs', { precision: 12, scale: 2 }),
  operational_costs: numeric('operational_costs', { precision: 12, scale: 2 }),
  tags: text('tags')
}).as(sql`SELECT * FROM asset_complete_detail_view`);

module.exports = {
  assetDetailView,
  assetNetworkDetailView,
  assetVulnerabilitiesSummaryView,
  assetCostSummaryView,
  assetTagsView,
  assetCompleteDetailView
};