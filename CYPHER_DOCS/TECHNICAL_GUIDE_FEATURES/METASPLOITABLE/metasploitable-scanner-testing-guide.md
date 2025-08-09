# Metasploitable Scanner Testing Guide

## Overview

This document provides detailed guidance for testing the VulnTrack Pro vulnerability scanner against the intentionally vulnerable Metasploitable virtual machine. Metasploitable is designed to be exploited, making it an ideal test environment for evaluating scanner effectiveness, accuracy, and reporting capabilities.

## Table of Contents

1. [Preparation and Setup](#preparation-and-setup)
2. [Basic Scanning Techniques](#basic-scanning-techniques)
3. [Advanced Scanning Techniques](#advanced-scanning-techniques)
4. [Service-Specific Tests](#service-specific-tests)
5. [Results Analysis](#results-analysis)
6. [Recommended Testing Workflow](#recommended-testing-workflow)
7. [Common Metasploitable Vulnerabilities](#common-metasploitable-vulnerabilities)
8. [Troubleshooting](#troubleshooting)

## Preparation and Setup

### VirtualBox Configuration

1. **Network Configuration**:
   - Set the Metasploitable VM's network adapter to Host-only or Bridged mode
   - Avoid using NAT mode as it will complicate direct scanning
   - Create a dedicated host-only network for isolation if possible

2. **VM Snapshot**:
   - Create a snapshot of the clean Metasploitable VM before testing
   - This allows quick reset if any tests accidentally crash services

3. **Determine IP Address**:
   - Log into Metasploitable (default credentials: `msfadmin`/`msfadmin`)
   - Run `ifconfig` to identify the VM's IP address
   - Confirm connectivity with `ping [IP_ADDRESS]` from the host machine

### Scanner Preparation

1. **Access the Terminal**:
   - Navigate to your application's scan terminal at `/scan-management/terminal`
   - Ensure the scanner has network access to the Metasploitable VM

2. **Create a Test Scan Profile**:
   - Navigate to `/scan-management/templates`
   - Create a new template specifically for Metasploitable testing
   - Document baseline scanning parameters for repeatability

## Basic Scanning Techniques

### Initial Port Scanning

The first step is identifying open ports and services on the Metasploitable VM:

```
port-scan [IP_ADDRESS] --ports 1-65535 --timeout 5000 --comprehensive true
```

This command performs a comprehensive port scan of all possible ports, providing a baseline for further testing.

### Target Service Enumeration

After identifying open ports, enumerate the services running on each port:

```
server-scan [IP_ADDRESS] --service-detection --os-detection
```

### Basic Vulnerability Scan

Run an initial vulnerability scan to identify obvious security issues:

```
vuln-scan [IP_ADDRESS] --ports 1-65535 --checks all
```

This general scan will identify common vulnerabilities across multiple services.

## Advanced Scanning Techniques

### Authenticated Scanning

Metasploitable has multiple services with default credentials. Test authenticated scanning with:

#### SSH Authentication

```
auth-scan [IP_ADDRESS] --scan-type ssh --username msfadmin --password msfadmin
```

#### MySQL Authentication

```
auth-scan [IP_ADDRESS] --scan-type database --port 3306 --db-type mysql --username root --password ''
```

### Compliance Scanning

Test compliance scanning against industry standards:

```
compliance-scan [IP_ADDRESS] --frameworks pci-dss,nist-800-53 --comprehensive true
```

### Asset Discovery

The asset discovery module is a powerful capability that allows you to identify and classify assets on a network. Testing this against Metasploitable provides excellent validation of discovery accuracy.

#### Basic Network Discovery

Discover all assets on the network containing your Metasploitable VM:

```
asset-discovery [IP_ADDRESS]/24 --methods network
```

This command will scan the entire subnet and identify the Metasploitable VM along with other devices.

#### Deep Discovery Scan

For more comprehensive discovery with detailed service identification:

```
asset-discovery [IP_ADDRESS]/24 --methods network --deep full
```

The `--deep full` parameter instructs the scanner to perform intensive service probing and identification.

#### Target-Specific Discovery

To focus discovery directly on the Metasploitable VM:

```
asset-discovery [IP_ADDRESS] --methods network --deep full --timeout 10000
```

#### Discovery with Comprehensive Output

For detailed cataloging of all services and components:

```
asset-discovery [IP_ADDRESS] --methods network --timeout 10000 --comprehensive true --output metasploitable-discovery.json
```

#### Asset Discovery Through the UI

You can also perform discovery through the application interface:

1. Navigate to `/assets/discovery` in the web application
2. Create a new discovery task
3. Configure the following settings:
   - Network Range: Enter the subnet where Metasploitable resides (e.g., 192.168.56.0/24)
   - Discovery Method: Select "Network"
   - Deep Scan: Enable for comprehensive results
   - Scan Options: Enable service detection and OS detection
4. Run the discovery task
5. Review discovered assets in the asset inventory

#### Expected Discovery Results

A successful discovery scan against Metasploitable should identify:

- Basic network information (IP address, hostname if configured)
- Open ports and associated services
- Service versions (many outdated in Metasploitable)
- Operating system details (Linux distribution and version)
- Running applications (web servers, databases, etc.)
- Network connectivity details

The discovery results will be automatically added to your asset inventory, where you can then perform targeted vulnerability assessments.

## Service-Specific Tests

Metasploitable contains numerous vulnerable services that should be tested individually.

### Web Application Testing

Metasploitable includes multiple vulnerable web applications:

#### General Web Scan

```
web-scan http://[IP_ADDRESS] --checks all --max-depth 5 --form-analysis true
```

#### Target DVWA (Damn Vulnerable Web Application)

```
web-scan http://[IP_ADDRESS]/dvwa/ --checks all --max-depth 3
```

#### Target Mutillidae

```
web-scan http://[IP_ADDRESS]/mutillidae/ --checks all --max-depth 3
```

### FTP Server Testing

Metasploitable runs a vulnerable FTP server:

```
vuln-scan [IP_ADDRESS] --ports 21 --checks ftp-security
```

### SSH Security Testing

Test for SSH vulnerabilities:

```
vuln-scan [IP_ADDRESS] --ports 22 --checks ssh-security
```

### Database Security Testing

Test the MySQL database for vulnerabilities:

```
vuln-scan [IP_ADDRESS] --ports 3306 --checks db-security
```

### SMTP Security Testing

Test email server security:

```
vuln-scan [IP_ADDRESS] --ports 25 --checks smtp-security
```

### SMB/Samba Testing

Test Windows file sharing services:

```
vuln-scan [IP_ADDRESS] --ports 139,445 --checks smb-security
```

## Results Analysis

After running the scans, analyze the results to verify scanner accuracy:

### Results Verification Process

1. **Verify True Positives**:
   - Confirm that known Metasploitable vulnerabilities are being detected
   - Check for accurate CVE identification and severity ratings

2. **Identify False Negatives**:
   - Note any known vulnerabilities that weren't detected
   - Document missing detections for scanner improvement

3. **Check False Positives**:
   - Document any reported vulnerabilities that are not actually present
   - Consider tuning scanner sensitivity if false positives are excessive

### Comparing Results

Create a comparison matrix for scan results:

| Vulnerability Type | Expected in Metasploitable | Detected by Scanner | Severity Rating | Comments |
|-------------------|----------------------------|---------------------|----------------|----------|
| Weak SSH Ciphers  | Yes                        | Yes/No              | Medium         |          |
| Anonymous FTP     | Yes                        | Yes/No              | High           |          |
| SQL Injection     | Yes                        | Yes/No              | Critical       |          |
| Default Creds     | Yes                        | Yes/No              | High           |          |

## Recommended Testing Workflow

Follow this workflow for comprehensive scanner testing:

1. **Asset Discovery Phase**:
   - Start with network-wide asset discovery to identify the Metasploitable VM
   - Run a deep discovery scan on the identified Metasploitable IP
   - Verify that the discovery properly identifies the VM's OS and services
   - Document discovery findings as a baseline for subsequent tests

2. **Initial Reconnaissance**:
   - Run port scan to identify all open services
   - Compare port scan results with discovery findings for consistency
   - Document baseline open ports for reference

3. **Service Identification**:
   - Run server scan to identify service versions
   - Note vulnerable service versions for verification
   - Correlate with discovery results to check for any discrepancies

4. **Vulnerability Testing Sequence**:
   - General vulnerability scan
   - Service-specific vulnerability scans
   - Authenticated vulnerability scans
   - Compliance scans

5. **Web Application Testing**:
   - Test general website security
   - Run targeted scans against known vulnerable applications (DVWA, Mutillidae)
   - Test both authenticated and unauthenticated scenarios

6. **Automated Scanning**:
   - Create scheduled scans with different configurations
   - Test scanning templates against the Metasploitable VM
   - Evaluate scan speed and accuracy under different configurations

7. **Documentation and Verification**:
   - Save all scan results with `--output` parameter
   - Compare results against known Metasploitable vulnerabilities
   - Document scanner performance, accuracy, and any issues
   - Create reports for different stakeholder perspectives

## Common Metasploitable Vulnerabilities

Metasploitable contains numerous intentional vulnerabilities. Your scanner should detect many of these:

### Network Services Vulnerabilities

- **FTP (Port 21)**:
  - VSFTPd 2.3.4 backdoor
  - Anonymous FTP access
  - Unencrypted communications

- **SSH (Port 22)**:
  - Weak ciphers and algorithms
  - Username enumeration vulnerability
  - Outdated OpenSSH version

- **Telnet (Port 23)**:
  - Cleartext authentication
  - No encryption for session data

- **SMTP (Port 25)**:
  - Open relay configuration
  - User enumeration

- **HTTP (Port 80)**:
  - Multiple vulnerable web applications
  - Directory traversal
  - Information disclosure

- **RPC (Port 111)**:
  - Information disclosure

- **NetBIOS/SMB (Ports 139/445)**:
  - Samba version with known vulnerabilities
  - Weak share permissions

- **MySQL (Port 3306)**:
  - Weak default credentials (empty root password)
  - Outdated MySQL version

### Web Application Vulnerabilities

- **DVWA**:
  - SQL Injection
  - Cross-Site Scripting (XSS)
  - Command Injection
  - Insecure File Upload

- **Mutillidae**:
  - OWASP Top 10 vulnerabilities
  - Authentication bypass
  - Session management flaws

- **phpMyAdmin**:
  - Multiple vulnerabilities in outdated version

- **TWiki**:
  - Remote code execution vulnerabilities

### System Vulnerabilities

- Unpatched kernel vulnerabilities
- Outdated packages with known exploits
- World-writable files
- Weak password policies
- Misconfigured services

## Troubleshooting

### Common Scanning Issues

1. **Connectivity Problems**:
   - Ensure the VM is running
   - Verify network configuration in VirtualBox
   - Check firewall settings on the host

2. **Scan Timeouts**:
   - Increase timeout parameters
   - Consider reducing concurrent connections
   - Scan smaller port ranges to identify problem areas

3. **Service Crashes**:
   - Some aggressive scanning can crash Metasploitable services
   - Restart the VM from a snapshot if services become unresponsive
   - Consider using lower scan intensity for fragile services

4. **False Negatives**:
   - Verify service is actually running
   - Try service-specific scan modules
   - Ensure scanner has appropriate permission levels

### Scanner-Specific Troubleshooting

1. **Module Loading Errors**:
   - Check scanner dependencies
   - Verify file permissions on scanner modules

2. **Results Not Saving**:
   - Verify write permissions to output directory
   - Use absolute paths for output files

3. **Authentication Failures**:
   - Double-check credentials syntax
   - Verify service is accepting connections
   - Check for service-specific timeout issues

## Real-Time Monitoring with ElasticSearch

Your VulnTrack Pro platform includes ElasticSearch integration that can be leveraged to monitor Metasploitable VM in real-time. This allows you to track scan activities, events, and metrics as they're happening.

### Setting Up ElasticSearch Monitoring

For detailed setup instructions, refer to the comprehensive [ElasticSearch Setup Guide](./elasticsearch-setup-guide.md).

Quick setup overview:

1. **Configure SIEM Connectivity**:
   - Navigate to `/siem/settings` in your application
   - Ensure ElasticSearch connection is active
   - Verify log ingestion is properly configured

2. **Create Metasploitable Index**:
   - Create a dedicated index for Metasploitable test data
   - Example pattern: `metasploitable-*`
   - Configure appropriate retention policies for test data

3. **Configure Log Forwarding**:
   - Set up Filebeat on the scanner host
   - Configure log forwarding for scanner output
   - Direct scan logs to your ElasticSearch instance

### Real-Time Metrics to Monitor

The following metrics can be tracked in real-time during your Metasploitable testing:

1. **Scan Performance Metrics**:
   - Scan execution time
   - Resource utilization during scans
   - Query performance statistics
   - Concurrent scan operations

2. **Vulnerability Detection Metrics**:
   - Time-to-detection for known vulnerabilities
   - Detection rates by vulnerability type
   - False positive/negative rates
   - Vulnerability severity distribution

3. **Asset Discovery Metrics**:
   - Discovery completion time
   - Asset identification accuracy
   - Service detection coverage
   - Network mapping visualization

4. **Service Monitoring**:
   - Service availability during scanning
   - Performance impact on scanned services
   - Service response times before and during scans
   - Crash/failure rates during aggressive scanning

### Creating SIEM Dashboards

1. **Dedicated Metasploitable Dashboard**:
   - Navigate to `/siem/dashboards` 
   - Create a new dashboard named "Metasploitable Testing"
   - Add the following visualizations:
     - Vulnerability detection timeline
     - Service status heatmap
     - Scan performance metrics
     - Detection coverage by service type

2. **Real-Time Scan Monitoring**:
   - Create visualizations for active scan operations
   - Set up real-time refreshing (5-10 second intervals)
   - Configure alerts for scan failures or anomalies

3. **Testing Comparison Views**:
   - Build visualizations comparing multiple scan configurations
   - Track performance differences between scan methods
   - Measure detection effectiveness across scan types

### Example ElasticSearch Queries

Use these queries in the Kibana interface to analyze Metasploitable scan data:

```
# View all high-severity vulnerabilities detected
GET metasploitable-*/vulnerabilities/_search
{
  "query": {
    "bool": {
      "must": [
        { "term": { "target.keyword": "192.168.56.x" }},
        { "term": { "severity.keyword": "high" }}
      ]
    }
  }
}

# Track scan performance metrics over time
GET metasploitable-*/scans/_search
{
  "query": {
    "match_all": {}
  },
  "sort": [
    { "timestamp": { "order": "desc" }}
  ],
  "aggs": {
    "scan_duration_stats": {
      "stats": {
        "field": "duration"
      }
    },
    "scan_duration_over_time": {
      "date_histogram": {
        "field": "timestamp",
        "calendar_interval": "hour"
      },
      "aggs": {
        "avg_duration": {
          "avg": {
            "field": "duration"
          }
        }
      }
    }
  }
}
```

### Best Practices for Real-Time Monitoring

1. **Baseline Establishment**:
   - Run baseline scans and record metrics
   - Document normal performance patterns
   - Establish performance thresholds for alerts

2. **Scan Activity Correlation**:
   - Correlate scan activities with detected vulnerabilities
   - Track timeline of discovery events
   - Link discovery metrics with vulnerability findings

3. **Resource Monitoring**:
   - Monitor scanner resource utilization
   - Track impact on Metasploitable VM performance
   - Optimize scan configurations based on metrics

4. **Dashboard Sharing**:
   - Share dashboards with security team members
   - Export metrics for scan reports
   - Document performance insights

By leveraging ElasticSearch for real-time monitoring, you can gain valuable insights into your scanner's performance, optimize scan configurations, and better understand the effectiveness of different scanning approaches.

## Conclusion

Testing against Metasploitable provides a comprehensive evaluation of scanner capabilities against real-world vulnerabilities in a controlled environment. By systematically testing each scanning module and carefully analyzing results, you can verify scanner effectiveness and identify areas for improvement.

The integration of real-time monitoring through ElasticSearch enhances your testing capabilities by providing immediate feedback, performance metrics, and visualization of scan data.

Remember that Metasploitable contains intentionally vulnerable services that would be dangerous in a production environment. Always conduct testing in an isolated network environment and never expose the Metasploitable VM to public networks.

---

**Document Version:** 1.0  
**Last Updated:** April 23, 2025  
**Created By:** VulnTrack Pro Team