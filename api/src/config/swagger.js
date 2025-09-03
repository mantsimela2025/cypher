const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
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
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../swagger/*.js'),
  ],
};

const specs = swaggerJsdoc(options);

// Basic diagnostics to help detect blank spec issues
try {
  const pathCount = Object.keys(specs.paths || {}).length;
  const schemaCount = Object.keys((specs.components && specs.components.schemas) || {}).length;
  if (pathCount === 0) {
    console.warn('[Swagger] Warning: Generated OpenAPI spec has 0 paths. UI may appear blank.');
    console.warn('[Swagger] Check your JSDoc annotations and apis globs in swagger config.');
  }
  console.log(`[Swagger] Spec generated. Paths: ${pathCount}, Schemas: ${schemaCount}`);
} catch (e) {
  console.warn('[Swagger] Failed to analyze generated spec:', e.message);
}

const swaggerSetup = (app) => {
  // Enhanced Swagger UI with testing capabilities
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      // Safe subset of options known to work with swagger-ui-express
      deepLinking: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      syntaxHighlight: {
        activated: true,
        theme: 'agate'
      },
      requestInterceptor: (req) => req,
      responseInterceptor: (res) => res
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #3b4151; font-size: 36px; }
      .swagger-ui .scheme-container { background: #f7f7f7; padding: 15px; margin: 20px 0; border-radius: 4px; }
      .swagger-ui .auth-wrapper { margin: 20px 0; }
      .swagger-ui .btn.authorize { background-color: #49cc90; border-color: #49cc90; }
      .swagger-ui .btn.authorize:hover { background-color: #3ea175; }
      .swagger-ui .response-col_status { font-weight: bold; }
      .swagger-ui .response.highlighted { background-color: #f0f8ff; border-left: 4px solid #49cc90; }
      .swagger-ui .try-out__btn { background-color: #61affe; border-color: #61affe; }
      .swagger-ui .execute-wrapper .btn { background-color: #4990e2; border-color: #4990e2; }
    `,
    customSiteTitle: 'CYPHER API Testing Interface',
    // Guard favicon path; if missing it can cause 404 noise but not blank UI
    customfavIcon: '/favicon.ico'
    // customJs intentionally disabled for stability
  };

  // Swagger UI page with enhanced testing
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

  // Provide a minimal, safe Swagger UI for debugging rendering issues
  app.use('/api-docs-simple', swaggerUi.serve, swaggerUi.setup(specs));

  // JSON endpoint for API specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Custom JavaScript for enhanced Swagger functionality
  app.get('/swagger-custom.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
      // Enhanced Swagger UI functionality
      window.onload = function() {
        // Add custom authentication helper
        const ui = window.ui;

        // Auto-populate common test values
        const addTestDataButton = document.createElement('button');
        addTestDataButton.innerHTML = '🧪 Load Test Data';
        addTestDataButton.className = 'btn btn-sm btn-outline-primary';
        addTestDataButton.style.margin = '10px';
        addTestDataButton.onclick = function() {
          // Add test authentication token if available
          const authInput = document.querySelector('input[placeholder*="Bearer"]');
          if (authInput && !authInput.value) {
            authInput.value = 'your-test-token-here';
          }

          // Show notification
          const notification = document.createElement('div');
          notification.innerHTML = '✅ Test data loaded! Remember to update the Bearer token.';
          notification.style.cssText = 'position:fixed;top:20px;right:20px;background:#49cc90;color:white;padding:10px;border-radius:4px;z-index:9999;';
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        };

        // Add the button to the info section
        setTimeout(() => {
          const infoSection = document.querySelector('.swagger-ui .info');
          if (infoSection) {
            infoSection.appendChild(addTestDataButton);
          }
        }, 1000);

        // Add keyboard shortcuts
        document.addEventListener('keydown', function(e) {
          // Ctrl+Enter to execute request
          if (e.ctrlKey && e.key === 'Enter') {
            const executeBtn = document.querySelector('.execute-wrapper .btn');
            if (executeBtn) executeBtn.click();
          }
        });

        // Add response time tracking
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
          const startTime = Date.now();
          return originalFetch.apply(this, args).then(response => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            console.log(\`API Request completed in \${duration}ms\`);
            return response;
          });
        };
      };
    `);
  });

  // API Testing Dashboard endpoint
  app.get('/api-test', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>CYPHER API Testing Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 40px; }
          .header h1 { color: #333; margin-bottom: 10px; }
          .header p { color: #666; font-size: 16px; }
          .section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 6px; }
          .section h2 { color: #333; margin-bottom: 15px; }
          .btn { display: inline-block; padding: 10px 20px; margin: 5px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          .btn-primary { background: #007bff; color: white; }
          .btn-success { background: #28a745; color: white; }
          .btn-info { background: #17a2b8; color: white; }
          .btn-warning { background: #ffc107; color: black; }
          .endpoint-list { list-style: none; padding: 0; }
          .endpoint-list li { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
          .method { font-weight: bold; padding: 2px 8px; border-radius: 3px; color: white; font-size: 12px; }
          .method.get { background: #61affe; }
          .method.post { background: #49cc90; }
          .method.put { background: #fca130; }
          .method.delete { background: #f93e3e; }
          .status { margin-top: 20px; padding: 15px; border-radius: 4px; }
          .status.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
          .status.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 CYPHER API Testing Dashboard</h1>
            <p>Comprehensive API testing interface for the CYPHER application</p>
          </div>

          <div class="section">
            <h2>📚 Interactive Documentation</h2>
            <p>Access the full Swagger UI interface with "Try it out" functionality:</p>
            <a href="/api-docs" class="btn btn-primary" target="_blank">🔧 Open Swagger UI</a>
            <a href="/api-docs.json" class="btn btn-info" target="_blank">📄 View OpenAPI Spec</a>
          </div>

          <div class="section">
            <h2>🔐 Authentication Testing</h2>
            <p>Test authentication endpoints and get tokens for protected routes:</p>
            <ul class="endpoint-list">
              <li><span class="method post">POST</span> /api/v1/auth/login - Login and get access token</li>
              <li><span class="method post">POST</span> /api/v1/auth/register - Register new user</li>
              <li><span class="method post">POST</span> /api/v1/auth/refresh - Refresh access token</li>
              <li><span class="method post">POST</span> /api/v1/auth/logout - Logout user</li>
            </ul>
          </div>

          <div class="section">
            <h2>📊 Core API Endpoints</h2>
            <p>Main application endpoints available for testing:</p>
            <ul class="endpoint-list">
              <li><span class="method get">GET</span> /api/v1/global-metrics/vulnerability - Real-time vulnerability metrics</li>
              <li><span class="method get">GET</span> /api/v1/users - User management</li>
              <li><span class="method get">GET</span> /api/v1/systems - Systems management</li>
              <li><span class="method get">GET</span> /api/v1/vulnerabilities - Vulnerability data</li>
              <li><span class="method get">GET</span> /api/v1/assets - Asset management</li>
              <li><span class="method get">GET</span> /api/v1/cves - CVE database</li>
            </ul>
          </div>

          <div class="section">
            <h2>🧪 Quick Test Scripts</h2>
            <p>Pre-built test scripts for common scenarios:</p>
            <a href="#" onclick="runHealthCheck()" class="btn btn-success">❤️ Health Check</a>
            <a href="#" onclick="testAuth()" class="btn btn-warning">🔐 Test Auth</a>
            <a href="#" onclick="testMetrics()" class="btn btn-info">📊 Test Metrics</a>
            <div id="test-results" class="status" style="display:none;"></div>
          </div>

          <div class="section">
            <h2>💡 Testing Tips</h2>
            <ul>
              <li><strong>Authentication:</strong> First login via /auth/login to get a Bearer token</li>
              <li><strong>Authorization:</strong> Add "Bearer YOUR_TOKEN" to the Authorization header</li>
              <li><strong>Keyboard Shortcuts:</strong> Use Ctrl+Enter to execute requests in Swagger UI</li>
              <li><strong>Response Times:</strong> Check browser console for API response times</li>
              <li><strong>Error Handling:</strong> All endpoints return consistent error formats</li>
            </ul>
          </div>
        </div>

        <script>
          function showResult(message, isSuccess) {
            const resultDiv = document.getElementById('test-results');
            resultDiv.style.display = 'block';
            resultDiv.className = 'status ' + (isSuccess ? 'success' : 'error');
            resultDiv.innerHTML = message;
          }

          async function runHealthCheck() {
            try {
              const response = await fetch('/health');
              const data = await response.json();
              showResult('✅ Health Check Passed: ' + JSON.stringify(data, null, 2), true);
            } catch (error) {
              showResult('❌ Health Check Failed: ' + error.message, false);
            }
          }

          async function testAuth() {
            showResult('🔄 Testing authentication... (This is a demo - implement actual auth test)', true);
          }

          async function testMetrics() {
            try {
              const response = await fetch('/api/v1/global-metrics/vulnerability');
              if (response.ok) {
                const data = await response.json();
                showResult('✅ Metrics Test Passed: Found ' + (data.data?.total || 0) + ' vulnerabilities', true);
              } else {
                showResult('⚠️ Metrics endpoint requires authentication', false);
              }
            } catch (error) {
              showResult('❌ Metrics Test Failed: ' + error.message, false);
            }
          }
        </script>
      </body>
      </html>
    `);
  });
};

module.exports = {
  swaggerSetup,
  specs,
};
