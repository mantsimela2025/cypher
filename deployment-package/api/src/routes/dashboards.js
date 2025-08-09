const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// ==================== GLOBAL DASHBOARDS ROUTES ====================

/**
 * @swagger
 * /api/v1/dashboards/global:
 *   post:
 *     summary: Create global dashboard (admin only)
 *     tags: [Dashboards - Global]
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
 *                 maxLength: 255
 *                 description: Dashboard name
 *                 example: "Executive Security Dashboard"
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Dashboard description
 *               layout:
 *                 type: object
 *                 description: Dashboard layout configuration
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the default global dashboard
 *     responses:
 *       201:
 *         description: Global dashboard created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/global', 
  requirePermission('dashboards:admin'),
  dashboardController.createGlobalDashboard
);

/**
 * @swagger
 * /api/v1/dashboards/global:
 *   get:
 *     summary: Get all global dashboards
 *     tags: [Dashboards - Global]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeMetrics
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include metrics in response
 *     responses:
 *       200:
 *         description: Global dashboards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       layout:
 *                         type: object
 *                       isDefault:
 *                         type: boolean
 *                       isGlobal:
 *                         type: boolean
 *                       createdBy:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       createdByName:
 *                         type: string
 *                       metrics:
 *                         type: array
 *                         description: Included if includeMetrics=true
 *       401:
 *         description: Unauthorized
 */
router.get('/global', 
  requirePermission('dashboards:read'),
  dashboardController.getGlobalDashboards
);

/**
 * @swagger
 * /api/v1/dashboards/global/{dashboardId}:
 *   put:
 *     summary: Update global dashboard
 *     tags: [Dashboards - Global]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
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
 *               layout:
 *                 type: object
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Global dashboard updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Dashboard not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.put('/global/:dashboardId', 
  requirePermission('dashboards', 'admin'),
  dashboardController.updateGlobalDashboard
);

/**
 * @swagger
 * /api/v1/dashboards/global/{dashboardId}:
 *   delete:
 *     summary: Delete global dashboard
 *     tags: [Dashboards - Global]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Global dashboard deleted successfully
 *       404:
 *         description: Dashboard not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.delete('/global/:dashboardId', 
  requirePermission('dashboards', 'admin'),
  dashboardController.deleteGlobalDashboard
);

// ==================== USER DASHBOARDS ROUTES ====================

/**
 * @swagger
 * /api/v1/dashboards/user:
 *   post:
 *     summary: Create user dashboard
 *     tags: [Dashboards - User]
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
 *                 description: Dashboard name
 *                 example: "My Security Dashboard"
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the user's default dashboard
 *               layout:
 *                 type: object
 *                 description: Dashboard layout configuration
 *     responses:
 *       201:
 *         description: User dashboard created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/user', 
  requirePermission('dashboards', 'create'),
  dashboardController.createUserDashboard
);

/**
 * @swagger
 * /api/v1/dashboards/user:
 *   get:
 *     summary: Get user dashboards
 *     tags: [Dashboards - User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       isDefault:
 *                         type: boolean
 *                       layout:
 *                         type: object
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/user', 
  requirePermission('dashboards', 'read'),
  dashboardController.getUserDashboards
);

/**
 * @swagger
 * /api/v1/dashboards/user/{dashboardId}:
 *   put:
 *     summary: Update user dashboard
 *     tags: [Dashboards - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
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
 *               isDefault:
 *                 type: boolean
 *               layout:
 *                 type: object
 *     responses:
 *       200:
 *         description: User dashboard updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Dashboard not found
 *       401:
 *         description: Unauthorized
 */
router.put('/user/:dashboardId', 
  requirePermission('dashboards', 'update'),
  dashboardController.updateUserDashboard
);

/**
 * @swagger
 * /api/v1/dashboards/user/{dashboardId}:
 *   delete:
 *     summary: Delete user dashboard
 *     tags: [Dashboards - User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: User dashboard deleted successfully
 *       404:
 *         description: Dashboard not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/user/:dashboardId',
  requirePermission('dashboards:update'),
  dashboardController.deleteDashboard
);

// ==================== DASHBOARD METRICS ROUTES ====================

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}/metrics:
 *   post:
 *     summary: Add metric to dashboard
 *     tags: [Dashboards - Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metricId
 *             properties:
 *               metricId:
 *                 type: integer
 *                 description: Metric ID to add
 *               chartTypeId:
 *                 type: integer
 *                 description: Chart type ID
 *               chartConfigId:
 *                 type: integer
 *                 description: Chart configuration ID
 *               position:
 *                 type: integer
 *                 minimum: 1
 *                 description: Position on dashboard
 *               width:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *                 default: 400
 *                 description: Chart width
 *               height:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *                 default: 300
 *                 description: Chart height
 *               config:
 *                 type: object
 *                 description: Chart configuration overrides
 *               refreshInterval:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 3600
 *                 default: 300
 *                 description: Refresh interval in seconds
 *     responses:
 *       201:
 *         description: Metric added to dashboard successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Dashboard not found or access denied
 *       409:
 *         description: Metric already exists on dashboard
 *       401:
 *         description: Unauthorized
 */
router.post('/:dashboardId/metrics',
  requirePermission('dashboards', 'update'),
  dashboardController.addMetricToDashboard
);

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}/metrics:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Dashboards - Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       dashboardId:
 *                         type: integer
 *                       metricId:
 *                         type: integer
 *                       chartTypeId:
 *                         type: integer
 *                       chartConfigId:
 *                         type: integer
 *                       position:
 *                         type: integer
 *                       width:
 *                         type: integer
 *                       height:
 *                         type: integer
 *                       config:
 *                         type: object
 *                       isVisible:
 *                         type: boolean
 *                       refreshInterval:
 *                         type: integer
 *                       metricName:
 *                         type: string
 *                       metricValue:
 *                         type: number
 *                       metricUnit:
 *                         type: string
 *                       chartTypeName:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/:dashboardId/metrics',
  requirePermission('dashboards', 'read'),
  dashboardController.getDashboardMetrics
);

/**
 * @swagger
 * /api/v1/dashboards/metrics/{dashboardMetricId}:
 *   put:
 *     summary: Update dashboard metric
 *     tags: [Dashboards - Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardMetricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard metric ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chartTypeId:
 *                 type: integer
 *               chartConfigId:
 *                 type: integer
 *               position:
 *                 type: integer
 *                 minimum: 1
 *               width:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *               height:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 2000
 *               config:
 *                 type: object
 *               isVisible:
 *                 type: boolean
 *               refreshInterval:
 *                 type: integer
 *                 minimum: 30
 *                 maximum: 3600
 *     responses:
 *       200:
 *         description: Dashboard metric updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Dashboard metric not found
 *       401:
 *         description: Unauthorized
 */
router.put('/metrics/:dashboardMetricId',
  requirePermission('dashboards', 'update'),
  dashboardController.updateDashboardMetric
);

/**
 * @swagger
 * /api/v1/dashboards/metrics/{dashboardMetricId}:
 *   delete:
 *     summary: Remove metric from dashboard
 *     tags: [Dashboards - Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardMetricId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard metric ID
 *     responses:
 *       200:
 *         description: Metric removed from dashboard successfully
 *       404:
 *         description: Dashboard metric not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/metrics/:dashboardMetricId',
  requirePermission('dashboards', 'update'),
  dashboardController.removeMetricFromDashboard
);

// ==================== DASHBOARD SHARING ROUTES ====================

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}/share:
 *   post:
 *     summary: Share dashboard with user
 *     tags: [Dashboards - Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: User ID to share with
 *               permission:
 *                 type: string
 *                 enum: [view, edit, admin]
 *                 default: view
 *                 description: Permission level
 *     responses:
 *       201:
 *         description: Dashboard shared successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Dashboard not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.post('/:dashboardId/share',
  requirePermission('dashboards', 'admin'),
  dashboardController.shareDashboard
);

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}/shares:
 *   get:
 *     summary: Get dashboard shares
 *     tags: [Dashboards - Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Dashboard shares retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       dashboardId:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       permission:
 *                         type: string
 *                         enum: [view, edit, admin]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       userName:
 *                         type: string
 *                       userEmail:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/:dashboardId/shares',
  requirePermission('dashboards', 'read'),
  dashboardController.getDashboardShares
);

/**
 * @swagger
 * /api/v1/dashboards/shares/{shareId}:
 *   delete:
 *     summary: Remove dashboard share
 *     tags: [Dashboards - Sharing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Share ID
 *     responses:
 *       200:
 *         description: Dashboard share removed successfully
 *       404:
 *         description: Share not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/shares/:shareId',
  requirePermission('dashboards', 'admin'),
  dashboardController.removeDashboardShare
);

// ==================== DASHBOARD ACCESS ROUTES ====================

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}:
 *   get:
 *     summary: Get dashboard by ID
 *     tags: [Dashboards - Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *       - in: query
 *         name: includeMetrics
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include metrics in response
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     layout:
 *                       type: object
 *                     isDefault:
 *                       type: boolean
 *                     isGlobal:
 *                       type: boolean
 *                     type:
 *                       type: string
 *                       enum: [global, user, shared]
 *                     createdBy:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     metrics:
 *                       type: array
 *                       description: Included if includeMetrics=true
 *       404:
 *         description: Dashboard not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:dashboardId',
  requirePermission('dashboards', 'read'),
  dashboardController.getDashboardById
);

/**
 * @swagger
 * /api/v1/dashboards:
 *   get:
 *     summary: Get all accessible dashboards for user
 *     tags: [Dashboards - Access]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeMetrics
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include metrics in response
 *     responses:
 *       200:
 *         description: Accessible dashboards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       layout:
 *                         type: object
 *                       isDefault:
 *                         type: boolean
 *                       isGlobal:
 *                         type: boolean
 *                       type:
 *                         type: string
 *                         enum: [global, user, shared]
 *                       createdBy:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       permission:
 *                         type: string
 *                         enum: [view, edit, admin]
 *                         description: User's permission level (for shared dashboards)
 *                       metrics:
 *                         type: array
 *                         description: Included if includeMetrics=true
 *       401:
 *         description: Unauthorized
 */
router.get('/',
  requirePermission('dashboards', 'read'),
  dashboardController.getAccessibleDashboards
);

// ==================== DASHBOARD CREATOR ROUTES ====================

/**
 * @swagger
 * /api/v1/dashboards/creator:
 *   post:
 *     summary: Create dashboard with widgets (Dashboard Creator)
 *     tags: [Dashboard Creator]
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
 *                 maxLength: 255
 *                 description: Dashboard name
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 description: Dashboard description
 *               layout:
 *                 type: object
 *                 description: Dashboard layout configuration
 *               widgets:
 *                 type: array
 *                 description: Array of widget configurations
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *                 description: Whether dashboard is published
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/creator',
  requirePermission('dashboards:create'),
  dashboardController.createDashboardWithWidgets
);

/**
 * @swagger
 * /api/v1/dashboards/my-dashboards:
 *   get:
 *     summary: Get user's created dashboards (for My Dashboards page)
 *     tags: [Dashboard Creator]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboards retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-dashboards',
  requirePermission('dashboards:read'),
  dashboardController.getUserCreatedDashboards
);

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}/edit:
 *   get:
 *     summary: Get dashboard for editing
 *     tags: [Dashboard Creator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *       404:
 *         description: Dashboard not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:dashboardId/edit',
  requirePermission('dashboards', 'read'),
  dashboardController.getDashboardForEditing
);

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}/widgets:
 *   put:
 *     summary: Update dashboard widgets
 *     tags: [Dashboard Creator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - widgets
 *             properties:
 *               widgets:
 *                 type: array
 *                 description: Array of widget configurations
 *     responses:
 *       200:
 *         description: Dashboard widgets updated successfully
 *       404:
 *         description: Dashboard not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.put('/:dashboardId/widgets',
  requirePermission('dashboards:update'),
  dashboardController.updateDashboardWidgets
);

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}/publish:
 *   patch:
 *     summary: Publish/unpublish dashboard
 *     tags: [Dashboard Creator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isPublished
 *             properties:
 *               isPublished:
 *                 type: boolean
 *                 description: Whether to publish or unpublish the dashboard
 *     responses:
 *       200:
 *         description: Dashboard published/unpublished successfully
 *       404:
 *         description: Dashboard not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.patch('/:dashboardId/publish',
  requirePermission('dashboards', 'update'),
  dashboardController.publishDashboard
);

/**
 * @swagger
 * /api/v1/dashboards/{dashboardId}:
 *   delete:
 *     summary: Delete dashboard
 *     tags: [Dashboard Creator]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dashboardId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Dashboard ID
 *     responses:
 *       200:
 *         description: Dashboard deleted successfully
 *       404:
 *         description: Dashboard not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.delete('/:dashboardId',
  requirePermission('dashboards:delete'),
  dashboardController.deleteDashboard
);

module.exports = router;
