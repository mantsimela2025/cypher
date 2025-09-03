#!/usr/bin/env node
/**
 * Comprehensive Asset Management API Test Suite
 * Tests all asset management related endpoints including:
 * - Asset Management (costs, lifecycle, operational costs, risk mapping)
 * - Asset Details (complete, basic, network, vulnerabilities, cost summary, tags)
 * - Asset Tags (CRUD operations, search, bulk operations)
 * - Asset Analytics (ROI, depreciation, financial analysis, dashboard)
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
  rainbow: (text) => `\x1b[35m${text}\x1b[0m`
};

// Configuration
const BASE_URL = 'http://localhost:3001/api/v1';
const ASSET_MGMT_URL = `${BASE_URL}/asset-management`;
const ASSET_TAGS_URL = `${BASE_URL}/asset-tags`;
const ASSET_ANALYTICS_URL = `${BASE_URL}/asset-analytics`;

let authToken = null;
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Test data - will be populated with real asset UUIDs
let testAssetUuid = '550e8400-e29b-41d4-a716-446655440000';
let testAssetUuid2 = '550e8400-e29b-41d4-a716-446655440001';
let realAssetUuids = [];

// Sample data functions that use current testAssetUuid
const getSampleCostRecord = () => ({
  costType: 'acquisition', // Fixed: changed from 'purchase' to 'acquisition'
  amount: 15000.00,
  currency: 'USD',
  billingCycle: 'one_time',
  vendor: 'Dell Technologies',
  contractNumber: 'DELL-2025-001',
  purchaseOrder: 'PO-2025-0123',
  costCenter: 'IT-INFRASTRUCTURE',
  budgetCode: 'CAPEX-2025-Q1',
  notes: 'Server purchase for data center expansion',
  assetUuid: testAssetUuid
});

const getSampleLifecycleRecord = () => ({
  purchaseDate: '2025-01-15',
  warrantyEndDate: '2028-01-15',
  manufacturerEolDate: '2030-01-15',
  internalEolDate: '2029-06-30',
  replacementCycleMonths: 48,
  estimatedReplacementCost: 18000.00,
  replacementBudgetYear: 2029,
  replacementBudgetQuarter: 2,
  replacementNotes: 'Consider cloud migration before replacement',
  assetUuid: testAssetUuid
});

const getSampleOperationalCost = () => ({
  yearMonth: '2025-01-01',
  powerCost: 245.50,
  spaceCost: 150.00,
  networkCost: 89.99,
  storageCost: 125.00,
  laborCost: 500.00,
  otherCosts: 25.00,
  notes: 'January 2025 operational costs',
  assetUuid: testAssetUuid
});

const getSampleRiskMapping = () => ({
  assetUuid: testAssetUuid,
  existingAssetId: 1,
  riskModelId: 1,
  costCenterId: 1,
  mappingConfidence: 0.95,
  mappingMethod: 'manual',
  mappingCriteria: {
    criteria: ['location', 'criticality', 'cost'],
    scores: [0.9, 0.95, 0.8],
    weights: [0.3, 0.5, 0.2],
    threshold: 0.85
  }
});

const getSampleAssetTag = () => ({
  tagKey: 'environment',
  tagValue: 'production'
});

// Utility functions
function logTest(testName, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  const statusColor = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;

  console.log(statusColor(`${statusIcon} ${testName}`));
  if (details) {
    console.log(colors.gray(`   ${details}`));
  }

  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.skipped++;
}

function logSection(sectionName) {
  console.log(colors.cyan(`\n${'='.repeat(60)}`));
  console.log(colors.cyan(colors.bold(`🧪 ${sectionName}`)));
  console.log(colors.cyan(`${'='.repeat(60)}`));
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

async function fetchRealAssetUuids(authHeaders) {
  try {
    console.log(colors.yellow('🔍 Fetching real asset UUIDs for testing...'));

    const response = await axios.get(`${ASSET_MGMT_URL}/assets?limit=10`, authHeaders);

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Try different possible field names for asset UUID
      realAssetUuids = response.data.data.map(asset =>
        asset.assetUuid || asset.asset_uuid || asset.uuid
      ).filter(uuid => uuid);

      if (realAssetUuids.length >= 2) {
        testAssetUuid = realAssetUuids[0];
        testAssetUuid2 = realAssetUuids[1];
        console.log(colors.green(`✅ Using real asset UUIDs: ${testAssetUuid.substring(0, 8)}..., ${testAssetUuid2.substring(0, 8)}...`));
      } else if (realAssetUuids.length >= 1) {
        testAssetUuid = realAssetUuids[0];
        testAssetUuid2 = realAssetUuids[0]; // Use same UUID for both
        console.log(colors.green(`✅ Using real asset UUID: ${testAssetUuid.substring(0, 8)}... (same for both tests)`));
      } else {
        console.log(colors.yellow('⚠️  Found assets but no valid UUIDs, using default UUIDs'));
        console.log(colors.gray(`   Sample asset: ${JSON.stringify(response.data.data[0])}`));
      }
    } else {
      console.log(colors.yellow('⚠️  No assets found, using default UUIDs'));
    }
  } catch (error) {
    console.log(colors.yellow('⚠️  Failed to fetch real asset UUIDs, using defaults'));
    console.log(colors.gray(`   Error: ${error.message}`));
  }
}

async function testEndpoint(testName, method, url, data = null, headers = {}, expectedStatus = 200) {
  try {
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
      logTest(testName, 'PASS', `Status: ${response.status}, Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
      return response.data;
    } else {
      logTest(testName, 'FAIL', `Expected status ${expectedStatus}, got ${response.status}`);
      testResults.errors.push(`${testName}: Status mismatch`);
      return null;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logTest(testName, 'FAIL', 'API server not running');
      testResults.errors.push(`${testName}: Server not running`);
    } else if (error.response) {
      logTest(testName, 'FAIL', `${error.response.status}: ${error.response.data?.message || error.message}`);
      testResults.errors.push(`${testName}: ${error.response.status} - ${error.response.data?.message || error.message}`);
    } else {
      logTest(testName, 'FAIL', error.message);
      testResults.errors.push(`${testName}: ${error.message}`);
    }
    return null;
  }
}

// Test suites
async function testAssetManagementCRUD(authHeaders) {
  logSection('Asset Management CRUD Operations');
  
  // Test Cost Management
  console.log(colors.blue('\n💰 Cost Management Tests'));
  const costData = await testEndpoint('Create Cost Record', 'POST', `${ASSET_MGMT_URL}/costs`, getSampleCostRecord(), authHeaders.headers, 201);

  if (costData?.data?.id) {
    const costId = costData.data.id;
    await testEndpoint('Get Cost Records', 'GET', `${ASSET_MGMT_URL}/costs?limit=5`, null, authHeaders.headers);
    await testEndpoint('Get Specific Cost Record', 'GET', `${ASSET_MGMT_URL}/costs/${costId}`, null, authHeaders.headers);
    await testEndpoint('Update Cost Record', 'PUT', `${ASSET_MGMT_URL}/costs/${costId}`, { amount: 16000.00 }, authHeaders.headers);
    await testEndpoint('Delete Cost Record', 'DELETE', `${ASSET_MGMT_URL}/costs/${costId}`, null, authHeaders.headers);
  }

  // Test Lifecycle Management
  console.log(colors.blue('\n🔄 Lifecycle Management Tests'));
  const lifecycleData = await testEndpoint('Create Lifecycle Record', 'POST', `${ASSET_MGMT_URL}/lifecycle`, getSampleLifecycleRecord(), authHeaders.headers, 201);

  if (lifecycleData?.data?.id) {
    const lifecycleId = lifecycleData.data.id;
    await testEndpoint('Get Lifecycle Records', 'GET', `${ASSET_MGMT_URL}/lifecycle?limit=5`, null, authHeaders.headers);
    await testEndpoint('Get Specific Lifecycle Record', 'GET', `${ASSET_MGMT_URL}/lifecycle/${lifecycleId}`, null, authHeaders.headers);
    await testEndpoint('Update Lifecycle Record', 'PUT', `${ASSET_MGMT_URL}/lifecycle/${lifecycleId}`, { replacementCycleMonths: 60 }, authHeaders.headers);
    await testEndpoint('Delete Lifecycle Record', 'DELETE', `${ASSET_MGMT_URL}/lifecycle/${lifecycleId}`, null, authHeaders.headers);
  }

  // Test Operational Costs
  console.log(colors.blue('\n💡 Operational Costs Tests'));
  const opCostData = await testEndpoint('Create Operational Cost', 'POST', `${ASSET_MGMT_URL}/operational-costs`, getSampleOperationalCost(), authHeaders.headers, 201);

  if (opCostData?.data?.id) {
    const opCostId = opCostData.data.id;
    await testEndpoint('Get Operational Costs', 'GET', `${ASSET_MGMT_URL}/operational-costs?limit=5`, null, authHeaders.headers);
    await testEndpoint('Get Specific Operational Cost', 'GET', `${ASSET_MGMT_URL}/operational-costs/${opCostId}`, null, authHeaders.headers);
    await testEndpoint('Update Operational Cost', 'PUT', `${ASSET_MGMT_URL}/operational-costs/${opCostId}`, { powerCost: 300.00 }, authHeaders.headers);
    await testEndpoint('Delete Operational Cost', 'DELETE', `${ASSET_MGMT_URL}/operational-costs/${opCostId}`, null, authHeaders.headers);
  }

  // Test Risk Mapping
  console.log(colors.blue('\n⚠️  Risk Mapping Tests'));
  const riskData = await testEndpoint('Create Risk Mapping', 'POST', `${ASSET_MGMT_URL}/risk-mapping`, getSampleRiskMapping(), authHeaders.headers, 201);

  if (riskData?.data?.id) {
    const riskId = riskData.data.id;
    await testEndpoint('Get Risk Mappings', 'GET', `${ASSET_MGMT_URL}/risk-mapping?limit=5`, null, authHeaders.headers);
    await testEndpoint('Get Specific Risk Mapping', 'GET', `${ASSET_MGMT_URL}/risk-mapping/${riskId}`, null, authHeaders.headers);
    await testEndpoint('Update Risk Mapping', 'PUT', `${ASSET_MGMT_URL}/risk-mapping/${riskId}`, { mappingConfidence: 0.90 }, authHeaders.headers);
    await testEndpoint('Delete Risk Mapping', 'DELETE', `${ASSET_MGMT_URL}/risk-mapping/${riskId}`, null, authHeaders.headers);
  }
}

async function testAssetDetails(authHeaders) {
  logSection('Asset Details Endpoints');
  
  await testEndpoint('Get Assets with Details', 'GET', `${ASSET_MGMT_URL}/assets?limit=5`, null, authHeaders.headers);
  await testEndpoint('Get Asset Complete Detail', 'GET', `${ASSET_MGMT_URL}/assets/${testAssetUuid}/complete-detail`, null, authHeaders.headers);
  await testEndpoint('Get Asset Basic Detail', 'GET', `${ASSET_MGMT_URL}/assets/${testAssetUuid}/basic-detail`, null, authHeaders.headers);
  await testEndpoint('Get Asset Network Detail', 'GET', `${ASSET_MGMT_URL}/assets/${testAssetUuid}/network-detail`, null, authHeaders.headers);
  await testEndpoint('Get Asset Vulnerabilities Summary', 'GET', `${ASSET_MGMT_URL}/assets/${testAssetUuid}/vulnerabilities-summary`, null, authHeaders.headers);
  await testEndpoint('Get Asset Cost Summary', 'GET', `${ASSET_MGMT_URL}/assets/${testAssetUuid}/cost-summary`, null, authHeaders.headers);
  await testEndpoint('Get Asset Tags Detail', 'GET', `${ASSET_MGMT_URL}/assets/${testAssetUuid}/tags-detail`, null, authHeaders.headers);
}

async function testAssetTags(authHeaders) {
  logSection('Asset Tags Management');
  
  // Basic tag operations
  await testEndpoint('Get Tag Keys', 'GET', `${ASSET_TAGS_URL}/keys`, null, authHeaders.headers);
  await testEndpoint('Get Tag Statistics', 'GET', `${ASSET_TAGS_URL}/statistics`, null, authHeaders.headers);
  await testEndpoint('Get Asset Tags', 'GET', `${ASSET_TAGS_URL}/${testAssetUuid}`, null, authHeaders.headers);
  
  // Tag CRUD operations
  const sampleTag = getSampleAssetTag();
  await testEndpoint('Add Asset Tag', 'POST', `${ASSET_TAGS_URL}/${testAssetUuid}`, sampleTag, authHeaders.headers, 201);
  await testEndpoint('Get Tag Values for Key', 'GET', `${ASSET_TAGS_URL}/keys/${sampleTag.tagKey}/values`, null, authHeaders.headers);

  // Bulk operations
  const bulkTags = [
    { tagKey: 'department', tagValue: 'IT' },
    { tagKey: 'criticality', tagValue: 'high' }
  ];
  await testEndpoint('Bulk Add Tags', 'POST', `${ASSET_TAGS_URL}/${testAssetUuid}/bulk`, { tags: bulkTags }, authHeaders.headers, 201);
  
  // Search operations
  const searchQuery = {
    tags: [{ key: 'environment', value: 'production' }],
    matchType: 'any'
  };
  await testEndpoint('Search Assets by Tags', 'POST', `${ASSET_TAGS_URL}/search`, searchQuery, authHeaders.headers);
  
  // Multiple assets tags
  const multipleAssetsQuery = {
    assetUuids: [testAssetUuid, testAssetUuid2]
  };
  await testEndpoint('Get Multiple Asset Tags', 'POST', `${ASSET_TAGS_URL}/multiple`, multipleAssetsQuery, authHeaders.headers);
}

async function testAssetAnalytics(authHeaders) {
  logSection('Asset Analytics');
  
  // Individual asset analytics
  await testEndpoint('Calculate Asset ROI', 'GET', `${ASSET_ANALYTICS_URL}/roi/${testAssetUuid}`, null, authHeaders.headers);
  await testEndpoint('Calculate Asset Depreciation', 'GET', `${ASSET_ANALYTICS_URL}/depreciation/${testAssetUuid}`, null, authHeaders.headers);
  await testEndpoint('Generate Financial Analysis', 'GET', `${ASSET_ANALYTICS_URL}/financial-analysis/${testAssetUuid}`, null, authHeaders.headers);
  
  // Dashboard and portfolio analytics
  await testEndpoint('Get Analytics Dashboard', 'GET', `${ASSET_ANALYTICS_URL}/dashboard`, null, authHeaders.headers);
  await testEndpoint('Get Portfolio Summary', 'GET', `${ASSET_ANALYTICS_URL}/portfolio-summary`, null, authHeaders.headers);
}

// Main test runner
async function runComprehensiveTests() {
  console.log(colors.rainbow(colors.bold('🚀 Starting Comprehensive Asset Management API Tests')));
  console.log(colors.gray(`📅 Test started at: ${new Date().toISOString()}`));

  try {
    const authHeaders = await authenticate();

    // Fetch real asset UUIDs for more realistic testing
    await fetchRealAssetUuids(authHeaders);

    await testAssetManagementCRUD(authHeaders);
    await testAssetDetails(authHeaders);
    await testAssetTags(authHeaders);
    await testAssetAnalytics(authHeaders);

    // Print summary
    logSection('Test Results Summary');
    console.log(colors.green(`✅ Passed: ${testResults.passed}`));
    console.log(colors.red(`❌ Failed: ${testResults.failed}`));
    console.log(colors.yellow(`⏭️  Skipped: ${testResults.skipped}`));
    console.log(colors.blue(`📊 Total: ${testResults.passed + testResults.failed + testResults.skipped}`));

    if (testResults.errors.length > 0) {
      console.log(colors.red(colors.bold('\n🔍 Error Details:')));
      testResults.errors.forEach((error, index) => {
        console.log(colors.red(`${index + 1}. ${error}`));
      });
    }

    const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
    console.log(colors.cyan(colors.bold(`\n🎯 Success Rate: ${successRate}%`)));

    if (testResults.failed === 0) {
      console.log(colors.green(colors.bold('\n🎉 All tests completed successfully!')));
    } else {
      console.log(colors.yellow(colors.bold('\n⚠️  Some tests failed. Check the error details above.')));
    }

  } catch (error) {
    console.error(colors.red(colors.bold('💥 Test suite failed to run:')), error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests };
