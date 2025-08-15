import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Button as BootstrapButton
} from 'reactstrap';
import { Button, Icon } from "@/components/Component";

const AccessRequestDialog = ({ show, onHide, request, onApprove, onReject, processing }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [approvalData, setApprovalData] = useState({
    username: request ? `${request.firstName.toLowerCase()}.${request.lastName.toLowerCase()}` : '',
    role: 'user',
    password: ''
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [errors, setErrors] = useState({});

  // Update approval data when request changes
  useEffect(() => {
    if (request) {
      setApprovalData({
        username: `${request.firstName.toLowerCase()}.${request.lastName.toLowerCase()}`,
        role: 'user',
        password: ''
      });
      setRejectionReason('');
      setErrors({});
      setActiveTab('details');
    }
  }, [request]);

  const validateApprovalForm = () => {
    const newErrors = {};

    if (!approvalData.username || approvalData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!/^[a-zA-Z0-9._-]+$/.test(approvalData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, dots, hyphens, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRejectionForm = () => {
    const newErrors = {};

    if (!rejectionReason.trim()) {
      newErrors.reason = 'Please provide a reason for rejection';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = (e) => {
    e.preventDefault();
    if (validateApprovalForm()) {
      onApprove(approvalData);
    }
  };

  const handleReject = (e) => {
    e.preventDefault();
    if (validateRejectionForm()) {
      onReject(rejectionReason);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
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

  if (!request) {
    return null;
  }

  return (
    <Modal isOpen={show} toggle={onHide} size="lg" className="modal-dialog-scrollable">
      <ModalHeader toggle={onHide}>
        Access Request Details
      </ModalHeader>

      <ModalBody>
        {/* Tab Navigation */}
        <Nav tabs className="mb-4">
          <NavItem>
            <NavLink
              className={activeTab === 'details' ? 'active' : ''}
              onClick={() => setActiveTab('details')}
              style={{ cursor: 'pointer' }}
            >
              <Icon name="user-fill" className="me-2"></Icon>
              Request Details
            </NavLink>
          </NavItem>
          {request.status === 'pending' && (
            <>
              <NavItem>
                <NavLink
                  className={activeTab === 'approve' ? 'active' : ''}
                  onClick={() => setActiveTab('approve')}
                  style={{ cursor: 'pointer' }}
                >
                  <Icon name="check-circle" className="me-2"></Icon>
                  Approve
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === 'reject' ? 'active' : ''}
                  onClick={() => setActiveTab('reject')}
                  style={{ cursor: 'pointer' }}
                >
                  <Icon name="cross-circle" className="me-2"></Icon>
                  Reject
                </NavLink>
              </NavItem>
            </>
          )}
        </Nav>

        {/* Tab Content */}
        <TabContent activeTab={activeTab}>
          {/* Details Tab */}
          <TabPane tabId="details">
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-muted mb-3">PERSONAL INFORMATION</h6>
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-semibold" style={{ width: '40%' }}>First Name:</td>
                      <td>{request.firstName}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Last Name:</td>
                      <td>{request.lastName}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Email:</td>
                      <td className="text-break">{request.email}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Status:</td>
                      <td>
                        <span className={getStatusBadgeClass(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="col-md-6">
                <h6 className="text-muted mb-3">REQUEST INFORMATION</h6>
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td className="fw-semibold" style={{ width: '40%' }}>Submitted:</td>
                      <td>{formatDate(request.createdAt)}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Last Updated:</td>
                      <td>{formatDate(request.updatedAt)}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Processed:</td>
                      <td>{formatDate(request.processedAt)}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">Processed By:</td>
                      <td>{request.processedByUsername || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {request.reason && (
              <div className="mt-4">
                <h6 className="text-muted mb-2">REASON FOR ACCESS</h6>
                <div className="p-3 bg-light rounded">
                  {request.reason}
                </div>
              </div>
            )}

            {request.rejectionReason && (
              <div className="mt-4">
                <h6 className="text-muted mb-2">REJECTION REASON</h6>
                <div className="p-3 bg-danger-subtle rounded">
                  {request.rejectionReason}
                </div>
              </div>
            )}
          </TabPane>

          {/* Approve Tab */}
          {request.status === 'pending' && (
            <TabPane tabId="approve">
              <form onSubmit={handleApprove}>
                <div className="alert alert-info">
                  <Icon name="info" className="me-2"></Icon>
                  Approving this request will create a new user account for {request.firstName} {request.lastName}.
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="username" className="form-label">
                      Username <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                      id="username"
                      value={approvalData.username}
                      onChange={(e) => setApprovalData({
                        ...approvalData,
                        username: e.target.value
                      })}
                      placeholder="Enter username"
                      required
                    />
                    {errors.username && (
                      <div className="invalid-feedback">
                        {errors.username}
                      </div>
                    )}
                    <div className="form-text">
                      Username must be at least 3 characters and contain only letters, numbers, dots, hyphens, and underscores.
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="role" className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="role"
                      value={approvalData.role}
                      onChange={(e) => setApprovalData({
                        ...approvalData,
                        role: e.target.value
                      })}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Administrator</option>
                      <option value="readonly">Read-only</option>
                      <option value="guest">Guest</option>
                    </select>
                    <div className="form-text">
                      Select the appropriate role for this user.
                    </div>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="password" className="form-label">
                      Temporary Password
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={approvalData.password}
                      onChange={(e) => setApprovalData({
                        ...approvalData,
                        password: e.target.value
                      })}
                      placeholder="Leave blank for auto-generated password"
                    />
                    <div className="form-text">
                      If left blank, a temporary password will be generated automatically.
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => setActiveTab('details')}
                    disabled={processing}
                  >
                    Back to Details
                  </Button>
                  <Button
                    type="submit"
                    color="success"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icon name="check-circle" className="me-2"></Icon>
                        Approve & Create Account
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabPane>
          )}

          {/* Reject Tab */}
          {request.status === 'pending' && (
            <TabPane tabId="reject">
              <form onSubmit={handleReject}>
                <div className="alert alert-warning">
                  <Icon name="alert-triangle" className="me-2"></Icon>
                  Rejecting this request will notify {request.firstName} {request.lastName} via email.
                </div>

                <div className="mb-3">
                  <label htmlFor="rejectionReason" className="form-label">
                    Reason for Rejection <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`form-control ${errors.reason ? 'is-invalid' : ''}`}
                    id="rejectionReason"
                    rows="4"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejecting this access request..."
                    required
                  />
                  {errors.reason && (
                    <div className="invalid-feedback">
                      {errors.reason}
                    </div>
                  )}
                  <div className="form-text">
                    This reason will be included in the notification email sent to the requester.
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <Button
                    type="button"
                    color="secondary"
                    onClick={() => setActiveTab('details')}
                    disabled={processing}
                  >
                    Back to Details
                  </Button>
                  <Button
                    type="submit"
                    color="danger"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icon name="cross-circle" className="me-2"></Icon>
                        Reject Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabPane>
          )}
        </TabContent>
      </ModalBody>

      <ModalFooter>
        <Button 
          color="secondary"
          onClick={onHide}
          disabled={processing}
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AccessRequestDialog;