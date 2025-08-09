const { client } = require('../src/db');

async function analyzeDatabaseForMetrics() {
  try {
    console.log('🔍 Analyzing database structure for metrics...');
    
    // Check systems table
    console.log('\n📊 SYSTEMS TABLE ANALYSIS:');
    const systemsCount = await client`SELECT COUNT(*) as count FROM systems`;
    console.log(`Total systems: ${systemsCount[0].count}`);
    
    if (systemsCount[0].count > 0) {
      const systemsSample = await client`
        SELECT system_name, system_type, impact_level, authorization_status, 
               created_at, updated_at
        FROM systems 
        LIMIT 5
      `;
      console.table(systemsSample);
      
      // System metrics breakdown
      const systemsByType = await client`
        SELECT system_type, COUNT(*) as count
        FROM systems 
        GROUP BY system_type
        ORDER BY count DESC
      `;
      console.log('\nSystems by type:');
      console.table(systemsByType);
      
      const systemsByImpact = await client`
        SELECT impact_level, COUNT(*) as count
        FROM systems 
        GROUP BY impact_level
        ORDER BY count DESC
      `;
      console.log('\nSystems by impact level:');
      console.table(systemsByImpact);
    }
    
    // Check assets table
    console.log('\n📊 ASSETS TABLE ANALYSIS:');
    const assetsCount = await client`SELECT COUNT(*) as count FROM assets`;
    console.log(`Total assets: ${assetsCount[0].count}`);
    
    if (assetsCount[0].count > 0) {
      const assetsSample = await client`
        SELECT asset_name, operating_system, asset_type, criticality_rating,
               last_scan_date, created_at
        FROM assets 
        LIMIT 5
      `;
      console.table(assetsSample);
      
      // Asset metrics breakdown
      const assetsByOS = await client`
        SELECT operating_system, COUNT(*) as count
        FROM assets 
        WHERE operating_system IS NOT NULL
        GROUP BY operating_system
        ORDER BY count DESC
        LIMIT 10
      `;
      console.log('\nAssets by Operating System:');
      console.table(assetsByOS);
      
      const assetsByCriticality = await client`
        SELECT criticality_rating, COUNT(*) as count
        FROM assets 
        WHERE criticality_rating IS NOT NULL
        GROUP BY criticality_rating
        ORDER BY criticality_rating DESC
      `;
      console.log('\nAssets by Criticality:');
      console.table(assetsByCriticality);
    }
    
    // Check vulnerabilities table
    console.log('\n📊 VULNERABILITIES TABLE ANALYSIS:');
    const vulnCount = await client`SELECT COUNT(*) as count FROM vulnerabilities`;
    console.log(`Total vulnerabilities: ${vulnCount[0].count}`);
    
    if (vulnCount[0].count > 0) {
      const vulnBySeverity = await client`
        SELECT severity_name, COUNT(*) as count
        FROM vulnerabilities 
        GROUP BY severity_name, severity
        ORDER BY severity DESC
      `;
      console.log('\nVulnerabilities by severity:');
      console.table(vulnBySeverity);
      
      const vulnByState = await client`
        SELECT state, COUNT(*) as count
        FROM vulnerabilities 
        GROUP BY state
        ORDER BY count DESC
      `;
      console.log('\nVulnerabilities by state:');
      console.table(vulnByState);
      
      const vulnByFamily = await client`
        SELECT plugin_family, COUNT(*) as count
        FROM vulnerabilities 
        GROUP BY plugin_family
        ORDER BY count DESC
        LIMIT 10
      `;
      console.log('\nTop vulnerability families:');
      console.table(vulnByFamily);
    }
    
    // Check patches table
    console.log('\n📊 PATCHES TABLE ANALYSIS:');
    const patchesCount = await client`SELECT COUNT(*) as count FROM patches`;
    console.log(`Total patches: ${patchesCount[0].count}`);
    
    if (patchesCount[0].count > 0) {
      const patchesSample = await client`
        SELECT patch_id, title, vendor, severity, patch_type, release_date
        FROM patches 
        LIMIT 5
      `;
      console.table(patchesSample);
    }
    
    // Check metrics table structure
    console.log('\n📊 METRICS TABLE STRUCTURE:');
    const metricsStructure = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'metrics'
      ORDER BY ordinal_position
    `;
    console.table(metricsStructure);
    
    // Check enum values
    console.log('\n📊 METRICS ENUM VALUES:');
    try {
      const typeEnums = await client`
        SELECT unnest(enum_range(NULL::enum_metrics_type)) as metric_type
      `;
      console.log('Metric types:');
      console.table(typeEnums);
      
      const categoryEnums = await client`
        SELECT unnest(enum_range(NULL::enum_metrics_category)) as metric_category
      `;
      console.log('Metric categories:');
      console.table(categoryEnums);
    } catch (enumError) {
      console.log('Could not fetch enum values:', enumError.message);
    }
    
  } catch (error) {
    console.error('❌ Error analyzing database:', error.message);
  } finally {
    await client.end();
  }
}

analyzeDatabaseForMetrics();
