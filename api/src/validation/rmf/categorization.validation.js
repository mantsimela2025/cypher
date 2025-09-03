const { body, param } = require('express-validator');

// Categorization validation rules
const validateListSystemInfoTypes = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

const validateAddSystemInfoType = [
  param('id').isInt().withMessage('Project ID must be an integer'),
  body('information_type_id').isInt().withMessage('Information type ID must be an integer'),
  body('confidentiality').notEmpty().withMessage('Confidentiality is required'),
  body('integrity').notEmpty().withMessage('Integrity is required'),
  body('availability').notEmpty().withMessage('Availability is required')
];

const validateDeleteSystemInfoType = [
  param('id').isInt().withMessage('System information type ID must be an integer')
];

const validateSetCategorization = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

const validateGetCategorization = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

module.exports = {
  validateListSystemInfoTypes,
  validateAddSystemInfoType,
  validateDeleteSystemInfoType,
  validateSetCategorization,
  validateGetCategorization
};