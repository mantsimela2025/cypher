const net = require('net');
const ipaddr = require('ipaddr.js');
const logger = require('./logger');

/**
 * Utility class for input validation
 */
class Validator {
  /**
   * Validates whether the provided string is a valid IP address
   * @param {string} ip - The IP address to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidIp(ip) {
    try {
      ipaddr.parse(ip);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validates whether the provided string is a valid hostname
   * @param {string} hostname - The hostname to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidHostname(hostname) {
    // Regular expression for hostname validation
    const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
    return hostnameRegex.test(hostname);
  }

  /**
   * Validates whether the provided string is a valid CIDR notation
   * @param {string} cidr - The CIDR notation to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidCidr(cidr) {
    try {
      // Check if string contains '/'
      if (!cidr.includes('/')) {
        return false;
      }
      
      const [ip, prefix] = cidr.split('/');
      
      // Validate IP part
      if (!this.isValidIp(ip)) {
        return false;
      }
      
      // Validate prefix part
      const prefixNum = parseInt(prefix, 10);
      if (isNaN(prefixNum) || prefixNum < 0 || prefixNum > 32) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validates and parses port specification
   * @param {string} portsString - The port specification string (e.g., '80,443' or '1-1000')
   * @returns {Array<number>|null} - Array of port numbers or null if invalid
   */
  parsePortsString(portsString) {
    try {
      const ports = [];
      
      // Split by comma to handle multiple port specifications
      const portSpecs = portsString.split(',');
      
      for (const spec of portSpecs) {
        // If range notation (e.g., '1-1000')
        if (spec.includes('-')) {
          const [start, end] = spec.split('-').map(p => parseInt(p, 10));
          
          if (isNaN(start) || isNaN(end) || start < 1 || end > 65535 || start > end) {
            logger.warn(`Invalid port range: ${spec}`);
            return null;
          }
          
          for (let port = start; port <= end; port++) {
            ports.push(port);
          }
        } 
        // Single port
        else {
          const port = parseInt(spec, 10);
          
          if (isNaN(port) || port < 1 || port > 65535) {
            logger.warn(`Invalid port: ${spec}`);
            return null;
          }
          
          ports.push(port);
        }
      }
      
      return ports;
    } catch (error) {
      logger.error(`Error parsing ports string: ${error.message}`);
      return null;
    }
  }

  /**
   * Validates a target input (IP, hostname, or URL)
   * @param {string} target - Target to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidTarget(target) {
    // Check if target is a URL with a scheme (http or https)
    if (target.startsWith('http://') || target.startsWith('https://')) {
      try {
        const url = new URL(target);
        return Boolean(url.hostname);
      } catch (error) {
        return false;
      }
    }
    // Otherwise check if it's a valid IP or hostname
    return this.isValidIp(target) || this.isValidHostname(target);
  }

  /**
   * Parses and validates a timeout value
   * @param {string|number} timeout - Timeout value to validate
   * @param {number} defaultValue - Default value if invalid
   * @param {number} minValue - Minimum allowed value
   * @param {number} maxValue - Maximum allowed value
   * @returns {number} - The validated timeout value
   */
  parseTimeout(timeout, defaultValue = 2000, minValue = 100, maxValue = 60000) {
    const timeoutNum = parseInt(timeout, 10);
    
    if (isNaN(timeoutNum) || timeoutNum < minValue || timeoutNum > maxValue) {
      logger.warn(`Invalid timeout value: ${timeout}. Using default: ${defaultValue}ms`);
      return defaultValue;
    }
    
    return timeoutNum;
  }

  /**
   * Validates AWS region format
   * @param {string} region - AWS region to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValidAwsRegion(region) {
    // Regular expression for AWS region validation
    const regionRegex = /^[a-z]{2}-[a-z]+-\d{1}$/;
    return regionRegex.test(region);
  }
}

module.exports = new Validator();
