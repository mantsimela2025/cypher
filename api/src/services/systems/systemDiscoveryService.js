const { db } = require('../../db');
const {
  systems,
  assets,
  systemAssets,
  assetNetwork,
  systemDiscoveryScans,
  systemDiscoveryResults,
  scanJobs,
  scanResults
} = require('../../db/schema');
const { eq, and, sql, desc, gte, lte, inArray } = require('drizzle-orm');
const crypto = require('crypto');

/**
 * System Discovery Service
 * Automated system discovery with network scanning and asset identification
 * across on-premises, cloud, and hybrid environments
 */
class SystemDiscoveryService {
  constructor() {
    this.isInitialized = false;
    this.discoveryMethods = new Map();
    this.scanQueue = [];
    this.activeScanners = new Map();
  }

  /**
   * Initialize system discovery service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Register discovery methods
      this.registerDiscoveryMethods();
      
      // Start background discovery processing
      this.startBackgroundDiscovery();
      
      this.isInitialized = true;
      console.log('✅ System discovery service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize system discovery service:', error);
      throw error;
    }
  }

  /**
   * Register discovery methods
   */
  registerDiscoveryMethods() {
    // Network scanning methods
    this.discoveryMethods.set('network_scan', this.performNetworkScan.bind(this));
    this.discoveryMethods.set('port_scan', this.performPortScan.bind(this));
    this.discoveryMethods.set('service_detection', this.performServiceDetection.bind(this));
    
    // Cloud discovery methods
    this.discoveryMethods.set('aws_discovery', this.performAWSDiscovery.bind(this));
    this.discoveryMethods.set('azure_discovery', this.performAzureDiscovery.bind(this));
    this.discoveryMethods.set('gcp_discovery', this.performGCPDiscovery.bind(this));
    
    // Active Directory discovery
    this.discoveryMethods.set('ad_discovery', this.performADDiscovery.bind(this));
    
    // SNMP discovery
    this.discoveryMethods.set('snmp_discovery', this.performSNMPDiscovery.bind(this));

    console.log(`🔍 Registered ${this.discoveryMethods.size} discovery methods`);
  }

  /**
   * Start background discovery processing
   */
  startBackgroundDiscovery() {
    // Process discovery queue every 30 seconds
    setInterval(async () => {
      await this.processDiscoveryQueue();
    }, 30000);

    console.log('🔄 Started background discovery processing');
  }

  /**
   * Start comprehensive system discovery
   */
  async startDiscovery(discoveryConfig) {
    try {
      const {
        name,
        description,
        methods = ['network_scan', 'service_detection'],
        targets,
        schedule,
        options = {}
      } = discoveryConfig;

      console.log(`🚀 Starting system discovery: ${name}`);

      // Create discovery scan record
      const [scan] = await db.insert(systemDiscoveryScans)
        .values({
          name,
          description,
          methods: JSON.stringify(methods),
          targets: JSON.stringify(targets),
          schedule,
          options: JSON.stringify(options),
          status: 'running',
          startedAt: new Date()
        })
        .returning();

      // Execute discovery methods
      const discoveryResults = [];
      for (const method of methods) {
        try {
          const methodFunction = this.discoveryMethods.get(method);
          if (methodFunction) {
            const result = await methodFunction(targets, options);
            discoveryResults.push({
              method,
              success: true,
              result
            });
          } else {
            console.warn(`Unknown discovery method: ${method}`);
            discoveryResults.push({
              method,
              success: false,
              error: `Unknown method: ${method}`
            });
          }
        } catch (error) {
          console.error(`Error in discovery method ${method}:`, error);
          discoveryResults.push({
            method,
            success: false,
            error: error.message
          });
        }
      }

      // Process and correlate results
      const correlatedResults = await this.correlateDiscoveryResults(discoveryResults);
      
      // Create or update systems and assets
      const processedSystems = await this.processDiscoveryResults(correlatedResults, scan.id);

      // Update scan status
      await db.update(systemDiscoveryScans)
        .set({
          status: 'completed',
          completedAt: new Date(),
          results: JSON.stringify(correlatedResults),
          systemsFound: processedSystems.length
        })
        .where(eq(systemDiscoveryScans.id, scan.id));

      console.log(`✅ Discovery completed: Found ${processedSystems.length} systems`);

      return {
        scanId: scan.id,
        systemsFound: processedSystems.length,
        methods: methods,
        results: correlatedResults,
        processedSystems
      };

    } catch (error) {
      console.error('Error in system discovery:', error);
      throw error;
    }
  }

  /**
   * Perform network scan
   */
  async performNetworkScan(targets, options = {}) {
    try {
      console.log('🌐 Performing network scan');
      
      const { timeout = 5000, threads = 10 } = options;
      const discoveredHosts = [];

      for (const target of targets) {
        // Mock network scan implementation
        // In production, this would use actual network scanning tools
        const hosts = await this.scanNetworkRange(target, { timeout, threads });
        discoveredHosts.push(...hosts);
      }

      return {
        method: 'network_scan',
        hostsFound: discoveredHosts.length,
        hosts: discoveredHosts
      };

    } catch (error) {
      console.error('Error in network scan:', error);
      throw error;
    }
  }

  /**
   * Scan network range (mock implementation)
   */
  async scanNetworkRange(target, options) {
    // Mock implementation - in production would use nmap or similar
    const mockHosts = [
      {
        ip: '192.168.1.10',
        hostname: 'server-01.domain.com',
        mac: '00:11:22:33:44:55',
        os: 'Windows Server 2019',
        status: 'up',
        ports: [22, 80, 443, 3389],
        services: ['ssh', 'http', 'https', 'rdp']
      },
      {
        ip: '192.168.1.20',
        hostname: 'db-server.domain.com',
        mac: '00:11:22:33:44:66',
        os: 'Ubuntu 20.04',
        status: 'up',
        ports: [22, 3306, 5432],
        services: ['ssh', 'mysql', 'postgresql']
      }
    ];

    return mockHosts;
  }

  /**
   * Perform port scan
   */
  async performPortScan(targets, options = {}) {
    try {
      console.log('🔌 Performing port scan');
      
      const { ports = [22, 80, 443, 3389, 3306, 5432], timeout = 3000 } = options;
      const portResults = [];

      for (const target of targets) {
        const openPorts = await this.scanPorts(target, ports, timeout);
        portResults.push({
          target,
          openPorts
        });
      }

      return {
        method: 'port_scan',
        results: portResults
      };

    } catch (error) {
      console.error('Error in port scan:', error);
      throw error;
    }
  }

  /**
   * Scan ports (mock implementation)
   */
  async scanPorts(target, ports, timeout) {
    // Mock implementation
    const openPorts = ports.filter(() => Math.random() > 0.7);
    return openPorts.map(port => ({
      port,
      state: 'open',
      service: this.getServiceForPort(port)
    }));
  }

  /**
   * Get service name for port
   */
  getServiceForPort(port) {
    const serviceMap = {
      22: 'ssh',
      80: 'http',
      443: 'https',
      3389: 'rdp',
      3306: 'mysql',
      5432: 'postgresql',
      1433: 'mssql',
      5985: 'winrm'
    };
    return serviceMap[port] || 'unknown';
  }

  /**
   * Perform service detection
   */
  async performServiceDetection(targets, options = {}) {
    try {
      console.log('🔍 Performing service detection');
      
      const services = [];
      
      for (const target of targets) {
        const detectedServices = await this.detectServices(target, options);
        services.push({
          target,
          services: detectedServices
        });
      }

      return {
        method: 'service_detection',
        results: services
      };

    } catch (error) {
      console.error('Error in service detection:', error);
      throw error;
    }
  }

  /**
   * Detect services (mock implementation)
   */
  async detectServices(target, options) {
    // Mock service detection
    const mockServices = [
      {
        name: 'Apache HTTP Server',
        version: '2.4.41',
        port: 80,
        protocol: 'tcp',
        banner: 'Apache/2.4.41 (Ubuntu)'
      },
      {
        name: 'OpenSSH',
        version: '8.2p1',
        port: 22,
        protocol: 'tcp',
        banner: 'SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5'
      }
    ];

    return mockServices;
  }

  /**
   * Perform AWS discovery
   */
  async performAWSDiscovery(targets, options = {}) {
    try {
      console.log('☁️ Performing AWS discovery');
      
      // Mock AWS discovery - in production would use AWS SDK
      const awsResources = [
        {
          type: 'EC2',
          instanceId: 'i-1234567890abcdef0',
          instanceType: 't3.medium',
          state: 'running',
          privateIp: '10.0.1.100',
          publicIp: '54.123.45.67',
          securityGroups: ['sg-12345678'],
          tags: { Name: 'Web Server', Environment: 'Production' }
        },
        {
          type: 'RDS',
          dbInstanceId: 'mydb-instance',
          engine: 'mysql',
          engineVersion: '8.0.28',
          endpoint: 'mydb.cluster-xyz.us-east-1.rds.amazonaws.com',
          port: 3306
        }
      ];

      return {
        method: 'aws_discovery',
        resourcesFound: awsResources.length,
        resources: awsResources
      };

    } catch (error) {
      console.error('Error in AWS discovery:', error);
      throw error;
    }
  }

  /**
   * Perform Azure discovery
   */
  async performAzureDiscovery(targets, options = {}) {
    try {
      console.log('☁️ Performing Azure discovery');
      
      // Mock Azure discovery
      const azureResources = [
        {
          type: 'VirtualMachine',
          name: 'vm-web-01',
          resourceGroup: 'rg-production',
          location: 'East US',
          size: 'Standard_B2s',
          osType: 'Linux',
          privateIp: '10.1.0.4',
          publicIp: '20.123.45.67'
        }
      ];

      return {
        method: 'azure_discovery',
        resourcesFound: azureResources.length,
        resources: azureResources
      };

    } catch (error) {
      console.error('Error in Azure discovery:', error);
      throw error;
    }
  }

  /**
   * Perform GCP discovery
   */
  async performGCPDiscovery(targets, options = {}) {
    try {
      console.log('☁️ Performing GCP discovery');
      
      // Mock GCP discovery
      const gcpResources = [
        {
          type: 'ComputeInstance',
          name: 'instance-1',
          zone: 'us-central1-a',
          machineType: 'e2-medium',
          status: 'RUNNING',
          internalIp: '10.128.0.2',
          externalIp: '34.123.45.67'
        }
      ];

      return {
        method: 'gcp_discovery',
        resourcesFound: gcpResources.length,
        resources: gcpResources
      };

    } catch (error) {
      console.error('Error in GCP discovery:', error);
      throw error;
    }
  }

  /**
   * Perform Active Directory discovery
   */
  async performADDiscovery(targets, options = {}) {
    try {
      console.log('🏢 Performing Active Directory discovery');
      
      // Mock AD discovery
      const adObjects = [
        {
          type: 'Computer',
          name: 'WORKSTATION-01',
          dn: 'CN=WORKSTATION-01,OU=Computers,DC=domain,DC=com',
          operatingSystem: 'Windows 10 Enterprise',
          lastLogon: new Date()
        },
        {
          type: 'Server',
          name: 'DC-01',
          dn: 'CN=DC-01,OU=Domain Controllers,DC=domain,DC=com',
          operatingSystem: 'Windows Server 2019',
          roles: ['Domain Controller', 'DNS Server']
        }
      ];

      return {
        method: 'ad_discovery',
        objectsFound: adObjects.length,
        objects: adObjects
      };

    } catch (error) {
      console.error('Error in AD discovery:', error);
      throw error;
    }
  }

  /**
   * Perform SNMP discovery
   */
  async performSNMPDiscovery(targets, options = {}) {
    try {
      console.log('📡 Performing SNMP discovery');
      
      const { community = 'public', version = '2c' } = options;
      
      // Mock SNMP discovery
      const snmpDevices = [
        {
          ip: '192.168.1.1',
          sysName: 'Router-01',
          sysDescr: 'Cisco IOS Software',
          sysObjectID: '1.3.6.1.4.1.9.1.1',
          sysUpTime: 12345678,
          interfaces: [
            { name: 'GigabitEthernet0/0', status: 'up', speed: 1000000000 },
            { name: 'GigabitEthernet0/1', status: 'up', speed: 1000000000 }
          ]
        }
      ];

      return {
        method: 'snmp_discovery',
        devicesFound: snmpDevices.length,
        devices: snmpDevices
      };

    } catch (error) {
      console.error('Error in SNMP discovery:', error);
      throw error;
    }
  }

  /**
   * Correlate discovery results from multiple methods
   */
  async correlateDiscoveryResults(discoveryResults) {
    try {
      console.log('🔗 Correlating discovery results');
      
      const correlatedSystems = new Map();
      
      for (const result of discoveryResults) {
        if (!result.success) continue;
        
        switch (result.method) {
          case 'network_scan':
            this.correlateNetworkScanResults(result.result, correlatedSystems);
            break;
          case 'aws_discovery':
            this.correlateAWSResults(result.result, correlatedSystems);
            break;
          case 'azure_discovery':
            this.correlateAzureResults(result.result, correlatedSystems);
            break;
          case 'ad_discovery':
            this.correlateADResults(result.result, correlatedSystems);
            break;
          default:
            console.log(`No correlation handler for method: ${result.method}`);
        }
      }

      return Array.from(correlatedSystems.values());

    } catch (error) {
      console.error('Error correlating discovery results:', error);
      throw error;
    }
  }

  /**
   * Correlate network scan results
   */
  correlateNetworkScanResults(networkResult, correlatedSystems) {
    for (const host of networkResult.hosts) {
      const systemKey = host.ip;
      
      if (!correlatedSystems.has(systemKey)) {
        correlatedSystems.set(systemKey, {
          primaryIdentifier: host.ip,
          hostname: host.hostname,
          ipAddress: host.ip,
          macAddress: host.mac,
          operatingSystem: host.os,
          discoveryMethods: ['network_scan'],
          services: host.services || [],
          ports: host.ports || [],
          environment: 'on-premises',
          confidence: 0.8
        });
      } else {
        const existing = correlatedSystems.get(systemKey);
        existing.discoveryMethods.push('network_scan');
        existing.confidence = Math.min(1.0, existing.confidence + 0.2);
      }
    }
  }

  /**
   * Correlate AWS results
   */
  correlateAWSResults(awsResult, correlatedSystems) {
    for (const resource of awsResult.resources) {
      const systemKey = resource.privateIp || resource.instanceId;
      
      if (!correlatedSystems.has(systemKey)) {
        correlatedSystems.set(systemKey, {
          primaryIdentifier: resource.instanceId || resource.dbInstanceId,
          hostname: resource.tags?.Name || resource.instanceId,
          ipAddress: resource.privateIp,
          publicIpAddress: resource.publicIp,
          cloudProvider: 'aws',
          cloudResourceId: resource.instanceId || resource.dbInstanceId,
          cloudResourceType: resource.type,
          discoveryMethods: ['aws_discovery'],
          environment: 'cloud',
          confidence: 0.9
        });
      } else {
        const existing = correlatedSystems.get(systemKey);
        existing.discoveryMethods.push('aws_discovery');
        existing.cloudProvider = 'aws';
        existing.confidence = Math.min(1.0, existing.confidence + 0.1);
      }
    }
  }

  /**
   * Correlate Azure results
   */
  correlateAzureResults(azureResult, correlatedSystems) {
    for (const resource of azureResult.resources) {
      const systemKey = resource.privateIp || resource.name;
      
      if (!correlatedSystems.has(systemKey)) {
        correlatedSystems.set(systemKey, {
          primaryIdentifier: resource.name,
          hostname: resource.name,
          ipAddress: resource.privateIp,
          publicIpAddress: resource.publicIp,
          cloudProvider: 'azure',
          cloudResourceId: resource.name,
          cloudResourceType: resource.type,
          discoveryMethods: ['azure_discovery'],
          environment: 'cloud',
          confidence: 0.9
        });
      }
    }
  }

  /**
   * Correlate Active Directory results
   */
  correlateADResults(adResult, correlatedSystems) {
    for (const object of adResult.objects) {
      const systemKey = object.name;
      
      if (!correlatedSystems.has(systemKey)) {
        correlatedSystems.set(systemKey, {
          primaryIdentifier: object.name,
          hostname: object.name,
          operatingSystem: object.operatingSystem,
          adDistinguishedName: object.dn,
          adObjectType: object.type,
          discoveryMethods: ['ad_discovery'],
          environment: 'on-premises',
          confidence: 0.85
        });
      }
    }
  }

  /**
   * Process discovery results and create/update systems
   */
  async processDiscoveryResults(correlatedResults, scanId) {
    try {
      console.log('💾 Processing discovery results');
      
      const processedSystems = [];
      
      for (const result of correlatedResults) {
        try {
          // Check if system already exists
          const existingSystem = await this.findExistingSystem(result);
          
          if (existingSystem) {
            // Update existing system
            const updatedSystem = await this.updateExistingSystem(existingSystem, result);
            processedSystems.push(updatedSystem);
          } else {
            // Create new system
            const newSystem = await this.createNewSystem(result, scanId);
            processedSystems.push(newSystem);
          }
          
          // Store discovery result
          await this.storeDiscoveryResult(result, scanId);
          
        } catch (error) {
          console.error('Error processing discovery result:', error);
        }
      }

      return processedSystems;

    } catch (error) {
      console.error('Error processing discovery results:', error);
      throw error;
    }
  }

  /**
   * Find existing system based on discovery result
   */
  async findExistingSystem(result) {
    try {
      // Try to find by hostname first
      if (result.hostname) {
        const [system] = await db.select()
          .from(systems)
          .where(eq(systems.name, result.hostname))
          .limit(1);
        
        if (system) return system;
      }

      // Try to find by IP address in assets
      if (result.ipAddress) {
        const [asset] = await db.select({
          system: systems
        })
        .from(assets)
        .innerJoin(systemAssets, eq(assets.id, systemAssets.assetId))
        .innerJoin(systems, eq(systemAssets.systemId, systems.id))
        .where(eq(assets.ipAddress, result.ipAddress))
        .limit(1);
        
        if (asset) return asset.system;
      }

      return null;

    } catch (error) {
      console.error('Error finding existing system:', error);
      return null;
    }
  }

  /**
   * Create new system from discovery result
   */
  async createNewSystem(result, scanId) {
    try {
      const systemId = `SYS-DISC-${Date.now()}`;
      const uuid = crypto.randomUUID();

      const [newSystem] = await db.insert(systems)
        .values({
          systemId,
          name: result.hostname || result.primaryIdentifier,
          uuid,
          status: 'discovered',
          systemType: this.determineSystemType(result),
          source: 'discovery',
          discoveryConfidence: result.confidence,
          environment: result.environment,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create associated asset if we have network information
      if (result.ipAddress || result.hostname) {
        await this.createAssociatedAsset(newSystem, result);
      }

      console.log(`✅ Created new system: ${newSystem.name}`);
      return newSystem;

    } catch (error) {
      console.error('Error creating new system:', error);
      throw error;
    }
  }

  /**
   * Update existing system with discovery data
   */
  async updateExistingSystem(existingSystem, result) {
    try {
      const updateData = {
        discoveryConfidence: Math.max(existingSystem.discoveryConfidence || 0, result.confidence),
        lastDiscoveryDate: new Date(),
        updatedAt: new Date()
      };

      // Update environment if not set
      if (!existingSystem.environment && result.environment) {
        updateData.environment = result.environment;
      }

      const [updatedSystem] = await db.update(systems)
        .set(updateData)
        .where(eq(systems.id, existingSystem.id))
        .returning();

      console.log(`🔄 Updated existing system: ${updatedSystem.name}`);
      return updatedSystem;

    } catch (error) {
      console.error('Error updating existing system:', error);
      throw error;
    }
  }

  /**
   * Create associated asset for discovered system
   */
  async createAssociatedAsset(system, result) {
    try {
      const assetUuid = crypto.randomUUID();

      const [asset] = await db.insert(assets)
        .values({
          assetUuid,
          hostname: result.hostname,
          ipAddress: result.ipAddress,
          macAddress: result.macAddress,
          operatingSystem: result.operatingSystem,
          source: 'discovery',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Link asset to system
      await db.insert(systemAssets)
        .values({
          systemId: system.id,
          assetId: asset.id,
          createdAt: new Date()
        });

      return asset;

    } catch (error) {
      console.error('Error creating associated asset:', error);
      throw error;
    }
  }

  /**
   * Determine system type from discovery result
   */
  determineSystemType(result) {
    if (result.cloudProvider) {
      return 'Cloud System';
    }
    
    if (result.adObjectType === 'Server') {
      return 'Server';
    }
    
    if (result.services && result.services.includes('http')) {
      return 'Web Server';
    }
    
    if (result.services && (result.services.includes('mysql') || result.services.includes('postgresql'))) {
      return 'Database Server';
    }
    
    return 'General Support System';
  }

  /**
   * Store discovery result
   */
  async storeDiscoveryResult(result, scanId) {
    try {
      await db.insert(systemDiscoveryResults)
        .values({
          scanId,
          systemIdentifier: result.primaryIdentifier,
          discoveryData: JSON.stringify(result),
          confidence: result.confidence,
          methods: JSON.stringify(result.discoveryMethods),
          createdAt: new Date()
        });

    } catch (error) {
      console.error('Error storing discovery result:', error);
    }
  }

  /**
   * Process discovery queue
   */
  async processDiscoveryQueue() {
    if (this.scanQueue.length === 0) return;

    const batch = this.scanQueue.splice(0, 5); // Process 5 at a time
    
    for (const discoveryConfig of batch) {
      try {
        await this.startDiscovery(discoveryConfig);
      } catch (error) {
        console.error('Error processing queued discovery:', error);
      }
    }
  }

  /**
   * Queue discovery for background processing
   */
  queueDiscovery(discoveryConfig) {
    this.scanQueue.push(discoveryConfig);
    console.log(`📋 Queued discovery: ${discoveryConfig.name}`);
  }

  /**
   * Get discovery statistics
   */
  async getDiscoveryStats() {
    try {
      const [stats] = await db.select({
        totalScans: sql`COUNT(*)`,
        completedScans: sql`COUNT(*) FILTER (WHERE status = 'completed')`,
        runningScans: sql`COUNT(*) FILTER (WHERE status = 'running')`,
        systemsDiscovered: sql`SUM(systems_found)`,
        recentScans: sql`COUNT(*) FILTER (WHERE started_at >= NOW() - INTERVAL '24 hours')`
      })
      .from(systemDiscoveryScans);

      return {
        ...stats,
        queueSize: this.scanQueue.length,
        activeScans: this.activeScanners.size,
        methodsAvailable: this.discoveryMethods.size
      };

    } catch (error) {
      console.error('Error getting discovery stats:', error);
      throw error;
    }
  }

  /**
   * Get discovery scan history
   */
  async getDiscoveryHistory(filters = {}) {
    try {
      let query = db.select().from(systemDiscoveryScans);

      if (filters.status) {
        query = query.where(eq(systemDiscoveryScans.status, filters.status));
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const scans = await query.orderBy(desc(systemDiscoveryScans.startedAt));
      return scans;

    } catch (error) {
      console.error('Error getting discovery history:', error);
      throw error;
    }
  }
}

module.exports = new SystemDiscoveryService();
