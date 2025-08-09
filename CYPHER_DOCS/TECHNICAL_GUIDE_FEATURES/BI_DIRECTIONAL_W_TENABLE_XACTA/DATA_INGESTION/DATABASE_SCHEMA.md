# Data Ingestion Database Schema

## Overview

The Data Ingestion database schema consists of 15+ interconnected tables designed to handle hierarchical data relationships from external security and compliance systems. The schema supports Tenable vulnerability data, Xacta compliance systems, comprehensive batch processing, and data quality monitoring.

## Schema Architecture

### Hierarchical Data Structure
```
Level 1: ingestion_systems (Root)
├── Level 2: ingestion_assets (System Components)
│   ├── Level 3: ingestion_vulnerabilities (Asset-Specific)
│   ├── Level 3: ingestion_asset_systems (OS/Platform)
│   ├── Level 3: ingestion_asset_network (Network Config)
│   └── Level 3: ingestion_asset_tags (Metadata)
├── Level 2: ingestion_controls (System-Level Compliance)
│   ├── Level 3: ingestion_control_findings (Assessment Results)
│   ├── Level 3: ingestion_control_evidence (Supporting Documents)
│   └── Level 3: ingestion_control_inheritance (Control Relationships)
└── Level 2: ingestion_poams (Remediation Plans)
    ├── Level 3: ingestion_poam_milestones (Progress Tracking)
    ├── Level 3: ingestion_poam_assets (Affected Systems)
    └── Level 3: ingestion_poam_cves (CVE Mappings)

Operational: ingestion_batches, ingestion_errors, ingestion_data_quality
```

## Complete Database Schema

### 1. Core System Tables

#### ingestion_systems (Root Level)
```sql
CREATE TABLE ingestion_systems (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    uuid UUID NOT NULL UNIQUE,
    status VARCHAR(50),
    authorization_boundary TEXT,
    system_type VARCHAR(100),
    responsible_organization VARCHAR(255),
    system_owner VARCHAR(255),
    information_system_security_officer VARCHAR(255),
    authorizing_official VARCHAR(255),
    last_assessment_date TIMESTAMP,
    authorization_date TIMESTAMP,
    authorization_termination_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50),
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- Indexes
CREATE INDEX idx_ingestion_systems_uuid ON ingestion_systems(uuid);
CREATE INDEX idx_ingestion_systems_system_id ON ingestion_systems(system_id);
CREATE INDEX idx_ingestion_systems_source ON ingestion_systems(ingestion_source);
```

#### ingestion_system_impact_levels
```sql
CREATE TABLE ingestion_system_impact_levels (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    confidentiality_impact VARCHAR(20) CHECK (confidentiality_impact IN ('Low', 'Moderate', 'High')),
    integrity_impact VARCHAR(20) CHECK (integrity_impact IN ('Low', 'Moderate', 'High')),
    availability_impact VARCHAR(20) CHECK (availability_impact IN ('Low', 'Moderate', 'High')),
    overall_impact VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Asset Management Tables

#### ingestion_assets
```sql
CREATE TABLE ingestion_assets (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID NOT NULL UNIQUE,
    hostname VARCHAR(255),
    netbios_name VARCHAR(100),
    system_id VARCHAR(50),
    has_agent BOOLEAN,
    has_plugin_results BOOLEAN,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    exposure_score INTEGER,
    acr_score DECIMAL(3,1),
    criticality_rating VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50),
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- Indexes
CREATE INDEX idx_ingestion_assets_uuid ON ingestion_assets(asset_uuid);
CREATE INDEX idx_ingestion_assets_hostname ON ingestion_assets(hostname);
CREATE INDEX idx_ingestion_assets_system_id ON ingestion_assets(system_id);
CREATE INDEX idx_ingestion_assets_criticality ON ingestion_assets(criticality_rating);
CREATE INDEX idx_ingestion_assets_exposure_score ON ingestion_assets(exposure_score);
```

#### ingestion_asset_systems
```sql
CREATE TABLE ingestion_asset_systems (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    operating_system VARCHAR(255),
    system_type VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ingestion_asset_systems_uuid ON ingestion_asset_systems(asset_uuid);
```

#### ingestion_asset_network
```sql
CREATE TABLE ingestion_asset_network (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    mac_address VARCHAR(17),
    ipv4_address VARCHAR(15),
    ipv6_address VARCHAR(45),
    fqdn VARCHAR(255),
    netbios_workgroup VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ingestion_asset_network_uuid ON ingestion_asset_network(asset_uuid);
CREATE INDEX idx_ingestion_asset_network_ipv4 ON ingestion_asset_network(ipv4_address);
```

#### ingestion_asset_tags
```sql
CREATE TABLE ingestion_asset_tags (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    tag_key VARCHAR(100) NOT NULL,
    tag_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_uuid, tag_key)
);

-- Indexes
CREATE INDEX idx_ingestion_asset_tags_uuid ON ingestion_asset_tags(asset_uuid);
CREATE INDEX idx_ingestion_asset_tags_key ON ingestion_asset_tags(tag_key);
```

### 3. Vulnerability Management Tables

#### ingestion_vulnerabilities
```sql
CREATE TABLE ingestion_vulnerabilities (
    id SERIAL PRIMARY KEY,
    batch_id UUID REFERENCES ingestion_batches(batch_id),
    plugin_id VARCHAR(50) NOT NULL,
    vulnerability_name VARCHAR(500) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low', 'Info')),
    cvss_score DECIMAL(4,2),
    cvss_vector VARCHAR(200),
    description TEXT,
    solution TEXT,
    state VARCHAR(20),
    first_found TIMESTAMP,
    last_found TIMESTAMP,
    asset_uuid VARCHAR(255) NOT NULL,
    poam_id INTEGER,
    control_id INTEGER,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ingestion_vulnerabilities_asset_uuid ON ingestion_vulnerabilities(asset_uuid);
CREATE INDEX idx_ingestion_vulnerabilities_severity ON ingestion_vulnerabilities(severity);
CREATE INDEX idx_ingestion_vulnerabilities_plugin_id ON ingestion_vulnerabilities(plugin_id);
CREATE INDEX idx_ingestion_vulnerabilities_cvss_score ON ingestion_vulnerabilities(cvss_score);
```

#### ingestion_vulnerability_cves
```sql
CREATE TABLE ingestion_vulnerability_cves (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    cve_id VARCHAR(20) NOT NULL,
    batch_id UUID REFERENCES ingestion_batches(batch_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ingestion_vulnerability_cves_vuln_id ON ingestion_vulnerability_cves(vulnerability_id);
CREATE INDEX idx_ingestion_vulnerability_cves_cve_id ON ingestion_vulnerability_cves(cve_id);
```

### 4. Control Management Tables

#### ingestion_controls
```sql
CREATE TABLE ingestion_controls (
    id SERIAL PRIMARY KEY,
    control_id VARCHAR(50) NOT NULL,
    control_title VARCHAR(500),
    family VARCHAR(100),
    implementation_status VARCHAR(50),
    assessment_status VARCHAR(50),
    control_origination VARCHAR(100),
    implementation_guidance TEXT,
    assessment_procedures TEXT,
    system_id VARCHAR(50),
    responsible_role VARCHAR(255),
    last_assessed TIMESTAMP,
    next_assessment_due TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50),
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- Indexes
CREATE INDEX idx_ingestion_controls_control_id ON ingestion_controls(control_id);
CREATE INDEX idx_ingestion_controls_system_id ON ingestion_controls(system_id);
CREATE INDEX idx_ingestion_controls_status ON ingestion_controls(implementation_status);
```

#### ingestion_control_findings
```sql
CREATE TABLE ingestion_control_findings (
    id SERIAL PRIMARY KEY,
    control_id INTEGER REFERENCES ingestion_controls(id) ON DELETE CASCADE,
    finding_id VARCHAR(100),
    finding_type VARCHAR(50),
    severity VARCHAR(20),
    description TEXT,
    recommendation TEXT,
    status VARCHAR(50),
    identified_date TIMESTAMP,
    target_resolution_date TIMESTAMP,
    actual_resolution_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ingestion_control_evidence
```sql
CREATE TABLE ingestion_control_evidence (
    id SERIAL PRIMARY KEY,
    control_id INTEGER REFERENCES ingestion_controls(id) ON DELETE CASCADE,
    evidence_type VARCHAR(100),
    evidence_description TEXT,
    document_reference VARCHAR(255),
    collection_date TIMESTAMP,
    evidence_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. POAM Management Tables

#### ingestion_poams
```sql
CREATE TABLE ingestion_poams (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) NOT NULL UNIQUE,
    system_id VARCHAR(50),
    weakness_description TEXT,
    weakness_detection_source VARCHAR(255),
    remediation_plan TEXT,
    resources_required TEXT,
    scheduled_completion TIMESTAMP,
    milestone_changes TEXT,
    source_of_discovery VARCHAR(255),
    status VARCHAR(50),
    comments TEXT,
    raw_weakness_description TEXT,
    weakness_risk_level VARCHAR(20),
    likelihood VARCHAR(20),
    impact VARCHAR(20),
    impact_description TEXT,
    residual_risk_level VARCHAR(20),
    recommendations TEXT,
    risk_rating VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50),
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- Indexes
CREATE INDEX idx_ingestion_poams_poam_id ON ingestion_poams(poam_id);
CREATE INDEX idx_ingestion_poams_system_id ON ingestion_poams(system_id);
CREATE INDEX idx_ingestion_poams_status ON ingestion_poams(status);
CREATE INDEX idx_ingestion_poams_risk_rating ON ingestion_poams(risk_rating);
```

#### ingestion_poam_milestones
```sql
CREATE TABLE ingestion_poam_milestones (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    milestone_id VARCHAR(100),
    milestone_description TEXT,
    scheduled_completion TIMESTAMP,
    actual_completion TIMESTAMP,
    status VARCHAR(50),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ingestion_poam_assets
```sql
CREATE TABLE ingestion_poam_assets (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'affected_by',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poam_id, asset_uuid)
);
```

#### ingestion_poam_cves
```sql
CREATE TABLE ingestion_poam_cves (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    cve_id VARCHAR(20) NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'addresses',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poam_id, cve_id)
);
```

### 6. Cross-Reference Tables

#### ingestion_system_assets
```sql
CREATE TABLE ingestion_system_assets (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    assignment_type VARCHAR(50) DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_id, asset_uuid)
);
```

### 7. Operational Tables

#### ingestion_batches
```sql
CREATE TABLE ingestion_batches (
    id SERIAL PRIMARY KEY,
    batch_id UUID NOT NULL UNIQUE,
    source_system VARCHAR(50) NOT NULL,
    batch_type VARCHAR(50),
    file_name VARCHAR(255),
    total_records INTEGER,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_details TEXT,
    created_by INTEGER,
    metadata JSONB
);

-- Indexes
CREATE INDEX idx_ingestion_batches_batch_id ON ingestion_batches(batch_id);
CREATE INDEX idx_ingestion_batches_source_system ON ingestion_batches(source_system);
CREATE INDEX idx_ingestion_batches_status ON ingestion_batches(status);
```

#### ingestion_errors
```sql
CREATE TABLE ingestion_errors (
    id SERIAL PRIMARY KEY,
    batch_id UUID REFERENCES ingestion_batches(batch_id) ON DELETE CASCADE,
    table_name VARCHAR(100),
    record_identifier VARCHAR(255),
    error_type VARCHAR(100),
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ingestion_errors_batch_id ON ingestion_errors(batch_id);
CREATE INDEX idx_ingestion_errors_table_name ON ingestion_errors(table_name);
```

#### ingestion_data_quality
```sql
CREATE TABLE ingestion_data_quality (
    id SERIAL PRIMARY KEY,
    batch_id UUID REFERENCES ingestion_batches(batch_id) ON DELETE CASCADE,
    table_name VARCHAR(100),
    quality_metric VARCHAR(100),
    metric_value DECIMAL(5,2),
    details JSONB,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_ingestion_data_quality_batch_id ON ingestion_data_quality(batch_id);
CREATE INDEX idx_ingestion_data_quality_table_name ON ingestion_data_quality(table_name);
```

### 8. Scheduling Tables

#### ingestion_schedules
```sql
CREATE TABLE ingestion_schedules (
    id SERIAL PRIMARY KEY,
    schedule_name VARCHAR(255) NOT NULL,
    source_system VARCHAR(50) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_execution TIMESTAMP,
    next_execution TIMESTAMP,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### ingestion_job_executions
```sql
CREATE TABLE ingestion_job_executions (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES ingestion_schedules(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES ingestion_batches(batch_id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50),
    records_processed INTEGER,
    execution_time_seconds INTEGER,
    error_message TEXT
);
```

## Database Views

### System Overview View
```sql
CREATE VIEW vw_ingestion_system_overview AS
SELECT 
    s.system_id,
    s.name,
    s.system_type,
    s.status,
    s.system_owner,
    COUNT(DISTINCT a.asset_uuid) as total_assets,
    COUNT(DISTINCT v.id) as total_vulnerabilities,
    COUNT(DISTINCT CASE WHEN v.severity = 'Critical' THEN v.id END) as critical_vulnerabilities,
    COUNT(DISTINCT CASE WHEN v.severity = 'High' THEN v.id END) as high_vulnerabilities,
    COUNT(DISTINCT c.id) as total_controls,
    COUNT(DISTINCT p.id) as total_poams,
    AVG(a.exposure_score) as avg_exposure_score
FROM ingestion_systems s
LEFT JOIN ingestion_assets a ON s.system_id = a.system_id
LEFT JOIN ingestion_vulnerabilities v ON a.asset_uuid = v.asset_uuid
LEFT JOIN ingestion_controls c ON s.system_id = c.system_id
LEFT JOIN ingestion_poams p ON s.system_id = p.system_id
GROUP BY s.system_id, s.name, s.system_type, s.status, s.system_owner;
```

### Asset Vulnerability Summary View
```sql
CREATE VIEW vw_ingestion_asset_vulnerability_summary AS
SELECT 
    a.asset_uuid,
    a.hostname,
    a.netbios_name,
    a.system_id,
    a.criticality_rating,
    a.exposure_score,
    COUNT(v.id) as total_vulnerabilities,
    COUNT(CASE WHEN v.severity = 'Critical' THEN 1 END) as critical_count,
    COUNT(CASE WHEN v.severity = 'High' THEN 1 END) as high_count,
    COUNT(CASE WHEN v.severity = 'Medium' THEN 1 END) as medium_count,
    COUNT(CASE WHEN v.severity = 'Low' THEN 1 END) as low_count,
    MAX(v.cvss_score) as highest_cvss_score,
    MIN(v.first_found) as first_vulnerability_date,
    MAX(v.last_found) as last_vulnerability_date
FROM ingestion_assets a
LEFT JOIN ingestion_vulnerabilities v ON a.asset_uuid = v.asset_uuid
GROUP BY a.asset_uuid, a.hostname, a.netbios_name, a.system_id, a.criticality_rating, a.exposure_score;
```

## Performance Optimization

### Key Indexes
```sql
-- Critical performance indexes
CREATE INDEX CONCURRENTLY idx_ingestion_vulnerabilities_composite ON ingestion_vulnerabilities(asset_uuid, severity, cvss_score);
CREATE INDEX CONCURRENTLY idx_ingestion_assets_composite ON ingestion_assets(system_id, criticality_rating, exposure_score);
CREATE INDEX CONCURRENTLY idx_ingestion_poams_composite ON ingestion_poams(system_id, status, risk_rating);
```

### Table Partitioning Recommendations
```sql
-- For high-volume vulnerability data
-- Partition by date range (monthly or quarterly)
-- Implement automated partition management
```

## Data Retention Policy

### Automated Cleanup
```sql
-- Example cleanup procedures
-- Keep vulnerability data for 2 years
-- Archive POAM data after completion + 1 year
-- Retain batch logs for 6 months
```

---

This database schema provides a complete foundation for enterprise-grade security data ingestion, supporting complex hierarchical relationships, comprehensive audit trails, and high-performance querying capabilities.