const artifactService = require('../services/artifactService');
const Joi = require('joi');
const multer = require('multer');
const mime = require('mime-types');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_ARTIFACT_SIZE) || 50 * 1024 * 1024, // 50MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  }
});

class ArtifactController {

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create a new artifact with file upload
   */
  async createArtifact(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255).trim(),
        description: Joi.string().allow('').trim(),
        associatedControls: Joi.array().items(Joi.string()),
        categories: Joi.array().items(Joi.number().integer()),
        tags: Joi.array().items(Joi.number().integer()),
        metadata: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file uploaded' 
        });
      }

      // Create artifact with file
      const artifactData = {
        ...value,
        mimeType: req.file.mimetype
      };

      const newArtifact = await artifactService.createArtifact(
        artifactData, 
        req.file.buffer, 
        req.user.id
      );

      res.status(201).json({
        message: 'Artifact created successfully',
        data: newArtifact
      });

    } catch (error) {
      console.error('Error creating artifact:', error);
      
      if (error.message.includes('File size exceeds')) {
        return res.status(413).json({ 
          error: 'File too large', 
          message: error.message 
        });
      }
      
      if (error.message.includes('File type') && error.message.includes('not allowed')) {
        return res.status(415).json({ 
          error: 'Unsupported file type', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all artifacts with filtering and pagination
   */
  async getAllArtifacts(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        search: Joi.string().max(255),
        mimeType: Joi.string().max(100),
        reviewStatus: Joi.string().valid('pending', 'approved', 'rejected'),
        uploadedBy: Joi.number().integer(),
        categories: Joi.array().items(Joi.number().integer()),
        tags: Joi.array().items(Joi.number().integer()),
        dateFrom: Joi.date().iso(),
        dateTo: Joi.date().iso(),
        sizeMin: Joi.number().integer().min(0),
        sizeMax: Joi.number().integer().min(0),
        associatedControls: Joi.array().items(Joi.string()),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        sortBy: Joi.string().valid('name', 'fileSize', 'createdAt', 'updatedAt', 'reviewStatus').default('createdAt'),
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

      const result = await artifactService.getAllArtifacts(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Artifacts retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting artifacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get artifact by ID with full details
   */
  async getArtifactById(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ artifactId: parseInt(artifactId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid artifact ID', 
          details: error.details 
        });
      }

      const artifact = await artifactService.getArtifactById(parseInt(artifactId));

      res.json({
        message: 'Artifact retrieved successfully',
        data: artifact
      });

    } catch (error) {
      console.error('Error getting artifact by ID:', error);
      
      if (error.message === 'Artifact not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Artifact not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update artifact metadata
   */
  async updateArtifact(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ artifactId: parseInt(artifactId) });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid artifact ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(255).trim(),
        description: Joi.string().allow('').trim(),
        associatedControls: Joi.array().items(Joi.string()),
        categories: Joi.array().items(Joi.number().integer()),
        tags: Joi.array().items(Joi.number().integer()),
        metadata: Joi.object(),
        expiresAt: Joi.date().iso().allow(null)
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedArtifact = await artifactService.updateArtifact(
        parseInt(artifactId), 
        value, 
        req.user.id
      );

      res.json({
        message: 'Artifact updated successfully',
        data: updatedArtifact
      });

    } catch (error) {
      console.error('Error updating artifact:', error);
      
      if (error.message === 'Artifact not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Artifact not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete artifact
   */
  async deleteArtifact(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ artifactId: parseInt(artifactId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid artifact ID', 
          details: error.details 
        });
      }

      const result = await artifactService.deleteArtifact(parseInt(artifactId), req.user.id);

      res.json({
        message: result.message,
        data: result
      });

    } catch (error) {
      console.error('Error deleting artifact:', error);
      
      if (error.message === 'Artifact not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Artifact not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== FILE OPERATIONS ====================

  /**
   * Download artifact file
   */
  async downloadArtifact(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ artifactId: parseInt(artifactId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid artifact ID', 
          details: error.details 
        });
      }

      const fileInfo = await artifactService.downloadArtifact(parseInt(artifactId), req.user.id);

      // Set appropriate headers
      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Length', fileInfo.fileSize);
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.fileName}"`);

      // Stream the file
      res.sendFile(fileInfo.filePath, (err) => {
        if (err) {
          console.error('Error sending file:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error downloading file' });
          }
        }
      });

    } catch (error) {
      console.error('Error downloading artifact:', error);
      
      if (error.message === 'Artifact not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Artifact not found' 
        });
      }
      
      if (error.message === 'File not found on disk') {
        return res.status(404).json({ 
          error: 'File not found', 
          message: 'File not found on disk' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Replace artifact file
   */
  async replaceArtifactFile(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error } = schema.validate({ artifactId: parseInt(artifactId) });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid artifact ID', 
          details: error.details 
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file uploaded' 
        });
      }

      const updatedArtifact = await artifactService.replaceArtifactFile(
        parseInt(artifactId),
        req.file.buffer,
        req.file.mimetype,
        req.user.id
      );

      res.json({
        message: 'Artifact file replaced successfully',
        data: updatedArtifact
      });

    } catch (error) {
      console.error('Error replacing artifact file:', error);
      
      if (error.message === 'Artifact not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Artifact not found' 
        });
      }
      
      if (error.message.includes('File size exceeds')) {
        return res.status(413).json({ 
          error: 'File too large', 
          message: error.message 
        });
      }
      
      if (error.message.includes('File type') && error.message.includes('not allowed')) {
        return res.status(415).json({ 
          error: 'Unsupported file type', 
          message: error.message 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== REVIEW AND APPROVAL ====================

  /**
   * Review artifact (approve/reject)
   */
  async reviewArtifact(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ artifactId: parseInt(artifactId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid artifact ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        status: Joi.string().valid('approved', 'rejected').required(),
        comments: Joi.string().allow('').trim()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      const reviewedArtifact = await artifactService.reviewArtifact(
        parseInt(artifactId),
        value,
        req.user.id
      );

      res.json({
        message: `Artifact ${value.status} successfully`,
        data: reviewedArtifact
      });

    } catch (error) {
      console.error('Error reviewing artifact:', error);

      if (error.message === 'Artifact not found') {
        return res.status(404).json({
          error: 'Not found',
          message: 'Artifact not found'
        });
      }

      if (error.message.includes('Invalid review status')) {
        return res.status(400).json({
          error: 'Invalid status',
          message: error.message
        });
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get artifacts pending review
   */
  async getPendingReviewArtifacts(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const result = await artifactService.getPendingReviewArtifacts(value);

      res.json({
        message: 'Pending review artifacts retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting pending review artifacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== SEARCH AND ANALYTICS ====================

  /**
   * Advanced search artifacts
   */
  async searchArtifacts(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        q: Joi.string().required().min(1).max(255),
        mimeType: Joi.string().max(100),
        reviewStatus: Joi.string().valid('pending', 'approved', 'rejected'),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details
        });
      }

      const { q: searchQuery, page, limit, ...filters } = value;

      const result = await artifactService.searchArtifacts(
        searchQuery,
        filters,
        { page, limit }
      );

      res.json({
        message: 'Search completed successfully',
        data: result.data,
        pagination: result.pagination,
        searchQuery
      });

    } catch (error) {
      console.error('Error searching artifacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get artifact statistics
   */
  async getArtifactStatistics(req, res) {
    try {
      const statistics = await artifactService.getArtifactStatistics();

      res.json({
        message: 'Artifact statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      console.error('Error getting artifact statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== CATEGORIES AND TAGS ====================

  /**
   * Set artifact categories
   */
  async setArtifactCategories(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ artifactId: parseInt(artifactId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid artifact ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        categoryIds: Joi.array().items(Joi.number().integer()).required()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      await artifactService.setArtifactCategories(parseInt(artifactId), value.categoryIds);

      res.json({
        message: 'Artifact categories updated successfully'
      });

    } catch (error) {
      console.error('Error setting artifact categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Set artifact tags
   */
  async setArtifactTags(req, res) {
    try {
      const { artifactId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        artifactId: Joi.number().integer().required()
      });

      const { error: paramError } = paramSchema.validate({ artifactId: parseInt(artifactId) });
      if (paramError) {
        return res.status(400).json({
          error: 'Invalid artifact ID',
          details: paramError.details
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        tagIds: Joi.array().items(Joi.number().integer()).required()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({
          error: 'Invalid request',
          details: bodyError.details
        });
      }

      await artifactService.setArtifactTags(parseInt(artifactId), value.tagIds);

      res.json({
        message: 'Artifact tags updated successfully'
      });

    } catch (error) {
      console.error('Error setting artifact tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

// Export controller instance and upload middleware
module.exports = {
  artifactController: new ArtifactController(),
  uploadMiddleware: upload.single('file')
};
