-- Requirements Document Generator Tables
-- This file contains the SQL schema for the AI-powered Requirements Document Generator
-- Run after creating the main ingestion tables

-- ============================================================================
-- REQUIREMENTS DOCUMENT GENERATOR TABLES
-- ============================================================================

-- Main requirements documents table
CREATE TABLE requirement_documents (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    system_id VARCHAR(255) NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    asset_ids JSONB NOT NULL, -- Array of selected asset IDs
    document_type VARCHAR(100) DEFAULT 'security_requirements',
    status VARCHAR(50) DEFAULT 'draft', -- draft, generating, completed, published
    template_type VARCHAR(100),
    generated_content TEXT,
    ai_prompt TEXT,
    ai_model VARCHAR(50),
    generation_metadata JSONB,
    gitlab_project_id VARCHAR(100),
    gitlab_issue_url VARCHAR(500),
    created_by INTEGER,
    updated_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_requirement_documents_uuid ON requirement_documents(uuid);
CREATE INDEX idx_requirement_documents_system_id ON requirement_documents(system_id);
CREATE INDEX idx_requirement_documents_status ON requirement_documents(status);
CREATE INDEX idx_requirement_documents_created_at ON requirement_documents(created_at);

-- Document sections table
CREATE TABLE requirement_sections (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES requirement_documents(id) ON DELETE CASCADE,
    section_number VARCHAR(10),
    title VARCHAR(500) NOT NULL,
    content TEXT,
    section_type VARCHAR(100), -- overview, requirements, compliance, security, etc.
    requirements JSONB, -- Array of specific requirements
    compliance_controls JSONB, -- NIST controls mapped to this section
    vulnerabilities JSONB, -- Related vulnerabilities
    assets JSONB, -- Assets covered by this section
    priority INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for sections
CREATE INDEX idx_requirement_sections_document_id ON requirement_sections(document_id);
CREATE INDEX idx_requirement_sections_section_type ON requirement_sections(section_type);
CREATE INDEX idx_requirement_sections_priority ON requirement_sections(priority);

-- Implementation tasks table
CREATE TABLE requirement_tasks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES requirement_documents(id) ON DELETE CASCADE,
    section_id INTEGER REFERENCES requirement_sections(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(100), -- implementation, testing, documentation, compliance
    priority VARCHAR(20) DEFAULT 'medium',
    estimated_hours DECIMAL(5,2),
    assigned_to VARCHAR(255),
    due_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'open',
    gitlab_issue_id VARCHAR(100),
    gitlab_issue_url VARCHAR(500),
    labels JSONB, -- GitLab labels
    milestone VARCHAR(255),
    dependencies JSONB, -- Task dependencies
    acceptance_criteria JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for tasks
CREATE INDEX idx_requirement_tasks_document_id ON requirement_tasks(document_id);
CREATE INDEX idx_requirement_tasks_section_id ON requirement_tasks(section_id);
CREATE INDEX idx_requirement_tasks_status ON requirement_tasks(status);
CREATE INDEX idx_requirement_tasks_priority ON requirement_tasks(priority);
CREATE INDEX idx_requirement_tasks_gitlab_issue_id ON requirement_tasks(gitlab_issue_id);
CREATE INDEX idx_requirement_tasks_due_date ON requirement_tasks(due_date);

-- GitLab integration configurations table
CREATE TABLE gitlab_configurations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    gitlab_url VARCHAR(500) NOT NULL,
    access_token VARCHAR(500), -- Should be encrypted in production
    default_project_id VARCHAR(100),
    default_milestone VARCHAR(255),
    default_labels JSONB,
    default_assignee VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for GitLab configurations
CREATE INDEX idx_gitlab_configurations_is_active ON gitlab_configurations(is_active);
CREATE INDEX idx_gitlab_configurations_name ON gitlab_configurations(name);

-- ============================================================================
-- EXAMPLE DATA INSERTS (Optional - for testing)
-- ============================================================================

-- Example GitLab configuration (update with your actual values)
INSERT INTO gitlab_configurations (
    name,
    gitlab_url,
    access_token,
    default_project_id,
    default_milestone,
    default_labels,
    default_assignee,
    is_active,
    created_by
) VALUES (
    'Main GitLab Instance',
    'https://gitlab.company.com',
    'glpat-xxxxxxxxxxxxxxxxxxxx', -- Replace with actual token
    '123',
    'Security Sprint',
    '["security", "requirements", "compliance"]'::jsonb,
    'security-team',
    true,
    1
);

-- Example document templates
INSERT INTO requirement_documents (
    title,
    description,
    system_id,
    system_name,
    asset_ids,
    document_type,
    template_type,
    status,
    created_by
) VALUES (
    'Sample Security Requirements Template',
    'Template for generating security requirements documents',
    'template-system',
    'Template System',
    '["template-asset-1", "template-asset-2"]'::jsonb,
    'security_requirements',
    'nist',
    'completed',
    1
);

-- ============================================================================
-- VIEWS FOR REPORTING AND ANALYTICS
-- ============================================================================

-- Document generation statistics view
CREATE VIEW requirements_generation_stats AS
SELECT 
    document_type,
    template_type,
    status,
    COUNT(*) as document_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_generation_time_minutes,
    MIN(created_at) as first_document,
    MAX(created_at) as latest_document
FROM requirement_documents 
GROUP BY document_type, template_type, status;

-- Task completion metrics view
CREATE VIEW requirements_task_metrics AS
SELECT 
    rt.document_id,
    rd.title as document_title,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN rt.status = 'open' THEN 1 END) as open_tasks,
    COUNT(CASE WHEN rt.status = 'in_progress' THEN 1 END) as in_progress_tasks,
    ROUND(
        COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as completion_percentage,
    SUM(rt.estimated_hours) as total_estimated_hours,
    SUM(CASE WHEN rt.status = 'completed' THEN rt.estimated_hours ELSE 0 END) as completed_hours
FROM requirement_tasks rt
JOIN requirement_documents rd ON rt.document_id = rd.id
GROUP BY rt.document_id, rd.title;

-- GitLab integration status view
CREATE VIEW gitlab_integration_status AS
SELECT 
    gc.name as gitlab_config,
    COUNT(rd.id) as documents_using_config,
    COUNT(rt.gitlab_issue_id) as tasks_with_gitlab_issues,
    MAX(rt.updated_at) as last_sync_time
FROM gitlab_configurations gc
LEFT JOIN requirement_documents rd ON rd.gitlab_project_id = gc.default_project_id
LEFT JOIN requirement_tasks rt ON rt.document_id = rd.id AND rt.gitlab_issue_id IS NOT NULL
WHERE gc.is_active = true
GROUP BY gc.id, gc.name;

-- ============================================================================
-- FUNCTIONS FOR AUTOMATION
-- ============================================================================

-- Function to update document status based on task completion
CREATE OR REPLACE FUNCTION update_document_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update document status based on task completion
    UPDATE requirement_documents 
    SET 
        status = CASE 
            WHEN (
                SELECT COUNT(*) 
                FROM requirement_tasks 
                WHERE document_id = NEW.document_id AND status != 'completed'
            ) = 0 THEN 'completed'
            WHEN (
                SELECT COUNT(*) 
                FROM requirement_tasks 
                WHERE document_id = NEW.document_id AND status = 'in_progress'
            ) > 0 THEN 'in_progress'
            ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.document_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update document status when tasks change
CREATE TRIGGER trigger_update_document_status
    AFTER UPDATE OF status ON requirement_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_document_status();

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER trigger_requirement_documents_updated_at
    BEFORE UPDATE ON requirement_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_requirement_sections_updated_at
    BEFORE UPDATE ON requirement_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_requirement_tasks_updated_at
    BEFORE UPDATE ON requirement_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER trigger_gitlab_configurations_updated_at
    BEFORE UPDATE ON gitlab_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE requirement_documents IS 'Main table for AI-generated requirements documents';
COMMENT ON TABLE requirement_sections IS 'Structured sections within requirements documents';
COMMENT ON TABLE requirement_tasks IS 'Implementation tasks generated from requirements';
COMMENT ON TABLE gitlab_configurations IS 'GitLab integration settings for issue creation';

COMMENT ON COLUMN requirement_documents.asset_ids IS 'JSONB array of asset UUIDs included in this document';
COMMENT ON COLUMN requirement_documents.generation_metadata IS 'Metadata about AI generation process including model, timing, etc.';
COMMENT ON COLUMN requirement_sections.requirements IS 'JSONB array of specific requirements in this section';
COMMENT ON COLUMN requirement_sections.compliance_controls IS 'JSONB array of NIST/compliance controls mapped to this section';
COMMENT ON COLUMN requirement_tasks.acceptance_criteria IS 'JSONB array of acceptance criteria for task completion';
COMMENT ON COLUMN requirement_tasks.dependencies IS 'JSONB array of task dependencies';

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ras_dash_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ras_dash_app;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Requirements Document Generator schema created successfully!';
    RAISE NOTICE 'Tables created: requirement_documents, requirement_sections, requirement_tasks, gitlab_configurations';
    RAISE NOTICE 'Views created: requirements_generation_stats, requirements_task_metrics, gitlab_integration_status';
    RAISE NOTICE 'Triggers created for automatic status updates and timestamps';
    RAISE NOTICE 'Ready for use with RAS DASH Requirements Document Generator';
END $$;