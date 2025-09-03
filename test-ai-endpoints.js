/**
 * AI Endpoints Test Script
 * Tests all new RMF AI endpoints with authentication
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';
let authToken = null;

// Test configuration
const testConfig = {
  // Use existing test user credentials from db-seed.js
  testUser: {
    email: 'admin@rasdash.com',
    password: 'Admin123!'
  },
  testSystem: {
    name: 'E-Commerce Platform',
    description: 'Online e-commerce platform handling customer orders, payment processing, and inventory management. Processes customer PII, payment card data, and business financial information.',
    dataTypes: [
      'Personally Identifiable Information (PII)',
      'Payment Card Information (PCI)',
      'Financial Data',
      'Business Confidential'
    ],
    businessProcesses: [
      'Payment Processing',
      'Order Management',
      'Customer Service',
      'Inventory Management'
    ],
    environment: 'Cloud',
    userBase: 'External customers, internal staff, and third-party vendors'
    // systemId: 1 // Commented out - system doesn't exist in test DB
  }
};

/**
 * Authenticate and get JWT token
 */
async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testConfig.testUser.email,
      password: testConfig.testUser.password
    });

    if (response.data.success && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      console.log('✅ Authentication successful');
      return true;
    } else {
      console.log('❌ Authentication failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Make authenticated API request
 */
async function makeAuthenticatedRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

/**
 * Test AI Health Check
 */
async function testAIHealthCheck() {
  console.log('\n🏥 Testing AI Health Check...');
  
  const result = await makeAuthenticatedRequest('GET', '/rmf/ai/health');
  
  if (result.success) {
    console.log('✅ AI Health Check passed');
    console.log('   Status:', result.data.data.status);
    console.log('   Response:', result.data.data.response);
    return true;
  } else {
    console.log('❌ AI Health Check failed');
    console.log('   Error:', result.error);
    return false;
  }
}

/**
 * Test AI System Categorization
 */
async function testAICategorization() {
  console.log('\n🤖 Testing AI System Categorization...');
  
  const result = await makeAuthenticatedRequest('POST', '/rmf/ai/categorize', testConfig.testSystem);
  
  if (result.success) {
    console.log('✅ AI Categorization passed');
    const categorization = result.data.data.categorization;
    console.log('   Confidentiality:', categorization.confidentiality);
    console.log('   Integrity:', categorization.integrity);
    console.log('   Availability:', categorization.availability);
    console.log('   Overall Impact:', categorization.overall);
    console.log('   Confidence:', categorization.confidence + '%');
    console.log('   Saved to DB:', result.data.data.saved);
    
    // Store for later tests
    testConfig.categorizationResult = categorization;
    return true;
  } else {
    console.log('❌ AI Categorization failed');
    console.log('   Error:', result.error);
    return false;
  }
}

/**
 * Test AI Categorization History
 */
async function testCategorizationHistory() {
  console.log('\n📚 Testing Categorization History...');

  // Use a test system ID that should exist or handle gracefully
  const testSystemId = 999; // Non-existent system for testing

  const result = await makeAuthenticatedRequest('GET', `/rmf/ai/categorization-history/${testSystemId}`);
  
  if (result.success) {
    console.log('✅ Categorization History passed');
    const historyData = result.data.data || [];
    console.log('   History entries:', historyData.length);
    if (historyData.length > 0) {
      console.log('   Latest entry:', historyData[0].overall_impact);
    }
    return true;
  } else {
    console.log('❌ Categorization History failed');
    console.log('   Error:', result.error);
    return false;
  }
}

/**
 * Test AI Statistics
 */
async function testAIStats() {
  console.log('\n📊 Testing AI Statistics...');
  
  const result = await makeAuthenticatedRequest('GET', '/rmf/ai/stats?timeframe=24 hours');
  
  if (result.success) {
    console.log('✅ AI Statistics passed');
    console.log('   Timeframe:', result.data.data.timeframe);
    console.log('   Statistics entries:', result.data.data.statistics.length);
    return true;
  } else {
    console.log('❌ AI Statistics failed');
    console.log('   Error:', result.error);
    return false;
  }
}

/**
 * Test AI Test Endpoint
 */
async function testAITestEndpoint() {
  console.log('\n🧪 Testing AI Test Endpoint...');
  
  const result = await makeAuthenticatedRequest('POST', '/rmf/ai/test');
  
  if (result.success) {
    console.log('✅ AI Test Endpoint passed');
    console.log('   Test result:', result.data.data.result.overall);
    console.log('   Test confidence:', result.data.data.result.confidence + '%');
    return true;
  } else {
    console.log('❌ AI Test Endpoint failed');
    console.log('   Error:', result.error);
    return false;
  }
}

/**
 * Test Input Validation
 */
async function testInputValidation() {
  console.log('\n🛡️ Testing Input Validation...');
  
  // Test with invalid data
  const invalidSystem = {
    name: 'A', // Too short
    description: 'Short', // Too short
    dataTypes: 'not-an-array', // Should be array
    environment: 'InvalidEnv' // Invalid environment
  };
  
  const result = await makeAuthenticatedRequest('POST', '/rmf/ai/categorize', invalidSystem);
  
  if (!result.success && result.status === 400) {
    console.log('✅ Input Validation passed');
    console.log('   Validation errors detected correctly');
    return true;
  } else {
    console.log('❌ Input Validation failed');
    console.log('   Should have rejected invalid input');
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting AI Endpoints Test Suite');
  console.log('=====================================');
  
  // Authenticate first
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  const tests = [
    { name: 'AI Health Check', fn: testAIHealthCheck },
    { name: 'AI System Categorization', fn: testAICategorization },
    { name: 'Categorization History', fn: testCategorizationHistory },
    { name: 'AI Statistics', fn: testAIStats },
    { name: 'AI Test Endpoint', fn: testAITestEndpoint },
    { name: 'Input Validation', fn: testInputValidation }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const success = await test.fn();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! AI endpoints are working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the output above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);
