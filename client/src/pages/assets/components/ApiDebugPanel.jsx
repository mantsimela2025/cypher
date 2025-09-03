/**
 * API Debug Panel Component
 * Shows real-time API status and responses for troubleshooting
 */

import React, { useState } from 'react';
import { assetAnalyticsApi } from '@/utils/assetAnalyticsApi';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  Badge,
  Spinner
} from 'reactstrap';
import { Icon } from '@/components/Component';

const ApiDebugPanel = () => {
  const [tests, setTests] = useState({});
  const [testing, setTesting] = useState(false);

  const runApiTests = async () => {
    setTesting(true);
    const results = {};

    // Test Portfolio Summary
    try {
      console.log('🧪 Testing Portfolio Summary...');
      const portfolioResult = await assetAnalyticsApi.getPortfolioSummary();
      results.portfolio = {
        status: 'success',
        data: portfolioResult,
        timestamp: new Date().toLocaleTimeString()
      };
    } catch (error) {
      results.portfolio = {
        status: 'error',
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    // Test Dashboard
    try {
      console.log('🧪 Testing Dashboard...');
      const dashboardResult = await assetAnalyticsApi.getDashboardData();
      results.dashboard = {
        status: 'success',
        data: dashboardResult,
        timestamp: new Date().toLocaleTimeString()
      };
    } catch (error) {
      results.dashboard = {
        status: 'error',
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      };
    }

    setTests(results);
    setTesting(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return <Badge color="success">✅ Working</Badge>;
      case 'error':
        return <Badge color="danger">❌ Failed</Badge>;
      default:
        return <Badge color="secondary">⏳ Not Tested</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Icon name="activity" className="me-2"></Icon>
          API Debug Panel
        </CardTitle>
      </CardHeader>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0">Test Asset Analytics API endpoints to diagnose issues:</p>
          <Button 
            color="primary" 
            size="sm" 
            onClick={runApiTests}
            disabled={testing}
          >
            {testing ? (
              <>
                <Spinner size="sm" className="me-1" />
                Testing...
              </>
            ) : (
              <>
                <Icon name="play" className="me-1"></Icon>
                Run Tests
              </>
            )}
          </Button>
        </div>

        {/* Portfolio Summary Test */}
        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Portfolio Summary Endpoint</strong>
            {tests.portfolio && getStatusBadge(tests.portfolio.status)}
          </div>
          <small className="text-muted">GET /api/v1/asset-analytics/portfolio-summary</small>
          
          {tests.portfolio && (
            <div className="mt-2">
              <small className="text-muted">Last tested: {tests.portfolio.timestamp}</small>
              {tests.portfolio.status === 'success' ? (
                <Alert color="success" className="mt-2 mb-0">
                  <strong>Success!</strong> Received data:
                  <pre className="mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                    {JSON.stringify(tests.portfolio.data, null, 2)}
                  </pre>
                </Alert>
              ) : (
                <Alert color="danger" className="mt-2 mb-0">
                  <strong>Error:</strong> {tests.portfolio.error}
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Test */}
        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Dashboard Endpoint</strong>
            {tests.dashboard && getStatusBadge(tests.dashboard.status)}
          </div>
          <small className="text-muted">GET /api/v1/asset-analytics/dashboard</small>
          
          {tests.dashboard && (
            <div className="mt-2">
              <small className="text-muted">Last tested: {tests.dashboard.timestamp}</small>
              {tests.dashboard.status === 'success' ? (
                <Alert color="success" className="mt-2 mb-0">
                  <strong>Success!</strong> Received data:
                  <pre className="mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                    {JSON.stringify(tests.dashboard.data, null, 2)}
                  </pre>
                </Alert>
              ) : (
                <Alert color="danger" className="mt-2 mb-0">
                  <strong>Error:</strong> {tests.dashboard.error}
                  <div className="mt-2">
                    <small>
                      This is likely a backend service issue. Check the server logs for more details.
                    </small>
                  </div>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <Alert color="info">
          <Icon name="info" className="me-2"></Icon>
          <strong>Troubleshooting Tips:</strong>
          <ul className="mb-0 mt-2">
            <li>Check browser console for detailed error messages</li>
            <li>Check API server logs for backend errors</li>
            <li>Verify authentication tokens are valid</li>
            <li>Ensure asset analytics routes are enabled in the backend</li>
          </ul>
        </Alert>
      </CardBody>
    </Card>
  );
};

export default ApiDebugPanel;
