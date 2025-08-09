# Metasploitable Scanner Command Cheatsheet

## Quick Reference for Scanner Commands

This cheatsheet provides ready-to-use commands for vulnerability scanning against Metasploitable VMs. Replace `[IP_ADDRESS]` with your Metasploitable VM's actual IP address.

## Basic Commands

### Port Scanning

**Full Port Scan:**
```
port-scan [IP_ADDRESS] --ports 1-65535
```

**Common Ports Only:**
```
port-scan [IP_ADDRESS] --ports 21,22,23,25,80,110,139,143,443,445,3306,3389,8080
```

**Service Detection:**
```
port-scan [IP_ADDRESS] --ports 1-1000 --timeout 5000 --comprehensive true
```

### Vulnerability Scanning

**Basic Vulnerability Scan:**
```
vuln-scan [IP_ADDRESS]
```

**Comprehensive Vulnerability Scan:**
```
vuln-scan [IP_ADDRESS] --checks all --ports 1-65535 --comprehensive true
```

**Targeted Port Scan:**
```
vuln-scan [IP_ADDRESS] --ports 21,22,80,443,3306
```

### Server Information

**Server Information and OS Detection:**
```
server-scan [IP_ADDRESS] --os-detection --service-detection
```

## Service-Specific Commands

### Web Applications

**General Web Scan:**
```
web-scan http://[IP_ADDRESS] --checks all
```

**DVWA Scan:**
```
web-scan http://[IP_ADDRESS]/dvwa/ --checks all --max-depth 3
```

**Mutillidae Scan:**
```
web-scan http://[IP_ADDRESS]/mutillidae/ --checks all --form-analysis true
```

**WebDAV Scan:**
```
web-scan http://[IP_ADDRESS]/webdav/ --checks all
```

### Database Testing

**MySQL Scan:**
```
vuln-scan [IP_ADDRESS] --ports 3306 --checks db-security
```

**Authenticated Database Scan:**
```
auth-scan [IP_ADDRESS] --scan-type database --port 3306 --db-type mysql --username root --password ''
```

### File Sharing Services

**SMB/Samba Scan:**
```
vuln-scan [IP_ADDRESS] --ports 139,445 --checks smb-security
```

**NFS Scan:**
```
vuln-scan [IP_ADDRESS] --ports 2049 --checks open-ports
```

### Remote Access

**SSH Security Scan:**
```
vuln-scan [IP_ADDRESS] --ports 22 --checks ssh-security
```

**Authenticated SSH Scan:**
```
auth-scan [IP_ADDRESS] --scan-type ssh --username msfadmin --password msfadmin
```

**Telnet Scan:**
```
vuln-scan [IP_ADDRESS] --ports 23 --checks open-ports
```

### Mail Services

**SMTP Security Scan:**
```
vuln-scan [IP_ADDRESS] --ports 25 --checks smtp-security
```

**IMAP Security Scan:**
```
vuln-scan [IP_ADDRESS] --ports 143 --checks open-ports
```

## Specialized Scans

### Compliance Testing

**PCI-DSS Compliance:**
```
compliance-scan [IP_ADDRESS] --frameworks pci-dss
```

**NIST 800-53 Compliance:**
```
compliance-scan [IP_ADDRESS] --frameworks nist-800-53
```

### Internal Scanning

**Configuration Assessment:**
```
internal-scan --scanTypes configuration,compliance --framework nist-800-53
```

### Asset Discovery

**Basic Network Discovery:**
```
asset-discovery [IP_ADDRESS]/24 --methods network
```

**Deep Network Discovery:**
```
asset-discovery [IP_ADDRESS]/24 --methods network --deep full
```

**Single Host Discovery:**
```
asset-discovery [IP_ADDRESS] --methods network --deep full --timeout 10000
```

**Comprehensive Discovery Output:**
```
asset-discovery [IP_ADDRESS] --methods network --comprehensive true --output metasploitable-assets.json
```

**Discovery with Custom Title:**
```
asset-discovery [IP_ADDRESS]/24 --methods network --scan-title "Metasploitable Test Environment"
```

### UI-Based Asset Discovery

To perform discovery via the web interface:

1. **Navigate to the Discovery Page**:
   - Go to `/assets/discovery` in the application

2. **Create New Discovery Task**:
   - Click "Create New Discovery" button

3. **Configure Basic Settings**:
   - Name: "Metasploitable Discovery"
   - Description: "Discovery scan of Metasploitable VM"
   - Network Range: Enter subnet (e.g., 192.168.56.0/24)

4. **Configure Advanced Settings**:
   - Discovery Method: Select "Network"
   - Deep Scan: Enable
   - Service Detection: Enable
   - OS Detection: Enable
   - Port Range: 1-65535 (for complete discovery)

5. **Run the Discovery**:
   - Click "Start Discovery" 
   - Monitor progress on the discovery dashboard

6. **Review Results**:
   - Go to `/assets` to see discovered assets
   - View detailed information about the Metasploitable VM
   - Check identified services and vulnerabilities

## Output Options

Add these parameters to any command to save results:

**Save JSON Results:**
```
--output metasploitable-results.json --format json
```

**Save CSV Results:**
```
--output metasploitable-results.csv --format csv
```

**Comprehensive Output:**
```
--output metasploitable-detailed.json --format json --comprehensive true --scan-title "Metasploitable Test"
```

## Metasploitable Default Credentials

Use these credentials when testing authenticated scanning:

| Service | Username | Password |
|---------|----------|----------|
| SSH/System | msfadmin | msfadmin |
| MySQL | root | *empty* |
| DVWA | admin | password |
| Mutillidae | admin | admin |
| Tomcat | tomcat | tomcat |
| PostgreSQL | postgres | postgres |

## Common Metasploitable Ports

| Port | Service | Known Vulnerabilities |
|------|---------|----------------------|
| 21 | FTP | VSFTPd backdoor, anonymous access |
| 22 | SSH | Weak ciphers, outdated version |
| 23 | Telnet | Cleartext authentication |
| 25 | SMTP | Open relay configuration |
| 80 | HTTP | Multiple vulnerable web apps |
| 139/445 | SMB/Samba | Outdated Samba version |
| 1099 | RMI Registry | Java deserialization |
| 1524 | Backdoor | Shell access |
| 2049 | NFS | Weak configuration |
| 3306 | MySQL | Empty root password |
| 5432 | PostgreSQL | Weak authentication |
| 6667 | UnrealIRCD | Backdoor command execution |
| 8180 | Tomcat | Default credentials |

## Scanning Best Practices

1. Start with asset discovery to identify and catalog the Metasploitable VM
2. Follow with comprehensive port scanning to identify all services
3. Perform service detection to identify software versions
4. Run general vulnerability scans against the entire VM
5. Conduct targeted vulnerability scans against specific services
6. Perform authenticated scanning where applicable
7. Run compliance scans to check regulatory frameworks
8. Compare scan results with known Metasploitable vulnerabilities
9. Document findings in comprehensive reports
10. Verify critical vulnerabilities with manual checks

## Recommended Scanning Sequence

For best results, run scans in this order:

```bash
# 1. Discover the asset
asset-discovery 192.168.56.0/24 --methods network

# 2. Run deep discovery on the specific VM
asset-discovery 192.168.56.x --methods network --deep full

# 3. Perform comprehensive port scan
port-scan 192.168.56.x --ports 1-65535 --comprehensive true

# 4. Detect services and OS
server-scan 192.168.56.x --service-detection --os-detection

# 5. Run general vulnerability scan
vuln-scan 192.168.56.x --checks all --comprehensive true

# 6. Run service-specific scans
vuln-scan 192.168.56.x --ports 21 --checks ftp-security
vuln-scan 192.168.56.x --ports 22 --checks ssh-security
vuln-scan 192.168.56.x --ports 80 --checks http-headers
vuln-scan 192.168.56.x --ports 3306 --checks db-security
web-scan http://192.168.56.x --checks all

# 7. Run authenticated scans
auth-scan 192.168.56.x --scan-type ssh --username msfadmin --password msfadmin
auth-scan 192.168.56.x --scan-type database --port 3306 --db-type mysql --username root --password ''

# 8. Run compliance checks
compliance-scan 192.168.56.x --frameworks pci-dss,nist-800-53
```

## ElasticSearch Monitoring Commands

For comprehensive ElasticSearch setup instructions, see [ElasticSearch Setup Guide](./elasticsearch-setup-guide.md).

Use these commands to monitor Metasploitable testing through ElasticSearch integration:

### Configure ElasticSearch Integration

```bash
# Set up ElasticSearch connection (if not already configured)
siem-config --elasticsearch-url http://[ES_HOST]:9200 --setup

# Create dedicated Metasploitable index
siem-config --create-index metasploitable-data --mapping-template scanner-data

# Configure log forwarding to ElasticSearch
log-forwarder --source scanner --target elasticsearch --scan-id [SCAN_ID]
```

### Real-Time Metrics Monitoring

```bash
# Start real-time scan monitoring
siem-monitor --scan-id [SCAN_ID] --refresh 5s

# Monitor discovery metrics in real-time
siem-monitor --type discovery --target 192.168.56.x --dashboard discovery-metrics

# Track vulnerability detection in real-time
siem-monitor --type vulnerabilities --target 192.168.56.x --severity high,critical

# Enable performance metrics collection
scan-metrics --enable --target 192.168.56.x --output elasticsearch
```

### ElasticSearch Dashboard Management

```bash
# Create a new Metasploitable dashboard
siem-dashboard --create --name "Metasploitable Testing" --default-index metasploitable-data

# Add visualization panels to dashboard
siem-dashboard --add-panel "Vulnerability Timeline" --dashboard "Metasploitable Testing" --type timeline --field detection_time

# Export dashboard
siem-dashboard --export --name "Metasploitable Testing" --output metasploitable-dashboard.json
```

### ElasticSearch Query Examples

Access Kibana directly to run queries like:

```json
// Get all vulnerability detections for Metasploitable
GET metasploitable-*/vulnerabilities/_search
{
  "query": {
    "term": { "target.keyword": "192.168.56.x" }
  },
  "sort": [ { "severity": { "order": "desc" } } ]
}

// Get scan performance metrics
GET metasploitable-*/metrics/_search
{
  "query": {
    "term": { "scan_id.keyword": "[SCAN_ID]" }
  },
  "aggs": {
    "scan_duration": { "avg": { "field": "duration" } }
  }
}
```

---

**Created:** April 23, 2025  
**Last Updated:** April 23, 2025