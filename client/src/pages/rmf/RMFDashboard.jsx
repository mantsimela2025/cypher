import React, { useState, useEffect } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  DropdownItem,
  UncontrolledTooltip,
} from "reactstrap";
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  Row,
  Col,
  Button,
  PreviewCard,
  PreviewAltCard,
} from "@/components/Component";
import { Link } from "react-router-dom";

const RMFDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueTasks: 0,
  });
  const [sm, updateSm] = useState(false);

  // Mock data - replace with API calls
  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setProjects([
        {
          id: 1,
          name: "Financial System RMF",
          description: "Risk Management Framework implementation for core financial systems",
          currentStep: "CATEGORIZE",
          status: "active",
          progress: 16.67,
          dueDate: "2024-03-15",
          assignedTo: "John Smith",
          systemType: "High Impact",
          lastUpdated: "2024-01-15",
        },
        {
          id: 2,
          name: "HR Portal RMF",
          description: "Compliance assessment for human resources management portal",
          currentStep: "SELECT",
          status: "active", 
          progress: 33.33,
          dueDate: "2024-02-28",
          assignedTo: "Sarah Johnson",
          systemType: "Moderate Impact",
          lastUpdated: "2024-01-14",
        },
        {
          id: 3,
          name: "Legacy Database RMF",
          description: "Security control implementation for legacy customer database",
          currentStep: "IMPLEMENT",
          status: "active",
          progress: 50.0,
          dueDate: "2024-04-10",
          assignedTo: "Mike Davis",
          systemType: "High Impact",
          lastUpdated: "2024-01-13",
        }
      ]);

      setStats({
        totalProjects: 8,
        activeProjects: 5,
        completedProjects: 2,
        overdueTasks: 3,
      });

      setLoading(false);
    }, 1000);
  }, []);

  // Get step badge color
  const getStepBadgeColor = (step) => {
    const colorMap = {
      CATEGORIZE: "primary",
      SELECT: "info", 
      IMPLEMENT: "warning",
      ASSESS: "purple",
      AUTHORIZE: "success",
      MONITOR: "dark",
    };
    return colorMap[step] || "secondary";
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colorMap = {
      active: "success",
      pending: "warning",
      completed: "primary",
      overdue: "danger",
    };
    return colorMap[status] || "secondary";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if project is overdue
  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <React.Fragment>
      <Head title="RMF Dashboard"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Risk Management Framework (RMF)
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>
                  Comprehensive RMF implementation dashboard for managing security controls, 
                  assessments, and compliance across all organizational systems.
                </p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className={`btn-icon btn-trigger toggle-expand me-n1 ${sm ? "active" : ""}`}
                  onClick={() => updateSm(!sm)}
                >
                  <Icon name="menu-alt-r"></Icon>
                </Button>
                <div className="toggle-expand-content" style={{ display: sm ? "block" : "none" }}>
                  <ul className="nk-block-tools g-3">
                    <li>
                      <a
                        href="#export"
                        onClick={(ev) => {
                          ev.preventDefault();
                        }}
                        className="btn btn-white btn-outline-light"
                      >
                        <Icon name="download-cloud"></Icon>
                        <span>Export Report</span>
                      </a>
                    </li>
                    <li className="nk-block-tools-opt">
                      <Link to="/rmf/projects/new" className="btn btn-primary">
                        <Icon name="plus"></Icon>
                        <span>New RMF Project</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {loading ? (
          <Block>
            <div className="card card-bordered">
              <div className="card-inner text-center py-5">
                <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }}>
                  <span className="sr-only">Loading RMF data...</span>
                </div>
                <div className="mt-3">
                  <p className="text-soft">Loading RMF dashboard...</p>
                </div>
              </div>
            </div>
          </Block>
        ) : (
          <>
            {/* Stats Cards */}
            <Block>
              <Row className="g-gs">
                <Col xxl="3" sm="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Total Projects</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="growth" className="text-primary"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">{stats.totalProjects}</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-success">
                            <Icon name="arrow-long-up"></Icon> Active
                          </small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col xxl="3" sm="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Active Projects</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="activity" className="text-success"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">{stats.activeProjects}</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-success">In Progress</small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col xxl="3" sm="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Completed</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="check-circle" className="text-primary"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount">{stats.completedProjects}</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-primary">Authorized</small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
                <Col xxl="3" sm="6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="card-title-group align-start mb-2">
                        <div className="card-title">
                          <h6 className="title">Overdue Tasks</h6>
                        </div>
                        <div className="card-tools">
                          <Icon name="alert-circle" className="text-danger"></Icon>
                        </div>
                      </div>
                      <div className="align-end flex-sm-wrap g-4 flex-md-nowrap">
                        <div className="nk-sale-data">
                          <span className="amount text-danger">{stats.overdueTasks}</span>
                        </div>
                        <div className="nk-sales-ck">
                          <small className="text-danger">Requires Attention</small>
                        </div>
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
              </Row>
            </Block>

            {/* RMF Process Steps */}
            <Block>
              <BlockHead size="sm">
                <BlockHeadContent>
                  <BlockTitle tag="h6">RMF Process Overview</BlockTitle>
                  <BlockDes>
                    <p>Six-step Risk Management Framework implementation process</p>
                  </BlockDes>
                </BlockHeadContent>
              </BlockHead>
              <Row className="g-gs">
                <Col sm="6" lg="4">
                  <PreviewAltCard className="card-bordered h-100">
                    <div className="card-inner">
                      <div className="project">
                        <div className="project-head">
                          <a href="#" className="project-title">
                            <Icon name="property" className="text-primary"></Icon>
                            <span>STEP 1: CATEGORIZE</span>
                          </a>
                        </div>
                        <div className="project-details">
                          <p>Categorize information systems and data according to impact levels.</p>
                        </div>
                        <div className="project-meta">
                          <ul className="project-users g-1">
                            <li>
                              <span className="badge badge-dim bg-primary">System Classification</span>
                            </li>
                            <li>
                              <span className="badge badge-dim bg-primary">Impact Analysis</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </PreviewAltCard>
                </Col>
                <Col sm="6" lg="4">
                  <PreviewAltCard className="card-bordered h-100">
                    <div className="card-inner">
                      <div className="project">
                        <div className="project-head">
                          <a href="#" className="project-title">
                            <Icon name="check-square" className="text-info"></Icon>
                            <span>STEP 2: SELECT</span>
                          </a>
                        </div>
                        <div className="project-details">
                          <p>Select appropriate security controls based on system categorization.</p>
                        </div>
                        <div className="project-meta">
                          <ul className="project-users g-1">
                            <li>
                              <span className="badge badge-dim bg-info">Control Baselines</span>
                            </li>
                            <li>
                              <span className="badge badge-dim bg-info">Tailoring</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </PreviewAltCard>
                </Col>
                <Col sm="6" lg="4">
                  <PreviewAltCard className="card-bordered h-100">
                    <div className="card-inner">
                      <div className="project">
                        <div className="project-head">
                          <a href="#" className="project-title">
                            <Icon name="code" className="text-warning"></Icon>
                            <span>STEP 3: IMPLEMENT</span>
                          </a>
                        </div>
                        <div className="project-details">
                          <p>Implement security controls and document implementation details.</p>
                        </div>
                        <div className="project-meta">
                          <ul className="project-users g-1">
                            <li>
                              <span className="badge badge-dim bg-warning">Implementation</span>
                            </li>
                            <li>
                              <span className="badge badge-dim bg-warning">Documentation</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </PreviewAltCard>
                </Col>
                <Col sm="6" lg="4">
                  <PreviewAltCard className="card-bordered h-100">
                    <div className="card-inner">
                      <div className="project">
                        <div className="project-head">
                          <a href="#" className="project-title">
                            <Icon name="shield-check" className="text-purple"></Icon>
                            <span>STEP 4: ASSESS</span>
                          </a>
                        </div>
                        <div className="project-details">
                          <p>Assess security control effectiveness through testing and evaluation.</p>
                        </div>
                        <div className="project-meta">
                          <ul className="project-users g-1">
                            <li>
                              <span className="badge badge-dim bg-purple">Testing</span>
                            </li>
                            <li>
                              <span className="badge badge-dim bg-purple">Evaluation</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </PreviewAltCard>
                </Col>
                <Col sm="6" lg="4">
                  <PreviewAltCard className="card-bordered h-100">
                    <div className="card-inner">
                      <div className="project">
                        <div className="project-head">
                          <a href="#" className="project-title">
                            <Icon name="check-thick" className="text-success"></Icon>
                            <span>STEP 5: AUTHORIZE</span>
                          </a>
                        </div>
                        <div className="project-details">
                          <p>Make risk-based decision on system operation authorization.</p>
                        </div>
                        <div className="project-meta">
                          <ul className="project-users g-1">
                            <li>
                              <span className="badge badge-dim bg-success">Risk Assessment</span>
                            </li>
                            <li>
                              <span className="badge badge-dim bg-success">ATO Decision</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </PreviewAltCard>
                </Col>
                <Col sm="6" lg="4">
                  <PreviewAltCard className="card-bordered h-100">
                    <div className="card-inner">
                      <div className="project">
                        <div className="project-head">
                          <a href="#" className="project-title">
                            <Icon name="monitor" className="text-dark"></Icon>
                            <span>STEP 6: MONITOR</span>
                          </a>
                        </div>
                        <div className="project-details">
                          <p>Continuously monitor security controls and system status.</p>
                        </div>
                        <div className="project-meta">
                          <ul className="project-users g-1">
                            <li>
                              <span className="badge badge-dim bg-dark">Continuous Monitoring</span>
                            </li>
                            <li>
                              <span className="badge badge-dim bg-dark">Updates</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </PreviewAltCard>
                </Col>
              </Row>
            </Block>

            {/* Recent Projects */}
            <Block>
              <BlockHead size="sm">
                <BlockBetween>
                  <BlockHeadContent>
                    <BlockTitle tag="h6">Recent RMF Projects</BlockTitle>
                  </BlockHeadContent>
                  <BlockHeadContent>
                    <Link to="/rmf/projects" className="link">
                      View All Projects
                      <Icon name="arrow-long-right" className="ms-1"></Icon>
                    </Link>
                  </BlockHeadContent>
                </BlockBetween>
              </BlockHead>
              <Row className="g-gs">
                {projects.map((project) => (
                  <Col key={project.id} sm="6" lg="4">
                    <PreviewAltCard className="card-bordered">
                      <div className="project">
                        <div className="project-head">
                          <a href="#" className="project-title">
                            <Icon name="grid-fill" className="text-primary"></Icon>
                            <span>{project.name}</span>
                          </a>
                          <UncontrolledDropdown>
                            <DropdownToggle tag="a" className="dropdown-toggle btn btn-sm btn-icon btn-trigger">
                              <Icon name="more-h"></Icon>
                            </DropdownToggle>
                            <DropdownMenu end>
                              <ul className="link-list-opt no-bdr">
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#view"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="eye"></Icon>
                                    <span>View Details</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#edit"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="edit"></Icon>
                                    <span>Edit Project</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#tasks"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="list-check"></Icon>
                                    <span>View Tasks</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#reports"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="report"></Icon>
                                    <span>Generate Report</span>
                                  </DropdownItem>
                                </li>
                              </ul>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </div>
                        <div className="project-details">
                          <p>{project.description}</p>
                        </div>
                        <div className="project-meta">
                          <ul className="project-users g-1">
                            <li>
                              <span className={`badge badge-dim bg-${getStepBadgeColor(project.currentStep)}`}>
                                {project.currentStep}
                              </span>
                            </li>
                            <li>
                              <span className={`badge badge-dim bg-${project.systemType === 'High Impact' ? 'danger' : project.systemType === 'Moderate Impact' ? 'warning' : 'success'}`}>
                                {project.systemType}
                              </span>
                            </li>
                          </ul>
                        </div>
                        <div className="project-meta">
                          <span className="text-soft">{formatDate(project.lastUpdated)} by {project.assignedTo}</span>
                        </div>
                        <div className="project-progress">
                          <div className="progress-wrap">
                            <div className="progress-text">
                              <div className="progress-label">Progress</div>
                              <div className="progress-amount">{project.progress.toFixed(1)}%</div>
                            </div>
                            <div className="progress progress-md">
                              <div 
                                className={`progress-bar bg-${project.progress < 30 ? 'danger' : project.progress < 70 ? 'warning' : 'success'}`}
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="project-meta">
                          <span className={`text-${isOverdue(project.dueDate) ? 'danger' : 'soft'}`}>
                            Due: {formatDate(project.dueDate)}
                            {isOverdue(project.dueDate) && <Icon name="alert-circle" className="ms-1 text-danger"></Icon>}
                          </span>
                        </div>
                      </div>
                    </PreviewAltCard>
                  </Col>
                ))}
              </Row>
            </Block>
          </>
        )}
      </Content>
    </React.Fragment>
  );
};

export default RMFDashboard;