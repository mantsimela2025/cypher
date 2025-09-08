// Bootstrap utility helpers for RMF components

export const getRiskBadgeClass = (riskLevel) => {
  const classes = {
    very_low: 'badge bg-success',
    low: 'badge bg-success',
    moderate: 'badge bg-warning text-dark',
    high: 'badge bg-danger',
    very_high: 'badge bg-danger'
  };
  return classes[riskLevel] || 'badge bg-secondary';
};

export const getImpactBadgeClass = (impact) => {
  const classes = {
    low: 'badge bg-success',
    moderate: 'badge bg-warning text-dark',
    high: 'badge bg-danger'
  };
  return classes[impact] || 'badge bg-secondary';
};

export const getStepStatusClass = (status) => {
  const classes = {
    completed: 'text-success',
    in_progress: 'text-primary',
    pending: 'text-muted'
  };
  return classes[status] || 'text-muted';
};

export const getStepIcon = (status) => {
  const icons = {
    completed: 'bi-check-circle-fill',
    in_progress: 'bi-arrow-clockwise',
    pending: 'bi-circle'
  };
  return icons[status] || 'bi-circle';
};

export const getArtifactStatusBadge = (status) => {
  const classes = {
    completed: 'badge bg-success',
    draft: 'badge bg-warning text-dark',
    in_progress: 'badge bg-primary',
    not_started: 'badge bg-secondary'
  };
  return classes[status] || 'badge bg-secondary';
};

export const getStepLabel = (step) => {
  const steps = {
    categorize: 'Step 1: Categorize',
    select: 'Step 2: Select Controls',
    implement: 'Step 3: Implement',
    assess: 'Step 4: Assess',
    authorize: 'Step 5: Authorize',
    monitor: 'Step 6: Monitor'
  };
  return steps[step] || step;
};

export const getOverallCategory = (confidentiality, integrity, availability) => {
  const impacts = [confidentiality, integrity, availability].filter(Boolean);
  
  if (impacts.includes('high')) return 'HIGH';
  if (impacts.includes('moderate')) return 'MODERATE';
  if (impacts.every(i => i === 'low')) return 'LOW';
  return 'UNDEFINED';
};

// Bootstrap modal utilities
export const createModal = (id, title, body, actions) => {
  return `
    <div class="modal fade" id="${id}" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            ${body}
          </div>
          <div class="modal-footer">
            ${actions}
          </div>
        </div>
      </div>
    </div>
  `;
};

// Progress bar helper
export const createProgressBar = (percentage, size = 'default') => {
  const height = size === 'small' ? '6px' : size === 'large' ? '12px' : '8px';
  return `
    <div class="progress" style="height: ${height}">
      <div class="progress-bar" role="progressbar" style="width: ${percentage}%" 
           aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
      </div>
    </div>
  `;
};

// Alert helpers
export const createAlert = (type, title, message) => {
  return `
    <div class="alert alert-${type}" role="alert">
      <h6 class="alert-heading">${title}</h6>
      <p class="mb-0">${message}</p>
    </div>
  `;
};

// Card helpers
export const createMetricCard = (icon, title, value, bgClass = 'primary') => {
  return `
    <div class="card h-100">
      <div class="card-body">
        <div class="d-flex align-items-center">
          <div class="flex-shrink-0">
            <div class="bg-${bgClass} bg-opacity-10 p-3 rounded">
              <i class="bi bi-${icon} text-${bgClass} fs-4"></i>
            </div>
          </div>
          <div class="flex-grow-1 ms-3">
            <h5 class="card-title mb-1">${value}</h5>
            <p class="card-text text-muted mb-0">${title}</p>
          </div>
        </div>
      </div>
    </div>
  `;
};