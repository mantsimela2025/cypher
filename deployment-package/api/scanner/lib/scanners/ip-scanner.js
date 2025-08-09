const { exec } = require('child_process');
const ipaddr = require('ipaddr.js');
const { EventEmitter } = require('events');
const util = require('util');
const dns = require('dns');
const os = require('os');
const logger = require('../utils/logger');
const validator = require('../utils/validator');

// Promisify DNS lookup
const dnsLookup = util.promisify(dns.lookup);
const dnsReverse = util.promisify(dns.reverse);
const execPromise = util.promisify(exec);

/**
 * IPScanner class for scanning IP ranges and gathering information
 */
class IPScanner extends EventEmitter {
  /**
   * Create a new IP scanner instance
   * @param {Object} options - Scanner options
   * @param {number} options.timeout - Timeout in milliseconds for each operation
   * @param {number} options.concurrency - Maximum concurrent operations
   */
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 2000;
    this.concurrency = options.concurrency || 50;
    this.scanInProgress = false;
    this.aborted = false;
  }

  /**
   * Scan an IP range using CIDR notation
   * @param {string} cidr - CIDR notation (e.g., '192.168.1.0/24')
   * @param {Object} options - Scan options
   * @param {boolean} options.ping - Whether to ping hosts
   * @returns {Promise<Array>} - Results of the IP scan
   */
  async scan(cidr, options = {}) {
    if (this.scanInProgress) {
      throw new Error('A scan is already in progress');
    }

    if (!validator.isValidCidr(cidr)) {
      throw new Error(`Invalid CIDR notation: ${cidr}`);
    }

    this.scanInProgress = true;
    this.aborted = false;

    // Parse CIDR to get IP addresses
    const ips = this.expandCidr(cidr);
    const results = [];
    let pendingScans = 0;
    let processedIps = 0;
    const totalIps = ips.length;

    logger.scan.start('IP', cidr);
    logger.info(`Scanning ${totalIps} IP addresses in range ${cidr}`);

    return new Promise((resolve, reject) => {
      const scanIp = async (ip) => {
        if (this.aborted) {
          return;
        }

        pendingScans++;
        const result = { ip, status: 'unknown' };

        try {
          // Try to get hostname from IP
          try {
            const hostnames = await dnsReverse(ip);
            if (hostnames && hostnames.length > 0) {
              result.hostname = hostnames[0];
            }
          } catch (err) {
            // Ignore DNS errors
          }

          // Ping the host if required
          if (options.ping) {
            result.status = await this.pingHost(ip) ? 'up' : 'down';
            result.latency = result.status === 'up' ? await this.measureLatency(ip) : null;
          }

          // Get MAC address if on local network
          if (this.isLocalIp(ip)) {
            try {
              result.mac = await this.getMacAddress(ip);
            } catch (err) {
              // Ignore MAC address errors
            }
          }

          results.push(result);
          this.emit('ipFound', result);
        } catch (error) {
          logger.debug(`Error scanning IP ${ip}: ${error.message}`);
          result.status = 'error';
          result.error = error.message;
          results.push(result);
        } finally {
          processedIps++;
          pendingScans--;

          // Report progress
          if (processedIps % 10 === 0 || processedIps === totalIps) {
            this.emit('progress', {
              scanned: processedIps,
              total: totalIps,
              percent: Math.floor((processedIps / totalIps) * 100)
            });

            logger.scan.progress('IP', cidr, processedIps, totalIps);
          }

          // Start a new IP scan if there are IPs left in the queue
          if (ipsQueue.length > 0 && pendingScans < this.concurrency) {
            scanIp(ipsQueue.shift());
          }

          // Resolve the promise when all IPs have been scanned
          if (processedIps === totalIps) {
            this.scanInProgress = false;
            logger.scan.complete('IP', cidr, results);
            resolve(results);
          }
        }
      };

      // Queue of IPs to scan
      const ipsQueue = [...ips];

      // Start initial batch of IP scans
      const initialBatchSize = Math.min(this.concurrency, ipsQueue.length);
      for (let i = 0; i < initialBatchSize; i++) {
        scanIp(ipsQueue.shift());
      }
    });
  }

  /**
   * Expand a CIDR notation into an array of IP addresses
   * @param {string} cidr - CIDR notation
   * @returns {Array<string>} - Array of IP addresses
   */
  expandCidr(cidr) {
    const [ipStr, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);
    const ip = ipaddr.parse(ipStr);

    if (ip.kind() === 'ipv4') {
      // For IPv4 addresses
      const subnet = ipaddr.IPv4.subnetMaskFromPrefixLength(prefix);
      const networkAddress = ip.match(subnet);

      // Convert network address to integer
      const networkInt = networkAddress.toByteArray().reduce(
        (acc, byte, i) => acc + (byte << (8 * (3 - i))), 0
      );

      // Calculate the number of hosts in this subnet
      const numHosts = Math.pow(2, 32 - prefix);

      // Calculate the last IP in the range (broadcast address)
      const broadcastInt = networkInt + numHosts - 1;

      // Determine start and end IPs (excluding network and broadcast addresses for normal subnets)
      const startInt = networkInt + (prefix >= 31 ? 0 : 1);
      const endInt = broadcastInt - (prefix >= 31 ? 0 : 1);

      // Generate all IP addresses in the range
      const ips = [];
      for (let i = startInt; i <= endInt; i++) {
        const ipByteArray = [
          (i >> 24) & 255,
          (i >> 16) & 255,
          (i >> 8) & 255,
          i & 255
        ];

        ips.push(ipByteArray.join('.'));
      }

      return ips;
    } else {
      // For IPv6, we'll just return a limited range to avoid generating too many IPs
      logger.warn('IPv6 ranges may be very large, limiting scan to the first 100 addresses');

      const ips = [];
      // Get the subnet mask for this prefix
      const subnet = ipaddr.IPv6.subnetMaskFromPrefixLength(prefix);
      // Get the network address (first IP in the subnet)
      const networkAddress = ip.match(subnet);

      // Start with the network address
      let current = networkAddress;
      const max = Math.min(100, Math.pow(2, 128 - prefix)); // Limit to 100 IPs for IPv6

      for (let i = 0; i < max; i++) {
        ips.push(current.toString());

        // Calculate next IP address
        const bytes = current.toByteArray();
        for (let j = bytes.length - 1; j >= 0; j--) {
          bytes[j]++;
          if (bytes[j] <= 255) break;
          bytes[j] = 0;
        }

        current = ipaddr.fromByteArray(bytes);
      }

      return ips;
    }
  }

  /**
   * Check if an IP is alive using ping
   * @param {string} ip - IP address to ping
   * @returns {Promise<boolean>} - True if host is up, false otherwise
   */
  async pingHost(ip) {
    try {
      // Determine the ping command based on the OS
      const pingCmd = process.platform === 'win32'
        ? `ping -n 1 -w ${this.timeout} ${ip}`
        : `ping -c 1 -W ${this.timeout / 1000} ${ip}`;

      const { stdout } = await execPromise(pingCmd);

      // Check if ping was successful
      return process.platform === 'win32'
        ? stdout.includes('Reply from')
        : stdout.includes(' 0% packet loss');
    } catch (error) {
      return false; // Ping failed
    }
  }

  /**
   * Measure latency to a host using ping
   * @param {string} ip - IP address to measure latency to
   * @returns {Promise<number|null>} - Latency in milliseconds or null if failed
   */
  async measureLatency(ip) {
    try {
      // Determine the ping command based on the OS
      const pingCmd = process.platform === 'win32'
        ? `ping -n 3 -w ${this.timeout} ${ip}`
        : `ping -c 3 -W ${this.timeout / 1000} ${ip}`;

      const { stdout } = await execPromise(pingCmd);

      // Extract average latency
      const match = process.platform === 'win32'
        ? stdout.match(/Average = (\d+)ms/)
        : stdout.match(/min\/avg\/max\/(?:mdev|stddev) = [\d.]+\/(?<avg>[\d.]+)\/[\d.]+\/[\d.]+ ms/);

      if (match) {
        return process.platform === 'win32'
          ? parseInt(match[1], 10)
          : parseFloat(match.groups.avg);
      }

      return null;
    } catch (error) {
      return null; // Ping failed
    }
  }

  /**
   * Get MAC address for an IP on the local network
   * @param {string} ip - IP address to get MAC for
   * @returns {Promise<string|null>} - MAC address or null if not found
   */
  async getMacAddress(ip) {
    try {
      if (process.platform === 'win32') {
        // Windows - use arp command
        const { stdout } = await execPromise(`arp -a ${ip}`);
        const match = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
        return match ? match[0] : null;
      } else if (process.platform === 'darwin' || process.platform === 'linux') {
        // macOS/Linux - use arp command
        const { stdout } = await execPromise(`arp -n ${ip}`);
        const match = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
        return match ? match[0] : null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if an IP is on the local network
   * @param {string} ip - IP address to check
   * @returns {boolean} - True if IP is local, false otherwise
   */
  isLocalIp(ip) {
    const ipObj = ipaddr.parse(ip);

    // Get local network interfaces
    const interfaces = os.networkInterfaces();

    // Check if IP is in the same subnet as any local interface
    for (const iface of Object.values(interfaces)) {
      for (const addr of iface) {
        if (addr.family === 'IPv4' && addr.address !== '127.0.0.1') {
          const localIp = ipaddr.parse(addr.address);
          const netmask = ipaddr.parse(addr.netmask);

          if (localIp.match(netmask, ipObj)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Stop an ongoing scan
   */
  abort() {
    if (this.scanInProgress) {
      this.aborted = true;
      logger.info('IP scan aborted');
    }
  }
}

module.exports = IPScanner;
