require('dotenv').config();
const { getEnvironmentSecrets } = require('../utils/secretsManager');

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
const SECRETS_ENV = NODE_ENV === 'production' ? 'prod' : 'dev';

// Flag to enable/disable AWS Secrets Manager
const USE_SECRETS_MANAGER = process.env.USE_SECRETS_MANAGER !== 'false';

let config = {
  // Server configuration
  PORT: process.env.PORT || 3001,
  NODE_ENV: NODE_ENV,

  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // CORS configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,

  // File upload
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB

  // Email configuration (if needed)
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,

  // Secrets Manager configuration
  USE_SECRETS_MANAGER: USE_SECRETS_MANAGER,
  SECRETS_ENV: SECRETS_ENV
};

/**
 * Initialize configuration with AWS Secrets Manager
 * This function loads secrets and merges them with existing config
 */
async function initializeConfig() {
  if (!USE_SECRETS_MANAGER) {
    console.log('🔧 Using local environment variables (Secrets Manager disabled)');
    return config;
  }

  try {
    console.log(`🔐 Loading configuration from AWS Secrets Manager (${SECRETS_ENV} environment)...`);

    const secrets = await getEnvironmentSecrets(SECRETS_ENV);

    // Merge secrets with existing config, giving priority to secrets
    config = {
      ...config,
      ...secrets,
      // Keep some local overrides for development
      USE_SECRETS_MANAGER: USE_SECRETS_MANAGER,
      SECRETS_ENV: SECRETS_ENV
    };

    console.log('✅ Configuration successfully loaded from AWS Secrets Manager');
    return config;

  } catch (error) {
    console.error('❌ Failed to load secrets from AWS Secrets Manager:', error.message);
    console.log('🔄 Falling back to local environment variables...');

    // Fallback to local environment variables
    config.USE_SECRETS_MANAGER = false;
    return config;
  }
}

/**
 * Validate configuration
 * @param {Object} configToValidate - Configuration object to validate
 */
function validateConfig(configToValidate = config) {
  const requiredEnvVars = ['JWT_SECRET'];
  const warnings = [];

  // Check database configuration
  if (!configToValidate.DATABASE_URL && (!configToValidate.DB_HOST || !configToValidate.DB_NAME || !configToValidate.DB_USER || !configToValidate.DB_PASSWORD)) {
    warnings.push('Either DATABASE_URL or all DB component variables (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD) must be set');
  }

  requiredEnvVars.forEach((envVar) => {
    if (!configToValidate[envVar]) {
      warnings.push(`${envVar} environment variable is not set`);
    }
  });

  if (warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}

/**
 * Get configuration (async version that loads secrets)
 */
async function getConfig() {
  const initializedConfig = await initializeConfig();
  validateConfig(initializedConfig);
  return initializedConfig;
}

// Export both sync and async versions
module.exports = config; // Sync version for immediate use
module.exports.getConfig = getConfig; // Async version with secrets
module.exports.initializeConfig = initializeConfig;
module.exports.validateConfig = validateConfig;
