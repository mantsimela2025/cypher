import React, { useState } from 'react';

export const SystemsNew = () => {
  const [formData, setFormData] = useState({
    systemName: '',
    description: '',
    systemType: '',
    operationalStatus: '',
    owner: '',
    environment: '',
    dataTypes: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDataTypeChange = (dataType) => {
    setFormData(prev => ({
      ...prev,
      dataTypes: prev.dataTypes.includes(dataType)
        ? prev.dataTypes.filter(type => type !== dataType)
        : [...prev.dataTypes, dataType]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // API call would go here
      console.log('Submitting new system:', formData);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Redirect to categorization wizard or dashboard
      alert('System created successfully!');
    } catch (error) {
      console.error('Error creating system:', error);
      alert('Error creating system. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dataTypeOptions = [
    { value: 'financial', label: 'Financial Data' },
    { value: 'pii', label: 'Personally Identifiable Information (PII)' },
    { value: 'phi', label: 'Protected Health Information (PHI)' },
    { value: 'intellectual_property', label: 'Intellectual Property' },
    { value: 'classified', label: 'Classified Information' },
    { value: 'public', label: 'Public Information' }
  ];

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="mb-4">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item">
                  <a href="#" className="text-decoration-none">RMF Dashboard</a>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Add New System
                </li>
              </ol>
            </nav>
            
            <h1 className="h3 mb-2">Add New System to RMF Process</h1>
            <p className="text-muted">
              Provide basic information about your system to begin the Risk Management Framework process.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-plus-circle me-2"></i>
                System Information
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="text-primary mb-3">Basic Information</h6>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label htmlFor="systemName" className="form-label">
                      System Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="systemName"
                      name="systemName"
                      value={formData.systemName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter system name"
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="owner" className="form-label">
                      System Owner <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="owner"
                      name="owner"
                      value={formData.owner}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter system owner"
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label htmlFor="description" className="form-label">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      placeholder="Provide a detailed description of the system's purpose and functionality"
                    ></textarea>
                  </div>
                </div>

                {/* System Classification */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="text-primary mb-3">System Classification</h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="systemType" className="form-label">
                      System Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="systemType"
                      name="systemType"
                      value={formData.systemType}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select system type</option>
                      <option value="information_system">Information System</option>
                      <option value="platform_system">Platform System</option>
                      <option value="infrastructure_system">Infrastructure System</option>
                      <option value="cloud_service">Cloud Service</option>
                      <option value="web_application">Web Application</option>
                      <option value="database_system">Database System</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="operationalStatus" className="form-label">
                      Operational Status <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="operationalStatus"
                      name="operationalStatus"
                      value={formData.operationalStatus}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select operational status</option>
                      <option value="operational">Operational</option>
                      <option value="under_development">Under Development</option>
                      <option value="testing">Testing</option>
                      <option value="planned">Planned</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="environment" className="form-label">
                      Environment <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      id="environment"
                      name="environment"
                      value={formData.environment}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select environment</option>
                      <option value="production">Production</option>
                      <option value="staging">Staging</option>
                      <option value="development">Development</option>
                      <option value="testing">Testing</option>
                    </select>
                  </div>
                </div>

                {/* Data Classification */}
                <div className="row mb-4">
                  <div className="col-12">
                    <h6 className="text-primary mb-3">Data Classification</h6>
                    <p className="text-muted small mb-3">
                      Select all types of data that this system processes, stores, or transmits.
                    </p>
                  </div>

                  <div className="col-12">
                    {dataTypeOptions.map((option) => (
                      <div key={option.value} className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={option.value}
                          checked={formData.dataTypes.includes(option.value)}
                          onChange={() => handleDataTypeChange(option.value)}
                        />
                        <label className="form-check-label" htmlFor={option.value}>
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Enhancement Notice */}
                <div className="alert alert-info mb-4">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-robot me-2 mt-1"></i>
                    <div>
                      <h6 className="alert-heading mb-1">AI-Powered Analysis</h6>
                      <p className="mb-0 small">
                        Our AI will analyze the provided information to suggest initial security categorization 
                        and recommend appropriate security controls based on NIST 800-53 guidelines.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary">
                    <i className="bi bi-arrow-left me-2"></i>
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        Creating System...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-arrow-right me-2"></i>
                        Create System & Start Categorization
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Help Card */}
          <div className="card mt-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="bi bi-question-circle me-2"></i>
                Need Help?
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>System Types</h6>
                  <ul className="list-unstyled small text-muted">
                    <li><strong>Information System:</strong> General business applications</li>
                    <li><strong>Platform System:</strong> Infrastructure platforms</li>
                    <li><strong>Cloud Service:</strong> Cloud-based services</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Data Classification</h6>
                  <ul className="list-unstyled small text-muted">
                    <li><strong>PII:</strong> Personal identifiable information</li>
                    <li><strong>PHI:</strong> Protected health information</li>
                    <li><strong>Financial:</strong> Financial and payment data</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemsNew;