/**
 * RMF Wizard - Continuous Monitoring Step
 * Establish ongoing security monitoring strategy
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Input, Alert } from "reactstrap";
import { Icon } from "@/components/Component";

const MonitoringStep = ({ 
  stepData = {}, 
  allStepData = {},
  onDataChange, 
  canProceed 
}) => {
  const [monitoringStrategy, setMonitoringStrategy] = useState(stepData.monitoringStrategy || {
    frequency: '',
    methods: '',
    metrics: '',
    reporting: '',
    responsibilities: '',
    tools: '',
    triggers: ''
  });

  // Update parent when strategy changes
  useEffect(() => {
    onDataChange({ monitoringStrategy });
  }, [monitoringStrategy, onDataChange]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setMonitoringStrategy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="monitoring-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="activity" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">Continuous Monitoring</h6>
            <p className="text-soft mb-0">
              Establish a strategy for ongoing monitoring of security controls and system changes
            </p>
          </div>
        </div>
      </div>

      {/* Monitoring Strategy Form */}
      <Row className="g-4">
        <Col md="6">
          <FormGroup>
            <Label className="form-label">Monitoring Frequency</Label>
            <Input
              type="text"
              placeholder="e.g., Monthly, Quarterly"
              value={monitoringStrategy.frequency}
              onChange={(e) => handleInputChange('frequency', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="6">
          <FormGroup>
            <Label className="form-label">Monitoring Tools</Label>
            <Input
              type="text"
              placeholder="e.g., SIEM, Vulnerability scanners"
              value={monitoringStrategy.tools}
              onChange={(e) => handleInputChange('tools', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Monitoring Methods</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Describe the methods and procedures for monitoring..."
              value={monitoringStrategy.methods}
              onChange={(e) => handleInputChange('methods', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Key Metrics and Indicators</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Define the metrics and indicators to be monitored..."
              value={monitoringStrategy.metrics}
              onChange={(e) => handleInputChange('metrics', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Reporting Requirements</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Define reporting requirements and schedules..."
              value={monitoringStrategy.reporting}
              onChange={(e) => handleInputChange('reporting', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Monitoring Responsibilities</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Define roles and responsibilities for monitoring activities..."
              value={monitoringStrategy.responsibilities}
              onChange={(e) => handleInputChange('responsibilities', e.target.value)}
            />
          </FormGroup>
        </Col>

        <Col md="12">
          <FormGroup>
            <Label className="form-label">Trigger Events</Label>
            <Input
              type="textarea"
              rows="3"
              placeholder="Define events that would trigger additional monitoring or reassessment..."
              value={monitoringStrategy.triggers}
              onChange={(e) => handleInputChange('triggers', e.target.value)}
            />
          </FormGroup>
        </Col>
      </Row>

      {/* Completion Message */}
      <div className="completion-message mt-4 p-4 bg-success bg-opacity-10 border border-success rounded">
        <div className="d-flex align-items-center">
          <Icon name="check-circle" className="text-success me-3" style={{ fontSize: '24px' }}></Icon>
          <div>
            <h6 className="text-success mb-1">RMF Process Complete!</h6>
            <p className="mb-0 text-success">
              You've successfully completed all steps of the RMF process. 
              Click "Complete" to finalize your RMF project.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MonitoringStep;
