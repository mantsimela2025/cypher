/**
 * PM2 Ecosystem Configuration for CYPHER Application
 * Optimized for Windows Server 2019 deployment
 */

module.exports = {
  apps: [
    {
      name: 'cypher-api',
      script: './api/server.js',
      cwd: process.cwd(),
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: 'C:/deployments/logs/api-error.log',
      out_file: 'C:/deployments/logs/api-out.log',
      log_file: 'C:/deployments/logs/api-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 8000,
      
      // Windows-specific settings
      windowsHide: true,
      
      // Environment variables for production
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Database will be loaded from .env file
        // API keys will be loaded from .env file
      }
    }
  ],

  // Deployment configuration (optional - for PM2 deploy)
  deploy: {
    production: {
      user: 'Administrator',
      host: process.env.EC2_HOST || 'localhost',
      ref: 'origin/main',
      repo: 'git@gitlab.com:rasdash-group/cypher.git',
      path: 'C:/deployments/cypher',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
