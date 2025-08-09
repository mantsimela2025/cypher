# Artifacts API Reference

Complete API reference for the Artifacts Document Library System.

## 🎯 Base URL
```
/api/v1/artifacts
```

## 🔐 Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

## 📋 Core Document Operations

### Upload Document
```http
POST /api/v1/artifacts
```

**Description:** Upload a new document with metadata

**Required Permission:** `artifacts:write`

**Content-Type:** `multipart/form-data`

**Request Body:**
```javascript
// Form data fields
{
  name: "Security Policy v2.1",           // Required: Document name
  description: "Updated security policy", // Optional: Description
  file: <binary_file_data>,              // Required: File to upload
  associatedControls: ["AC-1", "AC-2"],  // Optional: Control IDs
  categories: [1, 2, 3],                 // Optional: Category IDs
  tags: [5, 7, 9],                       // Optional: Tag IDs
  metadata: {                            // Optional: Custom metadata
    "document_version": "2.1",
    "effective_date": "2024-01-01",
    "review_cycle": "annual"
  }
}
```

**Response:**
```json
{
  "message": "Artifact created successfully",
  "data": {
    "id": 123,
    "name": "Security Policy v2.1",
    "description": "Updated security policy",
    "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
    "fileSize": 2048576,
    "fileSizeFormatted": "2.00 MB",
    "mimeType": "application/pdf",
    "reviewStatus": "pending",
    "uploadedBy": 456,
    "uploaderFullName": "John Doe",
    "associatedControls": ["AC-1", "AC-2"],
    "categories": [1, 2, 3],
    "tags": [5, 7, 9],
    "metadata": {
      "document_version": "2.1",
      "effective_date": "2024-01-01",
      "review_cycle": "annual"
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### List Documents
```http
GET /api/v1/artifacts?search=policy&reviewStatus=approved&page=1&limit=20
```

**Description:** Get all documents with filtering and pagination

**Required Permission:** `artifacts:read`

**Query Parameters:**
- `search` (string, optional): Search in name, description, and filename
- `mimeType` (string, optional): Filter by MIME type
- `reviewStatus` (enum, optional): `pending`, `approved`, `rejected`
- `uploadedBy` (integer, optional): Filter by uploader user ID
- `categories` (array, optional): Filter by category IDs
- `tags` (array, optional): Filter by tag IDs
- `dateFrom` (date, optional): Filter by creation date from
- `dateTo` (date, optional): Filter by creation date to
- `sizeMin` (integer, optional): Minimum file size in bytes
- `sizeMax` (integer, optional): Maximum file size in bytes
- `associatedControls` (array, optional): Filter by control IDs
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20, max: 100): Results per page
- `sortBy` (enum, optional, default: createdAt): `name`, `fileSize`, `createdAt`, `updatedAt`, `reviewStatus`
- `sortOrder` (enum, optional, default: desc): `asc`, `desc`

**Response:**
```json
{
  "message": "Artifacts retrieved successfully",
  "data": [
    {
      "id": 123,
      "name": "Security Policy v2.1",
      "description": "Updated security policy",
      "fileName": "security-policy.pdf",
      "fileSize": 2048576,
      "fileSizeFormatted": "2.00 MB",
      "mimeType": "application/pdf",
      "reviewStatus": "approved",
      "uploaderFullName": "John Doe",
      "categories": [1, 2],
      "tags": [5, 7],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 156,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Get Document Details
```http
GET /api/v1/artifacts/{artifactId}
```

**Description:** Get detailed document information

**Required Permission:** `artifacts:read`

**Response:**
```json
{
  "message": "Artifact retrieved successfully",
  "data": {
    "id": 123,
    "name": "Security Policy v2.1",
    "description": "Updated security policy",
    "fileName": "a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf",
    "fileSize": 2048576,
    "fileSizeFormatted": "2.00 MB",
    "mimeType": "application/pdf",
    "metadata": {
      "document_version": "2.1",
      "effective_date": "2024-01-01",
      "review_cycle": "annual"
    },
    "uploadedBy": 456,
    "uploaderFullName": "John Doe",
    "uploaderEmail": "john.doe@example.com",
    "associatedControls": ["AC-1", "AC-2"],
    "reviewStatus": "approved",
    "reviewedBy": 789,
    "reviewedAt": "2024-01-16T14:20:00Z",
    "reviewerInfo": {
      "id": 789,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com"
    },
    "expiresAt": "2025-01-01T00:00:00Z",
    "categories": [1, 2, 3],
    "tags": [5, 7, 9],
    "references": [
      {
        "id": 1,
        "targetArtifactId": 124,
        "targetArtifactName": "Related Procedure",
        "referenceType": "related",
        "description": "Supporting procedure document"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:20:00Z"
  }
}
```

### Update Document Metadata
```http
PUT /api/v1/artifacts/{artifactId}
```

**Description:** Update document metadata (not the file itself)

**Required Permission:** `artifacts:write`

**Request Body:**
```json
{
  "name": "Security Policy v2.2",
  "description": "Updated security policy with new requirements",
  "associatedControls": ["AC-1", "AC-2", "AC-3"],
  "categories": [1, 2, 4],
  "tags": [5, 7, 9, 11],
  "metadata": {
    "document_version": "2.2",
    "effective_date": "2024-02-01",
    "review_cycle": "annual",
    "approval_authority": "CISO"
  },
  "expiresAt": "2025-02-01T00:00:00Z"
}
```

### Delete Document
```http
DELETE /api/v1/artifacts/{artifactId}
```

**Description:** Delete document and associated file

**Required Permission:** `artifacts:delete`

**Response:**
```json
{
  "message": "Artifact deleted successfully",
  "data": {
    "success": true,
    "message": "Artifact deleted successfully"
  }
}
```

## 📁 File Operations

### Download Document
```http
GET /api/v1/artifacts/{artifactId}/download
```

**Description:** Download the document file

**Required Permission:** `artifacts:read`

**Response:** Binary file stream with appropriate headers:
```
Content-Type: application/pdf
Content-Length: 2048576
Content-Disposition: attachment; filename="Security Policy v2.1"
```

### Replace Document File
```http
PUT /api/v1/artifacts/{artifactId}/replace
```

**Description:** Replace the document file with a new version

**Required Permission:** `artifacts:write`

**Content-Type:** `multipart/form-data`

**Request Body:**
```javascript
{
  file: <binary_file_data>  // Required: New file to replace existing one
}
```

**Response:**
```json
{
  "message": "Artifact file replaced successfully",
  "data": {
    "id": 123,
    "name": "Security Policy v2.1",
    "fileName": "b2c3d4e5-f6g7-8901-bcde-fg2345678901.pdf",
    "fileSize": 2150400,
    "fileSizeFormatted": "2.05 MB",
    "mimeType": "application/pdf",
    "reviewStatus": "pending",
    "updatedAt": "2024-01-17T09:15:00Z"
  }
}
```

## 👁️ Review and Approval

### Review Document
```http
POST /api/v1/artifacts/{artifactId}/review
```

**Description:** Approve or reject a document

**Required Permission:** `artifacts:admin`

**Request Body:**
```json
{
  "status": "approved",  // Required: "approved" or "rejected"
  "comments": "Document meets all security requirements and is approved for use."
}
```

**Response:**
```json
{
  "message": "Artifact approved successfully",
  "data": {
    "id": 123,
    "reviewStatus": "approved",
    "reviewedBy": 789,
    "reviewedAt": "2024-01-16T14:20:00Z",
    "reviewerInfo": {
      "id": 789,
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com"
    }
  }
}
```

### Get Pending Reviews
```http
GET /api/v1/artifacts/pending-review?page=1&limit=20
```

**Description:** Get documents awaiting review

**Required Permission:** `artifacts:admin`

**Response:**
```json
{
  "message": "Pending review artifacts retrieved successfully",
  "data": [
    {
      "id": 125,
      "name": "Network Security Procedure",
      "description": "Updated network security procedures",
      "fileName": "network-security.docx",
      "fileSize": 1024000,
      "fileSizeFormatted": "1.00 MB",
      "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "uploadedBy": 456,
      "uploaderFullName": "John Doe",
      "createdAt": "2024-01-17T08:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 12,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## 🔍 Search and Analytics

### Advanced Search
```http
GET /api/v1/artifacts/search?q=security+policy&mimeType=application/pdf&reviewStatus=approved
```

**Description:** Search documents with advanced filtering

**Required Permission:** `artifacts:read`

**Query Parameters:**
- `q` (string, required): Search query
- `mimeType` (string, optional): Filter by MIME type
- `reviewStatus` (enum, optional): Filter by review status
- `page` (integer, optional, default: 1): Page number
- `limit` (integer, optional, default: 20): Results per page

**Response:**
```json
{
  "message": "Search completed successfully",
  "data": [
    {
      "id": 123,
      "name": "Security Policy v2.1",
      "description": "Updated security policy",
      "fileName": "security-policy.pdf",
      "fileSize": 2048576,
      "fileSizeFormatted": "2.00 MB",
      "mimeType": "application/pdf",
      "reviewStatus": "approved",
      "uploaderFullName": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 8,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "searchQuery": "security policy"
}
```

### Get Statistics
```http
GET /api/v1/artifacts/statistics
```

**Description:** Get system statistics and analytics

**Required Permission:** `artifacts:read`

**Response:**
```json
{
  "message": "Artifact statistics retrieved successfully",
  "data": {
    "totalArtifacts": 1247,
    "statusBreakdown": [
      {"reviewStatus": "approved", "count": 892},
      {"reviewStatus": "pending", "count": 234},
      {"reviewStatus": "rejected", "count": 121}
    ],
    "fileTypeBreakdown": [
      {"mimeType": "application/pdf", "count": 567},
      {"mimeType": "application/msword", "count": 234},
      {"mimeType": "text/plain", "count": 123}
    ],
    "sizeStatistics": {
      "totalSize": 2147483648,
      "averageSize": 1723456,
      "maxSize": 52428800,
      "minSize": 1024,
      "totalSizeFormatted": "2.00 GB"
    },
    "recentUploads": 45
  }
}
```

## 🏷️ Organization Management

### Set Document Categories
```http
PUT /api/v1/artifacts/{artifactId}/categories
```

**Description:** Assign categories to a document

**Required Permission:** `artifacts:write`

**Request Body:**
```json
{
  "categoryIds": [1, 2, 3, 5]
}
```

### Set Document Tags
```http
PUT /api/v1/artifacts/{artifactId}/tags
```

**Description:** Assign tags to a document

**Required Permission:** `artifacts:write`

**Request Body:**
```json
{
  "tagIds": [7, 9, 11, 13]
}
```

## 🚨 Error Responses

### Common Error Codes
```json
// 400 Bad Request
{
  "error": "Invalid request",
  "details": [
    {
      "message": "\"name\" is required",
      "path": ["name"],
      "type": "any.required"
    }
  ]
}

// 401 Unauthorized
{
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}

// 403 Forbidden
{
  "error": "Insufficient permissions",
  "message": "User does not have required permission: artifacts:write"
}

// 404 Not Found
{
  "error": "Not found",
  "message": "Artifact not found"
}

// 413 Payload Too Large
{
  "error": "File too large",
  "message": "File size exceeds maximum allowed size of 50.00 MB"
}

// 415 Unsupported Media Type
{
  "error": "Unsupported file type",
  "message": "File type application/exe is not allowed"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

## 📝 Configuration

### Environment Variables
```bash
# File upload configuration
ARTIFACT_UPLOAD_PATH=./uploads/artifacts
MAX_ARTIFACT_SIZE=52428800  # 50MB in bytes

# Database configuration
DATABASE_URL=postgresql://user:password@localhost:5432/database

# Security configuration
JWT_SECRET=your-jwt-secret-key
```

### Supported File Types
- **Documents:** PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
- **Text:** Plain text (.txt), CSV (.csv)
- **Images:** JPEG (.jpg), PNG (.png), GIF (.gif)
- **Archives:** ZIP (.zip)

### File Size Limits
- **Default:** 50MB per file
- **Configurable:** Set via `MAX_ARTIFACT_SIZE` environment variable
- **Validation:** Enforced at both upload middleware and service level

The Artifacts API provides comprehensive document management capabilities with robust security, flexible organization, and powerful search features suitable for enterprise and government environments.
