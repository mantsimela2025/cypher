/**
 * Documentation System Component
 * Comprehensive documentation management for RMF implementation
 * Handles evidence collection, compliance artifacts, and audit documentation
 */

import React, { useState, useMemo } from "react";
import {
  Block,
  PreviewCard,
  Button,
  Icon,
  Row,
  Col,
} from "@/components/Component";

const DocumentationSystem = ({ 
  controls = [],
  onDocumentUpload = () => {},
  onDocumentUpdate = () => {},
  onDocumentDelete = () => {},
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedControl, setSelectedControl] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sample documentation data (would come from API in real implementation)
  const [documents, setDocuments] = useState([
    {
      id: 1,
      title: 'Access Control Policy Document',
      type: 'policy',
      controlId: 'AC-1',
      status: 'approved',
      version: '1.2',
      author: 'John Doe',
      createdDate: '2024-01-01',
      lastModified: '2024-01-10',
      size: '2.4 MB',
      format: 'PDF',
      description: 'Comprehensive access control policy document defining organizational access control requirements',
      tags: ['policy', 'access-control', 'approved'],
      evidenceType: 'policy_document',
      complianceMapping: ['NIST SP 800-53', 'ISO 27001'],
      reviewStatus: 'current',
      nextReview: '2024-07-01'
    },
    {
      id: 2,
      title: 'Account Management Configuration Guide',
      type: 'procedure',
      controlId: 'AC-2',
      status: 'draft',
      version: '0.8',
      author: 'Jane Smith',
      createdDate: '2024-01-05',
      lastModified: '2024-01-12',
      size: '1.8 MB',
      format: 'DOCX',
      description: 'Step-by-step procedures for account management system configuration and maintenance',
      tags: ['procedure', 'configuration', 'draft'],
      evidenceType: 'implementation_guide',
      complianceMapping: ['NIST SP 800-53'],
      reviewStatus: 'pending',
      nextReview: '2024-01-20'
    },
    {
      id: 3,
      title: 'Firewall Configuration Screenshots',
      type: 'evidence',
      controlId: 'SC-7',
      status: 'approved',
      version: '1.0',
      author: 'Mike Johnson',
      createdDate: '2024-01-08',
      lastModified: '2024-01-08',
      size: '5.2 MB',
      format: 'ZIP',
      description: 'Screenshots and configuration exports from network firewall implementation',
      tags: ['evidence', 'configuration', 'screenshots'],
      evidenceType: 'configuration_evidence',
      complianceMapping: ['NIST SP 800-53'],
      reviewStatus: 'current',
      nextReview: '2024-04-08'
    },
    {
      id: 4,
      title: 'Audit Log Configuration Report',
      type: 'report',
      controlId: 'AU-2',
      status: 'approved',
      version: '1.1',
      author: 'Sarah Wilson',
      createdDate: '2023-12-20',
      lastModified: '2024-01-05',
      size: '3.1 MB',
      format: 'PDF',
      description: 'Comprehensive report on audit logging system configuration and testing results',
      tags: ['report', 'audit', 'testing'],
      evidenceType: 'test_results',
      complianceMapping: ['NIST SP 800-53', 'SOX'],
      reviewStatus: 'current',
      nextReview: '2024-06-20'
    },
    {
      id: 5,
      title: 'System Security Plan Template',
      type: 'template',
      controlId: 'ALL',
      status: 'approved',
      version: '2.0',
      author: 'Security Team',
      createdDate: '2023-11-15',
      lastModified: '2024-01-01',
      size: '1.2 MB',
      format: 'DOCX',
      description: 'Standard template for System Security Plan documentation',
      tags: ['template', 'ssp', 'standard'],
      evidenceType: 'template',
      complianceMapping: ['NIST SP 800-53', 'FedRAMP'],
      reviewStatus: 'current',
      nextReview: '2024-11-15'
    }
  ]);

  const documentTypes = [
    { id: 'policy', name: 'Policies', icon: 'shield-check', color: 'primary' },
    { id: 'procedure', name: 'Procedures', icon: 'list-check', color: 'info' },
    { id: 'evidence', name: 'Evidence', icon: 'camera', color: 'success' },
    { id: 'report', name: 'Reports', icon: 'file-docs', color: 'warning' },
    { id: 'template', name: 'Templates', icon: 'copy', color: 'secondary' }
  ];

  const evidenceTypes = [
    'policy_document',
    'implementation_guide',
    'configuration_evidence',
    'test_results',
    'audit_report',
    'training_records',
    'incident_reports',
    'template'
  ];

  /**
   * Filter documents based on current filters
   */
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (filterType !== 'all' && doc.type !== filterType) return false;
      if (searchTerm && !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !doc.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedControl && doc.controlId !== selectedControl && doc.controlId !== 'ALL') return false;
      return true;
    });
  }, [documents, filterType, searchTerm, selectedControl]);

  /**
   * Get document statistics
   */
  const getDocumentStats = () => {
    const stats = {
      total: documents.length,
      approved: documents.filter(d => d.status === 'approved').length,
      draft: documents.filter(d => d.status === 'draft').length,
      pending: documents.filter(d => d.reviewStatus === 'pending').length,
      overdue: documents.filter(d => new Date(d.nextReview) < new Date()).length
    };

    const byType = {};
    documentTypes.forEach(type => {
      byType[type.id] = documents.filter(d => d.type === type.id).length;
    });

    const byControl = {};
    controls.forEach(control => {
      byControl[control.id] = documents.filter(d => d.controlId === control.id).length;
    });

    return { ...stats, byType, byControl };
  };

  /**
   * Get status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'draft': return 'warning';
      case 'pending': return 'info';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  /**
   * Handle document upload
   */
  const handleDocumentUpload = (documentData) => {
    const newDoc = {
      ...documentData,
      id: Date.now(),
      createdDate: new Date().toISOString().split('T')[0],
      lastModified: new Date().toISOString().split('T')[0],
      version: '1.0',
      status: 'draft'
    };
    setDocuments(prev => [...prev, newDoc]);
    onDocumentUpload(newDoc);
  };

  const stats = getDocumentStats();

  return (
    <div className={`documentation-system ${className}`}>
      <style jsx>{`
        .document-item {
          transition: all 0.2s ease;
        }
        .document-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .upload-zone {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .upload-zone:hover {
          background-color: #f8f9fa;
          border-color: #007bff;
        }
        .timeline {
          position: relative;
          padding-left: 20px;
        }
        .timeline-item {
          position: relative;
          margin-bottom: 15px;
        }
        .timeline-marker {
          position: absolute;
          left: -25px;
          top: 5px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .timeline-item:not(:last-child)::before {
          content: '';
          position: absolute;
          left: -21px;
          top: 15px;
          width: 2px;
          height: calc(100% + 10px);
          background-color: #e5e5e5;
        }
        .nav-tabs-card {
          border-bottom: 1px solid #dee2e6;
        }
        .nav-tabs-card .nav-link {
          border: none;
          border-bottom: 2px solid transparent;
          background: none;
        }
        .nav-tabs-card .nav-link.active {
          border-bottom-color: #007bff;
          background: none;
        }
      `}</style>
      {/* System Header */}
      <PreviewCard>
        <div className="card-inner">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h6>Documentation & Evidence Management</h6>
              <p className="text-soft mb-0">
                Comprehensive documentation system for RMF implementation evidence and compliance artifacts
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                color="primary"
                onClick={() => setShowUploadModal(true)}
              >
                <Icon name="upload" className="me-1"></Icon>
                Upload Document
              </Button>
              <Button color="outline-info">
                <Icon name="download" className="me-1"></Icon>
                Generate SSP
              </Button>
            </div>
          </div>

          {/* Documentation Statistics */}
          <Row className="g-3 mb-4">
            <Col md="2">
              <div className="text-center p-3 bg-light rounded">
                <div className="h4 mb-1">{stats.total}</div>
                <div className="small text-soft">Total Documents</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                <div className="h4 text-success mb-1">{stats.approved}</div>
                <div className="small text-soft">Approved</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                <div className="h4 text-warning mb-1">{stats.draft}</div>
                <div className="small text-soft">Draft</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                <div className="h4 text-info mb-1">{stats.pending}</div>
                <div className="small text-soft">Pending Review</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                <div className="h4 text-danger mb-1">{stats.overdue}</div>
                <div className="small text-soft">Overdue Review</div>
              </div>
            </Col>
            <Col md="2">
              <div className="text-center p-3 border rounded">
                <div className="h4 text-primary mb-1">
                  {Math.round((stats.approved / stats.total) * 100)}%
                </div>
                <div className="small text-soft">Completion</div>
              </div>
            </Col>
          </Row>

          {/* Document Type Distribution */}
          <Row className="g-3">
            {documentTypes.map(type => (
              <Col key={type.id} md="2">
                <div className="text-center p-3 border rounded">
                  <Icon name={type.icon} className={`text-${type.color} mb-2`} style={{ fontSize: '1.5rem' }}></Icon>
                  <div className="h5 mb-1">{stats.byType[type.id] || 0}</div>
                  <div className="small text-soft">{type.name}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </PreviewCard>

      {/* Navigation Tabs */}
      <PreviewCard>
        <div className="card-inner">
          <ul className="nav nav-tabs nav-tabs-mb-icon nav-tabs-card">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <Icon name="eye"></Icon>
                <span>Overview</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                <Icon name="file-docs"></Icon>
                <span>Documents</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'evidence' ? 'active' : ''}`}
                onClick={() => setActiveTab('evidence')}
              >
                <Icon name="camera"></Icon>
                <span>Evidence</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'compliance' ? 'active' : ''}`}
                onClick={() => setActiveTab('compliance')}
              >
                <Icon name="shield-check"></Icon>
                <span>Compliance</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'audit' ? 'active' : ''}`}
                onClick={() => setActiveTab('audit')}
              >
                <Icon name="list-check"></Icon>
                <span>Audit Trail</span>
              </button>
            </li>
          </ul>
        </div>
      </PreviewCard>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Block>
          <Row className="g-4">
            {/* Control Documentation Status */}
            <Col md="6">
              <PreviewCard>
                <div className="card-inner">
                  <h6 className="mb-4">Control Documentation Status</h6>
                  {controls.map(control => (
                    <div key={control.id} className="d-flex justify-content-between align-items-center mb-3 p-2 border rounded">
                      <div>
                        <strong>{control.id}</strong>
                        <div className="small text-soft">{control.name}</div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-light text-dark">
                          {stats.byControl[control.id] || 0} docs
                        </span>
                        <Button 
                          color="outline-primary" 
                          size="sm"
                          onClick={() => setSelectedControl(control.id)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </PreviewCard>
            </Col>

            {/* Recent Activity */}
            <Col md="6">
              <PreviewCard>
                <div className="card-inner">
                  <h6 className="mb-4">Recent Documentation Activity</h6>
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-marker bg-success"></div>
                      <div className="timeline-content">
                        <div className="small">
                          <strong>Audit Log Configuration Report</strong> approved
                        </div>
                        <div className="text-muted small">2 hours ago</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-marker bg-warning"></div>
                      <div className="timeline-content">
                        <div className="small">
                          <strong>Account Management Guide</strong> updated to v0.8
                        </div>
                        <div className="text-muted small">1 day ago</div>
                      </div>
                    </div>
                    <div className="timeline-item">
                      <div className="timeline-marker bg-info"></div>
                      <div className="timeline-content">
                        <div className="small">
                          <strong>Firewall Screenshots</strong> uploaded
                        </div>
                        <div className="text-muted small">3 days ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </PreviewCard>
            </Col>
          </Row>
        </Block>
      )}

      {activeTab === 'documents' && (
        <Block>
          <PreviewCard>
            <div className="card-inner">
              {/* Filters */}
              <Row className="g-3 mb-4">
                <Col md="3">
                  <select 
                    className="form-select form-select-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Types</option>
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </Col>
                <Col md="3">
                  <select 
                    className="form-select form-select-sm"
                    value={selectedControl || ''}
                    onChange={(e) => setSelectedControl(e.target.value || null)}
                  >
                    <option value="">All Controls</option>
                    {controls.map(control => (
                      <option key={control.id} value={control.id}>{control.id}</option>
                    ))}
                  </select>
                </Col>
                <Col md="6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
              </Row>

              {/* Document List */}
              <div className="document-list">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="document-item mb-3 p-3 border rounded">
                    <Row className="align-items-center">
                      <Col md="6">
                        <div className="d-flex align-items-center">
                          <Icon 
                            name={documentTypes.find(t => t.id === doc.type)?.icon || 'file'} 
                            className={`text-${documentTypes.find(t => t.id === doc.type)?.color || 'secondary'} me-3`}
                            style={{ fontSize: '1.5rem' }}
                          ></Icon>
                          <div>
                            <h6 className="mb-1">{doc.title}</h6>
                            <div className="small text-soft">{doc.description}</div>
                            <div className="d-flex gap-1 mt-1">
                              {doc.tags.map((tag, index) => (
                                <span key={index} className="badge bg-light text-dark small">{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Col>
                      <Col md="2">
                        <div className="text-center">
                          <span className={`badge bg-${getStatusColor(doc.status)}`}>
                            {doc.status.toUpperCase()}
                          </span>
                          <div className="small text-soft mt-1">v{doc.version}</div>
                        </div>
                      </Col>
                      <Col md="2">
                        <div className="text-center">
                          <div className="small">{doc.author}</div>
                          <div className="small text-soft">{doc.lastModified}</div>
                        </div>
                      </Col>
                      <Col md="2">
                        <div className="d-flex gap-1 justify-content-end">
                          <Button color="outline-primary" size="sm">
                            <Icon name="eye"></Icon>
                          </Button>
                          <Button color="outline-secondary" size="sm">
                            <Icon name="download"></Icon>
                          </Button>
                          <Button color="outline-info" size="sm">
                            <Icon name="edit"></Icon>
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </div>
          </PreviewCard>
        </Block>
      )}

      {activeTab === 'evidence' && (
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="text-center py-5">
                <Icon name="camera" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                <h6 className="mt-3 text-soft">Evidence Collection</h6>
                <p className="text-soft">
                  Evidence collection interface for screenshots, configuration files, and compliance artifacts.
                </p>
                <Button color="primary">
                  <Icon name="upload" className="me-1"></Icon>
                  Upload Evidence
                </Button>
              </div>
            </div>
          </PreviewCard>
        </Block>
      )}

      {activeTab === 'compliance' && (
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="text-center py-5">
                <Icon name="shield-check" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                <h6 className="mt-3 text-soft">Compliance Mapping</h6>
                <p className="text-soft">
                  Compliance framework mapping and audit readiness assessment tools.
                </p>
                <Button color="success">
                  <Icon name="check-circle" className="me-1"></Icon>
                  Generate Compliance Report
                </Button>
              </div>
            </div>
          </PreviewCard>
        </Block>
      )}

      {activeTab === 'audit' && (
        <Block>
          <PreviewCard>
            <div className="card-inner">
              <div className="text-center py-5">
                <Icon name="list-check" className="text-soft" style={{ fontSize: '3rem' }}></Icon>
                <h6 className="mt-3 text-soft">Audit Trail</h6>
                <p className="text-soft">
                  Complete audit trail of all documentation changes, approvals, and compliance activities.
                </p>
                <Button color="info">
                  <Icon name="clock" className="me-1"></Icon>
                  View Full Audit Log
                </Button>
              </div>
            </div>
          </PreviewCard>
        </Block>
      )}

      {/* Document Upload Modal */}
      {showUploadModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Document</h5>
                <Button
                  color="outline-secondary"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                >
                  <Icon name="cross"></Icon>
                </Button>
              </div>
              <div className="modal-body">
                <Row className="g-3">
                  <Col md="12">
                    <label className="form-label">Document Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter document title..."
                    />
                  </Col>
                  <Col md="6">
                    <label className="form-label">Document Type</label>
                    <select className="form-select">
                      <option value="">Select type...</option>
                      {documentTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </Col>
                  <Col md="6">
                    <label className="form-label">Related Control</label>
                    <select className="form-select">
                      <option value="">Select control...</option>
                      <option value="ALL">All Controls</option>
                      {controls.map(control => (
                        <option key={control.id} value={control.id}>
                          {control.id} - {control.name}
                        </option>
                      ))}
                    </select>
                  </Col>
                  <Col md="6">
                    <label className="form-label">Evidence Type</label>
                    <select className="form-select">
                      <option value="">Select evidence type...</option>
                      {evidenceTypes.map(type => (
                        <option key={type} value={type}>
                          {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                  </Col>
                  <Col md="6">
                    <label className="form-label">Compliance Framework</label>
                    <select className="form-select">
                      <option value="">Select framework...</option>
                      <option value="NIST SP 800-53">NIST SP 800-53</option>
                      <option value="ISO 27001">ISO 27001</option>
                      <option value="FedRAMP">FedRAMP</option>
                      <option value="SOX">SOX</option>
                      <option value="HIPAA">HIPAA</option>
                    </select>
                  </Col>
                  <Col md="12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Enter document description..."
                    ></textarea>
                  </Col>
                  <Col md="12">
                    <label className="form-label">Tags (comma separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g., policy, configuration, approved"
                    />
                  </Col>
                  <Col md="12">
                    <label className="form-label">File Upload</label>
                    <div className="upload-zone border-dashed border rounded p-4 text-center">
                      <Icon name="upload" className="text-soft mb-2" style={{ fontSize: '2rem' }}></Icon>
                      <div className="mb-2">
                        <strong>Drop files here or click to browse</strong>
                      </div>
                      <div className="small text-soft">
                        Supported formats: PDF, DOCX, XLSX, PNG, JPG, ZIP (Max 10MB)
                      </div>
                      <input type="file" className="d-none" multiple />
                      <Button color="outline-primary" className="mt-2">
                        <Icon name="folder" className="me-1"></Icon>
                        Browse Files
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
              <div className="modal-footer">
                <Button color="outline-secondary" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button color="primary">
                  <Icon name="upload" className="me-1"></Icon>
                  Upload Document
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationSystem;
