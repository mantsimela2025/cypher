# RAS DASH Database Data Dictionary

## Overview
This document provides a comprehensive data dictionary for the RAS DASH (Cyber Security as a Service) platform database. The database is built on PostgreSQL and uses Drizzle ORM for schema management.

## Database Information
- **Database Type**: PostgreSQL
- **ORM**: Drizzle ORM with TypeScript
- **Schema Location**: Multiple schema files in `shared/` directory
  - `shared/schema.ts` - Core ingestion, dashboard, user, and diagram tables
  - `shared/workflow-schema.ts` - Workflow automation tables
  - `shared/stig-schema.ts` - STIG management tables
  - `shared/data-simulation-schema.ts` - Data simulation and testing tables
  - `shared/audit-logs-schema.ts` - Audit logging tables
  - `shared/email-templates-schema.ts` - Email template management
  - `shared/metrics-schema.ts` - Metrics and analytics tables
  - `shared/ssp-ato-schema.ts` - SSP and ATO document tables
  - `shared/vulnerability-database-schema.ts` - CVE and vulnerability database
- **Total Tables**: 81 tables organized by functional domains

---

## Table Categories

### 1. User Management & Authentication
### 2. Data Ingestion System
### 3. Dashboard Builder System
### 4. Vulnerability Management
### 5. Compliance & Controls Management
### 6. STIG Management System
### 7. Workflow Automation
### 8. AI & Analytics
### 9. Document Generation & Requirements Management
### 10. Data Simulation & Testing
### 11. Audit Logging & System Monitoring
### 12. Email Templates & Notifications
### 13. Metrics & Performance Tracking
### 14. SSP & ATO Document Management
### 15. CVE & Vulnerability Database
### 16. Diagram & Network Visualization Platform

---

## 1. USER MANAGEMENT & AUTHENTICATION

### `users`
Primary user authentication and profile management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| username | TEXT | NO | - | Unique username for login |
| password | TEXT | NO | - | Hashed password |
| first_name | TEXT | YES | - | User's first name |
| last_name | TEXT | YES | - | User's last name |
| email | TEXT | YES | - | Email address |
| created_at | TIMESTAMP | NO | NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| auth_method | TEXT | NO | 'password' | Authentication method (password, certificate) |
| certificate_subject | TEXT | YES | - | PKI certificate subject |
| certificate_expiry | TIMESTAMP | YES | - | Certificate expiration date |
| role | TEXT | NO | 'user' | User role (user, admin, super_admin) |
| status | TEXT | NO | 'active' | Account status (active, inactive, suspended) |

**Indexes**: username (unique), email, status

### `access_requests`
User access request management for new account approvals.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| email | TEXT | NO | - | Requestor email |
| first_name | TEXT | NO | - | Requestor first name |
| last_name | TEXT | NO | - | Requestor last name |
| status | ENUM | NO | 'pending' | Request status (pending, approved, rejected) |
| reason | TEXT | YES | - | Reason for access request |
| rejection_reason | TEXT | YES | - | Reason for rejection if applicable |
| created_at | TIMESTAMP | NO | NOW() | Request creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| processed_at | TIMESTAMP | YES | - | Processing completion timestamp |
| processed_by | INTEGER | YES | - | User ID who processed request |

**Foreign Keys**: processed_by → users(id)

---

## 2. DATA INGESTION SYSTEM

### `ingestion_batches`
Tracks data ingestion batch operations from external systems.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| batch_id | UUID | NO | - | Unique batch identifier |
| source_system | VARCHAR(50) | NO | - | Source system (tenable, xacta, manual) |
| batch_type | VARCHAR(50) | YES | - | Type of batch operation |
| file_name | VARCHAR(255) | YES | - | Source file name if applicable |
| total_records | INTEGER | YES | - | Total records in batch |
| successful_records | INTEGER | NO | 0 | Successfully processed records |
| failed_records | INTEGER | NO | 0 | Failed processing records |
| status | VARCHAR(50) | NO | 'in_progress' | Batch status |
| started_at | TIMESTAMP | NO | NOW() | Batch start timestamp |
| completed_at | TIMESTAMP | YES | - | Batch completion timestamp |
| error_details | TEXT | YES | - | Error details if failed |
| created_by | INTEGER | YES | - | User who initiated batch |
| metadata | JSONB | YES | - | Additional batch metadata |

**Indexes**: batch_id (unique), source_system, status

### `ingestion_systems`
System information from ingested data sources.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| system_id | VARCHAR(50) | NO | - | External system identifier |
| name | VARCHAR(255) | NO | - | System name |
| uuid | UUID | NO | - | Unique system UUID |
| status | VARCHAR(50) | YES | - | System operational status |
| authorization_boundary | TEXT | YES | - | Security authorization boundary |
| system_type | VARCHAR(100) | YES | - | Type of system |
| responsible_organization | VARCHAR(255) | YES | - | Responsible organization |
| system_owner | VARCHAR(255) | YES | - | System owner |
| information_system_security_officer | VARCHAR(255) | YES | - | ISSO contact |
| authorizing_official | VARCHAR(255) | YES | - | AO contact |
| last_assessment_date | TIMESTAMP | YES | - | Last security assessment |
| authorization_date | TIMESTAMP | YES | - | ATO grant date |
| authorization_termination_date | TIMESTAMP | YES | - | ATO expiration date |
| created_at | TIMESTAMP | NO | NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| ingestion_source | VARCHAR(50) | YES | - | Source of ingestion |
| ingestion_batch_id | UUID | YES | - | Related batch ID |
| raw_json | JSONB | YES | - | Raw ingested data |

**Indexes**: system_id, uuid (unique), name

### `ingestion_assets`
Asset information from external systems.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| asset_uuid | UUID | NO | - | Unique asset identifier |
| hostname | VARCHAR(255) | YES | - | Asset hostname |
| netbios_name | VARCHAR(100) | YES | - | NetBIOS name |
| system_id | VARCHAR(50) | YES | - | Associated system ID |
| has_agent | BOOLEAN | YES | - | Whether agent is installed |
| has_plugin_results | BOOLEAN | YES | - | Whether plugin results exist |
| first_seen | TIMESTAMP | YES | - | First discovery timestamp |
| last_seen | TIMESTAMP | YES | - | Last seen timestamp |
| exposure_score | INTEGER | YES | - | Security exposure score |
| acr_score | DECIMAL(3,1) | YES | - | Asset Criticality Rating |
| criticality_rating | VARCHAR(20) | YES | - | Criticality classification |
| created_at | TIMESTAMP | NO | NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| ingestion_source | VARCHAR(50) | YES | - | Source of ingestion |
| ingestion_batch_id | UUID | YES | - | Related batch ID |
| raw_json | JSONB | YES | - | Raw ingested data |

**Indexes**: asset_uuid (unique), hostname, system_id

### `ingestion_vulnerabilities`
Vulnerability data from security scanning tools.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| batch_id | UUID | YES | - | Related ingestion batch |
| plugin_id | VARCHAR(50) | NO | - | Scanner plugin ID |
| vulnerability_name | VARCHAR(500) | NO | - | Vulnerability name |
| severity | VARCHAR(20) | NO | - | Severity level (Critical, High, Medium, Low) |
| cvss_score | DECIMAL(4,2) | YES | - | CVSS score |
| cvss_vector | VARCHAR(200) | YES | - | CVSS vector string |
| description | TEXT | YES | - | Vulnerability description |
| solution | TEXT | YES | - | Remediation solution |
| state | VARCHAR(20) | YES | - | Vulnerability state |
| first_found | TIMESTAMP | YES | - | First discovery timestamp |
| last_found | TIMESTAMP | YES | - | Last found timestamp |
| asset_uuid | VARCHAR(255) | NO | - | Affected asset UUID |
| poam_id | INTEGER | YES | - | Related POAM ID |
| control_id | INTEGER | YES | - | Related control ID |
| raw_data | JSONB | YES | - | Raw scanner data |
| created_at | TIMESTAMP | NO | NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: asset_uuid, severity, plugin_id, batch_id

---

## 3. DASHBOARD BUILDER SYSTEM

### `dashboards`
User-created dashboard configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Dashboard name |
| description | TEXT | YES | - | Dashboard description |
| layout | JSONB | NO | '{"nodes": [], "edges": []}' | ReactFlow layout data |
| is_default | BOOLEAN | NO | false | Whether this is the default dashboard |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: created_by → users(id)

### `dashboard_widgets`
Individual widgets within dashboards.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| dashboard_id | INTEGER | YES | - | Parent dashboard ID |
| metric_id | INTEGER | YES | - | Associated metric ID |
| position_x | DECIMAL(10,2) | NO | - | X coordinate position |
| position_y | DECIMAL(10,2) | NO | - | Y coordinate position |
| width | INTEGER | NO | 300 | Widget width in pixels |
| height | INTEGER | NO | 200 | Widget height in pixels |
| widget_config | JSONB | NO | '{}' | Widget configuration settings |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |

**Foreign Keys**: dashboard_id → dashboards(id) ON DELETE CASCADE

### `widget_templates`
Reusable widget templates and configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Template name |
| description | TEXT | YES | - | Template description |
| chart_type | VARCHAR(100) | NO | - | Chart type (bar, line, pie, etc.) |
| template_config | JSONB | NO | '{}' | Template configuration |
| size_preset | VARCHAR(50) | NO | 'medium' | Size preset (small, medium, large) |
| color_scheme | VARCHAR(50) | NO | 'default' | Color scheme identifier |
| is_system | BOOLEAN | NO | false | Whether this is a system template |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: created_by → users(id)

### `dashboard_themes`
Dashboard visual themes and styling.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Theme name |
| description | TEXT | YES | - | Theme description |
| theme_config | JSONB | NO | '{}' | Theme configuration |
| color_palette | JSONB | NO | '{}' | Color palette definition |
| typography | JSONB | NO | '{}' | Typography settings |
| grid_settings | JSONB | NO | '{}' | Grid configuration |
| is_system | BOOLEAN | NO | true | Whether this is a system theme |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: created_by → users(id)

---

## 4. VULNERABILITY MANAGEMENT

### `vulnerabilities`
Central vulnerability tracking and management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| cve_id | VARCHAR(20) | YES | - | CVE identifier |
| vulnerability_name | VARCHAR(500) | NO | - | Vulnerability name |
| description | TEXT | YES | - | Detailed description |
| severity | VARCHAR(20) | NO | - | Severity level |
| cvss_score | DECIMAL(4,2) | YES | - | CVSS base score |
| cvss_vector | VARCHAR(200) | YES | - | CVSS vector |
| solution | TEXT | YES | - | Remediation solution |
| plugin_id | VARCHAR(50) | YES | - | Scanner plugin ID |
| first_found | TIMESTAMP | YES | - | First discovery |
| last_found | TIMESTAMP | YES | - | Last found |
| status | VARCHAR(50) | NO | 'open' | Vulnerability status |
| asset_id | INTEGER | YES | - | Affected asset |
| system_id | VARCHAR(50) | YES | - | Affected system |
| poam_id | INTEGER | YES | - | Related POAM |
| remediation_priority | INTEGER | YES | - | Remediation priority (1-5) |
| estimated_cost | DECIMAL(10,2) | YES | - | Estimated remediation cost |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: cve_id, severity, status, asset_id

### `ingestion_patches`
Patch management and remediation tracking from security scanners.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| batch_id | UUID | YES | - | Related ingestion batch |
| vulnerability_id | INTEGER | YES | - | Related vulnerability ID |
| asset_uuid | VARCHAR(255) | NO | - | Affected asset UUID |
| patch_id | VARCHAR(100) | YES | - | Patch identifier |
| patch_name | VARCHAR(500) | YES | - | Patch name/description |
| patch_status | VARCHAR(50) | YES | - | Patch installation status |
| patch_priority | VARCHAR(50) | YES | - | Patch priority level |
| estimated_install_time | INTEGER | YES | - | Installation time estimate (minutes) |
| requires_reboot | BOOLEAN | NO | false | Whether patch requires reboot |
| raw_data | JSONB | YES | - | Raw scanner data |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: vulnerability_id → ingestion_vulnerabilities(id), batch_id → ingestion_batches(batch_id)

---

## 5. COMPLIANCE & CONTROLS MANAGEMENT

### `ingestion_controls`
Security controls from compliance frameworks.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| system_id | VARCHAR(50) | YES | - | Associated system ID |
| control_id | VARCHAR(100) | NO | - | Control identifier (AC-1, AU-2, etc.) |
| control_title | VARCHAR(500) | NO | - | Control title |
| family | VARCHAR(100) | YES | - | Control family |
| priority | VARCHAR(10) | YES | - | Implementation priority |
| implementation_status | VARCHAR(50) | YES | - | Implementation status |
| assessment_status | VARCHAR(50) | YES | - | Assessment status |
| responsible_role | VARCHAR(255) | YES | - | Responsible role/person |
| last_assessed | TIMESTAMP | YES | - | Last assessment date |
| implementation_guidance | TEXT | YES | - | Implementation guidance |
| residual_risk | VARCHAR(50) | YES | - | Residual risk level |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| ingestion_source | VARCHAR(50) | YES | - | Source of data |
| ingestion_batch_id | UUID | YES | - | Related batch ID |
| raw_json | JSONB | YES | - | Raw source data |

**Indexes**: control_id, family, system_id

### `ingestion_poams`
Plan of Action & Milestones tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| poam_id | VARCHAR(100) | NO | - | POAM identifier |
| system_id | VARCHAR(50) | YES | - | Associated system |
| weakness_description | TEXT | NO | - | Description of weakness |
| source | TEXT | YES | - | Source of finding |
| security_control | VARCHAR(100) | YES | - | Related security control |
| resources | TEXT | YES | - | Required resources |
| scheduled_completion | TIMESTAMP | YES | - | Target completion date |
| poc | VARCHAR(255) | YES | - | Point of contact |
| status | VARCHAR(50) | YES | - | POAM status |
| risk_rating | VARCHAR(50) | YES | - | Risk rating |
| deviation_rationale | TEXT | YES | - | Deviation rationale |
| original_detection_date | TIMESTAMP | YES | - | Original detection date |
| weakness_severity | VARCHAR(50) | YES | - | Severity level |
| residual_risk | VARCHAR(50) | YES | - | Residual risk level |
| threat_relevance | VARCHAR(50) | YES | - | Threat relevance |
| likelihood | VARCHAR(50) | YES | - | Likelihood assessment |
| impact | VARCHAR(50) | YES | - | Impact assessment |
| mitigation_strategy | TEXT | YES | - | Mitigation strategy |
| cost_estimate | VARCHAR(100) | YES | - | Cost estimate |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| ingestion_source | VARCHAR(50) | YES | - | Source of data |
| ingestion_batch_id | UUID | YES | - | Related batch ID |
| raw_json | JSONB | YES | - | Raw source data |

**Indexes**: poam_id, system_id, status

---

## 6. STIG MANAGEMENT SYSTEM

### `stig_library`
Central STIG library containing all security technical implementation guides.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| stig_id | VARCHAR(50) | NO | - | Unique STIG identifier |
| title | VARCHAR(500) | NO | - | STIG title |
| description | TEXT | YES | - | STIG description |
| version | VARCHAR(50) | YES | - | STIG version |
| release | VARCHAR(50) | YES | - | STIG release number |
| benchmark | VARCHAR(100) | YES | - | Security benchmark reference |
| severity | VARCHAR(20) | NO | - | STIG severity level |
| category | VARCHAR(100) | YES | - | STIG category |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: stig_id (unique), category, severity

---

## 7. WORKFLOW AUTOMATION SYSTEM

*Note: Detailed workflow tables are defined in `shared/workflow-schema.ts` and documented separately in the Workflow System Documentation.*

---

## 8. AI & ANALYTICS

*Note: AI and analytics tables will be documented as they are implemented in future releases.*

---

## 9. DOCUMENT GENERATION & REQUIREMENTS MANAGEMENT

### `requirement_documents`
System requirements document generation and management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| uuid | UUID | NO | Auto-generated | Unique document identifier |
| title | VARCHAR(500) | NO | - | Document title |
| description | TEXT | YES | - | Document description |
| system_id | VARCHAR(255) | NO | - | Associated system identifier |
| system_name | VARCHAR(255) | NO | - | System name |
| asset_ids | JSONB | NO | - | Array of selected asset IDs |
| document_type | VARCHAR(100) | NO | 'security_requirements' | Type of document |
| status | VARCHAR(50) | NO | 'draft' | Document status |
| template_type | VARCHAR(100) | YES | - | Template used |
| generated_content | TEXT | YES | - | AI-generated content |
| ai_prompt | TEXT | YES | - | AI prompt used |
| ai_model | VARCHAR(50) | YES | - | AI model used |
| generation_metadata | JSONB | YES | - | AI generation metadata |
| gitlab_project_id | VARCHAR(100) | YES | - | GitLab project ID |
| gitlab_issue_url | VARCHAR(500) | YES | - | GitLab issue URL |
| created_by | INTEGER | YES | - | Creator user ID |
| updated_by | INTEGER | YES | - | Last updater user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| published_at | TIMESTAMP | YES | - | Publication timestamp |

**Indexes**: uuid (unique), system_id, status

### `requirement_sections`
Individual sections within requirement documents.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| document_id | INTEGER | YES | - | Parent document ID |
| section_number | VARCHAR(10) | YES | - | Section number |
| title | VARCHAR(500) | NO | - | Section title |
| content | TEXT | YES | - | Section content |
| section_type | VARCHAR(100) | YES | - | Section type |
| requirements | JSONB | YES | - | Specific requirements |
| compliance_controls | JSONB | YES | - | NIST controls mapped |
| vulnerabilities | JSONB | YES | - | Related vulnerabilities |
| assets | JSONB | YES | - | Assets covered |
| priority | INTEGER | NO | 1 | Section priority |
| status | VARCHAR(50) | NO | 'draft' | Section status |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: document_id → requirement_documents(id)

### `requirement_tasks`
Tasks generated from requirement documents.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| document_id | INTEGER | YES | - | Parent document ID |
| section_id | INTEGER | YES | - | Parent section ID |
| title | VARCHAR(500) | NO | - | Task title |
| description | TEXT | YES | - | Task description |
| task_type | VARCHAR(100) | YES | - | Task type |
| priority | VARCHAR(20) | NO | 'medium' | Task priority |
| estimated_hours | DECIMAL(5,2) | YES | - | Estimated hours |
| assigned_to | VARCHAR(255) | YES | - | Assignee |
| due_date | TIMESTAMP | YES | - | Due date |
| status | VARCHAR(50) | NO | 'open' | Task status |
| gitlab_issue_id | VARCHAR(100) | YES | - | GitLab issue ID |
| gitlab_issue_url | VARCHAR(500) | YES | - | GitLab issue URL |
| labels | JSONB | YES | - | GitLab labels |
| milestone | VARCHAR(255) | YES | - | Milestone |
| dependencies | JSONB | YES | - | Task dependencies |
| acceptance_criteria | JSONB | YES | - | Acceptance criteria |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: document_id → requirement_documents(id), section_id → requirement_sections(id)

### `gitlab_configurations`
GitLab integration configurations for automated issue creation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Configuration name |
| gitlab_url | VARCHAR(500) | NO | - | GitLab instance URL |
| access_token | VARCHAR(500) | YES | - | Encrypted access token |
| default_project_id | VARCHAR(100) | YES | - | Default project ID |
| default_milestone | VARCHAR(255) | YES | - | Default milestone |
| default_labels | JSONB | YES | - | Default labels |
| default_assignee | VARCHAR(255) | YES | - | Default assignee |
| is_active | BOOLEAN | NO | true | Configuration active status |
| last_sync | TIMESTAMP | YES | - | Last synchronization |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: name, is_active

---

## 10. DATA SIMULATION & TESTING

### `data_simulation_jobs`
Data simulation job definitions and configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Job name |
| description | TEXT | YES | - | Job description |
| job_type | VARCHAR(100) | NO | - | Type of simulation job |
| source_config | JSONB | NO | - | Source configuration |
| target_config | JSONB | NO | - | Target configuration |
| transformation_rules | JSONB | YES | - | Data transformation rules |
| schedule_config | JSONB | YES | - | Scheduling configuration |
| is_active | BOOLEAN | NO | true | Job active status |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: name, job_type, is_active

### `data_simulation_executions`
Execution history and results of simulation jobs.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| job_id | INTEGER | YES | - | Related simulation job |
| execution_uuid | UUID | NO | Auto-generated | Unique execution identifier |
| status | VARCHAR(50) | NO | 'pending' | Execution status |
| started_at | TIMESTAMP | YES | - | Execution start time |
| completed_at | TIMESTAMP | YES | - | Execution completion time |
| records_processed | INTEGER | NO | 0 | Records processed count |
| records_created | INTEGER | NO | 0 | Records created count |
| records_updated | INTEGER | NO | 0 | Records updated count |
| records_failed | INTEGER | NO | 0 | Failed records count |
| error_details | TEXT | YES | - | Error details if failed |
| execution_log | TEXT | YES | - | Execution log |
| metadata | JSONB | YES | - | Execution metadata |

**Foreign Keys**: job_id → data_simulation_jobs(id)

### `data_simulation_files`
File management for simulation data sources.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| job_id | INTEGER | YES | - | Related simulation job |
| file_name | VARCHAR(255) | NO | - | Original file name |
| file_path | VARCHAR(500) | NO | - | File storage path |
| file_type | VARCHAR(50) | NO | - | File type (csv, json, xml) |
| file_size | INTEGER | YES | - | File size in bytes |
| file_hash | VARCHAR(64) | YES | - | File hash for integrity |
| upload_status | VARCHAR(50) | NO | 'pending' | Upload status |
| processing_status | VARCHAR(50) | NO | 'pending' | Processing status |
| error_details | TEXT | YES | - | Error details if failed |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| processed_at | TIMESTAMP | YES | - | Processing completion time |

**Foreign Keys**: job_id → data_simulation_jobs(id)

### `bidirectional_simulation_logs`
Logs for bidirectional data simulation operations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| execution_id | INTEGER | YES | - | Related execution |
| operation_type | VARCHAR(100) | NO | - | Operation type |
| source_system | VARCHAR(100) | NO | - | Source system |
| target_system | VARCHAR(100) | NO | - | Target system |
| operation_status | VARCHAR(50) | NO | - | Operation status |
| records_affected | INTEGER | NO | 0 | Records affected count |
| operation_details | JSONB | YES | - | Operation details |
| error_message | TEXT | YES | - | Error message if failed |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |

**Foreign Keys**: execution_id → data_simulation_executions(id)

### `data_generation_templates`
Templates for generating synthetic data.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Template name |
| description | TEXT | YES | - | Template description |
| template_type | VARCHAR(100) | NO | - | Template type |
| schema_definition | JSONB | NO | - | Data schema definition |
| generation_rules | JSONB | NO | - | Generation rules |
| sample_data | JSONB | YES | - | Sample generated data |
| is_active | BOOLEAN | NO | true | Template active status |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: name, template_type, is_active

---

## 11. AUDIT LOGGING & SYSTEM MONITORING

### `audit_logs`
Comprehensive audit logging for all system activities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| user_id | INTEGER | NO | - | User who performed action |
| action | TEXT | NO | - | Action performed |
| entity_type | TEXT | YES | - | Type of entity affected |
| entity_id | INTEGER | YES | - | ID of entity affected |
| metadata | JSONB | YES | - | Additional metadata |
| old_values | JSONB | YES | - | Previous values |
| new_values | JSONB | YES | - | New values |
| ip_address | TEXT | YES | - | User IP address |
| user_agent | TEXT | YES | - | User agent string |
| created_at | TIMESTAMP | NO | NOW() | Action timestamp |

**Indexes**: user_id, action, entity_type, created_at

---

## 12. EMAIL TEMPLATES & NOTIFICATIONS

### `email_templates`
Email template management for system notifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Template name |
| subject | VARCHAR(500) | NO | - | Email subject |
| body | TEXT | NO | - | Email body content |
| type | VARCHAR(100) | NO | - | Template type |
| is_active | BOOLEAN | NO | true | Template active status |
| variables | JSONB | YES | - | Template variables |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: name, type, is_active

---

## 13. METRICS & PERFORMANCE TRACKING

### `metrics`
System metrics and performance data collection.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Metric name |
| description | TEXT | YES | - | Metric description |
| value | DECIMAL(15,4) | YES | - | Metric value |
| unit | VARCHAR(50) | YES | - | Metric unit |
| category | VARCHAR(100) | YES | - | Metric category |
| metadata | JSONB | YES | - | Additional metadata |
| recorded_at | TIMESTAMP | NO | NOW() | Recording timestamp |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |

**Indexes**: name, category, recorded_at

---

## 14. SSP & ATO DOCUMENT MANAGEMENT

### `ssp_documents`
System Security Plan document management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| system_name | VARCHAR(255) | NO | - | System name |
| version | VARCHAR(50) | YES | - | Document version |
| status | VARCHAR(50) | NO | 'draft' | Document status |
| content | JSONB | YES | - | Document content |
| metadata | JSONB | YES | - | Document metadata |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: system_name, status

### `ato_workflows`
Authority to Operate workflow management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Workflow name |
| description | TEXT | YES | - | Workflow description |
| status | VARCHAR(50) | NO | 'active' | Workflow status |
| is_active | BOOLEAN | NO | true | Workflow active status |
| configuration | JSONB | YES | - | Workflow configuration |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: name, status, is_active

---

## 15. CVE & VULNERABILITY DATABASE

### `vulnerability_database`
Comprehensive CVE and vulnerability database.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| cve_id | VARCHAR(20) | YES | - | CVE identifier |
| title | VARCHAR(500) | NO | - | Vulnerability title |
| description | TEXT | YES | - | Vulnerability description |
| severity | VARCHAR(20) | YES | - | Severity level |
| cvss_score | DECIMAL(3,1) | YES | - | CVSS score |
| cvss_vector | VARCHAR(200) | YES | - | CVSS vector |
| published_date | TIMESTAMP | YES | - | Publication date |
| last_modified | TIMESTAMP | YES | - | Last modification date |
| references | JSONB | YES | - | External references |
| affected_products | JSONB | YES | - | Affected products |
| patch_available | BOOLEAN | NO | false | Patch availability |
| exploit_available | BOOLEAN | NO | false | Exploit availability |
| metadata | JSONB | YES | - | Additional metadata |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: cve_id (unique), severity, published_date

---

## 16. DIAGRAM & NETWORK VISUALIZATION PLATFORM

### `diagram_templates`
Reusable diagram templates for various architectures.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Template name |
| description | TEXT | YES | - | Template description |
| category | VARCHAR(100) | NO | - | Template category |
| template_data | JSONB | NO | - | React Flow template data |
| thumbnail_url | VARCHAR(500) | YES | - | Template thumbnail |
| is_built_in | BOOLEAN | NO | false | Built-in template flag |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: category, is_built_in

### `diagram_projects`
User diagram projects and configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Project name |
| description | TEXT | YES | - | Project description |
| template_id | INTEGER | YES | - | Base template ID |
| diagram_data | JSONB | NO | - | React Flow diagram data |
| metadata | JSONB | YES | - | Project metadata |
| is_public | BOOLEAN | NO | false | Public visibility |
| created_by | INTEGER | NO | - | Creator user ID |
| last_edited_by | INTEGER | YES | - | Last editor user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: template_id → diagram_templates(id)

### `diagram_node_library`
Library of available nodes for diagram creation.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| name | VARCHAR(255) | NO | - | Node name |
| display_name | VARCHAR(255) | NO | - | Display name |
| category | VARCHAR(100) | NO | - | Node category |
| subcategory | VARCHAR(100) | YES | - | Node subcategory |
| node_type | VARCHAR(100) | NO | - | Node type |
| icon_path | VARCHAR(500) | YES | - | Icon file path |
| icon_svg | TEXT | YES | - | SVG icon content |
| default_style | JSONB | YES | - | Default styling |
| default_data | JSONB | YES | - | Default node data |
| config_schema | JSONB | YES | - | Configuration schema |
| is_built_in | BOOLEAN | NO | false | Built-in node flag |
| created_by | INTEGER | YES | - | Creator user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: category, subcategory, is_built_in

### `diagram_shared_projects`
Project sharing and collaboration management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| project_id | INTEGER | NO | - | Shared project ID |
| shared_with_user_id | INTEGER | NO | - | User receiving access |
| permission | VARCHAR(50) | NO | - | Permission level |
| shared_by | INTEGER | NO | - | User granting access |
| shared_at | TIMESTAMP | NO | NOW() | Sharing timestamp |

**Foreign Keys**: project_id → diagram_projects(id)

### `diagram_versions`
Version control for diagram projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| project_id | INTEGER | NO | - | Parent project ID |
| version_number | INTEGER | NO | - | Version number |
| diagram_data | JSONB | NO | - | Diagram data snapshot |
| change_description | TEXT | YES | - | Change description |
| created_by | INTEGER | NO | - | Version creator |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |

**Foreign Keys**: project_id → diagram_projects(id)

---

## Summary

This database supports a comprehensive cybersecurity platform with:
- **81 tables** across 16 functional domains
- **Multi-schema architecture** for logical separation
- **Comprehensive auditing** and logging capabilities
- **Advanced dashboard** and visualization features
- **Workflow automation** and process management
- **AI-powered document generation** and analysis
- **Vulnerability management** and compliance tracking
- **Data simulation** and testing capabilities
- **Network diagramming** and visualization tools

The database is designed for enterprise-scale cybersecurity operations with full compliance tracking, automated workflows, and comprehensive audit capabilities suitable for government and DOD environments.------|
| id | SERIAL | NO | Auto-increment | Primary key |
| operating_system | VARCHAR(255) | YES | - | Target operating system |
| os_version | VARCHAR(100) | YES | - | OS version |
| application_name | VARCHAR(255) | YES | - | Application name |
| application_version | VARCHAR(100) | YES | - | Application version |
| system_type | VARCHAR(100) | YES | - | System type |
| stig_id | VARCHAR(100) | NO | - | STIG identifier |
| stig_title | VARCHAR(500) | NO | - | STIG title |
| stig_version | VARCHAR(50) | YES | - | STIG version |
| priority | INTEGER | NO | 1 | Mapping priority |
| download_url | VARCHAR(1000) | YES | - | Download URL |
| file_type | VARCHAR(20) | NO | 'zip' | File type |
| confidence_score | INTEGER | NO | 100 | Confidence in mapping (0-100) |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: stig_id, operating_system, application_name

### `stig_downloads`
STIG download tracking and management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | Auto-generated | Primary key |
| stig_id | VARCHAR(100) | NO | - | STIG identifier |
| stig_title | VARCHAR(500) | NO | - | STIG title |
| version | VARCHAR(50) | YES | - | STIG version |
| release_date | TIMESTAMP | YES | - | Release date |
| download_url | VARCHAR(1000) | YES | - | Download URL |
| local_path | VARCHAR(500) | YES | - | Local file path |
| file_size | INTEGER | YES | - | File size in bytes |
| download_status | VARCHAR(50) | NO | 'pending' | Download status |
| downloaded_at | TIMESTAMP | YES | - | Download completion |
| last_checked | TIMESTAMP | YES | - | Last update check |
| checksum | VARCHAR(64) | YES | - | File checksum |
| metadata | JSONB | YES | - | Additional metadata |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: stig_id, download_status

---

## 7. WORKFLOW AUTOMATION

### `workflows`
Visual workflow definitions and configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | Auto-generated | Primary key |
| name | VARCHAR(255) | NO | - | Workflow name |
| description | TEXT | YES | - | Workflow description |
| category | VARCHAR(100) | NO | 'custom' | Workflow category |
| version | VARCHAR(20) | NO | '1.0.0' | Version number |
| workflow_data | JSONB | NO | - | ReactFlow nodes and edges |
| is_active | BOOLEAN | NO | true | Whether workflow is active |
| is_template | BOOLEAN | NO | false | Whether this is a template |
| tags | JSONB | YES | - | Workflow tags array |
| configuration | JSONB | YES | - | Workflow configuration |
| created_by | VARCHAR(100) | YES | - | Creator identifier |
| updated_by | VARCHAR(100) | YES | - | Last updater |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Indexes**: name, category, is_active

### `workflow_instances`
Workflow execution instances and tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | Auto-generated | Primary key |
| workflow_id | UUID | YES | - | Parent workflow ID |
| status | VARCHAR(50) | NO | - | Execution status |
| priority | VARCHAR(20) | NO | 'normal' | Execution priority |
| started_at | TIMESTAMP | NO | NOW() | Start timestamp |
| completed_at | TIMESTAMP | YES | - | Completion timestamp |
| paused_at | TIMESTAMP | YES | - | Pause timestamp |
| progress | INTEGER | NO | 0 | Progress percentage (0-100) |
| current_step | VARCHAR(100) | YES | - | Current execution step |
| execution_context | JSONB | YES | - | Execution context data |
| output_data | JSONB | YES | - | Final output data |
| error_details | TEXT | YES | - | Error details if failed |
| triggered_by | VARCHAR(100) | YES | - | Trigger source |
| trigger_source | VARCHAR(100) | YES | - | Trigger type |
| execution_metrics | JSONB | YES | - | Performance metrics |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |

**Foreign Keys**: workflow_id → workflows(id)

---

## 8. AI & ANALYTICS

### `ai_chat_sessions`
AI chat session tracking and management.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| session_id | UUID | NO | - | Unique session identifier |
| user_id | INTEGER | YES | - | Associated user ID |
| title | VARCHAR(255) | YES | - | Session title |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| last_activity_at | TIMESTAMP | NO | NOW() | Last activity timestamp |
| is_active | BOOLEAN | NO | true | Whether session is active |
| session_metadata | JSONB | YES | - | Session metadata |

**Foreign Keys**: user_id → users(id)

### `ai_chat_messages`
Individual AI chat messages within sessions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| session_id | UUID | YES | - | Parent session ID |
| message_type | VARCHAR(20) | NO | - | Message type (user, assistant, system) |
| content | TEXT | NO | - | Message content |
| sql_query | TEXT | YES | - | Generated SQL query if applicable |
| query_results | JSONB | YES | - | Query results if applicable |
| ai_model | VARCHAR(50) | YES | - | AI model used |
| processing_time_ms | INTEGER | YES | - | Processing time in milliseconds |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| metadata | JSONB | YES | - | Message metadata |

**Foreign Keys**: session_id → ai_chat_sessions(session_id)

---

## 9. DOCUMENT GENERATION

### `requirement_documents`
Generated requirement documents and specifications.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | SERIAL | NO | Auto-increment | Primary key |
| uuid | UUID | NO | Auto-generated | Unique document identifier |
| title | VARCHAR(500) | NO | - | Document title |
| description | TEXT | YES | - | Document description |
| system_id | VARCHAR(255) | NO | - | Associated system ID |
| system_name | VARCHAR(255) | NO | - | System name |
| asset_ids | JSONB | NO | - | Array of asset IDs |
| document_type | VARCHAR(100) | NO | 'security_requirements' | Document type |
| status | VARCHAR(50) | NO | 'draft' | Document status |
| template_type | VARCHAR(100) | YES | - | Template used |
| generated_content | TEXT | YES | - | Generated content |
| ai_prompt | TEXT | YES | - | AI prompt used |
| ai_model | VARCHAR(50) | YES | - | AI model used |
| generation_metadata | JSONB | YES | - | Generation metadata |
| gitlab_project_id | VARCHAR(100) | YES | - | GitLab project ID |
| gitlab_issue_url | VARCHAR(500) | YES | - | GitLab issue URL |
| created_by | INTEGER | YES | - | Creator user ID |
| updated_by | INTEGER | YES | - | Last updater user ID |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| published_at | TIMESTAMP | YES | - | Publication timestamp |

**Foreign Keys**: created_by → users(id), updated_by → users(id)

---

## 10. DATA SIMULATION & TESTING

### `data_simulation_jobs`
Data simulation job configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | Auto-generated | Primary key |
| job_name | VARCHAR(255) | NO | - | Job name |
| source_system | VARCHAR(50) | NO | - | Source system (tenable, xacta) |
| data_type | VARCHAR(50) | NO | - | Data type to simulate |
| schedule_cron | VARCHAR(100) | YES | - | Cron schedule expression |
| is_active | BOOLEAN | NO | true | Whether job is active |
| data_source_type | VARCHAR(20) | NO | - | Source type (file, generated, api) |
| data_source_config | JSONB | YES | - | Source configuration |
| record_count | INTEGER | NO | 100 | Number of records to generate |
| variation_percentage | NUMERIC(5,2) | NO | 10.00 | Data variation percentage |
| enable_bidirectional | BOOLEAN | NO | false | Enable bidirectional simulation |
| bidirectional_config | JSONB | YES | - | Bidirectional configuration |
| last_execution_at | TIMESTAMP | YES | - | Last execution timestamp |
| next_execution_at | TIMESTAMP | YES | - | Next execution timestamp |
| execution_count | INTEGER | NO | 0 | Total execution count |
| created_by | VARCHAR(100) | YES | - | Creator identifier |
| created_at | TIMESTAMP | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NO | NOW() | Last update timestamp |
| status | VARCHAR(20) | NO | 'active' | Job status |
| last_error | TEXT | YES | - | Last error message |

**Indexes**: job_name, source_system, is_active

---

## Database Relationships

### Key Foreign Key Relationships

1. **User Relationships**
   - access_requests.processed_by → users.id
   - dashboards.created_by → users.id
   - widget_templates.created_by → users.id
   - dashboard_themes.created_by → users.id

2. **Dashboard Relationships**
   - dashboard_widgets.dashboard_id → dashboards.id (CASCADE DELETE)
   - dashboard_widgets.metric_id → metrics.id

3. **Ingestion Relationships**
   - ingestion_vulnerabilities.batch_id → ingestion_batches.batch_id
   - ingestion_vulnerability_cves.vulnerability_id → ingestion_vulnerabilities.id
   - ingestion_patches.vulnerability_id → ingestion_vulnerabilities.id

4. **Workflow Relationships**
   - workflow_nodes.workflow_id → workflows.id (CASCADE DELETE)
   - workflow_edges.workflow_id → workflows.id (CASCADE DELETE)
   - workflow_instances.workflow_id → workflows.id
   - workflow_executions.instance_id → workflow_instances.id (CASCADE DELETE)

5. **STIG Relationships**
   - stig_assets.collection_id → stig_collections.id (CASCADE DELETE)
   - stig_asset_assignments.asset_id → stig_assets.id (CASCADE DELETE)
   - stig_reviews.asset_id → stig_assets.id (CASCADE DELETE)
   - stig_reviews.rule_id → stig_rules.id (CASCADE DELETE)

6. **AI & Analytics Relationships**
   - ai_chat_sessions.user_id → users.id
   - ai_chat_messages.session_id → ai_chat_sessions.session_id

---

## Indexes and Performance

### Primary Indexes
- All tables have primary key indexes (usually on `id` field)
- Unique constraints on critical fields (usernames, UUIDs, etc.)

### Secondary Indexes
- **Performance Indexes**: Created on frequently queried fields
- **Foreign Key Indexes**: Automatic indexes on foreign key columns
- **Composite Indexes**: Multi-column indexes for complex queries

### Recommended Additional Indexes
```sql
-- Vulnerability management performance
CREATE INDEX idx_vulnerabilities_severity_status ON vulnerabilities(severity, status);
CREATE INDEX idx_vulnerabilities_asset_system ON vulnerabilities(asset_id, system_id);

-- Dashboard performance
CREATE INDEX idx_dashboard_widgets_dashboard_metric ON dashboard_widgets(dashboard_id, metric_id);

-- Ingestion performance
CREATE INDEX idx_ingestion_assets_hostname_system ON ingestion_assets(hostname, system_id);
CREATE INDEX idx_ingestion_vulns_asset_severity ON ingestion_vulnerabilities(asset_uuid, severity);

-- Workflow performance
CREATE INDEX idx_workflow_instances_status_priority ON workflow_instances(status, priority);
```

---

## Data Types and Constraints

### Common Data Types Used
- **SERIAL**: Auto-incrementing integer primary keys
- **UUID**: Universally unique identifiers
- **VARCHAR(n)**: Variable character strings with length limits
- **TEXT**: Unlimited text fields
- **TIMESTAMP**: Date and time with timezone support
- **BOOLEAN**: True/false values
- **JSONB**: Binary JSON storage for flexible data
- **DECIMAL/NUMERIC**: Precise decimal numbers
- **INTEGER**: Whole numbers

### Constraint Patterns
- **NOT NULL**: Required fields
- **UNIQUE**: Unique value constraints
- **DEFAULT**: Default values for new records
- **FOREIGN KEY**: Referential integrity
- **CASCADE DELETE**: Automatic cleanup of related records

---

## Database Size and Performance Considerations

### Expected Data Volumes
- **Users**: Hundreds to thousands
- **Assets**: Tens of thousands to hundreds of thousands
- **Vulnerabilities**: Hundreds of thousands to millions
- **Workflow Executions**: Thousands to hundreds of thousands
- **AI Chat Messages**: Thousands to millions

### Performance Optimization
- Regular VACUUM and ANALYZE operations
- Index maintenance and monitoring
- Partition large tables by date if needed
- Archive old data periodically
- Monitor query performance and optimize slow queries

### Backup and Recovery
- Regular database backups
- Point-in-time recovery capability
- Data retention policies
- Disaster recovery procedures

---

## Schema Version Control

### Migration Strategy
- Use Drizzle ORM migrations for schema changes
- Version control all schema modifications
- Test migrations in development environment
- Rollback procedures for failed migrations

### Schema Evolution
- Backward compatibility considerations
- Data migration scripts for structural changes
- Feature flags for gradual rollouts
- Documentation updates with each change

This data dictionary provides comprehensive information about the RAS DASH database structure and serves as a reference for developers, administrators, and stakeholders working with the system.