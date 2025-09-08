import React, { useState } from 'react';

// Mock data for the system details
const mockSystemData = {
  id: 1,
  systemName: "Financial Management System",
  description: "Enterprise financial management and accounting system",
  riskLevel: "moderate",
  currentStep: "categorize", 
  progress: 25,
  lastUpdated: "2025-01-15",
  systemType: "information_system",
  operationalStatus: "operational",
  categorization: {
    confidentialityImpact: "moderate",
    integrityImpact: "high", 
    availabilityImpact: "moderate",
    securityCategory: "MODERATE",
    reasoning: "Based on financial data sensitivity and business criticality"
  },
  rmfSteps: [
    {
      step: 1,
      name: "Categorize",
      status: "completed",
      description: "System categorization based on impact levels",
      completedDate: "2025-01-10"
    },
    {
      step: 2, 
      name: "Select Controls",
      status: "in_progress",
      description: "Selection of security controls based on baseline",
      startedDate: "2025-01-12"
    },
    {
      step: 3,
      name: "Implement",
      status: "pending",
      description: "Implementation of selected security controls"
    },
    {
      step: 4,
      name: "Assess",
      status: "pending", 
      description: "Assessment of implemented controls"
    },
    {
      step: 5,
      name: "Authorize",
      status: "pending",
      description: "Authorization to operate decision"
    },
    {
      step: 6,
      name: "Monitor",
      status: "pending",
      description: "Continuous monitoring of controls"
    }
  ],
  artifacts: [
    {
      name: "System Security Plan (SSP)",
      status: "draft",
      lastModified: "2025-01-14"
    },
    {
      name: "Security Control Assessment",
      status: "not_started", 
      lastModified: null
    },
    {
      name: "Authorization Package",
      status: "not_started",
      lastModified: null
    }
  ]
};

export const SystemDetails = ({ systemId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
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

  const getStepStatusClass = (status) => {
    const classes = {
      completed: 'text-success',
      in_progress: 'text-primary',
      pending: 'text-muted'
    };
    return classes[status] || 'text-muted';
  };

  const getStepIcon = (status) => {
    const icons = {
      completed: 'bi-check-circle-fill',
      in_progress: 'bi-arrow-clockwise',
      pending: 'bi-circle'
    };
    return icons[status] || 'bi-circle';
  };

  const getArtifactStatusBadge = (status) => {
    const classes = {
      completed: 'badge bg-success',
      draft: 'badge bg-warning text-dark',
      in_progress: 'badge bg-primary',
      not_started: 'badge bg-secondary'
    };
    return classes[status] || 'badge bg-secondary';
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="#" className="text-decoration-none">RMF Dashboard</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                System Details
              </li>
            </ol>
          </nav>
          
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h1 className="h3 mb-2">{mockSystemData.systemName}</h1>
              <p className="text-muted mb-2">{mockSystemData.description}</p>
              <div className="d-flex align-items-center gap-3">
                <span className={getRiskBadgeClass(mockSystemData.riskLevel)}>
                  {mockSystemData.riskLevel.replace('_', ' ').toUpperCase()} RISK
                </span>
                <span className="badge bg-light text-dark">
                  {mockSystemData.operationalStatus.toUpperCase()}
                </span>
                <small className="text-muted">
                  Last updated: {new Date(mockSystemData.lastUpdated).toLocaleDateString()}
                </small>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary">
                <i className="bi bi-pencil me-2"></i>
                Edit System
              </button>
              <button className="btn btn-primary">
                <i className="bi bi-download me-2"></i>
                Export SSP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">RMF Process Progress</h5>
                <span className="text-muted">Step {mockSystemData.rmfSteps.findIndex(s => s.status === 'in_progress') + 1} of 6</span>
              </div>
              <div className="progress mb-3" style={{height: '8px'}}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{width: `${mockSystemData.progress}%`}}
                  aria-valuenow={mockSystemData.progress}
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
              <small className="text-muted">{mockSystemData.progress}% Complete</small>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="row">
        <div className="col-12">
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="bi bi-info-circle me-2"></i>
                Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'process' ? 'active' : ''}`}
                onClick={() => setActiveTab('process')}
              >
                <i className="bi bi-list-ol me-2"></i>
                RMF Process
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'categorization' ? 'active' : ''}`}
                onClick={() => setActiveTab('categorization')}
              >
                <i className="bi bi-tag me-2"></i>
                Categorization
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'artifacts' ? 'active' : ''}`}
                onClick={() => setActiveTab('artifacts')}
              >
                <i className="bi bi-file-text me-2"></i>
                Artifacts
              </button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="row">
                <div className="col-md-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">System Information</h6>
                    </div>
                    <div className="card-body">
                      <div className="row mb-3">
                        <div className="col-sm-4"><strong>System Type:</strong></div>
                        <div className="col-sm-8">{mockSystemData.systemType.replace('_', ' ')}</div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-sm-4"><strong>Risk Level:</strong></div>
                        <div className="col-sm-8">
                          <span className={getRiskBadgeClass(mockSystemData.riskLevel)}>
                            {mockSystemData.riskLevel.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="row mb-3">
                        <div className="col-sm-4"><strong>Current Step:</strong></div>
                        <div className="col-sm-8">{mockSystemData.currentStep}</div>
                      </div>
                      <div className="row">
                        <div className="col-sm-4"><strong>Status:</strong></div>
                        <div className="col-sm-8">{mockSystemData.operationalStatus}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-4">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">Quick Actions</h6>
                    </div>
                    <div className="card-body">
                      <div className="d-grid gap-2">
                        <button className="btn btn-outline-primary">
                          <i className="bi bi-arrow-right me-2"></i>
                          Continue RMF Process
                        </button>
                        <button className="btn btn-outline-secondary">
                          <i className="bi bi-file-earmark-text me-2"></i>
                          Generate Documentation
                        </button>
                        <button className="btn btn-outline-info">
                          <i className="bi bi-robot me-2"></i>
                          Run AI Analysis
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Process Tab */}
            {activeTab === 'process' && (
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">RMF Process Steps</h6>
                </div>
                <div className="card-body">
                  {mockSystemData.rmfSteps.map((step, index) => (
                    <div key={step.step} className="d-flex align-items-start mb-4">
                      <div className="flex-shrink-0 me-3">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${getStepStatusClass(step.status)}`} 
                             style={{width: '40px', height: '40px', border: '2px solid'}}>
                          <i className={`bi ${getStepIcon(step.status)}`}></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">Step {step.step}: {step.name}</h6>
                            <p className="text-muted mb-1">{step.description}</p>
                            {step.completedDate && (
                              <small className="text-success">Completed: {new Date(step.completedDate).toLocaleDateString()}</small>
                            )}
                            {step.startedDate && step.status === 'in_progress' && (
                              <small className="text-primary">Started: {new Date(step.startedDate).toLocaleDateString()}</small>
                            )}
                          </div>
                          <span className={`badge ${step.status === 'completed' ? 'bg-success' : step.status === 'in_progress' ? 'bg-primary' : 'bg-secondary'}`}>
                            {step.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorization Tab */}
            {activeTab === 'categorization' && (
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">System Categorization</h6>
                </div>
                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6>Impact Levels</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <tbody>
                            <tr>
                              <td><strong>Confidentiality:</strong></td>
                              <td>
                                <span className="badge bg-warning text-dark">
                                  {mockSystemData.categorization.confidentialityImpact.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Integrity:</strong></td>
                              <td>
                                <span className="badge bg-danger">
                                  {mockSystemData.categorization.integrityImpact.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td><strong>Availability:</strong></td>
                              <td>
                                <span className="badge bg-warning text-dark">
                                  {mockSystemData.categorization.availabilityImpact.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h6>Overall Category</h6>
                      <div className="text-center p-3 border rounded">
                        <h3 className="text-warning">{mockSystemData.categorization.securityCategory}</h3>
                        <p className="text-muted mb-0">Security Category</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="alert alert-info">
                    <h6 className="alert-heading">AI Categorization Reasoning</h6>
                    <p className="mb-0">{mockSystemData.categorization.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Artifacts Tab */}
            {activeTab === 'artifacts' && (
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">System Artifacts & Documentation</h6>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Document</th>
                          <th>Status</th>
                          <th>Last Modified</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockSystemData.artifacts.map((artifact, index) => (
                          <tr key={index}>
                            <td>
                              <i className="bi bi-file-text me-2"></i>
                              {artifact.name}
                            </td>
                            <td>
                              <span className={getArtifactStatusBadge(artifact.status)}>
                                {artifact.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              {artifact.lastModified ? 
                                new Date(artifact.lastModified).toLocaleDateString() : 
                                'Not started'
                              }
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-primary">
                                  <i className="bi bi-eye"></i>
                                </button>
                                <button className="btn btn-outline-secondary">
                                  <i className="bi bi-download"></i>
                                </button>
                                <button className="btn btn-outline-success">
                                  <i className="bi bi-pencil"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemDetails;