const chalk = require('chalk');
const WebScanner = require('../lib/scanners/web-scanner');
const reporter = require('../lib/utils/reporter');
const validator = require('../lib/utils/validator');
const logger = require('../lib/utils/logger');
const fs = require('fs');

/**
 * Handle web application scan command
 * @param {string} target - Target URL to scan
 * @param {Object} options - Command options
 */
async function webScan(target, options) {
  try {
    // Validate target
    if (!validator.isValidTarget(target)) {
      logger.error(`Invalid target: ${target}`);
      process.exit(1);
    }
    
    // Parse and validate timeout
    const timeout = validator.parseTimeout(options.timeout, 10000);
    
    // Initialize scanner
    const scanner = new WebScanner({
      timeout,
      maxDepth: options.maxDepth ? parseInt(options.maxDepth, 10) : 3,
      maxPages: options.maxPages ? parseInt(options.maxPages, 10) : 100,
      userAgent: options.userAgent || 'Mozilla/5.0 VulScan Web Security Scanner/1.0'
    });
    
    // Parse security checks
    let checks = [];
    if (options.checks && options.checks !== 'all') {
      checks = options.checks.split(',').map(c => c.trim());
    } else {
      // All available checks
      checks = [
        'http-headers',
        'ssl-tls',
        'xss',
        'csrf',
        'sql-injection',
        'file-inclusion',
        'sensitive-data',
        'insecure-cookies',
        'open-redirects',
        'outdated-software'
      ];
    }
    
    // Handle authentication if provided
    let auth = null;
    if (options.credentialsFile) {
      try {
        if (!fs.existsSync(options.credentialsFile)) {
          logger.error(`Credentials file not found: ${options.credentialsFile}`);
          process.exit(1);
        }
        
        const credentialsData = fs.readFileSync(options.credentialsFile, 'utf8');
        auth = JSON.parse(credentialsData);
        
        logger.info(`Loaded web credentials from ${options.credentialsFile}`);
      } catch (error) {
        logger.error(`Error loading credentials: ${error.message}`);
        process.exit(1);
      }
    } else if (options.username && options.password) {
      auth = {
        type: 'form',
        username: options.username,
        password: options.password,
        loginUrl: options.loginUrl,
        usernameField: options.usernameField || 'username',
        passwordField: options.passwordField || 'password'
      };
      
      logger.info(`Using form authentication for ${options.username}`);
    } else if (options.basicAuth) {
      const [username, password] = options.basicAuth.split(':');
      
      if (!username || !password) {
        logger.error('Invalid Basic Auth format. Use --basic-auth username:password');
        process.exit(1);
      }
      
      auth = {
        type: 'basic',
        username,
        password
      };
      
      logger.info(`Using Basic authentication for ${username}`);
    }
    
    // Set up event listeners for progress
    scanner.on('progress', (data) => {
      if (data.phase) {
        process.stdout.write(`\r${chalk.blue(`${data.phase}... [${Math.round((data.current / data.total) * 100)}%] - ${data.details}`)}`);
      }
    });
    
    // Handle graceful termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScan interrupted. Shutting down...'));
      scanner.abort();
      process.exit(0);
    });
    
    // Display scan information
    console.log(chalk.blue('Starting Web Application Scan'));
    console.log(`Target:      ${chalk.yellow(target)}`);
    console.log(`Checks:      ${chalk.yellow(options.checks || 'all')}`);
    console.log(`Crawl:       ${chalk.yellow(options.noCrawl ? 'No' : 'Yes')}`);
    console.log(`Max Depth:   ${chalk.yellow(options.maxDepth || '3')}`);
    console.log(`Max Pages:   ${chalk.yellow(options.maxPages || '100')}`);
    console.log(`Auth:        ${chalk.yellow(auth ? 'Yes' : 'No')}`);
    console.log(`Timeout:     ${chalk.yellow(timeout)}ms`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Start the scan
    const startTime = Date.now();
    const results = await scanner.scan(target, {
      crawl: !options.noCrawl,
      checks,
      formAnalysis: options.formAnalysis !== 'false',
      auth
    });
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Clear the progress line
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    // Display scan results
    console.log(chalk.blue('\nWeb Application Scan Results'));
    console.log(`${chalk.yellow('Target:')} ${target}`);
    console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
    console.log(`${chalk.yellow('Pages Scanned:')} ${results.stats.scannedUrls}`);
    console.log(`${chalk.yellow('Forms Analyzed:')} ${results.stats.forms}`);
    
    // Display vulnerability summary
    const vulnStats = results.stats.vulnerabilities || { total: 0 };
    console.log(`${chalk.yellow('Vulnerabilities Found:')} ${vulnStats.total}`);
    
    if (vulnStats.total > 0) {
      console.log(`  ${chalk.red(`Critical: ${vulnStats.critical || 0}`)}`);
      console.log(`  ${chalk.magenta(`High: ${vulnStats.high || 0}`)}`);
      console.log(`  ${chalk.yellow(`Medium: ${vulnStats.medium || 0}`)}`);
      console.log(`  ${chalk.blue(`Low: ${vulnStats.low || 0}`)}`);
      console.log(`  ${chalk.gray(`Info: ${vulnStats.info || 0}`)}`);
      
      // Show vulnerabilities by severity
      const severities = ['critical', 'high', 'medium', 'low', 'info'];
      
      for (const severity of severities) {
        const vulns = results.vulnerabilities.filter(v => v.severity === severity);
        
        if (vulns.length > 0) {
          let colorFn;
          switch (severity) {
            case 'critical':
              colorFn = chalk.red.bold;
              break;
            case 'high':
              colorFn = chalk.magenta;
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
          
          console.log(`\n${colorFn(`${severity.toUpperCase()} Severity Issues:`)}`);
          
          vulns.forEach((vuln, index) => {
            console.log(`${index + 1}. ${colorFn(vuln.name)}`);
            console.log(`   ${vuln.description}`);
            
            if (vuln.remediation) {
              console.log(`   ${chalk.green('Remediation:')} ${vuln.remediation}`);
            }
            
            if (vuln.evidence && vuln.evidence.url) {
              console.log(`   ${chalk.cyan('URL:')} ${vuln.evidence.url}`);
            }
            
            console.log(); // Add blank line between vulnerabilities
          });
        }
      }
    } else {
      console.log(chalk.green('\nNo vulnerabilities detected.'));
    }
    
    // Display crawled pages summary
    if (results.pages.length > 0 && !options.noCrawl) {
      console.log(chalk.blue('\nCrawled Pages (Top 10):'));
      results.pages.slice(0, 10).forEach((page, index) => {
        console.log(`${index + 1}. ${page.url} - ${page.statusCode} - ${page.title || 'No title'}`);
      });
      
      if (results.pages.length > 10) {
        console.log(`...and ${results.pages.length - 10} more pages`);
      }
    }
    
    // Display forms summary
    if (results.forms.length > 0 && options.formAnalysis !== 'false') {
      console.log(chalk.blue('\nDetected Forms (Top 5):'));
      results.forms.slice(0, 5).forEach((form, index) => {
        console.log(`${index + 1}. ${form.action} - Method: ${form.method.toUpperCase()} - Fields: ${form.fields.length}`);
      });
      
      if (results.forms.length > 5) {
        console.log(`...and ${results.forms.length - 5} more forms`);
      }
    }
    
    // Output results to file if requested
    if (options.output) {
      // Parse target hosts for comprehensive format
      const targetHost = target.replace(/^https?:\/\//, '').split('/')[0];
      const targetHosts = [targetHost];
      
      await reporter.writeResults(results, {
        filename: options.output,
        format: options.format,
        scanType: 'web-scan',
        comprehensive: options.comprehensive === 'true',
        scanTitle: options.scanTitle || `Web Application Scan - ${new Date().toLocaleDateString()}`,
        targetHosts: targetHosts,
        excludedHosts: []
      });
      console.log(chalk.green(`\nResults written to ${options.output}`));
    }
    
  } catch (error) {
    logger.error(`Web scan error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = webScan;