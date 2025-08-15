const { validationResult } = require('express-validator');
const poamService = require('../services/poamService');

class POAMController {
  /**
   * Get all POAMs with filtering and pagination
   */
  async getAllPOAMs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        search = '',
        status = '',
        systemId = '',
        riskRating = '',
        weaknessSeverity = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = { search, status, systemId, riskRating, weaknessSeverity };
      const options = {
        limit: parseInt(limit, 10),
        offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
        sortBy,
        sortOrder
      };

      const result = await poamService.getAllPOAMs(filters, options);
      
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        message: `Retrieved ${result.data.length} POAMs`
      });
    } catch (error) {
      console.error('Error in getAll POAMs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve POAMs'
      });
    }
  }

  /**
   * Get POAM by ID
   */
  async getPOAMById(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid POAM ID parameter'
        });
      }

      const poam = await poamService.getPOAMById(id);
      
      if (!poam) {
        return res.status(404).json({
          success: false,
          error: 'POAM not found'
        });
      }

      res.status(200).json({
        success: true,
        data: poam,
        message: 'POAM retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getById POAM:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve POAM'
      });
    }
  }

  /**
   * Create new POAM
   */
  async createPOAM(req, res) {
    try {
      // Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const data = {
        ...req.body,
        createdBy: req.user?.id || req.body.createdBy
      };

      const poam = await poamService.createPOAM(data);
      
      res.status(201).json({
        success: true,
        data: poam,
        message: 'POAM created successfully'
      });
    } catch (error) {
      console.error('Error in create POAM:', error);
      
      // Handle specific error types
      if (error.code === '23505') { // PostgreSQL unique violation
        return res.status(409).json({
          success: false,
          error: 'POAM with this ID already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create POAM'
      });
    }
  }

  /**
   * Update POAM
   */
  async updatePOAM(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const id = parseInt(req.params.id, 10);
      const updatedPOAM = await poamService.updatePOAM(id, req.body);
      
      if (!updatedPOAM) {
        return res.status(404).json({
          success: false,
          error: 'POAM not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedPOAM,
        message: 'POAM updated successfully'
      });
    } catch (error) {
      console.error('Error in update POAM:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update POAM'
      });
    }
  }

  /**
   * Delete POAM
   */
  async deletePOAM(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid POAM ID parameter'
        });
      }

      await poamService.deletePOAM(id);
      
      res.status(200).json({
        success: true,
        message: 'POAM deleted successfully'
      });
    } catch (error) {
      console.error('Error in delete POAM:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete POAM'
      });
    }
  }

  /**
   * Get POAM assets
   */
  async getPOAMAssets(req, res) {
    try {
      const { poamId } = req.params;
      const assets = await poamService.getPOAMAssets(poamId);
      
      res.status(200).json({
        success: true,
        data: assets,
        message: `Retrieved ${assets.length} assets for POAM`
      });
    } catch (error) {
      console.error('Error in getAssets:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve POAM assets'
      });
    }
  }

  /**
   * Add asset to POAM
   */
  async addPOAMAsset(req, res) {
    try {
      const { poamId } = req.params;
      const { assetUuid } = req.body;

      if (!assetUuid) {
        return res.status(400).json({
          success: false,
          error: 'Asset UUID is required'
        });
      }

      const result = await poamService.addAssetToPOAM(poamId, assetUuid);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Asset added to POAM successfully'
      });
    } catch (error) {
      console.error('Error in addAsset:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add asset to POAM'
      });
    }
  }

  /**
   * Remove asset from POAM
   */
  async removePOAMAsset(req, res) {
    try {
      const { poamId, assetUuid } = req.params;
      await poamService.removeAssetFromPOAM(poamId, assetUuid);
      
      res.status(200).json({
        success: true,
        message: 'Asset removed from POAM successfully'
      });
    } catch (error) {
      console.error('Error in removeAsset:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to remove asset from POAM'
      });
    }
  }

  /**
   * Get POAM milestones
   */
  async getPOAMMilestones(req, res) {
    try {
      const { poamId } = req.params;
      const milestones = await poamService.getPOAMMilestones(poamId);
      
      res.status(200).json({
        success: true,
        data: milestones,
        message: `Retrieved ${milestones.length} milestones for POAM`
      });
    } catch (error) {
      console.error('Error in getMilestones:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve POAM milestones'
      });
    }
  }

  /**
   * Create POAM milestone
   */
  async addPOAMMilestone(req, res) {
    try {
      const { poamId } = req.params;
      const milestoneData = { ...req.body, poamId };

      const milestone = await poamService.createPOAMMilestone(milestoneData);
      
      res.status(201).json({
        success: true,
        data: milestone,
        message: 'Milestone created successfully'
      });
    } catch (error) {
      console.error('Error in createMilestone:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create milestone'
      });
    }
  }

  /**
   * Update POAM milestone
   */
  async updatePOAMMilestone(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const milestone = await poamService.updatePOAMMilestone(id, req.body);
      
      res.status(200).json({
        success: true,
        data: milestone,
        message: 'Milestone updated successfully'
      });
    } catch (error) {
      console.error('Error in updateMilestone:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update milestone'
      });
    }
  }

  /**
   * Delete POAM milestone
   */
  async deletePOAMMilestone(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      await poamService.deletePOAMMilestone(id);
      
      res.status(200).json({
        success: true,
        message: 'Milestone deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteMilestone:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete milestone'
      });
    }
  }

  /**
   * Get POAM vulnerabilities
   */
  async getVulnerabilities(req, res) {
    try {
      const { poamId } = req.params;
      const vulnerabilities = await poamService.getPOAMVulnerabilities(poamId);
      
      res.status(200).json({
        success: true,
        data: vulnerabilities,
        message: `Retrieved ${vulnerabilities.length} vulnerabilities for POAM`
      });
    } catch (error) {
      console.error('Error in getVulnerabilities:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve POAM vulnerabilities'
      });
    }
  }

  /**
   * Link vulnerability to POAM
   */
  async linkVulnerability(req, res) {
    try {
      const { poamId } = req.params;
      const { vulnerabilityId, relationshipType = 'addresses' } = req.body;

      if (!vulnerabilityId) {
        return res.status(400).json({
          success: false,
          error: 'Vulnerability ID is required'
        });
      }

      const result = await poamService.linkVulnerabilityToPOAM(vulnerabilityId, poamId, relationshipType);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Vulnerability linked to POAM successfully'
      });
    } catch (error) {
      console.error('Error in linkVulnerability:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to link vulnerability to POAM'
      });
    }
  }

  /**
   * Unlink vulnerability from POAM
   */
  async unlinkVulnerability(req, res) {
    try {
      const { poamId, vulnerabilityId } = req.params;
      await poamService.unlinkVulnerabilityFromPOAM(parseInt(vulnerabilityId, 10), poamId);
      
      res.status(200).json({
        success: true,
        message: 'Vulnerability unlinked from POAM successfully'
      });
    } catch (error) {
      console.error('Error in unlinkVulnerability:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to unlink vulnerability from POAM'
      });
    }
  }

  /**
   * Get POAM approval comments
   */
  async getApprovalComments(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const comments = await poamService.getPOAMApprovalComments(id);
      
      res.status(200).json({
        success: true,
        data: comments,
        message: `Retrieved ${comments.length} approval comments`
      });
    } catch (error) {
      console.error('Error in getApprovalComments:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve approval comments'
      });
    }
  }

  /**
   * Add approval comment
   */
  async addApprovalComment(req, res) {
    try {
      const poamId = parseInt(req.params.id, 10);
      const commentData = {
        ...req.body,
        poamId,
        userId: req.user?.id || req.body.userId
      };

      const comment = await poamService.addPOAMApprovalComment(commentData);
      
      res.status(201).json({
        success: true,
        data: comment,
        message: 'Approval comment added successfully'
      });
    } catch (error) {
      console.error('Error in addApprovalComment:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add approval comment'
      });
    }
  }

  /**
   * Get POAM signatures
   */
  async getSignatures(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const signatures = await poamService.getPOAMSignatures(id);
      
      res.status(200).json({
        success: true,
        data: signatures,
        message: `Retrieved ${signatures.length} signatures`
      });
    } catch (error) {
      console.error('Error in getSignatures:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve signatures'
      });
    }
  }

  /**
   * Add signature
   */
  async addSignature(req, res) {
    try {
      const poamId = parseInt(req.params.id, 10);
      const signatureData = {
        ...req.body,
        poamId,
        userId: req.user?.id || req.body.userId,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
      };

      const signature = await poamService.addPOAMSignature(signatureData);
      
      res.status(201).json({
        success: true,
        data: signature,
        message: 'Signature added successfully'
      });
    } catch (error) {
      console.error('Error in addSignature:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add signature'
      });
    }
  }

  /**
   * Update POAM status
   */
  async updatePOAMStatus(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status, statusChangeReason } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid POAM ID parameter'
        });
      }

      const updatedPOAM = await poamService.updatePOAMStatus(id, status, statusChangeReason);
      
      if (!updatedPOAM) {
        return res.status(404).json({
          success: false,
          error: 'POAM not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: updatedPOAM,
        message: 'POAM status updated successfully'
      });
    } catch (error) {
      console.error('Error in updatePOAMStatus:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update POAM status'
      });
    }
  }

  /**
   * Auto-generate POAM from vulnerability
   */
  async generateFromVulnerability(req, res) {
    try {
      const { vulnerabilityId } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!vulnerabilityId) {
        return res.status(400).json({
          success: false,
          error: 'Vulnerability ID is required'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const poam = await poamService.generatePOAMFromVulnerability(vulnerabilityId, userId);
      
      res.status(201).json({
        success: true,
        data: poam,
        message: 'POAM generated from vulnerability successfully'
      });
    } catch (error) {
      console.error('Error in generateFromVulnerability:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate POAM from vulnerability'
      });
    }
  }

  /**
   * Get POAM statistics
   */
  async getPOAMSummary(req, res) {
    try {
      const stats = await poamService.getPOAMStatistics();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'POAM statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getStatistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve POAM statistics'
      });
    }
  }

  /**
   * Get overdue POAMs
   */
  async getOverduePOAMs(req, res) {
    try {
      const overduePOAMs = await poamService.getOverduePOAMs();
      
      res.status(200).json({
        success: true,
        data: overduePOAMs,
        message: `Retrieved ${overduePOAMs.length} overdue POAMs`
      });
    } catch (error) {
      console.error('Error in getOverduePOAMs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve overdue POAMs'
      });
    }
  }

  /**
   * Get POAMs due soon
   */
  async getPOAMsDueSoon(req, res) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const dueSoonPOAMs = await poamService.getPOAMsDueSoon(days);
      
      res.status(200).json({
        success: true,
        data: dueSoonPOAMs,
        message: `Retrieved ${dueSoonPOAMs.length} POAMs due within ${days} days`
      });
    } catch (error) {
      console.error('Error in getPOAMsDueSoon:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve POAMs due soon'
      });
    }
  }
}

module.exports = new POAMController();