# RAS-DASH Workflow Builder - Complete Migration Guide

## Overview
The RAS-DASH Workflow Builder is a comprehensive visual workflow automation system built with React Flow, TypeScript, and Node.js. This document provides complete details for migrating the workflow builder feature to a new application, including converting from TSX to JSX if needed.

## Architecture Overview

### Frontend Components (React + TypeScript)
The workflow builder consists of several key frontend components:

1. **Main Page**: `client/src/pages/workflows/WorkflowBuilderPage.tsx`
2. **Node Library**: `client/src/components/workflows/WorkflowNodeLibrary.tsx`  
3. **Template Manager**: `client/src/components/workflows/WorkflowTemplateManager.tsx`
4. **Workflow Components**: Various React Flow node types and edge handlers

### Backend Services (Node.js + Express)
1. **Service Layer**: `server/services/WorkflowService.ts`
2. **API Routes**: `server/routes/workflowRoutes.ts`
3. **Controllers**: `server/controllers/workflowController.ts`
4. **Database Schema**: `shared/workflow-schema.ts`

### Database Schema (PostgreSQL + Drizzle ORM)
The workflow system uses 8 main database tables:
- `workflows` - Main workflow definitions
- `workflow_nodes` - Individual workflow nodes
- `workflow_edges` - Connections between nodes
- `workflow_triggers` - Workflow trigger configurations
- `workflow_instances` - Runtime workflow instances
- `workflow_executions` - Individual step executions
- `workflow_approvals` - Approval workflow steps
- `workflow_notifications` - Notification management

## Core Features

### Visual Workflow Builder
- **React Flow Integration**: Drag-and-drop node-based workflow creation
- **Node Types**: Triggers, Actions, Conditions, Approvals, Integrations, Notifications
- **Edge Management**: Conditional routing and data flow management
- **Template System**: Built-in and custom workflow templates
- **Real-time Execution**: Live workflow monitoring and debugging

### Workflow Node Library
The system includes 20+ pre-built node types across 6 categories:

1. **Trigger Nodes**
   - Schedule Trigger (cron-based)
   - Vulnerability Detection
   - Compliance Failure
   - Webhook Trigger
   - Manual Trigger

2. **Action Nodes**
   - Asset Scanning
   - Patch Deployment
   - Report Generation
   - AI Analysis
   - Database Operations

3. **Condition Nodes**
   - CVSS Score Checks
   - Asset Type Filtering
   - Risk Level Assessment
   - Data Validation

4. **Integration Nodes**
   - GitLab Integration
   - Tenable API
   - AWS Services
   - Email/SMTP
   - Slack/Teams

5. **Approval Nodes**
   - Manager Approval
   - Security Team Review
   - Executive Sign-off

6. **Notification Nodes**
   - Email Notifications
   - Slack Messages
   - Webhook Calls
   - SMS Alerts

### Template Management
- **Built-in Templates**: Pre-configured workflows for common security scenarios
- **Custom Templates**: User-created workflow templates
- **Template Categories**: Vulnerability, Compliance, Incident Response, Automation
- **Import/Export**: Template sharing and backup capabilities

## File Structure for Migration

### Frontend Files to Extract

#### Core Workflow Page
```
client/src/pages/workflows/
├── WorkflowBuilderPage.tsx          # Main workflow builder interface
```

#### Workflow Components
```
client/src/components/workflows/
├── WorkflowNodeLibrary.tsx          # Draggable node library
├── WorkflowTemplateManager.tsx      # Template management UI
├── WorkflowNodeTypes.tsx            # Custom React Flow node components
├── WorkflowExecutionPanel.tsx       # Runtime execution monitoring
├── WorkflowPropertiesPanel.tsx      # Node configuration panel
```

#### Supporting UI Components
```
client/src/components/ui/
├── tabs.tsx                         # Tab navigation
├── dialog.tsx                       # Modal dialogs
├── card.tsx                         # Card containers
├── button.tsx                       # Action buttons
├── input.tsx                        # Form inputs
├── badge.tsx                        # Status badges
├── scroll-area.tsx                  # Scrollable areas
├── separator.tsx                    # Visual separators
```

### Backend Files to Extract

#### Core Services
```
server/services/
├── WorkflowService.ts               # Main workflow business logic
├── WorkflowExecutionService.ts      # Workflow runtime engine
├── WorkflowNotificationService.ts   # Notification handling
├── BaseService.ts                   # Base service class
```

#### API Routes
```
server/routes/
├── workflowRoutes.ts               # Workflow API endpoints
├── api.ts                          # Route registration
```

#### Controllers
```
server/controllers/
├── workflowController.ts           # Workflow request handlers
├── index.ts                        # Controller exports
```

#### Database Schema
```
shared/
├── workflow-schema.ts              # Drizzle ORM schema definitions
```

### Configuration Files
```
package.json                        # Dependencies
drizzle.config.ts                   # Database configuration
vite.config.ts                      # Build configuration
tailwind.config.js                  # Styling configuration
```

## Dependencies Required

### Frontend Dependencies
```json
{
  "@reactflow/core": "^11.10.1",
  "@reactflow/background": "^11.3.7",
  "@reactflow/controls": "^11.2.7",
  "@reactflow/minimap": "^11.7.7",
  "@reactflow/node-resizer": "^2.2.7",
  "reactflow": "^11.10.1",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "@tanstack/react-query": "^5.0.0",
  "wouter": "^3.0.0",
  "lucide-react": "^0.263.1",
  "@radix-ui/react-tabs": "^1.0.4",
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-scroll-area": "^1.0.5",
  "tailwindcss": "^3.3.0",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.0.0",
  "tailwind-merge": "^1.14.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "drizzle-orm": "^0.28.6",
  "drizzle-zod": "^0.5.1",
  "pg": "^8.11.3",
  "@types/pg": "^8.10.2",
  "uuid": "^9.0.0",
  "@types/uuid": "^9.0.2",
  "zod": "^3.22.2",
  "node-cron": "^3.0.2",
  "winston": "^3.10.0"
}
```

## Migration Steps

### Step 1: Setup New Project Structure

1. **Create directory structure**:
```bash
mkdir workflow-app
cd workflow-app
mkdir -p {client/src/{components,pages,hooks,lib},server/{services,routes,controllers},shared}
```

2. **Initialize package.json** with required dependencies

3. **Setup build tools** (Vite for frontend, TypeScript for backend)

### Step 2: Extract Database Schema

1. **Copy schema file**: `shared/workflow-schema.ts`
2. **Setup Drizzle configuration**: `drizzle.config.ts`
3. **Create database migrations**:
```bash
npx drizzle-kit generate:pg
npx drizzle-kit push:pg
```

### Step 3: Extract Backend Services

1. **Copy core services**:
   - `WorkflowService.ts`
   - `WorkflowExecutionService.ts` 
   - `BaseService.ts`

2. **Copy API routes**:
   - `workflowRoutes.ts`
   - Update route registration

3. **Copy controllers**:
   - `workflowController.ts`

### Step 4: Extract Frontend Components

1. **Copy main page**: `WorkflowBuilderPage.tsx`
2. **Copy workflow components**:
   - `WorkflowNodeLibrary.tsx`
   - `WorkflowTemplateManager.tsx`
3. **Copy UI components** from shadcn/ui library
4. **Setup routing** with wouter or react-router

### Step 5: Convert TSX to JSX (if needed)

If your target application uses JSX instead of TypeScript:

#### File Extensions
- Change all `.tsx` files to `.jsx`
- Change all `.ts` files to `.js`

#### Remove TypeScript Syntax

**Before (TSX)**:
```typescript
interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

const WorkflowBuilder: React.FC<{ workflows: WorkflowNode[] }> = ({ workflows }) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  // ...
}
```

**After (JSX)**:
```javascript
const WorkflowBuilder = ({ workflows }) => {
  const [nodes, setNodes] = useState([]);
  // ...
}
```

#### Remove Type Annotations

**Before**:
```typescript
const handleNodeClick = (event: React.MouseEvent, node: Node) => {
  // ...
}
```

**After**:
```javascript
const handleNodeClick = (event, node) => {
  // ...
}
```

#### Update Import Statements

**Before**:
```typescript
import { WorkflowService } from '../services/WorkflowService';
import type { Workflow, WorkflowNode } from '../types/workflow';
```

**After**:
```javascript
import { WorkflowService } from '../services/WorkflowService';
// Remove type-only imports
```

### Step 6: Configure Styling

1. **Setup Tailwind CSS**:
```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Configure theme** (copy from existing `tailwind.config.js`)

3. **Import CSS** in main application file

### Step 7: Update API Endpoints

1. **Update base URLs** to match new application structure
2. **Configure authentication** if needed
3. **Update CORS settings** for cross-origin requests

## API Endpoints Reference

### Workflow Management
- `GET /api/workflows` - List all workflows
- `GET /api/workflows/:id` - Get specific workflow
- `POST /api/workflows` - Create new workflow
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

### Workflow Execution
- `POST /api/workflows/:id/execute` - Execute workflow
- `GET /api/workflow-instances` - List workflow instances
- `GET /api/workflow-instances/:id` - Get instance details
- `POST /api/workflow-instances/:id/pause` - Pause execution
- `POST /api/workflow-instances/:id/resume` - Resume execution
- `POST /api/workflow-instances/:id/cancel` - Cancel execution

### Templates
- `GET /api/workflow-templates` - List templates
- `POST /api/workflow-templates` - Create template
- `GET /api/workflow-templates/:id` - Get template
- `POST /api/workflows/from-template/:templateId` - Create from template

## Configuration Options

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/workflows

# Workflow Engine
WORKFLOW_EXECUTION_TIMEOUT=3600000
WORKFLOW_MAX_RETRIES=3
WORKFLOW_NOTIFICATION_ENABLED=true

# External Integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=password
```

### Workflow Node Configuration
Each node type supports specific configuration options:

```javascript
// Schedule Trigger
{
  cronExpression: "0 9 * * 1-5", // Weekdays at 9 AM
  timezone: "UTC"
}

// Vulnerability Trigger
{
  severity: ["high", "critical"],
  source: "tenable",
  assetGroups: ["production"]
}

// Email Notification
{
  recipients: ["admin@example.com"],
  subject: "Workflow Alert",
  template: "security_alert"
}
```

## Security Considerations

1. **Authentication**: Implement proper user authentication
2. **Authorization**: Role-based access to workflows
3. **Input Validation**: Validate all workflow configurations
4. **Execution Isolation**: Sandbox workflow execution
5. **Audit Logging**: Track all workflow changes and executions

## Testing Strategy

### Unit Tests
- Test individual workflow nodes
- Test workflow execution logic
- Test API endpoints

### Integration Tests
- Test complete workflow execution
- Test database operations
- Test external integrations

### End-to-End Tests
- Test full workflow creation and execution
- Test UI interactions
- Test error handling scenarios

## Performance Optimization

1. **Database Indexing**: Add indexes on frequently queried columns
2. **Caching**: Cache workflow definitions and templates
3. **Async Execution**: Use background job processing
4. **Resource Limits**: Set execution time and memory limits
5. **Monitoring**: Add performance metrics and alerting

## Troubleshooting Common Issues

### React Flow Issues
- **Nodes not rendering**: Check node type registration
- **Edges not connecting**: Verify handle IDs match
- **Performance problems**: Implement virtual scrolling for large workflows

### Backend Issues
- **Database connection**: Check connection string and permissions
- **Workflow execution hanging**: Implement timeout mechanisms
- **Memory leaks**: Properly clean up workflow instances

### Integration Issues
- **External API failures**: Implement retry logic and fallbacks
- **Authentication problems**: Verify API keys and tokens
- **Rate limiting**: Implement request throttling

## Conclusion

The RAS-DASH Workflow Builder is a comprehensive system that can be successfully migrated to a new application. The modular architecture makes it relatively straightforward to extract and adapt to different environments. Key considerations include:

1. **Database Schema**: Ensure proper database setup and migrations
2. **Dependencies**: Install all required React Flow and UI dependencies
3. **API Integration**: Update endpoints to match new application structure
4. **Styling**: Configure Tailwind CSS for proper component rendering
5. **Testing**: Thoroughly test all functionality after migration

The workflow builder provides significant value through its visual interface, extensive node library, and robust execution engine. With proper migration, it can enhance any application requiring workflow automation capabilities.