const { db } = require('../db');
const { 
  metrics, 
  chartTypes, 
  chartConfigurations,
  users 
} = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, or, like, ilike, count, sum, isNull, isNotNull } = require('drizzle-orm');

class MetricsService {

  // ==================== CORE METRICS OPERATIONS ====================

  /**
   * Create new metric
   */
  async createMetric(metricData, userId) {
    try {
      console.log('📊 Creating new metric:', metricData.name);

      // Validate SQL query by testing it (optional - can be dangerous in production)
      if (metricData.query) {
        try {
          // Test query with LIMIT 1 to validate syntax
          await db.execute(sql.raw(`${metricData.query} LIMIT 1`));
        } catch (queryError) {
          throw new Error(`Invalid SQL query: ${queryError.message}`);
        }
      }

      // Create the metric
      const [newMetric] = await db.insert(metrics)
        .values({
          ...metricData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newMetric;
    } catch (error) {
      console.error('Error creating metric:', error);
      throw error;
    }
  }

  /**
   * Get metric by ID
   */
  async getMetricById(metricId) {
    try {
      const [metric] = await db.select({
        id: metrics.id,
        name: metrics.name,
        description: metrics.description,
        type: metrics.type,
        category: metrics.category,
        query: metrics.query,
        value: metrics.value,
        unit: metrics.unit,
        labels: metrics.labels,
        threshold: metrics.threshold,
        source: metrics.source,
        aggregationPeriod: metrics.aggregationPeriod,
        lastCalculated: metrics.lastCalculated,
        isActive: metrics.isActive,
        metadata: metrics.metadata,
        createdBy: metrics.createdBy,
        createdAt: metrics.createdAt,
        updatedAt: metrics.updatedAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName,
        createdByEmail: users.email
      })
      .from(metrics)
      .leftJoin(users, eq(metrics.createdBy, users.id))
      .where(eq(metrics.id, metricId))
      .limit(1);

      if (!metric) {
        throw new Error('Metric not found');
      }

      return metric;
    } catch (error) {
      console.error('Error getting metric by ID:', error);
      throw error;
    }
  }

  /**
   * Update metric
   */
  async updateMetric(metricId, updateData, userId) {
    try {
      console.log('📊 Updating metric:', metricId);

      // Validate SQL query if provided
      if (updateData.query) {
        try {
          await db.execute(sql.raw(`${updateData.query} LIMIT 1`));
        } catch (queryError) {
          throw new Error(`Invalid SQL query: ${queryError.message}`);
        }
      }

      // Update the metric
      const [updatedMetric] = await db.update(metrics)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(metrics.id, metricId))
        .returning();

      if (!updatedMetric) {
        throw new Error('Metric not found');
      }

      return updatedMetric;
    } catch (error) {
      console.error('Error updating metric:', error);
      throw error;
    }
  }

  /**
   * Delete metric
   */
  async deleteMetric(metricId, userId) {
    try {
      console.log('🗑️ Deleting metric:', metricId);

      // Check if metric exists
      const [existingMetric] = await db.select()
        .from(metrics)
        .where(eq(metrics.id, metricId))
        .limit(1);

      if (!existingMetric) {
        throw new Error('Metric not found');
      }

      // Delete the metric
      await db.delete(metrics)
        .where(eq(metrics.id, metricId));

      return { success: true, deletedMetric: existingMetric };
    } catch (error) {
      console.error('Error deleting metric:', error);
      throw error;
    }
  }

  /**
   * Get all metrics with filtering and pagination
   */
  async getAllMetrics(filters = {}, pagination = {}) {
    try {
      const { 
        type, 
        category, 
        isActive,
        createdBy,
        search 
      } = filters;
      
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = pagination;

      let query = db.select({
        id: metrics.id,
        name: metrics.name,
        description: metrics.description,
        type: metrics.type,
        category: metrics.category,
        value: metrics.value,
        unit: metrics.unit,
        source: metrics.source,
        aggregationPeriod: metrics.aggregationPeriod,
        lastCalculated: metrics.lastCalculated,
        isActive: metrics.isActive,
        createdBy: metrics.createdBy,
        createdAt: metrics.createdAt,
        updatedAt: metrics.updatedAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName
      })
      .from(metrics)
      .leftJoin(users, eq(metrics.createdBy, users.id));

      // Apply filters
      const conditions = [];

      if (type) {
        conditions.push(eq(metrics.type, type));
      }

      if (category) {
        conditions.push(eq(metrics.category, category));
      }

      if (isActive !== undefined) {
        conditions.push(eq(metrics.isActive, isActive));
      }

      if (createdBy) {
        conditions.push(eq(metrics.createdBy, createdBy));
      }

      if (search) {
        conditions.push(
          or(
            ilike(metrics.name, `%${search}%`),
            ilike(metrics.description, `%${search}%`),
            ilike(metrics.source, `%${search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = metrics[sortBy] || metrics.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const metricsData = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(metrics);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: metricsData,
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
      console.error('Error getting all metrics:', error);
      throw error;
    }
  }

  // ==================== METRIC CALCULATION ====================

  /**
   * Calculate metric value by executing its SQL query
   */
  async calculateMetric(metricId) {
    try {
      console.log('🔢 Calculating metric:', metricId);

      // Get metric details
      const metric = await this.getMetricById(metricId);

      if (!metric.query) {
        throw new Error('Metric has no query defined');
      }

      // Execute the metric query
      const result = await db.execute(sql.raw(metric.query));
      
      // Extract value from result (assuming first row, first column)
      let calculatedValue = 0;
      if (result.rows && result.rows.length > 0) {
        const firstRow = result.rows[0];
        // Get the first numeric value from the row
        calculatedValue = Object.values(firstRow).find(val => typeof val === 'number') || 0;
      }

      // Update metric with calculated value
      const [updatedMetric] = await db.update(metrics)
        .set({
          value: calculatedValue,
          lastCalculated: new Date(),
          updatedAt: new Date()
        })
        .where(eq(metrics.id, metricId))
        .returning();

      return {
        ...updatedMetric,
        calculatedValue,
        queryResult: result.rows
      };
    } catch (error) {
      console.error('Error calculating metric:', error);
      throw error;
    }
  }

  /**
   * Calculate all active metrics
   */
  async calculateAllMetrics() {
    try {
      console.log('🔢 Calculating all active metrics');

      // Get all active metrics
      const activeMetrics = await db.select()
        .from(metrics)
        .where(and(
          eq(metrics.isActive, true),
          isNotNull(metrics.query)
        ));

      const results = [];

      for (const metric of activeMetrics) {
        try {
          const result = await this.calculateMetric(metric.id);
          results.push({
            metricId: metric.id,
            name: metric.name,
            success: true,
            value: result.calculatedValue
          });
        } catch (error) {
          results.push({
            metricId: metric.id,
            name: metric.name,
            success: false,
            error: error.message
          });
        }
      }

      return {
        totalMetrics: activeMetrics.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };
    } catch (error) {
      console.error('Error calculating all metrics:', error);
      throw error;
    }
  }

  // ==================== METRIC ANALYTICS ====================

  /**
   * Get metrics by category
   */
  async getMetricsByCategory() {
    try {
      const categoryStats = await db.select({
        category: metrics.category,
        count: count(),
        avgValue: sql`AVG(value)`,
        maxValue: sql`MAX(value)`,
        minValue: sql`MIN(value)`
      })
      .from(metrics)
      .where(eq(metrics.isActive, true))
      .groupBy(metrics.category)
      .orderBy(desc(count()));

      return categoryStats;
    } catch (error) {
      console.error('Error getting metrics by category:', error);
      throw error;
    }
  }

  /**
   * Get metrics by type
   */
  async getMetricsByType() {
    try {
      const typeStats = await db.select({
        type: metrics.type,
        count: count(),
        avgValue: sql`AVG(value)`,
        totalValue: sql`SUM(value)`
      })
      .from(metrics)
      .where(eq(metrics.isActive, true))
      .groupBy(metrics.type)
      .orderBy(desc(count()));

      return typeStats;
    } catch (error) {
      console.error('Error getting metrics by type:', error);
      throw error;
    }
  }

  /**
   * Search metrics
   */
  async searchMetrics(searchTerm, filters = {}) {
    try {
      const { type, category, isActive = true } = filters;

      let query = db.select({
        id: metrics.id,
        name: metrics.name,
        description: metrics.description,
        type: metrics.type,
        category: metrics.category,
        value: metrics.value,
        unit: metrics.unit,
        lastCalculated: metrics.lastCalculated,
        createdByName: users.firstName,
        createdByLastName: users.lastName
      })
      .from(metrics)
      .leftJoin(users, eq(metrics.createdBy, users.id));

      const conditions = [eq(metrics.isActive, isActive)];

      // Search in multiple fields
      if (searchTerm) {
        conditions.push(
          or(
            ilike(metrics.name, `%${searchTerm}%`),
            ilike(metrics.description, `%${searchTerm}%`),
            ilike(metrics.source, `%${searchTerm}%`)
          )
        );
      }

      // Apply filters
      if (type) conditions.push(eq(metrics.type, type));
      if (category) conditions.push(eq(metrics.category, category));

      const results = await query
        .where(and(...conditions))
        .orderBy(desc(metrics.lastCalculated))
        .limit(50);

      return results;
    } catch (error) {
      console.error('Error searching metrics:', error);
      throw error;
    }
  }

  // ==================== CHART TYPES MANAGEMENT ====================

  /**
   * Create chart type
   */
  async createChartType(chartTypeData) {
    try {
      console.log('📈 Creating chart type:', chartTypeData.name);

      const [newChartType] = await db.insert(chartTypes)
        .values({
          ...chartTypeData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newChartType;
    } catch (error) {
      console.error('Error creating chart type:', error);
      throw error;
    }
  }

  /**
   * Get all chart types
   */
  async getAllChartTypes(activeOnly = true) {
    try {
      let query = db.select().from(chartTypes);

      if (activeOnly) {
        query = query.where(eq(chartTypes.isActive, true));
      }

      const chartTypesData = await query.orderBy(asc(chartTypes.name));
      return chartTypesData;
    } catch (error) {
      console.error('Error getting chart types:', error);
      throw error;
    }
  }

  /**
   * Update chart type
   */
  async updateChartType(chartTypeId, updateData) {
    try {
      const [updatedChartType] = await db.update(chartTypes)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(chartTypes.id, chartTypeId))
        .returning();

      if (!updatedChartType) {
        throw new Error('Chart type not found');
      }

      return updatedChartType;
    } catch (error) {
      console.error('Error updating chart type:', error);
      throw error;
    }
  }

  // ==================== CHART CONFIGURATIONS MANAGEMENT ====================

  /**
   * Create chart configuration
   */
  async createChartConfiguration(configData, userId) {
    try {
      console.log('🎨 Creating chart configuration:', configData.name);

      // If this is set as default, unset other defaults
      if (configData.isDefault) {
        await db.update(chartConfigurations)
          .set({ isDefault: false })
          .where(eq(chartConfigurations.isDefault, true));
      }

      const [newConfig] = await db.insert(chartConfigurations)
        .values({
          ...configData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newConfig;
    } catch (error) {
      console.error('Error creating chart configuration:', error);
      throw error;
    }
  }

  /**
   * Get all chart configurations
   */
  async getAllChartConfigurations(activeOnly = true) {
    try {
      let query = db.select({
        id: chartConfigurations.id,
        name: chartConfigurations.name,
        description: chartConfigurations.description,
        colorPalette: chartConfigurations.colorPalette,
        defaultWidth: chartConfigurations.defaultWidth,
        defaultHeight: chartConfigurations.defaultHeight,
        fontFamily: chartConfigurations.fontFamily,
        fontSize: chartConfigurations.fontSize,
        theme: chartConfigurations.theme,
        isDefault: chartConfigurations.isDefault,
        isActive: chartConfigurations.isActive,
        createdBy: chartConfigurations.createdBy,
        createdAt: chartConfigurations.createdAt,
        createdByName: users.firstName,
        createdByLastName: users.lastName
      })
      .from(chartConfigurations)
      .leftJoin(users, eq(chartConfigurations.createdBy, users.id));

      if (activeOnly) {
        query = query.where(eq(chartConfigurations.isActive, true));
      }

      const configs = await query.orderBy(desc(chartConfigurations.isDefault), asc(chartConfigurations.name));
      return configs;
    } catch (error) {
      console.error('Error getting chart configurations:', error);
      throw error;
    }
  }

  /**
   * Get default chart configuration
   */
  async getDefaultChartConfiguration() {
    try {
      const [defaultConfig] = await db.select()
        .from(chartConfigurations)
        .where(and(
          eq(chartConfigurations.isDefault, true),
          eq(chartConfigurations.isActive, true)
        ))
        .limit(1);

      return defaultConfig;
    } catch (error) {
      console.error('Error getting default chart configuration:', error);
      throw error;
    }
  }

  /**
   * Update chart configuration
   */
  async updateChartConfiguration(configId, updateData, userId) {
    try {
      // If this is set as default, unset other defaults
      if (updateData.isDefault) {
        await db.update(chartConfigurations)
          .set({ isDefault: false })
          .where(eq(chartConfigurations.isDefault, true));
      }

      const [updatedConfig] = await db.update(chartConfigurations)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(chartConfigurations.id, configId))
        .returning();

      if (!updatedConfig) {
        throw new Error('Chart configuration not found');
      }

      return updatedConfig;
    } catch (error) {
      console.error('Error updating chart configuration:', error);
      throw error;
    }
  }

  // ==================== DASHBOARD CREATOR METHODS ====================

  /**
   * Get metrics for dashboard creator with metadata
   */
  async getMetricsForDashboardCreator(filters = {}) {
    try {
      console.log('🎨 Getting metrics for dashboard creator');

      let query = db.select({
        id: metrics.id,
        name: metrics.name,
        description: metrics.description,
        type: metrics.type,
        category: metrics.category,
        value: metrics.value,
        unit: metrics.unit,
        labels: metrics.labels,
        threshold: metrics.threshold,
        metadata: metrics.metadata,
        lastCalculated: metrics.lastCalculated,
        createdAt: metrics.createdAt
      })
      .from(metrics)
      .where(eq(metrics.isActive, true));

      // Apply category filter
      if (filters.category) {
        query = query.where(and(
          eq(metrics.isActive, true),
          eq(metrics.category, filters.category)
        ));
      }

      // Apply search filter
      if (filters.search) {
        query = query.where(and(
          eq(metrics.isActive, true),
          or(
            ilike(metrics.name, `%${filters.search}%`),
            ilike(metrics.description, `%${filters.search}%`)
          )
        ));
      }

      const metricsData = await query.orderBy(asc(metrics.category), asc(metrics.name));

      // Group by category for easier consumption
      const groupedMetrics = metricsData.reduce((acc, metric) => {
        const category = metric.category || 'uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(metric);
        return acc;
      }, {});

      return {
        metrics: metricsData,
        grouped: groupedMetrics,
        total: metricsData.length
      };
    } catch (error) {
      console.error('Error getting metrics for dashboard creator:', error);
      throw error;
    }
  }
}

module.exports = new MetricsService();
