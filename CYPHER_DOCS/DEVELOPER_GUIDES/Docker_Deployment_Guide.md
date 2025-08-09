# RAS DASH Docker Deployment Guide

## Overview
This guide provides comprehensive Docker deployment strategies for RAS DASH, from development to production, including Docker Compose, Kubernetes, and AWS ECS options.

---

## Docker Deployment Benefits

### 🚀 Advantages
- **Consistent Environment**: Same runtime across development, staging, and production
- **Easy Scaling**: Horizontal scaling with container orchestration
- **Isolation**: Application dependencies contained and isolated
- **Portability**: Deploy anywhere that supports Docker
- **Version Control**: Infrastructure as code with version control
- **Quick Rollbacks**: Easy rollback to previous container versions

### 📦 Container Strategy
- **Multi-stage builds** for optimized production images
- **Separate containers** for frontend, backend, database, and services
- **Container orchestration** with Docker Compose or Kubernetes
- **Health checks** and automatic restart policies
- **Volume management** for persistent data

---

## Option 1: Local Development with Docker Compose

### Step 1: Create Dockerfile for RAS DASH

**Dockerfile**
```dockerfile
# Multi-stage build for production optimization
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy additional necessary files
COPY --chown=nodejs:nodejs server ./server
COPY --chown=nodejs:nodejs .env.example ./.env.example

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/server/index.js"]
```

### Step 2: Docker Compose for Development

**docker-compose.dev.yml**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ras-dash-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_DB: rasdash_dev
      POSTGRES_USER: rasdash
      POSTGRES_PASSWORD: dev_password_123
      POSTGRES_HOST_AUTH_METHOD: trust
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - ras-dash-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rasdash -d rasdash_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: ras-dash-redis-dev
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_dev_data:/data
    ports:
      - "6379:6379"
    networks:
      - ras-dash-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # RAS DASH Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: ras-dash-app-dev
    restart: unless-stopped
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://rasdash:dev_password_123@postgres:5432/rasdash_dev
      - REDIS_URL=redis://redis:6379
      - PORT=5000
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ras-dash-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: ras-dash-nginx-dev
    restart: unless-stopped
    volumes:
      - ./docker/nginx/dev.conf:/etc/nginx/conf.d/default.conf
      - ./logs/nginx:/var/log/nginx
    ports:
      - "80:80"
    depends_on:
      - app
    networks:
      - ras-dash-network

volumes:
  postgres_dev_data:
  redis_dev_data:

networks:
  ras-dash-network:
    driver: bridge
```

### Step 3: Nginx Configuration for Development

**docker/nginx/dev.conf**
```nginx
upstream app {
    server app:5000;
}

server {
    listen 80;
    server_name localhost;

    # Increase upload size for file uploads
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API routes
    location /api/ {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location / {
        proxy_pass http://app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://app/api/health;
        access_log off;
    }
}
```

### Step 4: Development Commands

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Access application shell
docker-compose -f docker-compose.dev.yml exec app sh

# Run database migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:push

# Stop development environment
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (full reset)
docker-compose -f docker-compose.dev.yml down -v
```

---

## Option 2: Production Deployment with Docker Compose + Traefik

### Step 1: Production Docker Compose

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  # Traefik Reverse Proxy with SSL
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.dnschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.dnschallenge.provider=route53"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
      - "--certificatesresolvers.letsencrypt.acme.dnschallenge.resolvers=1.1.1.1:53,8.8.8.8:53"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Traefik dashboard
    environment:
      - AWS_REGION=${AWS_REGION}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./acme.json:/acme.json
      - ./logs/traefik:/var/log/traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN_NAME}`)"
      - "traefik.http.routers.dashboard.tls=true"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_AUTH}"
    networks:
      - ras-dash-network

  # PostgreSQL Database with backup
  postgres:
    image: postgres:15-alpine
    container_name: ras-dash-postgres-prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
      - ./docker/postgres/postgresql.conf:/etc/postgresql/postgresql.conf
    networks:
      - ras-dash-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: ras-dash-redis-prod
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data
    networks:
      - ras-dash-network
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # RAS DASH Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: ras-dash-app-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      - REDIS_URL=redis://default:${REDIS_PASSWORD}@redis:6379
      - PORT=5000
      - DOMAIN=${DOMAIN_NAME}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - SESSION_SECRET=${SESSION_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
      - ./data:/app/data
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ras-dash-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.ras-dash.rule=Host(`${DOMAIN_NAME}`)"
      - "traefik.http.routers.ras-dash.tls=true"
      - "traefik.http.routers.ras-dash.tls.certresolver=letsencrypt"
      - "traefik.http.services.ras-dash.loadbalancer.server.port=5000"
      - "traefik.http.routers.ras-dash.middlewares=security-headers"
      - "traefik.http.middlewares.security-headers.headers.customRequestHeaders.X-Forwarded-Proto=https"
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
      replicas: 2

  # Database backup service
  db-backup:
    image: postgres:15-alpine
    container_name: ras-dash-backup
    restart: "no"
    environment:
      PGPASSWORD: ${DB_PASSWORD}
    volumes:
      - ./backups:/backups
      - ./docker/backup/backup.sh:/backup.sh
    command: /backup.sh
    depends_on:
      - postgres
    networks:
      - ras-dash-network

volumes:
  postgres_prod_data:
  redis_prod_data:

networks:
  ras-dash-network:
    driver: bridge
```

### Step 2: Production Environment Variables

**.env.prod**
```bash
# Domain Configuration
DOMAIN_NAME=your-domain.com
ACME_EMAIL=your-email@example.com

# Database Configuration
DB_NAME=rasdash_prod
DB_USER=rasdash
DB_PASSWORD=your-super-secure-db-password

# Redis Configuration
REDIS_PASSWORD=your-super-secure-redis-password

# Application Secrets
SESSION_SECRET=your-super-secure-session-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key

# API Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# AWS Configuration for Route53
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Traefik Dashboard Authentication (generate with: htpasswd -nb admin password)
TRAEFIK_AUTH=admin:$2y$10$...
```

### Step 3: Database Backup Script

**docker/backup/backup.sh**
```bash
#!/bin/bash
set -e

echo "Starting backup process..."

# Create backup filename with timestamp
BACKUP_NAME="rasdash_backup_$(date +%Y%m%d_%H%M%S).sql"

# Create database backup
pg_dump -h postgres -U $DB_USER -d $DB_NAME > /backups/$BACKUP_NAME

# Compress the backup
gzip /backups/$BACKUP_NAME

echo "Backup completed: ${BACKUP_NAME}.gz"

# Keep only the last 30 days of backups
find /backups -name "*.gz" -type f -mtime +30 -delete

echo "Old backups cleaned up"
```

### Step 4: Production Deployment Commands

```bash
# Create SSL certificate file
touch acme.json
chmod 600 acme.json

# Create backup directory
mkdir -p backups logs/traefik

# Start production environment
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# Run database migrations
docker-compose -f docker-compose.prod.yml exec app npm run db:push

# Create database backup
docker-compose -f docker-compose.prod.yml run --rm db-backup

# Scale application containers
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Update application with zero downtime
docker-compose -f docker-compose.prod.yml build app
docker-compose -f docker-compose.prod.yml up -d --no-deps app
```

---

## Option 3: AWS ECS Deployment

### Step 1: ECS Task Definition

**ecs-task-definition.json**
```json
{
  "family": "ras-dash-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ras-dash-task-role",
  "containerDefinitions": [
    {
      "name": "ras-dash-app",
      "image": "your-ecr-repo/ras-dash:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:ras-dash/database-url"
        },
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:ras-dash/openai-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ras-dash",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "curl -f http://localhost:5000/api/health || exit 1"
        ],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Step 2: ECS Service with Application Load Balancer

**terraform/ecs.tf**
```hcl
# ECS Cluster
resource "aws_ecs_cluster" "ras_dash" {
  name = "ras-dash-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "ras-dash-cluster"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "ras_dash" {
  family                   = "ras-dash-task"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "1024"
  memory                  = "2048"
  execution_role_arn      = aws_iam_role.ecs_execution_role.arn
  task_role_arn          = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "ras-dash-app"
      image = "${aws_ecr_repository.ras_dash.repository_url}:latest"

      portMappings = [
        {
          containerPort = 5000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = "production"
        },
        {
          name  = "PORT"
          value = "5000"
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = aws_secretsmanager_secret.database_url.arn
        },
        {
          name      = "OPENAI_API_KEY"
          valueFrom = aws_secretsmanager_secret.openai_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ras_dash.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "ras-dash-task"
  }
}

# ECS Service
resource "aws_ecs_service" "ras_dash" {
  name            = "ras-dash-service"
  cluster         = aws_ecs_cluster.ras_dash.id
  task_definition = aws_ecs_task_definition.ras_dash.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ras_dash.arn
    container_name   = "ras-dash-app"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener.ras_dash_https]

  tags = {
    Name = "ras-dash-service"
  }
}

# ECR Repository
resource "aws_ecr_repository" "ras_dash" {
  name         = "ras-dash"
  force_delete = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "ras-dash-ecr"
  }
}
```

### Step 3: Docker Image Build and Push Script

**scripts/deploy-ecs.sh**
```bash
#!/bin/bash
set -e

# Configuration
AWS_REGION="us-east-1"
ECR_REPO="your-account.dkr.ecr.us-east-1.amazonaws.com/ras-dash"
CLUSTER_NAME="ras-dash-cluster"
SERVICE_NAME="ras-dash-service"

echo "Building Docker image..."

# Build Docker image
docker build -t ras-dash:latest .

# Tag for ECR
docker tag ras-dash:latest $ECR_REPO:latest
docker tag ras-dash:latest $ECR_REPO:$(git rev-parse --short HEAD)

echo "Pushing to ECR..."

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Push images
docker push $ECR_REPO:latest
docker push $ECR_REPO:$(git rev-parse --short HEAD)

echo "Updating ECS service..."

# Force new deployment
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $AWS_REGION

echo "Waiting for deployment to complete..."

# Wait for deployment
aws ecs wait services-stable \
  --cluster $CLUSTER_NAME \
  --services $SERVICE_NAME \
  --region $AWS_REGION

echo "Deployment completed successfully!"
```

---

## Option 4: Kubernetes Deployment

### Step 1: Kubernetes Manifests

**k8s/namespace.yaml**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ras-dash
  labels:
    name: ras-dash
```

**k8s/configmap.yaml**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ras-dash-config
  namespace: ras-dash
data:
  NODE_ENV: "production"
  PORT: "5000"
  REDIS_URL: "redis://redis-service:6379"
```

**k8s/secrets.yaml**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ras-dash-secrets
  namespace: ras-dash
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:password@postgres-service:5432/rasdash"
  OPENAI_API_KEY: "your-openai-api-key"
  ANTHROPIC_API_KEY: "your-anthropic-api-key"
  SESSION_SECRET: "your-session-secret"
```

**k8s/deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ras-dash-app
  namespace: ras-dash
  labels:
    app: ras-dash-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ras-dash-app
  template:
    metadata:
      labels:
        app: ras-dash-app
    spec:
      containers:
      - name: ras-dash-app
        image: your-registry/ras-dash:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: ras-dash-config
        - secretRef:
            name: ras-dash-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: ras-dash-uploads-pvc
```

**k8s/service.yaml**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: ras-dash-service
  namespace: ras-dash
spec:
  selector:
    app: ras-dash-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: ClusterIP
```

**k8s/ingress.yaml**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ras-dash-ingress
  namespace: ras-dash
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: ras-dash-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ras-dash-service
            port:
              number: 80
```

### Step 2: Database and Redis in Kubernetes

**k8s/postgres.yaml**
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ras-dash
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: "rasdash"
        - name: POSTGRES_USER
          value: "rasdash"
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: ras-dash
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### Step 3: Deployment Commands

```bash
# Apply all Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ras-dash

# Check services
kubectl get services -n ras-dash

# View application logs
kubectl logs -f deployment/ras-dash-app -n ras-dash

# Scale deployment
kubectl scale deployment ras-dash-app --replicas=5 -n ras-dash

# Rolling update
kubectl set image deployment/ras-dash-app ras-dash-app=your-registry/ras-dash:v2 -n ras-dash
```

---

## Docker Development Workflow

### Daily Development Commands

```bash
# Start development environment
make dev-up

# View all logs
make dev-logs

# Restart specific service
make dev-restart service=app

# Run database migrations
make dev-migrate

# Access application shell
make dev-shell

# Run tests
make dev-test

# Stop development environment
make dev-down
```

### Makefile for Easy Management

**Makefile**
```makefile
.PHONY: dev-up dev-down dev-logs dev-shell dev-migrate dev-test prod-up prod-down

# Development commands
dev-up:
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f

dev-shell:
	docker-compose -f docker-compose.dev.yml exec app sh

dev-migrate:
	docker-compose -f docker-compose.dev.yml exec app npm run db:push

dev-test:
	docker-compose -f docker-compose.dev.yml exec app npm test

dev-restart:
	docker-compose -f docker-compose.dev.yml restart $(service)

# Production commands
prod-up:
	docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f $(service)

prod-backup:
	docker-compose -f docker-compose.prod.yml run --rm db-backup

# Build and deploy
build:
	docker build -t ras-dash:latest .

deploy-ecs:
	./scripts/deploy-ecs.sh

# Cleanup
clean:
	docker system prune -a
	docker volume prune
```

---

## Monitoring and Logging

### Docker Compose with ELK Stack

**docker-compose.monitoring.yml**
```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    networks:
      - monitoring

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    container_name: logstash
    volumes:
      - ./docker/logstash/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    networks:
      - monitoring

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    container_name: kibana
    environment:
      ELASTICSEARCH_URL: http://elasticsearch:9200
    ports:
      - "5601:5601"
    networks:
      - monitoring

volumes:
  elasticsearch_data:

networks:
  monitoring:
```

---

## Performance and Security Considerations

### Docker Security Best Practices

1. **Use non-root users** in containers
2. **Scan images** for vulnerabilities
3. **Use multi-stage builds** to reduce image size
4. **Set resource limits** to prevent resource exhaustion
5. **Use secrets management** for sensitive data
6. **Regular security updates** for base images

### Performance Optimization

1. **Layer caching** - Order Dockerfile commands for optimal caching
2. **Multi-stage builds** - Smaller production images
3. **Resource limits** - Prevent resource contention
4. **Health checks** - Ensure container health
5. **Load balancing** - Distribute traffic across containers

---

## Cost Analysis

| Deployment Type | Monthly Cost Estimate | Scalability | Maintenance |
|----------------|----------------------|-------------|-------------|
| **Docker Compose on EC2** | $15-50 | Manual | Medium |
| **ECS Fargate** | $50-200 | Automatic | Low |
| **Kubernetes (EKS)** | $100-300 | Automatic | High |
| **Self-managed K8s** | $50-150 | Automatic | Very High |

Docker provides excellent portability and consistency across environments while offering multiple deployment strategies to match your requirements and budget.

Would you like me to help you implement any of these Docker deployment approaches or create additional automation scripts?