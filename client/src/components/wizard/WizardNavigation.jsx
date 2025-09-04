/**
 * Wizard Navigation Component
 * Clean, step-by-step navigation for multi-step processes
 * Inspired by modern wizard interfaces with progress indicators
 */

import React from "react";
import { Icon } from "@/components/Component";

const WizardNavigation = ({ 
  steps = [],
  currentStep = 0,
  completedSteps = [],
  onStepClick = () => {},
  showStepNumbers = true,
  showConnectors = true,
  className = ""
}) => {
  
  /**
   * Get step status and styling
   */
  const getStepStatus = (stepIndex) => {
    if (completedSteps.includes(stepIndex)) {
      return {
        status: 'completed',
        bgColor: 'bg-success',
        textColor: 'text-success',
        iconColor: 'text-white',
        connectorColor: 'bg-success'
      };
    } else if (stepIndex === currentStep) {
      return {
        status: 'current',
        bgColor: 'bg-primary',
        textColor: 'text-primary',
        iconColor: 'text-white',
        connectorColor: 'bg-light'
      };
    } else if (stepIndex < currentStep) {
      return {
        status: 'accessible',
        bgColor: 'bg-light',
        textColor: 'text-muted',
        iconColor: 'text-muted',
        connectorColor: 'bg-light'
      };
    } else {
      return {
        status: 'upcoming',
        bgColor: 'bg-light',
        textColor: 'text-muted',
        iconColor: 'text-muted',
        connectorColor: 'bg-light'
      };
    }
  };

  /**
   * Handle step click
   */
  const handleStepClick = (stepIndex, step) => {
    // Only allow clicking on completed steps or current step
    if (completedSteps.includes(stepIndex) || stepIndex <= currentStep) {
      onStepClick(stepIndex, step);
    }
  };

  return (
    <div className={`wizard-navigation ${className}`}>
      <div className="wizard-steps d-flex align-items-center justify-content-between position-relative">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(index);
          const isClickable = completedSteps.includes(index) || index <= currentStep;
          
          return (
            <div key={index} className="wizard-step d-flex flex-column align-items-center position-relative">
              {/* Step Circle */}
              <div 
                className={`wizard-step-circle d-flex align-items-center justify-content-center rounded-circle ${stepStatus.bgColor} ${isClickable ? 'cursor-pointer' : ''}`}
                style={{ 
                  width: '48px', 
                  height: '48px',
                  transition: 'all 0.3s ease',
                  cursor: isClickable ? 'pointer' : 'default'
                }}
                onClick={() => handleStepClick(index, step)}
              >
                {stepStatus.status === 'completed' ? (
                  <Icon name="check" className={stepStatus.iconColor} style={{ fontSize: '18px' }}></Icon>
                ) : step.icon ? (
                  <Icon name={step.icon} className={stepStatus.iconColor} style={{ fontSize: '18px' }}></Icon>
                ) : showStepNumbers ? (
                  <span className={`fw-bold ${stepStatus.iconColor}`} style={{ fontSize: '16px' }}>
                    {index + 1}
                  </span>
                ) : (
                  <Icon name="circle" className={stepStatus.iconColor} style={{ fontSize: '8px' }}></Icon>
                )}
              </div>

              {/* Step Label */}
              <div className="wizard-step-label text-center mt-2" style={{ maxWidth: '120px' }}>
                <div className={`fw-bold small ${stepStatus.textColor}`}>
                  {step.title}
                </div>
                {step.subtitle && (
                  <div className="text-muted" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                    {step.subtitle}
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {showConnectors && index < steps.length - 1 && (
                <div 
                  className={`wizard-connector position-absolute ${stepStatus.connectorColor}`}
                  style={{
                    height: '2px',
                    width: 'calc(100vw / ' + steps.length + ' - 60px)',
                    left: '48px',
                    top: '23px',
                    zIndex: -1,
                    transition: 'all 0.3s ease'
                  }}
                ></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Info */}
      <div className="wizard-current-step mt-4 text-center">
        <div className="d-flex align-items-center justify-content-center">
          <span className="badge bg-primary me-2">
            Step {currentStep + 1} of {steps.length}
          </span>
          <h6 className="mb-0">{steps[currentStep]?.title}</h6>
        </div>
        {steps[currentStep]?.description && (
          <p className="text-muted small mt-2 mb-0">
            {steps[currentStep].description}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="wizard-progress mt-3">
        <div className="progress" style={{ height: '4px' }}>
          <div 
            className="progress-bar bg-primary"
            style={{ 
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              transition: 'width 0.3s ease'
            }}
          ></div>
        </div>
        <div className="d-flex justify-content-between mt-1">
          <small className="text-muted">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </small>
          <small className="text-muted">
            {completedSteps.length} of {steps.length} steps completed
          </small>
        </div>
      </div>

      <style jsx>{`
        .wizard-navigation {
          padding: 20px 0;
        }
        
        .wizard-step {
          flex: 1;
          min-width: 0;
        }
        
        .wizard-step-circle:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .wizard-step-circle.cursor-pointer:hover {
          transform: translateY(-2px);
        }
        
        .wizard-connector {
          background: linear-gradient(to right, currentColor 50%, #e9ecef 50%);
          background-size: 20px 2px;
        }
        
        @media (max-width: 768px) {
          .wizard-steps {
            flex-direction: column;
            gap: 20px;
          }
          
          .wizard-connector {
            display: none;
          }
          
          .wizard-step {
            flex-direction: row;
            align-items: center;
            text-align: left;
          }
          
          .wizard-step-label {
            margin-left: 15px;
            margin-top: 0 !important;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default WizardNavigation;
