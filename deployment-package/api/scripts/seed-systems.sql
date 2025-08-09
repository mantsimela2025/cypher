-- =====================================================
-- Systems Seed Data SQL Script
-- =====================================================
-- This script creates the foundational systems that assets will be associated with
-- Run this script directly in your PostgreSQL database

-- Clear existing systems data
DELETE FROM systems;

-- Reset the sequence if needed
-- ALTER SEQUENCE systems_id_seq RESTART WITH 1;

-- Insert Systems Data
INSERT INTO systems (
    system_id,
    name,
    uuid,
    status,
    system_type,
    responsible_organization,
    system_owner,
    information_system_security_officer,
    authorizing_official,
    confidentiality_impact,
    integrity_impact,
    availability_impact,
    description,
    created_at,
    updated_at
) VALUES 
-- SYS-001: Corporate Network Infrastructure
(
    'SYS-001',
    'Corporate Network Infrastructure',
    gen_random_uuid(),
    'operational',
    'Infrastructure',
    'IT Department',
    'John Smith',
    'Jane Doe',
    'Mike Johnson',
    'moderate',
    'moderate',
    'high',
    'Core network infrastructure including servers, switches, routers, and network services',
    NOW(),
    NOW()
),

-- SYS-002: Web Application Platform
(
    'SYS-002',
    'Web Application Platform',
    gen_random_uuid(),
    'operational',
    'Application',
    'Development Team',
    'Sarah Wilson',
    'Jane Doe',
    'Mike Johnson',
    'high',
    'high',
    'moderate',
    'Web applications, application servers, and related web services',
    NOW(),
    NOW()
),

-- SYS-003: Database Management System
(
    'SYS-003',
    'Database Management System',
    gen_random_uuid(),
    'operational',
    'Database',
    'Data Team',
    'Bob Anderson',
    'Jane Doe',
    'Mike Johnson',
    'high',
    'high',
    'high',
    'Database servers and data management systems',
    NOW(),
    NOW()
),

-- SYS-004: Employee Workstation Environment
(
    'SYS-004',
    'Employee Workstation Environment',
    gen_random_uuid(),
    'operational',
    'Workstation',
    'IT Department',
    'John Smith',
    'Jane Doe',
    'Mike Johnson',
    'moderate',
    'moderate',
    'moderate',
    'Employee workstations, laptops, and end-user computing devices',
    NOW(),
    NOW()
),

-- SYS-005: Cloud Services Platform
(
    'SYS-005',
    'Cloud Services Platform',
    gen_random_uuid(),
    'operational',
    'Cloud',
    'Cloud Team',
    'Lisa Chen',
    'Jane Doe',
    'Mike Johnson',
    'moderate',
    'moderate',
    'moderate',
    'Cloud-based resources, virtual machines, and cloud services',
    NOW(),
    NOW()
);

-- Verify the insert
SELECT 
    system_id,
    name,
    system_type,
    status,
    system_owner,
    responsible_organization,
    confidentiality_impact,
    integrity_impact,
    availability_impact
FROM systems 
ORDER BY system_id;

-- Show count
SELECT COUNT(*) as total_systems FROM systems;
