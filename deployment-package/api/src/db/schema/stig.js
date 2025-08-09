const { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, date, numeric, pgEnum, uuid } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { assets } = require('./assets');

// Define enums for STIG management
const stigChecklistStatusEnum = pgEnum('enum_stig_checklists_status', [
  'not_started',
  'in_progress', 
  'completed',
  'reviewed',
  'approved',
  'rejected'
]);

const stigAssessmentStatusEnum = pgEnum('enum_stig_assessments_status', [
  'pending',
  'in_progress',
  'completed',
  'reviewed',
  'approved',
  'rejected'
]);

const stigComplianceStatusEnum = pgEnum('enum_stig_compliance_status', [
  'compliant',
  'non_compliant',
  'not_applicable',
  'not_reviewed',
  'partially_compliant'
]);

const stigImplementationStatusEnum = pgEnum('enum_stig_implementation_status', [
  'not_implemented',
  'planned',
  'in_progress',
  'implemented',
  'verified',
  'exception_approved'
]);

const stigHardeningSessionStatusEnum = pgEnum('enum_stig_hardening_sessions_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'paused'
]);

const stigHardeningResultStatusEnum = pgEnum('enum_stig_hardening_results_status', [
  'pending',
  'success',
  'failed',
  'skipped',
  'not_applicable'
]);

const stigHardeningBackupTypeEnum = pgEnum('enum_stig_hardening_backups_backup_type', [
  'file',
  'registry',
  'configuration',
  'service',
  'permission',
  'full_system'
]);

const stigSeverityEnum = pgEnum('enum_stig_severity', [
  'low',
  'medium',
  'high',
  'critical'
]);

const stigStatusEnum = pgEnum('enum_stig_status', [
  'active',
  'deprecated',
  'draft',
  'superseded'
]);

// STIG Library - Master repository of STIG rules and guidance
const stigLibrary = pgTable('stig_library', {
  id: serial('id').primaryKey(),
  stigId: varchar('stig_id', { length: 50 }).notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  releaseDate: date('release_date'),
  category: varchar('category', { length: 100 }),
  severity: stigSeverityEnum('severity').notNull(),
  status: stigStatusEnum('status').default('active'),
  implementationGuidance: text('implementation_guidance'),
  verificationText: text('verification_text'),
  riskAssessment: text('risk_assessment'),
  platforms: text('platforms').array(), // Array of supported platforms
  refLinks: jsonb('ref_links').default('[]'), // Reference links and documentation
  rawXml: text('raw_xml'), // Original STIG XML content
  checkContent: text('check_content'), // How to check compliance
  fixText: text('fix_text'), // How to fix non-compliance
  cciReferences: text('cci_references').array(), // CCI control references
  nistReferences: text('nist_references').array(), // NIST control references
  stigBenchmark: varchar('stig_benchmark', { length: 100 }), // STIG benchmark identifier
  ruleId: varchar('rule_id', { length: 100 }), // Unique rule identifier
  vulnId: varchar('vuln_id', { length: 100 }), // Vulnerability identifier
  groupId: varchar('group_id', { length: 100 }), // Group identifier
  weight: numeric('weight', { precision: 3, scale: 1 }), // Rule weight/importance
  iaControls: text('ia_controls').array(), // IA control references
  legacyIds: text('legacy_ids').array(), // Legacy STIG IDs for migration
  documentationUrl: varchar('documentation_url', { length: 500 }),
  automationSupported: boolean('automation_supported').default(false),
  requiresManualReview: boolean('requires_manual_review').default(true),
  estimatedFixTime: integer('estimated_fix_time'), // Minutes to fix
  businessImpact: varchar('business_impact', { length: 50 }), // low, medium, high
  technicalComplexity: varchar('technical_complexity', { length: 50 }), // low, medium, high
  prerequisites: text('prerequisites').array(), // Prerequisites for implementation
  postImplementationSteps: text('post_implementation_steps').array(),
  rollbackProcedure: text('rollback_procedure'),
  testingProcedure: text('testing_procedure'),
  complianceFrameworks: text('compliance_frameworks').array(), // Related frameworks
  tags: text('tags').array(), // Searchable tags
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG Checklists - Asset-specific STIG evaluation checklists
const stigChecklists = pgTable('stig_checklists', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  benchmarkId: varchar('benchmark_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  version: varchar('version', { length: 255 }),
  releaseInfo: varchar('release_info', { length: 255 }),
  status: stigChecklistStatusEnum('status').default('not_started'),
  targetType: varchar('target_type', { length: 255 }), // OS, application, device type
  findings: jsonb('findings').default('[]'), // Individual rule findings
  totalRules: integer('total_rules').default(0),
  completedRules: integer('completed_rules').default(0),
  openFindings: integer('open_findings').default(0),
  notApplicable: integer('not_applicable').default(0),
  compliantFindings: integer('compliant_findings').default(0),
  nonCompliantFindings: integer('non_compliant_findings').default(0),
  assignedTo: integer('assigned_to').references(() => users.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, critical
  estimatedEffort: integer('estimated_effort'), // Hours
  actualEffort: integer('actual_effort'), // Hours
  complianceScore: numeric('compliance_score', { precision: 5, scale: 2 }), // Percentage
  riskScore: numeric('risk_score', { precision: 5, scale: 2 }), // Calculated risk score
  lastScanDate: timestamp('last_scan_date', { withTimezone: true }),
  nextScanDate: timestamp('next_scan_date', { withTimezone: true }),
  scanFrequency: varchar('scan_frequency', { length: 50 }), // daily, weekly, monthly
  automatedScanEnabled: boolean('automated_scan_enabled').default(false),
  notificationSettings: jsonb('notification_settings').default('{}'),
  workflowState: varchar('workflow_state', { length: 50 }).default('initial'),
  escalationLevel: integer('escalation_level').default(0),
  businessJustification: text('business_justification'),
  technicalJustification: text('technical_justification'),
  compensatingControls: text('compensating_controls'),
  residualRisk: varchar('residual_risk', { length: 20 }),
  mitigation: text('mitigation'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG Assessments - Individual STIG rule assessments
const stigAssessments = pgTable('stig_assessments', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  stigId: integer('stig_id').notNull().references(() => stigLibrary.id, { onDelete: 'cascade' }),
  checklistId: integer('checklist_id').references(() => stigChecklists.id, { onDelete: 'cascade' }),
  status: stigAssessmentStatusEnum('status').default('pending').notNull(),
  assessmentDate: timestamp('assessment_date', { withTimezone: true }),
  assessmentDetails: text('assessment_details'),
  findingDetails: text('finding_details'),
  implementationStatus: stigImplementationStatusEnum('implementation_status'),
  complianceStatus: stigComplianceStatusEnum('compliance_status').default('not_reviewed').notNull(),
  complianceDate: timestamp('compliance_date', { withTimezone: true }),
  assignedTo: integer('assigned_to').references(() => users.id),
  assessedBy: integer('assessed_by').references(() => users.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  mitigationPlan: text('mitigation_plan'),
  remediationDate: timestamp('remediation_date', { withTimezone: true }),
  actualRemediationDate: timestamp('actual_remediation_date', { withTimezone: true }),
  verificationMethod: varchar('verification_method', { length: 100 }),
  verificationDate: timestamp('verification_date', { withTimezone: true }),
  verifiedBy: integer('verified_by').references(() => users.id),
  findingType: varchar('finding_type', { length: 50 }), // open, not_a_finding, not_applicable
  severity: stigSeverityEnum('severity'),
  impact: varchar('impact', { length: 20 }), // low, medium, high
  likelihood: varchar('likelihood', { length: 20 }), // low, medium, high
  riskRating: varchar('risk_rating', { length: 20 }), // low, medium, high, critical
  businessImpact: text('business_impact'),
  technicalImpact: text('technical_impact'),
  compensatingControls: text('compensating_controls'),
  residualRisk: varchar('residual_risk', { length: 20 }),
  exceptionRequest: text('exception_request'),
  exceptionApproval: text('exception_approval'),
  exceptionApprovedBy: integer('exception_approved_by').references(() => users.id),
  exceptionApprovedAt: timestamp('exception_approved_at', { withTimezone: true }),
  exceptionExpiryDate: timestamp('exception_expiry_date', { withTimezone: true }),
  comments: text('comments'),
  attachments: jsonb('attachments').default('[]'), // File attachments
  evidenceLinks: jsonb('evidence_links').default('[]'), // Links to evidence
  automatedCheck: boolean('automated_check').default(false),
  lastAutomatedCheck: timestamp('last_automated_check', { withTimezone: true }),
  automatedResult: varchar('automated_result', { length: 50 }),
  manualOverride: boolean('manual_override').default(false),
  overrideReason: text('override_reason'),
  overrideBy: integer('override_by').references(() => users.id),
  overrideAt: timestamp('override_at', { withTimezone: true }),
  workflowState: varchar('workflow_state', { length: 50 }).default('initial'),
  escalationLevel: integer('escalation_level').default(0),
  slaDeadline: timestamp('sla_deadline', { withTimezone: true }),
  priority: varchar('priority', { length: 20 }).default('medium'),
  effort: integer('effort'), // Hours spent
  cost: numeric('cost', { precision: 10, scale: 2 }), // Cost of remediation
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG Scan Results - Automated scan results
const stigScanResults = pgTable('stig_scan_results', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'cascade' }),
  scanDate: timestamp('scan_date', { withTimezone: true }).defaultNow().notNull(),
  scanTool: varchar('scan_tool', { length: 100 }),
  scanVersion: varchar('scan_version', { length: 50 }),
  scanProfile: varchar('scan_profile', { length: 100 }),
  complianceScore: numeric('compliance_score', { precision: 5, scale: 2 }),
  totalChecks: integer('total_checks'),
  passedChecks: integer('passed_checks'),
  failedChecks: integer('failed_checks'),
  notApplicableChecks: integer('not_applicable_checks'),
  criticalFindings: integer('critical_findings'),
  highFindings: integer('high_findings'),
  mediumFindings: integer('medium_findings'),
  lowFindings: integer('low_findings'),
  findings: jsonb('findings').default('[]'), // Detailed findings
  rawResults: jsonb('raw_results').default('{}'), // Raw scan output
  scanDuration: integer('scan_duration'), // Seconds
  scanStatus: varchar('scan_status', { length: 50 }).default('completed'),
  errorMessage: text('error_message'),
  baselineId: integer('baseline_id'), // Reference to baseline scan
  deltaFromBaseline: jsonb('delta_from_baseline').default('{}'),
  trendData: jsonb('trend_data').default('{}'),
  scheduledScan: boolean('scheduled_scan').default(false),
  scanTriggeredBy: integer('scan_triggered_by').references(() => users.id),
  notificationsSent: boolean('notifications_sent').default(false),
  reportGenerated: boolean('report_generated').default(false),
  reportPath: varchar('report_path', { length: 500 }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG Hardening Sessions - Automated hardening sessions
const stigHardeningSessions = pgTable('stig_hardening_sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  targetHost: varchar('target_host', { length: 255 }).notNull(),
  platform: varchar('platform', { length: 255 }).notNull(),
  platformVersion: varchar('platform_version', { length: 100 }),
  hardeningProfile: varchar('hardening_profile', { length: 100 }),
  startTime: timestamp('start_time', { withTimezone: true }).defaultNow().notNull(),
  endTime: timestamp('end_time', { withTimezone: true }),
  status: stigHardeningSessionStatusEnum('status').default('pending').notNull(),
  complianceScore: integer('compliance_score'),
  preHardeningScore: integer('pre_hardening_score'),
  postHardeningScore: integer('post_hardening_score'),
  totalRules: integer('total_rules'),
  appliedRules: integer('applied_rules'),
  failedRules: integer('failed_rules'),
  skippedRules: integer('skipped_rules'),
  backupCreated: boolean('backup_created').default(false),
  backupPath: varchar('backup_path', { length: 500 }),
  rollbackAvailable: boolean('rollback_available').default(false),
  dryRun: boolean('dry_run').default(false),
  forceMode: boolean('force_mode').default(false),
  continueOnError: boolean('continue_on_error').default(true),
  initiatedBy: integer('initiated_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  priority: varchar('priority', { length: 20 }).default('medium'),
  businessJustification: text('business_justification'),
  changeRequestId: varchar('change_request_id', { length: 100 }),
  maintenanceWindow: jsonb('maintenance_window').default('{}'),
  rollbackPlan: text('rollback_plan'),
  testingPlan: text('testing_plan'),
  communicationPlan: text('communication_plan'),
  riskAssessment: text('risk_assessment'),
  impactAnalysis: text('impact_analysis'),
  successCriteria: text('success_criteria'),
  notes: text('notes'),
  errorLog: text('error_log'),
  executionLog: text('execution_log'),
  performanceMetrics: jsonb('performance_metrics').default('{}'),
  resourceUsage: jsonb('resource_usage').default('{}'),
  notifications: jsonb('notifications').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG Hardening Results - Individual rule hardening results
const stigHardeningResults = pgTable('stig_hardening_results', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull().references(() => stigHardeningSessions.sessionId, { onDelete: 'cascade' }),
  ruleId: varchar('rule_id', { length: 255 }).notNull(),
  stigId: integer('stig_id').references(() => stigLibrary.id),
  status: stigHardeningResultStatusEnum('status').notNull(),
  beforeState: text('before_state'),
  afterState: text('after_state'),
  executionTime: integer('execution_time'), // Milliseconds
  errorMessage: text('error_message'),
  warningMessage: text('warning_message'),
  backupLocation: varchar('backup_location', { length: 255 }),
  requiresReboot: boolean('requires_reboot').default(false).notNull(),
  requiresLogoff: boolean('requires_logoff').default(false),
  serviceRestartRequired: boolean('service_restart_required').default(false),
  servicesAffected: text('services_affected').array(),
  filesModified: text('files_modified').array(),
  registryKeysModified: text('registry_keys_modified').array(),
  permissionsChanged: text('permissions_changed').array(),
  configurationChanges: jsonb('configuration_changes').default('{}'),
  validationResult: varchar('validation_result', { length: 50 }),
  validationDetails: text('validation_details'),
  rollbackAvailable: boolean('rollback_available').default(false),
  rollbackTested: boolean('rollback_tested').default(false),
  impactAssessment: text('impact_assessment'),
  riskLevel: varchar('risk_level', { length: 20 }),
  businessImpact: varchar('business_impact', { length: 20 }),
  userImpact: varchar('user_impact', { length: 20 }),
  performanceImpact: varchar('performance_impact', { length: 20 }),
  securityImprovement: text('security_improvement'),
  complianceImprovement: text('compliance_improvement'),
  automationConfidence: numeric('automation_confidence', { precision: 3, scale: 2 }),
  manualVerificationRequired: boolean('manual_verification_required').default(false),
  postImplementationTesting: text('post_implementation_testing'),
  monitoringRecommendations: text('monitoring_recommendations'),
  maintenanceRequirements: text('maintenance_requirements'),
  documentationUpdates: text('documentation_updates'),
  trainingRequirements: text('training_requirements'),
  communicationNeeds: text('communication_needs'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG Hardening Backups - Backup information for rollback
const stigHardeningBackups = pgTable('stig_hardening_backups', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 255 }).notNull().references(() => stigHardeningSessions.sessionId, { onDelete: 'cascade' }),
  ruleId: varchar('rule_id', { length: 255 }).notNull(),
  backupPath: varchar('backup_path', { length: 255 }).notNull(),
  backupType: stigHardeningBackupTypeEnum('backup_type').notNull(),
  targetHost: varchar('target_host', { length: 255 }).notNull(),
  backupSize: integer('backup_size'), // Bytes
  compressionUsed: boolean('compression_used').default(false),
  encryptionUsed: boolean('encryption_used').default(false),
  checksumMd5: varchar('checksum_md5', { length: 32 }),
  checksumSha256: varchar('checksum_sha256', { length: 64 }),
  backupMethod: varchar('backup_method', { length: 50 }),
  backupTool: varchar('backup_tool', { length: 100 }),
  backupVersion: varchar('backup_version', { length: 50 }),
  originalPath: varchar('original_path', { length: 500 }),
  originalPermissions: varchar('original_permissions', { length: 100 }),
  originalOwner: varchar('original_owner', { length: 100 }),
  originalSize: integer('original_size'),
  originalModified: timestamp('original_modified', { withTimezone: true }),
  backupDescription: text('backup_description'),
  restoreInstructions: text('restore_instructions'),
  restorePriority: integer('restore_priority').default(1),
  restoreOrder: integer('restore_order'),
  dependencies: text('dependencies').array(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  isRestored: boolean('is_restored').default(false).notNull(),
  restoredAt: timestamp('restored_at', { withTimezone: true }),
  restoredBy: integer('restored_by').references(() => users.id),
  restoreResult: varchar('restore_result', { length: 50 }),
  restoreNotes: text('restore_notes'),
  verificationStatus: varchar('verification_status', { length: 50 }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: integer('verified_by').references(() => users.id),
  retentionPolicy: varchar('retention_policy', { length: 100 }),
  storageLocation: varchar('storage_location', { length: 200 }),
  storageType: varchar('storage_type', { length: 50 }),
  accessPermissions: jsonb('access_permissions').default('{}'),
  auditTrail: jsonb('audit_trail').default('[]'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG Fix Status - Track individual STIG rule fix status
const stigFixStatus = pgTable('stig_fix_status', {
  id: serial('id').primaryKey(),
  stigId: integer('stig_id').references(() => stigLibrary.id, { onDelete: 'cascade' }),
  ruleId: text('rule_id').notNull(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  assessmentId: integer('assessment_id').references(() => stigAssessments.id, { onDelete: 'cascade' }),
  checklistId: integer('checklist_id').references(() => stigChecklists.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  fixMethod: varchar('fix_method', { length: 100 }), // manual, automated, scripted
  fixDuration: integer('fix_duration'), // Minutes
  fixComplexity: varchar('fix_complexity', { length: 20 }), // low, medium, high
  fixCost: numeric('fix_cost', { precision: 10, scale: 2 }),
  businessImpact: varchar('business_impact', { length: 20 }),
  downtime: integer('downtime'), // Minutes of downtime
  rollbackTested: boolean('rollback_tested').default(false),
  rollbackTime: integer('rollback_time'), // Minutes to rollback
  verificationMethod: varchar('verification_method', { length: 100 }),
  verificationResult: varchar('verification_result', { length: 50 }),
  verifiedBy: integer('verified_by').references(() => users.id),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  implementationDate: timestamp('implementation_date', { withTimezone: true }),
  scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
  priority: varchar('priority', { length: 20 }).default('medium'),
  status: varchar('status', { length: 50 }).default('pending'),
  workflowState: varchar('workflow_state', { length: 50 }).default('initial'),
  assignedTeam: varchar('assigned_team', { length: 100 }),
  escalationLevel: integer('escalation_level').default(0),
  slaDeadline: timestamp('sla_deadline', { withTimezone: true }),
  changeRequestId: varchar('change_request_id', { length: 100 }),
  testingResults: text('testing_results'),
  qualityAssurance: text('quality_assurance'),
  documentationUpdated: boolean('documentation_updated').default(false),
  trainingProvided: boolean('training_provided').default(false),
  communicationSent: boolean('communication_sent').default(false),
  monitoringEnabled: boolean('monitoring_enabled').default(false),
  alertsConfigured: boolean('alerts_configured').default(false),
  backupVerified: boolean('backup_verified').default(false),
  rollbackPlan: text('rollback_plan'),
  contingencyPlan: text('contingency_plan'),
  lessonsLearned: text('lessons_learned'),
  bestPractices: text('best_practices'),
  recommendations: text('recommendations'),
  notes: text('notes'),
  attachments: jsonb('attachments').default('[]'),
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// STIG AI Assistance - AI-powered STIG guidance and automation
const stigAiAssistance = pgTable('stig_ai_assistance', {
  id: serial('id').primaryKey(),
  stigId: integer('stig_id').references(() => stigLibrary.id, { onDelete: 'cascade' }),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'cascade' }),
  assessmentId: integer('assessment_id').references(() => stigAssessments.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id),
  requestType: varchar('request_type', { length: 50 }).notNull(), // guidance, automation, analysis
  question: text('question'),
  context: jsonb('context').default('{}'),
  systemContext: jsonb('system_context').default('{}'), // Asset/system information
  environmentContext: jsonb('environment_context').default('{}'), // Environment details
  complianceContext: jsonb('compliance_context').default('{}'), // Compliance requirements
  implementationGuidance: text('implementation_guidance'),
  remediationPlan: text('remediation_plan'),
  automationScript: text('automation_script'),
  testingProcedure: text('testing_procedure'),
  rollbackProcedure: text('rollback_procedure'),
  riskAssessment: text('risk_assessment'),
  businessImpact: text('business_impact'),
  technicalImpact: text('technical_impact'),
  costEstimate: numeric('cost_estimate', { precision: 10, scale: 2 }),
  timeEstimate: integer('time_estimate'), // Minutes
  complexityScore: integer('complexity_score'), // 1-10
  confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 }), // 0-1
  aiProvider: varchar('ai_provider', { length: 50 }), // openai, anthropic, etc.
  aiModel: varchar('ai_model', { length: 100 }),
  aiResponse: text('ai_response').notNull(),
  aiMetadata: jsonb('ai_metadata').default('{}'),
  promptUsed: text('prompt_used'),
  tokensUsed: integer('tokens_used'),
  processingTime: integer('processing_time'), // Milliseconds
  qualityRating: integer('quality_rating'), // 1-5 user rating
  userFeedback: text('user_feedback'),
  implementationStatus: varchar('implementation_status', { length: 50 }),
  implementationResult: text('implementation_result'),
  validationResult: text('validation_result'),
  effectivenessScore: integer('effectiveness_score'), // 1-10
  accuracyScore: integer('accuracy_score'), // 1-10
  usefulnessScore: integer('usefulness_score'), // 1-10
  followUpRequired: boolean('follow_up_required').default(false),
  followUpNotes: text('follow_up_notes'),
  relatedRequests: integer('related_requests').array(),
  tags: text('tags').array(),
  isPublic: boolean('is_public').default(false), // Share with other users
  isApproved: boolean('is_approved').default(false),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  version: integer('version').default(1),
  parentRequestId: integer('parent_request_id').references(() => stigAiAssistance.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  stigLibrary,
  stigChecklists,
  stigAssessments,
  stigScanResults,
  stigHardeningSessions,
  stigHardeningResults,
  stigHardeningBackups,
  stigFixStatus,
  stigAiAssistance,
  // Export enums
  stigChecklistStatusEnum,
  stigAssessmentStatusEnum,
  stigComplianceStatusEnum,
  stigImplementationStatusEnum,
  stigHardeningSessionStatusEnum,
  stigHardeningResultStatusEnum,
  stigHardeningBackupTypeEnum,
  stigSeverityEnum,
  stigStatusEnum,
};
