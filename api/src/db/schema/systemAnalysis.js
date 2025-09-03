const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for system analysis
const discoveryStatusEnum = pgEnum('enum_discovery_status', ['pending', 'running', 'completed', 'failed', 'cancelled']);
const complianceLevelEnum = pgEnum('enum_compliance_level', ['compliant', 'non_compliant', 'partially_compliant', 'unknown']);
const postureStatusEnum = pgEnum('enum_posture_status', ['secure', 'at_risk', 'vulnerable', 'critical']);
const threatLevelEnum = pgEnum('enum_threat_level', ['low', 'medium', 'high', 'critical']);

// System Compliance Mapping table
const systemComplianceMapping = pgTable('system_compliance_mapping', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').notNull(), // References systems.id
  complianceFrameworkId: integer('compliance_framework_id').notNull(), // References compliance_frameworks.id
  controlId: varchar('control_id', { length: 100 }).notNull(),
  mappingType: varchar('mapping_type', { length: 50 }).default('direct'), // 'direct', 'inherited', 'derived'
  complianceLevel: complianceLevelEnum('compliance_level').default('unknown'),
  implementationStatus: varchar('implementation_status', { length: 50 }),
  compliancePercentage: integer('compliance_percentage'), // 0-100
  lastAssessment: timestamp('last_assessment', { withTimezone: true }),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessmentMethod: varchar('assessment_method', { length: 100 }),
  evidence: text('evidence').array(),
  gaps: text('gaps').array(),
  recommendations: text('recommendations'),
  remediationPlan: text('remediation_plan'),
  riskLevel: varchar('risk_level', { length: 20 }),
  businessJustification: text('business_justification'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  systemFrameworkUnique: unique('unique_system_framework_control').on(table.systemId, table.complianceFrameworkId, table.controlId),
  systemIdIdx: index('idx_system_compliance_mapping_system_id').on(table.systemId),
  frameworkIdIdx: index('idx_system_compliance_mapping_framework_id').on(table.complianceFrameworkId),
  controlIdIdx: index('idx_system_compliance_mapping_control_id').on(table.controlId),
  complianceLevelIdx: index('idx_system_compliance_mapping_compliance_level').on(table.complianceLevel),
  lastAssessmentIdx: index('idx_system_compliance_mapping_last_assessment').on(table.lastAssessment),
  nextAssessmentIdx: index('idx_system_compliance_mapping_next_assessment').on(table.nextAssessment),
}));

// System Configuration Drift table
const systemConfigurationDrift = pgTable('system_configuration_drift', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').notNull(), // References systems.id
  assetId: integer('asset_id'), // References assets.id
  configurationItem: varchar('configuration_item', { length: 255 }).notNull(),
  expectedValue: text('expected_value'),
  actualValue: text('actual_value'),
  driftType: varchar('drift_type', { length: 50 }).notNull(), // 'unauthorized_change', 'missing_config', 'incorrect_value'
  severity: varchar('severity', { length: 20 }).default('medium'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  isResolved: boolean('is_resolved').default(false),
  resolutionAction: text('resolution_action'),
  resolvedBy: integer('resolved_by').references(() => users.id),
  impactAssessment: text('impact_assessment'),
  rootCause: text('root_cause'),
  preventionMeasures: text('prevention_measures'),
  complianceImpact: text('compliance_impact'),
  businessImpact: text('business_impact'),
  detectionMethod: varchar('detection_method', { length: 100 }),
  baseline: jsonb('baseline').default('{}'),
  currentState: jsonb('current_state').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  systemIdIdx: index('idx_system_configuration_drift_system_id').on(table.systemId),
  assetIdIdx: index('idx_system_configuration_drift_asset_id').on(table.assetId),
  configItemIdx: index('idx_system_configuration_drift_config_item').on(table.configurationItem),
  driftTypeIdx: index('idx_system_configuration_drift_drift_type').on(table.driftType),
  severityIdx: index('idx_system_configuration_drift_severity').on(table.severity),
  detectedAtIdx: index('idx_system_configuration_drift_detected_at').on(table.detectedAt),
  resolvedIdx: index('idx_system_configuration_drift_resolved').on(table.isResolved),
  resolvedAtIdx: index('idx_system_configuration_drift_resolved_at').on(table.resolvedAt),
}));

// System Discovery Scans table
const systemDiscoveryScans = pgTable('system_discovery_scans', {
  id: serial('id').primaryKey(),
  scanName: varchar('scan_name', { length: 255 }).notNull(),
  scanType: varchar('scan_type', { length: 50 }).notNull(), // 'network', 'asset', 'service', 'vulnerability'
  targetScope: text('target_scope').notNull(), // IP ranges, hostnames, etc.
  status: discoveryStatusEnum('status').default('pending').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // seconds
  discoveredAssets: integer('discovered_assets').default(0),
  newAssets: integer('new_assets').default(0),
  updatedAssets: integer('updated_assets').default(0),
  configuration: jsonb('configuration').default('{}'),
  scannerType: varchar('scanner_type', { length: 100 }),
  scannerVersion: varchar('scanner_version', { length: 50 }),
  errorMessage: text('error_message'),
  logs: text('logs'),
  scheduledBy: integer('scheduled_by').references(() => users.id),
  executedBy: integer('executed_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  scanNameIdx: index('idx_system_discovery_scans_scan_name').on(table.scanName),
  scanTypeIdx: index('idx_system_discovery_scans_scan_type').on(table.scanType),
  statusIdx: index('idx_system_discovery_scans_status').on(table.status),
  startedAtIdx: index('idx_system_discovery_scans_started_at').on(table.startedAt),
  completedAtIdx: index('idx_system_discovery_scans_completed_at').on(table.completedAt),
  scheduledByIdx: index('idx_system_discovery_scans_scheduled_by').on(table.scheduledBy),
}));

// System Discovery Results table
const systemDiscoveryResults = pgTable('system_discovery_results', {
  id: serial('id').primaryKey(),
  scanId: integer('scan_id').references(() => systemDiscoveryScans.id, { onDelete: 'cascade' }).notNull(),
  assetId: integer('asset_id'), // References assets.id if matched to existing asset
  discoveredHostname: varchar('discovered_hostname', { length: 255 }),
  discoveredIp: varchar('discovered_ip', { length: 45 }),
  discoveredMac: varchar('discovered_mac', { length: 17 }),
  operatingSystem: varchar('operating_system', { length: 255 }),
  osVersion: varchar('os_version', { length: 100 }),
  services: jsonb('services').default('[]'), // Discovered services
  ports: jsonb('ports').default('[]'), // Open ports
  software: jsonb('software').default('[]'), // Installed software
  vulnerabilities: jsonb('vulnerabilities').default('[]'), // Discovered vulnerabilities
  confidence: integer('confidence'), // 1-100 percentage
  isNewAsset: boolean('is_new_asset').default(false),
  isMatched: boolean('is_matched').default(false),
  matchingCriteria: text('matching_criteria'),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeen: timestamp('last_seen', { withTimezone: true }),
  fingerprint: varchar('fingerprint', { length: 64 }), // Unique fingerprint
  rawData: jsonb('raw_data').default('{}'),
  metadata: jsonb('metadata').default('{}'),
}, (table) => ({
  scanIdIdx: index('idx_system_discovery_results_scan_id').on(table.scanId),
  assetIdIdx: index('idx_system_discovery_results_asset_id').on(table.assetId),
  hostnameIdx: index('idx_system_discovery_results_hostname').on(table.discoveredHostname),
  ipIdx: index('idx_system_discovery_results_ip').on(table.discoveredIp),
  macIdx: index('idx_system_discovery_results_mac').on(table.discoveredMac),
  osIdx: index('idx_system_discovery_results_os').on(table.operatingSystem),
  newAssetIdx: index('idx_system_discovery_results_new_asset').on(table.isNewAsset),
  matchedIdx: index('idx_system_discovery_results_matched').on(table.isMatched),
  discoveredAtIdx: index('idx_system_discovery_results_discovered_at').on(table.discoveredAt),
  fingerprintIdx: index('idx_system_discovery_results_fingerprint').on(table.fingerprint),
}));

// System Security Posture table
const systemSecurityPosture = pgTable('system_security_posture', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').notNull(), // References systems.id
  assessmentDate: timestamp('assessment_date', { withTimezone: true }).defaultNow().notNull(),
  overallPosture: postureStatusEnum('overall_posture').notNull(),
  securityScore: integer('security_score'), // 0-100
  vulnerabilityCount: integer('vulnerability_count').default(0),
  criticalVulnerabilities: integer('critical_vulnerabilities').default(0),
  highVulnerabilities: integer('high_vulnerabilities').default(0),
  mediumVulnerabilities: integer('medium_vulnerabilities').default(0),
  lowVulnerabilities: integer('low_vulnerabilities').default(0),
  patchingStatus: varchar('patching_status', { length: 50 }),
  configurationScore: integer('configuration_score'), // 0-100
  complianceScore: integer('compliance_score'), // 0-100
  accessControlScore: integer('access_control_score'), // 0-100
  encryptionScore: integer('encryption_score'), // 0-100
  monitoringScore: integer('monitoring_score'), // 0-100
  incidentCount: integer('incident_count').default(0),
  lastIncident: timestamp('last_incident', { withTimezone: true }),
  riskFactors: text('risk_factors').array(),
  strengths: text('strengths').array(),
  weaknesses: text('weaknesses').array(),
  recommendations: text('recommendations').array(),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessedBy: integer('assessed_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  systemIdIdx: index('idx_system_security_posture_system_id').on(table.systemId),
  assessmentDateIdx: index('idx_system_security_posture_assessment_date').on(table.assessmentDate),
  overallPostureIdx: index('idx_system_security_posture_overall_posture').on(table.overallPosture),
  securityScoreIdx: index('idx_system_security_posture_security_score').on(table.securityScore),
  vulnerabilityCountIdx: index('idx_system_security_posture_vulnerability_count').on(table.vulnerabilityCount),
  nextAssessmentIdx: index('idx_system_security_posture_next_assessment').on(table.nextAssessment),
  assessedByIdx: index('idx_system_security_posture_assessed_by').on(table.assessedBy),
}));

// System Threat Modeling table
const systemThreatModeling = pgTable('system_threat_modeling', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').notNull(), // References systems.id
  modelName: varchar('model_name', { length: 255 }).notNull(),
  modelVersion: varchar('model_version', { length: 20 }).default('1.0'),
  threatCategory: varchar('threat_category', { length: 100 }).notNull(),
  threatActor: varchar('threat_actor', { length: 255 }),
  threatLevel: threatLevelEnum('threat_level').notNull(),
  attackVector: varchar('attack_vector', { length: 255 }),
  attackSurface: text('attack_surface'),
  vulnerabilities: text('vulnerabilities').array(),
  assets: text('assets').array(), // Asset IDs that could be affected
  impactDescription: text('impact_description'),
  likelihood: integer('likelihood'), // 1-10 scale
  impact: integer('impact'), // 1-10 scale
  riskScore: numeric('risk_score', { precision: 5, scale: 2 }),
  mitigations: text('mitigations').array(),
  controls: text('controls').array(),
  residualRisk: varchar('residual_risk', { length: 20 }),
  modelingMethod: varchar('modeling_method', { length: 100 }), // 'STRIDE', 'PASTA', 'OCTAVE', etc.
  lastReview: timestamp('last_review', { withTimezone: true }),
  nextReview: timestamp('next_review', { withTimezone: true }),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  status: varchar('status', { length: 50 }).default('draft'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  systemIdIdx: index('idx_system_threat_modeling_system_id').on(table.systemId),
  modelNameIdx: index('idx_system_threat_modeling_model_name').on(table.modelName),
  threatCategoryIdx: index('idx_system_threat_modeling_threat_category').on(table.threatCategory),
  threatLevelIdx: index('idx_system_threat_modeling_threat_level').on(table.threatLevel),
  riskScoreIdx: index('idx_system_threat_modeling_risk_score').on(table.riskScore),
  lastReviewIdx: index('idx_system_threat_modeling_last_review').on(table.lastReview),
  nextReviewIdx: index('idx_system_threat_modeling_next_review').on(table.nextReview),
  statusIdx: index('idx_system_threat_modeling_status').on(table.status),
}));

// SSH Connection Profiles table
const sshConnectionProfiles = pgTable('ssh_connection_profiles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  hostname: varchar('hostname', { length: 255 }).notNull(),
  port: integer('port').default(22),
  username: varchar('username', { length: 100 }).notNull(),
  authMethod: varchar('auth_method', { length: 50 }).notNull(), // 'password', 'key', 'certificate'
  keyPath: varchar('key_path', { length: 500 }),
  keyPassphrase: varchar('key_passphrase', { length: 255 }), // Encrypted
  certificatePath: varchar('certificate_path', { length: 500 }),
  jumpHost: varchar('jump_host', { length: 255 }),
  jumpPort: integer('jump_port'),
  jumpUsername: varchar('jump_username', { length: 100 }),
  connectionTimeout: integer('connection_timeout').default(30), // seconds
  keepAliveInterval: integer('keep_alive_interval').default(60), // seconds
  maxRetries: integer('max_retries').default(3),
  isActive: boolean('is_active').default(true),
  lastUsed: timestamp('last_used', { withTimezone: true }),
  lastSuccessful: timestamp('last_successful', { withTimezone: true }),
  failureCount: integer('failure_count').default(0),
  lastError: text('last_error'),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_ssh_connection_profiles_name').on(table.name),
  hostnameIdx: index('idx_ssh_connection_profiles_hostname').on(table.hostname),
  usernameIdx: index('idx_ssh_connection_profiles_username').on(table.username),
  authMethodIdx: index('idx_ssh_connection_profiles_auth_method').on(table.authMethod),
  activeIdx: index('idx_ssh_connection_profiles_active').on(table.isActive),
  lastUsedIdx: index('idx_ssh_connection_profiles_last_used').on(table.lastUsed),
  createdByIdx: index('idx_ssh_connection_profiles_created_by').on(table.createdBy),
}));

module.exports = {
  systemComplianceMapping,
  systemConfigurationDrift,
  systemDiscoveryScans,
  systemDiscoveryResults,
  systemSecurityPosture,
  systemThreatModeling,
  sshConnectionProfiles,
  // Export enums
  discoveryStatusEnum,
  complianceLevelEnum,
  postureStatusEnum,
  threatLevelEnum,
};
