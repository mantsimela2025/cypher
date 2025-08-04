#!/usr/bin/env node

/**
 * Database Migration Script for Scanner Tables
 * 
 * This script creates the scanner tables for security scanning functionality.
 * 
 * Usage: node scripts/migrate_scanner_tables.js
 */

const postgres = require('postgres');
require('dotenv').config();

async function createScannerTables() {
  console.log('🚀 Starting database migration for Scanner tables...');

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
      application_name: 'ras_dashboard_scanner_migration'
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

    console.log('📦 Creating Scanner tables...');

    // Create enums first
    await sql`
      DO $$ BEGIN
        CREATE TYPE scan_type AS ENUM ('internal', 'vulnerability', 'compliance', 'web');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    await sql`
      DO $$ BEGIN
        CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;

    // Create scan_jobs table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_jobs (
        id SERIAL PRIMARY KEY,
        scan_type scan_type NOT NULL,
        target VARCHAR(255) NOT NULL,
        configuration JSONB DEFAULT '{}',
        status scan_status DEFAULT 'pending' NOT NULL,
        initiated_by INTEGER REFERENCES users(id) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completed_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create scan_results table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_results (
        id SERIAL PRIMARY KEY,
        scan_job_id INTEGER REFERENCES scan_jobs(id) ON DELETE CASCADE NOT NULL,
        scan_type scan_type NOT NULL,
        target VARCHAR(255) NOT NULL,
        results JSONB NOT NULL,
        summary JSONB DEFAULT '{}',
        file_path VARCHAR(500),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create scan_schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_schedules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        scan_type scan_type NOT NULL,
        target VARCHAR(255) NOT NULL,
        configuration JSONB DEFAULT '{}',
        schedule VARCHAR(100) NOT NULL,
        enabled INTEGER DEFAULT 1 NOT NULL,
        created_by INTEGER REFERENCES users(id) NOT NULL,
        last_run TIMESTAMPTZ,
        next_run TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create scan_templates table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        scan_type scan_type NOT NULL,
        configuration JSONB NOT NULL,
        is_default INTEGER DEFAULT 0 NOT NULL,
        created_by INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create scan_targets table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_targets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        target VARCHAR(255) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        credentials JSONB,
        tags JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}',
        enabled INTEGER DEFAULT 1 NOT NULL,
        created_by INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create scan_policies table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_policies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        policy_type VARCHAR(50) NOT NULL,
        framework VARCHAR(50),
        rules JSONB NOT NULL,
        enabled INTEGER DEFAULT 1 NOT NULL,
        created_by INTEGER REFERENCES users(id) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create scan_findings table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_findings (
        id SERIAL PRIMARY KEY,
        scan_result_id INTEGER REFERENCES scan_results(id) ON DELETE CASCADE NOT NULL,
        finding_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        recommendation TEXT,
        cve_id VARCHAR(20),
        cvss_score VARCHAR(10),
        port INTEGER,
        service VARCHAR(100),
        evidence JSONB,
        status VARCHAR(20) DEFAULT 'open' NOT NULL,
        assigned_to INTEGER REFERENCES users(id),
        resolved_at TIMESTAMPTZ,
        resolved_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    // Create scan_reports table
    await sql`
      CREATE TABLE IF NOT EXISTS scan_reports (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        report_type VARCHAR(50) NOT NULL,
        scan_job_ids JSONB NOT NULL,
        format VARCHAR(20) DEFAULT 'pdf' NOT NULL,
        file_path VARCHAR(500),
        generated_by INTEGER REFERENCES users(id) NOT NULL,
        generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
        expires_at TIMESTAMPTZ,
        download_count INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `;

    console.log('✅ Scanner tables created successfully');

    console.log('📊 Creating indexes for performance...');

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_scan_jobs_scan_type ON scan_jobs(scan_type)',
      'CREATE INDEX IF NOT EXISTS idx_scan_jobs_status ON scan_jobs(status)',
      'CREATE INDEX IF NOT EXISTS idx_scan_jobs_initiated_by ON scan_jobs(initiated_by)',
      'CREATE INDEX IF NOT EXISTS idx_scan_jobs_created_at ON scan_jobs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_scan_jobs_target ON scan_jobs(target)',
      
      'CREATE INDEX IF NOT EXISTS idx_scan_results_scan_job_id ON scan_results(scan_job_id)',
      'CREATE INDEX IF NOT EXISTS idx_scan_results_scan_type ON scan_results(scan_type)',
      'CREATE INDEX IF NOT EXISTS idx_scan_results_target ON scan_results(target)',
      'CREATE INDEX IF NOT EXISTS idx_scan_results_created_at ON scan_results(created_at)',
      
      'CREATE INDEX IF NOT EXISTS idx_scan_schedules_enabled ON scan_schedules(enabled)',
      'CREATE INDEX IF NOT EXISTS idx_scan_schedules_next_run ON scan_schedules(next_run)',
      'CREATE INDEX IF NOT EXISTS idx_scan_schedules_created_by ON scan_schedules(created_by)',
      
      'CREATE INDEX IF NOT EXISTS idx_scan_templates_scan_type ON scan_templates(scan_type)',
      'CREATE INDEX IF NOT EXISTS idx_scan_templates_is_default ON scan_templates(is_default)',
      'CREATE INDEX IF NOT EXISTS idx_scan_templates_created_by ON scan_templates(created_by)',
      
      'CREATE INDEX IF NOT EXISTS idx_scan_targets_target_type ON scan_targets(target_type)',
      'CREATE INDEX IF NOT EXISTS idx_scan_targets_enabled ON scan_targets(enabled)',
      'CREATE INDEX IF NOT EXISTS idx_scan_targets_created_by ON scan_targets(created_by)',
      
      'CREATE INDEX IF NOT EXISTS idx_scan_policies_policy_type ON scan_policies(policy_type)',
      'CREATE INDEX IF NOT EXISTS idx_scan_policies_framework ON scan_policies(framework)',
      'CREATE INDEX IF NOT EXISTS idx_scan_policies_enabled ON scan_policies(enabled)',
      
      'CREATE INDEX IF NOT EXISTS idx_scan_findings_scan_result_id ON scan_findings(scan_result_id)',
      'CREATE INDEX IF NOT EXISTS idx_scan_findings_finding_type ON scan_findings(finding_type)',
      'CREATE INDEX IF NOT EXISTS idx_scan_findings_severity ON scan_findings(severity)',
      'CREATE INDEX IF NOT EXISTS idx_scan_findings_status ON scan_findings(status)',
      'CREATE INDEX IF NOT EXISTS idx_scan_findings_cve_id ON scan_findings(cve_id)',
      'CREATE INDEX IF NOT EXISTS idx_scan_findings_assigned_to ON scan_findings(assigned_to)',
      
      'CREATE INDEX IF NOT EXISTS idx_scan_reports_report_type ON scan_reports(report_type)',
      'CREATE INDEX IF NOT EXISTS idx_scan_reports_generated_by ON scan_reports(generated_by)',
      'CREATE INDEX IF NOT EXISTS idx_scan_reports_generated_at ON scan_reports(generated_at)'
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

    console.log('🌱 Inserting default scanner data...');

    // Insert default scan templates
    const defaultTemplates = [
      {
        name: 'Quick Internal Scan',
        description: 'Fast internal network discovery scan',
        scan_type: 'internal',
        configuration: {
          scanType: 'quick',
          enableServiceDetection: true,
          enableOSDetection: false,
          timeout: 300
        },
        is_default: 1
      },
      {
        name: 'Comprehensive Internal Scan',
        description: 'Thorough internal network scan with OS detection',
        scan_type: 'internal',
        configuration: {
          scanType: 'comprehensive',
          enableServiceDetection: true,
          enableOSDetection: true,
          timeout: 1800
        },
        is_default: 1
      },
      {
        name: 'Basic Vulnerability Scan',
        description: 'Standard vulnerability assessment',
        scan_type: 'vulnerability',
        configuration: {
          scanType: 'basic',
          severity: 'medium',
          timeout: 1800
        },
        is_default: 1
      },
      {
        name: 'NIST Compliance Scan',
        description: 'NIST cybersecurity framework compliance check',
        scan_type: 'compliance',
        configuration: {
          frameworks: ['nist'],
          scanType: 'configuration',
          timeout: 1800
        },
        is_default: 1
      }
    ];

    // Get admin user for default templates
    const [adminUser] = await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    if (adminUser) {
      for (const template of defaultTemplates) {
        await sql`
          INSERT INTO scan_templates (name, description, scan_type, configuration, is_default, created_by)
          VALUES (${template.name}, ${template.description}, ${template.scan_type}, ${JSON.stringify(template.configuration)}, ${template.is_default}, ${adminUser.id})
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    console.log('✅ Default scanner data inserted successfully');

    console.log('🎉 Scanner migration completed successfully!');
    console.log('');
    console.log('📋 Summary of created tables:');
    console.log('   - scan_jobs (scan execution tracking)');
    console.log('   - scan_results (scan output and findings)');
    console.log('   - scan_schedules (scheduled/recurring scans)');
    console.log('   - scan_templates (predefined scan configurations)');
    console.log('   - scan_targets (managed scan targets)');
    console.log('   - scan_policies (compliance and security policies)');
    console.log('   - scan_findings (individual findings from scans)');
    console.log('   - scan_reports (generated reports)');
    console.log('');
    console.log('🚀 Scanner System is ready!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Test the scanner endpoints');
    console.log('   2. Configure scan templates as needed');
    console.log('   3. Set up scan targets for regular scanning');
    console.log('   4. Configure compliance policies');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the migration
if (require.main === module) {
  createScannerTables();
}

module.exports = { createScannerTables };
