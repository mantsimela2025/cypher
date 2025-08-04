const { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, pgEnum } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for SIEM system
const siemAlertSeverityEnum = pgEnum('enum_siem_alerts_severity', [
  'low',
  'medium', 
  'high',
  'critical'
]);

const siemAlertStatusEnum = pgEnum('enum_siem_alerts_status', [
  'new',
  'investigating',
  'resolved',
  'false_positive',
  'closed'
]);

const siemEventSeverityEnum = pgEnum('enum_siem_events_severity', [
  'low',
  'medium',
  'high', 
  'critical'
]);

const siemEventStatusEnum = pgEnum('enum_siem_events_status', [
  'new',
  'investigating',
  'resolved',
  'false_positive',
  'closed'
]);

const siemRuleTypeEnum = pgEnum('enum_siem_rules_rule_type', [
  'correlation',
  'threshold',
  'anomaly',
  'signature',
  'behavioral',
  'statistical'
]);

const siemRuleSeverityEnum = pgEnum('enum_siem_rules_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

// SIEM Log Sources - Configuration for different log sources
const siemLogSources = pgTable('siem_log_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 255 }).notNull(), // syslog, api, file, database, etc.
  endpoint: varchar('endpoint', { length: 255 }), // URL, file path, etc.
  status: varchar('status', { length: 255 }).default('active'), // active, inactive, error
  configuration: jsonb('configuration').default('{}'), // Source-specific config
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SIEM Rules - Detection rules and correlation logic
const siemRules = pgTable('siem_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ruleType: siemRuleTypeEnum('rule_type').notNull(),
  pattern: text('pattern'), // Regex pattern, SQL query, etc.
  conditions: jsonb('conditions').default('{}'), // Rule conditions and logic
  severity: siemRuleSeverityEnum('severity').default('medium'),
  enabled: boolean('enabled').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SIEM Events - Individual security events
const siemEvents = pgTable('siem_events', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').references(() => siemLogSources.id),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  sourceTimestamp: timestamp('source_timestamp', { withTimezone: true }),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  severity: siemEventSeverityEnum('severity').default('low'),
  status: siemEventStatusEnum('status').default('new'),
  summary: varchar('summary', { length: 255 }).notNull(),
  details: jsonb('details').default('{}').notNull(),
  rawData: text('raw_data'), // Original log data
  sourceIp: varchar('source_ip', { length: 255 }),
  destinationIp: varchar('destination_ip', { length: 255 }),
  username: varchar('username', { length: 255 }),
  processName: varchar('process_name', { length: 255 }),
  resourceId: varchar('resource_id', { length: 255 }),
  assignedTo: integer('assigned_to').references(() => users.id),
  investigationNotes: text('investigation_notes'),
  remediationNotes: text('remediation_notes'),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow(),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SIEM Alerts - Correlated alerts from multiple events
const siemAlerts = pgTable('siem_alerts', {
  id: serial('id').primaryKey(),
  ruleId: integer('rule_id').references(() => siemRules.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  severity: siemAlertSeverityEnum('severity').default('medium'),
  status: siemAlertStatusEnum('status').default('new'),
  firstSeen: timestamp('first_seen', { withTimezone: true }).defaultNow(),
  lastSeen: timestamp('last_seen', { withTimezone: true }).defaultNow(),
  eventCount: integer('event_count').default(1),
  relatedEvents: integer('related_events').array().default([]), // Array of event IDs
  assignedTo: integer('assigned_to').references(() => users.id),
  investigationNotes: text('investigation_notes'),
  remediationNotes: text('remediation_notes'),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SIEM Dashboards - Custom dashboard configurations
const siemDashboards = pgTable('siem_dashboards', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  layout: jsonb('layout').default('{}'), // Dashboard layout configuration
  filters: jsonb('filters').default('{}'), // Default filters
  isDefault: boolean('is_default').default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SIEM Incidents - High-level security incidents
const siemIncidents = pgTable('siem_incidents', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  severity: siemAlertSeverityEnum('severity').default('medium'),
  status: varchar('status', { length: 50 }).default('open'), // open, investigating, resolved, closed
  incidentType: varchar('incident_type', { length: 100 }), // data_breach, malware, unauthorized_access, etc.
  affectedSystems: text('affected_systems').array().default([]),
  relatedAlerts: integer('related_alerts').array().default([]), // Array of alert IDs
  assignedTo: integer('assigned_to').references(() => users.id),
  reportedBy: integer('reported_by').references(() => users.id),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }),
  containedAt: timestamp('contained_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  investigationNotes: text('investigation_notes'),
  remediationActions: text('remediation_actions'),
  lessonsLearned: text('lessons_learned'),
  businessImpact: text('business_impact'),
  estimatedCost: integer('estimated_cost'), // Cost in dollars
  complianceImpact: text('compliance_impact'),
  externalNotification: boolean('external_notification').default(false),
  lawEnforcementNotified: boolean('law_enforcement_notified').default(false),
  mediaAttention: boolean('media_attention').default(false),
  customFields: jsonb('custom_fields').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SIEM Threat Intelligence - Threat indicators and IOCs
const siemThreatIntelligence = pgTable('siem_threat_intelligence', {
  id: serial('id').primaryKey(),
  indicatorType: varchar('indicator_type', { length: 50 }).notNull(), // ip, domain, hash, url, email
  indicatorValue: varchar('indicator_value', { length: 500 }).notNull(),
  threatType: varchar('threat_type', { length: 100 }), // malware, phishing, c2, etc.
  severity: siemAlertSeverityEnum('severity').default('medium'),
  confidence: integer('confidence').default(50), // 0-100 confidence score
  source: varchar('source', { length: 255 }), // Source of intelligence
  description: text('description'),
  tags: text('tags').array().default([]),
  firstSeen: timestamp('first_seen', { withTimezone: true }),
  lastSeen: timestamp('last_seen', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isActive: boolean('is_active').default(true),
  falsePositive: boolean('false_positive').default(false),
  relatedIncidents: integer('related_incidents').array().default([]),
  additionalContext: jsonb('additional_context').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// SIEM Analytics - Pre-computed analytics and metrics
const siemAnalytics = pgTable('siem_analytics', {
  id: serial('id').primaryKey(),
  metricName: varchar('metric_name', { length: 255 }).notNull(),
  metricType: varchar('metric_type', { length: 50 }).notNull(), // count, avg, sum, rate, etc.
  timeframe: varchar('timeframe', { length: 50 }).notNull(), // hourly, daily, weekly, monthly
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
  value: integer('value').notNull(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  siemLogSources,
  siemRules,
  siemEvents,
  siemAlerts,
  siemDashboards,
  siemIncidents,
  siemThreatIntelligence,
  siemAnalytics,
  // Export enums
  siemAlertSeverityEnum,
  siemAlertStatusEnum,
  siemEventSeverityEnum,
  siemEventStatusEnum,
  siemRuleTypeEnum,
  siemRuleSeverityEnum,
};
