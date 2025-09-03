const { param } = require('express-validator');

// Authorization validation rules
const validateUpsertAuthorization = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

const validateGetAuthorization = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

module.exports = {
  validateUpsertAuthorization,
  validateGetAuthorization
};