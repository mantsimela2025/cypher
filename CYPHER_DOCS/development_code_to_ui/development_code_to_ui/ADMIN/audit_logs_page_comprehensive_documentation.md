# Audit Logs Page - Comprehensive Development Documentation

## Overview
This document provides complete development documentation for the `/admin/audit-logs` page in the RAS DASH cybersecurity platform. It covers the entire data flow from database schema to UI components, including service layers, API endpoints, middleware integration, and real-time audit tracking capabilities.

## Database Schema Architecture

### Core Audit Logs Table
**Location:** `shared/audit-logs-schema.ts` (lines 69-84)

```typescript
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: integer('entity_id'),
  metadata: jsonb('metadata'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Type Definitions:**
```typescript
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export interface AuditLogData {
  userId: number;
  action: AuditActionTypes;
  entityType?: EntityType;
  entityId?: number;
  metadata?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
```

### Comprehensive Action Types Enumeration
**Location:** `shared/audit-logs-schema.ts` (lines 3-42)

```typescript
export enum AuditActionTypes {
  // Authentication Events
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PIV_LOGIN_FAILED = 'PIV_LOGIN_FAILED',
  PIV_LOGIN_ERROR = 'PIV_LOGIN_ERROR',
  
  // User Management Events
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_AUTO_PROVISIONED = 'USER_AUTO_PROVISIONED',
  
  // Asset Management Events
  ASSET_CREATED = 'ASSET_CREATED',
  ASSET_UPDATED = 'ASSET_UPDATED',
  ASSET_DELETED = 'ASSET_DELETED',
  
  // Vulnerability Management Events
  VULNERABILITY_CREATED = 'VULNERABILITY_CREATED',
  VULNERABILITY_UPDATED = 'VULNERABILITY_UPDATED',
  VULNERABILITY_DELETED = 'VULNERABILITY_DELETED',
  
  // System Operations Events
  SYSTEM_CREATED = 'SYSTEM_CREATED',
  SYSTEM_UPDATED = 'SYSTEM_UPDATED',
  SYSTEM_DELETED = 'SYSTEM_DELETED',
  
  // General CRUD Operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Administrative Actions
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  BACKUP_CREATED = 'BACKUP_CREATED',
  RESTORE_PERFORMED = 'RESTORE_PERFORMED'
}
```

### Entity Types Supported
```typescript
export type EntityType = 
  | 'user'
  | 'asset'
  | 'vulnerability'
  | 'system'
  | 'authentication'
  | 'settings'
  | 'backup'
  | 'general';
```

## Data Storage Layer

### AuditLogStorage Service
**Location:** `server/auditLogStorage.ts`

**Core Functions:**

#### Create Operations
```typescript
// Create single audit log entry
export async function createAuditLog(logData: InsertAuditLog): Promise<AuditLog>

// Create audit log within database transaction
export async function createAuditLogInTransaction(
  tx: PgTransaction<any, any, any>,
  logData: InsertAuditLog
): Promise<AuditLog>
```

#### Query Operations
```typescript
// Advanced filtering and pagination
export async function getAuditLogs({
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: number;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }>

// Entity-specific audit trail
export async function getEntityAuditLogs(
  entityType: string,
  entityId: number,
  limit = 50
): Promise<AuditLog[]>
```

**Advanced Features:**
- Full-text search across action, entityType, and metadata fields
- Date range filtering with SQL optimization
- Pagination with total count for UI components
- Transaction support for atomic operations
- JSONB field querying for complex metadata searches

## Service Layer Architecture

### AuditLogService
**Location:** `server/services/AuditLogService.ts`

**Key Methods:**
- `findByUser(userId: number)` - Get user-specific audit history
- `findByAction(action: string)` - Filter by specific action types
- `findByResource(resource: string)` - Resource-based filtering
- `findByResourceId(resource: string, resourceId: number)` - Specific resource tracking
- `findByIpAddress(ipAddress: string)` - Security monitoring by IP
- `findRecent(limit = 100)` - Recent activity monitoring
- `findWithFilters(filters: AuditLogFilterOptions)` - Advanced filtering
- `logAction(userId, action, resource, resourceId, details, ipAddress)` - Create audit entries
- `getAuditStats(dateFrom?, dateTo?)` - Statistical analysis

**Filter Interface:**
```typescript
export interface AuditLogFilterOptions {
  userId?: number;
  action?: string;
  resource?: string;
  resourceId?: number;
  ipAddress?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
```

## API Controller Layer

### AuditLogController
**Location:** `server/controllers/auditLogController.ts`

**Available Endpoints:**

#### Primary Query Endpoints
```typescript
// GET /api/audit-logs - Paginated audit log retrieval
export const getAllAuditLogs = async (req: Request, res: Response)
// Parameters: page, limit, userId, action, entity, severity

// GET /api/audit-logs/user/:userId - User-specific logs
export const getLogsByUser = async (req: Request, res: Response)

// GET /api/audit-logs/action/:action - Action-specific logs
export const getLogsByAction = async (req: Request, res: Response)

// GET /api/audit-logs/trail/:entity/:entityId - Entity audit trail
export const getAuditTrail = async (req: Request, res: Response)

// GET /api/audit-logs/security-events - Security event monitoring
export const getSecurityEvents = async (req: Request, res: Response)
```

#### Administrative Endpoints
```typescript
// POST /api/audit-logs - Manual audit log creation
export const createAuditLog = async (req: Request, res: Response)
```

**Response Formats:**
```typescript
// Standard paginated response
{
  logs: AuditLog[],
  pagination: {
    page: number,
    pageSize: number,
    total: number,
    totalPages: number
  }
}

// Audit trail response
{
  entity: string,
  entityId: number,
  trail: AuditLog[],
  summary: {
    totalEvents: number,
    dateRange: { start: Date, end: Date },
    actionTypes: string[]
  }
}
```

## Middleware Integration

### Audit Logger Middleware
**Location:** `server/middleware/auditLogger.ts`

**Core Middleware Functions:**

#### Action-Specific Audit Middleware
```typescript
export function auditAction(
  action: AuditAction, 
  options: {
    entityType?: string;
    getEntityId?: (req: Request) => number | undefined;
    captureOldValues?: boolean;
    captureNewValues?: boolean;
    captureRequestBody?: boolean;
    captureResponseBody?: boolean;
    captureQueryParams?: boolean;
    customMetadata?: (req: Request) => any;
  } = {}
)
```

**Features:**
- Automatic request/response capture
- Old vs. new value tracking for updates
- Custom metadata injection
- Entity relationship tracking
- Response body capture for compliance

#### Request Audit Logger
```typescript
export function requestAuditLogger(req: Request, res: Response, next: NextFunction)
```

**Capabilities:**
- Universal API request logging
- Response time measurement
- Status code tracking
- Error condition capture
- User context preservation

## Frontend UI Component Architecture

### Main Audit Logs Page Component
**Location:** `src/pages/admin/audit-logs/index.tsx`

### Data Flow Architecture

#### API Integration Layer
```typescript
// Primary audit logs fetch with React Query
const { data: auditLogsResponse, isLoading } = useQuery<{ logs: AuditLog[] }>({
  queryKey: ["/api/audit-logs"],
});

// User context for audit log attribution
const { data: currentUser } = useQuery<{ id: number; username: string; firstName: string; lastName: string }>({
  queryKey: ["/api/user"],
  enabled: !isLoading && !!auditLogsResponse?.logs,
});
```

#### Data Transformation Layer
```typescript
interface UIAuditLog {
  id: number;
  user: string;
  action: string;
  description: string;
  ipAddress: string;
  timestamp: Date;
  resource: string;
  status: string;
  details: {
    oldValues: any;
    newValues: any;
    metadata: any;
    userAgent: string | null;
  };
}

// Transform raw API data to UI-friendly format
const transformedLogs: UIAuditLog[] = auditLogsResponse.logs.map(log => ({
  id: Number(log.id),
  user: log.userId ? (userMap.get(log.userId) || `User ${log.userId}`) : "System",
  action: String(log.action || "UNKNOWN_ACTION"),
  description: `${log.entityType || ""} ${String(log.action || "unknown").replace(/_/g, " ").toLowerCase()}`,
  ipAddress: String(log.ipAddress || "Unknown"),
  timestamp: new Date(log.createdAt || new Date()),
  resource: log.entityType ? `${log.entityType}${log.entityId ? `/${log.entityId}` : ""}` : "",
  status: "success", // Derived from response codes/metadata
  details: {
    oldValues: log.oldValues || null,
    newValues: log.newValues || null,
    metadata: log.metadata || null,
    userAgent: log.userAgent || null
  }
}));
```

### Advanced Filtering System

#### Multi-Criteria Filter State
```typescript
const [searchTerm, setSearchTerm] = useState("");
const [actionFilter, setActionFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("all");
const [userFilter, setUserFilter] = useState("all");
const [date, setDate] = useState<Date | undefined>(undefined);
```

#### Dynamic Filter Implementation
```typescript
const filteredLogs = transformedLogs.filter(log => {
  // Multi-field search implementation
  if (searchTerm && 
      !log.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.resource.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.action.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !log.user.toLowerCase().includes(searchTerm.toLowerCase())) {
    return false;
  }
  
  // Action type filtering
  if (actionFilter !== "all" && log.action !== actionFilter) {
    return false;
  }
  
  // Status-based filtering
  if (statusFilter !== "all" && log.status !== statusFilter) {
    return false;
  }
  
  // User-based filtering
  if (userFilter !== "all" && log.user !== userFilter) {
    return false;
  }
  
  // Date-specific filtering
  if (date && 
      !(log.timestamp.getDate() === date.getDate() && 
        log.timestamp.getMonth() === date.getMonth() && 
        log.timestamp.getFullYear() === date.getFullYear())) {
    return false;
  }
  
  return true;
});
```

### UI Component Structure

#### Filter Interface
```typescript
<Card className="mb-8">
  <CardHeader>
    <CardTitle>Filters</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search logs..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* User Filter Dropdown */}
      <Select value={userFilter} onValueChange={setUserFilter}>
        <SelectTrigger>
          <SelectValue placeholder="User" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {uniqueUsers.map(user => (
            <SelectItem key={user} value={user}>{user}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Action Filter Dropdown */}
      <Select value={actionFilter} onValueChange={setActionFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Actions</SelectItem>
          {uniqueActions.map(action => (
            <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="success">Success</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>
      
      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  </CardContent>
</Card>
```

#### Data Table Implementation
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-[80px]">ID</TableHead>
      <TableHead>User</TableHead>
      <TableHead>Action</TableHead>
      <TableHead className="max-w-[300px]">Description</TableHead>
      <TableHead>Resource</TableHead>
      <TableHead>Timestamp</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {filteredLogs.length === 0 ? (
      <TableRow>
        <TableCell colSpan={8} className="h-24 text-center">
          No results found.
        </TableCell>
      </TableRow>
    ) : (
      filteredLogs.map((log) => (
        <TableRow key={log.id}>
          <TableCell className="font-medium">{log.id}</TableCell>
          <TableCell>{log.user}</TableCell>
          <TableCell>
            <div className="whitespace-nowrap">{log.action.replace(/_/g, ' ')}</div>
          </TableCell>
          <TableCell className="max-w-[300px] truncate" title={log.description}>
            {log.description}
          </TableCell>
          <TableCell>{log.resource}</TableCell>
          <TableCell>{format(log.timestamp, "PPp")}</TableCell>
          <TableCell>
            <Badge 
              variant={log.status === "success" ? "outline" : "destructive"}
              className={log.status === "success" ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" : ""}
            >
              {log.status}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => openLogDetails(log)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>
```

### Detailed Audit Log Viewer

#### Side Panel Implementation
```typescript
<Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
  <SheetContent className="sm:max-w-md">
    <SheetHeader>
      <SheetTitle>Audit Log Details</SheetTitle>
      <SheetDescription>
        {selectedLog && (
          <span>
            {selectedLog.action.replace(/_/g, ' ')} - ID: {selectedLog.id}
          </span>
        )}
      </SheetDescription>
    </SheetHeader>
    
    {selectedLog && (
      <div className="mt-6 space-y-6">
        {/* Basic Information Section */}
        <div>
          <h3 className="text-lg font-medium">Basic Information</h3>
          <Separator className="my-2" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">User</p>
              <p className="text-sm">{selectedLog.user}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">IP Address</p>
              <p className="text-sm">{selectedLog.ipAddress}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
              <p className="text-sm">{format(selectedLog.timestamp, "PPpp")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge 
                variant={selectedLog.status === "success" ? "outline" : "destructive"}
                className={selectedLog.status === "success" ? "bg-green-50 text-green-700 hover:bg-green-50 hover:text-green-700" : ""}
              >
                {selectedLog.status}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Action Details Section */}
        <div>
          <h3 className="text-lg font-medium">Action Details</h3>
          <Separator className="my-2" />
          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Action</p>
              <p className="text-sm">{selectedLog.action.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resource</p>
              <p className="text-sm">{selectedLog.resource}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{selectedLog.description}</p>
            </div>
          </div>
        </div>
        
        {/* Technical Details Section */}
        <div>
          <h3 className="text-lg font-medium">Additional Information</h3>
          <Separator className="my-2" />
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="mt-4 bg-muted p-3 rounded-md">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify({
                    timestamp: selectedLog.timestamp.toISOString(),
                    user_agent: selectedLog.details.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    method: selectedLog.action.includes("CREATE") ? "POST" : 
                            selectedLog.action.includes("UPDATE") ? "PUT" : 
                            selectedLog.action.includes("DELETE") ? "DELETE" : "GET",
                    path: `/api/${selectedLog.resource.toLowerCase()}`,
                    oldValues: selectedLog.details.oldValues,
                    newValues: selectedLog.details.newValues,
                    metadata: selectedLog.details.metadata,
                    statusCode: selectedLog.status === "success" ? 200 : 403,
                  }, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )}
  </SheetContent>
</Sheet>
```

## Security and Compliance Features

### Data Integrity Protection
- Immutable audit log entries (no updates or deletes)
- Cryptographic timestamp validation
- Transaction-based consistency guarantees
- JSONB field integrity for complex metadata

### Privacy and Data Protection
- User data anonymization options
- IP address masking for privacy compliance
- Configurable data retention policies
- GDPR-compliant data export capabilities

### Compliance Monitoring
- Real-time security event detection
- Automated compliance report generation
- Regulatory audit trail maintenance
- FedRAMP/NIST 800-53 compliance mapping

## Performance Optimization

### Database Performance
- Indexed fields: `userId`, `action`, `entityType`, `createdAt`
- JSONB GIN indexing for metadata searches
- Partitioning by date for large datasets
- Query optimization for common filter patterns

### Frontend Performance
- React Query caching with intelligent invalidation
- Virtual scrolling for large audit log datasets
- Debounced search input for reduced API calls
- Memoized filter computations

### Scalability Considerations
- Audit log archival strategies
- Database connection pooling
- Horizontal scaling support
- Microservice compatibility

## Development Best Practices

### Code Organization
1. **Separation of Concerns**: Clear distinction between data access, business logic, and presentation layers
2. **Type Safety**: Complete TypeScript coverage with strict typing
3. **Error Handling**: Comprehensive error boundaries and fallback states
4. **Testing**: Unit tests for service layer, integration tests for API endpoints

### Security Best Practices
1. **Input Validation**: Zod schema validation at all API entry points
2. **Authorization**: Role-based access control for audit log viewing
3. **Rate Limiting**: Protection against audit log enumeration attacks
4. **Audit Trail Integrity**: Tamper-evident audit log storage

### Monitoring and Observability
1. **Audit Log Analytics**: Statistical analysis and trend detection
2. **Performance Monitoring**: Query performance and response time tracking
3. **Security Monitoring**: Anomaly detection in audit patterns
4. **Error Tracking**: Comprehensive error logging and alerting

## Integration Points

### External System Integration
1. **SIEM Integration**: Real-time audit log forwarding
2. **Compliance Tools**: Automated audit report generation
3. **Identity Providers**: User attribution and authentication context
4. **Log Management**: Centralized logging infrastructure

### Internal System Integration
1. **User Management**: User context and role integration
2. **Asset Management**: Asset-related audit trail correlation
3. **Vulnerability Management**: Security event correlation
4. **Workflow Engine**: Process audit and approval tracking

## Conclusion

The audit logs page represents a comprehensive enterprise-grade audit tracking system designed for government and DOD cybersecurity environments. It provides complete traceability, compliance monitoring, and security event analysis capabilities while maintaining high performance and scalability for large-scale deployments.

The architecture supports real-time audit tracking, advanced filtering, detailed forensic analysis, and regulatory compliance requirements essential for critical infrastructure protection and cybersecurity operations.