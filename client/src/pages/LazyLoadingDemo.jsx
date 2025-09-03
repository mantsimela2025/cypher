import React, { useState } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Icon,
  Button,
  PreviewCard,
} from "@/components/Component";
import LazySection, { LazyCard, LazyTable, LazyStats } from "@/components/LazySection";
import { useLazyData, useLazyDataMap } from "@/hooks/useLazyData";
import { useNavigationLazyLoad } from "@/hooks/useNavigationLazyLoad";
import { systemsApi } from "@/utils/systemsApi";

/**
 * Demo page showing different lazy loading patterns
 * This demonstrates the efficient lazy loading approach
 */
const LazyLoadingDemo = () => {
  // Pattern 1: Manual lazy loading - load only when user clicks
  const manualData = useLazyData(
    async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: "This data was loaded manually when you clicked the button!" };
    },
    { cacheTime: 2 * 60 * 1000 } // 2 minutes cache
  );

  // Pattern 2: Navigation-aware lazy loading - loads when user navigates here
  const autoData = useNavigationLazyLoad(
    async () => {
      console.log('Auto-loading data on navigation...');
      const response = await systemsApi.getSystemsStats();
      return response.data || response || {};
    },
    {
      triggerPaths: ['/lazy-demo'], // Load when navigating to this page
      cacheTime: 5 * 60 * 1000,
      loadOnMount: true
    }
  );

  // Pattern 3: Multiple data sources with lazy loading
  const multiData = useLazyDataMap({
    users: async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        { id: 1, name: "John Doe", role: "Admin" },
        { id: 2, name: "Jane Smith", role: "User" }
      ];
    },
    settings: async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
      return { theme: "dark", notifications: true };
    },
    reports: async () => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return { totalReports: 42, pendingReports: 5 };
    }
  });

  // Simple table component for demo
  const SimpleTable = ({ data }) => (
    <div className="table-responsive">
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Simple stats component for demo
  const SimpleStats = ({ stats }) => (
    <div className="row g-3">
      <div className="col-md-4">
        <div className="card bg-primary text-white">
          <div className="card-body text-center">
            <h3>{stats.totalSystems || 0}</h3>
            <p>Total Systems</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card bg-success text-white">
          <div className="card-body text-center">
            <h3>{stats.activeSystems || 0}</h3>
            <p>Active Systems</p>
          </div>
        </div>
      </div>
      <div className="col-md-4">
        <div className="card bg-warning text-white">
          <div className="card-body text-center">
            <h3>{stats.criticalAlerts || 0}</h3>
            <p>Critical Alerts</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head title="Lazy Loading Demo" />
      <Content>
        <BlockHead size="sm">
          <div className="nk-block-between">
            <BlockHeadContent>
              <BlockTitle page tag="h3">
                Lazy Loading Patterns Demo
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Efficient data loading patterns for fast, responsive applications</p>
              </BlockDes>
            </BlockHeadContent>
          </div>
        </BlockHead>

        {/* Pattern 1: Manual Lazy Loading */}
        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">
                <Icon name="click" className="mr-2" />
                Pattern 1: Manual Lazy Loading
              </BlockTitle>
              <p>Data loads only when user explicitly requests it. Perfect for optional content.</p>
            </BlockHeadContent>
          </BlockHead>

          <PreviewCard>
            <LazySection
              title="Manual Data Loading"
              description="Click the button below to load data on demand"
              loadButtonText="Load Manual Data"
              data={manualData.data}
              loading={manualData.loading}
              error={manualData.error}
              hasLoaded={manualData.hasLoaded}
              onLoad={manualData.loadData}
              onRefresh={manualData.refresh}
              minHeight="200px"
            >
              {(data) => (
                <div className="alert alert-success">
                  <Icon name="check-circle" className="mr-2" />
                  {data.message}
                </div>
              )}
            </LazySection>
          </PreviewCard>
        </Block>

        {/* Pattern 2: Navigation-Aware Loading */}
        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">
                <Icon name="activity" className="mr-2" />
                Pattern 2: Navigation-Aware Loading
              </BlockTitle>
              <p>Data loads automatically when user navigates to this page. Cached for performance.</p>
            </BlockHeadContent>
          </BlockHead>

          <PreviewCard>
            <LazyStats
              title="Auto-Loaded Statistics"
              description="This data loaded automatically when you navigated here"
              data={autoData.data}
              loading={autoData.loading}
              error={autoData.error}
              hasLoaded={autoData.hasLoaded}
              onLoad={autoData.loadData}
              onRefresh={autoData.refresh}
              StatsComponent={SimpleStats}
              loadButtonText="Reload Stats"
              showRefreshButton={true}
            />
          </PreviewCard>
        </Block>

        {/* Pattern 3: Multiple Data Sources */}
        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">
                <Icon name="layers" className="mr-2" />
                Pattern 3: Multiple Data Sources
              </BlockTitle>
              <p>Load different data sources independently. Each can be loaded and cached separately.</p>
            </BlockHeadContent>
          </BlockHead>

          <div className="row g-4">
            {/* Users Data */}
            <div className="col-md-4">
              <LazyCard title="Users">
                <LazyTable
                  loadButtonText="Load Users"
                  data={multiData.dataMap.users}
                  loading={multiData.loadingMap.users}
                  error={multiData.errorMap.users}
                  hasLoaded={multiData.loadedMap.users}
                  onLoad={() => multiData.loadData('users')}
                  TableComponent={SimpleTable}
                  minHeight="200px"
                />
              </LazyCard>
            </div>

            {/* Settings Data */}
            <div className="col-md-4">
              <LazyCard title="Settings">
                <LazySection
                  loadButtonText="Load Settings"
                  data={multiData.dataMap.settings}
                  loading={multiData.loadingMap.settings}
                  error={multiData.errorMap.settings}
                  hasLoaded={multiData.loadedMap.settings}
                  onLoad={() => multiData.loadData('settings')}
                  minHeight="200px"
                >
                  {(data) => (
                    <div>
                      <p><strong>Theme:</strong> {data.theme}</p>
                      <p><strong>Notifications:</strong> {data.notifications ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  )}
                </LazySection>
              </LazyCard>
            </div>

            {/* Reports Data */}
            <div className="col-md-4">
              <LazyCard title="Reports">
                <LazySection
                  loadButtonText="Load Reports"
                  data={multiData.dataMap.reports}
                  loading={multiData.loadingMap.reports}
                  error={multiData.errorMap.reports}
                  hasLoaded={multiData.loadedMap.reports}
                  onLoad={() => multiData.loadData('reports')}
                  minHeight="200px"
                >
                  {(data) => (
                    <div>
                      <div className="d-flex justify-content-between">
                        <span>Total Reports:</span>
                        <strong>{data.totalReports}</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Pending:</span>
                        <strong className="text-warning">{data.pendingReports}</strong>
                      </div>
                    </div>
                  )}
                </LazySection>
              </LazyCard>
            </div>
          </div>
        </Block>

        {/* Performance Benefits */}
        <Block size="lg">
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">
                <Icon name="zap" className="mr-2" />
                Performance Benefits
              </BlockTitle>
            </BlockHeadContent>
          </BlockHead>

          <PreviewCard>
            <div className="row g-4">
              <div className="col-md-6">
                <h6><Icon name="clock" className="mr-2 text-success" />Faster Initial Load</h6>
                <p>Pages load instantly without waiting for all data to fetch.</p>
              </div>
              <div className="col-md-6">
                <h6><Icon name="database" className="mr-2 text-primary" />Reduced Server Load</h6>
                <p>Only fetch data that users actually need to see.</p>
              </div>
              <div className="col-md-6">
                <h6><Icon name="wifi" className="mr-2 text-info" />Better UX on Slow Networks</h6>
                <p>Users can interact with the page while data loads progressively.</p>
              </div>
              <div className="col-md-6">
                <h6><Icon name="refresh-cw" className="mr-2 text-warning" />Smart Caching</h6>
                <p>Data is cached to prevent unnecessary re-fetches.</p>
              </div>
            </div>
          </PreviewCard>
        </Block>
      </Content>
    </>
  );
};

export default LazyLoadingDemo;
