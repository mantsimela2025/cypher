# STIG Management API Routes

## Overview

This document provides comprehensive API documentation for all STIG Management endpoints. All routes are prefixed with `/api/stig` and require authentication unless otherwise noted.

## Base URL Structure
```
Protocol: HTTP/HTTPS
Base Path: /api/stig
Authentication: Required (session-based)
Content-Type: application/json
```

## Collection Management Routes

### Get All Collections
```http
GET /api/stig/collections
```

**Description**: Retrieve all STIG collections accessible to the current user

**Authentication**: Required

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Production Web Servers", 
    "description": "All production web servers requiring STIG compliance",
    "createdBy": "admin",
    "isActive": true,
    "settings": {
      "autoAssignSTIGs": true,
      "defaultEnvironment": "production"
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
]
```

**Error Responses**:
- `500`: Database connection or query error

### Create New Collection
```http
POST /api/stig/collections
```

**Description**: Create a new STIG collection for organizing assets

**Request Body**:
```json
{
  "name": "Development Environment",
  "description": "Non-production systems for testing STIG implementations", 
  "createdBy": "dev_team",
  "settings": {
    "autoAssignSTIGs": true,
    "defaultEnvironment": "development",
    "notifications": {
      "onAssignment": true,
      "onCompletion": false
    }
  }
}
```

**Required Fields**: `name`

**Response**:
```json
{
  "id": "generated-uuid",
  "name": "Development Environment",
  "description": "Non-production systems for testing STIG implementations",
  "createdBy": "dev_team",
  "isActive": true,
  "settings": { /* as provided */ },
  "createdAt": "2025-01-15T10:35:00Z",
  "updatedAt": "2025-01-15T10:35:00Z"
}
```

**Error Responses**:
- `400`: Validation error (missing required fields, invalid data types)
- `500`: Database error during creation

### Get Collection by ID
```http
GET /api/stig/collections/{collectionId}
```

**Parameters**:
- `collectionId`: UUID of the collection

**Response**: Single collection object (same format as above)

**Error Responses**:
- `404`: Collection not found
- `500`: Database error

### Get Collection Assets
```http
GET /api/stig/collections/{collectionId}/assets
```

**Description**: Retrieve all assets within a specific collection

**Response**:
```json
[
  {
    "id": "asset-uuid",
    "collectionId": "collection-uuid",
    "assetId": 123,
    "name": "web01-prod",
    "hostname": "web01.company.com",
    "ipAddress": "192.168.1.100",
    "operatingSystem": "Ubuntu 22.04",
    "osVersion": "22.04.3",
    "assetType": "server",
    "systemRole": "web_server",
    "environment": "production",
    "criticality": "high",
    "labels": ["production", "web", "frontend"],
    "metadata": {
      "datacenter": "us-east-1",
      "businessUnit": "engineering"
    },
    "lastScan": "2025-01-15T09:00:00Z",
    "createdAt": "2025-01-15T08:00:00Z",
    "updatedAt": "2025-01-15T09:00:00Z"
  }
]
```

## Asset Management Routes

### Add Asset to Collection
```http
POST /api/stig/collections/{collectionId}/assets
```

**Description**: Create STIG asset from existing asset inventory and auto-assign applicable STIGs

**Request Body**:
```json
{
  "assetId": 123,
  "name": "db01-prod",
  "hostname": "db01.company.com", 
  "ipAddress": "192.168.1.200",
  "operatingSystem": "Windows Server 2019",
  "osVersion": "10.0.17763",
  "assetType": "server",
  "systemRole": "database_server",
  "environment": "production",
  "criticality": "critical",
  "labels": ["production", "database", "sql-server"],
  "metadata": {
    "services": ["SQL Server 2019"],
    "databases": ["CustomerDB", "InventoryDB"]
  }
}
```

**Logic**: 
1. Creates STIG asset record
2. Automatically analyzes asset metadata
3. Assigns applicable STIGs based on OS, applications, and role
4. Returns created asset with assignment information

**Response**: Created StigAsset object

**Error Responses**:
- `400`: Validation error (required fields, invalid data)
- `500`: Database error or auto-assignment failure

### Analyze Asset for STIGs
```http
POST /api/stig/assets/analyze
```

**Description**: Analyze asset metadata and return applicable STIGs without creating records

**Request Body**:
```json
{
  "operatingSystem": "Windows Server 2022",
  "osVersion": "10.0.20348",
  "services": [
    {"name": "IIS"},
    {"name": "SQL Server"}
  ],
  "systemRole": "web_server",
  "cloudProvider": "AWS",
  "environment": "production"
}
```

**Response**:
```json
[
  {
    "stig": {
      "id": 1,
      "operatingSystem": "Windows Server 2022",
      "stigId": "WN22-00-000001",
      "stigTitle": "Microsoft Windows Server 2022 STIG",
      "priority": 1,
      "confidenceScore": 100
    },
    "priority": 1,
    "reason": "Primary operating system hardening",
    "confidence": 100
  },
  {
    "stig": {
      "id": 8,
      "applicationName": "Microsoft IIS", 
      "stigId": "IISW-10-000001",
      "stigTitle": "Microsoft IIS 10.0 Server STIG",
      "priority": 2,
      "confidenceScore": 95
    },
    "priority": 2,
    "reason": "Application hardening for IIS",
    "confidence": 95
  }
]
```

**Use Cases**:
- Preview STIG assignments before creating assets
- Testing assignment logic
- Integration validation

### Get Asset Reviews
```http
GET /api/stig/assets/{assetId}/reviews?stigId={stigId}
```

**Description**: Get compliance reviews for specific asset, optionally filtered by STIG

**Query Parameters**:
- `stigId` (optional): Filter reviews for specific STIG

**Response**:
```json
[
  {
    "id": "review-uuid",
    "assetId": "asset-uuid",
    "ruleId": "rule-uuid", 
    "stigId": "WN22-00-000001",
    "reviewerId": "user123",
    "status": "open",
    "result": "fail",
    "detail": "Password policy not configured according to STIG requirements",
    "comment": "Requires GPO update to enforce minimum password length",
    "severity": "CAT II",
    "isSubmitted": false,
    "reviewDate": "2025-01-15T14:30:00Z",
    "metadata": {
      "findingCategory": "configuration",
      "remediation_effort": "low"
    }
  }
]
```

## STIG Download Management Routes

### Download STIG
```http
POST /api/stig/stigs/{stigId}/download
```

**Description**: Download STIG files from official DISA sources

**Parameters**:
- `stigId`: Official STIG identifier (e.g., WN22-00-000001)

**Request Body**:
```json
{
  "stigTitle": "Microsoft Windows Server 2022 STIG"
}
```

**Response**:
```json
{
  "id": "download-uuid",
  "stigId": "WN22-00-000001",
  "stigTitle": "Microsoft Windows Server 2022 STIG",
  "version": "V1R4",
  "downloadStatus": "completed",
  "localPath": "/uploads/stigs/WN22-00-000001/stig_file.zip",
  "fileSize": 2048576,
  "checksum": "sha256:abc123def456...",
  "downloadedAt": "2025-01-15T15:00:00Z"
}
```

**Status Values**:
- `pending`: Queued for download
- `downloading`: In progress
- `completed`: Successfully downloaded
- `failed`: Download failed

**Error Responses**:
- `400`: Missing stigTitle in request body
- `404`: STIG not found or download failed
- `500`: Server error during download

## STIG Review Management Routes

### Create or Update Review
```http
POST /api/stig/reviews
```

**Description**: Create new compliance review or update existing review

**Request Body**:
```json
{
  "assetId": "asset-uuid",
  "ruleId": "rule-uuid",
  "stigId": "WN22-00-000001",
  "reviewerId": "user123",
  "status": "not_a_finding",
  "result": "pass",
  "detail": "Password policy properly configured via Group Policy",
  "comment": "Verified configuration meets STIG requirements",
  "severity": "CAT II",
  "metadata": {
    "evidenceFiles": ["screenshot.png", "gpo_export.xml"],
    "verificationMethod": "manual_inspection"
  }
}
```

**Status Values**:
- `not_reviewed`: Not yet reviewed
- `open`: Finding identified, requires remediation
- `not_a_finding`: Compliant with STIG requirement
- `not_applicable`: STIG requirement doesn't apply to this asset

**Result Values**:
- `pass`: Meets STIG requirement
- `fail`: Does not meet STIG requirement  
- `unknown`: Unable to determine compliance

**Response**: Created or updated StigReview object

**Error Responses**:
- `400`: Validation error (missing required fields, invalid status/result values)
- `500`: Database error

## STIG Library and Management Routes

### Initialize STIG Mappings
```http
POST /api/stig/initialize
```

**Description**: Initialize the STIG mappings database with essential government/enterprise STIGs

**Authentication**: Admin required

**Logic**:
1. Clears existing STIG mappings
2. Creates 10 essential STIG mappings:
   - Windows 10, 11, Server 2019, Server 2022
   - Ubuntu 20.04, 22.04
   - Red Hat Enterprise Linux 8
   - Apache HTTP Server 2.4
   - Microsoft IIS 10.0
   - Microsoft SQL Server 2019

**Response**:
```json
{
  "message": "STIG mappings initialized successfully"
}
```

**Error Responses**:
- `500`: Database error during initialization

### Test STIG Assignment Logic
```http
POST /api/stig/test-assignment
```

**Description**: Test automatic STIG assignment using real ingested assets from asset inventory

**Logic**:
1. Queries 5 sample assets from `ingestion_assets` table
2. Extracts operating system information from asset metadata
3. Runs STIG assignment analysis on each asset
4. Returns assignment results without creating permanent records

**Response**:
```json
{
  "message": "STIG assignment test completed",
  "totalAssetsTested": 5,
  "results": [
    {
      "hostname": "dc01.company.com",
      "operatingSystem": "Windows Server 2019",
      "criticality": "critical",
      "assignedSTIGs": [
        {
          "stigId": "WN19-00-000001",
          "stigTitle": "Microsoft Windows Server 2019 STIG",
          "priority": 1,
          "reason": "Primary operating system hardening"
        }
      ]
    },
    {
      "hostname": "web01.company.com", 
      "operatingSystem": "Ubuntu 22.04",
      "criticality": "high",
      "assignedSTIGs": [
        {
          "stigId": "UBTU-22-000001",
          "stigTitle": "Canonical Ubuntu 22.04 LTS STIG",
          "priority": 1,
          "reason": "Primary operating system hardening"
        }
      ]
    }
  ]
}
```

**Use Cases**:
- Validate assignment logic with real enterprise assets
- Demonstrate STIG management capabilities
- Test integration with asset inventory system

**Error Responses**:
- `500`: Database query error or assignment logic failure

## Error Response Format

All API endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message"
}
```

For validation errors (400 status):
```json
{
  "error": [
    {
      "code": "invalid_type",
      "expected": "string", 
      "received": "undefined",
      "path": ["name"],
      "message": "Required"
    }
  ]
}
```

## Rate Limiting and Quotas

- **Collection Operations**: No specific limits
- **Asset Operations**: 100 requests per minute per user
- **STIG Downloads**: 10 downloads per hour per user (to respect DISA bandwidth)
- **Bulk Operations**: 500 assets per collection creation

## Authentication Requirements

All endpoints require valid session authentication:

```http
Cookie: connect.sid=s%3A[session-id]
```

### Role-Based Access

- **Admin**: All operations, including initialization and system management
- **ISSO/ISSM**: Collection creation, asset management, review oversight
- **User**: Asset review creation/updates within assigned collections
- **Read-Only**: View collections and assets, no modifications

## Integration Examples

### Bulk Asset Import
```javascript
// Import assets from inventory system
const assets = await getAssetInventory();
const collection = await createCollection({
  name: "Q1 2025 Compliance Review",
  description: "Quarterly compliance assessment"
});

for (const asset of assets) {
  await addAssetToCollection(collection.id, asset);
  // Auto-assignment happens automatically
}
```

### Compliance Dashboard
```javascript
// Get compliance overview
const collections = await getCollections();
const complianceData = [];

for (const collection of collections) {
  const assets = await getCollectionAssets(collection.id);
  
  for (const asset of assets) {
    const reviews = await getAssetReviews(asset.id);
    const compliance = calculateCompliancePercentage(reviews);
    complianceData.push({asset: asset.name, compliance});
  }
}
```

This API provides comprehensive STIG management capabilities with robust error handling, authentication, and integration support for enterprise cybersecurity compliance workflows.