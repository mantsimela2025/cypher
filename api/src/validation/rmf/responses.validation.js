const { body, param } = require('express-validator');

// Questionnaire responses validation rules
const validateCreateResponse = [
  param('taskId').isInt().withMessage('Task ID must be an integer'),
  param('questionnaireId').isInt().withMessage('Questionnaire ID must be an integer'),
  body('responses_json').notEmpty().withMessage('Responses JSON is required')
];

const validateUpdateResponse = [
  param('id').isInt().withMessage('Response ID must be an integer')
];

module.exports = {
  validateCreateResponse,
  validateUpdateResponse
};