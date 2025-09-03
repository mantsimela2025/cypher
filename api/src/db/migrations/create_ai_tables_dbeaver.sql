-- =====================================================
-- RMF AI System Database Tables Setup Script
-- Run this script in DBeaver to create all AI-related tables
-- =====================================================

-- Start transaction for safety
BEGIN;

-- =====================================================
-- 1. AI Processing Logs Table
-- Tracks all AI requests for monitoring, cost tracking, and debugging
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(100) NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    processing_time INTEGER NOT NULL, -- milliseconds
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    cost DECIMAL(10,4) DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. AI Insights Table
-- Stores AI-generated insights and recommendations
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES rmf_projects(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL, -- 'categorization', 'control_selection', 'risk_analysis', etc.
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1=Critical, 5=Low
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommendation TEXT,
    confidence INTEGER DEFAULT 80 CHECK (confidence BETWEEN 0 AND 100), -- AI confidence percentage
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    metadata JSONB DEFAULT '{}', -- Additional insight data
    created_by_ai BOOLEAN DEFAULT true,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. RMF Document Templates Table
-- Stores AI-generated RMF document templates (separate from existing document_templates)
-- =====================================================

CREATE TABLE IF NOT EXISTS rmf_document_templates (
    id SERIAL PRIMARY KEY,
    template_type VARCHAR(100) NOT NULL, -- 'ssp', 'poam', 'sar', 'categorization', etc.
    template_name VARCHAR(255) NOT NULL,
    template_content TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Template variables and their descriptions
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    is_ai_generated BOOLEAN DEFAULT false,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(template_type, template_name, version)
);

-- =====================================================
-- 4. AI Categorization Results Table
-- Stores detailed AI categorization analysis
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_categorization_results (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES rmf_projects(id) ON DELETE CASCADE,
    confidentiality_impact VARCHAR(10) CHECK (confidentiality_impact IN ('LOW', 'MODERATE', 'HIGH')),
    integrity_impact VARCHAR(10) CHECK (integrity_impact IN ('LOW', 'MODERATE', 'HIGH')),
    availability_impact VARCHAR(10) CHECK (availability_impact IN ('LOW', 'MODERATE', 'HIGH')),
    overall_impact VARCHAR(10) CHECK (overall_impact IN ('LOW', 'MODERATE', 'HIGH')),
    reasoning TEXT NOT NULL, -- AI's reasoning for the categorization
    confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
    information_types JSONB DEFAULT '[]', -- Array of information types identified
    system_characteristics JSONB DEFAULT '{}', -- Key system characteristics analyzed
    risk_factors JSONB DEFAULT '[]', -- Risk factors considered
    recommendations TEXT, -- AI recommendations for improving categorization
    reviewed_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. AI Control Selection Results Table
-- Stores AI-recommended control selections and tailoring
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_control_selections (
    id SERIAL PRIMARY KEY,
    system_id INTEGER REFERENCES rmf_projects(id) ON DELETE CASCADE,
    baseline_type VARCHAR(20) CHECK (baseline_type IN ('LOW', 'MODERATE', 'HIGH')),
    selected_controls JSONB DEFAULT '[]', -- Array of selected control IDs
    additional_controls JSONB DEFAULT '[]', -- AI-recommended additional controls
    tailoring_decisions JSONB DEFAULT '{}', -- Control tailoring recommendations
    reasoning TEXT NOT NULL, -- AI's reasoning for control selection
    confidence_score INTEGER DEFAULT 80 CHECK (confidence_score BETWEEN 0 AND 100),
    compliance_frameworks JSONB DEFAULT '[]', -- Frameworks considered (FedRAMP, FISMA, etc.)
    risk_considerations TEXT, -- Risk factors that influenced selection
    implementation_guidance TEXT, -- AI-generated implementation guidance
    reviewed_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. Performance Indexes
-- =====================================================

-- AI Processing Logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_logs_operation_created 
    ON ai_processing_logs(operation_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success_created 
    ON ai_processing_logs(success, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_cost 
    ON ai_processing_logs(cost, created_at);

-- AI Insights indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_system_status 
    ON ai_insights(system_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_priority 
    ON ai_insights(insight_type, priority);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created 
    ON ai_insights(created_at);

-- RMF Document Templates indexes
CREATE INDEX IF NOT EXISTS idx_rmf_document_templates_type_active
    ON rmf_document_templates(template_type, is_active);
CREATE INDEX IF NOT EXISTS idx_rmf_document_templates_version
    ON rmf_document_templates(template_type, version);

-- AI Categorization indexes
CREATE INDEX IF NOT EXISTS idx_ai_categorization_system 
    ON ai_categorization_results(system_id);
CREATE INDEX IF NOT EXISTS idx_ai_categorization_impact 
    ON ai_categorization_results(overall_impact);

-- AI Control Selection indexes
CREATE INDEX IF NOT EXISTS idx_ai_control_selection_system 
    ON ai_control_selections(system_id);
CREATE INDEX IF NOT EXISTS idx_ai_control_selection_baseline 
    ON ai_control_selections(baseline_type);

-- =====================================================
-- 7. Table Comments for Documentation
-- =====================================================

COMMENT ON TABLE ai_processing_logs IS 'Tracks all AI API requests for monitoring, cost analysis, and debugging';
COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights and recommendations for RMF processes';
COMMENT ON TABLE rmf_document_templates IS 'Manages RMF-specific document templates for automated generation';
COMMENT ON TABLE ai_categorization_results IS 'Stores detailed AI analysis results for system categorization';
COMMENT ON TABLE ai_control_selections IS 'Stores AI recommendations for security control selection and tailoring';

-- Column comments
COMMENT ON COLUMN ai_insights.priority IS '1=Critical, 2=High, 3=Medium, 4=Low, 5=Informational';
COMMENT ON COLUMN ai_insights.confidence IS 'AI confidence level as percentage (0-100)';
COMMENT ON COLUMN ai_insights.status IS 'Insight status: active, acknowledged, resolved, dismissed';

COMMENT ON COLUMN ai_categorization_results.confidence_score IS 'AI confidence in categorization accuracy (0-100)';
COMMENT ON COLUMN ai_categorization_results.reasoning IS 'Detailed AI reasoning for impact level determinations';

COMMENT ON COLUMN ai_control_selections.confidence_score IS 'AI confidence in control selection recommendations (0-100)';
COMMENT ON COLUMN ai_control_selections.baseline_type IS 'NIST 800-53 baseline: LOW, MODERATE, or HIGH';

COMMENT ON COLUMN rmf_document_templates.variables IS 'JSON object defining template variables and their descriptions';
COMMENT ON COLUMN rmf_document_templates.template_content IS 'Template content with variable placeholders';

-- =====================================================
-- 8. Insert Sample Data (Optional)
-- =====================================================

-- Sample RMF document templates
INSERT INTO rmf_document_templates (template_type, template_name, template_content, variables, is_ai_generated) VALUES
('categorization', 'FIPS 199 Categorization Report', 
 'System Categorization Report\n\nSystem: {{system_name}}\nImpact Levels:\n- Confidentiality: {{confidentiality_impact}}\n- Integrity: {{integrity_impact}}\n- Availability: {{availability_impact}}\n\nOverall Impact: {{overall_impact}}\n\nReasoning:\n{{reasoning}}',
 '{"system_name": "Name of the system being categorized", "confidentiality_impact": "LOW/MODERATE/HIGH", "integrity_impact": "LOW/MODERATE/HIGH", "availability_impact": "LOW/MODERATE/HIGH", "overall_impact": "LOW/MODERATE/HIGH", "reasoning": "AI-generated reasoning for categorization"}',
 true),

('poam', 'Plan of Action & Milestones Template',
 'Plan of Action & Milestones\n\nSystem: {{system_name}}\nFinding: {{finding_title}}\nSeverity: {{severity}}\n\nDescription:\n{{description}}\n\nRecommended Actions:\n{{recommended_actions}}\n\nTimeline:\n{{timeline}}\n\nResources Required:\n{{resources}}',
 '{"system_name": "System name", "finding_title": "Security finding title", "severity": "Critical/High/Medium/Low", "description": "Detailed finding description", "recommended_actions": "AI-recommended mitigation steps", "timeline": "Implementation timeline", "resources": "Required resources"}',
 true);

-- Commit the transaction
COMMIT;

-- =====================================================
-- 9. Verification Queries
-- Run these to verify the tables were created successfully
-- =====================================================

-- Check if all tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE 'ai_%' OR table_name = 'rmf_document_templates')
ORDER BY table_name;

-- Check table row counts (should be 0 for new tables, except document_templates which has sample data)
SELECT 
    'ai_processing_logs' as table_name, COUNT(*) as row_count FROM ai_processing_logs
UNION ALL
SELECT
    'ai_insights' as table_name, COUNT(*) as row_count FROM ai_insights
UNION ALL
SELECT
    'rmf_document_templates' as table_name, COUNT(*) as row_count FROM rmf_document_templates
UNION ALL
SELECT 
    'ai_categorization_results' as table_name, COUNT(*) as row_count FROM ai_categorization_results
UNION ALL
SELECT 
    'ai_control_selections' as table_name, COUNT(*) as row_count FROM ai_control_selections;

-- Check indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename LIKE 'ai_%' OR tablename = 'rmf_document_templates'
ORDER BY tablename, indexname;

-- Success message
SELECT 'AI Tables Setup Complete! ✅' as status;
