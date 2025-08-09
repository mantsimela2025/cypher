# Multi-stage build for CYPHER Dashboard
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY api/package*.json ./api/

# Install dependencies
RUN npm install
RUN cd client && npm install
RUN cd api && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Production stage
FROM node:20-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Copy package files and install production dependencies
COPY api/package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/api ./
COPY --from=builder /app/client/dist ./public

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_PORT=3000
ENV DATABASE_URL=postgresql://user:password@host:5432/database

# Expose ports
EXPOSE 3001 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start command
CMD ["npm", "start"]
