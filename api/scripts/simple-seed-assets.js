const { db } = require('../src/db');
const { assets, systems } = require('../src/db/schema');
const { sql } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

async function simpleAssetSeed() {
  try {
    console.log('🌱 Starting Simple Asset Seeding...\n');
    
    // First ensure we have systems
    console.log('🏢 Creating systems...');
    const { systems: systemsTable } = require('../src/db/schema');
    
    const systemsToCreate = [
      {
        systemId: 'SYS-001',
        name: 'Corporate Network Infrastructure',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Infrastructure',
        responsibleOrganization: 'IT Department',
        systemOwner: 'John Smith',
        confidentialityImpact: 'moderate',
        integrityImpact: 'moderate',
        availabilityImpact: 'high'
      },
      {
        systemId: 'SYS-002',
        name: 'Web Application Platform',
        uuid: uuidv4(),
        status: 'operational',
        systemType: 'Application',
        responsibleOrganization: 'Development Team',
        systemOwner: 'Sarah Wilson',
        confidentialityImpact: 'high',
        integrityImpact: 'high',
        availabilityImpact: 'moderate'
      }
    ];
    
    // Clear and create systems
    try {
      await db.delete(systemsTable);
      await db.insert(systemsTable).values(systemsToCreate);
      console.log('✅ Systems created successfully');
    } catch (error) {
      console.log('⚠️ Systems creation issue:', error.message);
    }
    
    // Clear existing assets
    console.log('🗑️ Clearing existing assets...');
    await db.delete(assets);
    
    // Create 20 simple assets
    console.log('📊 Creating 20 assets...');
    const assetsToCreate = [];
    
    const hostnames = [
      'web-server-01', 'web-server-02', 'app-server-01', 'app-server-02',
      'db-server-01', 'db-server-02', 'mail-server-01', 'file-server-01',
      'dns-server-01', 'dhcp-server-01', 'backup-server-01', 'proxy-server-01',
      'workstation-001', 'workstation-002', 'laptop-001', 'laptop-002',
      'printer-001', 'scanner-001', 'fw-01', 'sw-core-01'
    ];
    
    const operatingSystems = [
      'Windows Server 2019', 'Windows Server 2022', 'Ubuntu 20.04 LTS',
      'Ubuntu 22.04 LTS', 'CentOS 7', 'Windows 10 Enterprise'
    ];
    
    for (let i = 0; i < 20; i++) {
      const hostname = hostnames[i];
      const assetUuid = uuidv4();
      const exposureScore = Math.floor(Math.random() * 1000);
      const acrScore = (Math.random() * 9 + 1).toFixed(1);
      
      // Determine criticality
      let criticalityRating;
      if (exposureScore >= 700) criticalityRating = 'critical';
      else if (exposureScore >= 500) criticalityRating = 'high';
      else if (exposureScore >= 300) criticalityRating = 'medium';
      else criticalityRating = 'low';
      
      const asset = {
        assetUuid,
        hostname,
        netbiosName: hostname.toUpperCase().substring(0, 15),
        systemId: i < 10 ? 'SYS-001' : 'SYS-002', // Distribute between systems
        hasAgent: Math.random() > 0.25,
        hasPluginResults: Math.random() > 0.15,
        firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        exposureScore,
        acrScore,
        criticalityRating,
        source: 'tenable',
        batchId: uuidv4(),
        rawJson: {
          acr_score: parseFloat(acrScore),
          agent_uuid: [],
          criticality_rating: criticalityRating,
          exposure_score: exposureScore,
          first_seen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          fqdn: [`${hostname}.corp.local`],
          has_agent: Math.random() > 0.25,
          hostname: [hostname],
          id: assetUuid,
          indexed: new Date().toISOString(),
          ipv4: [`192.168.1.${100 + i}`],
          last_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          mac_address: [`00:11:22:33:44:${(50 + i).toString(16).padStart(2, '0')}`],
          netbios_name: hostname.toUpperCase().substring(0, 15),
          network_name: 'Corporate Network',
          operating_system: [operatingSystems[i % operatingSystems.length]],
          system_type: ['general-purpose']
        }
      };
      
      assetsToCreate.push(asset);
    }
    
    // Insert assets
    await db.insert(assets).values(assetsToCreate);
    
    // Verify creation
    const [{ count }] = await db.execute(sql`SELECT COUNT(*) as count FROM assets`);
    const [{ count: systemCount }] = await db.execute(sql`SELECT COUNT(*) as count FROM systems`);
    
    console.log('\n🎉 Asset seeding completed!');
    console.log(`📊 Results:`);
    console.log(`   Systems: ${systemCount}`);
    console.log(`   Assets: ${count}`);
    console.log(`   Assets in SYS-001: ${assetsToCreate.filter(a => a.systemId === 'SYS-001').length}`);
    console.log(`   Assets in SYS-002: ${assetsToCreate.filter(a => a.systemId === 'SYS-002').length}`);
    
    // Show sample assets
    console.log('\n📋 Sample Assets:');
    assetsToCreate.slice(0, 5).forEach((asset, index) => {
      console.log(`   ${index + 1}. ${asset.hostname} (${asset.systemId})`);
      console.log(`      Exposure: ${asset.exposureScore}, Criticality: ${asset.criticalityRating}`);
    });
    
    console.log('\n✅ Ready to test Asset Inventory page!');
    
  } catch (error) {
    console.error('❌ Error seeding assets:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

simpleAssetSeed();
