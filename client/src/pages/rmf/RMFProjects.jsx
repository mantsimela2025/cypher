 import React, { useState, useEffect } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import { findUpper } from "@/utils/Utils";
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
  UserAvatar,
  PaginationComponent,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  Button,
  RSelect,
  TooltipComponent,
  PreviewAltCard,
} from "@/components/Component";
import { Link, useNavigate } from "react-router-dom";
import { bulkActionOptions } from "@/utils/Utils";
import { rmfProjectsApi } from "@/utils/rmfApi";
import { toast } from "react-toastify";

const RMFProjects = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sm, updateSm] = useState(false);

  // Panel states
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  
  // Table states
  const [tablesm, updateTableSm] = useState(false);
  const [onSearch, setonSearch] = useState(true);
  const [onSearchText, setSearchText] = useState("");
  const [actionText, setActionText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [sort, setSortState] = useState("");
  const [totalProjects, setTotalProjects] = useState(0);

  // Filter states
  const [selectedStep, setSelectedStep] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedImpact, setSelectedImpact] = useState(null);

  // View state (table or card) - persistent in localStorage
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('rmfProjectsViewMode') || 'table';
  });

  // Filter options
  const filterStep = [
    { value: "", label: "Any Step" },
    { value: "CATEGORIZE", label: "Categorize" },
    { value: "SELECT", label: "Select" },
    { value: "IMPLEMENT", label: "Implement" },
    { value: "ASSESS", label: "Assess" },
    { value: "AUTHORIZE", label: "Authorize" },
    { value: "MONITOR", label: "Monitor" },
  ];

  const filterStatus = [
    { value: "", label: "Any Status" },
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "overdue", label: "Overdue" },
  ];

  const filterImpact = [
    { value: "", label: "Any Impact Level" },
    { value: "high", label: "High Impact" },
    { value: "moderate", label: "Moderate Impact" },
    { value: "low", label: "Low Impact" },
  ];

  // Helper functions for data transformation
  const getStepProgress = (step) => {
    const stepMap = {
      'categorize': 16.67,
      'select': 33.33,
      'implement': 50.0,
      'assess': 66.67,
      'authorize': 83.33,
      'monitor': 100.0
    };
    return stepMap[step?.toLowerCase()] || 0;
  };

  const getProjectAvatarColor = (step) => {
    const colorMap = {
      'categorize': 'primary',
      'select': 'info',
      'implement': 'warning',
      'assess': 'purple',
      'authorize': 'danger',
      'monitor': 'success'
    };
    return colorMap[step?.toLowerCase()] || 'secondary';
  };

  // Load RMF projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        console.log('🔄 Fetching RMF projects from API...');
        setError(null);

        try {
          // Call the real API
          const result = await rmfProjectsApi.getProjects({
            page: currentPage,
            limit: itemPerPage,
            sortBy: 'created_at',
            sortOrder: 'desc'
          });

          console.log('📡 API Response:', result);

          if (result.success && result.data) {
            console.log('✅ Projects loaded successfully:', result.data);

            // Transform API data to match component expectations
            const projects = result.data.data || result.data || [];
            const transformedProjects = projects.map(project => ({
              id: project.id,
              name: project.title || project.name || 'Untitled Project',
              description: project.description || 'No description provided',
              currentStep: (project.current_step || 'categorize').toUpperCase(),
              status: project.status || 'active',
              progress: getStepProgress(project.current_step || 'categorize'),
              dueDate: project.target_authorization_date || project.due_date || null,
              assignedTo: project.assigned_to || 'Unassigned',
              systemType: project.environment || 'Not specified',
              lastUpdated: project.updated_at ? new Date(project.updated_at).toISOString().split('T')[0] : null,
              createdAt: project.created_at ? new Date(project.created_at).toISOString().split('T')[0] : null,
              avatarBg: getProjectAvatarColor(project.current_step || 'categorize'),
              checked: false,
            }));

            console.log('🔄 Transformed projects:', transformedProjects);

            setData(transformedProjects);
            setTotalProjects(result.data.pagination?.total || transformedProjects.length);

          } else {
            console.warn('⚠️ API returned unsuccessful response:', result);
            throw new Error(result.message || 'Failed to load projects');
          }

        } catch (apiError) {
          console.error('❌ API Error:', apiError);

          // Fallback to a few mock projects so page isn't completely empty
          console.log('🔄 Using fallback mock data due to API error');
          const fallbackProjects = [
            {
              id: 'mock-1',
              name: "Sample RMF Project",
              description: "This is sample data - API connection failed",
              currentStep: "CATEGORIZE",
              status: "active",
              progress: 16.67,
              dueDate: null,
              assignedTo: "Unassigned",
              systemType: "Sample",
              lastUpdated: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString().split('T')[0],
              avatarBg: "warning",
              checked: false,
            }
          ];

          setData(fallbackProjects);
          setTotalProjects(fallbackProjects.length);
          setError(`API Error: ${apiError.message}. Showing sample data.`);
        }



      } catch (error) {
        console.error('❌ Error fetching RMF projects:', error);
        setError(error.message || 'Failed to load projects');
        toast.error('Failed to load RMF projects');
        setData([]);
        setTotalProjects(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [currentPage, itemPerPage, selectedStep, selectedStatus, selectedImpact]);

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

  // Get impact badge color
  const getImpactBadgeColor = (impact) => {
    const colorMap = {
      "High Impact": "danger",
      "Moderate Impact": "warning",
      "Low Impact": "success",
    };
    return colorMap[impact] || "secondary";
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
  const isOverdue = (dueDate, status) => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  // Handle opening edit panel
  const handleEditProject = (projectId) => {
    setSelectedProjectId(projectId);
    setEditPanelOpen(true);
  };

  // Handle closing edit panel
  const handleCloseEditPanel = () => {
    setEditPanelOpen(false);
    setSelectedProjectId(null);
  };

  // Handle opening add panel
  const handleOpenAddPanel = () => {
    navigate('/rmf/projects/new');
  };

  // Handle closing add panel
  const handleCloseAddPanel = () => {
    setAddPanelOpen(false);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rmfProjectsViewMode', mode);
  };

  // Handle filter changes
  const handleStepFilterChange = (selectedOption) => {
    setSelectedStep(selectedOption);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (selectedOption) => {
    setSelectedStatus(selectedOption);
    setCurrentPage(1);
  };

  const handleImpactFilterChange = (selectedOption) => {
    setSelectedImpact(selectedOption);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedStep(null);
    setSelectedStatus(null);
    setSelectedImpact(null);
    setSearchText("");
    setCurrentPage(1);
  };

  // Search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        // Refetch with search term
      } else {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [onSearchText]);

  // onChange function for searching
  const onFilterChange = (e) => {
    setSearchText(e.target.value);
  };

  // Render card view
  const renderCardView = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading projects...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-4">
          <span className="text-silent">No projects found</span>
        </div>
      );
    }

    return (
      <Row className="g-gs">
        {data.map((item) => (
          <Col sm="6" lg="4" xxl="3" key={item.id}>
            <PreviewAltCard className="card-bordered">
              <div className="project">
                <div className="project-head">
                  <a href="#" className="project-title">
                    <Icon name="grid-fill" className="text-primary"></Icon>
                    <span>{item.name}</span>
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
                              handleEditProject(item.id);
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
                            href="#workflow"
                            onClick={(ev) => {
                              ev.preventDefault();
                            }}
                          >
                            <Icon name="flow"></Icon>
                            <span>RMF Workflow</span>
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
                  <p>{item.description}</p>
                </div>
                <div className="project-meta">
                  <ul className="project-users g-1">
                    <li>
                      <span className={`badge badge-dim bg-${getStepBadgeColor(item.currentStep)}`}>
                        {item.currentStep}
                      </span>
                    </li>
                    <li>
                      <span className={`badge badge-dim bg-${getImpactBadgeColor(item.systemType)}`}>
                        {item.systemType}
                      </span>
                    </li>
                    <li>
                      <span className={`badge badge-dim bg-${getStatusBadgeColor(item.status)}`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="project-meta">
                  <span className="text-soft">{formatDate(item.lastUpdated)} by {item.assignedTo}</span>
                </div>
                <div className="project-progress">
                  <div className="progress-wrap">
                    <div className="progress-text">
                      <div className="progress-label">Progress</div>
                      <div className="progress-amount">{item.progress.toFixed(1)}%</div>
                    </div>
                    <div className="progress progress-md">
                      <div 
                        className={`progress-bar bg-${item.progress < 30 ? 'danger' : item.progress < 70 ? 'warning' : 'success'}`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="project-meta">
                  <span className={`text-${isOverdue(item.dueDate, item.status) ? 'danger' : 'soft'}`}>
                    Due: {formatDate(item.dueDate)}
                    {isOverdue(item.dueDate, item.status) && <Icon name="alert-circle" className="ms-1 text-danger"></Icon>}
                  </span>
                </div>
              </div>
            </PreviewAltCard>
          </Col>
        ))}
      </Row>
    );
  };

  // Table selection functions
  const onSelectChange = (e, id) => {
    let newData = data;
    let index = newData.findIndex((item) => item.id === id);
    newData[index].checked = e.currentTarget.checked;
    setData([...newData]);
  };

  const onActionText = (e) => {
    setActionText(e.value);
  };

  const selectorCheck = (e) => {
    let newData;
    newData = data.map((item) => {
      item.checked = e.currentTarget.checked;
      return item;
    });
    setData([...newData]);
  };

  const toggle = () => setonSearch(!onSearch);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (error) {
    return (
      <React.Fragment>
        <Head title="RMF Projects"></Head>
        <Content>
          <Block>
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
            </div>
          </Block>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="RMF Projects"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                RMF Projects
                <div className="ms-3 d-inline-block">
                  <ul className="btn-toolbar gx-1 d-inline-flex">
                    <li>
                      <Button
                        id="table-view-btn-title"
                        className={`btn-icon btn-trigger btn-sm ${viewMode === 'table' ? 'active' : ''}`}
                        color="light"
                        onClick={() => handleViewModeChange('table')}
                      >
                        <Icon name="view-list-wd"></Icon>
                      </Button>
                      <UncontrolledTooltip placement="top" target="table-view-btn-title">
                        Table View
                      </UncontrolledTooltip>
                    </li>
                    <li>
                      <Button
                        id="card-view-btn-title"
                        className={`btn-icon btn-trigger btn-sm ${viewMode === 'card' ? 'active' : ''}`}
                        color="light"
                        onClick={() => handleViewModeChange('card')}
                      >
                        <Icon name="view-grid-wd"></Icon>
                      </Button>
                      <UncontrolledTooltip placement="top" target="card-view-btn-title">
                        Card View
                      </UncontrolledTooltip>
                    </li>
                  </ul>
                </div>
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>
                  Manage all RMF implementation projects. Total projects: {totalProjects}
                  <span className="ms-2">
                    <Icon name={viewMode === 'table' ? 'view-list-wd' : 'view-grid-wd'} className="me-1"></Icon>
                    {viewMode === 'table' ? 'Table View' : 'Card View'}
                  </span>
                  {(selectedStep || selectedStatus || selectedImpact) && (
                    <span className="ms-2">
                      <Icon name="filter-alt" className="me-1"></Icon>
                      Filtered
                      {selectedStep && <span className="badge badge-dim bg-primary ms-1">Step: {selectedStep.label}</span>}
                      {selectedStatus && <span className="badge badge-dim bg-warning ms-1">Status: {selectedStatus.label}</span>}
                      {selectedImpact && <span className="badge badge-dim bg-info ms-1">Impact: {selectedImpact.label}</span>}
                    </span>
                  )}
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
                      <ul className="btn-toolbar gx-1">
                        <li>
                          <Button
                            id="table-view-btn-header"
                            className={`btn-icon btn-trigger ${viewMode === 'table' ? 'active' : ''}`}
                            color="light"
                            onClick={() => handleViewModeChange('table')}
                          >
                            <Icon name="view-list-wd"></Icon>
                          </Button>
                          <UncontrolledTooltip placement="top" target="table-view-btn-header">
                            Table View
                          </UncontrolledTooltip>
                        </li>
                        <li>
                          <Button
                            id="card-view-btn-header"
                            className={`btn-icon btn-trigger ${viewMode === 'card' ? 'active' : ''}`}
                            color="light"
                            onClick={() => handleViewModeChange('card')}
                          >
                            <Icon name="view-grid-wd"></Icon>
                          </Button>
                          <UncontrolledTooltip placement="top" target="card-view-btn-header">
                            Card View
                          </UncontrolledTooltip>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <a
                        href="#export"
                        onClick={(ev) => {
                          ev.preventDefault();
                        }}
                        className="btn btn-white btn-outline-light"
                      >
                        <Icon name="download-cloud"></Icon>
                        <span>Export</span>
                      </a>
                    </li>
                    <li className="nk-block-tools-opt">
                      <Button 
                        color="primary" 
                        className="btn-icon"
                        onClick={handleOpenAddPanel}
                      >
                        <Icon name="plus"></Icon>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          {viewMode === 'table' ? (
          <DataTable className="card-stretch">
            <div className="card-inner position-relative card-tools-toggle">
              <div className="card-title-group">
                <div className="card-tools">
                  <div className="form-inline flex-nowrap gx-3">
                    <div className="form-wrap">
                      <RSelect
                        options={bulkActionOptions}
                        className="w-130px"
                        placeholder="Bulk Action"
                        onChange={(e) => onActionText(e)}
                      />
                    </div>
                    <div className="btn-wrap">
                      <span className="d-none d-md-block">
                        <Button
                          disabled={actionText !== "" ? false : true}
                          color="light"
                          outline
                          className="btn-dim"
                        >
                          Apply
                        </Button>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="card-tools me-n1">
                <ul className="btn-toolbar gx-1">
                  <li>
                    <Button
                      id="table-view-btn"
                      className={`btn-icon btn-trigger ${viewMode === 'table' ? 'active' : ''}`}
                      color="light"
                      onClick={() => handleViewModeChange('table')}
                    >
                      <Icon name="view-list-wd"></Icon>
                    </Button>
                    <UncontrolledTooltip placement="top" target="table-view-btn">
                      Table View
                    </UncontrolledTooltip>
                  </li>
                  <li>
                    <Button
                      id="card-view-btn"
                      className={`btn-icon btn-trigger ${viewMode === 'card' ? 'active' : ''}`}
                      color="light"
                      onClick={() => handleViewModeChange('card')}
                    >
                      <Icon name="view-grid-wd"></Icon>
                    </Button>
                    <UncontrolledTooltip placement="top" target="card-view-btn">
                      Card View
                    </UncontrolledTooltip>
                  </li>
                  <li className="btn-toolbar-sep"></li>
                  <li>
                    <a
                      href="#search"
                      onClick={(ev) => {
                        ev.preventDefault();
                        toggle();
                      }}
                      className="btn btn-icon search-toggle toggle-search"
                    >
                      <Icon name="search"></Icon>
                    </a>
                  </li>
                  <li className="btn-toolbar-sep"></li>
                  <li>
                    <div className="toggle-wrap">
                      <Button
                        className={`btn-icon btn-trigger toggle ${tablesm ? "active" : ""}`}
                        onClick={() => updateTableSm(true)}
                      >
                        <Icon name="menu-right"></Icon>
                      </Button>
                      <div className={`toggle-content ${tablesm ? "content-active" : ""}`}>
                        <ul className="btn-toolbar gx-1">
                          <li className="toggle-close">
                            <Button className="btn-icon btn-trigger toggle" onClick={() => updateTableSm(false)}>
                              <Icon name="arrow-left"></Icon>
                            </Button>
                          </li>
                          <li>
                            <UncontrolledDropdown>
                              <DropdownToggle tag="a" className="btn btn-trigger btn-icon dropdown-toggle">
                                {(selectedStep || selectedStatus || selectedImpact) && <div className="dot dot-primary"></div>}
                                <Icon name="filter-alt"></Icon>
                              </DropdownToggle>
                              <DropdownMenu
                                end
                                className="filter-wg dropdown-menu-xl"
                                style={{ overflow: "visible" }}
                              >
                                <div className="dropdown-head">
                                  <span className="sub-title dropdown-title">Filter Projects</span>
                                  <div className="dropdown-tools">
                                    <Button
                                      size="sm"
                                      color="light"
                                      onClick={clearFilters}
                                      className="btn-dim"
                                    >
                                      Clear
                                    </Button>
                                  </div>
                                </div>
                                <div className="dropdown-body dropdown-body-rg">
                                  <Row className="gx-6 gy-3">
                                    <Col size="4">
                                      <div className="form-group">
                                        <label className="overline-title overline-title-alt">Current Step</label>
                                        <RSelect
                                          options={filterStep}
                                          placeholder="Any Step"
                                          value={selectedStep}
                                          onChange={handleStepFilterChange}
                                          isClearable
                                        />
                                      </div>
                                    </Col>
                                    <Col size="4">
                                      <div className="form-group">
                                        <label className="overline-title overline-title-alt">Status</label>
                                        <RSelect
                                          options={filterStatus}
                                          placeholder="Any Status"
                                          value={selectedStatus}
                                          onChange={handleStatusFilterChange}
                                          isClearable
                                        />
                                      </div>
                                    </Col>
                                    <Col size="4">
                                      <div className="form-group">
                                        <label className="overline-title overline-title-alt">Impact Level</label>
                                        <RSelect
                                          options={filterImpact}
                                          placeholder="Any Impact"
                                          value={selectedImpact}
                                          onChange={handleImpactFilterChange}
                                          isClearable
                                        />
                                      </div>
                                    </Col>
                                  </Row>
                                </div>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </li>
                          <li>
                            <UncontrolledDropdown>
                              <DropdownToggle tag="a" className="btn btn-trigger btn-icon dropdown-toggle">
                                <Icon name="setting"></Icon>
                              </DropdownToggle>
                              <DropdownMenu end className="dropdown-menu-xs">
                                <ul className="link-check">
                                  <li><span>Show</span></li>
                                  <li className={itemPerPage === 10 ? "active" : ""}>
                                    <DropdownItem
                                      tag="a"
                                      href="#dropdownitem"
                                      onClick={(ev) => {
                                        ev.preventDefault();
                                        setItemPerPage(10);
                                      }}
                                    >
                                      10
                                    </DropdownItem>
                                  </li>
                                  <li className={itemPerPage === 25 ? "active" : ""}>
                                    <DropdownItem
                                      tag="a"
                                      href="#dropdownitem"
                                      onClick={(ev) => {
                                        ev.preventDefault();
                                        setItemPerPage(25);
                                      }}
                                    >
                                      25
                                    </DropdownItem>
                                  </li>
                                </ul>
                              </DropdownMenu>
                            </UncontrolledDropdown>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className={`card-search search-wrap ${!onSearch && "active"}`}>
              <div className="card-body">
                <div className="search-content">
                  <Button
                    className="search-back btn-icon toggle-search active"
                    onClick={() => {
                      setSearchText("");
                      toggle();
                    }}
                  >
                    <Icon name="arrow-left"></Icon>
                  </Button>
                  <input
                    type="text"
                    className="border-transparent form-focus-none form-control"
                    placeholder="Search by project name or description"
                    value={onSearchText}
                    onChange={(e) => onFilterChange(e)}
                  />
                  <Button className="search-submit btn-icon">
                    <Icon name="search"></Icon>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DataTableBody compact>
            <DataTableHead>
              <DataTableRow className="nk-tb-col-check">
                <div className="custom-control custom-control-sm custom-checkbox notext">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    onChange={(e) => selectorCheck(e)}
                    id="uid"
                  />
                  <label className="custom-control-label" htmlFor="uid"></label>
                </div>
              </DataTableRow>
              <DataTableRow>
                <span className="sub-text">Project</span>
              </DataTableRow>
              <DataTableRow size="md">
                <span className="sub-text">Current Step</span>
              </DataTableRow>
              <DataTableRow size="md">
                <span className="sub-text">Status</span>
              </DataTableRow>
              <DataTableRow size="md">
                <span className="sub-text">Impact Level</span>
              </DataTableRow>
              <DataTableRow size="sm">
                <span className="sub-text">Progress</span>
              </DataTableRow>
              <DataTableRow size="lg">
                <span className="sub-text">Due Date</span>
              </DataTableRow>
              <DataTableRow size="lg">
                <span className="sub-text">Assigned To</span>
              </DataTableRow>
              <DataTableRow className="nk-tb-col-tools text-end">
                <span className="sub-text">Actions</span>
              </DataTableRow>
            </DataTableHead>
            {loading ? (
              <DataTableItem>
                <DataTableRow colSpan="9">
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="sr-only">Loading...</span>
                    </div>
                    <p className="mt-2">Loading projects...</p>
                  </div>
                </DataTableRow>
              </DataTableItem>
            ) : data.length > 0 ? (
              data.map((item) => {
                return (
                  <DataTableItem key={item.id}>
                    <DataTableRow className="nk-tb-col-check">
                      <div className="custom-control custom-control-sm custom-checkbox notext">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          defaultChecked={item.checked}
                          id={item.id + "uid1"}
                          key={Math.random()}
                          onChange={(e) => onSelectChange(e, item.id)}
                        />
                        <label className="custom-control-label" htmlFor={item.id + "uid1"}></label>
                      </div>
                    </DataTableRow>
                    <DataTableRow>
                      <div className="user-card">
                        <UserAvatar
                          theme={item.avatarBg}
                          className="xs"
                          text={findUpper(item.name)}
                        ></UserAvatar>
                        <div className="user-name">
                          <span className="tb-lead">{item.name}</span>
                          <div className="text-soft tb-sub">{item.description}</div>
                        </div>
                      </div>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className={`badge badge-dim bg-${getStepBadgeColor(item.currentStep)}`}>
                        {item.currentStep}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span
                        className={`tb-status text-${getStatusBadgeColor(item.status)}`}
                      >
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className={`badge badge-dim bg-${getImpactBadgeColor(item.systemType)}`}>
                        {item.systemType}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="sm">
                      <div className="progress-wrap">
                        <div className="progress progress-sm">
                          <div 
                            className={`progress-bar bg-${item.progress < 30 ? 'danger' : item.progress < 70 ? 'warning' : 'success'}`}
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <div className="progress-amount">{item.progress.toFixed(1)}%</div>
                      </div>
                    </DataTableRow>
                    <DataTableRow size="lg">
                      <span className={`${isOverdue(item.dueDate, item.status) ? 'text-danger' : ''}`}>
                        {formatDate(item.dueDate)}
                        {isOverdue(item.dueDate, item.status) && <Icon name="alert-circle" className="ms-1 text-danger"></Icon>}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="lg">
                      <span>{item.assignedTo}</span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools">
                      <ul className="nk-tb-actions gx-1">
                        <li className="nk-tb-action-hidden">
                          <TooltipComponent
                            tag="a"
                            containerClassName="btn btn-trigger btn-icon"
                            id={"view" + item.id}
                            icon="eye-fill"
                            direction="top"
                            text="View Details"
                          />
                        </li>
                        <li className="nk-tb-action-hidden">
                          <TooltipComponent
                            tag="a"
                            containerClassName="btn btn-trigger btn-icon"
                            id={"edit" + item.id}
                            icon="edit-alt-fill"
                            direction="top"
                            text="Edit"
                            onClick={() => handleEditProject(item.id)}
                          />
                        </li>
                        <li>
                          <UncontrolledDropdown>
                            <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
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
                                      handleEditProject(item.id);
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
                                    href="#workflow"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="flow"></Icon>
                                    <span>RMF Workflow</span>
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
                        </li>
                      </ul>
                    </DataTableRow>
                  </DataTableItem>
                );
              })
            ) : (
              <DataTableItem>
                <DataTableRow colSpan="9">
                  <div className="text-center py-4">
                    <span className="text-silent">No projects found</span>
                  </div>
                </DataTableRow>
              </DataTableItem>
            )}
          </DataTableBody>
          <div className="card-inner">
            {data.length > 0 ? (
              <PaginationComponent
                itemPerPage={itemPerPage}
                totalItems={totalProjects}
                paginate={paginate}
                currentPage={currentPage}
              />
            ) : (
              <div className="text-center">
                <span className="text-silent">No data found</span>
              </div>
            )}
          </div>
        </DataTable>
          ) : (
            <div className="card card-stretch">
              <div className="card-inner">
                {renderCardView()}
              </div>
              <div className="card-inner">
                {data.length > 0 ? (
                  <PaginationComponent
                    itemPerPage={itemPerPage}
                    totalItems={totalProjects}
                    paginate={paginate}
                    currentPage={currentPage}
                  />
                ) : (
                  <div className="text-center">
                    <span className="text-silent">No data found</span>
                  </div>
                )}
              </div>
            </div>
          )}
      </Block>

      {/* Overlay for slide-out panels */}
      {editPanelOpen && (
        <div
          className="toggle-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1020
          }}
          onClick={handleCloseEditPanel}
        />
      )}

      {addPanelOpen && (
        <div
          className="toggle-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1020
          }}
          onClick={handleCloseAddPanel}
        />
      )}
    </Content>
  </React.Fragment>
);
};

export default RMFProjects;