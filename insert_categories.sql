-- Clear existing data
DELETE FROM categories;

-- Insert root categories first
INSERT INTO categories (name, description, color, is_active, parent_id, status, metadata, created_by, updated_by, created_at, updated_at) VALUES
('Security Documentation', 'All security-related policies, procedures, and guidelines', '#007bff', true, NULL, 'active', '{"documentCount": 25}', 6, 6, '2024-01-15 10:30:00', '2024-01-20 14:45:00'),
('Technical Documentation', 'System architecture, API docs, and technical specifications', '#28a745', true, NULL, 'active', '{"documentCount": 18}', 6, 6, '2024-01-12 08:20:00', '2024-01-22 13:15:00'),
('Compliance', 'Regulatory compliance documentation and audits', '#ffc107', true, NULL, 'active', '{"documentCount": 15}', 6, 6, '2024-01-10 12:45:00', '2024-01-19 17:20:00'),
('Training Materials', 'Employee training documents and resources', '#6c757d', true, NULL, 'draft', '{"documentCount": 3}', 6, 6, '2024-01-25 10:00:00', '2024-01-25 10:00:00');

-- Insert subcategories
INSERT INTO categories (name, description, color, is_active, parent_id, status, metadata, created_by, updated_by, created_at, updated_at) VALUES
('Policies', 'Corporate security policies and standards', '#17a2b8', true, (SELECT id FROM categories WHERE name = 'Security Documentation'), 'active', '{"documentCount": 12}', 6, 6, '2024-01-16 09:15:00', '2024-01-18 11:30:00'),
('Procedures', 'Step-by-step security procedures and workflows', '#dc3545', true, (SELECT id FROM categories WHERE name = 'Security Documentation'), 'active', '{"documentCount": 8}', 6, 6, '2024-01-16 10:45:00', '2024-01-19 16:20:00'),
('API Documentation', 'REST API specifications and integration guides', '#fd7e14', true, (SELECT id FROM categories WHERE name = 'Technical Documentation'), 'active', '{"documentCount": 7}', 6, 6, '2024-01-17 14:30:00', '2024-01-21 09:45:00'),
('System Architecture', 'Architecture diagrams and system design documents', '#6f42c1', true, (SELECT id FROM categories WHERE name = 'Technical Documentation'), 'active', '{"documentCount": 11}', 6, 6, '2024-01-18 11:15:00', '2024-01-23 15:30:00');