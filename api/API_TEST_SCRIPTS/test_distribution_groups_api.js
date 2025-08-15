#!/usr/bin/env node
/*
 Simple Distribution Groups API test runner
 Requires API running locally (default: http://localhost:3001)
 Run with: NODE_ENV=test node API_TEST_SCRIPTS/test_distribution_groups_api.js
*/

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const AUTH = 'Bearer test-token';

async function http(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': AUTH,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (_) {}
  if (!res.ok || (data && data.success === false)) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(`${method} ${path} failed: ${msg}`);
  }
  return data;
}

async function run() {
  console.log('--- Distribution Groups API Test ---');
  // 1. List groups
  const list1 = await http('GET', '/api/v1/distribution-groups');
  console.log('List groups:', Array.isArray(list1.data) ? list1.data.length : 'n/a');

  // 2. Create a group
  const creatorId = 1; // with test auth bypass, this is fine
  const groupPayload = { name: `DG_Test_${Date.now()}`, description: 'Automated test group', createdBy: creatorId };
  const created = await http('POST', '/api/v1/distribution-groups', groupPayload);
  console.log('Created group:', created.data.id, created.data.name);
  const groupId = created.data.id;

  // 3. Get group by id
  const getById = await http('GET', `/api/v1/distribution-groups/${groupId}`);
  console.log('Get group by id ok:', getById.data.id === groupId);

  // 4. Update group
  const updated = await http('PUT', `/api/v1/distribution-groups/${groupId}`, { name: `${created.data.name}_Updated` });
  console.log('Updated group:', updated.data?.id || groupId);

  // 5. Create a user (via direct DB is not available here); instead, call available-users for candidates
  // If your system requires an existing user, skip add/remove member or set a known userId
  const available = await http('GET', `/api/v1/distribution-groups/${groupId}/available-users`);
  const candidate = (available.data && available.data[0]) || null;
  if (candidate) {
    // 6. Add member
    const addMem = await http('POST', `/api/v1/distribution-groups/${groupId}/members`, { userId: candidate.id });
    console.log('Added member:', addMem.data.userId || candidate.id);

    // 7. List members
    const members = await http('GET', `/api/v1/distribution-groups/${groupId}/members`);
    console.log('Members count:', Array.isArray(members.data) ? members.data.length : 'n/a');

    // 8. Remove member
    await http('DELETE', `/api/v1/distribution-groups/${groupId}/members/${candidate.id}`);
    console.log('Removed member:', candidate.id);
  } else {
    console.log('No available users returned; skipping add/remove member steps');
  }

  // 9. Stats
  const stats = await http('GET', '/api/v1/distribution-groups/stats/summary');
  console.log('Stats:', stats.data);

  // 10. Delete group
  await http('DELETE', `/api/v1/distribution-groups/${groupId}`);
  console.log('Deleted group:', groupId);

  console.log('--- All tests completed successfully ---');
}

run().catch((err) => {
  console.error('Test run failed:', err.message);
  process.exit(1);
});
