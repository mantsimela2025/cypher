const stigService = require('../services/stigService');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/xml' || file.mimetype === 'application/xml' || file.originalname.endsWith('.xml')) {
      cb(null, true);
    } else {
      cb(new Error('Only XML files are allowed'), false);
    }
  }
});

class StigController {

  // ==================== STIG LIBRARY OPERATIONS ====================

  /**
   * Create STIG library entry
   */
  async createStigLibraryEntry(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        stigId: Joi.string().required().max(50).trim(),
        title: Joi.string().required().trim(),
        description: Joi.string().required().trim(),
        version: Joi.string().required().max(20).trim(),
        releaseDate: Joi.date().iso(),
        category: Joi.string().max(100).trim(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
        status: Joi.string().valid('active', 'deprecated', 'draft', 'superseded').default('active'),
        implementationGuidance: Joi.string().trim(),
        verificationText: Joi.string().trim(),
        riskAssessment: Joi.string().trim(),
        platforms: Joi.array().items(Joi.string()),
        refLinks: Joi.array().items(Joi.object()),
        checkContent: Joi.string().trim(),
        fixText: Joi.string().trim(),
        cciReferences: Joi.array().items(Joi.string()),
        nistReferences: Joi.array().items(Joi.string()),
        stigBenchmark: Joi.string().max(100).trim(),
        ruleId: Joi.string().max(100).trim(),
        vulnId: Joi.string().max(100).trim(),
        groupId: Joi.string().max(100).trim(),
        weight: Joi.number().min(0).max(10),
        iaControls: Joi.array().items(Joi.string()),
        automationSupported: Joi.boolean().default(false),
        requiresManualReview: Joi.boolean().default(true),
        estimatedFixTime: Joi.number().integer().min(0),
        businessImpact: Joi.string().valid('low', 'medium', 'high'),
        technicalComplexity: Joi.string().valid('low', 'medium', 'high'),
        prerequisites: Joi.array().items(Joi.string()),
        complianceFrameworks: Joi.array().items(Joi.string()),
        tags: Joi.array().items(Joi.string()),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newStig = await stigService.createStigLibraryEntry(value, req.user.id);

      res.status(201).json({
        message: 'STIG library entry created successfully',
        data: newStig
      });

    } catch (error) {
      console.error('Error creating STIG library entry:', error);
      
      if (error.message.includes('duplicate key')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: 'STIG ID already exists' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all STIG library entries
   */
  async getAllStigLibraryEntries(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        category: Joi.string().max(100),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
        status: Joi.string().valid('active', 'deprecated', 'draft', 'superseded'),
        platform: Joi.string().max(50),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'severity', 'category', 'releaseDate').default('createdAt'),
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

      const result = await stigService.getAllStigLibraryEntries(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'STIG library entries retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting STIG library entries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get STIG library entry by ID
   */
  async getStigLibraryEntryById(req, res) {
    try {
      const { stigId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        stigId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ stigId: parseInt(stigId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid STIG ID', 
          details: error.details 
        });
      }

      const stig = await stigService.getStigLibraryEntryById(parseInt(stigId));

      res.json({
        message: 'STIG library entry retrieved successfully',
        data: stig
      });

    } catch (error) {
      console.error('Error getting STIG library entry by ID:', error);
      
      if (error.message === 'STIG library entry not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'STIG library entry not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update STIG library entry
   */
  async updateStigLibraryEntry(req, res) {
    try {
      const { stigId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        stigId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ stigId: parseInt(stigId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid STIG ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        title: Joi.string().trim(),
        description: Joi.string().trim(),
        version: Joi.string().max(20).trim(),
        releaseDate: Joi.date().iso(),
        category: Joi.string().max(100).trim(),
        severity: Joi.string().valid('low', 'medium', 'high', 'critical'),
        status: Joi.string().valid('active', 'deprecated', 'draft', 'superseded'),
        implementationGuidance: Joi.string().trim(),
        verificationText: Joi.string().trim(),
        riskAssessment: Joi.string().trim(),
        platforms: Joi.array().items(Joi.string()),
        refLinks: Joi.array().items(Joi.object()),
        checkContent: Joi.string().trim(),
        fixText: Joi.string().trim(),
        cciReferences: Joi.array().items(Joi.string()),
        nistReferences: Joi.array().items(Joi.string()),
        automationSupported: Joi.boolean(),
        requiresManualReview: Joi.boolean(),
        estimatedFixTime: Joi.number().integer().min(0),
        businessImpact: Joi.string().valid('low', 'medium', 'high'),
        technicalComplexity: Joi.string().valid('low', 'medium', 'high'),
        prerequisites: Joi.array().items(Joi.string()),
        complianceFrameworks: Joi.array().items(Joi.string()),
        tags: Joi.array().items(Joi.string()),
        metadata: Joi.object()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedStig = await stigService.updateStigLibraryEntry(parseInt(stigId), value, req.user.id);

      res.json({
        message: 'STIG library entry updated successfully',
        data: updatedStig
      });

    } catch (error) {
      console.error('Error updating STIG library entry:', error);
      
      if (error.message === 'STIG library entry not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'STIG library entry not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete STIG library entry
   */
  async deleteStigLibraryEntry(req, res) {
    try {
      const { stigId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        stigId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ stigId: parseInt(stigId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid STIG ID', 
          details: error.details 
        });
      }

      const result = await stigService.deleteStigLibraryEntry(parseInt(stigId), req.user.id);

      res.json({
        message: 'STIG library entry deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting STIG library entry:', error);
      
      if (error.message === 'STIG library entry not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'STIG library entry not found' 
        });
      }

      if (error.message.includes('Cannot delete STIG that is being used')) {
        return res.status(409).json({ 
          error: 'Conflict', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== STIG CHECKLIST OPERATIONS ====================

  /**
   * Create STIG checklist
   */
  async createStigChecklist(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        assetId: Joi.number().integer().required(),
        benchmarkId: Joi.string().required().max(255).trim(),
        title: Joi.string().required().max(255).trim(),
        version: Joi.string().max(255).trim(),
        releaseInfo: Joi.string().max(255).trim(),
        targetType: Joi.string().max(255).trim(),
        assignedTo: Joi.number().integer(),
        dueDate: Joi.date().iso(),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
        estimatedEffort: Joi.number().integer().min(0),
        scanFrequency: Joi.string().valid('daily', 'weekly', 'monthly'),
        automatedScanEnabled: Joi.boolean().default(false),
        businessJustification: Joi.string().trim(),
        technicalJustification: Joi.string().trim(),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const newChecklist = await stigService.createStigChecklist(value, req.user.id);

      res.status(201).json({
        message: 'STIG checklist created successfully',
        data: newChecklist
      });

    } catch (error) {
      console.error('Error creating STIG checklist:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all STIG checklists
   */
  async getAllStigChecklists(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        assetId: Joi.number().integer(),
        status: Joi.string().valid('not_started', 'in_progress', 'completed', 'reviewed', 'approved', 'rejected'),
        assignedTo: Joi.number().integer(),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
        search: Joi.string().max(100),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'status', 'priority', 'dueDate').default('createdAt'),
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

      const result = await stigService.getAllStigChecklists(
        filters,
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'STIG checklists retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting STIG checklists:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get STIG checklist by ID
   */
  async getStigChecklistById(req, res) {
    try {
      const { checklistId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        checklistId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ checklistId: parseInt(checklistId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid checklist ID',
          details: error.details
        });
      }

      const checklist = await stigService.getStigChecklistById(parseInt(checklistId));

      res.json({
        message: 'STIG checklist retrieved successfully',
        data: checklist
      });

    } catch (error) {
      console.error('Error getting STIG checklist by ID:', error);

      if (error.message === 'STIG checklist not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'STIG checklist not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update STIG checklist
   */
  async updateStigChecklist(req, res) {
    try {
      const { checklistId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        checklistId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ checklistId: parseInt(checklistId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid checklist ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        title: Joi.string().max(255).trim(),
        version: Joi.string().max(255).trim(),
        status: Joi.string().valid('not_started', 'in_progress', 'completed', 'reviewed', 'approved', 'rejected'),
        assignedTo: Joi.number().integer(),
        reviewedBy: Joi.number().integer(),
        dueDate: Joi.date().iso(),
        priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
        estimatedEffort: Joi.number().integer().min(0),
        actualEffort: Joi.number().integer().min(0),
        businessJustification: Joi.string().trim(),
        technicalJustification: Joi.string().trim(),
        compensatingControls: Joi.string().trim(),
        residualRisk: Joi.string().valid('low', 'medium', 'high', 'critical'),
        mitigation: Joi.string().trim(),
        metadata: Joi.object()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const updatedChecklist = await stigService.updateStigChecklist(parseInt(checklistId), value, req.user.id);

      res.json({
        message: 'STIG checklist updated successfully',
        data: updatedChecklist
      });

    } catch (error) {
      console.error('Error updating STIG checklist:', error);

      if (error.message === 'STIG checklist not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'STIG checklist not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete STIG checklist
   */
  async deleteStigChecklist(req, res) {
    try {
      const { checklistId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        checklistId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ checklistId: parseInt(checklistId) });
      if (error) {
        return res.status(400).json({
          error: 'Invalid checklist ID',
          details: error.details
        });
      }

      const result = await stigService.deleteStigChecklist(parseInt(checklistId), req.user.id);

      res.json({
        message: 'STIG checklist deleted successfully',
        data: result
      });

    } catch (error) {
      console.error('Error deleting STIG checklist:', error);

      if (error.message === 'STIG checklist not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'STIG checklist not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Assign STIG checklist
   */
  async assignStigChecklist(req, res) {
    try {
      const { checklistId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        checklistId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ checklistId: parseInt(checklistId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid checklist ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        assignedTo: Joi.number().integer().required()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const assignedChecklist = await stigService.assignStigChecklist(parseInt(checklistId), value.assignedTo, req.user.id);

      res.json({
        message: 'STIG checklist assigned successfully',
        data: assignedChecklist
      });

    } catch (error) {
      console.error('Error assigning STIG checklist:', error);

      if (error.message === 'STIG checklist not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'STIG checklist not found'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get STIG analytics
   */
  async getStigAnalytics(req, res) {
    try {
      const analytics = await stigService.getStigAnalytics();

      res.json({
        message: 'STIG analytics retrieved successfully',
        data: analytics
      });

    } catch (error) {
      console.error('Error getting STIG analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

  /**
   * Import STIG from XML file
   */
  async importStigFromXml(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'XML file is required'
        });
      }

      const xmlContent = req.file.buffer.toString('utf8');
      const result = await stigService.importStigFromXml(xmlContent, req.user.id);

      res.status(201).json({
        message: 'STIG imported from XML successfully',
        data: result
      });

    } catch (error) {
      console.error('Error importing STIG from XML:', error);

      if (error.message.includes('XML parsing')) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Invalid XML format'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Download STIG from DISA repository
   */
  async downloadStigFromDisa(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        stigIdentifier: Joi.string().required().trim(),
        version: Joi.string().trim(),
        autoImport: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Invalid request',
          details: error.details
        });
      }

      const downloadedStig = await stigService.downloadStigFromDisa(value.stigIdentifier, req.user.id);

      res.status(201).json({
        message: 'STIG downloaded from DISA successfully',
        data: downloadedStig
      });

    } catch (error) {
      console.error('Error downloading STIG from DISA:', error);

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not found',
          message: 'STIG not found in DISA repository'
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

}

// Export multer upload middleware for XML import
StigController.uploadXml = upload.single('xmlFile');

module.exports = new StigController();
