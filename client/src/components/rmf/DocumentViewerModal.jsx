/**
 * Document Viewer Modal Component
 * Detailed document viewing and management interface
 * Handles document preview, version control, and approval workflow
 */

import React, { useState } from "react";
import {
  Button,
  Icon,
  Row,
  Col,
} from "@/components/Component";

const DocumentViewerModal = ({ 
  isOpen = false,
  onClose = () => {},
  document = null,
  onDocumentUpdate = () => {},
  onDocumentApprove = () => {},
  onDocumentReject = () => {},
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [comment, setComment] = useState('');

  if (!isOpen || !document) return null;

  // Sample version history (would come from API)
  const versionHistory = [
    {
      version: '1.2',
      date: '2024-01-10',
      author: 'John Doe',
      changes: 'Updated access control procedures section',
      status: 'approved',
      size: '2.4 MB'
    },
    {
      version: '1.1',
      date: '2024-01-05',
      author: 'John Doe',
      changes: 'Added compliance mapping section',
      status: 'approved',
      size: '2.2 MB'
    },
    {
      version: '1.0',
      date: '2024-01-01',
      author: 'John Doe',
      changes: 'Initial document creation',
      status: 'approved',
      size: '2.0 MB'
    }
  ];

  // Sample comments/reviews (would come from API)
  const documentComments = [
    {
      id: 1,
      author: 'Security Manager',
      date: '2024-01-09',
      comment: 'Please add more specific examples in section 3.2',
      type: 'review',
      resolved: true
    },
    {
      id: 2,
      author: 'Compliance Officer',
      date: '2024-01-08',
      comment: 'Document meets all compliance requirements. Approved.',
      type: 'approval',
      resolved: false
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'draft': return 'warning';
      case 'pending': return 'info';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const handleApprove = () => {
    if (comment.trim()) {
      onDocumentApprove(document.id, comment);
      setComment('');
      alert('Document approved successfully');
    } else {
      alert('Please add a comment for approval');
    }
  };

  const handleReject = () => {
    if (comment.trim()) {
      onDocumentReject(document.id, comment);
      setComment('');
      alert('Document rejected with feedback');
    } else {
      alert('Please add a comment explaining the rejection');
    }
  };

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <h5 className="modal-title">{document.title}</h5>
              <div className="d-flex gap-2 mt-1">
                <span className={`badge bg-${getStatusColor(document.status)}`}>
                  {document.status.toUpperCase()}
                </span>
                <span className="badge bg-light text-dark">v{document.version}</span>
                <span className="badge bg-info">{document.controlId}</span>
                <span className="badge bg-secondary">{document.format}</span>
              </div>
            </div>
            <Button 
              color="outline-secondary" 
              size="sm"
              onClick={onClose}
            >
              <Icon name="cross"></Icon>
            </Button>
          </div>
          
          <div className="modal-body">
            {/* Document Tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                >
                  <Icon name="eye" className="me-1"></Icon>
                  Preview
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                  onClick={() => setActiveTab('details')}
                >
                  <Icon name="info" className="me-1"></Icon>
                  Details
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'versions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('versions')}
                >
                  <Icon name="clock" className="me-1"></Icon>
                  Versions
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  <Icon name="chat" className="me-1"></Icon>
                  Comments
                </button>
              </li>
            </ul>

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="document-preview">
                <div className="text-center py-5 border rounded bg-light">
                  <Icon name="file-docs" className="text-soft mb-3" style={{ fontSize: '4rem' }}></Icon>
                  <h6 className="text-soft">Document Preview</h6>
                  <p className="text-soft mb-4">
                    {document.format} document preview would be displayed here
                  </p>
                  <div className="d-flex gap-2 justify-content-center">
                    <Button color="primary">
                      <Icon name="download" className="me-1"></Icon>
                      Download
                    </Button>
                    <Button color="outline-primary">
                      <Icon name="external-link" className="me-1"></Icon>
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="document-details">
                <Row className="g-4">
                  <Col md="6">
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Title</label>
                      <div className="form-control-plaintext">{document.title}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Description</label>
                      <div className="form-control-plaintext">{document.description}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Type</label>
                      <div className="form-control-plaintext">
                        <span className="badge bg-light text-dark">{document.type}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Evidence Type</label>
                      <div className="form-control-plaintext">
                        <span className="badge bg-info">{document.evidenceType}</span>
                      </div>
                    </div>
                  </Col>
                  <Col md="6">
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Author</label>
                      <div className="form-control-plaintext">{document.author}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Created Date</label>
                      <div className="form-control-plaintext">{document.createdDate}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Last Modified</label>
                      <div className="form-control-plaintext">{document.lastModified}</div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">File Size</label>
                      <div className="form-control-plaintext">{document.size}</div>
                    </div>
                  </Col>
                  <Col md="12">
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Tags</label>
                      <div className="form-control-plaintext">
                        {document.tags.map((tag, index) => (
                          <span key={index} className="badge bg-light text-dark me-1">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Compliance Mapping</label>
                      <div className="form-control-plaintext">
                        {document.complianceMapping.map((framework, index) => (
                          <span key={index} className="badge bg-success me-1">{framework}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Review Status</label>
                      <div className="form-control-plaintext">
                        <span className={`badge bg-${document.reviewStatus === 'current' ? 'success' : 'warning'}`}>
                          {document.reviewStatus}
                        </span>
                        <span className="ms-2 small text-soft">Next review: {document.nextReview}</span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Versions Tab */}
            {activeTab === 'versions' && (
              <div className="document-versions">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Version History</h6>
                  <Button color="outline-primary" size="sm">
                    <Icon name="upload" className="me-1"></Icon>
                    Upload New Version
                  </Button>
                </div>
                <div className="version-list">
                  {versionHistory.map((version, index) => (
                    <div key={index} className="version-item mb-3 p-3 border rounded">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="d-flex align-items-center mb-2">
                            <strong className="me-2">Version {version.version}</strong>
                            <span className={`badge bg-${getStatusColor(version.status)}`}>
                              {version.status}
                            </span>
                            {index === 0 && <span className="badge bg-primary ms-1">Current</span>}
                          </div>
                          <div className="small text-soft mb-1">
                            {version.changes}
                          </div>
                          <div className="small text-muted">
                            By {version.author} on {version.date} • {version.size}
                          </div>
                        </div>
                        <div className="d-flex gap-1">
                          <Button color="outline-primary" size="sm">
                            <Icon name="eye"></Icon>
                          </Button>
                          <Button color="outline-secondary" size="sm">
                            <Icon name="download"></Icon>
                          </Button>
                          {index !== 0 && (
                            <Button color="outline-info" size="sm">
                              <Icon name="refresh"></Icon>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div className="document-comments">
                <div className="mb-4">
                  <h6>Comments & Reviews</h6>
                  <div className="comment-list">
                    {documentComments.map(comment => (
                      <div key={comment.id} className="comment-item mb-3 p-3 border rounded">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="d-flex align-items-center">
                            <strong className="me-2">{comment.author}</strong>
                            <span className={`badge ${comment.type === 'approval' ? 'bg-success' : 'bg-info'}`}>
                              {comment.type}
                            </span>
                            {comment.resolved && <span className="badge bg-secondary ms-1">Resolved</span>}
                          </div>
                          <span className="small text-muted">{comment.date}</span>
                        </div>
                        <div className="comment-text">{comment.comment}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Comment */}
                <div className="add-comment">
                  <h6>Add Comment/Review</h6>
                  <textarea
                    className="form-control mb-3"
                    rows="3"
                    placeholder="Add your comment or review feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                  <div className="d-flex gap-2">
                    <Button color="success" onClick={handleApprove}>
                      <Icon name="check" className="me-1"></Icon>
                      Approve
                    </Button>
                    <Button color="danger" onClick={handleReject}>
                      <Icon name="cross" className="me-1"></Icon>
                      Reject
                    </Button>
                    <Button color="info">
                      <Icon name="chat" className="me-1"></Icon>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button color="outline-secondary" onClick={onClose}>
              Close
            </Button>
            <Button color="outline-primary">
              <Icon name="edit" className="me-1"></Icon>
              Edit Document
            </Button>
            <Button color="primary">
              <Icon name="download" className="me-1"></Icon>
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
