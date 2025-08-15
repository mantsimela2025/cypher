import React, { useState, useEffect } from 'react';
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import { Link } from 'react-router-dom';
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  Button,
  ReactDataTable,
  UserAvatar,
} from "@/components/Component";
import {
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  DropdownItem,
  UncontrolledTooltip,
} from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import CreateDistributionGroupPanel from "./CreateDistributionGroupPanel";

import { apiClient } from '@/utils/apiClient';

const DistributionGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, groupId: null, groupName: '' });
  const [sm, updateSm] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  // Helper function to get first letters for avatar
  const findUpper = (string) => {
    const matches = string.match(/[A-Z]/g);
    return matches ? matches.join("").slice(0, 2) : string.slice(0, 2).toUpperCase();
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching distribution groups...');
      
      // Try to fetch data, but handle different types of errors
      try {
        const data = await apiClient.get('/admin/distribution-groups');
        
        console.log('📥 API response:', data);
        
        if (data.success) {
          console.log(`📊 SUCCESS: Received ${data.data.length} distribution groups from API`);
          setGroups(data.data || []);
        } else if (data.message === 'API v1 is running') {
          // Backend API is running but distribution groups endpoint is not implemented yet
          console.log('📊 INFO: Distribution groups endpoint not implemented yet');
          setGroups([]);
          setError('Distribution groups endpoint is not implemented on the backend yet. The UI is ready and will work once the API endpoints are added.');
        } else {
          throw new Error(data.error || data.message || 'Failed to fetch groups');
        }
      } catch (apiError) {
        // Handle different types of API errors
        if (apiError.message.includes('status: 500')) {
          // Server error - likely endpoint not implemented
          console.log('📊 INFO: Server error (500) - distribution groups endpoint likely not implemented yet');
          setGroups([]);
          setError('Distribution groups endpoint is not implemented on the backend yet. The UI is ready and will work once the API endpoints are added.');
        } else if (apiError.message.includes('status: 404')) {
          // Not found - endpoint doesn't exist
          console.log('📊 INFO: Endpoint not found (404) - distribution groups endpoint not implemented yet');
          setGroups([]);
          setError('Distribution groups endpoint is not implemented on the backend yet. The UI is ready and will work once the API endpoints are added.');
        } else {
          // Other errors - show them to the user
          throw apiError;
        }
      }
    } catch (err) {
      console.error('❌ Error fetching distribution groups:', err);
      setError(err.message);
      toast.error(`Failed to load distribution groups: ${err.message}`);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (groupId) => {
    try {
      const data = await apiClient.delete(`/admin/distribution-groups/${groupId}`);
      
      if (data.success) {
        setGroups(groups.filter(g => g.id !== groupId));
        setDeleteModal({ show: false, groupId: null, groupName: '' });
      } else {
        throw new Error(data.error || 'Failed to delete group');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle opening create panel
  const handleOpenCreatePanel = () => {
    setCreatePanelOpen(true);
  };

  // Handle closing create panel
  const handleCloseCreatePanel = () => {
    setCreatePanelOpen(false);
  };

  // Handle group created callback
  const handleGroupCreated = (newGroup) => {
    // Refresh the groups list
    fetchGroups();
    toast.success(`Distribution group "${newGroup.name}" created successfully!`);
  };

  // Define columns for ReactDataTable
  const groupColumns = [
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Group Name</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      style: { paddingRight: "20px" },
      cell: (row) => (
        <div className="user-card mt-2 mb-2">
          <UserAvatar
            theme="primary"
            text={findUpper(row.name || 'DG')}
          />
          <div className="user-info">
            <span className="tb-lead" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
              {row.name}
            </span>
            <div className="text-soft" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
              ID: {row.id}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Description</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.description,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
          {row.description || 'No description'}
        </div>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Members</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.memberCount,
      sortable: true,
      width: "120px",
      cell: (row) => (
        <span className="badge badge-dim bg-primary" style={{ fontWeight: '600' }}>
          {row.memberCount || 0}
        </span>
      ),
    },
    {
      name: (
        <div className="d-flex align-items-center">
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Created</span>
          <div className="ms-1 d-flex flex-column">
            <Icon name="chevron-up" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
            <Icon name="chevron-down" style={{ fontSize: '0.6rem', color: '#8094ae', cursor: 'pointer' }}></Icon>
          </div>
        </div>
      ),
      selector: (row) => row.createdAt,
      sortable: true,
      cell: (row) => (
        <div style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#526484' }}>
          {formatDate(row.createdAt)}
        </div>
      ),
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
                  tag={Link}
                  to={`/admin/distribution-groups/${row.id}/members`}
                >
                  <Icon name="users"></Icon>
                  <span>Manage Members</span>
                </DropdownItem>
              </li>
              <li>
                <DropdownItem
                  tag={Link}
                  to={`/admin/distribution-groups/${row.id}/edit`}
                >
                  <Icon name="edit"></Icon>
                  <span>Edit Group</span>
                </DropdownItem>
              </li>
              <li className="divider"></li>
              <li>
                <DropdownItem
                  tag="a"
                  href="#delete"
                  onClick={(ev) => {
                    ev.preventDefault();
                    setDeleteModal({
                      show: true,
                      groupId: row.id,
                      groupName: row.name
                    });
                  }}
                >
                  <Icon name="trash"></Icon>
                  <span>Delete Group</span>
                </DropdownItem>
              </li>
            </ul>
          </DropdownMenu>
        </UncontrolledDropdown>
      ),
      allowOverflow: true,
      button: true,
    },
  ];

  console.log(`🎨 RENDER: About to render ${groups.length} distribution groups`);

  return (
    <React.Fragment>
      <Head title="Admin - Distribution Groups"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                Distribution Groups
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Manage user groups for targeted communications and email distribution.</p>
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li className="nk-block-tools-opt">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleOpenCreatePanel}
                      >
                        <Icon name="plus"></Icon>
                        <span>Create Group</span>
                      </button>
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
                  <span className="sr-only">Loading distribution groups...</span>
                </div>
                <div className="mt-3">
                  <p className="text-soft">Loading distribution groups...</p>
                </div>
              </div>
            </div>
          </Block>
        ) : (
          <Block>
            <ReactDataTable
              data={groups}
              columns={groupColumns}
              pagination
              noDataComponent={
                <div className="text-center py-5">
                  <Icon name="users" className="display-1 text-muted mb-3"></Icon>
                  <h5 className="mt-3">No distribution groups found</h5>
                  <p className="text-muted">Create your first distribution group to get started.</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleOpenCreatePanel}
                  >
                    <Icon name="plus"></Icon>
                    <span>Create Group</span>
                  </button>
                </div>
              }
              className="nk-tb-list"
            />
          </Block>
        )}

        <ToastContainer />

        {/* Delete Confirmation Modal */}
        {deleteModal.show && (
          <>
            <div className="modal fade show" style={{ display: 'block' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Delete Distribution Group</h5>
                    <button 
                      type="button" 
                      className="btn-close"
                      onClick={() => setDeleteModal({ show: false, groupId: null, groupName: '' })}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="d-flex align-items-center mb-3">
                      <Icon name="alert-triangle" className="text-warning fs-3 me-3"></Icon>
                      <div>
                        <h6 className="mb-1">Are you sure you want to delete this group?</h6>
                        <p className="text-muted mb-0">
                          Group: <strong>{deleteModal.groupName}</strong>
                        </p>
                      </div>
                    </div>
                    <p className="text-muted">
                      This action cannot be undone. All group members will be removed from the group.
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setDeleteModal({ show: false, groupId: null, groupName: '' })}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger"
                      onClick={() => handleDelete(deleteModal.groupId)}
                    >
                      Delete Group
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-backdrop fade show"></div>
          </>
        )}

        {/* Create Distribution Group Panel */}
        <CreateDistributionGroupPanel
          isOpen={createPanelOpen}
          onClose={handleCloseCreatePanel}
          onGroupCreated={handleGroupCreated}
        />

        {/* Overlay for create panel */}
        {createPanelOpen && (
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
            onClick={handleCloseCreatePanel}
          />
        )}
      </Content>
    </React.Fragment>
  );
};

export default DistributionGroups;