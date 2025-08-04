const policyService = require('../services/policyService');
const aiGenerationService = require('../services/aiGenerationService');
const Joi = require('joi');

class PolicyController {

  // ==================== POLICY CRUD OPERATIONS ====================

  /**
   * Create a new policy
   */
  async createPolicy(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        title: Joi.string().required().max(200).trim(),
        description: Joi.string().max(1000).trim(),
        policyType: Joi.string().required().valid(
          'security', 'privacy', 'compliance', 'operational', 'hr', 'financial',
          'it', 'risk_management', 'business_continuity', 'data_governance',
          'vendor_management', 'incident_response', 'access_control',
          'change_management', 'asset_management', 'other'
        ),
        content: Joi.string().trim(),
        effectiveDate: Joi.date(),
        reviewDate: Joi.date(),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newPolicy = await policyService.createPolicy(value, req.user.id);

      res.status(201).json({
        message: 'Policy created successfully',
        data: newPolicy
      });

    } catch (error) {
      console.error('Error creating policy:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all policies
   */
  async getAllPolicies(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        status: Joi.string().valid('draft', 'under_review', 'approved', 'published', 'archived', 'expired'),
        policyType: Joi.string().valid(
          'security', 'privacy', 'compliance', 'operational', 'hr', 'financial',
          'it', 'risk_management', 'business_continuity', 'data_governance',
          'vendor_management', 'incident_response', 'access_control',
          'change_management', 'asset_management', 'other'
        ),
        search: Joi.string().max(100),
        startDate: Joi.date(),
        endDate: Joi.date(),
        createdBy: Joi.number().integer(),
        approvedBy: Joi.number().integer(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'status', 'policyType', 'effectiveDate').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const { page, limit, sortBy, sortOrder, ...filters } = value;

      const result = await policyService.getAllPolicies(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Policies retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting policies:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get policy by ID
   */
  async getPolicyById(req, res) {
    try {
      const { policyId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        policyId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ policyId: parseInt(policyId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid policy ID', 
          details: error.details 
        });
      }

      const policy = await policyService.getPolicyById(parseInt(policyId));

      res.json({
        message: 'Policy retrieved successfully',
        data: policy
      });

    } catch (error) {
      console.error('Error getting policy by ID:', error);
      
      if (error.message === 'Policy not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Policy not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update policy
   */
  async updatePolicy(req, res) {
    try {
      const { policyId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        policyId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ policyId: parseInt(policyId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid policy ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        title: Joi.string().max(200).trim(),
        description: Joi.string().max(1000).trim(),
        policyType: Joi.string().valid(
          'security', 'privacy', 'compliance', 'operational', 'hr', 'financial',
          'it', 'risk_management', 'business_continuity', 'data_governance',
          'vendor_management', 'incident_response', 'access_control',
          'change_management', 'asset_management', 'other'
        ),
        status: Joi.string().valid('draft', 'under_review', 'approved', 'published', 'archived', 'expired'),
        version: Joi.string().max(20),
        content: Joi.string().trim(),
        effectiveDate: Joi.date(),
        reviewDate: Joi.date(),
        metadata: Joi.object()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedPolicy = await policyService.updatePolicy(parseInt(policyId), value, req.user.id);

      res.json({
        message: 'Policy updated successfully',
        data: updatedPolicy
      });

    } catch (error) {
      console.error('Error updating policy:', error);
      
      if (error.message === 'Policy not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Policy not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete policy
   */
  async deletePolicy(req, res) {
    try {
      const { policyId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        policyId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ policyId: parseInt(policyId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid policy ID', 
          details: error.details 
        });
      }

      const result = await policyService.deletePolicy(parseInt(policyId), req.user.id);

      res.json({
        message: 'Policy deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting policy:', error);
      
      if (error.message === 'Policy not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Policy not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Approve policy
   */
  async approvePolicy(req, res) {
    try {
      const { policyId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        policyId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ policyId: parseInt(policyId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid policy ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        approvalNotes: Joi.string().max(1000).trim().default('')
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const approvedPolicy = await policyService.approvePolicy(
        parseInt(policyId), 
        req.user.id, 
        value.approvalNotes
      );

      res.json({
        message: 'Policy approved successfully',
        data: approvedPolicy
      });

    } catch (error) {
      console.error('Error approving policy:', error);
      
      if (error.message === 'Policy not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Policy not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Publish policy
   */
  async publishPolicy(req, res) {
    try {
      const { policyId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        policyId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ policyId: parseInt(policyId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid policy ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        effectiveDate: Joi.date()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const publishedPolicy = await policyService.publishPolicy(
        parseInt(policyId), 
        req.user.id, 
        value.effectiveDate
      );

      res.json({
        message: 'Policy published successfully',
        data: publishedPolicy
      });

    } catch (error) {
      console.error('Error publishing policy:', error);
      
      if (error.message === 'Policy not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Policy not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== AI-ASSISTED POLICY GENERATION ====================

  /**
   * Generate policy using AI
   */
  async generatePolicyWithAI(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        title: Joi.string().required().max(200).trim(),
        description: Joi.string().max(1000).trim(),
        policyType: Joi.string().required().valid(
          'security', 'privacy', 'compliance', 'operational', 'hr', 'financial',
          'it', 'risk_management', 'business_continuity', 'data_governance',
          'vendor_management', 'incident_response', 'access_control',
          'change_management', 'asset_management', 'other'
        ),
        prompt: Joi.string().required().max(2000).trim(),
        mode: Joi.string().valid('full_generation', 'template_based', 'enhancement').default('full_generation'),
        aiProvider: Joi.string().valid('openai', 'anthropic', 'azure_openai').default('openai'),
        modelName: Joi.string().max(100),
        organizationContext: Joi.string().max(1000),
        complianceRequirements: Joi.string().max(1000),
        assetContext: Joi.string().max(1000),
        aiParameters: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const result = await policyService.generatePolicyWithAI(value, req.user.id);

      res.status(201).json({
        message: 'Policy generated successfully with AI assistance',
        data: result
      });

    } catch (error) {
      console.error('Error generating policy with AI:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Enhance existing policy with AI
   */
  async enhancePolicyWithAI(req, res) {
    try {
      const { policyId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        policyId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ policyId: parseInt(policyId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid policy ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        description: Joi.string().required().max(1000).trim(),
        prompt: Joi.string().required().max(2000).trim(),
        type: Joi.string().valid('clarity', 'completeness', 'compliance', 'structure').default('completeness'),
        requirements: Joi.string().max(1000),
        aiProvider: Joi.string().valid('openai', 'anthropic', 'azure_openai').default('openai'),
        modelName: Joi.string().max(100)
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const result = await policyService.enhancePolicyWithAI(parseInt(policyId), value, req.user.id);

      res.json({
        message: 'Policy enhanced successfully with AI assistance',
        data: result
      });

    } catch (error) {
      console.error('Error enhancing policy with AI:', error);

      if (error.message === 'Policy not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Policy not found'
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Get policy analytics
   */
  async getPolicyAnalytics(req, res) {
    try {
      const analytics = await policyService.getPolicyAnalytics();

      res.json({
        message: 'Policy analytics retrieved successfully',
        data: analytics
      });

    } catch (error) {
      console.error('Error getting policy analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get AI generation analytics
   */
  async getAIGenerationAnalytics(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        startDate: Joi.date(),
        endDate: Joi.date(),
        provider: Joi.string().valid('openai', 'anthropic', 'azure_openai'),
        generationType: Joi.string().valid('policy', 'policy_update')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const analytics = await aiGenerationService.getAnalytics(value);

      res.json({
        message: 'AI generation analytics retrieved successfully',
        data: analytics
      });

    } catch (error) {
      console.error('Error getting AI generation analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new PolicyController();
