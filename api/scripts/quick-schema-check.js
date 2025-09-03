#!/usr/bin/env node

/**
 * Quick Drizzle Schema Coverage Check
 * 
 * This script provides a quick overview of your schema coverage
 * 
 * Usage: node scripts/quick-schema-check.js
 */

require('dotenv').config();
const { client } = require('../src/db');

// Import all schemas
const allSchemas = require('../src/db/schema');

async function quickCheck() {
  try {
    console.log('🔍 Quick Schema Coverage Check');
    console.log('==============================\n');

    // Get database tables
    const dbTables = await client`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    // Get Drizzle schema table names
    const drizzleTableNames = new Set();
    Object.entries(allSchemas).forEach(([schemaName, schema]) => {
      if (schema && typeof schema === 'object' && schema[Symbol.for('drizzle:Name')]) {
        drizzleTableNames.add(schema[Symbol.for('drizzle:Name')]);
      }
    });

    const dbTableNames = new Set(dbTables.map(t => t.table_name));
    const missingSchemas = [];
    const matchedTables = [];

    // Check coverage
    dbTableNames.forEach(tableName => {
      if (!drizzleTableNames.has(tableName)) {
        missingSchemas.push(tableName);
      } else {
        matchedTables.push(tableName);
      }
    });

    // Results
    const coveragePercentage = Math.round((matchedTables.length / dbTableNames.size) * 100);
    
    console.log(`📊 Database Tables: ${dbTableNames.size}`);
    console.log(`📋 Drizzle Schemas: ${drizzleTableNames.size}`);
    console.log(`✅ Coverage: ${coveragePercentage}% (${matchedTables.length}/${dbTableNames.size})\n`);

    if (missingSchemas.length > 0) {
      console.log('❌ Tables Missing Drizzle Schemas:');
      console.log('==================================');
      missingSchemas.sort().forEach(table => {
        console.log(`   • ${table}`);
      });
      console.log(`\n⚠️  Run 'node scripts/check-drizzle-schema-coverage.js' for detailed analysis`);
    } else {
      console.log('🎉 Perfect! All database tables have Drizzle schemas.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

quickCheck();
