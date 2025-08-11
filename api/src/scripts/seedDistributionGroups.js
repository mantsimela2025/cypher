const db = require('../db');
const { users, distributionGroups } = require('../db/schema');
const { asc, eq } = require('drizzle-orm');

async function getAnyRealUserId() {
  const rows = await db.select({ id: users.id }).from(users).orderBy(asc(users.id)).limit(1);
  if (!rows.length) throw new Error('No users found to set as created_by');
  return rows[0].id;
}

async function ensureGroup(name, description, createdBy) {
  const existing = await db.select({ id: distributionGroups.id })
    .from(distributionGroups)
    .where(eq(distributionGroups.name, name));
  if (existing.length) {
    console.log(`Group '${name}' already exists (id=${existing[0].id})`);
    return existing[0].id;
  }
  const [inserted] = await db.insert(distributionGroups).values({ name, description, createdBy }).returning({ id: distributionGroups.id });
  console.log(`Created group '${name}' (id=${inserted.id})`);
  return inserted.id;
}

async function main() {
  try {
    const creatorId = await getAnyRealUserId();
    await ensureGroup('Mitigation Team', 'These are folks in charge of mitigation', creatorId);
    await ensureGroup('Information Systems Security Officers', 'ISSOs, ISSMs, ISSRs', creatorId);
  } catch (e) {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  } finally {
    if (db.closeConnection) await db.closeConnection();
  }
}

if (require.main === module) main();

module.exports = { main };
