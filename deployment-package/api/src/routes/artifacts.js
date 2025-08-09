const express = require('express');
const { artifactController, uploadMiddleware } = require('../controllers/artifactController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/artifacts:
 *   post:
 *     summary: Create a new artifact with file upload
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - file
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Artifact name
 *               description:
 *                 type: string
 *                 description: Artifact description
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               associatedControls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Associated control IDs
 *               categories:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Category IDs
 *               tags:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Tag IDs
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Artifact created successfully
 *       400:
 *         description: Invalid request data or no file uploaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported file type
 */
router.post('/', 
  requirePermission('artifacts', 'write'),
  uploadMiddleware,
  artifactController.createArtifact
);

/**
 * @swagger
 * /api/v1/artifacts:
 *   get:
 *     summary: Get all artifacts with filtering and pagination
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 255
 *         description: Search in name, description, and filename
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *         description: Filter by MIME type
 *       - in: query
 *         name: reviewStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by review status
 *       - in: query
 *         name: uploadedBy
 *         schema:
 *           type: integer
 *         description: Filter by uploader user ID
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
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, fileSize, createdAt, updatedAt, reviewStatus]
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
 *         description: Artifacts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  requirePermission('artifacts', 'read'),
  artifactController.getAllArtifacts
);

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}:
 *   get:
 *     summary: Get artifact by ID with full details
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
 *     responses:
 *       200:
 *         description: Artifact retrieved successfully
 *       404:
 *         description: Artifact not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:artifactId', 
  requirePermission('artifacts', 'read'),
  artifactController.getArtifactById
);

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}:
 *   put:
 *     summary: Update artifact metadata
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
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
 *                 description: Artifact name
 *               description:
 *                 type: string
 *                 description: Artifact description
 *               associatedControls:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Associated control IDs
 *               categories:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Category IDs
 *               tags:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Tag IDs
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Expiration date
 *     responses:
 *       200:
 *         description: Artifact updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Artifact not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:artifactId', 
  requirePermission('artifacts', 'write'),
  artifactController.updateArtifact
);

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}:
 *   delete:
 *     summary: Delete artifact and associated file
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
 *     responses:
 *       200:
 *         description: Artifact deleted successfully
 *       404:
 *         description: Artifact not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:artifactId', 
  requirePermission('artifacts', 'delete'),
  artifactController.deleteArtifact
);

// ==================== FILE OPERATION ROUTES ====================

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}/download:
 *   get:
 *     summary: Download artifact file
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Artifact or file not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:artifactId/download', 
  requirePermission('artifacts', 'read'),
  artifactController.downloadArtifact
);

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}/replace:
 *   put:
 *     summary: Replace artifact file with new version
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: New file to replace existing one
 *     responses:
 *       200:
 *         description: Artifact file replaced successfully
 *       400:
 *         description: No file uploaded
 *       404:
 *         description: Artifact not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       413:
 *         description: File too large
 *       415:
 *         description: Unsupported file type
 */
router.put('/:artifactId/replace',
  requirePermission('artifacts', 'write'),
  uploadMiddleware,
  artifactController.replaceArtifactFile
);

// ==================== REVIEW AND APPROVAL ROUTES ====================

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}/review:
 *   post:
 *     summary: Review artifact (approve/reject)
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Review decision
 *               comments:
 *                 type: string
 *                 description: Review comments
 *     responses:
 *       200:
 *         description: Artifact reviewed successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Artifact not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/:artifactId/review',
  requirePermission('artifacts', 'admin'),
  artifactController.reviewArtifact
);

/**
 * @swagger
 * /api/v1/artifacts/pending-review:
 *   get:
 *     summary: Get artifacts pending review
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Pending review artifacts retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/pending-review',
  requirePermission('artifacts', 'admin'),
  artifactController.getPendingReviewArtifacts
);

// ==================== SEARCH AND ANALYTICS ROUTES ====================

/**
 * @swagger
 * /api/v1/artifacts/search:
 *   get:
 *     summary: Advanced search artifacts
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 255
 *         description: Search query
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *         description: Filter by MIME type
 *       - in: query
 *         name: reviewStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by review status
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
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Search completed successfully
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/search',
  requirePermission('artifacts', 'read'),
  artifactController.searchArtifacts
);

/**
 * @swagger
 * /api/v1/artifacts/statistics:
 *   get:
 *     summary: Get artifact statistics and analytics
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Artifact statistics retrieved successfully
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
 *                     totalArtifacts:
 *                       type: integer
 *                     statusBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reviewStatus:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     fileTypeBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           mimeType:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     sizeStatistics:
 *                       type: object
 *                       properties:
 *                         totalSize:
 *                           type: integer
 *                         averageSize:
 *                           type: integer
 *                         maxSize:
 *                           type: integer
 *                         minSize:
 *                           type: integer
 *                         totalSizeFormatted:
 *                           type: string
 *                     recentUploads:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/statistics',
  requirePermission('artifacts', 'read'),
  artifactController.getArtifactStatistics
);

// ==================== CATEGORY AND TAG MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}/categories:
 *   put:
 *     summary: Set artifact categories
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of category IDs
 *     responses:
 *       200:
 *         description: Artifact categories updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:artifactId/categories',
  requirePermission('artifacts', 'write'),
  artifactController.setArtifactCategories
);

/**
 * @swagger
 * /api/v1/artifacts/{artifactId}/tags:
 *   put:
 *     summary: Set artifact tags
 *     tags: [Artifacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artifactId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Artifact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagIds
 *             properties:
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array of tag IDs
 *     responses:
 *       200:
 *         description: Artifact tags updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:artifactId/tags',
  requirePermission('artifacts', 'write'),
  artifactController.setArtifactTags
);

module.exports = router;
