const { pgTable, serial, varchar, text, integer, timestamp, jsonb, pgEnum } = require('drizzle-orm/pg-core');

// Enums for scan-related fields
const scanTypeEnum = pgEnum('scan_type', ['internal', 'vulnerability', 'compliance', 'web']);
const scanStatusEnum = pgEnum('scan_status', ['pending', 'running', 'completed', 'failed', 'cancelled']);

// Scan Jobs table - tracks all scan executions
const scanJobs = pgTable('scan_jobs', {
  id: serial('id').primaryKey(),
  scanType: scanTypeEnum('scan_type').notNull(),
  target: varchar('target', { length: 255 }).notNull(),
  configuration: jsonb('configuration').default({}),
  status: scanStatusEnum('status').default('pending').notNull(),
  initiatedBy: integer('initiated_by').references(() => require('./users').users.id).notNull(),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Scan Results table - stores scan output and findings
const scanResults = pgTable('scan_results', {
  id: serial('id').primaryKey(),
  scanJobId: integer('scan_job_id').references(() => scanJobs.id, { onDelete: 'cascade' }).notNull(),
  scanType: scanTypeEnum('scan_type').notNull(),
  target: varchar('target', { length: 255 }).notNull(),
  results: jsonb('results').notNull(),
  summary: jsonb('summary').default({}),
  filePath: varchar('file_path', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Scan Schedules table - for scheduled/recurring scans
const scanSchedules = pgTable('scan_schedules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scanType: scanTypeEnum('scan_type').notNull(),
  target: varchar('target', { length: 255 }).notNull(),
  configuration: jsonb('configuration').default({}),
  schedule: varchar('schedule', { length: 100 }).notNull(), // Cron expression
  enabled: integer('enabled').default(1).notNull(), // 1 = enabled, 0 = disabled
  createdBy: integer('created_by').references(() => require('./users').users.id).notNull(),
  lastRun: timestamp('last_run'),
  nextRun: timestamp('next_run'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Scan Templates table - predefined scan configurations
const scanTemplates = pgTable('scan_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  scanType: scanTypeEnum('scan_type').notNull(),
  configuration: jsonb('configuration').notNull(),
  isDefault: integer('is_default').default(0).notNull(), // 1 = default template, 0 = custom
  createdBy: integer('created_by').references(() => require('./users').users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Scan Targets table - managed scan targets with metadata
const scanTargets = pgTable('scan_targets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  target: varchar('target', { length: 255 }).notNull(), // IP, hostname, or range
  targetType: varchar('target_type', { length: 50 }).notNull(), // 'host', 'network', 'url'
  credentials: jsonb('credentials'), // Encrypted credentials for authenticated scans
  tags: jsonb('tags').default([]),
  metadata: jsonb('metadata').default({}),
  enabled: integer('enabled').default(1).notNull(),
  createdBy: integer('created_by').references(() => require('./users').users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Scan Policies table - compliance and security policies for scans
const scanPolicies = pgTable('scan_policies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  policyType: varchar('policy_type', { length: 50 }).notNull(), // 'compliance', 'security', 'custom'
  framework: varchar('framework', { length: 50 }), // 'nist', 'cis', 'pci', etc.
  rules: jsonb('rules').notNull(),
  enabled: integer('enabled').default(1).notNull(),
  createdBy: integer('created_by').references(() => require('./users').users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Scan Findings table - individual findings from scans
const scanFindings = pgTable('scan_findings', {
  id: serial('id').primaryKey(),
  scanResultId: integer('scan_result_id').references(() => scanResults.id, { onDelete: 'cascade' }).notNull(),
  findingType: varchar('finding_type', { length: 50 }).notNull(), // 'vulnerability', 'compliance', 'configuration'
  severity: varchar('severity', { length: 20 }).notNull(), // 'low', 'medium', 'high', 'critical'
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  recommendation: text('recommendation'),
  cveId: varchar('cve_id', { length: 20 }),
  cvssScore: varchar('cvss_score', { length: 10 }),
  port: integer('port'),
  service: varchar('service', { length: 100 }),
  evidence: jsonb('evidence'),
  status: varchar('status', { length: 20 }).default('open').notNull(), // 'open', 'resolved', 'false_positive', 'accepted_risk'
  assignedTo: integer('assigned_to').references(() => require('./users').users.id),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: integer('resolved_by').references(() => require('./users').users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Scan Reports table - generated reports from scan results
const scanReports = pgTable('scan_reports', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  reportType: varchar('report_type', { length: 50 }).notNull(), // 'executive', 'technical', 'compliance'
  scanJobIds: jsonb('scan_job_ids').notNull(), // Array of scan job IDs included in report
  format: varchar('format', { length: 20 }).default('pdf').notNull(), // 'pdf', 'html', 'json'
  filePath: varchar('file_path', { length: 500 }),
  generatedBy: integer('generated_by').references(() => require('./users').users.id).notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  downloadCount: integer('download_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

module.exports = {
  scanJobs,
  scanResults,
  scanSchedules,
  scanTemplates,
  scanTargets,
  scanPolicies,
  scanFindings,
  scanReports,
  scanTypeEnum,
  scanStatusEnum
};
