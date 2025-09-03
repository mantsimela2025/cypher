const { db } = require('../../db');
const { 
  systems, 
  systemConfigurationDrift,
  assets,
  systemAssets,
  scanResults,
  scanJobs
} = require('../../db/schema');
const { eq, and, sql, desc, gte, lte, count, isNull } = require('drizzle-orm');
const crypto = require('crypto');

/**
 * Configuration Drift Detection Service
 * Automated identification of configuration changes that impact security posture
 */
class ConfigurationDriftService {
  constructor() {
    this.isInitialized = false;
    this.baselineConfigurations = new Map();
    this.driftDetectors = new Map();
    this.monitoringInterval = null;
    this.driftQueue = [];
  }

  /**
   * Initialize configuration drift service (fast startup)
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Register drift detection methods (fast)
      this.registerDriftDetectors();

      // Start continuous drift monitoring (fast)
      this.startContinuousMonitoring();

      this.isInitialized = true;
      console.log('✅ Configuration drift detection service initialized');

      // Load baseline configurations in background (slow operation)
      this.loadBaselineConfigurationsAsync();
    } catch (error) {
      console.error('❌ Failed to initialize configuration drift service:', error);
      throw error;
    }
  }

  /**
   * Register drift detection methods
   */
  registerDriftDetectors() {
    // Security configuration drift detectors
    this.driftDetectors.set('security_policy', this.detectSecurityPolicyDrift.bind(this));
    this.driftDetectors.set('firewall_rules', this.detectFirewallRulesDrift.bind(this));
    this.driftDetectors.set('user_accounts', this.detectUserAccountDrift.bind(this));
    this.driftDetectors.set('service_configuration', this.detectServiceConfigurationDrift.bind(this));
    this.driftDetectors.set('registry_settings', this.detectRegistrySettingsDrift.bind(this));
    
    // System configuration drift detectors
    this.driftDetectors.set('installed_software', this.detectInstalledSoftwareDrift.bind(this));
    this.driftDetectors.set('system_settings', this.detectSystemSettingsDrift.bind(this));
    this.driftDetectors.set('network_configuration', this.detectNetworkConfigurationDrift.bind(this));
    this.driftDetectors.set('patch_level', this.detectPatchLevelDrift.bind(this));
    
    // Compliance configuration drift detectors
    this.driftDetectors.set('stig_compliance', this.detectStigComplianceDrift.bind(this));
    this.driftDetectors.set('cis_benchmark', this.detectCisBenchmarkDrift.bind(this));

    console.log(`🔍 Registered ${this.driftDetectors.size} drift detection methods`);
  }

  /**
   * Load baseline configurations asynchronously (non-blocking)
   */
  async loadBaselineConfigurationsAsync() {
    try {
      console.log('🔄 Loading baseline configurations in background...');

      // Get all systems
      const allSystems = await db.select({ id: systems.id, name: systems.name })
        .from(systems);

      console.log(`📋 Loading baseline configurations for ${allSystems.length} systems`);

      // Load baselines in parallel for better performance
      const baselinePromises = allSystems.map(async (system) => {
        try {
          await this.loadSystemBaseline(system.id);
        } catch (error) {
          console.error(`Error loading baseline for system ${system.id}:`, error);
        }
      });

      await Promise.allSettled(baselinePromises);
      console.log('✅ Baseline configurations loaded');
    } catch (error) {
      console.error('Error loading baseline configurations:', error);
    }
  }

  /**
   * Load baseline configurations for all systems (legacy - kept for compatibility)
   */
  async loadBaselineConfigurations() {
    return this.loadBaselineConfigurationsAsync();
  }

  /**
   * Load baseline configuration for a specific system
   */
  async loadSystemBaseline(systemId) {
    try {
      // Check if system exists first
      const systemExists = await db.select({ id: systems.id })
        .from(systems)
        .where(eq(systems.id, systemId))
        .limit(1);

      if (systemExists.length === 0) {
        console.log(`System ${systemId} not found`);
        return;
      }

      // Get the most recent successful scan results for the system
      // Use a safer query structure to avoid the drizzle-orm error
      let systemAssetIds = [];
      try {
        // Ensure systemId is properly formatted
        const systemIdStr = systemId.toString();

        // Check if systemAssets table exists and has data
        const assetQuery = db.select({
          assetUuid: systemAssets.assetUuid
        })
        .from(systemAssets)
        .where(eq(systemAssets.systemId, systemIdStr))
        .limit(10); // Limit to avoid large queries

        systemAssetIds = await assetQuery;
        console.log(`Found ${systemAssetIds.length} assets for system ${systemId}`);
      } catch (queryError) {
        console.log(`Assets query failed for system ${systemId}:`, queryError.message);
        systemAssetIds = [];
      }

      if (systemAssetIds.length === 0) {
        console.log(`No assets found for system ${systemId}, creating mock baseline`);
      }

      // Mock baseline configuration - in production would get from actual scans
      const baselineConfig = {
        systemId,
        timestamp: new Date(),
        configurations: {
          securityPolicy: {
            passwordPolicy: { minLength: 12, complexity: true, expiration: 90 },
            accountLockout: { threshold: 5, duration: 30 },
            auditPolicy: { loginEvents: true, privilegeUse: true }
          },
          firewallRules: [
            { port: 22, protocol: 'tcp', direction: 'inbound', action: 'allow', source: '10.0.0.0/8' },
            { port: 80, protocol: 'tcp', direction: 'inbound', action: 'allow', source: 'any' },
            { port: 443, protocol: 'tcp', direction: 'inbound', action: 'allow', source: 'any' }
          ],
          userAccounts: [
            { username: 'admin', enabled: true, lastLogin: new Date(), privileged: true },
            { username: 'service', enabled: true, lastLogin: null, privileged: false }
          ],
          installedSoftware: [
            { name: 'Apache HTTP Server', version: '2.4.41', vendor: 'Apache Software Foundation' },
            { name: 'OpenSSL', version: '1.1.1f', vendor: 'OpenSSL Project' }
          ],
          systemSettings: {
            timezone: 'UTC',
            ntpServers: ['pool.ntp.org'],
            logLevel: 'INFO',
            maxLogSize: '100MB'
          },
          networkConfiguration: {
            interfaces: [
              { name: 'eth0', ip: '192.168.1.100', netmask: '255.255.255.0', gateway: '192.168.1.1' }
            ],
            dnsServers: ['8.8.8.8', '8.8.4.4'],
            hostname: 'server-01.domain.com'
          }
        },
        checksum: this.calculateConfigurationChecksum({})
      };

      this.baselineConfigurations.set(systemId, baselineConfig);
      console.log(`📊 Loaded baseline configuration for system ${systemId}`);

    } catch (error) {
      console.error(`Error loading system baseline for ${systemId}:`, error);
    }
  }

  /**
   * Start continuous drift monitoring
   */
  startContinuousMonitoring() {
    // Check for configuration drift every 15 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.performScheduledDriftDetection();
    }, 15 * 60 * 1000);

    console.log('🔄 Started continuous configuration drift monitoring');
  }

  /**
   * Detect configuration drift for a specific system
   */
  async detectSystemConfigurationDrift(systemId, options = {}) {
    try {
      console.log(`🔍 Detecting configuration drift for system ${systemId}`);

      const { detectionMethods = ['all'], forceRefresh = false } = options;

      // Get baseline configuration
      const baseline = this.baselineConfigurations.get(systemId);
      if (!baseline) {
        console.log(`No baseline found for system ${systemId}, loading...`);
        await this.loadSystemBaseline(systemId);
      }

      // Get current configuration
      const currentConfig = await this.getCurrentSystemConfiguration(systemId);

      // Detect drift using specified methods
      const driftResults = [];
      const methodsToUse = detectionMethods.includes('all') 
        ? Array.from(this.driftDetectors.keys())
        : detectionMethods;

      for (const method of methodsToUse) {
        try {
          const detector = this.driftDetectors.get(method);
          if (detector) {
            const driftResult = await detector(systemId, baseline, currentConfig);
            if (driftResult && driftResult.length > 0) {
              driftResults.push(...driftResult);
            }
          }
        } catch (error) {
          console.error(`Error in drift detection method ${method}:`, error);
        }
      }

      // Store drift results
      if (driftResults.length > 0) {
        await this.storeDriftResults(systemId, driftResults);
      }

      console.log(`✅ Configuration drift detection completed for system ${systemId}: ${driftResults.length} drifts found`);

      return {
        systemId,
        driftCount: driftResults.length,
        drifts: driftResults,
        detectionMethods: methodsToUse,
        detectedAt: new Date()
      };

    } catch (error) {
      console.error(`Error detecting configuration drift for system ${systemId}:`, error);
      throw error;
    }
  }

  /**
   * Get current system configuration
   */
  async getCurrentSystemConfiguration(systemId) {
    try {
      // Mock current configuration - in production would get from actual system scans
      const currentConfig = {
        systemId,
        timestamp: new Date(),
        configurations: {
          securityPolicy: {
            passwordPolicy: { minLength: 8, complexity: false, expiration: 180 }, // DRIFT: Weaker policy
            accountLockout: { threshold: 5, duration: 30 },
            auditPolicy: { loginEvents: true, privilegeUse: false } // DRIFT: Disabled privilege use auditing
          },
          firewallRules: [
            { port: 22, protocol: 'tcp', direction: 'inbound', action: 'allow', source: 'any' }, // DRIFT: SSH open to any
            { port: 80, protocol: 'tcp', direction: 'inbound', action: 'allow', source: 'any' },
            { port: 443, protocol: 'tcp', direction: 'inbound', action: 'allow', source: 'any' },
            { port: 3389, protocol: 'tcp', direction: 'inbound', action: 'allow', source: 'any' } // DRIFT: New RDP rule
          ],
          userAccounts: [
            { username: 'admin', enabled: true, lastLogin: new Date(), privileged: true },
            { username: 'service', enabled: true, lastLogin: null, privileged: false },
            { username: 'temp_user', enabled: true, lastLogin: new Date(), privileged: true } // DRIFT: New privileged user
          ],
          installedSoftware: [
            { name: 'Apache HTTP Server', version: '2.4.41', vendor: 'Apache Software Foundation' },
            { name: 'OpenSSL', version: '1.1.1k', vendor: 'OpenSSL Project' }, // DRIFT: Version updated
            { name: 'Unauthorized Software', version: '1.0.0', vendor: 'Unknown' } // DRIFT: Unauthorized software
          ],
          systemSettings: {
            timezone: 'EST', // DRIFT: Timezone changed
            ntpServers: ['pool.ntp.org'],
            logLevel: 'DEBUG', // DRIFT: Log level changed
            maxLogSize: '500MB' // DRIFT: Max log size increased
          },
          networkConfiguration: {
            interfaces: [
              { name: 'eth0', ip: '192.168.1.100', netmask: '255.255.255.0', gateway: '192.168.1.1' }
            ],
            dnsServers: ['1.1.1.1', '1.0.0.1'], // DRIFT: DNS servers changed
            hostname: 'server-01.domain.com'
          }
        }
      };

      return currentConfig;

    } catch (error) {
      console.error(`Error getting current configuration for system ${systemId}:`, error);
      throw error;
    }
  }

  /**
   * Detect security policy drift
   */
  async detectSecurityPolicyDrift(systemId, baseline, current) {
    const drifts = [];

    try {
      const baselinePolicy = baseline.configurations.securityPolicy;
      const currentPolicy = current.configurations.securityPolicy;

      // Check password policy drift
      if (currentPolicy.passwordPolicy.minLength < baselinePolicy.passwordPolicy.minLength) {
        drifts.push({
          driftType: 'security_policy',
          severity: 'high',
          title: 'Password Minimum Length Reduced',
          description: `Password minimum length changed from ${baselinePolicy.passwordPolicy.minLength} to ${currentPolicy.passwordPolicy.minLength}`,
          currentValue: currentPolicy.passwordPolicy.minLength.toString(),
          expectedValue: baselinePolicy.passwordPolicy.minLength.toString(),
          previousValue: baselinePolicy.passwordPolicy.minLength.toString(),
          detectionMethod: 'security_policy',
          impactAssessment: 'Reduced password security increases risk of brute force attacks',
          businessImpact: 'high',
          remediationSteps: [
            'Review password policy configuration',
            'Restore minimum length to baseline value',
            'Notify users of password requirements'
          ]
        });
      }

      // Check complexity requirement drift
      if (currentPolicy.passwordPolicy.complexity !== baselinePolicy.passwordPolicy.complexity) {
        drifts.push({
          driftType: 'security_policy',
          severity: currentPolicy.passwordPolicy.complexity ? 'medium' : 'high',
          title: 'Password Complexity Requirement Changed',
          description: `Password complexity requirement changed from ${baselinePolicy.passwordPolicy.complexity} to ${currentPolicy.passwordPolicy.complexity}`,
          currentValue: currentPolicy.passwordPolicy.complexity.toString(),
          expectedValue: baselinePolicy.passwordPolicy.complexity.toString(),
          previousValue: baselinePolicy.passwordPolicy.complexity.toString(),
          detectionMethod: 'security_policy',
          impactAssessment: 'Changes to password complexity affect overall authentication security',
          businessImpact: 'medium',
          remediationSteps: [
            'Review password complexity policy',
            'Restore complexity requirements to baseline',
            'Update user training materials'
          ]
        });
      }

      // Check audit policy drift
      if (currentPolicy.auditPolicy.privilegeUse !== baselinePolicy.auditPolicy.privilegeUse) {
        drifts.push({
          driftType: 'security_policy',
          severity: 'medium',
          title: 'Privilege Use Auditing Changed',
          description: `Privilege use auditing changed from ${baselinePolicy.auditPolicy.privilegeUse} to ${currentPolicy.auditPolicy.privilegeUse}`,
          currentValue: currentPolicy.auditPolicy.privilegeUse.toString(),
          expectedValue: baselinePolicy.auditPolicy.privilegeUse.toString(),
          previousValue: baselinePolicy.auditPolicy.privilegeUse.toString(),
          detectionMethod: 'security_policy',
          impactAssessment: 'Disabled privilege auditing reduces security monitoring capabilities',
          businessImpact: 'medium',
          remediationSteps: [
            'Enable privilege use auditing',
            'Review audit log configuration',
            'Verify log collection is working'
          ]
        });
      }

    } catch (error) {
      console.error('Error detecting security policy drift:', error);
    }

    return drifts;
  }

  /**
   * Detect firewall rules drift
   */
  async detectFirewallRulesDrift(systemId, baseline, current) {
    const drifts = [];

    try {
      const baselineRules = baseline.configurations.firewallRules;
      const currentRules = current.configurations.firewallRules;

      // Check for new rules
      for (const currentRule of currentRules) {
        const matchingBaseline = baselineRules.find(br => 
          br.port === currentRule.port && 
          br.protocol === currentRule.protocol && 
          br.direction === currentRule.direction
        );

        if (!matchingBaseline) {
          drifts.push({
            driftType: 'firewall_rules',
            severity: currentRule.source === 'any' ? 'high' : 'medium',
            title: 'New Firewall Rule Added',
            description: `New firewall rule added: ${currentRule.protocol}/${currentRule.port} from ${currentRule.source}`,
            currentValue: JSON.stringify(currentRule),
            expectedValue: 'Rule should not exist',
            previousValue: 'Rule did not exist',
            detectionMethod: 'firewall_rules',
            impactAssessment: currentRule.source === 'any' ? 'New rule opens system to external access' : 'New rule changes network access patterns',
            businessImpact: currentRule.source === 'any' ? 'high' : 'medium',
            remediationSteps: [
              'Review business justification for new rule',
              'Verify rule follows security policy',
              'Consider restricting source if possible'
            ]
          });
        } else if (matchingBaseline.source !== currentRule.source) {
          // Check for modified rules
          drifts.push({
            driftType: 'firewall_rules',
            severity: currentRule.source === 'any' ? 'critical' : 'medium',
            title: 'Firewall Rule Source Modified',
            description: `Firewall rule source changed from ${matchingBaseline.source} to ${currentRule.source} for ${currentRule.protocol}/${currentRule.port}`,
            currentValue: currentRule.source,
            expectedValue: matchingBaseline.source,
            previousValue: matchingBaseline.source,
            detectionMethod: 'firewall_rules',
            impactAssessment: 'Modified firewall rule changes network access control',
            businessImpact: currentRule.source === 'any' ? 'critical' : 'medium',
            remediationSteps: [
              'Review change authorization',
              'Verify business requirement',
              'Restore original source restriction if unauthorized'
            ]
          });
        }
      }

      // Check for removed rules
      for (const baselineRule of baselineRules) {
        const matchingCurrent = currentRules.find(cr => 
          cr.port === baselineRule.port && 
          cr.protocol === baselineRule.protocol && 
          cr.direction === baselineRule.direction
        );

        if (!matchingCurrent) {
          drifts.push({
            driftType: 'firewall_rules',
            severity: 'medium',
            title: 'Firewall Rule Removed',
            description: `Firewall rule removed: ${baselineRule.protocol}/${baselineRule.port} from ${baselineRule.source}`,
            currentValue: 'Rule does not exist',
            expectedValue: JSON.stringify(baselineRule),
            previousValue: JSON.stringify(baselineRule),
            detectionMethod: 'firewall_rules',
            impactAssessment: 'Removed firewall rule may affect service availability',
            businessImpact: 'medium',
            remediationSteps: [
              'Verify rule removal was authorized',
              'Check if service is still accessible',
              'Restore rule if removal was unauthorized'
            ]
          });
        }
      }

    } catch (error) {
      console.error('Error detecting firewall rules drift:', error);
    }

    return drifts;
  }

  /**
   * Detect user account drift
   */
  async detectUserAccountDrift(systemId, baseline, current) {
    const drifts = [];

    try {
      const baselineAccounts = baseline.configurations.userAccounts;
      const currentAccounts = current.configurations.userAccounts;

      // Check for new accounts
      for (const currentAccount of currentAccounts) {
        const matchingBaseline = baselineAccounts.find(ba => ba.username === currentAccount.username);

        if (!matchingBaseline) {
          drifts.push({
            driftType: 'user_accounts',
            severity: currentAccount.privileged ? 'critical' : 'medium',
            title: 'New User Account Created',
            description: `New user account created: ${currentAccount.username} (privileged: ${currentAccount.privileged})`,
            currentValue: JSON.stringify(currentAccount),
            expectedValue: 'Account should not exist',
            previousValue: 'Account did not exist',
            detectionMethod: 'user_accounts',
            impactAssessment: currentAccount.privileged ? 'New privileged account increases security risk' : 'New user account changes access patterns',
            businessImpact: currentAccount.privileged ? 'critical' : 'medium',
            remediationSteps: [
              'Verify account creation was authorized',
              'Review account permissions',
              'Disable account if unauthorized'
            ]
          });
        }
      }

      // Check for removed accounts
      for (const baselineAccount of baselineAccounts) {
        const matchingCurrent = currentAccounts.find(ca => ca.username === baselineAccount.username);

        if (!matchingCurrent) {
          drifts.push({
            driftType: 'user_accounts',
            severity: 'low',
            title: 'User Account Removed',
            description: `User account removed: ${baselineAccount.username}`,
            currentValue: 'Account does not exist',
            expectedValue: JSON.stringify(baselineAccount),
            previousValue: JSON.stringify(baselineAccount),
            detectionMethod: 'user_accounts',
            impactAssessment: 'Account removal may affect service operations',
            businessImpact: 'low',
            remediationSteps: [
              'Verify account removal was authorized',
              'Check if any services depend on this account',
              'Document account removal'
            ]
          });
        }
      }

    } catch (error) {
      console.error('Error detecting user account drift:', error);
    }

    return drifts;
  }

  /**
   * Detect installed software drift
   */
  async detectInstalledSoftwareDrift(systemId, baseline, current) {
    const drifts = [];

    try {
      const baselineSoftware = baseline.configurations.installedSoftware;
      const currentSoftware = current.configurations.installedSoftware;

      // Check for new software
      for (const currentSw of currentSoftware) {
        const matchingBaseline = baselineSoftware.find(bs => bs.name === currentSw.name);

        if (!matchingBaseline) {
          drifts.push({
            driftType: 'installed_software',
            severity: currentSw.vendor === 'Unknown' ? 'high' : 'medium',
            title: 'New Software Installed',
            description: `New software installed: ${currentSw.name} v${currentSw.version} by ${currentSw.vendor}`,
            currentValue: JSON.stringify(currentSw),
            expectedValue: 'Software should not be installed',
            previousValue: 'Software was not installed',
            detectionMethod: 'installed_software',
            impactAssessment: 'Unauthorized software installation may introduce security vulnerabilities',
            businessImpact: currentSw.vendor === 'Unknown' ? 'high' : 'medium',
            remediationSteps: [
              'Verify software installation was authorized',
              'Scan software for vulnerabilities',
              'Remove software if unauthorized'
            ]
          });
        } else if (matchingBaseline.version !== currentSw.version) {
          // Check for version changes
          drifts.push({
            driftType: 'installed_software',
            severity: 'low',
            title: 'Software Version Changed',
            description: `Software version changed: ${currentSw.name} from ${matchingBaseline.version} to ${currentSw.version}`,
            currentValue: currentSw.version,
            expectedValue: matchingBaseline.version,
            previousValue: matchingBaseline.version,
            detectionMethod: 'installed_software',
            impactAssessment: 'Software version change may affect functionality or security',
            businessImpact: 'low',
            remediationSteps: [
              'Verify update was authorized',
              'Test software functionality',
              'Update vulnerability scans'
            ]
          });
        }
      }

    } catch (error) {
      console.error('Error detecting installed software drift:', error);
    }

    return drifts;
  }

  /**
   * Detect system settings drift
   */
  async detectSystemSettingsDrift(systemId, baseline, current) {
    const drifts = [];

    try {
      const baselineSettings = baseline.configurations.systemSettings;
      const currentSettings = current.configurations.systemSettings;

      // Check timezone drift
      if (baselineSettings.timezone !== currentSettings.timezone) {
        drifts.push({
          driftType: 'system_settings',
          severity: 'medium',
          title: 'System Timezone Changed',
          description: `System timezone changed from ${baselineSettings.timezone} to ${currentSettings.timezone}`,
          currentValue: currentSettings.timezone,
          expectedValue: baselineSettings.timezone,
          previousValue: baselineSettings.timezone,
          detectionMethod: 'system_settings',
          impactAssessment: 'Timezone changes may affect log correlation and scheduled tasks',
          businessImpact: 'medium',
          remediationSteps: [
            'Verify timezone change was authorized',
            'Update log analysis tools',
            'Verify scheduled tasks still work correctly'
          ]
        });
      }

      // Check log level drift
      if (baselineSettings.logLevel !== currentSettings.logLevel) {
        drifts.push({
          driftType: 'system_settings',
          severity: currentSettings.logLevel === 'DEBUG' ? 'medium' : 'low',
          title: 'Log Level Changed',
          description: `Log level changed from ${baselineSettings.logLevel} to ${currentSettings.logLevel}`,
          currentValue: currentSettings.logLevel,
          expectedValue: baselineSettings.logLevel,
          previousValue: baselineSettings.logLevel,
          detectionMethod: 'system_settings',
          impactAssessment: 'Log level changes affect monitoring and troubleshooting capabilities',
          businessImpact: 'low',
          remediationSteps: [
            'Review log level change justification',
            'Monitor disk space usage',
            'Adjust log retention policies if needed'
          ]
        });
      }

    } catch (error) {
      console.error('Error detecting system settings drift:', error);
    }

    return drifts;
  }

  /**
   * Detect network configuration drift
   */
  async detectNetworkConfigurationDrift(systemId, baseline, current) {
    const drifts = [];

    try {
      const baselineNetwork = baseline.configurations.networkConfiguration;
      const currentNetwork = current.configurations.networkConfiguration;

      // Check DNS server changes
      const baselineDns = JSON.stringify(baselineNetwork.dnsServers.sort());
      const currentDns = JSON.stringify(currentNetwork.dnsServers.sort());

      if (baselineDns !== currentDns) {
        drifts.push({
          driftType: 'network_configuration',
          severity: 'medium',
          title: 'DNS Servers Changed',
          description: `DNS servers changed from ${baselineNetwork.dnsServers.join(', ')} to ${currentNetwork.dnsServers.join(', ')}`,
          currentValue: currentNetwork.dnsServers.join(', '),
          expectedValue: baselineNetwork.dnsServers.join(', '),
          previousValue: baselineNetwork.dnsServers.join(', '),
          detectionMethod: 'network_configuration',
          impactAssessment: 'DNS server changes may affect name resolution and security',
          businessImpact: 'medium',
          remediationSteps: [
            'Verify DNS server change was authorized',
            'Test name resolution functionality',
            'Update network documentation'
          ]
        });
      }

    } catch (error) {
      console.error('Error detecting network configuration drift:', error);
    }

    return drifts;
  }

  /**
   * Mock drift detection methods (implement based on actual requirements)
   */
  async detectServiceConfigurationDrift(systemId, baseline, current) { return []; }
  async detectRegistrySettingsDrift(systemId, baseline, current) { return []; }
  async detectPatchLevelDrift(systemId, baseline, current) { return []; }
  async detectStigComplianceDrift(systemId, baseline, current) { return []; }
  async detectCisBenchmarkDrift(systemId, baseline, current) { return []; }

  /**
   * Store drift results in database
   */
  async storeDriftResults(systemId, driftResults) {
    try {
      const driftRecords = driftResults.map(drift => ({
        systemId,
        driftType: drift.driftType,
        severity: drift.severity,
        title: drift.title,
        description: drift.description,
        currentValue: drift.currentValue,
        expectedValue: drift.expectedValue,
        previousValue: drift.previousValue,
        detectionMethod: drift.detectionMethod,
        impactAssessment: drift.impactAssessment,
        remediationSteps: JSON.stringify(drift.remediationSteps),
        businessImpact: drift.businessImpact,
        detectedAt: new Date(),
        status: 'open',
        metadata: JSON.stringify({
          detectionTimestamp: new Date(),
          detectionVersion: '1.0'
        })
      }));

      await db.insert(systemConfigurationDrift).values(driftRecords);
      console.log(`💾 Stored ${driftRecords.length} drift results for system ${systemId}`);

    } catch (error) {
      console.error('Error storing drift results:', error);
      throw error;
    }
  }

  /**
   * Calculate configuration checksum
   */
  calculateConfigurationChecksum(configuration) {
    const configString = JSON.stringify(configuration, Object.keys(configuration).sort());
    return crypto.createHash('sha256').update(configString).digest('hex');
  }

  /**
   * Perform scheduled drift detection
   */
  async performScheduledDriftDetection() {
    try {
      // Get systems that need drift detection
      const systemsToCheck = await db.select({ id: systems.id })
        .from(systems)
        .limit(5); // Process 5 systems at a time

      console.log(`🔍 Performing scheduled drift detection for ${systemsToCheck.length} systems`);

      for (const system of systemsToCheck) {
        try {
          await this.detectSystemConfigurationDrift(system.id);
        } catch (error) {
          console.error(`Error detecting drift for system ${system.id}:`, error);
        }
      }

    } catch (error) {
      console.error('Error performing scheduled drift detection:', error);
    }
  }

  /**
   * Get configuration drift statistics
   */
  async getConfigurationDriftStats() {
    try {
      const [stats] = await db.select({
        totalDrifts: sql`COUNT(*)`,
        openDrifts: sql`COUNT(*) FILTER (WHERE status = 'open')`,
        criticalDrifts: sql`COUNT(*) FILTER (WHERE severity = 'critical')`,
        highDrifts: sql`COUNT(*) FILTER (WHERE severity = 'high')`,
        recentDrifts: sql`COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '24 hours')`,
        resolvedDrifts: sql`COUNT(*) FILTER (WHERE status = 'resolved')`
      })
      .from(systemConfigurationDrift);

      return {
        ...stats,
        detectorsLoaded: this.driftDetectors.size,
        baselinesLoaded: this.baselineConfigurations.size,
        queueSize: this.driftQueue.length
      };

    } catch (error) {
      console.error('Error getting configuration drift stats:', error);
      throw error;
    }
  }

  /**
   * Get drift history for a system
   */
  async getSystemDriftHistory(systemId, filters = {}) {
    try {
      let query = db.select()
        .from(systemConfigurationDrift)
        .where(eq(systemConfigurationDrift.systemId, systemId));

      if (filters.severity) {
        query = query.where(eq(systemConfigurationDrift.severity, filters.severity));
      }

      if (filters.status) {
        query = query.where(eq(systemConfigurationDrift.status, filters.status));
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const drifts = await query.orderBy(desc(systemConfigurationDrift.detectedAt));

      // Parse JSON fields
      return drifts.map(drift => ({
        ...drift,
        remediationSteps: JSON.parse(drift.remediationSteps || '[]'),
        metadata: JSON.parse(drift.metadata || '{}')
      }));

    } catch (error) {
      console.error(`Error getting drift history for system ${systemId}:`, error);
      throw error;
    }
  }

  /**
   * Acknowledge drift
   */
  async acknowledgeDrift(driftId, userId, notes = '') {
    try {
      await db.update(systemConfigurationDrift)
        .set({
          status: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: userId,
          metadata: sql`jsonb_set(metadata, '{acknowledgment_notes}', ${JSON.stringify(notes)})`
        })
        .where(eq(systemConfigurationDrift.id, driftId));

      console.log(`✅ Acknowledged drift ${driftId}`);

    } catch (error) {
      console.error(`Error acknowledging drift ${driftId}:`, error);
      throw error;
    }
  }

  /**
   * Resolve drift
   */
  async resolveDrift(driftId, userId, resolution = '') {
    try {
      await db.update(systemConfigurationDrift)
        .set({
          status: 'resolved',
          resolvedAt: new Date(),
          resolvedBy: userId,
          metadata: sql`jsonb_set(metadata, '{resolution_notes}', ${JSON.stringify(resolution)})`
        })
        .where(eq(systemConfigurationDrift.id, driftId));

      console.log(`✅ Resolved drift ${driftId}`);

    } catch (error) {
      console.error(`Error resolving drift ${driftId}:`, error);
      throw error;
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️ Stopped configuration drift monitoring');
    }
  }
}

module.exports = new ConfigurationDriftService();
