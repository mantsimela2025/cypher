const express = require('express');
const router = express.Router();
const { client } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/metrics-dashboards:
 *   get:
 *     summary: Get all metrics dashboards
 *     tags: [Metrics Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all metrics dashboards
 */
router.get('/', async (req, res) => {
  try {
    const dashboards = await client`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.layout,
        d.is_default,
        d.created_at,
        COUNT(dm.id) as metric_count
      FROM dashboards d
      LEFT JOIN dashboard_metrics dm ON d.id = dm.dashboard_id
      GROUP BY d.id, d.name, d.description, d.layout, d.is_default, d.created_at
      ORDER BY d.is_default DESC, d.name
    `;

    res.json({
      success: true,
      data: dashboards,
      total: dashboards.length
    });

  } catch (error) {
    console.error('Error fetching dashboards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboards',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/metrics-dashboards/by-category:
 *   get:
 *     summary: Get dashboards grouped by category
 *     tags: [Metrics Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboards grouped by category
 */
router.get('/by-category', async (req, res) => {
  try {
    const dashboards = await client`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.is_default,
        COUNT(dm.id) as metric_count,
        CASE 
          WHEN d.name LIKE '%System%' THEN 'systems'
          WHEN d.name LIKE '%Asset%' THEN 'assets'
          WHEN d.name LIKE '%Vulnerability%' THEN 'vulnerabilities'
          WHEN d.name LIKE '%Risk%' THEN 'risk'
          WHEN d.name LIKE '%Cost%' THEN 'cost'
          WHEN d.name LIKE '%Patch%' THEN 'patching'
          WHEN d.name LIKE '%Executive%' THEN 'executive'
          ELSE 'other'
        END as category
      FROM dashboards d
      LEFT JOIN dashboard_metrics dm ON d.id = dm.dashboard_id
      GROUP BY d.id, d.name, d.description, d.is_default
      ORDER BY category, d.name
    `;

    // Group by category
    const grouped = dashboards.reduce((acc, dashboard) => {
      const category = dashboard.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(dashboard);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped,
      summary: {
        total_dashboards: dashboards.length,
        categories: Object.keys(grouped).length
      }
    });

  } catch (error) {
    console.error('Error fetching dashboards by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboards by category',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/metrics-dashboards/default:
 *   get:
 *     summary: Get the default dashboard (Executive Summary)
 *     tags: [Metrics Dashboards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default dashboard with metrics
 */
router.get('/default', async (req, res) => {
  try {
    const dashboard = await client`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.layout,
        d.is_default,
        d.created_at
      FROM dashboards d
      WHERE d.is_default = true
      LIMIT 1
    `;

    if (dashboard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No default dashboard found'
      });
    }

    // Get dashboard metrics with their data
    const dashboardMetrics = await client`
      SELECT 
        dm.id as dashboard_metric_id,
        dm.position,
        dm.width,
        dm.height,
        dm.chart_type,
        dm.config,
        m.id as metric_id,
        m.name as metric_name,
        m.description as metric_description,
        m.type as metric_type,
        m.category as metric_category,
        m.value as metric_value,
        m.unit as metric_unit,
        m.labels as metric_labels,
        m.threshold as metric_threshold,
        m.last_calculated
      FROM dashboard_metrics dm
      INNER JOIN metrics m ON dm.metric_id = m.id
      WHERE dm.dashboard_id = ${dashboard[0].id} AND m.is_active = true
      ORDER BY dm.position
    `;

    res.json({
      success: true,
      data: {
        ...dashboard[0],
        metrics: dashboardMetrics
      }
    });

  } catch (error) {
    console.error('Error fetching default dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching default dashboard',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/metrics-dashboards/{id}:
 *   get:
 *     summary: Get specific dashboard with metrics
 *     tags: [Metrics Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Dashboard with metrics data
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get dashboard details
    const dashboard = await client`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.layout,
        d.is_default,
        d.created_at
      FROM dashboards d
      WHERE d.id = ${id}
    `;

    if (dashboard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    // Get dashboard metrics with their data
    const dashboardMetrics = await client`
      SELECT 
        dm.id as dashboard_metric_id,
        dm.position,
        dm.width,
        dm.height,
        dm.chart_type,
        dm.config,
        m.id as metric_id,
        m.name as metric_name,
        m.description as metric_description,
        m.type as metric_type,
        m.category as metric_category,
        m.value as metric_value,
        m.unit as metric_unit,
        m.labels as metric_labels,
        m.threshold as metric_threshold,
        m.last_calculated
      FROM dashboard_metrics dm
      INNER JOIN metrics m ON dm.metric_id = m.id
      WHERE dm.dashboard_id = ${id} AND m.is_active = true
      ORDER BY dm.position
    `;

    res.json({
      success: true,
      data: {
        ...dashboard[0],
        metrics: dashboardMetrics
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/metrics-dashboards/name/{name}:
 *   get:
 *     summary: Get dashboard by name
 *     tags: [Metrics Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Dashboard name (case insensitive)
 *     responses:
 *       200:
 *         description: Dashboard with metrics data
 */
router.get('/name/:name', async (req, res) => {
  try {
    const { name } = req.params;

    // Get dashboard details
    const dashboard = await client`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.layout,
        d.is_default,
        d.created_at
      FROM dashboards d
      WHERE LOWER(d.name) = LOWER(${name})
    `;

    if (dashboard.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dashboard not found'
      });
    }

    // Get dashboard metrics with their data
    const dashboardMetrics = await client`
      SELECT 
        dm.id as dashboard_metric_id,
        dm.position,
        dm.width,
        dm.height,
        dm.chart_type,
        dm.config,
        m.id as metric_id,
        m.name as metric_name,
        m.description as metric_description,
        m.type as metric_type,
        m.category as metric_category,
        m.value as metric_value,
        m.unit as metric_unit,
        m.labels as metric_labels,
        m.threshold as metric_threshold,
        m.last_calculated
      FROM dashboard_metrics dm
      INNER JOIN metrics m ON dm.metric_id = m.id
      WHERE dm.dashboard_id = ${dashboard[0].id} AND m.is_active = true
      ORDER BY dm.position
    `;

    res.json({
      success: true,
      data: {
        ...dashboard[0],
        metrics: dashboardMetrics
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard by name:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard',
      error: error.message
    });
  }
});

module.exports = router;
