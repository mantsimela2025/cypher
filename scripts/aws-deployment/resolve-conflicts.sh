#!/bin/bash

# Conflict Resolution Script for RAS DASH Deployment
# This script helps resolve data and process conflicts detected during system check

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deployment-error-handler.sh"

log_info "🧹 RAS DASH Conflict Resolution"

# Load system check results
SYSTEM_CHECK_REPORT="${LOG_DIR}/system-dependencies-latest.json"
if [[ ! -f "$SYSTEM_CHECK_REPORT" ]]; then
    # Find the most recent system check report
    LATEST_REPORT=$(ls -t ${LOG_DIR}/system-dependencies-*.json 2>/dev/null | head -1)
    if [[ -n "$LATEST_REPORT" ]]; then
        cp "$LATEST_REPORT" "$SYSTEM_CHECK_REPORT"
    else
        log_error "No system check report found. Run check-system-dependencies.sh first."
        exit 1
    fi
fi

log_info "Loading conflict data from: $SYSTEM_CHECK_REPORT"

# Extract conflict data
DATA_CONFLICTS=($(jq -r '.system_check.data_conflicts[]?' "$SYSTEM_CHECK_REPORT" 2>/dev/null))
PROCESS_CONFLICTS=($(jq -r '.system_check.process_conflicts[]?' "$SYSTEM_CHECK_REPORT" 2>/dev/null))

TOTAL_CONFLICTS=$((${#DATA_CONFLICTS[@]} + ${#PROCESS_CONFLICTS[@]}))

if [[ $TOTAL_CONFLICTS -eq 0 ]]; then
    log_info "✅ No conflicts detected. System is ready for deployment."
    exit 0
fi

log_warn "Found $TOTAL_CONFLICTS conflicts to resolve"

# Interactive mode flag
INTERACTIVE="${INTERACTIVE:-true}"
BACKUP_DIR="./backups/$(date +%Y%m%d-%H%M%S)"

# Backup function
create_backup() {
    local source="$1"
    local description="$2"
    
    if [[ ! -d "$BACKUP_DIR" ]]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
    
    if [[ -e "$source" ]]; then
        local backup_name="$(basename "$source")"
        cp -r "$source" "$BACKUP_DIR/$backup_name" 2>/dev/null
        log_info "✅ Backed up $description to $BACKUP_DIR/$backup_name"
        return 0
    else
        log_warn "⚠️  Source $source does not exist, skipping backup"
        return 1
    fi
}

# Resolve data conflicts
resolve_data_conflicts() {
    if [[ ${#DATA_CONFLICTS[@]} -eq 0 ]]; then
        return 0
    fi
    
    log_info "🗂️  Resolving data conflicts..."
    
    for conflict in "${DATA_CONFLICTS[@]}"; do
        echo ""
        log_warn "Data conflict: $conflict"
        
        case "$conflict" in
            *"RAS DASH installation exists"*)
                local ras_dash_dir="/opt/ras-dash"
                if [[ -d "$ras_dash_dir" ]]; then
                    echo "  Found existing RAS DASH installation in $ras_dash_dir"
                    
                    # Check if it's running
                    if pgrep -f "ras-dash" &>/dev/null; then
                        echo "  ⚠️  RAS DASH processes are currently running"
                        
                        if [[ "$INTERACTIVE" == "true" ]]; then
                            echo "  Options:"
                            echo "    1. Stop and backup existing installation"
                            echo "    2. Stop and remove existing installation"
                            echo "    3. Skip this conflict (manual resolution required)"
                            read -p "  Select option (1-3): " choice
                        else
                            choice=1  # Auto-backup in non-interactive mode
                            log_info "  Auto-selecting: Stop and backup existing installation"
                        fi
                        
                        case $choice in
                            1)
                                log_info "  Stopping RAS DASH processes..."
                                sudo pkill -f "ras-dash" 2>/dev/null || true
                                if command -v pm2 &>/dev/null; then
                                    pm2 stop all 2>/dev/null || true
                                    pm2 delete all 2>/dev/null || true
                                fi
                                sleep 3
                                
                                create_backup "$ras_dash_dir" "existing RAS DASH installation"
                                
                                log_info "  Removing existing installation..."
                                sudo rm -rf "$ras_dash_dir"
                                log_info "  ✅ Existing RAS DASH installation resolved"
                                ;;
                            2)
                                log_info "  Stopping RAS DASH processes..."
                                sudo pkill -f "ras-dash" 2>/dev/null || true
                                if command -v pm2 &>/dev/null; then
                                    pm2 stop all 2>/dev/null || true
                                    pm2 delete all 2>/dev/null || true
                                fi
                                sleep 3
                                
                                log_info "  Removing existing installation..."
                                sudo rm -rf "$ras_dash_dir"
                                log_info "  ✅ Existing RAS DASH installation removed"
                                ;;
                            3)
                                log_warn "  ⚠️  Skipping - manual resolution required"
                                ;;
                        esac
                    else
                        # Not running, just handle the directory
                        if [[ "$INTERACTIVE" == "true" ]]; then
                            echo "  Options:"
                            echo "    1. Backup and remove existing installation"
                            echo "    2. Remove existing installation"
                            echo "    3. Skip this conflict"
                            read -p "  Select option (1-3): " choice
                        else
                            choice=1
                            log_info "  Auto-selecting: Backup and remove existing installation"
                        fi
                        
                        case $choice in
                            1)
                                create_backup "$ras_dash_dir" "existing RAS DASH installation"
                                sudo rm -rf "$ras_dash_dir"
                                log_info "  ✅ Existing installation backed up and removed"
                                ;;
                            2)
                                sudo rm -rf "$ras_dash_dir"
                                log_info "  ✅ Existing installation removed"
                                ;;
                            3)
                                log_warn "  ⚠️  Skipping - manual resolution required"
                                ;;
                        esac
                    fi
                fi
                ;;
                
            *"Environment file exists"*)
                local env_file=$(echo "$conflict" | grep -o "/[^:]*\.env\|\.env")
                if [[ -f "$env_file" ]]; then
                    echo "  Found environment file: $env_file"
                    
                    if [[ "$INTERACTIVE" == "true" ]]; then
                        echo "  Options:"
                        echo "    1. Backup and keep existing environment file"
                        echo "    2. Backup and remove environment file"
                        echo "    3. Remove environment file"
                        echo "    4. Skip this conflict"
                        read -p "  Select option (1-4): " choice
                    else
                        choice=1
                        log_info "  Auto-selecting: Backup and keep existing environment file"
                    fi
                    
                    case $choice in
                        1)
                            create_backup "$env_file" "environment configuration"
                            log_info "  ✅ Environment file backed up and preserved"
                            ;;
                        2)
                            create_backup "$env_file" "environment configuration"
                            rm -f "$env_file"
                            log_info "  ✅ Environment file backed up and removed"
                            ;;
                        3)
                            rm -f "$env_file"
                            log_info "  ✅ Environment file removed"
                            ;;
                        4)
                            log_warn "  ⚠️  Skipping - manual resolution required"
                            ;;
                    esac
                fi
                ;;
                
            *"Deployment config exists"*)
                local config_file="deployment-config.json"
                if [[ -f "$config_file" ]]; then
                    echo "  Found deployment configuration: $config_file"
                    
                    if [[ "$INTERACTIVE" == "true" ]]; then
                        echo "  Options:"
                        echo "    1. Backup and remove deployment config"
                        echo "    2. Remove deployment config"
                        echo "    3. Skip this conflict"
                        read -p "  Select option (1-3): " choice
                    else
                        choice=1
                        log_info "  Auto-selecting: Backup and remove deployment config"
                    fi
                    
                    case $choice in
                        1)
                            create_backup "$config_file" "deployment configuration"
                            rm -f "$config_file"
                            log_info "  ✅ Deployment config backed up and removed"
                            ;;
                        2)
                            rm -f "$config_file"
                            log_info "  ✅ Deployment config removed"
                            ;;
                        3)
                            log_warn "  ⚠️  Skipping - manual resolution required"
                            ;;
                    esac
                fi
                ;;
                
            *"Nginx configurations exist"*)
                local nginx_dir="/etc/nginx/conf.d"
                if [[ -d "$nginx_dir" ]]; then
                    local config_count=$(find "$nginx_dir" -name "*.conf" 2>/dev/null | wc -l)
                    echo "  Found $config_count nginx configurations in $nginx_dir"
                    
                    if [[ "$INTERACTIVE" == "true" ]]; then
                        echo "  Options:"
                        echo "    1. Backup existing nginx configurations"
                        echo "    2. List and selectively backup configurations"
                        echo "    3. Skip this conflict"
                        read -p "  Select option (1-3): " choice
                    else
                        choice=1
                        log_info "  Auto-selecting: Backup existing nginx configurations"
                    fi
                    
                    case $choice in
                        1)
                            create_backup "$nginx_dir" "nginx configurations"
                            log_info "  ✅ Nginx configurations backed up"
                            ;;
                        2)
                            echo "  Existing nginx configurations:"
                            find "$nginx_dir" -name "*.conf" -exec basename {} \;
                            echo "  All configurations will be backed up for safety"
                            create_backup "$nginx_dir" "nginx configurations"
                            log_info "  ✅ Nginx configurations backed up"
                            ;;
                        3)
                            log_warn "  ⚠️  Skipping - manual resolution required"
                            ;;
                    esac
                fi
                ;;
                
            *"SSL certificates exist"*)
                local ssl_dir="/etc/letsencrypt"
                if [[ -d "$ssl_dir" ]]; then
                    echo "  Found SSL certificates in $ssl_dir"
                    
                    if [[ "$INTERACTIVE" == "true" ]]; then
                        echo "  Options:"
                        echo "    1. Keep existing SSL certificates (recommended)"
                        echo "    2. Backup SSL certificates"
                        echo "    3. Skip this conflict"
                        read -p "  Select option (1-3): " choice
                    else
                        choice=1
                        log_info "  Auto-selecting: Keep existing SSL certificates"
                    fi
                    
                    case $choice in
                        1)
                            log_info "  ✅ Preserving existing SSL certificates"
                            ;;
                        2)
                            create_backup "$ssl_dir" "SSL certificates"
                            log_info "  ✅ SSL certificates backed up"
                            ;;
                        3)
                            log_warn "  ⚠️  Skipping - manual resolution required"
                            ;;
                    esac
                fi
                ;;
        esac
    done
}

# Resolve process conflicts
resolve_process_conflicts() {
    if [[ ${#PROCESS_CONFLICTS[@]} -eq 0 ]]; then
        return 0
    fi
    
    log_info "🔄 Resolving process conflicts..."
    
    for conflict in "${PROCESS_CONFLICTS[@]}"; do
        echo ""
        log_warn "Process conflict: $conflict"
        
        case "$conflict" in
            *"Port"*"in use"*)
                local port=$(echo "$conflict" | grep -o "Port [0-9]*" | grep -o "[0-9]*")
                local process=$(echo "$conflict" | grep -o "by .*$" | sed 's/by //')
                
                echo "  Port $port is in use by $process"
                
                if [[ "$INTERACTIVE" == "true" ]]; then
                    echo "  Options:"
                    echo "    1. Stop the process using port $port"
                    echo "    2. View process details"
                    echo "    3. Skip this conflict"
                    read -p "  Select option (1-3): " choice
                else
                    # Auto-resolve based on port
                    if [[ "$port" == "5000" ]]; then
                        choice=1  # Stop processes on our application port
                        log_info "  Auto-selecting: Stop the process using port $port"
                    else
                        choice=3  # Skip for system ports
                        log_info "  Auto-selecting: Skip system port conflict"
                    fi
                fi
                
                case $choice in
                    1)
                        log_info "  Attempting to stop process using port $port..."
                        
                        # Get process PID
                        local pid=$(ss -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2)
                        
                        if [[ -n "$pid" ]]; then
                            echo "  Found process PID: $pid"
                            
                            # Try graceful shutdown first
                            if kill -TERM "$pid" 2>/dev/null; then
                                log_info "  Sent TERM signal to process $pid"
                                sleep 5
                                
                                # Check if still running
                                if kill -0 "$pid" 2>/dev/null; then
                                    log_warn "  Process still running, forcing shutdown..."
                                    kill -KILL "$pid" 2>/dev/null
                                fi
                                
                                sleep 2
                                
                                # Verify port is free
                                if ! ss -tulpn 2>/dev/null | grep ":$port " &>/dev/null; then
                                    log_info "  ✅ Port $port is now available"
                                else
                                    log_error "  ❌ Port $port is still in use"
                                fi
                            else
                                log_error "  ❌ Failed to stop process $pid"
                            fi
                        else
                            log_error "  ❌ Could not determine process PID"
                        fi
                        ;;
                    2)
                        echo "  Process details:"
                        ss -tulpn 2>/dev/null | grep ":$port "
                        ps aux | grep "$process" | grep -v grep
                        ;;
                    3)
                        log_warn "  ⚠️  Skipping - manual resolution required"
                        ;;
                esac
                ;;
                
            *"Nginx"*"may need reconfiguration"*)
                echo "  Nginx service detected"
                
                if [[ "$INTERACTIVE" == "true" ]]; then
                    echo "  Options:"
                    echo "    1. Stop nginx service temporarily"
                    echo "    2. Keep nginx running (will reconfigure later)"
                    echo "    3. Skip this conflict"
                    read -p "  Select option (1-3): " choice
                else
                    choice=2
                    log_info "  Auto-selecting: Keep nginx running"
                fi
                
                case $choice in
                    1)
                        log_info "  Stopping nginx service..."
                        sudo systemctl stop nginx
                        log_info "  ✅ Nginx stopped"
                        ;;
                    2)
                        log_info "  ✅ Nginx will be reconfigured during deployment"
                        ;;
                    3)
                        log_warn "  ⚠️  Skipping - manual resolution required"
                        ;;
                esac
                ;;
                
            *"PostgreSQL"*"may conflict"*)
                echo "  PostgreSQL service detected"
                
                if [[ "$INTERACTIVE" == "true" ]]; then
                    echo "  Options:"
                    echo "    1. Keep PostgreSQL running (use local instead of RDS)"
                    echo "    2. Stop PostgreSQL service"
                    echo "    3. Skip this conflict"
                    read -p "  Select option (1-3): " choice
                else
                    choice=1
                    log_info "  Auto-selecting: Keep PostgreSQL running"
                fi
                
                case $choice in
                    1)
                        log_info "  ✅ PostgreSQL will be used as local database"
                        ;;
                    2)
                        log_info "  Stopping PostgreSQL service..."
                        sudo systemctl stop postgresql
                        log_info "  ✅ PostgreSQL stopped"
                        ;;
                    3)
                        log_warn "  ⚠️  Skipping - manual resolution required"
                        ;;
                esac
                ;;
                
            *"Node.js processes using ports"*)
                local ports=$(echo "$conflict" | grep -o "ports: [^"]*" | sed 's/ports: //')
                echo "  Node.js processes using ports: $ports"
                
                if [[ "$INTERACTIVE" == "true" ]]; then
                    echo "  Options:"
                    echo "    1. Stop all Node.js processes"
                    echo "    2. Stop only processes on conflicting ports"
                    echo "    3. View process details"
                    echo "    4. Skip this conflict"
                    read -p "  Select option (1-4): " choice
                else
                    choice=2
                    log_info "  Auto-selecting: Stop only processes on conflicting ports"
                fi
                
                case $choice in
                    1)
                        log_info "  Stopping all Node.js processes..."
                        sudo pkill -f node 2>/dev/null || true
                        if command -v pm2 &>/dev/null; then
                            pm2 stop all 2>/dev/null || true
                        fi
                        log_info "  ✅ All Node.js processes stopped"
                        ;;
                    2)
                        log_info "  Stopping processes on conflicting ports..."
                        for port in $(echo "$ports" | tr ' ' '\n'); do
                            local pid=$(ss -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d',' -f2 | cut -d'=' -f2)
                            if [[ -n "$pid" ]]; then
                                kill -TERM "$pid" 2>/dev/null || true
                            fi
                        done
                        log_info "  ✅ Conflicting processes stopped"
                        ;;
                    3)
                        echo "  Node.js process details:"
                        ps aux | grep node | grep -v grep
                        ;;
                    4)
                        log_warn "  ⚠️  Skipping - manual resolution required"
                        ;;
                esac
                ;;
        esac
    done
}

# Main resolution workflow
log_info "Starting conflict resolution..."

echo ""
echo "📋 CONFLICTS TO RESOLVE:"
echo "======================="
echo "Data conflicts: ${#DATA_CONFLICTS[@]}"
echo "Process conflicts: ${#PROCESS_CONFLICTS[@]}"
echo "Total: $TOTAL_CONFLICTS"

if [[ "$INTERACTIVE" == "true" ]]; then
    echo ""
    read -p "Proceed with conflict resolution? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        log_info "Conflict resolution cancelled by user"
        exit 0
    fi
fi

# Resolve conflicts
resolve_data_conflicts
resolve_process_conflicts

# Summary
echo ""
echo "✅ CONFLICT RESOLUTION COMPLETED"
echo "==============================="

if [[ -d "$BACKUP_DIR" ]]; then
    BACKUP_COUNT=$(find "$BACKUP_DIR" -type f 2>/dev/null | wc -l)
    if [[ "$BACKUP_COUNT" -gt 0 ]]; then
        log_info "📦 Created $BACKUP_COUNT backup files in: $BACKUP_DIR"
    fi
fi

echo ""
log_info "🔄 Running post-resolution system check..."
./check-system-dependencies.sh

if [[ $? -eq 0 ]]; then
    log_info "✅ System is now ready for RAS DASH deployment!"
    echo ""
    echo "NEXT STEPS:"
    echo "==========="
    echo "  1. Run: ./scripts/create-infrastructure.sh your-domain.com"
    echo "  2. Or run with resource reuse: ./scripts/create-infrastructure-with-reuse.sh your-domain.com"
else
    log_warn "⚠️  Some issues remain. Check the system dependencies report."
fi

log_info "Conflict resolution completed"