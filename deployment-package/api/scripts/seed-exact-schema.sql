-- =====================================================
-- Exact Schema Match - Systems and Assets Seed Data
-- =====================================================
-- This script matches your exact INSERT statements

BEGIN;

-- Clear existing data
DELETE FROM asset_systems;
DELETE FROM asset_network;
DELETE FROM assets;
DELETE FROM systems;

-- =====================================================
-- SYSTEMS DATA - Matching your exact schema
-- =====================================================

INSERT INTO systems (
    system_id,
    name,
    uuid,
    status,
    authorization_boundary,
    system_type,
    responsible_organization,
    system_owner,
    information_system_security_officer,
    authorizing_official,
    last_assessment_date,
    authorization_date,
    authorization_termination_date,
    created_at,
    updated_at,
    source,
    batch_id,
    raw_json,
    confidentiality_impact,
    integrity_impact,
    availability_impact
) VALUES 
('SYS-001', 'Corporate Network Infrastructure', gen_random_uuid(), 'operational', 'Infrastructure Boundary', 'Infrastructure', 'IT Department', 'John Smith', 'Jane Doe', 'Mike Johnson', NOW() - INTERVAL '90 days', NOW() - INTERVAL '365 days', NOW() + INTERVAL '730 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'xacta', gen_random_uuid(), '{"system_id":"SYS-001","name":"Corporate Network Infrastructure","type":"Infrastructure","owner":"John Smith"}', 'moderate', 'moderate', 'high'),
('SYS-002', 'Web Application Platform', gen_random_uuid(), 'operational', 'Application Boundary', 'Application', 'Development Team', 'Sarah Wilson', 'Jane Doe', 'Mike Johnson', NOW() - INTERVAL '60 days', NOW() - INTERVAL '300 days', NOW() + INTERVAL '730 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'xacta', gen_random_uuid(), '{"system_id":"SYS-002","name":"Web Application Platform","type":"Application","owner":"Sarah Wilson"}', 'high', 'high', 'moderate'),
('SYS-003', 'Database Management System', gen_random_uuid(), 'operational', 'Database Boundary', 'Database', 'Data Team', 'Bob Anderson', 'Jane Doe', 'Mike Johnson', NOW() - INTERVAL '45 days', NOW() - INTERVAL '280 days', NOW() + INTERVAL '730 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'xacta', gen_random_uuid(), '{"system_id":"SYS-003","name":"Database Management System","type":"Database","owner":"Bob Anderson"}', 'high', 'high', 'high'),
('SYS-004', 'Employee Workstation Environment', gen_random_uuid(), 'operational', 'Workstation Boundary', 'Workstation', 'IT Department', 'John Smith', 'Jane Doe', 'Mike Johnson', NOW() - INTERVAL '120 days', NOW() - INTERVAL '400 days', NOW() + INTERVAL '730 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'xacta', gen_random_uuid(), '{"system_id":"SYS-004","name":"Employee Workstation Environment","type":"Workstation","owner":"John Smith"}', 'moderate', 'moderate', 'moderate'),
('SYS-005', 'Cloud Services Platform', gen_random_uuid(), 'operational', 'Cloud Boundary', 'Cloud', 'Cloud Team', 'Lisa Chen', 'Jane Doe', 'Mike Johnson', NOW() - INTERVAL '30 days', NOW() - INTERVAL '180 days', NOW() + INTERVAL '730 days', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'xacta', gen_random_uuid(), '{"system_id":"SYS-005","name":"Cloud Services Platform","type":"Cloud","owner":"Lisa Chen"}', 'moderate', 'moderate', 'moderate');

-- =====================================================
-- ASSETS DATA - Matching your exact schema
-- =====================================================

INSERT INTO assets (
    asset_uuid,
    hostname,
    netbios_name,
    system_id,
    has_agent,
    has_plugin_results,
    first_seen,
    last_seen,
    exposure_score,
    acr_score,
    criticality_rating,
    created_at,
    updated_at,
    source,
    batch_id,
    raw_json
) VALUES 
-- Infrastructure Assets (SYS-001)
(gen_random_uuid(), 'web-server-01', 'WEB-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day', 450, '6.7', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.7,"criticality_rating":"medium","exposure_score":450,"has_agent":true,"hostname":["web-server-01"],"operating_system":["Windows Server 2019"],"system_type":["server"]}'),
(gen_random_uuid(), 'web-server-02', 'WEB-SERVER-02', 'SYS-001', true, true, NOW() - INTERVAL '150 days', NOW() - INTERVAL '2 days', 320, '5.8', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.8,"criticality_rating":"medium","exposure_score":320,"has_agent":true,"hostname":["web-server-02"],"operating_system":["Windows Server 2022"],"system_type":["server"]}'),
(gen_random_uuid(), 'app-server-01', 'APP-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '200 days', NOW() - INTERVAL '1 day', 680, '7.2', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.2,"criticality_rating":"high","exposure_score":680,"has_agent":true,"hostname":["app-server-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'app-server-02', 'APP-SERVER-02', 'SYS-001', false, true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '3 days', 290, '4.9', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.9,"criticality_rating":"low","exposure_score":290,"has_agent":false,"hostname":["app-server-02"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'db-server-01', 'DB-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '250 days', NOW() - INTERVAL '1 day', 820, '8.1', 'critical', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":8.1,"criticality_rating":"critical","exposure_score":820,"has_agent":true,"hostname":["db-server-01"],"operating_system":["Windows Server 2019"],"system_type":["server"]}'),
(gen_random_uuid(), 'mail-server-01', 'MAIL-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '190 days', NOW() - INTERVAL '2 days', 560, '6.3', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.3,"criticality_rating":"high","exposure_score":560,"has_agent":true,"hostname":["mail-server-01"],"operating_system":["Windows Server 2022"],"system_type":["server"]}'),
(gen_random_uuid(), 'file-server-01', 'FILE-SERVER-01', 'SYS-001', true, false, NOW() - INTERVAL '160 days', NOW() - INTERVAL '4 days', 380, '5.5', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.5,"criticality_rating":"medium","exposure_score":380,"has_agent":true,"hostname":["file-server-01"],"operating_system":["Windows Server 2019"],"system_type":["server"]}'),
(gen_random_uuid(), 'dns-server-01', 'DNS-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '210 days', NOW() - INTERVAL '1 day', 420, '6.0', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.0,"criticality_rating":"medium","exposure_score":420,"has_agent":true,"hostname":["dns-server-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),
(gen_random_uuid(), 'dhcp-server-01', 'DHCP-SERVER-01', 'SYS-001', false, true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '5 days', 260, '4.2', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.2,"criticality_rating":"low","exposure_score":260,"has_agent":false,"hostname":["dhcp-server-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'backup-server-01', 'BACKUP-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '2 days', 340, '5.1', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.1,"criticality_rating":"medium","exposure_score":340,"has_agent":true,"hostname":["backup-server-01"],"operating_system":["Windows Server 2022"],"system_type":["server"]}'),

-- Application Platform Assets (SYS-002)
(gen_random_uuid(), 'nginx-01', 'NGINX-01', 'SYS-002', true, true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '1 day', 480, '6.8', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.8,"criticality_rating":"medium","exposure_score":480,"has_agent":true,"hostname":["nginx-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'apache-01', 'APACHE-01', 'SYS-002', true, true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '3 days', 620, '7.5', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.5,"criticality_rating":"high","exposure_score":620,"has_agent":true,"hostname":["apache-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),
(gen_random_uuid(), 'tomcat-01', 'TOMCAT-01', 'SYS-002', false, true, NOW() - INTERVAL '185 days', NOW() - INTERVAL '2 days', 390, '5.9', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.9,"criticality_rating":"medium","exposure_score":390,"has_agent":false,"hostname":["tomcat-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'node-app-01', 'NODE-APP-01', 'SYS-002', true, true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '1 day', 540, '6.4', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.4,"criticality_rating":"high","exposure_score":540,"has_agent":true,"hostname":["node-app-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'python-app-01', 'PYTHON-APP-01', 'SYS-002', true, false, NOW() - INTERVAL '125 days', NOW() - INTERVAL '4 days', 310, '4.7', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.7,"criticality_rating":"medium","exposure_score":310,"has_agent":true,"hostname":["python-app-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),

-- Database Assets (SYS-003)
(gen_random_uuid(), 'postgres-01', 'POSTGRES-01', 'SYS-003', true, true, NOW() - INTERVAL '220 days', NOW() - INTERVAL '1 day', 750, '8.3', 'critical', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":8.3,"criticality_rating":"critical","exposure_score":750,"has_agent":true,"hostname":["postgres-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'mysql-01', 'MYSQL-01', 'SYS-003', true, true, NOW() - INTERVAL '195 days', NOW() - INTERVAL '2 days', 680, '7.8', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.8,"criticality_rating":"high","exposure_score":680,"has_agent":true,"hostname":["mysql-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),

-- Workstation Assets (SYS-004)
(gen_random_uuid(), 'workstation-001', 'WORKSTATION-001', 'SYS-004', false, true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '3 days', 180, '3.2', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.2,"criticality_rating":"low","exposure_score":180,"has_agent":false,"hostname":["workstation-001"],"operating_system":["Windows 10 Enterprise"],"system_type":["workstation"]}'),
(gen_random_uuid(), 'laptop-001', 'LAPTOP-001', 'SYS-004', true, true, NOW() - INTERVAL '75 days', NOW() - INTERVAL '1 day', 220, '3.8', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.8,"criticality_rating":"low","exposure_score":220,"has_agent":true,"hostname":["laptop-001"],"operating_system":["Windows 11 Pro"],"system_type":["workstation"]}'),

-- Cloud Assets (SYS-005)
(gen_random_uuid(), 'cloud-vm-001', 'CLOUD-VM-001', 'SYS-005', true, true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '2 days', 410, '5.6', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.6,"criticality_rating":"medium","exposure_score":410,"has_agent":true,"hostname":["cloud-vm-001"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["cloud"]}');

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

SELECT 'SYSTEMS CREATED:' as section;
SELECT system_id, name, system_type, status, system_owner FROM systems ORDER BY system_id;

SELECT 'ASSETS CREATED:' as section;
SELECT hostname, system_id, exposure_score, criticality_rating, has_agent FROM assets ORDER BY system_id, hostname;

SELECT 'SUMMARY:' as section;
SELECT 'Systems' as type, COUNT(*) as count FROM systems
UNION ALL
SELECT 'Assets' as type, COUNT(*) as count FROM assets;

SELECT 'ASSETS PER SYSTEM:' as section;
SELECT s.system_id, s.name, COUNT(a.asset_uuid) as asset_count
FROM systems s
LEFT JOIN assets a ON s.system_id = a.system_id
GROUP BY s.system_id, s.name
ORDER BY s.system_id;
