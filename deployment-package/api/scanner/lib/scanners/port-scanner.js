const net = require('net');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const validator = require('../utils/validator');

/**
 * PortScanner class for performing TCP port scans
 */
class PortScanner extends EventEmitter {
  /**
   * Create a new port scanner instance
   * @param {Object} options - Scanner options
   * @param {number} options.timeout - Connection timeout in milliseconds
   * @param {number} options.concurrency - Maximum concurrent connection attempts
   */
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 2000;
    this.concurrency = options.concurrency || 100;
    this.scanInProgress = false;
    this.aborted = false;
  }

  /**
   * Scan a target host for open ports
   * @param {string} target - Target host (IP or hostname)
   * @param {Array<number>} ports - Array of port numbers to scan
   * @returns {Promise<Array>} - Results of the port scan
   */
  async scan(target, ports) {
    if (this.scanInProgress) {
      throw new Error('A scan is already in progress');
    }

    if (!validator.isValidTarget(target)) {
      throw new Error(`Invalid target: ${target}`);
    }

    if (!Array.isArray(ports) || ports.length === 0) {
      throw new Error('Invalid ports specification');
    }

    this.scanInProgress = true;
    this.aborted = false;
    
    const results = [];
    let pendingScans = 0;
    let processedPorts = 0;
    const totalPorts = ports.length;
    
    logger.scan.start('port', target);
    
    return new Promise((resolve, reject) => {
      const scanPort = (port) => {
        if (this.aborted) {
          return;
        }
        
        pendingScans++;
        const socket = new net.Socket();
        let status = 'closed';
        let error = null;
        
        // Set connection timeout
        socket.setTimeout(this.timeout);
        
        // Handle successful connection
        socket.on('connect', () => {
          status = 'open';
          socket.end();
        });
        
        // Handle connection timeout
        socket.on('timeout', () => {
          status = 'timeout';
          socket.destroy();
        });
        
        // Handle connection error
        socket.on('error', (err) => {
          error = err.message;
          socket.destroy();
        });
        
        // Handle connection close
        socket.on('close', () => {
          processedPorts++;
          pendingScans--;
          
          // Only add open ports to results
          if (status === 'open') {
            results.push({
              port,
              status,
              service: this.guessService(port)
            });
            
            this.emit('portFound', {
              target,
              port,
              status,
              service: this.guessService(port)
            });
          }
          
          // Report progress
          if (processedPorts % 10 === 0 || processedPorts === totalPorts) {
            this.emit('progress', {
              target,
              scanned: processedPorts,
              total: totalPorts,
              percent: Math.floor((processedPorts / totalPorts) * 100)
            });
            
            logger.scan.progress('port', target, processedPorts, totalPorts);
          }
          
          // Start a new port scan if there are ports left in the queue
          if (portsQueue.length > 0 && pendingScans < this.concurrency) {
            scanPort(portsQueue.shift());
          }
          
          // Resolve the promise when all ports have been scanned
          if (processedPorts === totalPorts) {
            this.scanInProgress = false;
            logger.scan.complete('port', target, results);
            resolve(results);
          }
        });
        
        // Start the connection attempt
        socket.connect(port, target);
      };
      
      // Queue of ports to scan
      const portsQueue = [...ports];
      
      // Start initial batch of port scans
      const initialBatchSize = Math.min(this.concurrency, portsQueue.length);
      for (let i = 0; i < initialBatchSize; i++) {
        scanPort(portsQueue.shift());
      }
    });
  }

  /**
   * Guess the service running on a port based on common port assignments
   * @param {number} port - The port number
   * @returns {string} - Guessed service name or 'unknown'
   */
  guessService(port) {
    const commonPorts = {
      21: 'FTP',
      22: 'SSH',
      23: 'Telnet',
      25: 'SMTP',
      53: 'DNS',
      80: 'HTTP',
      110: 'POP3',
      115: 'SFTP',
      135: 'RPC',
      139: 'NetBIOS',
      143: 'IMAP',
      194: 'IRC',
      443: 'HTTPS',
      445: 'SMB',
      1433: 'MSSQL',
      1521: 'Oracle',
      3306: 'MySQL',
      3389: 'RDP',
      5432: 'PostgreSQL',
      5900: 'VNC',
      5985: 'WinRM HTTP',
      5986: 'WinRM HTTPS',
      6379: 'Redis',
      8080: 'HTTP Proxy',
      8443: 'HTTPS Alt',
      27017: 'MongoDB'
    };
    
    return commonPorts[port] || 'unknown';
  }

  /**
   * Stop an ongoing scan
   */
  abort() {
    if (this.scanInProgress) {
      this.aborted = true;
      logger.info('Port scan aborted');
    }
  }
}

module.exports = PortScanner;
