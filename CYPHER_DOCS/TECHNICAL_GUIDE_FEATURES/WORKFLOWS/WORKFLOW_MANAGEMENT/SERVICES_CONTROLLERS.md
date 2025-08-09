# Workflow Management Services and Controllers

## Overview

This document provides comprehensive documentation of all service layer functions and controller methods in the Workflow Management system. The architecture follows a service-oriented pattern with separation between business logic (services) and HTTP request handling (controllers/routes).

## Service Architecture

### Core Service: WorkflowService
**Location**: `server/services/WorkflowService.ts`  
**Purpose**: Primary business logic for all workflow management operations  
**Extends**: `BaseService` (provides common database operations)

## WorkflowService Methods

### Workflow CRUD Operations

#### `createWorkflow(workflowData: InsertWorkflow): Promise<Workflow>`
**Purpose**: Create new workflow with validation and default settings

**Parameters**:
- `workflowData`: Workflow definition including name, description, workflow data (React Flow graph)

**Returns**: `Promise<Workflow>` - Created workflow with generated UUID

**Logic Flow**:
1. **UUID Generation**: Generate unique identifier for workflow
2. **Timestamp Setting**: Set creation and update timestamps
3. **Database Insert**: Insert workflow record with all metadata
4. **Return Created**: Return complete workflow object

**Example Usage**:
```typescript
const workflowData = {
  name: 'Critical Vulnerability Response',
  description: 'Automated response to critical vulnerabilities',
  category: 'vulnerability',
  workflowData: {
    nodes: [...],
    edges: [...],
    viewport: { x: 0, y: 0, zoom: 1 }
  },
  isActive: true,
  createdBy: 'security-admin'
};
const workflow = await workflowService.createWorkflow(workflowData);
```

#### `getWorkflows(userId?: string): Promise<Workflow[]>`
**Purpose**: Retrieve workflows, optionally filtered by user

**Parameters**:
- `userId` (optional): Filter workflows by creator

**Returns**: `Promise<Workflow[]>` - Array of workflows ordered by creation date

**Logic**: Queries workflows with optional user filtering, ordered by most recent first

#### `getWorkflowById(id: string): Promise<Workflow | null>`
**Purpose**: Get specific workflow by UUID

**Returns**: `Promise<Workflow | null>` - Workflow object or null if not found

#### `updateWorkflow(id: string, updates: Partial<InsertWorkflow>): Promise<Workflow | null>`
**Purpose**: Update existing workflow with partial data

**Logic**: Updates workflow fields and sets new timestamp, returns updated workflow

#### `deleteWorkflow(id: string): Promise<boolean>`
**Purpose**: Delete workflow and all related data (cascading delete)

**Returns**: `Promise<boolean>` - True if workflow was deleted

### Workflow Execution Management

#### `executeWorkflow(workflowId: string, context?: any, triggeredBy?: string): Promise<WorkflowInstance>`
**Purpose**: Start workflow execution with context and tracking

**Parameters**:
- `workflowId`: UUID of workflow to execute
- `context`: Input data and execution context
- `triggeredBy`: User ID or system trigger identifier

**Returns**: `Promise<WorkflowInstance>` - Created workflow instance

**Logic Flow**:
1. **Workflow Validation**: Verify workflow exists and is active
2. **Instance Creation**: Create new workflow instance record
3. **Context Setup**: Initialize execution context and input data
4. **Background Execution**: Start workflow processing in background
5. **Return Instance**: Return instance for tracking and monitoring

**Error Handling**: Throws errors for missing or inactive workflows

#### `getWorkflowInstances(workflowId?: string): Promise<WorkflowInstance[]>`
**Purpose**: Get workflow execution instances, optionally filtered by workflow

**Returns**: Array of workflow instances ordered by start time

#### `getWorkflowInstanceById(id: string): Promise<WorkflowInstance | null>`
**Purpose**: Get specific workflow instance with status and progress

#### `getWorkflowInstanceWithSteps(instanceId: string): Promise<any>`
**Purpose**: Get workflow instance with all execution steps and details

**Returns**: Complete instance object with nested execution steps array

**Logic**: Joins instance data with execution steps, ordered by execution time

### Workflow Instance Control

#### `pauseWorkflowInstance(instanceId: string): Promise<boolean>`
**Purpose**: Pause running workflow execution

**Logic**: Updates status to 'paused' only if currently 'running', sets pause timestamp

#### `resumeWorkflowInstance(instanceId: string): Promise<boolean>`
**Purpose**: Resume paused workflow execution

**Logic**: 
1. Updates status to 'running' and clears pause timestamp
2. Restarts workflow execution processing
3. Continues from last completed step

#### `cancelWorkflowInstance(instanceId: string): Promise<boolean>`
**Purpose**: Cancel running workflow execution

**Logic**: Updates status to 'cancelled' and sets completion timestamp

### Workflow Execution Engine

#### `processWorkflowExecution(instance: WorkflowInstance): Promise<void>`
**Purpose**: Core workflow execution engine that processes nodes and edges

**Logic Flow**:
1. **Status Update**: Mark instance as 'running'
2. **Workflow Loading**: Load workflow definition and parse nodes/edges
3. **Trigger Node Discovery**: Find trigger nodes to start execution
4. **Node Execution**: Execute nodes in order based on edges and conditions
5. **Completion Handling**: Mark instance as completed or failed
6. **Error Recovery**: Handle execution errors with proper status updates

**Error Handling**: Comprehensive error logging and status updates for failed executions

#### `executeNode(instanceId: string, node: any, allNodes: any[], allEdges: any[], context: any): Promise<any>`
**Purpose**: Execute individual workflow node with context and result tracking

**Parameters**:
- `instanceId`: Workflow instance being executed
- `node`: Node definition from React Flow
- `allNodes`: Complete list of workflow nodes
- `allEdges`: Complete list of workflow edges
- `context`: Current execution context and data

**Logic Flow**:
1. **Execution Record**: Create execution tracking record
2. **Node Type Routing**: Route to appropriate handler based on node type
3. **Result Processing**: Process node output and update context
4. **Next Node Discovery**: Find next nodes based on edge conditions
5. **Continuation**: Continue execution to next nodes or complete

**Node Type Handlers**:
- `executeTriggerNode()`: Handle trigger node processing
- `executeActionNode()`: Handle action node processing
- `executeConditionNode()`: Handle condition evaluation
- `executeApprovalNode()`: Handle approval workflow
- `executeIntegrationNode()`: Handle external integrations
- `executeNotificationNode()`: Handle notification sending

### Node Execution Handlers

#### `executeTriggerNode(node: any, context: any): Promise<any>`
**Purpose**: Process trigger nodes (schedule, event, webhook, manual)

**Logic**: Validates trigger conditions and prepares context for subsequent nodes

#### `executeActionNode(node: any, context: any): Promise<any>`
**Purpose**: Execute action nodes (Tenable scan, GitLab operations, AWS actions)

**Action Types Supported**:
- **Tenable Scan**: Initiate vulnerability scans with configuration
- **GitLab Integration**: Create issues, merge requests, update projects
- **AWS Operations**: Infrastructure provisioning and management
- **Patch Deployment**: System patching and updates
- **Report Generation**: Document and report creation
- **Database Operations**: Data manipulation and queries

**Example Implementation**:
```typescript
async executeActionNode(node: any, context: any): Promise<any> {
  const config = node.data.configuration;
  
  switch (config.actionType) {
    case 'tenable_scan':
      return await this.executeTenableScan(config, context);
    case 'gitlab_issue':
      return await this.executeGitLabIssue(config, context);
    case 'aws_infrastructure':
      return await this.executeAWSInfrastructure(config, context);
    default:
      throw new Error(`Unknown action type: ${config.actionType}`);
  }
}
```

#### `executeConditionNode(node: any, context: any): Promise<any>`
**Purpose**: Evaluate conditional logic for workflow branching

**Condition Types**:
- **CVSS Score Check**: Evaluate vulnerability severity levels
- **Asset Type Filter**: Filter based on asset classification
- **Risk Level Assessment**: Evaluate risk thresholds
- **Data Validation**: Validate input data and context

**Logic**: Evaluates conditions and returns boolean result for edge routing

#### `executeApprovalNode(node: any, context: any): Promise<any>`
**Purpose**: Handle approval workflow with role-based authorization

**Logic Flow**:
1. **Approval Request**: Create approval request record
2. **Role Validation**: Verify approver role requirements
3. **Notification**: Send approval request notifications
4. **Timeout Setting**: Set approval expiration timer
5. **Wait State**: Put execution in waiting state until approved

### Template Management

#### `getWorkflowTemplates(): Promise<Workflow[]>`
**Purpose**: Get all workflow templates for new workflow creation

**Returns**: Array of workflows marked as templates

#### `createWorkflowFromTemplate(templateId: string, workflowData: Partial<InsertWorkflow>): Promise<Workflow>`
**Purpose**: Create new workflow from existing template

**Logic**:
1. Load template workflow
2. Clone workflow data structure
3. Apply new workflow metadata
4. Create new workflow record
5. Return created workflow

#### `saveWorkflowAsTemplate(workflowId: string, templateData: any): Promise<Workflow>`
**Purpose**: Convert existing workflow to reusable template

**Logic**: Updates workflow to mark as template with appropriate metadata

## Integration Service Methods

### External Tool Integrations

#### `executeTenableScan(config: any, context: any): Promise<any>`
**Purpose**: Execute Tenable vulnerability scans with configuration

**Configuration Options**:
- `scanType`: credentialed, non-credentialed, compliance
- `targets`: Array of IP addresses or hostnames
- `template`: Scan template ID or name
- `schedule`: Optional scheduling information

**Returns**: Scan results including scan ID, status, and vulnerability count

#### `executeGitLabIssue(config: any, context: any): Promise<any>`
**Purpose**: Create GitLab issues or merge requests

**Configuration Options**:
- `project`: GitLab project path
- `title`: Issue or MR title
- `description`: Detailed description
- `assignee`: User assignment
- `labels`: Array of labels
- `priority`: Issue priority level

**Returns**: Created issue/MR information including ID and URL

#### `executeAWSInfrastructure(config: any, context: any): Promise<any>`
**Purpose**: Provision or manage AWS infrastructure

**Configuration Options**:
- `action`: deploy, modify, destroy
- `template`: Infrastructure template
- `region`: AWS region
- `parameters`: Template parameters

**Returns**: Infrastructure deployment status and resource information

### Notification Service Integration

#### `executeNotificationNode(node: any, context: any): Promise<any>`
**Purpose**: Send notifications through various channels

**Notification Channels**:
- **Email/SMTP**: Rich HTML email with templates
- **Slack/Teams**: Chat notifications with formatting
- **Webhook**: HTTP callbacks to external systems
- **SMS**: Text message alerts for critical events

**Logic**: Routes to appropriate notification handler based on channel configuration

## Controller/Routes Architecture

### Route File: workflowRoutes.ts
**Location**: `server/routes/workflowRoutes.ts`  
**Purpose**: HTTP request handling and API endpoint definitions

## API Route Endpoints

### Workflow Management Routes

#### `GET /api/workflows`
**Purpose**: Get all workflows  
**Authentication**: Required  
**Query Parameters**: 
- `userId`: Filter by creator
- `category`: Filter by workflow category
- `isTemplate`: Filter templates vs active workflows
**Response**: Array of Workflow objects  

#### `POST /api/workflows`
**Purpose**: Create new workflow  
**Body Validation**: `insertWorkflowSchema`  
**Required Fields**: `name`, `workflowData`  
**Response**: Created Workflow object  

#### `GET /api/workflows/:id`
**Purpose**: Get specific workflow by ID  
**Response**: Workflow object or 404 if not found  

#### `PUT /api/workflows/:id`
**Purpose**: Update existing workflow  
**Body**: Partial workflow data  
**Response**: Updated Workflow object  

#### `DELETE /api/workflows/:id`
**Purpose**: Delete workflow (cascading delete)  
**Response**: Success confirmation  

### Workflow Execution Routes

#### `POST /api/workflows/:id/execute`
**Purpose**: Start workflow execution  
**Body**: `{ context?: any, triggeredBy?: string }`  
**Response**: Created WorkflowInstance object  

#### `GET /api/workflow-instances`
**Purpose**: Get workflow execution instances  
**Query Parameters**: 
- `workflowId`: Filter by workflow
- `status`: Filter by execution status
- `limit`: Limit number of results
**Response**: Array of WorkflowInstance objects  

#### `GET /api/workflow-instances/:id`
**Purpose**: Get specific workflow instance  
**Response**: WorkflowInstance with execution details  

#### `POST /api/workflow-instances/:id/pause`
**Purpose**: Pause running workflow  
**Response**: Success confirmation  

#### `POST /api/workflow-instances/:id/resume`
**Purpose**: Resume paused workflow  
**Response**: Success confirmation  

#### `POST /api/workflow-instances/:id/cancel`
**Purpose**: Cancel running workflow  
**Response**: Success confirmation  

### Template Management Routes

#### `GET /api/workflow-templates`
**Purpose**: Get all workflow templates  
**Response**: Array of template Workflow objects  

#### `POST /api/workflows/:id/save-as-template`
**Purpose**: Save workflow as template  
**Body**: `{ name: string, description?: string }`  
**Response**: Template Workflow object  

#### `POST /api/workflow-templates/:id/create-workflow`
**Purpose**: Create workflow from template  
**Body**: `{ name: string, description?: string, configuration?: any }`  
**Response**: New Workflow object  

### Approval Management Routes

#### `GET /api/workflow-approvals/pending`
**Purpose**: Get pending approvals for user  
**Authentication**: Required (user context)  
**Response**: Array of pending WorkflowApproval objects  

#### `POST /api/workflow-approvals/:id/approve`
**Purpose**: Approve pending approval  
**Body**: `{ message?: string }`  
**Response**: Updated WorkflowApproval object  

#### `POST /api/workflow-approvals/:id/reject`
**Purpose**: Reject pending approval  
**Body**: `{ reason: string }`  
**Response**: Updated WorkflowApproval object  

### Monitoring and Analytics Routes

#### `GET /api/workflow-analytics/performance`
**Purpose**: Get workflow performance metrics  
**Query Parameters**: 
- `workflowId`: Specific workflow metrics
- `timeRange`: Time range for metrics (7d, 30d, 90d)
**Response**: Performance analytics data  

#### `GET /api/workflow-analytics/execution-summary`
**Purpose**: Get execution summary statistics  
**Response**: Summary statistics for all workflows  

## Error Handling Patterns

### Standard Error Responses
```typescript
// Validation Error (400)
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Workflow name is required"
    }
  ]
}

// Not Found Error (404)
{
  "error": "Workflow not found",
  "workflowId": "uuid-here"
}

// Execution Error (500)
{
  "error": "Workflow execution failed",
  "instanceId": "uuid-here",
  "details": "Node execution failed at step 3"
}
```

### Comprehensive Error Logging
- **Request Logging**: All API requests with response times and status codes
- **Execution Logging**: Detailed workflow execution logs with step-by-step tracking
- **Integration Logging**: External service call logs with request/response data
- **Error Logging**: Complete error stack traces with context information

## Integration Points

### Database Integration
- **Drizzle ORM**: Type-safe database operations with automatic migrations
- **Transaction Support**: Atomic operations for complex workflow state changes
- **Connection Pooling**: Efficient database connection management
- **Performance Monitoring**: Query performance tracking and optimization

### External Service Integration
- **Tenable API**: Direct integration with Tenable.io for vulnerability scanning
- **GitLab API**: Complete GitLab integration for issue and project management
- **AWS SDK**: Native AWS integration for infrastructure management
- **Email Services**: SMTP integration for notification delivery
- **Chat Platforms**: Slack and Teams integration for real-time notifications

### Authentication Integration
- **User Context**: All operations track user authentication and authorization
- **Role-Based Access**: Different access levels for workflow creation and execution
- **Audit Trails**: Complete user activity logging for compliance and security

This comprehensive service and controller architecture provides a robust, scalable foundation for enterprise workflow automation with complete execution tracking, approval workflows, external integrations, and comprehensive monitoring capabilities.