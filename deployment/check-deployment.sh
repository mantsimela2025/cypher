#!/bin/bash
# Deployment Status Check Script for CYPHER Application
# This script checks the status of all environments and services

set -e

echo "🔍 CYPHER Application Deployment Status Check"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check HTTP status
check_http_status() {
    local url=$1
    local name=$2
    
    echo -n "Checking $name... "
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $status_code)"
    elif [ "$status_code" = "000" ]; then
        echo -e "${RED}❌ UNREACHABLE${NC}"
    else
        echo -e "${YELLOW}⚠️ WARNING${NC} (HTTP $status_code)"
    fi
}

# Function to check service status
check_service_status() {
    local service=$1
    local name=$2
    
    echo -n "Checking $name service... "
    
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✅ RUNNING${NC}"
    else
        echo -e "${RED}❌ STOPPED${NC}"
    fi
}

# Function to check port
check_port() {
    local port=$1
    local name=$2
    
    echo -n "Checking $name port $port... "
    
    if netstat -tlnp 2>/dev/null | grep -q ":$port "; then
        echo -e "${GREEN}✅ LISTENING${NC}"
    else
        echo -e "${RED}❌ NOT LISTENING${NC}"
    fi
}

echo -e "${BLUE}🌐 DNS & HTTP Status:${NC}"
echo "------------------------"
check_http_status "http://rasdash.dev.com/health" "Production API"
check_http_status "http://staging.rasdash.dev.com/health" "Staging API"
check_http_status "http://dev.rasdash.dev.com/health" "Development API"
check_http_status "http://rasdash.dev.com" "Production Frontend"
check_http_status "http://staging.rasdash.dev.com" "Staging Frontend"
check_http_status "http://dev.rasdash.dev.com" "Development Frontend"

echo ""
echo -e "${BLUE}⚙️ Service Status:${NC}"
echo "-------------------"
check_service_status "cypher-api" "Production API"
check_service_status "cypher-client" "Production Client"
check_service_status "cypher-staging-api" "Staging API"
check_service_status "cypher-staging-client" "Staging Client"
check_service_status "cypher-dev-api" "Development API"
check_service_status "cypher-dev-client" "Development Client"
check_service_status "nginx" "Nginx"

echo ""
echo -e "${BLUE}🔌 Port Status:${NC}"
echo "----------------"
check_port "3001" "Production API"
check_port "3002" "Staging API"
check_port "3003" "Development API"
check_port "80" "HTTP"
check_port "443" "HTTPS"

echo ""
echo -e "${BLUE}💾 Database Connectivity:${NC}"
echo "---------------------------"
echo -n "Testing database connection... "

# Test database connection
cd /opt/cypher/api 2>/dev/null || cd /home/ec2-user

if node -e "
const { testConnection } = require('./src/db');
testConnection().then(() => process.exit(0)).catch(() => process.exit(1));
" 2>/dev/null; then
    echo -e "${GREEN}✅ CONNECTED${NC}"
else
    echo -e "${RED}❌ CONNECTION FAILED${NC}"
fi

echo ""
echo -e "${BLUE}📊 System Resources:${NC}"
echo "---------------------"

# Check disk space
echo -n "Disk usage: "
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 80 ]; then
    echo -e "${GREEN}$disk_usage%${NC}"
elif [ "$disk_usage" -lt 90 ]; then
    echo -e "${YELLOW}$disk_usage%${NC}"
else
    echo -e "${RED}$disk_usage%${NC}"
fi

# Check memory usage
echo -n "Memory usage: "
mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$mem_usage" -lt 80 ]; then
    echo -e "${GREEN}$mem_usage%${NC}"
elif [ "$mem_usage" -lt 90 ]; then
    echo -e "${YELLOW}$mem_usage%${NC}"
else
    echo -e "${RED}$mem_usage%${NC}"
fi

# Check load average
echo -n "Load average: "
load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
echo -e "${BLUE}$load_avg${NC}"

echo ""
echo -e "${BLUE}📝 Recent Logs (last 5 lines):${NC}"
echo "--------------------------------"

echo -e "${YELLOW}Production API:${NC}"
sudo journalctl -u cypher-api -n 5 --no-pager 2>/dev/null | tail -5 || echo "No logs available"

echo ""
echo -e "${YELLOW}Staging API:${NC}"
sudo journalctl -u cypher-staging-api -n 5 --no-pager 2>/dev/null | tail -5 || echo "No logs available"

echo ""
echo -e "${YELLOW}Development API:${NC}"
sudo journalctl -u cypher-dev-api -n 5 --no-pager 2>/dev/null | tail -5 || echo "No logs available"

echo ""
echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "---------------"
echo "Production:  http://rasdash.dev.com"
echo "Staging:     http://staging.rasdash.dev.com"
echo "Development: http://dev.rasdash.dev.com"

echo ""
echo -e "${BLUE}📋 Useful Commands:${NC}"
echo "-------------------"
echo "View logs:           sudo journalctl -u cypher-api -f"
echo "Restart service:     sudo systemctl restart cypher-api"
echo "Check service:       sudo systemctl status cypher-api"
echo "Test database:       cd /opt/cypher/api && node -e \"require('./src/db').testConnection()\""
echo "Note: Using existing AWS RDS database - no migrations needed"

echo ""
echo "✅ Status check completed!"
