-- Migration: permissions/0004_asset_permissions.sql
-- Description: Create asset management permissions and assign to existing roles
-- Author: Asset Management System
-- Date: 2024-01-19
-- Rollback: DELETE FROM rolePermissions WHERE permissionId IN (SELECT id FROM permissions WHERE module = 'asset_management'); DELETE FROM permissions WHERE module = 'asset_management';

-- =====================================================
-- ASSET MANAGEMENT PERMISSIONS
-- =====================================================

-- Insert asset management permissions
INSERT INTO "permissions" ("name", "description", "module") VALUES
-- Basic CRUD permissions
('asset.view', 'View assets and asset details', 'asset_management'),
('asset.create', 'Create new assets', 'asset_management'),
('asset.edit', 'Edit existing assets', 'asset_management'),
('asset.delete', 'Delete assets (soft delete)', 'asset_management'),

-- Advanced operations
('asset.bulk_operations', 'Perform bulk asset operations', 'asset_management'),
('asset.export', 'Export asset data to various formats', 'asset_management'),
('asset.import', 'Import asset data from files', 'asset_management'),
('asset.restore', 'Restore soft-deleted assets', 'asset_management'),

-- Discovery and automation
('asset.discovery', 'Run automated asset discovery scans', 'asset_management'),
('asset.discovery.configure', 'Configure asset discovery settings', 'asset_management'),

-- Relationships and dependencies
('asset.relationships.view', 'View asset relationships and dependencies', 'asset_management'),
('asset.relationships.manage', 'Create and manage asset relationships', 'asset_management'),
('asset.dependencies.view', 'View asset dependencies', 'asset_management'),
('asset.dependencies.manage', 'Create and manage asset dependencies', 'asset_management'),

-- Groups and organization
('asset.groups.view', 'View asset groups', 'asset_management'),
('asset.groups.manage', 'Create and manage asset groups', 'asset_management'),
('asset.groups.assign', 'Assign assets to groups', 'asset_management'),

-- Reporting and analytics
('asset.reports.view', 'View asset reports and analytics', 'asset_management'),
('asset.reports.create', 'Create custom asset reports', 'asset_management'),
('asset.analytics.view', 'View asset analytics and dashboards', 'asset_management'),

-- Financial management
('asset.financial.view', 'View asset financial information', 'asset_management'),
('asset.financial.edit', 'Edit asset financial information', 'asset_management'),
('asset.depreciation.calculate', 'Calculate and update asset depreciation', 'asset_management'),

-- Maintenance management
('asset.maintenance.view', 'View asset maintenance information', 'asset_management'),
('asset.maintenance.schedule', 'Schedule asset maintenance', 'asset_management'),
('asset.maintenance.complete', 'Mark maintenance as completed', 'asset_management'),

-- Warranty management
('asset.warranty.view', 'View asset warranty information', 'asset_management'),
('asset.warranty.manage', 'Manage asset warranty information', 'asset_management'),

-- Location management
('asset.locations.view', 'View asset locations', 'asset_management'),
('asset.locations.manage', 'Create and manage asset locations', 'asset_management'),
('asset.locations.assign', 'Assign assets to locations', 'asset_management'),

-- Asset types and categories
('asset.types.view', 'View asset types and categories', 'asset_management'),
('asset.types.manage', 'Create and manage asset types and categories', 'asset_management'),

-- Administrative permissions
('asset.admin', 'Full asset management administration', 'asset_management'),
('asset.audit.view', 'View asset audit logs', 'asset_management'),
('asset.settings.manage', 'Manage asset management system settings', 'asset_management')

ON CONFLICT ("name") DO NOTHING;

-- =====================================================
-- ROLE PERMISSION ASSIGNMENTS
-- =====================================================

-- Admin role gets all asset management permissions
INSERT INTO "rolePermissions" ("roleId", "permissionId")
SELECT r.id, p.id 
FROM "roles" r, "permissions" p 
WHERE r.name = 'admin' AND p.module = 'asset_management'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Moderator role gets extended permissions (no admin functions)
INSERT INTO "rolePermissions" ("roleId", "permissionId")
SELECT r.id, p.id 
FROM "roles" r, "permissions" p 
WHERE r.name = 'moderator' AND p.name IN (
  -- Basic operations
  'asset.view', 'asset.create', 'asset.edit', 'asset.delete',
  
  -- Advanced operations
  'asset.bulk_operations', 'asset.export', 'asset.import', 'asset.restore',
  
  -- Relationships and dependencies
  'asset.relationships.view', 'asset.relationships.manage',
  'asset.dependencies.view', 'asset.dependencies.manage',
  
  -- Groups
  'asset.groups.view', 'asset.groups.manage', 'asset.groups.assign',
  
  -- Reporting
  'asset.reports.view', 'asset.reports.create', 'asset.analytics.view',
  
  -- Financial (view only)
  'asset.financial.view',
  
  -- Maintenance
  'asset.maintenance.view', 'asset.maintenance.schedule', 'asset.maintenance.complete',
  
  -- Warranty
  'asset.warranty.view', 'asset.warranty.manage',
  
  -- Locations
  'asset.locations.view', 'asset.locations.manage', 'asset.locations.assign',
  
  -- Types (view only)
  'asset.types.view'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- User role gets basic permissions
INSERT INTO "rolePermissions" ("roleId", "permissionId")
SELECT r.id, p.id 
FROM "roles" r, "permissions" p 
WHERE r.name = 'user' AND p.name IN (
  -- Basic operations
  'asset.view', 'asset.create', 'asset.edit',
  
  -- Basic relationships
  'asset.relationships.view', 'asset.dependencies.view',
  
  -- Groups (view and assign only)
  'asset.groups.view', 'asset.groups.assign',
  
  -- Basic reporting
  'asset.reports.view', 'asset.analytics.view',
  
  -- Maintenance (view and complete only)
  'asset.maintenance.view', 'asset.maintenance.complete',
  
  -- Warranty (view only)
  'asset.warranty.view',
  
  -- Locations (view and assign only)
  'asset.locations.view', 'asset.locations.assign',
  
  -- Types (view only)
  'asset.types.view'
)
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- =====================================================
-- ASSET-SPECIFIC PERMISSION FUNCTIONS
-- =====================================================

-- Function to check if user can access specific asset
CREATE OR REPLACE FUNCTION user_can_access_asset(
  p_user_id INTEGER,
  p_asset_id INTEGER,
  p_permission VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  is_owner BOOLEAN := FALSE;
  is_assigned BOOLEAN := FALSE;
BEGIN
  -- Check if user has the general permission
  SELECT EXISTS(
    SELECT 1 FROM users u
    JOIN "userRoles" ur ON u.id = ur."userId"
    JOIN "rolePermissions" rp ON ur."roleId" = rp."roleId"
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE u.id = p_user_id AND p.name = p_permission
  ) INTO has_permission;
  
  -- If no general permission, check ownership/assignment
  IF NOT has_permission THEN
    SELECT 
      (a.created_by = p_user_id),
      (a.assigned_to = p_user_id)
    INTO is_owner, is_assigned
    FROM assets a
    WHERE a.id = p_asset_id;
    
    -- Allow view access for owners and assigned users
    IF p_permission = 'asset.view' AND (is_owner OR is_assigned) THEN
      has_permission := TRUE;
    END IF;
    
    -- Allow edit access for assigned users (limited fields)
    IF p_permission = 'asset.edit' AND is_assigned THEN
      has_permission := TRUE;
    END IF;
  END IF;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's accessible assets
CREATE OR REPLACE FUNCTION get_user_accessible_assets(
  p_user_id INTEGER,
  p_permission VARCHAR DEFAULT 'asset.view'
) RETURNS TABLE(asset_id INTEGER) AS $$
BEGIN
  -- If user has general permission, return all assets
  IF EXISTS(
    SELECT 1 FROM users u
    JOIN "userRoles" ur ON u.id = ur."userId"
    JOIN "rolePermissions" rp ON ur."roleId" = rp."roleId"
    JOIN permissions p ON rp."permissionId" = p.id
    WHERE u.id = p_user_id AND p.name = p_permission
  ) THEN
    RETURN QUERY SELECT a.id FROM assets a WHERE a.is_deleted = false;
  ELSE
    -- Return only owned or assigned assets
    RETURN QUERY 
    SELECT a.id FROM assets a 
    WHERE a.is_deleted = false 
      AND (a.created_by = p_user_id OR a.assigned_to = p_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISSION VALIDATION TRIGGERS
-- =====================================================

-- Function to validate asset operations
CREATE OR REPLACE FUNCTION validate_asset_operation()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id INTEGER;
BEGIN
  -- Get current user from session (this would be set by your application)
  current_user_id := COALESCE(
    NULLIF(current_setting('app.current_user_id', true), '')::INTEGER,
    NEW.created_by,
    NEW.updated_by
  );
  
  -- Validate create operation
  IF TG_OP = 'INSERT' THEN
    IF NOT user_can_access_asset(current_user_id, NEW.id, 'asset.create') THEN
      RAISE EXCEPTION 'Insufficient permissions to create asset';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Validate update operation
  IF TG_OP = 'UPDATE' THEN
    IF NOT user_can_access_asset(current_user_id, NEW.id, 'asset.edit') THEN
      RAISE EXCEPTION 'Insufficient permissions to edit asset';
    END IF;
    RETURN NEW;
  END IF;
  
  -- Validate delete operation
  IF TG_OP = 'DELETE' THEN
    IF NOT user_can_access_asset(current_user_id, OLD.id, 'asset.delete') THEN
      RAISE EXCEPTION 'Insufficient permissions to delete asset';
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: Triggers are commented out as permission validation should be handled at application level
-- Uncomment if you want database-level permission enforcement
-- CREATE TRIGGER trigger_validate_asset_operation
--   BEFORE INSERT OR UPDATE OR DELETE ON assets
--   FOR EACH ROW
--   EXECUTE FUNCTION validate_asset_operation();

-- =====================================================
-- PERMISSION REPORTING VIEWS
-- =====================================================

-- View to show permission assignments by role
CREATE OR REPLACE VIEW asset_permissions_by_role AS
SELECT 
  r.name as role_name,
  p.name as permission_name,
  p.description as permission_description,
  p.module
FROM roles r
JOIN "rolePermissions" rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'asset_management'
ORDER BY r.name, p.name;

-- View to show users with asset management permissions
CREATE OR REPLACE VIEW users_with_asset_permissions AS
SELECT DISTINCT
  u.id as user_id,
  u."firstName",
  u."lastName",
  u.email,
  r.name as role_name,
  COUNT(p.id) as permission_count
FROM users u
JOIN "userRoles" ur ON u.id = ur."userId"
JOIN roles r ON ur."roleId" = r.id
JOIN "rolePermissions" rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE p.module = 'asset_management'
GROUP BY u.id, u."firstName", u."lastName", u.email, r.name
ORDER BY u."lastName", u."firstName";

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Insert migration record
INSERT INTO "schema_migrations" ("version", "applied_at") 
VALUES ('permissions/0004_asset_permissions', NOW())
ON CONFLICT ("version") DO NOTHING;
