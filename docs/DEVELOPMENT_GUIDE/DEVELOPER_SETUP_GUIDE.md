# Developer Setup Guide

## 🎯 Overview

This comprehensive guide helps new developers set up their development environment for the CYPHER application, including all dependencies, GitLab workflow, and development commands.

## 📋 Table of Contents

1. [Prerequisites & Dependencies](#prerequisites--dependencies)
2. [Development Environment Setup](#development-environment-setup)
3. [GitLab Repository Setup](#gitlab-repository-setup)
4. [Project Setup & Installation](#project-setup--installation)
5. [Development Workflow](#development-workflow)
6. [GitLab Workflow & Commands](#gitlab-workflow--commands)
7. [NPM Commands Reference](#npm-commands-reference)
8. [Environment Configuration](#environment-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## 🛠️ Prerequisites & Dependencies

### **Required Software**

#### **1. Node.js & NPM**
```bash
# Install Node.js v20.16.0 or higher
# Download from: https://nodejs.org/

# Verify installation
node --version  # Should show v20.16.0+
npm --version   # Should show 10.0.0+
```

#### **2. Git**
```bash
# Install Git
# Download from: https://git-scm.com/

# Verify installation
git --version  # Should show 2.40.0+

# Configure Git (replace with your info)
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"
```

#### **3. Code Editor**
**Recommended: Visual Studio Code**
- Download from: https://code.visualstudio.com/
- **Required Extensions:**
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
  - GitLens — Git supercharged
  - Auto Rename Tag
  - Bracket Pair Colorizer
  - Thunder Client (for API testing)

#### **4. Database - PostgreSQL 14+**
```bash
# Option 1: Download and install PostgreSQL
# Download from: https://www.postgresql.org/download/

# Option 2: Use Docker (Recommended for development)
docker run --name cypher-postgres \
  -e POSTGRES_DB=cypher_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=yourpassword \
  -p 5432:5432 \
  -d postgres:14

# Option 3: Use package managers
# macOS with Homebrew:
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian:
sudo apt update
sudo apt install postgresql-14 postgresql-client-14

# Windows: Use the installer from postgresql.org
```

#### **5. AWS CLI**
```bash
# Install AWS CLI v2
# Download from: https://aws.amazon.com/cli/

# macOS:
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Linux:
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows: Download and run the MSI installer

# Verify installation
aws --version  # Should show aws-cli/2.x.x
```

#### **5. Additional Tools**
- **Postman** or **Thunder Client** - API testing
- **GitLab CLI** (optional) - Enhanced GitLab integration
- **Docker** (optional) - For containerized development

### **System Requirements**
- **OS**: Windows 10+, macOS 10.15+, or Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 5GB free space minimum
- **Network**: Stable internet connection

## 🔧 Development Environment Setup

### **1. VS Code Configuration**

Create `.vscode/settings.json` in your project root:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "files.associations": {
    "*.jsx": "javascriptreact"
  }
}
```

### **2. VS Code Extensions Setup**
```bash
# Install recommended extensions
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension eamodio.gitlens
code --install-extension formulahendry.auto-rename-tag
code --install-extension rangav.vscode-thunder-client
```

## 📦 GitLab Repository Setup

### **1. GitLab Account Setup**
1. **Create GitLab Account** (if not already done)
2. **Add SSH Key** to your GitLab account:
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@company.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitLab: Profile → SSH Keys → Add Key
```

### **2. Repository Access**
```bash
# Test GitLab connection
ssh -T git@gitlab.com

# Should return: Welcome to GitLab, @username!
```

### **3. Clone Repository**
```bash
# Clone the CYPHER repository
git clone git@gitlab.com:your-organization/cypher.git

# Navigate to project directory
cd cypher

# Verify repository
git remote -v
```

## 🚀 Project Setup & Installation

### **1. Initial Setup**
```bash
# Navigate to project root
cd cypher

# Install root dependencies (if any)
npm install

# Install API dependencies
cd api
npm install

# Install Client dependencies
cd ../client
npm install

# Return to project root
cd ..
```

### **2. Environment Configuration**
```bash
# Copy environment templates
cp api/.env.example api/.env
cp client/.env.example client/.env

# Edit environment files with your settings
# See Environment Configuration section below
```

### **3. PostgreSQL Database Setup**

#### **3.1 Start PostgreSQL Service**
```bash
# Windows: Start PostgreSQL service
# Method 1: Services Manager
services.msc → PostgreSQL → Start

# Method 2: Command line (as Administrator)
net start postgresql-x64-14

# macOS: Start PostgreSQL
brew services start postgresql@14
# Or manually:
pg_ctl -D /usr/local/var/postgres start

# Linux: Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Auto-start on boot

# Docker: Start PostgreSQL container
docker start cypher-postgres
# Or create new container:
docker run --name cypher-postgres \
  -e POSTGRES_DB=cypher_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=RasDash2025$ \
  -p 5432:5432 \
  -d postgres:14
```

#### **3.2 Database Configuration**
```bash
# Connect to PostgreSQL as superuser
psql -U postgres -h localhost

# Create development database
CREATE DATABASE cypher_dev;
CREATE DATABASE cypher_test;  -- For testing

# Create application user (optional but recommended)
CREATE USER cypher_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cypher_dev TO cypher_user;
GRANT ALL PRIVILEGES ON DATABASE cypher_test TO cypher_user;

# Exit psql
\q
```

#### **3.3 Verify Database Connection**
```bash
# Test connection with default user
psql -h localhost -U postgres -d cypher_dev

# Test connection with application user
psql -h localhost -U cypher_user -d cypher_dev

# Test connection string (matches your existing config)
psql "postgresql://rasdashadmin:RasDash2025%24@rasdash-dev-public.cexgrlslydeh.us-east-1.rds.amazonaws.com:5432/rasdashdevo1"
```

#### **3.4 Run Database Migrations**
```bash
cd api

# Install database dependencies
npm install

# Run migrations (if available)
npm run migrate
# Or alternative commands:
npm run db:setup
npm run db:migrate

# Seed database with initial data
npm run seed
npm run db:seed

# Reset database (if needed)
npm run db:reset
```

### **4. AWS CLI Setup & Configuration**

#### **4.1 AWS CLI Installation Verification**
```bash
# Verify AWS CLI installation
aws --version
# Should show: aws-cli/2.x.x Python/3.x.x

# Check AWS CLI location
which aws  # macOS/Linux
where aws   # Windows
```

#### **4.2 AWS Credentials Configuration**
```bash
# Configure AWS credentials (Interactive)
aws configure

# You'll be prompted for:
# AWS Access Key ID: [Your Access Key]
# AWS Secret Access Key: [Your Secret Key]
# Default region name: us-east-1
# Default output format: json

# Alternative: Set environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1

# Windows PowerShell:
$env:AWS_ACCESS_KEY_ID="your-access-key"
$env:AWS_SECRET_ACCESS_KEY="your-secret-key"
$env:AWS_DEFAULT_REGION="us-east-1"
```

#### **4.3 AWS Profile Configuration (Recommended)**
```bash
# Configure multiple profiles
aws configure --profile cypher-dev
aws configure --profile cypher-prod

# List configured profiles
aws configure list-profiles

# Use specific profile
aws s3 ls --profile cypher-dev
export AWS_PROFILE=cypher-dev  # Set default profile
```

#### **4.4 Verify AWS Configuration**
```bash
# Test AWS connection
aws sts get-caller-identity

# Should return:
# {
#     "UserId": "AIDACKCEVSQ6C2EXAMPLE",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/username"
# }

# Test S3 access
aws s3 ls

# Test RDS access (if applicable)
aws rds describe-db-instances --region us-east-1
```

#### **4.5 CYPHER-Specific AWS Resources**
```bash
# Check Route53 domains
aws route53 list-hosted-zones

# Check S3 buckets
aws s3 ls
aws s3 ls s3://your-cypher-bucket/

# Check RDS instances
aws rds describe-db-instances \
  --db-instance-identifier rasdash-dev-public \
  --region us-east-1

# Check EC2 instances (for deployment)
aws ec2 describe-instances \
  --instance-ids i-04a41343a3f51559a \
  --region us-east-1
```

#### **4.6 AWS CLI Configuration Files**
```bash
# AWS credentials file location:
# ~/.aws/credentials (macOS/Linux)
# %USERPROFILE%\.aws\credentials (Windows)

# Example credentials file:
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY

[cypher-dev]
aws_access_key_id = DEV_ACCESS_KEY
aws_secret_access_key = DEV_SECRET_KEY

[cypher-prod]
aws_access_key_id = PROD_ACCESS_KEY
aws_secret_access_key = PROD_SECRET_KEY

# AWS config file (~/.aws/config):
[default]
region = us-east-1
output = json

[profile cypher-dev]
region = us-east-1
output = json

[profile cypher-prod]
region = us-east-1
output = json
```

### **5. Verify Installation**
```bash
# Test API server
cd api
npm run dev
# Should start on http://localhost:3001

# Test Client (in new terminal)
cd client
npm run dev
# Should start on http://localhost:3000

# Test full stack (in project root)
npm run dev
# Should start both API and Client
```

## 🔄 Development Workflow

### **Daily Development Process**

#### **1. Start Development Session**
```bash
# Pull latest changes
git pull origin main

# Check current branch
git branch

# Start development servers
npm run dev
```

#### **2. Feature Development**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code development ...

# Check status
git status

# Stage changes
git add .

# Commit changes
git commit -m "feat: add new feature description"

# Push to GitLab
git push origin feature/your-feature-name
```

#### **3. Code Review & Merge**
1. **Create Merge Request** on GitLab
2. **Request Code Review** from team members
3. **Address Review Comments** if any
4. **Merge to Main** after approval

## 📚 GitLab Workflow & Commands

### **Branch Management**
```bash
# List all branches
git branch -a

# Create new branch
git checkout -b feature/new-feature

# Switch branches
git checkout main
git checkout feature/existing-feature

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature
```

### **Working with Changes**
```bash
# Check status
git status

# View differences
git diff
git diff --staged

# Stage specific files
git add filename.js
git add src/components/

# Stage all changes
git add .

# Unstage files
git reset filename.js

# Commit with message
git commit -m "type: description"

# Amend last commit
git commit --amend -m "updated message"
```

### **Synchronizing with Remote**
```bash
# Fetch latest changes
git fetch origin

# Pull changes from main
git pull origin main

# Push current branch
git push origin branch-name

# Push new branch
git push -u origin new-branch-name

# Force push (use carefully)
git push --force-with-lease origin branch-name
```

### **Merge Request Workflow**
```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Make changes and commit
git add .
git commit -m "feat: implement user authentication"

# 3. Push to GitLab
git push -u origin feature/user-authentication

# 4. Create Merge Request on GitLab web interface
# 5. After approval, merge and delete branch
git checkout main
git pull origin main
git branch -d feature/user-authentication
```

### **Commit Message Conventions**
```bash
# Format: type: description

# Types:
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks

# Examples:
git commit -m "feat: add user login functionality"
git commit -m "fix: resolve authentication token expiry"
git commit -m "docs: update API documentation"
git commit -m "refactor: optimize database queries"
```

## 📦 NPM Commands Reference

### **Root Level Commands**
```bash
# Start both API and Client
npm run dev

# Install all dependencies
npm install

# Clean install (removes node_modules first)
npm ci

# Update dependencies
npm update

# Check for security vulnerabilities
npm audit
npm audit fix
```

### **API Commands (from /api directory)**
```bash
# Development server with hot reload
npm run dev

# Production server
npm start

# Run tests
npm test
npm run test:watch

# Database operations
npm run migrate
npm run seed
npm run db:reset

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Build for production
npm run build
```

### **Client Commands (from /client directory)**
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
npm run test:coverage

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Type checking (if using TypeScript)
npm run type-check
```

### **Useful NPM Commands**
```bash
# Install specific package
npm install package-name
npm install --save-dev package-name

# Uninstall package
npm uninstall package-name

# List installed packages
npm list
npm list --depth=0

# Check outdated packages
npm outdated

# Clear npm cache
npm cache clean --force

# View package information
npm info package-name

# Run specific script
npm run script-name
```

## ⚙️ Environment Configuration

### **API Environment (.env)**
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/cypher_dev
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cypher_dev
DB_USER=postgres
DB_PASSWORD=yourpassword

# Server Configuration
PORT=3001
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# External APIs (if any)
API_KEY=your-api-key-here
```

### **Client Environment (.env)**
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_API_TIMEOUT=10000

# Application Configuration
VITE_APP_NAME=CYPHER
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=development

# Feature Flags (optional)
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. Node Version Issues**
```bash
# Check Node version
node --version

# If wrong version, install correct version
# Use nvm (Node Version Manager)
nvm install 20.16.0
nvm use 20.16.0
```

#### **2. Port Already in Use**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 PID  # macOS/Linux
taskkill /PID PID /F  # Windows
```

#### **3. Database Connection Issues**
```bash
# Check PostgreSQL status
pg_isready -h localhost -p 5432
# Should return: localhost:5432 - accepting connections

# Check if PostgreSQL is running
# Windows:
tasklist | findstr postgres
net start postgresql-x64-14

# macOS:
brew services list | grep postgresql
brew services restart postgresql@14

# Linux:
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Docker:
docker ps | grep postgres
docker start cypher-postgres

# Test database connection
psql -h localhost -U postgres -d cypher_dev -c "SELECT version();"

# Check database exists
psql -h localhost -U postgres -c "\l" | grep cypher

# Reset database connection (if needed)
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'cypher_dev';"
```

#### **4. AWS CLI Issues**
```bash
# Check AWS CLI installation
aws --version
which aws  # Should show path to aws binary

# Test AWS credentials
aws sts get-caller-identity
# If this fails, reconfigure:
aws configure

# Check AWS configuration
aws configure list
cat ~/.aws/credentials
cat ~/.aws/config

# Test specific AWS services
aws s3 ls  # Test S3 access
aws rds describe-db-instances --region us-east-1  # Test RDS access

# Clear AWS credentials (if needed)
rm ~/.aws/credentials
rm ~/.aws/config
aws configure  # Reconfigure

# Debug AWS CLI issues
aws s3 ls --debug  # Verbose output
aws configure list-profiles  # List all profiles
```

#### **5. Environment Variables Issues**
```bash
# Check environment variables
echo $DATABASE_URL
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_DEFAULT_REGION

# Windows PowerShell:
echo $env:DATABASE_URL
echo $env:AWS_ACCESS_KEY_ID

# Load environment variables
source .env  # Linux/macOS
# Or use dotenv in your application

# Test database connection string
psql "$DATABASE_URL" -c "SELECT version();"
```

#### **4. NPM Installation Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use different registry if needed
npm install --registry https://registry.npmjs.org/
```

#### **5. Git Issues**
```bash
# Reset local changes
git reset --hard HEAD

# Clean untracked files
git clean -fd

# Fix line ending issues
git config core.autocrlf true  # Windows
git config core.autocrlf input  # macOS/Linux
```

### **Getting Help**
1. **Check Documentation** - Start with relevant guides
2. **Search Issues** - Look for similar problems in GitLab issues
3. **Ask Team** - Reach out to team members
4. **Create Issue** - Document new problems for the team

## 📋 Best Practices

### **Development Practices**
1. **Always work on feature branches** - Never commit directly to main
2. **Write descriptive commit messages** - Follow conventional commits
3. **Test your changes** - Run tests before pushing
4. **Keep dependencies updated** - Regular npm updates
5. **Use consistent formatting** - Let Prettier handle formatting

### **Git Practices**
1. **Pull before starting work** - Always sync with latest changes
2. **Commit frequently** - Small, focused commits
3. **Review your changes** - Use git diff before committing
4. **Clean up branches** - Delete merged feature branches
5. **Use meaningful branch names** - feature/user-auth, fix/login-bug

### **Code Quality**
1. **Follow ESLint rules** - Fix linting errors
2. **Write comments** - Explain complex logic
3. **Use consistent naming** - Follow project conventions
4. **Handle errors properly** - Don't ignore try-catch blocks
5. **Optimize performance** - Use lazy loading patterns

## 🧪 Testing Your Setup

### **Complete Setup Verification**

#### **1. Environment Check**
```bash
# Verify all tools are installed
node --version    # v20.16.0+
npm --version     # 10.0.0+
git --version     # 2.40.0+
psql --version    # PostgreSQL 14+

# Check GitLab connection
ssh -T git@gitlab.com

# Verify project structure
ls -la  # Should show api/, client/, docs/, etc.
```

#### **2. Development Server Test**
```bash
# Terminal 1: Start API
cd api
npm run dev
# Should show: Server running on http://localhost:3001

# Terminal 2: Start Client
cd client
npm run dev
# Should show: Local: http://localhost:3000

# Terminal 3: Test full stack
cd ..
npm run dev
# Should start both servers
```

#### **3. Database Connection Test**
```bash
# Test database connection
cd api
npm run db:test  # or equivalent command

# Check database tables
psql -h localhost -U postgres -d cypher_dev -c "\dt"
```

#### **4. API Endpoints Test**
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test authentication endpoint
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

#### **5. Frontend Application Test**
1. Open http://localhost:3000 in browser
2. Check for no console errors (F12)
3. Test navigation between pages
4. Verify lazy loading works (click "Load Data" buttons)
5. Test authentication flow

## 🔄 Daily Development Checklist

### **Morning Routine**
```bash
# 1. Sync with remote
git checkout main
git pull origin main

# 2. Check for updates
npm outdated  # Check for package updates

# 3. Start development
git checkout -b feature/your-new-feature
npm run dev

# 4. Verify everything works
# - API server starts without errors
# - Client loads without console errors
# - Database connection is working
```

### **Before Committing**
```bash
# 1. Run tests
npm test

# 2. Check linting
npm run lint

# 3. Format code
npm run format

# 4. Review changes
git diff

# 5. Stage and commit
git add .
git commit -m "feat: your feature description"
```

### **End of Day**
```bash
# 1. Push your work
git push origin feature/your-feature

# 2. Create merge request (if ready)
# Go to GitLab web interface

# 3. Clean up (optional)
git checkout main
git branch -d completed-feature-branch
```

## 🚀 Advanced Setup (Optional)

### **Docker Development Environment**

#### **1. Docker Setup**
```bash
# Install Docker Desktop
# Download from: https://www.docker.com/products/docker-desktop

# Verify installation
docker --version
docker-compose --version
```

#### **2. Docker Compose Configuration**
Create `docker-compose.dev.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: cypher_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    build: ./api
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/cypher_dev
    depends_on:
      - postgres
    volumes:
      - ./api:/app
      - /app/node_modules

  client:
    build: ./client
    ports:
      - "3000:3000"
    volumes:
      - ./client:/app
      - /app/node_modules

volumes:
  postgres_data:
```

#### **3. Docker Commands**
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down

# Rebuild services
docker-compose -f docker-compose.dev.yml up --build
```

### **GitLab CI/CD Setup**

#### **1. GitLab Runner (Optional)**
```bash
# Install GitLab Runner locally
# Download from: https://docs.gitlab.com/runner/install/

# Register runner
gitlab-runner register
```

#### **2. Pipeline Configuration**
Create `.gitlab-ci.yml`:
```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20.16.0"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - cd api && npm ci && npm test
    - cd ../client && npm ci && npm test
  only:
    - merge_requests
    - main

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - cd client && npm ci && npm run build
  artifacts:
    paths:
      - client/dist/
  only:
    - main
```

## 📱 Mobile Development Setup (Optional)

### **React Native Setup (if applicable)**
```bash
# Install React Native CLI
npm install -g @react-native-community/cli

# Install Android Studio (for Android development)
# Download from: https://developer.android.com/studio

# Install Xcode (for iOS development - macOS only)
# Download from Mac App Store

# Verify setup
npx react-native doctor
```

## 🔐 Security Setup

### **1. Environment Security**
```bash
# Never commit .env files
echo ".env" >> .gitignore
echo "*.env" >> .gitignore

# Use environment-specific files
cp .env.example .env.development
cp .env.example .env.production
```

### **2. SSH Key Security**
```bash
# Use strong SSH keys
ssh-keygen -t ed25519 -b 4096 -C "your.email@company.com"

# Add passphrase to SSH key
ssh-keygen -p -f ~/.ssh/id_ed25519

# Use SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### **3. NPM Security**
```bash
# Audit dependencies regularly
npm audit

# Fix vulnerabilities
npm audit fix

# Check for known vulnerabilities
npm install -g npm-check-updates
ncu -u
```

## 📊 Performance Monitoring

### **1. Development Performance**
```bash
# Monitor bundle size
cd client
npm run build
npm run analyze  # if available

# Check API performance
cd api
npm run benchmark  # if available
```

### **2. Browser Performance**
1. **Chrome DevTools**
   - Performance tab for profiling
   - Network tab for API monitoring
   - Lighthouse for performance audits

2. **React Developer Tools**
   - Component profiling
   - State inspection
   - Performance monitoring

## 🎓 Learning Resources

### **Essential Reading**
1. **[Authentication System Guide](./AUTHENTICATION_SYSTEM_GUIDE.md)** - Understanding auth
2. **[Development Patterns Guide](./DEVELOPMENT_PATTERNS_GUIDE.md)** - Code patterns
3. **[Performance Optimization Guide](./PERFORMANCE_OPTIMIZATION_GUIDE.md)** - Performance
4. **[API Development Guide](../API_DOCUMENTATION/API_DEVELOPMENT_GUIDE.md)** - API patterns

### **External Resources**
- **React Documentation**: https://react.dev/
- **Node.js Documentation**: https://nodejs.org/docs/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **GitLab Documentation**: https://docs.gitlab.com/
- **Express.js Guide**: https://expressjs.com/

### **Team Resources**
- **Code Review Guidelines** - Internal team standards
- **Architecture Decisions** - Technical decision records
- **Deployment Guide** - Production deployment process
- **Monitoring & Logging** - Application monitoring setup

---

**Last Updated:** December 2024
**Status:** ✅ **Complete Setup Guide**
**Next Review:** After major tooling changes
