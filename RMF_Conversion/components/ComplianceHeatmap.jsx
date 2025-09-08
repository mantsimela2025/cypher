import React from 'react';

export const ComplianceHeatmap = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted mt-2">Loading compliance data...</p>
      </div>
    );
  }

  const getHeatmapColor = (percentage) => {
    if (percentage >= 90) return 'bg-success';
    if (percentage >= 75) return 'bg-warning';
    if (percentage >= 50) return 'bg-info';
    return 'bg-danger';
  };

  const getHeatmapTextColor = (percentage) => {
    if (percentage >= 75) return 'text-white';
    return 'text-dark';
  };

  const controlFamilies = [
    { code: 'AC', name: 'Access Control' },
    { code: 'AU', name: 'Audit and Accountability' },
    { code: 'AT', name: 'Awareness and Training' },
    { code: 'CM', name: 'Configuration Management' },
    { code: 'CP', name: 'Contingency Planning' },
    { code: 'IA', name: 'Identification and Authentication' },
    { code: 'IR', name: 'Incident Response' },
    { code: 'MA', name: 'Maintenance' },
    { code: 'MP', name: 'Media Protection' },
    { code: 'PE', name: 'Physical and Environmental Protection' },
    { code: 'PL', name: 'Planning' },
    { code: 'PS', name: 'Personnel Security' },
    { code: 'RA', name: 'Risk Assessment' },
    { code: 'CA', name: 'Security Assessment and Authorization' },
    { code: 'SC', name: 'System and Communications Protection' },
    { code: 'SI', name: 'System and Information Integrity' }
  ];

  return (
    <div className="compliance-heatmap">
      <div className="row g-2">
        {controlFamilies.map((family) => {
          const percentage = data[family.code]?.implementationPercentage || 0;
          const bgClass = getHeatmapColor(percentage);
          const textClass = getHeatmapTextColor(percentage);
          
          return (
            <div key={family.code} className="col-6 col-sm-4 col-md-3 col-lg-2">
              <div 
                className={`card h-100 ${bgClass} ${textClass}`}
                style={{ minHeight: '80px' }}
                title={`${family.name}: ${percentage}% implemented`}
              >
                <div className="card-body p-2 d-flex flex-column justify-content-center text-center">
                  <h6 className="card-title mb-1 small">{family.code}</h6>
                  <div className="fw-bold">{percentage}%</div>
                  <small className="opacity-75">{family.name}</small>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3">
        <div className="d-flex justify-content-center align-items-center gap-3 small">
          <span>Implementation Level:</span>
          <div className="d-flex align-items-center gap-1">
            <div className="bg-danger" style={{width: '12px', height: '12px'}}></div>
            <span>&lt;50%</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <div className="bg-info" style={{width: '12px', height: '12px'}}></div>
            <span>50-74%</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <div className="bg-warning" style={{width: '12px', height: '12px'}}></div>
            <span>75-89%</span>
          </div>
          <div className="d-flex align-items-center gap-1">
            <div className="bg-success" style={{width: '12px', height: '12px'}}></div>
            <span>90%+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceHeatmap;