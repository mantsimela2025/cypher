const { db } = require('../../db');
const { 
  dataConflicts, 
  conflictResolutions, 
  auditLogs,
  assets,
  vulnerabilities,
  controls
} = require('../../db/schema');
const { eq, and, sql, desc, inArray } = require('drizzle-orm');

/**
 * Conflict Resolution Service
 * Handles data discrepancies between external platforms with smart resolution and audit trails
 */
class ConflictResolutionService {
  constructor() {
    this.isInitialized = false;
    this.resolutionStrategies = new Map();
    this.conflictQueue = [];
    this.processingConflicts = false;
  }

  /**
   * Initialize conflict resolution service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Register resolution strategies
      this.registerResolutionStrategies();
      
      // Start background conflict processing
      this.startBackgroundProcessing();
      
      this.isInitialized = true;
      console.log('✅ Conflict resolution service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize conflict resolution service:', error);
      throw error;
    }
  }

  /**
   * Register conflict resolution strategies
   */
  registerResolutionStrategies() {
    // Asset conflicts
    this.resolutionStrategies.set('asset.hostname_mismatch', this.resolveHostnameMismatch.bind(this));
    this.resolutionStrategies.set('asset.ip_address_conflict', this.resolveIpAddressConflict.bind(this));
    this.resolutionStrategies.set('asset.operating_system_mismatch', this.resolveOperatingSystemMismatch.bind(this));
    this.resolutionStrategies.set('asset.criticality_conflict', this.resolveCriticalityConflict.bind(this));

    // Vulnerability conflicts
    this.resolutionStrategies.set('vulnerability.severity_mismatch', this.resolveSeverityMismatch.bind(this));
    this.resolutionStrategies.set('vulnerability.cvss_score_conflict', this.resolveCvssScoreConflict.bind(this));
    this.resolutionStrategies.set('vulnerability.status_mismatch', this.resolveStatusMismatch.bind(this));
    this.resolutionStrategies.set('vulnerability.duplicate_detection', this.resolveDuplicateVulnerability.bind(this));

    // Control conflicts
    this.resolutionStrategies.set('control.implementation_status_conflict', this.resolveImplementationStatusConflict.bind(this));
    this.resolutionStrategies.set('control.assessment_result_mismatch', this.resolveAssessmentResultMismatch.bind(this));

    // Data freshness conflicts
    this.resolutionStrategies.set('data.timestamp_conflict', this.resolveTimestampConflict.bind(this));
    this.resolutionStrategies.set('data.source_priority_conflict', this.resolveSourcePriorityConflict.bind(this));

    console.log(`🔧 Registered ${this.resolutionStrategies.size} conflict resolution strategies`);
  }

  /**
   * Start background conflict processing
   */
  startBackgroundProcessing() {
    setInterval(async () => {
      if (!this.processingConflicts && this.conflictQueue.length > 0) {
        await this.processConflictQueue();
      }
    }, 10000); // Process every 10 seconds
  }

  /**
   * Detect and resolve conflicts for a data record
   */
  async detectAndResolveConflicts(entityType, entityId, newData, existingData, source) {
    try {
      console.log(`🔍 Detecting conflicts for ${entityType}:${entityId} from ${source}`);

      const conflicts = await this.detectConflicts(entityType, entityId, newData, existingData, source);
      
      if (conflicts.length === 0) {
        console.log(`✅ No conflicts detected for ${entityType}:${entityId}`);
        return { hasConflicts: false, resolvedData: newData };
      }

      console.log(`⚠️ Found ${conflicts.length} conflicts for ${entityType}:${entityId}`);

      // Store conflicts in database
      await this.storeConflicts(conflicts);

      // Attempt automatic resolution
      const resolutionResults = await this.resolveConflicts(conflicts);

      // Return resolved data
      const resolvedData = this.mergeResolvedData(newData, existingData, resolutionResults);

      return {
        hasConflicts: true,
        conflictCount: conflicts.length,
        resolvedCount: resolutionResults.filter(r => r.resolved).length,
        conflicts,
        resolutionResults,
        resolvedData
      };

    } catch (error) {
      console.error(`❌ Error in conflict detection/resolution for ${entityType}:${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Detect conflicts between new and existing data
   */
  async detectConflicts(entityType, entityId, newData, existingData, source) {
    const conflicts = [];

    if (!existingData) return conflicts;

    // Compare each field
    for (const [field, newValue] of Object.entries(newData)) {
      const existingValue = existingData[field];

      if (existingValue !== undefined && existingValue !== newValue) {
        const conflictType = this.determineConflictType(entityType, field, newValue, existingValue);
        
        if (conflictType) {
          conflicts.push({
            entityType,
            entityId,
            field,
            conflictType,
            newValue,
            existingValue,
            source,
            existingSource: existingData._source || 'unknown',
            detectedAt: new Date(),
            severity: this.calculateConflictSeverity(conflictType, field, newValue, existingValue),
            confidence: this.calculateConflictConfidence(conflictType, field, newValue, existingValue)
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Determine conflict type based on entity type and field
   */
  determineConflictType(entityType, field, newValue, existingValue) {
    const conflictMap = {
      'asset': {
        'hostname': 'asset.hostname_mismatch',
        'ipAddress': 'asset.ip_address_conflict',
        'operatingSystem': 'asset.operating_system_mismatch',
        'criticality': 'asset.criticality_conflict'
      },
      'vulnerability': {
        'severity': 'vulnerability.severity_mismatch',
        'cvssScore': 'vulnerability.cvss_score_conflict',
        'status': 'vulnerability.status_mismatch'
      },
      'control': {
        'implementationStatus': 'control.implementation_status_conflict',
        'assessmentResult': 'control.assessment_result_mismatch'
      }
    };

    return conflictMap[entityType]?.[field] || 'data.generic_mismatch';
  }

  /**
   * Calculate conflict severity
   */
  calculateConflictSeverity(conflictType, field, newValue, existingValue) {
    // Critical fields that affect security posture
    const criticalFields = ['severity', 'cvssScore', 'status', 'criticality'];
    
    if (criticalFields.includes(field)) {
      return 'high';
    }

    // Fields that affect identification
    const identificationFields = ['hostname', 'ipAddress'];
    if (identificationFields.includes(field)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate conflict confidence
   */
  calculateConflictConfidence(conflictType, field, newValue, existingValue) {
    // Higher confidence for exact value mismatches
    if (typeof newValue === typeof existingValue) {
      return 0.9;
    }

    // Lower confidence for type mismatches
    return 0.7;
  }

  /**
   * Store conflicts in database
   */
  async storeConflicts(conflicts) {
    try {
      if (conflicts.length === 0) return;

      const conflictRecords = conflicts.map(conflict => ({
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        field: conflict.field,
        conflictType: conflict.conflictType,
        newValue: JSON.stringify(conflict.newValue),
        existingValue: JSON.stringify(conflict.existingValue),
        source: conflict.source,
        existingSource: conflict.existingSource,
        severity: conflict.severity,
        confidence: conflict.confidence,
        status: 'pending',
        detectedAt: conflict.detectedAt
      }));

      await db.insert(dataConflicts).values(conflictRecords);
      console.log(`📝 Stored ${conflicts.length} conflicts in database`);

    } catch (error) {
      console.error('Error storing conflicts:', error);
      throw error;
    }
  }

  /**
   * Resolve conflicts using registered strategies
   */
  async resolveConflicts(conflicts) {
    const resolutionResults = [];

    for (const conflict of conflicts) {
      try {
        const strategy = this.resolutionStrategies.get(conflict.conflictType);
        
        if (strategy) {
          const resolution = await strategy(conflict);
          resolutionResults.push({
            conflict,
            resolution,
            resolved: resolution.action !== 'manual_review'
          });

          // Store resolution in database
          await this.storeResolution(conflict, resolution);
        } else {
          console.warn(`No resolution strategy found for conflict type: ${conflict.conflictType}`);
          resolutionResults.push({
            conflict,
            resolution: { action: 'manual_review', reason: 'No strategy available' },
            resolved: false
          });
        }
      } catch (error) {
        console.error(`Error resolving conflict ${conflict.conflictType}:`, error);
        resolutionResults.push({
          conflict,
          resolution: { action: 'error', reason: error.message },
          resolved: false
        });
      }
    }

    return resolutionResults;
  }

  /**
   * Store resolution in database
   */
  async storeResolution(conflict, resolution) {
    try {
      await db.insert(conflictResolutions).values({
        conflictId: conflict.id,
        action: resolution.action,
        resolvedValue: JSON.stringify(resolution.resolvedValue),
        reasoning: resolution.reasoning,
        confidence: resolution.confidence,
        resolvedBy: 'system',
        resolvedAt: new Date(),
        metadata: JSON.stringify(resolution.metadata || {})
      });

      // Update conflict status
      if (conflict.id) {
        await db.update(dataConflicts)
          .set({ 
            status: resolution.action === 'manual_review' ? 'pending_review' : 'resolved',
            updatedAt: new Date()
          })
          .where(eq(dataConflicts.id, conflict.id));
      }

    } catch (error) {
      console.error('Error storing resolution:', error);
      throw error;
    }
  }

  // Resolution Strategies

  /**
   * Resolve hostname mismatch
   */
  async resolveHostnameMismatch(conflict) {
    const { newValue, existingValue, source, existingSource } = conflict;

    // Prefer more recent data from trusted sources
    const sourcePriority = { 'tenable': 3, 'xacta': 2, 'manual': 1 };
    const newPriority = sourcePriority[source] || 0;
    const existingPriority = sourcePriority[existingSource] || 0;

    if (newPriority > existingPriority) {
      return {
        action: 'use_new',
        resolvedValue: newValue,
        reasoning: `Source ${source} has higher priority than ${existingSource}`,
        confidence: 0.8
      };
    } else if (existingPriority > newPriority) {
      return {
        action: 'use_existing',
        resolvedValue: existingValue,
        reasoning: `Existing source ${existingSource} has higher priority than ${source}`,
        confidence: 0.8
      };
    }

    // If same priority, prefer longer hostname (more specific)
    if (newValue.length > existingValue.length) {
      return {
        action: 'use_new',
        resolvedValue: newValue,
        reasoning: 'New hostname is more specific (longer)',
        confidence: 0.6
      };
    }

    return {
      action: 'manual_review',
      reasoning: 'Unable to automatically resolve hostname conflict',
      confidence: 0.3
    };
  }

  /**
   * Resolve IP address conflict
   */
  async resolveIpAddressConflict(conflict) {
    const { newValue, existingValue, source } = conflict;

    // Prefer private IP addresses over public ones for internal assets
    const isNewPrivate = this.isPrivateIP(newValue);
    const isExistingPrivate = this.isPrivateIP(existingValue);

    if (isNewPrivate && !isExistingPrivate) {
      return {
        action: 'use_new',
        resolvedValue: newValue,
        reasoning: 'Private IP address preferred for internal asset',
        confidence: 0.7
      };
    } else if (!isNewPrivate && isExistingPrivate) {
      return {
        action: 'use_existing',
        resolvedValue: existingValue,
        reasoning: 'Existing private IP address preferred',
        confidence: 0.7
      };
    }

    // If both are same type, prefer more recent data
    return {
      action: 'use_new',
      resolvedValue: newValue,
      reasoning: 'Using more recent IP address data',
      confidence: 0.6
    };
  }

  /**
   * Resolve severity mismatch
   */
  async resolveSeverityMismatch(conflict) {
    const { newValue, existingValue, source } = conflict;

    // Map severity levels to numeric values
    const severityMap = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    const newSeverity = severityMap[newValue.toLowerCase()] || 0;
    const existingSeverity = severityMap[existingValue.toLowerCase()] || 0;

    // Prefer higher severity (more conservative approach)
    if (newSeverity > existingSeverity) {
      return {
        action: 'use_new',
        resolvedValue: newValue,
        reasoning: 'Using higher severity for conservative security posture',
        confidence: 0.8
      };
    } else if (existingSeverity > newSeverity) {
      return {
        action: 'use_existing',
        resolvedValue: existingValue,
        reasoning: 'Keeping higher existing severity',
        confidence: 0.8
      };
    }

    // If same severity, use source priority
    return await this.resolveBySourcePriority(conflict);
  }

  /**
   * Resolve CVSS score conflict
   */
  async resolveCvssScoreConflict(conflict) {
    const { newValue, existingValue } = conflict;

    const newScore = parseFloat(newValue) || 0;
    const existingScore = parseFloat(existingValue) || 0;

    // Use higher CVSS score (more conservative)
    if (newScore > existingScore) {
      return {
        action: 'use_new',
        resolvedValue: newValue,
        reasoning: 'Using higher CVSS score for conservative assessment',
        confidence: 0.9
      };
    } else if (existingScore > newScore) {
      return {
        action: 'use_existing',
        resolvedValue: existingValue,
        reasoning: 'Keeping higher existing CVSS score',
        confidence: 0.9
      };
    }

    return await this.resolveBySourcePriority(conflict);
  }

  /**
   * Resolve by source priority
   */
  async resolveBySourcePriority(conflict) {
    const { newValue, existingValue, source, existingSource } = conflict;

    const sourcePriority = { 'tenable': 3, 'xacta': 2, 'manual': 1 };
    const newPriority = sourcePriority[source] || 0;
    const existingPriority = sourcePriority[existingSource] || 0;

    if (newPriority > existingPriority) {
      return {
        action: 'use_new',
        resolvedValue: newValue,
        reasoning: `Source ${source} has higher priority`,
        confidence: 0.7
      };
    } else if (existingPriority > newPriority) {
      return {
        action: 'use_existing',
        resolvedValue: existingValue,
        reasoning: `Existing source has higher priority`,
        confidence: 0.7
      };
    }

    return {
      action: 'manual_review',
      reasoning: 'Sources have equal priority, manual review required',
      confidence: 0.3
    };
  }

  /**
   * Check if IP address is private
   */
  isPrivateIP(ip) {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^127\./
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * Merge resolved data
   */
  mergeResolvedData(newData, existingData, resolutionResults) {
    const resolvedData = { ...newData };

    for (const result of resolutionResults) {
      if (result.resolved && result.resolution.resolvedValue !== undefined) {
        const field = result.conflict.field;
        
        switch (result.resolution.action) {
          case 'use_new':
            resolvedData[field] = result.conflict.newValue;
            break;
          case 'use_existing':
            resolvedData[field] = result.conflict.existingValue;
            break;
          case 'use_resolved':
            resolvedData[field] = result.resolution.resolvedValue;
            break;
        }
      }
    }

    return resolvedData;
  }

  /**
   * Get conflict statistics
   */
  async getConflictStats(filters = {}) {
    try {
      let query = db.select({
        total: sql`COUNT(*)`,
        pending: sql`COUNT(*) FILTER (WHERE status = 'pending')`,
        resolved: sql`COUNT(*) FILTER (WHERE status = 'resolved')`,
        pendingReview: sql`COUNT(*) FILTER (WHERE status = 'pending_review')`,
        highSeverity: sql`COUNT(*) FILTER (WHERE severity = 'high')`,
        recentConflicts: sql`COUNT(*) FILTER (WHERE detected_at >= NOW() - INTERVAL '24 hours')`
      }).from(dataConflicts);

      if (filters.entityType) {
        query = query.where(eq(dataConflicts.entityType, filters.entityType));
      }

      const [stats] = await query;

      return {
        ...stats,
        queueSize: this.conflictQueue.length,
        strategiesLoaded: this.resolutionStrategies.size,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Error fetching conflict stats:', error);
      throw error;
    }
  }

  /**
   * Get pending conflicts
   */
  async getPendingConflicts(filters = {}) {
    try {
      let query = db.select().from(dataConflicts)
        .where(eq(dataConflicts.status, 'pending'));

      if (filters.entityType) {
        query = query.where(eq(dataConflicts.entityType, filters.entityType));
      }

      if (filters.severity) {
        query = query.where(eq(dataConflicts.severity, filters.severity));
      }

      const conflicts = await query
        .orderBy(desc(dataConflicts.detectedAt))
        .limit(filters.limit || 100);

      return conflicts;

    } catch (error) {
      console.error('Error fetching pending conflicts:', error);
      throw error;
    }
  }

  /**
   * Manually resolve conflict
   */
  async manuallyResolveConflict(conflictId, resolution, userId) {
    try {
      const conflict = await db.select()
        .from(dataConflicts)
        .where(eq(dataConflicts.id, conflictId))
        .limit(1);

      if (!conflict.length) {
        throw new Error(`Conflict ${conflictId} not found`);
      }

      // Store manual resolution
      await db.insert(conflictResolutions).values({
        conflictId,
        action: resolution.action,
        resolvedValue: JSON.stringify(resolution.resolvedValue),
        reasoning: resolution.reasoning,
        confidence: 1.0, // Manual resolution has full confidence
        resolvedBy: userId,
        resolvedAt: new Date(),
        metadata: JSON.stringify({ manual: true })
      });

      // Update conflict status
      await db.update(dataConflicts)
        .set({ 
          status: 'resolved',
          updatedAt: new Date()
        })
        .where(eq(dataConflicts.id, conflictId));

      // Log the manual resolution
      await this.logAuditEvent('conflict_manually_resolved', {
        conflictId,
        userId,
        resolution
      });

      console.log(`✅ Manually resolved conflict ${conflictId}`);
      return { success: true };

    } catch (error) {
      console.error(`Error manually resolving conflict ${conflictId}:`, error);
      throw error;
    }
  }

  /**
   * Log audit event
   */
  async logAuditEvent(action, details) {
    try {
      await db.insert(auditLogs).values({
        action,
        entityType: 'conflict',
        entityId: details.conflictId,
        userId: details.userId,
        details: JSON.stringify(details),
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Process conflict queue
   */
  async processConflictQueue() {
    if (this.processingConflicts || this.conflictQueue.length === 0) return;

    this.processingConflicts = true;

    try {
      const batch = this.conflictQueue.splice(0, 10); // Process 10 at a time
      
      for (const item of batch) {
        try {
          await this.detectAndResolveConflicts(
            item.entityType,
            item.entityId,
            item.newData,
            item.existingData,
            item.source
          );
        } catch (error) {
          console.error(`Failed to process queued conflict for ${item.entityType}:${item.entityId}:`, error);
        }
      }
    } finally {
      this.processingConflicts = false;
    }
  }

  /**
   * Queue conflict for processing
   */
  queueConflict(entityType, entityId, newData, existingData, source) {
    this.conflictQueue.push({
      entityType,
      entityId,
      newData,
      existingData,
      source,
      queuedAt: new Date()
    });
    console.log(`📋 Queued conflict for ${entityType}:${entityId}`);
  }
}

module.exports = new ConflictResolutionService();
