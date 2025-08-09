// API utility functions for NLQ Admin

export async function testNlqQuery(question) {
  try {
    const res = await fetch('/api/nlq/test-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function getNlqLogs() {
  try {
    const res = await fetch('/api/nlq/logs');
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function getNlqLogDetail(id) {
  try {
    const res = await fetch(`/api/nlq/logs/${id}`);
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function getDataSources() {
  try {
    const res = await fetch('/api/v1/nl-query/data-sources');
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function getNlqConfig() {
  try {
    const res = await fetch('/api/nlq/config');
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function updateNlqConfig({ prompt, schema_context }) {
  try {
    const res = await fetch('/api/nlq/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, schema_context }),
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function addDataSource(data) {
  try {
    const res = await fetch('/api/v1/nl-query/data-sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function updateDataSource(id, data) {
  try {
    const res = await fetch(`/api/v1/nl-query/data-sources/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}

export async function deleteDataSource(id) {
  try {
    const res = await fetch(`/api/v1/nl-query/data-sources/${id}`, {
      method: 'DELETE' });
    if (!res.ok) throw new Error(`Error: ${res.status}`);
    return await res.json();
  } catch (err) {
    throw err;
  }
}
