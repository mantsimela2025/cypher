# Tenable & Xacta API Integration Specifications
## Comprehensive Bi-Directional API Call Documentation

### Executive Summary
Detailed specification of all API calls required for bi-directional integration with Tenable.io/Tenable.sc and Xacta platforms, enabling full data synchronization and automated workflows.

---

## Tenable Integration API Calls

### 1. Tenable.io API Endpoints

#### Authentication & Configuration
```typescript
// Initial authentication and API validation
const tenableApiCalls = {
  // GET /session - Validate API credentials and get session info
  validateCredentials: {
    method: 'GET',
    endpoint: '/session',
    purpose: 'Validate API keys and establish session',
    frequency: 'on_connect',
    response: 'UserSession, permissions, rate limits'
  },

  // GET /server/properties - Get Tenable.io instance information
  getServerProperties: {
    method: 'GET',
    endpoint: '/server/properties',
    purpose: 'Get server capabilities and version info',
    frequency: 'daily',
    response: 'Server version, capabilities, license info'
  }
};
```

#### Asset Management (Read Operations)
```typescript
const assetReadOperations = {
  // GET /assets - List all assets with filtering
  listAssets: {
    method: 'GET',
    endpoint: '/assets',
    purpose: 'Retrieve all assets for synchronization',
    frequency: 'hourly',
    parameters: {
      'date_range': 'last_seen:1-30',
      'chunk_size': '1000',
      'filters.0.quality': 'eq',
      'filters.0.filter': 'sources',
      'filters.0.value': 'NESSUS_AGENT,NESSUS_SCAN'
    },
    response: 'Asset list with UUIDs, hostnames, IPs, OS, criticality'
  },

  // GET /assets/{asset_uuid} - Get detailed asset information
  getAssetDetails: {
    method: 'GET',
    endpoint: '/assets/{asset_uuid}',
    purpose: 'Get comprehensive asset details including vulnerabilities',
    frequency: 'on_demand',
    response: 'Complete asset profile, system info, network details'
  },

  // GET /assets/{asset_uuid}/vulnerabilities - Get asset vulnerabilities
  getAssetVulnerabilities: {
    method: 'GET',
    endpoint: '/assets/{asset_uuid}/vulnerabilities',
    purpose: 'Retrieve all vulnerabilities for specific asset',
    frequency: 'hourly',
    parameters: {
      'date_range': 'last_found:1-90',
      'filter.0.quality': 'eq',
      'filter.0.filter': 'state',
      'filter.0.value': 'open,reopened,fixed'
    },
    response: 'Vulnerability list with plugin IDs, severity, CVSS, state'
  },

  // GET /assets/export - Export large asset datasets
  exportAssets: {
    method: 'GET',
    endpoint: '/assets/export',
    purpose: 'Bulk export of asset data for initial sync',
    frequency: 'weekly',
    parameters: {
      'chunk_size': '10000',
      'filters': 'created_at and updated_at filters'
    },
    response: 'Export job UUID for status tracking'
  },

  // GET /assets/export/{export_uuid}/status - Check export status
  getExportStatus: {
    method: 'GET',
    endpoint: '/assets/export/{export_uuid}/status',
    purpose: 'Monitor export job progress',
    frequency: 'polling',
    response: 'Export status, completion percentage, download URL'
  }
};
```

#### Asset Management (Write Operations)
```typescript
const assetWriteOperations = {
  // PUT /assets/{asset_uuid}/tags - Update asset tags
  updateAssetTags: {
    method: 'PUT',
    endpoint: '/assets/{asset_uuid}/tags',
    purpose: 'Sync asset categorization and business context',
    frequency: 'on_change',
    payload: {
      'tags': [
        {
          'key': 'Business_Owner',
          'value': 'John.Smith@company.com'
        },
        {
          'key': 'Criticality',
          'value': 'High'
        },
        {
          'key': 'Environment',
          'value': 'Production'
        }
      ]
    },
    response: 'Updated asset tags confirmation'
  },

  // POST /asset-lists - Create custom asset lists
  createAssetList: {
    method: 'POST',
    endpoint: '/asset-lists',
    purpose: 'Create asset groupings based on RAS DASH classifications',
    frequency: 'on_demand',
    payload: {
      'name': 'Critical Production Assets',
      'description': 'High criticality production systems',
      'filters': {
        'and': [
          {
            'property': 'tag.Criticality',
            'operator': 'eq',
            'value': 'High'
          }
        ]
      }
    },
    response: 'Asset list UUID and creation confirmation'
  }
};
```

#### Vulnerability Management (Read Operations)
```typescript
const vulnerabilityReadOperations = {
  // GET /vulnerabilities - List vulnerabilities with filtering
  listVulnerabilities: {
    method: 'GET',
    endpoint: '/vulnerabilities',
    purpose: 'Retrieve vulnerability data for synchronization',
    frequency: 'hourly',
    parameters: {
      'date_range': 'last_found:1-30',
      'filter.0.quality': 'eq',
      'filter.0.filter': 'severity',
      'filter.0.value': 'Critical,High,Medium'
    },
    response: 'Vulnerability list with plugin IDs, CVEs, severity, counts'
  },

  // GET /vulnerabilities/{plugin_id} - Get vulnerability details
  getVulnerabilityDetails: {
    method: 'GET',
    endpoint: '/vulnerabilities/{plugin_id}',
    purpose: 'Get comprehensive vulnerability information',
    frequency: 'daily',
    response: 'Detailed vulnerability data, solution, references'
  },

  // GET /vulnerabilities/export - Export vulnerability data
  exportVulnerabilities: {
    method: 'GET',
    endpoint: '/vulnerabilities/export',
    purpose: 'Bulk export vulnerability data for analysis',
    frequency: 'daily',
    parameters: {
      'filters': 'severity, state, and date filters',
      'chunk_size': '10000'
    },
    response: 'Export job UUID for tracking'
  }
};
```

#### Vulnerability Management (Write Operations)
```typescript
const vulnerabilityWriteOperations = {
  // PUT /vulnerabilities/{plugin_id}/state - Update vulnerability state
  updateVulnerabilityState: {
    method: 'PUT',
    endpoint: '/vulnerabilities/{plugin_id}/state',
    purpose: 'Sync vulnerability remediation status from RAS DASH',
    frequency: 'on_change',
    payload: {
      'asset_uuid': 'uuid',
      'state': 'fixed', // fixed, reopened, accepted_risk, false_positive
      'comment': 'Remediated via patch deployment',
      'reason': 'compensating_control' // for accepted_risk
    },
    response: 'State change confirmation'
  },

  // POST /vulnerabilities/{plugin_id}/notes - Add vulnerability notes
  addVulnerabilityNote: {
    method: 'POST',
    endpoint: '/vulnerabilities/{plugin_id}/notes',
    purpose: 'Add remediation tracking notes from RAS DASH workflows',
    frequency: 'on_change',
    payload: {
      'asset_uuid': 'uuid',
      'note': 'Remediation scheduled for next maintenance window',
      'visibility': 'private'
    },
    response: 'Note creation confirmation'
  }
};
```

#### Scanning Operations
```typescript
const scanOperations = {
  // GET /scans - List all scans
  listScans: {
    method: 'GET',
    endpoint: '/scans',
    purpose: 'Monitor scan schedules and results',
    frequency: 'hourly',
    response: 'Scan list with IDs, names, schedules, last run'
  },

  // POST /scans - Create new scan
  createScan: {
    method: 'POST',
    endpoint: '/scans',
    purpose: 'Initiate targeted scans based on RAS DASH intelligence',
    frequency: 'on_demand',
    payload: {
      'uuid': 'policy_template_uuid',
      'settings': {
        'name': 'RAS DASH Initiated Scan',
        'text_targets': '192.168.1.0/24',
        'tag_targets': 'key:value',
        'agent_group_id': ['group_id']
      }
    },
    response: 'Scan creation confirmation and scan ID'
  },

  // POST /scans/{scan_id}/launch - Launch scan
  launchScan: {
    method: 'POST',
    endpoint: '/scans/{scan_id}/launch',
    purpose: 'Execute scans triggered by RAS DASH workflows',
    frequency: 'on_demand',
    payload: {
      'alt_targets': ['10.0.0.1', '10.0.0.2']
    },
    response: 'Scan launch confirmation and scan UUID'
  },

  // GET /scans/{scan_id} - Get scan details and results
  getScanResults: {
    method: 'GET',
    endpoint: '/scans/{scan_id}',
    purpose: 'Retrieve scan results for processing',
    frequency: 'on_completion',
    response: 'Detailed scan results, vulnerabilities found, asset info'
  }
};
```

#### Webhook Configuration
```typescript
const webhookOperations = {
  // GET /settings/webhooks - List configured webhooks
  listWebhooks: {
    method: 'GET',
    endpoint: '/settings/webhooks',
    purpose: 'Manage real-time integration webhooks',
    frequency: 'daily',
    response: 'Webhook configurations and status'
  },

  // POST /settings/webhooks - Configure webhook
  createWebhook: {
    method: 'POST',
    endpoint: '/settings/webhooks',
    purpose: 'Setup real-time notifications to RAS DASH',
    frequency: 'initial_setup',
    payload: {
      'name': 'RAS DASH Integration',
      'url': 'https://rasdash.domain.com/api/webhooks/tenable',
      'events': [
        'scan.completed',
        'asset.created',
        'asset.updated', 
        'vulnerability.found',
        'vulnerability.fixed'
      ],
      'secret': 'webhook_verification_secret'
    },
    response: 'Webhook creation confirmation'
  }
};
```

---

## Xacta API Integration Calls

### 1. Database Access Operations

#### System Information (Read Operations)
```typescript
const xactaSystemOperations = {
  // Query: Get system information
  getSystemInfo: {
    method: 'SQL_QUERY',
    query: `
      SELECT 
        s.system_id,
        s.system_name,
        s.system_type,
        s.authorization_boundary,
        s.responsible_organization,
        s.system_owner,
        s.isso_name,
        s.authorizing_official,
        s.authorization_date,
        s.authorization_termination_date,
        s.last_assessment_date
      FROM systems s
      WHERE s.active = 1
    `,
    purpose: 'Retrieve system metadata for synchronization',
    frequency: 'daily',
    response: 'System configuration and authorization details'
  },

  // Query: Get system components
  getSystemComponents: {
    method: 'SQL_QUERY',
    query: `
      SELECT 
        sc.component_id,
        sc.system_id,
        sc.component_name,
        sc.component_type,
        sc.ip_address,
        sc.hostname,
        sc.operating_system,
        sc.function_description,
        sc.data_sensitivity_level
      FROM system_components sc
      WHERE sc.system_id = ?
    `,
    purpose: 'Map Xacta components to RAS DASH assets',
    frequency: 'daily',
    response: 'Component details for asset correlation'
  }
};
```

#### Control Assessment (Read Operations)
```typescript
const xactaControlOperations = {
  // Query: Get control implementations
  getControlImplementations: {
    method: 'SQL_QUERY',
    query: `
      SELECT 
        ci.control_id,
        ci.system_id,
        c.control_number,
        c.control_family,
        c.control_title,
        ci.implementation_status,
        ci.assessment_status,
        ci.implementation_description,
        ci.responsible_role,
        ci.last_assessment_date,
        ci.next_assessment_date,
        ci.assessment_frequency
      FROM control_implementations ci
      JOIN controls c ON ci.control_id = c.control_id
      WHERE ci.system_id = ?
    `,
    purpose: 'Sync control implementation status',
    frequency: 'daily',
    response: 'Control implementation and assessment data'
  },

  // Query: Get control assessment results
  getControlAssessments: {
    method: 'SQL_QUERY',
    query: `
      SELECT 
        ca.assessment_id,
        ca.control_id,
        ca.system_id,
        ca.assessment_date,
        ca.assessor_name,
        ca.assessment_result,
        ca.finding_details,
        ca.recommendation,
        ca.evidence_reference
      FROM control_assessments ca
      WHERE ca.system_id = ? 
      AND ca.assessment_date >= ?
    `,
    purpose: 'Retrieve control assessment results',
    frequency: 'daily',
    response: 'Assessment findings and recommendations'
  },

  // Query: Get control evidence
  getControlEvidence: {
    method: 'SQL_QUERY',
    query: `
      SELECT 
        ce.evidence_id,
        ce.control_id,
        ce.system_id,
        ce.evidence_type,
        ce.evidence_title,
        ce.evidence_description,
        ce.file_path,
        ce.collection_date,
        ce.expiration_date,
        ce.is_current
      FROM control_evidence ce
      WHERE ce.system_id = ?
      AND ce.is_current = 1
    `,
    purpose: 'Track control evidence for compliance',
    frequency: 'daily',
    response: 'Evidence artifacts and metadata'
  }
};
```

#### POAM Management (Read Operations)
```typescript
const xactaPoamOperations = {
  // Query: Get POAMs
  getPoams: {
    method: 'SQL_QUERY',
    query: `
      SELECT 
        p.poam_id,
        p.system_id,
        p.control_id,
        p.weakness_description,
        p.weakness_type,
        p.resources_required,
        p.scheduled_completion_date,
        p.actual_completion_date,
        p.poam_status,
        p.milestone_changes,
        p.risk_rating,
        p.responsible_individual,
        p.deviation_rationale
      FROM poams p
      WHERE p.system_id = ?
      AND p.poam_status IN ('Open', 'In Progress')
    `,
    purpose: 'Sync POAM data with RAS DASH vulnerability tracking',
    frequency: 'hourly',
    response: 'POAM details and status information'
  },

  // Query: Get POAM milestones
  getPoamMilestones: {
    method: 'SQL_QUERY',
    query: `
      SELECT 
        pm.milestone_id,
        pm.poam_id,
        pm.milestone_description,
        pm.scheduled_date,
        pm.actual_date,
        pm.milestone_status,
        pm.comments
      FROM poam_milestones pm
      WHERE pm.poam_id = ?
      ORDER BY pm.scheduled_date
    `,
    purpose: 'Track POAM milestone progress',
    frequency: 'daily',
    response: 'Milestone schedules and completion status'
  }
};
```

#### Write Operations (Updates to Xacta)
```typescript
const xactaWriteOperations = {
  // Update control implementation status
  updateControlStatus: {
    method: 'SQL_UPDATE',
    query: `
      UPDATE control_implementations 
      SET 
        implementation_status = ?,
        assessment_status = ?,
        last_assessment_date = ?,
        implementation_description = ?,
        updated_date = NOW(),
        updated_by = ?
      WHERE control_id = ? AND system_id = ?
    `,
    purpose: 'Update control status from RAS DASH assessments',
    frequency: 'on_change',
    parameters: ['status', 'assessment_result', 'date', 'description', 'user_id', 'control_id', 'system_id']
  },

  // Create new POAM
  createPoam: {
    method: 'SQL_INSERT',
    query: `
      INSERT INTO poams (
        poam_id, system_id, control_id, weakness_description,
        weakness_type, resources_required, scheduled_completion_date,
        poam_status, risk_rating, responsible_individual,
        created_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Open', ?, ?, NOW(), ?)
    `,
    purpose: 'Create POAMs from RAS DASH vulnerability findings',
    frequency: 'on_demand',
    parameters: ['poam_id', 'system_id', 'control_id', 'description', 'type', 'resources', 'due_date', 'risk_rating', 'responsible', 'user_id']
  },

  // Update POAM status
  updatePoamStatus: {
    method: 'SQL_UPDATE',
    query: `
      UPDATE poams 
      SET 
        poam_status = ?,
        actual_completion_date = ?,
        deviation_rationale = ?,
        updated_date = NOW(),
        updated_by = ?
      WHERE poam_id = ? AND system_id = ?
    `,
    purpose: 'Update POAM status based on RAS DASH remediation',
    frequency: 'on_change',
    parameters: ['status', 'completion_date', 'rationale', 'user_id', 'poam_id', 'system_id']
  },

  // Add control evidence
  addControlEvidence: {
    method: 'SQL_INSERT',
    query: `
      INSERT INTO control_evidence (
        evidence_id, control_id, system_id, evidence_type,
        evidence_title, evidence_description, file_path,
        collection_date, expiration_date, is_current,
        created_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?)
    `,
    purpose: 'Add evidence from RAS DASH automated collections',
    frequency: 'on_demand',
    parameters: ['evidence_id', 'control_id', 'system_id', 'type', 'title', 'description', 'path', 'collection_date', 'expiration', 'user_id']
  }
};
```

### 2. REST API Operations (if available)

#### Authentication
```typescript
const xactaRestOperations = {
  // POST /api/auth/login - Authenticate with Xacta
  authenticate: {
    method: 'POST',
    endpoint: '/api/auth/login',
    purpose: 'Establish authenticated session',
    frequency: 'session_start',
    payload: {
      'username': 'api_user',
      'password': 'api_password',
      'domain': 'xacta_domain'
    },
    response: 'Authentication token and session details'
  },

  // POST /api/auth/refresh - Refresh authentication token
  refreshToken: {
    method: 'POST',
    endpoint: '/api/auth/refresh',
    purpose: 'Maintain authenticated session',
    frequency: 'hourly',
    payload: {
      'refresh_token': 'existing_refresh_token'
    },
    response: 'New authentication token'
  }
};
```

#### System Operations
```typescript
const xactaSystemRestOperations = {
  // GET /api/systems - List systems
  listSystems: {
    method: 'GET',
    endpoint: '/api/systems',
    purpose: 'Retrieve system list for synchronization',
    frequency: 'daily',
    parameters: {
      'active': 'true',
      'include_components': 'true'
    },
    response: 'System list with metadata'
  },

  // GET /api/systems/{system_id}/controls - Get system controls
  getSystemControls: {
    method: 'GET',
    endpoint: '/api/systems/{system_id}/controls',
    purpose: 'Retrieve control implementations',
    frequency: 'daily',
    parameters: {
      'include_assessments': 'true',
      'status': 'all'
    },
    response: 'Control implementation details'
  },

  // PUT /api/systems/{system_id}/controls/{control_id} - Update control
  updateControl: {
    method: 'PUT',
    endpoint: '/api/systems/{system_id}/controls/{control_id}',
    purpose: 'Update control status from RAS DASH',
    frequency: 'on_change',
    payload: {
      'implementation_status': 'Implemented',
      'assessment_status': 'Satisfied',
      'implementation_description': 'Updated from RAS DASH automation',
      'assessment_date': '2025-06-26'
    },
    response: 'Control update confirmation'
  }
};
```

---

## Integration Workflow Sequences

### 1. Initial Data Synchronization
```typescript
const initialSyncWorkflow = {
  step1: 'Authenticate with both Tenable and Xacta',
  step2: 'Export asset data from Tenable (/assets/export)',
  step3: 'Query system components from Xacta',
  step4: 'Correlate assets using hostname/IP matching',
  step5: 'Export vulnerability data from Tenable',
  step6: 'Map vulnerabilities to Xacta controls',
  step7: 'Create initial correlation table in RAS DASH'
};
```

### 2. Real-time Synchronization
```typescript
const realTimeSyncWorkflow = {
  tenable_webhook: 'Receive vulnerability.found webhook',
  process_vulnerability: 'Analyze vulnerability against control mappings',
  update_xacta: 'Update control assessment if applicable',
  create_poam: 'Create POAM if control failure identified',
  update_tenable: 'Add tracking notes to Tenable vulnerability'
};
```

### 3. Remediation Workflow
```typescript
const remediationWorkflow = {
  ras_dash_action: 'User marks vulnerability as remediated',
  update_tenable: 'PUT /vulnerabilities/{plugin_id}/state (state: fixed)',
  validate_scan: 'Trigger rescan if needed',
  update_xacta_control: 'Update control implementation status',
  close_poam: 'Update POAM status to completed',
  generate_evidence: 'Create evidence artifact in Xacta'
};
```

---

## API Rate Limits & Considerations

### Tenable.io Rate Limits
```typescript
const tenableRateLimits = {
  standard_endpoints: '200 requests per minute',
  export_endpoints: '12 export jobs per hour',
  scan_endpoints: '50 scan launches per hour',
  webhook_delivery: '1000 events per minute',
  
  recommended_strategies: {
    batching: 'Batch requests where possible',
    caching: 'Cache static data (vulnerability details)',
    webhooks: 'Use webhooks for real-time updates',
    exponential_backoff: 'Implement retry with backoff'
  }
};
```

### Xacta Database Considerations
```typescript
const xactaDatabaseLimits = {
  connection_pooling: 'Limit concurrent connections',
  query_optimization: 'Use indexed queries only',
  transaction_management: 'Use transactions for multi-table updates',
  read_replicas: 'Use read replicas if available',
  
  recommended_strategies: {
    scheduled_sync: 'Batch updates during off-peak hours',
    change_detection: 'Only sync modified records',
    stored_procedures: 'Use stored procedures for complex operations',
    connection_reuse: 'Maintain persistent connections'
  }
};
```

---

## Error Handling & Retry Logic

### Tenable API Error Handling
```typescript
const tenableErrorHandling = {
  authentication_errors: {
    401: 'Invalid API keys - refresh credentials',
    403: 'Insufficient permissions - check user roles'
  },
  
  rate_limit_errors: {
    429: 'Rate limit exceeded - implement exponential backoff',
    strategy: 'Wait for X-RateLimit-Reset header value'
  },
  
  service_errors: {
    500: 'Tenable service error - retry with backoff',
    502: 'Gateway error - check Tenable status page',
    503: 'Service unavailable - implement circuit breaker'
  }
};
```

### Xacta Database Error Handling
```typescript
const xactaErrorHandling = {
  connection_errors: {
    timeout: 'Database timeout - retry with longer timeout',
    connection_lost: 'Connection lost - reconnect with backoff'
  },
  
  transaction_errors: {
    deadlock: 'Deadlock detected - retry transaction',
    constraint_violation: 'Data constraint error - validate data'
  },
  
  permission_errors: {
    access_denied: 'Insufficient database permissions',
    schema_access: 'Schema access denied - check privileges'
  }
};
```

This comprehensive API specification provides your development team with all the specific endpoints, queries, and integration patterns needed to implement robust bi-directional synchronization with both Tenable and Xacta platforms.