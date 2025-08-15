const app = require('./src/app');
const config = require('./src/config');
const { testConnection } = require('./src/db');

// Import systems management services
const systemDiscoveryService = require('./src/services/systems/systemDiscoveryService');
const securityPostureService = require('./src/services/systems/securityPostureService');
const riskScoringService = require('./src/services/systems/riskScoringService');
const configurationDriftService = require('./src/services/systems/configurationDriftService');

const PORT = config.PORT || 3000;

// Test database connection and initialize services on startup
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();

    console.log('🔄 Initializing systems management services...');
    await systemDiscoveryService.initialize();
    await securityPostureService.initialize();
    await riskScoringService.initialize();
    await configurationDriftService.initialize();
    console.log('✅ Systems management services initialized');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
      // AUTH_BYPASS feature is disabled - authentication is always required
      console.log('🔐 Authentication is REQUIRED for all requests. Login screen will be shown on startup.');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
