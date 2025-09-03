/**
 * Asset Analytics Charts View
 * Visual dashboard with charts for live asset data
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { assetAnalyticsApi } from '@/utils/assetAnalyticsApi';
import {
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Alert,
  Button,
  Spinner,
  Badge
} from 'reactstrap';
import { Icon } from '@/components/Component';
import {
  RiskDistributionChart,
  AssetStatusChart,
  AssetCategoriesChart,
  TopAssetsChart,
  AssetOverviewStats,
  VulnerabilityAnalyticsChart,
  OSDistributionChart,
  AssetAgeChart,
  AIMetricsDashboard,
  ChartHeader,
  ChartInfoModal
} from '@/components/partials/charts/assets/LiveAssetCharts';
import './AssetStatsCards.css';

// Chart Information Database
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
  },
  'Budget Planning 2026': {
    title: 'Budget Planning 2026 Analysis',
    description: 'Comprehensive financial planning for asset security investments, risk mitigation, and operational expenses for the 2026 fiscal year.',
    dataSource: 'Real data from asset risk assessments, operational costs, and security investment planning',
    calculation: [
      '• Total Budget: Combined CAPEX and OPEX allocations for comprehensive security coverage',
      '• CAPEX: Capital expenditures for security infrastructure, tools, and technology investments',
      '• OPEX: Operational expenses for ongoing security services, maintenance, and personnel costs',
      '• Risk-Adjusted: Budget adjusted based on current risk exposure levels and mitigation requirements',
      '• Calculations based on asset portfolio size, risk distribution, and security maturity requirements'
    ],
    interpretation: {
      'Total Budget': 'Complete financial allocation covering all security investments and operations',
      'CAPEX': 'One-time investments in security infrastructure, tools, and equipment upgrades',
      'OPEX': 'Recurring costs for security operations, maintenance, training, and service contracts',
      'Risk-Adjusted': 'Budget modified to prioritize high-risk assets and critical security gaps'
    },
    businessValue: 'Enables strategic financial planning for security investments with risk-based prioritization',
    updateFrequency: 'Updated quarterly based on risk assessments and business requirements'
  },
  'Total Budget': {
    title: 'Total Budget 2026',
    description: 'Complete security budget allocation combining capital expenditures and operational expenses for comprehensive asset protection.',
    dataSource: 'Calculated from CAPEX and OPEX planning plus risk-based adjustments',
    calculation: [
      '• Base calculation: CAPEX + OPEX = Total Security Investment',
      '• Risk factor applied based on current asset exposure scores',
      '• Portfolio size multiplier for economies of scale',
      '• Compliance and regulatory requirement additions',
      '• Emergency reserve allocation (typically 10-15% of base budget)'
    ],
    interpretation: {
      'High Budget': 'Significant security investment reflecting high-risk environment or growth',
      'Moderate Budget': 'Balanced investment for maintaining current security posture',
      'Conservative Budget': 'Minimal viable security investment with focus on critical assets'
    },
    businessValue: 'Provides complete view of security financial commitment for strategic planning',
    updateFrequency: 'Reviewed and updated quarterly during budget planning cycles'
  },
  'CAPEX': {
    title: 'Capital Expenditures (CAPEX) 2026',
    description: 'One-time capital investments in security infrastructure, tools, technology, and equipment for long-term asset protection.',
    dataSource: 'Infrastructure requirements analysis based on current gaps and future growth projections',
    calculation: [
      '• Security tool licenses and software investments',
      '• Hardware infrastructure (servers, network security devices, monitoring equipment)',
      '• Technology platform upgrades and implementations',
      '• Integration and deployment costs for new security solutions',
      '• Training and certification investments for security team capabilities'
    ],
    interpretation: {
      'High CAPEX': 'Major infrastructure investments or technology refresh cycle',
      'Moderate CAPEX': 'Incremental improvements and standard technology updates',
      'Low CAPEX': 'Maintenance mode with minimal new infrastructure investments'
    },
    businessValue: 'Builds long-term security capabilities and infrastructure foundation',
    updateFrequency: 'Annual planning with quarterly reviews for major acquisitions'
  },
  'OPEX': {
    title: 'Operational Expenditures (OPEX) 2026',
    description: 'Ongoing operational costs for security services, maintenance, personnel, and recurring expenses necessary for continuous asset protection.',
    dataSource: 'Current operational costs analysis with growth projections and service level requirements',
    calculation: [
      '• Security personnel salaries and benefits',
      '• Managed security services and outsourced operations',
      '• Software maintenance, support, and subscription renewals',
      '• Training, certifications, and professional development',
      '• Incident response and emergency response capabilities',
      '• Compliance auditing and regulatory requirements'
    ],
    interpretation: {
      'High OPEX': 'Extensive managed services or large internal security team',
      'Moderate OPEX': 'Balanced internal and external security operations model',
      'Low OPEX': 'Lean operations with focus on essential services only'
    },
    businessValue: 'Ensures continuous security operations and maintains protection levels',
    updateFrequency: 'Monthly tracking with quarterly planning adjustments'
  },
  'Risk-Adjusted': {
    title: 'Risk-Adjusted Budget 2026',
    description: 'Budget allocation modified based on current risk exposure levels, prioritizing investments for highest-risk assets and critical security gaps.',
    dataSource: 'Risk assessment data combined with asset exposure scores and threat intelligence',
    calculation: [
      '• Base budget adjusted by overall portfolio risk score',
      '• Critical risk assets receive priority funding allocation',
      '• High-exposure assets get enhanced security investment',
      '• Risk mitigation costs factored into operational expenses',
      '• Incident response and recovery capabilities scaled by risk level',
      '• Emergency response fund allocated based on threat landscape'
    ],
    interpretation: {
      'Higher Than Base': 'Significant risk exposure requiring additional security investment',
      'Equal to Base': 'Risk levels align with planned security investment levels',
      'Lower Than Base': 'Strong security posture allows for optimized budget allocation'
    },
    businessValue: 'Optimizes security spending based on actual risk exposure and business impact',
    updateFrequency: 'Updated monthly based on risk assessments and threat intelligence'
  }
};

const AssetAnalyticsChartsView = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeChartInfo, setActiveChartInfo] = useState(null);

  const { isAuthenticated } = useAuth();

  const handleChartInfoClick = (chartKey) => {
    setActiveChartInfo(activeChartInfo === chartKey ? null : chartKey);
  };

  // Load dashboard data
  const loadDashboardData = async (params = {}) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading asset analytics for charts...');
      
      // Load portfolio data
      const portfolioResponse = await assetAnalyticsApi.getPortfolioSummary();
      setPortfolioData(portfolioResponse.data);

      // Load dashboard data with charts
      try {
        const dashboardResponse = await assetAnalyticsApi.getDashboardData({
          timeRange: '1y',
          includeForecasts: true,
          includeLifecycle: true,
          ...params
        });
        setDashboardData(dashboardResponse.data);
        console.log('✅ Dashboard data loaded for charts');
      } catch (dashboardError) {
        console.warn('⚠️ Dashboard endpoint failed:', dashboardError.message);
        setDashboardData({ 
          message: 'Dashboard service temporarily unavailable',
          error: dashboardError.message,
          fallback: true 
        });
      }

      setHasLoaded(true);
    } catch (error) {
      console.error('❌ Failed to load analytics data:', error);
      
      if (!error.message.includes('Session expired')) {
        setError('Failed to load analytics data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await assetAnalyticsApi.refreshDashboard();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [isAuthenticated]);

  // Render loading state
  if (loading && !hasLoaded) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <Spinner size="lg" color="primary" />
          <div className="mt-3">
            <h6>Loading Asset Analytics Charts...</h6>
            <small className="text-muted">Preparing visualizations</small>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !hasLoaded) {
    return (
      <Alert color="danger" className="m-4">
        <div className="d-flex align-items-center">
          <Icon name="alert-circle" className="me-2"></Icon>
          <div>
            <strong>Error:</strong> {error}
            <div className="mt-2">
              <Button color="primary" size="sm" onClick={() => loadDashboardData()}>
                <Icon name="refresh-cw" className="me-1"></Icon>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    );
  }

  // Check if we have data for charts
  const hasChartData = dashboardData && !dashboardData.fallback;

  return (
    <div className="asset-analytics-charts">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Asset Analytics Dashboard</h4>
          <small className="text-muted">
            Visual insights and analytics for your asset portfolio
          </small>
        </div>
        <Button 
          color="primary" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Spinner size="sm" className="me-1" />
              Refreshing...
            </>
          ) : (
            <>
              <Icon name="refresh-cw" className="me-1"></Icon>
              Refresh
            </>
          )}
        </Button>
      </div>

      {!hasChartData ? (
        <Alert color="warning">
          <Icon name="alert-triangle" className="me-2"></Icon>
          <div>
            <strong>Charts Unavailable:</strong> Dashboard service is temporarily unavailable.
            <div className="mt-2">
              <small className="text-muted">
                The dashboard endpoint is experiencing issues. Please try refreshing or check back later.
              </small>
            </div>
          </div>
        </Alert>
      ) : (
        <>
          {/* Overview Stats Cards */}
          {dashboardData.basicStats && (
            <div className="mb-4">
              <AssetOverviewStats 
                basicStats={dashboardData.basicStats}
                systemStats={dashboardData.systemStats}
              />
            </div>
          )}

          {/* Charts Row 1 - Three Charts in One Row */}
          <Row className="mb-4">
            <Col lg="4">
              <Card className="h-100">
                <CardHeader className="pb-2">
                  <CardTitle className="mb-0" style={{ fontSize: '14px' }}>
                    <ChartHeader
                      title="Risk Distribution"
                      chartKey="Risk Distribution"
                      onInfoClick={handleChartInfoClick}
                      icon="shield-alert"
                    />
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  {dashboardData.riskDistribution ? (
                    <div style={{ height: '200px' }}>
                      <RiskDistributionChart data={dashboardData.riskDistribution} />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <small className="text-muted">No risk distribution data available</small>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col lg="4">
              <Card className="h-100">
                <CardHeader className="pb-2">
                  <CardTitle className="mb-0" style={{ fontSize: '14px' }}>
                    <ChartHeader
                      title="Asset Status"
                      chartKey="Asset Status"
                      onInfoClick={handleChartInfoClick}
                      icon="activity"
                    />
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  {dashboardData.assetStatus ? (
                    <div style={{ height: '200px' }}>
                      <AssetStatusChart data={dashboardData.assetStatus} />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <small className="text-muted">No asset status data available</small>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col lg="4">
              <Card className="h-100">
                <CardHeader className="pb-2">
                  <CardTitle className="mb-0">
                    <Icon name="layers" className="me-2" style={{ fontSize: '14px' }}></Icon>
                    <span style={{ fontSize: '14px' }}>Asset Categories</span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  {dashboardData.assetCategories ? (
                    <div style={{ height: '200px' }}>
                      <AssetCategoriesChart data={dashboardData.assetCategories} />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <small className="text-muted">No asset categories data available</small>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Row 2 - Enhanced Analytics (Moved Above Top Assets) */}
          <Row className="mb-4">
            <Col lg="4">
              <Card className="h-100">
                <CardHeader className="pb-2">
                  <CardTitle className="mb-0">
                    <Icon name="alert-triangle" className="me-2" style={{ fontSize: '14px' }}></Icon>
                    <span style={{ fontSize: '14px' }}>Vulnerability Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  {dashboardData.vulnerabilitySeverity ? (
                    <div style={{ height: '200px' }}>
                      <VulnerabilityAnalyticsChart data={dashboardData.vulnerabilitySeverity} />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <small className="text-muted">No vulnerability data available</small>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col lg="4">
              <Card className="h-100">
                <CardHeader className="pb-2">
                  <CardTitle className="mb-0">
                    <Icon name="monitor" className="me-2" style={{ fontSize: '14px' }}></Icon>
                    <span style={{ fontSize: '14px' }}>Operating Systems</span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  {dashboardData.osDistribution ? (
                    <div style={{ height: '200px' }}>
                      <OSDistributionChart data={dashboardData.osDistribution} />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <small className="text-muted">No OS data available</small>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
            <Col lg="4">
              <Card className="h-100">
                <CardHeader className="pb-2">
                  <CardTitle className="mb-0">
                    <Icon name="clock" className="me-2" style={{ fontSize: '14px' }}></Icon>
                    <span style={{ fontSize: '14px' }}>Asset Age Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardBody className="pt-2">
                  {dashboardData.assetAgeAnalysis ? (
                    <div style={{ height: '200px' }}>
                      <AssetAgeChart data={dashboardData.assetAgeAnalysis} />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <small className="text-muted">No asset age data available</small>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Charts Row 3 - Top Assets (Reduced Height, Moved Below Enhanced Analytics) */}
          <Row className="mb-4">
            <Col lg="12">
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Icon name="trending-up" className="me-2"></Icon>
                    Top Risk Assets
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  {dashboardData.topAssets ? (
                    <TopAssetsChart data={dashboardData.topAssets} />
                  ) : (
                    <div className="text-center py-4">
                      <small className="text-muted">No top assets data available</small>
                    </div>
                  )}
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* AI Metrics Section */}
          {dashboardData.aiMetrics && (
            <Row className="mb-4">
              <Col lg="12">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Icon name="cpu" className="me-2"></Icon>
                      AI-Generated Insights
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <AIMetricsDashboard aiMetrics={dashboardData.aiMetrics} />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          {/* Budget Planning Section */}
          {dashboardData.budgetPlan && (
            <Row>
              <Col lg="12">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <ChartHeader
                        title="Budget Planning 2026"
                        chartKey="Budget Planning 2026"
                        onInfoClick={handleChartInfoClick}
                        icon="dollar-sign"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col md="3" className="text-center">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                          <h4 className="text-primary mb-0">${dashboardData.budgetPlan.summary.totalBudget.toLocaleString()}</h4>
                          <button
                            className="btn btn-sm p-1 ms-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChartInfoClick('Total Budget');
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
                            title="Learn more about Total Budget calculation"
                          >
                            <i className="ni ni-info" style={{ fontSize: '12px' }}></i>
                          </button>
                        </div>
                        <small className="text-muted">Total Budget</small>
                      </Col>
                      <Col md="3" className="text-center">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                          <h4 className="text-success mb-0">${dashboardData.budgetPlan.summary.totalCapex.toLocaleString()}</h4>
                          <button
                            className="btn btn-sm p-1 ms-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChartInfoClick('CAPEX');
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
                            title="Learn more about CAPEX calculation"
                          >
                            <i className="ni ni-info" style={{ fontSize: '12px' }}></i>
                          </button>
                        </div>
                        <small className="text-muted">CAPEX</small>
                      </Col>
                      <Col md="3" className="text-center">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                          <h4 className="text-info mb-0">${dashboardData.budgetPlan.summary.totalOpex.toLocaleString()}</h4>
                          <button
                            className="btn btn-sm p-1 ms-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChartInfoClick('OPEX');
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
                            title="Learn more about OPEX calculation"
                          >
                            <i className="ni ni-info" style={{ fontSize: '12px' }}></i>
                          </button>
                        </div>
                        <small className="text-muted">OPEX</small>
                      </Col>
                      <Col md="3" className="text-center">
                        <div className="d-flex align-items-center justify-content-center mb-2">
                          <h4 className="text-warning mb-0">${dashboardData.budgetPlan.summary.riskAdjustedBudget.toLocaleString()}</h4>
                          <button
                            className="btn btn-sm p-1 ms-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChartInfoClick('Risk-Adjusted');
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
                            title="Learn more about Risk-Adjusted Budget calculation"
                          >
                            <i className="ni ni-info" style={{ fontSize: '12px' }}></i>
                          </button>
                        </div>
                        <small className="text-muted">Risk-Adjusted</small>
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </>
      )}

      {/* Status indicator */}
      {hasLoaded && (
        <div className="text-center mt-3">
          <small className="text-muted">
            <Icon name="check-circle" className="me-1 text-success"></Icon>
            Charts updated • Last refreshed: {new Date().toLocaleTimeString()}
          </small>
        </div>
      )}

      {/* Chart Information Modal */}
      <ChartInfoModal
        chartKey={activeChartInfo}
        info={activeChartInfo ? CHART_INFO[activeChartInfo] : null}
        isVisible={activeChartInfo !== null}
        onClose={() => setActiveChartInfo(null)}
      />
    </div>
  );
};

export default AssetAnalyticsChartsView;
