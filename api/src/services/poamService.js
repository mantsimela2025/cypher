const { and, eq, sql, desc, asc, or, like, isNull, isNotNull } = require('drizzle-orm');
const { db } = require('../db');
const { 
  poams, 
  poamAssets, 
  poamCves, 
  poamMilestones, 
  vulnerabilityPoams,
  poamApprovalComments,
  poamSignatures,
  vulnerabilities,
  assets,
  systems,
  users
} = require('../db/schema');

class POAMService {
  /**
   * Get all POAMs with optional filtering and pagination
   */
  async getAllPOAMs(filters = {}, options = {}) {
    try {
      const { 
        search = '',
        status = '',
        systemId = '',
        riskRating = '',
        weaknessSeverity = '',
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = { ...filters, ...options };

      let query = db.select({
        id: poams.id,
        poamId: poams.poamId,
        systemId: poams.systemId,
        weaknessDescription: poams.weaknessDescription,
        securityControl: poams.securityControl,
        scheduledCompletion: poams.scheduledCompletion,
        poc: poams.poc,
        status: poams.status,
        riskRating: poams.riskRating,
        weaknessSeverity: poams.weaknessSeverity,
        residualRisk: poams.residualRisk,
        createdAt: poams.createdAt,
        updatedAt: poams.updatedAt,
        // Count related records
        assetCount: sql`COUNT(DISTINCT ${poamAssets.id})`.as('asset_count'),
        cveCount: sql`COUNT(DISTINCT ${poamCves.id})`.as('cve_count'),
        milestoneCount: sql`COUNT(DISTINCT ${poamMilestones.id})`.as('milestone_count'),
        vulnerabilityCount: sql`COUNT(DISTINCT ${vulnerabilityPoams.id})`.as('vulnerability_count'),
        approvalCount: sql`COUNT(DISTINCT ${poamApprovalComments.id})`.as('approval_count'),
        signatureCount: sql`COUNT(DISTINCT ${poamSignatures.id})`.as('signature_count'),
      })
      .from(poams)
      .leftJoin(poamAssets, eq(poamAssets.poamId, poams.poamId))
      .leftJoin(poamCves, eq(poamCves.poamId, poams.poamId))
      .leftJoin(poamMilestones, eq(poamMilestones.poamId, poams.poamId))
      .leftJoin(vulnerabilityPoams, eq(vulnerabilityPoams.poamId, poams.poamId))
      .leftJoin(poamApprovalComments, eq(poamApprovalComments.poamId, poams.id))
      .leftJoin(poamSignatures, eq(poamSignatures.poamId, poams.id))
      .groupBy(
        poams.id,
        poams.poamId,
        poams.systemId,
        poams.weaknessDescription,
        poams.securityControl,
        poams.scheduledCompletion,
        poams.poc,
        poams.status,
        poams.riskRating,
        poams.weaknessSeverity,
        poams.residualRisk,
        poams.createdAt,
        poams.updatedAt
      );

      // Apply filters
      let whereConditions = [];

      if (search) {
        whereConditions.push(sql`(
          ${poams.weaknessDescription} ILIKE ${`%${search}%`} OR
          ${poams.poamId} ILIKE ${`%${search}%`} OR
          ${poams.poc} ILIKE ${`%${search}%`}
        )`);
      }

      if (status) {
        whereConditions.push(eq(poams.status, status));
      }

      if (systemId) {
        whereConditions.push(eq(poams.systemId, systemId));
      }

      if (riskRating) {
        whereConditions.push(eq(poams.riskRating, riskRating));
      }

      if (weaknessSeverity) {
        whereConditions.push(eq(poams.weaknessSeverity, weaknessSeverity));
      }

      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }

      // Apply sorting
      const orderBy = sortOrder === 'desc' ? desc : asc;
      const sortField = poams[sortBy] || poams.createdAt;
      query = query.orderBy(orderBy(sortField));

      // Apply pagination
      query = query.limit(limit).offset(offset);

      const records = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: sql`COUNT(DISTINCT ${poams.id})` }).from(poams);
      if (whereConditions.length > 0) {
        countQuery = countQuery.where(and(...whereConditions));
      }
      const [{ count }] = await countQuery;

      return {
        data: records,
        total: Number(count),
        pagination: {
          limit,
          offset,
          total: Number(count),
          totalPages: Math.ceil(Number(count) / limit)
        }
      };
    } catch (error) {
      console.error('Error in getAllPOAMs:', error);
      throw error;
    }
  }

  /**
   * Get POAM by ID with all related data
   */
  async getPOAMById(id) {
    try {
      const [poam] = await db.select()
        .from(poams)
        .where(eq(poams.id, id));

      if (!poam) {
        return null;
      }

      // Get related data
      const [assets, cves, milestones, vulnerabilities, approvals, signatures] = await Promise.all([
        this.getPOAMAssets(poam.poamId),
        this.getPOAMCVEs(poam.poamId),
        this.getPOAMMilestones(poam.poamId),
        this.getPOAMVulnerabilities(poam.poamId),
        this.getPOAMApprovalComments(id),
        this.getPOAMSignatures(id)
      ]);

      return {
        ...poam,
        assets,
        cves,
        milestones,
        vulnerabilities,
        approvals,
        signatures
      };
    } catch (error) {
      console.error('Error in getPOAMById:', error);
      throw error;
    }
  }

  /**
   * Create new POAM
   */
  async createPOAM(data) {
    try {
      const [inserted] = await db.insert(poams)
        .values({
          ...data,
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`
        })
        .returning();
      
      return inserted;
    } catch (error) {
      console.error('Error in createPOAM:', error);
      throw error;
    }
  }

  /**
   * Update POAM
   */
  async updatePOAM(id, data) {
    try {
      const [updated] = await db.update(poams)
        .set({
          ...data,
          updatedAt: sql`NOW()`
        })
        .where(eq(poams.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error in updatePOAM:', error);
      throw error;
    }
  }

  /**
   * Delete POAM (cascade deletes handled by DB constraints)
   */
  async deletePOAM(id) {
    try {
      const result = await db.delete(poams)
        .where(eq(poams.id, id));
      
      return result;
    } catch (error) {
      console.error('Error in deletePOAM:', error);
      throw error;
    }
  }

  /**
   * Get POAM assets
   */
  async getPOAMAssets(poamId) {
    try {
      return await db.select({
        id: poamAssets.id,
        assetUuid: poamAssets.assetUuid,
        hostname: assets.hostname,
        systemId: assets.systemId,
        createdAt: poamAssets.createdAt,
      })
      .from(poamAssets)
      .leftJoin(assets, eq(poamAssets.assetUuid, assets.assetUuid))
      .where(eq(poamAssets.poamId, poamId));
    } catch (error) {
      console.error('Error in getPOAMAssets:', error);
      throw error;
    }
  }

  /**
   * Add asset to POAM
   */
  async addAssetToPOAM(poamId, assetUuid) {
    try {
      // Check if already exists
      const existing = await db.select()
        .from(poamAssets)
        .where(and(eq(poamAssets.poamId, poamId), eq(poamAssets.assetUuid, assetUuid)));

      if (existing.length > 0) {
        return existing[0];
      }

      const [inserted] = await db.insert(poamAssets)
        .values({ poamId, assetUuid })
        .returning();
      
      return inserted;
    } catch (error) {
      console.error('Error in addAssetToPOAM:', error);
      throw error;
    }
  }

  /**
   * Remove asset from POAM
   */
  async removeAssetFromPOAM(poamId, assetUuid) {
    try {
      return await db.delete(poamAssets)
        .where(and(eq(poamAssets.poamId, poamId), eq(poamAssets.assetUuid, assetUuid)));
    } catch (error) {
      console.error('Error in removeAssetFromPOAM:', error);
      throw error;
    }
  }

  /**
   * Get POAM CVEs
   */
  async getPOAMCVEs(poamId) {
    try {
      return await db.select()
        .from(poamCves)
        .where(eq(poamCves.poamId, poamId));
    } catch (error) {
      console.error('Error in getPOAMCVEs:', error);
      throw error;
    }
  }

  /**
   * Add CVE to POAM
   */
  async addCVEToPOAM(poamId, cveId) {
    try {
      // Check if already exists
      const existing = await db.select()
        .from(poamCves)
        .where(and(eq(poamCves.poamId, poamId), eq(poamCves.cveId, cveId)));

      if (existing.length > 0) {
        return existing[0];
      }

      const [inserted] = await db.insert(poamCves)
        .values({ poamId, cveId })
        .returning();
      
      return inserted;
    } catch (error) {
      console.error('Error in addCVEToPOAM:', error);
      throw error;
    }
  }

  /**
   * Remove CVE from POAM
   */
  async removeCVEFromPOAM(poamId, cveId) {
    try {
      return await db.delete(poamCves)
        .where(and(eq(poamCves.poamId, poamId), eq(poamCves.cveId, cveId)));
    } catch (error) {
      console.error('Error in removeCVEFromPOAM:', error);
      throw error;
    }
  }

  /**
   * Get POAM milestones
   */
  async getPOAMMilestones(poamId) {
    try {
      return await db.select()
        .from(poamMilestones)
        .where(eq(poamMilestones.poamId, poamId))
        .orderBy(asc(poamMilestones.milestoneOrder));
    } catch (error) {
      console.error('Error in getPOAMMilestones:', error);
      throw error;
    }
  }

  /**
   * Create POAM milestone
   */
  async createPOAMMilestone(data) {
    try {
      const [inserted] = await db.insert(poamMilestones)
        .values(data)
        .returning();
      
      return inserted;
    } catch (error) {
      console.error('Error in createPOAMMilestone:', error);
      throw error;
    }
  }

  /**
   * Update POAM milestone
   */
  async updatePOAMMilestone(id, data) {
    try {
      const [updated] = await db.update(poamMilestones)
        .set(data)
        .where(eq(poamMilestones.id, id))
        .returning();
      
      return updated;
    } catch (error) {
      console.error('Error in updatePOAMMilestone:', error);
      throw error;
    }
  }

  /**
   * Delete POAM milestone
   */
  async deletePOAMMilestone(id) {
    try {
      return await db.delete(poamMilestones)
        .where(eq(poamMilestones.id, id));
    } catch (error) {
      console.error('Error in deletePOAMMilestone:', error);
      throw error;
    }
  }

  /**
   * Get POAM vulnerabilities
   */
  async getPOAMVulnerabilities(poamId) {
    try {
      return await db.select({
        id: vulnerabilityPoams.id,
        vulnerabilityId: vulnerabilityPoams.vulnerabilityId,
        relationshipType: vulnerabilityPoams.relationshipType,
        pluginName: vulnerabilities.pluginName,
        severity: vulnerabilities.severity,
        severityName: vulnerabilities.severityName,
        cvssBaseScore: vulnerabilities.cvssBaseScore,
        createdAt: vulnerabilityPoams.createdAt,
      })
      .from(vulnerabilityPoams)
      .leftJoin(vulnerabilities, eq(vulnerabilityPoams.vulnerabilityId, vulnerabilities.id))
      .where(eq(vulnerabilityPoams.poamId, poamId));
    } catch (error) {
      console.error('Error in getPOAMVulnerabilities:', error);
      throw error;
    }
  }

  /**
   * Link vulnerability to POAM
   */
  async linkVulnerabilityToPOAM(vulnerabilityId, poamId, relationshipType = 'addresses') {
    try {
      // Check if already exists
      const existing = await db.select()
        .from(vulnerabilityPoams)
        .where(and(
          eq(vulnerabilityPoams.vulnerabilityId, vulnerabilityId), 
          eq(vulnerabilityPoams.poamId, poamId)
        ));

      if (existing.length > 0) {
        return existing[0];
      }

      const [inserted] = await db.insert(vulnerabilityPoams)
        .values({ vulnerabilityId, poamId, relationshipType })
        .returning();
      
      return inserted;
    } catch (error) {
      console.error('Error in linkVulnerabilityToPOAM:', error);
      throw error;
    }
  }

  /**
   * Unlink vulnerability from POAM
   */
  async unlinkVulnerabilityFromPOAM(vulnerabilityId, poamId) {
    try {
      return await db.delete(vulnerabilityPoams)
        .where(and(
          eq(vulnerabilityPoams.vulnerabilityId, vulnerabilityId), 
          eq(vulnerabilityPoams.poamId, poamId)
        ));
    } catch (error) {
      console.error('Error in unlinkVulnerabilityFromPOAM:', error);
      throw error;
    }
  }

  /**
   * Get POAM approval comments
   */
  async getPOAMApprovalComments(poamId) {
    try {
      return await db.select({
        id: poamApprovalComments.id,
        poamId: poamApprovalComments.poamId,
        userId: poamApprovalComments.userId,
        comment: poamApprovalComments.comment,
        approvalStep: poamApprovalComments.approvalStep,
        isInternal: poamApprovalComments.isInternal,
        createdAt: poamApprovalComments.createdAt,
        updatedAt: poamApprovalComments.updatedAt,
        // User info
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(poamApprovalComments)
      .leftJoin(users, eq(poamApprovalComments.userId, users.id))
      .where(eq(poamApprovalComments.poamId, poamId))
      .orderBy(desc(poamApprovalComments.createdAt));
    } catch (error) {
      console.error('Error in getPOAMApprovalComments:', error);
      throw error;
    }
  }

  /**
   * Add POAM approval comment
   */
  async addPOAMApprovalComment(data) {
    try {
      const [inserted] = await db.insert(poamApprovalComments)
        .values({
          ...data,
          createdAt: sql`NOW()`,
          updatedAt: sql`NOW()`
        })
        .returning();
      
      return inserted;
    } catch (error) {
      console.error('Error in addPOAMApprovalComment:', error);
      throw error;
    }
  }

  /**
   * Get POAM signatures
   */
  async getPOAMSignatures(poamId) {
    try {
      return await db.select({
        id: poamSignatures.id,
        poamId: poamSignatures.poamId,
        userId: poamSignatures.userId,
        role: poamSignatures.role,
        signatureDate: poamSignatures.signatureDate,
        verificationCode: poamSignatures.verificationCode,
        ipAddress: poamSignatures.ipAddress,
        userAgent: poamSignatures.userAgent,
        additionalNotes: poamSignatures.additionalNotes,
        // User info
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(poamSignatures)
      .leftJoin(users, eq(poamSignatures.userId, users.id))
      .where(eq(poamSignatures.poamId, poamId))
      .orderBy(desc(poamSignatures.signatureDate));
    } catch (error) {
      console.error('Error in getPOAMSignatures:', error);
      throw error;
    }
  }

  /**
   * Add POAM signature
   */
  async addPOAMSignature(data) {
    try {
      const [inserted] = await db.insert(poamSignatures)
        .values({
          ...data,
          signatureDate: sql`NOW()`,
          verificationCode: this.generateVerificationCode()
        })
        .returning();
      
      return inserted;
    } catch (error) {
      console.error('Error in addPOAMSignature:', error);
      throw error;
    }
  }

  /**
   * Auto-generate POAM from vulnerability
   */
  async generatePOAMFromVulnerability(vulnerabilityId, userId) {
    try {
      // Get vulnerability details
      const [vulnerability] = await db.select()
        .from(vulnerabilities)
        .where(eq(vulnerabilities.id, vulnerabilityId));

      if (!vulnerability) {
        throw new Error('Vulnerability not found');
      }

      // Get asset details
      const [asset] = await db.select()
        .from(assets)
        .where(eq(assets.assetUuid, vulnerability.assetUuid));

      // Generate POAM ID
      const poamId = await this.generatePOAMId();

      // Create POAM with auto-populated fields
      const poamData = {
        poamId,
        systemId: asset?.systemId,
        weaknessDescription: `Vulnerability: ${vulnerability.pluginName}\n\nDescription: ${vulnerability.description}`,
        securityControl: this.mapSeverityToSecurityControl(vulnerability.severityName),
        status: 'Open',
        riskRating: this.mapSeverityToRiskRating(vulnerability.severityName),
        originalDetectionDate: vulnerability.firstFound,
        weaknessSeverity: vulnerability.severityName,
        threatRelevance: 'Relevant',
        likelihood: this.mapSeverityToLikelihood(vulnerability.severityName),
        impact: this.mapSeverityToImpact(vulnerability.severityName),
        mitigationStrategy: vulnerability.solution || 'To be determined',
        source: 'auto-generated'
      };

      // Create POAM
      const poam = await this.createPOAM(poamData);

      // Link vulnerability to POAM
      await this.linkVulnerabilityToPOAM(vulnerabilityId, poam.poamId);

      // Add asset to POAM if available
      if (asset) {
        await this.addAssetToPOAM(poam.poamId, asset.assetUuid);
      }

      // Create default milestone
      await this.createPOAMMilestone({
        poamId: poam.poamId,
        milestoneOrder: 1,
        description: 'Remediate vulnerability',
        status: 'Not Started'
      });

      // Add initial comment
      await this.addPOAMApprovalComment({
        poamId: poam.id,
        userId,
        comment: 'POAM auto-generated from vulnerability scan results',
        approvalStep: 'Creation',
        isInternal: true
      });

      return await this.getPOAMById(poam.id);
    } catch (error) {
      console.error('Error in generatePOAMFromVulnerability:', error);
      throw error;
    }
  }

  /**
   * Get POAM statistics
   */
  async getPOAMStatistics() {
    try {
      const [totalPoams] = await db.select({ count: sql`COUNT(*)` }).from(poams);
      
      const statusCounts = await db.select({
        status: poams.status,
        count: sql`COUNT(*)`
      })
      .from(poams)
      .groupBy(poams.status);

      const riskRatingCounts = await db.select({
        riskRating: poams.riskRating,
        count: sql`COUNT(*)`
      })
      .from(poams)
      .groupBy(poams.riskRating);

      const overduePOAMs = await db.select({ count: sql`COUNT(*)` })
        .from(poams)
        .where(and(
          sql`${poams.scheduledCompletion} < NOW()`,
          or(eq(poams.status, 'Open'), eq(poams.status, 'In Progress'))
        ));

      return {
        total: Number(totalPoams.count),
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status || 'Unknown'] = Number(item.count);
          return acc;
        }, {}),
        byRiskRating: riskRatingCounts.reduce((acc, item) => {
          acc[item.riskRating || 'Unknown'] = Number(item.count);
          return acc;
        }, {}),
        overdue: Number(overduePOAMs[0]?.count || 0)
      };
    } catch (error) {
      console.error('Error in getPOAMStatistics:', error);
      throw error;
    }
  }

  // Helper methods
  generatePOAMId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `POAM-${timestamp}-${random}`;
  }

  generateVerificationCode() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  mapSeverityToSecurityControl(severity) {
    const mapping = {
      'Critical': 'AC-1',
      'High': 'AC-2',
      'Medium': 'AC-3',
      'Low': 'AC-4',
      'Informational': 'AC-5'
    };
    return mapping[severity] || 'TBD';
  }

  mapSeverityToRiskRating(severity) {
    const mapping = {
      'Critical': 'Very High',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low',
      'Informational': 'Very Low'
    };
    return mapping[severity] || 'Medium';
  }

  mapSeverityToLikelihood(severity) {
    const mapping = {
      'Critical': 'High',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low',
      'Informational': 'Low'
    };
    return mapping[severity] || 'Medium';
  }

  mapSeverityToImpact(severity) {
    const mapping = {
      'Critical': 'High',
      'High': 'High',
      'Medium': 'Medium',
      'Low': 'Low',
      'Informational': 'Low'
    };
    return mapping[severity] || 'Medium';
  }
}

module.exports = new POAMService();