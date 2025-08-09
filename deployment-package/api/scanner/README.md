# VulScan: Network and Security Scanning Tool

A comprehensive Node.js-based tool for network and security vulnerability scanning.

## Features

- **Port Scanning**: Identify open ports on target hosts
- **IP Scanning**: Scan ranges of IP addresses in CIDR notation
- **Server Assessment**: Gather detailed information about target servers
- **Vulnerability Scanning**: Detect common security vulnerabilities
- **Web Application Scanning**: Analyze web applications for security issues
- **Authenticated Scanning**: Perform scans with credentials for deeper analysis
- **AWS Security Assessment**: Check AWS resources for security issues
- **Compliance Assessment**: Map findings to security frameworks and standards
- **Patch & Version Detection**: Identify outdated software, EOL components, and missing security patches

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/vulscan.git
cd vulscan

# Install dependencies
npm install
```

## Usage

### Basic Command Format

```bash
node index.js <command> [options] <target>
```

### Available Commands

- `port-scan`: Scan for open ports on a target host
- `ip-scan`: Scan a range of IP addresses 
- `server-scan`: Gather information about a server
- `vuln-scan`: Scan for common vulnerabilities
- `aws-scan`: Scan AWS resources for security issues
- `auth-scan`: Perform authenticated scanning with credentials
- `compliance-scan`: Assess compliance with security standards
- `web-scan`: Scan a web application for security vulnerabilities

### Examples

#### Port Scanning

Scan specific ports on a target:

```bash
node index.js port-scan example.com -p 80,443,8080
```

Scan a range of ports:

```bash
node index.js port-scan 192.168.1.1 -p 1-1000
```

#### Web Application Scanning

Basic scan of a website:

```bash
node index.js web-scan https://example.com
```

Advanced web scan with form analysis disabled:

```bash
node index.js web-scan https://example.com --no-crawl --form-analysis false
```

Authenticated web scan:

```bash
node index.js web-scan https://example.com -u admin -P password --login-url https://example.com/login
```

#### IP Range Scanning

Scan an IP range in CIDR notation:

```bash
node index.js ip-scan 192.168.1.0/24
```

#### AWS Security Scanning

Scan AWS resources (requires AWS credentials):

```bash
node index.js aws-scan --region us-east-1 --services ec2,s3,iam
```

#### Output Results to File

Save results to a JSON file:

```bash
node index.js web-scan https://example.com -o results.json
```

Export as CSV:

```bash
node index.js port-scan example.com -p 1-1000 -o ports.csv --format csv
```

#### Comprehensive Report Format

Generate a detailed, comprehensive scan report:

```bash
node index.js web-scan https://example.com -o web-report.json --comprehensive true --scan-title "Web Security Assessment"

# Generate a detailed vulnerability assessment report:
node index.js vuln-scan example.com -o vuln-report.json --comprehensive true --scan-title "Security Vulnerability Assessment"
```

The comprehensive format includes:
- Scan job metadata (launch date, duration, reference ID)
- Host statistics and distribution
- Detailed vulnerability information with severity levels
- Summary metrics (vulnerabilities by severity, host counts)

Additional examples for various scan types:

```bash
# IP range scan with comprehensive report
node index.js ip-scan 192.168.1.0/24 --ping --comprehensive=true -o network-scan.json --scan-title "Internal Network Assessment"

# Port scan with comprehensive report
node index.js port-scan example.com -p 1-1000 --comprehensive=true -o port-scan.json --scan-title "Port State Analysis"

# Server scan with comprehensive report
node index.js server-scan example.com --service-detection --os-detection --comprehensive=true -o server-analysis.json
```

Available for web-scan, port-scan, ip-scan, server-scan, and vuln-scan commands.

#### Patch & Version Detection

Scan for outdated software, missing security patches, and EOL components:

```bash
# Scan for patch status as part of vulnerability assessment
node index.js vuln-scan example.com --checks=patch-detection -o patches.json

# Include patch detection in web application scanning
node index.js web-scan https://example.com --comprehensive=true --scan-title "Web Application Patch Assessment"

# Authenticated scan with patch detection for more accurate results
node index.js auth-scan example.com --user admin --pass password --ssh --checks=patch-detection
```

The patch detection feature provides:
- Identification of outdated software components
- Detection of end-of-life (EOL) operating systems and applications
- CVE matching for known vulnerabilities in detected versions
- Missing security patches for operating systems (with SSH access)
- Web framework and CMS version detection (WordPress, Drupal, etc.)
- JavaScript library version analysis
- Recommendations for update paths

This feature works best with authenticated scanning to access detailed system information.

## Integration for Secure Government Environments

### Internal Scanning Command

The scanner now includes a dedicated `internal-scan` command designed specifically for secure government environments:

```bash
# Run an internal security scan with configuration checks and patch detection
node index.js internal-scan --scanTypes=configuration,patch-detection --output=secure-scan.json

# Run a compliance check against NIST 800-53
node index.js internal-scan --scanTypes=compliance --framework=nist-800-53 --output=compliance-report.json

# Run a comprehensive internal security assessment and generate a detailed report
node index.js internal-scan --comprehensive=true --output=full-assessment.json
```

The internal scanning capabilities include:
1. Offline operation with no external connections required
2. Configuration compliance checking for secure environments
3. Patch and vulnerability detection without network access
4. Comprehensive audit logs with tamper-evident trails
5. Compliance assessment against NIST 800-53, STIG, and other frameworks

### Backend API Integration

The scanner can be integrated into secure government environments through the backend API integration module. This provides:

1. Role-Based Access Control (RBAC)
2. Comprehensive audit logging with tamper-evident trails
3. Secure offline scanning capabilities
4. Compliance assessment against NIST 800-53, STIG, and other frameworks

```javascript
// In your Express.js backend_api project
const express = require('express');
const createSecurityScannerRouter = require('./lib/integration/express-middleware');

const app = express();

// Your authentication middleware
const authMiddleware = (req, res, next) => {
  // Get user from JWT token or session
  req.user = getUserFromToken(req.headers.authorization);
  next();
};

// Create the security scanner router with options
const securityRouter = createSecurityScannerRouter({
  authMiddleware,
  resultsDir: '/secure/scan-results'
});

// Mount the router at your preferred path
app.use('/api/security', securityRouter);
```

### Secure Mode Operation

For government environments, the scanner can be run in fully offline mode:

```bash
# Run an internal scan in offline mode
node index.js internal-scan --offline=true --scanTypes=configuration,compliance,patch-detection

# Check compliance against NIST 800-53
node index.js internal-scan --framework=nist-800-53 --output=compliance-report.json
```

### Audit Trail

All scanning operations create tamper-evident audit logs that can be used for compliance reporting:

- Cryptographic hash chains ensure log integrity
- Each operation is tracked with user attribution
- Results are stored with secure permissions
- All scan parameters are preserved for reproducibility

### Frontend Integration

Add these routes to your frontend app to interact with the security scanning API:

- **GET /security/dashboard** - Overview of security posture
- **POST /security/scans/new** - Form to initiate new scans
- **GET /security/scans** - List of completed scans
- **GET /security/scans/:id** - View scan details and findings

See the example implementation in `examples/frontend-integration.md`.

## Recent Improvements and Bug Fixes

### Version 1.2.0 (April 2025)

- **Enhanced Internal Scanner**: Added dedicated `internal-scan` command for secure environments
- **Improved Patch Detection**: Better identification of outdated libraries, frameworks, and operating systems
- **Fixed Command-Line Parsing**: Resolved issue with parsing port ranges in vulnerability scanner
- **JSON Output Format**: Enhanced JSON output with comprehensive reporting options
- **Bug Fix**: Resolved errors in port scanning module when specific ports are not provided
- **Bug Fix**: Better error handling in compliance scanning module
- **Performance Improvements**: Reduced memory usage and improved scan times for large networks

## License

MIT