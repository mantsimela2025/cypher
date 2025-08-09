#!/usr/bin/env python3
"""
Test Scheduled Changes in Mock Tenable Server
Demonstrates how the mock server simulates vulnerability remediation and new findings over time
"""

import requests
import time
import json
from datetime import datetime

BASE_URL = 'http://localhost:5001'

def print_separator(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def get_vulnerability_summary():
    """Get current vulnerability summary"""
    response = requests.get(f'{BASE_URL}/workbenches/vulnerabilities')
    if response.status_code == 200:
        data = response.json()
        return data.get('summary', {})
    return {}

def get_scan_status():
    """Get current scan status"""
    response = requests.get(f'{BASE_URL}/scan/status')
    if response.status_code == 200:
        return response.json()
    return {}

def force_scan():
    """Force a new scan simulation"""
    response = requests.post(f'{BASE_URL}/force-scan')
    if response.status_code == 200:
        return response.json()
    return {}

def reset_data():
    """Reset mock data to initial state"""
    response = requests.post(f'{BASE_URL}/reset')
    if response.status_code == 200:
        return response.json()
    return {}

def print_vulnerability_summary(summary, title="Current Vulnerability Summary"):
    """Print vulnerability summary in a nice format"""
    print(f"\n📊 {title}")
    
    if 'by_severity' in summary:
        severity_data = summary['by_severity']
        print("  By Severity:")
        for severity in ['critical', 'high', 'medium', 'low', 'info']:
            count = severity_data.get(severity, 0)
            print(f"    {severity.title():>8}: {count:>4}")
    
    if 'by_state' in summary:
        state_data = summary['by_state']
        print("  By State:")
        for state in ['open', 'fixed', 'reopened']:
            count = state_data.get(state, 0)
            print(f"    {state.title():>8}: {count:>4}")
    
    total = summary.get('total', 0)
    print(f"    {'Total':>8}: {total:>4}")

def demonstrate_scheduled_changes():
    """Demonstrate how vulnerabilities change over time"""
    
    print_separator("Mock Tenable Server - Scheduled Change Demonstration")
    
    print("🚀 This demonstration shows how the mock server simulates:")
    print("   • Vulnerability remediation (fixes)")
    print("   • New vulnerability discoveries")
    print("   • Asset status changes")
    print("   • Vulnerability reopening (regression)")
    
    # Reset data to start fresh
    print_separator("Step 1: Reset Data to Initial State")
    reset_result = reset_data()
    print(f"✅ Data reset: {reset_result.get('assets', 0)} assets, {reset_result.get('vulnerabilities', 0)} vulnerabilities")
    
    # Get initial state
    initial_summary = get_vulnerability_summary()
    print_vulnerability_summary(initial_summary, "Initial State")
    
    # Wait and show changes over time
    for scan_round in range(1, 4):
        print_separator(f"Step {scan_round + 1}: Simulate Scan Round {scan_round}")
        
        print("🔄 Forcing new scan simulation...")
        scan_result = force_scan()
        
        if 'changes' in scan_result and scan_result['changes']:
            changes = scan_result['changes']
            print(f"📈 Changes detected:")
            
            if 'vulnerability_changes' in changes:
                vc = changes['vulnerability_changes']
                print(f"   • Vulnerabilities remediated: {vc.get('remediated', 0)}")
                print(f"   • New vulnerabilities found: {vc.get('new_vulns', 0)}")
                print(f"   • Vulnerabilities reopened: {vc.get('reopened', 0)}")
            
            if 'asset_changes' in changes:
                ac = changes['asset_changes']
                print(f"   • Assets went offline: {ac.get('offline_assets', 0)}")
                print(f"   • Assets updated: {ac.get('updated_assets', 0)}")
        else:
            print("📊 No changes detected (may need to wait longer)")
        
        # Get updated summary
        current_summary = get_vulnerability_summary()
        print_vulnerability_summary(current_summary, f"After Scan Round {scan_round}")
        
        # Show comparison with initial state
        if 'by_state' in initial_summary and 'by_state' in current_summary:
            initial_open = initial_summary['by_state'].get('open', 0)
            current_open = current_summary['by_state'].get('open', 0)
            initial_fixed = initial_summary['by_state'].get('fixed', 0)
            current_fixed = current_summary['by_state'].get('fixed', 0)
            
            print(f"📊 Changes from initial state:")
            print(f"   • Open vulnerabilities: {initial_open} → {current_open} (Δ {current_open - initial_open:+d})")
            print(f"   • Fixed vulnerabilities: {initial_fixed} → {current_fixed} (Δ {current_fixed - initial_fixed:+d})")
        
        if scan_round < 3:
            print(f"\n⏳ Waiting 10 seconds before next scan...")
            time.sleep(10)
    
    print_separator("Step 5: Final Scan Status")
    
    scan_status = get_scan_status()
    if scan_status:
        print("📊 Final Scan Status:")
        print(f"   • Last scan: {scan_status.get('scan_info', {}).get('last_scan', 'Unknown')}")
        print(f"   • Scan interval: {scan_status.get('scan_info', {}).get('scan_interval', 'Unknown')}")
        
        if 'change_simulation' in scan_status:
            cs = scan_status['change_simulation']
            print(f"📈 Change Simulation Settings:")
            print(f"   • Remediation rate: {cs.get('remediation_rate', 'Unknown')}")
            print(f"   • New vulnerability rate: {cs.get('new_vulnerability_rate', 'Unknown')}")
            print(f"   • Asset offline rate: {cs.get('asset_offline_rate', 'Unknown')}")

def test_real_time_monitoring():
    """Test real-time monitoring of changes"""
    
    print_separator("Real-Time Change Monitoring Test")
    
    print("🔄 This test monitors changes in real-time...")
    print("   The mock server simulates new scans every 5 minutes")
    print("   We'll check for changes every 30 seconds for 3 minutes")
    
    start_time = datetime.now()
    check_interval = 30  # seconds
    total_duration = 180  # 3 minutes
    
    initial_summary = get_vulnerability_summary()
    print_vulnerability_summary(initial_summary, "Starting State")
    
    elapsed = 0
    while elapsed < total_duration:
        time.sleep(check_interval)
        elapsed += check_interval
        
        print(f"\n⏰ Check at {elapsed} seconds...")
        
        current_summary = get_vulnerability_summary()
        
        # Check if anything changed
        if initial_summary != current_summary:
            print("📈 Changes detected!")
            print_vulnerability_summary(current_summary, "Updated State")
            
            # Update baseline for next comparison
            initial_summary = current_summary
        else:
            print("📊 No changes detected")
    
    print(f"\n✅ Real-time monitoring completed after {total_duration} seconds")

if __name__ == "__main__":
    try:
        # Test server connectivity
        response = requests.get(f'{BASE_URL}/session')
        if response.status_code != 200:
            print("❌ Mock server not running. Please start it first:")
            print("   python mock_tenable_server.py")
            exit(1)
        
        print("✅ Connected to mock Tenable server")
        
        # Run demonstrations
        demonstrate_scheduled_changes()
        
        print("\n" + "="*60)
        print("Would you like to run real-time monitoring test? (y/n): ", end="")
        if input().lower().startswith('y'):
            test_real_time_monitoring()
        
        print_separator("Demonstration Complete")
        print("🎉 The mock server will continue simulating changes every 5 minutes")
        print("🔍 You can check /scan/status endpoint for current state")
        print("🔄 Use /force-scan to trigger immediate changes")
        print("🔄 Use /reset to start over with fresh data")
        
    except KeyboardInterrupt:
        print("\n\n👋 Demonstration interrupted by user")
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to mock server. Make sure it's running on port 5001")
    except Exception as e:
        print(f"❌ Error: {e}")
