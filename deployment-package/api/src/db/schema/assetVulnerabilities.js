const { pgTable, serial, varchar, text, timestamp, jsonb, integer, numeric, pgEnum } = require('drizzle-orm/pg-core');
const { assets } = require('./assets');
const { vulnerabilities } = require('./vulnerabilities');

// Define enum for detection status
const detectionStatusEnum = pgEnum('enum_asset_vulnerabilities_detection_status', [
  'detected',
  'confirmed',
  'false_positive',
  'mitigated',
  'resolved'
]);

const assetVulnerabilities = pgTable('asset_vulnerabilities', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id).notNull(),
  vulnerabilityId: integer('vulnerability_id').references(() => vulnerabilities.id).notNull(),
  detectionStatus: detectionStatusEnum('detection_status').default('detected'),
  firstDetected: timestamp('first_detected', { withTimezone: true }).defaultNow(),
  lastDetected: timestamp('last_detected', { withTimezone: true }).defaultNow(),
  detectionMethod: varchar('detection_method', { length: 255 }),
  scanId: varchar('scan_id', { length: 255 }),
  evidence: jsonb('evidence').default('{}'),
  riskScore: numeric('risk_score', { precision: 15, scale: 2 }),
  exploitability: varchar('exploitability', { length: 255 }),
  businessImpact: varchar('business_impact', { length: 255 }),
  mitigationStatus: varchar('mitigation_status', { length: 255 }),
  mitigatedAt: timestamp('mitigated_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  assetVulnerabilities,
  detectionStatusEnum,
};
