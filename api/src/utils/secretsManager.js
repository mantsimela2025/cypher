/**
 * AWS Secrets Manager Utility
 * Centralized secrets management for CYPHER application
 * Follows API Client Consistency Guide patterns
 */

const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize AWS Secrets Manager client
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // Credentials will be automatically detected from:
  // 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // 2. IAM roles (if running on EC2)
  // 3. AWS profiles (~/.aws/credentials)
});

// Cache for secrets to avoid repeated API calls
const secretsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get secret from AWS Secrets Manager with caching
 * @param {string} secretName - Name of the secret in AWS Secrets Manager
 * @param {boolean} useCache - Whether to use cached value (default: true)
 * @returns {Promise<Object>} Parsed secret object
 */
async function getSecret(secretName, useCache = true) {
  try {
    // Check cache first
    if (useCache && secretsCache.has(secretName)) {
      const cached = secretsCache.get(secretName);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`🔐 Using cached secret: ${secretName}`);
        return cached.data;
      }
      // Remove expired cache entry
      secretsCache.delete(secretName);
    }

    console.log(`🔐 Fetching secret from AWS: ${secretName}`);
    
    const command = new GetSecretValueCommand({
      SecretId: secretName,
    });

    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} does not contain string data`);
    }

    const secretData = JSON.parse(response.SecretString);
    
    // Cache the secret
    if (useCache) {
      secretsCache.set(secretName, {
        data: secretData,
        timestamp: Date.now()
      });
    }

    console.log(`✅ Successfully retrieved secret: ${secretName}`);
    return secretData;

  } catch (error) {
    console.error(`❌ Error retrieving secret ${secretName}:`, error.message);
    
    // In development, provide helpful error messages
    if (process.env.NODE_ENV === 'development') {
      console.error('💡 Troubleshooting tips:');
      console.error('   1. Check AWS credentials are configured');
      console.error('   2. Verify IAM permissions for SecretsManager:GetSecretValue');
      console.error('   3. Confirm secret name exists in AWS Secrets Manager');
      console.error('   4. Check AWS region configuration');
    }
    
    throw error;
  }
}

/**
 * Get all secrets for a specific environment
 * @param {string} environment - Environment (dev, prod, etc.)
 * @returns {Promise<Object>} Combined configuration object
 */
async function getEnvironmentSecrets(environment = 'dev') {
  try {
    console.log(`🔐 Loading all secrets for environment: ${environment}`);
    
    const secretPromises = [
      getSecret(`cypher/${environment}/database`),
      getSecret(`cypher/${environment}/api-keys`),
      getSecret(`cypher/${environment}/email`),
      getSecret(`cypher/${environment}/app-config`),
      getSecret(`cypher/aws/config`)
    ];

    // Add optional secrets that might not exist in all environments
    if (environment === 'dev') {
      secretPromises.push(getSecret(`cypher/${environment}/tenable`));
    }

    const [
      database,
      apiKeys,
      email,
      appConfig,
      awsConfig,
      tenable
    ] = await Promise.all(secretPromises);

    const combinedConfig = {
      // Database configuration
      DATABASE_URL: database.url,
      PGHOST: database.host,
      PGPORT: database.port,
      PGUSER: database.username,
      PGPASSWORD: database.password,
      PGDATABASE: database.dbname,
      
      // API Keys
      OPENAI_API_KEY: apiKeys.OPENAI_API_KEY,
      ANTHROPIC_API_KEY: apiKeys.ANTHROPIC_API_KEY,
      MAILERSEND_API_KEY: apiKeys.MAILERSEND_API_KEY,
      NVD_API_KEY: apiKeys.NVD_API_KEY,
      JWT_SECRET: apiKeys.JWT_SECRET,
      ENCRYPTION_KEY: apiKeys.ENCRYPTION_KEY,
      SESSION_SECRET: apiKeys.SESSION_SECRET,
      
      // Email configuration
      EMAIL_HOST: email.EMAIL_HOST,
      EMAIL_PORT: email.EMAIL_PORT,
      EMAIL_SECURE: email.EMAIL_SECURE,
      EMAIL_USER: email.EMAIL_USER,
      EMAIL_PASSWORD: email.EMAIL_PASSWORD,
      EMAIL_TLS_REJECT_UNAUTHORIZED: email.EMAIL_TLS_REJECT_UNAUTHORIZED,
      EMAIL_FROM: email.EMAIL_FROM,
      EMAIL_FROM_NAME: email.EMAIL_FROM_NAME,
      ADMIN_EMAIL: email.ADMIN_EMAIL,
      AWS_SES_REGION: email.AWS_SES_REGION,
      
      // Application configuration
      PORT: appConfig.PORT,
      NODE_ENV: appConfig.NODE_ENV,
      DEFAULT_AI_PROVIDER: appConfig.DEFAULT_AI_PROVIDER,
      CORS_ORIGIN: appConfig.CORS_ORIGIN,
      RATE_LIMIT_WINDOW_MS: appConfig.RATE_LIMIT_WINDOW_MS,
      RATE_LIMIT_MAX_REQUESTS: appConfig.RATE_LIMIT_MAX_REQUESTS,
      MAX_FILE_SIZE: appConfig.MAX_FILE_SIZE,
      FRONTEND_URL: appConfig.FRONTEND_URL,
      JWT_EXPIRES_IN: appConfig.JWT_EXPIRES_IN,
      AUTH_BYPASS: appConfig.AUTH_BYPASS,
      
      // AWS configuration
      S3_BUCKET: awsConfig.S3_BUCKET,
      AWS_REGION: awsConfig.AWS_REGION,
      CLOUDFRONT_DOMAIN: awsConfig.CLOUDFRONT_DOMAIN,
      SES_FROM_EMAIL: awsConfig.SES_FROM_EMAIL
    };

    // Add Tenable configuration if available (dev environment)
    if (tenable) {
      combinedConfig.TENABLE_BASE_URL = tenable.TENABLE_BASE_URL;
      combinedConfig.TENABLE_ACCESS_KEY = tenable.TENABLE_ACCESS_KEY;
      combinedConfig.TENABLE_SECRET_KEY = tenable.TENABLE_SECRET_KEY;
    }

    console.log(`✅ Successfully loaded ${Object.keys(combinedConfig).length} configuration values`);
    return combinedConfig;

  } catch (error) {
    console.error(`❌ Error loading environment secrets for ${environment}:`, error.message);
    throw error;
  }
}

/**
 * Clear secrets cache (useful for testing or forced refresh)
 */
function clearSecretsCache() {
  secretsCache.clear();
  console.log('🗑️ Secrets cache cleared');
}

/**
 * Get cache statistics
 */
function getCacheStats() {
  return {
    size: secretsCache.size,
    entries: Array.from(secretsCache.keys()),
    lastUpdated: Math.max(...Array.from(secretsCache.values()).map(v => v.timestamp))
  };
}

/**
 * Health check for AWS Secrets Manager connectivity
 */
async function healthCheck() {
  try {
    // Try to fetch a simple secret to verify connectivity
    await getSecret('cypher/aws/config', false); // Don't use cache for health check
    return { status: 'healthy', message: 'AWS Secrets Manager is accessible' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `AWS Secrets Manager error: ${error.message}` 
    };
  }
}

module.exports = {
  getSecret,
  getEnvironmentSecrets,
  clearSecretsCache,
  getCacheStats,
  healthCheck
};
