const { client } = require('../src/db');

async function checkTableStructures() {
  try {
    console.log('🔍 Checking table structures...');
    
    // Check systems table
    console.log('\n📊 SYSTEMS TABLE STRUCTURE:');
    const systemsStructure = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'systems'
      ORDER BY ordinal_position
    `;
    console.table(systemsStructure);
    
    // Check assets table
    console.log('\n📊 ASSETS TABLE STRUCTURE:');
    const assetsStructure = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'assets'
      ORDER BY ordinal_position
    `;
    console.table(assetsStructure);
    
    // Check vulnerabilities table
    console.log('\n📊 VULNERABILITIES TABLE STRUCTURE:');
    const vulnStructure = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'vulnerabilities'
      ORDER BY ordinal_position
    `;
    console.table(vulnStructure);
    
    // Check patches table
    console.log('\n📊 PATCHES TABLE STRUCTURE:');
    const patchesStructure = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'patches'
      ORDER BY ordinal_position
    `;
    console.table(patchesStructure);
    
    // Check metrics table
    console.log('\n📊 METRICS TABLE STRUCTURE:');
    const metricsStructure = await client`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'metrics'
      ORDER BY ordinal_position
    `;
    console.table(metricsStructure);
    
    // Sample data from each table
    console.log('\n📊 SAMPLE DATA:');
    
    const systemsCount = await client`SELECT COUNT(*) as count FROM systems`;
    console.log(`Systems count: ${systemsCount[0].count}`);
    
    const assetsCount = await client`SELECT COUNT(*) as count FROM assets`;
    console.log(`Assets count: ${assetsCount[0].count}`);
    
    const vulnCount = await client`SELECT COUNT(*) as count FROM vulnerabilities`;
    console.log(`Vulnerabilities count: ${vulnCount[0].count}`);
    
    const patchesCount = await client`SELECT COUNT(*) as count FROM patches`;
    console.log(`Patches count: ${patchesCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTableStructures();
