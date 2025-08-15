const express = require('express');
const { body, param, query } = require('express-validator');
const emailController = require('../controllers/emailController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ✅ CORRECT: Input validation middleware
const validateTestEmail = [
  body('recipientEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid recipient email is required'),
  body('senderEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid sender email is required'),
];

const validateNotificationEmail = [
  body('recipientEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid recipient email is required'),
  body('subject')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be under 200 characters'),
  body('message')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message is required and must be under 10,000 characters'),
  body('senderEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid sender email is required'),
];

const validateBulkEmail = [
  body('recipients')
    .isArray({ min: 1, max: 50 })
    .withMessage('Recipients must be an array with 1-50 email addresses'),
  body('recipients.*')
    .isEmail()
    .normalizeEmail()
    .withMessage('Each recipient must be a valid email address'),
  body('subject')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject is required and must be under 200 characters'),
  body('message')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message is required and must be under 10,000 characters'),
  body('senderEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid sender email is required'),
];

const validateTestEmails = [
  body('count')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Count must be between 1 and 10'),
  body('senderEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid sender email is required'),
];

const validateEmailLogQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['sent', 'failed', 'delivered', 'bounced'])
    .withMessage('Status must be one of: sent, failed, delivered, bounced'),
  query('category')
    .optional()
    .isIn(['test', 'notification', 'welcome', 'alert', 'report'])
    .withMessage('Category must be one of: test, notification, welcome, alert, report'),
];

// ✅ CORRECT: Apply authentication to all routes
router.use(authenticateToken);

// ✅ CORRECT: RESTful routes with proper permissions

// GET /api/v1/email/status - Get SES configuration status
router.get('/status', 
  requireRole(['admin', 'user']), 
  emailController.getSESStatus
);

// GET /api/v1/email/templates - Get predefined email templates
router.get('/templates', 
  requireRole(['admin', 'user']), 
  emailController.getEmailTemplates
);

// POST /api/v1/email/test - Send a test email
router.post('/test', 
  requireRole(['admin']), 
  validateTestEmail, 
  emailController.sendTestEmail
);

// POST /api/v1/email/notification - Send a single notification email
router.post('/notification', 
  requireRole(['admin']), 
  validateNotificationEmail, 
  emailController.sendNotificationEmail
);

// POST /api/v1/email/bulk - Send bulk notification emails
router.post('/bulk',
  requireRole(['admin']),
  validateBulkEmail,
  emailController.sendBulkEmails
);

// GET /api/v1/email/logs - Get email logs with filtering and pagination
router.get('/logs',
  requireRole(['admin']),
  validateEmailLogQuery,
  emailController.getEmailLogs
);

// GET /api/v1/email/stats - Get email statistics
router.get('/stats',
  requireRole(['admin']),
  emailController.getEmailStats
);

// POST /api/v1/email/test-bulk - Send multiple test emails for logging demonstration
router.post('/test-bulk',
  requireRole(['admin']),
  validateTestEmails,
  emailController.sendTestEmails
);

module.exports = router;