import React, { useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { log } from "@/utils/config";

// API utility for AWS integration
async function generateAwsRecommendation(requirements) {
  try {
    log.api('Generating AWS recommendation');
    return await apiClient.post('/aws/recommendation', requirements);
  } catch (error) {
    log.error('Failed to generate AWS recommendation:', error.message);
    throw new Error('Failed to generate recommendation');
  }
}

async function deployAwsInfrastructure(recommendation) {
  try {
    log.api('Deploying AWS infrastructure');
    return await apiClient.post('/aws/deploy', { recommendation });
  } catch (error) {
    log.error('Failed to deploy AWS infrastructure:', error.message);
    throw new Error('Failed to deploy infrastructure');
  }
}

async function getDeploymentProgress(deploymentId) {
  try {
    log.api('Getting deployment progress for:', deploymentId);
    return await apiClient.get(`/aws/deployments/${deploymentId}/progress`);
  } catch (error) {
    log.error('Failed to get deployment progress:', error.message);
    throw new Error('Failed to get deployment progress');
  }
}

// Dashboard Tab Component
function AwsDashboardTab() {
  const [requirements, setRequirements] = useState({
    systemType: 'web-application',
    workloadSize: 'medium',
    complianceLevel: 'basic',
    highAvailability: true,
    budgetRange: 'balanced',
    dataClassification: 'internal',
    estimatedUsers: 100,
    expectedTraffic: 'medium',
    region: 'us-east-1',
  });
  const [recommendation, setRecommendation] = useState(null);
  const [deploying, setDeploying] = useState(false);
  const [deploymentId, setDeploymentId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRequirements((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const rec = await generateAwsRecommendation(requirements);
      setRecommendation(rec);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setError(null);
    try {
      const result = await deployAwsInfrastructure(recommendation);
      setDeploymentId(result.deploymentId);
      pollProgress(result.deploymentId);
    } catch (err) {
      setError(err.message);
      setDeploying(false);
    }
  };

  const pollProgress = async (id) => {
    let done = false;
    while (!done) {
      try {
        const prog = await getDeploymentProgress(id);
        setProgress(prog);
        if (prog.status === 'completed' || prog.status === 'failed') done = true;
        else await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        setError(err.message);
        done = true;
      }
    }
    setDeploying(false);
  };

  return (
    <div>
      <form className="card card-body mb-4" onSubmit={handleGenerate}>
        <h5 className="mb-3">AWS System Requirements</h5>
        <div className="row g-3">
          <div className="col-md-3">
            <label className="form-label">System Type</label>
            <select className="form-select" name="systemType" value={requirements.systemType} onChange={handleChange}>
              <option value="web-application">Web Application</option>
              <option value="database">Database</option>
              <option value="microservices">Microservices</option>
              <option value="analytics">Analytics</option>
              <option value="ml-pipeline">ML Pipeline</option>
              <option value="compliance-workload">Compliance Workload</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Workload Size</label>
            <select className="form-select" name="workloadSize" value={requirements.workloadSize} onChange={handleChange}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Compliance</label>
            <select className="form-select" name="complianceLevel" value={requirements.complianceLevel} onChange={handleChange}>
              <option value="basic">Basic</option>
              <option value="hipaa">HIPAA</option>
              <option value="fedramp-low">FedRAMP Low</option>
              <option value="fedramp-moderate">FedRAMP Moderate</option>
              <option value="fedramp-high">FedRAMP High</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Budget</label>
            <select className="form-select" name="budgetRange" value={requirements.budgetRange} onChange={handleChange}>
              <option value="cost-optimized">Cost Optimized</option>
              <option value="balanced">Balanced</option>
              <option value="performance-optimized">Performance Optimized</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label">Region</label>
            <input className="form-control" name="region" value={requirements.region} onChange={handleChange} />
          </div>
          <div className="col-md-1 d-flex align-items-end">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" name="highAvailability" checked={requirements.highAvailability} onChange={handleChange} id="highAvailability" />
              <label className="form-check-label" htmlFor="highAvailability">HA</label>
            </div>
          </div>
        </div>
        <div className="row g-3 mt-2">
          <div className="col-md-3">
            <label className="form-label">Data Classification</label>
            <select className="form-select" name="dataClassification" value={requirements.dataClassification} onChange={handleChange}>
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Estimated Users</label>
            <input className="form-control" type="number" name="estimatedUsers" value={requirements.estimatedUsers} onChange={handleChange} />
          </div>
          <div className="col-md-3">
            <label className="form-label">Expected Traffic</label>
            <select className="form-select" name="expectedTraffic" value={requirements.expectedTraffic} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="variable">Variable</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-primary w-100" type="submit" disabled={loading}>Generate Recommendation</button>
          </div>
        </div>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </form>
      {loading && <div className="text-center my-3"><span className="spinner-border" /></div>}
      {recommendation && (
        <div className="card card-body mb-4">
          <h5 className="mb-3">AWS Infrastructure Recommendation</h5>
          <div className="row mb-2">
            <div className="col-md-4">
              <strong>System Type:</strong> {recommendation.systemType}<br />
              <strong>Estimated Monthly Cost:</strong> ${recommendation.estimatedMonthlyCost}
            </div>
            <div className="col-md-8">
              <strong>Compliance Features:</strong> {recommendation.complianceFeatures?.join(', ')}
            </div>
          </div>
          <div className="mb-2">
            <strong>Scaling Strategy:</strong> {recommendation.scalingStrategy}<br />
            <strong>Backup Strategy:</strong> {recommendation.backupStrategy}
          </div>
          <div className="mb-2">
            <strong>Security Controls:</strong> {recommendation.securityControls?.join(', ')}
          </div>
          <div className="mb-2">
            <strong>Deployment Steps:</strong>
            <ol>
              {recommendation.deploymentSteps?.map((step, idx) => (
                <li key={idx}>{step.service} - {step.action} ({step.estimatedTime})</li>
              ))}
            </ol>
          </div>
          <button className="btn btn-success" onClick={handleDeploy} disabled={deploying}>Deploy Infrastructure</button>
        </div>
      )}
      {deploying && (
        <div className="card card-body mb-4">
          <h5>Deployment Progress</h5>
          {progress ? (
            <ul>
              {progress.steps?.map((step, idx) => (
                <li key={idx}>
                  Step {step.stepId}: {step.status} {step.result && <span>- {JSON.stringify(step.result)}</span>}
                  {step.error && <span className="text-danger"> - {step.error}</span>}
                </li>
              ))}
            </ul>
          ) : <span>Deploying...</span>}
        </div>
      )}
    </div>
  );
}

import Content from "@/layout/content/Content";
import Head from "@/layout/head/Head";
import {
  Block,
  BlockBetween,
  BlockDes,
  BlockHead,
  BlockHeadContent,
  BlockTitle,
} from "@/components/Component";

// Tabs component for navigation
const Tabs = ({ activeTab, setActiveTab }) => (
  <ul className="nav nav-tabs mb-4">
    <li className="nav-item">
      <button className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
        Dashboard
      </button>
    </li>
    <li className="nav-item">
      <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
        Settings
      </button>
    </li>
    <li className="nav-item">
      <button className={`nav-link ${activeTab === 'terminal' ? 'active' : ''}`} onClick={() => setActiveTab('terminal')}>
        AWS Terminal
      </button>
    </li>
  </ul>
);

// AWS Terminal Tab UI
const AWSTerminalTab = () => (
  <div className="card">
    <div className="card-body">
      <h5 className="mb-1"><i className="bi bi-terminal me-2"></i>AWS CLI Terminal</h5>
      <div className="text-muted mb-3">Execute AWS CLI commands directly from the web interface</div>
      <div className="bg-black text-success p-3 mb-3" style={{height: 200, fontFamily: 'monospace', fontSize: '1rem', borderRadius: '8px', overflowY: 'auto'}}>
        <div>Welcome to AWS CLI Terminal. Type 'help' for available commands.</div>
      </div>
      <div className="d-flex align-items-center gap-2">
        <span className="bg-black text-success px-2 py-1 rounded-start">$</span>
        <input className="form-control bg-black text-success border-0" style={{fontFamily: 'monospace'}} placeholder="Enter AWS CLI command..." />
        <button className="btn btn-primary" type="button">Execute</button>
      </div>
    </div>
  </div>
);

// AWS Credentials Form (Settings Tab)
const AWSCredentialsForm = () => (
  <form className="p-2">
    <h5 className="mb-1">AWS Credentials</h5>
    <div className="text-muted mb-4">Configure your AWS access credentials. These will be securely stored and used for all AWS service integrations.</div>
    <div className="row g-3 mb-3">
      <div className="col-md-6">
        <label className="form-label">AWS Access Key ID</label>
        <input className="form-control" value="AKIAxxxxxxxxxxxxxxxx" readOnly />
      </div>
      <div className="col-md-6">
        <label className="form-label">AWS Secret Access Key</label>
        <input className="form-control" type="password" value="••••••••••••••••••••••••••••••" readOnly />
      </div>
      <div className="col-md-6">
        <label className="form-label">AWS Region</label>
        <input className="form-control" value="us-east-1" readOnly />
        <div className="form-text">The default AWS region for your services. e.g. us-east-1, us-west-2</div>
      </div>
    </div>
    <div className="d-flex gap-2">
      <button className="btn btn-outline-secondary" type="button">Verify Credentials</button>
      <button className="btn btn-primary ms-auto" type="button">Save Credentials</button>
    </div>
  </form>
);

const AWSIntegration = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  return (
    <React.Fragment>
      <Head title="Admin - AWS Integration" />
      <Content>
        <BlockHead size="sm">
          <BlockBetween>
            <BlockHeadContent>
              <BlockTitle tag="h3" page>
                AWS Integration Dashboard
              </BlockTitle>
              <BlockDes className="text-soft">
                <p>Monitor your AWS services and track cloud costs in real time.</p>
              </BlockDes>
            </BlockHeadContent>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-light text-dark">Account: 1234-5678-9012</span>
              <span className="badge bg-light text-dark">Region: us-east-1</span>
              <button className="btn btn-outline-primary btn-sm">Refresh</button>
            </div>
          </BlockBetween>
        </BlockHead>
        <Block>
          {/* Tabs navigation */}
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-3">
            {activeTab === 'dashboard' && (
              <>
                <AwsDashboardTab /> {/* Dynamic dashboard with requirements form, recommendation, deploy */}
                <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="card-title">Total Monthly Cost</h6>
                  <h3 className="text-primary">$1,234.56</h3>
                  <span className="text-success small">▲ 5% from last month</span>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="card-title">Active Services</h6>
                  <h3>7</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="card-title">EC2 Instances Running</h6>
                  <h3>12</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center">
                <div className="card-body">
                  <h6 className="card-title">S3 Storage Used</h6>
                  <h3>2.5 TB</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Controls */}
          <div className="d-flex flex-wrap gap-2 mb-4 align-items-end">
            <div>
              <label className="form-label mb-0">Date Range</label>
              <select className="form-select form-select-sm">
                <option>This Month</option>
                <option>Last Month</option>
                <option>Custom</option>
              </select>
            </div>
            <div>
              <label className="form-label mb-0">Service</label>
              <select className="form-select form-select-sm">
                <option>All</option>
                <option>EC2</option>
                <option>S3</option>
                <option>RDS</option>
                <option>Lambda</option>
              </select>
            </div>
            <button className="btn btn-outline-secondary btn-sm ms-auto">Export CSV</button>
            <button className="btn btn-outline-primary btn-sm">Sync Now</button>
          </div>

          {/* Cost Over Time Chart Placeholder */}
          <div className="card mb-4">
            <div className="card-body">
              <h6 className="card-title">Cost Over Time</h6>
              <div className="bg-light d-flex align-items-center justify-content-center" style={{height: 200}}>
                <span className="text-muted">[Cost Chart Placeholder]</span>
              </div>
            </div>
          </div>

          {/* Service Cost Breakdown Table */}
          <div className="card mb-4">
            <div className="card-body">
              <h6 className="card-title">Service Cost Breakdown</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>This Month</th>
                      <th>Last Month</th>
                      <th>% Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>EC2</td>
                      <td>$500</td>
                      <td>$450</td>
                      <td className="text-success">+11%</td>
                    </tr>
                    <tr>
                      <td>S3</td>
                      <td>$200</td>
                      <td>$210</td>
                      <td className="text-danger">-5%</td>
                    </tr>
                    <tr>
                      <td>RDS</td>
                      <td>$300</td>
                      <td>$290</td>
                      <td className="text-success">+3%</td>
                    </tr>
                    <tr>
                      <td>Lambda</td>
                      <td>$50</td>
                      <td>$40</td>
                      <td className="text-success">+25%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Monitored Services Accordion */}
          <div className="accordion mb-4" id="awsServicesAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingEC2">
                <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseEC2">
                  EC2 Instances
                </button>
              </h2>
              <div id="collapseEC2" className="accordion-collapse collapse show">
                <div className="accordion-body">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Instance ID</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Region</th>
                        <th>Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>i-1234567890</td>
                        <td>WebServer-1</td>
                        <td><span className="badge bg-success">Running</span></td>
                        <td>t3.medium</td>
                        <td>us-east-1</td>
                        <td>$120</td>
                      </tr>
                      <tr>
                        <td>i-0987654321</td>
                        <td>DB-Primary</td>
                        <td><span className="badge bg-danger">Stopped</span></td>
                        <td>m5.large</td>
                        <td>us-east-1</td>
                        <td>$0</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingS3">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseS3">
                  S3 Buckets
                </button>
              </h2>
              <div id="collapseS3" className="accordion-collapse collapse">
                <div className="accordion-body">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Bucket Name</th>
                        <th>Region</th>
                        <th>Storage Used</th>
                        <th>Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>my-app-logs</td>
                        <td>us-east-1</td>
                        <td>1.2 TB</td>
                        <td>$100</td>
                      </tr>
                      <tr>
                        <td>user-uploads</td>
                        <td>us-east-1</td>
                        <td>800 GB</td>
                        <td>$80</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="accordion-item">
              <h2 className="accordion-header" id="headingLambda">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseLambda">
                  Lambda Functions
                </button>
              </h2>
              <div id="collapseLambda" className="accordion-collapse collapse">
                <div className="accordion-body">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Function Name</th>
                        <th>Region</th>
                        <th>Invocations (month)</th>
                        <th>Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>image-resize</td>
                        <td>us-east-1</td>
                        <td>12,000</td>
                        <td>$10</td>
                      </tr>
                      <tr>
                        <td>data-sync</td>
                        <td>us-east-1</td>
                        <td>8,500</td>
                        <td>$8</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Recommendations */}
          <div className="mb-4">
            <div className="alert alert-warning d-flex align-items-center mb-2" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              EC2 cost increased by 11% this month. Review running instances.
            </div>
            <div className="alert alert-info d-flex align-items-center" role="alert">
              <i className="bi bi-lightbulb me-2"></i>
              Recommendation: Enable S3 lifecycle policies to reduce storage costs.
            </div>
                </div>
              </>
            )}
            {activeTab === 'settings' && <AWSCredentialsForm />}
            {activeTab === 'terminal' && <AWSTerminalTab />}
          </div>
        </Block>
      </Content>
    </React.Fragment>
  );
};

export default AWSIntegration;