/**
 * Patch Manager module
 * Central module for managing patch status and vulnerability detection
 */

const logger = require('../logger');
const versionAnalyzer = require('./version-analyzer');
const osPatchDetector = require('./os-patch-detector');
const frameworkDetector = require('./framework-detector');
const versionDb = require('../../data/version-database');

/**
 * Comprehensive patch assessment for a target
 * @param {string} target - Target to scan
 * @param {Object} options - Assessment options
 * @returns {Promise<Object>} - Assessment results
 */
async function performPatchAssessment(target, options = {}) {
  logger.info(`Performing patch assessment for ${target}`);
  
  const results = {
    target,
    scanTime: new Date().toISOString(),
    operatingSystem: null,
    webServer: null,
    database: null,
    applications: [],
    frameworks: [],
    missingPatches: [],
    vulnerabilities: [],
    summary: {
      totalVulnerabilities: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      mediumVulnerabilities: 0,
      lowVulnerabilities: 0,
      outdatedComponents: 0,
      eolComponents: 0
    }
  };
  
  try {
    // Detect operating system if we have SSH access
    if (options.sshClient) {
      logger.info(`Detecting OS for ${target} using SSH`);
      results.operatingSystem = await osPatchDetector.detectOS(target, options.sshClient);
      
      // Add missing OS patches to the main list
      if (results.operatingSystem && results.operatingSystem.missingPatches) {
        for (const patch of results.operatingSystem.missingPatches) {
          results.missingPatches.push({
            type: 'os',
            component: results.operatingSystem.distribution,
            ...patch
          });
          
          // Add to vulnerability list if it has a CVE
          if (patch.cve) {
            results.vulnerabilities.push({
              id: patch.cve,
              component: `${results.operatingSystem.distribution} ${results.operatingSystem.version}`,
              componentType: 'os',
              severity: patch.severity || 'medium',
              description: patch.description || `Missing patch for ${patch.cve}`,
              remediation: `Install available security updates for ${patch.package || ''}`,
              evidence: {
                type: 'os',
                currentVersion: patch.currentVersion,
                fixedInVersion: patch.fixedInPackageVersion
              }
            });
            
            // Update vulnerability counters
            results.summary.totalVulnerabilities++;
            incrementVulnerabilityCounter(results.summary, patch.severity);
          }
        }
      }
    }
    
    // Detect web server software (e.g., from HTTP headers)
    if (options.serverInfo && options.serverInfo.headers && options.serverInfo.headers['server']) {
      const serverHeader = options.serverInfo.headers['server'];
      
      // Check for common web servers
      if (serverHeader.includes('Apache')) {
        results.webServer = detectWebServer('apache', serverHeader);
      } else if (serverHeader.includes('nginx')) {
        results.webServer = detectWebServer('nginx', serverHeader);
      } else if (serverHeader.includes('Microsoft-IIS')) {
        results.webServer = detectWebServer('iis', serverHeader);
      } else if (serverHeader.includes('LiteSpeed')) {
        results.webServer = detectWebServer('litespeed', serverHeader);
      } else {
        // Unknown server
        results.webServer = {
          software: serverHeader,
          version: null,
          isOutdated: null
        };
      }
      
      // Process web server vulnerabilities
      if (results.webServer && results.webServer.vulnerabilities) {
        for (const vuln of results.webServer.vulnerabilities) {
          results.vulnerabilities.push({
            id: vuln.cve || `web-server-vuln-${results.vulnerabilities.length + 1}`,
            component: `${results.webServer.software} ${results.webServer.version}`,
            componentType: 'web-server',
            severity: vuln.severity || 'medium',
            description: vuln.description || 'Web server vulnerability',
            remediation: `Upgrade to ${results.webServer.latestVersion || 'the latest version'}`,
            evidence: {
              type: 'web-server',
              currentVersion: results.webServer.version,
              header: serverHeader
            }
          });
          
          // Update vulnerability counters
          results.summary.totalVulnerabilities++;
          incrementVulnerabilityCounter(results.summary, vuln.severity);
        }
      }
      
      // Update outdated component counter
      if (results.webServer && results.webServer.isOutdated) {
        results.summary.outdatedComponents++;
        
        if (results.webServer.eol) {
          results.summary.eolComponents++;
        }
      }
    }
    
    // Detect web frameworks and content management systems
    if (options.baseUrl) {
      logger.info(`Detecting web frameworks and CMS for ${options.baseUrl}`);
      const frameworks = await frameworkDetector.detectFrameworks(options.baseUrl, {
        timeout: options.timeout || 10000,
        userAgent: options.userAgent
      });
      
      if (frameworks.length > 0) {
        results.frameworks = frameworks;
        
        // Process framework vulnerabilities
        for (const framework of frameworks) {
          // Add outdated frameworks to the counter
          if (framework.isOutdated) {
            results.summary.outdatedComponents++;
            
            if (framework.eol) {
              results.summary.eolComponents++;
            }
          }
          
          // Process vulnerabilities
          if (framework.vulnerabilities && framework.vulnerabilities.length > 0) {
            for (const vuln of framework.vulnerabilities) {
              results.vulnerabilities.push({
                id: vuln.cve || `framework-vuln-${results.vulnerabilities.length + 1}`,
                component: `${framework.framework} ${framework.version}`,
                componentType: framework.type,
                severity: vuln.severity || 'medium',
                description: vuln.description || 'Framework vulnerability',
                remediation: `Upgrade to ${framework.latestVersion || 'the latest version'}`,
                evidence: {
                  type: 'framework',
                  currentVersion: framework.version,
                  detectionMethod: framework.detectionMethod
                }
              });
              
              // Update vulnerability counters
              results.summary.totalVulnerabilities++;
              incrementVulnerabilityCounter(results.summary, vuln.severity);
            }
          }
        }
      }
    }
    
    // Database software detection (if available via SSH or auth scan)
    if (options.databaseInfo) {
      const dbInfo = options.databaseInfo;
      
      // Process database information
      if (dbInfo.dbType === 'mysql' || dbInfo.dbType === 'mariadb') {
        results.database = detectDatabase('mysql', dbInfo.version || dbInfo.databaseInfo.version);
      } else if (dbInfo.dbType === 'postgresql') {
        results.database = detectDatabase('postgresql', dbInfo.version || dbInfo.databaseInfo.version);
      } else {
        results.database = {
          software: dbInfo.dbType,
          version: dbInfo.version || dbInfo.databaseInfo.version,
          isOutdated: null
        };
      }
      
      // Process database vulnerabilities
      if (results.database && results.database.vulnerabilities) {
        for (const vuln of results.database.vulnerabilities) {
          results.vulnerabilities.push({
            id: vuln.cve || `database-vuln-${results.vulnerabilities.length + 1}`,
            component: `${results.database.software} ${results.database.version}`,
            componentType: 'database',
            severity: vuln.severity || 'medium',
            description: vuln.description || 'Database vulnerability',
            remediation: `Upgrade to ${results.database.latestVersion || 'the latest version'}`,
            evidence: {
              type: 'database',
              currentVersion: results.database.version,
              detectionMethod: 'database-info'
            }
          });
          
          // Update vulnerability counters
          results.summary.totalVulnerabilities++;
          incrementVulnerabilityCounter(results.summary, vuln.severity);
        }
      }
      
      // Update outdated component counter
      if (results.database && results.database.isOutdated) {
        results.summary.outdatedComponents++;
        
        if (results.database.eol) {
          results.summary.eolComponents++;
        }
      }
    }
    
  } catch (error) {
    logger.error(`Error in patch assessment: ${error.message}`);
  }
  
  return results;
}

/**
 * Detect web server details
 * @param {string} server - Web server name (apache, nginx, etc.)
 * @param {string} header - Server header value
 * @returns {Object} - Web server details
 */
function detectWebServer(server, header) {
  const result = {
    software: server,
    version: null,
    isOutdated: null,
    vulnerabilities: []
  };
  
  // Extract version from header
  let version = null;
  
  if (server === 'apache') {
    const match = header.match(/Apache\/([\d.]+)/i);
    if (match) {
      version = match[1];
    }
  } else if (server === 'nginx') {
    const match = header.match(/nginx\/([\d.]+)/i);
    if (match) {
      version = match[1];
    }
  } else if (server === 'iis') {
    const match = header.match(/Microsoft-IIS\/([\d.]+)/i);
    if (match) {
      version = match[1];
    }
  } else if (server === 'litespeed') {
    const match = header.match(/LiteSpeed\/([\d.]+)/i);
    if (match) {
      version = match[1];
    }
  }
  
  if (version) {
    result.version = version;
    
    // Check for outdated status
    if (server === 'apache' || server === 'nginx') {
      const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
        'webServers',
        server,
        version,
        versionDb
      );
      
      if (outdatedInfo) {
        result.isOutdated = outdatedInfo.isOutdated;
        result.latestVersion = outdatedInfo.latestVersion;
        
        if (outdatedInfo.latestInBranch) {
          result.latestInBranch = outdatedInfo.latestInBranch;
        }
        
        if (outdatedInfo.eol) {
          result.eol = outdatedInfo.eol;
        }
      }
      
      // Check for vulnerabilities
      const vulnerabilities = versionAnalyzer.findVulnerabilities(
        'webServers',
        server,
        version,
        versionDb
      );
      
      if (vulnerabilities) {
        result.vulnerabilities = vulnerabilities;
      }
    }
  }
  
  return result;
}

/**
 * Detect database details
 * @param {string} dbType - Database type (mysql, postgresql, etc.)
 * @param {string} version - Database version
 * @returns {Object} - Database details
 */
function detectDatabase(dbType, version) {
  const result = {
    software: dbType,
    version: version,
    isOutdated: null,
    vulnerabilities: []
  };
  
  if (version) {
    // Check for outdated status
    const outdatedInfo = versionAnalyzer.checkOutdatedVersion(
      'databases',
      dbType,
      version,
      versionDb
    );
    
    if (outdatedInfo) {
      result.isOutdated = outdatedInfo.isOutdated;
      result.latestVersion = outdatedInfo.latestVersion;
      
      if (outdatedInfo.latestInBranch) {
        result.latestInBranch = outdatedInfo.latestInBranch;
      }
      
      if (outdatedInfo.eol) {
        result.eol = outdatedInfo.eol;
      }
    }
    
    // Check for vulnerabilities
    const vulnerabilities = versionAnalyzer.findVulnerabilities(
      'databases',
      dbType,
      version,
      versionDb
    );
    
    if (vulnerabilities) {
      result.vulnerabilities = vulnerabilities;
    }
  }
  
  return result;
}

/**
 * Increment vulnerability counter based on severity
 * @param {Object} summary - Summary object to update
 * @param {string} severity - Vulnerability severity
 */
function incrementVulnerabilityCounter(summary, severity) {
  if (!severity) {
    return;
  }
  
  const sev = severity.toLowerCase();
  
  if (sev === 'critical') {
    summary.criticalVulnerabilities++;
  } else if (sev === 'high') {
    summary.highVulnerabilities++;
  } else if (sev === 'medium') {
    summary.mediumVulnerabilities++;
  } else if (sev === 'low') {
    summary.lowVulnerabilities++;
  }
}

module.exports = {
  performPatchAssessment
};