# Data Ingestion Scheduling Strategy for Xacta and Tenable

## Overview
Different data types from Xacta and Tenable have varying update frequencies and criticality levels. This document outlines the optimal scheduling strategy for each data source to maintain current security posture while managing system resources.

## Data Source Update Frequencies

### Tenable Data Sources

#### 1. Vulnerability Scans (HIGH PRIORITY)
- **Frequency**: Every 4-6 hours during business hours, every 12 hours overnight
- **Rationale**: New vulnerabilities can be discovered continuously; critical vulnerabilities need immediate attention
- **Schedule**: 
  - 06:00, 10:00, 14:00, 18:00 (business hours)
  - 22:00, 02:00 (overnight)
- **Data Tables**: 
  - `ingestion_vulnerabilities`
  - `ingestion_vulnerability_cves`
  - `ingestion_patches` (auto-populated)

#### 2. Asset Discovery (MEDIUM PRIORITY)
- **Frequency**: Every 24 hours
- **Rationale**: Assets change less frequently than vulnerabilities but new systems need tracking
- **Schedule**: 03:00 daily
- **Data Tables**: 
  - `ingestion_assets`
  - `ingestion_asset_network`
  - `ingestion_asset_systems`
  - `ingestion_asset_tags`

#### 3. Asset Status Updates (MEDIUM PRIORITY)
- **Frequency**: Every 6 hours
- **Rationale**: Asset status (online/offline) and criticality ratings can change
- **Schedule**: 00:00, 06:00, 12:00, 18:00
- **Focus**: Update existing asset metadata, exposure scores, last_seen timestamps

### Xacta Data Sources

#### 1. Controls Assessment Status (MEDIUM PRIORITY)
- **Frequency**: Every 12 hours
- **Rationale**: Control implementation status changes during remediation activities
- **Schedule**: 06:00, 18:00 daily
- **Data Tables**: 
  - `ingestion_controls`
  - `ingestion_control_findings`
  - `ingestion_control_evidence`

#### 2. POAM Updates (HIGH PRIORITY)
- **Frequency**: Every 6 hours during business days, every 12 hours on weekends
- **Rationale**: POAM progress affects compliance deadlines and risk posture
- **Schedule**: 
  - Business days: 08:00, 14:00, 20:00
  - Weekends: 08:00, 20:00
- **Data Tables**: 
  - `ingestion_poams`
  - `ingestion_poam_milestones`
  - `ingestion_poam_assets`
  - `ingestion_poam_cves`

#### 3. System Information (LOW PRIORITY)
- **Frequency**: Weekly on Sundays
- **Rationale**: System boundaries and ownership change infrequently
- **Schedule**: Sunday 02:00
- **Data Tables**: 
  - `ingestion_systems`
  - `ingestion_system_impact_levels`
  - `ingestion_system_assets`

## Incremental vs Full Updates

### Incremental Updates (Recommended)
- **Vulnerabilities**: Query for changes since last update using `last_found` timestamps
- **Assets**: Update only assets with status changes or new discoveries
- **POAMs**: Update only POAMs with milestone progress or status changes
- **Controls**: Update only controls with assessment activity

### Full Updates (Periodic)
- **Frequency**: Weekly for data integrity verification
- **Schedule**: Saturday nights during maintenance window
- **Purpose**: Catch any missed incremental updates and verify data consistency

## Proposed Scheduling Implementation

### Option 1: Database-Driven Scheduling (Recommended)
Create scheduling metadata table to track update frequencies and last run times:

```sql
CREATE TABLE ingestion_schedules (
    id SERIAL PRIMARY KEY,
    source_system VARCHAR(50) NOT NULL, -- 'tenable', 'xacta'
    data_type VARCHAR(50) NOT NULL, -- 'vulnerabilities', 'assets', 'controls', 'poams'
    schedule_expression VARCHAR(100), -- Cron expression
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    enabled BOOLEAN DEFAULT true,
    update_type VARCHAR(20) DEFAULT 'incremental', -- 'incremental', 'full'
    priority INTEGER DEFAULT 3, -- 1=high, 2=medium, 3=low
    max_runtime_minutes INTEGER DEFAULT 60,
    failure_retry_count INTEGER DEFAULT 3,
    metadata JSONB
);
```

### Option 2: External Task Scheduler Integration
- **Linux**: Cron jobs calling ingestion scripts
- **Windows**: Task Scheduler with PowerShell scripts
- **Cloud**: AWS EventBridge, Azure Logic Apps, or similar

### Option 3: Application-Level Scheduling
- Node.js with `node-cron` package
- Background workers with job queues (Bull, Agenda)
- Docker containers with scheduled execution

## Critical Vulnerability Fast-Track

### Emergency Response Schedule
For Critical/High vulnerabilities on Critical/High assets:
- **Immediate notification**: Within 15 minutes of discovery
- **Patch research**: Within 2 hours
- **Risk assessment**: Within 4 hours
- **Remediation plan**: Within 24 hours

### Fast-Track Data Flow
1. Tenable vulnerability scan detects critical finding
2. Immediate ingestion trigger (outside normal schedule)
3. Auto-populate patch table with EMERGENCY priority
4. Generate real-time alerts to security team
5. Update POAM table with expedited timeline

## Data Retention and Archival

### Active Data Retention
- **Vulnerabilities**: 2 years of active vulnerabilities
- **Assets**: Current state + 1 year of historical changes
- **Controls**: Current assessment + 3 years of findings
- **POAMs**: Active POAMs + 5 years of completed POAMs

### Archival Strategy
- **Monthly**: Archive resolved vulnerabilities older than 6 months
- **Quarterly**: Archive decommissioned assets and outdated controls
- **Annually**: Archive completed POAMs older than 2 years

## Performance Optimization

### Batch Processing Strategies
- **Small batches**: 100-500 records per transaction for incremental updates
- **Parallel processing**: Multiple workers for different data types
- **Connection pooling**: Reuse database connections across batches
- **Progress tracking**: Log batch completion for resumability

### Resource Management
- **Off-peak scheduling**: Heavy full updates during low-usage hours
- **Rate limiting**: Respect API limits from Tenable/Xacta
- **Error handling**: Exponential backoff for failed requests
- **Monitoring**: Track ingestion performance and success rates

## Recommended Implementation Schedule

### Phase 1: Core Vulnerability Management (Week 1-2)
- Implement vulnerability scanning every 6 hours
- Set up critical vulnerability fast-track processing
- Create basic error handling and logging

### Phase 2: Asset and Control Integration (Week 3-4)
- Add asset discovery daily updates
- Implement control assessment synchronization
- Set up incremental update logic

### Phase 3: POAM and Compliance Tracking (Week 5-6)
- Integrate POAM milestone tracking
- Implement compliance deadline monitoring
- Add automated patch identification

### Phase 4: Optimization and Monitoring (Week 7-8)
- Fine-tune update frequencies based on usage patterns
- Implement performance monitoring
- Add data quality validation checks

## Sample Cron Schedule

```bash
# Critical vulnerability scans (every 4 hours during business)
0 6,10,14,18 * * 1-5 /usr/local/bin/ingest-vulnerabilities.sh

# Overnight vulnerability scans (every 12 hours)
0 22 * * * /usr/local/bin/ingest-vulnerabilities.sh
0 2 * * * /usr/local/bin/ingest-vulnerabilities.sh

# Asset discovery (daily at 3 AM)
0 3 * * * /usr/local/bin/ingest-assets.sh

# POAM updates (business hours only)
0 8,14,20 * * 1-5 /usr/local/bin/ingest-poams.sh
0 8,20 * * 6,7 /usr/local/bin/ingest-poams.sh

# Control assessments (twice daily)
0 6,18 * * * /usr/local/bin/ingest-controls.sh

# Systems metadata (weekly)
0 2 * * 0 /usr/local/bin/ingest-systems.sh

# Full data integrity check (weekly)
0 1 * * 6 /usr/local/bin/full-data-sync.sh
```

## Success Metrics

### Data Freshness KPIs
- **Vulnerability data**: <4 hours old during business hours
- **Asset data**: <24 hours old
- **POAM data**: <6 hours old
- **Control data**: <12 hours old

### Performance KPIs
- **Ingestion success rate**: >99%
- **Average ingestion time**: <30 minutes per job
- **API error rate**: <1%
- **Data quality score**: >95%

## Alerting and Monitoring

### Alert Conditions
- Ingestion job failure after 3 retries
- Data freshness exceeding SLA thresholds
- Critical vulnerabilities discovered
- POAM milestones approaching deadlines
- API rate limits exceeded

### Monitoring Dashboard
- Real-time ingestion status
- Data freshness indicators
- Job execution history
- Error rate trends
- Performance metrics

This scheduling strategy ensures your security data remains current while optimizing system resources and maintaining compliance with security response timeframes.