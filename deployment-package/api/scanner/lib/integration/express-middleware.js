/**
 * Express.js middleware for security scanner API integration
 * For use in government/secure environments
 */

const express = require('express');
const BackendAPIIntegration = require('./backend-api-integration');

/**
 * Create Express router for security scanner API
 * @param {Object} options - Router options
 * @param {Function} options.authMiddleware - Authentication middleware
 * @param {Function} options.rbacMiddleware - RBAC middleware
 * @param {string} options.resultsDir - Directory to store scan results
 * @returns {express.Router} - Express router
 */
function createSecurityScannerRouter(options = {}) {
  const router = express.Router();
  const scannerApi = new BackendAPIIntegration({
    resultsDir: options.resultsDir
  });
  
  // Apply authentication middleware if provided
  if (options.authMiddleware) {
    router.use(options.authMiddleware);
  }
  
  // Default auth middleware if none provided
  const authMiddleware = options.authMiddleware || ((req, res, next) => {
    if (!req.user) {
      req.user = {
        id: process.env.DEFAULT_USER_ID || 'system',
        role: process.env.DEFAULT_USER_ROLE || 'admin'
      };
    }
    next();
  });
  
  // Default RBAC middleware if none provided
  const rbacMiddleware = options.rbacMiddleware || ((permission) => {
    return (req, res, next) => {
      if (!scannerApi.hasPermission(req.user.id, req.user.role, permission)) {
        return res.status(403).json({
          status: 'error',
          message: `Unauthorized: User does not have '${permission}' permission`
        });
      }
      next();
    };
  });
  
  // Apply JSON body parser
  router.use(express.json());
  
  /**
   * @swagger
   * /api/security/internal-scan:
   *   post:
   *     summary: Run an internal security scan
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               scanTypes:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [configuration, compliance, patch-detection]
   *               framework:
   *                 type: string
   *                 description: Compliance framework (for compliance scans)
   *               offline:
   *                 type: boolean
   *                 default: true
   *     responses:
   *       200:
   *         description: Scan completed successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Server error
   */
  router.post('/internal-scan', 
    authMiddleware,
    rbacMiddleware('internal-scan'),
    async (req, res) => {
      try {
        const scanConfig = req.body;
        const results = await scannerApi.runInternalScan(scanConfig, req.user);
        res.json(results);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );
  
  /**
   * @swagger
   * /api/security/vulnerability-scan:
   *   post:
   *     summary: Run a vulnerability scan
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               target:
   *                 type: string
   *                 description: Target to scan (hostname, IP, or localhost)
   *               checks:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [patch-detection, ssl-tls, http-headers, open-ports]
   *     responses:
   *       200:
   *         description: Scan completed successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Server error
   */
  router.post('/vulnerability-scan', 
    authMiddleware,
    rbacMiddleware('vuln-scan'),
    async (req, res) => {
      try {
        const { target, ...scanConfig } = req.body;
        
        if (!target) {
          return res.status(400).json({
            status: 'error',
            message: 'Target is required'
          });
        }
        
        const results = await scannerApi.runVulnerabilityScan(target, scanConfig, req.user);
        res.json(results);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );
  
  /**
   * @swagger
   * /api/security/compliance-scan:
   *   post:
   *     summary: Run a compliance scan
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               target:
   *                 type: string
   *                 description: Target to scan (hostname, IP, or localhost)
   *               frameworks:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [nist-800-53, hipaa, pci-dss, stig]
   *     responses:
   *       200:
   *         description: Scan completed successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Server error
   */
  router.post('/compliance-scan', 
    authMiddleware,
    rbacMiddleware('compliance-scan'),
    async (req, res) => {
      try {
        const { target, ...scanConfig } = req.body;
        
        if (!target) {
          return res.status(400).json({
            status: 'error',
            message: 'Target is required'
          });
        }
        
        const results = await scannerApi.runComplianceScan(target, scanConfig, req.user);
        res.json(results);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );
  
  /**
   * @swagger
   * /api/security/scan-results:
   *   get:
   *     summary: List scan results
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of results to return
   *       - in: query
   *         name: offset
   *         schema:
   *           type: integer
   *         description: Number of results to skip
   *     responses:
   *       200:
   *         description: List of scan results
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       500:
   *         description: Server error
   */
  router.get('/scan-results', 
    authMiddleware,
    rbacMiddleware('view-results'),
    async (req, res) => {
      try {
        const options = {
          limit: req.query.limit ? parseInt(req.query.limit) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset) : undefined
        };
        
        const results = await scannerApi.listScanResults(req.user, options);
        res.json(results);
      } catch (error) {
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );
  
  /**
   * @swagger
   * /api/security/scan-results/{id}:
   *   get:
   *     summary: Get scan result by ID
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Result ID
   *     responses:
   *       200:
   *         description: Scan result
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Result not found
   *       500:
   *         description: Server error
   */
  router.get('/scan-results/:id', 
    authMiddleware,
    rbacMiddleware('view-results'),
    async (req, res) => {
      try {
        const resultId = req.params.id;
        
        if (!resultId) {
          return res.status(400).json({
            status: 'error',
            message: 'Result ID is required'
          });
        }
        
        const result = await scannerApi.getScanResult(resultId, req.user);
        res.json(result);
      } catch (error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            status: 'error',
            message: error.message
          });
        }
        
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );
  
  /**
   * @swagger
   * /api/security/scan-results/{id}:
   *   delete:
   *     summary: Delete scan result by ID
   *     tags: [Security]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Result ID
   *     responses:
   *       200:
   *         description: Result deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Result not found
   *       500:
   *         description: Server error
   */
  router.delete('/scan-results/:id', 
    authMiddleware,
    rbacMiddleware('delete-results'),
    async (req, res) => {
      try {
        const resultId = req.params.id;
        
        if (!resultId) {
          return res.status(400).json({
            status: 'error',
            message: 'Result ID is required'
          });
        }
        
        const result = await scannerApi.deleteScanResult(resultId, req.user);
        res.json(result);
      } catch (error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({
            status: 'error',
            message: error.message
          });
        }
        
        res.status(500).json({
          status: 'error',
          message: error.message
        });
      }
    }
  );
  
  return router;
}

module.exports = createSecurityScannerRouter;