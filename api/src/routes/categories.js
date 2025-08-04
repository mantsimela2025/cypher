const express = require('express');
const categoriesController = require('../controllers/categoriesController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE CRUD ROUTES ====================

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Category name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Category description
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 description: Parent category ID (null for root categories)
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 default: active
 *                 description: Category status
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Parent category not found
 *       409:
 *         description: Category name already exists at this level
 */
router.post('/',
  requirePermission('categories:write'),
  categoriesController.createCategory
);

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories with filtering and pagination
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 255
 *         description: Search in name and description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, draft]
 *         description: Filter by status
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: Filter by parent category ID (null for root categories)
 *       - in: query
 *         name: hasParent
 *         schema:
 *           type: boolean
 *         description: Filter by whether category has a parent
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *       - in: query
 *         name: includeDocumentCount
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Include document count in response
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
 *           enum: [name, createdAt, updatedAt, status]
 *           default: name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/',
  requirePermission('categories:read'),
  categoriesController.getAllCategories
);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   get:
 *     summary: Get category by ID with full details
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:categoryId',
  requirePermission('categories:read'),
  categoriesController.getCategoryById
);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   put:
 *     summary: Update category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
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
 *                 description: Category name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Category description
 *               parentId:
 *                 type: integer
 *                 nullable: true
 *                 description: Parent category ID (null for root categories)
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 description: Category status
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid request data or circular reference
 *       404:
 *         description: Category or parent not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Category name already exists at this level
 */
router.put('/:categoryId',
  requirePermission('categories:write'),
  categoriesController.updateCategory
);

/**
 * @swagger
 * /api/v1/categories/{categoryId}:
 *   delete:
 *     summary: Delete category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       409:
 *         description: Cannot delete category with subcategories or documents
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:categoryId',
  requirePermission('categories:delete'),
  categoriesController.deleteCategory
);

// ==================== HIERARCHY ROUTES ====================

/**
 * @swagger
 * /api/v1/categories/{categoryId}/subcategories:
 *   get:
 *     summary: Get subcategories of a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:categoryId/subcategories',
  requirePermission('categories:read'),
  categoriesController.getSubcategories
);

/**
 * @swagger
 * /api/v1/categories/hierarchy:
 *   get:
 *     summary: Get category hierarchy (tree structure)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category hierarchy retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       documentCount:
 *                         type: integer
 *                       subcategories:
 *                         type: array
 *                         description: Nested subcategories
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/hierarchy',
  requirePermission('categories:read'),
  categoriesController.getCategoryHierarchy
);

/**
 * @swagger
 * /api/v1/categories/{categoryId}/path:
 *   get:
 *     summary: Get category path (breadcrumb)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category path retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:categoryId/path',
  requirePermission('categories:read'),
  categoriesController.getCategoryPath
);

// ==================== DOCUMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/categories/{categoryId}/documents:
 *   get:
 *     summary: Get documents in a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
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
 *         description: Category documents retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:categoryId/documents',
  requirePermission('categories:read'),
  categoriesController.getCategoryDocuments
);

// ==================== STATISTICS ROUTES ====================

/**
 * @swagger
 * /api/v1/categories/statistics:
 *   get:
 *     summary: Get category statistics and analytics
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category statistics retrieved successfully
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
 *                     total:
 *                       type: integer
 *                       description: Total number of categories
 *                     active:
 *                       type: integer
 *                       description: Number of active categories
 *                     root:
 *                       type: integer
 *                       description: Number of root categories
 *                     documents:
 *                       type: integer
 *                       description: Total documents across all categories
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/statistics',
  requirePermission('categories:read'),
  categoriesController.getCategoryStatistics
);

// ==================== BULK OPERATION ROUTES ====================

/**
 * @swagger
 * /api/v1/categories/bulk/delete:
 *   post:
 *     summary: Bulk delete categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
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
 *                 minItems: 1
 *                 description: Array of category IDs to delete
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
 *                             type: integer
 *                           message:
 *                             type: string
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
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
  requirePermission('categories:delete'),
  categoriesController.bulkDeleteCategories
);

/**
 * @swagger
 * /api/v1/categories/bulk/status:
 *   put:
 *     summary: Bulk update category status
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - categoryIds
 *               - status
 *             properties:
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 1
 *                 description: Array of category IDs to update
 *               status:
 *                 type: string
 *                 enum: [active, inactive, draft]
 *                 description: New status for all categories
 *     responses:
 *       200:
 *         description: Bulk status update completed (may include partial failures)
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
 *                             type: integer
 *                           data:
 *                             type: object
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           error:
 *                             type: string
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/bulk/status',
  requirePermission('categories:write'),
  categoriesController.bulkUpdateStatus
);

module.exports = router;