const { pgTable, serial, varchar, text, timestamp, jsonb, uuid } = require('drizzle-orm/pg-core');

const systems = pgTable('systems', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  uuid: uuid('uuid').notNull().unique(),
  status: varchar('status', { length: 50 }).notNull(),
  authorizationBoundary: text('authorization_boundary'),
  systemType: varchar('system_type', { length: 100 }),
  responsibleOrganization: varchar('responsible_organization', { length: 255 }),
  systemOwner: varchar('system_owner', { length: 255 }),
  informationSystemSecurityOfficer: varchar('information_system_security_officer', { length: 255 }),
  authorizingOfficial: varchar('authorizing_official', { length: 255 }),
  lastAssessmentDate: timestamp('last_assessment_date'),
  authorizationDate: timestamp('authorization_date'),
  authorizationTerminationDate: timestamp('authorization_termination_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  source: varchar('source', { length: 50 }).default('xacta'),
  batchId: uuid('batch_id'),
  rawJson: jsonb('raw_json'),
  confidentialityImpact: varchar('confidentiality_impact', { length: 20 }),
  integrityImpact: varchar('integrity_impact', { length: 20 }),
  availabilityImpact: varchar('availability_impact', { length: 20 }),
});

const systemImpactLevels = pgTable('system_impact_levels', {
  id: serial('id').primaryKey(),
  systemId: varchar('system_id', { length: 50 }).references(() => systems.systemId, { onDelete: 'cascade' }),
  confidentiality: varchar('confidentiality', { length: 20 }).notNull(),
  integrity: varchar('integrity', { length: 20 }).notNull(),
  availability: varchar('availability', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

module.exports = {
  systems,
  systemImpactLevels,
};
