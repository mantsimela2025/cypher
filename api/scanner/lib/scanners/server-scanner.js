const axios = require('axios');
const { EventEmitter } = require('events');
const { exec } = require('child_process');
const util = require('util');
const dns = require('dns');
const tls = require('tls');
const PortScanner = require('./port-scanner');
const logger = require('../utils/logger');
const validator = require('../utils/validator');

// Promisify exec and DNS functions
const execPromise = util.promisify(exec);
const dnsLookup = util.promisify(dns.lookup);
const dnsResolve = util.promisify(dns.resolve);

/**
 * ServerScanner class for gathering information about servers
 */
class ServerScanner extends EventEmitter {
  /**
   * Create a new server scanner instance
   * @param {Object} options - Scanner options
   * @param {number} options.timeout - Timeout in milliseconds
   */
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 5000;
    this.scanInProgress = false;
    this.aborted = false;
  }

  /**
   * Scan a server to gather information
   * @param {string} target - Target server (IP or hostname)
   * @param {Object} options - Scan options
   * @param {Array<number>} options.ports - Ports to scan
   * @param {boolean} options.serviceDetection - Whether to detect services
   * @param {boolean} options.osDetection - Whether to attempt OS detection
   * @returns {Promise<Object>} - Results of the server scan
   */
  async scan(target, options = {}) {
    if (this.scanInProgress) {
      throw new Error('A scan is already in progress');
    }

    if (!validator.isValidTarget(target)) {
      throw new Error(`Invalid target: ${target}`);
    }

    this.scanInProgress = true;
    this.aborted = false;
    
    logger.scan.start('server', target);
    
    try {
      const results = {
        target,
        timestamp: new Date().toISOString(),
        dns: await this.resolveDns(target),
        openPorts: [],
        webServers: []
      };
      
      // TCP port scan
      if (options.ports && options.ports.length > 0) {
        results.openPorts = await this.scanPorts(target, options.ports);
      }
      
      // Service detection on open ports if requested
      if (options.serviceDetection && results.openPorts.length > 0) {
        await this.detectServices(target, results);
      }
      
      // OS detection if requested
      if (options.osDetection) {
        results.os = await this.detectOs(target);
      }
      
      // Trace route
      results.traceroute = await this.traceRoute(target);
      
      logger.scan.complete('server', target, results);
      this.scanInProgress = false;
      return results;
    } catch (error) {
      this.scanInProgress = false;
      logger.error(`Error scanning server ${target}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resolve DNS information for a target
   * @param {string} target - Target to resolve
   * @returns {Promise<Object>} - DNS information
   */
  async resolveDns(target) {
    const dnsInfo = {
      ip: null,
      hostname: null,
      records: {}
    };
    
    try {
      // Determine if target is an IP or hostname
      if (validator.isValidIp(target)) {
        dnsInfo.ip = target;
        
        try {
          // Get hostname from IP
          const hostnames = await util.promisify(dns.reverse)(target);
          if (hostnames && hostnames.length > 0) {
            dnsInfo.hostname = hostnames[0];
          }
        } catch (error) {
          // Ignore reverse lookup errors
        }
      } else {
        dnsInfo.hostname = target;
        
        try {
          // Get IP from hostname
          const { address } = await dnsLookup(target);
          dnsInfo.ip = address;
        } catch (error) {
          logger.debug(`Failed to resolve hostname ${target}: ${error.message}`);
        }
      }
      
      // Attempt to get various DNS records if target is a hostname
      if (dnsInfo.hostname) {
        const recordTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA'];
        
        for (const type of recordTypes) {
          try {
            const records = await dnsResolve(dnsInfo.hostname, type);
            if (records && records.length > 0) {
              dnsInfo.records[type] = records;
            }
          } catch (error) {
            // Ignore errors for missing record types
          }
        }
      }
      
      return dnsInfo;
    } catch (error) {
      logger.debug(`DNS resolution error for ${target}: ${error.message}`);
      return dnsInfo;
    }
  }

  /**
   * Scan ports on a target server
   * @param {string} target - Target server
   * @param {Array<number>} ports - Ports to scan
   * @returns {Promise<Array>} - Open ports information
   */
  async scanPorts(target, ports) {
    try {
      const portScanner = new PortScanner({ timeout: this.timeout });
      
      // Forward progress events
      portScanner.on('progress', (data) => {
        this.emit('progress', {
          phase: 'port-scan',
          ...data
        });
      });
      
      const results = await portScanner.scan(target, ports);
      return results;
    } catch (error) {
      logger.error(`Port scan error: ${error.message}`);
      return [];
    }
  }

  /**
   * Detect services running on open ports
   * @param {string} target - Target server
   * @param {Object} results - Scan results object to update
   * @returns {Promise<void>}
   */
  async detectServices(target, results) {
    for (let i = 0; i < results.openPorts.length; i++) {
      const portInfo = results.openPorts[i];
      const port = portInfo.port;
      
      if (this.aborted) {
        break;
      }
      
      this.emit('progress', {
        phase: 'service-detection',
        current: i + 1,
        total: results.openPorts.length,
        port
      });
      
      // Check for HTTP/HTTPS service
      if (port === 80 || port === 443 || port === 8080 || port === 8443) {
        try {
          const protocol = (port === 443 || port === 8443) ? 'https' : 'http';
          const response = await axios.get(`${protocol}://${target}:${port}`, {
            timeout: this.timeout,
            validateStatus: () => true, // Accept any status code
            maxRedirects: 0, // Don't follow redirects
            headers: {
              'User-Agent': 'Mozilla/5.0 VulScan/1.0'
            }
          });
          
          const webServerInfo = {
            port,
            protocol,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            title: this.extractHtmlTitle(response.data)
          };
          
          // Try to identify server software
          if (response.headers['server']) {
            webServerInfo.server = response.headers['server'];
          }
          
          // Get SSL/TLS certificate info if HTTPS
          if (protocol === 'https') {
            try {
              webServerInfo.certificate = await this.getCertificateInfo(target, port);
            } catch (error) {
              logger.debug(`Failed to get certificate for ${target}:${port}: ${error.message}`);
            }
          }
          
          results.webServers.push(webServerInfo);
        } catch (error) {
          logger.debug(`HTTP service detection error on ${target}:${port}: ${error.message}`);
        }
      }
      
      // Add more service detection logic for common ports
      switch (port) {
        case 22: // SSH
          try {
            const { stdout } = await execPromise(`timeout ${this.timeout / 1000} ssh -vT -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${target} 2>&1 || true`);
            const versionMatch = stdout.match(/Remote protocol version [0-9.]+, remote software version ([^\r\n]+)/);
            if (versionMatch) {
              portInfo.serviceDetails = {
                version: versionMatch[1]
              };
            }
          } catch (error) {
            // Ignore SSH detection errors
          }
          break;
          
        // Could add more service fingerprinting for other protocols
      }
    }
  }

  /**
   * Extract the title from HTML content
   * @param {string} html - HTML content
   * @returns {string|null} - Title or null if not found
   */
  extractHtmlTitle(html) {
    if (typeof html !== 'string') {
      return null;
    }
    
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  /**
   * Get SSL/TLS certificate information
   * @param {string} host - Host to connect to
   * @param {number} port - Port to connect to
   * @returns {Promise<Object>} - Certificate information
   */
  getCertificateInfo(host, port) {
    return new Promise((resolve, reject) => {
      const socket = tls.connect({
        host,
        port,
        rejectUnauthorized: false, // We want to get info even for invalid certs
        timeout: this.timeout
      }, () => {
        try {
          const cert = socket.getPeerCertificate(true);
          
          // Format certificate data
          const certInfo = {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            fingerprint: cert.fingerprint,
            serialNumber: cert.serialNumber,
          };
          
          socket.end();
          resolve(certInfo);
        } catch (error) {
          socket.end();
          reject(error);
        }
      });
      
      socket.on('timeout', () => {
        socket.end();
        reject(new Error('Connection timeout'));
      });
      
      socket.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Attempt to detect the operating system of a target
   * @param {string} target - Target to detect OS for
   * @returns {Promise<Object>} - OS detection results
   */
  async detectOs(target) {
    const osInfo = {
      name: null,
      confidence: 0,
      method: null
    };
    
    try {
      // Try TCP/IP fingerprinting first (using TTL and window size)
      try {
        // Execute ping command to get TTL
        const pingCmd = process.platform === 'win32'
          ? `ping -n 1 ${target}`
          : `ping -c 1 ${target}`;
        
        const { stdout: pingOutput } = await execPromise(pingCmd);
        
        // Extract TTL value
        const ttlMatch = pingOutput.match(/TTL=(\d+)/i) || pingOutput.match(/ttl=(\d+)/i);
        
        if (ttlMatch) {
          const ttl = parseInt(ttlMatch[1], 10);
          
          // Basic OS guessing based on default TTL values
          if (ttl <= 64) {
            osInfo.name = 'Linux/Unix/MacOS';
            osInfo.confidence = 60;
          } else if (ttl <= 128) {
            osInfo.name = 'Windows';
            osInfo.confidence = 60;
          } else if (ttl <= 255) {
            osInfo.name = 'Cisco/Network Device';
            osInfo.confidence = 50;
          }
          
          osInfo.method = 'TTL';
        }
      } catch (error) {
        // Ignore ping errors
      }
      
      // Try banner grabbing as a fallback or supplement
      if (!osInfo.name || osInfo.confidence < 70) {
        for (const port of [22, 80, 443]) {
          if (osInfo.confidence >= 80) break; // Stop if we have high confidence
          
          try {
            let banner = '';
            
            if (port === 22) {
              // SSH banner grabbing
              const { stdout } = await execPromise(`timeout 5 ssh -vT -o BatchMode=yes -o StrictHostKeyChecking=no ${target} 2>&1 || true`);
              banner = stdout;
              
              if (banner.includes('Ubuntu')) {
                osInfo.name = 'Ubuntu Linux';
                osInfo.confidence = 85;
                osInfo.method = 'SSH Banner';
              } else if (banner.includes('Debian')) {
                osInfo.name = 'Debian Linux';
                osInfo.confidence = 85;
                osInfo.method = 'SSH Banner';
              } else if (banner.includes('CentOS')) {
                osInfo.name = 'CentOS Linux';
                osInfo.confidence = 85;
                osInfo.method = 'SSH Banner';
              } else if (banner.includes('Windows')) {
                osInfo.name = 'Windows';
                osInfo.confidence = 85;
                osInfo.method = 'SSH Banner';
              }
            } else if (port === 80 || port === 443) {
              // HTTP header analysis
              const protocol = port === 443 ? 'https' : 'http';
              const response = await axios.get(`${protocol}://${target}:${port}`, {
                timeout: this.timeout,
                validateStatus: () => true,
                maxRedirects: 0,
                headers: {
                  'User-Agent': 'Mozilla/5.0 VulScan/1.0'
                }
              });
              
              const serverHeader = response.headers['server'];
              
              if (serverHeader) {
                if (serverHeader.includes('Ubuntu')) {
                  osInfo.name = 'Ubuntu Linux';
                  osInfo.confidence = 80;
                  osInfo.method = 'HTTP Header';
                } else if (serverHeader.includes('Debian')) {
                  osInfo.name = 'Debian Linux';
                  osInfo.confidence = 80;
                  osInfo.method = 'HTTP Header';
                } else if (serverHeader.includes('CentOS')) {
                  osInfo.name = 'CentOS Linux';
                  osInfo.confidence = 80;
                  osInfo.method = 'HTTP Header';
                } else if (serverHeader.includes('Windows')) {
                  osInfo.name = 'Windows';
                  osInfo.confidence = 80;
                  osInfo.method = 'HTTP Header';
                } else if (serverHeader.includes('nginx')) {
                  osInfo.name = 'Linux (nginx)';
                  osInfo.confidence = 70;
                  osInfo.method = 'HTTP Header';
                } else if (serverHeader.includes('Apache')) {
                  osInfo.name = 'Linux (Apache)';
                  osInfo.confidence = 60;
                  osInfo.method = 'HTTP Header';
                } else if (serverHeader.includes('IIS')) {
                  osInfo.name = 'Windows (IIS)';
                  osInfo.confidence = 80;
                  osInfo.method = 'HTTP Header';
                }
              }
            }
          } catch (error) {
            // Ignore errors in banner grabbing
          }
        }
      }
      
      return osInfo;
    } catch (error) {
      logger.debug(`OS detection error for ${target}: ${error.message}`);
      return osInfo;
    }
  }

  /**
   * Perform a traceroute to the target
   * @param {string} target - Target to trace route to
   * @returns {Promise<Array>} - Traceroute results
   */
  async traceRoute(target) {
    try {
      const traceCmd = process.platform === 'win32'
        ? `tracert -h 15 -w 500 ${target}`
        : `traceroute -m 15 -w 1 -q 1 ${target}`;
      
      const { stdout } = await execPromise(traceCmd);
      
      // Parse traceroute output
      const hops = [];
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        // Skip header lines
        if (line.includes('Tracing route') || line.includes('traceroute to') || !line.trim()) {
          continue;
        }
        
        // Extract hop information
        const hopMatch = process.platform === 'win32'
          ? line.match(/\s*(\d+)\s+(?:(<?\s*\d+\s*ms)|(\*))\s+(?:(<?\s*\d+\s*ms)|(\*))\s+(?:(<?\s*\d+\s*ms)|(\*))\s+(.+)?/)
          : line.match(/\s*(\d+)\s+(?:([^ ]+)\s+([0-9.]+\s*ms)|(\*))\s*(.+)?/);
        
        if (hopMatch) {
          const hop = {
            number: parseInt(hopMatch[1], 10),
            latency: null,
            host: null
          };
          
          if (process.platform === 'win32') {
            // Parse Windows tracert output
            const latencies = [hopMatch[2], hopMatch[4], hopMatch[6]].filter(l => l && !l.includes('*'));
            if (latencies.length > 0) {
              // Average the latencies and remove 'ms' and '<'
              hop.latency = latencies
                .map(l => parseFloat(l.replace(/[ms<]/g, '')))
                .reduce((a, b) => a + b, 0) / latencies.length;
            }
            
            hop.host = hopMatch[8] ? hopMatch[8].trim() : null;
          } else {
            // Parse Unix traceroute output
            if (hopMatch[3]) {
              hop.latency = parseFloat(hopMatch[3]);
            }
            
            hop.host = hopMatch[2] || hopMatch[5] || null;
            if (hop.host) {
              hop.host = hop.host.trim();
            }
          }
          
          hops.push(hop);
        }
      }
      
      return hops;
    } catch (error) {
      logger.debug(`Traceroute error for ${target}: ${error.message}`);
      return [];
    }
  }

  /**
   * Stop an ongoing scan
   */
  abort() {
    if (this.scanInProgress) {
      this.aborted = true;
      logger.info('Server scan aborted');
    }
  }
}

module.exports = ServerScanner;
