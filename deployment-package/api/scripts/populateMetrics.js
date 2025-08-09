const { db } = require('../src/db');
const { metrics } = require('../src/db/schema');

const sampleMetrics = [
  // Systems Metrics
  {
    name: 'Total Systems',
    description: 'Total number of systems in the environment',
    type: 'counter',
    category: 'systems',
    query: 'SELECT COUNT(*) as value FROM systems',
    value: 156,
    unit: 'systems',
    labels: {},
    threshold: { warning: 200, critical: 250 },
    source: 'systems_database',
    aggregationPeriod: 'daily',
    isActive: true,
    metadata: {
      icon: 'server',
      color: '#3b82f6',
      chartType: 'number',
      sampleData: { value: 156, trend: '+5.2%', trendDirection: 'up' }
    }
  },
  {
    name: 'Active Systems',
    description: 'Number of currently active systems',
    type: 'gauge',
    category: 'systems',
    query: 'SELECT COUNT(*) as value FROM systems WHERE status = \'active\'',
    value: 142,
    unit: 'systems',
    labels: {},
    threshold: { warning: 120, critical: 100 },
    source: 'systems_database',
    aggregationPeriod: 'hourly',
    isActive: true,
    metadata: {
      icon: 'check-circle',
      color: '#10b981',
      chartType: 'gauge',
      sampleData: { value: 142, max: 156, percentage: 91 }
    }
  },
  {
    name: 'System Uptime Trend',
    description: 'System uptime percentage over time',
    type: 'trend',
    category: 'systems',
    query: 'SELECT AVG(uptime_percentage) as value FROM system_metrics WHERE created_at >= NOW() - INTERVAL \'7 days\'',
    value: 99.2,
    unit: 'percentage',
    labels: {},
    threshold: { warning: 95, critical: 90 },
    source: 'monitoring_system',
    aggregationPeriod: 'hourly',
    isActive: true,
    metadata: {
      icon: 'trending-up',
      color: '#8b5cf6',
      chartType: 'line',
      sampleData: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        values: [98.5, 99.1, 99.3, 98.8, 99.5, 99.2, 99.4]
      }
    }
  },

  // Assets Metrics
  {
    name: 'Total Assets',
    description: 'Total number of assets under management',
    type: 'counter',
    category: 'assets',
    query: 'SELECT COUNT(*) as value FROM assets',
    value: 2847,
    unit: 'assets',
    labels: {},
    threshold: { warning: 3000, critical: 3500 },
    source: 'asset_database',
    aggregationPeriod: 'daily',
    isActive: true,
    metadata: {
      icon: 'package',
      color: '#f59e0b',
      chartType: 'number',
      sampleData: { value: 2847, trend: '+12.3%', trendDirection: 'up' }
    }
  },
  {
    name: 'Asset Coverage',
    description: 'Percentage of assets with active monitoring',
    type: 'percentage',
    category: 'assets',
    query: 'SELECT (COUNT(CASE WHEN agent_status = \'active\' THEN 1 END) * 100.0 / COUNT(*)) as value FROM assets',
    value: 87.5,
    unit: 'percentage',
    labels: {},
    threshold: { warning: 80, critical: 70 },
    source: 'asset_database',
    aggregationPeriod: 'hourly',
    isActive: true,
    metadata: {
      icon: 'shield-check',
      color: '#06b6d4',
      chartType: 'gauge',
      sampleData: { value: 87.5, max: 100 }
    }
  },
  {
    name: 'Assets by Type',
    description: 'Distribution of assets by type',
    type: 'ratio',
    category: 'assets',
    query: 'SELECT asset_type, COUNT(*) as count FROM assets GROUP BY asset_type',
    value: 0,
    unit: 'distribution',
    labels: {},
    threshold: {},
    source: 'asset_database',
    aggregationPeriod: 'daily',
    isActive: true,
    metadata: {
      icon: 'pie-chart',
      color: '#ec4899',
      chartType: 'pie',
      sampleData: {
        labels: ['Servers', 'Workstations', 'Network Devices', 'Mobile Devices'],
        values: [45, 35, 15, 5]
      }
    }
  },

  // Vulnerabilities Metrics
  {
    name: 'Critical Vulnerabilities',
    description: 'Number of critical severity vulnerabilities',
    type: 'counter',
    category: 'vulnerabilities',
    query: 'SELECT COUNT(*) as value FROM vulnerabilities WHERE severity = \'critical\' AND status = \'open\'',
    value: 23,
    unit: 'vulnerabilities',
    labels: {},
    threshold: { warning: 10, critical: 25 },
    source: 'vulnerability_scanner',
    aggregationPeriod: 'hourly',
    isActive: true,
    metadata: {
      icon: 'alert-triangle',
      color: '#ef4444',
      chartType: 'number',
      sampleData: { value: 23, trend: '-8.2%', trendDirection: 'down' }
    }
  },
  {
    name: 'Vulnerability Trends',
    description: 'New vs Fixed vulnerabilities over time',
    type: 'trend',
    category: 'vulnerabilities',
    query: 'SELECT DATE(created_at) as date, COUNT(*) as new_vulns FROM vulnerabilities WHERE created_at >= NOW() - INTERVAL \'30 days\' GROUP BY DATE(created_at)',
    value: 0,
    unit: 'vulnerabilities',
    labels: {},
    threshold: {},
    source: 'vulnerability_scanner',
    aggregationPeriod: 'daily',
    isActive: true,
    metadata: {
      icon: 'activity',
      color: '#f97316',
      chartType: 'line',
      sampleData: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
          { label: 'New', values: [45, 52, 38, 41] },
          { label: 'Fixed', values: [38, 48, 42, 39] }
        ]
      }
    }
  },
  {
    name: 'Severity Distribution',
    description: 'Distribution of vulnerabilities by severity',
    type: 'ratio',
    category: 'vulnerabilities',
    query: 'SELECT severity, COUNT(*) as count FROM vulnerabilities WHERE status = \'open\' GROUP BY severity',
    value: 0,
    unit: 'distribution',
    labels: {},
    threshold: {},
    source: 'vulnerability_scanner',
    aggregationPeriod: 'daily',
    isActive: true,
    metadata: {
      icon: 'bar-chart',
      color: '#dc2626',
      chartType: 'doughnut',
      sampleData: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        values: [23, 87, 156, 234],
        colors: ['#dc2626', '#f97316', '#f59e0b', '#10b981']
      }
    }
  },

  // Performance Metrics
  {
    name: 'System Performance Score',
    description: 'Overall system performance score',
    type: 'gauge',
    category: 'performance',
    query: 'SELECT AVG(performance_score) as value FROM system_metrics WHERE created_at >= NOW() - INTERVAL \'1 hour\'',
    value: 92.3,
    unit: 'score',
    labels: {},
    threshold: { warning: 80, critical: 70 },
    source: 'monitoring_system',
    aggregationPeriod: 'hourly',
    isActive: true,
    metadata: {
      icon: 'speedometer',
      color: '#8b5cf6',
      chartType: 'gauge',
      sampleData: { value: 92.3, max: 100 }
    }
  },
  {
    name: 'Response Time',
    description: 'Average system response time',
    type: 'gauge',
    category: 'performance',
    query: 'SELECT AVG(response_time_ms) as value FROM system_metrics WHERE created_at >= NOW() - INTERVAL \'1 hour\'',
    value: 245,
    unit: 'milliseconds',
    labels: {},
    threshold: { warning: 500, critical: 1000 },
    source: 'monitoring_system',
    aggregationPeriod: 'hourly',
    isActive: true,
    metadata: {
      icon: 'clock',
      color: '#06b6d4',
      chartType: 'line',
      sampleData: {
        labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
        values: [220, 235, 280, 245, 210, 225]
      }
    }
  },

  // Security Metrics
  {
    name: 'Security Score',
    description: 'Overall security posture score',
    type: 'gauge',
    category: 'security',
    query: 'SELECT AVG(security_score) as value FROM security_assessments WHERE created_at >= NOW() - INTERVAL \'1 day\'',
    value: 85.7,
    unit: 'score',
    labels: {},
    threshold: { warning: 70, critical: 60 },
    source: 'security_scanner',
    aggregationPeriod: 'daily',
    isActive: true,
    metadata: {
      icon: 'shield',
      color: '#10b981',
      chartType: 'gauge',
      sampleData: { value: 85.7, max: 100 }
    }
  },
  {
    name: 'Failed Login Attempts',
    description: 'Number of failed login attempts in the last 24 hours',
    type: 'counter',
    category: 'security',
    query: 'SELECT COUNT(*) as value FROM auth_logs WHERE success = false AND created_at >= NOW() - INTERVAL \'1 day\'',
    value: 47,
    unit: 'attempts',
    labels: {},
    threshold: { warning: 100, critical: 200 },
    source: 'auth_system',
    aggregationPeriod: 'hourly',
    isActive: true,
    metadata: {
      icon: 'user-x',
      color: '#ef4444',
      chartType: 'number',
      sampleData: { value: 47, trend: '+15.3%', trendDirection: 'up' }
    }
  },

  // Compliance Metrics
  {
    name: 'Compliance Score',
    description: 'Overall compliance score across all frameworks',
    type: 'percentage',
    category: 'compliance',
    query: 'SELECT AVG(compliance_percentage) as value FROM compliance_assessments WHERE created_at >= NOW() - INTERVAL \'1 week\'',
    value: 94.2,
    unit: 'percentage',
    labels: {},
    threshold: { warning: 90, critical: 80 },
    source: 'compliance_system',
    aggregationPeriod: 'weekly',
    isActive: true,
    metadata: {
      icon: 'check-square',
      color: '#10b981',
      chartType: 'gauge',
      sampleData: { value: 94.2, max: 100 }
    }
  }
];

async function populateMetrics() {
  try {
    console.log('🌱 Starting metrics population...');

    // Clear existing sample data (optional)
    // await db.delete(metrics).where(eq(metrics.source, 'sample_data'));

    // Insert sample metrics
    for (const metric of sampleMetrics) {
      try {
        const [inserted] = await db.insert(metrics)
          .values({
            ...metric,
            createdBy: 1, // Assuming admin user ID is 1
            createdAt: new Date(),
            updatedAt: new Date(),
            lastCalculated: new Date()
          })
          .returning();

        console.log(`✅ Inserted metric: ${inserted.name}`);
      } catch (error) {
        console.error(`❌ Error inserting metric ${metric.name}:`, error.message);
      }
    }

    console.log('🎉 Metrics population completed!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Error populating metrics:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateMetrics();
}

module.exports = { populateMetrics, sampleMetrics };
