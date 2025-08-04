const chalk = require('chalk');
const logger = require('../lib/utils/logger');
const reporter = require('../lib/utils/reporter');
const IPScanner = require('../lib/scanners/ip-scanner');
const validator = require('../lib/utils/validator');
const AssetClassifier = require('../lib/utils/asset-classifier');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import discovery integrations
const ActiveDirectoryIntegration = require('../lib/integrations/active-directory');
const CloudDiscovery = require('../lib/integrations/cloud-discovery');
const AgentDiscovery = require('../lib/integrations/agent-discovery');

/**
 * Asset Discovery command - combines multiple scanning methods to discover assets
 * @param {string} target - Target range or descriptor (CIDR, domain, etc.)
 * @param {Object} options - Command options
 */
async function assetDiscovery(target, options) {
  try {
    logger.info(`Starting asset discovery for target: ${target}`);
    console.log(chalk.blue('Starting Asset Discovery'));
    console.log(`Target:      ${chalk.yellow(target)}`);
    console.log(`Methods:     ${chalk.yellow(options.methods)}`);
    console.log(`Deep scan:   ${chalk.yellow(options.deep ? 'Yes' : 'No')}`);
    console.log(`Timeout:     ${chalk.yellow(options.timeout)}ms`);
    console.log(`Concurrency: ${chalk.yellow(options.concurrent)}`);
    console.log(chalk.blue('-'.repeat(60)));

    // Parse and validate timeout
    const timeout = validator.parseTimeout(options.timeout);
    
    // Parse and validate concurrency
    const concurrency = parseInt(options.concurrent, 10);
    if (isNaN(concurrency) || concurrency < 1 || concurrency > 500) {
      logger.warn(`Invalid concurrency value: ${options.concurrent}, using default of 50`);
      options.concurrent = 50;
    }

    // Parse discovery methods
    const methods = options.methods.split(',').map(m => m.trim().toLowerCase());
    
    // Initialize results storage
    const discoveryResults = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      target,
      summary: {
        totalAssetsDiscovered: 0,
        activeHosts: 0,
        hostsWithOpenPorts: 0,
        identifiedServices: 0
      },
      assets: [],
      scanDetails: {
        methods: methods,
        deep: options.deep,
        duration: 0,
        errors: []
      }
    };

    const startTime = Date.now();

    // 1. Network discovery via IP scanning
    if (methods.includes('network')) {
      console.log(chalk.yellow('\nPerforming network discovery...'));
      
      // Determine if target is a CIDR range
      if (validator.isValidCidr(target)) {
        // Initialize scanner
        const ipScanner = new IPScanner({
          timeout,
          concurrency
        });
        
        // Set up event listeners
        ipScanner.on('ipFound', (data) => {
          if (data.status === 'up') {
            const hostStr = data.hostname ? ` (${data.hostname})` : '';
            const latencyStr = data.latency ? ` - ${data.latency}ms` : '';
            console.log(chalk.green(`✓ ${data.ip}${hostStr}${latencyStr}`));
          }
        });
        
        ipScanner.on('progress', (data) => {
          process.stdout.write(`\r${chalk.blue(`Network scanning... [${data.percent}%]`)} - ${data.scanned} of ${data.total} IPs checked`);
        });
        
        // Start the scan
        const networkResults = await ipScanner.scan(target, {
          ping: true
        });
        
        // Clear the progress line
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
        
        // Add discovered hosts to assets list
        const upHosts = networkResults.filter(r => r.status === 'up');
        
        // Update summary
        discoveryResults.summary.activeHosts = upHosts.length;
        discoveryResults.summary.totalAssetsDiscovered += upHosts.length;
        
        // Add each host to the assets list
        upHosts.forEach(host => {
          discoveryResults.assets.push({
            id: uuidv4(),
            ipAddress: host.ip,
            hostname: host.hostname || null,
            macAddress: host.mac || null,
            assetType: 'unknown', // Will be classified later
            discoveryMethod: 'network',
            lastSeen: new Date().toISOString(),
            ports: [],
            services: [],
            operatingSystem: null,
            metadata: {
              latency: host.latency,
              discoveredBy: 'network-scan'
            }
          });
        });
        
        console.log(chalk.green(`\nDiscovered ${upHosts.length} active hosts via network scanning`));
      } else {
        logger.warn(`Target '${target}' is not a valid CIDR range for network discovery`);
        discoveryResults.scanDetails.errors.push(`Invalid CIDR range for network discovery: ${target}`);
      }
    }

    // 2. Run Port Scanning if deep scanning is enabled
    if (options.deep && discoveryResults.assets.length > 0) {
      console.log(chalk.yellow('\nPerforming port scanning on discovered assets...'));
      
      // Import port scanner here to avoid circular dependencies
      const PortScanner = require('../lib/scanners/port-scanner');
      
      // Initialize the port scanner
      const portScanner = new PortScanner({
        timeout,
        concurrency
      });
      
      // Number of assets to scan
      const totalAssets = discoveryResults.assets.length;
      let scannedAssets = 0;
      let assetsWithOpenPorts = 0;
      let totalOpenPorts = 0;
      
      // Scan each asset
      for (const asset of discoveryResults.assets) {
        process.stdout.write(`\r${chalk.blue(`Port scanning... [${Math.floor((scannedAssets / totalAssets) * 100)}%]`)} - Scanning ${asset.ipAddress}${asset.hostname ? ` (${asset.hostname})` : ''}`);
        
        // Set port range based on scan depth
        const portRange = options.deep === 'full' ? '1-65535' : '1-1024';
        
        try {
          // Run port scan
          const portResults = await portScanner.scan(asset.ipAddress, {
            ports: portRange,
            serviceDetection: true // Enable service detection
          });
          
          // Get open ports
          const openPorts = portResults.filter(p => p.state === 'open');
          
          // Update asset with port information
          asset.ports = openPorts.map(p => ({
            port: p.port,
            protocol: p.protocol || 'tcp',
            service: p.service || null,
            banner: p.banner || null
          }));
          
          // Store detected services
          if (openPorts.length > 0) {
            assetsWithOpenPorts++;
            totalOpenPorts += openPorts.length;
            
            // Extract service information for classification
            openPorts.forEach(p => {
              if (p.service) {
                // Add unique services
                if (!asset.services.includes(p.service)) {
                  asset.services.push(p.service);
                }
              }
            });
          }
          
          // Attempt to identify the asset type based on discovered services
          if (asset.services.length > 0) {
            asset.assetType = classifyAssetByServices(asset.services);
          }
          
        } catch (error) {
          logger.error(`Error scanning ports for ${asset.ipAddress}: ${error.message}`);
          discoveryResults.scanDetails.errors.push(`Port scan error for ${asset.ipAddress}: ${error.message}`);
        }
        
        scannedAssets++;
      }
      
      // Clear the progress line
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
      
      // Update summary
      discoveryResults.summary.hostsWithOpenPorts = assetsWithOpenPorts;
      discoveryResults.summary.identifiedServices = discoveryResults.assets.reduce((total, asset) => total + asset.services.length, 0);
      
      console.log(chalk.green(`\nCompleted port scanning: ${assetsWithOpenPorts} hosts with open ports, ${totalOpenPorts} open ports discovered`));
    }

    // 3. Cloud integrations discovery
    if (methods.includes('cloud')) {
      console.log(chalk.yellow('\nPerforming cloud resource discovery...'));
      
      try {
        // Initialize cloud discovery module
        const cloudDiscovery = new CloudDiscovery({
          timeout
        });
        
        // Configure cloud providers from options
        const cloudProvider = options.cloudProvider || 'aws';
        
        // Set up event listeners
        cloudDiscovery.on('progress', (data) => {
          process.stdout.write(`\r${chalk.blue(`Cloud discovery [${data.service}]...`)} - Discovering ${data.item}`);
        });
        
        // Check if credentials are provided
        let credentials = {};
        
        if (options.cloudCredentials) {
          try {
            credentials = JSON.parse(options.cloudCredentials);
          } catch (error) {
            logger.error(`Invalid cloud credentials JSON: ${error.message}`);
            credentials = {};
          }
        }
        
        // Get cloud discovery options
        const cloudOptions = {
          services: options.cloudServices ? options.cloudServices.split(',') : ['ec2', 's3', 'rds', 'lambda'],
          region: options.cloudRegion || 'us-east-1',
          projectId: options.cloudProject || 'my-project'
        };
        
        // Clear the line before starting
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
        
        // Discover cloud assets
        console.log(chalk.blue(`Starting cloud asset discovery for ${cloudProvider}...`));
        const cloudAssets = await cloudDiscovery.discoverAssets(cloudProvider, credentials, cloudOptions);
        
        // Clear the progress line
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
        
        // Add cloud assets to the results
        if (cloudAssets && cloudAssets.length > 0) {
          discoveryResults.assets = [...discoveryResults.assets, ...cloudAssets];
          discoveryResults.summary.totalAssetsDiscovered += cloudAssets.length;
          
          console.log(chalk.green(`\nDiscovered ${cloudAssets.length} assets from ${cloudProvider} cloud provider`));
          
          // Categorize cloud assets by type
          const cloudAssetTypes = {};
          cloudAssets.forEach(asset => {
            cloudAssetTypes[asset.assetType] = (cloudAssetTypes[asset.assetType] || 0) + 1;
          });
          
          // Display cloud asset type breakdown
          Object.entries(cloudAssetTypes).forEach(([type, count]) => {
            console.log(`  ${chalk.yellow(type)}: ${count}`);
          });
        } else {
          console.log(chalk.yellow(`No cloud assets discovered from ${cloudProvider}`));
        }
      } catch (error) {
        logger.error(`Cloud discovery error: ${error.message}`);
        console.error(chalk.red(`Error during cloud discovery: ${error.message}`));
        discoveryResults.scanDetails.errors.push(`Cloud discovery error: ${error.message}`);
      }
    }

    // 4. Active Directory discovery
    if (methods.includes('activedirectory')) {
      console.log(chalk.yellow('\nPerforming Active Directory discovery...'));
      
      try {
        // Initialize AD integration
        const adIntegration = new ActiveDirectoryIntegration({
          timeout
        });
        
        // Configure AD connection from options
        const adConfig = {
          url: options.adServer || 'ldap://localhost',
          baseDN: options.adBaseDN || 'DC=example,DC=com',
          username: options.adUsername,
          password: options.adPassword,
          useTLS: options.adUseTLS === 'true'
        };
        
        // Set up event listeners
        adIntegration.on('progress', (data) => {
          process.stdout.write(`\r${chalk.blue(`AD discovery...`)} - Found ${data.count} items, processing ${data.item}`);
        });
        
        // Clear the line before starting
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
        
        // Connect to Active Directory
        try {
          // Simulate connection (normally would connect to actual AD)
          console.log(chalk.blue(`Connecting to Active Directory at ${adConfig.url}...`));
          await adIntegration.connect(adConfig);
        
          // Discover computer assets
          console.log(chalk.blue('Discovering computer assets...'));
          const computerAssets = await adIntegration.discoverComputers({
            baseDN: adConfig.baseDN,
            computerOU: options.adComputerOU
          });
          
          // Discover server assets
          console.log(chalk.blue('Discovering server assets...'));
          const serverAssets = await adIntegration.discoverServers({
            baseDN: adConfig.baseDN,
            serverOU: options.adServerOU
          });
          
          // Combine all AD assets
          const adAssets = [...computerAssets, ...serverAssets];
          
          // Clear the progress line
          process.stdout.write('\r' + ' '.repeat(100) + '\r');
          
          // Add AD assets to the results
          if (adAssets && adAssets.length > 0) {
            discoveryResults.assets = [...discoveryResults.assets, ...adAssets];
            discoveryResults.summary.totalAssetsDiscovered += adAssets.length;
            
            console.log(chalk.green(`\nDiscovered ${adAssets.length} assets from Active Directory`));
            console.log(`  ${chalk.yellow('Computers')}: ${computerAssets.length}`);
            console.log(`  ${chalk.yellow('Servers')}: ${serverAssets.length}`);
          } else {
            console.log(chalk.yellow(`No assets discovered from Active Directory`));
          }
          
          // Disconnect from AD
          adIntegration.disconnect();
        } catch (error) {
          logger.error(`Active Directory connection error: ${error.message}`);
          console.error(chalk.red(`Error connecting to Active Directory: ${error.message}`));
          discoveryResults.scanDetails.errors.push(`Active Directory connection error: ${error.message}`);
        }
      } catch (error) {
        logger.error(`Active Directory discovery error: ${error.message}`);
        console.error(chalk.red(`Error during Active Directory discovery: ${error.message}`));
        discoveryResults.scanDetails.errors.push(`Active Directory discovery error: ${error.message}`);
      }
    }

    // 5. Agent-based discovery
    if (methods.includes('agent')) {
      console.log(chalk.yellow('\nPerforming agent-based discovery...'));
      
      try {
        // Initialize agent discovery module
        const agentDiscovery = new AgentDiscovery({
          timeout
        });
        
        // Configure agent API connection from options
        const agentConfig = {
          apiUrl: options.agentApiUrl || 'https://agents.example.com/api',
          apiKey: options.agentApiKey,
          orgId: options.agentOrgId
        };
        
        // Set up event listeners
        agentDiscovery.on('progress', (data) => {
          process.stdout.write(`\r${chalk.blue(`Agent discovery...`)} - Processed ${data.count} of ${data.total} agents, current: ${data.item}`);
        });
        
        // Clear the line before starting
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
        
        // Discover agent assets
        console.log(chalk.blue(`Starting agent-based asset discovery...`));
        const agentAssets = await agentDiscovery.discoverAssets(agentConfig);
        
        // Clear the progress line
        process.stdout.write('\r' + ' '.repeat(100) + '\r');
        
        // Add agent assets to the results
        if (agentAssets && agentAssets.length > 0) {
          discoveryResults.assets = [...discoveryResults.assets, ...agentAssets];
          discoveryResults.summary.totalAssetsDiscovered += agentAssets.length;
          
          console.log(chalk.green(`\nDiscovered ${agentAssets.length} assets from agent data`));
          
          // Categorize agent assets by type
          const agentAssetTypes = {};
          agentAssets.forEach(asset => {
            agentAssetTypes[asset.assetType] = (agentAssetTypes[asset.assetType] || 0) + 1;
          });
          
          // Display agent asset type breakdown
          Object.entries(agentAssetTypes).forEach(([type, count]) => {
            console.log(`  ${chalk.yellow(type)}: ${count}`);
          });
        } else {
          console.log(chalk.yellow(`No assets discovered from agent data`));
        }
      } catch (error) {
        logger.error(`Agent discovery error: ${error.message}`);
        console.error(chalk.red(`Error during agent discovery: ${error.message}`));
        discoveryResults.scanDetails.errors.push(`Agent discovery error: ${error.message}`);
      }
    }

    // 6. Apply advanced asset classification and tagging
    console.log(chalk.yellow('\nPerforming asset classification and tagging...'));
    
    // Apply asset classification to all discovered assets
    if (discoveryResults.assets.length > 0) {
      console.log(chalk.blue(`Classifying ${discoveryResults.assets.length} discovered assets...`));
      
      // Apply advanced classification
      discoveryResults.assets = AssetClassifier.batchClassify(discoveryResults.assets);
      
      console.log(chalk.green(`\nAsset classification complete`));
    }
    
    // Calculate duration
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    discoveryResults.scanDetails.duration = duration;

    // Display discovery summary
    console.log(chalk.blue('\nAsset Discovery Summary'));
    console.log(`${chalk.yellow('Total Assets:')} ${discoveryResults.summary.totalAssetsDiscovered}`);
    console.log(`${chalk.yellow('Active Hosts:')} ${discoveryResults.summary.activeHosts}`);
    console.log(`${chalk.yellow('Hosts with Open Ports:')} ${discoveryResults.summary.hostsWithOpenPorts}`);
    console.log(`${chalk.yellow('Identified Services:')} ${discoveryResults.summary.identifiedServices}`);
    console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
    
    // Generate asset type summary
    const assetTypeCounts = {};
    discoveryResults.assets.forEach(asset => {
      assetTypeCounts[asset.assetType] = (assetTypeCounts[asset.assetType] || 0) + 1;
    });
    
    console.log(chalk.blue('\nAsset Type Breakdown'));
    Object.entries(assetTypeCounts).forEach(([type, count]) => {
      console.log(`${chalk.yellow(type)}: ${count}`);
    });
    
    // Generate tag summary if assets have tags
    const taggedAssets = discoveryResults.assets.filter(asset => asset.tags && asset.tags.length > 0);
    if (taggedAssets.length > 0) {
      const tagCounts = {};
      taggedAssets.forEach(asset => {
        asset.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      console.log(chalk.blue('\nTag Breakdown'));
      // Sort tags by frequency (most common first)
      Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Show top 10 tags
        .forEach(([tag, count]) => {
          console.log(`${chalk.yellow(tag)}: ${count}`);
        });
      
      // Show total tag count if more than 10
      const totalTags = Object.keys(tagCounts).length;
      if (totalTags > 10) {
        console.log(`${chalk.gray('...')} and ${totalTags - 10} more tags`);
      }
    }

    // Output results to file if requested
    if (options.output) {
      // Make sure the output directory exists
      const outputDir = path.dirname(options.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Write results to file
      await reporter.writeResults(discoveryResults, {
        filename: options.output,
        format: options.format,
        scanType: 'asset-discovery',
        comprehensive: options.comprehensive === 'true',
        scanTitle: options.scanTitle || `Asset Discovery (${target}) - ${new Date().toLocaleDateString()}`,
        targetHosts: [target],
        excludedHosts: []
      });
      
      console.log(chalk.green(`\nResults written to ${options.output}`));
    }
    
    // Return discovery results
    return discoveryResults;
    
  } catch (error) {
    logger.error(`Asset discovery error: ${error.message}`);
    console.error(chalk.red(`Error during asset discovery: ${error.message}`));
    if (error.stack) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Classify asset by detected services
 * @param {Array<string>} services - List of detected services
 * @returns {string} - Asset type classification
 */
function classifyAssetByServices(services) {
  services = services.map(s => s.toLowerCase());
  
  // Web server detection
  if (services.some(s => ['http', 'https', 'nginx', 'apache', 'iis', 'tomcat'].includes(s))) {
    return 'web-server';
  }
  
  // Database server detection
  if (services.some(s => ['mysql', 'postgresql', 'mssql', 'oracle', 'mongodb', 'redis'].includes(s))) {
    return 'database-server';
  }
  
  // File server detection
  if (services.some(s => ['ftp', 'ftps', 'sftp', 'nfs', 'smb', 'cifs'].includes(s))) {
    return 'file-server';
  }
  
  // Mail server detection
  if (services.some(s => ['smtp', 'pop3', 'imap', 'exchange'].includes(s))) {
    return 'mail-server';
  }
  
  // Domain controller detection
  if (services.some(s => ['ldap', 'kerberos', 'msrpc', 'dns'].includes(s))) {
    return 'domain-controller';
  }
  
  // Router/switch detection
  if (services.some(s => ['snmp', 'telnet', 'ssh'].includes(s))) {
    return 'network-device';
  }
  
  // Workstation detection
  if (services.some(s => ['netbios', 'rdp'].includes(s))) {
    return 'workstation';
  }
  
  // IoT device detection
  if (services.some(s => ['mqtt', 'coap', 'modbus', 'bacnet'].includes(s))) {
    return 'iot-device';
  }
  
  // Default classification if no specific type is determined
  return 'unknown';
}

module.exports = assetDiscovery;