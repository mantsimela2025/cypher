# Tenable API Integration Guide for RAS-DASH
## Complete Setup and Data Consumption Guide

### Table of Contents
1. [Getting Started](#getting-started)
2. [API Authentication Setup](#api-authentication-setup)
3. [Development Environment Setup](#development-environment-setup)
4. [Asset Data Consumption](#asset-data-consumption)
5. [Vulnerability Data Consumption](#vulnerability-data-consumption)
6. [Data Volume Management](#data-volume-management)
7. [Best Practices](#best-practices)
8. [Integration with RAS-DASH](#integration-with-ras-dash)
9. [Troubleshooting](#troubleshooting)
10. [Production Considerations](#production-considerations)

---

## Getting Started

### Overview
This guide provides complete instructions for integrating Tenable's Vulnerability Management API into the RAS-DASH platform. Tenable's API provides access to comprehensive asset inventory, vulnerability data, scan results, and security metrics that will enhance RAS-DASH's cybersecurity intelligence capabilities.

### Prerequisites
- Node.js 16 or later
- Network access to cloud.tenable.com
- Basic understanding of REST APIs
- RAS-DASH development environment

### What You'll Get Access To
- **Asset Inventory**: Complete asset discovery and inventory data
- **Vulnerability Data**: Detailed vulnerability information with CVSS scores
- **Scan Results**: Historical and real-time scan data
- **Compliance Data**: Regulatory compliance status and findings
- **Risk Metrics**: Risk scoring and prioritization data

---

## API Authentication Setup

### Step 1: Create Tenable Account
1. **Visit** [cloud.tenable.com](https://cloud.tenable.com)
2. **Sign up** for the 60-day free trial
3. **Complete** account verification
4. **Log in** to your new account

### Step 2: Generate API Keys
1. **Click** your user profile icon (upper-right corner)
2. **Navigate** to "My Account" → "API Keys"
3. **Click** "Generate" button
4. **Copy** both ACCESS KEY and SECRET KEY immediately
5. **Store** keys securely (you cannot retrieve them later)

**Important Notes:**
- Each account can only have one API key pair at a time
- Generating new keys invalidates existing keys
- Treat these keys like passwords - store them securely

### Step 3: Test API Connection
```bash
# Test connection using curl
curl -H "X-ApiKeys: accesskey=YOUR_ACCESS_KEY; secretkey=YOUR_SECRET_KEY" \
     -H "Content-Type: application/json" \
     https://cloud.tenable.com/session
```

Expected response:
```json
{
  "id": "user-id",
  "username": "your-email@domain.com",
  "email": "your-email@domain.com",
  "name": "Your Name",
  "type": "local",
  "container_uuid": "container-uuid",
  "permissions": 64,
  "user_name": "your-email@domain.com",
  "login_fail_count": 0,
  "login_fail_total": 0,
  "enabled": true,
  "lastlogin": 1547152640
}
```

---

## Development Environment Setup

### Step 1: Install Required Packages
```bash
# Install HTTP client and utilities
npm install axios dotenv
npm install --save-dev @types/node typescript

# Verify installation
node -e "console.log('Node.js packages installed successfully')"
```

### Step 2: Environment Configuration
Create a `.env` file for your API keys:
```bash
# .env file
TENABLE_ACCESS_KEY=your_access_key_here
TENABLE_SECRET_KEY=your_secret_key_here
```

### Step 3: Basic Connection Test
```typescript
// test_tenable_connection.ts
import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class TenableClient {
    private client: AxiosInstance;
    
    constructor(accessKey: string, secretKey: string) {
        this.client = axios.create({
            baseURL: 'https://cloud.tenable.com',
            headers: {
                'X-ApiKeys': `accesskey=${accessKey}; secretkey=${secretKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'RAS-DASH-Cybersecurity-Platform/1.0.0'
            }
        });
    }
    
    async testConnection() {
        try {
            const response = await this.client.get('/session');
            return response.data;
        } catch (error) {
            throw new Error(`Connection failed: ${error.response?.data?.error || error.message}`);
        }
    }
    
    async getScans() {
        try {
            const response = await this.client.get('/scans');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get scans: ${error.response?.data?.error || error.message}`);
        }
    }
}

async function testTenableConnection() {
    try {
        const client = new TenableClient(
            process.env.TENABLE_ACCESS_KEY!,
            process.env.TENABLE_SECRET_KEY!
        );
        
        // Test connection
        const userInfo = await client.testConnection();
        console.log(`✅ Connected successfully as: ${userInfo.email}`);
        
        // Get basic statistics
        const scans = await client.getScans();
        console.log(`📊 Available scans: ${scans.scans.length}`);
        
        return true;
        
    } catch (error) {
        console.error(`❌ Connection failed: ${error.message}`);
        return false;
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testTenableConnection();
}

export { TenableClient, testTenableConnection };
```

---

## Asset Data Consumption

### Understanding Asset Data Structure
Tenable assets contain comprehensive information about discovered systems:

```python
# Asset data structure example
{
    "id": "asset-uuid",
    "has_agent": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2025-01-15T12:00:00.000Z",
    "first_seen": "2023-01-01T00:00:00.000Z",
    "last_seen": "2025-01-15T12:00:00.000Z",
    "first_scan_time": "2023-01-01T00:00:00.000Z",
    "last_scan_time": "2025-01-15T12:00:00.000Z",
    "last_authenticated_scan_date": "2025-01-15T12:00:00.000Z",
    "last_licensed_scan_date": "2025-01-15T12:00:00.000Z",
    "azure_vm_id": null,
    "azure_resource_id": null,
    "aws_ec2_instance_ami_id": "ami-12345678",
    "aws_ec2_instance_id": "i-1234567890abcdef0",
    "aws_owner_id": "123456789012",
    "aws_availability_zone": "us-east-1a",
    "aws_region": "us-east-1",
    "aws_vpc_id": "vpc-12345678",
    "aws_ec2_instance_group_name": "production-web-servers",
    "aws_ec2_instance_state_name": "running",
    "aws_ec2_instance_type": "t3.medium",
    "aws_subnet_id": "subnet-12345678",
    "aws_ec2_product_code": null,
    "aws_ec2_name": "web-server-01",
    "bios_uuid": "12345678-1234-1234-1234-123456789abc",
    "network_id": "network-uuid",
    "network_name": "Corporate Network",
    "exposure_score": 750,
    "acr_score": 8,
    "criticality_rating": "high",
    "ipv4": ["192.168.1.100"],
    "ipv6": [],
    "fqdn": ["web-server-01.company.com"],
    "netbios_name": "WEB-SERVER-01",
    "operating_system": ["Microsoft Windows Server 2019"],
    "system_type": ["general-purpose"],
    "hostname": ["web-server-01"],
    "agent_uuid": ["agent-uuid"],
    "last_authenticated_results": ["2025-01-15T12:00:00.000Z"],
    "last_unauthenticated_results": ["2025-01-15T12:00:00.000Z"],
    "mac_address": ["00:0c:29:12:34:56"],
    "manufacturer_tpm_id": ["tpm-id"],
    "qualys_asset_id": null,
    "qualys_host_id": null,
    "servicenow_sysid": null,
    "sources": [
        {
            "name": "NESSUS_AGENT",
            "first_seen": "2023-01-01T00:00:00.000Z",
            "last_seen": "2025-01-15T12:00:00.000Z"
        }
    ],
    "tags": [
        {
            "key": "Environment",
            "value": "Production",
            "added_by": "user-uuid",
            "added_at": "2023-01-01T00:00:00.000Z"
        }
    ],
    "network_interfaces": [
        {
            "name": "Ethernet0",
            "virtual": false,
            "ipv4": ["192.168.1.100"],
            "ipv6": [],
            "mac_address": ["00:0c:29:12:34:56"]
        }
    ]
}
```

### Retrieving Asset Data

#### Method 1: Simple Asset List (Small Datasets)
```typescript
async function getAssetList(): Promise<any[]> {
    /**
     * Get basic asset list - good for small environments
     */
    try {
        const client = new TenableClient(
            process.env.TENABLE_ACCESS_KEY!,
            process.env.TENABLE_SECRET_KEY!
        );
        
        // Get asset list
        const response = await client.client.get('/assets');
        const assets = response.data.assets;
        
        console.log(`Found ${assets.length} assets`);
        
        // Show first 5 assets
        assets.slice(0, 5).forEach((asset: any) => {
            const hostname = asset.hostname?.[0] || 'Unknown';
            const ip = asset.ipv4?.[0] || 'N/A';
            console.log(`Asset: ${hostname} - IP: ${ip}`);
        });
        
        return assets;
        
    } catch (error) {
        console.error(`Error retrieving assets: ${error.message}`);
        return [];
    }
}
```

#### Method 2: Asset Export (Large Datasets - Recommended)
```typescript
async function exportAssets(): Promise<any[]> {
    /**
     * Export assets using chunked approach - recommended for production
     */
    try {
        const client = new TenableClient(
            process.env.TENABLE_ACCESS_KEY!,
            process.env.TENABLE_SECRET_KEY!
        );
        
        // Request asset export
        const exportRequest = {
            chunk_size: 4000,  // Optimal chunk size
            filters: {
                updated_since: '2024-01-01'  // Only get recent updates
            }
        };
        
        const exportResponse = await client.client.post('/assets/export', exportRequest);
        const exportUuid = exportResponse.data.export_uuid;
        
        console.log(`Asset export started: ${exportUuid}`);
        
        // Wait for export to complete
        await waitForExportCompletion(client, exportUuid);
        
        // Download chunks
        const allAssets = await downloadExportChunks(client, exportUuid);
        
        console.log(`Total assets exported: ${allAssets.length}`);
        return allAssets;
        
    } catch (error) {
        console.error(`Error exporting assets: ${error.message}`);
        return [];
    }
}

async function waitForExportCompletion(client: TenableClient, exportUuid: string): Promise<void> {
    const maxWaitTime = 600000; // 10 minutes
    const pollInterval = 5000;   // 5 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const statusResponse = await client.client.get(`/assets/export/${exportUuid}/status`);
            const status = statusResponse.data.status;
            
            console.log(`Export status: ${status}`);
            
            if (status === 'FINISHED') {
                return;
            } else if (status === 'ERROR') {
                throw new Error('Export failed');
            }
            
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            
        } catch (error) {
            throw new Error(`Error checking export status: ${error.message}`);
        }
    }
    
    throw new Error('Export timeout');
}

async function downloadExportChunks(client: TenableClient, exportUuid: string): Promise<any[]> {
    const allAssets: any[] = [];
    let chunkId = 1;
    
    while (true) {
        try {
            const chunkResponse = await client.client.get(`/assets/export/${exportUuid}/chunks/${chunkId}`);
            const chunk = chunkResponse.data;
            
            if (!chunk || chunk.length === 0) {
                break;
            }
            
            allAssets.push(...chunk);
            console.log(`Downloaded chunk ${chunkId} with ${chunk.length} assets`);
            chunkId++;
            
        } catch (error) {
            if (error.response?.status === 404) {
                // No more chunks
                break;
            }
            throw new Error(`Error downloading chunk ${chunkId}: ${error.message}`);
        }
    }
    
    return allAssets;
}
```

#### Method 3: Filtered Asset Export
```python
def export_filtered_assets():
    """Export assets with specific filters"""
    try:
        tio = TenableIO(
            access_key=os.getenv('TENABLE_ACCESS_KEY'),
            secret_key=os.getenv('TENABLE_SECRET_KEY')
        )
        
        # Define filters
        filters = {
            'has_agent': True,  # Only assets with agents
            'operating_systems': ['Windows', 'Linux'],  # Specific OS types
            'tags': ['Environment:Production'],  # Production assets only
            'updated_since': '2025-01-01'  # Recent updates only
        }
        
        # Request filtered export
        export_uuid = tio.exports.assets(
            chunk_size=2000,
            filters=filters
        )
        
        assets = []
        for chunk in tio.exports.download_chunks(export_uuid):
            assets.extend(chunk)
            
        return assets
        
    except Exception as e:
        print(f"Error with filtered export: {str(e)}")
        return []
```

---

## Vulnerability Data Consumption

### Understanding Vulnerability Data Structure
Vulnerability data provides detailed security findings:

```python
# Vulnerability data structure example
{
    "asset": {
        "id": "asset-uuid",
        "uuid": "asset-uuid",
        "hostname": "web-server-01.company.com",
        "fqdn": "web-server-01.company.com",
        "ipv4": "192.168.1.100",
        "ipv6": null,
        "netbios_name": "WEB-SERVER-01",
        "operating_system": "Microsoft Windows Server 2019",
        "agent_uuid": "agent-uuid",
        "last_authenticated_results": "2025-01-15T12:00:00.000Z"
    },
    "plugin": {
        "id": 19506,
        "name": "Nessus Scan Information",
        "family": "Settings",
        "modification_date": "2025-01-01",
        "publication_date": "1999-01-01",
        "risk_factor": "None",
        "solution": "n/a",
        "synopsis": "This plugin displays information about the Nessus scan.",
        "description": "This plugin displays, for each target, information about how the scan was performed, such as:\n\n- Which credential types were used\n- The port range that was scanned\n- The duration of the scan\n- etc.",
        "see_also": [],
        "version": "1.0"
    },
    "scan": {
        "id": 12345,
        "uuid": "scan-uuid",
        "schedule_id": "schedule-uuid",
        "started_at": "2025-01-15T10:00:00.000Z",
        "completed_at": "2025-01-15T12:00:00.000Z"
    },
    "output": "Nessus version : 10.4.2 (#68)\nPlugin feed version : 202501150947\n...",
    "severity": "info",
    "severity_id": 0,
    "severity_default_id": 0,
    "severity_modification_type": "none",
    "first_found": "2023-01-01T00:00:00.000Z",
    "last_found": "2025-01-15T12:00:00.000Z",
    "state": "open",
    "indexed": "2025-01-15T12:30:00.000Z"
}
```

### Retrieving Vulnerability Data

#### Method 1: Workbench Vulnerabilities (Small Datasets)
```typescript
async function getVulnerabilitySummary(): Promise<any> {
    /**
     * Get vulnerability summary from workbench - good for dashboards
     */
    try {
        const client = new TenableClient(
            process.env.TENABLE_ACCESS_KEY!,
            process.env.TENABLE_SECRET_KEY!
        );
        
        // Get vulnerability summary
        const response = await client.client.get('/workbenches/vulnerabilities');
        const vulns = response.data;
        
        // Organize by severity
        const severityCounts: { [key: string]: number } = {};
        
        vulns.vulnerabilities.forEach((vuln: any) => {
            const severity = vuln.severity_name;
            severityCounts[severity] = (severityCounts[severity] || 0) + vuln.count;
        });
        
        console.log("Vulnerability Summary:");
        Object.entries(severityCounts).forEach(([severity, count]) => {
            console.log(`  ${severity.charAt(0).toUpperCase() + severity.slice(1)}: ${count}`);
        });
        
        return vulns;
        
    } catch (error) {
        console.error(`Error retrieving vulnerability summary: ${error.message}`);
        return {};
    }
}
```

#### Method 2: Vulnerability Export (Large Datasets - Recommended)
```typescript
async function exportVulnerabilities(): Promise<any[]> {
    /**
     * Export detailed vulnerability data - recommended for production
     */
    try {
        const client = new TenableClient(
            process.env.TENABLE_ACCESS_KEY!,
            process.env.TENABLE_SECRET_KEY!
        );
        
        // Request vulnerability export
        const exportRequest = {
            filters: {
                severity: ['critical', 'high', 'medium'],  // Filter by severity
                state: ['open'],  // Only open vulnerabilities
                since: 7  // Last 7 days
            }
        };
        
        const exportResponse = await client.client.post('/vulns/export', exportRequest);
        const exportUuid = exportResponse.data.export_uuid;
        
        console.log(`Vulnerability export started: ${exportUuid}`);
        
        // Wait for export to complete
        await waitForVulnExportCompletion(client, exportUuid);
        
        // Download vulnerability data
        const allVulns = await downloadVulnExportChunks(client, exportUuid);
        
        console.log(`Total vulnerabilities exported: ${allVulns.length}`);
        return allVulns;
        
    } catch (error) {
        console.error(`Error exporting vulnerabilities: ${error.message}`);
        return [];
    }
}

async function waitForVulnExportCompletion(client: TenableClient, exportUuid: string): Promise<void> {
    const maxWaitTime = 600000; // 10 minutes
    const pollInterval = 5000;   // 5 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const statusResponse = await client.client.get(`/vulns/export/${exportUuid}/status`);
            const status = statusResponse.data.status;
            
            console.log(`Vulnerability export status: ${status}`);
            
            if (status === 'FINISHED') {
                return;
            } else if (status === 'ERROR') {
                throw new Error('Vulnerability export failed');
            }
            
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            
        } catch (error) {
            throw new Error(`Error checking vulnerability export status: ${error.message}`);
        }
    }
    
    throw new Error('Vulnerability export timeout');
}

async function downloadVulnExportChunks(client: TenableClient, exportUuid: string): Promise<any[]> {
    const allVulns: any[] = [];
    let chunkId = 1;
    
    while (true) {
        try {
            const chunkResponse = await client.client.get(`/vulns/export/${exportUuid}/chunks/${chunkId}`);
            const chunk = chunkResponse.data;
            
            if (!chunk || chunk.length === 0) {
                break;
            }
            
            allVulns.push(...chunk);
            console.log(`Downloaded chunk ${chunkId} with ${chunk.length} vulnerabilities`);
            chunkId++;
            
        } catch (error) {
            if (error.response?.status === 404) {
                // No more chunks
                break;
            }
            throw new Error(`Error downloading vulnerability chunk ${chunkId}: ${error.message}`);
        }
    }
    
    return allVulns;
}
```

#### Method 3: Asset-Specific Vulnerabilities
```python
def get_asset_vulnerabilities(asset_id):
    """Get vulnerabilities for a specific asset"""
    try:
        tio = TenableIO(
            access_key=os.getenv('TENABLE_ACCESS_KEY'),
            secret_key=os.getenv('TENABLE_SECRET_KEY')
        )
        
        # Get vulnerabilities for specific asset
        vulns = tio.workbenches.asset_vulnerabilities(asset_id)
        
        print(f"Asset {asset_id} has {len(vulns['vulnerabilities'])} vulnerabilities")
        
        # Group by severity
        critical = [v for v in vulns['vulnerabilities'] if v['severity'] == 4]
        high = [v for v in vulns['vulnerabilities'] if v['severity'] == 3]
        medium = [v for v in vulns['vulnerabilities'] if v['severity'] == 2]
        
        print(f"  Critical: {len(critical)}")
        print(f"  High: {len(high)}")
        print(f"  Medium: {len(medium)}")
        
        return vulns
        
    except Exception as e:
        print(f"Error retrieving asset vulnerabilities: {str(e)}")
        return {}
```

---

## Data Volume Management

### Understanding Data Volumes

#### Typical Enterprise Volumes
- **Small Organization**: 100-1,000 assets, 1,000-10,000 vulnerabilities
- **Medium Organization**: 1,000-10,000 assets, 10,000-100,000 vulnerabilities
- **Large Organization**: 10,000+ assets, 100,000+ vulnerabilities

#### API Limits
- **Asset Export**: 100-10,000 assets per chunk (recommended: 4,000-5,000)
- **Vulnerability Export**: 50-5,000 assets per chunk (recommended: 1,000-3,000)
- **Workbench Limit**: Maximum 5,000 records per request
- **Concurrency**: Maximum 10 concurrent exports
- **Rate Limiting**: Dynamic based on load

### Efficient Data Processing

#### Chunked Processing Strategy
```python
def process_large_dataset():
    """Efficiently process large datasets with chunking"""
    try:
        tio = TenableIO(
            access_key=os.getenv('TENABLE_ACCESS_KEY'),
            secret_key=os.getenv('TENABLE_SECRET_KEY')
        )
        
        # Start export with optimal chunk size
        export_uuid = tio.exports.assets(
            chunk_size=4000,
            filters={'updated_since': '2024-01-01'}
        )
        
        # Process chunks as they become available
        total_processed = 0
        
        for chunk_num, chunk in enumerate(tio.exports.download_chunks(export_uuid)):
            print(f"Processing chunk {chunk_num + 1} with {len(chunk)} records")
            
            # Process chunk data
            processed_chunk = process_asset_chunk(chunk)
            
            # Store or transmit processed data
            store_processed_data(processed_chunk)
            
            total_processed += len(chunk)
            print(f"Total processed: {total_processed}")
        
        print(f"✅ Successfully processed {total_processed} assets")
        
    except Exception as e:
        print(f"❌ Error in bulk processing: {str(e)}")

def process_asset_chunk(assets):
    """Process a chunk of assets"""
    processed = []
    
    for asset in assets:
        # Transform data for RAS-DASH format
        processed_asset = {
            'id': asset.get('id'),
            'hostname': asset.get('hostname', ['Unknown'])[0] if asset.get('hostname') else 'Unknown',
            'ip_address': asset.get('ipv4', ['Unknown'])[0] if asset.get('ipv4') else 'Unknown',
            'operating_system': asset.get('operating_system', ['Unknown'])[0] if asset.get('operating_system') else 'Unknown',
            'exposure_score': asset.get('exposure_score', 0),
            'criticality': asset.get('criticality_rating', 'unknown'),
            'last_seen': asset.get('last_seen'),
            'has_agent': asset.get('has_agent', False),
            'cloud_provider': 'aws' if asset.get('aws_ec2_instance_id') else 'unknown',
            'tags': [f"{tag['key']}:{tag['value']}" for tag in asset.get('tags', [])]
        }
        processed.append(processed_asset)
    
    return processed

def store_processed_data(data):
    """Store processed data in RAS-DASH database"""
    # Implementation depends on your database setup
    print(f"Storing {len(data)} processed records")
```

#### Delta Synchronization
```python
def delta_sync():
    """Perform incremental data synchronization"""
    try:
        # Get last sync timestamp from database
        last_sync = get_last_sync_timestamp()  # Implement based on your DB
        
        tio = TenableIO(
            access_key=os.getenv('TENABLE_ACCESS_KEY'),
            secret_key=os.getenv('TENABLE_SECRET_KEY')
        )
        
        # Export only updated data
        export_uuid = tio.exports.assets(
            filters={'updated_since': last_sync.strftime('%Y-%m-%d')}
        )
        
        updated_count = 0
        for chunk in tio.exports.download_chunks(export_uuid):
            # Process and store updates
            process_asset_updates(chunk)
            updated_count += len(chunk)
        
        # Update sync timestamp
        update_last_sync_timestamp()  # Implement based on your DB
        
        print(f"✅ Delta sync completed: {updated_count} updates")
        
    except Exception as e:
        print(f"❌ Delta sync failed: {str(e)}")
```

---

## Best Practices

### 1. Authentication Security
```typescript
// ✅ Good: Use environment variables
const client = new TenableClient(
    process.env.TENABLE_ACCESS_KEY!,
    process.env.TENABLE_SECRET_KEY!
);

// ❌ Bad: Hardcoded credentials
const client = new TenableClient(
    'your_key_here',
    'your_secret_here'
);
```

### 2. Error Handling
```typescript
async function robustApiCall(): Promise<any> {
    /**
     * Implement robust error handling
     */
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const client = new TenableClient(
                process.env.TENABLE_ACCESS_KEY!,
                process.env.TENABLE_SECRET_KEY!
            );
            
            // Make API call
            const result = await client.getScans();
            return result;
            
        } catch (error: any) {
            if (attempt < maxRetries - 1) {
                console.log(`Attempt ${attempt + 1} failed: ${error.message}`);
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            } else {
                console.log(`All ${maxRetries} attempts failed`);
                throw error;
            }
        }
    }
}
```

### 3. Rate Limit Handling
```typescript
async function handleRateLimits(): Promise<any> {
    /**
     * Handle rate limiting gracefully
     */
    try {
        const client = new TenableClient(
            process.env.TENABLE_ACCESS_KEY!,
            process.env.TENABLE_SECRET_KEY!
        );
        
        const result = await exportAssets();
        return result;
        
    } catch (error: any) {
        if (error.response?.status === 429) {  // Rate limited
            const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
            console.log(`Rate limited. Waiting ${retryAfter} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            // Retry the request
            return handleRateLimits();
        } else {
            throw error;
        }
    }
}
```

### 4. Data Validation
```typescript
function validateAssetData(asset: any): boolean {
    /**
     * Validate asset data before processing
     */
    const requiredFields = ['id', 'hostname', 'ipv4'];
    
    for (const field of requiredFields) {
        if (!(field in asset) || !asset[field]) {
            console.log(`Warning: Asset missing required field: ${field}`);
            return false;
        }
    }
    
    // Validate IP format
    const ipAddress = asset.ipv4?.[0];
    if (ipAddress && !isValidIp(ipAddress)) {
        console.log(`Warning: Invalid IP address: ${ipAddress}`);
        return false;
    }
    
    return true;
}

function isValidIp(ip: string): boolean {
    /**
     * Validate IP address format
     */
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}
```

---

## Integration with RAS-DASH

### Database Schema Integration
```python
# Example integration with RAS-DASH database schema
def integrate_tenable_assets():
    """Integrate Tenable assets with RAS-DASH database"""
    try:
        # Get Tenable data
        tio = TenableIO(
            access_key=os.getenv('TENABLE_ACCESS_KEY'),
            secret_key=os.getenv('TENABLE_SECRET_KEY')
        )
        
        export_uuid = tio.exports.assets()
        
        # Process and integrate with RAS-DASH
        for chunk in tio.exports.download_chunks(export_uuid):
            for asset in chunk:
                # Map to RAS-DASH asset format
                ras_asset = {
                    'external_id': asset['id'],
                    'source': 'tenable',
                    'hostname': asset.get('hostname', ['Unknown'])[0] if asset.get('hostname') else 'Unknown',
                    'ip_address': asset.get('ipv4', ['Unknown'])[0] if asset.get('ipv4') else 'Unknown',
                    'operating_system': asset.get('operating_system', ['Unknown'])[0] if asset.get('operating_system') else 'Unknown',
                    'risk_score': asset.get('exposure_score', 0),
                    'criticality': map_criticality(asset.get('criticality_rating')),
                    'last_updated': asset.get('updated_at'),
                    'cloud_provider': detect_cloud_provider(asset),
                    'agent_installed': asset.get('has_agent', False),
                    'tags': extract_tags(asset.get('tags', [])),
                    'metadata': {
                        'aws_instance_id': asset.get('aws_ec2_instance_id'),
                        'aws_region': asset.get('aws_region'),
                        'network_interfaces': asset.get('network_interfaces', [])
                    }
                }
                
                # Insert or update in RAS-DASH database
                upsert_asset(ras_asset)
        
        print("✅ Tenable asset integration completed")
        
    except Exception as e:
        print(f"❌ Integration failed: {str(e)}")

def map_criticality(tenable_criticality):
    """Map Tenable criticality to RAS-DASH format"""
    mapping = {
        'low': 'Low',
        'medium': 'Medium',
        'high': 'High',
        'critical': 'Critical'
    }
    return mapping.get(tenable_criticality, 'Unknown')

def detect_cloud_provider(asset):
    """Detect cloud provider from asset data"""
    if asset.get('aws_ec2_instance_id'):
        return 'AWS'
    elif asset.get('azure_vm_id'):
        return 'Azure'
    elif asset.get('gcp_instance_id'):
        return 'GCP'
    else:
        return 'On-Premise'

def extract_tags(tenable_tags):
    """Extract and format tags for RAS-DASH"""
    return [f"{tag['key']}:{tag['value']}" for tag in tenable_tags]
```

### Scheduled Synchronization
```python
def setup_scheduled_sync():
    """Setup scheduled synchronization with Tenable"""
    import schedule
    import time
    
    # Schedule full sync weekly
    schedule.every().sunday.at("02:00").do(full_sync)
    
    # Schedule delta sync every 4 hours
    schedule.every(4).hours.do(delta_sync)
    
    # Schedule vulnerability sync every 2 hours
    schedule.every(2).hours.do(sync_vulnerabilities)
    
    print("Scheduled synchronization configured")
    
    # Keep running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

def full_sync():
    """Perform full synchronization"""
    print("Starting full synchronization...")
    integrate_tenable_assets()
    integrate_tenable_vulnerabilities()
    print("Full synchronization completed")

def sync_vulnerabilities():
    """Synchronize vulnerability data"""
    print("Starting vulnerability synchronization...")
    # Implementation similar to asset sync
    print("Vulnerability synchronization completed")
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Authentication Errors
```
Error: 401 Unauthorized
```
**Solutions:**
- Verify API keys are correct
- Check if keys have expired or been regenerated
- Ensure proper header format: `X-ApiKeys: accesskey=XXX; secretkey=YYY`

#### 2. Rate Limiting
```
Error: 429 Too Many Requests
```
**Solutions:**
- Implement exponential backoff
- Reduce request frequency
- Use chunked exports instead of frequent API calls

#### 3. Export Timeout
```
Error: Export expired or not found
```
**Solutions:**
- Download export chunks within 24 hours
- Check export status before downloading
- Implement automatic retry logic

#### 4. Data Volume Issues
```
Error: Request timeout or memory issues
```
**Solutions:**
- Use smaller chunk sizes
- Implement streaming processing
- Process data in batches

### Debugging Tools
```python
def debug_api_call():
    """Debug API calls with detailed logging"""
    import logging
    
    # Enable debug logging
    logging.basicConfig(level=logging.DEBUG)
    
    try:
        tio = TenableIO(
            access_key=os.getenv('TENABLE_ACCESS_KEY'),
            secret_key=os.getenv('TENABLE_SECRET_KEY')
        )
        
        # Enable debug mode
        tio._session.debug = True
        
        # Make test call
        result = tio.session.details()
        print(f"Debug result: {result}")
        
    except Exception as e:
        print(f"Debug error: {str(e)}")
        import traceback
        traceback.print_exc()
```

---

## Production Considerations

### 1. Security Best Practices
- Store API keys in secure environment variables or key vault
- Use dedicated service accounts for API access
- Implement API key rotation procedures
- Monitor API usage for anomalies

### 2. Performance Optimization
- Use export APIs for large datasets
- Implement connection pooling
- Cache frequently accessed data
- Use compression for data transfer

### 3. Monitoring and Alerting
```python
def setup_monitoring():
    """Setup monitoring for Tenable integration"""
    import logging
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('tenable_integration.log'),
            logging.StreamHandler()
        ]
    )
    
    # Log API usage
    logger = logging.getLogger('tenable_integration')
    logger.info("Tenable integration monitoring started")
    
    return logger

def monitor_api_health():
    """Monitor API connectivity and performance"""
    import time
    
    start_time = time.time()
    
    try:
        tio = TenableIO(
            access_key=os.getenv('TENABLE_ACCESS_KEY'),
            secret_key=os.getenv('TENABLE_SECRET_KEY')
        )
        
        # Test API connectivity
        tio.session.details()
        
        response_time = time.time() - start_time
        
        if response_time > 5.0:
            print(f"⚠️  Slow API response: {response_time:.2f}s")
        else:
            print(f"✅ API healthy: {response_time:.2f}s")
            
    except Exception as e:
        print(f"❌ API health check failed: {str(e)}")
```

### 4. Data Backup and Recovery
```python
def backup_sync_state():
    """Backup synchronization state"""
    import json
    from datetime import datetime
    
    sync_state = {
        'last_asset_sync': get_last_sync_timestamp('assets'),
        'last_vuln_sync': get_last_sync_timestamp('vulnerabilities'),
        'total_assets': get_asset_count(),
        'total_vulnerabilities': get_vulnerability_count(),
        'backup_timestamp': datetime.now().isoformat()
    }
    
    # Save backup
    with open(f'tenable_sync_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json', 'w') as f:
        json.dump(sync_state, f, indent=2)
    
    print("Sync state backed up successfully")
```

---



### ✅ Getting Started Checklist
1. **Sign up** for Tenable 60-day free trial
2. **Generate** API access and secret keys
3. **Install** PyTenable library
4. **Test** basic connectivity
5. **Implement** asset and vulnerability data consumption
6. **Setup** delta synchronization
7. **Monitor** integration performance

### 📊 Expected Data Volumes
- **Assets**: Thousands to tens of thousands per organization
- **Vulnerabilities**: Tens of thousands to hundreds of thousands
- **API Calls**: Multiple requests needed for complete data export
- **Processing**: Chunked approach required for large datasets

### 🔧 Integration Benefits for RAS-DASH
- **Comprehensive Asset Discovery**: Detailed inventory from Tenable agents and scans
- **Vulnerability Intelligence**: Real-time vulnerability data with CVSS scoring
- **Risk Prioritization**: Exposure scores and criticality ratings
- **Cloud Asset Management**: AWS, Azure, GCP asset identification
- **Compliance Integration**: Regulatory compliance status and findings

### 🚀 Next Steps
1. **Implement** basic integration following this guide
2. **Test** with sample data from trial account
3. **Develop** RAS-DASH specific data transformations
4. **Setup** automated synchronization workflows
5. **Monitor** and optimize performance

The integration will significantly enhance RAS-DASH's cybersecurity intelligence capabilities by providing comprehensive, real-time asset and vulnerability data from Tenable's industry-leading platform.

---

## Technical Implementation Details for Developer Handoff

### 1. Database Schema Requirements

#### New Tables to Create

##### Tenable Integration Configuration
```sql
-- Tenable API configuration and credentials
CREATE TABLE tenable_config (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    access_key_encrypted TEXT NOT NULL,
    secret_key_encrypted TEXT NOT NULL,
    base_url VARCHAR(255) DEFAULT 'https://cloud.tenable.com',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenable sync jobs and status tracking
CREATE TABLE tenable_sync_jobs (
    id SERIAL PRIMARY KEY,
    config_id INTEGER REFERENCES tenable_config(id),
    job_type VARCHAR(50) NOT NULL, -- 'assets', 'vulnerabilities', 'scans'
    status VARCHAR(50) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
    export_uuid VARCHAR(255),
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### Tenable Asset Data
```sql
-- Tenable assets with full metadata
CREATE TABLE tenable_assets (
    id SERIAL PRIMARY KEY,
    tenable_id VARCHAR(255) NOT NULL UNIQUE,
    config_id INTEGER REFERENCES tenable_config(id),
    hostname VARCHAR(255)[],
    ipv4 VARCHAR(15)[],
    ipv6 VARCHAR(45)[],
    fqdn VARCHAR(255)[],
    netbios_name VARCHAR(255),
    operating_system VARCHAR(255)[],
    system_type VARCHAR(255)[],
    has_agent BOOLEAN DEFAULT false,
    agent_uuid VARCHAR(255)[],
    exposure_score INTEGER DEFAULT 0,
    acr_score INTEGER DEFAULT 0,
    criticality_rating VARCHAR(50),
    first_seen TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    first_scan_time TIMESTAMP WITH TIME ZONE,
    last_scan_time TIMESTAMP WITH TIME ZONE,
    last_authenticated_scan_date TIMESTAMP WITH TIME ZONE,
    
    -- Cloud metadata
    aws_ec2_instance_id VARCHAR(255),
    aws_ec2_instance_ami_id VARCHAR(255),
    aws_owner_id VARCHAR(255),
    aws_availability_zone VARCHAR(255),
    aws_region VARCHAR(255),
    aws_vpc_id VARCHAR(255),
    aws_subnet_id VARCHAR(255),
    aws_ec2_instance_type VARCHAR(255),
    aws_ec2_instance_state_name VARCHAR(255),
    aws_ec2_name VARCHAR(255),
    
    azure_vm_id VARCHAR(255),
    azure_resource_id VARCHAR(255),
    
    -- Network information
    bios_uuid VARCHAR(255),
    network_id VARCHAR(255),
    network_name VARCHAR(255),
    mac_address VARCHAR(17)[],
    manufacturer_tpm_id VARCHAR(255)[],
    
    -- Integration tracking
    last_updated_tenable TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenable asset tags
CREATE TABLE tenable_asset_tags (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES tenable_assets(id),
    key VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    added_by VARCHAR(255),
    added_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenable asset network interfaces
CREATE TABLE tenable_asset_network_interfaces (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES tenable_assets(id),
    name VARCHAR(255),
    virtual BOOLEAN DEFAULT false,
    ipv4 VARCHAR(15)[],
    ipv6 VARCHAR(45)[],
    mac_address VARCHAR(17)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### Tenable Vulnerability Data
```sql
-- Tenable vulnerabilities
CREATE TABLE tenable_vulnerabilities (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER REFERENCES tenable_assets(id),
    config_id INTEGER REFERENCES tenable_config(id),
    plugin_id INTEGER NOT NULL,
    plugin_name VARCHAR(500),
    plugin_family VARCHAR(255),
    plugin_modification_date DATE,
    plugin_publication_date DATE,
    plugin_risk_factor VARCHAR(50),
    plugin_solution TEXT,
    plugin_synopsis TEXT,
    plugin_description TEXT,
    plugin_version VARCHAR(50),
    
    -- Scan information
    scan_id INTEGER,
    scan_uuid VARCHAR(255),
    scan_schedule_id VARCHAR(255),
    scan_started_at TIMESTAMP WITH TIME ZONE,
    scan_completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Vulnerability details
    severity VARCHAR(50),
    severity_id INTEGER,
    severity_default_id INTEGER,
    severity_modification_type VARCHAR(50),
    state VARCHAR(50), -- 'open', 'reopened', 'fixed'
    first_found TIMESTAMP WITH TIME ZONE,
    last_found TIMESTAMP WITH TIME ZONE,
    
    -- CVSS and scoring
    cvss_base_score DECIMAL(3,1),
    cvss_temporal_score DECIMAL(3,1),
    cvss_environmental_score DECIMAL(3,1),
    cvss_vector VARCHAR(255),
    vpr_score DECIMAL(4,1),
    
    -- Output and evidence
    output TEXT,
    port INTEGER,
    protocol VARCHAR(10),
    
    indexed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(asset_id, plugin_id, scan_id)
);
```

##### Tenable Scans
```sql
-- Tenable scan information
CREATE TABLE tenable_scans (
    id SERIAL PRIMARY KEY,
    tenable_scan_id INTEGER NOT NULL,
    config_id INTEGER REFERENCES tenable_config(id),
    scan_uuid VARCHAR(255) UNIQUE,
    name VARCHAR(500),
    description TEXT,
    policy_id INTEGER,
    scanner_id INTEGER,
    scanner_name VARCHAR(255),
    folder_id INTEGER,
    type VARCHAR(50),
    status VARCHAR(50),
    starttime TIMESTAMP WITH TIME ZONE,
    endtime TIMESTAMP WITH TIME ZONE,
    timezone VARCHAR(100),
    
    -- Scan targets and settings
    text_targets TEXT,
    target_network_uuid VARCHAR(255),
    scanner_start TIMESTAMP WITH TIME ZONE,
    scanner_end TIMESTAMP WITH TIME ZONE,
    
    -- Scan statistics
    hosts_total INTEGER DEFAULT 0,
    hosts_scanned INTEGER DEFAULT 0,
    vulnerabilities_total INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Extend Existing Tables
```sql
-- Add Tenable integration fields to existing assets table
ALTER TABLE assets ADD COLUMN tenable_asset_id INTEGER REFERENCES tenable_assets(id);
ALTER TABLE assets ADD COLUMN last_tenable_sync TIMESTAMP WITH TIME ZONE;

-- Add Tenable integration fields to existing vulnerabilities table
ALTER TABLE vulnerabilities ADD COLUMN tenable_vulnerability_id INTEGER REFERENCES tenable_vulnerabilities(id);
ALTER TABLE vulnerabilities ADD COLUMN tenable_plugin_id INTEGER;
ALTER TABLE vulnerabilities ADD COLUMN last_tenable_sync TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX idx_tenable_assets_tenable_id ON tenable_assets(tenable_id);
CREATE INDEX idx_tenable_assets_config_id ON tenable_assets(config_id);
CREATE INDEX idx_tenable_assets_last_seen ON tenable_assets(last_seen);
CREATE INDEX idx_tenable_vulnerabilities_asset_id ON tenable_vulnerabilities(asset_id);
CREATE INDEX idx_tenable_vulnerabilities_severity ON tenable_vulnerabilities(severity);
CREATE INDEX idx_tenable_vulnerabilities_state ON tenable_vulnerabilities(state);
CREATE INDEX idx_tenable_sync_jobs_status ON tenable_sync_jobs(status);
```

### 2. Environment Configuration (.env Updates)

```bash
# Tenable API Configuration
TENABLE_ACCESS_KEY=your_tenable_access_key_here
TENABLE_SECRET_KEY=your_tenable_secret_key_here
TENABLE_BASE_URL=https://cloud.tenable.com
TENABLE_SYNC_ENABLED=true

# Sync Configuration
TENABLE_SYNC_INTERVAL_HOURS=4
TENABLE_FULL_SYNC_INTERVAL_HOURS=24
TENABLE_ASSET_CHUNK_SIZE=4000
TENABLE_VULN_CHUNK_SIZE=2000
TENABLE_MAX_CONCURRENT_EXPORTS=3
TENABLE_EXPORT_TIMEOUT_MINUTES=30

# Rate Limiting
TENABLE_RATE_LIMIT_REQUESTS_PER_MINUTE=100
TENABLE_RATE_LIMIT_BURST=20
TENABLE_RETRY_MAX_ATTEMPTS=3
TENABLE_RETRY_DELAY_SECONDS=5

# Encryption for stored credentials
TENABLE_ENCRYPTION_KEY=your_32_character_encryption_key_here

# Monitoring and Logging
TENABLE_LOG_LEVEL=info
TENABLE_ENABLE_METRICS=true
TENABLE_WEBHOOK_URL=optional_webhook_for_notifications
```

### 3. Service Layer Implementation

#### TenableApiService
**Location**: `server/services/tenableApiService.ts`

```typescript
class TenableApiService {
    // Connection and authentication methods
    async testConnection(): Promise<boolean>
    // Tests API connectivity and credentials
    
    async getAccountInfo(): Promise<TenableAccount>
    // Retrieves account information and permissions
    
    // Asset management methods
    async getAssets(filters?: AssetFilters): Promise<TenableAsset[]>
    // Retrieves asset list with optional filtering
    
    async exportAssets(filters?: AssetFilters): Promise<string>
    // Starts asset export job, returns export UUID
    
    async getAssetDetails(assetId: string): Promise<TenableAssetDetails>
    // Gets detailed information for specific asset
    
    // Vulnerability management methods
    async getVulnerabilities(filters?: VulnFilters): Promise<TenableVulnerability[]>
    // Retrieves vulnerability list with filtering
    
    async exportVulnerabilities(filters?: VulnFilters): Promise<string>
    // Starts vulnerability export job, returns export UUID
    
    async getAssetVulnerabilities(assetId: string): Promise<TenableVulnerability[]>
    // Gets all vulnerabilities for specific asset
    
    // Export management methods
    async getExportStatus(exportUuid: string): Promise<ExportStatus>
    // Checks status of export job
    
    async downloadExportChunks(exportUuid: string): Promise<any[]>
    // Downloads all chunks from completed export
    
    // Scan management methods
    async getScans(): Promise<TenableScan[]>
    // Retrieves scan list
    
    async getScanDetails(scanId: number): Promise<TenableScanDetails>
    // Gets detailed scan information
    
    async getScanResults(scanId: number): Promise<TenableScanResults>
    // Downloads scan results
}
```

#### TenableSyncService
**Location**: `server/services/tenableSyncService.ts`

```typescript
class TenableSyncService {
    // Synchronization orchestration
    async performFullSync(): Promise<SyncResult>
    // Performs complete data synchronization
    
    async performDeltaSync(): Promise<SyncResult>
    // Performs incremental synchronization
    
    async syncAssets(since?: Date): Promise<AssetSyncResult>
    // Synchronizes asset data with optional delta
    
    async syncVulnerabilities(since?: Date): Promise<VulnSyncResult>
    // Synchronizes vulnerability data with optional delta
    
    async syncScans(since?: Date): Promise<ScanSyncResult>
    // Synchronizes scan data with optional delta
    
    // Job management
    async createSyncJob(type: SyncJobType): Promise<TenableSyncJob>
    // Creates new sync job record
    
    async updateSyncJob(jobId: number, updates: Partial<TenableSyncJob>): Promise<void>
    // Updates sync job status and progress
    
    async getSyncJobs(filters?: SyncJobFilters): Promise<TenableSyncJob[]>
    // Retrieves sync job history
    
    // Data transformation
    async transformAssetData(tenableAssets: TenableAsset[]): Promise<Asset[]>
    // Converts Tenable asset format to RAS-DASH format
    
    async transformVulnerabilityData(tenableVulns: TenableVulnerability[]): Promise<Vulnerability[]>
    // Converts Tenable vulnerability format to RAS-DASH format
    
    // Conflict resolution
    async resolveAssetConflicts(existing: Asset, incoming: TenableAsset): Promise<Asset>
    // Handles conflicts during asset updates
    
    async resolveVulnerabilityConflicts(existing: Vulnerability, incoming: TenableVulnerability): Promise<Vulnerability>
    // Handles conflicts during vulnerability updates
}
```

#### TenableDataService
**Location**: `server/services/tenableDataService.ts`

```typescript
class TenableDataService {
    // Database operations for Tenable data
    async saveAssets(assets: TenableAsset[]): Promise<void>
    // Bulk insert/update Tenable assets
    
    async saveVulnerabilities(vulnerabilities: TenableVulnerability[]): Promise<void>
    // Bulk insert/update Tenable vulnerabilities
    
    async saveScans(scans: TenableScan[]): Promise<void>
    // Bulk insert/update Tenable scans
    
    // Query methods
    async getAssetByTenableId(tenableId: string): Promise<TenableAsset | null>
    // Retrieves asset by Tenable ID
    
    async getVulnerabilitiesByAsset(assetId: number): Promise<TenableVulnerability[]>
    // Gets all vulnerabilities for asset
    
    async getRecentAssetUpdates(since: Date): Promise<TenableAsset[]>
    // Gets assets updated since date
    
    async getRecentVulnerabilityUpdates(since: Date): Promise<TenableVulnerability[]>
    // Gets vulnerabilities updated since date
    
    // Statistics and reporting
    async getAssetStatistics(): Promise<AssetStats>
    // Returns asset count and distribution statistics
    
    async getVulnerabilityStatistics(): Promise<VulnStats>
    // Returns vulnerability count and severity distribution
    
    async getSyncStatistics(): Promise<SyncStats>
    // Returns synchronization performance metrics
    
    // Data cleanup
    async cleanupOrphanedData(): Promise<CleanupResult>
    // Removes data for assets no longer in Tenable
    
    async archiveOldData(retentionDays: number): Promise<ArchiveResult>
    // Archives old vulnerability and scan data
}
```

#### TenableSchedulerService
**Location**: `server/services/tenableSchedulerService.ts`

```typescript
class TenableSchedulerService {
    // Scheduler management
    async startScheduler(): Promise<void>
    // Starts the sync scheduler
    
    async stopScheduler(): Promise<void>
    // Stops the sync scheduler
    
    async scheduleFullSync(): Promise<void>
    // Schedules full synchronization job
    
    async scheduleDeltaSync(): Promise<void>
    // Schedules incremental synchronization job
    
    // Job execution
    async executeScheduledSync(jobType: SyncJobType): Promise<void>
    // Executes scheduled sync job
    
    async retryFailedJobs(): Promise<void>
    // Retries failed sync jobs
    
    // Monitoring
    async getSchedulerStatus(): Promise<SchedulerStatus>
    // Returns current scheduler status
    
    async getUpcomingJobs(): Promise<ScheduledJob[]>
    // Returns list of upcoming sync jobs
    
    async getJobHistory(limit?: number): Promise<JobHistoryEntry[]>
    // Returns execution history
}
```

### 4. Controller Layer Implementation

#### TenableController
**Location**: `server/controllers/tenableController.ts`

```typescript
class TenableController {
    // Configuration endpoints
    async getConfig(req: Request, res: Response): Promise<void>
    // GET /api/tenable/config - Get Tenable configuration
    
    async updateConfig(req: Request, res: Response): Promise<void>
    // PUT /api/tenable/config - Update API credentials and settings
    
    async testConnection(req: Request, res: Response): Promise<void>
    // POST /api/tenable/test - Test API connectivity
    
    // Asset endpoints
    async getAssets(req: Request, res: Response): Promise<void>
    // GET /api/tenable/assets - Get paginated asset list with filters
    
    async getAssetDetails(req: Request, res: Response): Promise<void>
    // GET /api/tenable/assets/:id - Get detailed asset information
    
    async refreshAssets(req: Request, res: Response): Promise<void>
    // POST /api/tenable/assets/refresh - Trigger asset sync
    
    // Vulnerability endpoints
    async getVulnerabilities(req: Request, res: Response): Promise<void>
    // GET /api/tenable/vulnerabilities - Get paginated vulnerability list
    
    async getAssetVulnerabilities(req: Request, res: Response): Promise<void>
    // GET /api/tenable/assets/:id/vulnerabilities - Get vulnerabilities for asset
    
    async refreshVulnerabilities(req: Request, res: Response): Promise<void>
    // POST /api/tenable/vulnerabilities/refresh - Trigger vulnerability sync
    
    // Sync management endpoints
    async getSyncJobs(req: Request, res: Response): Promise<void>
    // GET /api/tenable/sync/jobs - Get sync job history
    
    async createSyncJob(req: Request, res: Response): Promise<void>
    // POST /api/tenable/sync/jobs - Create new sync job
    
    async getSyncJobStatus(req: Request, res: Response): Promise<void>
    // GET /api/tenable/sync/jobs/:id - Get sync job status
    
    async cancelSyncJob(req: Request, res: Response): Promise<void>
    // DELETE /api/tenable/sync/jobs/:id - Cancel running sync job
    
    // Statistics and reporting
    async getAssetStatistics(req: Request, res: Response): Promise<void>
    // GET /api/tenable/stats/assets - Get asset statistics
    
    async getVulnerabilityStatistics(req: Request, res: Response): Promise<void>
    // GET /api/tenable/stats/vulnerabilities - Get vulnerability statistics
    
    async getSyncStatistics(req: Request, res: Response): Promise<void>
    // GET /api/tenable/stats/sync - Get synchronization performance metrics
    
    // Export endpoints
    async exportAssetData(req: Request, res: Response): Promise<void>
    // GET /api/tenable/export/assets - Export asset data to CSV/JSON
    
    async exportVulnerabilityData(req: Request, res: Response): Promise<void>
    // GET /api/tenable/export/vulnerabilities - Export vulnerability data
}
```

#### TenableWebhookController
**Location**: `server/controllers/tenableWebhookController.ts`

```typescript
class TenableWebhookController {
    // Webhook management
    async createWebhook(req: Request, res: Response): Promise<void>
    // POST /api/tenable/webhooks - Create new webhook subscription
    
    async getWebhooks(req: Request, res: Response): Promise<void>
    // GET /api/tenable/webhooks - List webhook subscriptions
    
    async deleteWebhook(req: Request, res: Response): Promise<void>
    // DELETE /api/tenable/webhooks/:id - Delete webhook subscription
    
    // Webhook handlers
    async handleAssetUpdate(req: Request, res: Response): Promise<void>
    // POST /api/tenable/webhooks/assets - Handle asset update notifications
    
    async handleVulnerabilityUpdate(req: Request, res: Response): Promise<void>
    // POST /api/tenable/webhooks/vulnerabilities - Handle vulnerability updates
    
    async handleScanComplete(req: Request, res: Response): Promise<void>
    // POST /api/tenable/webhooks/scans - Handle scan completion notifications
}
```

### 5. Frontend Implementation

#### Page 1: Tenable Integration Settings
**Route**: `/settings/integrations/tenable`
**Purpose**: Configure Tenable API connection and sync settings

**UI Components**:
- **Connection Configuration Panel**
  - Input fields for Access Key and Secret Key (masked)
  - Base URL field (defaulted to cloud.tenable.com)
  - "Test Connection" button with status indicator
  - Connection status badge (Connected/Disconnected/Error)

- **Sync Configuration Panel**
  - Toggle for enabling/disabling automatic sync
  - Dropdown for sync frequency (Every 2 hours, 4 hours, 8 hours, Daily)
  - Toggle for full sync schedule (Weekly/Monthly)
  - Chunk size sliders for assets and vulnerabilities
  - Max concurrent exports setting

- **Advanced Settings Panel**
  - Rate limiting configuration
  - Retry settings
  - Data retention policies
  - Webhook configuration

**Captured Data**:
- API credentials (encrypted before storage)
- Sync preferences and schedules
- Performance tuning parameters
- Notification settings

#### Page 2: Tenable Assets Dashboard
**Route**: `/assets/tenable`
**Purpose**: View and manage Tenable asset inventory

**UI Components**:
- **Header with Statistics Cards**
  - Total Assets count
  - Assets with Agents count
  - Cloud Assets count (AWS/Azure/GCP breakdown)
  - Last Sync timestamp

- **Filters and Search Panel**
  - Text search for hostname/IP
  - Dropdown filters for OS, Cloud Provider, Agent Status
  - Date range picker for last seen
  - Criticality level filter
  - Export buttons (CSV/JSON)

- **Asset Data Grid**
  - Columns: Hostname, IP Address, OS, Cloud Provider, Agent Status, Exposure Score, Last Seen
  - Sortable columns with pagination
  - Row actions: View Details, View Vulnerabilities, Sync Individual Asset
  - Bulk actions: Sync Selected, Export Selected

- **Asset Details Modal**
  - Comprehensive asset information
  - Network interfaces and IP addresses
  - Cloud metadata (instance IDs, regions, etc.)
  - Tags and custom attributes
  - Asset timeline and scan history

**Captured Data**:
- Asset inventory from Tenable
- User filter preferences
- Asset selection for bulk operations
- Export parameters

#### Page 3: Tenable Vulnerabilities Dashboard
**Route**: `/vulnerabilities/tenable`
**Purpose**: View and analyze vulnerability data from Tenable

**UI Components**:
- **Vulnerability Metrics Panel**
  - Donut chart showing severity distribution
  - Trend line for new vulnerabilities over time
  - MTTR (Mean Time to Remediation) metric
  - Critical/High vulnerability count

- **Advanced Filtering Panel**
  - Severity level checkboxes
  - CVSS score range slider
  - State filter (Open/Fixed/Reopened)
  - Plugin family dropdown
  - Date range for first/last found
  - Asset-specific filtering

- **Vulnerability List View**
  - Columns: Plugin Name, Severity, CVSS Score, Affected Assets, First Found, Last Found, State
  - Expandable rows showing vulnerability details
  - Inline remediation guidance
  - Links to asset details

- **Vulnerability Details Panel**
  - Complete vulnerability description
  - CVSS metrics and scoring
  - Affected asset list
  - Remediation steps and references
  - Historical tracking chart

**Captured Data**:
- Vulnerability assessment data
- User analysis filters
- Remediation tracking information
- Risk prioritization preferences

#### Page 4: Sync Management Dashboard
**Route**: `/admin/tenable/sync`
**Purpose**: Monitor and manage Tenable synchronization jobs

**UI Components**:
- **Sync Status Overview**
  - Current sync job status cards
  - Progress bars for active syncs
  - Next scheduled sync countdown
  - Sync health indicators

- **Job Management Panel**
  - "Start Full Sync" button
  - "Start Delta Sync" button
  - "Schedule Custom Sync" button
  - Job queue visualization

- **Sync History Table**
  - Columns: Job Type, Status, Started, Duration, Records Processed, Errors
  - Filter by job type and status
  - Detailed job logs modal
  - Retry failed jobs action

- **Performance Metrics**
  - Sync duration trends chart
  - Data volume processed over time
  - Error rate tracking
  - API rate limit utilization

- **Configuration Quick Settings**
  - Sync frequency adjustment
  - Enable/disable scheduled syncs
  - Emergency stop all syncs button

**Captured Data**:
- Sync job configurations
- Performance monitoring data
- Error logs and diagnostics
- Administrative preferences

#### Page 5: Tenable Analytics & Reporting
**Route**: `/analytics/tenable`
**Purpose**: Business intelligence and trend analysis

**UI Components**:
- **Executive Dashboard**
  - Risk posture overview
  - Asset growth trends
  - Vulnerability remediation metrics
  - Compliance status indicators

- **Interactive Charts**
  - Asset discovery timeline
  - Vulnerability aging analysis
  - Risk score distribution
  - Cloud asset allocation

- **Custom Report Builder**
  - Drag-and-drop report designer
  - Predefined report templates
  - Scheduled report generation
  - Export options (PDF, Excel, PowerPoint)

- **Comparative Analysis**
  - Before/after Tenable integration metrics
  - Benchmark comparisons
  - ROI calculations
  - Time-to-detection improvements

**Captured Data**:
- Report configurations and templates
- Analytics preferences
- Scheduled report settings
- Business metrics and KPIs

### 6. Integration Workflow

#### Initial Setup Process
1. **Configuration**: Admin configures API credentials in settings page
2. **Connection Test**: System validates credentials and permissions
3. **Initial Sync**: Full synchronization of assets and vulnerabilities
4. **Schedule Setup**: Automated sync jobs are configured and started
5. **Validation**: Data verification and quality checks

#### Ongoing Operations
1. **Scheduled Syncs**: Regular delta synchronization every 4 hours
2. **Real-time Updates**: Webhook notifications for immediate updates
3. **Monitoring**: Continuous sync job and data quality monitoring
4. **Reporting**: Automated generation of security and compliance reports
5. **Maintenance**: Periodic cleanup and data archival

This technical specification provides a complete blueprint for implementing Tenable API integration into the RAS-DASH platform, ensuring comprehensive asset and vulnerability data synchronization with proper monitoring and management capabilities.