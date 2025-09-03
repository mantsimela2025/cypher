-- Migration: permissions/0011_systems_permissions.sql
-- Description: Create systems management permissions and assign to existing roles
-- Author: Systems Management Team
-- Date: 2024-01-19
-- Rollback: DELETE FROM rolePermissions WHERE permissionId IN (SELECT id FROM permissions WHERE module = 'systems_management'); DELETE FROM permissions WHERE module = 'systems_management';

-- =====================================================
-- SYSTEMS MANAGEMENT PERMISSIONS
-- =====================================================

-- Insert systems management permissions
INSERT INTO "permissions" ("name", "description", "module") VALUES
-- Basic CRUD permissions
('systems.view', 'View systems and system details', 'systems_management'),
('systems.create', 'Create new systems', 'systems_management'),
('systems.edit', 'Edit existing systems', 'systems_management'),
('systems.delete', 'Delete systems', 'systems_management'),

-- System discovery permissions
('systems.discovery.view', 'View system discovery scans and results', 'systems_management'),
('systems.discovery.create', 'Create and run system discovery scans', 'systems_management'),
('systems.discovery.configure', 'Configure system discovery settings', 'systems_management'),
('systems.discovery.process', 'Process discovery results and create systems', 'systems_management'),

-- Security posture permissions
('systems.security_posture.view', 'View system security posture assessments', 'systems_management'),
('systems.security_posture.assess', 'Conduct security posture assessments', 'systems_management'),
('systems.security_posture.update', 'Update security posture scores and status', 'systems_management'),

-- Configuration drift permissions
('systems.config_drift.view', 'View configuration drift alerts', 'systems_management'),
('systems.config_drift.acknowledge', 'Acknowledge configuration drift issues', 'systems_management'),
('systems.config_drift.resolve', 'Resolve configuration drift issues', 'systems_management'),
('systems.config_drift.accept', 'Accept configuration drift as business decision', 'systems_management'),

-- Correlation analysis permissions
('systems.correlations.view', 'View cross-system correlations', 'systems_management'),
('systems.correlations.analyze', 'Analyze and create system correlations', 'systems_management'),
('systems.correlations.assign', 'Assign correlations to team members', 'systems_management'),
('systems.correlations.resolve', 'Resolve correlation issues', 'systems_management'),

-- Enterprise risk permissions
('systems.enterprise_risk.view', 'View enterprise risk aggregations and trends', 'systems_management'),
('systems.enterprise_risk.generate', 'Generate enterprise risk reports', 'systems_management'),
('systems.enterprise_risk.analyze', 'Analyze enterprise risk trends and patterns', 'systems_management'),

-- Authorization and compliance permissions
('systems.authorization.view', 'View system authorization status', 'systems_management'),
('systems.authorization.manage', 'Manage system authorizations and renewals', 'systems_management'),
('systems.compliance.view', 'View system compliance status', 'systems_management'),
('systems.compliance.assess', 'Conduct compliance assessments', 'systems_management'),

-- Impact level permissions
('systems.impact_levels.view', 'View system impact levels (CIA triad)', 'systems_management'),
('systems.impact_levels.edit', 'Edit system impact level classifications', 'systems_management'),

-- Reporting and analytics permissions
('systems.reports.view', 'View systems reports and dashboards', 'systems_management'),
('systems.reports.create', 'Create custom systems reports', 'systems_management'),
('systems.analytics.view', 'View systems analytics and trends', 'systems_management'),
('systems.analytics.advanced', 'Access advanced analytics and AI insights', 'systems_management'),

-- Bulk operations permissions
('systems.bulk_operations', 'Perform bulk operations on systems', 'systems_management'),
('systems.export', 'Export systems data', 'systems_management'),
('systems.import', 'Import systems data from external sources', 'systems_management'),

-- Administrative permissions
('systems.admin', 'Full systems management administration', 'systems_management'),
('systems.audit.view', 'View systems audit logs', 'systems_management'),
('systems.settings.manage', 'Manage systems management settings', 'systems_management'),
('systems.integrations.manage', 'Manage external system integrations', 'systems_management')

ON CONFLICT ("name") DO NOTHING;

-- =====================================================
-- ROLE PERMISSION ASSIGNMENTS
-- =====================================================

-- Admin role gets all systems management permissions
INSERT INTO "rolePermissions" ("roleId", "permissionId")
SELECT r.id, p.id 
FROM "roles" r, "permissions" p 
WHERE r.name = 'admin' AND p.module = 'systems_management'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Moderator role gets extended permissions (no admin functions)
INSERT INTO "rolePermissions" ("roleId", "permissionId")
SELECT r.id, p.id 
FROM "roles" r, "permissions" p 
WHERE r.name = 'moderator' AND p.name IN (
  -- Basic operations
  'systems.view', 'systems.create', 'systems.edit', 'systems.delete',
  
  -- Discovery operations
  'systems.discovery.view', 'systems.discovery.create', 'systems.discovery.process',
  
  -- Security posture
  'systems.security_posture.view', 'systems.security_posture.assess', 'systems.security_posture.update',
  
  -- Configuration drift
  'systems.config_drift.view', 'systems.config_drift.acknowledge', 'systems.config_drift.resolve',
  
  -- Correlations
  'systems.correlations.view', 'systems.correlations.analyze', 'systems.correlations.assign', 'systems.correlations.resolve',
  
  -- Enterprise risk (view and generate)
  'systems.enterprise_risk.view', 'systems.enterprise_risk.generate',
  
  -- Authorization and compliance
  'systems.authorization.view', 'systems.authorization.manage',
  'systems.compliance.view', 'systems.compliance.assess',
  
  -- Impact levels
  'systems.impact_levels.view', 'systems.impact_levels.edit',
  
  -- Reporting
  'systems.reports.view', 'systems.reports.create', 'systems.analytics.view',
  
  -- Bulk operations
  'systems.bulk_operations', 'systems.export', 'systems.import'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- User role gets basic permissions
INSERT INTO "rolePermissions" ("roleId", "permissionId")
SELECT r.id, p.id 
FROM "roles" r, "permissions" p 
WHERE r.name = 'user' AND p.name IN (
  -- Basic operations
  'systems.view', 'systems.create', 'systems.edit',
  
  -- Discovery (view only)
  'systems.discovery.view',
  
  -- Security posture (view only)
  'systems.security_posture.view',
  
  -- Configuration drift (view and acknowledge)
  'systems.config_drift.view', 'systems.config_drift.acknowledge',
  
  -- Correlations (view only)
  'systems.correlations.view',
  
  -- Enterprise risk (view only)
  'systems.enterprise_risk.view',
  
  -- Authorization and compliance (view only)
  'systems.authorization.view', 'systems.compliance.view',
  
  -- Impact levels (view only)
  'systems.impact_levels.view',
  
  -- Basic reporting
  'systems.reports.view', 'systems.analytics.view'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- =====================================================
-- SYSTEMS-SPECIFIC PERMISSION FUNCTIONS
-- =====================================================

-- Function to check if user can access specific system
CREATE OR REPLACE FUNCTION user_can_access_system(
  p_user_id INTEGER,
  p_system_id INTEGER,
  p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  is_owner BOOLEAN := FALSE;
  system_owner_name VARCHAR;
  user_name VARCHAR;
BEGIN
  -- Check if user has the general permission
  SELECT EXISTS(
    SELECT 1 FROM users u
    JOIN "userRoles" ur ON u.id = ur."userId"
    JOIN "rolePermissions" rp ON ur."roleId" = rp."roleId"
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE u.id = p_user_id AND p.name = p_permission
  ) INTO has_permission;
  
  -- If no general permission, check system ownership
  IF NOT has_permission THEN
    SELECT 
      s.system_owner,
      u.first_name || ' ' || u.last_name
    INTO system_owner_name, user_name
    FROM systems s, users u
    WHERE s.id = p_system_id AND u.id = p_user_id;
    
    -- Check if user is the system owner
    IF system_owner_name IS NOT NULL AND user_name IS NOT NULL THEN
      is_owner := (LOWER(system_owner_name) = LOWER(user_name));
    END IF;
    
    -- Allow view access for system owners
    IF p_permission = 'systems.view' AND is_owner THEN
      has_permission := TRUE;
    END IF;
    
    -- Allow limited edit access for system owners
    IF p_permission IN ('systems.edit', 'systems.config_drift.acknowledge') AND is_owner THEN
      has_permission := TRUE;
    END IF;
  END IF;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's accessible systems
CREATE OR REPLACE FUNCTION get_user_accessible_systems(
  p_user_id INTEGER,
  p_permission VARCHAR DEFAULT 'systems.view'
) RETURNS TABLE(system_id INTEGER) AS $$
BEGIN
  -- If user has general permission, return all systems
  IF EXISTS(
    SELECT 1 FROM users u
    JOIN "userRoles" ur ON u.id = ur."userId"
    JOIN "rolePermissions" rp ON ur."roleId" = rp."roleId"
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE u.id = p_user_id AND p.name = p_permission
  ) THEN
    RETURN QUERY SELECT s.id FROM systems s;
  ELSE
    -- Return only systems where user is the owner
    RETURN QUERY 
    SELECT s.id FROM systems s, users u
    WHERE u.id = p_user_id 
      AND LOWER(s.system_owner) = LOWER(u.first_name || ' ' || u.last_name);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check discovery scan permissions
CREATE OR REPLACE FUNCTION user_can_access_discovery_scan(
  p_user_id INTEGER,
  p_scan_id INTEGER,
  p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
BEGIN
  -- Check if user has the general discovery permission
  SELECT EXISTS(
    SELECT 1 FROM users u
    JOIN "userRoles" ur ON u.id = ur."userId"
    JOIN "rolePermissions" rp ON ur."roleId" = rp."roleId"
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE u.id = p_user_id AND p.name = p_permission
  ) INTO has_permission;
  
  -- Additional logic could be added here for scan-specific permissions
  -- For example, checking if user created the scan or is assigned to it
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISSION REPORTING VIEWS
-- =====================================================

-- View to show systems permission assignments by role
CREATE OR REPLACE VIEW systems_permissions_by_role AS
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.description as permission_description,
  p.module,
  CASE 
    WHEN p.name LIKE '%.view' THEN 'read'
    WHEN p.name LIKE '%.create' OR p.name LIKE '%.edit' OR p.name LIKE '%.update' THEN 'write'
    WHEN p.name LIKE '%.delete' OR p.name LIKE '%.resolve' THEN 'delete'
    WHEN p.name LIKE '%.admin' OR p.name LIKE '%.manage' THEN 'admin'
    ELSE 'other'
  END as permission_type
FROM roles r
JOIN "rolePermissions" rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'systems_management'
ORDER BY r.name, permission_type, p.name;

-- View to show users with systems management permissions
CREATE OR REPLACE VIEW users_with_systems_permissions AS
SELECT DISTINCT
  u.id as user_id,
  u."firstName",
  u."lastName",
  u.email,
  r.name as role_name,
  COUNT(p.id) as permission_count,
  ARRAY_AGG(DISTINCT 
    CASE 
      WHEN p.name LIKE '%.view' THEN 'read'
      WHEN p.name LIKE '%.create' OR p.name LIKE '%.edit' OR p.name LIKE '%.update' THEN 'write'
      WHEN p.name LIKE '%.delete' OR p.name LIKE '%.resolve' THEN 'delete'
      WHEN p.name LIKE '%.admin' OR p.name LIKE '%.manage' THEN 'admin'
      ELSE 'other'
    END
  ) as permission_types
FROM users u
JOIN "userRoles" ur ON u.id = ur."userId"
JOIN roles r ON ur."roleId" = r.id
JOIN "rolePermissions" rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'systems_management'
GROUP BY u.id, u."firstName", u."lastName", u.email, r.name
ORDER BY u."lastName", u."firstName";

-- View for systems access control summary
CREATE OR REPLACE VIEW systems_access_control_summary AS
SELECT 
  s.system_id,
  s.name as system_name,
  s.system_owner,
  s.system_type,
  s.confidentiality_impact,
  s.integrity_impact,
  s.availability_impact,
  COUNT(DISTINCT u.id) as users_with_access,
  COUNT(DISTINCT CASE WHEN p.name LIKE '%.admin' OR p.name LIKE '%.manage' THEN u.id END) as admin_users,
  COUNT(DISTINCT CASE WHEN p.name LIKE '%.edit' OR p.name LIKE '%.update' THEN u.id END) as edit_users,
  COUNT(DISTINCT CASE WHEN p.name LIKE '%.view' THEN u.id END) as view_users
FROM systems s
CROSS JOIN users u
JOIN "userRoles" ur ON u.id = ur."userId"
JOIN "rolePermissions" rp ON ur."roleId" = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'systems_management'
GROUP BY s.id, s.system_id, s.name, s.system_owner, s.system_type,
         s.confidentiality_impact, s.integrity_impact, s.availability_impact
ORDER BY s.name;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('permissions/0011_systems_permissions', NOW())
ON CONFLICT ("version") DO NOTHING;
