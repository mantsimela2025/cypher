// API utility functions for NLQ Admin
import { apiClient } from '../../utils/apiClient';

export async function testNlqQuery(question) {
  try {
    const response = await apiClient.post('/nl-query/process', { query: question });
    // Transform response to match expected format
    return {
      interpreted: response.data?.conversationalResponse?.mainResponse || '',
      generated_query: response.data?.generatedQuery || '',
      result: response.data?.result || response.data,
      error: response.error
    };
  } catch (err) {
    throw err;
  }
}

export async function getNlqLogs() {
  try {
    const response = await apiClient.get('/nl-query/history');
    // Transform response to match expected format
    return response.data?.queries || [];
  } catch (err) {
    throw err;
  }
}

export async function getNlqLogDetail(id) {
  try {
    // Since there's no individual query detail endpoint, return a placeholder
    // This functionality would need to be implemented in the backend
    throw new Error('Query details not available - endpoint not implemented');
  } catch (err) {
    throw err;
  }
}

export async function getDataSources() {
  try {
    const response = await apiClient.get('/nl-query/data-sources');
    return response.data || response;
  } catch (err) {
    throw err;
  }
}

export async function getNlqConfig() {
  try {
    // Since there's no config endpoint, return default values
    // This functionality would need to be implemented in the backend
    return {
      prompt: "You are a helpful AI assistant for querying cybersecurity data.",
      schema_context: {}
    };
  } catch (err) {
    throw err;
  }
}

export async function updateNlqConfig({ prompt, schema_context }) {
  try {
    // Since there's no config endpoint, return success placeholder
    // This functionality would need to be implemented in the backend
    console.warn('NLQ config update not implemented - endpoint missing');
    return { message: 'Config update not implemented' };
  } catch (err) {
    throw err;
  }
}

export async function addDataSource(data) {
  try {
    const response = await apiClient.post('/nl-query/data-sources', data);
    return response.data || response;
  } catch (err) {
    throw err;
  }
}

export async function updateDataSource(id, data) {
  try {
    const response = await apiClient.put(`/nl-query/data-sources/${id}`, data);
    return response.data || response;
  } catch (err) {
    throw err;
  }
}

export async function deleteDataSource(id) {
  try {
    const response = await apiClient.delete(`/nl-query/data-sources/${id}`);
    return response.data || response;
  } catch (err) {
    throw err;
  }
}
