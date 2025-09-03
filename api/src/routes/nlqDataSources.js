const express = require('express');
const nlqDataSourcesController = require('../controllers/nlqDataSourcesController');
const { authenticateToken, requireRole } = require('../middleware/auth');


const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// CRUD routes for nlq data sources

// Get all data sources
router.get('/',
  requireRole(['admin', 'user']),
  nlqDataSourcesController.getAllDataSources
);

// Get a single data source by id
router.get('/:id',
  requireRole(['admin', 'user']),
  nlqDataSourcesController.getDataSourceById
);

// Create a new data source
router.post('/',
  requireRole(['admin']),
  nlqDataSourcesController.createDataSource
);

// Update a data source by id
router.put('/:id',
  requireRole(['admin']),
  nlqDataSourcesController.updateDataSource
);

// Delete a data source by id
router.delete('/:id',
  requireRole(['admin']),
  nlqDataSourcesController.deleteDataSource
);

module.exports = router;
