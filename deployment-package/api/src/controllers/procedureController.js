const procedureService = require('../services/procedureService');
const aiGenerationService = require('../services/aiGenerationService');
const Joi = require('joi');

class ProcedureController {

  // ==================== PROCEDURE CRUD OPERATIONS ====================

  /**
   * Create a new procedure
   */
  async createProcedure(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        title: Joi.string().required().max(200).trim(),
        description: Joi.string().max(1000).trim(),
        procedureType: Joi.string().required().valid(
          'standard_operating_procedure', 'work_instruction', 'process_flow',
          'checklist', 'guideline', 'emergency_procedure', 'maintenance_procedure',
          'security_procedure', 'compliance_procedure', 'training_procedure',
          'audit_procedure', 'incident_response_procedure', 'other'
        ),
        relatedPolicyId: Joi.number().integer(),
        content: Joi.string().trim(),
        steps: Joi.object().default({}),
        resources: Joi.object().default({}),
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

      const newProcedure = await procedureService.createProcedure(value, req.user.id);

      res.status(201).json({
        message: 'Procedure created successfully',
        data: newProcedure
      });

    } catch (error) {
      console.error('Error creating procedure:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all procedures
   */
  async getAllProcedures(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        status: Joi.string().valid('draft', 'under_review', 'approved', 'published', 'archived', 'expired'),
        procedureType: Joi.string().valid(
          'standard_operating_procedure', 'work_instruction', 'process_flow',
          'checklist', 'guideline', 'emergency_procedure', 'maintenance_procedure',
          'security_procedure', 'compliance_procedure', 'training_procedure',
          'audit_procedure', 'incident_response_procedure', 'other'
        ),
        relatedPolicyId: Joi.number().integer(),
        search: Joi.string().max(100),
        startDate: Joi.date(),
        endDate: Joi.date(),
        createdBy: Joi.number().integer(),
        approvedBy: Joi.number().integer(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'status', 'procedureType', 'effectiveDate').default('createdAt'),
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

      const result = await procedureService.getAllProcedures(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Procedures retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting procedures:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get procedure by ID
   */
  async getProcedureById(req, res) {
    try {
      const { procedureId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        procedureId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ procedureId: parseInt(procedureId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid procedure ID', 
          details: error.details 
        });
      }

      const procedure = await procedureService.getProcedureById(parseInt(procedureId));

      res.json({
        message: 'Procedure retrieved successfully',
        data: procedure
      });

    } catch (error) {
      console.error('Error getting procedure by ID:', error);
      
      if (error.message === 'Procedure not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Procedure not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update procedure
   */
  async updateProcedure(req, res) {
    try {
      const { procedureId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        procedureId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ procedureId: parseInt(procedureId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid procedure ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        title: Joi.string().max(200).trim(),
        description: Joi.string().max(1000).trim(),
        procedureType: Joi.string().valid(
          'standard_operating_procedure', 'work_instruction', 'process_flow',
          'checklist', 'guideline', 'emergency_procedure', 'maintenance_procedure',
          'security_procedure', 'compliance_procedure', 'training_procedure',
          'audit_procedure', 'incident_response_procedure', 'other'
        ),
        relatedPolicyId: Joi.number().integer(),
        status: Joi.string().valid('draft', 'under_review', 'approved', 'published', 'archived', 'expired'),
        version: Joi.string().max(20),
        content: Joi.string().trim(),
        steps: Joi.object(),
        resources: Joi.object(),
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

      const updatedProcedure = await procedureService.updateProcedure(parseInt(procedureId), value, req.user.id);

      res.json({
        message: 'Procedure updated successfully',
        data: updatedProcedure
      });

    } catch (error) {
      console.error('Error updating procedure:', error);
      
      if (error.message === 'Procedure not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Procedure not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete procedure
   */
  async deleteProcedure(req, res) {
    try {
      const { procedureId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        procedureId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ procedureId: parseInt(procedureId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid procedure ID', 
          details: error.details 
        });
      }

      const result = await procedureService.deleteProcedure(parseInt(procedureId), req.user.id);

      res.json({
        message: 'Procedure deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting procedure:', error);
      
      if (error.message === 'Procedure not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Procedure not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Approve procedure
   */
  async approveProcedure(req, res) {
    try {
      const { procedureId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        procedureId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ procedureId: parseInt(procedureId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid procedure ID', 
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

      const approvedProcedure = await procedureService.approveProcedure(
        parseInt(procedureId), 
        req.user.id, 
        value.approvalNotes
      );

      res.json({
        message: 'Procedure approved successfully',
        data: approvedProcedure
      });

    } catch (error) {
      console.error('Error approving procedure:', error);
      
      if (error.message === 'Procedure not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Procedure not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Publish procedure
   */
  async publishProcedure(req, res) {
    try {
      const { procedureId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        procedureId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ procedureId: parseInt(procedureId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid procedure ID', 
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

      const publishedProcedure = await procedureService.publishProcedure(
        parseInt(procedureId), 
        req.user.id, 
        value.effectiveDate
      );

      res.json({
        message: 'Procedure published successfully',
        data: publishedProcedure
      });

    } catch (error) {
      console.error('Error publishing procedure:', error);
      
      if (error.message === 'Procedure not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Procedure not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== AI-ASSISTED PROCEDURE GENERATION ====================

  /**
   * Generate procedure using AI
   */
  async generateProcedureWithAI(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        title: Joi.string().required().max(200).trim(),
        description: Joi.string().max(1000).trim(),
        procedureType: Joi.string().required().valid(
          'standard_operating_procedure', 'work_instruction', 'process_flow',
          'checklist', 'guideline', 'emergency_procedure', 'maintenance_procedure',
          'security_procedure', 'compliance_procedure', 'training_procedure',
          'audit_procedure', 'incident_response_procedure', 'other'
        ),
        relatedPolicyId: Joi.number().integer(),
        prompt: Joi.string().required().max(2000).trim(),
        mode: Joi.string().valid('full_generation', 'template_based', 'enhancement').default('full_generation'),
        aiProvider: Joi.string().valid('openai', 'anthropic', 'azure_openai').default('openai'),
        modelName: Joi.string().max(100),
        organizationContext: Joi.string().max(1000),
        requirements: Joi.string().max(1000),
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

      const result = await procedureService.generateProcedureWithAI(value, req.user.id);

      res.status(201).json({
        message: 'Procedure generated successfully with AI assistance',
        data: result
      });

    } catch (error) {
      console.error('Error generating procedure with AI:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  /**
   * Get procedure analytics
   */
  async getProcedureAnalytics(req, res) {
    try {
      const analytics = await procedureService.getProcedureAnalytics();

      res.json({
        message: 'Procedure analytics retrieved successfully',
        data: analytics
      });

    } catch (error) {
      console.error('Error getting procedure analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new ProcedureController();
