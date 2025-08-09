const { pgTable, serial, varchar, text, timestamp, decimal, jsonb, integer, uuid, index } = require('drizzle-orm/pg-core');
const { assets } = require('./assets');

const vulnerabilities = pgTable('vulnerabilities', {
  id: serial('id').primaryKey(),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }),
  pluginId: integer('plugin_id').notNull(),
  pluginName: text('plugin_name').notNull(),
  pluginFamily: varchar('plugin_family', { length: 255 }),
  severity: integer('severity'),
  severityName: varchar('severity_name', { length: 20 }),
  cvssBaseScore: decimal('cvss_base_score', { precision: 3, scale: 1 }),
  cvss3BaseScore: decimal('cvss3_base_score', { precision: 3, scale: 1 }),
  description: text('description'),
  solution: text('solution'),
  riskFactor: varchar('risk_factor', { length: 20 }),
  firstFound: timestamp('first_found'),
  lastFound: timestamp('last_found'),
  state: varchar('state', { length: 20 }).default('Open'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  source: varchar('source', { length: 50 }).default('tenable'),
  batchId: uuid('batch_id'),
  rawJson: jsonb('raw_json'),
}, (table) => {
  return {
    lastFoundIdx: index('idx_vulnerabilities_last_found').on(table.lastFound),
  };
});

const vulnerabilityReferences = pgTable('vulnerability_references', {
  id: serial('id').primaryKey(),
  vulnerabilityId: integer('vulnerability_id').references(() => vulnerabilities.id, { onDelete: 'cascade' }),
  referenceUrl: text('reference_url').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

const vulnerabilityRiskScores = pgTable('vulnerability_risk_scores', {
  id: serial('id').primaryKey(),
  vulnerabilityId: integer('vulnerability_id').references(() => vulnerabilities.id).notNull(),
  modelId: integer('model_id').notNull(),
  score: text('score').notNull(),
  confidence: text('confidence'),
  factors: jsonb('factors').default('{}'),
  lastCalculated: timestamp('last_calculated', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  vulnerabilities,
  vulnerabilityReferences,
  vulnerabilityRiskScores,
};
