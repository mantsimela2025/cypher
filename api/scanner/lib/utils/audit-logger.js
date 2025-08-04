/**
 * Audit logging utility for secure environments
 * Creates tamper-evident logs of all security scanning operations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const winston = require('winston');

// Configure secure logging
const secureLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'security-scanner' },
  transports: [
    new winston.transports.File({ 
      filename: 'audit.log',
      // Add file rotation and other secure features as needed
    })
  ]
});

/**
 * Create an audit log for a security scanning operation
 * @param {string} operation - Type of operation being performed
 * @param {Object} metadata - Metadata about the operation
 * @returns {Object} - Audit logger instance
 */
function createAuditLog(operation, metadata = {}) {
  const scanId = metadata.scanId || `scan-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const auditLog = {
    scanId,
    operation,
    startTime: new Date().toISOString(),
    logs: [],
    chains: [],
    
    /**
     * Log an event to the audit trail
     * @param {string} event - Event type
     * @param {Object} data - Event data
     */
    log(event, data = {}) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        scanId: this.scanId,
        timestamp,
        operation: this.operation,
        event,
        ...data
      };
      
      // Add to internal log array
      this.logs.push(logEntry);
      
      // Create a hash chain for tamper evidence
      const lastHash = this.chains.length > 0 
        ? this.chains[this.chains.length - 1].hash 
        : '';
      
      const entryString = JSON.stringify(logEntry);
      const hash = crypto.createHash('sha256')
        .update(lastHash + entryString)
        .digest('hex');
      
      this.chains.push({ 
        index: this.chains.length,
        timestamp,
        data: logEntry,
        hash
      });
      
      // Write to secure log
      secureLogger.info(event, { 
        ...logEntry,
        hash
      });
      
      return logEntry;
    },
    
    /**
     * Complete the audit log and write a final summary
     * @param {Object} summary - Summary of the operation
     */
    complete(summary = {}) {
      const endTime = new Date().toISOString();
      const duration = new Date(endTime) - new Date(this.startTime);
      
      const completionLog = this.log('audit_completed', {
        endTime,
        duration,
        summary,
        logCount: this.logs.length
      });
      
      // Write final hash as proof of integrity
      const finalHash = this.chains[this.chains.length - 1].hash;
      secureLogger.info('audit_sealed', {
        scanId: this.scanId,
        finalHash,
        timestamp: new Date().toISOString()
      });
      
      // Optionally write the complete log chain to a tamper-evident file
      if (process.env.SECURE_ENV === 'gov') {
        try {
          const auditLogDir = path.join(process.cwd(), 'audit-logs');
          if (!fs.existsSync(auditLogDir)) {
            fs.mkdirSync(auditLogDir, { recursive: true });
          }
          
          const auditFile = path.join(auditLogDir, `${this.scanId}.json`);
          fs.writeFileSync(auditFile, JSON.stringify({
            scanId: this.scanId,
            operation: this.operation,
            startTime: this.startTime,
            endTime,
            duration,
            logCount: this.logs.length,
            chain: this.chains,
            finalHash
          }, null, 2));
        } catch (err) {
          secureLogger.error('Failed to write audit log file', { error: err.message });
        }
      }
      
      return completionLog;
    },
    
    /**
     * Verify the integrity of the audit log chain
     * @returns {boolean} - True if the chain is valid
     */
    verify() {
      if (this.chains.length === 0) return true;
      
      let previousHash = '';
      
      for (let i = 0; i < this.chains.length; i++) {
        const block = this.chains[i];
        const blockData = JSON.stringify(block.data);
        const calculatedHash = crypto.createHash('sha256')
          .update(previousHash + blockData)
          .digest('hex');
        
        if (block.hash !== calculatedHash) {
          return false;
        }
        
        previousHash = block.hash;
      }
      
      return true;
    }
  };
  
  // Log audit initiation
  auditLog.log('audit_initiated', {
    scanId: auditLog.scanId,
    operation,
    ...metadata
  });
  
  return auditLog;
}

module.exports = {
  createAuditLog,
  secureLogger
};