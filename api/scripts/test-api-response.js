#!/usr/bin/env node

/**
 * Test the actual API response to see what's being returned
 */

async function testApiResponse() {
  const fetch = (await import('node-fetch')).default;
  try {
    console.log('🧪 Testing API response...\n');

    const response = await fetch('http://localhost:3001/api/v1/integrations/tenable/assets?limit=100');
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    
    console.log('📊 API Response Summary:');
    console.log(`   Success: ${data.success}`);
    console.log(`   Assets returned: ${data.data?.assets?.length || 0}`);
    console.log(`   Total in DB: ${data.data?.pagination?.total || 0}`);
    console.log(`   Current page: ${data.data?.pagination?.page || 0}`);
    console.log(`   Limit: ${data.data?.pagination?.limit || 0}`);
    console.log(`   Total pages: ${data.data?.pagination?.pages || 0}`);
    
    console.log('\n📋 First 5 assets:');
    if (data.data?.assets) {
      data.data.assets.slice(0, 5).forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.hostname || 'No hostname'} (${asset.criticalityRating || 'no criticality'})`);
      });
    }

    console.log('\n🔍 Criticality breakdown:');
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

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testApiResponse();
