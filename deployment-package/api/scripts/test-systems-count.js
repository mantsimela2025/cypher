#!/usr/bin/env node

/**
 * Test script to check systems count and data integrity
 */

const { db } = require('../src/db');
const { systems, assets, systemAssets } = require('../src/db/schema');
const { count, eq } = require('drizzle-orm');

async function testSystemsCount() {
  try {
    console.log('🔍 Testing systems count and data integrity...\n');

    // 1. Check total systems in database
    const [{ count: totalSystems }] = await db.select({ count: count() }).from(systems);
    console.log(`📊 Total systems in database: ${totalSystems}`);

    // 2. Check all systems
    const allSystems = await db.select().from(systems);
    console.log(`📊 Systems returned by SELECT *: ${allSystems.length}`);

    // 3. Show sample systems
    console.log('\n📋 Sample systems:');
    allSystems.slice(0, 5).forEach((system, index) => {
      console.log(`  ${index + 1}. ${system.systemName} (${system.systemId}) - Impact: ${system.impactLevel}`);
    });

    // 4. Check system-asset relationships
    const [{ count: totalSystemAssets }] = await db.select({ count: count() }).from(systemAssets);
    console.log(`\n🔗 Total system-asset relationships: ${totalSystemAssets}`);

    // 5. Check assets with system associations
    const assetsWithSystems = await db.select({
      assetUuid: assets.assetUuid,
      hostname: assets.hostname,
      systemId: systemAssets.systemId,
      systemName: systems.systemName
    })
    .from(assets)
    .leftJoin(systemAssets, eq(assets.assetUuid, systemAssets.assetUuid))
    .leftJoin(systems, eq(systemAssets.systemId, systems.systemId));

    console.log(`📊 Assets with system data query returned: ${assetsWithSystems.length}`);

    // 6. Count assets by system association
    const assetsWithSystemAssociation = assetsWithSystems.filter(a => a.systemId);
    const assetsWithoutSystemAssociation = assetsWithSystems.filter(a => !a.systemId);

    console.log(`✅ Assets WITH system association: ${assetsWithSystemAssociation.length}`);
    console.log(`❌ Assets WITHOUT system association: ${assetsWithoutSystemAssociation.length}`);

    // 7. Group by system
    const systemGroups = {};
    assetsWithSystemAssociation.forEach(asset => {
      const systemId = asset.systemId;
      if (!systemGroups[systemId]) {
        systemGroups[systemId] = {
          name: asset.systemName,
          count: 0
        };
      }
      systemGroups[systemId].count++;
    });

    console.log('\n📊 Assets by system:');
    Object.entries(systemGroups).forEach(([systemId, info]) => {
      console.log(`  ${systemId} (${info.name}): ${info.count} assets`);
    });

    // 8. Check for potential data issues
    console.log('\n🔍 Checking for data integrity issues...');
    
    // Check for duplicate system-asset relationships
    const systemAssetPairs = await db.select().from(systemAssets);
    const uniquePairs = new Set(systemAssetPairs.map(sa => `${sa.systemId}-${sa.assetUuid}`));
    
    if (uniquePairs.size !== systemAssetPairs.length) {
      console.log('⚠️  Found duplicate system-asset relationships!');
      console.log(`   Total relationships: ${systemAssetPairs.length}`);
      console.log(`   Unique relationships: ${uniquePairs.size}`);
    } else {
      console.log('✅ No duplicate system-asset relationships found');
    }

    // 9. Test systems API endpoint
    console.log('\n🧪 Testing systems API...');
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch('http://localhost:3001/api/v1/integrations/tenable/debug/systems');
      if (response.ok) {
        const data = await response.json();
        console.log(`📡 Systems API returned: ${data.data?.length || 0} systems`);
      } else {
        console.log(`❌ Systems API failed: ${response.status}`);
      }
    } catch (apiError) {
      console.log(`❌ Systems API error: ${apiError.message}`);
    }

  } catch (error) {
    console.error('❌ Error testing systems:', error);
  } finally {
    process.exit(0);
  }
}

testSystemsCount();
