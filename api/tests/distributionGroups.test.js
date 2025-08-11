const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const { users } = require('../src/db/schema');

// Basic smoke tests for distribution groups API

describe('Distribution Groups API', () => {
  let server;
  let userId;
  beforeAll(async () => {
    server = app;
    // create a temp user if needed
    const [u] = await db.insert(users).values({ username: 'dg_test_user', email: 'dg@test.local' }).onConflictDoNothing().returning();
    userId = u?.id || (await db.select({ id: users.id }).from(users).where(users.username.eq('dg_test_user')))[0]?.id;
  });

  it('should create a group and list it', async () => {
    const resCreate = await request(server)
      .post('/api/v1/distribution-groups')
      .send({ name: 'Mitigation Team', description: 'These are folks in charge of mitigation', createdBy: userId });
    expect(resCreate.status).toBe(201);
    const group = resCreate.body.data;
    expect(group.name).toBe('Mitigation Team');

    const resList = await request(server).get('/api/v1/distribution-groups');
    expect(resList.status).toBe(200);
    expect(Array.isArray(resList.body.data)).toBe(true);
  });

  it('should add and remove a member', async () => {
    // create another user
    const [u2] = await db.insert(users).values({ username: 'dg_member', email: 'member@test.local' }).onConflictDoNothing().returning();
    const memberId = u2?.id || (await db.select({ id: users.id }).from(users).where(users.username.eq('dg_member')))[0]?.id;

    // create group
    const resCreate = await request(server)
      .post('/api/v1/distribution-groups')
      .send({ name: 'ISSO Group', description: 'ISSOs, ISSMs, ISSRs', createdBy: userId });
    const gid = resCreate.body.data.id;

    const resAdd = await request(server)
      .post(`/api/v1/distribution-groups/${gid}/members`)
      .send({ userId: memberId });
    expect(resAdd.status).toBe(201);

    const resMembers = await request(server).get(`/api/v1/distribution-groups/${gid}/members`);
    expect(resMembers.status).toBe(200);
    expect(Array.isArray(resMembers.body.data)).toBe(true);

    const resRemove = await request(server).delete(`/api/v1/distribution-groups/${gid}/members/${memberId}`);
    expect(resRemove.status).toBe(200);
  });
});
