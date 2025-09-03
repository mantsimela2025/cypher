const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const diagramsController = require('../controllers/diagramsController');

// ✅ Following API Development Best Practices Guide

/**
 * @route POST /api/v1/diagrams/generate
 * @desc Generate diagram from selected assets
 * @access Protected
 */
router.post('/generate',
  authenticateToken,
  [
    body('assetUuids').isArray().withMessage('Asset UUIDs must be an array'),
    body('diagramType').isIn(['boundary', 'network', 'dataflow', 'workflow']).withMessage('Invalid diagram type'),
    body('options').optional().isObject().withMessage('Options must be an object')
  ],
  diagramsController.generateDiagram
);

/**
 * @route GET /api/v1/diagrams/:id
 * @desc Get diagram by ID
 * @access Protected
 */
router.get('/:id',
  authenticateToken,
  diagramsController.getDiagram
);

/**
 * @route POST /api/v1/diagrams/:id/export
 * @desc Export diagram as PNG/PDF
 * @access Protected
 */
router.post('/:id/export',
  authenticateToken,
  [
    body('format').isIn(['png', 'pdf', 'svg']).withMessage('Invalid export format')
  ],
  diagramsController.exportDiagram
);

/**
 * @route GET /api/v1/diagrams
 * @desc Get user's saved diagrams
 * @access Protected
 */
router.get('/',
  authenticateToken,
  diagramsController.getUserDiagrams
);

/**
 * @route DELETE /api/v1/diagrams/:id
 * @desc Delete diagram
 * @access Protected
 */
router.delete('/:id',
  authenticateToken,
  diagramsController.deleteDiagram
);

module.exports = router;