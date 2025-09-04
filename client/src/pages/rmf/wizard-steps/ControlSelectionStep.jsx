/**
 * RMF Wizard - Control Selection Step
 * Clean interface for selecting security controls with AI assistance
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Button, Badge, Alert } from "reactstrap";
import { Icon, DataTable, DataTableHead, DataTableBody, DataTableRow } from "@/components/Component";
import { rmfAIApi } from "@/utils/rmfAIApi";
import { toast } from "react-toastify";

const ControlSelectionStep = ({ 
  stepData = {}, 
  allStepData = {},
  onDataChange, 
  canProceed 
}) => {
  const [selectedControls, setSelectedControls] = useState(stepData.controls || []);
  const [aiRecommendations, setAiRecommendations] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Get data from previous steps
  const systems = allStepData[1]?.systems || [];
  const categorization = allStepData[2]?.categorization || {};

  // Control families for display
  const controlFamilies = [
    { id: 'AC', name: 'Access Control', description: 'Limit system access to authorized users' },
    { id: 'AU', name: 'Audit and Accountability', description: 'Create and maintain audit records' },
    { id: 'AT', name: 'Awareness and Training', description: 'Ensure personnel are trained' },
    { id: 'CM', name: 'Configuration Management', description: 'Establish and maintain baseline configurations' },
    { id: 'CP', name: 'Contingency Planning', description: 'Establish and maintain contingency plans' },
    { id: 'IA', name: 'Identification and Authentication', description: 'Identify and authenticate users' },
    { id: 'IR', name: 'Incident Response', description: 'Establish incident response capability' },
    { id: 'MA', name: 'Maintenance', description: 'Perform periodic and timely maintenance' },
    { id: 'MP', name: 'Media Protection', description: 'Protect system media' },
    { id: 'PE', name: 'Physical and Environmental Protection', description: 'Limit physical access' },
    { id: 'PL', name: 'Planning', description: 'Develop and implement security plans' },
    { id: 'PS', name: 'Personnel Security', description: 'Ensure trustworthiness of personnel' },
    { id: 'RA', name: 'Risk Assessment', description: 'Assess and manage risks' },
    { id: 'CA', name: 'Security Assessment and Authorization', description: 'Assess and authorize systems' },
    { id: 'SC', name: 'System and Communications Protection', description: 'Protect system communications' },
    { id: 'SI', name: 'System and Information Integrity', description: 'Identify and respond to flaws' }
  ];

  // Update parent when controls change
  useEffect(() => {
    onDataChange({ controls: selectedControls });
  }, [selectedControls, onDataChange]);

  /**
   * Get overall impact level from categorization
   */
  const getOverallImpactLevel = () => {
    const allImpacts = [];
    
    Object.values(categorization).forEach(cat => {
      if (cat.confidentiality) allImpacts.push(cat.confidentiality);
      if (cat.integrity) allImpacts.push(cat.integrity);
      if (cat.availability) allImpacts.push(cat.availability);
    });

    if (allImpacts.includes('high')) return 'high';
    if (allImpacts.includes('moderate')) return 'moderate';
    return 'low';
  };

  /**
   * Request AI control recommendations
   */
  const handleAIControlSelection = async () => {
    try {
      setAiLoading(true);
      
      // Prepare system data for AI
      const systemsData = systems.map(system => ({
        name: system.name,
        description: system.description,
        systemType: system.systemType,
        categorization: categorization[system.id] || {},
        environment: allStepData[0]?.environment || 'cloud'
      }));

      console.log('🤖 Requesting AI control selection for systems:', systemsData);
      
      // For now, we'll use the first system for AI recommendations
      // In a real implementation, you might want to aggregate all systems
      const primarySystem = systemsData[0];
      
      const result = await rmfAIApi.selectSecurityControls(primarySystem);
      
      if (result.success) {
        setAiRecommendations(result.data);
        setShowRecommendations(true);
        toast.success('AI control recommendations generated successfully!');
      }
    } catch (error) {
      console.error('AI control selection error:', error);
      toast.error('Failed to get AI control recommendations. Please select controls manually.');
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Apply AI recommendations
   */
  const applyAIRecommendations = () => {
    if (!aiRecommendations) return;

    const recommendedControls = [];
    
    // Process AI recommendations and convert to our format
    if (aiRecommendations.baseline) {
      Object.entries(aiRecommendations.controlFamilies || {}).forEach(([familyId, controls]) => {
        controls.forEach(control => {
          recommendedControls.push({
            id: `${familyId}-${control.number || Math.random()}`,
            family: familyId,
            name: control.name || control.title,
            description: control.description,
            baseline: aiRecommendations.baseline,
            selected: true,
            aiRecommended: true
          });
        });
      });
    }

    setSelectedControls(recommendedControls);
    toast.success('AI recommendations applied successfully!');
  };

  /**
   * Toggle control selection
   */
  const toggleControl = (controlId) => {
    setSelectedControls(prev => 
      prev.map(control => 
        control.id === controlId 
          ? { ...control, selected: !control.selected }
          : control
      )
    );
  };

  /**
   * Add custom control
   */
  const addCustomControl = (family) => {
    const newControl = {
      id: `${family.id}-CUSTOM-${Date.now()}`,
      family: family.id,
      name: `Custom ${family.name} Control`,
      description: 'Custom control - please update description',
      baseline: getOverallImpactLevel(),
      selected: true,
      custom: true
    };
    
    setSelectedControls(prev => [...prev, newControl]);
  };

  /**
   * Remove control
   */
  const removeControl = (controlId) => {
    setSelectedControls(prev => prev.filter(control => control.id !== controlId));
  };

  const selectedControlsCount = selectedControls.filter(c => c.selected).length;
  const overallImpact = getOverallImpactLevel();

  return (
    <div className="control-selection-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="shield-check" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">Security Control Selection</h6>
            <p className="text-soft mb-0">
              Select appropriate security controls based on your system categorization
            </p>
          </div>
        </div>
      </div>

      {/* System Summary */}
      <div className="system-summary mb-4 p-3 bg-light rounded">
        <Row className="align-items-center">
          <Col md="8">
            <h6 className="mb-1">Systems Overview</h6>
            <p className="mb-0 text-soft">
              {systems.length} system(s) • Overall Impact Level: 
              <Badge color={overallImpact === 'high' ? 'danger' : overallImpact === 'moderate' ? 'warning' : 'success'} className="ms-2">
                {overallImpact.toUpperCase()}
              </Badge>
            </p>
          </Col>
          <Col md="4" className="text-end">
            <Button 
              color="primary" 
              onClick={handleAIControlSelection}
              disabled={aiLoading || systems.length === 0}
            >
              {aiLoading ? (
                <>
                  <Icon name="loader" className="me-1"></Icon>
                  AI Processing...
                </>
              ) : (
                <>
                  <Icon name="cpu" className="me-1"></Icon>
                  Get AI Recommendations
                </>
              )}
            </Button>
          </Col>
        </Row>
      </div>

      {/* AI Recommendations */}
      {showRecommendations && aiRecommendations && (
        <div className="ai-recommendations mb-4 border rounded p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              <Icon name="cpu" className="me-2 text-primary"></Icon>
              AI Control Recommendations
            </h6>
            <Button color="success" size="sm" onClick={applyAIRecommendations}>
              <Icon name="check" className="me-1"></Icon>
              Apply Recommendations
            </Button>
          </div>
          
          <div className="recommendation-summary mb-3">
            <p className="mb-2">
              <strong>Recommended Baseline:</strong> {aiRecommendations.baseline?.toUpperCase()}
            </p>
            <p className="mb-0 text-soft">
              {aiRecommendations.reasoning}
            </p>
          </div>

          {aiRecommendations.controlFamilies && (
            <div className="recommended-families">
              <h6 className="small mb-2">Recommended Control Families:</h6>
              <div className="d-flex flex-wrap gap-2">
                {Object.keys(aiRecommendations.controlFamilies).map(familyId => (
                  <Badge key={familyId} color="outline-primary">
                    {familyId} - {controlFamilies.find(f => f.id === familyId)?.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Families */}
      <div className="control-families mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Control Families</h6>
          <div className="text-muted small">
            {selectedControlsCount} controls selected
          </div>
        </div>

        <Row className="g-3">
          {controlFamilies.map((family) => {
            const familyControls = selectedControls.filter(c => c.family === family.id);
            const selectedFamilyControls = familyControls.filter(c => c.selected);
            
            return (
              <Col md="6" lg="4" key={family.id}>
                <div className="control-family-card border rounded p-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h6 className="mb-1">{family.id} - {family.name}</h6>
                      <p className="text-soft small mb-0">{family.description}</p>
                    </div>
                    <Button 
                      color="outline-primary" 
                      size="sm"
                      onClick={() => addCustomControl(family)}
                    >
                      <Icon name="plus"></Icon>
                    </Button>
                  </div>
                  
                  {familyControls.length > 0 && (
                    <div className="family-controls mt-2">
                      <div className="text-muted small mb-1">
                        {selectedFamilyControls.length} of {familyControls.length} selected
                      </div>
                      <div className="progress" style={{ height: '4px' }}>
                        <div 
                          className="progress-bar bg-primary"
                          style={{ width: `${(selectedFamilyControls.length / familyControls.length) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Selected Controls Table */}
      {selectedControls.length > 0 && (
        <div className="selected-controls">
          <h6 className="mb-3">Selected Controls ({selectedControlsCount})</h6>
          <DataTable className="table-responsive">
            <DataTableHead>
              <DataTableRow>
                <th width="50">
                  <input type="checkbox" className="form-check-input" readOnly />
                </th>
                <th>Control</th>
                <th>Family</th>
                <th>Baseline</th>
                <th>Source</th>
                <th className="text-end">Actions</th>
              </DataTableRow>
            </DataTableHead>
            <DataTableBody>
              {selectedControls.map((control) => (
                <DataTableRow key={control.id}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="form-check-input"
                      checked={control.selected}
                      onChange={() => toggleControl(control.id)}
                    />
                  </td>
                  <td>
                    <div>
                      <span className="fw-bold">{control.name}</span>
                      <div className="text-soft small">{control.description}</div>
                    </div>
                  </td>
                  <td>
                    <Badge color="outline-primary">{control.family}</Badge>
                  </td>
                  <td>
                    <Badge color={control.baseline === 'high' ? 'danger' : control.baseline === 'moderate' ? 'warning' : 'success'}>
                      {control.baseline?.toUpperCase()}
                    </Badge>
                  </td>
                  <td>
                    {control.aiRecommended && <Badge color="info" size="sm">AI</Badge>}
                    {control.custom && <Badge color="secondary" size="sm">Custom</Badge>}
                  </td>
                  <td className="text-end">
                    <Button 
                      color="outline-danger" 
                      size="sm"
                      onClick={() => removeControl(control.id)}
                    >
                      <Icon name="trash"></Icon>
                    </Button>
                  </td>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        </div>
      )}

      {/* Validation Status */}
      {selectedControlsCount === 0 && (
        <div className="validation-status mt-4">
          <Alert color="warning">
            <Icon name="alert-triangle" className="me-2"></Icon>
            Please select at least one security control to continue
          </Alert>
        </div>
      )}

    </div>
  );
};

export default ControlSelectionStep;
