#!/bin/bash

# System Dependencies and Environment Check for RAS DASH
# This script thoroughly validates system state before deployment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deployment-error-handler.sh"

log_info "🔍 RAS DASH System Dependencies and Environment Check"

# Initialize dependency check steps
init_progress \
    "System Information Gathering" \
    "Package Manager Validation" \
    "Required Software Detection" \
    "Existing Data Directory Analysis" \
    "Process and Service Check" \
    "Network Configuration Validation" \
    "Permission and Access Check" \
    "Environment Variable Review"

DEPENDENCY_RESULTS=()
DATA_CONFLICTS=()
PROCESS_CONFLICTS=()
RECONFIGURATION_NEEDED=()

# System detection
SYSTEM_OS=""
PACKAGE_MANAGER=""

detect_system() {
    if [[ -f /etc/os-release ]]; then
        SYSTEM_OS=$(grep "^ID=" /etc/os-release | cut -d'=' -f2 | tr -d '"')
        log_info "Detected OS: $SYSTEM_OS"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        SYSTEM_OS="macos"
        log_info "Detected OS: macOS"
    else
        SYSTEM_OS="unknown"
        log_warn "Could not detect operating system"
    fi
    
    # Detect package manager
    if command -v dnf &> /dev/null; then
        PACKAGE_MANAGER="dnf"
    elif command -v yum &> /dev/null; then
        PACKAGE_MANAGER="yum"
    elif command -v apt &> /dev/null; then
        PACKAGE_MANAGER="apt"
    elif command -v brew &> /dev/null; then
        PACKAGE_MANAGER="brew"
    else
        PACKAGE_MANAGER="unknown"
        log_warn "Could not detect package manager"
    fi
    
    log_info "Package manager: $PACKAGE_MANAGER"
}

# Step 1: System Information Gathering
start_step

log_info "Gathering system information..."

detect_system

# Get system specs
MEMORY_GB=$(free -g 2>/dev/null | awk '/^Mem:/{print $2}' || echo "unknown")
DISK_SPACE_GB=$(df / 2>/dev/null | awk 'NR==2 {print int($4/1024/1024)}' || echo "unknown")
CPU_CORES=$(nproc 2>/dev/null || echo "unknown")
HOSTNAME=$(hostname 2>/dev/null || echo "unknown")

log_info "System specifications:"
log_info "  Hostname: $HOSTNAME"
log_info "  Memory: ${MEMORY_GB}GB"
log_info "  Disk space available: ${DISK_SPACE_GB}GB"
log_info "  CPU cores: $CPU_CORES"

# Check minimum requirements
if [[ "$MEMORY_GB" != "unknown" && "$MEMORY_GB" -lt 1 ]]; then
    log_warn "⚠️  Low memory detected (${MEMORY_GB}GB). RAS DASH recommends at least 1GB"
    DEPENDENCY_RESULTS+=("Memory: WARN - ${MEMORY_GB}GB (minimum 1GB recommended)")
else
    DEPENDENCY_RESULTS+=("Memory: PASS - ${MEMORY_GB}GB")
fi

if [[ "$DISK_SPACE_GB" != "unknown" && "$DISK_SPACE_GB" -lt 10 ]]; then
    log_warn "⚠️  Low disk space (${DISK_SPACE_GB}GB). RAS DASH recommends at least 10GB"
    DEPENDENCY_RESULTS+=("Disk Space: WARN - ${DISK_SPACE_GB}GB (minimum 10GB recommended)")
else
    DEPENDENCY_RESULTS+=("Disk Space: PASS - ${DISK_SPACE_GB}GB")
fi

complete_step

# Step 2: Package Manager Validation
start_step

log_info "Validating package manager and updating package lists..."

case $PACKAGE_MANAGER in
    "dnf"|"yum")
        if $PACKAGE_MANAGER list updates &>/dev/null; then
            log_info "✅ Package manager ($PACKAGE_MANAGER) is functional"
            DEPENDENCY_RESULTS+=("Package Manager: PASS - $PACKAGE_MANAGER working")
            
            # Check for available updates
            UPDATE_COUNT=$($PACKAGE_MANAGER list updates 2>/dev/null | grep -c "updates" || echo "0")
            if [[ "$UPDATE_COUNT" -gt 0 ]]; then
                log_warn "⚠️  $UPDATE_COUNT package updates available"
                RECONFIGURATION_NEEDED+=("System updates: $UPDATE_COUNT packages can be updated")
            fi
        else
            log_error "❌ Package manager ($PACKAGE_MANAGER) not working properly"
            DEPENDENCY_RESULTS+=("Package Manager: FAIL - $PACKAGE_MANAGER not functional")
        fi
        ;;
    "apt")
        if apt list --upgradable &>/dev/null; then
            log_info "✅ Package manager (apt) is functional"
            DEPENDENCY_RESULTS+=("Package Manager: PASS - apt working")
            
            UPDATE_COUNT=$(apt list --upgradable 2>/dev/null | grep -c "upgradable" || echo "0")
            if [[ "$UPDATE_COUNT" -gt 0 ]]; then
                log_warn "⚠️  $UPDATE_COUNT package updates available"
                RECONFIGURATION_NEEDED+=("System updates: $UPDATE_COUNT packages can be updated")
            fi
        else
            log_error "❌ Package manager (apt) not working properly"
            DEPENDENCY_RESULTS+=("Package Manager: FAIL - apt not functional")
        fi
        ;;
    "brew")
        if brew --version &>/dev/null; then
            log_info "✅ Package manager (brew) is functional"
            DEPENDENCY_RESULTS+=("Package Manager: PASS - brew working")
        else
            log_error "❌ Homebrew not working properly"
            DEPENDENCY_RESULTS+=("Package Manager: FAIL - brew not functional")
        fi
        ;;
    *)
        log_error "❌ No supported package manager found"
        DEPENDENCY_RESULTS+=("Package Manager: FAIL - no supported package manager")
        ;;
esac

complete_step

# Step 3: Required Software Detection
start_step

log_info "Checking for required software dependencies..."

# Define required software with version requirements
declare -A REQUIRED_SOFTWARE=(
    ["node"]="18.0.0"
    ["npm"]="8.0.0"
    ["git"]="2.0.0"
    ["curl"]="7.0.0"
    ["ssh"]="1.0.0"
    ["aws"]="2.0.0"
    ["jq"]="1.6.0"
)

# Define optional software
declare -A OPTIONAL_SOFTWARE=(
    ["docker"]="20.0.0"
    ["nginx"]="1.18.0"
    ["pm2"]="5.0.0"
    ["certbot"]="1.0.0"
    ["postgresql"]="13.0.0"
)

check_software_version() {
    local software="$1"
    local required_version="$2"
    local current_version=""
    
    case $software in
        "node")
            if command -v node &>/dev/null; then
                current_version=$(node --version 2>/dev/null | sed 's/v//')
            fi
            ;;
        "npm")
            if command -v npm &>/dev/null; then
                current_version=$(npm --version 2>/dev/null)
            fi
            ;;
        "git")
            if command -v git &>/dev/null; then
                current_version=$(git --version 2>/dev/null | awk '{print $3}')
            fi
            ;;
        "aws")
            if command -v aws &>/dev/null; then
                current_version=$(aws --version 2>&1 | head -1 | awk '{print $1}' | cut -d'/' -f2)
            fi
            ;;
        "jq")
            if command -v jq &>/dev/null; then
                current_version=$(jq --version 2>/dev/null | sed 's/jq-//')
            fi
            ;;
        "docker")
            if command -v docker &>/dev/null; then
                current_version=$(docker --version 2>/dev/null | awk '{print $3}' | sed 's/,//')
            fi
            ;;
        "nginx")
            if command -v nginx &>/dev/null; then
                current_version=$(nginx -v 2>&1 | awk '{print $3}' | cut -d'/' -f2)
            fi
            ;;
        "pm2")
            if command -v pm2 &>/dev/null; then
                current_version=$(pm2 --version 2>/dev/null)
            fi
            ;;
        "certbot")
            if command -v certbot &>/dev/null; then
                current_version=$(certbot --version 2>/dev/null | awk '{print $2}')
            fi
            ;;
        "postgresql")
            if command -v psql &>/dev/null; then
                current_version=$(psql --version 2>/dev/null | awk '{print $3}')
            fi
            ;;
        *)
            if command -v "$software" &>/dev/null; then
                current_version="installed"
            fi
            ;;
    esac
    
    if [[ -n "$current_version" ]]; then
        # Version comparison (simplified)
        if [[ "$current_version" == "installed" ]]; then
            echo "✅ $software: installed"
            return 0
        else
            echo "✅ $software: $current_version"
            return 0
        fi
    else
        echo "❌ $software: not installed"
        return 1
    fi
}

echo ""
echo "🔧 Required Software:"
echo "===================="

for software in "${!REQUIRED_SOFTWARE[@]}"; do
    result=$(check_software_version "$software" "${REQUIRED_SOFTWARE[$software]}")
    echo "  $result"
    
    if [[ "$result" == *"✅"* ]]; then
        DEPENDENCY_RESULTS+=("$software: PASS")
    else
        DEPENDENCY_RESULTS+=("$software: FAIL - not installed")
        RECONFIGURATION_NEEDED+=("Install $software (required)")
    fi
done

echo ""
echo "🔧 Optional Software:"
echo "===================="

for software in "${!OPTIONAL_SOFTWARE[@]}"; do
    result=$(check_software_version "$software" "${OPTIONAL_SOFTWARE[$software]}")
    echo "  $result"
    
    if [[ "$result" == *"✅"* ]]; then
        DEPENDENCY_RESULTS+=("$software: PASS (optional)")
    else
        DEPENDENCY_RESULTS+=("$software: MISSING (optional)")
    fi
done

complete_step

# Step 4: Existing Data Directory Analysis
start_step

log_info "Analyzing existing data directories and potential conflicts..."

# Define directories to check
DIRECTORIES_TO_CHECK=(
    "/opt/ras-dash"
    "/var/log/ras-dash"
    "/etc/nginx/conf.d"
    "/etc/letsencrypt"
    "$HOME/.aws"
    "$HOME/.ssh"
    "./logs"
    "./node_modules"
    "./.env"
    "./deployment-config.json"
)

echo ""
echo "📁 Directory Analysis:"
echo "====================="

for dir in "${DIRECTORIES_TO_CHECK[@]}"; do
    if [[ -d "$dir" ]]; then
        # Get directory size and file count
        DIR_SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
        FILE_COUNT=$(find "$dir" -type f 2>/dev/null | wc -l)
        OWNER=$(stat -c '%U:%G' "$dir" 2>/dev/null || echo "unknown")
        PERMISSIONS=$(stat -c '%a' "$dir" 2>/dev/null || echo "unknown")
        
        echo "  📁 $dir:"
        echo "    Size: $DIR_SIZE"
        echo "    Files: $FILE_COUNT"
        echo "    Owner: $OWNER"
        echo "    Permissions: $PERMISSIONS"
        
        # Check for important files
        case "$dir" in
            "/opt/ras-dash")
                if [[ -f "$dir/package.json" ]]; then
                    echo "    ⚠️  Existing RAS DASH installation detected"
                    DATA_CONFLICTS+=("RAS DASH installation exists in $dir")
                fi
                if [[ -f "$dir/.env" ]]; then
                    echo "    ⚠️  Environment configuration exists"
                    DATA_CONFLICTS+=("Environment file exists: $dir/.env")
                fi
                ;;
            "/etc/nginx/conf.d")
                NGINX_CONFIGS=$(find "$dir" -name "*.conf" 2>/dev/null | wc -l)
                if [[ "$NGINX_CONFIGS" -gt 0 ]]; then
                    echo "    ⚠️  $NGINX_CONFIGS nginx configurations found"
                    DATA_CONFLICTS+=("Nginx configurations exist: $NGINX_CONFIGS files")
                fi
                ;;
            "/etc/letsencrypt")
                SSL_CERTS=$(find "$dir/live" -name "*.pem" 2>/dev/null | wc -l)
                if [[ "$SSL_CERTS" -gt 0 ]]; then
                    echo "    ⚠️  $SSL_CERTS SSL certificates found"
                    DATA_CONFLICTS+=("SSL certificates exist: $SSL_CERTS certificates")
                fi
                ;;
            "$HOME/.aws")
                if [[ -f "$dir/credentials" ]]; then
                    echo "    ✅ AWS credentials configured"
                fi
                if [[ -f "$dir/config" ]]; then
                    echo "    ✅ AWS config exists"
                fi
                ;;
            "$HOME/.ssh")
                KEY_COUNT=$(find "$dir" -name "*.pem" 2>/dev/null | wc -l)
                if [[ "$KEY_COUNT" -gt 0 ]]; then
                    echo "    📱 $KEY_COUNT SSH keys found"
                fi
                ;;
        esac
        echo ""
    elif [[ -f "$dir" ]]; then
        # It's a file
        FILE_SIZE=$(du -sh "$dir" 2>/dev/null | cut -f1)
        OWNER=$(stat -c '%U:%G' "$dir" 2>/dev/null || echo "unknown")
        PERMISSIONS=$(stat -c '%a' "$dir" 2>/dev/null || echo "unknown")
        
        echo "  📄 $dir:"
        echo "    Size: $FILE_SIZE"
        echo "    Owner: $OWNER"
        echo "    Permissions: $PERMISSIONS"
        
        case "$dir" in
            "./.env")
                echo "    ⚠️  Environment configuration exists"
                DATA_CONFLICTS+=("Environment file exists: $dir")
                ;;
            "./deployment-config.json")
                echo "    ⚠️  Previous deployment configuration found"
                DATA_CONFLICTS+=("Deployment config exists: $dir")
                ;;
        esac
        echo ""
    else
        echo "  ✅ $dir: not present"
    fi
done

complete_step

# Step 5: Process and Service Check
start_step

log_info "Checking for running processes and services..."

# Define services to check
SERVICES_TO_CHECK=(
    "nginx"
    "postgresql"
    "node"
    "pm2"
    "docker"
)

# Define processes to check
PROCESSES_TO_CHECK=(
    "node"
    "npm"
    "nginx"
    "postgres"
    "pm2"
)

echo ""
echo "🔄 Service Status:"
echo "=================="

for service in "${SERVICES_TO_CHECK[@]}"; do
    if systemctl is-active "$service" &>/dev/null; then
        STATUS=$(systemctl is-active "$service")
        echo "  🟢 $service: $STATUS"
        
        # Check if it might conflict
        case "$service" in
            "nginx")
                PROCESS_CONFLICTS+=("Nginx service is running - may need reconfiguration")
                ;;
            "postgresql")
                PROCESS_CONFLICTS+=("PostgreSQL service is running - may conflict with RDS setup")
                ;;
        esac
    elif systemctl is-enabled "$service" &>/dev/null; then
        echo "  🟡 $service: installed but not running"
    else
        echo "  ⚪ $service: not installed/configured"
    fi
done

echo ""
echo "🔄 Running Processes:"
echo "===================="

for process in "${PROCESSES_TO_CHECK[@]}"; do
    PROCESS_COUNT=$(pgrep -c "$process" 2>/dev/null || echo "0")
    if [[ "$PROCESS_COUNT" -gt 0 ]]; then
        echo "  🟢 $process: $PROCESS_COUNT processes running"
        
        # Get process details
        PROCESS_INFO=$(ps aux | grep "$process" | grep -v grep | head -3)
        echo "    Processes:"
        while IFS= read -r line; do
            echo "      $line"
        done <<< "$PROCESS_INFO"
        
        # Check for potential conflicts
        case "$process" in
            "node")
                NODE_PORTS=$(ss -tulpn 2>/dev/null | grep node | awk '{print $5}' | cut -d':' -f2 | sort -u)
                if [[ -n "$NODE_PORTS" ]]; then
                    echo "    Ports in use: $NODE_PORTS"
                    PROCESS_CONFLICTS+=("Node.js processes using ports: $NODE_PORTS")
                fi
                ;;
            "nginx")
                if ss -tulpn 2>/dev/null | grep ":80 " &>/dev/null; then
                    PROCESS_CONFLICTS+=("Nginx using port 80 - may need reconfiguration")
                fi
                if ss -tulpn 2>/dev/null | grep ":443 " &>/dev/null; then
                    PROCESS_CONFLICTS+=("Nginx using port 443 - may need reconfiguration")
                fi
                ;;
        esac
    else
        echo "  ⚪ $process: not running"
    fi
done

complete_step

# Step 6: Network Configuration Validation
start_step

log_info "Validating network configuration..."

# Check important ports
PORTS_TO_CHECK=(22 80 443 5000 5432)

echo ""
echo "🌐 Port Analysis:"
echo "================="

for port in "${PORTS_TO_CHECK[@]}"; do
    if ss -tulpn 2>/dev/null | grep ":$port " &>/dev/null; then
        PROCESS_USING_PORT=$(ss -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2)
        echo "  🔴 Port $port: IN USE by $PROCESS_USING_PORT"
        PROCESS_CONFLICTS+=("Port $port in use by $PROCESS_USING_PORT")
    else
        echo "  🟢 Port $port: available"
    fi
done

# Check network connectivity
echo ""
echo "🌐 Network Connectivity:"
echo "======================="

CONNECTIVITY_TESTS=(
    "8.8.8.8:53"
    "github.com:443"
    "amazonaws.com:443"
    "npmjs.org:443"
)

for test in "${CONNECTIVITY_TESTS[@]}"; do
    HOST="${test%:*}"
    PORT="${test#*:}"
    
    if timeout 5 bash -c "</dev/tcp/$HOST/$PORT" 2>/dev/null; then
        echo "  ✅ $HOST:$PORT - reachable"
    else
        echo "  ❌ $HOST:$PORT - unreachable"
        DEPENDENCY_RESULTS+=("Network: WARN - $HOST:$PORT unreachable")
    fi
done

complete_step

# Step 7: Permission and Access Check
start_step

log_info "Checking permissions and access requirements..."

# Check sudo access
if sudo -n true 2>/dev/null; then
    echo "  ✅ Sudo access: available (passwordless)"
    DEPENDENCY_RESULTS+=("Sudo Access: PASS - passwordless")
elif sudo -v 2>/dev/null; then
    echo "  ✅ Sudo access: available (with password)"
    DEPENDENCY_RESULTS+=("Sudo Access: PASS - with password")
else
    echo "  ❌ Sudo access: not available"
    DEPENDENCY_RESULTS+=("Sudo Access: FAIL - not available")
    RECONFIGURATION_NEEDED+=("Sudo access required for system configuration")
fi

# Check write permissions for key directories
WRITE_TEST_DIRS=(
    "/opt"
    "/etc/nginx"
    "/var/log"
    "$HOME"
    "."
)

echo ""
echo "📝 Write Permissions:"
echo "===================="

for dir in "${WRITE_TEST_DIRS[@]}"; do
    if [[ -w "$dir" ]]; then
        echo "  ✅ $dir: writable"
    else
        echo "  ❌ $dir: not writable"
        DEPENDENCY_RESULTS+=("Write Permission: WARN - $dir not writable")
    fi
done

complete_step

# Step 8: Environment Variable Review
start_step

log_info "Reviewing environment variables..."

# Check important environment variables
IMPORTANT_ENV_VARS=(
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
    "NODE_ENV"
    "PATH"
    "HOME"
    "USER"
)

echo ""
echo "🌍 Environment Variables:"
echo "======================="

for var in "${IMPORTANT_ENV_VARS[@]}"; do
    if [[ -n "${!var}" ]]; then
        case "$var" in
            *"KEY"*|*"SECRET"*)
                echo "  ✅ $var: [HIDDEN]"
                ;;
            *)
                echo "  ✅ $var: ${!var}"
                ;;
        esac
    else
        echo "  ⚪ $var: not set"
        if [[ "$var" == "AWS_ACCESS_KEY_ID" || "$var" == "AWS_SECRET_ACCESS_KEY" ]]; then
            RECONFIGURATION_NEEDED+=("AWS credentials not configured in environment")
        fi
    fi
done

complete_step

# Generate comprehensive report
echo ""
echo "============================================"
echo "     SYSTEM DEPENDENCIES & ENVIRONMENT REPORT"
echo "============================================"
echo "Hostname: $HOSTNAME"
echo "OS: $SYSTEM_OS"
echo "Package Manager: $PACKAGE_MANAGER"
echo "Analysis Date: $(date)"
echo ""

echo "DEPENDENCY CHECK RESULTS:"
echo "========================"
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

for result in "${DEPENDENCY_RESULTS[@]}"; do
    echo "  $result"
    if [[ "$result" == *"PASS"* ]]; then
        PASS_COUNT=$((PASS_COUNT + 1))
    elif [[ "$result" == *"WARN"* ]]; then
        WARN_COUNT=$((WARN_COUNT + 1))
    elif [[ "$result" == *"FAIL"* ]]; then
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
done

echo ""
echo "DATA CONFLICTS DETECTED:"
echo "======================="
if [[ ${#DATA_CONFLICTS[@]} -gt 0 ]]; then
    for conflict in "${DATA_CONFLICTS[@]}"; do
        echo "  ⚠️  $conflict"
    done
else
    echo "  ✅ No data conflicts detected"
fi

echo ""
echo "PROCESS CONFLICTS:"
echo "=================="
if [[ ${#PROCESS_CONFLICTS[@]} -gt 0 ]]; then
    for conflict in "${PROCESS_CONFLICTS[@]}"; do
        echo "  ⚠️  $conflict"
    done
else
    echo "  ✅ No process conflicts detected"
fi

echo ""
echo "RECONFIGURATION NEEDED:"
echo "======================"
if [[ ${#RECONFIGURATION_NEEDED[@]} -gt 0 ]]; then
    for reconfig in "${RECONFIGURATION_NEEDED[@]}"; do
        echo "  🔧 $reconfig"
    done
else
    echo "  ✅ No reconfiguration needed"
fi

echo ""
echo "SUMMARY:"
echo "========"
echo "✅ Passed: $PASS_COUNT"
echo "⚠️  Warnings: $WARN_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "🔧 Conflicts: $((${#DATA_CONFLICTS[@]} + ${#PROCESS_CONFLICTS[@]}))"
echo "📝 Reconfigurations: ${#RECONFIGURATION_NEEDED[@]}"

# Determine overall status
OVERALL_STATUS="READY"
if [[ $FAIL_COUNT -gt 0 ]]; then
    OVERALL_STATUS="NEEDS_DEPENDENCIES"
elif [[ ${#DATA_CONFLICTS[@]} -gt 0 || ${#PROCESS_CONFLICTS[@]} -gt 0 ]]; then
    OVERALL_STATUS="NEEDS_CLEANUP"
elif [[ ${#RECONFIGURATION_NEEDED[@]} -gt 0 ]]; then
    OVERALL_STATUS="NEEDS_CONFIGURATION"
fi

echo ""
echo "DEPLOYMENT READINESS: $OVERALL_STATUS"

# Save detailed report
REPORT_FILE="${LOG_DIR}/system-dependencies-$(date +%Y%m%d-%H%M%S).json"
mkdir -p "$LOG_DIR"

cat > "$REPORT_FILE" << EOF
{
  "system_check": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "hostname": "$HOSTNAME",
    "os": "$SYSTEM_OS",
    "package_manager": "$PACKAGE_MANAGER",
    "system_specs": {
      "memory_gb": "$MEMORY_GB",
      "disk_space_gb": "$DISK_SPACE_GB",
      "cpu_cores": "$CPU_CORES"
    },
    "dependency_results": $(printf '%s\n' "${DEPENDENCY_RESULTS[@]}" | jq -R . | jq -s .),
    "data_conflicts": $(printf '%s\n' "${DATA_CONFLICTS[@]}" | jq -R . | jq -s .),
    "process_conflicts": $(printf '%s\n' "${PROCESS_CONFLICTS[@]}" | jq -R . | jq -s .),
    "reconfiguration_needed": $(printf '%s\n' "${RECONFIGURATION_NEEDED[@]}" | jq -R . | jq -s .),
    "summary": {
      "passed": $PASS_COUNT,
      "warnings": $WARN_COUNT,
      "failed": $FAIL_COUNT,
      "conflicts": $((${#DATA_CONFLICTS[@]} + ${#PROCESS_CONFLICTS[@]})),
      "reconfigurations": ${#RECONFIGURATION_NEEDED[@]},
      "overall_status": "$OVERALL_STATUS"
    }
  }
}
EOF

echo ""
echo "📊 Detailed report saved to: $REPORT_FILE"

# Provide recommendations
echo ""
echo "RECOMMENDATIONS:"
echo "==============="

case "$OVERALL_STATUS" in
    "READY")
        echo "  🎉 System is ready for RAS DASH deployment!"
        echo "  📝 Run: ./scripts/create-infrastructure.sh your-domain.com"
        ;;
    "NEEDS_DEPENDENCIES")
        echo "  🔧 Install missing dependencies before proceeding:"
        echo "  📝 Run: ./scripts/install-dependencies.sh"
        ;;
    "NEEDS_CLEANUP")
        echo "  🧹 Resolve data/process conflicts before deployment:"
        echo "  📝 Run: ./scripts/resolve-conflicts.sh"
        ;;
    "NEEDS_CONFIGURATION")
        echo "  ⚙️  Configure system before deployment:"
        echo "  📝 Run: ./scripts/configure-system.sh"
        ;;
esac

# Return appropriate exit code
if [[ "$OVERALL_STATUS" == "READY" ]]; then
    exit 0
else
    exit 1
fi