const express = require('express');
const router = express.Router();
const globalMetricsService = require('../services/globalMetricsService');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permissions');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/global-metrics/vulnerability:
 *   get:
 *     summary: Get vulnerability metrics with real-time calculation
 *     tags: [Global Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force recalculation of metrics
 *     responses:
 *       200:
 *         description: Vulnerability metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     critical:
 *                       type: number
 *                     high:
 *                       type: number
 *                     medium:
 *                       type: number
 *                     low:
 *                       type: number
 *                     resolutionRate:
 *                       type: number
 *                     lastCalculated:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/vulnerability', 
  requirePermission('metrics:read'),
  async (req, res) => {
    try {
      const forceRefresh = req.query.forceRefresh === 'true';
      
      const metrics = await globalMetricsService.getVulnerabilityMetrics(forceRefresh);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting vulnerability metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving vulnerability metrics',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/global-metrics/system:
 *   get:
 *     summary: Get system metrics with real-time calculation
 *     tags: [Global Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force recalculation of metrics
 *     responses:
 *       200:
 *         description: System metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/system', 
  requirePermission('metrics:read'),
  async (req, res) => {
    try {
      const forceRefresh = req.query.forceRefresh === 'true';
      
      const metrics = await globalMetricsService.getSystemMetrics(forceRefresh);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting system metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving system metrics',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/global-metrics/asset:
 *   get:
 *     summary: Get asset metrics with real-time calculation
 *     tags: [Global Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force recalculation of metrics
 *     responses:
 *       200:
 *         description: Asset metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/asset', 
  requirePermission('metrics:read'),
  async (req, res) => {
    try {
      const forceRefresh = req.query.forceRefresh === 'true';
      
      const metrics = await globalMetricsService.getAssetMetrics(forceRefresh);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Error getting asset metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving asset metrics',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/global-metrics/dashboard/{type}:
 *   get:
 *     summary: Get dashboard metrics by type
 *     tags: [Global Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [vulnerability, system, asset]
 *         description: Dashboard type
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force recalculation of metrics
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *       400:
 *         description: Invalid dashboard type
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard/:type', 
  requirePermission('metrics:read'),
  async (req, res) => {
    try {
      const { type } = req.params;
      const forceRefresh = req.query.forceRefresh === 'true';
      
      const validTypes = ['vulnerability', 'system', 'asset'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid dashboard type. Must be one of: ${validTypes.join(', ')}`
        });
      }
      
      const metrics = await globalMetricsService.getDashboardMetrics(type, forceRefresh);
      
      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error(`Error getting ${req.params.type} dashboard metrics:`, error);
      res.status(500).json({
        success: false,
        message: `Error retrieving ${req.params.type} dashboard metrics`,
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/global-metrics/metric/{name}:
 *   get:
 *     summary: Get a specific metric by name
 *     tags: [Global Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Metric name
 *       - in: query
 *         name: forceRefresh
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Force recalculation of metric
 *     responses:
 *       200:
 *         description: Metric retrieved successfully
 *       404:
 *         description: Metric not found
 *       401:
 *         description: Unauthorized
 */
router.get('/metric/:name', 
  requirePermission('metrics:read'),
  async (req, res) => {
    try {
      const { name } = req.params;
      const forceRefresh = req.query.forceRefresh === 'true';
      
      const metric = await globalMetricsService.getMetricByName(name, forceRefresh);
      
      res.json({
        success: true,
        data: metric
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      console.error(`Error getting metric ${req.params.name}:`, error);
      res.status(500).json({
        success: false,
        message: `Error retrieving metric ${req.params.name}`,
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/v1/global-metrics/category/{category}/refresh:
 *   post:
 *     summary: Refresh all metrics in a category
 *     tags: [Global Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [security, systems, assets, vulnerabilities, compliance, performance]
 *         description: Metric category
 *     responses:
 *       200:
 *         description: Metrics refreshed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/category/:category/refresh', 
  requirePermission('metrics:update'),
  async (req, res) => {
    try {
      const { category } = req.params;
      
      const result = await globalMetricsService.refreshMetricsByCategory(category);
      
      res.json({
        success: true,
        message: `Refreshed ${result.successful} out of ${result.totalMetrics} metrics in category '${category}'`,
        data: result
      });
    } catch (error) {
      console.error(`Error refreshing metrics for category ${req.params.category}:`, error);
      res.status(500).json({
        success: false,
        message: `Error refreshing metrics for category ${req.params.category}`,
        error: error.message
      });
    }
  }
);

module.exports = router;
