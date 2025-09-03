const { body, param } = require('express-validator');

// Tasks validation rules
const validateListTasksByStep = [
  param('stepId').isInt().withMessage('Step ID must be an integer')
];

const validateCreateTask = [
  param('stepId').isInt().withMessage('Step ID must be an integer'),
  body('key').notEmpty().trim().withMessage('Task key is required'),
  body('title').notEmpty().trim().withMessage('Task title is required')
];

const validateUpdateTask = [
  param('id').isInt().withMessage('Task ID must be an integer')
];

module.exports = {
  validateListTasksByStep,
  validateCreateTask,
  validateUpdateTask
};