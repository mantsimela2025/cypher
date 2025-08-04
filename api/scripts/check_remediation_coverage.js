#!/usr/bin/env node
/**
 * Check Remediation Guidance Coverage
 * Analyze why some CVEs don't have remediation guidance
 */

const { db } = require('../src/db');
const { cves, cveMappings } = require('../src/db/schema');

async function checkRemediationCoverage() {
    console.log('🔍 Analyzing Remediation Guidance Coverage');
    console.log('==========================================\n');

    try {
        // Get all CVEs
        const allCVEs = await db.select().from(cves);
        console.log(`📊 Total CVEs in database: ${allCVEs.length}`);

        // Analyze remediation guidance coverage
        const withGuidance = allCVEs.filter(cve => cve.remediationGuidance && cve.remediationGuidance.trim().length > 0);
        const withoutGuidance = allCVEs.filter(cve => !cve.remediationGuidance || cve.remediationGuidance.trim().length === 0);

        console.log(`✅ CVEs with remediation guidance: ${withGuidance.length} (${((withGuidance.length/allCVEs.length)*100).toFixed(1)}%)`);
        console.log(`❌ CVEs without remediation guidance: ${withoutGuidance.length} (${((withoutGuidance.length/allCVEs.length)*100).toFixed(1)}%)`);

        // Analyze reasons for missing guidance
        console.log('\n🔍 Analysis of CVEs without guidance:');
        
        const withoutCVSS = withoutGuidance.filter(cve => !cve.cvss3BaseScore && !cve.cvss2BaseScore);
        console.log(`   • No CVSS score: ${withoutCVSS.length} (${((withoutCVSS.length/withoutGuidance.length)*100).toFixed(1)}% of missing)`);

        const withoutDescription = withoutGuidance.filter(cve => !cve.description || cve.description.length < 50);
        console.log(`   • Insufficient description: ${withoutDescription.length} (${((withoutDescription.length/withoutGuidance.length)*100).toFixed(1)}% of missing)`);

        // Check CWE mapping coverage
        const cweCount = await db.select().from(cveMappings);
        const cveIdsWithCWE = [...new Set(cweCount.map(m => m.cveId))];
        const withoutCWE = withoutGuidance.filter(cve => !cveIdsWithCWE.includes(cve.cveId));
        console.log(`   • No CWE mapping: ${withoutCWE.length} (${((withoutCWE.length/withoutGuidance.length)*100).toFixed(1)}% of missing)`);

        // Show sample CVEs without guidance
        console.log('\n📋 Sample CVEs without remediation guidance:');
        withoutGuidance.slice(0, 5).forEach((cve, i) => {
            const score = cve.cvss3BaseScore || cve.cvss2BaseScore || 'None';
            console.log(`\n${i+1}. ${cve.cveId} (CVSS: ${score})`);
            console.log(`   📝 Description: ${cve.description?.substring(0, 100) || 'No description'}...`);
            console.log(`   📊 Has CVSS: ${(cve.cvss3BaseScore || cve.cvss2BaseScore) ? '✅' : '❌'}`);
            console.log(`   🔗 Has CWE: ${cveIdsWithCWE.includes(cve.cveId) ? '✅' : '❌'}`);
            console.log(`   📅 Published: ${cve.publishedDate?.toISOString().split('T')[0] || 'Unknown'}`);
        });

        // Show sample CVEs with good guidance
        console.log('\n📋 Sample CVEs with comprehensive guidance:');
        const goodGuidance = withGuidance
            .filter(cve => cve.remediationGuidance.length > 200)
            .slice(0, 3);

        goodGuidance.forEach((cve, i) => {
            const score = cve.cvss3BaseScore || cve.cvss2BaseScore || 'None';
            console.log(`\n${i+1}. ${cve.cveId} (CVSS: ${score})`);
            console.log(`   📝 Description: ${cve.description?.substring(0, 80)}...`);
            console.log(`   🎯 Guidance (${cve.remediationGuidance.length} chars):`);
            const guidanceLines = cve.remediationGuidance.split('\n').slice(0, 4);
            guidanceLines.forEach(line => console.log(`      ${line}`));
            if (cve.remediationGuidance.split('\n').length > 4) {
                console.log(`      ... and ${cve.remediationGuidance.split('\n').length - 4} more lines`);
            }
        });

        // Analyze by CVSS score ranges
        console.log('\n📊 Guidance coverage by CVSS score:');
        const scoreRanges = [
            { name: 'Critical (9.0-10.0)', min: 9.0, max: 10.0 },
            { name: 'High (7.0-8.9)', min: 7.0, max: 8.9 },
            { name: 'Medium (4.0-6.9)', min: 4.0, max: 6.9 },
            { name: 'Low (0.1-3.9)', min: 0.1, max: 3.9 },
            { name: 'Unscored', min: null, max: null }
        ];

        scoreRanges.forEach(range => {
            let rangeCVEs;
            if (range.min === null) {
                rangeCSVEs = allCVEs.filter(cve => !cve.cvss3BaseScore && !cve.cvss2BaseScore);
            } else {
                rangeCSVEs = allCVEs.filter(cve => {
                    const score = cve.cvss3BaseScore || cve.cvss2BaseScore;
                    return score >= range.min && score <= range.max;
                });
            }
            
            const withGuidanceInRange = rangeCSVEs.filter(cve => cve.remediationGuidance && cve.remediationGuidance.trim().length > 0);
            const coverage = rangeCSVEs.length > 0 ? ((withGuidanceInRange.length / rangeCSVEs.length) * 100).toFixed(1) : '0.0';
            
            console.log(`   • ${range.name}: ${withGuidanceInRange.length}/${rangeCSVEs.length} (${coverage}%)`);
        });

        // Recommendations
        console.log('\n💡 Recommendations to improve coverage:');
        console.log('   1. ✅ Enhanced guidance is now implemented with fallbacks');
        console.log('   2. 🔄 Re-import CVEs to apply enhanced guidance generation');
        console.log('   3. 📊 Focus on CVEs with CVSS scores for priority guidance');
        console.log('   4. 🔗 Import more CWE mappings for specific recommendations');
        console.log('   5. ⏰ Wait for NVD analysis on recent "Awaiting Analysis" CVEs');

        console.log('\n🚀 To apply enhanced guidance:');
        console.log('   npm run import:nvd:enhanced');

    } catch (error) {
        console.error('❌ Error checking remediation coverage:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run check if this file is executed directly
if (require.main === module) {
    checkRemediationCoverage().catch(console.error);
}

module.exports = { checkRemediationCoverage };
