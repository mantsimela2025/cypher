const express = require('express');
const rbacService = require('../services/rbacService');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management operations
 */

/**
 * @swagger
 * /api/v1/permissions:
 *   get:
 *     summary: Get all permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
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
 *                       category:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', 
  requirePermission('permissions:read'),
  async (req, res) => {
    try {
      const permissions = await rbacService.getAllPermissions();
      
      res.json({
        success: true,
        data: permissions,
        message: 'Permissions retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permissions',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission retrieved successfully
 *       404:
 *         description: Permission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:id',
  requirePermission('permissions:read'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const permission = await rbacService.getPermissionById(parseInt(id));
      
      if (!permission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found'
        });
      }
      
      res.json({
        success: true,
        data: permission,
        message: 'Permission retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch permission',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/permissions:
 *   post:
 *     summary: Create new permission
 *     tags: [Permissions]
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
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       201:
 *         description: Permission created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/',
  requirePermission('permissions:write'),
  async (req, res) => {
    try {
      const { name, description, category } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Permission name is required'
        });
      }
      
      const permissionData = {
        name: name.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null
      };
      
      const newPermission = await rbacService.createPermission(permissionData);
      
      res.status(201).json({
        success: true,
        data: newPermission,
        message: 'Permission created successfully'
      });
    } catch (error) {
      console.error('Error creating permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create permission',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   put:
 *     summary: Update permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
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
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 maxLength: 50
 *     responses:
 *       200:
 *         description: Permission updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Permission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id',
  requirePermission('permissions:write'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, category } = req.body;
      
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (category !== undefined) updateData.category = category?.trim() || null;
      
      const updatedPermission = await rbacService.updatePermission(parseInt(id), updateData);
      
      if (!updatedPermission) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found'
        });
      }
      
      res.json({
        success: true,
        data: updatedPermission,
        message: 'Permission updated successfully'
      });
    } catch (error) {
      console.error('Error updating permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update permission',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/permissions/{id}:
 *   delete:
 *     summary: Delete permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission deleted successfully
 *       404:
 *         description: Permission not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id',
  requirePermission('permissions:write'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await rbacService.deletePermission(parseInt(id));
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Permission not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Permission deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting permission:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete permission',
        error: error.message
      });
    }
  }
);

module.exports = router;
