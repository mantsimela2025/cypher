const app = require('./src/app');
const config = require('./src/config');
const { testConnection } = require('./src/db');

const PORT = config.PORT || 3000;

// Test database connection on startup
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
