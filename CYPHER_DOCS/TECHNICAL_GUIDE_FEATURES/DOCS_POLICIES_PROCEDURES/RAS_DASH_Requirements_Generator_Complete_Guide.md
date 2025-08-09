# RAS DASH Requirements Document Generator - Complete Implementation Guide

## System Overview

The Requirements Document Generator is an AI-powered system that automatically creates comprehensive security requirements documents based on selected systems and assets, with integrated GitLab task management capabilities.

## Features Implemented

### 1. Core System Components

**Database Schema (shared/schema.ts)**
- `requirementDocuments` - Main document records with AI generation metadata
- `requirementSections` - Structured document sections with compliance mappings
- `requirementTasks` - Actionable implementation tasks
- `gitlabConfigurations` - GitLab integration settings

**Backend Services**
- `RequirementsDocumentService` - AI-powered document generation with OpenAI GPT-4o
- `GitLabIntegrationService` - Automated GitLab issue creation and synchronization
- `RequirementsController` - RESTful API endpoints for document management

**Frontend Interface**
- Multi-step wizard for system and asset selection
- AI configuration with custom prompts
- Document management dashboard
- GitLab integration configuration

### 2. API Endpoints

**Document Management**
- `POST /api/requirements/documents` - Create new requirements document
- `GET /api/requirements/documents` - List all documents
- `GET /api/requirements/documents/:id` - Get document details with sections and tasks
- `POST /api/requirements/documents/:id/generate` - Generate requirements using AI
- `POST /api/requirements/documents/:id/tasks` - Generate implementation tasks

**GitLab Integration**
- `POST /api/requirements/documents/:id/gitlab/issues` - Create GitLab issues from tasks
- `POST /api/requirements/tasks/:id/sync` - Sync task status with GitLab
- `POST /api/requirements/gitlab/configs` - Create GitLab configuration
- `GET /api/requirements/gitlab/configs` - List GitLab configurations
- `GET /api/requirements/gitlab/configs/:id/test` - Test GitLab connection

### 3. AI-Powered Document Generation

**Context Analysis**
- System information from ingestion data
- Asset inventory with criticality levels
- Vulnerability profiles and risk assessments
- Compliance control mappings
- Risk scoring algorithms

**Document Structure**
1. Executive Summary
2. System Overview
3. Security Requirements (Access Control, Data Protection, Network Security, Monitoring, Incident Response)
4. Compliance Requirements
5. Vulnerability Management Requirements
6. Implementation Timeline
7. Acceptance Criteria

**Task Generation**
- Automated extraction of actionable tasks from requirements
- Priority assignment based on risk levels
- Effort estimation for resource planning
- Acceptance criteria definition

## Implementation Workflow

### Step 1: System and Asset Selection

```javascript
// Frontend workflow for system selection
const handleSystemSelection = (system) => {
  setSelectedSystem(system);
  // Automatically loads associated assets
  queryClient.invalidateQueries(['/api/assets', system.uuid]);
};

const handleAssetSelection = (assetId, checked) => {
  if (checked) {
    setSelectedAssets([...selectedAssets, assetId]);
  } else {
    setSelectedAssets(selectedAssets.filter(id => id !== assetId));
  }
};
```

### Step 2: Document Configuration

```javascript
const documentConfig = {
  systemId: selectedSystem.uuid,
  assetIds: selectedAssets,
  title: documentTitle,
  description: documentDescription,
  documentType: 'security_requirements', // or compliance_requirements, technical_requirements
  templateType: 'nist', // or fedramp, fisma, custom
  aiPrompt: customInstructions // Optional AI customization
};
```

### Step 3: AI Generation Process

**Context Gathering**
```javascript
// Backend service automatically gathers:
- System details from ingestion_systems
- Asset information from ingestion_assets  
- Vulnerability data from ingestion_vulnerabilities
- Control mappings from ingestion_controls
- Risk profile calculations
```

**AI Prompt Construction**
```javascript
const systemPrompt = `You are a cybersecurity requirements analyst specializing in creating comprehensive security requirements documents for government and enterprise systems.`;

const userPrompt = `
Generate a comprehensive security requirements document for:
SYSTEM: ${systemContext}
ASSETS: ${assetContext}
VULNERABILITIES: ${vulnerabilityContext}
CONTROLS: ${controlContext}
CUSTOM INSTRUCTIONS: ${aiPrompt}
`;
```

**Document Parsing and Structuring**
```javascript
// Automatic section detection and database storage
const sections = await parseGeneratedContent(aiContent, documentId);
// Creates structured sections with metadata
// Links to compliance controls and vulnerabilities
// Generates priority levels
```

### Step 4: Task Generation

```javascript
// AI extracts actionable tasks from each section
const taskPrompt = `
Extract actionable implementation tasks from:
SECTION: ${section.title}
CONTENT: ${section.content}

Generate tasks with:
- Clear titles and descriptions
- Estimated effort in hours
- Priority levels (critical, high, medium, low)
- Task types (implementation, testing, documentation, compliance)
- Acceptance criteria
`;
```

### Step 5: GitLab Integration

**Configuration Setup**
```javascript
const gitlabConfig = {
  name: 'Main GitLab Instance',
  gitlabUrl: 'https://gitlab.company.com',
  accessToken: 'glpat-xxxxxxxxxxxxxxxxxxxx',
  defaultProjectId: '123',
  defaultMilestone: 'Security Sprint',
  defaultLabels: ['security', 'requirements', 'compliance'],
  defaultAssignee: 'security-team'
};
```

**Issue Creation**
```javascript
// Automatic GitLab issue creation from tasks
const issueData = {
  title: task.title,
  description: formatIssueDescription(task, document),
  labels: [...defaultLabels, `task-type::${task.taskType}`, `priority::${task.priority}`],
  milestone_id: milestoneId,
  assignee_id: assigneeId,
  due_date: task.dueDate
};

const issue = await gitlab.post(`/projects/${projectId}/issues`, issueData);
```

## Data Flow Architecture

### 1. Input Data Sources
```
Tenable/Xacta Ingestion → ingestion_* tables
                       ↓
System/Asset Selection → Document Configuration
                       ↓
AI Context Gathering → OpenAI GPT-4o Processing
                       ↓
Document Generation → Section Parsing → Task Extraction
                       ↓
GitLab Integration → Issue Creation → Task Board
```

### 2. Database Relationships
```
requirementDocuments (1) → (many) requirementSections
                    (1) → (many) requirementTasks

requirementSections (1) → (many) requirementTasks

requirementTasks → GitLab Issues (external)

gitlabConfigurations → Multiple Documents
```

## Security and Compliance Features

### 1. Data Classification Support
- Automatic classification level inheritance from system data
- Compliance framework mapping (NIST 800-53, FedRAMP, FISMA)
- Control family organization and requirement traceability

### 2. Risk-Based Prioritization
```javascript
const riskScore = (
  (criticalVulns * 10) + 
  (highVulns * 7) + 
  (mediumVulns * 4) + 
  (lowVulns * 1)
) / totalVulns;

const riskLevel = riskScore >= 8 ? 'Critical' : 
                 riskScore >= 6 ? 'High' : 
                 riskScore >= 4 ? 'Medium' : 'Low';
```

### 3. Audit Trail
- Complete document generation history
- AI prompt and model version tracking
- Task creation and GitLab synchronization logs
- User actions and timestamps

## Usage Examples

### 1. Create Security Requirements Document
```bash
# 1. Select system and assets via frontend wizard
# 2. Configure document parameters
# 3. API call automatically triggers:

POST /api/requirements/documents
{
  "systemId": "sys-web-app-001",
  "assetIds": ["asset-web-01", "asset-db-01", "asset-fw-01"],
  "title": "Web Application Security Requirements",
  "documentType": "security_requirements",
  "templateType": "nist",
  "aiPrompt": "Focus on web application security and database protection"
}

# Response includes document ID for monitoring generation progress
```

### 2. Generate and Export Tasks to GitLab
```bash
# After document generation completes:

POST /api/requirements/documents/123/gitlab/issues
{
  "gitlabConfigId": 1,
  "projectId": "456"
}

# Creates GitLab issues for all document tasks with:
# - Structured descriptions
# - Appropriate labels and milestones
# - Due dates and priorities
# - Acceptance criteria checklists
```

### 3. Monitor and Sync Progress
```bash
# Sync individual task status from GitLab
POST /api/requirements/tasks/789/sync
{
  "gitlabConfigId": 1
}

# Updates task status based on GitLab issue state
# Maintains bidirectional synchronization
```

## Advanced Features

### 1. Custom AI Instructions
Users can provide specific instructions to customize AI generation:
- "Focus on cloud security controls for AWS environment"
- "Emphasize FISMA compliance requirements"
- "Include specific vendor security requirements"
- "Address zero trust architecture principles"

### 2. Template Customization
- Standard Security Requirements
- NIST 800-53 Compliance focused
- FedRAMP specific requirements
- FISMA compliance templates
- Custom organizational templates

### 3. Multi-System Support
- Generate requirements spanning multiple systems
- Cross-system dependency analysis
- Shared control implementation
- System boundary documentation

### 4. Integration Points
- **Vulnerability Management**: Links to remediation tasks
- **Asset Management**: Asset criticality consideration
- **Compliance Management**: Control mapping and evidence
- **Project Management**: GitLab issue tracking

## Technical Specifications

### Performance Characteristics
- AI generation time: 30-90 seconds for typical documents
- Document size: 2,000-8,000 words depending on complexity
- Task generation: 10-50 tasks per document
- GitLab issue creation: 1-2 seconds per task with rate limiting

### Scalability Considerations
- Concurrent document generation supported
- Batch task creation for large documents
- GitLab API rate limiting handled automatically
- Database indexing on document and task queries

### Error Handling
- AI generation failures with retry logic
- GitLab connection testing and validation
- Partial success handling for batch operations
- Comprehensive error logging and user feedback

## Deployment and Configuration

### 1. Required Environment Variables
```bash
OPENAI_API_KEY=sk-...  # Required for AI generation
DATABASE_URL=postgresql://...  # Database connection
```

### 2. Database Migration
```bash
# Tables automatically created via Drizzle schema
# No manual migration required
```

### 3. GitLab Setup
1. Create GitLab access token with API scope
2. Configure default project and settings
3. Test connection via admin interface
4. Set up default labels and milestones

This complete implementation provides a production-ready Requirements Document Generator that transforms manual security documentation into an automated, AI-powered workflow integrated with modern project management tools.