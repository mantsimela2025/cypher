#!/usr/bin/env node
/**
 * Debug Operational Costs Endpoint
 * Test the specific operational costs list endpoint that's failing
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

async function testOperationalCosts() {
  console.log('🔍 Debug Operational Costs Endpoint');
  console.log('====================================');
  
  const authHeaders = await authenticate();
  if (!authHeaders) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test 1: Basic operational costs list
  console.log('\n📋 Test 1: Basic Operational Costs List');
  try {
    const response = await axios.get(`${BASE_URL}/asset-management/operational-costs`, authHeaders);
    console.log('✅ Success:', response.status);
    console.log('📊 Data count:', response.data?.data?.length || 0);
    console.log('📊 Sample data:', JSON.stringify(response.data).substring(0, 200) + '...');
  } catch (error) {
    console.log('❌ Failed:', error.response?.status || 'No Status');
    console.log('   Error:', error.response?.data?.error || error.message);
    if (error.response?.data?.details) {
      console.log('   Details:', JSON.stringify(error.response.data.details));
    }
    console.log('   Full Response:', JSON.stringify(error.response?.data));
  }
  
  // Test 2: With pagination parameters
  console.log('\n📋 Test 2: With Pagination Parameters');
  try {
    const response = await axios.get(`${BASE_URL}/asset-management/operational-costs?page=1&limit=5`, authHeaders);
    console.log('✅ Success:', response.status);
    console.log('📊 Data count:', response.data?.data?.length || 0);
  } catch (error) {
    console.log('❌ Failed:', error.response?.status || 'No Status');
    console.log('   Error:', error.response?.data?.error || error.message);
    console.log('   Details:', JSON.stringify(error.response?.data?.details));
  }
  
  // Test 3: With asset UUID filter
  console.log('\n📋 Test 3: With Asset UUID Filter');
  try {
    // Get a real asset UUID first
    const assetsResponse = await axios.get(`${BASE_URL}/asset-management/assets?limit=1`, authHeaders);
    const assetUuid = assetsResponse.data?.data?.[0]?.asset_uuid;
    
    if (assetUuid) {
      const response = await axios.get(`${BASE_URL}/asset-management/operational-costs?assetUuid=${assetUuid}`, authHeaders);
      console.log('✅ Success:', response.status);
      console.log('📊 Data count:', response.data?.data?.length || 0);
    } else {
      console.log('⚠️  No asset UUID found for filtering test');
    }
  } catch (error) {
    console.log('❌ Failed:', error.response?.status || 'No Status');
    console.log('   Error:', error.response?.data?.error || error.message);
    console.log('   Details:', JSON.stringify(error.response?.data?.details));
  }
  
  // Test 4: Check if there are any operational cost records
  console.log('\n📋 Test 4: Check Database Records');
  try {
    const { client } = require('../src/db');
    const records = await client`SELECT COUNT(*) as count FROM asset_operational_costs`;
    console.log('📊 Total operational cost records in database:', records[0].count);
    
    if (parseInt(records[0].count) > 0) {
      const sample = await client`SELECT * FROM asset_operational_costs LIMIT 1`;
      console.log('📊 Sample record:', JSON.stringify(sample[0], null, 2));
    }
    
    await client.end();
  } catch (error) {
    console.log('❌ Database query failed:', error.message);
  }
}

// Run if executed directly
if (require.main === module) {
  testOperationalCosts().catch(console.error);
}

module.exports = { testOperationalCosts };
