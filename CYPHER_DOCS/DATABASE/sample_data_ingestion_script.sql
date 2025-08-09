-- Sample Data Ingestion Script
-- This script demonstrates how to ingest the JSON data from the /injestion folder
-- into the hierarchical database schema

-- ============================================================================
-- STEP 1: Create Ingestion Batch
-- ============================================================================

-- Start a new ingestion batch for systems data
INSERT INTO ingestion_batches (source_system, batch_type, file_name, total_records, status)
VALUES ('xacta', 'systems', 'xacta_systems_sample.json', 5, 'in_progress')
RETURNING batch_id;

-- For this example, we'll use a specific batch_id
-- In production, capture the returned UUID from above

-- ============================================================================
-- STEP 2: Ingest Systems Data (Level 1 - Root Hierarchy)
-- ============================================================================

-- Insert systems from xacta_systems_sample.json
INSERT INTO ingestion_systems (
    system_id, name, uuid, status, authorization_boundary, system_type,
    responsible_organization, system_owner, information_system_security_officer,
    authorizing_official, last_assessment_date, authorization_date,
    authorization_termination_date, ingestion_source, raw_json
) VALUES
-- SYS-ENT-001: Enterprise Web Infrastructure
('SYS-ENT-001', 'Enterprise Web Infrastructure', 
 'ent-web-12345678-1234-1234-1234-123456789001'::uuid,
 'operational', 'Internal Corporate Network - Web Services', 'Major Application',
 'IT Security Department', 'John Smith', 'Jane Doe', 'Michael Johnson',
 '2024-03-15T00:00:00.000Z'::timestamp, '2024-04-01T00:00:00.000Z'::timestamp,
 '2027-04-01T00:00:00.000Z'::timestamp, 'xacta',
 '{"id": "SYS-ENT-001", "name": "Enterprise Web Infrastructure", "status": "operational"}'::jsonb),

-- SYS-ENT-002: Active Directory Domain Services
('SYS-ENT-002', 'Active Directory Domain Services',
 'ent-ad-12345678-1234-1234-1234-123456789002'::uuid,
 'operational', 'Internal Corporate Network - Identity Management', 'General Support System',
 'IT Infrastructure Team', 'Robert Wilson', 'Jane Doe', 'Michael Johnson',
 '2024-02-20T00:00:00.000Z'::timestamp, '2024-03-10T00:00:00.000Z'::timestamp,
 '2027-03-10T00:00:00.000Z'::timestamp, 'xacta',
 '{"id": "SYS-ENT-002", "name": "Active Directory Domain Services", "status": "operational"}'::jsonb),

-- SYS-ENT-003: Enterprise Database Systems
('SYS-ENT-003', 'Enterprise Database Systems',
 'ent-db-12345678-1234-1234-1234-123456789003'::uuid,
 'operational', 'Internal Corporate Network - Database Tier', 'Major Application',
 'Database Administration Team', 'Sarah Davis', 'Jane Doe', 'Michael Johnson',
 '2024-01-30T00:00:00.000Z'::timestamp, '2024-02-15T00:00:00.000Z'::timestamp,
 '2027-02-15T00:00:00.000Z'::timestamp, 'xacta',
 '{"id": "SYS-ENT-003", "name": "Enterprise Database Systems", "status": "operational"}'::jsonb),

-- SYS-ENT-004: Network Infrastructure
('SYS-ENT-004', 'Network Infrastructure',
 'ent-net-12345678-1234-1234-1234-123456789004'::uuid,
 'operational', 'Corporate Network Perimeter and Internal Routing', 'General Support System',
 'Network Operations Center', 'David Martinez', 'Jane Doe', 'Michael Johnson',
 '2024-04-10T00:00:00.000Z'::timestamp, '2024-05-01T00:00:00.000Z'::timestamp,
 '2027-05-01T00:00:00.000Z'::timestamp, 'xacta',
 '{"id": "SYS-ENT-004", "name": "Network Infrastructure", "status": "operational"}'::jsonb),

-- SYS-ENT-005: Enterprise Resource Planning System
('SYS-ENT-005', 'Enterprise Resource Planning System',
 'ent-erp-12345678-1234-1234-1234-123456789005'::uuid,
 'operational', 'ERP Application Environment - Finance and HR', 'Major Application',
 'Business Applications Team', 'Lisa Anderson', 'Jane Doe', 'Michael Johnson',
 '2024-05-20T00:00:00.000Z'::timestamp, '2024-06-01T00:00:00.000Z'::timestamp,
 '2027-06-01T00:00:00.000Z'::timestamp, 'xacta',
 '{"id": "SYS-ENT-005", "name": "Enterprise Resource Planning System", "status": "operational"}'::jsonb);

-- Insert system impact levels
INSERT INTO ingestion_system_impact_levels (system_id, confidentiality, integrity, availability) VALUES
('SYS-ENT-001', 'moderate', 'moderate', 'low'),
('SYS-ENT-002', 'high', 'high', 'moderate'),
('SYS-ENT-003', 'high', 'high', 'moderate'),
('SYS-ENT-004', 'moderate', 'moderate', 'high'),
('SYS-ENT-005', 'high', 'high', 'moderate');

-- ============================================================================
-- STEP 3: Ingest Assets Data (Level 2 - System Components)
-- ============================================================================

-- Insert key assets from tenable_assets_sample.json
INSERT INTO ingestion_assets (
    asset_uuid, hostname, netbios_name, has_agent, has_plugin_results,
    first_seen, last_seen, exposure_score, acr_score, criticality_rating,
    ingestion_source, raw_json
) VALUES
-- Domain Controller
('12345678-1234-1234-1234-123456789001'::uuid, 'dc01.enterprise.local', 'DC01',
 true, true, '2024-01-15T10:30:00.000Z'::timestamp, '2024-06-13T14:22:15.000Z'::timestamp,
 950, 9.5, 'critical', 'tenable',
 '{"id": "12345678-1234-1234-1234-123456789001", "hostname": "dc01.enterprise.local", "system_type": ["domain-controller"]}'::jsonb),

-- Web Server
('12345678-1234-1234-1234-123456789002'::uuid, 'web01.enterprise.local', 'WEB01',
 true, true, '2024-01-16T08:15:00.000Z'::timestamp, '2024-06-13T12:45:30.000Z'::timestamp,
 780, 8.2, 'high', 'tenable',
 '{"id": "12345678-1234-1234-1234-123456789002", "hostname": "web01.enterprise.local", "system_type": ["web-server"]}'::jsonb),

-- Database Server
('12345678-1234-1234-1234-123456789003'::uuid, 'db01.enterprise.local', 'DB01',
 true, true, '2024-01-18T14:20:00.000Z'::timestamp, '2024-06-13T16:10:45.000Z'::timestamp,
 890, 9.1, 'critical', 'tenable',
 '{"id": "12345678-1234-1234-1234-123456789003", "hostname": "db01.enterprise.local", "system_type": ["database-server"]}'::jsonb),

-- Firewall
('12345678-1234-1234-1234-123456789004'::uuid, 'fw01.enterprise.local', 'FW01',
 false, true, '2024-02-01T09:30:00.000Z'::timestamp, '2024-06-13T11:20:15.000Z'::timestamp,
 650, 7.8, 'high', 'tenable',
 '{"id": "12345678-1234-1234-1234-123456789004", "hostname": "fw01.enterprise.local", "system_type": ["firewall"]}'::jsonb),

-- DNS Server
('12345678-1234-1234-1234-123456789012'::uuid, 'dns01.enterprise.local', 'DNS01',
 true, true, '2024-03-15T09:15:00.000Z'::timestamp, '2024-06-13T16:20:15.000Z'::timestamp,
 710, 7.8, 'high', 'tenable',
 '{"id": "12345678-1234-1234-1234-123456789012", "hostname": "dns01.enterprise.local", "system_type": ["dns-server"]}'::jsonb);

-- Insert asset network information
INSERT INTO ingestion_asset_network (asset_uuid, fqdn, ipv4_address, mac_address, is_primary) VALUES
('12345678-1234-1234-1234-123456789001'::uuid, 'dc01.enterprise.local', '10.0.1.10'::inet, '00:50:56:a1:b2:c3'::macaddr, true),
('12345678-1234-1234-1234-123456789002'::uuid, 'web01.enterprise.local', '10.0.2.100'::inet, '00:50:56:a2:b3:c4'::macaddr, true),
('12345678-1234-1234-1234-123456789003'::uuid, 'db01.enterprise.local', '10.0.3.50'::inet, '00:50:56:a3:b4:c5'::macaddr, true),
('12345678-1234-1234-1234-123456789004'::uuid, 'fw01.enterprise.local', '10.0.0.1'::inet, '00:1a:2b:3c:4d:5e'::macaddr, true),
('12345678-1234-1234-1234-123456789012'::uuid, 'dns01.enterprise.local', '10.0.1.53'::inet, '00:50:56:aa:bb:cc'::macaddr, true);

-- Insert asset system types
INSERT INTO ingestion_asset_systems (asset_uuid, operating_system, system_type, is_primary) VALUES
('12345678-1234-1234-1234-123456789001'::uuid, 'Windows Server 2019 Standard', 'domain-controller', true),
('12345678-1234-1234-1234-123456789002'::uuid, 'Ubuntu Server 22.04.3 LTS', 'web-server', true),
('12345678-1234-1234-1234-123456789003'::uuid, 'Red Hat Enterprise Linux 8.6', 'database-server', true),
('12345678-1234-1234-1234-123456789004'::uuid, 'Cisco ASA 9.16', 'firewall', true),
('12345678-1234-1234-1234-123456789012'::uuid, 'Windows Server 2019 Standard', 'dns-server', true);

-- Insert asset tags
INSERT INTO ingestion_asset_tags (asset_uuid, tag_key, tag_value) VALUES
('12345678-1234-1234-1234-123456789001'::uuid, 'Environment', 'Production'),
('12345678-1234-1234-1234-123456789001'::uuid, 'Role', 'Domain Controller'),
('12345678-1234-1234-1234-123456789001'::uuid, 'Criticality', 'Critical'),
('12345678-1234-1234-1234-123456789002'::uuid, 'Environment', 'Production'),
('12345678-1234-1234-1234-123456789002'::uuid, 'Role', 'Web Server'),
('12345678-1234-1234-1234-123456789002'::uuid, 'Criticality', 'High'),
('12345678-1234-1234-1234-123456789003'::uuid, 'Environment', 'Production'),
('12345678-1234-1234-1234-123456789003'::uuid, 'Role', 'Database Server'),
('12345678-1234-1234-1234-123456789003'::uuid, 'Criticality', 'Critical');

-- Map assets to systems
INSERT INTO ingestion_system_assets (system_id, asset_uuid, assignment_type) VALUES
('SYS-ENT-001', '12345678-1234-1234-1234-123456789002'::uuid, 'direct'), -- Web server to Web Infrastructure
('SYS-ENT-002', '12345678-1234-1234-1234-123456789001'::uuid, 'direct'), -- DC to AD Domain Services
('SYS-ENT-002', '12345678-1234-1234-1234-123456789012'::uuid, 'direct'), -- DNS to AD Domain Services
('SYS-ENT-003', '12345678-1234-1234-1234-123456789003'::uuid, 'direct'), -- Database to Database Systems
('SYS-ENT-004', '12345678-1234-1234-1234-123456789004'::uuid, 'direct'); -- Firewall to Network Infrastructure

-- ============================================================================
-- STEP 4: Ingest Vulnerabilities Data (Level 3 - Asset-Specific)
-- ============================================================================

-- Insert critical vulnerabilities from tenable_vulnerabilities_sample.json
INSERT INTO ingestion_vulnerabilities (
    asset_uuid, plugin_id, plugin_name, plugin_family, severity, severity_name,
    cvss_base_score, cvss3_base_score, description, solution, risk_factor,
    first_found, last_found, state, ingestion_source, raw_json
) VALUES
-- MS17-010 on Domain Controller
('12345678-1234-1234-1234-123456789001'::uuid, 51192,
 'MS17-010: Security Update for Microsoft Windows SMB Server (4013389) (ETERNALBLUE)',
 'Windows : Microsoft Bulletins', 4, 'Critical', 9.3, 8.1,
 'The remote Windows host is missing security update 4013389. It is, therefore, affected by multiple vulnerabilities in the Microsoft Server Message Block 1.0 (SMBv1) server.',
 'Apply Microsoft security update 4013389.',
 'Critical', '2024-06-13T14:22:15.000Z'::timestamp, '2024-06-13T14:22:15.000Z'::timestamp,
 'Open', 'tenable',
 '{"plugin_id": 51192, "cve": ["CVE-2017-0143", "CVE-2017-0144", "CVE-2017-0145", "CVE-2017-0146", "CVE-2017-0147", "CVE-2017-0148"]}'::jsonb),

-- Apache vulnerabilities on Web Server
('12345678-1234-1234-1234-123456789002'::uuid, 144228,
 'Apache HTTP Server 2.4.x < 2.4.51 Multiple Vulnerabilities',
 'Web Servers', 4, 'Critical', 9.8, 9.8,
 'The version of Apache HTTP Server installed on the remote host is prior to 2.4.51. It is, therefore, affected by multiple vulnerabilities including a buffer overflow that could lead to remote code execution.',
 'Upgrade to Apache HTTP Server version 2.4.51 or later.',
 'Critical', '2024-06-13T12:45:30.000Z'::timestamp, '2024-06-13T12:45:30.000Z'::timestamp,
 'Open', 'tenable',
 '{"plugin_id": 144228, "cve": ["CVE-2021-44790", "CVE-2021-44224"]}'::jsonb),

-- RHEL kernel vulnerabilities on Database Server
('12345678-1234-1234-1234-123456789003'::uuid, 147462,
 'Red Hat Enterprise Linux 8 : kernel (RHSA-2022:1975)',
 'Red Hat Local Security Checks', 4, 'Critical', 8.4, 8.4,
 'The remote Red Hat Enterprise Linux 8 host has packages installed that are affected by multiple vulnerabilities including kernel use-after-free vulnerabilities that could lead to privilege escalation.',
 'Update the affected packages via yum update.',
 'Critical', '2024-06-13T16:10:45.000Z'::timestamp, '2024-06-13T16:10:45.000Z'::timestamp,
 'Open', 'tenable',
 '{"plugin_id": 147462, "cve": ["CVE-2022-1015", "CVE-2022-1016"]}'::jsonb);

-- ============================================================================
-- STEP 5: Ingest Controls Data (Level 4A - System Compliance)
-- ============================================================================

-- Insert security controls from xacta_controls_sample.json
INSERT INTO ingestion_controls (
    system_id, control_id, control_title, family, priority,
    implementation_status, assessment_status, responsible_role,
    last_assessed, implementation_guidance, residual_risk,
    ingestion_source, raw_json
) VALUES
-- SI-2 controls for various systems
('SYS-ENT-001', 'SI-2', 'Flaw Remediation', 'System and Information Integrity', 'P1',
 'partially_implemented', 'other_than_satisfied', 'System Administrator',
 '2024-03-15T10:30:00.000Z'::timestamp,
 'The organization identifies, reports, and corrects information system flaws.',
 'high', 'xacta',
 '{"control_id": "SI-2", "findings": [{"id": "FIND-SI2-001", "severity": "critical"}]}'::jsonb),

('SYS-ENT-002', 'SI-2', 'Flaw Remediation', 'System and Information Integrity', 'P1',
 'not_implemented', 'not_satisfied', 'Domain Administrator',
 '2024-02-20T14:15:00.000Z'::timestamp,
 'Critical security patches must be applied to domain infrastructure.',
 'critical', 'xacta',
 '{"control_id": "SI-2", "findings": [{"id": "FIND-SI2-003", "severity": "critical"}]}'::jsonb),

('SYS-ENT-003', 'SI-2', 'Flaw Remediation', 'System and Information Integrity', 'P1',
 'partially_implemented', 'other_than_satisfied', 'Database Administrator',
 '2024-01-30T09:45:00.000Z'::timestamp,
 'Database systems require timely security updates and kernel patches.',
 'high', 'xacta',
 '{"control_id": "SI-2", "findings": [{"id": "FIND-SI2-005", "severity": "critical"}]}'::jsonb),

-- AC-2 Access Control
('SYS-ENT-001', 'AC-2', 'Account Management', 'Access Control', 'P1',
 'partially_implemented', 'other_than_satisfied', 'System Administrator',
 '2024-03-15T10:30:00.000Z'::timestamp,
 'The information system manages user accounts including establishment, activation, modification, review, and removal.',
 'moderate', 'xacta',
 '{"control_id": "AC-2", "findings": [{"id": "FIND-AC2-001", "severity": "moderate"}]}'::jsonb);

-- ============================================================================
-- STEP 6: Ingest POAMs Data (Level 4B - Risk Remediation)
-- ============================================================================

-- Insert POAMs from xacta_poams_sample.json
INSERT INTO ingestion_poams (
    poam_id, system_id, weakness_description, source, security_control,
    resources, scheduled_completion, poc, status, risk_rating,
    original_detection_date, weakness_severity, residual_risk,
    threat_relevance, likelihood, impact, mitigation_strategy, cost_estimate,
    ingestion_source, raw_json
) VALUES
-- POAM for Apache vulnerabilities
('POAM-2024-001', 'SYS-ENT-001',
 'Apache HTTP Server Critical Vulnerabilities - Remote Code Execution',
 'Tenable Vulnerability Scan Finding FIND-SI2-001', 'SI-2',
 '1 System Administrator, 4 hours maintenance window',
 '2024-07-15'::date, 'sysadmin@enterprise.com',
 'ongoing', 'critical', '2024-06-13'::date,
 'Critical', 'High', 'Confirmed', 'High', 'High',
 'Apply vendor security patches', '$2,500',
 'xacta', '{"poam_id": "POAM-2024-001", "cve_references": ["CVE-2021-44790", "CVE-2021-44224"]}'::jsonb),

-- POAM for SMB vulnerabilities
('POAM-2024-002', 'SYS-ENT-002',
 'Windows SMB Server Critical Vulnerabilities - EternalBlue Exploitation Risk',
 'Tenable Vulnerability Scan Finding FIND-SI2-003', 'SI-2',
 '1 Domain Administrator, 1 Security Analyst, 8 hours',
 '2024-06-20'::date, 'domainadmin@enterprise.com',
 'critical', 'critical', '2024-06-13'::date,
 'Critical', 'Critical', 'Confirmed', 'Very High', 'Very High',
 'Emergency security patching with immediate implementation', '$5,000',
 'xacta', '{"poam_id": "POAM-2024-002", "cve_references": ["CVE-2017-0143", "CVE-2017-0144"]}'::jsonb),

-- POAM for RHEL kernel vulnerabilities
('POAM-2024-004', 'SYS-ENT-003',
 'Red Hat Enterprise Linux Kernel Use-After-Free Vulnerabilities',
 'Tenable Vulnerability Scan Finding FIND-SI2-005, FIND-SI2-006', 'SI-2',
 '1 Database Administrator, 1 System Administrator, 6 hours',
 '2024-07-10'::date, 'dba@enterprise.com',
 'ongoing', 'critical', '2024-06-13'::date,
 'Critical', 'High', 'Confirmed', 'High', 'High',
 'Apply RHEL kernel security updates with database coordination', '$8,500',
 'xacta', '{"poam_id": "POAM-2024-004", "cve_references": ["CVE-2022-1015", "CVE-2022-1016"]}'::jsonb);

-- Map POAMs to affected assets
INSERT INTO ingestion_poam_assets (poam_id, asset_uuid) VALUES
('POAM-2024-001', '12345678-1234-1234-1234-123456789002'::uuid), -- Apache POAM to Web Server
('POAM-2024-002', '12345678-1234-1234-1234-123456789001'::uuid), -- SMB POAM to Domain Controller
('POAM-2024-004', '12345678-1234-1234-1234-123456789003'::uuid); -- RHEL POAM to Database Server

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Verify the hierarchical data structure
SELECT 'Data Ingestion Summary' as report_type;

-- Systems summary
SELECT 
    'Systems' as level,
    COUNT(*) as total_records,
    string_agg(DISTINCT system_id, ', ') as sample_ids
FROM ingestion_systems;

-- Assets summary  
SELECT 
    'Assets' as level,
    COUNT(*) as total_records,
    string_agg(DISTINCT hostname, ', ') as sample_hostnames
FROM ingestion_assets;

-- Vulnerabilities summary
SELECT 
    'Vulnerabilities' as level,
    COUNT(*) as total_records,
    COUNT(CASE WHEN severity = 4 THEN 1 END) as critical_count
FROM ingestion_vulnerabilities;

-- Controls summary
SELECT 
    'Controls' as level,
    COUNT(*) as total_records,
    string_agg(DISTINCT control_id, ', ') as control_types
FROM ingestion_controls;

-- POAMs summary
SELECT 
    'POAMs' as level,
    COUNT(*) as total_records,
    COUNT(CASE WHEN risk_rating = 'critical' THEN 1 END) as critical_count
FROM ingestion_poams;

-- Complete system overview
SELECT * FROM vw_ingestion_system_overview;