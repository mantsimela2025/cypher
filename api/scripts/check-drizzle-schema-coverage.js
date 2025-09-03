#!/usr/bin/env node

/**
 * Drizzle Schema Coverage Checker
 * 
 * This script compares your database tables with your Drizzle schema definitions
 * to identify any missing schemas or tables.
 * 
 * Usage: node scripts/check-drizzle-schema-coverage.js
 */

require('dotenv').config();
const { client } = require('../src/db');
const fs = require('fs');
const path = require('path');

// Import all schemas from the main schema index
const allSchemas = require('../src/db/schema');

async function checkSchemaCoverage() {
  try {
    console.log('🔍 Checking Drizzle Schema Coverage...');
    console.log('=====================================\n');

    // Get all tables from the database
    console.log('📊 Fetching database tables...');
    const dbTables = await client`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;

    console.log(`Found ${dbTables.length} tables in database\n`);

    // Get all Drizzle schema table names
    console.log('📋 Analyzing Drizzle schemas...');
    const drizzleTableNames = new Set();
    const schemaDetails = {};

    // Extract table names from Drizzle schemas
    Object.entries(allSchemas).forEach(([schemaName, schema]) => {
      if (schema && typeof schema === 'object' && schema[Symbol.for('drizzle:Name')]) {
        const tableName = schema[Symbol.for('drizzle:Name')];
        drizzleTableNames.add(tableName);
        schemaDetails[tableName] = {
          schemaName,
          columnCount: Object.keys(schema).length - 1 // Subtract 1 for the Symbol
        };
      }
    });

    console.log(`Found ${drizzleTableNames.size} Drizzle schemas\n`);

    // Compare database tables with Drizzle schemas
    const dbTableNames = new Set(dbTables.map(t => t.table_name));
    const missingSchemas = [];
    const extraSchemas = [];
    const matchedTables = [];

    // Check for tables without Drizzle schemas
    dbTableNames.forEach(tableName => {
      if (!drizzleTableNames.has(tableName)) {
        missingSchemas.push(tableName);
      } else {
        matchedTables.push(tableName);
      }
    });

    // Check for Drizzle schemas without database tables
    drizzleTableNames.forEach(tableName => {
      if (!dbTableNames.has(tableName)) {
        extraSchemas.push(tableName);
      }
    });

    // Display results
    console.log('📊 COVERAGE ANALYSIS RESULTS');
    console.log('============================\n');

    console.log(`✅ Tables with Drizzle schemas: ${matchedTables.length}`);
    console.log(`❌ Tables missing Drizzle schemas: ${missingSchemas.length}`);
    console.log(`⚠️  Drizzle schemas without database tables: ${extraSchemas.length}\n`);

    // Show matched tables
    if (matchedTables.length > 0) {
      console.log('✅ TABLES WITH DRIZZLE SCHEMAS:');
      console.log('===============================');
      matchedTables.sort().forEach(tableName => {
        const details = schemaDetails[tableName];
        console.log(`   ${tableName} (${details.columnCount} columns) -> ${details.schemaName}`);
      });
      console.log('');
    }

    // Show missing schemas
    if (missingSchemas.length > 0) {
      console.log('❌ TABLES MISSING DRIZZLE SCHEMAS:');
      console.log('==================================');
      for (const tableName of missingSchemas.sort()) {
        // Get column info for missing tables
        const columns = await client`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `;
        
        console.log(`\n📋 ${tableName.toUpperCase()} (${columns.length} columns):`);
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'nullable' : 'not null';
          const defaultVal = col.column_default ? ` default: ${col.column_default}` : '';
          console.log(`   • ${col.column_name}: ${col.data_type} (${nullable}${defaultVal})`);
        });
      }
      console.log('');
    }

    // Show extra schemas
    if (extraSchemas.length > 0) {
      console.log('⚠️  DRIZZLE SCHEMAS WITHOUT DATABASE TABLES:');
      console.log('============================================');
      extraSchemas.sort().forEach(tableName => {
        const details = schemaDetails[tableName];
        console.log(`   ${tableName} -> ${details.schemaName} (${details.columnCount} columns)`);
      });
      console.log('');
    }

    // Generate schema templates for missing tables
    if (missingSchemas.length > 0) {
      console.log('🛠️  GENERATING SCHEMA TEMPLATES:');
      console.log('================================');
      
      for (const tableName of missingSchemas) {
        console.log(`\n// Schema for ${tableName}`);
        console.log(`const ${toCamelCase(tableName)} = pgTable('${tableName}', {`);
        
        const columns = await client`
          SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
          FROM information_schema.columns 
          WHERE table_name = ${tableName}
          AND table_schema = 'public'
          ORDER BY ordinal_position
        `;
        
        columns.forEach(col => {
          const drizzleType = mapPostgresToDrizzle(col.data_type, col.character_maximum_length);
          const nullable = col.is_nullable === 'YES' ? '' : '.notNull()';
          const defaultVal = mapDefaultValue(col.column_default);
          
          console.log(`  ${col.column_name}: ${drizzleType}${nullable}${defaultVal},`);
        });
        
        console.log('});');
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    const coveragePercentage = Math.round((matchedTables.length / dbTableNames.size) * 100);
    console.log(`Schema Coverage: ${coveragePercentage}% (${matchedTables.length}/${dbTableNames.size} tables)`);
    
    if (coveragePercentage === 100) {
      console.log('🎉 Perfect! All database tables have Drizzle schemas.');
    } else {
      console.log(`⚠️  ${missingSchemas.length} table(s) need Drizzle schemas.`);
    }

    if (extraSchemas.length > 0) {
      console.log(`⚠️  ${extraSchemas.length} Drizzle schema(s) don't have corresponding database tables.`);
    }

    console.log('\n📝 RECOMMENDATIONS:');
    console.log('===================');
    
    if (missingSchemas.length > 0) {
      console.log('1. Create Drizzle schemas for missing tables using the templates above');
      console.log('2. Add the new schemas to api/src/db/schema/index.js');
      console.log('3. Import and use the schemas in your services');
    }
    
    if (extraSchemas.length > 0) {
      console.log('4. Either create the missing database tables or remove unused schemas');
      console.log('5. Run database migrations if tables need to be created');
    }

    console.log('\n✅ Schema coverage check completed!');

  } catch (error) {
    console.error('❌ Error checking schema coverage:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Helper functions
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

function mapPostgresToDrizzle(pgType, maxLength) {
  switch (pgType.toLowerCase()) {
    case 'integer':
    case 'int4':
      return 'integer()';
    case 'serial':
      return 'serial()';
    case 'bigint':
    case 'int8':
      return 'bigint()';
    case 'bigserial':
      return 'bigserial()';
    case 'varchar':
    case 'character varying':
      return maxLength ? `varchar({ length: ${maxLength} })` : 'varchar()';
    case 'text':
      return 'text()';
    case 'boolean':
    case 'bool':
      return 'boolean()';
    case 'timestamp with time zone':
    case 'timestamptz':
      return 'timestamp({ withTimezone: true })';
    case 'timestamp without time zone':
    case 'timestamp':
      return 'timestamp()';
    case 'date':
      return 'date()';
    case 'jsonb':
      return 'jsonb()';
    case 'json':
      return 'json()';
    case 'uuid':
      return 'uuid()';
    case 'numeric':
    case 'decimal':
      return 'numeric()';
    case 'real':
    case 'float4':
      return 'real()';
    case 'double precision':
    case 'float8':
      return 'doublePrecision()';
    case 'ARRAY':
      return 'text().array()'; // Generic array, adjust as needed
    default:
      return `text() /* TODO: Map ${pgType} properly */`;
  }
}

function mapDefaultValue(defaultVal) {
  if (!defaultVal) return '';
  
  if (defaultVal.includes('CURRENT_TIMESTAMP') || defaultVal.includes('now()')) {
    return '.defaultNow()';
  }
  
  if (defaultVal.includes('gen_random_uuid()')) {
    return '.default(sql`gen_random_uuid()`)';
  }
  
  if (defaultVal === 'true' || defaultVal === 'false') {
    return `.default(${defaultVal})`;
  }
  
  if (defaultVal.match(/^\d+$/)) {
    return `.default(${defaultVal})`;
  }
  
  if (defaultVal.includes("'")) {
    const value = defaultVal.match(/'([^']+)'/)?.[1];
    if (value) {
      return `.default('${value}')`;
    }
  }
  
  return ` /* TODO: Map default ${defaultVal} */`;
}

// Run the check
if (require.main === module) {
  checkSchemaCoverage();
}

module.exports = { checkSchemaCoverage };
