/**
 * Enhanced SSH Scanner Module
 * 
 * Implements deep Linux system analysis via SSH with comprehensive configuration auditing
 * Provides credentialed scanning capabilities for detailed system assessment
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class EnhancedSSHScanner {
  constructor(options = {}) {
    this.timeout = options.timeout || 30000;
    this.credentials = options.credentials || {};
    this.maxConcurrency = options.maxConcurrency || 3;
    this.retries = options.retries || 2;
    this.sshOptions = options.sshOptions || {
      connectTimeout: 10,
      strictHostKeyChecking: 'no',
      userKnownHostsFile: '/dev/null'
    };
  }

  /**
   * Discover and analyze Linux systems via SSH
   */
  async discoverLinuxSystems(targets, credentials = {}) {
    console.log(`[SSH] Starting Linux system discovery for ${targets.length} targets`);
    const systems = [];
    const creds = { ...this.credentials, ...credentials };

    for (const target of targets) {
      try {
        const systemInfo = await this.scanLinuxSystem(target, creds);
        if (systemInfo) {
          systems.push(systemInfo);
        }
      } catch (error) {
        console.log(`[SSH] Failed to scan ${target}: ${error.message}`);
      }
    }

    console.log(`[SSH] Discovery complete. Found ${systems.length} Linux systems`);
    return {
      protocol: 'ssh',
      systemsFound: systems.length,
      systems: systems,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Perform comprehensive SSH-based system analysis
   */
  async scanLinuxSystem(target, credentials) {
    const systemInfo = {
      target,
      accessible: false,
      timestamp: new Date().toISOString(),
      operatingSystem: {},
      hardware: {},
      users: [],
      groups: [],
      services: [],
      processes: [],
      networkConfiguration: {},
      fileSystemInfo: [],
      installedPackages: [],
      securityConfiguration: {},
      logFiles: [],
      cronJobs: [],
      environmentVariables: {},
      kernelModules: [],
      openPorts: []
    };

    try {
      // Test SSH connectivity
      const connectivityTest = await this.testSSHConnection(target, credentials);
      if (!connectivityTest.accessible) {
        return null;
      }

      systemInfo.accessible = true;
      systemInfo.authMethod = connectivityTest.authMethod;

      // Gather comprehensive system information
      await Promise.allSettled([
        this.getOperatingSystemInfo(target, credentials).then(info => systemInfo.operatingSystem = info),
        this.getHardwareInfo(target, credentials).then(info => systemInfo.hardware = info),
        this.getUserInfo(target, credentials).then(info => systemInfo.users = info.users || []),
        this.getGroupInfo(target, credentials).then(info => systemInfo.groups = info),
        this.getServiceInfo(target, credentials).then(info => systemInfo.services = info),
        this.getProcessInfo(target, credentials).then(info => systemInfo.processes = info),
        this.getNetworkConfiguration(target, credentials).then(info => systemInfo.networkConfiguration = info),
        this.getFileSystemInfo(target, credentials).then(info => systemInfo.fileSystemInfo = info),
        this.getInstalledPackages(target, credentials).then(info => systemInfo.installedPackages = info),
        this.getSecurityConfiguration(target, credentials).then(info => systemInfo.securityConfiguration = info),
        this.getCronJobs(target, credentials).then(info => systemInfo.cronJobs = info),
        this.getKernelModules(target, credentials).then(info => systemInfo.kernelModules = info),
        this.getOpenPorts(target, credentials).then(info => systemInfo.openPorts = info)
      ]);

      return systemInfo;

    } catch (error) {
      console.log(`[SSH] Error scanning ${target}: ${error.message}`);
      return null;
    }
  }

  /**
   * Test SSH connectivity
   */
  async testSSHConnection(target, credentials) {
    try {
      const result = await this.executeSSHCommand(target, 'whoami', credentials);
      
      return {
        accessible: result && result.trim().length > 0,
        responseTime: Date.now(),
        authMethod: credentials.privateKey ? 'key' : credentials.password ? 'password' : 'none',
        user: result ? result.trim() : null
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Get operating system information
   */
  async getOperatingSystemInfo(target, credentials) {
    try {
      const commands = {
        osRelease: 'cat /etc/os-release 2>/dev/null || cat /etc/redhat-release 2>/dev/null || uname -a',
        kernelVersion: 'uname -r',
        systemInfo: 'uname -a',
        uptime: 'uptime',
        timezone: 'timedatectl status 2>/dev/null || date',
        hostname: 'hostname -f 2>/dev/null || hostname'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const osInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(osInfo, result.value);
        }
      });

      return {
        distribution: this.parseOSRelease(osInfo.osRelease || ''),
        kernelVersion: (osInfo.kernelVersion || '').trim(),
        architecture: this.extractArchitecture(osInfo.systemInfo || ''),
        hostname: (osInfo.hostname || '').trim(),
        uptime: (osInfo.uptime || '').trim(),
        timezone: this.parseTimezone(osInfo.timezone || ''),
        bootTime: this.calculateBootTime(osInfo.uptime || '')
      };
    } catch (error) {
      console.log(`[SSH] Error getting OS info: ${error.message}`);
      return {};
    }
  }

  /**
   * Get hardware information
   */
  async getHardwareInfo(target, credentials) {
    try {
      const commands = {
        cpu: 'cat /proc/cpuinfo',
        memory: 'cat /proc/meminfo',
        diskSpace: 'df -h',
        blockDevices: 'lsblk 2>/dev/null',
        pciDevices: 'lspci 2>/dev/null',
        usbDevices: 'lsusb 2>/dev/null'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const hwInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(hwInfo, result.value);
        }
      });

      return {
        cpu: this.parseCPUInfo(hwInfo.cpu || ''),
        memory: this.parseMemoryInfo(hwInfo.memory || ''),
        diskSpace: this.parseDiskSpace(hwInfo.diskSpace || ''),
        blockDevices: this.parseBlockDevices(hwInfo.blockDevices || ''),
        pciDevices: this.parseDevices(hwInfo.pciDevices || '', 'pci'),
        usbDevices: this.parseDevices(hwInfo.usbDevices || '', 'usb')
      };
    } catch (error) {
      console.log(`[SSH] Error getting hardware info: ${error.message}`);
      return {};
    }
  }

  /**
   * Get user account information
   */
  async getUserInfo(target, credentials) {
    try {
      const commands = {
        passwd: 'cat /etc/passwd',
        shadow: 'sudo cat /etc/shadow 2>/dev/null || echo "Permission denied"',
        loginDefs: 'cat /etc/login.defs 2>/dev/null',
        sudoers: 'sudo cat /etc/sudoers 2>/dev/null | grep -v "^#" | grep -v "^$" || echo "Permission denied"'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const userInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(userInfo, result.value);
        }
      });

      return {
        users: this.parsePasswdFile(userInfo.passwd || ''),
        shadowInfo: this.parseShadowFile(userInfo.shadow || ''),
        sudoersConfig: this.parseSudoers(userInfo.sudoers || ''),
        loginDefaults: this.parseLoginDefs(userInfo.loginDefs || '')
      };
    } catch (error) {
      console.log(`[SSH] Error getting user info: ${error.message}`);
      return { users: [] };
    }
  }

  /**
   * Get group information
   */
  async getGroupInfo(target, credentials) {
    try {
      const groupData = await this.executeSSHCommand(target, 'cat /etc/group', credentials);
      return this.parseGroupFile(groupData || '');
    } catch (error) {
      console.log(`[SSH] Error getting group info: ${error.message}`);
      return [];
    }
  }

  /**
   * Get running services information
   */
  async getServiceInfo(target, credentials) {
    try {
      const commands = {
        systemctl: 'systemctl list-units --type=service --state=running --no-pager 2>/dev/null',
        initd: 'service --status-all 2>/dev/null',
        processes: 'ps aux --no-headers'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const serviceInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(serviceInfo, result.value);
        }
      });

      return {
        systemdServices: this.parseSystemdServices(serviceInfo.systemctl || ''),
        initdServices: this.parseInitdServices(serviceInfo.initd || ''),
        runningProcesses: this.parseProcesses(serviceInfo.processes || '').slice(0, 30) // Limit processes
      };
    } catch (error) {
      console.log(`[SSH] Error getting service info: ${error.message}`);
      return {};
    }
  }

  /**
   * Get running processes information
   */
  async getProcessInfo(target, credentials) {
    try {
      const processData = await this.executeSSHCommand(target, 'ps aux --no-headers', credentials);
      return this.parseProcesses(processData || '').slice(0, 50); // Limit to 50 processes
    } catch (error) {
      console.log(`[SSH] Error getting process info: ${error.message}`);
      return [];
    }
  }

  /**
   * Get network configuration
   */
  async getNetworkConfiguration(target, credentials) {
    try {
      const commands = {
        interfaces: 'ip addr show 2>/dev/null || ifconfig -a 2>/dev/null',
        routing: 'ip route show 2>/dev/null || route -n 2>/dev/null',
        netstat: 'netstat -tuln 2>/dev/null',
        iptables: 'sudo iptables -L -n 2>/dev/null || echo "Permission denied"',
        resolvConf: 'cat /etc/resolv.conf 2>/dev/null'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const netInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(netInfo, result.value);
        }
      });

      return {
        interfaces: this.parseNetworkInterfaces(netInfo.interfaces || ''),
        routes: this.parseRoutingTable(netInfo.routing || ''),
        listeningPorts: this.parseNetstat(netInfo.netstat || ''),
        firewallRules: this.parseIptables(netInfo.iptables || ''),
        dnsServers: this.parseResolvConf(netInfo.resolvConf || '')
      };
    } catch (error) {
      console.log(`[SSH] Error getting network configuration: ${error.message}`);
      return {};
    }
  }

  /**
   * Get file system information
   */
  async getFileSystemInfo(target, credentials) {
    try {
      const commands = {
        mounts: 'mount | grep -v "^tmpfs\\|^devpts\\|^sysfs\\|^proc"',
        fstab: 'cat /etc/fstab 2>/dev/null',
        diskUsage: 'df -h'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const fsInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(fsInfo, result.value);
        }
      });

      return {
        mountPoints: this.parseMounts(fsInfo.mounts || ''),
        fstabEntries: this.parseFstab(fsInfo.fstab || ''),
        diskUsage: this.parseDiskSpace(fsInfo.diskUsage || '')
      };
    } catch (error) {
      console.log(`[SSH] Error getting filesystem info: ${error.message}`);
      return [];
    }
  }

  /**
   * Get installed packages
   */
  async getInstalledPackages(target, credentials) {
    try {
      const commands = {
        rpm: 'rpm -qa 2>/dev/null',
        dpkg: 'dpkg -l 2>/dev/null',
        yum: 'yum list installed 2>/dev/null',
        apt: 'apt list --installed 2>/dev/null'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const packageInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value && Object.values(result.value)[0]) {
          Object.assign(packageInfo, result.value);
        }
      });

      return this.parsePackageInfo(packageInfo);
    } catch (error) {
      console.log(`[SSH] Error getting installed packages: ${error.message}`);
      return [];
    }
  }

  /**
   * Get security configuration
   */
  async getSecurityConfiguration(target, credentials) {
    try {
      const commands = {
        selinux: 'getenforce 2>/dev/null',
        apparmor: 'aa-status 2>/dev/null',
        fail2ban: 'sudo fail2ban-client status 2>/dev/null',
        sshConfig: 'cat /etc/ssh/sshd_config 2>/dev/null',
        pamConfig: 'ls /etc/pam.d/ 2>/dev/null'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const secInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(secInfo, result.value);
        }
      });

      return {
        selinuxStatus: (secInfo.selinux || '').trim(),
        apparmorStatus: this.parseApparmorStatus(secInfo.apparmor || ''),
        fail2banStatus: this.parseFail2banStatus(secInfo.fail2ban || ''),
        sshConfiguration: this.parseSSHConfig(secInfo.sshConfig || ''),
        pamModules: this.parsePAMConfig(secInfo.pamConfig || '')
      };
    } catch (error) {
      console.log(`[SSH] Error getting security configuration: ${error.message}`);
      return {};
    }
  }

  /**
   * Get cron jobs
   */
  async getCronJobs(target, credentials) {
    try {
      const commands = {
        systemCron: 'sudo crontab -l 2>/dev/null',
        cronD: 'ls /etc/cron.d/ 2>/dev/null',
        cronTabs: 'ls /var/spool/cron/crontabs/ 2>/dev/null || ls /var/spool/cron/ 2>/dev/null'
      };

      const results = await Promise.allSettled(
        Object.entries(commands).map(([key, cmd]) =>
          this.executeSSHCommand(target, cmd, credentials).then(output => ({ [key]: output }))
        )
      );

      const cronInfo = {};
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          Object.assign(cronInfo, result.value);
        }
      });

      return {
        systemCrontab: this.parseCrontab(cronInfo.systemCron || ''),
        cronDFiles: (cronInfo.cronD || '').split('\n').filter(f => f.trim()),
        userCrontabs: (cronInfo.cronTabs || '').split('\n').filter(f => f.trim())
      };
    } catch (error) {
      console.log(`[SSH] Error getting cron jobs: ${error.message}`);
      return {};
    }
  }

  /**
   * Get kernel modules
   */
  async getKernelModules(target, credentials) {
    try {
      const moduleData = await this.executeSSHCommand(target, 'lsmod', credentials);
      return this.parseKernelModules(moduleData || '');
    } catch (error) {
      console.log(`[SSH] Error getting kernel modules: ${error.message}`);
      return [];
    }
  }

  /**
   * Get open ports
   */
  async getOpenPorts(target, credentials) {
    try {
      const netstatData = await this.executeSSHCommand(target, 'netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null', credentials);
      return this.parseNetstat(netstatData || '');
    } catch (error) {
      console.log(`[SSH] Error getting open ports: ${error.message}`);
      return [];
    }
  }

  /**
   * Execute SSH command
   */
  async executeSSHCommand(target, command, credentials) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('SSH command timeout'));
      }, this.timeout);

      // Build SSH command
      let sshCmd = ['ssh'];
      
      // Add SSH options
      Object.entries(this.sshOptions).forEach(([key, value]) => {
        const optionName = key.replace(/([A-Z])/g, '$1').toLowerCase();
        sshCmd.push('-o', `${optionName}=${value}`);
      });

      // Add authentication
      if (credentials.privateKey) {
        sshCmd.push('-i', credentials.privateKey);
      }
      
      if (credentials.port) {
        sshCmd.push('-p', credentials.port.toString());
      }

      // Add target and command
      const userHost = credentials.username ? `${credentials.username}@${target}` : target;
      sshCmd.push(userHost, command);

      const ssh = spawn(sshCmd[0], sshCmd.slice(1), {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      ssh.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ssh.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ssh.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`SSH command failed with code ${code}: ${stderr}`));
        }
      });

      ssh.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Send password if using password authentication
      if (credentials.password && !credentials.privateKey) {
        ssh.stdin.write(credentials.password + '\n');
      }
      
      ssh.stdin.end();
    });
  }

  // ============ PARSING METHODS ============

  parseOSRelease(data) {
    const lines = data.split('\n');
    const info = {};
    
    lines.forEach(line => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        info[match[1]] = match[2].replace(/"/g, '');
      }
    });

    return {
      name: info.NAME || info.PRETTY_NAME || 'Unknown',
      version: info.VERSION || info.VERSION_ID || 'Unknown',
      id: info.ID || 'unknown',
      codename: info.VERSION_CODENAME || info.UBUNTU_CODENAME || ''
    };
  }

  extractArchitecture(systemInfo) {
    if (systemInfo.includes('x86_64')) return 'x86_64';
    if (systemInfo.includes('i386') || systemInfo.includes('i686')) return 'i386';
    if (systemInfo.includes('aarch64')) return 'aarch64';
    if (systemInfo.includes('armv7l')) return 'armv7l';
    return 'unknown';
  }

  parseTimezone(timezoneInfo) {
    const match = timezoneInfo.match(/Time zone:\s*([^\s]+)/);
    return match ? match[1] : 'Unknown';
  }

  calculateBootTime(uptime) {
    const match = uptime.match(/up\s+(.+?),\s+\d+\s+user/);
    if (match) {
      const uptimeStr = match[1];
      // Simple approximation - would need more sophisticated parsing for exact boot time
      return new Date(Date.now() - this.parseUptimeToMs(uptimeStr)).toISOString();
    }
    return 'Unknown';
  }

  parseUptimeToMs(uptimeStr) {
    let ms = 0;
    const days = uptimeStr.match(/(\d+)\s+day/);
    const hours = uptimeStr.match(/(\d+):(\d+)/);
    
    if (days) ms += parseInt(days[1]) * 24 * 60 * 60 * 1000;
    if (hours) {
      ms += parseInt(hours[1]) * 60 * 60 * 1000;
      ms += parseInt(hours[2]) * 60 * 1000;
    }
    
    return ms;
  }

  parseCPUInfo(cpuInfo) {
    const processors = [];
    const lines = cpuInfo.split('\n');
    let currentProcessor = {};

    lines.forEach(line => {
      if (line.trim() === '' && Object.keys(currentProcessor).length > 0) {
        processors.push(currentProcessor);
        currentProcessor = {};
      } else {
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          const key = match[1].trim().replace(/\s+/g, '_').toLowerCase();
          currentProcessor[key] = match[2].trim();
        }
      }
    });

    return {
      processorCount: processors.length,
      modelName: processors[0]?.model_name || 'Unknown',
      vendor: processors[0]?.vendor_id || 'Unknown',
      cores: processors[0]?.cpu_cores || 'Unknown',
      clockSpeed: processors[0]?.cpu_mhz || 'Unknown'
    };
  }

  parseMemoryInfo(memInfo) {
    const info = {};
    const lines = memInfo.split('\n');

    lines.forEach(line => {
      const match = line.match(/^([^:]+):\s*(\d+)\s*kB$/);
      if (match) {
        info[match[1]] = parseInt(match[2]) * 1024; // Convert to bytes
      }
    });

    return {
      totalMemory: info.MemTotal || 0,
      freeMemory: info.MemFree || 0,
      availableMemory: info.MemAvailable || 0,
      buffers: info.Buffers || 0,
      cached: info.Cached || 0,
      swapTotal: info.SwapTotal || 0,
      swapFree: info.SwapFree || 0
    };
  }

  parseDiskSpace(diskData) {
    const filesystems = [];
    const lines = diskData.split('\n').slice(1); // Skip header

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        filesystems.push({
          filesystem: parts[0],
          size: parts[1],
          used: parts[2],
          available: parts[3],
          usePercent: parts[4],
          mountPoint: parts[5]
        });
      }
    });

    return filesystems;
  }

  parseBlockDevices(lsblkData) {
    const devices = [];
    const lines = lsblkData.split('\n').slice(1); // Skip header
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        devices.push({
          name: parts[0],
          majorMinor: parts[1],
          removable: parts[2] === '1',
          size: parts[3],
          readonly: parts[4] === '1',
          type: parts[5],
          mountPoint: parts[6] || ''
        });
      }
    });

    return devices;
  }

  parseDevices(deviceData, type) {
    const devices = [];
    const lines = deviceData.split('\n');

    lines.forEach(line => {
      if (line.trim() && !line.includes('Permission denied')) {
        devices.push({
          type: type,
          description: line.trim()
        });
      }
    });

    return devices;
  }

  parsePasswdFile(passwdData) {
    const users = [];
    const lines = passwdData.split('\n');

    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 7) {
        users.push({
          username: parts[0],
          uid: parseInt(parts[2]),
          gid: parseInt(parts[3]),
          gecos: parts[4],
          homeDirectory: parts[5],
          shell: parts[6],
          isSystemUser: parseInt(parts[2]) < 1000
        });
      }
    });

    return users;
  }

  parseShadowFile(shadowData) {
    if (shadowData.includes('Permission denied')) {
      return { accessible: false };
    }

    const shadowInfo = [];
    const lines = shadowData.split('\n');

    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 9) {
        shadowInfo.push({
          username: parts[0],
          passwordHash: parts[1] !== '' && parts[1] !== '!' && parts[1] !== '*',
          lastChanged: parts[2] ? new Date(parseInt(parts[2]) * 24 * 60 * 60 * 1000).toISOString() : null,
          minAge: parts[3] || null,
          maxAge: parts[4] || null,
          warnPeriod: parts[5] || null,
          inactive: parts[6] || null,
          expires: parts[7] ? new Date(parseInt(parts[7]) * 24 * 60 * 60 * 1000).toISOString() : null
        });
      }
    });

    return { accessible: true, users: shadowInfo };
  }

  parseSudoers(sudoersData) {
    if (sudoersData.includes('Permission denied')) {
      return { accessible: false };
    }

    const rules = [];
    const lines = sudoersData.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        rules.push(trimmed);
      }
    });

    return { accessible: true, rules };
  }

  parseLoginDefs(loginDefsData) {
    const settings = {};
    const lines = loginDefsData.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          settings[parts[0]] = parts[1];
        }
      }
    });

    return settings;
  }

  parseGroupFile(groupData) {
    const groups = [];
    const lines = groupData.split('\n');

    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 4) {
        groups.push({
          groupName: parts[0],
          gid: parseInt(parts[2]),
          members: parts[3] ? parts[3].split(',') : []
        });
      }
    });

    return groups;
  }

  parseSystemdServices(systemctlData) {
    const services = [];
    const lines = systemctlData.split('\n').slice(1); // Skip header

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4 && parts[0].endsWith('.service')) {
        services.push({
          name: parts[0],
          load: parts[1],
          active: parts[2],
          sub: parts[3],
          description: parts.slice(4).join(' ')
        });
      }
    });

    return services;
  }

  parseInitdServices(initdData) {
    const services = [];
    const lines = initdData.split('\n');

    lines.forEach(line => {
      if (line.includes('[') && line.includes(']')) {
        const match = line.match(/\[\s*([+-])\s*\]\s*(.+)$/);
        if (match) {
          services.push({
            name: match[2].trim(),
            status: match[1] === '+' ? 'running' : 'stopped'
          });
        }
      }
    });

    return services;
  }

  parseProcesses(processData) {
    const processes = [];
    const lines = processData.split('\n');

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 11) {
        processes.push({
          user: parts[0],
          pid: parseInt(parts[1]),
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3]),
          vsz: parseInt(parts[4]),
          rss: parseInt(parts[5]),
          tty: parts[6],
          stat: parts[7],
          start: parts[8],
          time: parts[9],
          command: parts.slice(10).join(' ')
        });
      }
    });

    return processes;
  }

  parseNetworkInterfaces(interfaceData) {
    const interfaces = [];
    const sections = interfaceData.split(/^\d+:/m);

    sections.forEach(section => {
      const lines = section.split('\n');
      const interface_info = {
        name: '',
        addresses: [],
        status: 'unknown'
      };

      lines.forEach((line, index) => {
        if (index === 0) {
          const match = line.match(/(\w+):/);
          if (match) interface_info.name = match[1];
        }

        if (line.includes('inet ')) {
          const match = line.match(/inet\s+([^\s]+)/);
          if (match) interface_info.addresses.push({ type: 'ipv4', address: match[1] });
        }

        if (line.includes('inet6 ')) {
          const match = line.match(/inet6\s+([^\s]+)/);
          if (match) interface_info.addresses.push({ type: 'ipv6', address: match[1] });
        }

        if (line.includes('state UP')) {
          interface_info.status = 'up';
        } else if (line.includes('state DOWN')) {
          interface_info.status = 'down';
        }
      });

      if (interface_info.name) {
        interfaces.push(interface_info);
      }
    });

    return interfaces;
  }

  parseRoutingTable(routeData) {
    const routes = [];
    const lines = routeData.split('\n').slice(1); // Skip header

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        routes.push({
          destination: parts[0],
          gateway: parts[1],
          interface: parts[2],
          metric: parts[3] || '',
          flags: parts[4] || ''
        });
      }
    });

    return routes;
  }

  parseNetstat(netstatData) {
    const ports = [];
    const lines = netstatData.split('\n').slice(2); // Skip headers

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const localAddress = parts[3];
        const [ip, port] = localAddress.split(':');
        
        ports.push({
          protocol: parts[0],
          localAddress: ip || '0.0.0.0',
          localPort: port,
          state: parts[5] || 'LISTEN'
        });
      }
    });

    return ports;
  }

  parseIptables(iptablesData) {
    if (iptablesData.includes('Permission denied')) {
      return { accessible: false };
    }

    const rules = [];
    const lines = iptablesData.split('\n');
    let currentChain = '';

    lines.forEach(line => {
      if (line.startsWith('Chain ')) {
        currentChain = line.match(/Chain (\w+)/)?.[1] || '';
      } else if (line.trim() && !line.startsWith('target') && !line.startsWith('---')) {
        rules.push({
          chain: currentChain,
          rule: line.trim()
        });
      }
    });

    return { accessible: true, rules };
  }

  parseResolvConf(resolvData) {
    const dnsServers = [];
    const lines = resolvData.split('\n');

    lines.forEach(line => {
      if (line.startsWith('nameserver ')) {
        const server = line.split(/\s+/)[1];
        if (server) dnsServers.push(server);
      }
    });

    return dnsServers;
  }

  parseMounts(mountData) {
    const mounts = [];
    const lines = mountData.split('\n');

    lines.forEach(line => {
      const parts = line.split(' on ');
      if (parts.length >= 2) {
        const device = parts[0];
        const mountInfo = parts[1];
        const typeMatch = mountInfo.match(/type\s+(\w+)/);
        const optionsMatch = mountInfo.match(/\(([^)]+)\)/);

        mounts.push({
          device: device,
          mountPoint: mountInfo.split(' type')[0],
          type: typeMatch ? typeMatch[1] : 'unknown',
          options: optionsMatch ? optionsMatch[1].split(',') : []
        });
      }
    });

    return mounts;
  }

  parseFstab(fstabData) {
    const entries = [];
    const lines = fstabData.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 6) {
          entries.push({
            device: parts[0],
            mountPoint: parts[1],
            type: parts[2],
            options: parts[3].split(','),
            dump: parseInt(parts[4]),
            pass: parseInt(parts[5])
          });
        }
      }
    });

    return entries;
  }

  parsePackageInfo(packageData) {
    const packages = [];
    
    // Try different package managers
    if (packageData.rpm) {
      packages.push(...this.parseRPMPackages(packageData.rpm));
    }
    
    if (packageData.dpkg) {
      packages.push(...this.parseDPKGPackages(packageData.dpkg));
    }

    return packages.slice(0, 100); // Limit to 100 packages
  }

  parseRPMPackages(rpmData) {
    return rpmData.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const match = line.match(/^(.+)-([^-]+-[^-]+)\.(.+)$/);
        return match ? {
          name: match[1],
          version: match[2],
          architecture: match[3],
          type: 'rpm'
        } : {
          name: line.trim(),
          version: 'unknown',
          architecture: 'unknown',
          type: 'rpm'
        };
      });
  }

  parseDPKGPackages(dpkgData) {
    const packages = [];
    const lines = dpkgData.split('\n').slice(5); // Skip header lines

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4 && parts[0] === 'ii') {
        packages.push({
          name: parts[1],
          version: parts[2],
          architecture: parts[3],
          type: 'deb',
          description: parts.slice(4).join(' ')
        });
      }
    });

    return packages;
  }

  parseApparmorStatus(apparmorData) {
    if (!apparmorData || apparmorData.includes('command not found')) {
      return { enabled: false };
    }

    const status = {
      enabled: true,
      profiles: {
        loaded: 0,
        enforce: 0,
        complain: 0
      }
    };

    const lines = apparmorData.split('\n');
    lines.forEach(line => {
      if (line.includes('profiles are loaded')) {
        const match = line.match(/(\d+)/);
        if (match) status.profiles.loaded = parseInt(match[1]);
      }
      if (line.includes('profiles are in enforce mode')) {
        const match = line.match(/(\d+)/);
        if (match) status.profiles.enforce = parseInt(match[1]);
      }
      if (line.includes('profiles are in complain mode')) {
        const match = line.match(/(\d+)/);
        if (match) status.profiles.complain = parseInt(match[1]);
      }
    });

    return status;
  }

  parseFail2banStatus(fail2banData) {
    if (fail2banData.includes('Permission denied') || fail2banData.includes('command not found')) {
      return { enabled: false };
    }

    const jails = [];
    const lines = fail2banData.split('\n');
    
    lines.forEach(line => {
      if (line.includes('Jail list:')) {
        const jailList = line.split('Jail list:')[1];
        if (jailList) {
          jails.push(...jailList.trim().split(',').map(j => j.trim()));
        }
      }
    });

    return {
      enabled: true,
      jails: jails
    };
  }

  parseSSHConfig(sshConfigData) {
    const config = {};
    const lines = sshConfigData.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          config[parts[0].toLowerCase()] = parts.slice(1).join(' ');
        }
      }
    });

    return config;
  }

  parsePAMConfig(pamData) {
    return pamData.split('\n').filter(f => f.trim());
  }

  parseCrontab(crontabData) {
    const jobs = [];
    const lines = crontabData.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 6) {
          jobs.push({
            schedule: parts.slice(0, 5).join(' '),
            command: parts.slice(5).join(' ')
          });
        }
      }
    });

    return jobs;
  }

  parseKernelModules(lsmodData) {
    const modules = [];
    const lines = lsmodData.split('\n').slice(1); // Skip header

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        modules.push({
          name: parts[0],
          size: parseInt(parts[1]),
          used: parseInt(parts[2]),
          usedBy: parts[3] ? parts[3].split(',') : []
        });
      }
    });

    return modules;
  }
}

module.exports = EnhancedSSHScanner;