const { body, param } = require('express-validator');

// Assessments validation rules
const validateCreateAssessment = [
  param('id').isInt().withMessage('Project ID must be an integer'),
  body('assessment_type').isString().notEmpty().withMessage('Assessment type is required')
];

const validateUpdateAssessment = [
  param('assessmentId').isInt().withMessage('Assessment ID must be an integer')
];

const validateListAssessmentsByProject = [
  param('id').isInt().withMessage('Project ID must be an integer')
];

module.exports = {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateListAssessmentsByProject
};