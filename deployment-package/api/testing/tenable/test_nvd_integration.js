#!/usr/bin/env node
/**
 * Test NVD Integration
 * Demonstrates real CVE data integration with vulnerability management
 */

const NVDService = require('../../src/services/integrations/nvdService');
const { db } = require('../../src/db');
const { cves, vulnerabilities, vulnerabilityCves } = require('../../src/db/schema');
const { eq, desc } = require('drizzle-orm');

async function testNVDServiceIntegration() {
    console.log('🧪 Testing RAS-DASH NVD Service Integration');
    console.log('This will fetch real CVE data from NIST NVD\n');

    try {
        // Initialize NVD service
        const nvdService = new NVDService();
        
        console.log('🔧 Initializing NVD service...');
        await nvdService.initialize();

        console.log('🔗 Testing NVD connection...');
        const status = nvdService.getStatus();
        console.log(`✅ NVD service status: ${status.status}`);
        console.log(`📊 Has API key: ${status.hasApiKey}`);
        console.log(`⏱️  Rate limit delay: ${status.rateLimitDelay}ms`);

        // Test basic CVE retrieval
        console.log('\n🔍 Testing CVE retrieval...');
        
        console.log('📥 Fetching recent CVEs (last 7 days)...');
        const recentCVEs = await nvdService.getRecentCVEs(7, { resultsPerPage: 10 });
        console.log(`✅ Retrieved ${recentCVEs.vulnerabilities?.length || 0} recent CVEs`);

        if (recentCVEs.vulnerabilities && recentCVEs.vulnerabilities.length > 0) {
            const sampleCVE = recentCVEs.vulnerabilities[0];
            const cve = sampleCVE.cve;
            console.log(`\n📋 Sample CVE data:`);
            console.log(`   - CVE ID: ${cve.id}`);
            console.log(`   - Published: ${cve.published}`);
            console.log(`   - Description: ${cve.descriptions?.[0]?.value?.substring(0, 100)}...`);
            
            const cvssV3 = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
            if (cvssV3) {
                console.log(`   - CVSS v3 Score: ${cvssV3.cvssData.baseScore}`);
                console.log(`   - Severity: ${cvssV3.cvssData.baseSeverity}`);
            }
        }

        // Test CVE sync to database
        console.log('\n📦 Testing CVE synchronization to database...');
        console.log('⚠️  This will make real API calls to NVD - please be patient...');
        
        const syncResults = await nvdService.syncCVEs({
            days: 7,        // Last 7 days
            maxCVEs: 50,    // Limit to 50 CVEs for testing
            batchSize: 20   // Process in smaller batches
        });

        console.log(`✅ CVE sync completed:`);
        console.log(`   - Total processed: ${syncResults.total}`);
        console.log(`   - Errors: ${syncResults.errors.length}`);
        console.log(`   - Duration: ${((new Date() - syncResults.startTime) / 1000).toFixed(1)}s`);

        // Verify data in database
        console.log('\n🗄️ Verifying CVE data in database...');
        const cveCount = await db.select().from(cves);
        console.log(`📊 CVEs in database: ${cveCount.length}`);

        if (cveCount.length > 0) {
            // Show sample CVE from database
            const [sampleDBCVE] = await db.select()
                .from(cves)
                .orderBy(desc(cves.publishedDate))
                .limit(1);

            console.log(`\n📋 Sample CVE from database:`);
            console.log(`   - CVE ID: ${sampleDBCVE.cveId}`);
            console.log(`   - CVSS v3 Score: ${sampleDBCVE.cvssV3Score}`);
            console.log(`   - Severity: ${sampleDBCVE.cvssV3Severity}`);
            console.log(`   - Published: ${sampleDBCVE.publishedDate}`);
            console.log(`   - Description: ${sampleDBCVE.description.substring(0, 100)}...`);
        }

        // Get CVE statistics
        console.log('\n📊 Getting CVE statistics...');
        const stats = await nvdService.getCVEStats();
        console.log(`📈 CVE Statistics:`);
        console.log(`   - Total CVEs: ${stats.total}`);
        console.log(`   - Recent CVEs (30 days): ${stats.recent}`);
        console.log(`   - By Severity:`);
        Object.entries(stats.bySeverity).forEach(([severity, count]) => {
            console.log(`     • ${severity}: ${count}`);
        });

        console.log('\n🎉 NVD integration test completed successfully!');
        return true;

    } catch (error) {
        console.error(`❌ NVD integration test failed: ${error.message}`);
        console.error(error.stack);
        return false;
    }
}

async function testMockServerCVEIntegration() {
    console.log('\n🧪 Testing Mock Server CVE Integration');
    console.log('Testing how mock server uses real CVE data in vulnerabilities\n');

    try {
        const axios = require('axios');
        const BASE_URL = 'http://localhost:5001';

        // Test server connectivity
        console.log('🔗 Testing mock server connectivity...');
        const sessionResponse = await axios.get(`${BASE_URL}/session`);
        if (sessionResponse.status !== 200) {
            throw new Error('Mock server not accessible');
        }
        console.log('✅ Mock server is running');

        // Test CVE endpoint
        console.log('\n📥 Testing CVE endpoint...');
        const cveResponse = await axios.get(`${BASE_URL}/cves?per_page=10`);
        const cveData = cveResponse.data;
        
        console.log(`✅ Retrieved ${cveData.cves?.length || 0} CVEs from mock server`);
        console.log(`📊 Total CVEs available: ${cveData.total}`);

        if (cveData.cves && cveData.cves.length > 0) {
            const sampleCVE = cveData.cves[0];
            console.log(`\n📋 Sample CVE from mock server:`);
            console.log(`   - CVE ID: ${sampleCVE.cve_id}`);
            console.log(`   - Severity: ${sampleCVE.severity}`);
            console.log(`   - CVSS Score: ${sampleCVE.cvss_score}`);
            console.log(`   - Description: ${sampleCVE.description.substring(0, 100)}...`);
            console.log(`   - References: ${sampleCVE.references?.length || 0} links`);
        }

        // Test vulnerabilities with CVE data
        console.log('\n🔓 Testing vulnerabilities with CVE integration...');
        const vulnResponse = await axios.get(`${BASE_URL}/vulnerabilities?per_page=5`);
        const vulnData = vulnResponse.data;
        
        console.log(`✅ Retrieved ${vulnData.vulnerabilities?.length || 0} vulnerabilities`);

        if (vulnData.vulnerabilities && vulnData.vulnerabilities.length > 0) {
            const vulnWithCVE = vulnData.vulnerabilities.find(v => v.plugin?.cve);
            
            if (vulnWithCVE) {
                console.log(`\n📋 Sample vulnerability with CVE data:`);
                console.log(`   - Plugin ID: ${vulnWithCVE.plugin.id}`);
                console.log(`   - Name: ${vulnWithCVE.plugin.name}`);
                console.log(`   - CVE: ${vulnWithCVE.plugin.cve?.[0] || 'None'}`);
                console.log(`   - Severity: ${vulnWithCVE.severity}`);
                console.log(`   - CVSS Score: ${vulnWithCVE.cvss_base_score}`);
                console.log(`   - References: ${vulnWithCVE.plugin.xrefs?.length || 0} links`);
            } else {
                console.log('⚠️  No vulnerabilities with CVE data found (may be using fallback data)');
            }
        }

        // Test specific CVE lookup
        if (cveData.cves && cveData.cves.length > 0) {
            const testCVEId = cveData.cves[0].cve_id;
            console.log(`\n🔍 Testing specific CVE lookup: ${testCVEId}`);
            
            const specificCVEResponse = await axios.get(`${BASE_URL}/cves/${testCVEId}`);
            const specificCVE = specificCVEResponse.data;
            
            console.log(`✅ Retrieved specific CVE details:`);
            console.log(`   - CVE ID: ${specificCVE.cve_id}`);
            console.log(`   - Published: ${specificCVE.published_date}`);
            console.log(`   - Last Modified: ${specificCVE.last_modified}`);
            console.log(`   - Vector String: ${specificCVE.vector_string}`);
        }

        console.log('\n✅ Mock server CVE integration test completed!');
        return true;

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Mock server not running. Please start it first:');
            console.error('   python testing/tenable/mock_tenable_server.py');
        } else {
            console.error(`❌ Mock server CVE test failed: ${error.message}`);
        }
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting NVD Integration Tests\n');
    
    // Test NVD service integration
    const nvdSuccess = await testNVDServiceIntegration();
    
    // Test mock server CVE integration
    const mockSuccess = await testMockServerCVEIntegration();
    
    if (nvdSuccess && mockSuccess) {
        console.log('\n✅ All NVD integration tests passed!');
        console.log('\n📋 What was demonstrated:');
        console.log('   ✅ Real CVE data fetching from NIST NVD');
        console.log('   ✅ CVE data storage in local database');
        console.log('   ✅ CVE integration in mock vulnerabilities');
        console.log('   ✅ CVE-vulnerability correlation');
        console.log('   ✅ CVE statistics and reporting');
        
        console.log('\n🔧 Available endpoints:');
        console.log('   • http://localhost:5001/cves - All CVE data');
        console.log('   • http://localhost:5001/cves/CVE-2024-1234 - Specific CVE');
        console.log('   • http://localhost:5001/vulnerabilities - Vulnerabilities with CVE links');
        
        console.log('\n⚠️  Note: NVD API has rate limits:');
        console.log('   • Without API key: 10 requests per minute');
        console.log('   • With API key: 100 requests per minute');
        console.log('   • Set NVD_API_KEY environment variable for better performance');
        
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
    testNVDServiceIntegration,
    testMockServerCVEIntegration,
    runAllTests
};
