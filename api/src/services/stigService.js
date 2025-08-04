const { db } = require('../db');
const { 
  stigLibrary,
  stigChecklists,
  stigAssessments,
  stigScanResults,
  stigHardeningSessions,
  stigHardeningResults,
  stigHardeningBackups,
  stigFixStatus,
  stigAiAssistance,
  assets,
  users
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');
const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const notificationService = require('./notificationService');

class StigService {

  // ==================== STIG LIBRARY MANAGEMENT ====================

  /**
   * Create STIG library entry
   */
  async createStigLibraryEntry(stigData, userId) {
    try {
      console.log('📚 Creating STIG library entry:', stigData.stigId);

      const [newStig] = await db.insert(stigLibrary)
        .values({
          ...stigData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Send notification for new STIG
      await this.sendStigNotification('stig_created', newStig, userId);

      return newStig;
    } catch (error) {
      console.error('Error creating STIG library entry:', error);
      throw error;
    }
  }

  /**
   * Get all STIG library entries
   */
  async getAllStigLibraryEntries(filters = {}, pagination = {}) {
    try {
      const { category, severity, status, platform, search } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: stigLibrary.id,
        stigId: stigLibrary.stigId,
        title: stigLibrary.title,
        description: stigLibrary.description,
        version: stigLibrary.version,
        releaseDate: stigLibrary.releaseDate,
        category: stigLibrary.category,
        severity: stigLibrary.severity,
        status: stigLibrary.status,
        platforms: stigLibrary.platforms,
        ruleId: stigLibrary.ruleId,
        vulnId: stigLibrary.vulnId,
        groupId: stigLibrary.groupId,
        weight: stigLibrary.weight,
        automationSupported: stigLibrary.automationSupported,
        requiresManualReview: stigLibrary.requiresManualReview,
        estimatedFixTime: stigLibrary.estimatedFixTime,
        businessImpact: stigLibrary.businessImpact,
        technicalComplexity: stigLibrary.technicalComplexity,
        complianceFrameworks: stigLibrary.complianceFrameworks,
        tags: stigLibrary.tags,
        createdAt: stigLibrary.createdAt,
        updatedAt: stigLibrary.updatedAt
      })
      .from(stigLibrary);

      // Apply filters
      const conditions = [];

      if (category) {
        conditions.push(eq(stigLibrary.category, category));
      }

      if (severity) {
        conditions.push(eq(stigLibrary.severity, severity));
      }

      if (status) {
        conditions.push(eq(stigLibrary.status, status));
      }

      if (platform) {
        conditions.push(sql`${platform} = ANY(${stigLibrary.platforms})`);
      }

      if (search) {
        conditions.push(
          sql`(
            ${stigLibrary.title} ILIKE ${`%${search}%`} OR 
            ${stigLibrary.description} ILIKE ${`%${search}%`} OR 
            ${stigLibrary.stigId} ILIKE ${`%${search}%`} OR
            ${stigLibrary.ruleId} ILIKE ${`%${search}%`} OR
            ${stigLibrary.vulnId} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = stigLibrary[sortBy] || stigLibrary.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const stigs = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(stigLibrary);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: stigs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting STIG library entries:', error);
      throw error;
    }
  }

  /**
   * Get STIG library entry by ID
   */
  async getStigLibraryEntryById(stigId) {
    try {
      const [stig] = await db.select()
        .from(stigLibrary)
        .where(eq(stigLibrary.id, stigId))
        .limit(1);

      if (!stig) {
        throw new Error('STIG library entry not found');
      }

      return stig;
    } catch (error) {
      console.error('Error getting STIG library entry by ID:', error);
      throw error;
    }
  }

  /**
   * Update STIG library entry
   */
  async updateStigLibraryEntry(stigId, updateData, userId) {
    try {
      console.log('📚 Updating STIG library entry:', stigId);

      const [updatedStig] = await db.update(stigLibrary)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(stigLibrary.id, stigId))
        .returning();

      // Send notification for STIG update
      await this.sendStigNotification('stig_updated', updatedStig, userId);

      return updatedStig;
    } catch (error) {
      console.error('Error updating STIG library entry:', error);
      throw error;
    }
  }

  /**
   * Delete STIG library entry
   */
  async deleteStigLibraryEntry(stigId, userId) {
    try {
      console.log('🗑️ Deleting STIG library entry:', stigId);

      // Check if STIG is being used in assessments
      const [usageCount] = await db.select({ count: count() })
        .from(stigAssessments)
        .where(eq(stigAssessments.stigId, stigId));

      if (usageCount.count > 0) {
        throw new Error('Cannot delete STIG that is being used in assessments');
      }

      await db.delete(stigLibrary)
        .where(eq(stigLibrary.id, stigId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting STIG library entry:', error);
      throw error;
    }
  }

  /**
   * Import STIG from XML
   */
  async importStigFromXml(xmlContent, userId) {
    try {
      console.log('📥 Importing STIG from XML');

      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);

      // Extract STIG information from XML structure
      const benchmark = result.Benchmark;
      const stigData = {
        stigId: benchmark.id[0],
        title: benchmark.title[0],
        description: benchmark.description[0],
        version: benchmark.version[0],
        releaseDate: new Date(benchmark['plain-text'][0].$.id.split('_')[1]),
        category: this.extractCategory(benchmark.title[0]),
        severity: 'medium', // Default, will be overridden by individual rules
        status: 'active',
        rawXml: xmlContent,
        platforms: this.extractPlatforms(benchmark),
        complianceFrameworks: this.extractComplianceFrameworks(benchmark)
      };

      // Process individual rules
      const groups = benchmark.Group || [];
      const importedStigs = [];

      for (const group of groups) {
        const rule = group.Rule[0];
        const ruleData = {
          ...stigData,
          stigId: `${stigData.stigId}_${group.$.id}`,
          ruleId: rule.$.id,
          vulnId: group.$.id,
          groupId: group.$.id,
          title: rule.title[0],
          description: rule.description[0],
          severity: rule.$.severity || 'medium',
          weight: parseFloat(rule.$.weight) || 10.0,
          checkContent: rule.check[0]['check-content'][0],
          fixText: rule.fixtext[0]._,
          implementationGuidance: this.extractImplementationGuidance(rule),
          verificationText: this.extractVerificationText(rule),
          riskAssessment: this.extractRiskAssessment(rule),
          cciReferences: this.extractCciReferences(rule),
          nistReferences: this.extractNistReferences(rule),
          iaControls: this.extractIaControls(rule),
          automationSupported: this.determineAutomationSupport(rule),
          requiresManualReview: this.determineManualReview(rule),
          estimatedFixTime: this.estimateFixTime(rule),
          businessImpact: this.assessBusinessImpact(rule),
          technicalComplexity: this.assessTechnicalComplexity(rule)
        };

        const [importedStig] = await db.insert(stigLibrary)
          .values(ruleData)
          .returning();

        importedStigs.push(importedStig);
      }

      console.log(`✅ Imported ${importedStigs.length} STIG rules from XML`);

      // Send notification for bulk import
      await notificationService.createNotification({
        userId: userId,
        title: 'STIG Import Completed',
        message: `Successfully imported ${importedStigs.length} STIG rules from XML`,
        type: 'success',
        module: 'stig',
        eventType: 'stig_imported',
        metadata: {
          importCount: importedStigs.length,
          stigBenchmark: stigData.stigId
        }
      });

      return {
        importedCount: importedStigs.length,
        stigs: importedStigs
      };
    } catch (error) {
      console.error('Error importing STIG from XML:', error);
      throw error;
    }
  }

  /**
   * Download STIG from DISA repository
   */
  async downloadStigFromDisa(stigIdentifier, userId) {
    try {
      console.log('📥 Downloading STIG from DISA:', stigIdentifier);

      // This would integrate with DISA STIG repository API
      // For now, we'll simulate the download process
      const mockStigData = {
        stigId: stigIdentifier,
        title: `STIG for ${stigIdentifier}`,
        description: `Security Technical Implementation Guide for ${stigIdentifier}`,
        version: '1.0',
        releaseDate: new Date(),
        category: 'operating_system',
        severity: 'high',
        status: 'active',
        platforms: ['windows', 'linux'],
        complianceFrameworks: ['NIST', 'DISA'],
        downloadSource: 'DISA',
        downloadDate: new Date()
      };

      const [downloadedStig] = await db.insert(stigLibrary)
        .values(mockStigData)
        .returning();

      // Send notification for STIG download
      await notificationService.createNotification({
        userId: userId,
        title: 'STIG Downloaded',
        message: `Successfully downloaded STIG: ${downloadedStig.title}`,
        type: 'success',
        module: 'stig',
        eventType: 'stig_downloaded',
        metadata: {
          stigId: downloadedStig.stigId,
          source: 'DISA'
        }
      });

      return downloadedStig;
    } catch (error) {
      console.error('Error downloading STIG from DISA:', error);
      throw error;
    }
  }

  // ==================== STIG CHECKLIST MANAGEMENT ====================

  /**
   * Create STIG checklist
   */
  async createStigChecklist(checklistData, userId) {
    try {
      console.log('📋 Creating STIG checklist for asset:', checklistData.assetId);

      const [newChecklist] = await db.insert(stigChecklists)
        .values({
          ...checklistData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Send notification for new checklist
      await this.sendStigNotification('checklist_created', newChecklist, userId);

      return newChecklist;
    } catch (error) {
      console.error('Error creating STIG checklist:', error);
      throw error;
    }
  }

  /**
   * Get all STIG checklists
   */
  async getAllStigChecklists(filters = {}, pagination = {}) {
    try {
      const { assetId, status, assignedTo, priority, search } = filters;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: stigChecklists.id,
        assetId: stigChecklists.assetId,
        benchmarkId: stigChecklists.benchmarkId,
        title: stigChecklists.title,
        version: stigChecklists.version,
        status: stigChecklists.status,
        targetType: stigChecklists.targetType,
        totalRules: stigChecklists.totalRules,
        completedRules: stigChecklists.completedRules,
        openFindings: stigChecklists.openFindings,
        notApplicable: stigChecklists.notApplicable,
        compliantFindings: stigChecklists.compliantFindings,
        nonCompliantFindings: stigChecklists.nonCompliantFindings,
        assignedTo: stigChecklists.assignedTo,
        reviewedBy: stigChecklists.reviewedBy,
        reviewedAt: stigChecklists.reviewedAt,
        dueDate: stigChecklists.dueDate,
        priority: stigChecklists.priority,
        complianceScore: stigChecklists.complianceScore,
        riskScore: stigChecklists.riskScore,
        workflowState: stigChecklists.workflowState,
        escalationLevel: stigChecklists.escalationLevel,
        createdBy: stigChecklists.createdBy,
        createdAt: stigChecklists.createdAt,
        updatedAt: stigChecklists.updatedAt
      })
      .from(stigChecklists);

      // Apply filters
      const conditions = [];

      if (assetId) {
        conditions.push(eq(stigChecklists.assetId, assetId));
      }

      if (status) {
        conditions.push(eq(stigChecklists.status, status));
      }

      if (assignedTo) {
        conditions.push(eq(stigChecklists.assignedTo, assignedTo));
      }

      if (priority) {
        conditions.push(eq(stigChecklists.priority, priority));
      }

      if (search) {
        conditions.push(
          sql`(
            ${stigChecklists.title} ILIKE ${`%${search}%`} OR 
            ${stigChecklists.benchmarkId} ILIKE ${`%${search}%`} OR
            ${stigChecklists.targetType} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = stigChecklists[sortBy] || stigChecklists.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const checklists = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(stigChecklists);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: checklists,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting STIG checklists:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Send STIG-related notifications
   */
  async sendStigNotification(eventType, data, userId) {
    try {
      const notificationMap = {
        'stig_created': {
          title: 'STIG Created',
          message: `New STIG entry created: ${data.title}`,
          type: 'info'
        },
        'stig_updated': {
          title: 'STIG Updated',
          message: `STIG entry updated: ${data.title}`,
          type: 'info'
        },
        'checklist_created': {
          title: 'STIG Checklist Created',
          message: `New STIG checklist created: ${data.title}`,
          type: 'info'
        },
        'checklist_updated': {
          title: 'STIG Checklist Updated',
          message: `STIG checklist updated: ${data.title}`,
          type: 'info'
        },
        'assessment_created': {
          title: 'STIG Assessment Created',
          message: `New STIG assessment created for asset ${data.assetId}`,
          type: 'info'
        },
        'assessment_updated': {
          title: 'STIG Assessment Updated',
          message: `STIG assessment updated for asset ${data.assetId}`,
          type: 'info'
        },
        'assessment_approved': {
          title: 'STIG Assessment Approved',
          message: `STIG assessment approved for asset ${data.assetId}`,
          type: 'success'
        },
        'scan_completed': {
          title: 'STIG Scan Completed',
          message: `STIG scan completed for asset ${data.assetId}`,
          type: 'success'
        }
      };

      const notification = notificationMap[eventType];
      if (notification) {
        await notificationService.createNotification({
          userId: userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'stig',
          eventType: eventType,
          relatedId: data.id,
          relatedType: 'stig',
          metadata: data
        });
      }
    } catch (error) {
      console.error('Error sending STIG notification:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  /**
   * Extract category from STIG title
   */
  extractCategory(title) {
    const categoryMap = {
      'Windows': 'operating_system',
      'Linux': 'operating_system',
      'Oracle': 'database',
      'SQL Server': 'database',
      'Apache': 'web_server',
      'IIS': 'web_server',
      'Cisco': 'network_device',
      'VMware': 'virtualization',
      'Active Directory': 'directory_service'
    };

    for (const [key, value] of Object.entries(categoryMap)) {
      if (title.includes(key)) {
        return value;
      }
    }

    return 'other';
  }

  /**
   * Extract platforms from benchmark
   */
  extractPlatforms(benchmark) {
    // This would parse the benchmark to determine supported platforms
    // For now, return a default set
    return ['windows', 'linux'];
  }

  /**
   * Extract compliance frameworks from benchmark
   */
  extractComplianceFrameworks(benchmark) {
    // This would parse the benchmark to determine compliance frameworks
    // For now, return a default set
    return ['NIST', 'DISA', 'FISMA'];
  }

  /**
   * Extract implementation guidance from rule
   */
  extractImplementationGuidance(rule) {
    // This would parse the rule to extract implementation guidance
    return rule.description?.[0] || 'No implementation guidance available';
  }

  /**
   * Extract verification text from rule
   */
  extractVerificationText(rule) {
    // This would parse the rule to extract verification text
    return rule.check?.[0]?.['check-content']?.[0] || 'No verification text available';
  }

  /**
   * Extract risk assessment from rule
   */
  extractRiskAssessment(rule) {
    // This would parse the rule to extract risk assessment
    return `Risk assessment for ${rule.title?.[0] || 'rule'}`;
  }

  /**
   * Extract CCI references from rule
   */
  extractCciReferences(rule) {
    // This would parse the rule to extract CCI references
    return rule.ident?.filter(i => i.$.system === 'http://cyber.mil/cci')?.map(i => i._) || [];
  }

  /**
   * Extract NIST references from rule
   */
  extractNistReferences(rule) {
    // This would parse the rule to extract NIST references
    return rule.ident?.filter(i => i.$.system === 'http://csrc.nist.gov/ns/oscal/1.0')?.map(i => i._) || [];
  }

  /**
   * Extract IA controls from rule
   */
  extractIaControls(rule) {
    // This would parse the rule to extract IA controls
    return [];
  }

  /**
   * Determine if automation is supported
   */
  determineAutomationSupport(rule) {
    // This would analyze the rule to determine if automation is supported
    const checkContent = rule.check?.[0]?.['check-content']?.[0] || '';
    return checkContent.includes('registry') || checkContent.includes('command') || checkContent.includes('script');
  }

  /**
   * Determine if manual review is required
   */
  determineManualReview(rule) {
    // This would analyze the rule to determine if manual review is required
    const checkContent = rule.check?.[0]?.['check-content']?.[0] || '';
    return checkContent.includes('review') || checkContent.includes('verify') || checkContent.includes('examine');
  }

  /**
   * Estimate fix time in minutes
   */
  estimateFixTime(rule) {
    // This would analyze the rule to estimate fix time
    const severity = rule.$.severity || 'medium';
    const severityMap = {
      'low': 30,
      'medium': 60,
      'high': 120,
      'critical': 240
    };
    return severityMap[severity] || 60;
  }

  /**
   * Assess business impact
   */
  assessBusinessImpact(rule) {
    // This would analyze the rule to assess business impact
    const severity = rule.$.severity || 'medium';
    const impactMap = {
      'low': 'low',
      'medium': 'medium',
      'high': 'high',
      'critical': 'high'
    };
    return impactMap[severity] || 'medium';
  }

  /**
   * Assess technical complexity
   */
  assessTechnicalComplexity(rule) {
    // This would analyze the rule to assess technical complexity
    const checkContent = rule.check?.[0]?.['check-content']?.[0] || '';
    if (checkContent.includes('registry') || checkContent.includes('GPO')) {
      return 'low';
    } else if (checkContent.includes('script') || checkContent.includes('command')) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  /**
   * Get STIG analytics
   */
  async getStigAnalytics() {
    try {
      // Get overall STIG library statistics
      const [libraryStats] = await db.select({
        total: count(),
        active: count(sql`CASE WHEN ${stigLibrary.status} = 'active' THEN 1 END`),
        deprecated: count(sql`CASE WHEN ${stigLibrary.status} = 'deprecated' THEN 1 END`),
        critical: count(sql`CASE WHEN ${stigLibrary.severity} = 'critical' THEN 1 END`),
        high: count(sql`CASE WHEN ${stigLibrary.severity} = 'high' THEN 1 END`),
        medium: count(sql`CASE WHEN ${stigLibrary.severity} = 'medium' THEN 1 END`),
        low: count(sql`CASE WHEN ${stigLibrary.severity} = 'low' THEN 1 END`)
      }).from(stigLibrary);

      // Get checklist statistics
      const [checklistStats] = await db.select({
        total: count(),
        notStarted: count(sql`CASE WHEN ${stigChecklists.status} = 'not_started' THEN 1 END`),
        inProgress: count(sql`CASE WHEN ${stigChecklists.status} = 'in_progress' THEN 1 END`),
        completed: count(sql`CASE WHEN ${stigChecklists.status} = 'completed' THEN 1 END`),
        reviewed: count(sql`CASE WHEN ${stigChecklists.status} = 'reviewed' THEN 1 END`),
        approved: count(sql`CASE WHEN ${stigChecklists.status} = 'approved' THEN 1 END`)
      }).from(stigChecklists);

      // Get assessment statistics
      const [assessmentStats] = await db.select({
        total: count(),
        pending: count(sql`CASE WHEN ${stigAssessments.status} = 'pending' THEN 1 END`),
        inProgress: count(sql`CASE WHEN ${stigAssessments.status} = 'in_progress' THEN 1 END`),
        completed: count(sql`CASE WHEN ${stigAssessments.status} = 'completed' THEN 1 END`),
        compliant: count(sql`CASE WHEN ${stigAssessments.complianceStatus} = 'compliant' THEN 1 END`),
        nonCompliant: count(sql`CASE WHEN ${stigAssessments.complianceStatus} = 'non_compliant' THEN 1 END`),
        notApplicable: count(sql`CASE WHEN ${stigAssessments.complianceStatus} = 'not_applicable' THEN 1 END`)
      }).from(stigAssessments);

      return {
        library: libraryStats,
        checklists: checklistStats,
        assessments: assessmentStats,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting STIG analytics:', error);
      throw error;
    }
  }
}

module.exports = new StigService();
