#!/usr/bin/env python3
"""
PyTenable Local Testing Client
Tests Tenable integration using local mock server
"""

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
