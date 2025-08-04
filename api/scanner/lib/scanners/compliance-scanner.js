const { EventEmitter } = require('events');
const VulnerabilityScanner = require('./vulnerability-scanner');
const AuthScanner = require('./auth-scanner');
const ServerScanner = require('./server-scanner');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * ComplianceScanner class for conducting compliance-focused security assessments
 */
class ComplianceScanner extends EventEmitter {
  /**
   * Create a new compliance scanner instance
   * @param {Object} options - Scanner options
   * @param {number} options.timeout - Timeout in milliseconds
   */
  constructor(options = {}) {
    super();
    this.timeout = options.timeout || 10000;
    this.scanInProgress = false;
    this.aborted = false;
    
    // Initialize sub-scanners
    this.vulnScanner = new VulnerabilityScanner({ timeout: this.timeout });
    this.serverScanner = new ServerScanner({ timeout: this.timeout });
    this.authScanner = new AuthScanner({ timeout: this.timeout });
    
    // Define supported compliance frameworks
    this.frameworks = {
      'pci-dss': {
        name: 'PCI DSS 4.0',
        description: 'Payment Card Industry Data Security Standard',
        controls: this._getComplianceControls('pci-dss')
      },
      'hipaa': {
        name: 'HIPAA',
        description: 'Health Insurance Portability and Accountability Act',
        controls: this._getComplianceControls('hipaa')
      },
      'nist-800-53': {
        name: 'NIST 800-53',
        description: 'NIST Special Publication 800-53 Security Controls',
        controls: this._getComplianceControls('nist-800-53')
      },
      'gdpr': {
        name: 'GDPR',
        description: 'General Data Protection Regulation',
        controls: this._getComplianceControls('gdpr')
      },
      'iso27001': {
        name: 'ISO 27001',
        description: 'ISO/IEC 27001 Information Security Management',
        controls: this._getComplianceControls('iso27001')
      }
    };
  }

  /**
   * Get compliance controls for a specific framework
   * @param {string} frameworkId - ID of the compliance framework
   * @returns {Array<Object>} - Array of compliance controls
   */
  _getComplianceControls(frameworkId) {
    // Return specific controls based on framework
    switch (frameworkId) {
      case 'pci-dss':
        return [
          {
            id: 'pci-dss-1.2',
            requirement: 'Install and maintain a firewall configuration to protect cardholder data',
            category: 'Network Security',
            checks: ['open-ports', 'firewall']
          },
          {
            id: 'pci-dss-2.1',
            requirement: 'Change vendor defaults and other security parameters',
            category: 'Secure Configuration',
            checks: ['default-credentials', 'ssh-security']
          },
          {
            id: 'pci-dss-3.1',
            requirement: 'Protect stored cardholder data',
            category: 'Data Protection',
            checks: ['encryption', 'data-storage']
          },
          {
            id: 'pci-dss-4.1',
            requirement: 'Encrypt transmission of cardholder data',
            category: 'Encryption',
            checks: ['ssl-tls', 'transmission-encryption']
          },
          {
            id: 'pci-dss-5.1',
            requirement: 'Use and regularly update anti-virus software or programs',
            category: 'Malware Protection',
            checks: ['anti-virus']
          },
          {
            id: 'pci-dss-6.2',
            requirement: 'Develop secure systems and applications',
            category: 'Application Security',
            checks: ['web-security', 'http-headers']
          },
          {
            id: 'pci-dss-6.5',
            requirement: 'Address common coding vulnerabilities',
            category: 'Application Security',
            checks: ['web-security', 'software-vulnerabilities']
          },
          {
            id: 'pci-dss-7.1',
            requirement: 'Restrict access to cardholder data by business need to know',
            category: 'Access Control',
            checks: ['access-control', 'privileges']
          },
          {
            id: 'pci-dss-8.2',
            requirement: 'Employ strong access control measures',
            category: 'Authentication',
            checks: ['authentication', 'password-policy']
          },
          {
            id: 'pci-dss-10.2',
            requirement: 'Track and monitor all access to network resources and cardholder data',
            category: 'Logging',
            checks: ['logging', 'monitoring']
          },
          {
            id: 'pci-dss-11.2',
            requirement: 'Regularly test security systems and processes',
            category: 'Security Testing',
            checks: ['vulnerability-scanning']
          }
        ];
      case 'hipaa':
        return [
          {
            id: 'hipaa-164.308',
            requirement: 'Administrative Safeguards',
            category: 'Security Management',
            checks: ['policy', 'risk-analysis']
          },
          {
            id: 'hipaa-164.310',
            requirement: 'Physical Safeguards',
            category: 'Physical Access',
            checks: ['physical-security']
          },
          {
            id: 'hipaa-164.312-a',
            requirement: 'Access Control',
            category: 'Access Control',
            checks: ['authentication', 'access-control']
          },
          {
            id: 'hipaa-164.312-b',
            requirement: 'Audit Controls',
            category: 'Logging',
            checks: ['logging', 'monitoring']
          },
          {
            id: 'hipaa-164.312-c',
            requirement: 'Integrity Controls',
            category: 'Data Protection',
            checks: ['data-integrity']
          },
          {
            id: 'hipaa-164.312-d',
            requirement: 'Person or entity authentication',
            category: 'Authentication',
            checks: ['authentication']
          },
          {
            id: 'hipaa-164.312-e',
            requirement: 'Transmission Security',
            category: 'Encryption',
            checks: ['ssl-tls', 'transmission-encryption']
          }
        ];
      case 'nist-800-53':
        return [
          {
            id: 'nist-ac-2',
            requirement: 'Account Management',
            category: 'Access Control',
            checks: ['account-management', 'privileges']
          },
          {
            id: 'nist-ac-3',
            requirement: 'Access Enforcement',
            category: 'Access Control',
            checks: ['access-control']
          },
          {
            id: 'nist-ac-17',
            requirement: 'Remote Access',
            category: 'Access Control',
            checks: ['remote-access', 'ssh-security']
          },
          {
            id: 'nist-au-2',
            requirement: 'Audit Events',
            category: 'Logging',
            checks: ['logging']
          },
          {
            id: 'nist-cm-6',
            requirement: 'Configuration Settings',
            category: 'Secure Configuration',
            checks: ['configuration', 'hardening']
          },
          {
            id: 'nist-ia-2',
            requirement: 'Identification and Authentication',
            category: 'Authentication',
            checks: ['authentication', 'multi-factor']
          },
          {
            id: 'nist-sc-8',
            requirement: 'Transmission Confidentiality and Integrity',
            category: 'Encryption',
            checks: ['ssl-tls', 'transmission-encryption']
          },
          {
            id: 'nist-sc-13',
            requirement: 'Cryptographic Protection',
            category: 'Encryption',
            checks: ['encryption']
          },
          {
            id: 'nist-si-2',
            requirement: 'Flaw Remediation',
            category: 'Vulnerability Management',
            checks: ['patch-management', 'vulnerability-scanning']
          }
        ];
      case 'gdpr':
        return [
          {
            id: 'gdpr-5',
            requirement: 'Principles relating to processing of personal data',
            category: 'Data Protection',
            checks: ['data-protection', 'data-storage']
          },
          {
            id: 'gdpr-25',
            requirement: 'Data protection by design and by default',
            category: 'Security Design',
            checks: ['data-protection', 'access-control']
          },
          {
            id: 'gdpr-32-1a',
            requirement: 'Pseudonymisation and encryption of personal data',
            category: 'Encryption',
            checks: ['encryption', 'data-protection']
          },
          {
            id: 'gdpr-32-1b',
            requirement: 'Ensure confidentiality, integrity, availability and resilience',
            category: 'Security Operations',
            checks: ['availability', 'ssl-tls', 'data-integrity']
          },
          {
            id: 'gdpr-32-1c',
            requirement: 'Restore availability and access to personal data',
            category: 'Disaster Recovery',
            checks: ['backup', 'disaster-recovery']
          },
          {
            id: 'gdpr-32-1d',
            requirement: 'Regular testing of security measures',
            category: 'Security Testing',
            checks: ['vulnerability-scanning', 'penetration-testing']
          }
        ];
      case 'iso27001':
        return [
          {
            id: 'iso-a5',
            requirement: 'Information security policies',
            category: 'Governance',
            checks: ['policy']
          },
          {
            id: 'iso-a9',
            requirement: 'Access control',
            category: 'Access Control',
            checks: ['access-control', 'authentication']
          },
          {
            id: 'iso-a10',
            requirement: 'Cryptography',
            category: 'Encryption',
            checks: ['encryption', 'ssl-tls']
          },
          {
            id: 'iso-a12.2',
            requirement: 'Protection from malware',
            category: 'Malware Protection',
            checks: ['anti-virus', 'malware-protection']
          },
          {
            id: 'iso-a12.4',
            requirement: 'Logging and monitoring',
            category: 'Logging',
            checks: ['logging', 'monitoring']
          },
          {
            id: 'iso-a12.6',
            requirement: 'Technical vulnerability management',
            category: 'Vulnerability Management',
            checks: ['vulnerability-scanning', 'patch-management']
          },
          {
            id: 'iso-a13.1',
            requirement: 'Network security management',
            category: 'Network Security',
            checks: ['network-security', 'firewall']
          },
          {
            id: 'iso-a18.2',
            requirement: 'Information security reviews',
            category: 'Security Testing',
            checks: ['vulnerability-scanning', 'security-review']
          }
        ];
      default:
        return [];
    }
  }

  /**
   * Get a list of available compliance frameworks
   * @returns {Array<Object>} - List of compliance frameworks
   */
  getAvailableFrameworks() {
    return Object.entries(this.frameworks).map(([id, framework]) => ({
      id,
      name: framework.name,
      description: framework.description
    }));
  }

  /**
   * Scan a target for compliance with selected frameworks
   * @param {string} target - Target to scan
   * @param {Object} options - Scan options
   * @param {Array<string>} options.frameworks - Compliance frameworks to assess
   * @param {Object} options.credentials - Credentials for authenticated scanning
   * @param {Array<number>} options.ports - Ports to scan
   * @returns {Promise<Object>} - Compliance assessment results
   */
  async scan(target, options = {}) {
    if (this.scanInProgress) {
      throw new Error('A scan is already in progress');
    }

    this.scanInProgress = true;
    this.aborted = false;
    
    // Determine which frameworks to assess
    const frameworksToAssess = options.frameworks && options.frameworks.length > 0 ? 
      options.frameworks.filter(f => this.frameworks[f]) : 
      Object.keys(this.frameworks);
    
    if (frameworksToAssess.length === 0) {
      logger.warn('No valid compliance frameworks specified');
      this.scanInProgress = false;
      return { target, frameworks: [], assessments: [] };
    }
    
    logger.scan.start('compliance', target);
    
    try {
      const results = {
        target,
        timestamp: new Date().toISOString(),
        frameworks: frameworksToAssess.map(f => ({
          id: f,
          name: this.frameworks[f].name,
          description: this.frameworks[f].description
        })),
        assessments: [],
        summary: {}
      };
      
      // Collect all unique checks needed across all frameworks
      const allChecks = new Set();
      
      for (const frameworkId of frameworksToAssess) {
        for (const control of this.frameworks[frameworkId].controls) {
          for (const check of control.checks) {
            allChecks.add(check);
          }
        }
      }
      
      // Run vulnerability scan first to collect basic security findings
      logger.info(`Running vulnerability scan on ${target} for compliance assessment`);
      this.emit('progress', {
        phase: 'vulnerability-scan',
        message: 'Running vulnerability scan'
      });
      
      const vulnResults = await this.vulnScanner.scan(target, {
        ports: options.ports || [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443],
        checks: 'all'
      });
      
      // Run server scan to collect system information
      logger.info(`Running server scan on ${target} for compliance assessment`);
      this.emit('progress', {
        phase: 'server-scan',
        message: 'Running server scan'
      });
      
      const serverResults = await this.serverScanner.scan(target, {
        ports: options.ports || [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 8080, 8443],
        serviceDetection: true,
        osDetection: true
      });
      
      // Run authenticated scan if credentials provided
      let authResults = null;
      if (options.credentials) {
        logger.info(`Running authenticated scan on ${target} for compliance assessment`);
        this.emit('progress', {
          phase: 'authenticated-scan',
          message: 'Running authenticated scan'
        });
        
        // Add the credential
        this.authScanner.addCredential(options.credentials);
        
        // Determine scan type based on available services
        let scanType = 'ssh';
        let scanOptions = {};
        
        // Check if SSH port is open (default to port 22)
        const hasSSH = vulnResults.openPorts.some(p => p.port === 22);
        
        // Check if web server is running (ports 80, 443, 8080, 8443)
        const hasWeb = vulnResults.openPorts.some(p => [80, 443, 8080, 8443].includes(p.port));
        
        // Check if database is running (common database ports)
        const hasDatabase = vulnResults.openPorts.some(p => [3306, 5432, 1433, 1521, 27017].includes(p.port));
        
        if (options.credentials.type === 'web' && hasWeb) {
          scanType = 'web';
          // Use the first available web port
          const webPort = vulnResults.openPorts.find(p => [80, 443, 8080, 8443].includes(p.port));
          scanOptions.port = webPort ? webPort.port : 80;
        } else if (options.credentials.type === 'database' && hasDatabase) {
          scanType = 'database';
          // Use the first available database port
          const dbPort = vulnResults.openPorts.find(p => [3306, 5432, 1433, 1521, 27017].includes(p.port));
          scanOptions.port = dbPort ? dbPort.port : 3306;
          scanOptions.dbType = options.credentials.dbType || 'mysql';
        } else if (hasSSH) {
          scanType = 'ssh';
          scanOptions.port = 22;
        }
        
        // Run the authenticated scan if we have a suitable service
        if (scanType) {
          try {
            authResults = await this.authScanner.scan(target, {
              scanType,
              scanOptions
            });
          } catch (error) {
            logger.warn(`Authenticated scan failed: ${error.message}`);
          }
        }
      }
      
      // Process findings for each framework
      for (const frameworkId of frameworksToAssess) {
        logger.info(`Assessing compliance with ${this.frameworks[frameworkId].name}`);
        this.emit('progress', {
          phase: 'compliance-assessment',
          message: `Assessing ${this.frameworks[frameworkId].name}`
        });
        
        const frameworkAssessment = {
          frameworkId,
          name: this.frameworks[frameworkId].name,
          controls: []
        };
        
        // Assess each control in the framework
        for (const control of this.frameworks[frameworkId].controls) {
          const controlAssessment = {
            id: control.id,
            requirement: control.requirement,
            category: control.category,
            findings: [],
            status: 'not-applicable', // Default status
            score: 0,
            maxScore: 100,
            evidence: []
          };
          
          // Map vulnerability findings to this control
          const relatedVulnerabilities = vulnResults.vulnerabilities.filter(v => {
            // Match vulnerability types to control checks
            // This is a simplified matching - in a real scanner, this would be more sophisticated
            return control.checks.some(check => {
              if (check === 'ssl-tls' && v.id && v.id.includes('ssl-')) return true;
              if (check === 'http-headers' && v.id && v.id.includes('header')) return true;
              if (check === 'open-ports' && v.id && v.id.includes('port')) return true;
              if (check === 'default-credentials' && v.id && v.id.includes('credential')) return true;
              if (check === 'ssh-security' && v.id && v.id.includes('ssh-')) return true;
              if (check === 'web-security' && v.id && (v.id.includes('xss') || v.id.includes('csrf') || v.id.includes('injection'))) return true;
              return false;
            });
          });
          
          if (relatedVulnerabilities.length > 0) {
            controlAssessment.findings.push(...relatedVulnerabilities);
            controlAssessment.evidence.push({
              type: 'vulnerability',
              details: `Found ${relatedVulnerabilities.length} vulnerabilities related to this control`
            });
          }
          
          // Add system information as evidence where relevant
          if (control.checks.includes('patch-management') && serverResults.os) {
            controlAssessment.evidence.push({
              type: 'system-info',
              details: `Operating System: ${serverResults.os.name || 'Unknown'}`
            });
          }
          
          // Add authentication results as evidence where relevant
          if (authResults && authResults.authenticated) {
            if (control.checks.includes('authentication')) {
              controlAssessment.evidence.push({
                type: 'authentication',
                details: `Successfully authenticated as ${authResults.authenticatedWith.username}`
              });
            }
            
            if (control.checks.includes('password-policy') && authResults.systemInfo && authResults.systemInfo.passwordPolicy) {
              controlAssessment.evidence.push({
                type: 'password-policy',
                details: 'Password policy information collected'
              });
            }
          }
          
          // Determine control status and score based on findings and evidence
          if (controlAssessment.findings.length > 0) {
            // Calculate score based on severity of findings
            const highSeverity = controlAssessment.findings.filter(f => f.severity === 'high').length;
            const mediumSeverity = controlAssessment.findings.filter(f => f.severity === 'medium').length;
            const lowSeverity = controlAssessment.findings.filter(f => f.severity === 'low').length;
            
            if (highSeverity > 0) {
              controlAssessment.status = 'failed';
              controlAssessment.score = Math.max(0, 40 - (highSeverity * 20));
            } else if (mediumSeverity > 0) {
              controlAssessment.status = 'partial';
              controlAssessment.score = Math.max(50, 80 - (mediumSeverity * 10));
            } else if (lowSeverity > 0) {
              controlAssessment.status = 'partial';
              controlAssessment.score = Math.max(70, 90 - (lowSeverity * 5));
            } else {
              controlAssessment.status = 'passed';
              controlAssessment.score = 100;
            }
          } else if (controlAssessment.evidence.length > 0) {
            // Some evidence but no findings - likely compliant
            controlAssessment.status = 'passed';
            controlAssessment.score = 100;
          } else {
            // No evidence gathered, can't assess
            controlAssessment.status = 'not-applicable';
            controlAssessment.score = 0;
            controlAssessment.maxScore = 0; // Don't count in overall score
          }
          
          // Add remediation advice
          if (controlAssessment.status === 'failed' || controlAssessment.status === 'partial') {
            controlAssessment.remediation = this._getRemediationAdvice(control, controlAssessment.findings);
          }
          
          frameworkAssessment.controls.push(controlAssessment);
        }
        
        // Calculate overall framework compliance score
        const assessedControls = frameworkAssessment.controls.filter(c => c.maxScore > 0);
        if (assessedControls.length > 0) {
          frameworkAssessment.score = Math.round(
            assessedControls.reduce((sum, control) => sum + control.score, 0) / 
            assessedControls.length
          );
          
          frameworkAssessment.status = frameworkAssessment.score >= 85 ? 'compliant' : 
                                      frameworkAssessment.score >= 60 ? 'partially-compliant' : 
                                      'non-compliant';
        } else {
          frameworkAssessment.score = 0;
          frameworkAssessment.status = 'not-assessed';
        }
        
        // Add to results
        results.assessments.push(frameworkAssessment);
      }
      
      // Create summary
      const overallScore = results.assessments.length > 0 ?
        Math.round(results.assessments.reduce((sum, assessment) => sum + assessment.score, 0) / results.assessments.length) : 0;
      
      results.summary = {
        score: overallScore,
        status: overallScore >= 85 ? 'compliant' : 
                overallScore >= 60 ? 'partially-compliant' : 
                'non-compliant',
        frameworksAssessed: results.assessments.length,
        controlsAssessed: results.assessments.reduce((sum, framework) => sum + framework.controls.length, 0),
        criticalFindings: vulnResults.stats.critical || 0,
        highFindings: vulnResults.stats.high || 0,
        mediumFindings: vulnResults.stats.medium || 0,
        lowFindings: vulnResults.stats.low || 0
      };
      
      logger.scan.complete('compliance', target, results);
      this.scanInProgress = false;
      return results;
    } catch (error) {
      this.scanInProgress = false;
      logger.error(`Compliance scan error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get remediation advice for a control based on findings
   * @param {Object} control - Control being assessed
   * @param {Array<Object>} findings - Findings related to this control
   * @returns {Object} - Remediation advice
   */
  _getRemediationAdvice(control, findings) {
    // Generate remediation advice based on control and findings
    // Framework-specific recommendations
    const generalAdvice = {
      'ssl-tls': 'Ensure all services use TLS 1.2 or higher. Disable older SSL/TLS versions. Use strong cipher suites and proper certificate validation.',
      'http-headers': 'Implement secure HTTP headers including Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, and Strict-Transport-Security.',
      'open-ports': 'Close unnecessary ports. Implement a firewall to restrict access to required services only.',
      'default-credentials': 'Change all default credentials. Implement a strong password policy and regular credential rotation.',
      'ssh-security': 'Configure SSH securely: disable root login, use key-based authentication, limit user access, and use SSH protocol version 2.',
      'encryption': 'Implement strong encryption for all sensitive data at rest and in transit. Use industry-standard encryption algorithms.',
      'access-control': 'Implement the principle of least privilege. Regularly review access rights and remove unnecessary privileges.',
      'authentication': 'Implement multi-factor authentication. Ensure passwords meet complexity requirements and are regularly changed.',
      'password-policy': 'Enforce strong password policies including minimum length, complexity, history, and regular expiration.',
      'logging': 'Enable comprehensive logging for all security-relevant events. Ensure logs are protected from tampering.',
      'monitoring': 'Implement real-time monitoring for security events. Set up alerts for suspicious activities.',
      'patch-management': 'Establish a regular patching process. Prioritize security updates and critical vulnerabilities.',
      'vulnerability-scanning': 'Conduct regular vulnerability scans. Address high-risk vulnerabilities promptly.',
      'web-security': 'Protect against common web vulnerabilities including XSS, CSRF, SQL injection, and insecure deserialization.'
    };
    
    // Get specific advice for this control
    const specificAdvice = [];
    
    // Add advice based on control checks
    control.checks.forEach(check => {
      if (generalAdvice[check]) {
        specificAdvice.push(generalAdvice[check]);
      }
    });
    
    // Add advice based on specific findings
    const findingRemediation = findings.filter(f => f.remediation).map(f => f.remediation);
    
    return {
      general: specificAdvice,
      specific: findingRemediation
    };
  }

  /**
   * Stop an ongoing scan
   */
  abort() {
    if (this.scanInProgress) {
      this.aborted = true;
      this.vulnScanner.abort();
      this.serverScanner.abort();
      this.authScanner.abort();
      logger.info('Compliance scan aborted');
    }
  }
}

module.exports = ComplianceScanner;