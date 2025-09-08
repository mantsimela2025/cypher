import React, { useState } from 'react';

// Mock data for Bootstrap conversion - replace with actual data fetching
const mockSystemsOverview = {
  systemsInProgress: [
    {
      id: 1,
      systemName: "Financial Management System",
      riskLevel: "moderate",
      currentStep: "categorize",
      progress: 25,
      lastUpdated: "2025-01-15"
    },
    {
      id: 2,
      systemName: "HR Management Platform",
      riskLevel: "low", 
      currentStep: "select",
      progress: 40,
      lastUpdated: "2025-01-14"
    }
  ],
  recentActivity: [
    {
      id: 1,
      action: "System categorized as moderate impact",
      system: "Financial Management System",
      timestamp: "2025-01-15T10:30:00Z",
      user: "Security Analyst"
    }
  ]
};

const mockAIInsights = [
  {
    id: 1,
    title: "Security Control Enhancement Opportunity",
    description: "Based on system categorization, implementing additional access controls could reduce risk by 15%",
    insightType: "security_enhancement",
    confidence: 87,
    priority: "high"
  },
  {
    id: 2,
    title: "Process Optimization Detected",
    description: "Automated scanning could reduce manual assessment time by 40%",
    insightType: "process_optimization", 
    confidence: 92,
    priority: "medium"
  }
];

const mockComplianceMetrics = {
  overallScore: 78,
  controlsImplemented: 145,
  totalControls: 186,
  heatmapData: {
    "AC": { implementationPercentage: 85 },
    "AU": { implementationPercentage: 72 },
    "AT": { implementationPercentage: 90 },
    "CM": { implementationPercentage: 65 }
  }
};

export const RMFDashboard = () => {
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const getRiskBadgeClass = (riskLevel) => {
    const classes = {
      very_low: 'badge bg-success',
      low: 'badge bg-success',
      moderate: 'badge bg-warning text-dark',
      high: 'badge bg-danger',
      very_high: 'badge bg-danger'
    };
    return classes[riskLevel] || 'badge bg-secondary';
  };

  const getStepLabel = (step) => {
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

  const handleApplyRecommendation = (insight) => {
    setSelectedRecommendation(insight);
    setIsApplyModalOpen(true);
  };

  const confirmApplyRecommendation = () => {
    // API call would go here
    console.log('Applying recommendation:', selectedRecommendation);
    setIsApplyModalOpen(false);
    setSelectedRecommendation(null);
    // Show success message
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Risk Management Framework Dashboard</h1>
              <p className="text-muted mb-0">AI-powered ATO process automation and compliance management</p>
            </div>
            <button className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>
              Add New System
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-primary bg-opacity-10 p-3 rounded">
                    <i className="bi bi-diagram-3 text-primary fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h5 className="card-title mb-1">{mockSystemsOverview.systemsInProgress.length}</h5>
                  <p className="card-text text-muted mb-0">Systems in Progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-success bg-opacity-10 p-3 rounded">
                    <i className="bi bi-shield-check text-success fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h5 className="card-title mb-1">{mockComplianceMetrics.overallScore}%</h5>
                  <p className="card-text text-muted mb-0">Compliance Score</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-info bg-opacity-10 p-3 rounded">
                    <i className="bi bi-list-check text-info fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h5 className="card-title mb-1">{mockComplianceMetrics.controlsImplemented}/{mockComplianceMetrics.totalControls}</h5>
                  <p className="card-text text-muted mb-0">Controls Implemented</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-warning bg-opacity-10 p-3 rounded">
                    <i className="bi bi-robot text-warning fs-4"></i>
                  </div>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h5 className="card-title mb-1">{mockAIInsights.length}</h5>
                  <p className="card-text text-muted mb-0">AI Recommendations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="row">
        {/* Systems in Progress */}
        <div className="col-lg-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Systems in Progress</h5>
            </div>
            <div className="card-body">
              {mockSystemsOverview.systemsInProgress.map((system) => (
                <div key={system.id} className="border rounded p-3 mb-3">
                  <div className="row align-items-center">
                    <div className="col-md-6">
                      <h6 className="mb-1">{system.systemName}</h6>
                      <p className="text-muted mb-1 small">{getStepLabel(system.currentStep)}</p>
                      <div className="d-flex align-items-center">
                        <span className={getRiskBadgeClass(system.riskLevel)}>
                          {system.riskLevel.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="mb-2">
                        <small className="text-muted">Progress: {system.progress}%</small>
                      </div>
                      <div className="progress" style={{height: '6px'}}>
                        <div 
                          className="progress-bar" 
                          role="progressbar" 
                          style={{width: `${system.progress}%`}}
                          aria-valuenow={system.progress}
                          aria-valuemin="0" 
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                    <div className="col-md-3 text-end">
                      <button className="btn btn-outline-primary btn-sm me-2">
                        View Details
                      </button>
                      <button className="btn btn-sm btn-outline-secondary">
                        <i className="bi bi-three-dots"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div className="col-lg-4 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                <i className="bi bi-robot me-2"></i>
                AI Insights & Recommendations
              </h5>
            </div>
            <div className="card-body">
              {mockAIInsights.map((insight) => (
                <div key={insight.id} className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-1 small">{insight.title}</h6>
                    <span className="badge bg-light text-dark small">
                      {insight.confidence}%
                    </span>
                  </div>
                  <p className="small text-muted mb-2">{insight.description}</p>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-primary">
                      {insight.insightType.replace('_', ' ')}
                    </small>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleApplyRecommendation(insight)}
                    >
                      Apply Recommendation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Recent Activity</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>System</th>
                      <th>User</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockSystemsOverview.recentActivity.map((activity) => (
                      <tr key={activity.id}>
                        <td>{activity.action}</td>
                        <td>{activity.system}</td>
                        <td>{activity.user}</td>
                        <td>
                          <small className="text-muted">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Recommendation Modal */}
      {isApplyModalOpen && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-robot me-2"></i>
                  Apply AI Recommendation
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsApplyModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedRecommendation && (
                  <div>
                    <div className="alert alert-info">
                      <div className="d-flex justify-content-between align-items-start">
                        <h6 className="alert-heading">{selectedRecommendation.title}</h6>
                        <span className="badge bg-primary">
                          {selectedRecommendation.confidence}% confidence
                        </span>
                      </div>
                      <p className="mb-1">{selectedRecommendation.description}</p>
                      <small>Type: {selectedRecommendation.insightType.replace('_', ' ')}</small>
                    </div>
                    
                    <div className="alert alert-warning">
                      <strong>Note:</strong> This action will automatically apply the recommended changes to your system configuration. 
                      This may include updating security controls, compliance settings, or process workflows.
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsApplyModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={confirmApplyRecommendation}
                >
                  <i className="bi bi-robot me-2"></i>
                  Apply Recommendation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RMFDashboard;