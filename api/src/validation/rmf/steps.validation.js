const { body, param } = require('express-validator');

// Steps validation rules
const validateGetStepsByProject = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

const validateUpdateStep = [
  param('id').isInt().withMessage('Project ID must be an integer'),
  param('step').isString().trim().withMessage('Step must be a string')
];

const validateApproveStep = [
  param('id').isInt().withMessage('Project ID must be an integer'),
  param('step').isString().trim().withMessage('Step must be a string'),
  body('role').isIn(['ISSO','ISSM','AO']).withMessage('Role must be one of: ISSO, ISSM, AO'),
  body('decision').isIn(['approved','rejected','needs_changes']).withMessage('Decision must be one of: approved, rejected, needs_changes')
];

module.exports = {
  validateGetStepsByProject,
  validateUpdateStep,
  validateApproveStep
};