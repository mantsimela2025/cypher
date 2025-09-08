/**
 * Client-Side Secrets Configuration
 * Handles environment-specific configuration for the React client
 * Follows API Client Consistency Guide patterns
 */

import { ENV, currentEnv, log } from './config';

// Flag to enable AWS Secrets Manager integration (for future client-side secrets)
const USE_SECRETS_MANAGER = import.meta.env.VITE_USE_SECRETS_MANAGER === 'true';

/**
 * Get client configuration from environment variables
 * Client-side secrets are loaded from environment variables at build time
 * Sensitive secrets should never be exposed to the client
 */
function getClientConfig() {
  const config = {
    // API Configuration
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1',
    
    // Application Configuration
    APP_NAME: import.meta.env.VITE_APP_NAME || 'CYPHER',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    
    // Feature Flags
    ENABLE_DEV_TOOLS: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
    ENABLE_CONSOLE_LOGS: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
    ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
    
    // Environment Info
    NODE_ENV: currentEnv,
    USE_SECRETS_MANAGER: USE_SECRETS_MANAGER
  };

  return config;
}

/**
 * Environment-specific configurations
 * These are safe to expose to the client as they don't contain secrets
 */
const ENVIRONMENT_CONFIGS = {
  [ENV.DEVELOPMENT]: {
    api: {
      baseUrl: 'http://localhost:3001/api/v1',
      timeout: 30000,
      enableLogs: true
    },
    features: {
      enableDevTools: true,
      enableMockData: false,
      enableConsoleLogging: true
    },
    cache: {
      ttl: 2 * 60 * 1000, // 2 minutes for faster development
      maxSize: 100
    }
  },
  [ENV.PRODUCTION]: {
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.your-domain.com/api/v1',
      timeout: 30000,
      enableLogs: false
    },
    features: {
      enableDevTools: false,
      enableMockData: false,
      enableConsoleLogging: false
    },
    cache: {
      ttl: 10 * 60 * 1000, // 10 minutes for production
      maxSize: 500
    }
  },
  [ENV.TEST]: {
    api: {
      baseUrl: 'http://localhost:3001/api/v1',
      timeout: 10000,
      enableLogs: false
    },
    features: {
      enableDevTools: false,
      enableMockData: true,
      enableConsoleLogging: false
    },
    cache: {
      ttl: 1000, // 1 second for testing
      maxSize: 10
    }
  }
};

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const envConfig = ENVIRONMENT_CONFIGS[currentEnv] || ENVIRONMENT_CONFIGS[ENV.DEVELOPMENT];
  const clientConfig = getClientConfig();
  
  // Override with actual environment variables
  if (clientConfig.API_BASE_URL) {
    envConfig.api.baseUrl = clientConfig.API_BASE_URL;
  }
  
  return {
    ...envConfig,
    client: clientConfig
  };
}

/**
 * Validate client configuration
 */
export function validateClientConfig() {
  const config = getClientConfig();
  const issues = [];
  
  if (!config.API_BASE_URL) {
    issues.push('API_BASE_URL is not configured');
  }
  
  if (currentEnv === ENV.PRODUCTION && config.API_BASE_URL.includes('localhost')) {
    issues.push('Production environment should not use localhost API URL');
  }
  
  if (currentEnv === ENV.PRODUCTION && config.ENABLE_DEV_TOOLS) {
    issues.push('Development tools should be disabled in production');
  }
  
  if (currentEnv === ENV.PRODUCTION && config.ENABLE_CONSOLE_LOGS) {
    issues.push('Console logging should be disabled in production');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    config
  };
}

/**
 * Initialize client configuration with validation
 */
export function initializeClientConfig() {
  const validation = validateClientConfig();
  const envConfig = getEnvironmentConfig();
  
  if (currentEnv === ENV.DEVELOPMENT) {
    log.info('🔧 Client configuration loaded:', {
      environment: currentEnv,
      apiBaseUrl: envConfig.api.baseUrl,
      appName: envConfig.client.APP_NAME,
      version: envConfig.client.APP_VERSION,
      useSecretsManager: envConfig.client.USE_SECRETS_MANAGER
    });
    
    if (!validation.isValid) {
      log.warn('⚠️ Client configuration issues:', validation.issues);
    } else {
      log.info('✅ Client configuration is valid');
    }
  }
  
  return {
    ...envConfig,
    validation
  };
}

/**
 * Get API configuration for apiClient
 */
export function getApiConfig() {
  const envConfig = getEnvironmentConfig();
  return {
    baseUrl: envConfig.api.baseUrl,
    timeout: envConfig.api.timeout,
    enableLogs: envConfig.api.enableLogs
  };
}

/**
 * Configuration health check
 */
export function configHealthCheck() {
  const validation = validateClientConfig();
  const config = getClientConfig();
  
  return {
    status: validation.isValid ? 'healthy' : 'warning',
    message: validation.isValid ? 'Client configuration is valid' : 'Client configuration has issues',
    details: {
      environment: currentEnv,
      apiBaseUrl: config.API_BASE_URL,
      issues: validation.issues
    }
  };
}

// Export the main configuration getter
export default {
  getClientConfig,
  getEnvironmentConfig,
  validateClientConfig,
  initializeClientConfig,
  getApiConfig,
  configHealthCheck,
  ENV,
  currentEnv
};
