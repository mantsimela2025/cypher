-- =====================================================
-- BOUNDARY CONTAINMENT SYSTEM - DATABASE SCHEMA
-- Document 1: SQL Script for New Tables and Data
-- =====================================================
-- Created: 2025-01-24
-- Version: 1.0
-- Purpose: SQL schema for enhanced diagram platform with boundary containment

-- =====================================================
-- 1. DIAGRAM TEMPLATES TABLE
-- =====================================================
-- Purpose: Store reusable diagram templates with metadata and configurations

CREATE TABLE IF NOT EXISTS diagram_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'Custom',
    thumbnail_url VARCHAR(500),
    is_built_in BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Template configuration and metadata
    template_data JSONB NOT NULL DEFAULT '{}',
    viewport_config JSONB DEFAULT '{"x": 0, "y": 0, "zoom": 1}',
    diagram_config JSONB DEFAULT '{"layout": "hierarchical", "spacing": 80, "direction": "horizontal", "showGrid": true}',
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT diagram_templates_name_check CHECK (char_length(name) >= 3),
    CONSTRAINT diagram_templates_category_check CHECK (category IN ('AWS', 'Azure', 'GCP', 'Network', 'Security', 'Application', 'Custom'))
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_diagram_templates_category ON diagram_templates(category);
CREATE INDEX IF NOT EXISTS idx_diagram_templates_created_by ON diagram_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_diagram_templates_is_built_in ON diagram_templates(is_built_in);

-- =====================================================
-- 2. DIAGRAM NODES TABLE
-- =====================================================
-- Purpose: Store individual nodes with boundary containment relationships

CREATE TABLE IF NOT EXISTS diagram_nodes (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES diagram_templates(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL, -- React Flow node ID
    node_type VARCHAR(100) NOT NULL,
    
    -- Position and styling
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    width FLOAT DEFAULT 80,
    height FLOAT DEFAULT 60,
    
    -- Node classification
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Boundary containment (NEW FEATURE)
    parent_node_id VARCHAR(255), -- References another node's node_id for containment
    is_boundary BOOLEAN DEFAULT FALSE,
    can_contain_nodes BOOLEAN DEFAULT FALSE,
    boundary_type VARCHAR(100), -- VPC, Subnet, Security Zone, etc.
    
    -- Node data and styling
    node_data JSONB NOT NULL DEFAULT '{}',
    node_style JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT diagram_nodes_template_node_unique UNIQUE(template_id, node_id),
    CONSTRAINT diagram_nodes_boundary_type_check CHECK (
        (is_boundary = TRUE AND boundary_type IS NOT NULL) OR 
        (is_boundary = FALSE AND boundary_type IS NULL)
    )
);

-- Indexes for boundary containment queries
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_template_id ON diagram_nodes(template_id);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_parent_node_id ON diagram_nodes(parent_node_id);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_is_boundary ON diagram_nodes(is_boundary);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_boundary_type ON diagram_nodes(boundary_type);

-- =====================================================
-- 3. DIAGRAM EDGES TABLE
-- =====================================================
-- Purpose: Store connections between nodes

CREATE TABLE IF NOT EXISTS diagram_edges (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES diagram_templates(id) ON DELETE CASCADE,
    edge_id VARCHAR(255) NOT NULL,
    source_node_id VARCHAR(255) NOT NULL,
    target_node_id VARCHAR(255) NOT NULL,
    edge_type VARCHAR(100) DEFAULT 'smoothstep',
    
    -- Edge styling and data
    edge_data JSONB DEFAULT '{}',
    edge_style JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT diagram_edges_template_edge_unique UNIQUE(template_id, edge_id),
    CONSTRAINT diagram_edges_no_self_reference CHECK (source_node_id != target_node_id)
);

-- Indexes for edge queries
CREATE INDEX IF NOT EXISTS idx_diagram_edges_template_id ON diagram_edges(template_id);
CREATE INDEX IF NOT EXISTS idx_diagram_edges_source_node ON diagram_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_diagram_edges_target_node ON diagram_edges(target_node_id);

-- =====================================================
-- 4. BOUNDARY CONTAINMENT RELATIONSHIPS TABLE
-- =====================================================
-- Purpose: Track parent-child relationships for boundary containment

CREATE TABLE IF NOT EXISTS boundary_containment (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES diagram_templates(id) ON DELETE CASCADE,
    parent_boundary_id VARCHAR(255) NOT NULL, -- The boundary container
    child_node_id VARCHAR(255) NOT NULL,      -- The contained node
    containment_type VARCHAR(100) DEFAULT 'auto', -- auto, manual, inherited
    
    -- Containment metadata
    contained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    containment_depth INTEGER DEFAULT 1, -- For nested boundaries
    
    -- Constraints
    CONSTRAINT boundary_containment_unique UNIQUE(template_id, child_node_id),
    CONSTRAINT boundary_containment_no_self_reference CHECK (parent_boundary_id != child_node_id),
    CONSTRAINT boundary_containment_type_check CHECK (containment_type IN ('auto', 'manual', 'inherited'))
);

-- Indexes for containment queries
CREATE INDEX IF NOT EXISTS idx_boundary_containment_template_id ON boundary_containment(template_id);
CREATE INDEX IF NOT EXISTS idx_boundary_containment_parent ON boundary_containment(parent_boundary_id);
CREATE INDEX IF NOT EXISTS idx_boundary_containment_child ON boundary_containment(child_node_id);

-- =====================================================
-- 5. DIAGRAM USAGE ANALYTICS TABLE
-- =====================================================
-- Purpose: Track template usage and performance metrics

CREATE TABLE IF NOT EXISTS diagram_usage_analytics (
    id SERIAL PRIMARY KEY,
    template_id INTEGER REFERENCES diagram_templates(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- load, save, edit, share, export
    
    -- Usage context
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    
    -- Performance metrics
    load_time_ms INTEGER,
    node_count INTEGER,
    edge_count INTEGER,
    boundary_count INTEGER,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT diagram_usage_action_type_check CHECK (action_type IN ('load', 'save', 'edit', 'share', 'export', 'create'))
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_diagram_usage_template_id ON diagram_usage_analytics(template_id);
CREATE INDEX IF NOT EXISTS idx_diagram_usage_user_id ON diagram_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_diagram_usage_created_at ON diagram_usage_analytics(created_at);

-- =====================================================
-- 6. BUILT-IN TEMPLATE DATA INSERTS
-- =====================================================
-- Purpose: Insert default boundary templates for immediate use

-- AWS VPC Template
INSERT INTO diagram_templates (
    name, 
    description, 
    category, 
    is_built_in, 
    template_data,
    viewport_config,
    diagram_config
) VALUES (
    'AWS VPC Architecture', 
    'Standard AWS VPC setup with public/private subnets, security groups, and EC2 instances',
    'AWS',
    TRUE,
    '{
        "nodes": [
            {
                "id": "vpc-main",
                "type": "boundary",
                "position": {"x": 50, "y": 50},
                "data": {
                    "label": "VPC (10.0.0.0/16)",
                    "icon": "🏠",
                    "type": "boundary",
                    "isBoundary": true,
                    "canContainNodes": true,
                    "boundaryType": "vpc"
                },
                "style": {
                    "width": 500,
                    "height": 300,
                    "background": "rgba(59, 130, 246, 0.1)",
                    "border": "2px dashed #3B82F6"
                }
            },
            {
                "id": "subnet-public",
                "type": "boundary",
                "position": {"x": 80, "y": 100},
                "parentNode": "vpc-main",
                "data": {
                    "label": "Public Subnet",
                    "icon": "🔗",
                    "type": "boundary",
                    "isBoundary": true,
                    "canContainNodes": true,
                    "boundaryType": "subnet"
                },
                "style": {
                    "width": 200,
                    "height": 120,
                    "background": "rgba(16, 185, 129, 0.1)",
                    "border": "2px dashed #10B981"
                }
            },
            {
                "id": "ec2-web",
                "type": "awsService",
                "position": {"x": 120, "y": 140},
                "parentNode": "subnet-public",
                "data": {
                    "label": "Web Server",
                    "icon": "🖥️",
                    "type": "aws-service"
                }
            }
        ],
        "edges": []
    }',
    '{"x": 0, "y": 0, "zoom": 1}',
    '{"layout": "manual", "showGrid": true, "snapToGrid": true}'
);

-- Network Security Template
INSERT INTO diagram_templates (
    name, 
    description, 
    category, 
    is_built_in, 
    template_data,
    viewport_config,
    diagram_config
) VALUES (
    'Network Security Zones', 
    'Multi-tier security architecture with DMZ, internal, and secure zones',
    'Security',
    TRUE,
    '{
        "nodes": [
            {
                "id": "security-perimeter",
                "type": "boundary",
                "position": {"x": 30, "y": 30},
                "data": {
                    "label": "Security Perimeter",
                    "icon": "🔒",
                    "type": "boundary",
                    "isBoundary": true,
                    "canContainNodes": true,
                    "boundaryType": "security"
                },
                "style": {
                    "width": 600,
                    "height": 350,
                    "background": "rgba(239, 68, 68, 0.1)",
                    "border": "2px dashed #EF4444"
                }
            },
            {
                "id": "dmz-zone",
                "type": "boundary",
                "position": {"x": 60, "y": 80},
                "parentNode": "security-perimeter",
                "data": {
                    "label": "DMZ Zone",
                    "icon": "🛡️",
                    "type": "boundary",
                    "isBoundary": true,
                    "canContainNodes": true,
                    "boundaryType": "trust"
                },
                "style": {
                    "width": 180,
                    "height": 120,
                    "background": "rgba(14, 165, 233, 0.1)",
                    "border": "2px dashed #0EA5E9"
                }
            },
            {
                "id": "internal-zone",
                "type": "boundary",
                "position": {"x": 280, "y": 80},
                "parentNode": "security-perimeter",
                "data": {
                    "label": "Internal Network",
                    "icon": "🏢",
                    "type": "boundary",
                    "isBoundary": true,
                    "canContainNodes": true,
                    "boundaryType": "system"
                },
                "style": {
                    "width": 200,
                    "height": 180,
                    "background": "rgba(245, 158, 11, 0.1)",
                    "border": "2px dashed #F59E0B"
                }
            }
        ],
        "edges": []
    }',
    '{"x": 0, "y": 0, "zoom": 0.8}',
    '{"layout": "manual", "showGrid": true, "snapToGrid": true}'
);

-- Compliance Zone Template
INSERT INTO diagram_templates (
    name, 
    description, 
    category, 
    is_built_in, 
    template_data,
    viewport_config,
    diagram_config
) VALUES (
    'HIPAA Compliance Architecture', 
    'Healthcare compliance zones with proper data flow and security boundaries',
    'Security',
    TRUE,
    '{
        "nodes": [
            {
                "id": "hipaa-boundary",
                "type": "boundary",
                "position": {"x": 40, "y": 40},
                "data": {
                    "label": "HIPAA Compliance Zone",
                    "icon": "📋",
                    "type": "boundary",
                    "isBoundary": true,
                    "canContainNodes": true,
                    "boundaryType": "compliance"
                },
                "style": {
                    "width": 550,
                    "height": 320,
                    "background": "rgba(147, 51, 234, 0.1)",
                    "border": "2px dashed #9333EA"
                }
            }
        ],
        "edges": []
    }',
    '{"x": 0, "y": 0, "zoom": 1}',
    '{"layout": "hierarchical", "showGrid": true}'
);

-- =====================================================
-- 7. BOUNDARY TYPE REFERENCE DATA
-- =====================================================
-- Purpose: Insert standard boundary types and their configurations

INSERT INTO diagram_templates (
    name,
    description,
    category,
    is_built_in,
    template_data
) VALUES 
('VPC Boundary Template', 'Virtual Private Cloud container', 'AWS', TRUE, 
'{"boundaryType": "vpc", "defaultStyle": {"width": 300, "height": 200, "background": "rgba(59, 130, 246, 0.1)", "border": "2px dashed #3B82F6"}}'),

('Subnet Boundary Template', 'Network subnet container', 'Network', TRUE,
'{"boundaryType": "subnet", "defaultStyle": {"width": 200, "height": 150, "background": "rgba(16, 185, 129, 0.1)", "border": "2px dashed #10B981"}}'),

('Security Zone Template', 'Security perimeter container', 'Security', TRUE,
'{"boundaryType": "security", "defaultStyle": {"width": 250, "height": 180, "background": "rgba(239, 68, 68, 0.1)", "border": "2px dashed #EF4444"}}'),

('Compliance Zone Template', 'Regulatory compliance boundary', 'Security', TRUE,
'{"boundaryType": "compliance", "defaultStyle": {"width": 280, "height": 200, "background": "rgba(147, 51, 234, 0.1)", "border": "2px dashed #9333EA"}}'),

('System Boundary Template', 'Logical system container', 'Application', TRUE,
'{"boundaryType": "system", "defaultStyle": {"width": 320, "height": 220, "background": "rgba(245, 158, 11, 0.1)", "border": "2px dashed #F59E0B"}}'),

('Trust Zone Template', 'Security trust zone', 'Security', TRUE,
'{"boundaryType": "trust", "defaultStyle": {"width": 260, "height": 180, "background": "rgba(14, 165, 233, 0.1)", "border": "2px dashed #0EA5E9"}}');

-- =====================================================
-- 8. UPDATE EXISTING TABLES (if needed)
-- =====================================================
-- Purpose: Add boundary-related columns to existing tables

-- Add parent-child relationship columns to existing nodes table (if it exists)
-- ALTER TABLE nodes ADD COLUMN IF NOT EXISTS parent_node_id VARCHAR(255);
-- ALTER TABLE nodes ADD COLUMN IF NOT EXISTS is_boundary BOOLEAN DEFAULT FALSE;
-- ALTER TABLE nodes ADD COLUMN IF NOT EXISTS boundary_type VARCHAR(100);

-- =====================================================
-- 9. VIEWS FOR BOUNDARY QUERIES
-- =====================================================
-- Purpose: Create convenient views for boundary containment queries

-- View: All boundaries with their contained nodes
CREATE OR REPLACE VIEW vw_boundary_hierarchy AS
SELECT 
    t.id as template_id,
    t.name as template_name,
    parent.node_id as boundary_id,
    parent.boundary_type,
    parent.node_data->>'label' as boundary_label,
    child.node_id as contained_node_id,
    child.category as contained_node_category,
    child.node_data->>'label' as contained_node_label,
    bc.containment_depth,
    bc.containment_type
FROM diagram_templates t
JOIN diagram_nodes parent ON t.id = parent.template_id AND parent.is_boundary = TRUE
LEFT JOIN boundary_containment bc ON t.id = bc.template_id AND parent.node_id = bc.parent_boundary_id
LEFT JOIN diagram_nodes child ON t.id = child.template_id AND bc.child_node_id = child.node_id;

-- View: Template statistics with boundary counts
CREATE OR REPLACE VIEW vw_template_statistics AS
SELECT 
    t.id,
    t.name,
    t.category,
    t.usage_count,
    COUNT(n.id) as total_nodes,
    COUNT(CASE WHEN n.is_boundary THEN 1 END) as boundary_count,
    COUNT(CASE WHEN n.parent_node_id IS NOT NULL THEN 1 END) as contained_nodes,
    COUNT(e.id) as total_edges,
    t.created_at,
    t.last_used_at
FROM diagram_templates t
LEFT JOIN diagram_nodes n ON t.id = n.template_id
LEFT JOIN diagram_edges e ON t.id = e.template_id
GROUP BY t.id, t.name, t.category, t.usage_count, t.created_at, t.last_used_at;

-- =====================================================
-- 10. FUNCTIONS FOR BOUNDARY OPERATIONS
-- =====================================================
-- Purpose: Helper functions for boundary containment logic

-- Function: Check if a node can be contained within a boundary
CREATE OR REPLACE FUNCTION can_contain_node(
    p_boundary_id VARCHAR(255),
    p_node_id VARCHAR(255),
    p_template_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    boundary_can_contain BOOLEAN;
    would_create_cycle BOOLEAN;
BEGIN
    -- Check if boundary can contain nodes
    SELECT can_contain_nodes INTO boundary_can_contain
    FROM diagram_nodes 
    WHERE template_id = p_template_id AND node_id = p_boundary_id;
    
    IF NOT COALESCE(boundary_can_contain, FALSE) THEN
        RETURN FALSE;
    END IF;
    
    -- Check for circular containment (simplified check)
    SELECT EXISTS(
        SELECT 1 FROM boundary_containment
        WHERE template_id = p_template_id 
        AND parent_boundary_id = p_node_id 
        AND child_node_id = p_boundary_id
    ) INTO would_create_cycle;
    
    RETURN NOT would_create_cycle;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. INDEXES FOR PERFORMANCE
-- =====================================================
-- Purpose: Additional indexes for optimal query performance

CREATE INDEX IF NOT EXISTS idx_diagram_templates_usage_count ON diagram_templates(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_diagram_templates_updated_at ON diagram_templates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_category ON diagram_nodes(category);
CREATE INDEX IF NOT EXISTS idx_diagram_nodes_node_type ON diagram_nodes(node_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nodes_template_boundary ON diagram_nodes(template_id, is_boundary, boundary_type);
CREATE INDEX IF NOT EXISTS idx_containment_template_parent ON boundary_containment(template_id, parent_boundary_id);

-- =====================================================
-- 12. CONSTRAINTS AND TRIGGERS
-- =====================================================
-- Purpose: Data integrity and automatic updates

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_diagram_templates_updated_at
    BEFORE UPDATE ON diagram_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagram_nodes_updated_at
    BEFORE UPDATE ON diagram_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagram_edges_updated_at
    BEFORE UPDATE ON diagram_edges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- END OF SCHEMA
-- =====================================================
-- This schema provides complete support for:
-- 1. Template management with categorization
-- 2. Node storage with boundary containment relationships  
-- 3. Edge connections between nodes
-- 4. Boundary hierarchy tracking
-- 5. Usage analytics and performance monitoring
-- 6. Built-in templates for immediate use
-- 7. Optimized queries through views and indexes
-- 8. Data integrity through constraints and triggers
-- =====================================================