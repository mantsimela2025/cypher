import React, { useState, useEffect } from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { Icon } from "@/components/Component";
import SlideOutPanel from "@/components/partials/SlideOutPanel";
import { systemsApi } from "@/utils/systemsApi";
import { toast } from "react-toastify";

const SystemDetailsPanel = ({ isOpen, onClose, systemId, systemData }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [detailedSystemData, setDetailedSystemData] = useState(null);
  const [assets, setAssets] = useState([]);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [compliance, setCompliance] = useState(null);

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  // Fetch detailed system data when panel opens
  useEffect(() => {
    if (isOpen && systemId) {
      fetchSystemDetails();
    }
  }, [isOpen, systemId]);

  const fetchSystemDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching system details for ID:', systemId);
      console.log('System data passed:', systemData);

      // Fetch detailed system data
      try {
        const systemDetails = await systemsApi.getSystemById(systemId, 'assets,vulnerabilities,compliance');
        console.log('System details response:', systemDetails);
        setDetailedSystemData(systemDetails.data);
      } catch (error) {
        console.error('Error fetching system details:', error);
        // Use the passed system data as fallback
        setDetailedSystemData(systemData);
      }

      // Fetch related data based on active tab
      if (activeTab === "assets" || activeTab === "overview") {
        try {
          const assetsData = await systemsApi.getSystemAssets(systemId);
          console.log('Assets data response:', assetsData);
          setAssets(assetsData.data || []);
        } catch (error) {
          console.error('Error fetching assets:', error);
          setAssets([]);
        }
      }

      if (activeTab === "vulnerabilities" || activeTab === "overview") {
        try {
          const vulnData = await systemsApi.getSystemVulnerabilities(systemId);
          console.log('Vulnerabilities data response:', vulnData);
          setVulnerabilities(vulnData.data || []);
        } catch (error) {
          console.error('Error fetching vulnerabilities:', error);
          setVulnerabilities([]);
        }
      }

      if (activeTab === "compliance" || activeTab === "overview") {
        try {
          const complianceData = await systemsApi.getSystemCompliance(systemId);
          console.log('Compliance data response:', complianceData);
          setCompliance(complianceData.data);
        } catch (error) {
          console.error('Error fetching compliance:', error);
          setCompliance(null);
        }
      }
    } catch (error) {
      console.error('Error in fetchSystemDetails:', error);
      toast.error(`Failed to load system details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (isOpen && systemId && detailedSystemData) {
      if (activeTab === "assets" && assets.length === 0) {
        fetchAssets();
      } else if (activeTab === "vulnerabilities" && vulnerabilities.length === 0) {
        fetchVulnerabilities();
      } else if (activeTab === "compliance" && !compliance) {
        fetchCompliance();
      }
    }
  }, [activeTab, isOpen, systemId]);

  const fetchAssets = async () => {
    try {
      const assetsData = await systemsApi.getSystemAssets(systemId);
      setAssets(assetsData.data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load system assets');
    }
  };

  const fetchVulnerabilities = async () => {
    try {
      const vulnData = await systemsApi.getSystemVulnerabilities(systemId);
      setVulnerabilities(vulnData.data || []);
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error);
      toast.error('Failed to load system vulnerabilities');
    }
  };

  const fetchCompliance = async () => {
    try {
      const complianceData = await systemsApi.getSystemCompliance(systemId);
      setCompliance(complianceData.data);
    } catch (error) {
      console.error('Error fetching compliance:', error);
      toast.error('Failed to load compliance data');
    }
  };

  const system = detailedSystemData || systemData;

  if (!system) return null;

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'badge-success';
      case 'inactive': return 'badge-secondary';
      case 'maintenance': return 'badge-warning';
      case 'decommissioned': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'badge-success';
      case 'medium': return 'badge-warning';
      case 'high': return 'badge-danger';
      case 'critical': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <SlideOutPanel
      isOpen={isOpen}
      onClose={onClose}
      title={`System Details - ${system.name || 'Unknown System'}`}
      width="1200px"
    >
      <div className="p-4">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* System Header Info */}
            <div className="card card-bordered mb-4">
              <div className="card-inner">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <Icon name="server" className="me-2" style={{ fontSize: '1.5rem' }} />
                    <div>
                      <h5 className="mb-1">{system.name}</h5>
                      <span className="text-muted">{system.system_id}</span>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <span className={`badge ${getStatusBadgeClass(system.status)}`}>
                      {system.status}
                    </span>
                    <span className={`badge ${getRiskBadgeClass(system.risk_level)}`}>
                      {system.risk_level} Risk
                    </span>
                  </div>
                </div>
                
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="text-muted small">Type</div>
                    <div className="fw-medium">{system.type || 'N/A'}</div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-muted small">Environment</div>
                    <div className="fw-medium">{system.environment || 'N/A'}</div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-muted small">Classification</div>
                    <div className="fw-medium">{system.classification || 'N/A'}</div>
                  </div>
                  <div className="col-md-3">
                    <div className="text-muted small">Owner</div>
                    <div className="fw-medium">{system.owner || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <Nav tabs className="nav-tabs-mb-icon nav-tabs-card mb-4">
              <NavItem>
                <NavLink
                  href="#tab"
                  className={activeTab === "overview" ? "active" : ""}
                  onClick={(ev) => {
                    ev.preventDefault();
                    toggleTab("overview");
                  }}
                >
                  <Icon name="dashboard" />
                  <span>Overview</span>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  href="#tab"
                  className={activeTab === "assets" ? "active" : ""}
                  onClick={(ev) => {
                    ev.preventDefault();
                    toggleTab("assets");
                  }}
                >
                  <Icon name="server" />
                  <span>Assets</span>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  href="#tab"
                  className={activeTab === "vulnerabilities" ? "active" : ""}
                  onClick={(ev) => {
                    ev.preventDefault();
                    toggleTab("vulnerabilities");
                  }}
                >
                  <Icon name="shield-alert" />
                  <span>Vulnerabilities</span>
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  href="#tab"
                  className={activeTab === "compliance" ? "active" : ""}
                  onClick={(ev) => {
                    ev.preventDefault();
                    toggleTab("compliance");
                  }}
                >
                  <Icon name="check-circle" />
                  <span>Compliance</span>
                </NavLink>
              </NavItem>
            </Nav>

            {/* Tab Content */}
            <TabContent activeTab={activeTab}>
              <TabPane tabId="overview">
                <OverviewTab system={system} assets={assets} vulnerabilities={vulnerabilities} />
              </TabPane>
              <TabPane tabId="assets">
                <AssetsTab assets={assets} loading={loading} />
              </TabPane>
              <TabPane tabId="vulnerabilities">
                <VulnerabilitiesTab vulnerabilities={vulnerabilities} loading={loading} />
              </TabPane>
              <TabPane tabId="compliance">
                <ComplianceTab compliance={compliance} loading={loading} />
              </TabPane>
            </TabContent>
          </>
        )}
      </div>
    </SlideOutPanel>
  );
};

// Overview Tab Component
const OverviewTab = ({ system, assets, vulnerabilities }) => (
  <div className="row g-4">
    <div className="col-md-6">
      <div className="card card-bordered h-100">
        <div className="card-inner">
          <h6 className="card-title">System Information</h6>
          <div className="row g-3">
            <div className="col-12">
              <div className="form-group">
                <label className="form-label">Description</label>
                <div className="form-control-plaintext">{system.description || 'No description available'}</div>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Created Date</label>
                <div className="form-control-plaintext">
                  {system.created_at ? new Date(system.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label className="form-label">Last Updated</label>
                <div className="form-control-plaintext">
                  {system.updated_at ? new Date(system.updated_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="col-md-6">
      <div className="card card-bordered h-100">
        <div className="card-inner">
          <h6 className="card-title">Quick Stats</h6>
          <div className="row g-3">
            <div className="col-6">
              <div className="text-center">
                <div className="amount">{assets?.length || 0}</div>
                <div className="amount-sm">Assets</div>
              </div>
            </div>
            <div className="col-6">
              <div className="text-center">
                <div className="amount">{vulnerabilities?.length || 0}</div>
                <div className="amount-sm">Vulnerabilities</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Assets Tab Component
const AssetsTab = ({ assets, loading }) => (
  <div className="card card-bordered">
    <div className="card-inner">
      <h6 className="card-title">System Assets</h6>
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : assets && assets.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Type</th>
                <th>IP Address</th>
                <th>Status</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, index) => (
                <tr key={asset.asset_uuid || index}>
                  <td>{asset.asset_name || 'N/A'}</td>
                  <td>{asset.asset_type || 'N/A'}</td>
                  <td>{asset.ipv4_address || asset.ipv6_address || 'N/A'}</td>
                  <td>
                    <span className={`badge ${asset.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                      {asset.status || 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getRiskBadgeClass(asset.risk_level)}`}>
                      {asset.risk_level || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-muted">
          <Icon name="server" style={{ fontSize: '2rem', opacity: 0.3 }} />
          <p className="mt-2">No assets found for this system</p>
        </div>
      )}
    </div>
  </div>
);

// Vulnerabilities Tab Component
const VulnerabilitiesTab = ({ vulnerabilities, loading }) => (
  <div className="card card-bordered">
    <div className="card-inner">
      <h6 className="card-title">System Vulnerabilities</h6>
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : vulnerabilities && vulnerabilities.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Vulnerability</th>
                <th>Severity</th>
                <th>CVE ID</th>
                <th>Status</th>
                <th>First Seen</th>
              </tr>
            </thead>
            <tbody>
              {vulnerabilities.map((vuln, index) => (
                <tr key={vuln.vulnerability_id || index}>
                  <td>{vuln.plugin_name || vuln.name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${getSeverityBadgeClass(vuln.severity)}`}>
                      {vuln.severityName || getSeverityName(vuln.severity) || 'N/A'}
                    </span>
                  </td>
                  <td>{vuln.cve_id || 'N/A'}</td>
                  <td>
                    <span className={`badge ${vuln.status === 'open' ? 'badge-danger' : 'badge-success'}`}>
                      {vuln.status || 'Unknown'}
                    </span>
                  </td>
                  <td>{vuln.first_seen ? new Date(vuln.first_seen).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-muted">
          <Icon name="shield-check" style={{ fontSize: '2rem', opacity: 0.3 }} />
          <p className="mt-2">No vulnerabilities found for this system</p>
        </div>
      )}
    </div>
  </div>
);

// Compliance Tab Component
const ComplianceTab = ({ compliance, loading }) => (
  <div className="card card-bordered">
    <div className="card-inner">
      <h6 className="card-title">Compliance Status</h6>
      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : compliance ? (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card card-bordered">
              <div className="card-inner text-center">
                <div className="amount">{compliance.overall_score || 0}%</div>
                <div className="amount-sm">Overall Compliance</div>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card card-bordered">
              <div className="card-inner text-center">
                <div className="amount">{compliance.controls_passed || 0}/{compliance.total_controls || 0}</div>
                <div className="amount-sm">Controls Passed</div>
              </div>
            </div>
          </div>
          {compliance.frameworks && (
            <div className="col-12">
              <h6>Framework Compliance</h6>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Framework</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Last Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compliance.frameworks.map((framework, index) => (
                      <tr key={framework.name || index}>
                        <td>{framework.name}</td>
                        <td>{framework.score}%</td>
                        <td>
                          <span className={`badge ${framework.score >= 80 ? 'badge-success' : framework.score >= 60 ? 'badge-warning' : 'badge-danger'}`}>
                            {framework.score >= 80 ? 'Compliant' : framework.score >= 60 ? 'Partial' : 'Non-Compliant'}
                          </span>
                        </td>
                        <td>{framework.last_assessment ? new Date(framework.last_assessment).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4 text-muted">
          <Icon name="check-circle" style={{ fontSize: '2rem', opacity: 0.3 }} />
          <p className="mt-2">No compliance data available for this system</p>
        </div>
      )}
    </div>
  </div>
);

// Helper function for severity badge classes
const getSeverityBadgeClass = (severity) => {
  // Handle both string and numeric severity values
  const severityStr = typeof severity === 'string' ? severity.toLowerCase() :
                     typeof severity === 'number' ? getSeverityName(severity).toLowerCase() :
                     String(severity || '').toLowerCase();

  switch (severityStr) {
    case 'critical': return 'badge-danger';
    case 'high': return 'badge-danger';
    case 'medium': return 'badge-warning';
    case 'low': return 'badge-info';
    case 'info': return 'badge-secondary';
    default: return 'badge-secondary';
  }
};

// Helper function to convert numeric severity to string
const getSeverityName = (severity) => {
  switch (severity) {
    case 4: return 'Critical';
    case 3: return 'High';
    case 2: return 'Medium';
    case 1: return 'Low';
    case 0: return 'Info';
    default: return 'Unknown';
  }
};

// Helper function for risk badge classes (moved outside component to be accessible)
const getRiskBadgeClass = (risk) => {
  switch (risk?.toLowerCase()) {
    case 'low': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'high': return 'badge-danger';
    case 'critical': return 'badge-danger';
    default: return 'badge-secondary';
  }
};

export default SystemDetailsPanel;
