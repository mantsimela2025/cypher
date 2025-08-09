# Workflow Management Drizzle TypeScript Schemas

## Overview

This document provides complete TypeScript schema definitions using Drizzle ORM for the Workflow Management system. All schemas include type safety, validation, and database mapping for the 8 core workflow tables.

## Schema File Location
**File**: `shared/workflow-schema.ts`

## Complete Drizzle Schema Definitions

### 1. Core Workflow Table

```typescript
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).default('custom'),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  workflowData: jsonb('workflow_data').notNull(), // Stores React Flow nodes and edges
  isActive: boolean('is_active').default(true),
  isTemplate: boolean('is_template').default(false),
  tags: jsonb('tags'), // Array of string tags
  configuration: jsonb('configuration'), // Workflow-level config
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Workflow Data JSON Structure**:
```typescript
interface WorkflowData {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: {
      label: string;
      nodeType: 'trigger' | 'action' | 'condition' | 'approval' | 'integration' | 'notification';
      configuration: any;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    animated?: boolean;
    conditions?: any;
  }>;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}
```

### 2. Workflow Nodes Table

```typescript
export const workflowNodes = pgTable('workflow_nodes', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 100 }).notNull(),
  nodeType: varchar('node_type', { length: 50 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  positionX: integer('position_x').notNull(),
  positionY: integer('position_y').notNull(),
  configuration: jsonb('configuration'),
  isEnabled: boolean('is_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Node Configuration Examples**:
```typescript
// Trigger Node Configuration
interface TriggerNodeConfig {
  cronExpression?: string;
  timezone?: string;
  severity?: string[];
  source?: string;
  endpoint?: string;
  authentication?: string;
}

// Action Node Configuration
interface ActionNodeConfig {
  scanType?: string;
  targets?: string[];
  template?: string;
  project?: string;
  assignee?: string;
  labels?: string[];
  priority?: string;
}

// Condition Node Configuration
interface ConditionNodeConfig {
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_array';
  field: string;
  value: any;
  threshold?: number;
}
```

### 3. Workflow Edges Table

```typescript
export const workflowEdges = pgTable('workflow_edges', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  edgeId: varchar('edge_id', { length: 100 }).notNull(),
  sourceNodeId: varchar('source_node_id', { length: 100 }).notNull(),
  targetNodeId: varchar('target_node_id', { length: 100 }).notNull(),
  sourceHandle: varchar('source_handle', { length: 50 }),
  targetHandle: varchar('target_handle', { length: 50 }),
  edgeType: varchar('edge_type', { length: 50 }).default('smoothstep'),
  conditions: jsonb('conditions'), // Edge conditions for conditional flows
  isEnabled: boolean('is_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Edge Conditions Structure**:
```typescript
interface EdgeConditions {
  type: 'simple' | 'complex';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_array';
    value: any;
    logic?: 'AND' | 'OR';
  }>;
  defaultPath?: boolean;
}
```

### 4. Workflow Triggers Table

```typescript
export const workflowTriggers = pgTable('workflow_triggers', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(),
  triggerSource: varchar('trigger_source', { length: 100 }),
  configuration: jsonb('configuration'),
  isActive: boolean('is_active').default(true),
  lastTriggered: timestamp('last_triggered'),
  triggerCount: integer('trigger_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Trigger Configuration Types**:
```typescript
interface ScheduleTriggerConfig {
  cronExpression: string;
  timezone: string;
  description?: string;
}

interface VulnerabilityTriggerConfig {
  severity: string[];
  source: string;
  assetGroups?: string[];
  cvssThreshold?: number;
}

interface WebhookTriggerConfig {
  endpoint: string;
  authentication: 'none' | 'token' | 'basic' | 'oauth';
  allowedIPs?: string[];
  secret?: string;
}
```

### 5. Workflow Instances Table

```typescript
export const workflowInstances = pgTable('workflow_instances', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').references(() => workflows.id),
  status: varchar('status', { length: 50 }).notNull(), // pending, running, completed, failed, paused, cancelled
  priority: varchar('priority', { length: 20 }).default('normal'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  pausedAt: timestamp('paused_at'),
  progress: integer('progress').default(0), // 0-100
  currentStep: varchar('current_step', { length: 100 }),
  executionContext: jsonb('execution_context'), // Input data and context
  outputData: jsonb('output_data'), // Final output data
  errorDetails: text('error_details'),
  triggeredBy: varchar('triggered_by', { length: 100 }),
  triggerSource: varchar('trigger_source', { length: 100 }),
  executionMetrics: jsonb('execution_metrics'), // Performance metrics
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Execution Context Structure**:
```typescript
interface ExecutionContext {
  triggerData?: any;
  userContext?: {
    userId: string;
    roles: string[];
    permissions: string[];
  };
  environmentData?: {
    environment: 'development' | 'staging' | 'production';
    region?: string;
    dataCenter?: string;
  };
  inputParameters?: Record<string, any>;
}

interface ExecutionMetrics {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  avgStepDuration: number;
  totalDuration: number;
  resourceUsage?: {
    cpu: number;
    memory: number;
  };
}
```

### 6. Workflow Executions Table

```typescript
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey(),
  instanceId: uuid('instance_id').references(() => workflowInstances.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 100 }).notNull(),
  stepType: varchar('step_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // pending, running, completed, failed, skipped, waiting_approval
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMs: integer('duration_ms'),
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Step Input/Output Data Examples**:
```typescript
// Tenable Scan Step
interface TenableScanInput {
  scanType: 'credentialed' | 'non-credentialed';
  targets: string[];
  template: string;
  scheduleId?: string;
}

interface TenableScanOutput {
  scanId: string;
  scanUuid: string;
  status: string;
  vulnerabilitiesFound: number;
  highSeverity: number;
  criticalSeverity: number;
  scanUrl: string;
}

// GitLab Issue Creation
interface GitLabIssueInput {
  project: string;
  title: string;
  description: string;
  assignee?: string;
  labels?: string[];
  priority?: string;
  milestone?: string;
}

interface GitLabIssueOutput {
  issueId: number;
  issueIid: number;
  issueUrl: string;
  createdAt: string;
  assignedTo?: string;
}
```

### 7. Workflow Approvals Table

```typescript
export const workflowApprovals = pgTable('workflow_approvals', {
  id: uuid('id').primaryKey(),
  executionId: uuid('execution_id').references(() => workflowExecutions.id, { onDelete: 'cascade' }),
  approverRole: varchar('approver_role', { length: 100 }).notNull(),
  approverUserId: varchar('approver_user_id', { length: 100 }),
  status: varchar('status', { length: 50 }).default('pending'), // pending, approved, rejected, expired
  requestedAt: timestamp('requested_at').defaultNow(),
  respondedAt: timestamp('responded_at'),
  expiresAt: timestamp('expires_at'),
  approvalMessage: text('approval_message'),
  rejectionReason: text('rejection_reason'),
  approvalData: jsonb('approval_data'),
  notificationsSent: integer('notifications_sent').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Approval Data Structure**:
```typescript
interface ApprovalData {
  requestContext: {
    workflowName: string;
    stepDescription: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    impactAssessment: string;
    estimatedDuration?: string;
  };
  requesterInfo: {
    userId: string;
    name: string;
    role: string;
    justification: string;
  };
  approvalRequirements: {
    requiredRole: string;
    timeoutHours: number;
    escalationPath?: string[];
    documentationRequired?: boolean;
  };
}
```

### 8. Workflow Notifications Table

```typescript
export const workflowNotifications = pgTable('workflow_notifications', {
  id: uuid('id').primaryKey(),
  workflowId: uuid('workflow_id').references(() => workflows.id),
  instanceId: uuid('instance_id').references(() => workflowInstances.id),
  executionId: uuid('execution_id').references(() => workflowExecutions.id),
  notificationType: varchar('notification_type', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(), // email, slack, webhook, sms
  recipients: jsonb('recipients'), // Array of recipients
  subject: varchar('subject', { length: 255 }),
  message: text('message'),
  status: varchar('status', { length: 50 }).default('pending'), // pending, sent, failed
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  errorDetails: text('error_details'),
  retryCount: integer('retry_count').default(0),
  notificationData: jsonb('notification_data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

**Notification Data Structures**:
```typescript
interface EmailNotificationData {
  smtpServer: string;
  fromAddress: string;
  template?: string;
  attachments?: string[];
  headers?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
}

interface SlackNotificationData {
  webhookUrl: string;
  channel: string;
  username?: string;
  iconEmoji?: string;
  blocks?: any[]; // Slack Block Kit format
  threadTs?: string;
}

interface WebhookNotificationData {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'bearer' | 'basic' | 'oauth';
    credentials?: string;
  };
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}
```

## Zod Validation Schemas

### Insert Schemas (Auto-generated from Drizzle)

```typescript
// Main workflow schemas
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkflowNodeSchema = createInsertSchema(workflowNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkflowEdgeSchema = createInsertSchema(workflowEdges).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Runtime schemas
export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkflowApprovalSchema = createInsertSchema(workflowApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkflowNotificationSchema = createInsertSchema(workflowNotifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
```

### Custom Validation Schemas

```typescript
// Workflow data validation
export const workflowDataSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({
      x: z.number(),
      y: z.number()
    }),
    data: z.object({
      label: z.string(),
      nodeType: z.enum(['trigger', 'action', 'condition', 'approval', 'integration', 'notification']),
      configuration: z.any()
    })
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.string().optional(),
    animated: z.boolean().optional(),
    conditions: z.any().optional()
  })),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number()
  }).optional()
});

// Node configuration validation
export const nodeConfigSchema = z.discriminatedUnion('nodeType', [
  z.object({
    nodeType: z.literal('trigger'),
    configuration: z.object({
      triggerType: z.enum(['schedule', 'event', 'webhook', 'manual']),
      cronExpression: z.string().optional(),
      endpoint: z.string().optional()
    })
  }),
  z.object({
    nodeType: z.literal('action'),
    configuration: z.object({
      actionType: z.string(),
      parameters: z.record(z.any())
    })
  }),
  z.object({
    nodeType: z.literal('condition'),
    configuration: z.object({
      operator: z.enum(['equals', 'greater_than', 'less_than', 'contains']),
      field: z.string(),
      value: z.any()
    })
  })
]);
```

## TypeScript Type Definitions

### Inferred Types from Drizzle Tables

```typescript
// Main workflow types
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;

export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type InsertWorkflowNode = z.infer<typeof insertWorkflowNodeSchema>;

export type WorkflowEdge = typeof workflowEdges.$inferSelect;
export type InsertWorkflowEdge = z.infer<typeof insertWorkflowEdgeSchema>;

export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type InsertWorkflowTrigger = typeof workflowTriggers.$inferInsert;

// Runtime types
export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = z.infer<typeof insertWorkflowInstanceSchema>;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;

export type WorkflowApproval = typeof workflowApprovals.$inferSelect;
export type InsertWorkflowApproval = z.infer<typeof insertWorkflowApprovalSchema>;

export type WorkflowNotification = typeof workflowNotifications.$inferSelect;
export type InsertWorkflowNotification = z.infer<typeof insertWorkflowNotificationSchema>;
```

### Status Enums and Constants

```typescript
export const WorkflowStatus = {
  PENDING: 'pending',
  RUNNING: 'running', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
} as const;

export const ExecutionStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed', 
  FAILED: 'failed',
  SKIPPED: 'skipped',
  WAITING_APPROVAL: 'waiting_approval'
} as const;

export const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
} as const;

export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed'
} as const;

export const WorkflowCategory = {
  VULNERABILITY: 'vulnerability',
  COMPLIANCE: 'compliance',
  INCIDENT: 'incident',
  AUTOMATION: 'automation',
  CUSTOM: 'custom'
} as const;

export const NodeType = {
  TRIGGER: 'trigger',
  ACTION: 'action',
  CONDITION: 'condition',
  APPROVAL: 'approval',
  INTEGRATION: 'integration',
  NOTIFICATION: 'notification'
} as const;
```

### Extended Type Definitions

```typescript
// Complete workflow with related data
export interface WorkflowWithDetails extends Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  triggers: WorkflowTrigger[];
  instances?: WorkflowInstance[];
}

// Workflow execution summary
export interface WorkflowExecutionSummary {
  instance: WorkflowInstance;
  workflow: Workflow;
  executions: WorkflowExecution[];
  approvals: WorkflowApproval[];
  notifications: WorkflowNotification[];
}

// Node library definition
export interface WorkflowNodeLibraryItem {
  id: string;
  label: string;
  nodeType: keyof typeof NodeType;
  category: string;
  description: string;
  icon: React.ReactNode;
  defaultConfig: any;
  configSchema?: z.ZodSchema;
}
```

## Database Relations (for queries)

```typescript
// Define relations for complex queries
export const workflowsRelations = relations(workflows, ({ many }) => ({
  nodes: many(workflowNodes),
  edges: many(workflowEdges),
  triggers: many(workflowTriggers),
  instances: many(workflowInstances),
  notifications: many(workflowNotifications)
}));

export const workflowInstancesRelations = relations(workflowInstances, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowInstances.workflowId],
    references: [workflows.id]
  }),
  executions: many(workflowExecutions),
  notifications: many(workflowNotifications)
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one, many }) => ({
  instance: one(workflowInstances, {
    fields: [workflowExecutions.instanceId],
    references: [workflowInstances.id]
  }),
  approvals: many(workflowApprovals),
  notifications: many(workflowNotifications)
}));
```

This comprehensive TypeScript schema provides complete type safety, validation, and database mapping for the entire Workflow Management system, enabling robust development and maintenance of the visual workflow automation platform.