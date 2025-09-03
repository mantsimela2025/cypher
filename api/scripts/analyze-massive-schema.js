#!/usr/bin/env node

/**
 * Massive Schema Analysis for CYPHER Database
 * 
 * Analyzes all 234+ tables in the database and identifies missing Drizzle schemas
 * 
 * Usage: node scripts/analyze-massive-schema.js
 */

require('dotenv').config();
const { client } = require('../src/db');
const fs = require('fs');
const path = require('path');

// All 234 tables from your Cypher.sql file
const ALL_DATABASE_TABLES = [
  'SequelizeMeta', 'access_requests', 'app_modules', 'artifact_categories', 'artifact_references',
  'artifact_tags', 'artifacts', 'asset_cost_management', 'asset_group_members', 'asset_groups',
  'asset_lifecycle', 'asset_operational_costs', 'asset_risk_mapping', 'asset_vulnerabilities',
  'ato_documents', 'ato_workflow_history', 'audit_logs', 'authorizations_to_operate',
  'backup_jobs', 'batches', 'budget_impact', 'business_impact_costs', 'cloud_assets',
  'cloud_cost_mapping', 'compliance_controls', 'compliance_frameworks', 'control_compliance_status',
  'cost_centers', 'cpe_mappings', 'custom_field_values', 'custom_fields', 'cve_mappings',
  'cves', 'dashboard_metrics', 'dashboard_shares', 'dashboard_themes', 'dashboards',
  'data_conflicts', 'data_contexts', 'data_freshness', 'deployments', 'diagram_node_library',
  'diagram_templates', 'diagrams', 'digital_signatures', 'distribution_group_members',
  'distribution_groups', 'email_logs', 'email_templates', 'enterprise_risk_aggregation',
  'entity_synonyms', 'entity_tags', 'exploits', 'export_jobs', 'generated_reports',
  'import_history', 'import_jobs', 'information_classification_items', 'integrations',
  'license_costs', 'license_types', 'licenses', 'metrics', 'network_diagrams', 'nl_queries',
  'nlq_chat_messages', 'nlq_chat_sessions', 'nlq_data_sources', 'nlq_prompt_config',
  'nlq_query_logs', 'notification_channels', 'notification_deliveries', 'notification_subscriptions',
  'notification_templates', 'openai_usage', 'patches_orphan', 'permissions', 'plan_of_action_milestones',
  'poam_approval_comments', 'poam_signatures', 'policies', 'policy_procedures',
  'policy_workflow_history', 'policy_workflow_policies', 'policy_workflows', 'procedures',
  'query_templates', 'references', 'remediation_cost_entries', 'report_configurations',
  'report_schedules', 'report_templates', 'reports', 'risk_adjustment_factors', 'risk_factors',
  'risk_models', 'risk_score_history', 'role_module_permissions', 'role_navigation_permissions',
  'role_permissions', 'roles', 'saved_filters', 'schedules', 'security_classification_guide',
  'session', 'settings', 'siem_alerts', 'siem_analytics', 'siem_dashboards', 'siem_events',
  'siem_log_sources', 'siem_rules', 'software_assets', 'software_lifecycle', 'ssh_connection_profiles',
  'ssp_controls', 'ssp_poam_mappings', 'stig_checklists', 'stig_collections', 'stig_downloads',
  'stig_library', 'stig_mappings', 'stig_rules', 'system_discovery_scans', 'systems', 'tags',
  'tasks', 'user_dashboards', 'user_preferences', 'user_roles', 'users', 'vendor_map',
  'vulnerability_cost_analysis', 'vulnerability_cost_factors', 'vulnerability_cost_history',
  'vulnerability_cost_models', 'vulnerability_cves', 'vulnerability_databases', 'vulnerability_patches',
  'vulnerability_risk_scores', 'webhook_configurations', 'widget_templates', 'workflows',
  'ai_assistance_requests', 'assets', 'attack_surface_mapping', 'business_impact_analysis',
  'categories', 'conflict_resolutions', 'controls', 'cost_budgets', 'cross_system_correlations',
  'dashboard_widgets', 'data_quality', 'diagram_projects', 'diagram_shared_projects',
  'diagram_versions', 'document_templates', 'errors', 'folders', 'job_executions',
  'module_analytics', 'module_audit_log', 'module_dependencies', 'module_navigation',
  'module_settings', 'nlq_few_shot_examples', 'notifications', 'patch_jobs', 'patch_schedules',
  'poams', 'scan_jobs', 'scan_policies', 'scan_reports', 'scan_results', 'scan_schedules',
  'scan_targets', 'scan_templates', 'siem_incidents', 'siem_threat_intelligence', 'stig_ai_assistance',
  'stig_assessments', 'stig_assets', 'stig_fix_status', 'stig_reviews', 'stig_scan_results',
  'system_assets', 'system_compliance_mapping', 'system_configuration_drift', 'system_discovery_results',
  'system_impact_levels', 'system_security_posture', 'system_threat_modeling', 'user_module_preferences',
  'vulnerabilities', 'vulnerability_poams', 'vulnerability_references', 'webhook_deliveries',
  'webhook_logs', 'webhook_rate_limits', 'webhook_security', 'webhook_subscriptions',
  'workflow_edges', 'workflow_instances', 'workflow_nodes', 'workflow_triggers', 'asset_network',
  'asset_systems', 'asset_tags', 'control_evidence', 'control_findings', 'control_inheritance',
  'control_poams', 'documents', 'patch_job_dependencies', 'patch_schedule_executions', 'patches',
  'poam_assets', 'poam_cves', 'poam_milestones', 'scan_findings', 'stig_asset_assignments',
  'workflow_executions', 'document_analytics', 'document_comments', 'document_favorites',
  'document_shares', 'document_versions', 'patch_approvals', 'patch_job_targets', 'patch_notes',
  'document_changes', 'patch_approval_history', 'patch_job_logs'
];

// Known Drizzle schemas (from your existing codebase)
const EXISTING_DRIZZLE_SCHEMAS = [
  'users', 'roles', 'permissions', 'role_permissions', 'user_roles', 'user_preferences',
  'access_requests', 'email_logs', 'email_templates', 'systems', 'assets', 'vulnerabilities',
  'poams', 'controls', 'cves', 'asset_cost_management', 'asset_groups', 'asset_lifecycle',
  'asset_vulnerabilities', 'artifacts', 'artifact_categories', 'artifact_references', 'artifact_tags'
];

async function analyzeMassiveSchema() {
  try {
    console.log('🔍 CYPHER Database Massive Schema Analysis');
    console.log('==========================================');
    console.log(`📊 Total Database Tables: ${ALL_DATABASE_TABLES.length}`);
    console.log(`📋 Known Drizzle Schemas: ${EXISTING_DRIZZLE_SCHEMAS.length}`);
    
    // Calculate missing schemas
    const missingSchemas = ALL_DATABASE_TABLES.filter(table => 
      !EXISTING_DRIZZLE_SCHEMAS.includes(table)
    );
    
    const coveragePercentage = Math.round((EXISTING_DRIZZLE_SCHEMAS.length / ALL_DATABASE_TABLES.length) * 100);
    
    console.log(`❌ Missing Schemas: ${missingSchemas.length}`);
    console.log(`✅ Coverage: ${coveragePercentage}% (${EXISTING_DRIZZLE_SCHEMAS.length}/${ALL_DATABASE_TABLES.length})\n`);

    // Group missing schemas by category
    const categorizedMissing = categorizeTables(missingSchemas);
    
    console.log('📋 MISSING SCHEMAS BY CATEGORY:');
    console.log('===============================\n');
    
    Object.entries(categorizedMissing).forEach(([category, tables]) => {
      console.log(`🏷️  ${category.toUpperCase()} (${tables.length} tables):`);
      tables.forEach(table => {
        console.log(`   • ${table}`);
      });
      console.log('');
    });

    // Priority recommendations
    console.log('🎯 PRIORITY RECOMMENDATIONS:');
    console.log('============================\n');
    
    const highPriorityTables = [
      'scan_jobs', 'scan_results', 'scan_schedules', 'scan_targets', 'scan_policies',
      'siem_events', 'siem_alerts', 'siem_log_sources', 'siem_rules',
      'ai_assistance_requests', 'notifications', 'audit_logs',
      'patch_jobs', 'patch_schedules', 'patches', 'patch_approvals',
      'stig_assessments', 'stig_reviews', 'stig_scan_results',
      'documents', 'document_versions', 'document_shares'
    ];

    const highPriorityMissing = missingSchemas.filter(table => 
      highPriorityTables.includes(table)
    );

    console.log('🔥 HIGH PRIORITY (Core Functionality):');
    highPriorityMissing.forEach(table => {
      console.log(`   • ${table}`);
    });

    // Generate schema creation plan
    console.log('\n📝 SCHEMA CREATION PLAN:');
    console.log('========================\n');
    
    const phases = {
      'Phase 1 - Security & Scanning': [
        'scan_jobs', 'scan_results', 'scan_schedules', 'scan_targets', 'scan_policies',
        'scan_reports', 'scan_templates', 'scan_findings'
      ],
      'Phase 2 - SIEM & Monitoring': [
        'siem_events', 'siem_alerts', 'siem_log_sources', 'siem_rules', 'siem_incidents',
        'siem_analytics', 'siem_dashboards', 'siem_threat_intelligence'
      ],
      'Phase 3 - AI & Automation': [
        'ai_assistance_requests', 'notifications', 'notification_channels',
        'notification_deliveries', 'notification_subscriptions', 'notification_templates'
      ],
      'Phase 4 - Patch Management': [
        'patch_jobs', 'patch_schedules', 'patches', 'patch_approvals', 'patch_job_targets',
        'patch_notes', 'patch_approval_history', 'patch_job_logs', 'patch_job_dependencies'
      ],
      'Phase 5 - STIG & Compliance': [
        'stig_assessments', 'stig_reviews', 'stig_scan_results', 'stig_assets',
        'stig_asset_assignments', 'stig_ai_assistance', 'stig_fix_status'
      ],
      'Phase 6 - Document Management': [
        'documents', 'document_versions', 'document_shares', 'document_comments',
        'document_favorites', 'document_analytics', 'document_changes', 'document_templates'
      ]
    };

    Object.entries(phases).forEach(([phase, tables]) => {
      const availableTables = tables.filter(table => missingSchemas.includes(table));
      if (availableTables.length > 0) {
        console.log(`${phase} (${availableTables.length} schemas):`);
        availableTables.forEach(table => {
          console.log(`   • ${table}`);
        });
        console.log('');
      }
    });

    // Generate file structure recommendations
    console.log('📁 RECOMMENDED FILE STRUCTURE:');
    console.log('==============================\n');
    
    const fileStructure = {
      'scanner.js': ['scan_jobs', 'scan_results', 'scan_schedules', 'scan_targets', 'scan_policies', 'scan_reports', 'scan_templates', 'scan_findings'],
      'siem.js': ['siem_events', 'siem_alerts', 'siem_log_sources', 'siem_rules', 'siem_incidents', 'siem_analytics', 'siem_dashboards', 'siem_threat_intelligence'],
      'ai-assistance.js': ['ai_assistance_requests'],
      'notifications.js': ['notifications', 'notification_channels', 'notification_deliveries', 'notification_subscriptions', 'notification_templates'],
      'patch-management.js': ['patch_jobs', 'patch_schedules', 'patches', 'patch_approvals', 'patch_job_targets', 'patch_notes', 'patch_approval_history', 'patch_job_logs', 'patch_job_dependencies'],
      'stig-compliance.js': ['stig_assessments', 'stig_reviews', 'stig_scan_results', 'stig_assets', 'stig_asset_assignments', 'stig_ai_assistance', 'stig_fix_status'],
      'document-management.js': ['documents', 'document_versions', 'document_shares', 'document_comments', 'document_favorites', 'document_analytics', 'document_changes', 'document_templates'],
      'audit-logging.js': ['audit_logs', 'module_audit_log'],
      'workflows.js': ['workflows', 'workflow_edges', 'workflow_instances', 'workflow_nodes', 'workflow_triggers', 'workflow_executions'],
      'dashboards.js': ['dashboards', 'dashboard_widgets', 'dashboard_metrics', 'dashboard_shares', 'dashboard_themes', 'user_dashboards'],
      'integrations.js': ['integrations', 'import_jobs', 'import_history', 'export_jobs', 'webhook_configurations', 'webhook_deliveries', 'webhook_logs', 'webhook_rate_limits', 'webhook_security', 'webhook_subscriptions']
    };

    Object.entries(fileStructure).forEach(([filename, tables]) => {
      const availableTables = tables.filter(table => missingSchemas.includes(table));
      if (availableTables.length > 0) {
        console.log(`api/src/db/schema/${filename} (${availableTables.length} schemas):`);
        availableTables.forEach(table => {
          console.log(`   • ${table}`);
        });
        console.log('');
      }
    });

    console.log('🚀 NEXT STEPS:');
    console.log('==============');
    console.log('1. Start with Phase 1 (Security & Scanning) - most critical');
    console.log('2. Use the detailed schema coverage script for specific table analysis');
    console.log('3. Create schema files following the recommended structure');
    console.log('4. Focus on high-priority tables first');
    console.log('5. Test each phase before moving to the next\n');

    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`• You have ${ALL_DATABASE_TABLES.length} total tables`);
    console.log(`• ${EXISTING_DRIZZLE_SCHEMAS.length} have Drizzle schemas (${coveragePercentage}% coverage)`);
    console.log(`• ${missingSchemas.length} tables need schemas`);
    console.log(`• Recommended to implement in 6 phases`);
    console.log(`• Start with ${highPriorityMissing.length} high-priority tables\n`);

    console.log('✅ Analysis complete! This is a massive undertaking but very manageable with phased approach.');

  } catch (error) {
    console.error('❌ Error analyzing schema:', error);
  } finally {
    await client.end();
  }
}

function categorizeTables(tables) {
  const categories = {
    'Security & Scanning': [],
    'SIEM & Monitoring': [],
    'AI & Automation': [],
    'Patch Management': [],
    'STIG & Compliance': [],
    'Document Management': [],
    'Audit & Logging': [],
    'Workflows': [],
    'Dashboards & UI': [],
    'Integrations & APIs': [],
    'System Management': [],
    'Risk & Cost Management': [],
    'Miscellaneous': []
  };

  tables.forEach(table => {
    if (table.includes('scan_') || table.includes('vulnerability_')) {
      categories['Security & Scanning'].push(table);
    } else if (table.includes('siem_')) {
      categories['SIEM & Monitoring'].push(table);
    } else if (table.includes('ai_') || table.includes('nlq_') || table.includes('openai_')) {
      categories['AI & Automation'].push(table);
    } else if (table.includes('patch_')) {
      categories['Patch Management'].push(table);
    } else if (table.includes('stig_')) {
      categories['STIG & Compliance'].push(table);
    } else if (table.includes('document_') || table === 'documents' || table === 'folders') {
      categories['Document Management'].push(table);
    } else if (table.includes('audit_') || table.includes('_log')) {
      categories['Audit & Logging'].push(table);
    } else if (table.includes('workflow_') || table === 'workflows') {
      categories['Workflows'].push(table);
    } else if (table.includes('dashboard_') || table.includes('widget_') || table === 'dashboards') {
      categories['Dashboards & UI'].push(table);
    } else if (table.includes('webhook_') || table.includes('integration') || table.includes('import_') || table.includes('export_')) {
      categories['Integrations & APIs'].push(table);
    } else if (table.includes('system_') || table.includes('asset_') || table.includes('network_')) {
      categories['System Management'].push(table);
    } else if (table.includes('cost_') || table.includes('risk_') || table.includes('budget_')) {
      categories['Risk & Cost Management'].push(table);
    } else {
      categories['Miscellaneous'].push(table);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

// Run the analysis
if (require.main === module) {
  analyzeMassiveSchema();
}

module.exports = { analyzeMassiveSchema, ALL_DATABASE_TABLES, EXISTING_DRIZZLE_SCHEMAS };
