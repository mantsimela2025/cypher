#!/usr/bin/env node
/**
 * Create Asset Management Migration
 * Generates SQL migration for asset management tables
 */

function generateAssetManagementMigration() {
  console.log('🏗️  Generating Asset Management Migration SQL');
  console.log('==============================================\n');

  const migrationSQL = `
-- Asset Management Migration
-- Generated: ${new Date().toISOString()}

-- Create enums
CREATE TYPE enum_asset_cost_management_cost_type AS ENUM (
  'purchase',
  'lease', 
  'maintenance',
  'support',
  'license',
  'subscription',
  'upgrade',
  'repair',
  'insurance',
  'other'
);

CREATE TYPE enum_asset_cost_management_billing_cycle AS ENUM (
  'one_time',
  'monthly',
  'quarterly',
  'semi_annual',
  'annual',
  'biennial'
);

CREATE TYPE enum_asset_risk_mapping_method AS ENUM (
  'automatic',
  'manual',
  'hybrid'
);

-- Asset Cost Management Table
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_uuid UUID
);

-- Asset Cost Management Indexes
CREATE INDEX idx_asset_cost_management_asset_uuid ON asset_cost_management(asset_uuid);
CREATE INDEX idx_asset_cost_management_cost_type ON asset_cost_management(cost_type);
CREATE INDEX idx_asset_cost_management_vendor ON asset_cost_management(vendor);
CREATE INDEX idx_asset_cost_management_cost_center ON asset_cost_management(cost_center);
CREATE INDEX idx_asset_cost_management_created_at ON asset_cost_management(created_at);
CREATE INDEX idx_asset_cost_management_amount ON asset_cost_management(amount);

-- Asset Lifecycle Table
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_uuid UUID
);

-- Asset Lifecycle Indexes and Constraints
CREATE INDEX idx_asset_lifecycle_asset_uuid ON asset_lifecycle(asset_uuid);
CREATE INDEX idx_asset_lifecycle_warranty_end_date ON asset_lifecycle(warranty_end_date);
CREATE INDEX idx_asset_lifecycle_internal_eol_date ON asset_lifecycle(internal_eol_date);
CREATE INDEX idx_asset_lifecycle_replacement_budget_year ON asset_lifecycle(replacement_budget_year);
CREATE INDEX idx_asset_lifecycle_purchase_date ON asset_lifecycle(purchase_date);
CREATE UNIQUE INDEX asset_lifecycle_asset_uuid_unique ON asset_lifecycle(asset_uuid);

-- Asset Operational Costs Table
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  asset_uuid UUID
);

-- Asset Operational Costs Indexes and Constraints
CREATE INDEX idx_asset_operational_costs_asset_uuid ON asset_operational_costs(asset_uuid);
CREATE INDEX idx_asset_operational_costs_year_month ON asset_operational_costs(year_month);
CREATE INDEX idx_asset_operational_costs_asset_year_month ON asset_operational_costs(asset_uuid, year_month);
CREATE UNIQUE INDEX asset_operational_costs_asset_year_month_unique ON asset_operational_costs(asset_uuid, year_month);

-- Asset Risk Mapping Table
CREATE TABLE asset_risk_mapping (
  id SERIAL PRIMARY KEY,
  asset_uuid UUID,
  existing_asset_id INTEGER,
  risk_model_id INTEGER,
  cost_center_id INTEGER,
  mapping_confidence DECIMAL(3,2) DEFAULT 0.85,
  mapping_method enum_asset_risk_mapping_method DEFAULT 'automatic',
  mapping_criteria JSONB,
  verified_by INTEGER REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset Risk Mapping Indexes and Constraints
CREATE UNIQUE INDEX asset_risk_mapping_asset_uuid_existing__key ON asset_risk_mapping(asset_uuid, existing_asset_id);
CREATE INDEX idx_asset_risk_mapping_asset_uuid ON asset_risk_mapping(asset_uuid);
CREATE INDEX idx_asset_risk_mapping_existing_asset ON asset_risk_mapping(existing_asset_id);
CREATE INDEX idx_asset_risk_mapping_risk_model_id ON asset_risk_mapping(risk_model_id);
CREATE INDEX idx_asset_risk_mapping_cost_center_id ON asset_risk_mapping(cost_center_id);
CREATE INDEX idx_asset_risk_mapping_mapping_method ON asset_risk_mapping(mapping_method);
CREATE INDEX idx_asset_risk_mapping_mapping_confidence ON asset_risk_mapping(mapping_confidence);
CREATE INDEX idx_asset_risk_mapping_verified_by ON asset_risk_mapping(verified_by);

-- Asset Groups Table
CREATE TABLE asset_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  group_type VARCHAR(100),
  parent_group_id INTEGER REFERENCES asset_groups(id),
  metadata JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Asset Groups Indexes
CREATE INDEX idx_asset_groups_name ON asset_groups(name);
CREATE INDEX idx_asset_groups_group_type ON asset_groups(group_type);
CREATE INDEX idx_asset_groups_parent_group_id ON asset_groups(parent_group_id);

-- Asset Group Members Table
CREATE TABLE asset_group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES asset_groups(id) ON DELETE CASCADE,
  asset_uuid UUID NOT NULL,
  added_by INTEGER REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Asset Group Members Indexes and Constraints
CREATE UNIQUE INDEX asset_group_members_group_asset_unique ON asset_group_members(group_id, asset_uuid);
CREATE INDEX idx_asset_group_members_group_id ON asset_group_members(group_id);
CREATE INDEX idx_asset_group_members_asset_uuid ON asset_group_members(asset_uuid);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_asset_cost_management_updated_at 
  BEFORE UPDATE ON asset_cost_management 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_lifecycle_updated_at 
  BEFORE UPDATE ON asset_lifecycle 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_operational_costs_updated_at 
  BEFORE UPDATE ON asset_operational_costs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_risk_mapping_updated_at 
  BEFORE UPDATE ON asset_risk_mapping 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_groups_updated_at 
  BEFORE UPDATE ON asset_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE asset_cost_management IS 'Tracks all financial costs associated with assets including purchase, maintenance, licenses, etc.';
COMMENT ON TABLE asset_lifecycle IS 'Manages asset lifecycle information including purchase dates, warranties, EOL dates, and replacement planning.';
COMMENT ON TABLE asset_operational_costs IS 'Tracks monthly operational costs for assets including power, space, network, storage, and labor costs.';
COMMENT ON TABLE asset_risk_mapping IS 'Maps assets to risk models and cost centers with confidence scoring for AI optimization.';
COMMENT ON TABLE asset_groups IS 'Organizes assets into logical groups for management and reporting purposes.';
COMMENT ON TABLE asset_group_members IS 'Defines membership relationships between assets and groups.';

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Migration complete
SELECT 'Asset Management tables created successfully!' as status;
`;

  console.log('📄 Generated Migration SQL:');
  console.log('===========================');
  console.log(migrationSQL);

  console.log('\n💾 To apply this migration:');
  console.log('===========================');
  console.log('1. Save the SQL to a file: migration_asset_management.sql');
  console.log('2. Run: psql -d your_database -f migration_asset_management.sql');
  console.log('3. Or use your preferred database migration tool');

  console.log('\n🔧 Migration Features:');
  console.log('======================');
  console.log('• Creates all asset management tables with proper constraints');
  console.log('• Adds performance indexes for optimal query performance');
  console.log('• Sets up foreign key relationships with users table');
  console.log('• Creates enums for data integrity');
  console.log('• Adds unique constraints to prevent data duplication');
  console.log('• Includes automatic updated_at triggers');
  console.log('• Adds table comments for documentation');

  return migrationSQL;
}

// Run if executed directly
if (require.main === module) {
  generateAssetManagementMigration();
}

module.exports = { generateAssetManagementMigration };
