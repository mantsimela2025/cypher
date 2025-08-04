const chalk = require('chalk');
const ServerScanner = require('../lib/scanners/server-scanner');
const reporter = require('../lib/utils/reporter');
const validator = require('../lib/utils/validator');
const logger = require('../lib/utils/logger');

/**
 * Handle server scan command
 * @param {string} target - Target server to scan
 * @param {Object} options - Command options
 */
async function serverScan(target, options) {
  try {
    // Validate target
    if (!validator.isValidTarget(target)) {
      logger.error(`Invalid target: ${target}`);
      process.exit(1);
    }
    
    // Parse and validate ports
    const ports = validator.parsePortsString(options.ports);
    if (!ports || ports.length === 0) {
      logger.error(`Invalid port specification: ${options.ports}`);
      process.exit(1);
    }
    
    // Parse and validate timeout
    const timeout = validator.parseTimeout(options.timeout, 5000);
    
    // Initialize scanner
    const scanner = new ServerScanner({
      timeout
    });
    
    // Set up event listeners
    scanner.on('progress', (data) => {
      if (data.phase === 'port-scan') {
        process.stdout.write(`\r${chalk.blue(`Port scanning... [${data.percent}%]`)} - ${data.scanned} of ${data.total} ports checked`);
      } else if (data.phase === 'service-detection') {
        process.stdout.write(`\r${chalk.blue(`Service detection... [${Math.round((data.current / data.total) * 100)}%]`)} - Port ${data.port}`);
      }
    });
    
    // Handle graceful termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScan interrupted. Shutting down...'));
      scanner.abort();
      process.exit(0);
    });
    
    // Display scan information
    console.log(chalk.blue('Starting Server Scan'));
    console.log(`Target:            ${chalk.yellow(target)}`);
    console.log(`Ports:             ${chalk.yellow(options.ports)}`);
    console.log(`Service Detection: ${chalk.yellow(options.serviceDetection ? 'Yes' : 'No')}`);
    console.log(`OS Detection:      ${chalk.yellow(options.osDetection ? 'Yes' : 'No')}`);
    console.log(`Timeout:           ${chalk.yellow(timeout)}ms`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Start the scan
    const startTime = Date.now();
    const results = await scanner.scan(target, {
      ports,
      serviceDetection: options.serviceDetection,
      osDetection: options.osDetection
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    // Display scan results
    console.log(chalk.blue('\nServer Scan Results'));
    console.log(`${chalk.yellow('Target:')} ${target}`);
    if (results.dns.ip) {
      console.log(`${chalk.yellow('IP Address:')} ${results.dns.ip}`);
    }
    if (results.dns.hostname) {
      console.log(`${chalk.yellow('Hostname:')} ${results.dns.hostname}`);
    }
    console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Display DNS information
    if (Object.keys(results.dns.records).length > 0) {
      console.log(chalk.blue('\nDNS Records:'));
      for (const [type, records] of Object.entries(results.dns.records)) {
        console.log(`${chalk.yellow(type)} records:`);
        records.forEach((record, index) => {
          if (typeof record === 'string') {
            console.log(`  ${index + 1}. ${record}`);
          } else if (typeof record === 'object') {
            console.log(`  ${index + 1}. ${JSON.stringify(record)}`);
          }
        });
      }
      console.log(chalk.blue('-'.repeat(60)));
    }
    
    // Display open ports
    if (results.openPorts.length > 0) {
      console.log(chalk.blue('\nOpen Ports:'));
      console.log(`${chalk.cyan('PORT')}  ${chalk.cyan('STATE')}  ${chalk.cyan('SERVICE')}`);
      
      results.openPorts.forEach(result => {
        console.log(`${chalk.green(result.port.toString().padEnd(5))} ${chalk.green('open'.padEnd(6))} ${result.service}`);
      });
      console.log(chalk.blue('-'.repeat(60)));
    } else {
      console.log(chalk.red('\nNo open ports found.'));
    }
    
    // Display web server information
    if (results.webServers.length > 0) {
      console.log(chalk.blue('\nWeb Servers:'));
      results.webServers.forEach(server => {
        console.log(`${chalk.yellow('Port:')} ${server.port} (${server.protocol.toUpperCase()})`);
        console.log(`${chalk.yellow('Status:')} ${server.status} ${server.statusText}`);
        if (server.server) {
          console.log(`${chalk.yellow('Server:')} ${server.server}`);
        }
        if (server.title) {
          console.log(`${chalk.yellow('Title:')} ${server.title}`);
        }
        
        // Display certificate information if available
        if (server.certificate) {
          console.log(`${chalk.yellow('SSL Certificate:')}`);
          if (server.certificate.subject && server.certificate.subject.CN) {
            console.log(`  Subject: ${server.certificate.subject.CN}`);
          }
          if (server.certificate.validFrom && server.certificate.validTo) {
            console.log(`  Valid: ${server.certificate.validFrom} to ${server.certificate.validTo}`);
          }
        }
        
        console.log(''); // Add blank line between servers
      });
      console.log(chalk.blue('-'.repeat(60)));
    }
    
    // Display OS detection results
    if (options.osDetection && results.os) {
      console.log(chalk.blue('\nOperating System Detection:'));
      console.log(`${chalk.yellow('OS Name:')} ${results.os.name || 'Unknown'}`);
      console.log(`${chalk.yellow('Confidence:')} ${results.os.confidence || 0}%`);
      console.log(`${chalk.yellow('Method:')} ${results.os.method || 'Unknown'}`);
      console.log(chalk.blue('-'.repeat(60)));
    }
    
    // Display traceroute information
    if (results.traceroute && results.traceroute.length > 0) {
      console.log(chalk.blue('\nTraceroute:'));
      console.log(`${chalk.cyan('HOP'.padEnd(5))} ${chalk.cyan('IP/HOST'.padEnd(40))} ${chalk.cyan('LATENCY')}`);
      
      results.traceroute.forEach(hop => {
        const hopNumber = hop.number.toString().padEnd(5);
        const host = (hop.host || '*').padEnd(40);
        const latency = hop.latency ? `${hop.latency}ms` : '*';
        
        console.log(`${hopNumber} ${host} ${latency}`);
      });
    }
    
    // Output results to file if requested
    if (options.output) {
      // Prepare target host information
      const targetHost = target;
      
      await reporter.writeResults(results, {
        filename: options.output,
        format: options.format,
        scanType: 'server-scan',
        comprehensive: options.comprehensive === 'true',
        scanTitle: options.scanTitle || `Server Assessment - ${target} - ${new Date().toLocaleDateString()}`,
        targetHosts: [targetHost],
        excludedHosts: []
      });
      console.log(chalk.green(`\nResults written to ${options.output}`));
    }
    
  } catch (error) {
    logger.error(`Server scan error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = serverScan;
