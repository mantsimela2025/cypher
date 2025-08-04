const tenableService = require('../../services/integrations/tenableService');
const orchestrationService = require('../../services/integrations/orchestrationService');
const { db } = require('../../db');
const { assets, vulnerabilities, assetVulnerabilities, assetSystems, assetNetwork } = require('../../db/schema');
const { desc, eq, count, and, or, ilike, sql } = require('drizzle-orm');

/**
 * Tenable Integration Controller
 * Handles API endpoints for Tenable data synchronization and management
 */

/**
 * Get Tenable service status
 */
const getStatus = async (req, res) => {
  try {
    const status = await tenableService.getSyncStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get Tenable status',
      error: error.message
    });
  }
};

/**
 * Trigger manual asset synchronization
 */
const syncAssets = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    
    console.log('🔄 Manual asset sync triggered by user:', req.user?.email);
    const results = await tenableService.syncAssets(filters);
    
    res.json({
      success: true,
      message: 'Asset synchronization completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Asset synchronization failed',
      error: error.message
    });
  }
};

/**
 * Trigger manual vulnerability synchronization
 */
const syncVulnerabilities = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    
    console.log('🔄 Manual vulnerability sync triggered by user:', req.user?.email);
    const results = await tenableService.syncVulnerabilities(filters);
    
    res.json({
      success: true,
      message: 'Vulnerability synchronization completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Vulnerability synchronization failed',
      error: error.message
    });
  }
};

/**
 * Trigger full synchronization (assets + vulnerabilities)
 */
const syncAll = async (req, res) => {
  try {
    const { filters = {} } = req.body;
    
    console.log('🔄 Full sync triggered by user:', req.user?.email);
    
    // Sync assets first
    const assetResults = await tenableService.syncAssets(filters);
    
    // Then sync vulnerabilities
    const vulnResults = await tenableService.syncVulnerabilities(filters);
    
    res.json({
      success: true,
      message: 'Full synchronization completed',
      data: {
        assets: assetResults,
        vulnerabilities: vulnResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Full synchronization failed',
      error: error.message
    });
  }
};

/**
 * Get synchronized assets with pagination
 */
const getAssets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      criticality = '',
      hasAgent = null
    } = req.query;

    // Clean up empty string parameters
    const cleanSearch = search?.trim() || '';
    const cleanCriticality = criticality?.trim() || '';
    const cleanHasAgent = hasAgent?.trim() || null;
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let whereConditions = [];

    // Only filter by source if it's explicitly requested
    if (req.query.source?.trim()) {
      whereConditions.push(eq(assets.source, req.query.source.trim()));
    }

    if (cleanSearch) {
      whereConditions.push(
        or(
          ilike(assets.hostname, `%${cleanSearch}%`),
          ilike(assets.assetUuid, `%${cleanSearch}%`)
        )
      );
    }

    if (cleanCriticality) {
      whereConditions.push(eq(assets.criticalityRating, cleanCriticality));
    }

    if (cleanHasAgent !== null && cleanHasAgent !== '') {
      whereConditions.push(eq(assets.hasAgent, cleanHasAgent === 'true'));
    }

    // Combine conditions with AND
    const finalConditions = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Get assets with pagination
    let query = db.select().from(assets);
    if (finalConditions) {
      query = query.where(finalConditions);
    }

    const assetList = await query
      .orderBy(desc(assets.lastSeen))
      .limit(parseInt(limit))
      .offset(offset);

    // Get total count
    let countQuery = db.select({ count: count() }).from(assets);
    if (finalConditions) {
      countQuery = countQuery.where(finalConditions);
    }
    const [{ count: totalCount }] = await countQuery;
    
    res.json({
      success: true,
      data: {
        assets: assetList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assets',
      error: error.message
    });
  }
};

/**
 * Get synchronized vulnerabilities with pagination
 */
const getVulnerabilities = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      severity = '', 
      state = '',
      assetUuid = '' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    // Build query conditions
    let whereConditions = eq(vulnerabilities.source, 'tenable');
    
    if (severity) {
      whereConditions = and(
        whereConditions,
        eq(vulnerabilities.severityName, severity)
      );
    }
    
    if (state) {
      whereConditions = and(
        whereConditions,
        eq(vulnerabilities.state, state)
      );
    }
    
    if (assetUuid) {
      whereConditions = and(
        whereConditions,
        eq(vulnerabilities.assetUuid, assetUuid)
      );
    }
    
    // Get vulnerabilities with pagination
    const vulnList = await db.select()
      .from(vulnerabilities)
      .where(whereConditions)
      .orderBy(desc(vulnerabilities.lastFound))
      .limit(parseInt(limit))
      .offset(offset);
    
    // Get total count
    const [{ count: totalCount }] = await db.select({ count: count() })
      .from(vulnerabilities)
      .where(whereConditions);
    
    res.json({
      success: true,
      data: {
        vulnerabilities: vulnList,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vulnerabilities',
      error: error.message
    });
  }
};

/**
 * Get asset details with vulnerabilities
 */
const getAssetDetails = async (req, res) => {
  try {
    const { assetUuid } = req.params;
    
    // Get asset details
    const [asset] = await db.select()
      .from(assets)
      .where(eq(assets.assetUuid, assetUuid));
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    
    // Get asset vulnerabilities
    const assetVulns = await db.select()
      .from(vulnerabilities)
      .where(eq(vulnerabilities.assetUuid, assetUuid))
      .orderBy(desc(vulnerabilities.severity));
    
    // Get vulnerability summary
    const vulnSummary = {
      critical: assetVulns.filter(v => v.severity === 4).length,
      high: assetVulns.filter(v => v.severity === 3).length,
      medium: assetVulns.filter(v => v.severity === 2).length,
      low: assetVulns.filter(v => v.severity === 1).length,
      info: assetVulns.filter(v => v.severity === 0).length,
      total: assetVulns.length
    };
    
    res.json({
      success: true,
      data: {
        asset,
        vulnerabilities: assetVulns,
        summary: vulnSummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset details',
      error: error.message
    });
  }
};

/**
 * Get dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get asset counts
    const [assetStats] = await db.select({ count: count() })
      .from(assets)
      .where(eq(assets.source, 'tenable'));
    
    // Get vulnerability counts by severity
    const vulnStats = await db.select({
      severity: vulnerabilities.severity,
      count: count()
    })
      .from(vulnerabilities)
      .where(eq(vulnerabilities.source, 'tenable'))
      .groupBy(vulnerabilities.severity);
    
    // Format vulnerability stats
    const vulnSummary = {
      critical: vulnStats.find(v => v.severity === 4)?.count || 0,
      high: vulnStats.find(v => v.severity === 3)?.count || 0,
      medium: vulnStats.find(v => v.severity === 2)?.count || 0,
      low: vulnStats.find(v => v.severity === 1)?.count || 0,
      info: vulnStats.find(v => v.severity === 0)?.count || 0
    };
    
    vulnSummary.total = Object.values(vulnSummary).reduce((a, b) => a + b, 0);
    
    res.json({
      success: true,
      data: {
        assets: {
          total: assetStats.count
        },
        vulnerabilities: vulnSummary,
        lastSync: new Date() // TODO: Get actual last sync time
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
};

/**
 * Get asset system information
 */
const getAssetSystems = async (req, res) => {
  try {
    const { assetUuid } = req.params;

    // Get asset system information
    const systemData = await db.select()
      .from(assetSystems)
      .where(eq(assetSystems.assetUuid, assetUuid));

    if (!systemData || systemData.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: systemData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset system information',
      error: error.message
    });
  }
};

/**
 * Get asset network information
 */
const getAssetNetwork = async (req, res) => {
  try {
    const { assetUuid } = req.params;

    // Get asset network information
    const networkData = await db.select()
      .from(assetNetwork)
      .where(eq(assetNetwork.assetUuid, assetUuid));

    if (!networkData || networkData.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: networkData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset network information',
      error: error.message
    });
  }
};

/**
 * Debug endpoint to check asset data
 */
const debugAssets = async (req, res) => {
  try {
    // Get first 10 assets to debug
    const assetList = await db.select()
      .from(assets)
      .limit(10);

    // Get total count
    const [{ count: totalCount }] = await db.select({ count: count() })
      .from(assets);

    res.json({
      success: true,
      debug: true,
      message: `Found ${totalCount} total assets in database`,
      data: {
        totalAssets: totalCount,
        sampleAssets: assetList,
        tableColumns: Object.keys(assetList[0] || {}),
        firstAssetExample: assetList[0] || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Debug query failed',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Update assets with sample data
 */
const updateSampleData = async (req, res) => {
  try {
    console.log('🔄 Updating assets with sample data...');

    // Update first 20 assets with sample data
    const updateResult = await db.execute(sql`
      UPDATE assets
      SET
        exposure_score = CASE WHEN exposure_score IS NULL THEN 150 + (id % 500) ELSE exposure_score END,
        acr_score = CASE WHEN acr_score IS NULL THEN (2.0 + (id % 8))::decimal(3,1) ELSE acr_score END,
        criticality_rating = CASE
          WHEN criticality_rating IS NULL THEN
            CASE (id % 4)
              WHEN 0 THEN 'low'
              WHEN 1 THEN 'medium'
              WHEN 2 THEN 'high'
              ELSE 'critical'
            END
          ELSE criticality_rating
        END,
        last_seen = CASE WHEN last_seen IS NULL THEN NOW() - INTERVAL '1 day' * (id % 30) ELSE last_seen END,
        has_agent = CASE WHEN has_agent IS NULL THEN (id % 3 != 0) ELSE has_agent END,
        source = CASE WHEN source IS NULL THEN 'tenable' ELSE source END
      WHERE id <= 20
    `);

    // Insert network data for first 10 assets
    await db.execute(sql`
      INSERT INTO asset_network (asset_uuid, fqdn, ipv4_address, mac_address, network_type, is_primary)
      SELECT
        asset_uuid,
        COALESCE(hostname, 'host-' || id) || '.corp.local' as fqdn,
        ('192.168.1.' || (100 + (id % 150)))::inet as ipv4_address,
        '00:11:22:33:44:' || LPAD((50 + id % 200)::text, 2, '0') as mac_address,
        'ethernet' as network_type,
        true as is_primary
      FROM assets
      WHERE id <= 10
      AND asset_uuid NOT IN (SELECT COALESCE(asset_uuid, '00000000-0000-0000-0000-000000000000') FROM asset_network)
      ON CONFLICT (asset_uuid) DO NOTHING
    `);

    // Insert system data for first 10 assets
    await db.execute(sql`
      INSERT INTO asset_systems (asset_uuid, operating_system, system_type, is_primary)
      SELECT
        asset_uuid,
        CASE (id % 4)
          WHEN 0 THEN 'Windows Server 2019'
          WHEN 1 THEN 'Ubuntu 20.04 LTS'
          WHEN 2 THEN 'CentOS 7'
          ELSE 'Windows 10 Enterprise'
        END as operating_system,
        CASE (id % 3)
          WHEN 0 THEN 'server'
          WHEN 1 THEN 'workstation'
          ELSE 'host'
        END as system_type,
        true as is_primary
      FROM assets
      WHERE id <= 10
      AND asset_uuid NOT IN (SELECT COALESCE(asset_uuid, '00000000-0000-0000-0000-000000000000') FROM asset_systems)
      ON CONFLICT (asset_uuid) DO NOTHING
    `);

    // Get updated count
    const [{ count: totalCount }] = await db.select({ count: count() })
      .from(assets);

    res.json({
      success: true,
      message: 'Sample data updated successfully',
      data: {
        totalAssets: totalCount,
        updatedAssets: 20,
        networkRecords: 10,
        systemRecords: 10
      }
    });
  } catch (error) {
    console.error('Error updating sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update sample data',
      error: error.message
    });
  }
};

/**
 * Check system_id associations
 */
const checkSystemIds = async (req, res) => {
  try {
    // Get total asset count
    const [{ count: totalAssets }] = await db.select({ count: count() }).from(assets);

    // Count assets with system_id
    const [{ count: assetsWithSystemId }] = await db.select({ count: count() })
      .from(assets)
      .where(sql`system_id IS NOT NULL`);

    // Count assets without system_id
    const [{ count: assetsWithoutSystemId }] = await db.select({ count: count() })
      .from(assets)
      .where(sql`system_id IS NULL`);

    // Get sample assets with their system_id values
    const sampleAssets = await db.select({
      id: assets.id,
      hostname: assets.hostname,
      systemId: assets.systemId,
      assetUuid: assets.assetUuid
    }).from(assets).limit(10);

    res.json({
      success: true,
      data: {
        totalAssets,
        assetsWithSystemId,
        assetsWithoutSystemId,
        percentageWithSystemId: ((assetsWithSystemId / totalAssets) * 100).toFixed(1),
        sampleAssets: sampleAssets.map(asset => ({
          hostname: asset.hostname || 'No hostname',
          systemId: asset.systemId || null,
          assetUuid: asset.assetUuid.substring(0, 8) + '...'
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check system IDs',
      error: error.message
    });
  }
};

/**
 * Create systems and associate with assets
 */
const createSystemAssociations = async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const { systems } = require('../../db/schema');

    // Sample systems data
    const sampleSystems = [
      {
        systemId: 'SYS-001',
        name: 'Corporate Network Infrastructure',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Infrastructure',
        responsibleOrganization: 'IT Department',
        systemOwner: 'John Smith',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'high'
      },
      {
        systemId: 'SYS-002',
        name: 'Web Application Platform',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Application',
        responsibleOrganization: 'Development Team',
        systemOwner: 'Sarah Wilson',
        confidentialityImpact: 'high',
        integrityImpact: 'high',
        availabilityImpact: 'moderate'
      }
    ];

    let systemsCreated = 0;
    let systemsSkipped = 0;

    // Insert systems
    for (const system of sampleSystems) {
      try {
        await db.insert(systems).values(system);
        systemsCreated++;
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          systemsSkipped++;
        } else {
          throw error;
        }
      }
    }

    // Update assets with system associations
    await db.execute(sql`
      UPDATE assets
      SET system_id = CASE
        WHEN hostname ILIKE '%server%' OR hostname ILIKE '%srv%' THEN 'SYS-001'
        WHEN hostname ILIKE '%web%' OR hostname ILIKE '%app%' THEN 'SYS-002'
        ELSE 'SYS-001'
      END
      WHERE system_id IS NULL
    `);

    // Get updated counts
    const [{ count: totalAssets }] = await db.select({ count: count() }).from(assets);
    const [{ count: assetsWithSystemId }] = await db.select({ count: count() })
      .from(assets)
      .where(sql`system_id IS NOT NULL`);

    res.json({
      success: true,
      message: 'Systems created and assets associated successfully',
      data: {
        systemsCreated,
        systemsSkipped,
        totalAssets,
        assetsWithSystemId,
        percentageWithSystemId: ((assetsWithSystemId / totalAssets) * 100).toFixed(1)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create system associations',
      error: error.message
    });
  }
};

/**
 * Check systems and their asset associations
 */
const checkSystemsAndAssets = async (req, res) => {
  try {
    const { systems } = require('../../db/schema');

    // Get all systems
    const allSystems = await db.select().from(systems);

    // Get asset counts per system
    const systemAssetCounts = await Promise.all(
      allSystems.map(async (system) => {
        const [{ count: assetCount }] = await db.select({ count: count() })
          .from(assets)
          .where(eq(assets.systemId, system.systemId));

        return {
          systemId: system.systemId,
          systemName: system.name,
          systemType: system.systemType,
          status: system.status,
          assetCount: parseInt(assetCount)
        };
      })
    );

    // Get total asset count
    const [{ count: totalAssets }] = await db.select({ count: count() }).from(assets);

    // Get assets without system association
    const [{ count: assetsWithoutSystem }] = await db.select({ count: count() })
      .from(assets)
      .where(sql`system_id IS NULL`);

    res.json({
      success: true,
      data: {
        totalSystems: allSystems.length,
        totalAssets: parseInt(totalAssets),
        assetsWithoutSystem: parseInt(assetsWithoutSystem),
        systemBreakdown: systemAssetCounts,
        summary: {
          systemsWithAssets: systemAssetCounts.filter(s => s.assetCount > 0).length,
          systemsWithoutAssets: systemAssetCounts.filter(s => s.assetCount === 0).length,
          averageAssetsPerSystem: systemAssetCounts.length > 0 ?
            (parseInt(totalAssets) / systemAssetCounts.length).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check systems and assets',
      error: error.message
    });
  }
};

/**
 * Debug endpoint to show all systems
 */
const debugSystems = async (req, res) => {
  try {
    const { systems } = require('../../db/schema');

    // Get all systems
    const allSystems = await db.select().from(systems);

    res.json({
      success: true,
      message: `Found ${allSystems.length} systems in database`,
      data: {
        totalSystems: allSystems.length,
        systems: allSystems.map(system => ({
          systemId: system.systemId,
          name: system.name,
          systemType: system.systemType,
          status: system.status,
          responsibleOrganization: system.responsibleOrganization,
          systemOwner: system.systemOwner,
          confidentialityImpact: system.confidentialityImpact,
          integrityImpact: system.integrityImpact,
          availabilityImpact: system.availabilityImpact,
          createdAt: system.createdAt,
          updatedAt: system.updatedAt
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch systems',
      error: error.message
    });
  }
};

module.exports = {
  getStatus,
  syncAssets,
  syncVulnerabilities,
  syncAll,
  getAssets,
  getVulnerabilities,
  getAssetDetails,
  getAssetSystems,
  getAssetNetwork,
  getDashboardStats,
  debugAssets,
  updateSampleData,
  checkSystemIds,
  createSystemAssociations,
  checkSystemsAndAssets,
  debugSystems
};
