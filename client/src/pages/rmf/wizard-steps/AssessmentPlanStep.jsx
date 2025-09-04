/**
 * RMF Wizard - Assessment Plan Step
 * Plan for assessing implemented security controls
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Input, Alert } from "reactstrap";
import { Icon } from "@/components/Component";

const AssessmentPlanStep = ({ 
  stepData = {}, 
  allStepData = {},
  onDataChange, 
  canProceed 
}) => {
  const [assessmentPlan, setAssessmentPlan] = useState(stepData.assessmentPlan || {
    methodology: '',
    schedule: '',
    assessors: '',
    scope: '',
    procedures: '',
    deliverables: ''
  });

  // Update parent when plan changes
  useEffect(() => {
    onDataChange({ assessmentPlan });
  }, [assessmentPlan, onDataChange]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setAssessmentPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="assessment-plan-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="check-circle" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">Assessment Plan</h6>
            <p className="text-soft mb-0">
              Develop a plan for assessing the effectiveness of implemented security controls
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Plan Form */}
      <Row className="g-4">
        <Col md="6">
          <FormGroup>
            <Label className="form-label">Assessment Methodology</Label>
            <Input
              type="text"
              placeholder="e.g., NIST SP 800-53A"
              value={assessmentPlan.methodology}
              onChange={(e) => handleInputChange('methodology', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label className="form-label">Assessment Schedule</Label>
            <Input
              type="text"
              placeholder="e.g., Quarterly reviews"
              value={assessmentPlan.schedule}
              onChange={(e) => handleInputChange('schedule', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Assessment Team</Label>
            <Input
              type="textarea"
              rows="2"
              placeholder="Identify assessment team members and their roles..."
              value={assessmentPlan.assessors}
              onChange={(e) => handleInputChange('assessors', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Assessment Scope</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Define what will be assessed and any limitations..."
              value={assessmentPlan.scope}
              onChange={(e) => handleInputChange('scope', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Assessment Procedures</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Describe the procedures and methods to be used..."
              value={assessmentPlan.procedures}
              onChange={(e) => handleInputChange('procedures', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Expected Deliverables</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="List the expected assessment deliverables..."
              value={assessmentPlan.deliverables}
              onChange={(e) => handleInputChange('deliverables', e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>

    </div>
  );
};

export default AssessmentPlanStep;
