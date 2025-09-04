/**
 * RMF Wizard - System Categorization Step
 * Clean interface for FIPS 199 categorization with AI assistance
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Button, Badge, Alert } from "reactstrap";
import { Icon, RSelect } from "@/components/Component";
import { rmfAIApi } from "@/utils/rmfAIApi";
import { toast } from "react-toastify";

const SystemCategorizationStep = ({ 
  stepData = {}, 
  allStepData = {},
  onDataChange, 
  canProceed 
}) => {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [categorization, setCategorization] = useState(stepData.categorization || {});
  const [aiLoading, setAiLoading] = useState(false);
  const [showAIResults, setShowAIResults] = useState(false);

  // Get systems from previous step
  const systems = allStepData[1]?.systems || [];

  // Impact level options
  const impactLevels = [
    { value: 'low', label: 'Low', description: 'Limited adverse effect' },
    { value: 'moderate', label: 'Moderate', description: 'Serious adverse effect' },
    { value: 'high', label: 'High', description: 'Severe or catastrophic adverse effect' }
  ];

  // Information types
  const informationTypes = [
    { value: 'financial', label: 'Financial Information' },
    { value: 'pii', label: 'Personally Identifiable Information (PII)' },
    { value: 'phi', label: 'Protected Health Information (PHI)' },
    { value: 'proprietary', label: 'Proprietary Business Information' },
    { value: 'classified', label: 'Classified Information' },
    { value: 'public', label: 'Public Information' }
  ];

  // Update parent when categorization changes
  useEffect(() => {
    onDataChange({ categorization, selectedSystem: selectedSystem?.id });
  }, [categorization, selectedSystem, onDataChange]);

  /**
   * Handle system selection
   */
  const handleSystemSelect = (system) => {
    setSelectedSystem(system);
    // Load existing categorization for this system if available
    if (categorization[system.id]) {
      // System already categorized
    } else {
      // Initialize empty categorization
      setCategorization(prev => ({
        ...prev,
        [system.id]: {
          confidentiality: '',
          integrity: '',
          availability: '',
          informationTypes: [],
          justification: ''
        }
      }));
    }
  };

  /**
   * Handle impact level change
   */
  const handleImpactChange = (impactType, level) => {
    if (!selectedSystem) return;
    
    setCategorization(prev => ({
      ...prev,
      [selectedSystem.id]: {
        ...prev[selectedSystem.id],
        [impactType]: level
      }
    }));
  };

  /**
   * Handle information types change
   */
  const handleInfoTypesChange = (selectedOptions) => {
    if (!selectedSystem) return;
    
    setCategorization(prev => ({
      ...prev,
      [selectedSystem.id]: {
        ...prev[selectedSystem.id],
        informationTypes: selectedOptions ? selectedOptions.map(opt => opt.value) : []
      }
    }));
  };

  /**
   * Handle justification change
   */
  const handleJustificationChange = (justification) => {
    if (!selectedSystem) return;
    
    setCategorization(prev => ({
      ...prev,
      [selectedSystem.id]: {
        ...prev[selectedSystem.id],
        justification
      }
    }));
  };

  /**
   * Request AI categorization
   */
  const handleAICategorization = async () => {
    if (!selectedSystem) return;

    try {
      setAiLoading(true);
      
      const systemData = {
        name: selectedSystem.name,
        description: selectedSystem.description,
        systemType: selectedSystem.systemType,
        boundary: selectedSystem.boundary,
        components: selectedSystem.components,
        environment: allStepData[0]?.environment || 'cloud'
      };

      console.log('🤖 Requesting AI categorization for:', systemData);
      
      const result = await rmfAIApi.categorizeSystem(systemData);
      
      if (result.success) {
        const aiCategorization = result.data.categorization;
        
        // Update categorization with AI results
        setCategorization(prev => ({
          ...prev,
          [selectedSystem.id]: {
            confidentiality: aiCategorization.confidentiality?.level || '',
            integrity: aiCategorization.integrity?.level || '',
            availability: aiCategorization.availability?.level || '',
            informationTypes: aiCategorization.informationTypes || [],
            justification: aiCategorization.reasoning || '',
            aiGenerated: true,
            aiTimestamp: new Date().toISOString()
          }
        }));
        
        setShowAIResults(true);
        toast.success('AI categorization completed successfully!');
      }
    } catch (error) {
      console.error('AI categorization error:', error);
      toast.error('Failed to get AI categorization. Please categorize manually.');
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Get overall system impact level
   */
  const getOverallImpact = (systemCat) => {
    if (!systemCat) return 'unknown';
    
    const levels = [systemCat.confidentiality, systemCat.integrity, systemCat.availability];
    if (levels.includes('high')) return 'high';
    if (levels.includes('moderate')) return 'moderate';
    if (levels.includes('low')) return 'low';
    return 'unknown';
  };

  /**
   * Check if categorization is complete
   */
  const isCategorizationComplete = () => {
    return systems.every(system => {
      const cat = categorization[system.id];
      return cat && cat.confidentiality && cat.integrity && cat.availability;
    });
  };

  return (
    <div className="system-categorization-step">
      
      {/* Step Introduction */}
      <div className="step-intro mb-4">
        <div className="d-flex align-items-center mb-3">
          <div className="step-icon me-3">
            <Icon name="layers" className="text-primary" style={{ fontSize: '24px' }}></Icon>
          </div>
          <div>
            <h6 className="mb-1">System Categorization</h6>
            <p className="text-soft mb-0">
              Categorize each system using FIPS 199 impact levels (Low, Moderate, High)
            </p>
          </div>
        </div>
      </div>

      {systems.length === 0 ? (
        <Alert color="warning">
          <Icon name="alert-triangle" className="me-2"></Icon>
          No systems found. Please go back to the System Identification step to add systems.
        </Alert>
      ) : (
        <>
          {/* System Selection */}
          <div className="system-selection mb-4">
            <h6 className="mb-3">Select System to Categorize</h6>
            <Row className="g-3">
              {systems.map((system) => {
                const systemCat = categorization[system.id];
                const isComplete = systemCat && systemCat.confidentiality && systemCat.integrity && systemCat.availability;
                const overallImpact = getOverallImpact(systemCat);
                
                return (
                  <Col md="6" lg="4" key={system.id}>
                    <div 
                      className={`system-card border rounded p-3 cursor-pointer ${selectedSystem?.id === system.id ? 'border-primary bg-light' : ''}`}
                      onClick={() => handleSystemSelect(system)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-1">{system.name}</h6>
                        {isComplete && (
                          <Badge color={overallImpact === 'high' ? 'danger' : overallImpact === 'moderate' ? 'warning' : 'success'}>
                            {overallImpact.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="text-soft small mb-2">{system.description}</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge color="outline-primary" className="text-capitalize">
                          {system.systemType?.replace('_', ' ')}
                        </Badge>
                        {isComplete ? (
                          <Icon name="check-circle" className="text-success"></Icon>
                        ) : (
                          <Icon name="clock" className="text-warning"></Icon>
                        )}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
          {/* Categorization Form */}
          {selectedSystem && (
            <div className="categorization-form border rounded p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h6 className="mb-1">Categorizing: {selectedSystem.name}</h6>
                  <p className="text-soft small mb-0">{selectedSystem.description}</p>
                </div>
                <Button
                  color="primary"
                  size="sm"
                  onClick={handleAICategorization}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <>
                      <Icon name="loader" className="me-1"></Icon>
                      AI Processing...
                    </>
                  ) : (
                    <>
                      <Icon name="cpu" className="me-1"></Icon>
                      AI Categorize
                    </>
                  )}
                </Button>
              </div>

              {/* Impact Level Selection */}
              <Row className="g-4">
                <Col md="4">
                  <FormGroup>
                    <Label className="form-label">
                      <Icon name="lock" className="me-2 text-primary"></Icon>
                      Confidentiality Impact
                    </Label>
                    <RSelect
                      options={impactLevels}
                      value={impactLevels.find(opt => opt.value === categorization[selectedSystem.id]?.confidentiality)}
                      onChange={(option) => handleImpactChange('confidentiality', option?.value)}
                      placeholder="Select impact level"
                    />
                    <small className="text-muted">
                      Impact of unauthorized disclosure
                    </small>
                  </FormGroup>
                </Col>

                <Col md="4">
                  <FormGroup>
                    <Label className="form-label">
                      <Icon name="shield" className="me-2 text-primary"></Icon>
                      Integrity Impact
                    </Label>
                    <RSelect
                      options={impactLevels}
                      value={impactLevels.find(opt => opt.value === categorization[selectedSystem.id]?.integrity)}
                      onChange={(option) => handleImpactChange('integrity', option?.value)}
                      placeholder="Select impact level"
                    />
                    <small className="text-muted">
                      Impact of unauthorized modification
                    </small>
                  </FormGroup>
                </Col>

                <Col md="4">
                  <FormGroup>
                    <Label className="form-label">
                      <Icon name="activity" className="me-2 text-primary"></Icon>
                      Availability Impact
                    </Label>
                    <RSelect
                      options={impactLevels}
                      value={impactLevels.find(opt => opt.value === categorization[selectedSystem.id]?.availability)}
                      onChange={(option) => handleImpactChange('availability', option?.value)}
                      placeholder="Select impact level"
                    />
                    <small className="text-muted">
                      Impact of system disruption
                    </small>
                  </FormGroup>
                </Col>

                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">Information Types</Label>
                    <RSelect
                      options={informationTypes}
                      isMulti
                      value={informationTypes.filter(opt =>
                        categorization[selectedSystem.id]?.informationTypes?.includes(opt.value)
                      )}
                      onChange={handleInfoTypesChange}
                      placeholder="Select information types processed by this system"
                    />
                  </FormGroup>
                </Col>

                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">Categorization Justification</Label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Provide justification for the selected impact levels..."
                      value={categorization[selectedSystem.id]?.justification || ''}
                      onChange={(e) => handleJustificationChange(e.target.value)}
                    />
                  </FormGroup>
                </Col>
              </Row>

              {/* AI Results Display */}
              {showAIResults && categorization[selectedSystem.id]?.aiGenerated && (
                <Alert color="info" className="mt-3">
                  <div className="d-flex align-items-start">
                    <Icon name="cpu" className="me-2 mt-1"></Icon>
                    <div>
                      <strong>AI Categorization Applied</strong>
                      <p className="mb-0 mt-1">
                        The AI has analyzed your system and provided categorization recommendations.
                        Please review and adjust as needed.
                      </p>
                    </div>
                  </div>
                </Alert>
              )}
            </div>
          )}

          {/* Categorization Summary */}
          <div className="categorization-summary">
            <h6 className="mb-3">Categorization Progress</h6>
            <Row className="g-3">
              {systems.map((system) => {
                const systemCat = categorization[system.id];
                const isComplete = systemCat && systemCat.confidentiality && systemCat.integrity && systemCat.availability;
                const overallImpact = getOverallImpact(systemCat);

                return (
                  <Col md="6" lg="4" key={system.id}>
                    <div className="summary-card border rounded p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">{system.name}</h6>
                        {isComplete ? (
                          <Badge color={overallImpact === 'high' ? 'danger' : overallImpact === 'moderate' ? 'warning' : 'success'}>
                            {overallImpact.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge color="outline-secondary">Pending</Badge>
                        )}
                      </div>

                      {isComplete ? (
                        <div className="impact-levels">
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Confidentiality:</span>
                            <Badge color="outline-primary" size="sm">
                              {systemCat.confidentiality?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Integrity:</span>
                            <Badge color="outline-primary" size="sm">
                              {systemCat.integrity?.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="d-flex justify-content-between small">
                            <span>Availability:</span>
                            <Badge color="outline-primary" size="sm">
                              {systemCat.availability?.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-muted small mb-0">Click to categorize this system</p>
                      )}
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          {/* Validation Status */}
          {!isCategorizationComplete() && (
            <div className="validation-status mt-4">
              <Alert color="warning">
                <Icon name="alert-triangle" className="me-2"></Icon>
                Please complete categorization for all systems to continue
              </Alert>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SystemCategorizationStep;
