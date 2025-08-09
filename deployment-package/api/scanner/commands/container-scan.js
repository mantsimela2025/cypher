const chalk = require('chalk');
const ContainerScanner = require('../lib/scanners/container-scanner');
const logger = require('../lib/utils/logger');
const { saveResults, formatResults } = require('../lib/utils/output');

/**
 * Container Security Scan Command
 * Scans Docker containers, images, and Kubernetes environments for security vulnerabilities
 */
async function containerScan(target, options) {
  console.log(chalk.blue.bold('\n🐳 Container Security Scanner'));
  console.log(chalk.blue('=' .repeat(50)));
  
  if (!target) {
    console.log(chalk.red('❌ Error: Target is required'));
    console.log(chalk.yellow('Usage examples:'));
    console.log('  container-scan nginx:latest');
    console.log('  container-scan my-container');
    console.log('  container-scan ./Dockerfile');
    console.log('  container-scan registry.example.com');
    console.log('  container-scan kubernetes-cluster');
    process.exit(1);
  }

  // Parse options
  const scanOptions = {
    checks: options.checks ? options.checks.split(',') : undefined,
    severity: options.severity || 'medium',
    timeout: parseInt(options.timeout) || 300000,
    outputFormat: options.format || 'json',
    comprehensive: options.comprehensive === 'true'
  };

  console.log(chalk.cyan(`\n📋 Scan Configuration:`));
  console.log(`   Target: ${chalk.white(target)}`);
  console.log(`   Checks: ${chalk.white(scanOptions.checks ? scanOptions.checks.join(', ') : 'all')}`);
  console.log(`   Min Severity: ${chalk.white(scanOptions.severity)}`);
  console.log(`   Timeout: ${chalk.white(scanOptions.timeout / 1000)}s`);

  try {
    // Initialize the container scanner
    const scanner = new ContainerScanner({
      timeout: scanOptions.timeout,
      outputFormat: scanOptions.outputFormat,
      severity: scanOptions.severity
    });

    // Set up event listeners for progress updates
    scanner.on('progress', (data) => {
      const progressBar = '█'.repeat(Math.floor(data.percent / 5)) + 
                         '░'.repeat(20 - Math.floor(data.percent / 5));
      process.stdout.write(`\r${chalk.blue(`[${progressBar}]`)} ${data.stage} (${data.percent}%)`);
    });

    scanner.on('error', (error) => {
      console.log(chalk.red(`\n❌ Scan error: ${error.message}`));
    });

    scanner.on('aborted', () => {
      console.log(chalk.yellow('\n⚠️  Scan aborted by user'));
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n⚠️  Aborting scan...'));
      scanner.abort();
      process.exit(0);
    });

    console.log(chalk.cyan('\n🔍 Starting container security scan...\n'));

    // Start the scan
    const results = await scanner.scan(target, scanOptions);

    console.log(chalk.green('\n✅ Container scan completed!\n'));

    // Display results summary
    displaySummary(results);

    // Display detailed findings
    if (options.verbose || scanOptions.comprehensive) {
      displayDetailedResults(results);
    }

    // Save results if output file specified
    if (options.output) {
      await saveResults(results, options.output, scanOptions.outputFormat);
      console.log(chalk.green(`💾 Results saved to: ${options.output}`));
    }

    // Return results for programmatic use
    return results;

  } catch (error) {
    console.log(chalk.red(`\n❌ Container scan failed: ${error.message}`));
    logger.error('Container scan error:', error);
    process.exit(1);
  }
}

/**
 * Display scan results summary
 */
function displaySummary(results) {
  console.log(chalk.blue.bold('📊 Scan Summary'));
  console.log(chalk.blue('-'.repeat(30)));
  
  console.log(`Target: ${chalk.white(results.target)}`);
  console.log(`Target Type: ${chalk.white(results.targetType)}`);
  console.log(`Scan Duration: ${chalk.white((results.scanDetails.duration / 1000).toFixed(2))}s`);
  console.log(`Checks Performed: ${chalk.white(results.scanDetails.checksPerformed.length)}`);

  console.log(chalk.blue.bold('\n🔍 Findings Summary:'));
  
  const { summary } = results;
  if (summary.critical > 0) {
    console.log(`   ${chalk.red.bold('Critical:')} ${summary.critical}`);
  }
  if (summary.high > 0) {
    console.log(`   ${chalk.red('High:')} ${summary.high}`);
  }
  if (summary.medium > 0) {
    console.log(`   ${chalk.yellow('Medium:')} ${summary.medium}`);
  }
  if (summary.low > 0) {
    console.log(`   ${chalk.blue('Low:')} ${summary.low}`);
  }
  if (summary.info > 0) {
    console.log(`   ${chalk.gray('Info:')} ${summary.info}`);
  }

  const totalFindings = summary.critical + summary.high + summary.medium + summary.low + summary.info;
  if (totalFindings === 0) {
    console.log(chalk.green('   ✅ No security issues found!'));
  }

  // Display errors if any
  if (results.scanDetails.errors.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Scan Errors:'));
    results.scanDetails.errors.forEach(error => {
      console.log(`   ${chalk.yellow(error.check)}: ${error.error}`);
    });
  }
}

/**
 * Display detailed scan results
 */
function displayDetailedResults(results) {
  console.log(chalk.blue.bold('\n📋 Detailed Findings'));
  console.log(chalk.blue('='.repeat(50)));

  // Display vulnerabilities
  if (results.vulnerabilities.length > 0) {
    console.log(chalk.red.bold('\n🚨 Vulnerabilities:'));
    results.vulnerabilities.forEach((vuln, index) => {
      const severityColor = getSeverityColor(vuln.severity);
      console.log(`\n${index + 1}. ${chalk.white.bold(vuln.title)}`);
      console.log(`   ID: ${chalk.cyan(vuln.id)}`);
      console.log(`   Severity: ${severityColor(vuln.severity)}`);
      if (vuln.score) {
        console.log(`   CVSS Score: ${chalk.white(vuln.score)}`);
      }
      if (vuln.package) {
        console.log(`   Package: ${chalk.white(vuln.package)} (${vuln.version})`);
      }
      if (vuln.fixedVersion) {
        console.log(`   Fixed in: ${chalk.green(vuln.fixedVersion)}`);
      }
      console.log(`   Description: ${chalk.gray(vuln.description)}`);
    });
  }

  // Display misconfigurations
  if (results.misconfigurations.length > 0) {
    console.log(chalk.yellow.bold('\n⚙️  Misconfigurations:'));
    results.misconfigurations.forEach((config, index) => {
      const severityColor = getSeverityColor(config.severity);
      console.log(`\n${index + 1}. ${chalk.white.bold(config.title)}`);
      console.log(`   ID: ${chalk.cyan(config.id)}`);
      console.log(`   Severity: ${severityColor(config.severity)}`);
      console.log(`   Category: ${chalk.white(config.category)}`);
      if (config.line) {
        console.log(`   Line: ${chalk.white(config.line)}`);
      }
      console.log(`   Description: ${chalk.gray(config.description)}`);
    });
  }

  // Display secrets
  if (results.secrets.length > 0) {
    console.log(chalk.magenta.bold('\n🔐 Secrets Detected:'));
    results.secrets.forEach((secret, index) => {
      console.log(`\n${index + 1}. ${chalk.white.bold(secret.title)}`);
      console.log(`   Type: ${chalk.cyan(secret.type)}`);
      console.log(`   Location: ${chalk.white(secret.location)}`);
      console.log(`   Description: ${chalk.gray(secret.description)}`);
    });
  }

  // Display compliance results
  if (Object.keys(results.compliance).length > 0) {
    console.log(chalk.blue.bold('\n📋 Compliance Results:'));
    Object.entries(results.compliance).forEach(([framework, result]) => {
      console.log(`\n${chalk.white.bold(framework)}:`);
      console.log(`   Status: ${result.passed ? chalk.green('PASSED') : chalk.red('FAILED')}`);
      console.log(`   Score: ${chalk.white(result.score)}%`);
    });
  }
}

/**
 * Get color function based on severity
 */
function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return chalk.red.bold;
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.blue;
    default:
      return chalk.gray;
  }
}

module.exports = containerScan;
