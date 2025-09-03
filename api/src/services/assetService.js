const { db } = require('../db');
const { assets, assetSystems, assetNetwork } = require('../db/schema/assets');
const { eq, and, or, like, gte, lte, desc, asc, sql, inArray } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

class AssetService {
  
  // ==================== CREATE ====================
  
  async createAsset(data, userId) {
    const assetUuid = uuidv4();
    
    // Prepare main asset data
    const assetData = {
      assetUuid,
      hostname: data.hostname,
      netbiosName: data.netbiosName || null,
      systemId: data.systemId || null,
      hasAgent: data.hasAgent || false,
      hasPluginResults: data.hasPluginResults || false,
      firstSeen: data.firstSeen ? new Date(data.firstSeen) : null,
      lastSeen: data.lastSeen ? new Date(data.lastSeen) : null,
      exposureScore: data.exposureScore || null,
      acrScore: data.acrScore || null,
      criticalityRating: data.criticalityRating || null,
      source: data.source || 'manual',
      batchId: data.batchId || null,
      rawJson: data.rawJson || null
    };

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create main asset record
      const [asset] = await tx.insert(assets).values(assetData).returning();

      // Create related system record if provided
      if (data.operatingSystem || data.systemType) {
        await tx.insert(assetSystems).values({
          assetUuid: asset.assetUuid,
          operatingSystem: data.operatingSystem || null,
          systemType: data.systemType || null,
          isPrimary: true
        });
      }

      // Create related network record if provided
      if (data.fqdn || data.ipv4Address || data.macAddress || data.networkType) {
        await tx.insert(assetNetwork).values({
          assetUuid: asset.assetUuid,
          fqdn: data.fqdn || null,
          ipv4Address: data.ipv4Address || null,
          macAddress: data.macAddress || null,
          networkType: data.networkType || null,
          isPrimary: true
        });
      }

      return asset;
    });

    return result;
  }

  // ==================== READ ====================
  
  async getAssets(filters = {}, pagination = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const offset = (page - 1) * limit;

    // Build base query with joins
    let query = db.select({
      // Main asset fields
      id: assets.id,
      assetUuid: assets.assetUuid,
      hostname: assets.hostname,
      netbiosName: assets.netbiosName,
      systemId: assets.systemId,
      hasAgent: assets.hasAgent,
      hasPluginResults: assets.hasPluginResults,
      firstSeen: assets.firstSeen,
      lastSeen: assets.lastSeen,
      exposureScore: assets.exposureScore,
      acrScore: assets.acrScore,
      criticalityRating: assets.criticalityRating,
      source: assets.source,
      batchId: assets.batchId,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
      // Related system fields
      operatingSystem: assetSystems.operatingSystem,
      systemType: assetSystems.systemType,
      // Related network fields
      fqdn: assetNetwork.fqdn,
      ipv4Address: assetNetwork.ipv4Address,
      macAddress: assetNetwork.macAddress,
      networkType: assetNetwork.networkType
    })
    .from(assets)
    .leftJoin(assetSystems, and(
      eq(assetSystems.assetUuid, assets.assetUuid),
      eq(assetSystems.isPrimary, true)
    ))
    .leftJoin(assetNetwork, and(
      eq(assetNetwork.assetUuid, assets.assetUuid),
      eq(assetNetwork.isPrimary, true)
    ));

    // Apply filters
    const conditions = this._buildFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = assets[sortBy] || assets.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Get results with pagination
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalQuery = db.select({ count: sql`count(*)` }).from(assets);
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    const [{ count }] = await totalQuery;
    const totalCount = parseInt(count);

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getAssetById(assetUuid) {
    const [result] = await db.select({
      // Main asset fields
      id: assets.id,
      assetUuid: assets.assetUuid,
      hostname: assets.hostname,
      netbiosName: assets.netbiosName,
      systemId: assets.systemId,
      hasAgent: assets.hasAgent,
      hasPluginResults: assets.hasPluginResults,
      firstSeen: assets.firstSeen,
      lastSeen: assets.lastSeen,
      exposureScore: assets.exposureScore,
      acrScore: assets.acrScore,
      criticalityRating: assets.criticalityRating,
      source: assets.source,
      batchId: assets.batchId,
      rawJson: assets.rawJson,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
      // Related system fields
      operatingSystem: assetSystems.operatingSystem,
      systemType: assetSystems.systemType,
      // Related network fields
      fqdn: assetNetwork.fqdn,
      ipv4Address: assetNetwork.ipv4Address,
      macAddress: assetNetwork.macAddress,
      networkType: assetNetwork.networkType
    })
    .from(assets)
    .leftJoin(assetSystems, and(
      eq(assetSystems.assetUuid, assets.assetUuid),
      eq(assetSystems.isPrimary, true)
    ))
    .leftJoin(assetNetwork, and(
      eq(assetNetwork.assetUuid, assets.assetUuid),
      eq(assetNetwork.isPrimary, true)
    ))
    .where(eq(assets.assetUuid, assetUuid));

    return result;
  }

  async getAssetsByIds(assetUuids) {
    if (!assetUuids || assetUuids.length === 0) {
      return [];
    }

    const results = await db.select({
      // Main asset fields
      id: assets.id,
      assetUuid: assets.assetUuid,
      hostname: assets.hostname,
      netbiosName: assets.netbiosName,
      systemId: assets.systemId,
      hasAgent: assets.hasAgent,
      hasPluginResults: assets.hasPluginResults,
      firstSeen: assets.firstSeen,
      lastSeen: assets.lastSeen,
      exposureScore: assets.exposureScore,
      acrScore: assets.acrScore,
      criticalityRating: assets.criticalityRating,
      source: assets.source,
      batchId: assets.batchId,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
      // Related system fields
      operatingSystem: assetSystems.operatingSystem,
      systemType: assetSystems.systemType,
      // Related network fields
      fqdn: assetNetwork.fqdn,
      ipv4Address: assetNetwork.ipv4Address,
      macAddress: assetNetwork.macAddress,
      networkType: assetNetwork.networkType
    })
    .from(assets)
    .leftJoin(assetSystems, and(
      eq(assetSystems.assetUuid, assets.assetUuid),
      eq(assetSystems.isPrimary, true)
    ))
    .leftJoin(assetNetwork, and(
      eq(assetNetwork.assetUuid, assets.assetUuid),
      eq(assetNetwork.isPrimary, true)
    ))
    .where(inArray(assets.assetUuid, assetUuids));

    return results;
  }

  // ==================== UPDATE ====================
  
  async updateAsset(assetUuid, data, userId) {
    // Prepare main asset updates
    const assetUpdates = {};
    const assetFields = [
      'hostname', 'netbiosName', 'systemId', 'hasAgent', 'hasPluginResults',
      'firstSeen', 'lastSeen', 'exposureScore', 'acrScore', 'criticalityRating',
      'source', 'batchId', 'rawJson'
    ];

    assetFields.forEach(field => {
      if (data[field] !== undefined) {
        if (field === 'firstSeen' || field === 'lastSeen') {
          assetUpdates[field] = data[field] ? new Date(data[field]) : null;
        } else {
          assetUpdates[field] = data[field];
        }
      }
    });

    if (Object.keys(assetUpdates).length > 0) {
      assetUpdates.updatedAt = new Date();
    }

    // Start transaction
    const result = await db.transaction(async (tx) => {
      let updatedAsset = null;

      // Update main asset record
      if (Object.keys(assetUpdates).length > 0) {
        const [asset] = await tx.update(assets)
          .set(assetUpdates)
          .where(eq(assets.assetUuid, assetUuid))
          .returning();
        
        if (!asset) {
          throw new Error('Asset not found');
        }
        updatedAsset = asset;
      }

      // Update system record if provided
      if (data.operatingSystem !== undefined || data.systemType !== undefined) {
        const systemUpdates = {};
        if (data.operatingSystem !== undefined) systemUpdates.operatingSystem = data.operatingSystem;
        if (data.systemType !== undefined) systemUpdates.systemType = data.systemType;

        await tx.update(assetSystems)
          .set(systemUpdates)
          .where(and(
            eq(assetSystems.assetUuid, assetUuid),
            eq(assetSystems.isPrimary, true)
          ));
      }

      // Update network record if provided
      const networkFields = ['fqdn', 'ipv4Address', 'macAddress', 'networkType'];
      const networkUpdates = {};
      networkFields.forEach(field => {
        if (data[field] !== undefined) {
          networkUpdates[field] = data[field];
        }
      });

      if (Object.keys(networkUpdates).length > 0) {
        await tx.update(assetNetwork)
          .set(networkUpdates)
          .where(and(
            eq(assetNetwork.assetUuid, assetUuid),
            eq(assetNetwork.isPrimary, true)
          ));
      }

      return updatedAsset || { assetUuid };
    });

    return result;
  }

  // ==================== DELETE ====================

  async deleteAsset(assetUuid, force = false) {
    // Check if asset has related data
    if (!force) {
      const relatedDataCheck = await this._checkRelatedData(assetUuid);
      if (relatedDataCheck.hasRelatedData) {
        throw new Error(`Cannot delete asset: has related data (${relatedDataCheck.relatedTypes.join(', ')}). Use force=true to override.`);
      }
    }

    const [result] = await db.delete(assets)
      .where(eq(assets.assetUuid, assetUuid))
      .returning();

    return result;
  }

  // ==================== BULK OPERATIONS ====================

  async bulkUpdateAssets(assetUuids, updates, userId) {
    const assetUpdates = {};
    const assetFields = [
      'hostname', 'netbiosName', 'systemId', 'hasAgent', 'hasPluginResults',
      'firstSeen', 'lastSeen', 'exposureScore', 'acrScore', 'criticalityRating',
      'source', 'batchId', 'rawJson'
    ];

    assetFields.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'firstSeen' || field === 'lastSeen') {
          assetUpdates[field] = updates[field] ? new Date(updates[field]) : null;
        } else {
          assetUpdates[field] = updates[field];
        }
      }
    });

    if (Object.keys(assetUpdates).length > 0) {
      assetUpdates.updatedAt = new Date();
    }

    const results = await db.update(assets)
      .set(assetUpdates)
      .where(inArray(assets.assetUuid, assetUuids))
      .returning();

    return results;
  }

  async bulkDeleteAssets(assetUuids, force = false) {
    if (!force) {
      // Check each asset for related data
      for (const assetUuid of assetUuids) {
        const relatedDataCheck = await this._checkRelatedData(assetUuid);
        if (relatedDataCheck.hasRelatedData) {
          throw new Error(`Cannot delete asset ${assetUuid}: has related data (${relatedDataCheck.relatedTypes.join(', ')}). Use force=true to override.`);
        }
      }
    }

    const results = await db.delete(assets)
      .where(inArray(assets.assetUuid, assetUuids))
      .returning();

    return results;
  }

  // ==================== HELPER METHODS ====================

  _buildFilters(filters) {
    const conditions = [];

    if (filters.hostname && filters.hostname.trim()) {
      conditions.push(like(assets.hostname, `%${filters.hostname}%`));
    }
    if (filters.systemId && filters.systemId.trim()) {
      conditions.push(eq(assets.systemId, filters.systemId));
    }
    if (filters.hasAgent !== undefined && filters.hasAgent !== '') {
      conditions.push(eq(assets.hasAgent, filters.hasAgent));
    }
    if (filters.hasPluginResults !== undefined && filters.hasPluginResults !== '') {
      conditions.push(eq(assets.hasPluginResults, filters.hasPluginResults));
    }

    // Handle both criticalityRating and criticality (frontend compatibility)
    const criticalityValue = filters.criticalityRating || filters.criticality;
    if (criticalityValue && criticalityValue.trim()) {
      conditions.push(eq(assets.criticalityRating, criticalityValue));
    }

    if (filters.source && filters.source.trim()) {
      conditions.push(eq(assets.source, filters.source));
    }
    if (filters.operatingSystem && filters.operatingSystem.trim()) {
      conditions.push(like(assetSystems.operatingSystem, `%${filters.operatingSystem}%`));
    }

    // Handle both systemType and assetType (frontend compatibility)
    const systemTypeValue = filters.systemType || filters.assetType;
    if (systemTypeValue && systemTypeValue.trim()) {
      conditions.push(eq(assetSystems.systemType, systemTypeValue));
    }

    if (filters.ipAddress && filters.ipAddress.trim()) {
      conditions.push(like(assetNetwork.ipv4Address, `%${filters.ipAddress}%`));
    }
    if (filters.networkType && filters.networkType.trim()) {
      conditions.push(eq(assetNetwork.networkType, filters.networkType));
    }
    if (filters.createdAfter && filters.createdAfter.trim()) {
      conditions.push(gte(assets.createdAt, new Date(filters.createdAfter)));
    }
    if (filters.createdBefore && filters.createdBefore.trim()) {
      conditions.push(lte(assets.createdAt, new Date(filters.createdBefore)));
    }
    if (filters.lastSeenAfter && filters.lastSeenAfter.trim()) {
      conditions.push(gte(assets.lastSeen, new Date(filters.lastSeenAfter)));
    }
    if (filters.lastSeenBefore && filters.lastSeenBefore.trim()) {
      conditions.push(lte(assets.lastSeen, new Date(filters.lastSeenBefore)));
    }
    if (filters.minExposureScore !== undefined && filters.minExposureScore !== '') {
      conditions.push(gte(assets.exposureScore, filters.minExposureScore));
    }
    if (filters.maxExposureScore !== undefined && filters.maxExposureScore !== '') {
      conditions.push(lte(assets.exposureScore, filters.maxExposureScore));
    }
    if (filters.minAcrScore !== undefined && filters.minAcrScore !== '') {
      conditions.push(gte(assets.acrScore, filters.minAcrScore));
    }
    if (filters.maxAcrScore !== undefined && filters.maxAcrScore !== '') {
      conditions.push(lte(assets.acrScore, filters.maxAcrScore));
    }
    if (filters.search && filters.search.trim()) {
      conditions.push(or(
        like(assets.hostname, `%${filters.search}%`),
        like(assets.netbiosName, `%${filters.search}%`)
      ));
    }

    return conditions;
  }

  async _checkRelatedData(assetUuid) {
    const relatedTypes = [];

    // Check for related data in various tables
    const checks = [
      { table: 'asset_tags', field: 'asset_uuid' },
      { table: 'asset_cost_management', field: 'asset_uuid' },
      { table: 'asset_lifecycle', field: 'asset_uuid' },
      { table: 'asset_operational_costs', field: 'asset_uuid' },
      { table: 'asset_risk_mapping', field: 'asset_uuid' },
      { table: 'vulnerabilities', field: 'asset_uuid' }
    ];

    for (const check of checks) {
      try {
        const [result] = await db.execute(
          sql`SELECT COUNT(*) as count FROM ${sql.identifier(check.table)} WHERE ${sql.identifier(check.field)} = ${assetUuid}`
        );
        if (parseInt(result.count) > 0) {
          relatedTypes.push(check.table);
        }
      } catch (error) {
        // Table might not exist, skip
        console.warn(`Could not check ${check.table} for related data:`, error.message);
      }
    }

    return {
      hasRelatedData: relatedTypes.length > 0,
      relatedTypes
    };
  }
}

module.exports = new AssetService();
