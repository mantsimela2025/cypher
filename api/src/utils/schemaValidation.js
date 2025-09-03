/**
 * Schema-to-Validation Bridge
 * 
 * This utility extracts validation rules from Drizzle schemas and generates:
 * 1. Joi validation schemas for API endpoints
 * 2. Frontend validation rules for React forms
 * 3. Required field information
 * 4. Field type and constraint information
 */

const Joi = require('joi');

/**
 * Extract validation metadata from a Drizzle schema
 * @param {Object} drizzleSchema - The Drizzle table schema
 * @returns {Object} Validation metadata
 */
function extractSchemaValidation(drizzleSchema) {
  const validation = {
    required: [],
    optional: [],
    fields: {},
    joiSchema: {},
    frontendRules: {}
  };

  // Get the table columns
  const columns = drizzleSchema[Symbol.for('drizzle:Columns')] || {};
  
  Object.entries(columns).forEach(([fieldName, column]) => {
    const fieldInfo = analyzeColumn(fieldName, column);
    
    validation.fields[fieldName] = fieldInfo;
    
    if (fieldInfo.required) {
      validation.required.push(fieldName);
    } else {
      validation.optional.push(fieldName);
    }
    
    // Generate Joi validation
    validation.joiSchema[fieldName] = generateJoiValidation(fieldInfo);
    
    // Generate frontend validation rules
    validation.frontendRules[fieldName] = generateFrontendRules(fieldInfo);
  });

  return validation;
}

/**
 * Analyze a Drizzle column to extract validation info
 * @param {string} fieldName - The field name
 * @param {Object} column - The Drizzle column definition
 * @returns {Object} Field validation info
 */
function analyzeColumn(fieldName, column) {
  const fieldInfo = {
    name: fieldName,
    type: 'string', // default
    required: false,
    maxLength: null,
    minLength: null,
    pattern: null,
    enum: null,
    default: null,
    constraints: []
  };

  // Check if field is required (not nullable and no default)
  fieldInfo.required = column.notNull && !column.hasDefault;

  // Extract type information
  if (column.dataType) {
    fieldInfo.type = mapDrizzleTypeToValidationType(column.dataType);
  }

  // Extract length constraints
  if (column.columnType?.includes('varchar')) {
    const lengthMatch = column.columnType.match(/varchar\((\d+)\)/);
    if (lengthMatch) {
      fieldInfo.maxLength = parseInt(lengthMatch[1]);
    }
  }

  // Extract enum values
  if (column.enumValues) {
    fieldInfo.enum = column.enumValues;
    fieldInfo.type = 'enum';
  }

  // Extract default value
  if (column.default !== undefined) {
    fieldInfo.default = column.default;
  }

  // Special field name patterns
  if (fieldName.includes('email')) {
    fieldInfo.type = 'email';
    fieldInfo.pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }

  if (fieldName.includes('phone')) {
    fieldInfo.type = 'phone';
    fieldInfo.pattern = /^\+?[\d\s\-\(\)]+$/;
  }

  if (fieldName.includes('url') || fieldName.includes('link')) {
    fieldInfo.type = 'url';
  }

  if (fieldName.includes('password')) {
    fieldInfo.type = 'password';
    fieldInfo.minLength = 8;
    fieldInfo.pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  }

  return fieldInfo;
}

/**
 * Map Drizzle data types to validation types
 * @param {string} drizzleType - The Drizzle data type
 * @returns {string} Validation type
 */
function mapDrizzleTypeToValidationType(drizzleType) {
  const typeMap = {
    'varchar': 'string',
    'text': 'string',
    'integer': 'number',
    'serial': 'number',
    'boolean': 'boolean',
    'timestamp': 'date',
    'date': 'date',
    'numeric': 'number',
    'decimal': 'number',
    'jsonb': 'object',
    'uuid': 'uuid'
  };

  return typeMap[drizzleType] || 'string';
}

/**
 * Generate Joi validation for a field
 * @param {Object} fieldInfo - Field validation info
 * @returns {Object} Joi validation chain
 */
function generateJoiValidation(fieldInfo) {
  let joiChain;

  switch (fieldInfo.type) {
    case 'string':
      joiChain = Joi.string();
      break;
    case 'email':
      joiChain = Joi.string().email();
      break;
    case 'number':
      joiChain = Joi.number();
      break;
    case 'boolean':
      joiChain = Joi.boolean();
      break;
    case 'date':
      joiChain = Joi.date();
      break;
    case 'uuid':
      joiChain = Joi.string().uuid();
      break;
    case 'url':
      joiChain = Joi.string().uri();
      break;
    case 'phone':
      joiChain = Joi.string().pattern(fieldInfo.pattern);
      break;
    case 'password':
      joiChain = Joi.string().min(fieldInfo.minLength || 8).pattern(fieldInfo.pattern);
      break;
    case 'enum':
      joiChain = Joi.string().valid(...fieldInfo.enum);
      break;
    case 'object':
      joiChain = Joi.object();
      break;
    default:
      joiChain = Joi.string();
  }

  // Apply constraints
  if (fieldInfo.required) {
    joiChain = joiChain.required();
  } else {
    joiChain = joiChain.optional();
  }

  if (fieldInfo.maxLength) {
    joiChain = joiChain.max(fieldInfo.maxLength);
  }

  if (fieldInfo.minLength) {
    joiChain = joiChain.min(fieldInfo.minLength);
  }

  if (fieldInfo.pattern && fieldInfo.type === 'string') {
    joiChain = joiChain.pattern(fieldInfo.pattern);
  }

  return joiChain;
}

/**
 * Generate frontend validation rules
 * @param {Object} fieldInfo - Field validation info
 * @returns {Object} Frontend validation rules
 */
function generateFrontendRules(fieldInfo) {
  const rules = {
    required: fieldInfo.required,
    type: fieldInfo.type,
    errorMessages: {}
  };

  if (fieldInfo.required) {
    rules.errorMessages.required = `${fieldInfo.name} is required`;
  }

  if (fieldInfo.maxLength) {
    rules.maxLength = fieldInfo.maxLength;
    rules.errorMessages.maxLength = `${fieldInfo.name} must be no more than ${fieldInfo.maxLength} characters`;
  }

  if (fieldInfo.minLength) {
    rules.minLength = fieldInfo.minLength;
    rules.errorMessages.minLength = `${fieldInfo.name} must be at least ${fieldInfo.minLength} characters`;
  }

  if (fieldInfo.pattern) {
    rules.pattern = fieldInfo.pattern;
    rules.errorMessages.pattern = getPatternErrorMessage(fieldInfo);
  }

  if (fieldInfo.enum) {
    rules.enum = fieldInfo.enum;
    rules.errorMessages.enum = `${fieldInfo.name} must be one of: ${fieldInfo.enum.join(', ')}`;
  }

  if (fieldInfo.type === 'email') {
    rules.errorMessages.type = 'Please enter a valid email address';
  }

  if (fieldInfo.type === 'url') {
    rules.errorMessages.type = 'Please enter a valid URL';
  }

  return rules;
}

/**
 * Get appropriate error message for pattern validation
 * @param {Object} fieldInfo - Field validation info
 * @returns {string} Error message
 */
function getPatternErrorMessage(fieldInfo) {
  if (fieldInfo.type === 'password') {
    return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
  }
  
  if (fieldInfo.type === 'phone') {
    return 'Please enter a valid phone number';
  }
  
  return `${fieldInfo.name} format is invalid`;
}

/**
 * Create a complete Joi schema from Drizzle schema
 * @param {Object} drizzleSchema - The Drizzle table schema
 * @param {Array} excludeFields - Fields to exclude from validation
 * @returns {Object} Joi schema object
 */
function createJoiSchema(drizzleSchema, excludeFields = ['id', 'createdAt', 'updatedAt']) {
  const validation = extractSchemaValidation(drizzleSchema);
  const joiSchemaObject = {};

  Object.entries(validation.joiSchema).forEach(([fieldName, joiValidation]) => {
    if (!excludeFields.includes(fieldName)) {
      joiSchemaObject[fieldName] = joiValidation;
    }
  });

  return Joi.object(joiSchemaObject);
}

/**
 * Create frontend validation rules from Drizzle schema
 * @param {Object} drizzleSchema - The Drizzle table schema
 * @param {Array} excludeFields - Fields to exclude from validation
 * @returns {Object} Frontend validation rules
 */
function createFrontendValidation(drizzleSchema, excludeFields = ['id', 'createdAt', 'updatedAt']) {
  const validation = extractSchemaValidation(drizzleSchema);
  const frontendValidation = {
    rules: {},
    required: [],
    optional: []
  };

  Object.entries(validation.frontendRules).forEach(([fieldName, rules]) => {
    if (!excludeFields.includes(fieldName)) {
      frontendValidation.rules[fieldName] = rules;
      
      if (rules.required) {
        frontendValidation.required.push(fieldName);
      } else {
        frontendValidation.optional.push(fieldName);
      }
    }
  });

  return frontendValidation;
}

module.exports = {
  extractSchemaValidation,
  createJoiSchema,
  createFrontendValidation,
  analyzeColumn,
  mapDrizzleTypeToValidationType,
  generateJoiValidation,
  generateFrontendRules
};
