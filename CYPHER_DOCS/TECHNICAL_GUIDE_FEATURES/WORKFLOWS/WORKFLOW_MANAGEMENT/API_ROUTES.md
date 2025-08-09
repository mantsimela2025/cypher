# Workflow Management API Routes

## Overview

This document provides comprehensive documentation of all API endpoints for the Workflow Management system. The API follows RESTful conventions with JSON request/response payloads and standard HTTP status codes.

## Route File Location
**File**: `server/routes/workflowRoutes.ts`  
**Base URL**: `/api`  
**Authentication**: Bearer token required for all endpoints

## Core Workflow Management Endpoints

### GET /api/workflows
**Purpose**: Retrieve all workflows with optional filtering  
**Authentication**: Required  
**Method**: GET  

**Query Parameters**:
```typescript
{
  userId?: string;           // Filter by workflow creator
  category?: string;         // Filter by workflow category
  isTemplate?: boolean;      // Filter templates vs active workflows
  isActive?: boolean;        // Filter active vs inactive workflows
  limit?: number;           // Limit number of results (default: 50)
  offset?: number;          // Pagination offset (default: 0)
  search?: string;          // Search in name and description
}
```

**Response Format**:
```typescript
{
  workflows: Workflow[];
  total: number;
  hasMore: boolean;
}
```

**Example Response**:
```json
{
  "workflows": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Critical Vulnerability Response",
      "description": "Automated response to critical vulnerabilities",
      "category": "vulnerability",
      "version": "1.0.0",
      "workflowData": {
        "nodes": [...],
        "edges": [...],
        "viewport": { "x": 0, "y": 0, "zoom": 1 }
      },
      "isActive": true,
      "isTemplate": false,
      "tags": ["security", "automated"],
      "createdBy": "security-admin",
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 25,
  "hasMore": true
}
```

### POST /api/workflows
**Purpose**: Create new workflow  
**Authentication**: Required  
**Method**: POST  
**Content-Type**: application/json  

**Request Body Validation**: Uses `insertWorkflowSchema` from Drizzle Zod

**Required Fields**:
```typescript
{
  name: string;              // Workflow name (max 255 chars)
  workflowData: object;      // React Flow graph data
}
```

**Optional Fields**:
```typescript
{
  description?: string;      // Workflow description
  category?: string;         // Workflow category (default: 'custom')
  version?: string;          // Version string (default: '1.0.0')
  isActive?: boolean;        // Active status (default: true)
  isTemplate?: boolean;      // Template flag (default: false)
  tags?: string[];          // Array of tags
  configuration?: object;    // Global workflow configuration
}
```

**Example Request**:
```json
{
  "name": "Incident Response Workflow",
  "description": "Automated incident detection and response",
  "category": "incident",
  "workflowData": {
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": {
          "label": "Security Event Trigger",
          "nodeType": "trigger",
          "configuration": {
            "eventType": "security_alert",
            "severity": ["high", "critical"]
          }
        }
      }
    ],
    "edges": [],
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  },
  "tags": ["incident", "security", "automated"]
}
```

**Response**: Created Workflow object with generated UUID and timestamps

### GET /api/workflows/:id
**Purpose**: Get specific workflow by ID  
**Authentication**: Required  
**Method**: GET  

**Path Parameters**:
- `id`: Workflow UUID

**Response**: Complete Workflow object  
**Error Responses**:
- `404`: Workflow not found
- `403`: Insufficient permissions

### PUT /api/workflows/:id
**Purpose**: Update existing workflow  
**Authentication**: Required  
**Method**: PUT  
**Content-Type**: application/json  

**Request Body**: Partial workflow data (any updatable fields)  
**Response**: Updated Workflow object  
**Logic**: Updates specified fields and sets new `updatedAt` timestamp

**Example Request**:
```json
{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "isActive": false,
  "workflowData": {
    // Updated React Flow graph
  }
}
```

### DELETE /api/workflows/:id
**Purpose**: Delete workflow and all related data  
**Authentication**: Required  
**Method**: DELETE  

**Response**: 
```json
{ "success": true, "message": "Workflow deleted successfully" }
```

**Cascade Behavior**: Automatically deletes:
- All workflow nodes
- All workflow edges  
- All workflow triggers
- All workflow instances and executions
- All related approvals and notifications

## Workflow Execution Endpoints

### POST /api/workflows/:id/execute
**Purpose**: Start workflow execution  
**Authentication**: Required  
**Method**: POST  
**Content-Type**: application/json  

**Path Parameters**:
- `id`: Workflow UUID to execute

**Request Body**:
```typescript
{
  context?: any;             // Input data and execution context
  triggeredBy?: string;      // User ID or trigger source
  priority?: 'low' | 'normal' | 'high' | 'critical';
  scheduledAt?: string;      // ISO 8601 datetime for delayed execution
}
```

**Example Request**:
```json
{
  "context": {
    "vulnerabilities": [
      {
        "cve": "CVE-2024-1234",
        "severity": "critical",
        "affectedAssets": ["web01", "db01"]
      }
    ],
    "triggeredBy": "tenable_scan_12345"
  },
  "priority": "high"
}
```

**Response**: Created WorkflowInstance object  
**Execution Flow**: 
1. Validates workflow exists and is active
2. Creates workflow instance record
3. Starts background execution processing
4. Returns instance for monitoring

### GET /api/workflow-instances
**Purpose**: Get workflow execution instances with filtering  
**Authentication**: Required  
**Method**: GET  

**Query Parameters**:
```typescript
{
  workflowId?: string;       // Filter by workflow
  status?: string;           // Filter by execution status
  triggeredBy?: string;      // Filter by trigger source
  priority?: string;         // Filter by priority level
  startDate?: string;        // Filter by start date (ISO 8601)
  endDate?: string;          // Filter by end date (ISO 8601)
  limit?: number;           // Limit results (default: 50)
  offset?: number;          // Pagination offset
}
```

**Response Format**:
```typescript
{
  instances: WorkflowInstance[];
  total: number;
  hasMore: boolean;
}
```

### GET /api/workflow-instances/:id
**Purpose**: Get specific workflow instance with execution details  
**Authentication**: Required  
**Method**: GET  

**Response**: WorkflowInstance with nested execution steps:
```json
{
  "id": "instance-uuid",
  "workflowId": "workflow-uuid",
  "status": "running",
  "priority": "high",
  "startedAt": "2025-01-15T14:30:00Z",
  "progress": 60,
  "currentStep": "action-node-2",
  "triggeredBy": "security-admin",
  "steps": [
    {
      "id": "execution-uuid-1",
      "nodeId": "trigger-1",
      "stepType": "trigger",
      "status": "completed",
      "startedAt": "2025-01-15T14:30:00Z",
      "completedAt": "2025-01-15T14:30:05Z",
      "durationMs": 5000,
      "outputData": { "eventProcessed": true }
    }
  ]
}
```

## Workflow Instance Control Endpoints

### POST /api/workflow-instances/:id/pause
**Purpose**: Pause running workflow execution  
**Authentication**: Required  
**Method**: POST  

**Logic**: 
- Only works on instances with status 'running'
- Sets status to 'paused' and records pause timestamp
- Stops execution processing

**Response**:
```json
{ "status": "paused", "pausedAt": "2025-01-15T14:35:00Z" }
```

### POST /api/workflow-instances/:id/resume
**Purpose**: Resume paused workflow execution  
**Authentication**: Required  
**Method**: POST  

**Logic**:
- Only works on instances with status 'paused'
- Sets status to 'running' and clears pause timestamp
- Restarts execution processing from last completed step

**Response**:
```json
{ "status": "running", "resumedAt": "2025-01-15T14:40:00Z" }
```

### POST /api/workflow-instances/:id/cancel
**Purpose**: Cancel running workflow execution  
**Authentication**: Required  
**Method**: POST  

**Logic**:
- Works on instances with status 'running' or 'paused'
- Sets status to 'cancelled' and records completion timestamp
- Stops all execution processing

**Response**:
```json
{ "status": "cancelled", "cancelledAt": "2025-01-15T14:45:00Z" }
```

## Template Management Endpoints

### GET /api/workflow-templates
**Purpose**: Get all workflow templates  
**Authentication**: Required  
**Method**: GET  

**Query Parameters**:
```typescript
{
  category?: string;         // Filter by category
  tags?: string[];          // Filter by tags
  search?: string;          // Search in name/description
}
```

**Response**: Array of Workflow objects where `isTemplate: true`

### POST /api/workflows/:id/save-as-template
**Purpose**: Convert existing workflow to template  
**Authentication**: Required  
**Method**: POST  

**Request Body**:
```json
{
  "name": "Template Name",
  "description": "Template description",
  "category": "vulnerability",
  "tags": ["template", "security"]
}
```

**Logic**: Creates new workflow record marked as template, copying workflow data

### POST /api/workflow-templates/:id/create-workflow
**Purpose**: Create new workflow from template  
**Authentication**: Required  
**Method**: POST  

**Request Body**:
```json
{
  "name": "New Workflow Name",
  "description": "Description for new workflow",
  "configuration": {
    // Override template configuration
  }
}
```

**Response**: New Workflow object created from template

## Approval Management Endpoints

### GET /api/workflow-approvals/pending
**Purpose**: Get pending approvals for authenticated user  
**Authentication**: Required (user context used for filtering)  
**Method**: GET  

**Logic**: Filters approvals by user roles and permissions

**Response**: Array of WorkflowApproval objects with workflow context:
```json
[
  {
    "id": "approval-uuid",
    "executionId": "execution-uuid",
    "approverRole": "security_team",
    "status": "pending",
    "requestedAt": "2025-01-15T14:30:00Z",
    "expiresAt": "2025-01-17T14:30:00Z",
    "approvalData": {
      "workflowName": "Critical Vulnerability Response",
      "stepDescription": "Deploy emergency patch",
      "riskLevel": "high"
    }
  }
]
```

### POST /api/workflow-approvals/:id/approve
**Purpose**: Approve pending approval request  
**Authentication**: Required  
**Method**: POST  

**Request Body**:
```json
{
  "message": "Approved after risk assessment review"
}
```

**Logic**:
1. Validates user has appropriate role
2. Updates approval status to 'approved'
3. Records approval timestamp and user
4. Continues workflow execution

### POST /api/workflow-approvals/:id/reject
**Purpose**: Reject pending approval request  
**Authentication**: Required  
**Method**: POST  

**Request Body**:
```json
{
  "reason": "Insufficient risk assessment documentation"
}
```

**Logic**:
1. Updates approval status to 'rejected'
2. Records rejection reason and timestamp
3. Fails associated workflow execution

## Monitoring and Analytics Endpoints

### GET /api/workflow-analytics/performance
**Purpose**: Get workflow performance metrics and statistics  
**Authentication**: Required  
**Method**: GET  

**Query Parameters**:
```typescript
{
  workflowId?: string;       // Specific workflow metrics
  timeRange?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;        // For custom time range
  endDate?: string;          // For custom time range
  groupBy?: 'day' | 'week' | 'month';
}
```

**Response Format**:
```json
{
  "summary": {
    "totalExecutions": 150,
    "successfulExecutions": 142,
    "failedExecutions": 8,
    "successRate": 94.67,
    "averageDuration": 45.2,
    "totalDuration": 6780
  },
  "trends": [
    {
      "date": "2025-01-15",
      "executions": 12,
      "successful": 11,
      "failed": 1,
      "avgDuration": 42.5
    }
  ],
  "topWorkflows": [
    {
      "workflowId": "workflow-uuid",
      "name": "Vulnerability Response",
      "executions": 45,
      "successRate": 97.8
    }
  ]
}
```

### GET /api/workflow-analytics/execution-summary
**Purpose**: Get high-level execution summary across all workflows  
**Authentication**: Required  
**Method**: GET  

**Response**:
```json
{
  "totalWorkflows": 25,
  "activeWorkflows": 20,
  "totalExecutions": 1250,
  "runningExecutions": 5,
  "completedToday": 15,
  "failedToday": 2,
  "pendingApprovals": 3,
  "averageExecutionTime": 38.7
}
```

### GET /api/workflow-instances/:id/logs
**Purpose**: Get detailed execution logs for workflow instance  
**Authentication**: Required  
**Method**: GET  

**Response**: Detailed execution log with timestamps:
```json
{
  "instanceId": "instance-uuid",
  "logs": [
    {
      "timestamp": "2025-01-15T14:30:00Z",
      "level": "info",
      "message": "Workflow execution started",
      "nodeId": null,
      "executionId": null
    },
    {
      "timestamp": "2025-01-15T14:30:02Z",
      "level": "info", 
      "message": "Trigger node executed successfully",
      "nodeId": "trigger-1",
      "executionId": "execution-uuid-1",
      "data": { "eventProcessed": true }
    }
  ]
}
```

## Node Library and Configuration Endpoints

### GET /api/workflow-node-types
**Purpose**: Get available workflow node types and configurations  
**Authentication**: Required  
**Method**: GET  

**Response**: Array of available node types with schemas:
```json
[
  {
    "id": "tenable_scan",
    "label": "Tenable Scan", 
    "nodeType": "action",
    "category": "vulnerability",
    "description": "Initiate vulnerability scan using Tenable",
    "defaultConfig": {
      "scanType": "credentialed",
      "template": "advanced"
    },
    "configSchema": {
      "type": "object",
      "properties": {
        "scanType": {
          "type": "string",
          "enum": ["credentialed", "non-credentialed"]
        }
      }
    }
  }
]
```

### POST /api/workflow-nodes/validate-config
**Purpose**: Validate node configuration against schema  
**Authentication**: Required  
**Method**: POST  

**Request Body**:
```json
{
  "nodeType": "tenable_scan",
  "configuration": {
    "scanType": "credentialed",
    "targets": ["192.168.1.100"]
  }
}
```

**Response**: Validation result with any errors:
```json
{
  "valid": true,
  "errors": []
}
```

## Error Response Format

### Standard Error Structure
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Detailed error information",
  "timestamp": "2025-01-15T14:30:00Z",
  "requestId": "req-uuid"
}
```

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **409**: Conflict (duplicate workflow name)
- **422**: Unprocessable Entity (business logic errors)
- **500**: Internal Server Error

### Validation Error Format
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "name",
      "message": "Workflow name is required",
      "value": ""
    },
    {
      "field": "workflowData.nodes",
      "message": "At least one node is required",
      "value": []
    }
  ]
}
```

## Authentication and Authorization

### Required Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Permission Levels
- **View**: Read access to workflows and instances
- **Create**: Create new workflows and execute existing ones
- **Modify**: Update workflows and control executions
- **Admin**: Full access including delete and template management

### Role-Based Access Examples
```typescript
// Different access levels per endpoint
const permissions = {
  'GET /api/workflows': ['view', 'create', 'modify', 'admin'],
  'POST /api/workflows': ['create', 'modify', 'admin'],
  'PUT /api/workflows/:id': ['modify', 'admin'],
  'DELETE /api/workflows/:id': ['admin'],
  'POST /api/workflows/:id/execute': ['create', 'modify', 'admin']
};
```

This comprehensive API documentation provides complete specifications for integrating with the Workflow Management system, enabling developers to build robust workflow automation applications with full CRUD operations, execution control, template management, and comprehensive monitoring capabilities.