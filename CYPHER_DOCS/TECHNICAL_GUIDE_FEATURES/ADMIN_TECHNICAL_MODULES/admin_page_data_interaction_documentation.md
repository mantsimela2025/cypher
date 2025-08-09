# Admin Page Data Interaction Documentation

## Overview
This document provides comprehensive development documentation for the `/admin` page data interactions in the RAS DASH cybersecurity platform. It covers database schemas, service layers, API endpoints, and UI component integrations for all admin functionality tabs.

## Database Schema Architecture

### Core User Management Schema

#### Users Table (`users`)
**Location:** `shared/schema.ts` (lines 341-355)
```typescript
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  authMethod: text('auth_method').default('password'),
  certificateSubject: text('certificate_subject'),
  certificateExpiry: timestamp('certificate_expiry', { withTimezone: true }),
  role: text('role').default('user'),
  status: text('status').default('active')
});
```

**Type Definitions:**
```typescript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const insertUserSchema = createInsertSchema(users);
export const userRoleEnum = z.enum(['admin', 'manager', 'analyst', 'user']);
```

#### Audit Logs Schema (`auditLogs`)
**Location:** `shared/audit-logs-schema.ts` (lines 69-84)
```typescript
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: integer('entity_id'),
  metadata: jsonb('metadata'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Audit Action Types:**
```typescript
export enum AuditActionTypes {
  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PIV_LOGIN_FAILED = 'PIV_LOGIN_FAILED',
  PIV_LOGIN_ERROR = 'PIV_LOGIN_ERROR',
  
  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_AUTO_PROVISIONED = 'USER_AUTO_PROVISIONED',
  
  // Asset Management
  ASSET_CREATED = 'ASSET_CREATED',
  ASSET_UPDATED = 'ASSET_UPDATED',
  ASSET_DELETED = 'ASSET_DELETED',
  
  // Administrative Actions
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  RESTORE_PERFORMED = 'RESTORE_PERFORMED'
}
```

## Service Layer Architecture

### AuditLogService
**Location:** `server/services/AuditLogService.ts`

**Key Methods:**
- `findByUser(userId: number)` - Get audit logs for specific user
- `findByAction(action: string)` - Filter logs by action type
- `findByResource(resource: string)` - Filter logs by resource type
- `findByIpAddress(ipAddress: string)` - Filter by IP address
- `findRecent(limit = 100)` - Get recent audit entries
- `findWithFilters(filters: AuditLogFilterOptions)` - Advanced filtering
- `logAction(userId, action, resource, resourceId, details, ipAddress)` - Create audit entry
- `getAuditStats(dateFrom?, dateTo?)` - Generate audit statistics

**Filter Interface:**
```typescript
export interface AuditLogFilterOptions {
  userId?: number;
  action?: string;
  resource?: string;
  resourceId?: number;
  ipAddress?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
```

### RoleService
**Location:** `server/services/RoleService.ts`

**Key Methods:**
- `createRole(roleData: any)` - Create new role
- `updateRole(roleId: number, updateData: any)` - Update role
- `activateRole(roleId: number, activatedBy: number)` - Activate role
- `deactivateRole(roleId: number, deactivatedBy: number, reason?)` - Deactivate role
- `assignUserToRole(roleId: number, userId: number, assignedBy: number)` - Assign user to role
- `removeUserFromRole(roleId: number, userId: number, removedBy: number, reason?)` - Remove user from role
- `getRolesByType(roleType: string)` - Get roles by type
- `getRolesByLevel(level: string)` - Get roles by level
- `getUserRoles(userId: number)` - Get user's assigned roles

### PermissionService
**Location:** `server/services/PermissionService.ts`

**Key Methods:**
- `createPermission(permissionData: any)` - Create permission
- `grantPermission(userId, resourceType, action, grantedBy)` - Grant permission to user
- `revokePermission(userId, resourceType, action, revokedBy)` - Revoke permission
- `checkPermission(userId, resourceType, action)` - Check if user has permission
- `getUserPermissions(userId: number)` - Get all user permissions
- `getResourcePermissions(resourceType: string)` - Get permissions for resource
- `bulkGrantPermissions(permissions, grantedBy)` - Bulk grant permissions
- `getPermissionStatistics()` - Generate permission statistics
- `auditUserPermissions(userId: number)` - Audit user permission history

## API Endpoint Architecture

### User Management Endpoints
**Location:** `server/routes/api.ts`

**Primary User Endpoints:**
- `GET /api/users` - List all users (via userController.listUsers)
- `POST /api/users` - Create new user (via userController.createUser)
- `GET /api/users/:id` - Get specific user (via userController.getUser)
- `PUT /api/users/:id` - Update user (via userController.updateUser)
- `DELETE /api/users/:id` - Delete user (via userController.deleteUser)

### Role and Permission Endpoints
**Based on service layer analysis, likely endpoints include:**
- `GET /api/roles` - List all roles
- `POST /api/roles` - Create new role
- `GET /api/roles/:id` - Get specific role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `POST /api/roles/:id/users` - Assign user to role
- `DELETE /api/roles/:id/users/:userId` - Remove user from role

### Audit Log Endpoints
**Based on service layer analysis, likely endpoints include:**
- `GET /api/audit-logs` - List audit logs with filtering
- `GET /api/audit-logs/user/:userId` - Get logs for specific user
- `GET /api/audit-logs/stats` - Get audit statistics
- `POST /api/audit-logs` - Create audit log entry

## Admin Page UI Component Structure

### Main Admin Page
**Location:** `src/pages/admin/index.tsx`

**Key Features:**
- Tab-based navigation for different admin sections
- User management interface
- Role and permission management
- Audit log viewer
- System settings management

### Tab Components Structure

#### 1. Users Tab (`/admin/users`)
**Location:** `src/pages/admin/users/index.tsx`

**Data Flow:**
1. **API Calls:** Uses `@tanstack/react-query` to fetch users via `/api/users`
2. **Form Handling:** Uses `react-hook-form` with `zodResolver` and `CreateUserSchema`
3. **State Management:** Local state for user list, filters, and edit modes
4. **Operations:**
   - Create new users with role assignment
   - Edit existing user information
   - Activate/deactivate user accounts
   - Password reset functionality
   - Role assignment/removal

#### 2. Roles Tab (`/admin/roles`)
**Location:** `src/pages/admin/roles/index.tsx`

**Data Flow:**
1. **API Calls:** Fetches roles via `/api/roles`
2. **Form Handling:** Uses `CreateRoleSchema` for role creation/editing
3. **Permission Management:** Integrates with permission system
4. **Operations:**
   - Create/edit/delete roles
   - Manage role permissions
   - View role assignments
   - Role hierarchy management

#### 3. Audit Logs Tab (`/admin/audit-logs`)
**Location:** `src/pages/admin/audit-logs/index.tsx`

**Data Flow:**
1. **API Calls:** Fetches audit logs via `/api/audit-logs` with advanced filtering
2. **Filtering:** Implements `AuditLogFilterOptions` interface
3. **Real-time Updates:** May include WebSocket for live audit log streaming
4. **Operations:**
   - View comprehensive audit trail
   - Filter by user, action, date range, IP address
   - Export audit reports
   - Search audit entries

## Form Validation Schemas

### User Creation/Update
```typescript
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: userRoleEnum,
  password: z.string().min(8),
});
```

### Role Creation/Update
```typescript
export const CreateRoleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});
```

## Authentication Integration

### Authentication Methods
1. **Password-based:** Standard username/password authentication
2. **PIV/CAC:** Smart card authentication for government users
3. **Certificate-based:** X.509 certificate authentication

### Security Features
- Comprehensive audit logging for all admin actions
- Role-based access control (RBAC)
- Permission granularity at resource and action level
- Session management and timeout
- IP address tracking for security monitoring

## Data Validation and Error Handling

### Client-Side Validation
- Uses Zod schemas with react-hook-form integration
- Real-time validation feedback
- Type-safe form handling

### Server-Side Validation
- Schema validation using drizzle-zod
- Business logic validation in service layer
- Comprehensive error responses

## Integration Points

### External System Integration
1. **GitLab Integration:** User synchronization and project access
2. **LDAP/Active Directory:** Enterprise user management
3. **SIEM Systems:** Security event correlation
4. **Audit Compliance:** Regulatory reporting requirements

### Internal System Integration
1. **Asset Management:** User-asset relationships
2. **Vulnerability Management:** Assignment and tracking
3. **Compliance Framework:** Role-based control mappings
4. **Workflow Engine:** User task assignments

## Performance Considerations

### Database Optimization
- Indexed fields: username, email, role, status, createdAt
- Audit log partitioning by date for performance
- Connection pooling for high-volume operations

### Caching Strategy
- User session caching
- Role/permission caching with invalidation
- Audit log aggregation caching

### Security Performance
- Rate limiting on authentication endpoints
- Audit log rotation and archival
- Permission check optimization

## Development Guidelines

### Code Organization
1. **Service Layer:** Business logic isolation in service classes
2. **Controller Layer:** Request/response handling and validation
3. **Schema Layer:** Centralized data model definitions
4. **UI Components:** Reusable form and table components

### Testing Strategy
1. **Unit Tests:** Service layer method testing
2. **Integration Tests:** API endpoint testing
3. **E2E Tests:** Complete admin workflow testing
4. **Security Tests:** Permission and audit validation

### Monitoring and Observability
1. **Audit Trail:** Complete action logging
2. **Performance Metrics:** Response time monitoring
3. **Security Monitoring:** Failed login attempts, permission violations
4. **Error Tracking:** Comprehensive error logging and alerting

## Conclusion

This documentation provides the complete data interaction flow for the admin page functionality in RAS DASH. The architecture follows enterprise security best practices with comprehensive audit logging, role-based access control, and secure authentication methods suitable for government and DOD environments.

The system is designed for scalability, security, and compliance with federal cybersecurity requirements while maintaining usability for administrators managing complex organizational security postures.