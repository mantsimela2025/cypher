# Comprehensive Reporting System

Advanced reporting system with templates, configurations, scheduling, and multi-format generation capabilities for the RAS Dashboard API.

## 🎯 Overview

The Reporting System provides:
- **Template Management** - Reusable report templates with configurable parameters
- **Configuration Management** - Saved report configurations for consistent generation
- **Schedule Management** - Automated report generation with flexible scheduling
- **Multi-Format Generation** - Support for PDF, Excel, CSV, JSON, HTML, Word, and PowerPoint
- **File Management** - Secure file storage and download capabilities
- **Analytics & Tracking** - Comprehensive usage analytics and performance monitoring
- **Sharing & Collaboration** - Report sharing with access controls and subscriptions

## 🏗️ Database Schema

### Core Tables
```sql
-- Report Templates: Reusable report templates
report_templates (id, name, description, module, template_data, is_system,
                 created_by, created_at, updated_at)

-- Report Configurations: Saved report configurations
report_configurations (id, name, template_id, parameters, created_by,
                      created_at, updated_at)

-- Report Schedules: Automated report scheduling
report_schedules (id, name, configuration_id, frequency, cron_expression,
                 next_run, last_run, recipients, delivery_method, active,
                 timezone, created_by, created_at, updated_at)

-- Reports: Generated reports
reports (id, name, description, type, status, format, parameters, file_path,
        file_size, generated_at, generated_by, scheduled_for, is_recurring,
        recurring_schedule, last_run_at, next_run_at, error_message,
        template_id, configuration_id, schedule_id, download_count,
        expires_at, metadata, created_at, updated_at)

-- Report Executions: Execution history and performance tracking
report_executions (id, report_id, schedule_id, status, started_at,
                  completed_at, duration, record_count, file_size,
                  error_message, executed_by, metadata, created_at)

-- Report Shares: Report sharing and access control
report_shares (id, report_id, shared_with, shared_by, access_level,
              expires_at, access_count, last_accessed_at, is_active,
              share_token, metadata, created_at, updated_at)

-- Report Subscriptions: User subscriptions to reports
report_subscriptions (id, user_id, report_id, schedule_id, delivery_method,
                     delivery_address, is_active, last_delivered_at,
                     delivery_count, preferences, created_at, updated_at)

-- Report Analytics: Usage analytics and performance metrics
report_analytics (id, report_id, template_id, date, generation_count,
                 download_count, share_count, view_count,
                 average_generation_time, total_file_size, error_count,
                 unique_users, metadata, created_at, updated_at)
```

### Relationships
```
Users ←→ ReportTemplates (created_by)
Users ←→ ReportConfigurations (created_by)
Users ←→ ReportSchedules (created_by)
Users ←→ Reports (generated_by)
Users ←→ ReportExecutions (executed_by)
Users ←→ ReportShares (shared_with, shared_by)
Users ←→ ReportSubscriptions (user_id)

ReportTemplates ←→ ReportConfigurations (template_id)
ReportConfigurations ←→ ReportSchedules (configuration_id)
ReportTemplates ←→ Reports (template_id)
ReportConfigurations ←→ Reports (configuration_id)
ReportSchedules ←→ Reports (schedule_id)
Reports ←→ ReportExecutions (report_id)
ReportSchedules ←→ ReportExecutions (schedule_id)
Reports ←→ ReportShares (report_id)
Reports ←→ ReportSubscriptions (report_id)
ReportSchedules ←→ ReportSubscriptions (schedule_id)
```

## 📊 Report Types

### Supported Report Types
```javascript
const REPORT_TYPES = [
  'dashboard',           // Dashboard summaries and KPIs
  'metrics',            // System and application metrics
  'analytics',          // Data analytics and insights
  'compliance',         // Compliance and regulatory reports
  'audit',              // Audit trails and logs
  'security',           // Security incidents and assessments
  'asset',              // Asset inventory and management
  'vulnerability',      // Vulnerability assessments and scans
  'policy',             // Policy compliance and coverage
  'procedure',          // Procedure execution and compliance
  'user_activity',      // User activity and behavior
  'system_performance', // System performance metrics
  'financial',          // Financial and cost reports
  'operational',        // Operational metrics and KPIs
  'custom'              // Custom report types
];
```

### Report Status Workflow
```javascript
const REPORT_STATUSES = [
  'draft',      // Initial state, not yet generated
  'generating', // Currently being generated
  'completed',  // Successfully generated
  'failed',     // Generation failed
  'scheduled',  // Scheduled for future generation
  'cancelled',  // Generation cancelled
  'expired'     // Report has expired
];
```

### Supported Output Formats
```javascript
const REPORT_FORMATS = [
  'pdf',        // Portable Document Format
  'excel',      // Microsoft Excel (.xlsx)
  'csv',        // Comma-Separated Values
  'json',       // JavaScript Object Notation
  'html',       // HyperText Markup Language
  'word',       // Microsoft Word (.docx)
  'powerpoint'  // Microsoft PowerPoint (.pptx)
];
```

## 📝 Template Management

### Template Structure
```javascript
const reportTemplate = {
  name: 'Monthly Security Report Template',
  description: 'Comprehensive monthly security assessment template',
  module: 'security',
  templateData: {
    sections: [
      'executive_summary',
      'threat_landscape',
      'incident_analysis',
      'vulnerability_assessment',
      'compliance_status',
      'recommendations'
    ],
    parameters: {
      dateRange: { type: 'string', default: '30d', required: true },
      includeTrends: { type: 'boolean', default: true },
      severityFilter: { type: 'array', default: ['high', 'critical'] },
      outputFormat: { type: 'string', default: 'pdf' }
    },
    queries: {
      incidents: 'SELECT * FROM security_incidents WHERE created_at >= ?',
      vulnerabilities: 'SELECT * FROM vulnerabilities WHERE severity IN (?)',
      compliance: 'SELECT * FROM compliance_checks WHERE status = ?'
    },
    formatting: {
      title: 'Monthly Security Report - {{month}} {{year}}',
      logo: '/assets/company-logo.png',
      footer: 'Confidential - Internal Use Only',
      colors: {
        primary: '#1f2937',
        secondary: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      }
    }
  },
  isSystem: false
};
```

### Template Categories
```javascript
const templateCategories = {
  'security': {
    description: 'Security-related reports and assessments',
    commonParameters: ['dateRange', 'severityFilter', 'assetScope'],
    defaultFormat: 'pdf'
  },
  'compliance': {
    description: 'Regulatory compliance and audit reports',
    commonParameters: ['framework', 'scope', 'assessmentDate'],
    defaultFormat: 'excel'
  },
  'operational': {
    description: 'Operational metrics and performance reports',
    commonParameters: ['timeframe', 'departments', 'kpiSelection'],
    defaultFormat: 'html'
  },
  'financial': {
    description: 'Financial analysis and cost reports',
    commonParameters: ['fiscalPeriod', 'costCenters', 'currency'],
    defaultFormat: 'excel'
  }
};
```

## ⚙️ Configuration Management

### Configuration Structure
```javascript
const reportConfiguration = {
  name: 'Weekly Security Dashboard',
  templateId: 1,
  parameters: {
    dateRange: '7d',
    includeTrends: true,
    severityFilter: ['high', 'critical'],
    outputFormat: 'pdf',
    recipients: ['security-team@company.com'],
    customFilters: {
      assetTypes: ['server', 'workstation'],
      locations: ['datacenter-1', 'office-main'],
      businessUnits: ['IT', 'Finance']
    },
    formatting: {
      includeCharts: true,
      chartTypes: ['bar', 'line', 'pie'],
      pageOrientation: 'portrait',
      fontSize: 12,
      margins: { top: 20, bottom: 20, left: 15, right: 15 }
    }
  }
};
```

### Parameter Validation
```javascript
const parameterValidation = {
  dateRange: {
    type: 'string',
    pattern: /^\d+[dwmy]$/, // e.g., 7d, 4w, 1m, 1y
    required: true,
    description: 'Time range for data collection'
  },
  severityFilter: {
    type: 'array',
    items: { enum: ['low', 'medium', 'high', 'critical'] },
    minItems: 1,
    description: 'Severity levels to include'
  },
  outputFormat: {
    type: 'string',
    enum: ['pdf', 'excel', 'csv', 'json', 'html'],
    default: 'pdf',
    description: 'Output format for the report'
  },
  includeCharts: {
    type: 'boolean',
    default: true,
    description: 'Whether to include charts and visualizations'
  }
};
```

## 📅 Schedule Management

### Schedule Frequencies
```javascript
const SCHEDULE_FREQUENCIES = [
  'once',       // One-time execution
  'daily',      // Every day
  'weekly',     // Every week
  'monthly',    // Every month
  'quarterly',  // Every quarter
  'yearly',     // Every year
  'custom'      // Custom cron expression
];
```

### Schedule Configuration
```javascript
const reportSchedule = {
  name: 'Daily Security Summary',
  configurationId: 1,
  frequency: 'daily',
  cronExpression: '0 8 * * *', // 8 AM daily
  nextRun: '2024-01-16T08:00:00Z',
  lastRun: '2024-01-15T08:00:00Z',
  recipients: [
    'security-team@company.com',
    'ciso@company.com',
    'operations@company.com'
  ],
  deliveryMethod: 'email',
  active: true,
  timezone: 'America/New_York'
};
```

### Cron Expression Examples
```javascript
const cronExamples = {
  'daily_8am': '0 8 * * *',           // Every day at 8 AM
  'weekly_monday': '0 9 * * 1',       // Every Monday at 9 AM
  'monthly_first': '0 10 1 * *',      // First day of month at 10 AM
  'quarterly': '0 9 1 1,4,7,10 *',    // Quarterly on 1st at 9 AM
  'business_hours': '0 9-17 * * 1-5', // Every hour 9-5, Mon-Fri
  'end_of_month': '0 18 L * *'        // Last day of month at 6 PM
};
```

## 🔄 Report Generation Process

### Generation Workflow
```
1. Request Validation →
2. Template/Configuration Loading →
3. Parameter Processing →
4. Data Collection →
5. Content Generation →
6. Format Conversion →
7. File Storage →
8. Notification Delivery →
9. Analytics Recording
```

### Data Collection Methods
```javascript
const dataCollectionMethods = {
  database: {
    description: 'Direct database queries',
    example: 'SELECT * FROM vulnerabilities WHERE severity = ?'
  },
  api: {
    description: 'External API calls',
    example: 'GET /api/v1/metrics?timeframe=30d'
  },
  file: {
    description: 'File system data',
    example: 'Read log files from /var/log/security/'
  },
  calculation: {
    description: 'Computed metrics',
    example: 'Calculate risk scores from multiple data sources'
  }
};
```

### Content Generation
```javascript
const contentGeneration = {
  sections: {
    header: 'Company logo, report title, generation date',
    summary: 'Executive summary with key findings',
    metrics: 'Key performance indicators and statistics',
    charts: 'Visual representations of data',
    details: 'Detailed findings and analysis',
    recommendations: 'Actionable recommendations',
    appendix: 'Supporting data and references',
    footer: 'Confidentiality notice and page numbers'
  },
  formatting: {
    fonts: ['Arial', 'Helvetica', 'Times New Roman'],
    colors: 'Corporate color scheme',
    layout: 'Professional business format',
    branding: 'Company logo and styling'
  }
};
```

## 🚀 API Endpoints

### Report Template Management (5 endpoints)
```javascript
// Template CRUD operations
POST   /api/v1/reports/templates              // Create template
GET    /api/v1/reports/templates              // Get all templates with filtering
GET    /api/v1/reports/templates/:id          // Get template by ID
PUT    /api/v1/reports/templates/:id          // Update template
DELETE /api/v1/reports/templates/:id          // Delete template
```

### Report Configuration Management (3 endpoints)
```javascript
// Configuration CRUD operations
POST   /api/v1/reports/configurations         // Create configuration
GET    /api/v1/reports/configurations         // Get all configurations with filtering
GET    /api/v1/reports/configurations/:id     // Get configuration by ID
```

### Report Generation & Management (5 endpoints)
```javascript
// Report operations
POST   /api/v1/reports                        // Generate report
GET    /api/v1/reports                        // Get all reports with filtering
GET    /api/v1/reports/:id                    // Get report by ID
GET    /api/v1/reports/:id/download           // Download report file
DELETE /api/v1/reports/:id                    // Delete report
```

## 🛠️ Usage Examples

### Creating a Report Template
```javascript
const templateData = {
  name: 'Vulnerability Assessment Report',
  description: 'Comprehensive vulnerability assessment with risk analysis',
  module: 'security',
  templateData: {
    sections: [
      'executive_summary',
      'methodology',
      'findings',
      'risk_analysis',
      'remediation_plan'
    ],
    parameters: {
      scanType: { type: 'string', enum: ['full', 'targeted'], default: 'full' },
      severityThreshold: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
      includeRemediation: { type: 'boolean', default: true },
      assetScope: { type: 'array', items: { type: 'string' } }
    },
    queries: {
      vulnerabilities: `
        SELECT v.*, a.name as asset_name, a.type as asset_type
        FROM vulnerabilities v
        JOIN assets a ON v.asset_id = a.id
        WHERE v.severity >= ? AND v.status = 'open'
        ORDER BY v.cvss_score DESC
      `,
      riskScores: `
        SELECT asset_id, AVG(cvss_score) as avg_risk
        FROM vulnerabilities
        WHERE status = 'open'
        GROUP BY asset_id
        ORDER BY avg_risk DESC
      `
    },
    formatting: {
      title: 'Vulnerability Assessment Report - {{date}}',
      classification: 'CONFIDENTIAL',
      pageNumbers: true,
      tableOfContents: true
    }
  },
  isSystem: false
};

const template = await reportService.createTemplate(templateData, userId);
```

### Creating a Report Configuration
```javascript
const configurationData = {
  name: 'Monthly Vulnerability Report - Critical Assets',
  templateId: template.id,
  parameters: {
    scanType: 'targeted',
    severityThreshold: 'high',
    includeRemediation: true,
    assetScope: ['production-servers', 'database-servers', 'web-applications'],
    customFilters: {
      businessCritical: true,
      publicFacing: true,
      dataClassification: ['confidential', 'restricted']
    },
    outputSettings: {
      format: 'pdf',
      includeCharts: true,
      detailLevel: 'comprehensive',
      appendices: ['raw_data', 'methodology', 'references']
    }
  }
};

const configuration = await reportService.createConfiguration(configurationData, userId);
```

### Generating a Report
```javascript
const reportData = {
  name: 'Q1 2024 Security Assessment',
  description: 'Quarterly security assessment covering all critical systems',
  type: 'security',
  format: 'pdf',
  parameters: {
    quarter: 'Q1',
    year: 2024,
    scope: 'all-systems',
    includeExecutiveSummary: true,
    includeRecommendations: true,
    detailLevel: 'comprehensive'
  },
  templateId: template.id,
  configurationId: configuration.id,
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  metadata: {
    requestedBy: 'CISO',
    priority: 'high',
    distribution: 'executive-team',
    classification: 'confidential'
  }
};

const report = await reportService.generateReport(reportData, userId);
console.log(`Report generation started: ${report.id}`);
```

### Advanced Filtering and Search
```javascript
// Get reports with complex filtering
const reports = await reportService.getAllReports({
  type: 'security',
  status: 'completed',
  generatedBy: userId,
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-03-31T23:59:59Z',
  search: 'vulnerability assessment'
}, {
  page: 1,
  limit: 20,
  sortBy: 'generatedAt',
  sortOrder: 'desc'
});

console.log(`Found ${reports.pagination.totalCount} reports`);
reports.data.forEach(report => {
  console.log(`- ${report.name} (${report.type}) - ${report.status}`);
});
```

## 📊 Analytics and Monitoring

### Report Analytics
```javascript
const reportAnalytics = {
  overall: {
    totalReports: 1250,
    completedReports: 1180,
    failedReports: 45,
    scheduledReports: 25,
    successRate: 94.4,
    averageGenerationTime: 45000, // milliseconds
    totalFileSize: 2500000000, // bytes
    totalDownloads: 3200
  },
  byType: [
    { type: 'security', count: 450, avgSize: 2500000, avgTime: 60000 },
    { type: 'compliance', count: 320, avgSize: 1800000, avgTime: 40000 },
    { type: 'operational', count: 280, avgSize: 1200000, avgTime: 30000 }
  ],
  byFormat: [
    { format: 'pdf', count: 650, percentage: 52.0 },
    { format: 'excel', count: 380, percentage: 30.4 },
    { format: 'csv', count: 150, percentage: 12.0 },
    { format: 'html', count: 70, percentage: 5.6 }
  ],
  performance: {
    averageGenerationTime: 45000,
    p95GenerationTime: 120000,
    p99GenerationTime: 300000,
    errorRate: 3.6,
    peakHours: ['09:00', '14:00', '16:00']
  }
};
```

This comprehensive reporting system provides enterprise-grade report generation capabilities with advanced template management, flexible scheduling, multi-format output, and robust security controls for modern organizations.
