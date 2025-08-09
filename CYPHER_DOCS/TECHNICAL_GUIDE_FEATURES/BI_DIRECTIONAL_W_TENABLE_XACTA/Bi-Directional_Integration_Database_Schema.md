# Bi-Directional Integration Database Schema
## Additional Database Tables for Enhanced Platform Capabilities

### Executive Summary
Comprehensive database schema extensions required to support bi-directional integrations with Tenable, Xacta, and advanced analytics capabilities while maintaining data integrity and performance.

---

## Current Schema Analysis

### Existing Tables (Summary)
- **Ingestion Tables**: `ingestion_batches`, `ingestion_systems`, `ingestion_assets`, `ingestion_vulnerabilities`
- **User Management**: `users`, `audit_logs`
- **Compliance**: SSP/ATO schema, STIG schema
- **Analytics**: `metrics` schema
- **Vulnerabilities**: Vulnerability database schema

---

## New Table Categories Required

## 1. External System Integration Tables

### Integration Configuration & Management
```sql
-- External system configurations and credentials
CREATE TABLE external_systems (
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

-- Track integration operations and their status
CREATE TABLE integration_operations (
    id SERIAL PRIMARY KEY,
    operation_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    external_system_id INTEGER REFERENCES external_systems(id),
    operation_type VARCHAR(50) NOT NULL, -- 'sync', 'create', 'update', 'delete'
    entity_type VARCHAR(100) NOT NULL, -- 'asset', 'vulnerability', 'control', 'poam'
    entity_id VARCHAR(255),
    external_entity_id VARCHAR(255),
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'bidirectional'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed', 'retrying'
    request_payload JSONB,
    response_payload JSONB,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    correlation_id UUID,
    parent_operation_id UUID REFERENCES integration_operations(operation_id),
    priority INTEGER DEFAULT 5 -- 1=highest, 10=lowest
);

-- API call logging and monitoring
CREATE TABLE api_call_logs (
    id SERIAL PRIMARY KEY,
    external_system_id INTEGER REFERENCES external_systems(id),
    operation_id UUID REFERENCES integration_operations(operation_id),
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
```

### Data Mapping & Transformation
```sql
-- Field mappings between external systems and internal schema
CREATE TABLE data_field_mappings (
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
CREATE TABLE sync_policies (
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
CREATE TABLE sync_conflicts (
    id SERIAL PRIMARY KEY,
    operation_id UUID REFERENCES integration_operations(operation_id),
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
```

## 2. Enhanced Asset Management Tables

### Advanced Asset Intelligence
```sql
-- Extended asset properties and relationships
CREATE TABLE assets_extended (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID NOT NULL UNIQUE REFERENCES ingestion_assets(asset_uuid),
    business_criticality VARCHAR(50), -- 'critical', 'high', 'medium', 'low'
    business_owner VARCHAR(255),
    technical_owner VARCHAR(255),
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

-- Asset configuration tracking
CREATE TABLE asset_configurations (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid),
    configuration_type VARCHAR(100) NOT NULL, -- 'os', 'software', 'network', 'security'
    configuration_name VARCHAR(255) NOT NULL,
    configuration_value TEXT,
    configuration_hash VARCHAR(255), -- For change detection
    is_compliant BOOLEAN,
    compliance_rule_id INTEGER,
    discovered_at TIMESTAMP DEFAULT NOW(),
    source_system VARCHAR(100),
    source_scan_id VARCHAR(255)
);

-- Asset change tracking
CREATE TABLE asset_changes (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid),
    change_type VARCHAR(100) NOT NULL, -- 'configuration', 'vulnerability', 'compliance', 'risk'
    field_name VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    change_source VARCHAR(100), -- 'scan', 'manual', 'integration', 'automated'
    change_reason TEXT,
    detected_at TIMESTAMP DEFAULT NOW(),
    validated_at TIMESTAMP,
    validated_by INTEGER REFERENCES users(id)
);
```

## 3. Vulnerability Intelligence Tables

### Enhanced Vulnerability Management
```sql
-- Vulnerability intelligence and enrichment
CREATE TABLE vulnerability_intelligence (
    id SERIAL PRIMARY KEY,
    plugin_id VARCHAR(50) NOT NULL,
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
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(plugin_id)
);

-- Vulnerability remediation tracking
CREATE TABLE vulnerability_remediation (
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

-- Vulnerability risk assessments
CREATE TABLE vulnerability_risk_assessments (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id),
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid),
    likelihood_score INTEGER, -- 1-10 scale
    impact_score INTEGER, -- 1-10 scale
    risk_score DECIMAL(4,2), -- Calculated risk score
    threat_level VARCHAR(50),
    asset_exposure VARCHAR(50), -- 'internal', 'dmz', 'external'
    compensating_controls TEXT[],
    risk_acceptance_status VARCHAR(50),
    risk_owner INTEGER REFERENCES users(id),
    assessment_date TIMESTAMP DEFAULT NOW(),
    next_assessment_date DATE,
    assessor INTEGER REFERENCES users(id),
    assessment_notes TEXT
);
```

## 4. Compliance & Controls Enhancement

### Advanced Compliance Management
```sql
-- Enhanced control implementation tracking
CREATE TABLE controls_extended (
    id SERIAL PRIMARY KEY,
    control_id VARCHAR(50) NOT NULL, -- NIST control ID
    framework VARCHAR(50) NOT NULL, -- 'nist_800_53', 'fedramp', 'iso_27001'
    implementation_status VARCHAR(50), -- 'not_implemented', 'partially_implemented', 'implemented'
    assessment_status VARCHAR(50), -- 'not_assessed', 'satisfied', 'other_than_satisfied'
    automation_level VARCHAR(50), -- 'manual', 'semi_automated', 'fully_automated'
    responsible_role VARCHAR(255),
    implementation_guidance TEXT,
    testing_procedures TEXT,
    evidence_required TEXT[],
    last_assessment_date DATE,
    next_assessment_date DATE,
    assessment_frequency_months INTEGER,
    continuous_monitoring BOOLEAN DEFAULT false,
    external_system_mapping JSONB, -- Mapping to Xacta, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(control_id, framework)
);

-- Control evidence management
CREATE TABLE control_evidence (
    id SERIAL PRIMARY KEY,
    control_id INTEGER REFERENCES controls_extended(id),
    evidence_type VARCHAR(100) NOT NULL, -- 'document', 'screenshot', 'log', 'scan_result'
    evidence_title VARCHAR(500) NOT NULL,
    evidence_description TEXT,
    file_path VARCHAR(1000),
    file_hash VARCHAR(255),
    file_size_bytes BIGINT,
    mime_type VARCHAR(100),
    collection_method VARCHAR(100), -- 'manual', 'automated', 'integration'
    collection_frequency VARCHAR(50),
    validity_period_days INTEGER,
    is_current BOOLEAN DEFAULT true,
    collected_by INTEGER REFERENCES users(id),
    collected_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    external_reference VARCHAR(500) -- Reference in external system
);

-- POAM management enhancement
CREATE TABLE poams_extended (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(100) NOT NULL UNIQUE,
    control_id INTEGER REFERENCES controls_extended(id),
    weakness_description TEXT NOT NULL,
    weakness_type VARCHAR(100),
    affected_assets TEXT[],
    business_impact TEXT,
    likelihood VARCHAR(50),
    impact_level VARCHAR(50),
    risk_level VARCHAR(50),
    remediation_plan TEXT,
    milestone_schedule JSONB,
    resource_requirements TEXT,
    cost_estimate DECIMAL(12,2),
    responsible_individual VARCHAR(255),
    scheduled_completion_date DATE,
    actual_completion_date DATE,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'closed'
    deviation_rationale TEXT,
    risk_acceptance_date DATE,
    external_poam_id VARCHAR(255), -- ID in Xacta
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 5. Analytics & Intelligence Tables

### Business Intelligence Infrastructure
```sql
-- Metrics definitions and calculations
CREATE TABLE metrics_definitions (
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
CREATE TABLE metrics_values (
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

-- Predictive analytics models
CREATE TABLE ml_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL UNIQUE,
    model_type VARCHAR(100) NOT NULL, -- 'classification', 'regression', 'clustering', 'anomaly_detection'
    target_variable VARCHAR(255),
    features TEXT[],
    algorithm VARCHAR(100),
    model_parameters JSONB,
    training_data_period INTERVAL,
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    last_trained TIMESTAMP,
    training_frequency INTERVAL,
    model_artifact_path VARCHAR(1000),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Model predictions storage
CREATE TABLE ml_predictions (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES ml_models(id),
    entity_type VARCHAR(100) NOT NULL, -- 'asset', 'vulnerability', 'incident'
    entity_id VARCHAR(255) NOT NULL,
    prediction_value DECIMAL(15,4),
    confidence_score DECIMAL(5,4),
    prediction_metadata JSONB,
    prediction_date TIMESTAMP DEFAULT NOW(),
    actual_value DECIMAL(15,4), -- For model evaluation
    actual_date TIMESTAMP
);
```

## 6. Workflow & Automation Tables

### Process Automation Infrastructure
```sql
-- Workflow definitions
CREATE TABLE workflows (
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
CREATE TABLE workflow_executions (
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

-- Approval workflows
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    approval_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    workflow_execution_id INTEGER REFERENCES workflow_executions(id),
    approval_type VARCHAR(100) NOT NULL, -- 'vulnerability_acceptance', 'remediation_plan', 'poam_closure'
    requested_action TEXT NOT NULL,
    business_justification TEXT,
    risk_assessment TEXT,
    requested_by INTEGER REFERENCES users(id),
    approver_role VARCHAR(100),
    assigned_approver INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'escalated'
    approval_decision TEXT,
    approved_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 7. Advanced Security & Audit Tables

### Enhanced Security Monitoring
```sql
-- Security events enhancement
CREATE TABLE security_events_extended (
    id SERIAL PRIMARY KEY,
    event_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    source_system VARCHAR(100),
    user_id INTEGER REFERENCES users(id),
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid),
    event_details JSONB NOT NULL,
    correlation_id UUID,
    threat_indicators JSONB,
    response_actions JSONB,
    false_positive BOOLEAN DEFAULT false,
    investigated_by INTEGER REFERENCES users(id),
    investigation_notes TEXT,
    occurred_at TIMESTAMP NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Data access tracking
CREATE TABLE data_access_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    action VARCHAR(50) NOT NULL, -- 'read', 'write', 'delete', 'export'
    data_classification VARCHAR(50),
    access_method VARCHAR(50), -- 'ui', 'api', 'export', 'report'
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    purpose VARCHAR(255), -- Business justification
    data_volume_bytes BIGINT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    accessed_at TIMESTAMP DEFAULT NOW()
);

-- Privacy compliance tracking
CREATE TABLE data_subject_requests (
    id SERIAL PRIMARY KEY,
    request_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    request_type VARCHAR(50) NOT NULL, -- 'access', 'rectification', 'erasure', 'portability'
    data_subject_id VARCHAR(255) NOT NULL,
    requestor_email VARCHAR(255),
    verification_method VARCHAR(100),
    request_details TEXT,
    legal_basis VARCHAR(100),
    status VARCHAR(50) DEFAULT 'received', -- 'received', 'verified', 'processing', 'completed', 'rejected'
    due_date DATE,
    processed_by INTEGER REFERENCES users(id),
    response_details TEXT,
    response_files TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

## 8. Performance & Monitoring Tables

### System Performance Tracking
```sql
-- System performance metrics
CREATE TABLE performance_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(100) NOT NULL, -- 'api_response_time', 'database_query_time', 'integration_latency'
    component VARCHAR(100) NOT NULL,
    operation VARCHAR(255),
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    tags JSONB,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Integration health monitoring
CREATE TABLE integration_health (
    id SERIAL PRIMARY KEY,
    external_system_id INTEGER REFERENCES external_systems(id),
    health_check_type VARCHAR(100) NOT NULL, -- 'connectivity', 'authentication', 'data_sync'
    status VARCHAR(50) NOT NULL, -- 'healthy', 'degraded', 'unhealthy'
    response_time_ms INTEGER,
    error_rate DECIMAL(5,4),
    last_successful_operation TIMESTAMP,
    error_details JSONB,
    checked_at TIMESTAMP DEFAULT NOW()
);

-- Alert management
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    alert_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    source_system VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    threshold_value DECIMAL(15,4),
    current_value DECIMAL(15,4),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'suppressed'
    assigned_to INTEGER REFERENCES users(id),
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 9. Advanced Reporting Tables

### Report Management Infrastructure
```sql
-- Report templates
CREATE TABLE report_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL UNIQUE,
    template_type VARCHAR(100) NOT NULL, -- 'executive', 'compliance', 'operational', 'technical'
    audience VARCHAR(100),
    report_format VARCHAR(50), -- 'pdf', 'html', 'excel', 'json'
    template_definition JSONB NOT NULL,
    data_sources TEXT[],
    parameters JSONB,
    schedule_config JSONB,
    distribution_list TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated reports
CREATE TABLE generated_reports (
    id SERIAL PRIMARY KEY,
    report_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    template_id INTEGER REFERENCES report_templates(id),
    report_name VARCHAR(255) NOT NULL,
    parameters_used JSONB,
    data_period_start TIMESTAMP,
    data_period_end TIMESTAMP,
    generation_status VARCHAR(50) DEFAULT 'generating', -- 'generating', 'completed', 'failed'
    file_path VARCHAR(1000),
    file_size_bytes BIGINT,
    generated_by INTEGER REFERENCES users(id),
    generated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- Dashboard configurations
CREATE TABLE dashboards (
    id SERIAL PRIMARY KEY,
    dashboard_name VARCHAR(255) NOT NULL,
    dashboard_type VARCHAR(100), -- 'executive', 'operational', 'technical'
    owner_id INTEGER REFERENCES users(id),
    layout_config JSONB NOT NULL,
    widget_config JSONB NOT NULL,
    refresh_interval_seconds INTEGER DEFAULT 300,
    access_control JSONB,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## Index Recommendations

### Critical Indexes for Performance
```sql
-- Integration operations indexes
CREATE INDEX idx_integration_operations_status ON integration_operations(status, external_system_id);
CREATE INDEX idx_integration_operations_correlation ON integration_operations(correlation_id);
CREATE INDEX idx_integration_operations_entity ON integration_operations(entity_type, entity_id);

-- API call logs indexes
CREATE INDEX idx_api_call_logs_system_time ON api_call_logs(external_system_id, called_at);
CREATE INDEX idx_api_call_logs_operation ON api_call_logs(operation_id);

-- Metrics values indexes
CREATE INDEX idx_metrics_values_metric_time ON metrics_values(metric_id, calculated_at);
CREATE INDEX idx_metrics_values_period ON metrics_values(period_start, period_end);

-- Security events indexes
CREATE INDEX idx_security_events_type_time ON security_events_extended(event_type, occurred_at);
CREATE INDEX idx_security_events_user ON security_events_extended(user_id, occurred_at);
CREATE INDEX idx_security_events_asset ON security_events_extended(asset_uuid, occurred_at);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_component ON performance_metrics(component, metric_type, recorded_at);

-- Vulnerability remediation indexes
CREATE INDEX idx_vuln_remediation_status ON vulnerability_remediation(remediation_status, due_date);
CREATE INDEX idx_vuln_remediation_asset ON vulnerability_remediation(asset_uuid, remediation_status);
```

---

## Migration Strategy

### Phase 1: Core Integration Infrastructure (Month 1)
- External systems configuration
- Integration operations tracking
- API call logging
- Basic sync policies

### Phase 2: Enhanced Asset & Vulnerability Management (Month 2)
- Extended asset properties
- Vulnerability intelligence
- Remediation tracking
- Risk assessments

### Phase 3: Advanced Compliance & Analytics (Month 3)
- Enhanced controls management
- POAM tracking
- Metrics infrastructure
- ML model support

### Phase 4: Workflow & Security Enhancement (Month 4)
- Workflow automation
- Advanced security monitoring
- Privacy compliance
- Performance tracking

---

## Estimated Storage Requirements

### Initial Estimates (1 Year)
- **Integration Tables**: ~50GB (high transaction volume)
- **Analytics Tables**: ~200GB (metrics, predictions, historical data)
- **Audit/Security Tables**: ~100GB (comprehensive logging)
- **Workflow Tables**: ~25GB (process automation)
- **Enhanced Management**: ~75GB (extended asset/vuln data)

**Total Additional Storage**: ~450GB annually

### Retention Policies Recommended
- API call logs: 90 days detailed, 1 year summarized
- Performance metrics: 30 days real-time, 2 years aggregated
- Security events: 7 years (compliance requirement)
- Integration operations: 1 year detailed, 3 years summarized

This comprehensive database schema provides the foundation for transforming RAS DASH into the advanced bi-directional integration platform outlined in the strategic documents.