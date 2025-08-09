# Workflow Management Database Schema

## Overview

The Workflow Management system uses 8 core PostgreSQL tables to support visual workflow creation, execution tracking, and automation processes. This document provides complete DDL definitions and relationships for system replication.

## Database Tables

### 1. workflows - Main Workflow Definitions

**Purpose**: Core workflow definitions containing metadata and JSON workflow data

```sql
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'custom',
    version VARCHAR(20) DEFAULT '1.0.0',
    workflow_data JSONB NOT NULL, -- Stores React Flow nodes and edges
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    tags JSONB, -- Array of string tags
    configuration JSONB, -- Workflow-level configuration
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_workflows_category ON workflows(category);
CREATE INDEX idx_workflows_active ON workflows(is_active);
CREATE INDEX idx_workflows_template ON workflows(is_template);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_name ON workflows(name);
```

**Key Fields**:
- `workflow_data`: Complete React Flow graph data (nodes, edges, viewport)
- `category`: Workflow categorization (vulnerability, compliance, incident, automation, custom)
- `is_template`: Distinguishes templates from active workflows
- `configuration`: Global workflow settings (timeouts, retry policies, notifications)

### 2. workflow_nodes - Individual Workflow Nodes

**Purpose**: Individual node definitions within workflows with position and configuration data

```sql
CREATE TABLE workflow_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL, -- React Flow node ID
    node_type VARCHAR(50) NOT NULL, -- trigger, action, condition, approval, integration, notification
    label VARCHAR(255) NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    configuration JSONB, -- Node-specific configuration
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX idx_workflow_nodes_type ON workflow_nodes(node_type);
CREATE INDEX idx_workflow_nodes_enabled ON workflow_nodes(is_enabled);
CREATE UNIQUE INDEX idx_workflow_nodes_unique ON workflow_nodes(workflow_id, node_id);
```

**Node Types**:
- `trigger`: Schedule, vulnerability detection, compliance failure, webhook, manual
- `action`: Tenable scan, GitLab integration, AWS operations, patch deployment
- `condition`: CVSS checks, asset filtering, risk assessment, data validation
- `approval`: Manager approval, security review, executive sign-off
- `integration`: Email/SMTP, Slack/Teams, webhooks, external APIs
- `notification`: Email alerts, chat messages, SMS, webhook calls

### 3. workflow_edges - Node Connections

**Purpose**: Connections and relationships between workflow nodes with conditional routing

```sql
CREATE TABLE workflow_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    edge_id VARCHAR(100) NOT NULL, -- React Flow edge ID
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    source_handle VARCHAR(50), -- Connection point on source node
    target_handle VARCHAR(50), -- Connection point on target node
    edge_type VARCHAR(50) DEFAULT 'smoothstep', -- React Flow edge type
    conditions JSONB, -- Conditional routing rules
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX idx_workflow_edges_source ON workflow_edges(source_node_id);
CREATE INDEX idx_workflow_edges_target ON workflow_edges(target_node_id);
CREATE UNIQUE INDEX idx_workflow_edges_unique ON workflow_edges(workflow_id, edge_id);
```

**Conditional Routing Examples**:
```json
{
  "conditions": [
    {
      "field": "cvss_score",
      "operator": "greater_than",
      "value": 7.0,
      "target": "high_severity_path"
    },
    {
      "field": "asset_criticality", 
      "operator": "equals",
      "value": "critical",
      "target": "critical_asset_path"
    }
  ]
}
```

### 4. workflow_triggers - Trigger Configurations

**Purpose**: Workflow trigger configurations for automatic execution

```sql
CREATE TABLE workflow_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- schedule, event, webhook, manual
    trigger_source VARCHAR(100), -- cron, tenable, gitlab, api
    configuration JSONB, -- Trigger-specific settings
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_triggers_type ON workflow_triggers(trigger_type);
CREATE INDEX idx_workflow_triggers_active ON workflow_triggers(is_active);
CREATE INDEX idx_workflow_triggers_source ON workflow_triggers(trigger_source);
```

**Trigger Configuration Examples**:
```json
// Schedule Trigger
{
  "cronExpression": "0 9 * * 1-5",
  "timezone": "UTC",
  "description": "Weekdays at 9 AM"
}

// Vulnerability Trigger
{
  "severity": ["high", "critical"],
  "source": "tenable",
  "assetGroups": ["production", "critical"],
  "cvssThreshold": 7.0
}

// Webhook Trigger
{
  "endpoint": "/webhook/security-event",
  "authentication": "token",
  "allowedIPs": ["192.168.1.0/24"]
}
```

### 5. workflow_instances - Runtime Execution Instances

**Purpose**: Runtime instances of workflow executions with status and progress tracking

```sql
CREATE TABLE workflow_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    status VARCHAR(50) NOT NULL, -- pending, running, completed, failed, paused, cancelled
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    paused_at TIMESTAMP,
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    current_step VARCHAR(100), -- Current executing node ID
    execution_context JSONB, -- Input data and runtime context
    output_data JSONB, -- Final workflow output
    error_details TEXT,
    triggered_by VARCHAR(100), -- User ID or system trigger
    trigger_source VARCHAR(100), -- manual, schedule, event, webhook
    execution_metrics JSONB, -- Performance and timing metrics
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_instances_workflow_id ON workflow_instances(workflow_id);
CREATE INDEX idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX idx_workflow_instances_started_at ON workflow_instances(started_at);
CREATE INDEX idx_workflow_instances_triggered_by ON workflow_instances(triggered_by);
CREATE INDEX idx_workflow_instances_priority ON workflow_instances(priority);
```

**Status Lifecycle**:
- `pending`: Queued for execution
- `running`: Currently executing
- `completed`: Successfully completed
- `failed`: Execution failed
- `paused`: Manually paused
- `cancelled`: Execution cancelled

### 6. workflow_executions - Individual Step Executions

**Purpose**: Individual step executions within workflow instances with detailed tracking

```sql
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL, -- Node being executed
    step_type VARCHAR(50) NOT NULL, -- Node type being executed
    status VARCHAR(50) NOT NULL, -- pending, running, completed, failed, skipped, waiting_approval
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER, -- Execution duration in milliseconds
    input_data JSONB, -- Input data for this step
    output_data JSONB, -- Output data from this step
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_executions_instance_id ON workflow_executions(instance_id);
CREATE INDEX idx_workflow_executions_node_id ON workflow_executions(node_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_step_type ON workflow_executions(step_type);
CREATE INDEX idx_workflow_executions_started_at ON workflow_executions(started_at);
```

**Step Execution Data Examples**:
```json
// Tenable Scan Step
{
  "input_data": {
    "scanType": "credentialed",
    "targets": ["192.168.1.100", "192.168.1.101"],
    "template": "advanced"
  },
  "output_data": {
    "scanId": "12345",
    "vulnerabilitiesFound": 23,
    "highSeverity": 5,
    "criticalSeverity": 2
  }
}

// GitLab Issue Creation
{
  "input_data": {
    "project": "security/vulnerabilities",
    "title": "Critical vulnerabilities found on web01",
    "assignee": "security-team"
  },
  "output_data": {
    "issueId": 456,
    "issueUrl": "https://gitlab.com/security/vulnerabilities/-/issues/456"
  }
}
```

### 7. workflow_approvals - Approval Management

**Purpose**: Approval step management with role-based authorization and timeouts

```sql
CREATE TABLE workflow_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    approver_role VARCHAR(100) NOT NULL, -- manager, security_team, executive, ciso
    approver_user_id VARCHAR(100), -- Actual approver when responded
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, expired
    requested_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    expires_at TIMESTAMP, -- Approval timeout
    approval_message TEXT,
    rejection_reason TEXT,
    approval_data JSONB, -- Additional approval context
    notifications_sent INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_approvals_execution_id ON workflow_approvals(execution_id);
CREATE INDEX idx_workflow_approvals_role ON workflow_approvals(approver_role);
CREATE INDEX idx_workflow_approvals_user_id ON workflow_approvals(approver_user_id);
CREATE INDEX idx_workflow_approvals_status ON workflow_approvals(status);
CREATE INDEX idx_workflow_approvals_expires_at ON workflow_approvals(expires_at);
```

**Approval Roles and Escalation**:
- `manager`: Direct manager approval for routine operations
- `security_team`: Security team review for security-related changes
- `executive`: Executive approval for high-impact changes
- `ciso`: CISO approval for critical security decisions

### 8. workflow_notifications - Notification Management

**Purpose**: Notification management and delivery tracking for workflow events

```sql
CREATE TABLE workflow_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id),
    instance_id UUID REFERENCES workflow_instances(id),
    execution_id UUID REFERENCES workflow_executions(id),
    notification_type VARCHAR(50) NOT NULL, -- step_complete, workflow_complete, approval_request, error_alert
    channel VARCHAR(50) NOT NULL, -- email, slack, webhook, sms
    recipients JSONB, -- Array of recipients
    subject VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    error_details TEXT,
    retry_count INTEGER DEFAULT 0,
    notification_data JSONB, -- Channel-specific data
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_notifications_workflow_id ON workflow_notifications(workflow_id);
CREATE INDEX idx_workflow_notifications_instance_id ON workflow_notifications(instance_id);
CREATE INDEX idx_workflow_notifications_type ON workflow_notifications(notification_type);
CREATE INDEX idx_workflow_notifications_channel ON workflow_notifications(channel);
CREATE INDEX idx_workflow_notifications_status ON workflow_notifications(status);
```

**Notification Configuration Examples**:
```json
// Email Notification
{
  "notification_data": {
    "smtp_server": "smtp.company.com",
    "from_address": "security@company.com",
    "template": "vulnerability_alert",
    "attachments": ["scan_report.pdf"]
  }
}

// Slack Notification
{
  "notification_data": {
    "webhook_url": "https://hooks.slack.com/...",
    "channel": "#security-alerts",
    "username": "SecurityBot",
    "blocks": [...] // Slack block kit format
  }
}
```

## Database Views

### Workflow Execution Summary View

```sql
CREATE VIEW vw_workflow_execution_summary AS
SELECT 
    wi.id as instance_id,
    w.name as workflow_name,
    w.category,
    wi.status,
    wi.priority,
    wi.started_at,
    wi.completed_at,
    wi.progress,
    wi.triggered_by,
    wi.trigger_source,
    COUNT(we.id) as total_steps,
    COUNT(CASE WHEN we.status = 'completed' THEN 1 END) as completed_steps,
    COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed_steps,
    COUNT(CASE WHEN we.status = 'waiting_approval' THEN 1 END) as pending_approvals,
    AVG(we.duration_ms) as avg_step_duration_ms
FROM workflow_instances wi
LEFT JOIN workflows w ON wi.workflow_id = w.id
LEFT JOIN workflow_executions we ON wi.id = we.instance_id
GROUP BY wi.id, w.name, w.category, wi.status, wi.priority, wi.started_at, wi.completed_at, wi.progress, wi.triggered_by, wi.trigger_source;
```

### Workflow Performance Metrics View

```sql
CREATE VIEW vw_workflow_performance AS
SELECT 
    w.id as workflow_id,
    w.name as workflow_name,
    w.category,
    COUNT(wi.id) as total_executions,
    COUNT(CASE WHEN wi.status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN wi.status = 'failed' THEN 1 END) as failed_executions,
    ROUND(
        (COUNT(CASE WHEN wi.status = 'completed' THEN 1 END)::DECIMAL / COUNT(wi.id)) * 100, 2
    ) as success_rate_percent,
    AVG(EXTRACT(EPOCH FROM (wi.completed_at - wi.started_at))) as avg_duration_seconds,
    MIN(wi.started_at) as first_execution,
    MAX(wi.started_at) as last_execution
FROM workflows w
LEFT JOIN workflow_instances wi ON w.id = wi.workflow_id
WHERE w.is_active = true
GROUP BY w.id, w.name, w.category;
```

## Stored Functions

### Workflow Execution Status Update Function

```sql
CREATE OR REPLACE FUNCTION update_workflow_instance_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update workflow instance progress based on step completions
    UPDATE workflow_instances 
    SET 
        progress = (
            SELECT ROUND(
                (COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*)) * 100
            )
            FROM workflow_executions 
            WHERE instance_id = NEW.instance_id
        ),
        current_step = CASE 
            WHEN NEW.status = 'running' THEN NEW.node_id
            ELSE current_step
        END,
        updated_at = NOW()
    WHERE id = NEW.instance_id;
    
    -- Update completion timestamp if all steps are done
    UPDATE workflow_instances
    SET completed_at = NOW()
    WHERE id = NEW.instance_id
    AND status = 'running'
    AND NOT EXISTS (
        SELECT 1 FROM workflow_executions 
        WHERE instance_id = NEW.instance_id 
        AND status IN ('pending', 'running', 'waiting_approval')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_workflow_progress
    AFTER UPDATE ON workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_instance_progress();
```

### Approval Expiration Function

```sql
CREATE OR REPLACE FUNCTION expire_workflow_approvals()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- Mark expired approvals
    UPDATE workflow_approvals 
    SET 
        status = 'expired',
        updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- Fail associated workflow executions
    UPDATE workflow_executions
    SET 
        status = 'failed',
        error_message = 'Approval expired',
        completed_at = NOW()
    WHERE id IN (
        SELECT execution_id 
        FROM workflow_approvals 
        WHERE status = 'expired'
        AND updated_at = NOW()::DATE
    );
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;
```

## Database Constraints and Business Rules

### Foreign Key Relationships

```sql
-- Ensure workflow data integrity
ALTER TABLE workflow_nodes 
    ADD CONSTRAINT fk_workflow_nodes_workflow 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE workflow_edges 
    ADD CONSTRAINT fk_workflow_edges_workflow 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

ALTER TABLE workflow_triggers 
    ADD CONSTRAINT fk_workflow_triggers_workflow 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;

-- Ensure execution data integrity
ALTER TABLE workflow_instances 
    ADD CONSTRAINT fk_workflow_instances_workflow 
    FOREIGN KEY (workflow_id) REFERENCES workflows(id);

ALTER TABLE workflow_executions 
    ADD CONSTRAINT fk_workflow_executions_instance 
    FOREIGN KEY (instance_id) REFERENCES workflow_instances(id) ON DELETE CASCADE;

ALTER TABLE workflow_approvals 
    ADD CONSTRAINT fk_workflow_approvals_execution 
    FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE;
```

### Check Constraints

```sql
-- Workflow status validation
ALTER TABLE workflow_instances 
    ADD CONSTRAINT chk_workflow_instance_status 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused', 'cancelled'));

-- Progress validation
ALTER TABLE workflow_instances 
    ADD CONSTRAINT chk_workflow_instance_progress 
    CHECK (progress >= 0 AND progress <= 100);

-- Priority validation
ALTER TABLE workflow_instances 
    ADD CONSTRAINT chk_workflow_instance_priority 
    CHECK (priority IN ('low', 'normal', 'high', 'critical'));

-- Execution status validation
ALTER TABLE workflow_executions 
    ADD CONSTRAINT chk_workflow_execution_status 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'waiting_approval'));

-- Approval status validation
ALTER TABLE workflow_approvals 
    ADD CONSTRAINT chk_workflow_approval_status 
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));
```

This comprehensive database schema provides the foundation for a robust workflow management system with complete tracking, approval workflows, notification management, and performance monitoring capabilities.