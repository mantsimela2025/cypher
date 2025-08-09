/**
 * Asset classification utility for automatically categorizing and tagging assets
 * based on discovered attributes and properties
 */

const logger = require('./logger');

/**
 * Asset Classifier class
 */
class AssetClassifier {
  /**
   * Classify an asset based on its attributes and assign appropriate tags
   * @param {Object} asset - Asset object to classify
   * @returns {Object} - Modified asset with classification and tags
   */
  static classifyAsset(asset) {
    try {
      // Start with existing asset
      const classifiedAsset = { ...asset };
      
      // Initialize tags array if it doesn't exist
      if (!classifiedAsset.tags) {
        classifiedAsset.tags = [];
      }
      
      // Apply classification rules
      this._classifyByAssetType(classifiedAsset);
      this._classifyByOperatingSystem(classifiedAsset);
      this._classifyByServices(classifiedAsset);
      this._classifyByPorts(classifiedAsset);
      this._classifyByCloudProvider(classifiedAsset);
      this._classifyByHostname(classifiedAsset);
      
      // Ensure tags are unique
      classifiedAsset.tags = [...new Set(classifiedAsset.tags)];
      
      return classifiedAsset;
    } catch (error) {
      logger.error(`Error classifying asset: ${error.message}`);
      return asset; // Return the original asset if classification fails
    }
  }
  
  /**
   * Batch classify a list of assets
   * @param {Array} assets - Array of asset objects to classify
   * @returns {Array} - Modified assets with classification and tags
   */
  static batchClassify(assets) {
    return assets.map(asset => this.classifyAsset(asset));
  }
  
  /**
   * Classify asset by its existing asset type
   * @param {Object} asset - Asset object to classify
   * @private
   */
  static _classifyByAssetType(asset) {
    // If asset already has a type, add it as a tag
    if (asset.assetType && asset.assetType !== 'unknown') {
      this._addTag(asset, asset.assetType);
      
      // Add category tags based on asset type
      switch (asset.assetType.toLowerCase()) {
        case 'server':
        case 'web-server':
        case 'database-server':
        case 'file-server':
        case 'mail-server':
        case 'domain-controller':
          this._addTag(asset, 'server');
          this._addTag(asset, 'critical-infrastructure');
          break;
          
        case 'workstation':
        case 'laptop':
        case 'desktop':
          this._addTag(asset, 'endpoint');
          break;
          
        case 'router':
        case 'switch':
        case 'network-device':
        case 'firewall':
          this._addTag(asset, 'network');
          this._addTag(asset, 'critical-infrastructure');
          break;
          
        case 'cloud-instance':
        case 'storage-bucket':
        case 'database-instance':
        case 'serverless-function':
          this._addTag(asset, 'cloud');
          break;
          
        case 'iot-device':
        case 'embedded':
          this._addTag(asset, 'iot');
          break;
      }
    }
  }
  
  /**
   * Classify asset by its operating system
   * @param {Object} asset - Asset object to classify
   * @private
   */
  static _classifyByOperatingSystem(asset) {
    if (!asset.operatingSystem) return;
    
    const os = asset.operatingSystem.toLowerCase();
    
    // Detect Windows
    if (os.includes('windows')) {
      this._addTag(asset, 'windows');
      
      // Detect Windows Server
      if (os.includes('server')) {
        this._addTag(asset, 'windows-server');
        asset.assetType = asset.assetType === 'unknown' ? 'server' : asset.assetType;
      } else {
        this._addTag(asset, 'windows-client');
        asset.assetType = asset.assetType === 'unknown' ? 'workstation' : asset.assetType;
      }
      
      // Detect specific Windows versions
      if (os.includes('2019')) this._addTag(asset, 'windows-2019');
      if (os.includes('2016')) this._addTag(asset, 'windows-2016');
      if (os.includes('2012')) this._addTag(asset, 'windows-2012');
      if (os.includes('10')) this._addTag(asset, 'windows-10');
      if (os.includes('11')) this._addTag(asset, 'windows-11');
    }
    
    // Detect Linux
    if (os.includes('linux') || os.includes('ubuntu') || os.includes('debian') || 
        os.includes('centos') || os.includes('redhat') || os.includes('rhel') || 
        os.includes('fedora') || os.includes('suse')) {
      this._addTag(asset, 'linux');
      
      // Detect specific Linux distributions
      if (os.includes('ubuntu')) this._addTag(asset, 'ubuntu');
      if (os.includes('debian')) this._addTag(asset, 'debian');
      if (os.includes('centos')) this._addTag(asset, 'centos');
      if (os.includes('redhat') || os.includes('rhel')) this._addTag(asset, 'redhat');
      if (os.includes('fedora')) this._addTag(asset, 'fedora');
      if (os.includes('suse')) this._addTag(asset, 'suse');
      
      // Infer asset type if unknown
      if (asset.assetType === 'unknown') {
        // For Linux, check for server indicators in hostname
        const serverHostnames = ['srv', 'server', 'db', 'web', 'app', 'mail'];
        if (asset.hostname && serverHostnames.some(indicator => 
            asset.hostname.toLowerCase().includes(indicator))) {
          asset.assetType = 'server';
        }
      }
    }
    
    // Detect macOS
    if (os.includes('mac') || os.includes('macos') || os.includes('osx')) {
      this._addTag(asset, 'macos');
      asset.assetType = asset.assetType === 'unknown' ? 'workstation' : asset.assetType;
    }
    
    // Detect BSD
    if (os.includes('bsd') || os.includes('freebsd') || os.includes('openbsd')) {
      this._addTag(asset, 'bsd');
    }
    
    // Detect network devices
    if (os.includes('ios') || os.includes('junos') || os.includes('routeros') || 
        os.includes('mikrotik') || os.includes('fortios')) {
      this._addTag(asset, 'network-device');
      asset.assetType = 'network-device';
      
      if (os.includes('ios')) this._addTag(asset, 'cisco');
      if (os.includes('junos')) this._addTag(asset, 'juniper');
      if (os.includes('routeros') || os.includes('mikrotik')) this._addTag(asset, 'mikrotik');
      if (os.includes('fortios')) this._addTag(asset, 'fortinet');
    }
  }
  
  /**
   * Classify asset by detected services
   * @param {Object} asset - Asset object to classify
   * @private
   */
  static _classifyByServices(asset) {
    if (!asset.services || !Array.isArray(asset.services) || asset.services.length === 0) return;
    
    // Convert services to lowercase for consistent matching
    const services = asset.services.map(s => s.toLowerCase());
    
    // Web server detection
    const webServers = ['http', 'https', 'nginx', 'apache', 'iis', 'tomcat'];
    if (services.some(s => webServers.some(ws => s.includes(ws)))) {
      this._addTag(asset, 'web');
      this._addTag(asset, 'http');
      
      // Add specific web server tags
      if (services.some(s => s.includes('nginx'))) this._addTag(asset, 'nginx');
      if (services.some(s => s.includes('apache'))) this._addTag(asset, 'apache');
      if (services.some(s => s.includes('iis'))) this._addTag(asset, 'iis');
      if (services.some(s => s.includes('tomcat'))) this._addTag(asset, 'tomcat');
      
      // Set asset type if unknown
      if (asset.assetType === 'unknown') {
        asset.assetType = 'web-server';
      }
    }
    
    // Database server detection
    const dbServers = ['mysql', 'mariadb', 'postgresql', 'mssql', 'oracle', 'mongodb', 'redis', 'elasticsearch'];
    if (services.some(s => dbServers.some(db => s.includes(db)))) {
      this._addTag(asset, 'database');
      
      // Add specific database tags
      if (services.some(s => s.includes('mysql') || s.includes('mariadb'))) this._addTag(asset, 'mysql');
      if (services.some(s => s.includes('postgresql'))) this._addTag(asset, 'postgresql');
      if (services.some(s => s.includes('mssql'))) this._addTag(asset, 'mssql');
      if (services.some(s => s.includes('oracle'))) this._addTag(asset, 'oracle');
      if (services.some(s => s.includes('mongodb'))) this._addTag(asset, 'mongodb');
      if (services.some(s => s.includes('redis'))) this._addTag(asset, 'redis');
      if (services.some(s => s.includes('elasticsearch'))) this._addTag(asset, 'elasticsearch');
      
      // Set asset type if unknown
      if (asset.assetType === 'unknown') {
        asset.assetType = 'database-server';
      }
    }
    
    // File server detection
    const fileServers = ['ftp', 'ftps', 'sftp', 'nfs', 'smb', 'cifs', 'samba'];
    if (services.some(s => fileServers.some(fs => s.includes(fs)))) {
      this._addTag(asset, 'file-sharing');
      
      // Add specific file server tags
      if (services.some(s => s.includes('ftp'))) this._addTag(asset, 'ftp');
      if (services.some(s => s.includes('nfs'))) this._addTag(asset, 'nfs');
      if (services.some(s => s.includes('smb') || s.includes('cifs'))) this._addTag(asset, 'smb');
      
      // Set asset type if unknown
      if (asset.assetType === 'unknown') {
        asset.assetType = 'file-server';
      }
    }
    
    // Mail server detection
    const mailServers = ['smtp', 'pop3', 'imap', 'exchange', 'mail'];
    if (services.some(s => mailServers.some(ms => s.includes(ms)))) {
      this._addTag(asset, 'mail');
      
      // Add specific mail server tags
      if (services.some(s => s.includes('smtp'))) this._addTag(asset, 'smtp');
      if (services.some(s => s.includes('exchange'))) this._addTag(asset, 'exchange');
      
      // Set asset type if unknown
      if (asset.assetType === 'unknown') {
        asset.assetType = 'mail-server';
      }
    }
    
    // Domain services detection
    const domainServices = ['ldap', 'kerberos', 'dns', 'active directory', 'ad'];
    if (services.some(s => domainServices.some(ds => s.includes(ds)))) {
      this._addTag(asset, 'directory-services');
      
      // Add specific domain service tags
      if (services.some(s => s.includes('ldap'))) this._addTag(asset, 'ldap');
      if (services.some(s => s.includes('dns'))) this._addTag(asset, 'dns');
      if (services.some(s => s.includes('active directory') || s.includes('ad'))) {
        this._addTag(asset, 'active-directory');
      }
      
      // Set asset type if unknown
      if (asset.assetType === 'unknown') {
        asset.assetType = 'domain-controller';
      }
    }
    
    // Remote access detection
    const remoteServices = ['ssh', 'rdp', 'vnc', 'telnet'];
    if (services.some(s => remoteServices.some(rs => s.includes(rs)))) {
      this._addTag(asset, 'remote-access');
      
      // Add specific remote access tags
      if (services.some(s => s.includes('ssh'))) this._addTag(asset, 'ssh');
      if (services.some(s => s.includes('rdp'))) this._addTag(asset, 'rdp');
      if (services.some(s => s.includes('vnc'))) this._addTag(asset, 'vnc');
      if (services.some(s => s.includes('telnet'))) this._addTag(asset, 'telnet');
    }
  }
  
  /**
   * Classify asset by open ports
   * @param {Object} asset - Asset object to classify
   * @private
   */
  static _classifyByPorts(asset) {
    if (!asset.ports || !Array.isArray(asset.ports) || asset.ports.length === 0) return;
    
    // Get all port numbers
    const portNumbers = asset.ports.map(p => p.port);
    
    // Add a tag for each common port
    const commonPorts = {
      22: 'ssh',
      23: 'telnet',
      25: 'smtp',
      53: 'dns',
      80: 'http',
      443: 'https',
      21: 'ftp',
      110: 'pop3',
      143: 'imap',
      389: 'ldap',
      636: 'ldaps',
      3306: 'mysql',
      5432: 'postgresql',
      1433: 'mssql',
      3389: 'rdp',
      5900: 'vnc',
      8080: 'http-alt',
      8443: 'https-alt',
      27017: 'mongodb',
      6379: 'redis',
      9200: 'elasticsearch',
      9300: 'elasticsearch-transport'
    };
    
    for (const port of portNumbers) {
      if (commonPorts[port]) {
        this._addTag(asset, commonPorts[port]);
        
        // Make inferences about asset type based on port
        if (port === 80 || port === 443 || port === 8080 || port === 8443) {
          if (asset.assetType === 'unknown') {
            asset.assetType = 'web-server';
          }
        }
        
        if (port === 389 || port === 636) {
          if (asset.assetType === 'unknown') {
            asset.assetType = 'domain-controller';
          }
        }
      }
    }
    
    // Add a tag indicating the asset has open ports
    if (portNumbers.length > 0) {
      this._addTag(asset, 'has-open-ports');
    }
  }
  
  /**
   * Classify asset by cloud provider information
   * @param {Object} asset - Asset object to classify
   * @private
   */
  static _classifyByCloudProvider(asset) {
    if (!asset.cloudProvider) return;
    
    // Add cloud provider tag
    this._addTag(asset, 'cloud');
    this._addTag(asset, asset.cloudProvider.toLowerCase());
    
    // Add specific cloud service tag if available
    if (asset.cloudType) {
      this._addTag(asset, asset.cloudType.toLowerCase());
    }
    
    // Add region tag if available
    if (asset.region) {
      this._addTag(asset, `region-${asset.region.toLowerCase()}`);
    }
    
    // Tag for publicly accessible resources
    if (asset.publiclyAccessible === true) {
      this._addTag(asset, 'public');
    }
    
    // For AWS resources, add additional classification
    if (asset.cloudProvider.toLowerCase() === 'aws') {
      if (asset.cloudType === 'ec2') {
        asset.assetType = asset.assetType === 'unknown' ? 'cloud-instance' : asset.assetType;
      } else if (asset.cloudType === 's3') {
        asset.assetType = asset.assetType === 'unknown' ? 'storage-bucket' : asset.assetType;
      } else if (asset.cloudType === 'rds') {
        asset.assetType = asset.assetType === 'unknown' ? 'database-instance' : asset.assetType;
        this._addTag(asset, 'database');
      } else if (asset.cloudType === 'lambda') {
        asset.assetType = asset.assetType === 'unknown' ? 'serverless-function' : asset.assetType;
      }
    }
    
    // For Azure resources
    if (asset.cloudProvider.toLowerCase() === 'azure') {
      if (asset.cloudType === 'virtual-machine') {
        asset.assetType = asset.assetType === 'unknown' ? 'cloud-instance' : asset.assetType;
      } else if (asset.cloudType === 'storage-account') {
        asset.assetType = asset.assetType === 'unknown' ? 'storage-account' : asset.assetType;
      }
    }
    
    // For GCP resources
    if (asset.cloudProvider.toLowerCase() === 'gcp') {
      if (asset.cloudType === 'compute-engine') {
        asset.assetType = asset.assetType === 'unknown' ? 'cloud-instance' : asset.assetType;
      } else if (asset.cloudType === 'cloud-storage') {
        asset.assetType = asset.assetType === 'unknown' ? 'storage-bucket' : asset.assetType;
      }
    }
  }
  
  /**
   * Classify asset by hostname patterns
   * @param {Object} asset - Asset object to classify
   * @private
   */
  static _classifyByHostname(asset) {
    if (!asset.hostname) return;
    
    const hostname = asset.hostname.toLowerCase();
    
    // Check for common naming patterns
    const patterns = {
      'web': ['web', 'www', 'http'],
      'db': ['db', 'database', 'sql', 'mysql', 'postgres'],
      'file': ['file', 'fs', 'storage', 'nas'],
      'mail': ['mail', 'smtp', 'exchange', 'mx'],
      'dc': ['dc', 'domain', 'ad', 'ldap', 'dns'],
      'app': ['app', 'api'],
      'dev': ['dev', 'development', 'test', 'stage'],
      'prod': ['prod', 'production'],
      'backup': ['backup', 'bkp'],
      'monitor': ['monitor', 'mon', 'nagios', 'zabbix', 'prometheus'],
      'proxy': ['proxy', 'fw', 'firewall', 'waf'],
      'vpn': ['vpn', 'gateway', 'gw']
    };
    
    // Check each pattern against the hostname
    for (const [category, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => hostname.includes(keyword))) {
        this._addTag(asset, category);
        
        // Make inferences about asset type for unknown assets
        if (asset.assetType === 'unknown') {
          switch (category) {
            case 'web':
              asset.assetType = 'web-server';
              break;
            case 'db':
              asset.assetType = 'database-server';
              break;
            case 'file':
              asset.assetType = 'file-server';
              break;
            case 'mail':
              asset.assetType = 'mail-server';
              break;
            case 'dc':
              asset.assetType = 'domain-controller';
              break;
            case 'proxy':
            case 'vpn':
              asset.assetType = 'network-device';
              break;
          }
        }
      }
    }
    
    // Extract environment information
    if (hostname.includes('dev')) this._addTag(asset, 'development');
    if (hostname.includes('test')) this._addTag(asset, 'test');
    if (hostname.includes('stage')) this._addTag(asset, 'staging');
    if (hostname.includes('prod')) this._addTag(asset, 'production');
    
    // Extract location information if present in hostname
    const locationPatterns = {
      'east': ['east', 'us-east', 'east-us'],
      'west': ['west', 'us-west', 'west-us'],
      'north': ['north', 'us-north', 'north-us'],
      'south': ['south', 'us-south', 'south-us'],
      'central': ['central', 'us-central', 'central-us'],
      'europe': ['europe', 'eu', 'eur'],
      'asia': ['asia', 'as', 'ap'],
    };
    
    for (const [region, keywords] of Object.entries(locationPatterns)) {
      if (keywords.some(keyword => hostname.includes(keyword))) {
        this._addTag(asset, `region-${region}`);
      }
    }
  }
  
  /**
   * Helper method to add a tag to an asset
   * @param {Object} asset - Asset object
   * @param {string} tag - Tag to add
   * @private
   */
  static _addTag(asset, tag) {
    if (!asset.tags) {
      asset.tags = [];
    }
    
    if (!asset.tags.includes(tag)) {
      asset.tags.push(tag);
    }
  }
}

module.exports = AssetClassifier;