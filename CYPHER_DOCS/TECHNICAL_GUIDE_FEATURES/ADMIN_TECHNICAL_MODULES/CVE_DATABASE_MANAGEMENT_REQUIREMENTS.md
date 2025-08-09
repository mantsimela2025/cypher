# CVE Database Management Requirements Documentation

## Overview

This document provides comprehensive requirements and specifications for the CVE Database Management system within the RAS DASH platform, accessible at `/admin/cve-database`. The system manages Common Vulnerabilities and Exposures (CVE) data through multiple data sources, automated imports, search capabilities, and comprehensive vulnerability analysis.

## System Architecture

### Core Components
- **CVE Service Layer**: Handles CVE data retrieval from NVD API and local database
- **Vulnerability Database Storage**: PostgreSQL-based storage with comprehensive CVE data
- **Import Management**: Automated and manual CVE data import from multiple sources
- **Search Engine**: Advanced CVE search with full-text search capabilities
- **Admin Interface**: Web-based management dashboard for CVE database operations
- **Data Source Management**: Configurable data source switching (Local DB vs NVD API)

## Service Layer Requirements

### CveService (server/services/cveService.ts)

#### Core CVE Methods

**1. `getCveDetails(cveId: string): Promise<LocalCveData | null>`**
- **Purpose**: Fetch detailed information for a specific CVE by ID
- **Parameters**:
  - `cveId`: string - CVE identifier (e.g., CVE-2023-12345)
- **Returns**: Detailed CVE information including CVSS scores, descriptions, references
- **Requirements**:
  - Support both local database and NVD API data sources
  - Automatic data source selection based on user preference
  - Comprehensive error handling for missing CVEs
  - Format consistency between data sources

**2. `searchCves(searchTerm: string, limit: number): Promise<LocalCveData[]>`**
- **Purpose**: Search for CVEs by keyword or criteria
- **Parameters**:
  - `searchTerm`: string - Search term or keyword
  - `limit`: number - Maximum number of results (default: 20)
- **Returns**: Array of matching CVE data
- **Requirements**:
  - Support full-text search across CVE descriptions
  - CVE ID pattern matching
  - Configurable result limits
  - Relevance-based result ordering

**3. `getRecentCves(days: number, limit: number): Promise<LocalCveData[]>`**
- **Purpose**: Retrieve recently published CVEs
- **Parameters**:
  - `days`: number - Number of days to look back (default: 7)
  - `limit`: number - Maximum results (default: 50)
- **Requirements**:
  - Date-based filtering for recent vulnerabilities
  - Support both local and remote data sources
  - Chronological ordering (newest first)

**4. `getCveStats(): Promise<CveStatistics>`**
- **Purpose**: Generate CVE database statistics and metrics
- **Returns**: Object containing:
  - `totalCves`: number - Total CVE count
  - `recentCves`: number - Recent CVEs (last 30 days)
  - `highSeverityCves`: number - High severity CVEs (CVSS >= 7.0)
  - `dataSource`: string - Current data source
- **Requirements**:
  - Real-time statistics calculation
  - Severity-based categorization
  - Data source attribution

**5. `getCurrentCveDataSource(): Promise<'local' | 'nvd'>`** (Private)
- **Purpose**: Retrieve current CVE data source preference
- **Requirements**:
  - Settings-based configuration
  - Fallback to local database if setting unavailable
  - Cache frequently accessed settings

#### Data Source Specific Methods

**6. `getLocalCveDetails(cveId: string): Promise<LocalCveData | null>`** (Private)
- **Purpose**: Fetch CVE details from local PostgreSQL database
- **Requirements**:
  - Direct database query with optimized joins
  - Include related data (CPE mappings, CWE mappings, references)
  - JSON field parsing for complex data structures

**7. `getNvdApiCveDetails(cveId: string): Promise<LocalCveData | null>`** (Private)
- **Purpose**: Fetch CVE details from NVD API
- **Requirements**:
  - REST API integration with error handling
  - Rate limiting compliance
  - Data transformation to local format
  - CVSS score extraction (v2 and v3)

**8. `searchLocalCves(searchTerm: string, limit: number): Promise<LocalCveData[]>`** (Private)
- **Purpose**: Search CVEs in local database
- **Requirements**:
  - PostgreSQL full-text search capabilities
  - ILIKE pattern matching for CVE IDs
  - Efficient indexing for search performance

**9. `searchNvdCves(searchTerm: string, limit: number): Promise<LocalCveData[]>`** (Private)
- **Purpose**: Search CVEs via NVD API
- **Requirements**:
  - API parameter encoding
  - Pagination support
  - Response transformation to local format

### VulnerabilityDatabaseStorage (server/pgStorage/vulnerabilityDatabaseStorage.ts)

#### Advanced Search Methods

**1. `searchCves(params: CveSearchParams): Promise<Cve[]>`**
- **Purpose**: Advanced CVE search with multiple criteria
- **Parameters**:
  - `cveId?`: string - CVE ID filter
  - `keyword?`: string - Keyword search
  - `minCvss?`: number - Minimum CVSS score
  - `maxCvss?`: number - Maximum CVSS score
  - `year?`: number - Publication year filter
  - `exploitAvailable?`: boolean - Exploit availability filter
  - `patchAvailable?`: boolean - Patch availability filter
  - `vendorName?`: string - Vendor name filter
  - `productName?`: string - Product name filter
  - `limit?`: number - Result limit (default: 100)
  - `offset?`: number - Result offset (default: 0)
- **Requirements**:
  - Dynamic query building based on provided parameters
  - Efficient JOIN operations with related tables
  - Full-text search integration
  - Proper indexing for performance

**2. `getCveWithRelations(cveId: string): Promise<CveWithRelations | null>`**
- **Purpose**: Retrieve CVE with all related data
- **Returns**: CVE with CPE mappings, CWE mappings, and references
- **Requirements**:
  - Single query with multiple JOINs
  - Complete data retrieval including all relationships
  - Proper error handling for missing CVEs

**3. `findVulnerabilitiesForProduct(vendor: string, product: string): Promise<Cve[]>`**
- **Purpose**: Find CVEs affecting specific vendor/product combinations
- **Requirements**:
  - CPE mapping table integration
  - Vendor and product name matching
  - Version-aware vulnerability matching

**4. `getCveStatistics(): Promise<CveStatistics>`**
- **Purpose**: Generate comprehensive CVE database statistics
- **Requirements**:
  - Aggregate queries for counts and distributions
  - Year-based categorization
  - Severity-based grouping
  - Performance optimization for large datasets

**5. `getImportHistory(limit?: number): Promise<ImportHistory[]>`**
- **Purpose**: Retrieve CVE import operation history
- **Requirements**:
  - Chronological ordering (newest first)
  - Import status tracking
  - Metrics and error information

**6. `syncCveInfoToVulnerabilities(): Promise<SyncResult>`**
- **Purpose**: Synchronize CVE database with main vulnerabilities table
- **Requirements**:
  - Data consistency maintenance
  - Bulk update operations
  - Change tracking and logging

## Controller Requirements

### CVE Database Controllers

**Route Protection:**
- All CVE database endpoints require admin authentication
- Implement role-based access control
- Rate limiting for API endpoints

**Core Handlers:**
- `getCveStatistics` - Handler for GET `/api/cve-database/statistics`
- `getCveDetails` - Handler for GET `/api/cve-database/cve/:id`
- `searchCves` - Handler for GET `/api/cve-database/search`
- `importCveData` - Handler for POST `/api/cve-database/import`
- `getImportHistory` - Handler for GET `/api/cve-database/import-history`
- `scheduleImport` - Handler for POST `/api/cve-database/schedule`
- `getScheduledImports` - Handler for GET `/api/cve-database/schedule`

**Settings Handlers:**
- `getCveDataSource` - Handler for GET `/api/cve-settings/data-source`
- `updateCveDataSource` - Handler for POST `/api/cve-settings/data-source`

**Requirements:**
- Comprehensive input validation
- Error handling with appropriate HTTP status codes
- Audit logging for all operations
- Request/response caching where appropriate

## API Route Requirements

### CVE Database Routes

**GET `/api/cve-database/statistics`**
- Retrieve comprehensive CVE database statistics
- Response includes:
  - Total CVE count
  - Recent CVEs (last 30 days)
  - CVEs by severity level
  - CVEs by publication year
  - Last import information
  - Next scheduled import details

**GET `/api/cve-database/cve/:id`**
- Fetch detailed information for specific CVE
- Support both CVE-YYYY-NNNNN and simplified formats
- Include related data (CPE, CWE, references, exploits, patches)

**GET `/api/cve-database/search`**
- Advanced CVE search with query parameters:
  - `q`: keyword search
  - `cveId`: CVE ID filter
  - `minCvss`: minimum CVSS score
  - `maxCvss`: maximum CVSS score
  - `year`: publication year
  - `exploitAvailable`: exploit availability
  - `patchAvailable`: patch availability
  - `vendor`: vendor name
  - `product`: product name
  - `limit`: result limit
  - `offset`: pagination offset

**POST `/api/cve-database/import`**
- Initiate manual CVE data import
- Support multiple import sources:
  - `nvd`: National Vulnerability Database
  - `mitre`: MITRE CVE database
  - `upload`: File upload
  - `url`: Remote URL
- Request body parameters:
  - `source`: import source type
  - `year`: year filter (for NVD)
  - `url`: source URL (for URL imports)
  - `overwrite`: overwrite existing entries

**GET `/api/cve-database/import-history`**
- Retrieve import operation history
- Support pagination and filtering
- Include import metrics and status

**POST `/api/cve-database/schedule`**
- Schedule automated CVE imports
- Support recurring schedules (daily, weekly, monthly)
- Request body:
  - `source`: data source
  - `frequency`: schedule frequency
  - `time`: execution time

**GET `/api/cve-database/schedule`**
- List scheduled import jobs
- Include next run times and last execution status

### CVE Settings Routes

**GET `/api/cve-settings/data-source`**
- Retrieve current CVE data source preference
- Return 'local' or 'nvd' setting

**POST `/api/cve-settings/data-source`**
- Update CVE data source preference
- Request body: `{ "dataSource": "local" | "nvd" }`

## Database Schema Requirements

### Core CVE Tables (vulnerability_database schema)

#### 1. cves Table

**Purpose**: Core CVE information storage

**PostgreSQL Schema:**
```sql
CREATE TABLE vulnerability_database.cves (
    id INTEGER NOT NULL DEFAULT nextval('vulnerability_database.cves_id_seq'::regclass),
    cve_id VARCHAR(20) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    published_date TIMESTAMP,
    last_modified_date TIMESTAMP,
    cvss2_base_score DECIMAL(3,1),
    cvss2_vector VARCHAR(100),
    cvss3_base_score DECIMAL(3,1),
    cvss3_vector VARCHAR(100),
    exploit_available BOOLEAN DEFAULT FALSE,
    patch_available BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) DEFAULT 'NVD',
    remediation_guidance TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    search_vector TSVECTOR
);
```

**Indexes:**
- `PRIMARY KEY (id)`
- `UNIQUE INDEX ON cve_id`
- `INDEX ON cvss3_base_score`
- `INDEX ON published_date`
- `GIN INDEX ON search_vector` (for full-text search)

#### 2. cpe_mappings Table

**Purpose**: Common Platform Enumeration mappings for CVEs

**PostgreSQL Schema:**
```sql
CREATE TABLE vulnerability_database.cpe_mappings (
    id INTEGER NOT NULL DEFAULT nextval('vulnerability_database.cpe_mappings_id_seq'::regclass),
    cve_id VARCHAR(20) NOT NULL,
    cpe23_uri TEXT NOT NULL,
    vulnerable_version_range TEXT,
    product_name VARCHAR(255),
    vendor VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (cve_id) REFERENCES vulnerability_database.cves(cve_id) ON DELETE CASCADE
);
```

#### 3. cwe_mappings Table

**Purpose**: Common Weakness Enumeration mappings

**PostgreSQL Schema:**
```sql
CREATE TABLE vulnerability_database.cwe_mappings (
    id INTEGER NOT NULL DEFAULT nextval('vulnerability_database.cwe_mappings_id_seq'::regclass),
    cve_id VARCHAR(20) NOT NULL,
    cwe_id VARCHAR(20) NOT NULL,
    cwe_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (cve_id) REFERENCES vulnerability_database.cves(cve_id) ON DELETE CASCADE
);
```

#### 4. references Table

**Purpose**: CVE reference links and sources

**PostgreSQL Schema:**
```sql
CREATE TABLE vulnerability_database.references (
    id INTEGER NOT NULL DEFAULT nextval('vulnerability_database.references_id_seq'::regclass),
    cve_id VARCHAR(20) NOT NULL,
    url TEXT NOT NULL,
    source VARCHAR(255),
    tags TEXT[],
    reference_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (cve_id) REFERENCES vulnerability_database.cves(cve_id) ON DELETE CASCADE
);
```

#### 5. exploits Table

**Purpose**: Exploit information and availability tracking

**PostgreSQL Schema:**
```sql
CREATE TABLE vulnerability_database.exploits (
    id INTEGER NOT NULL DEFAULT nextval('vulnerability_database.exploits_id_seq'::regclass),
    cve_id VARCHAR(20) NOT NULL,
    exploit_source VARCHAR(100),
    exploit_url TEXT,
    exploit_type VARCHAR(50),
    maturity_level VARCHAR(50),
    discovery_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (cve_id) REFERENCES vulnerability_database.cves(cve_id) ON DELETE CASCADE
);
```

#### 6. vuln_patches Table

**Purpose**: Patch and remediation information

**PostgreSQL Schema:**
```sql
CREATE TABLE vulnerability_database.vuln_patches (
    id INTEGER NOT NULL DEFAULT nextval('vulnerability_database.vuln_patches_id_seq'::regclass),
    cve_id VARCHAR(20) NOT NULL,
    vendor VARCHAR(255),
    product VARCHAR(255),
    version_affected VARCHAR(255),
    patch_version VARCHAR(255),
    patch_url TEXT,
    release_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (cve_id) REFERENCES vulnerability_database.cves(cve_id) ON DELETE CASCADE
);
```

#### 7. import_history Table

**Purpose**: CVE data import operation tracking

**PostgreSQL Schema:**
```sql
CREATE TABLE vulnerability_database.import_history (
    id INTEGER NOT NULL DEFAULT nextval('vulnerability_database.import_history_id_seq'::regclass),
    import_source VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    cves_added INTEGER DEFAULT 0,
    cves_updated INTEGER DEFAULT 0,
    cves_failed INTEGER DEFAULT 0,
    error_message TEXT,
    file_sizes INTEGER[],
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Drizzle ORM Integration

### Complete Schema Implementation

**File Structure:**
```
shared/
├── vulnerability-database-schema.ts    # Complete CVE database schemas
└── cve-schema.ts                      # Combined export file
```

### Vulnerability Database Schema (shared/vulnerability-database-schema.ts)

**Current Basic Implementation:**
```typescript
// Vulnerability database schema
import { pgTable, serial, varchar, text, decimal, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';

export const vulnerabilityDatabase = pgTable('vulnerability_database', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).unique(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  severity: varchar('severity', { length: 20 }),
  cvssScore: decimal('cvss_score', { precision: 3, scale: 1 }),
  cvssVector: varchar('cvss_vector', { length: 200 }),
  publishedDate: timestamp('published_date'),
  lastModified: timestamp('last_modified'),
  references: jsonb('references'),
  affectedProducts: jsonb('affected_products'),
  patchAvailable: boolean('patch_available').default(false),
  exploitAvailable: boolean('exploit_available').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type VulnerabilityDatabase = typeof vulnerabilityDatabase.$inferSelect;
export type InsertVulnerabilityDatabase = typeof vulnerabilityDatabase.$inferInsert;
```

**Enhanced Implementation Required:**
```typescript
// File: shared/vulnerability-database-schema.ts
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  decimal, 
  timestamp, 
  boolean,
  index,
  uniqueIndex,
  foreignKey
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

// CVEs table
export const cves = pgTable('cves', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull().unique(),
  description: text('description').notNull(),
  publishedDate: timestamp('published_date'),
  lastModifiedDate: timestamp('last_modified_date'),
  cvss2BaseScore: decimal('cvss2_base_score', { precision: 3, scale: 1 }),
  cvss2Vector: varchar('cvss2_vector', { length: 100 }),
  cvss3BaseScore: decimal('cvss3_base_score', { precision: 3, scale: 1 }),
  cvss3Vector: varchar('cvss3_vector', { length: 100 }),
  exploitAvailable: boolean('exploit_available').default(false),
  patchAvailable: boolean('patch_available').default(false),
  source: varchar('source', { length: 50 }).default('NVD'),
  remediationGuidance: text('remediation_guidance'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  searchVector: text('search_vector') // TSVECTOR in PostgreSQL
}, (table) => ({
  cveIdIdx: uniqueIndex('cves_cve_id_idx').on(table.cveId),
  cvss3ScoreIdx: index('cves_cvss3_score_idx').on(table.cvss3BaseScore),
  publishedDateIdx: index('cves_published_date_idx').on(table.publishedDate),
  searchVectorIdx: index('cves_search_vector_idx').using('gin', sql`${table.searchVector}`)
}), { schema: 'vulnerability_database' });

// CPE Mappings table
export const cpeMappings = pgTable('cpe_mappings', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  cpe23Uri: text('cpe23_uri').notNull(),
  vulnerableVersionRange: text('vulnerable_version_range'),
  productName: varchar('product_name', { length: 255 }),
  vendor: varchar('vendor', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  cveIdIdx: index('cpe_mappings_cve_id_idx').on(table.cveId),
  productIdx: index('cpe_mappings_product_idx').on(table.productName),
  vendorIdx: index('cpe_mappings_vendor_idx').on(table.vendor),
  cveIdFk: foreignKey({
    columns: [table.cveId],
    foreignColumns: [cves.cveId],
    name: 'cpe_mappings_cve_id_fk'
  }).onDelete('cascade')
}), { schema: 'vulnerability_database' });

// CWE Mappings table
export const cweMappings = pgTable('cwe_mappings', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  cweId: varchar('cwe_id', { length: 20 }).notNull(),
  cweName: varchar('cwe_name', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  cveIdIdx: index('cwe_mappings_cve_id_idx').on(table.cveId),
  cweIdIdx: index('cwe_mappings_cwe_id_idx').on(table.cweId),
  cveIdFk: foreignKey({
    columns: [table.cveId],
    foreignColumns: [cves.cveId],
    name: 'cwe_mappings_cve_id_fk'
  }).onDelete('cascade')
}), { schema: 'vulnerability_database' });

// References table
export const cveReferences = pgTable('references', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  url: text('url').notNull(),
  source: varchar('source', { length: 255 }),
  tags: text('tags').array(),
  referenceType: varchar('reference_type', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  cveIdIdx: index('references_cve_id_idx').on(table.cveId),
  sourceIdx: index('references_source_idx').on(table.source),
  cveIdFk: foreignKey({
    columns: [table.cveId],
    foreignColumns: [cves.cveId],
    name: 'references_cve_id_fk'  
  }).onDelete('cascade')
}), { schema: 'vulnerability_database' });

// Exploits table
export const exploits = pgTable('exploits', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  exploitSource: varchar('exploit_source', { length: 100 }),
  exploitUrl: text('exploit_url'),
  exploitType: varchar('exploit_type', { length: 50 }),
  maturityLevel: varchar('maturity_level', { length: 50 }),
  discoveryDate: timestamp('discovery_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  cveIdIdx: index('exploits_cve_id_idx').on(table.cveId),
  typeIdx: index('exploits_type_idx').on(table.exploitType),
  cveIdFk: foreignKey({
    columns: [table.cveId],
    foreignColumns: [cves.cveId],
    name: 'exploits_cve_id_fk'
  }).onDelete('cascade')
}), { schema: 'vulnerability_database' });

// Patches table
export const vulnPatches = pgTable('vuln_patches', {
  id: serial('id').primaryKey(),
  cveId: varchar('cve_id', { length: 20 }).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  product: varchar('product', { length: 255 }),
  versionAffected: varchar('version_affected', { length: 255 }),
  patchVersion: varchar('patch_version', { length: 255 }),
  patchUrl: text('patch_url'),
  releaseDate: timestamp('release_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  cveIdIdx: index('vuln_patches_cve_id_idx').on(table.cveId),
  vendorIdx: index('vuln_patches_vendor_idx').on(table.vendor),
  productIdx: index('vuln_patches_product_idx').on(table.product),
  cveIdFk: foreignKey({
    columns: [table.cveId],
    foreignColumns: [cves.cveId],
    name: 'vuln_patches_cve_id_fk'
  }).onDelete('cascade')
}), { schema: 'vulnerability_database' });

// Import History table
export const importHistory = pgTable('import_history', {
  id: serial('id').primaryKey(),
  importSource: varchar('import_source', { length: 100 }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  status: varchar('status', { length: 20 }).notNull(),
  cvesAdded: serial('cves_added').default(0),
  cvesUpdated: serial('cves_updated').default(0),
  cvesFailed: serial('cves_failed').default(0),
  errorMessage: text('error_message'),
  fileSizes: serial('file_sizes').array(),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  statusIdx: index('import_history_status_idx').on(table.status),
  startTimeIdx: index('import_history_start_time_idx').on(table.startTime),
  sourceIdx: index('import_history_source_idx').on(table.importSource)
}), { schema: 'vulnerability_database' });

// Validation schemas
export const cveSourceEnum = z.enum(['NVD', 'MITRE', 'MANUAL', 'API']);
export const importStatusEnum = z.enum(['pending', 'running', 'completed', 'failed']);
export const severityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const insertCveSchema = createInsertSchema(cves, {
  cveId: z.string().regex(/^CVE-\d{4}-\d{4,}$/),
  description: z.string().min(1),
  cvss2BaseScore: z.number().min(0).max(10).optional(),
  cvss3BaseScore: z.number().min(0).max(10).optional(),
  source: cveSourceEnum.default('NVD'),
  exploitAvailable: z.boolean().default(false),
  patchAvailable: z.boolean().default(false)
});

export const selectCveSchema = createSelectSchema(cves);

// Type definitions
export type Cve = typeof cves.$inferSelect;
export type InsertCve = typeof cves.$inferInsert;
export type CpeMapping = typeof cpeMappings.$inferSelect;
export type InsertCpeMapping = typeof cpeMappings.$inferInsert;
export type CweMapping = typeof cweMappings.$inferSelect;
export type InsertCweMapping = typeof cweMappings.$inferInsert;
export type CveReference = typeof cveReferences.$inferSelect;
export type InsertCveReference = typeof cveReferences.$inferInsert;
export type Exploit = typeof exploits.$inferSelect;
export type InsertExploit = typeof exploits.$inferInsert;
export type VulnPatch = typeof vulnPatches.$inferSelect;
export type InsertVulnPatch = typeof vulnPatches.$inferInsert;
export type ImportHistory = typeof importHistory.$inferSelect;
export type InsertImportHistory = typeof importHistory.$inferInsert;

// Extended interfaces
export interface CveWithRelations extends Cve {
  cpeMappings: CpeMapping[];
  cweMappings: CweMapping[];
  references: CveReference[];
  exploits?: Exploit[];
  patches?: VulnPatch[];
}

export interface CveSearchParams {
  cveId?: string;
  keyword?: string;
  minCvss?: number;
  maxCvss?: number;
  year?: number;
  exploitAvailable?: boolean;
  patchAvailable?: boolean;
  vendorName?: string;
  productName?: string;
  limit?: number;
  offset?: number;
}

export interface CveStatistics {
  totalCves: number;
  recentCves: number;
  highSeverityCves: number;
  dataSource: string;
  lastUpdated?: Date;
  cvesByYear: Array<{ year: number; count: number }>;
  cvesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// Validated insert types
export type ValidatedInsertCve = z.infer<typeof insertCveSchema>;
```

## User Interface Requirements

### CVE Database Dashboard (/admin/cve-database)

**Layout Requirements:**
- Tabbed interface with four main sections
- Real-time statistics display
- Responsive design for desktop and mobile
- Professional admin interface styling

### Tab 1: Database Overview

**Features Required:**
- Real-time CVE database statistics
- Data source selection (Local DB vs NVD API)
- Quick action buttons for import and search operations
- Last import status and next scheduled import display
- CVE distribution charts (by year, severity, etc.)

**Statistics Display:**
- Total CVE count with growth indicator
- Recent CVEs (last 30 days) with trend
- High severity CVEs (CVSS >= 7.0) with percentage
- Data source indicator with switching capability
- Database health status

### Tab 2: Import Management

**Features Required:**
- Manual import initiation with source selection
- Import history display with status tracking
- Progress monitoring for ongoing imports
- Import scheduling interface
- Source configuration (NVD, MITRE, file upload, URL)

**Import Sources:**
- NVD (National Vulnerability Database)
- MITRE CVE database
- File upload (JSON, XML, CSV formats)
- Remote URL import
- Bulk import with year filtering

**Import Options:**
- Year-based filtering for NVD imports
- Overwrite existing entries option
- Incremental vs full import
- Error handling and retry policies

### Tab 3: Search & Browse

**Features Required:**
- Advanced search interface with multiple criteria
- Real-time search results with pagination
- CVE detail view with comprehensive information
- Export capabilities for search results
- Saved search functionality

**Search Criteria:**
- CVE ID pattern matching
- Keyword search across descriptions
- CVSS score range filtering
- Publication date range
- Exploit availability filter
- Patch availability filter
- Vendor/product filtering
- Severity level filtering

### Tab 4: Maintenance

**Features Required:**
- Database maintenance operations
- Index rebuilding and optimization
- Data consistency checks
- Cleanup operations for old data
- Backup and restore functionality
- Performance monitoring

**Maintenance Operations:**
- Full-text search index rebuilding
- Database vacuum and analyze
- Orphaned record cleanup
- Statistics refresh
- Cache clearing operations

## Integration Requirements

### External Service Integration

**National Vulnerability Database (NVD) API:**
- RESTful API integration with rate limiting
- CVE data retrieval and synchronization
- Automated import scheduling
- Error handling and retry logic

**MITRE CVE Database:**
- Alternative data source integration
- CVE format standardization
- Cross-reference validation

**File Import Support:**
- JSON format parsing
- XML format support
- CSV import with field mapping
- Batch processing capabilities

### System Integration

**Asset Management Integration:**
- CVE-to-asset mapping via CPE
- Vulnerability impact assessment
- Asset-specific CVE filtering

**Vulnerability Scanner Integration:**
- Scanner result correlation with CVE database
- Automated vulnerability enrichment
- Risk score calculation enhancement

**Reporting System Integration:**
- CVE data inclusion in security reports
- Trend analysis and metrics
- Compliance reporting support

## Security Requirements

### Data Protection

**CVE Data Integrity:**
- Cryptographic verification of imported data
- Data source attribution tracking
- Change audit logging
- Backup and recovery procedures

**Access Control:**
- Admin-only access to CVE management
- Role-based operation permissions
- API endpoint authentication
- Audit trail for all operations

### Configuration Security

**Import Source Validation:**
- URL validation for remote imports
- File type and size restrictions
- Malware scanning for uploaded files
- Secure temporary file handling

**API Security:**
- Rate limiting for external API calls
- Secure credential management
- Request/response logging
- Error message sanitization

## Performance Requirements

### Scalability

**Database Performance:**
- Efficient indexing for large CVE datasets
- Query optimization for search operations
- Partition strategies for historical data
- Connection pooling and management

**Import Performance:**
- Bulk insert optimization
- Parallel processing for large imports
- Progress tracking and resumption
- Memory management for large files

### Reliability

**Service Availability:**
- Graceful handling of external API failures
- Fallback to alternative data sources
- Import operation recovery
- Monitoring and alerting

**Data Consistency:**
- Transaction management for imports
- Referential integrity maintenance
- Conflict resolution for duplicate data
- Consistency checks and repairs

## Monitoring and Analytics

### CVE Metrics

**Database Analytics:**
- CVE growth trends over time
- Severity distribution analysis
- Vendor/product vulnerability patterns
- Import success rates and timing

**Usage Statistics:**
- Search query patterns
- Most accessed CVEs
- Data source utilization
- User activity tracking

### System Health

**Performance Monitoring:**
- Database query performance
- Import operation timing
- Search response times
- Memory and storage utilization

**Alerting:**
- Failed import notifications
- Database performance alerts
- Data consistency warnings
- Security incident detection

This comprehensive requirements document provides the complete specification for implementing and maintaining the CVE Database Management system within the RAS DASH platform.