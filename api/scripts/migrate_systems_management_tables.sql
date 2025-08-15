-- Systems Management Migration Script
-- Creates tables for comprehensive systems management features

-- Create enums for systems management
DO $$ BEGIN
    CREATE TYPE discovery_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE posture_status AS ENUM ('excellent', 'good', 'fair', 'poor', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE drift_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE environment_type AS ENUM ('on-premises', 'cloud', 'hybrid');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- System Discovery Scans table
CREATE TABLE IF NOT EXISTS system_discovery_scans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  methods JSONB NOT NULL, -- Array of discovery methods used
  targets JSONB NOT NULL, -- Array of targets (IP ranges, domains, etc.)
  schedule VARCHAR(100), -- CRON expression for scheduled scans
  options JSONB DEFAULT '{}', -- Scan options and configuration
  status discovery_status DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  systems_found INTEGER DEFAULT 0,
  results JSONB, -- Aggregated scan results
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Discovery Results table
CREATE TABLE IF NOT EXISTS system_discovery_results (
  id SERIAL PRIMARY KEY,
  scan_id INTEGER REFERENCES system_discovery_scans(id) ON DELETE CASCADE,
  system_identifier VARCHAR(255) NOT NULL,
  discovery_data JSONB NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  methods JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  system_id INTEGER REFERENCES systems(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Security Posture table
CREATE TABLE IF NOT EXISTS system_security_posture (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
  overall_score DECIMAL(5,2) NOT NULL, -- 0-100
  posture_status posture_status NOT NULL,
  vulnerability_score DECIMAL(5,2),
  configuration_score DECIMAL(5,2),
  patch_score DECIMAL(5,2),
  compliance_score DECIMAL(5,2),
  control_effectiveness DECIMAL(5,2),
  threat_exposure DECIMAL(5,2),
  business_impact DECIMAL(5,2),
  risk_factors JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  last_assessment TIMESTAMP WITH TIME ZONE NOT NULL,
  next_assessment TIMESTAMP WITH TIME ZONE,
  assessed_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Configuration Drift table
CREATE TABLE IF NOT EXISTS system_configuration_drift (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
  drift_type VARCHAR(100) NOT NULL, -- 'configuration', 'patch', 'service', 'security'
  severity drift_severity NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  current_value TEXT,
  expected_value TEXT,
  previous_value TEXT,
  detection_method VARCHAR(100),
  impact_assessment TEXT,
  remediation_steps JSONB DEFAULT '[]',
  business_impact VARCHAR(50),
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by INTEGER REFERENCES users(id),
  resolved_by INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'acknowledged', 'resolved', 'accepted'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cross-System Correlations table
CREATE TABLE IF NOT EXISTS cross_system_correlations (
  id SERIAL PRIMARY KEY,
  correlation_id VARCHAR(100) NOT NULL UNIQUE,
  correlation_type VARCHAR(100) NOT NULL, -- 'vulnerability_pattern', 'attack_path', 'shared_risk'
  title VARCHAR(500) NOT NULL,
  description TEXT,
  system_ids JSONB NOT NULL, -- Array of affected system IDs
  severity VARCHAR(20) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  risk_score DECIMAL(5,2),
  correlation_data JSONB NOT NULL,
  ai_analysis JSONB,
  recommendations JSONB DEFAULT '[]',
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'false_positive'
  assigned_to INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enterprise Risk Aggregation table
CREATE TABLE IF NOT EXISTS enterprise_risk_aggregation (
  id SERIAL PRIMARY KEY,
  aggregation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  overall_risk_score DECIMAL(5,2) NOT NULL,
  risk_level risk_level NOT NULL,
  total_systems INTEGER NOT NULL,
  critical_systems INTEGER DEFAULT 0,
  high_risk_systems INTEGER DEFAULT 0,
  medium_risk_systems INTEGER DEFAULT 0,
  low_risk_systems INTEGER DEFAULT 0,
  total_vulnerabilities INTEGER DEFAULT 0,
  critical_vulnerabilities INTEGER DEFAULT 0,
  high_vulnerabilities INTEGER DEFAULT 0,
  compliance_score DECIMAL(5,2),
  control_effectiveness DECIMAL(5,2),
  threat_exposure DECIMAL(5,2),
  business_impact_score DECIMAL(5,2),
  risk_trends JSONB DEFAULT '{}',
  top_risks JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  benchmark_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attack Surface Mapping table
CREATE TABLE IF NOT EXISTS attack_surface_mapping (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
  surface_type VARCHAR(100) NOT NULL, -- 'network', 'web', 'api', 'service'
  component VARCHAR(255) NOT NULL, -- Service, port, endpoint, etc.
  exposure VARCHAR(50) NOT NULL, -- 'internal', 'external', 'dmz'
  protocol VARCHAR(50),
  port INTEGER,
  service VARCHAR(100),
  version VARCHAR(100),
  endpoint TEXT,
  authentication VARCHAR(100),
  encryption VARCHAR(100),
  risk_score DECIMAL(5,2),
  vulnerabilities JSONB DEFAULT '[]',
  threat_vectors JSONB DEFAULT '[]',
  mitigations JSONB DEFAULT '[]',
  business_criticality VARCHAR(50),
  data_classification VARCHAR(50),
  last_scanned TIMESTAMP WITH TIME ZONE,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'decommissioned'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business Impact Analysis table
CREATE TABLE IF NOT EXISTS business_impact_analysis (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
  business_function VARCHAR(255) NOT NULL,
  criticality VARCHAR(50) NOT NULL, -- 'mission_critical', 'business_critical', 'important', 'routine'
  rto INTEGER, -- Recovery Time Objective in minutes
  rpo INTEGER, -- Recovery Point Objective in minutes
  financial_impact DECIMAL(12,2),
  reputational_impact VARCHAR(50),
  regulatory_impact VARCHAR(50),
  operational_impact VARCHAR(50),
  dependencies JSONB DEFAULT '[]', -- Systems this depends on
  dependents JSONB DEFAULT '[]', -- Systems that depend on this
  stakeholders JSONB DEFAULT '[]',
  business_processes JSONB DEFAULT '[]',
  data_types JSONB DEFAULT '[]',
  compliance_requirements JSONB DEFAULT '[]',
  threat_scenarios JSONB DEFAULT '[]',
  risk_mitigations JSONB DEFAULT '[]',
  last_assessment TIMESTAMP WITH TIME ZONE NOT NULL,
  next_assessment TIMESTAMP WITH TIME ZONE,
  assessed_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Compliance Mapping table
CREATE TABLE IF NOT EXISTS system_compliance_mapping (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
  framework VARCHAR(100) NOT NULL, -- 'NIST_800_53', 'FEDRAMP', 'FISMA', 'SOX', 'HIPAA'
  control_id VARCHAR(50) NOT NULL,
  control_family VARCHAR(100),
  implementation_status VARCHAR(50) NOT NULL,
  assessment_status VARCHAR(50) NOT NULL,
  compliance_score DECIMAL(5,2),
  gap_analysis JSONB DEFAULT '{}',
  evidence JSONB DEFAULT '[]',
  exceptions JSONB DEFAULT '[]',
  compensating_controls JSONB DEFAULT '[]',
  last_assessment TIMESTAMP WITH TIME ZONE,
  next_assessment TIMESTAMP WITH TIME ZONE,
  assessor VARCHAR(255),
  automated_assessment BOOLEAN DEFAULT false,
  mapping_confidence DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat Modeling table
CREATE TABLE IF NOT EXISTS system_threat_modeling (
  id SERIAL PRIMARY KEY,
  system_id INTEGER REFERENCES systems(id) ON DELETE CASCADE NOT NULL,
  model_id VARCHAR(100) NOT NULL UNIQUE,
  model_name VARCHAR(255) NOT NULL,
  methodology VARCHAR(100), -- 'STRIDE', 'PASTA', 'OCTAVE'
  scope TEXT,
  assets JSONB DEFAULT '[]',
  threat_actors JSONB DEFAULT '[]',
  attack_vectors JSONB DEFAULT '[]',
  threats JSONB DEFAULT '[]',
  vulnerabilities JSONB DEFAULT '[]',
  controls JSONB DEFAULT '[]',
  risk_assessment JSONB DEFAULT '{}',
  mitigation_strategies JSONB DEFAULT '[]',
  residual_risk DECIMAL(5,2),
  model_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'archived'
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id) NOT NULL,
  reviewed_by INTEGER REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add discovery-related columns to systems table if they don't exist
ALTER TABLE systems ADD COLUMN IF NOT EXISTS discovery_confidence DECIMAL(3,2);
ALTER TABLE systems ADD COLUMN IF NOT EXISTS last_discovery_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE systems ADD COLUMN IF NOT EXISTS environment environment_type;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_discovery_scans_status ON system_discovery_scans(status);
CREATE INDEX IF NOT EXISTS idx_system_discovery_scans_started_at ON system_discovery_scans(started_at);
CREATE INDEX IF NOT EXISTS idx_system_discovery_results_scan_id ON system_discovery_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_system_discovery_results_system_id ON system_discovery_results(system_id);
CREATE INDEX IF NOT EXISTS idx_system_discovery_results_processed ON system_discovery_results(processed);

CREATE INDEX IF NOT EXISTS idx_system_security_posture_system_id ON system_security_posture(system_id);
CREATE INDEX IF NOT EXISTS idx_system_security_posture_status ON system_security_posture(posture_status);
CREATE INDEX IF NOT EXISTS idx_system_security_posture_score ON system_security_posture(overall_score);

CREATE INDEX IF NOT EXISTS idx_system_configuration_drift_system_id ON system_configuration_drift(system_id);
CREATE INDEX IF NOT EXISTS idx_system_configuration_drift_severity ON system_configuration_drift(severity);
CREATE INDEX IF NOT EXISTS idx_system_configuration_drift_status ON system_configuration_drift(status);
CREATE INDEX IF NOT EXISTS idx_system_configuration_drift_detected_at ON system_configuration_drift(detected_at);

CREATE INDEX IF NOT EXISTS idx_cross_system_correlations_status ON cross_system_correlations(status);
CREATE INDEX IF NOT EXISTS idx_cross_system_correlations_severity ON cross_system_correlations(severity);
CREATE INDEX IF NOT EXISTS idx_cross_system_correlations_detected_at ON cross_system_correlations(detected_at);

CREATE INDEX IF NOT EXISTS idx_enterprise_risk_aggregation_date ON enterprise_risk_aggregation(aggregation_date);
CREATE INDEX IF NOT EXISTS idx_enterprise_risk_aggregation_risk_level ON enterprise_risk_aggregation(risk_level);

CREATE INDEX IF NOT EXISTS idx_attack_surface_mapping_system_id ON attack_surface_mapping(system_id);
CREATE INDEX IF NOT EXISTS idx_attack_surface_mapping_exposure ON attack_surface_mapping(exposure);
CREATE INDEX IF NOT EXISTS idx_attack_surface_mapping_status ON attack_surface_mapping(status);

CREATE INDEX IF NOT EXISTS idx_business_impact_analysis_system_id ON business_impact_analysis(system_id);
CREATE INDEX IF NOT EXISTS idx_business_impact_analysis_criticality ON business_impact_analysis(criticality);

CREATE INDEX IF NOT EXISTS idx_system_compliance_mapping_system_id ON system_compliance_mapping(system_id);
CREATE INDEX IF NOT EXISTS idx_system_compliance_mapping_framework ON system_compliance_mapping(framework);

CREATE INDEX IF NOT EXISTS idx_system_threat_modeling_system_id ON system_threat_modeling(system_id);
CREATE INDEX IF NOT EXISTS idx_system_threat_modeling_status ON system_threat_modeling(model_status);

CREATE INDEX IF NOT EXISTS idx_systems_environment ON systems(environment);
CREATE INDEX IF NOT EXISTS idx_systems_discovery_confidence ON systems(discovery_confidence);

-- Add comments for documentation
COMMENT ON TABLE system_discovery_scans IS 'Stores system discovery scan configurations and results';
COMMENT ON TABLE system_discovery_results IS 'Stores individual discovery results for each found system';
COMMENT ON TABLE system_security_posture IS 'Stores comprehensive security posture assessments for systems';
COMMENT ON TABLE system_configuration_drift IS 'Tracks configuration changes that impact security posture';
COMMENT ON TABLE cross_system_correlations IS 'Identifies security patterns and vulnerabilities across systems';
COMMENT ON TABLE enterprise_risk_aggregation IS 'Aggregated enterprise-level risk metrics and trends';
COMMENT ON TABLE attack_surface_mapping IS 'Maps and tracks enterprise attack surface components';
COMMENT ON TABLE business_impact_analysis IS 'Business impact assessments for systems and services';
COMMENT ON TABLE system_compliance_mapping IS 'Maps systems to regulatory compliance frameworks';
COMMENT ON TABLE system_threat_modeling IS 'Stores threat models and risk assessments for systems';

COMMENT ON COLUMN systems.discovery_confidence IS 'Confidence level in system discovery (0-1)';
COMMENT ON COLUMN systems.environment IS 'System environment: on-premises, cloud, hybrid';

-- Insert sample data for testing
INSERT INTO system_discovery_scans (name, description, methods, targets, status, started_at, systems_found) VALUES
('Initial Network Discovery', 'Comprehensive network scan of production environment', '["network_scan", "service_detection"]', '["192.168.1.0/24", "10.0.0.0/16"]', 'completed', NOW() - INTERVAL '1 day', 15),
('Cloud Infrastructure Discovery', 'AWS resource discovery scan', '["aws_discovery"]', '["us-east-1", "us-west-2"]', 'completed', NOW() - INTERVAL '2 hours', 8),
('Active Directory Discovery', 'Domain controller and computer discovery', '["ad_discovery"]', '["domain.local"]', 'running', NOW() - INTERVAL '30 minutes', 0)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Systems Management tables created successfully!' as status;
