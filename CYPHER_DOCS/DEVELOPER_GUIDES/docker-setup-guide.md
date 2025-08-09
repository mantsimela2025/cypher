# Docker Setup Guide

This guide provides instructions for running the application using Docker, which offers a consistent development environment across different platforms.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine
- Basic knowledge of Docker commands

## Quick Start

### 1. Create Docker Files

Create the following files in your project root:

#### `Dockerfile`

```dockerfile
FROM node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
```

#### `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=5000
      # Add other environment variables from .env file
    env_file:
      - .env
    command: npm run dev
```

### 2. Environment Setup

Make sure your `.env` file includes all necessary variables:

```
DATABASE_URL=postgresql://your_username:your_password@your_host:your_port/your_database
PGUSER=your_username
PGPASSWORD=your_password
PGHOST=your_host
PGDATABASE=your_database
PGPORT=your_port
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
MAILERSEND_API_KEY=your_mailersend_api_key
NVD_API_KEY=your_nvd_api_key
```

### 3. Building and Running

Build and start the Docker container:

```bash
docker-compose up
```

This will:
- Build the Docker image
- Start the container
- Mount your code as a volume for live updates
- Forward port 5000 to your local machine
- Set up environment variables

The application will be available at http://localhost:5000

## Development Workflow

### Viewing Logs

```bash
# View logs in real-time
docker-compose logs -f
```

### Executing Commands Inside the Container

```bash
# Run a one-off command
docker-compose exec app npm test

# Get a shell inside the container
docker-compose exec app bash
```

### Rebuilding the Container

If you make changes to the Dockerfile or need to rebuild:

```bash
docker-compose up --build
```

### Stopping the Container

```bash
# Stop the container while preserving data
docker-compose stop

# Stop and remove containers, networks, and volumes
docker-compose down
```

## Connecting to the Remote Database

The Docker container will connect to the remote PostgreSQL database using the connection details in your `.env` file. This works because:

1. The Docker container has network access to the internet
2. The PostgreSQL database allows connections from external IPs
3. The connection credentials are passed via environment variables

## Troubleshooting

### Connection Issues

If you're unable to connect to the database:

```bash
# Check if the container can reach the database host
docker-compose exec app ping your_database_host

# Test database connection directly
docker-compose exec app npx tsx -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err, res);
  pool.end();
});
"
```

### Container Won't Start

```bash
# Check for errors in detail
docker-compose logs app

# Validate your docker-compose file
docker-compose config
```

### Performance Issues

For better performance, especially on macOS or Windows:

1. Add these settings to the `volumes` section in `docker-compose.yml`:

```yaml
volumes:
  - .:/app:cached
  - /app/node_modules
```

2. Consider using a more specific mapping to exclude large directories:

```yaml
volumes:
  - ./client:/app/client:cached
  - ./server:/app/server:cached
  - ./shared:/app/shared:cached
  - ./package.json:/app/package.json
  - ./tsconfig.json:/app/tsconfig.json
  - /app/node_modules
```

## Advanced Configuration

### Using Docker for Testing

For running tests in Docker:

```yaml
# Add to docker-compose.yml
services:
  test:
    build: .
    volumes:
      - .:/app
      - /app/node_modules
    env_file:
      - .env.test
    command: npm test
```

Run tests with:

```bash
docker-compose run test
```

## Conclusion

Using Docker provides a consistent development environment and makes it easier to onboard new developers. The setup described in this guide allows you to develop locally while connecting to the remote database.

For more detailed information about running the application locally without Docker, refer to the [local development guide](./local-development-guide.md).