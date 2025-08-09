const chalk = require('chalk');
const AWSScanner = require('../lib/scanners/aws-scanner');
const reporter = require('../lib/utils/reporter');
const validator = require('../lib/utils/validator');
const logger = require('../lib/utils/logger');

/**
 * Handle AWS scan command
 * @param {Object} options - Command options
 */
async function awsScan(options) {
  try {
    // Validate region
    if (!validator.isValidAwsRegion(options.region)) {
      logger.error(`Invalid AWS region: ${options.region}`);
      process.exit(1);
    }
    
    // Parse services to scan
    const services = options.services.split(',').map(s => s.trim().toLowerCase());
    const validServices = ['ec2', 's3', 'iam', 'rds'];
    
    const invalidServices = services.filter(s => !validServices.includes(s));
    if (invalidServices.length > 0) {
      logger.warn(`Unsupported AWS services: ${invalidServices.join(', ')}`);
    }
    
    // Initialize scanner
    const scanner = new AWSScanner({
      region: options.region
    });
    
    // Set up event listeners
    scanner.on('progress', (data) => {
      if (data.phase === 'service-scan') {
        process.stdout.write(`\r${chalk.blue(`Scanning AWS ${data.service}... [${Math.round((data.current / data.total) * 100)}%]`)}`);
      }
    });
    
    // Handle graceful termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nScan interrupted. Shutting down...'));
      scanner.abort();
      process.exit(0);
    });
    
    // Display scan information
    console.log(chalk.blue('Starting AWS Security Scan'));
    console.log(`Region:   ${chalk.yellow(options.region)}`);
    console.log(`Services: ${chalk.yellow(options.services)}`);
    console.log(chalk.blue('-'.repeat(60)));
    
    // Check for AWS credentials
    try {
      console.log(chalk.blue('Verifying AWS credentials...'));
      
      // Start the scan
      const startTime = Date.now();
      const results = await scanner.scan({
        region: options.region,
        services
      });
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      // Clear the progress line
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
      
      // Display scan results summary
      console.log(chalk.blue('\nAWS Security Scan Results'));
      console.log(`${chalk.yellow('Region:')} ${options.region}`);
      console.log(`${chalk.yellow('Scan Duration:')} ${duration.toFixed(2)} seconds`);
      console.log(`${chalk.yellow('Services Scanned:')} ${results.scannedServices.length}`);
      console.log(`${chalk.yellow('Findings:')} ${results.findings.length}`);
      
      if (results.stats) {
        const { stats } = results;
        if (stats.critical > 0) console.log(`  ${chalk.redBright('Critical:')} ${stats.critical}`);
        if (stats.high > 0) console.log(`  ${chalk.red('High:')} ${stats.high}`);
        if (stats.medium > 0) console.log(`  ${chalk.yellow('Medium:')} ${stats.medium}`);
        if (stats.low > 0) console.log(`  ${chalk.blue('Low:')} ${stats.low}`);
        if (stats.info > 0) console.log(`  ${chalk.gray('Info:')} ${stats.info}`);
      }
      
      console.log(chalk.blue('-'.repeat(60)));
      
      // Display service-specific results
      console.log(chalk.blue('\nServices Scanned:'));
      
      results.scannedServices.forEach(service => {
        if (service.error) {
          console.log(`${chalk.red('✗')} ${service.name.padEnd(8)} - Error: ${service.error}`);
        } else {
          console.log(`${chalk.green('✓')} ${service.name.padEnd(8)} - ${service.findings} findings`);
        }
      });
      
      // Display findings grouped by severity and service
      if (results.findings.length > 0) {
        // Group by severity
        const severities = ['critical', 'high', 'medium', 'low', 'info'];
        
        console.log(chalk.blue('\nFindings:'));
        
        for (const severity of severities) {
          const findingsForSeverity = results.findings.filter(f => f.severity === severity);
          
          if (findingsForSeverity.length > 0) {
            // Color code severity
            let colorFn;
            switch (severity) {
              case 'critical':
                colorFn = chalk.redBright.bold;
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
            
            console.log(`\n${colorFn(`${severity.toUpperCase()} Severity (${findingsForSeverity.length})`)}`);
            console.log(colorFn('-'.repeat(severity.length + 18 + findingsForSeverity.length.toString().length)));
            
            // Group by service within each severity
            const findingsByService = {};
            
            findingsForSeverity.forEach(finding => {
              if (!findingsByService[finding.service]) {
                findingsByService[finding.service] = [];
              }
              findingsByService[finding.service].push(finding);
            });
            
            // Display findings by service
            for (const [service, serviceFindings] of Object.entries(findingsByService)) {
              console.log(colorFn(`\n${service.toUpperCase()} (${serviceFindings.length}):`));
              
              serviceFindings.forEach((finding, index) => {
                console.log(`${index + 1}. ${colorFn(finding.name)}`);
                console.log(`   Resource: ${finding.resource}`);
                console.log(`   ${finding.description}`);
                
                // Display relevant details if available
                if (finding.details) {
                  const details = Object.entries(finding.details)
                    .filter(([key, value]) => !key.includes('recommendation') && value !== null && value !== undefined)
                    .map(([key, value]) => {
                      if (typeof value === 'object') {
                        return `${key}: ${JSON.stringify(value)}`;
                      }
                      return `${key}: ${value}`;
                    });
                  
                  if (details.length > 0) {
                    console.log(`   Details: ${details.join(', ')}`);
                  }
                  
                  // Show recommendation separately if available
                  if (finding.details.recommendation) {
                    console.log(`   Recommendation: ${finding.details.recommendation}`);
                  }
                }
                
                console.log(''); // Add a blank line between findings
              });
            }
          }
        }
      } else {
        console.log(chalk.green('\nNo security findings detected.'));
      }
      
      // Output results to file if requested
      if (options.output) {
        // Get region as the target for comprehensive format
        const targetRegion = options.region;
        
        await reporter.writeResults(results, {
          filename: options.output,
          format: options.format,
          scanType: 'aws-scan',
          comprehensive: options.comprehensive === 'true',
          scanTitle: options.scanTitle || `AWS Security Scan - ${options.region} - ${new Date().toLocaleDateString()}`,
          targetHosts: [targetRegion],
          excludedHosts: []
        });
        console.log(chalk.green(`\nResults written to ${options.output}`));
      }
      
    } catch (error) {
      if (error.code === 'CredentialsError' || error.code === 'UnauthorizedOperation') {
        logger.error('AWS credentials not found or insufficient permissions.');
        console.log(chalk.yellow('\nPlease configure your AWS credentials by:'));
        console.log('1. Using environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
        console.log('2. Using ~/.aws/credentials file');
        console.log('3. Using IAM roles for EC2 instances if running on AWS');
      } else {
        logger.error(`AWS scan error: ${error.message}`);
      }
      process.exit(1);
    }
    
  } catch (error) {
    logger.error(`AWS scan error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = awsScan;
