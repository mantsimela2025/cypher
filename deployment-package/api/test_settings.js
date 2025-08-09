const postgres = require('postgres');
require('dotenv').config();

async function testSettings() {
  const sql = postgres({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD
  });

  try {
    console.log('Testing database connection...');
    const result = await sql`SELECT key, value, category FROM settings WHERE category = 'scanner'`;
    console.log('Scanner settings:', result);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sql.end();
  }
}

testSettings();
