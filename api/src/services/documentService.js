const AWS = require('aws-sdk');
const crypto = require('crypto');
const path = require('path');
const mime = require('mime-types');
const sharp = require('sharp'); // For image processing/thumbnails
const { db } = require('../db');
const { documents, documentVersions, documentAnalytics } = require('../db/schema/documents');
const { eq, and, desc, sql } = require('drizzle-orm');

class DocumentService {
  constructor() {
    // Configure AWS S3
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    
    this.bucketName = process.env.S3_DOCUMENTS_BUCKET || 'cypher-documents';
    this.cdnUrl = process.env.CLOUDFRONT_URL || `https://${this.bucketName}.s3.amazonaws.com`;
    
    // File validation settings
    this.maxFileSize = parseInt(process.env.MAX_DOCUMENT_SIZE) || 100 * 1024 * 1024; // 100MB
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
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/wav'
    ];
  }

  // ==================== FILE UPLOAD & STORAGE ====================

  /**
   * Upload document to S3 and create database record
   */
  async uploadDocument(fileBuffer, originalName, userId, metadata = {}) {
    try {
      console.log('📄 Uploading document:', originalName);

      // Validate file
      const mimeType = mime.lookup(originalName) || 'application/octet-stream';
      await this.validateFile(fileBuffer, mimeType, originalName);

      // Generate unique identifiers
      const documentId = crypto.randomUUID();
      const fileExtension = path.extname(originalName);
      const timestamp = new Date();
      const datePath = `${timestamp.getFullYear()}/${String(timestamp.getMonth() + 1).padStart(2, '0')}/${String(timestamp.getDate()).padStart(2, '0')}`;
      
      // Create S3 object key
      const objectKey = `documents/${datePath}/user-${userId}/${documentId}${fileExtension}`;
      
      // Upload to S3
      const uploadParams = {
        Bucket: this.bucketName,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: mimeType,
        Metadata: {
          'original-name': originalName,
          'uploaded-by': userId.toString(),
          'document-id': documentId,
          ...metadata
        },
        ServerSideEncryption: 'AES256' // Encrypt at rest
      };

      const s3Result = await this.s3.upload(uploadParams).promise();
      console.log('✅ File uploaded to S3:', s3Result.Location);

      // Generate thumbnail for images
      let thumbnailUrl = null;
      if (mimeType.startsWith('image/')) {
        thumbnailUrl = await this.generateThumbnail(fileBuffer, objectKey, mimeType);
      }

      // Create database record
      const documentData = {
        id: documentId,
        name: path.basename(originalName, fileExtension),
        originalName: originalName,
        size: fileBuffer.length,
        mimeType: mimeType,
        url: `${this.cdnUrl}/${objectKey}`,
        objectPath: objectKey,
        userId: userId,
        folderId: metadata.folderId || null,
        tags: metadata.tags || [],
        createdAt: timestamp,
        updatedAt: timestamp
      };

      const [newDocument] = await db.insert(documents).values(documentData).returning();

      // Create initial version record
      await this.createVersionRecord(documentId, 1, documentData, 'created', 'Initial upload', userId);

      // Log analytics
      await this.logAnalytics(documentId, userId, 'upload', { 
        fileSize: fileBuffer.length,
        mimeType: mimeType 
      });

      return {
        ...newDocument,
        thumbnailUrl
      };

    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for images
   */
  async generateThumbnail(imageBuffer, originalObjectKey, mimeType) {
    try {
      if (!mimeType.startsWith('image/')) return null;

      // Generate thumbnail using Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(300, 300, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Upload thumbnail to S3
      const thumbnailKey = originalObjectKey.replace('documents/', 'thumbnails/').replace(/\.[^.]+$/, '-thumb.jpg');
      
      const uploadParams = {
        Bucket: this.bucketName,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        ServerSideEncryption: 'AES256'
      };

      const result = await this.s3.upload(uploadParams).promise();
      return result.Location;

    } catch (error) {
      console.error('❌ Error generating thumbnail:', error);
      return null;
    }
  }

  // ==================== FILE RETRIEVAL ====================

  /**
   * Get document by ID with analytics tracking
   */
  async getDocument(documentId, userId) {
    try {
      const [document] = await db
        .select()
        .from(documents)
        .where(and(
          eq(documents.id, documentId),
          sql`deleted_at IS NULL`
        ));

      if (!document) {
        throw new Error('Document not found');
      }

      // Log view analytics
      await this.logAnalytics(documentId, userId, 'view');

      return document;
    } catch (error) {
      console.error('❌ Error retrieving document:', error);
      throw error;
    }
  }

  /**
   * Generate signed URL for secure document access
   */
  async getSignedUrl(documentId, userId, expiresIn = 3600) {
    try {
      const document = await this.getDocument(documentId, userId);
      
      const params = {
        Bucket: this.bucketName,
        Key: document.objectPath,
        Expires: expiresIn // 1 hour default
      };

      const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
      
      // Log download analytics
      await this.logAnalytics(documentId, userId, 'download');
      
      return signedUrl;
    } catch (error) {
      console.error('❌ Error generating signed URL:', error);
      throw error;
    }
  }

  // ==================== VERSION MANAGEMENT ====================

  /**
   * Create new version of existing document
   */
  async createVersion(documentId, fileBuffer, userId, changeDescription = '') {
    try {
      // Get current document
      const [currentDoc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId));

      if (!currentDoc) {
        throw new Error('Document not found');
      }

      // Get latest version number
      const [latestVersion] = await db
        .select({ versionNumber: documentVersions.versionNumber })
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.versionNumber))
        .limit(1);

      const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

      // Upload new version to S3
      const timestamp = new Date();
      const datePath = `${timestamp.getFullYear()}/${String(timestamp.getMonth() + 1).padStart(2, '0')}/${String(timestamp.getDate()).padStart(2, '0')}`;
      const versionKey = `versions/${documentId}/v${newVersionNumber}/${currentDoc.originalName}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: versionKey,
        Body: fileBuffer,
        ContentType: currentDoc.mimeType,
        ServerSideEncryption: 'AES256'
      };

      await this.s3.upload(uploadParams).promise();

      // Create version record
      const versionData = {
        documentId: documentId,
        versionNumber: newVersionNumber,
        name: currentDoc.name,
        originalName: currentDoc.originalName,
        size: fileBuffer.length,
        mimeType: currentDoc.mimeType,
        url: `${this.cdnUrl}/${versionKey}`,
        changeType: 'updated',
        changeDescription: changeDescription,
        userId: userId,
        createdAt: timestamp
      };

      await this.createVersionRecord(documentId, newVersionNumber, versionData, 'updated', changeDescription, userId);

      // Update main document record
      await db
        .update(documents)
        .set({
          size: fileBuffer.length,
          url: `${this.cdnUrl}/${versionKey}`,
          objectPath: versionKey,
          updatedAt: timestamp
        })
        .where(eq(documents.id, documentId));

      return { versionNumber: newVersionNumber, ...versionData };

    } catch (error) {
      console.error('❌ Error creating document version:', error);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Validate uploaded file
   */
  async validateFile(fileBuffer, mimeType, filename) {
    // Check file size
    if (fileBuffer.length > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    // Additional security checks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      throw new Error('Invalid filename');
    }

    return true;
  }

  /**
   * Create version record
   */
  async createVersionRecord(documentId, versionNumber, documentData, changeType, changeDescription, userId) {
    const versionData = {
      id: crypto.randomUUID(),
      documentId: documentId,
      versionNumber: versionNumber,
      name: documentData.name,
      originalName: documentData.originalName,
      size: documentData.size,
      mimeType: documentData.mimeType,
      url: documentData.url,
      changeType: changeType,
      changeDescription: changeDescription,
      userId: userId,
      createdAt: new Date()
    };

    await db.insert(documentVersions).values(versionData);
  }

  /**
   * Log analytics event
   */
  async logAnalytics(documentId, userId, action, metadata = {}) {
    try {
      const analyticsData = {
        id: crypto.randomUUID(),
        documentId: documentId,
        userId: userId,
        action: action,
        metadata: metadata,
        timestamp: new Date()
      };

      await db.insert(documentAnalytics).values(analyticsData);
    } catch (error) {
      console.error('❌ Error logging analytics:', error);
      // Don't throw - analytics shouldn't break main functionality
    }
  }
}

module.exports = new DocumentService();
