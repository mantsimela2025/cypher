#!/usr/bin/env node

/**
 * Add Scanner Settings Script
 * 
 * This script adds comprehensive scanner settings to the settings table
 * to support the scan management settings interface.
 * 
 * Usage: node scripts/add_scanner_settings.js
 */

const postgres = require('postgres');
require('dotenv').config();

async function addScannerSettings() {
  const sql = postgres({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'ras_dashboard',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  console.log('🔧 Adding comprehensive scanner settings...');

  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    console.log('📝 Adding scanner settings...');

    // Comprehensive scanner settings
    const scannerSettings = [
      // Core scanner engine settings
      {
        key: 'scanner_max_concurrent',
        value: '4',
        data_type: 'number',
        category: 'scanner',
        description: 'Maximum number of concurrent scanning threads',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scanner_default_timeout',
        value: '120',
        data_type: 'number',
        category: 'scanner',
        description: 'Default scan timeout in minutes',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scanner_retry_count',
        value: '3',
        data_type: 'number',
        category: 'scanner',
        description: 'Number of times to retry failed operations',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scanner_scan_depth',
        value: 'thorough',
        data_type: 'string',
        category: 'scanner',
        description: 'Default depth level for vulnerability scanning (quick, thorough, comprehensive)',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scanner_reduce_load_during_business_hours',
        value: 'true',
        data_type: 'boolean',
        category: 'scanner',
        description: 'Automatically throttle scan performance during business hours',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scanner_results_retention',
        value: '90',
        data_type: 'number',
        category: 'scanner',
        description: 'Scan results retention period in days',
        is_public: false,
        is_editable: true
      },

      // Notification settings
      {
        key: 'notifications_scan_complete',
        value: 'true',
        data_type: 'boolean',
        category: 'notifications',
        description: 'Send notifications when scans complete',
        is_public: false,
        is_editable: true
      },
      {
        key: 'notifications_scan_failed',
        value: 'true',
        data_type: 'boolean',
        category: 'notifications',
        description: 'Send notifications when scans fail',
        is_public: false,
        is_editable: true
      },
      {
        key: 'notifications_high_severity_findings',
        value: 'true',
        data_type: 'boolean',
        category: 'notifications',
        description: 'Send alerts for high severity findings',
        is_public: false,
        is_editable: true
      },
      {
        key: 'notifications_email_enabled',
        value: 'true',
        data_type: 'boolean',
        category: 'notifications',
        description: 'Enable email notifications',
        is_public: false,
        is_editable: true
      },
      {
        key: 'notifications_slack_enabled',
        value: 'false',
        data_type: 'boolean',
        category: 'notifications',
        description: 'Enable Slack notifications',
        is_public: false,
        is_editable: true
      },
      {
        key: 'notifications_teams_enabled',
        value: 'false',
        data_type: 'boolean',
        category: 'notifications',
        description: 'Enable Microsoft Teams notifications',
        is_public: false,
        is_editable: true
      },

      // Integration settings
      {
        key: 'integrations_tenable_enabled',
        value: 'true',
        data_type: 'boolean',
        category: 'integrations',
        description: 'Enable Tenable.io integration',
        is_public: false,
        is_editable: true
      },
      {
        key: 'integrations_nessus_enabled',
        value: 'false',
        data_type: 'boolean',
        category: 'integrations',
        description: 'Enable Nessus scanner integration',
        is_public: false,
        is_editable: true
      },
      {
        key: 'integrations_openvas_enabled',
        value: 'false',
        data_type: 'boolean',
        category: 'integrations',
        description: 'Enable OpenVAS scanner integration',
        is_public: false,
        is_editable: true
      },
      {
        key: 'integrations_qualys_enabled',
        value: 'false',
        data_type: 'boolean',
        category: 'integrations',
        description: 'Enable Qualys VMDR integration',
        is_public: false,
        is_editable: true
      },

      // Scan type settings
      {
        key: 'scan_types_vulnerability_enabled',
        value: 'true',
        data_type: 'boolean',
        category: 'scan_types',
        description: 'Enable vulnerability scanning',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scan_types_compliance_enabled',
        value: 'true',
        data_type: 'boolean',
        category: 'scan_types',
        description: 'Enable compliance scanning',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scan_types_configuration_enabled',
        value: 'true',
        data_type: 'boolean',
        category: 'scan_types',
        description: 'Enable configuration auditing',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scan_types_comprehensive_enabled',
        value: 'true',
        data_type: 'boolean',
        category: 'scan_types',
        description: 'Enable comprehensive security assessment',
        is_public: false,
        is_editable: true
      }
    ];

    // Insert or update settings
    for (const setting of scannerSettings) {
      await sql`
        INSERT INTO settings (key, value, data_type, category, description, is_public, is_editable)
        VALUES (${setting.key}, ${setting.value}, ${setting.data_type}, ${setting.category}, 
                ${setting.description}, ${setting.is_public}, ${setting.is_editable})
        ON CONFLICT (key) DO UPDATE SET
          value = EXCLUDED.value,
          data_type = EXCLUDED.data_type,
          category = EXCLUDED.category,
          description = EXCLUDED.description,
          is_public = EXCLUDED.is_public,
          is_editable = EXCLUDED.is_editable,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }

    console.log('✅ Scanner settings added successfully');

    console.log('🎉 Scanner settings migration completed successfully!');
    console.log('');
    console.log('📋 Summary of added settings:');
    console.log('   - Scanner engine configuration (4 settings)');
    console.log('   - Notification preferences (6 settings)');
    console.log('   - Integration toggles (4 settings)');
    console.log('   - Scan type enablement (4 settings)');
    console.log('');
    console.log('🚀 Scanner Settings are ready!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Test the scan settings interface');
    console.log('   2. Configure settings as needed');
    console.log('   3. Verify API integration works');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
if (require.main === module) {
  addScannerSettings();
}

module.exports = { addScannerSettings };
