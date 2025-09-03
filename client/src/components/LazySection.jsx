import React from 'react';
import { Button, Spinner } from 'reactstrap';
import { Icon } from '@/components/Component';

/**
 * LazySection - A component that loads data only when requested
 * Perfect for dashboard sections that should load on-demand
 */
const LazySection = ({
  title,
  description,
  loadButtonText = "Load Data",
  refreshButtonText = "Refresh",
  data,
  loading,
  error,
  hasLoaded,
  onLoad,
  onRefresh,
  children,
  className = "",
  minHeight = "200px",
  showRefreshButton = true,
  loadButtonColor = "primary",
  refreshButtonColor = "light",
  emptyMessage = "No data available",
  errorRetryText = "Try Again"
}) => {
  // Show loading state
  if (loading) {
    return (
      <div 
        className={`d-flex flex-column justify-content-center align-items-center ${className}`}
        style={{ minHeight }}
      >
        <Spinner color="primary" />
        <div className="mt-2 text-muted">Loading {title?.toLowerCase() || 'data'}...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div 
        className={`d-flex flex-column justify-content-center align-items-center text-center ${className}`}
        style={{ minHeight }}
      >
        <Icon name="alert-circle" className="text-danger mb-2" style={{ fontSize: "2rem" }} />
        <div className="text-danger mb-2">Failed to load {title?.toLowerCase() || 'data'}</div>
        <div className="text-muted small mb-3">{error}</div>
        <Button color="primary" size="sm" onClick={onLoad}>
          <Icon name="reload" className="mr-1" />
          {errorRetryText}
        </Button>
      </div>
    );
  }

  // Show data if loaded
  if (hasLoaded && data) {
    return (
      <div className={className}>
        {/* Header with refresh button */}
        {(title || showRefreshButton) && (
          <div className="d-flex justify-content-between align-items-center mb-3">
            {title && (
              <div>
                <h5 className="mb-0">{title}</h5>
                {description && <small className="text-muted">{description}</small>}
              </div>
            )}
            {showRefreshButton && (
              <Button 
                color={refreshButtonColor} 
                size="sm" 
                onClick={onRefresh || onLoad}
                disabled={loading}
              >
                <Icon name="reload" />
                {refreshButtonText}
              </Button>
            )}
          </div>
        )}
        
        {/* Render data */}
        {children ? children(data) : (
          <div className="text-center text-muted">
            {emptyMessage}
          </div>
        )}
      </div>
    );
  }

  // Show initial load state (not loaded yet)
  return (
    <div 
      className={`d-flex flex-column justify-content-center align-items-center text-center ${className}`}
      style={{ minHeight }}
    >
      {title && (
        <div className="mb-3">
          <h5 className="mb-1">{title}</h5>
          {description && <div className="text-muted small">{description}</div>}
        </div>
      )}
      
      <Icon name="eye" className="text-muted mb-2" style={{ fontSize: "2rem" }} />
      <div className="text-muted mb-3">
        Click to load {title?.toLowerCase() || 'data'}
      </div>
      
      <Button 
        color={loadButtonColor} 
        onClick={onLoad}
        disabled={loading}
      >
        <Icon name="download" className="mr-1" />
        {loadButtonText}
      </Button>
    </div>
  );
};

/**
 * LazyCard - A card wrapper for lazy sections
 */
export const LazyCard = ({ 
  title, 
  children, 
  className = "",
  ...lazyProps 
}) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <h6 className="card-title mb-0">{title}</h6>
        </div>
      )}
      <div className="card-body">
        <LazySection {...lazyProps}>
          {children}
        </LazySection>
      </div>
    </div>
  );
};

/**
 * LazyTable - Specialized lazy section for data tables
 */
export const LazyTable = ({
  columns,
  TableComponent,
  tableProps = {},
  ...lazyProps
}) => {
  return (
    <LazySection {...lazyProps}>
      {(data) => (
        <TableComponent
          data={data}
          columns={columns}
          {...tableProps}
        />
      )}
    </LazySection>
  );
};

/**
 * LazyStats - Specialized lazy section for statistics cards
 */
export const LazyStats = ({
  StatsComponent,
  statsProps = {},
  ...lazyProps
}) => {
  return (
    <LazySection {...lazyProps}>
      {(data) => (
        <StatsComponent
          stats={data}
          {...statsProps}
        />
      )}
    </LazySection>
  );
};

export default LazySection;
