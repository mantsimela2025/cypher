const { body, param, query } = require('express-validator');

// Common pagination validation
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
  query('sortBy').optional().isString().trim(),
  query('sortOrder').optional().isIn(['asc', 'desc'])
];

// Project validation rules
const validateCreateProject = [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('system_id').optional().isInt().withMessage('System ID must be an integer')
];

const validateListProjects = [
  ...validatePagination
];

const validateGetProjectById = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

const validateUpdateProject = [
  param('id').isInt().withMessage('Project ID must be an integer'),
  body('title').optional().isString().trim().withMessage('Title must be a string'),
  body('status').optional().isString().trim().withMessage('Status must be a string'),
  body('current_step').optional().isString().trim().withMessage('Current step must be a string')
];

module.exports = {
  validateCreateProject,
  validateListProjects,
  validateGetProjectById,
  validateUpdateProject
};