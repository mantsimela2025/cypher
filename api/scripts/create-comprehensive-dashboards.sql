-- =====================================================
-- CREATE COMPREHENSIVE DASHBOARDS WITH METRICS
-- Systems, Assets, Vulnerabilities, Risk, Cost, and Patching
-- =====================================================

-- First, let's get the admin user ID for created_by
DO $$
DECLARE
    admin_user_id INTEGER;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- =====================================================
    -- 1. SYSTEMS DASHBOARD
    -- =====================================================
    INSERT INTO dashboards (name, description, layout, is_default, created_by) VALUES
    ('Systems Overview', 'Comprehensive systems inventory and health monitoring', 
     '{"grid": {"columns": 12, "rows": 8}, "widgets": []}', false, admin_user_id);
    
    -- Link Systems Metrics to Systems Dashboard
    INSERT INTO dashboard_metrics (dashboard_id, metric_id, position, width, height, chart_type, config)
    SELECT 
        (SELECT id FROM dashboards WHERE name = 'Systems Overview'),
        m.id,
        ROW_NUMBER() OVER (ORDER BY m.name),
        CASE 
            WHEN m.name LIKE '%percentage%' THEN 6
            WHEN m.name LIKE '%total%' THEN 4
            ELSE 4
        END as width,
        CASE 
            WHEN m.name LIKE '%percentage%' THEN 3
            ELSE 2
        END as height,
        CASE 
            WHEN m.name LIKE '%percentage%' THEN 'gauge'
            WHEN m.name LIKE '%total%' THEN 'number'
            WHEN m.name LIKE '%by_%' THEN 'pie'
            ELSE 'bar'
        END as chart_type,
        CASE 
            WHEN m.name LIKE '%percentage%' THEN '{"min": 0, "max": 100, "thresholds": [{"value": 70, "color": "yellow"}, {"value": 90, "color": "green"}]}'
            WHEN m.name LIKE '%total%' THEN '{"showTrend": true, "trendPeriod": "7d"}'
            ELSE '{}'
        END::jsonb as config
    FROM metrics m 
    WHERE m.name LIKE '%system%' AND m.is_active = true;

    -- =====================================================
    -- 2. ASSETS DASHBOARD
    -- =====================================================
    INSERT INTO dashboards (name, description, layout, is_default, created_by) VALUES
    ('Assets Management', 'Asset inventory, coverage, and operational status monitoring', 
     '{"grid": {"columns": 12, "rows": 10}, "widgets": []}', false, admin_user_id);
    
    -- Link Assets Metrics to Assets Dashboard
    INSERT INTO dashboard_metrics (dashboard_id, metric_id, position, width, height, chart_type, config)
    SELECT 
        (SELECT id FROM dashboards WHERE name = 'Assets Management'),
        m.id,
        ROW_NUMBER() OVER (ORDER BY 
            CASE 
                WHEN m.name = 'total_assets' THEN 1
                WHEN m.name = 'asset_coverage_percentage' THEN 2
                WHEN m.name = 'agent_deployment_percentage' THEN 3
                ELSE 4
            END, m.name),
        CASE 
            WHEN m.name IN ('total_assets') THEN 3
            WHEN m.name LIKE '%percentage%' THEN 6
            WHEN m.name LIKE '%seen_%' THEN 4
            ELSE 4
        END as width,
        CASE 
            WHEN m.name LIKE '%percentage%' THEN 4
            WHEN m.name = 'total_assets' THEN 2
            ELSE 3
        END as height,
        CASE 
            WHEN m.name LIKE '%percentage%' THEN 'gauge'
            WHEN m.name = 'total_assets' THEN 'number'
            WHEN m.name LIKE '%seen_%' THEN 'line'
            WHEN m.name LIKE '%with_%' OR m.name LIKE '%without_%' THEN 'donut'
            ELSE 'bar'
        END as chart_type,
        CASE 
            WHEN m.name LIKE '%percentage%' THEN '{"min": 0, "max": 100, "thresholds": [{"value": 80, "color": "yellow"}, {"value": 95, "color": "green"}]}'
            WHEN m.name = 'total_assets' THEN '{"showTrend": true, "trendPeriod": "30d", "icon": "server"}'
            WHEN m.name LIKE '%seen_%' THEN '{"timeRange": "30d", "showDataPoints": true}'
            ELSE '{}'
        END::jsonb as config
    FROM metrics m 
    WHERE m.name LIKE '%asset%' AND m.is_active = true;

    -- =====================================================
    -- 3. VULNERABILITIES DASHBOARD
    -- =====================================================
    INSERT INTO dashboards (name, description, layout, is_default, created_by) VALUES
    ('Vulnerability Management', 'Comprehensive vulnerability tracking, severity analysis, and remediation progress', 
     '{"grid": {"columns": 12, "rows": 12}, "widgets": []}', false, admin_user_id);
    
    -- Link Vulnerability Metrics to Vulnerabilities Dashboard
    INSERT INTO dashboard_metrics (dashboard_id, metric_id, position, width, height, chart_type, config)
    SELECT 
        (SELECT id FROM dashboards WHERE name = 'Vulnerability Management'),
        m.id,
        ROW_NUMBER() OVER (ORDER BY 
            CASE 
                WHEN m.name = 'total_vulnerabilities_new' THEN 1
                WHEN m.name = 'vulnerabilities_critical_new' THEN 2
                WHEN m.name = 'vulnerabilities_high_new' THEN 3
                WHEN m.name = 'vulnerabilities_open_new' THEN 4
                WHEN m.name = 'vulnerabilities_fixed_new' THEN 5
                WHEN m.name LIKE '%age_%' THEN 6
                ELSE 7
            END, m.name),
        CASE 
            WHEN m.name IN ('total_vulnerabilities_new', 'vulnerabilities_critical_new', 'vulnerabilities_high_new') THEN 3
            WHEN m.name LIKE '%age_%' THEN 6
            WHEN m.name LIKE '%cvss%' THEN 4
            ELSE 4
        END as width,
        CASE 
            WHEN m.name IN ('total_vulnerabilities_new', 'vulnerabilities_critical_new', 'vulnerabilities_high_new') THEN 2
            WHEN m.name LIKE '%age_%' THEN 3
            ELSE 3
        END as height,
        CASE 
            WHEN m.name = 'total_vulnerabilities_new' THEN 'number'
            WHEN m.name IN ('vulnerabilities_critical_new', 'vulnerabilities_high_new', 'vulnerabilities_medium_new', 'vulnerabilities_low_new') THEN 'donut'
            WHEN m.name LIKE '%age_%' THEN 'bar'
            WHEN m.name LIKE '%cvss%' THEN 'gauge'
            WHEN m.name IN ('vulnerabilities_open_new', 'vulnerabilities_fixed_new') THEN 'pie'
            ELSE 'line'
        END as chart_type,
        CASE 
            WHEN m.name = 'total_vulnerabilities_new' THEN '{"showTrend": true, "trendPeriod": "7d", "icon": "shield-exclamation", "color": "red"}'
            WHEN m.name = 'vulnerabilities_critical_new' THEN '{"color": "#dc3545", "showPercentage": true}'
            WHEN m.name = 'vulnerabilities_high_new' THEN '{"color": "#fd7e14", "showPercentage": true}'
            WHEN m.name LIKE '%cvss%' THEN '{"min": 0, "max": 10, "thresholds": [{"value": 4, "color": "yellow"}, {"value": 7, "color": "orange"}, {"value": 9, "color": "red"}]}'
            WHEN m.name LIKE '%age_%' THEN '{"xAxis": "Age Range", "yAxis": "Count", "colors": ["#28a745", "#ffc107", "#fd7e14", "#dc3545"]}'
            ELSE '{}'
        END::jsonb as config
    FROM metrics m 
    WHERE (m.name LIKE '%vulnerabilit%' OR m.name LIKE '%cvss%') AND m.is_active = true;

    -- =====================================================
    -- 4. RISK DASHBOARD
    -- =====================================================
    INSERT INTO dashboards (name, description, layout, is_default, created_by) VALUES
    ('Risk Assessment', 'Comprehensive risk analysis, exposure scoring, and maturity assessment', 
     '{"grid": {"columns": 12, "rows": 10}, "widgets": []}', false, admin_user_id);
    
    -- Link Risk Metrics to Risk Dashboard
    INSERT INTO dashboard_metrics (dashboard_id, metric_id, position, width, height, chart_type, config)
    SELECT 
        (SELECT id FROM dashboards WHERE name = 'Risk Assessment'),
        m.id,
        ROW_NUMBER() OVER (ORDER BY 
            CASE 
                WHEN m.name = 'cyber_exposure_score' THEN 1
                WHEN m.name LIKE '%maturity%' THEN 2
                WHEN m.name LIKE '%exposure%' THEN 3
                WHEN m.name LIKE '%remediation%' THEN 4
                ELSE 5
            END, m.name),
        CASE 
            WHEN m.name = 'cyber_exposure_score' THEN 6
            WHEN m.name LIKE '%maturity%' THEN 4
            WHEN m.name LIKE '%exposure%' THEN 6
            ELSE 4
        END as width,
        CASE 
            WHEN m.name = 'cyber_exposure_score' THEN 4
            WHEN m.name LIKE '%maturity%' THEN 3
            ELSE 3
        END as height,
        CASE 
            WHEN m.name = 'cyber_exposure_score' THEN 'gauge'
            WHEN m.name LIKE '%maturity%' THEN 'radial'
            WHEN m.name LIKE '%exposure%' THEN 'gauge'
            WHEN m.name LIKE '%remediation%' THEN 'line'
            ELSE 'bar'
        END as chart_type,
        CASE 
            WHEN m.name = 'cyber_exposure_score' THEN '{"min": 0, "max": 1000, "thresholds": [{"value": 300, "color": "green"}, {"value": 600, "color": "yellow"}, {"value": 800, "color": "red"}], "title": "Cyber Exposure Score"}'
            WHEN m.name LIKE '%maturity%' THEN '{"min": 0, "max": 4, "labels": ["F", "D", "C", "B", "A"], "colors": ["#dc3545", "#fd7e14", "#ffc107", "#20c997", "#28a745"]}'
            WHEN m.name LIKE '%exposure%' THEN '{"min": 0, "max": 1000, "thresholds": [{"value": 200, "color": "green"}, {"value": 500, "color": "yellow"}, {"value": 800, "color": "red"}]}'
            WHEN m.name LIKE '%remediation%' THEN '{"timeRange": "30d", "yAxis": "Percentage", "target": 50}'
            ELSE '{}'
        END::jsonb as config
    FROM metrics m 
    WHERE (m.name LIKE '%risk%' OR m.name LIKE '%exposure%' OR m.name LIKE '%maturity%' OR m.name LIKE '%remediation%') 
      AND m.is_active = true;

    -- =====================================================
    -- 5. COST DASHBOARD
    -- =====================================================
    INSERT INTO dashboards (name, description, layout, is_default, created_by) VALUES
    ('Cost Intelligence', 'Financial analysis of security investments, cost efficiency, and ROI tracking',
     '{"grid": {"columns": 12, "rows": 8}, "widgets": []}', false, admin_user_id);

    -- Link Cost Metrics to Cost Dashboard
    INSERT INTO dashboard_metrics (dashboard_id, metric_id, position, width, height, chart_type, config)
    SELECT
        (SELECT id FROM dashboards WHERE name = 'Cost Intelligence'),
        m.id,
        ROW_NUMBER() OVER (ORDER BY
            CASE
                WHEN m.name LIKE '%cost_per_%' THEN 1
                WHEN m.name LIKE '%efficiency%' THEN 2
                WHEN m.name LIKE '%roi%' THEN 3
                ELSE 4
            END, m.name),
        CASE
            WHEN m.name LIKE '%cost_per_%' THEN 6
            WHEN m.name LIKE '%efficiency%' THEN 4
            WHEN m.name LIKE '%roi%' THEN 6
            ELSE 4
        END as width,
        CASE
            WHEN m.name LIKE '%cost_per_%' THEN 3
            WHEN m.name LIKE '%efficiency%' THEN 3
            WHEN m.name LIKE '%roi%' THEN 4
            ELSE 3
        END as height,
        CASE
            WHEN m.name LIKE '%cost_per_%' THEN 'number'
            WHEN m.name LIKE '%efficiency%' THEN 'gauge'
            WHEN m.name LIKE '%roi%' THEN 'line'
            ELSE 'bar'
        END as chart_type,
        CASE
            WHEN m.name LIKE '%cost_per_%' THEN '{"prefix": "$", "showTrend": true, "trendPeriod": "30d", "precision": 2}'
            WHEN m.name LIKE '%efficiency%' THEN '{"min": 0, "max": 100, "thresholds": [{"value": 60, "color": "yellow"}, {"value": 80, "color": "green"}], "suffix": "%"}'
            WHEN m.name LIKE '%roi%' THEN '{"timeRange": "90d", "yAxis": "ROI Ratio", "showDataPoints": true, "target": 1.0}'
            ELSE '{}'
        END::jsonb as config
    FROM metrics m
    WHERE (m.name LIKE '%cost%' OR m.name LIKE '%efficiency%' OR m.name LIKE '%roi%')
      AND m.is_active = true;

    -- =====================================================
    -- 6. PATCHING DASHBOARD
    -- =====================================================
    INSERT INTO dashboards (name, description, layout, is_default, created_by) VALUES
    ('Patch Management', 'Patch availability, deployment tracking, and vulnerability remediation progress',
     '{"grid": {"columns": 12, "rows": 8}, "widgets": []}', false, admin_user_id);

    -- Link Patch Metrics to Patching Dashboard
    INSERT INTO dashboard_metrics (dashboard_id, metric_id, position, width, height, chart_type, config)
    SELECT
        (SELECT id FROM dashboards WHERE name = 'Patch Management'),
        m.id,
        ROW_NUMBER() OVER (ORDER BY
            CASE
                WHEN m.name = 'total_patches' THEN 1
                WHEN m.name = 'patches_critical' THEN 2
                WHEN m.name LIKE '%age_%' THEN 3
                ELSE 4
            END, m.name),
        CASE
            WHEN m.name IN ('total_patches', 'patches_critical', 'patches_high') THEN 3
            WHEN m.name LIKE '%age_%' THEN 6
            ELSE 4
        END as width,
        CASE
            WHEN m.name IN ('total_patches', 'patches_critical', 'patches_high') THEN 2
            WHEN m.name LIKE '%age_%' THEN 3
            ELSE 3
        END as height,
        CASE
            WHEN m.name = 'total_patches' THEN 'number'
            WHEN m.name IN ('patches_critical', 'patches_high') THEN 'donut'
            WHEN m.name LIKE '%age_%' THEN 'bar'
            ELSE 'line'
        END as chart_type,
        CASE
            WHEN m.name = 'total_patches' THEN '{"showTrend": true, "trendPeriod": "7d", "icon": "download", "color": "blue"}'
            WHEN m.name = 'patches_critical' THEN '{"color": "#dc3545", "showPercentage": true, "title": "Critical Patches"}'
            WHEN m.name = 'patches_high' THEN '{"color": "#fd7e14", "showPercentage": true, "title": "High Priority Patches"}'
            WHEN m.name LIKE '%age_%' THEN '{"xAxis": "Age Range", "yAxis": "Patch Count", "colors": ["#28a745", "#ffc107"]}'
            ELSE '{}'
        END::jsonb as config
    FROM metrics m
    WHERE m.name LIKE '%patch%' AND m.is_active = true;

    -- =====================================================
    -- 7. EXECUTIVE SUMMARY DASHBOARD (BONUS)
    -- =====================================================
    INSERT INTO dashboards (name, description, layout, is_default, created_by) VALUES
    ('Executive Summary', 'High-level KPIs and strategic metrics for executive reporting',
     '{"grid": {"columns": 12, "rows": 6}, "widgets": []}', true, admin_user_id);

    -- Link Key Executive Metrics
    INSERT INTO dashboard_metrics (dashboard_id, metric_id, position, width, height, chart_type, config)
    SELECT
        (SELECT id FROM dashboards WHERE name = 'Executive Summary'),
        m.id,
        ROW_NUMBER() OVER (ORDER BY
            CASE
                WHEN m.name = 'cyber_exposure_score' THEN 1
                WHEN m.name = 'total_vulnerabilities_new' THEN 2
                WHEN m.name = 'vulnerabilities_critical_new' THEN 3
                WHEN m.name = 'asset_coverage_percentage' THEN 4
                WHEN m.name = 'assessment_maturity_grade' THEN 5
                WHEN m.name = 'remediation_maturity_grade' THEN 6
                ELSE 7
            END),
        CASE
            WHEN m.name = 'cyber_exposure_score' THEN 6
            WHEN m.name IN ('total_vulnerabilities_new', 'vulnerabilities_critical_new') THEN 3
            WHEN m.name LIKE '%percentage%' THEN 6
            WHEN m.name LIKE '%maturity%' THEN 3
            ELSE 4
        END as width,
        CASE
            WHEN m.name = 'cyber_exposure_score' THEN 4
            WHEN m.name LIKE '%maturity%' THEN 3
            ELSE 2
        END as height,
        CASE
            WHEN m.name = 'cyber_exposure_score' THEN 'gauge'
            WHEN m.name IN ('total_vulnerabilities_new', 'vulnerabilities_critical_new') THEN 'number'
            WHEN m.name LIKE '%percentage%' THEN 'gauge'
            WHEN m.name LIKE '%maturity%' THEN 'radial'
            ELSE 'bar'
        END as chart_type,
        CASE
            WHEN m.name = 'cyber_exposure_score' THEN '{"min": 0, "max": 1000, "thresholds": [{"value": 300, "color": "green"}, {"value": 600, "color": "yellow"}, {"value": 800, "color": "red"}], "title": "Overall Risk"}'
            WHEN m.name = 'total_vulnerabilities_new' THEN '{"showTrend": true, "trendPeriod": "30d", "icon": "shield-exclamation"}'
            WHEN m.name = 'vulnerabilities_critical_new' THEN '{"showTrend": true, "trendPeriod": "7d", "icon": "exclamation-triangle", "color": "red"}'
            WHEN m.name LIKE '%percentage%' THEN '{"min": 0, "max": 100, "thresholds": [{"value": 70, "color": "yellow"}, {"value": 90, "color": "green"}], "suffix": "%"}'
            WHEN m.name LIKE '%maturity%' THEN '{"min": 0, "max": 4, "labels": ["F", "D", "C", "B", "A"], "colors": ["#dc3545", "#fd7e14", "#ffc107", "#20c997", "#28a745"]}'
            ELSE '{}'
        END::jsonb as config
    FROM metrics m
    WHERE m.name IN (
        'cyber_exposure_score',
        'total_vulnerabilities_new',
        'vulnerabilities_critical_new',
        'asset_coverage_percentage',
        'assessment_maturity_grade',
        'remediation_maturity_grade'
    ) AND m.is_active = true;

END $$;

-- =====================================================
-- SUMMARY AND VERIFICATION
-- =====================================================

-- Display created dashboards
SELECT 'Dashboard creation completed successfully!' as status;

-- Show dashboard summary
SELECT
    d.id,
    d.name,
    d.description,
    d.is_default,
    COUNT(dm.id) as metric_count,
    d.created_at
FROM dashboards d
LEFT JOIN dashboard_metrics dm ON d.id = dm.dashboard_id
WHERE d.created_at >= NOW() - INTERVAL '5 minutes'
GROUP BY d.id, d.name, d.description, d.is_default, d.created_at
ORDER BY d.name;

-- Show metrics distribution across dashboards
SELECT
    d.name as dashboard_name,
    dm.chart_type,
    COUNT(*) as widget_count
FROM dashboards d
INNER JOIN dashboard_metrics dm ON d.id = dm.dashboard_id
WHERE d.created_at >= NOW() - INTERVAL '5 minutes'
GROUP BY d.name, dm.chart_type
ORDER BY d.name, dm.chart_type;

-- Show total metrics linked
SELECT
    COUNT(DISTINCT dm.dashboard_id) as dashboards_created,
    COUNT(dm.id) as total_widgets,
    COUNT(DISTINCT dm.metric_id) as unique_metrics_used
FROM dashboard_metrics dm
INNER JOIN dashboards d ON dm.dashboard_id = d.id
WHERE d.created_at >= NOW() - INTERVAL '5 minutes';
