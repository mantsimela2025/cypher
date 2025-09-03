/**
 * SNMP Scanner Module
 * 
 * Implements agentless network device discovery using SNMP protocol
 * Supports detection of routers, switches, printers, IoT devices, and network infrastructure
 */

const dgram = require('dgram');
const crypto = require('crypto');

class SNMPScanner {
  constructor(options = {}) {
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 2;
    this.communityStrings = options.communityStrings || ['public', 'private', 'community'];
    this.ports = options.ports || [161, 1161, 8161];
    this.version = options.version || '2c';
  }

  /**
   * Discover SNMP-enabled devices on network
   */
  async discoverDevices(networkRange) {
    console.log(`[SNMP] Starting device discovery for ${networkRange}`);
    const devices = [];
    const targets = this.parseNetworkRange(networkRange);

    for (const target of targets) {
      try {
        const device = await this.scanTarget(target);
        if (device) {
          devices.push(device);
        }
      } catch (error) {
        console.log(`[SNMP] Failed to scan ${target}: ${error.message}`);
      }
    }

    console.log(`[SNMP] Discovery complete. Found ${devices.length} devices`);
    return {
      protocol: 'snmp',
      devicesFound: devices.length,
      devices: devices,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Scan individual target for SNMP services
   */
  async scanTarget(target) {
    for (const port of this.ports) {
      for (const community of this.communityStrings) {
        try {
          const response = await this.snmpQuery(target, port, community, '1.3.6.1.2.1.1.1.0'); // sysDescr
          
          if (response) {
            const deviceInfo = await this.gatherDeviceInfo(target, port, community);
            return {
              target,
              port,
              community,
              accessible: true,
              ...deviceInfo
            };
          }
        } catch (error) {
          // Continue trying other ports/communities
        }
      }
    }
    return null;
  }

  /**
   * Gather comprehensive device information
   */
  async gatherDeviceInfo(target, port, community) {
    const info = {
      timestamp: new Date().toISOString(),
      deviceType: 'unknown',
      manufacturer: '',
      model: '',
      version: '',
      systemName: '',
      systemDescription: '',
      systemContact: '',
      systemLocation: '',
      uptime: '',
      interfaces: [],
      services: []
    };

    try {
      // Basic system information
      info.systemDescription = await this.snmpQuery(target, port, community, '1.3.6.1.2.1.1.1.0') || '';
      info.systemName = await this.snmpQuery(target, port, community, '1.3.6.1.2.1.1.5.0') || '';
      info.systemContact = await this.snmpQuery(target, port, community, '1.3.6.1.2.1.1.4.0') || '';
      info.systemLocation = await this.snmpQuery(target, port, community, '1.3.6.1.2.1.1.6.0') || '';
      info.uptime = await this.snmpQuery(target, port, community, '1.3.6.1.2.1.1.3.0') || '';

      // Determine device type from system description
      info.deviceType = this.classifyDevice(info.systemDescription);
      
      // Extract manufacturer and model
      const deviceInfo = this.parseDeviceInfo(info.systemDescription);
      info.manufacturer = deviceInfo.manufacturer;
      info.model = deviceInfo.model;
      info.version = deviceInfo.version;

      // Network interface information
      info.interfaces = await this.getInterfaceInfo(target, port, community);

      // Running services detection
      info.services = await this.getServiceInfo(target, port, community);

    } catch (error) {
      console.log(`[SNMP] Error gathering device info for ${target}: ${error.message}`);
    }

    return info;
  }

  /**
   * Perform SNMP query using native UDP implementation
   */
  async snmpQuery(target, port, community, oid) {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const requestId = Math.floor(Math.random() * 0xFFFFFF);
      
      // Build SNMP GET request packet (simplified BER encoding)
      const packet = this.buildSNMPGetRequest(requestId, community, oid);
      
      const timeout = setTimeout(() => {
        client.close();
        reject(new Error('SNMP query timeout'));
      }, this.timeout);

      client.on('message', (msg, rinfo) => {
        clearTimeout(timeout);
        client.close();
        
        try {
          const response = this.parseSNMPResponse(msg);
          resolve(response.value);
        } catch (error) {
          reject(error);
        }
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        client.close();
        reject(err);
      });

      client.send(packet, port, target, (err) => {
        if (err) {
          clearTimeout(timeout);
          client.close();
          reject(err);
        }
      });
    });
  }

  /**
   * Build SNMP GET request packet (simplified implementation)
   */
  buildSNMPGetRequest(requestId, community, oid) {
    // This is a simplified SNMP packet builder for demonstration
    // In production, you would use a proper SNMP library or more complete BER encoding
    const communityBytes = Buffer.from(community, 'utf8');
    const oidBytes = this.encodeOID(oid);
    
    // Basic SNMP v2c GET request structure
    const packet = Buffer.concat([
      Buffer.from([0x30]), // SEQUENCE
      Buffer.from([0x82]), // Length (extended form)
      Buffer.from([0x00, 0x20 + communityBytes.length + oidBytes.length]), // Total length
      Buffer.from([0x02, 0x01, 0x01]), // Version (SNMPv2c)
      Buffer.from([0x04, communityBytes.length]), // Community string
      communityBytes,
      Buffer.from([0xa0, 0x82]), // GET Request PDU
      Buffer.from([0x00, 0x10 + oidBytes.length]), // PDU length
      Buffer.from([0x02, 0x04]), // Request ID
      Buffer.from([(requestId >> 24) & 0xff, (requestId >> 16) & 0xff, (requestId >> 8) & 0xff, requestId & 0xff]),
      Buffer.from([0x02, 0x01, 0x00]), // Error status
      Buffer.from([0x02, 0x01, 0x00]), // Error index
      Buffer.from([0x30, oidBytes.length + 4]), // Varbind list
      Buffer.from([0x30, oidBytes.length + 2]), // Varbind
      oidBytes,
      Buffer.from([0x05, 0x00]) // NULL value
    ]);
    
    return packet;
  }

  /**
   * Encode OID to BER format
   */
  encodeOID(oidString) {
    const oids = oidString.split('.').map(Number);
    const encoded = [0x06]; // OID type
    const data = [];
    
    // First two sub-identifiers are encoded as (first * 40) + second
    if (oids.length >= 2) {
      data.push(oids[0] * 40 + oids[1]);
      
      // Encode remaining sub-identifiers
      for (let i = 2; i < oids.length; i++) {
        const subid = oids[i];
        if (subid < 128) {
          data.push(subid);
        } else {
          // Multi-byte encoding for large values
          const bytes = [];
          let value = subid;
          bytes.unshift(value & 0x7f);
          value >>= 7;
          while (value > 0) {
            bytes.unshift((value & 0x7f) | 0x80);
            value >>= 7;
          }
          data.push(...bytes);
        }
      }
    }
    
    encoded.push(data.length);
    encoded.push(...data);
    return Buffer.from(encoded);
  }

  /**
   * Parse SNMP response (simplified implementation)
   */
  parseSNMPResponse(buffer) {
    // Simplified SNMP response parser
    // In production, use proper BER/DER parser
    try {
      let offset = 0;
      
      // Skip SEQUENCE header
      offset += 2;
      const totalLength = buffer[offset];
      offset += 1;
      
      // Skip version and community
      while (offset < buffer.length && buffer[offset] !== 0xa2) {
        if (buffer[offset] === 0x04) {
          offset += 2 + buffer[offset + 1];
        } else {
          offset++;
        }
      }
      
      // Find value in response
      while (offset < buffer.length) {
        if (buffer[offset] === 0x04) { // OCTET STRING
          const length = buffer[offset + 1];
          const value = buffer.slice(offset + 2, offset + 2 + length).toString('utf8');
          return { value };
        }
        offset++;
      }
      
      return { value: null };
    } catch (error) {
      throw new Error('Failed to parse SNMP response');
    }
  }

  /**
   * Classify device type based on system description
   */
  classifyDevice(sysDescr) {
    const desc = sysDescr.toLowerCase();
    
    if (desc.includes('cisco') || desc.includes('router')) return 'router';
    if (desc.includes('switch') || desc.includes('catalyst')) return 'switch';
    if (desc.includes('printer') || desc.includes('hp laserjet')) return 'printer';
    if (desc.includes('ups') || desc.includes('uninterruptible')) return 'ups';
    if (desc.includes('firewall') || desc.includes('fortigate')) return 'firewall';
    if (desc.includes('access point') || desc.includes('wireless')) return 'wireless_ap';
    if (desc.includes('camera') || desc.includes('ip cam')) return 'ip_camera';
    if (desc.includes('server') || desc.includes('linux') || desc.includes('windows')) return 'server';
    
    return 'network_device';
  }

  /**
   * Parse device manufacturer, model, and version
   */
  parseDeviceInfo(sysDescr) {
    const info = { manufacturer: '', model: '', version: '' };
    
    // Common patterns for different manufacturers
    const patterns = [
      { regex: /cisco/i, manufacturer: 'Cisco Systems' },
      { regex: /hp\s+(.*)/i, manufacturer: 'Hewlett Packard' },
      { regex: /dell/i, manufacturer: 'Dell' },
      { regex: /netgear/i, manufacturer: 'Netgear' },
      { regex: /linksys/i, manufacturer: 'Linksys' },
      { regex: /d-link/i, manufacturer: 'D-Link' },
      { regex: /fortinet/i, manufacturer: 'Fortinet' }
    ];
    
    for (const pattern of patterns) {
      if (pattern.regex.test(sysDescr)) {
        info.manufacturer = pattern.manufacturer;
        break;
      }
    }
    
    // Extract version information
    const versionMatch = sysDescr.match(/version\s+([\d.]+)/i) || 
                        sysDescr.match(/v([\d.]+)/i) ||
                        sysDescr.match(/([\d.]+\.\d+)/);
    
    if (versionMatch) {
      info.version = versionMatch[1];
    }
    
    return info;
  }

  /**
   * Get network interface information
   */
  async getInterfaceInfo(target, port, community) {
    const interfaces = [];
    
    try {
      // Get interface count
      const ifNumber = await this.snmpQuery(target, port, community, '1.3.6.1.2.1.2.1.0');
      const count = parseInt(ifNumber) || 1;
      
      // Get basic interface info (limited to first few interfaces)
      for (let i = 1; i <= Math.min(count, 5); i++) {
        try {
          const ifDescr = await this.snmpQuery(target, port, community, `1.3.6.1.2.1.2.2.1.2.${i}`);
          const ifType = await this.snmpQuery(target, port, community, `1.3.6.1.2.1.2.2.1.3.${i}`);
          const ifSpeed = await this.snmpQuery(target, port, community, `1.3.6.1.2.1.2.2.1.5.${i}`);
          
          interfaces.push({
            index: i,
            description: ifDescr || `Interface ${i}`,
            type: this.mapInterfaceType(parseInt(ifType) || 0),
            speed: parseInt(ifSpeed) || 0
          });
        } catch (error) {
          // Skip failed interfaces
        }
      }
    } catch (error) {
      console.log(`[SNMP] Error getting interface info: ${error.message}`);
    }
    
    return interfaces;
  }

  /**
   * Map SNMP interface type to readable name
   */
  mapInterfaceType(type) {
    const types = {
      1: 'other',
      6: 'ethernet',
      23: 'ppp',
      24: 'loopback',
      131: 'tunnel',
      144: 'ethernet3d',
      161: 'ieee80211'
    };
    return types[type] || 'unknown';
  }

  /**
   * Get running services information
   */
  async getServiceInfo(target, port, community) {
    const services = [];
    
    try {
      // Check for common SNMP-exposed services
      const serviceMIBs = [
        { oid: '1.3.6.1.2.1.43.5.1.1.1', name: 'Print Service' },
        { oid: '1.3.6.1.4.1.2021.2.1.1.1', name: 'System Processes' },
        { oid: '1.3.6.1.2.1.25.4.2.1.2', name: 'Running Processes' }
      ];
      
      for (const service of serviceMIBs) {
        try {
          const result = await this.snmpQuery(target, port, community, service.oid);
          if (result) {
            services.push({
              name: service.name,
              status: 'running',
              details: result
            });
          }
        } catch (error) {
          // Service not available
        }
      }
    } catch (error) {
      console.log(`[SNMP] Error getting service info: ${error.message}`);
    }
    
    return services;
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
        // For /24 and smaller, scan all IPs
        const baseIP = network.split('.').map(Number);
        const hostBits = 32 - prefix;
        const maxHosts = Math.min(Math.pow(2, hostBits) - 2, 254); // Limit to reasonable size
        
        for (let i = 1; i <= maxHosts; i++) {
          targets.push(`${baseIP[0]}.${baseIP[1]}.${baseIP[2]}.${i}`);
        }
      }
    } else if (range.includes('-')) {
      // Range notation (e.g., 192.168.1.1-10)
      const [start, end] = range.split('-');
      const startParts = start.split('.').map(Number);
      const endNum = parseInt(end);
      
      for (let i = startParts[3]; i <= endNum; i++) {
        targets.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
      }
    } else {
      // Single IP
      targets.push(range);
    }
    
    return targets.slice(0, 100); // Limit total targets for safety
  }
}

module.exports = SNMPScanner;