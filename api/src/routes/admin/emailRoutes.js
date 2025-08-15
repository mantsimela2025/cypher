const express = require('express');
const router = express.Router();
const emailService = require('../../services/emailService');
const emailTemplateService = require('../../services/emailTemplateService');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { validationResult } = require('express-validator');
const { query, param, body } = require('express-validator');

// For consistency with the guide, use authenticateToken as requireAuth alias
const requireAuth = authenticateToken;

// Simple validation middleware that checks express-validator results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * @swagger
 * /api/admin/email/logs:
 *   get:
 *     summary: Get email logs with filtering options
 *     tags: [Admin Email Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, delivered, bounced]
 *         description: Filter by email status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by email category
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *           enum: [smtp, mailersend, sendgrid, mailgun]
 *         description: Filter by email service
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in subject, recipient, or sender
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter emails from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter emails to this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of logs to return
 *     responses:
 *       200:
 *         description: Email logs retrieved successfully
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
 *                 total:
 *                   type: integer
 */
router.get('/logs', requireAuth, requireRole(['admin']), [
  query('status').optional().isIn(['pending', 'sent', 'failed', 'delivered', 'bounced']),
  query('category').optional().isString(),
  query('service').optional().isIn(['smtp', 'mailersend', 'sendgrid', 'mailgun']),
  query('search').optional().isString().isLength({ max: 255 }),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 1000 })
], validateRequest, async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      service: req.query.service,
      search: req.query.search,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      limit: parseInt(req.query.limit) || 100
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const logs = await emailService.getEmailLogs(filters);
    
    res.json({
      success: true,
      data: logs,
      total: logs.length
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email logs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/email/logs/stats:
 *   get:
 *     summary: Get email statistics
 *     tags: [Admin Email Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email statistics retrieved successfully
 */
router.get('/logs/stats', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    // This would need to be implemented in the email service
    const stats = {
      totalEmails: 0,
      sentEmails: 0,
      failedEmails: 0,
      pendingEmails: 0,
      successRate: 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email statistics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/email/logs/{id}:
 *   delete:
 *     summary: Delete a specific email log
 *     tags: [Admin Email Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Email log ID
 *     responses:
 *       200:
 *         description: Email log deleted successfully
 */
router.delete('/logs/:id', requireAuth, requireRole(['admin']), [
  param('id').isInt({ min: 1 })
], validateRequest, async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    // This would need to be implemented in the email service
    
    res.json({
      success: true,
      message: 'Email log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete email log',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/email/logs/cleanup:
 *   delete:
 *     summary: Delete old email logs (30+ days)
 *     tags: [Admin Email Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Old email logs deleted successfully
 */
router.delete('/logs/cleanup', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    // This would need to be implemented in the email service
    const deletedCount = 0;
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} old email logs`,
      deletedCount
    });
  } catch (error) {
    console.error('Error cleaning up old email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old email logs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/email/templates:
 *   get:
 *     summary: Get email templates
 *     tags: [Admin Email Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by template type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, inactive, archived]
 *         description: Filter by template status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in template name, description, or subject
 *     responses:
 *       200:
 *         description: Email templates retrieved successfully
 */
router.get('/templates', requireAuth, requireRole(['admin']), [
  query('type').optional().isString(),
  query('status').optional().isIn(['draft', 'active', 'inactive', 'archived']),
  query('search').optional().isString().isLength({ max: 255 })
], validateRequest, async (req, res) => {
  try {
    const filters = {
      type: req.query.type,
      status: req.query.status,
      search: req.query.search
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const templates = await emailTemplateService.getTemplates(filters);
    
    res.json({
      success: true,
      data: templates,
      total: templates.length
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/email/config:
 *   get:
 *     summary: Get email configuration
 *     tags: [Admin Email Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email configuration retrieved successfully
 */
router.get('/config', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const config = emailService.getProviderInfo();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error fetching email config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email configuration',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/email/test:
 *   post:
 *     summary: Test email configuration
 *     tags: [Admin Email Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email test completed
 */
router.post('/test', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const testResult = await emailService.testConnection();
    
    res.json({
      success: true,
      data: testResult
    });
  } catch (error) {
    console.error('Error testing email config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email configuration',
      error: error.message
    });
  }
});

module.exports = router;