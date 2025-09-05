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
  Input,
  Form,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Progress,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Row,
  Col,
  Alert
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
import DataTable from "react-data-table-component";
import { Line } from "react-chartjs-2";
import classnames from "classnames";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const PatchJobs = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jobDetailsModal, setJobDetailsModal] = useState(false);
  const [jobLogsModal, setJobLogsModal] = useState(false);
  const [createJobModal, setCreateJobModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [realTimeUpdates, setRealTimeUpdates] = useState(true);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        log.api('Fetching patch jobs');
        const data = await apiClient.get('/patch-jobs?limit=100');
        setJobs(data.data || []);
        log.info('Patch jobs loaded successfully:', data.data?.length || 0, 'jobs');
      } catch (error) {
        log.error('Error fetching jobs:', error.message);
        log.warn('Falling back to mock data');
        setJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Mock data for development
  const mockJobs = [
    {
      id: "1",
      patchId: "MS-2024-001",
      patchTitle: "Windows Security Update",
      status: "running",
      progress: 65,
      executionType: "scheduled",
      priority: 5,
      scheduledFor: "2024-01-15T14:00:00Z",
      startedAt: "2024-01-15T14:00:00Z",
      totalTargets: 145,
      completedTargets: 94,
      failedTargets: 3,
      createdBy: "admin",
      estimatedCompletion: "2024-01-15T15:30:00Z"
    },
    {
      id: "2",
      patchId: "ADOBE-2024-002",
      patchTitle: "Adobe Reader Security Update",
      status: "pending",
      progress: 0,
      executionType: "immediate",
      priority: 4,
      scheduledFor: "2024-01-15T16:00:00Z",
      totalTargets: 89,
      completedTargets: 0,
      failedTargets: 0,
      createdBy: "user1",
      estimatedCompletion: null
    },
    {
      id: "3",
      patchId: "JAVA-2024-003",
      patchTitle: "Java Runtime Environment Update",
      status: "completed",
      progress: 100,
      executionType: "maintenance_window",
      priority: 3,
      scheduledFor: "2024-01-14T22:00:00Z",
      startedAt: "2024-01-14T22:00:00Z",
      completedAt: "2024-01-14T23:45:00Z",
      totalTargets: 234,
      completedTargets: 230,
      failedTargets: 4,
      createdBy: "admin",
      duration: "1h 45m"
    },
    {
      id: "4",
      patchId: "CHROME-2024-004",
      patchTitle: "Chrome Security Update",
      status: "failed",
      progress: 45,
      executionType: "immediate",
      priority: 5,
      scheduledFor: "2024-01-15T10:00:00Z",
      startedAt: "2024-01-15T10:00:00Z",
      failedAt: "2024-01-15T11:30:00Z",
      totalTargets: 312,
      completedTargets: 140,
      failedTargets: 172,
      createdBy: "user2",
      errorMessage: "Network timeout during deployment"
    },
    {
      id: "5",
      patchId: "WIN-2024-005",
      patchTitle: "Windows Cumulative Update",
      status: "paused",
      progress: 25,
      executionType: "scheduled",
      priority: 2,
      scheduledFor: "2024-01-15T20:00:00Z",
      startedAt: "2024-01-15T20:00:00Z",
      pausedAt: "2024-01-15T20:30:00Z",
      totalTargets: 67,
      completedTargets: 17,
      failedTargets: 1,
      createdBy: "admin",
      pauseReason: "User requested pause"
    }
  ];

  // Real-time updates simulation
  useEffect(() => {
    if (!realTimeUpdates) return;

    const interval = setInterval(() => {
      setJobs(prevJobs =>
        prevJobs.map(job => {
          if (job.status === 'running' && job.progress < 100) {
            const newProgress = Math.min(100, job.progress + Math.random() * 5);
            return {
              ...job,
              progress: newProgress,
              completedTargets: Math.floor((newProgress / 100) * job.totalTargets)
            };
          }
          return job;
        })
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [realTimeUpdates]);

  // Job control functions
  const handleJobControl = async (jobId, action) => {
    try {
      log.api(`Performing ${action} action on job:`, jobId);
      const result = await apiClient.post(`/patch-jobs/${jobId}/${action}`);

      if (result.success) {
        // Update job status locally
        setJobs(prevJobs =>
          prevJobs.map(job =>
            job.id === jobId
              ? { ...job, status: action === 'start' ? 'running' : action }
              : job
          )
        );
        log.info(`Job ${action} action completed successfully`);
      }
    } catch (error) {
      log.error(`Error ${action} job:`, error.message);
    }
  };

  const fetchJobLogs = async (jobId) => {
    try {
      log.api('Fetching logs for job:', jobId);
      const data = await apiClient.get(`/patch-jobs/${jobId}/logs`);
      setLogs(data.data || mockLogs);
      log.info('Job logs loaded successfully');
    } catch (error) {
      log.error('Error fetching logs:', error.message);
      log.warn('Falling back to mock logs');
      setLogs(mockLogs);
    }
  };

  const mockLogs = [
    { timestamp: "2024-01-15T14:00:00Z", level: "INFO", component: "JobManager", message: "Job started successfully" },
    { timestamp: "2024-01-15T14:01:00Z", level: "INFO", component: "PatchDeployer", message: "Deploying patch to target group 1 (50 assets)" },
    { timestamp: "2024-01-15T14:05:00Z", level: "INFO", component: "PatchDeployer", message: "Group 1 deployment completed: 48 success, 2 failed" },
    { timestamp: "2024-01-15T14:06:00Z", level: "WARN", component: "PatchDeployer", message: "Asset 'WS-001' failed: Network timeout" },
    { timestamp: "2024-01-15T14:10:00Z", level: "INFO", component: "PatchDeployer", message: "Deploying patch to target group 2 (45 assets)" },
    { timestamp: "2024-01-15T14:15:00Z", level: "INFO", component: "PatchDeployer", message: "Group 2 deployment in progress: 30 completed" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'info';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      case 'paused': return 'secondary';
      case 'cancelled': return 'dark';
      default: return 'secondary';
    }
  };

  const getPriorityColor = (priority) => {
    if (priority >= 4) return 'danger';
    if (priority >= 3) return 'warning';
    return 'info';
  };

  const getProgressColor = (progress, status) => {
    if (status === 'failed') return 'danger';
    if (status === 'completed') return 'success';
    if (progress < 30) return 'info';
    if (progress < 70) return 'warning';
    return 'success';
  };

  // Filter jobs by tab
  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'active':
        return jobs.filter(job => ['running', 'pending', 'paused'].includes(job.status));
      case 'completed':
        return jobs.filter(job => job.status === 'completed');
      case 'failed':
        return jobs.filter(job => job.status === 'failed');
      default:
        return jobs;
    }
  };

  // Data table columns for active jobs
  const activeJobsColumns = [
    {
      name: 'Job Details',
      grow: 2,
      cell: row => (
        <div className="tb-lead">
          <span className="title">{row.patchTitle}</span>
          <span className="sub-text">{row.patchId}</span>
        </div>
      ),
    },
    {
      name: 'Status',
      width: '120px',
      cell: row => (
        <div>
          <Badge color={getStatusColor(row.status)} className="badge-dim">
            {row.status}
          </Badge>
          {row.status === 'running' && (
            <div className="mt-1">
              <Progress
                value={row.progress}
                color={getProgressColor(row.progress, row.status)}
                size="sm"
              />
              <span className="small text-muted">{row.progress}%</span>
            </div>
          )}
        </div>
      ),
    },
    {
      name: 'Progress',
      width: '150px',
      cell: row => (
        <div className="tb-progress">
          <span className="title">{row.completedTargets}/{row.totalTargets}</span>
          {row.failedTargets > 0 && (
            <span className="sub-text text-danger">{row.failedTargets} failed</span>
          )}
        </div>
      ),
    },
    {
      name: 'Priority',
      width: '100px',
      cell: row => (
        <Badge color={getPriorityColor(row.priority)} className="badge-dim">
          P{row.priority}
        </Badge>
      ),
    },
    {
      name: 'Started',
      width: '130px',
      cell: row => (
        <span className="tb-sub">
          {row.startedAt ? new Date(row.startedAt).toLocaleString() : 'Not started'}
        </span>
      ),
    },
    {
      name: 'Actions',
      width: '140px',
      cell: row => (
        <div className="tb-actions">
          {row.status === 'pending' && (
            <Button size="sm" color="success" onClick={() => handleJobControl(row.id, 'start')}>
              <Icon name="play"></Icon>
            </Button>
          )}
          {row.status === 'running' && (
            <>
              <Button size="sm" color="warning" className="me-1" onClick={() => handleJobControl(row.id, 'pause')}>
                <Icon name="pause"></Icon>
              </Button>
              <Button size="sm" color="danger" onClick={() => handleJobControl(row.id, 'cancel')}>
                <Icon name="stop"></Icon>
              </Button>
            </>
          )}
          {row.status === 'paused' && (
            <Button size="sm" color="info" onClick={() => handleJobControl(row.id, 'resume')}>
              <Icon name="play"></Icon>
            </Button>
          )}
          <Button
            size="sm"
            color="primary"
            outline
            className="ms-1"
            onClick={() => {
              setSelectedJob(row);
              fetchJobLogs(row.id);
              setJobLogsModal(true);
            }}
          >
            <Icon name="file-text"></Icon>
          </Button>
        </div>
      ),
    },
  ];

  // Custom styles
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: '#f5f6fa',
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#e5e9f2',
      },
    },
    headCells: {
      style: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#526484',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#364a63',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
  };

  return (
    <React.Fragment>
      <Head title="Patch Management - Patch Jobs" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>Patch Jobs</BlockTitle>
              <BlockDes className="text-soft">
                <p>Monitor and manage patch deployment jobs with real-time execution tracking</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <ul className="nk-block-tools g-3">
                  <li>
                    <Button
                      color={realTimeUpdates ? "success" : "secondary"}
                      outline
                      onClick={() => setRealTimeUpdates(!realTimeUpdates)}
                    >
                      <Icon name={realTimeUpdates ? "activity" : "pause"}></Icon>
                      <span>Real-time {realTimeUpdates ? "ON" : "OFF"}</span>
                    </Button>
                  </li>
                  <li>
                    <Button color="primary" outline onClick={() => window.location.reload()}>
                      <Icon name="reload"></Icon>
                      <span>Refresh</span>
                    </Button>
                  </li>
                  <li className="nk-block-tools-opt">
                    <Button color="primary" onClick={() => setCreateJobModal(true)}>
                      <Icon name="plus"></Icon>
                      <span>Create Job</span>
                    </Button>
                  </li>
                </ul>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <Card className="card-bordered">
            <div className="card-inner">
              {/* Tab Navigation */}
              <Nav tabs>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "active" })}
                    onClick={() => setActiveTab("active")}
                  >
                    <Icon name="activity" /> <span>Active Jobs</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "completed" })}
                    onClick={() => setActiveTab("completed")}
                  >
                    <Icon name="check-circle" /> <span>Completed</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "failed" })}
                    onClick={() => setActiveTab("failed")}
                  >
                    <Icon name="alert-circle" /> <span>Failed</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === "analytics" })}
                    onClick={() => setActiveTab("analytics")}
                  >
                    <Icon name="bar-chart" /> <span>Analytics</span>
                  </NavLink>
                </NavItem>
              </Nav>

              {/* Tab Content */}
              <TabContent activeTab={activeTab}>
                <TabPane tabId="active">
                  <div className="mt-4">
                    <DataTable
                      columns={activeJobsColumns}
                      data={getFilteredJobs()}
                      pagination
                      paginationPerPage={10}
                      progressPending={loading}
                      customStyles={customStyles}
                      responsive
                      highlightOnHover
                      noDataComponent={
                        <div className="text-center p-4">
                          <Icon name="inbox" className="text-muted mb-2" style={{ fontSize: '2rem' }}></Icon>
                          <p className="text-muted">No active jobs found</p>
                        </div>
                      }
                    />
                  </div>
                </TabPane>

                <TabPane tabId="completed">
                  <div className="mt-4">
                    <DataTable
                      columns={[
                        {
                          name: 'Job Details',
                          grow: 2,
                          cell: row => (
                            <div className="tb-lead">
                              <span className="title">{row.patchTitle}</span>
                              <span className="sub-text">{row.patchId}</span>
                            </div>
                          ),
                        },
                        {
                          name: 'Completed',
                          width: '130px',
                          cell: row => (
                            <span className="tb-sub">
                              {new Date(row.completedAt).toLocaleString()}
                            </span>
                          ),
                        },
                        {
                          name: 'Duration',
                          width: '100px',
                          cell: row => (
                            <span className="tb-sub">{row.duration}</span>
                          ),
                        },
                        {
                          name: 'Success Rate',
                          width: '120px',
                          cell: row => (
                            <div>
                              <span className="tb-amount">
                                {Math.round((row.completedTargets / row.totalTargets) * 100)}%
                              </span>
                              <Progress
                                value={(row.completedTargets / row.totalTargets) * 100}
                                color="success"
                                size="sm"
                                className="mt-1"
                              />
                            </div>
                          ),
                        },
                        {
                          name: 'Actions',
                          width: '100px',
                          cell: row => (
                            <Button
                              size="sm"
                              color="primary"
                              outline
                              onClick={() => {
                                setSelectedJob(row);
                                fetchJobLogs(row.id);
                                setJobLogsModal(true);
                              }}
                            >
                              <Icon name="eye"></Icon>
                            </Button>
                          ),
                        },
                      ]}
                      data={getFilteredJobs()}
                      pagination
                      customStyles={customStyles}
                      responsive
                      highlightOnHover
                      noDataComponent={
                        <div className="text-center p-4">
                          <Icon name="check-circle" className="text-success mb-2" style={{ fontSize: '2rem' }}></Icon>
                          <p className="text-muted">No completed jobs found</p>
                        </div>
                      }
                    />
                  </div>
                </TabPane>

                <TabPane tabId="failed">
                  <div className="mt-4">
                    <DataTable
                      columns={[
                        {
                          name: 'Job Details',
                          grow: 2,
                          cell: row => (
                            <div className="tb-lead">
                              <span className="title">{row.patchTitle}</span>
                              <span className="sub-text">{row.patchId}</span>
                            </div>
                          ),
                        },
                        {
                          name: 'Failed At',
                          width: '130px',
                          cell: row => (
                            <span className="tb-sub text-danger">
                              {new Date(row.failedAt).toLocaleString()}
                            </span>
                          ),
                        },
                        {
                          name: 'Error',
                          grow: 1,
                          cell: row => (
                            <span className="tb-sub text-danger">{row.errorMessage}</span>
                          ),
                        },
                        {
                          name: 'Actions',
                          width: '150px',
                          cell: row => (
                            <div className="tb-actions">
                              <Button
                                size="sm"
                                color="warning"
                                onClick={() => handleJobControl(row.id, 'rollback')}
                              >
                                <Icon name="corner-up-left"></Icon>
                                <span>Rollback</span>
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                outline
                                className="ms-1"
                                onClick={() => {
                                  setSelectedJob(row);
                                  fetchJobLogs(row.id);
                                  setJobLogsModal(true);
                                }}
                              >
                                <Icon name="file-text"></Icon>
                              </Button>
                            </div>
                          ),
                        },
                      ]}
                      data={getFilteredJobs()}
                      pagination
                      customStyles={customStyles}
                      responsive
                      highlightOnHover
                      noDataComponent={
                        <div className="text-center p-4">
                          <Icon name="alert-circle" className="text-danger mb-2" style={{ fontSize: '2rem' }}></Icon>
                          <p className="text-muted">No failed jobs found</p>
                        </div>
                      }
                    />
                  </div>
                </TabPane>

                <TabPane tabId="analytics">
                  <div className="mt-4">
                    <Row className="g-gs">
                      <Col lg="6">
                        <Card className="card-bordered h-100">
                          <div className="card-inner">
                            <div className="card-title-group">
                              <div className="card-title">
                                <h6 className="title">Job Success Rate</h6>
                              </div>
                            </div>
                            <div className="nk-ov-chart-wrap mt-3">
                              <div style={{ height: "200px" }}>
                                <Line
                                  data={{
                                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                                    datasets: [
                                      {
                                        label: "Success Rate %",
                                        backgroundColor: "rgba(40, 167, 69, 0.1)",
                                        borderColor: "#28a745",
                                        borderWidth: 2,
                                        data: [95, 92, 98, 94, 97, 99, 96],
                                      },
                                    ],
                                  }}
                                  options={{
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                      y: { beginAtZero: true, max: 100 },
                                    },
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Col>
                      <Col lg="6">
                        <Row className="g-gs">
                          <Col sm="6">
                            <Card className="card-bordered">
                              <div className="card-inner">
                                <div className="card-title-group">
                                  <div className="card-title">
                                    <h6 className="title">Total Jobs</h6>
                                  </div>
                                </div>
                                <div className="card-amount">
                                  <span className="amount">{jobs.length}</span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                          <Col sm="6">
                            <Card className="card-bordered">
                              <div className="card-inner">
                                <div className="card-title-group">
                                  <div className="card-title">
                                    <h6 className="title">Success Rate</h6>
                                  </div>
                                </div>
                                <div className="card-amount">
                                  <span className="amount">96%</span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                          <Col sm="6">
                            <Card className="card-bordered">
                              <div className="card-inner">
                                <div className="card-title-group">
                                  <div className="card-title">
                                    <h6 className="title">Avg Duration</h6>
                                  </div>
                                </div>
                                <div className="card-amount">
                                  <span className="amount">1.2h</span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                          <Col sm="6">
                            <Card className="card-bordered">
                              <div className="card-inner">
                                <div className="card-title-group">
                                  <div className="card-title">
                                    <h6 className="title">Active Now</h6>
                                  </div>
                                </div>
                                <div className="card-amount">
                                  <span className="amount text-info">
                                    {jobs.filter(j => j.status === 'running').length}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </div>
                </TabPane>
              </TabContent>
            </div>
          </Card>
        </Block>

        {/* Job Logs Modal */}
        <Modal isOpen={jobLogsModal} toggle={() => setJobLogsModal(false)} size="lg">
          <ModalHeader toggle={() => setJobLogsModal(false)}>
            Job Execution Logs
            {selectedJob && (
              <div className="modal-subtitle">
                {selectedJob.patchTitle} ({selectedJob.patchId})
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            <div className="logs-container" style={{ maxHeight: '400px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
              {logs.map((log, index) => (
                <div key={index} className={`log-entry p-2 ${log.level.toLowerCase()}`} style={{ borderLeft: `3px solid ${log.level === 'ERROR' ? '#dc3545' : log.level === 'WARN' ? '#ffc107' : '#28a745'}` }}>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                    <Badge color={log.level === 'ERROR' ? 'danger' : log.level === 'WARN' ? 'warning' : 'info'} size="sm">
                      {log.level}
                    </Badge>
                  </div>
                  <div><strong>{log.component}:</strong> {log.message}</div>
                </div>
              ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setJobLogsModal(false)}>Close</Button>
            <Button color="primary" outline>Download Logs</Button>
          </ModalFooter>
        </Modal>

        {/* Create Job Modal */}
        <Modal isOpen={createJobModal} toggle={() => setCreateJobModal(false)} size="lg">
          <ModalHeader toggle={() => setCreateJobModal(false)}>
            Create New Patch Job
          </ModalHeader>
          <ModalBody>
            <Form>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Patch</Label>
                    <Input type="select">
                      <option>Select a patch...</option>
                      <option>MS-2024-001 - Windows Security Update</option>
                      <option>ADOBE-2024-002 - Adobe Reader Update</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Execution Type</Label>
                    <Input type="select">
                      <option value="immediate">Immediate</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="maintenance_window">Maintenance Window</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Priority (1-5)</Label>
                    <Input type="number" min="1" max="5" defaultValue="3" />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Scheduled Time</Label>
                    <Input type="datetime-local" />
                  </FormGroup>
                </Col>
              </Row>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label>Max Retries</Label>
                    <Input type="number" min="0" max="10" defaultValue="3" />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label>Timeout (minutes)</Label>
                    <Input type="number" min="1" max="1440" defaultValue="60" />
                  </FormGroup>
                </Col>
              </Row>
              <FormGroup>
                <div className="custom-control custom-switch">
                  <input type="checkbox" className="custom-control-input" id="rollbackOnFailure" />
                  <label className="custom-control-label" htmlFor="rollbackOnFailure">
                    Rollback on failure
                  </label>
                </div>
              </FormGroup>
              <FormGroup>
                <div className="custom-control custom-switch">
                  <input type="checkbox" className="custom-control-input" id="requiresApproval" />
                  <label className="custom-control-label" htmlFor="requiresApproval">
                    Requires approval before execution
                  </label>
                </div>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={() => setCreateJobModal(false)}>Cancel</Button>
            <Button color="primary">Create Job</Button>
          </ModalFooter>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default PatchJobs;