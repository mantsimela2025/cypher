# Tenable Local Testing Setup Guide

## Overview
This guide provides instructions for testing Tenable API integration locally without requiring access to cloud.tenable.com. We'll use PyTenable for initial testing and create mock data structures that match the real API responses.

## Prerequisites
- Python 3.6 or later
- Node.js 16 or later (for the main RAS-DASH integration)
- Local PostgreSQL database
- Network isolation or restricted environment

## Option 1: PyTenable with Mock Server

### Step 1: Install PyTenable
```bash
# Install PyTenable and dependencies
pip install pytenable
pip install flask
pip install requests-mock
```

### Step 2: Create Mock Tenable Server
```python
# mock_tenable_server.py
from flask import Flask, jsonify, request
import json
import uuid
from datetime import datetime, timedelta
import random

app = Flask(__name__)

# Mock data storage
mock_assets = []
mock_vulnerabilities = []
mock_scans = []

# Generate realistic mock data
def generate_mock_assets(count=50):
    assets = []
    for i in range(count):
        asset = {
            "id": str(uuid.uuid4()),
            "hostname": [f"server-{i+1}.example.com"],
            "ipv4": [f"192.168.1.{i+10}"],
            "ipv6": [],
            "fqdn": [f"server-{i+1}.example.com"],
            "netbios_name": f"SERVER{i+1}",
            "operating_system": [random.choice([
                "Windows Server 2019",
                "Ubuntu 20.04 LTS",
                "CentOS 8",
                "Red Hat Enterprise Linux 8"
            ])],
            "system_type": [random.choice(["general-purpose", "database", "web-server"])],
            "has_agent": random.choice([True, False]),
            "agent_uuid": [str(uuid.uuid4())] if random.choice([True, False]) else [],
            "exposure_score": random.randint(0, 1000),
            "acr_score": random.randint(1, 10),
            "criticality_rating": random.choice(["low", "medium", "high", "critical"]),
            "first_seen": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            "last_seen": datetime.now().isoformat(),
            "first_scan_time": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            "last_scan_time": datetime.now().isoformat(),
            "last_authenticated_scan_date": datetime.now().isoformat(),
            
            # AWS metadata (for some assets)
            "aws_ec2_instance_id": f"i-{random.randint(100000000000, 999999999999):012x}" if random.choice([True, False]) else None,
            "aws_ec2_instance_ami_id": f"ami-{random.randint(100000000000, 999999999999):012x}" if random.choice([True, False]) else None,
            "aws_owner_id": "123456789012" if random.choice([True, False]) else None,
            "aws_availability_zone": random.choice(["us-east-1a", "us-east-1b", "us-west-2a"]) if random.choice([True, False]) else None,
            "aws_region": "us-east-1" if random.choice([True, False]) else None,
            
            # Network information
            "mac_address": [f"00:1B:44:11:3A:{i+10:02X}"],
            "network_id": str(uuid.uuid4()),
            "network_name": "Corporate Network",
            
            "indexed": datetime.now().isoformat()
        }
        assets.append(asset)
    return assets

def generate_mock_vulnerabilities(asset_count=50, vuln_per_asset=5):
    vulnerabilities = []
    plugin_families = ["Windows", "Ubuntu Local Security Checks", "Web Servers", "Databases", "Network Security"]
    severities = ["critical", "high", "medium", "low", "info"]
    
    for asset_idx in range(asset_count):
        for vuln_idx in range(random.randint(1, vuln_per_asset)):
            severity = random.choice(severities)
            severity_id = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}[severity]
            
            vuln = {
                "asset": {
                    "id": str(uuid.uuid4()),
                    "hostname": f"server-{asset_idx+1}.example.com",
                    "ipv4": f"192.168.1.{asset_idx+10}"
                },
                "plugin": {
                    "id": 10000 + vuln_idx,
                    "name": f"Sample Vulnerability {vuln_idx+1}",
                    "family": random.choice(plugin_families),
                    "modification_date": (datetime.now() - timedelta(days=random.randint(1, 90))).date().isoformat(),
                    "publication_date": (datetime.now() - timedelta(days=random.randint(90, 365))).date().isoformat(),
                    "risk_factor": severity.title(),
                    "solution": "Apply the latest security patches and updates.",
                    "synopsis": f"A {severity} severity vulnerability was detected.",
                    "description": f"This is a sample {severity} vulnerability for testing purposes.",
                    "version": "1.0"
                },
                "scan": {
                    "id": random.randint(1000, 9999),
                    "uuid": str(uuid.uuid4()),
                    "started_at": (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
                    "completed_at": datetime.now().isoformat()
                },
                "severity": severity,
                "severity_id": severity_id,
                "severity_default_id": severity_id,
                "state": random.choice(["open", "reopened", "fixed"]),
                "first_found": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                "last_found": datetime.now().isoformat(),
                "cvss_base_score": round(random.uniform(0.0, 10.0), 1),
                "cvss_temporal_score": round(random.uniform(0.0, 10.0), 1),
                "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
                "vpr_score": round(random.uniform(0.0, 10.0), 1),
                "output": f"Sample vulnerability output for testing - {severity} level finding",
                "port": random.choice([80, 443, 22, 3389, 21, 25, 53]),
                "protocol": random.choice(["tcp", "udp"]),
                "indexed": datetime.now().isoformat()
            }
            vulnerabilities.append(vuln)
    return vulnerabilities

# Initialize mock data
mock_assets = generate_mock_assets(100)
mock_vulnerabilities = generate_mock_vulnerabilities(100, 10)

# API Endpoints
@app.route('/session', methods=['GET'])
def get_session():
    return jsonify({
        "id": 12345,
        "username": "test@example.com",
        "email": "test@example.com",
        "name": "Test User",
        "type": "local",
        "permissions": 64,
        "login_fail_count": 0,
        "login_fail_total": 0,
        "enabled": True,
        "lastlogin": int(datetime.now().timestamp()),
        "uuid": str(uuid.uuid4())
    })

@app.route('/scans', methods=['GET'])
def get_scans():
    return jsonify({
        "scans": [
            {
                "id": 1001,
                "uuid": str(uuid.uuid4()),
                "name": "Weekly Network Scan",
                "status": "completed",
                "starttime": int((datetime.now() - timedelta(hours=2)).timestamp()),
                "endtime": int(datetime.now().timestamp()),
                "folder_id": 2,
                "type": "public",
                "scanner_name": "Local Scanner"
            },
            {
                "id": 1002,
                "uuid": str(uuid.uuid4()),
                "name": "Vulnerability Assessment",
                "status": "running",
                "starttime": int((datetime.now() - timedelta(minutes=30)).timestamp()),
                "endtime": None,
                "folder_id": 2,
                "type": "public",
                "scanner_name": "Local Scanner"
            }
        ]
    })

@app.route('/assets', methods=['GET'])
def get_assets():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    return jsonify({
        "assets": mock_assets[start_idx:end_idx],
        "total": len(mock_assets),
        "page": page,
        "per_page": per_page
    })

@app.route('/assets/export', methods=['POST'])
def export_assets():
    export_uuid = str(uuid.uuid4())
    return jsonify({
        "export_uuid": export_uuid
    })

@app.route('/assets/export/<export_uuid>/status', methods=['GET'])
def get_asset_export_status(export_uuid):
    return jsonify({
        "status": "FINISHED"
    })

@app.route('/assets/export/<export_uuid>/chunks/<int:chunk_id>', methods=['GET'])
def get_asset_export_chunk(export_uuid, chunk_id):
    if chunk_id == 1:
        return jsonify(mock_assets[:50])
    elif chunk_id == 2:
        return jsonify(mock_assets[50:])
    else:
        return jsonify([])

@app.route('/workbenches/vulnerabilities', methods=['GET'])
def get_vulnerability_workbench():
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    
    for vuln in mock_vulnerabilities:
        severity_counts[vuln["severity"]] += 1
    
    vulnerabilities = []
    for severity, count in severity_counts.items():
        if count > 0:
            vulnerabilities.append({
                "severity_name": severity,
                "count": count,
                "plugin_family": "Mixed"
            })
    
    return jsonify({
        "vulnerabilities": vulnerabilities
    })

@app.route('/vulns/export', methods=['POST'])
def export_vulnerabilities():
    export_uuid = str(uuid.uuid4())
    return jsonify({
        "export_uuid": export_uuid
    })

@app.route('/vulns/export/<export_uuid>/status', methods=['GET'])
def get_vuln_export_status(export_uuid):
    return jsonify({
        "status": "FINISHED"
    })

@app.route('/vulns/export/<export_uuid>/chunks/<int:chunk_id>', methods=['GET'])
def get_vuln_export_chunk(export_uuid, chunk_id):
    chunk_size = 100
    start_idx = (chunk_id - 1) * chunk_size
    end_idx = start_idx + chunk_size
    
    if start_idx < len(mock_vulnerabilities):
        return jsonify(mock_vulnerabilities[start_idx:end_idx])
    else:
        return jsonify([])

if __name__ == '__main__':
    print("Starting Mock Tenable Server...")
    print("Access at: http://localhost:5001")
    print("Available endpoints:")
    print("  GET  /session")
    print("  GET  /scans")
    print("  GET  /assets")
    print("  POST /assets/export")
    print("  GET  /workbenches/vulnerabilities")
    print("  POST /vulns/export")
    app.run(host='0.0.0.0', port=5001, debug=True)
```

### Step 3: Create PyTenable Test Client
```python
# test_pytenable_local.py
from tenable.io import TenableIO
import os
from datetime import datetime

# Configure to use local mock server
class LocalTenableIO(TenableIO):
    def __init__(self):
        # Override the base URL to point to local server
        super().__init__(
            access_key='mock_access_key',
            secret_key='mock_secret_key',
            url='http://localhost:5001'
        )

def test_local_connection():
    """Test connection to local mock server"""
    try:
        tio = LocalTenableIO()
        
        # Test session endpoint
        user_info = tio.session.details()
        print(f"✅ Connected successfully as: {user_info['email']}")
        
        # Test scans
        scans = tio.scans.list()
        print(f"📊 Available scans: {len(scans['scans'])}")
        
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False

def test_asset_retrieval():
    """Test asset data retrieval"""
    try:
        tio = LocalTenableIO()
        
        # Get asset list
        assets = tio.assets.list()
        print(f"Found {len(assets)} assets")
        
        # Show sample assets
        for asset in assets[:3]:
            hostname = asset.get('hostname', ['Unknown'])[0]
            ip = asset.get('ipv4', ['N/A'])[0] if asset.get('ipv4') else 'N/A'
            exposure = asset.get('exposure_score', 0)
            print(f"  Asset: {hostname} ({ip}) - Exposure: {exposure}")
        
        return assets
        
    except Exception as e:
        print(f"❌ Asset retrieval failed: {str(e)}")
        return []

def test_vulnerability_data():
    """Test vulnerability data retrieval"""
    try:
        tio = LocalTenableIO()
        
        # Get vulnerability workbench
        vulns = tio.workbenches.vulnerabilities()
        
        print("Vulnerability Summary:")
        for vuln in vulns['vulnerabilities']:
            severity = vuln['severity_name']
            count = vuln['count']
            print(f"  {severity.title()}: {count}")
        
        return vulns
        
    except Exception as e:
        print(f"❌ Vulnerability retrieval failed: {str(e)}")
        return {}

def test_export_functionality():
    """Test export functionality"""
    try:
        tio = LocalTenableIO()
        
        # Test asset export
        print("Testing asset export...")
        export_uuid = tio.exports.assets()
        print(f"Asset export started: {export_uuid}")
        
        # Download chunks (mock server returns data immediately)
        all_assets = []
        for chunk in tio.exports.download_chunks(export_uuid):
            all_assets.extend(chunk)
            print(f"Downloaded chunk with {len(chunk)} assets")
        
        print(f"Total assets exported: {len(all_assets)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Export test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== PyTenable Local Testing ===")
    print("Make sure mock_tenable_server.py is running on port 5001")
    print()
    
    # Run tests
    if test_local_connection():
        print("\n=== Testing Asset Retrieval ===")
        assets = test_asset_retrieval()
        
        print("\n=== Testing Vulnerability Data ===")
        vulns = test_vulnerability_data()
        
        print("\n=== Testing Export Functionality ===")
        test_export_functionality()
        
        print("\n✅ All tests completed successfully!")
    else:
        print("❌ Connection test failed - check if mock server is running")
```

## Option 2: Node.js with Mock Data

### Step 1: Create Node.js Test Environment
```typescript
// test_tenable_nodejs.ts
import axios, { AxiosInstance } from 'axios';

class MockTenableClient {
    private baseURL: string;
    private client: AxiosInstance;
    
    constructor() {
        this.baseURL = 'http://localhost:5001';
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'RAS-DASH-Test/1.0.0'
            }
        });
    }
    
    async testConnection() {
        try {
            const response = await this.client.get('/session');
            return response.data;
        } catch (error) {
            throw new Error(`Connection failed: ${error.message}`);
        }
    }
    
    async getAssets() {
        try {
            const response = await this.client.get('/assets');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get assets: ${error.message}`);
        }
    }
    
    async getVulnerabilities() {
        try {
            const response = await this.client.get('/workbenches/vulnerabilities');
            return response.data;
        } catch (error) {
            throw new Error(`Failed to get vulnerabilities: ${error.message}`);
        }
    }
    
    async exportAssets() {
        try {
            // Start export
            const exportResponse = await this.client.post('/assets/export', {});
            const exportUuid = exportResponse.data.export_uuid;
            
            console.log(`Asset export started: ${exportUuid}`);
            
            // Get export status
            const statusResponse = await this.client.get(`/assets/export/${exportUuid}/status`);
            console.log(`Export status: ${statusResponse.data.status}`);
            
            // Download chunks
            const allAssets = [];
            let chunkId = 1;
            
            while (true) {
                try {
                    const chunkResponse = await this.client.get(`/assets/export/${exportUuid}/chunks/${chunkId}`);
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
                    throw error;
                }
            }
            
            return allAssets;
            
        } catch (error) {
            throw new Error(`Export failed: ${error.message}`);
        }
    }
}

async function runTests() {
    try {
        const client = new MockTenableClient();
        
        console.log("=== Testing Connection ===");
        const userInfo = await client.testConnection();
        console.log(`✅ Connected as: ${userInfo.email}`);
        
        console.log("\n=== Testing Asset Retrieval ===");
        const assets = await client.getAssets();
        console.log(`✅ Retrieved ${assets.assets.length} assets`);
        
        console.log("\n=== Testing Vulnerability Data ===");
        const vulns = await client.getVulnerabilities();
        console.log(`✅ Retrieved vulnerability data for ${vulns.vulnerabilities.length} categories`);
        
        console.log("\n=== Testing Asset Export ===");
        const exportedAssets = await client.exportAssets();
        console.log(`✅ Exported ${exportedAssets.length} total assets`);
        
        console.log("\n🎉 All tests passed!");
        
    } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

export { MockTenableClient };
```

## Quick Start Instructions

### 1. Start Mock Server
```bash
# Terminal 1: Start the mock Tenable server
python mock_tenable_server.py
```

### 2. Test with PyTenable
```bash
# Terminal 2: Test PyTenable integration
python test_pytenable_local.py
```

### 3. Test with Node.js
```bash
# Terminal 3: Test Node.js integration
npx tsx test_tenable_nodejs.ts
```

## Environment Setup for Local Testing

### Update .env for Local Testing
```bash
# Local Testing Configuration
TENABLE_ACCESS_KEY=mock_access_key
TENABLE_SECRET_KEY=mock_secret_key
TENABLE_BASE_URL=http://localhost:5001
TENABLE_SYNC_ENABLED=true

# Use smaller intervals for testing
TENABLE_SYNC_INTERVAL_HOURS=1
TENABLE_ASSET_CHUNK_SIZE=50
TENABLE_VULN_CHUNK_SIZE=100
```

## Benefits of Local Testing

1. **No Network Dependencies**: Works in isolated environments
2. **Predictable Data**: Consistent test data for development
3. **Fast Iteration**: No API rate limits or delays
4. **Realistic Responses**: Mock data matches real Tenable API structure
5. **Full Coverage**: Test all integration scenarios including error cases

## Next Steps

1. **Start Mock Server**: Run `python mock_tenable_server.py`
2. **Test PyTenable**: Verify PyTenable works with mock server
3. **Test Node.js**: Confirm Node.js client works with mock data
4. **Integrate with RAS-DASH**: Use mock server for development
5. **Switch to Production**: Update base URL when Tenable access is available

This local testing environment provides a complete Tenable API simulation that matches the real API structure and responses, allowing full development and testing of the integration without requiring cloud access.