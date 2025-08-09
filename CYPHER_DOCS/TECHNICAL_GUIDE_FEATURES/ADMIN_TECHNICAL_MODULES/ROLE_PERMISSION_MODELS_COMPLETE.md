# Role-Based Access Control (RBAC) Models Implementation

## Overview
Complete Sequelize model implementation for role-based access control system based on `shared/schema.ts`. These models provide comprehensive user role management, permission control, and access authorization capabilities for the vulnerability management platform.

## Models Created

### Role
- **Purpose**: Define system roles with descriptions and system role designation
- **Key Fields**: name (unique), description, isSystemRole flag
- **Features**: System role protection, unique naming constraints
- **Associations**: Many-to-many with Users and Permissions
- **Indexes**: Unique name, system role flag for efficient role queries

### Permission
- **Purpose**: Define granular permissions with categorization
- **Key Fields**: name (unique), description, category for organization
- **Features**: Permission categorization, descriptive naming
- **Associations**: Many-to-many with Roles through RolePermissions
- **Indexes**: Unique name, category indexing for permission management

### RolePermission
- **Purpose**: Junction table linking roles to their permissions
- **Key Fields**: roleId, permissionId with cascade delete protection
- **Features**: Unique role-permission combinations, audit trail
- **Constraints**: Composite unique index preventing duplicate assignments
- **Associations**: Belongs to Role and Permission models

### UserRole
- **Purpose**: Junction table linking users to their assigned roles
- **Key Fields**: userId, roleId with cascade delete protection
- **Features**: Unique user-role combinations, role assignment tracking
- **Constraints**: Composite unique index preventing duplicate role assignments
- **Associations**: Belongs to User and Role models

## RBAC Architecture

### Permission Hierarchy
```
Users (many) ←→ UserRoles ←→ Roles (many)
                                ↓
                         RolePermissions
                                ↓
                         Permissions (many)
```

### Access Control Flow
1. **User Authentication**: User logs into system
2. **Role Resolution**: System queries UserRole to find assigned roles
3. **Permission Aggregation**: System queries RolePermission to collect all permissions
4. **Access Authorization**: System checks if user has required permission for action

## Database Schema Features

### Referential Integrity
- **Cascade Deletes**: Automatic cleanup when roles or users are removed
- **Foreign Key Constraints**: Ensure data consistency across relationships
- **Unique Constraints**: Prevent duplicate role/permission assignments
- **Index Optimization**: Efficient queries for authorization checks

### Performance Optimization
- **Junction Table Indexing**: Optimized for many-to-many relationship queries
- **Composite Indexes**: Unique constraints with performance benefits
- **Role/Permission Caching**: Efficient authorization decision making
- **Minimal Join Operations**: Streamlined permission resolution

### Security Features
- **System Role Protection**: isSystemRole flag prevents accidental modification
- **Permission Categorization**: Organized access control by functional areas
- **Audit Trail**: Creation timestamps for role assignment tracking
- **Role Isolation**: Separate roles from users for flexible assignment

## Permission Categories

### System Administration
- `system.admin` - Full system administration access
- `system.settings` - System configuration management
- `system.backup` - Database backup and restore operations
- `system.logs` - System log access and management

### User Management
- `users.create` - Create new user accounts
- `users.read` - View user information
- `users.update` - Modify user accounts
- `users.delete` - Remove user accounts
- `users.roles` - Assign/revoke user roles

### Vulnerability Management
- `vulnerabilities.create` - Add new vulnerabilities
- `vulnerabilities.read` - View vulnerability data
- `vulnerabilities.update` - Modify vulnerability information
- `vulnerabilities.delete` - Remove vulnerabilities
- `vulnerabilities.assess` - Perform vulnerability assessments

### POAM Management
- `poams.create` - Create plans of action and milestones
- `poams.read` - View POAM information
- `poams.update` - Modify POAM details
- `poams.approve` - Approve POAM submissions
- `poams.close` - Close completed POAMs

### Asset Management
- `assets.create` - Add new assets to inventory
- `assets.read` - View asset information
- `assets.update` - Modify asset details
- `assets.delete` - Remove assets from inventory
- `assets.scan` - Initiate asset vulnerability scans

### Compliance Management
- `compliance.read` - View compliance status
- `compliance.assess` - Perform compliance assessments
- `compliance.report` - Generate compliance reports
- `compliance.controls` - Manage security controls

### Reporting
- `reports.create` - Generate custom reports
- `reports.read` - View existing reports
- `reports.schedule` - Schedule automated reports
- `reports.export` - Export report data

## Default Role Structure

### Administrator
- **Description**: Full system access and administration
- **Permissions**: All system permissions
- **Users**: System administrators, security managers
- **System Role**: Yes (protected from deletion)

### Security Manager
- **Description**: Vulnerability and compliance management
- **Permissions**: Vulnerability, POAM, compliance, and reporting permissions
- **Users**: Information system security managers
- **System Role**: Yes

### Security Analyst
- **Description**: Vulnerability assessment and remediation
- **Permissions**: Read/update vulnerabilities, create/manage POAMs, view reports
- **Users**: Security analysts, vulnerability assessors
- **System Role**: Yes

### Asset Manager
- **Description**: Asset inventory and lifecycle management
- **Permissions**: Full asset management, read-only vulnerability access
- **Users**: Asset managers, system administrators
- **System Role**: No

### Auditor
- **Description**: Read-only access for compliance auditing
- **Permissions**: Read-only access to all data, report generation
- **Users**: Compliance auditors, external assessors
- **System Role**: No

### Viewer
- **Description**: Basic read-only access to assigned areas
- **Permissions**: Limited read access based on assignment
- **Users**: Management, stakeholders requiring visibility
- **System Role**: Yes

## Implementation Examples

### Role Creation and Permission Assignment
```typescript
// Create new role
const analystRole = await Role.create({
  name: 'Security Analyst',
  description: 'Vulnerability assessment and remediation specialist',
  isSystemRole: false
});

// Create permissions
const vulnRead = await Permission.create({
  name: 'vulnerabilities.read',
  description: 'View vulnerability information',
  category: 'vulnerability_management'
});

const vulnUpdate = await Permission.create({
  name: 'vulnerabilities.update', 
  description: 'Modify vulnerability details',
  category: 'vulnerability_management'
});

// Assign permissions to role
await RolePermission.bulkCreate([
  { roleId: analystRole.id, permissionId: vulnRead.id },
  { roleId: analystRole.id, permissionId: vulnUpdate.id }
]);
```

### User Role Assignment
```typescript
// Assign role to user
await UserRole.create({
  userId: user.id,
  roleId: analystRole.id
});

// Query user permissions
const userPermissions = await Permission.findAll({
  include: [{
    model: Role,
    as: 'roles',
    include: [{
      model: User,
      as: 'users',
      where: { id: user.id }
    }]
  }]
});
```

### Authorization Check
```typescript
// Check if user has specific permission
const hasPermission = async (userId: number, permissionName: string): Promise<boolean> => {
  const permission = await Permission.findOne({
    where: { name: permissionName },
    include: [{
      model: Role,
      as: 'roles',
      include: [{
        model: User,
        as: 'users',
        where: { id: userId }
      }]
    }]
  });
  
  return !!permission;
};

// Usage in middleware
if (await hasPermission(req.user.id, 'vulnerabilities.update')) {
  // Allow access to vulnerability update functionality
} else {
  // Deny access
  return res.status(403).json({ error: 'Insufficient permissions' });
}
```

## Security Considerations

### Role Assignment Security
- **Principle of Least Privilege**: Users assigned minimum necessary permissions
- **Role Segregation**: Separation of duties through distinct role definitions
- **System Role Protection**: Critical roles marked as system roles
- **Assignment Auditing**: All role assignments tracked with timestamps

### Permission Management
- **Granular Control**: Fine-grained permissions for specific operations
- **Category Organization**: Logical grouping for easier management
- **Dynamic Authorization**: Runtime permission checking for all operations
- **Permission Inheritance**: Roles inherit all assigned permissions

### Data Protection
- **Cascade Protection**: Automatic cleanup prevents orphaned relationships
- **Referential Integrity**: Foreign key constraints maintain data consistency
- **Unique Constraints**: Prevent duplicate assignments and naming conflicts
- **Index Performance**: Optimized for high-frequency authorization queries

## Integration with Existing Systems

### User Model Integration
- Maintains backward compatibility with existing user.role enum field
- UserRole model provides enhanced role assignment capabilities
- Supports multiple roles per user for complex authorization scenarios
- Legacy role field can be used for primary role designation

### Authentication Integration
- Works with existing PIV/CAC and password authentication methods
- Role-based access applies regardless of authentication method
- Supports certificate-based role assignment for CAC users
- Session-based permission caching for performance

### API Integration
- Middleware functions for route-level permission checking
- Decorator patterns for method-level authorization
- Bulk permission queries for dashboard and reporting features
- RESTful endpoints for role and permission management

This comprehensive RBAC implementation provides enterprise-grade access control capabilities with flexible role assignment, granular permissions, and robust security features suitable for government and enterprise vulnerability management environments.