#!/usr/bin/env node

const { db, client } = require('../src/db');
const fs = require('fs');
const path = require('path');

async function seedAssetManagementData() {
  try {
    console.log('🌱 Starting asset management data seeding...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'seed-additional-asset-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Executing SQL script: seed-additional-asset-tables.sql');
    
    // Split the SQL content by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        await client.unsafe(statement);
        successCount++;
      } catch (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        errorCount++;
        
        // Continue with other statements even if one fails
        if (error.message.includes('does not exist')) {
          console.log('   ℹ️  This might be expected if tables don\'t exist yet');
        }
      }
    }
    
    console.log('\n🎉 Asset management data seeding completed!');
    console.log(`📊 Results:`);
    console.log(`   ✅ Successful statements: ${successCount}`);
    console.log(`   ❌ Failed statements: ${errorCount}`);
    
    // Verify the data was inserted
    console.log('\n🔍 Verifying data insertion...');
    
    try {
      const operationalCostsResult = await client`SELECT COUNT(*) as count FROM asset_operational_costs`;
      const riskMappingResult = await client`SELECT COUNT(*) as count FROM asset_risk_mapping`;
      const assetTagsResult = await client`SELECT COUNT(*) as count FROM asset_tags`;
      
      console.log(`📊 Data verification:`);
      console.log(`   💰 Operational costs records: ${operationalCostsResult[0].count}`);
      console.log(`   🎯 Risk mapping records: ${riskMappingResult[0].count}`);
      console.log(`   🏷️  Asset tags records: ${assetTagsResult[0].count}`);

      if (operationalCostsResult[0].count > 0 && riskMappingResult[0].count > 0) {
        console.log('\n✅ Asset management data seeding was successful!');
      } else {
        console.log('\n⚠️  Some tables may not have been populated. Check for errors above.');
      }
      
    } catch (verifyError) {
      console.error('❌ Error verifying data:', verifyError.message);
    }
    
  } catch (error) {
    console.error('❌ Asset management data seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the seeder
seedAssetManagementData();
