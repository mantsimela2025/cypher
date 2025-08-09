# Asset Management Database Schemas

## Overview
This document describes the database schemas for the Asset Management system, including tables, relationships, indexes, and constraints designed to support comprehensive asset financial tracking, lifecycle management, and AI-powered cost optimization.

## Schema Architecture

### 🏗️ Design Principles
- **Performance Optimized**: Strategic indexes on all query-critical fields
- **Data Integrity**: Enum constraints and unique constraints prevent invalid data
- **Audit Trail**: User tracking for all modifications with timestamps
- **Scalability**: Efficient data types and normalized structure
- **Flexibility**: JSON metadata fields for extensible data storage
- **AI Ready**: Schema designed to support machine learning algorithms

## Tables

### 💰 asset_cost_management
**Purpose**: Tracks all financial costs associated with assets including purchases, maintenance, licenses, and operational expenses.

**Columns**:
```sql
id                  SERIAL PRIMARY KEY
cost_type           enum_asset_cost_management_cost_type NOT NULL
amount              DECIMAL(15,2) NOT NULL
currency            VARCHAR(3) DEFAULT 'USD'
billing_cycle       enum_asset_cost_management_billing_cycle DEFAULT 'one_time'
start_date          TIMESTAMPTZ
end_date            TIMESTAMPTZ
vendor              VARCHAR(255)
contract_number     VARCHAR(255)
purchase_order      VARCHAR(255)
invoice_number      VARCHAR(255)
cost_center         VARCHAR(255)
budget_code         VARCHAR(255)
notes               TEXT
attachments         JSONB DEFAULT '[]'
metadata            JSONB DEFAULT '{}'
created_by          INTEGER REFERENCES users(id)
last_modified_by    INTEGER REFERENCES users(id)
created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
asset_uuid          UUID
```

**Indexes**:
- `idx_asset_cost_management_asset_uuid` - Asset lookups
- `idx_asset_cost_management_cost_type` - Cost type filtering
- `idx_asset_cost_management_vendor` - Vendor analysis
- `idx_asset_cost_management_cost_center` - Cost center reporting
- `idx_asset_cost_management_created_at` - Time-based queries
- `idx_asset_cost_management_amount` - Cost range queries

**Enums**:
- `cost_type`: purchase, lease, maintenance, support, license, subscription, upgrade, repair, insurance, other
- `billing_cycle`: one_time, monthly, quarterly, semi_annual, annual, biennial

### 🔄 asset_lifecycle
**Purpose**: Manages asset lifecycle information including purchase dates, warranties, EOL dates, and replacement planning.

**Columns**:
```sql
id                          SERIAL PRIMARY KEY
purchase_date               DATE
warranty_end_date           DATE
manufacturer_eol_date       DATE
internal_eol_date           DATE
replacement_cycle_months    INTEGER
estimated_replacement_cost  DECIMAL(15,2)
replacement_budget_year     INTEGER
replacement_budget_quarter  INTEGER
replacement_notes           TEXT
created_at                  TIMESTAMPTZ DEFAULT NOW() NOT NULL
updated_at                  TIMESTAMPTZ DEFAULT NOW() NOT NULL
asset_uuid                  UUID
```

**Indexes**:
- `idx_asset_lifecycle_asset_uuid` - Asset lookups
- `idx_asset_lifecycle_warranty_end_date` - Warranty expiration tracking
- `idx_asset_lifecycle_internal_eol_date` - EOL planning
- `idx_asset_lifecycle_replacement_budget_year` - Budget planning
- `idx_asset_lifecycle_purchase_date` - Age calculations

**Constraints**:
- `asset_lifecycle_asset_uuid_unique` - One lifecycle record per asset

### 💡 asset_operational_costs
**Purpose**: Tracks monthly operational costs for assets including power, space, network, storage, and labor costs.

**Columns**:
```sql
id            SERIAL PRIMARY KEY
year_month    DATE NOT NULL
power_cost    DECIMAL(15,2)
space_cost    DECIMAL(15,2)
network_cost  DECIMAL(15,2)
storage_cost  DECIMAL(15,2)
labor_cost    DECIMAL(15,2)
other_costs   DECIMAL(15,2)
notes         TEXT
created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
updated_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
asset_uuid    UUID
```

**Indexes**:
- `idx_asset_operational_costs_asset_uuid` - Asset lookups
- `idx_asset_operational_costs_year_month` - Time-based queries
- `idx_asset_operational_costs_asset_year_month` - Composite queries

**Constraints**:
- `asset_operational_costs_asset_year_month_unique` - Prevents duplicate monthly records

### 🎯 asset_risk_mapping
**Purpose**: Maps assets to risk models and cost centers with confidence scoring for AI optimization.

**Columns**:
```sql
id                   SERIAL PRIMARY KEY
asset_uuid           UUID
existing_asset_id    INTEGER
risk_model_id        INTEGER
cost_center_id       INTEGER
mapping_confidence   DECIMAL(3,2) DEFAULT 0.85
mapping_method       enum_asset_risk_mapping_method DEFAULT 'automatic'
mapping_criteria     JSONB
verified_by          INTEGER REFERENCES users(id)
verified_at          TIMESTAMPTZ
created_at           TIMESTAMPTZ DEFAULT NOW()
updated_at           TIMESTAMPTZ DEFAULT NOW()
```

**Indexes**:
- `idx_asset_risk_mapping_asset_uuid` - Asset lookups
- `idx_asset_risk_mapping_existing_asset` - Legacy asset mapping
- `idx_asset_risk_mapping_risk_model_id` - Risk model queries
- `idx_asset_risk_mapping_cost_center_id` - Cost center analysis
- `idx_asset_risk_mapping_mapping_method` - Method filtering
- `idx_asset_risk_mapping_mapping_confidence` - Confidence-based queries
- `idx_asset_risk_mapping_verified_by` - Verification tracking

**Constraints**:
- `asset_risk_mapping_asset_uuid_existing__key` - Unique asset-to-existing mapping

**Enums**:
- `mapping_method`: automatic, manual, hybrid

### 📁 asset_groups
**Purpose**: Organizes assets into logical groups for management and reporting purposes.

**Columns**:
```sql
id               SERIAL PRIMARY KEY
name             VARCHAR(255) NOT NULL
description      TEXT
group_type       VARCHAR(100)
parent_group_id  INTEGER REFERENCES asset_groups(id)
metadata         JSONB DEFAULT '{}'
created_by       INTEGER REFERENCES users(id)
created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
```

**Indexes**:
- `idx_asset_groups_name` - Name-based lookups
- `idx_asset_groups_group_type` - Type filtering
- `idx_asset_groups_parent_group_id` - Hierarchical queries

### 👥 asset_group_members
**Purpose**: Defines membership relationships between assets and groups.

**Columns**:
```sql
id          SERIAL PRIMARY KEY
group_id    INTEGER REFERENCES asset_groups(id) ON DELETE CASCADE
asset_uuid  UUID NOT NULL
added_by    INTEGER REFERENCES users(id)
added_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
```

**Indexes**:
- `idx_asset_group_members_group_id` - Group membership queries
- `idx_asset_group_members_asset_uuid` - Asset group lookups

**Constraints**:
- `asset_group_members_group_asset_unique` - Prevents duplicate memberships

## Relationships

### 🔗 Foreign Key Relationships
```
asset_cost_management.created_by → users.id
asset_cost_management.last_modified_by → users.id
asset_risk_mapping.verified_by → users.id
asset_groups.created_by → users.id
asset_groups.parent_group_id → asset_groups.id
asset_group_members.group_id → asset_groups.id
asset_group_members.added_by → users.id
```

### 🔄 Asset UUID References
All tables reference assets via `asset_uuid` field, providing loose coupling with the main assets table while maintaining referential integrity through application logic.

## Performance Optimization

### 📈 Index Strategy
1. **Primary Indexes**: All tables have optimized primary key indexes
2. **Foreign Key Indexes**: All foreign keys have corresponding indexes
3. **Query Indexes**: Strategic indexes on frequently queried columns
4. **Composite Indexes**: Multi-column indexes for complex queries
5. **Unique Indexes**: Enforce business rules and prevent duplicates

### 🚀 Query Performance Features
- **Selective Indexing**: Only critical query paths are indexed
- **Composite Indexes**: Support complex filtering scenarios
- **Partial Indexes**: Future optimization opportunity for filtered queries
- **JSON Indexing**: JSONB fields support efficient JSON operations

## Data Integrity

### ✅ Constraints
1. **Primary Keys**: All tables have auto-incrementing primary keys
2. **Foreign Keys**: Referential integrity with users and self-references
3. **Unique Constraints**: Prevent logical duplicates
4. **Check Constraints**: Data validation at database level
5. **Not Null**: Critical fields cannot be null

### 🔒 Enum Constraints
- **Cost Types**: Standardized cost categorization
- **Billing Cycles**: Consistent billing period definitions
- **Mapping Methods**: Controlled risk mapping methodology

## AI & Analytics Support

### 🤖 AI-Optimized Design
1. **Numerical Precision**: DECIMAL(15,2) for accurate financial calculations
2. **Time Series Data**: Optimized for temporal analysis
3. **Confidence Scoring**: Built-in confidence metrics for ML algorithms
4. **Metadata Storage**: Flexible JSON fields for ML feature storage
5. **Audit Trail**: Complete change tracking for model training

### 📊 Analytics Features
- **Cost Aggregation**: Efficient sum/average calculations
- **Time-based Analysis**: Optimized for trend analysis
- **Categorical Analysis**: Enum-based grouping and filtering
- **Confidence Metrics**: Built-in scoring for AI recommendations

## Migration & Deployment

### 🚀 Database Setup
```bash
# Generate migration SQL
npm run generate:asset-management-migration

# Test schema structure
npm run test:asset-management-schemas

# Apply migration (example)
psql -d your_database -f migration_asset_management.sql
```

### 🔧 Maintenance
1. **Regular VACUUM**: Maintain table performance
2. **Index Monitoring**: Monitor index usage and performance
3. **Statistics Updates**: Keep query planner statistics current
4. **Constraint Validation**: Periodic constraint validation

## Security Considerations

### 🔐 Access Control
- **Row-Level Security**: Can be implemented for multi-tenant scenarios
- **Column Permissions**: Sensitive financial data protection
- **Audit Logging**: Complete change tracking with user attribution
- **Data Encryption**: Sensitive fields can be encrypted at application level

### 🛡️ Data Protection
- **Input Validation**: Enum constraints prevent invalid data
- **SQL Injection**: Parameterized queries required
- **Data Masking**: Financial data can be masked in non-production environments

## Best Practices

### 📋 Development Guidelines
1. **Always use transactions** for multi-table operations
2. **Validate enum values** at application level
3. **Use prepared statements** for all queries
4. **Monitor query performance** regularly
5. **Keep statistics updated** for optimal query plans

### 🎯 Operational Guidelines
1. **Regular backups** of financial data
2. **Monitor disk usage** for JSONB fields
3. **Archive old data** based on retention policies
4. **Monitor index bloat** and rebuild as needed
5. **Validate data integrity** periodically

## Testing

### 🧪 Schema Validation
```bash
# Test schema exports and structure
npm run test:asset-management-schemas
```

### 📊 Performance Testing
- **Load Testing**: Validate performance under load
- **Query Analysis**: EXPLAIN ANALYZE for critical queries
- **Index Usage**: Monitor index hit ratios
- **Constraint Performance**: Validate constraint checking performance

This schema design provides a robust foundation for enterprise asset management with built-in support for AI-powered cost optimization and comprehensive financial tracking.
