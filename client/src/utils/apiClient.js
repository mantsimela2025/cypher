import { toast } from "react-toastify";
import { API_CONFIG, log } from "./config";

// Use centralized configuration
const API_BASE_URL = API_CONFIG.BASE_URL;

// Log the API base URL in development
log.info('API Base URL:', API_BASE_URL);

// Helper to get access token from localStorage
const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

// Helper to get refresh token from localStorage
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// Helper to save new access token to localStorage
const setAccessToken = (token) => {
  localStorage.setItem('accessToken', token);
};

// Helper to remove tokens and user data and redirect to login
const logoutAndRedirect = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/auth-login';
};

// Check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    console.error('Failed to parse token', e);
    return true;
  }
};

// Refresh access token using refresh token
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.success && data.data && data.data.accessToken) {
      setAccessToken(data.data.accessToken);
      return data.data.accessToken;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
};

// Internal fetch wrapper with token refresh logic
const makeRequest = async (url, options = {}) => {
  let accessToken = getAccessToken();

  // Check if token expired, try to refresh
  if (isTokenExpired(accessToken)) {
    accessToken = await refreshAccessToken();
    if (!accessToken) {
      toast.error('Session expired. Please log in again.');
      logoutAndRedirect();
      return Promise.reject(new Error('Session expired'));
    }
  }

  // Ensure URL starts with API_BASE_URL if it's a relative path
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Add Authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${accessToken}`,
  };

  const fetchOptions = {
    ...options,
    headers,
  };

  const response = await fetch(fullUrl, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    if (errorMessage.toLowerCase().includes('token expired')) {
      toast.error('Session expired. Please log in again.');
      logoutAndRedirect();
      return Promise.reject(new Error('Session expired'));
    }
    return Promise.reject(new Error(errorMessage));
  }

  return response.json();
};

// Export apiClient with HTTP method helpers
export const apiClient = {
  get: (url, options = {}) => {
    return makeRequest(url, { ...options, method: 'GET' });
  },
  
  post: (url, data, options = {}) => {
    return makeRequest(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put: (url, data, options = {}) => {
    return makeRequest(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  patch: (url, data, options = {}) => {
    return makeRequest(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  
  delete: (url, options = {}) => {
    return makeRequest(url, { ...options, method: 'DELETE' });
  },
};
