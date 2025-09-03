#!/usr/bin/env node

/**
 * Audit Existing Schemas
 * 
 * Analyzes what schema files actually exist vs what's imported in index.js
 * and what tables exist in the database
 * 
 * Usage: node scripts/audit-existing-schemas.js
 */

require('dotenv').config();
const { client } = require('../src/db');
const fs = require('fs');
const path = require('path');

async function auditExistingSchemas() {
  try {
    console.log('🔍 AUDITING EXISTING DRIZZLE SCHEMAS');
    console.log('====================================\n');

    // Get all schema files that actually exist
    const schemaDir = path.join(__dirname, '../src/db/schema');
    const schemaFiles = fs.readdirSync(schemaDir)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .sort();

    console.log(`📁 Found ${schemaFiles.length} schema files:\n`);
    schemaFiles.forEach((file, index) => {
      console.log(`${String(index + 1).padStart(3, ' ')}. ${file}`);
    });

    // Get all database tables
    console.log('\n🗄️  Fetching database tables...');
    const dbTables = await client`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name ASC
    `;

    const allDatabaseTables = dbTables.map(t => t.table_name).sort();
    console.log(`Found ${allDatabaseTables.length} database tables\n`);

    // Try to analyze what schemas are actually working
    console.log('🔧 Analyzing working schemas...\n');
    
    const workingSchemas = [];
    const brokenImports = [];

    // Check each schema file individually
    for (const file of schemaFiles) {
      try {
        const schemaPath = path.join(schemaDir, file);
        const schemaModule = require(schemaPath);
        
        // Count exported schemas from this file
        const exportedSchemas = Object.keys(schemaModule).filter(key => {
          const schema = schemaModule[key];
          return schema && typeof schema === 'object' && schema[Symbol.for('drizzle:Name')];
        });

        if (exportedSchemas.length > 0) {
          workingSchemas.push({
            file,
            schemas: exportedSchemas.map(key => ({
              name: key,
              tableName: schemaModule[key][Symbol.for('drizzle:Name')]
            }))
          });
        }
      } catch (error) {
        brokenImports.push({ file, error: error.message });
      }
    }

    // Display working schemas
    console.log('✅ WORKING SCHEMA FILES:');
    console.log('========================\n');
    
    let totalWorkingSchemas = 0;
    const allWorkingTableNames = new Set();

    workingSchemas.forEach(({ file, schemas }) => {
      console.log(`📄 ${file} (${schemas.length} schemas):`);
      schemas.forEach(({ name, tableName }) => {
        console.log(`   • ${name} -> ${tableName}`);
        allWorkingTableNames.add(tableName);
        totalWorkingSchemas++;
      });
      console.log('');
    });

    console.log(`Total working schemas: ${totalWorkingSchemas}\n`);

    // Display broken imports
    if (brokenImports.length > 0) {
      console.log('❌ BROKEN SCHEMA FILES:');
      console.log('=======================\n');
      brokenImports.forEach(({ file, error }) => {
        console.log(`📄 ${file}:`);
        console.log(`   Error: ${error}\n`);
      });
    }

    // Compare with database tables
    console.log('📊 DATABASE COVERAGE ANALYSIS:');
    console.log('==============================\n');

    const coveredTables = allDatabaseTables.filter(table => allWorkingTableNames.has(table));
    const missingTables = allDatabaseTables.filter(table => !allWorkingTableNames.has(table));
    const extraSchemas = Array.from(allWorkingTableNames).filter(table => !allDatabaseTables.includes(table));

    const coveragePercentage = Math.round((coveredTables.length / allDatabaseTables.length) * 100);

    console.log(`📊 Database Tables: ${allDatabaseTables.length}`);
    console.log(`✅ Covered by Schemas: ${coveredTables.length}`);
    console.log(`❌ Missing Schemas: ${missingTables.length}`);
    console.log(`⚠️  Extra Schemas: ${extraSchemas.length}`);
    console.log(`📈 Coverage: ${coveragePercentage}%\n`);

    // Show missing tables (most important)
    if (missingTables.length > 0) {
      console.log('❌ TABLES MISSING DRIZZLE SCHEMAS:');
      console.log('==================================\n');
      missingTables.forEach((table, index) => {
        console.log(`${String(index + 1).padStart(3, ' ')}. ${table}`);
      });
      console.log('');
    }

    // Show extra schemas
    if (extraSchemas.length > 0) {
      console.log('⚠️  SCHEMAS WITHOUT DATABASE TABLES:');
      console.log('====================================\n');
      extraSchemas.forEach((table, index) => {
        console.log(`${String(index + 1).padStart(3, ' ')}. ${table}`);
      });
      console.log('');
    }

    // Identify what needs to be fixed in index.js
    console.log('🔧 INDEX.JS ISSUES TO FIX:');
    console.log('==========================\n');

    // Check what index.js is trying to import vs what exists
    const indexPath = path.join(schemaDir, 'index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Extract require statements
    const requireRegex = /require\(['"]\.\/([^'"]+)['"]\)/g;
    const requiredFiles = [];
    let match;
    while ((match = requireRegex.exec(indexContent)) !== null) {
      requiredFiles.push(match[1] + '.js');
    }

    const missingRequiredFiles = requiredFiles.filter(file => !schemaFiles.includes(file));
    const unusedSchemaFiles = schemaFiles.filter(file => !requiredFiles.includes(file));

    if (missingRequiredFiles.length > 0) {
      console.log('❌ Files imported in index.js but missing:');
      missingRequiredFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
      console.log('');
    }

    if (unusedSchemaFiles.length > 0) {
      console.log('⚠️  Schema files not imported in index.js:');
      unusedSchemaFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
      console.log('');
    }

    // Summary and recommendations
    console.log('🎯 SUMMARY & RECOMMENDATIONS:');
    console.log('=============================\n');
    
    console.log(`• You have ${schemaFiles.length} schema files with ${totalWorkingSchemas} working schemas`);
    console.log(`• ${coveragePercentage}% database coverage (${coveredTables.length}/${allDatabaseTables.length} tables)`);
    console.log(`• ${missingTables.length} tables still need schemas`);
    
    if (missingRequiredFiles.length > 0) {
      console.log(`• ${missingRequiredFiles.length} missing schema files need to be created`);
    }
    
    if (unusedSchemaFiles.length > 0) {
      console.log(`• ${unusedSchemaFiles.length} schema files need to be added to index.js`);
    }

    console.log('\n🚀 NEXT STEPS:');
    console.log('==============');
    
    if (missingRequiredFiles.length > 0) {
      console.log('1. Create missing schema files that index.js is trying to import');
      console.log('2. Fix index.js imports to match existing files');
    }
    
    if (unusedSchemaFiles.length > 0) {
      console.log('3. Add unused schema files to index.js exports');
    }
    
    console.log('4. Create schemas for remaining missing tables');
    console.log('5. Test that all schemas load without errors\n');

    console.log('✅ Schema audit completed!');

  } catch (error) {
    console.error('❌ Error during audit:', error);
  } finally {
    await client.end();
  }
}

// Run the audit
if (require.main === module) {
  auditExistingSchemas();
}

module.exports = { auditExistingSchemas };
