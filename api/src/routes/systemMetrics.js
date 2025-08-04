const express = require('express');
const router = express.Router();
const systemMetricsController = require('../controllers/systemMetricsController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     SystemMetric:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier
 *         name:
 *           type: string
 *           description: Metric name
 *         description:
 *           type: string
 *           description: Metric description
 *         type:
 *           type: string
 *           enum: [counter, gauge]
 *           description: Metric type
 *         category:
 *           type: string
 *           description: Metric category
 *         value:
 *           type: number
 *           description: Current metric value
 *         unit:
 *           type: string
 *           description: Unit of measurement
 *         labels:
 *           type: object
 *           description: Metric labels/tags
 *         threshold:
 *           type: object
 *           description: Alert thresholds
 *         source:
 *           type: string
 *           description: Data source
 *         aggregation_period:
 *           type: string
 *           description: How often the metric is calculated
 *         last_calculated:
 *           type: string
 *           format: date-time
 *           description: When the metric was last calculated
 *         metadata:
 *           type: object
 *           description: Additional metadata
 */

/**
 * @swagger
 * /api/v1/system-metrics:
 *   get:
 *     summary: Get all system, asset, and vulnerability metrics
 *     tags: [System Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [counter, gauge]
 *         description: Filter by metric type
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         description: Filter by data source
 *     responses:
 *       200:
 *         description: List of metrics
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
 *                     $ref: '#/components/schemas/SystemMetric'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/', systemMetricsController.getAllMetrics);

/**
 * @swagger
 * /api/v1/system-metrics/by-category:
 *   get:
 *     summary: Get metrics grouped by category
 *     tags: [System Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics grouped by category
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
 *                     systems:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemMetric'
 *                     assets:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemMetric'
 *                     vulnerabilities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemMetric'
 *                     patches:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemMetric'
 *                     risk_scores:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemMetric'
 *                     maturity:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SystemMetric'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_metrics:
 *                       type: integer
 *                     systems:
 *                       type: integer
 *                     assets:
 *                       type: integer
 *                     vulnerabilities:
 *                       type: integer
 *                     patches:
 *                       type: integer
 *                     risk_scores:
 *                       type: integer
 *                     maturity:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/by-category', systemMetricsController.getMetricsByCategory);

/**
 * @swagger
 * /api/v1/system-metrics/dashboard-summary:
 *   get:
 *     summary: Get key metrics for dashboard display
 *     tags: [System Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary metrics
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
 *                     metrics:
 *                       type: object
 *                       description: Key metrics with values and units
 *                     insights:
 *                       type: object
 *                       properties:
 *                         critical_risk_percentage:
 *                           type: string
 *                         overall_remediation_rate:
 *                           type: string
 *                         open_vulnerability_percentage:
 *                           type: string
 *                         risk_level:
 *                           type: string
 *                           enum: [LOW, MEDIUM, HIGH]
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard-summary', systemMetricsController.getDashboardSummary);

/**
 * @swagger
 * /api/v1/system-metrics/update:
 *   post:
 *     summary: Update all metrics (recalculate values)
 *     tags: [System Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error updating metrics
 */
router.post('/update', systemMetricsController.updateAllMetrics);

/**
 * @swagger
 * /api/v1/system-metrics/{name}:
 *   get:
 *     summary: Get specific metric by name
 *     tags: [System Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Metric name
 *     responses:
 *       200:
 *         description: Metric details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SystemMetric'
 *       404:
 *         description: Metric not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:name', systemMetricsController.getMetricByName);

module.exports = router;
