const { pgTable, serial, varchar, text, timestamp, jsonb, pgEnum } = require('drizzle-orm/pg-core');

// Define enums for compliance controls
const controlStatusEnum = pgEnum('control_status', [
  'not_implemented',
  'planned',
  'partially_implemented', 
  'implemented',
  'not_applicable'
]);

const implementationStatusEnum = pgEnum('implementation_status', [
  'not_implemented',
  'planned',
  'partially_implemented',
  'fully_implemented',
  'not_applicable'
]);

const assessmentStatusEnum = pgEnum('assessment_status', [
  'not_assessed',
  'pending',
  'in_progress',
  'assessed',
  'overdue'
]);

const complianceControls = pgTable('compliance_controls', {
  id: serial('id').primaryKey(),
  controlId: varchar('control_id', { length: 50 }).notNull().unique(), // e.g., 'AC-1', 'SC-7'
  family: varchar('family', { length: 100 }).notNull(), // e.g., 'Access Control', 'System and Communications Protection'
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  baseline: varchar('baseline', { length: 20 }), // 'Low', 'Moderate', 'High'
  priority: varchar('priority', { length: 10 }), // 'P0', 'P1', 'P2', 'P3'
  status: controlStatusEnum('status').default('not_implemented'),
  implementationStatus: implementationStatusEnum('implementation_status').default('not_implemented'),
  assessmentStatus: assessmentStatusEnum('assessment_status').default('not_assessed'),
  responsibleRole: varchar('responsible_role', { length: 200 }),
  implementationGuidance: text('implementation_guidance'),
  assessmentProcedures: text('assessment_procedures'),
  references: jsonb('references').default([]), // Array of reference documents
  lastAssessed: timestamp('last_assessed', { withTimezone: true }),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  source: varchar('source', { length: 50 }).notNull(), // 'xacta', 'manual', etc.
  rawData: jsonb('raw_data'), // Store original API response
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  complianceControls,
  controlStatusEnum,
  implementationStatusEnum,
  assessmentStatusEnum,
};
