const express = require('express');
const systemsController = require('../controllers/systemsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Import new systems management services
const systemDiscoveryService = require('../services/systems/systemDiscoveryService');
const securityPostureService = require('../services/systems/securityPostureService');
const riskScoringService = require('../services/systems/riskScoringService');
const configurationDriftService = require('../services/systems/configurationDriftService');

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

// ============================================================================
// SYSTEM DISCOVERY ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/v1/systems/discovery/scan:
 *   post:
 *     summary: Start system discovery scan
 *     description: Initiates automated system discovery across on-premises, cloud, and hybrid environments
 *     tags: [System Discovery]
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
 *               - targets
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the discovery scan
 *                 example: "Production Network Discovery"
 *               description:
 *                 type: string
 *                 description: Description of the discovery scan
 *                 example: "Comprehensive network scan of production environment"
 *               methods:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [network_scan, port_scan, service_detection, aws_discovery, azure_discovery, gcp_discovery, ad_discovery, snmp_discovery]
 *                 description: Discovery methods to use
 *                 example: ["network_scan", "service_detection"]
 *               targets:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Target IP ranges, domains, or cloud regions
 *                 example: ["192.168.1.0/24", "10.0.0.0/16"]
 *               options:
 *                 type: object
 *                 description: Additional scan options
 *                 properties:
 *                   timeout:
 *                     type: integer
 *                     description: Scan timeout in milliseconds
 *                     example: 5000
 *                   threads:
 *                     type: integer
 *                     description: Number of concurrent threads
 *                     example: 10
 *     responses:
 *       201:
 *         description: Discovery scan started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/discovery/scan', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const discoveryConfig = req.body;

    // Validate required fields
    const requiredFields = ['name', 'targets'];
    const missingFields = requiredFields.filter(field => !discoveryConfig[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    const result = await systemDiscoveryService.startDiscovery(discoveryConfig);

    res.json({
      success: true,
      data: result,
      message: 'System discovery scan started successfully'
    });
  } catch (error) {
    console.error('Error starting system discovery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start system discovery',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/discovery/scans:
 *   get:
 *     summary: Get discovery scan history
 *     description: Retrieve history of system discovery scans with optional filtering
 *     tags: [System Discovery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, running, completed, failed, cancelled]
 *         description: Filter by scan status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of scans to return
 *     responses:
 *       200:
 *         description: Discovery scans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Production Network Discovery"
 *                       status:
 *                         type: string
 *                         enum: [pending, running, completed, failed, cancelled]
 *                         example: "completed"
 *                       systemsFound:
 *                         type: integer
 *                         example: 15
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:45:00Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/discovery/scans', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);

    const scans = await systemDiscoveryService.getDiscoveryHistory(filters);

    res.json({
      success: true,
      data: scans
    });
  } catch (error) {
    console.error('Error fetching discovery scans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch discovery scans',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/discovery/stats:
 *   get:
 *     summary: Get discovery statistics
 *     description: Retrieve comprehensive statistics about system discovery operations
 *     tags: [System Discovery]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Discovery statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalScans:
 *                       type: integer
 *                       example: 25
 *                     completedScans:
 *                       type: integer
 *                       example: 20
 *                     systemsDiscovered:
 *                       type: integer
 *                       example: 150
 *                     queueSize:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/discovery/stats', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const stats = await systemDiscoveryService.getDiscoveryStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching discovery stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch discovery stats',
      details: error.message
    });
  }
});

// ============================================================================
// SECURITY POSTURE ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/v1/systems/{id}/security-posture:
 *   get:
 *     summary: Get security posture assessment for a system
 *     description: Retrieve comprehensive security posture assessment including vulnerability, configuration, and compliance scores
 *     tags: [Security Posture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: System ID
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached assessment
 *     responses:
 *       200:
 *         description: Security posture assessment retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     systemId:
 *                       type: integer
 *                       example: 1
 *                     overallScore:
 *                       type: number
 *                       example: 75.5
 *                     postureStatus:
 *                       type: string
 *                       enum: [excellent, good, fair, poor, critical]
 *                       example: "good"
 *                     vulnerabilityScore:
 *                       type: number
 *                       example: 80.0
 *                     configurationScore:
 *                       type: number
 *                       example: 70.0
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: System not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/:id/security-posture', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { forceRefresh = false } = req.query;

    const posture = await securityPostureService.assessSystemSecurityPosture(
      parseInt(id),
      { forceRefresh: forceRefresh === 'true' }
    );

    res.json({
      success: true,
      data: posture
    });
  } catch (error) {
    console.error('Error getting security posture:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security posture',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/security-posture/overview:
 *   get:
 *     summary: Get security posture overview for all systems
 *     description: Retrieve security posture overview for all systems with optional filtering
 *     tags: [Security Posture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: postureStatus
 *         schema:
 *           type: string
 *           enum: [excellent, good, fair, poor, critical]
 *         description: Filter by posture status
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Minimum posture score
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         description: Maximum posture score
 *     responses:
 *       200:
 *         description: Security posture overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       systemId:
 *                         type: integer
 *                         example: 1
 *                       systemName:
 *                         type: string
 *                         example: "Production Web Server"
 *                       overallScore:
 *                         type: number
 *                         example: 75.5
 *                       postureStatus:
 *                         type: string
 *                         example: "good"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/security-posture/overview', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { postureStatus, minScore, maxScore } = req.query;

    const filters = {};
    if (postureStatus) filters.postureStatus = postureStatus;
    if (minScore) filters.minScore = parseInt(minScore);
    if (maxScore) filters.maxScore = parseInt(maxScore);

    const overview = await securityPostureService.getAllSystemsSecurityPosture(filters);

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error getting security posture overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security posture overview',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/security-posture/stats:
 *   get:
 *     summary: Get security posture statistics
 *     description: Retrieve comprehensive statistics about security posture across all systems
 *     tags: [Security Posture]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security posture statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSystems:
 *                       type: integer
 *                       example: 50
 *                     excellentSystems:
 *                       type: integer
 *                       example: 5
 *                     goodSystems:
 *                       type: integer
 *                       example: 20
 *                     fairSystems:
 *                       type: integer
 *                       example: 15
 *                     poorSystems:
 *                       type: integer
 *                       example: 8
 *                     criticalSystems:
 *                       type: integer
 *                       example: 2
 *                     averageScore:
 *                       type: number
 *                       format: float
 *                       example: 72.5
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/security-posture/stats', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const stats = await securityPostureService.getSecurityPostureStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting security posture stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get security posture stats',
      details: error.message
    });
  }
});

// ============================================================================
// RISK SCORING ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/v1/systems/{id}/risk-score:
 *   get:
 *     summary: Get dynamic risk score for a system
 *     description: Calculate and retrieve comprehensive risk score using multiple risk models and threat intelligence
 *     tags: [Risk Scoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: System ID
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *           enum: [cvss_vulnerability, configuration_drift, system_composite, enterprise_aggregate]
 *           default: system_composite
 *         description: Risk scoring model to use
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force refresh of cached risk score
 *     responses:
 *       200:
 *         description: Risk score calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     overallRisk:
 *                       type: integer
 *                       example: 75
 *                     riskLevel:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *                       example: "high"
 *                     components:
 *                       type: object
 *                       properties:
 *                         vulnerabilityRisk:
 *                           type: integer
 *                           example: 80
 *                         configurationRisk:
 *                           type: integer
 *                           example: 70
 *                     riskFactors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["5 critical vulnerabilities", "Unpatched systems"]
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Patch critical vulnerabilities", "Update configurations"]
 *       404:
 *         description: System not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/:id/risk-score', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { model = 'system_composite', forceRefresh = false } = req.query;

    const riskScore = await riskScoringService.calculateSystemRiskScore(
      parseInt(id),
      { model, forceRefresh: forceRefresh === 'true' }
    );

    res.json({
      success: true,
      data: riskScore
    });
  } catch (error) {
    console.error('Error calculating risk score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate risk score',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/risk-scoring/stats:
 *   get:
 *     summary: Get risk scoring statistics
 *     description: Retrieve comprehensive statistics about risk scoring across all systems
 *     tags: [Risk Scoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Risk scoring statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSystems:
 *                       type: integer
 *                       example: 50
 *                     lowRisk:
 *                       type: integer
 *                       example: 15
 *                     mediumRisk:
 *                       type: integer
 *                       example: 20
 *                     highRisk:
 *                       type: integer
 *                       example: 12
 *                     criticalRisk:
 *                       type: integer
 *                       example: 3
 *                     averageRisk:
 *                       type: number
 *                       format: float
 *                       example: 65.5
 *                     modelsLoaded:
 *                       type: integer
 *                       example: 4
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/risk-scoring/stats', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const stats = await riskScoringService.getRiskScoringStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting risk scoring stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get risk scoring stats',
      details: error.message
    });
  }
});

// ============================================================================
// CONFIGURATION DRIFT ENDPOINTS
// ============================================================================

/**
 * @swagger
 * /api/v1/systems/{id}/drift-detection:
 *   post:
 *     summary: Detect configuration drift for a system
 *     description: Perform comprehensive configuration drift detection using multiple detection methods
 *     tags: [Configuration Drift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: System ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detectionMethods:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [all, security_policy, firewall_rules, user_accounts, service_configuration, registry_settings, installed_software, system_settings, network_configuration, patch_level, stig_compliance, cis_benchmark]
 *                 default: ["all"]
 *                 description: Configuration drift detection methods to use
 *               forceRefresh:
 *                 type: boolean
 *                 default: false
 *                 description: Force refresh of baseline configuration
 *     responses:
 *       200:
 *         description: Configuration drift detection completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     systemId:
 *                       type: integer
 *                       example: 1
 *                     driftCount:
 *                       type: integer
 *                       example: 5
 *                     drifts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           driftType:
 *                             type: string
 *                             example: "security_policy"
 *                           severity:
 *                             type: string
 *                             enum: [low, medium, high, critical]
 *                             example: "high"
 *                           title:
 *                             type: string
 *                             example: "Password Minimum Length Reduced"
 *                           description:
 *                             type: string
 *                             example: "Password minimum length changed from 12 to 8"
 *       404:
 *         description: System not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/:id/drift-detection', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { detectionMethods = ['all'], forceRefresh = false } = req.body;

    const driftResult = await configurationDriftService.detectSystemConfigurationDrift(
      parseInt(id),
      { detectionMethods, forceRefresh }
    );

    res.json({
      success: true,
      data: driftResult,
      message: 'Configuration drift detection completed'
    });
  } catch (error) {
    console.error('Error detecting configuration drift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect configuration drift',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/{id}/drift-history:
 *   get:
 *     summary: Get configuration drift history for a system
 *     description: Retrieve historical configuration drift records for a specific system
 *     tags: [Configuration Drift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: System ID
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by drift severity
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, acknowledged, resolved, accepted]
 *         description: Filter by drift status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of drift records to return
 *     responses:
 *       200:
 *         description: Drift history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ConfigurationDrift'
 *       404:
 *         description: System not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/:id/drift-history', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { severity, status, limit = 50 } = req.query;

    const filters = {};
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);

    const driftHistory = await configurationDriftService.getSystemDriftHistory(parseInt(id), filters);

    res.json({
      success: true,
      data: driftHistory
    });
  } catch (error) {
    console.error('Error getting drift history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drift history',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/drift/{driftId}/acknowledge:
 *   post:
 *     summary: Acknowledge a configuration drift
 *     description: Acknowledge a detected configuration drift with optional notes
 *     tags: [Configuration Drift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driftId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Configuration drift ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Optional acknowledgment notes
 *                 example: "Acknowledged - scheduled for next maintenance window"
 *     responses:
 *       200:
 *         description: Configuration drift acknowledged successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Configuration drift not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/drift/:driftId/acknowledge', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { driftId } = req.params;
    const { notes = '' } = req.body;
    const userId = req.user?.id || 1; // Default to user 1 if not available

    await configurationDriftService.acknowledgeDrift(parseInt(driftId), userId, notes);

    res.json({
      success: true,
      message: 'Configuration drift acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging drift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge drift',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/drift/{driftId}/resolve:
 *   post:
 *     summary: Resolve a configuration drift
 *     description: Mark a configuration drift as resolved with optional resolution notes
 *     tags: [Configuration Drift]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driftId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Configuration drift ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolution:
 *                 type: string
 *                 description: Optional resolution notes
 *                 example: "Configuration restored to baseline - password policy updated"
 *     responses:
 *       200:
 *         description: Configuration drift resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Configuration drift not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.post('/drift/:driftId/resolve', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const { driftId } = req.params;
    const { resolution = '' } = req.body;
    const userId = req.user?.id || 1; // Default to user 1 if not available

    await configurationDriftService.resolveDrift(parseInt(driftId), userId, resolution);

    res.json({
      success: true,
      message: 'Configuration drift resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving drift:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve drift',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/systems/drift/stats:
 *   get:
 *     summary: Get configuration drift statistics
 *     description: Retrieve comprehensive statistics about configuration drift across all systems
 *     tags: [Configuration Drift]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration drift statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDrifts:
 *                       type: integer
 *                       example: 25
 *                     openDrifts:
 *                       type: integer
 *                       example: 15
 *                     criticalDrifts:
 *                       type: integer
 *                       example: 3
 *                     highDrifts:
 *                       type: integer
 *                       example: 8
 *                     recentDrifts:
 *                       type: integer
 *                       example: 5
 *                     resolvedDrifts:
 *                       type: integer
 *                       example: 10
 *                     detectorsLoaded:
 *                       type: integer
 *                       example: 11
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get('/drift/stats', requireRole(['admin', 'moderator']), async (req, res) => {
  try {
    const stats = await configurationDriftService.getConfigurationDriftStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting drift stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drift stats',
      details: error.message
    });
  }
});

module.exports = router;
