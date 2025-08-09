const express = require('express');
const router = express.Router();
const ingestionSimulationController = require('../../controllers/ingestionSimulationController');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');

// Apply authentication and permission middleware
router.use(authenticateToken);
router.use(requirePermission('admin:read'));

// Validation rules
const validateCreateUpdate = [
  body('sourceSystem').isIn(['tenable', 'xacta']).withMessage('Invalid source system'),
  body('batchType').isString().notEmpty().withMessage('Batch type is required'),
  body('status').optional().isString(),
  body('lastScanDate').optional().isISO8601(),
];

// Routes
router.get('/', ingestionSimulationController.getAllJobs);
router.get('/:id', ingestionSimulationController.getJobById);
router.post('/', validateCreateUpdate, ingestionSimulationController.createJob);
router.put('/:id', validateCreateUpdate, ingestionSimulationController.updateJob);
router.delete('/:id', ingestionSimulationController.deleteJob);
router.post('/:id/simulate-renewed-scan', ingestionSimulationController.simulateRenewedScan);

module.exports = router;
