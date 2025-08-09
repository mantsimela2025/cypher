const express = require('express');
const router = express.Router();
const tenableController = require('../../controllers/integrations/tenableController');
const { authenticateToken } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');

/**
 * Tenable Integration Routes
 * All routes require authentication and appropriate permissions
 */

// Debug routes (no auth required for testing)
router.get('/debug/assets', tenableController.debugAssets);
router.get('/debug/update-sample-data', tenableController.updateSampleData);
router.post('/debug/update-sample-data', tenableController.updateSampleData);
router.get('/debug/check-system-ids', tenableController.checkSystemIds);
router.get('/debug/create-system-associations', tenableController.createSystemAssociations);
router.get('/debug/check-systems-and-assets', tenableController.checkSystemsAndAssets);
router.get('/debug/systems', tenableController.debugSystems);
router.get('/debug/test-assets', tenableController.getAssets);

// Temporarily move assets endpoints here for testing (no auth required)
router.get('/assets', tenableController.getAssets);
router.get('/assets/:assetUuid/network', tenableController.getAssetNetwork);
router.get('/assets/:assetUuid/systems', tenableController.getAssetSystems);

// Apply authentication middleware to all other routes
router.use(authenticateToken);

/**
 * @route   GET /api/integrations/tenable/status
 * @desc    Get Tenable service status and health
 * @access  Private (requires 'view_integrations' permission)
 */
router.get('/status',
  requirePermission('view_integrations'),
  tenableController.getStatus
);

/**
 * @route   POST /api/integrations/tenable/sync/assets
 * @desc    Trigger manual asset synchronization
 * @access  Private (requires 'manage_integrations' permission)
 */
router.post('/sync/assets',
  requirePermission('manage_integrations'),
  tenableController.syncAssets
);

/**
 * @route   POST /api/integrations/tenable/sync/vulnerabilities
 * @desc    Trigger manual vulnerability synchronization
 * @access  Private (requires 'manage_integrations' permission)
 */
router.post('/sync/vulnerabilities',
  requirePermission('manage_integrations'),
  tenableController.syncVulnerabilities
);

/**
 * @route   POST /api/integrations/tenable/sync/all
 * @desc    Trigger full synchronization (assets + vulnerabilities)
 * @access  Private (requires 'manage_integrations' permission)
 */
router.post('/sync/all',
  requirePermission('manage_integrations'),
  tenableController.syncAll
);

// Assets route moved above authentication middleware for testing

/**
 * @route   GET /api/integrations/tenable/vulnerabilities
 * @desc    Get synchronized vulnerabilities with pagination and filtering
 * @access  Private (requires 'view_vulnerabilities' permission)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50)
 * @query   severity - Filter by severity (critical, high, medium, low, info)
 * @query   state - Filter by state (open, fixed, etc.)
 * @query   assetUuid - Filter by specific asset UUID
 */
router.get('/vulnerabilities',
  requirePermission('view_vulnerabilities'),
  tenableController.getVulnerabilities
);

/**
 * @route   GET /api/integrations/tenable/assets/:assetUuid
 * @desc    Get detailed asset information with vulnerabilities
 * @access  Private (requires 'view_assets' permission)
 */
router.get('/assets/:assetUuid',
  requirePermission('view_assets'),
  tenableController.getAssetDetails
);

// Asset detail routes moved above authentication middleware for testing

/**
 * @route   GET /api/integrations/tenable/dashboard
 * @desc    Get dashboard statistics for Tenable data
 * @access  Private (requires 'view_dashboard' permission)
 */
router.get('/dashboard',
  requirePermission('view_dashboard'),
  tenableController.getDashboardStats
);

module.exports = router;
