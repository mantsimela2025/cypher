const { db } = require('../db');
const { 
  authorizationsToOperate, 
  atoWorkflowHistory, 
  atoDocuments,
  users
} = require('../db/schema');
const { eq, and, gte, lte, desc, asc, sql, or, like, ilike, count, sum, isNull, isNotNull } = require('drizzle-orm');

class ATOService {

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create new Authorization to Operate
   */
  async createATO(atoData, userId) {
    try {
      console.log('📝 Creating new ATO:', atoData);

      // Check if there's already an active ATO for this SSP
      const existingActiveATO = await db.select()
        .from(authorizationsToOperate)
        .where(and(
          eq(authorizationsToOperate.sspId, atoData.sspId),
          or(
            eq(authorizationsToOperate.status, 'approved'),
            eq(authorizationsToOperate.status, 'under_review'),
            eq(authorizationsToOperate.status, 'pending_approval')
          )
        ))
        .limit(1);

      if (existingActiveATO.length > 0) {
        throw new Error('An active ATO already exists for this System Security Plan');
      }

      // Create the ATO record
      const [newATO] = await db.insert(authorizationsToOperate)
        .values({
          ...atoData,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create initial workflow history entry
      await this._createWorkflowEntry(newATO.id, 'create', 'draft', 'ATO created', userId, 'system_owner', 'initial_submission');

      return newATO;
    } catch (error) {
      console.error('Error creating ATO:', error);
      throw error;
    }
  }

  /**
   * Get ATO by ID with related data
   */
  async getATOById(atoId, includeHistory = false, includeDocuments = false) {
    try {
      // Get the main ATO record
      const [ato] = await db.select({
        id: authorizationsToOperate.id,
        sspId: authorizationsToOperate.sspId,
        type: authorizationsToOperate.type,
        status: authorizationsToOperate.status,
        submissionDate: authorizationsToOperate.submissionDate,
        approvalDate: authorizationsToOperate.approvalDate,
        expirationDate: authorizationsToOperate.expirationDate,
        authorizedBy: authorizationsToOperate.authorizedBy,
        authorizationMemo: authorizationsToOperate.authorizationMemo,
        authorizationConditions: authorizationsToOperate.authorizationConditions,
        riskLevel: authorizationsToOperate.riskLevel,
        continuousMonitoringPlan: authorizationsToOperate.continuousMonitoringPlan,
        createdAt: authorizationsToOperate.createdAt,
        updatedAt: authorizationsToOperate.updatedAt,
        authorizedByName: users.firstName,
        authorizedByLastName: users.lastName,
        authorizedByEmail: users.email
      })
      .from(authorizationsToOperate)
      .leftJoin(users, eq(authorizationsToOperate.authorizedBy, users.id))
      .where(eq(authorizationsToOperate.id, atoId))
      .limit(1);

      if (!ato) {
        throw new Error('ATO not found');
      }

      const result = { ...ato };

      // Include workflow history if requested
      if (includeHistory) {
        result.workflowHistory = await this.getATOWorkflowHistory(atoId);
      }

      // Include documents if requested
      if (includeDocuments) {
        result.documents = await this.getATODocuments(atoId);
      }

      return result;
    } catch (error) {
      console.error('Error getting ATO by ID:', error);
      throw error;
    }
  }

  /**
   * Update ATO
   */
  async updateATO(atoId, updateData, userId) {
    try {
      console.log('📝 Updating ATO:', atoId, updateData);

      // Get current ATO to check status
      const [currentATO] = await db.select()
        .from(authorizationsToOperate)
        .where(eq(authorizationsToOperate.id, atoId))
        .limit(1);

      if (!currentATO) {
        throw new Error('ATO not found');
      }

      // Check if ATO can be updated (only draft and under_review can be updated)
      if (!['draft', 'under_review'].includes(currentATO.status)) {
        throw new Error('ATO cannot be updated in current status');
      }

      // Update the ATO
      const [updatedATO] = await db.update(authorizationsToOperate)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(authorizationsToOperate.id, atoId))
        .returning();

      // Create workflow history entry
      await this._createWorkflowEntry(
        atoId, 
        'update', 
        updatedATO.status, 
        'ATO updated', 
        userId, 
        'system_owner', 
        'initial_submission'
      );

      return updatedATO;
    } catch (error) {
      console.error('Error updating ATO:', error);
      throw error;
    }
  }

  /**
   * Delete ATO (soft delete by changing status)
   */
  async deleteATO(atoId, userId, reason = 'ATO deleted') {
    try {
      console.log('🗑️ Deleting ATO:', atoId);

      // Get current ATO
      const [currentATO] = await db.select()
        .from(authorizationsToOperate)
        .where(eq(authorizationsToOperate.id, atoId))
        .limit(1);

      if (!currentATO) {
        throw new Error('ATO not found');
      }

      // Only allow deletion of draft ATOs
      if (currentATO.status !== 'draft') {
        throw new Error('Only draft ATOs can be deleted');
      }

      // Update status to indicate deletion
      const [deletedATO] = await db.update(authorizationsToOperate)
        .set({
          status: 'revoked',
          updatedAt: new Date()
        })
        .where(eq(authorizationsToOperate.id, atoId))
        .returning();

      // Create workflow history entry
      await this._createWorkflowEntry(
        atoId, 
        'delete', 
        'revoked', 
        reason, 
        userId, 
        'system_owner', 
        'initial_submission'
      );

      return deletedATO;
    } catch (error) {
      console.error('Error deleting ATO:', error);
      throw error;
    }
  }

  /**
   * Get all ATOs with filtering and pagination
   */
  async getAllATOs(filters = {}, pagination = {}) {
    try {
      const { 
        status, 
        type, 
        sspId, 
        riskLevel, 
        expiringWithinDays,
        authorizedBy,
        search 
      } = filters;
      
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = pagination;

      let query = db.select({
        id: authorizationsToOperate.id,
        sspId: authorizationsToOperate.sspId,
        type: authorizationsToOperate.type,
        status: authorizationsToOperate.status,
        submissionDate: authorizationsToOperate.submissionDate,
        approvalDate: authorizationsToOperate.approvalDate,
        expirationDate: authorizationsToOperate.expirationDate,
        authorizedBy: authorizationsToOperate.authorizedBy,
        riskLevel: authorizationsToOperate.riskLevel,
        createdAt: authorizationsToOperate.createdAt,
        updatedAt: authorizationsToOperate.updatedAt,
        authorizedByName: users.firstName,
        authorizedByLastName: users.lastName
      })
      .from(authorizationsToOperate)
      .leftJoin(users, eq(authorizationsToOperate.authorizedBy, users.id));

      // Apply filters
      const conditions = [];

      if (status) {
        conditions.push(eq(authorizationsToOperate.status, status));
      }

      if (type) {
        conditions.push(eq(authorizationsToOperate.type, type));
      }

      if (sspId) {
        conditions.push(eq(authorizationsToOperate.sspId, sspId));
      }

      if (riskLevel) {
        conditions.push(eq(authorizationsToOperate.riskLevel, riskLevel));
      }

      if (authorizedBy) {
        conditions.push(eq(authorizationsToOperate.authorizedBy, authorizedBy));
      }

      if (expiringWithinDays) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(expiringWithinDays));
        conditions.push(
          and(
            isNotNull(authorizationsToOperate.expirationDate),
            lte(authorizationsToOperate.expirationDate, futureDate),
            gte(authorizationsToOperate.expirationDate, new Date())
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = authorizationsToOperate[sortBy] || authorizationsToOperate.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const atos = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(authorizationsToOperate);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: atos,
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
      console.error('Error getting all ATOs:', error);
      throw error;
    }
  }

  // ==================== WORKFLOW MANAGEMENT ====================

  /**
   * Submit ATO for review
   */
  async submitATO(atoId, userId, comments = '') {
    try {
      console.log('📤 Submitting ATO for review:', atoId);

      // Get current ATO
      const [currentATO] = await db.select()
        .from(authorizationsToOperate)
        .where(eq(authorizationsToOperate.id, atoId))
        .limit(1);

      if (!currentATO) {
        throw new Error('ATO not found');
      }

      if (currentATO.status !== 'draft') {
        throw new Error('Only draft ATOs can be submitted');
      }

      // Update ATO status
      const [updatedATO] = await db.update(authorizationsToOperate)
        .set({
          status: 'submitted',
          submissionDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(authorizationsToOperate.id, atoId))
        .returning();

      // Create workflow history entry
      await this._createWorkflowEntry(
        atoId, 
        'submit', 
        'submitted', 
        comments || 'ATO submitted for review', 
        userId, 
        'system_owner', 
        'security_review'
      );

      return updatedATO;
    } catch (error) {
      console.error('Error submitting ATO:', error);
      throw error;
    }
  }

  /**
   * Review ATO (approve or reject)
   */
  async reviewATO(atoId, action, userId, comments = '', approvalRole = 'reviewer', signature = null) {
    try {
      console.log('👀 Reviewing ATO:', atoId, action);

      if (!['approve', 'reject', 'request_changes'].includes(action)) {
        throw new Error('Invalid review action');
      }

      // Get current ATO
      const [currentATO] = await db.select()
        .from(authorizationsToOperate)
        .where(eq(authorizationsToOperate.id, atoId))
        .limit(1);

      if (!currentATO) {
        throw new Error('ATO not found');
      }

      if (!['submitted', 'under_review', 'pending_approval'].includes(currentATO.status)) {
        throw new Error('ATO is not in a reviewable status');
      }

      let newStatus;
      let workflowStage;

      switch (action) {
        case 'approve':
          if (approvalRole === 'authorizing_official') {
            newStatus = 'approved';
            workflowStage = 'final_approval';
          } else {
            newStatus = 'pending_approval';
            workflowStage = 'management_review';
          }
          break;
        case 'reject':
          newStatus = 'rejected';
          workflowStage = 'initial_submission';
          break;
        case 'request_changes':
          newStatus = 'under_review';
          workflowStage = 'technical_review';
          break;
      }

      // Update ATO status
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      // If final approval, set approval date and authorized by
      if (newStatus === 'approved') {
        updateData.approvalDate = new Date();
        updateData.authorizedBy = userId;
        
        // Set expiration date (default 3 years for full ATO)
        const expirationDate = new Date();
        if (currentATO.type === 'full') {
          expirationDate.setFullYear(expirationDate.getFullYear() + 3);
        } else if (currentATO.type === 'interim') {
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        } else {
          expirationDate.setMonth(expirationDate.getMonth() + 6);
        }
        updateData.expirationDate = expirationDate;
      }

      const [updatedATO] = await db.update(authorizationsToOperate)
        .set(updateData)
        .where(eq(authorizationsToOperate.id, atoId))
        .returning();

      // Create workflow history entry
      await this._createWorkflowEntry(
        atoId, 
        action, 
        newStatus, 
        comments, 
        userId, 
        approvalRole, 
        workflowStage,
        signature
      );

      return updatedATO;
    } catch (error) {
      console.error('Error reviewing ATO:', error);
      throw error;
    }
  }

  /**
   * Revoke ATO
   */
  async revokeATO(atoId, userId, reason, approvalRole = 'authorizing_official') {
    try {
      console.log('🚫 Revoking ATO:', atoId);

      // Get current ATO
      const [currentATO] = await db.select()
        .from(authorizationsToOperate)
        .where(eq(authorizationsToOperate.id, atoId))
        .limit(1);

      if (!currentATO) {
        throw new Error('ATO not found');
      }

      if (currentATO.status !== 'approved') {
        throw new Error('Only approved ATOs can be revoked');
      }

      // Update ATO status
      const [updatedATO] = await db.update(authorizationsToOperate)
        .set({
          status: 'revoked',
          updatedAt: new Date()
        })
        .where(eq(authorizationsToOperate.id, atoId))
        .returning();

      // Create workflow history entry
      await this._createWorkflowEntry(
        atoId, 
        'revoke', 
        'revoked', 
        reason, 
        userId, 
        approvalRole, 
        'continuous_monitoring'
      );

      return updatedATO;
    } catch (error) {
      console.error('Error revoking ATO:', error);
      throw error;
    }
  }

  // ==================== WORKFLOW HISTORY ====================

  /**
   * Get ATO workflow history
   */
  async getATOWorkflowHistory(atoId) {
    try {
      const history = await db.select({
        id: atoWorkflowHistory.id,
        action: atoWorkflowHistory.action,
        status: atoWorkflowHistory.status,
        comments: atoWorkflowHistory.comments,
        performedBy: atoWorkflowHistory.performedBy,
        performedAt: atoWorkflowHistory.performedAt,
        approvalRole: atoWorkflowHistory.approvalRole,
        workflowStage: atoWorkflowHistory.workflowStage,
        signature: atoWorkflowHistory.signature,
        performedByName: users.firstName,
        performedByLastName: users.lastName,
        performedByEmail: users.email
      })
      .from(atoWorkflowHistory)
      .leftJoin(users, eq(atoWorkflowHistory.performedBy, users.id))
      .where(eq(atoWorkflowHistory.atoId, atoId))
      .orderBy(desc(atoWorkflowHistory.performedAt));

      return history;
    } catch (error) {
      console.error('Error getting ATO workflow history:', error);
      throw error;
    }
  }

  /**
   * Create workflow history entry (internal method)
   */
  async _createWorkflowEntry(atoId, action, status, comments, performedBy, approvalRole, workflowStage, signature = null) {
    try {
      const [entry] = await db.insert(atoWorkflowHistory)
        .values({
          atoId,
          action,
          status,
          comments,
          performedBy,
          approvalRole,
          workflowStage,
          signature,
          performedAt: new Date()
        })
        .returning();

      return entry;
    } catch (error) {
      console.error('Error creating workflow entry:', error);
      throw error;
    }
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  /**
   * Upload ATO document
   */
  async uploadATODocument(atoId, documentData, userId) {
    try {
      console.log('📎 Uploading ATO document:', atoId, documentData);

      // Verify ATO exists
      const [ato] = await db.select()
        .from(authorizationsToOperate)
        .where(eq(authorizationsToOperate.id, atoId))
        .limit(1);

      if (!ato) {
        throw new Error('ATO not found');
      }

      // Create document record
      const [document] = await db.insert(atoDocuments)
        .values({
          atoId,
          documentType: documentData.documentType,
          fileName: documentData.fileName,
          fileLocation: documentData.fileLocation,
          uploadedBy: userId,
          uploadedAt: new Date()
        })
        .returning();

      // Create workflow history entry
      await this._createWorkflowEntry(
        atoId,
        'upload_document',
        ato.status,
        `Document uploaded: ${documentData.fileName}`,
        userId,
        'system_owner',
        'initial_submission'
      );

      return document;
    } catch (error) {
      console.error('Error uploading ATO document:', error);
      throw error;
    }
  }

  /**
   * Get ATO documents
   */
  async getATODocuments(atoId) {
    try {
      const documents = await db.select({
        id: atoDocuments.id,
        documentType: atoDocuments.documentType,
        fileName: atoDocuments.fileName,
        fileLocation: atoDocuments.fileLocation,
        uploadedBy: atoDocuments.uploadedBy,
        uploadedAt: atoDocuments.uploadedAt,
        uploadedByName: users.firstName,
        uploadedByLastName: users.lastName,
        uploadedByEmail: users.email
      })
      .from(atoDocuments)
      .leftJoin(users, eq(atoDocuments.uploadedBy, users.id))
      .where(eq(atoDocuments.atoId, atoId))
      .orderBy(desc(atoDocuments.uploadedAt));

      return documents;
    } catch (error) {
      console.error('Error getting ATO documents:', error);
      throw error;
    }
  }

  /**
   * Delete ATO document
   */
  async deleteATODocument(documentId, userId) {
    try {
      console.log('🗑️ Deleting ATO document:', documentId);

      // Get document info
      const [document] = await db.select()
        .from(atoDocuments)
        .where(eq(atoDocuments.id, documentId))
        .limit(1);

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete document record
      await db.delete(atoDocuments)
        .where(eq(atoDocuments.id, documentId));

      // Create workflow history entry
      await this._createWorkflowEntry(
        document.atoId,
        'delete_document',
        'draft', // Assume draft status for document deletion
        `Document deleted: ${document.fileName}`,
        userId,
        'system_owner',
        'initial_submission'
      );

      return { success: true, deletedDocument: document };
    } catch (error) {
      console.error('Error deleting ATO document:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get ATO dashboard statistics
   */
  async getATODashboardStats() {
    try {
      // Get status distribution
      const statusStats = await db.select({
        status: authorizationsToOperate.status,
        count: count()
      })
      .from(authorizationsToOperate)
      .groupBy(authorizationsToOperate.status);

      // Get type distribution
      const typeStats = await db.select({
        type: authorizationsToOperate.type,
        count: count()
      })
      .from(authorizationsToOperate)
      .groupBy(authorizationsToOperate.type);

      // Get expiring ATOs (within 90 days)
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 90);

      const expiringATOs = await db.select({
        count: count()
      })
      .from(authorizationsToOperate)
      .where(and(
        eq(authorizationsToOperate.status, 'approved'),
        isNotNull(authorizationsToOperate.expirationDate),
        lte(authorizationsToOperate.expirationDate, expiringDate),
        gte(authorizationsToOperate.expirationDate, new Date())
      ));

      // Get expired ATOs
      const expiredATOs = await db.select({
        count: count()
      })
      .from(authorizationsToOperate)
      .where(and(
        eq(authorizationsToOperate.status, 'approved'),
        isNotNull(authorizationsToOperate.expirationDate),
        lte(authorizationsToOperate.expirationDate, new Date())
      ));

      // Get recent activity (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentActivity = await db.select({
        count: count()
      })
      .from(atoWorkflowHistory)
      .where(gte(atoWorkflowHistory.performedAt, thirtyDaysAgo));

      return {
        statusDistribution: statusStats,
        typeDistribution: typeStats,
        expiringCount: expiringATOs[0]?.count || 0,
        expiredCount: expiredATOs[0]?.count || 0,
        recentActivityCount: recentActivity[0]?.count || 0,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting ATO dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get expiring ATOs
   */
  async getExpiringATOs(daysAhead = 90) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const expiringATOs = await db.select({
        id: authorizationsToOperate.id,
        sspId: authorizationsToOperate.sspId,
        type: authorizationsToOperate.type,
        status: authorizationsToOperate.status,
        expirationDate: authorizationsToOperate.expirationDate,
        authorizedBy: authorizationsToOperate.authorizedBy,
        riskLevel: authorizationsToOperate.riskLevel,
        authorizedByName: users.firstName,
        authorizedByLastName: users.lastName
      })
      .from(authorizationsToOperate)
      .leftJoin(users, eq(authorizationsToOperate.authorizedBy, users.id))
      .where(and(
        eq(authorizationsToOperate.status, 'approved'),
        isNotNull(authorizationsToOperate.expirationDate),
        lte(authorizationsToOperate.expirationDate, futureDate),
        gte(authorizationsToOperate.expirationDate, new Date())
      ))
      .orderBy(asc(authorizationsToOperate.expirationDate));

      return expiringATOs;
    } catch (error) {
      console.error('Error getting expiring ATOs:', error);
      throw error;
    }
  }

  /**
   * Get ATO workflow performance metrics
   */
  async getWorkflowMetrics(timeRange = '30d') {
    try {
      const dateFilter = this._getDateFilter(timeRange);

      // Average time from submission to approval
      const approvalTimes = await db.execute(sql`
        SELECT
          AVG(EXTRACT(EPOCH FROM (approval_date - submission_date))/86400) as avg_approval_days,
          COUNT(*) as approved_count
        FROM authorizations_to_operate
        WHERE status = 'approved'
        AND submission_date >= ${dateFilter}
        AND approval_date IS NOT NULL
      `);

      // Workflow stage distribution
      const stageDistribution = await db.select({
        workflowStage: atoWorkflowHistory.workflowStage,
        count: count()
      })
      .from(atoWorkflowHistory)
      .where(gte(atoWorkflowHistory.performedAt, dateFilter))
      .groupBy(atoWorkflowHistory.workflowStage);

      // Approval role activity
      const roleActivity = await db.select({
        approvalRole: atoWorkflowHistory.approvalRole,
        count: count()
      })
      .from(atoWorkflowHistory)
      .where(and(
        gte(atoWorkflowHistory.performedAt, dateFilter),
        isNotNull(atoWorkflowHistory.approvalRole)
      ))
      .groupBy(atoWorkflowHistory.approvalRole);

      return {
        averageApprovalDays: approvalTimes.rows[0]?.avg_approval_days || 0,
        approvedCount: approvalTimes.rows[0]?.approved_count || 0,
        stageDistribution,
        roleActivity,
        timeRange,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting workflow metrics:', error);
      throw error;
    }
  }

  /**
   * Search ATOs
   */
  async searchATOs(searchTerm, filters = {}) {
    try {
      const { status, type, riskLevel } = filters;

      let query = db.select({
        id: authorizationsToOperate.id,
        sspId: authorizationsToOperate.sspId,
        type: authorizationsToOperate.type,
        status: authorizationsToOperate.status,
        riskLevel: authorizationsToOperate.riskLevel,
        authorizationMemo: authorizationsToOperate.authorizationMemo,
        createdAt: authorizationsToOperate.createdAt,
        authorizedByName: users.firstName,
        authorizedByLastName: users.lastName
      })
      .from(authorizationsToOperate)
      .leftJoin(users, eq(authorizationsToOperate.authorizedBy, users.id));

      const conditions = [];

      // Search in memo and conditions
      if (searchTerm) {
        conditions.push(
          or(
            ilike(authorizationsToOperate.authorizationMemo, `%${searchTerm}%`),
            ilike(authorizationsToOperate.authorizationConditions, `%${searchTerm}%`)
          )
        );
      }

      // Apply filters
      if (status) conditions.push(eq(authorizationsToOperate.status, status));
      if (type) conditions.push(eq(authorizationsToOperate.type, type));
      if (riskLevel) conditions.push(eq(authorizationsToOperate.riskLevel, riskLevel));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query.orderBy(desc(authorizationsToOperate.createdAt)).limit(50);

      return results;
    } catch (error) {
      console.error('Error searching ATOs:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  _getDateFilter(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}

module.exports = new ATOService();
