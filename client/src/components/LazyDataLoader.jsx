import React from 'react';
import PropTypes from 'prop-types';
import { Spinner, Button } from 'reactstrap';
import { Icon } from '@/components/Component';

/**
 * Lazy Data Loader Component
 * Provides a consistent UI for lazy-loaded data with loading states
 */
const LazyDataLoader = ({
  data,
  loading,
  error,
  hasLoaded,
  loadData,
  reload,
  children,
  loadingMessage = "Loading data...",
  errorMessage = "Failed to load data",
  emptyMessage = "No data available",
  showLoadButton = true,
  loadButtonText = "Load Data",
  className = "",
  minHeight = "200px"
}) => {
  // Show load button if data hasn't been loaded yet
  if (!hasLoaded && !loading) {
    return (
      <div 
        className={`d-flex flex-column align-items-center justify-content-center ${className}`}
        style={{ minHeight }}
      >
        <Icon name="database" className="display-1 text-muted mb-3"></Icon>
        <h5 className="text-muted mb-3">Data not loaded</h5>
        <p className="text-muted text-center mb-4">
          Click the button below to load the latest data.
        </p>
        {showLoadButton && (
          <Button color="primary" onClick={() => loadData()}>
            <Icon name="refresh-cw" className="me-2"></Icon>
            {loadButtonText}
          </Button>
        )}
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div 
        className={`d-flex flex-column align-items-center justify-content-center ${className}`}
        style={{ minHeight }}
      >
        <Spinner color="primary" className="mb-3" />
        <p className="text-muted">{loadingMessage}</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div 
        className={`d-flex flex-column align-items-center justify-content-center ${className}`}
        style={{ minHeight }}
      >
        <Icon name="alert-circle" className="display-1 text-danger mb-3"></Icon>
        <h5 className="text-danger mb-3">Error Loading Data</h5>
        <p className="text-muted text-center mb-4">
          {error.message || errorMessage}
        </p>
        <div className="d-flex gap-2">
          <Button color="outline-danger" size="sm" onClick={() => reload()}>
            <Icon name="refresh-cw" className="me-2"></Icon>
            Try Again
          </Button>
          <Button color="outline-secondary" size="sm" onClick={() => loadData()}>
            <Icon name="database" className="me-2"></Icon>
            Reload
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div 
        className={`d-flex flex-column align-items-center justify-content-center ${className}`}
        style={{ minHeight }}
      >
        <Icon name="inbox" className="display-1 text-muted mb-3"></Icon>
        <h5 className="text-muted mb-3">No Data</h5>
        <p className="text-muted text-center mb-4">{emptyMessage}</p>
        <Button color="outline-primary" size="sm" onClick={() => reload()}>
          <Icon name="refresh-cw" className="me-2"></Icon>
          Refresh
        </Button>
      </div>
    );
  }

  // Render children with data
  return children(data);
};

/**
 * Lazy Section Component
 * Wraps a section that should be lazy loaded
 */
export const LazySection = ({ 
  title, 
  description,
  children,
  className = "",
  ...lazyProps 
}) => {
  return (
    <div className={`lazy-section ${className}`}>
      {title && (
        <div className="section-header mb-4">
          <h4>{title}</h4>
          {description && <p className="text-muted">{description}</p>}
        </div>
      )}
      <LazyDataLoader {...lazyProps}>
        {children}
      </LazyDataLoader>
    </div>
  );
};

/**
 * Lazy Card Component
 * Card wrapper for lazy-loaded content
 */
export const LazyCard = ({ 
  title, 
  subtitle,
  actions,
  children,
  className = "",
  ...lazyProps 
}) => {
  return (
    <div className={`card card-bordered ${className}`}>
      {(title || subtitle || actions) && (
        <div className="card-inner border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              {title && <h5 className="card-title mb-0">{title}</h5>}
              {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
            </div>
            {actions && <div className="card-actions">{actions}</div>}
          </div>
        </div>
      )}
      <div className="card-inner">
        <LazyDataLoader {...lazyProps}>
          {children}
        </LazyDataLoader>
      </div>
    </div>
  );
};

// PropTypes validation
LazyDataLoader.propTypes = {
  data: PropTypes.any,
  loading: PropTypes.bool,
  error: PropTypes.string,
  hasLoaded: PropTypes.bool,
  loadData: PropTypes.func,
  reload: PropTypes.func,
  children: PropTypes.node,
  loadingMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  emptyMessage: PropTypes.string,
  showLoadButton: PropTypes.bool,
  loadButtonText: PropTypes.string,
  className: PropTypes.string,
  minHeight: PropTypes.string
};

// Card wrapper PropTypes
LazyDataLoader.Card.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node
};

export default LazyDataLoader;
