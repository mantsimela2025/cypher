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
import { Badge, Spinner } from "reactstrap";

const AdminPermissions = () => {
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage] = useState(15);

  // Fetch permissions from API
  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:3001/api/v1/permissions', {
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
        setPermissions(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch permissions');
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
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

  const getCategoryColor = (category) => {
    const colors = {
      users: "primary",
      roles: "success",
      admin: "danger",
      system: "warning",
      reports: "info",
      permissions: "secondary",
    };
    return colors[category] || "light";
  };

  // Define columns for ReactDataTable
  const permissionsColumns = [
    {
      name: "Permission",
      selector: (row) => row.name,
      grow: 2,
      style: { paddingRight: "20px" },
      cell: (row) => (
        <div className="user-card mt-2 mb-2">
          <UserAvatar
            theme={getCategoryColor(row.category)}
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
      name: "Category",
      selector: (row) => row.category,
      cell: (row) => (
        <Badge
          color={`outline-${getCategoryColor(row.category)}`}
          className="badge-dim"
        >
          {row.category || 'General'}
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
        <div className="d-flex gap-1">
          <Button size="sm" className="btn-icon" color="primary" outline>
            <Icon name="edit"></Icon>
          </Button>
          <Button size="sm" className="btn-icon" color="primary" outline>
            <Icon name="eye"></Icon>
          </Button>
          <Button size="sm" className="btn-icon" color="danger" outline>
            <Icon name="trash"></Icon>
          </Button>
        </div>
      ),
      allowOverflow: true,
      button: true,
      width: "120px",
    },
  ];

  if (error) {
    return (
      <React.Fragment>
        <Head title="Permissions Management"></Head>
        <Content>
          <Block>
            <div className="alert alert-danger">
              <strong>Error:</strong> {error}
              <Button color="primary" size="sm" className="ms-2" onClick={fetchPermissions}>
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
      <Head title="Permissions Management"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>Permissions Management</BlockTitle>
            <BlockDes className="text-soft">
              <p>Manage system permissions and their assignments to roles.</p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">System Permissions</BlockTitle>
              <p>
                Complete list of all system permissions organized by category.
              </p>
            </BlockHeadContent>
          </BlockHead>

          {loading ? (
            <div className="text-center py-4">
              <Spinner color="primary" />
              <p className="mt-2">Loading permissions...</p>
            </div>
          ) : (
            <ReactDataTable
              data={permissions}
              columns={permissionsColumns}
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

export default AdminPermissions;
