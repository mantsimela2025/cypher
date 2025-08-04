import React, { useState, useEffect } from 'react';
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Badge,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from 'reactstrap';
import { toast } from 'react-toastify';
import {
  PreviewCard,
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Row,
  Col,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  Button,
  Icon,
} from "@/components/Component";

const IngestionSimulationPage = () => {
  const [activeJobs, setActiveJobs] = useState([]);
  const [historicalJobs, setHistoricalJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    jobName: '',
    sourceSystem: 'tenable',
    batchType: '',
    dataType: 'vulnerabilities',
    schedule: '',
    status: 'scheduled',
    description: ''
  });

  // Fetch ingestion jobs
  const fetchIngestionJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/ingestion-simulation');
      
      if (!res.ok) {
        // If API endpoint doesn't exist, show empty state instead of error
        if (res.status === 404) {
          setActiveJobs([]);
          setHistoricalJobs([]);
          return;
        }
        throw new Error(`Failed to fetch ingestion jobs: ${res.status}`);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // API returned HTML instead of JSON, likely endpoint doesn't exist
        console.warn('API endpoint returned non-JSON response, using empty data');
        setActiveJobs([]);
        setHistoricalJobs([]);
        return;
      }
      
      const result = await res.json();
      
      // Separate active and historical jobs
      const jobs = result.data || [];
      setActiveJobs(jobs.filter(job => ['scheduled', 'running', 'pending'].includes(job.status)));
      setHistoricalJobs(jobs.filter(job => ['completed', 'failed', 'cancelled'].includes(job.status)));
    } catch (err) {
      console.error('Error fetching ingestion jobs:', err);
      // For development - if API doesn't exist, show empty state instead of error
      if (err.message.includes('Unexpected token') || err.message.includes('not valid JSON')) {
        console.warn('API endpoint not available, using empty data for development');
        setActiveJobs([]);
        setHistoricalJobs([]);
        setError(null);
      } else {
        setError(err.message || 'Error loading ingestion jobs');
      }
    } finally {
      setLoading(false);
    }
  };

  // Create ingestion job
  const createJob = async (jobData) => {
    try {
      const res = await fetch('/api/admin/ingestion-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      if (!res.ok) {
        if (res.status === 404) {
          // API doesn't exist - use mock data for development
          createMockJob(jobData);
          return;
        }
        throw new Error('Failed to create job');
      }
      toast.success('Ingestion job created successfully');
      fetchIngestionJobs();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        // API doesn't exist - use mock data for development
        createMockJob(jobData);
      } else {
        toast.error(err.message || 'Error creating job');
      }
    }
  };

  // Mock job creation for development when API doesn't exist
  const createMockJob = (jobData) => {
    const newJob = {
      id: `job_${Date.now()}`,
      ...jobData,
      status: jobData.status || 'scheduled',
      lastRun: null,
      nextRun: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
      createdAt: new Date().toISOString()
    };

    // Add to appropriate list based on status
    if (['scheduled', 'running', 'pending'].includes(newJob.status)) {
      setActiveJobs(prev => [...prev, newJob]);
    } else {
      setHistoricalJobs(prev => [...prev, newJob]);
    }

    toast.success('Demo job created successfully (using mock data)');
    setModalOpen(false);
    resetForm();
  };

  // Update ingestion job
  const updateJob = async (jobData) => {
    try {
      const res = await fetch(`/api/admin/ingestion-simulation/${jobData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      });
      if (!res.ok) {
        if (res.status === 404) {
          // API doesn't exist - use mock data for development
          updateMockJob(jobData);
          return;
        }
        throw new Error('Failed to update job');
      }
      toast.success('Ingestion job updated successfully');
      fetchIngestionJobs();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        // API doesn't exist - use mock data for development
        updateMockJob(jobData);
      } else {
        toast.error(err.message || 'Error updating job');
      }
    }
  };

  // Mock job update for development when API doesn't exist
  const updateMockJob = (jobData) => {
    const updateJobInList = (jobs, setJobs) => {
      const updatedJobs = jobs.map(job =>
        job.id === jobData.id ? { ...job, ...jobData, updatedAt: new Date().toISOString() } : job
      );
      setJobs(updatedJobs);
      return updatedJobs.some(job => job.id === jobData.id);
    };

    // Try updating in active jobs first
    if (!updateJobInList(activeJobs, setActiveJobs)) {
      // If not found in active, try historical
      updateJobInList(historicalJobs, setHistoricalJobs);
    }

    toast.success('Demo job updated successfully (using mock data)');
    setModalOpen(false);
    resetForm();
  };

  // Delete ingestion job
  const deleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const res = await fetch(`/api/admin/ingestion-simulation/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        if (res.status === 404) {
          // API doesn't exist - use mock data for development
          deleteMockJob(id);
          return;
        }
        throw new Error('Failed to delete job');
      }
      toast.success('Ingestion job deleted successfully');
      fetchIngestionJobs();
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        // API doesn't exist - use mock data for development
        deleteMockJob(id);
      } else {
        toast.error(err.message || 'Error deleting job');
      }
    }
  };

  // Mock job deletion for development when API doesn't exist
  const deleteMockJob = (id) => {
    setActiveJobs(prev => prev.filter(job => job.id !== id));
    setHistoricalJobs(prev => prev.filter(job => job.id !== id));
    toast.success('Demo job deleted successfully (using mock data)');
  };

  // Execute job immediately
  const executeJob = async (id) => {
    try {
      const res = await fetch(`/api/admin/ingestion-simulation/${id}/execute`, {
        method: 'POST',
      });
      if (!res.ok) {
        if (res.status === 404) {
          // API doesn't exist - use mock execution for development
          executeMockJob(id);
          return;
        }
        throw new Error('Failed to execute job');
      }
      toast.success('Job execution started');
      fetchIngestionJobs();
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        // API doesn't exist - use mock execution for development
        executeMockJob(id);
      } else {
        toast.error(err.message || 'Error executing job');
      }
    }
  };

  // Mock job execution for development when API doesn't exist
  const executeMockJob = (id) => {
    // Update job status to running
    setActiveJobs(prev => prev.map(job =>
      job.id === id
        ? { ...job, status: 'running', lastRun: new Date().toISOString() }
        : job
    ));
    
    toast.success('Demo job execution started (using mock data)');
    
    // Simulate completion after 3 seconds
    setTimeout(() => {
      setActiveJobs(prev => prev.map(job =>
        job.id === id
          ? { ...job, status: 'scheduled', nextRun: new Date(Date.now() + 3600000).toISOString() }
          : job
      ));
      toast.info('Demo job execution completed');
    }, 3000);
  };

  // Pause/Resume job
  const toggleJobStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'running' ? 'paused' : 'running';
    try {
      const res = await fetch(`/api/admin/ingestion-simulation/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        if (res.status === 404) {
          // API doesn't exist - use mock status toggle for development
          toggleMockJobStatus(id, newStatus);
          return;
        }
        throw new Error(`Failed to ${newStatus} job`);
      }
      toast.success(`Job ${newStatus} successfully`);
      fetchIngestionJobs();
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        // API doesn't exist - use mock status toggle for development
        toggleMockJobStatus(id, newStatus);
      } else {
        toast.error(err.message || `Error ${newStatus} job`);
      }
    }
  };

  // Mock job status toggle for development when API doesn't exist
  const toggleMockJobStatus = (id, newStatus) => {
    setActiveJobs(prev => prev.map(job =>
      job.id === id ? { ...job, status: newStatus } : job
    ));
    toast.success(`Demo job ${newStatus} successfully (using mock data)`);
  };

  useEffect(() => {
    fetchIngestionJobs();
  }, []);

  const resetForm = () => {
    setFormData({
      jobName: '',
      sourceSystem: 'tenable',
      batchType: '',
      dataType: 'vulnerabilities',
      schedule: '',
      status: 'scheduled',
      description: ''
    });
    setSelectedJob(null);
  };

  const openModalForCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openModalForEdit = (job) => {
    setFormData({
      jobName: job.jobName || job.id,
      sourceSystem: job.sourceSystem,
      batchType: job.batchType,
      dataType: job.dataType || 'vulnerabilities',
      schedule: job.schedule || '',
      status: job.status,
      description: job.description || ''
    });
    setSelectedJob(job);
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedJob) {
      updateJob({ id: selectedJob.id, ...formData });
    } else {
      createJob(formData);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'success';
      case 'scheduled': return 'info';
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'cancelled': return 'secondary';
      case 'paused': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'play-circle';
      case 'scheduled': return 'clock';
      case 'pending': return 'clock';
      case 'completed': return 'check-circle';
      case 'failed': return 'cross-circle';
      case 'cancelled': return 'stop-circle';
      case 'paused': return 'pause-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const renderJobsTable = (jobs, isHistorical = false) => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading ingestion jobs...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-4">
          <span className="text-danger">Error: {error}</span>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <div className="text-center py-5">
          <Icon name={isHistorical ? 'clock' : 'server'} className="text-muted" style={{ fontSize: '3rem' }}></Icon>
          <h6 className="text-muted mt-3">No {isHistorical ? 'historical' : 'active'} jobs found</h6>
          <p className="text-soft">
            {isHistorical
              ? 'Completed and failed jobs will appear here'
              : 'Create your first ingestion job to get started'
            }
          </p>
          {!isHistorical && (
            <Button color="primary" onClick={openModalForCreate} className="mt-3">
              <Icon name="plus"></Icon>
              <span>Create Job</span>
            </Button>
          )}
        </div>
      );
    }

    return (
      <DataTable className="card-stretch">
        <DataTableBody>
          <DataTableHead className="nk-tb-head">
            <DataTableRow size="lg">
              <span className="sub-text">Job Name</span>
            </DataTableRow>
            <DataTableRow size="md">
              <span className="sub-text">Source System</span>
            </DataTableRow>
            <DataTableRow size="sm">
              <span className="sub-text">Data Type</span>
            </DataTableRow>
            <DataTableRow size="sm">
              <span className="sub-text">Status</span>
            </DataTableRow>
            <DataTableRow size="md">
              <span className="sub-text">{isHistorical ? 'Completed' : 'Last Run'}</span>
            </DataTableRow>
            <DataTableRow size="md">
              <span className="sub-text">{isHistorical ? 'Duration' : 'Next Run'}</span>
            </DataTableRow>
            <DataTableRow className="nk-tb-col-tools text-end" size="sm">
              <span className="sub-text">Actions</span>
            </DataTableRow>
          </DataTableHead>
          {jobs.map((job) => (
            <DataTableItem key={job.id}>
              <DataTableRow>
                <div className="user-card">
                  <div className="user-name">
                    <span className="tb-lead">{job.jobName || job.id}</span>
                    {job.description && <span className="tb-sub">{job.description}</span>}
                  </div>
                </div>
              </DataTableRow>
              <DataTableRow size="md">
                <span className="text-capitalize">{job.sourceSystem}</span>
              </DataTableRow>
              <DataTableRow size="md">
                <span>{job.dataType || job.batchType}</span>
              </DataTableRow>
              <DataTableRow size="sm">
                <Badge
                  className="badge-dot"
                  color={getStatusColor(job.status)}
                >
                  <Icon name={getStatusIcon(job.status)} className="me-1"></Icon>
                  {job.status || 'scheduled'}
                </Badge>
              </DataTableRow>
              <DataTableRow>
                <span>{formatDate(job.lastRun || job.lastScanDate)}</span>
              </DataTableRow>
              <DataTableRow>
                <span>{isHistorical ? (job.duration || '-') : formatDate(job.nextRun)}</span>
              </DataTableRow>
              <DataTableRow className="nk-tb-col-tools">
                <ul className="nk-tb-actions gx-1">
                  <li>
                    <UncontrolledDropdown>
                      <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                        <Icon name="more-h"></Icon>
                      </DropdownToggle>
                      <DropdownMenu end>
                        <ul className="link-list-opt no-bdr">
                          {!isHistorical && (
                            <>
                              <li>
                                <DropdownItem
                                  tag="a"
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    executeJob(job.id);
                                  }}
                                >
                                  <Icon name="play"></Icon>
                                  <span>Execute Now</span>
                                </DropdownItem>
                              </li>
                              {job.status === 'running' ? (
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleJobStatus(job.id, job.status);
                                    }}
                                  >
                                    <Icon name="pause"></Icon>
                                    <span>Pause Job</span>
                                  </DropdownItem>
                                </li>
                              ) : job.status === 'paused' && (
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      toggleJobStatus(job.id, job.status);
                                    }}
                                  >
                                    <Icon name="play"></Icon>
                                    <span>Resume Job</span>
                                  </DropdownItem>
                                </li>
                              )}
                            </>
                          )}
                          <li>
                            <DropdownItem
                              tag="a"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openModalForEdit(job);
                              }}
                            >
                              <Icon name="edit"></Icon>
                              <span>Edit Job</span>
                            </DropdownItem>
                          </li>
                          <li>
                            <DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}>
                              <Icon name="eye"></Icon>
                              <span>View Logs</span>
                            </DropdownItem>
                          </li>
                          <li>
                            <DropdownItem tag="a" href="#" onClick={(e) => e.preventDefault()}>
                              <Icon name="activity"></Icon>
                              <span>View Details</span>
                            </DropdownItem>
                          </li>
                          <li className="divider"></li>
                          <li>
                            <DropdownItem
                              tag="a"
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                deleteJob(job.id);
                              }}
                              className="text-danger"
                            >
                              <Icon name="trash"></Icon>
                              <span>Delete Job</span>
                            </DropdownItem>
                          </li>
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
    );
  };

  return (
    <>
      <Head title="Ingestion Jobs Management" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Ingestion Jobs</BlockTitle>
              <BlockDes className="text-soft">
                Manage active and historical data ingestion jobs
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <Button color="primary" onClick={openModalForCreate}>
                <Icon name="plus"></Icon>
                <span>Create Job</span>
              </Button>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <PreviewCard>
            <div className="card-inner">
              <Nav tabs className="nav-tabs-mb-icon nav-tabs-card">
                <NavItem>
                  <NavLink
                    className={activeTab === 'active' ? 'active' : ''}
                    onClick={() => setActiveTab('active')}
                    href="#"
                  >
                    <Icon name="server"></Icon>
                    <span>Active Jobs ({activeJobs.length})</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === 'historical' ? 'active' : ''}
                    onClick={() => setActiveTab('historical')}
                    href="#"
                  >
                    <Icon name="clock"></Icon>
                    <span>Historical Jobs ({historicalJobs.length})</span>
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={activeTab === 'guide' ? 'active' : ''}
                    onClick={() => setActiveTab('guide')}
                    href="#"
                  >
                    <Icon name="book"></Icon>
                    <span>Guide</span>
                  </NavLink>
                </NavItem>
              </Nav>
            </div>
            
            <TabContent activeTab={activeTab}>
              <TabPane tabId="active">
                {renderJobsTable(activeJobs, false)}
              </TabPane>
              <TabPane tabId="historical">
                {renderJobsTable(historicalJobs, true)}
              </TabPane>
              <TabPane tabId="guide">
                <div className="card-inner">
                  <div className="nk-block">
                    <div className="nk-block-head">
                      <h5 className="nk-block-title">Data Ingestion Engine Guide</h5>
                      <p className="nk-block-des">Learn how our data ingestion system works and how to manage ingestion jobs effectively.</p>
                    </div>
                    
                    <Row className="g-4">
                      <Col md="12">
                        <div className="card">
                          <div className="card-inner">
                            <h6 className="card-title">
                              <Icon name="info" className="me-2"></Icon>
                              Overview
                            </h6>
                            <p>
                              Our Data Ingestion Engine is designed to automatically collect, process, and integrate security data from various external systems into our centralized platform. The engine supports both scheduled and on-demand ingestion jobs for continuous data synchronization.
                            </p>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="card">
                          <div className="card-inner">
                            <h6 className="card-title">
                              <Icon name="server" className="me-2"></Icon>
                              Supported Source Systems
                            </h6>
                            <ul className="list-group list-group-flush">
                              <li className="list-group-item d-flex align-items-center">
                                <Badge color="primary" className="me-2">Tenable</Badge>
                                Vulnerability Management Platform
                              </li>
                              <li className="list-group-item d-flex align-items-center">
                                <Badge color="info" className="me-2">Xacta</Badge>
                                Governance, Risk & Compliance
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="card">
                          <div className="card-inner">
                            <h6 className="card-title">
                              <Icon name="database" className="me-2"></Icon>
                              Data Types
                            </h6>
                            <ul className="list-group list-group-flush">
                              <li className="list-group-item">
                                <strong>Vulnerabilities:</strong> Security vulnerabilities and findings
                              </li>
                              <li className="list-group-item">
                                <strong>Assets:</strong> IT infrastructure and device inventory
                              </li>
                              <li className="list-group-item">
                                <strong>Compliance:</strong> Regulatory compliance status
                              </li>
                              <li className="list-group-item">
                                <strong>Scans:</strong> Security scan results and reports
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md="12">
                        <div className="card">
                          <div className="card-inner">
                            <h6 className="card-title">
                              <Icon name="clock" className="me-2"></Icon>
                              Job Scheduling
                            </h6>
                            <p>Ingestion jobs support flexible scheduling using cron expressions:</p>
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead>
                                  <tr>
                                    <th>Schedule</th>
                                    <th>Cron Expression</th>
                                    <th>Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td>Every Hour</td>
                                    <td><code>0 0 * * * *</code></td>
                                    <td>Runs at the beginning of every hour</td>
                                  </tr>
                                  <tr>
                                    <td>Every 6 Hours</td>
                                    <td><code>0 0 */6 * * *</code></td>
                                    <td>Runs every 6 hours (4 times daily)</td>
                                  </tr>
                                  <tr>
                                    <td>Daily at Midnight</td>
                                    <td><code>0 0 0 * * *</code></td>
                                    <td>Runs once daily at midnight</td>
                                  </tr>
                                  <tr>
                                    <td>Weekly</td>
                                    <td><code>0 0 0 * * 0</code></td>
                                    <td>Runs every Sunday at midnight</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="card">
                          <div className="card-inner">
                            <h6 className="card-title">
                              <Icon name="activity" className="me-2"></Icon>
                              Job Status Overview
                            </h6>
                            <ul className="list-group list-group-flush">
                              <li className="list-group-item d-flex align-items-center">
                                <Badge color="info" className="badge-dot me-2">
                                  <Icon name="clock" className="me-1"></Icon>
                                  Scheduled
                                </Badge>
                                Job is scheduled and waiting for next execution
                              </li>
                              <li className="list-group-item d-flex align-items-center">
                                <Badge color="success" className="badge-dot me-2">
                                  <Icon name="play-circle" className="me-1"></Icon>
                                  Running
                                </Badge>
                                Job is currently executing
                              </li>
                              <li className="list-group-item d-flex align-items-center">
                                <Badge color="warning" className="badge-dot me-2">
                                  <Icon name="pause-circle" className="me-1"></Icon>
                                  Paused
                                </Badge>
                                Job execution is temporarily paused
                              </li>
                              <li className="list-group-item d-flex align-items-center">
                                <Badge color="success" className="badge-dot me-2">
                                  <Icon name="check-circle" className="me-1"></Icon>
                                  Completed
                                </Badge>
                                Job finished successfully
                              </li>
                              <li className="list-group-item d-flex align-items-center">
                                <Badge color="danger" className="badge-dot me-2">
                                  <Icon name="cross-circle" className="me-1"></Icon>
                                  Failed
                                </Badge>
                                Job encountered errors during execution
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md="6">
                        <div className="card">
                          <div className="card-inner">
                            <h6 className="card-title">
                              <Icon name="settings" className="me-2"></Icon>
                              Best Practices
                            </h6>
                            <ul className="list-group list-group-flush">
                              <li className="list-group-item">
                                <strong>Batch Types:</strong> Use "full-sync" for complete data refresh, "incremental" for updates only
                              </li>
                              <li className="list-group-item">
                                <strong>Scheduling:</strong> Avoid overlapping jobs by setting appropriate intervals
                              </li>
                              <li className="list-group-item">
                                <strong>Monitoring:</strong> Regularly check job logs and execution status
                              </li>
                              <li className="list-group-item">
                                <strong>Naming:</strong> Use descriptive job names for easy identification
                              </li>
                            </ul>
                          </div>
                        </div>
                      </Col>
                      
                      <Col md="12">
                        <div className="card">
                          <div className="card-inner">
                            <h6 className="card-title">
                              <Icon name="help" className="me-2"></Icon>
                              Troubleshooting
                            </h6>
                            <div className="accordion" id="troubleshootingAccordion">
                              <div className="accordion-item">
                                <h2 className="accordion-header">
                                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                                    Job fails to connect to source system
                                  </button>
                                </h2>
                                <div id="collapseOne" className="accordion-collapse collapse" data-bs-parent="#troubleshootingAccordion">
                                  <div className="accordion-body">
                                    Check network connectivity, verify API credentials, and ensure the source system is accessible. Review the job logs for specific error messages.
                                  </div>
                                </div>
                              </div>
                              <div className="accordion-item">
                                <h2 className="accordion-header">
                                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
                                    Job runs but no data is ingested
                                  </button>
                                </h2>
                                <div id="collapseTwo" className="accordion-collapse collapse" data-bs-parent="#troubleshootingAccordion">
                                  <div className="accordion-body">
                                    Verify the data filters and query parameters. Check if the source system has new data available for the specified time range.
                                  </div>
                                </div>
                              </div>
                              <div className="accordion-item">
                                <h2 className="accordion-header">
                                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
                                    Job execution takes too long
                                  </button>
                                </h2>
                                <div id="collapseThree" className="accordion-collapse collapse" data-bs-parent="#troubleshootingAccordion">
                                  <div className="accordion-body">
                                    Consider using incremental sync instead of full sync, optimize data filters, or increase the job execution timeout in the configuration.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              </TabPane>
            </TabContent>
          </PreviewCard>
        </Block>

        {/* Create/Edit Job Modal */}
        <Modal
          isOpen={modalOpen}
          toggle={() => setModalOpen(!modalOpen)}
          size="lg"
        >
          <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
            {selectedJob ? 'Edit Ingestion Job' : 'Create Ingestion Job'}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              <Row className="gy-4">
                <Col md="6">
                  <FormGroup>
                    <Label for="jobName">Job Name</Label>
                    <Input
                      type="text"
                      name="jobName"
                      id="jobName"
                      value={formData.jobName}
                      onChange={handleFormChange}
                      placeholder="Enter job name"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="sourceSystem">Source System</Label>
                    <Input
                      type="select"
                      name="sourceSystem"
                      id="sourceSystem"
                      value={formData.sourceSystem}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="tenable">Tenable</option>
                      <option value="xacta">Xacta</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="dataType">Data Type</Label>
                    <Input
                      type="select"
                      name="dataType"
                      id="dataType"
                      value={formData.dataType}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="vulnerabilities">Vulnerabilities</option>
                      <option value="assets">Assets</option>
                      <option value="compliance">Compliance</option>
                      <option value="scans">Scans</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="batchType">Batch Type</Label>
                    <Input
                      type="text"
                      name="batchType"
                      id="batchType"
                      value={formData.batchType}
                      onChange={handleFormChange}
                      placeholder="e.g., full-sync, incremental"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="schedule">Schedule (Cron)</Label>
                    <Input
                      type="text"
                      name="schedule"
                      id="schedule"
                      value={formData.schedule}
                      onChange={handleFormChange}
                      placeholder="0 0 */6 * * * (every 6 hours)"
                    />
                    <small className="form-text text-muted">Leave empty for manual execution</small>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="status">Status</Label>
                    <Input
                      type="select"
                      name="status"
                      id="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      required
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="paused">Paused</option>
                      <option value="disabled">Disabled</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="12">
                  <FormGroup>
                    <Label for="description">Description</Label>
                    <Input
                      type="textarea"
                      name="description"
                      id="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows="3"
                      placeholder="Optional description of this job"
                    />
                  </FormGroup>
                </Col>
              </Row>
            </ModalBody>
            <ModalFooter>
              <Button color="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                {selectedJob ? 'Update Job' : 'Create Job'}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Content>
    </>
  );
};

export default IngestionSimulationPage;