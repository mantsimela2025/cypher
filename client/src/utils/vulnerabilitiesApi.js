const API_BASE_URL = 'http://localhost:3001/api/v1';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

// Create headers with auth token
const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const vulnerabilitiesApi = {
  // Get vulnerabilities with pagination and filtering
  async getVulnerabilities(params = {}) {
    const queryParams = new URLSearchParams(params);

    // Use the proper vulnerabilities endpoint
    const url = `${API_BASE_URL}/vulnerabilities?${queryParams}`;
    console.log('🌐 Making API call to:', url);

    const response = await fetch(url, {
      headers: createHeaders(),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    return handleResponse(response);
  },

  // Get vulnerability details by ID
  async getVulnerabilityDetails(id) {
    const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get vulnerability CVEs
  async getVulnerabilityCVEs(id) {
    const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/cves`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get vulnerability patches
  async getVulnerabilityPatches(id) {
    const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/patches`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get vulnerability assets
  async getVulnerabilityAssets(id, params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/assets?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get vulnerability analytics
  async getVulnerabilityAnalytics(params = {}) {
    const queryParams = new URLSearchParams(params);
    const response = await fetch(`${API_BASE_URL}/vulnerability-analytics/summary?${queryParams}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Get vulnerability cost analysis
  async getVulnerabilityCostAnalysis(id) {
    const response = await fetch(`${API_BASE_URL}/vulnerability-analytics/cost-analysis/${id}`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  },

  // Update vulnerability status
  async updateVulnerabilityStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/status`, {
      method: 'PUT',
      headers: createHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Create vulnerability note
  async createVulnerabilityNote(id, note) {
    const response = await fetch(`${API_BASE_URL}/vulnerabilities/${id}/notes`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ note }),
    });
    return handleResponse(response);
  },

  // Get vulnerability summary statistics
  async getVulnerabilitySummary() {
    const response = await fetch(`${API_BASE_URL}/vulnerabilities/summary`, {
      headers: createHeaders(),
    });
    return handleResponse(response);
  }
};