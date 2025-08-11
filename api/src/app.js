const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { swaggerSetup } = require('./config/swagger');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const {
  compression,
  rateLimit,
  authRateLimit,
  responseTime,
  cache,
  performanceHeaders,
  requestOptimization,
  getCacheStats,
  invalidateCache
} = require('./middleware/performance');

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const integrationRoutes = require('./routes/integrations');

const app = express();

// Performance middleware (must be early in the chain)
app.use(requestOptimization);
app.use(responseTime);
app.use(compression);
app.use(performanceHeaders);

// Rate limiting
app.use(rateLimit);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',  // Client on port 3000
    'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
    'http://localhost:5176', 'http://localhost:5177'  // Vite dev server fallback ports
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
swaggerSetup(app);

// Health check endpoint with performance metrics
app.get('/health', (req, res) => {
  const cacheStats = getCacheStats();
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cache: cacheStats,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    }
  });
});

// Cache management endpoints
app.get('/api/v1/cache/stats', (req, res) => {
  const stats = getCacheStats();
  res.json(stats);
});

app.delete('/api/v1/cache', (req, res) => {
  const { pattern } = req.query;
  const cleared = invalidateCache(pattern);
  res.json({
    message: pattern ? `Cache entries matching "${pattern}" cleared` : 'All cache cleared',
    cleared
  });
});

// Mount routes with appropriate middleware
app.use('/api/v1/users', cache(600), userRoutes); // Cache user data for 10 minutes
app.use('/api/v1/auth', authRateLimit, authRoutes); // Strict rate limiting for auth
app.use('/api/v1/integrations', cache(300), integrationRoutes); // Cache integrations for 5 minutes
app.use(require('./routes/userGroupRoutes')); // GET /api/v1/users/:id/groups
app.use('/api/v1/systems', cache(900), require('./routes/systems')); // Cache systems for 15 minutes
app.use('/api/v1/roles', cache(1800), require('./routes/roles')); // Cache roles for 30 minutes
app.use('/api/v1/permissions', cache(1800), require('./routes/permissions')); // Cache permissions for 30 minutes
// Temporarily commented out routes with missing dependencies
// app.use('/api/v1/cves', require('./routes/cves'));
app.use('/api/v1/asset-management', cache(600), require('./routes/assetManagement')); // Cache assets for 10 minutes
app.use('/api/v1/asset-tags', cache(900), require('./routes/assetTagsRoutes')); // Cache tags for 15 minutes
app.use('/api/v1/vulnerabilities', cache(300), require('./routes/vulnerabilities')); // Cache vulns for 5 minutes
app.use('/api/v1/vulnerability-analytics', cache(600), require('./routes/vulnerabilityAnalytics')); // Cache analytics for 10 minutes
app.use('/api/v1/system-metrics', cache(180), require('./routes/systemMetrics')); // Cache metrics for 3 minutes
app.use('/api/v1/metrics-dashboards', cache(300), require('./routes/metricsDashboards')); // Cache dashboards for 5 minutes

// Patch Management Routes
app.use('/api/v1/patches', cache(300), require('./routes/patches')); // Cache patches for 5 minutes
app.use('/api/v1/patch-jobs', cache(180), require('./routes/patchJobs')); // Cache jobs for 3 minutes (status changes frequently)
app.use('/api/v1/patch-schedules', cache(600), require('./routes/patchSchedules')); // Cache schedules for 10 minutes
// app.use('/api/v1/patch-ai', require('./routes/patchAI')); // No cache for AI responses (need fresh analysis) - Temporarily disabled due to missing openai dependency
// app.use('/api/v1/asset-analytics', require('./routes/assetAnalytics'));
// app.use('/api/v1/ai-cost-optimization', require('./routes/aiCostOptimization'));
app.use('/api/v1/nl-query', require('./routes/naturalLanguageQuery')); // No cache for NL queries
app.use('/api/v1/nl-query/data-sources', cache(3600), require('./routes/nlqDataSources')); // Cache data sources for 1 hour
// app.use('/api/v1/ato', require('./routes/ato'));
// app.use('/api/v1/audit-logs', require('./routes/auditLogs'));
app.use('/api/v1/metrics', cache(180), require('./routes/metrics')); // Cache metrics for 3 minutes
app.use('/api/v1/dashboards', cache(300), require('./routes/dashboards')); // Cache dashboards for 5 minutes
// app.use('/api/v1/notifications', require('./routes/notifications'));
// app.use('/api/v1/access-requests', require('./routes/accessRequests'));
// app.use('/api/v1/policies', require('./routes/policies'));
// app.use('/api/v1/procedures', require('./routes/procedures'));
// app.use('/api/v1/reports', require('./routes/reports'));
// More temporarily commented routes
// app.use('/api/v1/stig', require('./routes/stig'));
// app.use('/api/v1/ai-assistance', require('./routes/aiAssistance'));
// app.use('/api/v1/modules', require('./routes/modules'));
app.use('/api/v1/categories', cache(1800), require('./routes/categories')); // Cache categories for 30 minutes
app.use('/api/v1/documents', cache(600), require('./routes/documents')); // Cache documents for 10 minutes
// app.use('/api/v1/artifacts', require('./routes/artifacts')); // Temporarily disabled - missing dependencies
// app.use('/api/v1/scanner', require('./routes/scanner'));
// app.use('/api/v1/settings', require('./routes/settings'));

// Distribution Groups
app.use('/api/v1/distribution-groups', require('./routes/distributionGroupsRoutes'));

// API base route (catch-all for unmatched routes)
app.use('/api/v1', (req, res) => {
  res.json({ message: 'API v1 is running' });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
