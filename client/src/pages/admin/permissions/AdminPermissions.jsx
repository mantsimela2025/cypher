import React, { useState } from "react";
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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Alert
} from "reactstrap";
import { findUpper } from "@/utils/Utils";
import { useLazyLoadOnDemand } from "@/hooks/useLazyLoad";
import LazyDataLoader from "@/components/LazyDataLoader";
import { toast } from "react-toastify";

const AdminPermissions = () => {
  console.log('🔍 AdminPermissions component rendering...');

  // State for CRUD operations
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    actions: [],
    scope: ''
  });
  const [permissionsData, setPermissionsData] = useState([]);

  // Available actions for permissions
  const availableActions = [
    'create', 'read', 'update', 'delete', 'manage',
    'moderate', 'support', 'limited_admin', 'update_own', 'create_limited'
  ];

  // Lazy load permissions data
  const permissionsLazyLoad = useLazyLoadOnDemand(async () => {
    // Simulate API delay for better UX demonstration
    await new Promise(resolve => setTimeout(resolve, 800));

    // Static permissions data for simple role-based system
    const permissions = [
    {
      id: 1,
      name: 'admin',
      category: 'System',
      description: 'Full administrative access to all system resources and operations',
      actions: ['create', 'read', 'update', 'delete', 'manage'],
      scope: 'All resources'
    },
    {
      id: 2,
      name: 'user',
      category: 'Standard',
      description: 'Standard user access with read permissions and limited write access',
      actions: ['read', 'update_own', 'create_limited'],
      scope: 'Most resources (read), Own data (write)'
    },
    {
      id: 3,
      name: 'moderator',
      category: 'Administrative',
      description: 'Limited administrative access for content moderation and user support',
      actions: ['read', 'moderate', 'support', 'limited_admin'],
      scope: 'Content moderation, User support'
    }
    ];

    console.log('✅ Permissions data loaded:', permissions);
    setPermissionsData(permissions); // Store in state for CRUD operations
    return permissionsData.length > 0 ? permissionsData : permissions;
  });

  // CRUD Functions
  const handleAdd = () => {
    setEditingPermission(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      actions: [],
      scope: ''
    });
    setModalOpen(true);
  };

  const handleEdit = (permission) => {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      category: permission.category,
      description: permission.description,
      actions: permission.actions,
      scope: permission.scope
    });
    setModalOpen(true);
  };

  const handleDelete = (permission) => {
    if (window.confirm(`Are you sure you want to delete the "${permission.name}" role?`)) {
      const updatedPermissions = permissionsData.filter(p => p.id !== permission.id);
      setPermissionsData(updatedPermissions);
      toast.success(`Role "${permission.name}" deleted successfully!`);

      // Force refresh the lazy loader with new data
      permissionsLazyLoad.reload();
    }
  };

  const handleSave = () => {
    // Validation
    if (!formData.name || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingPermission) {
      // Update existing permission
      const updatedPermissions = permissionsData.map(p =>
        p.id === editingPermission.id
          ? { ...editingPermission, ...formData }
          : p
      );
      setPermissionsData(updatedPermissions);
      toast.success(`Role "${formData.name}" updated successfully!`);
    } else {
      // Add new permission
      const newPermission = {
        id: Math.max(...permissionsData.map(p => p.id)) + 1,
        ...formData
      };
      setPermissionsData([...permissionsData, newPermission]);
      toast.success(`Role "${formData.name}" created successfully!`);
    }

    setModalOpen(false);
    // Force refresh the lazy loader with new data
    permissionsLazyLoad.reload();
  };

  const handleActionToggle = (action) => {
    const currentActions = formData.actions || [];
    const updatedActions = currentActions.includes(action)
      ? currentActions.filter(a => a !== action)
      : [...currentActions, action];

    setFormData({ ...formData, actions: updatedActions });
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
      System: "warning",
      Standard: "primary",
      Administrative: "success"
    };
    return colors[category] || "light";
  };

  // Define columns for ReactDataTable
  const permissionsColumns = [
    {
      name: "Role",
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
      name: "Actions",
      selector: (row) => row.actions,
      cell: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.actions.map((action, index) => (
            <Badge key={index} color="light" className="text-dark" style={{ fontSize: '0.7rem' }}>
              {action}
            </Badge>
          ))}
        </div>
      ),
      sortable: false,
      width: "200px",
    },
    {
      name: "Scope",
      selector: (row) => row.scope,
      cell: (row) => (
        <span className="tb-sub" style={{ fontSize: '0.75rem' }}>
          {row.scope}
        </span>
      ),
      sortable: true,
      width: "180px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="d-flex gap-1">
          <Button
            color="outline-primary"
            size="sm"
            onClick={() => handleEdit(row)}
            title="Edit Role"
          >
            <Icon name="edit"></Icon>
          </Button>
          <Button
            color="outline-danger"
            size="sm"
            onClick={() => handleDelete(row)}
            title="Delete Role"
            disabled={row.name === 'admin'} // Prevent deleting admin role
          >
            <Icon name="trash"></Icon>
          </Button>
        </div>
      ),
      sortable: false,
      width: "120px",
    },
  ];

  // Error handling is now managed by LazyDataLoader component

  console.log('🎨 AdminPermissions about to render with lazy loading');

  return (
    <React.Fragment>
      <Head title="Permissions Management"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <BlockTitle page>Role-Based Access Control</BlockTitle>
                <BlockDes className="text-soft">
                  <p>Simple role-based authorization system with predefined roles and permissions.</p>
                </BlockDes>
              </div>
              <div>
                <Button color="primary" onClick={handleAdd}>
                  <Icon name="plus"></Icon>
                  <span>Add Role</span>
                </Button>
              </div>
            </div>
          </BlockHeadContent>
        </BlockHead>

        {/* Migration Notice */}
        <Block>
          <div className="alert alert-info">
            <div className="alert-cta">
              <h6>🔄 System Update Notice</h6>
              <p>
                The CYPHER application has migrated from a complex RBAC (Role-Based Access Control) system
                to a <strong>simple role-based authorization system</strong> for better performance and easier maintenance.
              </p>
              <p className="mb-0">
                <strong>New System:</strong> Three predefined roles (admin, user, moderator) with fixed permissions
                instead of granular permission management.
              </p>
            </div>
          </div>
        </Block>

        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h4">System Roles & Permissions</BlockTitle>
              <p>
                Overview of the three system roles and their associated permissions.
              </p>
            </BlockHeadContent>
          </BlockHead>

          <LazyDataLoader
            {...permissionsLazyLoad}
            loadingMessage="Loading role permissions..."
            loadButtonText="Load Permissions"
            emptyMessage="No permissions available"
            minHeight="300px"
          >
            {(permissionsData) => (
              <ReactDataTable
                data={permissionsData}
                columns={permissionsColumns}
                pagination={false}
                className="nk-tb-list"
                selectableRows={false}
              />
            )}
          </LazyDataLoader>
        </Block>
      </Content>

      {/* Add/Edit Role Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>
          {editingPermission ? 'Edit Role' : 'Add New Role'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md="6">
                <FormGroup>
                  <Label for="roleName">Role Name *</Label>
                  <Input
                    type="text"
                    id="roleName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label for="category">Category *</Label>
                  <Input
                    type="select"
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    <option value="System">System</option>
                    <option value="Standard">Standard</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Custom">Custom</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for="description">Description *</Label>
              <Input
                type="textarea"
                id="description"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role and its purpose"
              />
            </FormGroup>

            <FormGroup>
              <Label>Permissions</Label>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {availableActions.map(action => (
                  <Badge
                    key={action}
                    color={formData.actions?.includes(action) ? "primary" : "light"}
                    className="cursor-pointer p-2"
                    onClick={() => handleActionToggle(action)}
                    style={{ cursor: 'pointer' }}
                  >
                    {action}
                  </Badge>
                ))}
              </div>
              <small className="text-muted">Click to toggle permissions</small>
            </FormGroup>

            <FormGroup>
              <Label for="scope">Scope</Label>
              <Input
                type="text"
                id="scope"
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                placeholder="Define the scope of this role"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSave}>
            {editingPermission ? 'Update Role' : 'Create Role'}
          </Button>
        </ModalFooter>
      </Modal>
    </React.Fragment>
  );
};

export default AdminPermissions;
