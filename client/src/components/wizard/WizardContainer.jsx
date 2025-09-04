/**
 * Wizard Container Component
 * Manages wizard state and provides navigation controls
 * Clean, focused interface for multi-step processes
 */

import React, { useState, useEffect } from "react";
import { Button, Icon, PreviewCard } from "@/components/Component";
import WizardNavigation from "./WizardNavigation";

const WizardContainer = ({
  steps = [],
  initialStep = 0,
  completedSteps: initialCompletedSteps = [],
  onStepChange = () => {},
  onComplete = () => {},
  onCancel = () => {},
  showNavigation = true,
  showStepControls = true,
  allowSkipping = false,
  className = ""
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState(initialCompletedSteps);
  const [stepData, setStepData] = useState({});

  // Update parent when step changes
  useEffect(() => {
    onStepChange(currentStep, stepData[currentStep]);
  }, [currentStep, stepData, onStepChange]);

  /**
   * Navigate to specific step
   */
  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      // Only allow navigation to completed steps or next step
      if (completedSteps.includes(stepIndex) || stepIndex <= currentStep + 1 || allowSkipping) {
        setCurrentStep(stepIndex);
      }
    }
  };

  /**
   * Go to next step
   */
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Wizard complete
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      onComplete(stepData);
    }
  };

  /**
   * Go to previous step
   */
  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Update step data
   */
  const updateStepData = (data) => {
    setStepData(prev => ({
      ...prev,
      [currentStep]: { ...prev[currentStep], ...data }
    }));
  };

  /**
   * Mark current step as complete and move to next
   */
  const completeCurrentStep = () => {
    nextStep();
  };

  /**
   * Check if current step can proceed
   */
  const canProceed = () => {
    const step = steps[currentStep];
    if (step?.validate) {
      return step.validate(stepData[currentStep]);
    }
    return true;
  };

  /**
   * Get current step component
   */
  const getCurrentStepComponent = () => {
    const step = steps[currentStep];
    if (!step?.component) return null;

    const StepComponent = step.component;
    return (
      <StepComponent
        stepData={stepData[currentStep] || {}}
        allStepData={stepData}
        onDataChange={updateStepData}
        onNext={nextStep}
        onPrevious={previousStep}
        onComplete={completeCurrentStep}
        canProceed={canProceed()}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === steps.length - 1}
      />
    );
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className={`wizard-container ${className}`}>
      {/* Wizard Navigation */}
      {showNavigation && (
        <PreviewCard>
          <div className="card-inner">
            <WizardNavigation
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
              onStepClick={goToStep}
            />
          </div>
        </PreviewCard>
      )}

      {/* Step Content */}
      <div className="wizard-content mt-4">
        <PreviewCard>
          <div className="card-inner">
            {/* Step Header */}
            <div className="wizard-step-header mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{steps[currentStep]?.title}</h5>
                  {steps[currentStep]?.description && (
                    <p className="text-soft mb-0">{steps[currentStep].description}</p>
                  )}
                </div>
                <div className="d-flex gap-2">
                  {steps[currentStep]?.helpText && (
                    <Button color="outline-info" size="sm">
                      <Icon name="help" className="me-1"></Icon>
                      Help
                    </Button>
                  )}
                  {onCancel && (
                    <Button color="outline-secondary" size="sm" onClick={onCancel}>
                      <Icon name="cross" className="me-1"></Icon>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Step Component */}
            <div className="wizard-step-content">
              {getCurrentStepComponent()}
            </div>
          </div>
        </PreviewCard>
      </div>

      {/* Step Controls */}
      {showStepControls && (
        <div className="wizard-controls mt-4">
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {!isFirstStep && (
                    <Button color="outline-primary" onClick={previousStep}>
                      <Icon name="arrow-left" className="me-1"></Icon>
                      Previous
                    </Button>
                  )}
                </div>

                <div className="d-flex gap-2">
                  {allowSkipping && !isLastStep && (
                    <Button color="outline-secondary" onClick={nextStep}>
                      Skip Step
                      <Icon name="arrow-right" className="ms-1"></Icon>
                    </Button>
                  )}
                  
                  <Button 
                    color="primary" 
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    {isLastStep ? (
                      <>
                        <Icon name="check" className="me-1"></Icon>
                        Complete
                      </>
                    ) : (
                      <>
                        Next
                        <Icon name="arrow-right" className="ms-1"></Icon>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Step Progress Info */}
              <div className="mt-3 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Step {currentStep + 1} of {steps.length}
                  </small>
                  <small className="text-muted">
                    {completedSteps.length} steps completed
                  </small>
                </div>
              </div>
            </div>
          </PreviewCard>
        </div>
      )}

      <style jsx>{`
        .wizard-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .wizard-content {
          min-height: 400px;
        }
        
        .wizard-step-content {
          padding: 20px 0;
        }
        
        @media (max-width: 768px) {
          .wizard-controls .d-flex {
            flex-direction: column;
            gap: 10px;
          }
          
          .wizard-controls .d-flex > div {
            width: 100%;
          }
          
          .wizard-controls button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default WizardContainer;
