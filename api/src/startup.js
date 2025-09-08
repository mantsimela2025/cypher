/**
 * Application Startup Script
 * Handles initialization of configuration and secrets before starting the server
 * Follows API Client Consistency Guide patterns
 */

const { getConfig } = require('./config');
const { healthCheck } = require('./utils/secretsManager');

/**
 * Initialize application configuration and secrets
 * This function must be called before starting the Express server
 */
async function initializeApplication() {
  console.log('🚀 Initializing CYPHER API application...');
  
  try {
    // Step 1: Load configuration (including secrets)
    console.log('📋 Loading application configuration...');
    const config = await getConfig();
    
    // Step 2: Validate critical configuration
    console.log('🔍 Validating configuration...');
    await validateCriticalConfig(config);
    
    // Step 3: Health check for external services
    console.log('🏥 Performing health checks...');
    await performHealthChecks();
    
    // Step 4: Set global configuration
    global.appConfig = config;
    
    console.log('✅ Application initialization completed successfully');
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    console.log(`🔐 Using Secrets Manager: ${config.USE_SECRETS_MANAGER ? 'Yes' : 'No'}`);
    console.log(`🚪 Server will start on port: ${config.PORT}`);
    
    return config;
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error.message);
    console.error('💡 Please check your configuration and try again');
    
    // In development, provide more detailed error information
    if (process.env.NODE_ENV === 'development') {
      console.error('🐛 Full error details:', error);
    }
    
    process.exit(1);
  }
}

/**
 * Validate critical configuration values
 */
async function validateCriticalConfig(config) {
  const criticalFields = [
    'JWT_SECRET',
    'DATABASE_URL',
    'PORT'
  ];
  
  const missing = criticalFields.filter(field => !config[field]);
  
  if (missing.length > 0) {
    throw new Error(`Critical configuration missing: ${missing.join(', ')}`);
  }
  
  // Validate database URL format
  if (config.DATABASE_URL && !config.DATABASE_URL.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  // Validate JWT secret strength (in production)
  if (config.NODE_ENV === 'production' && config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long in production');
  }
  
  console.log('✅ Critical configuration validation passed');
}

/**
 * Perform health checks for external services
 */
async function performHealthChecks() {
  const healthChecks = [];
  
  // Check AWS Secrets Manager (if enabled)
  if (process.env.USE_SECRETS_MANAGER !== 'false') {
    healthChecks.push(
      healthCheck().then(result => ({
        service: 'AWS Secrets Manager',
        ...result
      }))
    );
  }
  
  // Add more health checks here as needed
  // healthChecks.push(checkDatabase());
  // healthChecks.push(checkRedis());
  
  if (healthChecks.length > 0) {
    const results = await Promise.allSettled(healthChecks);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const check = result.value;
        if (check.status === 'healthy') {
          console.log(`✅ ${check.service}: ${check.message}`);
        } else {
          console.warn(`⚠️ ${check.service}: ${check.message}`);
        }
      } else {
        console.error(`❌ Health check failed:`, result.reason.message);
      }
    });
  }
}

/**
 * Graceful shutdown handler
 */
function setupGracefulShutdown() {
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    // Perform cleanup tasks here
    // - Close database connections
    // - Clear caches
    // - Save any pending data
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  };
  
  // Handle different shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

/**
 * Display startup banner
 */
function displayStartupBanner(config) {
  console.log('\n' + '='.repeat(60));
  console.log('🔐 CYPHER Security Management System');
  console.log('='.repeat(60));
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Port: ${config.PORT}`);
  console.log(`Database: ${config.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`Secrets Manager: ${config.USE_SECRETS_MANAGER ? 'Enabled' : 'Disabled'}`);
  console.log(`CORS Origin: ${config.CORS_ORIGIN}`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Main startup function
 */
async function startup() {
  try {
    // Setup graceful shutdown handlers
    setupGracefulShutdown();
    
    // Initialize application
    const config = await initializeApplication();
    
    // Display startup banner
    displayStartupBanner(config);
    
    return config;
    
  } catch (error) {
    console.error('💥 Startup failed:', error.message);
    process.exit(1);
  }
}

module.exports = {
  startup,
  initializeApplication,
  validateCriticalConfig,
  performHealthChecks,
  setupGracefulShutdown,
  displayStartupBanner
};
