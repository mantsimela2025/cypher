# RAS-DASH: Scanner Testing Environments

## Overview

This document provides recommendations for testing environments to thoroughly evaluate the RAS-DASH scanning module capabilities. These environments include virtual machines, containers, and websites specifically designed to contain known vulnerabilities, misconfigurations, and security issues that scanner tools should detect.

## Recommended Testing Environments

### 1. Deliberately Vulnerable Virtual Machines

#### OWASP WebGoat VM
- **Description**: A deliberately insecure J2EE web application maintained by OWASP
- **Testing Focus**: Web vulnerabilities, injection flaws, broken authentication
- **Access Method**: Available as OVA file for VMware or VirtualBox
- **Documentation**: [WebGoat GitHub](https://github.com/WebGoat/WebGoat)
- **RAS-DASH Testing Value**: Tests web scanning capabilities against OWASP Top 10 vulnerabilities

#### Metasploitable 3
- **Description**: Deliberately vulnerable Windows and Linux targets for testing security tools
- **Testing Focus**: OS vulnerabilities, outdated software, weak credentials
- **Access Method**: Vagrant build script available on GitHub
- **Documentation**: [Metasploitable3 GitHub](https://github.com/rapid7/metasploitable3)
- **RAS-DASH Testing Value**: Tests comprehensive vulnerability scanning across multiple attack vectors

#### Vulnhub VMs
- **Description**: Collection of various vulnerable VMs with different difficulty levels
- **Testing Focus**: Multiple vulnerability types, CTF-style challenges
- **Access Method**: Direct download as OVA files
- **Documentation**: [VulnHub Website](https://www.vulnhub.com/)
- **RAS-DASH Testing Value**: Provides diverse testing scenarios for scanner versatility evaluation

#### Damn Vulnerable Linux (DVL)
- **Description**: Outdated Linux distribution with numerous vulnerabilities
- **Testing Focus**: Linux kernel vulnerabilities, service misconfigurations
- **Access Method**: ISO available for download
- **Documentation**: [DVL Project](https://distrowatch.com/table.php?distribution=dvl)
- **RAS-DASH Testing Value**: Tests scanner effectiveness on Linux-specific vulnerabilities

### 2. Container Testing Environments

#### DVWA (Damn Vulnerable Web Application) Container
- **Description**: PHP/MySQL web application with intentional vulnerabilities
- **Testing Focus**: Common web application vulnerabilities
- **Access Method**: Docker Hub (`vulnerables/web-dvwa`)
- **Documentation**: [DVWA GitHub](https://github.com/digininja/DVWA)
- **RAS-DASH Testing Value**: Tests web scanning capabilities in containerized environments

#### Vulhub
- **Description**: Collection of dockerized vulnerable environments
- **Testing Focus**: Wide range of CVEs and security issues
- **Access Method**: Docker-compose files on GitHub
- **Documentation**: [Vulhub GitHub](https://github.com/vulhub/vulhub)
- **RAS-DASH Testing Value**: Tests ability to identify specific CVEs in containerized applications

#### OWASP Juice Shop Container
- **Description**: Modern vulnerable web application with JavaScript stack
- **Testing Focus**: Modern web vulnerabilities in JavaScript applications
- **Access Method**: Docker Hub (`bkimminich/juice-shop`)
- **Documentation**: [Juice Shop GitHub](https://github.com/juice-shop/juice-shop)
- **RAS-DASH Testing Value**: Tests scanner against modern web frameworks and APIs

#### Vulnerability as a Service (VaaS)
- **Description**: Docker-based multi-container vulnerable environment
- **Testing Focus**: Microservice security issues, container escapes
- **Access Method**: GitHub repository with Docker Compose setup
- **Documentation**: [VaaS GitHub](https://github.com/NodyHub/docker-vulnerability-as-a-service)
- **RAS-DASH Testing Value**: Tests scanner effectiveness in complex microservice architectures

### 3. Cloud-Based Testing Resources

#### AWS Vulnerable Lambda
- **Description**: Deliberately vulnerable Lambda functions
- **Testing Focus**: Serverless security issues
- **Access Method**: CloudFormation templates
- **Documentation**: [AWS Lambda Vulnerable Project](https://github.com/torque59/AWS-Lambda-Vulnerable-Lab)
- **RAS-DASH Testing Value**: Tests cloud function scanning capabilities

#### Kubernetes Goat
- **Description**: Deliberately vulnerable Kubernetes environment
- **Testing Focus**: Kubernetes-specific misconfigurations and vulnerabilities
- **Access Method**: Helm charts and YAML files
- **Documentation**: [Kubernetes Goat GitHub](https://github.com/madhuakula/kubernetes-goat)
- **RAS-DASH Testing Value**: Tests Kubernetes scanning effectiveness

#### TerraGoat
- **Description**: Vulnerable Terraform configurations
- **Testing Focus**: IaC security issues
- **Access Method**: Terraform scripts on GitHub
- **Documentation**: [TerraGoat GitHub](https://github.com/bridgecrewio/terragoat)
- **RAS-DASH Testing Value**: Tests Infrastructure as Code scanning capabilities

### 4. Web-Based Applications

#### OWASP Broken Web Applications Project
- **Description**: Collection of vulnerable web applications
- **Testing Focus**: Various web vulnerabilities
- **Access Method**: VM image download
- **Documentation**: [OWASP BWA Project](https://github.com/chuckfw/owaspbwa/)
- **RAS-DASH Testing Value**: Comprehensive test for web scanning features

#### Google Firing Range
- **Description**: Test bed for web application security scanners
- **Testing Focus**: Precision and coverage of web scanners
- **Access Method**: Public website or source code for self-hosting
- **Documentation**: [Google Firing Range GitHub](https://github.com/google/firing-range)
- **RAS-DASH Testing Value**: Tests scanner precision and false positive rates

#### Hack The Box
- **Description**: Online platform with various vulnerable machines
- **Testing Focus**: Real-world vulnerabilities across various systems
- **Access Method**: Registration required (free tier available)
- **Documentation**: [Hack The Box Website](https://www.hackthebox.eu/)
- **RAS-DASH Testing Value**: Tests scanner against professionally designed vulnerable environments

#### DVNA (Damn Vulnerable NodeJS Application)
- **Description**: Vulnerable Node.js application
- **Testing Focus**: Node.js specific vulnerabilities
- **Access Method**: GitHub repository
- **Documentation**: [DVNA GitHub](https://github.com/appsecco/dvna)
- **RAS-DASH Testing Value**: Tests scanner effectiveness on Node.js applications

### 5. Compliance Testing Environments

#### CIS Benchmark Testing VMs
- **Description**: VMs configured to test against CIS benchmarks
- **Testing Focus**: Compliance scanning accuracy
- **Access Method**: Custom build based on CIS documentation
- **Documentation**: [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- **RAS-DASH Testing Value**: Tests compliance scanning features

#### STIG Evaluation VMs
- **Description**: VMs configured to test against DISA STIGs
- **Testing Focus**: STIG compliance scanning
- **Access Method**: Custom build based on STIG documentation
- **Documentation**: [DoD STIGs](https://public.cyber.mil/stigs/)
- **RAS-DASH Testing Value**: Tests DoD compliance scanning capabilities

### 6. Network Testing Environments

#### Vulnerable Network Services VM
- **Description**: VM with multiple vulnerable network services
- **Testing Focus**: Network service vulnerabilities
- **Access Method**: Custom build with outdated services
- **Components**: FTP, SSH, Telnet, SMTP, DNS with known vulnerabilities
- **RAS-DASH Testing Value**: Tests network service scanning capabilities

#### PCI DSS Lab Environment
- **Description**: Environment mimicking PCI-regulated network
- **Testing Focus**: Payment card industry compliance
- **Access Method**: Custom build based on PCI requirements
- **Documentation**: [PCI DSS Requirements](https://www.pcisecuritystandards.org/)
- **RAS-DASH Testing Value**: Tests scanner's PCI DSS compliance detection

## Creating a Comprehensive Test Lab

### Recommended Lab Setup

For thorough testing of RAS-DASH scanning capabilities, we recommend setting up a dedicated test environment with the following components:

1. **Isolated Network Segment**
   - VLAN or separate physical network
   - No direct internet access to prevent accidental exposure
   - Controlled NAT gateway for updates when needed

2. **Virtualization Platform**
   - VMware ESXi or Proxmox for server-grade testing
   - VirtualBox or VMware Workstation for desktop testing
   - Docker host for container-based tests

3. **Test Scenarios**
   - **Operating Systems**: Mix of Windows, Linux, and macOS targets
   - **Network Devices**: Routers, switches, firewalls
   - **Web Applications**: Various vulnerable web apps
   - **Databases**: SQL and NoSQL with known issues
   - **Middleware**: Application servers, message queues
   - **Custom Applications**: In-house developed applications with known flaws

### Testing Methodology

When using these testing environments, follow this structured approach:

1. **Baseline Testing**
   - Run scans against clean systems to establish baseline
   - Document false positives and scanner behavior

2. **Known Vulnerability Testing**
   - Introduce specific CVEs or vulnerabilities
   - Verify scanner detection accuracy and details

3. **Mixed Environment Testing**
   - Combine multiple vulnerable systems
   - Test scanner performance at scale

4. **Remediation Testing**
   - Apply patches or fixes to vulnerabilities
   - Verify scanner correctly identifies remediated issues

5. **Edge Case Testing**
   - Test unusual configurations or corner cases
   - Evaluate scanner behavior with incomplete access or information

## Docker-Compose Test Environment

Below is a sample Docker Compose configuration that sets up multiple vulnerable containers for testing:

```yaml
version: '3'
services:
  dvwa:
    image: vulnerables/web-dvwa
    ports:
      - "8080:80"
    networks:
      - scanner-test

  juice-shop:
    image: bkimminich/juice-shop
    ports:
      - "3000:3000"
    networks:
      - scanner-test

  vulnerable-wordpress:
    image: wpscanteam/vulnerablewordpress
    ports:
      - "8081:80"
    networks:
      - scanner-test

  webgoat:
    image: webgoat/webgoat-8.0
    ports:
      - "8082:8080"
    networks:
      - scanner-test

  metasploitable:
    image: tleemcjr/metasploitable2
    ports:
      - "20:20"
      - "21:21"
      - "22:22"
      - "23:23"
      - "25:25"
      - "80:80"
      - "443:443"
      - "445:445"
      - "3306:3306"
    networks:
      - scanner-test

networks:
  scanner-test:
    driver: bridge
```

## Command-Line Scanner Testing

For command-line testing of the RAS-DASH scanner module, use these example targets:

### NMAP-Style Target Specification
```
# IPv4 Range
scanner scan --range 192.168.1.1-100

# CIDR Notation
scanner scan --cidr 10.0.0.0/24

# Single Target with Multiple Ports
scanner scan --target dvwa.test.local --port 80,443,8080

# Multiple Web Applications
scanner webscan --target http://juice-shop:3000,http://dvwa:80
```

### Custom Test Cases
```
# Mix of Different Target Types
scanner scan --mixed-targets webapps.txt network.txt containers.txt

# Specific Vulnerability Test
scanner scan --target vulnerable-vm --cve CVE-2021-44228
```

## Conclusion

Using a diverse set of testing environments will ensure comprehensive validation of the RAS-DASH scanning capabilities. By testing against known vulnerable systems, you'll be able to verify detection accuracy, scanning performance, and result quality.

Remember to maintain proper security isolation when working with these environments, as they contain real vulnerabilities that could be exploited if exposed to untrusted networks.

For ongoing scanner development, consider implementing a continuous testing pipeline that automatically validates scanner effectiveness against these environments after each code change.