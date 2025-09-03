-- Migration: seed/0005_seed_data.sql
-- Description: Insert initial seed data for asset categories, types, and locations
-- Author: Asset Management System
-- Date: 2024-01-19
-- Rollback: DELETE FROM assets WHERE asset_tag LIKE 'SEED-%'; DELETE FROM asset_locations WHERE code LIKE 'SEED_%'; DELETE FROM asset_types WHERE code LIKE 'SEED_%'; DELETE FROM asset_categories WHERE code LIKE 'SEED_%';

-- =====================================================
-- ASSET CATEGORIES SEED DATA
-- =====================================================
INSERT INTO "asset_categories" ("name", "description", "code", "color", "icon", "sort_order") VALUES
('Hardware', 'Physical computing equipment and devices', 'HW', '#3498db', 'server', 1),
('Software', 'Software applications and licenses', 'SW', '#9b59b6', 'code', 2),
('Network', 'Network infrastructure and equipment', 'NET', '#e74c3c', 'network-wired', 3),
('Security', 'Security devices and systems', 'SEC', '#f39c12', 'shield-alt', 4),
('Storage', 'Data storage systems and devices', 'STO', '#27ae60', 'hdd', 5),
('Mobile', 'Mobile devices and tablets', 'MOB', '#16a085', 'mobile-alt', 6),
('Peripherals', 'Computer peripherals and accessories', 'PER', '#34495e', 'keyboard', 7),
('Infrastructure', 'Facility and infrastructure equipment', 'INF', '#8e44ad', 'building', 8)
ON CONFLICT ("code") DO NOTHING;

-- =====================================================
-- ASSET TYPES SEED DATA
-- =====================================================
INSERT INTO "asset_types" ("category_id", "name", "description", "code", "default_specs", "requires_serial", "requires_location", "requires_warranty", "depreciation_rate", "expected_lifespan", "sort_order") VALUES
-- Hardware Types
((SELECT id FROM asset_categories WHERE code = 'HW'), 'Server', 'Physical or virtual servers', 'SRV', '{"cpu": "Intel Xeon", "ram": "32GB", "storage": "1TB SSD", "network": "Gigabit Ethernet"}', true, true, true, 25, 60, 1),
((SELECT id FROM asset_categories WHERE code = 'HW'), 'Workstation', 'Desktop computers and workstations', 'WKS', '{"cpu": "Intel Core i7", "ram": "16GB", "storage": "512GB SSD", "graphics": "Integrated"}', true, true, true, 30, 48, 2),
((SELECT id FROM asset_categories WHERE code = 'HW'), 'Laptop', 'Portable computers and laptops', 'LAP', '{"cpu": "Intel Core i5", "ram": "8GB", "storage": "256GB SSD", "screen": "14 inch"}', true, false, true, 35, 36, 3),
((SELECT id FROM asset_categories WHERE code = 'HW'), 'Tablet', 'Tablet computers and devices', 'TAB', '{"screen": "10 inch", "storage": "64GB", "connectivity": "WiFi"}', true, false, true, 40, 36, 4),

-- Network Types
((SELECT id FROM asset_categories WHERE code = 'NET'), 'Router', 'Network routing equipment', 'RTR', '{"ports": "24", "speed": "Gigabit", "protocol": "IPv4/IPv6"}', true, true, true, 20, 84, 1),
((SELECT id FROM asset_categories WHERE code = 'NET'), 'Switch', 'Network switching equipment', 'SWI', '{"ports": "48", "speed": "Gigabit", "management": "Managed"}', true, true, true, 20, 84, 2),
((SELECT id FROM asset_categories WHERE code = 'NET'), 'Firewall', 'Network security appliances', 'FW', '{"throughput": "1Gbps", "vpn": "IPSec", "users": "500"}', true, true, true, 25, 60, 3),
((SELECT id FROM asset_categories WHERE code = 'NET'), 'Access Point', 'Wireless access points', 'AP', '{"standard": "802.11ac", "frequency": "Dual Band", "users": "50"}', true, true, true, 30, 48, 4),

-- Software Types
((SELECT id FROM asset_categories WHERE code = 'SW'), 'Operating System', 'Operating system licenses', 'OS', '{"type": "Server", "edition": "Standard", "architecture": "x64"}', false, false, false, 0, 120, 1),
((SELECT id FROM asset_categories WHERE code = 'SW'), 'Application', 'Software applications and licenses', 'APP', '{"type": "Enterprise", "users": "100", "support": "Premium"}', false, false, false, 10, 60, 2),
((SELECT id FROM asset_categories WHERE code = 'SW'), 'Database', 'Database software and licenses', 'DB', '{"type": "Enterprise", "cores": "16", "memory": "Unlimited"}', false, false, false, 15, 84, 3),
((SELECT id FROM asset_categories WHERE code = 'SW'), 'Security Software', 'Security and antivirus software', 'SECSW', '{"type": "Enterprise", "endpoints": "1000", "features": "Advanced"}', false, false, false, 20, 36, 4),

-- Storage Types
((SELECT id FROM asset_categories WHERE code = 'STO'), 'SAN Storage', 'Storage Area Network systems', 'SAN', '{"capacity": "10TB", "interface": "Fibre Channel", "raid": "RAID 6"}', true, true, true, 20, 84, 1),
((SELECT id FROM asset_categories WHERE code = 'STO'), 'NAS Storage', 'Network Attached Storage systems', 'NAS', '{"capacity": "4TB", "interface": "Ethernet", "raid": "RAID 5"}', true, true, true, 25, 60, 2),
((SELECT id FROM asset_categories WHERE code = 'STO'), 'Backup Device', 'Backup and archival devices', 'BAK', '{"capacity": "2TB", "type": "Tape", "interface": "LTO-8"}', true, true, true, 30, 84, 3),

-- Mobile Types
((SELECT id FROM asset_categories WHERE code = 'MOB'), 'Smartphone', 'Mobile phones and smartphones', 'PHN', '{"os": "Android", "storage": "128GB", "screen": "6 inch"}', true, false, true, 50, 24, 1),
((SELECT id FROM asset_categories WHERE code = 'MOB'), 'Mobile Tablet', 'Mobile tablets and devices', 'MTAB', '{"os": "iOS", "storage": "256GB", "screen": "11 inch"}', true, false, true, 45, 36, 2),

-- Peripheral Types
((SELECT id FROM asset_categories WHERE code = 'PER'), 'Monitor', 'Computer monitors and displays', 'MON', '{"size": "24 inch", "resolution": "1920x1080", "interface": "HDMI"}', true, false, true, 25, 60, 1),
((SELECT id FROM asset_categories WHERE code = 'PER'), 'Printer', 'Printers and printing devices', 'PRT', '{"type": "Laser", "color": "Yes", "speed": "30ppm"}', true, true, true, 30, 60, 2),
((SELECT id FROM asset_categories WHERE code = 'PER'), 'Keyboard', 'Computer keyboards', 'KBD', '{"type": "Mechanical", "layout": "QWERTY", "interface": "USB"}', false, false, false, 40, 48, 3),
((SELECT id FROM asset_categories WHERE code = 'PER'), 'Mouse', 'Computer mice and pointing devices', 'MOU', '{"type": "Optical", "buttons": "3", "interface": "USB"}', false, false, false, 50, 36, 4),

-- Infrastructure Types
((SELECT id FROM asset_categories WHERE code = 'INF'), 'UPS', 'Uninterruptible Power Supply', 'UPS', '{"capacity": "1500VA", "runtime": "10min", "outlets": "8"}', true, true, true, 15, 120, 1),
((SELECT id FROM asset_categories WHERE code = 'INF'), 'Rack', 'Server racks and enclosures', 'RACK', '{"height": "42U", "depth": "1000mm", "weight": "1000kg"}', true, true, false, 10, 240, 2),
((SELECT id FROM asset_categories WHERE code = 'INF'), 'Air Conditioning', 'HVAC and cooling systems', 'AC', '{"capacity": "5 tons", "type": "Precision", "efficiency": "High"}', true, true, true, 10, 180, 3)

ON CONFLICT ("code") DO NOTHING;

-- =====================================================
-- ASSET LOCATIONS SEED DATA
-- =====================================================

-- Buildings (Top Level)
INSERT INTO "asset_locations" ("name", "description", "code", "type", "address", "city", "state", "country", "postal_code", "latitude", "longitude", "capacity", "sort_order") VALUES
('Headquarters', 'Main office building', 'HQ', 'building', '123 Business Ave', 'Tech City', 'CA', 'USA', '12345', 37.7749, -122.4194, 1000, 1),
('Data Center 1', 'Primary data center facility', 'DC1', 'building', '456 Server St', 'Data City', 'TX', 'USA', '67890', 32.7767, -96.7970, 500, 2),
('Branch Office East', 'East coast branch office', 'BOE', 'building', '789 Corporate Blvd', 'Metro City', 'NY', 'USA', '11111', 40.7128, -74.0060, 200, 3),
('Warehouse', 'Storage and logistics facility', 'WH1', 'building', '321 Storage Way', 'Industrial City', 'IL', 'USA', '22222', 41.8781, -87.6298, 50, 4)
ON CONFLICT ("code") DO NOTHING;

-- Floors (Second Level)
INSERT INTO "asset_locations" ("parent_id", "name", "description", "code", "type", "capacity", "sort_order") VALUES
-- Headquarters floors
((SELECT id FROM asset_locations WHERE code = 'HQ'), 'Floor 1', 'Ground floor - Reception and common areas', 'HQ-F1', 'floor', 100, 1),
((SELECT id FROM asset_locations WHERE code = 'HQ'), 'Floor 2', 'Second floor - Development teams', 'HQ-F2', 'floor', 150, 2),
((SELECT id FROM asset_locations WHERE code = 'HQ'), 'Floor 3', 'Third floor - Management and sales', 'HQ-F3', 'floor', 120, 3),
((SELECT id FROM asset_locations WHERE code = 'HQ'), 'Basement', 'Basement - IT infrastructure', 'HQ-B1', 'floor', 80, 4),

-- Data Center floors
((SELECT id FROM asset_locations WHERE code = 'DC1'), 'Server Floor', 'Main server floor', 'DC1-SF', 'floor', 400, 1),
((SELECT id FROM asset_locations WHERE code = 'DC1'), 'Network Floor', 'Network equipment floor', 'DC1-NF', 'floor', 100, 2),

-- Branch Office floors
((SELECT id FROM asset_locations WHERE code = 'BOE'), 'Main Floor', 'Main office floor', 'BOE-MF', 'floor', 150, 1),
((SELECT id FROM asset_locations WHERE code = 'BOE'), 'Conference Floor', 'Meeting and conference rooms', 'BOE-CF', 'floor', 50, 2)
ON CONFLICT ("code") DO NOTHING;

-- Rooms (Third Level)
INSERT INTO "asset_locations" ("parent_id", "name", "description", "code", "type", "capacity", "sort_order") VALUES
-- HQ Floor 2 rooms
((SELECT id FROM asset_locations WHERE code = 'HQ-F2'), 'Development Room A', 'Development team workspace', 'HQ-F2-DEVA', 'room', 25, 1),
((SELECT id FROM asset_locations WHERE code = 'HQ-F2'), 'Development Room B', 'Development team workspace', 'HQ-F2-DEVB', 'room', 25, 2),
((SELECT id FROM asset_locations WHERE code = 'HQ-F2'), 'QA Lab', 'Quality assurance testing lab', 'HQ-F2-QA', 'room', 15, 3),
((SELECT id FROM asset_locations WHERE code = 'HQ-F2'), 'Conference Room', 'Team meeting room', 'HQ-F2-CONF', 'room', 10, 4),

-- HQ Basement rooms
((SELECT id FROM asset_locations WHERE code = 'HQ-B1'), 'Server Room', 'Main server room', 'HQ-B1-SRV', 'room', 50, 1),
((SELECT id FROM asset_locations WHERE code = 'HQ-B1'), 'Network Room', 'Network equipment room', 'HQ-B1-NET', 'room', 20, 2),
((SELECT id FROM asset_locations WHERE code = 'HQ-B1'), 'Storage Room', 'Equipment storage', 'HQ-B1-STO', 'room', 10, 3),

-- Data Center rooms
((SELECT id FROM asset_locations WHERE code = 'DC1-SF'), 'Server Room A', 'Primary server room', 'DC1-SF-SRA', 'room', 200, 1),
((SELECT id FROM asset_locations WHERE code = 'DC1-SF'), 'Server Room B', 'Secondary server room', 'DC1-SF-SRB', 'room', 200, 2),
((SELECT id FROM asset_locations WHERE code = 'DC1-NF'), 'Network Operations Center', 'NOC and monitoring', 'DC1-NF-NOC', 'room', 50, 1),
((SELECT id FROM asset_locations WHERE code = 'DC1-NF'), 'Telecom Room', 'Telecommunications equipment', 'DC1-NF-TEL', 'room', 50, 2)
ON CONFLICT ("code") DO NOTHING;

-- Racks (Fourth Level)
INSERT INTO "asset_locations" ("parent_id", "name", "description", "code", "type", "capacity", "sort_order") VALUES
-- Server Room A racks
((SELECT id FROM asset_locations WHERE code = 'DC1-SF-SRA'), 'Rack 1', 'Server rack 1', 'DC1-SF-SRA-R1', 'rack', 42, 1),
((SELECT id FROM asset_locations WHERE code = 'DC1-SF-SRA'), 'Rack 2', 'Server rack 2', 'DC1-SF-SRA-R2', 'rack', 42, 2),
((SELECT id FROM asset_locations WHERE code = 'DC1-SF-SRA'), 'Rack 3', 'Server rack 3', 'DC1-SF-SRA-R3', 'rack', 42, 3),
((SELECT id FROM asset_locations WHERE code = 'DC1-SF-SRA'), 'Rack 4', 'Server rack 4', 'DC1-SF-SRA-R4', 'rack', 42, 4),

-- Server Room B racks
((SELECT id FROM asset_locations WHERE code = 'DC1-SF-SRB'), 'Rack 5', 'Server rack 5', 'DC1-SF-SRB-R5', 'rack', 42, 1),
((SELECT id FROM asset_locations WHERE code = 'DC1-SF-SRB'), 'Rack 6', 'Server rack 6', 'DC1-SF-SRB-R6', 'rack', 42, 2),

-- HQ Server Room racks
((SELECT id FROM asset_locations WHERE code = 'HQ-B1-SRV'), 'HQ Rack 1', 'Headquarters server rack', 'HQ-B1-SRV-R1', 'rack', 42, 1),
((SELECT id FROM asset_locations WHERE code = 'HQ-B1-SRV'), 'HQ Rack 2', 'Headquarters server rack', 'HQ-B1-SRV-R2', 'rack', 42, 2)
ON CONFLICT ("code") DO NOTHING;

-- =====================================================
-- SAMPLE ASSETS SEED DATA
-- =====================================================

-- Get the admin user ID (assuming first admin user)
DO $$
DECLARE
  admin_user_id INTEGER;
  server_type_id INTEGER;
  workstation_type_id INTEGER;
  laptop_type_id INTEGER;
  rack1_location_id INTEGER;
  dev_room_location_id INTEGER;
BEGIN
  -- Get admin user
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  -- Get asset type IDs
  SELECT id INTO server_type_id FROM asset_types WHERE code = 'SRV';
  SELECT id INTO workstation_type_id FROM asset_types WHERE code = 'WKS';
  SELECT id INTO laptop_type_id FROM asset_types WHERE code = 'LAP';
  
  -- Get location IDs
  SELECT id INTO rack1_location_id FROM asset_locations WHERE code = 'DC1-SF-SRA-R1';
  SELECT id INTO dev_room_location_id FROM asset_locations WHERE code = 'HQ-F2-DEVA';
  
  -- Only insert if we have the required data
  IF admin_user_id IS NOT NULL AND server_type_id IS NOT NULL THEN
    -- Sample Servers
    INSERT INTO "assets" ("name", "description", "asset_type_id", "asset_tag", "serial_number", "manufacturer", "model", "location_id", "status", "condition", "purchase_price", "current_value", "purchase_date", "warranty_provider", "warranty_start_date", "warranty_end_date", "warranty_type", "specifications", "ip_address", "hostname", "deployment_date", "tags", "created_by", "updated_by") VALUES
    ('Web Server 01', 'Primary web application server', server_type_id, 'SEED-SRV-WEB-001', 'DL380-12345', 'HPE', 'ProLiant DL380 Gen10', rack1_location_id, 'active', 'excellent', 5000.00, 3500.00, '2023-01-15', 'HPE', '2023-01-15', '2026-01-15', 'manufacturer', '{"cpu": "Intel Xeon Silver 4214R", "ram": "64GB DDR4", "storage": "2x 1TB SSD RAID1", "network": "4x 1GbE", "power": "800W Redundant"}', '192.168.1.10', 'web-srv-01', '2023-01-20', ARRAY['production', 'web', 'critical'], admin_user_id, admin_user_id),
    
    ('Database Server 01', 'Primary database server', server_type_id, 'SEED-SRV-DB-001', 'DL380-67890', 'HPE', 'ProLiant DL380 Gen10', rack1_location_id, 'active', 'excellent', 7500.00, 5250.00, '2023-02-01', 'HPE', '2023-02-01', '2026-02-01', 'manufacturer', '{"cpu": "2x Intel Xeon Gold 5218R", "ram": "128GB DDR4", "storage": "4x 2TB SSD RAID10", "network": "4x 1GbE", "power": "800W Redundant"}', '192.168.1.20', 'db-srv-01', '2023-02-05', ARRAY['production', 'database', 'critical'], admin_user_id, admin_user_id)
    
    ON CONFLICT ("asset_tag") DO NOTHING;
    
    -- Sample Workstations (if we have the type and location)
    IF workstation_type_id IS NOT NULL AND dev_room_location_id IS NOT NULL THEN
      INSERT INTO "assets" ("name", "description", "asset_type_id", "asset_tag", "serial_number", "manufacturer", "model", "location_id", "assigned_to", "status", "condition", "purchase_price", "current_value", "purchase_date", "warranty_provider", "warranty_start_date", "warranty_end_date", "warranty_type", "specifications", "ip_address", "hostname", "deployment_date", "tags", "created_by", "updated_by") VALUES
      ('Developer Workstation 01', 'Development workstation for senior developer', workstation_type_id, 'SEED-WKS-DEV-001', 'OPTIPLEX-11111', 'Dell', 'OptiPlex 7090', dev_room_location_id, admin_user_id, 'active', 'good', 1200.00, 800.00, '2023-03-01', 'Dell', '2023-03-01', '2026-03-01', 'manufacturer', '{"cpu": "Intel Core i7-11700", "ram": "32GB DDR4", "storage": "1TB NVMe SSD", "graphics": "Intel UHD Graphics 750", "network": "Gigabit Ethernet"}', '192.168.2.10', 'dev-wks-01', '2023-03-05', ARRAY['development', 'workstation'], admin_user_id, admin_user_id)
      
      ON CONFLICT ("asset_tag") DO NOTHING;
    END IF;
    
    -- Sample Laptops (if we have the type)
    IF laptop_type_id IS NOT NULL THEN
      INSERT INTO "assets" ("name", "description", "asset_type_id", "asset_tag", "serial_number", "manufacturer", "model", "assigned_to", "status", "condition", "purchase_price", "current_value", "purchase_date", "warranty_provider", "warranty_start_date", "warranty_end_date", "warranty_type", "specifications", "hostname", "deployment_date", "tags", "created_by", "updated_by") VALUES
      ('Manager Laptop 01', 'Laptop for department manager', laptop_type_id, 'SEED-LAP-MGR-001', 'LATITUDE-22222', 'Dell', 'Latitude 5520', admin_user_id, 'active', 'good', 1500.00, 900.00, '2023-04-01', 'Dell', '2023-04-01', '2026-04-01', 'manufacturer', '{"cpu": "Intel Core i7-1165G7", "ram": "16GB DDR4", "storage": "512GB NVMe SSD", "screen": "15.6 inch FHD", "graphics": "Intel Iris Xe"}', 'mgr-lap-01', '2023-04-05', ARRAY['laptop', 'management', 'mobile'], admin_user_id, admin_user_id)
      
      ON CONFLICT ("asset_tag") DO NOTHING;
    END IF;
  END IF;
END $$;

-- =====================================================
-- UPDATE LOCATION COUNTS
-- =====================================================
-- Update location current counts based on actual asset assignments
SELECT update_location_asset_counts();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('seed/0005_seed_data', NOW())
ON CONFLICT ("version") DO NOTHING;
