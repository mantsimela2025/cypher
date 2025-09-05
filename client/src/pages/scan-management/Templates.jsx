import React, { useState, useEffect } from "react";
import Head from "@/layout/head/Head";
import Content from "@/layout/content/Content";
import {
  Block,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
  BlockDes,
  BlockBetween,
  Row,
  Col,
  Button,
  Icon,
} from "@/components/Component";
import {
  Card,
  CardBody,
  Badge,
  Modal,
  ModalBody,
  ModalHeader,
  Form,
  FormGroup,
  Label,
  Input,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import "./Templates.css";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Form state for new/edit template
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'network',
    scanType: 'vulnerability',
    configuration: {
      ports: '',
      protocols: [],
      intensity: 'medium',
      timeout: 300,
      maxHosts: 100,
      excludeHosts: '',
      customOptions: ''
    },
    estimatedTime: '10-15 minutes',
    isDefault: false,
    enabled: true
  });

  useEffect(() => {
    loadTemplates();
  }, [searchTerm, filterCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      // Try to load from API first
      const searchParam = searchTerm || '';
      const categoryParam = filterCategory === 'all' ? '' : filterCategory;
      const endpoint = `/scanner/templates?search=${searchParam}&category=${categoryParam}`;

      log.api('Loading scan templates with filters:', { searchTerm, filterCategory });
      const data = await apiClient.get(endpoint);
      setTemplates(data.data.templates);
      log.info('Scan templates loaded successfully:', data.data.templates.length, 'templates');
      setLoading(false);
      return;

    } catch (error) {
      // Fallback to predefined templates if API fails
      log.error('Error loading templates:', error.message);
      log.warn('API failed, using fallback templates');
      const predefinedTemplates = [
        {
          id: 1,
          name: 'Basic Network Scan',
          description: 'A basic network scan to identify live hosts and open ports',
          category: 'network',
          scanType: 'internal',
          icon: 'network',
          iconColor: 'success',
          estimatedTime: '10-15 minutes',
          configuration: {
            ports: '1-1000',
            protocols: ['TCP', 'UDP'],
            intensity: 'medium'
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2024-01-15'),
          usageCount: 245
        },
        {
          id: 2,
          name: 'Advanced Scan',
          description: 'Comprehensive scan using advanced detection techniques',
          category: 'security',
          scanType: 'vulnerability',
          icon: 'shield-check',
          iconColor: 'primary',
          estimatedTime: '30-45 minutes',
          configuration: {
            ports: '1-65535',
            protocols: ['TCP', 'UDP', 'SCTP'],
            intensity: 'high'
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2024-01-10'),
          usageCount: 189
        },
        {
          id: 3,
          name: 'Advanced Dynamic Scan',
          description: 'Dynamic scanning with real-time adjustments based on target responses',
          category: 'dynamic',
          scanType: 'vulnerability',
          icon: 'activity',
          iconColor: 'info',
          estimatedTime: '45-60 minutes',
          configuration: {
            adaptive: true,
            realTimeAdjustment: true,
            intensity: 'adaptive'
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2024-01-08'),
          usageCount: 156
        },
        {
          id: 4,
          name: 'Malware Scan',
          description: 'Scan for malicious software and suspicious files',
          category: 'malware',
          scanType: 'compliance',
          icon: 'alert-triangle',
          iconColor: 'danger',
          estimatedTime: '20-30 minutes',
          configuration: {
            fileScanning: true,
            behaviorAnalysis: true,
            signatureUpdates: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2024-01-05'),
          usageCount: 134
        },
        {
          id: 5,
          name: 'Mobile Device Scan',
          description: 'Optimized scanning for mobile devices',
          category: 'mobile',
          scanType: 'compliance',
          icon: 'smartphone',
          iconColor: 'info',
          estimatedTime: '15-25 minutes',
          configuration: {
            mobileOptimized: true,
            lowPowerMode: true,
            appScanning: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2024-01-03'),
          usageCount: 98
        },
        {
          id: 6,
          name: 'Web Application Tests',
          description: 'Test web applications using advanced scanning techniques',
          category: 'web',
          scanType: 'web',
          icon: 'globe',
          iconColor: 'primary',
          estimatedTime: '45-60 minutes',
          configuration: {
            sqlInjection: true,
            xssDetection: true,
            authTesting: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2024-01-01'),
          usageCount: 167
        },
        {
          id: 7,
          name: 'Credentialed Patch Audit',
          description: 'Audit systems using patch management credentials',
          category: 'compliance',
          scanType: 'compliance',
          icon: 'key',
          iconColor: 'warning',
          estimatedTime: '15-25 minutes',
          configuration: {
            credentialedScan: true,
            patchAudit: true,
            complianceCheck: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2023-12-28'),
          usageCount: 203
        },
        {
          id: 8,
          name: 'Ransomware Vulnerability',
          description: 'Identify vulnerabilities commonly exploited by ransomware',
          category: 'security',
          scanType: 'vulnerability',
          icon: 'lock',
          iconColor: 'danger',
          estimatedTime: '30-45 minutes',
          configuration: {
            ransomwarePatterns: true,
            vulnerabilityCorrelation: true,
            threatIntelligence: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2023-12-25'),
          usageCount: 145
        },
        {
          id: 9,
          name: 'Cloud Asset Discovery',
          description: 'Discover and inventory cloud environments (AWS, Azure, GCP)',
          category: 'cloud',
          scanType: 'internal',
          icon: 'cloud',
          iconColor: 'info',
          estimatedTime: '20-30 minutes',
          configuration: {
            cloudProviders: ['AWS', 'Azure', 'GCP'],
            assetDiscovery: true,
            configurationAudit: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2023-12-20'),
          usageCount: 87
        },
        {
          id: 10,
          name: 'STIG Compliance Check',
          description: 'Assess systems against STIG security technical implementation guides',
          category: 'compliance',
          scanType: 'compliance',
          icon: 'shield',
          iconColor: 'success',
          estimatedTime: '25-35 minutes',
          configuration: {
            stigCompliance: true,
            benchmarkTesting: true,
            reportGeneration: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2023-12-18'),
          usageCount: 176
        },
        {
          id: 11,
          name: 'Container Security Scan',
          description: 'Scan containerized images and deployed containers for vulnerabilities',
          category: 'container',
          scanType: 'vulnerability',
          icon: 'box',
          iconColor: 'primary',
          estimatedTime: '15-25 minutes',
          configuration: {
            containerImages: true,
            runtimeScanning: true,
            configurationAudit: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2023-12-15'),
          usageCount: 112
        },
        {
          id: 12,
          name: 'IoT Device Assessment',
          description: 'Security assessment of Internet of Things devices in your network',
          category: 'iot',
          scanType: 'vulnerability',
          icon: 'cpu',
          iconColor: 'warning',
          estimatedTime: '30-45 minutes',
          configuration: {
            deviceDiscovery: true,
            firmwareAnalysis: true,
            protocolTesting: true
          },
          isDefault: true,
          enabled: true,
          createdAt: new Date('2023-12-12'),
          usageCount: 89
        }
      ];

      setTemplates(predefinedTemplates);
    } catch (error) {
      log.error('Error loading templates:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleModal = () => setModal(!modal);
  const toggleEditModal = () => setEditModal(!editModal);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        scanType: formData.scanType,
        configuration: {
          ...formData.configuration,
          category: formData.category,
          estimatedTime: formData.estimatedTime
        },
        category: formData.category,
        estimatedTime: formData.estimatedTime,
        enabled: formData.enabled
      };

      log.api('Creating new scan template:', templateData.name);
      const result = await apiClient.post('/scanner/templates', templateData);

      // Reload templates to get updated list
      await loadTemplates();
      log.info('Scan template created successfully');

        setFormData({
          name: '',
          description: '',
          category: 'network',
          scanType: 'vulnerability',
          configuration: {
            ports: '',
            protocols: [],
            intensity: 'medium',
            timeout: 300,
            maxHosts: 100,
            excludeHosts: '',
            customOptions: ''
          },
          estimatedTime: '10-15 minutes',
          isDefault: false,
          enabled: true
        });
        toggleModal();
    } catch (error) {
      log.error('Error creating template:', error.message);
      alert('Failed to create template: ' + error.message);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        scanType: formData.scanType,
        configuration: {
          ...formData.configuration,
          category: formData.category,
          estimatedTime: formData.estimatedTime
        },
        category: formData.category,
        estimatedTime: formData.estimatedTime,
        enabled: formData.enabled
      };

      log.api('Updating scan template:', formData.id, formData.name);
      const result = await apiClient.put(`/scanner/templates/${formData.id}`, templateData);

      // Reload templates to get updated list
      await loadTemplates();
      log.info('Scan template updated successfully');

        setFormData({
          name: '',
          description: '',
          category: 'network',
          scanType: 'vulnerability',
          configuration: {
            ports: '',
            protocols: [],
            intensity: 'medium',
            timeout: 300,
            maxHosts: 100,
            excludeHosts: '',
            customOptions: ''
          },
          estimatedTime: '10-15 minutes',
          isDefault: false,
          enabled: true
        });
        toggleEditModal();
    } catch (error) {
      log.error('Error updating template:', error.message);
      alert('Failed to update template: ' + error.message);
    }
  };

  const handleEdit = (template) => {
    setFormData({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      scanType: template.scanType,
      configuration: template.configuration,
      estimatedTime: template.estimatedTime,
      isDefault: template.isDefault,
      enabled: template.enabled
    });
    toggleEditModal();
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        log.api('Deleting scan template:', templateId);
        await apiClient.delete(`/scanner/templates/${templateId}`);
        await loadTemplates(); // Reload templates
        log.info('Scan template deleted successfully');
      } catch (error) {
        log.error('Error deleting template:', error.message);
        alert('Failed to delete template: ' + error.message);
      }
    }
  };

  const handleDuplicate = (template) => {
    const duplicatedTemplate = {
      ...template,
      id: templates.length + 1,
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdAt: new Date(),
      usageCount: 0
    };
    setTemplates(prev => [...prev, duplicatedTemplate]);
  };

  const handleUseTemplate = (template) => {
    // Navigate to scan creation with this template
    console.log('Using template:', template.name);
    // You can implement navigation to scan creation page here
  };

  // Since we're using API filtering, we don't need client-side filtering
  const filteredTemplates = templates;

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'network', label: 'Network' },
    { value: 'security', label: 'Security' },
    { value: 'dynamic', label: 'Dynamic' },
    { value: 'malware', label: 'Malware' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'web', label: 'Web' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'cloud', label: 'Cloud' },
    { value: 'container', label: 'Container' },
    { value: 'iot', label: 'IoT' }
  ];

  return (
    <React.Fragment>
      <Head title="Scan Templates" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Scan Templates</BlockTitle>
              <BlockDes className="text-soft">
                Choose from predefined scan templates or create your own
              </BlockDes>
            </BlockHeadContent>
            <BlockHeadContent>
              <div className="toggle-wrap nk-block-tools-toggle">
                <Button
                  className="btn-icon btn-trigger toggle-expand me-n1"
                  color="transparent"
                >
                  <Icon name="menu-alt-r"></Icon>
                </Button>
                <div className="toggle-expand-content">
                  <ul className="nk-block-tools g-3">
                    <li>
                      <Button color="primary" onClick={toggleModal}>
                        <Icon name="plus" />
                        <span>New Template</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="secondary">
                        <Icon name="upload" />
                        <span>Import Template</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        {/* Search and Filter Bar */}
        <Block>
          <Row className="g-3 align-items-center">
            <Col md="6">
              <div className="form-group">
                <div className="form-control-wrap">
                  <div className="form-icon form-icon-left">
                    <Icon name="search"></Icon>
                  </div>
                  <Input
                    type="text"
                    className="form-control-outlined form-control-lg"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </Col>
            <Col md="3">
              <div className="form-group">
                <Input
                  type="select"
                  className="form-control-outlined form-control-lg"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </Input>
              </div>
            </Col>
            <Col md="3">
              <div className="text-end">
                <Badge color="light" className="badge-dim">
                  {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </Col>
          </Row>
        </Block>

        {/* Template Cards */}
        <Block>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-soft">Loading templates...</p>
            </div>
          ) : (
            <Row className="g-gs">
              {filteredTemplates.map((template) => (
                <Col key={template.id} sm="6" lg="4" xxl="3">
                  <Card className="template-card h-100">
                    <CardBody>
                      <div className="template-header">
                        <div className={`template-icon bg-${template.iconColor}-dim`}>
                          <Icon name={template.icon} className={`text-${template.iconColor}`} />
                        </div>
                        <div className="template-actions">
                          <UncontrolledDropdown>
                            <DropdownToggle
                              tag="a"
                              href="#toggle"
                              onClick={(ev) => ev.preventDefault()}
                              className="dropdown-toggle btn btn-icon btn-trigger"
                            >
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
                                      handleUseTemplate(template);
                                    }}
                                  >
                                    <Icon name="play"></Icon>
                                    <span>Use Template</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#edit"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleEdit(template);
                                    }}
                                  >
                                    <Icon name="edit"></Icon>
                                    <span>Edit</span>
                                  </DropdownItem>
                                </li>
                                <li>
                                  <DropdownItem
                                    tag="a"
                                    href="#duplicate"
                                    onClick={(ev) => {
                                      ev.preventDefault();
                                      handleDuplicate(template);
                                    }}
                                  >
                                    <Icon name="copy"></Icon>
                                    <span>Duplicate</span>
                                  </DropdownItem>
                                </li>
                                {!template.isDefault && (
                                  <li>
                                    <DropdownItem
                                      tag="a"
                                      href="#delete"
                                      onClick={(ev) => {
                                        ev.preventDefault();
                                        handleDelete(template.id);
                                      }}
                                      className="text-danger"
                                    >
                                      <Icon name="trash"></Icon>
                                      <span>Delete</span>
                                    </DropdownItem>
                                  </li>
                                )}
                              </ul>
                            </DropdownMenu>
                          </UncontrolledDropdown>
                        </div>
                      </div>

                      <div className="template-content">
                        <h6 className="template-title">{template.name}</h6>
                        <p className="template-description text-soft">
                          {template.description}
                        </p>

                        <div className="template-meta">
                          <div className="template-time">
                            <Icon name="clock" className="text-soft me-1" />
                            <span className="text-soft small">Est. time: {template.estimatedTime}</span>
                          </div>

                          <div className="template-badges mt-2">
                            <Badge color={template.iconColor} className="badge-dim me-1">
                              {template.category}
                            </Badge>
                            {template.isDefault && (
                              <Badge color="success" className="badge-dim">
                                Default
                              </Badge>
                            )}
                          </div>

                          <div className="template-stats mt-2">
                            <small className="text-soft">
                              <Icon name="users" className="me-1" />
                              Used {template.usageCount} times
                            </small>
                          </div>
                        </div>
                      </div>

                      <div className="template-footer">
                        <Button
                          color="primary"
                          size="sm"
                          className="btn-block"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Icon name="play" className="me-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          {!loading && filteredTemplates.length === 0 && (
            <div className="text-center py-5">
              <Icon name="inbox" className="text-soft" style={{ fontSize: '4rem' }} />
              <h5 className="mt-3">No templates found</h5>
              <p className="text-soft">
                {searchTerm || filterCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first template to get started'
                }
              </p>
              {(!searchTerm && filterCategory === 'all') && (
                <Button color="primary" className="mt-3" onClick={toggleModal}>
                  <Icon name="plus" className="me-1" />
                  Create Template
                </Button>
              )}
            </div>
          )}
        </Block>

        {/* Create Template Modal */}
        <Modal isOpen={modal} toggle={toggleModal} size="lg">
          <ModalHeader toggle={toggleModal}>Create New Template</ModalHeader>
          <ModalBody>
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="name">Template Name *</Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter template name"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="category">Category *</Label>
                    <Input
                      type="select"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="network">Network</option>
                      <option value="security">Security</option>
                      <option value="dynamic">Dynamic</option>
                      <option value="malware">Malware</option>
                      <option value="mobile">Mobile</option>
                      <option value="web">Web</option>
                      <option value="compliance">Compliance</option>
                      <option value="cloud">Cloud</option>
                      <option value="container">Container</option>
                      <option value="iot">IoT</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="scanType">Scan Type *</Label>
                    <Input
                      type="select"
                      id="scanType"
                      name="scanType"
                      value={formData.scanType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="vulnerability">Vulnerability Scan</option>
                      <option value="compliance">Compliance Scan</option>
                      <option value="internal">Internal Network Scan</option>
                      <option value="web">Web Application Scan</option>
                    </Input>
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="estimatedTime">Estimated Time</Label>
                    <Input
                      type="text"
                      id="estimatedTime"
                      name="estimatedTime"
                      value={formData.estimatedTime}
                      onChange={handleInputChange}
                      placeholder="e.g., 10-15 minutes"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup>
                <Label for="description">Description *</Label>
                <Input
                  type="textarea"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this template does"
                  rows="3"
                  required
                />
              </FormGroup>

              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="configuration.ports">Port Range</Label>
                    <Input
                      type="text"
                      id="configuration.ports"
                      name="configuration.ports"
                      value={formData.configuration.ports}
                      onChange={handleInputChange}
                      placeholder="e.g., 1-1000, 80,443,8080"
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="configuration.intensity">Scan Intensity</Label>
                    <Input
                      type="select"
                      id="configuration.intensity"
                      name="configuration.intensity"
                      value={formData.configuration.intensity}
                      onChange={handleInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="adaptive">Adaptive</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="configuration.timeout">Timeout (seconds)</Label>
                    <Input
                      type="number"
                      id="configuration.timeout"
                      name="configuration.timeout"
                      value={formData.configuration.timeout}
                      onChange={handleInputChange}
                      min="30"
                      max="3600"
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="configuration.maxHosts">Max Hosts</Label>
                    <Input
                      type="number"
                      id="configuration.maxHosts"
                      name="configuration.maxHosts"
                      value={formData.configuration.maxHosts}
                      onChange={handleInputChange}
                      min="1"
                      max="10000"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup>
                <Label for="configuration.excludeHosts">Exclude Hosts</Label>
                <Input
                  type="text"
                  id="configuration.excludeHosts"
                  name="configuration.excludeHosts"
                  value={formData.configuration.excludeHosts}
                  onChange={handleInputChange}
                  placeholder="IP addresses or ranges to exclude"
                />
              </FormGroup>

              <FormGroup>
                <Label for="configuration.customOptions">Custom Options</Label>
                <Input
                  type="textarea"
                  id="configuration.customOptions"
                  name="configuration.customOptions"
                  value={formData.configuration.customOptions}
                  onChange={handleInputChange}
                  placeholder="Additional scan options or parameters"
                  rows="2"
                />
              </FormGroup>

              <FormGroup check>
                <Input
                  type="checkbox"
                  id="enabled"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleInputChange}
                />
                <Label check for="enabled">
                  Enable this template
                </Label>
              </FormGroup>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button type="button" color="secondary" onClick={toggleModal}>
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Create Template
                </Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>

        {/* Edit Template Modal */}
        <Modal isOpen={editModal} toggle={toggleEditModal} size="lg">
          <ModalHeader toggle={toggleEditModal}>Edit Template</ModalHeader>
          <ModalBody>
            <Form onSubmit={handleEditSubmit}>
              <Row>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-name">Template Name *</Label>
                    <Input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter template name"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md="6">
                  <FormGroup>
                    <Label for="edit-category">Category *</Label>
                    <Input
                      type="select"
                      id="edit-category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="network">Network</option>
                      <option value="security">Security</option>
                      <option value="dynamic">Dynamic</option>
                      <option value="malware">Malware</option>
                      <option value="mobile">Mobile</option>
                      <option value="web">Web</option>
                      <option value="compliance">Compliance</option>
                      <option value="cloud">Cloud</option>
                      <option value="container">Container</option>
                      <option value="iot">IoT</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup>
                <Label for="edit-description">Description *</Label>
                <Input
                  type="textarea"
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe what this template does"
                  rows="3"
                  required
                />
              </FormGroup>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button type="button" color="secondary" onClick={toggleEditModal}>
                  Cancel
                </Button>
                <Button type="submit" color="primary">
                  Update Template
                </Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>
      </Content>
    </React.Fragment>
  );
};

export default Templates;
