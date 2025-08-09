# Database Integration Analysis: Existing vs Required Tables
## Strategic Table Usage for Bi-Directional Integration

### Executive Summary
Analysis of existing `ingestion_` tables and recommendations for table usage, extensions, and new requirements for bi-directional Tenable/Xacta integration.

---

## Current Table Assessment

### ✅ Tables We Can Reuse (With Extensions)

#### 1. **ingestion_assets** → Core Asset Management
```sql
-- EXISTING: Good foundation for asset tracking
ingestion_assets: {
  ✅ assetUuid (perfect for correlations)
  ✅ hostname, netbiosName (identity matching)
  ✅ systemId (links to systems)
  ✅ exposureScore, acrScore (risk metrics)
  ✅ criticalityRating (business context)
  ✅ rawJson (stores external system data)
  ✅ ingestionSource (tracks data origin)
}

-- EXTENSIONS NEEDED: Add columns for bi-directional tracking
ALTER TABLE ingestion_assets ADD COLUMN:
  tenable_asset_uuid VARCHAR(255),
  xacta_component_id VARCHAR(255),
  external_system_mappings JSONB, -- Multiple external IDs
  business_owner VARCHAR(255),
  technical_owner VARCHAR(255),
  sync_status VARCHAR(50) DEFAULT 'synced',
  last_sync_time TIMESTAMP
```

#### 2. **ingestion_vulnerabilities** → Core Vulnerability Management
```sql
-- EXISTING: Solid vulnerability foundation
ingestion_vulnerabilities: {
  ✅ pluginId (Tenable plugin mapping)
  ✅ vulnerabilityName, severity, cvssScore
  ✅ state (vulnerability status tracking)
  ✅ assetUuid (asset correlation)
  ✅ poamId, controlId (compliance links)
  ✅ rawData (external system data)
}

-- EXTENSIONS NEEDED: Add bi-directional tracking
ALTER TABLE ingestion_vulnerabilities ADD COLUMN:
  tenable_vuln_id VARCHAR(255),
  external_references JSONB, -- CVE, vendor advisories
  remediation_status VARCHAR(50),
  remediation_assigned_to INTEGER REFERENCES users(id),
  remediation_due_date DATE,
  sync_status VARCHAR(50) DEFAULT 'synced',
  last_tenable_update TIMESTAMP
```

#### 3. **ingestion_systems** → System Management
```sql
-- EXISTING: Perfect for Xacta system correlation
ingestion_systems: {
  ✅ systemId, name, uuid (identity fields)
  ✅ systemType, authorizationBoundary
  ✅ systemOwner, informationSystemSecurityOfficer
  ✅ authorizationDate, lastAssessmentDate
  ✅ rawJson (Xacta system data)
}

-- EXTENSIONS NEEDED: Add external system tracking
ALTER TABLE ingestion_systems ADD COLUMN:
  xacta_system_id VARCHAR(255),
  tenable_asset_group_id VARCHAR(255),
  external_system_mappings JSONB,
  sync_enabled BOOLEAN DEFAULT true,
  last_xacta_sync TIMESTAMP
```

#### 4. **ingestion_controls** → Control Management
```sql
-- EXISTING: Good foundation for NIST controls
ingestion_controls: {
  ✅ controlId, controlTitle, family
  ✅ implementationStatus, assessmentStatus
  ✅ systemId (system correlation)
  ✅ responsibleRole, lastAssessed
  ✅ rawJson (Xacta control data)
}

-- EXTENSIONS NEEDED: Add assessment tracking
ALTER TABLE ingestion_controls ADD COLUMN:
  xacta_control_id VARCHAR(255),
  assessment_frequency_months INTEGER,
  next_assessment_date DATE,
  evidence_required TEXT[],
  automation_level VARCHAR(50),
  sync_status VARCHAR(50) DEFAULT 'synced'
```

#### 5. **ingestion_poams** → POAM Management
```sql
-- EXISTING: Comprehensive POAM foundation
ingestion_poams: {
  ✅ poamId, systemId, weaknessDescription
  ✅ scheduledCompletion, status, riskRating
  ✅ All required POAM fields present
  ✅ rawJson (Xacta POAM data)
}

-- EXTENSIONS NEEDED: Add workflow tracking
ALTER TABLE ingestion_poams ADD COLUMN:
  xacta_poam_id VARCHAR(255),
  workflow_status VARCHAR(50),
  milestone_schedule JSONB,
  approval_status VARCHAR(50),
  sync_status VARCHAR(50) DEFAULT 'synced'
```

### ✅ Tables We Can Extend

#### 6. **ingestion_batches** → Integration Operations Tracking
```sql
-- EXISTING: Good foundation for batch processing
-- REUSE FOR: Tracking all integration operations
-- EXTEND WITH: External system operation tracking

ALTER TABLE ingestion_batches ADD COLUMN:
  operation_type VARCHAR(50), -- 'sync', 'export', 'import', 'update'
  external_system VARCHAR(50), -- 'tenable', 'xacta', 'internal'
  parent_operation_id UUID REFERENCES ingestion_batches(batch_id),
  correlation_id UUID,
  api_endpoint VARCHAR(500),
  retry_count INTEGER DEFAULT 0
```

---

## ❌ New Tables Required (Cannot Reuse Existing)

### 1. External System Configuration
```sql
-- NEW: Cannot reuse existing tables
CREATE TABLE external_systems (
  id SERIAL PRIMARY KEY,
  system_name VARCHAR(100) NOT NULL UNIQUE,
  system_type VARCHAR(50) NOT NULL, -- 'tenable', 'xacta'
  api_base_url VARCHAR(500) NOT NULL,
  connection_config JSONB NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Call Logging
```sql
-- NEW: Required for monitoring and debugging
CREATE TABLE api_call_logs (
  id SERIAL PRIMARY KEY,
  external_system_id INTEGER REFERENCES external_systems(id),
  operation_id UUID REFERENCES ingestion_batches(batch_id),
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  response_status INTEGER,
  response_time_ms INTEGER,
  called_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Data Field Mappings
```sql
-- NEW: Essential for data transformation
CREATE TABLE data_field_mappings (
  id SERIAL PRIMARY KEY,
  external_system_id INTEGER REFERENCES external_systems(id),
  entity_type VARCHAR(100) NOT NULL,
  external_field_name VARCHAR(255) NOT NULL,
  internal_field_name VARCHAR(255) NOT NULL,
  transformation_rule JSONB,
  is_required BOOLEAN DEFAULT false
);
```

### 4. Sync Conflicts
```sql
-- NEW: Required for conflict resolution
CREATE TABLE sync_conflicts (
  id SERIAL PRIMARY KEY,
  operation_id UUID REFERENCES ingestion_batches(batch_id),
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  conflict_type VARCHAR(50) NOT NULL,
  internal_value JSONB,
  external_value JSONB,
  resolution_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Enhanced Asset Properties
```sql
-- NEW: Business context not in ingestion_assets
CREATE TABLE assets_extended (
  id SERIAL PRIMARY KEY,
  asset_uuid UUID NOT NULL UNIQUE REFERENCES ingestion_assets(asset_uuid),
  business_criticality VARCHAR(50),
  cost_center VARCHAR(100),
  environment VARCHAR(50),
  compliance_scope TEXT[],
  data_classification VARCHAR(50),
  network_zone VARCHAR(100),
  asset_tags JSONB,
  risk_score DECIMAL(5,2),
  last_risk_assessment TIMESTAMP
);
```

### 6. Vulnerability Intelligence
```sql
-- NEW: Threat intelligence not in ingestion_vulnerabilities
CREATE TABLE vulnerability_intelligence (
  id SERIAL PRIMARY KEY,
  plugin_id VARCHAR(50) NOT NULL UNIQUE,
  cve_ids TEXT[],
  attack_vector VARCHAR(50),
  exploitability_score DECIMAL(3,1),
  exploit_available BOOLEAN DEFAULT false,
  patch_available BOOLEAN DEFAULT false,
  business_impact_score DECIMAL(3,1)
);
```

### 7. Remediation Tracking
```sql
-- NEW: Workflow management not in existing tables
CREATE TABLE vulnerability_remediation (
  id SERIAL PRIMARY KEY,
  vulnerability_id INTEGER REFERENCES ingestion_vulnerabilities(id),
  asset_uuid UUID REFERENCES ingestion_assets(asset_uuid),
  remediation_status VARCHAR(50) NOT NULL,
  assigned_to INTEGER REFERENCES users(id),
  due_date DATE,
  remediation_plan TEXT,
  validation_status VARCHAR(50),
  cost_estimate DECIMAL(10,2),
  effort_estimate_hours INTEGER
);
```

### 8. Analytics Infrastructure
```sql
-- NEW: Business intelligence requirements
CREATE TABLE metrics_definitions (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(255) NOT NULL UNIQUE,
  metric_category VARCHAR(100) NOT NULL,
  calculation_method TEXT NOT NULL,
  sql_query TEXT,
  aggregation_level VARCHAR(50),
  target_value DECIMAL(15,4),
  unit_of_measure VARCHAR(50)
);

CREATE TABLE metrics_values (
  id SERIAL PRIMARY KEY,
  metric_id INTEGER REFERENCES metrics_definitions(id),
  calculated_at TIMESTAMP NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  additional_data JSONB
);
```

### 9. Workflow Automation
```sql
-- NEW: Process automation not covered
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  workflow_name VARCHAR(255) NOT NULL UNIQUE,
  workflow_type VARCHAR(100) NOT NULL,
  trigger_conditions JSONB NOT NULL,
  workflow_steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE workflow_executions (
  id SERIAL PRIMARY KEY,
  execution_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  workflow_id INTEGER REFERENCES workflows(id),
  status VARCHAR(50) DEFAULT 'pending',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

---

## Implementation Strategy

### Phase 1: Extend Existing Tables (Week 1)
```sql
-- Add columns to existing ingestion tables
-- Maintain backward compatibility
-- Enable basic bi-directional sync
ALTER TABLE ingestion_assets ADD COLUMN tenable_asset_uuid VARCHAR(255);
ALTER TABLE ingestion_assets ADD COLUMN sync_status VARCHAR(50) DEFAULT 'synced';
-- ... (all extensions above)
```

### Phase 2: Add Critical New Tables (Week 2)
```sql
-- Add essential new tables for integration
CREATE TABLE external_systems (...);
CREATE TABLE api_call_logs (...);
CREATE TABLE data_field_mappings (...);
CREATE TABLE sync_conflicts (...);
```

### Phase 3: Add Enhancement Tables (Week 3-4)
```sql
-- Add analytics and workflow tables
CREATE TABLE assets_extended (...);
CREATE TABLE vulnerability_intelligence (...);
CREATE TABLE metrics_definitions (...);
CREATE TABLE workflows (...);
```

---

## Data Migration Considerations

### 1. Preserve Existing Data
```sql
-- All extensions use ADD COLUMN with defaults
-- No data loss during migration
-- Maintain existing functionality
```

### 2. Populate New Fields
```sql
-- Gradual population of new fields
-- Use existing rawJson data where possible
-- Sync from external systems to populate mappings
```

### 3. Index Strategy
```sql
-- Add indexes for new foreign keys
CREATE INDEX idx_ingestion_assets_tenable_uuid ON ingestion_assets(tenable_asset_uuid);
CREATE INDEX idx_sync_conflicts_entity ON sync_conflicts(entity_type, entity_id);
-- ... (performance-critical indexes)
```

---

## Summary: Table Usage Decision

### ✅ **REUSE & EXTEND** (5 tables):
- `ingestion_assets` → Core asset management
- `ingestion_vulnerabilities` → Vulnerability tracking  
- `ingestion_systems` → System correlation
- `ingestion_controls` → Control management
- `ingestion_poams` → POAM workflow
- `ingestion_batches` → Operation tracking

### ➕ **ADD NEW** (18 tables):
- External system configuration (3 tables)
- Enhanced business context (2 tables)
- Analytics infrastructure (2 tables)
- Workflow automation (2 tables)
- Security monitoring (3 tables)
- Reporting framework (3 tables)
- Performance monitoring (3 tables)

### 📊 **Total Database Changes**:
- **Extend existing**: 6 tables with new columns
- **Add new**: 18 tables
- **Total new tables**: 18 (reduced from original 58)
- **Estimated storage**: ~200GB annually (reduced footprint)

This approach maximizes reuse of existing infrastructure while adding the necessary capabilities for comprehensive bi-directional integration.