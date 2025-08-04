#!/usr/bin/env node

/**
 * Test script to check asset count and API response
 */

const { db } = require('../src/db');
const { assets } = require('../src/db/schema');
const { count } = require('drizzle-orm');

async function testAssetsCount() {
  try {
    console.log('🔍 Testing asset count and API response...\n');

    // 1. Check total assets in database
    const [{ count: totalCount }] = await db.select({ count: count() }).from(assets);
    console.log(`📊 Total assets in database: ${totalCount}`);

    // 2. Check assets with different limits
    const allAssets = await db.select().from(assets);
    console.log(`📊 Assets returned by SELECT *: ${allAssets.length}`);

    // 3. Check assets with pagination (like the API does)
    const paginatedAssets = await db.select()
      .from(assets)
      .limit(50)
      .offset(0);
    console.log(`📊 Assets with limit 50, offset 0: ${paginatedAssets.length}`);

    // 4. Check if there are any null or invalid asset_uuid values
    const assetsWithNullUuid = allAssets.filter(asset => !asset.assetUuid);
    console.log(`⚠️  Assets with null UUID: ${assetsWithNullUuid.length}`);

    // 5. Show sample of asset data
    console.log('\n📋 Sample assets:');
    allAssets.slice(0, 5).forEach((asset, index) => {
      console.log(`  ${index + 1}. ${asset.hostname || 'No hostname'} (${asset.assetUuid})`);
    });

    // 6. Check for duplicates
    const uniqueUuids = new Set(allAssets.map(a => a.assetUuid));
    console.log(`🔍 Unique UUIDs: ${uniqueUuids.size}`);
    console.log(`🔍 Total records: ${allAssets.length}`);
    
    if (uniqueUuids.size !== allAssets.length) {
      console.log('⚠️  There are duplicate UUIDs in the database!');
    }

    // 7. Test the actual API controller logic
    console.log('\n🧪 Testing API controller logic...');
    
    // Simulate the API request
    const page = 1;
    const limit = 50;
    const offset = (page - 1) * limit;
    
    const apiAssets = await db.select()
      .from(assets)
      .orderBy(assets.lastSeen)  // Note: using desc() in actual API
      .limit(parseInt(limit))
      .offset(offset);
    
    console.log(`📡 API simulation returned: ${apiAssets.length} assets`);

    // 8. Check if there are any filtering conditions that might be applied
    console.log('\n🔍 Checking for potential filtering issues...');
    
    // Check assets by source
    const sourceGroups = {};
    allAssets.forEach(asset => {
      const source = asset.source || 'null';
      sourceGroups[source] = (sourceGroups[source] || 0) + 1;
    });
    
    console.log('📊 Assets by source:');
    Object.entries(sourceGroups).forEach(([source, count]) => {
      console.log(`  ${source}: ${count}`);
    });

    // Check assets by criticality
    const criticalityGroups = {};
    allAssets.forEach(asset => {
      const criticality = asset.criticalityRating || 'null';
      criticalityGroups[criticality] = (criticalityGroups[criticality] || 0) + 1;
    });
    
    console.log('📊 Assets by criticality:');
    Object.entries(criticalityGroups).forEach(([criticality, count]) => {
      console.log(`  ${criticality}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error testing assets:', error);
  } finally {
    process.exit(0);
  }
}

testAssetsCount();
