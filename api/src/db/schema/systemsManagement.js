const { pgTable, serial, varchar, text, integer, timestamp, jsonb, pgEnum, decimal, boolean, uuid } = require('drizzle-orm/pg-core');

// Enums for systems management
const discoveryStatusEnum = pgEnum('discovery_status', ['pending', 'running', 'completed', 'failed', 'cancelled']);
const postureStatusEnum = pgEnum('posture_status', ['excellent', 'good', 'fair', 'poor', 'critical']);
const driftSeverityEnum = pgEnum('drift_severity', ['low', 'medium', 'high', 'critical']);
const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);
const environmentTypeEnum = pgEnum('environment_type', ['on-premises', 'cloud', 'hybrid']);

// System Discovery Scans table
const systemDiscoveryScans = pgTable('system_discovery_scans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  methods: jsonb('methods').notNull(), // Array of discovery methods used
  targets: jsonb('targets').notNull(), // Array of targets (IP ranges, domains, etc.)
  schedule: varchar('schedule', { length: 100 }), // CRON expression for scheduled scans
  options: jsonb('options').default('{}'), // Scan options and configuration
  status: discoveryStatusEnum('status').default('pending'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  systemsFound: integer('systems_found').default(0),
  results: jsonb('results'), // Aggregated scan results
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// System Discovery Results table
const systemDiscoveryResults = pgTable('system_discovery_results', {
  id: serial('id').primaryKey(),
  scanId: integer('scan_id').references(() => systemDiscoveryScans.id, { onDelete: 'cascade' }).notNull(),
  systemIdentifier: varchar('system_identifier', { length: 255 }).notNull(),
  discoveryData: jsonb('discovery_data').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.5'),
  methods: jsonb('methods').notNull(),
  processed: boolean('processed').default(false),
  systemId: integer('system_id').references(() => require('./systems').systems.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// System Security Posture table
const systemSecurityPosture = pgTable('system_security_posture', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => require('./systems').systems.id, { onDelete: 'cascade' }).notNull(),
  overallScore: decimal('overall_score', { precision: 5, scale: 2 }).notNull(), // 0-100
  postureStatus: postureStatusEnum('posture_status').notNull(),
  vulnerabilityScore: decimal('vulnerability_score', { precision: 5, scale: 2 }),
  configurationScore: decimal('configuration_score', { precision: 5, scale: 2 }),
  patchScore: decimal('patch_score', { precision: 5, scale: 2 }),
  complianceScore: decimal('compliance_score', { precision: 5, scale: 2 }),
  controlEffectiveness: decimal('control_effectiveness', { precision: 5, scale: 2 }),
  threatExposure: decimal('threat_exposure', { precision: 5, scale: 2 }),
  businessImpact: decimal('business_impact', { precision: 5, scale: 2 }),
  riskFactors: jsonb('risk_factors').default('{}'),
  recommendations: jsonb('recommendations').default('[]'),
  lastAssessment: timestamp('last_assessment', { withTimezone: true }).notNull(),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessedBy: varchar('assessed_by', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// System Configuration Drift table
const systemConfigurationDrift = pgTable('system_configuration_drift', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => require('./systems').systems.id, { onDelete: 'cascade' }).notNull(),
  driftType: varchar('drift_type', { length: 100 }).notNull(), // 'configuration', 'patch', 'service', 'security'
  severity: driftSeverityEnum('severity').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  currentValue: text('current_value'),
  expectedValue: text('expected_value'),
  previousValue: text('previous_value'),
  detectionMethod: varchar('detection_method', { length: 100 }),
  impactAssessment: text('impact_assessment'),
  remediationSteps: jsonb('remediation_steps').default('[]'),
  businessImpact: varchar('business_impact', { length: 50 }),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull(),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  acknowledgedBy: integer('acknowledged_by').references(() => require('./users').users.id),
  resolvedBy: integer('resolved_by').references(() => require('./users').users.id),
  status: varchar('status', { length: 50 }).default('open'), // 'open', 'acknowledged', 'resolved', 'accepted'
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Cross-System Correlations table
const crossSystemCorrelations = pgTable('cross_system_correlations', {
  id: serial('id').primaryKey(),
  correlationId: varchar('correlation_id', { length: 100 }).notNull().unique(),
  correlationType: varchar('correlation_type', { length: 100 }).notNull(), // 'vulnerability_pattern', 'attack_path', 'shared_risk'
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  systemIds: jsonb('system_ids').notNull(), // Array of affected system IDs
  severity: varchar('severity', { length: 20 }).notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  correlationData: jsonb('correlation_data').notNull(),
  aiAnalysis: jsonb('ai_analysis'),
  recommendations: jsonb('recommendations').default('[]'),
  detectedAt: timestamp('detected_at', { withTimezone: true }).notNull(),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'resolved', 'false_positive'
  assignedTo: integer('assigned_to').references(() => require('./users').users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Enterprise Risk Aggregation table
const enterpriseRiskAggregation = pgTable('enterprise_risk_aggregation', {
  id: serial('id').primaryKey(),
  aggregationDate: timestamp('aggregation_date', { withTimezone: true }).notNull(),
  overallRiskScore: decimal('overall_risk_score', { precision: 5, scale: 2 }).notNull(),
  riskLevel: riskLevelEnum('risk_level').notNull(),
  totalSystems: integer('total_systems').notNull(),
  criticalSystems: integer('critical_systems').default(0),
  highRiskSystems: integer('high_risk_systems').default(0),
  mediumRiskSystems: integer('medium_risk_systems').default(0),
  lowRiskSystems: integer('low_risk_systems').default(0),
  totalVulnerabilities: integer('total_vulnerabilities').default(0),
  criticalVulnerabilities: integer('critical_vulnerabilities').default(0),
  highVulnerabilities: integer('high_vulnerabilities').default(0),
  complianceScore: decimal('compliance_score', { precision: 5, scale: 2 }),
  controlEffectiveness: decimal('control_effectiveness', { precision: 5, scale: 2 }),
  threatExposure: decimal('threat_exposure', { precision: 5, scale: 2 }),
  businessImpactScore: decimal('business_impact_score', { precision: 5, scale: 2 }),
  riskTrends: jsonb('risk_trends').default('{}'),
  topRisks: jsonb('top_risks').default('[]'),
  recommendations: jsonb('recommendations').default('[]'),
  benchmarkData: jsonb('benchmark_data').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// Attack Surface Mapping table
const attackSurfaceMapping = pgTable('attack_surface_mapping', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => require('./systems').systems.id, { onDelete: 'cascade' }).notNull(),
  surfaceType: varchar('surface_type', { length: 100 }).notNull(), // 'network', 'web', 'api', 'service'
  component: varchar('component', { length: 255 }).notNull(), // Service, port, endpoint, etc.
  exposure: varchar('exposure', { length: 50 }).notNull(), // 'internal', 'external', 'dmz'
  protocol: varchar('protocol', { length: 50 }),
  port: integer('port'),
  service: varchar('service', { length: 100 }),
  version: varchar('version', { length: 100 }),
  endpoint: text('endpoint'),
  authentication: varchar('authentication', { length: 100 }),
  encryption: varchar('encryption', { length: 100 }),
  riskScore: decimal('risk_score', { precision: 5, scale: 2 }),
  vulnerabilities: jsonb('vulnerabilities').default('[]'),
  threatVectors: jsonb('threat_vectors').default('[]'),
  mitigations: jsonb('mitigations').default('[]'),
  businessCriticality: varchar('business_criticality', { length: 50 }),
  dataClassification: varchar('data_classification', { length: 50 }),
  lastScanned: timestamp('last_scanned', { withTimezone: true }),
  discoveredAt: timestamp('discovered_at', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'inactive', 'decommissioned'
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Business Impact Analysis table
const businessImpactAnalysis = pgTable('business_impact_analysis', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => require('./systems').systems.id, { onDelete: 'cascade' }).notNull(),
  businessFunction: varchar('business_function', { length: 255 }).notNull(),
  criticality: varchar('criticality', { length: 50 }).notNull(), // 'mission_critical', 'business_critical', 'important', 'routine'
  rto: integer('rto'), // Recovery Time Objective in minutes
  rpo: integer('rpo'), // Recovery Point Objective in minutes
  financialImpact: decimal('financial_impact', { precision: 12, scale: 2 }),
  reputationalImpact: varchar('reputational_impact', { length: 50 }),
  regulatoryImpact: varchar('regulatory_impact', { length: 50 }),
  operationalImpact: varchar('operational_impact', { length: 50 }),
  dependencies: jsonb('dependencies').default('[]'), // Systems this depends on
  dependents: jsonb('dependents').default('[]'), // Systems that depend on this
  stakeholders: jsonb('stakeholders').default('[]'),
  businessProcesses: jsonb('business_processes').default('[]'),
  dataTypes: jsonb('data_types').default('[]'),
  complianceRequirements: jsonb('compliance_requirements').default('[]'),
  threatScenarios: jsonb('threat_scenarios').default('[]'),
  riskMitigations: jsonb('risk_mitigations').default('[]'),
  lastAssessment: timestamp('last_assessment', { withTimezone: true }).notNull(),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessedBy: integer('assessed_by').references(() => require('./users').users.id),
  approvedBy: integer('approved_by').references(() => require('./users').users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// System Compliance Mapping table
const systemComplianceMapping = pgTable('system_compliance_mapping', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => require('./systems').systems.id, { onDelete: 'cascade' }).notNull(),
  framework: varchar('framework', { length: 100 }).notNull(), // 'NIST_800_53', 'FEDRAMP', 'FISMA', 'SOX', 'HIPAA'
  controlId: varchar('control_id', { length: 50 }).notNull(),
  controlFamily: varchar('control_family', { length: 100 }),
  implementationStatus: varchar('implementation_status', { length: 50 }).notNull(),
  assessmentStatus: varchar('assessment_status', { length: 50 }).notNull(),
  complianceScore: decimal('compliance_score', { precision: 5, scale: 2 }),
  gapAnalysis: jsonb('gap_analysis').default('{}'),
  evidence: jsonb('evidence').default('[]'),
  exceptions: jsonb('exceptions').default('[]'),
  compensatingControls: jsonb('compensating_controls').default('[]'),
  lastAssessment: timestamp('last_assessment', { withTimezone: true }),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessor: varchar('assessor', { length: 255 }),
  automatedAssessment: boolean('automated_assessment').default(false),
  mappingConfidence: decimal('mapping_confidence', { precision: 3, scale: 2 }).default('0.8'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// Threat Modeling table
const systemThreatModeling = pgTable('system_threat_modeling', {
  id: serial('id').primaryKey(),
  systemId: integer('system_id').references(() => require('./systems').systems.id, { onDelete: 'cascade' }).notNull(),
  modelId: varchar('model_id', { length: 100 }).notNull().unique(),
  modelName: varchar('model_name', { length: 255 }).notNull(),
  methodology: varchar('methodology', { length: 100 }), // 'STRIDE', 'PASTA', 'OCTAVE'
  scope: text('scope'),
  assets: jsonb('assets').default('[]'),
  threatActors: jsonb('threat_actors').default('[]'),
  attackVectors: jsonb('attack_vectors').default('[]'),
  threats: jsonb('threats').default('[]'),
  vulnerabilities: jsonb('vulnerabilities').default('[]'),
  controls: jsonb('controls').default('[]'),
  riskAssessment: jsonb('risk_assessment').default('{}'),
  mitigationStrategies: jsonb('mitigation_strategies').default('[]'),
  residualRisk: decimal('residual_risk', { precision: 5, scale: 2 }),
  modelStatus: varchar('model_status', { length: 50 }).default('draft'), // 'draft', 'review', 'approved', 'archived'
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
  createdBy: integer('created_by').references(() => require('./users').users.id).notNull(),
  reviewedBy: integer('reviewed_by').references(() => require('./users').users.id),
  approvedBy: integer('approved_by').references(() => require('./users').users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

module.exports = {
  // Discovery tables
  systemDiscoveryScans,
  systemDiscoveryResults,
  
  // Security posture tables
  systemSecurityPosture,
  systemConfigurationDrift,
  
  // Correlation and analysis tables
  crossSystemCorrelations,
  enterpriseRiskAggregation,
  
  // Attack surface and threat modeling
  attackSurfaceMapping,
  systemThreatModeling,
  
  // Business impact and compliance
  businessImpactAnalysis,
  systemComplianceMapping,
  
  // Enums
  discoveryStatusEnum,
  postureStatusEnum,
  driftSeverityEnum,
  riskLevelEnum,
  environmentTypeEnum
};
