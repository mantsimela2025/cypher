const accessRequestService = require('../services/accessRequestService');
const Joi = require('joi');

class AccessRequestController {

  // ==================== PUBLIC ACCESS REQUEST OPERATIONS ====================

  /**
   * Submit access request (public endpoint)
   */
  async submitAccessRequest(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        firstName: Joi.string().required().max(100).trim(),
        lastName: Joi.string().required().max(100).trim(),
        email: Joi.string().email().required().max(255).lowercase().trim(),
        reason: Joi.string().max(1000).trim()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      // Submit access request
      const newRequest = await accessRequestService.submitAccessRequest(value);

      res.status(201).json({
        message: 'Access request submitted successfully. You will receive an email confirmation shortly.',
        data: {
          id: newRequest.id,
          firstName: newRequest.firstName,
          lastName: newRequest.lastName,
          email: newRequest.email,
          status: newRequest.status,
          createdAt: newRequest.createdAt
        }
      });

    } catch (error) {
      console.error('Error submitting access request:', error);
      
      if (error.message === 'A pending access request already exists for this email address') {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ADMIN ACCESS REQUEST OPERATIONS ====================

  /**
   * Get all access requests (admin only)
   */
  async getAllAccessRequests(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        status: Joi.string().valid('pending', 'approved', 'rejected'),
        search: Joi.string().max(100),
        startDate: Joi.date(),
        endDate: Joi.date(),
        processedBy: Joi.number().integer(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'status', 'processedAt').default('createdAt'),
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

      // Get access requests
      const result = await accessRequestService.getAllAccessRequests(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Access requests retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting access requests:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get access request by ID (admin only)
   */
  async getAccessRequestById(req, res) {
    try {
      const { requestId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        requestId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ requestId: parseInt(requestId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request ID', 
          details: error.details 
        });
      }

      // Get access request
      const request = await accessRequestService.getAccessRequestById(parseInt(requestId));

      res.json({
        message: 'Access request retrieved successfully',
        data: request
      });

    } catch (error) {
      console.error('Error getting access request by ID:', error);
      
      if (error.message === 'Access request not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Access request not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Approve access request (admin only)
   */
  async approveAccessRequest(req, res) {
    try {
      const { requestId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        requestId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ requestId: parseInt(requestId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request ID', 
          details: error.details 
        });
      }

      const adminUserId = req.user.id;

      // Approve access request
      const approvedRequest = await accessRequestService.approveAccessRequest(parseInt(requestId), adminUserId);

      res.json({
        message: 'Access request approved successfully. User account has been created and notifications sent.',
        data: approvedRequest
      });

    } catch (error) {
      console.error('Error approving access request:', error);
      
      if (error.message === 'Access request not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Access request not found' 
        });
      }
      
      if (error.message === 'Access request has already been processed') {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Reject access request (admin only)
   */
  async rejectAccessRequest(req, res) {
    try {
      const { requestId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        requestId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ requestId: parseInt(requestId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid request ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        rejectionReason: Joi.string().required().max(1000).trim()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const adminUserId = req.user.id;

      // Reject access request
      const rejectedRequest = await accessRequestService.rejectAccessRequest(
        parseInt(requestId), 
        adminUserId, 
        value.rejectionReason
      );

      res.json({
        message: 'Access request rejected successfully. Notification sent to requester.',
        data: rejectedRequest
      });

    } catch (error) {
      console.error('Error rejecting access request:', error);
      
      if (error.message === 'Access request not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Access request not found' 
        });
      }
      
      if (error.message === 'Access request has already been processed') {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete access request (admin only)
   */
  async deleteAccessRequest(req, res) {
    try {
      const { requestId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        requestId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ requestId: parseInt(requestId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request ID', 
          details: error.details 
        });
      }

      const adminUserId = req.user.id;

      // Delete access request
      const result = await accessRequestService.deleteAccessRequest(parseInt(requestId), adminUserId);

      res.json({
        message: 'Access request deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting access request:', error);
      
      if (error.message === 'Access request not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Access request not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get access request statistics (admin only)
   */
  async getAccessRequestStats(req, res) {
    try {
      // Get access request statistics
      const stats = await accessRequestService.getAccessRequestStats();

      res.json({
        message: 'Access request statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      console.error('Error getting access request statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AccessRequestController();
