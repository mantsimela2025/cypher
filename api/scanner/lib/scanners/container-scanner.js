const { EventEmitter } = require('events');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const validator = require('../utils/validator');

const execAsync = promisify(exec);

/**
 * Container Security Scanner
 * Scans Docker containers, images, and Kubernetes environments for security vulnerabilities
 */
class ContainerScanner extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      timeout: options.timeout || 300000, // 5 minutes default
      outputFormat: options.outputFormat || 'json',
      severity: options.severity || 'medium', // minimum severity to report
      ...options
    };
    
    this.scanInProgress = false;
    this.aborted = false;
    
    // Define container security checks
    this.containerChecks = {
      'image-vulnerabilities': this.scanImageVulnerabilities.bind(this),
      'dockerfile-security': this.analyzeDockerfile.bind(this),
      'container-config': this.checkContainerConfiguration.bind(this),
      'runtime-security': this.checkRuntimeSecurity.bind(this),
      'secrets-detection': this.detectSecrets.bind(this),
      'compliance-checks': this.runComplianceChecks.bind(this),
      'registry-scan': this.scanRegistry.bind(this),
      'kubernetes-scan': this.scanKubernetes.bind(this)
    };
  }

  /**
   * Main container scan method
   * @param {string} target - Container image, registry, or Kubernetes cluster
   * @param {Object} options - Scan options
   * @returns {Promise<Object>} - Container scan results
   */
  async scan(target, options = {}) {
    if (this.scanInProgress) {
      throw new Error('A container scan is already in progress');
    }

    if (!target) {
      throw new Error('Target is required for container scanning');
    }

    this.scanInProgress = true;
    this.aborted = false;
    
    logger.scan.start('container', target);
    
    const scanResults = {
      target,
      scanType: 'container',
      timestamp: new Date().toISOString(),
      vulnerabilities: [],
      misconfigurations: [],
      secrets: [],
      compliance: {},
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0
      },
      scanDetails: {
        duration: 0,
        checksPerformed: [],
        errors: []
      }
    };

    const startTime = Date.now();

    try {
      // Determine target type and appropriate scanning strategy
      const targetType = this.detectTargetType(target);
      scanResults.targetType = targetType;

      this.emit('progress', { stage: 'initialization', percent: 10 });

      // Determine which checks to run
      const checksToRun = options.checks && Array.isArray(options.checks) ? 
        options.checks.filter(check => this.containerChecks[check]) : 
        Object.keys(this.containerChecks);

      scanResults.scanDetails.checksPerformed = checksToRun;

      // Run container security checks
      for (let i = 0; i < checksToRun.length; i++) {
        if (this.aborted) break;

        const checkName = checksToRun[i];
        const progress = 20 + (i / checksToRun.length) * 70;
        
        this.emit('progress', { 
          stage: `Running ${checkName}`, 
          percent: Math.round(progress),
          check: checkName 
        });

        try {
          const checkResults = await this.containerChecks[checkName](target, options);
          this.processCheckResults(scanResults, checkResults, checkName);
        } catch (error) {
          logger.error(`Container check ${checkName} failed:`, error.message);
          scanResults.scanDetails.errors.push({
            check: checkName,
            error: error.message
          });
        }
      }

      // Calculate final summary
      this.calculateSummary(scanResults);
      
      scanResults.scanDetails.duration = Date.now() - startTime;
      
      this.emit('progress', { stage: 'completed', percent: 100 });
      this.emit('completed', scanResults);
      
      logger.scan.complete('container', target, scanResults.summary);
      
      return scanResults;

    } catch (error) {
      scanResults.scanDetails.duration = Date.now() - startTime;
      scanResults.scanDetails.errors.push({
        check: 'general',
        error: error.message
      });
      
      this.emit('error', error);
      logger.scan.error('container', target, error.message);
      
      throw error;
    } finally {
      this.scanInProgress = false;
    }
  }

  /**
   * Detect the type of container target
   */
  detectTargetType(target) {
    if (target.includes('kubernetes') || target.includes('k8s') || target.endsWith('.yaml') || target.endsWith('.yml')) {
      return 'kubernetes';
    } else if (target.includes('registry') || target.includes('harbor') || target.includes('quay')) {
      return 'registry';
    } else if (target.includes('Dockerfile')) {
      return 'dockerfile';
    } else if (target.includes(':') && !target.includes('//')) {
      return 'image';
    } else {
      return 'container';
    }
  }

  /**
   * Scan container image for vulnerabilities using Trivy
   */
  async scanImageVulnerabilities(target, options) {
    const results = {
      vulnerabilities: [],
      metadata: {}
    };

    try {
      // Check if Trivy is available
      await execAsync('trivy --version');
      
      // Run Trivy scan
      const trivyCommand = `trivy image --format json --severity HIGH,CRITICAL ${target}`;
      const { stdout } = await execAsync(trivyCommand, { timeout: this.options.timeout });
      
      const trivyResults = JSON.parse(stdout);
      
      if (trivyResults.Results) {
        for (const result of trivyResults.Results) {
          if (result.Vulnerabilities) {
            for (const vuln of result.Vulnerabilities) {
              results.vulnerabilities.push({
                id: vuln.VulnerabilityID,
                title: vuln.Title || vuln.VulnerabilityID,
                description: vuln.Description,
                severity: vuln.Severity,
                score: vuln.CVSS?.nvd?.V3Score || vuln.CVSS?.redhat?.V3Score,
                package: vuln.PkgName,
                version: vuln.InstalledVersion,
                fixedVersion: vuln.FixedVersion,
                references: vuln.References,
                category: 'vulnerability'
              });
            }
          }
        }
      }

      results.metadata = {
        scanner: 'trivy',
        target: target,
        scannedAt: new Date().toISOString()
      };

    } catch (error) {
      // Fallback to manual vulnerability checks if Trivy is not available
      results.vulnerabilities.push({
        id: 'CONTAINER-001',
        title: 'Container Vulnerability Scanner Not Available',
        description: 'Trivy scanner is not installed. Install Trivy for comprehensive vulnerability scanning.',
        severity: 'INFO',
        category: 'configuration',
        remediation: 'Install Trivy: curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh'
      });
    }

    return results;
  }

  /**
   * Analyze Dockerfile for security best practices
   */
  async analyzeDockerfile(target, options) {
    const results = {
      misconfigurations: [],
      metadata: {}
    };

    try {
      let dockerfileContent = '';
      
      if (target.includes('Dockerfile')) {
        dockerfileContent = await fs.readFile(target, 'utf8');
      } else {
        // Try to find Dockerfile in current directory or extract from image
        try {
          dockerfileContent = await fs.readFile('./Dockerfile', 'utf8');
        } catch {
          // Could not find Dockerfile
          results.misconfigurations.push({
            id: 'DOCKERFILE-001',
            title: 'Dockerfile Not Found',
            description: 'Could not locate Dockerfile for analysis',
            severity: 'INFO',
            category: 'configuration'
          });
          return results;
        }
      }

      // Analyze Dockerfile content
      const lines = dockerfileContent.split('\n');
      
      // Check for security best practices
      const checks = [
        {
          pattern: /^FROM.*:latest$/i,
          id: 'DOCKERFILE-002',
          title: 'Using Latest Tag',
          description: 'Using :latest tag can lead to unpredictable builds',
          severity: 'MEDIUM'
        },
        {
          pattern: /^USER root$/i,
          id: 'DOCKERFILE-003',
          title: 'Running as Root User',
          description: 'Container is configured to run as root user',
          severity: 'HIGH'
        },
        {
          pattern: /COPY.*\*.*\//i,
          id: 'DOCKERFILE-004',
          title: 'Wildcard Copy',
          description: 'Using wildcard in COPY can include unintended files',
          severity: 'MEDIUM'
        }
      ];

      lines.forEach((line, index) => {
        checks.forEach(check => {
          if (check.pattern.test(line.trim())) {
            results.misconfigurations.push({
              id: check.id,
              title: check.title,
              description: check.description,
              severity: check.severity,
              line: index + 1,
              content: line.trim(),
              category: 'dockerfile'
            });
          }
        });
      });

    } catch (error) {
      results.misconfigurations.push({
        id: 'DOCKERFILE-ERROR',
        title: 'Dockerfile Analysis Failed',
        description: `Failed to analyze Dockerfile: ${error.message}`,
        severity: 'INFO',
        category: 'error'
      });
    }

    return results;
  }

  /**
   * Check container runtime configuration
   */
  async checkContainerConfiguration(target, options) {
    const results = {
      misconfigurations: [],
      metadata: {}
    };

    try {
      // Check if Docker is available
      await execAsync('docker --version');
      
      // Inspect container if it's a running container
      if (target && !target.includes(':')) {
        const { stdout } = await execAsync(`docker inspect ${target}`);
        const containerInfo = JSON.parse(stdout)[0];
        
        // Check security configurations
        if (containerInfo.HostConfig.Privileged) {
          results.misconfigurations.push({
            id: 'CONTAINER-CONFIG-001',
            title: 'Privileged Container',
            description: 'Container is running in privileged mode',
            severity: 'CRITICAL',
            category: 'runtime'
          });
        }

        if (containerInfo.HostConfig.NetworkMode === 'host') {
          results.misconfigurations.push({
            id: 'CONTAINER-CONFIG-002',
            title: 'Host Network Mode',
            description: 'Container is using host network mode',
            severity: 'HIGH',
            category: 'runtime'
          });
        }
      }

    } catch (error) {
      results.misconfigurations.push({
        id: 'CONTAINER-CONFIG-ERROR',
        title: 'Container Configuration Check Failed',
        description: `Failed to check container configuration: ${error.message}`,
        severity: 'INFO',
        category: 'error'
      });
    }

    return results;
  }

  /**
   * Check runtime security
   */
  async checkRuntimeSecurity(target, options) {
    const results = {
      misconfigurations: [],
      metadata: {}
    };

    // Runtime security checks would go here
    // This is a placeholder for more advanced runtime security analysis
    
    return results;
  }

  /**
   * Detect secrets in container images
   */
  async detectSecrets(target, options) {
    const results = {
      secrets: [],
      metadata: {}
    };

    // Secret detection logic would go here
    // This could integrate with tools like truffleHog or gitleaks
    
    return results;
  }

  /**
   * Run compliance checks (CIS Docker Benchmark)
   */
  async runComplianceChecks(target, options) {
    const results = {
      compliance: {},
      metadata: {}
    };

    // CIS Docker Benchmark checks would go here
    
    return results;
  }

  /**
   * Scan container registry
   */
  async scanRegistry(target, options) {
    const results = {
      vulnerabilities: [],
      metadata: {}
    };

    // Registry scanning logic would go here
    
    return results;
  }

  /**
   * Scan Kubernetes environment
   */
  async scanKubernetes(target, options) {
    const results = {
      misconfigurations: [],
      metadata: {}
    };

    // Kubernetes security scanning would go here
    
    return results;
  }

  /**
   * Process check results and add to main results
   */
  processCheckResults(scanResults, checkResults, checkName) {
    if (checkResults.vulnerabilities) {
      scanResults.vulnerabilities.push(...checkResults.vulnerabilities);
    }
    if (checkResults.misconfigurations) {
      scanResults.misconfigurations.push(...checkResults.misconfigurations);
    }
    if (checkResults.secrets) {
      scanResults.secrets.push(...checkResults.secrets);
    }
    if (checkResults.compliance) {
      Object.assign(scanResults.compliance, checkResults.compliance);
    }
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(scanResults) {
    const allFindings = [
      ...scanResults.vulnerabilities,
      ...scanResults.misconfigurations,
      ...scanResults.secrets
    ];

    allFindings.forEach(finding => {
      const severity = finding.severity?.toLowerCase() || 'info';
      if (scanResults.summary[severity] !== undefined) {
        scanResults.summary[severity]++;
      }
    });
  }

  /**
   * Abort the current scan
   */
  abort() {
    this.aborted = true;
    this.emit('aborted');
  }
}

module.exports = ContainerScanner;
