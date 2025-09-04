import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  PreviewCard,
  Button,
  Icon,
  Row,
  Col,
} from "../../../components/Component";
import Content from "../../../layout/content/Content";
import Head from "../../../layout/head/Head";
import RMFWorkflowStepper from "../components/RMFWorkflowStepper";
import { rmfAIApi } from "../../../utils/rmfApi";

const RMFSelectStep = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(['CATEGORIZE']); // Assume CATEGORIZE is completed to reach this step
  const [controlSelection, setControlSelection] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Sample system data (in real implementation, this would come from the CATEGORIZE step)
  const sampleSystemData = {
    name: "Multi-Domain Intelligence Analysis Platform",
    description: "Cloud-native zero trust intelligence analysis platform deployed on OpenShift",
    systemType: "Major Application",
    environment: "Cloud",
    confidentialityImpact: "high",
    integrityImpact: "high",
    availabilityImpact: "high",
    overallImpact: "high"
  };

  // Handle AI control selection
  const handleAIControlSelection = async () => {
    try {
      setAiLoading(true);
      console.log('🤖 Requesting AI control selection...');

      const result = await rmfAIApi.selectSecurityControls(sampleSystemData);

      setControlSelection(result.data);
      console.log('✅ AI control selection completed:', result.data);

    } catch (error) {
      console.error('❌ AI control selection failed:', error);
      alert('AI control selection failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };



  // Early return for debugging
  if (!projectId) {
    return (
      <React.Fragment>
        <Head title="RMF SELECT Step"></Head>
        <Content>
          <div className="text-center py-5">
            <h4>Error: No Project ID</h4>
            <p>Project ID is missing from the URL parameters.</p>
          </div>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="RMF SELECT Step"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle tag="h3" page>
              <Icon name="shield-check" className="me-2"></Icon>
              RMF SELECT Step
            </BlockTitle>
            <BlockDes className="text-soft">
              <p>Select appropriate security controls based on system categorization and impact levels.</p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        {/* Workflow Stepper */}
        <RMFWorkflowStepper
          currentStep="SELECT"
          projectId={projectId}
          completedSteps={completedSteps}
          showNavigation={false}
        />

        {/* Step Overview */}
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <Row className="g-4">
                <Col md="8">
                  <div>
                    <h5 className="mb-3">
                      <Icon name="list-check" className="me-2 text-primary"></Icon>
                      Security Control Selection
                    </h5>
                    <p className="text-soft mb-4">
                      In this step, you'll select appropriate security controls based on the impact levels 
                      determined during the CATEGORIZE step. The system will recommend control baselines 
                      and allow you to tailor controls to your specific environment.
                    </p>
                    
                    <div className="alert alert-info">
                      <Icon name="info" className="me-2"></Icon>
                      <strong>Coming Soon:</strong> This step is currently under development. 
                      Security control selection functionality will be available in the next release.
                    </div>
                  </div>
                </Col>
                <Col md="4">
                  <div className="bg-light rounded p-4">
                    <h6 className="mb-3">SELECT Step Tasks</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <Icon name="check-circle" className="text-success me-2"></Icon>
                        Review system categorizations
                      </li>
                      <li className="mb-2">
                        <Icon name="circle" className="text-soft me-2"></Icon>
                        Select control baselines
                      </li>
                      <li className="mb-2">
                        <Icon name="circle" className="text-soft me-2"></Icon>
                        Tailor security controls
                      </li>
                      <li className="mb-2">
                        <Icon name="circle" className="text-soft me-2"></Icon>
                        Document control decisions
                      </li>
                    </ul>
                  </div>
                </Col>
              </Row>
            </div>
          </PreviewCard>
        </Block>

        {/* AI Control Selection */}
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h6>
                    <Icon name="cpu" className="me-2 text-primary"></Icon>
                    AI-Powered Control Selection
                  </h6>
                  <p className="text-soft mb-0">
                    Let AI recommend appropriate security controls based on your system categorization.
                  </p>
                </div>
                <Button
                  color="primary"
                  onClick={handleAIControlSelection}
                  disabled={aiLoading}
                >
                  <Icon name="cpu" className="me-1"></Icon>
                  {aiLoading ? 'Analyzing...' : 'Get AI Recommendations'}
                </Button>
              </div>

              {!controlSelection && !aiLoading && (
                <div className="text-center py-4">
                  <Icon name="shield-check" className="text-soft" style={{ fontSize: '2.5rem' }}></Icon>
                  <h6 className="mt-3 text-soft">Ready for AI Analysis</h6>
                  <p className="text-soft">
                    Click "Get AI Recommendations" to analyze your system and receive tailored control suggestions.
                  </p>
                </div>
              )}

              {aiLoading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h6 className="mt-3">AI Analysis in Progress</h6>
                  <p className="text-soft">
                    Analyzing system characteristics and determining optimal security controls...
                  </p>
                </div>
              )}

              {controlSelection && (
                <div>
                  <div className="alert alert-success">
                    <Icon name="check-circle" className="me-2"></Icon>
                    <strong>AI Analysis Complete!</strong> Recommended baseline: <span className="badge bg-primary">{controlSelection.baseline}</span>
                  </div>

                  <Row className="g-4">
                    <Col md="6">
                      <h6 className="mb-3">Control Families</h6>
                      {controlSelection.controlFamilies?.map((family, index) => (
                        <div key={index} className="border rounded p-3 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{family.family} - {family.name}</strong>
                            <span className={`badge ${family.priority === 'HIGH' ? 'bg-danger' : family.priority === 'MEDIUM' ? 'bg-warning' : 'bg-success'}`}>
                              {family.priority}
                            </span>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {family.controls?.map((control, idx) => (
                              <span key={idx} className="badge bg-light text-dark">{control}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </Col>

                    <Col md="6">
                      <h6 className="mb-3">Implementation Priorities</h6>
                      {controlSelection.implementationPriorities?.map((phase, index) => (
                        <div key={index} className="border rounded p-3 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <strong>{phase.phase}</strong>
                            <span className="badge bg-info">{phase.timeframe}</span>
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {phase.controls?.map((control, idx) => (
                              <span key={idx} className="badge bg-light text-dark">{control}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </Col>
                  </Row>

                  {controlSelection.reasoning && (
                    <div className="mt-4">
                      <h6>AI Reasoning</h6>
                      <div className="bg-light rounded p-3">
                        <p className="mb-0">{controlSelection.reasoning}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </PreviewCard>
        </Block>

        {/* Step Navigation */}
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Button color="light" disabled>
                    <Icon name="arrow-left" className="me-1"></Icon>
                    Previous: CATEGORIZE
                  </Button>
                </div>
                <div>
                  <Button
                    color="success"
                    size="lg"
                    disabled={!controlSelection}
                    onClick={() => {
                      alert('SELECT step completed! Ready to proceed to IMPLEMENT step.');
                      // Navigate to IMPLEMENT step
                      navigate(`/rmf/projects/${projectId}/step/implement`);
                    }}
                  >
                    <Icon name="check-thick" className="me-1"></Icon>
                    Complete Selection
                  </Button>
                </div>
                <div>
                  <Button color="light" disabled>
                    Next: IMPLEMENT
                    <Icon name="arrow-right" className="ms-1"></Icon>
                  </Button>
                </div>
              </div>
            </div>
          </PreviewCard>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default RMFSelectStep;
