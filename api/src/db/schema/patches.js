const { pgTable, serial, varchar, text, timestamp, boolean, integer, uuid, pgEnum, decimal, jsonb, index } = require('drizzle-orm/pg-core');
const { vulnerabilities } = require('./vulnerabilities');
const { assets } = require('./assets');
const { users } = require('./users');

// Enums for patch management
const patchManagementStatusEnum = pgEnum('patch_management_status', [
  'available',
  'pending_approval',
  'approved',
  'scheduled',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
  'superseded'
]);

const patchSeverityEnum = pgEnum('patch_severity', [
  'critical',
  'high', 
  'medium',
  'low',
  'informational'
]);

const patchTypeEnum = pgEnum('patch_type', [
  'security',
  'bug_fix',
  'feature',
  'enhancement',
  'maintenance'
]);

const patchVendorEnum = pgEnum('patch_vendor', [
  'microsoft',
  'redhat',
  'ubuntu',
  'centos',
  'debian',
  'oracle',
  'vmware',
  'cisco',
  'other'
]);

// Main patches table - matches public.patches (existing DB)
const patches = pgTable('patches', {
  id: uuid('id').primaryKey().defaultRandom(),
  patchId: varchar('patch_id', { length: 100 }).notNull().unique(), // KB123456, CVE-2024-1234, etc.
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  vendor: patchVendorEnum('vendor').notNull(),
  vendorAdvisoryId: varchar('vendor_advisory_id', { length: 100 }),
  severity: patchSeverityEnum('severity').notNull(),
  type: patchTypeEnum('type').notNull(),
  status: patchManagementStatusEnum('status').default('available').notNull(),
  releaseDate: timestamp('release_date'),
  supersededBy: varchar('superseded_by', { length: 100 }),
  supersedes: text('supersedes'), // JSON array of patch IDs this supersedes
  cveIds: text('cve_ids'), // Comma-separated CVE IDs
  affectedProducts: text('affected_products'), // JSON array of affected products
  prerequisites: text('prerequisites'), // JSON array of prerequisite patches
  rebootRequired: boolean('reboot_required').default(false),
  downloadUrl: text('download_url'),
  downloadSize: integer('download_size'), // Size in bytes
  installationNotes: text('installation_notes'),
  uninstallationNotes: text('uninstallation_notes'),
  testingNotes: text('testing_notes'),
  knownIssues: text('known_issues'), // JSON array of known issues
  rollbackInstructions: text('rollback_instructions'),
  complianceFrameworks: text('compliance_frameworks'), // JSON array (NIST, ISO27001, etc.)
  businessImpact: varchar('business_impact', { length: 50 }), // low, medium, high, critical
  technicalComplexity: varchar('technical_complexity', { length: 50 }), // low, medium, high
  estimatedDowntime: integer('estimated_downtime'), // Minutes
  source: varchar('source', { length: 50 }).default('manual'),
  batchId: uuid('batch_id'),
  rawJson: jsonb('raw_json'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    patchIdIdx: index('idx_patches_patch_id').on(table.patchId),
    vendorIdx: index('idx_patches_vendor').on(table.vendor),
    severityIdx: index('idx_patches_severity').on(table.severity),
    statusIdx: index('idx_patches_status').on(table.status),
    releaseDateIdx: index('idx_patches_release_date').on(table.releaseDate),
  };
});

// Patch vulnerabilities mapping - links patches to vulnerabilities they address
const patchVulnerabilities = pgTable('patch_vulnerabilities', {
  id: serial('id').primaryKey(),
  patchId: uuid('patch_id').references(() => patches.id, { onDelete: 'cascade' }).notNull(),
  vulnerabilityId: integer('vulnerability_id').references(() => vulnerabilities.id, { onDelete: 'cascade' }).notNull(),
  effectiveness: varchar('effectiveness', { length: 20 }).default('complete').notNull(), // complete, partial, preventive
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    patchVulnIdx: index('idx_patch_vulnerabilities_patch_vuln').on(table.patchId, table.vulnerabilityId),
  };
});

// Patch assets mapping - tracks which assets are affected by patches
const patchAssets = pgTable('patch_assets', {
  id: serial('id').primaryKey(),
  patchId: uuid('patch_id').references(() => patches.id, { onDelete: 'cascade' }).notNull(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }).notNull(),
  isApplicable: boolean('is_applicable').default(true).notNull(),
  isInstalled: boolean('is_installed').default(false).notNull(),
  installationDate: timestamp('installation_date'),
  installationStatus: varchar('installation_status', { length: 50 }), // pending, success, failed, cancelled
  installationNotes: text('installation_notes'),
  detectedVersion: varchar('detected_version', { length: 100 }),
  targetVersion: varchar('target_version', { length: 100 }),
  lastScanned: timestamp('last_scanned'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    patchAssetIdx: index('idx_patch_assets_patch_asset').on(table.patchId, table.assetUuid),
    assetApplicableIdx: index('idx_patch_assets_applicable').on(table.assetUuid, table.isApplicable),
    assetInstalledIdx: index('idx_patch_assets_installed').on(table.assetUuid, table.isInstalled),
  };
});

// Patch dependencies - tracks prerequisite and conflicting patches
const patchDependencies = pgTable('patch_dependencies', {
  id: serial('id').primaryKey(),
  patchId: uuid('patch_id').references(() => patches.id, { onDelete: 'cascade' }).notNull(),
  dependentPatchId: uuid('dependent_patch_id').references(() => patches.id, { onDelete: 'cascade' }).notNull(),
  dependencyType: varchar('dependency_type', { length: 50 }).notNull(), // prerequisite, conflicts_with, supersedes
  isOptional: boolean('is_optional').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

module.exports = {
  patches,
  patchVulnerabilities,
  patchAssets,
  patchDependencies,
  patchManagementStatusEnum,
  patchSeverityEnum,
  patchTypeEnum,
  patchVendorEnum,
};