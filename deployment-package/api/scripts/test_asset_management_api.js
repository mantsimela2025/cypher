#!/usr/bin/env node
/**
 * Test Asset Management API
 * Comprehensive testing of all asset management CRUD operations
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/asset-management';
let authToken = null;

// Sample test data
const testAssetUuid = '550e8400-e29b-41d4-a716-446655440000';

const sampleCostRecord = {
  costType: 'purchase',
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
};

const sampleLifecycleRecord = {
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
};

const sampleOperationalCost = {
  yearMonth: '2025-01-01',
  powerCost: 245.50,
  spaceCost: 150.00,
  networkCost: 89.99,
  storageCost: 125.00,
  laborCost: 500.00,
  otherCosts: 25.00,
  notes: 'January 2025 operational costs',
  assetUuid: testAssetUuid
};

async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    // This would typically use your actual auth endpoint
    // For testing, you might need to create a test user or use existing credentials
    const authResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    authToken = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    return {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.log('⚠️  Authentication failed, proceeding without token');
    console.log('   (This is expected if auth is not set up)');
    
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
}

async function testAssetManagementAPI() {
  console.log('🧪 Testing Asset Management API');
  console.log('===============================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: Create Cost Record
    console.log('💰 Test 1: Create Cost Record');
    console.log('------------------------------');
    
    const costResponse = await axios.post(`${BASE_URL}/costs`, sampleCostRecord, authHeaders);
    const createdCost = costResponse.data.data;
    
    console.log(`✅ Cost record created: ID ${createdCost.id}`);
    console.log(`   • Type: ${createdCost.costType}`);
    console.log(`   • Amount: $${createdCost.amount}`);
    console.log(`   • Vendor: ${createdCost.vendor}`);

    // Test 2: Get Cost Records
    console.log('\n💰 Test 2: Get Cost Records');
    console.log('----------------------------');
    
    const costsListResponse = await axios.get(`${BASE_URL}/costs?limit=5`, authHeaders);
    const costsData = costsListResponse.data;
    
    console.log(`✅ Retrieved ${costsData.data.length} cost records`);
    console.log(`   • Total records: ${costsData.pagination.total}`);
    console.log(`   • Page: ${costsData.pagination.page} of ${costsData.pagination.pages}`);

    // Test 3: Get Specific Cost Record
    console.log('\n💰 Test 3: Get Specific Cost Record');
    console.log('------------------------------------');
    
    const specificCostResponse = await axios.get(`${BASE_URL}/costs/${createdCost.id}`, authHeaders);
    const specificCost = specificCostResponse.data.data;
    
    console.log(`✅ Retrieved cost record ${specificCost.id}`);
    console.log(`   • Contract: ${specificCost.contractNumber}`);
    console.log(`   • Cost Center: ${specificCost.costCenter}`);

    // Test 4: Update Cost Record
    console.log('\n💰 Test 4: Update Cost Record');
    console.log('------------------------------');
    
    const updateData = {
      amount: 16000.00,
      notes: 'Updated cost after negotiation'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/costs/${createdCost.id}`, updateData, authHeaders);
    const updatedCost = updateResponse.data.data;
    
    console.log(`✅ Cost record updated`);
    console.log(`   • New amount: $${updatedCost.amount}`);
    console.log(`   • Updated notes: ${updatedCost.notes}`);

    // Test 5: Create Lifecycle Record
    console.log('\n🔄 Test 5: Create Lifecycle Record');
    console.log('-----------------------------------');
    
    const lifecycleResponse = await axios.post(`${BASE_URL}/lifecycle`, sampleLifecycleRecord, authHeaders);
    const createdLifecycle = lifecycleResponse.data.data;
    
    console.log(`✅ Lifecycle record created: ID ${createdLifecycle.id}`);
    console.log(`   • Purchase Date: ${createdLifecycle.purchaseDate}`);
    console.log(`   • Warranty End: ${createdLifecycle.warrantyEndDate}`);
    console.log(`   • Replacement Cycle: ${createdLifecycle.replacementCycleMonths} months`);

    // Test 6: Get Lifecycle Records
    console.log('\n🔄 Test 6: Get Lifecycle Records');
    console.log('---------------------------------');
    
    const lifecycleListResponse = await axios.get(`${BASE_URL}/lifecycle?limit=5`, authHeaders);
    const lifecycleData = lifecycleListResponse.data;
    
    console.log(`✅ Retrieved ${lifecycleData.data.length} lifecycle records`);
    lifecycleData.data.forEach((record, i) => {
      console.log(`   ${i+1}. Asset: ${record.assetHostname || 'Unknown'} (${record.assetUuid})`);
      console.log(`      • Warranty expires: ${record.warrantyEndDate || 'Not set'}`);
      console.log(`      • Days until warranty expiry: ${record.daysUntilWarrantyExpiry || 'N/A'}`);
    });

    // Test 7: Create Operational Cost
    console.log('\n💡 Test 7: Create Operational Cost');
    console.log('-----------------------------------');
    
    const opCostResponse = await axios.post(`${BASE_URL}/operational-costs`, sampleOperationalCost, authHeaders);
    const createdOpCost = opCostResponse.data.data;
    
    console.log(`✅ Operational cost record created: ID ${createdOpCost.id}`);
    console.log(`   • Month: ${createdOpCost.yearMonth}`);
    console.log(`   • Power Cost: $${createdOpCost.powerCost}`);
    console.log(`   • Space Cost: $${createdOpCost.spaceCost}`);

    // Test 8: Get Operational Costs
    console.log('\n💡 Test 8: Get Operational Costs');
    console.log('---------------------------------');
    
    const opCostsListResponse = await axios.get(`${BASE_URL}/operational-costs?limit=5`, authHeaders);
    const opCostsData = opCostsListResponse.data;
    
    console.log(`✅ Retrieved ${opCostsData.data.length} operational cost records`);
    opCostsData.data.forEach((record, i) => {
      console.log(`   ${i+1}. ${record.yearMonth}: Total $${record.totalCost || 'N/A'}`);
      console.log(`      • Power: $${record.powerCost || 0}, Space: $${record.spaceCost || 0}`);
    });

    // Test 9: Cost Analytics
    console.log('\n📊 Test 9: Cost Analytics');
    console.log('--------------------------');
    
    const analyticsResponse = await axios.get(`${BASE_URL}/analytics/costs/${testAssetUuid}`, authHeaders);
    const analyticsData = analyticsResponse.data.data;
    
    console.log(`✅ Cost analytics retrieved`);
    console.log(`   • Total costs: $${analyticsData.summary.totalCosts}`);
    console.log(`   • Total records: ${analyticsData.summary.totalRecords}`);
    console.log('   • Cost breakdown by type:');
    analyticsData.costByType.forEach(item => {
      console.log(`     • ${item.costType}: $${item.totalAmount} (${item.count} records)`);
    });

    // Test 10: Filtering and Search
    console.log('\n🔍 Test 10: Filtering and Search');
    console.log('---------------------------------');
    
    // Filter by cost type
    const filteredResponse = await axios.get(`${BASE_URL}/costs?costType=purchase&vendor=Dell`, authHeaders);
    const filteredData = filteredResponse.data;
    
    console.log(`✅ Filtered results: ${filteredData.data.length} purchase records from Dell`);
    
    // Filter lifecycle by warranty expiring
    const warrantyResponse = await axios.get(`${BASE_URL}/lifecycle?warrantyExpiring=true`, authHeaders);
    const warrantyData = warrantyResponse.data;
    
    console.log(`✅ Assets with expiring warranties: ${warrantyData.data.length}`);

    // Test 11: Cleanup (Delete Records)
    console.log('\n🗑️  Test 11: Cleanup');
    console.log('--------------------');
    
    // Delete cost record
    await axios.delete(`${BASE_URL}/costs/${createdCost.id}`, authHeaders);
    console.log(`✅ Deleted cost record ${createdCost.id}`);
    
    // Delete lifecycle record
    await axios.delete(`${BASE_URL}/lifecycle/${createdLifecycle.id}`, authHeaders);
    console.log(`✅ Deleted lifecycle record ${createdLifecycle.id}`);
    
    // Delete operational cost record
    await axios.delete(`${BASE_URL}/operational-costs/${createdOpCost.id}`, authHeaders);
    console.log(`✅ Deleted operational cost record ${createdOpCost.id}`);

    console.log('\n🎉 All Asset Management API tests completed successfully!');
    
    console.log('\n📋 Available Endpoints:');
    console.log('   💰 Cost Management:');
    console.log('      • POST   /api/v1/asset-management/costs');
    console.log('      • GET    /api/v1/asset-management/costs');
    console.log('      • GET    /api/v1/asset-management/costs/:id');
    console.log('      • PUT    /api/v1/asset-management/costs/:id');
    console.log('      • DELETE /api/v1/asset-management/costs/:id');
    
    console.log('   🔄 Lifecycle Management:');
    console.log('      • POST   /api/v1/asset-management/lifecycle');
    console.log('      • GET    /api/v1/asset-management/lifecycle');
    console.log('      • GET    /api/v1/asset-management/lifecycle/:id');
    console.log('      • PUT    /api/v1/asset-management/lifecycle/:id');
    console.log('      • DELETE /api/v1/asset-management/lifecycle/:id');
    
    console.log('   💡 Operational Costs:');
    console.log('      • POST   /api/v1/asset-management/operational-costs');
    console.log('      • GET    /api/v1/asset-management/operational-costs');
    console.log('      • GET    /api/v1/asset-management/operational-costs/:id');
    console.log('      • PUT    /api/v1/asset-management/operational-costs/:id');
    console.log('      • DELETE /api/v1/asset-management/operational-costs/:id');
    
    console.log('   📊 Analytics:');
    console.log('      • GET    /api/v1/asset-management/analytics/costs/:assetUuid');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ API server not running. Please start it first:');
      console.error('   npm run dev');
    } else if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data?.error || error.message}`);
      if (error.response.data?.details) {
        console.error('   Details:', error.response.data.details);
      }
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAssetManagementAPI().catch(console.error);
}

module.exports = { testAssetManagementAPI };
