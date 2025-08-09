#!/usr/bin/env node
/**
 * Import NVD CVE Data Script
 * Fetches real CVE data from NIST NVD and populates the local CVE database table
 */

const NVDService = require('../src/services/integrations/nvdService');
const { db } = require('../src/db');
const { cves } = require('../src/db/schema');
const { eq, desc, gte } = require('drizzle-orm');

async function importNVDData(options = {}) {
    console.log('🚀 Starting NVD CVE Data Import');
    console.log('=====================================\n');

    const {
        days = 30,           // Import CVEs from last N days
        maxCVEs = 1000,      // Maximum CVEs to import
        batchSize = 50,      // Process in batches
        force = false        // Force reimport even if data exists
    } = options;

    try {
        // Initialize NVD service
        console.log('🔧 Initializing NVD service...');
        const nvdService = new NVDService();
        await nvdService.initialize();

        const status = nvdService.getStatus();
        console.log(`✅ NVD service initialized`);
        console.log(`   • API Key: ${status.hasApiKey ? '✅ Configured' : '❌ Not configured'}`);
        console.log(`   • Rate Limit: ${status.rateLimitDelay}ms between requests`);
        console.log(`   • Max Requests/min: ${status.hasApiKey ? '100' : '10'}`);

        // Check existing data
        console.log('\n📊 Checking existing CVE data...');
        const existingCVEs = await db.select().from(cves);
        console.log(`   • Existing CVEs in database: ${existingCVEs.length}`);

        if (existingCVEs.length > 0 && !force) {
            console.log('\n⚠️  CVE data already exists in database.');
            console.log('   Use --force flag to reimport or --incremental for updates only');
            
            // Show recent CVEs
            const recentCVEs = await db.select()
                .from(cves)
                .orderBy(desc(cves.publishedDate))
                .limit(5);

            console.log('\n📋 Most recent CVEs in database:');
            recentCVEs.forEach((cve, i) => {
                console.log(`   ${i+1}. ${cve.cveId} - ${cve.cvssV3Severity || 'Unknown'} (${cve.publishedDate?.toISOString().split('T')[0]})`);
            });

            console.log('\n💡 To proceed anyway, run with --force flag');
            return;
        }

        // Start import process
        console.log(`\n🔄 Starting CVE import process...`);
        console.log(`   • Time range: Last ${days} days`);
        console.log(`   • Max CVEs: ${maxCVEs}`);
        console.log(`   • Batch size: ${batchSize}`);

        const startTime = new Date();
        
        // Import CVEs
        const syncResults = await nvdService.syncCVEs({
            days: days,
            maxCVEs: maxCVEs,
            batchSize: batchSize
        });

        const duration = (new Date() - startTime) / 1000;

        // Show results
        console.log('\n✅ CVE Import Completed!');
        console.log('========================');
        console.log(`   • Duration: ${duration.toFixed(1)} seconds`);
        console.log(`   • Total processed: ${syncResults.total}`);
        console.log(`   • Errors: ${syncResults.errors.length}`);

        if (syncResults.errors.length > 0) {
            console.log('\n❌ Errors encountered:');
            syncResults.errors.slice(0, 5).forEach((error, i) => {
                console.log(`   ${i+1}. ${error.cveId}: ${error.error}`);
            });
            if (syncResults.errors.length > 5) {
                console.log(`   ... and ${syncResults.errors.length - 5} more errors`);
            }
        }

        // Verify import
        console.log('\n📊 Verifying imported data...');
        const finalCount = await db.select().from(cves);
        console.log(`   • Total CVEs in database: ${finalCount.length}`);

        // Get statistics
        const stats = await nvdService.getCVEStats();
        console.log('\n📈 CVE Statistics:');
        console.log(`   • Total CVEs: ${stats.total}`);
        console.log(`   • Recent CVEs (30 days): ${stats.recent}`);
        console.log('   • By Severity:');
        Object.entries(stats.bySeverity).forEach(([severity, count]) => {
            const emoji = {
                'CRITICAL': '🔴',
                'HIGH': '🟠', 
                'MEDIUM': '🟡',
                'LOW': '🟢',
                'unknown': '⚪'
            }[severity.toUpperCase()] || '⚪';
            console.log(`     ${emoji} ${severity}: ${count}`);
        });

        // Show sample CVEs
        console.log('\n📋 Sample imported CVEs:');
        const sampleCVEs = await db.select()
            .from(cves)
            .orderBy(desc(cves.cvss3BaseScore))
            .limit(5);

        sampleCVEs.forEach((cve, i) => {
            const severity = cve.cvssV3Severity || 'Unknown';
            const score = cve.cvssV3Score || 'N/A';
            console.log(`   ${i+1}. ${cve.cveId}`);
            console.log(`      • Severity: ${severity} (CVSS: ${score})`);
            console.log(`      • Published: ${cve.publishedDate?.toISOString().split('T')[0]}`);
            console.log(`      • Description: ${cve.description.substring(0, 80)}...`);
        });

        console.log('\n🎉 NVD data import completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   • Run vulnerability sync to link CVEs to vulnerabilities');
        console.log('   • Use CVE data in risk assessments and reporting');
        console.log('   • Set up scheduled imports for ongoing updates');

    } catch (error) {
        console.error('\n❌ NVD import failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

async function showImportOptions() {
    console.log('📋 NVD Import Options:');
    console.log('======================');
    console.log('');
    console.log('Basic usage:');
    console.log('  node scripts/import_nvd_data.js');
    console.log('');
    console.log('Options:');
    console.log('  --days=N        Import CVEs from last N days (default: 30)');
    console.log('  --max=N         Maximum CVEs to import (default: 1000)');
    console.log('  --batch=N       Batch size for processing (default: 50)');
    console.log('  --force         Force reimport even if data exists');
    console.log('  --help          Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/import_nvd_data.js --days=7 --max=500');
    console.log('  node scripts/import_nvd_data.js --force');
    console.log('  node scripts/import_nvd_data.js --days=90 --max=2000 --batch=100');
    console.log('');
    console.log('⚠️  Note: NVD API has rate limits. With API key: 100 req/min, without: 10 req/min');
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};

    for (const arg of args) {
        if (arg === '--help') {
            showImportOptions();
            process.exit(0);
        } else if (arg === '--force') {
            options.force = true;
        } else if (arg.startsWith('--days=')) {
            options.days = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--max=')) {
            options.maxCVEs = parseInt(arg.split('=')[1]);
        } else if (arg.startsWith('--batch=')) {
            options.batchSize = parseInt(arg.split('=')[1]);
        }
    }

    return options;
}

// Run import if this file is executed directly
if (require.main === module) {
    const options = parseArgs();
    importNVDData(options).catch(console.error);
}

module.exports = { importNVDData };
