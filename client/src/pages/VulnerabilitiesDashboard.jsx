import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import { Card, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown, Badge } from "reactstrap";
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

const VulnerabilitiesDashboard = () => {
  const [sm, updateSm] = useState(false);
  const [vulnData, setVulnData] = useState({
    totalVulnerabilities: 0,
    criticalVulns: 0,
    highVulns: 0,
    mediumVulns: 0,
    lowVulns: 0,
    openVulns: 0,
    fixedVulns: 0,
    criticalOpen: 0,
    highOpen: 0,
    avgCvssScore: 0,
    avgCvssCritical: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch vulnerability metrics from API
  useEffect(() => {
    const fetchVulnData = async () => {
      try {
        log.api('Fetching vulnerabilities dashboard metrics');
        const data = await apiClient.get('/system-metrics/by-category');
        const vulnMetrics = data.data.vulnerabilities || [];

        // Process metrics data
        const processedData = {
          totalVulnerabilities: vulnMetrics.find(m => m.name === 'total_vulnerabilities_new')?.value || 0,
          criticalVulns: vulnMetrics.find(m => m.name === 'vulnerabilities_critical_new')?.value || 0,
          highVulns: vulnMetrics.find(m => m.name === 'vulnerabilities_high_new')?.value || 0,
          mediumVulns: vulnMetrics.find(m => m.name === 'vulnerabilities_medium_new')?.value || 0,
          lowVulns: vulnMetrics.find(m => m.name === 'vulnerabilities_low_new')?.value || 0,
          openVulns: vulnMetrics.find(m => m.name === 'vulnerabilities_open_new')?.value || 0,
          fixedVulns: vulnMetrics.find(m => m.name === 'vulnerabilities_fixed_new')?.value || 0,
          criticalOpen: vulnMetrics.find(m => m.name === 'critical_open_vulnerabilities_new')?.value || 0,
          highOpen: vulnMetrics.find(m => m.name === 'high_open_vulnerabilities_new')?.value || 0,
          avgCvssScore: vulnMetrics.find(m => m.name === 'avg_cvss_score')?.value || 0,
          avgCvssCritical: vulnMetrics.find(m => m.name === 'avg_cvss_critical')?.value || 0
        };

        setVulnData(processedData);
        log.info('Vulnerabilities dashboard data loaded successfully');
      } catch (error) {
        log.error('Error fetching vulnerability data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVulnData();
  }, []);

  // Chart data configurations
  const severityChart = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [
      {
        backgroundColor: ["#dc3545", "#fd7e14", "#ffc107", "#28a745"],
        data: [vulnData.criticalVulns, vulnData.highVulns, vulnData.mediumVulns, vulnData.lowVulns],
        borderWidth: 0,
      },
    ],
  };

  const statusChart = {
    labels: ["Open", "Fixed"],
    datasets: [
      {
        backgroundColor: ["#dc3545", "#28a745"],
        data: [vulnData.openVulns, vulnData.fixedVulns],
        borderWidth: 0,
      },
    ],
  };

  const vulnTrendChart = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "New Vulnerabilities",
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        borderColor: "#dc3545",
        borderWidth: 2,
        pointBackgroundColor: "#dc3545",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        data: [150, 180, 165, 200, 185, Math.floor(vulnData.totalVulnerabilities * 0.15)],
        fill: true,
      },
      {
        label: "Fixed Vulnerabilities",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        borderColor: "#28a745",
        borderWidth: 2,
        pointBackgroundColor: "#28a745",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        data: [120, 140, 155, 170, 180, Math.floor(vulnData.fixedVulns * 0.15)],
        fill: true,
      },
    ],
  };

  const criticalTrendChart = {
    labels: ["0-7 Days", "8-30 Days", "31-90 Days", ">90 Days"],
    datasets: [
      {
        backgroundColor: ["#28a745", "#ffc107", "#fd7e14", "#dc3545"],
        data: [
          Math.floor(vulnData.criticalVulns * 0.1),
          Math.floor(vulnData.criticalVulns * 0.25),
          Math.floor(vulnData.criticalVulns * 0.35),
          Math.floor(vulnData.criticalVulns * 0.3)
        ],
        borderWidth: 0,
      },
    ],
  };

  return (
    <React.Fragment>
      <Head title="Vulnerabilities Dashboard" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Vulnerabilities Dashboard</BlockTitle>
              <BlockDes className="text-soft">
                <p>Comprehensive vulnerability tracking, severity analysis, and remediation progress</p>
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
                              <DropdownItem tag="a" href="/vulnerabilities" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="shield-exclamation"></Icon>
                                <span>Scan Assets</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem tag="a" href="/vulnerabilities/data" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="list"></Icon>
                                <span>View All Vulnerabilities</span>
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

        {/* Critical Alert Banner */}
        {vulnData.criticalOpen > 0 && (
          <Block>
            <Card className="card-bordered bg-danger-dim">
              <div className="card-inner">
                <div className="alert-wrap">
                  <div className="alert-cta">
                    <Icon name="alert-circle" className="text-danger"></Icon>
                    <div className="alert-text">
                      <h6 className="alert-title">Critical Vulnerabilities Detected!</h6>
                      <p>You have <strong>{vulnData.criticalOpen}</strong> critical vulnerabilities that require immediate attention.</p>
                    </div>
                  </div>
                  <div className="alert-action">
                    <Button color="danger" size="sm">
                      <span>View Critical Issues</span>
                      <Icon name="arrow-right"></Icon>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Block>
        )}

        {/* Summary Cards */}
        <Block>
          <Row className="g-gs">
            <Col xxl="3" sm="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Vulnerabilities</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="shield-exclamation" className="text-primary"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : vulnData.totalVulnerabilities.toLocaleString()}</span>
                      <span className="sub-title">
                        <span className="change down text-danger">
                          <Icon name="arrow-long-down"></Icon>2%
                        </span>
                        since last scan
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
                      <h6 className="title">Critical Vulnerabilities</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="alert-circle" className="text-danger"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-danger">{loading ? "..." : vulnData.criticalVulns}</span>
                      <span className="sub-title">
                        <Badge color="danger" className="badge-dim">
                          {vulnData.criticalOpen} Open
                        </Badge>
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
                      <h6 className="title">Remediation Rate</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="check-circle" className="text-success"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : Math.round((vulnData.fixedVulns / vulnData.totalVulnerabilities) * 100)}%</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>8%
                        </span>
                        vulnerabilities fixed
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
                      <h6 className="title">Average CVSS Score</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="bar-chart" className="text-info"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : vulnData.avgCvssScore}</span>
                      <span className="sub-title">
                        <Badge color={vulnData.avgCvssScore >= 7 ? "danger" : vulnData.avgCvssScore >= 4 ? "warning" : "success"} className="badge-dim">
                          {vulnData.avgCvssScore >= 7 ? "High Risk" : vulnData.avgCvssScore >= 4 ? "Medium Risk" : "Low Risk"}
                        </Badge>
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
                      <h6 className="title">Vulnerability Trends</h6>
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
                        data={vulnTrendChart}
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
            <Col lg="4">
              <Card className="card-bordered h-100">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Vulnerability Status</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "200px" }}>
                      <Doughnut
                        data={statusChart}
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

        {/* Severity and Age Analysis */}
        <Block>
          <Row className="g-gs">
            <Col lg="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Vulnerabilities by Severity</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "250px" }}>
                      <Doughnut
                        data={severityChart}
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
                      <h6 className="title">Critical Vulnerabilities by Age</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "250px" }}>
                      <Bar
                        data={criticalTrendChart}
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
          </Row>
        </Block>

        {/* Vulnerability Metrics Table */}
        <Block>
          <Card className="card-bordered">
            <div className="card-inner">
              <div className="card-title-group">
                <div className="card-title">
                  <h6 className="title">Vulnerability Metrics Summary</h6>
                </div>
              </div>
              <div className="nk-tb-list nk-tb-ulist">
                <div className="nk-tb-item nk-tb-head">
                  <div className="nk-tb-col"><span className="sub-text">Severity</span></div>
                  <div className="nk-tb-col tb-col-mb"><span className="sub-text">Total</span></div>
                  <div className="nk-tb-col tb-col-md"><span className="sub-text">Open</span></div>
                  <div className="nk-tb-col tb-col-sm"><span className="sub-text">Fixed</span></div>
                  <div className="nk-tb-col tb-col-sm"><span className="sub-text">Fix Rate</span></div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">
                      <Badge color="danger" className="badge-dim me-2">Critical</Badge>
                    </span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{vulnData.criticalVulns}</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount text-danger">{vulnData.criticalOpen}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount text-success">{vulnData.criticalVulns - vulnData.criticalOpen}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount">{Math.round(((vulnData.criticalVulns - vulnData.criticalOpen) / vulnData.criticalVulns) * 100)}%</span>
                  </div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">
                      <Badge color="warning" className="badge-dim me-2">High</Badge>
                    </span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{vulnData.highVulns}</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount text-warning">{vulnData.highOpen}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount text-success">{vulnData.highVulns - vulnData.highOpen}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount">{Math.round(((vulnData.highVulns - vulnData.highOpen) / vulnData.highVulns) * 100)}%</span>
                  </div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">
                      <Badge color="info" className="badge-dim me-2">Medium</Badge>
                    </span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{vulnData.mediumVulns}</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount text-info">{Math.floor(vulnData.mediumVulns * 0.6)}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount text-success">{Math.floor(vulnData.mediumVulns * 0.4)}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount">40%</span>
                  </div>
                </div>
                <div className="nk-tb-item">
                  <div className="nk-tb-col">
                    <span className="tb-lead">
                      <Badge color="success" className="badge-dim me-2">Low</Badge>
                    </span>
                  </div>
                  <div className="nk-tb-col tb-col-mb">
                    <span className="tb-amount">{vulnData.lowVulns}</span>
                  </div>
                  <div className="nk-tb-col tb-col-md">
                    <span className="tb-amount text-success">{Math.floor(vulnData.lowVulns * 0.3)}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount text-success">{Math.floor(vulnData.lowVulns * 0.7)}</span>
                  </div>
                  <div className="nk-tb-col tb-col-sm">
                    <span className="tb-amount">70%</span>
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

export default VulnerabilitiesDashboard;
