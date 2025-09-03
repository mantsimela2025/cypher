/**
 * Live Asset Analytics Charts
 * Real-time charts for asset analytics dashboard
 */

import React from 'react';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';

// Chart Information Database - Comprehensive explanations for all charts
const CHART_INFO = {
  'Risk Distribution': {
    title: 'Risk Distribution Analysis',
    description: 'Visual breakdown of assets categorized by their exposure risk levels based on vulnerability assessments and threat intelligence.',
    dataSource: 'Real data from assets.exposureScore column in your database',
    calculation: [
      '• Critical Risk: Assets with exposure score ≥ 700',
      '• High Risk: Assets with exposure score 500-699',
      '• Medium Risk: Assets with exposure score 300-499',
      '• Low Risk: Assets with exposure score < 300',
      '• Exposure scores calculated by vulnerability scanners (Tenable, etc.)'
    ],
    interpretation: {
      'Critical': 'Immediate attention required - highest priority for remediation',
      'High': 'Schedule remediation within 30 days - significant security risk',
      'Medium': 'Address within 90 days - moderate security concern',
      'Low': 'Monitor regularly - minimal immediate risk'
    },
    businessValue: 'Helps prioritize security efforts and resource allocation based on actual risk levels',
    updateFrequency: 'Real-time data from your asset database'
  },
  'Asset Status': {
    title: 'Asset Status Overview',
    description: 'Current operational status of all assets based on last communication and monitoring agent presence.',
    dataSource: 'Real data from assets.lastSeen and assets.hasAgent columns',
    calculation: [
      '• Active: Assets seen within last 7 days with functioning agents',
      '• Inactive: Assets not seen for 7+ days or without agents',
      '• Unknown: Assets with insufficient monitoring data',
      '• Status determined by lastSeen timestamp analysis'
    ],
    interpretation: {
      'Active': 'Assets are online and properly monitored - good security posture',
      'Inactive': 'Assets may be offline or have monitoring gaps - investigate',
      'Unknown': 'Insufficient data - improve monitoring coverage'
    },
    businessValue: 'Ensures comprehensive asset visibility and identifies monitoring gaps',
    updateFrequency: 'Real-time based on agent check-ins and scan results'
  },
  'Asset Categories': {
    title: 'Asset Categorization',
    description: 'Classification of assets by data source and criticality rating to understand asset portfolio composition.',
    dataSource: 'Real data from assets.source and assets.criticalityRating columns',
    calculation: [
      '• Tenable Scanned: Assets discovered via Tenable vulnerability scanner',
      '• Criticality ratings: High/Medium/Low based on business impact',
      '• Source classification from discovery method',
      '• Categories help organize security management approach'
    ],
    interpretation: {
      'Tenable Scanned': 'Assets under active vulnerability management',
      'High Criticality': 'Business-critical assets requiring priority protection',
      'Medium/Low': 'Standard assets with appropriate security measures'
    },
    businessValue: 'Enables risk-based security management and compliance reporting',
    updateFrequency: 'Updated with each asset discovery and classification review'
  },
  'Top Risk Assets': {
    title: 'Highest Risk Assets',
    description: 'Top 10 assets with the highest exposure scores, representing your most critical security priorities.',
    dataSource: 'Real data from assets.exposureScore and assets.hostname columns',
    calculation: [
      '• Sorted by exposure score in descending order',
      '• Shows asset hostname and exact exposure score',
      '• Limited to top 10 for focused attention',
      '• Color-coded by risk level (red=critical, orange=high)'
    ],
    interpretation: {
      '800+': 'Critical - immediate remediation required',
      '500-799': 'High - schedule urgent attention',
      '300-499': 'Medium - address in planned maintenance',
      '<300': 'Low - monitor and maintain'
    },
    businessValue: 'Provides clear priorities for security team focus and resource allocation',
    updateFrequency: 'Real-time updates as vulnerability scans complete'
  },
  'Vulnerability Analytics': {
    title: 'Vulnerability Severity Distribution',
    description: 'Breakdown of vulnerabilities by severity level with CVSS scoring to understand threat landscape.',
    dataSource: 'Real data from vulnerabilities table (if populated)',
    calculation: [
      '• Groups vulnerabilities by severity_name (Critical, High, Medium, Low)',
      '• Counts total vulnerabilities per severity level',
      '• Calculates average CVSS scores for each category',
      '• CVSS scores range from 0-10 (10 being most severe)'
    ],
    interpretation: {
      'Critical': 'CVSS 9.0-10.0 - Exploit likely, immediate patching required',
      'High': 'CVSS 7.0-8.9 - Significant risk, patch within 30 days',
      'Medium': 'CVSS 4.0-6.9 - Moderate risk, patch within 90 days',
      'Low': 'CVSS 0.1-3.9 - Low risk, patch during maintenance windows'
    },
    businessValue: 'Prioritizes vulnerability remediation efforts based on actual threat severity',
    updateFrequency: 'Updated with each vulnerability scan cycle'
  },
  'Operating Systems': {
    title: 'Operating System Distribution',
    description: 'Portfolio view of operating systems across your asset inventory for patch management and security planning.',
    dataSource: 'Real data from asset_systems.operating_system column (if populated)',
    calculation: [
      '• Categorizes OS strings into major families (Windows, Linux, etc.)',
      '• Counts assets per operating system type',
      '• Groups similar OS versions for cleaner visualization',
      '• Helps identify OS diversity and standardization opportunities'
    ],
    interpretation: {
      'Windows': 'Microsoft Windows systems - focus on Windows Update management',
      'Linux': 'Linux distributions - manage package updates and kernel patches',
      'Other': 'Specialized systems - may require custom patch management'
    },
    businessValue: 'Enables OS-specific security strategies and patch management planning',
    updateFrequency: 'Updated when asset system information is refreshed'
  },
  'Asset Age Analysis': {
    title: 'Asset Age Distribution',
    description: 'Timeline analysis of when assets were first discovered, helping understand infrastructure lifecycle.',
    dataSource: 'Real data from assets.first_seen column',
    calculation: [
      '• New: Assets discovered within last 30 days',
      '• Recent: Assets discovered 30-90 days ago',
      '• Established: Assets discovered 3-12 months ago',
      '• Legacy: Assets discovered over 1 year ago',
      '• Calculates average age in days for each category'
    ],
    interpretation: {
      'New': 'Recently added assets - ensure proper security configuration',
      'Recent': 'Newer assets - verify security baseline compliance',
      'Established': 'Mature assets - maintain security posture',
      'Legacy': 'Older assets - may need security review and updates'
    },
    businessValue: 'Supports asset lifecycle management and security maintenance planning',
    updateFrequency: 'Calculated in real-time based on first_seen timestamps'
  }
};
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Reusable Chart Header Component with Info Icon
export const ChartHeader = ({ title, chartKey, onInfoClick, icon = "chart-bar-32" }) => (
  <div className="d-flex align-items-center justify-content-between">
    <div className="d-flex align-items-center">
      <i className={`ni ni-${icon} me-2`}></i>
      <span>{title}</span>
    </div>
    <button
      className="btn btn-sm p-1"
      onClick={(e) => {
        e.stopPropagation();
        onInfoClick(chartKey);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={{
        background: 'none',
        border: 'none',
        color: '#6c757d',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      title={`Learn more about ${title}`}
    >
      <i className="ni ni-info" style={{ fontSize: '14px' }}></i>
    </button>
  </div>
);

// Enhanced Chart Info Modal Component
export const ChartInfoModal = ({ chartKey, info, isVisible, onClose }) => {
  if (!isVisible || !info) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9998,
          backdropFilter: 'blur(8px)'
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="position-fixed"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: '600px',
          width: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        <div
          className="card border-0 shadow-lg"
          style={{
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)'
          }}
        >
          {/* Header */}
          <div
            className="card-header border-0 text-white position-relative"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '20px 20px 0 0',
              padding: '1.5rem'
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '50px',
                    height: '50px',
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <i className="ni ni-chart-bar-32" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h5 className="text-white mb-1 fw-bold">{info.title}</h5>
                  <small className="text-white-75">Chart Information & Methodology</small>
                </div>
              </div>
              <button
                className="btn btn-sm text-white p-2"
                onClick={onClose}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px'
                }}
              >
                <i className="ni ni-fat-remove"></i>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="card-body" style={{ padding: '2rem' }}>
            {/* Description */}
            <div className="mb-4">
              <p className="text-muted mb-0" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                {info.description}
              </p>
            </div>

            {/* Data Source */}
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-2 d-flex align-items-center">
                <i className="ni ni-database me-2"></i>
                Data Source
              </h6>
              <div
                className="p-3 rounded"
                style={{ background: 'rgba(0,123,255,0.1)', border: '1px solid rgba(0,123,255,0.2)' }}
              >
                <small className="text-primary fw-bold">{info.dataSource}</small>
              </div>
            </div>

            {/* Calculation Method */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                <i className="ni ni-settings-gear-65 me-2"></i>
                How it's calculated
              </h6>
              <ul className="list-unstyled mb-0">
                {info.calculation.map((item, index) => (
                  <li key={index} className="mb-2 d-flex align-items-start">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3 mt-1"
                      style={{
                        width: '6px',
                        height: '6px',
                        background: '#667eea',
                        minWidth: '6px'
                      }}
                    />
                    <span className="text-muted" style={{ fontSize: '14px' }}>
                      {item.replace('• ', '')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Interpretation Guide */}
            <div className="mb-4">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center">
                <i className="ni ni-bulb-61 me-2"></i>
                How to interpret the results
              </h6>
              <div className="row">
                {Object.entries(info.interpretation).map(([key, value], index) => (
                  <div key={index} className="col-12 mb-3">
                    <div
                      className="p-3 rounded border-start"
                      style={{
                        borderLeftWidth: '4px !important',
                        borderLeftColor:
                          key.toLowerCase().includes('critical') || key.toLowerCase().includes('high') ? '#dc3545' :
                          key.toLowerCase().includes('medium') || key.toLowerCase().includes('moderate') ? '#ffc107' :
                          key.toLowerCase().includes('low') || key.toLowerCase().includes('good') ? '#28a745' :
                          '#6c757d',
                        background: 'rgba(248,249,250,0.8)'
                      }}
                    >
                      <div className="d-flex align-items-start">
                        <span
                          className={`badge me-3 ${
                            key.toLowerCase().includes('critical') || key.toLowerCase().includes('high') ? 'bg-danger' :
                            key.toLowerCase().includes('medium') || key.toLowerCase().includes('moderate') ? 'bg-warning' :
                            key.toLowerCase().includes('low') || key.toLowerCase().includes('good') || key.toLowerCase().includes('active') ? 'bg-success' :
                            'bg-secondary'
                          }`}
                          style={{ fontSize: '11px', minWidth: '80px' }}
                        >
                          {key.toUpperCase()}
                        </span>
                        <small className="text-muted" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                          {value}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Value & Update Frequency */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold text-success mb-2 d-flex align-items-center">
                  <i className="ni ni-money-coins me-2"></i>
                  Business Value
                </h6>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                  {info.businessValue}
                </p>
              </div>
              <div className="col-md-6 mb-3">
                <h6 className="fw-bold text-info mb-2 d-flex align-items-center">
                  <i className="ni ni-watch-time me-2"></i>
                  Update Frequency
                </h6>
                <p className="text-muted mb-0" style={{ fontSize: '13px' }}>
                  {info.updateFrequency}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Risk Distribution Donut Chart
export const RiskDistributionChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No risk data available</div>;

  const chartData = {
    labels: data.map(item => item.riskLevel),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          '#dc3545', // Critical - Red
          '#fd7e14', // High - Orange  
          '#ffc107', // Medium - Yellow
          '#28a745', // Low - Green
          '#6c757d', // Minimal - Gray
        ],
        borderColor: [
          '#dc3545',
          '#fd7e14', 
          '#ffc107',
          '#28a745',
          '#6c757d',
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 8,
          usePointStyle: true,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} assets (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  return <Doughnut data={chartData} options={options} />;
};

// Asset Status Bar Chart
export const AssetStatusChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No status data available</div>;

  const chartData = {
    labels: data.map(item => item.status),
    datasets: [
      {
        label: 'Number of Assets',
        data: data.map(item => item.count),
        backgroundColor: [
          '#28a745', // Active - Green
          '#17a2b8', // Recently Active - Cyan
          '#ffc107', // Inactive - Yellow
          '#6c757d', // Unknown - Gray
        ],
        borderColor: [
          '#28a745',
          '#17a2b8',
          '#ffc107', 
          '#6c757d',
        ],
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.parsed.y} assets`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 10
          }
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

// Asset Categories Pie Chart
export const AssetCategoriesChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No category data available</div>;

  const chartData = {
    labels: data.map(item => item.category),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          '#007bff', // Primary Blue
          '#28a745', // Success Green
          '#ffc107', // Warning Yellow
          '#dc3545', // Danger Red
          '#6f42c1', // Purple
          '#fd7e14', // Orange
        ],
        borderColor: '#fff',
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 8,
          usePointStyle: true,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} assets (${percentage}%)`;
          }
        }
      }
    }
  };

  return <Pie data={chartData} options={options} />;
};

// Top Assets Horizontal Bar Chart
export const TopAssetsChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No top assets data available</div>;

  // Take top 10 and reverse for better display (highest at top)
  const topAssets = data.slice(0, 10).reverse();

  const chartData = {
    labels: topAssets.map(asset => asset.hostname || 'Unknown'),
    datasets: [
      {
        label: 'Exposure Score',
        data: topAssets.map(asset => asset.exposureScore),
        backgroundColor: topAssets.map(asset => {
          const score = asset.exposureScore;
          if (score >= 700) return '#dc3545'; // Critical - Red
          if (score >= 500) return '#fd7e14'; // High - Orange
          if (score >= 300) return '#ffc107'; // Medium - Yellow
          return '#28a745'; // Low - Green
        }),
        borderColor: topAssets.map(asset => {
          const score = asset.exposureScore;
          if (score >= 700) return '#dc3545';
          if (score >= 500) return '#fd7e14';
          if (score >= 300) return '#ffc107';
          return '#28a745';
        }),
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const asset = topAssets[context.dataIndex];
            return [
              `Hostname: ${asset.hostname || 'Unknown'}`,
              `Exposure Score: ${asset.exposureScore}`,
              `Criticality: ${asset.criticalityRating || 'Not Set'}`,
              `System: ${asset.systemId || 'Not Assigned'}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Exposure Score'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Assets'
        }
      }
    }
  };

  return <Bar data={chartData} options={options} height={120} />;
};

// NEW: Vulnerability Analytics Chart
export const VulnerabilityAnalyticsChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No vulnerability data available</div>;

  const chartData = {
    labels: data.map(item => item.severityName),
    datasets: [
      {
        label: 'Vulnerability Count',
        data: data.map(item => item.count),
        backgroundColor: [
          '#dc3545', // Critical - Red
          '#fd7e14', // High - Orange
          '#ffc107', // Medium - Yellow
          '#28a745', // Low - Green
        ],
        borderColor: [
          '#dc3545',
          '#fd7e14',
          '#ffc107',
          '#28a745',
        ],
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = data[context.dataIndex];
            return [
              `${context.label}: ${context.parsed.y} vulnerabilities`,
              `Avg CVSS: ${Math.round(item.avgCvssScore || 0)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

// NEW: Operating System Distribution Chart
export const OSDistributionChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No OS data available</div>;

  const chartData = {
    labels: data.map(item => item.operatingSystem),
    datasets: [
      {
        data: data.map(item => item.count),
        backgroundColor: [
          '#0078d4', // Windows - Blue
          '#ff6b35', // Linux - Orange
          '#e95420', // Ubuntu - Orange-Red
          '#262577', // CentOS - Dark Blue
          '#ee0000', // Red Hat - Red
          '#000000', // macOS - Black
          '#6c757d', // Other - Gray
        ],
        borderColor: '#fff',
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 8,
          usePointStyle: true,
          font: {
            size: 10
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} assets (${percentage}%)`;
          }
        }
      }
    }
  };

  return <Pie data={chartData} options={options} />;
};

// NEW: Asset Age Analysis Chart
export const AssetAgeChart = ({ data }) => {
  if (!data || data.length === 0) return <div>No asset age data available</div>;

  const chartData = {
    labels: data.map(item => item.ageCategory),
    datasets: [
      {
        label: 'Asset Count',
        data: data.map(item => item.count),
        backgroundColor: [
          '#28a745', // New - Green
          '#17a2b8', // Recent - Cyan
          '#ffc107', // Established - Yellow
          '#6c757d', // Legacy - Gray
        ],
        borderColor: [
          '#28a745',
          '#17a2b8',
          '#ffc107',
          '#6c757d',
        ],
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = data[context.dataIndex];
            return [
              `${context.label}: ${context.parsed.y} assets`,
              `Avg Age: ${Math.round(item.avgDaysSinceFirstSeen || 0)} days`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 9
          }
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

// Asset Overview Stats Cards (Styled like demo cards)
export const AssetOverviewStats = ({ basicStats, systemStats }) => {
  if (!basicStats) return <div>No basic stats available</div>;

  const stats = [
    {
      id: 'total-assets',
      title: 'Total Assets',
      subtitle: 'Live Data',
      value: basicStats.totalAssets,
      icon: 'package',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      tooltip: 'Total number of assets in portfolio'
    },
    {
      id: 'avg-risk-score',
      title: 'Avg Risk Score',
      subtitle: 'Exposure Score',
      value: Math.round(basicStats.avgExposureScore || 0),
      icon: 'shield-alert',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      tooltip: 'Average security exposure score across all assets'
    },
    {
      id: 'agent-coverage',
      title: 'Agent Coverage',
      subtitle: 'Monitoring',
      value: `${Math.round((basicStats.assetsWithAgent / basicStats.totalAssets) * 100)}%`,
      icon: 'activity',
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      tooltip: 'Percentage of assets with monitoring agents'
    },
    {
      id: 'plugin-coverage',
      title: 'Plugin Coverage',
      subtitle: 'Scanning',
      value: `${Math.round((basicStats.assetsWithPlugins / basicStats.totalAssets) * 100)}%`,
      icon: 'zap',
      bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      tooltip: 'Percentage of assets with plugin scan results'
    }
  ];

  // SVG Wave Component (same as demo)
  const WavePattern = () => (
    <svg
      className="position-absolute bottom-0 start-0 w-100"
      height="40"
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      style={{ opacity: 0.3 }}
    >
      <path
        d="M0,20 Q100,0 200,20 T400,20 L400,40 L0,40 Z"
        fill="rgba(255,255,255,0.2)"
      />
    </svg>
  );

  return (
    <div className="row g-3" style={{ paddingBottom: '10px' }}>
      {stats.map((item) => (
        <div className="col-xl-3 col-lg-6 col-sm-6" key={item.id}>
          <div
            className="card border-0 position-relative overflow-hidden"
            style={{
              background: item.bgColor,
              borderRadius: '12px',
              minHeight: '95px',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div className="card-inner text-white position-relative" style={{ zIndex: 2, padding: '1rem' }}>
              {/* Header with title and info icon */}
              <div className="d-flex justify-content-between align-items-start mb-1">
                <div>
                  <h6 className="text-white mb-1 fw-bold" style={{ fontSize: '13px' }}>
                    {item.title}
                  </h6>
                  <small className="text-white-50" style={{ fontSize: '11px' }}>
                    {item.subtitle}
                  </small>
                </div>
                <div
                  className="text-white-50"
                  style={{ fontSize: '14px', cursor: 'help' }}
                  title={item.tooltip}
                >
                  <i className="ni ni-help"></i>
                </div>
              </div>

              {/* Main number */}
              <div className="mt-2">
                <h2 className="text-white mb-0 fw-bold" style={{ fontSize: '1.8rem', lineHeight: '1' }}>
                  {item.value}
                </h2>
              </div>
            </div>

            {/* Wave pattern background */}
            <WavePattern />

            {/* Decorative border line */}
            <div
              className="position-absolute top-0 start-0"
              style={{
                width: '4px',
                height: '100%',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '2px 0 0 2px'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// NEW: Enhanced AI Metrics Dashboard Component
export const AIMetricsDashboard = ({ aiMetrics }) => {
  const [activeTooltip, setActiveTooltip] = React.useState(null);

  if (!aiMetrics || aiMetrics.error) {
    return (
      <div className="text-center py-5">
        <div className="mb-3">
          <i className="ni ni-bulb-61" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
        </div>
        <h6 className="text-muted">AI Insights Unavailable</h6>
        <small className="text-muted">
          {aiMetrics?.error || 'AI metrics are temporarily unavailable'}
        </small>
      </div>
    );
  }

  // Detailed metric information for tooltips
  const metricInfo = {
    'Risk Trend': {
      title: 'Risk Trend Analysis',
      description: 'AI-powered assessment of your organization\'s security risk trajectory over time.',
      calculation: [
        '• Analyzes critical asset ratio vs total assets',
        '• Evaluates average exposure scores across portfolio',
        '• Applies machine learning to predict risk direction',
        '• Factors in vulnerability patterns and asset criticality'
      ],
      interpretation: {
        'improving': 'Risk levels are decreasing - security posture is strengthening',
        'stable': 'Risk levels are consistent - maintain current security practices',
        'declining': 'Risk levels are increasing - immediate attention required'
      },
      confidence: 'Based on exposure score patterns and asset criticality analysis'
    },
    'Security Posture': {
      title: 'Security Posture Assessment',
      description: 'Comprehensive evaluation of your organization\'s overall security health and coverage.',
      calculation: [
        '• Agent coverage: (Assets with agents / Total assets) × 50%',
        '• Plugin coverage: (Assets with plugins / Total assets) × 50%',
        '• Combined score provides overall security monitoring effectiveness',
        '• Weighted algorithm considers monitoring completeness'
      ],
      interpretation: {
        'strong': 'Excellent security coverage (>75%) - well-protected environment',
        'moderate': 'Good security coverage (50-75%) - some gaps to address',
        'weak': 'Limited security coverage (<50%) - significant improvements needed'
      },
      confidence: 'Based on actual agent and plugin deployment statistics'
    },
    'Vuln Aging Risk': {
      title: 'Vulnerability Aging Risk Analysis',
      description: 'AI assessment of risk escalation based on vulnerability severity distribution and aging patterns.',
      calculation: [
        '• Identifies critical and high-severity vulnerabilities',
        '• Calculates high-risk ratio: (Critical + High) / Total vulnerabilities',
        '• Applies aging algorithms to assess time-based risk escalation',
        '• Machine learning predicts vulnerability impact trends'
      ],
      interpretation: {
        'high': 'High-risk vulnerabilities (>30%) - immediate remediation required',
        'moderate': 'Moderate risk levels (15-30%) - prioritize critical patches',
        'low': 'Low risk exposure (<15%) - maintain current patching schedule'
      },
      confidence: 'Based on vulnerability severity data and industry aging patterns'
    },
    'Operational Efficiency': {
      title: 'Operational Efficiency Score',
      description: 'Performance indicator measuring the effectiveness of your security monitoring and scanning operations.',
      calculation: [
        '• Monitoring efficiency: (Assets with agents / Total assets) × 50%',
        '• Scanning efficiency: (Assets with plugins / Total assets) × 50%',
        '• Combined score indicates operational coverage effectiveness',
        '• Benchmarked against industry best practices'
      ],
      interpretation: {
        'excellent': 'Outstanding efficiency (>80%) - optimal security operations',
        'good': 'Good efficiency (60-80%) - solid operational foundation',
        'fair': 'Fair efficiency (40-60%) - room for operational improvements',
        'poor': 'Poor efficiency (<40%) - significant operational gaps'
      },
      confidence: 'Based on actual deployment metrics and operational coverage analysis'
    }
  };

  const metrics = [
    {
      title: 'Risk Trend',
      value: aiMetrics.riskTrend?.score || 0,
      subtitle: aiMetrics.riskTrend?.direction || 'unknown',
      color: aiMetrics.riskTrend?.direction === 'improving' ? 'success' :
             aiMetrics.riskTrend?.direction === 'declining' ? 'danger' : 'warning',
      icon: 'trending-up',
      confidence: aiMetrics.riskTrend?.confidence || 0,
      bgGradient: aiMetrics.riskTrend?.direction === 'improving' ?
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' :
        aiMetrics.riskTrend?.direction === 'declining' ?
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      description: 'AI-calculated risk trajectory based on exposure patterns'
    },
    {
      title: 'Security Posture',
      value: aiMetrics.securityPosture?.score || 0,
      subtitle: aiMetrics.securityPosture?.trend || 'unknown',
      color: aiMetrics.securityPosture?.trend === 'strong' ? 'success' :
             aiMetrics.securityPosture?.trend === 'weak' ? 'danger' : 'warning',
      icon: 'shield',
      confidence: aiMetrics.securityPosture?.confidence || 0,
      bgGradient: aiMetrics.securityPosture?.trend === 'strong' ?
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' :
        aiMetrics.securityPosture?.trend === 'weak' ?
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' :
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      description: 'Overall security health assessment with coverage analysis'
    },
    {
      title: 'Vuln Aging Risk',
      value: aiMetrics.vulnerabilityAging?.riskRatio || 0,
      subtitle: aiMetrics.vulnerabilityAging?.risk || 'unknown',
      color: aiMetrics.vulnerabilityAging?.risk === 'high' ? 'danger' :
             aiMetrics.vulnerabilityAging?.risk === 'low' ? 'success' : 'warning',
      icon: 'clock',
      confidence: aiMetrics.vulnerabilityAging?.confidence || 0,
      bgGradient: aiMetrics.vulnerabilityAging?.risk === 'high' ?
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' :
        aiMetrics.vulnerabilityAging?.risk === 'low' ?
        'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' :
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      description: 'Time-based vulnerability risk escalation analysis'
    },
    {
      title: 'Operational Efficiency',
      value: aiMetrics.operationalEfficiency?.score || 0,
      subtitle: aiMetrics.operationalEfficiency?.rating || 'unknown',
      color: aiMetrics.operationalEfficiency?.rating === 'excellent' ? 'success' :
             aiMetrics.operationalEfficiency?.rating === 'poor' ? 'danger' : 'info',
      icon: 'zap',
      confidence: aiMetrics.operationalEfficiency?.confidence || 0,
      bgGradient: aiMetrics.operationalEfficiency?.rating === 'excellent' ?
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' :
        aiMetrics.operationalEfficiency?.rating === 'poor' ?
        'linear-gradient(135deg, #fc466b 0%, #3f5efb 100%)' :
        'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
      description: 'Performance indicators for monitoring and scanning efficiency'
    }
  ];

  // Tooltip Component
  const MetricTooltip = ({ metric, info, isVisible, onClose }) => {
    if (!isVisible) return null;

    return (
      <div
        className="position-fixed"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: '500px',
          width: '90vw'
        }}
      >
        <div
          className="card border-0 shadow-lg"
          style={{
            borderRadius: '15px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <div className="card-header border-0 pb-0" style={{ background: 'transparent' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold text-primary">
                <i className="ni ni-bulb-61 me-2"></i>
                {info.title}
              </h6>
              <button
                className="btn btn-sm btn-outline-secondary rounded-circle p-1"
                onClick={onClose}
                style={{ width: '30px', height: '30px' }}
              >
                <i className="ni ni-fat-remove" style={{ fontSize: '12px' }}></i>
              </button>
            </div>
          </div>
          <div className="card-body pt-2">
            <p className="text-muted mb-3" style={{ fontSize: '14px' }}>
              {info.description}
            </p>

            <div className="mb-3">
              <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                <i className="ni ni-settings-gear-65 me-1"></i>
                How it's calculated:
              </h6>
              <ul className="list-unstyled mb-0">
                {info.calculation.map((item, index) => (
                  <li key={index} className="text-muted mb-1" style={{ fontSize: '12px' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-3">
              <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '13px' }}>
                <i className="ni ni-chart-bar-32 me-1"></i>
                Interpretation:
              </h6>
              <div className="row">
                {Object.entries(info.interpretation).map(([key, value], index) => (
                  <div key={index} className="col-12 mb-2">
                    <div className="d-flex align-items-start">
                      <span
                        className={`badge me-2 ${
                          key === 'improving' || key === 'strong' || key === 'excellent' || key === 'low' ? 'bg-success' :
                          key === 'declining' || key === 'weak' || key === 'poor' || key === 'high' ? 'bg-danger' :
                          'bg-warning'
                        }`}
                        style={{ fontSize: '10px', minWidth: '70px' }}
                      >
                        {key.toUpperCase()}
                      </span>
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        {value}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-top pt-2">
              <small className="text-muted" style={{ fontSize: '11px' }}>
                <i className="ni ni-check-bold me-1"></i>
                <strong>Confidence:</strong> {info.confidence}
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Backdrop for tooltip
  const TooltipBackdrop = ({ isVisible, onClick }) => {
    if (!isVisible) return null;

    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 9998,
          backdropFilter: 'blur(5px)'
        }}
        onClick={onClick}
      />
    );
  };

  // Enhanced Wave Pattern Component
  const EnhancedWavePattern = () => (
    <svg
      className="position-absolute bottom-0 start-0 w-100"
      height="50"
      viewBox="0 0 400 50"
      preserveAspectRatio="none"
      style={{ opacity: 0.2 }}
    >
      <defs>
        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.4)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
        </linearGradient>
      </defs>
      <path
        d="M0,25 Q100,5 200,25 T400,25 L400,50 L0,50 Z"
        fill="url(#waveGradient)"
      />
      <path
        d="M0,35 Q150,15 300,35 T600,35 L600,50 L0,50 Z"
        fill="rgba(255,255,255,0.1)"
      />
    </svg>
  );

  return (
    <div className="ai-metrics-dashboard">
      {/* AI Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div
            className="card border-0 position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px',
              minHeight: '80px'
            }}
          >
            <div className="card-body text-white text-center position-relative" style={{ zIndex: 2 }}>
              <div className="d-flex align-items-center justify-content-center">
                <i className="ni ni-bulb-61 me-3" style={{ fontSize: '2.5rem' }}></i>
                <div>
                  <h5 className="text-white mb-1 fw-bold">AI-Powered Intelligence</h5>
                  <small className="text-white-50">
                    Machine learning insights • Generated: {new Date(aiMetrics.generatedAt).toLocaleString()}
                  </small>
                </div>
                <div className="ms-auto">
                  <div className="badge bg-white text-primary px-3 py-2">
                    <i className="ni ni-check-bold me-1"></i>
                    {Math.round((aiMetrics.confidence || 0) * 100)}% Confidence
                  </div>
                </div>
              </div>
            </div>
            <EnhancedWavePattern />
          </div>
        </div>
      </div>

      {/* Enhanced AI Metrics Cards */}
      <div className="row g-4">
        {metrics.map((metric, index) => (
          <div key={index} className="col-xl-3 col-lg-6 col-md-6">
            <div
              className="card border-0 position-relative overflow-hidden h-100"
              style={{
                background: metric.bgGradient,
                borderRadius: '15px',
                minHeight: '140px',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              }}
            >
              <div className="card-body text-white position-relative" style={{ zIndex: 2, padding: '1.5rem' }}>
                {/* Header with icon and confidence */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: '45px',
                        height: '45px',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)'
                      }}
                    >
                      <i className={`ni ni-${metric.icon}`} style={{ fontSize: '1.2rem' }}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center">
                        <h6 className="text-white mb-0 fw-bold me-2" style={{ fontSize: '14px' }}>
                          {metric.title}
                        </h6>
                        <button
                          className="btn btn-sm p-0 text-white-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTooltip(activeTooltip === metric.title ? null : metric.title);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          title="Click for detailed information"
                        >
                          <i className="ni ni-info"></i>
                        </button>
                      </div>
                      <small className="text-white-50" style={{ fontSize: '11px' }}>
                        {metric.description}
                      </small>
                    </div>
                  </div>
                  <div className="text-end">
                    <div
                      className="badge text-white px-2 py-1"
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        fontSize: '10px'
                      }}
                    >
                      {Math.round(metric.confidence * 100)}%
                    </div>
                  </div>
                </div>

                {/* Main metric value */}
                <div className="text-center mb-2">
                  <h2 className="text-white mb-0 fw-bold" style={{ fontSize: '2.2rem', lineHeight: '1' }}>
                    {metric.value}
                    {metric.title.includes('Efficiency') || metric.title.includes('Posture') ? '%' : ''}
                  </h2>
                  <div
                    className="badge mt-2 px-3 py-1"
                    style={{
                      background: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {metric.subtitle.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Enhanced wave pattern */}
              <EnhancedWavePattern />

              {/* Animated border accent */}
              <div
                className="position-absolute top-0 start-0"
                style={{
                  width: '4px',
                  height: '100%',
                  background: 'rgba(255,255,255,0.4)',
                  borderRadius: '2px 0 0 2px'
                }}
              />

              {/* Subtle glow effect */}
              <div
                className="position-absolute top-0 start-0 w-100 h-100"
                style={{
                  background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  borderRadius: '15px'
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced AI Insights Summary */}
      <div className="row mt-4">
        <div className="col-12">
          <div
            className="card border-0 position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '15px'
            }}
          >
            <div className="card-body text-white position-relative" style={{ zIndex: 2 }}>
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '50px',
                    height: '50px',
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <i className="ni ni-chart-bar-32" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h6 className="text-white mb-1 fw-bold">Advanced AI Analysis</h6>
                  <small className="text-white-50">
                    Deep insights and correlations from machine learning algorithms
                  </small>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div
                    className="p-3 rounded mb-3"
                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <i className="ni ni-vector me-2" style={{ fontSize: '1.2rem' }}></i>
                      <strong>Risk Correlation</strong>
                    </div>
                    <div className="text-white-75">
                      <div className="d-flex justify-content-between">
                        <span>Pattern:</span>
                        <span className="fw-bold">{aiMetrics.riskCorrelation?.pattern || 'Unknown'}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>High-Risk Assets:</span>
                        <span className="fw-bold">{aiMetrics.riskCorrelation?.highRiskAssets || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Correlation:</span>
                        <span className="fw-bold">{aiMetrics.riskCorrelation?.correlation || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className="p-3 rounded mb-3"
                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <i className="ni ni-settings-gear-65 me-2" style={{ fontSize: '1.2rem' }}></i>
                      <strong>Maintenance Priority</strong>
                    </div>
                    <div className="text-white-75">
                      <div className="d-flex justify-content-between">
                        <span>Priority Level:</span>
                        <span className="fw-bold text-uppercase">{aiMetrics.maintenancePriority?.priority || 'Unknown'}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Need Attention:</span>
                        <span className="fw-bold">{aiMetrics.maintenancePriority?.assetsNeedingAttention || 0} assets</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Priority Score:</span>
                        <span className="fw-bold">{aiMetrics.maintenancePriority?.score || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div
                    className="p-3 rounded mb-3"
                    style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <i className="ni ni-world-2 me-2" style={{ fontSize: '1.2rem' }}></i>
                      <strong>Network Exposure</strong>
                    </div>
                    <div className="text-white-75">
                      <div className="d-flex justify-content-between">
                        <span>Exposure Level:</span>
                        <span className="fw-bold text-uppercase">{aiMetrics.networkExposure?.level || 'Unknown'}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Risk Score:</span>
                        <span className="fw-bold">{aiMetrics.networkExposure?.score || 0}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>AI Confidence:</span>
                        <span className="fw-bold">{Math.round((aiMetrics.networkExposure?.confidence || 0) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <EnhancedWavePattern />
          </div>
        </div>
      </div>

      {/* Tooltip and Backdrop */}
      <TooltipBackdrop
        isVisible={activeTooltip !== null}
        onClick={() => setActiveTooltip(null)}
      />
      {activeTooltip && (
        <MetricTooltip
          metric={activeTooltip}
          info={metricInfo[activeTooltip]}
          isVisible={true}
          onClose={() => setActiveTooltip(null)}
        />
      )}
    </div>
  );
};
