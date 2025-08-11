const { db } = require('../db');
const {
  patches,
  patchVulnerabilities,
  patchAssets,
  patchDependencies,
  vulnerabilities,
  assets,
  users
} = require('../db/schema');
const { eq, and, gte, lte, like, desc, asc, sql, or, inArray, isNull, isNotNull } = require('drizzle-orm');

class PatchService {
  
  // ==================== PATCH MANAGEMENT ====================
  
  async createPatch(data, userId) {
    const patchData = {
      ...data,
      createdBy: userId,
      updatedBy: userId
    };
    
    const [result] = await db.insert(patches)
      .values(patchData)
      .returning();
    
    return result;
  }

  async getPatches(filters = {}, pagination = {}) {
    console.log('🔍 Service getPatches called with:', { filters, pagination });

    // Test if table exists by running a simple count query
    try {
      console.log('🧪 Testing patches table existence...');
      const testResult = await db.select({ count: sql`count(*)` }).from(patches);
      console.log('✅ Patches table exists, count:', testResult);
    } catch (testError) {
      console.error('❌ Patches table test failed:', testError.message);
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

    let query = db.select({
      // Main patch fields
      id: patches.id,
      patchId: patches.patchId,
      title: patches.title,
      description: patches.description,
      vendor: patches.vendor,
      vendorAdvisoryId: patches.vendorAdvisoryId,
      severity: patches.severity,
      type: patches.type,
      status: patches.status,
      releaseDate: patches.releaseDate,
      supersededBy: patches.supersededBy,
      supersedes: patches.supersedes,
      cveIds: patches.cveIds,
      affectedProducts: patches.affectedProducts,
      prerequisites: patches.prerequisites,
      rebootRequired: patches.rebootRequired,
      downloadUrl: patches.downloadUrl,
      downloadSize: patches.downloadSize,
      businessImpact: patches.businessImpact,
      technicalComplexity: patches.technicalComplexity,
      estimatedDowntime: patches.estimatedDowntime,
      source: patches.source,
      createdAt: patches.createdAt,
      updatedAt: patches.updatedAt,
      
      // Calculate affected asset count
      affectedAssetCount: sql`(
        SELECT COUNT(DISTINCT pa.asset_uuid) 
        FROM patch_assets pa 
        WHERE pa.patch_id = ${patches.id} 
        AND pa.is_applicable = true
      )`,
      
      // Calculate installed asset count
      installedAssetCount: sql`(
        SELECT COUNT(DISTINCT pa.asset_uuid) 
        FROM patch_assets pa 
        WHERE pa.patch_id = ${patches.id} 
        AND pa.is_installed = true
      )`,
      
      // Calculate addressed vulnerability count
      vulnerabilityCount: sql`(
        SELECT COUNT(DISTINCT pv.vulnerability_id) 
        FROM patch_vulnerabilities pv 
        WHERE pv.patch_id = ${patches.id}
      )`,
      
      // Calculate days since release
      daysSinceRelease: sql`CASE 
        WHEN ${patches.releaseDate} IS NOT NULL 
        THEN (CURRENT_DATE - ${patches.releaseDate}::date) 
        ELSE NULL 
      END`
    })
    .from(patches);

    // Apply filters
    const conditions = this._buildPatchFilters(filters);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortColumn = patches[sortBy] || patches.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;
    
    const results = await query
      .orderBy(orderFn(sortColumn))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [{ count }] = await db.select({ count: sql`count(*)` })
      .from(patches)
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

  async getPatchById(id) {
    const [result] = await db.select({
      // Main patch data
      id: patches.id,
      patchId: patches.patchId,
      title: patches.title,
      description: patches.description,
      vendor: patches.vendor,
      vendorAdvisoryId: patches.vendorAdvisoryId,
      severity: patches.severity,
      type: patches.type,
      status: patches.status,
      releaseDate: patches.releaseDate,
      supersededBy: patches.supersededBy,
      supersedes: patches.supersedes,
      cveIds: patches.cveIds,
      affectedProducts: patches.affectedProducts,
      prerequisites: patches.prerequisites,
      rebootRequired: patches.rebootRequired,
      downloadUrl: patches.downloadUrl,
      downloadSize: patches.downloadSize,
      installationNotes: patches.installationNotes,
      uninstallationNotes: patches.uninstallationNotes,
      testingNotes: patches.testingNotes,
      knownIssues: patches.knownIssues,
      rollbackInstructions: patches.rollbackInstructions,
      complianceFrameworks: patches.complianceFrameworks,
      businessImpact: patches.businessImpact,
      technicalComplexity: patches.technicalComplexity,
      estimatedDowntime: patches.estimatedDowntime,
      source: patches.source,
      rawJson: patches.rawJson,
      createdAt: patches.createdAt,
      updatedAt: patches.updatedAt
    })
    .from(patches)
    .where(eq(patches.id, id))
    .limit(1);
    
    return result;
  }

  async updatePatch(id, data, userId) {
    const updateData = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date()
    };

    const [result] = await db.update(patches)
      .set(updateData)
      .where(eq(patches.id, id))
      .returning();
    
    return result;
  }

  async deletePatch(id) {
    const [result] = await db.delete(patches)
      .where(eq(patches.id, id))
      .returning();
    
    return result;
  }

  // ==================== PATCH VULNERABILITY MAPPING ====================
  
  async linkPatchToVulnerabilities(patchId, vulnerabilityIds, userId) {
    const mappings = vulnerabilityIds.map(vulnId => ({
      patchId,
      vulnerabilityId: vulnId,
      effectiveness: 'complete'
    }));

    const results = await db.insert(patchVulnerabilities)
      .values(mappings)
      .returning();

    return results;
  }

  async unlinkPatchFromVulnerability(patchId, vulnerabilityId) {
    const [result] = await db.delete(patchVulnerabilities)
      .where(and(
        eq(patchVulnerabilities.patchId, patchId),
        eq(patchVulnerabilities.vulnerabilityId, vulnerabilityId)
      ))
      .returning();

    return result;
  }

  async getPatchVulnerabilities(patchId) {
    const results = await db.select({
      id: patchVulnerabilities.id,
      patchId: patchVulnerabilities.patchId,
      vulnerabilityId: patchVulnerabilities.vulnerabilityId,
      effectiveness: patchVulnerabilities.effectiveness,
      notes: patchVulnerabilities.notes,
      // Vulnerability details
      cveId: vulnerabilities.cveId,
      severity: vulnerabilities.severity,
      baseScore: vulnerabilities.baseScore,
      vectorString: vulnerabilities.vectorString,
      description: vulnerabilities.description
    })
    .from(patchVulnerabilities)
    .leftJoin(vulnerabilities, eq(patchVulnerabilities.vulnerabilityId, vulnerabilities.id))
    .where(eq(patchVulnerabilities.patchId, patchId));

    return results;
  }

  // ==================== PATCH ASSET MAPPING ====================
  
  async linkPatchToAssets(patchId, assetUuids, userId) {
    const mappings = assetUuids.map(assetUuid => ({
      patchId,
      assetUuid,
      isApplicable: true,
      isInstalled: false
    }));

    const results = await db.insert(patchAssets)
      .values(mappings)
      .returning();

    return results;
  }

  async updatePatchAssetStatus(patchId, assetUuid, status, notes = null) {
    const updateData = {
      isInstalled: status === 'installed',
      installationStatus: status,
      installationNotes: notes,
      installationDate: status === 'installed' ? new Date() : null,
      updatedAt: new Date()
    };

    const [result] = await db.update(patchAssets)
      .set(updateData)
      .where(and(
        eq(patchAssets.patchId, patchId),
        eq(patchAssets.assetUuid, assetUuid)
      ))
      .returning();

    return result;
  }

  async getPatchAssets(patchId, filters = {}) {
    let query = db.select({
      id: patchAssets.id,
      patchId: patchAssets.patchId,
      assetUuid: patchAssets.assetUuid,
      isApplicable: patchAssets.isApplicable,
      isInstalled: patchAssets.isInstalled,
      installationDate: patchAssets.installationDate,
      installationStatus: patchAssets.installationStatus,
      installationNotes: patchAssets.installationNotes,
      detectedVersion: patchAssets.detectedVersion,
      targetVersion: patchAssets.targetVersion,
      lastScanned: patchAssets.lastScanned,
      // Asset details
      hostname: assets.hostname,
      ipv4: assets.ipv4,
      operatingSystem: assets.operatingSystem,
      osVersion: assets.osVersion
    })
    .from(patchAssets)
    .leftJoin(assets, eq(patchAssets.assetUuid, assets.assetUuid))
    .where(eq(patchAssets.patchId, patchId));

    // Apply additional filters
    if (filters.isInstalled !== undefined) {
      query = query.where(eq(patchAssets.isInstalled, filters.isInstalled));
    }
    if (filters.isApplicable !== undefined) {
      query = query.where(eq(patchAssets.isApplicable, filters.isApplicable));
    }

    const results = await query;
    return results;
  }

  // ==================== PATCH DEPENDENCIES ====================
  
  async createPatchDependency(patchId, dependentPatchId, dependencyType, isOptional = false, notes = null) {
    const dependencyData = {
      patchId,
      dependentPatchId,
      dependencyType,
      isOptional,
      notes
    };

    const [result] = await db.insert(patchDependencies)
      .values(dependencyData)
      .returning();

    return result;
  }

  async getPatchDependencies(patchId) {
    const results = await db.select({
      id: patchDependencies.id,
      patchId: patchDependencies.patchId,
      dependentPatchId: patchDependencies.dependentPatchId,
      dependencyType: patchDependencies.dependencyType,
      isOptional: patchDependencies.isOptional,
      notes: patchDependencies.notes,
      // Dependent patch details
      dependentPatchTitle: sql`dp.title`,
      dependentPatchStatus: sql`dp.status`,
      dependentPatchSeverity: sql`dp.severity`
    })
    .from(patchDependencies)
    .leftJoin(patches, eq(patchDependencies.dependentPatchId, patches.id))
    .where(eq(patchDependencies.patchId, patchId));

    return results;
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getPatchAnalytics(filters = {}) {
    // Patch status distribution
    const statusDistribution = await db.select({
      status: patches.status,
      count: sql`COUNT(*)`,
      percentage: sql`ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2)`
    })
    .from(patches)
    .groupBy(patches.status);

    // Severity distribution
    const severityDistribution = await db.select({
      severity: patches.severity,
      count: sql`COUNT(*)`,
      percentage: sql`ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2)`
    })
    .from(patches)
    .groupBy(patches.severity);

    // Vendor distribution
    const vendorDistribution = await db.select({
      vendor: patches.vendor,
      count: sql`COUNT(*)`,
      percentage: sql`ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2)`
    })
    .from(patches)
    .groupBy(patches.vendor)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

    // Monthly patch release trend
    const releaseTrend = await db.select({
      month: sql`TO_CHAR(${patches.releaseDate}, 'YYYY-MM')`,
      count: sql`COUNT(*)`,
      criticalCount: sql`SUM(CASE WHEN ${patches.severity} = 'critical' THEN 1 ELSE 0 END)`,
      highCount: sql`SUM(CASE WHEN ${patches.severity} = 'high' THEN 1 ELSE 0 END)`
    })
    .from(patches)
    .where(isNotNull(patches.releaseDate))
    .groupBy(sql`TO_CHAR(${patches.releaseDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${patches.releaseDate}, 'YYYY-MM')`)
    .limit(12);

    // Installation completion rates
    const completionRates = await db.select({
      severity: patches.severity,
      totalPatches: sql`COUNT(DISTINCT ${patches.id})`,
      totalApplicableAssets: sql`COUNT(DISTINCT ${patchAssets.assetUuid})`,
      totalInstalledAssets: sql`SUM(CASE WHEN ${patchAssets.isInstalled} = true THEN 1 ELSE 0 END)`,
      completionRate: sql`ROUND(
        SUM(CASE WHEN ${patchAssets.isInstalled} = true THEN 1 ELSE 0 END) * 100.0 / 
        NULLIF(COUNT(DISTINCT ${patchAssets.assetUuid}), 0), 2
      )`
    })
    .from(patches)
    .leftJoin(patchAssets, eq(patches.id, patchAssets.patchId))
    .groupBy(patches.severity);

    return {
      statusDistribution,
      severityDistribution,
      vendorDistribution,
      releaseTrend,
      completionRates,
      summary: {
        totalPatches: statusDistribution.reduce((sum, item) => sum + parseInt(item.count), 0),
        criticalPatches: severityDistribution.find(s => s.severity === 'critical')?.count || 0,
        highPatches: severityDistribution.find(s => s.severity === 'high')?.count || 0,
        pendingPatches: statusDistribution.find(s => s.status === 'available')?.count || 0
      }
    };
  }

  async getComplianceReport(filters = {}) {
    // Get patches by compliance framework
    const complianceStats = await db.select({
      framework: sql`jsonb_array_elements_text(${patches.complianceFrameworks}::jsonb)`,
      totalPatches: sql`COUNT(*)`,
      installedPatches: sql`SUM(
        CASE WHEN EXISTS(
          SELECT 1 FROM patch_assets pa 
          WHERE pa.patch_id = ${patches.id} 
          AND pa.is_installed = true
        ) THEN 1 ELSE 0 END
      )`,
      complianceRate: sql`ROUND(
        SUM(
          CASE WHEN EXISTS(
            SELECT 1 FROM patch_assets pa 
            WHERE pa.patch_id = ${patches.id} 
            AND pa.is_installed = true
          ) THEN 1 ELSE 0 END
        ) * 100.0 / COUNT(*), 2
      )`
    })
    .from(patches)
    .where(isNotNull(patches.complianceFrameworks))
    .groupBy(sql`jsonb_array_elements_text(${patches.complianceFrameworks}::jsonb)`);

    return {
      complianceStats,
      summary: {
        totalFrameworks: complianceStats.length,
        averageCompliance: complianceStats.reduce((sum, item) => 
          sum + parseFloat(item.complianceRate || 0), 0) / complianceStats.length
      }
    };
  }

  // ==================== HELPER METHODS ====================
  
  _buildPatchFilters(filters) {
    const conditions = [];
    
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(inArray(patches.status, filters.status));
      } else {
        conditions.push(eq(patches.status, filters.status));
      }
    }
    if (filters.severity) {
      if (Array.isArray(filters.severity)) {
        conditions.push(inArray(patches.severity, filters.severity));
      } else {
        conditions.push(eq(patches.severity, filters.severity));
      }
    }
    if (filters.type) {
      if (Array.isArray(filters.type)) {
        conditions.push(inArray(patches.type, filters.type));
      } else {
        conditions.push(eq(patches.type, filters.type));
      }
    }
    if (filters.vendor) {
      if (Array.isArray(filters.vendor)) {
        conditions.push(inArray(patches.vendor, filters.vendor));
      } else {
        conditions.push(eq(patches.vendor, filters.vendor));
      }
    }
    if (filters.search) {
      conditions.push(or(
        like(patches.title, `%${filters.search}%`),
        like(patches.description, `%${filters.search}%`),
        like(patches.patchId, `%${filters.search}%`),
        like(patches.cveIds, `%${filters.search}%`)
      ));
    }
    if (filters.rebootRequired !== undefined) {
      conditions.push(eq(patches.rebootRequired, filters.rebootRequired));
    }
    if (filters.releaseDateFrom) {
      conditions.push(gte(patches.releaseDate, filters.releaseDateFrom));
    }
    if (filters.releaseDateTo) {
      conditions.push(lte(patches.releaseDate, filters.releaseDateTo));
    }
    if (filters.businessImpact) {
      conditions.push(eq(patches.businessImpact, filters.businessImpact));
    }
    if (filters.technicalComplexity) {
      conditions.push(eq(patches.technicalComplexity, filters.technicalComplexity));
    }
    if (filters.cveId) {
      conditions.push(like(patches.cveIds, `%${filters.cveId}%`));
    }
    if (filters.superseded !== undefined) {
      if (filters.superseded) {
        conditions.push(isNotNull(patches.supersededBy));
      } else {
        conditions.push(isNull(patches.supersededBy));
      }
    }
    
    return conditions;
  }
}

module.exports = new PatchService();