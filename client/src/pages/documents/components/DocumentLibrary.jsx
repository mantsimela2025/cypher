import React, { useState } from 'react';
import {
  Row,
  Col,
  Icon,
  Button,
  ReactDataTable
} from '@/components/Component';
import { Input, ButtonGroup, Spinner } from 'reactstrap';
import DocumentCard from './DocumentCard';
import DocumentTableColumns from './DocumentTableColumns';

const DocumentLibrary = ({
  documents,
  loading,
  searchTerm,
  onSearch,
  viewMode,
  onViewModeChange
}) => {
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectDocument = (documentId) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map(doc => doc.id));
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'size') {
      aValue = parseInt(aValue);
      bValue = parseInt(bValue);
    } else if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else {
      aValue = aValue?.toString().toLowerCase() || '';
      bValue = bValue?.toString().toLowerCase() || '';
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

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
        <span className="ms-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          {/* Search */}
          <div className="form-control-wrap" style={{ minWidth: '300px' }}>
            <div className="form-icon form-icon-left">
              <Icon name="search" />
            </div>
            <Input
              type="text"
              className="form-control-outlined form-control-sm"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          {/* Sort Options */}
          <div className="form-control-wrap">
            <select
              className="form-select form-select-sm"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <div className="d-flex align-items-center gap-2 me-3">
              <span className="text-muted small">
                {selectedDocuments.length} selected
              </span>
              <Button size="sm" color="light">
                <Icon name="share-alt" />
              </Button>
              <Button size="sm" color="light">
                <Icon name="download" />
              </Button>
              <Button size="sm" color="light">
                <Icon name="trash" />
              </Button>
            </div>
          )}

          {/* View Mode Toggle */}
          <ButtonGroup size="sm">
            <Button
              color={viewMode === 'grid' ? 'primary' : 'light'}
              onClick={() => onViewModeChange('grid')}
            >
              <Icon name="grid-alt" />
            </Button>
            <Button
              color={viewMode === 'list' ? 'primary' : 'light'}
              onClick={() => onViewModeChange('list')}
            >
              <Icon name="list" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Document Count */}
      <div className="mb-3">
        <span className="text-muted">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
        </span>
      </div>

      {/* Content */}
      {documents.length === 0 ? (
        <div className="text-center py-5">
          <Icon name="folder" className="text-muted mb-3" style={{ fontSize: '3rem' }} />
          <h5 className="text-muted">No documents found</h5>
          <p className="text-muted">
            {searchTerm 
              ? `No documents match your search for "${searchTerm}"`
              : 'Upload your first document to get started'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <Row className="g-gs">
          {sortedDocuments.map((document) => (
            <Col key={document.id} sm="6" lg="4" xl="3">
              <DocumentCard
                document={document}
                isSelected={selectedDocuments.includes(document.id)}
                onSelect={() => handleSelectDocument(document.id)}
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
              />
            </Col>
          ))}
        </Row>
      ) : (
        /* List View */
        <ReactDataTable
          data={sortedDocuments}
          columns={DocumentTableColumns({
            selectedDocuments,
            onSelectDocument: handleSelectDocument,
            onSelectAll: handleSelectAll,
            formatFileSize,
            getFileIcon
          })}
          pagination
          selectableRows={false}
          className="nk-tb-list"
        />
      )}
    </div>
  );
};

export default DocumentLibrary;
