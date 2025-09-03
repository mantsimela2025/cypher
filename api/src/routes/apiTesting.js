/**
 * API Testing Routes
 * Provides enhanced testing capabilities for Swagger UI
 */

const express = require('express');
const SwaggerTestHelper = require('../utils/swaggerTestHelper');

const router = express.Router();
const testHelper = new SwaggerTestHelper();

/**
 * @swagger
 * /api/v1/test/tokens:
 *   get:
 *     summary: Generate test authentication tokens
 *     description: Generate JWT tokens for different user roles for API testing
 *     tags: [Testing]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user, analyst]
 *           default: admin
 *         description: User role for token generation
 *     responses:
 *       200:
 *         description: Test tokens generated successfully
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
 *                     token:
 *                       type: string
 *                       description: JWT token for API testing
 *                     role:
 *                       type: string
 *                       description: User role
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: User permissions
 *                     expiresIn:
 *                       type: string
 *                       description: Token expiration time
 *                     usage:
 *                       type: string
 *                       description: How to use the token
 */
router.get('/tokens', (req, res) => {
  try {
    const role = req.query.role || 'admin';
    const token = testHelper.generateTestToken(role);
    const permissions = testHelper.getPermissionsForRole(role);

    res.json({
      success: true,
      data: {
        token,
        role,
        permissions,
        expiresIn: '24h',
        usage: `Add "Authorization: Bearer ${token}" to your request headers`
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/test/sample-data:
 *   get:
 *     summary: Get sample data for API testing
 *     description: Retrieve sample request data for different endpoints
 *     tags: [Testing]
 *     parameters:
 *       - in: query
 *         name: endpoint
 *         schema:
 *           type: string
 *         description: API endpoint path
 *         example: /api/v1/users
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           default: POST
 *         description: HTTP method
 *     responses:
 *       200:
 *         description: Sample data retrieved successfully
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
 *                   description: Sample request data
 */
router.get('/sample-data', (req, res) => {
  const { endpoint, method = 'POST' } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Endpoint parameter is required'
    });
  }

  const sampleData = testHelper.getSampleData(endpoint, method.toUpperCase());
  const queryParams = testHelper.getTestQueryParams(endpoint);

  res.json({
    success: true,
    data: {
      endpoint,
      method: method.toUpperCase(),
      requestBody: sampleData,
      queryParameters: queryParams,
      headers: testHelper.getTestHeaders(true, 'admin')
    }
  });
});

/**
 * @swagger
 * /api/v1/test/scenarios:
 *   get:
 *     summary: Get comprehensive test scenarios
 *     description: Retrieve all available test scenarios for API endpoints
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Test scenarios retrieved successfully
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
 *                   description: Test scenarios organized by category
 */
router.get('/scenarios', (req, res) => {
  const scenarios = testHelper.getTestScenarios();
  
  res.json({
    success: true,
    data: scenarios
  });
});

/**
 * @swagger
 * /api/v1/test/curl:
 *   get:
 *     summary: Generate cURL commands for API testing
 *     description: Generate ready-to-use cURL commands for testing endpoints
 *     tags: [Testing]
 *     parameters:
 *       - in: query
 *         name: endpoint
 *         required: true
 *         schema:
 *           type: string
 *         description: API endpoint path
 *         example: /api/v1/users
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           default: GET
 *         description: HTTP method
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user, analyst]
 *           default: admin
 *         description: User role for authentication
 *     responses:
 *       200:
 *         description: cURL command generated successfully
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
 *                     curl:
 *                       type: string
 *                       description: Ready-to-use cURL command
 *                     endpoint:
 *                       type: string
 *                       description: API endpoint
 *                     method:
 *                       type: string
 *                       description: HTTP method
 */
router.get('/curl', (req, res) => {
  const { endpoint, method = 'GET', role = 'admin' } = req.query;
  
  if (!endpoint) {
    return res.status(400).json({
      success: false,
      message: 'Endpoint parameter is required'
    });
  }

  const sampleData = ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) 
    ? testHelper.getSampleData(endpoint, method.toUpperCase()) 
    : null;

  const curlCommand = testHelper.generateCurlCommand(
    endpoint, 
    method.toUpperCase(), 
    sampleData, 
    role
  );

  res.json({
    success: true,
    data: {
      curl: curlCommand,
      endpoint,
      method: method.toUpperCase(),
      role,
      instructions: [
        '1. Copy the cURL command below',
        '2. Open your terminal or command prompt',
        '3. Paste and execute the command',
        '4. Check the response for expected results'
      ]
    }
  });
});

/**
 * @swagger
 * /api/v1/test/report:
 *   get:
 *     summary: Generate comprehensive test report
 *     description: Generate a detailed markdown report with all test scenarios
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: Test report generated successfully
 *         content:
 *           text/markdown:
 *             schema:
 *               type: string
 *               description: Markdown formatted test report
 */
router.get('/report', (req, res) => {
  const report = testHelper.generateTestReport();
  
  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', 'attachment; filename="cypher-api-test-report.md"');
  res.send(report);
});

/**
 * @swagger
 * /api/v1/test/health:
 *   get:
 *     summary: API testing health check
 *     description: Verify that the API testing utilities are working correctly
 *     tags: [Testing]
 *     responses:
 *       200:
 *         description: API testing utilities are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API testing utilities are operational
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     availableRoles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sampleEndpoints:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API testing utilities are operational',
    data: {
      timestamp: new Date().toISOString(),
      availableRoles: Object.keys(testHelper.testUsers),
      sampleEndpoints: [
        '/api/v1/users',
        '/api/v1/systems', 
        '/api/v1/vulnerabilities',
        '/api/v1/cves',
        '/api/v1/distribution-groups'
      ],
      features: [
        'Token generation',
        'Sample data provision',
        'cURL command generation',
        'Test scenario management',
        'Comprehensive reporting'
      ]
    }
  });
});

module.exports = router;
