import React, { useState } from 'react';
import {
  Icon,
  Button,
  PreviewCard
} from '@/components/Component';
import {
  Badge,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledTooltip
} from 'reactstrap';

const DocumentCard = ({
  document,
  isSelected,
  onSelect,
  formatFileSize,
  getFileIcon
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(document.is_favorite);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleFavoriteToggle = (e) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // TODO: API call to update favorite status
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    // TODO: Implement download logic
    console.log('Downloading:', document.name);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    // TODO: Open share modal
    console.log('Sharing:', document.name);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    // TODO: Implement delete logic
    console.log('Deleting:', document.name);
  };

  const handleCardClick = () => {
    // TODO: Open document details panel
    console.log('Opening document details:', document.name);
  };

  const getFileTypeColor = (mimeType) => {
    if (mimeType.includes('pdf')) return 'danger';
    if (mimeType.includes('word')) return 'primary';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'success';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'warning';
    if (mimeType.includes('image')) return 'info';
    if (mimeType.includes('video')) return 'dark';
    return 'secondary';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <PreviewCard className={`document-card ${isSelected ? 'selected' : ''}`}>
      <div className="card-inner p-3" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        {/* Header with selection and actions */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={isSelected}
              onChange={onSelect}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="d-flex align-items-center gap-1">
            {/* Favorite Button */}
            <Button
              size="sm"
              color="transparent"
              className="btn-icon"
              onClick={handleFavoriteToggle}
              id={`favorite-${document.id}`}
            >
              <Icon
                name={isFavorite ? 'star-fill' : 'star'}
                className={isFavorite ? 'text-warning' : 'text-muted'}
              />
            </Button>
            <UncontrolledTooltip target={`favorite-${document.id}`}>
              {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </UncontrolledTooltip>

            {/* Actions Dropdown */}
            <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
              <DropdownToggle
                tag="a"
                className="btn btn-sm btn-icon btn-trigger"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon name="more-h" />
              </DropdownToggle>
              <DropdownMenu end>
                <DropdownItem onClick={handleDownload}>
                  <Icon name="download" className="me-2" />
                  Download
                </DropdownItem>
                <DropdownItem onClick={handleShare}>
                  <Icon name="share-alt" className="me-2" />
                  Share
                </DropdownItem>
                <DropdownItem divider />
                <DropdownItem onClick={handleDelete} className="text-danger">
                  <Icon name="trash" className="me-2" />
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* File Icon and Type */}
        <div className="text-center mb-3">
          <div className="file-icon-wrapper mb-2">
            <Icon
              name={getFileIcon(document.mime_type)}
              className={`text-${getFileTypeColor(document.mime_type)}`}
              style={{ fontSize: '3rem' }}
            />
          </div>
          <Badge
            color={getFileTypeColor(document.mime_type)}
            className="badge-dim"
            style={{ fontSize: '0.7rem' }}
          >
            {document.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
          </Badge>
        </div>

        {/* Document Name */}
        <div className="mb-2">
          <h6 className="title mb-1" style={{ fontSize: '0.875rem', lineHeight: '1.3' }}>
            {document.name}
          </h6>
        </div>

        {/* Document Info */}
        <div className="document-info">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small">Size</span>
            <span className="small">{formatFileSize(document.size)}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small">Modified</span>
            <span className="small">{formatDate(document.updated_at)}</span>
          </div>
          {document.version_count > 1 && (
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted small">Versions</span>
              <Badge color="light" className="badge-sm">
                {document.version_count}
              </Badge>
            </div>
          )}
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="mt-3">
            <div className="d-flex flex-wrap gap-1">
              {document.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  color="light"
                  className="badge-sm"
                  style={{ fontSize: '0.65rem' }}
                >
                  {tag}
                </Badge>
              ))}
              {document.tags.length > 3 && (
                <Badge
                  color="light"
                  className="badge-sm"
                  style={{ fontSize: '0.65rem' }}
                >
                  +{document.tags.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mt-3 d-flex justify-content-between align-items-center">
          <div className="d-flex gap-2">
            {document.is_shared && (
              <Icon
                name="share-alt"
                className="text-info"
                style={{ fontSize: '0.875rem' }}
                id={`shared-${document.id}`}
              />
            )}
            {document.is_shared && (
              <UncontrolledTooltip target={`shared-${document.id}`}>
                Shared document
              </UncontrolledTooltip>
            )}
          </div>
          <div className="text-muted small">
            {formatDate(document.created_at)}
          </div>
        </div>
      </div>

      <style jsx>{`
        .document-card {
          transition: all 0.2s ease;
          border: 1px solid #e5e9f2;
        }
        
        .document-card:hover {
          border-color: #526484;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .document-card.selected {
          border-color: #6576ff;
          background-color: #f8f9ff;
        }
        
        .file-icon-wrapper {
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
    </PreviewCard>
  );
};

export default DocumentCard;
