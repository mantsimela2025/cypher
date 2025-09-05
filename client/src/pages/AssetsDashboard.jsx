import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import { Card, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown, Progress } from "reactstrap";
import {
  Block,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  Button,
  Row,
  Col,
  BlockBetween,
  PreviewAltCard,
} from "@/components/Component";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Filler, Legend } from "chart.js";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Filler, Legend);

const AssetsDashboard = () => {
  const [sm, updateSm] = useState(false);
  const [assetsData, setAssetsData] = useState({
    totalAssets: 0,
    assetsWithAgent: 0,
    assetsWithoutAgent: 0,
    assetsWithResults: 0,
    assetCoverage: 0,
    agentDeployment: 0,
    assetsSeenLast7Days: 0,
    assetsSeenLast30Days: 0,
    staleAssets: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch assets metrics from API
  useEffect(() => {
    const fetchAssetsData = async () => {
      try {
        log.api('Fetching assets dashboard metrics');
        const data = await apiClient.get('/system-metrics/by-category');
        const assetsMetrics = data.data.assets || [];

        // Process metrics data
        const processedData = {
          totalAssets: assetsMetrics.find(m => m.name === 'total_assets')?.value || 0,
          assetsWithAgent: assetsMetrics.find(m => m.name === 'assets_with_agent')?.value || 0,
          assetsWithoutAgent: assetsMetrics.find(m => m.name === 'assets_without_agent')?.value || 0,
          assetsWithResults: assetsMetrics.find(m => m.name === 'assets_with_plugin_results')?.value || 0,
          assetCoverage: assetsMetrics.find(m => m.name === 'asset_coverage_percentage')?.value || 0,
          agentDeployment: assetsMetrics.find(m => m.name === 'agent_deployment_percentage')?.value || 0,
          assetsSeenLast7Days: assetsMetrics.find(m => m.name === 'assets_seen_last_7_days')?.value || 0,
          assetsSeenLast30Days: assetsMetrics.find(m => m.name === 'assets_seen_last_30_days')?.value || 0,
          staleAssets: assetsMetrics.find(m => m.name === 'assets_stale')?.value || 0
        };

        setAssetsData(processedData);
        log.info('Assets dashboard data loaded successfully');
      } catch (error) {
        log.error('Error fetching assets data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAssetsData();
  }, []);

  // Chart data configurations
  const assetCoverageChart = {
    labels: ["With Agent", "Without Agent"],
    datasets: [
      {
        backgroundColor: ["#28a745", "#dc3545"],
        data: [assetsData.assetsWithAgent, assetsData.assetsWithoutAgent],
        borderWidth: 0,
      },
    ],
  };

  const assetTrendChart = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Asset Coverage %",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        borderColor: "#007bff",
        borderWidth: 2,
        pointBackgroundColor: "#007bff",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        data: [65, 70, 75, 78, 80, assetsData.assetCoverage],
        fill: true,
      },
      {
        label: "Agent Deployment %",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        borderColor: "#28a745",
        borderWidth: 2,
        pointBackgroundColor: "#28a745",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        data: [55, 60, 65, 67, 68, assetsData.agentDeployment],
        fill: true,
      },
    ],
  };

  const assetFreshnessChart = {
    labels: ["Last 7 Days", "Last 30 Days", "Stale Assets"],
    datasets: [
      {
        backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
        data: [assetsData.assetsSeenLast7Days, assetsData.assetsSeenLast30Days - assetsData.assetsSeenLast7Days, assetsData.staleAssets],
        borderWidth: 0,
      },
    ],
  };

  return (
    <React.Fragment>
      <Head title="Assets Dashboard" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Assets Dashboard</BlockTitle>
              <BlockDes className="text-soft">
                <p>Asset inventory, coverage, and operational status monitoring</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className={`btn-icon btn-trigger toggle-expand me-n1 ${sm ? "active" : ""}`}
                  onClick={() => updateSm(!sm)}
                >
                  <Icon name="more-v" />
                </Button>
                <div className="toggle-expand-content" style={{ display: sm ? "block" : "none" }}>
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="primary" outline className="btn-dim btn-white">
                        <Icon name="download-cloud"></Icon>
                        <span>Export</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="primary" outline className="btn-dim btn-white">
                        <Icon name="reports"></Icon>
                        <span>Reports</span>
                      </Button>
                    </li>
                    <li className="nk-block-tools-opt">
                      <UncontrolledDropdown>
                        <DropdownToggle color="transparent" className="btn btn-primary btn-icon dropdown-toggle">
                          <Icon name="plus"></Icon>
                        </DropdownToggle>
                        <DropdownMenu end>
                          <ul className="link-list-opt no-bdr">
                            <li>
                              <DropdownItem tag="a" href="/assets" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="package"></Icon>
                                <span>Add Asset</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem tag="a" href="/assets/inventory" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="list"></Icon>
                                <span>Asset Inventory</span>
                              </DropdownItem>
                            </li>
                          </ul>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Summary Cards */}
        <Block>
          <Row className="g-gs">
            <Col xxl="3" sm="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Assets</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="package" className="text-primary"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : assetsData.totalAssets}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>8%
                        </span>
                        since last month
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xxl="3" sm="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Asset Coverage</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="shield-check" className="text-info"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : assetsData.assetCoverage}%</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>5%
                        </span>
                        with scan results
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xxl="3" sm="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Agent Deployment</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="cpu" className="text-success"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : assetsData.agentDeployment}%</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>12%
                        </span>
                        agents deployed
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xxl="3" sm="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Active Assets</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="activity" className="text-warning"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : assetsData.assetsSeenLast7Days}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>3%
                        </span>
                        seen last 7 days
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Progress Indicators */}
        <Block>
          <Row className="g-gs">
            <Col lg="4">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Asset Coverage Progress</h6>
                    </div>
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-text">
                      <div className="progress-label">Scan Coverage</div>
                      <div className="progress-amount">{assetsData.assetCoverage}%</div>
                    </div>
                    <Progress value={assetsData.assetCoverage} className="progress-md" color="info" />
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-text">
                      <div className="progress-label">Agent Deployment</div>
                      <div className="progress-amount">{assetsData.agentDeployment}%</div>
                    </div>
                    <Progress value={assetsData.agentDeployment} className="progress-md" color="success" />
                  </div>
                  <div className="progress-wrap">
                    <div className="progress-text">
                      <div className="progress-label">Asset Freshness</div>
                      <div className="progress-amount">{Math.round((assetsData.assetsSeenLast7Days / assetsData.totalAssets) * 100)}%</div>
                    </div>
                    <Progress value={Math.round((assetsData.assetsSeenLast7Days / assetsData.totalAssets) * 100)} className="progress-md" color="warning" />
                  </div>
                </div>
              </Card>
            </Col>
            <Col lg="8">
              <Card className="card-bordered h-100">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Asset Coverage & Agent Deployment Trends</h6>
                    </div>
                    <div className="card-tools">
                      <UncontrolledDropdown>
                        <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                          <Icon name="more-h"></Icon>
                        </DropdownToggle>
                        <DropdownMenu end>
                          <ul className="link-list-opt no-bdr">
                            <li><DropdownItem tag="a" href="#"><span>7 Days</span></DropdownItem></li>
                            <li><DropdownItem tag="a" href="#"><span>15 Days</span></DropdownItem></li>
                            <li><DropdownItem tag="a" href="#"><span>30 Days</span></DropdownItem></li>
                          </ul>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "300px" }}>
                      <Line
                        data={assetTrendChart}
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: true, position: "top" },
                            tooltip: {
                              enabled: true,
                              backgroundColor: "#eff6ff",
                              titleColor: "#6783b8",
                              bodyColor: "#9eaecf",
                            },
                          },
                          scales: {
                            y: {
                              display: true,
                              ticks: { beginAtZero: true, color: "#9eaecf" },
                            },
                            x: {
                              display: true,
                              ticks: { color: "#9eaecf" },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Charts Section */}
        <Block>
          <Row className="g-gs">
            <Col lg="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Agent Deployment Status</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "250px" }}>
                      <Doughnut
                        data={assetCoverageChart}
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "bottom" },
                            tooltip: {
                              enabled: true,
                              backgroundColor: "#eff6ff",
                              titleColor: "#6783b8",
                              bodyColor: "#9eaecf",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col lg="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Asset Freshness Distribution</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "250px" }}>
                      <Doughnut
                        data={assetFreshnessChart}
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: "bottom" },
                            tooltip: {
                              enabled: true,
                              backgroundColor: "#eff6ff",
                              titleColor: "#6783b8",
                              bodyColor: "#9eaecf",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Asset Health Table */}
        <Block>
          <Card className="card-bordered">
            <div className="card-inner">
              <div className="card-title-group">
                <div className="card-title">
                  <h6 className="title">Asset Health Metrics</h6>
                </div>
              </div>
              <div className="nk-tb-list nk-tb-ulist">
                <div className="nk-tb-item nk-tb-head">
                  <div className="nk-tb-col"><span className="sub-text">Metric</span></div>
                  <div className="nk-tb-col tb-col-mb"><span className="sub-text">Current</span></div>
                  <div className="nk-tb-col tb-col-md"><span className="sub-text">Target</span></div>
                  <div className="nk-tb-col tb-col-sm"><span className="sub-text">Status</span></div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">Asset Coverage</span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{assetsData.assetCoverage}%</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount">90%</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className={`tb-status ${assetsData.assetCoverage >= 90 ? 'text-success' : assetsData.assetCoverage >= 70 ? 'text-warning' : 'text-danger'}`}>
                      {assetsData.assetCoverage >= 90 ? 'Excellent' : assetsData.assetCoverage >= 70 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">Agent Deployment</span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{assetsData.agentDeployment}%</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount">95%</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className={`tb-status ${assetsData.agentDeployment >= 95 ? 'text-success' : assetsData.agentDeployment >= 80 ? 'text-warning' : 'text-danger'}`}>
                      {assetsData.agentDeployment >= 95 ? 'Excellent' : assetsData.agentDeployment >= 80 ? 'Good' : 'Needs Improvement'}
                    </span>
                  </div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">Asset Freshness</span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{Math.round((assetsData.assetsSeenLast7Days / assetsData.totalAssets) * 100)}%</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount">85%</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-status text-success">Excellent</span>
                  </div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">Stale Assets</span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{assetsData.staleAssets}</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount">0</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className={`tb-status ${assetsData.staleAssets === 0 ? 'text-success' : 'text-warning'}`}>
                      {assetsData.staleAssets === 0 ? 'Excellent' : 'Attention Needed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default AssetsDashboard;
