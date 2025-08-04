-- Create permissions for categories module
INSERT INTO permissions (name, description, category, created_at, updated_at) VALUES
('categories:read', 'Read categories and view category information', 'categories', NOW(), NOW()),
('categories:write', 'Create and update categories', 'categories', NOW(), NOW()),
('categories:delete', 'Delete categories', 'categories', NOW(), NOW());

-- Get the System Administrator role ID
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Administrator'
  AND p.name IN ('categories:read', 'categories:write', 'categories:delete')
;

-- Also assign to Security Manager role if it exists
INSERT INTO role_permissions (role_id, permission_id)
SELECT
    r.id as role_id,
    p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND p.name IN ('categories:read', 'categories:write', 'categories:delete')
;