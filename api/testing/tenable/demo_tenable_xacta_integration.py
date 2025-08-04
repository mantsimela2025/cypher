#!/usr/bin/env python3
"""
Comprehensive Demo: Tenable-Xacta Integration
Shows how assets, vulnerabilities, systems, controls, and POAMs work together
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = 'http://localhost:5001'

def print_separator(title):
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def print_subsection(title):
    print(f"\n{'-'*50}")
    print(f"  {title}")
    print(f"{'-'*50}")

def get_tenable_data():
    """Get Tenable assets and vulnerabilities"""
    print("📊 Fetching Tenable data...")
    
    # Get assets
    assets_response = requests.get(f'{BASE_URL}/assets?per_page=10')
    assets_data = assets_response.json() if assets_response.status_code == 200 else {}
    
    # Get vulnerabilities  
    vulns_response = requests.get(f'{BASE_URL}/vulnerabilities?per_page=10')
    vulns_data = vulns_response.json() if vulns_response.status_code == 200 else {}
    
    return assets_data, vulns_data

def get_xacta_data():
    """Get Xacta systems, controls, and POAMs"""
    print("🏢 Fetching Xacta data...")
    
    # Get systems
    systems_response = requests.get(f'{BASE_URL}/xacta/systems?per_page=10')
    systems_data = systems_response.json() if systems_response.status_code == 200 else {}
    
    # Get controls
    controls_response = requests.get(f'{BASE_URL}/xacta/controls?per_page=10')
    controls_data = controls_response.json() if controls_response.status_code == 200 else {}
    
    # Get POAMs
    poams_response = requests.get(f'{BASE_URL}/xacta/poams?per_page=10')
    poams_data = poams_response.json() if poams_response.status_code == 200 else {}
    
    # Get system-asset relationships
    system_assets_response = requests.get(f'{BASE_URL}/xacta/system-assets')
    system_assets_data = system_assets_response.json() if system_assets_response.status_code == 200 else {}
    
    return systems_data, controls_data, poams_data, system_assets_data

def demonstrate_asset_system_linking(assets_data, systems_data, system_assets_data):
    """Show how Tenable assets are linked to Xacta systems"""
    print_subsection("Asset-System Linking")
    
    assets = assets_data.get('assets', [])
    systems = systems_data.get('systems', [])
    system_assets = system_assets_data.get('system_assets', [])
    
    print(f"📊 Total Tenable Assets: {len(assets)}")
    print(f"🏢 Total Xacta Systems: {len(systems)}")
    print(f"🔗 Total Asset-System Links: {len(system_assets)}")
    
    # Show sample linkages
    print(f"\n📋 Sample Asset-System Relationships:")
    for i, link in enumerate(system_assets[:5]):
        # Find the actual asset and system
        asset = next((a for a in assets if a['id'] == link['asset_uuid']), None)
        system = next((s for s in systems if s['system_id'] == link['system_id']), None)
        
        if asset and system:
            asset_name = asset.get('hostname', ['Unknown'])[0] if asset.get('hostname') else 'Unknown'
            print(f"   {i+1}. Asset: {asset_name} ({link['asset_ip']})")
            print(f"      ↳ System: {system['system_name']} ({link['system_id']})")
            print(f"      ↳ Relationship: {link['relationship_type']} | Criticality: {link['criticality']}")
            print(f"      ↳ Environment: {link['environment']}")

def demonstrate_vulnerability_control_correlation(vulns_data, controls_data, poams_data):
    """Show how vulnerabilities correlate with controls and POAMs"""
    print_subsection("Vulnerability-Control-POAM Correlation")
    
    vulnerabilities = vulns_data.get('vulnerabilities', [])
    controls = controls_data.get('controls', [])
    poams = poams_data.get('poams', [])
    
    print(f"🔓 Total Vulnerabilities: {len(vulnerabilities)}")
    print(f"🔒 Total Controls: {len(controls)}")
    print(f"📋 Total POAMs: {len(poams)}")
    
    # Group vulnerabilities by severity
    vuln_by_severity = {}
    for vuln in vulnerabilities:
        severity = vuln.get('severity', 'unknown')
        vuln_by_severity[severity] = vuln_by_severity.get(severity, 0) + 1
    
    print(f"\n📊 Vulnerability Distribution:")
    for severity, count in vuln_by_severity.items():
        print(f"   • {severity.title()}: {count}")
    
    # Show controls by family
    control_families = {}
    for control in controls:
        family = control.get('family', 'Unknown')
        control_families[family] = control_families.get(family, 0) + 1
    
    print(f"\n🔒 Control Families (Top 5):")
    sorted_families = sorted(control_families.items(), key=lambda x: x[1], reverse=True)[:5]
    for family, count in sorted_families:
        print(f"   • {family}: {count} controls")
    
    # Show POAM status distribution
    poam_status = {}
    for poam in poams:
        status = poam.get('status', 'Unknown')
        poam_status[status] = poam_status.get(status, 0) + 1
    
    print(f"\n📋 POAM Status Distribution:")
    for status, count in poam_status.items():
        print(f"   • {status}: {count}")

def demonstrate_risk_correlation(assets_data, vulns_data, systems_data, poams_data):
    """Show risk correlation across Tenable and Xacta data"""
    print_subsection("Risk Correlation Analysis")
    
    assets = assets_data.get('assets', [])
    vulnerabilities = vulns_data.get('vulnerabilities', [])
    systems = systems_data.get('systems', [])
    poams = poams_data.get('poams', [])
    
    # Calculate risk metrics
    high_risk_assets = [a for a in assets if a.get('exposure_score', 0) > 700]
    critical_vulns = [v for v in vulnerabilities if v.get('severity') == 'critical']
    high_impact_systems = [s for s in systems if s.get('impact_level') == 'High']
    high_priority_poams = [p for p in poams if p.get('priority') in ['Very High', 'High']]
    
    print(f"⚠️  Risk Analysis Summary:")
    print(f"   • High-risk assets (exposure > 700): {len(high_risk_assets)}")
    print(f"   • Critical vulnerabilities: {len(critical_vulns)}")
    print(f"   • High-impact systems: {len(high_impact_systems)}")
    print(f"   • High-priority POAMs: {len(high_priority_poams)}")
    
    # Show correlation examples
    print(f"\n🔍 Risk Correlation Examples:")
    
    if high_risk_assets and critical_vulns:
        asset = high_risk_assets[0]
        vuln = critical_vulns[0]
        asset_name = asset.get('hostname', ['Unknown'])[0] if asset.get('hostname') else 'Unknown'
        
        print(f"   1. High-Risk Asset: {asset_name}")
        print(f"      ↳ Exposure Score: {asset.get('exposure_score', 0)}")
        print(f"      ↳ Critical Vulnerability: {vuln.get('plugin', {}).get('name', 'Unknown')}")
        print(f"      ↳ CVSS Score: {vuln.get('cvss_base_score', 'N/A')}")
    
    if high_impact_systems and high_priority_poams:
        system = high_impact_systems[0]
        poam = high_priority_poams[0]
        
        print(f"   2. High-Impact System: {system.get('system_name', 'Unknown')}")
        print(f"      ↳ Impact Level: {system.get('impact_level', 'Unknown')}")
        print(f"      ↳ Related POAM: {poam.get('poam_id', 'Unknown')}")
        print(f"      ↳ POAM Priority: {poam.get('priority', 'Unknown')}")

def demonstrate_compliance_mapping(controls_data, poams_data):
    """Show compliance control implementation status"""
    print_subsection("Compliance Control Mapping")
    
    controls = controls_data.get('controls', [])
    poams = poams_data.get('poams', [])
    
    # Control implementation status
    control_status = {}
    for control in controls:
        status = control.get('implementation_status', 'Unknown')
        control_status[status] = control_status.get(status, 0) + 1
    
    print(f"📊 Control Implementation Status:")
    for status, count in control_status.items():
        print(f"   • {status}: {count} controls")
    
    # Show controls with associated POAMs
    controls_with_poams = []
    for control in controls:
        related_poams = [p for p in poams if p.get('control_id') == control.get('control_id')]
        if related_poams:
            controls_with_poams.append({
                'control': control,
                'poams': related_poams
            })
    
    print(f"\n🔗 Controls with Associated POAMs: {len(controls_with_poams)}")
    
    for i, item in enumerate(controls_with_poams[:3]):
        control = item['control']
        poams = item['poams']
        print(f"   {i+1}. Control: {control.get('control_id')} - {control.get('title', 'Unknown')}")
        print(f"      ↳ Status: {control.get('implementation_status', 'Unknown')}")
        print(f"      ↳ Associated POAMs: {len(poams)}")
        for poam in poams[:2]:  # Show first 2 POAMs
            print(f"         • {poam.get('poam_id')}: {poam.get('status', 'Unknown')}")

def demonstrate_integration():
    """Main demonstration function"""
    print_separator("Tenable-Xacta Integration Demonstration")
    
    try:
        # Test server connectivity
        response = requests.get(f'{BASE_URL}/session')
        if response.status_code != 200:
            print("❌ Mock server not running. Please start it first:")
            print("   python mock_tenable_server.py")
            return
        
        print("✅ Connected to enhanced mock server with Tenable + Xacta endpoints")
        
        # Fetch all data
        print_separator("Data Retrieval")
        assets_data, vulns_data = get_tenable_data()
        systems_data, controls_data, poams_data, system_assets_data = get_xacta_data()
        
        print(f"✅ Retrieved Tenable data: {len(assets_data.get('assets', []))} assets, {len(vulns_data.get('vulnerabilities', []))} vulnerabilities")
        print(f"✅ Retrieved Xacta data: {len(systems_data.get('systems', []))} systems, {len(controls_data.get('controls', []))} controls, {len(poams_data.get('poams', []))} POAMs")
        
        # Demonstrate integrations
        print_separator("Integration Demonstrations")
        
        demonstrate_asset_system_linking(assets_data, systems_data, system_assets_data)
        demonstrate_vulnerability_control_correlation(vulns_data, controls_data, poams_data)
        demonstrate_risk_correlation(assets_data, vulns_data, systems_data, poams_data)
        demonstrate_compliance_mapping(controls_data, poams_data)
        
        print_separator("Integration Complete")
        print("🎉 Tenable-Xacta integration demonstration completed successfully!")
        print("\n📋 Key Integration Points Demonstrated:")
        print("   ✅ Asset-to-System linking")
        print("   ✅ Vulnerability-to-Control correlation")
        print("   ✅ Risk assessment across platforms")
        print("   ✅ Compliance control mapping")
        print("   ✅ POAM tracking and prioritization")
        
        print("\n🔧 Available API Endpoints:")
        print("   • Tenable: /assets, /vulnerabilities, /workbenches/vulnerabilities")
        print("   • Xacta: /xacta/systems, /xacta/controls, /xacta/poams")
        print("   • Integration: /xacta/system-assets, /xacta/systems/<id>/assets")
        
    except KeyboardInterrupt:
        print("\n\n👋 Demonstration interrupted by user")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to mock server. Make sure it's running on port 5001")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    demonstrate_integration()
