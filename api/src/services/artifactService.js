const { db } = require('../db');
const { 
  artifacts,
  artifactCategories,
  artifactReferences,
  artifactTags,
  users
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, gte, lte, like, ilike, inArray, isNull, isNotNull, or } = require('drizzle-orm');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const mime = require('mime-types');
const notificationService = require('./notificationService');
const auditService = require('./auditLogService');

class ArtifactService {

  constructor() {
    this.uploadPath = process.env.ARTIFACT_UPLOAD_PATH || './uploads/artifacts';
    this.maxFileSize = parseInt(process.env.MAX_ARTIFACT_SIZE) || 50 * 1024 * 1024; // 50MB default
    this.allowedMimeTypes = [
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
    this.ensureUploadDirectory();
  }

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create a new artifact with file upload
   */
  async createArtifact(artifactData, fileBuffer, userId) {
    try {
      console.log('📄 Creating artifact:', artifactData.name);

      // Validate file
      await this.validateFile(fileBuffer, artifactData.mimeType);

      // Generate unique filename
      const fileExtension = mime.extension(artifactData.mimeType) || 'bin';
      const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
      const filePath = path.join(this.uploadPath, uniqueFilename);

      // Save file to disk
      await fs.writeFile(filePath, fileBuffer);

      // Create artifact record
      const [newArtifact] = await db.insert(artifacts)
        .values({
          ...artifactData,
          fileName: uniqueFilename,
          filePath: filePath,
          fileSize: fileBuffer.length,
          uploadedBy: userId,
          reviewStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Process categories if provided
      if (artifactData.categories && artifactData.categories.length > 0) {
        await this.setArtifactCategories(newArtifact.id, artifactData.categories);
      }

      // Process tags if provided
      if (artifactData.tags && artifactData.tags.length > 0) {
        await this.setArtifactTags(newArtifact.id, artifactData.tags);
      }

      // Log audit trail
      await auditService.logAction(userId, 'artifact', 'create', newArtifact.id, null, newArtifact);

      // Send notification
      await this.sendArtifactNotification('artifact_uploaded', newArtifact, userId);

      return await this.getArtifactById(newArtifact.id);
    } catch (error) {
      console.error('Error creating artifact:', error);
      throw error;
    }
  }

  /**
   * Get all artifacts with advanced filtering and search
   */
  async getAllArtifacts(filters = {}, pagination = {}) {
    try {
      const { 
        search, 
        mimeType, 
        reviewStatus, 
        uploadedBy, 
        categories, 
        tags,
        dateFrom,
        dateTo,
        sizeMin,
        sizeMax,
        associatedControls
      } = filters;
      
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: artifacts.id,
        name: artifacts.name,
        description: artifacts.description,
        fileName: artifacts.fileName,
        fileSize: artifacts.fileSize,
        mimeType: artifacts.mimeType,
        reviewStatus: artifacts.reviewStatus,
        uploadedBy: artifacts.uploadedBy,
        uploaderName: users.firstName,
        uploaderLastName: users.lastName,
        reviewedBy: artifacts.reviewedBy,
        reviewedAt: artifacts.reviewedAt,
        expiresAt: artifacts.expiresAt,
        createdAt: artifacts.createdAt,
        updatedAt: artifacts.updatedAt,
        associatedControls: artifacts.associatedControls
      })
      .from(artifacts)
      .leftJoin(users, eq(artifacts.uploadedBy, users.id));

      // Apply filters
      const conditions = [];

      if (search) {
        conditions.push(
          or(
            ilike(artifacts.name, `%${search}%`),
            ilike(artifacts.description, `%${search}%`),
            ilike(artifacts.fileName, `%${search}%`)
          )
        );
      }

      if (mimeType) {
        conditions.push(eq(artifacts.mimeType, mimeType));
      }

      if (reviewStatus) {
        conditions.push(eq(artifacts.reviewStatus, reviewStatus));
      }

      if (uploadedBy) {
        conditions.push(eq(artifacts.uploadedBy, uploadedBy));
      }

      if (dateFrom) {
        conditions.push(gte(artifacts.createdAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(artifacts.createdAt, new Date(dateTo)));
      }

      if (sizeMin) {
        conditions.push(gte(artifacts.fileSize, sizeMin));
      }

      if (sizeMax) {
        conditions.push(lte(artifacts.fileSize, sizeMax));
      }

      if (associatedControls && associatedControls.length > 0) {
        conditions.push(sql`${artifacts.associatedControls} && ${associatedControls}`);
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = artifacts[sortBy] || artifacts.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const artifactList = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(artifacts);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      // Enhance results with categories and tags
      const enhancedArtifacts = await Promise.all(
        artifactList.map(async (artifact) => {
          const [categories, tags] = await Promise.all([
            this.getArtifactCategories(artifact.id),
            this.getArtifactTags(artifact.id)
          ]);

          return {
            ...artifact,
            categories,
            tags,
            fileSizeFormatted: this.formatFileSize(artifact.fileSize),
            uploaderFullName: artifact.uploaderName && artifact.uploaderLastName 
              ? `${artifact.uploaderName} ${artifact.uploaderLastName}` 
              : 'Unknown'
          };
        })
      );

      return {
        data: enhancedArtifacts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting artifacts:', error);
      throw error;
    }
  }

  /**
   * Get artifact by ID with full details
   */
  async getArtifactById(artifactId) {
    try {
      const [artifact] = await db.select({
        id: artifacts.id,
        name: artifacts.name,
        description: artifacts.description,
        fileName: artifacts.fileName,
        filePath: artifacts.filePath,
        fileSize: artifacts.fileSize,
        mimeType: artifacts.mimeType,
        metadata: artifacts.metadata,
        uploadedBy: artifacts.uploadedBy,
        uploaderName: users.firstName,
        uploaderLastName: users.lastName,
        uploaderEmail: users.email,
        associatedControls: artifacts.associatedControls,
        reviewStatus: artifacts.reviewStatus,
        reviewedBy: artifacts.reviewedBy,
        reviewedAt: artifacts.reviewedAt,
        expiresAt: artifacts.expiresAt,
        createdAt: artifacts.createdAt,
        updatedAt: artifacts.updatedAt
      })
      .from(artifacts)
      .leftJoin(users, eq(artifacts.uploadedBy, users.id))
      .where(eq(artifacts.id, artifactId))
      .limit(1);

      if (!artifact) {
        throw new Error('Artifact not found');
      }

      // Get categories, tags, and references
      const [categories, tags, references] = await Promise.all([
        this.getArtifactCategories(artifactId),
        this.getArtifactTags(artifactId),
        this.getArtifactReferences(artifactId)
      ]);

      // Get reviewer information if reviewed
      let reviewerInfo = null;
      if (artifact.reviewedBy) {
        const [reviewer] = await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, artifact.reviewedBy))
        .limit(1);
        
        reviewerInfo = reviewer;
      }

      return {
        ...artifact,
        categories,
        tags,
        references,
        fileSizeFormatted: this.formatFileSize(artifact.fileSize),
        uploaderFullName: artifact.uploaderName && artifact.uploaderLastName 
          ? `${artifact.uploaderName} ${artifact.uploaderLastName}` 
          : 'Unknown',
        reviewerInfo
      };
    } catch (error) {
      console.error('Error getting artifact by ID:', error);
      throw error;
    }
  }

  /**
   * Update artifact metadata (not the file itself)
   */
  async updateArtifact(artifactId, updateData, userId) {
    try {
      console.log('📝 Updating artifact:', artifactId);

      // Get current artifact for audit log
      const currentArtifact = await this.getArtifactById(artifactId);

      const [updatedArtifact] = await db.update(artifacts)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(artifacts.id, artifactId))
        .returning();

      // Update categories if provided
      if (updateData.categories !== undefined) {
        await this.setArtifactCategories(artifactId, updateData.categories);
      }

      // Update tags if provided
      if (updateData.tags !== undefined) {
        await this.setArtifactTags(artifactId, updateData.tags);
      }

      // Log audit trail
      await auditService.logAction(userId, 'artifact', 'update', artifactId, currentArtifact, updateData);

      // Send notification
      await this.sendArtifactNotification('artifact_updated', updatedArtifact, userId);

      return await this.getArtifactById(artifactId);
    } catch (error) {
      console.error('Error updating artifact:', error);
      throw error;
    }
  }

  /**
   * Delete artifact and associated file
   */
  async deleteArtifact(artifactId, userId) {
    try {
      console.log('🗑️ Deleting artifact:', artifactId);

      // Get artifact details for cleanup and audit
      const artifact = await this.getArtifactById(artifactId);

      // Delete physical file
      try {
        await fs.unlink(artifact.filePath);
      } catch (fileError) {
        console.warn('Warning: Could not delete physical file:', fileError.message);
      }

      // Delete from database (cascading will handle related records)
      await db.delete(artifacts)
        .where(eq(artifacts.id, artifactId));

      // Log audit trail
      await auditService.logAction(userId, 'artifact', 'delete', artifactId, artifact, null);

      // Send notification
      await this.sendArtifactNotification('artifact_deleted', artifact, userId);

      return { success: true, message: 'Artifact deleted successfully' };
    } catch (error) {
      console.error('Error deleting artifact:', error);
      throw error;
    }
  }

  // ==================== FILE OPERATIONS ====================

  /**
   * Download artifact file
   */
  async downloadArtifact(artifactId, userId) {
    try {
      const artifact = await this.getArtifactById(artifactId);
      
      // Check if file exists
      try {
        await fs.access(artifact.filePath);
      } catch (error) {
        throw new Error('File not found on disk');
      }

      // Log download activity
      await auditService.logAction(userId, 'artifact', 'download', artifactId, null, { downloadedAt: new Date() });

      return {
        filePath: artifact.filePath,
        fileName: artifact.name,
        mimeType: artifact.mimeType,
        fileSize: artifact.fileSize
      };
    } catch (error) {
      console.error('Error downloading artifact:', error);
      throw error;
    }
  }

  /**
   * Replace artifact file (new version)
   */
  async replaceArtifactFile(artifactId, fileBuffer, mimeType, userId) {
    try {
      console.log('🔄 Replacing artifact file:', artifactId);

      const currentArtifact = await this.getArtifactById(artifactId);

      // Validate new file
      await this.validateFile(fileBuffer, mimeType);

      // Generate new filename
      const fileExtension = mime.extension(mimeType) || 'bin';
      const uniqueFilename = `${crypto.randomUUID()}.${fileExtension}`;
      const newFilePath = path.join(this.uploadPath, uniqueFilename);

      // Save new file
      await fs.writeFile(newFilePath, fileBuffer);

      // Update artifact record
      const [updatedArtifact] = await db.update(artifacts)
        .set({
          fileName: uniqueFilename,
          filePath: newFilePath,
          fileSize: fileBuffer.length,
          mimeType: mimeType,
          reviewStatus: 'pending', // Reset review status
          reviewedBy: null,
          reviewedAt: null,
          updatedAt: new Date()
        })
        .where(eq(artifacts.id, artifactId))
        .returning();

      // Delete old file
      try {
        await fs.unlink(currentArtifact.filePath);
      } catch (error) {
        console.warn('Warning: Could not delete old file:', error.message);
      }

      // Log audit trail
      await auditService.logAction(userId, 'artifact', 'file_replaced', artifactId, 
        { fileName: currentArtifact.fileName, fileSize: currentArtifact.fileSize },
        { fileName: uniqueFilename, fileSize: fileBuffer.length }
      );

      // Send notification
      await this.sendArtifactNotification('artifact_file_replaced', updatedArtifact, userId);

      return await this.getArtifactById(artifactId);
    } catch (error) {
      console.error('Error replacing artifact file:', error);
      throw error;
    }
  }

  // ==================== REVIEW AND APPROVAL ====================

  /**
   * Review artifact (approve/reject)
   */
  async reviewArtifact(artifactId, reviewData, userId) {
    try {
      console.log('👁️ Reviewing artifact:', artifactId);

      const { status, comments } = reviewData;

      if (!['approved', 'rejected'].includes(status)) {
        throw new Error('Invalid review status. Must be "approved" or "rejected"');
      }

      const [reviewedArtifact] = await db.update(artifacts)
        .set({
          reviewStatus: status,
          reviewedBy: userId,
          reviewedAt: new Date(),
          metadata: sql`${artifacts.metadata} || ${JSON.stringify({ reviewComments: comments })}`,
          updatedAt: new Date()
        })
        .where(eq(artifacts.id, artifactId))
        .returning();

      // Log audit trail
      await auditService.logAction(userId, 'artifact', 'reviewed', artifactId, null, { status, comments });

      // Send notification to uploader
      const artifact = await this.getArtifactById(artifactId);
      await this.sendArtifactNotification(`artifact_${status}`, artifact, userId);

      return artifact;
    } catch (error) {
      console.error('Error reviewing artifact:', error);
      throw error;
    }
  }

  // ==================== CATEGORIES AND TAGS ====================

  /**
   * Set artifact categories
   */
  async setArtifactCategories(artifactId, categoryIds) {
    try {
      // Remove existing categories
      await db.delete(artifactCategories)
        .where(eq(artifactCategories.artifactId, artifactId));

      // Add new categories
      if (categoryIds && categoryIds.length > 0) {
        const categoryRecords = categoryIds.map(categoryId => ({
          artifactId,
          categoryId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await db.insert(artifactCategories)
          .values(categoryRecords);
      }

      return true;
    } catch (error) {
      console.error('Error setting artifact categories:', error);
      throw error;
    }
  }

  /**
   * Get artifact categories
   */
  async getArtifactCategories(artifactId) {
    try {
      const categories = await db.select({
        categoryId: artifactCategories.categoryId
      })
      .from(artifactCategories)
      .where(eq(artifactCategories.artifactId, artifactId));

      return categories.map(c => c.categoryId);
    } catch (error) {
      console.error('Error getting artifact categories:', error);
      return [];
    }
  }

  /**
   * Set artifact tags
   */
  async setArtifactTags(artifactId, tagIds) {
    try {
      // Remove existing tags
      await db.delete(artifactTags)
        .where(eq(artifactTags.artifactId, artifactId));

      // Add new tags
      if (tagIds && tagIds.length > 0) {
        const tagRecords = tagIds.map(tagId => ({
          artifactId,
          tagId,
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        await db.insert(artifactTags)
          .values(tagRecords);
      }

      return true;
    } catch (error) {
      console.error('Error setting artifact tags:', error);
      throw error;
    }
  }

  /**
   * Get artifact tags
   */
  async getArtifactTags(artifactId) {
    try {
      const tags = await db.select({
        tagId: artifactTags.tagId
      })
      .from(artifactTags)
      .where(eq(artifactTags.artifactId, artifactId));

      return tags.map(t => t.tagId);
    } catch (error) {
      console.error('Error getting artifact tags:', error);
      return [];
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Validate uploaded file
   */
  async validateFile(fileBuffer, mimeType) {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File is empty');
    }

    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.formatFileSize(this.maxFileSize)}`);
    }

    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    return true;
  }

  /**
   * Ensure upload directory exists
   */
  async ensureUploadDirectory() {
    try {
      await fs.mkdir(this.uploadPath, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Send artifact-related notifications
   */
  async sendArtifactNotification(eventType, artifact, userId) {
    try {
      const notificationMap = {
        'artifact_uploaded': {
          title: 'Artifact Uploaded',
          message: `New artifact uploaded: ${artifact.name}`,
          type: 'info'
        },
        'artifact_updated': {
          title: 'Artifact Updated',
          message: `Artifact updated: ${artifact.name}`,
          type: 'info'
        },
        'artifact_deleted': {
          title: 'Artifact Deleted',
          message: `Artifact deleted: ${artifact.name}`,
          type: 'warning'
        },
        'artifact_approved': {
          title: 'Artifact Approved',
          message: `Your artifact has been approved: ${artifact.name}`,
          type: 'success'
        },
        'artifact_rejected': {
          title: 'Artifact Rejected',
          message: `Your artifact has been rejected: ${artifact.name}`,
          type: 'error'
        },
        'artifact_file_replaced': {
          title: 'Artifact File Replaced',
          message: `File replaced for artifact: ${artifact.name}`,
          type: 'info'
        }
      };

      const notification = notificationMap[eventType];
      if (notification) {
        await notificationService.createNotification({
          userId: artifact.uploadedBy || userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'artifacts',
          eventType: eventType,
          relatedId: artifact.id,
          relatedType: 'artifact',
          metadata: artifact
        });
      }
    } catch (error) {
      console.error('Error sending artifact notification:', error);
    }
  }
}

module.exports = new ArtifactService();
