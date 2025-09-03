#!/usr/bin/env node
/**
 * Comprehensive Core Asset CRUD API Test Suite
 * Tests all core asset endpoints including CRUD operations, bulk operations, and search
 */

const axios = require('axios');
// Note: colors package might not be installed, using basic console styling instead
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  rainbow: (text) => `\x1b[35m${text}\x1b[0m` // Using magenta for rainbow
};

const BASE_URL = 'http://localhost:3001/api/v1';
const ASSETS_URL = `${BASE_URL}/assets`;
let authToken = null;

// Test data
let createdAssetUuids = [];
const testAssetData = {
  hostname: 'test-server-001',
  netbiosName: 'TESTSRV001',
  // systemId: 'SYS-TEST-001', // Commented out - may not exist
  hasAgent: true,
  hasPluginResults: false,
  exposureScore: 250,
  acrScore: 7.5,
  criticalityRating: 'high',
  source: 'manual',
  operatingSystem: 'Windows Server 2019',
  systemType: 'server',
  fqdn: 'test-server-001.company.com',
  ipv4Address: '192.168.1.100',
  macAddress: '00:1B:44:11:3A:B7',
  networkType: 'ethernet'
};

// Test statistics
let testStats = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

function logSection(title) {
  console.log(colors.cyan(`\n${'='.repeat(60)}`));
  console.log(colors.cyan(`🧪 ${title}`));
  console.log(colors.cyan(`${'='.repeat(60)}`));
}

async function testEndpoint(name, method, url, data = null, headers = {}, expectedStatus = 200) {
  try {
    console.log(colors.yellow(`\n🧪 Testing: ${name}`));
    
    let response;
    const config = { headers, timeout: 10000 };
    
    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, data, config);
        break;
      case 'PUT':
        response = await axios.put(url, data, config);
        break;
      case 'DELETE':
        response = await axios.delete(url, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    if (response.status === expectedStatus) {
      console.log(colors.green(`✅ ${name}`));
      console.log(colors.gray(`   Status: ${response.status}, Data: ${JSON.stringify(response.data).substring(0, 100)}...`));
      testStats.passed++;
      return response.data;
    } else {
      console.log(colors.red(`❌ ${name}`));
      console.log(colors.red(`   Expected: ${expectedStatus}, Got: ${response.status}`));
      testStats.failed++;
      testStats.errors.push(`${name}: Expected ${expectedStatus}, got ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(colors.red(`❌ ${name}`));
    console.log(colors.red(`   ${error.response?.status || 'No Status'}: ${error.response?.data?.error || error.message}`));
    testStats.failed++;
    testStats.errors.push(`${name}: ${error.response?.data?.error || error.message}`);
    return null;
  }
}

async function authenticate() {
  try {
    console.log(colors.yellow('🔐 Authenticating...'));
    
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@rasdash.com',
      password: 'Admin123!'
    });
    
    if (authResponse.data.success && authResponse.data.data.accessToken) {
      authToken = authResponse.data.data.accessToken;
      console.log(colors.green('✅ Authentication successful'));
      return {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      };
    } else {
      throw new Error('Invalid auth response format');
    }
  } catch (error) {
    console.log(colors.yellow('⚠️  Authentication failed, proceeding without token'));
    console.log(colors.gray(`   Error: ${error.message}`));
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
}

async function testAssetCRUD(authHeaders) {
  logSection('Core Asset CRUD Operations');
  
  // Test CREATE
  console.log(colors.blue('\n📝 Create Asset Tests'));
  const createResult = await testEndpoint(
    'Create Asset', 
    'POST', 
    ASSETS_URL, 
    testAssetData, 
    authHeaders.headers, 
    201
  );
  
  if (createResult?.data?.assetUuid) {
    createdAssetUuids.push(createResult.data.assetUuid);
    const assetUuid = createResult.data.assetUuid;
    
    // Test READ - Get specific asset
    console.log(colors.blue('\n📖 Read Asset Tests'));
    await testEndpoint(
      'Get Asset by UUID', 
      'GET', 
      `${ASSETS_URL}/${assetUuid}`, 
      null, 
      authHeaders.headers
    );
    
    // Test UPDATE
    console.log(colors.blue('\n✏️  Update Asset Tests'));
    const updateData = {
      hostname: 'test-server-001-updated',
      criticalityRating: 'critical',
      exposureScore: 500
    };
    
    await testEndpoint(
      'Update Asset', 
      'PUT', 
      `${ASSETS_URL}/${assetUuid}`, 
      updateData, 
      authHeaders.headers
    );
    
    // Test DELETE (we'll delete this later in cleanup)
    console.log(colors.blue('\n🗑️  Delete Asset Tests'));
    await testEndpoint(
      'Delete Asset', 
      'DELETE', 
      `${ASSETS_URL}/${assetUuid}`, 
      null, 
      authHeaders.headers
    );
  }
}

async function testAssetListing(authHeaders) {
  logSection('Asset Listing and Filtering');
  
  // Create a few test assets first
  console.log(colors.blue('\n📝 Creating Test Assets for Listing'));
  for (let i = 2; i <= 4; i++) {
    const assetData = {
      ...testAssetData,
      hostname: `test-server-00${i}`,
      netbiosName: `TESTSRV00${i}`,
      ipv4Address: `192.168.1.10${i}`,
      criticalityRating: i % 2 === 0 ? 'high' : 'moderate'
    };
    
    const result = await testEndpoint(
      `Create Test Asset ${i}`, 
      'POST', 
      ASSETS_URL, 
      assetData, 
      authHeaders.headers, 
      201
    );
    
    if (result?.data?.assetUuid) {
      createdAssetUuids.push(result.data.assetUuid);
    }
  }
  
  // Test listing endpoints
  console.log(colors.blue('\n📋 Asset Listing Tests'));
  await testEndpoint('Get All Assets', 'GET', ASSETS_URL, null, authHeaders.headers);
  await testEndpoint('Get Assets with Pagination', 'GET', `${ASSETS_URL}?page=1&limit=5`, null, authHeaders.headers);
  await testEndpoint('Get Assets with Sorting', 'GET', `${ASSETS_URL}?sortBy=hostname&sortOrder=asc`, null, authHeaders.headers);
  await testEndpoint('Filter by Criticality', 'GET', `${ASSETS_URL}?criticalityRating=high`, null, authHeaders.headers);
  await testEndpoint('Filter by Agent Status', 'GET', `${ASSETS_URL}?hasAgent=true`, null, authHeaders.headers);
  await testEndpoint('Search Assets', 'GET', `${ASSETS_URL}/search?search=test-server`, null, authHeaders.headers);
}

async function testBulkOperations(authHeaders) {
  logSection('Bulk Operations');

  if (createdAssetUuids.length < 2) {
    console.log(colors.yellow('⚠️  Skipping bulk operations - not enough test assets'));
    testStats.skipped += 2;
    return;
  }

  // Test bulk update
  console.log(colors.blue('\n🔄 Bulk Update Tests'));
  const bulkUpdateData = {
    assetUuids: createdAssetUuids.slice(0, 2),
    updates: {
      criticalityRating: 'critical',
      hasAgent: false
    }
  };

  await testEndpoint(
    'Bulk Update Assets',
    'POST',
    `${ASSETS_URL}/bulk/update`,
    bulkUpdateData,
    authHeaders.headers
  );

  // Test bulk delete
  console.log(colors.blue('\n🗑️  Bulk Delete Tests'));
  const bulkDeleteData = {
    assetUuids: createdAssetUuids.slice(-2),
    force: false
  };

  await testEndpoint(
    'Bulk Delete Assets',
    'POST',
    `${ASSETS_URL}/bulk/delete`,
    bulkDeleteData,
    authHeaders.headers
  );

  // Remove deleted UUIDs from our tracking
  createdAssetUuids = createdAssetUuids.slice(0, -2);
}

async function testErrorHandling(authHeaders) {
  logSection('Error Handling Tests');

  console.log(colors.blue('\n❌ Error Condition Tests'));

  // Test invalid UUID
  await testEndpoint(
    'Get Asset with Invalid UUID',
    'GET',
    `${ASSETS_URL}/invalid-uuid`,
    null,
    authHeaders.headers,
    400
  );

  // Test non-existent asset
  await testEndpoint(
    'Get Non-existent Asset',
    'GET',
    `${ASSETS_URL}/550e8400-e29b-41d4-a716-446655440000`,
    null,
    authHeaders.headers,
    404
  );

  // Test invalid data
  await testEndpoint(
    'Create Asset with Invalid Data',
    'POST',
    ASSETS_URL,
    { hostname: '' }, // Empty hostname should fail
    authHeaders.headers,
    400
  );

  // Test duplicate hostname
  if (createdAssetUuids.length > 0) {
    await testEndpoint(
      'Create Asset with Duplicate Hostname',
      'POST',
      ASSETS_URL,
      { hostname: 'test-server-002' }, // Should already exist
      authHeaders.headers,
      409
    );
  }

  // Test invalid search
  await testEndpoint(
    'Search with Too Short Query',
    'GET',
    `${ASSETS_URL}/search?search=a`,
    null,
    authHeaders.headers,
    400
  );
}

async function cleanup(authHeaders) {
  logSection('Cleanup');

  console.log(colors.blue('\n🧹 Cleaning up test assets'));

  for (const assetUuid of createdAssetUuids) {
    await testEndpoint(
      `Delete Test Asset ${assetUuid.substring(0, 8)}...`,
      'DELETE',
      `${ASSETS_URL}/${assetUuid}?force=true`,
      null,
      authHeaders.headers
    );
  }

  createdAssetUuids = [];
}

function printSummary() {
  logSection('Test Results Summary');

  const total = testStats.passed + testStats.failed + testStats.skipped;
  const successRate = total > 0 ? ((testStats.passed / total) * 100).toFixed(1) : 0;

  console.log(colors.green(`✅ Passed: ${testStats.passed}`));
  console.log(colors.red(`❌ Failed: ${testStats.failed}`));
  console.log(colors.yellow(`⏭️  Skipped: ${testStats.skipped}`));
  console.log(colors.cyan(`📊 Total: ${total}`));

  if (testStats.errors.length > 0) {
    console.log(colors.red('\n🔍 Error Details:'));
    testStats.errors.forEach((error, index) => {
      console.log(colors.red(`${index + 1}. ${error}`));
    });
  }

  console.log(colors.cyan(`\n🎯 Success Rate: ${successRate}%`));

  if (testStats.failed === 0) {
    console.log(colors.green('\n🎉 All tests passed! Core Asset CRUD API is working perfectly.'));
  } else {
    console.log(colors.yellow('\n⚠️  Some tests failed. Check the error details above.'));
  }
}

async function runTests() {
  console.log(colors.rainbow('🚀 Starting Core Asset CRUD API Tests'));
  console.log(colors.gray(`📅 Test started at: ${new Date().toISOString()}`));

  try {
    const authHeaders = await authenticate();

    await testAssetCRUD(authHeaders);
    await testAssetListing(authHeaders);
    await testBulkOperations(authHeaders);
    await testErrorHandling(authHeaders);
    await cleanup(authHeaders);

  } catch (error) {
    console.error(colors.red('💥 Test suite failed:'), error.message);
    testStats.failed++;
    testStats.errors.push(`Test suite error: ${error.message}`);
  } finally {
    printSummary();
  }
}

// Run if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
