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

  // Static roles data for simple role-based system
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Static roles for the simple role-based system
      const staticRoles = [
        {
          id: 1,
          name: 'admin',
          description: 'Full system access with all administrative privileges',
          isSystem: true,
          userCount: 0, // Will be populated from users API
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'user',
          description: 'Standard user access with read permissions and limited write access',
          isSystem: true,
          userCount: 0, // Will be populated from users API
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 3,
          name: 'moderator',
          description: 'Limited administrative access for content moderation and user support',
          isSystem: true,
          userCount: 0, // Will be populated from users API
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      // Fetch user counts for each role
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch('http://localhost:3001/api/v1/users?limit=1000', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.data) {
            // Count users by role
            const roleCounts = userData.data.reduce((acc, user) => {
              acc[user.role] = (acc[user.role] || 0) + 1;
              return acc;
            }, {});

            // Update role counts
            staticRoles.forEach(role => {
              role.userCount = roleCounts[role.name] || 0;
            });
          }
        }
      } catch (userError) {
        console.warn('Could not fetch user counts:', userError);
      }

      setRoles(staticRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
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

  // Helper function to get role permissions
  const getRolePermissions = (roleName) => {
    switch (roleName) {
      case 'admin':
        return [
          '• Full CRUD access to all resources',
          '• User management and administration',
          '• System configuration and settings',
          '• Access to all admin panels',
          '• Can create, edit, and delete any content'
        ];
      case 'user':
        return [
          '• Read access to most resources',
          '• Can update own profile',
          '• Can generate reports',
          '• Can view dashboards and analytics',
          '• Limited write access to personal data'
        ];
      case 'moderator':
        return [
          '• Limited administrative access',
          '• Content moderation capabilities',
          '• User support functions',
          '• Read access to most resources',
          '• Some write access for moderation tasks'
        ];
      default:
        return ['• Custom role permissions'];
    }
  };

  // Handler functions for dropdown actions
  const handleEditRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('System roles cannot be edited. These are built-in roles required for the application to function properly.');
    } else {
      console.log('Edit role:', roleId);
      // TODO: Implement edit role functionality for custom roles
    }
  };

  const handleViewRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role) {
      const permissions = getRolePermissions(role.name);
      alert(`Role: ${role.name}\n\nDescription: ${role.description}\n\nPermissions:\n${permissions.join('\n')}\n\nUsers with this role: ${role.userCount}`);
    }
  };

  const handleManagePermissions = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('System role permissions are fixed and cannot be modified. Use the simple role-based system:\n\n• admin: Full access to all operations\n• user: Read access + limited write access\n• moderator: Limited administrative access');
    } else {
      console.log('Manage permissions for role:', roleId);
      // TODO: Implement permission management for custom roles
    }
  };

  const handleDeleteRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    if (role?.isSystem) {
      alert('System roles cannot be deleted. These roles are required for the application to function properly.');
    } else {
      const roleName = role ? role.name : 'this role';
      if (window.confirm(`Are you sure you want to delete "${roleName}"? This action cannot be undone and will affect all users assigned to this role.`)) {
        console.log('Role deletion confirmed for:', roleName);
        // TODO: Implement delete role functionality for custom roles
      }
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
