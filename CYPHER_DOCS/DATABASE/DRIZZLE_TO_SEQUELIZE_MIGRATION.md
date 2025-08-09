# Drizzle to Sequelize Migration Guide

## Overview
This guide outlines the complete migration from Drizzle ORM to Sequelize models and reorganization into client/server folder structure.

## Migration Summary

### Phase 1: Core Models Conversion ✅ COMPLETED
**Core Security Models:**
- [x] User model (users table) - Authentication and role management
- [x] AccessRequest model (access_requests table) - User access workflow
- [x] Vulnerability model (vulnerabilities table) - Security vulnerability tracking
- [x] Asset model (assets table) - IT asset inventory
- [x] POAM model (plan_of_action_milestones table) - Remediation planning
- [x] STIG model (stigs table) - Security compliance automation

**Patch Management Models:**
- [x] Patch model (patches table) - Software patch tracking
- [x] Schedule model (schedules table) - Deployment scheduling
- [x] Deployment model (deployments table) - Patch deployment execution

**Policy and Compliance Models:**
- [x] Policy model (policies table) - Organizational policies
- [x] PolicyWorkflow model (policy_workflows table) - Policy workflow management
- [x] PolicyWorkflowPolicy model (policy_workflow_policies table) - Workflow-policy mapping
- [x] PolicyWorkflowHistory model (policy_workflow_history table) - Workflow audit trail
- [x] PolicyProcedure model (policy_procedures table) - Policy implementation procedures
- [x] ComplianceControl model (compliance_controls table) - NIST 800-53 controls
- [x] ComplianceFramework model (compliance_frameworks table) - Compliance standards
- [x] SystemComplianceStatus model (system_compliance_status table) - System-level compliance
- [x] ControlComplianceStatus model (control_compliance_status table) - Control-level compliance

**Cost Management Models:**
- [x] CostCategory model (cost_categories table) - Cost classification
- [x] AssetCost model (asset_costs table) - Asset cost tracking
- [x] VulnerabilityCost model (vulnerability_cost_factors table) - Vulnerability remediation costs

**Dashboard and Reporting Models:**
- [x] Metric model (metrics table) - Custom dashboard metrics
- [x] Dashboard model (dashboards table) - Dashboard configurations
- [x] DashboardMetric model (dashboard_metrics table) - Legacy metric support
- [x] ReportTemplate model (report_templates table) - Report generation

**System Administration Models:**
- [x] Setting model (settings table) - Application configuration
- [x] AuditLog model (audit_logs table) - Security audit trail
- [x] EmailLog model (email_logs table) - Email notification tracking

**Total: 27 Sequelize Models Created**

### Phase 2: Folder Structure Reorganization
```
Current Structure:
├── shared/
├── server/
├── client/
├── config/
├── public/
└── other files...

Target Structure:
├── client/           # All frontend code
│   ├── src/
│   ├── public/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/
│   └── assets/
├── server/           # All backend code
│   ├── models/       # Sequelize models
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── lib/
│   ├── config/
│   └── utils/
└── shared/           # Shared types and utilities
    ├── types/
    ├── constants/
    └── utils/
```

## Sequelize Model Features

### Model Structure
Each Sequelize model includes:
- TypeScript interfaces for attributes and creation
- Model class extending Sequelize Model
- Initialization function with table configuration
- Proper foreign key relationships
- Validation rules
- Timestamps handling

### Key Improvements
1. **Type Safety**: Full TypeScript support with proper typing
2. **Associations**: Comprehensive model relationships
3. **Validation**: Built-in data validation
4. **Hooks**: Lifecycle hooks for business logic
5. **Transactions**: Native transaction support
6. **Connection Pooling**: Optimized database connections

## Database Associations

### User Relationships
- User hasMany AccessRequest (processedBy)
- User hasMany POAM (assignedTo, approvedBy)
- User hasMany AuditLog (userId)

### Asset Relationships
- Asset hasMany Vulnerability (assetId)
- Asset hasMany POAM (assetId)
- Asset hasMany AssetCost (assetId)

### Vulnerability Relationships
- Vulnerability belongsTo Asset (assetId)
- Vulnerability hasMany POAM (vulnerabilityId)
- Vulnerability hasMany VulnerabilityCost (vulnerabilityId)

### POAM Relationships
- POAM belongsTo Vulnerability (vulnerabilityId)
- POAM belongsTo Asset (assetId)
- POAM belongsTo ComplianceControl (controlId)
- POAM belongsTo User (assignedTo, approvedBy)

### Cost Relationships
- CostCategory hasMany AssetCost (categoryId)
- CostCategory hasMany VulnerabilityCost (categoryId)
- AssetCost belongsTo Asset and CostCategory
- VulnerabilityCost belongsTo Vulnerability and CostCategory

### Compliance Relationships
- ComplianceControl hasMany POAM (controlId)
- ComplianceControl hasMany STIG (controlId)
- STIG belongsTo ComplianceControl (controlId)

## Usage Examples

### Initializing Database
```typescript
import { initializeDatabase } from './server/models/database';

const sequelize = await initializeDatabase();
```

### Model Operations
```typescript
import { User, Vulnerability, Asset } from './server/models';

// Create new user
const user = await User.create({
  username: 'admin',
  password: 'hashedPassword',
  role: 'admin'
});

// Find vulnerabilities with assets
const vulnerabilities = await Vulnerability.findAll({
  include: [{
    model: Asset,
    as: 'asset'
  }]
});

// Update POAM with associations
const poam = await POAM.update(
  { status: 'completed' },
  { 
    where: { id: 1 },
    include: ['vulnerability', 'asset', 'assignee']
  }
);
```

### Complex Queries with Associations
```typescript
// Get user with all assigned POAMs and their vulnerabilities
const userWithPoams = await User.findByPk(1, {
  include: [{
    model: POAM,
    as: 'assignedPoams',
    include: [{
      model: Vulnerability,
      as: 'vulnerability',
      include: [{
        model: Asset,
        as: 'asset'
      }]
    }]
  }]
});

// Get assets with vulnerability counts
const assetsWithVulnCounts = await Asset.findAll({
  include: [{
    model: Vulnerability,
    as: 'vulnerabilities',
    attributes: []
  }],
  attributes: [
    'id',
    'name',
    'ipAddress',
    [sequelize.fn('COUNT', sequelize.col('vulnerabilities.id')), 'vulnerabilityCount']
  ],
  group: ['Asset.id']
});
```

## Migration Benefits

### 1. Better Performance
- Connection pooling
- Query optimization
- Lazy loading
- Eager loading control

### 2. Enhanced Development Experience
- Rich TypeScript support
- IDE autocompletion
- Compile-time error checking
- Clear model relationships

### 3. Advanced Features
- Built-in validation
- Lifecycle hooks
- Transaction support
- Database migrations
- Seed data management

### 4. Better Testing
- Model mocking
- Test database setup
- Transaction rollback in tests
- Fixture management

## Environment Configuration

### Database Connection
```typescript
// Environment variables required
DATABASE_URL=postgresql://user:password@host:port/database
DB_POOL_MAX=10
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
NODE_ENV=development|production
```

### Production Considerations
- SSL connection enforcement
- Connection pool optimization
- Query logging disabled
- Error handling enhancement
- Health check endpoints

## Next Steps

### Phase 3: Service Layer Migration
- [ ] Update service files to use Sequelize models
- [ ] Migrate repository patterns
- [ ] Update API routes
- [ ] Convert query builders

### Phase 4: Client-Server Separation
- [ ] Move all client code to /client folder
- [ ] Move all server code to /server folder
- [ ] Update import paths
- [ ] Configure build processes

### Phase 5: Testing & Validation
- [ ] Update unit tests
- [ ] Integration test migration
- [ ] Performance benchmarking
- [ ] Data migration validation

## File Locations

### New Sequelize Models
- `server/models/index.ts` - Main model exports and initialization
- `server/models/database.ts` - Database configuration and connection
- `server/models/User.ts` - User model definition
- `server/models/Vulnerability.ts` - Vulnerability model definition
- `server/models/Asset.ts` - Asset model definition
- `server/models/POAM.ts` - POAM model definition
- `server/models/ComplianceControl.ts` - Compliance control model
- `server/models/[...].ts` - Additional model files

### Migration Support
- `DRIZZLE_TO_SEQUELIZE_MIGRATION.md` - This migration guide
- `server/models/database.ts` - Database utilities and connection management

The core Sequelize models are now ready for use. The next phase involves updating your service layer and reorganizing the folder structure as outlined above.