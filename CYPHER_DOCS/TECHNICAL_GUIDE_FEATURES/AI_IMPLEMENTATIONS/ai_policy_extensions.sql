-- AI Policy Generation Extensions
-- Add these columns to existing policies and procedures tables

-- ============================================================================
-- EXTEND EXISTING POLICIES TABLE
-- ============================================================================

-- Add AI generation tracking to policies table
ALTER TABLE policies ADD COLUMN IF NOT EXISTS system_id VARCHAR(255);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS asset_ids JSONB;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS ai_prompt TEXT;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS generation_source VARCHAR(100) DEFAULT 'manual';
ALTER TABLE policies ADD COLUMN IF NOT EXISTS template_type VARCHAR(100);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS compliance_framework VARCHAR(100);
ALTER TABLE policies ADD COLUMN IF NOT EXISTS auto_update BOOLEAN DEFAULT false;

-- Add comments for new columns
COMMENT ON COLUMN policies.system_id IS 'System UUID from ingestion data used for generation';
COMMENT ON COLUMN policies.asset_ids IS 'JSONB array of asset IDs this policy covers';
COMMENT ON COLUMN policies.ai_prompt IS 'Custom AI instructions used for generation';
COMMENT ON COLUMN policies.ai_model IS 'AI model used for generation (e.g., gpt-4o)';
COMMENT ON COLUMN policies.generation_source IS 'Source: manual, ai_generated, template';
COMMENT ON COLUMN policies.template_type IS 'Template used: nist, fedramp, fisma, custom';
COMMENT ON COLUMN policies.compliance_framework IS 'Primary compliance framework addressed';
COMMENT ON COLUMN policies.auto_update IS 'Whether to auto-update when source data changes';

-- ============================================================================
-- EXTEND EXISTING PROCEDURES TABLE
-- ============================================================================

-- Add AI generation tracking to procedures table
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS system_id VARCHAR(255);
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS asset_ids JSONB;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS ai_prompt TEXT;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS ai_model VARCHAR(50);
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS generation_source VARCHAR(100) DEFAULT 'manual';
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS template_type VARCHAR(100);
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS compliance_controls JSONB;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS vulnerability_context JSONB;
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS automation_level VARCHAR(50) DEFAULT 'manual';

-- Add comments for new columns
COMMENT ON COLUMN procedures.system_id IS 'System UUID from ingestion data used for generation';
COMMENT ON COLUMN procedures.asset_ids IS 'JSONB array of asset IDs this procedure covers';
COMMENT ON COLUMN procedures.ai_prompt IS 'Custom AI instructions used for generation';
COMMENT ON COLUMN procedures.ai_model IS 'AI model used for generation';
COMMENT ON COLUMN procedures.generation_source IS 'Source: manual, ai_generated, template';
COMMENT ON COLUMN procedures.template_type IS 'Template framework used';
COMMENT ON COLUMN procedures.compliance_controls IS 'NIST controls addressed by this procedure';
COMMENT ON COLUMN procedures.vulnerability_context IS 'Vulnerabilities this procedure addresses';
COMMENT ON COLUMN procedures.automation_level IS 'Level of automation: manual, semi_automated, automated';

-- ============================================================================
-- CREATE DOCUMENT TEMPLATES TABLE (Small Addition)
-- ============================================================================

-- Small table for AI generation templates
CREATE TABLE IF NOT EXISTS policy_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- policy, procedure, plan, assessment
    framework VARCHAR(100), -- nist, fedramp, fisma, custom
    document_type VARCHAR(100) NOT NULL, -- access_control, vulnerability_mgmt, etc.
    sections JSONB NOT NULL, -- Required sections for this template
    ai_prompt_template TEXT NOT NULL, -- Base AI prompt for this template
    required_data_sources JSONB, -- What data sources are needed
    compliance_controls JSONB, -- Which controls this template addresses
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for templates
CREATE INDEX IF NOT EXISTS idx_policy_templates_category ON policy_templates(category);
CREATE INDEX IF NOT EXISTS idx_policy_templates_framework ON policy_templates(framework);
CREATE INDEX IF NOT EXISTS idx_policy_templates_document_type ON policy_templates(document_type);

-- ============================================================================
-- UPDATE EXISTING METADATA COLUMNS
-- ============================================================================

-- Update metadata structure in existing records to include AI tracking
-- This is a safe operation that preserves existing data

UPDATE policies 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'ai_generated', false,
    'last_ai_update', null,
    'source_systems', '[]'::jsonb,
    'compliance_mappings', '{}'::jsonb
)
WHERE metadata IS NULL OR NOT metadata ? 'ai_generated';

UPDATE procedures 
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'ai_generated', false,
    'last_ai_update', null,
    'source_systems', '[]'::jsonb,
    'task_automation', '{}'::jsonb,
    'step_validation', '{}'::jsonb
)
WHERE metadata IS NULL OR NOT metadata ? 'ai_generated';

-- ============================================================================
-- INSERT SAMPLE TEMPLATES
-- ============================================================================

-- Access Control Policy Template
INSERT INTO policy_templates (
    name, category, framework, document_type, sections, ai_prompt_template, 
    required_data_sources, compliance_controls, created_by
) VALUES (
    'NIST Access Control Policy',
    'policy',
    'nist',
    'access_control',
    '["Purpose and Scope", "Roles and Responsibilities", "Access Requirements", "Account Management", "Access Review", "Monitoring and Enforcement"]'::jsonb,
    'Generate a comprehensive Access Control Policy for the specified system based on NIST 800-53 AC controls. Include specific requirements for: user access provisioning, role-based access control, account lifecycle management, access reviews, and monitoring procedures. Base requirements on actual system assets, user roles, and current access patterns.',
    '["users", "assets", "roles", "access_logs", "compliance_controls"]'::jsonb,
    '["AC-1", "AC-2", "AC-3", "AC-5", "AC-6", "AC-17"]'::jsonb,
    1
),
(
    'Vulnerability Management Procedure',
    'procedure', 
    'nist',
    'vulnerability_management',
    '["Scanning Schedule", "Risk Assessment", "Remediation Priorities", "Patch Management", "Verification", "Reporting"]'::jsonb,
    'Generate detailed Vulnerability Management Procedures based on current scan data, asset criticality, and remediation history. Include specific timelines for different severity levels, escalation procedures, and verification steps. Address the actual vulnerability landscape and asset types in the environment.',
    '["vulnerabilities", "assets", "scan_results", "remediation_tracking"]'::jsonb,
    '["RA-5", "SI-2", "SI-4"]'::jsonb,
    1
),
(
    'System Security Plan Template',
    'plan',
    'fedramp',
    'system_security_plan',
    '["System Overview", "Security Controls", "System Environment", "Risk Assessment", "Continuous Monitoring"]'::jsonb,
    'Generate a comprehensive System Security Plan following FedRAMP guidelines. Include detailed system architecture, security control implementations, risk assessments, and continuous monitoring procedures. Base content on actual system inventory, implemented controls, and current security posture.',
    '["assets", "compliance_controls", "vulnerabilities", "network_topology", "risk_assessments"]'::jsonb,
    '["AC-1", "AT-1", "AU-1", "CA-1", "CM-1", "CP-1", "IA-1", "IR-1", "MA-1", "PE-1", "PS-1", "RA-1", "SA-1", "SC-1", "SI-1"]'::jsonb,
    1
);

-- ============================================================================
-- CREATE VIEWS FOR AI POLICY ANALYTICS
-- ============================================================================

-- View for AI-generated document statistics
CREATE OR REPLACE VIEW ai_policy_analytics AS
SELECT 
    'policies' as document_type,
    generation_source,
    template_type,
    compliance_framework,
    COUNT(*) as document_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_generation_time_hours
FROM policies 
WHERE generation_source IS NOT NULL
GROUP BY generation_source, template_type, compliance_framework

UNION ALL

SELECT 
    'procedures' as document_type,
    generation_source,
    template_type,
    null as compliance_framework,
    COUNT(*) as document_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_generation_time_hours
FROM procedures 
WHERE generation_source IS NOT NULL
GROUP BY generation_source, template_type;

-- View for documents requiring updates based on source data changes
CREATE OR REPLACE VIEW policies_needing_updates AS
SELECT 
    p.id,
    p.title,
    p.system_id,
    p.last_modified,
    s.last_scan_date,
    v.last_vulnerability_update,
    CASE 
        WHEN p.auto_update = true AND (
            s.last_scan_date > p.updated_at OR 
            v.last_vulnerability_update > p.updated_at
        ) THEN 'auto_update_ready'
        WHEN s.last_scan_date > p.updated_at OR 
             v.last_vulnerability_update > p.updated_at 
        THEN 'manual_review_needed'
        ELSE 'current'
    END as update_status
FROM policies p
LEFT JOIN (
    SELECT system_id, MAX(created_at) as last_scan_date 
    FROM ingestion_vulnerabilities 
    GROUP BY system_id
) v ON p.system_id = v.system_id
LEFT JOIN (
    SELECT uuid, MAX(updated_at) as last_scan_date 
    FROM ingestion_systems 
    GROUP BY uuid
) s ON p.system_id = s.uuid
WHERE p.generation_source = 'ai_generated';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'AI Policy Extensions completed successfully!';
    RAISE NOTICE 'Extended existing policies and procedures tables with AI tracking';
    RAISE NOTICE 'Added policy_templates table for AI generation templates';
    RAISE NOTICE 'Created analytics views for AI-generated documents';
    RAISE NOTICE 'Sample templates inserted for Access Control, Vulnerability Management, and SSP';
    RAISE NOTICE 'Ready to integrate with existing Requirements Generator framework';
END $$;