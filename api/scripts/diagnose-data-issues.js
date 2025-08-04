#!/usr/bin/env node

/**
 * Comprehensive data diagnosis script
 * Checks for data inconsistencies and identifies sources of wrong data
 */

const { db } = require('../src/db');
const { systems, assets, systemAssets, assetNetwork } = require('../src/db/schema');
const { count, eq, sql } = require('drizzle-orm');

async function diagnoseDataIssues() {
  try {
    console.log('🔍 COMPREHENSIVE DATA DIAGNOSIS\n');
    console.log('=' .repeat(50));

    // 1. Basic counts
    console.log('📊 BASIC COUNTS:');
    const [{ count: systemCount }] = await db.select({ count: count() }).from(systems);
    const [{ count: assetCount }] = await db.select({ count: count() }).from(assets);
    const [{ count: systemAssetCount }] = await db.select({ count: count() }).from(systemAssets);
    const [{ count: networkCount }] = await db.select({ count: count() }).from(assetNetwork);

    console.log(`   Systems: ${systemCount}`);
    console.log(`   Assets: ${assetCount}`);
    console.log(`   System-Asset relationships: ${systemAssetCount}`);
    console.log(`   Asset Network records: ${networkCount}`);

    // 2. Check for data integrity issues
    console.log('\n🔍 DATA INTEGRITY CHECKS:');
    
    // Check for orphaned system-asset relationships
    const orphanedSystemAssets = await db.select({
      systemId: systemAssets.systemId,
      assetUuid: systemAssets.assetUuid
    })
    .from(systemAssets)
    .leftJoin(systems, eq(systemAssets.systemId, systems.systemId))
    .leftJoin(assets, eq(systemAssets.assetUuid, assets.assetUuid))
    .where(sql`${systems.systemId} IS NULL OR ${assets.assetUuid} IS NULL`);

    console.log(`   Orphaned system-asset relationships: ${orphanedSystemAssets.length}`);

    // Check for assets without network data
    const assetsWithoutNetwork = await db.select({
      assetUuid: assets.assetUuid,
      hostname: assets.hostname
    })
    .from(assets)
    .leftJoin(assetNetwork, eq(assets.assetUuid, assetNetwork.assetUuid))
    .where(sql`${assetNetwork.assetUuid} IS NULL`);

    console.log(`   Assets without network data: ${assetsWithoutNetwork.length}`);

    // 3. Check data sources and timestamps
    console.log('\n📅 DATA FRESHNESS:');
    
    // Check asset creation dates
    const assetDates = await db.select({
      createdAt: assets.createdAt,
      source: assets.source
    }).from(assets).orderBy(assets.createdAt);

    if (assetDates.length > 0) {
      const oldestAsset = assetDates[0].createdAt;
      const newestAsset = assetDates[assetDates.length - 1].createdAt;
      console.log(`   Oldest asset: ${oldestAsset}`);
      console.log(`   Newest asset: ${newestAsset}`);
    }

    // Group by source
    const sourceGroups = {};
    assetDates.forEach(asset => {
      const source = asset.source || 'null';
      sourceGroups[source] = (sourceGroups[source] || 0) + 1;
    });

    console.log('   Assets by source:');
    Object.entries(sourceGroups).forEach(([source, count]) => {
      console.log(`     ${source}: ${count}`);
    });

    // 4. Check for duplicate data
    console.log('\n🔄 DUPLICATE CHECKS:');
    
    // Check for duplicate asset UUIDs
    const duplicateAssets = await db.execute(sql`
      SELECT asset_uuid, COUNT(*) as count 
      FROM assets 
      GROUP BY asset_uuid 
      HAVING COUNT(*) > 1
    `);
    console.log(`   Duplicate asset UUIDs: ${duplicateAssets.length}`);

    // Check for duplicate hostnames
    const duplicateHostnames = await db.execute(sql`
      SELECT hostname, COUNT(*) as count 
      FROM assets 
      WHERE hostname IS NOT NULL 
      GROUP BY hostname 
      HAVING COUNT(*) > 1
    `);
    console.log(`   Duplicate hostnames: ${duplicateHostnames.length}`);

    // 5. Sample problematic data
    if (orphanedSystemAssets.length > 0) {
      console.log('\n⚠️  ORPHANED SYSTEM-ASSET RELATIONSHIPS:');
      orphanedSystemAssets.slice(0, 5).forEach((rel, index) => {
        console.log(`   ${index + 1}. System: ${rel.systemId}, Asset: ${rel.assetUuid}`);
      });
    }

    if (assetsWithoutNetwork.length > 0) {
      console.log('\n⚠️  ASSETS WITHOUT NETWORK DATA:');
      assetsWithoutNetwork.slice(0, 5).forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset.hostname} (${asset.assetUuid})`);
      });
    }

    // 6. Check recent database activity
    console.log('\n📊 RECENT ACTIVITY:');
    
    // Check for recently modified assets
    const recentAssets = await db.select({
      hostname: assets.hostname,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt
    })
    .from(assets)
    .orderBy(sql`${assets.updatedAt} DESC NULLS LAST`)
    .limit(5);

    console.log('   Recently updated assets:');
    recentAssets.forEach((asset, index) => {
      console.log(`     ${index + 1}. ${asset.hostname} - Updated: ${asset.updatedAt || 'Never'}`);
    });

    // 7. API endpoint test
    console.log('\n🧪 API ENDPOINT TESTS:');
    const fetch = (await import('node-fetch')).default;
    
    try {
      // Test assets endpoint
      const assetsResponse = await fetch('http://localhost:3001/api/v1/integrations/tenable/assets?limit=5');
      if (assetsResponse.ok) {
        const assetsData = await assetsResponse.json();
        console.log(`   Assets API: ✅ Returns ${assetsData.data?.assets?.length || 0} assets`);
      } else {
        console.log(`   Assets API: ❌ Status ${assetsResponse.status}`);
      }

      // Test systems endpoint
      const systemsResponse = await fetch('http://localhost:3001/api/v1/integrations/tenable/debug/systems');
      if (systemsResponse.ok) {
        const systemsData = await systemsResponse.json();
        console.log(`   Systems API: ✅ Returns ${systemsData.data?.length || 0} systems`);
      } else {
        console.log(`   Systems API: ❌ Status ${systemsResponse.status}`);
      }
    } catch (apiError) {
      console.log(`   API Tests: ❌ ${apiError.message}`);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 DIAGNOSIS COMPLETE');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    process.exit(0);
  }
}

diagnoseDataIssues();
