-- ============================================================================
-- Bi-Directional Integration Database Migration
-- Phase 1: Extend Existing Tables + Add Critical New Tables
-- ============================================================================

-- Phase 1A: Extend existing ingestion tables for bi-directional sync
-- ============================================================================

-- Extend ingestion_assets for external system correlation
ALTER TABLE ingestion_assets ADD COLUMN IF NOT EXISTS tenable_asset_uuid VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN IF NOT EXISTS xacta_component_id VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN IF NOT EXISTS external_system_mappings JSONB;
ALTER TABLE ingestion_assets ADD COLUMN IF NOT EXISTS business_owner VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN IF NOT EXISTS technical_owner VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE ingestion_assets ADD COLUMN IF NOT EXISTS last_sync_time TIMESTAMP;

-- Extend ingestion_vulnerabilities for remediation tracking
ALTER TABLE ingestion_vulnerabilities ADD COLUMN IF NOT EXISTS tenable_vuln_id VARCHAR(255);
ALTER TABLE ingestion_vulnerabilities ADD COLUMN IF NOT EXISTS external_references JSONB;
ALTER TABLE ingestion_vulnerabilities ADD COLUMN IF NOT EXISTS remediation_status VARCHAR(50);
ALTER TABLE ingestion_vulnerabilities ADD COLUMN IF NOT EXISTS remediation_assigned_to INTEGER REFERENCES users(id);
ALTER TABLE ingestion_vulnerabilities ADD COLUMN IF NOT EXISTS remediation_due_date DATE;
ALTER TABLE ingestion_vulnerabilities ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE ingestion_vulnerabilities ADD COLUMN IF NOT EXISTS last_tenable_update TIMESTAMP;

-- Extend ingestion_systems for external system tracking
ALTER TABLE ingestion_systems ADD COLUMN IF NOT EXISTS xacta_system_id VARCHAR(255);
ALTER TABLE ingestion_systems ADD COLUMN IF NOT EXISTS tenable_asset_group_id VARCHAR(255);
ALTER TABLE ingestion_systems ADD COLUMN IF NOT EXISTS external_system_mappings JSONB;
ALTER TABLE ingestion_systems ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE ingestion_systems ADD COLUMN IF NOT EXISTS last_xacta_sync TIMESTAMP;

-- Extend ingestion_controls for assessment tracking
ALTER TABLE ingestion_controls ADD COLUMN IF NOT EXISTS xacta_control_id VARCHAR(255);
ALTER TABLE ingestion_controls ADD COLUMN IF NOT EXISTS assessment_frequency_months INTEGER;
ALTER TABLE ingestion_controls ADD COLUMN IF NOT EXISTS next_assessment_date DATE;
ALTER TABLE ingestion_controls ADD COLUMN IF NOT EXISTS evidence_required TEXT[];
ALTER TABLE ingestion_controls ADD COLUMN IF NOT EXISTS automation_level VARCHAR(50);
ALTER TABLE ingestion_controls ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'synced';

-- Extend ingestion_poams for workflow tracking
ALTER TABLE ingestion_poams ADD COLUMN IF NOT EXISTS xacta_poam_id VARCHAR(255);
ALTER TABLE ingestion_poams ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50);
ALTER TABLE ingestion_poams ADD COLUMN IF NOT EXISTS milestone_schedule JSONB;
ALTER TABLE ingestion_poams ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
ALTER TABLE ingestion_poams ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'synced';

-- Extend ingestion_batches for integration operation tracking
ALTER TABLE ingestion_batches ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);
ALTER TABLE ingestion_batches ADD COLUMN IF NOT EXISTS external_system VARCHAR(50);
ALTER TABLE ingestion_batches ADD COLUMN IF NOT EXISTS parent_operation_id UUID REFERENCES ingestion_batches(batch_id);
ALTER TABLE ingestion_batches ADD COLUMN IF NOT EXISTS correlation_id UUID;
ALTER TABLE ingestion_batches ADD COLUMN IF NOT EXISTS api_endpoint VARCHAR(500);
ALTER TABLE ingestion_batches ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Phase 1B: Create critical new tables for bi-directional integration
-- ============================================================================

-- External system configuration and management
CREATE TABLE IF NOT EXISTS external_systems (
    id SERIAL PRIMARY KEY,
    system_name VARCHAR(100) NOT NULL UNIQUE,
    system_type VARCHAR(50) NOT NULL, -- 'tenable', 'xacta', 'qualys', etc.
    api_base_url VARCHAR(500) NOT NULL,
    api_version VARCHAR(20),
    authentication_method VARCHAR(50) NOT NULL, -- 'api_key', 'oauth2', 'certificate'
    connection_config JSONB NOT NULL, -- API keys, certificates, etc.
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 60,
    last_sync_time TIMESTAMP,
    last_sync_status VARCHAR(50),
    rate_limit_config JSONB,
    retry_config JSONB,
    webhook_config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

-- API call logging and monitoring
CREATE TABLE IF NOT EXISTS api_call_logs (
    id SERIAL PRIMARY KEY,
    external_system_id INTEGER REFERENCES external_systems(id),
    operation_id UUID REFERENCES ingestion_batches(batch_id),
    method VARCHAR(10) NOT NULL, -- GET, POST, PUT, DELETE
    endpoint VARCHAR(500) NOT NULL,
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body JSONB,
    response_time_ms INTEGER,
    error_message TEXT,
    called_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Field mappings between external systems and internal schema
CREATE TABLE IF NOT EXISTS data_field_mappings (
    id SERIAL PRIMARY KEY,
    external_system_id INTEGER REFERENCES external_systems(id),
    entity_type VARCHAR(100) NOT NULL, -- 'asset', 'vulnerability', etc.
    external_field_name VARCHAR(255) NOT NULL,
    internal_field_name VARCHAR(255) NOT NULL,
    transformation_rule JSONB, -- Transformation logic for data conversion
    validation_rules JSONB, -- Validation criteria
    is_required BOOLEAN DEFAULT false,
    default_value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(external_system_id, entity_type, external_field_name)
);

-- Data synchronization rules and policies
CREATE TABLE IF NOT EXISTS sync_policies (
    id SERIAL PRIMARY KEY,
    external_system_id INTEGER REFERENCES external_systems(id),
    entity_type VARCHAR(100) NOT NULL,
    sync_direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'bidirectional'
    conflict_resolution_strategy VARCHAR(50) NOT NULL, -- 'external_wins', 'internal_wins', 'manual', 'newest_wins'
    field_level_policies JSONB, -- Per-field sync rules
    filters JSONB, -- Conditions for which records to sync
    batch_size INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Track data synchronization conflicts
CREATE TABLE IF NOT EXISTS sync_conflicts (
    id SERIAL PRIMARY KEY,
    operation_id UUID REFERENCES ingestion_batches(batch_id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    external_entity_id VARCHAR(255),
    conflict_type VARCHAR(50) NOT NULL, -- 'field_mismatch', 'missing_record', 'duplicate', 'validation_error'
    field_name VARCHAR(255),
    internal_value JSONB,
    external_value JSONB,
    resolution_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
    resolution_action VARCHAR(100),
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    auto_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced asset properties and relationships
CREATE TABLE IF NOT EXISTS assets_extended (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID NOT NULL UNIQUE REFERENCES ingestion_assets(asset_uuid),
    business_criticality VARCHAR(50), -- 'critical', 'high', 'medium', 'low'
    cost_center VARCHAR(100),
    environment VARCHAR(50), -- 'production', 'staging', 'development', 'test'
    compliance_scope TEXT[], -- Array of compliance frameworks
    data_classification VARCHAR(50), -- 'public', 'internal', 'confidential', 'restricted'
    geographic_location VARCHAR(255),
    network_zone VARCHAR(100),
    asset_tags JSONB, -- Flexible tagging system
    dependencies JSONB, -- Asset dependencies
    sla_requirements JSONB,
    maintenance_window JSONB,
    risk_score DECIMAL(5,2),
    risk_factors JSONB,
    last_risk_assessment TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vulnerability intelligence and enrichment
CREATE TABLE IF NOT EXISTS vulnerability_intelligence (
    id SERIAL PRIMARY KEY,
    plugin_id VARCHAR(50) NOT NULL UNIQUE,
    cve_ids TEXT[], -- Array of CVE identifiers
    vulnerability_type VARCHAR(100),
    attack_vector VARCHAR(50), -- 'network', 'adjacent', 'local', 'physical'
    attack_complexity VARCHAR(50), -- 'low', 'high'
    privileges_required VARCHAR(50), -- 'none', 'low', 'high'
    user_interaction VARCHAR(50), -- 'none', 'required'
    exploitability_score DECIMAL(3,1),
    exploit_available BOOLEAN DEFAULT false,
    exploit_maturity VARCHAR(50), -- 'unproven', 'proof_of_concept', 'functional', 'high'
    threat_intelligence JSONB, -- External threat intel data
    business_impact_score DECIMAL(3,1),
    remediation_complexity VARCHAR(50), -- 'low', 'medium', 'high'
    patch_available BOOLEAN DEFAULT false,
    patch_release_date DATE,
    vendor_advisory_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vulnerability remediation tracking
CREATE TABLE IF NOT EXISTS vulnerability_remediation (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id),
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid),
    remediation_status VARCHAR(50) NOT NULL, -- 'open', 'in_progress', 'remediated', 'mitigated', 'accepted', 'false_positive'
    remediation_method VARCHAR(100), -- 'patch', 'configuration', 'workaround', 'compensating_control'
    assigned_to INTEGER REFERENCES users(id),
    due_date DATE,
    priority_score INTEGER,
    business_justification TEXT,
    remediation_plan TEXT,
    remediation_steps JSONB,
    validation_required BOOLEAN DEFAULT true,
    validation_status VARCHAR(50),
    validated_by INTEGER REFERENCES users(id),
    validated_at TIMESTAMP,
    cost_estimate DECIMAL(10,2),
    effort_estimate_hours INTEGER,
    downtime_required_hours INTEGER,
    external_system_status JSONB, -- Status in Tenable, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Metrics definitions and calculations
CREATE TABLE IF NOT EXISTS metrics_definitions (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL UNIQUE,
    metric_category VARCHAR(100) NOT NULL, -- 'security', 'compliance', 'operations', 'business'
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    calculation_method TEXT NOT NULL,
    sql_query TEXT,
    data_sources TEXT[],
    aggregation_level VARCHAR(50), -- 'real_time', 'hourly', 'daily', 'weekly', 'monthly'
    target_value DECIMAL(15,4),
    threshold_warning DECIMAL(15,4),
    threshold_critical DECIMAL(15,4),
    unit_of_measure VARCHAR(50),
    chart_type VARCHAR(50),
    is_kpi BOOLEAN DEFAULT false,
    audience VARCHAR(100), -- 'executive', 'operational', 'technical'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Calculated metrics storage
CREATE TABLE IF NOT EXISTS metrics_values (
    id SERIAL PRIMARY KEY,
    metric_id INTEGER REFERENCES metrics_definitions(id),
    calculated_at TIMESTAMP NOT NULL,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    value DECIMAL(15,4) NOT NULL,
    value_text TEXT, -- For non-numeric metrics
    additional_data JSONB,
    data_quality_score DECIMAL(3,2), -- 0.00 to 1.00
    calculation_duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workflow definitions
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    workflow_name VARCHAR(255) NOT NULL UNIQUE,
    workflow_type VARCHAR(100) NOT NULL, -- 'remediation', 'compliance', 'incident_response', 'assessment'
    trigger_conditions JSONB NOT NULL,
    workflow_steps JSONB NOT NULL,
    approval_required BOOLEAN DEFAULT false,
    approval_roles TEXT[],
    timeout_minutes INTEGER,
    retry_policy JSONB,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow executions
CREATE TABLE IF NOT EXISTS workflow_executions (
    id SERIAL PRIMARY KEY,
    execution_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    workflow_id INTEGER REFERENCES workflows(id),
    trigger_entity_type VARCHAR(100),
    trigger_entity_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
    current_step INTEGER DEFAULT 1,
    step_outputs JSONB,
    error_details JSONB,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    started_by INTEGER REFERENCES users(id)
);

-- Phase 1C: Create indexes for performance
-- ============================================================================

-- Indexes for extended columns
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_tenable_uuid ON ingestion_assets(tenable_asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_sync_status ON ingestion_assets(sync_status, last_sync_time);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_tenable_id ON ingestion_vulnerabilities(tenable_vuln_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_remediation ON ingestion_vulnerabilities(remediation_status, remediation_due_date);
CREATE INDEX IF NOT EXISTS idx_ingestion_systems_xacta_id ON ingestion_systems(xacta_system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_controls_xacta_id ON ingestion_controls(xacta_control_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_poams_xacta_id ON ingestion_poams(xacta_poam_id);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_external_systems_type ON external_systems(system_type, is_active);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_system_time ON api_call_logs(external_system_id, called_at);
CREATE INDEX IF NOT EXISTS idx_api_call_logs_operation ON api_call_logs(operation_id);
CREATE INDEX IF NOT EXISTS idx_data_field_mappings_system_entity ON data_field_mappings(external_system_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_entity ON sync_conflicts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON sync_conflicts(resolution_status, created_at);
CREATE INDEX IF NOT EXISTS idx_assets_extended_criticality ON assets_extended(business_criticality);
CREATE INDEX IF NOT EXISTS idx_vulnerability_intelligence_plugin ON vulnerability_intelligence(plugin_id);
CREATE INDEX IF NOT EXISTS idx_vulnerability_remediation_status ON vulnerability_remediation(remediation_status, due_date);
CREATE INDEX IF NOT EXISTS idx_vulnerability_remediation_asset ON vulnerability_remediation(asset_uuid, remediation_status);
CREATE INDEX IF NOT EXISTS idx_metrics_values_metric_time ON metrics_values(metric_id, calculated_at);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status, started_at);

-- Phase 1D: Insert initial configuration data
-- ============================================================================

-- Insert default external systems configurations (placeholders)
INSERT INTO external_systems (system_name, system_type, api_base_url, authentication_method, connection_config, sync_enabled) 
VALUES 
('Tenable.io', 'tenable', 'https://cloud.tenable.com', 'api_key', '{"access_key": "", "secret_key": ""}', false),
('Xacta 360', 'xacta', 'https://xacta.example.com', 'database', '{"connection_string": "", "username": "", "password": ""}', false)
ON CONFLICT (system_name) DO NOTHING;

-- Insert basic data field mappings for common entities
INSERT INTO data_field_mappings (external_system_id, entity_type, external_field_name, internal_field_name, is_required)
SELECT 
    es.id,
    'asset',
    'uuid',
    'asset_uuid',
    true
FROM external_systems es WHERE es.system_name = 'Tenable.io'
ON CONFLICT (external_system_id, entity_type, external_field_name) DO NOTHING;

-- Insert default sync policies
INSERT INTO sync_policies (external_system_id, entity_type, sync_direction, conflict_resolution_strategy, batch_size)
SELECT 
    es.id,
    'asset',
    'bidirectional',
    'newest_wins',
    100
FROM external_systems es WHERE es.system_name = 'Tenable.io'
ON CONFLICT DO NOTHING;

-- Insert basic metrics definitions
INSERT INTO metrics_definitions (metric_name, metric_category, display_name, description, calculation_method, aggregation_level, unit_of_measure, is_kpi, audience)
VALUES 
('total_assets', 'operations', 'Total Assets', 'Total number of managed assets', 'COUNT(*) FROM ingestion_assets', 'real_time', 'count', true, 'executive'),
('critical_vulnerabilities', 'security', 'Critical Vulnerabilities', 'Number of critical severity vulnerabilities', 'COUNT(*) FROM ingestion_vulnerabilities WHERE severity = ''Critical''', 'real_time', 'count', true, 'executive'),
('open_poams', 'compliance', 'Open POAMs', 'Number of open Plan of Action and Milestones', 'COUNT(*) FROM ingestion_poams WHERE status = ''Open''', 'daily', 'count', true, 'operational'),
('remediation_efficiency', 'operations', 'Remediation Efficiency', 'Percentage of vulnerabilities remediated within SLA', 'Complex calculation with time analysis', 'weekly', 'percentage', true, 'operational')
ON CONFLICT (metric_name) DO NOTHING;

-- Insert sample workflow definitions
INSERT INTO workflows (workflow_name, workflow_type, trigger_conditions, workflow_steps, approval_required)
VALUES 
('Critical Vulnerability Response', 'remediation', 
 '{"conditions": [{"field": "severity", "operator": "eq", "value": "Critical"}]}',
 '{"steps": [{"action": "notify_team", "timeout": 15}, {"action": "assign_remediation", "timeout": 60}, {"action": "track_progress", "timeout": 1440}]}',
 false),
('POAM Closure Workflow', 'compliance',
 '{"conditions": [{"field": "remediation_status", "operator": "eq", "value": "remediated"}]}',
 '{"steps": [{"action": "validate_remediation", "timeout": 240}, {"action": "update_xacta", "timeout": 30}, {"action": "close_poam", "timeout": 60}]}',
 true)
ON CONFLICT (workflow_name) DO NOTHING;

-- Phase 1E: Create views for enhanced reporting
-- ============================================================================

-- Enhanced asset view with external system correlations
CREATE OR REPLACE VIEW vw_assets_enhanced AS
SELECT 
    ia.asset_uuid,
    ia.hostname,
    ia.system_id,
    ia.exposure_score,
    ia.acr_score,
    ia.criticality_rating,
    ia.tenable_asset_uuid,
    ia.sync_status,
    ia.last_sync_time,
    ae.business_criticality,
    ae.environment,
    ae.network_zone,
    ae.risk_score,
    sys.name as system_name,
    sys.system_owner
FROM ingestion_assets ia
LEFT JOIN assets_extended ae ON ia.asset_uuid = ae.asset_uuid
LEFT JOIN ingestion_systems sys ON ia.system_id = sys.system_id;

-- Enhanced vulnerability view with remediation tracking
CREATE OR REPLACE VIEW vw_vulnerabilities_enhanced AS
SELECT 
    iv.id,
    iv.plugin_id,
    iv.vulnerability_name,
    iv.severity,
    iv.cvss_score,
    iv.state,
    iv.asset_uuid,
    iv.remediation_status,
    iv.remediation_assigned_to,
    iv.remediation_due_date,
    iv.sync_status,
    vi.exploit_available,
    vi.patch_available,
    vi.business_impact_score,
    vr.validation_status,
    vr.effort_estimate_hours
FROM ingestion_vulnerabilities iv
LEFT JOIN vulnerability_intelligence vi ON iv.plugin_id = vi.plugin_id
LEFT JOIN vulnerability_remediation vr ON iv.id = vr.vulnerability_id;

-- External system sync status view
CREATE OR REPLACE VIEW vw_sync_status_dashboard AS
SELECT 
    es.system_name,
    es.system_type,
    es.sync_enabled,
    es.last_sync_time,
    es.last_sync_status,
    COUNT(CASE WHEN sc.resolution_status = 'pending' THEN 1 END) as pending_conflicts,
    COUNT(acl.id) as api_calls_today
FROM external_systems es
LEFT JOIN sync_conflicts sc ON sc.created_at >= CURRENT_DATE
LEFT JOIN api_call_logs acl ON es.id = acl.external_system_id AND acl.called_at >= CURRENT_DATE
GROUP BY es.id, es.system_name, es.system_type, es.sync_enabled, es.last_sync_time, es.last_sync_status;

COMMIT;

-- Migration complete - Phase 1 database extensions ready for bi-directional integration