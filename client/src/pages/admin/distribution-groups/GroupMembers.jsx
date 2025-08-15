import React, { useState, useEffect } from 'react';
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import { Link, useParams } from 'react-router-dom';
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  Button,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
  PaginationComponent,
  RSelect,
  Row,
  Col,
  UserAvatar,
} from "@/components/Component";
import {
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  DropdownItem,
  UncontrolledTooltip,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from "reactstrap";

const GroupMembers = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemPerPage, setItemPerPage] = useState(10);

  useEffect(() => {
    fetchGroupData();
    fetchMembers();
  }, [id]);

  const fetchGroupData = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/admin/distribution-groups/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setGroup(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch group');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/v1/admin/distribution-groups/${id}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      
      if (data.success) {
        setMembers(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch members');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async (search = '') => {
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/admin/distribution-groups/${id}/available-users${params}`);
      const data = await response.json();
      
      if (data.success) {
        setAvailableUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch available users:', err);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUserId) return;
    
    try {
      setAddingUser(true);
      const response = await fetch(`/api/admin/distribution-groups/${id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: parseInt(selectedUserId) })
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchMembers(); // Refresh members list
        setShowAddModal(false);
        setSelectedUserId('');
        setAvailableUsers([]);
        setUserSearchTerm('');
      } else {
        throw new Error(data.error || 'Failed to add user');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to remove ${username} from this group?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/distribution-groups/${id}/members/${userId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMembers(members.filter(member => member.userId !== userId));
      } else {
        throw new Error(data.error || 'Failed to remove user');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const openAddModal = () => {
    setShowAddModal(true);
    fetchAvailableUsers();
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedUserId('');
    setAvailableUsers([]);
    setUserSearchTerm('');
  };

  const handleUserSearch = (searchValue) => {
    setUserSearchTerm(searchValue);
    fetchAvailableUsers(searchValue);
  };

  const filteredMembers = members.filter(member =>
    (member.username && member.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.firstName && member.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (member.lastName && member.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const indexOfLastItem = currentPage * itemPerPage;
  const indexOfFirstItem = indexOfLastItem - itemPerPage;
  const currentItems = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);
  const totalItems = filteredMembers.length;

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getInitials = (firstName, lastName, username) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (member) => {
    if (member.firstName || member.lastName) {
      return `${member.firstName || ''} ${member.lastName || ''}`.trim();
    }
    return member.username || 'Unknown User';
  };

  const getBadgeColor = (role) => {
    const colorMap = {
      admin: 'danger',
      moderator: 'warning',
      user: 'primary',
    };
    return colorMap[role] || 'secondary';
  };

  if (loading && !group) {
    return (
      <React.Fragment>
        <Head title="Admin - Group Members"></Head>
        <Content>
          <div className="d-flex justify-content-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </Content>
      </React.Fragment>
    );
  }

  if (!group) {
    return (
      <React.Fragment>
        <Head title="Admin - Group Members"></Head>
        <Content>
          <Block>
            <div className="alert alert-danger">
              <Icon name="alert-triangle"></Icon>
              <span className="ms-2">Distribution group not found.</span>
            </div>
            <Link to="/admin/distribution-groups" className="btn btn-outline-light">
              <Icon name="arrow-left"></Icon>
              <span>Back to Groups</span>
            </Link>
          </Block>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="Admin - Group Members"></Head>
      <Content>
        {/* Header */}
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <div className="d-flex align-items-center mb-3">
                <Link 
                  to="/admin/distribution-groups" 
                  className="btn btn-outline-light btn-sm me-3"
                >
                  <Icon name="arrow-left"></Icon>
                </Link>
                <div className="flex-grow-1">
                  <BlockTitle tag="h3" page>
                    Group Members
                  </BlockTitle>
                  <BlockDes className="text-soft">
                    <p>Managing members for: <strong>{group.name}</strong></p>
                  </BlockDes>
                </div>
                <Button 
                  color="primary"
                  onClick={openAddModal}
                >
                  <Icon name="user-add"></Icon>
                  <span>Add Member</span>
                </Button>
              </div>
              
              {group.description && (
                <div className="alert alert-info">
                  <Icon name="info"></Icon>
                  <span className="ms-2">{group.description}</span>
                </div>
              )}
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Error Alert */}
        {error && (
          <Block>
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <Icon name="alert-triangle"></Icon>
              <span className="ms-2">{error}</span>
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          </Block>
        )}

        <Block>
          <DataTable className="card-stretch">
            <div className="card-inner position-relative card-tools-toggle">
              <div className="card-title-group">
                <div className="card-tools">
                  <div className="form-inline flex-nowrap gx-3">
                    <div className="form-wrap w-150px">
                      <div className="form-icon form-icon-right">
                        <Icon name="search"></Icon>
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="card-tools me-n1">
                  <ul className="btn-toolbar gx-1">
                    <li>
                      <span className="text-muted">
                        {currentItems.length} of {members.length} members
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <DataTableBody>
              <DataTableHead className="nk-tb-head">
                <DataTableRow>
                  <span className="sub-text">User</span>
                </DataTableRow>
                <DataTableRow size="md">
                  <span className="sub-text">Email</span>
                </DataTableRow>
                <DataTableRow size="sm">
                  <span className="sub-text">Role</span>
                </DataTableRow>
                <DataTableRow size="md">
                  <span className="sub-text">Added</span>
                </DataTableRow>
                <DataTableRow className="nk-tb-col-tools text-end">
                  <span className="sub-text">Actions</span>
                </DataTableRow>
              </DataTableHead>
              
              {loading ? (
                <DataTableItem>
                  <DataTableRow colSpan="5">
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  </DataTableRow>
                </DataTableItem>
              ) : currentItems.length === 0 ? (
                <DataTableItem>
                  <DataTableRow colSpan="5">
                    <div className="text-center py-5">
                      <Icon name="users" className="display-1 text-muted mb-3"></Icon>
                      <h5 className="mt-3">
                        {searchTerm ? 'No members found' : 'No members in this group'}
                      </h5>
                      <p className="text-muted">
                        {searchTerm 
                          ? 'Try adjusting your search criteria.'
                          : 'Add users to this group to get started.'
                        }
                      </p>
                      {!searchTerm && (
                        <Button 
                          color="primary"
                          onClick={openAddModal}
                        >
                          <Icon name="user-add"></Icon>
                          <span>Add First Member</span>
                        </Button>
                      )}
                    </div>
                  </DataTableRow>
                </DataTableItem>
              ) : (
                currentItems.map((member) => (
                  <DataTableItem key={member.id}>
                    <DataTableRow>
                      <div className="user-card">
                        <UserAvatar
                          theme="primary"
                          text={getInitials(member.firstName, member.lastName, member.username)}
                          className="sm"
                        />
                        <div className="user-info">
                          <span className="tb-lead">{getDisplayName(member)}</span>
                          <span className="fs-12px text-muted">@{member.username}</span>
                        </div>
                      </div>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className="text-muted">
                        {member.email || 'No email'}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="sm">
                      <span className={`badge badge-${getBadgeColor(member.role)}`}>
                        {member.role || 'User'}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className="text-muted">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools">
                      <ul className="nk-tb-actions gx-1">
                        <li>
                          <Button
                            size="sm"
                            color="outline-danger"
                            id={`remove-${member.userId}`}
                            onClick={() => handleRemoveUser(member.userId, member.username)}
                          >
                            <Icon name="user-cross"></Icon>
                          </Button>
                          <UncontrolledTooltip placement="top" target={`remove-${member.userId}`}>
                            Remove from group
                          </UncontrolledTooltip>
                        </li>
                      </ul>
                    </DataTableRow>
                  </DataTableItem>
                ))
              )}
            </DataTableBody>
            
            {currentItems.length > 0 && (
              <div className="card-inner">
                <PaginationComponent
                  itemPerPage={itemPerPage}
                  totalItems={totalItems}
                  paginate={paginate}
                  currentPage={currentPage}
                />
              </div>
            )}
          </DataTable>
        </Block>

        {/* Add Member Modal */}
        <Modal isOpen={showAddModal} toggle={closeAddModal}>
          <ModalHeader toggle={closeAddModal}>Add Member to Group</ModalHeader>
          <ModalBody>
            <div className="form-group">
              <label className="form-label">Search Users</label>
              <div className="form-control-wrap">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by username, email, or name..."
                  value={userSearchTerm}
                  onChange={(e) => handleUserSearch(e.target.value)}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Select User</label>
              <div className="form-control-wrap">
                <RSelect
                  options={availableUsers.map(user => ({
                    value: user.id,
                    label: `${user.username} - ${user.email} (${user.role})`
                  }))}
                  placeholder="Choose a user..."
                  value={availableUsers.find(u => u.id.toString() === selectedUserId) ? 
                    {
                      value: selectedUserId,
                      label: availableUsers.find(u => u.id.toString() === selectedUserId)?.username
                    } : null
                  }
                  onChange={(selected) => setSelectedUserId(selected ? selected.value.toString() : '')}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="secondary" onClick={closeAddModal}>
              Cancel
            </Button>
            <Button 
              color="primary"
              onClick={handleAddUser}
              disabled={!selectedUserId || addingUser}
            >
              {addingUser ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Adding...
                </>
              ) : (
                <>
                  <Icon name="user-add"></Icon>
                  <span>Add Member</span>
                </>
              )}
            </Button>
          </ModalFooter>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default GroupMembers;