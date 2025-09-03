#!/usr/bin/env node
/**
 * Debug Database Views
 * Check if the asset detail views exist and what data they contain
 */

const { db, client } = require('../src/db');

async function debugDatabaseViews() {
  console.log('🔍 Debug Database Views');
  console.log('=======================');
  
  try {
    // Test basic database connection
    console.log('\n📋 Step 1: Test Database Connection');
    await client`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check if views exist
    console.log('\n📋 Step 2: Check if Views Exist');
    const views = await client`
      SELECT schemaname, viewname 
      FROM pg_views 
      WHERE viewname LIKE 'asset_%_view'
      ORDER BY viewname
    `;
    
    console.log('📊 Found Views:');
    views.forEach(view => {
      console.log(`   - ${view.schemaname}.${view.viewname}`);
    });
    
    // Check asset_detail_view structure
    console.log('\n📋 Step 3: Check asset_detail_view Structure');
    try {
      const columns = await client`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'asset_detail_view'
        ORDER BY ordinal_position
      `;
      
      console.log('📊 asset_detail_view Columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (error) {
      console.log('❌ Failed to get view structure:', error.message);
    }
    
    // Test querying the view directly
    console.log('\n📋 Step 4: Test Direct View Query');
    try {
      const directResult = await client`
        SELECT * FROM asset_detail_view LIMIT 1
      `;
      
      console.log('📊 Direct View Query Result:');
      console.log(JSON.stringify(directResult, null, 2));
    } catch (error) {
      console.log('❌ Failed to query view directly:', error.message);
    }
    
    // Test querying assets table directly
    console.log('\n📋 Step 5: Test Direct Assets Table Query');
    try {
      const assetsResult = await client`
        SELECT asset_uuid, hostname, netbios_name, system_id, created_at 
        FROM assets 
        LIMIT 1
      `;
      
      console.log('📊 Direct Assets Table Query Result:');
      console.log(JSON.stringify(assetsResult, null, 2));
    } catch (error) {
      console.log('❌ Failed to query assets table:', error.message);
    }
    
    // Test Drizzle query
    console.log('\n📋 Step 6: Test Drizzle Query');
    try {
      const { assetDetailView } = require('../src/db/schema/assetDetailViews');
      const drizzleResult = await db.select().from(assetDetailView).limit(1);
      
      console.log('📊 Drizzle Query Result:');
      console.log(JSON.stringify(drizzleResult, null, 2));
    } catch (error) {
      console.log('❌ Failed Drizzle query:', error.message);
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  } finally {
    await client.end();
  }
}

// Run if executed directly
if (require.main === module) {
  debugDatabaseViews().catch(console.error);
}

module.exports = { debugDatabaseViews };
