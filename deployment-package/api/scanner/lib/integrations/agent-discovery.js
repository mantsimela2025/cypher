const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { EventEmitter } = require('events');

/**
 * Agent-based Discovery class for discovering assets using agent data
 */
class AgentDiscovery extends EventEmitter {
  /**
   * Create a new agent discovery instance
   * @param {Object} options - Discovery options
   * @param {number} options.timeout - Timeout in milliseconds for each operation
   */
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 5000;
    this.discoveryInProgress = false;
    this.aborted = false;
  }

  /**
   * Discover assets from agent data
   * @param {Object} config - Discovery configuration
   * @param {string} config.apiUrl - URL of the agent API endpoint
   * @param {string} config.apiKey - API key for authenticating to the agent API
   * @param {string} config.orgId - Organization ID to filter agents
   * @returns {Promise<Array>} - Discovered assets
   */
  async discoverAssets(config) {
    if (this.discoveryInProgress) {
      throw new Error('A discovery is already in progress');
    }
    
    this.discoveryInProgress = true;
    this.aborted = false;
    
    try {
      logger.info(`Starting agent-based asset discovery from ${config.apiUrl}`);
      
      // In a real implementation, this would connect to an agent API
      // We're simulating for this demo
      
      // Simulate discovery timing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate agent data that would be returned from API
      const agentData = [
        {
          agentId: 'agent-001',
          hostname: 'laptop-user1',
          ipAddress: '192.168.1.101',
          macAddress: '00:1A:2B:3C:4D:5E',
          operatingSystem: 'Windows 10 Enterprise',
          osVersion: '10.0.19044.1826',
          kernelVersion: '10.0.19044.1826',
          architecture: 'x64',
          cpuInfo: {
            model: 'Intel(R) Core(TM) i7-10510U CPU @ 1.80GHz',
            cores: 4,
            threads: 8
          },
          memoryInfo: {
            totalGB: 16,
            freeGB: 8.5
          },
          diskInfo: [
            {
              device: 'C:',
              totalGB: 500,
              freeGB: 320,
              fsType: 'NTFS'
            }
          ],
          networkInterfaces: [
            {
              name: 'Wi-Fi',
              macAddress: '00:1A:2B:3C:4D:5E',
              ipAddresses: ['192.168.1.101'],
              gateway: '192.168.1.1',
              dns: ['192.168.1.1', '8.8.8.8']
            }
          ],
          installedSoftware: [
            {
              name: 'Microsoft Office 365',
              version: '16.0.15629.20208',
              installDate: '2022-01-15'
            },
            {
              name: 'Google Chrome',
              version: '103.0.5060.134',
              installDate: '2022-07-10'
            },
            {
              name: 'Adobe Acrobat Reader DC',
              version: '22.001.20169',
              installDate: '2022-06-22'
            }
          ],
          lastSeen: '2023-06-30T12:30:45.123Z',
          agentVersion: '1.5.0',
          userInfo: {
            username: 'user1',
            domain: 'CORP'
          },
          tags: ['laptop', 'finance-dept']
        },
        {
          agentId: 'agent-002',
          hostname: 'desktop-user2',
          ipAddress: '192.168.1.102',
          macAddress: '00:2B:3C:4D:5E:6F',
          operatingSystem: 'Windows 10 Enterprise',
          osVersion: '10.0.19044.1826',
          kernelVersion: '10.0.19044.1826',
          architecture: 'x64',
          cpuInfo: {
            model: 'Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz',
            cores: 6,
            threads: 12
          },
          memoryInfo: {
            totalGB: 32,
            freeGB: 24.5
          },
          diskInfo: [
            {
              device: 'C:',
              totalGB: 1000,
              freeGB: 750,
              fsType: 'NTFS'
            }
          ],
          networkInterfaces: [
            {
              name: 'Ethernet',
              macAddress: '00:2B:3C:4D:5E:6F',
              ipAddresses: ['192.168.1.102'],
              gateway: '192.168.1.1',
              dns: ['192.168.1.1', '8.8.8.8']
            }
          ],
          installedSoftware: [
            {
              name: 'Microsoft Office 365',
              version: '16.0.15629.20208',
              installDate: '2022-01-20'
            },
            {
              name: 'Google Chrome',
              version: '103.0.5060.134',
              installDate: '2022-07-12'
            },
            {
              name: 'Adobe Creative Cloud',
              version: '5.6.0.788',
              installDate: '2022-03-15'
            }
          ],
          lastSeen: '2023-06-30T13:15:22.456Z',
          agentVersion: '1.5.0',
          userInfo: {
            username: 'user2',
            domain: 'CORP'
          },
          tags: ['desktop', 'marketing-dept']
        },
        {
          agentId: 'agent-003',
          hostname: 'server-web1',
          ipAddress: '192.168.1.10',
          macAddress: '00:3C:4D:5E:6F:7G',
          operatingSystem: 'Windows Server 2019',
          osVersion: '10.0.17763.2686',
          kernelVersion: '10.0.17763.2686',
          architecture: 'x64',
          cpuInfo: {
            model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
            cores: 8,
            threads: 16
          },
          memoryInfo: {
            totalGB: 64,
            freeGB: 48.2
          },
          diskInfo: [
            {
              device: 'C:',
              totalGB: 500,
              freeGB: 350,
              fsType: 'NTFS'
            },
            {
              device: 'D:',
              totalGB: 2000,
              freeGB: 1800,
              fsType: 'NTFS'
            }
          ],
          networkInterfaces: [
            {
              name: 'Ethernet',
              macAddress: '00:3C:4D:5E:6F:7G',
              ipAddresses: ['192.168.1.10'],
              gateway: '192.168.1.1',
              dns: ['192.168.1.1', '8.8.8.8']
            }
          ],
          installedSoftware: [
            {
              name: 'IIS',
              version: '10.0.17763.1',
              installDate: '2022-01-10'
            },
            {
              name: '.NET Framework',
              version: '4.8.03761',
              installDate: '2022-01-10'
            },
            {
              name: 'SQL Server 2019',
              version: '15.0.4223.1',
              installDate: '2022-01-12'
            }
          ],
          lastSeen: '2023-06-30T12:55:33.789Z',
          agentVersion: '1.5.0',
          userInfo: {
            username: 'svc-web',
            domain: 'CORP'
          },
          tags: ['server', 'web-tier', 'production']
        }
      ];
      
      // Process agent data into asset objects
      const assets = agentData.map(agent => {
        // Create base asset object
        const asset = {
          id: uuidv4(),
          hostname: agent.hostname,
          ipAddress: agent.ipAddress,
          macAddress: agent.macAddress,
          assetType: this.classifyAssetByAgentData(agent),
          operatingSystem: agent.operatingSystem,
          osVersion: agent.osVersion,
          lastSeen: agent.lastSeen,
          discoveryMethod: 'agent',
          metadata: {
            discoveredBy: 'agent-discovery',
            agentId: agent.agentId,
            agentVersion: agent.agentVersion,
            architecture: agent.architecture,
            cpuInfo: agent.cpuInfo,
            memoryInfo: agent.memoryInfo,
            diskInfo: agent.diskInfo,
            networkInterfaces: agent.networkInterfaces,
            userInfo: agent.userInfo,
            tags: agent.tags
          }
        };
        
        // Add installed software
        asset.installedSoftware = agent.installedSoftware;
        
        // Emit progress event
        this.emit('progress', {
          count: agentData.indexOf(agent) + 1,
          total: agentData.length,
          item: agent.hostname
        });
        
        return asset;
      });
      
      logger.info(`Discovered ${assets.length} assets from agent data`);
      
      this.discoveryInProgress = false;
      return assets;
      
    } catch (error) {
      this.discoveryInProgress = false;
      logger.error(`Agent discovery error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Classify asset type based on agent data
   * @param {Object} agentData - Agent data
   * @returns {string} - Asset type classification
   */
  classifyAssetByAgentData(agentData) {
    // Check if the hostname contains server indicators
    const hostnameIndicators = ['server', 'srv', 'web', 'db', 'app', 'mail', 'file'];
    if (hostnameIndicators.some(indicator => agentData.hostname.toLowerCase().includes(indicator))) {
      return 'server';
    }
    
    // Check operating system
    if (agentData.operatingSystem.includes('Server')) {
      return 'server';
    }
    
    // Check installed software for server applications
    const serverSoftware = ['IIS', 'Apache', 'Nginx', 'SQL Server', 'MySQL', 'PostgreSQL', 'Exchange'];
    if (agentData.installedSoftware.some(software => serverSoftware.some(s => software.name.includes(s)))) {
      return 'server';
    }
    
    // Check tags
    if (agentData.tags && agentData.tags.includes('server')) {
      return 'server';
    }
    
    // Laptop/Desktop distinction
    if (agentData.tags) {
      if (agentData.tags.includes('laptop')) {
        return 'laptop';
      }
      if (agentData.tags.includes('desktop')) {
        return 'desktop';
      }
    }
    
    // Default to workstation
    return 'workstation';
  }

  /**
   * Stop an ongoing discovery
   */
  abort() {
    if (this.discoveryInProgress) {
      this.aborted = true;
      this.discoveryInProgress = false;
      logger.info('Agent discovery aborted');
    }
  }
}

module.exports = AgentDiscovery;