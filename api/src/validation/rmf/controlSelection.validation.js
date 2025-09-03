const { param } = require('express-validator');

// Control Selection validation rules
const validateSetSelection = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

const validateGetSelection = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

module.exports = {
  validateSetSelection,
  validateGetSelection
};