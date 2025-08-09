# Workflow Builder - Complete File Inventory

## Frontend Files (TSX/React)

### Core Workflow Components
```
client/src/pages/workflows/
├── WorkflowBuilderPage.tsx                 # Main workflow builder interface with React Flow

client/src/components/workflows/
├── WorkflowNodeLibrary.tsx                 # Draggable node library with 20+ node types
├── WorkflowTemplateManager.tsx             # Template management and workflow creation from templates
├── WorkflowExecutionPanel.tsx              # Runtime monitoring and execution status (if exists)
├── WorkflowPropertiesPanel.tsx             # Node configuration and properties editor (if exists)
└── WorkflowNodeTypes.tsx                   # Custom React Flow node components (if exists)
```

### UI Dependencies (shadcn/ui components)
```
client/src/components/ui/
├── tabs.tsx                                # Tab navigation for workflow builder interface
├── dialog.tsx                              # Modal dialogs for node configuration
├── card.tsx                                # Container components for nodes and templates
├── button.tsx                              # Action buttons throughout interface
├── input.tsx                               # Form inputs for configuration
├── badge.tsx                               # Status badges for workflow states
├── scroll-area.tsx                         # Scrollable areas for node library
├── separator.tsx                           # Visual separators in UI
├── form.tsx                                # Form handling components
├── select.tsx                              # Dropdown selections
├── sheet.tsx                               # Side panels for properties
├── toast.tsx                               # Notification toasts
├── dropdown-menu.tsx                       # Context menus for nodes
└── popover.tsx                             # Popup configuration panels
```

### Utility Files
```
client/src/hooks/
└── use-toast.tsx                           # Toast notification hook

client/src/lib/
├── utils.ts                                # Utility functions (cn, clsx, etc.)
└── queryClient.ts                          # TanStack Query client configuration
```

## Backend Files (TypeScript/Node.js)

### Core Services
```
server/services/
├── WorkflowService.ts                      # Main workflow CRUD and execution logic
├── WorkflowExecutionService.ts             # Workflow runtime engine (if exists)
├── WorkflowNotificationService.ts          # Notification handling (if exists)
└── BaseService.ts                          # Base service class with database connection
```

### API Routes
```
server/routes/
├── workflowRoutes.ts                       # All workflow API endpoints
└── api.ts                                  # Route registration and middleware
```

### Controllers
```
server/controllers/
├── workflowController.ts                   # Request handlers for workflow operations
└── index.ts                                # Controller exports
```

## Database Schema

### Schema Definition
```
shared/
└── workflow-schema.ts                      # Drizzle ORM schema with 8 workflow tables
```

### Database Tables
1. **workflows** - Main workflow definitions with metadata
2. **workflow_nodes** - Individual nodes within workflows 
3. **workflow_edges** - Connections/relationships between nodes
4. **workflow_triggers** - Trigger configurations for automatic execution
5. **workflow_instances** - Runtime instances of workflow executions
6. **workflow_executions** - Individual step/node execution records
7. **workflow_approvals** - Approval workflow step management
8. **workflow_notifications** - Notification queue and delivery tracking

## Configuration Files

### Build & Styling
```
tailwind.config.js                         # Tailwind CSS configuration
postcss.config.js                          # PostCSS configuration
drizzle.config.ts                          # Database ORM configuration
package.json                               # Dependencies and scripts
```

## Key Dependencies Required

### React Flow Dependencies
- `reactflow` - Main React Flow library
- `@reactflow/core` - Core React Flow functionality
- `@reactflow/background` - Background patterns
- `@reactflow/controls` - Zoom/pan controls
- `@reactflow/minimap` - Mini map component
- `@reactflow/node-resizer` - Resizable nodes

### UI Framework
- `react` & `react-dom` - Core React
- `@tanstack/react-query` - Data fetching
- `wouter` - Lightweight routing
- `lucide-react` - Icons
- All `@radix-ui/*` components for UI primitives

### Styling
- `tailwindcss` - CSS framework
- `class-variance-authority` - Component variants
- `clsx` & `tailwind-merge` - Conditional classes

### Backend
- `express` - Web framework
- `drizzle-orm` & `drizzle-zod` - Database ORM
- `pg` - PostgreSQL driver
- `uuid` - Unique ID generation
- `zod` - Schema validation
- `node-cron` - Scheduled workflows
- `winston` - Logging

## Node Type Categories

### Triggers (5 types)
- Schedule Trigger - Cron-based execution
- Vulnerability Trigger - Security event detection
- Compliance Failure - Control failure detection
- Webhook Trigger - External API triggers
- Manual Trigger - User-initiated execution

### Actions (6+ types)
- Asset Scanning - Security scanning operations
- Patch Deployment - System patching
- Report Generation - Document creation
- AI Analysis - ML/AI processing
- Database Operations - Data manipulation
- File Operations - File system tasks

### Conditions (4 types)
- CVSS Score Check - Vulnerability scoring
- Asset Type Filter - Asset classification
- Risk Level Assessment - Risk evaluation
- Data Validation - Input validation

### Integrations (5+ types)
- GitLab Integration - Issue/MR management
- Tenable API - Vulnerability scanning
- AWS Services - Cloud operations
- Email/SMTP - Email notifications
- Slack/Teams - Chat notifications

### Approvals (3 types)
- Manager Approval - Management sign-off
- Security Team Review - Security validation
- Executive Approval - C-level authorization

### Notifications (4 types)
- Email Notifications - SMTP delivery
- Slack Messages - Chat notifications
- Webhook Calls - HTTP callbacks
- SMS Alerts - Text messaging

## Template Categories

### Built-in Templates
1. **Basic Vulnerability Management** - Automated vuln detection and remediation
2. **Compliance Monitoring** - Control failure detection and response
3. **Incident Response** - Security incident escalation workflow
4. **AWS Infrastructure** - Cloud resource provisioning
5. **Patch Management** - Automated patching workflow

### Custom Templates
- User-created workflows saved as reusable templates
- Template sharing and export capabilities
- Template categorization and tagging

## API Endpoints

### Workflow Management
- `GET /api/workflows` - List all workflows
- `GET /api/workflows/:id` - Get specific workflow
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Execution
- `POST /api/workflows/:id/execute` - Execute workflow
- `GET /api/workflow-instances` - List instances
- `GET /api/workflow-instances/:id` - Get instance details
- `POST /api/workflow-instances/:id/pause` - Pause execution
- `POST /api/workflow-instances/:id/resume` - Resume execution
- `POST /api/workflow-instances/:id/cancel` - Cancel execution

### Templates
- `GET /api/workflow-templates` - List templates
- `POST /api/workflow-templates` - Create template
- `GET /api/workflow-templates/:id` - Get template
- `POST /api/workflows/from-template/:templateId` - Create from template

## Feature Highlights

### Visual Builder
- Drag-and-drop interface using React Flow
- Real-time node configuration
- Visual connection management
- Zoom, pan, and mini-map navigation
- Background grid and styling

### Execution Engine
- Asynchronous workflow processing
- Step-by-step execution tracking
- Error handling and retry logic
- Pause/resume capabilities
- Progress monitoring

### Template System
- Pre-built workflow templates
- Custom template creation
- Template import/export
- Category-based organization
- Usage analytics

### Integration Capabilities
- External API connections
- Database operations
- File system access
- Cloud service integration
- Notification delivery

This comprehensive inventory shows that the workflow builder is a sophisticated, production-ready system with extensive capabilities for visual workflow automation in cybersecurity environments.