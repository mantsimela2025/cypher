/**
 * WMI Scanner Module
 * 
 * Implements agentless Windows system analysis using WMI (Windows Management Instrumentation)
 * Provides deep system inventory, service enumeration, and Windows-specific security auditing
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class WMIScanner {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.credentials = options.credentials || {};
    this.namespace = options.namespace || 'root\\cimv2';
    this.maxConcurrency = options.maxConcurrency || 5;
    this.retries = options.retries || 2;
  }

  /**
   * Discover Windows systems and perform comprehensive WMI analysis
   */
  async discoverWindowsSystems(targets, credentials = {}) {
    console.log(`[WMI] Starting Windows system discovery for ${targets.length} targets`);
    const systems = [];
    const creds = { ...this.credentials, ...credentials };

    for (const target of targets) {
      try {
        const systemInfo = await this.scanWindowsSystem(target, creds);
        if (systemInfo) {
          systems.push(systemInfo);
        }
      } catch (error) {
        console.log(`[WMI] Failed to scan ${target}: ${error.message}`);
      }
    }

    console.log(`[WMI] Discovery complete. Found ${systems.length} Windows systems`);
    return {
      protocol: 'wmi',
      systemsFound: systems.length,
      systems: systems,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Perform comprehensive WMI scan of individual Windows system
   */
  async scanWindowsSystem(target, credentials) {
    const systemInfo = {
      target,
      accessible: false,
      timestamp: new Date().toISOString(),
      operatingSystem: {},
      hardware: {},
      services: [],
      processes: [],
      userAccounts: [],
      installedSoftware: [],
      networkConfiguration: {},
      securitySettings: {},
      eventLogs: [],
      shares: [],
      patches: []
    };

    try {
      // Test WMI connectivity first
      const connectivityTest = await this.testWMIConnection(target, credentials);
      if (!connectivityTest.accessible) {
        return null;
      }

      systemInfo.accessible = true;

      // Gather comprehensive system information
      await Promise.allSettled([
        this.getOperatingSystemInfo(target, credentials).then(info => systemInfo.operatingSystem = info),
        this.getHardwareInfo(target, credentials).then(info => systemInfo.hardware = info),
        this.getServiceInfo(target, credentials).then(info => systemInfo.services = info),
        this.getProcessInfo(target, credentials).then(info => systemInfo.processes = info),
        this.getUserAccountInfo(target, credentials).then(info => systemInfo.userAccounts = info),
        this.getInstalledSoftware(target, credentials).then(info => systemInfo.installedSoftware = info),
        this.getNetworkConfiguration(target, credentials).then(info => systemInfo.networkConfiguration = info),
        this.getSecuritySettings(target, credentials).then(info => systemInfo.securitySettings = info),
        this.getShares(target, credentials).then(info => systemInfo.shares = info),
        this.getInstalledPatches(target, credentials).then(info => systemInfo.patches = info)
      ]);

      return systemInfo;

    } catch (error) {
      console.log(`[WMI] Error scanning ${target}: ${error.message}`);
      return null;
    }
  }

  /**
   * Test WMI connectivity to target system
   */
  async testWMIConnection(target, credentials) {
    try {
      const query = 'SELECT * FROM Win32_OperatingSystem';
      const result = await this.executeWMIQuery(target, query, credentials);
      
      return {
        accessible: result && result.length > 0,
        responseTime: Date.now(),
        authMethod: credentials.username ? 'credentials' : 'anonymous'
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Get detailed operating system information
   */
  async getOperatingSystemInfo(target, credentials) {
    try {
      const queries = {
        os: 'SELECT * FROM Win32_OperatingSystem',
        computerSystem: 'SELECT * FROM Win32_ComputerSystem',
        bios: 'SELECT * FROM Win32_BIOS'
      };

      const results = await Promise.allSettled(
        Object.entries(queries).map(([key, query]) =>
          this.executeWMIQuery(target, query, credentials).then(result => ({ [key]: result }))
        )
      );

      const osInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(osInfo, result.value);
        }
      });

      // Process OS information
      const os = osInfo.os?.[0] || {};
      const cs = osInfo.computerSystem?.[0] || {};
      const bios = osInfo.bios?.[0] || {};

      return {
        name: os.Caption || 'Unknown',
        version: os.Version || 'Unknown',
        buildNumber: os.BuildNumber || 'Unknown',
        servicePackVersion: os.CSDVersion || 'None',
        architecture: os.OSArchitecture || 'Unknown',
        installDate: os.InstallDate || 'Unknown',
        lastBootUpTime: os.LastBootUpTime || 'Unknown',
        computerName: cs.Name || 'Unknown',
        domain: cs.Domain || 'WORKGROUP',
        manufacturer: cs.Manufacturer || 'Unknown',
        model: cs.Model || 'Unknown',
        totalMemory: cs.TotalPhysicalMemory || 0,
        biosVersion: bios.SMBIOSBIOSVersion || 'Unknown',
        biosReleaseDate: bios.ReleaseDate || 'Unknown'
      };
    } catch (error) {
      console.log(`[WMI] Error getting OS info: ${error.message}`);
      return {};
    }
  }

  /**
   * Get hardware configuration details
   */
  async getHardwareInfo(target, credentials) {
    try {
      const queries = {
        processors: 'SELECT * FROM Win32_Processor',
        memory: 'SELECT * FROM Win32_PhysicalMemory',
        diskDrives: 'SELECT * FROM Win32_DiskDrive',
        networkAdapters: 'SELECT * FROM Win32_NetworkAdapter WHERE NetConnectionStatus = 2'
      };

      const results = await Promise.allSettled(
        Object.entries(queries).map(([key, query]) =>
          this.executeWMIQuery(target, query, credentials).then(result => ({ [key]: result }))
        )
      );

      const hwInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(hwInfo, result.value);
        }
      });

      return {
        processors: (hwInfo.processors || []).map(proc => ({
          name: proc.Name,
          cores: proc.NumberOfCores,
          logicalProcessors: proc.NumberOfLogicalProcessors,
          clockSpeed: proc.MaxClockSpeed,
          architecture: proc.Architecture
        })),
        memory: (hwInfo.memory || []).map(mem => ({
          capacity: mem.Capacity,
          speed: mem.Speed,
          manufacturer: mem.Manufacturer,
          partNumber: mem.PartNumber
        })),
        diskDrives: (hwInfo.diskDrives || []).map(disk => ({
          model: disk.Model,
          size: disk.Size,
          interfaceType: disk.InterfaceType,
          mediaType: disk.MediaType
        })),
        networkAdapters: (hwInfo.networkAdapters || []).map(adapter => ({
          name: adapter.Name,
          macAddress: adapter.MACAddress,
          adapterType: adapter.AdapterType,
          speed: adapter.Speed
        }))
      };
    } catch (error) {
      console.log(`[WMI] Error getting hardware info: ${error.message}`);
      return {};
    }
  }

  /**
   * Get running services information
   */
  async getServiceInfo(target, credentials) {
    try {
      const query = 'SELECT * FROM Win32_Service';
      const services = await this.executeWMIQuery(target, query, credentials);

      return (services || []).map(service => ({
        name: service.Name,
        displayName: service.DisplayName,
        state: service.State,
        startMode: service.StartMode,
        pathName: service.PathName,
        serviceType: service.ServiceType,
        account: service.StartName,
        description: service.Description
      })).filter(service => service.name); // Filter out empty results
    } catch (error) {
      console.log(`[WMI] Error getting service info: ${error.message}`);
      return [];
    }
  }

  /**
   * Get running processes information
   */
  async getProcessInfo(target, credentials) {
    try {
      const query = 'SELECT * FROM Win32_Process';
      const processes = await this.executeWMIQuery(target, query, credentials);

      return (processes || []).slice(0, 50).map(process => ({ // Limit to first 50 processes
        name: process.Name,
        processId: process.ProcessId,
        parentProcessId: process.ParentProcessId,
        commandLine: process.CommandLine,
        executablePath: process.ExecutablePath,
        creationDate: process.CreationDate,
        workingSetSize: process.WorkingSetSize
      })).filter(process => process.name);
    } catch (error) {
      console.log(`[WMI] Error getting process info: ${error.message}`);
      return [];
    }
  }

  /**
   * Get user account information
   */
  async getUserAccountInfo(target, credentials) {
    try {
      const queries = {
        users: 'SELECT * FROM Win32_UserAccount WHERE LocalAccount = TRUE',
        groups: 'SELECT * FROM Win32_Group WHERE LocalAccount = TRUE'
      };

      const results = await Promise.allSettled(
        Object.entries(queries).map(([key, query]) =>
          this.executeWMIQuery(target, query, credentials).then(result => ({ [key]: result }))
        )
      );

      const userInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(userInfo, result.value);
        }
      });

      return {
        users: (userInfo.users || []).map(user => ({
          name: user.Name,
          fullName: user.FullName,
          description: user.Description,
          disabled: user.Disabled,
          lockout: user.Lockout,
          passwordChangeable: user.PasswordChangeable,
          passwordExpires: user.PasswordExpires,
          passwordRequired: user.PasswordRequired,
          lastLogin: user.LastLogin
        })),
        groups: (userInfo.groups || []).map(group => ({
          name: group.Name,
          description: group.Description,
          domain: group.Domain
        }))
      };
    } catch (error) {
      console.log(`[WMI] Error getting user account info: ${error.message}`);
      return { users: [], groups: [] };
    }
  }

  /**
   * Get installed software inventory
   */
  async getInstalledSoftware(target, credentials) {
    try {
      const query = 'SELECT * FROM Win32_Product';
      const software = await this.executeWMIQuery(target, query, credentials);

      return (software || []).map(app => ({
        name: app.Name,
        version: app.Version,
        vendor: app.Vendor,
        installDate: app.InstallDate,
        installLocation: app.InstallLocation,
        packageCache: app.PackageCache
      })).filter(app => app.name);
    } catch (error) {
      console.log(`[WMI] Error getting installed software: ${error.message}`);
      return [];
    }
  }

  /**
   * Get network configuration
   */
  async getNetworkConfiguration(target, credentials) {
    try {
      const queries = {
        adapters: 'SELECT * FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled = TRUE',
        routes: 'SELECT * FROM Win32_IP4RouteTable'
      };

      const results = await Promise.allSettled(
        Object.entries(queries).map(([key, query]) =>
          this.executeWMIQuery(target, query, credentials).then(result => ({ [key]: result }))
        )
      );

      const netInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(netInfo, result.value);
        }
      });

      return {
        adapters: (netInfo.adapters || []).map(adapter => ({
          description: adapter.Description,
          ipAddresses: adapter.IPAddress,
          subnetMasks: adapter.IPSubnet,
          defaultGateways: adapter.DefaultIPGateway,
          dnsServers: adapter.DNSServerSearchOrder,
          dhcpEnabled: adapter.DHCPEnabled,
          macAddress: adapter.MACAddress
        })),
        routes: (netInfo.routes || []).slice(0, 20).map(route => ({
          destination: route.Destination,
          mask: route.Mask,
          nextHop: route.NextHop,
          metric: route.Metric1,
          interfaceIndex: route.InterfaceIndex
        }))
      };
    } catch (error) {
      console.log(`[WMI] Error getting network configuration: ${error.message}`);
      return {};
    }
  }

  /**
   * Get security settings and configurations
   */
  async getSecuritySettings(target, credentials) {
    try {
      const queries = {
        firewall: 'SELECT * FROM Win32_SystemAccount',
        antivirus: 'SELECT * FROM AntiVirusProduct',
        shares: 'SELECT * FROM Win32_Share'
      };

      const results = await Promise.allSettled(
        Object.entries(queries).map(([key, query]) =>
          this.executeWMIQuery(target, query, credentials, 'root\\SecurityCenter2').then(result => ({ [key]: result }))
        )
      );

      const secInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(secInfo, result.value);
        }
      });

      return {
        systemAccounts: (secInfo.firewall || []).length,
        antivirusProducts: (secInfo.antivirus || []).map(av => ({
          displayName: av.displayName,
          instanceGuid: av.instanceGuid,
          pathToSignedProductExe: av.pathToSignedProductExe,
          pathToSignedReportingExe: av.pathToSignedReportingExe,
          productState: av.productState
        })),
        shares: (secInfo.shares || []).map(share => ({
          name: share.Name,
          path: share.Path,
          type: share.Type,
          description: share.Description
        }))
      };
    } catch (error) {
      console.log(`[WMI] Error getting security settings: ${error.message}`);
      return {};
    }
  }

  /**
   * Get shared folders and permissions
   */
  async getShares(target, credentials) {
    try {
      const query = 'SELECT * FROM Win32_Share';
      const shares = await this.executeWMIQuery(target, query, credentials);

      return (shares || []).map(share => ({
        name: share.Name,
        path: share.Path,
        type: this.mapShareType(share.Type),
        description: share.Description,
        allowMaximum: share.AllowMaximum,
        maximumAllowed: share.MaximumAllowed
      })).filter(share => share.name && share.name !== 'IPC$');
    } catch (error) {
      console.log(`[WMI] Error getting shares: ${error.message}`);
      return [];
    }
  }

  /**
   * Get installed patches and updates
   */
  async getInstalledPatches(target, credentials) {
    try {
      const query = 'SELECT * FROM Win32_QuickFixEngineering';
      const patches = await this.executeWMIQuery(target, query, credentials);

      return (patches || []).map(patch => ({
        hotFixId: patch.HotFixID,
        description: patch.Description,
        installedBy: patch.InstalledBy,
        installedOn: patch.InstalledOn,
        servicePackInEffect: patch.ServicePackInEffect
      })).filter(patch => patch.hotFixId);
    } catch (error) {
      console.log(`[WMI] Error getting installed patches: ${error.message}`);
      return [];
    }
  }

  /**
   * Execute WMI query using wmic or PowerShell
   */
  async executeWMIQuery(target, query, credentials, namespace = null) {
    return new Promise((resolve, reject) => {
      const ns = namespace || this.namespace;
      const timeout = setTimeout(() => {
        reject(new Error('WMI query timeout'));
      }, this.timeout);

      // Build wmic command with credentials
      let cmd = `wmic`;
      if (credentials.username && credentials.password) {
        cmd += ` /node:"${target}" /user:"${credentials.username}" /password:"${credentials.password}"`;
      } else {
        cmd += ` /node:"${target}"`;
      }
      cmd += ` /namespace:"${ns}" path ${this.extractClassName(query)} get * /format:list`;

      exec(cmd, { timeout: this.timeout }, (error, stdout, stderr) => {
        clearTimeout(timeout);
        
        if (error) {
          // Fallback to PowerShell if wmic fails
          this.executePowerShellWMI(target, query, credentials, ns)
            .then(resolve)
            .catch(reject);
          return;
        }

        try {
          const results = this.parseWMICOutput(stdout);
          resolve(results);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  }

  /**
   * Execute WMI query using PowerShell as fallback
   */
  async executePowerShellWMI(target, query, credentials, namespace) {
    return new Promise((resolve, reject) => {
      let psScript = '';
      
      if (credentials.username && credentials.password) {
        psScript = `
          $securePassword = ConvertTo-SecureString "${credentials.password}" -AsPlainText -Force
          $credential = New-Object System.Management.Automation.PSCredential("${credentials.username}", $securePassword)
          Get-WmiObject -ComputerName "${target}" -Credential $credential -Namespace "${namespace}" -Query "${query}" | ConvertTo-Json
        `;
      } else {
        psScript = `Get-WmiObject -ComputerName "${target}" -Namespace "${namespace}" -Query "${query}" | ConvertTo-Json`;
      }

      const cmd = `powershell -Command "${psScript.replace(/"/g, '\\"')}"`;
      
      exec(cmd, { timeout: this.timeout }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        try {
          const results = stdout.trim() ? JSON.parse(stdout) : [];
          resolve(Array.isArray(results) ? results : [results]);
        } catch (parseError) {
          resolve([]); // Return empty array if parsing fails
        }
      });
    });
  }

  /**
   * Extract class name from WMI query
   */
  extractClassName(query) {
    const match = query.match(/FROM\s+(\w+)/i);
    return match ? match[1] : 'Win32_OperatingSystem';
  }

  /**
   * Parse wmic output format
   */
  parseWMICOutput(output) {
    const results = [];
    const lines = output.split('\n').filter(line => line.trim());
    
    let currentObject = {};
    
    for (const line of lines) {
      if (line.includes('=')) {
        const [key, value] = line.split('=', 2);
        const cleanKey = key.trim();
        const cleanValue = value ? value.trim() : '';
        
        if (cleanKey && cleanValue) {
          currentObject[cleanKey] = cleanValue;
        }
      } else if (line.trim() === '' && Object.keys(currentObject).length > 0) {
        results.push(currentObject);
        currentObject = {};
      }
    }
    
    // Add the last object if it has data
    if (Object.keys(currentObject).length > 0) {
      results.push(currentObject);
    }
    
    return results;
  }

  /**
   * Map share type number to readable name
   */
  mapShareType(type) {
    const types = {
      0: 'Disk Drive',
      1: 'Print Queue',
      2: 'Device',
      3: 'IPC',
      2147483648: 'Disk Drive Admin',
      2147483649: 'Print Queue Admin',
      2147483650: 'Device Admin',
      2147483651: 'IPC Admin'
    };
    return types[type] || 'Unknown';
  }

  /**
   * Parse network range into individual targets
   */
  parseNetworkRange(range) {
    const targets = [];
    
    if (range.includes('/')) {
      // CIDR notation
      const [network, prefixLength] = range.split('/');
      const prefix = parseInt(prefixLength);
      
      if (prefix >= 24) {
        const baseIP = network.split('.').map(Number);
        const hostBits = 32 - prefix;
        const maxHosts = Math.min(Math.pow(2, hostBits) - 2, 254);
        
        for (let i = 1; i <= maxHosts; i++) {
          targets.push(`${baseIP[0]}.${baseIP[1]}.${baseIP[2]}.${i}`);
        }
      }
    } else if (range.includes('-')) {
      // Range notation
      const [start, end] = range.split('-');
      const startParts = start.split('.').map(Number);
      const endNum = parseInt(end);
      
      for (let i = startParts[3]; i <= endNum; i++) {
        targets.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
      }
    } else {
      // Single IP or hostname
      targets.push(range);
    }
    
    return targets.slice(0, 50); // Limit for safety
  }
}

module.exports = WMIScanner;