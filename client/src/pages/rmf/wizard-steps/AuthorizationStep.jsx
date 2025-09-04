/**
 * RMF Wizard - Authorization Step
 * Risk acceptance and authorization to operate
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Input, Alert } from "reactstrap";
import { Icon, RSelect } from "@/components/Component";

const AuthorizationStep = ({ 
  stepData = {}, 
  allStepData = {},
  onDataChange, 
  canProceed 
}) => {
  const [authorizationDecision, setAuthorizationDecision] = useState(stepData.authorizationDecision || {
    decision: '',
    authorizingOfficial: '',
    riskAcceptance: '',
    conditions: '',
    authorizationDate: '',
    reviewDate: ''
  });

  // Decision options
  const decisionOptions = [
    { value: 'authorize', label: 'Authorize to Operate (ATO)' },
    { value: 'interim', label: 'Interim Authorization to Test (IATT)' },
    { value: 'deny', label: 'Deny Authorization' }
  ];

  // Update parent when decision changes
  useEffect(() => {
    onDataChange({ authorizationDecision });
  }, [authorizationDecision, onDataChange]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setAuthorizationDecision(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * Handle select changes
   */
  const handleSelectChange = (field, selectedOption) => {
    setAuthorizationDecision(prev => ({
      ...prev,
      [field]: selectedOption?.value || ''
    }));
  };

  return (
    <div className="authorization-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="award" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">Authorization Decision</h6>
            <p className="text-soft mb-0">
              Document the authorization decision and risk acceptance by the authorizing official
            </p>
          </div>
        </div>
      </div>

      {/* Authorization Form */}
      <Row className="g-4">
        <Col md="6">
          <FormGroup>
            <Label className="form-label">Authorization Decision</Label>
            <RSelect
              options={decisionOptions}
              value={decisionOptions.find(opt => opt.value === authorizationDecision.decision)}
              onChange={(option) => handleSelectChange('decision', option)}
              placeholder="Select authorization decision"
            />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label className="form-label">Authorizing Official</Label>
            <Input
              type="text"
              placeholder="Enter authorizing official name"
              value={authorizationDecision.authorizingOfficial}
              onChange={(e) => handleInputChange('authorizingOfficial', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label className="form-label">Authorization Date</Label>
            <Input
              type="date"
              value={authorizationDecision.authorizationDate}
              onChange={(e) => handleInputChange('authorizationDate', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label className="form-label">Next Review Date</Label>
            <Input
              type="date"
              value={authorizationDecision.reviewDate}
              onChange={(e) => handleInputChange('reviewDate', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Risk Acceptance Statement</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Document the risk acceptance rationale..."
              value={authorizationDecision.riskAcceptance}
              onChange={(e) => handleInputChange('riskAcceptance', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Authorization Conditions</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="List any conditions or restrictions for the authorization..."
              value={authorizationDecision.conditions}
              onChange={(e) => handleInputChange('conditions', e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>

    </div>
  );
};

export default AuthorizationStep;
