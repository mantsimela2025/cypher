# GitLab Multi-Environment Development Pipeline

## Enhanced CI/CD Pipeline for Development Workflow

### Extended .gitlab-ci.yml for Development Support

```yaml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  NODE_VERSION: "20"

# Test Stage - Runs on all branches
test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run test
    - npm run lint
    - npm run type-check
  artifacts:
    reports:
      junit: test-results.xml
      coverage: coverage/cobertura-coverage.xml
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  only:
    - branches
    - merge_requests

# Build Stage - Builds for all deployable branches
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - develop
    - main

# Deploy to Staging - Automatic on develop branch
deploy-staging:
  stage: deploy-staging
  image: alpine:latest
  environment:
    name: staging
    url: https://staging.ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$STAGING_EC2_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $STAGING_EC2_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $STAGING_EC2_USER@$STAGING_EC2_HOST << 'EOF'
        cd /var/www/ras-dash-staging
        
        # Pull latest develop branch
        git checkout develop
        git pull origin develop
        
        # Install/update dependencies
        npm ci
        
        # Build with staging environment
        NODE_ENV=staging npm run build
        
        # Run database migrations
        npm run migrate:staging
        
        # Restart staging application
        pm2 restart ras-dash-staging
        
        # Reload nginx
        sudo nginx -t && sudo systemctl reload nginx
        
        # Run smoke tests
        npm run test:smoke:staging
      EOF
  only:
    - develop
  when: on_success

# Deploy to Production - Manual trigger on main branch
deploy-production:
  stage: deploy-production
  image: alpine:latest
  environment:
    name: production
    url: https://ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$PRODUCTION_EC2_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $PRODUCTION_EC2_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $PRODUCTION_EC2_USER@$PRODUCTION_EC2_HOST << 'EOF'
        cd /var/www/ras-dash
        
        # Create backup of current version
        pm2 save
        cp -r /var/www/ras-dash /var/www/ras-dash-backup-$(date +%Y%m%d-%H%M%S)
        
        # Pull latest main branch
        git checkout main
        git pull origin main
        
        # Install/update dependencies
        npm ci --production
        
        # Build production
        NODE_ENV=production npm run build
        
        # Run database migrations
        npm run migrate:production
        
        # Restart production application with zero downtime
        pm2 reload ras-dash
        
        # Verify deployment
        sleep 10
        curl -f http://localhost:3000/health || (pm2 restart ras-dash && exit 1)
        
        # Reload nginx
        sudo nginx -t && sudo systemctl reload nginx
        
        echo "Production deployment completed successfully"
      EOF
  only:
    - main
  when: manual
  allow_failure: false

# Rollback Job - Manual trigger for emergencies
rollback-production:
  stage: deploy-production
  image: alpine:latest
  environment:
    name: production
    url: https://ras-dash.yourcompany.com
  before_script:
    - apk add --no-cache openssh-client bash curl
    - eval $(ssh-agent -s)
    - echo "$PRODUCTION_EC2_PRIVATE_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan -H $PRODUCTION_EC2_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $PRODUCTION_EC2_USER@$PRODUCTION_EC2_HOST << 'EOF'
        cd /var/www/ras-dash
        
        # Rollback to previous commit
        git reset --hard HEAD~1
        
        # Reinstall dependencies
        npm ci --production
        
        # Rebuild
        npm run build
        
        # Restart application
        pm2 restart ras-dash
        
        echo "Rollback completed"
      EOF
  only:
    - main
  when: manual
```

## Development Environment Variables

### Staging Environment Variables
```bash
# GitLab Variables for Staging
STAGING_EC2_HOST=staging.ras-dash.yourcompany.com
STAGING_EC2_USER=ubuntu
STAGING_EC2_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
STAGING_DATABASE_URL=postgresql://user:pass@staging-db:5432/rasdash_staging
STAGING_OPENAI_API_KEY=sk-staging-key
NODE_ENV=staging
```

### Production Environment Variables
```bash
# GitLab Variables for Production  
PRODUCTION_EC2_HOST=ras-dash.yourcompany.com
PRODUCTION_EC2_USER=ubuntu
PRODUCTION_EC2_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
DATABASE_URL=postgresql://user:pass@prod-db:5432/rasdash_prod
OPENAI_API_KEY=sk-production-key
NODE_ENV=production
```

## Enhanced Package.json Scripts

```json
{
  "scripts": {
    "dev": "npm run dev:server & npm run dev:client",
    "dev:server": "nodemon server/index.js",
    "dev:client": "vite",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc --project server/tsconfig.json",
    "start": "NODE_ENV=production node server/dist/index.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:smoke:staging": "npm run test:smoke -- --baseUrl=https://staging.ras-dash.yourcompany.com",
    "test:smoke:production": "npm run test:smoke -- --baseUrl=https://ras-dash.yourcompany.com",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "type-check": "tsc --noEmit",
    "migrate:staging": "NODE_ENV=staging npx drizzle-kit push:pg",
    "migrate:production": "NODE_ENV=production npx drizzle-kit push:pg"
  }
}
```

## Multi-Environment EC2 Setup

### Staging Server Configuration
```bash
# Staging PM2 Ecosystem
// ecosystem.staging.config.js
module.exports = {
  apps: [{
    name: 'ras-dash-staging',
    script: 'server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'staging',
      PORT: 3001,
      DATABASE_URL: process.env.STAGING_DATABASE_URL,
      OPENAI_API_KEY: process.env.STAGING_OPENAI_API_KEY
    },
    error_file: '/var/www/ras-dash-staging/logs/err.log',
    out_file: '/var/www/ras-dash-staging/logs/out.log',
    log_file: '/var/www/ras-dash-staging/logs/combined.log',
    time: true
  }]
};
```

### Staging Nginx Configuration
```nginx
# /etc/nginx/sites-available/ras-dash-staging
server {
    listen 80;
    server_name staging.ras-dash.yourcompany.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development Workflow Examples

### Feature Development Workflow
```bash
# 1. Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/asset-discovery-enhancement

# 2. Make changes in VS Code
# Edit files, add new features

# 3. Test locally
npm run dev
npm run test
npm run lint

# 4. Commit and push
git add .
git commit -m "feat: enhance asset discovery with AI classification"
git push origin feature/asset-discovery-enhancement

# 5. Create Merge Request in GitLab
# → Automatic tests run
# → Code review process
# → Merge to develop when approved

# 6. Automatic staging deployment
# → develop branch triggers staging deployment
# → Test on https://staging.ras-dash.yourcompany.com

# 7. Production release
git checkout main
git merge develop
git push origin main
# → Manual production deployment trigger in GitLab
```

### Hotfix Workflow
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-patch

# 2. Make critical fix
# Edit files for urgent fix

# 3. Test and commit
npm run test
git commit -m "fix: patch critical security vulnerability"
git push origin hotfix/critical-security-patch

# 4. Deploy to staging first
git checkout develop
git merge hotfix/critical-security-patch
git push origin develop
# → Automatic staging deployment

# 5. Deploy to production after verification
git checkout main
git merge hotfix/critical-security-patch
git push origin main
# → Manual production deployment trigger
```

## Branch Protection Rules

### Configure in GitLab Project Settings > Repository > Push Rules
```bash
# Main Branch Protection
- Require merge request approval
- Require successful pipeline
- Prevent direct pushes
- Require up-to-date branches

# Develop Branch Protection  
- Require merge request approval
- Require successful pipeline
- Allow maintainer pushes
```

## Environment-Specific Features

### Database Management Per Environment
```javascript
// drizzle.config.ts
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.NODE_ENV === 'production' 
      ? process.env.DATABASE_URL 
      : process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL
  }
};
```

### Feature Flags for Development
```javascript
// server/config/features.js
const features = {
  staging: {
    enableNewAssetDiscovery: true,
    enableAdvancedAnalytics: true,
    enableDebugMode: true
  },
  production: {
    enableNewAssetDiscovery: false,
    enableAdvancedAnalytics: true, 
    enableDebugMode: false
  }
};

export const getFeatureFlags = () => {
  return features[process.env.NODE_ENV] || features.staging;
};
```

## Monitoring Per Environment

### Staging Monitoring
```bash
# Simplified monitoring for staging
# Basic health checks
# Performance monitoring
# Error tracking (less sensitive)
```

### Production Monitoring
```bash
# Full monitoring suite
# Real-time alerts
# Performance APM
# Security monitoring
# Cost tracking
```

## Benefits of This Setup

✅ **Continuous Integration** - Every code change is tested automatically
✅ **Staged Deployments** - Safe progression from development to production  
✅ **Automated Testing** - Prevents broken code from reaching production
✅ **Easy Rollbacks** - Quick recovery from issues
✅ **Environment Parity** - Consistent environments reduce deployment issues
✅ **Developer Productivity** - Streamlined workflow from local development to production
✅ **Quality Assurance** - Multiple validation steps before production release

This setup ensures your development team can work efficiently while maintaining production stability and quality.