import React, { useState, useEffect } from "react";
import { Row, Col, Label, Form, Spinner } from "reactstrap";
import { useForm } from "react-hook-form";
import {
  Button,
  Icon,
  RSelect,
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
} from "@/components/Component";
import SimpleBar from "simplebar-react";
import classNames from "classnames";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const EditUserPanel = ({ isOpen, onClose, userId, onUserUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm();

  // Watch auth method changes
  const watchAuthMethod = watch('authMethod');

  // Role options
  const roleOptions = [
    { value: "user", label: "User" },
    { value: "admin", label: "Administrator" },
    { value: "moderator", label: "Moderator" },
  ];

  // Status options
  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  // Auth method options
  const authMethodOptions = [
    { value: "password", label: "Password" },
    { value: "certificate", label: "Certificate" },
    { value: "sso", label: "Single Sign-On" },
  ];

  // Fetch user data when panel opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    } else if (!isOpen) {
      // Reset state when panel closes
      setUserData(null);
      setSelectedRole(null);
      setSelectedStatus(null);
      setSelectedAuthMethod(null);
      reset();
    }
  }, [isOpen, userId, reset]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      log.api('Fetching user data for editing:', userId);
      const result = await apiClient.get(`/users/${userId}`);

      if (result.success) {
        setUserData(result.data);

        // Set select states
        setSelectedRole(roleOptions.find(option => option.value === result.data.role));
        setSelectedStatus(statusOptions.find(option => option.value === result.data.status));
        setSelectedAuthMethod(authMethodOptions.find(option => option.value === result.data.authMethod));

        // Populate form with user data
        reset({
          email: result.data.email,
          username: result.data.username,
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          role: result.data.role,
          status: result.data.status,
          authMethod: result.data.authMethod,
          certificateSubject: result.data.certificateSubject || '',
        });
        log.info('User data loaded for editing:', result.data.email);
      }
    } catch (error) {
      log.error('Error fetching user data:', error.message);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  const onFormSubmit = async (formData) => {
    setUpdating(true);
    try {
      // Prepare update data (exclude password if empty)
      const updateData = {
        email: formData.email,
        username: formData.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        status: formData.status,
        authMethod: formData.authMethod,
      };

      // Only include certificate subject if auth method is certificate
      if (formData.authMethod === 'certificate' && formData.certificateSubject) {
        updateData.certificateSubject = formData.certificateSubject;
      }

      // Only include password if provided
      if (formData.password && formData.password.trim() !== '') {
        updateData.password = formData.password;
      }

      log.api('Updating user:', userId, updateData.email);
      const result = await apiClient.put(`/users/${userId}`, updateData);

      if (result.success) {
        // Call the callback to refresh the user list
        if (onUserUpdated) {
          onUserUpdated();
        }
        onClose();
        log.info('User updated successfully:', updateData.email);
        // You might want to show a success toast notification here
      }
    } catch (error) {
      log.error('Error updating user:', error.message);
      // You might want to show an error toast notification here
    } finally {
      setUpdating(false);
    }
  };

  const formClass = classNames({
    "form-validate": true,
    "is-alter": true, // Use alternate validation style
  });

  return (
    <SimpleBar
      className={`nk-add-product toggle-slide toggle-slide-right toggle-screen-any ${
        isOpen ? "content-active" : ""
      }`}
      style={{
        height: '100vh',
        backgroundColor: '#fff',
        width: '520px',
        boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.1)'
      }}
    >
      <BlockHead>
        <BlockHeadContent>
          <BlockTitle tag="h5">
            <Icon name="edit-alt" className="me-2"></Icon>
            Edit User
          </BlockTitle>
          <BlockDes>
            <p>Update user information and settings.</p>
          </BlockDes>
        </BlockHeadContent>
        <div className="nk-block-head-tools">
          <Button
            size="sm"
            className="btn-icon btn-trigger"
            color="light"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              zIndex: 1
            }}
          >
            <Icon name="cross"></Icon>
          </Button>
        </div>
      </BlockHead>

      <Block>
        {loading ? (
          <div className="text-center py-4">
            <Spinner color="primary" />
            <p className="mt-2">Loading user data...</p>
          </div>
        ) : userData ? (
            <Form className={formClass} onSubmit={handleSubmit(onFormSubmit)}>
              <Row className="g-4">
                <Col lg="6">
                  <div className="form-group">
                    <Label className="form-label" htmlFor="edit-email">
                      Email Address *
                    </Label>
                    <div className="form-control-wrap">
                      <input
                        type="email"
                        id="edit-email"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className="form-control"
                      />
                      {errors.email && <span className="invalid">{errors.email.message}</span>}
                    </div>
                  </div>
                </Col>
                <Col lg="6">
                  <div className="form-group">
                    <Label className="form-label" htmlFor="edit-username">
                      Username *
                    </Label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        id="edit-username"
                        {...register('username', {
                          required: 'Username is required',
                          minLength: {
                            value: 3,
                            message: 'Username must be at least 3 characters',
                          },
                        })}
                        className="form-control"
                      />
                      {errors.username && <span className="invalid">{errors.username.message}</span>}
                    </div>
                  </div>
                </Col>
                <Col lg="6">
                  <div className="form-group">
                    <Label className="form-label" htmlFor="edit-firstName">
                      First Name
                    </Label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        id="edit-firstName"
                        {...register('firstName')}
                        className="form-control"
                      />
                    </div>
                  </div>
                </Col>
                <Col lg="6">
                  <div className="form-group">
                    <Label className="form-label" htmlFor="edit-lastName">
                      Last Name
                    </Label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        id="edit-lastName"
                        {...register('lastName')}
                        className="form-control"
                      />
                    </div>
                  </div>
                </Col>
                <Col lg="6">
                  <div className="form-group">
                    <Label className="form-label">Role *</Label>
                    <div className="form-control-wrap">
                      <RSelect
                        options={roleOptions}
                        value={selectedRole}
                        onChange={(selectedOption) => {
                          setSelectedRole(selectedOption);
                          setValue('role', selectedOption.value);
                        }}
                      />
                      {errors.role && <span className="invalid">{errors.role.message}</span>}
                    </div>
                  </div>
                </Col>
                <Col lg="6">
                  <div className="form-group">
                    <Label className="form-label">Status *</Label>
                    <div className="form-control-wrap">
                      <RSelect
                        options={statusOptions}
                        value={selectedStatus}
                        onChange={(selectedOption) => {
                          setSelectedStatus(selectedOption);
                          setValue('status', selectedOption.value);
                        }}
                      />
                      {errors.status && <span className="invalid">{errors.status.message}</span>}
                    </div>
                  </div>
                </Col>
                <Col lg="12">
                  <div className="form-group">
                    <Label className="form-label">Authentication Method</Label>
                    <div className="form-control-wrap">
                      <RSelect
                        options={authMethodOptions}
                        value={selectedAuthMethod}
                        onChange={(selectedOption) => {
                          setSelectedAuthMethod(selectedOption);
                          setValue('authMethod', selectedOption.value);
                        }}
                      />
                    </div>
                  </div>
                </Col>
                {selectedAuthMethod?.value === 'certificate' && (
                  <Col lg="12">
                    <div className="form-group">
                      <Label className="form-label" htmlFor="edit-certificateSubject">
                        Certificate Subject
                      </Label>
                      <div className="form-control-wrap">
                        <input
                          type="text"
                          id="edit-certificateSubject"
                          {...register('certificateSubject')}
                          className="form-control"
                          placeholder="Certificate subject DN"
                        />
                      </div>
                    </div>
                  </Col>
                )}
                <Col lg="12">
                  <div className="form-group">
                    <Label className="form-label" htmlFor="edit-password">
                      New Password
                    </Label>
                    <div className="form-control-wrap">
                      <input
                        type="password"
                        id="edit-password"
                        {...register('password', {
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                        })}
                        className="form-control"
                        placeholder="Leave blank to keep current password"
                      />
                      {errors.password && <span className="invalid">{errors.password.message}</span>}
                    </div>
                    <div className="form-note">
                      Leave blank to keep the current password. New password must be at least 8 characters.
                    </div>
                  </div>
                </Col>
              </Row>

              <div className="form-group mt-4">
                <Button type="submit" color="primary" disabled={updating}>
                  {updating ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Icon name="check"></Icon>
                      Update User
                    </>
                  )}
                </Button>
                <Button type="button" color="gray" className="ms-2" onClick={onClose}>
                  Cancel
                </Button>
              </div>
          </Form>
        ) : (
          <div className="text-center py-4">
            <p>Failed to load user data</p>
          </div>
        )}
      </Block>
    </SimpleBar>
  );
};

export default EditUserPanel;
