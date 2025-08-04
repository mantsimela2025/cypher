const { db } = require('../db');
const {
  folders,
  documents,
  documentShares,
  documentFavorites,
  documentAnalytics,
  documentChanges,
  documentComments,
  documentTemplates,
  documentVersions,
  users
} = require('../db/schema');
const { eq, and, desc, asc, sql, count, like, ilike, inArray, isNull, isNotNull, or, gte, lte } = require('drizzle-orm');
const notificationService = require('./notificationService');
const auditService = require('./auditLogService');

class DocumentsService {

  // ==================== CORE CRUD OPERATIONS ====================

  /**
   * Create a new document
   */
  async createDocument(documentData, userId) {
    try {
      console.log('📄 Creating document:', documentData.name);

      const [newDocument] = await db.insert(documents)
        .values({
          name: documentData.name,
          originalName: documentData.originalName,
          size: documentData.size,
          mimeType: documentData.mimeType,
          url: documentData.url,
          objectPath: documentData.objectPath,
          folderId: documentData.folderId || null,
          userId: userId,
          tags: documentData.tags || [],
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create initial version
      await this.createDocumentVersion({
        documentId: newDocument.id,
        versionNumber: 1,
        name: documentData.name,
        originalName: documentData.originalName,
        size: documentData.size,
        mimeType: documentData.mimeType,
        url: documentData.url,
        changeType: 'created',
        changeDescription: 'Initial document creation'
      }, userId);

      // Log change
      await this.logDocumentChange({
        documentId: newDocument.id,
        changeType: 'created',
        changeDescription: 'Document created',
        newValue: newDocument
      }, userId);

      // Log audit trail
      await auditService.logAction(userId, 'document', 'create', newDocument.id, null, newDocument);

      // Send notification
      await this.sendDocumentNotification('document_created', newDocument, userId);

      return await this.getDocumentById(newDocument.id);
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Get all documents with filtering and pagination
   */
  async getAllDocuments(filters = {}, pagination = {}) {
    try {
      const { 
        search, 
        mimeType, 
        folderId, 
        userId: filterUserId,
        tags,
        sizeMin,
        sizeMax,
        dateFrom,
        dateTo
      } = filters;
      
      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: documents.id,
        name: documents.name,
        originalName: documents.originalName,
        size: documents.size,
        mimeType: documents.mimeType,
        url: documents.url,
        objectPath: documents.objectPath,
        folderId: documents.folderId,
        userId: documents.userId,
        tags: documents.tags,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        ownerName: users.firstName,
        ownerLastName: users.lastName
      })
      .from(documents)
      .leftJoin(users, eq(documents.userId, users.id));

      // Apply filters
      const conditions = [];
      
      // Exclude soft-deleted documents by default
      conditions.push(isNull(documents.deletedAt));

      if (search) {
        conditions.push(
          or(
            ilike(documents.name, `%${search}%`),
            ilike(documents.originalName, `%${search}%`),
            sql`${documents.tags} @> ARRAY[${search}]::text[]`
          )
        );
      }

      if (mimeType) {
        conditions.push(eq(documents.mimeType, mimeType));
      }

      if (folderId !== undefined) {
        if (folderId === null) {
          conditions.push(isNull(documents.folderId));
        } else {
          conditions.push(eq(documents.folderId, folderId));
        }
      }

      if (filterUserId) {
        conditions.push(eq(documents.userId, filterUserId));
      }

      if (tags && tags.length > 0) {
        conditions.push(sql`${documents.tags} && ARRAY[${tags.join(',')}]::text[]`);
      }

      if (sizeMin) {
        conditions.push(gte(documents.size, sizeMin));
      }

      if (sizeMax) {
        conditions.push(lte(documents.size, sizeMax));
      }

      if (dateFrom) {
        conditions.push(gte(documents.createdAt, new Date(dateFrom)));
      }

      if (dateTo) {
        conditions.push(lte(documents.createdAt, new Date(dateTo)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = documents[sortBy] || documents.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const documentsList = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(documents);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const [{ count: totalCount }] = await countQuery;

      // Enhance results with additional information
      const enhancedDocuments = await Promise.all(
        documentsList.map(async (document) => {
          const enhanced = {
            ...document,
            ownerFullName: document.ownerName && document.ownerLastName 
              ? `${document.ownerName} ${document.ownerLastName}` 
              : 'Unknown',
            sizeFormatted: this.formatFileSize(document.size)
          };

          // Get latest version info
          enhanced.latestVersion = await this.getLatestDocumentVersion(document.id);
          
          // Get comment count
          enhanced.commentCount = await this.getDocumentCommentCount(document.id);
          
          // Get view count
          enhanced.viewCount = await this.getDocumentViewCount(document.id);

          return enhanced;
        })
      );

      return {
        data: enhancedDocuments,
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
      console.error('Error getting documents:', error);
      throw error;
    }
  }

  /**
   * Get document by ID with full details
   */
  async getDocumentById(documentId) {
    try {
      const [document] = await db.select({
        id: documents.id,
        name: documents.name,
        originalName: documents.originalName,
        size: documents.size,
        mimeType: documents.mimeType,
        url: documents.url,
        objectPath: documents.objectPath,
        folderId: documents.folderId,
        userId: documents.userId,
        tags: documents.tags,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        ownerName: users.firstName,
        ownerLastName: users.lastName
      })
      .from(documents)
      .leftJoin(users, eq(documents.userId, users.id))
      .where(eq(documents.id, documentId))
      .limit(1);

      if (!document) {
        throw new Error('Document not found');
      }

      // Get versions
      const versions = await this.getDocumentVersions(documentId);

      // Get comments
      const comments = await this.getDocumentComments(documentId);

      // Get analytics summary
      const analytics = await this.getDocumentAnalytics(documentId);

      return {
        ...document,
        ownerFullName: document.ownerName && document.ownerLastName 
          ? `${document.ownerName} ${document.ownerLastName}` 
          : 'Unknown',
        sizeFormatted: this.formatFileSize(document.size),
        versions,
        comments,
        analytics,
        versionCount: versions.length,
        commentCount: comments.length
      };
    } catch (error) {
      console.error('Error getting document by ID:', error);
      throw error;
    }
  }

  /**
   * Update document
   */
  async updateDocument(documentId, updateData, userId) {
    try {
      console.log('📝 Updating document:', documentId);

      // Get current document for audit log
      const currentDocument = await this.getDocumentById(documentId);

      const [updatedDocument] = await db.update(documents)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))
        .returning();

      // Log change
      await this.logDocumentChange({
        documentId,
        changeType: 'updated',
        changeDescription: 'Document updated',
        previousValue: currentDocument,
        newValue: updatedDocument
      }, userId);

      // Log audit trail
      await auditService.logAction(userId, 'document', 'update', documentId, currentDocument, updateData);

      // Send notification
      await this.sendDocumentNotification('document_updated', updatedDocument, userId);

      return await this.getDocumentById(documentId);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId, userId) {
    try {
      console.log('🗑️ Deleting document:', documentId);

      // Get document details for cleanup and audit
      const document = await this.getDocumentById(documentId);

      // Delete from database (cascading deletes will handle related records)
      await db.delete(documents)
        .where(eq(documents.id, documentId));

      // Log audit trail
      await auditService.logAction(userId, 'document', 'delete', documentId, document, null);

      // Send notification
      await this.sendDocumentNotification('document_deleted', document, userId);

      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // ==================== SOFT DELETE OPERATIONS ====================

  /**
   * Soft delete document
   */
  async softDeleteDocument(documentId, userId) {
    try {
      console.log('🗑️ Soft deleting document:', documentId);

      // Get document details for audit
      const document = await this.getDocumentById(documentId);

      // Update document with deletion info
      const [deletedDocument] = await db.update(documents)
        .set({
          deletedAt: new Date(),
          deletedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))
        .returning();

      // Log change
      await this.logDocumentChange({
        documentId,
        changeType: 'deleted',
        changeDescription: 'Document soft deleted',
        previousValue: document,
        newValue: deletedDocument
      }, userId);

      // Log audit trail
      await auditService.logAction(userId, 'document', 'soft_delete', documentId, document, deletedDocument);

      // Send notification
      await this.sendDocumentNotification('document_deleted', document, userId);

      return { success: true, message: 'Document moved to trash successfully' };
    } catch (error) {
      console.error('Error soft deleting document:', error);
      throw error;
    }
  }

  /**
   * Restore soft deleted document
   */
  async restoreDocument(documentId, userId) {
    try {
      console.log('🔄 Restoring document:', documentId);

      // Get document details including soft-deleted ones
      const [document] = await db.select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (!document) {
        throw new Error('Document not found');
      }

      if (!document.deletedAt) {
        throw new Error('Document is not deleted');
      }

      // Restore document
      const [restoredDocument] = await db.update(documents)
        .set({
          deletedAt: null,
          deletedBy: null,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))
        .returning();

      // Log change
      await this.logDocumentChange({
        documentId,
        changeType: 'restored',
        changeDescription: 'Document restored from trash',
        previousValue: document,
        newValue: restoredDocument
      }, userId);

      // Log audit trail
      await auditService.logAction(userId, 'document', 'restore', documentId, document, restoredDocument);

      return await this.getDocumentById(documentId);
    } catch (error) {
      console.error('Error restoring document:', error);
      throw error;
    }
  }

  /**
   * Get deleted documents
   */
  async getDeletedDocuments(filters = {}, pagination = {}) {
    try {
      const { userId: filterUserId } = filters;
      const { page = 1, limit = 50, sortBy = 'deletedAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: documents.id,
        name: documents.name,
        originalName: documents.originalName,
        size: documents.size,
        mimeType: documents.mimeType,
        folderId: documents.folderId,
        userId: documents.userId,
        tags: documents.tags,
        deletedAt: documents.deletedAt,
        deletedBy: documents.deletedBy,
        createdAt: documents.createdAt,
        ownerName: users.firstName,
        ownerLastName: users.lastName
      })
      .from(documents)
      .leftJoin(users, eq(documents.userId, users.id));

      // Apply filters - only show deleted documents
      const conditions = [isNotNull(documents.deletedAt)];

      if (filterUserId) {
        conditions.push(eq(documents.userId, filterUserId));
      }

      query = query.where(and(...conditions));

      // Apply sorting
      const sortColumn = documents[sortBy] || documents.deletedAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const documentsList = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(documents)
        .where(and(...conditions));
      const [{ count: totalCount }] = await countQuery;

      const enhancedDocuments = documentsList.map(document => ({
        ...document,
        ownerFullName: document.ownerName && document.ownerLastName
          ? `${document.ownerName} ${document.ownerLastName}`
          : 'Unknown',
        sizeFormatted: this.formatFileSize(document.size)
      }));

      return {
        data: enhancedDocuments,
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
      console.error('Error getting deleted documents:', error);
      throw error;
    }
  }

  // ==================== FOLDER MANAGEMENT ====================

  /**
   * Create folder
   */
  async createFolder(folderData, userId) {
    try {
      console.log('📁 Creating folder:', folderData.name);

      const [newFolder] = await db.insert(folders)
        .values({
          name: folderData.name,
          parentFolderId: folderData.parentFolderId || null,
          userId: userId,
          folderType: folderData.folderType || 'general',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Log audit trail
      await auditService.logAction(userId, 'folder', 'create', newFolder.id, null, newFolder);

      return newFolder;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  /**
   * Get folders
   */
  async getFolders(filters = {}) {
    try {
      const { userId: filterUserId, parentFolderId } = filters;

      let query = db.select({
        id: folders.id,
        name: folders.name,
        parentFolderId: folders.parentFolderId,
        userId: folders.userId,
        folderType: folders.folderType,
        createdAt: folders.createdAt,
        updatedAt: folders.updatedAt,
        ownerName: users.firstName,
        ownerLastName: users.lastName
      })
      .from(folders)
      .leftJoin(users, eq(folders.userId, users.id));

      const conditions = [];

      if (filterUserId) {
        conditions.push(eq(folders.userId, filterUserId));
      }

      if (parentFolderId !== undefined) {
        if (parentFolderId === null) {
          conditions.push(isNull(folders.parentFolderId));
        } else {
          conditions.push(eq(folders.parentFolderId, parentFolderId));
        }
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(asc(folders.name));

      const foldersList = await query;

      return foldersList.map(folder => ({
        ...folder,
        ownerFullName: folder.ownerName && folder.ownerLastName
          ? `${folder.ownerName} ${folder.ownerLastName}`
          : 'Unknown'
      }));
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  }

  /**
   * Delete folder
   */
  async deleteFolder(folderId, userId) {
    try {
      console.log('🗑️ Deleting folder:', folderId);

      // Check if folder has any documents or subfolders
      const [{ count: documentCount }] = await db.select({ count: count() })
        .from(documents)
        .where(and(eq(documents.folderId, folderId), isNull(documents.deletedAt)));

      const [{ count: subfolderCount }] = await db.select({ count: count() })
        .from(folders)
        .where(eq(folders.parentFolderId, folderId));

      if (documentCount > 0 || subfolderCount > 0) {
        throw new Error('Cannot delete folder: contains documents or subfolders');
      }

      // Get folder details for audit
      const [folder] = await db.select()
        .from(folders)
        .where(eq(folders.id, folderId))
        .limit(1);

      if (!folder) {
        throw new Error('Folder not found');
      }

      // Delete folder
      await db.delete(folders)
        .where(eq(folders.id, folderId));

      // Log audit trail
      await auditService.logAction(userId, 'folder', 'delete', folderId, folder, null);

      return { success: true, message: 'Folder deleted successfully' };
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  // ==================== DOCUMENT SHARING ====================

  /**
   * Share document with user
   */
  async shareDocument(documentId, shareData, userId) {
    try {
      console.log('🔗 Sharing document:', documentId);

      // Check if document exists
      const document = await this.getDocumentById(documentId);

      const [newShare] = await db.insert(documentShares)
        .values({
          documentId,
          userId: shareData.userId,
          permissionLevel: shareData.permissionLevel || 'read',
          sharedBy: userId,
          createdAt: new Date()
        })
        .returning();

      // Log audit trail
      await auditService.logAction(userId, 'document_share', 'create', newShare.id, null, newShare);

      // Send notification to shared user
      await this.sendDocumentNotification('document_shared', document, shareData.userId);

      return newShare;
    } catch (error) {
      console.error('Error sharing document:', error);
      throw error;
    }
  }

  /**
   * Get shared documents for user
   */
  async getSharedDocuments(userId, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: documents.id,
        name: documents.name,
        originalName: documents.originalName,
        size: documents.size,
        mimeType: documents.mimeType,
        url: documents.url,
        folderId: documents.folderId,
        userId: documents.userId,
        tags: documents.tags,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        permissionLevel: documentShares.permissionLevel,
        sharedBy: documentShares.sharedBy,
        sharedAt: documentShares.createdAt,
        ownerName: users.firstName,
        ownerLastName: users.lastName
      })
      .from(documents)
      .innerJoin(documentShares, eq(documents.id, documentShares.documentId))
      .leftJoin(users, eq(documents.userId, users.id))
      .where(and(
        eq(documentShares.userId, userId),
        isNull(documents.deletedAt)
      ));

      // Apply sorting
      const sortColumn = documents[sortBy] || documents.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const documentsList = await query;

      // Get total count
      const [{ count: totalCount }] = await db.select({ count: count() })
        .from(documents)
        .innerJoin(documentShares, eq(documents.id, documentShares.documentId))
        .where(and(
          eq(documentShares.userId, userId),
          isNull(documents.deletedAt)
        ));

      const enhancedDocuments = documentsList.map(document => ({
        ...document,
        ownerFullName: document.ownerName && document.ownerLastName
          ? `${document.ownerName} ${document.ownerLastName}`
          : 'Unknown',
        sizeFormatted: this.formatFileSize(document.size),
        isShared: true
      }));

      return {
        data: enhancedDocuments,
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
      console.error('Error getting shared documents:', error);
      throw error;
    }
  }

  /**
   * Remove document share
   */
  async removeShare(documentId, userId, sharedUserId) {
    try {
      console.log('🔗 Removing document share:', documentId);

      await db.delete(documentShares)
        .where(and(
          eq(documentShares.documentId, documentId),
          eq(documentShares.userId, sharedUserId)
        ));

      // Log audit trail
      await auditService.logAction(userId, 'document_share', 'delete', documentId,
        { documentId, userId: sharedUserId }, null);

      return { success: true, message: 'Document share removed successfully' };
    } catch (error) {
      console.error('Error removing document share:', error);
      throw error;
    }
  }

  // ==================== DOCUMENT FAVORITES ====================

  /**
   * Star/unstar document
   */
  async starDocument(documentId, userId) {
    try {
      console.log('⭐ Toggling star for document:', documentId);

      // Check if already starred
      const [existingFavorite] = await db.select()
        .from(documentFavorites)
        .where(and(
          eq(documentFavorites.documentId, documentId),
          eq(documentFavorites.userId, userId)
        ))
        .limit(1);

      if (existingFavorite) {
        // Remove star
        await db.delete(documentFavorites)
          .where(and(
            eq(documentFavorites.documentId, documentId),
            eq(documentFavorites.userId, userId)
          ));

        await auditService.logAction(userId, 'document_favorite', 'delete', documentId, existingFavorite, null);
        return { starred: false, message: 'Document unstarred successfully' };
      } else {
        // Add star
        const [newFavorite] = await db.insert(documentFavorites)
          .values({
            documentId,
            userId,
            createdAt: new Date()
          })
          .returning();

        await auditService.logAction(userId, 'document_favorite', 'create', documentId, null, newFavorite);
        return { starred: true, message: 'Document starred successfully' };
      }
    } catch (error) {
      console.error('Error toggling document star:', error);
      throw error;
    }
  }

  /**
   * Get starred documents for user
   */
  async getStarredDocuments(userId, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

      let query = db.select({
        id: documents.id,
        name: documents.name,
        originalName: documents.originalName,
        size: documents.size,
        mimeType: documents.mimeType,
        url: documents.url,
        folderId: documents.folderId,
        userId: documents.userId,
        tags: documents.tags,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        starredAt: documentFavorites.createdAt,
        ownerName: users.firstName,
        ownerLastName: users.lastName
      })
      .from(documents)
      .innerJoin(documentFavorites, eq(documents.id, documentFavorites.documentId))
      .leftJoin(users, eq(documents.userId, users.id))
      .where(and(
        eq(documentFavorites.userId, userId),
        isNull(documents.deletedAt)
      ));

      // Apply sorting
      const sortColumn = documents[sortBy] || documents.createdAt;
      query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.limit(limit).offset(offset);

      const documentsList = await query;

      // Get total count
      const [{ count: totalCount }] = await db.select({ count: count() })
        .from(documents)
        .innerJoin(documentFavorites, eq(documents.id, documentFavorites.documentId))
        .where(and(
          eq(documentFavorites.userId, userId),
          isNull(documents.deletedAt)
        ));

      const enhancedDocuments = documentsList.map(document => ({
        ...document,
        ownerFullName: document.ownerName && document.ownerLastName
          ? `${document.ownerName} ${document.ownerLastName}`
          : 'Unknown',
        sizeFormatted: this.formatFileSize(document.size),
        isStarred: true
      }));

      return {
        data: enhancedDocuments,
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
      console.error('Error getting starred documents:', error);
      throw error;
    }
  }

  // ==================== VERSION MANAGEMENT ====================

  /**
   * Create document version
   */
  async createDocumentVersion(versionData, userId) {
    try {
      const [newVersion] = await db.insert(documentVersions)
        .values({
          documentId: versionData.documentId,
          versionNumber: versionData.versionNumber,
          name: versionData.name,
          originalName: versionData.originalName,
          size: versionData.size,
          mimeType: versionData.mimeType,
          url: versionData.url,
          checksum: versionData.checksum,
          changeType: versionData.changeType,
          changeDescription: versionData.changeDescription,
          userId: userId,
          createdAt: new Date()
        })
        .returning();

      return newVersion;
    } catch (error) {
      console.error('Error creating document version:', error);
      throw error;
    }
  }

  /**
   * Get document versions
   */
  async getDocumentVersions(documentId) {
    try {
      const versions = await db.select({
        id: documentVersions.id,
        versionNumber: documentVersions.versionNumber,
        name: documentVersions.name,
        originalName: documentVersions.originalName,
        size: documentVersions.size,
        mimeType: documentVersions.mimeType,
        url: documentVersions.url,
        checksum: documentVersions.checksum,
        changeType: documentVersions.changeType,
        changeDescription: documentVersions.changeDescription,
        userId: documentVersions.userId,
        createdAt: documentVersions.createdAt,
        creatorName: users.firstName,
        creatorLastName: users.lastName
      })
      .from(documentVersions)
      .leftJoin(users, eq(documentVersions.userId, users.id))
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber));

      return versions.map(version => ({
        ...version,
        creatorFullName: version.creatorName && version.creatorLastName 
          ? `${version.creatorName} ${version.creatorLastName}` 
          : 'Unknown',
        sizeFormatted: this.formatFileSize(version.size)
      }));
    } catch (error) {
      console.error('Error getting document versions:', error);
      return [];
    }
  }

  /**
   * Get latest document version
   */
  async getLatestDocumentVersion(documentId) {
    try {
      const [latestVersion] = await db.select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.versionNumber))
        .limit(1);

      return latestVersion;
    } catch (error) {
      console.error('Error getting latest document version:', error);
      return null;
    }
  }

  // ==================== COMMENTS MANAGEMENT ====================

  /**
   * Add comment to document
   */
  async addDocumentComment(documentId, content, userId) {
    try {
      const [newComment] = await db.insert(documentComments)
        .values({
          documentId,
          userId,
          content,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Send notification
      const document = await this.getDocumentById(documentId);
      await this.sendDocumentNotification('document_commented', document, userId);

      return newComment;
    } catch (error) {
      console.error('Error adding document comment:', error);
      throw error;
    }
  }

  /**
   * Get document comments
   */
  async getDocumentComments(documentId) {
    try {
      const comments = await db.select({
        id: documentComments.id,
        content: documentComments.content,
        userId: documentComments.userId,
        createdAt: documentComments.createdAt,
        updatedAt: documentComments.updatedAt,
        authorName: users.firstName,
        authorLastName: users.lastName
      })
      .from(documentComments)
      .leftJoin(users, eq(documentComments.userId, users.id))
      .where(eq(documentComments.documentId, documentId))
      .orderBy(desc(documentComments.createdAt));

      return comments.map(comment => ({
        ...comment,
        authorFullName: comment.authorName && comment.authorLastName 
          ? `${comment.authorName} ${comment.authorLastName}` 
          : 'Unknown'
      }));
    } catch (error) {
      console.error('Error getting document comments:', error);
      return [];
    }
  }

  /**
   * Get document comment count
   */
  async getDocumentCommentCount(documentId) {
    try {
      const [{ count: commentCount }] = await db.select({ count: count() })
        .from(documentComments)
        .where(eq(documentComments.documentId, documentId));

      return commentCount;
    } catch (error) {
      console.error('Error getting document comment count:', error);
      return 0;
    }
  }

  // ==================== ANALYTICS AND TRACKING ====================

  /**
   * Track document action (view, download)
   */
  async trackDocumentAction(documentId, action, userId, metadata = {}) {
    try {
      await db.insert(documentAnalytics)
        .values({
          documentId,
          userId,
          action,
          metadata,
          timestamp: new Date()
        });

      console.log(`📊 Tracked ${action} for document ${documentId} by user ${userId}`);
    } catch (error) {
      console.error('Error tracking document action:', error);
    }
  }

  /**
   * Get document analytics
   */
  async getDocumentAnalytics(documentId) {
    try {
      // Get total views and downloads
      const [{ count: totalViews }] = await db.select({ count: count() })
        .from(documentAnalytics)
        .where(and(
          eq(documentAnalytics.documentId, documentId),
          eq(documentAnalytics.action, 'view')
        ));

      const [{ count: totalDownloads }] = await db.select({ count: count() })
        .from(documentAnalytics)
        .where(and(
          eq(documentAnalytics.documentId, documentId),
          eq(documentAnalytics.action, 'download')
        ));

      // Get recent activity
      const recentActivity = await db.select({
        action: documentAnalytics.action,
        timestamp: documentAnalytics.timestamp,
        userId: documentAnalytics.userId,
        userName: users.firstName,
        userLastName: users.lastName
      })
      .from(documentAnalytics)
      .leftJoin(users, eq(documentAnalytics.userId, users.id))
      .where(eq(documentAnalytics.documentId, documentId))
      .orderBy(desc(documentAnalytics.timestamp))
      .limit(10);

      return {
        totalViews,
        totalDownloads,
        recentActivity: recentActivity.map(activity => ({
          ...activity,
          userFullName: activity.userName && activity.userLastName 
            ? `${activity.userName} ${activity.userLastName}` 
            : 'Unknown'
        }))
      };
    } catch (error) {
      console.error('Error getting document analytics:', error);
      return { totalViews: 0, totalDownloads: 0, recentActivity: [] };
    }
  }

  /**
   * Get document view count
   */
  async getDocumentViewCount(documentId) {
    try {
      const [{ count: viewCount }] = await db.select({ count: count() })
        .from(documentAnalytics)
        .where(and(
          eq(documentAnalytics.documentId, documentId),
          eq(documentAnalytics.action, 'view')
        ));

      return viewCount;
    } catch (error) {
      console.error('Error getting document view count:', error);
      return 0;
    }
  }

  // ==================== CHANGE LOGGING ====================

  /**
   * Log document change
   */
  async logDocumentChange(changeData, userId) {
    try {
      await db.insert(documentChanges)
        .values({
          documentId: changeData.documentId,
          versionId: changeData.versionId || null,
          changeType: changeData.changeType,
          changeDescription: changeData.changeDescription,
          previousValue: changeData.previousValue || null,
          newValue: changeData.newValue || null,
          userId,
          timestamp: new Date()
        });
    } catch (error) {
      console.error('Error logging document change:', error);
    }
  }

  /**
   * Get document change history
   */
  async getDocumentChangeHistory(documentId) {
    try {
      const changes = await db.select({
        id: documentChanges.id,
        changeType: documentChanges.changeType,
        changeDescription: documentChanges.changeDescription,
        previousValue: documentChanges.previousValue,
        newValue: documentChanges.newValue,
        userId: documentChanges.userId,
        timestamp: documentChanges.timestamp,
        userName: users.firstName,
        userLastName: users.lastName
      })
      .from(documentChanges)
      .leftJoin(users, eq(documentChanges.userId, users.id))
      .where(eq(documentChanges.documentId, documentId))
      .orderBy(desc(documentChanges.timestamp));

      return changes.map(change => ({
        ...change,
        userFullName: change.userName && change.userLastName 
          ? `${change.userName} ${change.userLastName}` 
          : 'Unknown'
      }));
    } catch (error) {
      console.error('Error getting document change history:', error);
      return [];
    }
  }

  // ==================== TEMPLATE MANAGEMENT ====================

  /**
   * Create document template
   */
  async createDocumentTemplate(templateData, userId) {
    try {
      const [newTemplate] = await db.insert(documentTemplates)
        .values({
          name: templateData.name,
          description: templateData.description,
          category: templateData.category,
          thumbnailUrl: templateData.thumbnailUrl,
          templateUrl: templateData.templateUrl,
          userId: userId,
          isPublic: templateData.isPublic || false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      return newTemplate;
    } catch (error) {
      console.error('Error creating document template:', error);
      throw error;
    }
  }

  /**
   * Get document templates
   */
  async getDocumentTemplates(filters = {}) {
    try {
      const { category, isPublic, userId: filterUserId } = filters;
      
      let query = db.select({
        id: documentTemplates.id,
        name: documentTemplates.name,
        description: documentTemplates.description,
        category: documentTemplates.category,
        thumbnailUrl: documentTemplates.thumbnailUrl,
        templateUrl: documentTemplates.templateUrl,
        userId: documentTemplates.userId,
        isPublic: documentTemplates.isPublic,
        createdAt: documentTemplates.createdAt,
        updatedAt: documentTemplates.updatedAt,
        creatorName: users.firstName,
        creatorLastName: users.lastName
      })
      .from(documentTemplates)
      .leftJoin(users, eq(documentTemplates.userId, users.id));

      const conditions = [];

      if (category) {
        conditions.push(eq(documentTemplates.category, category));
      }

      if (isPublic !== undefined) {
        conditions.push(eq(documentTemplates.isPublic, isPublic));
      }

      if (filterUserId) {
        conditions.push(eq(documentTemplates.userId, filterUserId));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(asc(documentTemplates.name));

      const templates = await query;

      return templates.map(template => ({
        ...template,
        creatorFullName: template.creatorName && template.creatorLastName 
          ? `${template.creatorName} ${template.creatorLastName}` 
          : 'System'
      }));
    } catch (error) {
      console.error('Error getting document templates:', error);
      return [];
    }
  }

  // ==================== STATISTICS ====================

  /**
   * Get document statistics
   */
  async getDocumentStatistics() {
    try {
      // Total documents
      const [{ count: totalDocuments }] = await db.select({ count: count() })
        .from(documents);

      // Total storage used
      const [{ totalSize }] = await db.select({ 
        totalSize: sql<number>`COALESCE(SUM(${documents.size}), 0)` 
      }).from(documents);

      // Most popular mime types
      const mimeTypeStats = await db.select({
        mimeType: documents.mimeType,
        count: count()
      })
      .from(documents)
      .groupBy(documents.mimeType)
      .orderBy(desc(count()))
      .limit(5);

      // Recent uploads (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const [{ count: recentUploads }] = await db.select({ count: count() })
        .from(documents)
        .where(gte(documents.createdAt, sevenDaysAgo));

      return {
        totalDocuments,
        totalSize,
        totalSizeFormatted: this.formatFileSize(totalSize || 0),
        mimeTypeStats,
        recentUploads,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting document statistics:', error);
      throw error;
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Format file size in human-readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Send document-related notifications
   */
  async sendDocumentNotification(eventType, document, userId) {
    try {
      const notificationMap = {
        'document_created': {
          title: 'Document Created',
          message: `New document uploaded: ${document.name}`,
          type: 'info'
        },
        'document_updated': {
          title: 'Document Updated',
          message: `Document updated: ${document.name}`,
          type: 'info'
        },
        'document_deleted': {
          title: 'Document Deleted',
          message: `Document deleted: ${document.name}`,
          type: 'warning'
        },
        'document_commented': {
          title: 'Document Commented',
          message: `New comment on document: ${document.name}`,
          type: 'info'
        }
      };

      const notification = notificationMap[eventType];
      if (notification) {
        await notificationService.createNotification({
          userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          module: 'documents',
          eventType: eventType,
          relatedId: document.id,
          relatedType: 'document',
          metadata: document
        });
      }
    } catch (error) {
      console.error('Error sending document notification:', error);
    }
  }
}

module.exports = new DocumentsService();