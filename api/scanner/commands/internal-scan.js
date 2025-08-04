/**
 * Internal scanning command module for secure environments
 * Designed for government/sensitive environments with no external connections
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);
const chalk = require('chalk');
const semver = require('semver');
const winston = require('winston');

// Internal scanner modules
const VulnerabilityScanner = require('../lib/scanners/vulnerability-scanner');
const ComplianceScanner = require('../lib/scanners/compliance-scanner');
const { createAuditLog } = require('../lib/utils/audit-logger');

// For now, let's create a simple formatter since we may not have the actual comprehensive formatter yet
const formatComprehensiveResults = (results, options) => {
  const scanTitle = options.scanTitle || 'Internal Security Scan';
  const timestamp = new Date().toISOString();
  
  // Ensure the summary and risk levels exist
  const summary = results.summary || {};
  const riskLevels = summary.byRisk || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0
  };
  
  // Ensure compliance results exist
  const compliance = results.compliance || {};
  const complianceSummary = compliance.summary || null;
  
  return {
    scan_info: {
      title: scanTitle,
      scan_id: results.metadata.scanId,
      timestamp: timestamp,
      scan_date: timestamp.split('T')[0],
      environment: 'secure',
      scan_types: results.metadata.scanTypes || []
    },
    summary: {
      total_findings: results.findings ? results.findings.length : 0,
      risk_levels: riskLevels,
      compliance: complianceSummary,
    },
    findings: results.findings || [],
    compliance_results: compliance,
    metadata: results.metadata || {}
  };
};

/**
 * Handle internal scan command for secure environments
 * @param {Object} options - Command options
 */
async function internalScan(options) {
  // Start audit logging
  const audit = createAuditLog('internal-scan', {
    user: options.user || process.env.USER || 'system',
    scanId: `internal-${Date.now()}`,
    offline: true
  });

  try {
    console.log(chalk.blue('┌────────────────────────────────────────────────────┐'));
    console.log(chalk.blue('│ Starting Internal Security Scan (Secure Environment)│'));
    console.log(chalk.blue('└────────────────────────────────────────────────────┘'));

    // Log scan initiation
    audit.log('scan_initiated', { options });
    
    // Check if running in offline mode (default for internal scanning)
    const offline = options.offline !== false;
    
    if (offline) {
      console.log(chalk.yellow('🔒 Running in offline mode - no external connections will be made'));
    }

    // Determine what to scan based on options
    let scanTypes = options.scanTypes || ['configuration', 'compliance', 'patch-detection'];
    
    // Handle if scanTypes is provided as a string (from command line)
    if (typeof scanTypes === 'string') {
      scanTypes = scanTypes.split(',').map(type => type.trim());
    }
    
    console.log(chalk.cyan(`Scan types: ${scanTypes.join(', ')}`));

    // Collect results from all scan types
    const results = {
      metadata: {
        timestamp: new Date().toISOString(),
        scanId: audit.scanId,
        scanTypes,
        environment: 'secure',
        offline
      },
      findings: [],
      compliance: {},
      summary: {
        total: 0,
        byRisk: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0
        }
      }
    };

    // Run configuration scanning
    if (scanTypes.includes('configuration')) {
      console.log(chalk.blue('\nScanning system configuration...'));
      const configResults = await scanSystemConfiguration(options);
      results.findings = results.findings.concat(configResults);
      
      // Update summary counts
      configResults.forEach(finding => {
        results.summary.total++;
        results.summary.byRisk[finding.riskLevel]++;
      });
    }

    // Run compliance scanning
    if (scanTypes.includes('compliance')) {
      console.log(chalk.blue('\nPerforming compliance assessment...'));
      const framework = options.framework || 'nist-800-53';
      const complianceScanner = new ComplianceScanner();
      const frameworkControls = complianceScanner._getComplianceControls(framework);
      
      // Log available frameworks if requested
      if (options.listFrameworks) {
        const frameworks = complianceScanner.getAvailableFrameworks();
        console.log(chalk.yellow('\nAvailable compliance frameworks:'));
        frameworks.forEach(fw => {
          console.log(chalk.cyan(`- ${fw.id}: ${fw.name}`));
        });
      }
      
      // Perform offline compliance checks
      const complianceResults = await checkOfflineCompliance(frameworkControls, options);
      results.compliance = {
        framework,
        controls: complianceResults,
        summary: {
          passed: complianceResults.filter(c => c.status === 'pass').length,
          failed: complianceResults.filter(c => c.status === 'fail').length,
          partial: complianceResults.filter(c => c.status === 'partial').length,
          notApplicable: complianceResults.filter(c => c.status === 'not_applicable').length
        }
      };
    }

    // Run patch detection
    if (scanTypes.includes('patch-detection')) {
      console.log(chalk.blue('\nChecking for missing patches and updates...'));
      const patchResults = await checkForMissingPatches(options);
      results.findings = results.findings.concat(patchResults);
      
      // Update summary counts
      patchResults.forEach(finding => {
        results.summary.total++;
        results.summary.byRisk[finding.riskLevel]++;
      });
    }

    // Output results
    if (options.output) {
      const outputPath = path.resolve(options.output);
      console.log(chalk.blue(`\nWriting results to ${outputPath}`));
      
      // Format the results based on comprehensive format if requested
      let outputResults = results;
      if (options.comprehensive) {
        outputResults = formatComprehensiveResults({
          findings: results.findings,
          metadata: results.metadata,
          compliance: results.compliance
        }, options);
      }
      
      await fs.promises.writeFile(
        outputPath, 
        JSON.stringify(outputResults, null, 2)
      );
      console.log(chalk.green('Results saved successfully.'));
    }

    // Display summary
    console.log(chalk.blue('\n┌────────────────────────────────────────────┐'));
    console.log(chalk.blue('│ Internal Security Scan Summary               │'));
    console.log(chalk.blue('└────────────────────────────────────────────┘'));
    console.log(chalk.yellow(`Total findings: ${results.summary.total}`));
    console.log(chalk.red(`Critical: ${results.summary.byRisk.critical}`));
    console.log(chalk.magenta(`High: ${results.summary.byRisk.high}`));
    console.log(chalk.yellow(`Medium: ${results.summary.byRisk.medium}`));
    console.log(chalk.blue(`Low: ${results.summary.byRisk.low}`));
    console.log(chalk.gray(`Info: ${results.summary.byRisk.info}`));
    
    if (results.compliance && results.compliance.summary) {
      console.log(chalk.blue('\nCompliance Summary:'));
      console.log(chalk.green(`Passed: ${results.compliance.summary.passed}`));
      console.log(chalk.red(`Failed: ${results.compliance.summary.failed}`));
      console.log(chalk.yellow(`Partial: ${results.compliance.summary.partial}`));
      console.log(chalk.gray(`Not Applicable: ${results.compliance.summary.notApplicable}`));
    }

    // Complete audit log
    audit.log('scan_completed', { 
      findingCount: results.summary.total,
      criticalCount: results.summary.byRisk.critical,
      highCount: results.summary.byRisk.high
    });

    return results;
  } catch (error) {
    console.error(chalk.red('Error during internal scan:'), error.message);
    // Log error to audit log
    audit.log('scan_error', { 
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Scan system configuration for security issues
 * @param {Object} options - Scan options
 * @returns {Array} - Configuration findings
 */
async function scanSystemConfiguration(options) {
  const findings = [];
  
  try {
    // Check file permissions on sensitive files
    const sensitivePaths = [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/ssh/sshd_config',
      '/etc/hosts'
    ];
    
    // Check only accessible files
    for (const filePath of sensitivePaths) {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const permissions = stats.mode.toString(8).slice(-3);
          
          // Check for overly permissive settings
          if (permissions.endsWith('6') || permissions.endsWith('7')) {
            findings.push({
              id: `CONFIG-PERM-${filePath.replace(/[^a-z0-9]/gi, '-')}`,
              title: `Insecure permissions on ${filePath}`,
              description: `The file ${filePath} has permissions ${permissions} which may be too permissive for a secure environment.`,
              riskLevel: 'high',
              remediation: `Change permissions with: chmod 644 ${filePath}`,
              category: 'configuration',
              details: {
                path: filePath,
                permissions,
                recommended: filePath.includes('shadow') ? '600' : '644'
              }
            });
          }
        }
      } catch (err) {
        // Skip files we can't access (expected in some cases)
      }
    }
    
    // Check for secure boot configuration
    try {
      const { stdout } = await execAsync('mokutil --sb-state', { timeout: 5000 });
      if (stdout.includes('disabled')) {
        findings.push({
          id: 'CONFIG-SECBOOT-1',
          title: 'Secure Boot Disabled',
          description: 'Secure Boot is currently disabled on this system, which reduces protection against boot-level attacks.',
          riskLevel: 'medium',
          remediation: 'Enable Secure Boot in the BIOS/UEFI settings.',
          category: 'configuration',
          details: {
            current: 'disabled',
            recommended: 'enabled'
          }
        });
      }
    } catch (err) {
      // mokutil might not be available, skip this check
    }
    
    // Check for essential security services
    const services = [
      { name: 'firewalld', description: 'Firewall service' },
      { name: 'auditd', description: 'Audit daemon' },
      { name: 'aide', description: 'Advanced Intrusion Detection Environment' }
    ];
    
    for (const service of services) {
      try {
        const { stdout } = await execAsync(`systemctl is-active ${service.name}`, { timeout: 3000 });
        if (!stdout.includes('active')) {
          findings.push({
            id: `CONFIG-SERVICE-${service.name.toUpperCase()}`,
            title: `${service.description} Inactive`,
            description: `The ${service.description} (${service.name}) is not running, which may reduce system security.`,
            riskLevel: 'medium',
            remediation: `Enable and start the service with: systemctl enable --now ${service.name}`,
            category: 'configuration',
            details: {
              service: service.name,
              status: 'inactive',
              recommended: 'active'
            }
          });
        }
      } catch (err) {
        // Service might not be installed, or systemctl not available
      }
    }
    
    // Additional checks specific to government environments can be added here
  } catch (error) {
    console.warn(chalk.yellow('Some configuration checks could not be completed:'), error.message);
  }
  
  return findings;
}

/**
 * Check compliance against specified framework in offline mode
 * @param {Array} controls - Controls from the framework
 * @param {Object} options - Scan options
 * @returns {Array} - Compliance results
 */
async function checkOfflineCompliance(controls, options) {
  const complianceResults = [];
  const frameworkId = options.framework || 'nist-800-53';
  
  // Check each control for compliance
  for (const control of controls) {
    let status = 'not_checked';
    const findings = [];
    const evidence = [];
    
    // Add logic to check specific controls based on the framework
    if (frameworkId === 'nist-800-53') {
      if (control.id.startsWith('AC-')) {
        // Access Control checks
        if (control.id === 'AC-2') {
          // Check account management
          try {
            const { stdout } = await execAsync('cat /etc/passwd | wc -l', { timeout: 3000 });
            const accountCount = parseInt(stdout.trim());
            evidence.push(`System has ${accountCount} accounts`);
            
            if (accountCount > 100) {
              status = 'partial';
              findings.push('Large number of system accounts detected');
            } else {
              status = 'pass';
            }
          } catch (err) {
            status = 'not_applicable';
          }
        } else if (control.id === 'AC-7') {
          // Check login attempt limits
          try {
            const { stdout } = await execAsync('grep "pam_tally2" /etc/pam.d/system-auth', { timeout: 3000 });
            if (stdout.includes('pam_tally2')) {
              status = 'pass';
              evidence.push('Login attempt limits are configured');
            } else {
              status = 'fail';
              findings.push('No login attempt limits configured');
            }
          } catch (err) {
            status = 'not_applicable';
          }
        }
      } else if (control.id.startsWith('AU-')) {
        // Audit checks
        if (control.id === 'AU-2') {
          // Check audit configuration
          try {
            const { stdout } = await execAsync('systemctl is-active auditd', { timeout: 3000 });
            if (stdout.includes('active')) {
              status = 'pass';
              evidence.push('Audit daemon is active');
            } else {
              status = 'fail';
              findings.push('Audit daemon is not active');
            }
          } catch (err) {
            status = 'not_applicable';
          }
        }
      } else if (control.id.startsWith('CM-')) {
        // Configuration Management checks
        if (control.id === 'CM-6') {
          // Check configuration settings
          try {
            const { stdout } = await execAsync('sysctl kernel.randomize_va_space', { timeout: 3000 });
            if (stdout.includes('kernel.randomize_va_space = 2')) {
              status = 'pass';
              evidence.push('ASLR is properly configured');
            } else {
              status = 'fail';
              findings.push('ASLR is not properly configured');
            }
          } catch (err) {
            status = 'not_applicable';
          }
        }
      }
    } else if (frameworkId === 'stig') {
      // STIG specific checks could be implemented here
    }
    
    // If control wasn't checked specifically, mark as not_applicable
    if (status === 'not_checked') {
      status = 'not_applicable';
    }
    
    complianceResults.push({
      id: control.id,
      title: control.title,
      description: control.description,
      status,
      findings,
      evidence,
      severity: control.impact || 'medium'
    });
  }
  
  return complianceResults;
}

/**
 * Check for missing patches and updates in offline mode
 * @param {Object} options - Scan options
 * @returns {Array} - Patch findings
 */
async function checkForMissingPatches(options) {
  const findings = [];
  
  try {
    // Check OS version and patch level
    const osChecks = [
      // Check Linux kernel version
      {
        command: 'uname -r',
        parse: (output) => {
          const version = output.trim();
          const major = parseInt(version.split('.')[0]);
          const minor = parseInt(version.split('.')[1]);
          
          if (major < 5 || (major === 5 && minor < 4)) {
            findings.push({
              id: 'PATCH-KERNEL-1',
              title: 'Outdated Linux Kernel',
              description: `Linux kernel ${version} is outdated and may have known security vulnerabilities.`,
              riskLevel: 'high',
              remediation: 'Update to a newer kernel version with latest security patches.',
              category: 'patch',
              details: {
                current: version,
                recommended: '≥ 5.4.0',
                cves: ['CVE-2020-8648', 'CVE-2020-10781']
              }
            });
          }
          return version;
        }
      },
      
      // Check for available package updates
      {
        command: 'apt list --upgradable 2>/dev/null | grep -i security || yum check-update --security 2>/dev/null | grep -i secu',
        parse: (output) => {
          if (output && output.trim().length > 0) {
            const lines = output.trim().split('\n');
            const packages = lines.map(line => {
              const parts = line.split(/\s+/);
              return parts[0];
            }).filter(Boolean);
            
            if (packages.length > 0) {
              findings.push({
                id: 'PATCH-SECURITY-1',
                title: 'Security Updates Available',
                description: `${packages.length} security updates are available for installation.`,
                riskLevel: 'high',
                remediation: 'Install security updates using system package manager (apt upgrade or yum update).',
                category: 'patch',
                details: {
                  packages: packages.slice(0, 10),
                  total: packages.length
                }
              });
            }
          }
          return output;
        }
      }
    ];
    
    // Execute OS checks
    for (const check of osChecks) {
      try {
        const { stdout } = await execAsync(check.command, { timeout: 10000 });
        check.parse(stdout);
      } catch (err) {
        // Command might not be available on this system
      }
    }
    
    // Check installed application versions
    await checkInstalledApplications(findings);
    
  } catch (error) {
    console.warn(chalk.yellow('Some patch checks could not be completed:'), error.message);
  }
  
  return findings;
}

/**
 * Check for outdated applications and frameworks
 * @param {Array} findings - Findings array to append to
 */
async function checkInstalledApplications(findings) {
  // Check Node.js version
  try {
    const { stdout } = await execAsync('node --version', { timeout: 3000 });
    const version = stdout.trim().replace('v', '');
    
    if (semver.lt(version, '12.0.0')) {
      findings.push({
        id: 'PATCH-NODEJS-1',
        title: 'Outdated Node.js Version',
        description: `Node.js ${version} is end-of-life and no longer receives security updates.`,
        riskLevel: 'high',
        remediation: 'Update to an LTS version of Node.js (14.x, 16.x, or newer).',
        category: 'patch',
        details: {
          current: version,
          recommended: '≥ 14.0.0',
          eol: true
        }
      });
    } else if (semver.lt(version, '14.0.0')) {
      findings.push({
        id: 'PATCH-NODEJS-2',
        title: 'Aging Node.js Version',
        description: `Node.js ${version} is approaching end-of-life.`,
        riskLevel: 'medium',
        remediation: 'Consider updating to a current LTS version of Node.js (14.x, 16.x, or newer).',
        category: 'patch',
        details: {
          current: version,
          recommended: '≥ 14.0.0',
          eol: false
        }
      });
    }
  } catch (err) {
    // Node.js might not be installed
  }
  
  // Check OpenSSL version
  try {
    const { stdout } = await execAsync('openssl version', { timeout: 3000 });
    const version = stdout.split(' ')[1];
    
    if (version.startsWith('1.0.')) {
      findings.push({
        id: 'PATCH-OPENSSL-1',
        title: 'Outdated OpenSSL Version',
        description: `OpenSSL ${version} is outdated and has known vulnerabilities.`,
        riskLevel: 'high',
        remediation: 'Update to OpenSSL 1.1.1 or newer.',
        category: 'patch',
        details: {
          current: version,
          recommended: '≥ 1.1.1',
          cves: ['CVE-2016-6309', 'CVE-2016-7052']
        }
      });
    }
  } catch (err) {
    // OpenSSL might not be directly accessible
  }
  
  // Check for local package.json and detect outdated dependencies
  try {
    if (fs.existsSync('./package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Check for known vulnerable or outdated packages
      const vulnerableDeps = [];
      
      // Example checks - in real implementation, this would use a vulnerability database
      if (dependencies.lodash && semver.lt(dependencies.lodash.replace('^', ''), '4.17.21')) {
        vulnerableDeps.push({
          name: 'lodash',
          version: dependencies.lodash,
          recommended: '4.17.21',
          cves: ['CVE-2020-8203']
        });
      }
      
      if (dependencies.express && semver.lt(dependencies.express.replace('^', ''), '4.17.1')) {
        vulnerableDeps.push({
          name: 'express',
          version: dependencies.express,
          recommended: '4.17.1'
        });
      }
      
      if (vulnerableDeps.length > 0) {
        findings.push({
          id: 'PATCH-NODEJS-DEPS',
          title: 'Vulnerable Node.js Dependencies',
          description: `${vulnerableDeps.length} potentially vulnerable dependencies found in package.json.`,
          riskLevel: 'high',
          remediation: 'Update dependencies to their latest secure versions using npm update.',
          category: 'patch',
          details: {
            dependencies: vulnerableDeps
          }
        });
      }
    }
  } catch (err) {
    // package.json might not exist or be readable
  }
}

module.exports = internalScan;