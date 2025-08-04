const { db } = require('../db');
const { users, roles, permissions, rolePermissions, userRoles } = require('../db/schema');
const { eq } = require('drizzle-orm');

// Cache for user permissions to avoid repeated database queries
const permissionCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get user permissions with caching
const getUserPermissions = async (userId) => {
  const cacheKey = `user_${userId}`;
  const cached = permissionCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.permissions;
  }

  try {
    // Query to get all permissions for a user through their roles
    const userPermissions = await db
      .select({
        permission: permissions.name,
        category: permissions.category,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        eq(userRoles.userId, userId)
      );

    const permissionSet = new Set(userPermissions.map(p => p.permission));
    
    // Cache the result
    permissionCache.set(cacheKey, {
      permissions: permissionSet,
      timestamp: Date.now(),
    });

    return permissionSet;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return new Set();
  }
};

// Clear cache for a specific user (call when user roles change)
const clearUserPermissionCache = (userId) => {
  permissionCache.delete(`user_${userId}`);
};

// Clear all permission cache
const clearAllPermissionCache = () => {
  permissionCache.clear();
};

// Middleware to check if user has required permission
const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userPermissions = await getUserPermissions(req.user.id);
      
      if (!userPermissions.has(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required permission: ${requiredPermission}`,
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

// Middleware to check if user has any of the required permissions
const requireAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userPermissions = await getUserPermissions(req.user.id);
      
      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.has(permission)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required permissions: ${requiredPermissions.join(' OR ')}`,
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

// Middleware to check if user has all required permissions
const requireAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const userPermissions = await getUserPermissions(req.user.id);
      
      const hasAllPermissions = requiredPermissions.every(permission => 
        userPermissions.has(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required permissions: ${requiredPermissions.join(' AND ')}`,
        });
      }

      next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

// Middleware to check resource ownership or admin permission
const requireOwnershipOrPermission = (permission, getResourceUserId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Check if user has the required permission (e.g., admin permission)
      const userPermissions = await getUserPermissions(req.user.id);
      if (userPermissions.has(permission)) {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = getResourceUserId(req);
      if (req.user.id === resourceUserId) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources or need admin permission.',
      });
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireOwnershipOrPermission,
  getUserPermissions,
  clearUserPermissionCache,
  clearAllPermissionCache,
};
