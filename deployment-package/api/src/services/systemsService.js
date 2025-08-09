const { db } = require('../db');
const { 
  systems, 
  systemImpactLevels, 
  assets, 
  systemAssets, 
  vulnerabilities, 
  assetVulnerabilities,
  controls,
  poams
} = require('../db/schema');
const { eq, and, or, like, desc, asc, count, sql } = require('drizzle-orm');
const xactaService = require('./integrations/xactaService');

/**
 * Systems Service
 * Business logic for systems management
 */

class SystemsService {
  constructor() {
    this.xactaService = xactaService;
  }

  /**
   * Get all systems with filtering, pagination, and search
   */
  async getAllSystems(filters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        status,
        systemType,
        riskLevel,
        source,
        sortBy = 'name',
        sortOrder = 'asc'
      } = filters;

      // Build the base query
      let query = db.select().from(systems);
      
      // Build where conditions
      const conditions = [];
      
      if (status) {
        conditions.push(eq(systems.status, status));
      }
      
      if (systemType) {
        conditions.push(eq(systems.systemType, systemType));
      }
      
      if (source) {
        conditions.push(eq(systems.source, source));
      }
      
      if (search) {
        conditions.push(
          or(
            like(systems.name, `%${search}%`),
            like(systems.systemId, `%${search}%`),
            like(systems.responsibleOrganization, `%${search}%`)
          )
        );
      }
      
      // Apply conditions if any
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
      
      // Apply sorting
      const sortColumn = systems[sortBy] || systems.name;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));
      
      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);
      
      // Execute query
      const systemsResult = await query;
      
      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(systems);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: total }] = await countQuery;

      return {
        systems: systemsResult,
        page,
        limit,
        total
      };

    } catch (error) {
      console.error('Error in getAllSystems:', error);
      throw error;
    }
  }

  /**
   * Get systems statistics for dashboard cards
   */
  async getSystemsStats() {
    try {
      // Return mock stats for now
      return {
        totalSystems: 5,
        activeSystems: 4,
        criticalAlerts: 2,
        pendingUpdates: 3,
        compliancePercentage: 85,
        growthRate: 12.5
      };
    } catch (error) {
      console.error('Error in getSystemsStats:', error);
      throw error;
    }
  }

  /**
   * Calculate risk level based on impact levels
   */
  calculateRiskLevel(confidentiality, integrity, availability) {
    const impacts = [confidentiality, integrity, availability].filter(Boolean);
    
    if (impacts.includes('high')) return 'high';
    if (impacts.includes('moderate')) return 'medium';
    if (impacts.includes('low')) return 'low';
    
    return 'unknown';
  }

  /**
   * Get system by ID with related data
   */
  async getSystemById(id, include = '') {
    try {
      // Get basic system info
      const [system] = await db
        .select()
        .from(systems)
        .where(eq(systems.id, parseInt(id)));

      if (!system) {
        return null;
      }

      // Get impact levels
      const impactLevels = await db
        .select()
        .from(systemImpactLevels)
        .where(eq(systemImpactLevels.systemId, system.systemId));

      const result = {
        ...system,
        impactLevels: impactLevels[0] || null,
        riskLevel: this.calculateRiskLevel(
          system.confidentialityImpact,
          system.integrityImpact,
          system.availabilityImpact
        )
      };

      // Include additional data based on request (simplified for now)
      // const includeOptions = include.split(',').map(opt => opt.trim());
      // TODO: Re-enable when schema relationships are fixed

      return result;
    } catch (error) {
      console.error('Error in getSystemById:', error);
      throw error;
    }
  }

  /**
   * Get assets associated with a system
   */
  async getSystemAssets(systemId, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const offset = (page - 1) * limit;

      // For now, return mock data since the schema relationships are complex
      const mockAssets = [
        {
          asset_uuid: 'asset-001',
          asset_name: 'Web Server 01',
          asset_type: 'Server',
          hostname: 'web-server-01.domain.com',
          ipv4_address: '192.168.1.100',
          ipv6_address: null,
          status: 'active',
          risk_level: 'High',
          hasAgent: true,
          firstSeen: new Date('2024-01-01'),
          lastSeen: new Date('2024-01-30'),
          exposureScore: 850,
          acrScore: 7.5,
          criticalityRating: 'High',
          source: 'Tenable'
        },
        {
          asset_uuid: 'asset-002',
          asset_name: 'Database Server',
          asset_type: 'Database',
          hostname: 'db-server-01.domain.com',
          ipv4_address: '192.168.1.101',
          ipv6_address: null,
          status: 'active',
          risk_level: 'Critical',
          hasAgent: true,
          firstSeen: new Date('2024-01-02'),
          lastSeen: new Date('2024-01-30'),
          exposureScore: 950,
          acrScore: 9.2,
          criticalityRating: 'Critical',
          source: 'Tenable'
        },
        {
          asset_uuid: 'asset-003',
          asset_name: 'Application Server',
          asset_type: 'Server',
          hostname: 'app-server-01.domain.com',
          ipv4_address: '192.168.1.102',
          ipv6_address: null,
          status: 'active',
          risk_level: 'Medium',
          hasAgent: false,
          firstSeen: new Date('2024-01-03'),
          lastSeen: new Date('2024-01-29'),
          exposureScore: 650,
          acrScore: 5.8,
          criticalityRating: 'Medium',
          source: 'Network Scan'
        }
      ];

      return {
        assets: mockAssets,
        page,
        limit,
        total: mockAssets.length
      };
    } catch (error) {
      console.error('Error in getSystemAssets:', error);
      throw error;
    }
  }

  /**
   * Get vulnerabilities for a system
   */
  async getSystemVulnerabilities(systemId, options = {}) {
    try {
      const { page = 1, limit = 50, severity } = options;
      const offset = (page - 1) * limit;

      // For now, return mock data since the schema relationships are complex
      const mockVulnerabilities = [
        {
          id: 1,
          pluginId: 12345,
          pluginName: 'Critical SQL Injection Vulnerability',
          severity: 4,
          severityName: 'Critical',
          cvssBaseScore: 9.8,
          cvss3BaseScore: 9.8,
          description: 'A critical SQL injection vulnerability that allows remote code execution',
          solution: 'Apply the latest security patches and update to version 2.1.4 or higher',
          firstFound: new Date('2024-01-01'),
          lastFound: new Date('2024-01-15'),
          state: 'Open',
          riskFactor: 'Critical',
          cve_id: 'CVE-2024-1234'
        },
        {
          id: 2,
          pluginId: 12346,
          pluginName: 'Cross-Site Scripting (XSS) Vulnerability',
          severity: 3,
          severityName: 'High',
          cvssBaseScore: 7.5,
          cvss3BaseScore: 8.2,
          description: 'A stored XSS vulnerability in the user input validation',
          solution: 'Implement proper input sanitization and output encoding',
          firstFound: new Date('2024-01-05'),
          lastFound: new Date('2024-01-20'),
          state: 'Open',
          riskFactor: 'High',
          cve_id: 'CVE-2024-5678'
        },
        {
          id: 3,
          pluginId: 12347,
          pluginName: 'Outdated SSL/TLS Configuration',
          severity: 2,
          severityName: 'Medium',
          cvssBaseScore: 5.3,
          cvss3BaseScore: 5.9,
          description: 'The server is using outdated SSL/TLS protocols',
          solution: 'Update SSL/TLS configuration to use TLS 1.2 or higher',
          firstFound: new Date('2024-01-10'),
          lastFound: new Date('2024-01-25'),
          state: 'Open',
          riskFactor: 'Medium',
          cve_id: null
        }
      ];

      return {
        vulnerabilities: mockVulnerabilities,
        page,
        limit,
        total: mockVulnerabilities.length
      };
    } catch (error) {
      console.error('Error in getSystemVulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Get count of assets for a system
   */
  async getSystemAssetsCount(systemId) {
    try {
      // Count assets associated with the system through system_assets table
      const result = await db
        .select({ count: count() })
        .from(systemAssets)
        .where(eq(systemAssets.systemId, systemId));
      
      return {
        count: result[0]?.count || 0
      };
    } catch (error) {
      console.error('Error in getSystemAssetsCount:', error);
      throw error;
    }
  }

  /**
   * Get count of vulnerabilities for a system
   */
  async getSystemVulnerabilitiesCount(systemId) {
    try {
      // Count vulnerabilities for assets belonging to this system
      // Join system_assets -> assets -> vulnerabilities
      const result = await db
        .select({ count: count() })
        .from(vulnerabilities)
        .innerJoin(assets, eq(vulnerabilities.assetUuid, assets.assetUuid))
        .innerJoin(systemAssets, eq(assets.assetUuid, systemAssets.assetUuid))
        .where(eq(systemAssets.systemId, systemId));
      
      return {
        count: result[0]?.count || 0
      };
    } catch (error) {
      console.error('Error in getSystemVulnerabilitiesCount:', error);
      throw error;
    }
  }

  /**
   * Get compliance status for a system
   */
  async getSystemCompliance(systemId) {
    try {
      // Return mock compliance data for now
      return {
        overall_score: 85,
        controls_passed: 42,
        total_controls: 50,
        frameworks: [
          {
            name: 'NIST 800-53',
            score: 88,
            last_assessment: new Date('2024-01-15')
          },
          {
            name: 'FedRAMP',
            score: 82,
            last_assessment: new Date('2024-01-10')
          }
        ]
      };
    } catch (error) {
      console.error('Error in getSystemCompliance:', error);
      throw error;
    }
  }

  /**
   * Get analytics data for a system
   */
  async getSystemAnalytics(systemId, timeRange = '30d') {
    try {
      // Calculate date range
      const days = parseInt(timeRange.replace('d', ''));
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get vulnerability trends
      const vulnerabilityTrends = await db
        .select({
          date: sql`DATE(${assetVulnerabilities.firstFound})`.as('date'),
          count: count()
        })
        .from(assetVulnerabilities)
        .innerJoin(systemAssets, eq(assetVulnerabilities.assetUuid, systemAssets.assetUuid))
        .where(
          and(
            eq(systemAssets.systemId, systemId),
            sql`${assetVulnerabilities.firstFound} >= ${startDate}`
          )
        )
        .groupBy(sql`DATE(${assetVulnerabilities.firstFound})`)
        .orderBy(sql`DATE(${assetVulnerabilities.firstFound})`);

      // Get asset activity
      const assetActivity = await db
        .select({
          date: sql`DATE(${assets.lastSeen})`.as('date'),
          count: count()
        })
        .from(assets)
        .innerJoin(systemAssets, eq(assets.assetUuid, systemAssets.assetUuid))
        .where(
          and(
            eq(systemAssets.systemId, systemId),
            sql`${assets.lastSeen} >= ${startDate}`
          )
        )
        .groupBy(sql`DATE(${assets.lastSeen})`)
        .orderBy(sql`DATE(${assets.lastSeen})`);

      return {
        timeRange,
        vulnerabilityTrends,
        assetActivity,
        summary: {
          totalVulnerabilities: vulnerabilityTrends.reduce((sum, item) => sum + item.count, 0),
          activeAssets: assetActivity.reduce((sum, item) => sum + item.count, 0)
        }
      };
    } catch (error) {
      console.error('Error in getSystemAnalytics:', error);
      throw error;
    }
  }

  /**
   * Create new system
   */
  async createSystem(systemData) {
    try {
      const {
        systemId,
        name,
        uuid,
        status = 'active',
        authorizationBoundary,
        systemType,
        responsibleOrganization,
        systemOwner,
        informationSystemSecurityOfficer,
        authorizingOfficial,
        confidentialityImpact,
        integrityImpact,
        availabilityImpact,
        source = 'manual'
      } = systemData;

      const [newSystem] = await db
        .insert(systems)
        .values({
          systemId,
          name,
          uuid: uuid || crypto.randomUUID(),
          status,
          authorizationBoundary,
          systemType,
          responsibleOrganization,
          systemOwner,
          informationSystemSecurityOfficer,
          authorizingOfficial,
          confidentialityImpact,
          integrityImpact,
          availabilityImpact,
          source,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newSystem;
    } catch (error) {
      console.error('Error in createSystem:', error);
      throw error;
    }
  }

  /**
   * Update system
   */
  async updateSystem(id, updateData) {
    try {
      const [updatedSystem] = await db
        .update(systems)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(systems.id, parseInt(id)))
        .returning();

      return updatedSystem;
    } catch (error) {
      console.error('Error in updateSystem:', error);
      throw error;
    }
  }

  /**
   * Delete system
   */
  async deleteSystem(id) {
    try {
      const [deletedSystem] = await db
        .delete(systems)
        .where(eq(systems.id, parseInt(id)))
        .returning();

      return deletedSystem;
    } catch (error) {
      console.error('Error in deleteSystem:', error);
      throw error;
    }
  }

  /**
   * Bulk operations on systems
   */
  async bulkOperations(operation, systemIds, data) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const systemId of systemIds) {
        try {
          switch (operation) {
            case 'updateStatus':
              await db
                .update(systems)
                .set({
                  status: data.status,
                  updatedAt: new Date()
                })
                .where(eq(systems.id, parseInt(systemId)));
              break;

            case 'delete':
              await db
                .delete(systems)
                .where(eq(systems.id, parseInt(systemId)));
              break;

            case 'updateOwner':
              await db
                .update(systems)
                .set({
                  systemOwner: data.owner,
                  updatedAt: new Date()
                })
                .where(eq(systems.id, parseInt(systemId)));
              break;

            default:
              throw new Error(`Unknown operation: ${operation}`);
          }

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            systemId,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulkOperations:', error);
      throw error;
    }
  }

  /**
   * Sync systems from external sources
   */
  async syncSystems(source = 'xacta', filters = {}) {
    try {
      switch (source) {
        case 'xacta':
          return await this.xactaService.syncSystems(filters);
        default:
          throw new Error(`Unknown sync source: ${source}`);
      }
    } catch (error) {
      console.error('Error in syncSystems:', error);
      throw error;
    }
  }

  /**
   * Export systems data
   */
  async exportSystems(format = 'csv', filters = {}) {
    try {
      const { systems: systemsData } = await this.getAllSystems(filters);

      switch (format) {
        case 'csv':
          return this.exportToCSV(systemsData);
        case 'json':
          return this.exportToJSON(systemsData);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error in exportSystems:', error);
      throw error;
    }
  }

  /**
   * Export to CSV format
   */
  exportToCSV(systemsData) {
    const headers = [
      'System ID',
      'Name',
      'Status',
      'Type',
      'Owner',
      'Organization',
      'Risk Level',
      'Last Assessment',
      'Created At'
    ];

    const rows = systemsData.map(system => [
      system.systemId,
      system.name,
      system.status,
      system.systemType || '',
      system.systemOwner || '',
      system.responsibleOrganization || '',
      system.riskLevel || '',
      system.lastAssessmentDate || '',
      system.createdAt
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return {
      data: csvContent,
      contentType: 'text/csv'
    };
  }

  /**
   * Export to JSON format
   */
  exportToJSON(systemsData) {
    return {
      data: JSON.stringify(systemsData, null, 2),
      contentType: 'application/json'
    };
  }
}

module.exports = new SystemsService();
