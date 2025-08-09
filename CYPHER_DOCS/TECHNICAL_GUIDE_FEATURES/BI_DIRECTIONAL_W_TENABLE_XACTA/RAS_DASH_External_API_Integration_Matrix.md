# RAS DASH External API Integration Matrix

## Overview
The RAS DASH (Risk Assessment System Dashboard) integrates with multiple external APIs to provide comprehensive vulnerability management, compliance tracking, and security intelligence capabilities. This document provides a detailed matrix of all external API integrations, their endpoints, data flow directions, and associated costs.

## API Integration Matrix

### 1. OpenAI API Integration

**Service Provider:** OpenAI  
**Purpose:** AI-powered vulnerability analysis, risk assessment, and natural language processing  
**Base URL:** `https://api.openai.com/v1/`  
**Authentication:** Bearer Token (API Key)  
**Configuration:** Environment variable `OPENAI_API_KEY`

#### Endpoints & Data Flow

| Endpoint | Method | Direction | Data Sent | Data Retrieved | Purpose |
|----------|--------|-----------|-----------|----------------|---------|
| `/chat/completions` | POST | Send/Receive | Vulnerability data, system context, prompts | AI-generated analysis, recommendations | Vulnerability analysis and risk assessment |
| `/embeddings` | POST | Send/Receive | Text content, document fragments | Vector embeddings | Document analysis and semantic search |
| `/models` | GET | Receive | None | Available models list | Model availability verification |

#### Cost Structure
- **Model:** GPT-4o (primary model)
- **Input Tokens:** $5.00 per 1M tokens
- **Output Tokens:** $15.00 per 1M tokens
- **Embeddings:** $0.10 per 1M tokens
- **Estimated Monthly Cost:** $200-500 (based on usage volume)

---

### 2. Anthropic Claude API Integration

**Service Provider:** Anthropic  
**Purpose:** Advanced AI analysis for compliance frameworks and document generation  
**Base URL:** `https://api.anthropic.com/v1/`  
**Authentication:** x-api-key Header  
**Configuration:** Environment variable `ANTHROPIC_API_KEY`

#### Endpoints & Data Flow

| Endpoint | Method | Direction | Data Sent | Data Retrieved | Purpose |
|----------|--------|-----------|-----------|----------------|---------|
| `/messages` | POST | Send/Receive | Compliance data, control frameworks, prompts | AI-generated compliance recommendations | Control implementation analysis |
| `/messages` | POST | Send/Receive | POAM data, risk context | AI-generated POAM suggestions | Plan of Action & Milestones generation |
| `/messages` | POST | Send/Receive | Evidence documents, assessment data | Analysis results, gap identification | Evidence analysis and gap assessment |

#### Cost Structure
- **Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Input Tokens:** $3.00 per 1M tokens
- **Output Tokens:** $15.00 per 1M tokens
- **Estimated Monthly Cost:** $150-400 (based on usage volume)

---

### 3. National Vulnerability Database (NVD) API

**Service Provider:** NIST (National Institute of Standards and Technology)  
**Purpose:** CVE vulnerability data retrieval and enrichment  
**Base URL:** `https://services.nvd.nist.gov/rest/json/cves/2.0`  
**Authentication:** API Key (optional, increases rate limits)  
**Configuration:** Environment variable `NVD_API_KEY` (optional)

#### Endpoints & Data Flow

| Endpoint | Method | Direction | Data Sent | Data Retrieved | Purpose |
|----------|--------|-----------|-----------|----------------|---------|
| `/cves/2.0` | GET | Receive | CVE ID, date ranges, keywords | CVE details, CVSS scores, descriptions | Vulnerability data enrichment |
| `/cves/2.0/{cveId}` | GET | Receive | CVE identifier | Specific CVE details, references | Individual vulnerability lookup |
| `/cvehistory/2.0` | GET | Receive | CVE ID, date filters | CVE modification history | Tracking vulnerability changes |

#### Cost Structure
- **Free Tier:** 5 requests per 30 seconds, 50 requests per 30 seconds with API key
- **Rate Limits:** Enhanced with API key registration
- **Estimated Monthly Cost:** FREE (government service)

---

### 4. GitLab API Integration

**Service Provider:** GitLab  
**Purpose:** Repository scanning, dependency analysis, and security pipeline integration  
**Base URL:** `https://gitlab.com/api/v4/` or `{instance_url}/api/v4/`  
**Authentication:** Personal Access Token or OAuth2  
**Configuration:** Environment variables `GITLAB_API_TOKEN`, `GITLAB_BASE_URL`

#### Endpoints & Data Flow

| Endpoint | Method | Direction | Data Sent | Data Retrieved | Purpose |
|----------|--------|-----------|-----------|----------------|---------|
| `/projects` | GET | Receive | Search parameters, filters | Project listings, metadata | Repository discovery |
| `/projects/{id}/repository/files` | GET | Receive | File paths, branch info | Source code, configuration files | Code analysis and scanning |
| `/projects/{id}/vulnerabilities` | GET | Receive | Project ID, filters | Vulnerability reports | Security scanning results |
| `/projects/{id}/security_dashboard` | GET | Receive | Project ID | Security dashboard data | Security posture assessment |
| `/projects/{id}/dependencies` | GET | Receive | Project ID | Dependency tree, versions | Dependency vulnerability analysis |
| `/projects/{id}/pipelines` | POST | Send/Receive | Pipeline configuration | Pipeline execution results | Automated security scanning |

#### Cost Structure
- **GitLab.com:** Free tier available, Premium $19/user/month, Ultimate $99/user/month
- **Self-Managed:** Free Community Edition, Premium $19/user/month, Ultimate $99/user/month
- **API Rate Limits:** 2000 requests/hour (authenticated)
- **Estimated Monthly Cost:** $0-500 (depending on tier and user count)

---

### 5. Tenable API Integration

**Service Provider:** Tenable  
**Purpose:** Vulnerability scanning, asset discovery, and risk assessment  
**Base URL:** `https://cloud.tenable.com/` or `{tenable_instance}/`  
**Authentication:** API Keys (Access Key + Secret Key)  
**Configuration:** Environment variables `TENABLE_ACCESS_KEY`, `TENABLE_SECRET_KEY`

#### Endpoints & Data Flow

| Endpoint | Method | Direction | Data Sent | Data Retrieved | Purpose |
|----------|--------|-----------|-----------|----------------|---------|
| `/assets` | GET | Receive | Filters, pagination | Asset inventory, details | Asset discovery and management |
| `/vulns` | GET | Receive | Asset filters, severity | Vulnerability data, risk scores | Vulnerability assessment |
| `/scans` | GET | Receive | Scan filters | Scan results, status | Scan management and results |
| `/scans` | POST | Send/Receive | Scan configuration, targets | Scan ID, execution status | Initiate vulnerability scans |
| `/workbenches/vulnerabilities` | GET | Receive | Date ranges, filters | Comprehensive vulnerability data | Vulnerability reporting |
| `/workbenches/assets` | GET | Receive | Asset criteria | Detailed asset information | Asset intelligence |

#### Cost Structure
- **Tenable.io:** Starting at $3,990/year for 65 assets
- **Tenable.sc:** On-premise solution, contact for pricing
- **API Rate Limits:** 5000 requests/hour
- **Estimated Monthly Cost:** $330-2000+ (based on asset count and edition)

---

### 6. Xacta API Integration

**Service Provider:** Telos Xacta  
**Purpose:** Compliance management, authorization packages, and security documentation  
**Base URL:** `{xacta_instance}/api/v1/` (customer-specific)  
**Authentication:** Username/Password + API Key  
**Configuration:** Environment variables `XACTA_BASE_URL`, `XACTA_USERNAME`, `XACTA_PASSWORD`, `XACTA_API_KEY`

#### Endpoints & Data Flow

| Endpoint | Method | Direction | Data Sent | Data Retrieved | Purpose |
|----------|--------|-----------|-----------|----------------|---------|
| `/systems` | GET | Receive | Filters, organization | System inventory, boundaries | System catalog management |
| `/systems/{id}/controls` | GET | Receive | System ID, framework | Control implementations, status | Control compliance tracking |
| `/systems/{id}/poams` | GET | Receive | System ID, status filters | Plan of Actions & Milestones | Risk management tracking |
| `/systems/{id}/poams` | POST | Send/Receive | POAM data, milestones | Created POAM ID, status | POAM creation and management |
| `/controls/{id}/evidence` | GET | Receive | Control ID | Evidence artifacts, attachments | Evidence collection |
| `/controls/{id}/evidence` | POST | Send | Evidence files, metadata | Upload confirmation | Evidence submission |
| `/assessments` | GET | Receive | System filters, dates | Assessment results, findings | Security assessment data |
| `/packages/{id}/generate` | POST | Send/Receive | Package parameters, format | Generated ATO package | Authorization package generation |

#### Cost Structure
- **Xacta 365:** Subscription-based, contact for pricing
- **On-Premise:** License-based pricing
- **Professional Services:** Additional consulting costs
- **Estimated Monthly Cost:** $5,000-25,000+ (enterprise licensing)

---

## Integration Summary

### Data Flow Overview

| Integration | Primary Data Direction | Volume (Est.) | Frequency |
|-------------|----------------------|---------------|-----------|
| OpenAI | Bidirectional | 10-50MB/day | Real-time |
| Anthropic | Bidirectional | 5-30MB/day | Real-time |
| NVD | Inbound | 100-500MB/day | Scheduled/On-demand |
| GitLab | Bidirectional | 50-200MB/day | Scheduled/Webhook |
| Tenable | Inbound | 200MB-2GB/day | Scheduled |
| Xacta | Bidirectional | 10-100MB/day | Scheduled/Real-time |

### Total Estimated Monthly Costs

| Service | Low End | High End | Notes |
|---------|---------|----------|-------|
| OpenAI | $200 | $500 | Based on token usage |
| Anthropic | $150 | $400 | Based on token usage |
| NVD | $0 | $0 | Free government service |
| GitLab | $0 | $500 | Depends on plan and users |
| Tenable | $330 | $2,000+ | Based on asset count |
| Xacta | $5,000 | $25,000+ | Enterprise licensing |
| **Total** | **$5,680** | **$28,400+** | Varies significantly by scale |

## Security Considerations

### Authentication & Authorization
- All API keys stored as encrypted environment variables
- Token rotation policies implemented where supported
- Role-based access control for API endpoint access
- Audit logging for all external API calls

### Data Protection
- TLS 1.2+ encryption for data in transit
- No sensitive data stored in API logs
- Data minimization principles applied
- Compliance with FedRAMP and FISMA requirements

### Rate Limiting & Resilience
- Exponential backoff retry mechanisms
- Circuit breaker patterns for service failures
- Request queuing and throttling
- Fallback mechanisms for critical services

## Implementation Status

| Integration | Status | Version | Last Updated |
|-------------|--------|---------|--------------|
| OpenAI | ✅ Active | GPT-4o | 2025-01-17 |
| Anthropic | ✅ Active | Claude Sonnet 4 | 2025-01-17 |
| NVD | ✅ Active | API v2.0 | 2025-01-17 |
| GitLab | 🟡 Partial | API v4 | 2025-01-17 |
| Tenable | 🟡 Partial | Latest | 2025-01-17 |
| Xacta | 🟡 Partial | API v1 | 2025-01-17 |

**Legend:**
- ✅ Active: Fully implemented and operational
- 🟡 Partial: Implementation in progress or limited functionality
- ❌ Inactive: Planned but not yet implemented

## Next Steps

1. **Complete GitLab Integration:** Finalize webhook configurations and security pipeline integration
2. **Enhance Tenable Integration:** Implement real-time vulnerability data synchronization
3. **Expand Xacta Integration:** Complete evidence management and package generation features
4. **Cost Optimization:** Implement usage monitoring and cost alerting
5. **Security Hardening:** Conduct penetration testing on all API integrations

---

*Document Version: 1.0*  
*Last Updated: January 17, 2025*  
*Prepared by: RAS DASH Development Team*