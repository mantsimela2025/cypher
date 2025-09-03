const express = require('express');
const metricsController = require('../controllers/metricsController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== CORE METRICS ROUTES ====================

/**
 * @swagger
 * /api/v1/metrics:
 *   post:
 *     summary: Create new metric
 *     tags: [Metrics - Core]
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
 *               - type
 *               - query
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *                 description: Metric name
 *                 example: "Total Active Users"
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Metric description
 *               type:
 *                 type: string
 *                 enum: [counter, gauge, histogram, summary, percentage, ratio, trend, status]
 *                 description: Metric type
 *               category:
 *                 type: string
 *                 enum: [systems, assets, vulnerabilities, compliance, performance, security, financial, operational, user_activity, network, infrastructure, applications]
 *                 description: Metric category
 *               query:
 *                 type: string
 *                 maxLength: 10000
 *                 description: SQL query to calculate the metric
 *                 example: "SELECT COUNT(*) FROM users WHERE status = 'active'"
 *               value:
 *                 type: number
 *                 default: 0
 *                 description: Current metric value
 *               unit:
 *                 type: string
 *                 maxLength: 255
 *                 description: Unit of measurement
 *                 example: "users"
 *               labels:
 *                 type: object
 *                 description: Metric labels
 *               threshold:
 *                 type: object
 *                 description: Threshold configuration
 *               source:
 *                 type: string
 *                 maxLength: 255
 *                 description: Data source
 *               aggregationPeriod:
 *                 type: string
 *                 maxLength: 255
 *                 description: Aggregation period
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether metric is active
 *               metadata:
 *                 type: object
 *                 description: Additional metadata
 *     responses:
 *       201:
 *         description: Metric created successfully
 *       400:
 *         description: Invalid request or SQL query
 *       401:
 *         description: Unauthorized
 */
router.post('/', 
  requireRole(['admin']),
  metricsController.createMetric
);

/**
 * @swagger
 * /api/v1/metrics:
 *   get:
 *     summary: Get all metrics with filtering and pagination
 *     tags: [Metrics - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [counter, gauge, histogram, summary, percentage, ratio, trend, status]
 *         description: Filter by metric type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [systems, assets, vulnerabilities, compliance, performance, security, financial, operational, user_activity, network, infrastructure, applications]
 *         description: Filter by metric category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: createdBy
 *         schema:
 *           type: integer
 *         description: Filter by creator user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: Search in name, description, and source
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of results per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, name, type, category, value]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/',
  requireRole(['admin', 'user']),
  metricsController.getAllMetrics
);

/**
 * @swagger
 * /api/v1/metrics/{metricId}:
 *   get:
 *     summary: Get metric by ID
 *     tags: [Metrics - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Metric ID
 *     responses:
 *       200:
 *         description: Metric retrieved successfully
 *       404:
 *         description: Metric not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:metricId', 
  requireRole(['admin', 'user']),
  metricsController.getMetricById
);

/**
 * @swagger
 * /api/v1/metrics/{metricId}:
 *   put:
 *     summary: Update metric
 *     tags: [Metrics - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Metric ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               type:
 *                 type: string
 *                 enum: [counter, gauge, histogram, summary, percentage, ratio, trend, status]
 *               category:
 *                 type: string
 *                 enum: [systems, assets, vulnerabilities, compliance, performance, security, financial, operational, user_activity, network, infrastructure, applications]
 *               query:
 *                 type: string
 *                 maxLength: 10000
 *               value:
 *                 type: number
 *               unit:
 *                 type: string
 *                 maxLength: 255
 *               labels:
 *                 type: object
 *               threshold:
 *                 type: object
 *               source:
 *                 type: string
 *                 maxLength: 255
 *               aggregationPeriod:
 *                 type: string
 *                 maxLength: 255
 *               isActive:
 *                 type: boolean
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Metric updated successfully
 *       400:
 *         description: Invalid request or SQL query
 *       404:
 *         description: Metric not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:metricId', 
  requireRole(['admin']),
  metricsController.updateMetric
);

/**
 * @swagger
 * /api/v1/metrics/{metricId}:
 *   delete:
 *     summary: Delete metric
 *     tags: [Metrics - Core]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Metric ID
 *     responses:
 *       200:
 *         description: Metric deleted successfully
 *       404:
 *         description: Metric not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:metricId', 
  requireRole(['admin']),
  metricsController.deleteMetric
);

// ==================== METRIC CALCULATION ROUTES ====================

/**
 * @swagger
 * /api/v1/metrics/{metricId}/calculate:
 *   post:
 *     summary: Calculate metric value
 *     tags: [Metrics - Calculation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Metric ID
 *     responses:
 *       200:
 *         description: Metric calculated successfully
 *       400:
 *         description: Metric has no query defined
 *       404:
 *         description: Metric not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:metricId/calculate', 
  requireRole(['admin']),
  metricsController.calculateMetric
);

/**
 * @swagger
 * /api/v1/metrics/calculate/all:
 *   post:
 *     summary: Calculate all active metrics
 *     tags: [Metrics - Calculation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All metrics calculated successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/calculate/all',
  requireRole(['admin']),
  metricsController.calculateAllMetrics
);

// ==================== ANALYTICS & REPORTING ROUTES ====================

/**
 * @swagger
 * /api/v1/metrics/analytics/by-category:
 *   get:
 *     summary: Get metrics by category
 *     tags: [Metrics - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics by category retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics/by-category',
  requireRole(['admin', 'user']),
  metricsController.getMetricsByCategory
);

/**
 * @swagger
 * /api/v1/metrics/analytics/by-type:
 *   get:
 *     summary: Get metrics by type
 *     tags: [Metrics - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics by type retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics/by-type',
  requireRole(['admin', 'user']),
  metricsController.getMetricsByType
);

/**
 * @swagger
 * /api/v1/metrics/search:
 *   get:
 *     summary: Search metrics
 *     tags: [Metrics - Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search term
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [counter, gauge, histogram, summary, percentage, ratio, trend, status]
 *         description: Filter by metric type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [systems, assets, vulnerabilities, compliance, performance, security, financial, operational, user_activity, network, infrastructure, applications]
 *         description: Filter by metric category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Metric search completed successfully
 *       400:
 *         description: Invalid search parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/search',
  requireRole(['admin', 'user']),
  metricsController.searchMetrics
);

// ==================== CHART TYPES ROUTES ====================

/**
 * @swagger
 * /api/v1/metrics/chart-types:
 *   post:
 *     summary: Create chart type
 *     tags: [Metrics - Chart Types]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Chart type name
 *               type:
 *                 type: string
 *                 enum: [line, bar, pie, doughnut, area, scatter, bubble, radar, polar, gauge, table, number, progress, heatmap, treemap]
 *                 description: Chart type
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Chart type description
 *               defaultConfig:
 *                 type: object
 *                 description: Default configuration
 *               supportedMetricTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Supported metric types
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether chart type is active
 *     responses:
 *       201:
 *         description: Chart type created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/chart-types',
  requireRole(['admin']),
  metricsController.createChartType
);

/**
 * @swagger
 * /api/v1/metrics/chart-types:
 *   get:
 *     summary: Get all chart types
 *     tags: [Metrics - Chart Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active chart types
 *     responses:
 *       200:
 *         description: Chart types retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/chart-types',
  requireRole(['admin', 'user']),
  metricsController.getAllChartTypes
);

// ==================== CHART CONFIGURATIONS ROUTES ====================

/**
 * @swagger
 * /api/v1/metrics/chart-configurations:
 *   post:
 *     summary: Create chart configuration
 *     tags: [Metrics - Chart Configurations]
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: Configuration name
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Configuration description
 *               colorPalette:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Color palette
 *               defaultWidth:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *                 default: 400
 *                 description: Default width
 *               defaultHeight:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *                 default: 300
 *                 description: Default height
 *               fontFamily:
 *                 type: string
 *                 maxLength: 100
 *                 default: "Arial, sans-serif"
 *                 description: Font family
 *               fontSize:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 24
 *                 default: 12
 *                 description: Font size
 *               theme:
 *                 type: string
 *                 enum: [light, dark, custom]
 *                 default: light
 *                 description: Theme
 *               gridConfig:
 *                 type: object
 *                 description: Grid configuration
 *               legendConfig:
 *                 type: object
 *                 description: Legend configuration
 *               tooltipConfig:
 *                 type: object
 *                 description: Tooltip configuration
 *               animationConfig:
 *                 type: object
 *                 description: Animation configuration
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the default configuration
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Whether configuration is active
 *     responses:
 *       201:
 *         description: Chart configuration created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/chart-configurations',
  requireRole(['admin']),
  metricsController.createChartConfiguration
);

/**
 * @swagger
 * /api/v1/metrics/chart-configurations:
 *   get:
 *     summary: Get all chart configurations
 *     tags: [Metrics - Chart Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only active configurations
 *     responses:
 *       200:
 *         description: Chart configurations retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/chart-configurations',
  requireRole(['admin', 'user']),
  metricsController.getAllChartConfigurations
);

/**
 * @swagger
 * /api/v1/metrics/chart-configurations/default:
 *   get:
 *     summary: Get default chart configuration
 *     tags: [Metrics - Chart Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default chart configuration retrieved successfully
 *       404:
 *         description: No default configuration found
 *       401:
 *         description: Unauthorized
 */
router.get('/chart-configurations/default',
  requireRole(['admin', 'user']),
  metricsController.getDefaultChartConfiguration
);

/**
 * @swagger
 * /api/v1/metrics/chart-configurations/{configId}:
 *   put:
 *     summary: Update chart configuration
 *     tags: [Metrics - Chart Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: configId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Configuration ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *               colorPalette:
 *                 type: array
 *                 items:
 *                   type: string
 *               defaultWidth:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *               defaultHeight:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *               fontFamily:
 *                 type: string
 *                 maxLength: 100
 *               fontSize:
 *                 type: integer
 *                 minimum: 8
 *                 maximum: 24
 *               theme:
 *                 type: string
 *                 enum: [light, dark, custom]
 *               gridConfig:
 *                 type: object
 *               legendConfig:
 *                 type: object
 *               tooltipConfig:
 *                 type: object
 *               animationConfig:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Chart configuration updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Configuration not found
 *       401:
 *         description: Unauthorized
 */
router.put('/chart-configurations/:configId',
  requireRole(['admin']),
  metricsController.updateChartConfiguration
);

// ==================== DASHBOARD CREATOR ROUTES ====================

/**
 * @swagger
 * /api/v1/metrics/dashboard-creator:
 *   get:
 *     summary: Get metrics for dashboard creator
 *     tags: [Dashboard Creator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [systems, assets, vulnerabilities, compliance, performance, security, financial, operational, user_activity, network, infrastructure, applications]
 *         description: Filter by metric category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search metrics by name or description
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard-creator',
  requireRole(['admin', 'user']),
  metricsController.getMetricsForDashboardCreator
);

module.exports = router;
