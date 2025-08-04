#!/usr/bin/env node

/**
 * Test the exact API call that the client is making
 */

async function testClientApiCall() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('🧪 Testing exact client API call...\n');

    // Replicate the exact client call
    const url = 'http://localhost:3001/api/v1/integrations/tenable/assets?page=1&limit=50&criticality=&hasAgent=&source=&search=&assetType=';
    console.log('🌐 URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    
    console.log('📊 Client API Call Results:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Assets returned: ${data.data?.assets?.length || 0}`);
    console.log(`   Total in DB: ${data.data?.pagination?.total || 0}`);
    console.log(`   Current page: ${data.data?.pagination?.page || 0}`);
    console.log(`   Limit: ${data.data?.pagination?.limit || 0}`);
    console.log(`   Total pages: ${data.data?.pagination?.pages || 0}`);
    
    console.log('\n📋 First 5 assets from client call:');
    if (data.data?.assets) {
      data.data.assets.slice(0, 5).forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.hostname || 'No hostname'} (${asset.criticalityRating || 'no criticality'})`);
      });
    }

    console.log('\n🔍 Criticality breakdown from client call:');
    if (data.data?.assets) {
      const criticalityCount = {};
      data.data.assets.forEach(asset => {
        const crit = asset.criticalityRating || 'null';
        criticalityCount[crit] = (criticalityCount[crit] || 0) + 1;
      });
      
      Object.entries(criticalityCount).forEach(([crit, count]) => {
        console.log(`   ${crit}: ${count}`);
      });
    }

    // Now test without the empty parameters
    console.log('\n' + '='.repeat(50));
    console.log('🧪 Testing without empty parameters...\n');
    
    const cleanUrl = 'http://localhost:3001/api/v1/integrations/tenable/assets?page=1&limit=50';
    console.log('🌐 Clean URL:', cleanUrl);
    
    const cleanResponse = await fetch(cleanUrl);
    const cleanData = await cleanResponse.json();
    
    console.log('📊 Clean API Call Results:');
    console.log(`   Assets returned: ${cleanData.data?.assets?.length || 0}`);
    console.log(`   Total in DB: ${cleanData.data?.pagination?.total || 0}`);

    // Compare the results
    console.log('\n' + '='.repeat(50));
    console.log('🔍 COMPARISON:');
    console.log(`   Client call (with empty params): ${data.data?.assets?.length || 0} assets`);
    console.log(`   Clean call (no empty params): ${cleanData.data?.assets?.length || 0} assets`);
    
    if ((data.data?.assets?.length || 0) !== (cleanData.data?.assets?.length || 0)) {
      console.log('⚠️  DIFFERENT RESULTS! Empty parameters are causing filtering!');
    } else {
      console.log('✅ Same results - empty parameters are not the issue');
    }

  } catch (error) {
    console.error('❌ Error testing client API call:', error.message);
  }
}

testClientApiCall();
