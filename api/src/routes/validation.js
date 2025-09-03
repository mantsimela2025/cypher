const express = require('express');
const router = express.Router();
const validationController = require('../controllers/validationController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Validation Routes
 * 
 * These routes provide schema validation information for frontend forms
 * and API validation
 */

// List all available schemas
router.get('/schemas', authenticateToken, validationController.listSchemas);

// Get validation rules for multiple schemas
router.post('/schemas', authenticateToken, validationController.getMultipleSchemaValidations);

// Get validation rules for a specific schema
router.get('/schema/:schemaName', authenticateToken, validationController.getSchemaValidation);

// Get field information for a specific schema
router.get('/schema/:schemaName/fields', authenticateToken, validationController.getSchemaFields);

// Validate data against a schema
router.post('/validate/:schemaName', authenticateToken, validationController.validateData);

module.exports = router;
