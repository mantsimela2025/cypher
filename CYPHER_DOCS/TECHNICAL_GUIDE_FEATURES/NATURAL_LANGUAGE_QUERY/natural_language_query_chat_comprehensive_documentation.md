# Natural Language Query (NLQ) Chat Feature - Comprehensive Development Documentation

**Generated:** August 04, 2025  
**System:** RAS DASH - Cyber Security as a Service Platform  
**Component:** Floating Chat Widget with Natural Language Query Interface  

---

## I. Drizzle Schemas and Sequelize Models Used

### Drizzle Schema Tables (shared/schema.ts)

#### 1. `metricsDefinitions` Table
```typescript
export const metricsDefinitions = pgTable('metrics_definitions', {
  id: serial('id').primaryKey(),
  metricName: varchar('metric_name', { length: 255 }).notNull().unique(),
  metricCategory: varchar('metric_category', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  calculationMethod: text('calculation_method').notNull(),
  sqlQuery: text('sql_query'),
  dataSources: text('data_sources').array(),
  // ... additional fields for thresholds, targets, chart types
});
```

#### 2. `metricsValues` Table
```typescript
export const metricsValues = pgTable('metrics_values', {
  id: serial('id').primaryKey(),
  metricId: integer('metric_id').references(() => metricsDefinitions.id),
  calculatedAt: timestamp('calculated_at').notNull(),
  value: decimal('value', { precision: 15, scale: 4 }).notNull(),
  valueText: text('value_text'),
  additionalData: jsonb('additional_data'),
  // ... quality and performance tracking fields
});
```

#### 3. Ingestion System Tables
- `ingestionSystems` - Core system information for querying
- `ingestionAssets` - Asset data accessible via NLQ
- `ingestionVulnerabilities` - Vulnerability data for security queries
- `ingestionBatches` - Data ingestion tracking

### Sequelize Models Used

#### 1. `NlQueryHistory` Model (server/models/NlQueryHistory.ts)
- **Purpose:** Stores historical natural language queries for learning and optimization
- **Key Fields:** 
  - Original query text
  - Processed query structure
  - Generated SQL
  - Execution results
  - User context and feedback

#### 2. `QueryTemplate` Model (server/models/QueryTemplate.ts)
- **Purpose:** Predefined query templates for common NLQ patterns
- **Key Fields:**
  - Template patterns
  - Intent mappings
  - Parameter substitution rules
  - Response formatting

#### 3. `Setting` Model
- **Purpose:** Configuration for AI providers and NLQ behavior
- **Usage:** Stores API keys, model preferences, and system settings

---

## II. Database Tables Used

### Primary Tables for NLQ Chat Interface

| Table Name | Purpose | Key Data |
|------------|---------|----------|
| `metrics_definitions` | Metric calculation queries | SQL queries, calculation methods |
| `metrics_values` | Calculated metric results | Historical metric data |
| `ingestion_systems` | System inventory | System names, owners, boundaries |
| `ingestion_assets` | Asset inventory | Hostnames, exposure scores, criticality |
| `ingestion_vulnerabilities` | Vulnerability data | CVE information, severity, remediation |
| `ingestion_batches` | Data ingestion tracking | Batch status, source systems |
| `vulnerability_remediation` | Remediation tracking | Status, assignments, due dates |
| `workflows` | Automated workflows | Workflow definitions and triggers |
| `workflow_executions` | Workflow execution history | Execution status and results |
| `nl_query_history` | Query history | Previous queries and results |
| `query_templates` | Query templates | Predefined query patterns |
| `settings` | System configuration | AI provider settings |

---

## III. Services Layer Implementation

### 1. `NLUnderstandingService` (server/services/nlUnderstandingService.ts)

**Purpose:** Core natural language processing and understanding

**Key Functions:**
- **`parseNaturalLanguageQuery()`**: Converts natural language to structured query format
- **`extractEntities()`**: Identifies entities (assets, systems, metrics) from user input
- **`mapIntentToQuery()`**: Maps user intent to appropriate data queries
- **`applySynonymMapping()`**: Handles domain-specific terminology and synonyms
- **`validateQuerySecurity()`**: Ensures queries are safe and authorized

**CRUD Operations:**
- READ: Entity synonyms, data context, query templates
- CREATE: Parsed query structures, entity mappings

**AI Integration:**
- Uses GPT-4o model for advanced language understanding
- Implements domain-specific security terminology processing

### 2. `QueryProcessorService` (server/services/queryProcessorService.ts)

**Purpose:** Query execution and optimization

**Key Functions:**
- **`processNaturalLanguageQuery()`**: Main processing pipeline for NL queries
- **`generateSQLQuery()`**: Converts parsed queries to SQL
- **`executeSQLQuery()`**: Safely executes generated SQL queries
- **`optimizeQuery()`**: Performance optimization for complex queries
- **`cacheQueryResult()`**: Result caching for frequently asked questions
- **`validateQuery()`**: Security and syntax validation

**CRUD Operations:**
- CREATE: Query execution records, cached results
- READ: Historical query performance, cached results
- UPDATE: Query optimization metadata
- DELETE: Expired cache entries

### 3. `AIClientManager` Service
**Purpose:** Manages AI provider connections and request routing

**Key Functions:**
- **`getOpenAIClient()`**: Returns configured OpenAI client
- **`processAIRequest()`**: Routes requests to appropriate AI provider
- **`validateProviderAvailability()`**: Checks AI service availability

### 4. `BaseService` 
**Purpose:** Common service functionality and database interaction patterns

**Key Functions:**
- **`create()`**: Generic record creation
- **`findOne()`**: Single record retrieval
- **`update()`**: Record modification
- **`findAll()`**: Multiple record retrieval with filtering

---

## IV. API Endpoints

### 1. `/api/ai/process-query` (POST)
**Purpose:** Main endpoint for processing natural language queries

**Request Body:**
```typescript
{
  query: string,          // Natural language query
  context?: object,       // Additional context data
  queryType?: string,     // Query classification
  systemId?: number       // Target system filter
}
```

**Response:**
```typescript
{
  answer: string,         // Human-readable response
  data?: object[],        // Structured data results
  sql?: string,          // Generated SQL (if applicable)
  metadata: {
    processingTime: number,
    dataSource: string,
    confidence: number
  }
}
```

**Functionality:**
- Validates user authentication
- Processes natural language query through NLUnderstandingService
- Executes query via QueryProcessorService
- Returns formatted response with data and metadata

### 2. `/api/nl-query/chat` (POST) - *New Chat Interface*
**Purpose:** Dedicated chat interface endpoint for floating widget

**Request Body:**
```typescript
{
  query: string           // User's chat message/question
}
```

**Response:**
```typescript
{
  answer: string,         // Chat response
  data?: object[],        // Optional structured data
  timestamp: string,      // Response timestamp
  queryId?: string       // Tracking identifier
}
```

**Functionality:**
- Optimized for conversational interface
- Maintains chat context and history
- Provides quick response formatting
- Handles follow-up questions and clarifications

### 3. `/api/ai-provider/config` (GET)
**Purpose:** Retrieves current AI provider configuration

**Response:**
```typescript
{
  provider: string,       // Current AI provider
  available: string[],    // Available providers
  model: string,         // Current model
  features: string[]     // Supported features
}
```

### 4. `/api/dashboard/systems/names` (GET)
**Purpose:** Provides system names for context filtering

**Response:**
```typescript
string[]                // Array of system names
```

**Usage in NLQ:**
- Provides context for system-specific queries
- Enables auto-completion and suggestions
- Used for query validation and scoping

---

## Frontend Implementation

### Floating Chat Widget (`client/src/components/chat/FloatingChatWidget.tsx`)

**Key Features:**
- **Floating Interface:** Bottom-right positioned chat bubble
- **Real-time Messaging:** Instant query processing with loading states
- **Context Awareness:** Maintains conversation history
- **Error Handling:** Graceful error recovery and user feedback
- **Responsive Design:** Mobile and desktop optimized

**State Management:**
- Uses React Query for API communication
- Local state for chat messages and UI control
- Persistent chat history during session

**Integration Points:**
- Embedded in `AppLayout` for global accessibility
- Uses shared UI components (shadcn/ui)
- Connects to existing authentication system

---

## Data Flow Architecture

```
User Input → FloatingChatWidget → /api/nl-query/chat → NLUnderstandingService
    ↓
ParsedQuery → QueryProcessorService → Database Queries → Formatted Response
    ↓
Chat Interface ← API Response ← Result Processing ← Query Execution
```

### Query Processing Pipeline

1. **Input Processing:** User types natural language question
2. **Intent Recognition:** NLUnderstandingService identifies query intent
3. **Entity Extraction:** Identifies relevant systems, assets, metrics
4. **Query Generation:** Converts to appropriate database queries
5. **Execution:** QueryProcessorService executes against data tables
6. **Response Formatting:** Results formatted for chat interface
7. **History Storage:** Query and response stored for learning

### Security Considerations

- **Query Validation:** All generated SQL validated for safety
- **Access Control:** Respects user permissions and system boundaries
- **Data Sanitization:** Input sanitized to prevent injection attacks
- **Audit Logging:** All queries logged for security monitoring

---

## Integration with Existing Systems

### Asset Management Integration
- Queries ingestion tables for real-time asset data
- Provides vulnerability correlation and asset criticality

### Compliance Integration  
- Accesses compliance frameworks and control mappings
- Generates compliance status and gap analysis

### Metrics Integration
- Leverages metrics definitions for KPI queries
- Provides trend analysis and performance insights

### Workflow Integration
- Can trigger workflows based on query results
- Provides workflow status and execution history

---

This comprehensive documentation provides complete understanding of the Natural Language Query chat feature implementation, covering all database interactions, service layers, API endpoints, and frontend components necessary for development and maintenance.