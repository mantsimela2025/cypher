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
 *   name: Roles
 *   description: Role management operations
 */

/**
 * @swagger
 * /api/v1/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                       isSystem:
 *                         type: boolean
 *                       isDefault:
 *                         type: boolean
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
  requirePermission('roles:read'),
  async (req, res) => {
    try {
      const roles = await rbacService.getAllRoles();
      
      res.json({
        success: true,
        data: roles,
        message: 'Roles retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch roles',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/:id',
  requirePermission('roles:read'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const role = await rbacService.getRoleById(parseInt(id));
      
      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      res.json({
        success: true,
        data: role,
        message: 'Role retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch role',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/roles:
 *   post:
 *     summary: Create new role
 *     tags: [Roles]
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
 *               isSystem:
 *                 type: boolean
 *                 default: false
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/',
  requirePermission('roles:write'),
  async (req, res) => {
    try {
      const { name, description, isSystem = false, isDefault = false } = req.body;
      
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        });
      }
      
      const roleData = {
        name: name.trim(),
        description: description?.trim() || null,
        isSystem,
        isDefault
      };
      
      const newRole = await rbacService.createRole(roleData);
      
      res.status(201).json({
        success: true,
        data: newRole,
        message: 'Role created successfully'
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   put:
 *     summary: Update role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
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
 *               isSystem:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/:id',
  requirePermission('roles:write'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, isSystem, isDefault } = req.body;
      
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (isSystem !== undefined) updateData.isSystem = isSystem;
      if (isDefault !== undefined) updateData.isDefault = isDefault;
      
      const updatedRole = await rbacService.updateRole(parseInt(id), updateData);
      
      if (!updatedRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      res.json({
        success: true,
        data: updatedRole,
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update role',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/:id',
  requirePermission('roles:write'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const result = await rbacService.deleteRole(parseInt(id));
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete role',
        error: error.message
      });
    }
  }
);

module.exports = router;
