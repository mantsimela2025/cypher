import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Card,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  Badge,
  Button,
  Progress,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Row,
  Col,
  Alert,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input
} from "reactstrap";
import {
  Block,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  BlockBetween,
} from "@/components/Component";
import { Bar, Doughnut, Radar } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, RadialLinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import classnames from "classnames";

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, RadialLinearScale, PointElement, LineElement, Tooltip, Legend);

const AIRecommendations = () => {
  const [activeTab, setActiveTab] = useState("prioritization");
  const [recommendations, setRecommendations] = useState([]);
  const [riskAssessment, setRiskAssessment] = useState({});
  const [deploymentStrategy, setDeploymentStrategy] = useState({});
  const [complianceAnalysis, setComplianceAnalysis] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionPlanModal, setActionPlanModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);

  // Fetch AI recommendations
  useEffect(() => {
    const fetchAIData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Fetch prioritization recommendations
        const prioritizationResponse = await fetch('/api/v1/patch-ai/prioritization-recommendations', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch risk trends
        const riskResponse = await fetch('/api/v1/patch-ai/risk-trends', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Fetch AI insights
        const insightsResponse = await fetch('/api/v1/patch-ai/insights', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (prioritizationResponse.ok) {
          const data = await prioritizationResponse.json();
          setRecommendations(data.data || mockRecommendations);
        } else {
          setRecommendations(mockRecommendations);
        }

        // Set mock data for other sections
        setRiskAssessment(mockRiskAssessment);
        setDeploymentStrategy(mockDeploymentStrategy);
        setComplianceAnalysis(mockComplianceAnalysis);

      } catch (error) {
        console.error('Error fetching AI data:', error);
        setRecommendations(mockRecommendations);
        setRiskAssessment(mockRiskAssessment);
        setDeploymentStrategy(mockDeploymentStrategy);
        setComplianceAnalysis(mockComplianceAnalysis);
      } finally {
        setLoading(false);
      }
    };

    fetchAIData();
  }, []);

  // Mock data
  const mockRecommendations = [
    {
      id: "1",
      patchId: "MS-2024-001",
      title: "Windows Security Update for CVE-2024-1234",
      priority: 10,
      riskScore: 9.2,
      businessImpact: "critical",
      affectedAssets: 145,
      threatIntelligence: "Active exploitation detected",
      recommendedAction: "Deploy immediately within next maintenance window",
      confidence: 95,
      reasoning: "High CVSS score (9.8), active exploitation in the wild, affects critical business systems",
      estimatedEffort: "2-4 hours",
      dependencies: ["Requires system restart", "Test on UAT environment first"]
    },
    {
      id: "2",
      patchId: "ADOBE-2024-002",
      title: "Adobe Reader Security Update",
      priority: 8,
      riskScore: 7.5,
      businessImpact: "high",
      affectedAssets: 89,
      threatIntelligence: "Proof of concept available",
      recommendedAction: "Deploy within 48 hours",
      confidence: 87,
      reasoning: "Medium-high risk vulnerability, limited exposure through security controls",
      estimatedEffort: "1-2 hours",
      dependencies: ["User notification required", "No restart needed"]
    },
    {
      id: "3",
      patchId: "JAVA-2024-003",
      title: "Java Runtime Environment Update",
      priority: 6,
      riskScore: 5.8,
      businessImpact: "medium",
      affectedAssets: 234,
      threatIntelligence: "No known exploitation",
      recommendedAction: "Deploy during next scheduled maintenance",
      confidence: 78,
      reasoning: "Routine security update, low urgency based on threat landscape",
      estimatedEffort: "3-5 hours",
      dependencies: ["Application compatibility testing required", "Coordinate with development team"]
    },
    {
      id: "4",
      patchId: "CHROME-2024-004",
      title: "Google Chrome Security Update",
      priority: 7,
      riskScore: 6.9,
      businessImpact: "high",
      affectedAssets: 312,
      threatIntelligence: "Targeted attacks using similar vectors",
      recommendedAction: "Deploy within 72 hours",
      confidence: 91,
      reasoning: "Browser security vulnerability with high user exposure",
      estimatedEffort: "1 hour",
      dependencies: ["Auto-update enabled for most systems"]
    }
  ];

  const mockRiskAssessment = {
    overallRiskLevel: "Medium-High",
    criticalVulnerabilities: 12,
    highRiskAssets: 78,
    exposureScore: 7.3,
    threatLandscape: "Active",
    complianceGaps: 3,
    mitigationEffectiveness: 82
  };

  const mockDeploymentStrategy = {
    recommendedApproach: "Phased Rollout",
    optimalTimeWindow: "Friday 10:00 PM - Saturday 2:00 AM",
    estimatedDowntime: "15-30 minutes per batch",
    rolloutPhases: [
      { phase: "Pilot Group", assets: 25, duration: "1 hour", riskLevel: "Low" },
      { phase: "Development Servers", assets: 45, duration: "2 hours", riskLevel: "Low" },
      { phase: "Production Batch 1", assets: 120, duration: "3 hours", riskLevel: "Medium" },
      { phase: "Production Batch 2", assets: 180, duration: "4 hours", riskLevel: "Medium" }
    ]
  };

  const mockComplianceAnalysis = {
    frameworks: [
      { name: "SOC 2", compliance: 94, gaps: 2, status: "compliant" },
      { name: "ISO 27001", compliance: 91, gaps: 4, status: "compliant" },
      { name: "PCI DSS", compliance: 88, gaps: 6, status: "minor_gaps" },
      { name: "NIST", compliance: 96, gaps: 1, status: "compliant" },
      { name: "HIPAA", compliance: 85, gaps: 8, status: "major_gaps" }
    ]
  };

  const getPriorityColor = (priority) => {
    if (priority >= 9) return 'danger';
    if (priority >= 7) return 'warning';
    if (priority >= 5) return 'info';
    return 'success';
  };

  const getRiskColor = (score) => {
    if (score >= 8) return 'danger';
    if (score >= 6) return 'warning';
    if (score >= 4) return 'info';
    return 'success';
  };

  const getBusinessImpactColor = (impact) => {
    switch (impact) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  // Chart configurations
  const riskDistributionChart = {
    labels: ["Critical", "High", "Medium", "Low"],
    datasets: [
      {
        backgroundColor: ["#dc3545", "#fd7e14", "#ffc107", "#28a745"],
        data: [12, 28, 45, 67],
        borderWidth: 0,
      },
    ],
  };

  const threatLandscapeChart = {
    labels: ["Malware", "Phishing", "Zero-day", "Insider Threat", "DDoS", "Data Breach"],
    datasets: [
      {
        label: "Threat Level",
        backgroundColor: "rgba(220, 53, 69, 0.2)",
        borderColor: "#dc3545",
        borderWidth: 2,
        data: [8, 6, 9, 4, 5, 7],
      },
    ],
  };

  const complianceChart = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Compliance Score",
        backgroundColor: "rgba(40, 167, 69, 0.8)",
        borderColor: "#28a745",
        data: [87, 89, 92, 88, 91, 94],
      },
    ],
  };

  const generateActionPlan = async (recommendation) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/patch-ai/action-plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patchIds: [recommendation.patchId]
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Handle action plan data
        console.log('Action plan generated:', data);
      }
    } catch (error) {
      console.error('Error generating action plan:', error);
    }
  };

  return (
    <React.Fragment>
      <Head title="Patch Management - AI Recommendations" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>AI Recommendations</BlockTitle>
              <BlockDes className="text-soft">
                <p>AI-powered patch prioritization, risk assessment, and deployment recommendations</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <ul className="nk-block-tools g-3">
                  <li>
                    <Button color="primary" outline>
                      <Icon name="reload"></Icon>
                      <span>Refresh AI Analysis</span>
                    </Button>
                  </li>
                  <li>
                    <Button color="primary" outline>
                      <Icon name="download-cloud"></Icon>
                      <span>Export Report</span>
                    </Button>
                  </li>
                  <li className="nk-block-tools-opt">
                    <UncontrolledDropdown>
                      <DropdownToggle color="transparent" className="btn btn-primary btn-icon dropdown-toggle">
                        <Icon name="setting"></Icon>
                      </DropdownToggle>
                      <DropdownMenu end>
                        <ul className="link-list-opt no-bdr">
                          <li>
                            <DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}>
                              <Icon name="setting"></Icon>
                              <span>AI Settings</span>
                            </DropdownItem>
                          </li>
                          <li>
                            <DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}>
                              <Icon name="activity"></Icon>
                              <span>Model Metrics</span>
                            </DropdownItem>
                          </li>
                          <li>
                            <DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}>
                              <Icon name="help"></Icon>
                              <span>Feedback</span>
                            </DropdownItem>
                          </li>
                        </ul>
                      </DropdownMenu>
                    </UncontrolledDropdown>
                  </li>
                </ul>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* AI Health Status */}
        <Block>
          <Alert color="info" className="alert-icon">
            <Icon name="info-circle"></Icon>
            <strong>AI Analysis Status:</strong> Last updated 5 minutes ago. Model confidence: 94%. Next analysis scheduled in 15 minutes.
          </Alert>
        </Block>

        <Block>
          <Card className="card-bordered">
            <div className="card-inner">
              {/* Tab Navigation */}
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "prioritization" })}
                    onClick={() => setActiveTab("prioritization")}
                  >
                    <Icon name="list" /> <span>Patch Prioritization</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "risk" })}
                    onClick={() => setActiveTab("risk")}
                  >
                    <Icon name="shield-exclamation" /> <span>Risk Assessment</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "deployment" })}
                    onClick={() => setActiveTab("deployment")}
                  >
                    <Icon name="play-circle" /> <span>Deployment Strategy</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "compliance" })}
                    onClick={() => setActiveTab("compliance")}
                  >
                    <Icon name="clipboard-check" /> <span>Compliance</span>
                  </NavLink>
                </NavItem>
              </Nav>

              {/* Tab Content */}
              <TabContent activeTab={activeTab}>
                <TabPane tabId="prioritization">
                  <div className="mt-4">
                    <div className="nk-tb-list nk-tb-ulist">
                      <div className="nk-tb-item nk-tb-head">
                        <div className="nk-tb-col"><span className="sub-text">Patch Details</span></div>
                        <div className="nk-tb-col tb-col-sm"><span className="sub-text">Priority</span></div>
                        <div className="nk-tb-col tb-col-sm"><span className="sub-text">Risk Score</span></div>
                        <div className="nk-tb-col tb-col-md"><span className="sub-text">Business Impact</span></div>
                        <div className="nk-tb-col tb-col-lg"><span className="sub-text">AI Reasoning</span></div>
                        <div className="nk-tb-col tb-col-sm"><span className="sub-text">Actions</span></div>
                      </div>
                      {recommendations.map((rec) => (
                        <div key={rec.id} className="nk-tb-item">
                          <div className="nk-tb-col">
                            <div className="tb-lead">
                              <span className="title">{rec.title}</span>
                              <span className="sub-text">{rec.patchId}</span>
                            </div>
                          </div>
                          <div className="nk-tb-col tb-col-sm">
                            <div className="d-flex align-items-center">
                              <div className="me-2" style={{ width: '40px' }}>
                                <Progress
                                  value={rec.priority * 10}
                                  color={getPriorityColor(rec.priority)}
                                  size="sm"
                                />
                              </div>
                              <Badge color={getPriorityColor(rec.priority)} className="badge-dim">
                                P{rec.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="nk-tb-col tb-col-sm">
                            <span className={`text-${getRiskColor(rec.riskScore)} fw-bold`}>
                              {rec.riskScore}/10
                            </span>
                          </div>
                          <div className="nk-tb-col tb-col-md">
                            <Badge color={getBusinessImpactColor(rec.businessImpact)} className="badge-dim">
                              {rec.businessImpact}
                            </Badge>
                            <div className="small text-muted">{rec.affectedAssets} assets</div>
                          </div>
                          <div className="nk-tb-col tb-col-lg">
                            <div className="tb-lead">
                              <span className="title">{rec.recommendedAction}</span>
                              <span className="sub-text">{rec.reasoning}</span>
                              <div className="mt-1">
                                <span className="badge badge-dot bg-info me-2">
                                  Confidence: {rec.confidence}%
                                </span>
                                <span className="badge badge-dot bg-secondary">
                                  Effort: {rec.estimatedEffort}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="nk-tb-col tb-col-sm">
                            <UncontrolledDropdown>
                              <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                                <Icon name="more-h"></Icon>
                              </DropdownToggle>
                              <DropdownMenu end>
                                <ul className="link-list-opt no-bdr">
                                  <li>
                                    <DropdownItem
                                      tag="a"
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedRecommendation(rec);
                                        setActionPlanModal(true);
                                      }}
                                    >
                                      <Icon name="clipboard"></Icon>
                                      <span>Generate Action Plan</span>
                                    </DropdownItem>
                                  </li>
                                  <li>
                                    <DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}>
                                      <Icon name="eye"></Icon>
                                      <span>View Details</span>
                                    </DropdownItem>
                                  </li>
                                  <li>
                                    <DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}>
                                      <Icon name="play-circle"></Icon>
                                      <span>Deploy Now</span>
                                    </DropdownItem>
                                  </li>
                                </ul>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabPane>

                <TabPane tabId="risk">
                  <div className="mt-4">
                    <Row className="g-gs">
                      <Col lg="4">
                        <Card className="card-bordered h-100">
                          <div className="card-inner">
                            <div className="card-title-group">
                              <div className="card-title">
                                <h6 className="title">Risk Overview</h6>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-danger">
                                  <Icon name="shield-exclamation"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">Overall Risk Level</h6>
                                  <Badge color="warning" className="badge-dim">{riskAssessment.overallRiskLevel}</Badge>
                                </div>
                              </div>
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-danger">
                                  <Icon name="alert-circle"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">Critical Vulnerabilities</h6>
                                  <span className="amount text-danger">{riskAssessment.criticalVulnerabilities}</span>
                                </div>
                              </div>
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-warning">
                                  <Icon name="server"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">High Risk Assets</h6>
                                  <span className="amount text-warning">{riskAssessment.highRiskAssets}</span>
                                </div>
                              </div>
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-info">
                                  <Icon name="bar-chart"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">Exposure Score</h6>
                                  <div className="d-flex align-items-center">
                                    <span className="amount text-info me-2">{riskAssessment.exposureScore}/10</span>
                                    <Progress value={riskAssessment.exposureScore * 10} color="info" size="sm" style={{ width: '60px' }} />
                                  </div>
                                </div>
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
                                <h6 className="title">Risk Distribution</h6>
                              </div>
                            </div>
                            <div className="nk-ov-chart-wrap mt-3">
                              <div style={{ height: "200px" }}>
                                <Doughnut
                                  data={riskDistributionChart}
                                  options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { position: "bottom" },
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
                                <h6 className="title">Threat Landscape</h6>
                              </div>
                            </div>
                            <div className="nk-ov-chart-wrap mt-3">
                              <div style={{ height: "200px" }}>
                                <Radar
                                  data={threatLandscapeChart}
                                  options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { display: false },
                                    },
                                    scales: {
                                      r: {
                                        beginAtZero: true,
                                        max: 10,
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
                  </div>
                </TabPane>

                <TabPane tabId="deployment">
                  <div className="mt-4">
                    <Row className="g-gs">
                      <Col lg="8">
                        <Card className="card-bordered h-100">
                          <div className="card-inner">
                            <div className="card-title-group">
                              <div className="card-title">
                                <h6 className="title">Recommended Deployment Strategy</h6>
                              </div>
                              <div className="card-tools">
                                <Badge color="info" className="badge-dim">
                                  AI Optimized
                                </Badge>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="strategy-info mb-4">
                                <div className="row g-3">
                                  <div className="col-md-6">
                                    <div className="info-item">
                                      <span className="info-label">Approach:</span>
                                      <span className="info-value fw-bold">{deploymentStrategy.recommendedApproach}</span>
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="info-item">
                                      <span className="info-label">Optimal Window:</span>
                                      <span className="info-value">{deploymentStrategy.optimalTimeWindow}</span>
                                    </div>
                                  </div>
                                  <div className="col-md-6">
                                    <div className="info-item">
                                      <span className="info-label">Estimated Downtime:</span>
                                      <span className="info-value text-warning">{deploymentStrategy.estimatedDowntime}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="deployment-phases">
                                <h6 className="title mb-3">Rollout Phases</h6>
                                <div className="nk-tb-list nk-tb-ulist">
                                  <div className="nk-tb-item nk-tb-head">
                                    <div className="nk-tb-col"><span className="sub-text">Phase</span></div>
                                    <div className="nk-tb-col"><span className="sub-text">Assets</span></div>
                                    <div className="nk-tb-col"><span className="sub-text">Duration</span></div>
                                    <div className="nk-tb-col"><span className="sub-text">Risk Level</span></div>
                                    <div className="nk-tb-col"><span className="sub-text">Progress</span></div>
                                  </div>
                                  {deploymentStrategy.rolloutPhases?.map((phase, index) => (
                                    <div key={index} className="nk-tb-item">
                                      <div className="nk-tb-col">
                                        <span className="tb-lead">{phase.phase}</span>
                                      </div>
                                      <div className="nk-tb-col">
                                        <span className="tb-amount">{phase.assets}</span>
                                      </div>
                                      <div className="nk-tb-col">
                                        <span className="tb-sub">{phase.duration}</span>
                                      </div>
                                      <div className="nk-tb-col">
                                        <Badge color={phase.riskLevel === 'Low' ? 'success' : 'warning'} className="badge-dim">
                                          {phase.riskLevel}
                                        </Badge>
                                      </div>
                                      <div className="nk-tb-col">
                                        <Progress value={0} color="info" size="sm" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
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
                                <h6 className="title">Deployment Insights</h6>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-success">
                                  <Icon name="check-circle"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">Success Prediction</h6>
                                  <div className="d-flex align-items-center">
                                    <span className="amount text-success me-2">94%</span>
                                    <Progress value={94} color="success" size="sm" style={{ width: '60px' }} />
                                  </div>
                                </div>
                              </div>
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-info">
                                  <Icon name="clock"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">Total Deployment Time</h6>
                                  <span className="amount text-info">8-10 hours</span>
                                </div>
                              </div>
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-warning">
                                  <Icon name="alert-triangle"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">Risk Mitigation</h6>
                                  <span className="amount text-warning">87%</span>
                                </div>
                              </div>
                              <div className="mt-4">
                                <Button color="primary" size="sm" block>
                                  <Icon name="play-circle"></Icon>
                                  <span>Start Deployment</span>
                                </Button>
                                <Button color="secondary" size="sm" block className="mt-2">
                                  <Icon name="edit"></Icon>
                                  <span>Customize Strategy</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                </TabPane>

                <TabPane tabId="compliance">
                  <div className="mt-4">
                    <Row className="g-gs">
                      <Col lg="8">
                        <Card className="card-bordered h-100">
                          <div className="card-inner">
                            <div className="card-title-group">
                              <div className="card-title">
                                <h6 className="title">Compliance Framework Analysis</h6>
                              </div>
                            </div>
                            <div className="nk-tb-list nk-tb-ulist mt-3">
                              <div className="nk-tb-item nk-tb-head">
                                <div className="nk-tb-col"><span className="sub-text">Framework</span></div>
                                <div className="nk-tb-col"><span className="sub-text">Compliance Score</span></div>
                                <div className="nk-tb-col"><span className="sub-text">Gaps</span></div>
                                <div className="nk-tb-col"><span className="sub-text">Status</span></div>
                                <div className="nk-tb-col"><span className="sub-text">Progress</span></div>
                              </div>
                              {complianceAnalysis.frameworks?.map((framework, index) => (
                                <div key={index} className="nk-tb-item">
                                  <div className="nk-tb-col">
                                    <span className="tb-lead fw-bold">{framework.name}</span>
                                  </div>
                                  <div className="nk-tb-col">
                                    <span className="tb-amount">{framework.compliance}%</span>
                                  </div>
                                  <div className="nk-tb-col">
                                    <Badge color={framework.gaps > 5 ? 'danger' : framework.gaps > 2 ? 'warning' : 'success'} className="badge-dim">
                                      {framework.gaps} gaps
                                    </Badge>
                                  </div>
                                  <div className="nk-tb-col">
                                    <Badge
                                      color={
                                        framework.status === 'compliant' ? 'success' :
                                        framework.status === 'minor_gaps' ? 'warning' : 'danger'
                                      }
                                      className="badge-dim"
                                    >
                                      {framework.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div className="nk-tb-col">
                                    <Progress
                                      value={framework.compliance}
                                      color={
                                        framework.compliance >= 95 ? 'success' :
                                        framework.compliance >= 85 ? 'warning' : 'danger'
                                      }
                                      size="sm"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col lg="4">
                        <Card className="card-bordered h-100">
                          <div className="card-inner">
                            <div className="card-title-group">
                              <div className="card-title">
                                <h6 className="title">Compliance Trends</h6>
                              </div>
                            </div>
                            <div className="nk-ov-chart-wrap mt-3">
                              <div style={{ height: "200px" }}>
                                <Bar
                                  data={complianceChart}
                                  options={{
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: { display: false },
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        max: 100,
                                      },
                                    },
                                  }}
                                />
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="nk-feature-block">
                                <div className="nk-feature-icon text-success">
                                  <Icon name="trending-up"></Icon>
                                </div>
                                <div className="nk-feature-content">
                                  <h6 className="title">Overall Trend</h6>
                                  <span className="amount text-success">+7% this month</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                </TabPane>
              </TabContent>
            </div>
          </Card>
        </Block>

        {/* Action Plan Modal */}
        <Modal isOpen={actionPlanModal} toggle={() => setActionPlanModal(false)} size="lg">
          <ModalHeader toggle={() => setActionPlanModal(false)}>
            Generate AI Action Plan
            {selectedRecommendation && (
              <div className="modal-subtitle">
                {selectedRecommendation.title} ({selectedRecommendation.patchId})
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {selectedRecommendation && (
              <div>
                <div className="mb-4">
                  <h6>Recommended Actions</h6>
                  <Alert color="info">
                    <Icon name="info-circle"></Icon>
                    <strong>AI Recommendation:</strong> {selectedRecommendation.recommendedAction}
                  </Alert>
                </div>
                
                <div className="mb-4">
                  <h6>Dependencies & Prerequisites</h6>
                  <ul>
                    {selectedRecommendation.dependencies?.map((dep, index) => (
                      <li key={index}>{dep}</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <h6>Risk Assessment</h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Risk Score:</span>
                    <div className="d-flex align-items-center">
                      <span className={`text-${getRiskColor(selectedRecommendation.riskScore)} fw-bold me-2`}>
                        {selectedRecommendation.riskScore}/10
                      </span>
                      <Progress
                        value={selectedRecommendation.riskScore * 10}
                        color={getRiskColor(selectedRecommendation.riskScore)}
                        size="sm"
                        style={{ width: '100px' }}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span>AI Confidence:</span>
                    <div className="d-flex align-items-center">
                      <span className="text-success fw-bold me-2">{selectedRecommendation.confidence}%</span>
                      <Progress
                        value={selectedRecommendation.confidence}
                        color="success"
                        size="sm"
                        style={{ width: '100px' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6>Estimated Effort & Timeline</h6>
                  <p><strong>Effort:</strong> {selectedRecommendation.estimatedEffort}</p>
                  <p><strong>Affected Assets:</strong> {selectedRecommendation.affectedAssets}</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setActionPlanModal(false)}>Cancel</Button>
            <Button
              color="primary"
              onClick={() => {
                generateActionPlan(selectedRecommendation);
                setActionPlanModal(false);
              }}
            >
              Generate Full Plan
            </Button>
          </ModalFooter>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default AIRecommendations;