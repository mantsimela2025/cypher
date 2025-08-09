const documentsService = require('../services/documentsService');
const Joi = require('joi');

class DocumentsController {

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create a new document
   */
  async createDocument(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255).trim(),
        originalName: Joi.string().required().max(255).trim(),
        size: Joi.number().integer().min(0).required(),
        mimeType: Joi.string().required().max(100),
        url: Joi.string().required().uri(),
        objectPath: Joi.string().required().max(500),
        folderId: Joi.string().uuid().allow(null),
        tags: Joi.array().items(Joi.string().max(50)).default([])
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newDocument = await documentsService.createDocument(value, req.user.id);

      res.status(201).json({
        message: 'Document created successfully',
        data: newDocument
      });

    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get all documents with filtering and pagination
   */
  async getAllDocuments(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        search: Joi.string().max(255),
        mimeType: Joi.string().max(100),
        folderId: Joi.string().uuid().allow(null),
        userId: Joi.string().uuid(),
        tags: Joi.array().items(Joi.string().max(50)),
        sizeMin: Joi.number().integer().min(0),
        sizeMax: Joi.number().integer().min(0),
        dateFrom: Joi.date().iso(),
        dateTo: Joi.date().iso(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(50),
        sortBy: Joi.string().valid('name', 'size', 'createdAt', 'updatedAt', 'mimeType').default('createdAt'),
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

      const result = await documentsService.getAllDocuments(
        filters, 
        { page, limit, sortBy, sortOrder }
      );

      res.json({
        message: 'Documents retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      console.error('Error getting documents:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get document by ID with full details
   */
  async getDocumentById(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error } = schema.validate({ documentId });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: error.details 
        });
      }

      const document = await documentsService.getDocumentById(documentId);

      // Track view action
      await documentsService.trackDocumentAction(documentId, 'view', req.user.id);

      res.json({
        message: 'Document retrieved successfully',
        data: document
      });

    } catch (error) {
      console.error('Error getting document by ID:', error);
      
      if (error.message === 'Document not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Document not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update document
   */
  async updateDocument(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error: paramError } = paramSchema.validate({ documentId });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().max(255).trim(),
        folderId: Joi.string().uuid().allow(null),
        tags: Joi.array().items(Joi.string().max(50))
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const updatedDocument = await documentsService.updateDocument(
        documentId, 
        value, 
        req.user.id
      );

      res.json({
        message: 'Document updated successfully',
        data: updatedDocument
      });

    } catch (error) {
      console.error('Error updating document:', error);
      
      if (error.message === 'Document not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Document not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error } = schema.validate({ documentId });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: error.details 
        });
      }

      const result = await documentsService.deleteDocument(documentId, req.user.id);

      res.json({
        message: result.message,
        data: result
      });

    } catch (error) {
      console.error('Error deleting document:', error);
      
      if (error.message === 'Document not found') {
        return res.status(404).json({ 
          error: 'Not found', 
          message: 'Document not found' 
        });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== VERSION MANAGEMENT ====================

  /**
   * Get document versions
   */
  async getDocumentVersions(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error } = schema.validate({ documentId });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: error.details 
        });
      }

      const versions = await documentsService.getDocumentVersions(documentId);

      res.json({
        message: 'Document versions retrieved successfully',
        data: versions
      });

    } catch (error) {
      console.error('Error getting document versions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Create new document version
   */
  async createDocumentVersion(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error: paramError } = paramSchema.validate({ documentId });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        name: Joi.string().required().max(255).trim(),
        originalName: Joi.string().required().max(255).trim(),
        size: Joi.number().integer().min(0).required(),
        mimeType: Joi.string().required().max(100),
        url: Joi.string().required().uri(),
        checksum: Joi.string().max(100),
        changeType: Joi.string().valid('minor', 'major', 'patch').default('minor'),
        changeDescription: Joi.string().max(500).default('')
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      // Get current latest version to determine next version number
      const latestVersion = await documentsService.getLatestDocumentVersion(documentId);
      const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

      const newVersion = await documentsService.createDocumentVersion({
        ...value,
        documentId,
        versionNumber: nextVersionNumber
      }, req.user.id);

      res.status(201).json({
        message: 'Document version created successfully',
        data: newVersion
      });

    } catch (error) {
      console.error('Error creating document version:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== COMMENTS MANAGEMENT ====================

  /**
   * Get document comments
   */
  async getDocumentComments(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error } = schema.validate({ documentId });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: error.details 
        });
      }

      const comments = await documentsService.getDocumentComments(documentId);

      res.json({
        message: 'Document comments retrieved successfully',
        data: comments
      });

    } catch (error) {
      console.error('Error getting document comments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Add comment to document
   */
  async addDocumentComment(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const paramSchema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error: paramError } = paramSchema.validate({ documentId });
      if (paramError) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: paramError.details 
        });
      }

      // Validate request body
      const bodySchema = Joi.object({
        content: Joi.string().required().max(2000).trim()
      });

      const { error: bodyError, value } = bodySchema.validate(req.body);
      if (bodyError) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: bodyError.details 
        });
      }

      const newComment = await documentsService.addDocumentComment(
        documentId, 
        value.content, 
        req.user.id
      );

      res.status(201).json({
        message: 'Comment added successfully',
        data: newComment
      });

    } catch (error) {
      console.error('Error adding document comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== ANALYTICS AND TRACKING ====================

  /**
   * Get document analytics
   */
  async getDocumentAnalytics(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error } = schema.validate({ documentId });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: error.details 
        });
      }

      const analytics = await documentsService.getDocumentAnalytics(documentId);

      res.json({
        message: 'Document analytics retrieved successfully',
        data: analytics
      });

    } catch (error) {
      console.error('Error getting document analytics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Track document download
   */
  async trackDocumentDownload(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error } = schema.validate({ documentId });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: error.details 
        });
      }

      // Track download action
      await documentsService.trackDocumentAction(documentId, 'download', req.user.id);

      res.json({
        message: 'Download tracked successfully'
      });

    } catch (error) {
      console.error('Error tracking document download:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get document change history
   */
  async getDocumentChangeHistory(req, res) {
    try {
      const { documentId } = req.params;

      // Validate parameters
      const schema = Joi.object({
        documentId: Joi.string().uuid().required()
      });

      const { error } = schema.validate({ documentId });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid document ID', 
          details: error.details 
        });
      }

      const changes = await documentsService.getDocumentChangeHistory(documentId);

      res.json({
        message: 'Document change history retrieved successfully',
        data: changes
      });

    } catch (error) {
      console.error('Error getting document change history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Create document template
   */
  async createDocumentTemplate(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        name: Joi.string().required().max(255).trim(),
        description: Joi.string().allow('').max(1000).trim(),
        category: Joi.string().required().max(100).trim(),
        thumbnailUrl: Joi.string().uri().allow(''),
        templateUrl: Joi.string().required().uri(),
        isPublic: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const newTemplate = await documentsService.createDocumentTemplate(value, req.user.id);

      res.status(201).json({
        message: 'Document template created successfully',
        data: newTemplate
      });

    } catch (error) {
      console.error('Error creating document template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get document templates
   */
  async getDocumentTemplates(req, res) {
    try {
      // Validate query parameters
      const schema = Joi.object({
        category: Joi.string().max(100),
        isPublic: Joi.boolean(),
        userId: Joi.string().uuid()
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid parameters', 
          details: error.details 
        });
      }

      const templates = await documentsService.getDocumentTemplates(value);

      res.json({
        message: 'Document templates retrieved successfully',
        data: templates
      });

    } catch (error) {
      console.error('Error getting document templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get document statistics
   */
  async getDocumentStatistics(req, res) {
    try {
      const statistics = await documentsService.getDocumentStatistics();

      res.json({
        message: 'Document statistics retrieved successfully',
        data: statistics
      });

    } catch (error) {
      console.error('Error getting document statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk delete documents
   */
  async bulkDeleteDocuments(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        documentIds: Joi.array().items(Joi.string().uuid()).min(1).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each document deletion
      for (const documentId of value.documentIds) {
        try {
          const result = await documentsService.deleteDocument(documentId, req.user.id);
          results.successful.push({ id: documentId, message: result.message });
        } catch (error) {
          results.failed.push({ id: documentId, error: error.message });
        }
      }

      res.json({
        message: `Bulk delete completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
        data: results
      });

    } catch (error) {
      console.error('Error bulk deleting documents:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Bulk update document folders
   */
  async bulkUpdateFolder(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        documentIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
        folderId: Joi.string().uuid().allow(null).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each document update
      for (const documentId of value.documentIds) {
        try {
          const result = await documentsService.updateDocument(
            documentId, 
            { folderId: value.folderId }, 
            req.user.id
          );
          results.successful.push({ id: documentId, data: result });
        } catch (error) {
          results.failed.push({ id: documentId, error: error.message });
        }
      }

      res.json({
        message: `Bulk folder update completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
        data: results
      });

    } catch (error) {
      console.error('Error bulk updating document folders:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Bulk update document tags
   */
  async bulkUpdateTags(req, res) {
    try {
      // Validate request body
      const schema = Joi.object({
        documentIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
        tags: Joi.array().items(Joi.string().max(50)).required(),
        operation: Joi.string().valid('replace', 'add', 'remove').default('replace')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid request', 
          details: error.details 
        });
      }

      const results = {
        successful: [],
        failed: []
      };

      // Process each document update
      for (const documentId of value.documentIds) {
        try {
          let newTags = value.tags;
          
          if (value.operation !== 'replace') {
            // Get current document to modify tags
            const currentDoc = await documentsService.getDocumentById(documentId);
            const currentTags = currentDoc.tags || [];
            
            if (value.operation === 'add') {
              newTags = [...new Set([...currentTags, ...value.tags])];
            } else if (value.operation === 'remove') {
              newTags = currentTags.filter(tag => !value.tags.includes(tag));
            }
          }

          const result = await documentsService.updateDocument(
            documentId, 
            { tags: newTags }, 
            req.user.id
          );
          results.successful.push({ id: documentId, data: result });
        } catch (error) {
          results.failed.push({ id: documentId, error: error.message });
        }
      }

      res.json({
        message: `Bulk tags update completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
        data: results
      });

    } catch (error) {
      console.error('Error bulk updating document tags:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new DocumentsController();