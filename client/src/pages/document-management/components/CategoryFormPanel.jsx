import React, { useState, useEffect } from 'react';
import {
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Spinner
} from 'reactstrap';
import { Icon } from '@/components/Component';
import SlideOutPanel from '@/components/partials/SlideOutPanel';
import { toast } from 'react-toastify';
import "../../assets/components/AssetSlideOutPanels.css";

const CategoryFormPanel = ({ 
  isOpen, 
  onClose, 
  categoryData, 
  parentCategory = null,
  onSave,
  availableParents = []
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parentId: '',
    status: 'active'
  });
  const [errors, setErrors] = useState({});

  // Determine if we're editing or creating
  const isEditing = Boolean(categoryData);
  const isSubcategory = Boolean(parentCategory);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && categoryData) {
        // Editing existing category
        setFormData({
          name: categoryData.name || '',
          description: categoryData.description || '',
          parentId: categoryData.parentId || '',
          status: categoryData.status || 'active'
        });
      } else if (isSubcategory && parentCategory) {
        // Creating subcategory
        setFormData({
          name: '',
          description: '',
          parentId: parentCategory.id.toString(),
          status: 'active'
        });
      } else {
        // Creating new root category
        setFormData({
          name: '',
          description: '',
          parentId: '',
          status: 'active'
        });
      }
      setErrors({});
    }
  }, [isOpen, categoryData, parentCategory, isEditing, isSubcategory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const categoryPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
        status: formData.status
      };

      if (isEditing) {
        categoryPayload.id = categoryData.id;
      }

      // Call the parent's save handler
      await onSave(categoryPayload, isEditing);
      
      toast.success(isEditing ? 'Category updated successfully' : 'Category created successfully');
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      parentId: '',
      status: 'active'
    });
    setErrors({});
    onClose();
  };

  const getTitle = () => {
    if (isEditing) return 'Edit Category';
    if (isSubcategory) return 'Add Subcategory';
    return 'Add Category';
  };

  const getSubtitle = () => {
    if (isEditing) return categoryData?.name;
    if (isSubcategory) return `Under ${parentCategory?.name}`;
    return 'Create new category';
  };

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      subtitle={getSubtitle()}
      size="md"
    >
      <div className="asset-panel-container">
        {loading && (
          <div className="panel-loading">
            <Spinner color="primary" />
            <p className="panel-text-muted">
              {isEditing ? 'Updating category...' : 'Creating category...'}
            </p>
          </div>
        )}

        {!loading && (
          <div>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="mb-0">
                <Icon name={isEditing ? "edit" : "plus"} className="me-2"></Icon>
                Category Information
              </h5>
            </div>

            {/* Form Section */}
            <Form className="panel-form">
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label
                      for="name"
                      style={{ fontSize: '0.875rem', fontWeight: '500' }}
                    >
                      Category Name *
                    </Label>
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter category name..."
                      invalid={!!errors.name}
                      style={{ fontSize: '0.875rem' }}
                    />
                    {errors.name && (
                      <div className="invalid-feedback" style={{ fontSize: '0.75rem' }}>
                        {errors.name}
                      </div>
                    )}
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label
                      for="description"
                      style={{ fontSize: '0.875rem', fontWeight: '500' }}
                    >
                      Description
                    </Label>
                    <Input
                      type="textarea"
                      name="description"
                      id="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter category description..."
                      invalid={!!errors.description}
                      style={{ fontSize: '0.875rem' }}
                    />
                    {errors.description && (
                      <div className="invalid-feedback" style={{ fontSize: '0.75rem' }}>
                        {errors.description}
                      </div>
                    )}
                    <small className="form-text text-muted">
                      {formData.description.length}/500 characters
                    </small>
                  </FormGroup>
                </Col>
              </Row>

              {!isSubcategory && (
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label
                        for="parentId"
                        style={{ fontSize: '0.875rem', fontWeight: '500' }}
                      >
                        Parent Category
                      </Label>
                      <Input
                        type="select"
                        name="parentId"
                        id="parentId"
                        value={formData.parentId}
                        onChange={handleInputChange}
                        style={{ fontSize: '0.875rem' }}
                      >
                        <option value="">Root Category (No Parent)</option>
                        {availableParents.map(parent => (
                          <option key={parent.id} value={parent.id}>
                            {parent.name}
                          </option>
                        ))}
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>
              )}

              {isSubcategory && parentCategory && (
                <Row>
                  <Col md={12}>
                    <FormGroup>
                      <Label style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                        Parent Category
                      </Label>
                      <div className="p-2 bg-light rounded">
                        <Icon name="folder" className="me-2 text-primary"></Icon>
                        <span style={{ fontSize: '0.875rem', fontWeight: 'normal' }}>
                          {parentCategory.name}
                        </span>
                      </div>
                    </FormGroup>
                  </Col>
                </Row>
              )}

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label
                      for="status"
                      style={{ fontSize: '0.875rem', fontWeight: '500' }}
                    >
                      Status
                    </Label>
                    <Input
                      type="select"
                      name="status"
                      id="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      style={{ fontSize: '0.875rem' }}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              {/* Action Buttons */}
              <div className="panel-actions d-flex gap-2 mt-4">
                <Button
                  color="primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Icon name="check" className="me-1"></Icon>
                  {isEditing ? 'Update Category' : 'Create Category'}
                </Button>
                <Button
                  color="secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <Icon name="cross" className="me-1"></Icon>
                  Cancel
                </Button>
              </div>
            </Form>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-light rounded">
              <h6 className="mb-2" style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                <Icon name="info" className="me-2 text-info"></Icon>
                Category Guidelines
              </h6>
              <ul className="mb-0" style={{ fontSize: '0.75rem' }}>
                <li>Category names should be descriptive and unique</li>
                <li>Use subcategories to create hierarchical organization</li>
                <li>Active categories can be used for document assignment</li>
                <li>Draft categories are only visible to administrators</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </SlideOutPanel>
  );
};

export default CategoryFormPanel;