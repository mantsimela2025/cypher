#!/usr/bin/env node

/**
 * Alphabetical Schema Comparison
 * 
 * Creates alphabetical lists of all database tables and existing schemas
 * for easy comparison and identification of missing schemas
 * 
 * Usage: node scripts/alphabetical-schema-comparison.js
 */

require('dotenv').config();
const { client } = require('../src/db');
const fs = require('fs');
const path = require('path');

// Import all schemas from the main schema index
let allSchemas = {};
try {
  allSchemas = require('../src/db/schema');
} catch (error) {
  console.log('⚠️  Could not import schemas, will check database only');
}

async function createAlphabeticalComparison() {
  try {
    console.log('📋 ALPHABETICAL SCHEMA COMPARISON');
    console.log('=================================\n');

    // Get all tables from database
    console.log('🔍 Fetching all database tables...');
    const dbTables = await client`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `;

    const allDatabaseTables = dbTables.map(t => t.table_name).sort();
    console.log(`Found ${allDatabaseTables.length} tables in database\n`);

    // Get all Drizzle schema table names
    const drizzleTableNames = [];
    const schemaMapping = {};

    Object.entries(allSchemas).forEach(([schemaName, schema]) => {
      if (schema && typeof schema === 'object' && schema[Symbol.for('drizzle:Name')]) {
        const tableName = schema[Symbol.for('drizzle:Name')];
        drizzleTableNames.push(tableName);
        schemaMapping[tableName] = schemaName;
      }
    });

    const sortedDrizzleSchemas = drizzleTableNames.sort();
    console.log(`Found ${sortedDrizzleSchemas.length} Drizzle schemas\n`);

    // Create comparison
    const missingSchemas = allDatabaseTables.filter(table => 
      !drizzleTableNames.includes(table)
    );

    const extraSchemas = drizzleTableNames.filter(schema => 
      !allDatabaseTables.includes(schema)
    );

    // Display results
    console.log('📊 SUMMARY:');
    console.log('===========');
    console.log(`Database Tables: ${allDatabaseTables.length}`);
    console.log(`Drizzle Schemas: ${sortedDrizzleSchemas.length}`);
    console.log(`Missing Schemas: ${missingSchemas.length}`);
    console.log(`Extra Schemas: ${extraSchemas.length}`);
    console.log(`Coverage: ${Math.round((sortedDrizzleSchemas.length / allDatabaseTables.length) * 100)}%\n`);

    // Alphabetical list of ALL database tables
    console.log('📋 ALL DATABASE TABLES (ALPHABETICAL):');
    console.log('======================================');
    allDatabaseTables.forEach((table, index) => {
      const hasSchema = drizzleTableNames.includes(table) ? '✅' : '❌';
      const schemaName = schemaMapping[table] ? ` -> ${schemaMapping[table]}` : '';
      console.log(`${String(index + 1).padStart(3, ' ')}. ${hasSchema} ${table}${schemaName}`);
    });

    console.log('\n📋 EXISTING DRIZZLE SCHEMAS (ALPHABETICAL):');
    console.log('===========================================');
    sortedDrizzleSchemas.forEach((table, index) => {
      const schemaName = schemaMapping[table];
      const inDatabase = allDatabaseTables.includes(table) ? '✅' : '⚠️';
      console.log(`${String(index + 1).padStart(3, ' ')}. ${inDatabase} ${table} -> ${schemaName}`);
    });

    console.log('\n❌ MISSING DRIZZLE SCHEMAS (ALPHABETICAL):');
    console.log('==========================================');
    missingSchemas.forEach((table, index) => {
      console.log(`${String(index + 1).padStart(3, ' ')}. ${table}`);
    });

    if (extraSchemas.length > 0) {
      console.log('\n⚠️  EXTRA DRIZZLE SCHEMAS (NO DATABASE TABLE):');
      console.log('==============================================');
      extraSchemas.forEach((table, index) => {
        const schemaName = schemaMapping[table];
        console.log(`${String(index + 1).padStart(3, ' ')}. ${table} -> ${schemaName}`);
      });
    }

    // Create text files for easy reference
    const outputDir = path.join(__dirname, '../docs/schema-lists');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // All database tables file
    const allTablesContent = [
      '# All Database Tables (Alphabetical)',
      `# Total: ${allDatabaseTables.length} tables`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      ...allDatabaseTables.map((table, index) => {
        const hasSchema = drizzleTableNames.includes(table) ? '✅' : '❌';
        const schemaName = schemaMapping[table] ? ` -> ${schemaMapping[table]}` : '';
        return `${String(index + 1).padStart(3, ' ')}. ${hasSchema} ${table}${schemaName}`;
      })
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'all-database-tables.txt'), allTablesContent);

    // Existing schemas file
    const existingSchemasContent = [
      '# Existing Drizzle Schemas (Alphabetical)',
      `# Total: ${sortedDrizzleSchemas.length} schemas`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      ...sortedDrizzleSchemas.map((table, index) => {
        const schemaName = schemaMapping[table];
        const inDatabase = allDatabaseTables.includes(table) ? '✅' : '⚠️';
        return `${String(index + 1).padStart(3, ' ')}. ${inDatabase} ${table} -> ${schemaName}`;
      })
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'existing-drizzle-schemas.txt'), existingSchemasContent);

    // Missing schemas file
    const missingSchemasContent = [
      '# Missing Drizzle Schemas (Alphabetical)',
      `# Total: ${missingSchemas.length} missing schemas`,
      `# Coverage: ${Math.round((sortedDrizzleSchemas.length / allDatabaseTables.length) * 100)}%`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      ...missingSchemas.map((table, index) => {
        return `${String(index + 1).padStart(3, ' ')}. ${table}`;
      })
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'missing-drizzle-schemas.txt'), missingSchemasContent);

    // Create a comprehensive comparison file
    const comparisonContent = [
      '# Database vs Drizzle Schema Comparison',
      `# Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Database Tables: ${allDatabaseTables.length}`,
      `- Drizzle Schemas: ${sortedDrizzleSchemas.length}`,
      `- Missing Schemas: ${missingSchemas.length}`,
      `- Coverage: ${Math.round((sortedDrizzleSchemas.length / allDatabaseTables.length) * 100)}%`,
      '',
      '## All Database Tables (with schema status)',
      ...allDatabaseTables.map((table, index) => {
        const hasSchema = drizzleTableNames.includes(table);
        const status = hasSchema ? '✅ HAS_SCHEMA' : '❌ MISSING_SCHEMA';
        const schemaName = schemaMapping[table] ? ` (${schemaMapping[table]})` : '';
        return `${String(index + 1).padStart(3, ' ')}. ${table} - ${status}${schemaName}`;
      }),
      '',
      '## Missing Schemas (Priority List)',
      ...missingSchemas.map((table, index) => {
        return `${String(index + 1).padStart(3, ' ')}. ${table}`;
      })
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'complete-comparison.txt'), comparisonContent);

    console.log('\n📁 FILES CREATED:');
    console.log('=================');
    console.log(`📄 ${outputDir}/all-database-tables.txt`);
    console.log(`📄 ${outputDir}/existing-drizzle-schemas.txt`);
    console.log(`📄 ${outputDir}/missing-drizzle-schemas.txt`);
    console.log(`📄 ${outputDir}/complete-comparison.txt`);

    console.log('\n✅ Alphabetical comparison completed!');
    console.log('\n🎯 QUICK REFERENCE:');
    console.log('===================');
    console.log(`• ${allDatabaseTables.length} total database tables`);
    console.log(`• ${sortedDrizzleSchemas.length} existing Drizzle schemas`);
    console.log(`• ${missingSchemas.length} schemas need to be created`);
    console.log(`• ${Math.round((sortedDrizzleSchemas.length / allDatabaseTables.length) * 100)}% coverage achieved`);

    if (missingSchemas.length > 0) {
      console.log('\n🚀 NEXT STEPS:');
      console.log('==============');
      console.log('1. Review the missing schemas list');
      console.log('2. Prioritize which schemas to create first');
      console.log('3. Use the detailed analysis script for specific tables:');
      console.log('   node scripts/check-drizzle-schema-coverage.js');
      console.log('4. Create schema files using the generated templates');
    }

  } catch (error) {
    console.error('❌ Error creating comparison:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the comparison
if (require.main === module) {
  createAlphabeticalComparison();
}

module.exports = { createAlphabeticalComparison };
