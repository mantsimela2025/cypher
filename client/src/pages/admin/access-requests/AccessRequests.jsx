import React, { useState, useEffect } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import { findUpper } from "@/utils/Utils";
import { toast, ToastContainer } from "react-toastify";
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
import { apiClient } from "@/utils/apiClient";
import AccessRequestDialog from "./AccessRequestDialog";

const AccessRequests = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sm, updateSm] = useState(false);

  // Dialog state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Filter and search states
  const [tablesm, updateTableSm] = useState(false);
  const [onSearch, setonSearch] = useState(true);
  const [onSearchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [totalRequests, setTotalRequests] = useState(0);
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({});

  // View mode state
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('accessRequestsViewMode') || 'table';
  });

  // Filter options
  const filterStatus = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  // Fetch access requests from API
  const fetchAccessRequests = async (page = 1, search = "", status = "") => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemPerPage.toString(),
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const result = await apiClient.get(`/access-requests?${params.toString()}`);

      if (result.success) {
        // Transform API data to match the display format
        const transformedData = result.data.map(request => ({
          id: request.id,
          firstName: request.firstName,
          lastName: request.lastName,
          name: `${request.firstName} ${request.lastName}`,
          email: request.email,
          status: request.status,
          reason: request.reason,
          rejectionReason: request.rejectionReason,
          createdAt: request.createdAt,
          updatedAt: request.updatedAt,
          processedAt: request.processedAt,
          processedBy: request.processedBy,
          processedByUsername: request.processedByUsername,
          avatarBg: getStatusColor(request.status),
          checked: false,
        }));

        setData(transformedData);
        setPagination(result.pagination || {
          page,
          limit: itemPerPage,
          totalCount: transformedData.length,
          totalPages: Math.ceil(transformedData.length / itemPerPage)
        });
        setTotalRequests(result.pagination?.totalCount || transformedData.length);
      } else {
        throw new Error(result.error || 'Failed to fetch access requests');
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
      setError(error.message);
      toast.error(`Failed to load access requests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return colorMap[status] || 'primary';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning text-dark';
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle view request details
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowDialog(true);
  };

  // Handle quick approve
  const handleQuickApprove = async (request) => {
    if (!confirm(`Are you sure you want to approve the access request from ${request.firstName} ${request.lastName}?`)) {
      return;
    }

    try {
      setProcessing(true);
      // Generate username from first and last name
      const username = `${request.firstName.toLowerCase()}.${request.lastName.toLowerCase()}`;

      const result = await apiClient.post(`/access-requests/${request.id}/approve`, {
        username,
        role: 'user'
      });

      if (result.success) {
        toast.success('Access request approved successfully. User account has been created.');
        fetchAccessRequests(currentPage, onSearchText, statusFilter?.value || "");
      } else {
        throw new Error(result.error || 'Failed to approve request');
      }
    } catch (err) {
      toast.error(`Error approving request: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle quick reject
  const handleQuickReject = async (request) => {
    const reason = prompt(`Enter reason for rejecting ${request.firstName} ${request.lastName}'s access request:`);
    if (reason === null) return; // User cancelled

    try {
      setProcessing(true);
      const result = await apiClient.post(`/access-requests/${request.id}/reject`, {
        reason: reason || 'Your request has been denied by an administrator.'
      });

      if (result.success) {
        toast.success('Access request rejected successfully.');
        fetchAccessRequests(currentPage, onSearchText, statusFilter?.value || "");
      } else {
        throw new Error(result.error || 'Failed to reject request');
      }
    } catch (err) {
      toast.error(`Error rejecting request: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle approve from dialog
  const handleApprove = async (userData) => {
    try {
      setProcessing(true);
      const result = await apiClient.post(`/access-requests/${selectedRequest.id}/approve`, userData);

      if (result.success) {
        toast.success('Access request approved and user account created successfully.');
        setShowDialog(false);
        fetchAccessRequests(currentPage, onSearchText, statusFilter?.value || "");
      } else {
        throw new Error(result.error || 'Failed to approve request');
      }
    } catch (err) {
      toast.error(`Error approving request: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject from dialog
  const handleReject = async (reason) => {
    try {
      setProcessing(true);
      const result = await apiClient.post(`/access-requests/${selectedRequest.id}/reject`, { reason });

      if (result.success) {
        toast.success('Access request rejected successfully.');
        setShowDialog(false);
        fetchAccessRequests(currentPage, onSearchText, statusFilter?.value || "");
      } else {
        throw new Error(result.error || 'Failed to reject request');
      }
    } catch (err) {
      toast.error(`Error rejecting request: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAccessRequests(1, onSearchText, statusFilter?.value || "");
  };

  // Clear filters
  const clearFilters = () => {
    setSearchText("");
    setStatusFilter(null);
    setCurrentPage(1);
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('accessRequestsViewMode', mode);
  };

  // Handle status filter change
  const handleStatusFilterChange = (selectedOption) => {
    setStatusFilter(selectedOption);
    setCurrentPage(1);
  };

  // Render card view
  const renderCardView = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="mt-2">Loading access requests...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-5">
          <Icon name="person-check" className="display-1 text-muted mb-3"></Icon>
          <h5 className="mt-3">No access requests found</h5>
          <p className="text-muted">
            {onSearchText || statusFilter
              ? 'Try adjusting your search criteria.'
              : 'No access requests have been submitted yet.'
            }
          </p>
        </div>
      );
    }

    return (
      <Row className="g-gs">
        {data.map((item) => (
          <Col sm="6" lg="4" xxl="3" key={item.id}>
            <PreviewAltCard className="card-bordered">
              <div className="team">
                <div
                  className={`team-status ${
                    item.status === "approved"
                      ? "bg-success text-white"
                      : item.status === "pending"
                      ? "bg-warning text-dark"
                      : "bg-danger text-white"
                  }`}
                >
                  <Icon
                    name={`${
                      item.status === "approved"
                        ? "check-thick"
                        : item.status === "pending"
                        ? "clock"
                        : "cross"
                    }`}
                  ></Icon>
                </div>
                <div className="team-options">
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
                              handleViewRequest(item);
                            }}
                          >
                            <Icon name="eye"></Icon>
                            <span>View Details</span>
                          </DropdownItem>
                        </li>
                        {item.status === 'pending' && (
                          <>
                            <li className="divider"></li>
                            <li>
                              <DropdownItem
                                tag="a"
                                href="#approve"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  handleQuickApprove(item);
                                }}
                              >
                                <Icon name="check-circle"></Icon>
                                <span>Quick Approve</span>
                              </DropdownItem>
                            </li>
                            <li>
                              <DropdownItem
                                tag="a"
                                href="#reject"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  handleQuickReject(item);
                                }}
                              >
                                <Icon name="cross-circle"></Icon>
                                <span>Quick Reject</span>
                              </DropdownItem>
                            </li>
                          </>
                        )}
                      </ul>
                    </DropdownMenu>
                  </UncontrolledDropdown>
                </div>
                <div className="user-card user-card-s2">
                  <UserAvatar
                    theme={item.avatarBg}
                    className="lg"
                    text={findUpper(item.name)}
                  >
                    <div className={`status dot dot-lg ${
                      item.status === 'approved' ? 'dot-success' :
                      item.status === 'pending' ? 'dot-warning' : 'dot-danger'
                    }`}></div>
                  </UserAvatar>
                  <div className="user-info">
                    <h6>{item.name}</h6>
                    <span className="sub-text">{item.email}</span>
                  </div>
                </div>
                <div className="team-details">
                  <p>{item.status.charAt(0).toUpperCase() + item.status.slice(1)} Request</p>
                  {item.reason && (
                    <p className="text-soft small">{item.reason.substring(0, 50)}{item.reason.length > 50 ? '...' : ''}</p>
                  )}
                </div>
                <ul className="team-info">
                  <li>
                    <span>Submitted</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </li>
                  <li>
                    <span>Status</span>
                    <span className={getStatusBadgeClass(item.status)}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </li>
                  {item.processedAt && (
                    <li>
                      <span>Processed</span>
                      <span>{formatDate(item.processedAt)}</span>
                    </li>
                  )}
                </ul>
                <div className="team-view">
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => handleViewRequest(item)}
                  >
                    <Icon name="eye"></Icon>
                    <span>View Details</span>
                  </Button>
                </div>
              </div>
            </PreviewAltCard>
          </Col>
        ))}
      </Row>
    );
  };

  // Initial data fetch
  useEffect(() => {
    fetchAccessRequests(currentPage, onSearchText, statusFilter?.value || "");
  }, [currentPage, itemPerPage, statusFilter]);

  // Search functionality with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchAccessRequests(1, onSearchText, statusFilter?.value || "");
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

  // Function to toggle the search option
  const toggle = () => setonSearch(!onSearch);

  // Change Page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Function to change the selected property of an item
  const onSelectChange = (e, id) => {
    let newData = data;
    let index = newData.findIndex((item) => item.id === id);
    newData[index].checked = e.currentTarget.checked;
    setData([...newData]);
  };

  // Function which selects all the items
  const selectorCheck = (e) => {
    let newData;
    newData = data.map((item) => {
      item.checked = e.currentTarget.checked;
      return item;
    });
    setData([...newData]);
  };

  if (error && !loading) {
    return (
      <React.Fragment>
        <Head title="Admin - Access Requests"></Head>
        <Content>
          <Block>
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
              <button 
                className="btn btn-sm btn-outline-danger ms-3"
                onClick={() => fetchAccessRequests(currentPage, onSearchText, statusFilter?.value || "")}
              >
                <Icon name="reload"></Icon>
                <span>Retry</span>
              </button>
            </div>
          </Block>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="Admin - Access Requests"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Access Request Management
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
                  Review and process user access requests. Total requests: {totalRequests}
                  <span className="ms-2">
                    <Icon name={viewMode === 'table' ? 'view-list-wd' : 'view-grid-wd'} className="me-1"></Icon>
                    {viewMode === 'table' ? 'Table View' : 'Card View'}
                  </span>
                  {statusFilter && (
                    <span className="ms-2">
                      <Icon name="filter-alt" className="me-1"></Icon>
                      Filtered
                      <span className="badge badge-dim bg-primary ms-1">Status: {statusFilter.label}</span>
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
                      <Button
                        color="primary"
                        onClick={() => fetchAccessRequests(currentPage, onSearchText, statusFilter?.value || "")}
                        disabled={loading}
                      >
                        <Icon name="reload"></Icon>
                        <span>Refresh</span>
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
                                    {statusFilter && <div className="dot dot-primary"></div>}
                                    <Icon name="filter-alt"></Icon>
                                  </DropdownToggle>
                                  <DropdownMenu
                                    end
                                    className="filter-wg dropdown-menu-xl"
                                    style={{ overflow: "visible" }}
                                  >
                                    <div className="dropdown-head">
                                      <span className="sub-title dropdown-title">Filter Requests</span>
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
                                        <Col size="12">
                                          <div className="form-group">
                                            <label className="overline-title overline-title-alt">Status</label>
                                            <RSelect
                                              options={filterStatus}
                                              placeholder="All Statuses"
                                              value={statusFilter}
                                              onChange={handleStatusFilterChange}
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
                      placeholder="Search by name or email"
                      value={onSearchText}
                      onChange={(e) => onFilterChange(e)}
                    />
                    <Button className="search-submit btn-icon">
                      <Icon name="search"></Icon>
                    </Button>
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
                    <span className="sub-text">Requester</span>
                  </DataTableRow>
                  <DataTableRow size="md">
                    <span className="sub-text">Email</span>
                  </DataTableRow>
                  <DataTableRow size="sm">
                    <span className="sub-text">Status</span>
                  </DataTableRow>
                  <DataTableRow size="md">
                    <span className="sub-text">Submitted</span>
                  </DataTableRow>
                  <DataTableRow size="lg">
                    <span className="sub-text">Processed</span>
                  </DataTableRow>
                  <DataTableRow className="nk-tb-col-tools text-end">
                    <span className="sub-text">Actions</span>
                  </DataTableRow>
                </DataTableHead>
                {loading ? (
                  <DataTableItem>
                    <DataTableRow colSpan="7">
                      <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="sr-only">Loading...</span>
                        </div>
                        <p className="mt-2">Loading access requests...</p>
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
                              {item.reason && (
                                <div className="text-soft small">
                                  {item.reason.substring(0, 30)}{item.reason.length > 30 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </DataTableRow>
                        <DataTableRow size="md">
                          <span className="text-break">{item.email}</span>
                        </DataTableRow>
                        <DataTableRow size="sm">
                          <span className={getStatusBadgeClass(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </DataTableRow>
                        <DataTableRow size="md">
                          <span className="text-muted small">
                            {formatDate(item.createdAt)}
                          </span>
                        </DataTableRow>
                        <DataTableRow size="lg">
                          <div className="text-muted small">
                            {item.processedAt ? (
                              <>
                                {formatDate(item.processedAt)}
                                {item.processedByUsername && (
                                  <div>by {item.processedByUsername}</div>
                                )}
                              </>
                            ) : (
                              '-'
                            )}
                          </div>
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
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  handleViewRequest(item);
                                }}
                              />
                            </li>
                            {item.status === "pending" && (
                              <>
                                <li className="nk-tb-action-hidden">
                                  <TooltipComponent
                                    tag="a"
                                    containerClassName="btn btn-trigger btn-icon"
                                    id={"approve" + item.id}
                                    icon="check-circle-fill"
                                    direction="top"
                                    text="Quick Approve"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleQuickApprove(item);
                                    }}
                                  />
                                </li>
                                <li className="nk-tb-action-hidden">
                                  <TooltipComponent
                                    tag="a"
                                    containerClassName="btn btn-trigger btn-icon"
                                    id={"reject" + item.id}
                                    icon="cross-circle-fill"
                                    direction="top"
                                    text="Quick Reject"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleQuickReject(item);
                                    }}
                                  />
                                </li>
                              </>
                            )}
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
                                          handleViewRequest(item);
                                        }}
                                      >
                                        <Icon name="eye"></Icon>
                                        <span>View Details</span>
                                      </DropdownItem>
                                    </li>
                                    {item.status === 'pending' && (
                                      <>
                                        <li className="divider"></li>
                                        <li>
                                          <DropdownItem
                                            tag="a"
                                            href="#approve"
                                            onClick={(ev) => {
                                              ev.preventDefault();
                                              handleQuickApprove(item);
                                            }}
                                          >
                                            <Icon name="check-circle"></Icon>
                                            <span>Quick Approve</span>
                                          </DropdownItem>
                                        </li>
                                        <li>
                                          <DropdownItem
                                            tag="a"
                                            href="#reject"
                                            onClick={(ev) => {
                                              ev.preventDefault();
                                              handleQuickReject(item);
                                            }}
                                          >
                                            <Icon name="cross-circle"></Icon>
                                            <span>Quick Reject</span>
                                          </DropdownItem>
                                        </li>
                                      </>
                                    )}
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
                    <DataTableRow colSpan="7">
                      <div className="text-center py-5">
                        <Icon name="person-check" className="display-1 text-muted mb-3"></Icon>
                        <h5 className="mt-3">No access requests found</h5>
                        <p className="text-muted">
                          {onSearchText || statusFilter
                            ? 'Try adjusting your search criteria.'
                            : 'No access requests have been submitted yet.'
                          }
                        </p>
                      </div>
                    </DataTableRow>
                  </DataTableItem>
                )}
              </DataTableBody>
              <div className="card-inner">
                {pagination.totalCount > 0 ? (
                  <PaginationComponent
                    itemPerPage={itemPerPage}
                    totalItems={pagination.totalCount}
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
                {pagination.totalCount > 0 ? (
                  <PaginationComponent
                    itemPerPage={itemPerPage}
                    totalItems={pagination.totalCount}
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

        <ToastContainer />
      </Content>

      {/* Access Request Dialog */}
      {selectedRequest && (
        <AccessRequestDialog
          show={showDialog}
          onHide={() => {
            setShowDialog(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onApprove={handleApprove}
          onReject={handleReject}
          processing={processing}
        />
      )}
    </React.Fragment>
  );
};

export default AccessRequests;