# Scan Management System - Comprehensive Code-to-UI Documentation

## System Overview
The Scan Management System in RAS DASH provides comprehensive vulnerability scanning, network discovery, and security assessment capabilities. This enterprise-grade system offers automated scanning, result analysis, scheduling, templating, and terminal-based scanning tools with real-time monitoring and extensive configuration options.

**Route**: `/scan-management` (Main scan section with multiple tabs)
**Architecture**: Multi-tab navigation with React, mixed model architecture (Drizzle ORM + Sequelize), comprehensive scanning infrastructure

## Table of Contents
1. [Database Schema and Models](#database-schema)
2. [Service Layer Architecture](#service-layer)
3. [Controller Layer](#controller-layer)
4. [Storage Layer](#storage-layer)
5. [Frontend Components](#frontend-components)
6. [Multi-Tab Navigation](#multi-tab-navigation)
7. [Scan Execution Engine](#scan-execution)
8. [Results Processing](#results-processing)
9. [Scheduling System](#scheduling)
10. [Template Management](#templates)
11. [Terminal Interface](#terminal)
12. [Settings and Configuration](#settings)
13. [API Endpoints](#api-endpoints)
14. [Security Features](#security-features)
15. [Integration Points](#integration-points)

---

## Database Schema and Models {#database-schema}

### 1. Scan Schema (Drizzle ORM - shared/schema.ts)
```typescript
// STIG Scan Results Table (existing in schema)
export const stigScanResults = pgTable('stig_scan_results', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id),
  scanDate: timestamp('scan_date').defaultNow(),
  scanTool: varchar('scan_tool', { length: 100 }),
  scanVersion: varchar('scan_version', { length: 50 }),
  stigId: varchar('stig_id', { length: 100 }),
  vulnId: varchar('vuln_id', { length: 100 }),
  severityCategory: varchar('severity_category', { length: 20 }),
  groupTitle: text('group_title'),
  ruleId: varchar('rule_id', { length: 100 }),
  ruleTitle: text('rule_title'),
  description: text('description'),
  fixText: text('fix_text'),
  checkText: text('check_text'),
  scanConfiguration: jsonb('scan_configuration'),
  result: varchar('result', { length: 50 }),
  comments: text('comments'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 2. Scan Interface Types (server/storage.ts)
```typescript
interface Scan {
  id: number;
  name: string;
  scanType: string;
  targetType: string;
  targetId: string;
  networkRange?: string;
  scheduleType: string;
  scheduleConfig: Record<string, any>;
  lastRun?: Date;
  nextRun?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  configuration: Record<string, any>;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertScan {
  name: string;
  scanType?: string;
  targetType?: string;
  targetId: string;
  networkRange?: string;
  scheduleType?: string;
  scheduleConfig?: Record<string, any>;
  status?: string;
  configuration?: Record<string, any>;
  createdBy?: number;
}

interface ScanResult {
  id: number;
  scanId: number;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  vulnerabilitiesFound: any[];
  outputFile?: string;
  error?: string;
}
```

### 3. Scan Filter Types
```typescript
interface ScanFilter {
  scanType?: string;
  targetType?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  keywords?: string;
}
```

---

## Service Layer Architecture {#service-layer}

### 1. ScannerService (server/services/scannerService.ts)
**Core Scanning Engine**
```typescript
export class ScannerService extends BaseService<typeof Vulnerability> {
  private scannerPath: string;

  // Core Methods
  async executeScan(scanId: number, scanType: string, target: string, options: Record<string, any>): Promise<void>
  private async processScanResults(outputFilename: string, scanResultId: number): Promise<{vulnerabilities: any[]; summary: any}>
  private async createScanResult(resultData: any): Promise<ScanResult>
  private async updateScanResult(resultId: number, updates: any): Promise<void>
  private async updateScanStatus(scanId: number, status: string): Promise<void>
  private normalizeSeverity(severity: string): string
}
```

**Key Features**:
- Command-line scanner integration
- Real-time process monitoring
- Vulnerability result processing
- File-based result management
- Status tracking and updates

### 2. ScanService (server/services/ScanService.ts)
**High-Level Scan Management**
```typescript
class ScanService {
  async findAllPaginated(options: any, pagination: any): Promise<any>
  async findById(id: number): Promise<any>
  async create(scanData: any): Promise<any>
  async startScan(id: number): Promise<any>
  async stopScan(id: number): Promise<any>
  async getScanResults(id: number, format: string): Promise<any>
  async getScanStatistics(timeframe: string): Promise<any>
}
```

---

## Controller Layer {#controller-layer}

### Scan Controller (server/controllers/scanController.ts)
**API Endpoint Handlers**
```typescript
// Core CRUD Operations
export const getAllScans = async (req: Request, res: Response)
export const getScanById = async (req: Request, res: Response)
export const createScan = async (req: Request, res: Response)

// Scan Execution
export const startScan = async (req: Request, res: Response)
export const stopScan = async (req: Request, res: Response)

// Results and Analytics
export const getScanResults = async (req: Request, res: Response)
export const getScanStatistics = async (req: Request, res: Response)
```

**Features**:
- Comprehensive error handling
- Input validation
- Pagination support
- Status filtering
- Real-time scan control

---

## Storage Layer {#storage-layer}

### PG Storage Implementation (server/pgStorage/scanStorage.ts)
**Database Operations**
```typescript
export const scanStorageMethods = {
  // Core CRUD
  async getScan(id: number): Promise<Scan | undefined>
  async listScans(filter?: ScanFilter, page = 1, pageSize = 10): Promise<{scans: Scan[]; total: number}>
  async createScan(scan: InsertScan): Promise<Scan>
  async updateScan(id: number, scan: Partial<InsertScan>): Promise<Scan | undefined>
  async deleteScan(id: number): Promise<boolean>

  // Advanced Operations
  async getScanResults(scanId: number): Promise<ScanResult[]>
  async getScanStatistics(timeframe: string): Promise<any>
}
```

**Key Features**:
- Dynamic SQL query building
- Advanced filtering capabilities
- Pagination support
- JSON field handling
- Transaction safety

---

## Frontend Components {#frontend-components}

### 1. Main Scan Management Page (src/pages/scan-management/index.tsx)
**Primary Scan Interface**
```typescript
interface Asset {
  id: number;
  name: string;
  ipAddress: string;
  operatingSystem: string;
  osVersion?: string;
  status: string;
  type?: string;
  category?: string;
}

const createScanSchema = z.object({
  name: z.string().min(3).max(100),
  scanType: z.string().min(1),
  targetId: z.string().min(1).max(255),
  targetType: z.string().optional().default('host'),
  networkRange: z.string().optional(),
  scheduleType: z.string().optional().default('manual'),
  scheduleConfig: z.record(z.any()).optional().default({}),
  status: z.string().optional().default('pending'),
  description: z.string().optional(),
  configuration: z.record(z.any()).optional().default({}),
});
```

**Key Features**:
- Scan creation and management
- Asset selection with autocomplete
- Real-time status monitoring
- Progress tracking
- Error handling and validation

### 2. Scan Results Page (src/pages/scan-management/results.tsx)
**Vulnerability Results Analysis**
```typescript
interface VulnerabilityResult {
  id: string;
  name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cveScore: number;
  affectedAssets: number;
  discoveredDate: string;
  status: 'Open' | 'In Progress' | 'Fixed';
  description: string;
}

const vulnerabilityResults = {
  critical: VulnerabilityResult[];
  high: VulnerabilityResult[];
  medium: VulnerabilityResult[];
  low: VulnerabilityResult[];
};
```

**Features**:
- Severity-based categorization
- Tabbed vulnerability display
- Status badge visualization
- Detailed vulnerability sheets
- Statistics cards

### 3. Scheduling Page (src/pages/scan-management/schedule.tsx)
**Automated Scan Scheduling**
```typescript
interface ScanSchedule {
  id: number;
  name: string;
  frequency: string;
  nextRun: string;
  nextRunDate: Date;
  targets: string;
  template: string;
  enabled: boolean;
  runNow?: boolean;
  enableEmail?: boolean;
}

const scheduleFormSchema = z.object({
  name: z.string().min(1),
  frequency: z.string().min(1),
  targets: z.string().min(1),
  template: z.string().min(1),
  startDate: z.date(),
  startTime: z.string().min(1),
  runNow: z.boolean().default(false),
  enableEmail: z.boolean().default(true),
});
```

### 4. Templates Page (src/pages/scan-management/templates.tsx)
**Scan Template Management**
```typescript
interface ScanTemplate {
  id: number;
  name: string;
  description: string;
  scanType: string;
  duration: string;
  createdAt: string;
  enablePortScan: boolean;
  enableVulnerabilityScan: boolean;
  enableComplianceScan: boolean;
  enableConfigurationScan: boolean;
  scanPriority: string;
  scanDepth: string;
  color?: string;
  icon?: string;
}
```

### 5. Terminal Page (src/pages/scan-management/terminal.tsx)
**Command-Line Scanning Interface**
```typescript
interface ExtendedCommandPreset {
  name: string;
  command: string;
  description: string;
  color?: string;
  icon?: string;
  type?: string;
  category?: string;
}

interface OutputLine {
  text: string;
  type: 'command' | 'output' | 'error' | 'system';
}
```

**Preset Categories**:
- Network Discovery
- Asset Discovery  
- Vulnerability Scanning
- Compliance Scanning

### 6. Settings Page (src/pages/scan-management/settings.tsx)
**Configuration Management**
```typescript
interface EngineSettings {
  maxThreads: number;
  timeout: number;
  retryCount: number;
  scanDepth: string;
  autoRemediate: boolean;
  reduceLoad: boolean;
}

interface NotificationSettings {
  emailNotify: boolean;
  slackNotify: boolean;
  smsNotify: boolean;
  webhookNotify: boolean;
  scanStart: boolean;
  scanComplete: boolean;
  scanFailed: boolean;
  criticalVuln: boolean;
}

interface IntegrationSettings {
  jiraUrl: string;
  jiraApiKey: string;
  servicenowUrl: string;
  servicenowUsername: string;
  servicenowPassword: string;
  slackBotToken: string;
  slackChannelId: string;
  ticketCritical: boolean;
  ticketHigh: boolean;
  ticketMedium: boolean;
  ticketLow: boolean;
}
```

---

## Multi-Tab Navigation {#multi-tab-navigation}

### Layout Component (src/components/layout/ScanManagementLayout.tsx)
```typescript
const tabs = [
  { path: "/scan-management", label: "Scans" },
  { path: "/scan-management/results", label: "Results" },
  { path: "/scan-management/terminal", label: "Scan Terminal" },
  { path: "/scan-management/templates", label: "Templates" },
  { path: "/scan-management/schedule", label: "Schedule" },
  { path: "/scan-management/settings", label: "Settings" },
];
```

**Navigation Features**:
- Active tab highlighting
- Consistent layout structure
- Responsive design
- Route-based activation

---

## Scan Execution Engine {#scan-execution}

### Command Line Integration
**Scanner Process Management**:
```typescript
// Command building
const args = [
  path.join(this.scannerPath, 'index.js'),
  scanType,
  target,
  '--output', outputFilename,
  '--format', 'json',
  '--comprehensive', 'true'
];

// Process execution
const scanProcess = spawn('node', args, {
  cwd: this.scannerPath,
  stdio: ['pipe', 'pipe', 'pipe']
});
```

### Scan Types Supported
- **port-scan**: Network port scanning
- **vuln-scan**: Vulnerability assessment
- **web-scan**: Web application security
- **server-scan**: Server configuration audit
- **compliance-scan**: Compliance checking
- **aws-scan**: AWS resource scanning

### Status Management
```typescript
type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Status flow: pending → running → completed/failed
await this.updateScanStatus(scanId, 'running');
// ... scan execution ...
await this.updateScanStatus(scanId, 'completed');
```

---

## Results Processing {#results-processing}

### Vulnerability Processing
```typescript
const vulnerabilityData = {
  cve: vuln.cve || `SCAN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  description: vuln.description || vuln.name || 'Vulnerability detected by scanner',
  severity: this.normalizeSeverity(vuln.severity || vuln.risk || 'medium'),
  cvssScore: vuln.cvss_score || vuln.score || 0,
  status: 'open',
  source: 'scanner',
  details: JSON.stringify(vuln)
};
```

### Result Categorization
- **Critical**: CVSS 9.0-10.0
- **High**: CVSS 7.0-8.9
- **Medium**: CVSS 4.0-6.9
- **Low**: CVSS 0.1-3.9

### File Management
- JSON output format
- Structured result storage
- Temporary file cleanup
- Result archival

---

## Scheduling System {#scheduling}

### Schedule Types
- **Manual**: On-demand execution
- **Daily**: Daily recurring scans
- **Weekly**: Weekly recurring scans
- **Monthly**: Monthly recurring scans
- **Quarterly**: Quarterly recurring scans

### Calendar Integration
```typescript
const { data: selectedDate, setSelectedDate } = useState<Date | undefined>(new Date());

// Date formatting
const formatScheduleDate = (date: Date, time: string): string => {
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return `${formattedDate} - ${time}`;
};
```

### Notification System
- Email notifications
- Slack integration
- Webhook notifications
- Real-time alerts

---

## Template Management {#templates}

### Predefined Templates
1. **Basic Network Scan** - Quick network discovery
2. **Advanced Scan** - Comprehensive detection
3. **Advanced Dynamic Scan** - Deep application analysis
4. **Malware Scan** - Malicious software detection
5. **Mobile Device Scan** - Mobile compliance audit
6. **Web Application Tests** - Web security assessment
7. **Credentialed Patch Audit** - System patch verification
8. **Ransomware Vulnerability** - Ransomware-specific scanning
9. **Cloud Asset Discovery** - Multi-cloud asset discovery

### Template Schema
```typescript
const templateFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  scanType: z.string().min(1),
  duration: z.string().min(1),
  enablePortScan: z.boolean().default(true),
  enableVulnerabilityScan: z.boolean().default(true),
  enableComplianceScan: z.boolean().default(false),
  enableConfigurationScan: z.boolean().default(false),
  scanPriority: z.string().default("normal"),
  scanDepth: z.string().default("standard"),
});
```

---

## Terminal Interface {#terminal}

### Command Presets
**Network Discovery**:
- `ip-scan 192.168.1.0/24` - Network host discovery
- `port-scan 192.168.1.0/24 --port-range 1-65535` - Port scanning
- `port-scan 192.168.1.0/24 --service-detection` - Service detection

**Asset Discovery**:
- `asset-discovery 192.168.1.0/24 --methods network` - Network-based discovery
- `asset-discovery cloud --cloud-provider aws` - Cloud discovery
- `asset-discovery example.com --methods activedirectory` - AD discovery

**Vulnerability Scanning**:
- `vuln-scan 192.168.1.0/24` - Basic vulnerability scan
- `vuln-scan 192.168.1.0/24 --comprehensive` - Deep vulnerability scan
- `web-scan https://example.com` - Web application scan

**Compliance Scanning**:
- `compliance-scan 192.168.1.0/24 --standard nist800-53` - NIST compliance
- `compliance-scan 192.168.1.0/24 --standard pci-dss` - PCI DSS compliance
- `server-scan 192.168.1.100 --comprehensive` - Server audit

### Terminal Features
- Real-time command execution
- Output streaming
- Command history
- Preset command library
- Color-coded output
- Export capabilities

---

## Settings and Configuration {#settings}

### Engine Settings
- **Max Threads**: Concurrent scan processes
- **Timeout**: Scan timeout duration
- **Retry Count**: Failed scan retry attempts
- **Scan Depth**: thoroughness level
- **Auto Remediate**: Automatic fix application
- **Reduce Load**: System resource optimization

### Integration Settings
- **JIRA Integration**: Ticket creation
- **ServiceNow Integration**: Incident management
- **Slack Integration**: Real-time notifications
- **Webhook Notifications**: Custom integrations

### API Endpoints for Settings
```typescript
PUT /api/scanner/settings/engine        // Engine configuration
PUT /api/scanner/settings/notifications // Notification settings
PUT /api/scanner/settings/integrations  // Third-party integrations
GET /api/scanner/settings               // Get all settings
GET /api/integrations/slack/status      // Slack integration status
```

---

## API Endpoints {#api-endpoints}

### Core Scan Management
```typescript
// Scan CRUD Operations
GET    /api/scans                    // List scans with pagination/filtering
GET    /api/scans/:id               // Get specific scan
POST   /api/scans                   // Create new scan
PUT    /api/scans/:id               // Update scan
DELETE /api/scans/:id               // Delete scan

// Scan Execution
POST   /api/scans/:id/start         // Start scan
POST   /api/scans/:id/stop          // Stop scan
GET    /api/scans/:id/status        // Get scan status

// Results and Analytics
GET    /api/scans/:id/results       // Get scan results
GET    /api/scans/statistics        // Get scan statistics
GET    /api/scans/types             // Get available scan types

// Settings and Configuration
GET    /api/scanner/settings        // Get scanner settings
PUT    /api/scanner/settings/engine // Update engine settings
PUT    /api/scanner/settings/notifications // Update notification settings

// Integration Endpoints
GET    /api/integrations/slack/status // Slack integration status
POST   /api/integrations/jira/test  // Test JIRA connection
POST   /api/integrations/servicenow/test // Test ServiceNow connection
```

### Request/Response Examples
```typescript
// Create Scan Request
POST /api/scans
{
  "name": "Production Network Scan",
  "scanType": "vuln-scan",
  "targetId": "192.168.1.0/24",
  "targetType": "network",
  "scheduleType": "manual",
  "configuration": {
    "comprehensive": true,
    "depth": "thorough"
  }
}

// Scan Response
{
  "id": 123,
  "name": "Production Network Scan",
  "scanType": "vuln-scan",
  "status": "pending",
  "targetId": "192.168.1.0/24",
  "createdAt": "2025-04-03T10:00:00Z",
  "configuration": {...}
}
```

---

## Security Features {#security-features}

### Authentication and Authorization
- User-based scan creation
- Role-based access control
- Audit trail logging
- Resource access restrictions

### Data Protection
- Encrypted credential storage
- Secure communication protocols
- Result data encryption
- Access logging

### Compliance Integration
- NIST 800-53 compliance checking
- PCI DSS validation
- STIG compliance verification
- Custom compliance frameworks

---

## Integration Points {#integration-points}

### 1. Asset Management Integration
```typescript
const assetsQuery = useQuery<Asset[]>({
  queryKey: ["/api/assets"],
  queryFn: async () => {
    const response = await apiRequest("GET", "/api/assets?pageSize=100");
    const data = await response.json();
    return data.assets || [];
  }
});
```

### 2. Vulnerability Database Integration
- CVE database synchronization
- NIST NVD integration
- Custom vulnerability feeds
- Risk scoring integration

### 3. Notification Systems
- **Email Notifications**: SMTP integration
- **Slack Integration**: Bot token authentication
- **Webhook Support**: Custom API callbacks
- **SMS Notifications**: Twilio integration

### 4. Ticketing Systems
- **JIRA Integration**: Automatic ticket creation
- **ServiceNow Integration**: Incident management
- **Custom Ticketing**: Webhook-based integration

---

## State Management and React Query

### Cache Key Structure
```typescript
// Scans
["/api/scans"]                           // All scans
["/api/scans", page, limit, filters]     // Paginated scans
["/api/scans", scanId]                   // Specific scan

// Assets
["/api/assets"]                          // Asset selection

// Scanner Settings
["/api/scanner/settings"]                // Configuration
["/api/integrations/slack/status"]       // Integration status
```

### Mutation Patterns
```typescript
const createScanMutation = useMutation({
  mutationFn: async (values: CreateScanFormValues) => {
    createScanSchema.parse(values);
    const response = await apiRequest("POST", "/api/scans", values);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Server validation failed");
    }
    return await response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/scans"] });
    toast({ title: "Scan created", description: "The scan has been created successfully." });
  },
  onError: (error) => {
    // Comprehensive error handling for validation and server errors
  }
});
```

---

## Error Handling and Validation

### Frontend Validation
```typescript
// Zod schema validation
const createScanSchema = z.object({
  name: z.string().min(3, "Scan name must be at least 3 characters."),
  scanType: z.string().min(1, "Scan type is required."),
  targetId: z.string().min(1, "Target ID is required."),
  // ... additional validation rules
});

// Form error handling
if (error instanceof z.ZodError) {
  const fieldErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
  toast({
    title: "Validation error",
    description: `Please fix the following issues: ${fieldErrors}`,
    variant: "destructive",
  });
}
```

### Backend Error Handling
```typescript
// Service-level error handling
try {
  const scan = await scanService.findById(Number(id));
  if (!scan) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  res.json(scan);
} catch (error) {
  console.error('Error fetching scan:', error);
  res.status(500).json({ error: 'Failed to fetch scan' });
}
```

---

## Performance Optimization

### 1. Pagination and Filtering
- Server-side pagination
- Advanced filtering capabilities
- Debounced search inputs
- Efficient cache invalidation

### 2. Real-time Updates
- Status polling for active scans
- Progress tracking
- Live terminal output
- Real-time notifications

### 3. Resource Management
- Concurrent scan limitations
- Memory usage optimization
- File system cleanup
- Background processing

---

## Component Interaction Flow

### Scan Creation Flow
1. **Form Input**: User fills scan creation form with validation
2. **Asset Selection**: Autocomplete asset picker with real-time search
3. **Template Selection**: Optional template application
4. **Validation**: Frontend and backend validation
5. **Creation**: Database insertion and immediate status update
6. **Execution**: Optional immediate scan start

### Scan Execution Flow
1. **Initiation**: User triggers scan start
2. **Process Spawn**: Command-line scanner process creation
3. **Monitoring**: Real-time stdout/stderr capture
4. **Processing**: Result parsing and vulnerability extraction
5. **Storage**: Database storage of results and status updates
6. **Notification**: Alert generation and distribution

### Results Analysis Flow
1. **Result Retrieval**: Paginated vulnerability data fetching
2. **Categorization**: Severity-based result grouping
3. **Visualization**: Charts, tables, and detail sheets
4. **Export**: PDF/CSV export capabilities
5. **Action**: Remediation workflow integration

---

## Best Practices and Patterns

### 1. Component Architecture
- Single responsibility components
- Reusable scan status badges
- Consistent form validation patterns
- Modular template systems

### 2. Data Flow
- React Query for server state management
- Optimistic updates for scan actions
- Comprehensive error boundaries
- Consistent loading states

### 3. Security Patterns
- Input sanitization
- Credential encryption
- Audit logging
- Access control enforcement

### 4. Performance Patterns
- Pagination for large datasets
- Debounced search inputs
- Lazy loading for complex components
- Efficient cache management

---

## Future Enhancement Opportunities

### 1. Advanced Features
- Machine learning vulnerability prediction
- Automated remediation workflows
- Advanced threat correlation
- Custom scan plugin system

### 2. Integration Enhancements
- Additional cloud provider support
- Enhanced SIEM integration
- API gateway integration
- Container security scanning

### 3. User Experience Improvements
- Advanced visualization dashboards
- Mobile application support
- Voice command integration
- AI-powered scan recommendations

---

This comprehensive documentation provides complete coverage of the Scan Management System, from database design to user interface implementation. The system demonstrates enterprise-grade scanning capabilities with robust workflow automation, real-time monitoring, and extensive integration options for comprehensive cybersecurity operations.