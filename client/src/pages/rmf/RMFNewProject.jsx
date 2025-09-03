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
// Test just the rmfApi import
import { rmfProjectsApi } from "@/utils/rmfApi";
// import { toast } from "react-toastify"; // Keep toast commented out

const RMFNewProject = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemType: "",
    owner: "",
    dueDate: "",
    priority: "medium"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Project description is required";
    }
    
    if (!formData.systemType) {
      newErrors.systemType = "System type is required";
    }
    
    if (!formData.owner.trim()) {
      newErrors.owner = "Project owner is required";
    }
    
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
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
      console.log('🚀 Creating new RMF project:', formData);

      // Call the actual API
      const result = await rmfProjectsApi.createProject(formData);

      if (result.success) {
        console.log('✅ Project created successfully:', result.data);
        alert(`Project "${formData.name}" created successfully!`);

        // Navigate back to projects list
        navigate('/rmf/projects');
      } else {
        throw new Error(result.message || 'Failed to create project');
      }

    } catch (error) {
      console.error('❌ Error creating project:', error);
      const errorMessage = error.message || 'Failed to create project. Please try again.';
      setErrors({ submit: errorMessage });
      alert('Error: ' + errorMessage);
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
                      System Impact Level <span className="text-danger">*</span>
                    </label>
                    <div className="form-control-wrap">
                      <select
                        id="system-type"
                        name="systemType"
                        className={`form-select ${errors.systemType ? 'error' : ''}`}
                        value={formData.systemType}
                        onChange={handleInputChange}
                      >
                        <option value="">Select impact level</option>
                        <option value="low">Low Impact</option>
                        <option value="moderate">Moderate Impact</option>
                        <option value="high">High Impact</option>
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