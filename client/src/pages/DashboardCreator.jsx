import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Row,
  Col,
  Button,
  Icon,
} from "@/components/Component";
import {
  Card,
  Modal,
  ModalBody,
  Input,
  FormGroup,
  Label,
} from "reactstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import MetricsLibrary from "../components/dashboard-creator/MetricsLibrary";
import DashboardCanvas from "../components/dashboard-creator/DashboardCanvas";

const DashboardCreator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [dashboardData, setDashboardData] = useState({
    name: '',
    description: '',
    widgets: [],
    layout: {},
    isPublished: false
  });
  const [gridSettings, setGridSettings] = useState({
    showGrid: true,
    gridSize: 20,
    snapToGrid: true
  });
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);

  // Load dashboard for editing
  useEffect(() => {
    if (editId) {
      loadDashboardForEditing(editId);
    }
  }, [editId]);

  const loadDashboardForEditing = async (dashboardId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/dashboards/${dashboardId}/edit`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData({
          id: data.data.id,
          name: data.data.name,
          description: data.data.description || '',
          widgets: data.data.widgets || [],
          layout: data.data.layout || {},
          isPublished: data.data.isPublished || false
        });
      } else {
        console.error('Failed to load dashboard');
        navigate('/my-dashboards');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      navigate('/my-dashboards');
    } finally {
      setLoading(false);
    }
  };

  // Step validation
  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return dashboardData.name.trim().length > 0;
      case 2:
        return dashboardData.widgets.length > 0;
      case 3:
        return true; // Layout step is always valid
      case 4:
        return true; // Review step is always valid
      default:
        return false;
    }
  };

  // Navigation handlers
  const nextStep = () => {
    if (currentStep < 4 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step) => {
    if (step <= currentStep || isStepValid(step - 1)) {
      setCurrentStep(step);
    }
  };

  // Save dashboard
  const saveDashboard = async (publish = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const payload = {
        ...dashboardData,
        layout: { ...dashboardData.layout, gridSettings },
        isPublished: publish
      };

      let response;
      if (editId) {
        // Update existing dashboard
        response = await fetch(`/api/v1/dashboards/${editId}/widgets`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ widgets: payload.widgets })
        });
      } else {
        // Create new dashboard
        response = await fetch('/api/v1/dashboards/creator', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const data = await response.json();
        
        // If publishing, make separate publish call
        if (publish && !editId) {
          await fetch(`/api/v1/dashboards/${data.data.id}/publish`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isPublished: true })
          });
        }

        navigate('/my-dashboards');
      } else {
        console.error('Failed to save dashboard');
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { number: 1, title: 'Basic Info', icon: 'info' },
      { number: 2, title: 'Add Metrics', icon: 'plus-circle' },
      { number: 3, title: 'Layout & Design', icon: 'grid-alt' },
      { number: 4, title: 'Review & Publish', icon: 'check-circle' }
    ];

    return (
      <div className="nk-stepper">
        <div className="nk-stepper-nav">
          {steps.map((step) => (
            <div 
              key={step.number}
              className={`nk-stepper-item ${currentStep === step.number ? 'current' : ''} ${currentStep > step.number ? 'completed' : ''}`}
              onClick={() => goToStep(step.number)}
              style={{ cursor: 'pointer' }}
            >
              <div className="nk-stepper-step">
                <div className="nk-stepper-step-trigger">
                  <Icon name={currentStep > step.number ? 'check' : step.icon} />
                </div>
              </div>
              <div className="nk-stepper-content">
                <div className="nk-stepper-title">{step.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="card-bordered">
            <div className="card-inner">
              <h5 className="card-title">Dashboard Information</h5>
              <p className="text-soft">Give your dashboard a name and description to get started. You can add metrics and customize the layout in the next steps.</p>
              
              <FormGroup>
                <Label className="form-label" htmlFor="dashboard-name">
                  Dashboard Name <span className="text-danger">*</span>
                </Label>
                <Input
                  type="text"
                  id="dashboard-name"
                  placeholder="Enter dashboard name"
                  value={dashboardData.name}
                  onChange={(e) => setDashboardData({...dashboardData, name: e.target.value})}
                />
              </FormGroup>

              <FormGroup>
                <Label className="form-label" htmlFor="dashboard-description">
                  Description (Optional)
                </Label>
                <Input
                  type="textarea"
                  id="dashboard-description"
                  placeholder="Add a brief description to help others understand the purpose of this dashboard"
                  value={dashboardData.description}
                  onChange={(e) => setDashboardData({...dashboardData, description: e.target.value})}
                  rows="3"
                />
              </FormGroup>
            </div>
          </Card>
        );

      case 2:
        return (
          <Row className="g-gs">
            <Col lg="4">
              <MetricsLibrary
                onMetricSelect={(metric) => {
                  // Add metric as widget when clicked
                  const newWidget = {
                    id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    metricId: metric.id,
                    metricName: metric.name,
                    metricType: metric.type,
                    metricCategory: metric.category,
                    metricData: metric,
                    x: Math.random() * 200,
                    y: Math.random() * 200,
                    width: 250,
                    height: 150,
                    config: {}
                  };
                  setDashboardData({
                    ...dashboardData,
                    widgets: [...dashboardData.widgets, newWidget]
                  });
                }}
              />
            </Col>
            <Col lg="8">
              <DashboardCanvas
                widgets={dashboardData.widgets}
                onWidgetsChange={(widgets) => setDashboardData({...dashboardData, widgets})}
                gridSettings={gridSettings}
                onGridSettingsChange={setGridSettings}
              />
            </Col>
          </Row>
        );

      case 3:
        return (
          <Row className="g-gs">
            <Col lg="4">
              <Card className="card-bordered">
                <div className="card-inner">
                  <h6 className="card-title">Layout Settings</h6>
                  <p className="text-soft">Customize your dashboard layout and grid settings.</p>

                  <div className="form-group">
                    <div className="custom-control custom-switch">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="showGrid"
                        checked={gridSettings.showGrid}
                        onChange={(e) => setGridSettings({...gridSettings, showGrid: e.target.checked})}
                      />
                      <label className="custom-control-label" htmlFor="showGrid">Show Grid</label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Grid Size</label>
                    <select
                      className="form-select"
                      value={gridSettings.gridSize}
                      onChange={(e) => setGridSettings({...gridSettings, gridSize: parseInt(e.target.value)})}
                    >
                      <option value={10}>10px</option>
                      <option value={20}>20px</option>
                      <option value={30}>30px</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <div className="custom-control custom-switch">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="snapToGrid"
                        checked={gridSettings.snapToGrid}
                        onChange={(e) => setGridSettings({...gridSettings, snapToGrid: e.target.checked})}
                      />
                      <label className="custom-control-label" htmlFor="snapToGrid">Snap to Grid</label>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col lg="8">
              <DashboardCanvas
                widgets={dashboardData.widgets}
                onWidgetsChange={(widgets) => setDashboardData({...dashboardData, widgets})}
                gridSettings={gridSettings}
                onGridSettingsChange={setGridSettings}
              />
            </Col>
          </Row>
        );

      case 4:
        return (
          <Card className="card-bordered">
            <div className="card-inner">
              <h5 className="card-title">Review & Publish</h5>
              <p className="text-soft">Review your dashboard and publish it when ready.</p>
              
              <div className="dashboard-preview">
                <h6>Dashboard Summary</h6>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Name:</span>
                    <strong>{dashboardData.name}</strong>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Description:</span>
                    <span>{dashboardData.description || 'No description'}</span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between">
                    <span>Widgets:</span>
                    <span>{dashboardData.widgets.length} widgets</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4">
                <Button 
                  color="light" 
                  size="md" 
                  className="me-2"
                  onClick={() => setPreviewModal(true)}
                >
                  <Icon name="eye" />
                  <span>Preview</span>
                </Button>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <React.Fragment>
        <Head title="Dashboard Creator" />
        <Content>
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="Dashboard Creator" />
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <div className="nk-block-head-between">
              <div className="nk-block-head-content">
                <BlockTitle page>
                  {editId ? 'Edit Dashboard' : 'Create Dashboard'}
                </BlockTitle>
                <BlockDes className="text-soft">
                  Build custom analytics dashboards with drag and drop widgets
                </BlockDes>
              </div>
              <div className="nk-block-head-content">
                <Button 
                  color="light" 
                  size="md"
                  onClick={() => navigate('/my-dashboards')}
                >
                  <Icon name="arrow-left" />
                  <span>Back to Dashboards</span>
                </Button>
              </div>
            </div>
          </BlockHeadContent>
        </BlockHead>

        {/* Step Indicator */}
        <Block>
          {renderStepIndicator()}
        </Block>

        {/* Step Content */}
        <Block>
          <Row>
            <Col lg="8">
              {renderStepContent()}
            </Col>
            <Col lg="4">
              <Card className="card-bordered">
                <div className="card-inner">
                  <h6 className="card-title">Progress</h6>
                  <div className="progress-wrap">
                    <div className="progress-text">
                      <span>Step {currentStep} of 4</span>
                    </div>
                    <div className="progress progress-md">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${(currentStep / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Block>

        {/* Navigation */}
        <Block>
          <div className="d-flex justify-content-between">
            <Button 
              color="light" 
              size="md"
              disabled={currentStep === 1}
              onClick={prevStep}
            >
              <Icon name="arrow-left" />
              <span>Previous</span>
            </Button>

            <div>
              {currentStep === 4 ? (
                <>
                  <Button 
                    color="light" 
                    size="md" 
                    className="me-2"
                    onClick={() => saveDashboard(false)}
                    disabled={loading}
                  >
                    <Icon name="save" />
                    <span>Save Draft</span>
                  </Button>
                  <Button 
                    color="primary" 
                    size="md"
                    onClick={() => saveDashboard(true)}
                    disabled={loading}
                  >
                    <Icon name="check" />
                    <span>Publish</span>
                  </Button>
                </>
              ) : (
                <Button 
                  color="primary" 
                  size="md"
                  disabled={!isStepValid(currentStep)}
                  onClick={nextStep}
                >
                  <span>Next Step</span>
                  <Icon name="arrow-right" />
                </Button>
              )}
            </div>
          </div>
        </Block>

        {/* Preview Modal */}
        <Modal isOpen={previewModal} toggle={() => setPreviewModal(false)} size="xl">
          <ModalBody>
            <div className="text-center py-5">
              <Icon name="eye" className="text-primary" style={{ fontSize: '3rem' }} />
              <h5 className="mt-3">Dashboard Preview</h5>
              <p className="text-soft">Preview functionality will be implemented with the canvas system.</p>
              <Button color="primary" onClick={() => setPreviewModal(false)}>
                Close Preview
              </Button>
            </div>
          </ModalBody>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default DashboardCreator;
