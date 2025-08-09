# RAS DASH API Endpoints Documentation

This document provides a comprehensive list of all API endpoints available in the RAS DASH platform, organized by category.

## Table of Contents

- [Authentication](#authentication)
- [User Management](#user-management)
- [Asset Management](#asset-management)
- [Vulnerability Management](#vulnerability-management)
- [Compliance](#compliance)
- [Risk Assessment](#risk-assessment)
- [SIEM Integration](#siem-integration)
- [Scanner](#scanner)
- [Database Management](#database-management)
- [Dashboard and Metrics](#dashboard-and-metrics)
- [Reports](#reports)
- [AI Integration](#ai-integration)
- [AWS Integration](#aws-integration)
- [Email and Notifications](#email-and-notifications)
- [System Settings](#system-settings)
- [Miscellaneous](#miscellaneous)

## Authentication

- **GET /api/user** - Get the currently authenticated user
- **POST /api/login** - Authenticate a user
- **POST /api/logout** - Log out the current user
- **POST /api/register** - Register a new user
- **POST /api/password/reset-request** - Request a password reset
- **POST /api/password/reset** - Reset a password with token
- **POST /api/password/change** - Change password for authenticated user

## User Management

- **GET /api/users** - List all users
- **GET /api/users/:id** - Get user by ID
- **POST /api/users** - Create a new user
- **PUT /api/users/:id** - Update a user
- **DELETE /api/users/:id** - Delete a user
- **GET /api/users/:id/activity** - Get user activity history
- **GET /api/roles** - List all roles
- **GET /api/roles/:id** - Get role by ID
- **POST /api/roles** - Create a new role
- **PUT /api/roles/:id** - Update a role
- **DELETE /api/roles/:id** - Delete a role
- **GET /api/permissions** - List all permissions
- **GET /api/access-requests** - List access requests
- **POST /api/access-requests** - Submit an access request
- **PUT /api/access-requests/:id/approve** - Approve an access request
- **PUT /api/access-requests/:id/deny** - Deny an access request

## Asset Management

- **GET /api/assets** - List all assets
- **GET /api/assets/:id** - Get asset by ID
- **POST /api/assets** - Create a new asset
- **PUT /api/assets/:id** - Update an asset
- **DELETE /api/assets/:id** - Delete an asset
- **GET /api/assets/:id/vulnerabilities** - Get vulnerabilities for an asset
- **GET /api/assets/:id/compliance** - Get compliance status for an asset
- **GET /api/assets/:id/risk** - Get risk assessment for an asset
- **GET /api/assets/groups** - List asset groups
- **GET /api/assets/groups/:id** - Get asset group by ID
- **POST /api/assets/groups** - Create an asset group
- **PUT /api/assets/groups/:id** - Update an asset group
- **DELETE /api/assets/groups/:id** - Delete an asset group
- **POST /api/assets/groups/:id/assets** - Add asset to a group
- **DELETE /api/assets/groups/:id/assets/:assetId** - Remove asset from a group
- **GET /api/discovery/jobs** - List asset discovery jobs
- **POST /api/discovery/jobs** - Create asset discovery job
- **GET /api/discovery/config** - Get discovery configuration
- **PUT /api/discovery/config** - Update discovery configuration

## Vulnerability Management

- **GET /api/vulnerabilities** - List all vulnerabilities
- **GET /api/vulnerabilities/:id** - Get vulnerability by ID
- **PUT /api/vulnerabilities/:id** - Update a vulnerability
- **GET /api/asset-vulnerabilities** - Get vulnerabilities by asset filtering
- **POST /api/asset-vulnerabilities** - Add a vulnerability to an asset
- **GET /api/vulnerability-reports** - Get vulnerability reports
- **GET /api/cve-database/status** - Get CVE database status
- **POST /api/cve-database/import** - Import CVE database
- **GET /api/cve-database/schedule** - Get scheduled CVE imports
- **POST /api/cve-database/schedule** - Schedule a CVE import
- **PUT /api/cve-database/schedule/:id** - Update a scheduled import
- **DELETE /api/cve-database/schedule/:id** - Delete a scheduled import
- **GET /api/cve/:id** - Get CVE details
- **GET /api/patches** - List patches
- **GET /api/patches/:id** - Get patch by ID
- **POST /api/patches** - Create a patch
- **PUT /api/patches/:id** - Update a patch

## Compliance

### Frameworks and Controls

- **GET /api/compliance/frameworks** - List compliance frameworks
- **GET /api/compliance/frameworks/:id** - Get compliance framework by ID
- **POST /api/compliance/frameworks** - Create a compliance framework
- **PUT /api/compliance/frameworks/:id** - Update a compliance framework
- **DELETE /api/compliance/frameworks/:id** - Delete a compliance framework
- **GET /api/compliance/controls** - List compliance controls
- **GET /api/compliance/controls/:id** - Get compliance control by ID
- **GET /api/compliance/frameworks/:frameworkId/controls** - Get controls by framework
- **POST /api/compliance/controls** - Create a compliance control
- **PUT /api/compliance/controls/:id** - Update a compliance control
- **DELETE /api/compliance/controls/:id** - Delete a compliance control
- **POST /api/compliance/controls/import** - Import compliance controls
- **POST /api/compliance/import** - Import compliance data
- **POST /api/compliance/import/nist** - Import NIST compliance controls
- **GET /api/compliance/import/status** - Get import status

### System and Control Compliance Status

- **GET /api/compliance/system-status** - List system compliance statuses
- **GET /api/compliance/system-status/:id** - Get system compliance status by ID
- **POST /api/compliance/system-status** - Create a system compliance status
- **PUT /api/compliance/system-status/:id** - Update a system compliance status
- **GET /api/compliance/assets/:assetId/status** - Get compliance status for an asset
- **GET /api/compliance/control-status** - List control compliance statuses
- **GET /api/compliance/control-status/:id** - Get control compliance status by ID
- **POST /api/compliance/control-status** - Create a control compliance status
- **PUT /api/compliance/control-status/:id** - Update a control compliance status

### Plan of Action & Milestones (POAMs)

- **GET /api/compliance/poams** - List POAMs
- **GET /api/compliance/poams/:id** - Get POAM by ID
- **POST /api/compliance/poams** - Create a POAM
- **PUT /api/compliance/poams/:id** - Update a POAM
- **DELETE /api/compliance/poams/:id** - Delete a POAM
- **GET /api/compliance/poams/pdf** - Export POAMs to PDF
- **GET /api/compliance/poams/excel** - Export POAMs to Excel
- **GET /api/compliance/poams/word** - Export POAMs to Word
- **GET /api/compliance/poams/template-report** - Get POAM template report
- **GET /api/compliance/poams/statistics** - Get POAM statistics
- **GET /api/compliance/poams/:id/approval** - Get POAM approval history
- **POST /api/compliance/poams/:id/approval** - Submit POAM for approval
- **POST /api/compliance/poams/:id/signature** - Sign a POAM
- **POST /api/compliance/poams/:id/comment** - Comment on a POAM
- **GET /api/compliance/poams/:id/priority** - Get POAM priority
- **POST /api/compliance/poams/priority/recalculate** - Recalculate all priorities
- **GET /api/compliance/poams/priority/queue** - Get remediation queue
- **POST /api/compliance/poams/:id/priority/override** - Override POAM priority
- **POST /api/compliance/poams/:id/priority/reset** - Reset priority override

### System Security Plan (SSP)

- **GET /api/compliance/ssps** - List SSPs
- **GET /api/compliance/ssps/system/:systemId** - Get SSPs by system ID
- **GET /api/compliance/ssps/:id** - Get SSP by ID
- **POST /api/compliance/ssps** - Create an SSP
- **PUT /api/compliance/ssps/:id** - Update an SSP
- **DELETE /api/compliance/ssps/:id** - Delete an SSP
- **GET /api/compliance/ssps/:id/statistics** - Get SSP statistics
- **GET /api/compliance/ssps/:sspId/controls** - Get controls by SSP ID
- **GET /api/compliance/ssp-controls/:id** - Get SSP control by ID
- **POST /api/compliance/ssp-controls** - Create an SSP control
- **PUT /api/compliance/ssp-controls/:id** - Update an SSP control
- **DELETE /api/compliance/ssp-controls/:id** - Delete an SSP control
- **GET /api/compliance/ssps/:sspId/poams** - Get POAMs by SSP ID
- **GET /api/compliance/ssps/:sspId/poams/export** - Export POAMs by SSP ID
- **POST /api/compliance/ssps/poam-mapping** - Link POAM to SSP
- **DELETE /api/compliance/ssps/:sspId/poams/:poamId** - Unlink POAM from SSP

### Authorization to Operate (ATO)

- **GET /api/compliance/ato-dashboard** - Get ATO dashboard data
- **GET /api/compliance/ssps/:sspId/atos** - Get ATOs by SSP ID
- **GET /api/compliance/atos/:id** - Get ATO by ID
- **POST /api/compliance/atos** - Create an ATO
- **PUT /api/compliance/atos/:id** - Update an ATO
- **DELETE /api/compliance/atos/:id** - Delete an ATO
- **GET /api/compliance/atos/:atoId/workflow** - Get ATO workflow history
- **POST /api/compliance/atos/workflow** - Update ATO workflow
- **GET /api/compliance/atos/:atoId/documents** - Get ATO documents
- **POST /api/compliance/atos/documents** - Add ATO document
- **DELETE /api/compliance/atos/documents/:id** - Delete ATO document
- **GET /api/compliance/ssps/:sspId/monitoring** - Get continuous monitoring activities
- **POST /api/compliance/monitoring** - Create monitoring activity
- **PUT /api/compliance/monitoring/:id** - Update monitoring activity
- **DELETE /api/compliance/monitoring/:id** - Delete monitoring activity
- **GET /api/compliance/atos/check-expiring** - Check for expiring ATOs

### Classification Guides

- **GET /api/compliance/classification-guides** - List security classification guides
- **GET /api/compliance/classification-guides/:id** - Get classification guide by ID
- **POST /api/compliance/classification-guides** - Create a classification guide
- **PUT /api/compliance/classification-guides/:id** - Update a classification guide
- **DELETE /api/compliance/classification-guides/:id** - Delete a classification guide
- **GET /api/compliance/classification-items/:guideId** - Get classification items
- **GET /api/compliance/classification-items/detail/:id** - Get classification item by ID
- **POST /api/compliance/classification-items** - Create a classification item
- **PUT /api/compliance/classification-items/:id** - Update a classification item
- **DELETE /api/compliance/classification-items/:id** - Delete a classification item

### Compliance Metrics

- **GET /api/compliance/metrics** - Get compliance metrics

## Risk Assessment

- **GET /api/risk/assessments** - List risk assessments
- **GET /api/risk/assessments/:id** - Get risk assessment by ID
- **POST /api/risk/assessments** - Create a risk assessment
- **PUT /api/risk/assessments/:id** - Update a risk assessment
- **DELETE /api/risk/assessments/:id** - Delete a risk assessment
- **GET /api/risk/asset/:assetId** - Get risk assessment for an asset
- **GET /api/risk/calculation** - Get risk calculation metrics
- **GET /api/risk/dashboard** - Get risk dashboard data
- **GET /api/risk/factors** - Get risk factors
- **PUT /api/risk/factors** - Update risk factors
- **GET /api/risk/factors/asset/:assetId** - Get risk factors for an asset
- **PUT /api/risk/factors/asset/:assetId** - Update risk factors for an asset
- **GET /api/risk/matrix** - Get risk matrix
- **GET /api/risk/metrics** - Get risk metrics
- **GET /api/risk/compliance** - Get compliance risk data
- **GET /api/risk/reports** - Get risk reports
- **GET /api/risk/trends** - Get risk trends
- **GET /api/risk/vulnerability** - Get vulnerability risk data
- **GET /api/risk/remediation** - Get risk remediation plan
- **POST /api/risk/ai/analysis** - Perform AI-based risk analysis

## SIEM Integration

- **GET /api/siem/alerts** - List SIEM alerts
- **GET /api/siem/alerts/:id** - Get SIEM alert by ID
- **PUT /api/siem/alerts/:id** - Update a SIEM alert
- **GET /api/siem/dashboard** - Get SIEM dashboard data
- **GET /api/siem/events** - List SIEM events
- **GET /api/siem/events/:id** - Get SIEM event by ID
- **GET /api/siem/log-sources** - List log sources
- **POST /api/siem/log-sources** - Add a log source
- **PUT /api/siem/log-sources/:id** - Update a log source
- **DELETE /api/siem/log-sources/:id** - Delete a log source
- **GET /api/siem/metrics** - Get SIEM metrics
- **GET /api/siem/rules** - List SIEM rules
- **GET /api/siem/rules/:id** - Get SIEM rule by ID
- **POST /api/siem/rules** - Create a SIEM rule
- **PUT /api/siem/rules/:id** - Update a SIEM rule
- **DELETE /api/siem/rules/:id** - Delete a SIEM rule
- **GET /api/siem/search** - Search SIEM data
- **GET /api/siem/settings** - Get SIEM settings
- **PUT /api/siem/settings** - Update SIEM settings
- **GET /api/siem/stats** - Get SIEM statistics
- **GET /api/siem/trends** - Get SIEM trends
- **GET /api/siem/use-cases** - List SIEM use cases
- **GET /api/siem/use-cases/:id** - Get SIEM use case by ID
- **POST /api/siem/use-cases** - Create a SIEM use case
- **PUT /api/siem/use-cases/:id** - Update a SIEM use case
- **DELETE /api/siem/use-cases/:id** - Delete a SIEM use case

## Scanner

- **GET /api/scanner/config** - Get scanner configuration
- **PUT /api/scanner/config** - Update scanner configuration
- **GET /api/scanner/logs** - Get scanner logs
- **GET /api/scanner/status** - Get scanner status
- **GET /api/scanner/templates** - List scan templates
- **GET /api/scans** - List scans
- **GET /api/scans/:id** - Get scan by ID
- **POST /api/scans** - Create a new scan
- **PUT /api/scans/:id** - Update a scan
- **DELETE /api/scans/:id** - Delete a scan
- **POST /api/scans/:id/start** - Start a scan
- **POST /api/scans/:id/stop** - Stop a scan
- **GET /api/scans/:id/results** - Get scan results

## Database Management

- **GET /api/database/backups** - List database backups
- **POST /api/database/backups** - Create a database backup
- **GET /api/database/backups/:fileName/download** - Download a backup
- **DELETE /api/database/backups/:fileName** - Delete a database backup
- **POST /api/database/backups/:fileName/restore** - Restore from a backup
- **GET /api/database/size** - Get database size
- **GET /api/database/stats** - Get database statistics
- **GET /api/database/tables** - List database tables
- **GET /api/database/tables/:name** - Get table details
- **GET /api/db-schema** - Get database schema
- **GET /api/database/audit-logs** - Get database audit logs
- **GET /api/database/performance** - Get database performance metrics

## Dashboard and Metrics

- **GET /api/dashboards** - List dashboards
- **GET /api/dashboards/:id** - Get dashboard by ID
- **POST /api/dashboards** - Create a dashboard
- **PUT /api/dashboards/:id** - Update a dashboard
- **DELETE /api/dashboards/:id** - Delete a dashboard
- **GET /api/dashboard/default** - Get default dashboard
- **PUT /api/dashboard/default/:id** - Set default dashboard
- **GET /api/dashboard/widgets** - List dashboard widgets
- **POST /api/dashboard/widgets** - Create a dashboard widget
- **PUT /api/dashboard/widgets/:id** - Update a dashboard widget
- **DELETE /api/dashboard/widgets/:id** - Delete a dashboard widget
- **GET /api/dashboard/shares** - Get dashboard shares
- **POST /api/dashboard/shares** - Share a dashboard
- **DELETE /api/dashboard/shares/:dashboardId/:userId** - Remove dashboard share
- **GET /api/metrics** - List metrics
- **GET /api/metrics/:id** - Get metric by ID
- **POST /api/metrics** - Create a metric
- **PUT /api/metrics/:id** - Update a metric
- **DELETE /api/metrics/:id** - Delete a metric
- **GET /api/metrics/data** - Get metric data

## Reports

- **GET /api/reports** - List reports
- **GET /api/reports/:id** - Get report by ID
- **POST /api/reports** - Create a report
- **PUT /api/reports/:id** - Update a report
- **DELETE /api/reports/:id** - Delete a report
- **GET /api/reports/:id/download** - Download a report
- **GET /api/reports/templates** - List report templates
- **GET /api/reports/templates/:id** - Get report template by ID
- **POST /api/reports/templates** - Create a report template
- **PUT /api/reports/templates/:id** - Update a report template
- **DELETE /api/reports/templates/:id** - Delete a report template
- **GET /api/reports/schedule** - List scheduled reports
- **POST /api/reports/schedule** - Create a scheduled report
- **PUT /api/reports/schedule/:id** - Update a scheduled report
- **DELETE /api/reports/schedule/:id** - Delete a scheduled report
- **GET /api/reports/audit** - Get audit reports
- **GET /api/reports/compliance** - Get compliance reports
- **GET /api/reports/risk** - Get risk reports
- **GET /api/reports/vulnerability** - Get vulnerability reports
- **GET /api/reports/asset** - Get asset reports
- **GET /api/reports/security** - Get security reports

## AI Integration

- **POST /api/ai/analyze-vulnerabilities** - Analyze vulnerabilities with AI
- **POST /api/ai/risk-assessment** - AI-based risk assessment
- **POST /api/ai/compliance-gap-analysis** - Compliance gap analysis
- **POST /api/ai/remediation-recommendations** - Get remediation recommendations
- **POST /api/compliance/poams/ai/suggestions** - Generate POAM suggestions
- **POST /api/compliance/poams/ai/risk-assessment** - AI-based POAM risk assessment
- **POST /api/compliance/controls/ai/implementation** - Generate control implementation
- **GET /api/compliance/ssps/:sspId/ai/gap-analysis** - Generate SSP gap analysis
- **POST /api/compliance/evidence/ai/analyze** - Analyze evidence document

## AWS Integration

- **GET /api/aws/accounts** - List AWS accounts
- **POST /api/aws/accounts** - Add an AWS account
- **PUT /api/aws/accounts/:id** - Update an AWS account
- **DELETE /api/aws/accounts/:id** - Delete an AWS account
- **GET /api/aws/scanning** - Get AWS scanning status
- **POST /api/aws/scanning/start** - Start AWS scanning
- **POST /api/aws/scanning/stop** - Stop AWS scanning
- **GET /api/aws/assets** - List AWS assets
- **GET /api/aws/compliance** - Get AWS compliance data
- **GET /api/aws/security-groups** - List AWS security groups

## Email and Notifications

- **GET /api/email-templates** - List email templates
- **GET /api/email-templates/:id** - Get email template by ID
- **POST /api/email-templates** - Create an email template
- **PUT /api/email-templates/:id** - Update an email template
- **DELETE /api/email-templates/:id** - Delete an email template
- **POST /api/email-templates/:id/test** - Test an email template
- **GET /api/email-logs** - List email logs
- **GET /api/email-logs/:id** - Get email log by ID
- **DELETE /api/email-logs/cleanup** - Clean up email logs
- **GET /api/notifications/settings** - Get notification settings
- **PUT /api/notifications/settings** - Update notification settings
- **GET /api/notifications** - List notifications
- **POST /api/notifications/mark-read** - Mark notifications as read

## System Settings

- **GET /api/system-settings** - Get system settings
- **PUT /api/system-settings** - Update system settings
- **GET /api/security/banner** - Get security banner
- **PUT /api/security/banner** - Update security banner
- **GET /api/integrations/status** - Get integration status
- **GET /api/tags** - List tags
- **POST /api/tags** - Create a tag
- **PUT /api/tags/:id** - Update a tag
- **DELETE /api/tags/:id** - Delete a tag

## Policies and Procedures

- **GET /api/policies** - List policies
- **GET /api/policies/:id** - Get policy by ID
- **POST /api/policies** - Create a policy
- **PUT /api/policies/:id** - Update a policy
- **DELETE /api/policies/:id** - Delete a policy
- **GET /api/procedures** - List procedures
- **GET /api/procedures/:id** - Get procedure by ID
- **POST /api/procedures** - Create a procedure
- **PUT /api/procedures/:id** - Update a procedure
- **DELETE /api/procedures/:id** - Delete a procedure
- **GET /api/policy-workflows** - List policy workflows
- **GET /api/policy-workflows/:id** - Get policy workflow by ID
- **POST /api/policy-workflows** - Create a policy workflow
- **PUT /api/policy-workflows/:id** - Update a policy workflow

## Miscellaneous

- **GET /api/health** - Health check
- **GET /api/diagnostics/logs** - Get diagnostic logs
- **GET /api/diagnostics/system** - Get system diagnostics
- **GET /api/documents** - List documents
- **POST /api/documents** - Upload a document
- **GET /api/documents/:id** - Get document by ID
- **DELETE /api/documents/:id** - Delete a document
- **GET /api/schedules** - List schedules
- **POST /api/schedules** - Create a schedule
- **GET /api/schedules/:id** - Get schedule by ID
- **PUT /api/schedules/:id** - Update a schedule
- **DELETE /api/schedules/:id** - Delete a schedule

---

*Note: This documentation was automatically generated on May 9, 2025. The API is subject to changes and improvements. For the most up-to-date information, refer to the Swagger documentation at /api-docs.*