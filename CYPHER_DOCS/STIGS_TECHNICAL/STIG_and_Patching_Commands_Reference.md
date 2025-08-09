# STIG and Patching Commands Reference

## Overview
This document provides specific commands and scripts that RAS-DASH uses for automated STIG implementation and system patching across different operating systems and platforms.

---

## 🔧 Windows STIG Implementation Commands

### **Windows Server 2022 STIG Commands**

#### **Registry-Based STIG Settings**
```powershell
# V-254239 - Password complexity requirements
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Netlogon\Parameters" -Name "RequireSignOrSeal" -Value 1

# V-254240 - Account lockout duration
net accounts /lockoutduration:15

# V-254241 - Minimum password length
net accounts /minpwlen:14

# V-254242 - Password history
net accounts /uniquepw:24

# V-254243 - Maximum password age
net accounts /maxpwage:60

# V-254244 - Minimum password age
net accounts /minpwage:1

# V-254245 - Account lockout threshold
net accounts /lockoutthreshold:3

# V-254246 - Reset account lockout counter
net accounts /lockoutwindow:15
```

#### **Group Policy STIG Implementation**
```powershell
# Import STIG Group Policy templates
secedit /configure /db secedit.sdb /cfg "C:\Windows\security\templates\STIG_Windows_Server_2022.inf"

# Apply specific security policies
secedit /configure /db secedit.sdb /cfg "C:\STIG\WSS2022_STIG_V1R5.inf" /log "C:\STIG\stig_apply.log"

# Verify policy application
gpresult /h "C:\STIG\gpresult.html"
```

#### **Service Configuration STIG Commands**
```powershell
# V-254250 - Disable unnecessary services
Stop-Service -Name "Fax" -Force
Set-Service -Name "Fax" -StartupType Disabled

Stop-Service -Name "TelnetD" -Force
Set-Service -Name "TelnetD" -StartupType Disabled

# V-254251 - Configure Windows Firewall
netsh advfirewall set allprofiles state on
netsh advfirewall set allprofiles firewallpolicy blockinbound,blockoutbound

# V-254252 - Configure audit policies
auditpol /set /category:"Logon/Logoff" /success:enable /failure:enable
auditpol /set /category:"Account Management" /success:enable /failure:enable
auditpol /set /category:"Privilege Use" /success:enable /failure:enable
```

#### **File System STIG Commands**
```powershell
# V-254253 - Set proper file permissions
icacls "C:\Windows\System32" /inheritance:r
icacls "C:\Windows\System32" /grant "Administrators:(OI)(CI)F"
icacls "C:\Windows\System32" /grant "SYSTEM:(OI)(CI)F"

# V-254254 - Remove unnecessary file shares
net share C$ /delete
net share ADMIN$ /delete

# V-254255 - Configure NTFS permissions
icacls "C:\Program Files" /inheritance:r
icacls "C:\Program Files" /grant "Administrators:(OI)(CI)F"
icacls "C:\Program Files" /grant "Users:(OI)(CI)RX"
```

---

## 🐧 Linux STIG Implementation Commands

### **Red Hat Enterprise Linux 8 STIG Commands**

#### **System Configuration STIG Settings**
```bash
# V-230221 - Configure password complexity
authconfig --enablereqlower --enablerequpper --enablereqdigit --enablereqother --update

# V-230222 - Set minimum password length
sed -i 's/^# minlen = 8/minlen = 15/' /etc/security/pwquality.conf

# V-230223 - Configure password history
sed -i 's/^# remember = 5/remember = 5/' /etc/pam.d/system-auth

# V-230224 - Set account lockout
echo "auth required pam_faillock.so preauth audit silent deny=3 unlock_time=900" >> /etc/pam.d/system-auth
echo "auth [default=die] pam_faillock.so authfail audit deny=3 unlock_time=900" >> /etc/pam.d/system-auth
```

#### **Service Hardening STIG Commands**
```bash
# V-230225 - Disable unnecessary services
systemctl disable bluetooth.service
systemctl stop bluetooth.service

systemctl disable cups.service
systemctl stop cups.service

systemctl disable avahi-daemon.service
systemctl stop avahi-daemon.service

# V-230226 - Configure SSH hardening
sed -i 's/#Protocol 2/Protocol 2/' /etc/ssh/sshd_config
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
systemctl restart sshd
```

#### **File System STIG Commands**
```bash
# V-230227 - Set proper permissions on system files
chmod 644 /etc/passwd
chmod 640 /etc/shadow
chmod 644 /etc/group
chmod 640 /etc/gshadow

# V-230228 - Configure file system mount options
echo "/tmp /tmp tmpfs defaults,nodev,nosuid,noexec 0 0" >> /etc/fstab
mount -o remount /tmp

# V-230229 - Set umask values
echo "umask 077" >> /etc/profile
echo "umask 077" >> /etc/bashrc
```

#### **Audit Configuration STIG Commands**
```bash
# V-230230 - Configure audit rules
echo "-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change" >> /etc/audit/rules.d/audit.rules
echo "-a always,exit -F arch=b32 -S adjtimex -S settimeofday -S stime -k time-change" >> /etc/audit/rules.d/audit.rules
echo "-w /var/log/faillog -p wa -k logins" >> /etc/audit/rules.d/audit.rules

# Restart auditd service
systemctl restart auditd
```

---

## 🔄 Automated Patching Commands

### **Windows Patching Commands**

#### **PowerShell Update Module Commands**
```powershell
# Install PSWindowsUpdate module
Install-Module -Name PSWindowsUpdate -Force
Import-Module PSWindowsUpdate

# Check for available updates
Get-WUList

# Install critical and security updates
Get-WUInstall -MicrosoftUpdate -AcceptAll -AutoReboot

# Install specific KB updates
Get-WUInstall -KBArticleID "KB5022834" -AcceptAll

# Schedule update installation
Get-WUInstall -MicrosoftUpdate -AcceptAll -ScheduleJob -ScheduleTime "23:00"
```

#### **WSUS Configuration Commands**
```powershell
# Configure WSUS client settings
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU" -Name "UseWUServer" -Value 1
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" -Name "WUServer" -Value "http://wsus.domain.com:8530"
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate" -Name "WUStatusServer" -Value "http://wsus.domain.com:8530"

# Force WSUS check
wuauclt /resetauthorization /detectnow
```

#### **Windows Update CLI Commands**
```cmd
# Using Windows Update CLI
winget upgrade --all

# Using DISM for offline patching
dism /online /add-package /packagepath:"C:\Updates\windows10.0-kb5022834.msu"

# Using wusa for standalone updates
wusa "C:\Updates\windows10.0-kb5022834.msu" /quiet /norestart
```

### **Linux Patching Commands**

#### **Red Hat/CentOS Patching Commands**
```bash
# Update all packages
yum update -y

# Update security patches only
yum --security update -y

# Update specific package
yum update -y kernel

# Check for available updates
yum check-update

# Install specific security updates
yum update --advisory=RHSA-2023:1234 -y

# Exclude specific packages from updates
yum update -y --exclude=kernel*
```

#### **Ubuntu/Debian Patching Commands**
```bash
# Update package lists
apt update

# Upgrade all packages
apt upgrade -y

# Install security updates only
apt upgrade -y $(apt list --upgradable 2>/dev/null | grep -i security | cut -d'/' -f1)

# Perform full system upgrade
apt full-upgrade -y

# Install specific package version
apt install -y apache2=2.4.41-4ubuntu3.10

# Remove unnecessary packages
apt autoremove -y
```

#### **SUSE Linux Patching Commands**
```bash
# Refresh repositories
zypper refresh

# Update all packages
zypper update -y

# Install security patches
zypper patch --category security -y

# Install specific patch
zypper patch --issue=CVE-2023-1234 -y

# Update specific package
zypper update -y openssh
```

---

## 🔒 Database STIG Commands

### **PostgreSQL STIG Commands**
```sql
-- V-233511 - Configure authentication
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
ALTER SYSTEM SET log_statement = 'all';

-- V-233512 - Set password requirements
ALTER SYSTEM SET password_encryption = 'scram-sha-256';

-- V-233513 - Configure connection limits
ALTER SYSTEM SET max_connections = '100';

-- Reload configuration
SELECT pg_reload_conf();
```

```bash
# PostgreSQL file permissions
chmod 700 /var/lib/postgresql/data
chown postgres:postgres /var/lib/postgresql/data

# Configure pg_hba.conf for authentication
echo "local all postgres peer" > /var/lib/postgresql/data/pg_hba.conf
echo "host all all 127.0.0.1/32 scram-sha-256" >> /var/lib/postgresql/data/pg_hba.conf
```

### **MySQL/MariaDB STIG Commands**
```sql
-- V-233520 - Remove test databases
DROP DATABASE IF EXISTS test;

-- V-233521 - Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- V-233522 - Secure root account
UPDATE mysql.user SET Password=PASSWORD('SecurePassword123!') WHERE User='root';

-- V-233523 - Remove remote root login
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

FLUSH PRIVILEGES;
```

---

## 🌐 Network Device STIG Commands

### **Cisco Router/Switch STIG Commands**
```cisco
! V-220518 - Configure authentication
enable secret 5 $1$abcd$encrypted_password

! V-220519 - Configure SSH
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3

! V-220520 - Disable unnecessary services
no service tcp-small-servers
no service udp-small-servers
no service finger
no ip http server

! V-220521 - Configure logging
logging trap informational
logging facility local0
logging 192.168.1.100

! V-220522 - Configure SNMP security
no snmp-server community public
no snmp-server community private
snmp-server community SecureCommunity123 RO
```

### **Juniper STIG Commands**
```juniper
# V-220530 - Configure system authentication
set system authentication-order password
set system root-authentication encrypted-password "$1$abcd$encrypted"

# V-220531 - Configure SSH
set system services ssh protocol-version v2
set system services ssh connection-limit 10
set system services ssh rate-limit 5

# V-220532 - Configure logging
set system syslog host 192.168.1.100 any info
set system syslog file security authorization info
```

---

## 🐳 Container Scanning and STIG Commands

### **Comprehensive Container Vulnerability Scanning**

#### **Trivy Container Scanner**
```bash
# Scan container images for vulnerabilities
trivy image nginx:latest
trivy image --severity HIGH,CRITICAL nginx:latest
trivy image --format json nginx:latest > scan_results.json

# Scan container filesystems
trivy fs /path/to/container/rootfs

# Scan running containers
trivy image $(docker ps --format "table {{.Image}}" | tail -n +2)

# Scan with STIG compliance
trivy image --compliance docker-cis nginx:latest

# Generate SARIF report for integration
trivy image --format sarif --output results.sarif nginx:latest
```

#### **Aqua Security Container Scanning**
```bash
# Install Aqua Scanner
curl -s https://get.aquasec.com/microscanner > microscanner
chmod +x microscanner

# Scan container image
./microscanner <TOKEN> nginx:latest

# Scan with policy enforcement
./microscanner --policy-file security-policy.json <TOKEN> nginx:latest
```

#### **Twistlock/Prisma Cloud Container Scanning**
```bash
# Twistlock CLI scanning
twistcli images scan nginx:latest
twistcli images scan --address https://console.twistlock.com --user admin --password <PASSWORD> nginx:latest

# Generate compliance report
twistcli images scan --compliance-threshold high nginx:latest
```

#### **Clair Container Scanning**
```bash
# Analyze container with Clair
clairctl analyze nginx:latest
clairctl report nginx:latest

# Push image to Clair for analysis
clairctl push nginx:latest
```

### **Container Runtime Security Scanning**

#### **Falco Runtime Security**
```bash
# Install Falco for runtime monitoring
curl -s https://falco.org/repo/falcosecurity-3672BA8F.asc | apt-key add -
echo "deb https://download.falco.org/packages/deb stable main" | tee -a /etc/apt/sources.list.d/falcosecurity.list
apt-get update -qq
apt-get install -y falco

# Start Falco monitoring
systemctl start falco

# Custom Falco rules for container security
cat > /etc/falco/falco_rules.local.yaml << EOF
- rule: Detect crypto miners
  desc: Detect cryptocurrency miners
  condition: spawned_process and proc.name in (cryptonight, xmrig, ethminer)
  output: Crypto miner detected (user=%user.name command=%proc.cmdline)
  priority: CRITICAL
EOF
```

#### **Sysdig Container Monitoring**
```bash
# Install Sysdig agent
curl -s https://s3.amazonaws.com/download.draios.com/stable/install-agent | bash -s -- --access_key <ACCESS_KEY>

# Capture container activity
sysdig -M 60 -w container_activity.scap container.name=nginx

# Analyze container behavior
sysdig -r container_activity.scap -c topprocs_net
```

### **Docker STIG Implementation**
```bash
# V-235800 - Configure Docker daemon securely
echo '{"log-driver": "syslog", "disable-legacy-registry": true, "live-restore": true, "no-new-privileges": true}' > /etc/docker/daemon.json

# V-235801 - Set proper file permissions
chmod 644 /etc/docker/daemon.json
chown root:root /etc/docker/daemon.json

# V-235802 - Configure Docker socket permissions
chmod 660 /var/run/docker.sock
chown root:docker /var/run/docker.sock

# V-235803 - Scan container images before deployment
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image --severity HIGH,CRITICAL nginx:latest

# V-235804 - Implement container resource limits
docker run --memory="256m" --cpus="1.0" --pids-limit 100 nginx:latest

# V-235805 - Run containers with non-root user
docker run --user 1000:1000 nginx:latest

# V-235806 - Disable privileged containers
docker run --security-opt=no-new-privileges nginx:latest

# V-235807 - Mount filesystems as read-only
docker run --read-only --tmpfs /tmp nginx:latest
```

### **Container Compliance Scanning**

#### **Docker Bench Security**
```bash
# Download and run Docker Bench Security
git clone https://github.com/docker/docker-bench-security.git
cd docker-bench-security
sudo sh docker-bench-security.sh

# Run specific checks
sudo sh docker-bench-security.sh -c check_2,check_3,check_4

# Generate JSON output
sudo sh docker-bench-security.sh -l /var/log/docker-bench-security.log -j
```

#### **CIS Docker Benchmark Compliance**
```bash
# Automated CIS Docker compliance checking
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /usr/bin/docker-containerd:/usr/bin/docker-containerd:ro \
    -v /usr/bin/docker-runc:/usr/bin/docker-runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security

# Generate compliance report
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    docker/docker-bench-security -j > docker_cis_compliance.json
```

### **Container Image Hardening**

#### **Distroless Image Implementation**
```dockerfile
# Example secure container using distroless base
FROM gcr.io/distroless/java:11
COPY app.jar /app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

#### **Multi-stage Build Security**
```dockerfile
# Multi-stage build for security
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs:16
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY src/ ./src/
EXPOSE 3000
CMD ["src/index.js"]
```

### **Container Registry Scanning**

#### **Harbor Registry Security Scanning**
```bash
# Configure Harbor with Trivy scanner
curl -X POST "https://harbor.example.com/api/v2.0/projects/library/repositories/nginx/artifacts/latest/scan" \
     -H "authorization: Basic <BASE64_CREDENTIALS>"

# Get scan results
curl -X GET "https://harbor.example.com/api/v2.0/projects/library/repositories/nginx/artifacts/latest/scan/vulnerabilities" \
     -H "authorization: Basic <BASE64_CREDENTIALS>"
```

#### **AWS ECR Security Scanning**
```bash
# Enable ECR image scanning
aws ecr put-image-scanning-configuration --repository-name nginx --image-scanning-configuration scanOnPush=true

# Start image scan
aws ecr start-image-scan --repository-name nginx --image-id imageTag=latest

# Get scan results
aws ecr describe-image-scan-findings --repository-name nginx --image-id imageTag=latest
```

#### **Docker Hub Security Scanning**
```bash
# Enable Docker Hub scanning (requires Docker Pro/Team)
docker scout cves nginx:latest
docker scout recommendations nginx:latest

# Generate SBOM (Software Bill of Materials)
docker scout sbom nginx:latest
```

### **Kubernetes STIG Commands**
```bash
# V-235810 - Configure API server securely
kubectl patch deployment kube-apiserver -n kube-system -p '{"spec":{"template":{"spec":{"containers":[{"name":"kube-apiserver","command":["kube-apiserver","--audit-log-maxage=30","--audit-log-maxbackup=10"]}]}}}}'

# V-235811 - Configure RBAC
kubectl create clusterrolebinding cluster-admin-binding \
  --clusterrole=cluster-admin --user=admin@example.com

# V-235812 - Configure network policies
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
EOF
```

---

## 🔧 Automated STIG Validation Commands

### **Windows STIG Validation**
```powershell
# Validate registry settings
$regValue = Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Netlogon\Parameters" -Name "RequireSignOrSeal"
if ($regValue.RequireSignOrSeal -eq 1) {
    Write-Output "V-254239: COMPLIANT"
} else {
    Write-Output "V-254239: NON-COMPLIANT"
}

# Validate service status
$service = Get-Service -Name "Fax" -ErrorAction SilentlyContinue
if ($service.Status -eq "Stopped" -and $service.StartType -eq "Disabled") {
    Write-Output "Service Hardening: COMPLIANT"
} else {
    Write-Output "Service Hardening: NON-COMPLIANT"
}
```

### **Linux STIG Validation**
```bash
#!/bin/bash
# Validate password policy
if grep -q "minlen = 15" /etc/security/pwquality.conf; then
    echo "V-230222: COMPLIANT"
else
    echo "V-230222: NON-COMPLIANT"
fi

# Validate service status
if systemctl is-enabled bluetooth.service | grep -q "disabled"; then
    echo "Service Hardening: COMPLIANT"
else
    echo "Service Hardening: NON-COMPLIANT"
fi

# Validate file permissions
if [[ $(stat -c %a /etc/passwd) == "644" ]]; then
    echo "File Permissions: COMPLIANT"
else
    echo "File Permissions: NON-COMPLIANT"
fi
```

---

## 📊 Patch Management Automation Scripts

### **Windows Patch Management Script**
```powershell
# Comprehensive Windows patching script
param(
    [string]$PatchGroup = "All",
    [switch]$SecurityOnly,
    [switch]$TestMode
)

# Import required modules
Import-Module PSWindowsUpdate

# Log function
function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Output "[$timestamp] $Message" | Tee-Object -FilePath "C:\Logs\patch_log.txt" -Append
}

# Pre-patch system check
function Test-SystemHealth {
    Write-Log "Performing pre-patch system health check..."
    
    # Check disk space
    $diskSpace = Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3}
    foreach ($disk in $diskSpace) {
        $freePercent = ($disk.FreeSpace / $disk.Size) * 100
        if ($freePercent -lt 15) {
            Write-Log "WARNING: Drive $($disk.DeviceID) has less than 15% free space"
        }
    }
    
    # Check critical services
    $criticalServices = @("BITS", "wuauserv", "CryptSvc")
    foreach ($service in $criticalServices) {
        if ((Get-Service $service).Status -ne "Running") {
            Write-Log "WARNING: Critical service $service is not running"
        }
    }
}

# Main patching function
function Install-SystemPatches {
    Test-SystemHealth
    
    Write-Log "Starting patch installation..."
    
    if ($SecurityOnly) {
        Get-WUInstall -MicrosoftUpdate -Category "Security Updates" -AcceptAll -AutoReboot:$(!$TestMode)
    } else {
        Get-WUInstall -MicrosoftUpdate -AcceptAll -AutoReboot:$(!$TestMode)
    }
    
    Write-Log "Patch installation completed"
}

# Execute patching
Install-SystemPatches
```

### **Linux Patch Management Script**
```bash
#!/bin/bash
# Comprehensive Linux patching script

PATCH_GROUP="all"
SECURITY_ONLY=false
TEST_MODE=false
LOG_FILE="/var/log/patch_management.log"

# Logging function
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $message" | tee -a "$LOG_FILE"
}

# Pre-patch system check
check_system_health() {
    log_message "Performing pre-patch system health check..."
    
    # Check disk space
    df -h | awk '$5 > 85 {print "WARNING: " $6 " is " $5 " full"}' | while read line; do
        log_message "$line"
    done
    
    # Check system load
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$load_avg > 2.0" | bc -l) )); then
        log_message "WARNING: High system load: $load_avg"
    fi
    
    # Check memory usage
    mem_usage=$(free | awk '/^Mem:/{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 90.0" | bc -l) )); then
        log_message "WARNING: High memory usage: ${mem_usage}%"
    fi
}

# Distribution-specific patching
patch_system() {
    check_system_health
    
    log_message "Starting patch installation..."
    
    if command -v yum >/dev/null 2>&1; then
        # RHEL/CentOS
        if [ "$SECURITY_ONLY" = true ]; then
            yum --security update -y
        else
            yum update -y
        fi
    elif command -v apt >/dev/null 2>&1; then
        # Ubuntu/Debian
        apt update
        if [ "$SECURITY_ONLY" = true ]; then
            apt upgrade -y $(apt list --upgradable 2>/dev/null | grep -i security | cut -d'/' -f1)
        else
            apt upgrade -y
        fi
    elif command -v zypper >/dev/null 2>&1; then
        # SUSE
        zypper refresh
        if [ "$SECURITY_ONLY" = true ]; then
            zypper patch --category security -y
        else
            zypper update -y
        fi
    fi
    
    log_message "Patch installation completed"
}

# Execute patching
patch_system
```

---

## 🚀 RAS-DASH Integration Commands

### **STIG Automation Integration**
```typescript
// Example RAS-DASH STIG automation service calls
const stigCommands = {
    windows: {
        passwordPolicy: 'net accounts /minpwlen:14 /uniquepw:24 /maxpwage:60',
        serviceHardening: 'Stop-Service -Name "Fax" -Force; Set-Service -Name "Fax" -StartupType Disabled',
        registrySettings: 'Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Netlogon\\Parameters" -Name "RequireSignOrSeal" -Value 1'
    },
    linux: {
        passwordComplexity: 'authconfig --enablereqlower --enablerequpper --enablereqdigit --enablereqother --update',
        serviceHardening: 'systemctl disable bluetooth.service; systemctl stop bluetooth.service',
        filePermissions: 'chmod 644 /etc/passwd; chmod 640 /etc/shadow'
    }
};
```

### **Patch Management Integration**
```typescript
// Example RAS-DASH patch management service calls
const patchCommands = {
    windows: {
        checkUpdates: 'Get-WUList',
        installSecurity: 'Get-WUInstall -MicrosoftUpdate -Category "Security Updates" -AcceptAll',
        installAll: 'Get-WUInstall -MicrosoftUpdate -AcceptAll -AutoReboot'
    },
    linux: {
        updatePackages: 'yum update -y',
        securityOnly: 'yum --security update -y',
        checkUpdates: 'yum check-update'
    }
};
```

These commands form the foundation of RAS-DASH's automated STIG implementation and patch management capabilities, providing comprehensive security hardening and system maintenance across diverse IT environments.