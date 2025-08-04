const atoService = require('../services/atoService');
const Joi = require('joi');

class ATOController {

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create new Authorization to Operate
   */
  async createATO(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        sspId: Joi.number().integer().required(),
        type: Joi.string().valid('full', 'interim', 'provisional', 'conditional').default('full'),
        riskLevel: Joi.string().valid('low', 'moderate', 'high'),
        authorizationMemo: Joi.string().max(5000),
        authorizationConditions: Joi.string().max(5000),
        continuousMonitoringPlan: Joi.string().max(5000)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;

      // Create ATO
      const newATO = await atoService.createATO(value, userId);

      res.status(201).json({
        message: 'ATO created successfully',
        data: newATO
      });

    } catch (error) {
      console.error('Error creating ATO:', error);
      
      if (error.message.includes('active ATO already exists')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get ATO by ID
   */
  async getATOById(req, res) {
    try {
      const { atoId } = req.params;
      
      // Validate parameters
      const schema = Joi.object({
        atoId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ atoId: parseInt(atoId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid ATO ID', 
          details: error.details 
        });
      }

      // Parse query parameters
      const includeHistory = req.query.includeHistory === 'true';
      const includeDocuments = req.query.includeDocuments === 'true';

      // Get ATO
      const ato = await atoService.getATOById(parseInt(atoId), includeHistory, includeDocuments);

      res.json({
        message: 'ATO retrieved successfully',
        data: ato
      });

    } catch (error) {
      console.error('Error getting ATO:', error);
      
      if (error.message === 'ATO not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'ATO not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update ATO
   */
  async updateATO(req, res) {
    try {
      const { atoId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        atoId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ atoId: parseInt(atoId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid ATO ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        type: Joi.string().valid('full', 'interim', 'provisional', 'conditional'),
        riskLevel: Joi.string().valid('low', 'moderate', 'high'),
        authorizationMemo: Joi.string().max(5000),
        authorizationConditions: Joi.string().max(5000),
        continuousMonitoringPlan: Joi.string().max(5000)
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const userId = req.user.id;

      // Update ATO
      const updatedATO = await atoService.updateATO(parseInt(atoId), value, userId);

      res.json({
        message: 'ATO updated successfully',
        data: updatedATO
      });

    } catch (error) {
      console.error('Error updating ATO:', error);
      
      if (error.message === 'ATO not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'ATO not found' 
        });
      }
      
      if (error.message.includes('cannot be updated')) {
        return res.status(400).json({ 
          error: 'Invalid operation', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete ATO
   */
  async deleteATO(req, res) {
    try {
      const { atoId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        atoId: Joi.number().integer().required(),
        reason: Joi.string().max(500)
      });

      const { error } = schema.validate({ 
        atoId: parseInt(atoId),
        reason: req.body.reason 
      });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;
      const reason = req.body.reason || 'ATO deleted by user';

      // Delete ATO
      const deletedATO = await atoService.deleteATO(parseInt(atoId), userId, reason);

      res.json({
        message: 'ATO deleted successfully',
        data: deletedATO
      });

    } catch (error) {
      console.error('Error deleting ATO:', error);
      
      if (error.message === 'ATO not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'ATO not found' 
        });
      }
      
      if (error.message.includes('Only draft ATOs')) {
        return res.status(400).json({ 
          error: 'Invalid operation', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all ATOs with filtering and pagination
   */
  async getAllATOs(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        status: Joi.string().valid('draft', 'submitted', 'under_review', 'pending_approval', 'approved', 'rejected', 'expired', 'revoked'),
        type: Joi.string().valid('full', 'interim', 'provisional', 'conditional'),
        sspId: Joi.number().integer(),
        riskLevel: Joi.string().valid('low', 'moderate', 'high'),
        expiringWithinDays: Joi.number().integer().min(1).max(365),
        authorizedBy: Joi.number().integer(),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'submissionDate', 'approvalDate', 'expirationDate').default('createdAt'),
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

      // Get ATOs
      const result = await atoService.getAllATOs(filters, { page, limit, sortBy, sortOrder });

      res.json({
        message: 'ATOs retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting all ATOs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== WORKFLOW MANAGEMENT ====================

  /**
   * Submit ATO for review
   */
  async submitATO(req, res) {
    try {
      const { atoId } = req.params;

      // Validate request
      const schema = Joi.object({
        atoId: Joi.number().integer().required(),
        comments: Joi.string().max(1000).default('')
      });

      const { error } = schema.validate({ 
        atoId: parseInt(atoId),
        comments: req.body.comments 
      });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;
      const comments = req.body.comments || '';

      // Submit ATO
      const submittedATO = await atoService.submitATO(parseInt(atoId), userId, comments);

      res.json({
        message: 'ATO submitted for review successfully',
        data: submittedATO
      });

    } catch (error) {
      console.error('Error submitting ATO:', error);
      
      if (error.message === 'ATO not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'ATO not found' 
        });
      }
      
      if (error.message.includes('Only draft ATOs')) {
        return res.status(400).json({ 
          error: 'Invalid operation', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Review ATO (approve, reject, or request changes)
   */
  async reviewATO(req, res) {
    try {
      const { atoId } = req.params;

      // Validate request
      const schema = Joi.object({
        atoId: Joi.number().integer().required(),
        action: Joi.string().valid('approve', 'reject', 'request_changes').required(),
        comments: Joi.string().max(1000).default(''),
        approvalRole: Joi.string().valid(
          'system_owner', 'authorizing_official', 'security_officer', 
          'privacy_officer', 'risk_executive', 'cio', 'ciso', 'reviewer', 'approver'
        ).default('reviewer'),
        signature: Joi.string().max(1000)
      });

      const { error, value } = schema.validate({ 
        atoId: parseInt(atoId),
        ...req.body 
      });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;
      const { action, comments, approvalRole, signature } = value;

      // Review ATO
      const reviewedATO = await atoService.reviewATO(
        parseInt(atoId), 
        action, 
        userId, 
        comments, 
        approvalRole, 
        signature
      );

      res.json({
        message: `ATO ${action} completed successfully`,
        data: reviewedATO
      });

    } catch (error) {
      console.error('Error reviewing ATO:', error);
      
      if (error.message === 'ATO not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'ATO not found' 
        });
      }
      
      if (error.message.includes('not in a reviewable status') || error.message.includes('Invalid review action')) {
        return res.status(400).json({ 
          error: 'Invalid operation', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Revoke ATO
   */
  async revokeATO(req, res) {
    try {
      const { atoId } = req.params;

      // Validate request
      const schema = Joi.object({
        atoId: Joi.number().integer().required(),
        reason: Joi.string().required().max(1000),
        approvalRole: Joi.string().valid(
          'authorizing_official', 'cio', 'ciso', 'risk_executive'
        ).default('authorizing_official')
      });

      const { error, value } = schema.validate({ 
        atoId: parseInt(atoId),
        ...req.body 
      });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const userId = req.user.id;
      const { reason, approvalRole } = value;

      // Revoke ATO
      const revokedATO = await atoService.revokeATO(parseInt(atoId), userId, reason, approvalRole);

      res.json({
        message: 'ATO revoked successfully',
        data: revokedATO
      });

    } catch (error) {
      console.error('Error revoking ATO:', error);
      
      if (error.message === 'ATO not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'ATO not found' 
        });
      }
      
      if (error.message.includes('Only approved ATOs')) {
        return res.status(400).json({ 
          error: 'Invalid operation', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== WORKFLOW HISTORY ====================

  /**
   * Get ATO workflow history
   */
  async getATOWorkflowHistory(req, res) {
    try {
      const { atoId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        atoId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ atoId: parseInt(atoId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid ATO ID',
          details: error.details
        });
      }

      // Get workflow history
      const history = await atoService.getATOWorkflowHistory(parseInt(atoId));

      res.json({
        message: 'ATO workflow history retrieved successfully',
        data: history
      });

    } catch (error) {
      console.error('Error getting ATO workflow history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  /**
   * Upload ATO document
   */
  async uploadATODocument(req, res) {
    try {
      const { atoId } = req.params;

      // Validate request
      const schema = Joi.object({
        atoId: Joi.number().integer().required(),
        documentType: Joi.string().required().max(100),
        fileName: Joi.string().required().max(255),
        fileLocation: Joi.string().required().max(500)
      });

      const { error, value } = schema.validate({
        atoId: parseInt(atoId),
        ...req.body
      });
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const userId = req.user.id;
      const { documentType, fileName, fileLocation } = value;

      // Upload document
      const document = await atoService.uploadATODocument(
        parseInt(atoId),
        { documentType, fileName, fileLocation },
        userId
      );

      res.status(201).json({
        message: 'ATO document uploaded successfully',
        data: document
      });

    } catch (error) {
      console.error('Error uploading ATO document:', error);

      if (error.message === 'ATO not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'ATO not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get ATO documents
   */
  async getATODocuments(req, res) {
    try {
      const { atoId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        atoId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ atoId: parseInt(atoId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid ATO ID',
          details: error.details
        });
      }

      // Get documents
      const documents = await atoService.getATODocuments(parseInt(atoId));

      res.json({
        message: 'ATO documents retrieved successfully',
        data: documents
      });

    } catch (error) {
      console.error('Error getting ATO documents:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete ATO document
   */
  async deleteATODocument(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ documentId: parseInt(documentId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid document ID',
          details: error.details
        });
      }

      const userId = req.user.id;

      // Delete document
      const result = await atoService.deleteATODocument(parseInt(documentId), userId);

      res.json({
        message: 'ATO document deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting ATO document:', error);

      if (error.message === 'Document not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Document not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  /**
   * Get ATO dashboard statistics
   */
  async getATODashboardStats(req, res) {
    try {
      // Get dashboard statistics
      const stats = await atoService.getATODashboardStats();

      res.json({
        message: 'ATO dashboard statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('Error getting ATO dashboard stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get expiring ATOs
   */
  async getExpiringATOs(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        daysAhead: Joi.number().integer().min(1).max(365).default(90)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const { daysAhead } = value;

      // Get expiring ATOs
      const expiringATOs = await atoService.getExpiringATOs(daysAhead);

      res.json({
        message: 'Expiring ATOs retrieved successfully',
        data: {
          expiringATOs,
          daysAhead,
          count: expiringATOs.length
        }
      });

    } catch (error) {
      console.error('Error getting expiring ATOs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get ATO workflow performance metrics
   */
  async getWorkflowMetrics(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        timeRange: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const { timeRange } = value;

      // Get workflow metrics
      const metrics = await atoService.getWorkflowMetrics(timeRange);

      res.json({
        message: 'ATO workflow metrics retrieved successfully',
        data: metrics
      });

    } catch (error) {
      console.error('Error getting workflow metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Search ATOs
   */
  async searchATOs(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        q: Joi.string().required().min(2).max(100),
        status: Joi.string().valid('draft', 'submitted', 'under_review', 'pending_approval', 'approved', 'rejected', 'expired', 'revoked'),
        type: Joi.string().valid('full', 'interim', 'provisional', 'conditional'),
        riskLevel: Joi.string().valid('low', 'moderate', 'high')
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const { q: searchTerm, ...filters } = value;

      // Search ATOs
      const results = await atoService.searchATOs(searchTerm, filters);

      res.json({
        message: 'ATO search completed successfully',
        data: {
          results,
          searchTerm,
          filters,
          count: results.length
        }
      });

    } catch (error) {
      console.error('Error searching ATOs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new ATOController();
