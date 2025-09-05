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
import { Link } from "react-router-dom";
import { bulkActionOptions } from "@/utils/Utils";
import EditUserPanel from "./EditUserPanel";
import AddUserPanel from "./AddUserPanel";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const AdminUsers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sm, updateSm] = useState(false);

  // Edit user panel state
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  
  // Add user panel state
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [tablesm, updateTableSm] = useState(false);
  const [onSearch, setonSearch] = useState(true);
  const [onSearchText, setSearchText] = useState("");
  const [actionText, setActionText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);
  const [sort, setSortState] = useState("");
  const [totalUsers, setTotalUsers] = useState(0);

  // Filter states
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // View state (table or card) - persistent in localStorage
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('adminUsersViewMode') || 'table';
  });

  // Filter options
  const filterRole = [
    { value: "", label: "Any Role" },
    { value: "admin", label: "Admin" },
    { value: "moderator", label: "Moderator" },
    { value: "user", label: "User" },
  ];

  const filterStatus = [
    { value: "", label: "Any Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  // Fetch users from API
  const fetchUsers = async (page = 1, search = "", role = "", status = "") => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemPerPage.toString(),
      });

      if (search) params.append('search', search);
      if (role) params.append('role', role);
      if (status) params.append('status', status);

      log.api('Fetching users with filters:', { search, role, status, currentPage, itemPerPage });
      const result = await apiClient.get(`/users?${params.toString()}`);

      if (result.success) {
        // Transform API data to match the table format
        const transformedData = result.data.users.map(user => {
          return {
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
            username: user.username,
            email: user.email,
            role: user.role || 'user', // Default to 'user' if role is missing
            status: user.status,
            authMethod: user.authMethod || 'password',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            avatarBg: getAvatarColor(user.role || 'user'),
            checked: false,
          };
        });
        setData(transformedData);
        setTotalUsers(result.data.total);
        log.info('Users loaded successfully:', transformedData.length, 'users');
      } else {
        throw new Error(result.message || 'Failed to fetch users');
      }
    } catch (error) {
      log.error('Error fetching users:', error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get avatar color based on role
  const getAvatarColor = (role) => {
    const colorMap = {
      admin: 'danger',
      moderator: 'warning',
      user: 'primary',
    };
    return colorMap[role] || 'primary';
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colorMap = {
      active: 'success',
      inactive: 'warning',
      suspended: 'danger',
    };
    return colorMap[status] || 'secondary';
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colorMap = {
      admin: 'danger',
      moderator: 'warning',
      user: 'primary',
    };
    return colorMap[role] || 'primary';
  };

  // Format role display
  const formatRole = (role) => {
    if (!role || role.trim() === '') {
      return 'User';
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
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

  // Handle opening edit panel
  const handleEditUser = (userId) => {
    setSelectedUserId(userId);
    setEditPanelOpen(true);
  };

  // Handle closing edit panel
  const handleCloseEditPanel = () => {
    setEditPanelOpen(false);
    setSelectedUserId(null);
  };

  // Handle opening add panel
  const handleOpenAddPanel = () => {
    setAddPanelOpen(true);
  };

  // Handle closing add panel
  const handleCloseAddPanel = () => {
    setAddPanelOpen(false);
  };

  // Handle user added callback
  const handleUserAdded = () => {
    // Refresh the user list with current filters
    fetchUsers(
      currentPage,
      onSearchText,
      selectedRole?.value || "",
      selectedStatus?.value || ""
    );
  };

  // Handle user updated callback
  const handleUserUpdated = () => {
    // Refresh the user list with current filters
    fetchUsers(
      currentPage,
      onSearchText,
      selectedRole?.value || "",
      selectedStatus?.value || ""
    );
  };

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('adminUsersViewMode', mode);
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers(
      currentPage,
      onSearchText,
      selectedRole?.value || "",
      selectedStatus?.value || ""
    );
  }, [currentPage, itemPerPage, selectedRole, selectedStatus]);

  // Search functionality
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchUsers(
          1,
          onSearchText,
          selectedRole?.value || "",
          selectedStatus?.value || ""
        );
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

  // Handle role filter change
  const handleRoleFilterChange = (selectedOption) => {
    setSelectedRole(selectedOption);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle status filter change
  const handleStatusFilterChange = (selectedOption) => {
    setSelectedStatus(selectedOption);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedRole(null);
    setSelectedStatus(null);
    setSearchText("");
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
          <p className="mt-2">Loading users...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-4">
          <span className="text-silent">No users found</span>
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
                    item.status === "active"
                      ? "bg-success text-white"
                      : item.status === "inactive"
                      ? "bg-warning text-white"
                      : "bg-danger text-white"
                  }`}
                >
                  <Icon
                    name={`${
                      item.status === "active"
                        ? "check-thick"
                        : item.status === "inactive"
                        ? "clock"
                        : "na"
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
                            href="#edit"
                            onClick={(ev) => {
                              ev.preventDefault();
                              handleEditUser(item.id);
                            }}
                          >
                            <Icon name="edit"></Icon>
                            <span>Edit User</span>
                          </DropdownItem>
                        </li>
                        <li>
                          <DropdownItem
                            tag="a"
                            href="#permissions"
                            onClick={(ev) => {
                              ev.preventDefault();
                            }}
                          >
                            <Icon name="shield-check"></Icon>
                            <span>Manage Permissions</span>
                          </DropdownItem>
                        </li>
                        {item.status !== "suspended" && (
                          <>
                            <li className="divider"></li>
                            <li>
                              <DropdownItem
                                tag="a"
                                href="#suspend"
                                onClick={(ev) => {
                                  ev.preventDefault();
                                }}
                              >
                                <Icon name="na"></Icon>
                                <span>Suspend User</span>
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
                      item.status === 'active' ? 'dot-success' :
                      item.status === 'inactive' ? 'dot-warning' : 'dot-danger'
                    }`}></div>
                  </UserAvatar>
                  <div className="user-info">
                    <h6>{item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.username}</h6>
                    <span className="sub-text">@{item.username}</span>
                  </div>
                </div>
                <div className="team-details">
                  <p>{formatRole(item.role)} • {item.authMethod}</p>
                </div>
                <ul className="team-info">
                  <li>
                    <span>Email</span>
                    <span>{item.email}</span>
                  </li>
                  <li>
                    <span>Role</span>
                    <span className={`badge badge-dim bg-${getRoleBadgeColor(item.role)}`} style={{ color: 'white' }}>
                      {formatRole(item.role)}
                    </span>
                  </li>
                  <li>
                    <span>Join Date</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </li>
                </ul>
                <div className="team-view">
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => handleEditUser(item.id)}
                  >
                    <Icon name="edit"></Icon>
                    <span>Edit User</span>
                  </Button>
                </div>
              </div>
            </PreviewAltCard>
          </Col>
        ))}
      </Row>
    );
  };

  // function to change the selected property of an item
  const onSelectChange = (e, id) => {
    let newData = data;
    let index = newData.findIndex((item) => item.id === id);
    newData[index].checked = e.currentTarget.checked;
    setData([...newData]);
  };

  // function to set the action to be taken in table header
  const onActionText = (e) => {
    setActionText(e.value);
  };

  // function which selects all the items
  const selectorCheck = (e) => {
    let newData;
    newData = data.map((item) => {
      item.checked = e.currentTarget.checked;
      return item;
    });
    setData([...newData]);
  };

  // function to toggle the search option
  const toggle = () => setonSearch(!onSearch);

  // Change Page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Sorting data
  const sortFunc = (params) => {
    let defaultData = [...data];
    if (params === "asc") {
      let sortedData = defaultData.sort((a, b) => a.name.localeCompare(b.name));
      setData(sortedData);
    } else if (params === "dsc") {
      let sortedData = defaultData.sort((a, b) => b.name.localeCompare(a.name));
      setData(sortedData);
    }
  };

  if (error) {
    return (
      <React.Fragment>
        <Head title="Admin - Users"></Head>
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
      <Head title="Admin - Users"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                User Management
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
                  Manage system users and their access permissions. Total users: {totalUsers}
                  <span className="ms-2">
                    <Icon name={viewMode === 'table' ? 'view-list-wd' : 'view-grid-wd'} className="me-1"></Icon>
                    {viewMode === 'table' ? 'Table View' : 'Card View'}
                  </span>
                  {(selectedRole || selectedStatus) && (
                    <span className="ms-2">
                      <Icon name="filter-alt" className="me-1"></Icon>
                      Filtered
                      {selectedRole && <span className="badge badge-dim bg-primary ms-1">Role: {selectedRole.label}</span>}
                      {selectedStatus && <span className="badge badge-dim bg-warning ms-1">Status: {selectedStatus.label}</span>}
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
                                {(selectedRole || selectedStatus) && <div className="dot dot-primary"></div>}
                                <Icon name="filter-alt"></Icon>
                              </DropdownToggle>
                              <DropdownMenu
                                end
                                className="filter-wg dropdown-menu-xl"
                                style={{ overflow: "visible" }}
                              >
                                <div className="dropdown-head">
                                  <span className="sub-title dropdown-title">Filter Users</span>
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
                                    <Col size="6">
                                      <div className="form-group">
                                        <label className="overline-title overline-title-alt">Role</label>
                                        <RSelect
                                          options={filterRole}
                                          placeholder="Any Role"
                                          value={selectedRole}
                                          onChange={handleRoleFilterChange}
                                          isClearable
                                        />
                                      </div>
                                    </Col>
                                    <Col size="6">
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
                                <ul className="link-check">
                                  <li><span>Order</span></li>
                                  <li className={sort === "dsc" ? "active" : ""}>
                                    <DropdownItem
                                      tag="a"
                                      href="#dropdownitem"
                                      onClick={(ev) => {
                                        ev.preventDefault();
                                        setSortState("dsc");
                                        sortFunc("dsc");
                                      }}
                                    >
                                      DESC
                                    </DropdownItem>
                                  </li>
                                  <li className={sort === "asc" ? "active" : ""}>
                                    <DropdownItem
                                      tag="a"
                                      href="#dropdownitem"
                                      onClick={(ev) => {
                                        ev.preventDefault();
                                        setSortState("asc");
                                        sortFunc("asc");
                                      }}
                                    >
                                      ASC
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
                    placeholder="Search by name, username, or email"
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
                <span className="sub-text">User</span>
              </DataTableRow>
              <DataTableRow size="md">
                <span className="sub-text">Role</span>
              </DataTableRow>
              <DataTableRow size="sm">
                <span className="sub-text">Email</span>
              </DataTableRow>
              <DataTableRow size="md">
                <span className="sub-text">Username</span>
              </DataTableRow>
              <DataTableRow size="lg">
                <span className="sub-text">Auth Method</span>
              </DataTableRow>
              <DataTableRow size="lg">
                <span className="sub-text">Created</span>
              </DataTableRow>
              <DataTableRow>
                <span className="sub-text">Status</span>
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
                    <p className="mt-2">Loading users...</p>
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
                        </div>
                      </div>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className={`badge badge-dim bg-${getRoleBadgeColor(item.role)}`} style={{ color: 'white' }}>
                        {formatRole(item.role)}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="sm">
                      <span>{item.email}</span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span>{item.username}</span>
                    </DataTableRow>
                    <DataTableRow size="lg">
                      <span className="text-capitalize">{item.authMethod}</span>
                    </DataTableRow>
                    <DataTableRow size="lg">
                      <span>{formatDate(item.createdAt)}</span>
                    </DataTableRow>
                    <DataTableRow>
                      <span
                        className={`tb-status text-${getStatusBadgeColor(item.status)}`}
                      >
                        {item.status}
                      </span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools">
                      <ul className="nk-tb-actions gx-1">
                        <li className="nk-tb-action-hidden">
                          <TooltipComponent
                            tag="a"
                            containerClassName="btn btn-trigger btn-icon"
                            id={"edit" + item.id}
                            icon="edit-alt-fill"
                            direction="top"
                            text="Edit"
                          />
                        </li>
                        {item.status !== "suspended" && (
                          <li className="nk-tb-action-hidden">
                            <TooltipComponent
                              tag="a"
                              containerClassName="btn btn-trigger btn-icon"
                              id={"suspend" + item.id}
                              icon="user-cross-fill"
                              direction="top"
                              text="Suspend"
                            />
                          </li>
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
                                    href="#edit"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleEditUser(item.id);
                                    }}
                                  >
                                    <Icon name="edit"></Icon>
                                    <span>Edit User</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#permissions"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="shield-check"></Icon>
                                    <span>Manage Permissions</span>
                                  </DropdownItem>
                                </li>
                                {item.status !== "suspended" && (
                                  <>
                                    <li className="divider"></li>
                                    <li>
                                      <DropdownItem
                                        tag="a"
                                        href="#suspend"
                                        onClick={(ev) => {
                                          ev.preventDefault();
                                        }}
                                      >
                                        <Icon name="na"></Icon>
                                        <span>Suspend User</span>
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
                <DataTableRow colSpan="9">
                  <div className="text-center py-4">
                    <span className="text-silent">No users found</span>
                  </div>
                </DataTableRow>
              </DataTableItem>
            )}
          </DataTableBody>
          <div className="card-inner">
            {data.length > 0 ? (
              <PaginationComponent
                itemPerPage={itemPerPage}
                totalItems={totalUsers}
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
                    totalItems={totalUsers}
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
    </Content>

    {/* Edit User Panel */}
    <EditUserPanel
      isOpen={editPanelOpen}
      onClose={handleCloseEditPanel}
      userId={selectedUserId}
      onUserUpdated={handleUserUpdated}
    />

    {/* Add User Panel */}
    <AddUserPanel
      isOpen={addPanelOpen}
      onClose={handleCloseAddPanel}
      onUserAdded={handleUserAdded}
    />

    {/* Overlay for slide-out panel */}
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

    {/* Overlay for add panel */}
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
  </React.Fragment>
);
};

export default AdminUsers;
