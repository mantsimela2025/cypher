-- =====================================================
-- Assets-Only Seed Data SQL Script - 50 Assets
-- =====================================================
-- This script creates 50 assets that reference your existing systems
-- Run this AFTER systems are already created (which you have)

-- Clear existing asset data
DELETE FROM asset_systems;
DELETE FROM asset_network;
DELETE FROM assets;

-- Insert Assets Data matching your exact schema
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
-- Infrastructure Assets (SYS-001) - 25 assets total
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

-- Application Platform Assets (SYS-002) - 15 assets total
(gen_random_uuid(), 'nginx-01', 'NGINX-01', 'SYS-002', true, true, NOW() - INTERVAL '130 days', NOW() - INTERVAL '1 day', 480, '6.8', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.8,"criticality_rating":"medium","exposure_score":480,"has_agent":true,"hostname":["nginx-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'apache-01', 'APACHE-01', 'SYS-002', true, true, NOW() - INTERVAL '155 days', NOW() - INTERVAL '3 days', 620, '7.5', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.5,"criticality_rating":"high","exposure_score":620,"has_agent":true,"hostname":["apache-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),
(gen_random_uuid(), 'tomcat-01', 'TOMCAT-01', 'SYS-002', false, true, NOW() - INTERVAL '185 days', NOW() - INTERVAL '2 days', 390, '5.9', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.9,"criticality_rating":"medium","exposure_score":390,"has_agent":false,"hostname":["tomcat-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'node-app-01', 'NODE-APP-01', 'SYS-002', true, true, NOW() - INTERVAL '110 days', NOW() - INTERVAL '1 day', 540, '6.4', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.4,"criticality_rating":"high","exposure_score":540,"has_agent":true,"hostname":["node-app-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'python-app-01', 'PYTHON-APP-01', 'SYS-002', true, false, NOW() - INTERVAL '125 days', NOW() - INTERVAL '4 days', 310, '4.7', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.7,"criticality_rating":"medium","exposure_score":310,"has_agent":true,"hostname":["python-app-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),

-- Database Assets (SYS-003) - 10 assets total
(gen_random_uuid(), 'postgres-01', 'POSTGRES-01', 'SYS-003', true, true, NOW() - INTERVAL '220 days', NOW() - INTERVAL '1 day', 750, '8.3', 'critical', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":8.3,"criticality_rating":"critical","exposure_score":750,"has_agent":true,"hostname":["postgres-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'mysql-01', 'MYSQL-01', 'SYS-003', true, true, NOW() - INTERVAL '195 days', NOW() - INTERVAL '2 days', 680, '7.8', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.8,"criticality_rating":"high","exposure_score":680,"has_agent":true,"hostname":["mysql-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),

-- Workstation Assets (SYS-004) - 10 assets total
(gen_random_uuid(), 'workstation-001', 'WORKSTATION-001', 'SYS-004', false, true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '3 days', 180, '3.2', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.2,"criticality_rating":"low","exposure_score":180,"has_agent":false,"hostname":["workstation-001"],"operating_system":["Windows 10 Enterprise"],"system_type":["workstation"]}'),
(gen_random_uuid(), 'laptop-001', 'LAPTOP-001', 'SYS-004', true, true, NOW() - INTERVAL '75 days', NOW() - INTERVAL '1 day', 220, '3.8', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.8,"criticality_rating":"low","exposure_score":220,"has_agent":true,"hostname":["laptop-001"],"operating_system":["Windows 11 Pro"],"system_type":["workstation"]}'),

-- Cloud Assets (SYS-005) - 5 assets total
(gen_random_uuid(), 'cloud-vm-001', 'CLOUD-VM-001', 'SYS-005', true, true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '2 days', 410, '5.6', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.6,"criticality_rating":"medium","exposure_score":410,"has_agent":true,"hostname":["cloud-vm-001"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["cloud"]}'),

-- Additional Infrastructure Assets (SYS-001) - 15 more assets
(gen_random_uuid(), 'proxy-server-01', 'PROXY-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '165 days', NOW() - INTERVAL '2 days', 380, '5.9', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.9,"criticality_rating":"medium","exposure_score":380,"has_agent":true,"hostname":["proxy-server-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'fw-01', 'FW-01', 'SYS-001', false, true, NOW() - INTERVAL '300 days', NOW() - INTERVAL '1 day', 720, '7.8', 'critical', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.8,"criticality_rating":"critical","exposure_score":720,"has_agent":false,"hostname":["fw-01"],"operating_system":["pfSense"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'fw-02', 'FW-02', 'SYS-001', false, true, NOW() - INTERVAL '280 days', NOW() - INTERVAL '3 days', 650, '7.1', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.1,"criticality_rating":"high","exposure_score":650,"has_agent":false,"hostname":["fw-02"],"operating_system":["pfSense"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'sw-core-01', 'SW-CORE-01', 'SYS-001', false, false, NOW() - INTERVAL '320 days', NOW() - INTERVAL '2 days', 290, '4.5', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.5,"criticality_rating":"low","exposure_score":290,"has_agent":false,"hostname":["sw-core-01"],"operating_system":["Cisco IOS"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'sw-core-02', 'SW-CORE-02', 'SYS-001', false, false, NOW() - INTERVAL '310 days', NOW() - INTERVAL '4 days', 310, '4.8', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.8,"criticality_rating":"medium","exposure_score":310,"has_agent":false,"hostname":["sw-core-02"],"operating_system":["Cisco IOS"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'sw-access-01', 'SW-ACCESS-01', 'SYS-001', false, false, NOW() - INTERVAL '200 days', NOW() - INTERVAL '1 day', 180, '3.2', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.2,"criticality_rating":"low","exposure_score":180,"has_agent":false,"hostname":["sw-access-01"],"operating_system":["Cisco IOS"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'sw-access-02', 'SW-ACCESS-02', 'SYS-001', false, false, NOW() - INTERVAL '190 days', NOW() - INTERVAL '2 days', 195, '3.5', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.5,"criticality_rating":"low","exposure_score":195,"has_agent":false,"hostname":["sw-access-02"],"operating_system":["Cisco IOS"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'sw-access-03', 'SW-ACCESS-03', 'SYS-001', false, false, NOW() - INTERVAL '185 days', NOW() - INTERVAL '3 days', 205, '3.7', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.7,"criticality_rating":"low","exposure_score":205,"has_agent":false,"hostname":["sw-access-03"],"operating_system":["Cisco IOS"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'router-01', 'ROUTER-01', 'SYS-001', false, true, NOW() - INTERVAL '250 days', NOW() - INTERVAL '1 day', 420, '6.2', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.2,"criticality_rating":"medium","exposure_score":420,"has_agent":false,"hostname":["router-01"],"operating_system":["Cisco IOS"],"system_type":["network-device"]}'),
(gen_random_uuid(), 'ntp-server-01', 'NTP-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '220 days', NOW() - INTERVAL '2 days', 240, '4.1', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.1,"criticality_rating":"low","exposure_score":240,"has_agent":true,"hostname":["ntp-server-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'syslog-server-01', 'SYSLOG-SERVER-01', 'SYS-001', true, true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day', 350, '5.3', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.3,"criticality_rating":"medium","exposure_score":350,"has_agent":true,"hostname":["syslog-server-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),
(gen_random_uuid(), 'monitoring-01', 'MONITORING-01', 'SYS-001', true, true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '2 days', 390, '5.8', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.8,"criticality_rating":"medium","exposure_score":390,"has_agent":true,"hostname":["monitoring-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'storage-nas-01', 'STORAGE-NAS-01', 'SYS-001', false, true, NOW() - INTERVAL '240 days', NOW() - INTERVAL '3 days', 280, '4.6', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.6,"criticality_rating":"low","exposure_score":280,"has_agent":false,"hostname":["storage-nas-01"],"operating_system":["FreeNAS"],"system_type":["storage"]}'),
(gen_random_uuid(), 'storage-san-01', 'STORAGE-SAN-01', 'SYS-001', false, true, NOW() - INTERVAL '260 days', NOW() - INTERVAL '2 days', 320, '5.0', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.0,"criticality_rating":"medium","exposure_score":320,"has_agent":false,"hostname":["storage-san-01"],"operating_system":["EMC"],"system_type":["storage"]}'),
(gen_random_uuid(), 'ups-01', 'UPS-01', 'SYS-001', false, false, NOW() - INTERVAL '365 days', NOW() - INTERVAL '5 days', 150, '2.8', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":2.8,"criticality_rating":"low","exposure_score":150,"has_agent":false,"hostname":["ups-01"],"operating_system":["Embedded"],"system_type":["infrastructure"]}'),

-- Additional Application Platform Assets (SYS-002) - 10 more assets
(gen_random_uuid(), 'iis-01', 'IIS-01', 'SYS-002', true, true, NOW() - INTERVAL '140 days', NOW() - INTERVAL '1 day', 520, '6.9', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.9,"criticality_rating":"high","exposure_score":520,"has_agent":true,"hostname":["iis-01"],"operating_system":["Windows Server 2019"],"system_type":["server"]}'),
(gen_random_uuid(), 'iis-02', 'IIS-02', 'SYS-002', true, true, NOW() - INTERVAL '135 days', NOW() - INTERVAL '2 days', 480, '6.5', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.5,"criticality_rating":"medium","exposure_score":480,"has_agent":true,"hostname":["iis-02"],"operating_system":["Windows Server 2022"],"system_type":["server"]}'),
(gen_random_uuid(), 'jenkins-01', 'JENKINS-01', 'SYS-002', true, true, NOW() - INTERVAL '120 days', NOW() - INTERVAL '1 day', 410, '5.9', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.9,"criticality_rating":"medium","exposure_score":410,"has_agent":true,"hostname":["jenkins-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'gitlab-01', 'GITLAB-01', 'SYS-002', true, true, NOW() - INTERVAL '115 days', NOW() - INTERVAL '2 days', 450, '6.3', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.3,"criticality_rating":"medium","exposure_score":450,"has_agent":true,"hostname":["gitlab-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'nexus-01', 'NEXUS-01', 'SYS-002', true, false, NOW() - INTERVAL '110 days', NOW() - INTERVAL '3 days', 320, '4.8', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.8,"criticality_rating":"medium","exposure_score":320,"has_agent":true,"hostname":["nexus-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),
(gen_random_uuid(), 'sonar-01', 'SONAR-01', 'SYS-002', true, true, NOW() - INTERVAL '105 days', NOW() - INTERVAL '1 day', 280, '4.2', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.2,"criticality_rating":"low","exposure_score":280,"has_agent":true,"hostname":["sonar-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'docker-host-01', 'DOCKER-HOST-01', 'SYS-002', true, true, NOW() - INTERVAL '100 days', NOW() - INTERVAL '2 days', 580, '7.1', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.1,"criticality_rating":"high","exposure_score":580,"has_agent":true,"hostname":["docker-host-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'docker-host-02', 'DOCKER-HOST-02', 'SYS-002', true, true, NOW() - INTERVAL '95 days', NOW() - INTERVAL '1 day', 560, '6.8', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.8,"criticality_rating":"high","exposure_score":560,"has_agent":true,"hostname":["docker-host-02"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'k8s-master-01', 'K8S-MASTER-01', 'SYS-002', true, true, NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 day', 640, '7.5', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":7.5,"criticality_rating":"high","exposure_score":640,"has_agent":true,"hostname":["k8s-master-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'k8s-worker-01', 'K8S-WORKER-01', 'SYS-002', true, true, NOW() - INTERVAL '85 days', NOW() - INTERVAL '2 days', 420, '6.0', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.0,"criticality_rating":"medium","exposure_score":420,"has_agent":true,"hostname":["k8s-worker-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),

-- Additional Database Assets (SYS-003) - 8 more assets
(gen_random_uuid(), 'oracle-01', 'ORACLE-01', 'SYS-003', true, true, NOW() - INTERVAL '240 days', NOW() - INTERVAL '1 day', 780, '8.5', 'critical', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":8.5,"criticality_rating":"critical","exposure_score":780,"has_agent":true,"hostname":["oracle-01"],"operating_system":["Red Hat Enterprise Linux 8"],"system_type":["server"]}'),
(gen_random_uuid(), 'mssql-01', 'MSSQL-01', 'SYS-003', true, true, NOW() - INTERVAL '210 days', NOW() - INTERVAL '2 days', 720, '8.0', 'critical', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":8.0,"criticality_rating":"critical","exposure_score":720,"has_agent":true,"hostname":["mssql-01"],"operating_system":["Windows Server 2019"],"system_type":["server"]}'),
(gen_random_uuid(), 'redis-01', 'REDIS-01', 'SYS-003', true, true, NOW() - INTERVAL '180 days', NOW() - INTERVAL '1 day', 380, '5.7', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.7,"criticality_rating":"medium","exposure_score":380,"has_agent":true,"hostname":["redis-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'mongo-01', 'MONGO-01', 'SYS-003', true, true, NOW() - INTERVAL '170 days', NOW() - INTERVAL '2 days', 420, '6.1', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.1,"criticality_rating":"medium","exposure_score":420,"has_agent":true,"hostname":["mongo-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'elastic-01', 'ELASTIC-01', 'SYS-003', true, true, NOW() - INTERVAL '160 days', NOW() - INTERVAL '1 day', 480, '6.6', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.6,"criticality_rating":"medium","exposure_score":480,"has_agent":true,"hostname":["elastic-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'kibana-01', 'KIBANA-01', 'SYS-003', true, false, NOW() - INTERVAL '150 days', NOW() - INTERVAL '3 days', 340, '5.2', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.2,"criticality_rating":"medium","exposure_score":340,"has_agent":true,"hostname":["kibana-01"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["server"]}'),
(gen_random_uuid(), 'db-backup-01', 'DB-BACKUP-01', 'SYS-003', true, true, NOW() - INTERVAL '200 days', NOW() - INTERVAL '2 days', 290, '4.5', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.5,"criticality_rating":"low","exposure_score":290,"has_agent":true,"hostname":["db-backup-01"],"operating_system":["CentOS 7"],"system_type":["server"]}'),
(gen_random_uuid(), 'db-replica-01', 'DB-REPLICA-01', 'SYS-003', true, true, NOW() - INTERVAL '190 days', NOW() - INTERVAL '1 day', 520, '6.7', 'high', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.7,"criticality_rating":"high","exposure_score":520,"has_agent":true,"hostname":["db-replica-01"],"operating_system":["Ubuntu 20.04 LTS"],"system_type":["server"]}'),

-- Additional Workstation Assets (SYS-004) - 8 more assets
(gen_random_uuid(), 'workstation-002', 'WORKSTATION-002', 'SYS-004', true, true, NOW() - INTERVAL '85 days', NOW() - INTERVAL '2 days', 195, '3.4', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.4,"criticality_rating":"low","exposure_score":195,"has_agent":true,"hostname":["workstation-002"],"operating_system":["Windows 10 Enterprise"],"system_type":["workstation"]}'),
(gen_random_uuid(), 'workstation-003', 'WORKSTATION-003', 'SYS-004', false, true, NOW() - INTERVAL '80 days', NOW() - INTERVAL '4 days', 210, '3.6', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.6,"criticality_rating":"low","exposure_score":210,"has_agent":false,"hostname":["workstation-003"],"operating_system":["Windows 11 Pro"],"system_type":["workstation"]}'),
(gen_random_uuid(), 'workstation-004', 'WORKSTATION-004', 'SYS-004', true, true, NOW() - INTERVAL '70 days', NOW() - INTERVAL '1 day', 185, '3.1', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":3.1,"criticality_rating":"low","exposure_score":185,"has_agent":true,"hostname":["workstation-004"],"operating_system":["Windows 10 Enterprise"],"system_type":["workstation"]}'),
(gen_random_uuid(), 'laptop-002', 'LAPTOP-002', 'SYS-004', true, true, NOW() - INTERVAL '65 days', NOW() - INTERVAL '2 days', 240, '4.0', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":4.0,"criticality_rating":"low","exposure_score":240,"has_agent":true,"hostname":["laptop-002"],"operating_system":["Windows 11 Pro"],"system_type":["workstation"]}'),
(gen_random_uuid(), 'laptop-003', 'LAPTOP-003', 'SYS-004', false, true, NOW() - INTERVAL '60 days', NOW() - INTERVAL '5 days', 165, '2.9', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":2.9,"criticality_rating":"low","exposure_score":165,"has_agent":false,"hostname":["laptop-003"],"operating_system":["macOS Ventura"],"system_type":["workstation"]}'),
(gen_random_uuid(), 'printer-001', 'PRINTER-001', 'SYS-004', false, false, NOW() - INTERVAL '120 days', NOW() - INTERVAL '7 days', 120, '2.1', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":2.1,"criticality_rating":"low","exposure_score":120,"has_agent":false,"hostname":["printer-001"],"operating_system":["Embedded"],"system_type":["printer"]}'),
(gen_random_uuid(), 'printer-002', 'PRINTER-002', 'SYS-004', false, false, NOW() - INTERVAL '110 days', NOW() - INTERVAL '6 days', 135, '2.3', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":2.3,"criticality_rating":"low","exposure_score":135,"has_agent":false,"hostname":["printer-002"],"operating_system":["Embedded"],"system_type":["printer"]}'),
(gen_random_uuid(), 'scanner-001', 'SCANNER-001', 'SYS-004', false, false, NOW() - INTERVAL '100 days', NOW() - INTERVAL '8 days', 110, '1.9', 'low', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":1.9,"criticality_rating":"low","exposure_score":110,"has_agent":false,"hostname":["scanner-001"],"operating_system":["Embedded"],"system_type":["scanner"]}'),

-- Additional Cloud Assets (SYS-005) - 4 more assets
(gen_random_uuid(), 'cloud-vm-002', 'CLOUD-VM-002', 'SYS-005', true, true, NOW() - INTERVAL '55 days', NOW() - INTERVAL '1 day', 380, '5.4', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.4,"criticality_rating":"medium","exposure_score":380,"has_agent":true,"hostname":["cloud-vm-002"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["cloud"]}'),
(gen_random_uuid(), 'cloud-vm-003', 'CLOUD-VM-003', 'SYS-005', true, true, NOW() - INTERVAL '50 days', NOW() - INTERVAL '2 days', 420, '5.9', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.9,"criticality_rating":"medium","exposure_score":420,"has_agent":true,"hostname":["cloud-vm-003"],"operating_system":["Windows Server 2022"],"system_type":["cloud"]}'),
(gen_random_uuid(), 'k8s-worker-02', 'K8S-WORKER-02', 'SYS-005', true, true, NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day', 460, '6.2', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":6.2,"criticality_rating":"medium","exposure_score":460,"has_agent":true,"hostname":["k8s-worker-02"],"operating_system":["Ubuntu 22.04 LTS"],"system_type":["cloud"]}'),
(gen_random_uuid(), 'cloud-lb-01', 'CLOUD-LB-01', 'SYS-005', false, true, NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days', 340, '5.1', 'medium', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'tenable', gen_random_uuid(), '{"acr_score":5.1,"criticality_rating":"medium","exposure_score":340,"has_agent":false,"hostname":["cloud-lb-01"],"operating_system":["HAProxy"],"system_type":["cloud"]}');

-- Verification queries
SELECT 'ASSETS CREATED:' as section;
SELECT 
    hostname,
    system_id,
    exposure_score,
    criticality_rating,
    has_agent,
    source
FROM assets 
ORDER BY system_id, hostname;

-- Show counts by system
SELECT 'ASSETS PER SYSTEM:' as section;
SELECT 
    system_id,
    COUNT(*) as asset_count
FROM assets 
GROUP BY system_id
ORDER BY system_id;

-- Show total count
SELECT 'TOTAL ASSETS:' as section;
SELECT COUNT(*) as total_assets FROM assets;

-- Show systems with asset counts
SELECT 'SYSTEMS WITH ASSETS:' as section;
SELECT 
    s.system_id,
    s.name,
    COUNT(a.asset_uuid) as asset_count
FROM systems s
LEFT JOIN assets a ON s.system_id = a.system_id
GROUP BY s.system_id, s.name
ORDER BY s.system_id;
