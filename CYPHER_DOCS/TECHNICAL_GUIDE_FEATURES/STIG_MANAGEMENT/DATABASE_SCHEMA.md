# STIG Management Database Schema

## Overview

The STIG Management system uses 7 core PostgreSQL tables to manage STIG mappings, collections, assets, assignments, rules, reviews, and downloads. This document provides complete DDL statements and relationship definitions.

## Table Relationships

```
stigMappings (1) ────────────────────── (M) stigAssetAssignments
                                                    │
stigCollections (1) ── (M) stigAssets (1) ─────────┘
                                │
                                └── (M) stigReviews
                                            │
stigRules (1) ──────────────────────────────┘

stigDownloads (standalone table for STIG file management)
```

## Core Tables

### 1. stig_mappings
**Purpose**: Master catalog of STIGs and their applicability rules

```sql
CREATE TABLE stig_mappings (
  id SERIAL PRIMARY KEY,
  operating_system VARCHAR(255),           -- Target OS (Windows 10, Ubuntu 20.04, etc.)
  os_version VARCHAR(100),                 -- Specific OS version constraint
  application_name VARCHAR(255),           -- Target application (Apache, IIS, SQL Server)
  application_version VARCHAR(100),        -- Specific application version
  system_type VARCHAR(100),                -- System classification (server, workstation, etc.)
  stig_id VARCHAR(100) NOT NULL,           -- Official STIG identifier
  stig_title VARCHAR(500) NOT NULL,        -- Human-readable STIG title
  stig_version VARCHAR(50),                -- STIG release version
  priority INTEGER DEFAULT 1,              -- Assignment priority (1=highest, 3=lowest)
  download_url VARCHAR(1000),              -- Official download location
  file_type VARCHAR(20) DEFAULT 'zip',     -- File format (zip, xml, etc.)
  confidence_score INTEGER DEFAULT 100,    -- Mapping confidence (0-100)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stig_mappings_os ON stig_mappings(operating_system);
CREATE INDEX idx_stig_mappings_app ON stig_mappings(application_name);
CREATE INDEX idx_stig_mappings_priority ON stig_mappings(priority);
```

**Sample Data**:
```sql
INSERT INTO stig_mappings (operating_system, stig_id, stig_title, priority, confidence_score) VALUES
('Windows 10', 'WN10-00-000001', 'Microsoft Windows 10 STIG', 1, 100),
('Windows Server 2019', 'WN19-00-000001', 'Microsoft Windows Server 2019 STIG', 1, 100),
('Ubuntu 20.04', 'UBTU-20-000001', 'Canonical Ubuntu 20.04 LTS STIG', 1, 100);
```

### 2. stig_collections
**Purpose**: Logical groupings of assets for compliance management

```sql
CREATE TABLE stig_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,              -- Collection display name
  description TEXT,                        -- Purpose and scope description
  created_by VARCHAR(100),                 -- Creator username/ID
  is_active BOOLEAN DEFAULT true,          -- Active status flag
  settings JSONB,                          -- Collection-specific configurations
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stig_collections_active ON stig_collections(is_active);
CREATE INDEX idx_stig_collections_created_by ON stig_collections(created_by);
```

**Sample Data**:
```sql
INSERT INTO stig_collections (name, description, created_by) VALUES
('Production Web Servers', 'Web application servers in production environment', 'admin'),
('Database Infrastructure', 'All database servers requiring STIG compliance', 'dba_team'),
('Development Environment', 'Non-production systems for testing STIG implementations', 'dev_team');
```

### 3. stig_assets
**Purpose**: Assets managed within STIG collections

```sql
CREATE TABLE stig_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES stig_collections(id) ON DELETE CASCADE,
  asset_id INTEGER,                        -- Reference to main assets table
  name VARCHAR(255) NOT NULL,              -- Asset display name
  hostname VARCHAR(255),                   -- Network hostname
  ip_address VARCHAR(45),                  -- IPv4/IPv6 address
  operating_system VARCHAR(255),           -- Detected OS
  os_version VARCHAR(100),                 -- OS version/build
  asset_type VARCHAR(100),                 -- server, workstation, network_device
  system_role VARCHAR(100),                -- web_server, database, domain_controller
  environment VARCHAR(50),                 -- production, staging, development
  criticality VARCHAR(20),                 -- critical, high, medium, low
  labels JSONB,                           -- Array of tags/labels
  metadata JSONB,                         -- Additional asset information
  last_scan TIMESTAMP,                    -- Last compliance scan timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stig_assets_collection ON stig_assets(collection_id);
CREATE INDEX idx_stig_assets_hostname ON stig_assets(hostname);
CREATE INDEX idx_stig_assets_os ON stig_assets(operating_system);
CREATE INDEX idx_stig_assets_environment ON stig_assets(environment);
```

### 4. stig_asset_assignments
**Purpose**: Tracks which STIGs are assigned to which assets

```sql
CREATE TABLE stig_asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES stig_assets(id) ON DELETE CASCADE,
  mapping_id INTEGER REFERENCES stig_mappings(id) ON DELETE CASCADE,
  assigned_by VARCHAR(100),                -- Username who made assignment
  assignment_reason TEXT,                  -- Why this STIG was assigned
  confidence_score INTEGER DEFAULT 100,    -- Assignment confidence (0-100)
  status VARCHAR(50) DEFAULT 'assigned',   -- assigned, in_progress, completed, not_applicable
  assigned_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT,                             -- Assignment-specific notes
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stig_assignments_asset ON stig_asset_assignments(asset_id);
CREATE INDEX idx_stig_assignments_mapping ON stig_asset_assignments(mapping_id);
CREATE INDEX idx_stig_assignments_status ON stig_asset_assignments(status);

-- Prevent duplicate assignments
CREATE UNIQUE INDEX idx_stig_assignments_unique ON stig_asset_assignments(asset_id, mapping_id);
```

### 5. stig_rules
**Purpose**: Individual STIG rules/controls within a STIG document

```sql
CREATE TABLE stig_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stig_id VARCHAR(100) NOT NULL,           -- Parent STIG identifier
  rule_id VARCHAR(100) NOT NULL,           -- Individual rule identifier (V-xxxxx)
  rule_title VARCHAR(500) NOT NULL,        -- Rule description
  severity VARCHAR(20),                    -- critical, high, medium, low
  rule_text TEXT,                         -- Full rule requirements
  check_text TEXT,                        -- How to verify compliance
  fix_text TEXT,                          -- How to remediate
  cci_controls TEXT[],                    -- Array of CCI control references
  nist_controls TEXT[],                   -- Array of NIST 800-53 controls
  rule_version VARCHAR(50),               -- Rule version
  stigma_id VARCHAR(100),                 -- STIGMA database reference
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stig_rules_stig_id ON stig_rules(stig_id);
CREATE INDEX idx_stig_rules_severity ON stig_rules(severity);
CREATE INDEX idx_stig_rules_rule_id ON stig_rules(rule_id);

-- Ensure unique rules per STIG
CREATE UNIQUE INDEX idx_stig_rules_unique ON stig_rules(stig_id, rule_id);
```

### 6. stig_reviews
**Purpose**: Track compliance review status for individual rules

```sql
CREATE TABLE stig_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES stig_asset_assignments(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES stig_rules(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_reviewed', -- not_reviewed, open, not_applicable, not_a_finding
  reviewer VARCHAR(100),                   -- Username who performed review
  review_date TIMESTAMP,                  -- When review was completed
  finding_details TEXT,                   -- Details of any findings
  remediation_notes TEXT,                 -- Remediation actions taken
  expected_completion TIMESTAMP,          -- Target remediation date
  supporting_evidence JSONB,              -- Evidence files, screenshots, etc.
  comments TEXT,                          -- Additional reviewer comments
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stig_reviews_assignment ON stig_reviews(assignment_id);
CREATE INDEX idx_stig_reviews_rule ON stig_reviews(rule_id);
CREATE INDEX idx_stig_reviews_status ON stig_reviews(status);
CREATE INDEX idx_stig_reviews_reviewer ON stig_reviews(reviewer);

-- Prevent duplicate reviews
CREATE UNIQUE INDEX idx_stig_reviews_unique ON stig_reviews(assignment_id, rule_id);
```

### 7. stig_downloads
**Purpose**: Manage STIG file downloads and caching

```sql
CREATE TABLE stig_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stig_id VARCHAR(100) NOT NULL,           -- STIG identifier
  stig_title VARCHAR(500) NOT NULL,        -- STIG title
  version VARCHAR(50),                     -- STIG version
  release_date TIMESTAMP,                 -- Official release date
  download_url VARCHAR(1000),             -- Source download URL
  local_path VARCHAR(500),                -- Local file storage path
  file_size INTEGER,                      -- File size in bytes
  download_status VARCHAR(50) DEFAULT 'pending', -- pending, downloading, completed, failed
  downloaded_at TIMESTAMP,               -- Download completion timestamp
  last_checked TIMESTAMP,                -- Last availability check
  checksum VARCHAR(64),                  -- File integrity hash
  metadata JSONB,                        -- Additional STIG metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_stig_downloads_stig_id ON stig_downloads(stig_id);
CREATE INDEX idx_stig_downloads_status ON stig_downloads(download_status);
CREATE INDEX idx_stig_downloads_release_date ON stig_downloads(release_date);
```

## Database Views

### Collection Summary View
```sql
CREATE VIEW v_collection_summary AS
SELECT 
  c.id,
  c.name,
  c.description,
  COUNT(DISTINCT a.id) as asset_count,
  COUNT(DISTINCT aa.id) as assignment_count,
  COUNT(DISTINCT CASE WHEN r.status = 'not_a_finding' THEN r.id END) as compliant_reviews,
  COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) as open_findings,
  c.created_at,
  c.updated_at
FROM stig_collections c
LEFT JOIN stig_assets a ON c.id = a.collection_id
LEFT JOIN stig_asset_assignments aa ON a.id = aa.asset_id
LEFT JOIN stig_reviews r ON aa.id = r.assignment_id
WHERE c.is_active = true
GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at;
```

### Asset Compliance View
```sql
CREATE VIEW v_asset_compliance AS
SELECT 
  a.id,
  a.name,
  a.hostname,
  a.operating_system,
  a.environment,
  a.criticality,
  COUNT(DISTINCT aa.id) as total_assignments,
  COUNT(DISTINCT CASE WHEN r.status = 'not_a_finding' THEN r.id END) as compliant_count,
  COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) as finding_count,
  COUNT(DISTINCT CASE WHEN r.status = 'not_reviewed' THEN r.id END) as pending_count,
  ROUND(
    (COUNT(DISTINCT CASE WHEN r.status = 'not_a_finding' THEN r.id END) * 100.0) / 
    NULLIF(COUNT(DISTINCT r.id), 0), 2
  ) as compliance_percentage
FROM stig_assets a
LEFT JOIN stig_asset_assignments aa ON a.id = aa.asset_id
LEFT JOIN stig_reviews r ON aa.id = r.assignment_id
GROUP BY a.id, a.name, a.hostname, a.operating_system, a.environment, a.criticality;
```

## Database Functions

### Automatic STIG Assignment Function
```sql
CREATE OR REPLACE FUNCTION assign_stigs_to_asset(asset_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  asset_record RECORD;
  mapping_record RECORD;
  assignment_count INTEGER := 0;
BEGIN
  -- Get asset details
  SELECT * INTO asset_record FROM stig_assets WHERE id = asset_uuid;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Find applicable STIG mappings
  FOR mapping_record IN 
    SELECT * FROM stig_mappings 
    WHERE (operating_system IS NULL OR operating_system = asset_record.operating_system)
    AND (os_version IS NULL OR os_version = asset_record.os_version)
    ORDER BY priority ASC, confidence_score DESC
  LOOP
    -- Insert assignment if not exists
    INSERT INTO stig_asset_assignments (asset_id, mapping_id, assigned_by, assignment_reason, confidence_score)
    VALUES (
      asset_uuid, 
      mapping_record.id, 
      'system', 
      'Automatic assignment based on asset metadata',
      mapping_record.confidence_score
    )
    ON CONFLICT (asset_id, mapping_id) DO NOTHING;
    
    GET DIAGNOSTICS assignment_count = ROW_COUNT;
  END LOOP;
  
  RETURN assignment_count;
END;
$$ LANGUAGE plpgsql;
```

## Performance Considerations

### Indexing Strategy
- **Primary lookups**: All foreign key relationships are indexed
- **Search operations**: Text fields used in WHERE clauses have indexes
- **Sorting operations**: Common sort fields (priority, created_at) are indexed
- **Unique constraints**: Prevent duplicate assignments and reviews

### Query Optimization
- Views pre-calculate common aggregations (compliance percentages)
- Stored functions handle complex business logic server-side
- JSONB fields use GIN indexes for metadata searches
- Partitioning recommended for large deployments (10,000+ assets)

### Data Archival
- Soft deletes using `is_active` flags
- Historical reviews retained for audit purposes
- Old STIG downloads cleaned up automatically after newer versions available

This schema supports enterprise-scale STIG management with comprehensive audit trails, flexible asset grouping, and efficient compliance tracking across thousands of assets and multiple STIG frameworks.