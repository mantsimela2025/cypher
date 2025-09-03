import React, { useState } from "react";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Icon,
  Row,
  Col,
  Button,
  PreviewCard,
} from "@/components/Component";
import { Link } from "react-router-dom";

const RMFWorkflowStepper = ({ 
  currentStep = "CATEGORIZE", 
  projectId = null, 
  onStepChange = () => {}, 
  completedSteps = [],
  showNavigation = true 
}) => {
  const rmfSteps = [
    {
      id: "CATEGORIZE",
      number: 1,
      title: "CATEGORIZE",
      subtitle: "Information Systems & Data",
      description: "Categorize information systems and the information processed, stored, and transmitted by those systems based on an impact analysis.",
      icon: "property",
      color: "primary",
      tasks: [
        "Identify system boundaries",
        "Determine system impact levels",
        "Document system categorization",
        "Review and approve categorization"
      ]
    },
    {
      id: "SELECT",
      number: 2,
      title: "SELECT",
      subtitle: "Security Controls",
      description: "Select an initial set of baseline security controls for the information system based on the security categorization.",
      icon: "check-square",
      color: "info",
      tasks: [
        "Select baseline security controls",
        "Apply tailoring guidance",
        "Document control selection decisions",
        "Review selected controls"
      ]
    },
    {
      id: "IMPLEMENT",
      number: 3,
      title: "IMPLEMENT",
      subtitle: "Security Controls",
      description: "Implement the security controls and document how the controls are deployed within the information system.",
      icon: "code",
      color: "warning",
      tasks: [
        "Deploy security controls",
        "Configure control parameters",
        "Document implementation details",
        "Verify control deployment"
      ]
    },
    {
      id: "ASSESS",
      number: 4,
      title: "ASSESS",
      subtitle: "Security Controls",
      description: "Assess the security controls using appropriate procedures to determine the extent to which the controls are implemented correctly.",
      icon: "shield-check",
      color: "purple",
      tasks: [
        "Develop assessment plan",
        "Execute control testing",
        "Document assessment results",
        "Identify control deficiencies"
      ]
    },
    {
      id: "AUTHORIZE",
      number: 5,
      title: "AUTHORIZE",
      subtitle: "Information System",
      description: "Authorize information system operation based on a determination of the risk to organizational operations and assets.",
      icon: "check-thick",
      color: "success",
      tasks: [
        "Prepare security assessment report",
        "Develop plan of action and milestones",
        "Make risk-based authorization decision",
        "Issue authorization to operate"
      ]
    },
    {
      id: "MONITOR",
      number: 6,
      title: "MONITOR",
      subtitle: "Security Controls",
      description: "Monitor the security controls in the information system on an ongoing basis including assessing control effectiveness.",
      icon: "monitor",
      color: "dark",
      tasks: [
        "Implement continuous monitoring strategy",
        "Assess control effectiveness regularly",
        "Update security documentation",
        "Report security status"
      ]
    }
  ];

  const getCurrentStepIndex = () => {
    return rmfSteps.findIndex(step => step.id === currentStep);
  };

  const isStepCompleted = (stepId) => {
    return completedSteps.includes(stepId);
  };

  const isStepAccessible = (stepIndex) => {
    if (stepIndex === 0) return true; // First step is always accessible
    return isStepCompleted(rmfSteps[stepIndex - 1].id); // Can access if previous step is completed
  };

  const getStepStatus = (step, index) => {
    if (step.id === currentStep) return 'current';
    if (isStepCompleted(step.id)) return 'completed';
    if (isStepAccessible(index)) return 'accessible';
    return 'locked';
  };

  const handleStepClick = (step, index) => {
    const status = getStepStatus(step, index);
    if (status === 'current' || status === 'locked') return;
    
    if (showNavigation) {
      onStepChange(step.id);
    }
  };

  const getNextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < rmfSteps.length - 1) {
      return rmfSteps[currentIndex + 1];
    }
    return null;
  };

  const getPreviousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      return rmfSteps[currentIndex - 1];
    }
    return null;
  };

  const currentStepData = rmfSteps.find(step => step.id === currentStep);
  const nextStep = getNextStep();
  const previousStep = getPreviousStep();

  return (
    <React.Fragment>
      {/* Horizontal Stepper */}
      <Block>
        <div className="nk-stepper nk-stepper-s1">
          <div className="nk-stepper-nav">
            {rmfSteps.map((step, index) => {
              const status = getStepStatus(step, index);
              const isClickable = status !== 'current' && status !== 'locked' && showNavigation;
              
              return (
                <div 
                  key={step.id}
                  className={`nk-stepper-item ${status === 'current' ? 'current' : ''} ${status === 'completed' ? 'completed' : ''}`}
                >
                  <div 
                    className={`nk-stepper-step ${isClickable ? 'clickable' : ''}`}
                    onClick={() => handleStepClick(step, index)}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                  >
                    <div className="nk-stepper-step-trigger">
                      <div className={`nk-stepper-step-number ${status === 'completed' ? `bg-${step.color}` : status === 'current' ? `bg-${step.color}` : status === 'locked' ? 'bg-light' : `bg-${step.color}-dim`}`}>
                        {status === 'completed' ? (
                          <Icon name="check" className="text-white"></Icon>
                        ) : status === 'locked' ? (
                          <Icon name="lock-alt" className="text-soft"></Icon>
                        ) : (
                          <span className={status === 'current' ? 'text-white' : `text-${step.color}`}>
                            {step.number}
                          </span>
                        )}
                      </div>
                      <div className="nk-stepper-step-content">
                        <div className="nk-stepper-step-label">{step.title}</div>
                        <div className="nk-stepper-step-info">{step.subtitle}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Block>

      {/* Current Step Details */}
      {currentStepData && (
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <BlockHead>
                <BlockHeadContent>
                  <div className="d-flex align-items-center">
                    <div className={`me-3 p-3 rounded bg-${currentStepData.color}-dim`}>
                      <Icon name={currentStepData.icon} className={`text-${currentStepData.color}`} style={{ fontSize: '1.5rem' }}></Icon>
                    </div>
                    <div>
                      <BlockTitle tag="h4">
                        Step {currentStepData.number}: {currentStepData.title}
                      </BlockTitle>
                      <BlockTitle tag="h6" className={`text-${currentStepData.color}`}>
                        {currentStepData.subtitle}
                      </BlockTitle>
                    </div>
                  </div>
                  <BlockDes className="text-soft mt-3">
                    <p>{currentStepData.description}</p>
                  </BlockDes>
                </BlockHeadContent>
              </BlockHead>

              {/* Key Tasks for Current Step */}
              <div className="mt-4">
                <h6 className="title">Key Tasks for this Step:</h6>
                <ul className="list-checked list-checked-circle">
                  {currentStepData.tasks.map((task, index) => (
                    <li key={index} className="list-checked-item">
                      <Icon name="check-circle" className={`text-${currentStepData.color} me-2`}></Icon>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Navigation Buttons */}
              {showNavigation && (
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <div>
                    {previousStep ? (
                      <Button
                        color="light"
                        onClick={() => onStepChange(previousStep.id)}
                      >
                        <Icon name="arrow-left" className="me-1"></Icon>
                        Previous: {previousStep.title}
                      </Button>
                    ) : (
                      <div></div>
                    )}
                  </div>
                  
                  <div className="text-center">
                    {projectId && (
                      <Link 
                        to={`/rmf/projects/${projectId}/step/${currentStep.toLowerCase()}`}
                        className={`btn btn-${currentStepData.color} btn-lg`}
                      >
                        <Icon name="arrow-right" className="me-1"></Icon>
                        Continue with {currentStepData.title}
                      </Link>
                    )}
                  </div>
                  
                  <div>
                    {nextStep && isStepCompleted(currentStep) ? (
                      <Button
                        color={nextStep.color}
                        onClick={() => onStepChange(nextStep.id)}
                      >
                        Next: {nextStep.title}
                        <Icon name="arrow-right" className="ms-1"></Icon>
                      </Button>
                    ) : nextStep ? (
                      <Button
                        color="light"
                        disabled
                        title="Complete current step to proceed"
                      >
                        Next: {nextStep.title}
                        <Icon name="arrow-right" className="ms-1"></Icon>
                      </Button>
                    ) : (
                      <div></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PreviewCard>
        </Block>
      )}

      {/* Progress Overview */}
      <Block>
        <Row className="g-gs">
          <Col sm="6" lg="3">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Steps Completed</h6>
                  </div>
                </div>
                <div className="align-end">
                  <div className="number">
                    <span className="amount">{completedSteps.length}</span>
                    <span className="text-base">/ {rmfSteps.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </Col>
          <Col sm="6" lg="3">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Progress</h6>
                  </div>
                </div>
                <div className="align-end">
                  <div className="number">
                    <span className="amount">{Math.round((completedSteps.length / rmfSteps.length) * 100)}</span>
                    <span className="text-base">%</span>
                  </div>
                </div>
                <div className="progress progress-sm mt-2">
                  <div 
                    className={`progress-bar bg-${completedSteps.length < 2 ? 'danger' : completedSteps.length < 4 ? 'warning' : 'success'}`}
                    style={{ width: `${(completedSteps.length / rmfSteps.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Col>
          <Col sm="6" lg="3">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Current Phase</h6>
                  </div>
                </div>
                <div className="align-end">
                  <span className={`badge badge-lg bg-${currentStepData?.color}`}>
                    {currentStepData?.title}
                  </span>
                </div>
              </div>
            </div>
          </Col>
          <Col sm="6" lg="3">
            <div className="card card-bordered">
              <div className="card-inner">
                <div className="card-title-group align-start mb-2">
                  <div className="card-title">
                    <h6 className="title">Next Step</h6>
                  </div>
                </div>
                <div className="align-end">
                  {nextStep ? (
                    <span className={`badge badge-lg bg-${nextStep.color}-dim text-${nextStep.color}`}>
                      {nextStep.title}
                    </span>
                  ) : (
                    <span className="badge badge-lg bg-success">
                      COMPLETED
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Block>
    </React.Fragment>
  );
};

export default RMFWorkflowStepper;