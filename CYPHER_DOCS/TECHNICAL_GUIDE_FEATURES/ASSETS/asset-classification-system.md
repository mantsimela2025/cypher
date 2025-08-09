# Asset Classification System

This document details the automated asset classification and tagging system implemented in the vulnerability management platform.

## 1. Overview

The asset classification system automatically categorizes and tags assets based on their discovered attributes, providing rich context for risk analysis, vulnerability prioritization, and security operations.

## 2. Classification Process

### 2.1 Asset Discovery Methods

Assets are discovered through multiple methods:

- **Network-based discovery**
  - IP range scanning
  - Port scanning
  - Server scanning
  - Service detection

- **Active Directory integration**
  - Computer accounts
  - Server objects
  - Organizational units

- **Cloud provider discovery**
  - AWS resources (EC2, S3, RDS, etc.)
  - Azure resources (VMs, Storage Accounts, etc.)
  - GCP resources (Compute Engine, Cloud Storage, etc.)

- **Agent-based discovery**
  - Installed agents report detailed system information
  - Software inventory
  - Configuration details

### 2.2 Classification Logic

The system applies multiple classification rules to each discovered asset:

1. **Asset Type Classification**
   - Based on existing asset type information
   - Maps to predefined categories (server, workstation, network device, etc.)
   - Adds appropriate tags (critical-infrastructure, endpoint, etc.)

2. **Operating System Classification**
   - Detects OS family (Windows, Linux, macOS, BSD, etc.)
   - Identifies server vs. client systems
   - Recognizes specific versions and distributions
   - Adds corresponding tags (windows, linux, ubuntu, windows-server, etc.)

3. **Service-based Classification**
   - Analyzes detected services (HTTP, SMTP, DNS, etc.)
   - Maps services to functional roles (web server, mail server, etc.)
   - Adds service-specific tags (web, mail, database, etc.)

4. **Port Analysis**
   - Examines open ports
   - Identifies common service ports (80/443 for web, 22 for SSH, etc.)
   - Adds port-specific tags (http, ssh, etc.)
   - Flags publicly accessible services

5. **Cloud Provider Classification**
   - Identifies cloud provider (AWS, Azure, GCP)
   - Categorizes by service type (compute, storage, database)
   - Tags with provider-specific information (region, account)
   - Identifies publicly accessible resources

6. **Hostname Pattern Analysis**
   - Parses hostname for meaningful patterns
   - Detects common naming conventions (web, db, app, etc.)
   - Identifies environment indicators (dev, test, prod)
   - Adds function and environment tags

## 3. Classification Categories

### 3.1 Primary Asset Types

The system assigns one of the following primary asset types:

- **Servers**
  - Web Server
  - Database Server
  - File Server
  - Mail Server
  - Domain Controller
  - Application Server

- **Endpoints**
  - Workstation
  - Laptop
  - Desktop
  - Mobile Device

- **Network Devices**
  - Router
  - Switch
  - Firewall
  - Load Balancer
  - VPN Gateway

- **Cloud Resources**
  - Cloud Instance
  - Storage Bucket
  - Database Instance
  - Serverless Function
  - Container

- **IoT/Embedded Devices**
  - IoT Device
  - Embedded System
  - Control System
  - SCADA Component

### 3.2 Criticality Determination

Asset criticality is determined through multiple factors:

- **Explicit Assignment**
  - Manual assignment during asset registration
  - Import from CMDB or other asset management systems

- **Role-based Determination**
  - Domain controllers automatically classified as Critical or High
  - Production database servers as Critical or High
  - Development/test systems as Medium or Low

- **Data Sensitivity**
  - Systems with PII/PHI/PCI data treated as Critical
  - Systems with intellectual property as High
  - Public-facing systems with no sensitive data as Medium

- **Connectivity Pattern**
  - Highly connected systems (many dependencies) get higher criticality
  - Internet-facing systems with critical services get higher criticality

- **Business Function**
  - Systems supporting critical business functions get higher criticality
  - Revenue-generating systems typically classified as Critical or High

## 4. Tagging System

### 4.1 Tag Categories

The asset classification system applies tags in the following categories:

- **OS Tags**: windows, linux, ubuntu, windows-server, etc.
- **Service Tags**: http, https, ssh, mysql, smb, etc.
- **Role Tags**: web, database, file, mail, directory-services, etc.
- **Environment Tags**: production, development, testing, staging, etc.
- **Location Tags**: region-us-east-1, datacenter-primary, etc.
- **Access Tags**: public, internal, has-open-ports, etc.
- **Provider Tags**: aws, gcp, azure, etc.
- **Function Tags**: critical-infrastructure, business-critical, etc.

### 4.2 Tag Usage

Tags are utilized throughout the system for:

- **Filtering and searching** assets
- **Grouping** assets for reporting
- **Vulnerability prioritization** based on tagged attributes
- **Risk score adjustment** based on tags like "business-critical"
- **Automated remediation routing** to appropriate teams
- **Compliance reporting** for regulated systems

## 5. Classification Rules

Asset classification applies these key decision rules:

### 5.1 Server Detection Rules

- Systems with web server services (HTTP, HTTPS, Nginx, Apache, IIS, Tomcat) → Web Server
- Systems with database services (MySQL, PostgreSQL, MSSQL, Oracle, MongoDB) → Database Server
- Systems with file sharing protocols (FTP, NFS, SMB, CIFS) → File Server
- Systems with mail services (SMTP, POP3, IMAP, Exchange) → Mail Server
- Systems with directory services (LDAP, Kerberos, DNS, Active Directory) → Domain Controller

### 5.2 Network Device Rules

- Systems with network OS (Cisco IOS, JunOS, FortiOS) → Network Device
- Systems with SNMP, Telnet management interfaces → Network Device
- Systems with multiple network interfaces and routing/switching functions → Network Device

### 5.3 Workstation Rules

- Windows client OS → Workstation
- macOS systems → Workstation
- Linux systems without server roles → Workstation
- Systems with RDP client, standard user applications → Workstation

### 5.4 Cloud Resource Rules

- Resources with AWS EC2 metadata → Cloud Instance
- Resources with S3 bucket properties → Storage Bucket
- Resources with RDS attributes → Database Instance
- Resources with Lambda characteristics → Serverless Function

## 6. Implementation

The asset classification system is implemented in the following components:

- **Scanner Module**: `scanner/lib/utils/asset-classifier.js`
- **Asset Discovery Command**: `scanner/commands/asset-discovery.js`
- **Classification Methods**:
  - `classifyAsset()`: Main classification function
  - `_classifyByAssetType()`: Type-based classification
  - `_classifyByOperatingSystem()`: OS-based classification
  - `_classifyByServices()`: Service-based classification
  - `_classifyByPorts()`: Port-based classification
  - `_classifyByCloudProvider()`: Cloud resource classification
  - `_classifyByHostname()`: Hostname pattern classification

## 7. Classification Results

The classification system produces:

- **Updated asset records** with enriched metadata
- **Comprehensive tagging** for each asset
- **Accurate asset type assignment**
- **Environment classification**
- **Criticality assessment**
- **Function identification**

These results enable more accurate vulnerability risk scoring, better prioritization of remediation efforts, and more efficient security operations.