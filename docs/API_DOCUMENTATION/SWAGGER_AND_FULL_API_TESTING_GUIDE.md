# SWAGGER AND FULL API TESTING GUIDE

## 🎯 Overview

This comprehensive guide covers the complete API testing system implemented in the CYPHER application, including enhanced Swagger UI with interactive testing capabilities, automated token generation, sample data provision, and comprehensive testing utilities.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Swagger UI Enhanced Features](#swagger-ui-enhanced-features)
3. [API Testing Utilities](#api-testing-utilities)
4. [Authentication & Authorization](#authentication--authorization)
5. [Testing Workflows](#testing-workflows)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites
- CYPHER API server running on `http://localhost:3001`
- Node.js environment set up
- Basic understanding of REST APIs

### Step 1: Start the Server
```bash
cd api
npm run dev
```

### Step 2: Access Testing Interfaces
- **Interactive Swagger UI**: `http://localhost:3001/api-docs`
- **API Testing Dashboard**: `http://localhost:3001/api-test`
- **OpenAPI Specification**: `http://localhost:3001/api-docs.json`

### Step 3: Generate Authentication Token
```bash
# Visit this URL in your browser
http://localhost:3001/api/v1/test/tokens?role=admin

# Or use curl
curl "http://localhost:3001/api/v1/test/tokens?role=admin"
```

### Step 4: Authenticate in Swagger UI
1. Open `http://localhost:3001/api-docs`
2. Click the **"Authorize"** button (🔒 icon)
3. Paste your token in the **"Value"** field
4. Click **"Authorize"** and **"Close"**
5. You're now authenticated for all protected endpoints!

## 🔧 Swagger UI Enhanced Features

### Interactive Testing Capabilities
- **"Try it out" functionality** on all endpoints
- **Real-time request/response validation**
- **Syntax highlighting** for JSON payloads
- **Request duration tracking**
- **Persistent authentication** across sessions

### Enhanced User Interface
- **Custom styling** with CYPHER branding
- **Keyboard shortcuts** (Ctrl+Enter to execute requests)
- **Response highlighting** for better readability
- **Auto-populated examples** for request bodies
- **Enhanced error display** with detailed messages

### Custom Features
- **Test data loading** button for quick setup
- **Response time tracking** in browser console
- **Deep linking** to specific endpoints
- **Filtering capabilities** for large API specifications

## 🧪 API Testing Utilities

The CYPHER API includes comprehensive testing utilities accessible at `/api/v1/test/*`:

### 1. Token Generation (`/api/v1/test/tokens`)

Generate JWT tokens for different user roles:

```bash
# Admin token (full access)
GET /api/v1/test/tokens?role=admin

# Analyst token (systems & vulnerabilities access)
GET /api/v1/test/tokens?role=analyst

# User token (read-only access)
GET /api/v1/test/tokens?role=user
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "role": "admin",
    "expiresIn": "24h",
    "usage": "Add \"Authorization: Bearer <token>\" to your request headers"
  }
}
```

### 2. Sample Data Provision (`/api/v1/test/sample-data`)

Get pre-configured sample data for testing endpoints:

```bash
# Get sample data for creating a user
GET /api/v1/test/sample-data?endpoint=/api/v1/users&method=POST

# Get sample data for creating a system
GET /api/v1/test/sample-data?endpoint=/api/v1/systems&method=POST
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "endpoint": "/api/v1/users",
    "method": "POST",
    "requestBody": {
      "email": "test@example.com",
      "username": "testuser",
      "firstName": "Test",
      "lastName": "User",
      "password": "password123"
    },
    "queryParameters": {
      "page": 1,
      "limit": 10,
      "search": "test"
    },
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer <token>"
    }
  }
}
```

### 3. cURL Command Generation (`/api/v1/test/curl`)

Generate ready-to-use cURL commands for terminal testing:

```bash
# Generate cURL for GET request
GET /api/v1/test/curl?endpoint=/api/v1/users&method=GET&role=admin

# Generate cURL for POST request with data
GET /api/v1/test/curl?endpoint=/api/v1/users&method=POST&role=admin
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "curl": "curl -X GET \"http://localhost:3001/api/v1/users\" -H \"Authorization: Bearer <token>\" -H \"Content-Type: application/json\"",
    "endpoint": "/api/v1/users",
    "method": "GET",
    "role": "admin",
    "instructions": [
      "1. Copy the cURL command below",
      "2. Open your terminal or command prompt", 
      "3. Paste and execute the command",
      "4. Check the response for expected results"
    ]
  }
}
```

### 4. Test Scenarios (`/api/v1/test/scenarios`)

Access comprehensive test scenarios organized by category:

```bash
GET /api/v1/test/scenarios
```

**Available Categories:**
- **Authentication**: Login, registration, token refresh
- **Users**: User management operations
- **Systems**: System discovery and management
- **Vulnerabilities**: CVE data and vulnerability metrics

### 5. Test Report Generation (`/api/v1/test/report`)

Generate a comprehensive markdown test report:

```bash
GET /api/v1/test/report
```

Downloads a complete testing guide with all scenarios, sample data, and cURL commands.

### 6. Health Check (`/api/v1/test/health`)

Verify testing utilities are operational:

```bash
GET /api/v1/test/health
```

## 🔐 Authentication & Authorization

### Available Test Roles

| Role | Access Level | Use Case |
|------|-------------|----------|
| **admin** | Full access to all endpoints (create, read, update, delete) | Complete system administration |
| **user** | Read-only access to most resources | General application usage |
| **moderator** | Limited administrative access | Content moderation and user management |

### Token Usage

1. **Generate Token**: Use `/api/v1/test/tokens?role=<role>`
2. **Add to Headers**: `Authorization: Bearer <your-token>`
3. **Swagger UI**: Use the "Authorize" button
4. **cURL**: Include `-H "Authorization: Bearer <token>"`

### Token Features
- **24-hour expiration** for security
- **Role-based authorization** enforcement
- **Persistent authentication** in Swagger UI
- **Automatic validation** on protected endpoints

## 🔄 Testing Workflows

### Workflow 1: Basic API Testing

1. **Start Server**: `npm run dev`
2. **Generate Token**: Visit `/api/v1/test/tokens?role=admin`
3. **Open Swagger UI**: `http://localhost:3001/api-docs`
4. **Authenticate**: Click "Authorize" and paste token
5. **Test Endpoints**: Use "Try it out" on any endpoint

### Workflow 2: Comprehensive Endpoint Testing

1. **Get Test Scenarios**: `GET /api/v1/test/scenarios`
2. **Get Sample Data**: `GET /api/v1/test/sample-data?endpoint=<endpoint>`
3. **Execute Tests**: Use sample data in Swagger UI
4. **Verify Responses**: Check status codes and response format
5. **Generate Report**: `GET /api/v1/test/report` for documentation

### Workflow 3: Terminal-Based Testing

1. **Generate cURL**: `GET /api/v1/test/curl?endpoint=<endpoint>&method=<method>`
2. **Copy Command**: Use the generated cURL command
3. **Execute in Terminal**: Run the command in your terminal
4. **Analyze Results**: Review JSON responses

### Workflow 4: Automated Testing Integration

1. **Use Test Helper**: Import `SwaggerTestHelper` class
2. **Generate Tokens**: Programmatically create authentication
3. **Create Test Suites**: Use sample data for automated tests
4. **Validate Responses**: Implement response validation logic

## 🎨 Advanced Features

### Custom Swagger Enhancements

The CYPHER implementation includes several advanced features:

**Enhanced UI Components:**
- Custom CSS styling with CYPHER branding
- Improved button styling and hover effects
- Enhanced response highlighting
- Better error message display

**JavaScript Enhancements:**
- Keyboard shortcuts for faster testing
- Auto-population of test data
- Response time tracking
- Custom notification system

**Testing Utilities Integration:**
- Direct access to token generation
- Sample data loading buttons
- Quick test execution helpers
- Enhanced debugging information

### Performance Monitoring

The testing system includes built-in performance monitoring:

- **Request Duration Tracking**: All API calls are timed
- **Response Size Monitoring**: Track payload sizes
- **Error Rate Analysis**: Monitor failed requests
- **Authentication Performance**: Track token validation times

### Security Features

- **Token Expiration**: 24-hour automatic expiration
- **Role-Based Access**: Simple role-based authorization control
- **Request Validation**: Input validation on all endpoints
- **Response Sanitization**: Secure response formatting

## 🔍 Troubleshooting

### Common Issues

**1. Server Not Running**
```
Error: ECONNREFUSED
Solution: Start the server with `npm run dev`
```

**2. Authentication Failed**
```
Error: 401 Unauthorized
Solution: Generate a new token from /api/v1/test/tokens
```

**3. Swagger UI Not Loading**
```
Error: Cannot GET /api-docs
Solution: Verify swaggerSetup is called in app.js
```

**4. Token Expired**
```
Error: Token expired
Solution: Generate a new token (tokens expire after 24 hours)
```

### Verification Script

Run the comprehensive test verification:

```bash
node api/scripts/test-swagger-integration.js
```

This script will verify all testing features are working correctly.

### Debug Mode

Enable debug logging for detailed information:

```bash
DEBUG=cypher:* npm run dev
```

## 📚 Additional Resources

### API Documentation
- **Development Guide**: `docs/DEVELOPMENT_GUIDE/API_DEVELOPMENT_GUIDE.md`
- **OpenAPI Spec**: `http://localhost:3001/api-docs.json`
- **Testing Dashboard**: `http://localhost:3001/api-test`

### Testing Scripts
- **Integration Test**: `api/scripts/test-swagger-integration.js`
- **API Test Scripts**: `api/API_TEST_SCRIPTS/`
- **Test Utilities**: `api/src/utils/swaggerTestHelper.js`

### Support
For issues or questions:
1. Check the troubleshooting section above
2. Review the server logs for error details
3. Verify all dependencies are installed
4. Ensure the database connection is working

## 📖 Detailed API Endpoint Examples

### Authentication Endpoints

**Login Example:**
```bash
# Using Swagger UI
POST /api/v1/auth/login
{
  "email": "admin@cypher.com",
  "password": "admin123"
}

# Using cURL
curl -X POST "http://localhost:3001/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cypher.com","password":"admin123"}'
```

### User Management Examples

**Get All Users:**
```bash
# With authentication token
GET /api/v1/users?page=1&limit=10&role=admin

# cURL with token
curl -X GET "http://localhost:3001/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer <your-token>"
```

**Create New User:**
```bash
# Request body from sample data
POST /api/v1/users
{
  "email": "newuser@example.com",
  "username": "newuser",
  "firstName": "New",
  "lastName": "User",
  "password": "securepassword123"
}
```

### System Management Examples

**Get System Metrics:**
```bash
# Real-time vulnerability metrics
GET /api/v1/global-metrics/vulnerability

# Expected response
{
  "success": true,
  "data": {
    "total": 1250,
    "critical": 45,
    "high": 180,
    "medium": 520,
    "low": 505,
    "lastUpdated": "2025-01-16T10:30:00Z"
  }
}
```

### CVE Database Examples

**Search CVEs:**
```bash
# Search for critical CVEs
GET /api/v1/cves?severity=critical&exploitAvailable=true&limit=5

# Advanced search with date range
GET /api/v1/cves?publishedAfter=2024-01-01&severity=high&search=windows
```

## 🛠️ Development Integration

### Using in Development Workflow

**1. Feature Development:**
```bash
# 1. Develop new endpoint
# 2. Add Swagger documentation
# 3. Generate test token
curl "http://localhost:3001/api/v1/test/tokens?role=admin"

# 4. Test in Swagger UI
# 5. Generate cURL for documentation
curl "http://localhost:3001/api/v1/test/curl?endpoint=/api/v1/new-feature"
```

**2. API Documentation:**
```javascript
/**
 * @swagger
 * /api/v1/example:
 *   post:
 *     summary: Example endpoint
 *     tags: [Examples]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Test Example"
 *     responses:
 *       201:
 *         description: Example created successfully
 */
```

**3. Testing Integration:**
```javascript
// In your test files
const SwaggerTestHelper = require('../src/utils/swaggerTestHelper');
const testHelper = new SwaggerTestHelper();

// Generate test token
const token = testHelper.generateTestToken('admin');

// Get sample data
const sampleData = testHelper.getSampleData('/api/v1/users', 'POST');

// Use in tests
const response = await request(app)
  .post('/api/v1/users')
  .set('Authorization', `Bearer ${token}`)
  .send(sampleData);
```

## 🔧 Configuration Options

### Swagger UI Customization

The Swagger UI can be customized in `api/src/config/swagger.js`:

```javascript
const swaggerOptions = {
  // Enable/disable features
  tryItOutEnabled: true,
  persistAuthorization: true,

  // UI customization
  displayRequestDuration: true,
  showRequestHeaders: true,
  showResponseHeaders: true,

  // Validation
  validateRequests: true,
  validateResponses: true,

  // Styling
  syntaxHighlight: {
    activated: true,
    theme: 'agate'
  }
};
```

### Test Helper Configuration

Customize test users and sample data in `SwaggerTestHelper`:

```javascript
// Add custom test users
this.testUsers = {
  admin: { email: 'admin@cypher.com', role: 'admin' },
  custom: { email: 'custom@cypher.com', role: 'custom' }
};

// Add custom sample data
this.sampleData = {
  customEndpoint: {
    name: 'Custom Test Data',
    description: 'Custom endpoint testing'
  }
};
```

## 📊 Testing Metrics and Reporting

### Built-in Metrics

The testing system tracks:
- **Request Duration**: Average response times
- **Success Rate**: Percentage of successful requests
- **Error Patterns**: Common error types and frequencies
- **Authentication Usage**: Token generation and usage patterns

### Custom Reporting

Generate custom test reports:

```bash
# Download comprehensive test report
curl "http://localhost:3001/api/v1/test/report" -o cypher-api-test-report.md

# Get testing health status
curl "http://localhost:3001/api/v1/test/health"
```

### Performance Monitoring

Monitor API performance through:
- Browser developer tools (Network tab)
- Server logs with request timing
- Custom performance tracking in Swagger UI

## 🚀 Production Considerations

### Security Best Practices

**1. Token Management:**
- Use environment-specific secrets
- Implement token rotation
- Monitor token usage patterns

**2. Access Control:**
- Disable testing endpoints in production
- Use role-based access control
- Implement rate limiting

**3. Data Protection:**
- Sanitize sample data
- Avoid exposing sensitive information
- Use HTTPS in production

### Deployment Configuration

**Environment Variables:**
```bash
# Production settings
NODE_ENV=production
JWT_SECRET=your-production-secret
SWAGGER_ENABLED=false  # Disable in production
API_TESTING_ENABLED=false  # Disable testing endpoints
```

**Production Swagger Setup:**
```javascript
// Conditional Swagger setup
if (process.env.NODE_ENV !== 'production') {
  swaggerSetup(app);
  app.use('/api/v1/test', require('./routes/apiTesting'));
}
```

## 📋 Best Practices

### API Testing Best Practices

1. **Always authenticate** before testing protected endpoints
2. **Use appropriate roles** for different test scenarios
3. **Validate response formats** and status codes
4. **Test error conditions** as well as success cases
5. **Document test scenarios** for team members

### Swagger Documentation Best Practices

1. **Include comprehensive examples** in all endpoints
2. **Use consistent response formats** across the API
3. **Document all parameters** and their constraints
4. **Provide clear error descriptions** for all status codes
5. **Keep documentation up-to-date** with code changes

### Development Workflow Best Practices

1. **Test endpoints immediately** after implementation
2. **Generate cURL commands** for documentation
3. **Use sample data consistently** across tests
4. **Validate authentication flows** regularly
5. **Monitor performance metrics** during development

---

**🎉 Happy Testing with CYPHER's Enhanced Swagger Implementation!**

*This comprehensive testing system provides everything you need for efficient API development, testing, and documentation. The interactive Swagger UI, combined with automated token generation and sample data provision, creates a seamless testing experience for developers and stakeholders alike.*
