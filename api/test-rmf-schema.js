/**
 * Test RMF Database Schema
 * Check what tables and columns actually exist
 */

const { db } = require('./src/db');
const { sql } = require('drizzle-orm');

async function testRMFSchema() {
  try {
    console.log('🔍 Checking RMF database schema...');
    
    // Check if rmf_projects table exists and its structure
    console.log('\n1. Checking rmf_projects table structure:');
    const projectsSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'rmf_projects' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('Projects schema result:', projectsSchema);

    const projectsRows = projectsSchema.rows || projectsSchema || [];
    if (projectsRows.length === 0) {
      console.log('❌ rmf_projects table does not exist!');
      
      // Check what RMF tables do exist
      console.log('\n2. Checking what RMF tables exist:');
      const rmfTables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'rmf_%'
        ORDER BY table_name;
      `);
      
      const tablesRows = rmfTables.rows || rmfTables || [];
      console.log('Existing RMF tables:', tablesRows.map(r => r.table_name));
      
    } else {
      console.log('✅ rmf_projects table exists with columns:');
      projectsRows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : '(nullable)'}`);
      });
    }
    
    // Skip steps table check for now - focus on project creation
    
    // Test project creation with correct schema
    console.log('\n2. Testing project creation with database schema...');
    try {
      const testProject = await db.execute(sql`
        INSERT INTO rmf_projects (title, description, current_step, status, created_by)
        VALUES ('Test Project', 'Test Description', 'categorize', 'active', 1)
        RETURNING *;
      `);
      console.log('✅ Project creation successful:', testProject[0]);

      // Clean up test data
      await db.execute(sql`DELETE FROM rmf_projects WHERE title = 'Test Project'`);
      console.log('✅ Test data cleaned up');

    } catch (error) {
      console.log('❌ Project creation failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Schema test failed:', error.message);
  } finally {
    process.exit(0);
  }
}

testRMFSchema();
