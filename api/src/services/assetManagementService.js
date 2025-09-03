const { db } = require('../db');
const {
  assetCostManagement,
  assetLifecycle,
  assetOperationalCosts,
  assetRiskMapping,
  assets,
  assetNetwork
} = require('../db/schema');
const {
  assetDetailView,
  assetNetworkDetailView,
  assetVulnerabilitiesSummaryView,
  assetCostSummaryView,
  assetTagsView,
  assetCompleteDetailView
} = require('../db/schema/assetDetailViews');
const { eq, and, gte, lte, like, desc, asc, sql, or } = require('drizzle-orm');

class AssetManagementService {
  
  // ==================== ASSET COST MANAGEMENT ====================
  
  async createCostRecord(data, userId) {
    const costRecord = {
      ...data,
      createdBy: userId,
      lastModifiedBy: userId
    };
    
    const [result] = await db.insert(assetCostManagement)
      .values(costRecord)
      .returning();
    
    return result;
  }

  async getCostRecords(filters = {}, pagination = {}) {
    console.log('🔍 Service getCostRecords called with:', { filters, pagination });
    console.log('📊 Schema objects:', {
      assetCostManagement: !!assetCostManagement,
      assets: !!assets,
      assetCostManagementKeys: assetCostManagement ? Object.keys(assetCostManagement) : 'undefined'
    });

    // Test if table exists by running a simple count query
    try {
      console.log('🧪 Testing table existence...');
      const testResult = await db.select({ count: sql`count(*)` }).from(assetCostManagement);
      console.log('✅ Table exists, count:', testResult);
    } catch (testError) {
      console.error('❌ Table test failed:', testError.message);
      // Return empty result if table doesn't exist
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0
        }
      };
    }

    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = db.select()
    .from(assetCostManagement);

    // Apply filters
    const conditions = this._buildCostFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = assetCostManagement[sortBy] || assetCostManagement.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(assetCostManagement)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  async getCostRecordById(id) {
    const [result] = await db.select()
      .from(assetCostManagement)
      .where(eq(assetCostManagement.id, id))
      .limit(1);
    
    return result;
  }

  async updateCostRecord(id, data, userId) {
    const updateData = {
      ...data,
      lastModifiedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(assetCostManagement)
      .set(updateData)
      .where(eq(assetCostManagement.id, id))
      .returning();
    
    return result;
  }

  async deleteCostRecord(id) {
    const [result] = await db.delete(assetCostManagement)
      .where(eq(assetCostManagement.id, id))
      .returning();
    
    return result;
  }

  // ==================== ASSET LIFECYCLE ====================
  
  async createLifecycleRecord(data) {
    const [result] = await db.insert(assetLifecycle)
      .values(data)
      .returning();
    
    return result;
  }

  async getLifecycleRecords(filters = {}, pagination = {}) {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;
    
    let query = db.select({
      id: assetLifecycle.id,
      purchaseDate: assetLifecycle.purchaseDate,
      warrantyEndDate: assetLifecycle.warrantyEndDate,
      manufacturerEolDate: assetLifecycle.manufacturerEolDate,
      internalEolDate: assetLifecycle.internalEolDate,
      replacementCycleMonths: assetLifecycle.replacementCycleMonths,
      estimatedReplacementCost: assetLifecycle.estimatedReplacementCost,
      replacementBudgetYear: assetLifecycle.replacementBudgetYear,
      replacementBudgetQuarter: assetLifecycle.replacementBudgetQuarter,
      replacementNotes: assetLifecycle.replacementNotes,
      assetUuid: assetLifecycle.assetUuid,
      createdAt: assetLifecycle.createdAt,
      // Join asset info
      assetHostname: assets.hostname,
      assetIpv4: assetNetwork.ipv4Address,
      // Calculate days until events (handle null dates)
      daysUntilWarrantyExpiry: sql`CASE WHEN ${assetLifecycle.warrantyEndDate} IS NOT NULL THEN (${assetLifecycle.warrantyEndDate}::date - CURRENT_DATE) ELSE NULL END`,
      daysUntilEol: sql`CASE WHEN ${assetLifecycle.internalEolDate} IS NOT NULL THEN (${assetLifecycle.internalEolDate}::date - CURRENT_DATE) ELSE NULL END`
    })
    .from(assetLifecycle)
    .leftJoin(assets, eq(assetLifecycle.assetUuid, assets.assetUuid))
    .leftJoin(assetNetwork, eq(assetLifecycle.assetUuid, assetNetwork.assetUuid));

    // Apply filters
    const conditions = this._buildLifecycleFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = assetLifecycle[sortBy] || assetLifecycle.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(assetLifecycle)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  async getLifecycleRecordById(id) {
    const [result] = await db.select()
      .from(assetLifecycle)
      .where(eq(assetLifecycle.id, id))
      .limit(1);
    
    return result;
  }

  async updateLifecycleRecord(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const [result] = await db.update(assetLifecycle)
      .set(updateData)
      .where(eq(assetLifecycle.id, id))
      .returning();
    
    return result;
  }

  async deleteLifecycleRecord(id) {
    const [result] = await db.delete(assetLifecycle)
      .where(eq(assetLifecycle.id, id))
      .returning();
    
    return result;
  }

  // ==================== OPERATIONAL COSTS ====================

  async createOperationalCost(data) {
    const [result] = await db.insert(assetOperationalCosts)
      .values(data)
      .returning();

    return result;
  }

  async getOperationalCosts(filters = {}, pagination = {}) {
    const { page = 1, limit = 50, sortBy = 'yearMonth', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = db.select({
      id: assetOperationalCosts.id,
      yearMonth: assetOperationalCosts.yearMonth,
      powerCost: assetOperationalCosts.powerCost,
      spaceCost: assetOperationalCosts.spaceCost,
      networkCost: assetOperationalCosts.networkCost,
      storageCost: assetOperationalCosts.storageCost,
      laborCost: assetOperationalCosts.laborCost,
      otherCosts: assetOperationalCosts.otherCosts,
      notes: assetOperationalCosts.notes,
      assetUuid: assetOperationalCosts.assetUuid,
      createdAt: assetOperationalCosts.createdAt,
      // Calculate total cost
      totalCost: sql`COALESCE(${assetOperationalCosts.powerCost}, 0) +
                     COALESCE(${assetOperationalCosts.spaceCost}, 0) +
                     COALESCE(${assetOperationalCosts.networkCost}, 0) +
                     COALESCE(${assetOperationalCosts.storageCost}, 0) +
                     COALESCE(${assetOperationalCosts.laborCost}, 0) +
                     COALESCE(${assetOperationalCosts.otherCosts}, 0)`,
      // Join asset info
      assetHostname: assets.hostname
      // Removed assetIpv4: assets.ipv4 - field doesn't exist in assets table
    })
    .from(assetOperationalCosts)
    .leftJoin(assets, eq(assetOperationalCosts.assetUuid, assets.assetUuid));

    // Apply filters
    const conditions = this._buildOperationalCostFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = assetOperationalCosts[sortBy] || assetOperationalCosts.yearMonth;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(assetOperationalCosts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  async getOperationalCostById(id) {
    const [result] = await db.select()
      .from(assetOperationalCosts)
      .where(eq(assetOperationalCosts.id, id))
      .limit(1);

    return result;
  }

  async updateOperationalCost(id, data) {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    const [result] = await db.update(assetOperationalCosts)
      .set(updateData)
      .where(eq(assetOperationalCosts.id, id))
      .returning();

    return result;
  }

  async deleteOperationalCost(id) {
    const [result] = await db.delete(assetOperationalCosts)
      .where(eq(assetOperationalCosts.id, id))
      .returning();

    return result;
  }

  // ==================== RISK MAPPING ====================

  async createRiskMapping(data, userId) {
    const mappingData = {
      ...data,
      verifiedBy: userId,
      verifiedAt: new Date()
    };

    const [result] = await db.insert(assetRiskMapping)
      .values(mappingData)
      .returning();

    return result;
  }

  async getRiskMappings(filters = {}, pagination = {}) {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    let query = db.select()
      .from(assetRiskMapping)
      .leftJoin(assets, eq(assetRiskMapping.assetUuid, assets.assetUuid));

    // Apply filters
    const conditions = this._buildRiskMappingFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = assetRiskMapping[sortBy] || assetRiskMapping.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(assetRiskMapping)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  async getRiskMappingById(id) {
    const [result] = await db.select()
      .from(assetRiskMapping)
      .leftJoin(assets, eq(assetRiskMapping.assetUuid, assets.assetUuid))
      .where(eq(assetRiskMapping.id, id));

    return result;
  }

  async updateRiskMapping(id, data, userId) {
    const updateData = {
      ...data,
      verifiedBy: userId,
      verifiedAt: new Date(),
      updatedAt: new Date()
    };

    const [result] = await db.update(assetRiskMapping)
      .set(updateData)
      .where(eq(assetRiskMapping.id, id))
      .returning();

    return result;
  }

  async deleteRiskMapping(id) {
    const [result] = await db.delete(assetRiskMapping)
      .where(eq(assetRiskMapping.id, id))
      .returning();

    return result;
  }

  async getRiskMappingById(id) {
    const [result] = await db.select()
      .from(assetRiskMapping)
      .where(eq(assetRiskMapping.id, id))
      .limit(1);

    return result;
  }

  async updateRiskMapping(id, data, userId) {
    const updateData = {
      ...data,
      verifiedBy: userId,
      verifiedAt: new Date(),
      updatedAt: new Date()
    };

    const [result] = await db.update(assetRiskMapping)
      .set(updateData)
      .where(eq(assetRiskMapping.id, id))
      .returning();

    return result;
  }

  async deleteRiskMapping(id) {
    const [result] = await db.delete(assetRiskMapping)
      .where(eq(assetRiskMapping.id, id))
      .returning();

    return result;
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getCostAnalytics(assetUuid, dateRange = {}) {
    const { startDate, endDate } = dateRange;

    // Total cost by type
    let costQuery = db.select({
      costType: assetCostManagement.costType,
      totalAmount: sql`SUM(${assetCostManagement.amount})`,
      count: sql`COUNT(*)`
    })
    .from(assetCostManagement)
    .where(eq(assetCostManagement.assetUuid, assetUuid))
    .groupBy(assetCostManagement.costType);

    if (startDate) {
      costQuery = costQuery.where(gte(assetCostManagement.startDate, startDate));
    }
    if (endDate) {
      costQuery = costQuery.where(lte(assetCostManagement.endDate, endDate));
    }

    const costByType = await costQuery;

    // Operational costs trend
    const operationalTrend = await db.select({
      yearMonth: assetOperationalCosts.yearMonth,
      totalCost: sql`COALESCE(${assetOperationalCosts.powerCost}, 0) +
                     COALESCE(${assetOperationalCosts.spaceCost}, 0) +
                     COALESCE(${assetOperationalCosts.networkCost}, 0) +
                     COALESCE(${assetOperationalCosts.storageCost}, 0) +
                     COALESCE(${assetOperationalCosts.laborCost}, 0) +
                     COALESCE(${assetOperationalCosts.otherCosts}, 0)`
    })
    .from(assetOperationalCosts)
    .where(eq(assetOperationalCosts.assetUuid, assetUuid))
    .orderBy(assetOperationalCosts.yearMonth);

    return {
      costByType,
      operationalTrend,
      summary: {
        totalCosts: costByType.reduce((sum, item) => sum + parseFloat(item.totalAmount), 0),
        totalRecords: costByType.reduce((sum, item) => sum + parseInt(item.count), 0)
      }
    };
  }

  _buildRiskMappingFilters(filters) {
    const conditions = [];

    if (filters.assetUuid) {
      conditions.push(eq(assetRiskMapping.assetUuid, filters.assetUuid));
    }
    if (filters.mappingMethod) {
      conditions.push(eq(assetRiskMapping.mappingMethod, filters.mappingMethod));
    }
    if (filters.verified !== undefined) {
      if (filters.verified) {
        conditions.push(sql`${assetRiskMapping.verifiedAt} IS NOT NULL`);
      } else {
        conditions.push(sql`${assetRiskMapping.verifiedAt} IS NULL`);
      }
    }
    if (filters.minConfidence) {
      conditions.push(gte(assetRiskMapping.mappingConfidence, filters.minConfidence));
    }
    if (filters.maxConfidence) {
      conditions.push(lte(assetRiskMapping.mappingConfidence, filters.maxConfidence));
    }
    if (filters.riskModelId) {
      conditions.push(eq(assetRiskMapping.riskModelId, filters.riskModelId));
    }
    if (filters.costCenterId) {
      conditions.push(eq(assetRiskMapping.costCenterId, filters.costCenterId));
    }

    return conditions;
  }

  // ==================== HELPER METHODS ====================
  
  _buildCostFilters(filters) {
    const conditions = [];
    
    if (filters.costType) {
      conditions.push(eq(assetCostManagement.costType, filters.costType));
    }
    if (filters.billingCycle) {
      conditions.push(eq(assetCostManagement.billingCycle, filters.billingCycle));
    }
    if (filters.vendor) {
      conditions.push(like(assetCostManagement.vendor, `%${filters.vendor}%`));
    }
    if (filters.costCenter) {
      conditions.push(like(assetCostManagement.costCenter, `%${filters.costCenter}%`));
    }
    if (filters.minAmount) {
      conditions.push(gte(assetCostManagement.amount, filters.minAmount));
    }
    if (filters.maxAmount) {
      conditions.push(lte(assetCostManagement.amount, filters.maxAmount));
    }
    if (filters.dateFrom) {
      conditions.push(gte(assetCostManagement.startDate, filters.dateFrom));
    }
    if (filters.dateTo) {
      conditions.push(lte(assetCostManagement.endDate, filters.dateTo));
    }
    if (filters.assetUuid) {
      conditions.push(eq(assetCostManagement.assetUuid, filters.assetUuid));
    }
    
    return conditions;
  }

  _buildLifecycleFilters(filters) {
    const conditions = [];
    
    if (filters.assetUuid) {
      conditions.push(eq(assetLifecycle.assetUuid, filters.assetUuid));
    }
    if (filters.warrantyExpiring) {
      // Warranty expiring in next 90 days
      conditions.push(
        and(
          gte(assetLifecycle.warrantyEndDate, new Date()),
          lte(assetLifecycle.warrantyEndDate, new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
        )
      );
    }
    if (filters.eolApproaching) {
      // EOL in next 180 days
      conditions.push(
        and(
          gte(assetLifecycle.internalEolDate, new Date()),
          lte(assetLifecycle.internalEolDate, new Date(Date.now() + 180 * 24 * 60 * 60 * 1000))
        )
      );
    }
    if (filters.budgetYear) {
      conditions.push(eq(assetLifecycle.replacementBudgetYear, filters.budgetYear));
    }
    
    return conditions;
  }

  _buildOperationalCostFilters(filters) {
    const conditions = [];
    
    if (filters.assetUuid) {
      conditions.push(eq(assetOperationalCosts.assetUuid, filters.assetUuid));
    }
    if (filters.yearMonth) {
      conditions.push(eq(assetOperationalCosts.yearMonth, filters.yearMonth));
    }
    if (filters.yearFrom) {
      conditions.push(gte(assetOperationalCosts.yearMonth, filters.yearFrom));
    }
    if (filters.yearTo) {
      conditions.push(lte(assetOperationalCosts.yearMonth, filters.yearTo));
    }
    
    return conditions;
  }

  // ==================== ASSET DETAIL VIEWS ====================

  /**
   * Get comprehensive asset details using the asset_complete_detail_view
   */
  async getAssetCompleteDetail(assetUuid) {
    try {
      const [result] = await db.select()
        .from(assetCompleteDetailView)
        .where(eq(assetCompleteDetailView.asset_uuid, assetUuid))
        .limit(1);
      
      return result;
    } catch (error) {
      console.error('Error fetching asset complete details:', error);
      throw error;
    }
  }

  /**
   * Get basic asset details using the asset_detail_view
   */
  async getAssetBasicDetail(assetUuid) {
    try {
      const [result] = await db.select()
        .from(assetDetailView)
        .where(eq(assetDetailView.asset_uuid, assetUuid))
        .limit(1);
      
      return result;
    } catch (error) {
      console.error('Error fetching asset basic details:', error);
      throw error;
    }
  }

  /**
   * Get asset network details using the asset_network_detail_view
   */
  async getAssetNetworkDetail(assetUuid) {
    try {
      const [result] = await db.select()
        .from(assetNetworkDetailView)
        .where(eq(assetNetworkDetailView.asset_uuid, assetUuid))
        .limit(1);
      
      return result;
    } catch (error) {
      console.error('Error fetching asset network details:', error);
      throw error;
    }
  }

  /**
   * Get asset vulnerabilities summary using the asset_vulnerabilities_summary_view
   */
  async getAssetVulnerabilitiesSummary(assetUuid) {
    try {
      const [result] = await db.select()
        .from(assetVulnerabilitiesSummaryView)
        .where(eq(assetVulnerabilitiesSummaryView.asset_uuid, assetUuid))
        .limit(1);
      
      return result;
    } catch (error) {
      console.error('Error fetching asset vulnerabilities summary:', error);
      throw error;
    }
  }

  /**
   * Get asset cost summary using the asset_cost_summary_view
   */
  async getAssetCostSummary(assetUuid) {
    try {
      const [result] = await db.select()
        .from(assetCostSummaryView)
        .where(eq(assetCostSummaryView.asset_uuid, assetUuid))
        .limit(1);
      
      return result;
    } catch (error) {
      console.error('Error fetching asset cost summary:', error);
      throw error;
    }
  }

  /**
   * Get asset tags using the asset_tags_view
   */
  async getAssetTagsDetail(assetUuid) {
    try {
      const results = await db.select()
        .from(assetTagsView)
        .where(eq(assetTagsView.asset_uuid, assetUuid));
      
      return results;
    } catch (error) {
      console.error('Error fetching asset tags:', error);
      throw error;
    }
  }

  /**
   * Get paginated list of assets with basic details
   */
  async getAssetsWithDetails(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'hostname', sortOrder = 'asc' } = pagination;
      const offset = (page - 1) * limit;

      let query = db.select().from(assetDetailView);

      // Apply filters
      const conditions = this._buildAssetDetailFilters(filters);
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting - defaulting to hostname since it's available in the view
      const orderFn = sortOrder === 'asc' ? asc : desc;
      const sortColumn = sql.identifier(sortBy);
      
      const results = await query
        .orderBy(orderFn(sortColumn))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [{ count }] = await db.select({ count: sql`count(*)` })
        .from(assetDetailView)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        data: results,
        pagination: {
          page,
          limit,
          total: parseInt(count),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching assets with details:', error);
      throw error;
    }
  }

  /**
   * Build filters for asset detail views
   */
  _buildAssetDetailFilters(filters) {
    const conditions = [];
    
    if (filters.hostname) {
      conditions.push(like(assetDetailView.hostname, `%${filters.hostname}%`));
    }
    if (filters.ipAddress) {
      conditions.push(or(
        like(assetDetailView.ipv4_address, `%${filters.ipAddress}%`),
        like(assetDetailView.ipv6_address, `%${filters.ipAddress}%`)
      ));
    }
    if (filters.operatingSystem) {
      conditions.push(like(assetDetailView.operating_system, `%${filters.operatingSystem}%`));
    }
    if (filters.assetType) {
      conditions.push(eq(assetDetailView.asset_type, filters.assetType));
    }
    if (filters.criticality) {
      conditions.push(eq(assetDetailView.criticality, filters.criticality));
    }
    if (filters.location) {
      conditions.push(like(assetDetailView.location, `%${filters.location}%`));
    }
    if (filters.status) {
      conditions.push(eq(assetDetailView.status, filters.status));
    }
    if (filters.environment) {
      conditions.push(eq(assetDetailView.environment, filters.environment));
    }
    if (filters.hasVulnerabilities !== undefined) {
      if (filters.hasVulnerabilities) {
        conditions.push(sql`${assetDetailView.vulnerability_count} > 0`);
      } else {
        conditions.push(sql`${assetDetailView.vulnerability_count} = 0 OR ${assetDetailView.vulnerability_count} IS NULL`);
      }
    }
    
    return conditions;
  }
}

module.exports = new AssetManagementService();
