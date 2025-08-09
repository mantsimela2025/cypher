# STIG Selection and Automated Download Strategy

## Overview

This document outlines a comprehensive approach for programmatically selecting and downloading Security Technical Implementation Guides (STIGs) based on asset information from Tenable vulnerability scans. The solution leverages existing asset metadata to make intelligent STIG selections without requiring AI, providing automated compliance guidance for discovered systems.

## Current Asset Data Available from Tenable Integration

### Core Asset Information
From our Tenable integration, we have access to rich asset metadata including:

#### Operating System Information
- **Operating System**: Full OS name and version (e.g., "Windows Server 2019", "Ubuntu 20.04 LTS")
- **System Type**: Asset classification (domain-controller, web-server, database-server)
- **OS Family**: Windows, Linux, Unix variants

#### Network and Infrastructure Data
- **Hostname/FQDN**: System identification
- **IP Address**: Network location
- **Network Services**: Running services detected by scans
- **Open Ports**: Service port mappings

#### Software and Application Discovery
- **Installed Software**: Applications and versions detected
- **Service Detection**: Web servers, databases, directory services
- **Security Agent Status**: Endpoint protection presence

#### Cloud and Virtualization Metadata
- **AWS Instance Data**: Instance type, AMI ID, region, VPC
- **Azure VM Information**: Resource IDs and configurations
- **Virtualization Platform**: VMware, Hyper-V detection

## STIG Selection Decision Tree

### Primary Selection Criteria

#### 1. Operating System Mapping
The most fundamental STIG selection is based on the operating system:

**Windows Systems**
- Windows 10 → "Microsoft Windows 10 STIG"
- Windows 11 → "Microsoft Windows 11 STIG"
- Windows Server 2016 → "Microsoft Windows Server 2016 STIG"
- Windows Server 2019 → "Microsoft Windows Server 2019 STIG"
- Windows Server 2022 → "Microsoft Windows Server 2022 STIG"

**Linux Systems**
- Ubuntu 18.04 → "Canonical Ubuntu 18.04 LTS STIG"
- Ubuntu 20.04 → "Canonical Ubuntu 20.04 LTS STIG"
- Ubuntu 22.04 → "Canonical Ubuntu 22.04 LTS STIG"
- Red Hat Enterprise Linux 7 → "Red Hat Enterprise Linux 7 STIG"
- Red Hat Enterprise Linux 8 → "Red Hat Enterprise Linux 8 STIG"
- Red Hat Enterprise Linux 9 → "Red Hat Enterprise Linux 9 STIG"
- SUSE Linux Enterprise Server 15 → "SUSE Linux Enterprise Server 15 STIG"

#### 2. Application-Specific STIGs
Based on detected services and software:

**Web Servers**
- Apache HTTP Server → "Apache Server 2.4 STIG"
- Microsoft IIS → "Microsoft IIS 10.0 Server STIG"
- NGINX → "NGINX STIG" (if available)

**Database Systems**
- Microsoft SQL Server → "Microsoft SQL Server 2019 Instance STIG"
- Oracle Database → "Oracle Database 12c STIG"
- MySQL → "MySQL Enterprise 8.0 STIG"
- PostgreSQL → "PostgreSQL 9.x STIG"

**Directory Services**
- Active Directory → "Microsoft Windows Server 2019 Domain Controller STIG"
- OpenLDAP → "Application Security and Development STIG"

**Mail Systems**
- Microsoft Exchange → "Microsoft Exchange Server 2019 STIG"
- Postfix/Sendmail → "Application Security and Development STIG"

#### 3. Infrastructure Component STIGs

**Network Devices**
- Cisco IOS → "Cisco IOS Router STIG"
- Cisco NX-OS → "Cisco NX-OS Switch STIG"
- Palo Alto Networks → "Palo Alto Networks Firewall STIG"

**Virtualization Platforms**
- VMware vSphere → "VMware vSphere 8.0 STIG"
- Microsoft Hyper-V → "Microsoft Windows Server 2019 Hyper-V STIG"

**Cloud Services**
- AWS EC2 → Operating System STIG + "Amazon Web Services EC2 STIG"
- Azure VMs → Operating System STIG + cloud-specific hardening

## Implementation Strategy

### 1. STIG Mapping Database

Create a comprehensive mapping table that links asset characteristics to applicable STIGs:

```sql
CREATE TABLE stig_mappings (
    id SERIAL PRIMARY KEY,
    operating_system VARCHAR(255),
    os_version VARCHAR(100),
    application_name VARCHAR(255),
    application_version VARCHAR(100),
    system_type VARCHAR(100),
    stig_id VARCHAR(100) NOT NULL,
    stig_title VARCHAR(500) NOT NULL,
    stig_version VARCHAR(50),
    priority INTEGER DEFAULT 1,
    download_url VARCHAR(1000),
    file_type VARCHAR(20) DEFAULT 'zip',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Asset Analysis Service

Develop a service that analyzes Tenable asset data and returns applicable STIGs:

**Input**: Asset record from Tenable
**Processing**: 
1. Parse operating system and version
2. Identify running services and applications
3. Determine system role/type
4. Apply STIG mapping rules
5. Return prioritized list of applicable STIGs

**Output**: Ranked list of STIGs with download information

### 3. STIG Download Automation

#### DISA Public Portal Integration
- **Base URL**: `https://public.cyber.mil/stigs/downloads/`
- **Method**: Web scraping with respectful rate limiting
- **Parsing**: Extract download links for specific STIGs
- **Caching**: Local storage to avoid repeated downloads

#### NIST NCP Integration
- **Base URL**: `https://ncp.nist.gov/checklist/[ID]`
- **Method**: Structured API access where available
- **Metadata**: Enhanced STIG information and relationships

### 4. STIG Processing Pipeline

#### Download Management
1. **Queue System**: Manage download requests to avoid overwhelming servers
2. **Retry Logic**: Handle temporary failures gracefully
3. **Validation**: Verify downloaded files are complete and valid
4. **Storage**: Organize STIGs by type, version, and date

#### Content Processing
1. **Extract**: Unzip STIG packages to access XCCDF files
2. **Parse**: Extract metadata, rules, and requirements
3. **Index**: Create searchable database of STIG content
4. **Integration**: Link STIG requirements to asset configurations

## STIG Selection Algorithm

### Rule-Based Selection Process

```javascript
function selectSTIGsForAsset(asset) {
    const applicableSTIGs = [];
    
    // 1. Primary OS STIG (always required)
    const osSTIG = mapOperatingSystemToSTIG(asset.operatingSystem);
    if (osSTIG) {
        applicableSTIGs.push({
            stig: osSTIG,
            priority: 1,
            reason: 'Primary operating system hardening'
        });
    }
    
    // 2. Application-specific STIGs
    const services = detectServices(asset);
    services.forEach(service => {
        const appSTIG = mapServiceToSTIG(service);
        if (appSTIG) {
            applicableSTIGs.push({
                stig: appSTIG,
                priority: 2,
                reason: `Application hardening for ${service.name}`
            });
        }
    });
    
    // 3. Role-based STIGs
    const systemRole = determineSystemRole(asset);
    const roleSTIG = mapRoleToSTIG(systemRole);
    if (roleSTIG) {
        applicableSTIGs.push({
            stig: roleSTIG,
            priority: 2,
            reason: `Role-specific hardening for ${systemRole}`
        });
    }
    
    // 4. Cloud-specific STIGs
    if (asset.cloudProvider) {
        const cloudSTIG = mapCloudToSTIG(asset.cloudProvider);
        if (cloudSTIG) {
            applicableSTIGs.push({
                stig: cloudSTIG,
                priority: 3,
                reason: `Cloud platform hardening for ${asset.cloudProvider}`
            });
        }
    }
    
    return applicableSTIGs.sort((a, b) => a.priority - b.priority);
}
```

### Confidence Scoring

Each STIG selection includes a confidence score based on:
- **Exact Match** (100%): Direct OS/application version match
- **Version Compatible** (90%): Compatible version within same major release
- **Generic Match** (75%): General category match (e.g., Linux STIG for unknown Linux variant)
- **Inferred Match** (60%): Based on service detection or system behavior

## Integration with STIG Viewer

### Automated Loading Process

1. **Asset Selection**: User selects asset from inventory
2. **STIG Analysis**: System analyzes asset and identifies applicable STIGs
3. **Download Check**: Verify if STIGs are already cached locally
4. **Automatic Download**: Fetch missing STIGs from DISA/NIST sources
5. **Viewer Integration**: Load STIGs into existing STIG viewer component
6. **Compliance Assessment**: Cross-reference current configuration against STIG requirements

### User Experience Flow

```
Asset Inventory → Select Asset → Analyze STIGs → Download if Needed → View in STIG Viewer
     ↓                ↓              ↓               ↓                    ↓
[Asset List]    [Asset Details]  [STIG List]   [Download Progress]  [STIG Viewer]
```

### STIG Viewer Enhancements

#### Asset Context Integration
- **Asset Information Panel**: Display current asset details alongside STIG requirements
- **Compliance Status**: Show current compliance state for each STIG rule
- **Configuration Comparison**: Compare current settings against STIG baselines
- **Remediation Guidance**: Provide specific steps for the selected asset

#### Multi-STIG Management
- **STIG Tabs**: Multiple tabs for different applicable STIGs
- **Priority Ordering**: Display STIGs by importance and compliance gaps
- **Cross-STIG References**: Handle overlapping requirements between STIGs
- **Composite View**: Unified view of all requirements for comprehensive hardening

## Benefits of This Approach

### 1. Automated Accuracy
- **Deterministic Selection**: Consistent STIG selection based on clear rules
- **Real-time Updates**: Automatic refreshing as asset information changes
- **Comprehensive Coverage**: Ensures all relevant STIGs are identified

### 2. Operational Efficiency
- **Zero Manual Lookup**: Eliminates manual STIG research and selection
- **Bulk Processing**: Handle multiple assets simultaneously
- **Proactive Compliance**: Identify compliance requirements before audits

### 3. Enhanced Compliance Management
- **Asset-Specific Guidance**: Tailored hardening requirements for each system
- **Version Accuracy**: Correct STIG versions for specific software releases
- **Layered Security**: Multiple applicable STIGs for comprehensive protection

### 4. Cost Reduction
- **Reduced Labor**: Automate time-intensive manual processes
- **Faster Implementation**: Immediate access to relevant hardening guides
- **Improved Accuracy**: Reduce human error in STIG selection

## Technical Implementation Requirements

### Database Extensions
- STIG mapping tables for rule-based selection
- Asset-STIG relationship tracking
- Download cache management
- Compliance status tracking

### Service Architecture
- STIGSelectionService for asset analysis
- STIGDownloadService for automated retrieval
- STIGCacheService for local storage management
- STIGViewerService for integration with existing viewer

### API Endpoints
- `/api/assets/{id}/stigs` - Get applicable STIGs for asset
- `/api/stigs/download/{id}` - Download specific STIG
- `/api/stigs/bulk-download` - Download multiple STIGs
- `/api/stigs/cache/status` - Check local STIG cache status

### Frontend Components
- AssetSTIGSelector for STIG selection interface
- STIGDownloadProgress for download status
- Enhanced STIGViewer with asset context
- ComplianceOverview for multi-STIG management

## Success Metrics

### Automation Efficiency
- **STIG Selection Accuracy**: >95% correct STIG identification
- **Download Success Rate**: >98% successful automated downloads
- **Processing Time**: <30 seconds from asset selection to STIG viewing

### User Experience
- **Time Savings**: 90% reduction in manual STIG research time
- **Compliance Coverage**: 100% of applicable STIGs identified automatically
- **User Adoption**: Integration with existing workflows and tools

### Compliance Impact
- **Faster Hardening**: Immediate access to relevant security requirements
- **Complete Coverage**: No missed STIGs due to manual oversight
- **Audit Readiness**: Continuous compliance monitoring and reporting

## Next Steps

1. **Database Schema Development**: Create STIG mapping tables and relationships
2. **Service Implementation**: Build STIG selection and download services
3. **Frontend Integration**: Enhance existing STIG viewer with automated capabilities
4. **Testing and Validation**: Verify accuracy across diverse asset types
5. **User Training**: Provide guidance on new automated capabilities

This approach transforms STIG compliance from a manual, error-prone process into an automated, comprehensive security management capability that scales across entire enterprise environments.