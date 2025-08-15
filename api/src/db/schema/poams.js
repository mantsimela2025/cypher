const { pgTable, serial, varchar, text, timestamp, jsonb, integer, uuid, date, boolean } = require('drizzle-orm/pg-core');
const { systems } = require('./systems');
const { assets } = require('./assets');
const { vulnerabilities } = require('./vulnerabilities');

const poams = pgTable('poams', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).notNull().unique(),
  systemId: varchar('system_id', { length: 50 }).references(() => systems.systemId, { onDelete: 'cascade' }),
  weaknessDescription: text('weakness_description').notNull(),
  securityControl: varchar('security_control', { length: 20 }),
  resources: text('resources'),
  scheduledCompletion: date('scheduled_completion'),
  poc: varchar('poc', { length: 255 }),
  status: varchar('status', { length: 50 }),
  riskRating: varchar('risk_rating', { length: 20 }),
  deviationRationale: text('deviation_rationale'),
  originalDetectionDate: date('original_detection_date'),
  weaknessSeverity: varchar('weakness_severity', { length: 20 }),
  residualRisk: varchar('residual_risk', { length: 20 }),
  threatRelevance: varchar('threat_relevance', { length: 50 }),
  likelihood: varchar('likelihood', { length: 20 }),
  impact: varchar('impact', { length: 20 }),
  mitigationStrategy: text('mitigation_strategy'),
  costEstimate: varchar('cost_estimate', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  source: varchar('source', { length: 50 }).default('xacta'),
  batchId: uuid('batch_id'),
  rawJson: jsonb('raw_json'),
});

const poamAssets = pgTable('poam_assets', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).references(() => poams.poamId, { onDelete: 'cascade' }),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
});

const poamCves = pgTable('poam_cves', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).references(() => poams.poamId, { onDelete: 'cascade' }),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

const poamMilestones = pgTable('poam_milestones', {
  id: serial('id').primaryKey(),
  poamId: varchar('poam_id', { length: 50 }).references(() => poams.poamId, { onDelete: 'cascade' }),
  milestoneOrder: integer('milestone_order').notNull(),
  description: text('description').notNull(),
  targetDate: date('target_date'),
  status: varchar('status', { length: 50 }),
  completionDate: date('completion_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

const vulnerabilityPoams = pgTable('vulnerability_poams', {
  id: serial('id').primaryKey(),
  vulnerabilityId: integer('vulnerability_id').references(() => vulnerabilities.id, { onDelete: 'cascade' }),
  poamId: varchar('poam_id', { length: 50 }).references(() => poams.poamId, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).default('addresses'),
  createdAt: timestamp('created_at').defaultNow(),
});

const poamSignatures = pgTable('poam_signatures', {
  id: serial('id').primaryKey(),
  poamId: integer('poam_id').references(() => poams.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').notNull(), // Reference to users table
  role: text('role').notNull(),
  signatureDate: timestamp('signature_date', { withTimezone: true }).defaultNow().notNull(),
  verificationCode: text('verification_code').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  additionalNotes: text('additional_notes'),
});

module.exports = {
  poams,
  poamAssets,
  poamCves,
  poamMilestones,
  vulnerabilityPoams,
  poamSignatures,
};
