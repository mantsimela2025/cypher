const { extractSchemaValidation, createJoiSchema, createFrontendValidation } = require('../src/utils/schemaValidation');
const { users } = require('../src/db/schema');

describe('Schema Validation System', () => {
  
  describe('extractSchemaValidation', () => {
    it('should extract validation metadata from users schema', () => {
      const validation = extractSchemaValidation(users);
      
      expect(validation).toHaveProperty('required');
      expect(validation).toHaveProperty('optional');
      expect(validation).toHaveProperty('fields');
      expect(validation).toHaveProperty('joiSchema');
      expect(validation).toHaveProperty('frontendRules');
      
      // Check that email is detected as required
      expect(validation.required).toContain('email');
      
      // Check that email field has correct type
      expect(validation.fields.email.type).toBe('email');
      expect(validation.fields.email.required).toBe(true);
    });
  });

  describe('createJoiSchema', () => {
    it('should create a valid Joi schema from users table', () => {
      const joiSchema = createJoiSchema(users, ['id', 'createdAt', 'updatedAt']);
      
      // Test valid data
      const validData = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      };
      
      const { error } = joiSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    it('should reject invalid email format', () => {
      const joiSchema = createJoiSchema(users, ['id', 'createdAt', 'updatedAt']);
      
      const invalidData = {
        email: 'invalid-email',
        firstName: 'John',
        username: 'johndoe'
      };
      
      const { error } = joiSchema.validate(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].path).toContain('email');
    });

    it('should require mandatory fields', () => {
      const joiSchema = createJoiSchema(users, ['id', 'createdAt', 'updatedAt']);
      
      const incompleteData = {
        firstName: 'John'
        // Missing required email and username
      };
      
      const { error } = joiSchema.validate(incompleteData);
      expect(error).toBeDefined();
      expect(error.details.length).toBeGreaterThan(0);
    });
  });

  describe('createFrontendValidation', () => {
    it('should create frontend validation rules', () => {
      const frontendValidation = createFrontendValidation(users, ['id', 'createdAt', 'updatedAt']);
      
      expect(frontendValidation).toHaveProperty('rules');
      expect(frontendValidation).toHaveProperty('required');
      expect(frontendValidation).toHaveProperty('optional');
      
      // Check email field rules
      expect(frontendValidation.rules.email).toEqual({
        required: true,
        type: 'email',
        errorMessages: expect.objectContaining({
          required: expect.stringContaining('email'),
          type: expect.stringContaining('valid email')
        })
      });
      
      // Check required fields array
      expect(frontendValidation.required).toContain('email');
    });
  });

  describe('Field Type Detection', () => {
    it('should detect email fields correctly', () => {
      const validation = extractSchemaValidation(users);
      expect(validation.fields.email.type).toBe('email');
      expect(validation.fields.email.pattern).toEqual(expect.any(RegExp));
    });

    it('should detect string fields with length constraints', () => {
      const validation = extractSchemaValidation(users);
      
      // Assuming firstName has a length constraint
      if (validation.fields.firstName) {
        expect(validation.fields.firstName.type).toBe('string');
        expect(validation.fields.firstName.maxLength).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Messages', () => {
    it('should generate appropriate error messages', () => {
      const frontendValidation = createFrontendValidation(users);
      
      const emailRules = frontendValidation.rules.email;
      expect(emailRules.errorMessages.required).toMatch(/email.*required/i);
      expect(emailRules.errorMessages.type).toMatch(/valid email/i);
    });
  });
});

// Integration test with actual API endpoint
describe('Validation API Integration', () => {
  const request = require('supertest');
  const app = require('../src/app');
  
  // Mock authentication for testing
  const mockAuth = (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  };
  
  beforeAll(() => {
    // Replace auth middleware with mock for testing
    app._router.stack.forEach(layer => {
      if (layer.route && layer.route.path.includes('/validation')) {
        layer.route.stack.forEach(routeLayer => {
          if (routeLayer.name === 'authenticateToken') {
            routeLayer.handle = mockAuth;
          }
        });
      }
    });
  });

  it('should return validation rules for users schema', async () => {
    const response = await request(app)
      .get('/api/v1/validation/schema/users')
      .expect(200);
    
    expect(response.body).toHaveProperty('schemaName', 'users');
    expect(response.body).toHaveProperty('validation');
    expect(response.body.validation).toHaveProperty('required');
    expect(response.body.validation).toHaveProperty('rules');
    
    // Check that email is in required fields
    expect(response.body.validation.required).toContain('email');
  });

  it('should return 404 for non-existent schema', async () => {
    const response = await request(app)
      .get('/api/v1/validation/schema/nonexistent')
      .expect(404);
    
    expect(response.body).toHaveProperty('error', 'Schema not found');
  });

  it('should validate data against schema', async () => {
    const validData = {
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe'
      }
    };
    
    const response = await request(app)
      .post('/api/v1/validation/validate/users')
      .send(validData)
      .expect(200);
    
    expect(response.body).toHaveProperty('isValid', true);
  });

  it('should reject invalid data', async () => {
    const invalidData = {
      data: {
        email: 'invalid-email',
        firstName: 'John'
        // Missing required username
      }
    };
    
    const response = await request(app)
      .post('/api/v1/validation/validate/users')
      .send(invalidData)
      .expect(400);
    
    expect(response.body).toHaveProperty('isValid', false);
    expect(response.body).toHaveProperty('errors');
  });
});
