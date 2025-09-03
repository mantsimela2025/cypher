/**
 * RMF AI Validation Middleware
 * Input validation for AI-powered RMF operations
 */

const { body, param, query } = require('express-validator');

/**
 * Validation for system categorization request
 */
const validateSystemCategorization = [
  body('name')
    .notEmpty()
    .withMessage('System name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('System name must be between 2 and 255 characters'),

  body('description')
    .notEmpty()
    .withMessage('System description is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('System description must be between 10 and 2000 characters'),

  body('dataTypes')
    .optional()
    .isArray()
    .withMessage('Data types must be an array')
    .custom((value) => {
      if (value && value.length > 20) {
        throw new Error('Maximum 20 data types allowed');
      }
      return true;
    }),

  body('businessProcesses')
    .optional()
    .isArray()
    .withMessage('Business processes must be an array')
    .custom((value) => {
      if (value && value.length > 20) {
        throw new Error('Maximum 20 business processes allowed');
      }
      return true;
    }),

  body('environment')
    .optional()
    .isIn(['On-Premises', 'Cloud', 'Hybrid', 'Multi-Cloud'])
    .withMessage('Environment must be one of: On-Premises, Cloud, Hybrid, Multi-Cloud'),

  body('userBase')
    .optional()
    .isLength({ max: 500 })
    .withMessage('User base description must be less than 500 characters'),

  body('systemId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('System ID must be a positive integer')
];

/**
 * Validation for categorization history request
 */
const validateCategorizationHistory = [
  param('systemId')
    .notEmpty()
    .withMessage('System ID is required')
    .isInt({ min: 1 })
    .withMessage('System ID must be a positive integer')
];

/**
 * Validation for AI stats request
 */
const validateAIStats = [
  query('timeframe')
    .optional()
    .isIn(['1 hour', '24 hours', '7 days', '30 days'])
    .withMessage('Timeframe must be one of: 1 hour, 24 hours, 7 days, 30 days')
];

/**
 * Validation for control selection request
 */
const validateControlSelection = [
  body('systemId')
    .notEmpty()
    .withMessage('System ID is required')
    .isInt({ min: 1 })
    .withMessage('System ID must be a positive integer'),

  body('categorization')
    .notEmpty()
    .withMessage('System categorization is required')
    .isObject()
    .withMessage('Categorization must be an object'),

  body('categorization.confidentiality')
    .notEmpty()
    .withMessage('Confidentiality impact is required')
    .isIn(['LOW', 'MODERATE', 'HIGH'])
    .withMessage('Confidentiality impact must be LOW, MODERATE, or HIGH'),

  body('categorization.integrity')
    .notEmpty()
    .withMessage('Integrity impact is required')
    .isIn(['LOW', 'MODERATE', 'HIGH'])
    .withMessage('Integrity impact must be LOW, MODERATE, or HIGH'),

  body('categorization.availability')
    .notEmpty()
    .withMessage('Availability impact is required')
    .isIn(['LOW', 'MODERATE', 'HIGH'])
    .withMessage('Availability impact must be LOW, MODERATE, or HIGH'),

  body('systemContext')
    .optional()
    .isObject()
    .withMessage('System context must be an object'),

  body('systemContext.environment')
    .optional()
    .isIn(['On-Premises', 'Cloud', 'Hybrid', 'Multi-Cloud'])
    .withMessage('Environment must be one of: On-Premises, Cloud, Hybrid, Multi-Cloud'),

  body('systemContext.cloudProvider')
    .optional()
    .isIn(['AWS', 'Azure', 'GCP', 'Other'])
    .withMessage('Cloud provider must be one of: AWS, Azure, GCP, Other'),

  body('systemContext.regulations')
    .optional()
    .isArray()
    .withMessage('Regulations must be an array')
    .custom((value) => {
      if (value && value.length > 10) {
        throw new Error('Maximum 10 regulations allowed');
      }
      return true;
    })
];

/**
 * Validation for POA&M generation request
 */
const validatePOAMGeneration = [
  body('systemId')
    .notEmpty()
    .withMessage('System ID is required')
    .isInt({ min: 1 })
    .withMessage('System ID must be a positive integer'),

  body('findings')
    .notEmpty()
    .withMessage('Findings are required')
    .isArray({ min: 1 })
    .withMessage('At least one finding is required'),

  body('findings.*.controlId')
    .notEmpty()
    .withMessage('Control ID is required for each finding')
    .matches(/^[A-Z]{2}-\d+(\(\d+\))?$/)
    .withMessage('Control ID must be in format XX-## or XX-##(#)'),

  body('findings.*.finding')
    .notEmpty()
    .withMessage('Finding description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Finding description must be between 10 and 1000 characters'),

  body('findings.*.severity')
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['Critical', 'High', 'Medium', 'Low'])
    .withMessage('Severity must be Critical, High, Medium, or Low'),

  body('findings.*.evidence')
    .optional()
    .isLength({ max: 2000 })
    .withMessage('Evidence description must be less than 2000 characters')
];

module.exports = {
  validateSystemCategorization,
  validateCategorizationHistory,
  validateAIStats,
  validateControlSelection,
  validatePOAMGeneration
};
