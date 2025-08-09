const { client } = require('../src/db');

async function checkPatchesTable() {
  try {
    console.log('Checking patches table structure...');
    
    const columns = await client`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'patches' 
      ORDER BY ordinal_position
    `;
    
    console.log('Patches table columns:');
    console.table(columns);
    
    // Also check if table exists
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'patches'
      )
    `;
    
    console.log('Table exists:', tableExists[0].exists);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPatchesTable();
