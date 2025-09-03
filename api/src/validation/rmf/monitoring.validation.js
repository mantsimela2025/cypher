const { param } = require('express-validator');

// Monitoring validation rules
const validateUpsertMonitoring = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

const validateGetMonitoring = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

module.exports = {
  validateUpsertMonitoring,
  validateGetMonitoring
};