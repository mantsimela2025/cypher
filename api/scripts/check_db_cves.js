#!/usr/bin/env node
const { db } = require('../src/db');
const { cves } = require('../src/db/schema');

async function checkDbCves() {
  try {
    const result = await db.select().from(cves).limit(3);
    console.log('Sample CVEs from database:');
    result.forEach((cve, i) => {
      console.log(`${i+1}. ${cve.cveId}`);
      console.log(`   cvss3BaseScore: ${cve.cvss3BaseScore}`);
      console.log(`   cvss2BaseScore: ${cve.cvss2BaseScore}`);
      console.log(`   cvss3Vector: ${cve.cvss3Vector}`);
      console.log(`   source: ${cve.source}`);
      console.log('');
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDbCves();
