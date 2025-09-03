/**
 * Development Environment Configuration
 * Optimized for fast startup and development workflow
 */

const config = {
  // Fast startup options
  SKIP_HEAVY_SERVICES: process.env.SKIP_HEAVY_SERVICES === 'true',
  DEFER_SERVICE_INIT: process.env.DEFER_SERVICE_INIT !== 'false', // Default to true
  
  // Service initialization delays (in milliseconds)
  SERVICE_INIT_DELAYS: {
    systemDiscovery: 2000,      // 2 seconds after server start
    securityPosture: 3000,     // 3 seconds after server start
    riskScoring: 4000,         // 4 seconds after server start
    configurationDrift: 5000,  // 5 seconds after server start
  },
  
  // Reduced monitoring intervals for development
  MONITORING_INTERVALS: {
    securityPosture: 5 * 60 * 1000,    // 5 minutes (vs 1 minute in prod)
    configurationDrift: 10 * 60 * 1000, // 10 minutes (vs 5 minutes in prod)
    systemDiscovery: 15 * 60 * 1000,   // 15 minutes (vs 10 minutes in prod)
  },
  
  // Reduced data loading for development
  DEVELOPMENT_LIMITS: {
    maxSystemsForBaseline: 3,     // Only load baselines for first 3 systems
    maxAssetsPerSystem: 5,        // Limit assets per system
    skipMockDataGeneration: true, // Skip generating mock baselines
  },
  
  // Logging configuration
  VERBOSE_LOGGING: process.env.VERBOSE_LOGGING === 'true',
  STARTUP_TIMING: process.env.STARTUP_TIMING === 'true',
};

module.exports = config;
