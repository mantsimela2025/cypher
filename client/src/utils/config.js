/**
 * Application Configuration Utility
 * Centralized configuration management for different environments
 */

// Environment detection
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test'
};

export const currentEnv = import.meta.env.MODE || ENV.DEVELOPMENT;

// API Configuration - Now uses environment-aware configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
};

// Application Configuration
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || 'CYPHER',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENABLE_DEV_TOOLS: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
  ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
};

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_SIZE: 200,
  CLEANUP_INTERVAL: 5 * 60 * 1000 // 5 minutes
};

// Environment-specific configurations
const ENVIRONMENT_CONFIGS = {
  [ENV.DEVELOPMENT]: {
    api: {
      baseUrl: 'http://localhost:3001/api/v1',
      timeout: 30000,
      enableLogs: true
    },
    cache: {
      ttl: 2 * 60 * 1000, // 2 minutes for faster development
      maxSize: 100
    },
    features: {
      enableDevTools: true,
      enableMockData: false,
      enableConsoleLogging: true
    }
  },
  [ENV.PRODUCTION]: {
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.your-domain.com/api/v1',
      timeout: 30000,
      enableLogs: false
    },
    cache: {
      ttl: 10 * 60 * 1000, // 10 minutes for production
      maxSize: 500
    },
    features: {
      enableDevTools: false,
      enableMockData: false,
      enableConsoleLogging: false
    }
  },
  [ENV.TEST]: {
    api: {
      baseUrl: 'http://localhost:3001/api/v1',
      timeout: 10000,
      enableLogs: false
    },
    cache: {
      ttl: 1000, // 1 second for testing
      maxSize: 10
    },
    features: {
      enableDevTools: false,
      enableMockData: true,
      enableConsoleLogging: false
    }
  }
};

// Get current environment configuration
export const getEnvConfig = () => {
  return ENVIRONMENT_CONFIGS[currentEnv] || ENVIRONMENT_CONFIGS[ENV.DEVELOPMENT];
};

// Utility functions
export const isDevelopment = () => currentEnv === ENV.DEVELOPMENT;
export const isProduction = () => currentEnv === ENV.PRODUCTION;
export const isTest = () => currentEnv === ENV.TEST;

// API URL builders
export const buildApiUrl = (endpoint) => {
  const baseUrl = API_CONFIG.BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Logging utility that respects environment settings
export const log = {
  info: (...args) => {
    if (APP_CONFIG.ENABLE_CONSOLE_LOGS || isDevelopment()) {
      console.log('ℹ️', ...args);
    }
  },
  warn: (...args) => {
    if (APP_CONFIG.ENABLE_CONSOLE_LOGS || isDevelopment()) {
      console.warn('⚠️', ...args);
    }
  },
  error: (...args) => {
    // Always log errors
    console.error('❌', ...args);
  },
  debug: (...args) => {
    if (isDevelopment()) {
      console.debug('🐛', ...args);
    }
  },
  api: (...args) => {
    if (APP_CONFIG.ENABLE_CONSOLE_LOGS || isDevelopment()) {
      console.log('🌐', ...args);
    }
  }
};

// Configuration validation
export const validateConfig = () => {
  const issues = [];
  
  if (!API_CONFIG.BASE_URL) {
    issues.push('API_CONFIG.BASE_URL is not configured');
  }
  
  if (isProduction() && API_CONFIG.BASE_URL.includes('localhost')) {
    issues.push('Production environment should not use localhost API URL');
  }
  
  if (isProduction() && APP_CONFIG.ENABLE_DEV_TOOLS) {
    issues.push('Development tools should be disabled in production');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Initialize configuration logging
if (isDevelopment()) {
  console.log('🔧 Configuration loaded:', {
    environment: currentEnv,
    apiBaseUrl: API_CONFIG.BASE_URL,
    appName: APP_CONFIG.NAME,
    version: APP_CONFIG.VERSION
  });
  
  const validation = validateConfig();
  if (!validation.isValid) {
    console.warn('⚠️ Configuration issues:', validation.issues);
  }
}

export default {
  ENV,
  currentEnv,
  API_CONFIG,
  APP_CONFIG,
  CACHE_CONFIG,
  getEnvConfig,
  isDevelopment,
  isProduction,
  isTest,
  buildApiUrl,
  log,
  validateConfig
};
