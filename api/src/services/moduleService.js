const { db } = require('../db');
const { 
  appModules,
  moduleNavigation,
  roleModulePermissions,
  userModulePreferences,
  moduleDependencies,
  moduleSettings,
  moduleAuditLog,
  moduleAnalytics,
  users,
  roles
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');
const notificationService = require('./notificationService');

class ModuleService {

  // ==================== MODULE MANAGEMENT ====================

  /**
   * Create a new application module
   */
  async createModule(moduleData, userId) {
    try {
      console.log('📦 Creating application module:', moduleData.name);

      const [newModule] = await db.insert(appModules)
        .values({
          ...moduleData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Log the action
      await this.logModuleAction(newModule.id, userId, 'created', 'module', newModule.id, null, moduleData);

      // Send notification
      await this.sendModuleNotification('module_created', newModule, userId);

      return newModule;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  }

  /**
   * Get all modules with optional filtering
   */
  async getAllModules(filters = {}, pagination = {}) {
    try {
      const { enabled, search } = filters;
      const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = pagination;

      let query = db.select({
        id: appModules.id,
        name: appModules.name,
        description: appModules.description,
        enabled: appModules.enabled,
        createdAt: appModules.createdAt,
        updatedAt: appModules.updatedAt
      }).from(appModules);

      // Apply filters
      const conditions = [];

      if (enabled !== undefined) {
        conditions.push(eq(appModules.enabled, enabled));
      }

      if (search) {
        conditions.push(
          or(
            ilike(appModules.name, `%${search}%`),
            ilike(appModules.description, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = appModules[sortBy] || appModules.name;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const modules = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(appModules);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: modules,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting modules:', error);
      throw error;
    }
  }

  /**
   * Get module by ID with navigation and permissions
   */
  async getModuleById(moduleId) {
    try {
      const [module] = await db.select()
        .from(appModules)
        .where(eq(appModules.id, moduleId))
        .limit(1);

      if (!module) {
        throw new Error('Module not found');
      }

      // Get navigation items
      const navigation = await db.select()
        .from(moduleNavigation)
        .where(eq(moduleNavigation.moduleId, moduleId))
        .orderBy(asc(moduleNavigation.navOrder));

      // Get role permissions
      const permissions = await db.select({
        roleId: roleModulePermissions.roleId,
        roleName: roles.name,
        canView: roleModulePermissions.canView,
        canCreate: roleModulePermissions.canCreate,
        canEdit: roleModulePermissions.canEdit,
        canDelete: roleModulePermissions.canDelete,
        canAdmin: roleModulePermissions.canAdmin
      })
      .from(roleModulePermissions)
      .leftJoin(roles, eq(roleModulePermissions.roleId, roles.id))
      .where(eq(roleModulePermissions.moduleId, moduleId));

      // Get dependencies
      const dependencies = await db.select({
        dependsOnModuleId: moduleDependencies.dependsOnModuleId,
        dependsOnModuleName: appModules.name,
        isRequired: moduleDependencies.isRequired
      })
      .from(moduleDependencies)
      .leftJoin(appModules, eq(moduleDependencies.dependsOnModuleId, appModules.id))
      .where(eq(moduleDependencies.moduleId, moduleId));

      // Get settings
      const settings = await db.select()
        .from(moduleSettings)
        .where(eq(moduleSettings.moduleId, moduleId));

      return {
        ...module,
        navigation,
        permissions,
        dependencies,
        settings
      };
    } catch (error) {
      console.error('Error getting module by ID:', error);
      throw error;
    }
  }

  /**
   * Update module
   */
  async updateModule(moduleId, updateData, userId) {
    try {
      console.log('📝 Updating module:', moduleId);

      // Get current module data for audit log
      const [currentModule] = await db.select()
        .from(appModules)
        .where(eq(appModules.id, moduleId))
        .limit(1);

      if (!currentModule) {
        throw new Error('Module not found');
      }

      const [updatedModule] = await db.update(appModules)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(appModules.id, moduleId))
        .returning();

      // Log the action
      await this.logModuleAction(moduleId, userId, 'updated', 'module', moduleId, currentModule, updateData);

      // Send notification
      await this.sendModuleNotification('module_updated', updatedModule, userId);

      return updatedModule;
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  }

  /**
   * Delete module
   */
  async deleteModule(moduleId, userId) {
    try {
      console.log('🗑️ Deleting module:', moduleId);

      // Get module data for audit log
      const [moduleToDelete] = await db.select()
        .from(appModules)
        .where(eq(appModules.id, moduleId))
        .limit(1);

      if (!moduleToDelete) {
        throw new Error('Module not found');
      }

      // Check for dependencies
      const [dependentModules] = await db.select({ count: count() })
        .from(moduleDependencies)
        .where(eq(moduleDependencies.dependsOnModuleId, moduleId));

      if (dependentModules.count > 0) {
        throw new Error('Cannot delete module: other modules depend on it');
      }

      await db.delete(appModules)
        .where(eq(appModules.id, moduleId));

      // Log the action
      await this.logModuleAction(moduleId, userId, 'deleted', 'module', moduleId, moduleToDelete, null);

      // Send notification
      await this.sendModuleNotification('module_deleted', moduleToDelete, userId);

      return { success: true, message: 'Module deleted successfully' };
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  }

  /**
   * Toggle module enabled status
   */
  async toggleModuleStatus(moduleId, userId) {
    try {
      console.log('🔄 Toggling module status:', moduleId);

      const [currentModule] = await db.select()
        .from(appModules)
        .where(eq(appModules.id, moduleId))
        .limit(1);

      if (!currentModule) {
        throw new Error('Module not found');
      }

      const newStatus = !currentModule.enabled;

      // Check dependencies if enabling
      if (newStatus) {
        const dependencies = await db.select({
          dependsOnModuleId: moduleDependencies.dependsOnModuleId,
          dependsOnModuleName: appModules.name,
          dependsOnModuleEnabled: appModules.enabled,
          isRequired: moduleDependencies.isRequired
        })
        .from(moduleDependencies)
        .leftJoin(appModules, eq(moduleDependencies.dependsOnModuleId, appModules.id))
        .where(eq(moduleDependencies.moduleId, moduleId));

        const missingDependencies = dependencies.filter(dep => dep.isRequired && !dep.dependsOnModuleEnabled);
        if (missingDependencies.length > 0) {
          throw new Error(`Cannot enable module: required dependencies are disabled: ${missingDependencies.map(d => d.dependsOnModuleName).join(', ')}`);
        }
      }

      const [updatedModule] = await db.update(appModules)
        .set({
          enabled: newStatus,
          updatedAt: new Date()
        })
        .where(eq(appModules.id, moduleId))
        .returning();

      // Log the action
      await this.logModuleAction(moduleId, userId, newStatus ? 'enabled' : 'disabled', 'module', moduleId, 
        { enabled: currentModule.enabled }, { enabled: newStatus });

      // Send notification
      await this.sendModuleNotification(newStatus ? 'module_enabled' : 'module_disabled', updatedModule, userId);

      return updatedModule;
    } catch (error) {
      console.error('Error toggling module status:', error);
      throw error;
    }
  }

  // ==================== NAVIGATION MANAGEMENT ====================

  /**
   * Create navigation item
   */
  async createNavigation(navigationData, userId) {
    try {
      console.log('🧭 Creating navigation item:', navigationData.navLabel);

      const [newNavigation] = await db.insert(moduleNavigation)
        .values({
          ...navigationData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Log the action
      await this.logModuleAction(navigationData.moduleId, userId, 'created', 'navigation', newNavigation.id, null, navigationData);

      return newNavigation;
    } catch (error) {
      console.error('Error creating navigation:', error);
      throw error;
    }
  }

  /**
   * Get navigation for module
   */
  async getModuleNavigation(moduleId) {
    try {
      const navigation = await db.select()
        .from(moduleNavigation)
        .where(eq(moduleNavigation.moduleId, moduleId))
        .orderBy(asc(moduleNavigation.navOrder));

      // Build hierarchical structure
      const navigationMap = new Map();
      const rootItems = [];

      // First pass: create all items
      navigation.forEach(item => {
        navigationMap.set(item.id, { ...item, children: [] });
      });

      // Second pass: build hierarchy
      navigation.forEach(item => {
        if (item.parentId) {
          const parent = navigationMap.get(item.parentId);
          if (parent) {
            parent.children.push(navigationMap.get(item.id));
          }
        } else {
          rootItems.push(navigationMap.get(item.id));
        }
      });

      return rootItems;
    } catch (error) {
      console.error('Error getting module navigation:', error);
      throw error;
    }
  }

  /**
   * Update navigation item
   */
  async updateNavigation(navigationId, updateData, userId) {
    try {
      console.log('📝 Updating navigation item:', navigationId);

      const [currentNavigation] = await db.select()
        .from(moduleNavigation)
        .where(eq(moduleNavigation.id, navigationId))
        .limit(1);

      if (!currentNavigation) {
        throw new Error('Navigation item not found');
      }

      const [updatedNavigation] = await db.update(moduleNavigation)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(moduleNavigation.id, navigationId))
        .returning();

      // Log the action
      await this.logModuleAction(currentNavigation.moduleId, userId, 'updated', 'navigation', navigationId, currentNavigation, updateData);

      return updatedNavigation;
    } catch (error) {
      console.error('Error updating navigation:', error);
      throw error;
    }
  }

  /**
   * Delete navigation item
   */
  async deleteNavigation(navigationId, userId) {
    try {
      console.log('🗑️ Deleting navigation item:', navigationId);

      const [navigationToDelete] = await db.select()
        .from(moduleNavigation)
        .where(eq(moduleNavigation.id, navigationId))
        .limit(1);

      if (!navigationToDelete) {
        throw new Error('Navigation item not found');
      }

      await db.delete(moduleNavigation)
        .where(eq(moduleNavigation.id, navigationId));

      // Log the action
      await this.logModuleAction(navigationToDelete.moduleId, userId, 'deleted', 'navigation', navigationId, navigationToDelete, null);

      return { success: true, message: 'Navigation item deleted successfully' };
    } catch (error) {
      console.error('Error deleting navigation:', error);
      throw error;
    }
  }

  // ==================== USER NAVIGATION ====================

  /**
   * Get user's accessible navigation based on role permissions
   */
  async getUserNavigation(userId) {
    try {
      // Get user's role
      const [user] = await db.select({ roleId: users.roleId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Get enabled modules with navigation that user has view permission for
      const userNavigation = await db.select({
        moduleId: appModules.id,
        moduleName: appModules.name,
        navId: moduleNavigation.id,
        navLabel: moduleNavigation.navLabel,
        navPath: moduleNavigation.navPath,
        navIcon: moduleNavigation.navIcon,
        navOrder: moduleNavigation.navOrder,
        parentId: moduleNavigation.parentId,
        isVisible: moduleNavigation.isVisible,
        requiresPermission: moduleNavigation.requiresPermission,
        canView: roleModulePermissions.canView,
        canCreate: roleModulePermissions.canCreate,
        canEdit: roleModulePermissions.canEdit,
        canDelete: roleModulePermissions.canDelete,
        canAdmin: roleModulePermissions.canAdmin
      })
      .from(appModules)
      .innerJoin(moduleNavigation, eq(appModules.id, moduleNavigation.moduleId))
      .innerJoin(roleModulePermissions, and(
        eq(roleModulePermissions.moduleId, appModules.id),
        eq(roleModulePermissions.roleId, user.roleId)
      ))
      .where(and(
        eq(appModules.enabled, true),
        eq(moduleNavigation.isVisible, true),
        eq(roleModulePermissions.canView, true)
      ))
      .orderBy(asc(moduleNavigation.navOrder));

      // Get user preferences
      const userPreferences = await db.select()
        .from(userModulePreferences)
        .where(eq(userModulePreferences.userId, userId));

      const preferencesMap = new Map(userPreferences.map(pref => [pref.moduleId, pref]));

      // Filter out hidden modules and apply custom ordering
      const filteredNavigation = userNavigation.filter(item => {
        const pref = preferencesMap.get(item.moduleId);
        return !pref?.isHidden;
      });

      // Build hierarchical structure
      return this.buildNavigationHierarchy(filteredNavigation);
    } catch (error) {
      console.error('Error getting user navigation:', error);
      throw error;
    }
  }

  /**
   * Build hierarchical navigation structure
   */
  buildNavigationHierarchy(navigationItems) {
    const navigationMap = new Map();
    const rootItems = [];

    // First pass: create all items
    navigationItems.forEach(item => {
      navigationMap.set(item.navId, { ...item, children: [] });
    });

    // Second pass: build hierarchy
    navigationItems.forEach(item => {
      if (item.parentId) {
        const parent = navigationMap.get(item.parentId);
        if (parent) {
          parent.children.push(navigationMap.get(item.navId));
        }
      } else {
        rootItems.push(navigationMap.get(item.navId));
      }
    });

    return rootItems;
  }

  // ==================== PERMISSION MANAGEMENT ====================

  /**
   * Set role permissions for module
   */
  async setRoleModulePermissions(roleId, moduleId, permissions, userId) {
    try {
      console.log('🔐 Setting role module permissions:', { roleId, moduleId });

      // Check if permission record exists
      const [existingPermission] = await db.select()
        .from(roleModulePermissions)
        .where(and(
          eq(roleModulePermissions.roleId, roleId),
          eq(roleModulePermissions.moduleId, moduleId)
        ))
        .limit(1);

      let result;
      if (existingPermission) {
        // Update existing permissions
        [result] = await db.update(roleModulePermissions)
          .set({
            ...permissions,
            updatedAt: new Date()
          })
          .where(and(
            eq(roleModulePermissions.roleId, roleId),
            eq(roleModulePermissions.moduleId, moduleId)
          ))
          .returning();

        // Log the action
        await this.logModuleAction(moduleId, userId, 'updated', 'permission', result.id, existingPermission, permissions);
      } else {
        // Create new permissions
        [result] = await db.insert(roleModulePermissions)
          .values({
            roleId,
            moduleId,
            ...permissions,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        // Log the action
        await this.logModuleAction(moduleId, userId, 'created', 'permission', result.id, null, { roleId, moduleId, ...permissions });
      }

      return result;
    } catch (error) {
      console.error('Error setting role module permissions:', error);
      throw error;
    }
  }

  /**
   * Check if user has specific permission for module
   */
  async checkUserModulePermission(userId, moduleId, permission) {
    try {
      const [result] = await db.select({
        [permission]: roleModulePermissions[permission]
      })
      .from(users)
      .innerJoin(roleModulePermissions, and(
        eq(roleModulePermissions.roleId, users.roleId),
        eq(roleModulePermissions.moduleId, moduleId)
      ))
      .where(eq(users.id, userId))
      .limit(1);

      return result?.[permission] || false;
    } catch (error) {
      console.error('Error checking user module permission:', error);
      return false;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Log module action for audit trail
   */
  async logModuleAction(moduleId, userId, action, entityType, entityId, oldValues, newValues) {
    try {
      await db.insert(moduleAuditLog)
        .values({
          moduleId,
          userId,
          action,
          entityType,
          entityId,
          oldValues: oldValues ? JSON.stringify(oldValues) : null,
          newValues: newValues ? JSON.stringify(newValues) : null,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Error logging module action:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  /**
   * Send module-related notifications
   */
  async sendModuleNotification(eventType, data, userId) {
    try {
      const notificationMap = {
        'module_created': {
          title: 'Module Created',
          message: `New module created: ${data.name}`,
          type: 'info'
        },
        'module_updated': {
          title: 'Module Updated',
          message: `Module updated: ${data.name}`,
          type: 'info'
        },
        'module_deleted': {
          title: 'Module Deleted',
          message: `Module deleted: ${data.name}`,
          type: 'warning'
        },
        'module_enabled': {
          title: 'Module Enabled',
          message: `Module enabled: ${data.name}`,
          type: 'success'
        },
        'module_disabled': {
          title: 'Module Disabled',
          message: `Module disabled: ${data.name}`,
          type: 'warning'
        }
      };

      const notification = notificationMap[eventType];
      if (notification && userId) {
        await notificationService.createNotification({
          userId: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'module_management',
          eventType: eventType,
          relatedId: data.id,
          relatedType: 'module',
          metadata: data
        });
      }
    } catch (error) {
      console.error('Error sending module notification:', error);
    }
  }
}

module.exports = new ModuleService();