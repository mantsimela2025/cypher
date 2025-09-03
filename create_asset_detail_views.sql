-- =====================================================
-- ASSET DETAIL VIEWS
-- =====================================================
-- Description: Create comprehensive views for asset detail pages
-- These views join all related tables to provide complete asset information
-- =====================================================

BEGIN;

-- Main Asset Detail View
CREATE OR REPLACE VIEW asset_detail_view AS
SELECT 
    -- Basic Asset Information
    a.id as asset_id,
    a.asset_uuid,
    a.hostname,
    a.netbios_name,
    a.system_id,
    a.has_agent,
    a.has_plugin_results,
    a.first_seen,
    a.last_seen,
    a.exposure_score,
    a.acr_score,
    a.criticality_rating,
    a.source,
    a.created_at as asset_created_at,
    a.updated_at as asset_updated_at,
    
    -- System Information
    s.name as system_name,
    s.system_type,
    s.environment as system_environment,
    s.responsible_organization,
    s.system_owner,
    s.authorizing_official,
    s.status as system_status,
    s.authorization_boundary,
    
    -- Network Information (Primary)
    an.fqdn,
    an.ipv4_address,
    an.mac_address,
    an.network_type,
    
    -- System Information (Asset-specific)
    asys.operating_system,
    asys.system_type as asset_system_type,
    asys.is_primary as is_primary_system,
    
    -- Lifecycle Information
    al.purchase_date,
    al.warranty_end_date,
    al.manufacturer_eol_date,
    al.internal_eol_date,
    al.replacement_cycle_months,
    al.estimated_replacement_cost,
    
    -- Summary Statistics
    (SELECT COUNT(*) FROM asset_vulnerabilities av WHERE av.asset_id = a.id) as vulnerability_count,
    (SELECT COUNT(*) FROM asset_vulnerabilities av WHERE av.asset_id = a.id AND av.detection_status = 'detected') as active_vulnerability_count,
    (SELECT COUNT(*) FROM asset_cost_management acm WHERE acm.asset_uuid = a.asset_uuid) as cost_record_count,
    (SELECT SUM(amount::numeric) FROM asset_cost_management acm WHERE acm.asset_uuid = a.asset_uuid) as total_cost,
    (SELECT COUNT(*) FROM asset_tags at WHERE at.asset_uuid = a.asset_uuid) as tag_count

FROM assets a
LEFT JOIN systems s ON a.system_id = s.system_id
LEFT JOIN asset_network an ON a.asset_uuid = an.asset_uuid AND an.is_primary = true
LEFT JOIN asset_systems asys ON a.asset_uuid = asys.asset_uuid AND asys.is_primary = true
LEFT JOIN asset_lifecycle al ON a.asset_uuid = al.asset_uuid;

-- Asset Network Details View
CREATE OR REPLACE VIEW asset_network_detail_view AS
SELECT 
    a.asset_uuid,
    a.hostname,
    json_agg(
        json_build_object(
            'fqdn', an.fqdn,
            'ipv4_address', an.ipv4_address,
            'mac_address', an.mac_address,
            'network_type', an.network_type,
            'is_primary', an.is_primary
        )
    ) as network_interfaces
FROM assets a
LEFT JOIN asset_network an ON a.asset_uuid = an.asset_uuid
GROUP BY a.asset_uuid, a.hostname;

-- Asset Vulnerabilities Summary View
CREATE OR REPLACE VIEW asset_vulnerabilities_summary_view AS
SELECT 
    a.asset_uuid,
    a.hostname,
    COUNT(*) as total_vulnerabilities,
    COUNT(CASE WHEN av.detection_status = 'detected' THEN 1 END) as active_vulnerabilities,
    COUNT(CASE WHEN av.detection_status = 'mitigated' THEN 1 END) as mitigated_vulnerabilities,
    COUNT(CASE WHEN av.detection_status = 'confirmed' THEN 1 END) as confirmed_vulnerabilities,
    COUNT(CASE WHEN av.detection_status = 'false_positive' THEN 1 END) as false_positive_vulnerabilities,
    COUNT(CASE WHEN v.severity_name = 'Critical' THEN 1 END) as critical_vulnerabilities,
    COUNT(CASE WHEN v.severity_name = 'High' THEN 1 END) as high_vulnerabilities,
    COUNT(CASE WHEN v.severity_name = 'Medium' THEN 1 END) as medium_vulnerabilities,
    COUNT(CASE WHEN v.severity_name = 'Low' THEN 1 END) as low_vulnerabilities,
    AVG(av.risk_score::numeric) as avg_risk_score,
    MAX(av.risk_score::numeric) as max_risk_score
FROM assets a
LEFT JOIN asset_vulnerabilities av ON a.id = av.asset_id
LEFT JOIN vulnerabilities v ON av.vulnerability_id = v.id
GROUP BY a.asset_uuid, a.hostname;

-- Asset Cost Summary View
CREATE OR REPLACE VIEW asset_cost_summary_view AS
SELECT 
    a.asset_uuid,
    a.hostname,
    COUNT(acm.id) as cost_record_count,
    SUM(acm.amount::numeric) as total_amount,
    SUM(CASE WHEN acm.cost_type = 'acquisition' THEN acm.amount::numeric ELSE 0 END) as acquisition_costs,
    SUM(CASE WHEN acm.cost_type = 'maintenance' THEN acm.amount::numeric ELSE 0 END) as maintenance_costs,
    SUM(CASE WHEN acm.cost_type = 'licensing' THEN acm.amount::numeric ELSE 0 END) as licensing_costs,
    SUM(CASE WHEN acm.cost_type = 'operational' THEN acm.amount::numeric ELSE 0 END) as operational_costs,
    json_agg(
        json_build_object(
            'id', acm.id,
            'cost_type', acm.cost_type,
            'amount', acm.amount,
            'currency', acm.currency,
            'billing_cycle', acm.billing_cycle,
            'vendor', acm.vendor,
            'start_date', acm.start_date,
            'end_date', acm.end_date
        ) ORDER BY acm.created_at DESC
    ) FILTER (WHERE acm.id IS NOT NULL) as cost_details
FROM assets a
LEFT JOIN asset_cost_management acm ON a.asset_uuid = acm.asset_uuid
GROUP BY a.asset_uuid, a.hostname;

-- Asset Tags View
CREATE OR REPLACE VIEW asset_tags_view AS
SELECT 
    a.asset_uuid,
    a.hostname,
    json_agg(
        json_build_object(
            'tag_key', at.tag_key,
            'tag_value', at.tag_value
        ) ORDER BY at.tag_key
    ) FILTER (WHERE at.id IS NOT NULL) as tags
FROM assets a
LEFT JOIN asset_tags at ON a.asset_uuid = at.asset_uuid
GROUP BY a.asset_uuid, a.hostname;

-- Complete Asset Detail View (All Related Data)
CREATE OR REPLACE VIEW asset_complete_detail_view AS
SELECT 
    adv.*,
    avs.total_vulnerabilities,
    avs.active_vulnerabilities,
    avs.mitigated_vulnerabilities,
    avs.confirmed_vulnerabilities,
    avs.false_positive_vulnerabilities,
    avs.critical_vulnerabilities,
    avs.high_vulnerabilities,
    avs.avg_risk_score,
    acs.total_amount as total_cost_amount,
    acs.acquisition_costs,
    acs.maintenance_costs,
    acs.licensing_costs,
    acs.operational_costs,
    atv.tags
FROM asset_detail_view adv
LEFT JOIN asset_vulnerabilities_summary_view avs ON adv.asset_uuid = avs.asset_uuid
LEFT JOIN asset_cost_summary_view acs ON adv.asset_uuid = acs.asset_uuid
LEFT JOIN asset_tags_view atv ON adv.asset_uuid = atv.asset_uuid;

COMMIT;

-- Example queries to use these views:

-- Get complete asset details
-- SELECT * FROM asset_complete_detail_view WHERE asset_uuid = 'your-asset-uuid';

-- Get asset with all network interfaces
-- SELECT a.*, and.network_interfaces 
-- FROM asset_detail_view a
-- LEFT JOIN asset_network_detail_view and ON a.asset_uuid = and.asset_uuid
-- WHERE a.asset_uuid = 'your-asset-uuid';

-- Get asset vulnerability breakdown
-- SELECT * FROM asset_vulnerabilities_summary_view WHERE asset_uuid = 'your-asset-uuid';