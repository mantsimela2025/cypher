const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const config = require('./index');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RAS Dashboard API',
      version: '1.0.0',
      description: 'A comprehensive API for RAS Dashboard application with authentication, user management, and RBAC',
      contact: {
        name: 'API Support',
        email: 'support@rasdash.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server',
      },
      {
        url: 'https://api.rasdash.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            avatar: {
              type: 'string',
              description: 'Avatar URL',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user is active',
            },
            isVerified: {
              type: 'boolean',
              description: 'Whether user is verified',
            },
            role: {
              type: 'string',
              description: 'User role',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Role ID',
            },
            name: {
              type: 'string',
              description: 'Role name',
            },
            displayName: {
              type: 'string',
              description: 'Role display name',
            },
            description: {
              type: 'string',
              description: 'Role description',
            },
            isActive: {
              type: 'boolean',
              description: 'Whether role is active',
            },
            isSystem: {
              type: 'boolean',
              description: 'Whether role is system role',
            },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Permission ID',
            },
            name: {
              type: 'string',
              description: 'Permission name',
            },
            resource: {
              type: 'string',
              description: 'Resource name',
            },
            action: {
              type: 'string',
              description: 'Action name',
            },
            displayName: {
              type: 'string',
              description: 'Permission display name',
            },
            description: {
              type: 'string',
              description: 'Permission description',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/swagger/*.js',
  ],
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  // Swagger page
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'RAS Dashboard API Documentation',
  }));

  // JSON endpoint
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

module.exports = {
  swaggerSetup,
  specs,
};
