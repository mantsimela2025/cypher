#!/usr/bin/env node
/**
 * Test Complete Detail View
 * Debug the asset complete detail view specifically
 */

const { db, client } = require('../src/db');

async function testCompleteDetailView() {
  console.log('🔍 Test Complete Detail View');
  console.log('=============================');
  
  try {
    // Test direct SQL query
    console.log('\n📋 Step 1: Test Direct SQL Query');
    const directResult = await client`
      SELECT * FROM asset_complete_detail_view 
      WHERE asset_uuid = '754511bc-9fec-4799-a251-569c32678eed'
      LIMIT 1
    `;
    
    console.log('📊 Direct SQL Result:');
    console.log(`Found ${directResult.length} records`);
    if (directResult.length > 0) {
      console.log('First record keys:', Object.keys(directResult[0]));
      console.log('Sample data:', {
        asset_uuid: directResult[0].asset_uuid,
        hostname: directResult[0].hostname,
        total_vulnerabilities: directResult[0].total_vulnerabilities,
        total_amount: directResult[0].total_amount
      });
    }
    
    // Test Drizzle query
    console.log('\n📋 Step 2: Test Drizzle Query');
    try {
      const { assetCompleteDetailView } = require('../src/db/schema/assetDetailViews');
      const { eq } = require('drizzle-orm');
      
      const drizzleResult = await db.select()
        .from(assetCompleteDetailView)
        .where(eq(assetCompleteDetailView.asset_uuid, '754511bc-9fec-4799-a251-569c32678eed'))
        .limit(1);
      
      console.log('📊 Drizzle Result:');
      console.log(`Found ${drizzleResult.length} records`);
      if (drizzleResult.length > 0) {
        console.log('First record keys:', Object.keys(drizzleResult[0]));
        console.log('Sample data:', {
          asset_uuid: drizzleResult[0].asset_uuid,
          hostname: drizzleResult[0].hostname,
          total_vulnerabilities: drizzleResult[0].total_vulnerabilities,
          total_amount: drizzleResult[0].total_amount
        });
      }
    } catch (error) {
      console.log('❌ Drizzle query failed:', error.message);
      console.log('Error details:', error);
    }
    
    // Test the service method directly
    console.log('\n📋 Step 3: Test Service Method');
    try {
      const assetManagementService = require('../src/services/assetManagementService');
      const serviceResult = await assetManagementService.getAssetCompleteDetail('754511bc-9fec-4799-a251-569c32678eed');
      
      console.log('📊 Service Result:');
      if (serviceResult) {
        console.log('Service returned data keys:', Object.keys(serviceResult));
        console.log('Sample data:', {
          asset_uuid: serviceResult.asset_uuid,
          hostname: serviceResult.hostname,
          total_vulnerabilities: serviceResult.total_vulnerabilities,
          total_amount: serviceResult.total_amount
        });
      } else {
        console.log('Service returned null/undefined');
      }
    } catch (error) {
      console.log('❌ Service method failed:', error.message);
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

// Run if executed directly
if (require.main === module) {
  testCompleteDetailView().catch(console.error);
}

module.exports = { testCompleteDetailView };
