const chalk = require('chalk');
const IPScanner = require('../lib/scanners/ip-scanner');
const reporter = require('../lib/utils/reporter');
const validator = require('../lib/utils/validator');
const logger = require('../lib/utils/logger');

/**
 * Handle IP scan command
 * @param {string} cidr - CIDR notation to specify IP range
 * @param {Object} options - Command options
 */
async function ipScan(cidr, options) {
  try {
    // Validate CIDR
    if (!validator.isValidCidr(cidr)) {
      logger.error(`Invalid CIDR notation: ${cidr}`);
      process.exit(1);
    }
    
    // Parse and validate timeout
    const timeout = validator.parseTimeout(options.timeout);
    
    // Parse and validate concurrency
    const concurrency = parseInt(options.concurrent, 10);
    if (isNaN(concurrency) || concurrency < 1 || concurrency > 500) {
      logger.warn(`Invalid concurrency value: ${options.concurrent}, using default of 50`);
      options.concurrent = 50;
    }
    
    // Initialize scanner
    const scanner = new IPScanner({
      timeout,
      concurrency
    });
    
    // Set up event listeners
    scanner.on('ipFound', (data) => {
      if (data.status === 'up') {
        const hostStr = data.hostname ? ` (${data.hostname})` : '';
        const latencyStr = data.latency ? ` - ${data.latency}ms` : '';
        console.log(chalk.green(`✓ ${data.ip}${hostStr}${latencyStr}`));
      }
    });
    
    scanner.on('progress', (data) => {
      process.stdout.write(`\r${chalk.blue(`Scanning... [${data.percent}%]`)} - ${data.scanned} of ${data.total} IPs checked`);
    });
    
    // Handle graceful termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScan interrupted. Shutting down...'));
      scanner.abort();
      process.exit(0);
    });
    
    // Display scan information
    console.log(chalk.blue('Starting IP Scan'));
    console.log(`Range:       ${chalk.yellow(cidr)}`);
    console.log(`Ping:        ${chalk.yellow(options.ping ? 'Yes' : 'No')}`);
    console.log(`Timeout:     ${chalk.yellow(timeout)}ms`);
    console.log(`Concurrency: ${chalk.yellow(options.concurrent)}`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Expand the CIDR to count IPs
    const ipCount = scanner.expandCidr(cidr).length;
    console.log(`${chalk.yellow('Scanning')} ${ipCount} IP addresses\n`);
    
    // Start the scan
    const startTime = Date.now();
    const results = await scanner.scan(cidr, {
      ping: options.ping
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    // Filter results by status if ping was enabled
    const upHosts = options.ping ? results.filter(r => r.status === 'up') : results;
    
    // Display scan results
    console.log(chalk.blue('\nScan Results'));
    console.log(`${chalk.yellow('IPs Scanned:')} ${results.length}`);
    if (options.ping) {
      console.log(`${chalk.yellow('Hosts UP:')} ${upHosts.length}`);
    }
    console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
    
    if (!options.ping || upHosts.length === 0) {
      console.log(chalk.yellow('\nNo active hosts found or ping not enabled.'));
    } else {
      console.log(chalk.blue('-'.repeat(60)));
      
      // Format results table for up hosts
      console.log(`${chalk.cyan('IP ADDRESS'.padEnd(16))} ${chalk.cyan('STATUS'.padEnd(8))} ${chalk.cyan('HOSTNAME'.padEnd(30))} ${chalk.cyan('LATENCY')}`);
      
      upHosts.forEach(result => {
        const ip = result.ip.padEnd(16);
        const status = (result.status || 'unknown').padEnd(8);
        const hostname = (result.hostname || '').padEnd(30);
        const latency = result.latency ? `${result.latency}ms` : '';
        
        console.log(`${chalk.green(ip)} ${status === 'up' ? chalk.green(status) : chalk.red(status)} ${hostname} ${latency}`);
      });
    }
    
    // Output results to file if requested
    if (options.output) {
      // Prepare target hosts for comprehensive format
      const networkRange = cidr;
      
      await reporter.writeResults(results, {
        filename: options.output,
        format: options.format,
        scanType: 'ip-scan',
        comprehensive: options.comprehensive === 'true',
        scanTitle: options.scanTitle || `IP Range Scan (${networkRange}) - ${new Date().toLocaleDateString()}`,
        targetHosts: [networkRange],
        excludedHosts: []
      });
      console.log(chalk.green(`\nResults written to ${options.output}`));
    }
    
  } catch (error) {
    logger.error(`IP scan error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = ipScan;
