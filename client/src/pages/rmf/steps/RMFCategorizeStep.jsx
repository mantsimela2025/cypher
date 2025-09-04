import React, { useState, useEffect } from "react";
import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  DropdownMenu,
  DropdownToggle,
  UncontrolledDropdown,
  DropdownItem,
  Modal,
  ModalBody,
  ModalHeader,
  Form,
  FormGroup,
  Label,
} from "reactstrap";
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  Icon,
  Row,
  Col,
  Button,
  PreviewCard,
  RSelect,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableItem,
} from "@/components/Component";
import { Link, useParams } from "react-router-dom";
import RMFWorkflowStepper from "../components/RMFWorkflowStepper";
import { AIAssistantPanel } from "@/components/ai";

const RMFCategorizeStep = () => {
  const { projectId } = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [systems, setSystems] = useState([]);
  const [completedSteps, setCompletedSteps] = useState([]);

  // Modal states
  const [addSystemModal, setAddSystemModal] = useState(false);
  const [editSystemModal, setEditSystemModal] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState(null);

  // Form states
  const [systemForm, setSystemForm] = useState({
    name: "",
    description: "",
    systemType: "",
    confidentialityImpact: "",
    integrityImpact: "",
    availabilityImpact: "",
    overallImpact: "",
    boundary: "",
    owner: "",
    dataTypes: [],
    interconnections: "",
  });

  // Impact level options
  const impactLevels = [
    { value: "low", label: "Low" },
    { value: "moderate", label: "Moderate" },
    { value: "high", label: "High" },
  ];

  const systemTypes = [
    { value: "general_support", label: "General Support System" },
    { value: "major_application", label: "Major Application" },
    { value: "minor_application", label: "Minor Application" },
  ];

  const dataTypeOptions = [
    { value: "pii", label: "Personally Identifiable Information (PII)" },
    { value: "financial", label: "Financial Data" },
    { value: "health", label: "Health Information" },
    { value: "proprietary", label: "Proprietary Business Information" },
    { value: "classified", label: "Classified Information" },
    { value: "public", label: "Public Information" },
  ];

  // Mock data - replace with API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProject({
        id: projectId,
        name: "Financial System RMF",
        description: "Risk Management Framework implementation for core financial systems",
        currentStep: "CATEGORIZE",
        status: "active",
      });

      setSystems([
        {
          id: 1,
          name: "Core Banking System",
          description: "Primary banking transaction processing system",
          systemType: "major_application",
          confidentialityImpact: "high",
          integrityImpact: "high", 
          availabilityImpact: "high",
          overallImpact: "high",
          boundary: "Internal network, DMZ, external interfaces",
          owner: "John Smith",
          dataTypes: ["financial", "pii"],
          interconnections: "ATM Network, Online Banking Portal, Credit Bureau APIs",
          status: "draft",
          lastUpdated: "2024-01-15",
        },
        {
          id: 2,
          name: "Customer Portal",
          description: "Web-based customer account management portal",
          systemType: "major_application",
          confidentialityImpact: "moderate",
          integrityImpact: "moderate",
          availabilityImpact: "moderate", 
          overallImpact: "moderate",
          boundary: "DMZ, database servers",
          owner: "Sarah Johnson",
          dataTypes: ["pii", "financial"],
          interconnections: "Core Banking System, Identity Management System",
          status: "approved",
          lastUpdated: "2024-01-10",
        }
      ]);

      setCompletedSteps([]);
      setLoading(false);
    };

    fetchData();
  }, [projectId]);

  // Calculate overall impact based on CIA triad
  const calculateOverallImpact = (confidentiality, integrity, availability) => {
    const impacts = [confidentiality, integrity, availability];
    if (impacts.includes("high")) return "high";
    if (impacts.includes("moderate")) return "moderate";
    return "low";
  };

  // Get impact badge color
  const getImpactBadgeColor = (impact) => {
    const colorMap = {
      low: "success",
      moderate: "warning", 
      high: "danger",
    };
    return colorMap[impact] || "secondary";
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    const colorMap = {
      draft: "warning",
      review: "info",
      approved: "success",
      rejected: "danger",
    };
    return colorMap[status] || "secondary";
  };

  // Handle form changes
  const handleFormChange = (field, value) => {
    setSystemForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Auto-calculate overall impact when CIA values change
      if (["confidentialityImpact", "integrityImpact", "availabilityImpact"].includes(field)) {
        newForm.overallImpact = calculateOverallImpact(
          field === "confidentialityImpact" ? value : prev.confidentialityImpact,
          field === "integrityImpact" ? value : prev.integrityImpact,
          field === "availabilityImpact" ? value : prev.availabilityImpact
        );
      }
      
      return newForm;
    });
  };

  // Handle add system
  const handleAddSystem = () => {
    setSystemForm({
      name: "",
      description: "",
      systemType: "",
      confidentialityImpact: "",
      integrityImpact: "",
      availabilityImpact: "",
      overallImpact: "",
      boundary: "",
      owner: "",
      dataTypes: [],
      interconnections: "",
    });
    setAddSystemModal(true);
  };

  // Handle edit system
  const handleEditSystem = (system) => {
    setSelectedSystem(system);
    setSystemForm({
      name: system.name,
      description: system.description,
      systemType: system.systemType,
      confidentialityImpact: system.confidentialityImpact,
      integrityImpact: system.integrityImpact,
      availabilityImpact: system.availabilityImpact,
      overallImpact: system.overallImpact,
      boundary: system.boundary,
      owner: system.owner,
      dataTypes: system.dataTypes || [],
      interconnections: system.interconnections,
    });
    setEditSystemModal(true);
  };

  // Handle AI analysis result
  const handleAIResult = (aiResult) => {
    console.log('🤖 Applying AI categorization result:', aiResult);

    // Update form with AI suggestions (convert to lowercase for form compatibility)
    setSystemForm(prev => ({
      ...prev,
      confidentialityImpact: aiResult.confidentiality?.toLowerCase() || '',
      integrityImpact: aiResult.integrity?.toLowerCase() || '',
      availabilityImpact: aiResult.availability?.toLowerCase() || '',
      overallImpact: aiResult.overall?.toLowerCase() || ''
    }));

    // Show success message
    // You can add a toast notification here if you have one
    console.log('✅ AI suggestions applied to form');
  };

  // Handle save system
  const handleSaveSystem = () => {
    if (selectedSystem) {
      // Update existing system
      setSystems(prev => prev.map(sys =>
        sys.id === selectedSystem.id
          ? { ...sys, ...systemForm, lastUpdated: new Date().toISOString().split('T')[0] }
          : sys
      ));
      setEditSystemModal(false);
    } else {
      // Add new system
      const newSystem = {
        ...systemForm,
        id: Date.now(),
        status: "draft",
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      setSystems(prev => [...prev, newSystem]);
      setAddSystemModal(false);
    }
    setSelectedSystem(null);
  };

  // Handle complete categorization step
  const handleCompleteStep = async () => {
    try {
      setLoading(true);

      // TODO: Save all systems to database via API
      console.log('💾 Saving systems to database:', systems);

      // TODO: Mark CATEGORIZE step as complete via API
      console.log('✅ Marking CATEGORIZE step as complete for project:', projectId);

      // Update completed steps
      setCompletedSteps(prev => [...prev, 'CATEGORIZE']);

      // Show success message
      console.log('🎉 CATEGORIZE step completed successfully!');

      // Navigate to SELECT step
      window.location.href = `/rmf/projects/${projectId}/step/select`;

    } catch (error) {
      console.error('❌ Failed to complete CATEGORIZE step:', error);
      alert('Failed to complete step. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <React.Fragment>
        <Head title="RMF Categorize Step"></Head>
        <Content>
          <Block>
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-2">Loading categorization data...</p>
            </div>
          </Block>
        </Content>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <Head title="RMF Categorize Step"></Head>
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <div className="d-flex align-items-center">
                <Link to="/rmf/projects" className="btn btn-icon btn-outline-light me-2">
                  <Icon name="arrow-left"></Icon>
                </Link>
                <div>
                  <BlockTitle tag="h3" page>
                    {project?.name} - Categorize Step
                  </BlockTitle>
                  <BlockDes className="text-soft">
                    <p>Step 1: Categorize information systems and data based on impact analysis</p>
                  </BlockDes>
                </div>
              </div>
            </BlockHeadContent>
            <BlockHeadContent>
              <Button color="primary" onClick={handleAddSystem}>
                <Icon name="plus"></Icon>
                <span>Add System</span>
              </Button>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Workflow Stepper */}
        <RMFWorkflowStepper 
          currentStep="CATEGORIZE"
          projectId={projectId}
          completedSteps={completedSteps}
          showNavigation={false}
        />

        {/* Categorization Guidelines */}
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <BlockHead>
                <BlockHeadContent>
                  <BlockTitle tag="h5">
                    <Icon name="info" className="text-primary me-2"></Icon>
                    Categorization Guidelines
                  </BlockTitle>
                </BlockHeadContent>
              </BlockHead>
              <Row className="g-4">
                <Col md="4">
                  <div className="p-3 border rounded">
                    <h6 className="text-success">LOW Impact</h6>
                    <p className="text-soft small mb-0">
                      Loss could be expected to have a <strong>limited adverse effect</strong> on organizational operations, assets, or individuals.
                    </p>
                  </div>
                </Col>
                <Col md="4">
                  <div className="p-3 border rounded">
                    <h6 className="text-warning">MODERATE Impact</h6>
                    <p className="text-soft small mb-0">
                      Loss could be expected to have a <strong>serious adverse effect</strong> on organizational operations, assets, or individuals.
                    </p>
                  </div>
                </Col>
                <Col md="4">
                  <div className="p-3 border rounded">
                    <h6 className="text-danger">HIGH Impact</h6>
                    <p className="text-soft small mb-0">
                      Loss could be expected to have a <strong>severe or catastrophic adverse effect</strong> on organizational operations, assets, or individuals.
                    </p>
                  </div>
                </Col>
              </Row>
            </div>
          </PreviewCard>
        </Block>

        {/* Systems List */}
        <Block>
          <BlockHead>
            <BlockHeadContent>
              <BlockTitle tag="h5">Information Systems</BlockTitle>
              <BlockDes>
                <p>Systems identified for RMF categorization and impact assessment</p>
              </BlockDes>
            </BlockHeadContent>
          </BlockHead>

          <DataTable className="card-stretch">
            <DataTableBody>
              <DataTableHead>
                <DataTableRow>
                  <span className="sub-text">System Name</span>
                </DataTableRow>
                <DataTableRow size="lg">
                  <span className="sub-text">System Type</span>
                </DataTableRow>
                <DataTableRow size="sm">
                  <span className="sub-text">Confidentiality</span>
                </DataTableRow>
                <DataTableRow size="sm">
                  <span className="sub-text">Integrity</span>
                </DataTableRow>
                <DataTableRow size="sm">
                  <span className="sub-text">Availability</span>
                </DataTableRow>
                <DataTableRow size="sm">
                  <span className="sub-text">Overall Impact</span>
                </DataTableRow>
                <DataTableRow size="md">
                  <span className="sub-text">Status</span>
                </DataTableRow>
                <DataTableRow className="nk-tb-col-tools text-end">
                  <span className="sub-text">Actions</span>
                </DataTableRow>
              </DataTableHead>
              {systems.length > 0 ? (
                systems.map((system) => (
                  <DataTableItem key={system.id}>
                    <DataTableRow>
                      <div>
                        <span className="tb-lead">{system.name}</span>
                        <div className="text-soft tb-sub">{system.description}</div>
                      </div>
                    </DataTableRow>
                    <DataTableRow size="lg">
                      <span className="text-capitalize">
                        {system.systemType?.replace('_', ' ')}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="sm">
                      <span className={`badge badge-dim bg-${getImpactBadgeColor(system.confidentialityImpact)}`}>
                        {system.confidentialityImpact?.toUpperCase()}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="sm">
                      <span className={`badge badge-dim bg-${getImpactBadgeColor(system.integrityImpact)}`}>
                        {system.integrityImpact?.toUpperCase()}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="sm">
                      <span className={`badge badge-dim bg-${getImpactBadgeColor(system.availabilityImpact)}`}>
                        {system.availabilityImpact?.toUpperCase()}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="sm">
                      <span className={`badge badge-dim bg-${getImpactBadgeColor(system.overallImpact)}`}>
                        {system.overallImpact?.toUpperCase()}
                      </span>
                    </DataTableRow>
                    <DataTableRow size="md">
                      <span className={`tb-status text-${getStatusBadgeColor(system.status)}`}>
                        {system.status?.charAt(0).toUpperCase() + system.status?.slice(1)}
                      </span>
                    </DataTableRow>
                    <DataTableRow className="nk-tb-col-tools">
                      <ul className="nk-tb-actions gx-1">
                        <li>
                          <UncontrolledDropdown>
                            <DropdownToggle tag="a" className="dropdown-toggle btn btn-icon btn-trigger">
                              <Icon name="more-h"></Icon>
                            </DropdownToggle>
                            <DropdownMenu end>
                              <ul className="link-list-opt no-bdr">
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#edit"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleEditSystem(system);
                                    }}
                                  >
                                    <Icon name="edit"></Icon>
                                    <span>Edit</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#view"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="eye"></Icon>
                                    <span>View Details</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#duplicate"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="copy"></Icon>
                                    <span>Duplicate</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#delete"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                    }}
                                  >
                                    <Icon name="trash"></Icon>
                                    <span>Delete</span>
                                  </DropdownItem>
                                </li>
                              </ul>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </li>
                      </ul>
                    </DataTableRow>
                  </DataTableItem>
                ))
              ) : (
                <DataTableItem>
                  <DataTableRow colSpan="8">
                    <div className="text-center py-4">
                      <Icon name="property" className="text-primary mb-2" style={{ fontSize: '2rem' }}></Icon>
                      <p className="text-soft">No systems have been categorized yet.</p>
                      <Button color="primary" onClick={handleAddSystem}>
                        <Icon name="plus"></Icon>
                        <span>Add First System</span>
                      </Button>
                    </div>
                  </DataTableRow>
                </DataTableItem>
              )}
            </DataTableBody>
          </DataTable>
        </Block>

        {/* Step Completion */}
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6>Step Completion</h6>
                  <p className="text-soft mb-0">
                    Complete the categorization process by reviewing and approving all systems.
                  </p>
                </div>
                <div>
                  <Button
                    color="success"
                    size="lg"
                    disabled={systems.length === 0 || loading}
                    onClick={handleCompleteStep}
                  >
                    <Icon name="check-thick" className="me-1"></Icon>
                    {loading ? 'Completing...' : 'Complete Categorization'}
                  </Button>
                </div>
              </div>
            </div>
          </PreviewCard>
        </Block>
      </Content>

      {/* Add System Modal */}
      <Modal isOpen={addSystemModal} toggle={() => setAddSystemModal(false)} size="xl">
        <ModalHeader toggle={() => setAddSystemModal(false)}>Add Information System</ModalHeader>
        <ModalBody>
          <Row>
            {/* Left Column: System Form */}
            <Col lg="8">
              <Form>
                <Row className="g-3">
              <Col md="6">
                <FormGroup>
                  <Label className="form-label" htmlFor="system-name">
                    System Name *
                  </Label>
                  <input
                    className="form-control"
                    type="text"
                    id="system-name"
                    placeholder="Enter system name"
                    value={systemForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label className="form-label">System Type *</Label>
                  <RSelect
                    options={systemTypes}
                    value={systemTypes.find(opt => opt.value === systemForm.systemType)}
                    onChange={(option) => handleFormChange('systemType', option?.value || '')}
                    placeholder="Select system type"
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label className="form-label" htmlFor="system-description">
                    Description *
                  </Label>
                  <textarea
                    className="form-control"
                    id="system-description"
                    placeholder="Describe the system purpose and functionality"
                    rows="3"
                    value={systemForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </FormGroup>
              </Col>
              
              {/* Impact Assessment */}
              <Col md="12">
                <h6 className="title border-bottom pb-2 mb-3">Impact Assessment</h6>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label className="form-label">Confidentiality Impact *</Label>
                  <RSelect
                    options={impactLevels}
                    value={impactLevels.find(opt => opt.value === systemForm.confidentialityImpact)}
                    onChange={(option) => handleFormChange('confidentialityImpact', option?.value || '')}
                    placeholder="Select level"
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label className="form-label">Integrity Impact *</Label>
                  <RSelect
                    options={impactLevels}
                    value={impactLevels.find(opt => opt.value === systemForm.integrityImpact)}
                    onChange={(option) => handleFormChange('integrityImpact', option?.value || '')}
                    placeholder="Select level"
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label className="form-label">Availability Impact *</Label>
                  <RSelect
                    options={impactLevels}
                    value={impactLevels.find(opt => opt.value === systemForm.availabilityImpact)}
                    onChange={(option) => handleFormChange('availabilityImpact', option?.value || '')}
                    placeholder="Select level"
                  />
                </FormGroup>
              </Col>
              
              {systemForm.overallImpact && (
                <Col md="12">
                  <div className="alert alert-pro alert-primary">
                    <div className="alert-text">
                      <h6>Overall System Impact: 
                        <span className={`badge badge-lg bg-${getImpactBadgeColor(systemForm.overallImpact)} ms-2`}>
                          {systemForm.overallImpact?.toUpperCase()}
                        </span>
                      </h6>
                      <p className="mb-0">
                        Automatically calculated based on the highest impact level among Confidentiality, Integrity, and Availability.
                      </p>
                    </div>
                  </div>
                </Col>
              )}
              
              <Col md="6">
                <FormGroup>
                  <Label className="form-label" htmlFor="system-owner">
                    System Owner *
                  </Label>
                  <input
                    className="form-control"
                    type="text"
                    id="system-owner"
                    placeholder="Enter system owner name"
                    value={systemForm.owner}
                    onChange={(e) => handleFormChange('owner', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label className="form-label">Data Types</Label>
                  <RSelect
                    options={dataTypeOptions}
                    isMulti
                    value={dataTypeOptions.filter(opt => systemForm.dataTypes.includes(opt.value))}
                    onChange={(options) => handleFormChange('dataTypes', options ? options.map(opt => opt.value) : [])}
                    placeholder="Select data types"
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label className="form-label" htmlFor="system-boundary">
                    System Boundary
                  </Label>
                  <textarea
                    className="form-control"
                    id="system-boundary"
                    placeholder="Define the system boundary and components"
                    rows="2"
                    value={systemForm.boundary}
                    onChange={(e) => handleFormChange('boundary', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label className="form-label" htmlFor="system-interconnections">
                    System Interconnections
                  </Label>
                  <textarea
                    className="form-control"
                    id="system-interconnections"
                    placeholder="Describe system interconnections and interfaces"
                    rows="2"
                    value={systemForm.interconnections}
                    onChange={(e) => handleFormChange('interconnections', e.target.value)}
                  />
                </FormGroup>
              </Col>
                </Row>
              </Form>
            </Col>

            {/* Right Column: AI Assistant Panel */}
            <Col lg="4">
              <AIAssistantPanel
                systemData={{
                  name: systemForm.name,
                  description: systemForm.description,
                  systemType: systemForm.systemType,
                  dataTypes: systemForm.dataTypes,
                  environment: systemForm.systemType,
                  userBase: 'System users and administrators'
                }}
                onAIResult={handleAIResult}
                disabled={!systemForm.name || !systemForm.description}
              />
            </Col>
          </Row>

          {/* Form Actions */}
          <div className="form-group mt-4">
            <Button
              color="primary"
              onClick={handleSaveSystem}
              disabled={!systemForm.name || !systemForm.description || !systemForm.systemType || !systemForm.confidentialityImpact || !systemForm.integrityImpact || !systemForm.availabilityImpact || !systemForm.owner}
            >
              <Icon name="check"></Icon>
              <span>Add System</span>
            </Button>
            <Button color="light" className="ms-2" onClick={() => setAddSystemModal(false)}>
              Cancel
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Edit System Modal */}
      <Modal isOpen={editSystemModal} toggle={() => setEditSystemModal(false)} size="xl">
        <ModalHeader toggle={() => setEditSystemModal(false)}>Edit Information System</ModalHeader>
        <ModalBody>
          <Row>
            {/* Left Column: System Form */}
            <Col lg="8">
              <Form>
                <Row className="g-3">
              <Col md="6">
                <FormGroup>
                  <Label className="form-label" htmlFor="edit-system-name">
                    System Name *
                  </Label>
                  <input
                    className="form-control"
                    type="text"
                    id="edit-system-name"
                    placeholder="Enter system name"
                    value={systemForm.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label className="form-label">System Type *</Label>
                  <RSelect
                    options={systemTypes}
                    value={systemTypes.find(opt => opt.value === systemForm.systemType)}
                    onChange={(option) => handleFormChange('systemType', option?.value || '')}
                    placeholder="Select system type"
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label className="form-label" htmlFor="edit-system-description">
                    Description *
                  </Label>
                  <textarea
                    className="form-control"
                    id="edit-system-description"
                    placeholder="Describe the system purpose and functionality"
                    rows="3"
                    value={systemForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </FormGroup>
              </Col>
              
              {/* Impact Assessment */}
              <Col md="12">
                <h6 className="title border-bottom pb-2 mb-3">Impact Assessment</h6>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label className="form-label">Confidentiality Impact *</Label>
                  <RSelect
                    options={impactLevels}
                    value={impactLevels.find(opt => opt.value === systemForm.confidentialityImpact)}
                    onChange={(option) => handleFormChange('confidentialityImpact', option?.value || '')}
                    placeholder="Select level"
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label className="form-label">Integrity Impact *</Label>
                  <RSelect
                    options={impactLevels}
                    value={impactLevels.find(opt => opt.value === systemForm.integrityImpact)}
                    onChange={(option) => handleFormChange('integrityImpact', option?.value || '')}
                    placeholder="Select level"
                  />
                </FormGroup>
              </Col>
              <Col md="4">
                <FormGroup>
                  <Label className="form-label">Availability Impact *</Label>
                  <RSelect
                    options={impactLevels}
                    value={impactLevels.find(opt => opt.value === systemForm.availabilityImpact)}
                    onChange={(option) => handleFormChange('availabilityImpact', option?.value || '')}
                    placeholder="Select level"
                  />
                </FormGroup>
              </Col>
              
              {systemForm.overallImpact && (
                <Col md="12">
                  <div className="alert alert-pro alert-primary">
                    <div className="alert-text">
                      <h6>Overall System Impact: 
                        <span className={`badge badge-lg bg-${getImpactBadgeColor(systemForm.overallImpact)} ms-2`}>
                          {systemForm.overallImpact?.toUpperCase()}
                        </span>
                      </h6>
                      <p className="mb-0">
                        Automatically calculated based on the highest impact level among Confidentiality, Integrity, and Availability.
                      </p>
                    </div>
                  </div>
                </Col>
              )}
              
              <Col md="6">
                <FormGroup>
                  <Label className="form-label" htmlFor="edit-system-owner">
                    System Owner *
                  </Label>
                  <input
                    className="form-control"
                    type="text"
                    id="edit-system-owner"
                    placeholder="Enter system owner name"
                    value={systemForm.owner}
                    onChange={(e) => handleFormChange('owner', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="6">
                <FormGroup>
                  <Label className="form-label">Data Types</Label>
                  <RSelect
                    options={dataTypeOptions}
                    isMulti
                    value={dataTypeOptions.filter(opt => systemForm.dataTypes.includes(opt.value))}
                    onChange={(options) => handleFormChange('dataTypes', options ? options.map(opt => opt.value) : [])}
                    placeholder="Select data types"
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label className="form-label" htmlFor="edit-system-boundary">
                    System Boundary
                  </Label>
                  <textarea
                    className="form-control"
                    id="edit-system-boundary"
                    placeholder="Define the system boundary and components"
                    rows="2"
                    value={systemForm.boundary}
                    onChange={(e) => handleFormChange('boundary', e.target.value)}
                  />
                </FormGroup>
              </Col>
              <Col md="12">
                <FormGroup>
                  <Label className="form-label" htmlFor="edit-system-interconnections">
                    System Interconnections
                  </Label>
                  <textarea
                    className="form-control"
                    id="edit-system-interconnections"
                    placeholder="Describe system interconnections and interfaces"
                    rows="2"
                    value={systemForm.interconnections}
                    onChange={(e) => handleFormChange('interconnections', e.target.value)}
                  />
                </FormGroup>
              </Col>
                </Row>
              </Form>
            </Col>

            {/* Right Column: AI Assistant Panel */}
            <Col lg="4">
              <AIAssistantPanel
                systemData={{
                  name: systemForm.name,
                  description: systemForm.description,
                  systemType: systemForm.systemType,
                  dataTypes: systemForm.dataTypes,
                  environment: systemForm.systemType,
                  userBase: 'System users and administrators'
                }}
                onAIResult={handleAIResult}
                disabled={!systemForm.name || !systemForm.description}
              />
            </Col>
          </Row>

          {/* Form Actions */}
          <div className="form-group mt-4">
            <Button
              color="primary"
              onClick={handleSaveSystem}
              disabled={!systemForm.name || !systemForm.description || !systemForm.systemType || !systemForm.confidentialityImpact || !systemForm.integrityImpact || !systemForm.availabilityImpact || !systemForm.owner}
            >
              <Icon name="check"></Icon>
              <span>Save Changes</span>
            </Button>
            <Button color="light" className="ms-2" onClick={() => setEditSystemModal(false)}>
              Cancel
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};

export default RMFCategorizeStep;