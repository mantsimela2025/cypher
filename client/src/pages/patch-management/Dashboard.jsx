import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import { Card, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown, Badge, Progress } from "reactstrap";
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
} from "@/components/Component";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Filler, Legend } from "chart.js";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Filler, Legend);

const PatchManagementDashboard = () => {
  const [sm, updateSm] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalPatches: 0,
    criticalPatches: 0,
    highPatches: 0,
    mediumPatches: 0,
    lowPatches: 0,
    availablePatches: 0,
    approvedPatches: 0,
    scheduledPatches: 0,
    deployedPatches: 0,
    failedPatches: 0,
    activeJobs: 0,
    pendingJobs: 0,
    completedJobs: 0,
    aiRecommendations: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch patches analytics
        const patchesResponse = await fetch('/api/v1/patches/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch job analytics
        const jobsResponse = await fetch('/api/v1/patch-jobs/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch AI insights
        const aiResponse = await fetch('/api/v1/patch-ai/insights', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (patchesResponse.ok && jobsResponse.ok) {
          const patchesData = await patchesResponse.json();
          const jobsData = await jobsResponse.json();
          let aiData = { data: { recommendations: [] } };
          
          if (aiResponse.ok) {
            aiData = await aiResponse.json();
          }
          
          // Process and combine data
          setDashboardData({
            totalPatches: patchesData.data?.totalPatches || 1247,
            criticalPatches: patchesData.data?.criticalPatches || 45,
            highPatches: patchesData.data?.highPatches || 123,
            mediumPatches: patchesData.data?.mediumPatches || 456,
            lowPatches: patchesData.data?.lowPatches || 623,
            availablePatches: patchesData.data?.availablePatches || 234,
            approvedPatches: patchesData.data?.approvedPatches || 89,
            scheduledPatches: patchesData.data?.scheduledPatches || 56,
            deployedPatches: patchesData.data?.deployedPatches || 868,
            failedPatches: patchesData.data?.failedPatches || 12,
            activeJobs: jobsData.data?.activeJobs || 8,
            pendingJobs: jobsData.data?.pendingJobs || 23,
            completedJobs: jobsData.data?.completedJobs || 145,
            aiRecommendations: aiData.data?.recommendations?.length || 17
          });

          // Mock recent activity data
          setRecentActivity([
            { id: 1, type: "deployment", patch: "MS Security Update KB5028166", status: "completed", time: "2 minutes ago", icon: "check-circle", color: "success" },
            { id: 2, type: "approval", patch: "Adobe Flash Player Update", status: "pending", time: "15 minutes ago", icon: "clock", color: "warning" },
            { id: 3, type: "failure", patch: "Java Runtime Environment 8u371", status: "failed", time: "1 hour ago", icon: "alert-circle", color: "danger" },
            { id: 4, type: "schedule", patch: "Windows 11 Cumulative Update", status: "scheduled", time: "2 hours ago", icon: "calendar", color: "info" }
          ]);

          // Mock upcoming jobs data
          setUpcomingJobs([
            { id: 1, name: "Critical Security Patches", scheduled: "Today 2:00 PM", patches: 12, assets: 45 },
            { id: 2, name: "Monthly Maintenance Window", scheduled: "Tomorrow 10:00 PM", patches: 67, assets: 123 },
            { id: 3, name: "Emergency Hotfix Deployment", scheduled: "Friday 6:00 PM", patches: 3, assets: 89 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data
        setDashboardData({
          totalPatches: 1247,
          criticalPatches: 45,
          highPatches: 123,
          mediumPatches: 456,
          lowPatches: 623,
          availablePatches: 234,
          approvedPatches: 89,
          scheduledPatches: 56,
          deployedPatches: 868,
          failedPatches: 12,
          activeJobs: 8,
          pendingJobs: 23,
          completedJobs: 145,
          aiRecommendations: 17
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Chart configurations
  const patchSeverityChart = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [
      {
        backgroundColor: ["#dc3545", "#fd7e14", "#ffc107", "#28a745"],
        data: [dashboardData.criticalPatches, dashboardData.highPatches, dashboardData.mediumPatches, dashboardData.lowPatches],
        borderWidth: 0,
      },
    ],
  };

  const patchStatusChart = {
    labels: ["Available", "Approved", "Scheduled", "Deployed", "Failed"],
    datasets: [
      {
        backgroundColor: ["#6c757d", "#17a2b8", "#007bff", "#28a745", "#dc3545"],
        data: [dashboardData.availablePatches, dashboardData.approvedPatches, dashboardData.scheduledPatches, dashboardData.deployedPatches, dashboardData.failedPatches],
        borderWidth: 0,
      },
    ],
  };

  const deploymentTrendChart = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Successful Deployments",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        borderColor: "#28a745",
        borderWidth: 2,
        pointBackgroundColor: "#28a745",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        data: [145, 167, 189, 203, 234, Math.floor(dashboardData.deployedPatches * 0.3)],
        fill: true,
      },
      {
        label: "Failed Deployments",
        backgroundColor: "rgba(220, 53, 69, 0.1)",
        borderColor: "#dc3545",
        borderWidth: 2,
        pointBackgroundColor: "#dc3545",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        data: [23, 18, 15, 12, 8, dashboardData.failedPatches],
        fill: true,
      },
    ],
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      case 'scheduled': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <React.Fragment>
      <Head title="Patch Management - Dashboard" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>Patch Management Dashboard</BlockTitle>
              <BlockDes className="text-soft">
                <p>Overview of patch management activities, metrics, and system status</p>
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
                        <span>Export Report</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="primary" outline className="btn-dim btn-white">
                        <Icon name="calendar"></Icon>
                        <span>Schedule Patches</span>
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
                              <DropdownItem tag="a" href="/patch-management/library" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="package"></Icon>
                                <span>Browse Patches</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem tag="a" href="/patch-management/jobs" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="play-circle"></Icon>
                                <span>Create Job</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem tag="a" href="/patch-management/ai-recommendations" onClick={(ev) => ev.preventDefault()}>
                                <Icon name="brain"></Icon>
                                <span>AI Recommendations</span>
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
        {dashboardData.criticalPatches > 0 && (
          <Block>
            <Card className="card-bordered bg-danger-dim">
              <div className="card-inner">
                <div className="alert-wrap">
                  <div className="alert-cta">
                    <Icon name="alert-circle" className="text-danger"></Icon>
                    <div className="alert-text">
                      <h6 className="alert-title">Critical Patches Available!</h6>
                      <p>You have <strong>{dashboardData.criticalPatches}</strong> critical patches waiting for deployment.</p>
                    </div>
                  </div>
                  <div className="alert-action">
                    <Button color="danger" size="sm" onClick={() => window.location.href = '/patch-management/library'}>
                      <span>Review Critical Patches</span>
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
                      <h6 className="title">Total Patches</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="package" className="text-primary"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : dashboardData.totalPatches.toLocaleString()}</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>12%
                        </span>
                        from last month
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
                      <h6 className="title">Critical Patches</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="alert-circle" className="text-danger"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-danger">{loading ? "..." : dashboardData.criticalPatches}</span>
                      <span className="sub-title">
                        <Badge color="danger" className="badge-dim">
                          Urgent Action Required
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
                      <h6 className="title">Active Jobs</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="play-circle" className="text-info"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : dashboardData.activeJobs}</span>
                      <span className="sub-title">
                        <span className="change text-info">
                          <Icon name="activity"></Icon>{dashboardData.pendingJobs} pending
                        </span>
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
                      <h6 className="title">Deployment Success</h6>
                    </div>
                    <div className="card-tools">
                      <Icon name="check-circle" className="text-success"></Icon>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{loading ? "..." : Math.round((dashboardData.deployedPatches / (dashboardData.deployedPatches + dashboardData.failedPatches)) * 100)}%</span>
                      <span className="sub-title">
                        <span className="change up text-success">
                          <Icon name="arrow-long-up"></Icon>5%
                        </span>
                        improvement
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
                      <h6 className="title">Deployment Trends</h6>
                    </div>
                    <div className="card-tools">
                      <UncontrolledDropdown>
                        <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                          <Icon name="more-h"></Icon>
                        </DropdownToggle>
                        <DropdownMenu end>
                          <ul className="link-list-opt no-bdr">
                            <li><DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}><span>7 Days</span></DropdownItem></li>
                            <li><DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}><span>30 Days</span></DropdownItem></li>
                            <li><DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}><span>3 Months</span></DropdownItem></li>
                          </ul>
                        </DropdownMenu>
                      </UncontrolledDropdown>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "300px" }}>
                      <Line
                        data={deploymentTrendChart}
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
                      <h6 className="title">Patches by Severity</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "200px" }}>
                      <Doughnut
                        data={patchSeverityChart}
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

        {/* Status Overview and Recent Activity */}
        <Block>
          <Row className="g-gs">
            <Col lg="6">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Patch Status Distribution</h6>
                    </div>
                  </div>
                  <div className="nk-ov-chart-wrap mt-3">
                    <div style={{ height: "250px" }}>
                      <Doughnut
                        data={patchStatusChart}
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
                      <h6 className="title">Recent Activity</h6>
                    </div>
                    <div className="card-tools">
                      <Button size="sm" color="primary" outline>
                        <span>View All</span>
                      </Button>
                    </div>
                  </div>
                  <div className="nk-activity mt-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="nk-activity-item">
                        <div className="nk-activity-media">
                          <Icon name={activity.icon} className={`text-${activity.color}`}></Icon>
                        </div>
                        <div className="nk-activity-content">
                          <div className="nk-activity-text">
                            <span className="title">{activity.patch}</span>
                            <Badge color={getStatusColor(activity.status)} className="badge-dim ms-2">
                              {activity.status}
                            </Badge>
                          </div>
                          <div className="nk-activity-time">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Upcoming Jobs and AI Recommendations */}
        <Block>
          <Row className="g-gs">
            <Col lg="8">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">Upcoming Patch Jobs</h6>
                    </div>
                    <div className="card-tools">
                      <Button size="sm" color="primary" outline>
                        <Icon name="calendar"></Icon>
                        <span>Schedule New</span>
                      </Button>
                    </div>
                  </div>
                  <div className="nk-tb-list nk-tb-ulist mt-3">
                    <div className="nk-tb-item nk-tb-head">
                      <div className="nk-tb-col"><span className="sub-text">Job Name</span></div>
                      <div className="nk-tb-col tb-col-md"><span className="sub-text">Scheduled</span></div>
                      <div className="nk-tb-col tb-col-sm"><span className="sub-text">Patches</span></div>
                      <div className="nk-tb-col tb-col-sm"><span className="sub-text">Assets</span></div>
                    </div>
                    {upcomingJobs.map((job) => (
                      <div key={job.id} className="nk-tb-item">
                        <div className="nk-tb-col">
                          <span className="tb-lead">{job.name}</span>
                        </div>
                        <div className="nk-tb-col tb-col-md">
                          <span className="tb-sub">{job.scheduled}</span>
                        </div>
                        <div className="nk-tb-col tb-col-sm">
                          <Badge color="info" className="badge-dim">{job.patches}</Badge>
                        </div>
                        <div className="nk-tb-col tb-col-sm">
                          <Badge color="secondary" className="badge-dim">{job.assets}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </Col>
            <Col lg="4">
              <Card className="card-bordered">
                <div className="card-inner">
                  <div className="card-title-group">
                    <div className="card-title">
                      <h6 className="title">AI Recommendations</h6>
                    </div>
                    <div className="card-tools">
                      <Button size="sm" color="primary" outline onClick={() => window.location.href = '/patch-management/ai-recommendations'}>
                        <Icon name="brain"></Icon>
                        <span>View All</span>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="nk-feature-block">
                      <div className="nk-feature-icon text-primary">
                        <Icon name="shield-check"></Icon>
                      </div>
                      <div className="nk-feature-content">
                        <h6 className="title">High Priority Patches</h6>
                        <p>AI identified {dashboardData.aiRecommendations} patches requiring immediate attention based on threat intelligence.</p>
                      </div>
                    </div>
                    <div className="nk-feature-block">
                      <div className="nk-feature-icon text-success">
                        <Icon name="calendar-check"></Icon>
                      </div>
                      <div className="nk-feature-content">
                        <h6 className="title">Optimal Deployment Window</h6>
                        <p>Best deployment window identified: Friday 10 PM - Saturday 2 AM for minimal business impact.</p>
                      </div>
                    </div>
                    <div className="nk-feature-block">
                      <div className="nk-feature-icon text-info">
                        <Icon name="target"></Icon>
                      </div>
                      <div className="nk-feature-content">
                        <h6 className="title">Risk Assessment</h6>
                        <p>Current patch deployment risk level: <Badge color="warning" className="badge-dim">Medium</Badge></p>
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

export default PatchManagementDashboard;