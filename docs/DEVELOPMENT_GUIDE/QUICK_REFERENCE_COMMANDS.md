# Quick Reference Commands

## 🚀 **Daily Development Commands**

### **Project Setup (One-time)**
```bash
# Clone repository
git clone git@gitlab.com:your-organization/cypher.git
cd cypher

# Install dependencies
cd api && npm install
cd ../client && npm install
cd ..

# Setup environment
cp api/.env.example api/.env
cp client/.env.example client/.env

# Start development
npm run dev
```

### **Daily Workflow**
```bash
# Morning routine
git checkout main
git pull origin main
git checkout -b feature/your-feature
npm run dev

# Development cycle
git add .
git commit -m "feat: your changes"
git push origin feature/your-feature

# End of day
# Create merge request on GitLab
```

## 🔧 **NPM Commands**

### **Root Level**
```bash
npm run dev          # Start both API and Client
npm install          # Install all dependencies
npm test             # Run all tests
npm run lint         # Lint all code
npm run format       # Format all code
```

### **API Commands (from /api)**
```bash
npm run dev          # Start API server (port 3001)
npm start            # Production server
npm test             # Run API tests
npm run migrate      # Run database migrations
npm run seed         # Seed database
npm run lint         # Lint API code
npm run format       # Format API code
```

### **Client Commands (from /client)**
```bash
npm run dev          # Start client server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run client tests
npm run lint         # Lint client code
npm run format       # Format client code
```

## 📦 **Git Commands**

### **Branch Management**
```bash
git branch                    # List local branches
git branch -a                 # List all branches
git checkout main             # Switch to main
git checkout -b feature/name  # Create and switch to new branch
git branch -d branch-name     # Delete local branch
git push origin --delete branch-name  # Delete remote branch
```

### **Working with Changes**
```bash
git status                    # Check status
git diff                      # View changes
git add .                     # Stage all changes
git add filename              # Stage specific file
git commit -m "message"       # Commit with message
git push origin branch-name   # Push to remote
git pull origin main          # Pull from main
```

### **Merge Request Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/user-auth

# 2. Make changes and commit
git add .
git commit -m "feat: implement user authentication"

# 3. Push to GitLab
git push -u origin feature/user-auth

# 4. Create MR on GitLab web interface
# 5. After merge, cleanup
git checkout main
git pull origin main
git branch -d feature/user-auth
```

## 🔍 **Troubleshooting Commands**

### **Common Issues**
```bash
# Port already in use
lsof -i :3000                 # Find process (macOS/Linux)
netstat -ano | findstr :3000  # Find process (Windows)
kill -9 PID                   # Kill process (macOS/Linux)
taskkill /PID PID /F          # Kill process (Windows)

# NPM issues
npm cache clean --force       # Clear npm cache
rm -rf node_modules package-lock.json  # Clean install
npm install                   # Reinstall

# Git issues
git reset --hard HEAD         # Reset local changes
git clean -fd                 # Clean untracked files
git pull origin main          # Sync with remote
```

### **Database Issues**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432

# Connect to database
psql -h localhost -U postgres -d cypher_dev

# Reset database (if needed)
cd api
npm run db:reset
npm run migrate
npm run seed
```

## 🧪 **Testing Commands**

### **Run Tests**
```bash
# All tests
npm test

# API tests only
cd api && npm test

# Client tests only
cd client && npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### **Linting & Formatting**
```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check specific files
npx eslint src/components/Component.jsx
npx prettier --check src/components/Component.jsx
```

## 🏗️ **CYPHER-Specific Commands**

### **Production Database (AWS RDS)**
```bash
# Connect to production database
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1"

# Check RDS instance status
aws rds describe-db-instances \
  --db-instance-identifier rasdash-dev-public \
  --region us-east-1

# Create database backup
pg_dump "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1" > backup_$(date +%Y%m%d).sql

# Monitor RDS performance
aws rds describe-db-log-files \
  --db-instance-identifier rasdash-dev-public \
  --region us-east-1
```

### **EC2 Instance Management**
```bash
# Check CYPHER EC2 instance (Windows Server 2019)
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --region us-east-1

# Start/Stop EC2 instance
aws ec2 start-instances --instance-ids i-04a41343a3f51559a
aws ec2 stop-instances --instance-ids i-04a41343a3f51559a

# Get instance public IP
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text

# Connect to EC2 instance (if SSH is configured)
ssh -i your-key.pem ec2-user@$(aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)
```

### **Route53 Domain Management**
```bash
# List CYPHER hosted zones
aws route53 list-hosted-zones \
  --query 'HostedZones[?contains(Name, `cypher`) || contains(Name, `rasdash`)]'

# Get domain records
aws route53 list-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --query 'ResourceRecordSets[?Type==`A`]'

# Check domain resolution
nslookup your-domain.com
dig your-domain.com
```

### **S3 Bucket Operations**
```bash
# List CYPHER-related buckets
aws s3 ls | grep -i cypher
aws s3 ls | grep -i rasdash

# Upload deployment files
aws s3 sync ./client/dist s3://your-cypher-bucket/
aws s3 sync ./api s3://your-cypher-api-bucket/ --exclude node_modules

# Set bucket permissions (if needed)
aws s3api put-bucket-policy \
  --bucket your-cypher-bucket \
  --policy file://bucket-policy.json
```

## 🌐 **API Testing**

### **cURL Commands**
```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Get systems (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/systems

# Test specific endpoint
curl -X GET http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### **PostgreSQL Commands**
```bash
# Connect to database
psql -h localhost -U postgres -d cypher_dev
psql "$DATABASE_URL"  # Using connection string

# Database management
createdb cypher_dev -U postgres     # Create database
dropdb cypher_dev -U postgres       # Delete database
pg_dump cypher_dev > backup.sql     # Backup database
psql cypher_dev < backup.sql        # Restore database

# Common psql commands
\l                            # List databases
\dt                           # List tables
\d table_name                 # Describe table
\du                           # List users
\c database_name              # Connect to database
\q                            # Quit

# Common queries
SELECT * FROM users LIMIT 5;         # Query data
SELECT version();                     # PostgreSQL version
SELECT current_database();           # Current database
SELECT count(*) FROM table_name;     # Count records

# User management
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE cypher_dev TO username;
ALTER USER username WITH SUPERUSER;
DROP USER username;
```

### **AWS CLI Commands**
```bash
# Configuration
aws configure                         # Setup credentials
aws configure list                    # Show current config
aws configure list-profiles           # List profiles
aws sts get-caller-identity          # Verify credentials

# S3 Commands
aws s3 ls                            # List buckets
aws s3 ls s3://bucket-name/          # List bucket contents
aws s3 cp file.txt s3://bucket/      # Upload file
aws s3 cp s3://bucket/file.txt .     # Download file
aws s3 sync ./folder s3://bucket/    # Sync folder

# RDS Commands
aws rds describe-db-instances        # List RDS instances
aws rds describe-db-instances \
  --db-instance-identifier instance-name
aws rds start-db-instance \
  --db-instance-identifier instance-name
aws rds stop-db-instance \
  --db-instance-identifier instance-name

# EC2 Commands
aws ec2 describe-instances           # List EC2 instances
aws ec2 describe-instances \
  --instance-ids i-1234567890abcdef0
aws ec2 start-instances \
  --instance-ids i-1234567890abcdef0
aws ec2 stop-instances \
  --instance-ids i-1234567890abcdef0

# Route53 Commands
aws route53 list-hosted-zones        # List hosted zones
aws route53 list-resource-record-sets \
  --hosted-zone-id Z123456789

# IAM Commands
aws iam get-user                     # Current user info
aws iam list-users                   # List users
aws iam list-roles                   # List roles
```

## 🔧 **Environment Commands**

### **Check Versions**
```bash
node --version               # Node.js version
npm --version                # NPM version
git --version                # Git version
psql --version               # PostgreSQL version
```

### **Environment Variables**
```bash
# Check environment
echo $NODE_ENV
echo $DATABASE_URL

# Load environment (if needed)
source .env
export $(cat .env | xargs)
```

## 📱 **Browser Testing**

### **URLs to Test**
```bash
# Development URLs
http://localhost:3000         # Client application
http://localhost:3001         # API server
http://localhost:3001/health  # API health check
http://localhost:3001/api/v1  # API base URL

# Test pages
http://localhost:3000/login
http://localhost:3000/admin/permissions
http://localhost:3000/systems
```

### **Browser DevTools**
```bash
F12                          # Open DevTools
Ctrl+Shift+I                 # Open DevTools (alternative)
Ctrl+Shift+C                 # Inspect element
Ctrl+Shift+J                 # Open Console
Ctrl+Shift+R                 # Hard refresh
```

## 🚨 **Emergency Commands**

### **Reset Everything**
```bash
# Nuclear option - reset everything
git checkout main
git reset --hard origin/main
git clean -fd
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### **Quick Fix Workflow**
```bash
# For urgent fixes
git checkout main
git pull origin main
git checkout -b hotfix/urgent-fix
# Make minimal changes
git add .
git commit -m "fix: urgent issue description"
git push origin hotfix/urgent-fix
# Create MR immediately
```

## 📋 **Commit Message Templates**

### **Conventional Commits**
```bash
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance

# Examples
git commit -m "feat: implement user authentication"
git commit -m "fix: resolve login token expiry issue"
git commit -m "docs: update API documentation"
git commit -m "refactor: optimize database queries"
```

## 🔗 **Useful Aliases (Optional)**

### **Git Aliases**
```bash
# Add to ~/.gitconfig
[alias]
    st = status
    co = checkout
    br = branch
    cm = commit -m
    ps = push
    pl = pull
    lg = log --oneline --graph --decorate
```

### **Shell Aliases**
```bash
# Add to ~/.bashrc or ~/.zshrc
alias gst='git status'
alias gco='git checkout'
alias gcm='git commit -m'
alias gps='git push'
alias gpl='git pull'
alias nrd='npm run dev'
alias nrt='npm run test'
alias nrl='npm run lint'
```

---

**Print this page for quick reference!** 📄  
**Last Updated:** December 2024
