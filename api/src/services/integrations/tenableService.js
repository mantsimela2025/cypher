const axios = require('axios');
const { db } = require('../../db');
const {
  assets,
  assetNetwork,
  assetTags,
  assetVulnerabilities,
  vulnerabilities,
  vulnerabilityCves,
  vulnerabilityReferences,
  vulnerabilityRiskScores
} = require('../../db/schema');
const { eq, and } = require('drizzle-orm');

/**
 * Tenable API Integration Service
 * Mimics Tenable.io and Tenable.sc API functionality
 */
class TenableService {
  constructor() {
    this.baseUrl = process.env.TENABLE_BASE_URL || 'https://cloud.tenable.com';
    this.accessKey = process.env.TENABLE_ACCESS_KEY;
    this.secretKey = process.env.TENABLE_SECRET_KEY;
    this.apiVersion = 'v1';
    this.rateLimitDelay = 1000; // 1 second between requests
    this.currentBatchId = null;
  }

  /**
   * Initialize Tenable API client
   */
  async initialize() {
    // Generate batch ID for this sync session
    this.currentBatchId = this.generateBatchId();

    if (!this.accessKey || !this.secretKey) {
      console.warn('Tenable API credentials not configured. Using mock data.');
      this.useMockData = true;
      return;
    }

    try {
      // Test API connection
      await this.testConnection();
      console.log('✅ Tenable API connection established');
    } catch (error) {
      console.error('❌ Tenable API connection failed:', error.message);
      this.useMockData = true;
    }
  }

  /**
   * Generate unique batch ID for tracking sync operations
   */
  generateBatchId() {
    // Generate a proper UUID v4 for batch_id
    const { randomUUID } = require('crypto');
    return randomUUID();
  }

  /**
   * Test API connection
   */
  async testConnection() {
    const response = await this.makeRequest('/session', 'GET');
    return response.data;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    if (this.useMockData) {
      return this.getMockResponse(endpoint, method);
    }

    // For mock server (localhost:5001), don't use API version prefix
    const isMockServer = this.baseUrl.includes('localhost:5001');
    const apiPath = isMockServer ? endpoint : `/${this.apiVersion}${endpoint}`;

    const config = {
      method,
      url: `${this.baseUrl}${apiPath}`,
      headers: {
        'X-ApiKeys': `accessKey=${this.accessKey}; secretKey=${this.secretKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

    return await axios(config);
  }

  /**
   * Get mock response for development/testing
   */
  getMockResponse(endpoint, method) {
    const mockData = {
      '/vulnerabilities': {
        vulnerabilities: [
          {
            id: 'vuln-001',
            plugin_id: 19506,
            plugin_name: 'Nessus SYN scanner',
            severity: 'high',
            cvss_base_score: 7.5,
            cvss_vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H',
            description: 'Critical vulnerability in web server',
            solution: 'Update to latest version',
            first_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            last_seen: new Date(),
            state: 'open',
            asset: {
              id: 'asset-001',
              hostname: 'web-server-01',
              ipv4: '192.168.1.100'
            }
          },
          {
            id: 'vuln-002',
            plugin_id: 20007,
            plugin_name: 'SSL Certificate Expiry',
            severity: 'medium',
            cvss_base_score: 5.3,
            description: 'SSL certificate expires soon',
            solution: 'Renew SSL certificate',
            first_seen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            last_seen: new Date(),
            state: 'open',
            asset: {
              id: 'asset-002',
              hostname: 'api-server-01',
              ipv4: '192.168.1.101'
            }
          }
        ],
        pagination: {
          total: 2,
          limit: 50,
          offset: 0
        }
      },
      '/assets': {
        assets: [
          {
            id: 'asset-001',
            hostname: 'web-server-01',
            ipv4: ['192.168.1.100'],
            operating_system: 'Ubuntu 20.04',
            last_seen: new Date(),
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            updated_at: new Date(),
            sources: ['NESSUS_AGENT'],
            tags: ['production', 'web-server'],
            network_interfaces: [
              {
                name: 'eth0',
                ipv4: '192.168.1.100',
                mac_address: '00:50:56:c0:00:01'
              }
            ]
          }
        ]
      },
      '/scans': {
        scans: [
          {
            id: 'scan-001',
            name: 'Weekly Infrastructure Scan',
            type: 'remote',
            status: 'completed',
            creation_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            last_modification_date: new Date(),
            targets: '192.168.1.0/24',
            policy: {
              id: 'policy-001',
              name: 'Advanced Scan'
            }
          }
        ]
      }
    };

    return { data: mockData[endpoint] || {} };
  }

  /**
   * Get vulnerabilities with filtering and pagination
   */
  async getVulnerabilities(filters = {}) {
    const params = new URLSearchParams();

    if (filters.severity) params.append('severity', filters.severity);
    if (filters.state) params.append('state', filters.state);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.last_seen) params.append('last_seen', filters.last_seen);

    // Use /vulnerabilities endpoint for both mock server and real API
    const endpoint = `/vulnerabilities?${params.toString()}`;

    const response = await this.makeRequest(endpoint);

    return response.data;
  }

  /**
   * Get assets with filtering
   */
  async getAssets(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.hostname) params.append('hostname', filters.hostname);
    if (filters.ipv4) params.append('ipv4', filters.ipv4);
    if (filters.operating_system) params.append('operating_system', filters.operating_system);
    if (filters.last_seen) params.append('last_seen', filters.last_seen);

    const endpoint = `/assets?${params.toString()}`;
    const response = await this.makeRequest(endpoint);
    
    return response.data;
  }

  /**
   * Get scans
   */
  async getScans(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.name) params.append('name', filters.name);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);

    const endpoint = `/scans?${params.toString()}`;
    const response = await this.makeRequest(endpoint);
    
    return response.data;
  }

  /**
   * Launch a scan
   */
  async launchScan(scanId) {
    const response = await this.makeRequest(`/scans/${scanId}/launch`, 'POST');
    return response.data;
  }

  /**
   * Get scan results
   */
  async getScanResults(scanId) {
    const response = await this.makeRequest(`/scans/${scanId}`);
    return response.data;
  }

  /**
   * Export scan results
   */
  async exportScan(scanId, format = 'nessus') {
    const exportData = {
      format: format,
      chapters: 'vuln_hosts_summary;vuln_by_host;compliance_exec;remediations'
    };

    const response = await this.makeRequest(`/scans/${scanId}/export`, 'POST', exportData);
    return response.data;
  }

  /**
   * Get vulnerability details
   */
  async getVulnerabilityDetails(vulnerabilityId) {
    const response = await this.makeRequest(`/vulnerabilities/${vulnerabilityId}`);
    return response.data;
  }

  /**
   * Sync assets to local database
   */
  async syncAssets(filters = {}) {
    try {
      console.log('🔄 Syncing assets from Tenable...');

      const assetData = await this.getAssets(filters);
      const syncResults = {
        total: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      for (const asset of assetData.assets || []) {
        try {
          syncResults.total++;

          // Check if asset already exists by asset_uuid
          const [existing] = await db.select()
            .from(assets)
            .where(eq(assets.assetUuid, asset.id));

          const assetRecord = {
            assetUuid: asset.id,
            hostname: Array.isArray(asset.hostname) ? asset.hostname[0] : asset.hostname,
            netbiosName: asset.netbios_name,
            hasAgent: asset.has_agent || false,
            hasPluginResults: true,
            firstSeen: asset.first_seen ? new Date(asset.first_seen) : null,
            lastSeen: asset.last_seen ? new Date(asset.last_seen) : null,
            exposureScore: asset.exposure_score,
            acrScore: asset.acr_score,
            criticalityRating: asset.criticality_rating,
            source: 'tenable',
            batchId: this.currentBatchId,
            rawJson: asset,
            updatedAt: new Date()
          };

          let assetId;
          if (existing) {
            await db.update(assets)
              .set(assetRecord)
              .where(eq(assets.id, existing.id));
            assetId = existing.id;
            syncResults.updated++;
          } else {
            const [newAsset] = await db.insert(assets).values({
              ...assetRecord,
              createdAt: new Date()
            }).returning({ id: assets.id });
            assetId = newAsset.id;
            syncResults.created++;
          }

          // Sync asset network information
          await this.syncAssetNetwork(asset, assetId);

          // Sync asset tags
          await this.syncAssetTags(asset, assetId);

        } catch (error) {
          console.error(`❌ Error syncing asset ${asset.id}:`, error.message);
          syncResults.errors.push({
            assetId: asset.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Tenable asset sync completed: ${syncResults.created} created, ${syncResults.updated} updated`);
      return syncResults;

    } catch (error) {
      console.error('❌ Tenable asset sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync asset network information
   */
  async syncAssetNetwork(asset, assetId) {
    try {
      // Clear existing network data for this asset
      await db.delete(assetNetwork).where(eq(assetNetwork.assetUuid, asset.id));

      // Insert network information
      const networkData = [];

      if (asset.fqdn && asset.fqdn.length > 0) {
        networkData.push({
          assetUuid: asset.id,
          fqdn: asset.fqdn[0],
          ipv4Address: asset.ipv4 && asset.ipv4.length > 0 ? asset.ipv4[0] : null,
          macAddress: asset.mac_address && asset.mac_address.length > 0 ? asset.mac_address[0] : null,
          networkType: 'primary',
          isPrimary: true,
          createdAt: new Date()
        });
      }

      // Add additional IP addresses as separate records
      if (asset.ipv4 && asset.ipv4.length > 1) {
        for (let i = 1; i < asset.ipv4.length; i++) {
          networkData.push({
            assetUuid: asset.id,
            ipv4Address: asset.ipv4[i],
            networkType: 'secondary',
            isPrimary: false,
            createdAt: new Date()
          });
        }
      }

      if (networkData.length > 0) {
        await db.insert(assetNetwork).values(networkData);
      }

    } catch (error) {
      console.error(`Error syncing network data for asset ${asset.id}:`, error);
    }
  }

  /**
   * Sync asset tags
   */
  async syncAssetTags(asset, assetId) {
    try {
      // Clear existing tags for this asset
      await db.delete(assetTags).where(eq(assetTags.assetUuid, asset.id));

      const tagData = [];

      // Add system type as tag
      if (asset.system_type && asset.system_type.length > 0) {
        tagData.push({
          assetUuid: asset.id,
          tagKey: 'system_type',
          tagValue: asset.system_type[0],
          createdAt: new Date()
        });
      }

      // Add operating system as tag
      if (asset.operating_system && asset.operating_system.length > 0) {
        tagData.push({
          assetUuid: asset.id,
          tagKey: 'operating_system',
          tagValue: asset.operating_system[0],
          createdAt: new Date()
        });
      }

      // Add AWS metadata as tags if present
      if (asset.aws_ec2_instance_id) {
        tagData.push({
          assetUuid: asset.id,
          tagKey: 'aws_instance_id',
          tagValue: asset.aws_ec2_instance_id,
          createdAt: new Date()
        });
      }

      if (asset.aws_region) {
        tagData.push({
          assetUuid: asset.id,
          tagKey: 'aws_region',
          tagValue: asset.aws_region,
          createdAt: new Date()
        });
      }

      if (tagData.length > 0) {
        await db.insert(assetTags).values(tagData);
      }

    } catch (error) {
      console.error(`Error syncing tags for asset ${asset.id}:`, error);
    }
  }

  /**
   * Sync vulnerabilities to local database
   */
  async syncVulnerabilities(filters = {}) {
    try {
      console.log('🔄 Syncing vulnerabilities from Tenable...');

      const vulnerabilityData = await this.getVulnerabilities(filters);
      const syncResults = {
        total: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      // Handle different response formats from mock server vs real API
      const vulnList = vulnerabilityData.vulnerabilities || [];
      console.log(`📊 Processing ${vulnList.length} vulnerabilities from API response`);

      for (const vuln of vulnList) {
        try {
          syncResults.total++;

          // Find asset by UUID
          let assetRecord = null;
          if (vuln.asset?.id) {
            const [existingAsset] = await db.select()
              .from(assets)
              .where(eq(assets.assetUuid, vuln.asset.id));

            if (!existingAsset) {
              // Create minimal asset record if it doesn't exist
              const [newAsset] = await db.insert(assets).values({
                assetUuid: vuln.asset.id,
                hostname: vuln.asset.hostname,
                source: 'tenable',
                batchId: this.currentBatchId,
                createdAt: new Date(),
                updatedAt: new Date()
              }).returning();
              assetRecord = newAsset;
            } else {
              assetRecord = existingAsset;
            }
          }

          // Check if vulnerability already exists (by plugin_id and asset)
          const [existing] = await db.select()
            .from(vulnerabilities)
            .where(and(
              eq(vulnerabilities.pluginId, vuln.plugin.id),
              eq(vulnerabilities.assetUuid, vuln.asset?.id || null)
            ));

          const vulnerabilityRecord = {
            assetUuid: vuln.asset?.id || null,
            pluginId: vuln.plugin.id,
            pluginName: vuln.plugin.name,
            pluginFamily: vuln.plugin.family,
            severity: vuln.severity_id,
            severityName: vuln.severity,
            cvssBaseScore: vuln.cvss_base_score,
            cvss3BaseScore: vuln.cvss3_base_score,
            description: vuln.plugin.description,
            solution: vuln.plugin.solution,
            riskFactor: vuln.plugin.risk_factor,
            firstFound: vuln.first_found ? new Date(vuln.first_found) : null,
            lastFound: vuln.last_found ? new Date(vuln.last_found) : null,
            state: vuln.state || 'Open',
            source: 'tenable',
            batchId: this.currentBatchId,
            rawJson: vuln,
            updatedAt: new Date()
          };

          let vulnerabilityId;
          if (existing) {
            await db.update(vulnerabilities)
              .set(vulnerabilityRecord)
              .where(eq(vulnerabilities.id, existing.id));
            vulnerabilityId = existing.id;
            syncResults.updated++;
          } else {
            const [newVuln] = await db.insert(vulnerabilities).values({
              ...vulnerabilityRecord,
              createdAt: new Date()
            }).returning({ id: vulnerabilities.id });
            vulnerabilityId = newVuln.id;
            syncResults.created++;
          }

          // Create asset-vulnerability relationship
          if (assetRecord && vulnerabilityId) {
            await this.syncAssetVulnerabilityRelationship(assetRecord, vulnerabilityId, vuln);
          }

          // Sync vulnerability references and risk scores
          await this.syncVulnerabilityReferences(vulnerabilityId, vuln);
          await this.syncVulnerabilityRiskScores(vulnerabilityId, vuln);

        } catch (error) {
          syncResults.errors.push({
            vulnerabilityId: vuln.plugin?.id,
            assetId: vuln.asset?.id,
            error: error.message
          });
        }
      }

      console.log(`✅ Tenable vulnerability sync completed: ${syncResults.created} created, ${syncResults.updated} updated`);
      return syncResults;

    } catch (error) {
      console.error('❌ Tenable vulnerability sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync asset-vulnerability relationship
   */
  async syncAssetVulnerabilityRelationship(assetRecord, vulnerabilityId, vuln) {
    try {
      // Check if relationship already exists
      const [existing] = await db.select()
        .from(assetVulnerabilities)
        .where(and(
          eq(assetVulnerabilities.assetId, assetRecord.id),
          eq(assetVulnerabilities.vulnerabilityId, vulnerabilityId)
        ));

      // Map Tenable states to database enum values
      // Temporarily use 'mitigated' instead of 'resolved' due to database enum issue
      const mapDetectionStatus = (state) => {
        switch (state) {
          case 'fixed': return 'mitigated';  // Use 'mitigated' instead of 'resolved'
          case 'reopened': return 'detected';
          case 'open': return 'detected';
          default: return 'detected';
        }
      };

      const relationshipData = {
        assetId: assetRecord.id,
        vulnerabilityId: vulnerabilityId,
        detectionStatus: mapDetectionStatus(vuln.state),
        firstDetected: vuln.first_found ? new Date(vuln.first_found) : new Date(),
        lastDetected: vuln.last_found ? new Date(vuln.last_found) : new Date(),
        detectionMethod: 'tenable_scan',
        scanId: vuln.scan?.uuid,
        evidence: {
          output: vuln.output,
          port: vuln.port,
          protocol: vuln.protocol,
          scan_info: vuln.scan
        },
        riskScore: vuln.vpr_score,
        updatedAt: new Date()
      };

      if (existing) {
        await db.update(assetVulnerabilities)
          .set(relationshipData)
          .where(eq(assetVulnerabilities.id, existing.id));
      } else {
        await db.insert(assetVulnerabilities).values({
          ...relationshipData,
          createdAt: new Date()
        });
      }

    } catch (error) {
      console.error(`Error syncing asset-vulnerability relationship:`, error);
    }
  }

  /**
   * Sync vulnerability references
   */
  async syncVulnerabilityReferences(vulnerabilityId, vuln) {
    try {
      // Clear existing references
      await db.delete(vulnerabilityReferences)
        .where(eq(vulnerabilityReferences.vulnerabilityId, vulnerabilityId));

      const references = [];

      // Add plugin references if available
      if (vuln.plugin?.references) {
        for (const ref of vuln.plugin.references) {
          references.push({
            vulnerabilityId: vulnerabilityId,
            referenceUrl: ref.url || ref,
            referenceType: ref.type || 'external',
            createdAt: new Date()
          });
        }
      }

      if (references.length > 0) {
        await db.insert(vulnerabilityReferences).values(references);
      }

    } catch (error) {
      console.error(`Error syncing vulnerability references:`, error);
    }
  }

  /**
   * Sync vulnerability risk scores
   */
  async syncVulnerabilityRiskScores(vulnerabilityId, vuln) {
    try {
      // Clear existing risk scores
      await db.delete(vulnerabilityRiskScores)
        .where(eq(vulnerabilityRiskScores.vulnerabilityId, vulnerabilityId));

      const riskScores = [];

      // Add CVSS score
      if (vuln.cvss_base_score) {
        riskScores.push({
          vulnerabilityId: vulnerabilityId,
          modelId: 1, // CVSS model
          score: vuln.cvss_base_score.toString(),
          confidence: 'high',
          factors: {
            vector: vuln.cvss_vector,
            temporal_score: vuln.cvss_temporal_score,
            environmental_score: vuln.cvss_environmental_score
          },
          lastCalculated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Add VPR score
      if (vuln.vpr_score) {
        riskScores.push({
          vulnerabilityId: vulnerabilityId,
          modelId: 2, // VPR model
          score: vuln.vpr_score.toString(),
          confidence: 'high',
          factors: {
            severity: vuln.severity,
            age: vuln.plugin?.modification_date,
            exploit_available: vuln.exploit_available
          },
          lastCalculated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (riskScores.length > 0) {
        await db.insert(vulnerabilityRiskScores).values(riskScores);
      }

    } catch (error) {
      console.error(`Error syncing vulnerability risk scores:`, error);
    }
  }

  /**
   * Get sync status and health
   */
  async getSyncStatus() {
    return {
      service: 'tenable',
      status: this.useMockData ? 'mock' : 'connected',
      lastSync: new Date(),
      apiVersion: this.apiVersion,
      rateLimitRemaining: 1000,
      health: 'healthy'
    };
  }
}

// Create and export singleton instance
const tenableService = new TenableService();

module.exports = tenableService;
