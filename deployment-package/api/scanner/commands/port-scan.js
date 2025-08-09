const chalk = require('chalk');
const PortScanner = require('../lib/scanners/port-scanner');
const reporter = require('../lib/utils/reporter');
const validator = require('../lib/utils/validator');
const logger = require('../lib/utils/logger');

/**
 * Handle port scan command
 * @param {string} target - Target to scan
 * @param {Object} options - Command options
 */
async function portScan(target, options) {
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
    const timeout = validator.parseTimeout(options.timeout);
    
    // Parse and validate concurrency
    const concurrency = parseInt(options.concurrent, 10);
    if (isNaN(concurrency) || concurrency < 1 || concurrency > 1000) {
      logger.warn(`Invalid concurrency value: ${options.concurrent}, using default of 100`);
      options.concurrent = 100;
    }
    
    // Initialize scanner
    const scanner = new PortScanner({
      timeout,
      concurrency
    });
    
    // Set up event listeners
    scanner.on('portFound', (data) => {
      console.log(chalk.green(`✓ Port ${data.port} is OPEN`) + 
        chalk.grey(` (${data.service !== 'unknown' ? data.service : 'unknown service'})`));
    });
    
    scanner.on('progress', (data) => {
      process.stdout.write(`\r${chalk.blue(`Scanning... [${data.percent}%]`)} - ${data.scanned} of ${data.total} ports checked`);
    });
    
    // Handle graceful termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScan interrupted. Shutting down...'));
      scanner.abort();
      process.exit(0);
    });
    
    // Display scan information
    console.log(chalk.blue('Starting Port Scan'));
    console.log(`Target:      ${chalk.yellow(target)}`);
    console.log(`Ports:       ${chalk.yellow(options.ports)}`);
    console.log(`Timeout:     ${chalk.yellow(timeout)}ms`);
    console.log(`Concurrency: ${chalk.yellow(options.concurrent)}`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Start the scan
    const startTime = Date.now();
    const results = await scanner.scan(target, ports);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    // Display scan results
    console.log(chalk.blue('\nScan Results'));
    console.log(`${chalk.yellow('Open Ports:')} ${results.length}`);
    console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
    
    if (results.length === 0) {
      console.log(chalk.red('No open ports found.'));
    } else {
      console.log(chalk.blue('-'.repeat(60)));
      
      // Format results table
      console.log(`${chalk.cyan('PORT')}  ${chalk.cyan('STATE')}  ${chalk.cyan('SERVICE')}`);
      
      results.forEach(result => {
        console.log(`${chalk.green(result.port.toString().padEnd(5))} ${chalk.green('open'.padEnd(6))} ${result.service}`);
      });
    }
    
    // Output results to file if requested
    if (options.output) {
      // Get target host for comprehensive format
      const targetHost = target;
      
      await reporter.writeResults(results, {
        filename: options.output,
        format: options.format,
        scanType: 'port-scan',
        comprehensive: options.comprehensive === 'true',
        scanTitle: options.scanTitle || `Port Scan - ${new Date().toLocaleDateString()}`,
        targetHosts: [targetHost],
        excludedHosts: []
      });
      console.log(chalk.green(`\nResults written to ${options.output}`));
    }
    
  } catch (error) {
    logger.error(`Port scan error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = portScan;
