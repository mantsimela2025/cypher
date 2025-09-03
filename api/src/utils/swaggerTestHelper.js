/**
 * Swagger Test Helper Utility
 * Provides enhanced testing capabilities for Swagger UI
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

class SwaggerTestHelper {
  constructor() {
    this.testUsers = {
      admin: {
        email: 'admin@cypher.com',
        password: 'admin123',
        role: 'admin'
      },
      user: {
        email: 'user@cypher.com', 
        password: 'user123',
        role: 'user'
      },
      analyst: {
        email: 'analyst@cypher.com',
        password: 'analyst123', 
        role: 'analyst'
      }
    };
    
    this.sampleData = {
      user: {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123'
      },
      system: {
        name: 'Test System',
        description: 'Test system for API testing',
        ipAddress: '192.168.1.100',
        operatingSystem: 'Windows Server 2019',
        environment: 'development'
      },
      vulnerability: {
        cveId: 'CVE-2024-1234',
        severity: 'high',
        description: 'Test vulnerability for API testing',
        affectedSystems: ['test-system-1']
      },
      distributionGroup: {
        name: 'Test Group',
        description: 'Test distribution group',
        type: 'security_alerts'
      }
    };
  }

  /**
   * Generate test JWT token for API testing
   */
  generateTestToken(userType = 'admin') {
    const user = this.testUsers[userType];
    if (!user) {
      throw new Error(`Unknown user type: ${userType}`);
    }

    const payload = {
      id: 1,
      email: user.email,
      role: user.role,
      permissions: this.getPermissionsForRole(user.role)
    };

    return jwt.sign(payload, config.JWT_SECRET || 'test-secret', {
      expiresIn: '24h',
      issuer: 'cypher-api'
    });
  }

  /**
   * Get permissions for role
   */
  getPermissionsForRole(role) {
    const permissions = {
      admin: [
        'users:read', 'users:write', 'users:delete',
        'systems:read', 'systems:write', 'systems:delete',
        'vulnerabilities:read', 'vulnerabilities:write',
        'settings:read', 'settings:write',
        'reports:read', 'reports:write'
      ],
      analyst: [
        'users:read',
        'systems:read', 'systems:write',
        'vulnerabilities:read', 'vulnerabilities:write',
        'reports:read', 'reports:write'
      ],
      user: [
        'users:read',
        'systems:read',
        'vulnerabilities:read',
        'reports:read'
      ]
    };

    return permissions[role] || permissions.user;
  }

  /**
   * Get sample request data for endpoint testing
   */
  getSampleData(endpoint, method) {
    const samples = {
      '/api/v1/users': {
        POST: this.sampleData.user,
        PUT: { ...this.sampleData.user, id: 1 }
      },
      '/api/v1/systems': {
        POST: this.sampleData.system,
        PUT: { ...this.sampleData.system, id: 1 }
      },
      '/api/v1/vulnerabilities': {
        POST: this.sampleData.vulnerability,
        PUT: { ...this.sampleData.vulnerability, id: 1 }
      },
      '/api/v1/distribution-groups': {
        POST: this.sampleData.distributionGroup,
        PUT: { ...this.sampleData.distributionGroup, id: 1 }
      }
    };

    return samples[endpoint]?.[method] || {};
  }

  /**
   * Generate test query parameters
   */
  getTestQueryParams(endpoint) {
    const params = {
      '/api/v1/users': {
        page: 1,
        limit: 10,
        search: 'test',
        role: 'user',
        isActive: true
      },
      '/api/v1/systems': {
        page: 1,
        limit: 10,
        environment: 'development',
        operatingSystem: 'Windows',
        search: 'test'
      },
      '/api/v1/vulnerabilities': {
        page: 1,
        limit: 10,
        severity: 'high',
        status: 'open',
        search: 'CVE-2024'
      },
      '/api/v1/cves': {
        page: 1,
        limit: 10,
        severity: 'critical',
        exploitAvailable: true,
        search: '2024'
      }
    };

    return params[endpoint] || { page: 1, limit: 10 };
  }

  /**
   * Get common HTTP headers for testing
   */
  getTestHeaders(includeAuth = true, userType = 'admin') {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Swagger-UI-Testing'
    };

    if (includeAuth) {
      headers['Authorization'] = `Bearer ${this.generateTestToken(userType)}`;
    }

    return headers;
  }

  /**
   * Generate curl command for endpoint testing
   */
  generateCurlCommand(endpoint, method = 'GET', data = null, userType = 'admin') {
    const baseUrl = 'http://localhost:3001';
    const headers = this.getTestHeaders(true, userType);
    
    let curl = `curl -X ${method} "${baseUrl}${endpoint}"`;
    
    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`;
    });
    
    // Add data for POST/PUT requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      curl += ` -d '${JSON.stringify(data)}'`;
    }
    
    return curl;
  }

  /**
   * Get test scenarios for comprehensive endpoint testing
   */
  getTestScenarios() {
    return {
      authentication: [
        {
          name: 'Valid Login',
          endpoint: '/api/v1/auth/login',
          method: 'POST',
          data: { email: 'admin@cypher.com', password: 'admin123' },
          expectedStatus: 200
        },
        {
          name: 'Invalid Login',
          endpoint: '/api/v1/auth/login', 
          method: 'POST',
          data: { email: 'invalid@test.com', password: 'wrong' },
          expectedStatus: 401
        }
      ],
      users: [
        {
          name: 'Get All Users',
          endpoint: '/api/v1/users',
          method: 'GET',
          requiresAuth: true,
          expectedStatus: 200
        },
        {
          name: 'Create User',
          endpoint: '/api/v1/users',
          method: 'POST',
          data: this.sampleData.user,
          requiresAuth: true,
          expectedStatus: 201
        }
      ],
      systems: [
        {
          name: 'Get All Systems',
          endpoint: '/api/v1/systems',
          method: 'GET',
          requiresAuth: true,
          expectedStatus: 200
        },
        {
          name: 'Create System',
          endpoint: '/api/v1/systems',
          method: 'POST',
          data: this.sampleData.system,
          requiresAuth: true,
          expectedStatus: 201
        }
      ],
      vulnerabilities: [
        {
          name: 'Get Vulnerability Metrics',
          endpoint: '/api/v1/global-metrics/vulnerability',
          method: 'GET',
          requiresAuth: true,
          expectedStatus: 200
        },
        {
          name: 'Search CVEs',
          endpoint: '/api/v1/cves',
          method: 'GET',
          queryParams: { severity: 'critical', limit: 5 },
          requiresAuth: true,
          expectedStatus: 200
        }
      ]
    };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const scenarios = this.getTestScenarios();
    let report = '# CYPHER API Test Report\n\n';
    
    Object.entries(scenarios).forEach(([category, tests]) => {
      report += `## ${category.toUpperCase()} Tests\n\n`;
      
      tests.forEach((test, index) => {
        report += `### ${index + 1}. ${test.name}\n`;
        report += `- **Endpoint:** \`${test.method} ${test.endpoint}\`\n`;
        report += `- **Expected Status:** ${test.expectedStatus}\n`;
        report += `- **Requires Auth:** ${test.requiresAuth ? 'Yes' : 'No'}\n`;
        
        if (test.data) {
          report += `- **Sample Data:**\n\`\`\`json\n${JSON.stringify(test.data, null, 2)}\n\`\`\`\n`;
        }
        
        if (test.queryParams) {
          report += `- **Query Parameters:**\n\`\`\`json\n${JSON.stringify(test.queryParams, null, 2)}\n\`\`\`\n`;
        }
        
        report += `- **cURL Command:**\n\`\`\`bash\n${this.generateCurlCommand(test.endpoint, test.method, test.data)}\n\`\`\`\n\n`;
      });
    });
    
    return report;
  }
}

module.exports = SwaggerTestHelper;
