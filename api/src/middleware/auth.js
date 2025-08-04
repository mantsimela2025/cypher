const jwt = require('jsonwebtoken');
const config = require('../config');
const { db } = require('../db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');

// Middleware to authenticate JWT tokens
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Check if user still exists and is active
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated or suspended',
      });
    }

    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

// Middleware to check if user owns the resource or is admin
const requireOwnershipOrAdmin = (getUserIdFromParams = (req) => req.params.id) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const resourceUserId = getUserIdFromParams(req);
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if user is admin or owns the resource
    if (userRole === 'admin' || currentUserId === parseInt(resourceUserId)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrAdmin,
};
