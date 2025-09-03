const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');

const { client } = require('../db');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/vulnerabilities:
 *   get:
 *     summary: Get vulnerabilities with pagination and filtering
 *     tags: [Vulnerabilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of vulnerabilities to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of vulnerabilities to skip
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [Critical, High, Medium, Low]
 *         description: Filter by severity
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           enum: [Open, Fixed]
 *         description: Filter by state
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: severity
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of vulnerabilities
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      severity,
      state,
      sort = 'severity',
      order = 'desc'
    } = req.query;

    // Build WHERE clause
    let whereConditions = [];
    let params = [];

    if (severity) {
      whereConditions.push('v.severity_name = $' + (params.length + 1));
      params.push(severity);
    }

    if (state) {
      whereConditions.push('v.state = $' + (params.length + 1));
      params.push(state);
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    // Build ORDER BY clause
    const validSortFields = ['severity', 'plugin_id', 'plugin_name', 'cvss3_base_score', 'first_found', 'last_found'];
    const sortField = validSortFields.includes(sort) ? sort : 'severity';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT v.id) as total
      FROM vulnerabilities v
      LEFT JOIN vulnerability_cves vc ON v.id = vc.vulnerability_id
      LEFT JOIN cves c ON vc.cve_id = c.id
      ${whereClause}
    `;
    
    const totalResult = await client.unsafe(countQuery, params);
    const total = parseInt(totalResult[0].total);

    // Get vulnerabilities with CVE data
    const dataQuery = `
      SELECT
        v.id,
        v.asset_uuid,
        v.plugin_id,
        v.plugin_name,
        v.plugin_family,
        v.severity,
        v.severity_name,
        v.cvss_base_score,
        v.cvss3_base_score,
        v.description,
        v.solution,
        v.risk_factor,
        v.first_found,
        v.last_found,
        v.state,
        v.source,
        v.batch_id,
        v.raw_json,
        v.created_at,
        v.updated_at,
        COALESCE(
          JSON_AGG(
            CASE
              WHEN c.cve_id IS NOT NULL
              THEN JSON_BUILD_OBJECT(
                'cve_id', c.cve_id,
                'cvss3_base_score', c.cvss3_base_score,
                'cvss2_base_score', c.cvss2_base_score,
                'description', c.description,
                'published_date', c.published_date
              )
              ELSE NULL
            END
          ) FILTER (WHERE c.cve_id IS NOT NULL),
          '[]'::json
        ) as cves
      FROM vulnerabilities v
      LEFT JOIN vulnerability_cves vc ON v.id = vc.vulnerability_id
      LEFT JOIN cves c ON vc.cve_id = c.id
      ${whereClause}
      GROUP BY v.id, v.asset_uuid, v.plugin_id, v.plugin_name, v.plugin_family,
               v.severity, v.severity_name, v.cvss_base_score, v.cvss3_base_score,
               v.description, v.solution, v.risk_factor, v.first_found, v.last_found,
               v.state, v.source, v.batch_id, v.raw_json, v.created_at, v.updated_at
      ORDER BY v.${sortField} ${sortOrder}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));
    const vulnerabilities = await client.unsafe(dataQuery, params);

    res.json({
      success: true,
      data: vulnerabilities,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching vulnerabilities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vulnerabilities',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vulnerabilities/summary:
 *   get:
 *     summary: Get vulnerability summary statistics
 *     tags: [Vulnerabilities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vulnerability summary statistics
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await client`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN severity_name = 'Critical' THEN 1 END) as critical,
        COUNT(CASE WHEN severity_name = 'High' THEN 1 END) as high,
        COUNT(CASE WHEN severity_name = 'Medium' THEN 1 END) as medium,
        COUNT(CASE WHEN severity_name = 'Low' THEN 1 END) as low,
        COUNT(CASE WHEN state = 'Open' THEN 1 END) as open,
        COUNT(CASE WHEN state = 'Fixed' THEN 1 END) as fixed
      FROM vulnerabilities
    `;

    res.json({
      success: true,
      data: summary[0]
    });

  } catch (error) {
    console.error('Error fetching vulnerability summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vulnerability summary',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/vulnerabilities/{id}:
 *   get:
 *     summary: Get vulnerability by ID
 *     tags: [Vulnerabilities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vulnerability ID
 *     responses:
 *       200:
 *         description: Vulnerability details
 *       404:
 *         description: Vulnerability not found
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const vulnerability = await client`
      SELECT
        id,
        asset_uuid,
        plugin_id,
        plugin_name,
        plugin_family,
        severity,
        severity_name,
        cvss_base_score,
        cvss3_base_score,
        description,
        solution,
        risk_factor,
        first_found,
        last_found,
        state,
        source,
        batch_id,
        raw_json,
        created_at,
        updated_at
      FROM vulnerabilities
      WHERE id = ${id}
    `;

    if (vulnerability.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vulnerability not found'
      });
    }

    res.json({
      success: true,
      data: vulnerability[0]
    });

  } catch (error) {
    console.error('Error fetching vulnerability:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vulnerability',
      error: error.message
    });
  }
});

module.exports = router;
