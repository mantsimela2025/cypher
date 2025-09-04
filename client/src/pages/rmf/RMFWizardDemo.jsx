/**
 * RMF Wizard Demo Page
 * Showcases the new clean, step-by-step wizard interface
 */

import React from "react";
import { Link } from "react-router-dom";
import { Row, Col, Button, Badge } from "reactstrap";
import { Icon, PreviewCard } from "@/components/Component";

const RMFWizardDemo = () => {
  const wizardFeatures = [
    {
      icon: "activity",
      title: "Step-by-Step Guidance",
      description: "Clean, focused interface that guides users through each RMF step without overwhelming them with information."
    },
    {
      icon: "cpu",
      title: "AI-Powered Assistance",
      description: "Integrated AI helps with system categorization and control selection, making the process faster and more accurate."
    },
    {
      icon: "check-circle",
      title: "Progress Tracking",
      description: "Visual progress indicators show completion status and allow easy navigation between completed steps."
    },
    {
      icon: "shield-check",
      title: "Validation & Quality",
      description: "Built-in validation ensures all required information is captured before proceeding to the next step."
    }
  ];

  const wizardSteps = [
    {
      id: 1,
      title: "Project Setup",
      description: "Define project scope, timeline, and stakeholders",
      icon: "setting",
      color: "primary"
    },
    {
      id: 2,
      title: "System Identification",
      description: "Identify and document system boundaries",
      icon: "grid",
      color: "info"
    },
    {
      id: 3,
      title: "Categorization",
      description: "FIPS 199 impact level categorization",
      icon: "layers",
      color: "warning"
    },
    {
      id: 4,
      title: "Control Selection",
      description: "Choose appropriate security controls",
      icon: "shield-check",
      color: "success"
    },
    {
      id: 5,
      title: "Implementation Plan",
      description: "Plan control implementation strategy",
      icon: "clipboard",
      color: "purple"
    },
    {
      id: 6,
      title: "Assessment Plan",
      description: "Plan security control assessment",
      icon: "check-circle",
      color: "pink"
    },
    {
      id: 7,
      title: "Authorization",
      description: "Risk acceptance and ATO decision",
      icon: "award",
      color: "orange"
    },
    {
      id: 8,
      title: "Monitoring",
      description: "Continuous monitoring strategy",
      icon: "activity",
      color: "teal"
    }
  ];

  return (
    <div className="nk-content">
      <div className="container-fluid">
        <div className="nk-content-inner">
          <div className="nk-content-body">
            
            {/* Page Header */}
            <div className="nk-block-head nk-block-head-sm">
              <div className="nk-block-between">
                <div className="nk-block-head-content">
                  <h3 className="nk-block-title page-title">
                    RMF Wizard - Clean & Focused Interface
                  </h3>
                  <div className="nk-block-des text-soft">
                    <p>Experience the new step-by-step wizard that makes RMF implementation simple and manageable</p>
                  </div>
                </div>
                <div className="nk-block-head-content">
                  <Link to="/rmf/wizard/new" className="btn btn-primary">
                    <Icon name="activity" className="me-1"></Icon>
                    Try the Wizard
                  </Link>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div className="nk-block">
              <div className="row g-gs">
                <div className="col-12">
                  <PreviewCard>
                    <div className="card-inner">
                      <h5 className="mb-4">Key Features</h5>
                      <Row className="g-4">
                        {wizardFeatures.map((feature, index) => (
                          <Col md="6" key={index}>
                            <div className="d-flex">
                              <div className="flex-shrink-0">
                                <div className="feature-icon bg-primary bg-opacity-10 text-primary rounded p-3 me-3">
                                  <Icon name={feature.icon} style={{ fontSize: '24px' }}></Icon>
                                </div>
                              </div>
                              <div className="flex-grow-1">
                                <h6 className="mb-2">{feature.title}</h6>
                                <p className="text-soft mb-0">{feature.description}</p>
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </PreviewCard>
                </div>
              </div>
            </div>

            {/* Wizard Steps Overview */}
            <div className="nk-block">
              <div className="row g-gs">
                <div className="col-12">
                  <PreviewCard>
                    <div className="card-inner">
                      <h5 className="mb-4">Wizard Steps</h5>
                      <p className="text-soft mb-4">
                        The wizard breaks down the complex RMF process into 8 manageable steps, 
                        each focused on a specific aspect of the implementation.
                      </p>
                      
                      <Row className="g-3">
                        {wizardSteps.map((step, index) => (
                          <Col md="6" lg="3" key={step.id}>
                            <div className="wizard-step-preview border rounded p-3 h-100">
                              <div className="d-flex align-items-center mb-3">
                                <div className={`step-number bg-${step.color} bg-opacity-10 text-${step.color} rounded-circle d-flex align-items-center justify-content-center me-3`}
                                     style={{ width: '40px', height: '40px' }}>
                                  <Icon name={step.icon}></Icon>
                                </div>
                                <Badge color={step.color} className="ms-auto">
                                  Step {step.id}
                                </Badge>
                              </div>
                              <h6 className="mb-2">{step.title}</h6>
                              <p className="text-soft small mb-0">{step.description}</p>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  </PreviewCard>
                </div>
              </div>
            </div>

            {/* Before vs After Comparison */}
            <div className="nk-block">
              <div className="row g-gs">
                <div className="col-md-6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="d-flex align-items-center mb-3">
                        <Icon name="alert-triangle" className="text-warning me-2"></Icon>
                        <h6 className="mb-0">Before: Complex Interface</h6>
                      </div>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <Icon name="cross" className="text-danger me-2"></Icon>
                          Too much information on one page
                        </li>
                        <li className="mb-2">
                          <Icon name="cross" className="text-danger me-2"></Icon>
                          Overwhelming for new users
                        </li>
                        <li className="mb-2">
                          <Icon name="cross" className="text-danger me-2"></Icon>
                          Difficult to track progress
                        </li>
                        <li className="mb-2">
                          <Icon name="cross" className="text-danger me-2"></Icon>
                          No guided workflow
                        </li>
                      </ul>
                    </div>
                  </PreviewCard>
                </div>
                <div className="col-md-6">
                  <PreviewCard>
                    <div className="card-inner">
                      <div className="d-flex align-items-center mb-3">
                        <Icon name="check-circle" className="text-success me-2"></Icon>
                        <h6 className="mb-0">After: Clean Wizard</h6>
                      </div>
                      <ul className="list-unstyled">
                        <li className="mb-2">
                          <Icon name="check" className="text-success me-2"></Icon>
                          One focused task per step
                        </li>
                        <li className="mb-2">
                          <Icon name="check" className="text-success me-2"></Icon>
                          Clear progress indicators
                        </li>
                        <li className="mb-2">
                          <Icon name="check" className="text-success me-2"></Icon>
                          AI-powered assistance
                        </li>
                        <li className="mb-2">
                          <Icon name="check" className="text-success me-2"></Icon>
                          Step-by-step guidance
                        </li>
                      </ul>
                    </div>
                  </PreviewCard>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="nk-block">
              <div className="row g-gs">
                <div className="col-12">
                  <PreviewCard>
                    <div className="card-inner text-center">
                      <Icon name="activity" className="text-primary mb-3" style={{ fontSize: '48px' }}></Icon>
                      <h5 className="mb-3">Ready to Experience the New RMF Wizard?</h5>
                      <p className="text-soft mb-4">
                        Start a new RMF project using our clean, step-by-step wizard interface. 
                        Complete your RMF implementation faster and with more confidence.
                      </p>
                      <div className="d-flex gap-3 justify-content-center">
                        <Link to="/rmf/wizard/new" className="btn btn-primary btn-lg">
                          <Icon name="activity" className="me-2"></Icon>
                          Start New Project
                        </Link>
                        <Link to="/rmf/projects" className="btn btn-outline-primary btn-lg">
                          <Icon name="list" className="me-2"></Icon>
                          View All Projects
                        </Link>
                      </div>
                    </div>
                  </PreviewCard>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RMFWizardDemo;
