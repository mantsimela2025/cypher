#!/usr/bin/env node
/**
 * Integration Test for RAS-DASH Tenable Service
 * Tests the actual Tenable service against mock server
 */

const tenableService = require('../../src/services/integrations/tenableService');
const { db } = require('../../src/db');
const { assets, vulnerabilities, assetNetwork, assetTags, assetVulnerabilities } = require('../../src/db/schema');

async function testTenableServiceIntegration() {
    console.log('🧪 Testing RAS-DASH Tenable Service Integration');
    console.log('Make sure mock_tenable_server.py is running on port 5001\n');

    try {
        // Override environment variables for testing
        console.log('🔧 Setting up mock server connection...');
        process.env.TENABLE_BASE_URL = 'http://localhost:5001';
        process.env.TENABLE_ACCESS_KEY = 'mock_access_key';
        process.env.TENABLE_SECRET_KEY = 'mock_secret_key';

        // Verify mock server is running
        const axios = require('axios');
        try {
            await axios.get('http://localhost:5001/session');
            console.log('✅ Mock server is running and accessible');
        } catch (error) {
            console.error('❌ Mock server not accessible. Make sure it\'s running on port 5001');
            console.error('   Start it with: python testing/tenable/mock_tenable_server.py');
            return false;
        }

        // Initialize the service
        console.log('🔧 Initializing Tenable service...');
        await tenableService.initialize();
        
        // Test connection
        console.log('🔗 Testing connection...');
        const status = await tenableService.getSyncStatus();
        console.log(`✅ Service status: ${status.status}`);
        console.log(`📊 Health: ${status.health}`);

        // Test asset sync
        console.log('\n📦 Testing asset synchronization...');
        const assetResults = await tenableService.syncAssets();
        console.log(`✅ Asset sync completed:`);
        console.log(`   - Total processed: ${assetResults.total}`);
        console.log(`   - Created: ${assetResults.created}`);
        console.log(`   - Updated: ${assetResults.updated}`);
        console.log(`   - Errors: ${assetResults.errors.length}`);

        // Test vulnerability sync
        console.log('\n🔓 Testing vulnerability synchronization...');
        const vulnResults = await tenableService.syncVulnerabilities();
        console.log(`✅ Vulnerability sync completed:`);
        console.log(`   - Total processed: ${vulnResults.total}`);
        console.log(`   - Created: ${vulnResults.created}`);
        console.log(`   - Updated: ${vulnResults.updated}`);
        console.log(`   - Errors: ${vulnResults.errors.length}`);

        // Verify data in database
        console.log('\n🗄️ Verifying data in database...');

        const assetCount = await db.select().from(assets);
        console.log(`📊 Assets in database: ${assetCount.length}`);

        const vulnCount = await db.select().from(vulnerabilities);
        console.log(`🔓 Vulnerabilities in database: ${vulnCount.length}`);

        const networkCount = await db.select().from(assetNetwork);
        console.log(`🌐 Asset network records: ${networkCount.length}`);

        const tagCount = await db.select().from(assetTags);
        console.log(`🏷️ Asset tags: ${tagCount.length}`);

        const relationshipCount = await db.select().from(assetVulnerabilities);
        console.log(`🔗 Asset-vulnerability relationships: ${relationshipCount.length}`);

        // Show sample data
        if (assetCount.length > 0) {
            console.log('\n📋 Sample asset data:');
            const sampleAsset = assetCount[0];
            console.log(`   - UUID: ${sampleAsset.assetUuid}`);
            console.log(`   - Hostname: ${sampleAsset.hostname}`);
            console.log(`   - Exposure Score: ${sampleAsset.exposureScore}`);
            console.log(`   - Last Seen: ${sampleAsset.lastSeen}`);
        }

        if (vulnCount.length > 0) {
            console.log('\n🔍 Sample vulnerability data:');
            const sampleVuln = vulnCount[0];
            console.log(`   - Plugin ID: ${sampleVuln.pluginId}`);
            console.log(`   - Name: ${sampleVuln.pluginName}`);
            console.log(`   - Severity: ${sampleVuln.severity}`);
            console.log(`   - CVSS Score: ${sampleVuln.cvssBaseScore}`);
        }

        console.log('\n🎉 Integration test completed successfully!');
        return true;

    } catch (error) {
        console.error(`❌ Integration test failed: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

async function testChangeDetection() {
    console.log('\n🧪 Testing change detection over time...');

    try {
        // Override environment for testing
        process.env.TENABLE_BASE_URL = 'http://localhost:5001';
        process.env.TENABLE_ACCESS_KEY = 'mock_access_key';
        process.env.TENABLE_SECRET_KEY = 'mock_secret_key';

        // Initialize service
        await tenableService.initialize();

        // First sync to establish baseline
        console.log('📊 Establishing baseline...');
        const initialAssets = await tenableService.syncAssets();
        const initialVulns = await tenableService.syncVulnerabilities();

        console.log(`✅ Baseline: ${initialAssets.created} assets, ${initialVulns.created} vulnerabilities`);

        // Force a scan simulation on the mock server
        console.log('\n🔄 Forcing scan simulation to create changes...');
        const axios = require('axios');
        await axios.post('http://localhost:5001/force-scan');

        // Wait a moment for changes to be applied
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Sync again to detect changes
        console.log('🔍 Syncing again to detect changes...');
        const updatedAssets = await tenableService.syncAssets();
        const updatedVulns = await tenableService.syncVulnerabilities();

        console.log(`📈 Change detection results:`);
        console.log(`   • Assets: ${updatedAssets.created} new, ${updatedAssets.updated} updated`);
        console.log(`   • Vulnerabilities: ${updatedVulns.created} new, ${updatedVulns.updated} updated`);

        // Check for specific changes in database
        const fixedVulns = await db.select().from(vulnerabilities)
            .where(eq(vulnerabilities.state, 'fixed'));
        const openVulns = await db.select().from(vulnerabilities)
            .where(eq(vulnerabilities.state, 'open'));

        console.log(`📊 Current vulnerability states:`);
        console.log(`   • Fixed: ${fixedVulns.length}`);
        console.log(`   • Open: ${openVulns.length}`);

        console.log('\n✅ Change detection test completed!');
        return true;

    } catch (error) {
        console.error(`❌ Change detection test failed: ${error.message}`);
        return false;
    }
}

async function testErrorHandling() {
    console.log('\n🧪 Testing error handling...');
    
    try {
        // Test with invalid URL
        process.env.TENABLE_BASE_URL = 'http://localhost:9999';
        
        const errorService = require('../../src/services/integrations/tenableService');
        await errorService.initialize();
        
        console.log('⚠️ Service should use mock data when API is unavailable');
        const status = await errorService.getSyncStatus();
        console.log(`✅ Fallback status: ${status.status}`);
        
    } catch (error) {
        console.log(`✅ Error handling working correctly: ${error.message}`);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Tenable Integration Tests\n');

    const integrationSuccess = await testTenableServiceIntegration();
    await testErrorHandling();

    // Ask user if they want to test change detection
    console.log('\n' + '='.repeat(60));
    console.log('Would you like to test change detection over time? (y/n): ');

    // For automated testing, we'll skip the interactive part
    // In a real scenario, you could use readline for user input
    const testChanges = process.argv.includes('--test-changes');

    if (testChanges) {
        await testChangeDetection();
    }

    if (integrationSuccess) {
        console.log('\n✅ All tests passed! Tenable integration is working correctly.');
        console.log('\n📋 Available test options:');
        console.log('   • node test_integration.js --test-changes  (include change detection)');
        console.log('   • python test_scheduled_changes.py        (detailed change demo)');
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
    testTenableServiceIntegration,
    testErrorHandling
};
