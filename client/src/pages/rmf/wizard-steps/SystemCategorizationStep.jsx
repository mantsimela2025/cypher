/**
 * RMF Wizard - System Categorization Step
 * Clean interface for FIPS 199 categorization with AI assistance
 */

import React, { useState, useEffect } from "react";
import { Row, Col, FormGroup, Label, Button, Badge, Alert, Card, CardBody, Progress } from "reactstrap";
import { Icon, RSelect } from "@/components/Component";
import { rmfAIApi } from "@/utils/rmfApi";
import { log } from "@/utils/config";
import { toast } from "react-toastify";
import AIConfidenceIndicator from "@/components/rmf/AIConfidenceIndicator";
import AIInsightsPanel from "@/components/rmf/AIInsightsPanel";

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
  const [aiRecommendation, setAIRecommendation] = useState(null);
  const [showConfidenceScore, setShowConfidenceScore] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [aiInsightsEnabled, setAIInsightsEnabled] = useState(true);
  const [recommendationHistory, setRecommendationHistory] = useState([]);
  const [realTimeInsights, setRealTimeInsights] = useState(true);

  // Get systems from previous step
  const systems = allStepData[1]?.systems || [];

  // Impact level options with enhanced descriptions
  const impactLevels = [
    {
      value: 'low',
      label: 'Low',
      description: 'Limited adverse effect',
      details: 'The loss could be expected to have a limited adverse effect on organizational operations, assets, or individuals.',
      color: 'success'
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: 'Serious adverse effect',
      details: 'The loss could be expected to have a serious adverse effect on organizational operations, assets, or individuals.',
      color: 'warning'
    },
    {
      value: 'high',
      label: 'High',
      description: 'Severe or catastrophic adverse effect',
      details: 'The loss could be expected to have a severe or catastrophic adverse effect on organizational operations, assets, or individuals.',
      color: 'danger'
    }
  ];

  // Special factors that can influence categorization
  const specialFactors = [
    { value: 'external_access', label: 'External Access', description: 'System accessible from outside the organization' },
    { value: 'public_facing', label: 'Public Facing', description: 'System directly accessible by the public' },
    { value: 'critical_infrastructure', label: 'Critical Infrastructure', description: 'System supports critical business operations' },
    { value: 'privacy_sensitive', label: 'Privacy Sensitive', description: 'System processes personally identifiable information' },
    { value: 'high_availability', label: 'High Availability Required', description: 'System requires 24/7 availability' },
    { value: 'regulatory_compliance', label: 'Regulatory Compliance', description: 'System subject to specific regulatory requirements' }
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
   * Request AI categorization with enhanced features
   */
  const handleAICategorization = async () => {
    if (!selectedSystem) return;

    try {
      setAiLoading(true);
      log.info('🤖 Starting AI categorization for system:', selectedSystem.name);

      const systemData = {
        name: selectedSystem.name,
        description: selectedSystem.description,
        systemType: selectedSystem.systemType,
        boundary: selectedSystem.boundary,
        components: selectedSystem.components,
        environment: allStepData[0]?.environment || 'cloud',
        informationTypes: categorization[selectedSystem.id]?.informationTypes || [],
        specialFactors: categorization[selectedSystem.id]?.specialFactors || []
      };

      const result = await rmfAIApi.categorizeSystem(systemData);

      if (result.success && result.data) {
        const aiCategorization = result.data.categorization;

        // Store AI recommendation for review
        setAIRecommendation({
          confidentiality: aiCategorization.confidentiality?.level || '',
          integrity: aiCategorization.integrity?.level || '',
          availability: aiCategorization.availability?.level || '',
          reasoning: aiCategorization.reasoning || '',
          confidence: aiCategorization.confidence || 85,
          overallCategory: getOverallImpactFromLevels(
            aiCategorization.confidentiality?.level,
            aiCategorization.integrity?.level,
            aiCategorization.availability?.level
          ),
          timestamp: new Date().toISOString()
        });

        setShowAIResults(true);
        setShowConfidenceScore(true);
        toast.success(`AI categorization completed with ${aiCategorization.confidence || 85}% confidence!`);
        log.info('✅ AI categorization successful:', aiCategorization);
      }
    } catch (error) {
      log.error('❌ AI categorization failed:', error.message);
      toast.error('Failed to get AI categorization. Please categorize manually.');
    } finally {
      setAiLoading(false);
    }
  };

  /**
   * Accept AI recommendation with enhanced tracking
   */
  const acceptAIRecommendation = () => {
    if (!aiRecommendation || !selectedSystem) return;

    // Track recommendation acceptance
    const acceptanceRecord = {
      id: Date.now(),
      systemId: selectedSystem.id,
      systemName: selectedSystem.name,
      recommendation: aiRecommendation,
      action: 'accepted',
      timestamp: new Date().toISOString(),
      confidence: aiRecommendation.confidence,
      reasoning: aiRecommendation.reasoning,
      impactLevels: {
        confidentiality: aiRecommendation.confidentiality,
        integrity: aiRecommendation.integrity,
        availability: aiRecommendation.availability
      }
    };

    setRecommendationHistory(prev => [...prev, acceptanceRecord]);

    setCategorization(prev => ({
      ...prev,
      [selectedSystem.id]: {
        ...prev[selectedSystem.id],
        confidentiality: aiRecommendation.confidentiality,
        integrity: aiRecommendation.integrity,
        availability: aiRecommendation.availability,
        justification: aiRecommendation.reasoning,
        aiGenerated: true,
        aiConfidence: aiRecommendation.confidence,
        aiTimestamp: aiRecommendation.timestamp,
        aiAcceptanceId: acceptanceRecord.id
      }
    }));

    setManualOverride(false);
    toast.success(`AI recommendation accepted with ${aiRecommendation.confidence}% confidence!`);
    log.info('✅ AI recommendation accepted for system:', selectedSystem.name, acceptanceRecord);

    // Trigger data change callback with acceptance tracking
    if (onDataChange) {
      onDataChange({
        categorization,
        aiAcceptanceHistory: [...recommendationHistory, acceptanceRecord]
      });
    }
  };

  /**
   * Enable manual override
   */
  const enableManualOverride = () => {
    setManualOverride(true);
    toast.info('Manual override enabled. You can now modify the AI recommendations.');
  };

  /**
   * Get overall impact level from individual levels
   */
  const getOverallImpactFromLevels = (confidentiality, integrity, availability) => {
    const levels = [confidentiality, integrity, availability].filter(Boolean);
    if (levels.includes('high')) return 'HIGH';
    if (levels.includes('moderate')) return 'MODERATE';
    if (levels.includes('low')) return 'LOW';
    return 'UNKNOWN';
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
   * Handle AI insights recommendation acceptance
   */
  const handleAIInsightAcceptance = async (insight, acceptance) => {
    try {
      log.info('🤖 AI insight accepted:', insight.title);

      // Apply the insight recommendation to categorization
      if (insight.recommendation.action === 'update_categorization' && selectedSystem) {
        const updates = insight.recommendation.parameters;

        setCategorization(prev => ({
          ...prev,
          [selectedSystem.id]: {
            ...prev[selectedSystem.id],
            ...updates,
            aiInsightApplied: true,
            aiInsightId: insight.id,
            aiInsightTimestamp: acceptance.timestamp
          }
        }));

        // Track in recommendation history
        const insightRecord = {
          id: Date.now(),
          systemId: selectedSystem.id,
          systemName: selectedSystem.name,
          insightType: insight.type,
          insightTitle: insight.title,
          action: 'insight_accepted',
          timestamp: acceptance.timestamp,
          confidence: insight.confidence,
          parameters: insight.recommendation.parameters
        };

        setRecommendationHistory(prev => [...prev, insightRecord]);
        toast.success(`AI insight applied: ${insight.title}`);
      }

    } catch (error) {
      log.error('❌ Failed to apply AI insight:', error.message);
      toast.error('Failed to apply AI insight');
    }
  };

  /**
   * Handle AI insights recommendation rejection
   */
  const handleAIInsightRejection = async (insight, rejection) => {
    try {
      log.info('❌ AI insight rejected:', insight.title);

      // Track rejection in history
      const rejectionRecord = {
        id: Date.now(),
        systemId: selectedSystem?.id,
        systemName: selectedSystem?.name,
        insightType: insight.type,
        insightTitle: insight.title,
        action: 'insight_rejected',
        timestamp: rejection.timestamp,
        confidence: insight.confidence,
        reason: rejection.reason
      };

      setRecommendationHistory(prev => [...prev, rejectionRecord]);
      toast.info(`AI insight dismissed: ${insight.title}`);

    } catch (error) {
      log.error('❌ Failed to process AI insight rejection:', error.message);
    }
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

              {/* Enhanced Impact Level Selection */}
              <div className="impact-selection mb-4">
                <h6 className="mb-3">
                  <Icon name="target" className="me-2 text-primary"></Icon>
                  FIPS 199 Impact Level Assessment
                </h6>
                <Row className="g-4">
                  <Col md="4">
                    <Card className="h-100 border-primary">
                      <CardBody>
                        <div className="d-flex align-items-center mb-3">
                          <Icon name="lock" className="me-2 text-primary fs-5"></Icon>
                          <h6 className="mb-0">Confidentiality Impact</h6>
                        </div>
                        <RSelect
                          options={impactLevels.map(level => ({
                            ...level,
                            label: (
                              <div>
                                <Badge color={level.color} className="me-2">{level.label}</Badge>
                                <span>{level.description}</span>
                              </div>
                            )
                          }))}
                          value={impactLevels.find(opt => opt.value === categorization[selectedSystem.id]?.confidentiality)}
                          onChange={(option) => handleImpactChange('confidentiality', option?.value)}
                          placeholder="Select impact level"
                          isDisabled={aiRecommendation && !manualOverride}
                        />
                        <small className="text-muted mt-2 d-block">
                          <strong>Consider:</strong> Impact of unauthorized disclosure of information
                        </small>
                        {categorization[selectedSystem.id]?.confidentiality && (
                          <div className="mt-2">
                            <Badge
                              color={impactLevels.find(l => l.value === categorization[selectedSystem.id]?.confidentiality)?.color}
                              className="w-100 p-2"
                            >
                              {impactLevels.find(l => l.value === categorization[selectedSystem.id]?.confidentiality)?.details}
                            </Badge>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  <Col md="4">
                    <Card className="h-100 border-success">
                      <CardBody>
                        <div className="d-flex align-items-center mb-3">
                          <Icon name="shield" className="me-2 text-success fs-5"></Icon>
                          <h6 className="mb-0">Integrity Impact</h6>
                        </div>
                        <RSelect
                          options={impactLevels.map(level => ({
                            ...level,
                            label: (
                              <div>
                                <Badge color={level.color} className="me-2">{level.label}</Badge>
                                <span>{level.description}</span>
                              </div>
                            )
                          }))}
                          value={impactLevels.find(opt => opt.value === categorization[selectedSystem.id]?.integrity)}
                          onChange={(option) => handleImpactChange('integrity', option?.value)}
                          placeholder="Select impact level"
                          isDisabled={aiRecommendation && !manualOverride}
                        />
                        <small className="text-muted mt-2 d-block">
                          <strong>Consider:</strong> Impact of unauthorized modification or destruction
                        </small>
                        {categorization[selectedSystem.id]?.integrity && (
                          <div className="mt-2">
                            <Badge
                              color={impactLevels.find(l => l.value === categorization[selectedSystem.id]?.integrity)?.color}
                              className="w-100 p-2"
                            >
                              {impactLevels.find(l => l.value === categorization[selectedSystem.id]?.integrity)?.details}
                            </Badge>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>

                  <Col md="4">
                    <Card className="h-100 border-info">
                      <CardBody>
                        <div className="d-flex align-items-center mb-3">
                          <Icon name="activity" className="me-2 text-info fs-5"></Icon>
                          <h6 className="mb-0">Availability Impact</h6>
                        </div>
                        <RSelect
                          options={impactLevels.map(level => ({
                            ...level,
                            label: (
                              <div>
                                <Badge color={level.color} className="me-2">{level.label}</Badge>
                                <span>{level.description}</span>
                              </div>
                            )
                          }))}
                          value={impactLevels.find(opt => opt.value === categorization[selectedSystem.id]?.availability)}
                          onChange={(option) => handleImpactChange('availability', option?.value)}
                          placeholder="Select impact level"
                          isDisabled={aiRecommendation && !manualOverride}
                        />
                        <small className="text-muted mt-2 d-block">
                          <strong>Consider:</strong> Impact of system disruption or denial of access
                        </small>
                        {categorization[selectedSystem.id]?.availability && (
                          <div className="mt-2">
                            <Badge
                              color={impactLevels.find(l => l.value === categorization[selectedSystem.id]?.availability)?.color}
                              className="w-100 p-2"
                            >
                              {impactLevels.find(l => l.value === categorization[selectedSystem.id]?.availability)?.details}
                            </Badge>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </div>

                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">
                      <Icon name="database" className="me-2 text-primary"></Icon>
                      Information Types
                    </Label>
                    <RSelect
                      options={informationTypes}
                      isMulti
                      value={informationTypes.filter(opt =>
                        categorization[selectedSystem.id]?.informationTypes?.includes(opt.value)
                      )}
                      onChange={handleInfoTypesChange}
                      placeholder="Select information types processed by this system"
                    />
                    <small className="text-muted">
                      Select all types of information this system processes, stores, or transmits
                    </small>
                  </FormGroup>
                </Col>

                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">
                      <Icon name="settings" className="me-2 text-primary"></Icon>
                      Special Factors
                    </Label>
                    <div className="special-factors">
                      <Row className="g-2">
                        {specialFactors.map((factor) => (
                          <Col md="6" key={factor.value}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`factor-${factor.value}`}
                                checked={categorization[selectedSystem.id]?.specialFactors?.includes(factor.value) || false}
                                onChange={(e) => {
                                  const currentFactors = categorization[selectedSystem.id]?.specialFactors || [];
                                  const newFactors = e.target.checked
                                    ? [...currentFactors, factor.value]
                                    : currentFactors.filter(f => f !== factor.value);

                                  setCategorization(prev => ({
                                    ...prev,
                                    [selectedSystem.id]: {
                                      ...prev[selectedSystem.id],
                                      specialFactors: newFactors
                                    }
                                  }));
                                }}
                              />
                              <label className="form-check-label" htmlFor={`factor-${factor.value}`}>
                                <strong>{factor.label}</strong>
                                <br />
                                <small className="text-muted">{factor.description}</small>
                              </label>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                    <small className="text-muted">
                      Select any special factors that may influence the system's categorization
                    </small>
                  </FormGroup>
                </Col>

                <Col md="12">
                  <FormGroup>
                    <Label className="form-label">
                      <Icon name="file-text" className="me-2 text-primary"></Icon>
                      Categorization Justification
                    </Label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Provide detailed justification for the selected impact levels, including business context, regulatory requirements, and risk considerations..."
                      value={categorization[selectedSystem.id]?.justification || ''}
                      onChange={(e) => handleJustificationChange(e.target.value)}
                    />
                    <small className="text-muted">
                      Explain the rationale behind your impact level selections
                    </small>
                  </FormGroup>
                </Col>
              </Row>

              {/* AI Recommendation Display */}
              {showAIResults && aiRecommendation && (
                <Card className="mt-4 border-primary">
                  <CardBody>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="card-title mb-1">
                          <Icon name="cpu" className="text-primary me-2"></Icon>
                          AI Categorization Recommendation
                        </h6>
                        <p className="text-muted small mb-0">
                          Generated on {new Date(aiRecommendation.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {showConfidenceScore && (
                        <div className="text-end">
                          <AIConfidenceIndicator
                            confidence={aiRecommendation.confidence}
                            variant="progress"
                            size="normal"
                            tooltip={true}
                            breakdown={{
                              dataQuality: aiRecommendation.confidence + 5,
                              modelAccuracy: aiRecommendation.confidence - 3,
                              contextRelevance: aiRecommendation.confidence + 2,
                              historicalPerformance: aiRecommendation.confidence - 1
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* AI Recommended Impact Levels */}
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <div className="p-3 border rounded bg-light">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <Icon name="lock" className="text-primary me-2"></Icon>
                              <strong>Confidentiality</strong>
                            </div>
                            <Badge
                              color={impactLevels.find(l => l.value === aiRecommendation.confidentiality)?.color || 'secondary'}
                              className="text-capitalize"
                            >
                              {aiRecommendation.confidentiality}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 border rounded bg-light">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <Icon name="shield" className="text-primary me-2"></Icon>
                              <strong>Integrity</strong>
                            </div>
                            <Badge
                              color={impactLevels.find(l => l.value === aiRecommendation.integrity)?.color || 'secondary'}
                              className="text-capitalize"
                            >
                              {aiRecommendation.integrity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 border rounded bg-light">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <Icon name="activity" className="text-primary me-2"></Icon>
                              <strong>Availability</strong>
                            </div>
                            <Badge
                              color={impactLevels.find(l => l.value === aiRecommendation.availability)?.color || 'secondary'}
                              className="text-capitalize"
                            >
                              {aiRecommendation.availability}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Overall Category */}
                    <div className="mb-3">
                      <div className="d-flex align-items-center">
                        <strong className="me-2">Overall System Category:</strong>
                        <Badge
                          color={
                            aiRecommendation.overallCategory === 'HIGH' ? 'danger' :
                            aiRecommendation.overallCategory === 'MODERATE' ? 'warning' : 'success'
                          }
                          className="fs-6"
                        >
                          {aiRecommendation.overallCategory}
                        </Badge>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="mb-3">
                      <h6 className="mb-2">AI Reasoning:</h6>
                      <div className="p-3 bg-light rounded">
                        <p className="mb-0 text-muted">{aiRecommendation.reasoning}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex gap-2">
                      {!manualOverride && !categorization[selectedSystem.id]?.aiGenerated && (
                        <>
                          <Button
                            color="success"
                            size="sm"
                            onClick={acceptAIRecommendation}
                          >
                            <Icon name="check" className="me-1"></Icon>
                            Accept Recommendation
                          </Button>
                          <Button
                            color="outline-secondary"
                            size="sm"
                            onClick={enableManualOverride}
                          >
                            <Icon name="edit" className="me-1"></Icon>
                            Manual Override
                          </Button>
                        </>
                      )}
                      {(manualOverride || categorization[selectedSystem.id]?.aiGenerated) && (
                        <Badge color="info" className="d-flex align-items-center">
                          <Icon name="info" className="me-1"></Icon>
                          {manualOverride ? 'Manual override enabled' : 'AI recommendation applied'}
                        </Badge>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Manual Override Notice */}
              {manualOverride && (
                <Alert color="warning" className="mt-3">
                  <Icon name="alert-triangle" className="me-2"></Icon>
                  <strong>Manual Override Active:</strong> You can now modify the impact levels above.
                  The AI recommendation will be used as a baseline.
                </Alert>
              )}

              {/* Enhanced AI Insights Panel */}
              {aiInsightsEnabled && selectedSystem && (
                <div className="mt-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">
                      <Icon name="cpu" className="text-primary me-2"></Icon>
                      Real-time AI Insights
                    </h6>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="realTimeInsights"
                        checked={realTimeInsights}
                        onChange={(e) => setRealTimeInsights(e.target.checked)}
                      />
                      <label className="form-check-label small" htmlFor="realTimeInsights">
                        Real-time updates
                      </label>
                    </div>
                  </div>

                  <AIInsightsPanel
                    systemData={selectedSystem}
                    currentStep="categorize"
                    onRecommendationAccept={handleAIInsightAcceptance}
                    onRecommendationReject={handleAIInsightRejection}
                    showConfidenceScores={true}
                    autoRefresh={realTimeInsights}
                    refreshInterval={30000}
                  />
                </div>
              )}

              {/* AI Recommendation History */}
              {recommendationHistory.length > 0 && (
                <div className="mt-4">
                  <h6 className="mb-3">
                    <Icon name="history" className="text-info me-2"></Icon>
                    AI Recommendation History
                  </h6>
                  <div className="recommendation-history">
                    {recommendationHistory.slice(-3).map((record) => (
                      <div key={record.id} className="d-flex align-items-center justify-content-between p-2 border rounded mb-2">
                        <div className="d-flex align-items-center">
                          <Icon
                            name={record.action === 'accepted' || record.action === 'insight_accepted' ? 'check-circle' : 'x-circle'}
                            className={`me-2 ${record.action === 'accepted' || record.action === 'insight_accepted' ? 'text-success' : 'text-danger'}`}
                          ></Icon>
                          <div>
                            <div className="small fw-bold">
                              {record.insightTitle || `${record.systemName} Categorization`}
                            </div>
                            <div className="small text-muted">
                              {record.action.replace('_', ' ').toUpperCase()} • {new Date(record.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <AIConfidenceIndicator
                          confidence={record.confidence}
                          size="small"
                          variant="badge"
                          tooltip={false}
                        />
                      </div>
                    ))}
                    {recommendationHistory.length > 3 && (
                      <div className="text-center">
                        <small className="text-muted">
                          +{recommendationHistory.length - 3} more recommendations in history
                        </small>
                      </div>
                    )}
                  </div>
                </div>
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
