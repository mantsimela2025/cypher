# STIG Management Services and Controllers

## Overview

This document provides comprehensive documentation of all service layer functions and controller methods in the STIG Management system. The architecture follows a service-oriented pattern with clear separation between business logic (services) and HTTP request handling (controllers/routes).

## Service Architecture

### Core Service: StigService
**Location**: `server/services/StigService.ts`  
**Purpose**: Primary business logic for all STIG management operations  
**Extends**: `BaseService` (provides common database operations)

## StigService Methods

### STIG Mapping and Selection

#### `selectSTIGsForAsset(asset: any)`
**Purpose**: Analyze asset metadata and return applicable STIGs with priority scoring

**Parameters**:
- `asset`: Asset object containing OS, applications, services, and metadata

**Returns**: 
```typescript
Promise<Array<{
  stig: StigMapping, 
  priority: number, 
  reason: string, 
  confidence: number
}>>
```

**Logic Flow**:
1. **Primary OS STIG** (Priority 1, Confidence 100%): Maps operating system to base hardening STIGs
2. **Application STIGs** (Priority 2, Confidence 90-95%): Maps detected services and software to application-specific STIGs
3. **Role-based STIGs** (Priority 2, Confidence 80%): Maps system role (web server, database, etc.) to functional STIGs
4. **Cloud STIGs** (Priority 3, Confidence 75%): Maps cloud provider to cloud-specific hardening STIGs
5. **Deduplication**: Removes duplicate STIG assignments, keeping highest confidence mappings
6. **Sorting**: Orders by priority (ascending) then confidence (descending)

**Example Usage**:
```typescript
const asset = {
  operatingSystem: 'Windows Server 2019',
  osVersion: '10.0.17763',
  services: [{ name: 'IIS' }],
  systemRole: 'web_server',
  cloudProvider: 'AWS'
};
const applicableSTIGs = await stigService.selectSTIGsForAsset(asset);
```

#### `mapOperatingSystemToSTIG(os: string, version?: string)`
**Purpose**: Find STIGs applicable to specific operating system and version

**Parameters**:
- `os`: Operating system name (Windows 10, Ubuntu 20.04, etc.)
- `version`: Optional OS version for compatibility filtering

**Returns**: `Promise<StigMapping[]>`

**Logic**: Uses fuzzy matching on `operating_system` field, filters by version compatibility if provided

#### `mapServiceToSTIG(service: any)` / `mapApplicationToSTIG(application: any)`
**Purpose**: Map detected services/applications to applicable STIGs

**Parameters**:
- `service`/`application`: Service object or string containing service/application name

**Returns**: `Promise<StigMapping[]>`

**Logic**: Fuzzy matches against `application_name` field in STIG mappings

#### `mapRoleToSTIG(role: string)` / `mapCloudToSTIG(cloudProvider: string)`
**Purpose**: Map system roles or cloud providers to specialized STIGs

**Returns**: `Promise<StigMapping[]>`

**Logic**: Matches against `system_type` or `application_name` fields respectively

#### `isVersionCompatible(assetVersion: string, stigVersion: string)`
**Purpose**: Check if asset version is compatible with STIG version requirements

**Logic**: Compares major version numbers for basic compatibility

### STIG Download Management

#### `downloadSTIG(stigId: string, stigTitle: string)`
**Purpose**: Download STIG files from official DISA sources with caching

**Parameters**:
- `stigId`: Official STIG identifier
- `stigTitle`: Human-readable STIG title

**Returns**: `Promise<StigDownload | null>`

**Logic Flow**:
1. **Check Existing**: Verify if STIG is already downloaded or in progress
2. **File Verification**: Check if cached file still exists and is valid
3. **Download Record**: Create/update download tracking record
4. **URL Discovery**: Find official download URL from DISA portal
5. **File Download**: Download and store file locally
6. **Integrity Check**: Calculate checksum and verify file size
7. **Status Update**: Mark download as completed with metadata

**Error Handling**: Updates status to 'failed' with error details on any failure

#### `findSTIGDownloadURL(stigId: string, stigTitle: string)`
**Purpose**: Locate official download URL for STIG from DISA portal

**Returns**: `Promise<string | null>`

**Logic**: Scrapes DISA public portal using stigId/title to find current download links

#### `downloadFile(url: string, stigId: string)`
**Purpose**: Download file from URL to local storage

**Returns**: `Promise<string>` (local file path)

**Logic**: Downloads to structured directory (`uploads/stigs/{stigId}/`) with proper file naming

#### `updateDownloadStatus(stigId: string, status: DownloadStatus, error?: string)`
**Purpose**: Update download status and error information

**Parameters**:
- `stigId`: STIG identifier
- `status`: New download status (pending, downloading, completed, failed)
- `error`: Optional error message for failed downloads

### Collection Management

#### `createCollection(collectionData: InsertStigCollection)`
**Purpose**: Create new STIG collection for organizing assets

**Parameters**:
- `collectionData`: Collection information (name, description, settings)

**Returns**: `Promise<StigCollection>`

**Logic**: Generates UUID, sets timestamps, inserts with default settings

**Example**:
```typescript
const collection = await stigService.createCollection({
  name: 'Production Web Servers',
  description: 'All production web servers requiring STIG compliance',
  createdBy: 'admin',
  settings: {
    autoAssignSTIGs: true,
    defaultEnvironment: 'production'
  }
});
```

#### `getCollections(userId?: string)`
**Purpose**: Retrieve collections, optionally filtered by user

**Returns**: `Promise<StigCollection[]>`

**Logic**: Queries collections ordered by creation date, filters by user if specified

#### `getCollectionById(id: string)`
**Purpose**: Get specific collection by ID

**Returns**: `Promise<StigCollection | null>`

#### `getCollectionAssets(collectionId: string)`
**Purpose**: Get all assets within a specific collection

**Returns**: `Promise<StigAsset[]>`

### Asset Management

#### `createSTIGAssetFromAsset(collectionId: string, assetData: any)`
**Purpose**: Create STIG-managed asset from existing asset inventory

**Parameters**:
- `collectionId`: Target collection UUID
- `assetData`: Asset information from asset inventory system

**Returns**: `Promise<StigAsset>`

**Logic Flow**:
1. **Data Mapping**: Maps asset inventory fields to STIG asset schema
2. **Asset Creation**: Inserts new STIG asset record
3. **Auto-Assignment**: Automatically assigns applicable STIGs based on asset metadata
4. **Return**: Returns created asset with assignments

**Field Mapping**:
```typescript
{
  name: assetData.name || assetData.hostname,
  hostname: assetData.hostname,
  ipAddress: assetData.ipAddress,
  operatingSystem: assetData.operatingSystem,
  osVersion: assetData.osVersion,
  assetType: assetData.assetType,
  systemRole: assetData.systemRole,
  environment: assetData.environment,
  criticality: assetData.criticality,
  labels: assetData.labels || [],
  metadata: assetData.metadata || {}
}
```

#### `autoAssignSTIGsToAsset(assetId: string, assetData: any)`
**Purpose**: Automatically assign applicable STIGs to asset based on metadata analysis

**Logic**: 
1. Calls `selectSTIGsForAsset()` to identify applicable STIGs
2. Creates assignment records for each applicable STIG
3. Sets priority based on STIG analysis results

#### `assignSTIGToAsset(assetId: string, stigId: string, stigTitle: string, priority: number = 2)`
**Purpose**: Manually assign specific STIG to asset

**Logic**: Creates assignment record with conflict resolution (prevents duplicates)

### STIG Rules and Reviews

#### `parseAndStoreSTIGRules(stigId: string, filePath: string)`
**Purpose**: Parse downloaded STIG files and extract individual rules/controls

**Returns**: `Promise<number>` (number of rules processed)

**Logic**: 
- Parses XCCDF (XML) format STIG files
- Extracts rule metadata (ID, title, severity, description, check/fix text)
- Stores individual rules in `stig_rules` table
- Maps CCI and NIST control references

**Note**: Implementation placeholder - would require full XCCDF parser

#### `createSTIGReview(reviewData: InsertStigReview)`
**Purpose**: Create compliance review record for STIG rule

**Logic**: Links asset, rule, and reviewer with status tracking

#### `updateSTIGReview(reviewId: string, updates: Partial<StigReview>)`
**Purpose**: Update existing review status, findings, or comments

### Initialization and Management

#### `initializeDefaultSTIGMappings()`
**Purpose**: Populate STIG mappings table with essential government/enterprise STIGs

**Logic Flow**:
1. **Clear Existing**: Removes any existing mappings (for clean initialization)
2. **OS STIGs**: Creates mappings for Windows 10/11, Server 2019/2022, Ubuntu 20.04/22.04, RHEL 8
3. **Application STIGs**: Creates mappings for Apache HTTP Server, Microsoft IIS, SQL Server
4. **Priority Assignment**: Sets Priority 1 for OS STIGs, Priority 2 for application STIGs
5. **Confidence Scoring**: Sets confidence scores (100% for OS, 95% for applications)

**STIG Mappings Created**:
```typescript
// Windows Operating Systems
{ operatingSystem: 'Windows 10', stigId: 'WN10-00-000001', stigTitle: 'Microsoft Windows 10 STIG', priority: 1 }
{ operatingSystem: 'Windows 11', stigId: 'WN11-00-000001', stigTitle: 'Microsoft Windows 11 STIG', priority: 1 }
{ operatingSystem: 'Windows Server 2019', stigId: 'WN19-00-000001', stigTitle: 'Microsoft Windows Server 2019 STIG', priority: 1 }
{ operatingSystem: 'Windows Server 2022', stigId: 'WN22-00-000001', stigTitle: 'Microsoft Windows Server 2022 STIG', priority: 1 }

// Linux Operating Systems  
{ operatingSystem: 'Ubuntu 20.04', stigId: 'UBTU-20-000001', stigTitle: 'Canonical Ubuntu 20.04 LTS STIG', priority: 1 }
{ operatingSystem: 'Ubuntu 22.04', stigId: 'UBTU-22-000001', stigTitle: 'Canonical Ubuntu 22.04 LTS STIG', priority: 1 }
{ operatingSystem: 'Red Hat Enterprise Linux 8', stigId: 'RHEL-08-000001', stigTitle: 'Red Hat Enterprise Linux 8 STIG', priority: 1 }

// Application STIGs
{ applicationName: 'Apache HTTP Server', stigId: 'APCH-24-000001', stigTitle: 'Apache Server 2.4 STIG', priority: 2 }
{ applicationName: 'Microsoft IIS', stigId: 'IISW-10-000001', stigTitle: 'Microsoft IIS 10.0 Server STIG', priority: 2 }
{ applicationName: 'Microsoft SQL Server', stigId: 'MS19-00-000001', stigTitle: 'Microsoft SQL Server 2019 Instance STIG', priority: 2 }
```

#### `getAvailableSTIGs()`
**Purpose**: Get all available STIG mappings for manual assignment

**Returns**: `Promise<StigMapping[]>`

**Logic**: Returns all STIG mappings ordered by priority and title

## Controller/Routes Architecture

### Route File: stigRoutes.ts
**Location**: `server/routes/stigRoutes.ts`  
**Purpose**: HTTP request handling and API endpoint definitions

## API Route Endpoints

### Collection Management Routes

#### `GET /api/stig/collections`
**Purpose**: Get all STIG collections  
**Authentication**: Required  
**Response**: Array of StigCollection objects  
**Error Handling**: 500 on database errors  

#### `POST /api/stig/collections`
**Purpose**: Create new STIG collection  
**Body Validation**: `insertStigCollectionSchema`  
**Required Fields**: `name`  
**Optional Fields**: `description`, `createdBy`, `settings`  
**Response**: Created StigCollection object  
**Error Handling**: 400 for validation errors, 500 for database errors  

#### `GET /api/stig/collections/:id`
**Purpose**: Get specific collection by ID  
**Response**: StigCollection object or 404 if not found  

#### `GET /api/stig/collections/:id/assets`
**Purpose**: Get all assets in specific collection  
**Response**: Array of StigAsset objects  

### Asset Management Routes

#### `POST /api/stig/collections/:collectionId/assets`
**Purpose**: Add asset to STIG collection  
**Body Validation**: `insertStigAssetSchema`  
**Logic**: Creates STIG asset and auto-assigns applicable STIGs  
**Response**: Created StigAsset object  

#### `POST /api/stig/assets/:assetId/assign-stig`
**Purpose**: Manually assign STIG to specific asset  
**Body**: `{ stigId: string, stigTitle: string, priority?: number }`  
**Response**: Success confirmation  

### STIG Management Routes

#### `POST /api/stig/initialize`
**Purpose**: Initialize default STIG mappings  
**Logic**: Calls `initializeDefaultSTIGMappings()`  
**Response**: Success message with count of mappings created  
**Use Case**: System setup and demonstration  

#### `GET /api/stig/mappings`
**Purpose**: Get available STIG mappings  
**Query Parameters**: 
- `operatingSystem`: Filter by OS
- `applicationName`: Filter by application
- `priority`: Filter by priority level
**Response**: Array of StigMapping objects  

#### `POST /api/stig/download/:stigId`
**Purpose**: Download STIG from official sources  
**Parameters**: `stigId` - STIG identifier  
**Logic**: Initiates STIG download process  
**Response**: Download status and details  

### Review Management Routes

#### `POST /api/stig/reviews`
**Purpose**: Create STIG compliance review  
**Body Validation**: `insertStigReviewSchema`  
**Required Fields**: `assetId`, `ruleId`, `status`, `result`  
**Response**: Created StigReview object  

#### `PUT /api/stig/reviews/:reviewId`
**Purpose**: Update existing review  
**Body**: Partial StigReview object  
**Response**: Updated StigReview object  

### Testing and Integration Routes

#### `POST /api/stig/test-assignment`
**Purpose**: Test STIG assignment logic with real ingested assets  
**Logic**: 
1. Queries sample ingested assets with OS information
2. Analyzes each asset for applicable STIGs
3. Demonstrates assignment logic without creating permanent records
**Response**: Array of assignment test results  
**Use Case**: Validation and demonstration of automatic assignment logic  

## Error Handling Patterns

### Standard Error Responses
```typescript
// Validation Error (400)
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

// Not Found Error (404)
{
  "error": "Collection not found"
}

// Server Error (500)
{
  "error": "Failed to create collection"
}
```

### Logging Strategy
- **Request Logging**: All requests logged with endpoint, method, response time
- **Error Logging**: Detailed error logging with stack traces for debugging
- **Database Logging**: Query logging for performance monitoring
- **Security Logging**: Authentication failures and access attempts

## Integration Points

### Database Integration
- **Drizzle ORM**: Type-safe database operations
- **Transaction Support**: Atomic operations for complex workflows
- **Connection Pooling**: Efficient database connection management

### Asset Inventory Integration
- **Ingestion Assets**: Direct integration with existing asset inventory
- **Metadata Extraction**: Parses asset metadata for STIG assignment
- **Real-Time Sync**: Updates STIG assignments when assets change

### Authentication Integration
- **User Context**: All operations track user authentication
- **Role-Based Access**: Different access levels for collections and reviews
- **Audit Trails**: Complete user activity logging

This service and controller architecture provides a comprehensive, scalable foundation for enterprise STIG management with clear separation of concerns, robust error handling, and extensive integration capabilities.