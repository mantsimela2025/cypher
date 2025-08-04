import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  PreviewCard,
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BackTo,
  Row,
  Col,
} from "@/components/Component";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const SystemAnalytics = () => {
  const [loading, setLoading] = useState(false);

  // System performance metrics over time
  const systemPerformanceData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'CPU Utilization (%)',
        data: [65, 59, 80, 81, 56, 55, 40, 45, 60, 70, 75, 68],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Memory Utilization (%)',
        data: [28, 48, 40, 19, 86, 27, 90, 85, 75, 80, 82, 78],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      },
      {
        label: 'Disk Utilization (%)',
        data: [45, 50, 55, 60, 65, 70, 75, 80, 85, 88, 90, 92],
        borderColor: 'rgb(255, 205, 86)',
        backgroundColor: 'rgba(255, 205, 86, 0.2)',
        tension: 0.1
      }
    ]
  };

  // Operating System Distribution
  const osDistributionData = {
    labels: ['Windows Server', 'Ubuntu', 'CentOS', 'Red Hat', 'SUSE', 'Other'],
    datasets: [
      {
        data: [45, 25, 15, 8, 4, 3],
        backgroundColor: [
          '#0088FE',
          '#00C49F',
          '#FFBB28',
          '#FF8042',
          '#8884D8',
          '#82CA9D'
        ],
        borderWidth: 2
      }
    ]
  };

  // System Health Status
  const systemHealthData = {
    labels: ['Healthy', 'Warning', 'Critical', 'Unknown'],
    datasets: [
      {
        data: [78, 15, 5, 2],
        backgroundColor: [
          '#28a745',
          '#ffc107',
          '#dc3545',
          '#6c757d'
        ],
        borderWidth: 2
      }
    ]
  };

  // System Uptime Trends
  const uptimeTrendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Average Uptime (%)',
        data: [99.2, 98.8, 99.5, 97.3, 99.1, 99.7],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'System Performance Metrics'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Weekly Uptime Trends'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  // Key metrics
  const keyMetrics = {
    totalSystems: 127,
    healthySystems: 99,
    avgCpuUsage: 68,
    avgMemoryUsage: 72,
    avgDiskUsage: 78,
    avgUptime: 99.2
  };

  return (
    <>
      <Head title="System Analytics" />
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>System Analytics</BlockTitle>
            <BlockDes className="text-soft">
              Comprehensive analytics and performance insights for your system infrastructure
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        {/* Key Metrics Overview */}
        <Block>
          <Row className="g-gs">
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Total Systems</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{keyMetrics.totalSystems}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Healthy Systems</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-success">{keyMetrics.healthySystems}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg CPU Usage</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{keyMetrics.avgCpuUsage}%</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg Memory Usage</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{keyMetrics.avgMemoryUsage}%</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg Disk Usage</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount">{keyMetrics.avgDiskUsage}%</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="2">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Avg Uptime</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-success">{keyMetrics.avgUptime}%</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
          </Row>
        </Block>

        {/* Performance Trends */}
        <Block>
          <Row className="g-gs">
            <Col lg="8">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-3">
                    <div className="card-title">
                      <h6 className="title">System Performance Trends</h6>
                    </div>
                  </div>
                  <div className="nk-ck" style={{ height: '400px' }}>
                    <Line data={systemPerformanceData} options={lineChartOptions} />
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col lg="4">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-3">
                    <div className="card-title">
                      <h6 className="title">System Health Status</h6>
                    </div>
                  </div>
                  <div className="nk-ck" style={{ height: '300px' }}>
                    <Doughnut data={systemHealthData} options={doughnutOptions} />
                  </div>
                </div>
              </PreviewCard>
            </Col>
          </Row>
        </Block>

        {/* OS Distribution and Uptime Trends */}
        <Block>
          <Row className="g-gs">
            <Col lg="6">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-3">
                    <div className="card-title">
                      <h6 className="title">Operating System Distribution</h6>
                    </div>
                  </div>
                  <div className="nk-ck" style={{ height: '350px' }}>
                    <Doughnut data={osDistributionData} options={doughnutOptions} />
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col lg="6">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-3">
                    <div className="card-title">
                      <h6 className="title">System Uptime Trends</h6>
                    </div>
                  </div>
                  <div className="nk-ck" style={{ height: '350px' }}>
                    <Bar data={uptimeTrendData} options={barChartOptions} />
                  </div>
                </div>
              </PreviewCard>
            </Col>
          </Row>
        </Block>

        {/* System Performance Summary */}
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="card-title-group align-start mb-3">
                <div className="card-title">
                  <h6 className="title">Performance Summary</h6>
                </div>
              </div>
              <Row className="g-gs">
                <Col md="3">
                  <div className="nk-wg-stats">
                    <div className="nk-wg-stats-group">
                      <div className="nk-wg-stats-item">
                        <div className="title">Peak CPU Usage</div>
                        <div className="info">
                          <div className="count">92%</div>
                          <div className="change up text-danger">
                            <em className="icon ni ni-arrow-long-up"></em>12%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md="3">
                  <div className="nk-wg-stats">
                    <div className="nk-wg-stats-group">
                      <div className="nk-wg-stats-item">
                        <div className="title">Peak Memory Usage</div>
                        <div className="info">
                          <div className="count">87%</div>
                          <div className="change up text-warning">
                            <em className="icon ni ni-arrow-long-up"></em>8%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md="3">
                  <div className="nk-wg-stats">
                    <div className="nk-wg-stats-group">
                      <div className="nk-wg-stats-item">
                        <div className="title">Systems at Risk</div>
                        <div className="info">
                          <div className="count">7</div>
                          <div className="change down text-success">
                            <em className="icon ni ni-arrow-long-down"></em>3
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md="3">
                  <div className="nk-wg-stats">
                    <div className="nk-wg-stats-group">
                      <div className="nk-wg-stats-item">
                        <div className="title">Maintenance Due</div>
                        <div className="info">
                          <div className="count">12</div>
                          <div className="change up text-warning">
                            <em className="icon ni ni-arrow-long-up"></em>4
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </PreviewCard>
        </Block>
      </Content>
    </>
  );
};

export default SystemAnalytics;
