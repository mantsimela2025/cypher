#!/usr/bin/env node
/**
 * Create Authorization to Operate Migration
 * Generates SQL migration for ATO tables
 */

function generateATOMigration() {
  console.log('🏗️  Generating Authorization to Operate Migration SQL');
  console.log('====================================================\n');

  const migrationSQL = `
-- Authorization to Operate Migration
-- Generated: ${new Date().toISOString()}

-- Create enums for authorizations_to_operate table
CREATE TYPE enum_authorizations_to_operate_type AS ENUM (
  'full',
  'interim',
  'provisional',
  'conditional'
);

CREATE TYPE enum_authorizations_to_operate_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'pending_approval',
  'approved',
  'rejected',
  'expired',
  'revoked'
);

-- Create enums for ato_workflow_history table
CREATE TYPE enum_ato_workflow_history_approval_role AS ENUM (
  'system_owner',
  'authorizing_official',
  'security_officer',
  'privacy_officer',
  'risk_executive',
  'cio',
  'ciso',
  'reviewer',
  'approver'
);

CREATE TYPE enum_ato_workflow_history_workflow_stage AS ENUM (
  'initial_submission',
  'security_review',
  'privacy_review',
  'risk_assessment',
  'technical_review',
  'management_review',
  'final_approval',
  'continuous_monitoring',
  'reauthorization'
);

-- Authorizations to Operate Table
CREATE TABLE authorizations_to_operate (
  id SERIAL PRIMARY KEY,
  ssp_id INTEGER NOT NULL,
  type enum_authorizations_to_operate_type DEFAULT 'full' NOT NULL,
  status enum_authorizations_to_operate_status DEFAULT 'draft' NOT NULL,
  submission_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  authorized_by INTEGER REFERENCES users(id),
  authorization_memo TEXT,
  authorization_conditions TEXT,
  risk_level VARCHAR(50),
  continuous_monitoring_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Authorizations to Operate Indexes
CREATE INDEX idx_authorizations_to_operate_ssp_id ON authorizations_to_operate(ssp_id);
CREATE INDEX idx_authorizations_to_operate_status ON authorizations_to_operate(status);
CREATE INDEX idx_authorizations_to_operate_type ON authorizations_to_operate(type);
CREATE INDEX idx_authorizations_to_operate_authorized_by ON authorizations_to_operate(authorized_by);
CREATE INDEX idx_authorizations_to_operate_submission_date ON authorizations_to_operate(submission_date);
CREATE INDEX idx_authorizations_to_operate_approval_date ON authorizations_to_operate(approval_date);
CREATE INDEX idx_authorizations_to_operate_expiration_date ON authorizations_to_operate(expiration_date);
CREATE INDEX idx_authorizations_to_operate_risk_level ON authorizations_to_operate(risk_level);
CREATE INDEX idx_authorizations_to_operate_created_at ON authorizations_to_operate(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_authorizations_to_operate_status_type ON authorizations_to_operate(status, type);
CREATE INDEX idx_authorizations_to_operate_ssp_status ON authorizations_to_operate(ssp_id, status);
CREATE INDEX idx_authorizations_to_operate_expiration_status ON authorizations_to_operate(expiration_date, status);

-- Unique constraint to ensure one active ATO per SSP (conditional unique index)
CREATE UNIQUE INDEX authorizations_to_operate_ssp_active_unique 
  ON authorizations_to_operate(ssp_id, status) 
  WHERE status IN ('approved', 'under_review', 'pending_approval');

-- ATO Workflow History Table
CREATE TABLE ato_workflow_history (
  id SERIAL PRIMARY KEY,
  ato_id INTEGER NOT NULL REFERENCES authorizations_to_operate(id),
  action VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL,
  comments TEXT,
  performed_by INTEGER NOT NULL REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  approval_role enum_ato_workflow_history_approval_role,
  workflow_stage enum_ato_workflow_history_workflow_stage DEFAULT 'initial_submission' NOT NULL,
  signature TEXT
);

-- ATO Workflow History Indexes
CREATE INDEX idx_ato_workflow_history_ato_id ON ato_workflow_history(ato_id);
CREATE INDEX idx_ato_workflow_history_action ON ato_workflow_history(action);
CREATE INDEX idx_ato_workflow_history_status ON ato_workflow_history(status);
CREATE INDEX idx_ato_workflow_history_performed_by ON ato_workflow_history(performed_by);
CREATE INDEX idx_ato_workflow_history_performed_at ON ato_workflow_history(performed_at);
CREATE INDEX idx_ato_workflow_history_approval_role ON ato_workflow_history(approval_role);
CREATE INDEX idx_ato_workflow_history_workflow_stage ON ato_workflow_history(workflow_stage);

-- Composite indexes for common query patterns
CREATE INDEX idx_ato_workflow_history_ato_action ON ato_workflow_history(ato_id, action);
CREATE INDEX idx_ato_workflow_history_ato_stage ON ato_workflow_history(ato_id, workflow_stage);
CREATE INDEX idx_ato_workflow_history_ato_performed ON ato_workflow_history(ato_id, performed_at);
CREATE INDEX idx_ato_workflow_history_stage_status ON ato_workflow_history(workflow_stage, status);
CREATE INDEX idx_ato_workflow_history_role_action ON ato_workflow_history(approval_role, action);

-- ATO Documents Table
CREATE TABLE ato_documents (
  id SERIAL PRIMARY KEY,
  ato_id INTEGER NOT NULL REFERENCES authorizations_to_operate(id),
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_location VARCHAR(500) NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ATO Documents Indexes
CREATE INDEX idx_ato_documents_ato_id ON ato_documents(ato_id);
CREATE INDEX idx_ato_documents_document_type ON ato_documents(document_type);
CREATE INDEX idx_ato_documents_file_name ON ato_documents(file_name);
CREATE INDEX idx_ato_documents_uploaded_by ON ato_documents(uploaded_by);
CREATE INDEX idx_ato_documents_uploaded_at ON ato_documents(uploaded_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_ato_documents_ato_document_type ON ato_documents(ato_id, document_type);
CREATE INDEX idx_ato_documents_ato_uploaded ON ato_documents(ato_id, uploaded_at);
CREATE INDEX idx_ato_documents_type_uploaded ON ato_documents(document_type, uploaded_at);

-- Unique constraint to prevent duplicate document types per ATO
CREATE UNIQUE INDEX ato_documents_ato_document_type_unique ON ato_documents(ato_id, document_type, file_name);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_authorizations_to_operate_updated_at 
  BEFORE UPDATE ON authorizations_to_operate 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE authorizations_to_operate IS 'Stores Authorization to Operate (ATO) records with lifecycle management, approval tracking, and expiration monitoring.';
COMMENT ON TABLE ato_workflow_history IS 'Tracks complete audit trail of ATO workflow actions, approvals, and status changes with role-based tracking.';
COMMENT ON TABLE ato_documents IS 'Manages ATO-related documents with secure file storage, version control, and access tracking.';

COMMENT ON COLUMN authorizations_to_operate.type IS 'Type of ATO: full, interim, provisional, or conditional';
COMMENT ON COLUMN authorizations_to_operate.status IS 'Current status in the ATO lifecycle workflow';
COMMENT ON COLUMN authorizations_to_operate.ssp_id IS 'Reference to the System Security Plan';
COMMENT ON COLUMN authorizations_to_operate.submission_date IS 'Date when ATO was submitted for review';
COMMENT ON COLUMN authorizations_to_operate.approval_date IS 'Date when ATO was approved';
COMMENT ON COLUMN authorizations_to_operate.expiration_date IS 'Date when ATO expires and requires reauthorization';
COMMENT ON COLUMN authorizations_to_operate.authorized_by IS 'User who granted the authorization';
COMMENT ON COLUMN authorizations_to_operate.authorization_memo IS 'Official authorization memorandum';
COMMENT ON COLUMN authorizations_to_operate.authorization_conditions IS 'Conditions and requirements for the authorization';
COMMENT ON COLUMN authorizations_to_operate.risk_level IS 'Assessed risk level (low, moderate, high)';
COMMENT ON COLUMN authorizations_to_operate.continuous_monitoring_plan IS 'Plan for ongoing security monitoring';

COMMENT ON COLUMN ato_workflow_history.action IS 'Action performed (submit, review, approve, reject, etc.)';
COMMENT ON COLUMN ato_workflow_history.status IS 'Status after the action was performed';
COMMENT ON COLUMN ato_workflow_history.approval_role IS 'Role of the person performing the action';
COMMENT ON COLUMN ato_workflow_history.workflow_stage IS 'Current stage in the ATO workflow process';
COMMENT ON COLUMN ato_workflow_history.signature IS 'Digital signature or approval signature';

COMMENT ON COLUMN ato_documents.document_type IS 'Type of document (SSP, SAR, POA&M, etc.)';
COMMENT ON COLUMN ato_documents.file_location IS 'Secure file storage location or path';

-- Insert sample data for testing (optional)
-- INSERT INTO authorizations_to_operate (ssp_id, type, status, risk_level) VALUES
-- (1, 'full', 'draft', 'moderate'),
-- (2, 'interim', 'submitted', 'low'),
-- (3, 'provisional', 'under_review', 'high');

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON authorizations_to_operate TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ato_workflow_history TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ato_documents TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Migration complete
SELECT 'Authorization to Operate tables created successfully!' as status;
`;

  console.log('📄 Generated Migration SQL:');
  console.log('===========================');
  console.log(migrationSQL);

  console.log('\n💾 To apply this migration:');
  console.log('===========================');
  console.log('1. Save the SQL to a file: migration_ato.sql');
  console.log('2. Run: psql -d your_database -f migration_ato.sql');
  console.log('3. Or use your preferred database migration tool');

  console.log('\n🔧 Migration Features:');
  console.log('======================');
  console.log('• Creates authorizations_to_operate table for ATO lifecycle management');
  console.log('• Creates ato_workflow_history table for complete audit trail');
  console.log('• Creates ato_documents table for document management');
  console.log('• Adds comprehensive indexes for optimal query performance');
  console.log('• Sets up foreign key relationships with users table');
  console.log('• Creates enums for data integrity and workflow consistency');
  console.log('• Includes unique constraints to prevent duplicate active ATOs');
  console.log('• Adds automatic updated_at triggers');
  console.log('• Includes detailed table and column comments');

  console.log('\n🎯 ATO Workflow Supported:');
  console.log('==========================');
  console.log('• Draft → Submitted → Under Review → Pending Approval → Approved');
  console.log('• Role-based approvals with digital signature support');
  console.log('• Complete audit trail of all workflow actions');
  console.log('• Document management with version control');
  console.log('• Expiration tracking and reauthorization support');
  console.log('• Continuous monitoring plan management');
  console.log('• Risk assessment and condition tracking');

  console.log('\n📋 ATO Types Supported:');
  console.log('=======================');
  console.log('• Full ATO - Complete authorization for full operations');
  console.log('• Interim ATO - Temporary authorization pending full review');
  console.log('• Provisional ATO - Limited authorization with conditions');
  console.log('• Conditional ATO - Authorization with specific requirements');

  console.log('\n👥 Approval Roles Supported:');
  console.log('============================');
  console.log('• System Owner - Responsible for system operations');
  console.log('• Authorizing Official - Final approval authority');
  console.log('• Security Officer - Security review and approval');
  console.log('• Privacy Officer - Privacy impact assessment');
  console.log('• Risk Executive - Risk assessment and acceptance');
  console.log('• CIO/CISO - Executive level approvals');

  return migrationSQL;
}

// Run if executed directly
if (require.main === module) {
  generateATOMigration();
}

module.exports = { generateATOMigration };
