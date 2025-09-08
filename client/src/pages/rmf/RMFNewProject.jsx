import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  Icon,
  Button,
  Row,
  Col,
  PreviewCard,
} from "@/components/Component";
// ✅ CYPHER Standard: Use proper imports
import { rmfProjectsApi } from "@/utils/rmfApi";
import { log } from "@/utils/config";
import { toast } from "react-toastify";
import { FormGroup, Label, Input, Alert, Spinner, Card, CardBody, Badge } from "reactstrap";

const RMFNewProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemType: "cloud", // Default to cloud environment
    owner: "",
    dueDate: "",
    priority: "medium",
    // Enhanced metadata fields
    operationalStatus: "development",
    environment: "cloud",
    dataTypes: [],
    businessCriticality: "medium",
    userBase: "",
    geographicLocation: "",
    regulatoryRequirements: [],
    interconnections: "",
    hostingProvider: "",
    estimatedUsers: "",
    dataRetentionPeriod: "",
    backupStrategy: "",
    disasterRecovery: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps] = useState(3);

  // Form options
  const systemTypeOptions = [
    { value: 'cloud', label: 'Cloud-based System', description: 'Hosted on cloud infrastructure (AWS, Azure, GCP)' },
    { value: 'on_premise', label: 'On-Premise System', description: 'Hosted on organization-owned infrastructure' },
    { value: 'hybrid', label: 'Hybrid System', description: 'Combination of cloud and on-premise components' },
    { value: 'saas', label: 'Software as a Service', description: 'Third-party SaaS application' },
    { value: 'mobile', label: 'Mobile Application', description: 'Mobile app or mobile-first system' },
    { value: 'iot', label: 'IoT/Embedded System', description: 'Internet of Things or embedded devices' }
  ];

  const operationalStatusOptions = [
    { value: 'development', label: 'Development', color: 'info' },
    { value: 'testing', label: 'Testing/QA', color: 'warning' },
    { value: 'staging', label: 'Staging', color: 'secondary' },
    { value: 'production', label: 'Production', color: 'success' },
    { value: 'maintenance', label: 'Maintenance', color: 'warning' },
    { value: 'decommissioned', label: 'Decommissioned', color: 'danger' }
  ];

  const dataTypeOptions = [
    { value: 'financial', label: 'Financial Data', description: 'Financial records, transactions, accounting data' },
    { value: 'pii', label: 'Personally Identifiable Information (PII)', description: 'Names, addresses, SSNs, personal identifiers' },
    { value: 'phi', label: 'Protected Health Information (PHI)', description: 'Medical records, health information' },
    { value: 'intellectual_property', label: 'Intellectual Property', description: 'Patents, trade secrets, proprietary information' },
    { value: 'classified', label: 'Classified Information', description: 'Government classified or sensitive data' },
    { value: 'public', label: 'Public Information', description: 'Publicly available information' },
    { value: 'customer_data', label: 'Customer Data', description: 'Customer information and records' },
    { value: 'employee_data', label: 'Employee Data', description: 'HR records, employee information' }
  ];

  const businessCriticalityOptions = [
    { value: 'low', label: 'Low', description: 'Minimal business impact if unavailable', color: 'success' },
    { value: 'medium', label: 'Medium', description: 'Moderate business impact if unavailable', color: 'warning' },
    { value: 'high', label: 'High', description: 'Significant business impact if unavailable', color: 'danger' },
    { value: 'critical', label: 'Mission Critical', description: 'Business cannot operate without this system', color: 'danger' }
  ];

  const regulatoryOptions = [
    { value: 'sox', label: 'Sarbanes-Oxley (SOX)' },
    { value: 'hipaa', label: 'HIPAA' },
    { value: 'pci_dss', label: 'PCI DSS' },
    { value: 'gdpr', label: 'GDPR' },
    { value: 'ccpa', label: 'CCPA' },
    { value: 'fisma', label: 'FISMA' },
    { value: 'fedramp', label: 'FedRAMP' },
    { value: 'itar', label: 'ITAR' },
    { value: 'cjis', label: 'CJIS' }
  ];

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handle multi-select changes (for arrays)
  const handleMultiSelectChange = (fieldName, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: checked
        ? [...prev[fieldName], value]
        : prev[fieldName].filter(item => item !== value)
    }));

    // Clear error
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ""
      }));
    }
  };

  // Handle step navigation
  const handleNextStep = () => {
    const stepErrors = validateCurrentStep();
    if (Object.keys(stepErrors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      setErrors(stepErrors);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      // Basic Information validation
      if (!formData.name.trim()) {
        newErrors.name = "Project name is required";
      }
      if (!formData.description.trim()) {
        newErrors.description = "Project description is required";
      }
      if (!formData.owner.trim()) {
        newErrors.owner = "Project owner is required";
      }
      if (!formData.dueDate) {
        newErrors.dueDate = "Due date is required";
      }
    } else if (currentStep === 2) {
      // System Details validation
      if (!formData.systemType) {
        newErrors.systemType = "System type is required";
      }
      if (!formData.operationalStatus) {
        newErrors.operationalStatus = "Operational status is required";
      }
      if (formData.dataTypes.length === 0) {
        newErrors.dataTypes = "At least one data type must be selected";
      }
    }
    // Step 3 is optional metadata, no required fields

    return newErrors;
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};

    // Basic Information
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Project description is required";
    }
    if (!formData.owner.trim()) {
      newErrors.owner = "Project owner is required";
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    // System Details
    if (!formData.systemType) {
      newErrors.systemType = "System type is required";
    }
    if (!formData.operationalStatus) {
      newErrors.operationalStatus = "Operational status is required";
    }
    if (formData.dataTypes.length === 0) {
      newErrors.dataTypes = "At least one data type must be selected";
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      log.info('🚀 Creating new RMF project:', formData);

      // Prepare enhanced project data
      const projectData = {
        ...formData,
        metadata: {
          operationalStatus: formData.operationalStatus,
          environment: formData.environment,
          dataTypes: formData.dataTypes,
          businessCriticality: formData.businessCriticality,
          userBase: formData.userBase,
          geographicLocation: formData.geographicLocation,
          regulatoryRequirements: formData.regulatoryRequirements,
          interconnections: formData.interconnections,
          hostingProvider: formData.hostingProvider,
          estimatedUsers: formData.estimatedUsers,
          dataRetentionPeriod: formData.dataRetentionPeriod,
          backupStrategy: formData.backupStrategy,
          disasterRecovery: formData.disasterRecovery
        }
      };

      // Call the actual API
      const result = await rmfProjectsApi.createProject(projectData);

      if (result.success) {
        log.info('✅ Project created successfully:', result.data);

        // ✅ CYPHER Standard: Use toast notifications
        toast.success(`Project "${formData.name}" created successfully!`);

        // Navigate back to projects list
        navigate('/rmf/projects');
      } else {
        throw new Error(result.message || 'Failed to create project');
      }

    } catch (error) {
      console.error('❌ Error creating project:', error);
      const errorMessage = error.message || 'Failed to create project. Please try again.';
      setErrors({ submit: errorMessage });

      // ✅ CYPHER Standard: Use toast for errors
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/rmf/projects');
  };

  return (
    <React.Fragment>
      <Head title="New RMF Project"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockHeadContent>
            <BlockTitle tag="h3" page>
              Create New RMF Project
            </BlockTitle>
            <BlockDes className="text-soft">
              <p>Initialize a new Risk Management Framework implementation project</p>
            </BlockDes>
          </BlockHeadContent>
        </BlockHead>

        <Block>
          <PreviewCard>
            <form onSubmit={handleSubmit}>
              <Row className="gy-4">
                <Col size="12">
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-name">
                      Project Name <span className="text-danger">*</span>
                    </label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        id="project-name"
                        name="name"
                        className={`form-control ${errors.name ? 'error' : ''}`}
                        placeholder="Enter project name"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                      {errors.name && <span className="text-danger">{errors.name}</span>}
                    </div>
                  </div>
                </Col>

                <Col size="12">
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-description">
                      Description <span className="text-danger">*</span>
                    </label>
                    <div className="form-control-wrap">
                      <textarea
                        id="project-description"
                        name="description"
                        className={`form-control ${errors.description ? 'error' : ''}`}
                        placeholder="Describe the system or project requiring RMF implementation"
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                      {errors.description && <span className="text-danger">{errors.description}</span>}
                    </div>
                  </div>
                </Col>

                <Col sm="6">
                  <div className="form-group">
                    <label className="form-label" htmlFor="system-type">
                      Environment Type <span className="text-danger">*</span>
                    </label>
                    <div className="form-control-wrap">
                      <select
                        id="system-type"
                        name="systemType"
                        className={`form-select ${errors.systemType ? 'error' : ''}`}
                        value={formData.systemType}
                        onChange={handleInputChange}
                      >
                        <option value="">Select environment type</option>
                        <option value="on-premises">On-Premises</option>
                        <option value="cloud">Cloud</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                      {errors.systemType && <span className="text-danger">{errors.systemType}</span>}
                    </div>
                  </div>
                </Col>

                <Col sm="6">
                  <div className="form-group">
                    <label className="form-label" htmlFor="project-owner">
                      Project Owner <span className="text-danger">*</span>
                    </label>
                    <div className="form-control-wrap">
                      <input
                        type="text"
                        id="project-owner"
                        name="owner"
                        className={`form-control ${errors.owner ? 'error' : ''}`}
                        placeholder="Enter project owner name"
                        value={formData.owner}
                        onChange={handleInputChange}
                      />
                      {errors.owner && <span className="text-danger">{errors.owner}</span>}
                    </div>
                  </div>
                </Col>

                <Col sm="6">
                  <div className="form-group">
                    <label className="form-label" htmlFor="due-date">
                      Target Completion Date <span className="text-danger">*</span>
                    </label>
                    <div className="form-control-wrap">
                      <input
                        type="date"
                        id="due-date"
                        name="dueDate"
                        className={`form-control ${errors.dueDate ? 'error' : ''}`}
                        value={formData.dueDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.dueDate && <span className="text-danger">{errors.dueDate}</span>}
                    </div>
                  </div>
                </Col>

                <Col sm="6">
                  <div className="form-group">
                    <label className="form-label" htmlFor="priority">
                      Priority Level
                    </label>
                    <div className="form-control-wrap">
                      <select
                        id="priority"
                        name="priority"
                        className="form-select"
                        value={formData.priority}
                        onChange={handleInputChange}
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical Priority</option>
                      </select>
                    </div>
                  </div>
                </Col>

                {errors.submit && (
                  <Col size="12">
                    <div className="alert alert-danger">
                      {errors.submit}
                    </div>
                  </Col>
                )}

                <Col size="12">
                  <div className="form-group">
                    <div className="form-control-wrap d-flex justify-content-between">
                      <Button 
                        color="light" 
                        size="lg" 
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        <Icon name="arrow-left" className="me-2"></Icon>
                        Cancel
                      </Button>
                      <Button 
                        color="primary" 
                        size="lg" 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Icon name="plus" className="me-2"></Icon>
                            Create Project
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </form>
          </PreviewCard>
        </Block>

        {/* ✅ CYPHER Standard: Error Display */}
        {errors.submit && (
          <Block>
            <Alert className="alert-icon" color="danger" fade={false}>
              <Icon name="alert-circle" />
              <strong>Error:</strong> {errors.submit}
            </Alert>
          </Block>
        )}

        {/* Info Panel */}
        <Block>
          <PreviewCard>
            <div className="card-head">
              <h6 className="title">
                <Icon name="info" className="me-2"></Icon>
                RMF Process Overview
              </h6>
            </div>
            <div className="card-text">
              <p>Once created, your project will proceed through the 6-step RMF process:</p>
              <Row className="gy-3">
                <Col sm="6" md="4">
                  <div className="d-flex align-items-center">
                    <span className="badge badge-dim bg-primary me-2">1</span>
                    <span>Categorize</span>
                  </div>
                </Col>
                <Col sm="6" md="4">
                  <div className="d-flex align-items-center">
                    <span className="badge badge-dim bg-info me-2">2</span>
                    <span>Select</span>
                  </div>
                </Col>
                <Col sm="6" md="4">
                  <div className="d-flex align-items-center">
                    <span className="badge badge-dim bg-warning me-2">3</span>
                    <span>Implement</span>
                  </div>
                </Col>
                <Col sm="6" md="4">
                  <div className="d-flex align-items-center">
                    <span className="badge badge-dim bg-purple me-2">4</span>
                    <span>Assess</span>
                  </div>
                </Col>
                <Col sm="6" md="4">
                  <div className="d-flex align-items-center">
                    <span className="badge badge-dim bg-success me-2">5</span>
                    <span>Authorize</span>
                  </div>
                </Col>
                <Col sm="6" md="4">
                  <div className="d-flex align-items-center">
                    <span className="badge badge-dim bg-dark me-2">6</span>
                    <span>Monitor</span>
                  </div>
                </Col>
              </Row>
            </div>
          </PreviewCard>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default RMFNewProject;