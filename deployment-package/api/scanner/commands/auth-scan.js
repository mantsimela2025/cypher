const chalk = require('chalk');
const AuthScanner = require('../lib/scanners/auth-scanner');
const reporter = require('../lib/utils/reporter');
const validator = require('../lib/utils/validator');
const logger = require('../lib/utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Handle authenticated scan command
 * @param {string} target - Target to scan
 * @param {Object} options - Command options
 */
async function authScan(target, options) {
  try {
    // Validate target
    if (!validator.isValidTarget(target)) {
      logger.error(`Invalid target: ${target}`);
      process.exit(1);
    }
    
    // Parse and validate timeout
    const timeout = validator.parseTimeout(options.timeout, 10000);
    
    // Initialize scanner
    const scanner = new AuthScanner({
      timeout
    });
    
    // Load credentials
    if (options.credentialsFile) {
      try {
        if (!fs.existsSync(options.credentialsFile)) {
          logger.error(`Credentials file not found: ${options.credentialsFile}`);
          process.exit(1);
        }
        
        const credentialsData = fs.readFileSync(options.credentialsFile, 'utf8');
        const credentials = JSON.parse(credentialsData);
        
        if (!Array.isArray(credentials)) {
          logger.error('Invalid credentials file format. Expected an array of credential objects.');
          process.exit(1);
        }
        
        credentials.forEach(credential => {
          try {
            scanner.addCredential(credential);
          } catch (error) {
            logger.warn(`Skipping invalid credential: ${error.message}`);
          }
        });
        
        logger.info(`Loaded ${credentials.length} credentials from ${options.credentialsFile}`);
      } catch (error) {
        logger.error(`Error loading credentials: ${error.message}`);
        process.exit(1);
      }
    } else if (options.username && (options.password || options.keyFile)) {
      // Add credential from command line
      const credential = {
        type: options.scanType || 'ssh',
        username: options.username,
        password: options.password,
        keyFile: options.keyFile
      };
      
      try {
        scanner.addCredential(credential);
        logger.info(`Added ${credential.type} credential for ${credential.username}`);
      } catch (error) {
        logger.error(`Invalid credential: ${error.message}`);
        process.exit(1);
      }
    } else {
      logger.error('No credentials provided. Use --credentials-file or --username with --password/--key-file');
      process.exit(1);
    }
    
    // Set up event listeners for progress
    scanner.on('progress', (data) => {
      if (data.phase) {
        process.stdout.write(`\r${chalk.blue(`${data.phase}... [${Math.round((data.current / data.total) * 100)}%]`)}`);
      }
    });
    
    // Handle graceful termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScan interrupted. Shutting down...'));
      scanner.abort();
      process.exit(0);
    });
    
    // Display scan information
    console.log(chalk.blue('Starting Authenticated Scan'));
    console.log(`Target:        ${chalk.yellow(target)}`);
    console.log(`Scan Type:     ${chalk.yellow(options.scanType || 'ssh')}`);
    console.log(`Port:          ${chalk.yellow(options.port || 'default')}`);
    console.log(`Timeout:       ${chalk.yellow(timeout)}ms`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Prepare scan options
    const scanOptions = {
      scanType: options.scanType || 'ssh',
      scanOptions: {}
    };
    
    // Add scan-type specific options
    if (options.port) {
      scanOptions.scanOptions.port = parseInt(options.port, 10);
    }
    
    if (options.scanType === 'web') {
      scanOptions.scanOptions.loginPath = options.loginPath || '/login';
      scanOptions.scanOptions.crawlDepth = options.crawlDepth ? parseInt(options.crawlDepth, 10) : 1;
      scanOptions.scanOptions.formScan = options.formScan !== 'false';
      
      if (options.usernameField) {
        scanOptions.scanOptions.usernameField = options.usernameField;
      }
      
      if (options.passwordField) {
        scanOptions.scanOptions.passwordField = options.passwordField;
      }
    } else if (options.scanType === 'database') {
      scanOptions.scanOptions.dbType = options.dbType || 'mysql';
      
      if (options.database) {
        scanOptions.scanOptions.database = options.database;
      }
    }
    
    // Start the scan
    const startTime = Date.now();
    const results = await scanner.scan(target, scanOptions);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    // Display scan results
    console.log(chalk.blue('\nAuthenticated Scan Results'));
    console.log(`${chalk.yellow('Target:')} ${target}`);
    console.log(`${chalk.yellow('Scan Type:')} ${options.scanType || 'ssh'}`);
    console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
    console.log(`${chalk.yellow('Authentication:')} ${results.authenticated ? chalk.green('Successful') : chalk.red('Failed')}`);
    
    if (results.authenticated) {
      console.log(`${chalk.yellow('Authenticated As:')} ${results.authenticatedWith.username}`);
      
      if (results.findings && results.findings.length > 0) {
        console.log(`${chalk.yellow('Findings:')} ${results.findings.length}`);
        console.log(chalk.blue('-'.repeat(60)));
        
        // Group findings by severity
        const severities = ['critical', 'high', 'medium', 'low', 'info'];
        const findingsBySeverity = {};
        
        severities.forEach(severity => {
          findingsBySeverity[severity] = results.findings.filter(f => f.severity === severity);
        });
        
        // Display findings by severity
        for (const severity of severities) {
          const findings = findingsBySeverity[severity];
          
          if (findings.length > 0) {
            let colorFn;
            switch (severity) {
              case 'critical':
                colorFn = chalk.red.bold;
                break;
              case 'high':
                colorFn = chalk.red;
                break;
              case 'medium':
                colorFn = chalk.yellow;
                break;
              case 'low':
                colorFn = chalk.blue;
                break;
              case 'info':
                colorFn = chalk.gray;
                break;
              default:
                colorFn = chalk.white;
            }
            
            console.log(`\n${colorFn(`${severity.toUpperCase()} Severity Findings (${findings.length})`)}`);
            
            findings.forEach((finding, index) => {
              console.log(`${index + 1}. ${colorFn(finding.type)}`);
              console.log(`   ${finding.description}`);
              
              if (finding.remediation) {
                console.log(`   ${chalk.green('Remediation:')} ${finding.remediation}`);
              }
              
              if (finding.details) {
                console.log(`   ${chalk.cyan('Details:')} ${typeof finding.details === 'object' ? 
                  JSON.stringify(finding.details) : finding.details}`);
              }
              
              console.log(); // Add blank line between findings
            });
          }
        }
      } else {
        console.log(chalk.green('\nNo security findings detected.'));
      }
      
      // Display scan-type specific information
      if (options.scanType === 'ssh' && results.systemInfo) {
        console.log(chalk.blue('\nSystem Information:'));
        
        if (results.systemInfo.details) {
          console.log(`${chalk.yellow('System:')} ${results.systemInfo.details.split('\n')[0] || 'N/A'}`);
        }
        
        if (results.systemInfo.users) {
          console.log(`${chalk.yellow('Users:')} ${results.systemInfo.users.length}`);
          console.log(results.systemInfo.users.slice(0, 10).join(', ') + 
            (results.systemInfo.users.length > 10 ? '...' : ''));
        }
        
        if (results.configurations && results.configurations.ssh) {
          console.log(chalk.blue('\nSSH Configuration Highlights:'));
          const sshConfigLines = results.configurations.ssh.split('\n')
            .filter(line => !line.startsWith('#') && line.trim().length > 0)
            .slice(0, 10);
          
          sshConfigLines.forEach(line => console.log(`  ${line.trim()}`));
          
          if (results.configurations.ssh.split('\n').length > 10) {
            console.log('  ...');
          }
        }
      } else if (options.scanType === 'web') {
        console.log(chalk.blue('\nWeb Scan Summary:'));
        console.log(`${chalk.yellow('Pages Scanned:')} ${results.pages ? results.pages.length : 0}`);
        console.log(`${chalk.yellow('Forms Detected:')} ${results.forms ? results.forms.length : 0}`);
        
        if (results.pages && results.pages.length > 0) {
          console.log(chalk.blue('\nScanned Pages:'));
          results.pages.slice(0, 10).forEach(page => {
            console.log(`  ${page.url} - ${page.title || 'No title'}`);
          });
          
          if (results.pages.length > 10) {
            console.log('  ...');
          }
        }
      } else if (options.scanType === 'database') {
        console.log(chalk.blue('\nDatabase Information:'));
        console.log(`${chalk.yellow('Type:')} ${results.dbType}`);
        console.log(`${chalk.yellow('Version:')} ${results.databaseInfo.version || 'Unknown'}`);
        console.log(`${chalk.yellow('Users:')} ${results.users ? results.users.length : 0}`);
        
        if (results.users && results.users.length > 0) {
          console.log(chalk.blue('\nDatabase Users:'));
          results.users.slice(0, 10).forEach(user => {
            console.log(`  ${user.user}@${user.host}`);
          });
          
          if (results.users.length > 10) {
            console.log('  ...');
          }
        }
      }
    }
    
    // Output results to file if requested
    if (options.output) {
      await reporter.writeResults(results, {
        filename: options.output,
        format: options.format,
        scanType: 'authenticated-scan',
        comprehensive: options.comprehensive === 'true',
        scanTitle: options.scanTitle || `Authenticated Scan - ${target} - ${new Date().toLocaleDateString()}`,
        targetHosts: [target],
        excludedHosts: []
      });
      console.log(chalk.green(`\nResults written to ${options.output}`));
    }
    
  } catch (error) {
    logger.error(`Authenticated scan error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = authScan;