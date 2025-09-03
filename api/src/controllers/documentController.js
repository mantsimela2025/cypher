const documentService = require('../services/documentService');
const emailService = require('../services/emailService');
const Joi = require('joi');
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_DOCUMENT_SIZE) || 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types - validation happens in service
    cb(null, true);
  }
});

class DocumentController {

  // ==================== DOCUMENT UPLOAD ====================

  /**
   * Upload single document
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file provided',
          message: 'Please select a file to upload'
        });
      }

      // Validate request body
      const schema = Joi.object({
        folderId: Joi.string().uuid().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        description: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.details 
        });
      }

      // Upload document
      const document = await documentService.uploadDocument(
        req.file.buffer,
        req.file.originalname,
        req.user.id,
        {
          folderId: value.folderId,
          tags: value.tags || [],
          description: value.description
        }
      );

      res.status(201).json({
        success: true,
        message: 'Document uploaded successfully',
        data: document
      });

    } catch (error) {
      console.error('❌ Error uploading document:', error);
      
      if (error.message.includes('File size exceeds')) {
        return res.status(413).json({ 
          error: 'File too large', 
          message: error.message 
        });
      }
      
      if (error.message.includes('not allowed')) {
        return res.status(415).json({ 
          error: 'Unsupported file type', 
          message: error.message 
        });
      }
      
      res.status(500).json({ 
        error: 'Upload failed',
        message: 'An error occurred while uploading the document'
      });
    }
  }

  /**
   * Upload multiple documents
   */
  async uploadMultipleDocuments(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ 
          error: 'No files provided',
          message: 'Please select files to upload'
        });
      }

      const uploadPromises = req.files.map(file => 
        documentService.uploadDocument(
          file.buffer,
          file.originalname,
          req.user.id,
          {
            folderId: req.body.folderId,
            tags: req.body.tags ? JSON.parse(req.body.tags) : []
          }
        )
      );

      const documents = await Promise.all(uploadPromises);

      res.status(201).json({
        success: true,
        message: `${documents.length} documents uploaded successfully`,
        data: documents
      });

    } catch (error) {
      console.error('❌ Error uploading multiple documents:', error);
      res.status(500).json({ 
        error: 'Upload failed',
        message: 'An error occurred while uploading documents'
      });
    }
  }

  // ==================== DOCUMENT RETRIEVAL ====================

  /**
   * Get document by ID
   */
  async getDocument(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ 
          error: 'Document ID required' 
        });
      }

      const document = await documentService.getDocument(id, req.user.id);
      
      res.json({
        success: true,
        data: document
      });

    } catch (error) {
      console.error('❌ Error retrieving document:', error);
      
      if (error.message === 'Document not found') {
        return res.status(404).json({ 
          error: 'Document not found' 
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to retrieve document' 
      });
    }
  }

  /**
   * Get signed URL for document download
   */
  async getDownloadUrl(req, res) {
    try {
      const { id } = req.params;
      const expiresIn = parseInt(req.query.expires) || 3600; // 1 hour default

      const signedUrl = await documentService.getSignedUrl(id, req.user.id, expiresIn);
      
      res.json({
        success: true,
        data: {
          downloadUrl: signedUrl,
          expiresIn: expiresIn
        }
      });

    } catch (error) {
      console.error('❌ Error generating download URL:', error);
      res.status(500).json({ 
        error: 'Failed to generate download URL' 
      });
    }
  }

  // ==================== DOCUMENT SHARING ====================

  /**
   * Email document to recipients
   */
  async emailDocument(req, res) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const schema = Joi.object({
        recipients: Joi.array().items(Joi.string().email()).min(1).required(),
        subject: Joi.string().optional(),
        message: Joi.string().optional(),
        includeLink: Joi.boolean().default(true),
        includeAttachment: Joi.boolean().default(false)
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.details 
        });
      }

      // Get document details
      const document = await documentService.getDocument(id, req.user.id);
      
      // Generate download link if requested
      let downloadLink = null;
      if (value.includeLink) {
        downloadLink = await documentService.getSignedUrl(id, req.user.id, 7 * 24 * 3600); // 7 days
      }

      // Prepare email content
      const subject = value.subject || `Document shared: ${document.name}`;
      const message = `
        <h3>Document Shared: ${document.name}</h3>
        <p>${value.message || 'A document has been shared with you.'}</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0;">Document Details:</h4>
          <p><strong>Name:</strong> ${document.name}</p>
          <p><strong>Size:</strong> ${this.formatFileSize(document.size)}</p>
          <p><strong>Type:</strong> ${document.mimeType}</p>
          <p><strong>Uploaded:</strong> ${new Date(document.createdAt).toLocaleDateString()}</p>
        </div>
        
        ${downloadLink ? `
          <div style="margin: 20px 0;">
            <a href="${downloadLink}" 
               style="background: #6576ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              📄 Download Document
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 10px;">
              This link will expire in 7 days.
            </p>
          </div>
        ` : ''}
        
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          This document was shared from the CYPHER Document Management System.
        </p>
      `;

      // Send emails to all recipients
      const emailPromises = value.recipients.map(recipient => 
        emailService.sendNotificationEmail(recipient, subject, message)
      );

      await Promise.all(emailPromises);

      // Log sharing analytics
      await documentService.logAnalytics(id, req.user.id, 'share', {
        recipients: value.recipients,
        includeLink: value.includeLink,
        includeAttachment: value.includeAttachment
      });

      res.json({
        success: true,
        message: `Document shared with ${value.recipients.length} recipient(s)`,
        data: {
          recipients: value.recipients,
          downloadLink: downloadLink
        }
      });

    } catch (error) {
      console.error('❌ Error emailing document:', error);
      res.status(500).json({ 
        error: 'Failed to email document',
        message: error.message 
      });
    }
  }

  // ==================== VERSION MANAGEMENT ====================

  /**
   * Create new version of document
   */
  async createVersion(req, res) {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file provided' 
        });
      }

      const schema = Joi.object({
        changeDescription: Joi.string().optional()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.details 
        });
      }

      const version = await documentService.createVersion(
        id,
        req.file.buffer,
        req.user.id,
        value.changeDescription || 'Updated document'
      );

      res.json({
        success: true,
        message: 'New document version created',
        data: version
      });

    } catch (error) {
      console.error('❌ Error creating document version:', error);
      res.status(500).json({ 
        error: 'Failed to create document version' 
      });
    }
  }

  // ==================== HELPER METHODS ====================

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export multer middleware and controller
const documentController = new DocumentController();

module.exports = {
  documentController,
  uploadSingle: upload.single('document'),
  uploadMultiple: upload.array('documents', 10) // Max 10 files
};
