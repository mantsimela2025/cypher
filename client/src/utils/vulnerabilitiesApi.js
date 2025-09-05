import { apiClient } from "./apiClient";

export const vulnerabilitiesApi = {
  // Get vulnerabilities with pagination and filtering
  async getVulnerabilities(params = {}) {
    const queryParams = new URLSearchParams(params);
    const endpoint = queryParams.toString() ? `/vulnerabilities?${queryParams}` : '/vulnerabilities';

    console.log('🌐 Making vulnerabilities API call to:', endpoint);

    return await apiClient.get(endpoint);
  },

  // Get vulnerability details by ID
  async getVulnerabilityDetails(id) {
    console.log('🌐 Getting vulnerability details for ID:', id);
    return await apiClient.get(`/vulnerabilities/${id}`);
  },

  // Get vulnerability CVEs
  async getVulnerabilityCVEs(id) {
    console.log('🌐 Getting CVEs for vulnerability ID:', id);
    return await apiClient.get(`/vulnerabilities/${id}/cves`);
  },

  // Get vulnerability patches
  async getVulnerabilityPatches(id) {
    console.log('🌐 Getting patches for vulnerability ID:', id);
    return await apiClient.get(`/vulnerabilities/${id}/patches`);
  },

  // Get vulnerability assets
  async getVulnerabilityAssets(id, params = {}) {
    const queryParams = new URLSearchParams(params);
    const endpoint = queryParams.toString() ? `/vulnerabilities/${id}/assets?${queryParams}` : `/vulnerabilities/${id}/assets`;
    console.log('🌐 Getting assets for vulnerability ID:', id);
    return await apiClient.get(endpoint);
  },

  // Get vulnerability analytics
  async getVulnerabilityAnalytics(params = {}) {
    const queryParams = new URLSearchParams(params);
    const endpoint = queryParams.toString() ? `/vulnerability-analytics/summary?${queryParams}` : '/vulnerability-analytics/summary';
    console.log('🌐 Getting vulnerability analytics');
    return await apiClient.get(endpoint);
  },

  // Get vulnerability cost analysis
  async getVulnerabilityCostAnalysis(id) {
    console.log('🌐 Getting cost analysis for vulnerability ID:', id);
    return await apiClient.get(`/vulnerability-analytics/cost-analysis/${id}`);
  },

  // Update vulnerability status
  async updateVulnerabilityStatus(id, status) {
    console.log('🌐 Updating vulnerability status for ID:', id, 'to:', status);
    return await apiClient.put(`/vulnerabilities/${id}/status`, { status });
  },

  // Create vulnerability note
  async createVulnerabilityNote(id, note) {
    console.log('🌐 Creating note for vulnerability ID:', id);
    return await apiClient.post(`/vulnerabilities/${id}/notes`, { note });
  },

  // Get vulnerability summary statistics
  async getVulnerabilitySummary() {
    console.log('🌐 Getting vulnerability summary statistics');
    return await apiClient.get('/vulnerabilities/summary');
  }
};