#!/usr/bin/env node
/**
 * Test Xacta Integration with Mock Server
 * Demonstrates system-asset linking and vulnerability-control correlation
 */

const XactaService = require('../../src/services/integrations/xactaService');
const TenableService = require('../../src/services/integrations/tenableService');
const { db } = require('../../src/db');
const { systems, systemAssets, controls, poams, assets, vulnerabilities } = require('../../src/db/schema');
const { eq } = require('drizzle-orm');

async function testXactaServiceIntegration() {
    console.log('🧪 Testing RAS-DASH Xacta Service Integration');
    console.log('Make sure mock server is running on port 5001 with Xacta endpoints\n');

    try {
        // Override environment for testing
        process.env.XACTA_BASE_URL = 'http://localhost:5001/xacta';
        process.env.XACTA_API_KEY = 'mock_api_key';

        // Initialize services
        const xactaService = new XactaService();
        const tenableService = new TenableService();

        console.log('🔧 Initializing services...');
        await xactaService.initialize();
        await tenableService.initialize();

        console.log('🔗 Testing connections...');
        const xactaStatus = xactaService.getStatus();
        const tenableStatus = tenableService.getStatus();
        
        console.log(`✅ Xacta service status: ${xactaStatus.status}`);
        console.log(`✅ Tenable service status: ${tenableStatus.status}`);
        console.log(`📊 Xacta health: ${xactaStatus.health}`);
        console.log(`📊 Tenable health: ${tenableStatus.health}`);

        // Test Xacta data retrieval
        console.log('\n🏢 Testing Xacta data retrieval...');
        
        const systemsData = await xactaService.getSystems({ limit: 5 });
        console.log(`📊 Retrieved ${systemsData.systems?.length || 0} systems`);
        
        const controlsData = await xactaService.getControls({ limit: 10 });
        console.log(`🔒 Retrieved ${controlsData.controls?.length || 0} controls`);
        
        const poamsData = await xactaService.getPoams({ limit: 5 });
        console.log(`📋 Retrieved ${poamsData.poams?.length || 0} POAMs`);

        // Test system-asset relationships
        console.log('\n🔗 Testing system-asset relationships...');
        const systemAssetData = await xactaService.getSystemAssetRelationships();
        console.log(`🔗 Retrieved ${systemAssetData.system_assets?.length || 0} system-asset links`);

        // Sync Xacta data to database
        console.log('\n📦 Testing Xacta data synchronization...');
        const systemSync = await xactaService.syncSystems();
        console.log(`✅ System sync completed:`);
        console.log(`   - Total processed: ${systemSync.total}`);
        console.log(`   - Created: ${systemSync.created}`);
        console.log(`   - Updated: ${systemSync.updated}`);
        console.log(`   - Errors: ${systemSync.errors.length}`);

        // Sync controls
        const controlSync = await xactaService.syncControls();
        console.log(`✅ Control sync completed:`);
        console.log(`   - Total processed: ${controlSync.total}`);
        console.log(`   - Created: ${controlSync.created}`);
        console.log(`   - Updated: ${controlSync.updated}`);
        console.log(`   - Errors: ${controlSync.errors.length}`);

        // Sync POAMs
        const poamSync = await xactaService.syncPoams();
        console.log(`✅ POAM sync completed:`);
        console.log(`   - Total processed: ${poamSync.total}`);
        console.log(`   - Created: ${poamSync.created}`);
        console.log(`   - Updated: ${poamSync.updated}`);
        console.log(`   - Errors: ${poamSync.errors.length}`);

        // Verify data in database
        console.log('\n🗄️ Verifying Xacta data in database...');
        const systemCount = await db.select().from(systems);
        const controlCount = await db.select().from(controls);
        const poamCount = await db.select().from(poams);
        const systemAssetCount = await db.select().from(systemAssets);

        console.log(`📊 Systems in database: ${systemCount.length}`);
        console.log(`🔒 Controls in database: ${controlCount.length}`);
        console.log(`📋 POAMs in database: ${poamCount.length}`);
        console.log(`🔗 System-asset relationships: ${systemAssetCount.length}`);

        // Show sample data
        if (systemCount.length > 0) {
            const sampleSystem = systemCount[0];
            console.log(`\n📋 Sample system data:`);
            console.log(`   - System ID: ${sampleSystem.systemId}`);
            console.log(`   - Name: ${sampleSystem.systemName}`);
            console.log(`   - Type: ${sampleSystem.systemType}`);
            console.log(`   - Status: ${sampleSystem.status}`);
        }

        if (controlCount.length > 0) {
            const sampleControl = controlCount[0];
            console.log(`\n🔍 Sample control data:`);
            console.log(`   - Control ID: ${sampleControl.controlId}`);
            console.log(`   - Family: ${sampleControl.family}`);
            console.log(`   - Status: ${sampleControl.status}`);
            console.log(`   - Priority: ${sampleControl.priority}`);
        }

        console.log('\n🎉 Xacta integration test completed successfully!');
        return true;

    } catch (error) {
        console.error(`❌ Xacta integration test failed: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

async function testTenableXactaCorrelation() {
    console.log('\n🔗 Testing Tenable-Xacta correlation...');
    
    try {
        // Get assets from both systems
        const tenableAssets = await db.select().from(assets).limit(5);
        const xactaSystems = await db.select().from(systems).limit(3);
        
        console.log(`📊 Found ${tenableAssets.length} Tenable assets`);
        console.log(`🏢 Found ${xactaSystems.length} Xacta systems`);

        // Show system-asset correlations
        const systemAssetLinks = await db.select().from(systemAssets).limit(10);
        console.log(`🔗 Found ${systemAssetLinks.length} system-asset correlations`);

        if (systemAssetLinks.length > 0) {
            console.log('\n📋 Sample correlations:');
            for (let i = 0; i < Math.min(3, systemAssetLinks.length); i++) {
                const link = systemAssetLinks[i];
                console.log(`   • System ${link.systemId} ↔ Asset ${link.assetUuid.substring(0, 8)}...`);
                console.log(`     Relationship: ${link.relationshipType}, Criticality: ${link.criticality}`);
            }
        }

        // Get vulnerabilities for linked assets
        const assetVulns = await db.select().from(vulnerabilities).limit(5);
        console.log(`\n🔓 Found ${assetVulns.length} vulnerabilities in linked assets`);

        // Show POAM correlations
        const poamList = await db.select().from(poams).limit(5);
        console.log(`📋 Found ${poamList.length} POAMs that could correlate with vulnerabilities`);

        console.log('\n✅ Tenable-Xacta correlation analysis completed!');
        return true;

    } catch (error) {
        console.error(`❌ Correlation test failed: ${error.message}`);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Tenable-Xacta Integration Tests\n');
    
    const xactaSuccess = await testXactaServiceIntegration();
    
    if (xactaSuccess) {
        await testTenableXactaCorrelation();
    }
    
    if (xactaSuccess) {
        console.log('\n✅ All Xacta integration tests passed!');
        console.log('\n📋 Available endpoints to test manually:');
        console.log('   • curl http://localhost:5001/xacta/systems');
        console.log('   • curl http://localhost:5001/xacta/controls');
        console.log('   • curl http://localhost:5001/xacta/poams');
        console.log('   • curl http://localhost:5001/xacta/system-assets');
        console.log('   • curl http://localhost:5001/xacta/systems/SYS-001/assets');
    } else {
        console.log('\n❌ Some tests failed. Check the output above for details.');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testXactaServiceIntegration,
    testTenableXactaCorrelation,
    runAllTests
};
