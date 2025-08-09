const express = require('express');
const documentsController = require('../controllers/documentsController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/documents:
 *   post:
 *     summary: Create a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - originalName
 *               - size
 *               - mimeType
 *               - url
 *               - objectPath
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Document display name
 *               originalName:
 *                 type: string
 *                 maxLength: 255
 *                 description: Original filename
 *               size:
 *                 type: integer
 *                 minimum: 0
 *                 description: File size in bytes
 *               mimeType:
 *                 type: string
 *                 maxLength: 100
 *                 description: MIME type of the document
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Document URL
 *               objectPath:
 *                 type: string
 *                 maxLength: 500
 *                 description: Storage object path
 *               folderId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Parent folder ID
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 50
 *                 description: Document tags
 *     responses:
 *       201:
 *         description: Document created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/',
  requirePermission('documents:write'),
  documentsController.createDocument
);

/**
 * @swagger
 * /api/v1/documents:
 *   get:
 *     summary: Get all documents with filtering and pagination
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 255
 *         description: Search in name, originalName, and tags
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by MIME type
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         description: Filter by folder ID (null for root folder)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by owner user ID
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags (any match)
 *       - in: query
 *         name: sizeMin
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Minimum file size in bytes
 *       - in: query
 *         name: sizeMax
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Maximum file size in bytes
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date from
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by creation date to
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, size, createdAt, updatedAt, mimeType]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/',
  requirePermission('documents:read'),
  documentsController.getAllDocuments
);

/**
 * @swagger
 * /api/v1/documents/{documentId}:
 *   get:
 *     summary: Get document by ID with full details
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:documentId',
  requirePermission('documents:read'),
  documentsController.getDocumentById
);

/**
 * @swagger
 * /api/v1/documents/{documentId}:
 *   put:
 *     summary: Update document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Document display name
 *               folderId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Parent folder ID
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 50
 *                 description: Document tags
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:documentId',
  requirePermission('documents:write'),
  documentsController.updateDocument
);

/**
 * @swagger
 * /api/v1/documents/{documentId}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:documentId',
  requirePermission('documents:delete'),
  documentsController.deleteDocument
);

// ==================== VERSION MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/documents/{documentId}/versions:
 *   get:
 *     summary: Get document versions
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document versions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:documentId/versions',
  requirePermission('documents:read'),
  documentsController.getDocumentVersions
);

/**
 * @swagger
 * /api/v1/documents/{documentId}/versions:
 *   post:
 *     summary: Create new document version
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - originalName
 *               - size
 *               - mimeType
 *               - url
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Version display name
 *               originalName:
 *                 type: string
 *                 maxLength: 255
 *                 description: Original filename
 *               size:
 *                 type: integer
 *                 minimum: 0
 *                 description: File size in bytes
 *               mimeType:
 *                 type: string
 *                 maxLength: 100
 *                 description: MIME type
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: Version URL
 *               checksum:
 *                 type: string
 *                 maxLength: 100
 *                 description: File checksum
 *               changeType:
 *                 type: string
 *                 enum: [minor, major, patch]
 *                 default: minor
 *                 description: Type of change
 *               changeDescription:
 *                 type: string
 *                 maxLength: 500
 *                 description: Description of changes
 *     responses:
 *       201:
 *         description: Document version created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:documentId/versions',
  requirePermission('documents:write'),
  documentsController.createDocumentVersion
);

// ==================== COMMENTS ROUTES ====================

/**
 * @swagger
 * /api/v1/documents/{documentId}/comments:
 *   get:
 *     summary: Get document comments
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document comments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:documentId/comments',
  requirePermission('documents:read'),
  documentsController.getDocumentComments
);

/**
 * @swagger
 * /api/v1/documents/{documentId}/comments:
 *   post:
 *     summary: Add comment to document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Comment content
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:documentId/comments',
  requirePermission('documents:write'),
  documentsController.addDocumentComment
);

// ==================== ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/v1/documents/{documentId}/analytics:
 *   get:
 *     summary: Get document analytics
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalViews:
 *                       type: integer
 *                     totalDownloads:
 *                       type: integer
 *                     recentActivity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           userFullName:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:documentId/analytics',
  requirePermission('documents:read'),
  documentsController.getDocumentAnalytics
);

/**
 * @swagger
 * /api/v1/documents/{documentId}/download:
 *   post:
 *     summary: Track document download
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Download tracked successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:documentId/download',
  requirePermission('documents:read'),
  documentsController.trackDocumentDownload
);

/**
 * @swagger
 * /api/v1/documents/{documentId}/changes:
 *   get:
 *     summary: Get document change history
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document change history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:documentId/changes',
  requirePermission('documents:read'),
  documentsController.getDocumentChangeHistory
);

// ==================== TEMPLATE ROUTES ====================

/**
 * @swagger
 * /api/v1/documents/templates:
 *   post:
 *     summary: Create document template
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - templateUrl
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Template name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Template description
 *               category:
 *                 type: string
 *                 maxLength: 100
 *                 description: Template category
 *               thumbnailUrl:
 *                 type: string
 *                 format: uri
 *                 description: Template thumbnail URL
 *               templateUrl:
 *                 type: string
 *                 format: uri
 *                 description: Template file URL
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *                 description: Whether template is public
 *     responses:
 *       201:
 *         description: Document template created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/templates',
  requirePermission('documents:write'),
  documentsController.createDocumentTemplate
);

/**
 * @swagger
 * /api/v1/documents/templates:
 *   get:
 *     summary: Get document templates
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Filter by category
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private status
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by creator user ID
 *     responses:
 *       200:
 *         description: Document templates retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/templates',
  requirePermission('documents:read'),
  documentsController.getDocumentTemplates
);

// ==================== STATISTICS ROUTES ====================

/**
 * @swagger
 * /api/v1/documents/statistics:
 *   get:
 *     summary: Get document statistics and analytics
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDocuments:
 *                       type: integer
 *                       description: Total number of documents
 *                     totalSize:
 *                       type: integer
 *                       description: Total storage used in bytes
 *                     totalSizeFormatted:
 *                       type: string
 *                       description: Formatted total storage size
 *                     mimeTypeStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mimeType:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     recentUploads:
 *                       type: integer
 *                       description: Documents uploaded in last 7 days
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/statistics',
  requirePermission('documents:read'),
  documentsController.getDocumentStatistics
);

// ==================== BULK OPERATION ROUTES ====================

/**
 * @swagger
 * /api/v1/documents/bulk/delete:
 *   post:
 *     summary: Bulk delete documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentIds
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 description: Array of document IDs to delete
 *     responses:
 *       200:
 *         description: Bulk delete completed (may include partial failures)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     successful:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           message:
 *                             type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           error:
 *                             type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/bulk/delete',
  requirePermission('documents:delete'),
  documentsController.bulkDeleteDocuments
);

/**
 * @swagger
 * /api/v1/documents/bulk/folder:
 *   put:
 *     summary: Bulk update document folders
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentIds
 *               - folderId
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 description: Array of document IDs to update
 *               folderId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: New folder ID (null for root folder)
 *     responses:
 *       200:
 *         description: Bulk folder update completed (may include partial failures)
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/bulk/folder',
  requirePermission('documents:write'),
  documentsController.bulkUpdateFolder
);

/**
 * @swagger
 * /api/v1/documents/bulk/tags:
 *   put:
 *     summary: Bulk update document tags
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentIds
 *               - tags
 *             properties:
 *               documentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 description: Array of document IDs to update
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   maxLength: 50
 *                 description: Tags to apply
 *               operation:
 *                 type: string
 *                 enum: [replace, add, remove]
 *                 default: replace
 *                 description: Tag operation type
 *     responses:
 *       200:
 *         description: Bulk tags update completed (may include partial failures)
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/bulk/tags',
  requirePermission('documents:write'),
  documentsController.bulkUpdateTags
);

module.exports = router;