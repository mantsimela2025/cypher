-- ============================================================================
-- Hierarchical Data Ingestion Schema - Complete SQL Schema
-- Created: 2024-06-23
-- Description: Comprehensive database schema for ingesting security data
--              with Systems as the highest hierarchy level
-- ============================================================================

-- ============================================================================
-- Level 1: Systems (Root Hierarchy)
-- ============================================================================

-- Core systems table
CREATE TABLE IF NOT EXISTS ingestion_systems (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) UNIQUE NOT NULL, -- SYS-ENT-001, SYS-ENT-002
    name VARCHAR(255) NOT NULL,
    uuid UUID UNIQUE,
    status VARCHAR(50), -- operational, development, decommissioned
    authorization_boundary TEXT,
    system_type VARCHAR(100), -- Major Application, General Support System
    responsible_organization VARCHAR(255),
    system_owner VARCHAR(255),
    information_system_security_officer VARCHAR(255),
    authorizing_official VARCHAR(255),
    last_assessment_date TIMESTAMP,
    authorization_date TIMESTAMP,
    authorization_termination_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50) DEFAULT 'xacta',
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- System impact levels (CIA triad)
CREATE TABLE IF NOT EXISTS ingestion_system_impact_levels (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    confidentiality VARCHAR(20), -- low, moderate, high
    integrity VARCHAR(20), -- low, moderate, high  
    availability VARCHAR(20), -- low, moderate, high
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_id)
);

-- ============================================================================
-- Level 2: Assets (System Components)
-- ============================================================================

-- Core assets table
CREATE TABLE IF NOT EXISTS ingestion_assets (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID UNIQUE NOT NULL,
    hostname VARCHAR(255),
    netbios_name VARCHAR(100),
    has_agent BOOLEAN DEFAULT false,
    has_plugin_results BOOLEAN DEFAULT false,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    exposure_score INTEGER, -- Tenable exposure score
    acr_score DECIMAL(3,1), -- Asset Criticality Rating
    criticality_rating VARCHAR(20), -- critical, high, medium, low
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50) DEFAULT 'tenable',
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- Asset network information
CREATE TABLE IF NOT EXISTS ingestion_asset_network (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    fqdn VARCHAR(255),
    ipv4_address INET,
    ipv6_address INET,
    mac_address MACADDR,
    network_id VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset system types and OS information
CREATE TABLE IF NOT EXISTS ingestion_asset_systems (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    operating_system VARCHAR(255),
    system_type VARCHAR(100), -- web-server, database-server, domain-controller
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset tags and metadata
CREATE TABLE IF NOT EXISTS ingestion_asset_tags (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    tag_key VARCHAR(100) NOT NULL,
    tag_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_uuid, tag_key)
);

-- ============================================================================
-- Level 3: Vulnerabilities (Asset-Specific)
-- ============================================================================

-- Core vulnerabilities table
CREATE TABLE IF NOT EXISTS ingestion_vulnerabilities (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    plugin_id INTEGER NOT NULL,
    plugin_name TEXT NOT NULL,
    plugin_family VARCHAR(255),
    severity INTEGER, -- 1-4 (Info, Low, Medium, High, Critical)
    severity_name VARCHAR(20),
    cvss_base_score DECIMAL(3,1),
    cvss3_base_score DECIMAL(3,1),
    description TEXT,
    solution TEXT,
    risk_factor VARCHAR(20),
    first_found TIMESTAMP,
    last_found TIMESTAMP,
    state VARCHAR(20) DEFAULT 'Open', -- Open, Fixed, Accepted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50) DEFAULT 'tenable',
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- CVE mappings for vulnerabilities (many-to-many)
CREATE TABLE IF NOT EXISTS ingestion_vulnerability_cves (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    cve_id VARCHAR(20) NOT NULL, -- CVE-2017-0143, CVE-2021-44790, etc.
    cvss_v2_score DECIMAL(3,1),
    cvss_v3_score DECIMAL(3,1),
    cvss_v3_vector VARCHAR(255),
    published_date DATE,
    modified_date DATE,
    description TEXT,
    severity VARCHAR(20), -- Critical, High, Medium, Low
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vulnerability_id, cve_id)
);

-- ============================================================================
-- Level 4A: Controls (System-Level Compliance)
-- ============================================================================

-- Core controls table
CREATE TABLE IF NOT EXISTS ingestion_controls (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    control_id VARCHAR(20) NOT NULL, -- AC-1, SI-2, etc.
    control_title VARCHAR(255) NOT NULL,
    family VARCHAR(100), -- Access Control, System and Information Integrity
    priority VARCHAR(10), -- P1, P2, P3
    implementation_status VARCHAR(50), -- implemented, partially_implemented, not_implemented
    assessment_status VARCHAR(50), -- satisfied, other_than_satisfied, not_satisfied
    responsible_role VARCHAR(255),
    last_assessed TIMESTAMP,
    implementation_guidance TEXT,
    residual_risk VARCHAR(20), -- low, medium, high, critical
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50) DEFAULT 'xacta',
    ingestion_batch_id UUID,
    raw_json JSONB,
    UNIQUE(system_id, control_id)
);

-- ============================================================================
-- Level 4B: POAMs (Risk Remediation Plans)
-- ============================================================================

-- Core POAMs table
CREATE TABLE IF NOT EXISTS ingestion_poams (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) UNIQUE NOT NULL, -- POAM-2024-001
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    weakness_description TEXT NOT NULL,
    source TEXT, -- Reference to finding or assessment
    security_control VARCHAR(20), -- SI-2, AC-2, etc.
    resources TEXT, -- Human and technical resources needed
    scheduled_completion DATE,
    poc VARCHAR(255), -- Point of Contact
    status VARCHAR(50), -- ongoing, completed, overdue, critical
    risk_rating VARCHAR(20), -- critical, high, moderate, medium, low
    deviation_rationale TEXT,
    original_detection_date DATE,
    weakness_severity VARCHAR(20),
    residual_risk VARCHAR(20),
    threat_relevance VARCHAR(50), -- Confirmed, Anticipated
    likelihood VARCHAR(20), -- Very High, High, Medium, Low
    impact VARCHAR(20), -- Very High, High, Medium, Low
    mitigation_strategy TEXT,
    cost_estimate VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50) DEFAULT 'xacta',
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- CVE mappings for POAMs (many-to-many)
CREATE TABLE IF NOT EXISTS ingestion_poam_cves (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    cve_id VARCHAR(20) NOT NULL, -- CVE-2017-0143, CVE-2021-44790, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poam_id, cve_id)
);

-- ============================================================================
-- Cross-Reference Tables (Many-to-Many Relationships)
-- ============================================================================

-- System-Asset mappings
CREATE TABLE IF NOT EXISTS ingestion_system_assets (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    assignment_type VARCHAR(50) DEFAULT 'direct', -- direct, inherited, shared
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_id, asset_uuid)
);

-- POAM-Asset mappings (POAMs can affect multiple assets)
CREATE TABLE IF NOT EXISTS ingestion_poam_assets (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poam_id, asset_uuid)
);

-- ============================================================================
-- Tracking and Management Tables
-- ============================================================================

-- Ingestion batch tracking
CREATE TABLE IF NOT EXISTS ingestion_batches (
    id SERIAL PRIMARY KEY,
    batch_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    source_system VARCHAR(50) NOT NULL, -- xacta, tenable
    batch_type VARCHAR(50) NOT NULL, -- systems, assets, vulnerabilities, controls, poams
    file_name VARCHAR(255),
    total_records INTEGER,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, failed
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_details TEXT,
    created_by INTEGER, -- User ID who initiated the ingestion
    metadata JSONB -- Additional batch-specific metadata
);

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Systems indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_systems_system_id ON ingestion_systems(system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_systems_status ON ingestion_systems(status);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_uuid ON ingestion_assets(asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_hostname ON ingestion_assets(hostname);
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_criticality ON ingestion_assets(criticality_rating);

-- Vulnerabilities indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_asset_uuid ON ingestion_vulnerabilities(asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_severity ON ingestion_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_state ON ingestion_vulnerabilities(state);

-- CVE indexes
CREATE INDEX IF NOT EXISTS idx_vuln_cves_cve_id ON ingestion_vulnerability_cves(cve_id);
CREATE INDEX IF NOT EXISTS idx_vuln_cves_vulnerability_id ON ingestion_vulnerability_cves(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_poam_cves_cve_id ON ingestion_poam_cves(cve_id);
CREATE INDEX IF NOT EXISTS idx_poam_cves_poam_id ON ingestion_poam_cves(poam_id);

-- Controls indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_controls_system_id ON ingestion_controls(system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_controls_control_id ON ingestion_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_controls_status ON ingestion_controls(implementation_status);

-- POAMs indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_poams_system_id ON ingestion_poams(system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_poams_status ON ingestion_poams(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_poams_risk_rating ON ingestion_poams(risk_rating);

-- Cross-reference indexes
CREATE INDEX IF NOT EXISTS idx_system_assets_system_id ON ingestion_system_assets(system_id);
CREATE INDEX IF NOT EXISTS idx_system_assets_asset_uuid ON ingestion_system_assets(asset_uuid);

-- ============================================================================
-- Comprehensive Views
-- ============================================================================

-- System overview with aggregated metrics
CREATE OR REPLACE VIEW vw_ingestion_system_overview AS
SELECT 
    s.system_id,
    s.name as system_name,
    s.status as system_status,
    s.system_type,
    s.responsible_organization,
    s.authorization_date,
    s.authorization_termination_date,
    COUNT(DISTINCT sa.asset_uuid) as total_assets,
    COUNT(DISTINCT c.id) as total_controls,
    COUNT(DISTINCT p.id) as total_poams,
    COUNT(DISTINCT v.id) as total_vulnerabilities,
    COUNT(DISTINCT CASE WHEN v.severity = 4 THEN v.id END) as critical_vulnerabilities,
    COUNT(DISTINCT CASE WHEN p.risk_rating = 'critical' THEN p.id END) as critical_poams
FROM ingestion_systems s
LEFT JOIN ingestion_system_assets sa ON s.system_id = sa.system_id
LEFT JOIN ingestion_assets a ON sa.asset_uuid = a.asset_uuid
LEFT JOIN ingestion_controls c ON s.system_id = c.system_id
LEFT JOIN ingestion_poams p ON s.system_id = p.system_id
LEFT JOIN ingestion_vulnerabilities v ON a.asset_uuid = v.asset_uuid
GROUP BY s.system_id, s.name, s.status, s.system_type, s.responsible_organization, 
         s.authorization_date, s.authorization_termination_date;

-- Vulnerability details with CVE information
CREATE OR REPLACE VIEW vw_ingestion_vulnerability_details AS
SELECT 
    v.id as vulnerability_id,
    v.asset_uuid,
    a.hostname,
    a.criticality_rating as asset_criticality,
    v.plugin_id,
    v.plugin_name,
    v.plugin_family,
    v.severity,
    v.severity_name,
    v.cvss_base_score,
    v.cvss3_base_score,
    v.description,
    v.solution,
    v.risk_factor,
    v.first_found,
    v.last_found,
    v.state,
    STRING_AGG(vc.cve_id, ', ' ORDER BY vc.cve_id) as associated_cves,
    COUNT(vc.cve_id) as cve_count,
    s.system_id,
    s.name as system_name
FROM ingestion_vulnerabilities v
LEFT JOIN ingestion_assets a ON v.asset_uuid = a.asset_uuid
LEFT JOIN ingestion_system_assets sa ON a.asset_uuid = sa.asset_uuid
LEFT JOIN ingestion_systems s ON sa.system_id = s.system_id
LEFT JOIN ingestion_vulnerability_cves vc ON v.id = vc.vulnerability_id
GROUP BY v.id, v.asset_uuid, a.hostname, a.criticality_rating, v.plugin_id, 
         v.plugin_name, v.plugin_family, v.severity, v.severity_name, 
         v.cvss_base_score, v.cvss3_base_score, v.description, v.solution,
         v.risk_factor, v.first_found, v.last_found, v.state, 
         s.system_id, s.name;

-- Asset security profile
CREATE OR REPLACE VIEW vw_ingestion_asset_security_profile AS
SELECT 
    a.asset_uuid,
    a.hostname,
    a.criticality_rating,
    a.exposure_score,
    a.acr_score,
    s.system_id,
    s.name as system_name,
    COUNT(v.id) as total_vulnerabilities,
    COUNT(CASE WHEN v.severity = 4 THEN 1 END) as critical_vulnerabilities,
    COUNT(CASE WHEN v.severity = 3 THEN 1 END) as high_vulnerabilities,
    COUNT(CASE WHEN v.severity = 2 THEN 1 END) as medium_vulnerabilities,
    COUNT(CASE WHEN v.severity = 1 THEN 1 END) as low_vulnerabilities,
    AVG(v.cvss3_base_score) as avg_cvss_score,
    MAX(v.last_found) as last_vulnerability_scan
FROM ingestion_assets a
LEFT JOIN ingestion_system_assets sa ON a.asset_uuid = sa.asset_uuid
LEFT JOIN ingestion_systems s ON sa.system_id = s.system_id
LEFT JOIN ingestion_vulnerabilities v ON a.asset_uuid = v.asset_uuid
GROUP BY a.asset_uuid, a.hostname, a.criticality_rating, a.exposure_score, 
         a.acr_score, s.system_id, s.name;

-- POAM progress tracking
CREATE OR REPLACE VIEW vw_ingestion_poam_progress AS
SELECT 
    p.poam_id,
    p.system_id,
    s.name as system_name,
    p.weakness_description,
    p.security_control,
    p.status,
    p.risk_rating,
    p.scheduled_completion,
    p.poc,
    p.cost_estimate,
    COUNT(pa.asset_uuid) as affected_assets,
    COUNT(pc.cve_id) as associated_cves,
    CASE 
        WHEN p.scheduled_completion < CURRENT_DATE AND p.status != 'completed' THEN 'Overdue'
        WHEN p.scheduled_completion <= CURRENT_DATE + INTERVAL '7 days' AND p.status != 'completed' THEN 'Due Soon'
        ELSE 'On Track'
    END as completion_status
FROM ingestion_poams p
LEFT JOIN ingestion_systems s ON p.system_id = s.system_id
LEFT JOIN ingestion_poam_assets pa ON p.poam_id = pa.poam_id
LEFT JOIN ingestion_poam_cves pc ON p.poam_id = pc.poam_id
GROUP BY p.poam_id, p.system_id, s.name, p.weakness_description, p.security_control,
         p.status, p.risk_rating, p.scheduled_completion, p.poc, p.cost_estimate;

-- ============================================================================
-- Schema Information Query
-- ============================================================================

-- Query to view all ingestion tables and their hierarchy
/*
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name LIKE '%systems%' AND table_name NOT LIKE '%assets%' THEN '1-Systems (Root)'
        WHEN table_name LIKE '%assets%' THEN '2-Assets'
        WHEN table_name LIKE '%vulnerabilities%' THEN '3-Vulnerabilities'
        WHEN table_name LIKE '%controls%' THEN '4A-Controls'
        WHEN table_name LIKE '%poams%' THEN '4B-POAMs'
        WHEN table_name LIKE '%batches%' THEN '5-Tracking'
        WHEN table_name LIKE '%cves%' THEN '6-CVE-Mappings'
        ELSE '7-Cross-Reference'
    END as hierarchy_level
FROM information_schema.tables 
WHERE table_name LIKE 'ingestion_%' 
ORDER BY hierarchy_level, table_name;
*/