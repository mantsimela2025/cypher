const { pgTable, serial, varchar, text, timestamp, jsonb, integer, uuid, date, boolean } = require('drizzle-orm/pg-core');
const { systems } = require('./systems');
const { poams } = require('./poams');
const { users } = require('./users');

const controls = pgTable('controls', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).references(() => systems.systemId, { onDelete: 'cascade' }),
  controlId: varchar('control_id', { length: 20 }).notNull(),
  controlTitle: varchar('control_title', { length: 255 }).notNull(),
  family: varchar('family', { length: 100 }),
  priority: varchar('priority', { length: 10 }),
  implementationStatus: varchar('implementation_status', { length: 50 }),
  assessmentStatus: varchar('assessment_status', { length: 50 }),
  responsibleRole: varchar('responsible_role', { length: 255 }),
  lastAssessed: timestamp('last_assessed'),
  implementationGuidance: text('implementation_guidance'),
  residualRisk: varchar('residual_risk', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  source: varchar('source', { length: 50 }).default('xacta'),
  batchId: uuid('batch_id'),
  rawJson: jsonb('raw_json'),
});

const controlEvidence = pgTable('control_evidence', {
  id: serial('id').primaryKey(),
  controlId: integer('control_id').references(() => controls.id, { onDelete: 'cascade' }),
  evidenceId: varchar('evidence_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  evidenceType: varchar('evidence_type', { length: 100 }),
  location: text('location'),
  uploadDate: date('upload_date'),
  createdAt: timestamp('created_at').defaultNow(),
});

const controlFindings = pgTable('control_findings', {
  id: serial('id').primaryKey(),
  controlId: integer('control_id').references(() => controls.id, { onDelete: 'cascade' }),
  findingId: varchar('finding_id', { length: 50 }).notNull(),
  severity: varchar('severity', { length: 20 }),
  description: text('description').notNull(),
  recommendation: text('recommendation'),
  targetDate: date('target_date'),
  poc: varchar('poc', { length: 255 }),
  status: varchar('status', { length: 50 }).default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

const controlInheritance = pgTable('control_inheritance', {
  id: serial('id').primaryKey(),
  controlId: integer('control_id').references(() => controls.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 255 }),
  description: text('description'),
  responsibility: varchar('responsibility', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow(),
});

const controlPoams = pgTable('control_poams', {
  id: serial('id').primaryKey(),
  controlId: integer('control_id').references(() => controls.id, { onDelete: 'cascade' }),
  poamId: varchar('poam_id', { length: 50 }).references(() => poams.poamId, { onDelete: 'cascade' }),
  relationshipType: varchar('relationship_type', { length: 50 }).default('remediates'),
  createdAt: timestamp('created_at').defaultNow(),
});

const poamApprovalComments = pgTable('poam_approval_comments', {
  id: serial('id').primaryKey(),
  poamId: integer('poam_id').notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  comment: text('comment').notNull(),
  approvalStep: text('approval_step'),
  isInternal: boolean('is_internal').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  controls,
  controlEvidence,
  controlFindings,
  controlInheritance,
  controlPoams,
  poamApprovalComments,
};
