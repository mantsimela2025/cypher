# Database Schema Changes for Bi-Directional Integration
## Complete Documentation of Schema Extensions and New Tables

### Executive Summary
Documentation of all database schema modifications implemented for bi-directional integration with Tenable and Xacta platforms. This includes extensions to existing `ingestion_` tables and 12 new tables to support external system integration, analytics, and workflow automation.

---

## Phase 1: Extended Existing Tables

### 1. ingestion_assets Extensions
**Purpose**: Enable asset correlation with external systems and track synchronization status

```sql
-- New columns added to ingestion_assets
ALTER TABLE ingestion_assets ADD COLUMN tenable_asset_uuid VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN xacta_component_id VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN external_system_mappings JSONB;
ALTER TABLE ingestion_assets ADD COLUMN business_owner VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN technical_owner VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN sync_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE ingestion_assets ADD COLUMN last_sync_time TIMESTAMP;
```

**Usage Examples**:
- `tenable_asset_uuid`: Maps to Tenable.io asset UUID for API correlation
- `external_system_mappings`: JSON object storing multiple external system IDs
- `sync_status`: Values: 'synced', 'pending', 'error', 'conflict'

### 2. ingestion_vulnerabilities Extensions
**Purpose**: Track remediation workflow and external system synchronization

```sql
-- New columns added to ingestion_vulnerabilities
ALTER TABLE ingestion_vulnerabilities ADD COLUMN tenable_vuln_id VARCHAR(255);
ALTER TABLE ingestion_vulnerabilities ADD COLUMN external_references JSONB;
ALTER TABLE ingestion_vulnerabilities ADD COLUMN remediation_status VARCHAR(50);
ALTER TABLE ingestion_vulnerabilities ADD COLUMN remediation_assigned_to INTEGER REFERENCES users(id);
ALTER TABLE ingestion_vulnerabilities ADD COLUMN remediation_due_date DATE;
ALTER TABLE ingestion_vulnerabilities ADD COLUMN sync_status VARCHAR(50) DEFAULT 'synced';
ALTER TABLE ingestion_vulnerabilities ADD COLUMN last_tenable_update TIMESTAMP;
```

**Usage Examples**:
- `external_references`: JSON containing CVE IDs, vendor advisories, patch links
- `remediation_status`: Values: 'open', 'in_progress', 'remediated', 'mitigated', 'accepted', 'false_positive'
- `remediation_assigned_to`: Links to users table for responsibility tracking

### 3. ingestion_systems Extensions
**Purpose**: Link systems to external platform identifiers and enable selective synchronization

```sql
-- New columns added to ingestion_systems
ALTER TABLE ingestion_systems ADD COLUMN xacta_system_id VARCHAR(255);
ALTER TABLE ingestion_systems ADD COLUMN tenable_asset_group_id VARCHAR(255);
ALTER TABLE ingestion_systems ADD COLUMN external_system_mappings JSONB;
ALTER TABLE ingestion_systems ADD COLUMN sync_enabled BOOLEAN DEFAULT true;
ALTER TABLE ingestion_systems ADD COLUMN last_xacta_sync TIMESTAMP;
```

**Usage Examples**:
- `xacta_system_id`: Direct correlation to Xacta system records
- `tenable_asset_group_id`: Maps to Tenable asset group for bulk operations
- `sync_enabled`: Boolean flag to control system-level synchronization

### 4. ingestion_controls Extensions
**Purpose**: Enhanced control assessment tracking and Xacta correlation

```sql
-- New columns added to ingestion_controls
ALTER TABLE ingestion_controls ADD COLUMN xacta_control_id VARCHAR(255);
ALTER TABLE ingestion_controls ADD COLUMN assessment_frequency_months INTEGER;
ALTER TABLE ingestion_controls ADD COLUMN next_assessment_date DATE;
ALTER TABLE ingestion_controls ADD COLUMN evidence_required TEXT[];
ALTER TABLE ingestion_controls ADD COLUMN automation_level VARCHAR(50);
ALTER TABLE ingestion_controls ADD COLUMN sync_status VARCHAR(50) DEFAULT 'synced';
```

**Usage Examples**:
- `evidence_required`: Array of evidence types: ['documentation', 'scan_results', 'screenshots']
- `automation_level`: Values: 'manual', 'semi_automated', 'fully_automated'
- `assessment_frequency_months`: Automated scheduling for control assessments

### 5. ingestion_poams Extensions
**Purpose**: Enhanced POAM workflow management and Xacta synchronization

```sql
-- New columns added to ingestion_poams
ALTER TABLE ingestion_poams ADD COLUMN xacta_poam_id VARCHAR(255);
ALTER TABLE ingestion_poams ADD COLUMN workflow_status VARCHAR(50);
ALTER TABLE ingestion_poams ADD COLUMN milestone_schedule JSONB;
ALTER TABLE ingestion_poams ADD COLUMN approval_status VARCHAR(50);
ALTER TABLE ingestion_poams ADD COLUMN sync_status VARCHAR(50) DEFAULT 'synced';
```

**Usage Examples**:
- `milestone_schedule`: JSON array of milestone objects with dates and descriptions
- `workflow_status`: Values: 'draft', 'submitted', 'approved', 'in_progress', 'completed'
- `approval_status`: Values: 'pending', 'approved', 'rejected', 'escalated'

### 6. ingestion_batches Extensions
**Purpose**: Track all integration operations and API calls

```sql
-- New columns added to ingestion_batches
ALTER TABLE ingestion_batches ADD COLUMN operation_type VARCHAR(50);
ALTER TABLE ingestion_batches ADD COLUMN external_system VARCHAR(50);
ALTER TABLE ingestion_batches ADD COLUMN parent_operation_id UUID REFERENCES ingestion_batches(batch_id);
ALTER TABLE ingestion_batches ADD COLUMN correlation_id UUID;
ALTER TABLE ingestion_batches ADD COLUMN api_endpoint VARCHAR(500);
ALTER TABLE ingestion_batches ADD COLUMN retry_count INTEGER DEFAULT 0;
```

**Usage Examples**:
- `operation_type`: Values: 'sync', 'export', 'import', 'update', 'webhook'
- `external_system`: Values: 'tenable', 'xacta', 'internal'
- `correlation_id`: Links related operations across different systems

---

## Phase 2: New Tables for External System Integration

### 1. external_systems
**Purpose**: Central configuration for all external system integrations

```sql
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
```

**Sample Data**:
```json
{
  "system_name": "Tenable.io Production",
  "connection_config": {
    "access_key": "encrypted_key",
    "secret_key": "encrypted_secret"
  },
  "rate_limit_config": {
    "requests_per_minute": 200,
    "burst_capacity": 50
  }
}
```

### 2. api_call_logs
**Purpose**: Comprehensive logging of all external API interactions

```sql
CREATE TABLE api_call_logs (
    id SERIAL PRIMARY KEY,
    external_system_id INTEGER REFERENCES external_systems(id),
    operation_id UUID,
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

**Usage**: Debugging, performance monitoring, audit trails, rate limit tracking

### 3. data_field_mappings
**Purpose**: Define how external system fields map to internal schema

```sql
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
```

**Sample Mapping**:
```json
{
  "external_field_name": "ipv4s",
  "internal_field_name": "ip_addresses",
  "transformation_rule": {
    "type": "array_to_string",
    "separator": ","
  }
}
```

### 4. sync_policies
**Purpose**: Define synchronization rules and conflict resolution strategies

```sql
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
```

### 5. sync_conflicts
**Purpose**: Track and manage data synchronization conflicts

```sql
CREATE TABLE sync_conflicts (
    id SERIAL PRIMARY KEY,
    operation_id UUID,
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

---

## Phase 3: Enhanced Business Context Tables

### 6. assets_extended
**Purpose**: Additional business context for assets not in core ingestion table

```sql
CREATE TABLE assets_extended (
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
```

### 7. vulnerability_intelligence
**Purpose**: Enhanced vulnerability data from threat intelligence sources

```sql
CREATE TABLE vulnerability_intelligence (
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
```

### 8. vulnerability_remediation
**Purpose**: Comprehensive vulnerability remediation workflow tracking

```sql
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
```

---

## Phase 4: Analytics and Metrics Infrastructure

### 9. metrics_definitions
**Purpose**: Define business and technical metrics for dashboard and reporting

```sql
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
```

### 10. metrics_values
**Purpose**: Store calculated metric values for historical analysis and trending

```sql
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
```

---

## Phase 5: Workflow Automation Infrastructure

### 11. workflows
**Purpose**: Define automated workflow processes for remediation, compliance, and integration

```sql
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
```

**Sample Workflow**:
```json
{
  "workflow_name": "Critical Vulnerability Response",
  "trigger_conditions": {
    "conditions": [
      {"field": "severity_name", "operator": "eq", "value": "Critical"}
    ]
  },
  "workflow_steps": {
    "steps": [
      {"action": "notify_team", "timeout": 15},
      {"action": "assign_remediation", "timeout": 60},
      {"action": "track_progress", "timeout": 1440}
    ]
  }
}
```

### 12. workflow_executions
**Purpose**: Track individual workflow execution instances and their progress

```sql
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
```

---

## Database Views for Enhanced Reporting

### 1. vw_assets_enhanced
**Purpose**: Comprehensive asset view combining core data with business context

```sql
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
    ia.business_owner,
    ia.technical_owner,
    ae.business_criticality,
    ae.environment,
    ae.network_zone,
    ae.risk_score,
    sys.name as system_name,
    sys.system_owner,
    COUNT(DISTINCT iv.id) as vulnerability_count,
    COUNT(DISTINCT CASE WHEN iv.severity_name = 'Critical' THEN iv.id END) as critical_vulnerabilities,
    COUNT(DISTINCT CASE WHEN iv.severity_name = 'High' THEN iv.id END) as high_vulnerabilities
FROM ingestion_assets ia
LEFT JOIN assets_extended ae ON ia.asset_uuid = ae.asset_uuid
LEFT JOIN ingestion_systems sys ON ia.system_id = sys.system_id
LEFT JOIN ingestion_vulnerabilities iv ON ia.asset_uuid = iv.asset_uuid
GROUP BY ia.asset_uuid, [... all other fields];
```

### 2. vw_vulnerabilities_enhanced
**Purpose**: Enhanced vulnerability view with remediation and intelligence data

```sql
CREATE OR REPLACE VIEW vw_vulnerabilities_enhanced AS
SELECT 
    iv.id,
    iv.plugin_id,
    iv.plugin_name,
    iv.severity,
    iv.severity_name,
    iv.cvss_base_score,
    iv.cvss3_base_score,
    iv.state,
    iv.asset_uuid,
    iv.remediation_status,
    iv.remediation_assigned_to,
    iv.remediation_due_date,
    iv.sync_status,
    iv.tenable_vuln_id,
    vi.exploit_available,
    vi.patch_available,
    vi.business_impact_score,
    vr.validation_status,
    vr.effort_estimate_hours,
    vr.cost_estimate,
    u.username as assigned_to_username
FROM ingestion_vulnerabilities iv
LEFT JOIN vulnerability_intelligence vi ON iv.plugin_id::text = vi.plugin_id
LEFT JOIN vulnerability_remediation vr ON iv.id = vr.vulnerability_id
LEFT JOIN users u ON iv.remediation_assigned_to = u.id;
```

### 3. vw_sync_status_dashboard
**Purpose**: Real-time monitoring of external system integration health

```sql
CREATE OR REPLACE VIEW vw_sync_status_dashboard AS
SELECT 
    es.system_name,
    es.system_type,
    es.sync_enabled,
    es.last_sync_time,
    es.last_sync_status,
    es.sync_frequency_minutes,
    COUNT(CASE WHEN sc.resolution_status = 'pending' THEN 1 END) as pending_conflicts,
    COUNT(acl.id) as api_calls_today,
    AVG(acl.response_time_ms) as avg_response_time_ms,
    COUNT(CASE WHEN acl.response_status >= 400 THEN 1 END) as error_count_today
FROM external_systems es
LEFT JOIN sync_conflicts sc ON sc.created_at >= CURRENT_DATE
LEFT JOIN api_call_logs acl ON es.id = acl.external_system_id AND acl.called_at >= CURRENT_DATE
GROUP BY es.id, [... all other fields];
```

---

## Performance Indexes Created

### Extended Table Indexes
```sql
-- Asset correlation indexes
CREATE INDEX idx_ingestion_assets_tenable_uuid ON ingestion_assets(tenable_asset_uuid);
CREATE INDEX idx_ingestion_assets_sync_status ON ingestion_assets(sync_status, last_sync_time);

-- Vulnerability tracking indexes
CREATE INDEX idx_ingestion_vulnerabilities_tenable_id ON ingestion_vulnerabilities(tenable_vuln_id);
CREATE INDEX idx_ingestion_vulnerabilities_remediation ON ingestion_vulnerabilities(remediation_status, remediation_due_date);

-- System correlation indexes
CREATE INDEX idx_ingestion_systems_xacta_id ON ingestion_systems(xacta_system_id);
CREATE INDEX idx_ingestion_controls_xacta_id ON ingestion_controls(xacta_control_id);
CREATE INDEX idx_ingestion_poams_xacta_id ON ingestion_poams(xacta_poam_id);
```

### New Table Indexes
```sql
-- External system indexes
CREATE INDEX idx_external_systems_type ON external_systems(system_type, is_active);
CREATE INDEX idx_api_call_logs_system_time ON api_call_logs(external_system_id, called_at);
CREATE INDEX idx_api_call_logs_operation ON api_call_logs(operation_id);

-- Sync management indexes
CREATE INDEX idx_data_field_mappings_system_entity ON data_field_mappings(external_system_id, entity_type);
CREATE INDEX idx_sync_conflicts_entity ON sync_conflicts(entity_type, entity_id);
CREATE INDEX idx_sync_conflicts_status ON sync_conflicts(resolution_status, created_at);

-- Business context indexes
CREATE INDEX idx_assets_extended_criticality ON assets_extended(business_criticality);
CREATE INDEX idx_vulnerability_intelligence_plugin ON vulnerability_intelligence(plugin_id);
CREATE INDEX idx_vulnerability_remediation_status ON vulnerability_remediation(remediation_status, due_date);
CREATE INDEX idx_vulnerability_remediation_asset ON vulnerability_remediation(asset_uuid, remediation_status);

-- Analytics indexes
CREATE INDEX idx_metrics_values_metric_time ON metrics_values(metric_id, calculated_at);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status, started_at);
```

---

## Initial Configuration Data

### External Systems
```sql
INSERT INTO external_systems (system_name, system_type, api_base_url, authentication_method, connection_config, sync_enabled) 
VALUES 
('Tenable.io', 'tenable', 'https://cloud.tenable.com', 'api_key', '{"access_key": "", "secret_key": ""}', false),
('Xacta 360', 'xacta', 'https://xacta.example.com', 'database', '{"connection_string": "", "username": "", "password": ""}', false);
```

### Metrics Definitions
```sql
-- 8 initial metrics for integration monitoring
INSERT INTO metrics_definitions (metric_name, metric_category, display_name, description, ...)
VALUES 
('total_assets', 'operations', 'Total Assets', 'Total number of managed assets', ...),
('critical_vulnerabilities', 'security', 'Critical Vulnerabilities', 'Number of critical severity vulnerabilities', ...),
('tenable_sync_status', 'integration', 'Tenable Sync Health', 'Status of Tenable integration synchronization', ...),
-- ... additional metrics
```

### Workflow Definitions
```sql
-- 4 initial workflows for common integration scenarios
INSERT INTO workflows (workflow_name, workflow_type, trigger_conditions, workflow_steps, ...)
VALUES 
('Critical Vulnerability Response', 'remediation', ...),
('POAM Closure Workflow', 'compliance', ...),
('Tenable Asset Sync', 'integration', ...),
('Vulnerability State Sync', 'integration', ...);
```

---

## Summary of Changes

### Extended Tables: 6
- `ingestion_assets`: +7 columns for external correlation and sync tracking
- `ingestion_vulnerabilities`: +7 columns for remediation workflow
- `ingestion_systems`: +5 columns for external system mapping
- `ingestion_controls`: +6 columns for assessment automation
- `ingestion_poams`: +5 columns for workflow management
- `ingestion_batches`: +6 columns for operation tracking

### New Tables: 12
- **Integration Core**: external_systems, api_call_logs, data_field_mappings, sync_policies, sync_conflicts
- **Business Context**: assets_extended, vulnerability_intelligence, vulnerability_remediation
- **Analytics**: metrics_definitions, metrics_values
- **Workflow**: workflows, workflow_executions

### Database Views: 3
- Enhanced asset view with vulnerability counts
- Enhanced vulnerability view with remediation data
- Sync status dashboard for monitoring

### Performance Indexes: 19
- 7 indexes on extended table columns
- 12 indexes on new tables for optimal query performance

### Storage Impact
- **Estimated Annual Growth**: ~200GB (reduced from original 450GB estimate)
- **Initial Data**: ~50MB for configuration and initial metrics
- **Indexes**: ~15MB additional storage for optimal performance

This schema provides the complete foundation for bi-directional integration with Tenable and Xacta while maintaining backward compatibility with existing functionality.