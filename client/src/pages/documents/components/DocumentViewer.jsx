import React, { useState, useEffect } from 'react';
import { Icon, Button } from '@/components/Component';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Alert
} from 'reactstrap';

const DocumentViewer = ({ isOpen, onClose, document }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerType, setViewerType] = useState('unsupported');

  useEffect(() => {
    if (document && isOpen) {
      determineViewerType();
    }
  }, [document, isOpen]);

  const determineViewerType = () => {
    if (!document) return;

    const mimeType = document.mime_type.toLowerCase();
    
    if (mimeType.includes('pdf')) {
      setViewerType('pdf');
    } else if (mimeType.includes('image')) {
      setViewerType('image');
    } else if (mimeType.includes('text') || mimeType.includes('plain')) {
      setViewerType('text');
    } else if (mimeType.includes('video')) {
      setViewerType('video');
    } else if (mimeType.includes('audio')) {
      setViewerType('audio');
    } else {
      setViewerType('unsupported');
    }
    
    setLoading(false);
  };

  const handleDownload = () => {
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = document.url;
    link.download = document.original_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderViewer = () => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <Spinner color="primary" />
          <span className="ms-2">Loading document...</span>
        </div>
      );
    }

    if (error) {
      return (
        <Alert color="danger">
          <Icon name="alert-circle" className="me-2" />
          {error}
        </Alert>
      );
    }

    switch (viewerType) {
      case 'pdf':
        return (
          <div className="document-viewer-container">
            <iframe
              src={`${document.url}#toolbar=1&navpanes=1&scrollbar=1`}
              width="100%"
              height="600px"
              style={{ border: 'none', borderRadius: '4px' }}
              title={document.name}
              onLoad={() => setLoading(false)}
              onError={() => setError('Failed to load PDF document')}
            />
          </div>
        );

      case 'image':
        return (
          <div className="document-viewer-container text-center">
            <img
              src={document.url}
              alt={document.name}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '600px', 
                objectFit: 'contain',
                borderRadius: '4px'
              }}
              onLoad={() => setLoading(false)}
              onError={() => setError('Failed to load image')}
            />
          </div>
        );

      case 'text':
        return (
          <div className="document-viewer-container">
            <iframe
              src={document.url}
              width="100%"
              height="600px"
              style={{ 
                border: '1px solid #e5e9f2', 
                borderRadius: '4px',
                backgroundColor: '#fff'
              }}
              title={document.name}
              onLoad={() => setLoading(false)}
              onError={() => setError('Failed to load text document')}
            />
          </div>
        );

      case 'video':
        return (
          <div className="document-viewer-container">
            <video
              controls
              width="100%"
              height="400px"
              style={{ borderRadius: '4px' }}
              onLoadedData={() => setLoading(false)}
              onError={() => setError('Failed to load video')}
            >
              <source src={document.url} type={document.mime_type} />
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="document-viewer-container text-center py-5">
            <Icon name="music" className="text-muted mb-3" style={{ fontSize: '4rem' }} />
            <h5 className="mb-3">{document.name}</h5>
            <audio
              controls
              style={{ width: '100%', maxWidth: '400px' }}
              onLoadedData={() => setLoading(false)}
              onError={() => setError('Failed to load audio')}
            >
              <source src={document.url} type={document.mime_type} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case 'unsupported':
      default:
        return (
          <div className="document-viewer-container text-center py-5">
            <Icon name="file" className="text-muted mb-3" style={{ fontSize: '4rem' }} />
            <h5 className="mb-2">Preview not available</h5>
            <p className="text-muted mb-4">
              This file type ({document.mime_type}) cannot be previewed in the browser.
            </p>
            <Button color="primary" onClick={handleDownload}>
              <Icon name="download" className="me-2" />
              Download to view
            </Button>
          </div>
        );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!document) return null;

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="xl" className="document-viewer-modal">
      <ModalHeader toggle={onClose}>
        <div className="d-flex align-items-center">
          <Icon name="eye" className="me-2" />
          <div>
            <div className="fw-medium">{document.name}</div>
            <small className="text-muted">
              {formatFileSize(document.size)} • {document.mime_type}
            </small>
          </div>
        </div>
      </ModalHeader>
      <ModalBody className="p-0">
        {renderViewer()}
      </ModalBody>
      <ModalFooter>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="text-muted small">
            Created: {new Date(document.created_at).toLocaleDateString()}
            {document.updated_at !== document.created_at && (
              <span className="ms-3">
                Modified: {new Date(document.updated_at).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button color="light" onClick={handleDownload}>
              <Icon name="download" className="me-2" />
              Download
            </Button>
            <Button color="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </ModalFooter>

      <style jsx>{`
        .document-viewer-modal .modal-dialog {
          max-width: 90vw;
        }
        
        .document-viewer-container {
          background-color: #f8f9fa;
          border-radius: 4px;
          padding: 1rem;
          margin: 1rem;
        }
        
        @media (max-width: 768px) {
          .document-viewer-modal .modal-dialog {
            max-width: 95vw;
            margin: 0.5rem;
          }
          
          .document-viewer-container iframe,
          .document-viewer-container video {
            height: 300px !important;
          }
        }
      `}</style>
    </Modal>
  );
};

export default DocumentViewer;
