#!/usr/bin/env node
/**
 * Debug NVD Response Script
 * Check what data structure NVD actually returns
 */

const NVDService = require('../src/services/integrations/nvdService');

async function debugNVDResponse() {
    console.log('🔍 Debugging NVD API Response Structure');
    console.log('======================================\n');

    try {
        const nvdService = new NVDService();
        await nvdService.initialize();

        console.log('📥 Fetching a small sample of CVEs...');
        const response = await nvdService.getRecentCVEs(1, { resultsPerPage: 3 });
        
        if (response.vulnerabilities && response.vulnerabilities.length > 0) {
            const sampleCVE = response.vulnerabilities[0];
            const cve = sampleCVE.cve;
            
            console.log(`\n📋 Sample CVE: ${cve.id}`);
            console.log('=====================================');
            
            // Check metrics structure
            console.log('\n🔍 Metrics Structure:');
            if (cve.metrics) {
                console.log('Available metric types:', Object.keys(cve.metrics));
                
                // Check CVSS v3.1
                if (cve.metrics.cvssMetricV31) {
                    console.log('\n📊 CVSS v3.1 Data:');
                    const cvssV31 = cve.metrics.cvssMetricV31[0];
                    console.log('  • Base Score:', cvssV31.cvssData?.baseScore);
                    console.log('  • Vector String:', cvssV31.cvssData?.vectorString);
                    console.log('  • Base Severity:', cvssV31.cvssData?.baseSeverity);
                    console.log('  • Full cvssData keys:', Object.keys(cvssV31.cvssData || {}));
                }
                
                // Check CVSS v3.0
                if (cve.metrics.cvssMetricV30) {
                    console.log('\n📊 CVSS v3.0 Data:');
                    const cvssV30 = cve.metrics.cvssMetricV30[0];
                    console.log('  • Base Score:', cvssV30.cvssData?.baseScore);
                    console.log('  • Vector String:', cvssV30.cvssData?.vectorString);
                    console.log('  • Base Severity:', cvssV30.cvssData?.baseSeverity);
                }
                
                // Check CVSS v2
                if (cve.metrics.cvssMetricV2) {
                    console.log('\n📊 CVSS v2 Data:');
                    const cvssV2 = cve.metrics.cvssMetricV2[0];
                    console.log('  • Base Score:', cvssV2.cvssData?.baseScore);
                    console.log('  • Vector String:', cvssV2.cvssData?.vectorString);
                    console.log('  • Base Severity:', cvssV2.cvssData?.baseSeverity);
                }
            } else {
                console.log('❌ No metrics found in CVE data');
            }
            
            // Check weaknesses structure
            console.log('\n🔍 Weaknesses Structure:');
            if (cve.weaknesses && cve.weaknesses.length > 0) {
                console.log('Number of weakness entries:', cve.weaknesses.length);
                const weakness = cve.weaknesses[0];
                console.log('Sample weakness structure:', {
                    source: weakness.source,
                    type: weakness.type,
                    description: weakness.description?.map(d => ({ lang: d.lang, value: d.value }))
                });
            } else {
                console.log('❌ No weaknesses found in CVE data');
            }
            
            // Check references structure
            console.log('\n🔍 References Structure:');
            if (cve.references && cve.references.length > 0) {
                console.log('Number of references:', cve.references.length);
                const ref = cve.references[0];
                console.log('Sample reference:', {
                    url: ref.url,
                    source: ref.source,
                    tags: ref.tags
                });
            } else {
                console.log('❌ No references found in CVE data');
            }
            
            // Show full structure (truncated)
            console.log('\n🔍 Full CVE Structure (keys):');
            console.log('Top-level keys:', Object.keys(cve));
            
            // Show raw JSON for first CVE (truncated)
            console.log('\n📄 Raw JSON Sample (first 500 chars):');
            const jsonStr = JSON.stringify(sampleCVE, null, 2);
            console.log(jsonStr.substring(0, 500) + '...');
            
        } else {
            console.log('❌ No CVE data returned from NVD API');
        }
        
    } catch (error) {
        console.error('❌ Error debugging NVD response:', error.message);
        console.error(error.stack);
    }
}

// Run debug if this file is executed directly
if (require.main === module) {
    debugNVDResponse().catch(console.error);
}

module.exports = { debugNVDResponse };
