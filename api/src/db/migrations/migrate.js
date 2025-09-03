#!/usr/bin/env node

/**
 * Database Migration Runner for CYPHER Asset Management
 * 
 * This script handles running SQL migrations in order and tracking
 * which migrations have been applied.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

class MigrationRunner {
  constructor() {
    this.migrationsDir = __dirname;
    this.client = null;
  }

  /**
   * Initialize the migration system
   */
  async initialize() {
    this.client = await pool.connect();
    
    // Create schema_migrations table if it doesn't exist
    await this.createMigrationsTable();
    
    console.log('🔧 Migration system initialized');
  }

  /**
   * Create the schema_migrations table to track applied migrations
   */
  async createMigrationsTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "schema_migrations" (
        "version" varchar(255) PRIMARY KEY NOT NULL,
        "applied_at" timestamp with time zone DEFAULT now() NOT NULL,
        "execution_time_ms" integer,
        "checksum" varchar(64)
      );
      
      CREATE INDEX IF NOT EXISTS "idx_schema_migrations_applied_at" 
      ON "schema_migrations" ("applied_at");
    `;
    
    await this.client.query(createTableSQL);
  }

  /**
   * Get list of migration files from all subfolders
   */
  getMigrationFiles() {
    const migrations = [];

    // Get all items in migrations directory
    const items = fs.readdirSync(this.migrationsDir, { withFileTypes: true });

    for (const item of items) {
      if (item.isDirectory()) {
        // Check subdirectory for migration files
        const subDir = path.join(this.migrationsDir, item.name);
        const subFiles = fs.readdirSync(subDir)
          .filter(file => file.endsWith('.sql') && file.match(/^\d{4}_/))
          .map(file => ({
            filename: file,
            version: `${item.name}/${file.replace('.sql', '')}`,
            path: path.join(subDir, file),
            category: item.name
          }));

        migrations.push(...subFiles);
      } else if (item.name.endsWith('.sql') && item.name.match(/^\d{4}_/)) {
        // Handle root-level migration files (for backward compatibility)
        migrations.push({
          filename: item.name,
          version: item.name.replace('.sql', ''),
          path: path.join(this.migrationsDir, item.name),
          category: 'root'
        });
      }
    }

    // Sort by version number (extract number from filename)
    return migrations.sort((a, b) => {
      const aNum = parseInt(a.filename.match(/^(\d{4})/)[1]);
      const bNum = parseInt(b.filename.match(/^(\d{4})/)[1]);
      return aNum - bNum;
    });
  }

  /**
   * Get list of applied migrations
   */
  async getAppliedMigrations() {
    const result = await this.client.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    
    return result.rows.map(row => row.version);
  }

  /**
   * Calculate checksum for migration file
   */
  calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Run a single migration
   */
  async runMigration(migration) {
    const startTime = Date.now();
    
    console.log(`📄 Running migration: ${migration.version}`);
    
    try {
      // Read migration file
      const migrationSQL = fs.readFileSync(migration.path, 'utf8');
      const checksum = this.calculateChecksum(migrationSQL);
      
      // Begin transaction
      await this.client.query('BEGIN');
      
      // Execute migration
      await this.client.query(migrationSQL);
      
      // Record migration as applied
      const executionTime = Date.now() - startTime;
      await this.client.query(
        `INSERT INTO schema_migrations (version, applied_at, execution_time_ms, checksum) 
         VALUES ($1, NOW(), $2, $3)
         ON CONFLICT (version) DO UPDATE SET
           applied_at = NOW(),
           execution_time_ms = $2,
           checksum = $3`,
        [migration.version, executionTime, checksum]
      );
      
      // Commit transaction
      await this.client.query('COMMIT');
      
      console.log(`✅ Migration completed: ${migration.version} (${executionTime}ms)`);
      
    } catch (error) {
      // Rollback transaction on error
      await this.client.query('ROLLBACK');
      
      console.error(`❌ Migration failed: ${migration.version}`);
      console.error(`   Error: ${error.message}`);
      
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations() {
    console.log('🚀 Starting database migrations...\n');
    
    const migrationFiles = this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    
    const pendingMigrations = migrationFiles.filter(
      migration => !appliedMigrations.includes(migration.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✨ No pending migrations found. Database is up to date!');
      return;
    }
    
    console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach(migration => {
      console.log(`   - ${migration.version} (${migration.category})`);
    });
    console.log('');
    
    // Run each pending migration
    for (const migration of pendingMigrations) {
      await this.runMigration(migration);
    }
    
    console.log(`\n🎉 Successfully applied ${pendingMigrations.length} migration(s)!`);
  }

  /**
   * Show migration status
   */
  async showStatus() {
    console.log('📊 Migration Status:\n');
    
    const migrationFiles = this.getMigrationFiles();
    const appliedMigrations = await this.getAppliedMigrations();
    
    if (migrationFiles.length === 0) {
      console.log('   No migration files found.');
      return;
    }
    
    // Get detailed info about applied migrations
    const appliedDetails = await this.client.query(`
      SELECT version, applied_at, execution_time_ms, checksum
      FROM schema_migrations 
      ORDER BY version
    `);
    
    const appliedMap = new Map();
    appliedDetails.rows.forEach(row => {
      appliedMap.set(row.version, row);
    });
    
    migrationFiles.forEach(migration => {
      const applied = appliedMap.get(migration.version);

      if (applied) {
        const appliedAt = new Date(applied.applied_at).toLocaleString();
        const executionTime = applied.execution_time_ms || 'unknown';
        console.log(`✅ ${migration.version} (${migration.category}) - Applied on ${appliedAt} (${executionTime}ms)`);
      } else {
        console.log(`⏳ ${migration.version} (${migration.category}) - Pending`);
      }
    });
    
    const pendingCount = migrationFiles.length - appliedMigrations.length;
    console.log(`\n📈 Summary: ${appliedMigrations.length} applied, ${pendingCount} pending`);
  }

  /**
   * Rollback last migration (dangerous - use with caution)
   */
  async rollbackLast() {
    console.log('⚠️  Rolling back last migration...\n');
    
    const lastMigration = await this.client.query(`
      SELECT version FROM schema_migrations 
      ORDER BY applied_at DESC 
      LIMIT 1
    `);
    
    if (lastMigration.rows.length === 0) {
      console.log('❌ No migrations to rollback');
      return;
    }
    
    const version = lastMigration.rows[0].version;
    
    console.log(`🔄 Rolling back migration: ${version}`);
    console.log('⚠️  WARNING: This will remove the migration record but NOT undo the changes!');
    console.log('   You must manually undo the database changes if needed.');
    
    // Remove from migrations table
    await this.client.query(
      'DELETE FROM schema_migrations WHERE version = $1',
      [version]
    );
    
    console.log(`✅ Migration record removed: ${version}`);
    console.log('⚠️  Remember to manually undo database changes if necessary!');
  }

  /**
   * Validate migration checksums
   */
  async validateChecksums() {
    console.log('🔍 Validating migration checksums...\n');
    
    const migrationFiles = this.getMigrationFiles();
    const appliedMigrations = await this.client.query(`
      SELECT version, checksum FROM schema_migrations
    `);
    
    const appliedMap = new Map();
    appliedMigrations.rows.forEach(row => {
      appliedMap.set(row.version, row.checksum);
    });
    
    let hasErrors = false;
    
    for (const migration of migrationFiles) {
      const appliedChecksum = appliedMap.get(migration.version);
      
      if (appliedChecksum) {
        const currentContent = fs.readFileSync(migration.path, 'utf8');
        const currentChecksum = this.calculateChecksum(currentContent);
        
        if (appliedChecksum !== currentChecksum) {
          console.log(`❌ ${migration.version} - Checksum mismatch!`);
          console.log(`   Applied: ${appliedChecksum}`);
          console.log(`   Current: ${currentChecksum}`);
          hasErrors = true;
        } else {
          console.log(`✅ ${migration.version} - Checksum valid`);
        }
      }
    }
    
    if (hasErrors) {
      console.log('\n⚠️  Some migrations have been modified after being applied!');
      console.log('   This could indicate tampering or version control issues.');
    } else {
      console.log('\n✨ All migration checksums are valid!');
    }
  }

  /**
   * Clean up and close connections
   */
  async cleanup() {
    if (this.client) {
      this.client.release();
    }
    await pool.end();
  }
}

/**
 * Main execution function
 */
async function main() {
  const runner = new MigrationRunner();
  
  try {
    await runner.initialize();
    
    const command = process.argv[2] || 'migrate';
    
    switch (command) {
      case 'migrate':
      case 'up':
        await runner.runMigrations();
        break;
        
      case 'status':
        await runner.showStatus();
        break;
        
      case 'rollback':
        await runner.rollbackLast();
        break;
        
      case 'validate':
        await runner.validateChecksums();
        break;
        
      default:
        console.log('Usage: node migrate.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  migrate, up    Run pending migrations (default)');
        console.log('  status         Show migration status');
        console.log('  rollback       Rollback last migration (dangerous!)');
        console.log('  validate       Validate migration checksums');
        break;
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.error('\nStack trace:', error.stack);
    }
    
    process.exit(1);
    
  } finally {
    await runner.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationRunner };
