# Workflow Management System Requirements

## System Overview

The Workflow Management System is a comprehensive visual workflow automation platform designed for cybersecurity operations. Built on React Flow technology, it enables security teams to create, deploy, and monitor complex automated workflows using an intuitive drag-and-drop interface. The system provides enterprise-grade execution engines, real-time monitoring, template management, and seamless integration with security tools for complete process automation in government and enterprise environments.

## Core Functionality

### Visual Workflow Builder
- **React Flow Integration**: Professional drag-and-drop interface for workflow creation with 20+ pre-built node types
- **Node-Based Design**: Comprehensive node library across 6 categories (Triggers, Actions, Conditions, Approvals, Integrations, Notifications)
- **Visual Flow Management**: Intuitive connection system with conditional routing and data flow visualization
- **Real-Time Validation**: Immediate feedback on workflow configuration, connectivity, and logical consistency
- **Template System**: Built-in templates for common security scenarios with custom template creation capabilities

### Execution Engine
- **Multi-threaded Processing**: Concurrent execution of workflow steps with sophisticated dependency management
- **State Management**: Comprehensive tracking of workflow instances and execution state with progress monitoring
- **Error Handling**: Robust error recovery with configurable retry policies and intelligent fallback mechanisms
- **Approval Integration**: Built-in approval workflows with role-based authorization and expiration handling
- **Real-Time Monitoring**: Live execution tracking with step-by-step progress monitoring and debugging capabilities

### Enterprise Features
- **Role-Based Access Control**: Granular permissions for workflow creation, execution, and monitoring
- **Audit Logging**: Complete audit trails for compliance and security monitoring
- **Performance Analytics**: Comprehensive metrics and reporting on workflow performance
- **Integration Framework**: Extensible connectors for security tools and external systems
- **Scalability Support**: High-availability execution with load balancing and failover capabilities

## Database Schema

### Core Workflow Tables
```sql
-- Main workflow definitions
CREATE TABLE workflows (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'custom' CHECK (category IN ('vulnerability', 'compliance', 'incident', 'automation', 'custom')),
  version VARCHAR(20) DEFAULT '1.0.0',
  workflow_data JSONB NOT NULL, -- Stores complete React Flow data (nodes and edges)
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false,
  tags JSONB, -- Array of classification tags
  configuration JSONB, -- Workflow-level settings and parameters
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata for workflow management
  last_executed TIMESTAMP,
  execution_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  average_duration_ms INTEGER,
  
  -- Template and sharing configuration
  is_public BOOLEAN DEFAULT false,
  shared_with JSONB, -- Array of user IDs or role names
  usage_statistics JSONB,
  
  -- Workflow versioning
  parent_workflow_id UUID REFERENCES workflows(id),
  version_notes TEXT,
  is_deprecated BOOLEAN DEFAULT false
);

CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_is_active ON workflows(is_active);
CREATE INDEX idx_workflows_is_template ON workflows(is_template);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_tags ON workflows USING gin(tags);
```

### Workflow Structure Tables
```sql
-- Individual workflow nodes with position and configuration
CREATE TABLE workflow_nodes (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  node_id VARCHAR(100) NOT NULL, -- React Flow node ID
  node_type VARCHAR(50) NOT NULL CHECK (node_type IN ('trigger', 'action', 'condition', 'approval', 'integration', 'notification')),
  label VARCHAR(255) NOT NULL,
  position_x INTEGER NOT NULL,
  position_y INTEGER NOT NULL,
  configuration JSONB, -- Node-specific configuration
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Node execution configuration
  timeout_seconds INTEGER DEFAULT 300,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  priority INTEGER DEFAULT 1,
  
  -- Node categorization and metadata
  node_category VARCHAR(50),
  node_description TEXT,
  custom_properties JSONB,
  
  -- Validation and constraints
  required_inputs JSONB, -- Array of required input parameters
  expected_outputs JSONB, -- Expected output schema
  validation_rules JSONB,
  
  UNIQUE(workflow_id, node_id)
);

CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_nodes_node_type ON workflow_nodes(node_type);
CREATE INDEX idx_workflow_nodes_is_enabled ON workflow_nodes(is_enabled);

-- Connections between workflow nodes with conditional routing
CREATE TABLE workflow_edges (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  edge_id VARCHAR(100) NOT NULL, -- React Flow edge ID
  source_node_id VARCHAR(100) NOT NULL,
  target_node_id VARCHAR(100) NOT NULL,
  source_handle VARCHAR(50), -- Output handle name
  target_handle VARCHAR(50), -- Input handle name
  edge_type VARCHAR(50) DEFAULT 'smoothstep',
  conditions JSONB, -- Edge conditions for conditional flows
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Conditional routing configuration
  condition_type VARCHAR(50) CHECK (condition_type IN ('always', 'success', 'failure', 'custom')),
  condition_expression TEXT, -- JavaScript-like expression for evaluation
  condition_data JSONB, -- Static data for condition evaluation
  
  -- Edge styling and display
  edge_label VARCHAR(255),
  edge_style JSONB, -- Styling properties for React Flow
  is_animated BOOLEAN DEFAULT false,
  
  UNIQUE(workflow_id, edge_id),
  FOREIGN KEY (workflow_id, source_node_id) REFERENCES workflow_nodes(workflow_id, node_id),
  FOREIGN KEY (workflow_id, target_node_id) REFERENCES workflow_nodes(workflow_id, node_id)
);

CREATE INDEX idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX idx_workflow_edges_source_node ON workflow_edges(source_node_id);
CREATE INDEX idx_workflow_edges_target_node ON workflow_edges(target_node_id);
```

### Trigger and Execution Tables
```sql
-- Workflow trigger configurations
CREATE TABLE workflow_triggers (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('manual', 'scheduled', 'webhook', 'event', 'condition')),
  trigger_source VARCHAR(100), -- Source system or event
  configuration JSONB NOT NULL, -- Trigger-specific configuration
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,
  trigger_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Scheduling configuration (for scheduled triggers)
  cron_expression VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'UTC',
  next_execution TIMESTAMP,
  
  -- Event-based trigger configuration
  event_source VARCHAR(100),
  event_filters JSONB,
  event_transformation JSONB,
  
  -- Trigger constraints and limits
  max_executions_per_hour INTEGER,
  max_concurrent_executions INTEGER DEFAULT 1,
  execution_window_start TIME,
  execution_window_end TIME,
  
  -- Security and access control
  required_permissions JSONB,
  allowed_sources JSONB,
  webhook_secret VARCHAR(255),
  
  -- Monitoring and alerting
  failure_threshold INTEGER DEFAULT 5,
  alert_on_failure BOOLEAN DEFAULT true,
  notification_channels JSONB
);

CREATE INDEX idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_triggers_type ON workflow_triggers(trigger_type);
CREATE INDEX idx_workflow_triggers_is_active ON workflow_triggers(is_active);
CREATE INDEX idx_workflow_triggers_next_execution ON workflow_triggers(next_execution);

-- Runtime workflow instances
CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused', 'cancelled', 'timeout')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  paused_at TIMESTAMP,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step VARCHAR(100), -- Currently executing node ID
  execution_context JSONB, -- Input data and execution context
  output_data JSONB, -- Final workflow output
  error_details TEXT,
  triggered_by VARCHAR(100), -- User ID or system identifier
  trigger_source VARCHAR(100), -- Source of the trigger
  execution_metrics JSONB, -- Performance and timing metrics
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Execution configuration
  timeout_minutes INTEGER DEFAULT 60,
  max_retries INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  
  -- Resource allocation
  assigned_worker VARCHAR(100),
  resource_requirements JSONB,
  resource_usage JSONB,
  
  -- Business context
  business_unit VARCHAR(100),
  cost_center VARCHAR(100),
  project_id VARCHAR(100),
  incident_id VARCHAR(100),
  
  -- Monitoring and notifications
  monitoring_enabled BOOLEAN DEFAULT true,
  notification_preferences JSONB,
  escalation_rules JSONB,
  
  -- Data lineage and traceability
  parent_instance_id UUID REFERENCES workflow_instances(id),
  correlation_id VARCHAR(100),
  trace_id VARCHAR(100)
);

CREATE INDEX idx_workflow_instances_workflow_id ON workflow_instances(workflow_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_instances_started_at ON workflow_instances(started_at DESC);
CREATE INDEX idx_workflow_instances_triggered_by ON workflow_instances(triggered_by);
CREATE INDEX idx_workflow_instances_current_step ON workflow_instances(current_step);
CREATE INDEX idx_workflow_instances_correlation_id ON workflow_instances(correlation_id);
```

### Execution and Monitoring Tables
```sql
-- Individual step executions within workflow instances
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY,
  instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  node_id VARCHAR(100) NOT NULL, -- Reference to workflow node
  step_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting_approval', 'timeout')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_stack TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Execution context and environment
  executor_id VARCHAR(100), -- Worker or process ID
  execution_environment JSONB,
  resource_usage JSONB,
  
  -- Performance metrics
  cpu_time_ms INTEGER,
  memory_usage_mb INTEGER,
  network_calls INTEGER,
  external_api_calls JSONB,
  
  -- Step-specific data
  step_configuration JSONB,
  step_outputs JSONB,
  intermediate_results JSONB,
  
  -- Quality and validation
  validation_results JSONB,
  quality_score DECIMAL(3,2),
  performance_rating INTEGER CHECK (performance_rating BETWEEN 1 AND 5),
  
  -- Debugging and diagnostics
  debug_info JSONB,
  execution_logs TEXT,
  system_metrics JSONB
);

CREATE INDEX idx_workflow_executions_instance_id ON workflow_executions(instance_id);
CREATE INDEX idx_workflow_executions_node_id ON workflow_executions(node_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at DESC);

-- Approval workflow management
CREATE TABLE workflow_approvals (
  id UUID PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  approver_role VARCHAR(100) NOT NULL,
  approver_user_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'escalated')),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP,
  approval_message TEXT,
  rejection_reason TEXT,
  approval_data JSONB,
  notifications_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Approval workflow configuration
  approval_level INTEGER DEFAULT 1,
  required_approvals INTEGER DEFAULT 1,
  approval_threshold DECIMAL(3,2), -- Percentage required for approval
  
  -- Escalation and delegation
  escalation_level INTEGER DEFAULT 0,
  escalated_to VARCHAR(100),
  delegated_to VARCHAR(100),
  delegation_reason TEXT,
  
  -- Approval context and justification
  business_justification TEXT,
  risk_assessment JSONB,
  compliance_requirements JSONB,
  
  -- Approval metadata
  approval_criteria JSONB,
  supporting_documents JSONB,
  approval_workflow_id UUID,
  
  -- Security and audit
  ip_address INET,
  user_agent TEXT,
  authentication_method VARCHAR(50),
  approval_signature JSONB
);

CREATE INDEX idx_workflow_approvals_execution_id ON workflow_approvals(execution_id);
CREATE INDEX idx_workflow_approvals_approver_role ON workflow_approvals(approver_role);
CREATE INDEX idx_workflow_approvals_approver_user_id ON workflow_approvals(approver_user_id);
CREATE INDEX idx_workflow_approvals_status ON workflow_approvals(status);
CREATE INDEX idx_workflow_approvals_expires_at ON workflow_approvals(expires_at);

-- Multi-channel notification management
CREATE TABLE workflow_notifications (
  id UUID PRIMARY KEY,
  workflow_id UUID REFERENCES workflows(id),
  instance_id UUID REFERENCES workflow_instances(id),
  execution_id UUID REFERENCES workflow_executions(id),
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('start', 'complete', 'error', 'approval', 'escalation', 'reminder', 'custom')),
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'slack', 'teams', 'webhook', 'sms', 'push', 'in_app')),
  recipients JSONB NOT NULL, -- Array of recipient configurations
  subject VARCHAR(255),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced', 'cancelled')),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  error_details TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  notification_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Notification configuration
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  delivery_options JSONB,
  template_id VARCHAR(100),
  template_variables JSONB,
  
  -- Delivery tracking and analytics
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  engagement_metrics JSONB,
  
  -- Channel-specific configuration
  email_configuration JSONB,
  slack_configuration JSONB,
  webhook_configuration JSONB,
  sms_configuration JSONB,
  
  -- Security and compliance
  encryption_enabled BOOLEAN DEFAULT false,
  data_classification VARCHAR(50),
  retention_policy JSONB,
  
  -- Business context
  business_impact VARCHAR(50),
  urgency_level INTEGER CHECK (urgency_level BETWEEN 1 AND 5),
  escalation_path JSONB
);

CREATE INDEX idx_workflow_notifications_workflow_id ON workflow_notifications(workflow_id);
CREATE INDEX idx_workflow_notifications_instance_id ON workflow_notifications(instance_id);
CREATE INDEX idx_workflow_notifications_execution_id ON workflow_notifications(execution_id);
CREATE INDEX idx_workflow_notifications_type ON workflow_notifications(notification_type);
CREATE INDEX idx_workflow_notifications_channel ON workflow_notifications(channel);
CREATE INDEX idx_workflow_notifications_status ON workflow_notifications(status);
CREATE INDEX idx_workflow_notifications_sent_at ON workflow_notifications(sent_at DESC);
```

## Service Layer Implementation

### Workflow Service (server/services/WorkflowService.ts)
```typescript
import { BaseService } from './BaseService';
import { 
  workflows, 
  workflowNodes, 
  workflowEdges, 
  workflowTriggers, 
  workflowInstances, 
  workflowExecutions,
  workflowApprovals,
  workflowNotifications,
  type Workflow,
  type InsertWorkflow,
  type WorkflowInstance,
  type InsertWorkflowInstance,
  type WorkflowExecution,
  type InsertWorkflowExecution
} from '@shared/workflow-schema';
import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowExecutionContext {
  userId?: string;
  triggeredBy: string;
  triggerSource: string;
  inputData?: any;
  environmentContext?: any;
  businessContext?: {
    businessUnit?: string;
    costCenter?: string;
    projectId?: string;
    incidentId?: string;
  };
}

export interface WorkflowExecutionOptions {
  priority?: 'low' | 'normal' | 'high' | 'critical';
  timeoutMinutes?: number;
  maxRetries?: number;
  notificationPreferences?: any;
  resourceRequirements?: any;
}

export class WorkflowService extends BaseService {
  
  /**
   * Workflow CRUD Operations
   */
  async createWorkflow(workflowData: InsertWorkflow): Promise<Workflow> {
    const id = uuidv4();
    
    // Validate workflow data structure
    this.validateWorkflowData(workflowData.workflowData);
    
    const workflow = {
      ...workflowData,
      id,
      version: workflowData.version || '1.0.0',
      executionCount: 0,
      successRate: 0.00,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [created] = await this.db.insert(workflows)
      .values(workflow)
      .returning();

    // Create individual nodes and edges if provided
    if (workflowData.workflowData?.nodes) {
      await this.createWorkflowNodes(id, workflowData.workflowData.nodes);
    }
    
    if (workflowData.workflowData?.edges) {
      await this.createWorkflowEdges(id, workflowData.workflowData.edges);
    }

    return created;
  }

  async getWorkflows(options?: {
    userId?: string;
    category?: string;
    isTemplate?: boolean;
    isActive?: boolean;
    tags?: string[];
  }): Promise<Workflow[]> {
    let query = this.db.select().from(workflows);
    
    const conditions = [];
    
    if (options?.userId) {
      conditions.push(eq(workflows.createdBy, options.userId));
    }
    
    if (options?.category) {
      conditions.push(eq(workflows.category, options.category));
    }
    
    if (options?.isTemplate !== undefined) {
      conditions.push(eq(workflows.isTemplate, options.isTemplate));
    }
    
    if (options?.isActive !== undefined) {
      conditions.push(eq(workflows.isActive, options.isActive));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(workflows.createdAt));
  }

  async getWorkflowById(id: string, includeDetails: boolean = false): Promise<Workflow | null> {
    const [workflow] = await this.db.select()
      .from(workflows)
      .where(eq(workflows.id, id));

    if (!workflow) return null;

    if (includeDetails) {
      // Include nodes and edges data
      const nodes = await this.getWorkflowNodes(id);
      const edges = await this.getWorkflowEdges(id);
      const triggers = await this.getWorkflowTriggers(id);
      
      return {
        ...workflow,
        nodes,
        edges,
        triggers
      };
    }

    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<InsertWorkflow>): Promise<Workflow | null> {
    if (updates.workflowData) {
      this.validateWorkflowData(updates.workflowData);
    }

    const [updated] = await this.db.update(workflows)
      .set({ 
        ...updates, 
        updatedAt: new Date(),
        version: this.incrementVersion(updates.version)
      })
      .where(eq(workflows.id, id))
      .returning();

    if (updated && updates.workflowData) {
      // Update nodes and edges if workflow data changed
      await this.updateWorkflowStructure(id, updates.workflowData);
    }

    return updated || null;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    // Check for running instances
    const runningInstances = await this.db.select()
      .from(workflowInstances)
      .where(and(
        eq(workflowInstances.workflowId, id),
        inArray(workflowInstances.status, ['pending', 'running', 'paused'])
      ));

    if (runningInstances.length > 0) {
      throw new Error('Cannot delete workflow with running instances');
    }

    const result = await this.db.delete(workflows)
      .where(eq(workflows.id, id));

    return result.rowCount > 0;
  }

  /**
   * Workflow Execution Operations
   */
  async executeWorkflow(
    workflowId: string, 
    context: WorkflowExecutionContext,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowInstance> {
    const workflow = await this.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow is not active');
    }

    // Check concurrent execution limits
    await this.checkExecutionLimits(workflowId);

    const instanceId = uuidv4();
    const instance: InsertWorkflowInstance = {
      id: instanceId,
      workflowId,
      status: 'pending',
      priority: options.priority || 'normal',
      startedAt: new Date(),
      executionContext: context.inputData || {},
      triggeredBy: context.triggeredBy,
      triggerSource: context.triggerSource,
      progress: 0,
      timeoutMinutes: options.timeoutMinutes || 60,
      maxRetries: options.maxRetries || 0,
      businessUnit: context.businessContext?.businessUnit,
      costCenter: context.businessContext?.costCenter,
      projectId: context.businessContext?.projectId,
      incidentId: context.businessContext?.incidentId,
      correlationId: this.generateCorrelationId(),
      traceId: this.generateTraceId()
    };

    const [created] = await this.db.insert(workflowInstances)
      .values(instance)
      .returning();

    // Update workflow execution statistics
    await this.updateWorkflowStats(workflowId, 'execution_started');

    // Start workflow execution in background
    this.processWorkflowExecution(created);

    return created;
  }

  async getWorkflowInstances(options?: {
    workflowId?: string;
    status?: string[];
    triggeredBy?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  }): Promise<WorkflowInstance[]> {
    let query = this.db.select().from(workflowInstances);
    
    const conditions = [];
    
    if (options?.workflowId) {
      conditions.push(eq(workflowInstances.workflowId, options.workflowId));
    }
    
    if (options?.status && options.status.length > 0) {
      conditions.push(inArray(workflowInstances.status, options.status));
    }
    
    if (options?.triggeredBy) {
      conditions.push(eq(workflowInstances.triggeredBy, options.triggeredBy));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    query = query.orderBy(desc(workflowInstances.startedAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return await query;
  }

  async getWorkflowInstanceById(id: string): Promise<WorkflowInstance | null> {
    const [instance] = await this.db.select()
      .from(workflowInstances)
      .where(eq(workflowInstances.id, id));

    return instance || null;
  }

  async getWorkflowInstanceWithSteps(instanceId: string): Promise<any> {
    const instance = await this.getWorkflowInstanceById(instanceId);
    if (!instance) return null;

    const steps = await this.db.select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.instanceId, instanceId))
      .orderBy(workflowExecutions.startedAt);

    const approvals = await this.db.select()
      .from(workflowApprovals)
      .leftJoin(workflowExecutions, eq(workflowApprovals.executionId, workflowExecutions.id))
      .where(eq(workflowExecutions.instanceId, instanceId));

    const notifications = await this.db.select()
      .from(workflowNotifications)
      .where(eq(workflowNotifications.instanceId, instanceId))
      .orderBy(workflowNotifications.createdAt);

    return {
      ...instance,
      steps,
      approvals,
      notifications
    };
  }

  /**
   * Workflow Execution Control
   */
  async pauseWorkflowInstance(instanceId: string): Promise<boolean> {
    const [updated] = await this.db.update(workflowInstances)
      .set({ 
        status: 'paused',
        pausedAt: new Date()
      })
      .where(and(
        eq(workflowInstances.id, instanceId),
        eq(workflowInstances.status, 'running')
      ))
      .returning();

    if (updated) {
      // Pause all pending executions
      await this.pauseInstanceExecutions(instanceId);
      
      // Send notification
      await this.sendWorkflowNotification(instanceId, 'workflow_paused');
    }

    return !!updated;
  }

  async resumeWorkflowInstance(instanceId: string): Promise<boolean> {
    const [updated] = await this.db.update(workflowInstances)
      .set({ 
        status: 'running',
        pausedAt: null
      })
      .where(and(
        eq(workflowInstances.id, instanceId),
        eq(workflowInstances.status, 'paused')
      ))
      .returning();

    if (updated) {
      // Resume execution processing
      this.processWorkflowExecution(updated);
      
      // Send notification
      await this.sendWorkflowNotification(instanceId, 'workflow_resumed');
    }

    return !!updated;
  }

  async cancelWorkflowInstance(instanceId: string, reason?: string): Promise<boolean> {
    const [updated] = await this.db.update(workflowInstances)
      .set({ 
        status: 'cancelled',
        completedAt: new Date(),
        errorDetails: reason || 'Cancelled by user'
      })
      .where(and(
        eq(workflowInstances.id, instanceId),
        inArray(workflowInstances.status, ['pending', 'running', 'paused'])
      ))
      .returning();

    if (updated) {
      // Cancel all pending executions
      await this.cancelInstanceExecutions(instanceId);
      
      // Update workflow statistics
      await this.updateWorkflowStats(updated.workflowId, 'execution_cancelled');
      
      // Send notification
      await this.sendWorkflowNotification(instanceId, 'workflow_cancelled');
    }

    return !!updated;
  }

  /**
   * Workflow Execution Engine
   */
  private async processWorkflowExecution(instance: WorkflowInstance): Promise<void> {
    try {
      // Update instance status to running
      await this.db.update(workflowInstances)
        .set({ status: 'running' })
        .where(eq(workflowInstances.id, instance.id));

      // Get workflow definition
      const workflow = await this.getWorkflowById(instance.workflowId, true);
      if (!workflow) {
        throw new Error('Workflow definition not found');
      }

      // Execute workflow steps
      await this.executeWorkflowSteps(instance, workflow);

    } catch (error) {
      console.error('Workflow execution error:', error);
      
      // Mark instance as failed
      await this.db.update(workflowInstances)
        .set({ 
          status: 'failed',
          completedAt: new Date(),
          errorDetails: error.message
        })
        .where(eq(workflowInstances.id, instance.id));

      // Update workflow statistics
      await this.updateWorkflowStats(instance.workflowId, 'execution_failed');

      // Send error notification
      await this.sendWorkflowNotification(instance.id, 'workflow_failed');
    }
  }

  private async executeWorkflowSteps(instance: WorkflowInstance, workflow: any): Promise<void> {
    const workflowData = workflow.workflowData;
    const nodes = workflowData.nodes || [];
    const edges = workflowData.edges || [];

    // Find trigger nodes (starting points)
    const triggerNodes = nodes.filter((node: any) => node.type === 'trigger');
    
    if (triggerNodes.length === 0) {
      throw new Error('No trigger nodes found in workflow');
    }

    // Execute from each trigger node
    for (const triggerNode of triggerNodes) {
      await this.executeNodePath(instance, triggerNode, nodes, edges, {});
    }

    // Mark instance as completed if all paths are done
    await this.checkInstanceCompletion(instance.id);
  }

  private async executeNodePath(
    instance: WorkflowInstance, 
    currentNode: any, 
    allNodes: any[], 
    allEdges: any[], 
    executionContext: any
  ): Promise<any> {
    
    // Create execution record
    const executionId = uuidv4();
    const execution: InsertWorkflowExecution = {
      id: executionId,
      instanceId: instance.id,
      nodeId: currentNode.id,
      stepType: currentNode.type,
      status: 'pending',
      inputData: executionContext,
      stepConfiguration: currentNode.data
    };

    const [createdExecution] = await this.db.insert(workflowExecutions)
      .values(execution)
      .returning();

    try {
      // Execute the node
      const nodeResult = await this.executeNode(createdExecution, currentNode, executionContext);

      // Update execution with results
      await this.db.update(workflowExecutions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          outputData: nodeResult.outputData,
          durationMs: nodeResult.durationMs
        })
        .where(eq(workflowExecutions.id, executionId));

      // Find next nodes based on edges and conditions
      const nextNodes = this.findNextNodes(currentNode, allEdges, allNodes, nodeResult);

      // Execute next nodes
      for (const nextNode of nextNodes) {
        await this.executeNodePath(instance, nextNode, allNodes, allEdges, {
          ...executionContext,
          ...nodeResult.outputData
        });
      }

      return nodeResult;

    } catch (error) {
      // Update execution with error
      await this.db.update(workflowExecutions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message
        })
        .where(eq(workflowExecutions.id, executionId));

      throw error;
    }
  }

  private async executeNode(execution: WorkflowExecution, nodeDefinition: any, context: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      let result;
      
      switch (nodeDefinition.type) {
        case 'trigger':
          result = await this.executeTriggerNode(nodeDefinition, context);
          break;
        case 'action':
          result = await this.executeActionNode(nodeDefinition, context);
          break;
        case 'condition':
          result = await this.executeConditionNode(nodeDefinition, context);
          break;
        case 'approval':
          result = await this.executeApprovalNode(execution, nodeDefinition, context);
          break;
        case 'integration':
          result = await this.executeIntegrationNode(nodeDefinition, context);
          break;
        case 'notification':
          result = await this.executeNotificationNode(nodeDefinition, context);
          break;
        default:
          throw new Error(`Unknown node type: ${nodeDefinition.type}`);
      }

      const durationMs = Date.now() - startTime;
      
      return {
        outputData: result,
        durationMs,
        success: true
      };

    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      return {
        outputData: null,
        durationMs,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Node Type Executors
   */
  private async executeTriggerNode(nodeDefinition: any, context: any): Promise<any> {
    // Trigger nodes just pass through context and mark the start
    return {
      triggeredAt: new Date().toISOString(),
      triggerType: nodeDefinition.data?.triggerType || 'manual',
      triggerData: context
    };
  }

  private async executeActionNode(nodeDefinition: any, context: any): Promise<any> {
    const actionType = nodeDefinition.data?.actionType;
    const configuration = nodeDefinition.data?.configuration || {};

    switch (actionType) {
      case 'http_request':
        return await this.executeHttpRequest(configuration, context);
      case 'database_query':
        return await this.executeDatabaseQuery(configuration, context);
      case 'file_operation':
        return await this.executeFileOperation(configuration, context);
      case 'script_execution':
        return await this.executeScript(configuration, context);
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  private async executeConditionNode(nodeDefinition: any, context: any): Promise<any> {
    const condition = nodeDefinition.data?.condition;
    const conditionType = nodeDefinition.data?.conditionType || 'javascript';

    let result = false;

    switch (conditionType) {
      case 'javascript':
        result = this.evaluateJavaScriptCondition(condition, context);
        break;
      case 'comparison':
        result = this.evaluateComparisonCondition(nodeDefinition.data, context);
        break;
      case 'exists':
        result = this.evaluateExistsCondition(nodeDefinition.data, context);
        break;
      default:
        throw new Error(`Unknown condition type: ${conditionType}`);
    }

    return {
      conditionResult: result,
      evaluatedAt: new Date().toISOString(),
      context: context
    };
  }

  private async executeApprovalNode(execution: WorkflowExecution, nodeDefinition: any, context: any): Promise<any> {
    const approvalConfig = nodeDefinition.data?.approvalConfiguration || {};
    
    // Create approval request
    const approvalId = uuidv4();
    const approval = {
      id: approvalId,
      executionId: execution.id,
      approverRole: approvalConfig.approverRole || 'admin',
      status: 'pending',
      requestedAt: new Date(),
      expiresAt: approvalConfig.expirationHours ? 
        new Date(Date.now() + approvalConfig.expirationHours * 60 * 60 * 1000) : 
        null,
      approvalData: {
        requestContext: context,
        approvalCriteria: approvalConfig.criteria,
        businessJustification: approvalConfig.justification
      }
    };

    await this.db.insert(workflowApprovals).values(approval);

    // Send approval notification
    await this.sendApprovalNotification(approvalId, approvalConfig);

    // Update execution to waiting status
    await this.db.update(workflowExecutions)
      .set({ status: 'waiting_approval' })
      .where(eq(workflowExecutions.id, execution.id));

    return {
      approvalId,
      approvalRequested: true,
      waitingFor: approvalConfig.approverRole,
      expiresAt: approval.expiresAt
    };
  }

  private async executeIntegrationNode(nodeDefinition: any, context: any): Promise<any> {
    const integrationType = nodeDefinition.data?.integrationType;
    const configuration = nodeDefinition.data?.configuration || {};

    switch (integrationType) {
      case 'tenable':
        return await this.executeTenableIntegration(configuration, context);
      case 'slack':
        return await this.executeSlackIntegration(configuration, context);
      case 'jira':
        return await this.executeJiraIntegration(configuration, context);
      case 'email':
        return await this.executeEmailIntegration(configuration, context);
      default:
        throw new Error(`Unknown integration type: ${integrationType}`);
    }
  }

  private async executeNotificationNode(nodeDefinition: any, context: any): Promise<any> {
    const notificationConfig = nodeDefinition.data?.notificationConfiguration || {};
    
    const notification = {
      id: uuidv4(),
      notificationType: 'custom',
      channel: notificationConfig.channel || 'email',
      recipients: notificationConfig.recipients || [],
      subject: this.interpolateTemplate(notificationConfig.subject, context),
      message: this.interpolateTemplate(notificationConfig.message, context),
      notificationData: context
    };

    await this.db.insert(workflowNotifications).values(notification);

    // Send notification
    await this.sendNotification(notification);

    return {
      notificationSent: true,
      channel: notification.channel,
      recipients: notification.recipients.length
    };
  }

  /**
   * Utility Methods
   */
  private validateWorkflowData(workflowData: any): void {
    if (!workflowData || typeof workflowData !== 'object') {
      throw new Error('Invalid workflow data structure');
    }

    if (!workflowData.nodes || !Array.isArray(workflowData.nodes)) {
      throw new Error('Workflow must contain nodes array');
    }

    if (!workflowData.edges || !Array.isArray(workflowData.edges)) {
      throw new Error('Workflow must contain edges array');
    }

    // Validate nodes have required properties
    for (const node of workflowData.nodes) {
      if (!node.id || !node.type) {
        throw new Error('All nodes must have id and type properties');
      }
    }

    // Validate edges reference valid nodes
    const nodeIds = new Set(workflowData.nodes.map((n: any) => n.id));
    for (const edge of workflowData.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error('Edge references invalid node');
      }
    }
  }

  private incrementVersion(currentVersion?: string): string {
    if (!currentVersion) return '1.0.0';
    
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
  }

  private generateCorrelationId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updateWorkflowStats(workflowId: string, eventType: string): Promise<void> {
    // Implementation for updating workflow execution statistics
    // This would track success rates, execution counts, etc.
  }

  private interpolateTemplate(template: string, context: any): string {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match;
    });
  }

  /**
   * Helper methods for node execution
   */
  private findNextNodes(currentNode: any, edges: any[], allNodes: any[], executionResult: any): any[] {
    const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
    const nextNodes = [];

    for (const edge of outgoingEdges) {
      // Check edge conditions
      if (this.evaluateEdgeCondition(edge, executionResult)) {
        const nextNode = allNodes.find(node => node.id === edge.target);
        if (nextNode) {
          nextNodes.push(nextNode);
        }
      }
    }

    return nextNodes;
  }

  private evaluateEdgeCondition(edge: any, executionResult: any): boolean {
    if (!edge.conditions) return true;

    const conditionType = edge.conditions.type;
    
    switch (conditionType) {
      case 'success':
        return executionResult.success === true;
      case 'failure':
        return executionResult.success === false;
      case 'custom':
        return this.evaluateCustomCondition(edge.conditions.expression, executionResult);
      default:
        return true;
    }
  }

  private evaluateCustomCondition(expression: string, context: any): boolean {
    // Safe evaluation of custom conditions
    // This would implement a secure expression evaluator
    try {
      // Simplified implementation - in production, use a secure expression evaluator
      const func = new Function('context', `return ${expression}`);
      return Boolean(func(context));
    } catch (error) {
      console.error('Error evaluating custom condition:', error);
      return false;
    }
  }

  private async checkInstanceCompletion(instanceId: string): Promise<void> {
    // Check if all executions are completed
    const pendingExecutions = await this.db.select()
      .from(workflowExecutions)
      .where(and(
        eq(workflowExecutions.instanceId, instanceId),
        inArray(workflowExecutions.status, ['pending', 'running', 'waiting_approval'])
      ));

    if (pendingExecutions.length === 0) {
      // All executions are complete, mark instance as completed
      const completedExecutions = await this.db.select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.instanceId, instanceId));

      const hasFailures = completedExecutions.some(exec => exec.status === 'failed');
      const finalStatus = hasFailures ? 'failed' : 'completed';

      await this.db.update(workflowInstances)
        .set({
          status: finalStatus,
          completedAt: new Date(),
          progress: 100
        })
        .where(eq(workflowInstances.id, instanceId));

      // Send completion notification
      await this.sendWorkflowNotification(instanceId, `workflow_${finalStatus}`);
    }
  }

  private async sendWorkflowNotification(instanceId: string, notificationType: string): Promise<void> {
    // Implementation for sending workflow notifications
    // This would integrate with the notification system
  }

  private async sendApprovalNotification(approvalId: string, config: any): Promise<void> {
    // Implementation for sending approval request notifications
  }

  private async sendNotification(notification: any): Promise<void> {
    // Implementation for sending notifications through various channels
  }
}

export const workflowService = new WorkflowService();
export default WorkflowService;
```

## API Routes Implementation

### Workflow Routes (server/routes/workflowRoutes.ts)
```typescript
import { Router } from 'express';
import { z } from 'zod';
import { WorkflowService } from '../services/WorkflowService';
import { requireAuth } from '../middleware/auth';

const router = Router();
const workflowService = new WorkflowService();

// Validation schemas
const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['vulnerability', 'compliance', 'incident', 'automation', 'custom']).default('custom'),
  workflowData: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any())
  }),
  isTemplate: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  configuration: z.record(z.any()).optional()
});

const updateWorkflowSchema = createWorkflowSchema.partial();

const executeWorkflowSchema = z.object({
  executionContext: z.object({
    inputData: z.record(z.any()).optional(),
    businessContext: z.object({
      businessUnit: z.string().optional(),
      costCenter: z.string().optional(),
      projectId: z.string().optional(),
      incidentId: z.string().optional()
    }).optional()
  }).optional(),
  options: z.object({
    priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
    timeoutMinutes: z.number().min(1).max(1440).default(60),
    maxRetries: z.number().min(0).max(10).default(0)
  }).optional()
});

/**
 * GET /api/workflows
 * List workflows with optional filtering
 */
router.get('/workflows', requireAuth, async (req, res) => {
  try {
    const { category, isTemplate, isActive, tags } = req.query;
    
    const workflows = await workflowService.getWorkflows({
      userId: req.user?.id,
      category: category as string,
      isTemplate: isTemplate === 'true',
      isActive: isActive !== 'false',
      tags: tags ? (tags as string).split(',') : undefined
    });

    res.json({
      status: 'success',
      data: workflows,
      total: workflows.length
    });

  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch workflows',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/:id
 * Get workflow by ID with optional details
 */
router.get('/workflows/:id', requireAuth, async (req, res) => {
  try {
    const { includeDetails } = req.query;
    
    const workflow = await workflowService.getWorkflowById(
      req.params.id,
      includeDetails === 'true'
    );
    
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow not found'
      });
    }

    res.json({
      status: 'success',
      data: workflow
    });

  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch workflow',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows
 * Create new workflow
 */
router.post('/workflows', requireAuth, async (req, res) => {
  try {
    const validatedData = createWorkflowSchema.parse(req.body);
    
    const workflow = await workflowService.createWorkflow({
      ...validatedData,
      createdBy: req.user!.id
    });

    res.status(201).json({
      status: 'success',
      data: workflow,
      message: 'Workflow created successfully'
    });

  } catch (error) {
    console.error('Error creating workflow:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      status: 'error',
      error: 'Failed to create workflow',
      message: error.message
    });
  }
});

/**
 * PUT /api/workflows/:id
 * Update workflow
 */
router.put('/workflows/:id', requireAuth, async (req, res) => {
  try {
    const validatedData = updateWorkflowSchema.parse(req.body);
    
    const workflow = await workflowService.updateWorkflow(req.params.id, {
      ...validatedData,
      updatedBy: req.user!.id
    });
    
    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow not found'
      });
    }

    res.json({
      status: 'success',
      data: workflow,
      message: 'Workflow updated successfully'
    });

  } catch (error) {
    console.error('Error updating workflow:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      status: 'error',
      error: 'Failed to update workflow',
      message: error.message
    });
  }
});

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
router.delete('/workflows/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await workflowService.deleteWorkflow(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow not found'
      });
    }

    res.status(204).send();

  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to delete workflow',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows/:id/execute
 * Execute workflow
 */
router.post('/workflows/:id/execute', requireAuth, async (req, res) => {
  try {
    const validatedData = executeWorkflowSchema.parse(req.body);
    
    const instance = await workflowService.executeWorkflow(
      req.params.id,
      {
        triggeredBy: req.user!.id,
        triggerSource: 'manual',
        ...validatedData.executionContext
      },
      validatedData.options
    );

    res.json({
      status: 'success',
      data: {
        instanceId: instance.id,
        status: instance.status,
        startedAt: instance.startedAt,
        correlationId: instance.correlationId
      },
      message: 'Workflow execution started'
    });

  } catch (error) {
    console.error('Error executing workflow:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        error: 'Validation failed',
        details: error.errors
      });
    }

    res.status(500).json({
      status: 'error',
      error: 'Failed to execute workflow',
      message: error.message
    });
  }
});

/**
 * GET /api/workflow-instances
 * List workflow instances with filtering
 */
router.get('/workflow-instances', requireAuth, async (req, res) => {
  try {
    const { 
      workflowId, 
      status, 
      triggeredBy, 
      limit = '50', 
      offset = '0' 
    } = req.query;

    const instances = await workflowService.getWorkflowInstances({
      workflowId: workflowId as string,
      status: status ? (status as string).split(',') : undefined,
      triggeredBy: triggeredBy as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10)
    });

    res.json({
      status: 'success',
      data: instances,
      pagination: {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        total: instances.length
      }
    });

  } catch (error) {
    console.error('Error fetching workflow instances:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch workflow instances',
      message: error.message
    });
  }
});

/**
 * GET /api/workflow-instances/:id
 * Get workflow instance by ID
 */
router.get('/workflow-instances/:id', requireAuth, async (req, res) => {
  try {
    const instance = await workflowService.getWorkflowInstanceById(req.params.id);
    
    if (!instance) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow instance not found'
      });
    }

    res.json({
      status: 'success',
      data: instance
    });

  } catch (error) {
    console.error('Error fetching workflow instance:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch workflow instance',
      message: error.message
    });
  }
});

/**
 * GET /api/workflow-instances/:id/details
 * Get workflow instance with execution details
 */
router.get('/workflow-instances/:id/details', requireAuth, async (req, res) => {
  try {
    const instanceWithSteps = await workflowService.getWorkflowInstanceWithSteps(req.params.id);
    
    if (!instanceWithSteps) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow instance not found'
      });
    }

    res.json({
      status: 'success',
      data: instanceWithSteps
    });

  } catch (error) {
    console.error('Error fetching workflow instance details:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch workflow instance details',
      message: error.message
    });
  }
});

/**
 * POST /api/workflow-instances/:id/pause
 * Pause workflow instance
 */
router.post('/workflow-instances/:id/pause', requireAuth, async (req, res) => {
  try {
    const paused = await workflowService.pauseWorkflowInstance(req.params.id);
    
    if (!paused) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow instance not found or cannot be paused'
      });
    }

    res.json({
      status: 'success',
      data: { status: 'paused' },
      message: 'Workflow instance paused'
    });

  } catch (error) {
    console.error('Error pausing workflow instance:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to pause workflow instance',
      message: error.message
    });
  }
});

/**
 * POST /api/workflow-instances/:id/resume
 * Resume workflow instance
 */
router.post('/workflow-instances/:id/resume', requireAuth, async (req, res) => {
  try {
    const resumed = await workflowService.resumeWorkflowInstance(req.params.id);
    
    if (!resumed) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow instance not found or cannot be resumed'
      });
    }

    res.json({
      status: 'success',
      data: { status: 'running' },
      message: 'Workflow instance resumed'
    });

  } catch (error) {
    console.error('Error resuming workflow instance:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to resume workflow instance',
      message: error.message
    });
  }
});

/**
 * POST /api/workflow-instances/:id/cancel
 * Cancel workflow instance
 */
router.post('/workflow-instances/:id/cancel', requireAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const cancelled = await workflowService.cancelWorkflowInstance(req.params.id, reason);
    
    if (!cancelled) {
      return res.status(404).json({
        status: 'error',
        error: 'Workflow instance not found or cannot be cancelled'
      });
    }

    res.json({
      status: 'success',
      data: { status: 'cancelled' },
      message: 'Workflow instance cancelled'
    });

  } catch (error) {
    console.error('Error cancelling workflow instance:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to cancel workflow instance',
      message: error.message
    });
  }
});

/**
 * GET /api/workflows/:id/analytics
 * Get workflow analytics and metrics
 */
router.get('/workflows/:id/analytics', requireAuth, async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const analytics = await workflowService.getWorkflowAnalytics(
      req.params.id,
      timeRange as string
    );

    res.json({
      status: 'success',
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching workflow analytics:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to fetch workflow analytics',
      message: error.message
    });
  }
});

/**
 * POST /api/workflows/:id/validate
 * Validate workflow configuration
 */
router.post('/workflows/:id/validate', requireAuth, async (req, res) => {
  try {
    const validation = await workflowService.validateWorkflow(req.params.id);

    res.json({
      status: 'success',
      data: validation
    });

  } catch (error) {
    console.error('Error validating workflow:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to validate workflow',
      message: error.message
    });
  }
});

export default router;
```

## UI Components Implementation

### Workflow Builder Page (client/src/pages/workflows/WorkflowBuilderPage.tsx)
```typescript
import React, { useState, useRef, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  addEdge,
  Edge,
  Connection,
  Node
} from 'reactflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Save, 
  Download, 
  Upload, 
  Settings, 
  Trash2,
  FileTemplate,
  Eye,
  Zap
} from 'lucide-react';

// Import workflow components
import WorkflowNodeLibrary from '@/components/workflows/WorkflowNodeLibrary';
import WorkflowConfigPanel from '@/components/workflows/WorkflowConfigPanel';
import WorkflowExecutionMonitor from '@/components/workflows/WorkflowExecutionMonitor';
import WorkflowTemplateManager from '@/components/workflows/WorkflowTemplateManager';
import { workflowNodeTypes } from '@/components/workflows/WorkflowNodes';

import 'reactflow/dist/style.css';

export interface WorkflowNode extends Node {
  data: {
    label: string;
    nodeType: 'trigger' | 'action' | 'condition' | 'approval' | 'integration' | 'notification';
    configuration: any;
    executionStatus?: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  };
}

const WorkflowBuilderInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project, getViewport, fitView } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  
  // Workflow state
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowCategory, setWorkflowCategory] = useState<'vulnerability' | 'compliance' | 'incident' | 'automation' | 'custom'>('vulnerability');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionInstanceId, setExecutionInstanceId] = useState<string | null>(null);
  
  // UI state
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [selectedTab, setSelectedTab] = useState('builder');
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [nodeLibraryFilter, setNodeLibraryFilter] = useState('all');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery<any[]>({
    queryKey: ['/api/workflows'],
    enabled: true
  });

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      const method = workflowId ? 'PUT' : 'POST';
      const url = workflowId ? `/api/workflows/${workflowId}` : '/api/workflows';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflowData)
      });

      if (!response.ok) {
        throw new Error(`Failed to save workflow: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setWorkflowId(data.data.id);
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: 'Workflow Saved',
        description: 'Your workflow has been saved successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Save Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async (workflowId: string) => {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executionContext: {
            inputData: {},
            businessContext: {}
          },
          options: {
            priority: 'normal'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to execute workflow: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      setExecutionInstanceId(data.data.instanceId);
      setIsExecuting(true);
      setSelectedTab('execution');
      toast({
        title: 'Workflow Executing',
        description: 'Your workflow is now running.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Execution Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Event handlers
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const nodeData = JSON.parse(event.dataTransfer.getData('application/nodedata') || '{}');

      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: WorkflowNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: nodeData.label || `${type} node`,
          nodeType: nodeData.nodeType || type,
          configuration: nodeData.defaultConfiguration || {}
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a workflow name.',
        variant: 'destructive',
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one node to the workflow.',
        variant: 'destructive',
      });
      return;
    }

    const workflowData = {
      name: workflowName,
      description: workflowDescription,
      category: workflowCategory,
      workflowData: {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: edge.type,
          data: edge.data
        }))
      }
    };

    saveWorkflowMutation.mutate(workflowData);
  };

  const handleExecuteWorkflow = () => {
    if (!workflowId) {
      toast({
        title: 'Save Required',
        description: 'Please save the workflow before executing.',
        variant: 'destructive',
      });
      return;
    }

    executeWorkflowMutation.mutate(workflowId);
  };

  const handleNodeClick = (event: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node);
  };

  const handleLoadWorkflow = (workflow: any) => {
    setWorkflowId(workflow.id);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description);
    setWorkflowCategory(workflow.category);
    
    if (workflow.workflowData) {
      setNodes(workflow.workflowData.nodes || []);
      setEdges(workflow.workflowData.edges || []);
    }
  };

  const handleNewWorkflow = () => {
    setWorkflowId(null);
    setWorkflowName('');
    setWorkflowDescription('');
    setWorkflowCategory('vulnerability');
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Node Library */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">Node Library</h3>
          <Input
            placeholder="Filter nodes..."
            value={nodeLibraryFilter}
            onChange={(e) => setNodeLibraryFilter(e.target.value)}
            className="mt-2"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <WorkflowNodeLibrary filter={nodeLibraryFilter} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="border-b bg-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="w-64"
            />
            <Button
              onClick={handleSaveWorkflow}
              disabled={saveWorkflowMutation.isPending}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              onClick={handleExecuteWorkflow}
              disabled={!workflowId || executeWorkflowMutation.isPending || isExecuting}
              size="sm"
              variant="outline"
            >
              {isExecuting ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={handleNewWorkflow}
              variant="ghost"
              size="sm"
            >
              New
            </Button>
            <Button
              onClick={() => setShowTemplateManager(true)}
              variant="ghost"
              size="sm"
            >
              <FileTemplate className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            onNodeClick={handleNodeClick}
            nodeTypes={workflowNodeTypes}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
            minZoom={0.2}
            maxZoom={2}
            snapToGrid={true}
            snapGrid={[20, 20]}
            className="workflow-react-flow"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#e5e7eb"
            />
            <Controls
              showZoom={true}
              showFitView={true}
              showInteractive={true}
              position="bottom-right"
            />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'trigger': return '#10b981';
                  case 'action': return '#3b82f6';
                  case 'condition': return '#f59e0b';
                  case 'approval': return '#ef4444';
                  case 'integration': return '#8b5cf6';
                  case 'notification': return '#06b6d4';
                  default: return '#6b7280';
                }
              }}
              position="bottom-left"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right Panel - Configuration and Monitoring */}
      <div className="w-96 border-l bg-white">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="builder" className="p-4">
            <WorkflowConfigPanel 
              selectedNode={selectedNode}
              onNodeUpdate={(nodeId, updates) => {
                setNodes((nds) => 
                  nds.map((node) => 
                    node.id === nodeId 
                      ? { ...node, data: { ...node.data, ...updates } }
                      : node
                  )
                );
              }}
            />
          </TabsContent>
          
          <TabsContent value="execution" className="p-4">
            <WorkflowExecutionMonitor 
              instanceId={executionInstanceId}
              onExecutionComplete={() => {
                setIsExecuting(false);
                setExecutionInstanceId(null);
              }}
            />
          </TabsContent>
          
          <TabsContent value="templates" className="p-4">
            <div className="space-y-4">
              {workflows.map((workflow: any) => (
                <Card
                  key={workflow.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleLoadWorkflow(workflow)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{workflow.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">
                      {workflow.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">{workflow.category}</span>
                      <span>{workflow.executionCount || 0} runs</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Manager Dialog */}
      {showTemplateManager && (
        <WorkflowTemplateManager
          open={showTemplateManager}
          onOpenChange={setShowTemplateManager}
          onTemplateSelect={(template) => {
            handleLoadWorkflow(template);
            setShowTemplateManager(false);
          }}
        />
      )}
    </div>
  );
};

const WorkflowBuilderPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  );
};

export default WorkflowBuilderPage;
```

## System Features

### Visual Workflow Builder
- **React Flow Integration**: Professional drag-and-drop interface with custom node types and edge styling
- **Node Library**: 20+ pre-built nodes across 6 categories with configurable properties
- **Real-Time Validation**: Immediate feedback on workflow configuration and logical consistency
- **Template System**: Built-in templates for common security scenarios with sharing capabilities
- **Collaborative Editing**: Multi-user support with conflict resolution and version control

### Enterprise Execution Engine
- **Multi-threaded Processing**: Concurrent execution with sophisticated dependency management
- **State Management**: Comprehensive tracking with real-time progress monitoring
- **Error Handling**: Robust error recovery with configurable retry policies and escalation
- **Resource Management**: CPU, memory, and network resource allocation and monitoring
- **Performance Analytics**: Detailed metrics on execution times, success rates, and resource usage

### Integration Framework
- **Security Tool Connectors**: Pre-built integrations for Tenable, Qualys, Rapid7, and other security platforms
- **Communication Channels**: Slack, Teams, email, SMS, and webhook notification support
- **API Gateway**: RESTful API for external system integration and programmatic access
- **Data Transformation**: Built-in data mapping and transformation capabilities
- **Authentication**: Support for OAuth, API keys, and certificate-based authentication

### Monitoring and Analytics
- **Real-Time Dashboards**: Live monitoring of workflow execution with drill-down capabilities
- **Performance Metrics**: Comprehensive analytics on execution patterns and bottlenecks
- **Audit Logging**: Complete audit trails for compliance and security requirements
- **Alerting System**: Configurable alerts for failures, performance issues, and SLA violations
- **Business Intelligence**: Integration with BI tools for executive reporting and insights

## Security & Performance Requirements

### Security Features
- **Role-Based Access Control**: Granular permissions for workflow creation, execution, and monitoring
- **Data Encryption**: End-to-end encryption for sensitive workflow data and communications
- **Audit Logging**: Comprehensive logging of all workflow operations for compliance tracking
- **Input Validation**: Robust validation and sanitization of all workflow inputs and configurations
- **Secret Management**: Secure storage and rotation of API keys and credentials

### Performance Optimizations
- **Horizontal Scaling**: Support for multiple execution workers with load balancing
- **Caching Strategy**: Redis-based caching for workflow definitions and execution state
- **Database Optimization**: Proper indexing and query optimization for large-scale deployments
- **Resource Pooling**: Connection pooling and resource reuse for external integrations
- **Asynchronous Processing**: Non-blocking execution with event-driven architecture

### Scalability Considerations
- **Microservices Architecture**: Modular design with independent scaling of components
- **Container Support**: Docker and Kubernetes deployment with auto-scaling capabilities
- **Load Balancing**: Intelligent distribution of workflow execution across available resources
- **Message Queuing**: Robust message queuing for reliable workflow execution
- **High Availability**: Multi-region deployment with failover and disaster recovery

## Integration Points

### External System Integration
- **Security Platforms**: Integration with SIEM, SOAR, and vulnerability management systems
- **Cloud Providers**: Native integration with AWS, Azure, and GCP services
- **Communication Tools**: Slack, Teams, email, and SMS notification capabilities
- **Ticketing Systems**: JIRA, ServiceNow, and other ITSM platform integration
- **Identity Providers**: SSO integration with Active Directory, Okta, and SAML providers

### Data Sources and Sinks
- **Database Connectivity**: Support for PostgreSQL, MySQL, MongoDB, and other databases
- **File Systems**: Local and cloud storage integration for data processing
- **API Endpoints**: RESTful and GraphQL API consumption and publishing
- **Message Brokers**: Integration with RabbitMQ, Apache Kafka, and cloud messaging services
- **Data Warehouses**: Connection to Snowflake, BigQuery, and other analytics platforms

### Development and DevOps
- **Version Control**: Git integration for workflow versioning and collaboration
- **CI/CD Pipelines**: Integration with Jenkins, GitLab CI, and GitHub Actions
- **Infrastructure as Code**: Terraform and CloudFormation template generation
- **Monitoring Platforms**: Integration with Prometheus, Grafana, and cloud monitoring services
- **Container Registries**: Docker Hub, ECR, and other container registry support

This comprehensive documentation provides complete technical specifications for recreating the Workflow Management System in any compatible environment, maintaining consistency with the established documentation pattern for enterprise-grade system portability.