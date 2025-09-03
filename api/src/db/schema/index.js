// Export all schema definitions
const { users, userRoleEnum, userStatusEnum } = require('./users');
const { roles } = require('./roles');
const { permissions } = require('./permissions');
const { rolePermissions } = require('./rolePermissions');
const { userRoles } = require('./userRoles');
const { userPreferences } = require('./userPreferences');
const { accessRequests, accessRequestStatusEnum } = require('./accessRequests');
const { emailLogs, emailLogStatusEnum } = require('./emailLogs');
const { emailTemplates, emailTemplateTypeEnum, emailTemplateStatusEnum } = require('./emailTemplates');

// Integration schemas
const { systems, systemImpactLevels } = require('./systems');
const { assets, assetSystems, systemAssets, assetTags, assetNetwork } = require('./assets');
const { vulnerabilities, vulnerabilityReferences, vulnerabilityRiskScores } = require('./vulnerabilities');
const { cves, cveMappings, vulnerabilityCves } = require('./cves');
const { poams, poamAssets, poamCves, poamMilestones, vulnerabilityPoams } = require('./poams');
const { controls, controlEvidence, controlFindings, controlInheritance, controlPoams, poamApprovalComments } = require('./controls');
const { assetVulnerabilities, detectionStatusEnum } = require('./assetVulnerabilities');

// Vulnerability Analytics schemas
const {
  vulnerabilityCostAnalysis,
  vulnerabilityCostFactors,
  vulnerabilityCostHistory,
  vulnerabilityCostModels,
  vulnerabilityDatabases,
  vulnerabilityPatches,
  costModelTypeEnum,
  costFactorTypeEnum,
  patchStatusEnum,
  databaseSourceEnum
} = require('./vulnerabilityAnalytics');

// Asset management schemas
const {
  assetCostManagement,
  assetGroups,
  assetGroupMembers,
  assetLifecycle,
  assetOperationalCosts,
  assetRiskMapping,
  costTypeEnum,
  billingCycleEnum,
  mappingMethodEnum
} = require('./assetManagement');

// Natural language query schemas
const {
  nlQueries,
  queryTemplates,
  nlQueriesStatusEnum,
  nlQueriesQueryTypeEnum,
  nlQueriesFeedbackEnum
} = require('./naturalLanguageQueries');

// Authorization to Operate schemas
const {
  authorizationsToOperate,
  atoWorkflowHistory,
  atoDocuments,
  atoTypeEnum,
  atoStatusEnum,
  atoWorkflowApprovalRoleEnum,
  atoWorkflowStageEnum
} = require('./authorizationsToOperate');

// Audit Logs schemas
const {
  auditLogs,
  auditLogsActionEnum,
  auditLogsLevelEnum
} = require('./auditLogs');

// Dashboard and Metrics schemas
const {
  metrics,
  chartTypes,
  chartConfigurations,
  dashboards,
  dashboardMetrics,
  dashboardShares,
  userDashboards,
  dashboardSharesPermissionEnum,
  metricsTypeEnum,
  metricsCategoryEnum,
  chartTypeEnum
} = require('./dashboards');

// Notification schemas
const {
  notifications,
  notificationChannels,
  notificationTemplates,
  notificationSubscriptions,
  notificationDeliveries,
  notificationTypeEnum,
  channelTypeEnum,
  deliveryStatusEnum,
  templateFormatEnum
} = require('./notifications');
const { artifacts, artifactCategories, artifactReferences, artifactTags } = require('./artifacts');
const { categories } = require('./categories');
const {
  folders,
  documents,
  documentShares,
  documentFavorites,
  documentAnalytics,
  documentChanges,
  documentComments,
  documentTemplates,
  documentVersions,
  documentActionEnum,
  documentChangeTypeEnum,
  documentVersionChangeTypeEnum,
  documentPermissionLevelEnum,
  folderTypeEnum
} = require('./documents');
const { syncJobs, syncServiceEnum } = require('./syncJobs');
const { syncLogs, syncStatusEnum } = require('./syncLogs');

// Patch Management schemas
const {
  patches,
  patchVulnerabilities,
  patchAssets,
  patchDependencies,
  patchManagementStatusEnum,
  patchSeverityEnum,
  patchTypeEnum,
  patchVendorEnum
} = require('./patches');

const {
  patchJobs,
  patchJobTargets,
  patchJobLogs,
  patchJobDependencies,
  jobStatusEnum,
  jobTypeEnum,
  executionModeEnum,
  jobPriorityEnum
} = require('./patchJobs');

const {
  patchSchedules,
  scheduleExecutions,
  scheduleConditions,
  scheduleExclusions,
  scheduleNotifications,
  scheduleStatusEnum,
  scheduleTypeEnum,
  recurrencePatternEnum,
  maintenanceWindowTypeEnum
} = require('./patchSchedules');

const {
  patchApprovals,
  approvalResponses,
  approvalWorkflows,
  workflowApprovers,
  approvalNotifications,
  approvalAuditLog,
  approvalStatusEnum,
  approvalTypeEnum,
  approvalLevelEnum,
  delegationReasonEnum
} = require('./patchApprovals');

const {
  patchNotes,
  noteAttachments,
  noteComments,
  patchActivityFeed,
  noteTemplates,
  noteTypeEnum,
  noteCategoryEnum,
  visibilityLevelEnum,
  attachmentTypeEnum
} = require('./patchNotes');

// Policy and Procedure schemas
const {
  policies,
  procedures,
  policyProcedures,
  policyWorkflows,
  policyWorkflowHistory,
  policyWorkflowPolicies,
  policyStatusEnum,
  policyTypeEnum,
  procedureStatusEnum,
  procedureTypeEnum,
  policyProcedureStatusEnum,
  workflowTypeEnum,
  workflowStatusEnum
} = require('./policies');

// AI Generation schemas
const {
  aiGenerationRequests,
  aiGenerationTemplates,
  aiGenerationFeedback,
  aiModelConfigurations,
  aiGenerationAnalytics,
  generationTypeEnum,
  generationStatusEnum,
  aiProviderEnum,
  generationModeEnum
} = require('./aiGeneration');

// Reporting system schemas
const {
  reportTemplates,
  reportConfigurations,
  reportSchedules,
  reports,
  reportExecutions,
  reportShares,
  reportSubscriptions,
  reportAnalytics,
  reportTypeEnum,
  reportStatusEnum,
  reportFormatEnum,
  scheduleFrequencyEnum
} = require('./reports');

// STIG Management system schemas
const {
  stigLibrary,
  stigChecklists,
  stigAssessments,
  stigScanResults,
  stigHardeningSessions,
  stigHardeningResults,
  stigHardeningBackups,
  stigFixStatus,
  stigAiAssistance,
  stigChecklistStatusEnum,
  stigAssessmentStatusEnum,
  stigComplianceStatusEnum,
  stigImplementationStatusEnum,
  stigHardeningSessionStatusEnum,
  stigHardeningResultStatusEnum,
  stigHardeningBackupTypeEnum,
  stigSeverityEnum,
  stigStatusEnum
} = require('./stig');

// SIEM system schemas
const {
  siemLogSources,
  siemRules,
  siemEvents,
  siemAlerts,
  siemDashboards,
  siemIncidents,
  siemThreatIntelligence,
  siemAnalytics,
  siemAlertSeverityEnum,
  siemAlertStatusEnum,
  siemEventSeverityEnum,
  siemEventStatusEnum,
  siemRuleTypeEnum,
  siemRuleSeverityEnum,
} = require('./siem');

// AI Assistance system schemas
const {
  aiAssistanceRequests,
  aiKnowledgeBase,
  aiTrainingData,
  aiAnalytics: aiAssistanceAnalytics,
  aiAutomationRules,
  aiRequestTypeEnum,
  aiProviderEnum: aiAssistanceProviderEnum,
  aiStatusEnum,
  aiConfidenceEnum,
} = require('./aiAssistance');

// Module management schemas
const {
  appModules,
  moduleNavigation,
  roleModulePermissions,
  userModulePreferences,
  moduleDependencies,
  moduleSettings,
  moduleAuditLog,
  moduleAnalytics,
} = require('./modules');

// Scanner schemas
const {
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
} = require('./scanner');

// Session schemas
const { sessions } = require('./sessions');

// Settings schemas
const { settings, settingDataTypeEnum } = require('./settings');

// Distribution Groups schemas
const { distributionGroups, distributionGroupMembers } = require('./distributionGroups');

// System Management schemas
const {
  backupJobs,
  batches,
  deployments,
  schedules,
  jobExecutions,
  backupTypeEnum,
  backupStatusEnum,
  batchStatusEnum,
  deploymentStatusEnum,
  deploymentTypeEnum
} = require('./systemOperations');

// Data Management schemas
const {
  errors,
  dataQuality,
  dataFreshness,
  integrations,
  importJobs,
  exportJobs,
  errorSeverityEnum,
  integrationTypeEnum,
  authTypeEnum
} = require('./dataManagement');

// Organization Tools schemas
const {
  tags,
  tasks,
  savedFilters,
  customFields,
  customFieldValues,
  entitySynonyms,
  entityTags,
  taskStatusEnum,
  taskPriorityEnum,
  fieldTypeEnum
} = require('./organizationTools');

// Workflow Management schemas
const {
  workflows,
  workflowNodes,
  workflowEdges,
  workflowInstances,
  workflowExecutions,
  workflowTriggers,
  workflowStatusEnum: workflowMgmtStatusEnum,
  workflowInstanceStatusEnum,
  workflowExecutionStatusEnum,
  triggerTypeEnum
} = require('./workflowManagement');

// Cost & Risk Management schemas
const {
  budgetImpact,
  businessImpactCosts,
  costBudgets,
  costCenters,
  riskAdjustmentFactors,
  riskFactors,
  riskModels,
  riskScoreHistory,
  impactLevelEnum,
  riskLevelEnum,
  costCategoryEnum,
  budgetStatusEnum
} = require('./costRiskManagement');

// Advanced Security schemas
const {
  roleModulePermissions: advancedRoleModulePermissions,
  roleNavigationPermissions,
  sspControls,
  sspPoamMappings,
  complianceControls,
  complianceFrameworks,
  controlComplianceStatus,
  complianceStatusEnum,
  controlStatusEnum,
  assessmentStatusEnum
} = require('./advancedSecurity');

// AI & NLQ Features schemas
const {
  nlqChatSessions,
  nlqChatMessages,
  nlqDataSources,
  nlqFewShotExamples,
  nlqPromptConfig,
  nlqQueryLogs,
  openaiUsage,
  chatStatusEnum,
  queryStatusEnum,
  usageTypeEnum,
  modelTypeEnum
} = require('./aiNlqFeatures');

// Webhooks & Integrations schemas
const {
  webhookConfigurations,
  webhookDeliveries,
  webhookLogs,
  webhookRateLimits,
  webhookSecurity,
  webhookSubscriptions,
  importHistory,
  webhookStatusEnum,
  deliveryStatusEnum: webhookDeliveryStatusEnum,
  httpMethodEnum,
  securityTypeEnum
} = require('./webhooksIntegrations');

// Dashboard Components schemas
const {
  dashboardThemes,
  dashboardWidgets,
  widgetTemplates,
  themeTypeEnum,
  widgetTypeEnum,
  chartTypeEnum: widgetChartTypeEnum,
  widgetSizeEnum
} = require('./dashboardComponents');

// Infrastructure & Assets schemas
const {
  cloudAssets,
  cloudCostMapping,
  softwareAssets,
  softwareLifecycle,
  networkDiagrams,
  cloudProviderEnum,
  assetStateEnum,
  licenseTypeEnum,
  diagramTypeEnum
} = require('./infrastructureAssets');

// Diagram Management schemas
const {
  diagrams,
  diagramTemplates,
  diagramProjects,
  diagramSharedProjects,
  diagramVersions,
  diagramNodeLibrary,
  digitalSignatures,
  diagramStatusEnum,
  sharePermissionEnum,
  signatureStatusEnum
} = require('./diagramManagement');

// STIG & Security Management schemas
const {
  stigAssets,
  stigAssetAssignments,
  stigCollections,
  stigDownloads,
  stigMappings,
  stigReviews,
  stigRules,
  attackSurfaceMapping,
  stigStatusEnum: stigMgmtStatusEnum,
  severityEnum,
  mappingTypeEnum
} = require('./stigSecurityManagement');

// System Analysis schemas
const {
  systemComplianceMapping,
  systemConfigurationDrift,
  systemDiscoveryScans,
  systemDiscoveryResults,
  systemSecurityPosture,
  systemThreatModeling,
  sshConnectionProfiles,
  discoveryStatusEnum,
  complianceLevelEnum,
  postureStatusEnum,
  threatLevelEnum
} = require('./systemAnalysis');

// Compliance & Documentation schemas
const {
  informationClassificationItems,
  securityClassificationGuide,
  references,
  planOfActionMilestones,
  poamSignatures,
  generatedReports,
  classificationLevelEnum,
  documentStatusEnum,
  referenceTypeEnum
} = require('./complianceDocumentation');

// Patch, License & Miscellaneous schemas
const {
  patchApprovalHistory,
  patchScheduleExecutions,
  patchesOrphan,
  licenseTypes,
  licenses,
  licenseCosts,
  exploits,
  businessImpactAnalysis,
  conflictResolutions,
  cpeMappings,
  crossSystemCorrelations,
  dataConflicts,
  dataContexts,
  enterpriseRiskAggregation,
  remediationCostEntries,
  vendorMap,
  vulnerabilityDatabases: miscVulnerabilityDatabases,
  approvalStatusEnum: patchApprovalStatusEnum,
  executionStatusEnum,
  exploitTypeEnum,
  exploitStatusEnum
} = require('./patchLicenseMisc');

module.exports = {
  // User management
  users,
  userRoleEnum,
  userStatusEnum,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  userPreferences,
  accessRequests,
  accessRequestStatusEnum,

  // Email system
  emailLogs,
  emailLogStatusEnum,
  emailTemplates,
  emailTemplateTypeEnum,
  emailTemplateStatusEnum,

  // Integration system
  systems,
  systemImpactLevels,
  assets,
  assetSystems,
  systemAssets,
  assetTags,
  assetNetwork,
  vulnerabilities,
  vulnerabilityReferences,
  vulnerabilityRiskScores,
  cves,
  cveMappings,
  vulnerabilityCves,
  poams,
  poamAssets,
  poamCves,
  poamMilestones,
  vulnerabilityPoams,
  controls,
  controlEvidence,
  controlFindings,
  controlInheritance,
  controlPoams,
  poamApprovalComments,
  assetVulnerabilities,
  detectionStatusEnum,

  // Vulnerability Analytics
  vulnerabilityCostAnalysis,
  vulnerabilityCostFactors,
  vulnerabilityCostHistory,
  vulnerabilityCostModels,
  vulnerabilityDatabases,
  vulnerabilityPatches,
  costModelTypeEnum,
  costFactorTypeEnum,
  patchStatusEnum,
  databaseSourceEnum,

  // Asset management
  assetCostManagement,
  assetGroups,
  assetGroupMembers,
  assetLifecycle,
  assetOperationalCosts,
  assetRiskMapping,
  costTypeEnum,
  billingCycleEnum,
  mappingMethodEnum,

  // Distribution Groups
  distributionGroups,
  distributionGroupMembers,

  // Natural language queries
  nlQueries,
  queryTemplates,
  nlQueriesStatusEnum,
  nlQueriesQueryTypeEnum,
  nlQueriesFeedbackEnum,

  // Authorization to Operate
  authorizationsToOperate,
  atoWorkflowHistory,
  atoDocuments,
  atoTypeEnum,
  atoStatusEnum,
  atoWorkflowApprovalRoleEnum,
  atoWorkflowStageEnum,

  // Audit Logs
  auditLogs,
  auditLogsActionEnum,
  auditLogsLevelEnum,

  // Dashboard and Metrics
  metrics,
  chartTypes,
  chartConfigurations,
  dashboards,
  dashboardMetrics,
  dashboardShares,
  userDashboards,
  dashboardSharesPermissionEnum,
  metricsTypeEnum,
  metricsCategoryEnum,
  chartTypeEnum,

  // Notifications
  notifications,
  notificationChannels,
  notificationTemplates,
  notificationSubscriptions,
  notificationDeliveries,
  notificationTypeEnum,
  channelTypeEnum,
  deliveryStatusEnum,
  templateFormatEnum,

  // Artifact management
  artifacts,
  artifactCategories,
  artifactReferences,
  artifactTags,

  // Category management
  categories,

  // Document management
  folders,
  documents,
  documentShares,
  documentFavorites,
  documentAnalytics,
  documentChanges,
  documentComments,
  documentTemplates,
  documentVersions,
  documentActionEnum,
  documentChangeTypeEnum,
  documentVersionChangeTypeEnum,
  documentPermissionLevelEnum,
  folderTypeEnum,

  // Sync orchestration
  syncJobs,
  syncServiceEnum,
  syncLogs,
  syncStatusEnum,

  // Policy and Procedure management
  policies,
  procedures,
  policyProcedures,
  policyWorkflows,
  policyWorkflowHistory,
  policyWorkflowPolicies,
  policyStatusEnum,
  policyTypeEnum,
  procedureStatusEnum,
  procedureTypeEnum,
  policyProcedureStatusEnum,
  workflowTypeEnum,
  workflowStatusEnum,

  // AI Generation system
  aiGenerationRequests,
  aiGenerationTemplates,
  aiGenerationFeedback,
  aiModelConfigurations,
  aiGenerationAnalytics,
  generationTypeEnum,
  generationStatusEnum,
  aiProviderEnum,
  generationModeEnum,

  // Reporting system
  reportTemplates,
  reportConfigurations,
  reportSchedules,
  reports,
  reportExecutions,
  reportShares,
  reportSubscriptions,
  reportAnalytics,
  reportTypeEnum,
  reportStatusEnum,
  reportFormatEnum,
  scheduleFrequencyEnum,

  // STIG Management system
  stigLibrary,
  stigChecklists,
  stigAssessments,
  stigScanResults,
  stigHardeningSessions,
  stigHardeningResults,
  stigHardeningBackups,
  stigFixStatus,
  stigAiAssistance,
  stigChecklistStatusEnum,
  stigAssessmentStatusEnum,
  stigComplianceStatusEnum,
  stigImplementationStatusEnum,
  stigHardeningSessionStatusEnum,
  stigHardeningResultStatusEnum,
  stigHardeningBackupTypeEnum,
  stigSeverityEnum,
  stigStatusEnum,

  // SIEM system tables
  siemLogSources,
  siemRules,
  siemEvents,
  siemAlerts,
  siemDashboards,
  siemIncidents,
  siemThreatIntelligence,
  siemAnalytics,
  siemAlertSeverityEnum,
  siemAlertStatusEnum,
  siemEventSeverityEnum,
  siemEventStatusEnum,
  siemRuleTypeEnum,
  siemRuleSeverityEnum,

  // AI Assistance system tables
  aiAssistanceRequests,
  aiKnowledgeBase,
  aiTrainingData,
  aiAssistanceAnalytics,
  aiAutomationRules,
  aiRequestTypeEnum,
  aiAssistanceProviderEnum,
  aiStatusEnum,
  aiConfidenceEnum,

  // Module management tables
  appModules,
  moduleNavigation,
  roleModulePermissions,
  userModulePreferences,
  moduleDependencies,
  moduleSettings,
  moduleAuditLog,
  moduleAnalytics,

  // Scanner tables
  scanJobs,
  scanResults,
  scanSchedules,
  scanTemplates,
  scanTargets,
  scanPolicies,
  scanFindings,
  scanReports,
  scanTypeEnum,
  scanStatusEnum,

  // Session tables
  sessions,

  // Settings tables
  settings,
  settingDataTypeEnum,

  // Patch Management system
  patches,
  patchVulnerabilities,
  patchAssets,
  patchDependencies,
  patchManagementStatusEnum,
  patchSeverityEnum,
  patchTypeEnum,
  patchVendorEnum,

  patchJobs,
  patchJobTargets,
  patchJobLogs,
  patchJobDependencies,
  jobStatusEnum,
  jobTypeEnum,
  executionModeEnum,
  jobPriorityEnum,

  patchSchedules,
  scheduleExecutions,
  scheduleConditions,
  scheduleExclusions,
  scheduleNotifications,
  scheduleStatusEnum,
  scheduleTypeEnum,
  recurrencePatternEnum,
  maintenanceWindowTypeEnum,

  patchApprovals,
  approvalResponses,
  approvalWorkflows,
  workflowApprovers,
  approvalNotifications,
  approvalAuditLog,
  approvalStatusEnum,
  approvalTypeEnum,
  approvalLevelEnum,
  delegationReasonEnum,

  patchNotes,
  noteAttachments,
  noteComments,
  patchActivityFeed,
  noteTemplates,
  noteTypeEnum,
  noteCategoryEnum,
  visibilityLevelEnum,
  attachmentTypeEnum,

  // System Management
  backupJobs,
  batches,
  deployments,
  schedules,
  jobExecutions,
  backupTypeEnum,
  backupStatusEnum,
  batchStatusEnum,
  deploymentStatusEnum,
  deploymentTypeEnum,

  // Data Management
  errors,
  dataQuality,
  dataFreshness,
  integrations,
  importJobs,
  exportJobs,
  errorSeverityEnum,
  integrationTypeEnum,
  authTypeEnum,

  // Organization Tools
  tags,
  tasks,
  savedFilters,
  customFields,
  customFieldValues,
  entitySynonyms,
  entityTags,
  taskStatusEnum,
  taskPriorityEnum,
  fieldTypeEnum,

  // Workflow Management
  workflows,
  workflowNodes,
  workflowEdges,
  workflowInstances,
  workflowExecutions,
  workflowTriggers,
  workflowMgmtStatusEnum,
  workflowInstanceStatusEnum,
  workflowExecutionStatusEnum,
  triggerTypeEnum,

  // Cost & Risk Management
  budgetImpact,
  businessImpactCosts,
  costBudgets,
  costCenters,
  riskAdjustmentFactors,
  riskFactors,
  riskModels,
  riskScoreHistory,
  impactLevelEnum,
  riskLevelEnum,
  costCategoryEnum,
  budgetStatusEnum,

  // Advanced Security
  advancedRoleModulePermissions,
  roleNavigationPermissions,
  sspControls,
  sspPoamMappings,
  complianceControls,
  complianceFrameworks,
  controlComplianceStatus,
  complianceStatusEnum,
  controlStatusEnum,
  assessmentStatusEnum,

  // AI & NLQ Features
  nlqChatSessions,
  nlqChatMessages,
  nlqDataSources,
  nlqFewShotExamples,
  nlqPromptConfig,
  nlqQueryLogs,
  openaiUsage,
  chatStatusEnum,
  queryStatusEnum,
  usageTypeEnum,
  modelTypeEnum,

  // Webhooks & Integrations
  webhookConfigurations,
  webhookDeliveries,
  webhookLogs,
  webhookRateLimits,
  webhookSecurity,
  webhookSubscriptions,
  importHistory,
  webhookStatusEnum,
  webhookDeliveryStatusEnum,
  httpMethodEnum,
  securityTypeEnum,

  // Dashboard Components
  dashboardThemes,
  dashboardWidgets,
  widgetTemplates,
  themeTypeEnum,
  widgetTypeEnum,
  widgetChartTypeEnum,
  widgetSizeEnum,

  // Infrastructure & Assets
  cloudAssets,
  cloudCostMapping,
  softwareAssets,
  softwareLifecycle,
  networkDiagrams,
  cloudProviderEnum,
  assetStateEnum,
  licenseTypeEnum,
  diagramTypeEnum,

  // Diagram Management
  diagrams,
  diagramTemplates,
  diagramProjects,
  diagramSharedProjects,
  diagramVersions,
  diagramNodeLibrary,
  digitalSignatures,
  diagramStatusEnum,
  sharePermissionEnum,
  signatureStatusEnum,

  // STIG & Security Management
  stigAssets,
  stigAssetAssignments,
  stigCollections,
  stigDownloads,
  stigMappings,
  stigReviews,
  stigRules,
  attackSurfaceMapping,
  stigMgmtStatusEnum,
  severityEnum,
  mappingTypeEnum,

  // System Analysis
  systemComplianceMapping,
  systemConfigurationDrift,
  systemDiscoveryScans,
  systemDiscoveryResults,
  systemSecurityPosture,
  systemThreatModeling,
  sshConnectionProfiles,
  discoveryStatusEnum,
  complianceLevelEnum,
  postureStatusEnum,
  threatLevelEnum,

  // Compliance & Documentation
  informationClassificationItems,
  securityClassificationGuide,
  references,
  planOfActionMilestones,
  poamSignatures,
  generatedReports,
  classificationLevelEnum,
  documentStatusEnum,
  referenceTypeEnum,

  // Patch, License & Miscellaneous
  patchApprovalHistory,
  patchScheduleExecutions,
  patchesOrphan,
  licenseTypes,
  licenses,
  licenseCosts,
  exploits,
  businessImpactAnalysis,
  conflictResolutions,
  cpeMappings,
  crossSystemCorrelations,
  dataConflicts,
  dataContexts,
  enterpriseRiskAggregation,
  remediationCostEntries,
  vendorMap,
  miscVulnerabilityDatabases,
  patchApprovalStatusEnum,
  executionStatusEnum,
  exploitTypeEnum,
  exploitStatusEnum,
};
