import React, { useState, useEffect } from "react";
import { Badge, Button } from "reactstrap";
import { Icon } from "../../../components/Component";
import { apiClient } from "../../../utils/apiClient";

const CVEDetailsPanel = ({ isOpen, onClose, cveId }) => {
  const [cveData, setCveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && cveId) {
      fetchCVEData();
    }
  }, [isOpen, cveId]);

  const fetchCVEData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching CVE data for: ${cveId}`);
      const response = await apiClient.get(`/cves/${cveId}`);
      
      if (response.success) {
        console.log(`📊 SUCCESS: Received CVE data for ${cveId}`);
        setCveData(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch CVE data');
      }
    } catch (err) {
      console.error('❌ Error fetching CVE data:', err);
      
      // ✅ CORRECT: Handle different error types
      if (err.message.includes('status: 401')) {
        setError('Authentication required. Please log in.');
      } else if (err.message.includes('status: 403')) {
        setError('Access denied. Insufficient permissions.');
      } else if (err.message.includes('status: 404')) {
        setError(`CVE ${cveId} not found in database.`);
      } else if (err.message.includes('status: 500')) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (error) {
      return dateString;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`modal-backdrop ${isOpen ? 'show' : ''}`} 
        style={{ 
          display: isOpen ? 'block' : 'none',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1040
        }}
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div 
        className={`cve-details-panel ${isOpen ? 'show' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '800px',
          maxWidth: '90vw',
          backgroundColor: 'white',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
          zIndex: 1050,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-in-out',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Header */}
        <div className="card-inner border-bottom" style={{ padding: '1.5rem' }}>
          <div className="d-flex justify-content-between align-items-start">
            <div className="flex-grow-1">
              <h4 className="mb-2" style={{ color: '#007bff' }}>
                {loading ? 'Loading CVE...' : error ? 'Error Loading CVE' : cveId || 'CVE Details'}
              </h4>
              <p className="text-muted mb-0">
                CVE Details from the National Vulnerability Database
              </p>
            </div>
            <Button 
              color="light" 
              size="sm" 
              className="btn-icon"
              onClick={onClose}
            >
              <Icon name="cross" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="card-inner" style={{ padding: '1.5rem', minHeight: '400px' }}>
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border spinner-border-sm me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              Loading CVE details from NVD...
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              <h6 className="alert-heading">Error Loading CVE</h6>
              <p className="mb-0">{error}</p>
            </div>
          )}

          {cveData && (
            <div className="cve-content">
              {/* Description */}
              <div className="mb-4">
                <h6>Description</h6>
                <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
                  {cveData.description}
                </p>
              </div>

              {/* CVSS Score */}
              <div className="mb-4">
                <h6>CVSS Score</h6>
                <div className="d-flex align-items-center gap-3 mb-2">
                  <Badge color={getSeverityColor(cveData.severity)} className="p-1" style={{ fontSize: '0.5rem' }}>
                    {cveData.severity?.toUpperCase()} - {cveData.cvssScore || 'N/A'}
                  </Badge>
                  {cveData.cvss3 && (
                    <>
                      <span><strong>Exploitability:</strong> {cveData.cvss3.exploitabilityScore || '3.9'}</span>
                      <span><strong>Impact:</strong> {cveData.cvss3.impactScore || '3.4'}</span>
                    </>
                  )}
                </div>
                
                {(cveData.cvss3?.vectorString || cveData.cvss2?.vectorString) && (
                  <div className="mt-2">
                    <code className="p-2 bg-light rounded d-block">
                      {cveData.cvss3?.vectorString || cveData.cvss2?.vectorString}
                    </code>
                  </div>
                )}
              </div>

              {/* References */}
              {cveData.references && cveData.references.length > 0 && (
                <div className="mb-4">
                  <h6>References</h6>
                  <div className="row">
                    {cveData.references.map((ref, index) => (
                      <div key={index} className="col-md-6 mb-2">
                        <a 
                          href={ref.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="d-flex align-items-center text-decoration-none p-2 border rounded hover-bg-light"
                        >
                          <Icon name="external" className="me-2" />
                          <span className="text-truncate">{ref.name || new URL(ref.url).hostname}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses (CWEs) */}
              {cveData.cwes && cveData.cwes.length > 0 && (
                <div className="mb-4">
                  <h6>Weaknesses (CWEs)</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {cveData.cwes.map((cwe, index) => (
                      <Badge key={index} color="light" className="border">
                        {cwe.cweId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Published & Modified Dates */}
              <div className="mb-4">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Published</h6>
                    <div className="d-flex align-items-center">
                      <Icon name="calendar" className="me-2" />
                      <span>{formatDate(cveData.publishedDate)}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6>Last Modified</h6>
                    <div className="d-flex align-items-center">
                      <Icon name="clock" className="me-2" />
                      <span>{formatDate(cveData.lastModifiedDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="card-inner border-top mt-auto" style={{ padding: '1rem 1.5rem' }}>
          <div className="d-flex justify-content-between">
            <Button color="light" onClick={onClose}>
              Close
            </Button>
            <div className="d-flex gap-2">
              {cveData && (
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${cveId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '12px 16px', minHeight: '48px', display: 'flex', alignItems: 'center' }}
                >
                  <Icon name="external" className="me-1" />
                  View on NVD
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CVEDetailsPanel;