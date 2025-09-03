#!/usr/bin/env node

/**
 * Extract Tables from SQL File
 * 
 * Extracts all CREATE TABLE statements from the Cypher.sql file
 * and creates alphabetical lists for comparison
 * 
 * Usage: node scripts/extract-tables-from-sql.js
 */

const fs = require('fs');
const path = require('path');

function extractTablesFromSQL() {
  try {
    console.log('📋 EXTRACTING TABLES FROM CYPHER.SQL');
    console.log('====================================\n');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../../docs/DATABASE_GUIDES/Cypher.sql');
    console.log('🔍 Looking for SQL file at:', sqlFilePath);
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Cypher.sql file not found at:', sqlFilePath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`📄 Read SQL file: ${sqlFilePath}`);
    console.log(`📊 File size: ${Math.round(sqlContent.length / 1024)}KB\n`);

    // Extract CREATE TABLE statements
    const createTableRegex = /CREATE TABLE public\.(?:"([^"]+)"|([a-zA-Z_][a-zA-Z0-9_]*))/gi;
    const matches = [];
    let match;

    while ((match = createTableRegex.exec(sqlContent)) !== null) {
      // Get table name (either quoted or unquoted)
      const tableName = match[1] || match[2];
      if (tableName) {
        matches.push(tableName);
      }
    }

    // Remove duplicates and sort alphabetically
    const uniqueTables = [...new Set(matches)].sort();
    
    console.log(`🔍 Found ${matches.length} CREATE TABLE statements`);
    console.log(`📋 Unique tables: ${uniqueTables.length}\n`);

    // Display alphabetical list
    console.log('📋 ALL DATABASE TABLES (ALPHABETICAL):');
    console.log('======================================');
    uniqueTables.forEach((table, index) => {
      console.log(`${String(index + 1).padStart(3, ' ')}. ${table}`);
    });

    // Create output directory
    const outputDir = path.join(__dirname, '../docs/schema-lists');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create comprehensive table list file
    const tableListContent = [
      '# All Database Tables from Cypher.sql',
      `# Total: ${uniqueTables.length} tables`,
      `# Extracted: ${new Date().toISOString()}`,
      `# Source: docs/DATABASE_GUIDES/Cypher.sql`,
      '',
      '## Alphabetical List:',
      ...uniqueTables.map((table, index) => {
        return `${String(index + 1).padStart(3, ' ')}. ${table}`;
      }),
      '',
      '## Raw List (for copying):',
      ...uniqueTables.map(table => table)
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'extracted-tables-from-sql.txt'), tableListContent);

    // Create JavaScript array format for easy use
    const jsArrayContent = [
      '// All database tables extracted from Cypher.sql',
      `// Total: ${uniqueTables.length} tables`,
      `// Generated: ${new Date().toISOString()}`,
      '',
      'const ALL_DATABASE_TABLES = [',
      ...uniqueTables.map((table, index) => {
        const isLast = index === uniqueTables.length - 1;
        return `  '${table}'${isLast ? '' : ','}`;
      }),
      '];',
      '',
      'module.exports = { ALL_DATABASE_TABLES };'
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'all-tables-array.js'), jsArrayContent);

    // Create CSV format
    const csvContent = [
      'index,table_name',
      ...uniqueTables.map((table, index) => `${index + 1},${table}`)
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'all-tables.csv'), csvContent);

    console.log('\n📁 FILES CREATED:');
    console.log('=================');
    console.log(`📄 ${outputDir}/extracted-tables-from-sql.txt`);
    console.log(`📄 ${outputDir}/all-tables-array.js`);
    console.log(`📄 ${outputDir}/all-tables.csv`);

    console.log('\n✅ Table extraction completed!');
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`• Found ${uniqueTables.length} unique database tables`);
    console.log('• Tables extracted from CREATE TABLE statements');
    console.log('• Lists created in multiple formats (TXT, JS, CSV)');

    // Show first 10 and last 10 tables as preview
    console.log('\n🔍 PREVIEW (First 10 tables):');
    uniqueTables.slice(0, 10).forEach((table, index) => {
      console.log(`   ${index + 1}. ${table}`);
    });

    if (uniqueTables.length > 10) {
      console.log('   ...');
      console.log(`🔍 PREVIEW (Last 10 tables):`);
      uniqueTables.slice(-10).forEach((table, index) => {
        const actualIndex = uniqueTables.length - 10 + index + 1;
        console.log(`   ${actualIndex}. ${table}`);
      });
    }

    return uniqueTables;

  } catch (error) {
    console.error('❌ Error extracting tables:', error);
    process.exit(1);
  }
}

// Run the extraction
if (require.main === module) {
  extractTablesFromSQL();
}

module.exports = { extractTablesFromSQL };
