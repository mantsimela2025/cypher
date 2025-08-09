# System-Based Data Architecture Strategy

## Core Principle: Hierarchical System Relationships

Rather than adding system_id to every table, we use a strategic hierarchy where data inherits system context through logical relationships.

## Direct System Relationships (system_id foreign key)

### Primary System-Scoped Tables
- `systems` - Master system registry
- `assets` - Physical/logical components belonging to systems
- `vulnerabilities` - Security issues within system boundaries
- `users` - System-specific access and roles
- `system_security_plans` - SSP documents per system
- `authorizations_to_operate` - ATO status per system
- `continuous_monitoring_activities` - Ongoing assessment per system
- `system_compliance_status` - Compliance state tracking
- `plan_of_action_milestones` - Remediation plans scoped to systems
- `audit_logs` - System-specific activity tracking

## Indirect System Relationships (via parent associations)

### Asset-Derived System Context
Tables that inherit system context through asset relationships:
- `stig_assessments` → `assets` → `systems`
- `scan_results` → `assets` → `systems`
- `asset_vulnerabilities` → `assets` → `systems`
- `asset_costs` → `assets` → `systems`

### Vulnerability-Derived System Context
Tables that inherit system context through vulnerability relationships:
- `patches` → `vulnerabilities` → `systems`
- `vulnerability_patches` → `vulnerabilities` → `systems`
- `vulnerability_risk_scores` → `vulnerabilities` → `systems`

### User-Derived System Context
Tables that inherit system context through user relationships:
- `user_roles` → `users` → `systems`
- `user_preferences` → `users` → `systems`

## System-Independent Global Tables

### Configuration and Reference Data
- `settings` - Global application configuration
- `roles`, `permissions` - Global RBAC definitions
- `email_templates` - Shared communication templates
- `agencies` - Organizational hierarchy above systems
- `compliance_frameworks` - Standard frameworks (NIST, etc.)
- `stig_library` - Standard STIG definitions

## Query Patterns for System-Scoped Data

### Direct System Queries
```sql
-- Get all vulnerabilities for a system
SELECT * FROM vulnerabilities WHERE system_id = ?;

-- Get system compliance status
SELECT * FROM system_compliance_status WHERE system_id = ?;
```

### Indirect System Queries via Assets
```sql
-- Get STIG assessments for a system
SELECT sa.* FROM stig_assessments sa
JOIN assets a ON sa.asset_id = a.id
WHERE a.system_id = ?;

-- Get scan results for a system
SELECT sr.* FROM scan_results sr
JOIN assets a ON sr.asset_id = a.id
WHERE a.system_id = ?;
```

### Cross-System Analysis
```sql
-- Compare vulnerability counts across systems
SELECT s.name, COUNT(v.id) as vuln_count
FROM systems s
LEFT JOIN vulnerabilities v ON s.id = v.system_id
GROUP BY s.id, s.name;
```

## Benefits of This Approach

1. **Reduced Redundancy**: Avoid system_id in every table
2. **Logical Hierarchy**: Data relationships follow business logic
3. **Query Efficiency**: Joins follow natural data paths
4. **Maintenance**: Easier schema evolution
5. **Compliance**: System boundaries clearly defined for auditing

## Data Ingestion Strategy

### Xacta Integration
1. Import systems first (authorization boundaries)
2. Map assets to systems during import
3. Associate vulnerabilities via asset relationships
4. Generate system-level compliance reports

### Tenable Integration
1. Scan results import to asset-specific tables
2. Vulnerability data flows through asset → system hierarchy
3. Risk aggregation at system level
4. Automated POAM generation per system

This architecture provides system-scoped data management without over-constraining the schema while maintaining clear audit trails and compliance boundaries.