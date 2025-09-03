#!/usr/bin/env node

/**
 * Test Swagger Integration and API Testing Features
 * Verifies that all new testing features are working correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSwaggerEndpoints() {
  colorLog('\n🧪 Testing Swagger Integration & API Testing Features', 'cyan');
  colorLog('=' .repeat(60), 'cyan');

  const tests = [
    {
      name: 'Swagger UI Accessibility',
      url: `${BASE_URL}/api-docs`,
      method: 'GET',
      expectHtml: true
    },
    {
      name: 'OpenAPI JSON Specification',
      url: `${BASE_URL}/api-docs.json`,
      method: 'GET',
      expectJson: true
    },
    {
      name: 'API Testing Dashboard',
      url: `${BASE_URL}/api-test`,
      method: 'GET',
      expectHtml: true
    },
    {
      name: 'Custom Swagger JavaScript',
      url: `${BASE_URL}/swagger-custom.js`,
      method: 'GET',
      expectJs: true
    },
    {
      name: 'Test Token Generation',
      url: `${BASE_URL}/api/v1/test/tokens?role=admin`,
      method: 'GET',
      expectJson: true
    },
    {
      name: 'Sample Data Retrieval',
      url: `${BASE_URL}/api/v1/test/sample-data?endpoint=/api/v1/users&method=POST`,
      method: 'GET',
      expectJson: true
    },
    {
      name: 'Test Scenarios',
      url: `${BASE_URL}/api/v1/test/scenarios`,
      method: 'GET',
      expectJson: true
    },
    {
      name: 'cURL Command Generation',
      url: `${BASE_URL}/api/v1/test/curl?endpoint=/api/v1/users&method=GET&role=admin`,
      method: 'GET',
      expectJson: true
    },
    {
      name: 'Testing Health Check',
      url: `${BASE_URL}/api/v1/test/health`,
      method: 'GET',
      expectJson: true
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      colorLog(`\n📝 Testing: ${test.name}`, 'yellow');
      
      const response = await axios.get(test.url, {
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });

      if (response.status === 200) {
        // Validate response content type
        const contentType = response.headers['content-type'] || '';
        
        if (test.expectJson && contentType.includes('application/json')) {
          colorLog(`   ✅ JSON response received`, 'green');
          if (response.data.success !== undefined) {
            colorLog(`   ✅ API response format valid`, 'green');
          }
        } else if (test.expectHtml && contentType.includes('text/html')) {
          colorLog(`   ✅ HTML response received`, 'green');
        } else if (test.expectJs && contentType.includes('application/javascript')) {
          colorLog(`   ✅ JavaScript response received`, 'green');
        } else {
          colorLog(`   ✅ Response received (${contentType})`, 'green');
        }
        
        passedTests++;
      } else {
        colorLog(`   ⚠️  Unexpected status: ${response.status}`, 'yellow');
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        colorLog(`   ❌ Server not running on ${BASE_URL}`, 'red');
        colorLog(`   💡 Start the server with: npm run dev`, 'blue');
      } else if (error.response) {
        colorLog(`   ❌ HTTP ${error.response.status}: ${error.response.statusText}`, 'red');
      } else {
        colorLog(`   ❌ Error: ${error.message}`, 'red');
      }
    }
  }

  // Summary
  colorLog('\n📊 Test Summary', 'cyan');
  colorLog('=' .repeat(30), 'cyan');
  colorLog(`✅ Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    colorLog('\n🎉 All Swagger integration tests passed!', 'green');
    colorLog('\n📋 Available Testing Features:', 'cyan');
    colorLog('   🔧 Interactive Swagger UI: http://localhost:3001/api-docs', 'blue');
    colorLog('   🧪 API Testing Dashboard: http://localhost:3001/api-test', 'blue');
    colorLog('   🔑 Token Generation: GET /api/v1/test/tokens', 'blue');
    colorLog('   📝 Sample Data: GET /api/v1/test/sample-data', 'blue');
    colorLog('   📋 Test Scenarios: GET /api/v1/test/scenarios', 'blue');
    colorLog('   💻 cURL Commands: GET /api/v1/test/curl', 'blue');
    colorLog('   📄 Test Report: GET /api/v1/test/report', 'blue');
    
    colorLog('\n💡 How to Use:', 'cyan');
    colorLog('   1. Visit http://localhost:3001/api-docs for interactive testing', 'blue');
    colorLog('   2. Click "Authorize" and use a token from /api/v1/test/tokens', 'blue');
    colorLog('   3. Use "Try it out" on any endpoint to test it', 'blue');
    colorLog('   4. Check /api-test for additional testing tools', 'blue');
    
  } else {
    colorLog('\n⚠️  Some tests failed. Check the server status and try again.', 'yellow');
  }
}

async function demonstrateTokenGeneration() {
  colorLog('\n🔑 Demonstrating Token Generation', 'cyan');
  colorLog('=' .repeat(40), 'cyan');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/test/tokens?role=admin`);
    
    if (response.data.success) {
      const { token, role, permissions } = response.data.data;
      
      colorLog(`\n✅ Generated ${role} token:`, 'green');
      colorLog(`   Token: ${token.substring(0, 50)}...`, 'blue');
      colorLog(`   Role: ${role}`, 'blue');
      colorLog(`   Permissions: ${permissions.length} permissions`, 'blue');
      colorLog(`   Usage: Authorization: Bearer ${token}`, 'blue');
      
      colorLog('\n💡 Copy this token and use it in Swagger UI:', 'cyan');
      colorLog(`   1. Go to http://localhost:3001/api-docs`, 'blue');
      colorLog(`   2. Click the "Authorize" button`, 'blue');
      colorLog(`   3. Paste the token in the "Value" field`, 'blue');
      colorLog(`   4. Click "Authorize" and "Close"`, 'blue');
      colorLog(`   5. Now you can test protected endpoints!`, 'blue');
      
    } else {
      colorLog('❌ Failed to generate token', 'red');
    }
    
  } catch (error) {
    colorLog(`❌ Error generating token: ${error.message}`, 'red');
  }
}

async function main() {
  colorLog('🚀 CYPHER API Testing Integration Verification', 'cyan');
  colorLog('=' .repeat(50), 'cyan');
  
  await testSwaggerEndpoints();
  await demonstrateTokenGeneration();
  
  colorLog('\n🎯 Next Steps:', 'cyan');
  colorLog('   1. Start your API server: npm run dev', 'blue');
  colorLog('   2. Visit http://localhost:3001/api-docs', 'blue');
  colorLog('   3. Generate a test token from /api/v1/test/tokens', 'blue');
  colorLog('   4. Use the token to test protected endpoints', 'blue');
  colorLog('   5. Explore the API Testing Dashboard at /api-test', 'blue');
  
  colorLog('\n✨ Happy Testing!', 'green');
}

// Run the tests
main().catch(error => {
  colorLog(`\n❌ Test execution failed: ${error.message}`, 'red');
  process.exit(1);
});
