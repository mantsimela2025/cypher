# Asset Management Database Schemas

## Overview
This document describes the asset management database schemas that extend the core asset tracking with comprehensive cost management, lifecycle tracking, operational costs, and risk mapping capabilities.

## Tables

### 1. asset_cost_management
Tracks all financial aspects of asset management including purchases, leases, maintenance, and operational costs.

#### Schema
```sql
CREATE TABLE asset_cost_management (
  id SERIAL PRIMARY KEY,
  cost_type enum_asset_cost_management_cost_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle enum_asset_cost_management_billing_cycle DEFAULT 'one_time',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  vendor VARCHAR(255),
  contract_number VARCHAR(255),
  purchase_order VARCHAR(255),
  invoice_number VARCHAR(255),
  cost_center VARCHAR(255),
  budget_code VARCHAR(255),
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  last_modified_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  asset_uuid UUID
);
```

#### Enums
- **cost_type**: purchase, lease, maintenance, support, license, subscription, upgrade, repair, insurance, other
- **billing_cycle**: one_time, monthly, quarterly, semi_annual, annual, biennial

#### Usage Examples
```javascript
// Track a server purchase
await db.insert(assetCostManagement).values({
  costType: 'purchase',
  amount: '15000.00',
  currency: 'USD',
  billingCycle: 'one_time',
  vendor: 'Dell Technologies',
  contractNumber: 'DELL-2025-001',
  purchaseOrder: 'PO-2025-0123',
  costCenter: 'IT-INFRASTRUCTURE',
  budgetCode: 'CAPEX-2025-Q1',
  assetUuid: '550e8400-e29b-41d4-a716-446655440000'
});

// Track monthly software license
await db.insert(assetCostManagement).values({
  costType: 'license',
  amount: '299.99',
  currency: 'USD',
  billingCycle: 'monthly',
  vendor: 'Microsoft',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
  assetUuid: '550e8400-e29b-41d4-a716-446655440000'
});
```

### 2. asset_lifecycle
Manages asset lifecycle from purchase through end-of-life, including warranty tracking and replacement planning.

#### Schema
```sql
CREATE TABLE asset_lifecycle (
  id SERIAL PRIMARY KEY,
  purchase_date DATE,
  warranty_end_date DATE,
  manufacturer_eol_date DATE,
  internal_eol_date DATE,
  replacement_cycle_months INTEGER,
  estimated_replacement_cost DECIMAL(15,2),
  replacement_budget_year INTEGER,
  replacement_budget_quarter INTEGER,
  replacement_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  asset_uuid UUID
);
```

#### Usage Examples
```javascript
// Track server lifecycle
await db.insert(assetLifecycle).values({
  purchaseDate: '2025-01-15',
  warrantyEndDate: '2028-01-15',
  manufacturerEolDate: '2030-01-15',
  internalEolDate: '2029-06-30',
  replacementCycleMonths: 48,
  estimatedReplacementCost: '18000.00',
  replacementBudgetYear: 2029,
  replacementBudgetQuarter: 2,
  replacementNotes: 'Consider cloud migration before replacement',
  assetUuid: '550e8400-e29b-41d4-a716-446655440000'
});
```

### 3. asset_operational_costs
Tracks monthly operational costs broken down by category (power, space, network, storage, labor).

#### Schema
```sql
CREATE TABLE asset_operational_costs (
  id SERIAL PRIMARY KEY,
  year_month DATE NOT NULL,
  power_cost DECIMAL(15,2),
  space_cost DECIMAL(15,2),
  network_cost DECIMAL(15,2),
  storage_cost DECIMAL(15,2),
  labor_cost DECIMAL(15,2),
  other_costs DECIMAL(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  asset_uuid UUID
);
```

#### Usage Examples
```javascript
// Track January 2025 operational costs
await db.insert(assetOperationalCosts).values({
  yearMonth: '2025-01-01',
  powerCost: '245.50',
  spaceCost: '150.00',
  networkCost: '89.99',
  storageCost: '125.00',
  laborCost: '500.00',
  otherCosts: '25.00',
  notes: 'Increased power costs due to higher utilization',
  assetUuid: '550e8400-e29b-41d4-a716-446655440000'
});
```

### 4. asset_risk_mapping
Links assets to risk models and cost centers with confidence scoring and verification tracking.

#### Schema
```sql
CREATE TABLE asset_risk_mapping (
  id SERIAL PRIMARY KEY,
  asset_uuid UUID,
  existing_asset_id INTEGER,
  risk_model_id INTEGER,
  cost_center_id INTEGER,
  mapping_confidence DECIMAL(3,2) DEFAULT 0.85,
  mapping_method VARCHAR(50) DEFAULT 'automatic',
  mapping_criteria JSONB,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(asset_uuid, existing_asset_id)
);
```

#### Indexes
- `idx_asset_risk_mapping_asset_uuid` on `asset_uuid`
- `idx_asset_risk_mapping_existing_asset` on `existing_asset_id`

#### Usage Examples
```javascript
// Map asset to risk model
await db.insert(assetRiskMapping).values({
  assetUuid: '550e8400-e29b-41d4-a716-446655440000',
  existingAssetId: 12345,
  riskModelId: 1,
  costCenterId: 100,
  mappingConfidence: 0.95,
  mappingMethod: 'manual',
  mappingCriteria: {
    criteria: ['hostname_match', 'ip_match', 'location_match'],
    scores: [0.98, 0.92, 0.95]
  },
  verifiedBy: 1,
  verifiedAt: new Date()
});
```

## Relationships

### Asset UUID Linking
All tables link to assets via `asset_uuid` field:
- Links to the main `assets` table
- Enables comprehensive asset tracking across all dimensions
- Supports asset lifecycle management

### User Tracking
Cost management and risk mapping tables track user actions:
- `created_by` - User who created the record
- `last_modified_by` - User who last updated the record
- `verified_by` - User who verified risk mappings

## Common Queries

### Total Cost of Ownership (TCO)
```sql
-- Get total costs for an asset
SELECT 
  a.hostname,
  SUM(acm.amount) as total_cost,
  COUNT(acm.id) as cost_entries
FROM assets a
LEFT JOIN asset_cost_management acm ON a.asset_uuid = acm.asset_uuid
WHERE a.asset_uuid = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY a.hostname;
```

### Assets Approaching EOL
```sql
-- Find assets approaching end-of-life
SELECT 
  a.hostname,
  al.warranty_end_date,
  al.manufacturer_eol_date,
  al.internal_eol_date,
  al.estimated_replacement_cost
FROM assets a
JOIN asset_lifecycle al ON a.asset_uuid = al.asset_uuid
WHERE al.internal_eol_date <= CURRENT_DATE + INTERVAL '6 months'
ORDER BY al.internal_eol_date;
```

### Monthly Operational Costs
```sql
-- Get operational costs by month
SELECT 
  year_month,
  SUM(power_cost) as total_power,
  SUM(space_cost) as total_space,
  SUM(network_cost) as total_network,
  SUM(storage_cost) as total_storage,
  SUM(labor_cost) as total_labor
FROM asset_operational_costs
WHERE year_month >= '2025-01-01'
GROUP BY year_month
ORDER BY year_month;
```

### Risk Mapping Confidence
```sql
-- Find low-confidence risk mappings
SELECT 
  a.hostname,
  arm.mapping_confidence,
  arm.mapping_method,
  arm.verified_at
FROM assets a
JOIN asset_risk_mapping arm ON a.asset_uuid = arm.asset_uuid
WHERE arm.mapping_confidence < 0.80
  AND arm.verified_at IS NULL
ORDER BY arm.mapping_confidence;
```

## Best Practices

### Cost Management
1. **Regular Updates**: Update operational costs monthly
2. **Cost Categories**: Use consistent cost types and billing cycles
3. **Documentation**: Include detailed notes and attachments
4. **Budget Tracking**: Link to cost centers and budget codes

### Lifecycle Management
1. **Proactive Planning**: Set internal EOL dates before manufacturer EOL
2. **Replacement Budgeting**: Plan replacement costs in advance
3. **Warranty Tracking**: Monitor warranty expiration dates
4. **Documentation**: Maintain detailed replacement notes

### Risk Mapping
1. **Confidence Scoring**: Use realistic confidence scores
2. **Verification**: Verify automated mappings manually
3. **Criteria Documentation**: Document mapping criteria in JSONB
4. **Regular Review**: Review and update mappings periodically

## Integration Points

### With Existing Systems
- **Assets Table**: Core asset information
- **Users Table**: User tracking and verification
- **Vulnerabilities**: Risk assessment integration
- **Controls**: Compliance and security controls

### With External Systems
- **Financial Systems**: Cost center and budget integration
- **CMDB**: Configuration management database
- **Risk Management**: Risk model integration
- **Procurement**: Purchase order and vendor management
