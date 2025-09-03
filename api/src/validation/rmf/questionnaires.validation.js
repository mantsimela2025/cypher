const { body, param } = require('express-validator');

// Questionnaires validation rules
const validateListQuestionnaires = [
  // No specific validation needed for list endpoint
];

const validateCreateQuestionnaire = [
  body('code').notEmpty().trim().withMessage('Questionnaire code is required'),
  body('title').notEmpty().trim().withMessage('Questionnaire title is required'),
  body('schema_json').notEmpty().withMessage('Schema JSON is required')
];

const validateUpdateQuestionnaire = [
  param('id').isInt().withMessage('Questionnaire ID must be an integer')
];

module.exports = {
  validateListQuestionnaires,
  validateCreateQuestionnaire,
  validateUpdateQuestionnaire
};