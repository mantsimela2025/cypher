# STIG Management System Documentation

## Overview

The STIG Management System is a comprehensive security compliance management platform designed for government and enterprise environments. It provides automated STIG (Security Technical Implementation Guide) selection, assignment, collection management, and compliance tracking capabilities.

## Documentation Structure

This documentation provides complete technical specifications for migrating or replicating the STIG Management system:

1. **[OVERVIEW.md](./OVERVIEW.md)** - Complete system overview and architecture
2. **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - All database tables and relationships
3. **[DRIZZLE_SCHEMAS.md](./DRIZZLE_SCHEMAS.md)** - TypeScript schema definitions
4. **[SERVICES_CONTROLLERS.md](./SERVICES_CONTROLLERS.md)** - Backend service and controller functions
5. **[API_ROUTES.md](./API_ROUTES.md)** - Complete API endpoint documentation
6. **[UI_COMPONENTS.md](./UI_COMPONENTS.md)** - Frontend components and layouts

## Key Features

- **Automated STIG Selection**: Intelligent mapping of STIGs to assets based on OS and applications
- **Collection Management**: Organize assets into logical groupings for compliance tracking
- **Asset Assignment**: Automatic and manual assignment of STIGs to infrastructure assets
- **Compliance Tracking**: Monitor STIG implementation status across enterprise environments
- **Professional Interface**: STIG Manager-compatible user experience
- **Enterprise Integration**: Works with existing asset inventory and vulnerability management systems

## Technology Stack

- **Frontend**: React + TypeScript with shadcn/ui components
- **Backend**: Node.js + Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Multi-method enterprise authentication support
- **Integration**: Asset inventory integration with 84+ enterprise assets

## Getting Started

Refer to the individual documentation files for detailed implementation guidance. Each document provides complete specifications for reproducing the system functionality in any compatible environment.