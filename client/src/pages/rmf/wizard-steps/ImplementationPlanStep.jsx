/**
 * RMF Wizard - Implementation Plan Step
 * Plan for implementing selected security controls
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Input, Button, Alert } from "reactstrap";
import { Icon } from "@/components/Component";

const ImplementationPlanStep = ({ 
  stepData = {}, 
  allStepData = {},
  onDataChange, 
  canProceed 
}) => {
  const [implementationPlan, setImplementationPlan] = useState(stepData.implementationPlan || {
    timeline: '',
    resources: '',
    milestones: '',
    responsibilities: '',
    budget: '',
    risks: ''
  });

  // Get selected controls from previous step
  const selectedControls = allStepData[3]?.controls?.filter(c => c.selected) || [];

  // Update parent when plan changes
  useEffect(() => {
    onDataChange({ implementationPlan });
  }, [implementationPlan, onDataChange]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setImplementationPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="implementation-plan-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="clipboard" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">Implementation Plan</h6>
            <p className="text-soft mb-0">
              Create a detailed plan for implementing the selected security controls
            </p>
          </div>
        </div>
      </div>

      {/* Controls Summary */}
      <div className="controls-summary mb-4 p-3 bg-light rounded">
        <h6 className="mb-2">Selected Controls Summary</h6>
        <p className="mb-0 text-soft">
          {selectedControls.length} security controls selected for implementation
        </p>
      </div>

      {/* Implementation Plan Form */}
      <Row className="g-4">
        <Col md="6">
          <FormGroup>
            <Label className="form-label">Implementation Timeline</Label>
            <Input
              type="text"
              placeholder="e.g., 6 months"
              value={implementationPlan.timeline}
              onChange={(e) => handleInputChange('timeline', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label className="form-label">Estimated Budget</Label>
            <Input
              type="text"
              placeholder="e.g., $50,000"
              value={implementationPlan.budget}
              onChange={(e) => handleInputChange('budget', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Required Resources</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Describe the resources needed for implementation..."
              value={implementationPlan.resources}
              onChange={(e) => handleInputChange('resources', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Key Milestones</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Define key milestones and deliverables..."
              value={implementationPlan.milestones}
              onChange={(e) => handleInputChange('milestones', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Roles and Responsibilities</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Define who is responsible for what..."
              value={implementationPlan.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Implementation Risks</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Identify potential risks and mitigation strategies..."
              value={implementationPlan.risks}
              onChange={(e) => handleInputChange('risks', e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>

      {/* Next Steps Info */}
      <div className="next-steps mt-4 p-3 bg-light rounded">
        <h6 className="mb-2">
          <Icon name="info" className="me-2"></Icon>
          What's Next?
        </h6>
        <p className="mb-0 text-soft">
          After completing the implementation plan, you'll move on to creating an assessment plan 
          to evaluate the effectiveness of your implemented controls.
        </p>
      </div>

    </div>
  );
};

export default ImplementationPlanStep;
