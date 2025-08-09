-- Comprehensive Database Schema for JSON Data Ingestion
-- Designed for hierarchical data starting with Systems as the highest level
-- Supports complete data ingestion from Xacta, Tenable, and related sources

-- ============================================================================
-- LEVEL 1: SYSTEMS (Highest Hierarchy)
-- ============================================================================

-- Main Systems table - Top level entity
CREATE TABLE IF NOT EXISTS ingestion_systems (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., SYS-ENT-001
    name VARCHAR(255) NOT NULL,
    uuid UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL, -- operational, decommissioned, etc.
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
    raw_json JSONB -- Store original JSON for reference
);

-- System Impact Levels (CIA Triad)
CREATE TABLE IF NOT EXISTS ingestion_system_impact_levels (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    confidentiality VARCHAR(20) NOT NULL, -- low, moderate, high
    integrity VARCHAR(20) NOT NULL,
    availability VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEVEL 2: ASSETS (Children of Systems)
-- ============================================================================

-- Assets discovered by Tenable, mapped to Systems
CREATE TABLE IF NOT EXISTS ingestion_assets (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID UNIQUE NOT NULL,
    hostname VARCHAR(255),
    netbios_name VARCHAR(100),
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id),
    has_agent BOOLEAN DEFAULT FALSE,
    has_plugin_results BOOLEAN DEFAULT FALSE,
    first_seen TIMESTAMP,
    last_seen TIMESTAMP,
    exposure_score INTEGER,
    acr_score DECIMAL(3,1),
    criticality_rating VARCHAR(20), -- critical, high, medium, low
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50) DEFAULT 'tenable',
    ingestion_batch_id UUID,
    raw_json JSONB
);

-- Asset Network Information
CREATE TABLE IF NOT EXISTS ingestion_asset_network (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    fqdn VARCHAR(255),
    ipv4_address INET,
    mac_address MACADDR,
    network_type VARCHAR(50), -- primary, secondary, management
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Operating Systems and Types
CREATE TABLE IF NOT EXISTS ingestion_asset_systems (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    operating_system VARCHAR(255),
    system_type VARCHAR(100), -- domain-controller, web-server, database-server, etc.
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Tags (Key-Value pairs)
CREATE TABLE IF NOT EXISTS ingestion_asset_tags (
    id SERIAL PRIMARY KEY,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    tag_key VARCHAR(100) NOT NULL,
    tag_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(asset_uuid, tag_key)
);

-- ============================================================================
-- LEVEL 3: VULNERABILITIES (Associated with Assets)
-- ============================================================================

-- Vulnerabilities from Tenable scans
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

-- CVE References for Vulnerabilities
CREATE TABLE IF NOT EXISTS ingestion_vulnerability_cves (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    cve_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vulnerability_id, cve_id)
);

-- Vulnerability References and Links
CREATE TABLE IF NOT EXISTS ingestion_vulnerability_references (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    reference_url TEXT NOT NULL,
    reference_type VARCHAR(50), -- vendor_advisory, exploit_db, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEVEL 4: CONTROLS (Associated with Systems)
-- ============================================================================

-- Security Controls from Xacta
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

-- Control Findings
CREATE TABLE IF NOT EXISTS ingestion_control_findings (
    id SERIAL PRIMARY KEY,
    control_id INTEGER REFERENCES ingestion_controls(id) ON DELETE CASCADE,
    finding_id VARCHAR(50) NOT NULL,
    severity VARCHAR(20), -- critical, high, moderate, low
    description TEXT NOT NULL,
    recommendation TEXT,
    target_date DATE,
    poc VARCHAR(255), -- Point of Contact
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Control Evidence
CREATE TABLE IF NOT EXISTS ingestion_control_evidence (
    id SERIAL PRIMARY KEY,
    control_id INTEGER REFERENCES ingestion_controls(id) ON DELETE CASCADE,
    evidence_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    evidence_type VARCHAR(100), -- document, procedure, scan_report, etc.
    location TEXT,
    upload_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inherited Controls
CREATE TABLE IF NOT EXISTS ingestion_control_inheritance (
    id SERIAL PRIMARY KEY,
    control_id INTEGER REFERENCES ingestion_controls(id) ON DELETE CASCADE,
    provider VARCHAR(255), -- AWS IAM, Azure AD, etc.
    description TEXT,
    responsibility VARCHAR(50), -- customer, provider, shared
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LEVEL 5: POAMs (Plan of Action & Milestones)
-- ============================================================================

-- POAMs from Xacta
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

-- POAM Milestones
CREATE TABLE IF NOT EXISTS ingestion_poam_milestones (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    milestone_order INTEGER NOT NULL,
    description TEXT NOT NULL,
    target_date DATE,
    status VARCHAR(50), -- pending, in_progress, completed
    completion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- POAM Affected Assets
CREATE TABLE IF NOT EXISTS ingestion_poam_assets (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poam_id, asset_uuid)
);

-- POAM CVE References
CREATE TABLE IF NOT EXISTS ingestion_poam_cves (
    id SERIAL PRIMARY KEY,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    cve_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poam_id, cve_id)
);

-- ============================================================================
-- LEVEL 6: PATCH MANAGEMENT (Remediation Actions)
-- ============================================================================

-- Patch management table for identified vulnerabilities
CREATE TABLE IF NOT EXISTS ingestion_patches (
    id SERIAL PRIMARY KEY,
    patch_id VARCHAR(255) UNIQUE NOT NULL,
    cve_id VARCHAR(20),
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    vendor VARCHAR(100),
    description TEXT,
    product VARCHAR(100),
    version_affected VARCHAR(100),
    patch_type VARCHAR(50), -- security, feature, hotfix, cumulative
    patch_version VARCHAR(100),
    severity VARCHAR(20), -- critical, high, medium, low
    status VARCHAR(20) DEFAULT 'identified', -- identified, available, downloaded, tested, deployed, failed
    patch_description TEXT,
    release_date TIMESTAMP,
    kb VARCHAR(50), -- Knowledge Base or Bulletin ID
    version TEXT, -- Target version after patching
    applicable_to JSONB, -- Systems/OS this patch applies to
    download_url TEXT,
    patch_url TEXT, -- Vendor patch information URL
    file_size VARCHAR(20),
    checksum VARCHAR(255),
    prerequisites TEXT, -- Required patches or conditions
    superseded_by VARCHAR(255), -- Newer patch that replaces this one
    supersedes VARCHAR(255), -- Older patches this one replaces
    reboot_required BOOLEAN DEFAULT false,
    estimated_install_time INTERVAL,
    patch_priority VARCHAR(20), -- EMERGENCY, CRITICAL, HIGH, MEDIUM, LOW
    business_impact TEXT,
    rollback_instructions TEXT,
    testing_notes TEXT,
    deployment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ingestion_source VARCHAR(50) DEFAULT 'vulnerability_analysis',
    ingestion_batch_id UUID,
    raw_json JSONB -- Original patch data from vendor APIs
);

-- ============================================================================
-- CROSS-REFERENCE AND MAPPING TABLES
-- ============================================================================

-- System-Asset Mappings (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS ingestion_system_assets (
    id SERIAL PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES ingestion_systems(system_id) ON DELETE CASCADE,
    asset_uuid UUID REFERENCES ingestion_assets(asset_uuid) ON DELETE CASCADE,
    assignment_type VARCHAR(50) DEFAULT 'direct', -- direct, inherited, shared
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_id, asset_uuid)
);

-- Vulnerability-POAM Mappings
CREATE TABLE IF NOT EXISTS ingestion_vulnerability_poams (
    id SERIAL PRIMARY KEY,
    vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'addresses', -- addresses, related_to
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vulnerability_id, poam_id)
);

-- Control-POAM Mappings
CREATE TABLE IF NOT EXISTS ingestion_control_poams (
    id SERIAL PRIMARY KEY,
    control_id INTEGER REFERENCES ingestion_controls(id) ON DELETE CASCADE,
    poam_id VARCHAR(50) REFERENCES ingestion_poams(poam_id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'remediates', -- remediates, implements
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(control_id, poam_id)
);

-- ============================================================================
-- INGESTION METADATA AND TRACKING
-- ============================================================================

-- Ingestion Batch Tracking
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

-- Ingestion Errors Log
CREATE TABLE IF NOT EXISTS ingestion_errors (
    id SERIAL PRIMARY KEY,
    batch_id UUID REFERENCES ingestion_batches(batch_id) ON DELETE CASCADE,
    table_name VARCHAR(100),
    record_identifier VARCHAR(255), -- ID or key of the failed record
    error_type VARCHAR(100), -- validation_error, constraint_violation, etc.
    error_message TEXT,
    raw_data JSONB, -- The problematic data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Quality Metrics
CREATE TABLE IF NOT EXISTS ingestion_data_quality (
    id SERIAL PRIMARY KEY,
    batch_id UUID REFERENCES ingestion_batches(batch_id) ON DELETE CASCADE,
    table_name VARCHAR(100),
    quality_metric VARCHAR(100), -- completeness, uniqueness, validity
    metric_value DECIMAL(5,2), -- Percentage or score
    details JSONB,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SCHEDULING AND AUTOMATION INFRASTRUCTURE
-- ============================================================================

-- Ingestion scheduling configuration
CREATE TABLE IF NOT EXISTS ingestion_schedules (
    id SERIAL PRIMARY KEY,
    source_system VARCHAR(50) NOT NULL, -- 'tenable', 'xacta'
    data_type VARCHAR(50) NOT NULL, -- 'vulnerabilities', 'assets', 'controls', 'poams'
    schedule_expression VARCHAR(100), -- Cron expression
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    enabled BOOLEAN DEFAULT true,
    update_type VARCHAR(20) DEFAULT 'incremental', -- 'incremental', 'full'
    priority INTEGER DEFAULT 3, -- 1=high, 2=medium, 3=low
    max_runtime_minutes INTEGER DEFAULT 60,
    failure_retry_count INTEGER DEFAULT 3,
    current_retry_count INTEGER DEFAULT 0,
    last_success TIMESTAMP,
    last_failure TIMESTAMP,
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ingestion job execution tracking
CREATE TABLE IF NOT EXISTS ingestion_job_executions (
    id SERIAL PRIMARY KEY,
    schedule_id INTEGER REFERENCES ingestion_schedules(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES ingestion_batches(batch_id) ON DELETE SET NULL,
    execution_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_end TIMESTAMP,
    status VARCHAR(50) DEFAULT 'running', -- running, completed, failed, timeout
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    execution_details JSONB,
    error_message TEXT,
    runtime_seconds INTEGER
);

-- Data freshness monitoring
CREATE TABLE IF NOT EXISTS ingestion_data_freshness (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    data_source VARCHAR(50) NOT NULL,
    last_update TIMESTAMP,
    record_count INTEGER,
    freshness_score DECIMAL(5,2), -- 0-100 score based on SLA
    sla_threshold_hours INTEGER,
    is_stale BOOLEAN DEFAULT false,
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RISK AND COST MANAGEMENT INTEGRATION
-- ============================================================================

-- Bridge table connecting ingested assets to existing risk/cost management
CREATE TABLE IF NOT EXISTS ingestion_asset_risk_mapping (
    id SERIAL PRIMARY KEY,
    ingestion_asset_uuid VARCHAR(255) REFERENCES ingestion_assets(uuid) ON DELETE CASCADE,
    existing_asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
    risk_model_id INTEGER REFERENCES risk_models(id) ON DELETE SET NULL,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    mapping_confidence DECIMAL(3,2) DEFAULT 0.85, -- 0-1 confidence in mapping
    mapping_method VARCHAR(50) DEFAULT 'automatic', -- automatic, manual, ai_assisted
    mapping_criteria JSONB, -- Criteria used for mapping (hostname, ip, tags, etc.)
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ingestion_asset_uuid, existing_asset_id)
);

-- Extended vulnerability risk scores for ingested vulnerabilities
CREATE TABLE IF NOT EXISTS ingestion_vulnerability_risk_scores (
    id SERIAL PRIMARY KEY,
    ingestion_vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    ingestion_asset_uuid VARCHAR(255) REFERENCES ingestion_assets(uuid) ON DELETE CASCADE,
    risk_model_id INTEGER REFERENCES risk_models(id) ON DELETE SET NULL,
    base_score DECIMAL(4,2) NOT NULL, -- CVSS base score
    adjusted_score DECIMAL(4,2) NOT NULL, -- Risk-adjusted score
    business_impact DECIMAL(4,2) NOT NULL, -- Business impact score
    exploit_likelihood DECIMAL(4,2) NOT NULL, -- Likelihood of exploitation
    mitigation_difficulty DECIMAL(4,2) NOT NULL, -- Difficulty to remediate
    ai_confidence DECIMAL(3,2) NOT NULL, -- AI confidence in assessment
    contextual_factors JSONB, -- Additional risk factors from ingested data
    justification TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost analysis for ingested vulnerabilities and patches
CREATE TABLE IF NOT EXISTS ingestion_vulnerability_costs (
    id SERIAL PRIMARY KEY,
    ingestion_vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id) ON DELETE CASCADE,
    ingestion_asset_uuid VARCHAR(255) REFERENCES ingestion_assets(uuid) ON DELETE CASCADE,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE SET NULL,
    remediation_cost DECIMAL(12,2), -- Estimated cost to fix
    business_impact_cost DECIMAL(12,2), -- Potential business impact cost
    downtime_cost_per_hour DECIMAL(10,2), -- Cost per hour of downtime
    expected_downtime_hours DECIMAL(6,2), -- Expected downtime for remediation
    patch_complexity_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Complexity factor
    regulatory_fine_risk DECIMAL(12,2), -- Potential regulatory costs
    reputation_impact_cost DECIMAL(12,2), -- Estimated reputation damage cost
    cost_calculation_method VARCHAR(50) DEFAULT 'ai_estimated', -- ai_estimated, manual, template
    cost_factors JSONB, -- Detailed cost breakdown
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Budget impact tracking for ingested data remediation
CREATE TABLE IF NOT EXISTS ingestion_budget_impact (
    id SERIAL PRIMARY KEY,
    cost_budget_id INTEGER REFERENCES cost_budgets(id) ON DELETE CASCADE,
    ingestion_batch_id UUID REFERENCES ingestion_batches(batch_id) ON DELETE CASCADE,
    impact_type VARCHAR(50) NOT NULL, -- vulnerability_remediation, patch_deployment, emergency_response
    estimated_cost DECIMAL(12,2) NOT NULL,
    actual_cost DECIMAL(12,2),
    budget_variance DECIMAL(12,2), -- Difference from budget
    priority_level INTEGER DEFAULT 3, -- 1=emergency, 2=high, 3=medium, 4=low
    approval_required BOOLEAN DEFAULT false,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    impact_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYSTEM-LEVEL ASSOCIATIONS AND HIERARCHICAL LINKAGE
-- ============================================================================

-- System-level risk associations
CREATE TABLE IF NOT EXISTS system_risk_profiles (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES ingestion_systems(id) ON DELETE CASCADE,
    risk_model_id INTEGER REFERENCES risk_models(id) ON DELETE SET NULL,
    overall_risk_score DECIMAL(4,2) NOT NULL,
    risk_level VARCHAR(20) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    risk_factors JSONB, -- Detailed risk factor breakdown
    last_assessment_date TIMESTAMP,
    next_assessment_due TIMESTAMP,
    assessed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    mitigation_priority INTEGER DEFAULT 3, -- 1=emergency, 2=high, 3=medium, 4=low
    compliance_impact TEXT,
    business_impact TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System-level cost allocations
CREATE TABLE IF NOT EXISTS system_cost_allocations (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES ingestion_systems(id) ON DELETE CASCADE,
    cost_center_id INTEGER REFERENCES cost_centers(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER,
    allocated_budget DECIMAL(12,2) NOT NULL,
    actual_spent DECIMAL(12,2) DEFAULT 0.00,
    cost_category VARCHAR(50) NOT NULL, -- operational, security, compliance, maintenance
    allocation_method VARCHAR(50) DEFAULT 'percentage', -- percentage, direct, activity_based
    allocation_percentage DECIMAL(5,2), -- If using percentage method
    cost_drivers JSONB, -- Factors driving cost allocation
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System-level policy associations
CREATE TABLE IF NOT EXISTS system_policy_assignments (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES ingestion_systems(id) ON DELETE CASCADE,
    policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) NOT NULL, -- mandatory, recommended, optional
    compliance_status VARCHAR(50) DEFAULT 'not_assessed', -- compliant, non_compliant, partial, not_assessed
    implementation_date DATE,
    next_review_date DATE,
    compliance_notes TEXT,
    evidence_artifacts JSONB, -- Links to compliance evidence
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(system_id, policy_id)
);

-- System-level procedure associations
CREATE TABLE IF NOT EXISTS system_procedure_assignments (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES ingestion_systems(id) ON DELETE CASCADE,
    procedure_id INTEGER REFERENCES procedures(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) NOT NULL, -- mandatory, recommended, optional
    implementation_status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, implemented, needs_review
    target_implementation_date DATE,
    actual_implementation_date DATE,
    implementation_notes TEXT,
    responsible_person INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_id, procedure_id)
);

-- System-level artifact associations
CREATE TABLE IF NOT EXISTS system_artifact_associations (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES ingestion_systems(id) ON DELETE CASCADE,
    artifact_id INTEGER REFERENCES artifacts(id) ON DELETE CASCADE,
    association_type VARCHAR(50) NOT NULL, -- documentation, evidence, configuration, policy_doc
    relevance_score DECIMAL(3,2) DEFAULT 1.0, -- 0-1 relevance to system
    is_critical BOOLEAN DEFAULT false,
    access_level VARCHAR(50) DEFAULT 'internal', -- public, internal, restricted, confidential
    last_verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verification_notes TEXT,
    associated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    associated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_id, artifact_id)
);

-- System-level vulnerability rollup
CREATE TABLE IF NOT EXISTS system_vulnerability_summary (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES ingestion_systems(id) ON DELETE CASCADE,
    critical_count INTEGER DEFAULT 0,
    high_count INTEGER DEFAULT 0,
    medium_count INTEGER DEFAULT 0,
    low_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    highest_cvss_score DECIMAL(4,2),
    average_cvss_score DECIMAL(4,2),
    oldest_vulnerability_date TIMESTAMP,
    newest_vulnerability_date TIMESTAMP,
    remediation_priority INTEGER DEFAULT 3, -- 1=emergency, 2=high, 3=medium, 4=low
    estimated_remediation_cost DECIMAL(12,2),
    estimated_remediation_time_days INTEGER,
    last_calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_calculation_due TIMESTAMP,
    calculation_method VARCHAR(50) DEFAULT 'automated'
);

-- System-level POAM associations
CREATE TABLE IF NOT EXISTS system_poam_assignments (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES ingestion_systems(id) ON DELETE CASCADE,
    poam_id INTEGER REFERENCES ingestion_poams(id) ON DELETE CASCADE,
    assignment_reason TEXT,
    priority_level INTEGER DEFAULT 3, -- 1=emergency, 2=high, 3=medium, 4=low
    estimated_completion_date DATE,
    actual_completion_date DATE,
    resource_requirements TEXT,
    budget_impact DECIMAL(12,2),
    assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(system_id, poam_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_systems_system_id ON ingestion_systems(system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_systems_uuid ON ingestion_systems(uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_uuid ON ingestion_assets(asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_system_id ON ingestion_assets(system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_asset_uuid ON ingestion_vulnerabilities(asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_controls_system_id ON ingestion_controls(system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_poams_system_id ON ingestion_poams(system_id);

-- Performance indexes for queries
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_severity ON ingestion_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_state ON ingestion_vulnerabilities(state);
CREATE INDEX IF NOT EXISTS idx_ingestion_controls_implementation_status ON ingestion_controls(implementation_status);
CREATE INDEX IF NOT EXISTS idx_ingestion_poams_status ON ingestion_poams(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_poams_risk_rating ON ingestion_poams(risk_rating);

-- Patch management indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_patches_cve_id ON ingestion_patches(cve_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_patches_severity ON ingestion_patches(severity);
CREATE INDEX IF NOT EXISTS idx_ingestion_patches_status ON ingestion_patches(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_patches_priority ON ingestion_patches(patch_priority);
CREATE INDEX IF NOT EXISTS idx_ingestion_patches_asset ON ingestion_patches(asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_patches_vulnerability ON ingestion_patches(vulnerability_id);

-- Scheduling infrastructure indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_schedules_next_run ON ingestion_schedules(next_run);
CREATE INDEX IF NOT EXISTS idx_ingestion_schedules_enabled ON ingestion_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_ingestion_schedules_priority ON ingestion_schedules(priority);
CREATE INDEX IF NOT EXISTS idx_ingestion_schedules_source_system ON ingestion_schedules(source_system);
CREATE INDEX IF NOT EXISTS idx_ingestion_job_executions_schedule_id ON ingestion_job_executions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_job_executions_status ON ingestion_job_executions(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_data_freshness_table ON ingestion_data_freshness(table_name);
CREATE INDEX IF NOT EXISTS idx_ingestion_data_freshness_stale ON ingestion_data_freshness(is_stale);

-- Risk and cost management integration indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_asset_risk_mapping_asset_uuid ON ingestion_asset_risk_mapping(ingestion_asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_asset_risk_mapping_existing_asset ON ingestion_asset_risk_mapping(existing_asset_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerability_risk_scores_vuln_id ON ingestion_vulnerability_risk_scores(ingestion_vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerability_risk_scores_asset ON ingestion_vulnerability_risk_scores(ingestion_asset_uuid);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerability_costs_vuln_id ON ingestion_vulnerability_costs(ingestion_vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerability_costs_cost_center ON ingestion_vulnerability_costs(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_budget_impact_budget_id ON ingestion_budget_impact(cost_budget_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_budget_impact_priority ON ingestion_budget_impact(priority_level);

-- System-level association indexes
CREATE INDEX IF NOT EXISTS idx_system_risk_profiles_system_id ON system_risk_profiles(system_id);
CREATE INDEX IF NOT EXISTS idx_system_risk_profiles_risk_level ON system_risk_profiles(risk_level);
CREATE INDEX IF NOT EXISTS idx_system_cost_allocations_system_id ON system_cost_allocations(system_id);
CREATE INDEX IF NOT EXISTS idx_system_cost_allocations_cost_center ON system_cost_allocations(cost_center_id);
CREATE INDEX IF NOT EXISTS idx_system_cost_allocations_fiscal_year ON system_cost_allocations(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_system_policy_assignments_system_id ON system_policy_assignments(system_id);
CREATE INDEX IF NOT EXISTS idx_system_policy_assignments_policy_id ON system_policy_assignments(policy_id);
CREATE INDEX IF NOT EXISTS idx_system_policy_assignments_compliance_status ON system_policy_assignments(compliance_status);
CREATE INDEX IF NOT EXISTS idx_system_procedure_assignments_system_id ON system_procedure_assignments(system_id);
CREATE INDEX IF NOT EXISTS idx_system_procedure_assignments_procedure_id ON system_procedure_assignments(procedure_id);
CREATE INDEX IF NOT EXISTS idx_system_procedure_assignments_status ON system_procedure_assignments(implementation_status);
CREATE INDEX IF NOT EXISTS idx_system_artifact_associations_system_id ON system_artifact_associations(system_id);
CREATE INDEX IF NOT EXISTS idx_system_artifact_associations_artifact_id ON system_artifact_associations(artifact_id);
CREATE INDEX IF NOT EXISTS idx_system_artifact_associations_type ON system_artifact_associations(association_type);
CREATE INDEX IF NOT EXISTS idx_system_vulnerability_summary_system_id ON system_vulnerability_summary(system_id);
CREATE INDEX IF NOT EXISTS idx_system_vulnerability_summary_priority ON system_vulnerability_summary(remediation_priority);
CREATE INDEX IF NOT EXISTS idx_system_poam_assignments_system_id ON system_poam_assignments(system_id);
CREATE INDEX IF NOT EXISTS idx_system_poam_assignments_poam_id ON system_poam_assignments(poam_id);
CREATE INDEX IF NOT EXISTS idx_system_poam_assignments_priority ON system_poam_assignments(priority_level);

-- Ingestion tracking indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_batches_status ON ingestion_batches(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_batches_source_system ON ingestion_batches(source_system);
CREATE INDEX IF NOT EXISTS idx_ingestion_errors_batch_id ON ingestion_errors(batch_id);

-- Temporal indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_systems_created_at ON ingestion_systems(created_at);
CREATE INDEX IF NOT EXISTS idx_ingestion_assets_last_seen ON ingestion_assets(last_seen);
CREATE INDEX IF NOT EXISTS idx_ingestion_vulnerabilities_last_found ON ingestion_vulnerabilities(last_found);

-- ============================================================================
-- VIEWS FOR COMPREHENSIVE DATA ACCESS
-- ============================================================================

-- Complete System View with Assets and Controls
CREATE OR REPLACE VIEW vw_ingestion_system_overview AS
SELECT 
    s.system_id,
    s.name as system_name,
    s.status as system_status,
    s.system_type,
    s.responsible_organization,
    s.authorization_date,
    s.authorization_termination_date,
    sil.confidentiality,
    sil.integrity,
    sil.availability,
    COUNT(DISTINCT sa.asset_uuid) as total_assets,
    COUNT(DISTINCT c.id) as total_controls,
    COUNT(DISTINCT p.id) as total_poams,
    COUNT(DISTINCT v.id) as total_vulnerabilities,
    COUNT(DISTINCT CASE WHEN v.severity = 4 THEN v.id END) as critical_vulnerabilities,
    COUNT(DISTINCT CASE WHEN p.risk_rating = 'critical' THEN p.id END) as critical_poams
FROM ingestion_systems s
LEFT JOIN ingestion_system_impact_levels sil ON s.system_id = sil.system_id
LEFT JOIN ingestion_system_assets sa ON s.system_id = sa.system_id
LEFT JOIN ingestion_assets a ON sa.asset_uuid = a.asset_uuid
LEFT JOIN ingestion_controls c ON s.system_id = c.system_id
LEFT JOIN ingestion_poams p ON s.system_id = p.system_id
LEFT JOIN ingestion_vulnerabilities v ON a.asset_uuid = v.asset_uuid
GROUP BY s.system_id, s.name, s.status, s.system_type, s.responsible_organization, 
         s.authorization_date, s.authorization_termination_date,
         sil.confidentiality, sil.integrity, sil.availability;

-- Asset Vulnerability Summary
CREATE OR REPLACE VIEW vw_ingestion_asset_vulnerability_summary AS
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
    MAX(v.last_found) as last_vulnerability_scan
FROM ingestion_assets a
LEFT JOIN ingestion_system_assets sa ON a.asset_uuid = sa.asset_uuid
LEFT JOIN ingestion_systems s ON sa.system_id = s.system_id
LEFT JOIN ingestion_vulnerabilities v ON a.asset_uuid = v.asset_uuid
GROUP BY a.asset_uuid, a.hostname, a.criticality_rating, a.exposure_score, 
         a.acr_score, s.system_id, s.name;

-- POAM Progress Tracking
CREATE OR REPLACE VIEW vw_ingestion_poam_progress AS
SELECT 
    p.poam_id,
    p.system_id,
    s.name as system_name,
    p.weakness_description,
    p.risk_rating,
    p.status,
    p.scheduled_completion,
    p.cost_estimate,
    COUNT(pm.id) as total_milestones,
    COUNT(CASE WHEN pm.status = 'completed' THEN 1 END) as completed_milestones,
    COUNT(CASE WHEN pm.status = 'in_progress' THEN 1 END) as in_progress_milestones,
    COUNT(CASE WHEN pm.status = 'pending' THEN 1 END) as pending_milestones,
    ROUND((COUNT(CASE WHEN pm.status = 'completed' THEN 1 END) * 100.0 / COUNT(pm.id)), 2) as completion_percentage,
    COUNT(DISTINCT pa.asset_uuid) as affected_assets_count,
    COUNT(DISTINCT pc.cve_id) as related_cves_count
FROM ingestion_poams p
LEFT JOIN ingestion_systems s ON p.system_id = s.system_id
LEFT JOIN ingestion_poam_milestones pm ON p.poam_id = pm.poam_id
LEFT JOIN ingestion_poam_assets pa ON p.poam_id = pa.poam_id
LEFT JOIN ingestion_poam_cves pc ON p.poam_id = pc.poam_id
GROUP BY p.poam_id, p.system_id, s.name, p.weakness_description, 
         p.risk_rating, p.status, p.scheduled_completion, p.cost_estimate;

-- Patch Management Dashboard View
CREATE OR REPLACE VIEW vw_patch_management_dashboard AS
SELECT 
    ip.patch_id,
    ip.cve_id,
    v.id as vulnerability_id,
    a.hostname,
    a.criticality_rating as asset_criticality,
    s.system_id,
    s.name as system_name,
    ip.title as patch_title,
    ip.vendor,
    ip.product,
    ip.patch_priority,
    ip.status as patch_status,
    ip.severity as patch_severity,
    ip.reboot_required,
    ip.business_impact,
    v.plugin_name as vulnerability_source,
    v.cvss3_base_score,
    v.first_found as vulnerability_discovered,
    v.last_found as vulnerability_last_seen,
    v.state as vulnerability_state,
    -- Calculate days since vulnerability discovery
    CURRENT_DATE - v.first_found::date as days_since_discovery,
    -- Recommended action based on priority and age
    CASE 
        WHEN ip.patch_priority = 'EMERGENCY' AND ip.status = 'research_required' THEN 'IMMEDIATE_RESEARCH_NEEDED'
        WHEN ip.patch_priority = 'EMERGENCY' AND ip.status = 'available' THEN 'DEPLOY_IMMEDIATELY'
        WHEN ip.patch_priority = 'CRITICAL' AND (CURRENT_DATE - v.first_found::date) > 7 THEN 'OVERDUE_CRITICAL'
        WHEN ip.patch_priority = 'CRITICAL' AND ip.status = 'available' THEN 'SCHEDULE_DEPLOYMENT'
        WHEN ip.patch_priority = 'HIGH' AND (CURRENT_DATE - v.first_found::date) > 30 THEN 'OVERDUE_HIGH'
        WHEN ip.status = 'research_required' THEN 'RESEARCH_PATCH_AVAILABILITY'
        WHEN ip.status = 'available' THEN 'READY_FOR_DEPLOYMENT'
        ELSE 'MONITOR'
    END as recommended_action,
    -- SLA compliance status
    CASE 
        WHEN ip.patch_priority = 'EMERGENCY' AND (CURRENT_DATE - v.first_found::date) > 1 THEN 'SLA_BREACH'
        WHEN ip.patch_priority = 'CRITICAL' AND (CURRENT_DATE - v.first_found::date) > 3 THEN 'SLA_BREACH'
        WHEN ip.patch_priority = 'HIGH' AND (CURRENT_DATE - v.first_found::date) > 7 THEN 'SLA_BREACH'
        WHEN ip.patch_priority = 'MEDIUM' AND (CURRENT_DATE - v.first_found::date) > 30 THEN 'SLA_BREACH'
        ELSE 'WITHIN_SLA'
    END as sla_status,
    ip.applicable_to,
    ip.raw_json as patch_metadata,
    ip.created_at as patch_record_created,
    ip.updated_at as patch_record_updated
FROM ingestion_patches ip
JOIN ingestion_vulnerabilities v ON ip.vulnerability_id = v.id
JOIN ingestion_assets a ON ip.asset_uuid = a.asset_uuid
LEFT JOIN ingestion_system_assets sa ON a.asset_uuid = sa.asset_uuid
LEFT JOIN ingestion_systems s ON sa.system_id = s.system_id
ORDER BY 
    CASE ip.patch_priority
        WHEN 'EMERGENCY' THEN 1
        WHEN 'CRITICAL' THEN 2
        WHEN 'HIGH' THEN 3
        WHEN 'MEDIUM' THEN 4
        ELSE 5
    END,
    v.cvss3_base_score DESC,
    v.first_found ASC;

-- ============================================================================
-- STORED PROCEDURES FOR DATA INGESTION
-- ============================================================================

-- Function to populate ingestion patches from vulnerability data
CREATE OR REPLACE FUNCTION populate_ingestion_patches()
RETURNS TABLE(
    patches_created INTEGER,
    emergency_patches INTEGER,
    critical_patches INTEGER,
    patches_with_existing_solutions INTEGER
) AS $$
DECLARE
    created_count INTEGER := 0;
    emergency_count INTEGER := 0;
    critical_count INTEGER := 0;
    existing_solutions_count INTEGER := 0;
    vuln_record RECORD;
    patch_priority_val VARCHAR(20);
    patch_status_val VARCHAR(20);
    generated_patch_id VARCHAR(255);
BEGIN
    -- Loop through vulnerabilities requiring patches
    FOR vuln_record IN 
        SELECT DISTINCT
            v.id as vulnerability_id,
            v.asset_uuid,
            v.plugin_id,
            v.plugin_name,
            v.description as vuln_description,
            v.solution,
            v.severity,
            v.severity_name,
            v.cvss3_base_score,
            vc.cve_id,
            a.hostname,
            a.criticality_rating,
            ast.operating_system,
            ast.system_type,
            p.patch_id as existing_patch_id,
            p.title as existing_patch_title,
            p.status as existing_patch_status
        FROM ingestion_vulnerabilities v
        JOIN ingestion_assets a ON v.asset_uuid = a.asset_uuid
        LEFT JOIN ingestion_asset_systems ast ON a.asset_uuid = ast.asset_uuid AND ast.is_primary = true
        JOIN ingestion_vulnerability_cves vc ON v.id = vc.vulnerability_id
        LEFT JOIN patches p ON vc.cve_id = p.cve
        WHERE v.state = 'Open'
        AND NOT EXISTS (
            SELECT 1 FROM ingestion_patches ip 
            WHERE ip.vulnerability_id = v.id AND ip.cve_id = vc.cve_id
        )
    LOOP
        -- Determine patch priority
        patch_priority_val := CASE 
            WHEN vuln_record.severity = 4 AND vuln_record.criticality_rating = 'critical' THEN 'EMERGENCY'
            WHEN vuln_record.severity = 4 AND vuln_record.criticality_rating IN ('high', 'critical') THEN 'CRITICAL'
            WHEN vuln_record.severity = 3 AND vuln_record.criticality_rating = 'critical' THEN 'CRITICAL'
            WHEN vuln_record.severity = 4 THEN 'HIGH'
            WHEN vuln_record.severity = 3 AND vuln_record.criticality_rating = 'high' THEN 'HIGH'
            WHEN vuln_record.severity = 3 THEN 'MEDIUM'
            WHEN vuln_record.severity = 2 AND vuln_record.criticality_rating IN ('critical', 'high') THEN 'MEDIUM'
            ELSE 'LOW'
        END;
        
        -- Determine status based on existing patch availability
        IF vuln_record.existing_patch_id IS NOT NULL THEN
            patch_status_val := 'available';
            existing_solutions_count := existing_solutions_count + 1;
        ELSE
            patch_status_val := 'research_required';
        END IF;
        
        -- Generate unique patch ID
        generated_patch_id := 'ING-' || vuln_record.cve_id || '-' || vuln_record.vulnerability_id;
        
        -- Insert into ingestion_patches
        INSERT INTO ingestion_patches (
            patch_id,
            cve_id,
            vulnerability_id,
            asset_uuid,
            title,
            vendor,
            description,
            product,
            patch_type,
            severity,
            status,
            patch_description,
            patch_priority,
            business_impact,
            applicable_to,
            reboot_required,
            ingestion_source,
            raw_json
        ) VALUES (
            generated_patch_id,
            vuln_record.cve_id,
            vuln_record.vulnerability_id,
            vuln_record.asset_uuid,
            COALESCE(vuln_record.existing_patch_title, 'Security Update for ' || vuln_record.cve_id),
            CASE 
                WHEN vuln_record.operating_system ILIKE '%windows%' THEN 'Microsoft'
                WHEN vuln_record.operating_system ILIKE '%red hat%' THEN 'Red Hat'
                WHEN vuln_record.operating_system ILIKE '%ubuntu%' THEN 'Canonical'
                ELSE 'Unknown'
            END,
            COALESCE(vuln_record.solution, vuln_record.vuln_description),
            COALESCE(vuln_record.operating_system, 'Unknown'),
            'security',
            LOWER(vuln_record.severity_name),
            patch_status_val,
            vuln_record.solution,
            patch_priority_val,
            'Asset: ' || vuln_record.hostname || 
            ' (Criticality: ' || vuln_record.criticality_rating || 
            ', CVSS: ' || COALESCE(vuln_record.cvss3_base_score::TEXT, 'N/A') || ')',
            jsonb_build_object(
                'operating_system', COALESCE(vuln_record.operating_system, 'Unknown'),
                'hostname', vuln_record.hostname,
                'asset_criticality', vuln_record.criticality_rating,
                'system_type', vuln_record.system_type
            ),
            CASE 
                WHEN vuln_record.operating_system ILIKE '%windows%' THEN true
                WHEN vuln_record.plugin_name ILIKE '%kernel%' THEN true
                ELSE false
            END,
            'vulnerability_analysis',
            jsonb_build_object(
                'source_plugin', vuln_record.plugin_name,
                'plugin_id', vuln_record.plugin_id,
                'discovery_method', 'vulnerability_scan',
                'existing_patch_available', vuln_record.existing_patch_id IS NOT NULL
            )
        );
        
        created_count := created_count + 1;
        
        -- Count by priority
        IF patch_priority_val = 'EMERGENCY' THEN
            emergency_count := emergency_count + 1;
        ELSIF patch_priority_val = 'CRITICAL' THEN
            critical_count := critical_count + 1;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT created_count, emergency_count, critical_count, existing_solutions_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get pending ingestion jobs for scheduler
CREATE OR REPLACE FUNCTION get_pending_ingestion_jobs()
RETURNS TABLE(
    schedule_id INTEGER,
    source_system VARCHAR(50),
    data_type VARCHAR(50),
    update_type VARCHAR(20),
    priority INTEGER,
    next_run TIMESTAMP,
    max_runtime_minutes INTEGER,
    api_endpoint TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.source_system,
        s.data_type,
        s.update_type,
        s.priority,
        s.next_run,
        s.max_runtime_minutes,
        s.metadata->>'api_endpoint'
    FROM ingestion_schedules s
    WHERE s.enabled = true
    AND s.next_run <= NOW()
    AND s.current_retry_count < s.failure_retry_count
    ORDER BY s.priority ASC, s.next_run ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update data freshness monitoring
CREATE OR REPLACE FUNCTION update_data_freshness_monitoring()
RETURNS TABLE(
    tables_checked INTEGER,
    stale_tables INTEGER,
    critical_alerts INTEGER
) AS $$
DECLARE
    checked_count INTEGER := 0;
    stale_count INTEGER := 0;
    critical_count INTEGER := 0;
    freshness_record RECORD;
    sla_threshold INTEGER;
    hours_since_update INTEGER;
    freshness_score DECIMAL(5,2);
BEGIN
    -- Clear existing freshness data
    DELETE FROM ingestion_data_freshness WHERE measured_at < NOW() - INTERVAL '1 hour';
    
    -- Check each critical table for freshness
    FOR freshness_record IN 
        SELECT 
            table_name,
            data_source,
            sla_hours,
            last_update_col,
            count_query
        FROM (VALUES 
            ('ingestion_vulnerabilities', 'tenable', 4, 'last_found', 'SELECT COUNT(*) FROM ingestion_vulnerabilities WHERE state = ''Open'''),
            ('ingestion_assets', 'tenable', 24, 'last_seen', 'SELECT COUNT(*) FROM ingestion_assets'),
            ('ingestion_poams', 'xacta', 6, 'updated_at', 'SELECT COUNT(*) FROM ingestion_poams WHERE status != ''completed'''),
            ('ingestion_controls', 'xacta', 12, 'updated_at', 'SELECT COUNT(*) FROM ingestion_controls'),
            ('ingestion_systems', 'xacta', 168, 'updated_at', 'SELECT COUNT(*) FROM ingestion_systems'),
            ('ingestion_patches', 'vulnerability_analysis', 4, 'updated_at', 'SELECT COUNT(*) FROM ingestion_patches WHERE status != ''deployed''')
        ) AS t(table_name, data_source, sla_hours, last_update_col, count_query)
    LOOP
        checked_count := checked_count + 1;
        sla_threshold := freshness_record.sla_hours;
        
        -- Calculate freshness for this table
        IF freshness_record.table_name = 'ingestion_vulnerabilities' THEN
            SELECT EXTRACT(epoch FROM (NOW() - MAX(last_found)))/3600 INTO hours_since_update
            FROM ingestion_vulnerabilities WHERE state = 'Open';
        ELSIF freshness_record.table_name = 'ingestion_assets' THEN
            SELECT EXTRACT(epoch FROM (NOW() - MAX(last_seen)))/3600 INTO hours_since_update
            FROM ingestion_assets;
        ELSIF freshness_record.table_name = 'ingestion_poams' THEN
            SELECT EXTRACT(epoch FROM (NOW() - MAX(updated_at)))/3600 INTO hours_since_update
            FROM ingestion_poams WHERE status != 'completed';
        ELSIF freshness_record.table_name = 'ingestion_controls' THEN
            SELECT EXTRACT(epoch FROM (NOW() - MAX(updated_at)))/3600 INTO hours_since_update
            FROM ingestion_controls;
        ELSIF freshness_record.table_name = 'ingestion_systems' THEN
            SELECT EXTRACT(epoch FROM (NOW() - MAX(updated_at)))/3600 INTO hours_since_update
            FROM ingestion_systems;
        ELSIF freshness_record.table_name = 'ingestion_patches' THEN
            SELECT EXTRACT(epoch FROM (NOW() - MAX(updated_at)))/3600 INTO hours_since_update
            FROM ingestion_patches WHERE status != 'deployed';
        END IF;
        
        -- Calculate freshness score (100 = perfectly fresh, 0 = critically stale)
        hours_since_update := COALESCE(hours_since_update, 0);
        freshness_score := GREATEST(0, 100 - (hours_since_update * 100.0 / sla_threshold));
        
        -- Determine if stale
        IF hours_since_update > sla_threshold THEN
            stale_count := stale_count + 1;
            IF sla_threshold <= 6 THEN -- Critical tables
                critical_count := critical_count + 1;
            END IF;
        END IF;
        
        -- Insert freshness record
        INSERT INTO ingestion_data_freshness (
            table_name, data_source, last_update, record_count, 
            freshness_score, sla_threshold_hours, is_stale
        ) VALUES (
            freshness_record.table_name,
            freshness_record.data_source,
            NOW() - (hours_since_update || ' hours')::INTERVAL,
            0, -- Will be updated with actual count
            freshness_score,
            sla_threshold,
            hours_since_update > sla_threshold
        );
    END LOOP;
    
    RETURN QUERY SELECT checked_count, stale_count, critical_count;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically map ingested assets to existing assets and assign system associations
CREATE OR REPLACE FUNCTION auto_map_assets_to_systems()
RETURNS TABLE(
    mapped_count INTEGER,
    new_system_assignments INTEGER,
    confidence_above_90 INTEGER
) AS $$
DECLARE
    mapped_assets INTEGER := 0;
    system_assignments INTEGER := 0;
    high_confidence INTEGER := 0;
    asset_record RECORD;
    existing_asset_id INTEGER;
    system_id INTEGER;
    mapping_confidence DECIMAL(3,2);
BEGIN
    -- Process unmapped ingested assets
    FOR asset_record IN 
        SELECT DISTINCT ia.uuid, ia.hostname, ia.ip_address, ia.fqdn, ia.operating_system, ia.system_uuid
        FROM ingestion_assets ia
        LEFT JOIN ingestion_asset_risk_mapping arm ON ia.uuid = arm.ingestion_asset_uuid
        WHERE arm.id IS NULL
        AND ia.uuid IS NOT NULL
    LOOP
        -- Try to find matching existing asset
        existing_asset_id := NULL;
        mapping_confidence := 0.0;
        
        -- High confidence match on hostname + IP
        IF asset_record.hostname IS NOT NULL AND asset_record.ip_address IS NOT NULL THEN
            SELECT a.id INTO existing_asset_id
            FROM assets a
            WHERE LOWER(a.hostname) = LOWER(asset_record.hostname)
            AND a.ip_address = asset_record.ip_address
            LIMIT 1;
            
            IF existing_asset_id IS NOT NULL THEN
                mapping_confidence := 0.95;
            END IF;
        END IF;
        
        -- Medium confidence match on FQDN
        IF existing_asset_id IS NULL AND asset_record.fqdn IS NOT NULL THEN
            SELECT a.id INTO existing_asset_id
            FROM assets a
            WHERE LOWER(a.fqdn) = LOWER(asset_record.fqdn)
            LIMIT 1;
            
            IF existing_asset_id IS NOT NULL THEN
                mapping_confidence := 0.80;
            END IF;
        END IF;
        
        -- Lower confidence match on hostname only
        IF existing_asset_id IS NULL AND asset_record.hostname IS NOT NULL THEN
            SELECT a.id INTO existing_asset_id
            FROM assets a
            WHERE LOWER(a.hostname) = LOWER(asset_record.hostname)
            LIMIT 1;
            
            IF existing_asset_id IS NOT NULL THEN
                mapping_confidence := 0.70;
            END IF;
        END IF;
        
        -- Create mapping if found
        IF existing_asset_id IS NOT NULL AND mapping_confidence >= 0.70 THEN
            INSERT INTO ingestion_asset_risk_mapping (
                ingestion_asset_uuid, existing_asset_id, mapping_confidence,
                mapping_method, mapping_criteria
            ) VALUES (
                asset_record.uuid, existing_asset_id, mapping_confidence,
                'automatic',
                jsonb_build_object(
                    'hostname_match', asset_record.hostname,
                    'ip_match', asset_record.ip_address,
                    'fqdn_match', asset_record.fqdn,
                    'confidence_score', mapping_confidence
                )
            );
            
            mapped_assets := mapped_assets + 1;
            
            IF mapping_confidence >= 0.90 THEN
                high_confidence := high_confidence + 1;
            END IF;
        END IF;
        
        -- Find and assign system association
        IF asset_record.system_uuid IS NOT NULL THEN
            SELECT s.id INTO system_id
            FROM ingestion_systems s
            WHERE s.uuid = asset_record.system_uuid
            LIMIT 1;
            
            IF system_id IS NOT NULL THEN
                system_assignments := system_assignments + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT mapped_assets, system_assignments, high_confidence;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate system-level vulnerability summary
CREATE OR REPLACE FUNCTION update_system_vulnerability_summary(target_system_id INTEGER DEFAULT NULL)
RETURNS TABLE(
    systems_updated INTEGER,
    total_vulnerabilities INTEGER,
    critical_vulnerabilities INTEGER
) AS $$
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
$$ LANGUAGE plpgsql;

-- Function to calculate system risk profiles based on vulnerabilities and assets
CREATE OR REPLACE FUNCTION calculate_system_risk_profiles(target_system_id INTEGER DEFAULT NULL)
RETURNS TABLE(
    systems_processed INTEGER,
    high_risk_systems INTEGER,
    critical_risk_systems INTEGER
) AS $$
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
$$ LANGUAGE plpgsql;

-- Function to create new ingestion batch
CREATE OR REPLACE FUNCTION create_ingestion_batch(
    p_source_system VARCHAR(50),
    p_batch_type VARCHAR(50),
    p_file_name VARCHAR(255) DEFAULT NULL,
    p_created_by INTEGER DEFAULT NULL
) RETURNS UUID AS $$
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
$$ LANGUAGE plpgsql;

-- Function to complete ingestion batch
CREATE OR REPLACE FUNCTION complete_ingestion_batch(
    p_batch_id UUID,
    p_total_records INTEGER,
    p_successful_records INTEGER,
    p_failed_records INTEGER,
    p_status VARCHAR(50) DEFAULT 'completed'
) RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE ingestion_systems IS 'Top-level systems from Xacta containing authorization boundaries and ownership';
COMMENT ON TABLE ingestion_assets IS 'IT assets discovered by Tenable, mapped to systems';
COMMENT ON TABLE ingestion_vulnerabilities IS 'Security vulnerabilities found by Tenable scans';
COMMENT ON TABLE ingestion_controls IS 'Security controls implementation status from Xacta assessments';
COMMENT ON TABLE ingestion_poams IS 'Plan of Action and Milestones for addressing security weaknesses';
COMMENT ON TABLE ingestion_batches IS 'Tracking table for data ingestion processes';

-- ============================================================================
-- DASHBOARD SQL VIEWS
-- ============================================================================

-- System Dashboard View
CREATE OR REPLACE VIEW dashboard_systems_view AS
SELECT 
    s.id as system_id,
    s.name as system_name,
    s.description as system_description,
    s.classification_level,
    s.system_type,
    s.status as system_status,
    s.owner_organization,
    s.technical_poc,
    s.system_manager,
    s.authorization_status,
    s.ato_date,
    s.ato_expiration_date,
    CASE 
        WHEN s.ato_expiration_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN s.ato_expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'EXPIRING_SOON'
        ELSE 'CURRENT'
    END as ato_status_indicator,
    -- Asset counts
    COALESCE(asset_stats.total_assets, 0) as total_assets,
    COALESCE(asset_stats.critical_assets, 0) as critical_assets,
    COALESCE(asset_stats.online_assets, 0) as online_assets,
    -- Vulnerability summary
    COALESCE(vuln_summary.total_count, 0) as total_vulnerabilities,
    COALESCE(vuln_summary.critical_count, 0) as critical_vulnerabilities,
    COALESCE(vuln_summary.high_count, 0) as high_vulnerabilities,
    COALESCE(vuln_summary.medium_count, 0) as medium_vulnerabilities,
    COALESCE(vuln_summary.low_count, 0) as low_vulnerabilities,
    vuln_summary.highest_cvss_score,
    vuln_summary.average_cvss_score,
    vuln_summary.remediation_priority,
    vuln_summary.estimated_remediation_cost,
    -- Risk assessment
    COALESCE(risk_profile.overall_risk_score, 0.0) as risk_score,
    COALESCE(risk_profile.risk_level, 'NOT_ASSESSED') as risk_level,
    risk_profile.last_assessment_date,
    risk_profile.next_assessment_due,
    -- Cost allocation
    COALESCE(cost_alloc.allocated_budget, 0.0) as current_year_budget,
    COALESCE(cost_alloc.actual_spent, 0.0) as current_year_spent,
    CASE 
        WHEN cost_alloc.allocated_budget > 0 THEN 
            ROUND((cost_alloc.actual_spent / cost_alloc.allocated_budget * 100), 2)
        ELSE 0
    END as budget_utilization_percent,
    -- POAM counts
    COALESCE(poam_stats.total_poams, 0) as total_poams,
    COALESCE(poam_stats.overdue_poams, 0) as overdue_poams,
    COALESCE(poam_stats.critical_poams, 0) as critical_poams,
    -- Compliance status
    COALESCE(compliance_stats.total_controls, 0) as total_controls,
    COALESCE(compliance_stats.implemented_controls, 0) as implemented_controls,
    COALESCE(compliance_stats.not_implemented_controls, 0) as not_implemented_controls,
    CASE 
        WHEN compliance_stats.total_controls > 0 THEN 
            ROUND((compliance_stats.implemented_controls::DECIMAL / compliance_stats.total_controls * 100), 2)
        ELSE 0
    END as compliance_percentage,
    s.created_at,
    s.updated_at
FROM ingestion_systems s
-- Asset statistics
LEFT JOIN (
    SELECT 
        system_uuid,
        COUNT(*) as total_assets,
        COUNT(*) FILTER (WHERE criticality_level = 'Critical') as critical_assets,
        COUNT(*) FILTER (WHERE status = 'Online') as online_assets
    FROM ingestion_assets 
    GROUP BY system_uuid
) asset_stats ON s.uuid = asset_stats.system_uuid
-- Vulnerability summary
LEFT JOIN system_vulnerability_summary vuln_summary ON s.id = vuln_summary.system_id
-- Risk profiles
LEFT JOIN system_risk_profiles risk_profile ON s.id = risk_profile.system_id
-- Cost allocations (current fiscal year)
LEFT JOIN (
    SELECT 
        system_id,
        SUM(allocated_budget) as allocated_budget,
        SUM(actual_spent) as actual_spent
    FROM system_cost_allocations 
    WHERE fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY system_id
) cost_alloc ON s.id = cost_alloc.system_id
-- POAM statistics
LEFT JOIN (
    SELECT 
        spa.system_id,
        COUNT(*) as total_poams,
        COUNT(*) FILTER (WHERE ip.milestone_date < CURRENT_DATE AND ip.status != 'completed') as overdue_poams,
        COUNT(*) FILTER (WHERE spa.priority_level = 1) as critical_poams
    FROM system_poam_assignments spa
    JOIN ingestion_poams ip ON spa.poam_id = ip.id
    GROUP BY spa.system_id
) poam_stats ON s.id = poam_stats.system_id
-- Compliance statistics
LEFT JOIN (
    SELECT 
        ia.system_uuid,
        COUNT(ic.*) as total_controls,
        COUNT(*) FILTER (WHERE ic.implementation_status = 'implemented') as implemented_controls,
        COUNT(*) FILTER (WHERE ic.implementation_status = 'not_implemented') as not_implemented_controls
    FROM ingestion_controls ic
    JOIN ingestion_assets ia ON ic.asset_uuid = ia.uuid
    GROUP BY ia.system_uuid
) compliance_stats ON s.uuid = compliance_stats.system_uuid;

-- Vulnerability Dashboard View
CREATE OR REPLACE VIEW dashboard_vulnerabilities_view AS
SELECT 
    v.id as vulnerability_id,
    v.plugin_id,
    v.vulnerability_name,
    v.severity,
    v.cvss_score,
    v.cvss_vector,
    v.description,
    v.solution,
    v.state,
    v.first_found,
    v.last_found,
    v.asset_uuid,
    a.hostname,
    a.ip_address,
    a.operating_system,
    a.system_uuid,
    s.name as system_name,
    s.classification_level,
    -- CVE information
    STRING_AGG(DISTINCT vc.cve_id, ', ' ORDER BY vc.cve_id) as cve_ids,
    COUNT(DISTINCT vc.cve_id) as cve_count,
    -- Risk scoring
    COALESCE(vrs.adjusted_score, v.cvss_score) as risk_adjusted_score,
    vrs.business_impact,
    vrs.exploit_likelihood,
    vrs.mitigation_difficulty,
    vrs.ai_confidence,
    -- Cost analysis
    vc_cost.remediation_cost,
    vc_cost.business_impact_cost,
    vc_cost.downtime_cost_per_hour,
    vc_cost.expected_downtime_hours,
    -- Patch information
    p.patch_id,
    p.patch_name,
    p.patch_status,
    p.patch_priority,
    p.estimated_install_time,
    p.requires_reboot,
    -- Age calculations
    EXTRACT(days FROM (CURRENT_DATE - v.first_found::date)) as days_since_discovery,
    CASE 
        WHEN v.severity = 'Critical' AND EXTRACT(days FROM (CURRENT_DATE - v.first_found::date)) > 15 THEN 'OVERDUE'
        WHEN v.severity = 'High' AND EXTRACT(days FROM (CURRENT_DATE - v.first_found::date)) > 30 THEN 'OVERDUE'
        WHEN v.severity = 'Medium' AND EXTRACT(days FROM (CURRENT_DATE - v.first_found::date)) > 90 THEN 'OVERDUE'
        ELSE 'WITHIN_SLA'
    END as remediation_sla_status,
    -- Priority scoring
    CASE 
        WHEN v.severity = 'Critical' AND s.classification_level IN ('TOP SECRET', 'SECRET') THEN 1
        WHEN v.severity = 'Critical' THEN 2
        WHEN v.severity = 'High' AND s.classification_level IN ('TOP SECRET', 'SECRET') THEN 2
        WHEN v.severity = 'High' THEN 3
        ELSE 4
    END as remediation_priority,
    v.created_at,
    v.updated_at
FROM ingestion_vulnerabilities v
JOIN ingestion_assets a ON v.asset_uuid = a.uuid
LEFT JOIN ingestion_systems s ON a.system_uuid = s.uuid
-- CVE mappings
LEFT JOIN ingestion_vulnerability_cves vc ON v.id = vc.vulnerability_id
-- Risk scores
LEFT JOIN ingestion_vulnerability_risk_scores vrs ON v.id = vrs.ingestion_vulnerability_id
-- Cost analysis
LEFT JOIN ingestion_vulnerability_costs vc_cost ON v.id = vc_cost.ingestion_vulnerability_id
-- Patch information
LEFT JOIN ingestion_patches p ON v.id = p.vulnerability_id
WHERE v.state = 'Open'
GROUP BY 
    v.id, v.plugin_id, v.vulnerability_name, v.severity, v.cvss_score, v.cvss_vector,
    v.description, v.solution, v.state, v.first_found, v.last_found, v.asset_uuid,
    a.hostname, a.ip_address, a.operating_system, a.system_uuid, s.name, s.classification_level,
    vrs.adjusted_score, vrs.business_impact, vrs.exploit_likelihood, vrs.mitigation_difficulty, vrs.ai_confidence,
    vc_cost.remediation_cost, vc_cost.business_impact_cost, vc_cost.downtime_cost_per_hour, vc_cost.expected_downtime_hours,
    p.patch_id, p.patch_name, p.patch_status, p.patch_priority, p.estimated_install_time, p.requires_reboot,
    v.created_at, v.updated_at;

-- POAM Dashboard View
CREATE OR REPLACE VIEW dashboard_poams_view AS
SELECT 
    p.id as poam_id,
    p.poam_number,
    p.title,
    p.description,
    p.weakness_description,
    p.status,
    p.priority_level,
    p.milestone_date,
    p.scheduled_completion_date,
    p.actual_completion_date,
    p.responsible_entity,
    p.resources_required,
    p.estimated_cost,
    p.source_assessment,
    p.weakness_detection_source,
    -- System associations
    s.name as assigned_system_name,
    s.classification_level as system_classification,
    spa.assignment_reason,
    spa.budget_impact as system_budget_impact,
    spa.estimated_completion_date as system_estimated_completion,
    -- Status calculations
    CASE 
        WHEN p.status = 'completed' THEN 'COMPLETED'
        WHEN p.milestone_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN p.milestone_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'DUE_SOON'
        ELSE 'ON_TRACK'
    END as status_indicator,
    -- Time calculations
    EXTRACT(days FROM (CURRENT_DATE - p.created_at::date)) as days_since_created,
    CASE 
        WHEN p.milestone_date IS NOT NULL THEN 
            EXTRACT(days FROM (p.milestone_date - CURRENT_DATE))
        ELSE NULL
    END as days_until_due,
    CASE 
        WHEN p.actual_completion_date IS NOT NULL AND p.milestone_date IS NOT NULL THEN
            EXTRACT(days FROM (p.actual_completion_date - p.milestone_date))
        ELSE NULL
    END as days_variance_from_planned,
    -- Related vulnerability counts
    COALESCE(vuln_counts.total_vulnerabilities, 0) as related_vulnerabilities,
    COALESCE(vuln_counts.critical_vulnerabilities, 0) as related_critical_vulnerabilities,
    COALESCE(vuln_counts.open_vulnerabilities, 0) as related_open_vulnerabilities,
    -- Control implementation status
    COALESCE(control_counts.total_controls, 0) as related_controls,
    COALESCE(control_counts.implemented_controls, 0) as implemented_controls,
    -- Cost and resource analysis
    CASE 
        WHEN p.estimated_cost > 0 AND spa.budget_impact > 0 THEN
            ROUND((spa.budget_impact / p.estimated_cost * 100), 2)
        ELSE 0
    END as budget_impact_percentage,
    -- Risk assessment
    CASE 
        WHEN p.priority_level = 1 AND p.milestone_date < CURRENT_DATE THEN 'CRITICAL_OVERDUE'
        WHEN p.priority_level = 1 THEN 'CRITICAL'
        WHEN p.priority_level = 2 AND p.milestone_date < CURRENT_DATE THEN 'HIGH_OVERDUE'
        WHEN p.priority_level = 2 THEN 'HIGH'
        WHEN p.milestone_date < CURRENT_DATE THEN 'MEDIUM_OVERDUE'
        ELSE 'MEDIUM'
    END as risk_assessment,
    p.created_at,
    p.updated_at
FROM ingestion_poams p
-- System assignments
LEFT JOIN system_poam_assignments spa ON p.id = spa.poam_id
LEFT JOIN ingestion_systems s ON spa.system_id = s.id
-- Related vulnerability counts
LEFT JOIN (
    SELECT 
        poam_id,
        COUNT(*) as total_vulnerabilities,
        COUNT(*) FILTER (WHERE severity = 'Critical') as critical_vulnerabilities,
        COUNT(*) FILTER (WHERE state = 'Open') as open_vulnerabilities
    FROM ingestion_vulnerabilities v
    WHERE v.poam_id IS NOT NULL
    GROUP BY poam_id
) vuln_counts ON p.id = vuln_counts.poam_id
-- Related control counts
LEFT JOIN (
    SELECT 
        poam_id,
        COUNT(*) as total_controls,
        COUNT(*) FILTER (WHERE implementation_status = 'implemented') as implemented_controls
    FROM ingestion_controls c
    WHERE c.poam_id IS NOT NULL
    GROUP BY poam_id
) control_counts ON p.id = control_counts.poam_id;

-- Compliance Dashboard View
CREATE OR REPLACE VIEW dashboard_compliance_view AS
SELECT 
    c.id as control_id,
    c.control_identifier,
    c.control_name,
    c.control_family,
    c.implementation_status,
    c.assessment_status,
    c.control_effectiveness,
    c.testing_frequency,
    c.last_assessment_date,
    c.next_assessment_date,
    c.assessment_method,
    c.evidence_location,
    c.notes,
    -- Asset and system information
    a.hostname,
    a.ip_address,
    a.system_uuid,
    s.name as system_name,
    s.classification_level,
    s.authorization_status,
    s.ato_date,
    s.ato_expiration_date,
    -- System policy assignments
    spa.compliance_status as policy_compliance_status,
    spa.assignment_type as policy_assignment_type,
    spa.implementation_date as policy_implementation_date,
    spa.next_review_date as policy_next_review,
    -- Compliance framework mapping
    cf.name as framework_name,
    cf.version as framework_version,
    cf.agency as framework_agency,
    ccm.requirement_id,
    ccm.requirement_text,
    ccm.implementation_guidance,
    -- Assessment status calculations
    CASE 
        WHEN c.assessment_status = 'passed' THEN 'COMPLIANT'
        WHEN c.assessment_status = 'failed' THEN 'NON_COMPLIANT'
        WHEN c.assessment_status = 'not_applicable' THEN 'NOT_APPLICABLE'
        WHEN c.last_assessment_date IS NULL THEN 'NOT_ASSESSED'
        WHEN c.last_assessment_date < CURRENT_DATE - INTERVAL '365 days' THEN 'ASSESSMENT_OVERDUE'
        ELSE 'ASSESSED'
    END as compliance_status_indicator,
    -- Time-based indicators
    CASE 
        WHEN c.next_assessment_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN c.next_assessment_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'DUE_SOON'
        ELSE 'ON_SCHEDULE'
    END as assessment_schedule_status,
    EXTRACT(days FROM (CURRENT_DATE - c.last_assessment_date)) as days_since_last_assessment,
    CASE 
        WHEN c.next_assessment_date IS NOT NULL THEN 
            EXTRACT(days FROM (c.next_assessment_date - CURRENT_DATE))
        ELSE NULL
    END as days_until_next_assessment,
    -- Implementation tracking
    CASE 
        WHEN c.implementation_status = 'implemented' AND c.assessment_status = 'passed' THEN 'FULLY_COMPLIANT'
        WHEN c.implementation_status = 'implemented' AND c.assessment_status = 'failed' THEN 'IMPLEMENTED_BUT_FAILING'
        WHEN c.implementation_status = 'partially_implemented' THEN 'PARTIALLY_IMPLEMENTED'
        WHEN c.implementation_status = 'not_implemented' THEN 'NOT_IMPLEMENTED'
        ELSE 'UNKNOWN_STATUS'
    END as implementation_compliance_status,
    -- Risk-based prioritization
    CASE 
        WHEN s.classification_level = 'TOP SECRET' AND c.assessment_status = 'failed' THEN 1
        WHEN s.classification_level = 'SECRET' AND c.assessment_status = 'failed' THEN 2
        WHEN c.assessment_status = 'failed' THEN 3
        WHEN c.next_assessment_date < CURRENT_DATE THEN 4
        ELSE 5
    END as compliance_priority,
    -- Related vulnerabilities and POAMs
    COALESCE(related_vulns.vulnerability_count, 0) as related_vulnerabilities,
    COALESCE(related_poams.poam_count, 0) as related_poams,
    c.created_at,
    c.updated_at
FROM ingestion_controls c
JOIN ingestion_assets a ON c.asset_uuid = a.uuid
LEFT JOIN ingestion_systems s ON a.system_uuid = s.uuid
-- Policy assignments
LEFT JOIN system_policy_assignments spa ON s.id = spa.system_id
LEFT JOIN policies pol ON spa.policy_id = pol.id
-- Compliance framework mapping
LEFT JOIN compliance_control_mappings ccm ON c.control_identifier = ccm.control_id
LEFT JOIN compliance_frameworks cf ON ccm.framework_id = cf.id
-- Related vulnerabilities
LEFT JOIN (
    SELECT 
        control_id,
        COUNT(*) as vulnerability_count
    FROM ingestion_vulnerabilities v
    WHERE v.control_id IS NOT NULL
    GROUP BY control_id
) related_vulns ON c.id = related_vulns.control_id
-- Related POAMs
LEFT JOIN (
    SELECT 
        control_id,
        COUNT(*) as poam_count
    FROM ingestion_poams p
    WHERE p.control_id IS NOT NULL
    GROUP BY control_id
) related_poams ON c.id = related_poams.control_id;

-- Schema creation complete
SELECT 'Comprehensive ingestion database schema with dashboard views created successfully' as status;