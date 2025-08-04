-- =====================================================
-- Clean up duplicate metrics in the metrics table
-- Keep only the most recent version of each metric
-- =====================================================

-- First, let's see what duplicates we have
SELECT 
  name, 
  COUNT(*) as duplicate_count,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM metrics 
GROUP BY name 
HAVING COUNT(*) > 1 
ORDER BY duplicate_count DESC, name;

-- Create a temporary table to identify which records to keep
CREATE TEMP TABLE metrics_to_keep AS
SELECT DISTINCT ON (name) 
  id,
  name,
  created_at
FROM metrics 
ORDER BY name, created_at DESC;

-- Show what we're keeping
SELECT 
  m.name,
  m.id as keeping_id,
  m.created_at as keeping_created_at,
  m.description,
  m.value
FROM metrics m
INNER JOIN metrics_to_keep mtk ON m.id = mtk.id
WHERE m.name IN (
  SELECT name 
  FROM metrics 
  GROUP BY name 
  HAVING COUNT(*) > 1
)
ORDER BY m.name;

-- Delete the duplicates (keep only the ones in our temp table)
DELETE FROM metrics 
WHERE id NOT IN (SELECT id FROM metrics_to_keep);

-- Show the cleanup results
SELECT 'Cleanup completed!' as status;

-- Verify no more duplicates
SELECT 
  name, 
  COUNT(*) as count
FROM metrics 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Show final metrics count
SELECT 
  COUNT(*) as total_metrics,
  COUNT(CASE WHEN source IN ('database', 'calculated') THEN 1 END) as custom_metrics,
  COUNT(CASE WHEN source NOT IN ('database', 'calculated') THEN 1 END) as original_metrics
FROM metrics;

-- Show metrics by category
SELECT 
  CASE 
    WHEN name LIKE '%system%' THEN 'Systems'
    WHEN name LIKE '%asset%' THEN 'Assets'
    WHEN name LIKE '%vulnerabilit%' OR name LIKE '%critical_open%' OR name LIKE '%high_open%' OR name LIKE '%cvss%' THEN 'Vulnerabilities'
    WHEN name LIKE '%patch%' THEN 'Patches'
    WHEN name LIKE '%cyber_exposure%' OR name LIKE '%maturity%' OR name LIKE '%remediation%' THEN 'Risk & Maturity'
    ELSE 'Other'
  END as category,
  COUNT(*) as metric_count
FROM metrics
GROUP BY 
  CASE 
    WHEN name LIKE '%system%' THEN 'Systems'
    WHEN name LIKE '%asset%' THEN 'Assets'
    WHEN name LIKE '%vulnerabilit%' OR name LIKE '%critical_open%' OR name LIKE '%high_open%' OR name LIKE '%cvss%' THEN 'Vulnerabilities'
    WHEN name LIKE '%patch%' THEN 'Patches'
    WHEN name LIKE '%cyber_exposure%' OR name LIKE '%maturity%' OR name LIKE '%remediation%' THEN 'Risk & Maturity'
    ELSE 'Other'
  END
ORDER BY metric_count DESC;
