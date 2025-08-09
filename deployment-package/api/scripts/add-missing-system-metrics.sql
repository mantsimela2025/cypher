-- Add missing system metrics that weren't captured due to column name differences

INSERT INTO metrics (name, description, type, category, value, unit, labels, source, aggregation_period, last_calculated, metadata) VALUES
('total_systems', 'Total number of systems in inventory', 'counter', 'security', (SELECT COUNT(*) FROM systems), 'systems', '{"scope": "all"}', 'database', 'daily', NOW(), '{"table": "systems", "query_type": "count"}'),

('systems_by_status_active', 'Number of active systems', 'counter', 'security', (SELECT COUNT(*) FROM systems WHERE status = 'Active'), 'systems', '{"status": "Active"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "status=Active"}'),

('systems_by_status_inactive', 'Number of inactive systems', 'counter', 'security', (SELECT COUNT(*) FROM systems WHERE status = 'Inactive'), 'systems', '{"status": "Inactive"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "status=Inactive"}'),

('systems_by_type_information', 'Number of information systems', 'counter', 'security', (SELECT COUNT(*) FROM systems WHERE system_type = 'Information System'), 'systems', '{"system_type": "Information System"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "system_type=Information System"}'),

('systems_by_type_general_support', 'Number of general support systems', 'counter', 'security', (SELECT COUNT(*) FROM systems WHERE system_type = 'General Support System'), 'systems', '{"system_type": "General Support System"}', 'database', 'daily', NOW(), '{"table": "systems", "filter": "system_type=General Support System"}'),

-- System-Asset relationship metrics
('systems_with_assets', 'Number of systems that have associated assets', 'counter', 'security', 
  (SELECT COUNT(DISTINCT s.id) FROM systems s 
   INNER JOIN assets a ON s.system_id = a.system_id), 
  'systems', '{"has_assets": "true"}', 'calculated', 'daily', NOW(), '{"calculation": "systems with linked assets"}'),

('systems_without_assets', 'Number of systems without associated assets', 'counter', 'security', 
  (SELECT COUNT(*) FROM systems s 
   WHERE NOT EXISTS (SELECT 1 FROM assets a WHERE a.system_id = s.system_id)), 
  'systems', '{"has_assets": "false"}', 'calculated', 'daily', NOW(), '{"calculation": "systems without linked assets"}'),

-- System coverage percentage
('system_asset_coverage_percentage', 'Percentage of systems with associated assets', 'gauge', 'security', 
  ROUND((SELECT COUNT(DISTINCT s.id) * 100.0 FROM systems s 
         INNER JOIN assets a ON s.system_id = a.system_id) / 
        NULLIF((SELECT COUNT(*) FROM systems), 0), 2), 
  'percent', '{"metric_type": "system_coverage"}', 'calculated', 'daily', NOW(), '{"calculation": "systems_with_assets / total_systems * 100"}')
