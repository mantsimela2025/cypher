/**
 * Backend API Integration Module
 * 
 * Provides integration points for government-grade secure API integration
 * with role-based access control and audit trail.
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Import scanning modules
const internalScan = require('../../commands/internal-scan');
const vulnerabilityScan = require('../../commands/vulnerability-scan');
const complianceScan = require('../../commands/compliance-scan');
const webScan = require('../../commands/web-scan');

// Import audit logging
const { createAuditLog } = require('../utils/audit-logger');

/**
 * BackendAPIIntegration class for secure scanner integration with backend APIs
 */
class BackendAPIIntegration {
  /**
   * Create a new backend API integration instance
   * @param {Object} options - Integration options
   * @param {Object} options.rbac - Role-based access control configuration
   * @param {string} options.resultsDir - Directory to store scan results
   */
  constructor(options = {}) {
    this.rbac = options.rbac || this._getDefaultRBAC();
    this.resultsDir = options.resultsDir || path.join(process.cwd(), 'scan-results');
    
    // Ensure results directory exists
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }
  
  /**
   * Get default RBAC configuration
   * @returns {Object} - Default RBAC configuration
   * @private
   */
  _getDefaultRBAC() {
    return {
      roles: {
        'admin': { 
          permissions: ['internal-scan', 'vuln-scan', 'compliance-scan', 'web-scan', 'view-results', 'delete-results'] 
        },
        'security-analyst': {
          permissions: ['vuln-scan', 'compliance-scan', 'web-scan', 'view-results']
        },
        'auditor': {
          permissions: ['view-results']
        }
      }
    };
  }
  
  /**
   * Check if a user has permission for an operation
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} permission - Required permission
   * @returns {boolean} - True if user has permission
   */
  hasPermission(userId, role, permission) {
    if (!this.rbac.roles[role]) {
      return false;
    }
    
    return this.rbac.roles[role].permissions.includes(permission);
  }
  
  /**
   * Run an internal scan from the API
   * @param {Object} scanConfig - Scan configuration
   * @param {Object} user - User information
   * @returns {Promise<Object>} - Scan results with metadata
   */
  async runInternalScan(scanConfig, user) {
    // Check user permission
    if (!this.hasPermission(user.id, user.role, 'internal-scan')) {
      throw new Error('Unauthorized: User does not have permission to run internal scans');
    }
    
    // Create audit log
    const audit = createAuditLog('internal-scan', {
      user: user.id,
      scanId: `int-${Date.now()}`,
      offline: true
    });
    
    try {
      // Log scan request
      audit.log('scan_requested', { scanConfig, user: user.id });
      
      // Configure output file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const outputFile = path.join(this.resultsDir, `internal-scan-${timestamp}.json`);
      
      // Run the scan with output redirected to file
      const scanOptions = {
        ...scanConfig,
        output: outputFile,
        user: user.id,
        comprehensive: true
      };
      
      // Run scan
      const results = await internalScan(scanOptions);
      
      // Log completion
      audit.log('scan_completed', {
        outputFile,
        findingCount: results.summary.total
      });
      
      // Complete audit log
      audit.complete({
        scanId: audit.scanId,
        status: 'completed',
        findings: results.summary.total
      });
      
      return {
        status: 'completed',
        scanId: audit.scanId,
        timestamp,
        outputFile,
        summary: results.summary,
        user: user.id
      };
    } catch (error) {
      // Log error
      audit.log('scan_error', { 
        error: error.message,
        stack: error.stack
      });
      
      // Complete audit log with error status
      audit.complete({
        scanId: audit.scanId,
        status: 'error',
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Run a vulnerability scan from the API
   * @param {string} target - Target to scan
   * @param {Object} scanConfig - Scan configuration
   * @param {Object} user - User information
   * @returns {Promise<Object>} - Scan results with metadata
   */
  async runVulnerabilityScan(target, scanConfig, user) {
    // Check user permission
    if (!this.hasPermission(user.id, user.role, 'vuln-scan')) {
      throw new Error('Unauthorized: User does not have permission to run vulnerability scans');
    }
    
    // Create audit log
    const audit = createAuditLog('vuln-scan', {
      user: user.id,
      scanId: `vuln-${Date.now()}`,
      target
    });
    
    try {
      // Log scan request
      audit.log('scan_requested', { target, scanConfig, user: user.id });
      
      // Configure output file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const sanitizedTarget = target.replace(/[^a-z0-9]/gi, '-');
      const outputFile = path.join(this.resultsDir, `vuln-scan-${sanitizedTarget}-${timestamp}.json`);
      
      // Set up options
      const options = {
        ...scanConfig,
        comprehensive: true,
        output: outputFile
      };
      
      // Run scan
      const results = await vulnerabilityScan(target, options);
      
      // Log completion
      audit.log('scan_completed', {
        outputFile,
        findingCount: results?.findings?.length || 0
      });
      
      // Complete audit log
      audit.complete({
        scanId: audit.scanId,
        status: 'completed',
        target,
        findings: results?.findings?.length || 0
      });
      
      return {
        status: 'completed',
        scanId: audit.scanId,
        timestamp,
        target,
        outputFile,
        summary: results.summary || { total: results?.findings?.length || 0 },
        user: user.id
      };
    } catch (error) {
      // Log error
      audit.log('scan_error', { 
        error: error.message,
        stack: error.stack
      });
      
      // Complete audit log with error status
      audit.complete({
        scanId: audit.scanId,
        status: 'error',
        target,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Run a compliance scan from the API
   * @param {string} target - Target to scan
   * @param {Object} scanConfig - Scan configuration
   * @param {Object} user - User information
   * @returns {Promise<Object>} - Scan results with metadata
   */
  async runComplianceScan(target, scanConfig, user) {
    // Check user permission
    if (!this.hasPermission(user.id, user.role, 'compliance-scan')) {
      throw new Error('Unauthorized: User does not have permission to run compliance scans');
    }
    
    // Create audit log
    const audit = createAuditLog('compliance-scan', {
      user: user.id,
      scanId: `comp-${Date.now()}`,
      target
    });
    
    try {
      // Log scan request
      audit.log('scan_requested', { target, scanConfig, user: user.id });
      
      // Configure output file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const sanitizedTarget = target.replace(/[^a-z0-9]/gi, '-');
      const outputFile = path.join(this.resultsDir, `compliance-scan-${sanitizedTarget}-${timestamp}.json`);
      
      // Set up options
      const options = {
        ...scanConfig,
        comprehensive: true,
        output: outputFile
      };
      
      // Run scan
      const results = await complianceScan(target, options);
      
      // Log completion
      audit.log('scan_completed', {
        outputFile,
        frameworks: options.frameworks
      });
      
      // Complete audit log
      audit.complete({
        scanId: audit.scanId,
        status: 'completed',
        target,
        frameworks: options.frameworks
      });
      
      return {
        status: 'completed',
        scanId: audit.scanId,
        timestamp,
        target,
        outputFile,
        frameworks: options.frameworks,
        user: user.id
      };
    } catch (error) {
      // Log error
      audit.log('scan_error', { 
        error: error.message,
        stack: error.stack
      });
      
      // Complete audit log with error status
      audit.complete({
        scanId: audit.scanId,
        status: 'error',
        target,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Get a list of scan results
   * @param {Object} user - User information
   * @param {Object} options - List options
   * @returns {Promise<Array>} - List of scan results
   */
  async listScanResults(user, options = {}) {
    // Check user permission
    if (!this.hasPermission(user.id, user.role, 'view-results')) {
      throw new Error('Unauthorized: User does not have permission to view scan results');
    }
    
    // Create audit log
    const audit = createAuditLog('list-results', {
      user: user.id
    });
    
    try {
      // Get all files in results directory
      const files = fs.readdirSync(this.resultsDir);
      
      // Filter and format results
      const results = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          try {
            const filePath = path.join(this.resultsDir, file);
            const stats = fs.statSync(filePath);
            
            // Parse file name for metadata
            const parts = file.split('-');
            const scanType = parts[0];
            
            let target = 'unknown';
            if (scanType !== 'internal') {
              // Try to extract target from filename
              target = parts.slice(1, -1).join('-');
            }
            
            // Attempt to read summary from file
            let summary = null;
            try {
              const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
              summary = data.summary || null;
            } catch (err) {
              // Unable to read summary
            }
            
            return {
              id: crypto.createHash('md5').update(file).digest('hex').substring(0, 8),
              fileName: file,
              filePath,
              scanType,
              target,
              timestamp: stats.mtime,
              size: stats.size,
              summary
            };
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean);
      
      // Sort by timestamp (most recent first)
      results.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply pagination if requested
      let paginatedResults = results;
      if (options.limit) {
        const start = options.offset || 0;
        const end = start + options.limit;
        paginatedResults = results.slice(start, end);
      }
      
      // Log completion
      audit.log('results_listed', {
        count: results.length,
        returnedCount: paginatedResults.length
      });
      
      // Complete audit log
      audit.complete({
        status: 'completed',
        count: results.length
      });
      
      return {
        total: results.length,
        results: paginatedResults
      };
    } catch (error) {
      // Log error
      audit.log('list_error', { 
        error: error.message,
        stack: error.stack
      });
      
      // Complete audit log with error status
      audit.complete({
        status: 'error',
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Get a specific scan result by ID
   * @param {string} resultId - Result ID
   * @param {Object} user - User information
   * @returns {Promise<Object>} - Scan result
   */
  async getScanResult(resultId, user) {
    // Check user permission
    if (!this.hasPermission(user.id, user.role, 'view-results')) {
      throw new Error('Unauthorized: User does not have permission to view scan results');
    }
    
    // Create audit log
    const audit = createAuditLog('get-result', {
      user: user.id,
      resultId
    });
    
    try {
      // Get all files in results directory
      const files = fs.readdirSync(this.resultsDir);
      
      // Find file matching the result ID
      const matchingFile = files.find(file => {
        const fileId = crypto.createHash('md5').update(file).digest('hex').substring(0, 8);
        return fileId === resultId;
      });
      
      if (!matchingFile) {
        throw new Error(`Result with ID ${resultId} not found`);
      }
      
      // Read the file
      const filePath = path.join(this.resultsDir, matchingFile);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const result = JSON.parse(fileContent);
      
      // Log access
      audit.log('result_accessed', {
        resultId,
        file: matchingFile
      });
      
      // Complete audit log
      audit.complete({
        status: 'completed',
        resultId
      });
      
      return {
        id: resultId,
        fileName: matchingFile,
        content: result
      };
    } catch (error) {
      // Log error
      audit.log('get_error', { 
        error: error.message,
        stack: error.stack
      });
      
      // Complete audit log with error status
      audit.complete({
        status: 'error',
        resultId,
        error: error.message
      });
      
      throw error;
    }
  }
  
  /**
   * Delete a specific scan result
   * @param {string} resultId - Result ID
   * @param {Object} user - User information
   * @returns {Promise<Object>} - Status
   */
  async deleteScanResult(resultId, user) {
    // Check user permission
    if (!this.hasPermission(user.id, user.role, 'delete-results')) {
      throw new Error('Unauthorized: User does not have permission to delete scan results');
    }
    
    // Create audit log
    const audit = createAuditLog('delete-result', {
      user: user.id,
      resultId
    });
    
    try {
      // Get all files in results directory
      const files = fs.readdirSync(this.resultsDir);
      
      // Find file matching the result ID
      const matchingFile = files.find(file => {
        const fileId = crypto.createHash('md5').update(file).digest('hex').substring(0, 8);
        return fileId === resultId;
      });
      
      if (!matchingFile) {
        throw new Error(`Result with ID ${resultId} not found`);
      }
      
      // Delete the file
      const filePath = path.join(this.resultsDir, matchingFile);
      fs.unlinkSync(filePath);
      
      // Log deletion
      audit.log('result_deleted', {
        resultId,
        file: matchingFile
      });
      
      // Complete audit log
      audit.complete({
        status: 'completed',
        resultId
      });
      
      return {
        status: 'success',
        message: `Result ${resultId} deleted successfully`
      };
    } catch (error) {
      // Log error
      audit.log('delete_error', { 
        error: error.message,
        stack: error.stack
      });
      
      // Complete audit log with error status
      audit.complete({
        status: 'error',
        resultId,
        error: error.message
      });
      
      throw error;
    }
  }
}

module.exports = BackendAPIIntegration;