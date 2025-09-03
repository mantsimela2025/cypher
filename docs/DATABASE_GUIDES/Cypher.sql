-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP TYPE public."conflict_severity";

CREATE TYPE public."conflict_severity" AS ENUM (
	'low',
	'medium',
	'high',
	'critical');

-- DROP TYPE public."conflict_status";

CREATE TYPE public."conflict_status" AS ENUM (
	'pending',
	'resolved',
	'pending_review',
	'ignored');

-- DROP TYPE public."discovery_status";

CREATE TYPE public."discovery_status" AS ENUM (
	'pending',
	'running',
	'completed',
	'failed',
	'cancelled');

-- DROP TYPE public."drift_severity";

CREATE TYPE public."drift_severity" AS ENUM (
	'low',
	'medium',
	'high',
	'critical');

-- DROP TYPE public."enum_access_requests_status";

CREATE TYPE public."enum_access_requests_status" AS ENUM (
	'pending',
	'approved',
	'rejected');

-- DROP TYPE public."enum_ai_assistance_confidence";

CREATE TYPE public."enum_ai_assistance_confidence" AS ENUM (
	'very_low',
	'low',
	'medium',
	'high',
	'very_high');

-- DROP TYPE public."enum_ai_assistance_provider";

CREATE TYPE public."enum_ai_assistance_provider" AS ENUM (
	'openai',
	'anthropic',
	'azure_openai',
	'aws_bedrock',
	'google_vertex',
	'local_model',
	'government_ai');

-- DROP TYPE public."enum_ai_assistance_request_type";

CREATE TYPE public."enum_ai_assistance_request_type" AS ENUM (
	'threat_analysis',
	'incident_response',
	'compliance_guidance',
	'policy_generation',
	'risk_assessment',
	'vulnerability_analysis',
	'forensic_analysis',
	'training_content',
	'documentation',
	'code_review',
	'configuration_review',
	'threat_hunting',
	'malware_analysis',
	'network_analysis',
	'log_analysis');

-- DROP TYPE public."enum_ai_assistance_status";

CREATE TYPE public."enum_ai_assistance_status" AS ENUM (
	'pending',
	'processing',
	'completed',
	'failed',
	'cancelled',
	'requires_review',
	'approved',
	'rejected');

-- DROP TYPE public."enum_asset_cost_management_billing_cycle";

CREATE TYPE public."enum_asset_cost_management_billing_cycle" AS ENUM (
	'one_time',
	'monthly',
	'quarterly',
	'annual',
	'custom');

-- DROP TYPE public."enum_asset_cost_management_cost_type";

CREATE TYPE public."enum_asset_cost_management_cost_type" AS ENUM (
	'acquisition',
	'operational',
	'maintenance',
	'licensing',
	'support',
	'training',
	'disposal');

-- DROP TYPE public."enum_asset_vulnerabilities_detection_status";

CREATE TYPE public."enum_asset_vulnerabilities_detection_status" AS ENUM (
	'detected',
	'confirmed',
	'false_positive',
	'mitigated');

-- DROP TYPE public."enum_assets_status";

CREATE TYPE public."enum_assets_status" AS ENUM (
	'active',
	'inactive',
	'decommissioned',
	'retired',
	'archived');

-- DROP TYPE public."enum_ato_workflow_history_approval_role";

CREATE TYPE public."enum_ato_workflow_history_approval_role" AS ENUM (
	'ISSO',
	'ISSM',
	'AO');

-- DROP TYPE public."enum_ato_workflow_history_workflow_stage";

CREATE TYPE public."enum_ato_workflow_history_workflow_stage" AS ENUM (
	'initial_submission',
	'isso_review',
	'issm_review',
	'ao_review',
	'completed');

-- DROP TYPE public."enum_audit_logs_action";

CREATE TYPE public."enum_audit_logs_action" AS ENUM (
	'create',
	'read',
	'update',
	'delete',
	'login',
	'logout',
	'export',
	'import');

-- DROP TYPE public."enum_audit_logs_level";

CREATE TYPE public."enum_audit_logs_level" AS ENUM (
	'info',
	'warning',
	'error',
	'critical');

-- DROP TYPE public."enum_authorizations_to_operate_status";

CREATE TYPE public."enum_authorizations_to_operate_status" AS ENUM (
	'draft',
	'submitted',
	'approved',
	'rejected',
	'expired');

-- DROP TYPE public."enum_authorizations_to_operate_type";

CREATE TYPE public."enum_authorizations_to_operate_type" AS ENUM (
	'full',
	'provisional',
	'authority_to_test');

-- DROP TYPE public."enum_control_compliance_status_implementation_status";

CREATE TYPE public."enum_control_compliance_status_implementation_status" AS ENUM (
	'not_implemented',
	'partially_implemented',
	'implemented',
	'not_applicable');

-- DROP TYPE public."enum_control_compliance_status_verification_method";

CREATE TYPE public."enum_control_compliance_status_verification_method" AS ENUM (
	'interview',
	'examine',
	'test',
	'automated');

-- DROP TYPE public."enum_dashboard_shares_permission";

CREATE TYPE public."enum_dashboard_shares_permission" AS ENUM (
	'view',
	'edit',
	'admin',
	'share',
	'delete');

-- DROP TYPE public."enum_dashboard_widgets_type";

CREATE TYPE public."enum_dashboard_widgets_type" AS ENUM (
	'chart',
	'table',
	'metric',
	'text',
	'alert');

-- DROP TYPE public."enum_diagrams_format";

CREATE TYPE public."enum_diagrams_format" AS ENUM (
	'drawio',
	'visio',
	'lucidchart',
	'mermaid',
	'plantuml',
	'svg',
	'png',
	'pdf');

-- DROP TYPE public."enum_diagrams_status";

CREATE TYPE public."enum_diagrams_status" AS ENUM (
	'draft',
	'published',
	'archived');

-- DROP TYPE public."enum_diagrams_type";

CREATE TYPE public."enum_diagrams_type" AS ENUM (
	'network',
	'architecture',
	'flow',
	'organizational',
	'process',
	'security',
	'compliance');

-- DROP TYPE public."enum_document_templates_category";

CREATE TYPE public."enum_document_templates_category" AS ENUM (
	'policy',
	'procedure',
	'report',
	'assessment',
	'audit',
	'notification',
	'custom');

-- DROP TYPE public."enum_document_templates_format";

CREATE TYPE public."enum_document_templates_format" AS ENUM (
	'html',
	'markdown',
	'docx',
	'pdf');

-- DROP TYPE public."enum_document_templates_status";

CREATE TYPE public."enum_document_templates_status" AS ENUM (
	'draft',
	'active',
	'archived');

-- DROP TYPE public."enum_document_version_history_format";

CREATE TYPE public."enum_document_version_history_format" AS ENUM (
	'pdf',
	'docx',
	'doc',
	'txt',
	'html',
	'xml');

-- DROP TYPE public."enum_email_logs_status";

CREATE TYPE public."enum_email_logs_status" AS ENUM (
	'sent',
	'failed',
	'pending',
	'delivered');

-- DROP TYPE public."enum_email_templates_status";

CREATE TYPE public."enum_email_templates_status" AS ENUM (
	'active',
	'inactive',
	'draft');

-- DROP TYPE public."enum_email_templates_type";

CREATE TYPE public."enum_email_templates_type" AS ENUM (
	'notification',
	'alert',
	'report',
	'reminder',
	'welcome');

-- DROP TYPE public."enum_export_jobs_export_type";

CREATE TYPE public."enum_export_jobs_export_type" AS ENUM (
	'assets',
	'vulnerabilities',
	'reports',
	'users',
	'compliance',
	'policies');

-- DROP TYPE public."enum_export_jobs_format";

CREATE TYPE public."enum_export_jobs_format" AS ENUM (
	'csv',
	'json',
	'xml',
	'pdf',
	'xlsx');

-- DROP TYPE public."enum_export_jobs_status";

CREATE TYPE public."enum_export_jobs_status" AS ENUM (
	'pending',
	'processing',
	'completed',
	'failed',
	'cancelled');

-- DROP TYPE public."enum_generated_reports_format";

CREATE TYPE public."enum_generated_reports_format" AS ENUM (
	'pdf',
	'docx',
	'html',
	'json',
	'csv',
	'xlsx');

-- DROP TYPE public."enum_import_jobs_import_type";

CREATE TYPE public."enum_import_jobs_import_type" AS ENUM (
	'assets',
	'users',
	'vulnerabilities',
	'policies',
	'compliance',
	'configurations');

-- DROP TYPE public."enum_import_jobs_status";

CREATE TYPE public."enum_import_jobs_status" AS ENUM (
	'pending',
	'processing',
	'completed',
	'failed',
	'cancelled');

-- DROP TYPE public."enum_integrations_integration_type";

CREATE TYPE public."enum_integrations_integration_type" AS ENUM (
	'vulnerability_scanner',
	'asset_discovery',
	'siem',
	'ticketing',
	'identity_provider',
	'cloud_provider',
	'compliance_tool');

-- DROP TYPE public."enum_integrations_status";

CREATE TYPE public."enum_integrations_status" AS ENUM (
	'active',
	'inactive',
	'error',
	'pending');

-- DROP TYPE public."enum_metrics_category";

CREATE TYPE public."enum_metrics_category" AS ENUM (
	'security',
	'compliance',
	'performance',
	'availability',
	'business',
	'operational');

-- DROP TYPE public."enum_metrics_type";

CREATE TYPE public."enum_metrics_type" AS ENUM (
	'counter',
	'gauge',
	'histogram',
	'summary');

-- DROP TYPE public."enum_nl_queries_feedback";

CREATE TYPE public."enum_nl_queries_feedback" AS ENUM (
	'helpful',
	'not_helpful',
	'neutral');

-- DROP TYPE public."enum_nl_queries_query_type";

CREATE TYPE public."enum_nl_queries_query_type" AS ENUM (
	'vulnerability',
	'compliance',
	'asset',
	'policy',
	'report',
	'general');

-- DROP TYPE public."enum_nl_queries_status";

CREATE TYPE public."enum_nl_queries_status" AS ENUM (
	'pending',
	'processing',
	'completed',
	'failed');

-- DROP TYPE public."enum_plan_of_action_milestones_approval_status";

CREATE TYPE public."enum_plan_of_action_milestones_approval_status" AS ENUM (
	'pending',
	'approved',
	'rejected');

-- DROP TYPE public."enum_plan_of_action_milestones_status";

CREATE TYPE public."enum_plan_of_action_milestones_status" AS ENUM (
	'open',
	'in_progress',
	'completed',
	'deferred');

-- DROP TYPE public."enum_policy_procedures_status";

CREATE TYPE public."enum_policy_procedures_status" AS ENUM (
	'draft',
	'pending',
	'approved',
	'archived');

-- DROP TYPE public."enum_policy_workflows_status";

CREATE TYPE public."enum_policy_workflows_status" AS ENUM (
	'In Progress',
	'Awaiting Approval',
	'Pending Review',
	'Completed');

-- DROP TYPE public."enum_policy_workflows_workflow_type";

CREATE TYPE public."enum_policy_workflows_workflow_type" AS ENUM (
	'Review',
	'Approval',
	'Update');

-- DROP TYPE public."enum_reports_status";

CREATE TYPE public."enum_reports_status" AS ENUM (
	'draft',
	'generating',
	'completed',
	'failed');

-- DROP TYPE public."enum_reports_type";

CREATE TYPE public."enum_reports_type" AS ENUM (
	'vulnerability',
	'compliance',
	'asset',
	'poam',
	'custom');

-- DROP TYPE public."enum_siem_alerts_severity";

CREATE TYPE public."enum_siem_alerts_severity" AS ENUM (
	'low',
	'medium',
	'high',
	'critical');

-- DROP TYPE public."enum_siem_alerts_status";

CREATE TYPE public."enum_siem_alerts_status" AS ENUM (
	'new',
	'investigating',
	'resolved',
	'false_positive',
	'ignored');

-- DROP TYPE public."enum_siem_events_severity";

CREATE TYPE public."enum_siem_events_severity" AS ENUM (
	'low',
	'medium',
	'high',
	'critical');

-- DROP TYPE public."enum_siem_events_status";

CREATE TYPE public."enum_siem_events_status" AS ENUM (
	'new',
	'investigating',
	'resolved',
	'false_positive',
	'ignored');

-- DROP TYPE public."enum_siem_rules_rule_type";

CREATE TYPE public."enum_siem_rules_rule_type" AS ENUM (
	'pattern',
	'threshold',
	'correlation',
	'ml');

-- DROP TYPE public."enum_siem_rules_severity";

CREATE TYPE public."enum_siem_rules_severity" AS ENUM (
	'low',
	'medium',
	'high',
	'critical');

-- DROP TYPE public."enum_ssh_connection_profiles_auth_method";

CREATE TYPE public."enum_ssh_connection_profiles_auth_method" AS ENUM (
	'key',
	'password',
	'certificate');

-- DROP TYPE public."enum_ssh_connection_profiles_test_status";

CREATE TYPE public."enum_ssh_connection_profiles_test_status" AS ENUM (
	'success',
	'failed',
	'pending');

-- DROP TYPE public."enum_ssp_controls_implementation_status";

CREATE TYPE public."enum_ssp_controls_implementation_status" AS ENUM (
	'Implemented',
	'Partially Implemented',
	'Planned',
	'Not Implemented');

-- DROP TYPE public."enum_stig_checklists_status";

CREATE TYPE public."enum_stig_checklists_status" AS ENUM (
	'in_progress',
	'completed',
	'approved',
	'rejected');

-- DROP TYPE public."enum_stig_hardening_backups_backup_type";

CREATE TYPE public."enum_stig_hardening_backups_backup_type" AS ENUM (
	'file',
	'registry',
	'configuration',
	'other');

-- DROP TYPE public."enum_stig_hardening_results_status";

CREATE TYPE public."enum_stig_hardening_results_status" AS ENUM (
	'pending',
	'approved',
	'rejected');

-- DROP TYPE public."enum_stig_hardening_sessions_status";

CREATE TYPE public."enum_stig_hardening_sessions_status" AS ENUM (
	'pending',
	'approved',
	'rejected');

-- DROP TYPE public."enum_system_security_plans_security_category";

CREATE TYPE public."enum_system_security_plans_security_category" AS ENUM (
	'low',
	'moderate',
	'high');

-- DROP TYPE public."enum_users_role";

CREATE TYPE public."enum_users_role" AS ENUM (
	'admin',
	'manager',
	'analyst',
	'user');

-- DROP TYPE public."enum_users_status";

CREATE TYPE public."enum_users_status" AS ENUM (
	'active',
	'inactive',
	'pending',
	'suspended');

-- DROP TYPE public."enum_vulnerability_databases_sync_status";

CREATE TYPE public."enum_vulnerability_databases_sync_status" AS ENUM (
	'idle',
	'syncing',
	'completed',
	'failed');

-- DROP TYPE public."enum_vulnerability_databases_type";

CREATE TYPE public."enum_vulnerability_databases_type" AS ENUM (
	'nvd',
	'cve',
	'oval',
	'custom');

-- DROP TYPE public."environment_type";

CREATE TYPE public."environment_type" AS ENUM (
	'on-premises',
	'cloud',
	'hybrid');

-- DROP TYPE public.gtrgm;

CREATE TYPE public.gtrgm (
	INPUT = gtrgm_in,
	OUTPUT = gtrgm_out,
	ALIGNMENT = 4,
	STORAGE = plain,
	CATEGORY = U,
	DELIMITER = ',');

-- DROP TYPE public."posture_status";

CREATE TYPE public."posture_status" AS ENUM (
	'excellent',
	'good',
	'fair',
	'poor',
	'critical');

-- DROP TYPE public."resolution_action";

CREATE TYPE public."resolution_action" AS ENUM (
	'use_new',
	'use_existing',
	'use_resolved',
	'manual_review',
	'ignore',
	'merge');

-- DROP TYPE public."risk_level";

CREATE TYPE public."risk_level" AS ENUM (
	'low',
	'medium',
	'high',
	'critical');

-- DROP TYPE public."scan_status";

CREATE TYPE public."scan_status" AS ENUM (
	'pending',
	'running',
	'completed',
	'failed',
	'cancelled');

-- DROP TYPE public."scan_type";

CREATE TYPE public."scan_type" AS ENUM (
	'internal',
	'vulnerability',
	'compliance',
	'web');

-- DROP TYPE public."setting_data_type";

CREATE TYPE public."setting_data_type" AS ENUM (
	'string',
	'number',
	'boolean',
	'json',
	'array');

-- DROP TYPE public."webhook_service";

CREATE TYPE public."webhook_service" AS ENUM (
	'tenable',
	'xacta',
	'qualys',
	'rapid7',
	'nessus',
	'openvas');

-- DROP TYPE public."webhook_status";

CREATE TYPE public."webhook_status" AS ENUM (
	'pending',
	'processing',
	'completed',
	'failed',
	'timeout',
	'cancelled');

-- DROP SEQUENCE public.access_requests_id_seq;

CREATE SEQUENCE public.access_requests_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.access_requests_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.access_requests_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.ai_assistance_requests_id_seq;

CREATE SEQUENCE public.ai_assistance_requests_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.ai_assistance_requests_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.ai_assistance_requests_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.app_modules_id_seq;

CREATE SEQUENCE public.app_modules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.app_modules_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.app_modules_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.artifact_categories_id_seq;

CREATE SEQUENCE public.artifact_categories_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.artifact_categories_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.artifact_categories_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.artifact_references_id_seq;

CREATE SEQUENCE public.artifact_references_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.artifact_references_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.artifact_references_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.artifact_tags_id_seq;

CREATE SEQUENCE public.artifact_tags_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.artifact_tags_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.artifact_tags_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.artifacts_id_seq;

CREATE SEQUENCE public.artifacts_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.artifacts_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.artifacts_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_cost_management_id_seq;

CREATE SEQUENCE public.asset_cost_management_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_cost_management_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_cost_management_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_group_members_id_seq;

CREATE SEQUENCE public.asset_group_members_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_group_members_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_group_members_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_groups_id_seq;

CREATE SEQUENCE public.asset_groups_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_groups_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_groups_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_lifecycle_id_seq;

CREATE SEQUENCE public.asset_lifecycle_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_lifecycle_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_lifecycle_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_network_id_seq;

CREATE SEQUENCE public.asset_network_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_network_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_network_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_operational_costs_id_seq;

CREATE SEQUENCE public.asset_operational_costs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_operational_costs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_operational_costs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_risk_mapping_id_seq;

CREATE SEQUENCE public.asset_risk_mapping_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_risk_mapping_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_risk_mapping_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_systems_id_seq;

CREATE SEQUENCE public.asset_systems_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_systems_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_systems_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_tags_id_seq;

CREATE SEQUENCE public.asset_tags_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_tags_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_tags_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.asset_vulnerabilities_id_seq;

CREATE SEQUENCE public.asset_vulnerabilities_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.asset_vulnerabilities_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.asset_vulnerabilities_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.assets_id_seq;

CREATE SEQUENCE public.assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.assets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.assets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.ato_documents_id_seq;

CREATE SEQUENCE public.ato_documents_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.ato_documents_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.ato_documents_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.ato_workflow_history_id_seq;

CREATE SEQUENCE public.ato_workflow_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.ato_workflow_history_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.ato_workflow_history_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.attack_surface_mapping_id_seq;

CREATE SEQUENCE public.attack_surface_mapping_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.attack_surface_mapping_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.attack_surface_mapping_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.audit_logs_id_seq;

CREATE SEQUENCE public.audit_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.audit_logs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.audit_logs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.authorizations_to_operate_id_seq;

CREATE SEQUENCE public.authorizations_to_operate_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.authorizations_to_operate_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.authorizations_to_operate_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.backup_jobs_id_seq;

CREATE SEQUENCE public.backup_jobs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.backup_jobs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.backup_jobs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.batches_id_seq;

CREATE SEQUENCE public.batches_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.batches_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.batches_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.budget_impact_id_seq;

CREATE SEQUENCE public.budget_impact_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.budget_impact_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.budget_impact_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.business_impact_analysis_id_seq;

CREATE SEQUENCE public.business_impact_analysis_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.business_impact_analysis_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.business_impact_analysis_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.business_impact_costs_id_seq;

CREATE SEQUENCE public.business_impact_costs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.business_impact_costs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.business_impact_costs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.categories_id_seq;

CREATE SEQUENCE public.categories_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.categories_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.categories_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cloud_assets_id_seq;

CREATE SEQUENCE public.cloud_assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cloud_assets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cloud_assets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cloud_cost_mapping_id_seq;

CREATE SEQUENCE public.cloud_cost_mapping_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cloud_cost_mapping_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cloud_cost_mapping_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.compliance_controls_id_seq;

CREATE SEQUENCE public.compliance_controls_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.compliance_controls_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.compliance_controls_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.compliance_frameworks_id_seq;

CREATE SEQUENCE public.compliance_frameworks_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.compliance_frameworks_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.compliance_frameworks_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.conflict_resolutions_id_seq;

CREATE SEQUENCE public.conflict_resolutions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.conflict_resolutions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.conflict_resolutions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.control_compliance_status_id_seq;

CREATE SEQUENCE public.control_compliance_status_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.control_compliance_status_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.control_compliance_status_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.control_evidence_id_seq;

CREATE SEQUENCE public.control_evidence_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.control_evidence_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.control_evidence_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.control_findings_id_seq;

CREATE SEQUENCE public.control_findings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.control_findings_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.control_findings_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.control_inheritance_id_seq;

CREATE SEQUENCE public.control_inheritance_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.control_inheritance_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.control_inheritance_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.control_poams_id_seq;

CREATE SEQUENCE public.control_poams_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.control_poams_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.control_poams_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.controls_id_seq;

CREATE SEQUENCE public.controls_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.controls_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.controls_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cost_budgets_id_seq;

CREATE SEQUENCE public.cost_budgets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cost_budgets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cost_budgets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cost_centers_id_seq;

CREATE SEQUENCE public.cost_centers_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cost_centers_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cost_centers_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cpe_mappings_id_seq;

CREATE SEQUENCE public.cpe_mappings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cpe_mappings_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cpe_mappings_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cross_system_correlations_id_seq;

CREATE SEQUENCE public.cross_system_correlations_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cross_system_correlations_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cross_system_correlations_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.custom_field_values_id_seq;

CREATE SEQUENCE public.custom_field_values_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.custom_field_values_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.custom_field_values_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.custom_fields_id_seq;

CREATE SEQUENCE public.custom_fields_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.custom_fields_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.custom_fields_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cves_id_seq;

CREATE SEQUENCE public.cves_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cves_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cves_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.cwe_mappings_id_seq;

CREATE SEQUENCE public.cwe_mappings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.cwe_mappings_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.cwe_mappings_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.dashboard_metrics_id_seq;

CREATE SEQUENCE public.dashboard_metrics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.dashboard_metrics_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.dashboard_metrics_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.dashboard_shares_id_seq;

CREATE SEQUENCE public.dashboard_shares_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.dashboard_shares_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.dashboard_shares_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.dashboard_themes_id_seq;

CREATE SEQUENCE public.dashboard_themes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.dashboard_themes_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.dashboard_themes_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.dashboard_widgets_id_seq;

CREATE SEQUENCE public.dashboard_widgets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.dashboard_widgets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.dashboard_widgets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.dashboards_id_seq;

CREATE SEQUENCE public.dashboards_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.dashboards_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.dashboards_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.data_conflicts_id_seq;

CREATE SEQUENCE public.data_conflicts_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.data_conflicts_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.data_conflicts_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.data_contexts_id_seq;

CREATE SEQUENCE public.data_contexts_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.data_contexts_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.data_contexts_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.data_freshness_id_seq;

CREATE SEQUENCE public.data_freshness_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.data_freshness_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.data_freshness_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.data_quality_id_seq;

CREATE SEQUENCE public.data_quality_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.data_quality_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.data_quality_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.deployments_id_seq;

CREATE SEQUENCE public.deployments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.deployments_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.deployments_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.diagram_node_library_id_seq;

CREATE SEQUENCE public.diagram_node_library_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.diagram_node_library_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.diagram_node_library_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.diagram_projects_id_seq;

CREATE SEQUENCE public.diagram_projects_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.diagram_projects_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.diagram_projects_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.diagram_shared_projects_id_seq;

CREATE SEQUENCE public.diagram_shared_projects_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.diagram_shared_projects_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.diagram_shared_projects_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.diagram_templates_id_seq;

CREATE SEQUENCE public.diagram_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.diagram_templates_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.diagram_templates_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.diagram_versions_id_seq;

CREATE SEQUENCE public.diagram_versions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.diagram_versions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.diagram_versions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.diagrams_id_seq;

CREATE SEQUENCE public.diagrams_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.diagrams_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.diagrams_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.digital_signatures_id_seq;

CREATE SEQUENCE public.digital_signatures_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.digital_signatures_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.digital_signatures_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.distribution_group_members_id_seq;

CREATE SEQUENCE public.distribution_group_members_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.distribution_group_members_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.distribution_group_members_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.distribution_groups_id_seq;

CREATE SEQUENCE public.distribution_groups_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.distribution_groups_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.distribution_groups_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.email_logs_id_seq;

CREATE SEQUENCE public.email_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.email_logs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.email_logs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.email_templates_id_seq;

CREATE SEQUENCE public.email_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.email_templates_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.email_templates_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.enterprise_risk_aggregation_id_seq;

CREATE SEQUENCE public.enterprise_risk_aggregation_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.enterprise_risk_aggregation_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.enterprise_risk_aggregation_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.entity_synonyms_id_seq;

CREATE SEQUENCE public.entity_synonyms_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.entity_synonyms_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.entity_synonyms_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.entity_tags_id_seq;

CREATE SEQUENCE public.entity_tags_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.entity_tags_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.entity_tags_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.errors_id_seq;

CREATE SEQUENCE public.errors_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.errors_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.errors_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.exploits_id_seq;

CREATE SEQUENCE public.exploits_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.exploits_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.exploits_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.export_jobs_id_seq;

CREATE SEQUENCE public.export_jobs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.export_jobs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.export_jobs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.generated_reports_id_seq;

CREATE SEQUENCE public.generated_reports_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.generated_reports_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.generated_reports_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.import_history_id_seq;

CREATE SEQUENCE public.import_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.import_history_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.import_history_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.import_jobs_id_seq;

CREATE SEQUENCE public.import_jobs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.import_jobs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.import_jobs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.information_classification_items_id_seq;

CREATE SEQUENCE public.information_classification_items_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.information_classification_items_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.information_classification_items_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.integrations_id_seq;

CREATE SEQUENCE public.integrations_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.integrations_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.integrations_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.job_executions_id_seq;

CREATE SEQUENCE public.job_executions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.job_executions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.job_executions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.license_costs_id_seq;

CREATE SEQUENCE public.license_costs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.license_costs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.license_costs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.license_types_id_seq;

CREATE SEQUENCE public.license_types_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.license_types_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.license_types_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.licenses_id_seq;

CREATE SEQUENCE public.licenses_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.licenses_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.licenses_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.metrics_id_seq;

CREATE SEQUENCE public.metrics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.metrics_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.metrics_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.module_analytics_id_seq;

CREATE SEQUENCE public.module_analytics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.module_analytics_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.module_analytics_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.module_audit_log_id_seq;

CREATE SEQUENCE public.module_audit_log_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.module_audit_log_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.module_audit_log_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.module_dependencies_id_seq;

CREATE SEQUENCE public.module_dependencies_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.module_dependencies_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.module_dependencies_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.module_navigation_id_seq;

CREATE SEQUENCE public.module_navigation_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.module_navigation_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.module_navigation_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.module_settings_id_seq;

CREATE SEQUENCE public.module_settings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.module_settings_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.module_settings_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.network_diagrams_id_seq;

CREATE SEQUENCE public.network_diagrams_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.network_diagrams_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.network_diagrams_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.nl_queries_id_seq;

CREATE SEQUENCE public.nl_queries_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.nl_queries_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.nl_queries_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.nlq_chat_messages_id_seq;

CREATE SEQUENCE public.nlq_chat_messages_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.nlq_chat_messages_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.nlq_chat_messages_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.nlq_chat_sessions_id_seq;

CREATE SEQUENCE public.nlq_chat_sessions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.nlq_chat_sessions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.nlq_chat_sessions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.nlq_data_sources_id_seq;

CREATE SEQUENCE public.nlq_data_sources_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.nlq_data_sources_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.nlq_data_sources_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.nlq_few_shot_examples_id_seq;

CREATE SEQUENCE public.nlq_few_shot_examples_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.nlq_few_shot_examples_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.nlq_few_shot_examples_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.nlq_prompt_config_id_seq;

CREATE SEQUENCE public.nlq_prompt_config_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.nlq_prompt_config_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.nlq_prompt_config_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.nlq_query_logs_id_seq;

CREATE SEQUENCE public.nlq_query_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.nlq_query_logs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.nlq_query_logs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.notification_channels_id_seq;

CREATE SEQUENCE public.notification_channels_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.notification_channels_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.notification_channels_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.notification_deliveries_id_seq;

CREATE SEQUENCE public.notification_deliveries_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.notification_deliveries_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.notification_deliveries_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.notification_subscriptions_id_seq;

CREATE SEQUENCE public.notification_subscriptions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.notification_subscriptions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.notification_subscriptions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.notification_templates_id_seq;

CREATE SEQUENCE public.notification_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.notification_templates_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.notification_templates_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.notifications_id_seq;

CREATE SEQUENCE public.notifications_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.notifications_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.notifications_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.openai_usage_id_seq;

CREATE SEQUENCE public.openai_usage_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.openai_usage_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.openai_usage_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_approval_history_id_seq;

CREATE SEQUENCE public.patch_approval_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_approval_history_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_approval_history_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_approvals_id_seq;

CREATE SEQUENCE public.patch_approvals_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_approvals_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_approvals_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_job_dependencies_id_seq;

CREATE SEQUENCE public.patch_job_dependencies_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_job_dependencies_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_job_dependencies_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_job_logs_id_seq;

CREATE SEQUENCE public.patch_job_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_job_logs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_job_logs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_job_targets_id_seq;

CREATE SEQUENCE public.patch_job_targets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_job_targets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_job_targets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_jobs_id_seq;

CREATE SEQUENCE public.patch_jobs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_jobs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_jobs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_notes_id_seq;

CREATE SEQUENCE public.patch_notes_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_notes_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_notes_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_schedule_executions_id_seq;

CREATE SEQUENCE public.patch_schedule_executions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_schedule_executions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_schedule_executions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patch_schedules_id_seq;

CREATE SEQUENCE public.patch_schedules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patch_schedules_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patch_schedules_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.patches_id_seq;

CREATE SEQUENCE public.patches_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.patches_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.patches_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.permissions_id_seq;

CREATE SEQUENCE public.permissions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.permissions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.permissions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.plan_of_action_milestones_id_seq;

CREATE SEQUENCE public.plan_of_action_milestones_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.plan_of_action_milestones_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.plan_of_action_milestones_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.poam_approval_comments_id_seq;

CREATE SEQUENCE public.poam_approval_comments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.poam_approval_comments_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.poam_approval_comments_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.poam_assets_id_seq;

CREATE SEQUENCE public.poam_assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.poam_assets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.poam_assets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.poam_cves_id_seq;

CREATE SEQUENCE public.poam_cves_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.poam_cves_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.poam_cves_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.poam_milestones_id_seq;

CREATE SEQUENCE public.poam_milestones_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.poam_milestones_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.poam_milestones_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.poam_signatures_id_seq;

CREATE SEQUENCE public.poam_signatures_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.poam_signatures_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.poam_signatures_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.poams_id_seq;

CREATE SEQUENCE public.poams_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.poams_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.poams_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.policies_id_seq;

CREATE SEQUENCE public.policies_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.policies_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.policies_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.policy_procedures_id_seq;

CREATE SEQUENCE public.policy_procedures_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.policy_procedures_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.policy_procedures_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.policy_workflow_history_id_seq;

CREATE SEQUENCE public.policy_workflow_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.policy_workflow_history_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.policy_workflow_history_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.policy_workflow_policies_id_seq;

CREATE SEQUENCE public.policy_workflow_policies_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.policy_workflow_policies_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.policy_workflow_policies_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.policy_workflows_id_seq;

CREATE SEQUENCE public.policy_workflows_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.policy_workflows_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.policy_workflows_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.procedures_id_seq;

CREATE SEQUENCE public.procedures_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.procedures_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.procedures_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.query_templates_id_seq;

CREATE SEQUENCE public.query_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.query_templates_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.query_templates_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.references_id_seq;

CREATE SEQUENCE public.references_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.references_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.references_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.remediation_cost_entries_id_seq;

CREATE SEQUENCE public.remediation_cost_entries_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.remediation_cost_entries_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.remediation_cost_entries_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.report_configurations_id_seq;

CREATE SEQUENCE public.report_configurations_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.report_configurations_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.report_configurations_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.report_schedules_id_seq;

CREATE SEQUENCE public.report_schedules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.report_schedules_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.report_schedules_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.report_templates_id_seq;

CREATE SEQUENCE public.report_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.report_templates_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.report_templates_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.reports_id_seq;

CREATE SEQUENCE public.reports_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.reports_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.reports_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.risk_adjustment_factors_id_seq;

CREATE SEQUENCE public.risk_adjustment_factors_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.risk_adjustment_factors_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.risk_adjustment_factors_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.risk_factors_id_seq;

CREATE SEQUENCE public.risk_factors_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.risk_factors_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.risk_factors_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.risk_models_id_seq;

CREATE SEQUENCE public.risk_models_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.risk_models_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.risk_models_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.risk_score_history_id_seq;

CREATE SEQUENCE public.risk_score_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.risk_score_history_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.risk_score_history_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.role_module_permissions_id_seq;

CREATE SEQUENCE public.role_module_permissions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.role_module_permissions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.role_module_permissions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.role_navigation_permissions_id_seq;

CREATE SEQUENCE public.role_navigation_permissions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.role_navigation_permissions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.role_navigation_permissions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.role_permissions_id_seq;

CREATE SEQUENCE public.role_permissions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.role_permissions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.role_permissions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.roles_id_seq;

CREATE SEQUENCE public.roles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.roles_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.roles_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.saved_filters_id_seq;

CREATE SEQUENCE public.saved_filters_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.saved_filters_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.saved_filters_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_findings_id_seq;

CREATE SEQUENCE public.scan_findings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_findings_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_findings_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_jobs_id_seq;

CREATE SEQUENCE public.scan_jobs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_jobs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_jobs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_policies_id_seq;

CREATE SEQUENCE public.scan_policies_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_policies_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_policies_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_reports_id_seq;

CREATE SEQUENCE public.scan_reports_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_reports_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_reports_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_results_id_seq;

CREATE SEQUENCE public.scan_results_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_results_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_results_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_schedules_id_seq;

CREATE SEQUENCE public.scan_schedules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_schedules_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_schedules_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_targets_id_seq;

CREATE SEQUENCE public.scan_targets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_targets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_targets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.scan_templates_id_seq;

CREATE SEQUENCE public.scan_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.scan_templates_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.scan_templates_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.schedules_id_seq;

CREATE SEQUENCE public.schedules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.schedules_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.schedules_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.security_classification_guide_id_seq;

CREATE SEQUENCE public.security_classification_guide_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.security_classification_guide_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.security_classification_guide_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.settings_id_seq;

CREATE SEQUENCE public.settings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.settings_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.settings_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_alerts_id_seq;

CREATE SEQUENCE public.siem_alerts_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_alerts_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_alerts_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_analytics_id_seq;

CREATE SEQUENCE public.siem_analytics_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_analytics_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_analytics_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_dashboards_id_seq;

CREATE SEQUENCE public.siem_dashboards_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_dashboards_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_dashboards_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_events_id_seq;

CREATE SEQUENCE public.siem_events_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_events_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_events_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_incidents_id_seq;

CREATE SEQUENCE public.siem_incidents_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_incidents_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_incidents_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_log_sources_id_seq;

CREATE SEQUENCE public.siem_log_sources_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_log_sources_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_log_sources_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_rules_id_seq;

CREATE SEQUENCE public.siem_rules_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_rules_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_rules_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.siem_threat_intelligence_id_seq;

CREATE SEQUENCE public.siem_threat_intelligence_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.siem_threat_intelligence_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.siem_threat_intelligence_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.software_assets_id_seq;

CREATE SEQUENCE public.software_assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.software_assets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.software_assets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.software_lifecycle_id_seq;

CREATE SEQUENCE public.software_lifecycle_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.software_lifecycle_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.software_lifecycle_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.ssh_connection_profiles_id_seq;

CREATE SEQUENCE public.ssh_connection_profiles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.ssh_connection_profiles_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.ssh_connection_profiles_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.ssp_controls_id_seq;

CREATE SEQUENCE public.ssp_controls_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.ssp_controls_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.ssp_controls_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.ssp_poam_mappings_id_seq;

CREATE SEQUENCE public.ssp_poam_mappings_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.ssp_poam_mappings_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.ssp_poam_mappings_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.stig_ai_assistance_id_seq;

CREATE SEQUENCE public.stig_ai_assistance_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.stig_ai_assistance_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.stig_ai_assistance_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.stig_assessments_id_seq;

CREATE SEQUENCE public.stig_assessments_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.stig_assessments_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.stig_assessments_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.stig_checklists_id_seq;

CREATE SEQUENCE public.stig_checklists_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.stig_checklists_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.stig_checklists_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.stig_fix_status_id_seq;

CREATE SEQUENCE public.stig_fix_status_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.stig_fix_status_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.stig_fix_status_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.stig_library_id_seq;

CREATE SEQUENCE public.stig_library_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.stig_library_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.stig_library_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.stig_scan_results_id_seq;

CREATE SEQUENCE public.stig_scan_results_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.stig_scan_results_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.stig_scan_results_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_assets_id_seq;

CREATE SEQUENCE public.system_assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_assets_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_assets_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_compliance_mapping_id_seq;

CREATE SEQUENCE public.system_compliance_mapping_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_compliance_mapping_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_compliance_mapping_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_configuration_drift_id_seq;

CREATE SEQUENCE public.system_configuration_drift_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_configuration_drift_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_configuration_drift_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_discovery_results_id_seq;

CREATE SEQUENCE public.system_discovery_results_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_discovery_results_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_discovery_results_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_discovery_scans_id_seq;

CREATE SEQUENCE public.system_discovery_scans_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_discovery_scans_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_discovery_scans_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_impact_levels_id_seq;

CREATE SEQUENCE public.system_impact_levels_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_impact_levels_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_impact_levels_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_security_posture_id_seq;

CREATE SEQUENCE public.system_security_posture_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_security_posture_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_security_posture_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.system_threat_modeling_id_seq;

CREATE SEQUENCE public.system_threat_modeling_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.system_threat_modeling_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.system_threat_modeling_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.systems_id_seq;

CREATE SEQUENCE public.systems_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.systems_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.systems_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.tags_id_seq;

CREATE SEQUENCE public.tags_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.tags_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.tags_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.tasks_id_seq;

CREATE SEQUENCE public.tasks_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.tasks_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.tasks_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.user_dashboards_id_seq;

CREATE SEQUENCE public.user_dashboards_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_dashboards_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.user_dashboards_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.user_module_preferences_id_seq;

CREATE SEQUENCE public.user_module_preferences_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_module_preferences_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.user_module_preferences_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.user_preferences_id_seq;

CREATE SEQUENCE public.user_preferences_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_preferences_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.user_preferences_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.user_roles_id_seq;

CREATE SEQUENCE public.user_roles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.user_roles_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.user_roles_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.users_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vendor_map_id_seq;

CREATE SEQUENCE public.vendor_map_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vendor_map_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vendor_map_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerabilities_id_seq;

CREATE SEQUENCE public.vulnerabilities_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerabilities_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerabilities_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_cost_analysis_id_seq;

CREATE SEQUENCE public.vulnerability_cost_analysis_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_cost_analysis_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_cost_analysis_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_cost_factors_id_seq;

CREATE SEQUENCE public.vulnerability_cost_factors_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_cost_factors_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_cost_factors_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_cost_history_id_seq;

CREATE SEQUENCE public.vulnerability_cost_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_cost_history_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_cost_history_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_cost_models_id_seq;

CREATE SEQUENCE public.vulnerability_cost_models_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_cost_models_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_cost_models_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_cves_id_seq;

CREATE SEQUENCE public.vulnerability_cves_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_cves_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_cves_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_databases_id_seq;

CREATE SEQUENCE public.vulnerability_databases_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_databases_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_databases_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_patches_id_seq;

CREATE SEQUENCE public.vulnerability_patches_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_patches_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_patches_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_poams_id_seq;

CREATE SEQUENCE public.vulnerability_poams_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_poams_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_poams_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_references_id_seq;

CREATE SEQUENCE public.vulnerability_references_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_references_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_references_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.vulnerability_risk_scores_id_seq;

CREATE SEQUENCE public.vulnerability_risk_scores_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.vulnerability_risk_scores_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.vulnerability_risk_scores_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.webhook_configurations_id_seq;

CREATE SEQUENCE public.webhook_configurations_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.webhook_configurations_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.webhook_configurations_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.webhook_deliveries_id_seq;

CREATE SEQUENCE public.webhook_deliveries_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.webhook_deliveries_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.webhook_deliveries_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.webhook_logs_id_seq;

CREATE SEQUENCE public.webhook_logs_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.webhook_logs_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.webhook_logs_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.webhook_rate_limits_id_seq;

CREATE SEQUENCE public.webhook_rate_limits_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.webhook_rate_limits_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.webhook_rate_limits_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.webhook_security_id_seq;

CREATE SEQUENCE public.webhook_security_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.webhook_security_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.webhook_security_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.webhook_subscriptions_id_seq;

CREATE SEQUENCE public.webhook_subscriptions_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.webhook_subscriptions_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.webhook_subscriptions_id_seq TO rasdashadmin;

-- DROP SEQUENCE public.widget_templates_id_seq;

CREATE SEQUENCE public.widget_templates_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.widget_templates_id_seq OWNER TO rasdashadmin;
GRANT ALL ON SEQUENCE public.widget_templates_id_seq TO rasdashadmin;
-- public."SequelizeMeta" definition

-- Drop table

-- DROP TABLE public."SequelizeMeta";

CREATE TABLE public."SequelizeMeta" (
	"name" varchar(255) NOT NULL,
	CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name)
);

-- Permissions

ALTER TABLE public."SequelizeMeta" OWNER TO rasdashadmin;
GRANT ALL ON TABLE public."SequelizeMeta" TO rasdashadmin;


-- public.access_requests definition

-- Drop table

-- DROP TABLE public.access_requests;

CREATE TABLE public.access_requests (
	id serial4 NOT NULL,
	first_name varchar(255) NOT NULL,
	last_name varchar(255) NOT NULL,
	email varchar(255) NOT NULL,
	status public."enum_access_requests_status" DEFAULT 'pending'::enum_access_requests_status NULL,
	reason text NULL,
	rejection_reason text NULL,
	processed_at timestamptz NULL,
	processed_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT access_requests_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.access_requests OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.access_requests TO rasdashadmin;


-- public.app_modules definition

-- Drop table

-- DROP TABLE public.app_modules;

CREATE TABLE public.app_modules (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	enabled bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT app_modules_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.app_modules OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.app_modules TO rasdashadmin;


-- public.artifact_categories definition

-- Drop table

-- DROP TABLE public.artifact_categories;

CREATE TABLE public.artifact_categories (
	id serial4 NOT NULL,
	artifact_id int4 NOT NULL,
	category_id int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT artifact_categories_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.artifact_categories OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.artifact_categories TO rasdashadmin;


-- public.artifact_references definition

-- Drop table

-- DROP TABLE public.artifact_references;

CREATE TABLE public.artifact_references (
	id serial4 NOT NULL,
	source_artifact_id int4 NOT NULL,
	target_artifact_id int4 NOT NULL,
	reference_type text NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT artifact_references_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.artifact_references OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.artifact_references TO rasdashadmin;


-- public.artifact_tags definition

-- Drop table

-- DROP TABLE public.artifact_tags;

CREATE TABLE public.artifact_tags (
	id serial4 NOT NULL,
	artifact_id int4 NOT NULL,
	tag_id int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT artifact_tags_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.artifact_tags OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.artifact_tags TO rasdashadmin;


-- public.artifacts definition

-- Drop table

-- DROP TABLE public.artifacts;

CREATE TABLE public.artifacts (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	file_name text NOT NULL,
	file_path text NOT NULL,
	file_size int4 NOT NULL,
	mime_type text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	uploaded_by int4 NULL,
	associated_controls _text NULL,
	review_status text DEFAULT 'pending'::text NOT NULL,
	reviewed_by int4 NULL,
	reviewed_at timestamptz NULL,
	expires_at timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT artifacts_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.artifacts OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.artifacts TO rasdashadmin;


-- public.asset_cost_management definition

-- Drop table

-- DROP TABLE public.asset_cost_management;

CREATE TABLE public.asset_cost_management (
	id serial4 NOT NULL,
	cost_type public."enum_asset_cost_management_cost_type" NOT NULL,
	amount numeric(15, 2) NOT NULL,
	currency varchar(3) DEFAULT 'USD'::character varying NULL,
	billing_cycle public."enum_asset_cost_management_billing_cycle" DEFAULT 'one_time'::enum_asset_cost_management_billing_cycle NULL,
	start_date timestamptz NULL,
	end_date timestamptz NULL,
	vendor varchar(255) NULL,
	contract_number varchar(255) NULL,
	purchase_order varchar(255) NULL,
	invoice_number varchar(255) NULL,
	cost_center varchar(255) NULL,
	budget_code varchar(255) NULL,
	notes text NULL,
	attachments jsonb DEFAULT '[]'::jsonb NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NULL,
	last_modified_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	asset_uuid uuid NULL,
	CONSTRAINT asset_cost_management_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.asset_cost_management OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_cost_management TO rasdashadmin;


-- public.asset_group_members definition

-- Drop table

-- DROP TABLE public.asset_group_members;

CREATE TABLE public.asset_group_members (
	id serial4 NOT NULL,
	group_id int4 NOT NULL,
	asset_uuid int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT asset_group_members_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.asset_group_members OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_group_members TO rasdashadmin;


-- public.asset_groups definition

-- Drop table

-- DROP TABLE public.asset_groups;

CREATE TABLE public.asset_groups (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_by int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	asset_uuid uuid NULL,
	CONSTRAINT asset_groups_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.asset_groups OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_groups TO rasdashadmin;


-- public.asset_lifecycle definition

-- Drop table

-- DROP TABLE public.asset_lifecycle;

CREATE TABLE public.asset_lifecycle (
	id serial4 NOT NULL,
	purchase_date date NULL,
	warranty_end_date date NULL,
	manufacturer_eol_date date NULL,
	internal_eol_date date NULL,
	replacement_cycle_months int4 NULL,
	estimated_replacement_cost numeric(15, 2) NULL,
	replacement_budget_year int4 NULL,
	replacement_budget_quarter int4 NULL,
	replacement_notes text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	asset_uuid uuid NULL,
	CONSTRAINT asset_lifecycle_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.asset_lifecycle OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_lifecycle TO rasdashadmin;


-- public.asset_operational_costs definition

-- Drop table

-- DROP TABLE public.asset_operational_costs;

CREATE TABLE public.asset_operational_costs (
	id serial4 NOT NULL,
	year_month date NOT NULL,
	power_cost numeric(15, 2) NULL,
	space_cost numeric(15, 2) NULL,
	network_cost numeric(15, 2) NULL,
	storage_cost numeric(15, 2) NULL,
	labor_cost numeric(15, 2) NULL,
	other_costs numeric(15, 2) NULL,
	notes text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	asset_uuid uuid NULL,
	CONSTRAINT asset_operational_costs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.asset_operational_costs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_operational_costs TO rasdashadmin;


-- public.asset_risk_mapping definition

-- Drop table

-- DROP TABLE public.asset_risk_mapping;

CREATE TABLE public.asset_risk_mapping (
	id serial4 NOT NULL,
	asset_uuid uuid NULL,
	existing_asset_id int4 NULL,
	risk_model_id int4 NULL,
	cost_center_id int4 NULL,
	mapping_confidence numeric(3, 2) DEFAULT 0.85 NULL,
	mapping_method varchar(50) DEFAULT 'automatic'::character varying NULL,
	mapping_criteria jsonb NULL,
	verified_by int4 NULL,
	verified_at timestamp NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT asset_risk_mapping_asset_uuid_existing__key UNIQUE (asset_uuid, existing_asset_id),
	CONSTRAINT asset_risk_mapping_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_asset_risk_mapping_asset_uuid ON public.asset_risk_mapping USING btree (asset_uuid);
CREATE INDEX idx_asset_risk_mapping_existing_asset ON public.asset_risk_mapping USING btree (existing_asset_id);

-- Permissions

ALTER TABLE public.asset_risk_mapping OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_risk_mapping TO rasdashadmin;


-- public.asset_vulnerabilities definition

-- Drop table

-- DROP TABLE public.asset_vulnerabilities;

CREATE TABLE public.asset_vulnerabilities (
	id serial4 NOT NULL,
	asset_id int4 NOT NULL,
	vulnerability_id int4 NOT NULL,
	detection_status public."enum_asset_vulnerabilities_detection_status" DEFAULT 'detected'::enum_asset_vulnerabilities_detection_status NULL,
	first_detected timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	last_detected timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	detection_method varchar(255) NULL,
	scan_id varchar(255) NULL,
	evidence jsonb DEFAULT '{}'::jsonb NULL,
	risk_score numeric(15, 2) NULL,
	exploitability varchar(255) NULL,
	business_impact varchar(255) NULL,
	mitigation_status varchar(255) NULL,
	mitigated_at timestamptz NULL,
	verified_at timestamptz NULL,
	notes text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT asset_vulnerabilities_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.asset_vulnerabilities OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_vulnerabilities TO rasdashadmin;


-- public.ato_documents definition

-- Drop table

-- DROP TABLE public.ato_documents;

CREATE TABLE public.ato_documents (
	id serial4 NOT NULL,
	ato_id int4 NOT NULL,
	document_type varchar(100) NOT NULL,
	file_name varchar(255) NOT NULL,
	file_location varchar(500) NOT NULL,
	uploaded_by int4 NOT NULL,
	uploaded_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT ato_documents_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.ato_documents OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.ato_documents TO rasdashadmin;


-- public.ato_workflow_history definition

-- Drop table

-- DROP TABLE public.ato_workflow_history;

CREATE TABLE public.ato_workflow_history (
	id serial4 NOT NULL,
	ato_id int4 NOT NULL,
	"action" varchar(100) NOT NULL,
	status varchar(50) NOT NULL,
	"comments" text NULL,
	performed_by int4 NOT NULL,
	performed_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	approval_role public."enum_ato_workflow_history_approval_role" NULL,
	workflow_stage public."enum_ato_workflow_history_workflow_stage" DEFAULT 'initial_submission'::enum_ato_workflow_history_workflow_stage NOT NULL,
	signature text NULL,
	CONSTRAINT ato_workflow_history_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.ato_workflow_history OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.ato_workflow_history TO rasdashadmin;


-- public.audit_logs definition

-- Drop table

-- DROP TABLE public.audit_logs;

CREATE TABLE public.audit_logs (
	id serial4 NOT NULL,
	user_id int4 NULL,
	"action" public."enum_audit_logs_action" NOT NULL,
	resource_type varchar(255) NOT NULL,
	resource_id varchar(255) NULL,
	description text NULL,
	ip_address varchar(255) NULL,
	user_agent text NULL,
	"level" public."enum_audit_logs_level" DEFAULT 'info'::enum_audit_logs_level NOT NULL,
	old_values jsonb DEFAULT '{}'::jsonb NULL,
	new_values jsonb DEFAULT '{}'::jsonb NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	session_id varchar(255) NULL,
	success bool DEFAULT true NULL,
	error_message text NULL,
	duration int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.audit_logs IS 'Audit trail for all conflict resolution activities';

-- Permissions

ALTER TABLE public.audit_logs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.audit_logs TO rasdashadmin;


-- public.authorizations_to_operate definition

-- Drop table

-- DROP TABLE public.authorizations_to_operate;

CREATE TABLE public.authorizations_to_operate (
	id serial4 NOT NULL,
	ssp_id int4 NOT NULL,
	"type" public."enum_authorizations_to_operate_type" DEFAULT 'full'::enum_authorizations_to_operate_type NOT NULL,
	status public."enum_authorizations_to_operate_status" DEFAULT 'draft'::enum_authorizations_to_operate_status NOT NULL,
	submission_date timestamptz NULL,
	approval_date timestamptz NULL,
	expiration_date timestamptz NULL,
	authorized_by int4 NULL,
	authorization_memo text NULL,
	authorization_conditions text NULL,
	"risk_level" varchar(50) NULL,
	continuous_monitoring_plan text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT authorizations_to_operate_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.authorizations_to_operate OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.authorizations_to_operate TO rasdashadmin;


-- public.backup_jobs definition

-- Drop table

-- DROP TABLE public.backup_jobs;

CREATE TABLE public.backup_jobs (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	schedule varchar(255) NOT NULL,
	retention_days int4 DEFAULT 30 NULL,
	"compression" bool DEFAULT true NULL,
	include_data bool DEFAULT true NULL,
	include_schema bool DEFAULT true NULL,
	status varchar(50) DEFAULT 'active'::character varying NULL,
	last_run timestamptz NULL,
	next_run timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT backup_jobs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.backup_jobs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.backup_jobs TO rasdashadmin;


-- public.batches definition

-- Drop table

-- DROP TABLE public.batches;

CREATE TABLE public.batches (
	id serial4 NOT NULL,
	batch_id uuid DEFAULT gen_random_uuid() NOT NULL,
	source_system varchar(50) NOT NULL,
	batch_type varchar(50) NOT NULL,
	file_name varchar(255) NULL,
	total_records int4 NULL,
	successful_records int4 DEFAULT 0 NULL,
	failed_records int4 DEFAULT 0 NULL,
	status varchar(50) DEFAULT 'in_progress'::character varying NULL,
	started_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	completed_at timestamp NULL,
	error_details text NULL,
	created_by int4 NULL,
	metadata jsonb NULL,
	CONSTRAINT batches_batch_id_key UNIQUE (batch_id),
	CONSTRAINT batches_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_batches_status ON public.batches USING btree (status);

-- Permissions

ALTER TABLE public.batches OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.batches TO rasdashadmin;


-- public.budget_impact definition

-- Drop table

-- DROP TABLE public.budget_impact;

CREATE TABLE public.budget_impact (
	id serial4 NOT NULL,
	cost_budget_id int4 NULL,
	batch_id uuid NULL,
	impact_type varchar(50) NOT NULL,
	estimated_cost numeric(12, 2) NOT NULL,
	actual_cost numeric(12, 2) NULL,
	budget_variance numeric(12, 2) NULL,
	priority_level int4 DEFAULT 3 NULL,
	approval_required bool DEFAULT false NULL,
	approved_by int4 NULL,
	approved_at timestamp NULL,
	fiscal_year int4 NOT NULL,
	fiscal_quarter int4 NULL,
	impact_details jsonb NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT budget_impact_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_budget_impact_budget_id ON public.budget_impact USING btree (cost_budget_id);
CREATE INDEX idx_budget_impact_priority ON public.budget_impact USING btree (priority_level);

-- Permissions

ALTER TABLE public.budget_impact OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.budget_impact TO rasdashadmin;


-- public.business_impact_costs definition

-- Drop table

-- DROP TABLE public.business_impact_costs;

CREATE TABLE public.business_impact_costs (
	id serial4 NOT NULL,
	asset_id int4 NULL,
	downtime_cost_per_hour numeric(15, 2) NULL,
	data_breach_estimated_cost numeric(15, 2) NULL,
	business_criticality_level int4 NULL,
	compliance_violation_cost numeric(15, 2) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT business_impact_costs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.business_impact_costs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.business_impact_costs TO rasdashadmin;


-- public.cloud_assets definition

-- Drop table

-- DROP TABLE public.cloud_assets;

CREATE TABLE public.cloud_assets (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	cloud_provider varchar(50) NOT NULL,
	resource_type varchar(50) NOT NULL,
	resource_id varchar(255) NOT NULL,
	region varchar(50) NULL,
	account_id varchar(50) NULL,
	tags jsonb DEFAULT '{}'::jsonb NULL,
	status varchar(20) DEFAULT 'active'::character varying NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT cloud_assets_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.cloud_assets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cloud_assets TO rasdashadmin;


-- public.cloud_cost_mapping definition

-- Drop table

-- DROP TABLE public.cloud_cost_mapping;

CREATE TABLE public.cloud_cost_mapping (
	id serial4 NOT NULL,
	cloud_resource_id varchar(100) NOT NULL,
	asset_id int4 NULL,
	mapping_type varchar(50) NULL,
	allocation_percentage numeric(15, 2) DEFAULT 0 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT cloud_cost_mapping_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.cloud_cost_mapping OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cloud_cost_mapping TO rasdashadmin;


-- public.compliance_controls definition

-- Drop table

-- DROP TABLE public.compliance_controls;

CREATE TABLE public.compliance_controls (
	id serial4 NOT NULL,
	control_id varchar(255) NOT NULL,
	title varchar(255) NOT NULL,
	description text NOT NULL,
	framework_id int4 NOT NULL,
	category varchar(255) NOT NULL,
	sub_category varchar(255) NULL,
	control_family varchar(255) NULL,
	severity varchar(255) NULL,
	implementation_guidance text NULL,
	assessment_procedure text NULL,
	related_controls _varchar NULL,
	"references" _varchar NULL,
	parameters jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz NOT NULL,
	updated_at timestamptz NOT NULL,
	CONSTRAINT compliance_controls_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.compliance_controls OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.compliance_controls TO rasdashadmin;


-- public.compliance_frameworks definition

-- Drop table

-- DROP TABLE public.compliance_frameworks;

CREATE TABLE public.compliance_frameworks (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NOT NULL,
	"version" varchar(255) NOT NULL,
	agency varchar(255) NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	documentation_url varchar(255) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT compliance_frameworks_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.compliance_frameworks OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.compliance_frameworks TO rasdashadmin;


-- public.control_compliance_status definition

-- Drop table

-- DROP TABLE public.control_compliance_status;

CREATE TABLE public.control_compliance_status (
	id serial4 NOT NULL,
	asset_id int4 NULL,
	control_id int4 NULL,
	implementation_status public."enum_control_compliance_status_implementation_status" NOT NULL,
	verification_method public."enum_control_compliance_status_verification_method" NULL,
	verification_evidence text NULL,
	verified_by int4 NULL,
	verification_date timestamptz NULL,
	required_documentation jsonb DEFAULT '{}'::jsonb NULL,
	poam_required bool DEFAULT false NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT control_compliance_status_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.control_compliance_status OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.control_compliance_status TO rasdashadmin;


-- public.cost_centers definition

-- Drop table

-- DROP TABLE public.cost_centers;

CREATE TABLE public.cost_centers (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	code varchar(50) NULL,
	description text NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT cost_centers_code_key UNIQUE (code),
	CONSTRAINT cost_centers_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.cost_centers OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cost_centers TO rasdashadmin;


-- public.cpe_mappings definition

-- Drop table

-- DROP TABLE public.cpe_mappings;

CREATE TABLE public.cpe_mappings (
	id serial4 NOT NULL,
	cve_id varchar(20) NOT NULL,
	cpe23_uri text NOT NULL,
	vulnerable_version_range text NULL,
	product_name varchar(255) NULL,
	vendor varchar(255) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT cpe_mappings_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.cpe_mappings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cpe_mappings TO rasdashadmin;


-- public.custom_field_values definition

-- Drop table

-- DROP TABLE public.custom_field_values;

CREATE TABLE public.custom_field_values (
	id serial4 NOT NULL,
	field_id int4 NOT NULL,
	entity_id int4 NOT NULL,
	value jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT custom_field_values_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.custom_field_values OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.custom_field_values TO rasdashadmin;


-- public.custom_fields definition

-- Drop table

-- DROP TABLE public.custom_fields;

CREATE TABLE public.custom_fields (
	id serial4 NOT NULL,
	entity_type varchar(50) NOT NULL,
	field_name varchar(100) NOT NULL,
	display_name varchar(100) NOT NULL,
	field_type varchar(50) NOT NULL,
	field_options jsonb DEFAULT '[]'::jsonb NULL,
	validation jsonb DEFAULT '{}'::jsonb NULL,
	default_value jsonb DEFAULT '{}'::jsonb NULL,
	required bool DEFAULT false NOT NULL,
	"order" int4 DEFAULT 0 NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT custom_fields_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.custom_fields OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.custom_fields TO rasdashadmin;


-- public.cve_mappings definition

-- Drop table

-- DROP TABLE public.cve_mappings;

CREATE TABLE public.cve_mappings (
	id int4 DEFAULT nextval('cwe_mappings_id_seq'::regclass) NOT NULL,
	cve_id varchar(20) NOT NULL,
	cwe_id varchar(20) NOT NULL,
	cwe_name text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT cwe_mappings_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.cve_mappings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cve_mappings TO rasdashadmin;


-- public.cves definition

-- Drop table

-- DROP TABLE public.cves;

CREATE TABLE public.cves (
	id serial4 NOT NULL,
	cve_id varchar(20) NOT NULL,
	description text NOT NULL,
	published_date timestamptz NULL,
	last_modified_date timestamptz NULL,
	cvss2_base_score numeric(15, 2) NULL,
	cvss2_vector varchar(100) NULL,
	cvss3_base_score numeric(15, 2) NULL,
	cvss3_vector varchar(100) NULL,
	exploit_available bool DEFAULT false NOT NULL,
	patch_available bool DEFAULT false NOT NULL,
	"source" varchar(50) DEFAULT 'NVD'::character varying NOT NULL,
	remediation_guidance text NULL,
	search_vector text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT cves_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.cves OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cves TO rasdashadmin;


-- public.dashboard_metrics definition

-- Drop table

-- DROP TABLE public.dashboard_metrics;

CREATE TABLE public.dashboard_metrics (
	id serial4 NOT NULL,
	dashboard_id int4 NOT NULL,
	metric_id int4 NOT NULL,
	"position" int4 NULL,
	width int4 NULL,
	height int4 NULL,
	chart_type varchar(50) NULL,
	config jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT dashboard_metrics_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.dashboard_metrics OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.dashboard_metrics TO rasdashadmin;


-- public.dashboard_shares definition

-- Drop table

-- DROP TABLE public.dashboard_shares;

CREATE TABLE public.dashboard_shares (
	id serial4 NOT NULL,
	dashboard_id int4 NOT NULL,
	user_id int4 NOT NULL,
	"permission" public."enum_dashboard_shares_permission" DEFAULT 'view'::enum_dashboard_shares_permission NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT dashboard_shares_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.dashboard_shares OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.dashboard_shares TO rasdashadmin;


-- public.dashboard_themes definition

-- Drop table

-- DROP TABLE public.dashboard_themes;

CREATE TABLE public.dashboard_themes (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	theme_config jsonb DEFAULT '{}'::jsonb NOT NULL,
	color_palette jsonb DEFAULT '{}'::jsonb NULL,
	typography jsonb DEFAULT '{}'::jsonb NULL,
	grid_settings jsonb DEFAULT '{}'::jsonb NULL,
	is_system bool DEFAULT true NULL,
	created_by int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT dashboard_themes_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.dashboard_themes OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.dashboard_themes TO rasdashadmin;


-- public.dashboards definition

-- Drop table

-- DROP TABLE public.dashboards;

CREATE TABLE public.dashboards (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	layout jsonb DEFAULT '{}'::jsonb NULL,
	is_default bool DEFAULT false NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT dashboards_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.dashboards OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.dashboards TO rasdashadmin;


-- public.data_conflicts definition

-- Drop table

-- DROP TABLE public.data_conflicts;

CREATE TABLE public.data_conflicts (
	id serial4 NOT NULL,
	entity_type varchar(50) NOT NULL,
	entity_id int4 NOT NULL,
	field varchar(100) NOT NULL,
	conflict_type varchar(100) NOT NULL,
	new_value jsonb NOT NULL,
	existing_value jsonb NOT NULL,
	"source" varchar(50) NOT NULL,
	existing_source varchar(50) NOT NULL,
	severity public."conflict_severity" DEFAULT 'medium'::conflict_severity NOT NULL,
	confidence numeric(3, 2) DEFAULT 0.5 NULL,
	status public."conflict_status" DEFAULT 'pending'::conflict_status NOT NULL,
	detected_at timestamptz NOT NULL,
	updated_at timestamptz DEFAULT now() NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT data_conflicts_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.data_conflicts IS 'Stores detected conflicts between data from different sources';

-- Permissions

ALTER TABLE public.data_conflicts OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.data_conflicts TO rasdashadmin;


-- public.data_contexts definition

-- Drop table

-- DROP TABLE public.data_contexts;

CREATE TABLE public.data_contexts (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	context_data jsonb DEFAULT '{}'::jsonb NOT NULL,
	category varchar(50) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT data_contexts_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.data_contexts OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.data_contexts TO rasdashadmin;


-- public.data_freshness definition

-- Drop table

-- DROP TABLE public.data_freshness;

CREATE TABLE public.data_freshness (
	id serial4 NOT NULL,
	table_name varchar(100) NOT NULL,
	data_source varchar(50) NOT NULL,
	last_update timestamp NULL,
	record_count int4 NULL,
	freshness_score numeric(5, 2) NULL,
	sla_threshold_hours int4 NULL,
	is_stale bool DEFAULT false NULL,
	measured_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT data_freshness_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_data_freshness_table ON public.data_freshness USING btree (table_name);

-- Permissions

ALTER TABLE public.data_freshness OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.data_freshness TO rasdashadmin;


-- public.deployments definition

-- Drop table

-- DROP TABLE public.deployments;

CREATE TABLE public.deployments (
	id serial4 NOT NULL,
	system_id int4 NOT NULL,
	"name" varchar(100) NOT NULL,
	environment varchar(50) NOT NULL,
	status varchar(50) NOT NULL,
	deployment_date timestamptz NOT NULL,
	"version" varchar(50) NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT deployments_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.deployments OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.deployments TO rasdashadmin;


-- public.diagram_node_library definition

-- Drop table

-- DROP TABLE public.diagram_node_library;

CREATE TABLE public.diagram_node_library (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	display_name varchar(255) NOT NULL,
	category varchar(100) NOT NULL,
	subcategory varchar(100) NULL,
	node_type varchar(100) NOT NULL,
	icon_path varchar(500) NULL,
	icon_svg text NULL,
	default_style jsonb NULL,
	default_data jsonb NULL,
	config_schema jsonb NULL,
	is_built_in bool DEFAULT false NULL,
	created_by int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT diagram_node_library_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.diagram_node_library OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.diagram_node_library TO rasdashadmin;


-- public.diagram_templates definition

-- Drop table

-- DROP TABLE public.diagram_templates;

CREATE TABLE public.diagram_templates (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	category varchar(100) NOT NULL,
	template_data jsonb NOT NULL,
	thumbnail_url varchar(500) NULL,
	is_built_in bool DEFAULT false NULL,
	created_by int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT diagram_templates_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.diagram_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.diagram_templates TO rasdashadmin;


-- public.diagrams definition

-- Drop table

-- DROP TABLE public.diagrams;

CREATE TABLE public.diagrams (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"type" public."enum_diagrams_type" NOT NULL,
	status public."enum_diagrams_status" DEFAULT 'draft'::enum_diagrams_status NULL,
	format public."enum_diagrams_format" NULL,
	"content" text NULL,
	file_path varchar(255) NULL,
	file_size int4 NULL,
	"version" varchar(255) NULL,
	tags _varchar DEFAULT ARRAY[]::character varying[]::character varying(255)[] NULL,
	related_assets _int4 DEFAULT ARRAY[]::integer[] NULL,
	related_policies _int4 DEFAULT ARRAY[]::integer[] NULL,
	related_controls _int4 DEFAULT ARRAY[]::integer[] NULL,
	is_public bool DEFAULT false NULL,
	view_count int4 DEFAULT 0 NULL,
	last_viewed_at timestamptz NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NULL,
	last_modified_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT diagrams_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.diagrams OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.diagrams TO rasdashadmin;


-- public.digital_signatures definition

-- Drop table

-- DROP TABLE public.digital_signatures;

CREATE TABLE public.digital_signatures (
	id serial4 NOT NULL,
	document_id int4 NOT NULL,
	document_type varchar(50) NOT NULL,
	signer_id int4 NULL,
	signature_data text NOT NULL,
	signature_timestamp timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	signer_role varchar(100) NULL,
	signer_certificate text NULL,
	verification_status varchar(50) DEFAULT 'pending'::character varying NOT NULL,
	verification_timestamp timestamptz NULL,
	ip_address varchar(45) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT digital_signatures_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.digital_signatures OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.digital_signatures TO rasdashadmin;


-- public.distribution_group_members definition

-- Drop table

-- DROP TABLE public.distribution_group_members;

CREATE TABLE public.distribution_group_members (
	id serial4 NOT NULL,
	group_id int4 NOT NULL,
	user_id int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT distribution_group_members_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.distribution_group_members OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.distribution_group_members TO rasdashadmin;


-- public.distribution_groups definition

-- Drop table

-- DROP TABLE public.distribution_groups;

CREATE TABLE public.distribution_groups (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_by int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT distribution_groups_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.distribution_groups OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.distribution_groups TO rasdashadmin;


-- public.email_logs definition

-- Drop table

-- DROP TABLE public.email_logs;

CREATE TABLE public.email_logs (
	id serial4 NOT NULL,
	subject varchar(255) NOT NULL,
	"from" varchar(255) NOT NULL,
	"to" varchar(255) NOT NULL,
	cc varchar(255) DEFAULT ''::character varying NULL,
	bcc varchar(255) DEFAULT ''::character varying NULL,
	body text NULL,
	html_body text NULL,
	status public."enum_email_logs_status" NOT NULL,
	category varchar(255) NULL,
	service_name varchar(255) NULL,
	response_message text NULL,
	related_entity_type varchar(255) NULL,
	related_entity_id varchar(255) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.email_logs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.email_logs TO rasdashadmin;


-- public.email_templates definition

-- Drop table

-- DROP TABLE public.email_templates;

CREATE TABLE public.email_templates (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	subject varchar(255) NOT NULL,
	body text NOT NULL,
	"type" public."enum_email_templates_type" NOT NULL,
	status public."enum_email_templates_status" DEFAULT 'draft'::enum_email_templates_status NOT NULL,
	variables _varchar DEFAULT ARRAY[]::character varying[]::character varying(255)[] NULL,
	is_html bool DEFAULT false NULL,
	created_by int4 NULL,
	last_modified_by int4 NULL,
	"version" varchar(255) NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT email_templates_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.email_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.email_templates TO rasdashadmin;


-- public.enterprise_risk_aggregation definition

-- Drop table

-- DROP TABLE public.enterprise_risk_aggregation;

CREATE TABLE public.enterprise_risk_aggregation (
	id serial4 NOT NULL,
	aggregation_date timestamptz NOT NULL,
	overall_risk_score numeric(5, 2) NOT NULL,
	"risk_level" public."risk_level" NOT NULL,
	total_systems int4 NOT NULL,
	critical_systems int4 DEFAULT 0 NULL,
	high_risk_systems int4 DEFAULT 0 NULL,
	medium_risk_systems int4 DEFAULT 0 NULL,
	low_risk_systems int4 DEFAULT 0 NULL,
	total_vulnerabilities int4 DEFAULT 0 NULL,
	critical_vulnerabilities int4 DEFAULT 0 NULL,
	high_vulnerabilities int4 DEFAULT 0 NULL,
	compliance_score numeric(5, 2) NULL,
	control_effectiveness numeric(5, 2) NULL,
	threat_exposure numeric(5, 2) NULL,
	business_impact_score numeric(5, 2) NULL,
	risk_trends jsonb DEFAULT '{}'::jsonb NULL,
	top_risks jsonb DEFAULT '[]'::jsonb NULL,
	recommendations jsonb DEFAULT '[]'::jsonb NULL,
	benchmark_data jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT enterprise_risk_aggregation_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_enterprise_risk_aggregation_date ON public.enterprise_risk_aggregation USING btree (aggregation_date);
CREATE INDEX idx_enterprise_risk_aggregation_risk_level ON public.enterprise_risk_aggregation USING btree (risk_level);
COMMENT ON TABLE public.enterprise_risk_aggregation IS 'Aggregated enterprise-level risk metrics and trends';

-- Permissions

ALTER TABLE public.enterprise_risk_aggregation OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.enterprise_risk_aggregation TO rasdashadmin;


-- public.entity_synonyms definition

-- Drop table

-- DROP TABLE public.entity_synonyms;

CREATE TABLE public.entity_synonyms (
	id serial4 NOT NULL,
	canonical_form varchar(255) NOT NULL,
	synonym varchar(255) NOT NULL,
	entity_type varchar(50) NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT entity_synonyms_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.entity_synonyms OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.entity_synonyms TO rasdashadmin;


-- public.entity_tags definition

-- Drop table

-- DROP TABLE public.entity_tags;

CREATE TABLE public.entity_tags (
	id serial4 NOT NULL,
	tag_id int4 NOT NULL,
	entity_type varchar(50) NOT NULL,
	entity_id int4 NOT NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT entity_tags_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.entity_tags OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.entity_tags TO rasdashadmin;


-- public.exploits definition

-- Drop table

-- DROP TABLE public.exploits;

CREATE TABLE public.exploits (
	id serial4 NOT NULL,
	cve_id varchar(20) NOT NULL,
	exploit_source varchar(100) NOT NULL,
	exploit_url text NOT NULL,
	exploit_type varchar(50) NOT NULL,
	exploit_date timestamptz NULL,
	exploit_description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT exploits_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.exploits OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.exploits TO rasdashadmin;


-- public.export_jobs definition

-- Drop table

-- DROP TABLE public.export_jobs;

CREATE TABLE public.export_jobs (
	id serial4 NOT NULL,
	export_type public."enum_export_jobs_export_type" NOT NULL,
	format public."enum_export_jobs_format" NOT NULL,
	filter_criteria jsonb DEFAULT '{}'::jsonb NULL,
	status public."enum_export_jobs_status" NOT NULL,
	file_path varchar(255) NULL,
	file_size int4 NULL,
	error_details text NULL,
	started_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	completed_at timestamptz NULL,
	created_by int4 NULL,
	download_count int4 DEFAULT 0 NOT NULL,
	last_downloaded timestamptz NULL,
	CONSTRAINT export_jobs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.export_jobs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.export_jobs TO rasdashadmin;


-- public.generated_reports definition

-- Drop table

-- DROP TABLE public.generated_reports;

CREATE TABLE public.generated_reports (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	configuration_id int4 NULL,
	schedule_id int4 NULL,
	format public."enum_generated_reports_format" NOT NULL,
	file_url text NOT NULL,
	file_size int4 NULL,
	status varchar(20) DEFAULT 'completed'::character varying NOT NULL,
	generated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	expires_at timestamptz NULL,
	generated_by int4 NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT generated_reports_pkey PRIMARY KEY (id)
);
CREATE INDEX generated_reports_configuration_id ON public.generated_reports USING btree (configuration_id);
CREATE INDEX generated_reports_generated_at ON public.generated_reports USING btree (generated_at);
CREATE INDEX generated_reports_generated_by ON public.generated_reports USING btree (generated_by);
CREATE INDEX generated_reports_schedule_id ON public.generated_reports USING btree (schedule_id);
CREATE INDEX generated_reports_status ON public.generated_reports USING btree (status);

-- Permissions

ALTER TABLE public.generated_reports OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.generated_reports TO rasdashadmin;


-- public.import_history definition

-- Drop table

-- DROP TABLE public.import_history;

CREATE TABLE public.import_history (
	id serial4 NOT NULL,
	import_type varchar(50) NOT NULL,
	"source" varchar(100) NOT NULL,
	start_date timestamptz NOT NULL,
	end_date timestamptz NULL,
	status varchar(20) NOT NULL,
	records_processed int4 DEFAULT 0 NOT NULL,
	records_imported int4 DEFAULT 0 NOT NULL,
	records_failed int4 DEFAULT 0 NOT NULL,
	error_details text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT import_history_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.import_history OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.import_history TO rasdashadmin;


-- public.import_jobs definition

-- Drop table

-- DROP TABLE public.import_jobs;

CREATE TABLE public.import_jobs (
	id serial4 NOT NULL,
	integration_id int4 NULL,
	file_name varchar(255) NULL,
	import_type public."enum_import_jobs_import_type" NOT NULL,
	status public."enum_import_jobs_status" NOT NULL,
	records_processed int4 DEFAULT 0 NOT NULL,
	records_created int4 DEFAULT 0 NOT NULL,
	records_updated int4 DEFAULT 0 NOT NULL,
	records_failed int4 DEFAULT 0 NOT NULL,
	error_details jsonb DEFAULT '{}'::jsonb NULL,
	started_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	completed_at timestamptz NULL,
	created_by int4 NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT import_jobs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.import_jobs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.import_jobs TO rasdashadmin;


-- public.information_classification_items definition

-- Drop table

-- DROP TABLE public.information_classification_items;

CREATE TABLE public.information_classification_items (
	id serial4 NOT NULL,
	guide_id int4 NULL,
	item_name text NOT NULL,
	description text NOT NULL,
	classification_level text NOT NULL,
	special_controls text NULL,
	reason text NOT NULL,
	declassification_instructions text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT information_classification_items_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.information_classification_items OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.information_classification_items TO rasdashadmin;


-- public.integrations definition

-- Drop table

-- DROP TABLE public.integrations;

CREATE TABLE public.integrations (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	integration_type public."enum_integrations_integration_type" NOT NULL,
	config jsonb DEFAULT '{}'::jsonb NOT NULL,
	status public."enum_integrations_status" DEFAULT 'active'::enum_integrations_status NOT NULL,
	last_sync timestamptz NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT integrations_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.integrations OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.integrations TO rasdashadmin;


-- public.license_costs definition

-- Drop table

-- DROP TABLE public.license_costs;

CREATE TABLE public.license_costs (
	id serial4 NOT NULL,
	license_id int4 NULL,
	license_type_id int4 NULL,
	cost_amount numeric(15, 2) NOT NULL,
	cost_period text NOT NULL,
	seats_count int4 NULL,
	cost_per_seat numeric(15, 2) NULL,
	renewal_date date NULL,
	auto_renewal bool DEFAULT false NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT license_costs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.license_costs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.license_costs TO rasdashadmin;


-- public.license_types definition

-- Drop table

-- DROP TABLE public.license_types;

CREATE TABLE public.license_types (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	is_subscription bool DEFAULT true NULL,
	is_perpetual bool DEFAULT false NULL,
	typical_renewal_period_months int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT license_types_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.license_types OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.license_types TO rasdashadmin;


-- public.licenses definition

-- Drop table

-- DROP TABLE public.licenses;

CREATE TABLE public.licenses (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	license_key text NULL,
	license_type_id int4 NULL,
	purchase_date date NULL,
	expiry_date date NULL,
	total_seats int4 NULL,
	allocated_seats int4 DEFAULT 0 NULL,
	vendor text NULL,
	notes text NULL,
	status text DEFAULT 'active'::text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT licenses_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.licenses OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.licenses TO rasdashadmin;


-- public.metrics definition

-- Drop table

-- DROP TABLE public.metrics;

CREATE TABLE public.metrics (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"type" public."enum_metrics_type" NOT NULL,
	category public."enum_metrics_category" NULL,
	value numeric(15, 2) NOT NULL,
	unit varchar(255) NULL,
	labels jsonb DEFAULT '{}'::jsonb NULL,
	threshold jsonb DEFAULT '{}'::jsonb NULL,
	"source" varchar(255) NULL,
	aggregation_period varchar(255) NULL,
	last_calculated timestamptz NULL,
	is_active bool DEFAULT true NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	query text NULL,
	CONSTRAINT metrics_pkey PRIMARY KEY (id)
);
CREATE INDEX metrics_category ON public.metrics USING btree (category);
CREATE INDEX metrics_name ON public.metrics USING btree (name);
CREATE INDEX metrics_type ON public.metrics USING btree (type);

-- Permissions

ALTER TABLE public.metrics OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.metrics TO rasdashadmin;


-- public.network_diagrams definition

-- Drop table

-- DROP TABLE public.network_diagrams;

CREATE TABLE public.network_diagrams (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	nodes text NOT NULL,
	edges text NOT NULL,
	created_by int4 NOT NULL,
	diagram_type text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT network_diagrams_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.network_diagrams OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.network_diagrams TO rasdashadmin;


-- public.nl_queries definition

-- Drop table

-- DROP TABLE public.nl_queries;

CREATE TABLE public.nl_queries (
	id serial4 NOT NULL,
	query text NOT NULL,
	user_id int4 NOT NULL,
	status public."enum_nl_queries_status" DEFAULT 'pending'::enum_nl_queries_status NULL,
	query_type public."enum_nl_queries_query_type" NULL,
	intent varchar(255) NULL,
	entities jsonb DEFAULT '{}'::jsonb NULL,
	sql_query text NULL,
	results jsonb DEFAULT '{}'::jsonb NULL,
	result_count int4 NULL,
	execution_time numeric(15, 2) NULL,
	confidence numeric(15, 2) NULL,
	feedback public."enum_nl_queries_feedback" NULL,
	feedback_comment text NULL,
	error_message text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT nl_queries_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.nl_queries OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.nl_queries TO rasdashadmin;


-- public.nlq_chat_messages definition

-- Drop table

-- DROP TABLE public.nlq_chat_messages;

CREATE TABLE public.nlq_chat_messages (
	id serial4 NOT NULL,
	session_id int4 NOT NULL,
	message_type varchar(50) NOT NULL,
	"content" text NOT NULL,
	sql_query text NULL,
	sql_results jsonb NULL,
	query_log_id int4 NULL,
	confidence_score numeric(3, 2) NULL,
	processing_time int4 NULL,
	tokens_used int4 NULL,
	error_message text NULL,
	feedback_rating int4 NULL,
	feedback_comment text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT nlq_chat_messages_feedback_rating_check CHECK (((feedback_rating >= 1) AND (feedback_rating <= 5))),
	CONSTRAINT nlq_chat_messages_message_type_check CHECK (((message_type)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[]))),
	CONSTRAINT nlq_chat_messages_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.nlq_chat_messages OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.nlq_chat_messages TO rasdashadmin;


-- public.nlq_chat_sessions definition

-- Drop table

-- DROP TABLE public.nlq_chat_sessions;

CREATE TABLE public.nlq_chat_sessions (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	session_token uuid DEFAULT gen_random_uuid() NOT NULL,
	title varchar(255) NULL,
	status varchar(50) DEFAULT 'active'::character varying NULL,
	context jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT nlq_chat_sessions_pkey PRIMARY KEY (id),
	CONSTRAINT nlq_chat_sessions_session_token_key UNIQUE (session_token)
);

-- Permissions

ALTER TABLE public.nlq_chat_sessions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.nlq_chat_sessions TO rasdashadmin;


-- public.nlq_data_sources definition

-- Drop table

-- DROP TABLE public.nlq_data_sources;

CREATE TABLE public.nlq_data_sources (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	enabled bool DEFAULT true NOT NULL,
	"schema" jsonb NOT NULL,
	description text NULL,
	sample_data jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT nlq_data_sources_name_key UNIQUE (name),
	CONSTRAINT nlq_data_sources_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.nlq_data_sources OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.nlq_data_sources TO rasdashadmin;


-- public.nlq_prompt_config definition

-- Drop table

-- DROP TABLE public.nlq_prompt_config;

CREATE TABLE public.nlq_prompt_config (
	id serial4 NOT NULL,
	prompt text NOT NULL,
	schema_context jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT nlq_prompt_config_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.nlq_prompt_config OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.nlq_prompt_config TO rasdashadmin;


-- public.nlq_query_logs definition

-- Drop table

-- DROP TABLE public.nlq_query_logs;

CREATE TABLE public.nlq_query_logs (
	id serial4 NOT NULL,
	user_id uuid NULL,
	question text NOT NULL,
	interpreted text NULL,
	generated_query text NULL,
	"result" jsonb NULL,
	status varchar(20) NOT NULL,
	"error" text NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT nlq_query_logs_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.nlq_query_logs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.nlq_query_logs TO rasdashadmin;


-- public.notification_channels definition

-- Drop table

-- DROP TABLE public.notification_channels;

CREATE TABLE public.notification_channels (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	channel_type varchar(20) NOT NULL,
	config jsonb DEFAULT '{}'::jsonb NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT notification_channels_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.notification_channels OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.notification_channels TO rasdashadmin;


-- public.notification_deliveries definition

-- Drop table

-- DROP TABLE public.notification_deliveries;

CREATE TABLE public.notification_deliveries (
	id serial4 NOT NULL,
	channel_id int4 NOT NULL,
	event_type varchar(50) NOT NULL,
	recipient jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	status varchar(20) NOT NULL,
	sent_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	delivered_at timestamptz NULL,
	error_message text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT notification_deliveries_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.notification_deliveries OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.notification_deliveries TO rasdashadmin;


-- public.notification_subscriptions definition

-- Drop table

-- DROP TABLE public.notification_subscriptions;

CREATE TABLE public.notification_subscriptions (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	"module" varchar(50) NOT NULL,
	event_type varchar(50) NOT NULL,
	channel_id int4 NOT NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT notification_subscriptions_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.notification_subscriptions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.notification_subscriptions TO rasdashadmin;


-- public.notification_templates definition

-- Drop table

-- DROP TABLE public.notification_templates;

CREATE TABLE public.notification_templates (
	id serial4 NOT NULL,
	"module" varchar(50) NOT NULL,
	event_type varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	subject text NOT NULL,
	body text NOT NULL,
	format varchar(20) DEFAULT 'html'::character varying NULL,
	is_active bool DEFAULT true NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT notification_templates_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.notification_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.notification_templates TO rasdashadmin;


-- public.openai_usage definition

-- Drop table

-- DROP TABLE public.openai_usage;

CREATE TABLE public.openai_usage (
	id serial4 NOT NULL,
	"timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	service text NOT NULL,
	model text NOT NULL,
	prompt_tokens int4 NOT NULL,
	completion_tokens int4 NOT NULL,
	total_tokens int4 NOT NULL,
	estimated_cost float8 NOT NULL,
	endpoint text NOT NULL,
	user_id int4 NULL,
	metadata text NULL,
	CONSTRAINT openai_usage_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.openai_usage OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.openai_usage TO rasdashadmin;


-- public.patches_orphan definition

-- Drop table

-- DROP TABLE public.patches_orphan;

CREATE TABLE public.patches_orphan (
	id int4 NULL,
	patch_id varchar(255) NULL,
	cve_id varchar(20) NULL,
	vulnerability_id int4 NULL,
	asset_uuid uuid NULL,
	title text NULL,
	vendor varchar(100) NULL,
	description text NULL,
	product varchar(100) NULL,
	version_affected varchar(100) NULL,
	patch_type varchar(50) NULL,
	patch_version varchar(100) NULL,
	severity varchar(20) NULL,
	status varchar(20) NULL,
	patch_description text NULL,
	release_date timestamp NULL,
	kb varchar(50) NULL,
	"version" text NULL,
	applicable_to jsonb NULL,
	download_url text NULL,
	patch_url text NULL,
	file_size varchar(20) NULL,
	checksum varchar(255) NULL,
	prerequisites text NULL,
	superseded_by varchar(255) NULL,
	supersedes varchar(255) NULL,
	reboot_required bool NULL,
	estimated_install_time interval NULL,
	patch_priority varchar(20) NULL,
	business_impact text NULL,
	rollback_instructions text NULL,
	testing_notes text NULL,
	deployment_notes text NULL,
	created_at timestamp NULL,
	updated_at timestamp NULL,
	"source" varchar(50) NULL,
	batch_id uuid NULL,
	raw_json jsonb NULL
);

-- Permissions

ALTER TABLE public.patches_orphan OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patches_orphan TO rasdashadmin;


-- public.permissions definition

-- Drop table

-- DROP TABLE public.permissions;

CREATE TABLE public.permissions (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	category varchar(50) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT permissions_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.permissions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.permissions TO rasdashadmin;


-- public.plan_of_action_milestones definition

-- Drop table

-- DROP TABLE public.plan_of_action_milestones;

CREATE TABLE public.plan_of_action_milestones (
	id serial4 NOT NULL,
	vulnerability_id int4 NULL,
	control_id int4 NULL,
	asset_id int4 NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	weakness text NULL,
	"risk_level" varchar(255) NULL,
	mitigation_plan text NULL,
	scheduled_completion_date timestamptz NULL,
	milestones text NULL,
	resources_required text NULL,
	status public."enum_plan_of_action_milestones_status" DEFAULT 'open'::enum_plan_of_action_milestones_status NOT NULL,
	assigned_to int4 NULL,
	approval_status public."enum_plan_of_action_milestones_approval_status" DEFAULT 'pending'::enum_plan_of_action_milestones_approval_status NULL,
	approved_by int4 NULL,
	approved_at timestamptz NULL,
	estimated_remediation_cost numeric(15, 2) NULL,
	actual_remediation_cost numeric(15, 2) NULL,
	labor_hours numeric(15, 2) NULL,
	cost_justification text NULL,
	cost_last_updated timestamptz NULL,
	cost_benefit_ratio numeric(15, 2) NULL,
	roi_percentage numeric(15, 2) NULL,
	priority_score numeric(15, 2) NULL,
	business_impact varchar(255) NULL,
	implementation_complexity varchar(255) NULL,
	remediation_effort_hours numeric(15, 2) NULL,
	prioritization_factors jsonb DEFAULT '{}'::jsonb NULL,
	priority_override bool DEFAULT false NULL,
	priority_override_reason text NULL,
	priority_category varchar(255) NULL,
	priority_last_calculated timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT plan_of_action_milestones_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.plan_of_action_milestones OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.plan_of_action_milestones TO rasdashadmin;


-- public.poam_approval_comments definition

-- Drop table

-- DROP TABLE public.poam_approval_comments;

CREATE TABLE public.poam_approval_comments (
	id serial4 NOT NULL,
	poam_id int4 NOT NULL,
	user_id int4 NOT NULL,
	"comment" text NOT NULL,
	approval_step text NULL,
	is_internal bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT poam_approval_comments_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.poam_approval_comments OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.poam_approval_comments TO rasdashadmin;


-- public.poam_signatures definition

-- Drop table

-- DROP TABLE public.poam_signatures;

CREATE TABLE public.poam_signatures (
	id serial4 NOT NULL,
	poam_id int4 NOT NULL,
	user_id int4 NOT NULL,
	"role" text NOT NULL,
	signature_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	verification_code text NOT NULL,
	ip_address text NULL,
	user_agent text NULL,
	additional_notes text NULL,
	CONSTRAINT poam_signatures_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.poam_signatures OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.poam_signatures TO rasdashadmin;


-- public.policies definition

-- Drop table

-- DROP TABLE public.policies;

CREATE TABLE public.policies (
	id serial4 NOT NULL,
	title varchar(200) NOT NULL,
	description text NULL,
	policy_type varchar(50) NOT NULL,
	status varchar(20) DEFAULT 'draft'::character varying NULL,
	"version" varchar(20) DEFAULT '1.0'::character varying NULL,
	effective_date timestamptz NULL,
	review_date timestamptz NULL,
	approved_by int4 NULL,
	approved_at timestamptz NULL,
	"content" text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT policies_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.policies OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.policies TO rasdashadmin;


-- public.policy_procedures definition

-- Drop table

-- DROP TABLE public.policy_procedures;

CREATE TABLE public.policy_procedures (
	id serial4 NOT NULL,
	policy_id int4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	steps _text DEFAULT ARRAY[]::text[] NULL,
	"version" varchar(255) NULL,
	status public."enum_policy_procedures_status" DEFAULT 'draft'::enum_policy_procedures_status NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT policy_procedures_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.policy_procedures OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.policy_procedures TO rasdashadmin;


-- public.policy_workflow_history definition

-- Drop table

-- DROP TABLE public.policy_workflow_history;

CREATE TABLE public.policy_workflow_history (
	id serial4 NOT NULL,
	workflow_id int4 NOT NULL,
	"action" varchar(255) NOT NULL,
	details text NULL,
	performed_by int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT policy_workflow_history_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.policy_workflow_history OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.policy_workflow_history TO rasdashadmin;


-- public.policy_workflow_policies definition

-- Drop table

-- DROP TABLE public.policy_workflow_policies;

CREATE TABLE public.policy_workflow_policies (
	id serial4 NOT NULL,
	workflow_id int4 NOT NULL,
	policy_id int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT policy_workflow_policies_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.policy_workflow_policies OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.policy_workflow_policies TO rasdashadmin;


-- public.policy_workflows definition

-- Drop table

-- DROP TABLE public.policy_workflows;

CREATE TABLE public.policy_workflows (
	id serial4 NOT NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	workflow_type public."enum_policy_workflows_workflow_type" NOT NULL,
	status public."enum_policy_workflows_status" DEFAULT 'In Progress'::enum_policy_workflows_status NOT NULL,
	assigned_to int4 NULL,
	due_date timestamptz NULL,
	stage varchar(255) NULL,
	progress int4 DEFAULT 0 NOT NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT policy_workflows_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.policy_workflows OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.policy_workflows TO rasdashadmin;


-- public."procedures" definition

-- Drop table

-- DROP TABLE public."procedures";

CREATE TABLE public."procedures" (
	id serial4 NOT NULL,
	title varchar(200) NOT NULL,
	description text NULL,
	procedure_type varchar(50) NOT NULL,
	related_policy_id int4 NULL,
	status varchar(20) DEFAULT 'draft'::character varying NULL,
	"version" varchar(20) DEFAULT '1.0'::character varying NULL,
	effective_date timestamptz NULL,
	review_date timestamptz NULL,
	approved_by int4 NULL,
	approved_at timestamptz NULL,
	steps jsonb DEFAULT '{}'::jsonb NULL,
	resources jsonb DEFAULT '{}'::jsonb NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NULL,
	"content" text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT procedures_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public."procedures" OWNER TO rasdashadmin;
GRANT ALL ON TABLE public."procedures" TO rasdashadmin;


-- public.query_templates definition

-- Drop table

-- DROP TABLE public.query_templates;

CREATE TABLE public.query_templates (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	query_text text NOT NULL,
	category varchar(50) NULL,
	parameters jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT query_templates_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.query_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.query_templates TO rasdashadmin;


-- public."references" definition

-- Drop table

-- DROP TABLE public."references";

CREATE TABLE public."references" (
	id serial4 NOT NULL,
	cve_id varchar(20) NOT NULL,
	url text NOT NULL,
	"source" varchar(100) NULL,
	tags _text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT references_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public."references" OWNER TO rasdashadmin;
GRANT ALL ON TABLE public."references" TO rasdashadmin;


-- public.remediation_cost_entries definition

-- Drop table

-- DROP TABLE public.remediation_cost_entries;

CREATE TABLE public.remediation_cost_entries (
	id serial4 NOT NULL,
	vulnerability_id int4 NULL,
	poam_id int4 NULL,
	cost_type text NOT NULL,
	amount numeric(15, 2) NOT NULL,
	currency text DEFAULT 'USD'::text NOT NULL,
	description text NULL,
	date_incurred timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	recorded_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT remediation_cost_entries_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.remediation_cost_entries OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.remediation_cost_entries TO rasdashadmin;


-- public.report_configurations definition

-- Drop table

-- DROP TABLE public.report_configurations;

CREATE TABLE public.report_configurations (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	template_id int4 NOT NULL,
	parameters jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT report_configurations_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.report_configurations OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.report_configurations TO rasdashadmin;


-- public.report_schedules definition

-- Drop table

-- DROP TABLE public.report_schedules;

CREATE TABLE public.report_schedules (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	configuration_id int4 NOT NULL,
	frequency text NOT NULL,
	next_run timestamptz NULL,
	last_run timestamptz NULL,
	recipients jsonb DEFAULT '[]'::jsonb NULL,
	active bool DEFAULT true NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT report_schedules_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.report_schedules OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.report_schedules TO rasdashadmin;


-- public.report_templates definition

-- Drop table

-- DROP TABLE public.report_templates;

CREATE TABLE public.report_templates (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	"module" varchar(50) NOT NULL,
	template_data jsonb DEFAULT '{}'::jsonb NOT NULL,
	is_system bool DEFAULT false NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT report_templates_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.report_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.report_templates TO rasdashadmin;


-- public.reports definition

-- Drop table

-- DROP TABLE public.reports;

CREATE TABLE public.reports (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"type" public."enum_reports_type" NOT NULL,
	status public."enum_reports_status" DEFAULT 'draft'::enum_reports_status NOT NULL,
	parameters jsonb DEFAULT '{}'::jsonb NULL,
	file_path varchar(255) NULL,
	file_size int4 NULL,
	format varchar(255) NULL,
	generated_at timestamptz NULL,
	generated_by int4 NULL,
	scheduled_for timestamptz NULL,
	is_recurring bool DEFAULT false NULL,
	recurring_schedule varchar(255) NULL,
	last_run_at timestamptz NULL,
	next_run_at timestamptz NULL,
	error_message text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT reports_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.reports OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.reports TO rasdashadmin;


-- public.risk_adjustment_factors definition

-- Drop table

-- DROP TABLE public.risk_adjustment_factors;

CREATE TABLE public.risk_adjustment_factors (
	id serial4 NOT NULL,
	risk_category varchar(50) NOT NULL,
	"risk_level" int4 NOT NULL,
	adjustment_factor numeric(15, 2) NOT NULL,
	description text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT risk_adjustment_factors_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.risk_adjustment_factors OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.risk_adjustment_factors TO rasdashadmin;


-- public.risk_factors definition

-- Drop table

-- DROP TABLE public.risk_factors;

CREATE TABLE public.risk_factors (
	id serial4 NOT NULL,
	factor_name text NOT NULL,
	description text NOT NULL,
	default_weight text NOT NULL,
	min_value text NOT NULL,
	max_value text NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT risk_factors_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.risk_factors OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.risk_factors TO rasdashadmin;


-- public.risk_models definition

-- Drop table

-- DROP TABLE public.risk_models;

CREATE TABLE public.risk_models (
	id serial4 NOT NULL,
	model_name text NOT NULL,
	description text NOT NULL,
	"version" text NOT NULL,
	accuracy text NULL,
	parameters jsonb DEFAULT '{}'::jsonb NULL,
	training_dataset text NULL,
	is_active bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT risk_models_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.risk_models OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.risk_models TO rasdashadmin;


-- public.risk_score_history definition

-- Drop table

-- DROP TABLE public.risk_score_history;

CREATE TABLE public.risk_score_history (
	id serial4 NOT NULL,
	vulnerability_id int4 NULL,
	asset_id int4 NULL,
	previous_score text NOT NULL,
	new_score text NOT NULL,
	model_id int4 NULL,
	change_reason text NULL,
	changed_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT risk_score_history_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.risk_score_history OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.risk_score_history TO rasdashadmin;


-- public.role_module_permissions definition

-- Drop table

-- DROP TABLE public.role_module_permissions;

CREATE TABLE public.role_module_permissions (
	id serial4 NOT NULL,
	role_id int4 NOT NULL,
	module_id int4 NOT NULL,
	can_view bool DEFAULT true NOT NULL,
	can_create bool DEFAULT false NOT NULL,
	can_edit bool DEFAULT false NOT NULL,
	can_delete bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	can_admin bool DEFAULT false NOT NULL,
	CONSTRAINT role_module_permissions_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_role_module_permissions_module_id ON public.role_module_permissions USING btree (module_id);
CREATE INDEX idx_role_module_permissions_role_id ON public.role_module_permissions USING btree (role_id);

-- Permissions

ALTER TABLE public.role_module_permissions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.role_module_permissions TO rasdashadmin;


-- public.role_navigation_permissions definition

-- Drop table

-- DROP TABLE public.role_navigation_permissions;

CREATE TABLE public.role_navigation_permissions (
	id serial4 NOT NULL,
	role_id int4 NOT NULL,
	navigation_id int4 NOT NULL,
	allowed bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT role_navigation_permissions_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.role_navigation_permissions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.role_navigation_permissions TO rasdashadmin;


-- public.role_permissions definition

-- Drop table

-- DROP TABLE public.role_permissions;

CREATE TABLE public.role_permissions (
	id serial4 NOT NULL,
	role_id int4 NOT NULL,
	permission_id int4 NOT NULL,
	CONSTRAINT role_permissions_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.role_permissions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.role_permissions TO rasdashadmin;


-- public.roles definition

-- Drop table

-- DROP TABLE public.roles;

CREATE TABLE public.roles (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	is_system bool DEFAULT false NULL,
	is_default bool DEFAULT false NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT roles_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.roles OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.roles TO rasdashadmin;


-- public.saved_filters definition

-- Drop table

-- DROP TABLE public.saved_filters;

CREATE TABLE public.saved_filters (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	"name" varchar(100) NOT NULL,
	description text NULL,
	entity_type varchar(50) NOT NULL,
	filter_criteria jsonb DEFAULT '{}'::jsonb NOT NULL,
	is_public bool DEFAULT false NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT saved_filters_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.saved_filters OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.saved_filters TO rasdashadmin;


-- public.schedules definition

-- Drop table

-- DROP TABLE public.schedules;

CREATE TABLE public.schedules (
	id serial4 NOT NULL,
	source_system varchar(50) NOT NULL,
	data_type varchar(50) NOT NULL,
	schedule_expression varchar(100) NULL,
	last_run timestamp NULL,
	next_run timestamp NULL,
	enabled bool DEFAULT true NULL,
	update_type varchar(20) DEFAULT 'incremental'::character varying NULL,
	priority int4 DEFAULT 3 NULL,
	max_runtime_minutes int4 DEFAULT 60 NULL,
	failure_retry_count int4 DEFAULT 3 NULL,
	current_retry_count int4 DEFAULT 0 NULL,
	last_success timestamp NULL,
	last_failure timestamp NULL,
	failure_reason text NULL,
	metadata jsonb NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT schedules_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_schedules_source_system ON public.schedules USING btree (source_system);

-- Permissions

ALTER TABLE public.schedules OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.schedules TO rasdashadmin;


-- public.security_classification_guide definition

-- Drop table

-- DROP TABLE public.security_classification_guide;

CREATE TABLE public.security_classification_guide (
	id serial4 NOT NULL,
	guide_name text NOT NULL,
	description text NOT NULL,
	classification_authority text NOT NULL,
	declassification_date timestamptz NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT security_classification_guide_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.security_classification_guide OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.security_classification_guide TO rasdashadmin;


-- public."session" definition

-- Drop table

-- DROP TABLE public."session";

CREATE TABLE public."session" (
	sid varchar(255) NOT NULL,
	sess json NOT NULL,
	expire timestamptz NOT NULL,
	CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX idx_session_expire ON public.session USING btree (expire);

-- Permissions

ALTER TABLE public."session" OWNER TO rasdashadmin;
GRANT ALL ON TABLE public."session" TO rasdashadmin;


-- public.settings definition

-- Drop table

-- DROP TABLE public.settings;

CREATE TABLE public.settings (
	id serial4 NOT NULL,
	"key" varchar(255) NOT NULL,
	value text NULL,
	data_type public."setting_data_type" DEFAULT 'string'::setting_data_type NOT NULL,
	category varchar(255) DEFAULT 'general'::character varying NOT NULL,
	description text NULL,
	is_public bool DEFAULT false NOT NULL,
	is_editable bool DEFAULT true NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT settings_key_key UNIQUE (key),
	CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.settings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.settings TO rasdashadmin;


-- public.siem_alerts definition

-- Drop table

-- DROP TABLE public.siem_alerts;

CREATE TABLE public.siem_alerts (
	id serial4 NOT NULL,
	rule_id int4 NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	severity public."enum_siem_alerts_severity" DEFAULT 'medium'::enum_siem_alerts_severity NULL,
	status public."enum_siem_alerts_status" DEFAULT 'new'::enum_siem_alerts_status NULL,
	first_seen timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	last_seen timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	event_count int4 DEFAULT 1 NULL,
	related_events _int4 DEFAULT ARRAY[]::integer[] NULL,
	assigned_to int4 NULL,
	investigation_notes text NULL,
	remediation_notes text NULL,
	closed_at timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_alerts_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_siem_alerts_severity ON public.siem_alerts USING btree (severity);
CREATE INDEX idx_siem_alerts_status ON public.siem_alerts USING btree (status);

-- Permissions

ALTER TABLE public.siem_alerts OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_alerts TO rasdashadmin;


-- public.siem_analytics definition

-- Drop table

-- DROP TABLE public.siem_analytics;

CREATE TABLE public.siem_analytics (
	id serial4 NOT NULL,
	metric_name varchar(255) NOT NULL,
	metric_type varchar(50) NOT NULL,
	timeframe varchar(50) NOT NULL,
	"timestamp" timestamptz NOT NULL,
	value int4 NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_analytics_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.siem_analytics OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_analytics TO rasdashadmin;


-- public.siem_dashboards definition

-- Drop table

-- DROP TABLE public.siem_dashboards;

CREATE TABLE public.siem_dashboards (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	layout jsonb DEFAULT '{}'::jsonb NULL,
	filters jsonb DEFAULT '{}'::jsonb NULL,
	is_default bool DEFAULT false NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_dashboards_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.siem_dashboards OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_dashboards TO rasdashadmin;


-- public.siem_events definition

-- Drop table

-- DROP TABLE public.siem_events;

CREATE TABLE public.siem_events (
	id serial4 NOT NULL,
	source_id int4 NULL,
	"timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	source_timestamp timestamptz NULL,
	event_type varchar(255) NOT NULL,
	severity public."enum_siem_events_severity" DEFAULT 'low'::enum_siem_events_severity NULL,
	status public."enum_siem_events_status" DEFAULT 'new'::enum_siem_events_status NULL,
	summary varchar(255) NOT NULL,
	details jsonb DEFAULT '{}'::jsonb NOT NULL,
	raw_data text NULL,
	source_ip varchar(255) NULL,
	destination_ip varchar(255) NULL,
	username varchar(255) NULL,
	process_name varchar(255) NULL,
	resource_id varchar(255) NULL,
	assigned_to int4 NULL,
	investigation_notes text NULL,
	remediation_notes text NULL,
	received_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	closed_at timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_events_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_siem_events_event_type ON public.siem_events USING btree (event_type);
CREATE INDEX idx_siem_events_severity ON public.siem_events USING btree (severity);
CREATE INDEX idx_siem_events_source_ip ON public.siem_events USING btree (source_ip);
CREATE INDEX idx_siem_events_timestamp ON public.siem_events USING btree ("timestamp");

-- Permissions

ALTER TABLE public.siem_events OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_events TO rasdashadmin;


-- public.siem_log_sources definition

-- Drop table

-- DROP TABLE public.siem_log_sources;

CREATE TABLE public.siem_log_sources (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	endpoint varchar(255) NULL,
	status varchar(255) DEFAULT 'active'::character varying NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NULL,
	last_sync_at timestamptz NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_log_sources_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.siem_log_sources OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_log_sources TO rasdashadmin;


-- public.siem_rules definition

-- Drop table

-- DROP TABLE public.siem_rules;

CREATE TABLE public.siem_rules (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	rule_type public."enum_siem_rules_rule_type" NOT NULL,
	pattern text NULL,
	conditions jsonb DEFAULT '{}'::jsonb NULL,
	severity public."enum_siem_rules_severity" DEFAULT 'medium'::enum_siem_rules_severity NULL,
	enabled bool DEFAULT true NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_rules_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.siem_rules OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_rules TO rasdashadmin;


-- public.software_assets definition

-- Drop table

-- DROP TABLE public.software_assets;

CREATE TABLE public.software_assets (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	vendor varchar(100) NULL,
	"version" varchar(50) NULL,
	license_type varchar(50) NULL,
	installation_date date NULL,
	asset_id int4 NULL,
	notes text NULL,
	status varchar(20) DEFAULT 'active'::character varying NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT software_assets_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.software_assets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.software_assets TO rasdashadmin;


-- public.software_lifecycle definition

-- Drop table

-- DROP TABLE public.software_lifecycle;

CREATE TABLE public.software_lifecycle (
	id serial4 NOT NULL,
	software_id int4 NULL,
	"version" varchar(100) NULL,
	release_date date NULL,
	eol_announcement_date date NULL,
	mainstream_support_end_date date NULL,
	extended_support_end_date date NULL,
	estimated_upgrade_cost numeric(15, 2) NULL,
	upgrade_labor_days numeric(15, 2) NULL,
	requires_hardware_upgrade bool DEFAULT false NULL,
	upgrade_dependencies text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT software_lifecycle_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.software_lifecycle OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.software_lifecycle TO rasdashadmin;


-- public.ssh_connection_profiles definition

-- Drop table

-- DROP TABLE public.ssh_connection_profiles;

CREATE TABLE public.ssh_connection_profiles (
	id serial4 NOT NULL,
	asset_id int4 NOT NULL,
	connection_name varchar(255) NOT NULL,
	hostname varchar(255) NOT NULL,
	port int4 DEFAULT 22 NOT NULL,
	username varchar(255) NOT NULL,
	auth_method public."enum_ssh_connection_profiles_auth_method" NOT NULL,
	private_key_path varchar(500) NULL,
	key_passphrase_encrypted text NULL,
	password_encrypted text NULL,
	connection_timeout int4 DEFAULT 30 NOT NULL,
	max_concurrent_sessions int4 DEFAULT 5 NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	last_tested_at timestamptz NULL,
	test_status public."enum_ssh_connection_profiles_test_status" DEFAULT 'pending'::enum_ssh_connection_profiles_test_status NOT NULL,
	test_error_message text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT ssh_connection_profiles_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.ssh_connection_profiles OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.ssh_connection_profiles TO rasdashadmin;


-- public.ssp_controls definition

-- Drop table

-- DROP TABLE public.ssp_controls;

CREATE TABLE public.ssp_controls (
	id serial4 NOT NULL,
	ssp_id int4 NOT NULL,
	control_id varchar(50) NOT NULL,
	title varchar(200) NOT NULL,
	description text NOT NULL,
	implementation_status public."enum_ssp_controls_implementation_status" NOT NULL,
	implementation_details text NULL,
	responsible_entity varchar(100) NULL,
	related_controls text NULL,
	assessment_procedure text NULL,
	assessment_date timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT ssp_controls_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.ssp_controls OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.ssp_controls TO rasdashadmin;


-- public.ssp_poam_mappings definition

-- Drop table

-- DROP TABLE public.ssp_poam_mappings;

CREATE TABLE public.ssp_poam_mappings (
	id serial4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	control_id varchar(50) NULL,
	poam_id int4 NOT NULL,
	ssp_id int4 NOT NULL,
	impacts_ato bool DEFAULT false NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT ssp_poam_mappings_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.ssp_poam_mappings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.ssp_poam_mappings TO rasdashadmin;


-- public.stig_checklists definition

-- Drop table

-- DROP TABLE public.stig_checklists;

CREATE TABLE public.stig_checklists (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	category varchar(100) NULL,
	description text NULL,
	is_default bool DEFAULT false NULL,
	items jsonb NOT NULL,
	tags _text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT stig_checklists_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.stig_checklists OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_checklists TO rasdashadmin;


-- public.stig_collections definition

-- Drop table

-- DROP TABLE public.stig_collections;

CREATE TABLE public.stig_collections (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	created_by varchar(255) NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	is_active bool DEFAULT true NULL,
	settings jsonb NULL,
	CONSTRAINT stig_collections_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.stig_collections OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_collections TO rasdashadmin;


-- public.stig_downloads definition

-- Drop table

-- DROP TABLE public.stig_downloads;

CREATE TABLE public.stig_downloads (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	stig_id varchar(255) NOT NULL,
	stig_title varchar(255) NOT NULL,
	download_status varchar(50) DEFAULT 'not_downloaded'::character varying NULL,
	file_path text NULL,
	file_size int8 NULL,
	checksum varchar(255) NULL,
	downloaded_at timestamp NULL,
	last_checked timestamp DEFAULT now() NULL,
	metadata jsonb NULL,
	CONSTRAINT stig_downloads_pkey PRIMARY KEY (id),
	CONSTRAINT stig_downloads_stig_id_key UNIQUE (stig_id)
);

-- Permissions

ALTER TABLE public.stig_downloads OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_downloads TO rasdashadmin;


-- public.stig_library definition

-- Drop table

-- DROP TABLE public.stig_library;

CREATE TABLE public.stig_library (
	id serial4 NOT NULL,
	stig_id varchar(50) NOT NULL,
	title text NOT NULL,
	description text NOT NULL,
	"version" varchar(20) NOT NULL,
	release_date date NULL,
	category varchar(100) NULL,
	severity varchar(20) NOT NULL,
	status varchar(50) DEFAULT 'active'::character varying NULL,
	implementation_guidance text NULL,
	verification_text text NULL,
	risk_assessment text NULL,
	platforms _text NULL,
	ref_links jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	raw_xml text NULL,
	CONSTRAINT stig_library_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_stig_library_category ON public.stig_library USING btree (category);
CREATE INDEX idx_stig_library_severity ON public.stig_library USING btree (severity);
CREATE INDEX idx_stig_library_stig_id ON public.stig_library USING btree (stig_id);

-- Permissions

ALTER TABLE public.stig_library OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_library TO rasdashadmin;


-- public.stig_mappings definition

-- Drop table

-- DROP TABLE public.stig_mappings;

CREATE TABLE public.stig_mappings (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	operating_system varchar(255) NULL,
	application varchar(255) NULL,
	service varchar(255) NULL,
	"role" varchar(255) NULL,
	cloud_provider varchar(255) NULL,
	stig_id varchar(255) NOT NULL,
	stig_title varchar(255) NOT NULL,
	priority int4 DEFAULT 2 NULL,
	confidence_score int4 DEFAULT 85 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	os_version varchar(255) NULL,
	application_name varchar(255) NULL,
	application_version varchar(255) NULL,
	system_type varchar(255) NULL,
	stig_version varchar(255) NULL,
	download_url text NULL,
	file_type varchar(100) NULL,
	CONSTRAINT stig_mappings_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.stig_mappings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_mappings TO rasdashadmin;


-- public.stig_rules definition

-- Drop table

-- DROP TABLE public.stig_rules;

CREATE TABLE public.stig_rules (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	stig_id varchar(255) NOT NULL,
	rule_id varchar(255) NOT NULL,
	rule_title varchar(255) NULL,
	severity varchar(50) NULL,
	rule_description text NULL,
	check_text text NULL,
	fix_text text NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT stig_rules_pkey PRIMARY KEY (id),
	CONSTRAINT stig_rules_stig_id_rule_id_key UNIQUE (stig_id, rule_id)
);

-- Permissions

ALTER TABLE public.stig_rules OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_rules TO rasdashadmin;


-- public.system_discovery_scans definition

-- Drop table

-- DROP TABLE public.system_discovery_scans;

CREATE TABLE public.system_discovery_scans (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	methods jsonb NOT NULL,
	targets jsonb NOT NULL,
	schedule varchar(100) NULL,
	"options" jsonb DEFAULT '{}'::jsonb NULL,
	status public."discovery_status" DEFAULT 'pending'::discovery_status NULL,
	started_at timestamptz NULL,
	completed_at timestamptz NULL,
	systems_found int4 DEFAULT 0 NULL,
	results jsonb NULL,
	error_message text NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT system_discovery_scans_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_system_discovery_scans_started_at ON public.system_discovery_scans USING btree (started_at);
CREATE INDEX idx_system_discovery_scans_status ON public.system_discovery_scans USING btree (status);
COMMENT ON TABLE public.system_discovery_scans IS 'Stores system discovery scan configurations and results';

-- Permissions

ALTER TABLE public.system_discovery_scans OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_discovery_scans TO rasdashadmin;


-- public.systems definition

-- Drop table

-- DROP TABLE public.systems;

CREATE TABLE public.systems (
	id serial4 NOT NULL,
	system_id varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"uuid" uuid NOT NULL,
	status varchar(50) NOT NULL,
	authorization_boundary text NULL,
	system_type varchar(100) NULL,
	responsible_organization varchar(255) NULL,
	system_owner varchar(255) NULL,
	information_system_security_officer varchar(255) NULL,
	authorizing_official varchar(255) NULL,
	last_assessment_date timestamp NULL,
	authorization_date timestamp NULL,
	authorization_termination_date timestamp NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	"source" varchar(50) DEFAULT 'xacta'::character varying NULL,
	batch_id uuid NULL,
	raw_json jsonb NULL,
	confidentiality_impact varchar(20) NULL,
	integrity_impact varchar(20) NULL,
	availability_impact varchar(20) NULL,
	discovery_confidence numeric(3, 2) NULL, -- Confidence level in system discovery (0-1)
	last_discovery_date timestamptz NULL,
	environment public."environment_type" NULL, -- System environment: on-premises, cloud, hybrid
	CONSTRAINT systems_pkey PRIMARY KEY (id),
	CONSTRAINT systems_system_id_key UNIQUE (system_id),
	CONSTRAINT systems_uuid_key UNIQUE (uuid)
);
CREATE INDEX idx_systems_created_at ON public.systems USING btree (created_at);
CREATE INDEX idx_systems_discovery_confidence ON public.systems USING btree (discovery_confidence);
CREATE INDEX idx_systems_environment ON public.systems USING btree (environment);

-- Column comments

COMMENT ON COLUMN public.systems.discovery_confidence IS 'Confidence level in system discovery (0-1)';
COMMENT ON COLUMN public.systems.environment IS 'System environment: on-premises, cloud, hybrid';

-- Permissions

ALTER TABLE public.systems OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.systems TO rasdashadmin;


-- public.tags definition

-- Drop table

-- DROP TABLE public.tags;

CREATE TABLE public.tags (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	slug varchar(255) NOT NULL,
	description text NULL,
	color varchar(7) DEFAULT '#6c757d'::character varying NULL,
	usage_count int4 DEFAULT 0 NOT NULL,
	is_system bool DEFAULT false NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT tags_name_key UNIQUE (name),
	CONSTRAINT tags_pkey PRIMARY KEY (id),
	CONSTRAINT tags_slug_key UNIQUE (slug)
);

-- Permissions

ALTER TABLE public.tags OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.tags TO rasdashadmin;


-- public.tasks definition

-- Drop table

-- DROP TABLE public.tasks;

CREATE TABLE public.tasks (
	id serial4 NOT NULL,
	title varchar(200) NOT NULL,
	description text NULL,
	task_type varchar(50) NOT NULL,
	entity_type varchar(50) NULL,
	entity_id int4 NULL,
	status varchar(20) DEFAULT 'pending'::character varying NOT NULL,
	priority varchar(20) DEFAULT 'medium'::character varying NOT NULL,
	assigned_to int4 NULL,
	due_date timestamptz NULL,
	completed_at timestamptz NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT tasks_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.tasks OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.tasks TO rasdashadmin;


-- public.user_dashboards definition

-- Drop table

-- DROP TABLE public.user_dashboards;

CREATE TABLE public.user_dashboards (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	"name" varchar(100) NOT NULL,
	is_default bool DEFAULT false NOT NULL,
	layout jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT user_dashboards_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.user_dashboards OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.user_dashboards TO rasdashadmin;


-- public.user_preferences definition

-- Drop table

-- DROP TABLE public.user_preferences;

CREATE TABLE public.user_preferences (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	preference_key varchar(100) NOT NULL,
	preference_value jsonb DEFAULT '{}'::jsonb NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT user_preferences_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.user_preferences OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.user_preferences TO rasdashadmin;


-- public.user_roles definition

-- Drop table

-- DROP TABLE public.user_roles;

CREATE TABLE public.user_roles (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	role_id int4 NOT NULL,
	assigned_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	assigned_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT user_roles_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.user_roles OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.user_roles TO rasdashadmin;


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id serial4 NOT NULL,
	username varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	first_name varchar(255) NULL,
	last_name varchar(255) NULL,
	email varchar(255) NULL,
	"role" public."enum_users_role" DEFAULT 'user'::enum_users_role NULL,
	status public."enum_users_status" DEFAULT 'active'::enum_users_status NULL,
	auth_method varchar(255) DEFAULT 'password'::character varying NULL,
	certificate_subject varchar(255) NULL,
	certificate_expiry timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	password_hash varchar(255) NOT NULL,
	CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Table Triggers

create trigger update_users_updated_at before
update
    on
    public.users for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.users OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.users TO rasdashadmin;


-- public.vendor_map definition

-- Drop table

-- DROP TABLE public.vendor_map;

CREATE TABLE public.vendor_map (
	id serial4 NOT NULL,
	family_pattern text NULL,
	name_pattern text NULL,
	vendor text NOT NULL,
	CONSTRAINT vendor_map_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vendor_map OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vendor_map TO rasdashadmin;


-- public.vulnerability_cost_analysis definition

-- Drop table

-- DROP TABLE public.vulnerability_cost_analysis;

CREATE TABLE public.vulnerability_cost_analysis (
	id serial4 NOT NULL,
	vulnerability_id int4 NOT NULL,
	cost_model_id int4 NULL,
	direct_costs numeric(15, 2) NOT NULL,
	indirect_costs numeric(15, 2) NOT NULL,
	remediation_costs numeric(15, 2) NOT NULL,
	time_costs numeric(15, 2) NULL,
	total_cost numeric(15, 2) NOT NULL,
	cost_benefit_ratio numeric(15, 2) NULL,
	roi_percentage numeric(15, 2) NULL,
	data_factors jsonb DEFAULT '{}'::jsonb NULL,
	ai_confidence numeric(15, 2) NULL,
	analysis_date timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	calculated_by text NULL,
	CONSTRAINT vulnerability_cost_analysis_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_cost_analysis OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_cost_analysis TO rasdashadmin;


-- public.vulnerability_cost_factors definition

-- Drop table

-- DROP TABLE public.vulnerability_cost_factors;

CREATE TABLE public.vulnerability_cost_factors (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	description text NOT NULL,
	weight numeric(15, 2) NOT NULL,
	category text NOT NULL,
	min_value numeric(15, 2) NOT NULL,
	max_value numeric(15, 2) NOT NULL,
	default_value numeric(15, 2) NOT NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT vulnerability_cost_factors_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_cost_factors OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_cost_factors TO rasdashadmin;


-- public.vulnerability_cost_history definition

-- Drop table

-- DROP TABLE public.vulnerability_cost_history;

CREATE TABLE public.vulnerability_cost_history (
	id serial4 NOT NULL,
	vulnerability_id int4 NOT NULL,
	previous_total_cost numeric(15, 2) NULL,
	new_total_cost numeric(15, 2) NULL,
	cost_model_id int4 NULL,
	change_reason text NULL,
	changed_by int4 NULL,
	changed_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT vulnerability_cost_history_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_cost_history OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_cost_history TO rasdashadmin;


-- public.vulnerability_cost_models definition

-- Drop table

-- DROP TABLE public.vulnerability_cost_models;

CREATE TABLE public.vulnerability_cost_models (
	id serial4 NOT NULL,
	"name" text NOT NULL,
	description text NOT NULL,
	formula text NOT NULL,
	parameters jsonb DEFAULT '{}'::jsonb NULL,
	is_default bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT vulnerability_cost_models_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_cost_models OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_cost_models TO rasdashadmin;


-- public.vulnerability_cves definition

-- Drop table

-- DROP TABLE public.vulnerability_cves;

CREATE TABLE public.vulnerability_cves (
	id serial4 NOT NULL,
	vulnerability_id int4 NOT NULL,
	cve_id int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT vulnerability_cves_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_cves OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_cves TO rasdashadmin;


-- public.vulnerability_databases definition

-- Drop table

-- DROP TABLE public.vulnerability_databases;

CREATE TABLE public.vulnerability_databases (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" public."enum_vulnerability_databases_type" NOT NULL,
	description text NULL,
	url varchar(255) NULL,
	api_key varchar(255) NULL,
	sync_status public."enum_vulnerability_databases_sync_status" DEFAULT 'idle'::enum_vulnerability_databases_sync_status NULL,
	last_sync_at timestamptz NULL,
	next_sync_at timestamptz NULL,
	sync_interval varchar(255) NULL,
	total_vulnerabilities int4 DEFAULT 0 NULL,
	last_sync_count int4 DEFAULT 0 NULL,
	sync_errors jsonb DEFAULT '[]'::jsonb NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	is_active bool DEFAULT true NULL,
	created_by int4 NULL,
	last_modified_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT vulnerability_databases_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_databases OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_databases TO rasdashadmin;


-- public.vulnerability_patches definition

-- Drop table

-- DROP TABLE public.vulnerability_patches;

CREATE TABLE public.vulnerability_patches (
	id serial4 NOT NULL,
	vulnerability_id int4 NOT NULL,
	patch_id int4 NOT NULL,
	effectiveness varchar(20) DEFAULT 'complete'::character varying NOT NULL,
	notes text NULL,
	CONSTRAINT vulnerability_patches_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_patches OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_patches TO rasdashadmin;


-- public.vulnerability_risk_scores definition

-- Drop table

-- DROP TABLE public.vulnerability_risk_scores;

CREATE TABLE public.vulnerability_risk_scores (
	id serial4 NOT NULL,
	vulnerability_id int4 NOT NULL,
	model_id int4 NOT NULL,
	score text NOT NULL,
	confidence text NULL,
	factors jsonb DEFAULT '{}'::jsonb NULL,
	last_calculated timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT vulnerability_risk_scores_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.vulnerability_risk_scores OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_risk_scores TO rasdashadmin;


-- public.webhook_configurations definition

-- Drop table

-- DROP TABLE public.webhook_configurations;

CREATE TABLE public.webhook_configurations (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	service public."webhook_service" NOT NULL,
	url varchar(500) NOT NULL,
	events jsonb NOT NULL,
	secret varchar(255) NOT NULL,
	enabled bool DEFAULT true NULL,
	retry_attempts int4 DEFAULT 3 NULL,
	timeout int4 DEFAULT 30000 NULL,
	last_triggered timestamptz NULL,
	external_id varchar(255) NULL,
	headers jsonb DEFAULT '{}'::jsonb NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT webhook_configurations_pkey PRIMARY KEY (id)
);
CREATE INDEX idx_webhook_configurations_enabled ON public.webhook_configurations USING btree (enabled);
CREATE INDEX idx_webhook_configurations_service ON public.webhook_configurations USING btree (service);
COMMENT ON TABLE public.webhook_configurations IS 'Stores webhook configuration for external service integrations';

-- Permissions

ALTER TABLE public.webhook_configurations OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.webhook_configurations TO rasdashadmin;


-- public.widget_templates definition

-- Drop table

-- DROP TABLE public.widget_templates;

CREATE TABLE public.widget_templates (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	chart_type varchar(100) NOT NULL,
	template_config jsonb DEFAULT '{}'::jsonb NOT NULL,
	size_preset varchar(50) DEFAULT 'medium'::character varying NULL,
	color_scheme varchar(50) DEFAULT 'default'::character varying NULL,
	is_system bool DEFAULT false NULL,
	created_by int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT widget_templates_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.widget_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.widget_templates TO rasdashadmin;


-- public.workflows definition

-- Drop table

-- DROP TABLE public.workflows;

CREATE TABLE public.workflows (
	id uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	category varchar(100) DEFAULT 'custom'::character varying NULL,
	"version" varchar(20) DEFAULT '1.0.0'::character varying NULL,
	workflow_data jsonb NOT NULL,
	is_active bool DEFAULT true NULL,
	is_template bool DEFAULT false NULL,
	tags jsonb NULL,
	"configuration" jsonb NULL,
	created_by varchar(100) NULL,
	updated_by varchar(100) NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workflows_pkey PRIMARY KEY (id)
);

-- Permissions

ALTER TABLE public.workflows OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.workflows TO rasdashadmin;


-- public.ai_assistance_requests definition

-- Drop table

-- DROP TABLE public.ai_assistance_requests;

CREATE TABLE public.ai_assistance_requests (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	request_type public."enum_ai_assistance_request_type" NOT NULL,
	title varchar(255) NOT NULL,
	description text NOT NULL,
	context jsonb DEFAULT '{}'::jsonb NULL,
	priority varchar(20) DEFAULT 'medium'::character varying NULL,
	ai_provider public."enum_ai_assistance_provider" NULL,
	ai_model varchar(100) NULL,
	prompt text NULL,
	response text NULL,
	confidence public."enum_ai_assistance_confidence" NULL,
	processing_time int4 NULL,
	tokens_used int4 NULL,
	"cost" numeric(10, 4) NULL,
	status public."enum_ai_assistance_status" DEFAULT 'pending'::enum_ai_assistance_status NULL,
	reviewed_by int4 NULL,
	reviewed_at timestamptz NULL,
	approved_by int4 NULL,
	approved_at timestamptz NULL,
	quality_rating int4 NULL,
	user_feedback text NULL,
	accuracy_score numeric(5, 2) NULL,
	usefulness int4 NULL,
	implementation_status varchar(50) NULL,
	implementation_notes text NULL,
	results jsonb DEFAULT '{}'::jsonb NULL,
	effectiveness int4 NULL,
	related_request_id int4 NULL,
	related_entity_type varchar(50) NULL,
	related_entity_id int4 NULL,
	classification_level varchar(50) DEFAULT 'unclassified'::character varying NULL,
	sensitive_data bool DEFAULT false NULL,
	compliance_review bool DEFAULT false NULL,
	audit_trail jsonb DEFAULT '[]'::jsonb NULL,
	tags _text DEFAULT ARRAY[]::text[] NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	is_public bool DEFAULT false NULL,
	is_template bool DEFAULT false NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT ai_assistance_requests_pkey PRIMARY KEY (id),
	CONSTRAINT ai_assistance_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
	CONSTRAINT ai_assistance_requests_related_request_id_fkey FOREIGN KEY (related_request_id) REFERENCES public.ai_assistance_requests(id),
	CONSTRAINT ai_assistance_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id),
	CONSTRAINT ai_assistance_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE INDEX idx_ai_assistance_requests_created_at ON public.ai_assistance_requests USING btree (created_at);
CREATE INDEX idx_ai_assistance_requests_status ON public.ai_assistance_requests USING btree (status);
CREATE INDEX idx_ai_assistance_requests_type ON public.ai_assistance_requests USING btree (request_type);
CREATE INDEX idx_ai_assistance_requests_user_id ON public.ai_assistance_requests USING btree (user_id);

-- Permissions

ALTER TABLE public.ai_assistance_requests OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.ai_assistance_requests TO rasdashadmin;


-- public.assets definition

-- Drop table

-- DROP TABLE public.assets;

CREATE TABLE public.assets (
	id serial4 NOT NULL,
	asset_uuid uuid NOT NULL,
	hostname varchar(255) NULL,
	netbios_name varchar(100) NULL,
	system_id varchar(50) NULL,
	has_agent bool DEFAULT false NULL,
	has_plugin_results bool DEFAULT false NULL,
	first_seen timestamp NULL,
	last_seen timestamp NULL,
	exposure_score int4 NULL,
	acr_score numeric(3, 1) NULL,
	criticality_rating varchar(20) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	"source" varchar(50) DEFAULT 'tenable'::character varying NULL,
	batch_id uuid NULL,
	raw_json jsonb NULL,
	CONSTRAINT assets_asset_uuid_key UNIQUE (asset_uuid),
	CONSTRAINT assets_pkey PRIMARY KEY (id),
	CONSTRAINT assets_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(system_id)
);

-- Permissions

ALTER TABLE public.assets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.assets TO rasdashadmin;


-- public.attack_surface_mapping definition

-- Drop table

-- DROP TABLE public.attack_surface_mapping;

CREATE TABLE public.attack_surface_mapping (
	id serial4 NOT NULL,
	system_id int4 NOT NULL,
	surface_type varchar(100) NOT NULL,
	component varchar(255) NOT NULL,
	exposure varchar(50) NOT NULL,
	protocol varchar(50) NULL,
	port int4 NULL,
	service varchar(100) NULL,
	"version" varchar(100) NULL,
	endpoint text NULL,
	authentication varchar(100) NULL,
	encryption varchar(100) NULL,
	risk_score numeric(5, 2) NULL,
	vulnerabilities jsonb DEFAULT '[]'::jsonb NULL,
	threat_vectors jsonb DEFAULT '[]'::jsonb NULL,
	mitigations jsonb DEFAULT '[]'::jsonb NULL,
	business_criticality varchar(50) NULL,
	data_classification varchar(50) NULL,
	last_scanned timestamptz NULL,
	discovered_at timestamptz NOT NULL,
	status varchar(50) DEFAULT 'active'::character varying NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT attack_surface_mapping_pkey PRIMARY KEY (id),
	CONSTRAINT attack_surface_mapping_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE
);
CREATE INDEX idx_attack_surface_mapping_exposure ON public.attack_surface_mapping USING btree (exposure);
CREATE INDEX idx_attack_surface_mapping_status ON public.attack_surface_mapping USING btree (status);
CREATE INDEX idx_attack_surface_mapping_system_id ON public.attack_surface_mapping USING btree (system_id);
COMMENT ON TABLE public.attack_surface_mapping IS 'Maps and tracks enterprise attack surface components';

-- Permissions

ALTER TABLE public.attack_surface_mapping OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.attack_surface_mapping TO rasdashadmin;


-- public.business_impact_analysis definition

-- Drop table

-- DROP TABLE public.business_impact_analysis;

CREATE TABLE public.business_impact_analysis (
	id serial4 NOT NULL,
	system_id int4 NOT NULL,
	business_function varchar(255) NOT NULL,
	criticality varchar(50) NOT NULL,
	rto int4 NULL,
	rpo int4 NULL,
	financial_impact numeric(12, 2) NULL,
	reputational_impact varchar(50) NULL,
	regulatory_impact varchar(50) NULL,
	operational_impact varchar(50) NULL,
	dependencies jsonb DEFAULT '[]'::jsonb NULL,
	dependents jsonb DEFAULT '[]'::jsonb NULL,
	stakeholders jsonb DEFAULT '[]'::jsonb NULL,
	business_processes jsonb DEFAULT '[]'::jsonb NULL,
	data_types jsonb DEFAULT '[]'::jsonb NULL,
	compliance_requirements jsonb DEFAULT '[]'::jsonb NULL,
	threat_scenarios jsonb DEFAULT '[]'::jsonb NULL,
	risk_mitigations jsonb DEFAULT '[]'::jsonb NULL,
	last_assessment timestamptz NOT NULL,
	next_assessment timestamptz NULL,
	assessed_by int4 NULL,
	approved_by int4 NULL,
	approved_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT business_impact_analysis_pkey PRIMARY KEY (id),
	CONSTRAINT business_impact_analysis_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
	CONSTRAINT business_impact_analysis_assessed_by_fkey FOREIGN KEY (assessed_by) REFERENCES public.users(id),
	CONSTRAINT business_impact_analysis_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE
);
CREATE INDEX idx_business_impact_analysis_criticality ON public.business_impact_analysis USING btree (criticality);
CREATE INDEX idx_business_impact_analysis_system_id ON public.business_impact_analysis USING btree (system_id);
COMMENT ON TABLE public.business_impact_analysis IS 'Business impact assessments for systems and services';

-- Permissions

ALTER TABLE public.business_impact_analysis OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.business_impact_analysis TO rasdashadmin;


-- public.categories definition

-- Drop table

-- DROP TABLE public.categories;

CREATE TABLE public.categories (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	color varchar(7) DEFAULT '#007bff'::character varying NULL,
	is_active bool DEFAULT true NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	parent_id int4 NULL,
	status text DEFAULT 'active'::text NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NOT NULL,
	updated_by int4 NOT NULL,
	CONSTRAINT categories_name_key UNIQUE (name),
	CONSTRAINT categories_pkey PRIMARY KEY (id),
	CONSTRAINT categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id),
	CONSTRAINT categories_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);

-- Permissions

ALTER TABLE public.categories OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.categories TO rasdashadmin;


-- public.conflict_resolutions definition

-- Drop table

-- DROP TABLE public.conflict_resolutions;

CREATE TABLE public.conflict_resolutions (
	id serial4 NOT NULL,
	conflict_id int4 NULL,
	"action" public."resolution_action" NOT NULL,
	resolved_value jsonb NULL,
	reasoning text NOT NULL,
	confidence numeric(3, 2) DEFAULT 0.5 NULL,
	resolved_by varchar(100) NOT NULL,
	resolved_at timestamptz NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT conflict_resolutions_pkey PRIMARY KEY (id),
	CONSTRAINT conflict_resolutions_conflict_id_fkey FOREIGN KEY (conflict_id) REFERENCES public.data_conflicts(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.conflict_resolutions IS 'Stores resolutions for data conflicts, both automatic and manual';

-- Permissions

ALTER TABLE public.conflict_resolutions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.conflict_resolutions TO rasdashadmin;


-- public.controls definition

-- Drop table

-- DROP TABLE public.controls;

CREATE TABLE public.controls (
	id serial4 NOT NULL,
	system_id varchar(50) NULL,
	control_id varchar(20) NOT NULL,
	control_title varchar(255) NOT NULL,
	"family" varchar(100) NULL,
	priority varchar(10) NULL,
	implementation_status varchar(50) NULL,
	assessment_status varchar(50) NULL,
	responsible_role varchar(255) NULL,
	last_assessed timestamp NULL,
	implementation_guidance text NULL,
	residual_risk varchar(20) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	"source" varchar(50) DEFAULT 'xacta'::character varying NULL,
	batch_id uuid NULL,
	raw_json jsonb NULL,
	CONSTRAINT controls_pkey PRIMARY KEY (id),
	CONSTRAINT controls_system_id_control_id_key UNIQUE (system_id, control_id),
	CONSTRAINT controls_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(system_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.controls OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.controls TO rasdashadmin;


-- public.cost_budgets definition

-- Drop table

-- DROP TABLE public.cost_budgets;

CREATE TABLE public.cost_budgets (
	id serial4 NOT NULL,
	cost_center_id int4 NULL,
	fiscal_year int4 NOT NULL,
	fiscal_quarter int4 NULL,
	amount numeric(12, 2) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT cost_budgets_pkey PRIMARY KEY (id),
	CONSTRAINT cost_budgets_cost_center_id_fkey FOREIGN KEY (cost_center_id) REFERENCES public.cost_centers(id)
);

-- Permissions

ALTER TABLE public.cost_budgets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cost_budgets TO rasdashadmin;


-- public.cross_system_correlations definition

-- Drop table

-- DROP TABLE public.cross_system_correlations;

CREATE TABLE public.cross_system_correlations (
	id serial4 NOT NULL,
	correlation_id varchar(100) NOT NULL,
	correlation_type varchar(100) NOT NULL,
	title varchar(500) NOT NULL,
	description text NULL,
	system_ids jsonb NOT NULL,
	severity varchar(20) NOT NULL,
	confidence numeric(3, 2) NOT NULL,
	risk_score numeric(5, 2) NULL,
	correlation_data jsonb NOT NULL,
	ai_analysis jsonb NULL,
	recommendations jsonb DEFAULT '[]'::jsonb NULL,
	detected_at timestamptz NOT NULL,
	last_updated timestamptz DEFAULT now() NULL,
	status varchar(50) DEFAULT 'active'::character varying NULL,
	assigned_to int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT cross_system_correlations_correlation_id_key UNIQUE (correlation_id),
	CONSTRAINT cross_system_correlations_pkey PRIMARY KEY (id),
	CONSTRAINT cross_system_correlations_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id)
);
CREATE INDEX idx_cross_system_correlations_detected_at ON public.cross_system_correlations USING btree (detected_at);
CREATE INDEX idx_cross_system_correlations_severity ON public.cross_system_correlations USING btree (severity);
CREATE INDEX idx_cross_system_correlations_status ON public.cross_system_correlations USING btree (status);
COMMENT ON TABLE public.cross_system_correlations IS 'Identifies security patterns and vulnerabilities across systems';

-- Permissions

ALTER TABLE public.cross_system_correlations OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.cross_system_correlations TO rasdashadmin;


-- public.dashboard_widgets definition

-- Drop table

-- DROP TABLE public.dashboard_widgets;

CREATE TABLE public.dashboard_widgets (
	id serial4 NOT NULL,
	dashboard_id int4 NULL,
	metric_id int4 NULL,
	position_x numeric(10, 2) NOT NULL,
	position_y numeric(10, 2) NOT NULL,
	width int4 DEFAULT 300 NULL,
	height int4 DEFAULT 200 NULL,
	widget_config jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT dashboard_widgets_pkey PRIMARY KEY (id),
	CONSTRAINT dashboard_widgets_dashboard_id_fkey FOREIGN KEY (dashboard_id) REFERENCES public.dashboards(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.dashboard_widgets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.dashboard_widgets TO rasdashadmin;


-- public.data_quality definition

-- Drop table

-- DROP TABLE public.data_quality;

CREATE TABLE public.data_quality (
	id serial4 NOT NULL,
	batch_id uuid NULL,
	table_name varchar(100) NULL,
	quality_metric varchar(100) NULL,
	metric_value numeric(5, 2) NULL,
	details jsonb NULL,
	measured_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT data_quality_pkey PRIMARY KEY (id),
	CONSTRAINT data_quality_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.data_quality OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.data_quality TO rasdashadmin;


-- public.diagram_projects definition

-- Drop table

-- DROP TABLE public.diagram_projects;

CREATE TABLE public.diagram_projects (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	template_id int4 NULL,
	diagram_data jsonb NOT NULL,
	metadata jsonb NULL,
	is_public bool DEFAULT false NULL,
	created_by int4 NOT NULL,
	last_edited_by int4 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT diagram_projects_pkey PRIMARY KEY (id),
	CONSTRAINT diagram_projects_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.diagram_templates(id)
);

-- Permissions

ALTER TABLE public.diagram_projects OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.diagram_projects TO rasdashadmin;


-- public.diagram_shared_projects definition

-- Drop table

-- DROP TABLE public.diagram_shared_projects;

CREATE TABLE public.diagram_shared_projects (
	id serial4 NOT NULL,
	project_id int4 NOT NULL,
	shared_with_user_id int4 NOT NULL,
	"permission" varchar(50) NOT NULL,
	shared_by int4 NOT NULL,
	shared_at timestamp DEFAULT now() NULL,
	CONSTRAINT diagram_shared_projects_pkey PRIMARY KEY (id),
	CONSTRAINT diagram_shared_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.diagram_projects(id)
);

-- Permissions

ALTER TABLE public.diagram_shared_projects OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.diagram_shared_projects TO rasdashadmin;


-- public.diagram_versions definition

-- Drop table

-- DROP TABLE public.diagram_versions;

CREATE TABLE public.diagram_versions (
	id serial4 NOT NULL,
	project_id int4 NOT NULL,
	version_number int4 NOT NULL,
	diagram_data jsonb NOT NULL,
	change_description text NULL,
	created_by int4 NOT NULL,
	created_at timestamp DEFAULT now() NULL,
	CONSTRAINT diagram_versions_pkey PRIMARY KEY (id),
	CONSTRAINT diagram_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.diagram_projects(id)
);

-- Permissions

ALTER TABLE public.diagram_versions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.diagram_versions TO rasdashadmin;


-- public.document_templates definition

-- Drop table

-- DROP TABLE public.document_templates;

CREATE TABLE public.document_templates (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	description text NULL,
	category varchar NOT NULL,
	thumbnail_url text NULL,
	template_url text NOT NULL,
	user_id int4 NULL,
	is_public bool DEFAULT false NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT document_templates_pkey PRIMARY KEY (id),
	CONSTRAINT document_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_templates_category ON public.document_templates USING btree (category);
CREATE INDEX idx_templates_is_public ON public.document_templates USING btree (is_public);
CREATE INDEX idx_templates_name ON public.document_templates USING gin (to_tsvector('english'::regconfig, name));
CREATE INDEX idx_templates_user_id ON public.document_templates USING btree (user_id);

-- Table Triggers

create trigger update_templates_updated_at before
update
    on
    public.document_templates for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.document_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.document_templates TO rasdashadmin;


-- public.errors definition

-- Drop table

-- DROP TABLE public.errors;

CREATE TABLE public.errors (
	id serial4 NOT NULL,
	batch_id uuid NULL,
	table_name varchar(100) NULL,
	record_identifier varchar(255) NULL,
	error_type varchar(100) NULL,
	error_message text NULL,
	raw_data jsonb NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT errors_pkey PRIMARY KEY (id),
	CONSTRAINT errors_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON DELETE CASCADE
);
CREATE INDEX idx_errors_batch_id ON public.errors USING btree (batch_id);

-- Permissions

ALTER TABLE public.errors OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.errors TO rasdashadmin;


-- public.folders definition

-- Drop table

-- DROP TABLE public.folders;

CREATE TABLE public.folders (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	parent_id varchar NULL,
	user_id int4 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT chk_folder_not_self_parent CHECK (((id)::text <> (parent_id)::text)),
	CONSTRAINT folders_pkey PRIMARY KEY (id),
	CONSTRAINT folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.folders(id) ON DELETE CASCADE,
	CONSTRAINT folders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_folders_parent_id ON public.folders USING btree (parent_id);
CREATE INDEX idx_folders_user_id ON public.folders USING btree (user_id);

-- Table Triggers

create trigger update_folders_updated_at before
update
    on
    public.folders for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.folders OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.folders TO rasdashadmin;


-- public.job_executions definition

-- Drop table

-- DROP TABLE public.job_executions;

CREATE TABLE public.job_executions (
	id serial4 NOT NULL,
	schedule_id int4 NULL,
	batch_id uuid NULL,
	execution_start timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	execution_end timestamp NULL,
	status varchar(50) DEFAULT 'running'::character varying NULL,
	records_processed int4 DEFAULT 0 NULL,
	records_successful int4 DEFAULT 0 NULL,
	records_failed int4 DEFAULT 0 NULL,
	execution_details jsonb NULL,
	error_message text NULL,
	runtime_seconds int4 NULL,
	CONSTRAINT job_executions_pkey PRIMARY KEY (id),
	CONSTRAINT job_executions_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON DELETE SET NULL,
	CONSTRAINT job_executions_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE CASCADE
);
CREATE INDEX idx_job_executions_schedule_id ON public.job_executions USING btree (schedule_id);
CREATE INDEX idx_job_executions_status ON public.job_executions USING btree (status);

-- Permissions

ALTER TABLE public.job_executions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.job_executions TO rasdashadmin;


-- public.module_analytics definition

-- Drop table

-- DROP TABLE public.module_analytics;

CREATE TABLE public.module_analytics (
	id serial4 NOT NULL,
	module_id int4 NOT NULL,
	user_id int4 NULL,
	event_type varchar(50) NOT NULL,
	event_data text NULL,
	session_id varchar(100) NULL,
	duration int4 NULL,
	"timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT module_analytics_pkey PRIMARY KEY (id),
	CONSTRAINT module_analytics_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.app_modules(id) ON DELETE CASCADE,
	CONSTRAINT module_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_module_analytics_event_type ON public.module_analytics USING btree (event_type);
CREATE INDEX idx_module_analytics_module_id ON public.module_analytics USING btree (module_id);
CREATE INDEX idx_module_analytics_timestamp ON public.module_analytics USING btree ("timestamp");
CREATE INDEX idx_module_analytics_user_id ON public.module_analytics USING btree (user_id);

-- Permissions

ALTER TABLE public.module_analytics OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.module_analytics TO rasdashadmin;


-- public.module_audit_log definition

-- Drop table

-- DROP TABLE public.module_audit_log;

CREATE TABLE public.module_audit_log (
	id serial4 NOT NULL,
	module_id int4 NULL,
	user_id int4 NULL,
	"action" varchar(50) NOT NULL,
	entity_type varchar(50) NOT NULL,
	entity_id int4 NULL,
	old_values text NULL,
	new_values text NULL,
	ip_address varchar(45) NULL,
	user_agent text NULL,
	"timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT module_audit_log_pkey PRIMARY KEY (id),
	CONSTRAINT module_audit_log_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.app_modules(id) ON DELETE CASCADE,
	CONSTRAINT module_audit_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL
);
CREATE INDEX idx_module_audit_log_module_id ON public.module_audit_log USING btree (module_id);
CREATE INDEX idx_module_audit_log_timestamp ON public.module_audit_log USING btree ("timestamp");
CREATE INDEX idx_module_audit_log_user_id ON public.module_audit_log USING btree (user_id);

-- Permissions

ALTER TABLE public.module_audit_log OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.module_audit_log TO rasdashadmin;


-- public.module_dependencies definition

-- Drop table

-- DROP TABLE public.module_dependencies;

CREATE TABLE public.module_dependencies (
	id serial4 NOT NULL,
	module_id int4 NOT NULL,
	depends_on_module_id int4 NOT NULL,
	is_required bool DEFAULT true NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT module_dependencies_check CHECK ((module_id <> depends_on_module_id)),
	CONSTRAINT module_dependencies_module_id_depends_on_module_id_key UNIQUE (module_id, depends_on_module_id),
	CONSTRAINT module_dependencies_pkey PRIMARY KEY (id),
	CONSTRAINT module_dependencies_depends_on_module_id_fkey FOREIGN KEY (depends_on_module_id) REFERENCES public.app_modules(id) ON DELETE CASCADE,
	CONSTRAINT module_dependencies_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.app_modules(id) ON DELETE CASCADE
);
CREATE INDEX idx_module_dependencies_depends_on ON public.module_dependencies USING btree (depends_on_module_id);
CREATE INDEX idx_module_dependencies_module_id ON public.module_dependencies USING btree (module_id);

-- Permissions

ALTER TABLE public.module_dependencies OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.module_dependencies TO rasdashadmin;


-- public.module_navigation definition

-- Drop table

-- DROP TABLE public.module_navigation;

CREATE TABLE public.module_navigation (
	id serial4 NOT NULL,
	module_id int4 NOT NULL,
	nav_label varchar(100) NOT NULL,
	nav_path varchar(255) NOT NULL,
	nav_icon varchar(100) NULL,
	nav_order int4 DEFAULT 0 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	parent_id int4 NULL,
	is_visible bool DEFAULT true NOT NULL,
	requires_permission varchar(100) NULL,
	CONSTRAINT module_navigation_pkey PRIMARY KEY (id),
	CONSTRAINT module_navigation_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.module_navigation(id) ON DELETE CASCADE
);
CREATE INDEX idx_module_navigation_module_id ON public.module_navigation USING btree (module_id);
CREATE INDEX idx_module_navigation_order ON public.module_navigation USING btree (nav_order);
CREATE INDEX idx_module_navigation_parent_id ON public.module_navigation USING btree (parent_id);

-- Permissions

ALTER TABLE public.module_navigation OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.module_navigation TO rasdashadmin;


-- public.module_settings definition

-- Drop table

-- DROP TABLE public.module_settings;

CREATE TABLE public.module_settings (
	id serial4 NOT NULL,
	module_id int4 NOT NULL,
	setting_key varchar(100) NOT NULL,
	setting_value text NULL,
	setting_type varchar(50) DEFAULT 'string'::character varying NOT NULL,
	description text NULL,
	is_user_configurable bool DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT module_settings_module_id_setting_key_key UNIQUE (module_id, setting_key),
	CONSTRAINT module_settings_pkey PRIMARY KEY (id),
	CONSTRAINT module_settings_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.app_modules(id) ON DELETE CASCADE
);
CREATE INDEX idx_module_settings_key ON public.module_settings USING btree (setting_key);
CREATE INDEX idx_module_settings_module_id ON public.module_settings USING btree (module_id);

-- Permissions

ALTER TABLE public.module_settings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.module_settings TO rasdashadmin;


-- public.nlq_few_shot_examples definition

-- Drop table

-- DROP TABLE public.nlq_few_shot_examples;

CREATE TABLE public.nlq_few_shot_examples (
	id serial4 NOT NULL,
	question text NOT NULL,
	answer text NOT NULL,
	data_source_id int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT nlq_few_shot_examples_pkey PRIMARY KEY (id),
	CONSTRAINT nlq_few_shot_examples_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.nlq_data_sources(id)
);

-- Permissions

ALTER TABLE public.nlq_few_shot_examples OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.nlq_few_shot_examples TO rasdashadmin;


-- public.notifications definition

-- Drop table

-- DROP TABLE public.notifications;

CREATE TABLE public.notifications (
	id serial4 NOT NULL,
	title varchar(255) NOT NULL,
	message text NOT NULL,
	"type" varchar(50) DEFAULT 'info'::character varying NOT NULL,
	"read" bool DEFAULT false NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	user_id int4 NULL,
	read_at timestamptz NULL,
	"module" varchar(50) NULL,
	event_type varchar(50) NULL,
	related_id int4 NULL,
	related_type varchar(50) NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	expires_at timestamptz NULL,
	priority int4 DEFAULT 1 NULL,
	CONSTRAINT notifications_pkey PRIMARY KEY (id),
	CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX notifications_event_type_idx ON public.notifications USING btree (event_type);
CREATE INDEX notifications_expires_at_idx ON public.notifications USING btree (expires_at);
CREATE INDEX notifications_module_idx ON public.notifications USING btree (module);
CREATE INDEX notifications_priority_idx ON public.notifications USING btree (priority);
CREATE INDEX notifications_related_idx ON public.notifications USING btree (related_id, related_type);
CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);

-- Permissions

ALTER TABLE public.notifications OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.notifications TO rasdashadmin;


-- public.patch_jobs definition

-- Drop table

-- DROP TABLE public.patch_jobs;

CREATE TABLE public.patch_jobs (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	patch_ids _int4 NOT NULL,
	status varchar(50) DEFAULT 'pending'::character varying NOT NULL,
	execution_type varchar(50) DEFAULT 'manual'::character varying NOT NULL,
	priority int4 DEFAULT 5 NULL,
	max_concurrency int4 DEFAULT 1 NULL,
	scheduled_for timestamp NULL,
	started_at timestamp NULL,
	completed_at timestamp NULL,
	rollback_on_failure bool DEFAULT true NULL,
	require_approval bool DEFAULT false NULL,
	max_retries int4 DEFAULT 3 NULL,
	retry_delay_minutes int4 DEFAULT 5 NULL,
	timeout_minutes int4 DEFAULT 60 NULL,
	notification jsonb DEFAULT '{}'::jsonb NULL,
	execution_settings jsonb DEFAULT '{}'::jsonb NULL,
	progress_data jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT patch_jobs_execution_type_check CHECK (((execution_type)::text = ANY ((ARRAY['manual'::character varying, 'scheduled'::character varying, 'triggered'::character varying, 'automatic'::character varying])::text[]))),
	CONSTRAINT patch_jobs_max_concurrency_check CHECK ((max_concurrency >= 1)),
	CONSTRAINT patch_jobs_max_retries_check CHECK ((max_retries >= 0)),
	CONSTRAINT patch_jobs_pkey PRIMARY KEY (id),
	CONSTRAINT patch_jobs_priority_check CHECK (((priority >= 1) AND (priority <= 10))),
	CONSTRAINT patch_jobs_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'queued'::character varying, 'running'::character varying, 'paused'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'rolling_back'::character varying, 'rolled_back'::character varying])::text[]))),
	CONSTRAINT patch_jobs_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_jobs_created_by ON public.patch_jobs USING btree (created_by);
CREATE INDEX idx_patch_jobs_execution_type ON public.patch_jobs USING btree (execution_type);
CREATE INDEX idx_patch_jobs_patch_ids ON public.patch_jobs USING gin (patch_ids);
CREATE INDEX idx_patch_jobs_priority ON public.patch_jobs USING btree (priority);
CREATE INDEX idx_patch_jobs_scheduled_for ON public.patch_jobs USING btree (scheduled_for);
CREATE INDEX idx_patch_jobs_status ON public.patch_jobs USING btree (status);

-- Table Triggers

create trigger update_patch_jobs_updated_at before
update
    on
    public.patch_jobs for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.patch_jobs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_jobs TO rasdashadmin;


-- public.patch_schedules definition

-- Drop table

-- DROP TABLE public.patch_schedules;

CREATE TABLE public.patch_schedules (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	cron_expression varchar(100) NOT NULL,
	timezone varchar(100) DEFAULT 'UTC'::character varying NULL,
	enabled bool DEFAULT true NULL,
	patch_ids _int4 NULL,
	patch_criteria jsonb DEFAULT '{}'::jsonb NULL,
	target_assets _uuid DEFAULT '{}'::uuid[] NULL,
	target_criteria jsonb DEFAULT '{}'::jsonb NULL,
	max_concurrency int4 DEFAULT 5 NULL,
	execution_timeout_minutes int4 DEFAULT 120 NULL,
	rollback_on_failure bool DEFAULT true NULL,
	require_approval bool DEFAULT false NULL,
	next_execution timestamp NULL,
	last_execution timestamp NULL,
	execution_count int4 DEFAULT 0 NULL,
	maintenance_window jsonb DEFAULT '{}'::jsonb NULL,
	execution_conditions jsonb DEFAULT '{}'::jsonb NULL,
	notification jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT patch_schedules_max_concurrency_check CHECK ((max_concurrency >= 1)),
	CONSTRAINT patch_schedules_pkey PRIMARY KEY (id),
	CONSTRAINT patch_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_schedules_created_by ON public.patch_schedules USING btree (created_by);
CREATE INDEX idx_patch_schedules_enabled ON public.patch_schedules USING btree (enabled);
CREATE INDEX idx_patch_schedules_next_execution ON public.patch_schedules USING btree (next_execution);
CREATE INDEX idx_patch_schedules_patch_ids ON public.patch_schedules USING gin (patch_ids);
CREATE INDEX idx_patch_schedules_target_assets ON public.patch_schedules USING gin (target_assets);

-- Table Triggers

create trigger update_patch_schedules_updated_at before
update
    on
    public.patch_schedules for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.patch_schedules OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_schedules TO rasdashadmin;


-- public.poams definition

-- Drop table

-- DROP TABLE public.poams;

CREATE TABLE public.poams (
	id serial4 NOT NULL,
	poam_id varchar(50) NOT NULL,
	system_id varchar(50) NULL,
	weakness_description text NOT NULL,
	security_control varchar(20) NULL,
	resources text NULL,
	scheduled_completion date NULL,
	poc varchar(255) NULL,
	status varchar(50) NULL,
	risk_rating varchar(20) NULL,
	deviation_rationale text NULL,
	original_detection_date date NULL,
	weakness_severity varchar(20) NULL,
	residual_risk varchar(20) NULL,
	threat_relevance varchar(50) NULL,
	likelihood varchar(20) NULL,
	impact varchar(20) NULL,
	mitigation_strategy text NULL,
	cost_estimate varchar(50) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	"source" varchar(50) DEFAULT 'xacta'::character varying NULL,
	batch_id uuid NULL,
	raw_json jsonb NULL,
	CONSTRAINT poams_pkey PRIMARY KEY (id),
	CONSTRAINT poams_poam_id_key UNIQUE (poam_id),
	CONSTRAINT poams_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(system_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.poams OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.poams TO rasdashadmin;


-- public.scan_jobs definition

-- Drop table

-- DROP TABLE public.scan_jobs;

CREATE TABLE public.scan_jobs (
	id serial4 NOT NULL,
	"scan_type" public."scan_type" NOT NULL,
	"target" varchar(255) NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NULL,
	status public."scan_status" DEFAULT 'pending'::scan_status NOT NULL,
	initiated_by int4 NOT NULL,
	error_message text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	completed_at timestamptz NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_jobs_pkey PRIMARY KEY (id),
	CONSTRAINT scan_jobs_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id)
);
CREATE INDEX idx_scan_jobs_created_at ON public.scan_jobs USING btree (created_at);
CREATE INDEX idx_scan_jobs_initiated_by ON public.scan_jobs USING btree (initiated_by);
CREATE INDEX idx_scan_jobs_scan_type ON public.scan_jobs USING btree (scan_type);
CREATE INDEX idx_scan_jobs_status ON public.scan_jobs USING btree (status);
CREATE INDEX idx_scan_jobs_target ON public.scan_jobs USING btree (target);

-- Permissions

ALTER TABLE public.scan_jobs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_jobs TO rasdashadmin;


-- public.scan_policies definition

-- Drop table

-- DROP TABLE public.scan_policies;

CREATE TABLE public.scan_policies (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	policy_type varchar(50) NOT NULL,
	framework varchar(50) NULL,
	rules jsonb NOT NULL,
	enabled int4 DEFAULT 1 NOT NULL,
	created_by int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_policies_pkey PRIMARY KEY (id),
	CONSTRAINT scan_policies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE INDEX idx_scan_policies_enabled ON public.scan_policies USING btree (enabled);
CREATE INDEX idx_scan_policies_framework ON public.scan_policies USING btree (framework);
CREATE INDEX idx_scan_policies_policy_type ON public.scan_policies USING btree (policy_type);

-- Permissions

ALTER TABLE public.scan_policies OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_policies TO rasdashadmin;


-- public.scan_reports definition

-- Drop table

-- DROP TABLE public.scan_reports;

CREATE TABLE public.scan_reports (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	report_type varchar(50) NOT NULL,
	scan_job_ids jsonb NOT NULL,
	format varchar(20) DEFAULT 'pdf'::character varying NOT NULL,
	file_path varchar(500) NULL,
	generated_by int4 NOT NULL,
	generated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	expires_at timestamptz NULL,
	download_count int4 DEFAULT 0 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_reports_pkey PRIMARY KEY (id),
	CONSTRAINT scan_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(id)
);
CREATE INDEX idx_scan_reports_generated_at ON public.scan_reports USING btree (generated_at);
CREATE INDEX idx_scan_reports_generated_by ON public.scan_reports USING btree (generated_by);
CREATE INDEX idx_scan_reports_report_type ON public.scan_reports USING btree (report_type);

-- Permissions

ALTER TABLE public.scan_reports OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_reports TO rasdashadmin;


-- public.scan_results definition

-- Drop table

-- DROP TABLE public.scan_results;

CREATE TABLE public.scan_results (
	id serial4 NOT NULL,
	scan_job_id int4 NOT NULL,
	"scan_type" public."scan_type" NOT NULL,
	"target" varchar(255) NOT NULL,
	results jsonb NOT NULL,
	summary jsonb DEFAULT '{}'::jsonb NULL,
	file_path varchar(500) NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_results_pkey PRIMARY KEY (id),
	CONSTRAINT scan_results_scan_job_id_fkey FOREIGN KEY (scan_job_id) REFERENCES public.scan_jobs(id) ON DELETE CASCADE
);
CREATE INDEX idx_scan_results_created_at ON public.scan_results USING btree (created_at);
CREATE INDEX idx_scan_results_scan_job_id ON public.scan_results USING btree (scan_job_id);
CREATE INDEX idx_scan_results_scan_type ON public.scan_results USING btree (scan_type);
CREATE INDEX idx_scan_results_target ON public.scan_results USING btree (target);

-- Permissions

ALTER TABLE public.scan_results OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_results TO rasdashadmin;


-- public.scan_schedules definition

-- Drop table

-- DROP TABLE public.scan_schedules;

CREATE TABLE public.scan_schedules (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"scan_type" public."scan_type" NOT NULL,
	"target" varchar(255) NOT NULL,
	"configuration" jsonb DEFAULT '{}'::jsonb NULL,
	schedule varchar(100) NOT NULL,
	enabled int4 DEFAULT 1 NOT NULL,
	created_by int4 NOT NULL,
	last_run timestamptz NULL,
	next_run timestamptz NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_schedules_pkey PRIMARY KEY (id),
	CONSTRAINT scan_schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE INDEX idx_scan_schedules_created_by ON public.scan_schedules USING btree (created_by);
CREATE INDEX idx_scan_schedules_enabled ON public.scan_schedules USING btree (enabled);
CREATE INDEX idx_scan_schedules_next_run ON public.scan_schedules USING btree (next_run);

-- Permissions

ALTER TABLE public.scan_schedules OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_schedules TO rasdashadmin;


-- public.scan_targets definition

-- Drop table

-- DROP TABLE public.scan_targets;

CREATE TABLE public.scan_targets (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"target" varchar(255) NOT NULL,
	target_type varchar(50) NOT NULL,
	credentials jsonb NULL,
	tags jsonb DEFAULT '[]'::jsonb NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	enabled int4 DEFAULT 1 NOT NULL,
	created_by int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_targets_pkey PRIMARY KEY (id),
	CONSTRAINT scan_targets_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE INDEX idx_scan_targets_created_by ON public.scan_targets USING btree (created_by);
CREATE INDEX idx_scan_targets_enabled ON public.scan_targets USING btree (enabled);
CREATE INDEX idx_scan_targets_target_type ON public.scan_targets USING btree (target_type);

-- Permissions

ALTER TABLE public.scan_targets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_targets TO rasdashadmin;


-- public.scan_templates definition

-- Drop table

-- DROP TABLE public.scan_templates;

CREATE TABLE public.scan_templates (
	id serial4 NOT NULL,
	"name" varchar(255) NOT NULL,
	description text NULL,
	"scan_type" public."scan_type" NOT NULL,
	"configuration" jsonb NOT NULL,
	is_default int4 DEFAULT 0 NOT NULL,
	created_by int4 NOT NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_templates_pkey PRIMARY KEY (id),
	CONSTRAINT scan_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE INDEX idx_scan_templates_created_by ON public.scan_templates USING btree (created_by);
CREATE INDEX idx_scan_templates_is_default ON public.scan_templates USING btree (is_default);
CREATE INDEX idx_scan_templates_scan_type ON public.scan_templates USING btree (scan_type);

-- Permissions

ALTER TABLE public.scan_templates OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_templates TO rasdashadmin;


-- public.siem_incidents definition

-- Drop table

-- DROP TABLE public.siem_incidents;

CREATE TABLE public.siem_incidents (
	id serial4 NOT NULL,
	title varchar(255) NOT NULL,
	description text NULL,
	severity public."enum_siem_alerts_severity" DEFAULT 'medium'::enum_siem_alerts_severity NULL,
	status varchar(50) DEFAULT 'open'::character varying NULL,
	incident_type varchar(100) NULL,
	affected_systems _text DEFAULT ARRAY[]::text[] NULL,
	related_alerts _int4 DEFAULT ARRAY[]::integer[] NULL,
	assigned_to int4 NULL,
	reported_by int4 NULL,
	discovered_at timestamptz NULL,
	contained_at timestamptz NULL,
	resolved_at timestamptz NULL,
	investigation_notes text NULL,
	remediation_actions text NULL,
	lessons_learned text NULL,
	business_impact text NULL,
	estimated_cost int4 NULL,
	compliance_impact text NULL,
	external_notification bool DEFAULT false NULL,
	law_enforcement_notified bool DEFAULT false NULL,
	media_attention bool DEFAULT false NULL,
	custom_fields jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_incidents_pkey PRIMARY KEY (id),
	CONSTRAINT siem_incidents_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
	CONSTRAINT siem_incidents_reported_by_fkey FOREIGN KEY (reported_by) REFERENCES public.users(id)
);

-- Permissions

ALTER TABLE public.siem_incidents OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_incidents TO rasdashadmin;


-- public.siem_threat_intelligence definition

-- Drop table

-- DROP TABLE public.siem_threat_intelligence;

CREATE TABLE public.siem_threat_intelligence (
	id serial4 NOT NULL,
	indicator_type varchar(50) NOT NULL,
	indicator_value varchar(500) NOT NULL,
	threat_type varchar(100) NULL,
	severity public."enum_siem_alerts_severity" DEFAULT 'medium'::enum_siem_alerts_severity NULL,
	confidence int4 DEFAULT 50 NULL,
	"source" varchar(255) NULL,
	description text NULL,
	tags _text DEFAULT ARRAY[]::text[] NULL,
	first_seen timestamptz NULL,
	last_seen timestamptz NULL,
	expires_at timestamptz NULL,
	is_active bool DEFAULT true NULL,
	false_positive bool DEFAULT false NULL,
	related_incidents _int4 DEFAULT ARRAY[]::integer[] NULL,
	additional_context jsonb DEFAULT '{}'::jsonb NULL,
	created_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT siem_threat_intelligence_pkey PRIMARY KEY (id),
	CONSTRAINT siem_threat_intelligence_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Permissions

ALTER TABLE public.siem_threat_intelligence OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.siem_threat_intelligence TO rasdashadmin;


-- public.stig_ai_assistance definition

-- Drop table

-- DROP TABLE public.stig_ai_assistance;

CREATE TABLE public.stig_ai_assistance (
	id serial4 NOT NULL,
	stig_id int4 NULL,
	question text NULL,
	implementation_guidance text NULL,
	remediation_plan text NULL,
	ai_response text NOT NULL,
	context jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT stig_ai_assistance_pkey PRIMARY KEY (id),
	CONSTRAINT stig_ai_assistance_stig_id_fkey FOREIGN KEY (stig_id) REFERENCES public.stig_library(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.stig_ai_assistance OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_ai_assistance TO rasdashadmin;


-- public.stig_assessments definition

-- Drop table

-- DROP TABLE public.stig_assessments;

CREATE TABLE public.stig_assessments (
	id serial4 NOT NULL,
	asset_id uuid NOT NULL,
	stig_id int4 NOT NULL,
	status varchar(50) DEFAULT 'pending'::character varying NOT NULL,
	assessment_date timestamptz NULL,
	assessment_details text NULL,
	finding_details text NULL,
	implementation_status varchar(50) NULL,
	compliance_status varchar(50) DEFAULT 'non-compliant'::character varying NOT NULL,
	compliance_date timestamptz NULL,
	assigned_to int4 NULL,
	mitigation_plan text NULL,
	remediation_date timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	system_id int4 NULL,
	CONSTRAINT stig_assessments_pkey PRIMARY KEY (id),
	CONSTRAINT stig_assessments_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE,
	CONSTRAINT stig_assessments_stig_id_fkey FOREIGN KEY (stig_id) REFERENCES public.stig_library(id) ON DELETE CASCADE,
	CONSTRAINT stig_assessments_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id)
);
CREATE INDEX idx_stig_assessments_asset_id ON public.stig_assessments USING btree (asset_id);
CREATE INDEX idx_stig_assessments_status ON public.stig_assessments USING btree (status);
CREATE INDEX idx_stig_assessments_stig_id ON public.stig_assessments USING btree (stig_id);

-- Permissions

ALTER TABLE public.stig_assessments OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_assessments TO rasdashadmin;


-- public.stig_assets definition

-- Drop table

-- DROP TABLE public.stig_assets;

CREATE TABLE public.stig_assets (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	collection_id uuid NULL,
	asset_uuid uuid NOT NULL,
	hostname varchar(255) NULL,
	operating_system varchar(255) NULL,
	ip_address inet NULL,
	asset_type varchar(100) NULL,
	criticality varchar(50) NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT stig_assets_pkey PRIMARY KEY (id),
	CONSTRAINT stig_assets_collection_id_fkey FOREIGN KEY (collection_id) REFERENCES public.stig_collections(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.stig_assets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_assets TO rasdashadmin;


-- public.stig_fix_status definition

-- Drop table

-- DROP TABLE public.stig_fix_status;

CREATE TABLE public.stig_fix_status (
	id serial4 NOT NULL,
	stig_id int4 NULL,
	rule_id text NOT NULL,
	asset_id uuid NULL,
	user_id int4 NULL,
	is_completed bool DEFAULT false NULL,
	completed_at timestamp NULL,
	notes text NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT stig_fix_status_pkey PRIMARY KEY (id),
	CONSTRAINT stig_fix_status_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE,
	CONSTRAINT stig_fix_status_stig_id_fkey FOREIGN KEY (stig_id) REFERENCES public.stig_library(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.stig_fix_status OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_fix_status TO rasdashadmin;


-- public.stig_reviews definition

-- Drop table

-- DROP TABLE public.stig_reviews;

CREATE TABLE public.stig_reviews (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	asset_id uuid NOT NULL,
	stig_id varchar(255) NOT NULL,
	rule_id varchar(255) NOT NULL,
	status varchar(50) DEFAULT 'not_reviewed'::character varying NULL,
	"result" varchar(50) NULL,
	detail text NULL,
	"comment" text NULL,
	reviewer_id varchar(255) NULL,
	review_date timestamp DEFAULT now() NULL,
	last_modified timestamp DEFAULT now() NULL,
	last_modified_by varchar(255) NULL,
	CONSTRAINT stig_reviews_asset_id_rule_id_key UNIQUE (asset_id, rule_id),
	CONSTRAINT stig_reviews_pkey PRIMARY KEY (id),
	CONSTRAINT stig_reviews_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.stig_reviews OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_reviews TO rasdashadmin;


-- public.stig_scan_results definition

-- Drop table

-- DROP TABLE public.stig_scan_results;

CREATE TABLE public.stig_scan_results (
	id serial4 NOT NULL,
	asset_id uuid NULL,
	scan_date timestamptz DEFAULT now() NOT NULL,
	scan_tool varchar(100) NULL,
	compliance_score numeric(5, 2) NULL,
	total_checks int4 NULL,
	passed_checks int4 NULL,
	failed_checks int4 NULL,
	not_applicable_checks int4 NULL,
	critical_findings int4 NULL,
	high_findings int4 NULL,
	medium_findings int4 NULL,
	low_findings int4 NULL,
	findings jsonb NULL,
	raw_results jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT stig_scan_results_pkey PRIMARY KEY (id),
	CONSTRAINT stig_scan_results_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE
);
CREATE INDEX idx_stig_scan_results_asset_id ON public.stig_scan_results USING btree (asset_id);

-- Permissions

ALTER TABLE public.stig_scan_results OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_scan_results TO rasdashadmin;


-- public.system_assets definition

-- Drop table

-- DROP TABLE public.system_assets;

CREATE TABLE public.system_assets (
	id serial4 NOT NULL,
	system_id varchar(50) NULL,
	asset_uuid uuid NULL,
	assignment_type varchar(50) DEFAULT 'direct'::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT system_assets_pkey PRIMARY KEY (id),
	CONSTRAINT system_assets_system_id_asset_uuid_key UNIQUE (system_id, asset_uuid),
	CONSTRAINT system_assets_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE,
	CONSTRAINT system_assets_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(system_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.system_assets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_assets TO rasdashadmin;


-- public.system_compliance_mapping definition

-- Drop table

-- DROP TABLE public.system_compliance_mapping;

CREATE TABLE public.system_compliance_mapping (
	id serial4 NOT NULL,
	system_id int4 NOT NULL,
	framework varchar(100) NOT NULL,
	control_id varchar(50) NOT NULL,
	control_family varchar(100) NULL,
	implementation_status varchar(50) NOT NULL,
	assessment_status varchar(50) NOT NULL,
	compliance_score numeric(5, 2) NULL,
	gap_analysis jsonb DEFAULT '{}'::jsonb NULL,
	evidence jsonb DEFAULT '[]'::jsonb NULL,
	exceptions jsonb DEFAULT '[]'::jsonb NULL,
	compensating_controls jsonb DEFAULT '[]'::jsonb NULL,
	last_assessment timestamptz NULL,
	next_assessment timestamptz NULL,
	assessor varchar(255) NULL,
	automated_assessment bool DEFAULT false NULL,
	mapping_confidence numeric(3, 2) DEFAULT 0.8 NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT system_compliance_mapping_pkey PRIMARY KEY (id),
	CONSTRAINT system_compliance_mapping_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE
);
CREATE INDEX idx_system_compliance_mapping_framework ON public.system_compliance_mapping USING btree (framework);
CREATE INDEX idx_system_compliance_mapping_system_id ON public.system_compliance_mapping USING btree (system_id);
COMMENT ON TABLE public.system_compliance_mapping IS 'Maps systems to regulatory compliance frameworks';

-- Permissions

ALTER TABLE public.system_compliance_mapping OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_compliance_mapping TO rasdashadmin;


-- public.system_configuration_drift definition

-- Drop table

-- DROP TABLE public.system_configuration_drift;

CREATE TABLE public.system_configuration_drift (
	id serial4 NOT NULL,
	system_id int4 NOT NULL,
	drift_type varchar(100) NOT NULL,
	severity public."drift_severity" NOT NULL,
	title varchar(500) NOT NULL,
	description text NULL,
	current_value text NULL,
	expected_value text NULL,
	previous_value text NULL,
	detection_method varchar(100) NULL,
	impact_assessment text NULL,
	remediation_steps jsonb DEFAULT '[]'::jsonb NULL,
	business_impact varchar(50) NULL,
	detected_at timestamptz NOT NULL,
	acknowledged_at timestamptz NULL,
	resolved_at timestamptz NULL,
	acknowledged_by int4 NULL,
	resolved_by int4 NULL,
	status varchar(50) DEFAULT 'open'::character varying NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT system_configuration_drift_pkey PRIMARY KEY (id),
	CONSTRAINT system_configuration_drift_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id),
	CONSTRAINT system_configuration_drift_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id),
	CONSTRAINT system_configuration_drift_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE
);
CREATE INDEX idx_system_configuration_drift_detected_at ON public.system_configuration_drift USING btree (detected_at);
CREATE INDEX idx_system_configuration_drift_severity ON public.system_configuration_drift USING btree (severity);
CREATE INDEX idx_system_configuration_drift_status ON public.system_configuration_drift USING btree (status);
CREATE INDEX idx_system_configuration_drift_system_id ON public.system_configuration_drift USING btree (system_id);
COMMENT ON TABLE public.system_configuration_drift IS 'Tracks configuration changes that impact security posture';

-- Permissions

ALTER TABLE public.system_configuration_drift OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_configuration_drift TO rasdashadmin;


-- public.system_discovery_results definition

-- Drop table

-- DROP TABLE public.system_discovery_results;

CREATE TABLE public.system_discovery_results (
	id serial4 NOT NULL,
	scan_id int4 NULL,
	system_identifier varchar(255) NOT NULL,
	discovery_data jsonb NOT NULL,
	confidence numeric(3, 2) DEFAULT 0.5 NULL,
	methods jsonb NOT NULL,
	processed bool DEFAULT false NULL,
	system_id int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT system_discovery_results_pkey PRIMARY KEY (id),
	CONSTRAINT system_discovery_results_scan_id_fkey FOREIGN KEY (scan_id) REFERENCES public.system_discovery_scans(id) ON DELETE CASCADE,
	CONSTRAINT system_discovery_results_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE SET NULL
);
CREATE INDEX idx_system_discovery_results_processed ON public.system_discovery_results USING btree (processed);
CREATE INDEX idx_system_discovery_results_scan_id ON public.system_discovery_results USING btree (scan_id);
CREATE INDEX idx_system_discovery_results_system_id ON public.system_discovery_results USING btree (system_id);
COMMENT ON TABLE public.system_discovery_results IS 'Stores individual discovery results for each found system';

-- Permissions

ALTER TABLE public.system_discovery_results OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_discovery_results TO rasdashadmin;


-- public.system_impact_levels definition

-- Drop table

-- DROP TABLE public.system_impact_levels;

CREATE TABLE public.system_impact_levels (
	id serial4 NOT NULL,
	system_id varchar(50) NULL,
	confidentiality varchar(20) NOT NULL,
	"integrity" varchar(20) NOT NULL,
	availability varchar(20) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT system_impact_levels_pkey PRIMARY KEY (id),
	CONSTRAINT system_impact_levels_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(system_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.system_impact_levels OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_impact_levels TO rasdashadmin;


-- public.system_security_posture definition

-- Drop table

-- DROP TABLE public.system_security_posture;

CREATE TABLE public.system_security_posture (
	id serial4 NOT NULL,
	system_id int4 NOT NULL,
	overall_score numeric(5, 2) NOT NULL,
	"posture_status" public."posture_status" NOT NULL,
	vulnerability_score numeric(5, 2) NULL,
	configuration_score numeric(5, 2) NULL,
	patch_score numeric(5, 2) NULL,
	compliance_score numeric(5, 2) NULL,
	control_effectiveness numeric(5, 2) NULL,
	threat_exposure numeric(5, 2) NULL,
	business_impact numeric(5, 2) NULL,
	risk_factors jsonb DEFAULT '{}'::jsonb NULL,
	recommendations jsonb DEFAULT '[]'::jsonb NULL,
	last_assessment timestamptz NOT NULL,
	next_assessment timestamptz NULL,
	assessed_by varchar(100) NULL,
	created_at timestamptz DEFAULT now() NULL,
	updated_at timestamptz DEFAULT now() NULL,
	CONSTRAINT system_security_posture_pkey PRIMARY KEY (id),
	CONSTRAINT system_security_posture_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE
);
CREATE INDEX idx_system_security_posture_score ON public.system_security_posture USING btree (overall_score);
CREATE INDEX idx_system_security_posture_status ON public.system_security_posture USING btree (posture_status);
CREATE INDEX idx_system_security_posture_system_id ON public.system_security_posture USING btree (system_id);
COMMENT ON TABLE public.system_security_posture IS 'Stores comprehensive security posture assessments for systems';

-- Permissions

ALTER TABLE public.system_security_posture OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_security_posture TO rasdashadmin;


-- public.system_threat_modeling definition

-- Drop table

-- DROP TABLE public.system_threat_modeling;

CREATE TABLE public.system_threat_modeling (
	id serial4 NOT NULL,
	system_id int4 NOT NULL,
	model_id varchar(100) NOT NULL,
	model_name varchar(255) NOT NULL,
	methodology varchar(100) NULL,
	"scope" text NULL,
	assets jsonb DEFAULT '[]'::jsonb NULL,
	threat_actors jsonb DEFAULT '[]'::jsonb NULL,
	attack_vectors jsonb DEFAULT '[]'::jsonb NULL,
	threats jsonb DEFAULT '[]'::jsonb NULL,
	vulnerabilities jsonb DEFAULT '[]'::jsonb NULL,
	controls jsonb DEFAULT '[]'::jsonb NULL,
	risk_assessment jsonb DEFAULT '{}'::jsonb NULL,
	mitigation_strategies jsonb DEFAULT '[]'::jsonb NULL,
	residual_risk numeric(5, 2) NULL,
	model_status varchar(50) DEFAULT 'draft'::character varying NULL,
	last_updated timestamptz DEFAULT now() NULL,
	created_by int4 NOT NULL,
	reviewed_by int4 NULL,
	approved_by int4 NULL,
	reviewed_at timestamptz NULL,
	approved_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT system_threat_modeling_model_id_key UNIQUE (model_id),
	CONSTRAINT system_threat_modeling_pkey PRIMARY KEY (id),
	CONSTRAINT system_threat_modeling_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id),
	CONSTRAINT system_threat_modeling_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
	CONSTRAINT system_threat_modeling_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id),
	CONSTRAINT system_threat_modeling_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE
);
CREATE INDEX idx_system_threat_modeling_status ON public.system_threat_modeling USING btree (model_status);
CREATE INDEX idx_system_threat_modeling_system_id ON public.system_threat_modeling USING btree (system_id);
COMMENT ON TABLE public.system_threat_modeling IS 'Stores threat models and risk assessments for systems';

-- Permissions

ALTER TABLE public.system_threat_modeling OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.system_threat_modeling TO rasdashadmin;


-- public.user_module_preferences definition

-- Drop table

-- DROP TABLE public.user_module_preferences;

CREATE TABLE public.user_module_preferences (
	id serial4 NOT NULL,
	user_id int4 NOT NULL,
	module_id int4 NOT NULL,
	is_hidden bool DEFAULT false NOT NULL,
	custom_order int4 NULL,
	preferences text NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT user_module_preferences_pkey PRIMARY KEY (id),
	CONSTRAINT user_module_preferences_user_id_module_id_key UNIQUE (user_id, module_id),
	CONSTRAINT user_module_preferences_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.app_modules(id) ON DELETE CASCADE,
	CONSTRAINT user_module_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_user_module_preferences_module_id ON public.user_module_preferences USING btree (module_id);
CREATE INDEX idx_user_module_preferences_user_id ON public.user_module_preferences USING btree (user_id);

-- Permissions

ALTER TABLE public.user_module_preferences OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.user_module_preferences TO rasdashadmin;


-- public.vulnerabilities definition

-- Drop table

-- DROP TABLE public.vulnerabilities;

CREATE TABLE public.vulnerabilities (
	id serial4 NOT NULL,
	asset_uuid uuid NULL,
	plugin_id int4 NOT NULL,
	plugin_name text NOT NULL,
	plugin_family varchar(255) NULL,
	severity int4 NULL,
	severity_name varchar(20) NULL,
	cvss_base_score numeric(3, 1) NULL,
	cvss3_base_score numeric(3, 1) NULL,
	description text NULL,
	solution text NULL,
	risk_factor varchar(20) NULL,
	first_found timestamp NULL,
	last_found timestamp NULL,
	state varchar(20) DEFAULT 'Open'::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	"source" varchar(50) DEFAULT 'tenable'::character varying NULL,
	batch_id uuid NULL,
	raw_json jsonb NULL,
	CONSTRAINT vulnerabilities_pkey PRIMARY KEY (id),
	CONSTRAINT vulnerabilities_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE
);
CREATE INDEX idx_vulnerabilities_last_found ON public.vulnerabilities USING btree (last_found);

-- Permissions

ALTER TABLE public.vulnerabilities OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerabilities TO rasdashadmin;


-- public.vulnerability_poams definition

-- Drop table

-- DROP TABLE public.vulnerability_poams;

CREATE TABLE public.vulnerability_poams (
	id serial4 NOT NULL,
	vulnerability_id int4 NULL,
	poam_id varchar(50) NULL,
	relationship_type varchar(50) DEFAULT 'addresses'::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT vulnerability_poams_pkey PRIMARY KEY (id),
	CONSTRAINT vulnerability_poams_vulnerability_id_poam_id_key UNIQUE (vulnerability_id, poam_id),
	CONSTRAINT vulnerability_poams_poam_id_fkey FOREIGN KEY (poam_id) REFERENCES public.poams(poam_id) ON DELETE CASCADE,
	CONSTRAINT vulnerability_poams_vulnerability_id_fkey FOREIGN KEY (vulnerability_id) REFERENCES public.vulnerabilities(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.vulnerability_poams OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_poams TO rasdashadmin;


-- public.vulnerability_references definition

-- Drop table

-- DROP TABLE public.vulnerability_references;

CREATE TABLE public.vulnerability_references (
	id serial4 NOT NULL,
	vulnerability_id int4 NULL,
	reference_url text NOT NULL,
	reference_type varchar(50) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT vulnerability_references_pkey PRIMARY KEY (id),
	CONSTRAINT vulnerability_references_vulnerability_id_fkey FOREIGN KEY (vulnerability_id) REFERENCES public.vulnerabilities(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.vulnerability_references OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.vulnerability_references TO rasdashadmin;


-- public.webhook_deliveries definition

-- Drop table

-- DROP TABLE public.webhook_deliveries;

CREATE TABLE public.webhook_deliveries (
	id serial4 NOT NULL,
	webhook_id int4 NULL,
	event_type varchar(100) NOT NULL,
	payload jsonb NOT NULL,
	target_url varchar(500) NOT NULL,
	status public."webhook_status" NOT NULL,
	http_status int4 NULL,
	response_body text NULL,
	response_headers jsonb NULL,
	duration int4 NULL,
	retry_count int4 DEFAULT 0 NULL,
	max_retries int4 DEFAULT 3 NULL,
	next_retry_at timestamptz NULL,
	"error" text NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	delivered_at timestamptz NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT webhook_deliveries_pkey PRIMARY KEY (id),
	CONSTRAINT webhook_deliveries_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhook_configurations(id)
);
CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries USING btree (status);
CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries USING btree (webhook_id);
COMMENT ON TABLE public.webhook_deliveries IS 'Tracks outgoing webhook delivery attempts and results';

-- Permissions

ALTER TABLE public.webhook_deliveries OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.webhook_deliveries TO rasdashadmin;


-- public.webhook_logs definition

-- Drop table

-- DROP TABLE public.webhook_logs;

CREATE TABLE public.webhook_logs (
	id serial4 NOT NULL,
	webhook_id int4 NULL,
	service public."webhook_service" NOT NULL,
	event_type varchar(100) NOT NULL,
	payload jsonb NOT NULL,
	signature varchar(255) NULL,
	status public."webhook_status" NOT NULL,
	http_status int4 NULL,
	duration int4 NULL,
	retry_count int4 DEFAULT 0 NULL,
	"result" jsonb NULL,
	"error" text NULL,
	received_at timestamptz NOT NULL,
	processed_at timestamptz NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT webhook_logs_pkey PRIMARY KEY (id),
	CONSTRAINT webhook_logs_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhook_configurations(id)
);
CREATE INDEX idx_webhook_logs_received_at ON public.webhook_logs USING btree (received_at);
CREATE INDEX idx_webhook_logs_service ON public.webhook_logs USING btree (service);
CREATE INDEX idx_webhook_logs_status ON public.webhook_logs USING btree (status);
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs USING btree (webhook_id);
COMMENT ON TABLE public.webhook_logs IS 'Logs all incoming webhook events and their processing status';

-- Permissions

ALTER TABLE public.webhook_logs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.webhook_logs TO rasdashadmin;


-- public.webhook_rate_limits definition

-- Drop table

-- DROP TABLE public.webhook_rate_limits;

CREATE TABLE public.webhook_rate_limits (
	id serial4 NOT NULL,
	webhook_id int4 NULL,
	event_type varchar(100) NULL,
	window_start timestamptz NOT NULL,
	window_end timestamptz NOT NULL,
	request_count int4 DEFAULT 0 NULL,
	"limit" int4 NOT NULL,
	exceeded bool DEFAULT false NULL,
	reset_at timestamptz NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT webhook_rate_limits_pkey PRIMARY KEY (id),
	CONSTRAINT webhook_rate_limits_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhook_configurations(id)
);
CREATE INDEX idx_webhook_rate_limits_webhook_id ON public.webhook_rate_limits USING btree (webhook_id);
COMMENT ON TABLE public.webhook_rate_limits IS 'Tracks rate limiting for webhook endpoints';

-- Permissions

ALTER TABLE public.webhook_rate_limits OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.webhook_rate_limits TO rasdashadmin;


-- public.webhook_security definition

-- Drop table

-- DROP TABLE public.webhook_security;

CREATE TABLE public.webhook_security (
	id serial4 NOT NULL,
	webhook_id int4 NULL,
	allowed_ips jsonb DEFAULT '[]'::jsonb NULL,
	allowed_user_agents jsonb DEFAULT '[]'::jsonb NULL,
	require_signature bool DEFAULT true NULL,
	signature_header varchar(100) DEFAULT 'X-Webhook-Signature'::character varying NULL,
	signature_algorithm varchar(50) DEFAULT 'sha256'::character varying NULL,
	encrypt_payload bool DEFAULT false NULL,
	encryption_key varchar(255) NULL,
	max_payload_size int4 DEFAULT 1048576 NULL,
	timeout_seconds int4 DEFAULT 30 NULL,
	ssl_verify bool DEFAULT true NULL,
	custom_headers jsonb DEFAULT '{}'::jsonb NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT webhook_security_pkey PRIMARY KEY (id),
	CONSTRAINT webhook_security_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhook_configurations(id)
);
CREATE INDEX idx_webhook_security_webhook_id ON public.webhook_security USING btree (webhook_id);
COMMENT ON TABLE public.webhook_security IS 'Security settings and restrictions for webhooks';

-- Permissions

ALTER TABLE public.webhook_security OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.webhook_security TO rasdashadmin;


-- public.webhook_subscriptions definition

-- Drop table

-- DROP TABLE public.webhook_subscriptions;

CREATE TABLE public.webhook_subscriptions (
	id serial4 NOT NULL,
	webhook_id int4 NULL,
	event_type varchar(100) NOT NULL,
	filters jsonb DEFAULT '{}'::jsonb NULL,
	transformations jsonb DEFAULT '{}'::jsonb NULL,
	enabled bool DEFAULT true NULL,
	priority int4 DEFAULT 0 NULL,
	rate_limit int4 NULL,
	rate_limit_window int4 DEFAULT 60 NULL,
	last_processed timestamptz NULL,
	processed_count int4 DEFAULT 0 NULL,
	error_count int4 DEFAULT 0 NULL,
	created_at timestamptz DEFAULT now() NOT NULL,
	updated_at timestamptz DEFAULT now() NOT NULL,
	CONSTRAINT webhook_subscriptions_pkey PRIMARY KEY (id),
	CONSTRAINT webhook_subscriptions_webhook_id_fkey FOREIGN KEY (webhook_id) REFERENCES public.webhook_configurations(id)
);
CREATE INDEX idx_webhook_subscriptions_enabled ON public.webhook_subscriptions USING btree (enabled);
CREATE INDEX idx_webhook_subscriptions_webhook_id ON public.webhook_subscriptions USING btree (webhook_id);
COMMENT ON TABLE public.webhook_subscriptions IS 'Manages event subscriptions and filtering rules';

-- Permissions

ALTER TABLE public.webhook_subscriptions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.webhook_subscriptions TO rasdashadmin;


-- public.workflow_edges definition

-- Drop table

-- DROP TABLE public.workflow_edges;

CREATE TABLE public.workflow_edges (
	id uuid NOT NULL,
	workflow_id uuid NULL,
	edge_id varchar(100) NOT NULL,
	source_node_id varchar(100) NOT NULL,
	target_node_id varchar(100) NOT NULL,
	source_handle varchar(50) NULL,
	target_handle varchar(50) NULL,
	edge_type varchar(50) DEFAULT 'smoothstep'::character varying NULL,
	conditions jsonb NULL,
	is_enabled bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workflow_edges_pkey PRIMARY KEY (id),
	CONSTRAINT workflow_edges_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.workflow_edges OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.workflow_edges TO rasdashadmin;


-- public.workflow_instances definition

-- Drop table

-- DROP TABLE public.workflow_instances;

CREATE TABLE public.workflow_instances (
	id uuid NOT NULL,
	workflow_id uuid NULL,
	status varchar(50) NOT NULL,
	priority varchar(20) DEFAULT 'normal'::character varying NULL,
	started_at timestamp DEFAULT now() NULL,
	completed_at timestamp NULL,
	paused_at timestamp NULL,
	progress int4 DEFAULT 0 NULL,
	current_step varchar(100) NULL,
	execution_context jsonb NULL,
	output_data jsonb NULL,
	error_details text NULL,
	triggered_by varchar(100) NULL,
	trigger_source varchar(100) NULL,
	execution_metrics jsonb NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workflow_instances_pkey PRIMARY KEY (id),
	CONSTRAINT workflow_instances_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id)
);

-- Permissions

ALTER TABLE public.workflow_instances OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.workflow_instances TO rasdashadmin;


-- public.workflow_nodes definition

-- Drop table

-- DROP TABLE public.workflow_nodes;

CREATE TABLE public.workflow_nodes (
	id uuid NOT NULL,
	workflow_id uuid NULL,
	node_id varchar(100) NOT NULL,
	node_type varchar(50) NOT NULL,
	"label" varchar(255) NOT NULL,
	position_x int4 NOT NULL,
	position_y int4 NOT NULL,
	"configuration" jsonb NULL,
	is_enabled bool DEFAULT true NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workflow_nodes_pkey PRIMARY KEY (id),
	CONSTRAINT workflow_nodes_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.workflow_nodes OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.workflow_nodes TO rasdashadmin;


-- public.workflow_triggers definition

-- Drop table

-- DROP TABLE public.workflow_triggers;

CREATE TABLE public.workflow_triggers (
	id uuid NOT NULL,
	workflow_id uuid NULL,
	trigger_type varchar(50) NOT NULL,
	trigger_source varchar(100) NULL,
	"configuration" jsonb NULL,
	is_active bool DEFAULT true NULL,
	last_triggered timestamp NULL,
	trigger_count int4 DEFAULT 0 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workflow_triggers_pkey PRIMARY KEY (id),
	CONSTRAINT workflow_triggers_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES public.workflows(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.workflow_triggers OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.workflow_triggers TO rasdashadmin;


-- public.asset_network definition

-- Drop table

-- DROP TABLE public.asset_network;

CREATE TABLE public.asset_network (
	id serial4 NOT NULL,
	asset_uuid uuid NULL,
	fqdn varchar(255) NULL,
	ipv4_address inet NULL,
	mac_address macaddr NULL,
	network_type varchar(50) NULL,
	is_primary bool DEFAULT false NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT asset_network_pkey PRIMARY KEY (id),
	CONSTRAINT asset_network_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.asset_network OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_network TO rasdashadmin;


-- public.asset_systems definition

-- Drop table

-- DROP TABLE public.asset_systems;

CREATE TABLE public.asset_systems (
	id serial4 NOT NULL,
	asset_uuid uuid NULL,
	operating_system varchar(255) NULL,
	system_type varchar(100) NULL,
	is_primary bool DEFAULT false NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT asset_systems_pkey PRIMARY KEY (id),
	CONSTRAINT asset_systems_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.asset_systems OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_systems TO rasdashadmin;


-- public.asset_tags definition

-- Drop table

-- DROP TABLE public.asset_tags;

CREATE TABLE public.asset_tags (
	id serial4 NOT NULL,
	asset_uuid uuid NULL,
	tag_key varchar(100) NOT NULL,
	tag_value varchar(255) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT asset_tags_asset_uuid_tag_key_key UNIQUE (asset_uuid, tag_key),
	CONSTRAINT asset_tags_pkey PRIMARY KEY (id),
	CONSTRAINT asset_tags_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.asset_tags OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.asset_tags TO rasdashadmin;


-- public.control_evidence definition

-- Drop table

-- DROP TABLE public.control_evidence;

CREATE TABLE public.control_evidence (
	id serial4 NOT NULL,
	control_id int4 NULL,
	evidence_id varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	evidence_type varchar(100) NULL,
	"location" text NULL,
	upload_date date NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT control_evidence_pkey PRIMARY KEY (id),
	CONSTRAINT control_evidence_control_id_fkey FOREIGN KEY (control_id) REFERENCES public.controls(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.control_evidence OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.control_evidence TO rasdashadmin;


-- public.control_findings definition

-- Drop table

-- DROP TABLE public.control_findings;

CREATE TABLE public.control_findings (
	id serial4 NOT NULL,
	control_id int4 NULL,
	finding_id varchar(50) NOT NULL,
	severity varchar(20) NULL,
	description text NOT NULL,
	recommendation text NULL,
	target_date date NULL,
	poc varchar(255) NULL,
	status varchar(50) DEFAULT 'open'::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT control_findings_pkey PRIMARY KEY (id),
	CONSTRAINT control_findings_control_id_fkey FOREIGN KEY (control_id) REFERENCES public.controls(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.control_findings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.control_findings TO rasdashadmin;


-- public.control_inheritance definition

-- Drop table

-- DROP TABLE public.control_inheritance;

CREATE TABLE public.control_inheritance (
	id serial4 NOT NULL,
	control_id int4 NULL,
	provider varchar(255) NULL,
	description text NULL,
	responsibility varchar(50) NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT control_inheritance_pkey PRIMARY KEY (id),
	CONSTRAINT control_inheritance_control_id_fkey FOREIGN KEY (control_id) REFERENCES public.controls(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.control_inheritance OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.control_inheritance TO rasdashadmin;


-- public.control_poams definition

-- Drop table

-- DROP TABLE public.control_poams;

CREATE TABLE public.control_poams (
	id serial4 NOT NULL,
	control_id int4 NULL,
	poam_id varchar(50) NULL,
	relationship_type varchar(50) DEFAULT 'remediates'::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT control_poams_control_id_poam_id_key UNIQUE (control_id, poam_id),
	CONSTRAINT control_poams_pkey PRIMARY KEY (id),
	CONSTRAINT control_poams_control_id_fkey FOREIGN KEY (control_id) REFERENCES public.controls(id) ON DELETE CASCADE,
	CONSTRAINT control_poams_poam_id_fkey FOREIGN KEY (poam_id) REFERENCES public.poams(poam_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.control_poams OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.control_poams TO rasdashadmin;


-- public.documents definition

-- Drop table

-- DROP TABLE public.documents;

CREATE TABLE public.documents (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	original_name text NOT NULL,
	"size" int4 NOT NULL,
	mime_type varchar NOT NULL,
	url text NOT NULL,
	object_path text NULL,
	folder_id varchar NULL,
	user_id int4 NOT NULL,
	tags _text DEFAULT '{}'::text[] NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	deleted_at timestamptz NULL,
	deleted_by int4 NULL,
	CONSTRAINT documents_pkey PRIMARY KEY (id),
	CONSTRAINT documents_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id),
	CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE SET NULL,
	CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_documents_folder_id ON public.documents USING btree (folder_id);
CREATE INDEX idx_documents_mime_type ON public.documents USING btree (mime_type);
CREATE INDEX idx_documents_name ON public.documents USING gin (to_tsvector('english'::regconfig, name));
CREATE INDEX idx_documents_tags ON public.documents USING gin (tags);
CREATE INDEX idx_documents_user_id ON public.documents USING btree (user_id);

-- Table Triggers

create trigger update_documents_updated_at before
update
    on
    public.documents for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.documents OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.documents TO rasdashadmin;


-- public.patch_job_dependencies definition

-- Drop table

-- DROP TABLE public.patch_job_dependencies;

CREATE TABLE public.patch_job_dependencies (
	id serial4 NOT NULL,
	job_id int4 NOT NULL,
	depends_on_job_id int4 NOT NULL,
	dependency_type varchar(50) DEFAULT 'blocks'::character varying NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT patch_job_dependencies_check CHECK ((job_id <> depends_on_job_id)),
	CONSTRAINT patch_job_dependencies_dependency_type_check CHECK (((dependency_type)::text = ANY ((ARRAY['blocks'::character varying, 'requires_success'::character varying, 'requires_completion'::character varying])::text[]))),
	CONSTRAINT patch_job_dependencies_pkey PRIMARY KEY (id),
	CONSTRAINT patch_job_dependencies_depends_on_job_id_fkey FOREIGN KEY (depends_on_job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
	CONSTRAINT patch_job_dependencies_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_job_deps_depends_on ON public.patch_job_dependencies USING btree (depends_on_job_id);
CREATE INDEX idx_patch_job_deps_job_id ON public.patch_job_dependencies USING btree (job_id);
CREATE UNIQUE INDEX ux_patch_job_deps_unique ON public.patch_job_dependencies USING btree (job_id, depends_on_job_id);

-- Permissions

ALTER TABLE public.patch_job_dependencies OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_job_dependencies TO rasdashadmin;


-- public.patch_schedule_executions definition

-- Drop table

-- DROP TABLE public.patch_schedule_executions;

CREATE TABLE public.patch_schedule_executions (
	id serial4 NOT NULL,
	schedule_id int4 NOT NULL,
	job_id int4 NULL,
	status varchar(50) DEFAULT 'scheduled'::character varying NOT NULL,
	scheduled_for timestamp NOT NULL,
	started_at timestamp NULL,
	completed_at timestamp NULL,
	patches_selected _int4 DEFAULT '{}'::integer[] NULL,
	assets_targeted _uuid DEFAULT '{}'::uuid[] NULL,
	execution_summary jsonb DEFAULT '{}'::jsonb NULL,
	error_message text NULL,
	CONSTRAINT patch_schedule_executions_pkey PRIMARY KEY (id),
	CONSTRAINT patch_schedule_executions_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'skipped'::character varying])::text[]))),
	CONSTRAINT patch_schedule_executions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE SET NULL,
	CONSTRAINT patch_schedule_executions_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.patch_schedules(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_schedule_execs_job_id ON public.patch_schedule_executions USING btree (job_id);
CREATE INDEX idx_patch_schedule_execs_schedule_id ON public.patch_schedule_executions USING btree (schedule_id);
CREATE INDEX idx_patch_schedule_execs_scheduled_for ON public.patch_schedule_executions USING btree (scheduled_for DESC);
CREATE INDEX idx_patch_schedule_execs_status ON public.patch_schedule_executions USING btree (status);

-- Permissions

ALTER TABLE public.patch_schedule_executions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_schedule_executions TO rasdashadmin;


-- public.patches definition

-- Drop table

-- DROP TABLE public.patches;

CREATE TABLE public.patches (
	id serial4 NOT NULL,
	patch_id varchar(255) NOT NULL,
	cve_id varchar(20) NULL,
	vulnerability_id int4 NOT NULL,
	asset_uuid uuid NOT NULL,
	title text NOT NULL,
	vendor varchar(100) NULL,
	description text NULL,
	product varchar(100) NULL,
	version_affected varchar(100) NULL,
	patch_type varchar(50) NULL,
	patch_version varchar(100) NULL,
	severity varchar(20) NULL,
	status varchar(20) DEFAULT 'identified'::character varying NULL,
	patch_description text NULL,
	release_date timestamp NULL,
	kb varchar(50) NULL,
	"version" text NULL,
	applicable_to jsonb NULL,
	download_url text NULL,
	patch_url text NULL,
	file_size varchar(20) NULL,
	checksum varchar(255) NULL,
	prerequisites text NULL,
	superseded_by varchar(255) NULL,
	supersedes varchar(255) NULL,
	reboot_required bool DEFAULT false NULL,
	estimated_install_time interval NULL,
	patch_priority varchar(20) NULL,
	business_impact text NULL,
	rollback_instructions text NULL,
	testing_notes text NULL,
	deployment_notes text NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	"source" varchar(50) DEFAULT 'vulnerability_analysis'::character varying NULL,
	batch_id uuid NULL,
	raw_json jsonb NULL,
	CONSTRAINT patches_pkey PRIMARY KEY (id),
	CONSTRAINT patches_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE,
	CONSTRAINT patches_vulnerability_id_fkey FOREIGN KEY (vulnerability_id) REFERENCES public.vulnerabilities(id) ON DELETE CASCADE
);
CREATE INDEX idx_patches_asset_uuid ON public.patches USING btree (asset_uuid);
CREATE INDEX idx_patches_batch_id ON public.patches USING btree (batch_id);
CREATE INDEX idx_patches_priority ON public.patches USING btree (patch_priority);
CREATE INDEX idx_patches_status ON public.patches USING btree (status);
CREATE INDEX idx_patches_vulnerability_id ON public.patches USING btree (vulnerability_id);
CREATE UNIQUE INDEX ux_patches_asset_patch ON public.patches USING btree (asset_uuid, patch_id);

-- Permissions

ALTER TABLE public.patches OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patches TO rasdashadmin;


-- public.poam_assets definition

-- Drop table

-- DROP TABLE public.poam_assets;

CREATE TABLE public.poam_assets (
	id serial4 NOT NULL,
	poam_id varchar(50) NULL,
	asset_uuid uuid NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT poam_assets_pkey PRIMARY KEY (id),
	CONSTRAINT poam_assets_poam_id_asset_uuid_key UNIQUE (poam_id, asset_uuid),
	CONSTRAINT poam_assets_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE,
	CONSTRAINT poam_assets_poam_id_fkey FOREIGN KEY (poam_id) REFERENCES public.poams(poam_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.poam_assets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.poam_assets TO rasdashadmin;


-- public.poam_cves definition

-- Drop table

-- DROP TABLE public.poam_cves;

CREATE TABLE public.poam_cves (
	id serial4 NOT NULL,
	poam_id varchar(50) NULL,
	cve_id varchar(20) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT poam_cves_pkey PRIMARY KEY (id),
	CONSTRAINT poam_cves_poam_id_cve_id_key UNIQUE (poam_id, cve_id),
	CONSTRAINT poam_cves_poam_id_fkey FOREIGN KEY (poam_id) REFERENCES public.poams(poam_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.poam_cves OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.poam_cves TO rasdashadmin;


-- public.poam_milestones definition

-- Drop table

-- DROP TABLE public.poam_milestones;

CREATE TABLE public.poam_milestones (
	id serial4 NOT NULL,
	poam_id varchar(50) NULL,
	milestone_order int4 NOT NULL,
	description text NOT NULL,
	target_date date NULL,
	status varchar(50) NULL,
	completion_date date NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT poam_milestones_pkey PRIMARY KEY (id),
	CONSTRAINT poam_milestones_poam_id_fkey FOREIGN KEY (poam_id) REFERENCES public.poams(poam_id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.poam_milestones OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.poam_milestones TO rasdashadmin;


-- public.scan_findings definition

-- Drop table

-- DROP TABLE public.scan_findings;

CREATE TABLE public.scan_findings (
	id serial4 NOT NULL,
	scan_result_id int4 NOT NULL,
	finding_type varchar(50) NOT NULL,
	severity varchar(20) NOT NULL,
	title varchar(500) NOT NULL,
	description text NULL,
	recommendation text NULL,
	cve_id varchar(20) NULL,
	cvss_score varchar(10) NULL,
	port int4 NULL,
	service varchar(100) NULL,
	evidence jsonb NULL,
	status varchar(20) DEFAULT 'open'::character varying NOT NULL,
	assigned_to int4 NULL,
	resolved_at timestamptz NULL,
	resolved_by int4 NULL,
	created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT scan_findings_pkey PRIMARY KEY (id),
	CONSTRAINT scan_findings_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id),
	CONSTRAINT scan_findings_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id),
	CONSTRAINT scan_findings_scan_result_id_fkey FOREIGN KEY (scan_result_id) REFERENCES public.scan_results(id) ON DELETE CASCADE
);
CREATE INDEX idx_scan_findings_assigned_to ON public.scan_findings USING btree (assigned_to);
CREATE INDEX idx_scan_findings_cve_id ON public.scan_findings USING btree (cve_id);
CREATE INDEX idx_scan_findings_finding_type ON public.scan_findings USING btree (finding_type);
CREATE INDEX idx_scan_findings_scan_result_id ON public.scan_findings USING btree (scan_result_id);
CREATE INDEX idx_scan_findings_severity ON public.scan_findings USING btree (severity);
CREATE INDEX idx_scan_findings_status ON public.scan_findings USING btree (status);

-- Permissions

ALTER TABLE public.scan_findings OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.scan_findings TO rasdashadmin;


-- public.stig_asset_assignments definition

-- Drop table

-- DROP TABLE public.stig_asset_assignments;

CREATE TABLE public.stig_asset_assignments (
	id uuid DEFAULT gen_random_uuid() NOT NULL,
	asset_id uuid NULL,
	stig_id varchar(255) NOT NULL,
	stig_title varchar(255) NOT NULL,
	priority int4 DEFAULT 2 NULL,
	assigned_at timestamp DEFAULT now() NULL,
	CONSTRAINT stig_asset_assignments_asset_id_stig_id_key UNIQUE (asset_id, stig_id),
	CONSTRAINT stig_asset_assignments_pkey PRIMARY KEY (id),
	CONSTRAINT stig_asset_assignments_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.stig_assets(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.stig_asset_assignments OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.stig_asset_assignments TO rasdashadmin;


-- public.workflow_executions definition

-- Drop table

-- DROP TABLE public.workflow_executions;

CREATE TABLE public.workflow_executions (
	id uuid NOT NULL,
	instance_id uuid NULL,
	node_id varchar(100) NOT NULL,
	step_type varchar(50) NOT NULL,
	status varchar(50) NOT NULL,
	started_at timestamp NULL,
	completed_at timestamp NULL,
	duration_ms int4 NULL,
	input_data jsonb NULL,
	output_data jsonb NULL,
	error_message text NULL,
	retry_count int4 DEFAULT 0 NULL,
	max_retries int4 DEFAULT 0 NULL,
	created_at timestamp DEFAULT now() NULL,
	updated_at timestamp DEFAULT now() NULL,
	CONSTRAINT workflow_executions_pkey PRIMARY KEY (id),
	CONSTRAINT workflow_executions_instance_id_fkey FOREIGN KEY (instance_id) REFERENCES public.workflow_instances(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.workflow_executions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.workflow_executions TO rasdashadmin;


-- public.document_analytics definition

-- Drop table

-- DROP TABLE public.document_analytics;

CREATE TABLE public.document_analytics (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	document_id varchar NOT NULL,
	user_id int4 NOT NULL,
	"action" varchar NOT NULL,
	metadata jsonb NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT document_analytics_action_check CHECK (((action)::text = ANY ((ARRAY['view'::character varying, 'download'::character varying])::text[]))),
	CONSTRAINT document_analytics_pkey PRIMARY KEY (id),
	CONSTRAINT document_analytics_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
	CONSTRAINT document_analytics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_analytics_action ON public.document_analytics USING btree (action);
CREATE INDEX idx_analytics_document_id ON public.document_analytics USING btree (document_id);
CREATE INDEX idx_analytics_metadata ON public.document_analytics USING gin (metadata);
CREATE INDEX idx_analytics_timestamp ON public.document_analytics USING btree ("timestamp");
CREATE INDEX idx_analytics_user_id ON public.document_analytics USING btree (user_id);

-- Permissions

ALTER TABLE public.document_analytics OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.document_analytics TO rasdashadmin;


-- public.document_comments definition

-- Drop table

-- DROP TABLE public.document_comments;

CREATE TABLE public.document_comments (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	document_id varchar NOT NULL,
	user_id int4 NOT NULL,
	"content" text NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	updated_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT document_comments_pkey PRIMARY KEY (id),
	CONSTRAINT document_comments_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
	CONSTRAINT document_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_comments_created_at ON public.document_comments USING btree (created_at);
CREATE INDEX idx_comments_document_id ON public.document_comments USING btree (document_id);
CREATE INDEX idx_comments_user_id ON public.document_comments USING btree (user_id);

-- Table Triggers

create trigger update_comments_updated_at before
update
    on
    public.document_comments for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.document_comments OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.document_comments TO rasdashadmin;


-- public.document_favorites definition

-- Drop table

-- DROP TABLE public.document_favorites;

CREATE TABLE public.document_favorites (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	document_id varchar NULL,
	user_id int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT document_favorites_document_id_user_id_key UNIQUE (document_id, user_id),
	CONSTRAINT document_favorites_pkey PRIMARY KEY (id),
	CONSTRAINT document_favorites_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
	CONSTRAINT document_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.document_favorites OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.document_favorites TO rasdashadmin;


-- public.document_shares definition

-- Drop table

-- DROP TABLE public.document_shares;

CREATE TABLE public.document_shares (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	document_id varchar NULL,
	user_id int4 NULL,
	permission_level varchar DEFAULT 'read'::character varying NULL,
	shared_by int4 NULL,
	created_at timestamptz DEFAULT now() NULL,
	CONSTRAINT document_shares_document_id_user_id_key UNIQUE (document_id, user_id),
	CONSTRAINT document_shares_pkey PRIMARY KEY (id),
	CONSTRAINT document_shares_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
	CONSTRAINT document_shares_shared_by_fkey FOREIGN KEY (shared_by) REFERENCES public.users(id),
	CONSTRAINT document_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Permissions

ALTER TABLE public.document_shares OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.document_shares TO rasdashadmin;


-- public.document_versions definition

-- Drop table

-- DROP TABLE public.document_versions;

CREATE TABLE public.document_versions (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	document_id varchar NOT NULL,
	version_number int4 NOT NULL,
	"name" text NOT NULL,
	original_name text NOT NULL,
	"size" int4 NOT NULL,
	mime_type varchar NOT NULL,
	url text NOT NULL,
	checksum varchar NULL,
	change_type varchar NOT NULL,
	change_description text NULL,
	user_id int4 NOT NULL,
	created_at timestamp DEFAULT now() NOT NULL,
	CONSTRAINT document_versions_change_type_check CHECK (((change_type)::text = ANY ((ARRAY['created'::character varying, 'updated'::character varying, 'renamed'::character varying, 'moved'::character varying, 'restored'::character varying])::text[]))),
	CONSTRAINT document_versions_pkey PRIMARY KEY (id),
	CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
	CONSTRAINT document_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_versions_change_type ON public.document_versions USING btree (change_type);
CREATE INDEX idx_versions_created_at ON public.document_versions USING btree (created_at);
CREATE INDEX idx_versions_document_id ON public.document_versions USING btree (document_id);
CREATE UNIQUE INDEX idx_versions_document_version ON public.document_versions USING btree (document_id, version_number);
CREATE INDEX idx_versions_user_id ON public.document_versions USING btree (user_id);

-- Permissions

ALTER TABLE public.document_versions OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.document_versions TO rasdashadmin;


-- public.patch_approvals definition

-- Drop table

-- DROP TABLE public.patch_approvals;

CREATE TABLE public.patch_approvals (
	id serial4 NOT NULL,
	patch_id int4 NOT NULL,
	job_id int4 NULL,
	approval_type varchar(50) DEFAULT 'patch_deployment'::character varying NOT NULL,
	status varchar(50) DEFAULT 'pending'::character varying NOT NULL,
	approval_level int4 DEFAULT 1 NULL,
	required_approvals int4 DEFAULT 1 NULL,
	current_approvals int4 DEFAULT 0 NULL,
	requested_by int4 NOT NULL,
	requested_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	justification text NULL,
	risk_assessment jsonb DEFAULT '{}'::jsonb NULL,
	approved_by int4 NULL,
	approved_at timestamp NULL,
	approval_notes text NULL,
	expires_at timestamp NULL,
	CONSTRAINT patch_approvals_approval_type_check CHECK (((approval_type)::text = ANY ((ARRAY['patch_creation'::character varying, 'patch_deployment'::character varying, 'emergency_deployment'::character varying, 'rollback'::character varying])::text[]))),
	CONSTRAINT patch_approvals_pkey PRIMARY KEY (id),
	CONSTRAINT patch_approvals_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying, 'expired'::character varying])::text[]))),
	CONSTRAINT patch_approvals_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL,
	CONSTRAINT patch_approvals_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
	CONSTRAINT patch_approvals_patch_id_fkey FOREIGN KEY (patch_id) REFERENCES public.patches(id) ON DELETE CASCADE,
	CONSTRAINT patch_approvals_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_approvals_approved_by ON public.patch_approvals USING btree (approved_by);
CREATE INDEX idx_patch_approvals_job_id ON public.patch_approvals USING btree (job_id);
CREATE INDEX idx_patch_approvals_patch_id ON public.patch_approvals USING btree (patch_id);
CREATE INDEX idx_patch_approvals_requested_by ON public.patch_approvals USING btree (requested_by);
CREATE INDEX idx_patch_approvals_status ON public.patch_approvals USING btree (status);

-- Permissions

ALTER TABLE public.patch_approvals OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_approvals TO rasdashadmin;


-- public.patch_job_targets definition

-- Drop table

-- DROP TABLE public.patch_job_targets;

CREATE TABLE public.patch_job_targets (
	id serial4 NOT NULL,
	job_id int4 NOT NULL,
	asset_uuid uuid NOT NULL,
	patch_id int4 NOT NULL,
	status varchar(50) DEFAULT 'pending'::character varying NOT NULL,
	execution_order int4 DEFAULT 0 NULL,
	started_at timestamp NULL,
	completed_at timestamp NULL,
	error_message text NULL,
	progress_percentage int4 DEFAULT 0 NULL,
	logs jsonb DEFAULT '[]'::jsonb NULL,
	CONSTRAINT patch_job_targets_pkey PRIMARY KEY (id),
	CONSTRAINT patch_job_targets_progress_percentage_check CHECK (((progress_percentage >= 0) AND (progress_percentage <= 100))),
	CONSTRAINT patch_job_targets_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'skipped'::character varying])::text[]))),
	CONSTRAINT patch_job_targets_asset_uuid_fkey FOREIGN KEY (asset_uuid) REFERENCES public.assets(asset_uuid) ON DELETE CASCADE,
	CONSTRAINT patch_job_targets_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
	CONSTRAINT patch_job_targets_patch_id_fkey FOREIGN KEY (patch_id) REFERENCES public.patches(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_job_targets_asset_uuid ON public.patch_job_targets USING btree (asset_uuid);
CREATE INDEX idx_patch_job_targets_job_id ON public.patch_job_targets USING btree (job_id);
CREATE INDEX idx_patch_job_targets_patch_id ON public.patch_job_targets USING btree (patch_id);
CREATE INDEX idx_patch_job_targets_status ON public.patch_job_targets USING btree (status);

-- Permissions

ALTER TABLE public.patch_job_targets OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_job_targets TO rasdashadmin;


-- public.patch_notes definition

-- Drop table

-- DROP TABLE public.patch_notes;

CREATE TABLE public.patch_notes (
	id serial4 NOT NULL,
	patch_id int4 NOT NULL,
	job_id int4 NULL,
	note_type varchar(50) DEFAULT 'general'::character varying NOT NULL,
	title varchar(255) NULL,
	"content" text NOT NULL,
	visibility varchar(20) DEFAULT 'internal'::character varying NULL,
	context jsonb DEFAULT '{}'::jsonb NULL,
	tags _varchar DEFAULT '{}'::character varying[] NULL,
	attachments jsonb DEFAULT '[]'::jsonb NULL,
	created_by int4 NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	updated_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT patch_notes_note_type_check CHECK (((note_type)::text = ANY ((ARRAY['general'::character varying, 'deployment'::character varying, 'testing'::character varying, 'rollback'::character varying, 'issue'::character varying, 'resolution'::character varying, 'approval'::character varying, 'rejection'::character varying, 'escalation'::character varying, 'system_generated'::character varying])::text[]))),
	CONSTRAINT patch_notes_pkey PRIMARY KEY (id),
	CONSTRAINT patch_notes_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'internal'::character varying, 'restricted'::character varying, 'private'::character varying])::text[]))),
	CONSTRAINT patch_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT patch_notes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
	CONSTRAINT patch_notes_patch_id_fkey FOREIGN KEY (patch_id) REFERENCES public.patches(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_notes_created_at ON public.patch_notes USING btree (created_at DESC);
CREATE INDEX idx_patch_notes_created_by ON public.patch_notes USING btree (created_by);
CREATE INDEX idx_patch_notes_job_id ON public.patch_notes USING btree (job_id);
CREATE INDEX idx_patch_notes_note_type ON public.patch_notes USING btree (note_type);
CREATE INDEX idx_patch_notes_patch_id ON public.patch_notes USING btree (patch_id);
CREATE INDEX idx_patch_notes_tags ON public.patch_notes USING gin (tags);

-- Table Triggers

create trigger update_patch_notes_updated_at before
update
    on
    public.patch_notes for each row execute function update_updated_at_column();

-- Permissions

ALTER TABLE public.patch_notes OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_notes TO rasdashadmin;


-- public.document_changes definition

-- Drop table

-- DROP TABLE public.document_changes;

CREATE TABLE public.document_changes (
	id varchar DEFAULT gen_random_uuid() NOT NULL,
	document_id varchar NOT NULL,
	version_id varchar NULL,
	change_type varchar NOT NULL,
	change_description text NULL,
	previous_value jsonb NULL,
	new_value jsonb NULL,
	user_id int4 NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT document_changes_change_type_check CHECK (((change_type)::text = ANY ((ARRAY['created'::character varying, 'updated'::character varying, 'renamed'::character varying, 'moved'::character varying, 'deleted'::character varying, 'restored'::character varying])::text[]))),
	CONSTRAINT document_changes_pkey PRIMARY KEY (id),
	CONSTRAINT document_changes_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
	CONSTRAINT document_changes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT document_changes_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.document_versions(id) ON DELETE SET NULL
);
CREATE INDEX idx_changes_change_type ON public.document_changes USING btree (change_type);
CREATE INDEX idx_changes_document_id ON public.document_changes USING btree (document_id);
CREATE INDEX idx_changes_new_value ON public.document_changes USING gin (new_value);
CREATE INDEX idx_changes_previous_value ON public.document_changes USING gin (previous_value);
CREATE INDEX idx_changes_timestamp ON public.document_changes USING btree ("timestamp");
CREATE INDEX idx_changes_user_id ON public.document_changes USING btree (user_id);
CREATE INDEX idx_changes_version_id ON public.document_changes USING btree (version_id);

-- Permissions

ALTER TABLE public.document_changes OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.document_changes TO rasdashadmin;


-- public.patch_approval_history definition

-- Drop table

-- DROP TABLE public.patch_approval_history;

CREATE TABLE public.patch_approval_history (
	id serial4 NOT NULL,
	approval_id int4 NOT NULL,
	"action" varchar(50) NOT NULL,
	actor_id int4 NOT NULL,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	"comments" text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	CONSTRAINT patch_approval_history_action_check CHECK (((action)::text = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying, 'expired'::character varying, 'escalated'::character varying])::text[]))),
	CONSTRAINT patch_approval_history_pkey PRIMARY KEY (id),
	CONSTRAINT patch_approval_history_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id) ON DELETE CASCADE,
	CONSTRAINT patch_approval_history_approval_id_fkey FOREIGN KEY (approval_id) REFERENCES public.patch_approvals(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_approval_history_actor_id ON public.patch_approval_history USING btree (actor_id);
CREATE INDEX idx_patch_approval_history_approval_id ON public.patch_approval_history USING btree (approval_id);
CREATE INDEX idx_patch_approval_history_timestamp ON public.patch_approval_history USING btree ("timestamp" DESC);

-- Permissions

ALTER TABLE public.patch_approval_history OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_approval_history TO rasdashadmin;


-- public.patch_job_logs definition

-- Drop table

-- DROP TABLE public.patch_job_logs;

CREATE TABLE public.patch_job_logs (
	id serial4 NOT NULL,
	job_id int4 NOT NULL,
	target_id int4 NULL,
	"level" varchar(20) DEFAULT 'info'::character varying NOT NULL,
	component varchar(100) DEFAULT 'system'::character varying NULL,
	message text NOT NULL,
	details jsonb DEFAULT '{}'::jsonb NULL,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	CONSTRAINT patch_job_logs_level_check CHECK (((level)::text = ANY ((ARRAY['trace'::character varying, 'debug'::character varying, 'info'::character varying, 'warn'::character varying, 'error'::character varying, 'fatal'::character varying])::text[]))),
	CONSTRAINT patch_job_logs_pkey PRIMARY KEY (id),
	CONSTRAINT patch_job_logs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.patch_jobs(id) ON DELETE CASCADE,
	CONSTRAINT patch_job_logs_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.patch_job_targets(id) ON DELETE CASCADE
);
CREATE INDEX idx_patch_job_logs_job_id ON public.patch_job_logs USING btree (job_id);
CREATE INDEX idx_patch_job_logs_level ON public.patch_job_logs USING btree (level);
CREATE INDEX idx_patch_job_logs_target_id ON public.patch_job_logs USING btree (target_id);
CREATE INDEX idx_patch_job_logs_timestamp ON public.patch_job_logs USING btree ("timestamp" DESC);

-- Permissions

ALTER TABLE public.patch_job_logs OWNER TO rasdashadmin;
GRANT ALL ON TABLE public.patch_job_logs TO rasdashadmin;



-- DROP FUNCTION public.calculate_system_risk_profiles(int4);

CREATE OR REPLACE FUNCTION public.calculate_system_risk_profiles(target_system_id integer DEFAULT NULL::integer)
 RETURNS TABLE(systems_processed integer, high_risk_systems integer, critical_risk_systems integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
    processed_count INTEGER := 0;
    high_risk_count INTEGER := 0;
    critical_risk_count INTEGER := 0;
    system_record RECORD;
    risk_calculation RECORD;
    calculated_risk_score DECIMAL(4,2);
    risk_level_text VARCHAR(20);
    active_risk_model INTEGER;
BEGIN
    -- Get active risk model
    SELECT id INTO active_risk_model
    FROM risk_models
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF active_risk_model IS NULL THEN
        RAISE NOTICE 'No active risk model found. Using default calculations.';
    END IF;
    
    -- Process systems
    FOR system_record IN 
        SELECT s.id, s.name, s.classification_level
        FROM ingestion_systems s
        WHERE (target_system_id IS NULL OR s.id = target_system_id)
    LOOP
        -- Calculate risk factors for this system
        SELECT 
            AVG(iv.cvss_score) as avg_cvss,
            MAX(iv.cvss_score) as max_cvss,
            COUNT(*) FILTER (WHERE iv.severity = 'Critical') as critical_vulns,
            COUNT(*) FILTER (WHERE iv.severity = 'High') as high_vulns,
            COUNT(*) as total_vulns,
            COUNT(DISTINCT ia.uuid) as asset_count
        INTO risk_calculation
        FROM ingestion_vulnerabilities iv
        JOIN ingestion_assets ia ON iv.asset_uuid = ia.uuid
        WHERE ia.system_uuid = (SELECT uuid FROM ingestion_systems WHERE id = system_record.id)
        AND iv.state = 'Open';
        
        -- Calculate overall risk score
        calculated_risk_score := COALESCE(risk_calculation.avg_cvss, 0.0);
        
        -- Apply classification level multiplier
        IF system_record.classification_level = 'TOP SECRET' THEN
            calculated_risk_score := calculated_risk_score * 1.5;
        ELSIF system_record.classification_level = 'SECRET' THEN
            calculated_risk_score := calculated_risk_score * 1.3;
        ELSIF system_record.classification_level = 'CONFIDENTIAL' THEN
            calculated_risk_score := calculated_risk_score * 1.1;
        END IF;
        
        -- Apply vulnerability count impact
        calculated_risk_score := calculated_risk_score + (COALESCE(risk_calculation.critical_vulns, 0) * 0.5);
        calculated_risk_score := calculated_risk_score + (COALESCE(risk_calculation.high_vulns, 0) * 0.2);
        
        -- Cap at 10.0
        calculated_risk_score := LEAST(calculated_risk_score, 10.0);
        
        -- Determine risk level
        IF calculated_risk_score >= 9.0 THEN
            risk_level_text := 'CRITICAL';
            critical_risk_count := critical_risk_count + 1;
        ELSIF calculated_risk_score >= 7.0 THEN
            risk_level_text := 'HIGH';
            high_risk_count := high_risk_count + 1;
        ELSIF calculated_risk_score >= 4.0 THEN
            risk_level_text := 'MEDIUM';
        ELSE
            risk_level_text := 'LOW';
        END IF;
        
        -- Insert or update risk profile
        INSERT INTO system_risk_profiles (
            system_id, risk_model_id, overall_risk_score, risk_level,
            risk_factors, last_assessment_date, next_assessment_due,
            mitigation_priority
        ) VALUES (
            system_record.id, active_risk_model, calculated_risk_score, risk_level_text,
            jsonb_build_object(
                'avg_cvss', risk_calculation.avg_cvss,
                'max_cvss', risk_calculation.max_cvss,
                'critical_vulnerabilities', risk_calculation.critical_vulns,
                'high_vulnerabilities', risk_calculation.high_vulns,
                'total_vulnerabilities', risk_calculation.total_vulns,
                'asset_count', risk_calculation.asset_count,
                'classification_level', system_record.classification_level
            ),
            NOW(),
            NOW() + INTERVAL '30 days',
            CASE 
                WHEN risk_level_text = 'CRITICAL' THEN 1
                WHEN risk_level_text = 'HIGH' THEN 2
                WHEN risk_level_text = 'MEDIUM' THEN 3
                ELSE 4
            END
        )
        ON CONFLICT (system_id) DO UPDATE SET
            overall_risk_score = EXCLUDED.overall_risk_score,
            risk_level = EXCLUDED.risk_level,
            risk_factors = EXCLUDED.risk_factors,
            last_assessment_date = EXCLUDED.last_assessment_date,
            next_assessment_due = EXCLUDED.next_assessment_due,
            mitigation_priority = EXCLUDED.mitigation_priority;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT processed_count, high_risk_count, critical_risk_count;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.calculate_system_risk_profiles(int4) OWNER TO rasdashadmin;
GRANT ALL ON FUNCTION public.calculate_system_risk_profiles(int4) TO rasdashadmin;

-- DROP FUNCTION public.complete_ingestion_batch(uuid, int4, int4, int4, varchar);

CREATE OR REPLACE FUNCTION public.complete_ingestion_batch(p_batch_id uuid, p_total_records integer, p_successful_records integer, p_failed_records integer, p_status character varying DEFAULT 'completed'::character varying)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE ingestion_batches 
    SET 
        total_records = p_total_records,
        successful_records = p_successful_records,
        failed_records = p_failed_records,
        status = p_status,
        completed_at = CURRENT_TIMESTAMP
    WHERE batch_id = p_batch_id;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.complete_ingestion_batch(uuid, int4, int4, int4, varchar) OWNER TO rasdashadmin;
GRANT ALL ON FUNCTION public.complete_ingestion_batch(uuid, int4, int4, int4, varchar) TO rasdashadmin;

-- DROP FUNCTION public.create_ingestion_batch(varchar, varchar, varchar, int4);

CREATE OR REPLACE FUNCTION public.create_ingestion_batch(p_source_system character varying, p_batch_type character varying, p_file_name character varying DEFAULT NULL::character varying, p_created_by integer DEFAULT NULL::integer)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_batch_id UUID;
BEGIN
    INSERT INTO ingestion_batches (
        source_system, batch_type, file_name, created_by
    ) VALUES (
        p_source_system, p_batch_type, p_file_name, p_created_by
    ) RETURNING batch_id INTO v_batch_id;
    
    RETURN v_batch_id;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.create_ingestion_batch(varchar, varchar, varchar, int4) OWNER TO rasdashadmin;
GRANT ALL ON FUNCTION public.create_ingestion_batch(varchar, varchar, varchar, int4) TO rasdashadmin;

-- DROP FUNCTION public.gin_extract_query_trgm(text, internal, int2, internal, internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_query_trgm$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_query_trgm(text, internal, int2, internal, internal, internal, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gin_extract_query_trgm(text, internal, int2, internal, internal, internal, internal) TO rdsadmin;

-- DROP FUNCTION public.gin_extract_value_trgm(text, internal);

CREATE OR REPLACE FUNCTION public.gin_extract_value_trgm(text, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_extract_value_trgm$function$
;

-- Permissions

ALTER FUNCTION public.gin_extract_value_trgm(text, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gin_extract_value_trgm(text, internal) TO rdsadmin;

-- DROP FUNCTION public.gin_trgm_consistent(internal, int2, text, int4, internal, internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_consistent$function$
;

-- Permissions

ALTER FUNCTION public.gin_trgm_consistent(internal, int2, text, int4, internal, internal, internal, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gin_trgm_consistent(internal, int2, text, int4, internal, internal, internal, internal) TO rdsadmin;

-- DROP FUNCTION public.gin_trgm_triconsistent(internal, int2, text, int4, internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal)
 RETURNS "char"
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gin_trgm_triconsistent$function$
;

-- Permissions

ALTER FUNCTION public.gin_trgm_triconsistent(internal, int2, text, int4, internal, internal, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gin_trgm_triconsistent(internal, int2, text, int4, internal, internal, internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_compress(internal);

CREATE OR REPLACE FUNCTION public.gtrgm_compress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_compress$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_compress(internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_compress(internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_consistent(internal, text, int2, oid, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal)
 RETURNS boolean
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_consistent$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_consistent(internal, text, int2, oid, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_consistent(internal, text, int2, oid, internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_decompress(internal);

CREATE OR REPLACE FUNCTION public.gtrgm_decompress(internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_decompress$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_decompress(internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_decompress(internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_distance(internal, text, int2, oid, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal)
 RETURNS double precision
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_distance$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_distance(internal, text, int2, oid, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_distance(internal, text, int2, oid, internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_in(cstring);

CREATE OR REPLACE FUNCTION public.gtrgm_in(cstring)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_in$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_in(cstring) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_in(cstring) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_options(internal);

CREATE OR REPLACE FUNCTION public.gtrgm_options(internal)
 RETURNS void
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE
AS '$libdir/pg_trgm', $function$gtrgm_options$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_options(internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_options(internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_out(gtrgm);

CREATE OR REPLACE FUNCTION public.gtrgm_out(gtrgm)
 RETURNS cstring
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_out$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_out(gtrgm) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_out(gtrgm) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_penalty(internal, internal, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_penalty(internal, internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_penalty$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_penalty(internal, internal, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_penalty(internal, internal, internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_picksplit(internal, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_picksplit(internal, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_picksplit$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_picksplit(internal, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_picksplit(internal, internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal)
 RETURNS internal
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_same$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal) TO rdsadmin;

-- DROP FUNCTION public.gtrgm_union(internal, internal);

CREATE OR REPLACE FUNCTION public.gtrgm_union(internal, internal)
 RETURNS gtrgm
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$gtrgm_union$function$
;

-- Permissions

ALTER FUNCTION public.gtrgm_union(internal, internal) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.gtrgm_union(internal, internal) TO rdsadmin;

-- DROP FUNCTION public.refresh_vulnerability_metrics();

CREATE OR REPLACE FUNCTION public.refresh_vulnerability_metrics()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    metric_record RECORD;
    calculated_value NUMERIC;
BEGIN
    -- Loop through all metrics that have queries
    FOR metric_record IN
        SELECT id, name, query
        FROM public.metrics
        WHERE query IS NOT NULL AND is_active = true
    LOOP
        -- Execute the query and get the result
        EXECUTE metric_record.query INTO calculated_value;

        -- Update the metric value and last_calculated timestamp
        UPDATE public.metrics
        SET
            value = calculated_value,
            last_calculated = NOW(),
            updated_at = NOW()
        WHERE id = metric_record.id;

        RAISE NOTICE 'Updated metric: % = %', metric_record.name, calculated_value;
    END LOOP;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.refresh_vulnerability_metrics() OWNER TO rasdashadmin;
GRANT ALL ON FUNCTION public.refresh_vulnerability_metrics() TO rasdashadmin;

-- DROP FUNCTION public.set_limit(float4);

CREATE OR REPLACE FUNCTION public.set_limit(real)
 RETURNS real
 LANGUAGE c
 STRICT
AS '$libdir/pg_trgm', $function$set_limit$function$
;

-- Permissions

ALTER FUNCTION public.set_limit(float4) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.set_limit(float4) TO rdsadmin;

-- DROP FUNCTION public.show_limit();

CREATE OR REPLACE FUNCTION public.show_limit()
 RETURNS real
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_limit$function$
;

-- Permissions

ALTER FUNCTION public.show_limit() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.show_limit() TO rdsadmin;

-- DROP FUNCTION public.show_trgm(text);

CREATE OR REPLACE FUNCTION public.show_trgm(text)
 RETURNS text[]
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$show_trgm$function$
;

-- Permissions

ALTER FUNCTION public.show_trgm(text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.show_trgm(text) TO rdsadmin;

-- DROP FUNCTION public.similarity(text, text);

CREATE OR REPLACE FUNCTION public.similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity$function$
;

-- Permissions

ALTER FUNCTION public.similarity(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.similarity(text, text) TO rdsadmin;

-- DROP FUNCTION public.similarity_dist(text, text);

CREATE OR REPLACE FUNCTION public.similarity_dist(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_dist$function$
;

-- Permissions

ALTER FUNCTION public.similarity_dist(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.similarity_dist(text, text) TO rdsadmin;

-- DROP FUNCTION public.similarity_op(text, text);

CREATE OR REPLACE FUNCTION public.similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$similarity_op$function$
;

-- Permissions

ALTER FUNCTION public.similarity_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.similarity_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.strict_word_similarity(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.strict_word_similarity(text, text) TO rdsadmin;

-- DROP FUNCTION public.strict_word_similarity_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_commutator_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.strict_word_similarity_commutator_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.strict_word_similarity_dist_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.strict_word_similarity_dist_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_dist_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_dist_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.strict_word_similarity_dist_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.strict_word_similarity_op(text, text);

CREATE OR REPLACE FUNCTION public.strict_word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$strict_word_similarity_op$function$
;

-- Permissions

ALTER FUNCTION public.strict_word_similarity_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.strict_word_similarity_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.update_system_vulnerability_summary(int4);

CREATE OR REPLACE FUNCTION public.update_system_vulnerability_summary(target_system_id integer DEFAULT NULL::integer)
 RETURNS TABLE(systems_updated integer, total_vulnerabilities integer, critical_vulnerabilities integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
    updated_systems INTEGER := 0;
    total_vulns INTEGER := 0;
    critical_vulns INTEGER := 0;
    system_record RECORD;
    vuln_stats RECORD;
BEGIN
    -- Process all systems or specific system
    FOR system_record IN 
        SELECT s.id, s.name
        FROM ingestion_systems s
        WHERE (target_system_id IS NULL OR s.id = target_system_id)
    LOOP
        -- Calculate vulnerability statistics for this system
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE iv.severity = 'Critical') as critical_count,
            COUNT(*) FILTER (WHERE iv.severity = 'High') as high_count,
            COUNT(*) FILTER (WHERE iv.severity = 'Medium') as medium_count,
            COUNT(*) FILTER (WHERE iv.severity = 'Low') as low_count,
            MAX(iv.cvss_score) as highest_score,
            AVG(iv.cvss_score) as average_score,
            MIN(iv.first_found) as oldest_date,
            MAX(iv.first_found) as newest_date
        INTO vuln_stats
        FROM ingestion_vulnerabilities iv
        JOIN ingestion_assets ia ON iv.asset_uuid = ia.uuid
        WHERE ia.system_uuid = (SELECT uuid FROM ingestion_systems WHERE id = system_record.id)
        AND iv.state = 'Open';
        
        -- Update or insert summary
        INSERT INTO system_vulnerability_summary (
            system_id, critical_count, high_count, medium_count, low_count,
            total_count, highest_cvss_score, average_cvss_score,
            oldest_vulnerability_date, newest_vulnerability_date,
            remediation_priority, last_calculated_at, next_calculation_due
        ) VALUES (
            system_record.id,
            COALESCE(vuln_stats.critical_count, 0),
            COALESCE(vuln_stats.high_count, 0),
            COALESCE(vuln_stats.medium_count, 0),
            COALESCE(vuln_stats.low_count, 0),
            COALESCE(vuln_stats.total_count, 0),
            vuln_stats.highest_score,
            vuln_stats.average_score,
            vuln_stats.oldest_date,
            vuln_stats.newest_date,
            CASE 
                WHEN COALESCE(vuln_stats.critical_count, 0) > 0 THEN 1
                WHEN COALESCE(vuln_stats.high_count, 0) > 5 THEN 2
                WHEN COALESCE(vuln_stats.total_count, 0) > 10 THEN 3
                ELSE 4
            END,
            NOW(),
            NOW() + INTERVAL '24 hours'
        )
        ON CONFLICT (system_id) DO UPDATE SET
            critical_count = EXCLUDED.critical_count,
            high_count = EXCLUDED.high_count,
            medium_count = EXCLUDED.medium_count,
            low_count = EXCLUDED.low_count,
            total_count = EXCLUDED.total_count,
            highest_cvss_score = EXCLUDED.highest_cvss_score,
            average_cvss_score = EXCLUDED.average_cvss_score,
            oldest_vulnerability_date = EXCLUDED.oldest_vulnerability_date,
            newest_vulnerability_date = EXCLUDED.newest_vulnerability_date,
            remediation_priority = EXCLUDED.remediation_priority,
            last_calculated_at = EXCLUDED.last_calculated_at,
            next_calculation_due = EXCLUDED.next_calculation_due;
        
        updated_systems := updated_systems + 1;
        total_vulns := total_vulns + COALESCE(vuln_stats.total_count, 0);
        critical_vulns := critical_vulns + COALESCE(vuln_stats.critical_count, 0);
    END LOOP;
    
    RETURN QUERY SELECT updated_systems, total_vulns, critical_vulns;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.update_system_vulnerability_summary(int4) OWNER TO rasdashadmin;
GRANT ALL ON FUNCTION public.update_system_vulnerability_summary(int4) TO rasdashadmin;

-- DROP FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.update_updated_at_column() OWNER TO rasdashadmin;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO rasdashadmin;

-- DROP FUNCTION public.uuid_generate_v1();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v1() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_generate_v1() TO rdsadmin;

-- DROP FUNCTION public.uuid_generate_v1mc();

CREATE OR REPLACE FUNCTION public.uuid_generate_v1mc()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v1mc$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v1mc() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_generate_v1mc() TO rdsadmin;

-- DROP FUNCTION public.uuid_generate_v3(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v3(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v3$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v3(uuid, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_generate_v3(uuid, text) TO rdsadmin;

-- DROP FUNCTION public.uuid_generate_v4();

CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE c
 PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v4$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v4() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_generate_v4() TO rdsadmin;

-- DROP FUNCTION public.uuid_generate_v5(uuid, text);

CREATE OR REPLACE FUNCTION public.uuid_generate_v5(namespace uuid, name text)
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_generate_v5$function$
;

-- Permissions

ALTER FUNCTION public.uuid_generate_v5(uuid, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_generate_v5(uuid, text) TO rdsadmin;

-- DROP FUNCTION public.uuid_nil();

CREATE OR REPLACE FUNCTION public.uuid_nil()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_nil$function$
;

-- Permissions

ALTER FUNCTION public.uuid_nil() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_nil() TO rdsadmin;

-- DROP FUNCTION public.uuid_ns_dns();

CREATE OR REPLACE FUNCTION public.uuid_ns_dns()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_dns$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_dns() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_ns_dns() TO rdsadmin;

-- DROP FUNCTION public.uuid_ns_oid();

CREATE OR REPLACE FUNCTION public.uuid_ns_oid()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_oid$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_oid() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_ns_oid() TO rdsadmin;

-- DROP FUNCTION public.uuid_ns_url();

CREATE OR REPLACE FUNCTION public.uuid_ns_url()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_url$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_url() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_ns_url() TO rdsadmin;

-- DROP FUNCTION public.uuid_ns_x500();

CREATE OR REPLACE FUNCTION public.uuid_ns_x500()
 RETURNS uuid
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/uuid-ossp', $function$uuid_ns_x500$function$
;

-- Permissions

ALTER FUNCTION public.uuid_ns_x500() OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.uuid_ns_x500() TO rdsadmin;

-- DROP FUNCTION public.word_similarity(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.word_similarity(text, text) TO rdsadmin;

-- DROP FUNCTION public.word_similarity_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_commutator_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_commutator_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.word_similarity_commutator_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.word_similarity_dist_commutator_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_dist_commutator_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_commutator_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_dist_commutator_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.word_similarity_dist_commutator_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.word_similarity_dist_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_dist_op(text, text)
 RETURNS real
 LANGUAGE c
 IMMUTABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_dist_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_dist_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.word_similarity_dist_op(text, text) TO rdsadmin;

-- DROP FUNCTION public.word_similarity_op(text, text);

CREATE OR REPLACE FUNCTION public.word_similarity_op(text, text)
 RETURNS boolean
 LANGUAGE c
 STABLE PARALLEL SAFE STRICT
AS '$libdir/pg_trgm', $function$word_similarity_op$function$
;

-- Permissions

ALTER FUNCTION public.word_similarity_op(text, text) OWNER TO rdsadmin;
GRANT ALL ON FUNCTION public.word_similarity_op(text, text) TO rdsadmin;


-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;