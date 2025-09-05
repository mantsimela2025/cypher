import React, { useState } from "react";
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
  Alert,
} from "reactstrap";
import { useForm } from "react-hook-form";
import { Icon } from "@/components/Component";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const CreateDistributionGroupPanel = ({ isOpen, onClose, onGroupCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: data.name.trim(),
        description: data.description.trim() || null,
      };

      log.api('Creating distribution group:', payload.name);
      const result = await apiClient.post('/admin/distribution-groups', payload);

      if (result.success) {
        // Call the callback to refresh the main list
        onGroupCreated && onGroupCreated(result.data);
        reset();
        onClose();

        // Optional: Navigate to member management for the new group
        if (result.data && result.data.id) {
          setTimeout(() => {
            navigate(`/admin/distribution-groups/${result.data.id}/members`);
          }, 100);
        }
        log.info('Distribution group created successfully:', payload.name);
      } else {
        throw new Error(result.message || 'Failed to create distribution group');
      }
    } catch (err) {
      log.error('Error creating distribution group:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form and error when panel opens
  React.useEffect(() => {
    if (isOpen) {
      reset();
      setError(null);
    }
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="lg">
      <ModalHeader toggle={onClose}>
        <Icon name="plus" className="me-2"></Icon>
        Create Distribution Group
      </ModalHeader>
      <ModalBody>
        <div className="mb-3">
          <p className="text-soft">
            Create a new group for targeted communications and email distribution.
          </p>
        </div>

        {error && (
          <Alert color="danger" className="mb-3">
            <Icon name="alert-circle" className="me-2"></Icon>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup className="mb-4">
            <Label for="groupName" className="form-label">
              Group Name <span className="text-danger">*</span>
            </Label>
            <Input
              type="text"
              id="groupName"
              placeholder="Enter group name..."
              {...register("name", {
                required: "Group name is required",
                minLength: {
                  value: 3,
                  message: "Group name must be at least 3 characters"
                },
                maxLength: {
                  value: 100,
                  message: "Group name cannot exceed 100 characters"
                }
              })}
              invalid={!!errors.name}
              className="form-control-lg"
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name.message}</div>
            )}
            <div className="form-note mt-1">
              <small className="text-soft">
                Enter a descriptive name for the distribution group (3-100 characters)
              </small>
            </div>
          </FormGroup>

          <FormGroup className="mb-4">
            <Label for="groupDescription" className="form-label">
              Description
            </Label>
            <Input
              type="textarea"
              id="groupDescription"
              placeholder="Enter group description..."
              rows="4"
              {...register("description", {
                maxLength: {
                  value: 500,
                  message: "Description cannot exceed 500 characters"
                }
              })}
              invalid={!!errors.description}
              className="form-control-lg"
            />
            {errors.description && (
              <div className="invalid-feedback">{errors.description.message}</div>
            )}
            <div className="form-note mt-1">
              <small className="text-soft">
                Optional description of the group's purpose (max 500 characters)
              </small>
            </div>
          </FormGroup>

          <ModalFooter className="px-0 pb-0">
            <Button 
              type="button" 
              color="secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              color="primary"
              disabled={loading}
              className="btn-lg"
            >
              {loading ? (
                <>
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Creating...</span>
                  </div>
                  Creating Group...
                </>
              ) : (
                <>
                  <Icon name="check" className="me-2"></Icon>
                  Create Group
                </>
              )}
            </Button>
          </ModalFooter>
        </Form>
      </ModalBody>
    </Modal>
  );
};

export default CreateDistributionGroupPanel;