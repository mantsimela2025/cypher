# Data Ingestion API Routes

## Overview

This document provides comprehensive specifications for all Data Ingestion API endpoints, including request/response formats, authentication requirements, error handling, and usage examples. The API follows RESTful conventions and provides robust data validation and error reporting.

## Base Configuration

### Base URL
```
/api/ingestion
```

### Authentication
All endpoints require valid authentication. The system supports multiple authentication methods:
- Session-based authentication with cookies
- JWT tokens in Authorization header
- API key authentication for service-to-service communication

### Content-Type Requirements
```
Content-Type: application/json
Accept: application/json
```

## Complete API Specification

### Route Registration

#### File: `server/routes/ingestion.ts`

```typescript
import { Router } from 'express';
import { dataIngestionController } from '../controllers/DataIngestionController';
import { requireAuth } from '../middleware/auth'; // Authentication middleware
import { validateRequest } from '../middleware/validation'; // Request validation middleware

const router = Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// ============================================================================
// TENABLE DATA INGESTION ENDPOINTS
// ============================================================================

/**
 * POST /api/ingestion/tenable/assets
 * Ingests asset data from Tenable vulnerability scanners
 */
router.post('/tenable/assets', 
  validateRequest('tenableAssets'),
  dataIngestionController.ingestTenableAssets.bind(dataIngestionController)
);

/**
 * POST /api/ingestion/tenable/vulnerabilities
 * Ingests vulnerability data from Tenable scans
 */
router.post('/tenable/vulnerabilities',
  validateRequest('tenableVulnerabilities'),
  dataIngestionController.ingestTenableVulnerabilities.bind(dataIngestionController)
);

// ============================================================================
// XACTA DATA INGESTION ENDPOINTS
// ============================================================================

/**
 * POST /api/ingestion/xacta/systems
 * Ingests system information from Xacta compliance management
 */
router.post('/xacta/systems',
  validateRequest('xactaSystems'),
  dataIngestionController.ingestXactaSystems.bind(dataIngestionController)
);

/**
 * POST /api/ingestion/xacta/controls
 * Ingests security control data from Xacta assessments
 */
router.post('/xacta/controls',
  validateRequest('xactaControls'),
  dataIngestionController.ingestXactaControls.bind(dataIngestionController)
);

/**
 * POST /api/ingestion/xacta/poams
 * Ingests Plan of Action and Milestones from Xacta
 */
router.post('/xacta/poams',
  validateRequest('xactaPoams'),
  dataIngestionController.ingestXactaPoams.bind(dataIngestionController)
);

// ============================================================================
// BATCH MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/ingestion/batch/:batchId/status
 * Retrieves the status and progress of a specific ingestion batch
 */
router.get('/batch/:batchId/status',
  dataIngestionController.getBatchStatus.bind(dataIngestionController)
);

/**
 * GET /api/ingestion/batches
 * Lists all ingestion batches with filtering and pagination
 */
router.get('/batches',
  dataIngestionController.getBatches.bind(dataIngestionController)
);

/**
 * DELETE /api/ingestion/batch/:batchId
 * Cancels an in-progress batch or deletes a completed batch
 */
router.delete('/batch/:batchId',
  dataIngestionController.deleteBatch.bind(dataIngestionController)
);

// ============================================================================
// STATISTICS AND MONITORING ENDPOINTS
// ============================================================================

/**
 * GET /api/ingestion/statistics
 * Retrieves comprehensive ingestion statistics and metrics
 */
router.get('/statistics',
  dataIngestionController.getIngestionStats.bind(dataIngestionController)
);

/**
 * GET /api/ingestion/statistics/dashboard
 * Retrieves dashboard-ready statistics with charts and summaries
 */
router.get('/statistics/dashboard',
  dataIngestionController.getDashboardStats.bind(dataIngestionController)
);

/**
 * GET /api/ingestion/errors
 * Retrieves ingestion errors with filtering and pagination
 */
router.get('/errors',
  dataIngestionController.getIngestionErrors.bind(dataIngestionController)
);

// ============================================================================
// DATA QUALITY AND VALIDATION ENDPOINTS
// ============================================================================

/**
 * GET /api/ingestion/data-quality
 * Retrieves data quality metrics and reports
 */
router.get('/data-quality',
  dataIngestionController.getDataQuality.bind(dataIngestionController)
);

/**
 * POST /api/ingestion/validate
 * Validates data structure before ingestion without processing
 */
router.post('/validate',
  dataIngestionController.validateData.bind(dataIngestionController)
);

// ============================================================================
// HEALTH AND STATUS ENDPOINTS
// ============================================================================

/**
 * GET /api/ingestion/health
 * Health check endpoint for monitoring system status
 */
router.get('/health',
  dataIngestionController.healthCheck.bind(dataIngestionController)
);

export default router;
```

## Detailed Endpoint Specifications

### 1. Tenable Asset Ingestion

#### POST /api/ingestion/tenable/assets

**Purpose**: Imports asset discovery data from Tenable vulnerability scanners.

**Request Format**:
```typescript
interface TenableAssetRequest {
  assets: Array<{
    id: string;                    // Required: Unique asset identifier
    hostname?: string;            // Optional: Asset hostname
    netbios_name?: string;        // Optional: NetBIOS name
    system_id?: string;           // Optional: Associated system ID
    has_agent?: boolean;          // Optional: Whether Tenable agent is installed
    has_plugin_results?: boolean; // Optional: Whether plugin results exist
    first_seen?: string;          // Optional: ISO date string
    last_seen?: string;           // Optional: ISO date string
    exposure_score?: number;      // Optional: Risk exposure score (0-1000)
    acr_score?: number;          // Optional: Asset Criticality Rating (0-10)
    criticality_rating?: string;  // Optional: Low/Medium/High/Critical
    operating_systems?: Array<{
      operating_system: string;
      system_type: string;
      is_primary: boolean;
    }>;
    network_interfaces?: Array<{
      mac_address?: string;
      ipv4_address?: string;
      ipv6_address?: string;
      fqdn?: string;
    }>;
    tags?: Array<{
      key: string;
      value: string;
    }>;
  }>;
}
```

**Response Format**:
```typescript
interface IngestionResponse {
  success: boolean;
  batchId: string;              // UUID for tracking this ingestion
  results: {
    processed: number;          // Total records processed
    successful: number;         // Successfully imported records
    failed: number;            // Failed records
    errorCount: number;        // Number of validation/processing errors
  };
  message: string;             // Human-readable status message
  errors?: Array<{             // Present if validation fails
    field: string;
    message: string;
    value: any;
  }>;
}
```

**Example Request**:
```bash
curl -X POST \
  https://your-domain.com/api/ingestion/tenable/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "assets": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "hostname": "web-server-01",
        "netbios_name": "WEBSRV01",
        "system_id": "WEB_INFRA_001",
        "has_agent": true,
        "exposure_score": 245,
        "acr_score": 7.2,
        "criticality_rating": "High",
        "operating_systems": [{
          "operating_system": "Ubuntu 20.04 LTS",
          "system_type": "Linux",
          "is_primary": true
        }],
        "network_interfaces": [{
          "ipv4_address": "10.1.1.100",
          "mac_address": "00:1B:44:11:3A:B7",
          "fqdn": "web-server-01.company.local"
        }],
        "tags": [
          {"key": "Environment", "value": "Production"},
          {"key": "Owner", "value": "IT-WebTeam"}
        ]
      }
    ]
  }'
```

**Example Response**:
```json
{
  "success": true,
  "batchId": "123e4567-e89b-12d3-a456-426614174000",
  "results": {
    "processed": 1,
    "successful": 1,
    "failed": 0,
    "errorCount": 0
  },
  "message": "Processed 1 assets with 1 successful and 0 failed"
}
```

### 2. Tenable Vulnerability Ingestion

#### POST /api/ingestion/tenable/vulnerabilities

**Purpose**: Imports vulnerability scan results from Tenable scanners.

**Request Format**:
```typescript
interface TenableVulnerabilityRequest {
  vulnerabilities: Array<{
    plugin_id: string | number;   // Required: Tenable plugin identifier
    plugin_name: string;          // Required: Vulnerability name
    asset_uuid: string;           // Required: Associated asset UUID
    severity: string | number;    // Required: Severity level
    cvss_base_score?: number;     // Optional: CVSS base score (0-10)
    cvss_vector?: string;         // Optional: CVSS vector string
    description?: string;         // Optional: Vulnerability description
    solution?: string;            // Optional: Remediation guidance
    state?: string;              // Optional: Open/Fixed/Accepted/False Positive
    first_found?: string;        // Optional: ISO date string
    last_found?: string;         // Optional: ISO date string
    cves?: string[];             // Optional: Array of CVE identifiers
    references?: Array<{         // Optional: External references
      name: string;
      url: string;
    }>;
  }>;
}
```

**Example Request**:
```bash
curl -X POST \
  https://your-domain.com/api/ingestion/tenable/vulnerabilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{
    "vulnerabilities": [
      {
        "plugin_id": "19506",
        "plugin_name": "Nessus SYN scanner",
        "asset_uuid": "550e8400-e29b-41d4-a716-446655440000",
        "severity": "Medium",
        "cvss_base_score": 5.0,
        "cvss_vector": "AV:N/AC:L/Au:N/C:P/I:N/A:N",
        "description": "This plugin performs a SYN scan of the remote host.",
        "solution": "Filter incoming traffic to this port.",
        "state": "Open",
        "first_found": "2023-01-15T10:30:00Z",
        "last_found": "2023-12-01T15:45:00Z",
        "cves": ["CVE-2023-1234", "CVE-2023-5678"]
      }
    ]
  }'
```

### 3. Xacta System Ingestion

#### POST /api/ingestion/xacta/systems

**Purpose**: Imports system information from Xacta compliance management platform.

**Request Format**:
```typescript
interface XactaSystemRequest {
  systems: Array<{
    system_id: string;                    // Required: Unique system identifier
    name: string;                         // Required: System name
    uuid?: string;                        // Optional: System UUID
    status?: string;                      // Optional: System status
    authorization_boundary?: string;      // Optional: Authorization boundary
    system_type?: string;                // Optional: System classification
    responsible_organization?: string;    // Optional: Owning organization
    system_owner?: string;               // Optional: System owner name
    isso?: string;                       // Optional: Info System Security Officer
    authorizing_official?: string;       // Optional: Authorizing Official
    last_assessment_date?: string;       // Optional: ISO date string
    authorization_date?: string;         // Optional: ISO date string
    authorization_termination_date?: string; // Optional: ISO date string
    impact_levels?: {                    // Optional: System impact levels
      confidentiality_impact: 'Low' | 'Moderate' | 'High';
      integrity_impact: 'Low' | 'Moderate' | 'High';
      availability_impact: 'Low' | 'Moderate' | 'High';
    };
  }>;
}
```

### 4. Xacta Control Ingestion

#### POST /api/ingestion/xacta/controls

**Purpose**: Imports security control assessments from Xacta.

**Request Format**:
```typescript
interface XactaControlRequest {
  controls: Array<{
    control_id: string;                   // Required: Control identifier (e.g., "AC-1")
    control_title?: string;               // Optional: Control title
    family?: string;                      // Optional: Control family
    implementation_status?: string;       // Optional: Implementation status
    assessment_status?: string;           // Optional: Assessment status
    control_origination?: string;         // Optional: Control origination
    implementation_guidance?: string;     // Optional: Implementation guidance
    assessment_procedures?: string;       // Optional: Assessment procedures
    system_id?: string;                  // Optional: Associated system
    responsible_role?: string;           // Optional: Responsible role
    last_assessed?: string;              // Optional: ISO date string
    next_assessment_due?: string;        // Optional: ISO date string
    findings?: Array<{                   // Optional: Assessment findings
      finding_id: string;
      finding_type: string;
      severity: string;
      description: string;
      recommendation: string;
      status: string;
      identified_date?: string;
      target_resolution_date?: string;
    }>;
    evidence?: Array<{                   // Optional: Control evidence
      evidence_type: string;
      evidence_description: string;
      document_reference?: string;
      collection_date?: string;
      evidence_status?: string;
    }>;
  }>;
}
```

### 5. Xacta POAM Ingestion

#### POST /api/ingestion/xacta/poams

**Purpose**: Imports Plan of Action and Milestones from Xacta.

**Request Format**:
```typescript
interface XactaPoamRequest {
  poams: Array<{
    poam_id: string;                     // Required: POAM identifier
    system_id?: string;                  // Optional: Associated system
    weakness_description?: string;       // Optional: Weakness description
    weakness_detection_source?: string;  // Optional: Detection source
    remediation_plan?: string;           // Optional: Remediation plan
    resources_required?: string;         // Optional: Required resources
    scheduled_completion?: string;       // Optional: ISO date string
    milestone_changes?: string;          // Optional: Milestone changes
    source_of_discovery?: string;        // Optional: Discovery source
    status?: string;                     // Optional: POAM status
    comments?: string;                   // Optional: Comments
    weakness_risk_level?: string;        // Optional: Risk level
    likelihood?: string;                 // Optional: Likelihood rating
    impact?: string;                     // Optional: Impact rating
    impact_description?: string;         // Optional: Impact description
    residual_risk_level?: string;        // Optional: Residual risk
    recommendations?: string;            // Optional: Recommendations
    risk_rating?: string;               // Optional: Overall risk rating
    milestones?: Array<{                // Optional: POAM milestones
      milestone_id: string;
      milestone_description: string;
      scheduled_completion?: string;
      actual_completion?: string;
      status: string;
      comments?: string;
    }>;
    affected_assets?: string[];         // Optional: Array of asset UUIDs
    cves?: string[];                    // Optional: Array of CVE identifiers
  }>;
}
```

### 6. Batch Status Monitoring

#### GET /api/ingestion/batch/:batchId/status

**Purpose**: Retrieves detailed status information for a specific ingestion batch.

**Parameters**:
- `batchId` (path): UUID of the ingestion batch

**Response Format**:
```typescript
interface BatchStatusResponse {
  success: boolean;
  batch: {
    id: number;
    batchId: string;                    // UUID
    sourceSystem: string;               // tenable/xacta
    batchType: string;                  // assets/vulnerabilities/systems/controls/poams
    fileName?: string;                  // Original file name
    totalRecords?: number;              // Expected record count
    successfulRecords: number;          // Successfully processed
    failedRecords: number;              // Failed to process
    status: string;                     // in_progress/completed/failed/cancelled
    startedAt: string;                  // ISO date string
    completedAt?: string;               // ISO date string
    errorDetails?: string;              // Error description if failed
    createdBy: number;                  // User ID who initiated
    metadata?: any;                     // Additional metadata
    processingTimeSeconds?: number;     // Processing duration
  };
  errors?: Array<{                      // Associated errors if any
    id: number;
    tableName: string;
    recordIdentifier: string;
    errorType: string;
    errorMessage: string;
    createdAt: string;
  }>;
}
```

### 7. System Statistics

#### GET /api/ingestion/statistics

**Purpose**: Provides comprehensive system-wide ingestion statistics.

**Query Parameters**:
- `startDate` (optional): ISO date string for filtering
- `endDate` (optional): ISO date string for filtering
- `sourceSystem` (optional): Filter by source system (tenable/xacta)

**Response Format**:
```typescript
interface StatisticsResponse {
  success: boolean;
  statistics: {
    totalBatches: number;
    successfulBatches: number;
    failedBatches: number;
    totalAssets: number;
    totalVulnerabilities: number;
    totalControls: number;
    totalPoams: number;
    averageProcessingTime: number;      // In seconds
    lastIngestionDate: string;          // ISO date string
    systemBreakdown: {
      tenable: {
        batches: number;
        assets: number;
        vulnerabilities: number;
      };
      xacta: {
        batches: number;
        systems: number;
        controls: number;
        poams: number;
      };
    };
    vulnerabilityBySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    recentActivity: Array<{
      date: string;                     // ISO date string
      batches: number;
      records: number;
      successRate: number;              // Percentage
    }>;
  };
}
```

### 8. Error Reporting

#### GET /api/ingestion/errors

**Purpose**: Retrieves ingestion errors with filtering and pagination.

**Query Parameters**:
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 50): Records per page
- `batchId` (optional): Filter by specific batch
- `tableName` (optional): Filter by table name
- `errorType` (optional): Filter by error type
- `startDate` (optional): ISO date string for date range
- `endDate` (optional): ISO date string for date range

**Response Format**:
```typescript
interface ErrorsResponse {
  success: boolean;
  errors: Array<{
    id: number;
    batchId: string;
    tableName: string;
    recordIdentifier: string;
    errorType: string;
    errorMessage: string;
    rawData: any;                       // Original data that failed
    createdAt: string;                  // ISO date string
  }>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
  };
}
```

## Error Response Formats

### Validation Errors (400 Bad Request)
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "assets[0].id",
      "message": "Required field is missing",
      "value": null
    },
    {
      "field": "assets[1].severity",
      "message": "Must be one of: Critical, High, Medium, Low, Info",
      "value": "Unknown"
    }
  ],
  "message": "Request body does not match expected schema"
}
```

### Authentication Errors (401 Unauthorized)
```json
{
  "error": "Authentication required",
  "message": "Valid authentication token is required"
}
```

### Authorization Errors (403 Forbidden)
```json
{
  "error": "Insufficient permissions",
  "message": "User does not have permission to access ingestion endpoints"
}
```

### Resource Not Found (404 Not Found)
```json
{
  "error": "Batch not found",
  "message": "No batch found with ID: 123e4567-e89b-12d3-a456-426614174000"
}
```

### Rate Limiting (429 Too Many Requests)
```json
{
  "error": "Rate limit exceeded",
  "message": "Maximum 100 requests per minute exceeded",
  "retryAfter": 60
}
```

### Server Errors (500 Internal Server Error)
```json
{
  "error": "Internal server error",
  "message": "Database connection failed",
  "requestId": "req_123456789"
}
```

## Usage Examples

### Complete Integration Example
```typescript
// Example: Integrating Tenable data import
class TenableIntegration {
  private apiBaseUrl = 'https://your-domain.com/api/ingestion';
  private authToken = 'your-jwt-token';

  async importTenableData(exportFile: any) {
    try {
      // Import assets first
      const assetResponse = await fetch(`${this.apiBaseUrl}/tenable/assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ assets: exportFile.assets })
      });

      const assetResult = await assetResponse.json();
      console.log('Asset import:', assetResult);

      // Monitor asset import progress
      await this.monitorBatch(assetResult.batchId);

      // Import vulnerabilities after assets are processed
      const vulnResponse = await fetch(`${this.apiBaseUrl}/tenable/vulnerabilities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({ vulnerabilities: exportFile.vulnerabilities })
      });

      const vulnResult = await vulnResponse.json();
      console.log('Vulnerability import:', vulnResult);

      return {
        assetBatch: assetResult.batchId,
        vulnerabilityBatch: vulnResult.batchId
      };

    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  async monitorBatch(batchId: string) {
    let completed = false;
    
    while (!completed) {
      const response = await fetch(`${this.apiBaseUrl}/batch/${batchId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      const status = await response.json();
      
      if (status.batch.status === 'completed' || status.batch.status === 'failed') {
        completed = true;
        console.log('Batch completed:', status.batch);
      } else {
        console.log('Batch in progress...', status.batch.status);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }
    }
  }
}
```

## Performance and Rate Limiting

### Request Limits
- **Rate Limit**: 100 requests per minute per user
- **Payload Size**: Maximum 50MB per request
- **Batch Size**: Recommended maximum 10,000 records per batch
- **Concurrent Batches**: Maximum 5 concurrent ingestion batches per user

### Optimization Guidelines
- Use batch processing for large datasets
- Monitor batch status instead of synchronous processing
- Implement retry logic with exponential backoff
- Use pagination for large result sets
- Cache authentication tokens to avoid repeated auth calls

---

This comprehensive API specification provides everything needed to integrate with the Data Ingestion system, including complete request/response formats, error handling, and practical usage examples.