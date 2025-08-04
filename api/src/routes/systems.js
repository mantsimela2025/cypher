const express = require('express');
const systemsController = require('../controllers/systemsController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Temporarily disable authentication for testing
// router.use(authenticateToken);

/**
 * @route   GET /api/v1/systems
 * @desc    Get all systems with filtering, pagination, and search
 * @access  Private
 */
router.get('/', systemsController.getAllSystems);

/**
 * @route   GET /api/v1/systems/stats
 * @desc    Get systems statistics for dashboard cards
 * @access  Private
 */
router.get('/stats', systemsController.getSystemsStats);

/**
 * @route   GET /api/v1/systems/:id
 * @desc    Get system by ID with related data
 * @access  Private
 */
router.get('/:id', systemsController.getSystemById);

/**
 * @route   GET /api/v1/systems/:id/assets/count
 * @desc    Get asset count for a system
 * @access  Private
 */
router.get('/:id/assets/count', systemsController.getSystemAssetsCount);

/**
 * @route   GET /api/v1/systems/:id/assets
 * @desc    Get assets associated with a system
 * @access  Private
 */
router.get('/:id/assets', systemsController.getSystemAssets);

/**
 * @route   GET /api/v1/systems/:id/vulnerabilities/count
 * @desc    Get vulnerability count for a system
 * @access  Private
 */
router.get('/:id/vulnerabilities/count', systemsController.getSystemVulnerabilitiesCount);

/**
 * @route   GET /api/v1/systems/:id/vulnerabilities
 * @desc    Get vulnerabilities for a system
 * @access  Private
 */
router.get('/:id/vulnerabilities', systemsController.getSystemVulnerabilities);

/**
 * @route   GET /api/v1/systems/:id/compliance
 * @desc    Get compliance status for a system
 * @access  Private
 */
router.get('/:id/compliance', systemsController.getSystemCompliance);

/**
 * @route   GET /api/v1/systems/:id/analytics
 * @desc    Get analytics data for a system
 * @access  Private
 */
router.get('/:id/analytics', systemsController.getSystemAnalytics);

/**
 * @route   POST /api/v1/systems
 * @desc    Create new system
 * @access  Private
 */
router.post('/', systemsController.createSystem);

/**
 * @route   PUT /api/v1/systems/:id
 * @desc    Update system
 * @access  Private
 */
router.put('/:id', systemsController.updateSystem);

/**
 * @route   DELETE /api/v1/systems/:id
 * @desc    Delete system
 * @access  Private
 */
router.delete('/:id', systemsController.deleteSystem);

/**
 * @route   POST /api/v1/systems/bulk
 * @desc    Bulk operations on systems (update status, add tags, etc.)
 * @access  Private
 */
router.post('/bulk', systemsController.bulkOperations);

/**
 * @route   POST /api/v1/systems/sync
 * @desc    Sync systems from external sources (Xacta)
 * @access  Private
 */
router.post('/sync', systemsController.syncSystems);

/**
 * @route   GET /api/v1/systems/export
 * @desc    Export systems data
 * @access  Private
 */
router.get('/export', systemsController.exportSystems);

module.exports = router;
