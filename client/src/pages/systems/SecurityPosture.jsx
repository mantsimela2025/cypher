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
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  Button,
  Icon,
  UserAvatar,
} from "@/components/Component";
import {
  Card,
  CardBody,
  Progress,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane
} from "reactstrap";
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

const SecurityPosture = () => {
  const [loading, setLoading] = useState(false);
  const [systemDetailModal, setSystemDetailModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [activeSystemTab, setActiveSystemTab] = useState('overview');
  const [systems, setSystems] = useState([]);
  const [systemsLoading, setSystemsLoading] = useState(true);
  const [systemsError, setSystemsError] = useState(null);

  // Security posture metrics
  const securityMetrics = {
    overallScore: 78,
    criticalVulns: 12,
    highVulns: 45,
    mediumVulns: 128,
    lowVulns: 234,
    patchCompliance: 85,
    configCompliance: 72,
    accessControlScore: 88,
    encryptionScore: 92
  };

  // Security trends over time
  const securityTrendsData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Security Score',
        data: [65, 68, 72, 75, 76, 78],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      },
      {
        label: 'Patch Compliance',
        data: [70, 75, 78, 82, 84, 85],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1
      },
      {
        label: 'Config Compliance',
        data: [60, 65, 68, 70, 71, 72],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1
      }
    ]
  };

  // Vulnerability distribution
  const vulnerabilityDistData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [12, 45, 128, 234],
        backgroundColor: [
          '#dc3545',
          '#fd7e14',
          '#ffc107',
          '#28a745'
        ],
        borderWidth: 2
      }
    ]
  };

  // Compliance frameworks
  const complianceFrameworks = [
    { name: 'NIST Cybersecurity Framework', score: 82, status: 'Good', lastAssessed: '2 weeks ago' },
    { name: 'ISO 27001', score: 75, status: 'Fair', lastAssessed: '1 month ago' },
    { name: 'SOC 2 Type II', score: 88, status: 'Excellent', lastAssessed: '3 weeks ago' },
    { name: 'PCI DSS', score: 91, status: 'Excellent', lastAssessed: '1 week ago' },
    { name: 'HIPAA', score: 79, status: 'Good', lastAssessed: '2 weeks ago' }
  ];

  // Security controls
  const securityControls = [
    { category: 'Access Control', implemented: 45, total: 52, percentage: 87 },
    { category: 'Audit & Accountability', implemented: 28, total: 35, percentage: 80 },
    { category: 'Configuration Management', implemented: 38, total: 42, percentage: 90 },
    { category: 'Incident Response', implemented: 22, total: 28, percentage: 79 },
    { category: 'Risk Assessment', implemented: 18, total: 20, percentage: 90 },
    { category: 'System Protection', implemented: 33, total: 40, percentage: 83 }
  ];

  // Top security risks
  const topRisks = [
    { risk: 'Unpatched Critical Vulnerabilities', severity: 'Critical', systems: 8, impact: 'High' },
    { risk: 'Weak Password Policies', severity: 'High', systems: 15, impact: 'Medium' },
    { risk: 'Outdated Encryption Protocols', severity: 'High', systems: 6, impact: 'High' },
    { risk: 'Missing Security Updates', severity: 'Medium', systems: 23, impact: 'Medium' },
    { risk: 'Inadequate Access Controls', severity: 'Medium', systems: 12, impact: 'Medium' }
  ];

  // Fetch systems data from API
  const fetchSystems = async () => {
    try {
      setSystemsLoading(true);
      setSystemsError(null);
      
      const response = await fetch('/api/systems');
      if (!response.ok) {
        throw new Error(`Failed to fetch systems: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform database data to match UI expectations
      const transformedSystems = data.map(system => ({
        id: system.id,
        system_id: system.system_id,
        name: system.name,
        type: system.system_type || 'Unknown',
        environment: system.status === 'operational' ? 'Production' : 'Development',
        classification: system.confidentiality_impact === 'high' ? 'Critical' :
                       system.confidentiality_impact === 'moderate' ? 'High' : 'Medium',
        owner: system.system_owner || 'Unassigned',
        description: system.raw_json?.name || 'No description available',
        createdDate: system.created_at,
        lastUpdated: system.updated_at,
        assets: 0, // Will be populated by asset count query
        vulnerabilities: 0, // Will be populated by vulnerability count query
        compliance: 75 // Default compliance score
      }));
      
      // Fetch asset counts for each system
      const systemsWithCounts = await Promise.all(
        transformedSystems.map(async (system) => {
          try {
            // Fetch asset count
            const assetResponse = await fetch(`/api/systems/${system.system_id}/assets/count`);
            const assetData = assetResponse.ok ? await assetResponse.json() : { count: 0 };
            
            // Fetch vulnerability count
            const vulnResponse = await fetch(`/api/systems/${system.system_id}/vulnerabilities/count`);
            const vulnData = vulnResponse.ok ? await vulnResponse.json() : { count: 0 };
            
            return {
              ...system,
              assets: assetData.count || 0,
              vulnerabilities: vulnData.count || 0
            };
          } catch (error) {
            console.warn(`Failed to fetch counts for system ${system.system_id}:`, error);
            return system;
          }
        })
      );
      
      setSystems(systemsWithCounts);
    } catch (error) {
      console.error('Error fetching systems:', error);
      setSystemsError(error.message || 'Failed to fetch systems');
    } finally {
      setSystemsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const openSystemDetailModal = (system) => {
    setSelectedSystem(system);
    setActiveSystemTab('overview');
    setSystemDetailModal(true);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
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

  return (
    <>
      <Head title="Security Posture" />
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>Security Posture</BlockTitle>
            <BlockDes className="text-soft">
              Comprehensive security posture assessment and compliance monitoring
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        {/* Security Score Overview */}
        <Block>
          <Row className="g-gs">
            <Col md="3">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Overall Security Score</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className={`amount text-${getScoreColor(securityMetrics.overallScore)}`}>
                        {securityMetrics.overallScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="3">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Critical Vulnerabilities</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className="amount text-danger">{securityMetrics.criticalVulns}</span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="3">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Patch Compliance</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className={`amount text-${getScoreColor(securityMetrics.patchCompliance)}`}>
                        {securityMetrics.patchCompliance}%
                      </span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col md="3">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-2">
                    <div className="card-title">
                      <h6 className="title">Config Compliance</h6>
                    </div>
                  </div>
                  <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                    <div className="nk-sale-data">
                      <span className={`amount text-${getScoreColor(securityMetrics.configCompliance)}`}>
                        {securityMetrics.configCompliance}%
                      </span>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
          </Row>
        </Block>

        {/* Security Trends and Vulnerability Distribution */}
        <Block>
          <Row className="g-gs">
            <Col lg="8">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-3">
                    <div className="card-title">
                      <h6 className="title">Security Posture Trends</h6>
                    </div>
                  </div>
                  <div className="nk-ck" style={{ height: '350px' }}>
                    <Line data={securityTrendsData} options={chartOptions} />
                  </div>
                </div>
              </PreviewCard>
            </Col>
            <Col lg="4">
              <PreviewCard>
                <div className="card-inner">
                  <div className="card-title-group align-start mb-3">
                    <div className="card-title">
                      <h6 className="title">Vulnerability Distribution</h6>
                    </div>
                  </div>
                  <div className="nk-ck" style={{ height: '300px' }}>
                    <Doughnut data={vulnerabilityDistData} options={doughnutOptions} />
                  </div>
                </div>
              </PreviewCard>
            </Col>
          </Row>
        </Block>

        {/* Compliance Frameworks */}
        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">Compliance Frameworks</BlockTitle>
              <p>Assessment status across various security and compliance frameworks</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="card-inner">
              <DataTable className="card-stretch">
                <DataTableBody>
                  <DataTableHead className="nk-tb-head">
                    <DataTableRow>
                      <span className="sub-text">Framework</span>
                    </DataTableRow>
                    <DataTableRow size="mb">
                      <span className="sub-text">Score</span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className="sub-text">Status</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Last Assessed</span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools text-end">
                      <span className="sub-text">Actions</span>
                    </DataTableRow>
                  </DataTableHead>
                  {complianceFrameworks.map((framework, idx) => (
                    <DataTableItem key={idx}>
                      <DataTableRow>
                        <span className="fw-medium">{framework.name}</span>
                      </DataTableRow>
                      <DataTableRow size="mb">
                        <span className={`tb-amount text-${getScoreColor(framework.score)}`}>
                          {framework.score}%
                        </span>
                      </DataTableRow>
                      <DataTableRow size="md">
                        <Badge
                          className="badge-dot"
                          color={getScoreColor(framework.score)}
                        >
                          {framework.status}
                        </Badge>
                      </DataTableRow>
                      <DataTableRow>
                        <span className="tb-amount">{framework.lastAssessed}</span>
                      </DataTableRow>
                      <DataTableRow className="nk-tb-col-tools">
                        <ul className="nk-tb-actions gx-1">
                          <li>
                            <UncontrolledDropdown>
                              <DropdownToggle tag="a" className="text-soft dropdown-toggle btn btn-icon btn-trigger">
                                <Icon name="more-h"></Icon>
                              </DropdownToggle>
                              <DropdownMenu end>
                                <ul className="link-list-opt no-bdr">
                                  <li><DropdownItem tag="a" href="#assess"><Icon name="activity"></Icon><span>Run Assessment</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#report"><Icon name="file-text"></Icon><span>View Report</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#history"><Icon name="clock"></Icon><span>Assessment History</span></DropdownItem></li>
                                </ul>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </li>
                        </ul>
                      </DataTableRow>
                    </DataTableItem>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </PreviewCard>
        </Block>

        {/* Security Controls Implementation */}
        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">Security Controls Implementation</BlockTitle>
              <p>Status of security control implementation across different categories</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="card-inner">
              <DataTable className="card-stretch">
                <DataTableBody>
                  <DataTableHead className="nk-tb-head">
                    <DataTableRow>
                      <span className="sub-text">Control Category</span>
                    </DataTableRow>
                    <DataTableRow size="mb">
                      <span className="sub-text">Implemented</span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className="sub-text">Total</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Progress</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Percentage</span>
                    </DataTableRow>
                  </DataTableHead>
                  {securityControls.map((control, idx) => (
                    <DataTableItem key={idx}>
                      <DataTableRow>
                        <span className="fw-medium">{control.category}</span>
                      </DataTableRow>
                      <DataTableRow size="mb">
                        <span className="tb-amount text-success">{control.implemented}</span>
                      </DataTableRow>
                      <DataTableRow size="md">
                        <span className="tb-amount">{control.total}</span>
                      </DataTableRow>
                      <DataTableRow>
                        <div className="progress-wrap">
                          <Progress
                            value={control.percentage}
                            color={getScoreColor(control.percentage)}
                            style={{ height: '8px' }}
                          />
                        </div>
                      </DataTableRow>
                      <DataTableRow>
                        <span className={`tb-amount text-${getScoreColor(control.percentage)}`}>
                          {control.percentage}%
                        </span>
                      </DataTableRow>
                    </DataTableItem>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </PreviewCard>
        </Block>

        {/* Top Security Risks */}
        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">Top Security Risks</BlockTitle>
              <p>Critical security risks requiring immediate attention</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="card-inner">
              <DataTable className="card-stretch">
                <DataTableBody>
                  <DataTableHead className="nk-tb-head">
                    <DataTableRow>
                      <span className="sub-text">Risk Description</span>
                    </DataTableRow>
                    <DataTableRow size="mb">
                      <span className="sub-text">Severity</span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className="sub-text">Affected Systems</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span className="sub-text">Business Impact</span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools text-end">
                      <span className="sub-text">Actions</span>
                    </DataTableRow>
                  </DataTableHead>
                  {topRisks.map((risk, idx) => (
                    <DataTableItem key={idx}>
                      <DataTableRow>
                        <span className="fw-medium">{risk.risk}</span>
                      </DataTableRow>
                      <DataTableRow size="mb">
                        <Badge
                          className="badge-dot"
                          color={getSeverityColor(risk.severity)}
                        >
                          {risk.severity}
                        </Badge>
                      </DataTableRow>
                      <DataTableRow size="md">
                        <span className="tb-amount">{risk.systems}</span>
                      </DataTableRow>
                      <DataTableRow>
                        <Badge
                          className="badge-dot"
                          color={risk.impact === 'High' ? 'danger' : risk.impact === 'Medium' ? 'warning' : 'info'}
                        >
                          {risk.impact}
                        </Badge>
                      </DataTableRow>
                      <DataTableRow className="nk-tb-col-tools">
                        <ul className="nk-tb-actions gx-1">
                          <li>
                            <UncontrolledDropdown>
                              <DropdownToggle tag="a" className="text-soft dropdown-toggle btn btn-icon btn-trigger">
                                <Icon name="more-h"></Icon>
                              </DropdownToggle>
                              <DropdownMenu end>
                                <ul className="link-list-opt no-bdr">
                                  <li><DropdownItem tag="a" href="#remediate"><Icon name="shield-check"></Icon><span>Create Remediation Plan</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#details"><Icon name="eye"></Icon><span>View Details</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#assign"><Icon name="user"></Icon><span>Assign Owner</span></DropdownItem></li>
                                  <li><DropdownItem tag="a" href="#suppress"><Icon name="cross"></Icon><span>Suppress Risk</span></DropdownItem></li>
                                </ul>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </li>
                        </ul>
                      </DataTableRow>
                    </DataTableItem>
                  ))}
                </DataTableBody>
              </DataTable>
            </div>
          </PreviewCard>
        </Block>

        {/* Systems Management */}
        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">Systems Inventory</BlockTitle>
              <p>Manage and monitor all systems in your infrastructure</p>
            </BlockHeadContent>
          </BlockHead>
          <PreviewCard>
            <div className="card-inner">
              {systemsLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                  </div>
                  <p className="mt-2">Loading systems...</p>
                </div>
              ) : systemsError ? (
                <div className="text-center py-4">
                  <span className="text-danger">Error: {systemsError}</span>
                  <br />
                  <Button color="primary" size="sm" className="mt-2" onClick={fetchSystems}>
                    Retry
                  </Button>
                </div>
              ) : systems.length === 0 ? (
                <div className="text-center py-5">
                  <Icon name="server" className="text-muted" style={{ fontSize: '3rem' }}></Icon>
                  <h6 className="text-muted mt-3">No systems found</h6>
                  <p className="text-soft">Systems will appear here when available</p>
                </div>
              ) : (
                <DataTable className="card-stretch">
                  <DataTableBody>
                    <DataTableHead className="nk-tb-head">
                      <DataTableRow size="lg">
                        <span className="sub-text">System Name</span>
                      </DataTableRow>
                      <DataTableRow size="md">
                        <span className="sub-text">Type</span>
                      </DataTableRow>
                      <DataTableRow size="sm">
                        <span className="sub-text">Environment</span>
                      </DataTableRow>
                      <DataTableRow size="sm">
                        <span className="sub-text">Classification</span>
                      </DataTableRow>
                      <DataTableRow size="md">
                        <span className="sub-text">Owner</span>
                      </DataTableRow>
                      <DataTableRow size="sm">
                        <span className="sub-text">Assets</span>
                      </DataTableRow>
                      <DataTableRow size="sm">
                        <span className="sub-text">Vulnerabilities</span>
                      </DataTableRow>
                      <DataTableRow className="nk-tb-col-tools text-end" size="sm">
                        <span className="sub-text">Actions</span>
                      </DataTableRow>
                    </DataTableHead>
                    {systems.map((system) => (
                      <DataTableItem key={system.id}>
                        <DataTableRow size="lg">
                          <div className="user-card">
                            <div className="user-name">
                              <span className="tb-lead">{system.name}</span>
                              {system.system_id && <span className="tb-sub">{system.system_id}</span>}
                            </div>
                          </div>
                        </DataTableRow>
                        <DataTableRow size="md">
                          <span>{system.type}</span>
                        </DataTableRow>
                        <DataTableRow size="sm">
                          <Badge color={system.environment === 'Production' ? 'danger' : 'info'}>
                            {system.environment}
                          </Badge>
                        </DataTableRow>
                        <DataTableRow size="sm">
                          <Badge color={system.classification === 'Critical' ? 'danger' : system.classification === 'High' ? 'warning' : 'info'}>
                            {system.classification}
                          </Badge>
                        </DataTableRow>
                        <DataTableRow size="md">
                          <span>{system.owner}</span>
                        </DataTableRow>
                        <DataTableRow size="sm">
                          <span className="tb-amount">{system.assets}</span>
                        </DataTableRow>
                        <DataTableRow size="sm">
                          <span className={`tb-amount ${system.vulnerabilities > 10 ? 'text-danger' : system.vulnerabilities > 5 ? 'text-warning' : 'text-success'}`}>
                            {system.vulnerabilities}
                          </span>
                        </DataTableRow>
                        <DataTableRow className="nk-tb-col-tools">
                          <ul className="nk-tb-actions gx-1">
                            <li>
                              <UncontrolledDropdown>
                                <DropdownToggle tag="a" className="text-soft dropdown-toggle btn btn-icon btn-trigger">
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
                                          openSystemDetailModal(system);
                                        }}
                                      >
                                        <Icon name="eye"></Icon>
                                        <span>View Detail</span>
                                      </DropdownItem>
                                    </li>
                                    <li><DropdownItem tag="a" href="#edit"><Icon name="edit"></Icon><span>Edit System</span></DropdownItem></li>
                                    <li><DropdownItem tag="a" href="#scan"><Icon name="shield-check"></Icon><span>Run Security Scan</span></DropdownItem></li>
                                    <li><DropdownItem tag="a" href="#compliance"><Icon name="check-circle"></Icon><span>Check Compliance</span></DropdownItem></li>
                                  </ul>
                                </DropdownMenu>
                              </UncontrolledDropdown>
                            </li>
                          </ul>
                        </DataTableRow>
                      </DataTableItem>
                    ))}
                  </DataTableBody>
                </DataTable>
              )}
            </div>
          </PreviewCard>
        </Block>

        {/* System Detail Modal */}
        <Modal
          isOpen={systemDetailModal}
          toggle={() => setSystemDetailModal(!systemDetailModal)}
          size="xl"
        >
          <ModalHeader toggle={() => setSystemDetailModal(!systemDetailModal)}>
            System Details - {selectedSystem?.name}
          </ModalHeader>
          <ModalBody>
            {selectedSystem && (
              <div>
                {/* System Header Info */}
                <div className="nk-block-head nk-block-head-sm">
                  <div className="nk-block-between">
                    <div className="nk-block-head-content">
                      <h3 className="nk-block-title page-title">
                        <Icon name="server" className="me-2"></Icon>
                        {selectedSystem.name}
                      </h3>
                      <div className="nk-block-des text-soft mt-2">
                        <Row>
                          <Col md="3">
                            <div className="form-group">
                              <label className="form-label">Type</label>
                              <div className="form-control-static">{selectedSystem.type || 'N/A'}</div>
                            </div>
                          </Col>
                          <Col md="3">
                            <div className="form-group">
                              <label className="form-label">Environment</label>
                              <div className="form-control-static">{selectedSystem.environment || 'N/A'}</div>
                            </div>
                          </Col>
                          <Col md="3">
                            <div className="form-group">
                              <label className="form-label">Classification</label>
                              <div className="form-control-static">{selectedSystem.classification || 'N/A'}</div>
                            </div>
                          </Col>
                          <Col md="3">
                            <div className="form-group">
                              <label className="form-label">Owner</label>
                              <div className="form-control-static">{selectedSystem.owner || 'N/A'}</div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <Nav tabs className="nav-tabs-mb-icon nav-tabs-card">
                  <NavItem>
                    <NavLink
                      className={activeSystemTab === 'overview' ? 'active' : ''}
                      onClick={() => setActiveSystemTab('overview')}
                      href="#"
                    >
                      <Icon name="grid-alt"></Icon>
                      <span>Overview</span>
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeSystemTab === 'assets' ? 'active' : ''}
                      onClick={() => setActiveSystemTab('assets')}
                      href="#"
                    >
                      <Icon name="server"></Icon>
                      <span>Assets</span>
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeSystemTab === 'vulnerabilities' ? 'active' : ''}
                      onClick={() => setActiveSystemTab('vulnerabilities')}
                      href="#"
                    >
                      <Icon name="shield-alert"></Icon>
                      <span>Vulnerabilities</span>
                    </NavLink>
                  </NavItem>
                  <NavItem>
                    <NavLink
                      className={activeSystemTab === 'compliance' ? 'active' : ''}
                      onClick={() => setActiveSystemTab('compliance')}
                      href="#"
                    >
                      <Icon name="check-circle"></Icon>
                      <span>Compliance</span>
                    </NavLink>
                  </NavItem>
                </Nav>

                {/* Tab Content */}
                <TabContent activeTab={activeSystemTab}>
                  <TabPane tabId="overview">
                    <div className="nk-block">
                      <Row className="g-4">
                        <Col md="8">
                          <div className="card">
                            <div className="card-inner">
                              <h6 className="card-title">System Information</h6>
                              
                              <div className="form-group">
                                <label className="form-label">Description</label>
                                <div className="form-control-static">
                                  {selectedSystem.description || 'No description available'}
                                </div>
                              </div>

                              <Row>
                                <Col md="6">
                                  <div className="form-group">
                                    <label className="form-label">Created Date</label>
                                    <div className="form-control-static">
                                      {selectedSystem.createdDate ? new Date(selectedSystem.createdDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                </Col>
                                <Col md="6">
                                  <div className="form-group">
                                    <label className="form-label">Last Updated</label>
                                    <div className="form-control-static">
                                      {selectedSystem.lastUpdated ? new Date(selectedSystem.lastUpdated).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                            </div>
                          </div>
                        </Col>
                        <Col md="4">
                          <div className="card">
                            <div className="card-inner">
                              <h6 className="card-title">Quick Stats</h6>
                              <div className="nk-wg-stats">
                                <div className="nk-wg-stats-group g-3">
                                  <div className="nk-wg-stats-item">
                                    <div className="number-large text-primary">{selectedSystem.assets || 3}</div>
                                    <div className="number-text">Assets</div>
                                  </div>
                                  <div className="nk-wg-stats-item">
                                    <div className="number-large text-warning">{selectedSystem.vulnerabilities || 3}</div>
                                    <div className="number-text">Vulnerabilities</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </TabPane>
                  <TabPane tabId="assets">
                    <div className="nk-block">
                      <div className="card">
                        <div className="card-inner">
                          <h6 className="card-title">System Assets</h6>
                          <p className="text-soft">Assets associated with this system will be displayed here.</p>
                          <div className="text-center py-4">
                            <Icon name="server" className="text-muted" style={{ fontSize: '3rem' }}></Icon>
                            <h6 className="text-muted mt-3">No assets data available</h6>
                            <p className="text-soft">Asset information will be populated when connected to data sources.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabPane>
                  <TabPane tabId="vulnerabilities">
                    <div className="nk-block">
                      <div className="card">
                        <div className="card-inner">
                          <h6 className="card-title">Security Vulnerabilities</h6>
                          <p className="text-soft">Vulnerability information for this system will be displayed here.</p>
                          <div className="text-center py-4">
                            <Icon name="shield-alert" className="text-muted" style={{ fontSize: '3rem' }}></Icon>
                            <h6 className="text-muted mt-3">No vulnerability data available</h6>
                            <p className="text-soft">Vulnerability scans will populate this section.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabPane>
                  <TabPane tabId="compliance">
                    <div className="nk-block">
                      <div className="card">
                        <div className="card-inner">
                          <h6 className="card-title">Compliance Status</h6>
                          <p className="text-soft">Compliance assessment results for this system will be displayed here.</p>
                          <div className="text-center py-4">
                            <Icon name="check-circle" className="text-muted" style={{ fontSize: '3rem' }}></Icon>
                            <h6 className="text-muted mt-3">No compliance data available</h6>
                            <p className="text-soft">Compliance assessments will populate this section.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabPane>
                </TabContent>
              </div>
            )}
          </ModalBody>
        </Modal>
      </Content>
    </>
  );
};

export default SecurityPosture;
