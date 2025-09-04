/**
 * RMF Wizard - Project Setup Step
 * Clean, focused form for basic project information
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Input } from "reactstrap";
import { Icon, RSelect } from "@/components/Component";

const ProjectSetupStep = ({ 
  stepData = {}, 
  onDataChange, 
  canProceed 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: '',
    sponsorOrg: '',
    dueDate: '',
    environment: 'cloud',
    priority: 'medium',
    ...stepData
  });

  const [errors, setErrors] = useState({});

  // Environment options
  const environmentOptions = [
    { value: 'cloud', label: 'Cloud Environment' },
    { value: 'on-premise', label: 'On-Premise' },
    { value: 'hybrid', label: 'Hybrid Cloud' },
    { value: 'saas', label: 'Software as a Service' },
    { value: 'other', label: 'Other' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'critical', label: 'Critical' }
  ];

  // Update parent when form data changes
  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  // Validate form
  useEffect(() => {
    const newErrors = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (!formData.owner?.trim()) {
      newErrors.owner = 'Project owner is required';
    }

    setErrors(newErrors);
  }, [formData]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle select changes
   */
  const handleSelectChange = (field, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [field]: selectedOption?.value || ''
    }));
  };

  return (
    <div className="project-setup-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="setting" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">Project Setup</h6>
            <p className="text-soft mb-0">
              Let's start by gathering basic information about your RMF project
            </p>
          </div>
        </div>
      </div>

      {/* Project Information Form */}
      <Row className="g-4">
        
        {/* Project Name */}
        <Col md="6">
          <FormGroup>
            <Label className="form-label" htmlFor="project-name">
              Project Name *
            </Label>
            <Input
              type="text"
              id="project-name"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              invalid={!!errors.name}
            />
            {errors.name && (
              <div className="invalid-feedback">{errors.name}</div>
            )}
          </FormGroup>
        </Col>

        {/* Project Owner */}
        <Col md="6">
          <FormGroup>
            <Label className="form-label" htmlFor="project-owner">
              Project Owner *
            </Label>
            <Input
              type="text"
              id="project-owner"
              placeholder="Enter project owner name"
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              invalid={!!errors.owner}
            />
            {errors.owner && (
              <div className="invalid-feedback">{errors.owner}</div>
            )}
          </FormGroup>
        </Col>

        {/* Project Description */}
        <Col md="12">
          <FormGroup>
            <Label className="form-label" htmlFor="project-description">
              Project Description *
            </Label>
            <Input
              type="textarea"
              id="project-description"
              placeholder="Describe the purpose and scope of this RMF project"
              rows="3"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              invalid={!!errors.description}
            />
            {errors.description && (
              <div className="invalid-feedback">{errors.description}</div>
            )}
          </FormGroup>
        </Col>

        {/* Sponsor Organization */}
        <Col md="6">
          <FormGroup>
            <Label className="form-label" htmlFor="sponsor-org">
              Sponsor Organization
            </Label>
            <Input
              type="text"
              id="sponsor-org"
              placeholder="Enter sponsor organization"
              value={formData.sponsorOrg}
              onChange={(e) => handleInputChange('sponsorOrg', e.target.value)}
            />
          </FormGroup>
        </Col>

        {/* Target Authorization Date */}
        <Col md="6">
          <FormGroup>
            <Label className="form-label" htmlFor="due-date">
              Target Authorization Date
            </Label>
            <Input
              type="date"
              id="due-date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
            />
          </FormGroup>
        </Col>

        {/* Environment Type */}
        <Col md="6">
          <FormGroup>
            <Label className="form-label">Environment Type</Label>
            <RSelect
              options={environmentOptions}
              value={environmentOptions.find(opt => opt.value === formData.environment)}
              onChange={(option) => handleSelectChange('environment', option)}
              placeholder="Select environment type"
            />
          </FormGroup>
        </Col>

        {/* Priority Level */}
        <Col md="6">
          <FormGroup>
            <Label className="form-label">Priority Level</Label>
            <RSelect
              options={priorityOptions}
              value={priorityOptions.find(opt => opt.value === formData.priority)}
              onChange={(option) => handleSelectChange('priority', option)}
              placeholder="Select priority level"
            />
          </FormGroup>
        </Col>

      </Row>

      {/* Step Summary */}
      <div className="step-summary mt-5 p-4 bg-light rounded">
        <h6 className="mb-3">
          <Icon name="info" className="me-2"></Icon>
          What's Next?
        </h6>
        <p className="mb-2">
          After completing the project setup, you'll move on to:
        </p>
        <ul className="list-unstyled mb-0">
          <li className="mb-1">
            <Icon name="check-circle" className="text-success me-2"></Icon>
            <strong>System Identification:</strong> Define system boundaries and components
          </li>
          <li className="mb-1">
            <Icon name="check-circle" className="text-success me-2"></Icon>
            <strong>System Categorization:</strong> Determine impact levels using FIPS 199
          </li>
          <li className="mb-1">
            <Icon name="check-circle" className="text-success me-2"></Icon>
            <strong>Control Selection:</strong> Choose appropriate security controls
          </li>
        </ul>
      </div>

      {/* Validation Status */}
      {!canProceed && (
        <div className="validation-status mt-3">
          <div className="alert alert-warning d-flex align-items-center">
            <Icon name="alert-triangle" className="me-2"></Icon>
            Please complete all required fields to continue
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectSetupStep;
