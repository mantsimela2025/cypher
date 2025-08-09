# Workflow Module - Technical Architecture Documentation

## Overview

This document provides comprehensive technical specifications for the Workflow Management Module, enabling complete system recreation in compatible environments. The module features a React Flow-based visual workflow builder with enterprise-grade execution engine, real-time monitoring, and template management capabilities.

## System Architecture

### Technology Stack
- **Frontend**: React TypeScript with React Flow for visual workflow building
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: TanStack Query for server state, React hooks for local state
- **Validation**: Zod schemas with type-safe validation

### Core Components Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│ WorkflowBuilder │ ExecutionMonitor│    TemplateManager      │
│ - React Flow    │ - Real-time     │    - CRUD Operations    │
│ - Node Library  │ - Status Track  │    - Import/Export      │
│ - Config Panel  │ - Debugging     │    - Categorization     │
└─────────────────┴─────────────────┴─────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                          │
├─────────────────┬─────────────────┬─────────────────────────┤
│ WorkflowService │ ExecutionEngine │  IntegrationManager     │
│ - CRUD Ops      │ - Runtime       │  - Tool Connectors      │
│ - Validation    │ - State Mgmt    │  - API Clients          │
│ - Templates     │ - Error Handling│  - Data Transforms      │
└─────────────────┴─────────────────┴─────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     Database Layer                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│ Core Tables     │ Runtime Tables  │  Notification Tables    │
│ - workflows     │ - instances     │  - notifications        │
│ - nodes/edges   │ - executions    │  - approvals            │
│ - triggers      │ - step tracking │  - audit logs           │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Database Schema

### Core Tables (8 Main Tables)

#### 1. workflows
**Purpose**: Main workflow definitions with metadata and JSON workflow data
```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'custom',
    version VARCHAR(20) DEFAULT '1.0.0',
    workflow_data JSONB NOT NULL, -- Stores nodes and edges
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    tags JSONB, -- Array of string tags
    configuration JSONB, -- Workflow-level config
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. workflow_nodes
**Purpose**: Individual workflow nodes with position and configuration data
```sql
CREATE TABLE workflow_nodes (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    configuration JSONB,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. workflow_edges
**Purpose**: Connections between workflow nodes with conditional routing
```sql
CREATE TABLE workflow_edges (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    edge_id VARCHAR(100) NOT NULL,
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    source_handle VARCHAR(50),
    target_handle VARCHAR(50),
    edge_type VARCHAR(50) DEFAULT 'smoothstep',
    conditions JSONB, -- Edge conditions for conditional flows
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. workflow_triggers
**Purpose**: Workflow trigger configurations and monitoring
```sql
CREATE TABLE workflow_triggers (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_source VARCHAR(100),
    configuration JSONB,
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. workflow_instances
**Purpose**: Runtime workflow instances with execution tracking
```sql
CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    status VARCHAR(50) NOT NULL, -- pending, running, completed, failed, paused, cancelled
    priority VARCHAR(20) DEFAULT 'normal',
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    progress INTEGER DEFAULT 0, -- 0-100
    current_step VARCHAR(100),
    execution_context JSONB, -- Input data and context
    output_data JSONB, -- Final output data
    error_details TEXT,
    triggered_by VARCHAR(100),
    trigger_source VARCHAR(100),
    execution_metrics JSONB, -- Performance metrics
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. workflow_executions
**Purpose**: Individual step executions within workflow instances
```sql
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY,
    instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    step_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL, -- pending, running, completed, failed, skipped, waiting_approval
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. workflow_approvals
**Purpose**: Approval workflow steps with role-based approvals
```sql
CREATE TABLE workflow_approvals (
    id UUID PRIMARY KEY,
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    approver_role VARCHAR(100) NOT NULL,
    approver_user_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, expired
    requested_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    expires_at TIMESTAMP,
    approval_message TEXT,
    rejection_reason TEXT,
    approval_data JSONB,
    notifications_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 8. workflow_notifications
**Purpose**: Multi-channel notification management
```sql
CREATE TABLE workflow_notifications (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    instance_id UUID REFERENCES workflow_instances(id),
    execution_id UUID REFERENCES workflow_executions(id),
    notification_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL, -- email, slack, webhook, sms
    recipients JSONB, -- Array of recipients
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_details TEXT,
    retry_count INTEGER DEFAULT 0,
    notification_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Drizzle Schema Implementation

### Schema File Location
**File**: `shared/workflow-schema.ts`

### Complete Drizzle Definitions
```typescript
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Main workflow definitions
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).default('custom'),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  workflowData: jsonb('workflow_data').notNull(),
  isActive: boolean('is_active').default(true),
  isTemplate: boolean('is_template').default(false),
  tags: jsonb('tags'),
  configuration: jsonb('configuration'),
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// [Additional table definitions follow same pattern...]

// TypeScript type inference
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
```

## Service Layer Architecture

### WorkflowService
**File**: `server/services/WorkflowService.ts`

#### Key Methods:
```typescript
export class WorkflowService extends BaseService {
  // Workflow CRUD operations
  async createWorkflow(workflowData: InsertWorkflow): Promise<Workflow>
  async getWorkflows(userId?: string): Promise<Workflow[]>
  async getWorkflowById(id: string): Promise<Workflow | null>
  async updateWorkflow(id: string, updates: Partial<InsertWorkflow>): Promise<Workflow | null>
  async deleteWorkflow(id: string): Promise<boolean>

  // Workflow execution operations
  async executeWorkflow(workflowId: string, context?: any, triggeredBy?: string): Promise<WorkflowInstance>
  async getWorkflowInstances(workflowId?: string): Promise<WorkflowInstance[]>
  async getWorkflowInstanceById(id: string): Promise<WorkflowInstance | null>
  async getWorkflowInstanceWithSteps(instanceId: string): Promise<any>

  // Workflow control operations
  async pauseWorkflowInstance(instanceId: string): Promise<boolean>
  async resumeWorkflowInstance(instanceId: string): Promise<boolean>
  async cancelWorkflowInstance(instanceId: string): Promise<boolean>

  // Private execution methods
  private async processWorkflowExecution(instance: WorkflowInstance): Promise<void>
  private async executeWorkflowStep(execution: WorkflowExecution): Promise<void>
  private async handleApprovalStep(execution: WorkflowExecution): Promise<void>
  private async sendNotification(notification: InsertWorkflowNotification): Promise<void>
}
```

#### Service Responsibilities:
1. **Workflow Management**: Complete CRUD operations for workflow definitions
2. **Execution Engine**: Runtime workflow processing with step-by-step execution
3. **State Management**: Tracking workflow instance status and progress
4. **Error Handling**: Comprehensive error tracking and retry mechanisms
5. **Integration Management**: Connecting with external tools and services

## API Routes

### Route Configuration
**File**: `server/routes/workflowRoutes.ts`

#### Complete API Endpoints:
```typescript
// Workflow CRUD endpoints
GET    /api/workflows              # List all workflows
GET    /api/workflows/:id          # Get workflow by ID
POST   /api/workflows              # Create new workflow
PUT    /api/workflows/:id          # Update workflow
DELETE /api/workflows/:id          # Delete workflow

// Workflow execution endpoints
POST   /api/workflows/:id/execute  # Execute workflow
GET    /api/workflow-instances     # List workflow instances
GET    /api/workflow-instances/:id # Get instance details
GET    /api/workflow-instances/:id/details # Get instance with steps

// Workflow execution control
POST   /api/workflow-executions/:id/pause   # Pause workflow instance
POST   /api/workflow-executions/:id/resume  # Resume workflow instance
POST   /api/workflow-executions/:id/cancel  # Cancel workflow instance
```

#### Route Handlers:
```typescript
// Example route handler implementation
router.post('/workflows', async (req, res) => {
  try {
    const workflow = await workflowService.createWorkflow({
      ...req.body,
      createdBy: req.user?.id || 'system'
    });
    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});
```

## Controllers and Business Logic

### WorkflowController Structure
While the current implementation uses service methods directly in routes, a controller layer would follow this pattern:

```typescript
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  async createWorkflow(req: Request, res: Response): Promise<void> {
    // Validation, business logic, and service calls
  }

  async executeWorkflow(req: Request, res: Response): Promise<void> {
    // Execution context preparation and workflow triggering
  }

  async getWorkflowStatus(req: Request, res: Response): Promise<void> {
    // Real-time status reporting for monitoring
  }
}
```

## Integration Points

### External Service Integration
1. **Tenable API**: Vulnerability scanning integration
2. **GitLab API**: Issue creation and project management
3. **AWS Services**: Infrastructure automation
4. **Email/Slack**: Notification delivery
5. **AI Services**: Automated analysis and decision making

### Integration Service Pattern
```typescript
export interface IntegrationService {
  executeAction(actionType: string, parameters: any): Promise<any>;
  validateConfiguration(config: any): boolean;
  getHealthStatus(): Promise<boolean>;
}
```

## Security and Authentication

### Authentication Requirements
- All workflow operations require authenticated users
- Role-based access control for workflow creation and execution
- Audit logging for all workflow activities

### Data Security
- Encrypted storage of sensitive configuration data
- Secure handling of API keys and credentials
- Input validation and sanitization for all workflow data

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (workflow_id, status, created_at)
- Partitioning for large workflow execution tables
- Connection pooling for high-concurrency scenarios

### Execution Engine Optimization
- Asynchronous workflow processing
- Configurable retry mechanisms
- Resource monitoring and throttling

## Error Handling and Logging

### Error Management Strategy
1. **Validation Errors**: Input validation with detailed error messages
2. **Execution Errors**: Step-level error tracking with retry capabilities
3. **System Errors**: Infrastructure and service connectivity issues
4. **Business Logic Errors**: Workflow-specific error conditions

### Logging Implementation
```typescript
// Comprehensive logging for workflow operations
logger.info('Workflow execution started', {
  workflowId,
  instanceId,
  triggeredBy,
  context: executionContext
});

logger.error('Workflow step failed', {
  instanceId,
  nodeId,
  error: errorMessage,
  retryCount,
  duration: executionTime
});
```

## Migration and Deployment

### Database Migration Scripts
```sql
-- Create workflow management tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- [Table creation scripts for all 8 tables]

-- Create indexes for performance
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_executions_instance_id ON workflow_executions(instance_id);
```

### Environment Configuration
```typescript
// Required environment variables
export const workflowConfig = {
  DATABASE_URL: process.env.DATABASE_URL,
  WORKFLOW_EXECUTION_TIMEOUT: process.env.WORKFLOW_EXECUTION_TIMEOUT || 3600000,
  MAX_CONCURRENT_WORKFLOWS: process.env.MAX_CONCURRENT_WORKFLOWS || 10,
  NOTIFICATION_RETRY_COUNT: process.env.NOTIFICATION_RETRY_COUNT || 3
};
```

This technical documentation provides complete specifications for recreating the workflow module with identical functionality, performance characteristics, and integration capabilities in compatible environments.