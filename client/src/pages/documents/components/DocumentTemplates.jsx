import React from 'react';
import { Icon, Button, Row, Col, PreviewCard } from '@/components/Component';
import { Badge } from 'reactstrap';

const DocumentTemplates = () => {
  // Mock template data - replace with API call
  const templates = [
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
    }
  ];

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
  };

  const handleEditTemplate = (template) => {
    console.log('Editing template:', template.name);
    // TODO: Implement template editing logic
  };

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1">Document Templates</h5>
          <p className="text-muted mb-0">Create new documents from predefined templates</p>
        </div>
        <Button color="primary" size="sm">
          <Icon name="plus" />
          <span>Create Template</span>
        </Button>
      </div>

      <div className="mb-3">
        <span className="text-muted">
          {templates.length} template{templates.length !== 1 ? 's' : ''} available
        </span>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-5">
          <Icon name="template" className="text-muted mb-3" style={{ fontSize: '3rem' }} />
          <h5 className="text-muted">No templates available</h5>
          <p className="text-muted">
            Create your first document template to speed up document creation
          </p>
          <Button color="primary">
            <Icon name="plus" />
            <span>Create Template</span>
          </Button>
        </div>
      ) : (
        <Row className="g-gs">
          {templates.map((template) => (
            <Col key={template.id} sm="6" lg="4" xl="3">
              <PreviewCard className="template-card">
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
                    <Badge
                      color={getCategoryColor(template.category)}
                      className="badge-dim"
                      style={{ fontSize: '0.7rem' }}
                    >
                      {template.category}
                    </Badge>
                    {template.is_public && (
                      <Badge
                        color="light"
                        className="badge-sm ms-1"
                        style={{ fontSize: '0.65rem' }}
                      >
                        Public
                      </Badge>
                    )}
                  </div>

                  {/* Template Name */}
                  <div className="mb-2">
                    <h6 className="title mb-1" style={{ fontSize: '0.875rem', lineHeight: '1.3' }}>
                      {template.name}
                    </h6>
                  </div>

                  {/* Template Description */}
                  <div className="mb-3">
                    <p className="text-muted small" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
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
                  </div>
                </div>
              </PreviewCard>
            </Col>
          ))}
        </Row>
      )}

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
    </div>
  );
};

export default DocumentTemplates;
