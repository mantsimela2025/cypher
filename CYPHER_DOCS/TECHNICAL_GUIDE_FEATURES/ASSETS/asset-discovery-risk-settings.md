# RAS-DASH: Asset Discovery, Risk Analysis & Settings Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Asset Discovery](#asset-discovery)
3. [Risk Analysis](#risk-analysis)
4. [Asset Settings](#asset-settings)
5. [Best Practices](#best-practices)

## Introduction

This guide provides detailed information on the advanced asset management features in RAS-DASH: Asset Discovery, Risk Analysis, and Asset Settings. These capabilities enable security teams to efficiently identify, assess, and manage IT assets across the organization's environment.

## Asset Discovery

Asset Discovery is a critical component of RAS-DASH that automates the identification and inventory of IT assets across your network environment. This comprehensive discovery process ensures no assets are left unmanaged or unprotected.

### Discovery Dashboard

The Discovery Dashboard provides an overview of your asset discovery program:

- **Discovery Status**: Current and historical discovery job statistics
- **Asset Growth**: Tracking of newly discovered assets over time
- **Coverage Map**: Visual representation of network segments and their discovery status
- **Undocumented Assets**: Recently discovered assets that aren't in the formal inventory
- **Discovery Issues**: Failed scans or authentication issues requiring attention

### Discovery Methods

RAS-DASH supports multiple discovery methods to ensure comprehensive asset identification:

#### Network Discovery
- **IP Range Scanning**: Define IP ranges for discovery
- **Port Scanning**: Identify running services and potential entry points
- **Network Protocol Analysis**: Detect assets through protocol responses
- **MAC Address Resolution**: Map physical addresses to assets

#### Integration-Based Discovery
- **Active Directory Integration**: Pull asset information from domain controllers
- **Cloud Service Provider APIs**: Discover assets in AWS, Azure, GCP environments
- **Virtual Infrastructure Integration**: Connect to VMware, Hyper-V to discover VMs
- **CMDB Integration**: Sync with IT service management systems

#### Agent-Based Discovery
- **Agent Reporting**: Collect data from installed security agents
- **Endpoint Detection Systems**: Leverage EDR/XDR data for asset insights
- **Configuration Management Systems**: Integrate with tools like Chef, Puppet, Ansible

### Setting Up Discovery Jobs

1. Navigate to **Assets > Discovery > New Job**
2. Select discovery method(s):
   - **Network Discovery**
   - **Integration-Based**
   - **Agent-Based**
3. Configure discovery parameters:
   - For Network: IP ranges, credentials, scan intensity
   - For Integration: API connections, authentication, scope filters
   - For Agent: Collection parameters, frequency
4. Set discovery schedule:
   - One-time discovery
   - Recurring schedule (daily, weekly, monthly)
   - Event-triggered discovery
5. Configure asset matching rules:
   - Define how discovered assets match existing inventory
   - Set confidence thresholds for automatic matching
   - Configure conflict resolution strategy
6. Set notification options:
   - Email alerts for discovery completion
   - Notification thresholds for new asset counts
   - Issue reporting parameters
7. Click **Save & Run** to start the discovery process

### Discovery Results Management

After a discovery job completes, review and manage the results:

1. Navigate to **Assets > Discovery > Results**
2. View the discovery summary:
   - Total assets discovered
   - New assets identified
   - Changed assets detected
   - Potentially retired assets
3. Process new assets:
   - Review asset details
   - Approve for addition to inventory
   - Reject false positives
   - Merge with existing asset records
4. Handle changed assets:
   - Review detected changes
   - Apply selected changes to inventory
   - Override with existing information
5. Investigate missing assets:
   - Determine if assets are offline or decommissioned
   - Mark assets as retired if confirmed
   - Schedule targeted rediscovery if needed

### Discovery Analytics

Analyze discovery data for inventory insights:

1. Navigate to **Assets > Discovery > Analytics**
2. View discovery efficiency metrics:
   - Coverage percentage
   - Discovery success rate
   - Authentication success rate
   - Average discovery time
3. Track inventory accuracy:
   - Inventory drift percentage
   - Asset attribute change frequency
   - Data quality scores
4. Generate discovery reports:
   - Coverage reports by network segment
   - Discovery trend analysis
   - Data quality metrics

## Risk Analysis

The Risk Analysis module provides advanced capabilities to assess, score, and prioritize asset risk across your environment, enabling more effective security resource allocation.

### Risk Dashboard

The Risk Dashboard offers an executive view of your asset risk landscape:

- **Risk Overview**: Distribution of assets by risk score
- **Risk Factors**: Breakdown of risk contributors
- **High-Risk Assets**: List of assets with highest risk scores
- **Risk Trends**: Changes in risk posture over time
- **Risk by Category**: Visualization of risk across asset categories

### Risk Scoring Methodology

RAS-DASH employs a comprehensive risk scoring methodology that considers multiple factors:

#### Vulnerability Factors
- **Vulnerability Count**: Number of vulnerabilities affecting the asset
- **Vulnerability Severity**: CVSS scores of identified vulnerabilities
- **Vulnerability Age**: How long vulnerabilities have remained unpatched
- **Exploitability**: Whether vulnerabilities have known exploits
- **Attack Surface**: Exposed services and open ports

#### Asset Factors
- **Asset Value**: Business importance of the asset
- **Data Sensitivity**: Classification of data stored/processed
- **Access Vector**: How the asset can be accessed
- **Network Location**: Position in network architecture
- **User Access**: Number and privilege level of users

#### Environmental Factors
- **Compensating Controls**: Mitigating security measures
- **Threat Intelligence**: Known targeting of similar assets
- **Compliance Requirements**: Regulatory obligations
- **Business Context**: Operational importance

### Configuring Risk Scoring

Customize risk scoring to align with your organization's risk framework:

1. Navigate to **Assets > Risk > Scoring Configuration**
2. Configure risk factor weights:
   - Adjust importance of vulnerability factors
   - Set weights for asset value attributes
   - Define environmental factor significance
3. Set risk score thresholds:
   - Define ranges for Critical, High, Medium, Low risk
   - Customize visual indicators for each level
4. Configure business impact assessment:
   - Define criteria for asset value calculation
   - Set data classification impact levels
   - Configure business continuity factors
5. Set up custom risk factors:
   - Create organization-specific risk attributes
   - Define scoring methodology for custom factors
   - Integrate with existing risk frameworks

### Risk Assessment Process

Perform comprehensive risk assessments on your assets:

1. Navigate to **Assets > Risk > Assessment**
2. Select assessment scope:
   - Individual assets
   - Asset groups
   - Business units
   - Location-based
3. Choose assessment methodology:
   - Automated scoring only
   - Hybrid (automated + manual)
   - Full qualitative assessment
4. Conduct assessment:
   - Review automated risk scores
   - Provide manual risk inputs where required
   - Document assessment justifications
   - Capture stakeholder input
5. Review results:
   - Examine risk scores and contributors
   - Compare with previous assessments
   - Validate against industry benchmarks
   - Identify risk trends

### Risk Reporting

Generate comprehensive risk reports for stakeholders:

1. Navigate to **Assets > Risk > Reports**
2. Select report type:
   - Executive Risk Summary
   - Detailed Risk Assessment
   - Risk Trend Analysis
   - Comparative Business Unit Risk
   - Compliance Risk Mapping
3. Configure report parameters:
   - Time period
   - Asset scope
   - Risk threshold focus
   - Comparison baselines
4. Generate and distribute reports:
   - Download in multiple formats
   - Schedule recurring distribution
   - Set up automated triggers based on risk thresholds

## Asset Settings

The Asset Settings module allows administrators to configure global asset management parameters, ensuring consistent asset handling across the platform.

### Classification Settings

Configure asset classification schema to align with your organization's taxonomy:

1. Navigate to **Assets > Settings > Classifications**
2. Manage classification levels:
   - Define tier structure (e.g., Critical, High, Medium, Low)
   - Configure criteria for each level
   - Set visual indicators and labels
3. Configure classification automation:
   - Create rules for automatic classification
   - Define confidence thresholds
   - Set review requirements for automated classifications
4. Set classification-based policies:
   - Define scan frequency by classification
   - Set patch SLAs based on classification
   - Configure required security controls by level

### Asset Types Configuration

Customize asset type definitions to match your IT environment:

1. Navigate to **Assets > Settings > Asset Types**
2. Manage standard asset types:
   - Servers, Workstations, Network Devices, etc.
   - Customize attributes for each type
   - Define required fields by type
3. Create custom asset types:
   - IoT devices, Specialized equipment, etc.
   - Define type-specific attributes
   - Configure scan methodologies by type
4. Set type-based policies:
   - Default owners by asset type
   - Type-specific security requirements
   - Reporting categories by asset type

### Custom Fields Management

Define and manage custom asset attributes:

1. Navigate to **Assets > Settings > Custom Fields**
2. Create custom fields:
   - Field name and description
   - Data type (text, number, date, dropdown, etc.)
   - Default values and constraints
   - Help text and examples
3. Configure field settings:
   - Required vs. optional fields
   - Visibility and permissions
   - Validation rules
   - Display order
4. Define field dependencies:
   - Show/hide based on other field values
   - Set conditional requirements
   - Configure cascading selections

### Integrations Configuration

Manage connections to external systems for asset data enrichment:

1. Navigate to **Assets > Settings > Integrations**
2. Configure CMDB integration:
   - Connection parameters
   - Field mapping configuration
   - Synchronization schedule
   - Conflict resolution rules
3. Set up cloud provider connections:
   - API credentials and permissions
   - Resource scope and filtering
   - Tag mapping and synchronization
   - Auto-discovery settings
4. Manage other integrations:
   - Endpoint protection platforms
   - Network management systems
   - Inventory databases
   - Enterprise directories

### Automation Rules

Create automation rules to streamline asset management processes:

1. Navigate to **Assets > Settings > Automation**
2. Configure asset lifecycle rules:
   - Auto-retirement based on inactivity
   - Automatic ownership assignment
   - Group membership rules
   - Notification triggers
3. Set up data quality rules:
   - Required field validation
   - Data format enforcement
   - Duplicate detection
   - Data enrichment workflows
4. Define security automation:
   - Automatic scan scheduling
   - Risk score recalculation triggers
   - Security control verification
   - Compensating control association

## Best Practices

Optimize your asset management by following these best practices:

### Discovery Best Practices
- Run network discovery on a regular schedule (weekly or monthly)
- Use multiple discovery methods for comprehensive coverage
- Implement credential rotation for authenticated scans
- Continuously validate discovery coverage against expected inventory
- Create business processes for handling newly discovered assets

### Risk Analysis Best Practices
- Review and adjust risk scoring weights quarterly
- Validate automated risk scores with manual assessments for critical assets
- Include business stakeholders in risk evaluation processes
- Document risk acceptance decisions with appropriate approvals
- Establish clear escalation paths for critical risk findings
- Implement regular risk review meetings with security stakeholders

### Asset Settings Best Practices
- Keep asset type definitions aligned with organizational CMDB standards
- Limit custom fields to those with clear business or security value
- Document the purpose and usage of each custom field
- Regularly review and clean up unused custom fields or integrations
- Maintain clear ownership for asset data quality
- Establish formal review cycles for automation rules
- Create test processes for new automation rules before production deployment

---

By leveraging the advanced Discovery, Risk Analysis, and Settings capabilities in RAS-DASH, organizations can build and maintain an accurate asset inventory, understand their risk exposure, and implement consistent asset management practices across the enterprise.