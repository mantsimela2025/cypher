const { db } = require('../db');
const { policies, procedures, policyProcedures, policyWorkflows, policyWorkflowHistory, policyWorkflowPolicies } = require('../db/schema');
const { eq, and, desc, asc, sql, count, like, ilike, gte, lte, inArray } = require('drizzle-orm');
const aiGenerationService = require('./aiGenerationService');
const notificationService = require('./notificationService');

class PolicyService {

  // ==================== POLICY CRUD OPERATIONS ====================

  /**
   * Create a new policy
   */
  async createPolicy(policyData, userId) {
    try {
      console.log('📝 Creating new policy:', policyData.title);

      const [newPolicy] = await db.insert(policies)
        .values({
          ...policyData,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create audit log
      await this.createAuditLog('policy_created', newPolicy.id, userId, {
        title: newPolicy.title,
        type: newPolicy.policyType,
        status: newPolicy.status
      });

      // Send notification to relevant stakeholders
      await this.notifyPolicyStakeholders('policy_created', newPolicy, userId);

      return newPolicy;
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  /**
   * Get all policies with filtering and pagination
   */
  async getAllPolicies(filters = {}, pagination = {}) {
    try {
      const { 
        status, 
        policyType,
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
        id: policies.id,
        title: policies.title,
        description: policies.description,
        policyType: policies.policyType,
        status: policies.status,
        version: policies.version,
        effectiveDate: policies.effectiveDate,
        reviewDate: policies.reviewDate,
        approvedBy: policies.approvedBy,
        approvedAt: policies.approvedAt,
        content: policies.content,
        metadata: policies.metadata,
        createdBy: policies.createdBy,
        createdAt: policies.createdAt,
        updatedAt: policies.updatedAt
      })
      .from(policies);

      // Apply filters
      const conditions = [];

      if (status) {
        conditions.push(eq(policies.status, status));
      }

      if (policyType) {
        conditions.push(eq(policies.policyType, policyType));
      }

      if (search) {
        conditions.push(
          sql`(
            ${policies.title} ILIKE ${`%${search}%`} OR 
            ${policies.description} ILIKE ${`%${search}%`} OR 
            ${policies.content} ILIKE ${`%${search}%`}
          )`
        );
      }

      if (startDate) {
        conditions.push(gte(policies.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(policies.createdAt, new Date(endDate)));
      }

      if (createdBy) {
        conditions.push(eq(policies.createdBy, createdBy));
      }

      if (approvedBy) {
        conditions.push(eq(policies.approvedBy, approvedBy));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = policies[sortBy] || policies.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const policyList = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(policies);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      return {
        data: policyList,
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
      console.error('Error getting policies:', error);
      throw error;
    }
  }

  /**
   * Get policy by ID
   */
  async getPolicyById(policyId) {
    try {
      const [policy] = await db.select()
        .from(policies)
        .where(eq(policies.id, policyId))
        .limit(1);

      if (!policy) {
        throw new Error('Policy not found');
      }

      // Get related procedures
      const relatedProcedures = await db.select()
        .from(procedures)
        .where(eq(procedures.relatedPolicyId, policyId));

      // Get policy procedures
      const policyProceduresList = await db.select()
        .from(policyProcedures)
        .where(eq(policyProcedures.policyId, policyId));

      return {
        ...policy,
        relatedProcedures,
        policyProcedures: policyProceduresList
      };
    } catch (error) {
      console.error('Error getting policy by ID:', error);
      throw error;
    }
  }

  /**
   * Update policy
   */
  async updatePolicy(policyId, updateData, userId) {
    try {
      console.log('📝 Updating policy:', policyId);

      // Get current policy for comparison
      const currentPolicy = await this.getPolicyById(policyId);

      const [updatedPolicy] = await db.update(policies)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(policies.id, policyId))
        .returning();

      // Create audit log
      await this.createAuditLog('policy_updated', policyId, userId, {
        changes: this.getChanges(currentPolicy, updateData),
        previousVersion: currentPolicy.version,
        newVersion: updatedPolicy.version
      });

      // Send notification if status changed
      if (updateData.status && updateData.status !== currentPolicy.status) {
        await this.notifyPolicyStakeholders('policy_status_changed', updatedPolicy, userId);
      }

      return updatedPolicy;
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId, userId) {
    try {
      console.log('🗑️ Deleting policy:', policyId);

      // Get policy details for audit
      const policy = await this.getPolicyById(policyId);

      // Delete related records first
      await db.delete(policyProcedures)
        .where(eq(policyProcedures.policyId, policyId));

      await db.delete(policyWorkflowPolicies)
        .where(eq(policyWorkflowPolicies.policyId, policyId));

      // Delete the policy
      await db.delete(policies)
        .where(eq(policies.id, policyId));

      // Create audit log
      await this.createAuditLog('policy_deleted', policyId, userId, {
        title: policy.title,
        type: policy.policyType,
        status: policy.status
      });

      return { success: true, deletedPolicy: policy };
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  }

  /**
   * Approve policy
   */
  async approvePolicy(policyId, userId, approvalNotes = '') {
    try {
      console.log('✅ Approving policy:', policyId);

      const [approvedPolicy] = await db.update(policies)
        .set({
          status: 'approved',
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(policies.id, policyId))
        .returning();

      // Create audit log
      await this.createAuditLog('policy_approved', policyId, userId, {
        approvalNotes,
        approvedAt: approvedPolicy.approvedAt
      });

      // Send approval notification
      await this.notifyPolicyStakeholders('policy_approved', approvedPolicy, userId);

      return approvedPolicy;
    } catch (error) {
      console.error('Error approving policy:', error);
      throw error;
    }
  }

  /**
   * Publish policy
   */
  async publishPolicy(policyId, userId, effectiveDate = null) {
    try {
      console.log('📢 Publishing policy:', policyId);

      const [publishedPolicy] = await db.update(policies)
        .set({
          status: 'published',
          effectiveDate: effectiveDate || new Date(),
          updatedAt: new Date()
        })
        .where(eq(policies.id, policyId))
        .returning();

      // Create audit log
      await this.createAuditLog('policy_published', policyId, userId, {
        effectiveDate: publishedPolicy.effectiveDate,
        publishedAt: new Date()
      });

      // Send publication notification
      await this.notifyPolicyStakeholders('policy_published', publishedPolicy, userId);

      return publishedPolicy;
    } catch (error) {
      console.error('Error publishing policy:', error);
      throw error;
    }
  }

  // ==================== AI-ASSISTED POLICY GENERATION ====================

  /**
   * Generate policy using AI
   */
  async generatePolicyWithAI(generationRequest, userId) {
    try {
      console.log('🤖 Generating policy with AI:', generationRequest.title);

      // Create AI generation request
      const aiRequest = await aiGenerationService.createGenerationRequest({
        requestType: 'policy',
        generationMode: generationRequest.mode || 'full_generation',
        title: generationRequest.title,
        description: generationRequest.description,
        prompt: generationRequest.prompt,
        context: {
          policyType: generationRequest.policyType,
          organizationContext: generationRequest.organizationContext,
          existingPolicies: await this.getRelatedPolicies(generationRequest.policyType),
          complianceRequirements: generationRequest.complianceRequirements,
          assetContext: generationRequest.assetContext
        },
        parameters: generationRequest.aiParameters || {},
        aiProvider: generationRequest.aiProvider || 'openai',
        modelName: generationRequest.modelName
      }, userId);

      // Process the AI generation
      const generationResult = await aiGenerationService.processGeneration(aiRequest.id);

      if (generationResult.status === 'completed') {
        // Create draft policy with AI-generated content
        const draftPolicy = await this.createPolicy({
          title: generationRequest.title,
          description: generationRequest.description,
          policyType: generationRequest.policyType,
          content: generationResult.generatedContent,
          status: 'draft',
          metadata: {
            aiGenerated: true,
            aiRequestId: aiRequest.id,
            aiProvider: generationRequest.aiProvider,
            generationMode: generationRequest.mode,
            qualityScore: generationResult.qualityScore
          }
        }, userId);

        return {
          policy: draftPolicy,
          aiRequest: aiRequest,
          generationResult: generationResult
        };
      } else {
        throw new Error(`AI generation failed: ${generationResult.errorMessage}`);
      }
    } catch (error) {
      console.error('Error generating policy with AI:', error);
      throw error;
    }
  }

  /**
   * Enhance existing policy with AI
   */
  async enhancePolicyWithAI(policyId, enhancementRequest, userId) {
    try {
      console.log('🤖 Enhancing policy with AI:', policyId);

      const existingPolicy = await this.getPolicyById(policyId);

      const aiRequest = await aiGenerationService.createGenerationRequest({
        requestType: 'policy_update',
        generationMode: 'enhancement',
        title: `Enhancement: ${existingPolicy.title}`,
        description: enhancementRequest.description,
        prompt: enhancementRequest.prompt,
        context: {
          existingContent: existingPolicy.content,
          enhancementType: enhancementRequest.type, // 'clarity', 'completeness', 'compliance', 'structure'
          specificRequirements: enhancementRequest.requirements
        },
        originalContent: existingPolicy.content,
        relatedPolicyId: policyId
      }, userId);

      const generationResult = await aiGenerationService.processGeneration(aiRequest.id);

      return {
        originalPolicy: existingPolicy,
        enhancedContent: generationResult.generatedContent,
        aiRequest: aiRequest,
        generationResult: generationResult
      };
    } catch (error) {
      console.error('Error enhancing policy with AI:', error);
      throw error;
    }
  }

  /**
   * Get policy analytics
   */
  async getPolicyAnalytics() {
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
      .from(policies);

      // Statistics by type
      const typeStats = await db.select({
        policyType: policies.policyType,
        count: count(),
        published: sql`COUNT(CASE WHEN status = 'published' THEN 1 END)`,
        draft: sql`COUNT(CASE WHEN status = 'draft' THEN 1 END)`
      })
      .from(policies)
      .groupBy(policies.policyType);

      // Recent activity (last 30 days)
      const [recentActivity] = await db.select({
        created: count(),
        approved: sql`COUNT(CASE WHEN approved_at >= NOW() - INTERVAL '30 days' THEN 1 END)`,
        updated: sql`COUNT(CASE WHEN updated_at >= NOW() - INTERVAL '30 days' AND created_at < NOW() - INTERVAL '30 days' THEN 1 END)`
      })
      .from(policies)
      .where(gte(policies.createdAt, sql`NOW() - INTERVAL '30 days'`));

      // Policies due for review
      const policiesDueForReview = await db.select({
        count: count()
      })
      .from(policies)
      .where(and(
        eq(policies.status, 'published'),
        lte(policies.reviewDate, new Date())
      ));

      return {
        overall: overallStats,
        byType: typeStats,
        recent: recentActivity,
        dueForReview: policiesDueForReview[0]?.count || 0
      };
    } catch (error) {
      console.error('Error getting policy analytics:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get related policies for AI context
   */
  async getRelatedPolicies(policyType, limit = 5) {
    try {
      const relatedPolicies = await db.select({
        id: policies.id,
        title: policies.title,
        description: policies.description,
        content: policies.content
      })
      .from(policies)
      .where(and(
        eq(policies.policyType, policyType),
        eq(policies.status, 'published')
      ))
      .limit(limit);

      return relatedPolicies;
    } catch (error) {
      console.error('Error getting related policies:', error);
      return [];
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(action, policyId, userId, details = {}) {
    try {
      // This would integrate with your audit logging system
      console.log(`Audit: ${action} on policy ${policyId} by user ${userId}`, details);

      // You can implement actual audit logging here
      // await auditLogService.createLog({
      //   action,
      //   entityType: 'policy',
      //   entityId: policyId,
      //   userId,
      //   details
      // });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw error to avoid breaking main operation
    }
  }

  /**
   * Get changes between old and new policy data
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

module.exports = new PolicyService();
