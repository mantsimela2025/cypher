import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Alert,
} from "reactstrap";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/Component";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const AddUserPanel = ({ isOpen, onClose, onUserAdded }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
      status: "active",
    },
  });

  // Static roles for simple role-based system
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);

      // Simulate API delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Static roles for the simple role-based system
      const staticRoles = [
        {
          id: 1,
          name: 'user',
          description: 'Standard user with read access and limited write permissions'
        },
        {
          id: 2,
          name: 'admin',
          description: 'Administrator with full system access and management capabilities'
        },
        {
          id: 3,
          name: 'moderator',
          description: 'Moderator with limited administrative access for content moderation'
        }
      ];

      setRoles(staticRoles);
    } catch (error) {
      log.error('Error loading roles:', error.message);
      // Fallback roles
      setRoles([
        { id: 1, name: 'user', description: 'Regular user' },
        { id: 2, name: 'moderator', description: 'Moderator user' },
        { id: 3, name: 'admin', description: 'Administrator' }
      ]);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
        status: data.status,
      };

      log.api('Creating new user:', payload.email);
      const result = await apiClient.post('/users', payload);

      if (result.success) {
        onUserAdded(result.data);
        reset();
        onClose();
        log.info('User created successfully:', payload.email);
      } else {
        throw new Error(result.message || "Failed to create user");
      }
    } catch (error) {
      log.error("Error creating user:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>Add New User</ModalHeader>
      <ModalBody>
        {error && (
          <Alert color="danger" className="mb-3">
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="firstName">First Name</Label>
                <Input
                  type="text"
                  id="firstName"
                  {...register("firstName", { required: "First name is required" })}
                  invalid={!!errors.firstName}
                  value={watch("firstName")}
                  onChange={(e) => setValue("firstName", e.target.value)}
                />
                {errors.firstName && <span className="invalid-feedback">{errors.firstName.message}</span>}
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="lastName">Last Name</Label>
                <Input
                  type="text"
                  id="lastName"
                  {...register("lastName", { required: "Last name is required" })}
                  invalid={errors.lastName}
                />
                {errors.lastName && <span className="invalid-feedback">{errors.lastName.message}</span>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="username">Username</Label>
                <Input
                  type="text"
                  id="username"
                  {...register("username", { required: "Username is required" })}
                  invalid={errors.username}
                />
                {errors.username && <span className="invalid-feedback">{errors.username.message}</span>}
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  invalid={errors.email}
                />
                {errors.email && <span className="invalid-feedback">{errors.email.message}</span>}
              </FormGroup>
            </Col>
          </Row>
          <Row>
            <Col md="6">
              <FormGroup>
                <Label for="role">Role</Label>
                <Input
                  type="select"
                  id="role"
                  {...register("role", { required: "Role is required" })}
                  invalid={errors.role}
                  disabled={loadingRoles}
                >
                  {loadingRoles ? (
                    <option value="">Loading roles...</option>
                  ) : roles.length > 0 ? (
                    roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        {role.description && ` - ${role.description}`}
                      </option>
                    ))
                  ) : (
                    <option value="">No roles available</option>
                  )}
                </Input>
                {errors.role && <span className="invalid-feedback">{errors.role.message}</span>}
              </FormGroup>
            </Col>
            <Col md="6">
              <FormGroup>
                <Label for="status">Status</Label>
                <Input
                  type="select"
                  id="status"
                  {...register("status", { required: "Status is required" })}
                  invalid={errors.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </Input>
                {errors.status && <span className="invalid-feedback">{errors.status.message}</span>}
              </FormGroup>
            </Col>
          </Row>
          <ModalFooter>
            <Button color="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </ModalFooter>
        </Form>
      </ModalBody>
    </Modal>
  );
};

export default AddUserPanel;
