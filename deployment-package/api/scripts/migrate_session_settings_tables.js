#!/usr/bin/env node

/**
 * Database Migration Script for Session and Settings Tables
 * 
 * This script creates the session and settings tables for application configuration
 * and session management.
 * 
 * Usage: node scripts/migrate_session_settings_tables.js
 */

const postgres = require('postgres');
require('dotenv').config();

async function createSessionSettingsTables() {
  console.log('🚀 Starting database migration for Session and Settings tables...');

  // Create database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Configure SSL based on environment
  const sslConfig = process.env.DATABASE_SSL === 'false' ? false : {
    rejectUnauthorized: false // For self-signed certificates
  };

  const sql = postgres(connectionString, {
    ssl: sslConfig,
    connection: {
      application_name: 'ras_dashboard_session_settings_migration'
    },
    transform: {
      undefined: null
    }
  });

  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');

    console.log('📦 Creating Session and Settings tables...');

    // Create setting_data_type enum first
    await sql`
      DO $$ BEGIN
        CREATE TYPE setting_data_type AS ENUM ('string', 'number', 'boolean', 'json', 'array');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create session table
    await sql`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMPTZ NOT NULL
      );
    `;

    // Create settings table
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        data_type setting_data_type DEFAULT 'string' NOT NULL,
        category VARCHAR(255) DEFAULT 'general' NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false NOT NULL,
        is_editable BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    console.log('✅ Session and Settings tables created successfully');

    console.log('📊 Creating indexes for performance...');

    // Create indexes for better performance
    const indexes = [
      // Session table indexes
      'CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire)',
      
      // Settings table indexes
      'CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)',
      'CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category)',
      'CREATE INDEX IF NOT EXISTS idx_settings_data_type ON settings(data_type)',
      'CREATE INDEX IF NOT EXISTS idx_settings_is_public ON settings(is_public)',
      'CREATE INDEX IF NOT EXISTS idx_settings_is_editable ON settings(is_editable)',
      'CREATE INDEX IF NOT EXISTS idx_settings_created_at ON settings(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        await sql.unsafe(indexQuery);
      } catch (error) {
        // Ignore errors for indexes that already exist
        if (!error.message.includes('already exists')) {
          console.warn(`Warning creating index: ${error.message}`);
        }
      }
    }

    console.log('✅ Indexes created successfully');

    console.log('🌱 Inserting default settings...');

    // Insert default application settings
    const defaultSettings = [
      // Application settings
      {
        key: 'app_name',
        value: 'RAS Dashboard',
        data_type: 'string',
        category: 'application',
        description: 'Application name displayed in the UI',
        is_public: true,
        is_editable: true
      },
      {
        key: 'app_version',
        value: '1.0.0',
        data_type: 'string',
        category: 'application',
        description: 'Current application version',
        is_public: true,
        is_editable: false
      },
      {
        key: 'app_description',
        value: 'Risk Assessment System Dashboard for Cybersecurity Management',
        data_type: 'string',
        category: 'application',
        description: 'Application description',
        is_public: true,
        is_editable: true
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        data_type: 'boolean',
        category: 'application',
        description: 'Enable maintenance mode to restrict access',
        is_public: false,
        is_editable: true
      },

      // Security settings
      {
        key: 'session_timeout',
        value: '3600',
        data_type: 'number',
        category: 'security',
        description: 'Session timeout in seconds (default: 1 hour)',
        is_public: false,
        is_editable: true
      },
      {
        key: 'password_min_length',
        value: '8',
        data_type: 'number',
        category: 'security',
        description: 'Minimum password length requirement',
        is_public: false,
        is_editable: true
      },
      {
        key: 'password_require_special',
        value: 'true',
        data_type: 'boolean',
        category: 'security',
        description: 'Require special characters in passwords',
        is_public: false,
        is_editable: true
      },
      {
        key: 'max_login_attempts',
        value: '5',
        data_type: 'number',
        category: 'security',
        description: 'Maximum failed login attempts before lockout',
        is_public: false,
        is_editable: true
      },
      {
        key: 'lockout_duration',
        value: '900',
        data_type: 'number',
        category: 'security',
        description: 'Account lockout duration in seconds (default: 15 minutes)',
        is_public: false,
        is_editable: true
      },

      // Email settings
      {
        key: 'smtp_host',
        value: 'localhost',
        data_type: 'string',
        category: 'email',
        description: 'SMTP server hostname',
        is_public: false,
        is_editable: true
      },
      {
        key: 'smtp_port',
        value: '587',
        data_type: 'number',
        category: 'email',
        description: 'SMTP server port',
        is_public: false,
        is_editable: true
      },
      {
        key: 'smtp_secure',
        value: 'true',
        data_type: 'boolean',
        category: 'email',
        description: 'Use secure SMTP connection (TLS)',
        is_public: false,
        is_editable: true
      },
      {
        key: 'email_from_address',
        value: 'noreply@rasdashboard.gov',
        data_type: 'string',
        category: 'email',
        description: 'Default from email address',
        is_public: false,
        is_editable: true
      },
      {
        key: 'email_from_name',
        value: 'RAS Dashboard',
        data_type: 'string',
        category: 'email',
        description: 'Default from name for emails',
        is_public: false,
        is_editable: true
      },

      // Scanner settings
      {
        key: 'scanner_max_concurrent',
        value: '5',
        data_type: 'number',
        category: 'scanner',
        description: 'Maximum concurrent scans allowed',
        is_public: false,
        is_editable: true
      },
      {
        key: 'scanner_default_timeout',
        value: '1800',
        data_type: 'number',
        category: 'scanner',
        description: 'Default scan timeout in seconds (30 minutes)',
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

      // UI settings
      {
        key: 'ui_theme',
        value: 'light',
        data_type: 'string',
        category: 'ui',
        description: 'Default UI theme (light/dark)',
        is_public: true,
        is_editable: true
      },
      {
        key: 'ui_items_per_page',
        value: '20',
        data_type: 'number',
        category: 'ui',
        description: 'Default number of items per page in lists',
        is_public: true,
        is_editable: true
      },
      {
        key: 'ui_enable_tooltips',
        value: 'true',
        data_type: 'boolean',
        category: 'ui',
        description: 'Enable tooltips throughout the application',
        is_public: true,
        is_editable: true
      },

      // API settings
      {
        key: 'api_rate_limit',
        value: '1000',
        data_type: 'number',
        category: 'api',
        description: 'API rate limit per hour per user',
        is_public: false,
        is_editable: true
      },
      {
        key: 'api_enable_cors',
        value: 'true',
        data_type: 'boolean',
        category: 'api',
        description: 'Enable CORS for API endpoints',
        is_public: false,
        is_editable: true
      },

      // Backup settings
      {
        key: 'backup_enabled',
        value: 'true',
        data_type: 'boolean',
        category: 'backup',
        description: 'Enable automatic database backups',
        is_public: false,
        is_editable: true
      },
      {
        key: 'backup_frequency',
        value: '24',
        data_type: 'number',
        category: 'backup',
        description: 'Backup frequency in hours',
        is_public: false,
        is_editable: true
      },
      {
        key: 'backup_retention',
        value: '30',
        data_type: 'number',
        category: 'backup',
        description: 'Backup retention period in days',
        is_public: false,
        is_editable: true
      }
    ];

    for (const setting of defaultSettings) {
      await sql`
        INSERT INTO settings (key, value, data_type, category, description, is_public, is_editable)
        VALUES (${setting.key}, ${setting.value}, ${setting.data_type}, ${setting.category}, 
                ${setting.description}, ${setting.is_public}, ${setting.is_editable})
        ON CONFLICT (key) DO UPDATE SET
          description = EXCLUDED.description,
          is_public = EXCLUDED.is_public,
          is_editable = EXCLUDED.is_editable,
          updated_at = CURRENT_TIMESTAMP;
      `;
    }

    console.log('✅ Default settings inserted successfully');

    console.log('🎉 Session and Settings migration completed successfully!');
    console.log('');
    console.log('📋 Summary of created tables:');
    console.log('   - session (user session storage)');
    console.log('   - settings (application configuration)');
    console.log('');
    console.log('🚀 Settings System is ready!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Test the settings endpoints');
    console.log('   2. Configure application settings as needed');
    console.log('   3. Set up session management');
    console.log('   4. Review and adjust default settings');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
if (require.main === module) {
  createSessionSettingsTables();
}

module.exports = { createSessionSettingsTables };
