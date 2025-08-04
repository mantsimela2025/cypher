#!/usr/bin/env node
/**
 * Enhanced NVD Import Script
 * Imports CVE data with enhanced fields: exploit_available, patch_available, remediation_guidance, search_vector
 */

const NVDService = require('../src/services/integrations/nvdService');
const { db } = require('../src/db');
const { cves } = require('../src/db/schema');
const { desc } = require('drizzle-orm');

async function importEnhancedNVD() {
    console.log('🚀 Enhanced NVD CVE Import with Complete Field Population');
    console.log('=========================================================\n');

    try {
        // Initialize NVD service
        const nvdService = new NVDService();
        await nvdService.initialize();

        console.log('🔄 Starting enhanced CVE import...');
        console.log('This will populate ALL CVE fields including:');
        console.log('   • exploit_available (analyzed from references)');
        console.log('   • patch_available (analyzed from status/references)');
        console.log('   • remediation_guidance (generated based on CVSS/CWE)');
        console.log('   • search_vector (for full-text search)\n');

        // Import with enhanced processing
        const syncResults = await nvdService.syncCVEs({
            days: 14,        // Last 2 weeks for good mix of data
            maxCVEs: 200,    // Smaller batch for testing
            batchSize: 25    // Process in smaller batches
        });

        console.log('\n✅ Enhanced CVE Import Completed!');
        console.log('==================================');
        console.log(`   • Duration: ${((new Date() - syncResults.startTime) / 1000).toFixed(1)}s`);
        console.log(`   • Total processed: ${syncResults.total}`);
        console.log(`   • Errors: ${syncResults.errors.length}`);

        // Verify enhanced data
        console.log('\n📊 Verifying enhanced CVE data...');
        const allCVEs = await db.select().from(cves);
        
        // Count enhanced fields
        const withExploits = allCVEs.filter(cve => cve.exploitAvailable).length;
        const withPatches = allCVEs.filter(cve => cve.patchAvailable).length;
        const withGuidance = allCVEs.filter(cve => cve.remediationGuidance).length;
        const withSearchVector = allCVEs.filter(cve => cve.searchVector).length;

        console.log(`   • Total CVEs: ${allCVEs.length}`);
        console.log(`   • With exploit indicators: ${withExploits} (${((withExploits/allCVEs.length)*100).toFixed(1)}%)`);
        console.log(`   • With patch indicators: ${withPatches} (${((withPatches/allCVEs.length)*100).toFixed(1)}%)`);
        console.log(`   • With remediation guidance: ${withGuidance} (${((withGuidance/allCVEs.length)*100).toFixed(1)}%)`);
        console.log(`   • With search vectors: ${withSearchVector} (${((withSearchVector/allCVEs.length)*100).toFixed(1)}%)`);

        // Show sample enhanced CVEs
        console.log('\n📋 Sample Enhanced CVEs:');
        const sampleCVEs = await db.select()
            .from(cves)
            .orderBy(desc(cves.cvss3BaseScore))
            .limit(3);

        sampleCVEs.forEach((cve, i) => {
            const score = cve.cvss3BaseScore || cve.cvss2BaseScore || 'N/A';
            console.log(`\n${i+1}. ${cve.cveId} (CVSS: ${score})`);
            console.log(`   📝 Description: ${cve.description.substring(0, 100)}...`);
            console.log(`   🔓 Exploit Available: ${cve.exploitAvailable ? '✅ Yes' : '❌ No'}`);
            console.log(`   🔧 Patch Available: ${cve.patchAvailable ? '✅ Yes' : '❌ No'}`);
            console.log(`   🎯 Remediation Guidance:`);
            if (cve.remediationGuidance) {
                const guidance = cve.remediationGuidance.split('\n').slice(0, 3);
                guidance.forEach(line => console.log(`      ${line}`));
                if (cve.remediationGuidance.split('\n').length > 3) {
                    console.log(`      ... and ${cve.remediationGuidance.split('\n').length - 3} more recommendations`);
                }
            } else {
                console.log('      No guidance available');
            }
            console.log(`   🔍 Search Terms: ${cve.searchVector?.split(' ').slice(0, 8).join(', ')}...`);
        });

        // Show exploit analysis
        console.log('\n🔓 Exploit Analysis:');
        const exploitCVEs = await db.select()
            .from(cves)
            .limit(1000);
        
        const exploitAvailable = exploitCVEs.filter(cve => cve.exploitAvailable);
        if (exploitAvailable.length > 0) {
            console.log(`   • CVEs with known exploits: ${exploitAvailable.length}`);
            console.log('   • Sample exploitable CVEs:');
            exploitAvailable.slice(0, 5).forEach((cve, i) => {
                const score = cve.cvss3BaseScore || cve.cvss2BaseScore || 'N/A';
                console.log(`     ${i+1}. ${cve.cveId} (CVSS: ${score})`);
            });
        } else {
            console.log('   • No CVEs with exploit indicators found in this batch');
        }

        // Show patch analysis
        console.log('\n🔧 Patch Analysis:');
        const patchAvailable = exploitCVEs.filter(cve => cve.patchAvailable);
        if (patchAvailable.length > 0) {
            console.log(`   • CVEs with available patches: ${patchAvailable.length}`);
            console.log('   • Sample patched CVEs:');
            patchAvailable.slice(0, 5).forEach((cve, i) => {
                const score = cve.cvss3BaseScore || cve.cvss2BaseScore || 'N/A';
                console.log(`     ${i+1}. ${cve.cveId} (CVSS: ${score})`);
            });
        } else {
            console.log('   • No CVEs with patch indicators found in this batch');
        }

        console.log('\n🎉 Enhanced NVD import completed successfully!');
        console.log('\n💡 Enhanced Features Now Available:');
        console.log('   ✅ Exploit detection from references and descriptions');
        console.log('   ✅ Patch availability analysis from vendor advisories');
        console.log('   ✅ Automated remediation guidance based on CVSS/CWE');
        console.log('   ✅ Full-text search vectors for advanced querying');
        console.log('   ✅ CWE-specific security recommendations');
        
        console.log('\n🔧 Usage Examples:');
        console.log('   • Query exploitable CVEs: SELECT * FROM cves WHERE exploit_available = true;');
        console.log('   • Find patchable CVEs: SELECT * FROM cves WHERE patch_available = true;');
        console.log('   • Search CVEs: SELECT * FROM cves WHERE search_vector LIKE \'%microsoft%\';');
        console.log('   • Get guidance: SELECT cve_id, remediation_guidance FROM cves WHERE cvss3_base_score >= 7.0;');

    } catch (error) {
        console.error('\n❌ Enhanced NVD import failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run import if this file is executed directly
if (require.main === module) {
    importEnhancedNVD().catch(console.error);
}

module.exports = { importEnhancedNVD };
