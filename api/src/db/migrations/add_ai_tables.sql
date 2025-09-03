-- AI Processing Logs Table
-- Tracks all AI requests for monitoring, cost tracking, and debugging

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

-- AI Insights Table
-- Stores AI-generated insights and recommendations

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

-- Document Templates Table
-- Stores AI-generated and custom document templates

CREATE TABLE IF NOT EXISTS document_templates (
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

-- AI Categorization Results Table
-- Stores detailed AI categorization analysis

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

-- AI Control Selection Results Table
-- Stores AI-recommended control selections and tailoring

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_logs_operation_created ON ai_processing_logs(operation_type, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_success_created ON ai_processing_logs(success, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_insights_system_status ON ai_insights(system_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_priority ON ai_insights(insight_type, priority);
CREATE INDEX IF NOT EXISTS idx_document_templates_type_active ON document_templates(template_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_categorization_system ON ai_categorization_results(system_id);
CREATE INDEX IF NOT EXISTS idx_ai_control_selection_system ON ai_control_selections(system_id);

-- Comments for documentation
COMMENT ON TABLE ai_processing_logs IS 'Tracks all AI API requests for monitoring, cost analysis, and debugging';
COMMENT ON TABLE ai_insights IS 'Stores AI-generated insights and recommendations for RMF processes';
COMMENT ON TABLE document_templates IS 'Manages document templates for automated generation';
COMMENT ON TABLE ai_categorization_results IS 'Stores detailed AI analysis results for system categorization';
COMMENT ON TABLE ai_control_selections IS 'Stores AI recommendations for security control selection and tailoring';

COMMENT ON COLUMN ai_insights.priority IS '1=Critical, 2=High, 3=Medium, 4=Low, 5=Informational';
COMMENT ON COLUMN ai_insights.confidence IS 'AI confidence level as percentage (0-100)';
COMMENT ON COLUMN ai_categorization_results.confidence_score IS 'AI confidence in categorization accuracy (0-100)';
COMMENT ON COLUMN ai_control_selections.confidence_score IS 'AI confidence in control selection recommendations (0-100)';
