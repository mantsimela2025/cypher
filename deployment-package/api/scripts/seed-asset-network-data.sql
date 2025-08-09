-- =====================================================
-- Asset Network Data SQL Script
-- =====================================================
-- This script creates sample data for the asset_network table
-- Run this AFTER assets are already created in the database
--
-- IMPORTANT: Every asset MUST have at least one network interface record
-- This is essential for security scanning, asset discovery, and network mapping

-- Clear existing asset_network data
DELETE FROM asset_network;

-- Reset sequence if needed
-- ALTER SEQUENCE asset_network_id_seq RESTART WITH 1;

-- Insert Asset Network Data
-- Note: This assumes you have existing assets with UUIDs in the assets table
-- The script uses subqueries to get actual asset_uuid values from the assets table

-- Method 1: Insert PRIMARY network interface for ALL assets (every asset gets at least one network record)
INSERT INTO public.asset_network (id, asset_uuid, fqdn, ipv4_address, mac_address, network_type, is_primary, created_at)
SELECT
    nextval('asset_network_id_seq'::regclass),
    a.asset_uuid,
    COALESCE(a.hostname, 'host-' || a.id) || '.corp.local',
    CASE
        -- Different IP ranges based on asset type/system
        WHEN a.system_id = 'SYS-001' THEN ('192.168.1.' || (100 + (a.id % 150)))::inet
        WHEN a.system_id = 'SYS-002' THEN ('192.168.10.' || (50 + (a.id % 200)))::inet
        WHEN a.system_id = 'SYS-003' THEN ('10.0.1.' || (20 + (a.id % 230)))::inet
        WHEN a.system_id = 'SYS-004' THEN ('172.16.1.' || (10 + (a.id % 240)))::inet
        ELSE ('192.168.100.' || (1 + (a.id % 254)))::inet
    END,
    ('00:11:22:33:44:' || LPAD((50 + a.id % 200)::text, 2, '0'))::macaddr,
    'ethernet',
    true,
    CURRENT_TIMESTAMP
FROM assets a
ORDER BY a.id;

-- Method 2: Insert additional network interfaces (secondary IPs) for server assets
INSERT INTO public.asset_network (id, asset_uuid, fqdn, ipv4_address, mac_address, network_type, is_primary, created_at)
SELECT
    nextval('asset_network_id_seq'::regclass),
    a.asset_uuid,
    COALESCE(a.hostname, 'host-' || a.id) || '-mgmt.corp.local',
    ('10.0.1.' || (50 + (a.id % 100)))::inet,
    ('00:22:33:44:55:' || LPAD((60 + a.id % 150)::text, 2, '0'))::macaddr,
    'management',
    false,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.hostname LIKE '%server%' OR a.hostname LIKE '%db%' OR a.hostname LIKE '%app%'
ORDER BY a.id;

-- Method 3: Insert wireless network interfaces for workstation/laptop assets
INSERT INTO public.asset_network (id, asset_uuid, fqdn, ipv4_address, mac_address, network_type, is_primary, created_at)
SELECT
    nextval('asset_network_id_seq'::regclass),
    a.asset_uuid,
    COALESCE(a.hostname, 'host-' || a.id) || '-wifi.corp.local',
    ('192.168.10.' || (20 + (a.id % 200)))::inet,
    ('00:33:44:55:66:' || LPAD((70 + a.id % 180)::text, 2, '0'))::macaddr,
    'wireless',
    false,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.hostname LIKE '%workstation%' OR a.hostname LIKE '%laptop%' OR a.hostname LIKE '%pc%'
ORDER BY a.id;

-- Method 4: Insert DMZ network interfaces for servers
INSERT INTO public.asset_network (id, asset_uuid, fqdn, ipv4_address, mac_address, network_type, is_primary, created_at)
SELECT 
    nextval('asset_network_id_seq'::regclass),
    a.asset_uuid,
    COALESCE(a.hostname, 'host-' || a.id) || '-dmz.corp.local',
    ('172.16.1.' || (10 + (a.id % 240)))::inet,
    ('00:44:55:66:77:' || LPAD((80 + a.id % 160)::text, 2, '0'))::macaddr,
    'dmz',
    false,
    CURRENT_TIMESTAMP
FROM assets a
WHERE a.hostname LIKE '%server%' OR a.hostname LIKE '%web%'
ORDER BY a.id
LIMIT 8;

-- Method 5: Manual INSERT statements with specific data (if you prefer explicit values)
-- Uncomment and modify these if you want to insert specific network data

/*
INSERT INTO public.asset_network (id, asset_uuid, fqdn, ipv4_address, mac_address, network_type, is_primary, created_at)
VALUES
-- Web Servers
(nextval('asset_network_id_seq'::regclass), 
 (SELECT asset_uuid FROM assets WHERE hostname = 'web-server-01' LIMIT 1), 
 'web-server-01.corp.local', 
 '192.168.1.101'::inet, 
 '00:11:22:33:44:51'::macaddr,
 'ethernet',
 true,
 CURRENT_TIMESTAMP),

(nextval('asset_network_id_seq'::regclass),
 (SELECT asset_uuid FROM assets WHERE hostname = 'web-server-02' LIMIT 1),
 'web-server-02.corp.local',
 '192.168.1.102'::inet,
 '00:11:22:33:44:52'::macaddr,
 'ethernet',
 true,
 CURRENT_TIMESTAMP),

-- Application Servers
(nextval('asset_network_id_seq'::regclass),
 (SELECT asset_uuid FROM assets WHERE hostname = 'app-server-01' LIMIT 1),
 'app-server-01.corp.local',
 '192.168.1.103'::inet,
 '00:11:22:33:44:53'::macaddr,
 'ethernet',
 true,
 CURRENT_TIMESTAMP),

-- Database Servers
(nextval('asset_network_id_seq'::regclass),
 (SELECT asset_uuid FROM assets WHERE hostname = 'db-server-01' LIMIT 1),
 'db-server-01.corp.local',
 '192.168.1.104'::inet,
 '00:11:22:33:44:54'::macaddr,
 'ethernet',
 true,
 CURRENT_TIMESTAMP),

-- Network Devices
(nextval('asset_network_id_seq'::regclass),
 (SELECT asset_uuid FROM assets WHERE hostname = 'fw-01' LIMIT 1),
 'fw-01.corp.local',
 '192.168.1.1'::inet,
 '00:11:22:33:44:01'::macaddr,
 'ethernet',
 true,
 CURRENT_TIMESTAMP),

(nextval('asset_network_id_seq'::regclass),
 (SELECT asset_uuid FROM assets WHERE hostname = 'sw-core-01' LIMIT 1),
 'sw-core-01.corp.local',
 '192.168.1.2'::inet,
 '00:11:22:33:44:02'::macaddr,
 'ethernet',
 true,
 CURRENT_TIMESTAMP);
*/

-- Verify the inserts
SELECT 
    an.id,
    an.asset_uuid,
    a.hostname,
    an.fqdn,
    an.ipv4_address,
    an.mac_address,
    an.network_type,
    an.is_primary,
    an.created_at
FROM asset_network an
JOIN assets a ON an.asset_uuid = a.asset_uuid
ORDER BY an.id;

-- Show summary statistics
SELECT 
    network_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_count,
    COUNT(CASE WHEN is_primary = false THEN 1 END) as secondary_count
FROM asset_network
GROUP BY network_type
ORDER BY network_type;

-- Show total count
SELECT COUNT(*) as total_network_interfaces FROM asset_network;

COMMIT;
