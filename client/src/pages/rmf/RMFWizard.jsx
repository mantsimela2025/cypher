/**
 * RMF Wizard - Clean, Step-by-Step RMF Implementation
 * Simplified version to avoid import errors
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import { 
  Block, 
  BlockHead, 
  BlockHeadContent, 
  BlockTitle, 
  BlockDes, 
  Button,
  Icon,
  PreviewCard
} from "@/components/Component";
import { Alert } from "reactstrap";

const RMFWizard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState({
    id: projectId,
    name: 'Sample RMF Project',
    description: 'Sample project for testing'
  });
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Project Setup',
    'System Identification', 
    'System Categorization',
    'Control Selection',
    'Implementation Plan',
    'Assessment Plan',
    'Authorization',
    'Monitoring'
  ];

  return (
    <React.Fragment>
      <Head title="RMF Wizard" />
      <Content>
        {/* Simple Navigation */}
        <div className="mb-3">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Home</a>
              </li>
              <li className="breadcrumb-item">
                <a href="/rmf/projects">RMF Projects</a>
              </li>
              {project?.name && (
                <li className="breadcrumb-item">
                  <a href={`/rmf/projects/${projectId}`}>{project.name}</a>
                </li>
              )}
              <li className="breadcrumb-item active" aria-current="page">
                Wizard
              </li>
            </ol>
          </nav>
        </div>

        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle page>
              <Icon name="shield-check" className="me-2 text-primary"></Icon>
              RMF Implementation Wizard
            </BlockTitle>
            <BlockDes className="text-soft">
              Step-by-step guide through the Risk Management Framework process
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="text-center py-5">
                <Icon name="cpu" className="text-primary mb-3" style={{ fontSize: '3rem' }} />
                <h5 className="mb-3">RMF Wizard</h5>
                <p className="text-soft mb-4">
                  Project: <strong>{project?.name || 'Loading...'}</strong>
                </p>
                
                <div className="mb-4">
                  <h6 className="mb-3">RMF Process Steps:</h6>
                  <div className="row g-3">
                    {steps.map((step, index) => (
                      <div key={index} className="col-md-6 col-lg-3">
                        <div className={`p-3 border rounded ${index === currentStep ? 'bg-primary text-white' : 'bg-light'}`}>
                          <div className="d-flex align-items-center">
                            <span className={`badge ${index === currentStep ? 'badge-light' : 'badge-primary'} me-2`}>
                              {index + 1}
                            </span>
                            <span className="small">{step}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <Button 
                    color="secondary" 
                    onClick={() => navigate('/rmf/projects')}
                  >
                    <Icon name="arrow-left" className="me-1" />
                    Back to Projects
                  </Button>
                  <Button color="primary">
                    <Icon name="play" className="me-1" />
                    Start Wizard
                  </Button>
                </div>

                <Alert color="info" className="mt-4">
                  <Icon name="info" className="me-2" />
                  This is a simplified version of the RMF Wizard. The full wizard with step-by-step guidance will be implemented here.
                </Alert>
              </div>
            </div>
          </PreviewCard>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default RMFWizard;
