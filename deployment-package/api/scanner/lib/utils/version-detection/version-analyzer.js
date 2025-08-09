/**
 * Version Analyzer module
 * Provides utilities for version parsing, comparison, and vulnerability matching
 */

const logger = require('../logger');
const semver = require('semver');

/**
 * Parse and normalize version string to semver format when possible
 * @param {string} versionStr - Version string to parse
 * @returns {string|null} - Normalized version string or null if unparseable
 */
function normalizeVersion(versionStr) {
  if (!versionStr) {
    return null;
  }
  
  try {
    // If it's already a valid semver version
    if (semver.valid(versionStr)) {
      return versionStr;
    }
    
    // If it's a partial version like "2.4" add .0 to make it valid semver
    if (/^\d+\.\d+$/.test(versionStr)) {
      return `${versionStr}.0`;
    }
    
    // If it has x like "2.x", replace with zeros "2.0.0"
    if (versionStr.includes('x')) {
      const parts = versionStr.split('.');
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === 'x' || parts[i] === 'X') {
          parts[i] = '0';
        }
      }
      
      // Ensure we have at least major.minor.patch
      while (parts.length < 3) {
        parts.push('0');
      }
      
      return parts.join('.');
    }
    
    // Try to coerce to semver format
    const coerced = semver.coerce(versionStr);
    if (coerced) {
      return coerced.version;
    }
    
    // If coercion failed, just return the original
    return versionStr;
  } catch (error) {
    logger.debug(`Error normalizing version "${versionStr}": ${error.message}`);
    return versionStr;
  }
}

/**
 * Compare two version strings
 * @param {string} versionA - First version to compare
 * @param {string} versionB - Second version to compare
 * @param {string} operator - Comparison operator: <, <=, >, >=, ==, ===, !=, !==
 * @returns {boolean|null} - Result of comparison or null if versions couldn't be parsed
 */
function compareVersions(versionA, versionB, operator = '==') {
  try {
    // Special case for exact string match
    if (operator === '===' || operator === '!==') {
      const stringMatch = versionA === versionB;
      return operator === '===' ? stringMatch : !stringMatch;
    }
    
    // Try to normalize versions for semver comparison
    const normalizedA = normalizeVersion(versionA);
    const normalizedB = normalizeVersion(versionB);
    
    // If either version couldn't be normalized, fall back to string comparison
    if (!normalizedA || !normalizedB) {
      if (operator === '==') return versionA === versionB;
      if (operator === '!=') return versionA !== versionB;
      
      // Simple string comparison for other operators (not very reliable for versions)
      if (operator === '<') return versionA < versionB;
      if (operator === '<=') return versionA <= versionB;
      if (operator === '>') return versionA > versionB;
      if (operator === '>=') return versionA >= versionB;
      
      // Unsupported operator
      return null;
    }
    
    return semver.compare(normalizedA, normalizedB, operator);
  } catch (error) {
    logger.debug(`Error comparing versions "${versionA}" and "${versionB}": ${error.message}`);
    return null;
  }
}

/**
 * Check if a version satisfies a version range
 * @param {string} version - Version to check
 * @param {string} range - Version range (e.g., ">=1.2.0 <1.3.0")
 * @returns {boolean|null} - Whether version satisfies range or null if can't be determined
 */
function satisfiesRange(version, range) {
  try {
    const normalizedVersion = normalizeVersion(version);
    
    if (!normalizedVersion) {
      return null;
    }
    
    // Handle special case for version patterns like "<1.2.3"
    if (range.startsWith('<') || range.startsWith('>') || range.startsWith('=')) {
      return satisfiesVersionPattern(normalizedVersion, range);
    }
    
    return semver.satisfies(normalizedVersion, range);
  } catch (error) {
    logger.debug(`Error checking if version "${version}" satisfies range "${range}": ${error.message}`);
    return null;
  }
}

/**
 * Check if a software version is outdated
 * @param {string} softwareType - Type of software (e.g., 'webServer', 'database')
 * @param {string} software - Specific software (e.g., 'apache', 'nginx')
 * @param {string} version - Version to check
 * @param {Object} versionDb - Version database
 * @returns {Object|null} - Outdated status with details or null if can't determine
 */
function checkOutdatedVersion(softwareType, software, version, versionDb) {
  try {
    if (!version || !softwareType || !software || !versionDb) {
      return null;
    }
    
    const softwareDb = versionDb[softwareType];
    if (!softwareDb) {
      return null;
    }
    
    const softwareInfo = softwareDb[software.toLowerCase()];
    if (!softwareInfo) {
      return null;
    }
    
    const result = {
      isOutdated: false,
      latestVersion: softwareInfo.latestVersion,
      eol: false
    };
    
    // Normalize the version
    const normalizedVersion = normalizeVersion(version);
    if (!normalizedVersion) {
      return null;
    }
    
    // If normalizedVersion is not semver, just do string comparison
    if (!semver.valid(normalizedVersion)) {
      result.isOutdated = version !== softwareInfo.latestVersion;
      return result;
    }
    
    // Check if the software has branches/versions info
    const branches = softwareInfo.branches;
    
    if (branches) {
      // Find the current branch
      const majorVersion = semver.major(normalizedVersion);
      const minorVersion = semver.minor(normalizedVersion);
      
      // Try to find the matching branch
      let currentBranch = null;
      
      // Look for exact match first (e.g., "2.4" for Apache 2.4.x)
      if (branches[`${majorVersion}.${minorVersion}`]) {
        currentBranch = branches[`${majorVersion}.${minorVersion}`];
      } 
      // Then try major version only (e.g., "8" for MySQL 8.x)
      else if (branches[`${majorVersion}`]) {
        currentBranch = branches[`${majorVersion}`];
      }
      // Then try with branch notation (e.g., "3.x" for jQuery 3.x)
      else if (branches[`${majorVersion}.x`]) {
        currentBranch = branches[`${majorVersion}.x`];
      }
      
      if (currentBranch) {
        // Check if the branch is EOL
        result.eol = currentBranch.eol === true;
        
        if (currentBranch.endOfSupportDate) {
          result.endOfSupportDate = currentBranch.endOfSupportDate;
        }
        
        // Check if there's a newer version in the same branch
        if (currentBranch.latestVersion) {
          result.latestInBranch = currentBranch.latestVersion;
          
          // Compare with the latest in branch
          const normalizedLatestInBranch = normalizeVersion(currentBranch.latestVersion);
          if (normalizedLatestInBranch && semver.valid(normalizedLatestInBranch)) {
            if (semver.lt(normalizedVersion, normalizedLatestInBranch)) {
              result.isOutdated = true;
            }
          }
        }
      }
    }
    
    // If branch check didn't mark it as outdated, compare with the latest overall version
    if (!result.isOutdated && softwareInfo.latestVersion) {
      const normalizedLatest = normalizeVersion(softwareInfo.latestVersion);
      if (normalizedLatest && semver.valid(normalizedLatest)) {
        if (semver.lt(normalizedVersion, normalizedLatest)) {
          result.isOutdated = true;
        }
      }
    }
    
    return result;
  } catch (error) {
    logger.debug(`Error checking outdated status for ${software} ${version}: ${error.message}`);
    return null;
  }
}

/**
 * Check for known vulnerabilities in a software version
 * @param {string} softwareType - Type of software (e.g., 'webServer', 'database')
 * @param {string} software - Specific software (e.g., 'apache', 'nginx')
 * @param {string} version - Version to check
 * @param {Object} versionDb - Version database
 * @returns {Array|null} - Array of vulnerabilities or null if can't determine
 */
function findVulnerabilities(softwareType, software, version, versionDb) {
  try {
    if (!version || !softwareType || !software || !versionDb) {
      return null;
    }
    
    const softwareDb = versionDb[softwareType];
    if (!softwareDb) {
      return null;
    }
    
    const softwareInfo = softwareDb[software.toLowerCase()];
    if (!softwareInfo || !softwareInfo.vulnerabilities) {
      return null;
    }
    
    const normalizedVersion = normalizeVersion(version);
    if (!normalizedVersion) {
      return null;
    }
    
    const vulnerabilities = [];
    
    for (const vuln of softwareInfo.vulnerabilities) {
      if (vuln.affectedVersions) {
        let isAffected = false;
        
        for (const affectedPattern of vuln.affectedVersions) {
          const patternResult = satisfiesVersionPattern(normalizedVersion, affectedPattern);
          
          if (patternResult === true) {
            isAffected = true;
            break;
          }
        }
        
        if (isAffected) {
          vulnerabilities.push({
            cve: vuln.cve,
            description: vuln.description,
            severity: vuln.severity,
            fixedInVersion: vuln.fixedInVersion
          });
        }
      }
    }
    
    return vulnerabilities.length > 0 ? vulnerabilities : null;
  } catch (error) {
    logger.debug(`Error finding vulnerabilities for ${software} ${version}: ${error.message}`);
    return null;
  }
}

/**
 * Check if a version satisfies a pattern like '<=1.2.3' or '1.2.3'
 * @param {string} version - Version to check
 * @param {string} pattern - Version pattern
 * @returns {boolean} - Whether version satisfies the pattern
 */
function satisfiesVersionPattern(version, pattern) {
  try {
    // Exact version match
    if (!pattern.startsWith('<') && !pattern.startsWith('>') && !pattern.startsWith('=')) {
      return semver.eq(version, pattern);
    }
    
    // Extract operator and version
    let operator = '';
    let patternVersion = '';
    
    if (pattern.startsWith('<=')) {
      operator = '<=';
      patternVersion = pattern.substring(2);
    } else if (pattern.startsWith('>=')) {
      operator = '>=';
      patternVersion = pattern.substring(2);
    } else if (pattern.startsWith('<')) {
      operator = '<';
      patternVersion = pattern.substring(1);
    } else if (pattern.startsWith('>')) {
      operator = '>';
      patternVersion = pattern.substring(1);
    } else if (pattern.startsWith('=')) {
      operator = '=';
      patternVersion = pattern.substring(1);
    }
    
    // Normalize the pattern version
    const normalizedPatternVersion = normalizeVersion(patternVersion);
    if (!normalizedPatternVersion) {
      return false;
    }
    
    // Compare based on operator
    switch (operator) {
      case '<=':
        return semver.lte(version, normalizedPatternVersion);
      case '>=':
        return semver.gte(version, normalizedPatternVersion);
      case '<':
        return semver.lt(version, normalizedPatternVersion);
      case '>':
        return semver.gt(version, normalizedPatternVersion);
      case '=':
        return semver.eq(version, normalizedPatternVersion);
      default:
        return false;
    }
  } catch (error) {
    logger.debug(`Error checking version pattern "${pattern}" for version "${version}": ${error.message}`);
    return false;
  }
}

module.exports = {
  normalizeVersion,
  compareVersions,
  satisfiesRange,
  checkOutdatedVersion,
  findVulnerabilities,
  satisfiesVersionPattern
};