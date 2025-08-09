#!/usr/bin/env python3
"""
Mock Tenable Server for Local Testing
Provides realistic Tenable API responses without requiring cloud access
"""

from flask import Flask, jsonify, request
import json
import uuid
from datetime import datetime, timedelta
import random
import time
import os
import pickle
import requests

app = Flask(__name__)

# Mock data storage
mock_assets = []
mock_vulnerabilities = []
mock_systems = []
mock_controls = []
mock_poams = []
mock_system_assets = []
mock_cves = []  # Store real CVE data
mock_scans = []

# Data persistence and change simulation
DATA_FILE = 'mock_data_state.pkl'
LAST_SCAN_TIME = None
SCAN_INTERVAL_HOURS = 24  # Simulate daily scans
REMEDIATION_RATE = 0.05   # 5% of vulnerabilities get fixed per day
NEW_VULN_RATE = 0.02      # 2% chance of new vulnerabilities per asset per day

def fetch_real_cves(limit=100):
    """Fetch real CVE data from NVD API"""
    global mock_cves

    if mock_cves:  # Return cached CVEs if already fetched
        return mock_cves[:limit]

    try:
        print("🔄 Fetching real CVE data from NVD...")

        # Get recent CVEs from last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        url = "https://services.nvd.nist.gov/rest/json/cves/2.0"
        params = {
            'pubStartDate': start_date.strftime('%Y-%m-%dT%H:%M:%S.000'),
            'pubEndDate': end_date.strftime('%Y-%m-%dT%H:%M:%S.000'),
            'resultsPerPage': min(limit, 100)  # NVD max is 2000, but we'll be conservative
        }

        # Add delay to respect rate limits (6 seconds for public API)
        time.sleep(6)

        response = requests.get(url, params=params, timeout=30)

        if response.status_code == 200:
            data = response.json()
            vulnerabilities = data.get('vulnerabilities', [])

            print(f"✅ Fetched {len(vulnerabilities)} real CVEs from NVD")

            # Process CVE data into our format
            processed_cves = []
            for vuln_data in vulnerabilities:
                cve = vuln_data.get('cve', {})
                cve_id = cve.get('id', '')

                # Extract CVSS scores
                metrics = cve.get('metrics', {})
                cvss_v3 = metrics.get('cvssMetricV31', [{}])[0] if metrics.get('cvssMetricV31') else metrics.get('cvssMetricV30', [{}])[0] if metrics.get('cvssMetricV30') else {}
                cvss_v2 = metrics.get('cvssMetricV2', [{}])[0] if metrics.get('cvssMetricV2') else {}

                cvss_data = cvss_v3.get('cvssData', {}) or cvss_v2.get('cvssData', {})
                base_score = cvss_data.get('baseScore', random.uniform(1.0, 10.0))
                severity = cvss_data.get('baseSeverity', '').lower()

                # Map NVD severity to our format
                if not severity:
                    if base_score >= 9.0:
                        severity = 'critical'
                    elif base_score >= 7.0:
                        severity = 'high'
                    elif base_score >= 4.0:
                        severity = 'medium'
                    elif base_score >= 0.1:
                        severity = 'low'
                    else:
                        severity = 'info'

                # Get description
                descriptions = cve.get('descriptions', [])
                description = next((d['value'] for d in descriptions if d.get('lang') == 'en'), 'No description available')

                # Get references
                references = cve.get('references', [])
                reference_urls = [ref.get('url', '') for ref in references[:3]]  # Limit to 3 refs

                processed_cve = {
                    'cve_id': cve_id,
                    'description': description,
                    'cvss_score': round(base_score, 1),
                    'severity': severity,
                    'published_date': cve.get('published', ''),
                    'last_modified': cve.get('lastModified', ''),
                    'references': reference_urls,
                    'vector_string': cvss_data.get('vectorString', ''),
                    'raw_data': vuln_data
                }
                processed_cves.append(processed_cve)

            mock_cves = processed_cves
            return processed_cves[:limit]

        else:
            print(f"⚠️  Failed to fetch CVEs from NVD (status: {response.status_code})")
            print("   Using fallback mock CVE data")
            return generate_fallback_cves(limit)

    except Exception as e:
        print(f"⚠️  Error fetching CVEs from NVD: {e}")
        print("   Using fallback mock CVE data")
        return generate_fallback_cves(limit)

def generate_fallback_cves(limit=100):
    """Generate fallback CVE data when NVD is unavailable"""
    fallback_cves = []

    for i in range(limit):
        year = random.choice([2023, 2024, 2025])
        cve_id = f"CVE-{year}-{random.randint(1000, 99999)}"

        base_score = random.uniform(1.0, 10.0)
        if base_score >= 9.0:
            severity = 'critical'
        elif base_score >= 7.0:
            severity = 'high'
        elif base_score >= 4.0:
            severity = 'medium'
        elif base_score >= 0.1:
            severity = 'low'
        else:
            severity = 'info'

        fallback_cve = {
            'cve_id': cve_id,
            'description': f"Mock vulnerability {cve_id} - {severity} severity security issue",
            'cvss_score': round(base_score, 1),
            'severity': severity,
            'published_date': (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            'last_modified': (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            'references': [
                f"https://nvd.nist.gov/vuln/detail/{cve_id}",
                f"https://cve.mitre.org/cgi-bin/cvename.cgi?name={cve_id}"
            ],
            'vector_string': f"CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
            'raw_data': {'fallback': True}
        }
        fallback_cves.append(fallback_cve)

    return fallback_cves

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
    """Generate vulnerabilities using real CVE data from NVD"""
    vulnerabilities = []
    plugin_families = ["Windows", "Ubuntu Local Security Checks", "Web Servers", "Databases", "Network Security"]

    # Fetch real CVE data
    print("🔄 Generating vulnerabilities with real CVE data...")
    real_cves = fetch_real_cves(limit=200)  # Get more CVEs than we need

    if not real_cves:
        print("⚠️  No CVE data available, using basic mock data")
        real_cves = generate_fallback_cves(200)

    cve_index = 0

    for asset_idx in range(asset_count):
        for vuln_idx in range(random.randint(1, vuln_per_asset)):
            # Use real CVE data if available, otherwise fallback
            if cve_index < len(real_cves):
                cve_data = real_cves[cve_index]
                cve_index += 1

                # Use CVE data for vulnerability
                severity = cve_data['severity']
                severity_id = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}[severity]
                cvss_score = cve_data['cvss_score']
                cve_id = cve_data['cve_id']
                description = cve_data['description'][:300] + "..." if len(cve_data['description']) > 300 else cve_data['description']

                vuln = {
                    "asset": {
                        "id": str(uuid.uuid4()),
                        "hostname": f"server-{asset_idx+1}.example.com",
                        "ipv4": f"192.168.1.{asset_idx+10}"
                    },
                    "plugin": {
                        "id": 10000 + (asset_idx * vuln_per_asset) + vuln_idx,
                        "name": f"{cve_id}: {description.split('.')[0] if '.' in description else description[:50]}",
                        "family": random.choice(plugin_families),
                        "modification_date": cve_data.get('last_modified', datetime.now().isoformat())[:10],
                        "publication_date": cve_data.get('published_date', datetime.now().isoformat())[:10],
                        "risk_factor": severity.title(),
                        "solution": f"Apply security patches to address {cve_id}. See references for more details.",
                        "synopsis": f"{cve_id} - {severity.title()} severity vulnerability",
                        "description": description,
                        "version": "1.0",
                        "cve": [cve_id],  # Link to CVE
                        "xrefs": cve_data.get('references', [])
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
                    "cvss_base_score": cvss_score,
                    "cvss_temporal_score": round(cvss_score * random.uniform(0.8, 1.0), 1),
                    "cvss_vector": cve_data.get('vector_string', "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"),
                    "vpr_score": round(cvss_score * random.uniform(0.9, 1.1), 1),
                    "output": f"{cve_id} vulnerability detected - {severity} level finding",
                    "port": random.choice([80, 443, 22, 3389, 21, 25, 53]),
                    "protocol": random.choice(["tcp", "udp"]),
                    "indexed": datetime.now().isoformat(),
                    "cve_data": cve_data  # Store full CVE data for reference
                }
            else:
                # Fallback to basic mock data if we run out of CVEs
                severity = random.choice(["critical", "high", "medium", "low", "info"])
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

    print(f"✅ Generated {len(vulnerabilities)} vulnerabilities ({cve_index} with real CVE data)")
    return vulnerabilities

def generate_mock_systems(count=20):
    """Generate mock Xacta systems"""
    systems = []
    system_types = ["Information System", "Major Application", "General Support System", "Minor Application"]
    impact_levels = ["Low", "Moderate", "High"]
    statuses = ["Operational", "Under Development", "Disposition", "Other"]

    for i in range(count):
        system_id = f"SYS-{i+1:03d}"
        system = {
            "system_id": system_id,
            "system_name": f"System {i+1}",
            "system_type": random.choice(system_types),
            "description": f"Mock system {i+1} for testing integration",
            "status": random.choice(statuses),
            "impact_level": random.choice(impact_levels),
            "confidentiality_impact": random.choice(impact_levels),
            "integrity_impact": random.choice(impact_levels),
            "availability_impact": random.choice(impact_levels),
            "system_owner": f"owner{i+1}@example.com",
            "authorizing_official": f"ao{i+1}@example.com",
            "created_date": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat(),
            "last_updated": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            "authorization_date": (datetime.now() - timedelta(days=random.randint(1, 180))).isoformat(),
            "authorization_termination_date": (datetime.now() + timedelta(days=random.randint(180, 1095))).isoformat(),
            "raw_data": {
                "xacta_id": f"xacta-{system_id.lower()}",
                "compliance_framework": random.choice(["NIST 800-53", "FISMA", "FedRAMP"]),
                "environment": random.choice(["Production", "Development", "Test", "Staging"])
            }
        }
        systems.append(system)
    return systems

def generate_mock_controls(count=50):
    """Generate mock NIST controls"""
    controls = []
    families = {
        "AC": "Access Control",
        "AU": "Audit and Accountability",
        "AT": "Awareness and Training",
        "CM": "Configuration Management",
        "CP": "Contingency Planning",
        "IA": "Identification and Authentication",
        "IR": "Incident Response",
        "MA": "Maintenance",
        "MP": "Media Protection",
        "PS": "Personnel Security",
        "PE": "Physical and Environmental Protection",
        "PL": "Planning",
        "PM": "Program Management",
        "RA": "Risk Assessment",
        "CA": "Security Assessment and Authorization",
        "SC": "System and Communications Protection",
        "SI": "System and Information Integrity",
        "SA": "System and Services Acquisition"
    }

    statuses = ["Not Implemented", "Planned", "Partially Implemented", "Implemented", "Not Applicable"]

    for family_code, family_name in families.items():
        for i in range(1, random.randint(2, 4)):  # 1-3 controls per family
            control_id = f"{family_code}-{i}"
            control = {
                "control_id": control_id,
                "family": family_name,
                "title": f"{family_name} Control {i}",
                "description": f"Mock control {control_id} for {family_name.lower()}",
                "baseline": random.choice(["Low", "Moderate", "High"]),
                "priority": random.choice(["P0", "P1", "P2", "P3"]),
                "status": random.choice(statuses),
                "implementation_status": random.choice(statuses),
                "assessment_status": random.choice(["Not Assessed", "Pending", "In Progress", "Assessed", "Overdue"]),
                "responsible_role": random.choice(["System Administrator", "Security Officer", "System Owner"]),
                "implementation_guidance": f"Implementation guidance for {control_id}",
                "assessment_procedures": f"Assessment procedures for {control_id}",
                "last_assessed": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
                "next_assessment": (datetime.now() + timedelta(days=random.randint(30, 180))).isoformat(),
                "source": "xacta",
                "raw_data": {
                    "xacta_control_id": f"xacta-{control_id.lower()}",
                    "control_enhancement": random.choice([None, "1", "2", "3"]),
                    "control_type": random.choice(["Technical", "Operational", "Management"])
                }
            }
            controls.append(control)
    return controls

def generate_mock_poams(systems, controls, count=30):
    """Generate mock POAMs linked to systems and controls"""
    poams = []
    statuses = ["Open", "Closed", "Ongoing", "Risk Accepted"]
    priorities = ["Very High", "High", "Moderate", "Low", "Very Low"]

    for i in range(count):
        system = random.choice(systems)
        control = random.choice(controls)

        poam = {
            "poam_id": f"POAM-{i+1:03d}",
            "system_id": system["system_id"],
            "control_id": control["control_id"],
            "weakness_description": f"Mock weakness {i+1} in {system['system_name']}",
            "weakness_source": random.choice(["Security Assessment", "Vulnerability Scan", "Audit", "Self-Assessment"]),
            "status": random.choice(statuses),
            "priority": random.choice(priorities),
            "risk_rating": random.choice(["Very High", "High", "Moderate", "Low", "Very Low"]),
            "likelihood": random.choice(["Very High", "High", "Moderate", "Low", "Very Low"]),
            "impact": random.choice(["Very High", "High", "Moderate", "Low", "Very Low"]),
            "point_of_contact": f"poc{i+1}@example.com",
            "scheduled_completion": (datetime.now() + timedelta(days=random.randint(30, 365))).isoformat(),
            "actual_completion": None if random.random() > 0.3 else (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            "milestones": [
                {
                    "milestone_id": f"M{i+1}-1",
                    "description": f"Initial assessment for POAM {i+1}",
                    "scheduled_date": (datetime.now() + timedelta(days=random.randint(7, 30))).isoformat(),
                    "status": random.choice(["Pending", "In Progress", "Complete"])
                },
                {
                    "milestone_id": f"M{i+1}-2",
                    "description": f"Implementation for POAM {i+1}",
                    "scheduled_date": (datetime.now() + timedelta(days=random.randint(30, 90))).isoformat(),
                    "status": random.choice(["Pending", "In Progress", "Complete"])
                }
            ],
            "created_date": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat(),
            "last_updated": (datetime.now() - timedelta(days=random.randint(1, 7))).isoformat(),
            "source": "xacta",
            "raw_data": {
                "xacta_poam_id": f"xacta-poam-{i+1:03d}",
                "weakness_type": random.choice(["Technical", "Operational", "Management"]),
                "remediation_plan": f"Remediation plan for POAM {i+1}"
            }
        }
        poams.append(poam)
    return poams

def generate_system_asset_links(systems, assets):
    """Generate links between Xacta systems and Tenable assets"""
    system_assets = []

    # Ensure each system has at least 2-8 assets
    for system in systems:
        num_assets = random.randint(2, 8)
        selected_assets = random.sample(assets, min(num_assets, len(assets)))

        for asset in selected_assets:
            system_asset = {
                "system_id": system["system_id"],
                "asset_uuid": asset["id"],
                "asset_hostname": asset["hostname"][0] if asset["hostname"] else "unknown",
                "asset_ip": asset["ipv4"][0] if asset["ipv4"] else "unknown",
                "relationship_type": random.choice(["Primary", "Secondary", "Supporting"]),
                "criticality": random.choice(["Critical", "High", "Medium", "Low"]),
                "environment": random.choice(["Production", "Development", "Test", "Staging"]),
                "created_date": datetime.now().isoformat(),
                "last_verified": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                "source": "automated_discovery"
            }
            system_assets.append(system_asset)

    return system_assets

def save_data_state():
    """Save current data state to file"""
    state = {
        'assets': mock_assets,
        'vulnerabilities': mock_vulnerabilities,
        'systems': mock_systems,
        'controls': mock_controls,
        'poams': mock_poams,
        'system_assets': mock_system_assets,
        'cves': mock_cves,
        'last_scan_time': LAST_SCAN_TIME,
        'timestamp': datetime.now()
    }
    try:
        with open(DATA_FILE, 'wb') as f:
            pickle.dump(state, f)
    except Exception as e:
        print(f"Warning: Could not save data state: {e}")

def load_data_state():
    """Load data state from file"""
    global mock_assets, mock_vulnerabilities, mock_systems, mock_controls, mock_poams, mock_system_assets, mock_cves, LAST_SCAN_TIME

    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'rb') as f:
                state = pickle.load(f)
                mock_assets = state.get('assets', [])
                mock_vulnerabilities = state.get('vulnerabilities', [])
                mock_systems = state.get('systems', [])
                mock_controls = state.get('controls', [])
                mock_poams = state.get('poams', [])
                mock_system_assets = state.get('system_assets', [])
                mock_cves = state.get('cves', [])
                LAST_SCAN_TIME = state.get('last_scan_time')
                print(f"📁 Loaded existing data state from {state.get('timestamp')}")
                return True
        except Exception as e:
            print(f"Warning: Could not load data state: {e}")

    return False

def simulate_vulnerability_changes():
    """Simulate vulnerability changes over time"""
    global mock_vulnerabilities

    changes = {
        'remediated': 0,
        'new_vulns': 0,
        'reopened': 0
    }

    # Simulate remediation (vulnerabilities getting fixed)
    open_vulns = [v for v in mock_vulnerabilities if v['state'] == 'open']
    remediation_count = int(len(open_vulns) * REMEDIATION_RATE)

    for i in range(min(remediation_count, len(open_vulns))):
        vuln = random.choice(open_vulns)
        vuln['state'] = 'fixed'
        vuln['last_found'] = (datetime.now() - timedelta(days=1)).isoformat()
        open_vulns.remove(vuln)
        changes['remediated'] += 1

    # Simulate new vulnerabilities
    for asset in mock_assets[:10]:  # Only check first 10 assets for performance
        if random.random() < NEW_VULN_RATE:
            new_vuln = generate_new_vulnerability(asset)
            mock_vulnerabilities.append(new_vuln)
            changes['new_vulns'] += 1

    # Simulate some fixed vulnerabilities reopening (regression)
    fixed_vulns = [v for v in mock_vulnerabilities if v['state'] == 'fixed']
    reopen_count = int(len(fixed_vulns) * 0.01)  # 1% chance of reopening

    for i in range(min(reopen_count, len(fixed_vulns))):
        vuln = random.choice(fixed_vulns)
        vuln['state'] = 'reopened'
        vuln['last_found'] = datetime.now().isoformat()
        changes['reopened'] += 1

    return changes

def generate_new_vulnerability(asset):
    """Generate a new vulnerability for an asset"""
    severities = ["critical", "high", "medium", "low", "info"]
    severity = random.choice(severities)
    severity_id = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}[severity]

    return {
        "asset": {
            "id": asset["id"],
            "hostname": asset["hostname"][0] if asset["hostname"] else "unknown",
            "ipv4": asset["ipv4"][0] if asset["ipv4"] else "unknown"
        },
        "plugin": {
            "id": random.randint(20000, 99999),  # Different range for new vulns
            "name": f"New {severity.title()} Vulnerability",
            "family": random.choice(["Windows", "Ubuntu Local Security Checks", "Web Servers"]),
            "modification_date": datetime.now().date().isoformat(),
            "publication_date": datetime.now().date().isoformat(),
            "risk_factor": severity.title(),
            "solution": "Apply the latest security patches and updates.",
            "synopsis": f"A new {severity} severity vulnerability was detected.",
            "description": f"This is a newly discovered {severity} vulnerability.",
            "version": "1.0"
        },
        "scan": {
            "id": random.randint(1000, 9999),
            "uuid": str(uuid.uuid4()),
            "started_at": (datetime.now() - timedelta(hours=1)).isoformat(),
            "completed_at": datetime.now().isoformat()
        },
        "severity": severity,
        "severity_id": severity_id,
        "severity_default_id": severity_id,
        "state": "open",
        "first_found": datetime.now().isoformat(),
        "last_found": datetime.now().isoformat(),
        "cvss_base_score": round(random.uniform(0.0, 10.0), 1),
        "cvss_temporal_score": round(random.uniform(0.0, 10.0), 1),
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "vpr_score": round(random.uniform(0.0, 10.0), 1),
        "output": f"New vulnerability detected - {severity} level finding",
        "port": random.choice([80, 443, 22, 3389, 21, 25, 53]),
        "protocol": random.choice(["tcp", "udp"]),
        "indexed": datetime.now().isoformat()
    }

def simulate_asset_changes():
    """Simulate asset changes over time"""
    changes = {
        'new_assets': 0,
        'updated_assets': 0,
        'offline_assets': 0
    }

    # Simulate some assets going offline
    online_assets = [a for a in mock_assets if a.get('last_seen')]
    offline_count = int(len(online_assets) * 0.02)  # 2% go offline

    for i in range(min(offline_count, len(online_assets))):
        asset = random.choice(online_assets)
        # Make asset appear offline by setting last_seen to several days ago
        asset['last_seen'] = (datetime.now() - timedelta(days=random.randint(3, 7))).isoformat()
        changes['offline_assets'] += 1

    # Simulate exposure score changes
    for asset in random.sample(mock_assets, min(20, len(mock_assets))):
        old_score = asset.get('exposure_score', 0)
        # Exposure scores can fluctuate
        change = random.randint(-100, 100)
        asset['exposure_score'] = max(0, min(1000, old_score + change))
        asset['last_seen'] = datetime.now().isoformat()
        changes['updated_assets'] += 1

    return changes

def check_and_simulate_changes():
    """Check if it's time to simulate new scan results"""
    global LAST_SCAN_TIME

    now = datetime.now()

    # If no last scan time, set it to now
    if LAST_SCAN_TIME is None:
        LAST_SCAN_TIME = now
        return None

    # Check if enough time has passed for a new "scan"
    time_since_scan = now - LAST_SCAN_TIME

    # For testing, let's make scans happen every 5 minutes instead of 24 hours
    if time_since_scan.total_seconds() > 300:  # 5 minutes
        print(f"🔄 Simulating new scan results (last scan: {LAST_SCAN_TIME})")

        vuln_changes = simulate_vulnerability_changes()
        asset_changes = simulate_asset_changes()

        LAST_SCAN_TIME = now
        save_data_state()

        return {
            'scan_time': now.isoformat(),
            'vulnerability_changes': vuln_changes,
            'asset_changes': asset_changes
        }

    return None

# Initialize mock data
if not load_data_state():
    print("🔄 Generating fresh mock data...")
    mock_assets = generate_mock_assets(100)
    mock_vulnerabilities = generate_mock_vulnerabilities(100, 10)
    mock_systems = generate_mock_systems(20)
    mock_controls = generate_mock_controls()
    mock_poams = generate_mock_poams(mock_systems, mock_controls, 30)
    mock_system_assets = generate_system_asset_links(mock_systems, mock_assets)
    LAST_SCAN_TIME = datetime.now()
    save_data_state()
    print(f"✅ Generated: {len(mock_assets)} assets, {len(mock_vulnerabilities)} vulnerabilities")
    print(f"✅ Generated: {len(mock_systems)} systems, {len(mock_controls)} controls, {len(mock_poams)} POAMs")
    print(f"✅ Generated: {len(mock_system_assets)} system-asset links")
    print(f"✅ Integrated: {len(mock_cves)} real CVEs from NVD")
else:
    print("📊 Using existing mock data with historical changes")
    print(f"📊 Loaded: {len(mock_assets)} assets, {len(mock_vulnerabilities)} vulnerabilities")
    print(f"📊 Loaded: {len(mock_systems)} systems, {len(mock_controls)} controls, {len(mock_poams)} POAMs")

# =============================================================================
# XACTA API ENDPOINTS
# =============================================================================

@app.route('/xacta/systems', methods=['GET'])
def get_xacta_systems():
    """Get all systems from Xacta"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    return jsonify({
        "systems": mock_systems[start_idx:end_idx],
        "total": len(mock_systems),
        "page": page,
        "per_page": per_page
    })

@app.route('/xacta/systems/<system_id>', methods=['GET'])
def get_xacta_system(system_id):
    """Get specific system by ID"""
    system = next((s for s in mock_systems if s['system_id'] == system_id), None)
    if system:
        return jsonify(system)
    return jsonify({"error": "System not found"}), 404

@app.route('/xacta/systems/<system_id>/assets', methods=['GET'])
def get_system_assets(system_id):
    """Get assets linked to a specific system"""
    system_asset_links = [sa for sa in mock_system_assets if sa['system_id'] == system_id]

    # Enrich with full asset data
    enriched_assets = []
    for link in system_asset_links:
        asset = next((a for a in mock_assets if a['id'] == link['asset_uuid']), None)
        if asset:
            enriched_asset = {
                **link,
                "asset_data": asset
            }
            enriched_assets.append(enriched_asset)

    return jsonify({
        "system_id": system_id,
        "assets": enriched_assets,
        "total": len(enriched_assets)
    })

@app.route('/xacta/controls', methods=['GET'])
def get_xacta_controls():
    """Get all controls from Xacta"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    family = request.args.get('family')
    status = request.args.get('status')

    filtered_controls = mock_controls

    if family:
        filtered_controls = [c for c in filtered_controls if c['family'].lower() == family.lower()]

    if status:
        filtered_controls = [c for c in filtered_controls if c['status'].lower() == status.lower()]

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    return jsonify({
        "controls": filtered_controls[start_idx:end_idx],
        "total": len(filtered_controls),
        "page": page,
        "per_page": per_page,
        "filters": {
            "family": family,
            "status": status
        }
    })

@app.route('/xacta/poams', methods=['GET'])
def get_xacta_poams():
    """Get all POAMs from Xacta"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    system_id = request.args.get('system_id')
    status = request.args.get('status')

    filtered_poams = mock_poams

    if system_id:
        filtered_poams = [p for p in filtered_poams if p['system_id'] == system_id]

    if status:
        filtered_poams = [p for p in filtered_poams if p['status'].lower() == status.lower()]

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    return jsonify({
        "poams": filtered_poams[start_idx:end_idx],
        "total": len(filtered_poams),
        "page": page,
        "per_page": per_page,
        "filters": {
            "system_id": system_id,
            "status": status
        }
    })

@app.route('/xacta/system-assets', methods=['GET'])
def get_xacta_system_assets():
    """Get all system-asset relationships"""
    system_id = request.args.get('system_id')
    asset_uuid = request.args.get('asset_uuid')

    filtered_links = mock_system_assets

    if system_id:
        filtered_links = [sa for sa in filtered_links if sa['system_id'] == system_id]

    if asset_uuid:
        filtered_links = [sa for sa in filtered_links if sa['asset_uuid'] == asset_uuid]

    return jsonify({
        "system_assets": filtered_links,
        "total": len(filtered_links)
    })

# =============================================================================
# TENABLE API ENDPOINTS
# =============================================================================

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
    # Check for data changes before returning assets
    changes = check_and_simulate_changes()
    if changes:
        print(f"📊 Data changes simulated: {changes}")

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    return jsonify({
        "assets": mock_assets[start_idx:end_idx],
        "total": len(mock_assets),
        "page": page,
        "per_page": per_page,
        "last_scan": LAST_SCAN_TIME.isoformat() if LAST_SCAN_TIME else None,
        "changes": changes
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
    # Check for data changes before returning vulnerabilities
    changes = check_and_simulate_changes()
    if changes:
        print(f"📊 Data changes simulated: {changes}")

    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    state_counts = {"open": 0, "fixed": 0, "reopened": 0}

    for vuln in mock_vulnerabilities:
        severity_counts[vuln["severity"]] += 1
        state_counts[vuln["state"]] += 1

    vulnerabilities = []
    for severity, count in severity_counts.items():
        if count > 0:
            vulnerabilities.append({
                "severity_name": severity,
                "count": count,
                "plugin_family": "Mixed"
            })

    return jsonify({
        "vulnerabilities": vulnerabilities,
        "summary": {
            "by_severity": severity_counts,
            "by_state": state_counts,
            "total": len(mock_vulnerabilities)
        },
        "last_scan": LAST_SCAN_TIME.isoformat() if LAST_SCAN_TIME else None,
        "changes": changes
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

@app.route('/vulnerabilities', methods=['GET'])
def get_vulnerabilities_list():
    """Return actual vulnerability records (not just summary)"""
    # Check for data changes before returning vulnerabilities
    changes = check_and_simulate_changes()
    if changes:
        print(f"📊 Data changes simulated: {changes}")

    # Get pagination parameters
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    return jsonify({
        "vulnerabilities": mock_vulnerabilities[start_idx:end_idx],
        "total": len(mock_vulnerabilities),
        "page": page,
        "per_page": per_page,
        "last_scan": LAST_SCAN_TIME.isoformat() if LAST_SCAN_TIME else None,
        "changes": changes
    })

@app.route('/cves', methods=['GET'])
def get_cves():
    """Get CVE data used in vulnerabilities"""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    severity = request.args.get('severity')

    filtered_cves = mock_cves

    if severity:
        filtered_cves = [c for c in filtered_cves if c.get('severity', '').lower() == severity.lower()]

    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page

    return jsonify({
        "cves": filtered_cves[start_idx:end_idx],
        "total": len(filtered_cves),
        "page": page,
        "per_page": per_page,
        "filters": {
            "severity": severity
        }
    })

@app.route('/cves/<cve_id>', methods=['GET'])
def get_cve_details(cve_id):
    """Get specific CVE details"""
    cve = next((c for c in mock_cves if c.get('cve_id') == cve_id), None)
    if cve:
        return jsonify(cve)
    return jsonify({"error": "CVE not found"}), 404

@app.route('/scan/status', methods=['GET'])
def get_scan_status():
    """Get current scan status and change information"""
    changes = check_and_simulate_changes()

    # Calculate current statistics
    vuln_by_severity = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    vuln_by_state = {"open": 0, "fixed": 0, "reopened": 0}

    for vuln in mock_vulnerabilities:
        vuln_by_severity[vuln["severity"]] += 1
        vuln_by_state[vuln["state"]] += 1

    return jsonify({
        "scan_info": {
            "last_scan": LAST_SCAN_TIME.isoformat() if LAST_SCAN_TIME else None,
            "next_scan": (LAST_SCAN_TIME + timedelta(minutes=5)).isoformat() if LAST_SCAN_TIME else None,
            "scan_interval": "5 minutes (for testing)"
        },
        "current_stats": {
            "assets": {
                "total": len(mock_assets),
                "online": len([a for a in mock_assets if (datetime.now() - datetime.fromisoformat(a['last_seen'].replace('Z', '+00:00'))).days < 2]),
                "offline": len([a for a in mock_assets if (datetime.now() - datetime.fromisoformat(a['last_seen'].replace('Z', '+00:00'))).days >= 2])
            },
            "vulnerabilities": {
                "by_severity": vuln_by_severity,
                "by_state": vuln_by_state,
                "total": len(mock_vulnerabilities)
            }
        },
        "recent_changes": changes,
        "change_simulation": {
            "remediation_rate": f"{REMEDIATION_RATE * 100}% per scan",
            "new_vulnerability_rate": f"{NEW_VULN_RATE * 100}% per asset per scan",
            "asset_offline_rate": "2% per scan"
        }
    })

@app.route('/reset', methods=['POST'])
def reset_data():
    """Reset mock data to initial state"""
    global mock_assets, mock_vulnerabilities, LAST_SCAN_TIME

    print("🔄 Resetting mock data to initial state...")
    mock_assets = generate_mock_assets(100)
    mock_vulnerabilities = generate_mock_vulnerabilities(100, 10)
    LAST_SCAN_TIME = datetime.now()

    # Remove saved state file
    if os.path.exists(DATA_FILE):
        os.remove(DATA_FILE)

    save_data_state()

    return jsonify({
        "message": "Mock data reset to initial state",
        "assets": len(mock_assets),
        "vulnerabilities": len(mock_vulnerabilities),
        "reset_time": datetime.now().isoformat()
    })

@app.route('/force-scan', methods=['POST'])
def force_scan():
    """Force a new scan simulation immediately"""
    global LAST_SCAN_TIME

    print("🔄 Forcing new scan simulation...")

    # Set last scan time to trigger immediate simulation
    LAST_SCAN_TIME = datetime.now() - timedelta(minutes=10)

    # Trigger simulation
    changes = check_and_simulate_changes()

    return jsonify({
        "message": "Forced scan simulation completed",
        "changes": changes,
        "scan_time": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Enhanced Mock Tenable + Xacta Server...")
    print("Access at: http://localhost:5001")
    print("")
    print("🔧 TENABLE API ENDPOINTS:")
    print("  GET  /session")
    print("  GET  /scans")
    print("  GET  /assets                    - Asset listing (with change simulation)")
    print("  POST /assets/export")
    print("  GET  /vulnerabilities           - Individual vulnerability records (with CVE data)")
    print("  GET  /workbenches/vulnerabilities - Vulnerability summary (counts)")
    print("  POST /vulns/export")
    print("  GET  /scan/status               - Current scan status and changes")
    print("  POST /reset                     - Reset data to initial state")
    print("  POST /force-scan                - Force immediate scan simulation")
    print("")
    print("🔒 CVE/NVD INTEGRATION:")
    print("  GET  /cves                      - All CVE data (real from NVD)")
    print("  GET  /cves/<cve_id>             - Specific CVE details")
    print("  GET  /cves?severity=critical    - Filter CVEs by severity")
    print("")
    print("🏢 XACTA API ENDPOINTS:")
    print("  GET  /xacta/systems             - All systems")
    print("  GET  /xacta/systems/<id>        - Specific system")
    print("  GET  /xacta/systems/<id>/assets - Assets linked to system")
    print("  GET  /xacta/controls            - All controls (filterable)")
    print("  GET  /xacta/controls/<id>       - Specific control")
    print("  GET  /xacta/poams               - All POAMs (filterable)")
    print("  GET  /xacta/poams/<id>          - Specific POAM")
    print("  GET  /xacta/system-assets       - System-asset relationships")
    print("")
    print("🔄 Change Simulation Features:")
    print(f"  • Scans every 5 minutes (for testing)")
    print(f"  • {REMEDIATION_RATE * 100}% of vulnerabilities get fixed per scan")
    print(f"  • {NEW_VULN_RATE * 100}% chance of new vulnerabilities per asset")
    print(f"  • 2% of assets may go offline per scan")
    print(f"  • 1% of fixed vulnerabilities may reopen")
    print("")
    print("📁 Data persistence: mock_data_state.pkl")

    app.run(host='0.0.0.0', port=5001, debug=True)
