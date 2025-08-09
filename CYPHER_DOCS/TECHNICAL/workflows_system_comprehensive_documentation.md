# Workflows System - Comprehensive Code-to-UI Documentation

## System Overview
The Workflows System in RAS DASH provides comprehensive policy workflow management, visual workflow automation, network diagram creation, and approval processes. This enterprise-grade system integrates policy lifecycle management with visual workflow builder capabilities, offering automated approval workflows, real-time collaboration, and comprehensive audit trails.

**Routes**: 
- `/policies/workflow` (Policy workflows management)
- `/network-diagrams` (Visual workflow builder with React Flow)
- Various approval workflows embedded in compliance systems

**Architecture**: Mixed model architecture with Drizzle ORM workflow schema, Sequelize policy workflow models, React Flow visual builder, and comprehensive approval automation

## Table of Contents
1. [Database Schema and Models](#database-schema)
2. [Service Layer Architecture](#service-layer)
3. [Controller Layer](#controller-layer)
4. [Frontend Components](#frontend-components)
5. [Policy Workflow Management](#policy-workflows)
6. [Visual Workflow Builder](#visual-builder)
7. [Approval Workflows](#approval-workflows)
8. [Network Diagram Integration](#network-diagrams)
9. [Workflow Execution Engine](#execution-engine)
10. [Notification System](#notifications)
11. [API Endpoints](#api-endpoints)
12. [Integration Points](#integration-points)
13. [Security Features](#security-features)

---

## Database Schema and Models {#database-schema}

### 1. Visual Workflow Schema (Drizzle ORM - shared/workflow-schema.ts)
```typescript
// Core Workflow Tables
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).default('custom'),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  workflowData: jsonb('workflow_data').notNull(), // Stores nodes and edges
  isActive: boolean('is_active').default(true),
  isTemplate: boolean('is_template').default(false),
  tags: jsonb('tags'), // Array of string tags
  configuration: jsonb('configuration'), // Workflow-level config
  createdBy: varchar('created_by', { length: 100 }),
  updatedBy: varchar('updated_by', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

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

### 2. Policy Workflow Schema (Sequelize - server/models/PolicyWorkflow.ts)
```typescript
export interface PolicyWorkflowAttributes {
  id: number;
  title: string;
  description?: string;
  workflowType: 'Review' | 'Approval' | 'Update';
  status: 'In Progress' | 'Awaiting Approval' | 'Pending Review' | 'Completed';
  assignedTo?: number;
  dueDate?: Date;
  stage?: string;
  progress: number;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PolicyWorkflowModel extends Model<PolicyWorkflowAttributes, PolicyWorkflowCreationAttributes> {
  public id!: number;
  public title!: string;
  public description?: string;
  public workflowType!: 'Review' | 'Approval' | 'Update';
  public status!: 'In Progress' | 'Awaiting Approval' | 'Pending Review' | 'Completed';
  public assignedTo?: number;
  public dueDate?: Date;
  public stage?: string;
  public progress!: number;
  public createdBy?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}
```

### 3. TypeScript Types for Workflows
```typescript
// Core workflow types
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type WorkflowEdge = typeof workflowEdges.$inferSelect;
export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type WorkflowApproval = typeof workflowApprovals.$inferSelect;
export type WorkflowNotification = typeof workflowNotifications.$inferSelect;

// Workflow status enums
export const WorkflowStatus = {
  PENDING: 'pending',
  RUNNING: 'running', 
  COMPLETED: 'completed',
  FAILED: 'failed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled'
} as const;

export type WorkflowStatusType = typeof WorkflowStatus[keyof typeof WorkflowStatus];
```

---

## Service Layer Architecture {#service-layer}

### 1. WorkflowService (server/services/WorkflowService.ts)
**Visual Workflow Management Engine**
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

  // Workflow execution processing
  private async processWorkflowExecution(instance: WorkflowInstance): Promise<void>
  private async executeNode(instanceId: string, node: any, nodes: any[], edges: any[], context: any): Promise<void>
  private async handleNodeExecution(instanceId: string, node: any, context: any): Promise<any>
  private async findNextNodes(currentNodeId: string, edges: any[]): Promise<any[]>
  private async evaluateEdgeConditions(edge: any, context: any): Promise<boolean>
}
```

**Key Features**:
- Visual workflow creation and management
- Real-time workflow execution
- Node-based processing engine
- Conditional edge evaluation
- Instance lifecycle management
- Error handling and recovery

### 2. PolicyWorkflowService (server/services/PolicyWorkflowService.ts)
**Policy Lifecycle Management**
```typescript
export class PolicyWorkflowService extends BaseService<any> {
  async createWorkflow(workflowData: any): Promise<any>
  async advanceWorkflow(workflowId: number, actionData: any): Promise<any>
  async assignWorkflow(workflowId: number, assignedTo: number, assignedBy: number): Promise<any>
  async addWorkflowNote(workflowId: number, noteData: any): Promise<any>
  
  // Query methods
  async getWorkflowsByPolicy(policyId: number): Promise<any[]>
  async getWorkflowsByAssignee(assignedTo: number): Promise<any[]>
  async getActiveWorkflows(): Promise<any[]>
  async getOverdueWorkflows(days: number = 30): Promise<any[]>
  
  // Workflow management
  async escalateWorkflow(workflowId: number, escalationData: any): Promise<any>
  async cancelWorkflow(workflowId: number, cancellationData: any): Promise<any>
  
  // Analytics and reporting
  async getWorkflowStatistics(): Promise<any>
  async generateWorkflowReport(filters: PolicyWorkflowFilters = {}): Promise<any>
  async bulkAssign(workflowIds: number[], assignedTo: number, assignedBy: number): Promise<any[]>
  
  // Helper methods
  private getNextStep(currentStep: string, action: string): string
  private groupByProperty(items: any[], property: string): Record<string, number>
  private getOverdueCount(workflows: any[], days: number): number
  private calculateAverageCompletionTime(workflows: any[]): number
}
```

**Policy Workflow Features**:
- Policy lifecycle automation
- Multi-step approval processes
- Assignment and escalation management
- Comprehensive audit trails
- Bulk operations support
- Statistical reporting

---

## Controller Layer {#controller-layer}

### 1. WorkflowController (server/controllers/workflowController.ts)
**Visual Workflow API Management**
```typescript
// Core CRUD Operations
export const getAllWorkflows = async (req: Request, res: Response)
export const getWorkflowById = async (req: Request, res: Response)
export const createWorkflow = async (req: Request, res: Response)
export const updateWorkflow = async (req: Request, res: Response)

// Execution Control
export const executeWorkflow = async (req: Request, res: Response)
export const getWorkflowHistory = async (req: Request, res: Response)
```

### 2. Workflow Routes (server/routes/workflowRoutes.ts)
**RESTful API Endpoints**
```typescript
// Workflow CRUD endpoints
router.get('/workflows', async (req, res) => {...})
router.get('/workflows/:id', async (req, res) => {...})
router.post('/workflows', async (req, res) => {...})
router.put('/workflows/:id', async (req, res) => {...})
router.delete('/workflows/:id', async (req, res) => {...})

// Workflow execution endpoints
router.post('/workflows/:id/execute', async (req, res) => {...})
router.get('/workflow-instances', async (req, res) => {...})
router.get('/workflow-instances/:id', async (req, res) => {...})
router.get('/workflow-instances/:id/details', async (req, res) => {...})

// Workflow execution control endpoints
router.post('/workflow-executions/:id/pause', async (req, res) => {...})
router.post('/workflow-executions/:id/resume', async (req, res) => {...})
router.post('/workflow-executions/:id/cancel', async (req, res) => {...})
```

---

## Frontend Components {#frontend-components}

### 1. Policy Workflow Page (client/src/pages/policies/workflow.tsx)
**Policy Workflow Management Interface**
```typescript
export default function PolicyWorkflowPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const {
    data: workflowsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/policy-workflows'],
    retry: false,
  });

  // Status-based filtering
  const filteredWorkflows = activeTab === 'all' 
    ? workflows 
    : workflows.filter(workflow => {
        if (activeTab === 'inProgress') return workflow.status === 'In Progress';
        if (activeTab === 'awaitingApproval') return workflow.status === 'Awaiting Approval';
        if (activeTab === 'pendingReview') return workflow.status === 'Pending Review';
        if (activeTab === 'completed') return workflow.status === 'Completed';
        return true;
      });
}
```

**Key Features**:
- Tabbed workflow filtering (All, In Progress, Awaiting Approval, Pending Review, Completed)
- Grid-based workflow card display
- Real-time status updates
- Workflow creation dialog
- Progress tracking visualization

### 2. Workflow Create Dialog (client/src/components/policies/workflow-create-dialog.tsx)
**Workflow Creation Interface**
```typescript
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  workflowType: z.enum(['Review', 'Approval', 'Update']),
  status: z.enum(['In Progress', 'Awaiting Approval', 'Pending Review', 'Completed']).default('In Progress'),
  stage: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  assignedTo: z.number().optional().nullable(),
  dueDate: z.date().optional().nullable(),
});

export function WorkflowCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: WorkflowCreateDialogProps) {
  const [selectedPolicies, setSelectedPolicies] = useState<Array<number>>([]);
  
  // Fetch all policies for the selection
  const { data: policiesData, isLoading: isPoliciesLoading } = useQuery({
    queryKey: ['/api/policies'],
    enabled: open,
  });

  // Fetch all users for the assignee dropdown
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: open,
  });
}
```

### 3. Workflow Detail Dialog (client/src/components/policies/workflow-detail-dialog.tsx)
**Comprehensive Workflow Management**
```typescript
export function WorkflowDetailDialog({
  workflowId,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: WorkflowDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState<Array<number>>([]);

  // Fetch workflow details
  const {
    data: workflow,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['/api/policy-workflows', workflowId],
    enabled: !!workflowId && open,
  });

  // Mutation for updating the workflow
  const updateWorkflowMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      return await apiRequest('PUT', `/api/policy-workflows/${workflowId}`, data);
    },
    onSuccess: () => {
      setIsEditing(false);
      onUpdate();
    }
  });

  // Mutation for adding a comment to workflow history
  const addCommentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      return await apiRequest('POST', `/api/policy-workflows/${workflowId}/history`, data);
    },
    onSuccess: () => {
      commentForm.reset({ action: 'Added comment', description: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/policy-workflows', workflowId] });
    }
  });
}
```

**Detail Dialog Features**:
- Multi-tab interface (Details, History, Comments)
- Inline editing capabilities
- Real-time collaboration
- Comment and history tracking
- Status progression management

### 4. Workflow Card Component (client/src/components/policies/workflow-card.tsx)
**Individual Workflow Display**
```typescript
export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  id,
  title,
  description,
  workflowType,
  status,
  dueDate,
  stage,
  progress = 0,
  assignee,
  policies,
  onClick,
  onUpdateStatus
}) => {
  // Format the assignee name (if available)
  const assigneeName = assignee 
    ? `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim() || assignee.username
    : 'Unassigned';

  // Format the due date (if available)
  const formattedDueDate = dueDate 
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Not set';
}
```

**Card Features**:
- Status badge visualization
- Progress bar with completion indicators
- Assignee and due date display
- Associated policies listing
- Action buttons (View Details, Update Status)

---

## Policy Workflow Management {#policy-workflows}

### Workflow Status Flow
```typescript
type WorkflowStatus = 'In Progress' | 'Awaiting Approval' | 'Pending Review' | 'Completed';

// Status transitions
const statusTransitions = {
  'In Progress': ['Awaiting Approval', 'Pending Review', 'Completed'],
  'Awaiting Approval': ['In Progress', 'Pending Review', 'Completed'],
  'Pending Review': ['In Progress', 'Awaiting Approval', 'Completed'],
  'Completed': [] // Terminal state
};
```

### Workflow Types
1. **Review Workflow**: Document review and feedback cycles
2. **Approval Workflow**: Multi-step approval processes
3. **Update Workflow**: Policy modification and version control

### Progress Tracking
```typescript
const getProgressIndicator = (progress: number): string => {
  if (progress < 30) return 'Just Started';
  if (progress < 70) return 'In Progress';
  if (progress < 100) return 'Almost Done';
  return 'Complete';
};
```

### Assignment Management
- User assignment with role-based permissions
- Assignment date tracking
- Escalation capabilities
- Bulk assignment operations

---

## Visual Workflow Builder {#visual-builder}

### 1. Network Diagram Flow (src/components/diagrams/NetworkDiagramFlow.tsx)
**React Flow-Based Visual Builder**
```typescript
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  ConnectionLineType,
  useReactFlow,
} from 'reactflow';

// Custom node types
const nodeTypes = {
  server: ServerNode,
  database: DatabaseNode,
  firewall: FirewallNode,
  router: RouterNode,
  cloud: CloudNode,
  network: NetworkNode,
  loadbalancer: LoadBalancerNode,
  client: ClientNode,
};

function NetworkDiagramFlow({
  initialNodes = [],
  initialEdges = [],
  diagramTitle = 'Network Diagram',
  onSave,
}: NetworkDiagramFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useReactFlow();
}
```

### 2. Visual Builder Features
- **Drag-and-drop node creation**
- **Real-time connection management**
- **Multiple node types** (Server, Database, Firewall, Router, Cloud, Network, LoadBalancer, Client)
- **Export capabilities** (PNG, JSON)
- **Save/Load functionality**
- **Grid and auto-layout options**

### 3. Node Configuration
```typescript
const handleAddNode = useCallback(() => {
  const newNode: Node = {
    id: `node-${Date.now()}`,
    type: newNodeType,
    position: {
      x: Math.random() * 500,
      y: Math.random() * 300,
    },
    data: {
      label: newNodeLabel,
      details: true,
    },
  };

  // Add specific properties based on node type
  if (newNodeType === 'server') {
    newNode.data = {
      ...newNode.data,
      ipAddress: '192.168.1.100',
      osType: 'Linux',
      osVersion: 'Ubuntu 20.04',
      status: 'active',
    };
  }
}, [newNodeType, newNodeLabel]);
```

---

## Approval Workflows {#approval-workflows}

### 1. POAM Approval Workflow (src/components/compliance/poam/ApprovalWorkflow.tsx)
**Government Compliance Approval Process**
```typescript
type ApprovalStatus = 
  | 'draft'
  | 'submitted'
  | 'awaiting_isso_review'
  | 'awaiting_issm_approval'
  | 'awaiting_ao_approval'
  | 'approved'
  | 'rejected'
  | 'cancelled';

interface ApprovalData {
  id: number;
  approvalStatus: string;
  currentApprovalStep: ApprovalStatus;
  approvalHistory: ApprovalHistoryItem[];
  issoReviewerId: number | null;
  issoReviewerName: string | null;
  issoApprovalDate: string | null;
  issmApproverId: number | null;
  issmApproverName: string | null;
  issmApprovalDate: string | null;
  aoApproverId: number | null;
  aoApproverName: string | null;
  aoApprovalDate: string | null;
  rejectionReason: string | null;
  signatures: Signature[];
  comments: Comment[];
  internalNotes: Comment[];
}
```

### 2. Approval Workflow Features
- **Multi-step approval process** (ISSO Review → ISSM Approval → AO Approval)
- **Digital signatures** with verification
- **Role-based access control**
- **Approval history tracking**
- **Internal notes and comments**
- **Rejection handling with reasons**
- **Notification integration**

### 3. Stepper Interface
```typescript
<Stepper activeStep={getCurrentStepIndex(approvalData?.currentApprovalStep)}>
  <Step title="ISSO Review" description="Information System Security Officer review">
    <StepIcon icon={UserCheck} />
    <StepStatus status={getStepStatus('awaiting_isso_review')} />
  </Step>
  <Step title="ISSM Approval" description="Information System Security Manager approval">
    <StepIcon icon={FileCheck} />
    <StepStatus status={getStepStatus('awaiting_issm_approval')} />
  </Step>
  <Step title="AO Approval" description="Authorizing Official final approval">
    <StepIcon icon={FileSignature} />
    <StepStatus status={getStepStatus('awaiting_ao_approval')} />
  </Step>
</Stepper>
```

---

## Network Diagram Integration {#network-diagrams}

### 1. Network Diagrams Page (src/pages/network-diagrams/index.tsx)
**Asset Discovery and Diagram Generation**
```typescript
export default function NetworkDiagramsPage() {
  const [activeTab, setActiveTab] = useState('discovery');
  const [selectedDiscoveryJob, setSelectedDiscoveryJob] = useState<string | null>(null);
  const [nodesAndEdges, setNodesAndEdges] = useState<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });
  const [layoutType, setLayoutType] = useState<'auto' | 'grid' | 'tree' | 'radial'>('auto');

  // Transform discovered assets to nodes and edges when data is loaded
  useEffect(() => {
    if (discoveredAssets && activeTab === 'discovery') {
      const { nodes, edges } = transformAssetsToNodesAndEdges(
        discoveredAssets.assets, 
        discoveredAssets.connections, 
        layoutType
      );
      setNodesAndEdges({ nodes, edges });
    }
  }, [discoveredAssets, activeTab, layoutType]);
}
```

### 2. Asset-to-Diagram Transformation
```typescript
// Transform assets to React Flow nodes and edges
const transformAssetsToNodesAndEdges = (
  assets: Asset[], 
  connections: Connection[], 
  layoutType: LayoutType
): { nodes: Node[], edges: Edge[] } => {
  // Asset transformation logic
  const nodes = assets.map(asset => ({
    id: asset.id.toString(),
    type: getNodeTypeFromAsset(asset),
    position: calculateNodePosition(asset, layoutType),
    data: {
      label: asset.name,
      ipAddress: asset.ipAddress,
      status: asset.status,
      type: asset.type
    }
  }));

  // Connection transformation logic
  const edges = connections.map(connection => ({
    id: `edge-${connection.source}-${connection.target}`,
    source: connection.source.toString(),
    target: connection.target.toString(),
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed }
  }));

  return { nodes, edges };
};
```

### 3. Diagram Management Features
- **Asset discovery integration**
- **Multiple layout algorithms** (Auto, Grid, Tree, Radial)
- **Save/Load from Document Library**
- **Export capabilities** (PNG, JSON)
- **Real-time collaboration**
- **Template management**

---

## Workflow Execution Engine {#execution-engine}

### 1. Execution Processing
```typescript
private async processWorkflowExecution(instance: WorkflowInstance): Promise<void> {
  try {
    // Update status to running
    await this.db.update(workflowInstances)
      .set({ status: 'running' })
      .where(eq(workflowInstances.id, instance.id));

    const workflow = await this.getWorkflowById(instance.workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const workflowData = workflow.workflowData as any;
    const nodes = workflowData.nodes || [];
    const edges = workflowData.edges || [];

    // Find trigger nodes to start execution
    const triggerNodes = nodes.filter((node: any) => 
      node.data?.nodeType === 'trigger'
    );

    if (triggerNodes.length === 0) {
      throw new Error('No trigger nodes found in workflow');
    }

    // Start with first trigger node
    const startNode = triggerNodes[0];
    await this.executeNode(instance.id, startNode, nodes, edges, instance.executionContext);

    // Mark as completed if no errors
    await this.db.update(workflowInstances)
      .set({ 
        status: 'completed',
        completedAt: new Date(),
        progress: 100
      })
      .where(eq(workflowInstances.id, instance.id));

  } catch (error) {
    // Handle execution errors
    await this.db.update(workflowInstances)
      .set({ 
        status: 'failed',
        completedAt: new Date(),
        errorDetails: error.message
      })
      .where(eq(workflowInstances.id, instance.id));

    console.error('Workflow execution failed:', error);
    throw error;
  }
}
```

### 2. Node Execution Types
- **Trigger Nodes**: Workflow initiation points
- **Action Nodes**: Task execution components
- **Decision Nodes**: Conditional branching logic
- **Approval Nodes**: Human approval requirements
- **Integration Nodes**: External system connections
- **Notification Nodes**: Communication triggers

### 3. Conditional Edge Processing
```typescript
private async evaluateEdgeConditions(edge: any, context: any): Promise<boolean> {
  if (!edge.conditions) return true;

  const conditions = edge.conditions;
  
  // Simple condition evaluation
  for (const condition of conditions) {
    const { field, operator, value } = condition;
    const contextValue = context[field];
    
    switch (operator) {
      case 'equals':
        if (contextValue !== value) return false;
        break;
      case 'greater_than':
        if (contextValue <= value) return false;
        break;
      case 'less_than':
        if (contextValue >= value) return false;
        break;
      case 'contains':
        if (!contextValue?.includes(value)) return false;
        break;
      default:
        return true;
    }
  }
  
  return true;
}
```

---

## Notification System {#notifications}

### 1. Workflow Notifications
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

### 2. Notification Types
- **Workflow Started**: Execution initiation alerts
- **Workflow Completed**: Completion notifications
- **Workflow Failed**: Error and failure alerts
- **Approval Required**: Human intervention requests
- **Status Changed**: Progress update notifications
- **Deadline Approaching**: Due date reminders

### 3. Communication Channels
- **Email**: SMTP-based notifications
- **Slack**: Bot integration messages
- **Webhook**: Custom API callbacks
- **SMS**: Text message alerts
- **In-App**: Platform notifications

---

## API Endpoints {#api-endpoints}

### 1. Visual Workflow Management
```typescript
// Core workflow operations
GET    /api/workflows                    // List all workflows
GET    /api/workflows/:id               // Get specific workflow
POST   /api/workflows                   // Create new workflow
PUT    /api/workflows/:id               // Update workflow
DELETE /api/workflows/:id               // Delete workflow

// Workflow execution
POST   /api/workflows/:id/execute       // Execute workflow
GET    /api/workflow-instances          // List workflow instances
GET    /api/workflow-instances/:id      // Get workflow instance
GET    /api/workflow-instances/:id/details // Get instance with steps

// Execution control
POST   /api/workflow-executions/:id/pause   // Pause execution
POST   /api/workflow-executions/:id/resume  // Resume execution
POST   /api/workflow-executions/:id/cancel  // Cancel execution
```

### 2. Policy Workflow Management
```typescript
// Policy workflow operations
GET    /api/policy-workflows            // List policy workflows
GET    /api/policy-workflows/:id        // Get specific policy workflow
POST   /api/policy-workflows            // Create new policy workflow
PUT    /api/policy-workflows/:id        // Update policy workflow
DELETE /api/policy-workflows/:id        // Delete policy workflow

// Workflow history and comments
GET    /api/policy-workflows/:id/history     // Get workflow history
POST   /api/policy-workflows/:id/history     // Add workflow comment
GET    /api/policy-workflows/:id/comments    // Get workflow comments
POST   /api/policy-workflows/:id/comments    // Add workflow comment
```

### 3. Approval Workflow Management
```typescript
// Approval operations
GET    /api/compliance/poams/:id/approval    // Get approval status
POST   /api/compliance/poams/:id/approval    // Update approval status
GET    /api/compliance/poams/:id/signatures  // Get digital signatures
POST   /api/compliance/poams/:id/signatures  // Add digital signature
```

### Request/Response Examples
```typescript
// Create Visual Workflow Request
POST /api/workflows
{
  "name": "Asset Discovery Workflow",
  "description": "Automated asset discovery and documentation",
  "category": "security",
  "workflowData": {
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Start Discovery", "nodeType": "trigger" }
      },
      {
        "id": "action-1",
        "type": "action",
        "position": { "x": 300, "y": 100 },
        "data": { "label": "Scan Network", "nodeType": "action", "actionType": "scan" }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "trigger-1",
        "target": "action-1",
        "type": "smoothstep"
      }
    ]
  },
  "isActive": true,
  "tags": ["security", "discovery", "automation"]
}

// Policy Workflow Response
{
  "id": 123,
  "title": "Security Policy Review",
  "description": "Annual security policy review and update",
  "workflowType": "Review",
  "status": "In Progress",
  "progress": 45,
  "assignedTo": 456,
  "assignee": {
    "id": 456,
    "username": "john.doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "dueDate": "2025-05-01T00:00:00Z",
  "stage": "Review Phase",
  "policies": [
    {
      "id": 789,
      "title": "Information Security Policy",
      "version": "2.1"
    }
  ],
  "createdAt": "2025-04-01T10:00:00Z",
  "updatedAt": "2025-04-03T14:30:00Z"
}
```

---

## Integration Points {#integration-points}

### 1. Policy Management Integration
```typescript
// Policy-workflow relationships
const { data: policiesData, isLoading: isPoliciesLoading } = useQuery({
  queryKey: ['/api/policies'],
  enabled: open,
});

// Workflow-policy associations
const handleSubmit = (data: FormValues) => {
  const createData = {
    ...data,
    policyIds: selectedPolicies,
  };
  createWorkflowMutation.mutate(createData);
};
```

### 2. Asset Management Integration
```typescript
// Asset discovery to workflow transformation
const { 
  data: discoveredAssets,
  isLoading: isLoadingAssets,
} = useQuery({
  queryKey: ['/api/assets/discovery/results', selectedDiscoveryJob],
  queryFn: async () => {
    if (selectedDiscoveryJob === 'sample') {
      return generateSampleNetworkData();
    }
    
    const response = await fetch(`/api/assets/discovery/results/${selectedDiscoveryJob}`);
    if (!response.ok) {
      throw new Error('Failed to fetch discovery results');
    }
    return response.json();
  },
  enabled: !!selectedDiscoveryJob,
});
```

### 3. Compliance Integration
```typescript
// POAM approval workflow integration
const updateApprovalMutation = useMutation({
  mutationFn: async ({ action, comment }: { action: string, comment?: string }) => {
    const response = await apiRequest('POST', `/api/compliance/poams/${poamId}/approval`, {
      action,
      comment,
      isInternalNote
    });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/compliance/poams', poamId, 'approval'] });
    queryClient.invalidateQueries({ queryKey: ['/api/compliance/poams'] });
    refreshPoam();
  }
});
```

### 4. Document Library Integration
```typescript
// Diagram save/load functionality
export const saveDiagram = async (name: string, nodes: Node[], edges: Edge[]): Promise<boolean> => {
  try {
    const diagramData = {
      name,
      type: 'network-diagram',
      content: JSON.stringify({ nodes, edges }),
      createdAt: new Date().toISOString()
    };

    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(diagramData)
    });

    return response.ok;
  } catch (error) {
    console.error('Error saving diagram:', error);
    return false;
  }
};
```

---

## Security Features {#security-features}

### 1. Authentication and Authorization
```typescript
// Role-based workflow access
const userRoles = ['ISSO', 'ISSM', 'AO', 'Security_Officer'];

// Permission checks
const canApprove = (userRole: string, currentStep: ApprovalStatus): boolean => {
  switch (currentStep) {
    case 'awaiting_isso_review':
      return userRole === 'ISSO';
    case 'awaiting_issm_approval':
      return userRole === 'ISSM';
    case 'awaiting_ao_approval':
      return userRole === 'AO';
    default:
      return false;
  }
};
```

### 2. Digital Signatures
```typescript
interface Signature {
  id: number;
  userId: number;
  userName: string;
  role: string;
  signatureDate: string;
  verificationCode?: string;
  isVerified: boolean;
}

// Signature verification process
const verifySignature = async (signatureId: number, verificationCode: string): Promise<boolean> => {
  const response = await apiRequest('POST', `/api/signatures/${signatureId}/verify`, {
    verificationCode
  });
  return response.ok;
};
```

### 3. Audit Trail Management
```typescript
interface ApprovalHistoryItem {
  step: string;
  userId: number;
  userName: string;
  action: string;
  timestamp: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Comprehensive audit logging
const logWorkflowAction = async (workflowId: number, action: string, details: any): Promise<void> => {
  await apiRequest('POST', `/api/workflows/${workflowId}/audit`, {
    action,
    details,
    timestamp: new Date().toISOString(),
    userId: currentUser.id,
    ipAddress: getClientIpAddress(),
    userAgent: navigator.userAgent
  });
};
```

### 4. Data Encryption
- **Database encryption**: Sensitive workflow data encryption at rest
- **Transport security**: TLS/SSL for all API communications
- **Field-level encryption**: PII and sensitive configuration data
- **Key management**: Secure key rotation and management

---

## State Management and React Query

### Cache Key Structure
```typescript
// Visual workflows
["/api/workflows"]                           // All workflows
["/api/workflows", workflowId]               // Specific workflow
["/api/workflow-instances"]                  // All instances
["/api/workflow-instances", instanceId]      // Specific instance

// Policy workflows
["/api/policy-workflows"]                    // All policy workflows
["/api/policy-workflows", workflowId]        // Specific policy workflow
["/api/policy-workflows", workflowId, "history"] // Workflow history

// Approval workflows
["/api/compliance/poams", poamId, "approval"] // Approval status
["/api/compliance/poams", poamId, "signatures"] // Digital signatures
```

### Mutation Patterns
```typescript
// Policy workflow creation
const createWorkflowMutation = useMutation({
  mutationFn: async (data: FormValues & { policyIds: number[] }) => {
    return await apiRequest('POST', '/api/policy-workflows', data);
  },
  onSuccess: () => {
    onOpenChange(false);
    onSuccess();
    queryClient.invalidateQueries({ queryKey: ['/api/policy-workflows'] });
  },
  onError: (error: any) => {
    toast({
      title: 'Error',
      description: `Failed to create workflow: ${error.message}`,
      variant: 'destructive',
    });
  },
});

// Visual workflow execution
const executeWorkflowMutation = useMutation({
  mutationFn: async (workflowId: string) => {
    return await apiRequest('POST', `/api/workflows/${workflowId}/execute`, {
      executionContext: {}
    });
  },
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['/api/workflow-instances'] });
    toast({
      title: 'Workflow Started',
      description: `Workflow execution started with instance ID: ${data.instanceId}`,
    });
  }
});
```

---

## Error Handling and Validation

### Frontend Validation
```typescript
// Policy workflow validation
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  workflowType: z.enum(['Review', 'Approval', 'Update']),
  status: z.enum(['In Progress', 'Awaiting Approval', 'Pending Review', 'Completed']),
  stage: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  assignedTo: z.number().optional().nullable(),
  dueDate: z.date().optional().nullable(),
});

// Visual workflow validation
const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
```

### Backend Error Handling
```typescript
// Workflow service error handling
export const executeWorkflow = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { parameters } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Workflow ID is required' });
    }

    const result = await workflowService.executeWorkflow(Number(id), parameters);
    res.json(result);
  } catch (error) {
    console.error('Error executing workflow:', error);
    
    if (error.message === 'Workflow not found') {
      return res.status(404).json({ error: 'Workflow not found' });
    } else if (error.message === 'Workflow is not active') {
      return res.status(400).json({ error: 'Cannot execute inactive workflow' });
    }
    
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
};
```

---

## Performance Optimization

### 1. Efficient React Flow Rendering
```typescript
// Optimized node and edge state management
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

// Memoized callback functions
const onConnect = useCallback(
  (params: Connection) => {
    if (!params.source || !params.target) return;
    
    const newEdge: Edge = {
      id: `e${Date.now()}`,
      source: params.source,
      target: params.target,
      animated: false,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    };
    setEdges((eds) => addEdge(newEdge, eds));
  },
  [setEdges]
);
```

### 2. Workflow Execution Optimization
```typescript
// Background workflow processing
private async processWorkflowExecution(instance: WorkflowInstance): Promise<void> {
  // Process workflow in background without blocking API response
  setImmediate(async () => {
    try {
      await this.executeWorkflowNodes(instance);
    } catch (error) {
      console.error('Background workflow execution failed:', error);
      await this.markWorkflowAsFailed(instance.id, error.message);
    }
  });
}

// Concurrent node execution where possible
private async executeParallelNodes(nodes: WorkflowNode[], context: any): Promise<void> {
  const parallelNodes = nodes.filter(node => node.data.canRunInParallel);
  const promises = parallelNodes.map(node => this.executeNode(node, context));
  await Promise.allSettled(promises);
}
```

### 3. Database Query Optimization
```typescript
// Efficient workflow queries with joins
async getWorkflowWithDetails(workflowId: string): Promise<any> {
  return await this.db.select()
    .from(workflows)
    .leftJoin(workflowInstances, eq(workflows.id, workflowInstances.workflowId))
    .leftJoin(workflowExecutions, eq(workflowInstances.id, workflowExecutions.instanceId))
    .where(eq(workflows.id, workflowId));
}

// Paginated workflow listings
async getWorkflowsPaginated(page: number, pageSize: number): Promise<any> {
  const offset = (page - 1) * pageSize;
  
  return await this.db.select()
    .from(workflows)
    .orderBy(desc(workflows.updatedAt))
    .limit(pageSize)
    .offset(offset);
}
```

---

## Component Interaction Flow

### Policy Workflow Creation Flow
1. **User clicks "Create Workflow"** → Opens WorkflowCreateDialog
2. **Form validation** → Zod schema validation with real-time feedback
3. **Policy selection** → Multi-select dropdown with search functionality
4. **User assignment** → Dropdown populated from users API
5. **Form submission** → API call with loading states and error handling
6. **Cache invalidation** → React Query cache updates for real-time UI refresh
7. **Success notification** → Toast notification with confirmation

### Visual Workflow Execution Flow
1. **Workflow selection** → User selects workflow from list
2. **Execution trigger** → API call to start workflow instance
3. **Background processing** → Node-by-node execution with status tracking
4. **Real-time updates** → WebSocket or polling for progress updates
5. **Conditional branching** → Edge condition evaluation for flow control
6. **Approval handling** → Human intervention points with notification
7. **Completion/Error** → Final status update with audit trail

### Approval Workflow Progression
1. **Document submission** → Initial workflow state creation
2. **Role-based routing** → Automatic assignment based on approval step
3. **Notification dispatch** → Multi-channel notifications (email, Slack, etc.)
4. **Approval interface** → Role-specific approval components
5. **Digital signature** → Cryptographic signature with verification
6. **Audit logging** → Comprehensive trail of all actions and decisions
7. **Status propagation** → Updates across all related systems

---

## Best Practices and Patterns

### 1. Component Architecture
- **Single responsibility components** for each workflow type
- **Reusable workflow status badges** across different contexts
- **Consistent form validation patterns** using Zod schemas
- **Modular dialog systems** for complex interactions

### 2. State Management
- **React Query for server state** with intelligent caching
- **Local state for UI interactions** (dialogs, forms, selections)
- **Optimistic updates** for immediate user feedback
- **Error boundaries** for graceful error handling

### 3. Performance Patterns
- **Memoized callbacks** for React Flow performance
- **Background processing** for long-running workflows
- **Efficient database queries** with proper indexing
- **Lazy loading** for complex workflow components

### 4. Security Patterns
- **Role-based access control** throughout the system
- **Input sanitization** for all user inputs
- **Audit trail logging** for all workflow actions
- **Digital signature verification** for compliance workflows

---

## Future Enhancement Opportunities

### 1. Advanced Workflow Features
- **Machine learning workflow optimization** based on historical data
- **Advanced conditional logic** with complex rule engines
- **Workflow templates marketplace** for common use cases
- **Real-time collaboration** with live cursors and editing

### 2. Integration Enhancements
- **External system connectors** for popular enterprise tools
- **API gateway integration** for seamless data flow
- **Advanced notification channels** (Teams, Discord, etc.)
- **Workflow analytics dashboard** with comprehensive metrics

### 3. User Experience Improvements
- **Mobile workflow management** with responsive design
- **Voice command integration** for hands-free operation
- **AI-powered workflow suggestions** based on context
- **Advanced visualization** with 3D flow diagrams

---

This comprehensive documentation provides complete coverage of the Workflows System, from database design to user interface implementation. The system demonstrates enterprise-grade workflow automation capabilities with visual builder tools, policy lifecycle management, compliance approval processes, and robust security features for comprehensive organizational workflow orchestration.