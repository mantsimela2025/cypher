import React, { useState, useEffect } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Icon,
  Button,
  ReactDataTable,
  UserAvatar,
} from "@/components/Component";
import {
  Badge,
  Spinner,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";

const AdminRoles = () => {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage] = useState(10);

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/v1/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setRoles(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch roles');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Helper function to get first letters for avatar
  const findUpper = (string) => {
    const matches = string.match(/[A-Z]/g);
    return matches ? matches.join("").slice(0, 2) : string.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Handler functions for dropdown actions
  const handleEditRole = (roleId) => {
    console.log('Edit role:', roleId);
    // TODO: Implement edit role functionality
    // This could open a modal or navigate to an edit page
  };

  const handleViewRole = (roleId) => {
    console.log('View role:', roleId);
    // TODO: Implement view role details functionality
    // This could open a modal with role details
  };

  const handleManagePermissions = (roleId) => {
    console.log('Manage permissions for role:', roleId);
    // TODO: Implement permissions management functionality
    // This could open a permissions management modal
  };

  const handleDeleteRole = (roleId) => {
    console.log('Delete role:', roleId);
    // TODO: Implement delete role functionality
    // This should show a confirmation dialog before deleting
    const role = roles.find(r => r.id === roleId);
    const roleName = role ? role.name : 'this role';

    if (window.confirm(`Are you sure you want to delete "${roleName}"? This action cannot be undone and will affect all users assigned to this role.`)) {
      // Implement actual delete logic here
      console.log('Role deletion confirmed for:', roleName);
      // You could call an API here to delete the role
      // deleteRoleAPI(roleId).then(() => fetchRoles());
    }
  };

  // Define columns for ReactDataTable
  const rolesColumns = [
    {
      name: "Role",
      selector: (row) => row.name,
      grow: 2,
      style: { paddingRight: "20px" },
      cell: (row) => (
        <div className="user-card mt-2 mb-2">
          <UserAvatar
            theme="primary"
            text={findUpper(row.name)}
          />
          <div className="user-info">
            <span className="tb-lead" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {row.name}
            </span>
            <span className="tb-sub" style={{ fontSize: '0.75rem', color: '#8094ae' }}>
              {row.description || 'No description'}
            </span>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      name: "Type",
      selector: (row) => row.isSystem ? "System" : row.isDefault ? "Default" : "Custom",
      cell: (row) => (
        <Badge
          color={row.isSystem ? "outline-warning" : row.isDefault ? "outline-success" : "outline-info"}
          className="badge-dim"
        >
          {row.isSystem ? "System" : row.isDefault ? "Default" : "Custom"}
        </Badge>
      ),
      sortable: true,
      hide: "sm",
    },
    {
      name: "Created",
      selector: (row) => row.createdAt,
      cell: (row) => (
        <span style={{ fontSize: '0.875rem', color: '#526484' }}>
          {formatDate(row.createdAt)}
        </span>
      ),
      sortable: true,
      hide: "md",
    },
    {
      name: "Actions",
      cell: (row) => (
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
                    handleEditRole(row.id);
                  }}
                >
                  <Icon name="edit"></Icon>
                  <span>Edit Role</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#view"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleViewRole(row.id);
                  }}
                >
                  <Icon name="eye"></Icon>
                  <span>View Details</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#permissions"
                  onClick={(ev) => {
                    ev.preventDefault();
                    handleManagePermissions(row.id);
                  }}
                >
                  <Icon name="shield-check"></Icon>
                  <span>Manage Permissions</span>
                </DropdownItem>
              </li>
              {row.isSystem ? (
                <>
                  <li className="divider"></li>
                  <li>
                    <DropdownItem
                      tag="a"
                      href="#info"
                      onClick={(ev) => {
                        ev.preventDefault();
                      }}
                      disabled
                    >
                      <Icon name="info"></Icon>
                      <span>System Role (Protected)</span>
                    </DropdownItem>
                  </li>
                </>
              ) : (
                <>
                  <li className="divider"></li>
                  <li>
                    <DropdownItem
                      tag="a"
                      href="#delete"
                      onClick={(ev) => {
                        ev.preventDefault();
                        handleDeleteRole(row.id);
                      }}
                    >
                      <Icon name="trash"></Icon>
                      <span>Delete Role</span>
                    </DropdownItem>
                  </li>
                </>
              )}
            </ul>
          </DropdownMenu>
        </UncontrolledDropdown>
      ),
      allowOverflow: true,
      button: true,
      width: "120px",
    },
  ];

  if (error) {
    return (
      <React.Fragment>
        <Head title="Roles Management"></Head>
        <Content>
          <Block>
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
              <Button color="primary" size="sm" className="ms-2" onClick={fetchRoles}>
                Retry
              </Button>
            </div>
          </Block>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="Roles Management"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>Roles Management</BlockTitle>
            <BlockDes className="text-soft">
              <p>Manage user roles and their permissions within the system.</p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">System Roles</BlockTitle>
              <p>
                Complete list of all user roles with their permissions and access levels.
              </p>
            </BlockHeadContent>
          </BlockHead>

          {loading ? (
            <div className="text-center py-4">
              <Spinner color="primary" />
              <p className="mt-2">Loading roles...</p>
            </div>
          ) : (
            <ReactDataTable
              data={roles}
              columns={rolesColumns}
              pagination={true}
              className="nk-tb-list"
              selectableRows={true}
            />
          )}
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default AdminRoles;
