const authService = require('../services/authService');
const { validationResult } = require('express-validator');

const authController = {
  // Register new user
  register: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, username, password, firstName, lastName } = req.body;
      
      const result = await authService.register({
        email,
        username,
        password,
        firstName,
        lastName,
      });

      res.status(201).json({
        success: true,
        data: result,
        message: 'User registered successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful',
      });
    } catch (error) {
      next(error);
    }
  },

  // Refresh token
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout user
  logout: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  getProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await authService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Validate token
  validateToken: async (req, res, next) => {
    try {
      // If we reach here, the token is valid (authenticateToken middleware passed)
      const user = req.user;

      res.status(200).json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            status: user.status,
          }
        },
        message: 'Token is valid',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
