import React, { useState } from 'react';

export const SystemCategorizationWizard = ({ systemId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    confidentialityImpact: '',
    integrityImpact: '',
    availabilityImpact: '',
    confidentialityJustification: '',
    integrityJustification: '',
    availabilityJustification: '',
    specialFactors: [],
    aiRecommendation: null
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const impactLevels = [
    { value: 'low', label: 'Low', description: 'Limited adverse effect' },
    { value: 'moderate', label: 'Moderate', description: 'Serious adverse effect' },
    { value: 'high', label: 'High', description: 'Severe or catastrophic adverse effect' }
  ];

  const specialFactorOptions = [
    { value: 'external_access', label: 'External Access' },
    { value: 'public_facing', label: 'Public Facing' },
    { value: 'critical_infrastructure', label: 'Critical Infrastructure' },
    { value: 'privacy_sensitive', label: 'Privacy Sensitive' },
    { value: 'high_availability', label: 'High Availability Required' },
    { value: 'regulatory_compliance', label: 'Regulatory Compliance' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSpecialFactorChange = (factor) => {
    setFormData(prev => ({
      ...prev,
      specialFactors: prev.specialFactors.includes(factor)
        ? prev.specialFactors.filter(f => f !== factor)
        : [...prev.specialFactors, factor]
    }));
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockAIRecommendation = {
        confidentialityImpact: 'moderate',
        integrityImpact: 'high',
        availabilityImpact: 'moderate',
        overallCategory: 'MODERATE',
        reasoning: 'Based on the financial data processing and business criticality, this system requires moderate confidentiality and availability protections, with high integrity requirements due to financial accuracy needs.',
        confidence: 87
      };

      setFormData(prev => ({
        ...prev,
        aiRecommendation: mockAIRecommendation
      }));
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const acceptAIRecommendation = () => {
    if (formData.aiRecommendation) {
      setFormData(prev => ({
        ...prev,
        confidentialityImpact: prev.aiRecommendation.confidentialityImpact,
        integrityImpact: prev.aiRecommendation.integrityImpact,
        availabilityImpact: prev.aiRecommendation.availabilityImpact
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting categorization:', formData);
      // API call would go here
      alert('System categorization completed successfully!');
    } catch (error) {
      console.error('Error saving categorization:', error);
    }
  };

  const getImpactBadgeClass = (impact) => {
    const classes = {
      low: 'badge bg-success',
      moderate: 'badge bg-warning text-dark',
      high: 'badge bg-danger'
    };
    return classes[impact] || 'badge bg-secondary';
  };

  const getOverallCategory = () => {
    const impacts = [
      formData.confidentialityImpact,
      formData.integrityImpact,
      formData.availabilityImpact
    ];

    if (impacts.includes('high')) return 'HIGH';
    if (impacts.includes('moderate')) return 'MODERATE';
    if (impacts.every(i => i === 'low')) return 'LOW';
    return 'UNDEFINED';
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header */}
          <div className="mb-4">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="#" className="text-decoration-none">RMF Dashboard</a>
                </li>
                <li className="breadcrumb-item">
                  <a href="#" className="text-decoration-none">Systems</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Categorization Wizard
                </li>
              </ol>
            </nav>
            
            <h1 className="h3 mb-2">System Categorization Wizard</h1>
            <p className="text-muted">
              Determine the security categorization for your system based on NIST 800-60 guidelines.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-light text-muted'}`} 
                       style={{width: '40px', height: '40px'}}>
                    <span>1</span>
                  </div>
                  <div>
                    <h6 className="mb-0">Impact Assessment</h6>
                    <small className="text-muted">Determine CIA impact levels</small>
                  </div>
                </div>
                
                <div className="flex-grow-1 mx-3">
                  <hr className="my-0" />
                </div>
                
                <div className="d-flex align-items-center">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-light text-muted'}`} 
                       style={{width: '40px', height: '40px'}}>
                    <span>2</span>
                  </div>
                  <div>
                    <h6 className="mb-0">AI Analysis</h6>
                    <small className="text-muted">Review AI recommendations</small>
                  </div>
                </div>
                
                <div className="flex-grow-1 mx-3">
                  <hr className="my-0" />
                </div>
                
                <div className="d-flex align-items-center">
                  <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-light text-muted'}`} 
                       style={{width: '40px', height: '40px'}}>
                    <span>3</span>
                  </div>
                  <div>
                    <h6 className="mb-0">Finalize</h6>
                    <small className="text-muted">Complete categorization</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Impact Assessment */}
          {currentStep === 1 && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Step 1: Security Impact Assessment</h5>
              </div>
              <div className="card-body">
                <p className="text-muted mb-4">
                  Assess the potential impact on your organization if the confidentiality, integrity, or availability of this system is compromised.
                </p>

                {/* Confidentiality Impact */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Confidentiality Impact</h6>
                  <p className="text-muted small mb-3">
                    What would be the impact if unauthorized individuals gained access to the information?
                  </p>
                  
                  <div className="row">
                    {impactLevels.map((level) => (
                      <div key={level.value} className="col-md-4 mb-3">
                        <div className={`card h-100 ${formData.confidentialityImpact === level.value ? 'border-primary' : ''}`}>
                          <div className="card-body text-center">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="confidentialityImpact"
                                id={`conf-${level.value}`}
                                value={level.value}
                                checked={formData.confidentialityImpact === level.value}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label w-100" htmlFor={`conf-${level.value}`}>
                                <div className={getImpactBadgeClass(level.value)}>{level.label}</div>
                                <p className="mt-2 mb-0 small">{level.description}</p>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label htmlFor="confidentialityJustification" className="form-label">
                      Justification (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      id="confidentialityJustification"
                      name="confidentialityJustification"
                      rows="2"
                      value={formData.confidentialityJustification}
                      onChange={handleInputChange}
                      placeholder="Explain your confidentiality impact assessment..."
                    ></textarea>
                  </div>
                </div>

                {/* Integrity Impact */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Integrity Impact</h6>
                  <p className="text-muted small mb-3">
                    What would be the impact if the information or system was modified or destroyed?
                  </p>
                  
                  <div className="row">
                    {impactLevels.map((level) => (
                      <div key={level.value} className="col-md-4 mb-3">
                        <div className={`card h-100 ${formData.integrityImpact === level.value ? 'border-primary' : ''}`}>
                          <div className="card-body text-center">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="integrityImpact"
                                id={`int-${level.value}`}
                                value={level.value}
                                checked={formData.integrityImpact === level.value}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label w-100" htmlFor={`int-${level.value}`}>
                                <div className={getImpactBadgeClass(level.value)}>{level.label}</div>
                                <p className="mt-2 mb-0 small">{level.description}</p>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label htmlFor="integrityJustification" className="form-label">
                      Justification (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      id="integrityJustification"
                      name="integrityJustification"
                      rows="2"
                      value={formData.integrityJustification}
                      onChange={handleInputChange}
                      placeholder="Explain your integrity impact assessment..."
                    ></textarea>
                  </div>
                </div>

                {/* Availability Impact */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Availability Impact</h6>
                  <p className="text-muted small mb-3">
                    What would be the impact if the system was unavailable or disrupted?
                  </p>
                  
                  <div className="row">
                    {impactLevels.map((level) => (
                      <div key={level.value} className="col-md-4 mb-3">
                        <div className={`card h-100 ${formData.availabilityImpact === level.value ? 'border-primary' : ''}`}>
                          <div className="card-body text-center">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="availabilityImpact"
                                id={`avail-${level.value}`}
                                value={level.value}
                                checked={formData.availabilityImpact === level.value}
                                onChange={handleInputChange}
                              />
                              <label className="form-check-label w-100" htmlFor={`avail-${level.value}`}>
                                <div className={getImpactBadgeClass(level.value)}>{level.label}</div>
                                <p className="mt-2 mb-0 small">{level.description}</p>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label htmlFor="availabilityJustification" className="form-label">
                      Justification (Optional)
                    </label>
                    <textarea
                      className="form-control"
                      id="availabilityJustification"
                      name="availabilityJustification"
                      rows="2"
                      value={formData.availabilityJustification}
                      onChange={handleInputChange}
                      placeholder="Explain your availability impact assessment..."
                    ></textarea>
                  </div>
                </div>

                {/* Special Factors */}
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Special Factors</h6>
                  <p className="text-muted small mb-3">
                    Select any special factors that apply to this system.
                  </p>
                  
                  <div className="row">
                    {specialFactorOptions.map((factor) => (
                      <div key={factor.value} className="col-md-6 mb-2">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={factor.value}
                            checked={formData.specialFactors.includes(factor.value)}
                            onChange={() => handleSpecialFactorChange(factor.value)}
                          />
                          <label className="form-check-label" htmlFor={factor.value}>
                            {factor.label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Category Preview */}
                {formData.confidentialityImpact && formData.integrityImpact && formData.availabilityImpact && (
                  <div className="alert alert-info">
                    <h6 className="alert-heading">Current Security Category</h6>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <p className="mb-1">
                          Based on your selections: C-{formData.confidentialityImpact.toUpperCase()}, 
                          I-{formData.integrityImpact.toUpperCase()}, 
                          A-{formData.availabilityImpact.toUpperCase()}
                        </p>
                        <span className={`badge ${getOverallCategory() === 'HIGH' ? 'bg-danger' : getOverallCategory() === 'MODERATE' ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {getOverallCategory()} Impact System
                        </span>
                      </div>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setCurrentStep(2)}
                      >
                        Continue to AI Analysis
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Step 2: AI Analysis & Recommendations</h5>
              </div>
              <div className="card-body">
                {!formData.aiRecommendation ? (
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i className="bi bi-robot display-4 text-primary"></i>
                    </div>
                    <h5>AI-Powered Categorization Analysis</h5>
                    <p className="text-muted mb-4">
                      Our AI will analyze your system information and impact assessments to provide 
                      intelligent recommendations based on NIST guidelines and industry best practices.
                    </p>
                    
                    <button 
                      className="btn btn-primary btn-lg"
                      onClick={runAIAnalysis}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Analyzing System...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-play-circle me-2"></i>
                          Run AI Analysis
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-success">
                      <div className="d-flex align-items-start">
                        <i className="bi bi-check-circle-fill me-2 mt-1"></i>
                        <div className="flex-grow-1">
                          <h6 className="alert-heading">AI Analysis Complete</h6>
                          <p className="mb-1">
                            Confidence Level: <strong>{formData.aiRecommendation.confidence}%</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <h6>Your Assessment</h6>
                        <div className="card border-light bg-light">
                          <div className="card-body">
                            <div className="mb-2">
                              <strong>Confidentiality:</strong> 
                              <span className={`ms-2 ${getImpactBadgeClass(formData.confidentialityImpact)}`}>
                                {formData.confidentialityImpact?.toUpperCase()}
                              </span>
                            </div>
                            <div className="mb-2">
                              <strong>Integrity:</strong> 
                              <span className={`ms-2 ${getImpactBadgeClass(formData.integrityImpact)}`}>
                                {formData.integrityImpact?.toUpperCase()}
                              </span>
                            </div>
                            <div className="mb-2">
                              <strong>Availability:</strong> 
                              <span className={`ms-2 ${getImpactBadgeClass(formData.availabilityImpact)}`}>
                                {formData.availabilityImpact?.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-3">
                              <strong>Overall Category:</strong> 
                              <span className={`ms-2 badge ${getOverallCategory() === 'HIGH' ? 'bg-danger' : getOverallCategory() === 'MODERATE' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                {getOverallCategory()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <h6>AI Recommendation</h6>
                        <div className="card border-primary">
                          <div className="card-body">
                            <div className="mb-2">
                              <strong>Confidentiality:</strong> 
                              <span className={`ms-2 ${getImpactBadgeClass(formData.aiRecommendation.confidentialityImpact)}`}>
                                {formData.aiRecommendation.confidentialityImpact?.toUpperCase()}
                              </span>
                            </div>
                            <div className="mb-2">
                              <strong>Integrity:</strong> 
                              <span className={`ms-2 ${getImpactBadgeClass(formData.aiRecommendation.integrityImpact)}`}>
                                {formData.aiRecommendation.integrityImpact?.toUpperCase()}
                              </span>
                            </div>
                            <div className="mb-2">
                              <strong>Availability:</strong> 
                              <span className={`ms-2 ${getImpactBadgeClass(formData.aiRecommendation.availabilityImpact)}`}>
                                {formData.aiRecommendation.availabilityImpact?.toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-3">
                              <strong>Overall Category:</strong> 
                              <span className={`ms-2 badge ${formData.aiRecommendation.overallCategory === 'HIGH' ? 'bg-danger' : formData.aiRecommendation.overallCategory === 'MODERATE' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                {formData.aiRecommendation.overallCategory}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info">
                      <h6 className="alert-heading">AI Reasoning</h6>
                      <p className="mb-0">{formData.aiRecommendation.reasoning}</p>
                    </div>

                    <div className="d-flex justify-content-between align-items-center">
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => setCurrentStep(1)}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Back to Assessment
                      </button>
                      
                      <div className="d-flex gap-2">
                        <button 
                          className="btn btn-success"
                          onClick={acceptAIRecommendation}
                        >
                          <i className="bi bi-check me-2"></i>
                          Accept AI Recommendation
                        </button>
                        <button 
                          className="btn btn-primary"
                          onClick={() => setCurrentStep(3)}
                        >
                          Continue with My Assessment
                          <i className="bi bi-arrow-right ms-2"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Finalize */}
          {currentStep === 3 && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Step 3: Finalize Categorization</h5>
              </div>
              <div className="card-body">
                <div className="alert alert-success">
                  <h6 className="alert-heading">Final Security Categorization</h6>
                  <div className="row">
                    <div className="col-md-8">
                      <p className="mb-2">
                        <strong>System Category:</strong> 
                        <span className={`ms-2 badge ${getOverallCategory() === 'HIGH' ? 'bg-danger' : getOverallCategory() === 'MODERATE' ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {getOverallCategory()} Impact
                        </span>
                      </p>
                      <p className="mb-0">
                        <strong>Impact Levels:</strong> 
                        C-{formData.confidentialityImpact?.toUpperCase()}, 
                        I-{formData.integrityImpact?.toUpperCase()}, 
                        A-{formData.availabilityImpact?.toUpperCase()}
                      </p>
                    </div>
                    <div className="col-md-4 text-end">
                      <button 
                        className="btn btn-primary"
                        onClick={handleSubmit}
                      >
                        <i className="bi bi-save me-2"></i>
                        Complete Categorization
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <h6>Next Steps</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-arrow-right text-primary me-2"></i>
                      Select appropriate security control baseline
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-arrow-right text-primary me-2"></i>
                      Begin security control implementation
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-arrow-right text-primary me-2"></i>
                      Develop System Security Plan (SSP)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemCategorizationWizard;