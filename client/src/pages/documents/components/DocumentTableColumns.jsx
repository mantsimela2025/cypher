import React from 'react';
import { Icon, Button } from '@/components/Component';
import { Badge, UncontrolledTooltip } from 'reactstrap';

const DocumentTableColumns = ({
  selectedDocuments,
  onSelectDocument,
  onSelectAll,
  formatFileSize,
  getFileIcon
}) => {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return [
    {
      name: (
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={selectedDocuments.length > 0}
            onChange={onSelectAll}
          />
        </div>
      ),
      selector: (row) => row.id,
      sortable: false,
      width: '50px',
      cell: (row) => (
        <div className="form-check">
          <input
            type="checkbox"
            className="form-check-input"
            checked={selectedDocuments.includes(row.id)}
            onChange={() => onSelectDocument(row.id)}
          />
        </div>
      ),
    },
    {
      name: 'Name',
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      cell: (row) => (
        <div className="d-flex align-items-center">
          <div className="me-3">
            <Icon
              name={getFileIcon(row.mime_type)}
              className={`text-${getFileTypeColor(row.mime_type)}`}
              style={{ fontSize: '1.5rem' }}
            />
          </div>
          <div>
            <div className="fw-medium" style={{ fontSize: '0.875rem' }}>
              {row.name}
            </div>
            <div className="text-muted small">
              {row.original_name !== row.name && (
                <span>Original: {row.original_name}</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      name: 'Type',
      selector: (row) => row.mime_type,
      sortable: true,
      width: '120px',
      cell: (row) => (
        <Badge
          color={getFileTypeColor(row.mime_type)}
          className="badge-dim"
          style={{ fontSize: '0.7rem' }}
        >
          {row.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
        </Badge>
      ),
    },
    {
      name: 'Size',
      selector: (row) => row.size,
      sortable: true,
      width: '100px',
      cell: (row) => (
        <span className="text-muted small">
          {formatFileSize(row.size)}
        </span>
      ),
    },
    {
      name: 'Tags',
      selector: (row) => row.tags,
      sortable: false,
      width: '200px',
      cell: (row) => (
        <div className="d-flex flex-wrap gap-1">
          {row.tags && row.tags.length > 0 ? (
            <>
              {row.tags.slice(0, 2).map((tag, index) => (
                <Badge
                  key={index}
                  color="light"
                  className="badge-sm"
                  style={{ fontSize: '0.65rem' }}
                >
                  {tag}
                </Badge>
              ))}
              {row.tags.length > 2 && (
                <Badge
                  color="light"
                  className="badge-sm"
                  style={{ fontSize: '0.65rem' }}
                >
                  +{row.tags.length - 2}
                </Badge>
              )}
            </>
          ) : (
            <span className="text-muted small">No tags</span>
          )}
        </div>
      ),
    },
    {
      name: 'Modified',
      selector: (row) => row.updated_at,
      sortable: true,
      width: '150px',
      cell: (row) => (
        <span className="text-muted small">
          {formatDate(row.updated_at)}
        </span>
      ),
    },
    {
      name: 'Status',
      selector: (row) => row.is_shared,
      sortable: false,
      width: '100px',
      cell: (row) => (
        <div className="d-flex align-items-center gap-2">
          {row.is_favorite && (
            <>
              <Icon
                name="star-fill"
                className="text-warning"
                style={{ fontSize: '0.875rem' }}
                id={`table-favorite-${row.id}`}
              />
              <UncontrolledTooltip target={`table-favorite-${row.id}`}>
                Favorite
              </UncontrolledTooltip>
            </>
          )}
          {row.is_shared && (
            <>
              <Icon
                name="share-alt"
                className="text-info"
                style={{ fontSize: '0.875rem' }}
                id={`table-shared-${row.id}`}
              />
              <UncontrolledTooltip target={`table-shared-${row.id}`}>
                Shared
              </UncontrolledTooltip>
            </>
          )}
          {row.version_count > 1 && (
            <>
              <Badge
                color="light"
                className="badge-sm"
                id={`table-versions-${row.id}`}
              >
                v{row.version_count}
              </Badge>
              <UncontrolledTooltip target={`table-versions-${row.id}`}>
                {row.version_count} versions
              </UncontrolledTooltip>
            </>
          )}
        </div>
      ),
    },
    {
      name: 'Actions',
      selector: (row) => row.id,
      sortable: false,
      width: '120px',
      cell: (row) => (
        <div className="d-flex align-items-center gap-1">
          <Button
            size="sm"
            color="transparent"
            className="btn-icon"
            onClick={() => console.log('Download:', row.name)}
            id={`download-${row.id}`}
          >
            <Icon name="download" />
          </Button>
          <UncontrolledTooltip target={`download-${row.id}`}>
            Download
          </UncontrolledTooltip>

          <Button
            size="sm"
            color="transparent"
            className="btn-icon"
            onClick={() => console.log('Share:', row.name)}
            id={`share-${row.id}`}
          >
            <Icon name="share-alt" />
          </Button>
          <UncontrolledTooltip target={`share-${row.id}`}>
            Share
          </UncontrolledTooltip>

          <Button
            size="sm"
            color="transparent"
            className="btn-icon"
            onClick={() => console.log('More options:', row.name)}
            id={`more-${row.id}`}
          >
            <Icon name="more-h" />
          </Button>
          <UncontrolledTooltip target={`more-${row.id}`}>
            More options
          </UncontrolledTooltip>
        </div>
      ),
    },
  ];
};

export default DocumentTableColumns;
