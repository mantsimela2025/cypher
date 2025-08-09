const { pgTable, serial, varchar, text, timestamp, decimal, boolean, integer } = require('drizzle-orm/pg-core');
const { vulnerabilities } = require('./vulnerabilities');

const cves = pgTable('cves', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  description: text('description').notNull(),
  publishedDate: timestamp('published_date', { withTimezone: true }),
  lastModifiedDate: timestamp('last_modified_date', { withTimezone: true }),
  cvss2BaseScore: decimal('cvss2_base_score', { precision: 15, scale: 2 }),
  cvss2Vector: varchar('cvss2_vector', { length: 100 }),
  cvss3BaseScore: decimal('cvss3_base_score', { precision: 15, scale: 2 }),
  cvss3Vector: varchar('cvss3_vector', { length: 100 }),
  exploitAvailable: boolean('exploit_available').default(false).notNull(),
  patchAvailable: boolean('patch_available').default(false).notNull(),
  source: varchar('source', { length: 50 }).default('NVD').notNull(),
  remediationGuidance: text('remediation_guidance'),
  searchVector: text('search_vector'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const cveMappings = pgTable('cve_mappings', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  cweId: varchar('cwe_id', { length: 20 }).notNull(),
  cweName: text('cwe_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

const vulnerabilityCves = pgTable('vulnerability_cves', {
  id: serial('id').primaryKey(),
  vulnerabilityId: integer('vulnerability_id').references(() => vulnerabilities.id).notNull(),
  cveId: integer('cve_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  cves,
  cveMappings,
  vulnerabilityCves,
};
