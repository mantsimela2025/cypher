#!/usr/bin/env node
/**
 * Create Natural Language Query Migration
 * Generates SQL migration for natural language query tables
 */

function generateNLQueryMigration() {
  console.log('🏗️  Generating Natural Language Query Migration SQL');
  console.log('===================================================\n');

  const migrationSQL = `
-- Natural Language Query Migration
-- Generated: ${new Date().toISOString()}

-- Create enums for nl_queries table
CREATE TYPE enum_nl_queries_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE enum_nl_queries_query_type AS ENUM (
  'asset_search',
  'cost_analysis',
  'vulnerability_report',
  'compliance_check',
  'lifecycle_planning',
  'operational_metrics',
  'risk_assessment',
  'general_query'
);

CREATE TYPE enum_nl_queries_feedback AS ENUM (
  'helpful',
  'not_helpful',
  'partially_helpful',
  'incorrect',
  'needs_improvement'
);

-- Natural Language Queries Table
CREATE TABLE nl_queries (
  id SERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status enum_nl_queries_status DEFAULT 'pending',
  query_type enum_nl_queries_query_type,
  intent VARCHAR(255),
  entities JSONB DEFAULT '{}',
  sql_query TEXT,
  results JSONB DEFAULT '{}',
  result_count INTEGER,
  execution_time DECIMAL(15,2),
  confidence DECIMAL(15,2),
  feedback enum_nl_queries_feedback,
  feedback_comment TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- NL Queries Indexes
CREATE INDEX idx_nl_queries_user_id ON nl_queries(user_id);
CREATE INDEX idx_nl_queries_status ON nl_queries(status);
CREATE INDEX idx_nl_queries_query_type ON nl_queries(query_type);
CREATE INDEX idx_nl_queries_intent ON nl_queries(intent);
CREATE INDEX idx_nl_queries_created_at ON nl_queries(created_at);
CREATE INDEX idx_nl_queries_confidence ON nl_queries(confidence);
CREATE INDEX idx_nl_queries_feedback ON nl_queries(feedback);
CREATE INDEX idx_nl_queries_execution_time ON nl_queries(execution_time);

-- Composite indexes for common query patterns
CREATE INDEX idx_nl_queries_user_status ON nl_queries(user_id, status);
CREATE INDEX idx_nl_queries_status_created ON nl_queries(status, created_at);
CREATE INDEX idx_nl_queries_query_type_status ON nl_queries(query_type, status);

-- Query Templates Table
CREATE TABLE query_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  category VARCHAR(50),
  parameters JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Query Templates Indexes and Constraints
CREATE INDEX idx_query_templates_name ON query_templates(name);
CREATE INDEX idx_query_templates_category ON query_templates(category);
CREATE INDEX idx_query_templates_created_by ON query_templates(created_by);
CREATE INDEX idx_query_templates_created_at ON query_templates(created_at);

-- Unique constraint on template name
CREATE UNIQUE INDEX query_templates_name_unique ON query_templates(name);

-- Composite indexes for common query patterns
CREATE INDEX idx_query_templates_category_created ON query_templates(category, created_at);
CREATE INDEX idx_query_templates_created_by_name ON query_templates(created_by, name);

-- Update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nl_queries_updated_at 
  BEFORE UPDATE ON nl_queries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_query_templates_updated_at 
  BEFORE UPDATE ON query_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE nl_queries IS 'Stores natural language queries from users with processing status, results, and feedback for continuous improvement of NLP capabilities.';
COMMENT ON TABLE query_templates IS 'Stores reusable query templates with parameters for common natural language query patterns.';

COMMENT ON COLUMN nl_queries.query IS 'The original natural language query from the user';
COMMENT ON COLUMN nl_queries.status IS 'Processing status of the query (pending, processing, completed, failed, cancelled)';
COMMENT ON COLUMN nl_queries.query_type IS 'Classified type of query for routing to appropriate handlers';
COMMENT ON COLUMN nl_queries.intent IS 'Extracted intent from natural language processing';
COMMENT ON COLUMN nl_queries.entities IS 'JSON object containing extracted entities from the query';
COMMENT ON COLUMN nl_queries.sql_query IS 'Generated SQL query from natural language processing';
COMMENT ON COLUMN nl_queries.results IS 'JSON object containing query results';
COMMENT ON COLUMN nl_queries.result_count IS 'Number of results returned by the query';
COMMENT ON COLUMN nl_queries.execution_time IS 'Time taken to execute the query in seconds';
COMMENT ON COLUMN nl_queries.confidence IS 'Confidence score of the NLP processing (0.0 to 1.0)';
COMMENT ON COLUMN nl_queries.feedback IS 'User feedback on query results quality';
COMMENT ON COLUMN nl_queries.feedback_comment IS 'Additional user feedback comments';
COMMENT ON COLUMN nl_queries.error_message IS 'Error message if query processing failed';
COMMENT ON COLUMN nl_queries.metadata IS 'Additional metadata for query processing and analysis';

COMMENT ON COLUMN query_templates.name IS 'Unique name identifier for the template';
COMMENT ON COLUMN query_templates.description IS 'Human-readable description of what the template does';
COMMENT ON COLUMN query_templates.query_text IS 'Template query text with parameter placeholders';
COMMENT ON COLUMN query_templates.category IS 'Category for organizing templates (e.g., assets, costs, vulnerabilities)';
COMMENT ON COLUMN query_templates.parameters IS 'JSON schema defining template parameters and their types';

-- Insert some sample query templates
INSERT INTO query_templates (name, description, query_text, category, parameters) VALUES
(
  'asset_search_by_type',
  'Search for assets by type with optional filters',
  'SELECT * FROM assets WHERE asset_type = $1 AND ($2 IS NULL OR hostname ILIKE $2)',
  'asset_search',
  '{"type": "object", "properties": {"asset_type": {"type": "string"}, "hostname_filter": {"type": "string", "optional": true}}}'
),
(
  'cost_analysis_by_period',
  'Analyze costs for a specific time period',
  'SELECT cost_type, SUM(amount) as total_cost FROM asset_cost_management WHERE created_at BETWEEN $1 AND $2 GROUP BY cost_type',
  'cost_analysis',
  '{"type": "object", "properties": {"start_date": {"type": "string", "format": "date"}, "end_date": {"type": "string", "format": "date"}}}'
),
(
  'vulnerability_summary',
  'Get vulnerability summary by severity',
  'SELECT severity, COUNT(*) as count FROM vulnerabilities GROUP BY severity ORDER BY severity',
  'vulnerability_report',
  '{"type": "object", "properties": {}}'
),
(
  'assets_warranty_expiring',
  'Find assets with warranties expiring within specified days',
  'SELECT a.hostname, al.warranty_end_date FROM assets a JOIN asset_lifecycle al ON a.asset_uuid = al.asset_uuid WHERE al.warranty_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL ''$1 days''',
  'lifecycle_planning',
  '{"type": "object", "properties": {"days": {"type": "integer", "default": 90}}}'
);

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON nl_queries TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON query_templates TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Migration complete
SELECT 'Natural Language Query tables created successfully!' as status;
`;

  console.log('📄 Generated Migration SQL:');
  console.log('===========================');
  console.log(migrationSQL);

  console.log('\n💾 To apply this migration:');
  console.log('===========================');
  console.log('1. Save the SQL to a file: migration_nl_queries.sql');
  console.log('2. Run: psql -d your_database -f migration_nl_queries.sql');
  console.log('3. Or use your preferred database migration tool');

  console.log('\n🔧 Migration Features:');
  console.log('======================');
  console.log('• Creates nl_queries table for natural language query processing');
  console.log('• Creates query_templates table for reusable query patterns');
  console.log('• Adds comprehensive indexes for optimal query performance');
  console.log('• Sets up foreign key relationships with users table');
  console.log('• Creates enums for data integrity and consistency');
  console.log('• Includes automatic updated_at triggers');
  console.log('• Adds detailed table and column comments');
  console.log('• Inserts sample query templates for common use cases');

  console.log('\n🎯 Use Cases Supported:');
  console.log('=======================');
  console.log('• Natural language to SQL conversion');
  console.log('• Query intent classification and routing');
  console.log('• Entity extraction and structured data storage');
  console.log('• Query result caching and analysis');
  console.log('• Performance monitoring and optimization');
  console.log('• User feedback collection for ML improvement');
  console.log('• Template-based query generation');
  console.log('• Query categorization and organization');

  return migrationSQL;
}

// Run if executed directly
if (require.main === module) {
  generateNLQueryMigration();
}

module.exports = { generateNLQueryMigration };
