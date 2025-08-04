#!/usr/bin/env node
/**
 * Check CVE Data Script
 * Verify and analyze CVE data in the database
 */

const { db } = require('../src/db');
const { cves, cveMappings } = require('../src/db/schema');
const { eq, desc, gte, count, sql } = require('drizzle-orm');

async function checkCVEData() {
    console.log('🔍 Checking CVE Data in Database');
    console.log('=================================\n');

    try {
        // Get total count
        console.log('📊 Basic Statistics:');
        const totalCVEs = await db.select().from(cves);
        console.log(`   • Total CVEs: ${totalCVEs.length}`);

        if (totalCVEs.length === 0) {
            console.log('\n❌ No CVE data found in database.');
            console.log('💡 Run the import script first:');
            console.log('   npm run import:nvd');
            return;
        }

        // Get date range
        const oldestCVE = await db.select()
            .from(cves)
            .orderBy(cves.publishedDate)
            .limit(1);
        
        const newestCVE = await db.select()
            .from(cves)
            .orderBy(desc(cves.publishedDate))
            .limit(1);

        console.log(`   • Date range: ${oldestCVE[0]?.publishedDate?.toISOString().split('T')[0]} to ${newestCVE[0]?.publishedDate?.toISOString().split('T')[0]}`);

        // Get severity distribution (derive from CVSS scores)
        console.log('\n📈 Severity Distribution:');
        const severityStats = {};
        totalCVEs.forEach(cve => {
            const score = cve.cvss3BaseScore || cve.cvss2BaseScore;
            let severity = 'Unknown';

            if (score) {
                if (score >= 9.0) severity = 'CRITICAL';
                else if (score >= 7.0) severity = 'HIGH';
                else if (score >= 4.0) severity = 'MEDIUM';
                else if (score >= 0.1) severity = 'LOW';
            }

            severityStats[severity] = (severityStats[severity] || 0) + 1;
        });

        Object.entries(severityStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([severity, count]) => {
                const emoji = {
                    'CRITICAL': '🔴',
                    'HIGH': '🟠',
                    'MEDIUM': '🟡', 
                    'LOW': '🟢',
                    'Unknown': '⚪'
                }[severity.toUpperCase()] || '⚪';
                const percentage = ((count / totalCVEs.length) * 100).toFixed(1);
                console.log(`   ${emoji} ${severity}: ${count} (${percentage}%)`);
            });

        // Get CVSS score distribution
        console.log('\n📊 CVSS Score Distribution:');
        const scoreRanges = {
            'Critical (9.0-10.0)': 0,
            'High (7.0-8.9)': 0,
            'Medium (4.0-6.9)': 0,
            'Low (0.1-3.9)': 0,
            'None/Unknown': 0
        };

        totalCVEs.forEach(cve => {
            const score = cve.cvss3BaseScore || cve.cvss2BaseScore;
            if (!score) {
                scoreRanges['None/Unknown']++;
            } else if (score >= 9.0) {
                scoreRanges['Critical (9.0-10.0)']++;
            } else if (score >= 7.0) {
                scoreRanges['High (7.0-8.9)']++;
            } else if (score >= 4.0) {
                scoreRanges['Medium (4.0-6.9)']++;
            } else {
                scoreRanges['Low (0.1-3.9)']++;
            }
        });

        Object.entries(scoreRanges).forEach(([range, count]) => {
            const percentage = ((count / totalCVEs.length) * 100).toFixed(1);
            console.log(`   • ${range}: ${count} (${percentage}%)`);
        });

        // Show recent high-severity CVEs
        console.log('\n🔴 Recent High-Severity CVEs:');
        const highSeverityCVEs = await db.select()
            .from(cves)
            .where(sql`(${cves.cvss3BaseScore} >= 7.0 OR ${cves.cvss2BaseScore} >= 7.0)`)
            .orderBy(desc(cves.publishedDate))
            .limit(10);

        if (highSeverityCVEs.length > 0) {
            highSeverityCVEs.forEach((cve, i) => {
                const score = cve.cvss3BaseScore || cve.cvss2BaseScore || 'N/A';
                let severity = 'Unknown';
                if (score && score >= 9.0) severity = 'CRITICAL';
                else if (score && score >= 7.0) severity = 'HIGH';

                console.log(`   ${i+1}. ${cve.cveId}`);
                console.log(`      • Score: ${score} (${severity})`);
                console.log(`      • Published: ${cve.publishedDate?.toISOString().split('T')[0]}`);
                console.log(`      • Description: ${cve.description.substring(0, 80)}...`);
            });
        } else {
            console.log('   No high-severity CVEs found');
        }

        // Check for CWE mappings
        console.log('\n🔗 CWE Mappings:');
        const cweMappingsCount = await db.select().from(cveMappings);
        console.log(`   • Total CWE mappings: ${cweMappingsCount.length}`);

        if (cweMappingsCount.length > 0) {
            // Show sample CWE mappings
            const sampleMappings = await db.select()
                .from(cveMappings)
                .limit(5);

            console.log('   • Sample CWE mappings:');
            sampleMappings.forEach((mapping, i) => {
                console.log(`     ${i+1}. ${mapping.cveId} → ${mapping.cweId}`);
            });
        }

        // Check data quality
        console.log('\n✅ Data Quality Check:');
        const withCVSSv3 = totalCVEs.filter(cve => cve.cvss3BaseScore).length;
        const withCVSSv2 = totalCVEs.filter(cve => cve.cvss2BaseScore).length;
        const withDescription = totalCVEs.filter(cve => cve.description && cve.description.length > 10).length;

        // Check CWE mappings in separate table
        const cweCount = await db.select().from(cveMappings);

        console.log(`   • CVEs with CVSS v3: ${withCVSSv3} (${((withCVSSv3/totalCVEs.length)*100).toFixed(1)}%)`);
        console.log(`   • CVEs with CVSS v2: ${withCVSSv2} (${((withCVSSv2/totalCVEs.length)*100).toFixed(1)}%)`);
        console.log(`   • CVEs with description: ${withDescription} (${((withDescription/totalCVEs.length)*100).toFixed(1)}%)`);
        console.log(`   • CVE-CWE mappings: ${cweCount.length}`);

        // Show storage info
        console.log('\n💾 Storage Information:');
        const avgDescLength = totalCVEs.reduce((sum, cve) => sum + (cve.description?.length || 0), 0) / totalCVEs.length;
        console.log(`   • Average description length: ${avgDescLength.toFixed(0)} characters`);
        console.log(`   • Data sources: NVD (National Vulnerability Database)`);
        console.log(`   • Last updated: ${newestCVE[0]?.lastModifiedDate?.toISOString().split('T')[0] || 'Unknown'}`);

        console.log('\n🎉 CVE data check completed!');
        console.log('\n💡 Usage suggestions:');
        console.log('   • Link CVEs to vulnerabilities in vulnerability management');
        console.log('   • Use CVSS scores for risk prioritization');
        console.log('   • Reference CVE descriptions in security reports');
        console.log('   • Set up automated updates for new CVEs');

    } catch (error) {
        console.error('\n❌ Error checking CVE data:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run check if this file is executed directly
if (require.main === module) {
    checkCVEData().catch(console.error);
}

module.exports = { checkCVEData };
