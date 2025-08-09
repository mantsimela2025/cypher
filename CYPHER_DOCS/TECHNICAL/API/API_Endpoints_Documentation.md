# RAS DASH API Endpoints Documentation

## Overview
This document provides comprehensive documentation for all API endpoints in the RAS DASH (Cyber Security as a Service) platform. The API is built using Express.js with TypeScript and follows RESTful conventions.

## Base Configuration
- **Base URL**: `http://localhost:5000` (Development)
- **Authentication**: Session-based with multi-method support (password, PKI certificates)
- **Content Type**: `application/json`
- **Response Format**: JSON

---

## Authentication Endpoints

### Session Management
```typescript
POST /api/login
```
**Description**: Authenticate user and create session
**Body**:
```json
{
  "username": "string",
  "password": "string"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "number",
    "username": "string",
    "role": "string"
  }
}
```

```typescript
POST /api/logout
```
**Description**: End user session
**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

```typescript
GET /api/user
```
**Description**: Get current authenticated user
**Response**:
```json
{
  "id": "number",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "role": "string",
  "authMethod": "string"
}
```

---

## Dashboard Management

### Dashboard CRUD Operations

```typescript
GET /api/dashboards
```
**Description**: Get all dashboards for current user
**Response**:
```json
{
  "dashboards": [
    {
      "id": "number",
      "name": "string",
      "description": "string",
      "isDefault": "boolean",
      "createdBy": "number",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ]
}
```

```typescript
GET /api/dashboards/:id
```
**Description**: Get dashboard by ID with widgets and layout
**Parameters**: 
- `id` (path): Dashboard ID
**Response**:
```json
{
  "dashboard": {
    "id": "number",
    "name": "string",
    "description": "string",
    "layout": "object",
    "isDefault": "boolean",
    "createdBy": "number",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  },
  "widgets": [
    {
      "id": "number",
      "position_x": "number",
      "position_y": "number",
      "width": "number",
      "height": "number",
      "widget_config": "object",
      "metric_id": "number",
      "metric_name": "string",
      "metric_description": "string",
      "chart_type": "string",
      "category": "string"
    }
  ]
}
```

```typescript
POST /api/dashboards
```
**Description**: Create new dashboard
**Body**:
```json
{
  "name": "string",
  "description": "string",
  "layout": "object",
  "widgets": [
    {
      "metricId": "number",
      "positionX": "number",
      "positionY": "number",
      "width": "number",
      "height": "number",
      "config": "object"
    }
  ]
}
```
**Response**:
```json
{
  "id": "number",
  "name": "string",
  "description": "string",
  "layout": "object",
  "createdAt": "timestamp"
}
```

```typescript
PUT /api/dashboards/:id
```
**Description**: Update existing dashboard
**Parameters**: 
- `id` (path): Dashboard ID
**Body**: Same as POST /api/dashboards
**Response**: Updated dashboard object

```typescript
DELETE /api/dashboards/:id
```
**Description**: Delete dashboard
**Parameters**: 
- `id` (path): Dashboard ID
**Response**:
```json
{
  "message": "Dashboard deleted successfully"
}
```

### Dashboard System Data

```typescript
GET /api/dashboard/systems/overview
```
**Description**: Get system overview metrics for dashboard
**Query Parameters**:
- `system` (optional): System name filter
**Response**:
```json
[
  {
    "system_name": "string",
    "total_assets": "number",
    "total_vulnerabilities": "number",
    "critical_vulnerabilities": "number",
    "compliance_score": "number"
  }
]
```

```typescript
GET /api/dashboard/systems/names
```
**Description**: Get distinct system names for dropdown filters
**Response**:
```json
[
  "System Name 1",
  "System Name 2",
  "System Name 3"
]
```

---

## Metrics Management

```typescript
GET /api/metrics
```
**Description**: Get all available metrics for dashboard widgets
**Query Parameters**:
- `category` (optional): Filter by metric category
**Response**:
```json
{
  "metrics": [
    {
      "id": "number",
      "name": "string",
      "description": "string",
      "chart_type": "string",
      "category": "string",
      "sql_query": "string",
      "chart_config": "object",
      "is_active": "boolean"
    }
  ]
}
```

```typescript
POST /api/metrics/:id/execute
```
**Description**: Execute metric query and return data
**Parameters**: 
- `id` (path): Metric ID
**Response**:
```json
{
  "data": "array",
  "executionTime": "number",
  "recordCount": "number"
}
```

---

## Widget Templates

```typescript
GET /api/widget-templates
```
**Description**: Get all widget templates
**Query Parameters**:
- `chartType` (optional): Filter by chart type
**Response**:
```json
{
  "templates": [
    {
      "id": "number",
      "name": "string",
      "description": "string",
      "chart_type": "string",
      "template_config": "object",
      "size_preset": "string",
      "color_scheme": "string",
      "is_system": "boolean"
    }
  ]
}
```

```typescript
POST /api/widget-templates
```
**Description**: Create new widget template
**Body**:
```json
{
  "name": "string",
  "description": "string",
  "chartType": "string",
  "templateConfig": "object",
  "sizePreset": "string",
  "colorScheme": "string"
}
```

```typescript
PUT /api/widget-templates/:id
```
**Description**: Update widget template
**Parameters**: 
- `id` (path): Template ID

```typescript
DELETE /api/widget-templates/:id
```
**Description**: Delete widget template
**Parameters**: 
- `id` (path): Template ID

---

## Dashboard Themes

```typescript
GET /api/dashboard-themes
```
**Description**: Get all dashboard themes
**Response**:
```json
{
  "themes": [
    {
      "id": "number",
      "name": "string",
      "description": "string",
      "theme_config": "object",
      "color_palette": "object",
      "typography": "object",
      "grid_settings": "object",
      "is_system": "boolean"
    }
  ]
}
```

```typescript
GET /api/dashboard-themes/:id
```
**Description**: Get specific dashboard theme
**Parameters**: 
- `id` (path): Theme ID

```typescript
POST /api/dashboard-themes
```
**Description**: Create new dashboard theme
**Body**:
```json
{
  "name": "string",
  "description": "string",
  "themeConfig": "object",
  "colorPalette": "object",
  "typography": "object",
  "gridSettings": "object"
}
```

---

## Asset Management

### Asset Operations

```typescript
GET /api/assets
```
**Description**: Get all assets with pagination and filtering
**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search term
- `system` (optional): System filter
- `criticality` (optional): Criticality filter
**Response**:
```json
{
  "assets": [
    {
      "id": "number",
      "hostname": "string",
      "asset_uuid": "string",
      "system_id": "string",
      "criticality_rating": "string",
      "exposure_score": "number",
      "acr_score": "number",
      "first_seen": "timestamp",
      "last_seen": "timestamp"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

```typescript
GET /api/assets/:id
```
**Description**: Get asset details by ID
**Parameters**: 
- `id` (path): Asset ID
**Response**:
```json
{
  "asset": {
    "id": "number",
    "hostname": "string",
    "asset_uuid": "string",
    "system_id": "string",
    "operating_systems": "array",
    "vulnerabilities": "array",
    "compliance_status": "object"
  }
}
```

```typescript
GET /api/assets/:id/vulnerabilities
```
**Description**: Get vulnerabilities for specific asset
**Parameters**: 
- `id` (path): Asset ID
**Query Parameters**:
- `severity` (optional): Filter by severity
- `status` (optional): Filter by status
**Response**:
```json
{
  "vulnerabilities": [
    {
      "id": "number",
      "vulnerability_name": "string",
      "severity": "string",
      "cvss_score": "number",
      "status": "string",
      "first_found": "timestamp",
      "last_found": "timestamp"
    }
  ]
}
```

---

## Vulnerability Management

### Vulnerability Operations

```typescript
GET /api/vulnerabilities
```
**Description**: Get all vulnerabilities with filtering
**Query Parameters**:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `severity` (optional): Severity filter
- `status` (optional): Status filter
- `asset` (optional): Asset filter
- `system` (optional): System filter
**Response**:
```json
{
  "vulnerabilities": [
    {
      "id": "number",
      "vulnerability_name": "string",
      "severity": "string",
      "cvss_score": "number",
      "status": "string",
      "asset_uuid": "string",
      "system_id": "string",
      "first_found": "timestamp",
      "solution": "string"
    }
  ],
  "summary": {
    "total": "number",
    "critical": "number",
    "high": "number",
    "medium": "number",
    "low": "number"
  }
}
```

```typescript
GET /api/vulnerabilities/:id
```
**Description**: Get vulnerability details
**Parameters**: 
- `id` (path): Vulnerability ID

```typescript
PUT /api/vulnerabilities/:id
```
**Description**: Update vulnerability status
**Parameters**: 
- `id` (path): Vulnerability ID
**Body**:
```json
{
  "status": "string",
  "remediation_notes": "string",
  "assigned_to": "string"
}
```

---

## POAM Management

```typescript
GET /api/poams
```
**Description**: Get all POAMs with filtering
**Query Parameters**:
- `system` (optional): System filter
- `status` (optional): Status filter
- `risk_rating` (optional): Risk rating filter
**Response**:
```json
{
  "poams": [
    {
      "id": "number",
      "poam_id": "string",
      "weakness_description": "string",
      "status": "string",
      "risk_rating": "string",
      "scheduled_completion": "timestamp",
      "poc": "string"
    }
  ]
}
```

```typescript
GET /api/poams/:id
```
**Description**: Get POAM details
**Parameters**: 
- `id` (path): POAM ID

```typescript
PUT /api/poams/:id
```
**Description**: Update POAM
**Parameters**: 
- `id` (path): POAM ID

---

## Compliance & Controls

### Control Management

```typescript
GET /api/controls
```
**Description**: Get all security controls
**Query Parameters**:
- `family` (optional): Control family filter
- `system` (optional): System filter
- `implementation_status` (optional): Status filter
**Response**:
```json
{
  "controls": [
    {
      "id": "number",
      "control_id": "string",
      "control_title": "string",
      "family": "string",
      "implementation_status": "string",
      "assessment_status": "string",
      "system_id": "string"
    }
  ]
}
```

```typescript
GET /api/controls/:id
```
**Description**: Get control details
**Parameters**: 
- `id` (path): Control ID

```typescript
PUT /api/controls/:id
```
**Description**: Update control implementation
**Parameters**: 
- `id` (path): Control ID

---

## STIG Management

### STIG Operations

```typescript
GET /api/stig/collections
```
**Description**: Get all STIG collections
**Response**:
```json
{
  "collections": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "is_active": "boolean",
      "created_at": "timestamp"
    }
  ]
}
```

```typescript
POST /api/stig/collections
```
**Description**: Create new STIG collection
**Body**:
```json
{
  "name": "string",
  "description": "string"
}
```

```typescript
GET /api/stig/mappings
```
**Description**: Get STIG mappings for systems
**Query Parameters**:
- `operating_system` (optional): OS filter
- `application_name` (optional): Application filter
**Response**:
```json
{
  "mappings": [
    {
      "id": "number",
      "operating_system": "string",
      "application_name": "string",
      "stig_id": "string",
      "stig_title": "string",
      "confidence_score": "number"
    }
  ]
}
```

```typescript
GET /api/stig/downloads
```
**Description**: Get STIG download status
**Response**:
```json
{
  "downloads": [
    {
      "id": "string",
      "stig_id": "string",
      "stig_title": "string",
      "download_status": "string",
      "downloaded_at": "timestamp",
      "file_size": "number"
    }
  ]
}
```

```typescript
POST /api/stig/download/:stigId
```
**Description**: Initiate STIG download
**Parameters**: 
- `stigId` (path): STIG identifier

---

## Workflow Management

### Workflow Operations

```typescript
GET /api/workflows
```
**Description**: Get all workflows
**Query Parameters**:
- `category` (optional): Category filter
- `is_active` (optional): Active status filter
**Response**:
```json
{
  "workflows": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "category": "string",
      "is_active": "boolean",
      "is_template": "boolean"
    }
  ]
}
```

```typescript
GET /api/workflows/:id
```
**Description**: Get workflow details with nodes and edges
**Parameters**: 
- `id` (path): Workflow ID

```typescript
POST /api/workflows
```
**Description**: Create new workflow
**Body**:
```json
{
  "name": "string",
  "description": "string",
  "category": "string",
  "workflowData": "object",
  "configuration": "object"
}
```

```typescript
PUT /api/workflows/:id
```
**Description**: Update workflow
**Parameters**: 
- `id` (path): Workflow ID

```typescript
POST /api/workflows/:id/execute
```
**Description**: Execute workflow
**Parameters**: 
- `id` (path): Workflow ID
**Body**:
```json
{
  "executionContext": "object",
  "priority": "string"
}
```

```typescript
GET /api/workflow-instances
```
**Description**: Get workflow execution instances
**Query Parameters**:
- `status` (optional): Status filter
- `workflow_id` (optional): Workflow filter

---

## AI & Natural Language Query

### AI Chat Operations

```typescript
GET /api/ai/chat/sessions
```
**Description**: Get user's chat sessions
**Response**:
```json
{
  "sessions": [
    {
      "id": "string",
      "session_id": "string",
      "title": "string",
      "created_at": "timestamp",
      "last_activity_at": "timestamp",
      "is_active": "boolean"
    }
  ]
}
```

```typescript
POST /api/ai/chat/sessions
```
**Description**: Create new chat session
**Body**:
```json
{
  "title": "string"
}
```

```typescript
GET /api/ai/chat/sessions/:sessionId/messages
```
**Description**: Get messages for chat session
**Parameters**: 
- `sessionId` (path): Session ID

```typescript
POST /api/ai/chat/sessions/:sessionId/messages
```
**Description**: Send message to AI chat
**Parameters**: 
- `sessionId` (path): Session ID
**Body**:
```json
{
  "content": "string",
  "message_type": "user"
}
```
**Response**:
```json
{
  "message": {
    "id": "number",
    "content": "string",
    "sql_query": "string",
    "query_results": "array",
    "processing_time_ms": "number"
  }
}
```

---

## Data Ingestion

### Ingestion Operations

```typescript
GET /api/ingestion/batches
```
**Description**: Get ingestion batch history
**Query Parameters**:
- `source_system` (optional): Source system filter
- `status` (optional): Status filter
**Response**:
```json
{
  "batches": [
    {
      "id": "number",
      "batch_id": "string",
      "source_system": "string",
      "status": "string",
      "total_records": "number",
      "successful_records": "number",
      "failed_records": "number",
      "started_at": "timestamp",
      "completed_at": "timestamp"
    }
  ]
}
```

```typescript
POST /api/ingestion/start
```
**Description**: Start new ingestion batch
**Body**:
```json
{
  "source_system": "string",
  "batch_type": "string",
  "file_name": "string"
}
```

```typescript
GET /api/ingestion/status/:batchId
```
**Description**: Get ingestion batch status
**Parameters**: 
- `batchId` (path): Batch ID

---

## Tenable Integration

### Tenable API Operations

```typescript
GET /api/tenable/health
```
**Description**: Check Tenable connection health
**Response**:
```json
{
  "status": "string",
  "last_check": "timestamp",
  "connection_details": "object"
}
```

```typescript
POST /api/tenable/sync/assets
```
**Description**: Sync assets from Tenable
**Response**:
```json
{
  "batch_id": "string",
  "status": "started",
  "estimated_records": "number"
}
```

```typescript
POST /api/tenable/sync/vulnerabilities
```
**Description**: Sync vulnerabilities from Tenable
**Body**:
```json
{
  "asset_filters": "object",
  "severity_filter": "array"
}
```

---

## Document Generation

### Document Operations

```typescript
GET /api/requirements/documents
```
**Description**: Get requirement documents
**Response**:
```json
{
  "documents": [
    {
      "id": "number",
      "title": "string",
      "system_name": "string",
      "document_type": "string",
      "status": "string",
      "created_at": "timestamp"
    }
  ]
}
```

```typescript
POST /api/requirements/generate
```
**Description**: Generate new requirement document
**Body**:
```json
{
  "title": "string",
  "system_id": "string",
  "system_name": "string",
  "asset_ids": "array",
  "document_type": "string",
  "template_type": "string"
}
```

```typescript
GET /api/conops/generate
```
**Description**: Generate CONOPS document
**Query Parameters**:
- `system_id`: System identifier
- `template`: Template type

---

## System Administration

### Admin Operations

```typescript
GET /api/admin/users
```
**Description**: Get all users (admin only)
**Response**:
```json
{
  "users": [
    {
      "id": "number",
      "username": "string",
      "email": "string",
      "role": "string",
      "status": "string",
      "created_at": "timestamp"
    }
  ]
}
```

```typescript
POST /api/admin/users
```
**Description**: Create new user (admin only)
**Body**:
```json
{
  "username": "string",
  "password": "string",
  "email": "string",
  "role": "string"
}
```

```typescript
GET /api/security/banner
```
**Description**: Get security banner configuration
**Response**:
```json
{
  "banner_text": "string",
  "banner_color": "string",
  "is_enabled": "boolean"
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": "string",
  "message": "string",
  "details": "string",
  "timestamp": "timestamp"
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **409**: Conflict
- **422**: Unprocessable Entity
- **500**: Internal Server Error

### Common Error Responses

**401 Unauthorized**
```json
{
  "error": "Not authenticated",
  "message": "Please log in to access this resource"
}
```

**403 Forbidden**
```json
{
  "error": "Access denied",
  "message": "Insufficient privileges to access this resource"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found",
  "message": "The requested resource does not exist"
}
```

**422 Validation Error**
```json
{
  "error": "Validation failed",
  "message": "Request validation failed",
  "details": {
    "field": ["Error message"]
  }
}
```

---

## Rate Limiting

### API Rate Limits
- **General API**: 1000 requests per hour per user
- **AI Chat API**: 100 requests per hour per user
- **Data Ingestion**: 10 batch operations per hour
- **File Uploads**: 50 uploads per hour

### Rate Limit Headers
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## Pagination

### Standard Pagination Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 1000)
- `sort`: Sort field
- `order`: Sort order (asc, desc)

### Pagination Response
```json
{
  "data": "array",
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  }
}
```

---

## API Versioning

### Current Version
- **Version**: v1
- **Header**: `API-Version: v1`
- **URL Pattern**: `/api/v1/...` (optional, defaults to v1)

### Version Compatibility
- Backward compatibility maintained for at least 2 major versions
- Deprecation notices provided 6 months in advance
- Breaking changes only in major version updates

---

## Development and Testing

### Development Endpoints
These endpoints are available only in development mode:

```typescript
GET /api/dev/seed-data
```
**Description**: Seed database with test data

```typescript
POST /api/dev/reset-database
```
**Description**: Reset database to initial state

```typescript
GET /api/dev/system-info
```
**Description**: Get system information and health checks

### API Testing
- **Base URL**: `http://localhost:5000`
- **Swagger/OpenAPI**: Available at `/api/docs` (development only)
- **Health Check**: `GET /health`
- **API Status**: `GET /api/status`

This comprehensive API documentation provides all the information needed to integrate with and develop against the RAS DASH platform APIs.