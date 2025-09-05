# Environment Configuration Guide

## 🎯 **Overview**

This guide explains how to configure CYPHER for different environments (development, testing, production) using dynamic environment variables instead of hardcoded values.

## 📁 **Environment Files Structure**

```
cypher/
├── api/
│   ├── .env                    # Current environment (not in git)
│   ├── .env.example           # Template with all variables
│   ├── .env.development       # Development defaults
│   └── .env.production        # Production defaults
└── client/
    ├── .env                   # Current environment (not in git)
    ├── .env.development       # Development defaults
    └── .env.production        # Production defaults
```

## 🔧 **API Configuration**

### **Environment Variables**

```bash
# Server Configuration
PORT=3001                                    # Development
PORT=${PORT:-3001}                          # Production (uses env var or default)

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# CORS and Frontend
CORS_ORIGIN=http://localhost:3000           # Development
CORS_ORIGIN=${FRONTEND_URL:-https://your-domain.com}  # Production

# Integrations
TENABLE_BASE_URL=http://localhost:5001      # Development (mock server)
TENABLE_BASE_URL=https://cloud.tenable.com # Production
```

### **Development (.env.development)**

```bash
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
TENABLE_BASE_URL=http://localhost:5001
AUTH_BYPASS=false
RATE_LIMIT_MAX_REQUESTS=1000
```

### **Production (.env.production)**

```bash
PORT=${PORT:-3001}
NODE_ENV=production
CORS_ORIGIN=${FRONTEND_URL:-https://your-domain.com}
FRONTEND_URL=${FRONTEND_URL:-https://your-domain.com}
TENABLE_BASE_URL=${TENABLE_BASE_URL:-https://cloud.tenable.com}
AUTH_BYPASS=false
RATE_LIMIT_MAX_REQUESTS=100
```

## 🌐 **Client Configuration**

### **Environment Variables**

```bash
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1     # Development
REACT_APP_API_BASE_URL=https://api.your-domain.com/api/v1  # Production

# Application Settings
REACT_APP_NAME=CYPHER
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_DEV_TOOLS=true    # Development
REACT_APP_ENABLE_DEV_TOOLS=false   # Production
```

### **Development (.env.development)**

```bash
REACT_APP_API_BASE_URL=http://localhost:3001/api/v1
REACT_APP_ENABLE_DEV_TOOLS=true
REACT_APP_ENABLE_CONSOLE_LOGS=true
REACT_APP_ENABLE_MOCK_DATA=false
```

### **Production (.env.production)**

```bash
REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL:-https://api.your-domain.com/api/v1}
REACT_APP_ENABLE_DEV_TOOLS=false
REACT_APP_ENABLE_CONSOLE_LOGS=false
REACT_APP_ENABLE_MOCK_DATA=false
```

## 🚀 **Deployment Configurations**

### **Development Deployment**

```bash
# Set environment variables
export NODE_ENV=development
export PORT=3001
export FRONTEND_URL=http://localhost:3000

# Start services
cd api && npm run dev
cd client && npm run dev
```

### **Production Deployment**

```bash
# Set environment variables
export NODE_ENV=production
export PORT=3001
export FRONTEND_URL=https://your-domain.com
export REACT_APP_API_BASE_URL=https://api.your-domain.com/api/v1
export DATABASE_URL=postgresql://user:pass@prod-host:5432/prod-db

# Build and start
cd client && npm run build
cd api && npm start
```

### **Docker Deployment**

```dockerfile
# Dockerfile.api
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE ${PORT:-3001}
CMD ["npm", "start"]
```

```dockerfile
# Dockerfile.client
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Docker Compose**

```yaml
version: '3.8'
services:
  api:
    build: 
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "${PORT:-3001}:${PORT:-3001}"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=${PORT:-3001}
      - DATABASE_URL=${DATABASE_URL}
      - FRONTEND_URL=${FRONTEND_URL}
    env_file:
      - ./api/.env.production

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
    ports:
      - "80:80"
    depends_on:
      - api
```

## 🔒 **Security Best Practices**

### **1. Environment Variable Management**

```bash
# ✅ GOOD - Use environment variables for sensitive data
DATABASE_URL=${DATABASE_URL}
OPENAI_API_KEY=${OPENAI_API_KEY}

# ❌ BAD - Hardcoded sensitive values
DATABASE_URL=postgresql://user:password@host:5432/db
OPENAI_API_KEY=sk-actual-key-here
```

### **2. Production Secrets**

- Use AWS Parameter Store, Azure Key Vault, or similar
- Never commit actual secrets to version control
- Use different secrets for each environment
- Rotate secrets regularly

### **3. Client-Side Variables**

```bash
# ⚠️ WARNING - All REACT_APP_ variables are visible to users
REACT_APP_API_BASE_URL=https://api.your-domain.com/api/v1  # ✅ OK - Public URL
REACT_APP_SECRET_KEY=secret123                            # ❌ NEVER - Visible to users
```

## 🛠 **Configuration Utilities**

### **Client Configuration Helper**

```javascript
// client/src/utils/config.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api/v1'
};

export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
```

### **API Configuration Helper**

```javascript
// api/src/config/index.js
module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};
```

## 📋 **Setup Checklist**

### **Initial Setup**
- [ ] Copy `.env.example` to `.env` in both api and client
- [ ] Update environment-specific values
- [ ] Test in development environment
- [ ] Verify all services can communicate

### **Production Deployment**
- [ ] Set all required environment variables
- [ ] Use production database
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Test all integrations
- [ ] Monitor logs for configuration issues

### **Security Review**
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly set
- [ ] Production secrets secured
- [ ] Client variables reviewed (no sensitive data)
- [ ] CORS properly configured

## 🚨 **Common Issues**

### **1. API Connection Issues**
```bash
# Check API base URL
echo $REACT_APP_API_BASE_URL

# Verify API is running
curl $REACT_APP_API_BASE_URL/health
```

### **2. CORS Issues**
```bash
# Check CORS origin setting
echo $CORS_ORIGIN

# Should match client URL
echo $FRONTEND_URL
```

### **3. Environment Not Loading**
```bash
# Verify .env file exists
ls -la .env

# Check environment variables
printenv | grep REACT_APP_
```

---

**Remember:** Dynamic configuration makes deployment flexible and secure! 🔒
