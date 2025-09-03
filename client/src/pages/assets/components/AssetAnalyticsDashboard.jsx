/**
 * Asset Analytics Dashboard Component
 * Following API Development Best Practices Guide patterns
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { assetAnalyticsApi } from '@/utils/assetAnalyticsApi';
import LazyDataLoader from '@/components/LazyDataLoader';
import ApiDebugPanel from './ApiDebugPanel';
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

const AssetAnalyticsDashboard = () => {
  // State management following best practices
  const [dashboardData, setDashboardData] = useState(null);
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { isAuthenticated } = useAuth();

  // Load dashboard data following best practices pattern
  const loadDashboardData = async (params = {}) => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📊 Loading asset analytics dashboard...');
      
      // Load portfolio data first (we know this works)
      // Dashboard endpoint is currently having issues, so we'll handle it separately
      const portfolioResponse = await assetAnalyticsApi.getPortfolioSummary();
      setPortfolioData(portfolioResponse.data);
      console.log('✅ Portfolio data loaded successfully');

      // Try dashboard data but don't fail if it doesn't work
      let dashboardResponse = null;
      try {
        dashboardResponse = await assetAnalyticsApi.getDashboardData({
          timeRange: '1y',
          includeForecasts: true,
          includeLifecycle: true,
          ...params
        });
        setDashboardData(dashboardResponse.data);
        console.log('✅ Dashboard data loaded successfully');
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
      
      // Don't show error for session timeouts (handled by timeout manager)
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
            <h6>Loading Asset Analytics...</h6>
            <small className="text-muted">Fetching dashboard and portfolio data</small>
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

  return (
    <div className="asset-analytics-dashboard">
      {/* Header with refresh button */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">Asset Analytics Dashboard</h4>
          <small className="text-muted">
            Real-time insights and analytics for your asset portfolio
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

      {/* Portfolio Summary Section */}
      <Row className="mb-4">
        <Col lg="12">
          <Card>
            <CardHeader>
              <CardTitle>
                <Icon name="pie-chart" className="me-2"></Icon>
                Portfolio Summary
              </CardTitle>
            </CardHeader>
            <CardBody>
              {portfolioData ? (
                portfolioData.fallback ? (
                  <Alert color="warning">
                    <Icon name="info" className="me-2"></Icon>
                    {portfolioData.message}
                  </Alert>
                ) : (
                  <div>
                    <p><strong>Generated:</strong> {new Date(portfolioData.generatedAt).toLocaleString()}</p>
                    <p><strong>Status:</strong> {portfolioData.message}</p>
                    {portfolioData.note && (
                      <Alert color="info">
                        <Icon name="info" className="me-2"></Icon>
                        {portfolioData.note}
                      </Alert>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <Spinner size="sm" />
                  <small className="d-block mt-2 text-muted">Loading portfolio data...</small>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Dashboard Data Section */}
      <Row>
        <Col lg="12">
          <Card>
            <CardHeader>
              <CardTitle>
                <Icon name="bar-chart-2" className="me-2"></Icon>
                Analytics Dashboard
              </CardTitle>
            </CardHeader>
            <CardBody>
              {dashboardData ? (
                dashboardData.fallback ? (
                  <Alert color="warning">
                    <Icon name="alert-triangle" className="me-2"></Icon>
                    <div>
                      <strong>Dashboard Service Issue:</strong> {dashboardData.message}
                      {dashboardData.error && (
                        <div className="mt-2">
                          <small className="text-muted">
                            <strong>Technical Details:</strong> {dashboardData.error}
                          </small>
                        </div>
                      )}
                      <div className="mt-2">
                        <small className="text-muted">
                          The dashboard endpoint is returning a 500 error. This is likely a backend service issue.
                        </small>
                      </div>
                      <div className="mt-2">
                        <Button size="sm" color="primary" onClick={() => loadDashboardData()}>
                          <Icon name="refresh-cw" className="me-1"></Icon>
                          Retry
                        </Button>
                      </div>
                    </div>
                  </Alert>
                ) : (
                  <div>
                    <div className="mb-3">
                      <p><strong>Time Range:</strong> {dashboardData.timeRange || '1 year'}</p>
                      <p><strong>Generated:</strong> {new Date(dashboardData.generatedAt).toLocaleString()}</p>
                      <p><strong>Status:</strong> <Badge color="success">{dashboardData.status}</Badge></p>
                    </div>

                    {dashboardData.budgetPlan && (
                      <Alert color="success">
                        <Icon name="dollar-sign" className="me-2"></Icon>
                        <div>
                          <strong>Budget Planning Available</strong>
                          <div className="mt-2">
                            <small>
                              <strong>Total Budget 2026:</strong> ${dashboardData.budgetPlan.summary.totalBudget.toLocaleString()}<br/>
                              <strong>Risk-Adjusted:</strong> ${dashboardData.budgetPlan.summary.riskAdjustedBudget.toLocaleString()}<br/>
                              <strong>CAPEX:</strong> ${dashboardData.budgetPlan.summary.totalCapex.toLocaleString()} |
                              <strong> OPEX:</strong> ${dashboardData.budgetPlan.summary.totalOpex.toLocaleString()}
                            </small>
                          </div>
                        </div>
                      </Alert>
                    )}

                    {dashboardData.budgetPlanError && (
                      <Alert color="warning">
                        <Icon name="alert-triangle" className="me-2"></Icon>
                        <small>{dashboardData.budgetPlanError}</small>
                      </Alert>
                    )}

                    {dashboardData.lifecyclePlan && (
                      <Alert color="info">
                        <Icon name="calendar" className="me-2"></Icon>
                        Lifecycle planning data available
                      </Alert>
                    )}

                    {dashboardData.lifecyclePlanError && (
                      <Alert color="warning">
                        <Icon name="alert-triangle" className="me-2"></Icon>
                        <small>{dashboardData.lifecyclePlanError}</small>
                      </Alert>
                    )}

                    {dashboardData.basicStats && (
                      <div className="mb-3">
                        <Alert color="info">
                          <Icon name="bar-chart" className="me-2"></Icon>
                          <div>
                            <strong>Asset Statistics</strong>
                            <div className="mt-2">
                              <small>
                                <strong>Total Assets:</strong> {dashboardData.basicStats.totalAssets}<br/>
                                <strong>Avg Exposure Score:</strong> {Math.round(dashboardData.basicStats.avgExposureScore || 0)}<br/>
                                <strong>With Agent:</strong> {dashboardData.basicStats.assetsWithAgent} |
                                <strong> With Plugins:</strong> {dashboardData.basicStats.assetsWithPlugins}
                              </small>
                            </div>
                          </div>
                        </Alert>

                        {/* Asset Status Distribution */}
                        {dashboardData.assetStatus && (
                          <Alert color="primary">
                            <Icon name="activity" className="me-2"></Icon>
                            <div>
                              <strong>Asset Status Distribution</strong>
                              <div className="mt-2">
                                <small>
                                  {dashboardData.assetStatus.map((status, index) => (
                                    <span key={index}>
                                      <strong>{status.status}:</strong> {status.count}
                                      {index < dashboardData.assetStatus.length - 1 ? ' | ' : ''}
                                    </span>
                                  ))}
                                </small>
                              </div>
                            </div>
                          </Alert>
                        )}

                        {/* Risk Distribution */}
                        {dashboardData.riskDistribution && (
                          <Alert color="warning">
                            <Icon name="shield-alert" className="me-2"></Icon>
                            <div>
                              <strong>Risk Distribution</strong>
                              <div className="mt-2">
                                <small>
                                  {dashboardData.riskDistribution.map((risk, index) => (
                                    <span key={index}>
                                      <strong>{risk.riskLevel}:</strong> {risk.count} (avg: {Math.round(risk.avgScore || 0)})
                                      {index < dashboardData.riskDistribution.length - 1 ? ' | ' : ''}
                                    </span>
                                  ))}
                                </small>
                              </div>
                            </div>
                          </Alert>
                        )}

                        {/* Top Assets */}
                        {dashboardData.topAssets && dashboardData.topAssets.length > 0 && (
                          <Alert color="danger">
                            <Icon name="trending-up" className="me-2"></Icon>
                            <div>
                              <strong>Top 5 Highest Risk Assets</strong>
                              <div className="mt-2">
                                <small>
                                  {dashboardData.topAssets.slice(0, 5).map((asset, index) => (
                                    <div key={index}>
                                      <strong>{index + 1}.</strong> {asset.hostname || 'Unknown'} -
                                      <Badge color="danger" className="ms-1">Score: {asset.exposureScore}</Badge>
                                    </div>
                                  ))}
                                </small>
                              </div>
                            </div>
                          </Alert>
                        )}

                        {/* Asset Categories */}
                        {dashboardData.assetCategories && (
                          <Alert color="success">
                            <Icon name="layers" className="me-2"></Icon>
                            <div>
                              <strong>Asset Categories</strong>
                              <div className="mt-2">
                                <small>
                                  {dashboardData.assetCategories.map((cat, index) => (
                                    <span key={index}>
                                      <strong>{cat.category}:</strong> {cat.count}
                                      {index < dashboardData.assetCategories.length - 1 ? ' | ' : ''}
                                    </span>
                                  ))}
                                </small>
                              </div>
                            </div>
                          </Alert>
                        )}
                      </div>
                    )}

                    {dashboardData.basicStatsError && (
                      <Alert color="warning">
                        <Icon name="alert-triangle" className="me-2"></Icon>
                        <small>{dashboardData.basicStatsError}</small>
                      </Alert>
                    )}
                  </div>
                )
              ) : (
                <div className="text-center py-4">
                  <Spinner size="sm" />
                  <small className="d-block mt-2 text-muted">Loading dashboard data...</small>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Debug Panel for Troubleshooting */}
      <Row className="mt-4">
        <Col lg="12">
          <ApiDebugPanel />
        </Col>
      </Row>

      {/* Status indicator */}
      {hasLoaded && (
        <div className="text-center mt-3">
          <small className="text-muted">
            <Icon name="check-circle" className="me-1 text-success"></Icon>
            Data loaded successfully • Last updated: {new Date().toLocaleTimeString()}
          </small>
        </div>
      )}
    </div>
  );
};

export default AssetAnalyticsDashboard;
