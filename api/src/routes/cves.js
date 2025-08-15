const express = require('express');
const { body, param, query } = require('express-validator');
const controller = require('../controllers/cveController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ✅ CORRECT: Input validation middleware
const validateCveId = [
  param('cveId')
    .matches(/^CVE-\d{4}-\d{4,}$/i)
    .withMessage('Invalid CVE ID format. Expected format: CVE-YYYY-NNNN')
];

const validateAdvancedSearch = [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query is required'),
  query('type')
    .optional()
    .isIn(['all', 'exploitable', 'critical'])
    .withMessage('Invalid search type. Must be: all, exploitable, or critical'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('severity')
    .optional()
    .isIn(['critical', 'high', 'medium', 'low', 'unscored'])
    .withMessage('Invalid severity level'),
  query('sortBy')
    .optional()
    .isIn(['publishedDate', 'lastModifiedDate', 'cvss3BaseScore', 'cvss2BaseScore', 'cveId'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// ✅ CORRECT: Apply authentication to all routes
router.use(authenticateToken);

// ✅ CORRECT: RESTful routes with proper permissions and validation

/**
 * GET /api/v1/cves
 * Get CVEs with filtering, sorting, and pagination
 */
router.get('/',
  requireRole(['admin', 'user']),
  validateQuery,
  controller.getAll
);

/**
 * GET /api/v1/cves/stats/summary
 * Get CVE statistics and summary - Must come before /:cveId to avoid conflicts
 */
router.get('/stats/summary',
  requireRole(['admin', 'user']),
  controller.getStats
);

/**
 * GET /api/v1/cves/search/advanced
 * Advanced search with full-text capabilities
 */
router.get('/search/advanced',
  requireRole(['admin', 'user']),
  validateAdvancedSearch,
  controller.advancedSearch
);

/**
 * GET /api/v1/cves/:cveId
 * Get specific CVE details from National Vulnerability Database (NVD API)
 */
router.get('/:cveId',
  validateCveId,
  requireRole(['admin', 'user']),
  controller.getById
);

module.exports = router;
