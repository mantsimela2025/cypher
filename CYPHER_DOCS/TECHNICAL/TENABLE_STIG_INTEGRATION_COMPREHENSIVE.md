# Tenable Security Center STIG Integration - Comprehensive Technical Specification

## Executive Summary

This document outlines the complete integration strategy between RAS DASH and Tenable Security Center for automated STIG compliance scanning, assessment, and hardening orchestration. The integration leverages Tenable's enterprise-grade vulnerability management platform to provide continuous STIG compliance monitoring across cloud infrastructure and containerized environments.

## Business Value Proposition

- **Automated STIG Compliance**: Reduce manual STIG assessment time by 90%
- **Continuous Monitoring**: Real-time compliance drift detection and alerting
- **Risk-Based Prioritization**: AI-driven STIG violation prioritization based on business impact
- **Audit Readiness**: Comprehensive compliance reporting for regulatory audits
- **Cost Optimization**: Minimize security overhead through automation

---

## 1. Architecture Overview

### 1.1 Integration Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   RAS DASH      │    │ Tenable Security │    │  Target Assets  │
│   Platform      │◄──►│     Center       │◄──►│ (AWS/Containers)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│STIG Orchestrator│    │   Nessus Scanner │    │ Hardening Tools │
│   Workflows     │    │    Fleet         │    │(SSM/K8s/Docker) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.2 Component Responsibilities

**RAS DASH Platform:**
- STIG workflow orchestration and automation
- Asset inventory and classification management
- Compliance dashboard and reporting
- AI-powered remediation recommendations
- Integration hub for multiple security tools

**Tenable Security Center:**
- STIG compliance scanning and assessment
- Vulnerability correlation and risk scoring
- Policy template management
- Historical compliance tracking

**Target Infrastructure:**
- AWS EC2 instances, containers, and managed services
- Kubernetes clusters and containerized applications
- Network infrastructure and security appliances

---

## 2. Tenable Security Center API Integration

### 2.1 Authentication Architecture

#### Primary Authentication Method
```javascript
// Token-based authentication with automatic refresh
class TenableAuthManager {
  constructor(config) {
    this.baseUrl = config.tenableUrl;
    this.credentials = config.credentials;
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    const response = await fetch(`${this.baseUrl}/rest/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: this.credentials.username,
        password: this.credentials.password
      })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    this.token = data.response.token;
    this.tokenExpiry = Date.now() + (data.response.sessionTimeout * 1000);
    
    return this.token;
  }

  async ensureValidToken() {
    if (!this.token || Date.now() >= this.tokenExpiry - 60000) {
      await this.authenticate();
    }
    return this.token;
  }
}
```

#### Certificate-Based Authentication (Enterprise)
```javascript
// X.509 certificate authentication for high-security environments
class TenableCertAuth {
  constructor(certPath, keyPath, tenableUrl) {
    this.cert = fs.readFileSync(certPath);
    this.key = fs.readFileSync(keyPath);
    this.baseUrl = tenableUrl;
  }

  async authenticateWithCert() {
    const httpsAgent = new https.Agent({
      cert: this.cert,
      key: this.key,
      rejectUnauthorized: true
    });

    return await fetch(`${this.baseUrl}/rest/token`, {
      method: 'POST',
      agent: httpsAgent,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

### 2.2 Core API Integration Layer

#### STIG Scanner Management API
```javascript
class TenableSTIGAPIClient {
  constructor(authManager) {
    this.auth = authManager;
    this.baseUrl = authManager.baseUrl;
  }

  // Get all available STIG scanners
  async getAvailableScanners() {
    const token = await this.auth.ensureValidToken();
    
    const response = await fetch(`${this.baseUrl}/rest/scanner`, {
      method: 'GET',
      headers: {
        'X-SecurityCenter': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.response.usable.filter(scanner => 
      scanner.status === '1' && scanner.loadAvg < 80
    );
  }

  // Get STIG-specific scan policies
  async getSTIGPolicies() {
    const token = await this.auth.ensureValidToken();
    
    const response = await fetch(`${this.baseUrl}/rest/policy`, {
      method: 'GET',
      headers: {
        'X-SecurityCenter': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.response.usable.filter(policy => 
      policy.name.toLowerCase().includes('stig') || 
      policy.policyTemplate.name.toLowerCase().includes('compliance')
    );
  }

  // Launch targeted STIG scan
  async launchSTIGScan(scanConfig) {
    const token = await this.auth.ensureValidToken();
    
    const scanPayload = {
      name: `STIG-${scanConfig.stigType}-${Date.now()}`,
      description: `Automated STIG compliance scan for ${scanConfig.assetGroup}`,
      repository: { id: scanConfig.repositoryId },
      policy: { id: scanConfig.policyId },
      zone: { id: scanConfig.zoneId },
      scanner: { id: scanConfig.scannerId },
      ipList: scanConfig.targets.join(','),
      type: "policy",
      dhcpTracking: "true",
      classifyMitigatedAge: "0",
      emailOnLaunch: "false",
      emailOnFinish: "true",
      reports: [{
        id: "1",
        reportSource: "individual"
      }]
    };

    const response = await fetch(`${this.baseUrl}/rest/scan`, {
      method: 'POST',
      headers: {
        'X-SecurityCenter': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scanPayload)
    });

    if (!response.ok) {
      throw new Error(`Scan launch failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      scanId: data.response.id,
      scanResultId: data.response.scanResult.id,
      status: data.response.status,
      startTime: data.response.startTime
    };
  }

  // Monitor scan progress
  async getScanStatus(scanId) {
    const token = await this.auth.ensureValidToken();
    
    const response = await fetch(`${this.baseUrl}/rest/scanResult/${scanId}`, {
      method: 'GET',
      headers: {
        'X-SecurityCenter': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return {
      status: data.response.status,
      progress: data.response.progress,
      totalChecks: data.response.totalChecks,
      completedChecks: data.response.completedChecks,
      startTime: data.response.startTime,
      finishTime: data.response.finishTime
    };
  }
}
```

#### STIG Results Analysis API
```javascript
class TenableSTIGAnalyzer {
  constructor(apiClient) {
    this.client = apiClient;
  }

  // Get STIG compliance results with detailed analysis
  async getSTIGComplianceResults(filters = {}) {
    const token = await this.client.auth.ensureValidToken();
    
    const analysisQuery = {
      query: {
        name: "",
        description: "STIG Compliance Analysis",
        context: "",
        status: -1,
        createdTime: 0,
        modifiedTime: 0,
        groups: [],
        type: "vuln",
        tool: "vulndetails",
        sourceType: "cumulative",
        startOffset: 0,
        endOffset: 1000,
        filters: [
          {
            id: "pluginFamily",
            filterName: "pluginFamily",
            operator: "=",
            type: "vuln",
            isPredefined: true,
            value: [{"id": "34", "name": "Policy Compliance"}]
          },
          {
            id: "severity",
            filterName: "severity", 
            operator: "=",
            type: "vuln",
            isPredefined: true,
            value: [
              {"id": "4", "name": "Critical"},
              {"id": "3", "name": "High"},
              {"id": "2", "name": "Medium"}
            ]
          }
        ],
        vulnTool: "vulndetails"
      },
      sourceType: "cumulative",
      columns: [],
      type: "vuln"
    };

    // Apply additional filters
    if (filters.stigBenchmark) {
      analysisQuery.query.filters.push({
        id: "pluginName",
        operator: "~",
        value: filters.stigBenchmark
      });
    }

    if (filters.assetGroup) {
      analysisQuery.query.filters.push({
        id: "repository",
        operator: "=",
        value: [{"id": filters.assetGroup}]
      });
    }

    const response = await fetch(`${this.client.baseUrl}/rest/analysis`, {
      method: 'POST',
      headers: {
        'X-SecurityCenter': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(analysisQuery)
    });

    const data = await response.json();
    return this.processSTIGResults(data.response.results);
  }

  // Process and categorize STIG findings
  processSTIGResults(rawResults) {
    const stigFindings = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      summary: {
        totalFindings: rawResults.length,
        riskScore: 0,
        compliancePercentage: 0,
        categorizedCounts: {
          authentication: 0,
          access_control: 0,
          audit_logging: 0,
          system_hardening: 0,
          network_security: 0
        }
      }
    };

    rawResults.forEach(finding => {
      const processedFinding = {
        pluginId: finding.pluginID,
        pluginName: finding.pluginName,
        severity: finding.severity,
        riskFactor: finding.riskFactor,
        hostIP: finding.ip,
        hostFQDN: finding.dnsName,
        port: finding.port,
        protocol: finding.protocol,
        stigId: this.extractSTIGId(finding.pluginName),
        category: this.categorizeSTIGFinding(finding.pluginName),
        description: finding.description,
        solution: finding.solution,
        firstSeen: finding.firstSeen,
        lastSeen: finding.lastSeen,
        exploitAvailable: finding.exploitAvailable === "true"
      };

      // Categorize by severity
      switch(finding.severity.name.toLowerCase()) {
        case 'critical':
          stigFindings.critical.push(processedFinding);
          break;
        case 'high':
          stigFindings.high.push(processedFinding);
          break;
        case 'medium':
          stigFindings.medium.push(processedFinding);
          break;
        default:
          stigFindings.low.push(processedFinding);
      }

      // Update category counts
      if (stigFindings.summary.categorizedCounts.hasOwnProperty(processedFinding.category)) {
        stigFindings.summary.categorizedCounts[processedFinding.category]++;
      }
    });

    // Calculate risk metrics
    stigFindings.summary.riskScore = this.calculateRiskScore(stigFindings);
    stigFindings.summary.compliancePercentage = this.calculateCompliancePercentage(stigFindings);

    return stigFindings;
  }

  // Extract STIG ID from plugin name
  extractSTIGId(pluginName) {
    const stigIdMatch = pluginName.match(/([A-Z]+-\d{2}-\d{6})/);
    return stigIdMatch ? stigIdMatch[1] : null;
  }

  // Categorize STIG finding by control family
  categorizeSTIGFinding(pluginName) {
    const categoryMap = {
      'password|authentication|login': 'authentication',
      'access|permission|privilege': 'access_control',
      'audit|log|event': 'audit_logging',
      'configuration|hardening|service': 'system_hardening',
      'network|firewall|port': 'network_security'
    };

    for (const [pattern, category] of Object.entries(categoryMap)) {
      if (new RegExp(pattern, 'i').test(pluginName)) {
        return category;
      }
    }
    return 'other';
  }

  // Calculate overall risk score
  calculateRiskScore(findings) {
    const weights = { critical: 10, high: 7, medium: 4, low: 1 };
    let totalScore = 0;
    
    Object.keys(weights).forEach(severity => {
      totalScore += findings[severity].length * weights[severity];
    });

    return Math.min(Math.round(totalScore / 10), 100);
  }

  // Calculate compliance percentage
  calculateCompliancePercentage(findings) {
    const totalChecks = findings.summary.totalFindings + 100; // Assume baseline checks
    const failedChecks = findings.summary.totalFindings;
    return Math.round(((totalChecks - failedChecks) / totalChecks) * 100);
  }
}
```

### 2.3 Asset Discovery and Classification API
```javascript
class TenableAssetManager {
  constructor(apiClient) {
    this.client = apiClient;
  }

  // Discover and classify assets for STIG applicability
  async discoverSTIGApplicableAssets() {
    const token = await this.client.auth.ensureValidToken();
    
    const response = await fetch(`${this.client.baseUrl}/rest/asset`, {
      method: 'GET',
      headers: {
        'X-SecurityCenter': token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return this.classifyAssetsForSTIG(data.response.usable);
  }

  // Classify assets based on STIG applicability
  classifyAssetsForSTIG(assets) {
    const stigClassification = {
      windows_server: [],
      linux_server: [],
      network_devices: [],
      containers: [],
      cloud_services: [],
      unclassified: []
    };

    assets.forEach(asset => {
      const classification = this.determineSTIGCategory(asset);
      stigClassification[classification].push({
        id: asset.id,
        ip: asset.ip,
        fqdn: asset.fqdn,
        os: asset.os,
        stigBenchmarks: this.getApplicableSTIGs(asset),
        lastScanDate: asset.lastAuthRun,
        riskScore: asset.score
      });
    });

    return stigClassification;
  }

  // Determine STIG category for asset
  determineSTIGCategory(asset) {
    const os = asset.os.toLowerCase();
    
    if (os.includes('windows') && os.includes('server')) return 'windows_server';
    if (os.includes('linux') || os.includes('rhel') || os.includes('ubuntu')) return 'linux_server';
    if (asset.deviceType === 'router' || asset.deviceType === 'switch') return 'network_devices';
    if (os.includes('docker') || asset.fqdn.includes('container')) return 'containers';
    if (asset.fqdn.includes('amazonaws.com') || asset.fqdn.includes('azure')) return 'cloud_services';
    
    return 'unclassified';
  }

  // Get applicable STIG benchmarks for asset
  getApplicableSTIGs(asset) {
    const stigMap = {
      'windows server 2019': ['Windows_Server_2019_STIG'],
      'windows server 2016': ['Windows_Server_2016_STIG'],
      'red hat enterprise linux 8': ['RHEL_8_STIG'],
      'ubuntu': ['Ubuntu_20.04_STIG'],
      'cisco ios': ['Cisco_IOS_Router_RTR_STIG', 'Cisco_IOS_Switch_L2S_STIG']
    };

    const os = asset.os.toLowerCase();
    for (const [pattern, stigs] of Object.entries(stigMap)) {
      if (os.includes(pattern)) {
        return stigs;
      }
    }
    return ['General_Purpose_OS_STIG'];
  }
}
```

---

## 3. RAS DASH API Requirements

### 3.1 STIG Orchestration API Endpoints

#### Asset Management Endpoints
```javascript
// GET /api/stig/assets - Get STIG-applicable assets
app.get('/api/stig/assets', async (req, res) => {
  try {
    const assets = await stigAssetService.getSTIGApplicableAssets();
    res.json({
      success: true,
      data: assets,
      metadata: {
        totalAssets: assets.length,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/stig/assets/classify - Classify assets for STIG requirements
app.post('/api/stig/assets/classify', async (req, res) => {
  try {
    const { assetIds } = req.body;
    const classification = await stigAssetService.classifyAssets(assetIds);
    res.json({ success: true, data: classification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stig/benchmarks - Get available STIG benchmarks
app.get('/api/stig/benchmarks', async (req, res) => {
  try {
    const benchmarks = await stigBenchmarkService.getAvailableBenchmarks();
    res.json({ success: true, data: benchmarks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### Scan Management Endpoints
```javascript
// POST /api/stig/scans/launch - Launch STIG compliance scan
app.post('/api/stig/scans/launch', async (req, res) => {
  try {
    const scanConfig = req.body;
    const scanResult = await tenableSTIGClient.launchSTIGScan(scanConfig);
    
    // Store scan metadata in RAS DASH database
    await stigScanService.recordScanLaunch(scanResult);
    
    res.json({ success: true, data: scanResult });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stig/scans/:scanId/status - Get scan progress
app.get('/api/stig/scans/:scanId/status', async (req, res) => {
  try {
    const { scanId } = req.params;
    const status = await tenableSTIGClient.getScanStatus(scanId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stig/scans/:scanId/results - Get STIG scan results
app.get('/api/stig/scans/:scanId/results', async (req, res) => {
  try {
    const { scanId } = req.params;
    const results = await stigAnalyzer.getSTIGComplianceResults({ scanId });
    
    // Store results in RAS DASH for analytics
    await stigResultsService.storeResults(scanId, results);
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### Hardening Orchestration Endpoints
```javascript
// POST /api/stig/hardening/plan - Generate hardening plan
app.post('/api/stig/hardening/plan', async (req, res) => {
  try {
    const { assetId, stigFindings } = req.body;
    const hardeningPlan = await stigHardeningOrchestrator.generateHardeningPlan(assetId, stigFindings);
    res.json({ success: true, data: hardeningPlan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/stig/hardening/execute - Execute hardening plan
app.post('/api/stig/hardening/execute', async (req, res) => {
  try {
    const { planId, approvalToken } = req.body;
    
    // Validate approval token
    await hardeningApprovalService.validateApproval(planId, approvalToken);
    
    const result = await stigHardeningOrchestrator.executeHardeningPlan(planId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/stig/compliance/dashboard - Get compliance dashboard data
app.get('/api/stig/compliance/dashboard', async (req, res) => {
  try {
    const dashboardData = await stigComplianceService.getDashboardMetrics();
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 3.2 Workflow Automation API
```javascript
// POST /api/stig/workflows/create - Create automated STIG workflow
app.post('/api/stig/workflows/create', async (req, res) => {
  try {
    const workflowConfig = req.body;
    const workflow = await stigWorkflowService.createWorkflow(workflowConfig);
    res.json({ success: true, data: workflow });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/stig/workflows/:workflowId/execute - Execute STIG workflow
app.post('/api/stig/workflows/:workflowId/execute', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const execution = await stigWorkflowService.executeWorkflow(workflowId);
    res.json({ success: true, data: execution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 4. Integration Data Flow

### 4.1 STIG Scan Initiation Flow
```
1. RAS DASH Asset Discovery
   ↓
2. Asset Classification (STIG Applicability)
   ↓
3. Tenable Scanner Selection
   ↓
4. STIG Policy Assignment
   ↓
5. Scan Launch via Tenable API
   ↓
6. Progress Monitoring
   ↓
7. Results Retrieval & Processing
   ↓
8. Compliance Dashboard Update
```

### 4.2 Hardening Orchestration Flow
```
1. STIG Findings Analysis
   ↓
2. Risk Prioritization
   ↓
3. Hardening Plan Generation
   ↓
4. Approval Workflow
   ↓
5. Platform-Specific Hardening Execution
   ↓
6. Validation Scan
   ↓
7. Compliance Status Update
```

### 4.3 Error Handling and Resilience

#### Retry Logic for API Calls
```javascript
class ResilientAPIClient {
  async executeWithRetry(operation, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (this.isRetriableError(error) && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await this.sleep(delay);
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError;
  }

  isRetriableError(error) {
    return error.status >= 500 || error.code === 'ECONNRESET' || error.code === 'TIMEOUT';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 5. Security Considerations

### 5.1 Authentication Security
- Token-based authentication with automatic refresh
- Certificate-based authentication for high-security environments
- API key rotation policies
- Audit logging for all API interactions

### 5.2 Data Protection
- Encryption in transit (TLS 1.3)
- Encryption at rest for stored scan results
- Data retention policies for compliance data
- Secure credential management using HashiCorp Vault

### 5.3 Access Control
- Role-based access control (RBAC) for STIG operations
- Multi-factor authentication for hardening operations
- Approval workflows for high-risk remediation
- Audit trails for all system modifications

---

## 6. Performance Optimization

### 6.1 Scanning Optimization
- Intelligent scanner load balancing
- Parallel scan execution across multiple scanners
- Incremental scanning for large environments
- Scan result caching and deduplication

### 6.2 API Performance
- Connection pooling for Tenable API calls
- Request batching for bulk operations
- Response caching for frequently accessed data
- Asynchronous processing for long-running operations

---

## 7. Monitoring and Alerting

### 7.1 Integration Health Monitoring
- Tenable API connectivity monitoring
- Scanner availability and performance metrics
- Scan success rate tracking
- Alert thresholds for failed operations

### 7.2 Compliance Monitoring
- Real-time STIG compliance status
- Compliance drift detection and alerting
- Risk score trending and forecasting
- Executive reporting and dashboards

---

This comprehensive technical specification provides the foundation for implementing a robust, scalable, and secure Tenable Security Center integration with advanced STIG compliance management capabilities.