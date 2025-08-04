#!/usr/bin/env node
/**
 * Test CVE API Endpoints
 * Demonstrates all CVE API functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/cves';

async function testCVEAPI() {
    console.log('🧪 Testing CVE API Endpoints');
    console.log('============================\n');

    try {
        // Test 1: Get CVE statistics
        console.log('📊 Test 1: Get CVE Statistics');
        console.log('------------------------------');
        const statsResponse = await axios.get(`${BASE_URL}/stats/summary`);
        const stats = statsResponse.data;
        
        console.log(`✅ Total CVEs: ${stats.total}`);
        console.log('📈 Severity Distribution:');
        Object.entries(stats.bySeverity).forEach(([severity, count]) => {
            const emoji = {
                critical: '🔴',
                high: '🟠',
                medium: '🟡',
                low: '🟢',
                unscored: '⚪'
            }[severity];
            console.log(`   ${emoji} ${severity}: ${count}`);
        });
        console.log(`🔓 Exploitable CVEs: ${stats.exploitAvailable}`);
        console.log(`🔧 Patchable CVEs: ${stats.patchAvailable}`);
        console.log(`📋 With Guidance: ${stats.withGuidance}`);

        // Test 2: Get critical CVEs
        console.log('\n🔴 Test 2: Get Critical CVEs');
        console.log('-----------------------------');
        const criticalResponse = await axios.get(`${BASE_URL}?severity=critical&limit=5`);
        const criticalData = criticalResponse.data;
        
        console.log(`✅ Found ${criticalData.cves.length} critical CVEs`);
        criticalData.cves.forEach((cve, i) => {
            console.log(`${i+1}. ${cve.cveId} (CVSS: ${cve.cvssScore})`);
            console.log(`   🔓 Exploit: ${cve.exploitAvailable ? '✅' : '❌'} | 🔧 Patch: ${cve.patchAvailable ? '✅' : '❌'}`);
        });

        // Test 3: Get exploitable CVEs
        console.log('\n🔓 Test 3: Get Exploitable CVEs');
        console.log('--------------------------------');
        const exploitResponse = await axios.get(`${BASE_URL}?exploitAvailable=true&limit=5`);
        const exploitData = exploitResponse.data;
        
        console.log(`✅ Found ${exploitData.cves.length} exploitable CVEs`);
        exploitData.cves.forEach((cve, i) => {
            console.log(`${i+1}. ${cve.cveId} (${cve.severity.toUpperCase()}, CVSS: ${cve.cvssScore})`);
        });

        // Test 4: Search for specific vendor
        console.log('\n🔍 Test 4: Search for Microsoft CVEs');
        console.log('------------------------------------');
        const searchResponse = await axios.get(`${BASE_URL}?search=microsoft&limit=5`);
        const searchData = searchResponse.data;
        
        console.log(`✅ Found ${searchData.cves.length} Microsoft-related CVEs`);
        searchData.cves.forEach((cve, i) => {
            console.log(`${i+1}. ${cve.cveId} (${cve.severity.toUpperCase()})`);
            console.log(`   📝 ${cve.description.substring(0, 80)}...`);
        });

        // Test 5: Get specific CVE details
        if (criticalData.cves.length > 0) {
            const sampleCveId = criticalData.cves[0].cveId;
            console.log(`\n📋 Test 5: Get Specific CVE Details (${sampleCveId})`);
            console.log('------------------------------------------------');
            
            const cveResponse = await axios.get(`${BASE_URL}/${sampleCveId}`);
            const cveData = cveResponse.data;
            
            console.log(`✅ CVE Details for ${cveData.cveId}:`);
            console.log(`   📊 CVSS Score: ${cveData.cvssScore} (${cveData.severity.toUpperCase()})`);
            console.log(`   📅 Published: ${new Date(cveData.publishedDate).toLocaleDateString()}`);
            console.log(`   🔓 Exploit Available: ${cveData.exploitAvailable ? '✅ Yes' : '❌ No'}`);
            console.log(`   🔧 Patch Available: ${cveData.patchAvailable ? '✅ Yes' : '❌ No'}`);
            console.log(`   🔗 CWE Mappings: ${cveData.cweMappings?.length || 0}`);
            
            if (cveData.cweMappings && cveData.cweMappings.length > 0) {
                console.log('   📋 CWE Details:');
                cveData.cweMappings.forEach(cwe => {
                    console.log(`      • ${cwe.cweId}: ${cwe.cweName || 'No name available'}`);
                });
            }
            
            if (cveData.remediationGuidance) {
                console.log('   🎯 Remediation Guidance:');
                const guidanceLines = cveData.remediationGuidance.split('\n').slice(0, 3);
                guidanceLines.forEach(line => {
                    console.log(`      ${line}`);
                });
                if (cveData.remediationGuidance.split('\n').length > 3) {
                    console.log(`      ... and ${cveData.remediationGuidance.split('\n').length - 3} more recommendations`);
                }
            }
        }

        // Test 6: Advanced search
        console.log('\n🔍 Test 6: Advanced Search for Critical Exploitable CVEs');
        console.log('--------------------------------------------------------');
        const advancedResponse = await axios.get(`${BASE_URL}/search/advanced?q=buffer&type=critical`);
        const advancedData = advancedResponse.data;
        
        console.log(`✅ Advanced search results: ${advancedData.count} CVEs`);
        console.log(`   Query: "${advancedData.query}" (type: ${advancedData.type})`);
        advancedData.results.slice(0, 3).forEach((cve, i) => {
            console.log(`   ${i+1}. ${cve.cveId} (CVSS: ${cve.cvssScore})`);
        });

        // Test 7: Pagination
        console.log('\n📄 Test 7: Test Pagination');
        console.log('---------------------------');
        const page1Response = await axios.get(`${BASE_URL}?page=1&limit=10`);
        const page1Data = page1Response.data;
        
        console.log(`✅ Page 1: ${page1Data.cves.length} CVEs`);
        console.log(`   📊 Pagination: Page ${page1Data.pagination.page} of ${page1Data.pagination.pages}`);
        console.log(`   📈 Total: ${page1Data.pagination.total} CVEs`);

        // Test 8: Date range filter
        console.log('\n📅 Test 8: Recent CVEs (Last 7 Days)');
        console.log('------------------------------------');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateFrom = sevenDaysAgo.toISOString().split('T')[0];
        
        const recentResponse = await axios.get(`${BASE_URL}?dateFrom=${dateFrom}&limit=5`);
        const recentData = recentResponse.data;
        
        console.log(`✅ Recent CVEs (since ${dateFrom}): ${recentData.cves.length}`);
        recentData.cves.forEach((cve, i) => {
            const publishedDate = new Date(cve.publishedDate).toLocaleDateString();
            console.log(`   ${i+1}. ${cve.cveId} (${publishedDate}, ${cve.severity.toUpperCase()})`);
        });

        console.log('\n🎉 All CVE API tests completed successfully!');
        console.log('\n📋 Available API Endpoints:');
        console.log('   • GET /api/v1/cves - List CVEs with filters');
        console.log('   • GET /api/v1/cves/:cveId - Get specific CVE');
        console.log('   • GET /api/v1/cves/stats/summary - Get statistics');
        console.log('   • GET /api/v1/cves/search/advanced - Advanced search');
        
        console.log('\n💡 Example Usage:');
        console.log('   curl "http://localhost:3000/api/v1/cves?severity=critical&exploitAvailable=true"');
        console.log('   curl "http://localhost:3000/api/v1/cves/CVE-2025-1234"');
        console.log('   curl "http://localhost:3000/api/v1/cves/stats/summary"');

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ API server not running. Please start it first:');
            console.error('   npm run dev');
        } else if (error.response) {
            console.error(`❌ API Error: ${error.response.status} - ${error.response.data?.error || error.message}`);
        } else {
            console.error(`❌ Error: ${error.message}`);
        }
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    testCVEAPI().catch(console.error);
}

module.exports = { testCVEAPI };
