import React from 'react';
import { Icon } from '@/components/Component';
import { Spinner } from 'reactstrap';
import DocumentCard from './DocumentCard';
import { Row, Col } from '@/components/Component';

const DocumentShared = ({ documents, loading }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return 'file-pdf';
    if (mimeType.includes('word')) return 'file-word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-ppt';
    if (mimeType.includes('image')) return 'img';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'music';
    if (mimeType.includes('text')) return 'file-text';
    return 'file';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <Spinner color="primary" />
        <span className="ms-2">Loading shared documents...</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3">
        <span className="text-muted">
          {documents.length} shared document{documents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-5">
          <Icon name="share-alt" className="text-muted mb-3" style={{ fontSize: '3rem' }} />
          <h5 className="text-muted">No shared documents</h5>
          <p className="text-muted">
            Documents shared with you or by you will appear here
          </p>
        </div>
      ) : (
        <Row className="g-gs">
          {documents.map((document) => (
            <Col key={document.id} sm="6" lg="4" xl="3">
              <DocumentCard
                document={document}
                isSelected={false}
                onSelect={() => {}}
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default DocumentShared;
