#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { client } = require('../src/db');

// Get the SQL file path from command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node run-sql-file.js <path-to-sql-file>');
  console.log('Example: node run-sql-file.js ../scripts/seed-vulnerability-data.sql');
  process.exit(0);
}

const sqlFilePath = args[0];
const absolutePath = path.resolve(process.cwd(), sqlFilePath);

async function runSqlFile() {
  try {
    console.log(`📂 Reading SQL file: ${absolutePath}`);
    
    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ File not found: ${absolutePath}`);
      process.exit(1);
    }
    
    // Read the SQL file
    const sqlContent = fs.readFileSync(absolutePath, 'utf8');
    console.log(`✅ SQL file read successfully (${sqlContent.length} bytes)`);
    
    console.log('🔄 Executing SQL...');
    
    // Split the SQL content into individual statements
    // This is a simple approach and might not work for all SQL files
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      try {
        const stmt = statements[i];
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await client.unsafe(stmt);
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
        // Continue with next statement instead of failing completely
      }
    }
    
    console.log('✅ SQL execution completed!');
  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    process.exit(1);
  } finally {
    // Close the database connection
    await client.end();
  }
}

// Run the function
runSqlFile();