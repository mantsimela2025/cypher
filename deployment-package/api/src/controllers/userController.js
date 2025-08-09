const userService = require('../services/userService');
const { validationResult } = require('express-validator');

const userController = {
  // Get all users
  getAllUsers: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, search, role, status } = req.query;
      const users = await userService.getAllUsers({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        role,
        status,
      });
      
      res.status(200).json({
        success: true,
        data: users,
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new user
  createUser: async (req, res, next) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const userData = req.body;
      const newUser = await userService.createUser(userData);
      
      res.status(201).json({
        success: true,
        data: newUser,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user
  updateUser: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      const updatedUser = await userService.updateUser(id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deleted = await userService.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;
