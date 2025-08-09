const chalk = require('chalk');
const fs = require('fs');
const ComplianceScanner = require('../lib/scanners/compliance-scanner');
const reporter = require('../lib/utils/reporter');
const validator = require('../lib/utils/validator');
const logger = require('../lib/utils/logger');

/**
 * Handle compliance scan command
 * @param {string} target - Target to scan
 * @param {Object} options - Command options
 */
async function complianceScan(target, options) {
  try {
    // Validate target
    if (!validator.isValidTarget(target)) {
      logger.error(`Invalid target: ${target}`);
      process.exit(1);
    }
    
    // Parse and validate timeout
    const timeout = validator.parseTimeout(options.timeout, 30000);
    
    // Initialize scanner
    const scanner = new ComplianceScanner({
      timeout
    });
    
    // Parse ports
    let ports = [];
    if (options.ports) {
      ports = validator.parsePorts(options.ports);
      if (!ports || ports.length === 0) {
        logger.error(`Invalid port specification: ${options.ports}`);
        process.exit(1);
      }
    } else {
      // Default ports for common services
      ports = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443];
    }
    
    // Parse frameworks
    let frameworks = [];
    if (options.frameworks) {
      frameworks = options.frameworks.split(',').map(f => f.trim().toLowerCase());
    }
    
    // Get available frameworks
    const availableFrameworks = scanner.getAvailableFrameworks();
    
    // Check if specified frameworks are valid
    if (frameworks.length > 0) {
      const invalidFrameworks = frameworks.filter(f => !availableFrameworks.some(af => af.id === f));
      if (invalidFrameworks.length > 0) {
        logger.warn(`Invalid frameworks specified: ${invalidFrameworks.join(', ')}`);
        frameworks = frameworks.filter(f => !invalidFrameworks.includes(f));
      }
    }
    
    // If no valid frameworks specified, show available frameworks and exit
    if (frameworks.length === 0) {
      console.log(chalk.yellow('No valid compliance frameworks specified.'));
      console.log(chalk.blue('\nAvailable frameworks:'));
      availableFrameworks.forEach(framework => {
        console.log(`  ${chalk.green(framework.id)}: ${framework.name}`);
        console.log(`     ${framework.description}`);
      });
      console.log(chalk.yellow('\nSpecify frameworks with --frameworks option, e.g., --frameworks pci-dss,hipaa'));
      process.exit(1);
    }
    
    // Load credentials if provided
    let credentials = null;
    if (options.credentialsFile) {
      try {
        if (!fs.existsSync(options.credentialsFile)) {
          logger.error(`Credentials file not found: ${options.credentialsFile}`);
          process.exit(1);
        }
        
        const credentialsData = fs.readFileSync(options.credentialsFile, 'utf8');
        credentials = JSON.parse(credentialsData);
        
        logger.info(`Loaded credentials from ${options.credentialsFile}`);
      } catch (error) {
        logger.error(`Error loading credentials: ${error.message}`);
        process.exit(1);
      }
    } else if (options.username && (options.password || options.keyFile)) {
      // Add credential from command line
      credentials = {
        type: options.authType || 'ssh',
        username: options.username,
        password: options.password,
        keyFile: options.keyFile
      };
      
      if (options.authType === 'database') {
        credentials.dbType = options.dbType || 'mysql';
        credentials.database = options.database;
      } else if (options.authType === 'web') {
        credentials.usernameField = options.usernameField || 'username';
        credentials.passwordField = options.passwordField || 'password';
      }
      
      logger.info(`Using ${credentials.type} credentials for ${credentials.username}`);
    }
    
    // Set up event listeners for progress
    scanner.on('progress', (data) => {
      if (data.phase) {
        process.stdout.write(`\r${chalk.blue(`${data.phase}... ${data.message || ''}`)}`);
      }
    });
    
    // Handle graceful termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScan interrupted. Shutting down...'));
      scanner.abort();
      process.exit(0);
    });
    
    // Display scan information
    console.log(chalk.blue('Starting Compliance Scan'));
    console.log(`Target:      ${chalk.yellow(target)}`);
    console.log(`Frameworks:  ${chalk.yellow(frameworks.join(', '))}`);
    console.log(`Ports:       ${chalk.yellow(options.ports || 'default')}`);
    console.log(`Auth:        ${chalk.yellow(credentials ? 'Yes' : 'No')}`);
    console.log(`Timeout:     ${chalk.yellow(timeout)}ms`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Start the scan
    const startTime = Date.now();
    const results = await scanner.scan(target, {
      frameworks,
      ports,
      credentials
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    // Display scan results
    console.log(chalk.blue('\nCompliance Scan Results'));
    console.log(`${chalk.yellow('Target:')} ${target}`);
    console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
    console.log(`${chalk.yellow('Overall Compliance Score:')} ${getScoreColor(results.summary.score)(`${results.summary.score}%`)}`);
    console.log(`${chalk.yellow('Compliance Status:')} ${getStatusColor(results.summary.status)(results.summary.status.toUpperCase())}`);
    
    console.log(chalk.blue('\nFrameworks Assessed:'));
    
    // Display framework results
    results.assessments.forEach(framework => {
      console.log(`\n${chalk.yellow(framework.name)} - ${getScoreColor(framework.score)(`${framework.score}%`)} - ${getStatusColor(framework.status)(framework.status.toUpperCase())}`);
      
      // Group controls by status
      const failedControls = framework.controls.filter(c => c.status === 'failed');
      const partialControls = framework.controls.filter(c => c.status === 'partial');
      const passedControls = framework.controls.filter(c => c.status === 'passed');
      const notApplicable = framework.controls.filter(c => c.status === 'not-applicable');
      
      // Display summary of control statuses
      console.log(`  Controls: ${chalk.red(`${failedControls.length} failed`)}, ${chalk.yellow(`${partialControls.length} partial`)}, ${chalk.green(`${passedControls.length} passed`)}, ${chalk.gray(`${notApplicable.length} N/A`)}`);
      
      // Display failed controls with some remediation advice
      if (failedControls.length > 0) {
        console.log(`\n  ${chalk.red.bold('Failed Controls:')}`);
        failedControls.forEach((control, index) => {
          console.log(`  ${index + 1}. ${chalk.red(control.id)}: ${control.requirement}`);
          
          if (control.remediation && control.remediation.general && control.remediation.general.length > 0) {
            console.log(`     ${chalk.green('Remediation:')} ${control.remediation.general[0]}`);
          }
        });
      }
      
      // Display partial controls with some remediation advice
      if (partialControls.length > 0 && failedControls.length < 5) {
        console.log(`\n  ${chalk.yellow.bold('Partially Compliant Controls:')}`);
        partialControls.slice(0, 5 - failedControls.length).forEach((control, index) => {
          console.log(`  ${index + 1}. ${chalk.yellow(control.id)}: ${control.requirement}`);
          
          if (control.remediation && control.remediation.general && control.remediation.general.length > 0) {
            console.log(`     ${chalk.green('Remediation:')} ${control.remediation.general[0]}`);
          }
        });
      }
    });
    
    // Display vulnerability summary
    console.log(chalk.blue('\nVulnerability Summary:'));
    console.log(`  ${chalk.red(`Critical: ${results.summary.criticalFindings}`)}`);
    console.log(`  ${chalk.magenta(`High: ${results.summary.highFindings}`)}`);
    console.log(`  ${chalk.yellow(`Medium: ${results.summary.mediumFindings}`)}`);
    console.log(`  ${chalk.blue(`Low: ${results.summary.lowFindings}`)}`);
    
    // Display compliance improvement recommendations
    console.log(chalk.blue('\nTop Compliance Recommendations:'));
    
    // Get top failing controls across all frameworks
    const allFailingControls = results.assessments.flatMap(framework => {
      return framework.controls
        .filter(c => c.status === 'failed' || c.status === 'partial')
        .map(c => ({
          frameworkName: framework.name,
          ...c
        }));
    }).sort((a, b) => a.score - b.score);
    
    // Show top 5 recommendations based on lowest scores
    const topRecommendations = allFailingControls.slice(0, 5);
    
    if (topRecommendations.length > 0) {
      topRecommendations.forEach((control, index) => {
        console.log(`${index + 1}. ${chalk.yellow(control.requirement)} (${control.frameworkName} - ${control.id})`);
        
        if (control.remediation && control.remediation.general && control.remediation.general.length > 0) {
          console.log(`   ${control.remediation.general.map(advice => `• ${advice}`).join('\n   ')}`);
        }
        
        console.log('');
      });
    } else {
      console.log(chalk.green('No compliance issues detected.'));
    }
    
    // Compliance report summary
    console.log(chalk.blue('\nCompliance Report Summary:'));
    console.log(`  ${results.summary.frameworksAssessed} frameworks assessed`);
    console.log(`  ${results.summary.controlsAssessed} controls evaluated`);
    
    // Output results to file if requested
    if (options.output) {
      await reporter.writeResults(results, {
        filename: options.output,
        format: options.format,
        scanType: 'compliance-scan',
        comprehensive: options.comprehensive === 'true',
        scanTitle: options.scanTitle || `Compliance Scan - ${target} - ${new Date().toLocaleDateString()}`,
        targetHosts: [target],
        excludedHosts: [],
        frameworks: frameworks
      });
      console.log(chalk.green(`\nResults written to ${options.output}`));
    }
    
  } catch (error) {
    logger.error(`Compliance scan error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Get chalk color function based on score
 * @param {number} score - Compliance score
 * @returns {Function} - Chalk color function
 */
function getScoreColor(score) {
  if (score >= 85) return chalk.green;
  if (score >= 60) return chalk.yellow;
  return chalk.red;
}

/**
 * Get chalk color function based on status
 * @param {string} status - Compliance status
 * @returns {Function} - Chalk color function
 */
function getStatusColor(status) {
  switch (status) {
    case 'compliant':
      return chalk.green;
    case 'partially-compliant':
      return chalk.yellow;
    case 'non-compliant':
      return chalk.red;
    case 'not-assessed':
    default:
      return chalk.gray;
  }
}

module.exports = complianceScan;