const { db } = require('../db');
const { roles, permissions, rolePermissions, userRoles, users } = require('../db/schema');
const { eq, and, inArray } = require('drizzle-orm');
const { clearUserPermissionCache, clearAllPermissionCache } = require('../middleware/rbac');

const rbacService = {
  // Role management
  async createRole(roleData) {
    try {
      const [newRole] = await db
        .insert(roles)
        .values(roleData)
        .returning();
      
      return newRole;
    } catch (error) {
      throw new Error(`Failed to create role: ${error.message}`);
    }
  },

  async getAllRoles() {
    try {
      return await db.select().from(roles).orderBy(roles.name);
    } catch (error) {
      throw new Error(`Failed to get roles: ${error.message}`);
    }
  },

  async getRoleById(id) {
    try {
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id));
      
      return role || null;
    } catch (error) {
      throw new Error(`Failed to get role: ${error.message}`);
    }
  },

  async updateRole(id, updateData) {
    try {
      const [updatedRole] = await db
        .update(roles)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(roles.id, id))
        .returning();
      
      if (updatedRole) {
        clearAllPermissionCache(); // Clear cache when role is updated
      }
      
      return updatedRole || null;
    } catch (error) {
      throw new Error(`Failed to update role: ${error.message}`);
    }
  },

  async deleteRole(id) {
    try {
      // Check if role is system role
      const [role] = await db
        .select({ isSystem: roles.isSystem })
        .from(roles)
        .where(eq(roles.id, id));
      
      if (role?.isSystem) {
        throw new Error('Cannot delete system role');
      }

      const [deletedRole] = await db
        .delete(roles)
        .where(eq(roles.id, id))
        .returning({ id: roles.id });
      
      if (deletedRole) {
        clearAllPermissionCache(); // Clear cache when role is deleted
      }
      
      return deletedRole || null;
    } catch (error) {
      throw new Error(`Failed to delete role: ${error.message}`);
    }
  },

  // Permission management
  async createPermission(permissionData) {
    try {
      const [newPermission] = await db
        .insert(permissions)
        .values(permissionData)
        .returning();
      
      return newPermission;
    } catch (error) {
      throw new Error(`Failed to create permission: ${error.message}`);
    }
  },

  async getAllPermissions() {
    try {
      return await db.select().from(permissions).orderBy(permissions.resource, permissions.action);
    } catch (error) {
      throw new Error(`Failed to get permissions: ${error.message}`);
    }
  },

  async getPermissionById(id) {
    try {
      const [permission] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.id, id));
      
      return permission || null;
    } catch (error) {
      throw new Error(`Failed to get permission: ${error.message}`);
    }
  },

  // Role-Permission management
  async assignPermissionsToRole(roleId, permissionIds) {
    try {
      // Remove existing permissions for this role
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      // Add new permissions
      if (permissionIds.length > 0) {
        const rolePermissionData = permissionIds.map(permissionId => ({
          roleId,
          permissionId,
        }));

        await db.insert(rolePermissions).values(rolePermissionData);
      }

      clearAllPermissionCache(); // Clear cache when permissions change
      return true;
    } catch (error) {
      throw new Error(`Failed to assign permissions to role: ${error.message}`);
    }
  },

  async getRolePermissions(roleId) {
    try {
      return await db
        .select({
          id: permissions.id,
          name: permissions.name,
          category: permissions.category,
          description: permissions.description,
        })
        .from(rolePermissions)
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(rolePermissions.roleId, roleId));
    } catch (error) {
      throw new Error(`Failed to get role permissions: ${error.message}`);
    }
  },

  // User-Role management
  async assignRolesToUser(userId, roleIds) {
    try {
      // Remove existing roles for this user
      await db
        .delete(userRoles)
        .where(eq(userRoles.userId, userId));

      // Add new roles
      if (roleIds.length > 0) {
        const userRoleData = roleIds.map(roleId => ({
          userId,
          roleId,
        }));

        await db.insert(userRoles).values(userRoleData);
      }

      clearUserPermissionCache(userId); // Clear cache for this user
      return true;
    } catch (error) {
      throw new Error(`Failed to assign roles to user: ${error.message}`);
    }
  },

  async getUserRoles(userId) {
    try {
      return await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          isSystem: roles.isSystem,
          isDefault: roles.isDefault,
          assignedAt: userRoles.assignedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, userId));
    } catch (error) {
      throw new Error(`Failed to get user roles: ${error.message}`);
    }
  },

  async removeRoleFromUser(userId, roleId) {
    try {
      const [removedRole] = await db
        .delete(userRoles)
        .where(and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId)
        ))
        .returning({ id: userRoles.id });

      if (removedRole) {
        clearUserPermissionCache(userId); // Clear cache for this user
      }

      return removedRole || null;
    } catch (error) {
      throw new Error(`Failed to remove role from user: ${error.message}`);
    }
  },

  // Utility functions
  async initializeDefaultRolesAndPermissions() {
    try {
      // Create default permissions
      const defaultPermissions = [
        { name: 'users:read', category: 'users', description: 'View user information' },
        { name: 'users:write', category: 'users', description: 'Create and update users' },
        { name: 'users:delete', category: 'users', description: 'Delete users' },
        { name: 'roles:read', category: 'roles', description: 'View roles' },
        { name: 'roles:write', category: 'roles', description: 'Create and update roles' },
        { name: 'roles:delete', category: 'roles', description: 'Delete roles' },
        { name: 'admin:dashboard', category: 'admin', description: 'Access admin dashboard' },
        { name: 'system:manage', category: 'system', description: 'Manage system settings' },
      ];

      for (const permission of defaultPermissions) {
        await db
          .insert(permissions)
          .values(permission)
          .onConflictDoNothing();
      }

      // Create default roles
      const defaultRoles = [
        { name: 'admin', description: 'Full system access', isSystem: true, isDefault: false },
        { name: 'user', description: 'Basic user access', isSystem: true, isDefault: true },
        { name: 'moderator', description: 'Moderate content and users', isSystem: false, isDefault: false },
      ];

      for (const role of defaultRoles) {
        await db
          .insert(roles)
          .values(role)
          .onConflictDoNothing();
      }

      console.log('✅ Default roles and permissions initialized');
    } catch (error) {
      console.error('Failed to initialize default roles and permissions:', error);
    }
  },
};

module.exports = rbacService;
