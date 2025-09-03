#!/usr/bin/env node
/**
 * Debug Asset Management Endpoints
 * Simple script to test individual endpoints and see detailed error messages
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = null;

async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@rasdash.com',
      password: 'Admin123!'
    });
    
    if (authResponse.data.success && authResponse.data.data.accessToken) {
      authToken = authResponse.data.data.accessToken;
      console.log('✅ Authentication successful');
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
    console.log('⚠️  Authentication failed:', error.message);
    return null;
  }
}

async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${url}`);
    
    let response;
    const config = { headers, timeout: 10000 };
    
    switch (method.toUpperCase()) {
      case 'GET':
        response = await axios.get(url, config);
        break;
      case 'POST':
        response = await axios.post(url, data, config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    console.log(`✅ Success: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
    
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status || 'No Status'}`);
    console.log(`   Error: ${error.response?.data?.error || error.message}`);
    if (error.response?.data?.details) {
      console.log(`   Details: ${JSON.stringify(error.response.data.details)}`);
    }
    if (error.response?.data) {
      console.log(`   Full Response: ${JSON.stringify(error.response.data)}`);
    }
  }
}

async function debugAssetEndpoints() {
  console.log('🔍 Debug Asset Management Endpoints');
  console.log('=====================================');
  
  const authHeaders = await authenticate();
  if (!authHeaders) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Get a real asset UUID first
  console.log('\n📋 Step 1: Get real asset UUIDs');
  let realAssetUuid = null;
  
  try {
    const assetsResponse = await axios.get(`${BASE_URL}/asset-management/assets?limit=1`, authHeaders);
    console.log('📊 Assets Response:', JSON.stringify(assetsResponse.data, null, 2));

    if (assetsResponse.data?.data?.length > 0) {
      const asset = assetsResponse.data.data[0];
      console.log('📊 First Asset Object:', JSON.stringify(asset, null, 2));

      // Try different possible field names
      realAssetUuid = asset.assetUuid || asset.asset_uuid || asset.uuid || asset.id;
      console.log(`✅ Found real asset UUID: ${realAssetUuid}`);
    } else {
      console.log('⚠️  No assets found, using fake UUID');
      realAssetUuid = '550e8400-e29b-41d4-a716-446655440000';
    }
  } catch (error) {
    console.log('❌ Failed to get assets:', error.message);
    realAssetUuid = '550e8400-e29b-41d4-a716-446655440000';
  }
  
  console.log('\n📋 Step 2: Test Asset Detail Endpoints');
  
  // Test asset detail endpoints
  await testEndpoint(
    'Asset Complete Detail', 
    'GET', 
    `${BASE_URL}/asset-management/assets/${realAssetUuid}/complete-detail`, 
    null, 
    authHeaders.headers
  );
  
  await testEndpoint(
    'Asset Basic Detail', 
    'GET', 
    `${BASE_URL}/asset-management/assets/${realAssetUuid}/basic-detail`, 
    null, 
    authHeaders.headers
  );
  
  await testEndpoint(
    'Asset Network Detail', 
    'GET', 
    `${BASE_URL}/asset-management/assets/${realAssetUuid}/network-detail`, 
    null, 
    authHeaders.headers
  );
  
  console.log('\n📋 Step 3: Test Cost Management');
  
  // Test cost creation with real asset UUID
  const costData = {
    costType: 'acquisition',
    amount: 1000.00,
    currency: 'USD',
    billingCycle: 'one_time',
    vendor: 'Test Vendor',
    notes: 'Debug test cost record',
    assetUuid: realAssetUuid
  };
  
  await testEndpoint(
    'Create Cost Record', 
    'POST', 
    `${BASE_URL}/asset-management/costs`, 
    costData, 
    authHeaders.headers
  );
  
  console.log('\n📋 Step 4: Test Asset Tags');
  
  // Test asset tag creation
  const tagData = {
    tagKey: 'debug_test',
    tagValue: 'test_value'
  };
  
  await testEndpoint(
    'Add Asset Tag', 
    'POST', 
    `${BASE_URL}/asset-tags/${realAssetUuid}`, 
    tagData, 
    authHeaders.headers
  );
  
  console.log('\n🎯 Debug Complete');
}

// Run if executed directly
if (require.main === module) {
  debugAssetEndpoints().catch(console.error);
}

module.exports = { debugAssetEndpoints };
