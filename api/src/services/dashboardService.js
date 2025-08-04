const { db } = require('../db');
const { 
  dashboards, 
  dashboardMetrics, 
  dashboardShares, 
  userDashboards,
  metrics,
  chartTypes,
  chartConfigurations,
  users 
} = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, or, like, ilike, count, sum, isNull, isNotNull } = require('drizzle-orm');

class DashboardService {

  // ==================== GLOBAL DASHBOARDS MANAGEMENT ====================

  /**
   * Create global dashboard (admin only)
   */
  async createGlobalDashboard(dashboardData, userId) {
    try {
      console.log('📊 Creating global dashboard:', dashboardData.name);

      // If this is set as default, unset other defaults
      if (dashboardData.isDefault) {
        await db.update(dashboards)
          .set({ isDefault: false })
          .where(and(
            eq(dashboards.isDefault, true),
            eq(dashboards.isGlobal, true)
          ));
      }

      const [newDashboard] = await db.insert(dashboards)
        .values({
          ...dashboardData,
          isGlobal: true,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newDashboard;
    } catch (error) {
      console.error('Error creating global dashboard:', error);
      throw error;
    }
  }

  /**
   * Get all global dashboards
   */
  async getGlobalDashboards(includeMetrics = false) {
    try {
      let query = db.select({
        id: dashboards.id,
        name: dashboards.name,
        description: dashboards.description,
        layout: dashboards.layout,
        isDefault: dashboards.isDefault,
        isGlobal: dashboards.isGlobal,
        createdBy: dashboards.createdBy,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName,
        createdByEmail: users.email
      })
      .from(dashboards)
      .leftJoin(users, eq(dashboards.createdBy, users.id))
      .where(eq(dashboards.isGlobal, true))
      .orderBy(desc(dashboards.isDefault), asc(dashboards.name));

      const globalDashboards = await query;

      if (includeMetrics) {
        // Get metrics for each dashboard
        for (const dashboard of globalDashboards) {
          dashboard.metrics = await this.getDashboardMetrics(dashboard.id);
        }
      }

      return globalDashboards;
    } catch (error) {
      console.error('Error getting global dashboards:', error);
      throw error;
    }
  }

  /**
   * Update global dashboard
   */
  async updateGlobalDashboard(dashboardId, updateData, userId) {
    try {
      console.log('📊 Updating global dashboard:', dashboardId);

      // If this is set as default, unset other defaults
      if (updateData.isDefault) {
        await db.update(dashboards)
          .set({ isDefault: false })
          .where(and(
            eq(dashboards.isDefault, true),
            eq(dashboards.isGlobal, true)
          ));
      }

      const [updatedDashboard] = await db.update(dashboards)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(and(
          eq(dashboards.id, dashboardId),
          eq(dashboards.isGlobal, true)
        ))
        .returning();

      if (!updatedDashboard) {
        throw new Error('Global dashboard not found');
      }

      return updatedDashboard;
    } catch (error) {
      console.error('Error updating global dashboard:', error);
      throw error;
    }
  }

  /**
   * Delete global dashboard
   */
  async deleteGlobalDashboard(dashboardId, userId) {
    try {
      console.log('🗑️ Deleting global dashboard:', dashboardId);

      // Check if dashboard exists and is global
      const [existingDashboard] = await db.select()
        .from(dashboards)
        .where(and(
          eq(dashboards.id, dashboardId),
          eq(dashboards.isGlobal, true)
        ))
        .limit(1);

      if (!existingDashboard) {
        throw new Error('Global dashboard not found');
      }

      // Delete the dashboard (cascade will handle related records)
      await db.delete(dashboards)
        .where(eq(dashboards.id, dashboardId));

      return { success: true, deletedDashboard: existingDashboard };
    } catch (error) {
      console.error('Error deleting global dashboard:', error);
      throw error;
    }
  }

  // ==================== USER DASHBOARDS MANAGEMENT ====================

  /**
   * Create user dashboard
   */
  async createUserDashboard(dashboardData, userId) {
    try {
      console.log('👤 Creating user dashboard:', dashboardData.name);

      // If this is set as default, unset other user defaults
      if (dashboardData.isDefault) {
        await db.update(userDashboards)
          .set({ isDefault: false })
          .where(and(
            eq(userDashboards.userId, userId),
            eq(userDashboards.isDefault, true)
          ));
      }

      const [newDashboard] = await db.insert(userDashboards)
        .values({
          ...dashboardData,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newDashboard;
    } catch (error) {
      console.error('Error creating user dashboard:', error);
      throw error;
    }
  }

  /**
   * Get user dashboards
   */
  async getUserDashboards(userId) {
    try {
      const userDashboardsData = await db.select()
        .from(userDashboards)
        .where(eq(userDashboards.userId, userId))
        .orderBy(desc(userDashboards.isDefault), asc(userDashboards.name));

      return userDashboardsData;
    } catch (error) {
      console.error('Error getting user dashboards:', error);
      throw error;
    }
  }

  /**
   * Update user dashboard
   */
  async updateUserDashboard(dashboardId, updateData, userId) {
    try {
      console.log('👤 Updating user dashboard:', dashboardId);

      // If this is set as default, unset other user defaults
      if (updateData.isDefault) {
        await db.update(userDashboards)
          .set({ isDefault: false })
          .where(and(
            eq(userDashboards.userId, userId),
            eq(userDashboards.isDefault, true)
          ));
      }

      const [updatedDashboard] = await db.update(userDashboards)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(and(
          eq(userDashboards.id, dashboardId),
          eq(userDashboards.userId, userId)
        ))
        .returning();

      if (!updatedDashboard) {
        throw new Error('User dashboard not found');
      }

      return updatedDashboard;
    } catch (error) {
      console.error('Error updating user dashboard:', error);
      throw error;
    }
  }

  /**
   * Delete user dashboard
   */
  async deleteUserDashboard(dashboardId, userId) {
    try {
      console.log('🗑️ Deleting user dashboard:', dashboardId);

      // Check if dashboard exists and belongs to user
      const [existingDashboard] = await db.select()
        .from(userDashboards)
        .where(and(
          eq(userDashboards.id, dashboardId),
          eq(userDashboards.userId, userId)
        ))
        .limit(1);

      if (!existingDashboard) {
        throw new Error('User dashboard not found');
      }

      // Delete the dashboard
      await db.delete(userDashboards)
        .where(eq(userDashboards.id, dashboardId));

      return { success: true, deletedDashboard: existingDashboard };
    } catch (error) {
      console.error('Error deleting user dashboard:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD METRICS MANAGEMENT ====================

  /**
   * Add metric to dashboard
   */
  async addMetricToDashboard(dashboardId, metricData, userId) {
    try {
      console.log('📈 Adding metric to dashboard:', dashboardId, metricData.metricId);

      // Verify dashboard exists and user has access
      const dashboard = await this.getDashboardById(dashboardId, userId);
      if (!dashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      // Check if metric already exists on dashboard
      const [existingMetric] = await db.select()
        .from(dashboardMetrics)
        .where(and(
          eq(dashboardMetrics.dashboardId, dashboardId),
          eq(dashboardMetrics.metricId, metricData.metricId)
        ))
        .limit(1);

      if (existingMetric) {
        throw new Error('Metric already exists on this dashboard');
      }

      // Get next position
      const [maxPosition] = await db.select({
        maxPos: sql`COALESCE(MAX(position), 0)`
      })
      .from(dashboardMetrics)
      .where(eq(dashboardMetrics.dashboardId, dashboardId));

      const [newDashboardMetric] = await db.insert(dashboardMetrics)
        .values({
          dashboardId,
          metricId: metricData.metricId,
          chartTypeId: metricData.chartTypeId,
          chartConfigId: metricData.chartConfigId,
          position: metricData.position || (maxPosition.maxPos + 1),
          width: metricData.width || 400,
          height: metricData.height || 300,
          config: metricData.config || {},
          refreshInterval: metricData.refreshInterval || 300,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newDashboardMetric;
    } catch (error) {
      console.error('Error adding metric to dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard metrics with full details
   */
  async getDashboardMetrics(dashboardId) {
    try {
      const dashboardMetricsData = await db.select({
        id: dashboardMetrics.id,
        dashboardId: dashboardMetrics.dashboardId,
        metricId: dashboardMetrics.metricId,
        chartTypeId: dashboardMetrics.chartTypeId,
        chartConfigId: dashboardMetrics.chartConfigId,
        position: dashboardMetrics.position,
        width: dashboardMetrics.width,
        height: dashboardMetrics.height,
        config: dashboardMetrics.config,
        isVisible: dashboardMetrics.isVisible,
        refreshInterval: dashboardMetrics.refreshInterval,
        createdAt: dashboardMetrics.createdAt,
        // Metric details
        metricName: metrics.name,
        metricDescription: metrics.description,
        metricType: metrics.type,
        metricCategory: metrics.category,
        metricValue: metrics.value,
        metricUnit: metrics.unit,
        metricLastCalculated: metrics.lastCalculated,
        // Chart type details
        chartTypeName: chartTypes.name,
        chartTypeType: chartTypes.type,
        chartTypeDefaultConfig: chartTypes.defaultConfig,
        // Chart config details
        chartConfigName: chartConfigurations.name,
        chartConfigColorPalette: chartConfigurations.colorPalette,
        chartConfigTheme: chartConfigurations.theme
      })
      .from(dashboardMetrics)
      .leftJoin(metrics, eq(dashboardMetrics.metricId, metrics.id))
      .leftJoin(chartTypes, eq(dashboardMetrics.chartTypeId, chartTypes.id))
      .leftJoin(chartConfigurations, eq(dashboardMetrics.chartConfigId, chartConfigurations.id))
      .where(eq(dashboardMetrics.dashboardId, dashboardId))
      .orderBy(asc(dashboardMetrics.position));

      return dashboardMetricsData;
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Update dashboard metric
   */
  async updateDashboardMetric(dashboardMetricId, updateData, userId) {
    try {
      console.log('📈 Updating dashboard metric:', dashboardMetricId);

      const [updatedDashboardMetric] = await db.update(dashboardMetrics)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(dashboardMetrics.id, dashboardMetricId))
        .returning();

      if (!updatedDashboardMetric) {
        throw new Error('Dashboard metric not found');
      }

      return updatedDashboardMetric;
    } catch (error) {
      console.error('Error updating dashboard metric:', error);
      throw error;
    }
  }

  /**
   * Remove metric from dashboard
   */
  async removeMetricFromDashboard(dashboardMetricId, userId) {
    try {
      console.log('🗑️ Removing metric from dashboard:', dashboardMetricId);

      // Get dashboard metric details
      const [dashboardMetric] = await db.select()
        .from(dashboardMetrics)
        .where(eq(dashboardMetrics.id, dashboardMetricId))
        .limit(1);

      if (!dashboardMetric) {
        throw new Error('Dashboard metric not found');
      }

      // Delete the dashboard metric
      await db.delete(dashboardMetrics)
        .where(eq(dashboardMetrics.id, dashboardMetricId));

      return { success: true, deletedDashboardMetric: dashboardMetric };
    } catch (error) {
      console.error('Error removing metric from dashboard:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD SHARING ====================

  /**
   * Share dashboard with user
   */
  async shareDashboard(dashboardId, targetUserId, permission, userId) {
    try {
      console.log('🤝 Sharing dashboard:', dashboardId, 'with user:', targetUserId);

      // Verify dashboard exists and user has admin access
      const dashboard = await this.getDashboardById(dashboardId, userId);
      if (!dashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      // Check if share already exists
      const [existingShare] = await db.select()
        .from(dashboardShares)
        .where(and(
          eq(dashboardShares.dashboardId, dashboardId),
          eq(dashboardShares.userId, targetUserId)
        ))
        .limit(1);

      if (existingShare) {
        // Update existing share
        const [updatedShare] = await db.update(dashboardShares)
          .set({
            permission,
            updatedAt: new Date()
          })
          .where(eq(dashboardShares.id, existingShare.id))
          .returning();

        return updatedShare;
      } else {
        // Create new share
        const [newShare] = await db.insert(dashboardShares)
          .values({
            dashboardId,
            userId: targetUserId,
            permission,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning();

        return newShare;
      }
    } catch (error) {
      console.error('Error sharing dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard shares
   */
  async getDashboardShares(dashboardId) {
    try {
      const shares = await db.select({
        id: dashboardShares.id,
        dashboardId: dashboardShares.dashboardId,
        userId: dashboardShares.userId,
        permission: dashboardShares.permission,
        createdAt: dashboardShares.createdAt,
        updatedAt: dashboardShares.updatedAt,
        userName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email
      })
      .from(dashboardShares)
      .leftJoin(users, eq(dashboardShares.userId, users.id))
      .where(eq(dashboardShares.dashboardId, dashboardId))
      .orderBy(asc(users.firstName));

      return shares;
    } catch (error) {
      console.error('Error getting dashboard shares:', error);
      throw error;
    }
  }

  /**
   * Remove dashboard share
   */
  async removeDashboardShare(shareId, userId) {
    try {
      console.log('🚫 Removing dashboard share:', shareId);

      // Get share details
      const [share] = await db.select()
        .from(dashboardShares)
        .where(eq(dashboardShares.id, shareId))
        .limit(1);

      if (!share) {
        throw new Error('Dashboard share not found');
      }

      // Delete the share
      await db.delete(dashboardShares)
        .where(eq(dashboardShares.id, shareId));

      return { success: true, deletedShare: share };
    } catch (error) {
      console.error('Error removing dashboard share:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD ACCESS CONTROL ====================

  /**
   * Get dashboard by ID with access control
   */
  async getDashboardById(dashboardId, userId, includeMetrics = false) {
    try {
      // First try to get as global dashboard
      let [dashboard] = await db.select({
        id: dashboards.id,
        name: dashboards.name,
        description: dashboards.description,
        layout: dashboards.layout,
        isDefault: dashboards.isDefault,
        isGlobal: dashboards.isGlobal,
        createdBy: dashboards.createdBy,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName,
        type: sql`'global'`
      })
      .from(dashboards)
      .leftJoin(users, eq(dashboards.createdBy, users.id))
      .where(and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.isGlobal, true)
      ))
      .limit(1);

      // If not found as global, try as user dashboard
      if (!dashboard) {
        [dashboard] = await db.select({
          id: userDashboards.id,
          name: userDashboards.name,
          description: sql`NULL`,
          layout: userDashboards.layout,
          isDefault: userDashboards.isDefault,
          isGlobal: sql`false`,
          createdBy: userDashboards.userId,
          createdAt: userDashboards.createdAt,
          updatedAt: userDashboards.updatedAt,
          createdByName: users.firstName,
          createdByLastName: users.lastName,
          type: sql`'user'`
        })
        .from(userDashboards)
        .leftJoin(users, eq(userDashboards.userId, users.id))
        .where(and(
          eq(userDashboards.id, dashboardId),
          eq(userDashboards.userId, userId)
        ))
        .limit(1);
      }

      // If still not found, check if user has shared access
      if (!dashboard) {
        [dashboard] = await db.select({
          id: dashboards.id,
          name: dashboards.name,
          description: dashboards.description,
          layout: dashboards.layout,
          isDefault: dashboards.isDefault,
          isGlobal: dashboards.isGlobal,
          createdBy: dashboards.createdBy,
          createdAt: dashboards.createdAt,
          updatedAt: dashboards.updatedAt,
          createdByName: users.firstName,
          createdByLastName: users.lastName,
          type: sql`'shared'`,
          permission: dashboardShares.permission
        })
        .from(dashboards)
        .leftJoin(users, eq(dashboards.createdBy, users.id))
        .leftJoin(dashboardShares, eq(dashboardShares.dashboardId, dashboards.id))
        .where(and(
          eq(dashboards.id, dashboardId),
          eq(dashboardShares.userId, userId)
        ))
        .limit(1);
      }

      if (!dashboard) {
        return null;
      }

      if (includeMetrics) {
        dashboard.metrics = await this.getDashboardMetrics(dashboardId);
      }

      return dashboard;
    } catch (error) {
      console.error('Error getting dashboard by ID:', error);
      throw error;
    }
  }

  /**
   * Get all accessible dashboards for user
   */
  async getAccessibleDashboards(userId, includeMetrics = false) {
    try {
      const allDashboards = [];

      // Get global dashboards
      const globalDashboards = await this.getGlobalDashboards(includeMetrics);
      allDashboards.push(...globalDashboards.map(d => ({ ...d, type: 'global' })));

      // Get user dashboards
      const userDashboardsData = await this.getUserDashboards(userId);
      allDashboards.push(...userDashboardsData.map(d => ({ ...d, type: 'user', isGlobal: false })));

      // Get shared dashboards
      const sharedDashboards = await db.select({
        id: dashboards.id,
        name: dashboards.name,
        description: dashboards.description,
        layout: dashboards.layout,
        isDefault: dashboards.isDefault,
        isGlobal: dashboards.isGlobal,
        createdBy: dashboards.createdBy,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName,
        permission: dashboardShares.permission,
        type: sql`'shared'`
      })
      .from(dashboards)
      .leftJoin(users, eq(dashboards.createdBy, users.id))
      .leftJoin(dashboardShares, eq(dashboardShares.dashboardId, dashboards.id))
      .where(eq(dashboardShares.userId, userId));

      if (includeMetrics) {
        for (const dashboard of sharedDashboards) {
          dashboard.metrics = await this.getDashboardMetrics(dashboard.id);
        }
      }

      allDashboards.push(...sharedDashboards);

      return allDashboards;
    } catch (error) {
      console.error('Error getting accessible dashboards:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD CREATOR METHODS ====================

  /**
   * Create dashboard with widgets (Dashboard Creator)
   */
  async createDashboardWithWidgets(dashboardData, userId) {
    try {
      console.log('🎨 Creating dashboard with widgets:', dashboardData.name);

      const [newDashboard] = await db.insert(dashboards)
        .values({
          name: dashboardData.name,
          description: dashboardData.description || null,
          layout: dashboardData.layout || {},
          widgets: dashboardData.widgets || [],
          isDefault: false,
          isGlobal: false,
          isPublished: dashboardData.isPublished || false,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newDashboard;
    } catch (error) {
      console.error('Error creating dashboard with widgets:', error);
      throw error;
    }
  }

  /**
   * Update dashboard widgets
   */
  async updateDashboardWidgets(dashboardId, widgets, userId) {
    try {
      console.log('🎨 Updating dashboard widgets:', dashboardId);

      const [updatedDashboard] = await db.update(dashboards)
        .set({
          widgets: widgets,
          updatedAt: new Date()
        })
        .where(and(
          eq(dashboards.id, dashboardId),
          eq(dashboards.createdBy, userId)
        ))
        .returning();

      if (!updatedDashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      return updatedDashboard;
    } catch (error) {
      console.error('Error updating dashboard widgets:', error);
      throw error;
    }
  }

  /**
   * Publish/unpublish dashboard
   */
  async publishDashboard(dashboardId, isPublished, userId) {
    try {
      console.log('📢 Publishing dashboard:', dashboardId, isPublished);

      const [updatedDashboard] = await db.update(dashboards)
        .set({
          isPublished: isPublished,
          updatedAt: new Date()
        })
        .where(and(
          eq(dashboards.id, dashboardId),
          eq(dashboards.createdBy, userId)
        ))
        .returning();

      if (!updatedDashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      return updatedDashboard;
    } catch (error) {
      console.error('Error publishing dashboard:', error);
      throw error;
    }
  }

  /**
   * Get user's created dashboards (for My Dashboards page)
   */
  async getUserCreatedDashboards(userId) {
    try {
      const userCreatedDashboards = await db.select({
        id: dashboards.id,
        name: dashboards.name,
        description: dashboards.description,
        layout: dashboards.layout,
        widgets: dashboards.widgets,
        isDefault: dashboards.isDefault,
        isGlobal: dashboards.isGlobal,
        isPublished: dashboards.isPublished,
        createdBy: dashboards.createdBy,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt
      })
      .from(dashboards)
      .where(and(
        eq(dashboards.createdBy, userId),
        eq(dashboards.isGlobal, false)
      ))
      .orderBy(desc(dashboards.updatedAt));

      return userCreatedDashboards;
    } catch (error) {
      console.error('Error getting user created dashboards:', error);
      throw error;
    }
  }

  /**
   * Delete dashboard (Dashboard Creator)
   */
  async deleteDashboard(dashboardId, userId) {
    try {
      console.log('🗑️ Deleting dashboard:', dashboardId);

      const [deletedDashboard] = await db.delete(dashboards)
        .where(and(
          eq(dashboards.id, dashboardId),
          eq(dashboards.createdBy, userId),
          eq(dashboards.isGlobal, false)
        ))
        .returning();

      if (!deletedDashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      return deletedDashboard;
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  }

  /**
   * Get dashboard with widgets for editing
   */
  async getDashboardForEditing(dashboardId, userId) {
    try {
      const [dashboard] = await db.select({
        id: dashboards.id,
        name: dashboards.name,
        description: dashboards.description,
        layout: dashboards.layout,
        widgets: dashboards.widgets,
        isDefault: dashboards.isDefault,
        isGlobal: dashboards.isGlobal,
        isPublished: dashboards.isPublished,
        createdBy: dashboards.createdBy,
        createdAt: dashboards.createdAt,
        updatedAt: dashboards.updatedAt
      })
      .from(dashboards)
      .where(and(
        eq(dashboards.id, dashboardId),
        eq(dashboards.createdBy, userId)
      ))
      .limit(1);

      if (!dashboard) {
        throw new Error('Dashboard not found or access denied');
      }

      return dashboard;
    } catch (error) {
      console.error('Error getting dashboard for editing:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();
