const { createFrontendValidation, createJoiSchema } = require('../utils/schemaValidation');
const allSchemas = require('../db/schema');

class ValidationController {
  
  /**
   * Get validation rules for a specific schema
   * GET /api/validation/schema/:schemaName
   */
  async getSchemaValidation(req, res) {
    try {
      const { schemaName } = req.params;
      const { excludeFields } = req.query;
      
      // Find the schema
      const schema = allSchemas[schemaName];
      if (!schema) {
        return res.status(404).json({
          error: 'Schema not found',
          message: `Schema '${schemaName}' does not exist`,
          availableSchemas: Object.keys(allSchemas).filter(key => 
            allSchemas[key] && typeof allSchemas[key] === 'object' && 
            allSchemas[key][Symbol.for('drizzle:Name')]
          )
        });
      }

      // Parse exclude fields
      const excludeFieldsArray = excludeFields ? 
        excludeFields.split(',').map(f => f.trim()) : 
        ['id', 'createdAt', 'updatedAt'];

      // Generate validation rules
      const frontendValidation = createFrontendValidation(schema, excludeFieldsArray);
      
      res.json({
        schemaName,
        tableName: schema[Symbol.for('drizzle:Name')],
        validation: frontendValidation,
        excludedFields: excludeFieldsArray
      });

    } catch (error) {
      console.error('Error getting schema validation:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate validation rules'
      });
    }
  }

  /**
   * Get validation rules for multiple schemas
   * POST /api/validation/schemas
   * Body: { schemas: ['users', 'assets'], excludeFields: ['id', 'createdAt'] }
   */
  async getMultipleSchemaValidations(req, res) {
    try {
      const { schemas, excludeFields = ['id', 'createdAt', 'updatedAt'] } = req.body;

      if (!Array.isArray(schemas)) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'schemas must be an array'
        });
      }

      const validations = {};
      const errors = {};

      schemas.forEach(schemaName => {
        try {
          const schema = allSchemas[schemaName];
          if (!schema) {
            errors[schemaName] = 'Schema not found';
            return;
          }

          validations[schemaName] = {
            tableName: schema[Symbol.for('drizzle:Name')],
            validation: createFrontendValidation(schema, excludeFields)
          };
        } catch (error) {
          errors[schemaName] = error.message;
        }
      });

      res.json({
        validations,
        errors: Object.keys(errors).length > 0 ? errors : undefined,
        excludedFields: excludeFields
      });

    } catch (error) {
      console.error('Error getting multiple schema validations:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate validation rules'
      });
    }
  }

  /**
   * List all available schemas
   * GET /api/validation/schemas
   */
  async listSchemas(req, res) {
    try {
      const schemas = Object.keys(allSchemas)
        .filter(key => {
          const schema = allSchemas[key];
          return schema && typeof schema === 'object' && schema[Symbol.for('drizzle:Name')];
        })
        .map(schemaName => ({
          schemaName,
          tableName: allSchemas[schemaName][Symbol.for('drizzle:Name')],
          hasValidation: true
        }));

      res.json({
        schemas,
        total: schemas.length
      });

    } catch (error) {
      console.error('Error listing schemas:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to list schemas'
      });
    }
  }

  /**
   * Validate data against a schema
   * POST /api/validation/validate/:schemaName
   * Body: { data: { field1: 'value1', field2: 'value2' } }
   */
  async validateData(req, res) {
    try {
      const { schemaName } = req.params;
      const { data, excludeFields = ['id', 'createdAt', 'updatedAt'] } = req.body;

      // Find the schema
      const schema = allSchemas[schemaName];
      if (!schema) {
        return res.status(404).json({
          error: 'Schema not found',
          message: `Schema '${schemaName}' does not exist`
        });
      }

      // Create Joi schema for validation
      const joiSchema = createJoiSchema(schema, excludeFields);
      
      // Validate the data
      const { error, value } = joiSchema.validate(data, { 
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      if (error) {
        const validationErrors = {};
        error.details.forEach(detail => {
          const fieldName = detail.path.join('.');
          validationErrors[fieldName] = detail.message;
        });

        return res.status(400).json({
          isValid: false,
          errors: validationErrors,
          data: value
        });
      }

      res.json({
        isValid: true,
        data: value,
        message: 'Validation successful'
      });

    } catch (error) {
      console.error('Error validating data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate data'
      });
    }
  }

  /**
   * Get field information for a specific schema
   * GET /api/validation/schema/:schemaName/fields
   */
  async getSchemaFields(req, res) {
    try {
      const { schemaName } = req.params;
      
      // Find the schema
      const schema = allSchemas[schemaName];
      if (!schema) {
        return res.status(404).json({
          error: 'Schema not found',
          message: `Schema '${schemaName}' does not exist`
        });
      }

      // Get columns information
      const columns = schema[Symbol.for('drizzle:Columns')] || {};
      const fields = {};

      Object.entries(columns).forEach(([fieldName, column]) => {
        fields[fieldName] = {
          name: fieldName,
          type: column.dataType || 'string',
          required: column.notNull && !column.hasDefault,
          hasDefault: column.hasDefault,
          defaultValue: column.default,
          maxLength: column.columnType?.includes('varchar') ? 
            parseInt(column.columnType.match(/varchar\((\d+)\)/)?.[1]) : null,
          enumValues: column.enumValues || null,
          nullable: !column.notNull
        };
      });

      res.json({
        schemaName,
        tableName: schema[Symbol.for('drizzle:Name')],
        fields,
        fieldCount: Object.keys(fields).length
      });

    } catch (error) {
      console.error('Error getting schema fields:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to get schema fields'
      });
    }
  }
}

module.exports = new ValidationController();
