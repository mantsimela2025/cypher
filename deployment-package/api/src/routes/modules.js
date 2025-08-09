const express = require('express');
const moduleController = require('../controllers/moduleController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== MODULE MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/modules:
 *   post:
 *     summary: Create a new application module
 *     tags: [Module Management]
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
 *                 maxLength: 100
 *                 description: Unique module name
 *               description:
 *                 type: string
 *                 description: Module description
 *               enabled:
 *                 type: boolean
 *                 default: false
 *                 description: Whether module is enabled
 *     responses:
 *       201:
 *         description: Module created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Module with this name already exists
 */
router.post('/', 
  requirePermission('modules', 'admin'),
  moduleController.createModule
);

/**
 * @swagger
 * /api/v1/modules:
 *   get:
 *     summary: Get all modules with filtering and pagination
 *     tags: [Module Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: enabled
 *         schema:
 *           type: boolean
 *         description: Filter by enabled status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in name and description
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
 *           enum: [name, enabled, createdAt, updatedAt]
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
 *         description: Modules retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  requirePermission('modules', 'read'),
  moduleController.getAllModules
);

/**
 * @swagger
 * /api/v1/modules/{moduleId}:
 *   get:
 *     summary: Get module by ID with full details
 *     tags: [Module Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module retrieved successfully
 *       404:
 *         description: Module not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:moduleId', 
  requirePermission('modules', 'read'),
  moduleController.getModuleById
);

/**
 * @swagger
 * /api/v1/modules/{moduleId}:
 *   put:
 *     summary: Update module
 *     tags: [Module Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Module name
 *               description:
 *                 type: string
 *                 description: Module description
 *               enabled:
 *                 type: boolean
 *                 description: Whether module is enabled
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Module not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Module with this name already exists
 */
router.put('/:moduleId', 
  requirePermission('modules', 'admin'),
  moduleController.updateModule
);

/**
 * @swagger
 * /api/v1/modules/{moduleId}:
 *   delete:
 *     summary: Delete module
 *     tags: [Module Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module deleted successfully
 *       404:
 *         description: Module not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Cannot delete module - other modules depend on it
 */
router.delete('/:moduleId', 
  requirePermission('modules', 'admin'),
  moduleController.deleteModule
);

/**
 * @swagger
 * /api/v1/modules/{moduleId}/toggle:
 *   post:
 *     summary: Toggle module enabled status
 *     tags: [Module Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module status toggled successfully
 *       404:
 *         description: Module not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: Cannot enable module - required dependencies are disabled
 */
router.post('/:moduleId/toggle', 
  requirePermission('modules', 'admin'),
  moduleController.toggleModuleStatus
);

// ==================== NAVIGATION MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/modules/navigation:
 *   post:
 *     summary: Create navigation item
 *     tags: [Module Navigation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - moduleId
 *               - navLabel
 *               - navPath
 *             properties:
 *               moduleId:
 *                 type: integer
 *                 description: Module ID
 *               navLabel:
 *                 type: string
 *                 maxLength: 100
 *                 description: Navigation label
 *               navPath:
 *                 type: string
 *                 maxLength: 255
 *                 description: Navigation path/route
 *               navIcon:
 *                 type: string
 *                 maxLength: 100
 *                 description: Navigation icon
 *               navOrder:
 *                 type: integer
 *                 default: 0
 *                 description: Navigation order
 *               parentId:
 *                 type: integer
 *                 description: Parent navigation item ID for nested navigation
 *               isVisible:
 *                 type: boolean
 *                 default: true
 *                 description: Whether navigation item is visible
 *               requiresPermission:
 *                 type: string
 *                 maxLength: 100
 *                 description: Specific permission required for this navigation item
 *     responses:
 *       201:
 *         description: Navigation item created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/navigation', 
  requirePermission('modules', 'admin'),
  moduleController.createNavigation
);

/**
 * @swagger
 * /api/v1/modules/{moduleId}/navigation:
 *   get:
 *     summary: Get navigation for module
 *     tags: [Module Navigation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Module navigation retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:moduleId/navigation', 
  requirePermission('modules', 'read'),
  moduleController.getModuleNavigation
);

/**
 * @swagger
 * /api/v1/modules/navigation/user:
 *   get:
 *     summary: Get user's accessible navigation based on role permissions
 *     tags: [Module Navigation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User navigation retrieved successfully
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
 *                       moduleId:
 *                         type: integer
 *                       moduleName:
 *                         type: string
 *                       navId:
 *                         type: integer
 *                       navLabel:
 *                         type: string
 *                       navPath:
 *                         type: string
 *                       navIcon:
 *                         type: string
 *                       navOrder:
 *                         type: integer
 *                       children:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/NavigationItem'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/navigation/user',
  moduleController.getUserNavigation
);

// ==================== PERMISSION MANAGEMENT ROUTES ====================

/**
 * @swagger
 * /api/v1/modules/roles/{roleId}/modules/{moduleId}/permissions:
 *   put:
 *     summary: Set role permissions for module
 *     tags: [Module Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               canView:
 *                 type: boolean
 *                 default: true
 *                 description: Can view module
 *               canCreate:
 *                 type: boolean
 *                 default: false
 *                 description: Can create in module
 *               canEdit:
 *                 type: boolean
 *                 default: false
 *                 description: Can edit in module
 *               canDelete:
 *                 type: boolean
 *                 default: false
 *                 description: Can delete in module
 *               canAdmin:
 *                 type: boolean
 *                 default: false
 *                 description: Can administer module
 *     responses:
 *       200:
 *         description: Role module permissions set successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/roles/:roleId/modules/:moduleId/permissions',
  requirePermission('modules', 'admin'),
  moduleController.setRoleModulePermissions
);

/**
 * @swagger
 * /api/v1/modules/roles/{roleId}/modules/{moduleId}/permissions:
 *   get:
 *     summary: Get role permissions for module
 *     tags: [Module Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *     responses:
 *       200:
 *         description: Role module permissions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/roles/:roleId/modules/:moduleId/permissions',
  requirePermission('modules', 'read'),
  moduleController.getRoleModulePermissions
);

/**
 * @swagger
 * /api/v1/modules/{moduleId}/permissions/{permission}/check:
 *   get:
 *     summary: Check if current user has specific permission for module
 *     tags: [Module Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Module ID
 *       - in: path
 *         name: permission
 *         required: true
 *         schema:
 *           type: string
 *           enum: [canView, canCreate, canEdit, canDelete, canAdmin]
 *         description: Permission to check
 *     responses:
 *       200:
 *         description: User module permission checked successfully
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
 *                     userId:
 *                       type: integer
 *                     moduleId:
 *                       type: integer
 *                     permission:
 *                       type: string
 *                     hasPermission:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/:moduleId/permissions/:permission/check',
  moduleController.checkUserModulePermission
);

module.exports = router;
