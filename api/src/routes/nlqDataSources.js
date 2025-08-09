const express = require('express');
const nlqDataSourcesController = require('../controllers/nlqDataSourcesController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// CRUD routes for nlq data sources

// Get all data sources
router.get('/',
  requirePermission('nl_query', 'read'),
  nlqDataSourcesController.getAllDataSources
);

// Get a single data source by id
router.get('/:id',
  requirePermission('nl_query', 'read'),
  nlqDataSourcesController.getDataSourceById
);

// Create a new data source
router.post('/',
  requirePermission('nl_query', 'create'),
  nlqDataSourcesController.createDataSource
);

// Update a data source by id
router.put('/:id',
  requirePermission('nl_query', 'update'),
  nlqDataSourcesController.updateDataSource
);

// Delete a data source by id
router.delete('/:id',
  requirePermission('nl_query', 'delete'),
  nlqDataSourcesController.deleteDataSource
);

module.exports = router;
