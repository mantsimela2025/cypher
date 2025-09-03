const app = require('./src/app');
const config = require('./src/config');
const { testConnection } = require('./src/db');

// Development optimizations
const isDevelopment = config.NODE_ENV === 'development';
const devConfig = isDevelopment ? require('./src/config/development') : {};

// Import systems management services
const systemDiscoveryService = require('./src/services/systems/systemDiscoveryService');
const securityPostureService = require('./src/services/systems/securityPostureService');
const riskScoringService = require('./src/services/systems/riskScoringService');
const configurationDriftService = require('./src/services/systems/configurationDriftService');

const PORT = config.PORT || 3000;

// Fast server startup with background service initialization
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();

    // Start server immediately after DB connection
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
      console.log('🔐 Authentication is REQUIRED for all requests. Login screen will be shown on startup.');

      // Initialize heavy services in background after server starts
      initializeBackgroundServices();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Background service initialization (non-blocking)
const initializeBackgroundServices = async () => {
  // Skip heavy services in development if configured
  if (isDevelopment && devConfig.SKIP_HEAVY_SERVICES) {
    console.log('⚡ Skipping heavy services for fast development startup');
    return;
  }

  console.log('🔄 Initializing background services...');

  try {
    if (isDevelopment && devConfig.DEFER_SERVICE_INIT) {
      // Stagger service initialization in development
      console.log('⚡ Using staggered service initialization for development');

      setTimeout(() => initializeService('systemDiscovery', systemDiscoveryService),
        devConfig.SERVICE_INIT_DELAYS.systemDiscovery);
      setTimeout(() => initializeService('securityPosture', securityPostureService),
        devConfig.SERVICE_INIT_DELAYS.securityPosture);
      setTimeout(() => initializeService('riskScoring', riskScoringService),
        devConfig.SERVICE_INIT_DELAYS.riskScoring);
      setTimeout(() => initializeService('configurationDrift', configurationDriftService),
        devConfig.SERVICE_INIT_DELAYS.configurationDrift);
    } else {
      // Initialize services in parallel for faster startup
      const servicePromises = [
        initializeService('systemDiscovery', systemDiscoveryService),
        initializeService('securityPosture', securityPostureService),
        initializeService('riskScoring', riskScoringService),
        initializeService('configurationDrift', configurationDriftService)
      ];

      await Promise.allSettled(servicePromises);
    }

    console.log('✅ Background services initialization completed');
  } catch (error) {
    console.warn('⚠️ Some background services failed to initialize:', error.message);
    // Don't crash the server if background services fail
  }
};

// Helper function to initialize individual services
const initializeService = async (serviceName, service) => {
  try {
    const startTime = Date.now();
    await service.initialize();
    const duration = Date.now() - startTime;
    console.log(`✅ ${serviceName} service initialized in ${duration}ms`);
  } catch (err) {
    console.warn(`⚠️ ${serviceName} service failed to initialize:`, err.message);
  }
};

startServer();
