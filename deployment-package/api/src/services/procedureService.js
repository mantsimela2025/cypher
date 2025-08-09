const { db } = require('../db');
const { procedures, policies, policyProcedures } = require('../db/schema');
const { eq, and, desc, asc, sql, count, like, ilike, gte, lte } = require('drizzle-orm');
const aiGenerationService = require('./aiGenerationService');
const notificationService = require('./notificationService');

class ProcedureService {

  // ==================== PROCEDURE CRUD OPERATIONS ====================

  /**
   * Create a new procedure
   */
  async createProcedure(procedureData, userId) {
    try {
      console.log('📋 Creating new procedure:', procedureData.title);

      const [newProcedure] = await db.insert(procedures)
        .values({
          ...procedureData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create audit log
      await this.createAuditLog('procedure_created', newProcedure.id, userId, {
        title: newProcedure.title,
        type: newProcedure.procedureType,
        status: newProcedure.status,
        relatedPolicyId: newProcedure.relatedPolicyId
      });

      // Send notification to relevant stakeholders
      await this.notifyProcedureStakeholders('procedure_created', newProcedure, userId);

      return newProcedure;
    } catch (error) {
      console.error('Error creating procedure:', error);
      throw error;
    }
  }

  /**
   * Get all procedures with filtering and pagination
   */
  async getAllProcedures(filters = {}, pagination = {}) {
    try {
      const { 
        status, 
        procedureType,
        relatedPolicyId,
        search,
        startDate,
        endDate,
        createdBy,
        approvedBy
      } = filters;
      
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = pagination;

      let query = db.select({
        id: procedures.id,
        title: procedures.title,
        description: procedures.description,
        procedureType: procedures.procedureType,
        relatedPolicyId: procedures.relatedPolicyId,
        status: procedures.status,
        version: procedures.version,
        effectiveDate: procedures.effectiveDate,
        reviewDate: procedures.reviewDate,
        approvedBy: procedures.approvedBy,
        approvedAt: procedures.approvedAt,
        steps: procedures.steps,
        resources: procedures.resources,
        metadata: procedures.metadata,
        createdBy: procedures.createdBy,
        content: procedures.content,
        createdAt: procedures.createdAt,
        updatedAt: procedures.updatedAt
      })
      .from(procedures);

      // Apply filters
      const conditions = [];

      if (status) {
        conditions.push(eq(procedures.status, status));
      }

      if (procedureType) {
        conditions.push(eq(procedures.procedureType, procedureType));
      }

      if (relatedPolicyId) {
        conditions.push(eq(procedures.relatedPolicyId, relatedPolicyId));
      }

      if (search) {
        conditions.push(
          sql`(
            ${procedures.title} ILIKE ${`%${search}%`} OR 
            ${procedures.description} ILIKE ${`%${search}%`} OR 
            ${procedures.content} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (startDate) {
        conditions.push(gte(procedures.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(procedures.createdAt, new Date(endDate)));
      }

      if (createdBy) {
        conditions.push(eq(procedures.createdBy, createdBy));
      }

      if (approvedBy) {
        conditions.push(eq(procedures.approvedBy, approvedBy));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = procedures[sortBy] || procedures.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const procedureList = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(procedures);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: procedureList,
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
      console.error('Error getting procedures:', error);
      throw error;
    }
  }

  /**
   * Get procedure by ID
   */
  async getProcedureById(procedureId) {
    try {
      const [procedure] = await db.select()
        .from(procedures)
        .where(eq(procedures.id, procedureId))
        .limit(1);

      if (!procedure) {
        throw new Error('Procedure not found');
      }

      // Get related policy if exists
      let relatedPolicy = null;
      if (procedure.relatedPolicyId) {
        const [policy] = await db.select()
          .from(policies)
          .where(eq(policies.id, procedure.relatedPolicyId))
          .limit(1);
        relatedPolicy = policy;
      }

      return {
        ...procedure,
        relatedPolicy
      };
    } catch (error) {
      console.error('Error getting procedure by ID:', error);
      throw error;
    }
  }

  /**
   * Update procedure
   */
  async updateProcedure(procedureId, updateData, userId) {
    try {
      console.log('📋 Updating procedure:', procedureId);

      // Get current procedure for comparison
      const currentProcedure = await this.getProcedureById(procedureId);

      const [updatedProcedure] = await db.update(procedures)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(procedures.id, procedureId))
        .returning();

      // Create audit log
      await this.createAuditLog('procedure_updated', procedureId, userId, {
        changes: this.getChanges(currentProcedure, updateData),
        previousVersion: currentProcedure.version,
        newVersion: updatedProcedure.version
      });

      // Send notification if status changed
      if (updateData.status && updateData.status !== currentProcedure.status) {
        await this.notifyProcedureStakeholders('procedure_status_changed', updatedProcedure, userId);
      }

      return updatedProcedure;
    } catch (error) {
      console.error('Error updating procedure:', error);
      throw error;
    }
  }

  /**
   * Delete procedure
   */
  async deleteProcedure(procedureId, userId) {
    try {
      console.log('🗑️ Deleting procedure:', procedureId);

      // Get procedure details for audit
      const procedure = await this.getProcedureById(procedureId);

      // Delete the procedure
      await db.delete(procedures)
        .where(eq(procedures.id, procedureId));

      // Create audit log
      await this.createAuditLog('procedure_deleted', procedureId, userId, {
        title: procedure.title,
        type: procedure.procedureType,
        status: procedure.status
      });

      return { success: true, deletedProcedure: procedure };
    } catch (error) {
      console.error('Error deleting procedure:', error);
      throw error;
    }
  }

  /**
   * Approve procedure
   */
  async approveProcedure(procedureId, userId, approvalNotes = '') {
    try {
      console.log('✅ Approving procedure:', procedureId);

      const [approvedProcedure] = await db.update(procedures)
        .set({
          status: 'approved',
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(procedures.id, procedureId))
        .returning();

      // Create audit log
      await this.createAuditLog('procedure_approved', procedureId, userId, {
        approvalNotes,
        approvedAt: approvedProcedure.approvedAt
      });

      // Send approval notification
      await this.notifyProcedureStakeholders('procedure_approved', approvedProcedure, userId);

      return approvedProcedure;
    } catch (error) {
      console.error('Error approving procedure:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get related policy for AI context
   */
  async getRelatedPolicy(policyId) {
    try {
      const [policy] = await db.select()
        .from(policies)
        .where(eq(policies.id, policyId))
        .limit(1);

      return policy;
    } catch (error) {
      console.error('Error getting related policy:', error);
      return null;
    }
  }

  /**
   * Get related procedures for AI context
   */
  async getRelatedProcedures(procedureType, limit = 5) {
    try {
      const relatedProcedures = await db.select({
        id: procedures.id,
        title: procedures.title,
        description: procedures.description,
        content: procedures.content
      })
      .from(procedures)
      .where(and(
        eq(procedures.procedureType, procedureType),
        eq(procedures.status, 'published')
      ))
      .limit(limit);

      return relatedProcedures;
    } catch (error) {
      console.error('Error getting related procedures:', error);
      return [];
    }
  }

  /**
   * Extract steps from generated content
   */
  extractStepsFromContent(content) {
    try {
      const steps = [];
      const lines = content.split('\n');

      for (const line of lines) {
        // Look for numbered steps or bullet points
        if (line.match(/^\d+\.\s/) || line.match(/^-\s/) || line.match(/^\*\s/)) {
          steps.push(line.trim());
        }
      }

      return { steps };
    } catch (error) {
      console.error('Error extracting steps:', error);
      return { steps: [] };
    }
  }

  /**
   * Get procedure analytics
   */
  async getProcedureAnalytics() {
    try {
      // Overall statistics
      const [overallStats] = await db.select({
        total: count(),
        draft: sql`COUNT(CASE WHEN status = 'draft' THEN 1 END)`,
        underReview: sql`COUNT(CASE WHEN status = 'under_review' THEN 1 END)`,
        approved: sql`COUNT(CASE WHEN status = 'approved' THEN 1 END)`,
        published: sql`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        archived: sql`COUNT(CASE WHEN status = 'archived' THEN 1 END)`,
        expired: sql`COUNT(CASE WHEN status = 'expired' THEN 1 END)`
      })
      .from(procedures);

      // Statistics by type
      const typeStats = await db.select({
        procedureType: procedures.procedureType,
        count: count(),
        published: sql`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        draft: sql`COUNT(CASE WHEN status = 'draft' THEN 1 END)`
      })
      .from(procedures)
      .groupBy(procedures.procedureType);

      // Recent activity (last 30 days)
      const [recentActivity] = await db.select({
        created: count(),
        approved: sql`COUNT(CASE WHEN approved_at >= NOW() - INTERVAL '30 days' THEN 1 END)`,
        updated: sql`COUNT(CASE WHEN updated_at >= NOW() - INTERVAL '30 days' AND created_at < NOW() - INTERVAL '30 days' THEN 1 END)`
      })
      .from(procedures)
      .where(gte(procedures.createdAt, sql`NOW() - INTERVAL '30 days'`));

      // Procedures due for review
      const proceduresDueForReview = await db.select({
        count: count()
      })
      .from(procedures)
      .where(and(
        eq(procedures.status, 'published'),
        lte(procedures.reviewDate, new Date())
      ));

      return {
        overall: overallStats,
        byType: typeStats,
        recent: recentActivity,
        dueForReview: proceduresDueForReview[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting procedure analytics:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(action, procedureId, userId, details = {}) {
    try {
      // This would integrate with your audit logging system
      console.log(`Audit: ${action} on procedure ${procedureId} by user ${userId}`, details);

      // You can implement actual audit logging here
      // await auditLogService.createLog({
      //   action,
      //   entityType: 'procedure',
      //   entityId: procedureId,
      //   userId,
      //   details
      // });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  /**
   * Notify procedure stakeholders
   */
  async notifyProcedureStakeholders(eventType, procedure, userId) {
    try {
      // Get relevant stakeholders based on procedure type and organization
      const stakeholders = await this.getProcedureStakeholders(procedure);

      for (const stakeholder of stakeholders) {
        await notificationService.createNotification({
          userId: stakeholder.id,
          title: this.getNotificationTitle(eventType, procedure),
          message: this.getNotificationMessage(eventType, procedure),
          type: this.getNotificationType(eventType),
          module: 'procedures',
          eventType: eventType,
          relatedId: procedure.id,
          relatedType: 'procedure',
          priority: this.getNotificationPriority(eventType),
          metadata: {
            procedureTitle: procedure.title,
            procedureType: procedure.procedureType,
            procedureStatus: procedure.status,
            actionBy: userId
          }
        });
      }
    } catch (error) {
      console.error('Error notifying procedure stakeholders:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  /**
   * Get procedure stakeholders
   */
  async getProcedureStakeholders(procedure) {
    try {
      const stakeholders = [];

      // Add procedure creator
      if (procedure.createdBy) {
        stakeholders.push({ id: procedure.createdBy, role: 'creator' });
      }

      // Add approver
      if (procedure.approvedBy) {
        stakeholders.push({ id: procedure.approvedBy, role: 'approver' });
      }

      return stakeholders;
    } catch (error) {
      console.error('Error getting procedure stakeholders:', error);
      return [];
    }
  }

  /**
   * Get notification details based on event type
   */
  getNotificationTitle(eventType, procedure) {
    const titles = {
      'procedure_created': `New Procedure Created: ${procedure.title}`,
      'procedure_updated': `Procedure Updated: ${procedure.title}`,
      'procedure_approved': `Procedure Approved: ${procedure.title}`,
      'procedure_published': `Procedure Published: ${procedure.title}`,
      'procedure_status_changed': `Procedure Status Changed: ${procedure.title}`
    };
    return titles[eventType] || `Procedure Notification: ${procedure.title}`;
  }

  getNotificationMessage(eventType, procedure) {
    const messages = {
      'procedure_created': `A new ${procedure.procedureType} procedure has been created and is ready for review.`,
      'procedure_updated': `The ${procedure.procedureType} procedure has been updated and may require your attention.`,
      'procedure_approved': `The ${procedure.procedureType} procedure has been approved and is ready for publication.`,
      'procedure_published': `The ${procedure.procedureType} procedure has been published and is now effective.`,
      'procedure_status_changed': `The status of the ${procedure.procedureType} procedure has been changed to ${procedure.status}.`
    };
    return messages[eventType] || `Procedure notification for ${procedure.title}`;
  }

  getNotificationType(eventType) {
    const types = {
      'procedure_created': 'info',
      'procedure_updated': 'info',
      'procedure_approved': 'success',
      'procedure_published': 'success',
      'procedure_status_changed': 'info'
    };
    return types[eventType] || 'info';
  }

  getNotificationPriority(eventType) {
    const priorities = {
      'procedure_created': 2,
      'procedure_updated': 2,
      'procedure_approved': 3,
      'procedure_published': 3,
      'procedure_status_changed': 2
    };
    return priorities[eventType] || 2;
  }

  /**
   * Get changes between old and new procedure data
   */
  getChanges(oldData, newData) {
    const changes = {};

    Object.keys(newData).forEach(key => {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    });

    return changes;
  }
}

module.exports = new ProcedureService();

  /**
   * Publish procedure
   */
  async publishProcedure(procedureId, userId, effectiveDate = null) {
    try {
      console.log('📢 Publishing procedure:', procedureId);

      const [publishedProcedure] = await db.update(procedures)
        .set({
          status: 'published',
          effectiveDate: effectiveDate || new Date(),
          updatedAt: new Date()
        })
        .where(eq(procedures.id, procedureId))
        .returning();

      // Create audit log
      await this.createAuditLog('procedure_published', procedureId, userId, {
        effectiveDate: publishedProcedure.effectiveDate,
        publishedAt: new Date()
      });

      // Send publication notification
      await this.notifyProcedureStakeholders('procedure_published', publishedProcedure, userId);

      return publishedProcedure;
    } catch (error) {
      console.error('Error publishing procedure:', error);
      throw error;
    }
  }

  // ==================== AI-ASSISTED PROCEDURE GENERATION ====================

  /**
   * Generate procedure using AI
   */
  async generateProcedureWithAI(generationRequest, userId) {
    try {
      console.log('🤖 Generating procedure with AI:', generationRequest.title);

      // Create AI generation request
      const aiRequest = await aiGenerationService.createGenerationRequest({
        requestType: 'procedure',
        generationMode: generationRequest.mode || 'full_generation',
        title: generationRequest.title,
        description: generationRequest.description,
        prompt: generationRequest.prompt,
        context: {
          procedureType: generationRequest.procedureType,
          relatedPolicy: generationRequest.relatedPolicyId ? await this.getRelatedPolicy(generationRequest.relatedPolicyId) : null,
          organizationContext: generationRequest.organizationContext,
          existingProcedures: await this.getRelatedProcedures(generationRequest.procedureType),
          specificRequirements: generationRequest.requirements,
          assetContext: generationRequest.assetContext
        },
        parameters: generationRequest.aiParameters || {},
        aiProvider: generationRequest.aiProvider || 'openai',
        modelName: generationRequest.modelName,
        relatedPolicyId: generationRequest.relatedPolicyId
      }, userId);

      // Process the AI generation
      const generationResult = await aiGenerationService.processGeneration(aiRequest.id);

      if (generationResult.status === 'completed') {
        // Create draft procedure with AI-generated content
        const draftProcedure = await this.createProcedure({
          title: generationRequest.title,
          description: generationRequest.description,
          procedureType: generationRequest.procedureType,
          relatedPolicyId: generationRequest.relatedPolicyId,
          content: generationResult.generatedContent,
          status: 'draft',
          steps: this.extractStepsFromContent(generationResult.generatedContent),
          metadata: {
            aiGenerated: true,
            aiRequestId: aiRequest.id,
            aiProvider: generationRequest.aiProvider,
            generationMode: generationRequest.mode,
            qualityScore: generationResult.qualityScore
          }
        }, userId);

        return {
          procedure: draftProcedure,
          aiRequest: aiRequest,
          generationResult: generationResult
        };
      } else {
        throw new Error(`AI generation failed: ${generationResult.errorMessage}`);
      }
    } catch (error) {
      console.error('Error generating procedure with AI:', error);
      throw error;
    }
  }
