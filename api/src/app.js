const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { swaggerSetup } = require('./config/swagger');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const integrationRoutes = require('./routes/integrations');

const app = express();

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/systems', require('./routes/systems'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/permissions', require('./routes/permissions'));
// Temporarily commented out routes with missing dependencies
// app.use('/api/v1/cves', require('./routes/cves'));
app.use('/api/v1/asset-management', require('./routes/assetManagement'));
app.use('/api/v1/asset-tags', require('./routes/assetTagsRoutes'));
app.use('/api/v1/vulnerabilities', require('./routes/vulnerabilities'));
app.use('/api/v1/vulnerability-analytics', require('./routes/vulnerabilityAnalytics'));
app.use('/api/v1/system-metrics', require('./routes/systemMetrics'));
app.use('/api/v1/metrics-dashboards', require('./routes/metricsDashboards'));
// app.use('/api/v1/asset-analytics', require('./routes/assetAnalytics'));
// app.use('/api/v1/ai-cost-optimization', require('./routes/aiCostOptimization'));
// app.use('/api/v1/nl-query', require('./routes/naturalLanguageQuery'));
// app.use('/api/v1/ato', require('./routes/ato'));
// app.use('/api/v1/audit-logs', require('./routes/auditLogs'));
app.use('/api/v1/metrics', require('./routes/metrics'));
app.use('/api/v1/dashboards', require('./routes/dashboards'));
// app.use('/api/v1/notifications', require('./routes/notifications'));
// app.use('/api/v1/access-requests', require('./routes/accessRequests'));
// app.use('/api/v1/policies', require('./routes/policies'));
// app.use('/api/v1/procedures', require('./routes/procedures'));
// app.use('/api/v1/reports', require('./routes/reports'));
// More temporarily commented routes
// app.use('/api/v1/stig', require('./routes/stig'));
// app.use('/api/v1/ai-assistance', require('./routes/aiAssistance'));
// app.use('/api/v1/modules', require('./routes/modules'));
app.use('/api/v1/categories', require('./routes/categories'));
app.use('/api/v1/documents', require('./routes/documents'));
// app.use('/api/v1/artifacts', require('./routes/artifacts')); // Temporarily disabled - missing dependencies
// app.use('/api/v1/scanner', require('./routes/scanner'));
// app.use('/api/v1/settings', require('./routes/settings'));

// API base route (catch-all for unmatched routes)
app.use('/api/v1', (req, res) => {
  res.json({ message: 'API v1 is running' });
});

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
