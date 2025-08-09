# Local Development Guide

This guide provides step-by-step instructions for setting up and running the application locally, while still connecting to the Replit PostgreSQL database.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Repository Setup](#repository-setup)
3. [Environment Configuration](#environment-configuration)
4. [Installing Dependencies](#installing-dependencies)
5. [Running the Application](#running-the-application)
6. [Debugging](#debugging)
7. [Database Access](#database-access)
8. [Common Issues](#common-issues)
9. [Code Editor Setup](#code-editor-setup)
10. [Development Workflow](#development-workflow)

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (version 18.x or newer)
- **npm** (usually comes with Node.js)
- **Git**
- A code editor (VS Code recommended)
- Basic knowledge of terminal/command line
- PostgreSQL client (optional, for direct database access)

## Repository Setup

1. Clone the repository to your local machine:

```bash
git clone https://github.com/yourusername/your-repository.git
cd your-repository
```

If you don't have a GitHub repository yet, you can export the code from Replit:

- In Replit, click on the "..." menu in the Files panel
- Select "Download as zip"
- Extract the zip file to your desired location
- Navigate to the extracted folder

## Environment Configuration

The application requires several environment variables to function properly:

1. Create a `.env` file in the root directory:

```bash
# Copy the .env.example file to start with
cp .env.example .env
```

2. Update the `.env` file with the necessary credentials:

```
# Database connection
DATABASE_URL=postgresql://your_username:your_password@your_host:your_port/your_database
PGUSER=your_username
PGPASSWORD=your_password
PGHOST=your_host
PGDATABASE=your_database
PGPORT=your_port

# API keys
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
MAILERSEND_API_KEY=your_mailersend_api_key
NVD_API_KEY=your_nvd_api_key

# Application settings
NODE_ENV=development
PORT=5000
```

3. Get the database connection details:

- If using the Replit database: Copy the values from the Replit `.env` file
- To view the Replit environment variables: 
  - Go to the "Tools" panel
  - Select "Secrets"
  - Copy the necessary database connection values

## Installing Dependencies

Install all required dependencies using npm:

```bash
npm install
```

This will install all packages defined in `package.json`.

## Running the Application

### Method 1: Using npm scripts

The simplest way to start the application is:

```bash
npm run dev
```

This will start both the backend server and frontend development server using the configurations defined in the project.

### Method 2: Manual server start

Alternatively, you can start the server directly:

```bash
# Using tsx to run TypeScript directly
npx tsx server/index.ts
```

### Accessing the Application

Once running, the application will be available at:

- **URL**: `http://localhost:5000`
- **API Endpoints**: `http://localhost:5000/api/...`

## Debugging

### VS Code Debugging Setup

1. Create a `.vscode/launch.json` file in your project root:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Server",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/tsx/dist/cli.mjs",
      "args": ["server/index.ts"],
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

2. To start debugging:
   - Open VS Code
   - Click the Run and Debug icon in the sidebar
   - Select "Launch Server" from the dropdown
   - Click the green play button

3. You can now set breakpoints and inspect variables during execution.

### Console Debugging

For more traditional debugging:

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Or for specific modules
DEBUG=express:*,db:* npm run dev
```

## Database Access

### Connecting to the PostgreSQL Database

You can connect to the database using any PostgreSQL client:

1. **Using command line**:

```bash
psql postgresql://username:password@host:port/database
```

2. **Using a GUI client** (like pgAdmin, DBeaver, or TablePlus):
   - Create a new connection
   - Enter the connection details from your `.env` file
   - Test and save the connection

### Running Database Migrations Locally

If you need to run database migrations:

```bash
# Run migrations
npm run db:migrate

# Create a new migration
npm run db:migration:create my_migration_name
```

## Common Issues

### Connection Refused to Database

If you cannot connect to the database:

1. Check that your database credentials are correct
2. Ensure the database server allows external connections
3. Check if your IP needs to be whitelisted
4. Verify that no firewall is blocking the connection

### Node.js Version Issues

If you encounter compatibility issues:

```bash
# Check your Node.js version
node -v

# Use nvm to install the correct version if needed
nvm install 18
nvm use 18
```

### Package Dependencies Issues

If you have issues with dependencies:

```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Or use npm's clean install
npm ci
```

## Code Editor Setup

### VS Code Recommended Configuration

1. **Extensions**:
   - ESLint
   - Prettier
   - TypeScript and JavaScript Language Features
   - SQLTools (for database interactions)
   - Thunder Client (for API testing)

2. **Settings**:

Create a `.vscode/settings.json` file:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.tabSize": 2,
  "files.eol": "\n"
}
```

## Development Workflow

### Best Practices

1. **Pull the latest changes** before starting development:

```bash
git pull origin main
```

2. **Create a feature branch** for your work:

```bash
git checkout -b feature/your-feature-name
```

3. **Regularly commit your changes** with descriptive messages:

```bash
git add .
git commit -m "Add feature X that does Y"
```

4. **Run tests** before pushing:

```bash
npm test
```

5. **Push your changes** to the remote repository:

```bash
git push origin feature/your-feature-name
```

### Updating the Database

Changes made to the database from your local environment will affect the remote database if you're using the same connection string.

**Be careful with:**
- Running migrations
- Seeding data
- Writing directly to the database

Always back up important data before making significant changes.

### Working with the API

To test API endpoints locally:

1. Using curl:

```bash
curl http://localhost:5000/api/user
```

2. Using Postman or Thunder Client:
   - Create a new request
   - Set the URL to your local endpoint
   - Add any necessary headers (e.g., authentication)
   - Send the request and view the response

---

## Need Help?

If you encounter any issues not covered in this guide, please:

1. Check the project documentation in the `docs/` folder
2. Refer to the application's README file
3. Contact the project maintainers

---

This guide was last updated on April 28, 2025.