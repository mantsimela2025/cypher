const patchService = require('../services/patchService');
const { body, param, query, validationResult } = require('express-validator');

class PatchController {

  // ==================== VALIDATION MIDDLEWARE ====================

  validateCreatePatch() {
    return [
      body('patchId').notEmpty().withMessage('Patch ID is required'),
      body('title').notEmpty().withMessage('Title is required'),
      body('vendor').notEmpty().withMessage('Vendor is required'),
      body('severity').isIn(['critical', 'high', 'medium', 'low', 'informational']).withMessage('Invalid severity'),
      body('type').isIn(['security', 'bug_fix', 'feature', 'enhancement', 'maintenance']).withMessage('Invalid type'),
      body('releaseDate').optional().isISO8601().withMessage('Invalid release date'),
      body('rebootRequired').optional().isBoolean().withMessage('Reboot required must be boolean'),
      body('downloadSize').optional().isInt({ min: 0 }).withMessage('Download size must be positive integer'),
      body('estimatedDowntime').optional().isInt({ min: 0 }).withMessage('Estimated downtime must be positive integer')
    ];
  }

  validateUpdatePatch() {
    return [
      body('title').optional().notEmpty().withMessage('Title cannot be empty'),
      body('severity').optional().isIn(['critical', 'high', 'medium', 'low', 'informational']).withMessage('Invalid severity'),
      body('type').optional().isIn(['security', 'bug_fix', 'feature', 'enhancement', 'maintenance']).withMessage('Invalid type'),
      body('status').optional().isIn(['available', 'pending_approval', 'approved', 'scheduled', 'in_progress', 'completed', 'failed', 'cancelled', 'superseded']).withMessage('Invalid status'),
      body('releaseDate').optional().isISO8601().withMessage('Invalid release date'),
      body('rebootRequired').optional().isBoolean().withMessage('Reboot required must be boolean'),
      body('downloadSize').optional().isInt({ min: 0 }).withMessage('Download size must be positive integer'),
      body('estimatedDowntime').optional().isInt({ min: 0 }).withMessage('Estimated downtime must be positive integer')
    ];
  }

  validatePatchQuery() {
    return [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'releaseDate', 'severity', 'vendor', 'title']).withMessage('Invalid sort field'),
      query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
      query('status').optional(),
      query('severity').optional(),
      query('vendor').optional(),
      query('type').optional(),
      query('search').optional().isLength({ min: 2 }).withMessage('Search term must be at least 2 characters'),
      query('rebootRequired').optional().isBoolean().withMessage('Reboot required must be boolean'),
      query('releaseDateFrom').optional().isISO8601().withMessage('Invalid from date'),
      query('releaseDateTo').optional().isISO8601().withMessage('Invalid to date'),
      query('superseded').optional().isBoolean().withMessage('Superseded must be boolean')
    ];
  }

  validateUUID() {
    return [
      param('id').isUUID().withMessage('Invalid UUID format')
    ];
  }

  validatePatchVulnerabilityLink() {
    return [
      body('vulnerabilityIds').isArray({ min: 1 }).withMessage('Vulnerability IDs array is required'),
      body('vulnerabilityIds.*').isInt({ min: 1 }).withMessage('Each vulnerability ID must be positive integer')
    ];
  }

  validatePatchAssetLink() {
    return [
      body('assetUuids').isArray({ min: 1 }).withMessage('Asset UUIDs array is required'),
      body('assetUuids.*').isUUID().withMessage('Each asset UUID must be valid')
    ];
  }

  validateAssetStatusUpdate() {
    return [
      body('status').isIn(['pending', 'success', 'failed', 'cancelled']).withMessage('Invalid status'),
      body('notes').optional().isString().withMessage('Notes must be string')
    ];
  }

  // ==================== CRUD OPERATIONS ====================

  async createPatch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const result = await patchService.createPatch(req.body, req.user.id);
      
      res.status(201).json({
        message: 'Patch created successfully',
        data: result
      });
    } catch (error) {
      console.error('Error creating patch:', error);
      if (error.code === '23505') { // Duplicate key error
        return res.status(409).json({ error: 'Patch ID already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatches(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      // Extract and validate pagination parameters
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      // Extract filters
      const filters = {};
      if (req.query.status) {
        filters.status = Array.isArray(req.query.status) ? req.query.status : [req.query.status];
      }
      if (req.query.severity) {
        filters.severity = Array.isArray(req.query.severity) ? req.query.severity : [req.query.severity];
      }
      if (req.query.vendor) {
        filters.vendor = Array.isArray(req.query.vendor) ? req.query.vendor : [req.query.vendor];
      }
      if (req.query.type) {
        filters.type = Array.isArray(req.query.type) ? req.query.type : [req.query.type];
      }
      if (req.query.search) {
        filters.search = req.query.search;
      }
      if (req.query.rebootRequired !== undefined) {
        filters.rebootRequired = req.query.rebootRequired === 'true';
      }
      if (req.query.releaseDateFrom) {
        filters.releaseDateFrom = new Date(req.query.releaseDateFrom);
      }
      if (req.query.releaseDateTo) {
        filters.releaseDateTo = new Date(req.query.releaseDateTo);
      }
      if (req.query.businessImpact) {
        filters.businessImpact = req.query.businessImpact;
      }
      if (req.query.technicalComplexity) {
        filters.technicalComplexity = req.query.technicalComplexity;
      }
      if (req.query.cveId) {
        filters.cveId = req.query.cveId;
      }
      if (req.query.superseded !== undefined) {
        filters.superseded = req.query.superseded === 'true';
      }

      const result = await patchService.getPatches(filters, pagination);
      res.json(result);
    } catch (error) {
      console.error('Error fetching patches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatchById(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchService.getPatchById(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch not found' });
      }
      
      res.json({ data: result });
    } catch (error) {
      console.error('Error fetching patch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePatch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchService.updatePatch(id, req.body, req.user.id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch not found' });
      }
      
      res.json({
        message: 'Patch updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating patch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deletePatch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id } = req.params;
      const result = await patchService.deletePatch(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch not found' });
      }
      
      res.json({ message: 'Patch deleted successfully' });
    } catch (error) {
      console.error('Error deleting patch:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== PATCH VULNERABILITY MAPPING ====================

  async linkPatchToVulnerabilities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: patchId } = req.params;
      const { vulnerabilityIds } = req.body;

      const result = await patchService.linkPatchToVulnerabilities(patchId, vulnerabilityIds, req.user.id);
      
      res.status(201).json({
        message: 'Vulnerabilities linked to patch successfully',
        data: result
      });
    } catch (error) {
      console.error('Error linking patch to vulnerabilities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async unlinkPatchFromVulnerability(req, res) {
    try {
      const { id: patchId, vulnerabilityId } = req.params;

      const result = await patchService.unlinkPatchFromVulnerability(patchId, parseInt(vulnerabilityId));
      
      if (!result) {
        return res.status(404).json({ error: 'Patch-vulnerability mapping not found' });
      }
      
      res.json({ message: 'Vulnerability unlinked from patch successfully' });
    } catch (error) {
      console.error('Error unlinking patch from vulnerability:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatchVulnerabilities(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: patchId } = req.params;
      const result = await patchService.getPatchVulnerabilities(patchId);
      
      res.json({
        data: result,
        count: result.length
      });
    } catch (error) {
      console.error('Error fetching patch vulnerabilities:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== PATCH ASSET MAPPING ====================

  async linkPatchToAssets(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: patchId } = req.params;
      const { assetUuids } = req.body;

      const result = await patchService.linkPatchToAssets(patchId, assetUuids, req.user.id);
      
      res.status(201).json({
        message: 'Assets linked to patch successfully',
        data: result
      });
    } catch (error) {
      console.error('Error linking patch to assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePatchAssetStatus(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: patchId, assetUuid } = req.params;
      const { status, notes } = req.body;

      const result = await patchService.updatePatchAssetStatus(patchId, assetUuid, status, notes);
      
      if (!result) {
        return res.status(404).json({ error: 'Patch-asset mapping not found' });
      }
      
      res.json({
        message: 'Patch asset status updated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error updating patch asset status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPatchAssets(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        });
      }

      const { id: patchId } = req.params;
      
      // Extract filters
      const filters = {};
      if (req.query.isInstalled !== undefined) {
        filters.isInstalled = req.query.isInstalled === 'true';
      }
      if (req.query.isApplicable !== undefined) {
        filters.isApplicable = req.query.isApplicable === 'true';
      }

      const result = await patchService.getPatchAssets(patchId, filters);
      
      res.json({
        data: result,
        count: result.length
      });
    } catch (error) {
      console.error('Error fetching patch assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getPatchAnalytics(req, res) {
    try {
      // Extract filters for analytics
      const filters = {};
      if (req.query.vendor) {
        filters.vendor = req.query.vendor;
      }
      if (req.query.severity) {
        filters.severity = req.query.severity;
      }
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }

      const result = await patchService.getPatchAnalytics(filters);
      
      res.json({
        message: 'Patch analytics retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching patch analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getComplianceReport(req, res) {
    try {
      // Extract filters for compliance report
      const filters = {};
      if (req.query.frameworks) {
        filters.frameworks = Array.isArray(req.query.frameworks) ? req.query.frameworks : [req.query.frameworks];
      }
      if (req.query.dateFrom) {
        filters.dateFrom = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filters.dateTo = new Date(req.query.dateTo);
      }

      const result = await patchService.getComplianceReport(filters);
      
      res.json({
        message: 'Compliance report retrieved successfully',
        data: result
      });
    } catch (error) {
      console.error('Error fetching compliance report:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BULK OPERATIONS ====================

  async bulkUpdatePatchStatus(req, res) {
    try {
      const { patchIds, status } = req.body;

      if (!Array.isArray(patchIds) || patchIds.length === 0) {
        return res.status(400).json({ error: 'Patch IDs array is required' });
      }

      if (!['available', 'pending_approval', 'approved', 'scheduled', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const results = await Promise.all(
        patchIds.map(patchId => patchService.updatePatch(patchId, { status }, req.user.id))
      );

      const successCount = results.filter(result => result !== null).length;
      
      res.json({
        message: `${successCount} patches updated successfully`,
        successCount,
        totalCount: patchIds.length
      });
    } catch (error) {
      console.error('Error bulk updating patch status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async bulkDeletePatches(req, res) {
    try {
      const { patchIds } = req.body;

      if (!Array.isArray(patchIds) || patchIds.length === 0) {
        return res.status(400).json({ error: 'Patch IDs array is required' });
      }

      const results = await Promise.all(
        patchIds.map(patchId => patchService.deletePatch(patchId))
      );

      const successCount = results.filter(result => result !== null).length;
      
      res.json({
        message: `${successCount} patches deleted successfully`,
        successCount,
        totalCount: patchIds.length
      });
    } catch (error) {
      console.error('Error bulk deleting patches:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new PatchController();