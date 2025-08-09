#!/bin/bash

# Dependency Installation Script for RAS DASH
# This script installs missing dependencies based on system check results

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/deployment-error-handler.sh"

log_info "🔧 RAS DASH Dependency Installation"

# Detect system and package manager
detect_system() {
    if [[ -f /etc/os-release ]]; then
        SYSTEM_OS=$(grep "^ID=" /etc/os-release | cut -d'=' -f2 | tr -d '"')
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        SYSTEM_OS="macos"
    else
        SYSTEM_OS="unknown"
    fi
    
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
    fi
    
    log_info "Detected system: $SYSTEM_OS with package manager: $PACKAGE_MANAGER"
}

# Update package lists
update_packages() {
    log_info "Updating package lists..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            sudo $PACKAGE_MANAGER update -y
            ;;
        "apt")
            sudo apt update
            ;;
        "brew")
            brew update
            ;;
        *)
            log_error "Unknown package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
}

# Install Node.js
install_nodejs() {
    log_info "Installing Node.js..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            # Install Node.js 20.x from NodeSource
            curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
            sudo $PACKAGE_MANAGER install -y nodejs
            ;;
        "apt")
            # Install Node.js 20.x from NodeSource
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "brew")
            brew install node
            ;;
        *)
            log_error "Cannot install Node.js with package manager: $PACKAGE_MANAGER"
            log_info "Please install Node.js manually from: https://nodejs.org/"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v node &>/dev/null && command -v npm &>/dev/null; then
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        log_info "✅ Node.js installed: $node_version"
        log_info "✅ npm installed: $npm_version"
        return 0
    else
        log_error "❌ Node.js installation failed"
        return 1
    fi
}

# Install Git
install_git() {
    log_info "Installing Git..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            sudo $PACKAGE_MANAGER install -y git
            ;;
        "apt")
            sudo apt-get install -y git
            ;;
        "brew")
            brew install git
            ;;
        *)
            log_error "Cannot install Git with package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v git &>/dev/null; then
        local git_version=$(git --version)
        log_info "✅ Git installed: $git_version"
        return 0
    else
        log_error "❌ Git installation failed"
        return 1
    fi
}

# Install AWS CLI
install_aws_cli() {
    log_info "Installing AWS CLI..."
    
    case $SYSTEM_OS in
        "amzn"|"rhel"|"centos"|"fedora")
            # Amazon Linux / RHEL / CentOS / Fedora
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            if command -v unzip &>/dev/null; then
                unzip awscliv2.zip
            else
                sudo $PACKAGE_MANAGER install -y unzip
                unzip awscliv2.zip
            fi
            sudo ./aws/install
            rm -rf awscliv2.zip aws/
            ;;
        "ubuntu"|"debian")
            # Ubuntu / Debian
            curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
            if ! command -v unzip &>/dev/null; then
                sudo apt-get install -y unzip
            fi
            unzip awscliv2.zip
            sudo ./aws/install
            rm -rf awscliv2.zip aws/
            ;;
        "macos")
            # macOS
            if [[ "$PACKAGE_MANAGER" == "brew" ]]; then
                brew install awscli
            else
                curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
                sudo installer -pkg AWSCLIV2.pkg -target /
                rm AWSCLIV2.pkg
            fi
            ;;
        *)
            log_error "Cannot install AWS CLI for system: $SYSTEM_OS"
            log_info "Please install AWS CLI manually from: https://aws.amazon.com/cli/"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v aws &>/dev/null; then
        local aws_version=$(aws --version)
        log_info "✅ AWS CLI installed: $aws_version"
        return 0
    else
        log_error "❌ AWS CLI installation failed"
        return 1
    fi
}

# Install jq
install_jq() {
    log_info "Installing jq..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            sudo $PACKAGE_MANAGER install -y jq
            ;;
        "apt")
            sudo apt-get install -y jq
            ;;
        "brew")
            brew install jq
            ;;
        *)
            log_error "Cannot install jq with package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v jq &>/dev/null; then
        local jq_version=$(jq --version)
        log_info "✅ jq installed: $jq_version"
        return 0
    else
        log_error "❌ jq installation failed"
        return 1
    fi
}

# Install curl
install_curl() {
    log_info "Installing curl..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            sudo $PACKAGE_MANAGER install -y curl
            ;;
        "apt")
            sudo apt-get install -y curl
            ;;
        "brew")
            brew install curl
            ;;
        *)
            log_error "Cannot install curl with package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v curl &>/dev/null; then
        local curl_version=$(curl --version | head -1)
        log_info "✅ curl installed: $curl_version"
        return 0
    else
        log_error "❌ curl installation failed"
        return 1
    fi
}

# Install PM2 globally
install_pm2() {
    log_info "Installing PM2..."
    
    if command -v npm &>/dev/null; then
        sudo npm install -g pm2
        
        # Verify installation
        if command -v pm2 &>/dev/null; then
            local pm2_version=$(pm2 --version)
            log_info "✅ PM2 installed: $pm2_version"
            return 0
        else
            log_error "❌ PM2 installation failed"
            return 1
        fi
    else
        log_error "❌ Cannot install PM2: npm not available"
        return 1
    fi
}

# Install Nginx
install_nginx() {
    log_info "Installing Nginx..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            sudo $PACKAGE_MANAGER install -y nginx
            ;;
        "apt")
            sudo apt-get install -y nginx
            ;;
        "brew")
            brew install nginx
            ;;
        *)
            log_error "Cannot install Nginx with package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v nginx &>/dev/null; then
        local nginx_version=$(nginx -v 2>&1)
        log_info "✅ Nginx installed: $nginx_version"
        
        # Enable and start nginx (on systemd systems)
        if command -v systemctl &>/dev/null; then
            sudo systemctl enable nginx
            sudo systemctl start nginx
            log_info "✅ Nginx service enabled and started"
        fi
        
        return 0
    else
        log_error "❌ Nginx installation failed"
        return 1
    fi
}

# Install Certbot
install_certbot() {
    log_info "Installing Certbot..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            sudo $PACKAGE_MANAGER install -y python3 python3-pip
            sudo pip3 install certbot certbot-dns-route53
            ;;
        "apt")
            sudo apt-get install -y python3 python3-pip
            sudo pip3 install certbot certbot-dns-route53
            ;;
        "brew")
            brew install certbot
            pip3 install certbot-dns-route53
            ;;
        *)
            log_error "Cannot install Certbot with package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v certbot &>/dev/null; then
        local certbot_version=$(certbot --version)
        log_info "✅ Certbot installed: $certbot_version"
        return 0
    else
        log_error "❌ Certbot installation failed"
        return 1
    fi
}

# Install PostgreSQL client
install_postgresql() {
    log_info "Installing PostgreSQL client..."
    
    case $PACKAGE_MANAGER in
        "dnf"|"yum")
            sudo $PACKAGE_MANAGER install -y postgresql postgresql-contrib
            ;;
        "apt")
            sudo apt-get install -y postgresql-client postgresql-contrib
            ;;
        "brew")
            brew install postgresql
            ;;
        *)
            log_error "Cannot install PostgreSQL with package manager: $PACKAGE_MANAGER"
            return 1
            ;;
    esac
    
    # Verify installation
    if command -v psql &>/dev/null; then
        local psql_version=$(psql --version)
        log_info "✅ PostgreSQL client installed: $psql_version"
        return 0
    else
        log_error "❌ PostgreSQL installation failed"
        return 1
    fi
}

# Main installation workflow
main() {
    local failed_installs=()
    local success_count=0
    local total_count=0
    
    log_info "Starting dependency installation..."
    
    # Initialize
    detect_system
    
    if [[ "$PACKAGE_MANAGER" == "unknown" ]]; then
        log_error "Cannot proceed without a supported package manager"
        exit 1
    fi
    
    # Update package lists
    if ! update_packages; then
        log_warn "Package list update failed, but continuing..."
    fi
    
    # Define installation functions to run
    declare -a installations=(
        "install_nodejs:Node.js and npm"
        "install_git:Git"
        "install_aws_cli:AWS CLI"
        "install_jq:jq JSON processor"
        "install_curl:curl"
        "install_pm2:PM2 process manager"
        "install_nginx:Nginx web server"
        "install_certbot:Certbot SSL certificates"
        "install_postgresql:PostgreSQL client"
    )
    
    # Check what's already installed
    log_info "Checking current installation status..."
    
    # Skip already installed software
    declare -a needed_installations=()
    
    for install_spec in "${installations[@]}"; do
        local func_name="${install_spec%:*}"
        local description="${install_spec#*:}"
        local command_name=""
        
        case "$func_name" in
            "install_nodejs") command_name="node" ;;
            "install_git") command_name="git" ;;
            "install_aws_cli") command_name="aws" ;;
            "install_jq") command_name="jq" ;;
            "install_curl") command_name="curl" ;;
            "install_pm2") command_name="pm2" ;;
            "install_nginx") command_name="nginx" ;;
            "install_certbot") command_name="certbot" ;;
            "install_postgresql") command_name="psql" ;;
        esac
        
        if command -v "$command_name" &>/dev/null; then
            log_info "✅ $description: already installed"
        else
            log_info "❌ $description: needs installation"
            needed_installations+=("$install_spec")
        fi
    done
    
    if [[ ${#needed_installations[@]} -eq 0 ]]; then
        log_info "✅ All dependencies are already installed!"
        exit 0
    fi
    
    log_info "Need to install ${#needed_installations[@]} dependencies"
    
    # Install needed dependencies
    for install_spec in "${needed_installations[@]}"; do
        local func_name="${install_spec%:*}"
        local description="${install_spec#*:}"
        
        total_count=$((total_count + 1))
        
        log_info "Installing $description..."
        
        if $func_name; then
            log_info "✅ $description installation completed"
            success_count=$((success_count + 1))
        else
            log_error "❌ $description installation failed"
            failed_installs+=("$description")
        fi
        
        echo ""
    done
    
    # Summary
    echo ""
    echo "============================================"
    echo "     DEPENDENCY INSTALLATION SUMMARY"
    echo "============================================"
    echo "Total attempted: $total_count"
    echo "Successful: $success_count"
    echo "Failed: ${#failed_installs[@]}"
    
    if [[ ${#failed_installs[@]} -gt 0 ]]; then
        echo ""
        echo "FAILED INSTALLATIONS:"
        echo "===================="
        for failed in "${failed_installs[@]}"; do
            echo "  ❌ $failed"
        done
        
        echo ""
        echo "MANUAL INSTALLATION REQUIRED:"
        echo "============================="
        for failed in "${failed_installs[@]}"; do
            case "$failed" in
                *"Node.js"*)
                    echo "  Node.js: https://nodejs.org/en/download/"
                    ;;
                *"AWS CLI"*)
                    echo "  AWS CLI: https://aws.amazon.com/cli/"
                    ;;
                *"Git"*)
                    echo "  Git: https://git-scm.com/downloads"
                    ;;
                *)
                    echo "  $failed: Check official documentation"
                    ;;
            esac
        done
    fi
    
    if [[ $success_count -eq $total_count ]]; then
        log_info "🎉 All dependencies installed successfully!"
        echo ""
        echo "NEXT STEPS:"
        echo "==========="
        echo "  1. Configure AWS credentials: aws configure"
        echo "  2. Run system check: ./scripts/check-system-dependencies.sh"
        echo "  3. Start deployment: ./scripts/create-infrastructure.sh your-domain.com"
        
        exit 0
    else
        log_warn "⚠️  Some dependencies failed to install"
        echo ""
        echo "NEXT STEPS:"
        echo "==========="
        echo "  1. Manually install failed dependencies (see above)"
        echo "  2. Run system check: ./scripts/check-system-dependencies.sh"
        echo "  3. Re-run this script if needed"
        
        exit 1
    fi
}

# Run main function
main "$@"