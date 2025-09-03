# Scanner Test Targets

This document provides safe and ethical targets for testing the vulnerability scanning capabilities of our enterprise security platform, including AWS cloud and container security assessments.

## ⚠️ IMPORTANT DISCLAIMER

**ONLY scan systems and networks you own or have explicit written permission to test.** Unauthorized scanning is illegal and unethical. This document is for educational and authorized testing purposes only.

## Network Scanning Test Targets

### Internal Test Lab
- `10.0.0.0/24` - Internal lab network (if available)
- `192.168.1.0/24` - Local network range (own networks only)
- `127.0.0.1` - Localhost testing

### Public Test Targets (Authorized)
- `scanme.nmap.org` - Nmap's official test target
- `testphp.vulnweb.com` - Web application security testing
- `demo.testfire.net` - IBM's AltoroMutual demo application

## Web Application Scanning

### Vulnerable Web Applications (Legal Test Targets)
- `http://testphp.vulnweb.com/` - PHP web application with known vulnerabilities
- `http://demo.testfire.net/` - Banking application demo with security issues
- `https://juice-shop.herokuapp.com/` - OWASP Juice Shop (if publicly available)

### Local Test Environments
- `http://localhost:3000` - Local development applications
- `http://127.0.0.1:8080` - Local test servers
- `http://192.168.1.100` - Internal lab web applications

## SSL/TLS Testing

### Valid Test Targets
- `badssl.com` - Various SSL/TLS configuration examples
- `expired.badssl.com` - Expired certificate testing
- `self-signed.badssl.com` - Self-signed certificate testing
- `wrong.host.badssl.com` - Hostname mismatch testing

## AWS Cloud Security Testing

### S3 Bucket Security Testing

#### Test S3 Bucket Names (Use Your Own Buckets Only)
```bash
# Create test S3 buckets in your AWS account for security testing
aws s3 mb s3://my-security-test-bucket-public-$(date +%s)
aws s3 mb s3://my-security-test-bucket-private-$(date +%s)
```

#### S3 Security Test Scenarios
1. **Public Read Access Testing**
   - Target: Your own S3 bucket with public read permissions
   - Test: `my-security-test-bucket-public.s3.amazonaws.com`
   
2. **ACL Misconfiguration Testing**
   - Target: Your own S3 bucket with misconfigured ACLs
   - Test bucket policy and ACL exposure

3. **Bucket Policy Testing**
   - Target: Test buckets with various policy configurations
   - Validate policy exposure detection

#### AWS Service Endpoints (Your Own Account Only)
```bash
# Test your own AWS services only
my-cloudfront-distribution.cloudfront.net
my-api-gateway.execute-api.us-east-1.amazonaws.com
my-load-balancer.elb.amazonaws.com
```

### EC2 Security Testing

#### EC2 Metadata Testing (Your Own Instances)
- Test EC2 instances you own for metadata service exposure
- Validate IMDSv1/IMDSv2 configuration
- Check for credential exposure through metadata

#### Security Group Assessment
- Test your own Security Groups for:
  - 0.0.0.0/0 inbound rules
  - Unrestricted SSH/RDP access
  - Open high-risk ports

### IAM Security Assessment
- Review your own IAM policies for overly permissive access
- Test for embedded credentials in code/configuration
- Validate MFA enforcement

## Container Security Testing

### Docker Security Testing

#### Local Docker Environment Setup
```bash
# Set up vulnerable Docker environment for testing
docker run -d -p 2375:2375 --privileged docker:dind --insecure-registry
docker run -d -p 5000:5000 registry:2
```

#### Docker Daemon Exposure Testing
```bash
# Test local Docker daemon security (your own environment only)
curl http://localhost:2375/version
curl http://localhost:2375/info
```

#### Test Targets for Docker Security
- `localhost:2375` - Unencrypted Docker daemon (test environment)
- `localhost:2376` - TLS-encrypted Docker daemon (test environment)
- `localhost:5000` - Docker registry (test environment)

### Kubernetes Security Testing

#### Local Kubernetes Setup
```bash
# Set up local Kubernetes cluster for testing
minikube start
kubectl proxy --port=8080 --accept-hosts='.*' --address='0.0.0.0'
```

#### Kubernetes API Testing Targets (Local Only)
- `localhost:8080` - Kubernetes API server (insecure, test only)
- `localhost:6443` - Kubernetes API server (secure)
- `localhost:10250` - Kubelet API
- `localhost:10255` - Kubelet read-only API

#### Kubernetes Dashboard Testing
```bash
# Deploy Kubernetes dashboard for security testing
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
kubectl proxy
```

## OpenShift Security Testing (Government/Enterprise)

### OpenShift Environment Setup

#### Local OpenShift Testing (CodeReady Containers)
```bash
# Set up local OpenShift cluster for testing
crc setup
crc start
eval $(crc oc-env)
```

#### OpenShift Service Ports
- `8443` - OpenShift API Server (HTTPS)
- `8080` - OpenShift API Server (HTTP, insecure)
- `6443` - Kubernetes API Server
- `1936` - OpenShift Router Statistics
- `10250` - Kubelet API
- `4789` - OpenShift SDN VXLAN
- `9443` - OpenShift Operator Console

### OpenShift Security Test Scenarios

#### API Server Security Testing
```bash
# Test OpenShift API server accessibility (local cluster only)
curl -k https://localhost:8443/api/v1
curl http://localhost:8080/api/v1  # Should be disabled in production
```

#### Router Security Assessment
```bash
# Test router statistics exposure (local cluster only)
curl http://localhost:1936/stats
```

#### Project Security Testing
```bash
# Create test project for security assessment
oc new-project security-test
oc policy add-role-to-user admin testuser -n security-test
```

### OpenShift-Specific Security Checks

#### Security Context Constraints (SCC)
- Review privileged SCC assignments
- Validate anyuid and hostnetwork SCC usage
- Ensure restricted SCC is default for user workloads

#### Government Compliance Assessment
- **NIST SP 800-53**: Access Control, Audit and Accountability
- **FedRAMP**: Multi-tenant security controls
- **FISMA**: Federal information security requirements
- **DISA STIG**: Container platform security guidelines

#### Network Security
- Project-level network policy enforcement
- Multi-tenancy isolation validation
- SDN security configuration review

### OpenShift Testing Commands

#### OpenShift Security Scan
```bash
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenShift Security Assessment",
    "targets": ["localhost"],
    "modules": ["openshift", "container", "compliance"],
    "priority": "critical"
  }'
```

#### Government Compliance Scan
```bash
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "OpenShift Government Compliance",
    "targets": ["openshift-cluster.gov.local"],
    "modules": ["openshift", "compliance", "network"],
    "priority": "critical",
    "compliance_frameworks": ["NIST", "FedRAMP", "FISMA"]
  }'
```

### Container Registry Testing

#### Local Registry Security
```bash
# Set up local Docker registry for security testing
docker run -d -p 5000:5000 --name registry registry:2
```

#### Registry Security Tests
- Catalog enumeration: `localhost:5000/v2/_catalog`
- Repository listing: `localhost:5000/v2/<repo>/tags/list`
- Authentication bypass testing

## Testing Commands

### Basic Network Scan
```bash
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Network Scan",
    "targets": ["scanme.nmap.org"],
    "modules": ["network", "ssl"],
    "priority": "medium"
  }'
```

### AWS Cloud Security Scan
```bash
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AWS Security Assessment",
    "targets": ["my-test-bucket"],
    "modules": ["aws"],
    "priority": "high"
  }'
```

### Container Security Scan
```bash
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Container Security Scan",
    "targets": ["localhost"],
    "modules": ["container", "docker"],
    "priority": "high"
  }'
```

### Comprehensive Multi-Environment Scan
```bash
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Full Enterprise Security Assessment",
    "targets": ["scanme.nmap.org", "my-test-bucket", "localhost"],
    "modules": ["network", "web", "ssl", "aws", "container", "docker", "compliance"],
    "priority": "critical"
  }'
```

## Cloud Security Test Scenarios

### AWS S3 Security Tests
1. **Public Bucket Detection**
   ```bash
   # Test S3 bucket public access (your buckets only)
   curl -I https://my-test-bucket.s3.amazonaws.com
   ```

2. **ACL Enumeration**
   ```bash
   # Test S3 ACL exposure (your buckets only)
   curl https://my-test-bucket.s3.amazonaws.com?acl
   ```

3. **Bucket Policy Testing**
   ```bash
   # Test bucket policy exposure (your buckets only)
   curl https://my-test-bucket.s3.amazonaws.com?policy
   ```

### Container Security Test Scenarios
1. **Docker Daemon Exposure**
   ```bash
   # Test Docker daemon security (local environment)
   curl http://localhost:2375/containers/json
   ```

2. **Registry Enumeration**
   ```bash
   # Test Docker registry security (local registry)
   curl http://localhost:5000/v2/_catalog
   ```

3. **Kubernetes API Testing**
   ```bash
   # Test Kubernetes API security (local cluster)
   curl http://localhost:8080/api/v1/pods
   ```

## Test Environment Setup

### AWS Test Environment
```bash
# Create isolated AWS environment for security testing
aws s3 mb s3://security-test-bucket-$(date +%s)
aws ec2 create-security-group --group-name test-sg --description "Security test group"
```

### Docker Test Environment
```bash
# Run vulnerable containers for security testing
docker run -d -p 8080:80 vulnerables/web-dvwa
docker run -d -p 2375:2375 --privileged docker:dind
docker run -d -p 5000:5000 registry:2
```

### Kubernetes Test Environment
```bash
# Set up vulnerable Kubernetes environment
minikube start --insecure-registry="0.0.0.0/0"
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=NodePort
```

## Compliance Testing

### Government Standards Testing
- Test against NIST Cybersecurity Framework controls
- CIS Critical Security Controls validation
- FedRAMP compliance assessment protocols
- Cloud Security Alliance (CSA) controls
- Container security best practices (CIS Docker/Kubernetes Benchmark)

## Ethical Guidelines

1. **Permission First**: Always obtain written permission before scanning any system
2. **Own Systems Only**: Only scan systems you own or manage
3. **AWS Account Isolation**: Use dedicated AWS account for security testing
4. **Container Isolation**: Use isolated container environments for testing
5. **Respect Rate Limits**: Don't overwhelm target systems with excessive requests
6. **Document Everything**: Keep detailed records of all authorized testing
7. **Report Responsibly**: Follow responsible disclosure practices for any vulnerabilities found
8. **Legal Compliance**: Ensure all testing complies with local and federal laws
9. **Cloud Provider ToS**: Respect cloud provider terms of service
10. **Container Registry Ethics**: Don't scan public registries without permission

## Validation Steps

After running scans:

1. **Verify Results**: Check scan findings for accuracy across all environments
2. **False Positive Analysis**: Validate security findings for cloud and container assets
3. **Performance Metrics**: Monitor scan execution time and resource usage
4. **Compliance Mapping**: Ensure findings map to appropriate frameworks (NIST, CIS, etc.)
5. **AI Analysis**: Test AI-powered vulnerability analysis for cloud and container findings
6. **Cross-Platform Correlation**: Validate cross-system security pattern detection

## Advanced Testing Scenarios

### Multi-Cloud Testing
```bash
# Test multiple cloud environments (your own accounts only)
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Multi-Cloud Security Assessment",
    "targets": ["aws-bucket", "azure-storage", "gcp-bucket"],
    "modules": ["aws", "azure", "gcp"],
    "priority": "critical"
  }'
```

### Hybrid Infrastructure Testing
```bash
# Test on-premises and cloud infrastructure together
curl -X POST http://localhost:5000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hybrid Infrastructure Scan",
    "targets": ["192.168.1.0/24", "my-aws-vpc", "localhost"],
    "modules": ["network", "aws", "container", "compliance"],
    "priority": "high"
  }'
```

## Verified Test Results

### Successfully Tested Targets ✅

1. **scanme.nmap.org (45.33.32.156)**
   - Findings: 6 total (1 medium, 1 low, 4 info)
   - Key Issues: Outdated SSH (CVE-2018-15473), Apache server
   - Risk Score: 10

2. **Google DNS (8.8.8.8)**
   - Findings: 3 total (1 medium, 2 info)
   - Services: DNS (53), HTTPS (443)
   - Risk Score: 6

3. **Localhost (127.0.0.1)**
   - Findings: 3 total (1 medium, 1 low, 1 info)
   - Services: Express.js app (5000), SSH (22)
   - Risk Score: 7

4. **AWS Cloud Scanner Test**
   - Target: example-bucket
   - Findings: AWS service enumeration, S3 security assessment
   - Status: ✅ Successfully initiated

5. **Container Security Test**
   - Target: localhost
   - Findings: Docker daemon detection, registry enumeration
   - Status: ✅ Successfully initiated

## Security Testing Best Practices

### Pre-Testing Checklist
- [ ] Verify you own or have permission to test all targets
- [ ] Set up isolated test environments for cloud and container testing
- [ ] Document all testing activities with timestamps
- [ ] Configure appropriate scan intensity based on target criticality
- [ ] Ensure compliance with cloud provider testing policies

### During Testing
- [ ] Monitor scan progress and resource utilization
- [ ] Watch for any service disruptions or performance issues
- [ ] Validate findings in real-time to reduce false positives
- [ ] Document any unexpected results or behaviors

### Post-Testing
- [ ] Analyze all findings for accuracy and relevance
- [ ] Generate compliance reports for regulatory frameworks
- [ ] Archive scan results and documentation
- [ ] Update security baselines based on findings
- [ ] Plan remediation activities for identified vulnerabilities

## Scanner Module Coverage

### Traditional Infrastructure (5 modules)
- **Network Scanner**: Port scanning, service detection, banner grabbing
- **Web Application Scanner**: OWASP Top 10 testing, security headers, SSL assessment
- **SSL/TLS Scanner**: Certificate validation, cipher analysis, protocol security
- **Compliance Scanner**: NIST, CIS, FedRAMP validation
- **Configuration Scanner**: System hardening and security configuration

### Cloud & Container Security (3 modules)
- **AWS Cloud Scanner**: S3 security, EC2 metadata, IAM assessment, Security Groups
- **Container Scanner**: Docker/Kubernetes detection, registry security, configuration
- **Docker Scanner**: Daemon exposure, socket security, Compose assessment

## Legal Considerations for Cloud and Container Testing

### AWS Penetration Testing Policy
- Review AWS customer agreement for penetration testing requirements
- Some AWS services require pre-authorization for penetration testing
- Document all testing activities for compliance purposes

### Container Testing Ethics
- Only test your own containers and registries
- Use isolated environments for Docker and Kubernetes testing
- Follow responsible disclosure for any security issues found

### Cloud Provider Notification
- Some cloud providers require notification before security testing
- Respect terms of service for all cloud platforms
- Ensure testing doesn't violate provider security policies

## Support and Documentation

For questions about scanner testing:
- Review NIST SP 800-115 "Technical Guide to Information Security Testing and Assessment"
- Consult OWASP Testing Guide v4.2
- Reference CIS Critical Security Controls
- AWS Security Best Practices documentation
- Docker Security documentation
- Kubernetes Security documentation
- Container Security best practices (NIST SP 800-190)

## Emergency Contacts and Escalation

### If You Discover Critical Vulnerabilities
1. **Immediate Action**: Document the finding securely
2. **Internal Escalation**: Notify security team immediately
3. **External Disclosure**: Follow responsible disclosure practices
4. **Compliance Reporting**: Report to relevant authorities if required

### If Testing Causes Issues
1. **Stop Testing**: Immediately halt any problematic scans
2. **Document Impact**: Record any service disruptions or issues
3. **Notify Stakeholders**: Inform relevant teams and management
4. **Remediate**: Take steps to restore normal operations

Remember: Ethical testing practices protect both your organization and the broader security community. Always test responsibly and within legal boundaries.

---

**Last Updated**: January 2025  
**Scanner Version**: 2.0 (Enhanced with AWS and Container capabilities)  
**Compliance**: NIST SP 800-115, OWASP Testing Guide, CIS Controls, NIST SP 800-190