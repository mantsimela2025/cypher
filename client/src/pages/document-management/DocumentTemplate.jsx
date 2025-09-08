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
  PreviewCard
} from "@/components/Component";
import { Badge, Modal, ModalHeader, ModalBody, Form, FormGroup, Label, Input } from "reactstrap";

const DocumentTemplate = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'Business'
  });

  // Mock template data - replace with API call
  const mockTemplates = [
    {
      id: '1',
      name: 'Project Proposal Template',
      description: 'Standard template for project proposals with sections for objectives, timeline, and budget',
      category: 'Business',
      thumbnail_url: null,
      is_public: true,
      created_at: new Date('2024-01-01')
    },
    {
      id: '2',
      name: 'Security Assessment Report',
      description: 'Template for documenting security assessments and vulnerability findings',
      category: 'Security',
      thumbnail_url: null,
      is_public: true,
      created_at: new Date('2024-01-05')
    },
    {
      id: '3',
      name: 'Meeting Minutes Template',
      description: 'Standard format for recording meeting discussions and action items',
      category: 'Administrative',
      thumbnail_url: null,
      is_public: false,
      created_at: new Date('2024-01-10')
    },
    {
      id: '4',
      name: 'Technical Documentation',
      description: 'Template for creating technical documentation with code examples and diagrams',
      category: 'Technical',
      thumbnail_url: null,
      is_public: true,
      created_at: new Date('2024-01-15')
    },
    {
      id: '5',
      name: 'Policy Document Template',
      description: 'Standard template for organizational policies and procedures',
      category: 'Administrative',
      thumbnail_url: null,
      is_public: true,
      created_at: new Date('2024-01-20')
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 500);
  }, []);

  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'business': return 'primary';
      case 'security': return 'danger';
      case 'administrative': return 'info';
      case 'technical': return 'success';
      default: return 'secondary';
    }
  };

  const handleUseTemplate = (template) => {
    console.log('Using template:', template.name);
    // TODO: Implement template usage logic
    alert(`Using template: ${template.name}`);
  };

  const handleEditTemplate = (template) => {
    console.log('Editing template:', template.name);
    // TODO: Implement template editing logic
    alert(`Editing template: ${template.name}`);
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    const template = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category,
      thumbnail_url: null,
      is_public: false,
      created_at: new Date()
    };

    setTemplates([template, ...templates]);
    setCreateModal(false);
    setNewTemplate({ name: '', description: '', category: 'Business' });
    alert(`Template "${template.name}" created successfully!`);
  };

  return (
    <React.Fragment>
      <Head title="Document Templates" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle page>Document Templates</BlockTitle>
              <BlockDes className="text-soft">
                Create new documents from predefined templates
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
                      <Button color="primary" onClick={() => setCreateModal(true)}>
                        <Icon name="plus" />
                        <span>New Template</span>
                      </Button>
                    </li>
                    <li>
                      <Button color="secondary">
                        <Icon name="copy" />
                        <span>Import Template</span>
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </BlockHeadContent>
          </BlockBetween>
        </BlockHead>

        <Block>
          <div className="mb-3">
            <span className="text-muted">
              {templates.length} template{templates.length !== 1 ? 's' : ''} available
            </span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-muted mt-2">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-5">
              <Icon name="template" className="text-muted mb-3" style={{ fontSize: '3rem' }} />
              <h5 className="text-muted">No templates available</h5>
              <p className="text-muted">
                Create your first document template to speed up document creation
              </p>
              <Button color="primary" onClick={() => setCreateModal(true)}>
                <Icon name="plus" />
                <span>Create Template</span>
              </Button>
            </div>
          ) : (
            <Row className="g-gs">
              {templates.map((template) => (
                <Col key={template.id} sm="6" lg="4" xl="3">
                  <PreviewCard className="template-card h-100">
                    <div className="card-inner p-3">
                      {/* Template Icon and Category */}
                      <div className="text-center mb-3">
                        <div className="template-icon-wrapper mb-2">
                          <Icon
                            name="template"
                            className={`text-${getCategoryColor(template.category)}`}
                            style={{ fontSize: '2.5rem' }}
                          />
                        </div>
                        <Badge color={getCategoryColor(template.category)} className="badge-dim">
                          {template.category}
                        </Badge>
                      </div>

                      {/* Template Info */}
                      <div className="text-center mb-3">
                        <h6 className="title mb-1">{template.name}</h6>
                        <p className="text-muted small mb-0" style={{ minHeight: '2.5em' }}>
                          {template.description}
                        </p>
                      </div>

                      {/* Template Actions */}
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          color="primary"
                          className="flex-fill"
                          onClick={() => handleUseTemplate(template)}
                        >
                          <Icon name="plus" className="me-1" />
                          Use Template
                        </Button>
                        <Button
                          size="sm"
                          color="light"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Icon name="edit" />
                        </Button>
                      </div>

                      {/* Template Meta */}
                      <div className="mt-3 text-center">
                        <span className="text-muted small">
                          Created {new Date(template.created_at).toLocaleDateString()}
                        </span>
                        {template.is_public && (
                          <Badge color="success" className="badge-dim ms-2">
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>
                  </PreviewCard>
                </Col>
              ))}
            </Row>
          )}
        </Block>

        {/* Create Template Modal */}
        <Modal isOpen={createModal} toggle={() => setCreateModal(false)}>
          <ModalHeader toggle={() => setCreateModal(false)}>Create New Template</ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup>
                <Label for="templateName">Template Name</Label>
                <Input
                  type="text"
                  id="templateName"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  placeholder="Enter template name"
                />
              </FormGroup>
              <FormGroup>
                <Label for="templateDescription">Description</Label>
                <Input
                  type="textarea"
                  id="templateDescription"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                  placeholder="Enter template description"
                  rows="3"
                />
              </FormGroup>
              <FormGroup>
                <Label for="templateCategory">Category</Label>
                <Input
                  type="select"
                  id="templateCategory"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                >
                  <option value="Business">Business</option>
                  <option value="Security">Security</option>
                  <option value="Administrative">Administrative</option>
                  <option value="Technical">Technical</option>
                </Input>
              </FormGroup>
              <div className="d-flex justify-content-end gap-2">
                <Button color="secondary" onClick={() => setCreateModal(false)}>
                  Cancel
                </Button>
                <Button color="primary" onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </div>
            </Form>
          </ModalBody>
        </Modal>

        {/* Custom Styles */}
        <style jsx>{`
          .template-card {
            transition: all 0.2s ease;
            border: 1px solid #e5e9f2;
          }

          .template-card:hover {
            border-color: #526484;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-2px);
          }

          .template-icon-wrapper {
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .title {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            min-height: 2.6em;
          }
        `}</style>
      </Content>
    </React.Fragment>
  );
};

export default DocumentTemplate;
