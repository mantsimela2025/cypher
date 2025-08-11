6, 7, 8, 9, 36, 37, 45, 46

-- Distribution Database Population Script
-- This script adds sample data to distribution_groups and distribution_group_members tables

-- Clear existing data (optional, uncomment if needed)
-- TRUNCATE TABLE distribution_group_members CASCADE;
-- TRUNCATE TABLE distribution_groups CASCADE;

-- Insert sample distribution groups
INSERT INTO public.distribution_groups (name, description, created_by) VALUES
('IT Security Team', 'Primary security team responsible for vulnerability management and incident response', 1),
('System Administrators', 'Administrative team with full system access and management responsibilities', 1),
('Development Team', 'Software development team for application updates and deployments', 2),
('Compliance Team', 'Team responsible for regulatory compliance and audit coordination', 3),
('Network Operations', 'Network infrastructure monitoring and maintenance team', 1),
('Executive Leadership', 'Senior management team for strategic decisions and approvals', 4),
('Patch Management Team', 'Specialized team focused on patch deployment and system updates', 2),
('Incident Response Team', 'Emergency response team for security incidents and critical issues', 1),
('Asset Management Team', 'Team responsible for asset inventory and lifecycle management', 3),
('Audit Team', 'Internal audit team for compliance verification and risk assessment', 4);

-- Insert sample group members
-- Assuming user IDs 1-10 exist in the system
INSERT INTO public.distribution_group_members (group_id, user_id) VALUES
-- IT Security Team members
(1, 1),
(1, 5),
(1, 8),
(1, 12),

-- System Administrators members
(2, 1),
(2, 2),
(2, 6),
(2, 9),

-- Development Team members
(3, 2),
(3, 7),
(3, 11),
(3, 15),

-- Compliance Team members
(4, 3),
(4, 10),
(4, 14),

-- Network Operations members
(5, 1),
(5, 4),
(5, 13),

-- Executive Leadership members
(6, 4),
(6, 16),
(6, 17),

-- Patch Management Team members
(7, 2),
(7, 8),
(7, 18),

-- Incident Response Team members
(8, 1),
(8, 5),
(8, 19),
(8, 20),

-- Asset Management Team members
(9, 3),
(9, 11),
(9, 21),

-- Audit Team members
(10, 4),
(10, 22),
(10, 23);

-- Insert additional specialized groups
INSERT INTO public.distribution_groups (name, description, created_by) VALUES
('Emergency Response Team', '24/7 emergency response team for critical system issues', 1),
('Change Advisory Board', 'Board responsible for reviewing and approving system changes', 4),
('Security Operations Center', 'SOC team for continuous security monitoring and threat detection', 1),
('Database Administrators', 'DBA team for database maintenance and performance optimization', 2),
('Application Support Team', 'Support team for application issues and user assistance', 3),
('Infrastructure Team', 'Team managing physical and virtual infrastructure components', 1),
('Business Continuity Team', 'Team responsible for disaster recovery and business continuity planning', 4),
('Vendor Management Team', 'Team managing third-party vendor relationships and contracts', 3),
('Training and Development Team', 'Team responsible for staff training and professional development', 3),
('Quality Assurance Team', 'QA team for testing and quality control processes', 2);

-- Insert members for additional specialized groups
INSERT INTO public.distribution_group_members (group_id, user_id) VALUES
-- Emergency Response Team
(11, 1),
(11, 5),
(11, 24),

-- Change Advisory Board
(12, 4),
(12, 16),
(12, 25),
(12, 26),

-- Security Operations Center
(13, 1),
(13, 5),
(13, 8),
(13, 27),

-- Database Administrators
(14, 2),
(14, 28),
(14, 29),

-- Application Support Team
(15, 3),
(15, 7),
(15, 30),
(15, 31),

-- Infrastructure Team
(16, 1),
(16, 4),
(16, 32),
(16, 33),

-- Business Continuity Team
(17, 4),
(17, 16),
(17, 34),

-- Vendor Management Team
(18, 3),
(18, 35),
(18, 36),

-- Training and Development Team
(19, 3),
(19, 37),
(19, 38),

-- Quality Assurance Team
(20, 2),
(20, 11),
(20, 39);

-- Verify the inserted data
SELECT 
    dg.id,
    dg.name,
    dg.description,
    COUNT(dgm.id) as member_count
FROM public.distribution_groups dg
LEFT JOIN public.distribution_group_members dgm ON dg.id = dgm.group_id
GROUP BY dg.id, dg.name, dg.description
ORDER BY dg.id;

-- Detailed view of group memberships
SELECT 
    dg.name as group_name,
    u.username as member_name,
    dgm.created_at as joined_date
FROM public.distribution_groups dg
JOIN public.distribution_group_members dgm ON dg.id = dgm.group_id
JOIN public.users u ON dgm.user_id = u.id
ORDER BY dg.name, u.username;
