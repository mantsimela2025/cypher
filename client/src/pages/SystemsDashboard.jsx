import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import { Card, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown } from "reactstrap";
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

const SystemsDashboard = () => {
  const [sm, updateSm] = useState(false);
  const [systemsData, setSystemsData] = useState({
    totalSystems: 0,
    activeSystems: 0,
    inactiveSystems: 0,
    systemsByType: {},
    systemsByImpact: {},
    systemsWithAssets: 0,
    systemCoverage: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch systems metrics from API
  useEffect(() => {
    const fetchSystemsData = async () => {
      try {
        log.api('Fetching systems dashboard metrics');
        const data = await apiClient.get('/system-metrics/by-category');
        const systemsMetrics = data.data.systems || [];

        // Process metrics data
        const processedData = {
          totalSystems: systemsMetrics.find(m => m.name === 'total_systems')?.value || 0,
          activeSystems: systemsMetrics.find(m => m.name === 'systems_by_status_active')?.value || 0,
          inactiveSystems: systemsMetrics.find(m => m.name === 'systems_by_status_inactive')?.value || 0,
          systemsWithAssets: systemsMetrics.find(m => m.name === 'systems_with_assets')?.value || 0,
          systemCoverage: systemsMetrics.find(m => m.name === 'system_asset_coverage_percentage')?.value || 0
        };

        setSystemsData(processedData);
        log.info('Systems dashboard data loaded successfully');
      } catch (error) {
        log.error('Error fetching systems data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemsData();
  }, []);

  // Chart data configurations
  const systemsOverviewChart = {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        backgroundColor: ["#28a745", "#dc3545"],
        data: [systemsData.activeSystems, systemsData.inactiveSystems],
        borderWidth: 0,
      },
    ],
  };

  const systemsCoverageChart = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "System Coverage %",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        borderColor: "#28a745",
        borderWidth: 2,
        pointBackgroundColor: "#28a745",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        data: [85, 88, 92, 95, 97, systemsData.systemCoverage],
        fill: true,
      },
    ],
  };

  const systemsTypeChart = {
    labels: ["Information Systems", "General Support Systems"],
    datasets: [
      {
        backgroundColor: ["#007bff", "#6f42c1"],
        data: [Math.floor(systemsData.totalSystems * 0.7), Math.floor(systemsData.totalSystems * 0.3)],
        borderWidth: 0,
      },
    ],
  };

  return (
    <React.Fragment>
      <Head title="Systems Dashboard" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Systems Dashboard</BlockTitle>
              <BlockDes className="text-soft">
                <p>Comprehensive systems inventory and health monitoring</p>
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
                              <DropdownItem tag="a" href="/systems" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="server"></Icon>
                                <span>Add System</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem tag="a" href="/systems/discovery" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="eye"></Icon>
                                <span>System Discovery</span>
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
                      <h6 className="title">Total Systems</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="server" className="text-primary"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : systemsData.totalSystems}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>12%
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
                      <h6 className="title">Active Systems</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="check-circle" className="text-success"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : systemsData.activeSystems}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>8%
                        </span>
                        operational systems
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
                      <h6 className="title">System Coverage</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="shield-check" className="text-info"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : systemsData.systemCoverage}%</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>5%
                        </span>
                        with linked assets
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
                      <h6 className="title">Systems with Assets</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="package" className="text-warning"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : systemsData.systemsWithAssets}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>15%
                        </span>
                        asset integration
                      </span>
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
            <Col lg="8">
              <Card className="card-bordered h-100">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">System Coverage Trend</h6>
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
                        data={systemsCoverageChart}
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
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
            <Col lg="4">
              <Card className="card-bordered h-100">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">System Status</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "200px" }}>
                      <Doughnut
                        data={systemsOverviewChart}
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

        {/* System Types Chart */}
        <Block>
          <Row className="g-gs">
            <Col lg="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Systems by Type</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "250px" }}>
                      <Doughnut
                        data={systemsTypeChart}
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
                      <h6 className="title">System Health Metrics</h6>
                    </div>
                  </div>
                  <div className="nk-tb-list nk-tb-ulist">
                    <div className="nk-tb-item nk-tb-head">
                      <div className="nk-tb-col"><span className="sub-text">Metric</span></div>
                      <div className="nk-tb-col tb-col-mb"><span className="sub-text">Value</span></div>
                      <div className="nk-tb-col tb-col-sm"><span className="sub-text">Status</span></div>
                    </div>
                    <div className="nk-tb-item">
                      <div className="nk-tb-col">
                        <span className="tb-lead">System Availability</span>
                      </div>
                      <div className="nk-tb-col tb-col-mb">
                        <span className="tb-amount">99.8%</span>
                      </div>
                      <div className="nk-tb-col tb-col-sm">
                        <span className="tb-status text-success">Excellent</span>
                      </div>
                    </div>
                    <div className="nk-tb-item">
                      <div className="nk-tb-col">
                        <span className="tb-lead">Asset Integration</span>
                      </div>
                      <div className="nk-tb-col tb-col-mb">
                        <span className="tb-amount">{systemsData.systemCoverage}%</span>
                      </div>
                      <div className="nk-tb-col tb-col-sm">
                        <span className="tb-status text-success">Good</span>
                      </div>
                    </div>
                    <div className="nk-tb-item">
                      <div className="nk-tb-col">
                        <span className="tb-lead">Compliance Rate</span>
                      </div>
                      <div className="nk-tb-col tb-col-mb">
                        <span className="tb-amount">95.2%</span>
                      </div>
                      <div className="nk-tb-col tb-col-sm">
                        <span className="tb-status text-warning">Good</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default SystemsDashboard;
