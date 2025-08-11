-- =============================================================================
-- RAS DASH - Insert Patch Data from Vulnerabilities (Adapted to current schema)
-- =============================================================================

-- Enable uuid extension (harmless if already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PATCH EXTRACTION AND INSERTION
-- =============================================================================

WITH source_v AS (
  SELECT
    v.id AS vulnerability_id,
    v.batch_id,
    v.asset_uuid,
    v.plugin_id,
    v.plugin_name,
    v.plugin_family,
    v.solution,
    COALESCE(LOWER(v.severity_name),
             CASE v.severity
               WHEN 4 THEN 'critical'
               WHEN 3 THEN 'high'
               WHEN 2 THEN 'medium'
               WHEN 1 THEN 'low'
               ELSE NULL
             END) AS severity_text,
    COALESCE(LOWER(v.state), 'open') AS state,
    v.cvss_base_score,
    v.cvss3_base_score,
    v.raw_json
  FROM public.vulnerabilities v
  WHERE v.solution IS NOT NULL AND LENGTH(TRIM(v.solution)) > 0
),
 analyzed AS (
  SELECT
    s.*,
    COALESCE(
      (regexp_match(s.solution, '(?i)(KB\\d+)'))[1],
      (regexp_match(s.solution, '(?i)(MS\\d+-\\d+)'))[1],
      (regexp_match(s.solution, '(?i)(CVE-\\d{4}-\\d+)'))[1],
      (regexp_match(s.solution, '(?i)(RHSA-\\d{4}:\\d+)'))[1],
      'PATCH-' || s.plugin_id::text
    ) AS patch_id_extracted,
    CASE
      WHEN s.solution ~* 'version\\s+(\\d+[\\.\\d]*)'
        THEN 'Update to ' || (regexp_match(s.solution, '(?i)version\\s+(\\d+[\\.\\d]*)'))[1]
      WHEN s.solution ~* '(security update|cumulative update|service pack|hotfix)\\s+[^\\s]*'
        THEN (regexp_match(s.solution, '(?i)(security update|cumulative update|service pack|hotfix)\\s+[^\\s]*'))[1]
      ELSE NULL
    END AS patch_name_hint,
    (s.solution ~* '(reboot|restart|restarting|system restart|machine restart|requires restart|requires reboot)') AS requires_reboot_flag,
    CASE
      WHEN s.solution ~* 'service pack' THEN interval '1 hour'
      WHEN s.solution ~* '(windows.*update|microsoft.*update)' THEN interval '15 minutes'
      WHEN s.solution ~* '(linux|ubuntu|centos|red hat|debian)' THEN interval '5 minutes'
      WHEN s.solution ~* 'firmware' THEN interval '30 minutes'
      WHEN s.solution ~* 'driver' THEN interval '10 minutes'
      ELSE interval '10 minutes'
    END AS estimated_install_time_iv,
    COALESCE(
      (SELECT vm.vendor FROM public.vendor_map vm
       WHERE vm.family_pattern IS NOT NULL
         AND COALESCE(s.plugin_family,'') ILIKE vm.family_pattern
       LIMIT 1),
      (SELECT vm.vendor FROM public.vendor_map vm
       WHERE vm.name_pattern IS NOT NULL
         AND COALESCE(s.plugin_name,'') ILIKE vm.name_pattern
       LIMIT 1),
      CASE
        WHEN s.solution ~* '(microsoft|windows)' THEN 'Microsoft'
        WHEN s.solution ~* 'red hat' THEN 'Red Hat'
        WHEN s.solution ~* '(ubuntu|canonical)' THEN 'Canonical'
        WHEN s.solution ~* 'centos' THEN 'CentOS'
        WHEN s.solution ~* 'oracle.*linux' THEN 'Oracle'
        WHEN s.solution ~* 'suse' THEN 'SUSE'
        WHEN s.solution ~* 'debian' THEN 'Debian'
        WHEN s.solution ~* 'adobe' THEN 'Adobe'
        WHEN s.solution ~* 'apache' THEN 'Apache'
        WHEN s.solution ~* 'cisco' THEN 'Cisco'
        WHEN s.solution ~* 'vmware' THEN 'VMware'
        WHEN s.solution ~* 'java' THEN 'Oracle'
        WHEN s.solution ~* 'firefox' THEN 'Mozilla'
        WHEN s.solution ~* 'chrome' THEN 'Google'
        ELSE 'Unknown'
      END
    ) AS vendor_detected,
    CASE
      WHEN s.solution ~* 'service pack' THEN 'service_pack'
      WHEN s.solution ~* 'cumulative update' THEN 'cumulative_update'
      WHEN s.solution ~* 'hotfix' THEN 'hotfix'
      WHEN COALESCE(s.plugin_family,'') ILIKE ANY (ARRAY['%windows%','%ubuntu%','%red hat%','%debian%','%centos%','%oracle linux%','%suse%'])
        THEN 'os_patch'
      WHEN s.solution ~* '(firmware)' THEN 'firmware_update'
      WHEN s.solution ~* '(driver)' THEN 'driver_update'
      WHEN s.solution ~* '(?i)security update|security patch' THEN 'security_update'
      ELSE 'application_patch'
    END AS patch_type_detected,
    (s.solution ~* '(KB\\d+|MS\\d+-\\d+|CVE-\\d{4}-\\d+|RHSA-\\d{4}:\\d+)') AS has_explicit_patch_id,
    (regexp_match(s.solution, '(?i)(CVE-\\d{4}-\\d+)'))[1] AS cve_id_extracted,
    NULLIF(TRIM(s.raw_json->>'patch_publication_date'), '')::timestamp AS release_date_extracted
  FROM source_v s
),
 filtered AS (
  SELECT *
  FROM analyzed a
  WHERE
    (
      a.solution ~* '(update|upgrade|patch|hotfix|security update|cumulative update|service pack|kb|ms|cve-|install the latest|apply the patch|upgrade to version|download and install|obtain the latest)'
      OR a.has_explicit_patch_id
      OR a.solution ~* 'version\\s+\\d+[\\.\\d]*'
    )
    AND NOT (
      COALESCE(a.plugin_family,'') ILIKE ANY (ARRAY[
        '%general%', '%service detection%', '%policy%', '%compliance%', '%settings%', '%nessus%', '%snmp%', '%scanner%', '%web servers%', '%information%'
      ])
      OR COALESCE(a.plugin_name,'') ILIKE ANY (ARRAY[
        '%scanner%', '%probe%', '%detection%', '%service detection%', '%certificate%', '%information disclosure%', '%syn scanner%', '%portscanner%'
      ])
      OR a.solution ~* '(no patch available|information only|investigate|manual verification|end of life)'
    )
)
INSERT INTO public.patches (
  patch_id,
  cve_id,
  vulnerability_id,
  asset_uuid,
  title,
  vendor,
  description,
  product,
  version_affected,
  patch_type,
  patch_version,
  severity,
  status,
  patch_description,
  release_date,
  kb,
  "version",
  applicable_to,
  download_url,
  patch_url,
  file_size,
  checksum,
  prerequisites,
  superseded_by,
  supersedes,
  reboot_required,
  estimated_install_time,
  patch_priority,
  business_impact,
  rollback_instructions,
  testing_notes,
  deployment_notes,
  created_at,
  updated_at,
  "source",
  batch_id,
  raw_json
)
SELECT DISTINCT ON (a.patch_id_extracted)
  a.patch_id_extracted AS patch_id,
  a.cve_id_extracted AS cve_id,
  a.vulnerability_id,
  a.asset_uuid,
  COALESCE(a.patch_name_hint, a.plugin_name, 'Patch') AS title,
  a.vendor_detected AS vendor,
  NULLIF(TRIM(a.raw_json->>'description'), '') AS description,
  NULL::varchar(100) AS product,
  NULL::varchar(100) AS version_affected,
  a.patch_type_detected AS patch_type,
  NULL::varchar(100) AS patch_version,
  COALESCE(a.severity_text, 'low') AS severity,
  CASE a.state
    WHEN 'open' THEN 'identified'
    WHEN 'fixed' THEN 'applied'
    WHEN 'reopened' THEN 'identified'
    ELSE 'identified'
  END AS status,
  a.solution AS patch_description,
  a.release_date_extracted AS release_date,
  (regexp_match(a.solution, '(?i)(KB\\d+)'))[1] AS kb,
  NULL::text AS "version",
  NULL::jsonb AS applicable_to,
  NULL::text AS download_url,
  NULL::text AS patch_url,
  NULL::varchar(20) AS file_size,
  NULL::varchar(255) AS checksum,
  NULL::text AS prerequisites,
  NULL::varchar(255) AS superseded_by,
  NULL::varchar(255) AS supersedes,
  a.requires_reboot_flag AS reboot_required,
  a.estimated_install_time_iv AS estimated_install_time,
  CASE COALESCE(a.severity_text, 'low')
    WHEN 'critical' THEN 'critical'
    WHEN 'high' THEN 'high'
    WHEN 'medium' THEN 'medium'
    WHEN 'low' THEN 'low'
    ELSE 'low'
  END AS patch_priority,
  NULL::text AS business_impact,
  NULL::text AS rollback_instructions,
  NULL::text AS testing_notes,
  NULL::text AS deployment_notes,
  NOW() AS created_at,
  NOW() AS updated_at,
  'vulnerability_analysis'::varchar(50) AS "source",
  a.batch_id,
  COALESCE(a.raw_json, '{}'::jsonb)
    || jsonb_build_object(
      'vendor', a.vendor_detected,
      'patch_type', a.patch_type_detected,
      'extraction_method', 'sql_analysis',
      'extracted_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'plugin_id', a.plugin_id,
      'original_severity', a.severity_text,
      'cvss_base_score', a.cvss_base_score,
      'cvss3_base_score', a.cvss3_base_score,
      'has_explicit_patch_id', a.has_explicit_patch_id
    ) AS raw_json
FROM filtered a
WHERE NOT EXISTS (
  SELECT 1 FROM public.patches p WHERE p.vulnerability_id = a.vulnerability_id
)
ON CONFLICT (asset_uuid, patch_id) DO UPDATE
SET
  cve_id = EXCLUDED.cve_id,
  vulnerability_id = EXCLUDED.vulnerability_id,
  asset_uuid = EXCLUDED.asset_uuid,
  title = EXCLUDED.title,
  vendor = EXCLUDED.vendor,
  description = EXCLUDED.description,
  product = EXCLUDED.product,
  version_affected = EXCLUDED.version_affected,
  patch_type = EXCLUDED.patch_type,
  patch_version = EXCLUDED.patch_version,
  severity = EXCLUDED.severity,
  status = EXCLUDED.status,
  patch_description = EXCLUDED.patch_description,
  release_date = EXCLUDED.release_date,
  kb = EXCLUDED.kb,
  "version" = EXCLUDED."version",
  applicable_to = EXCLUDED.applicable_to,
  download_url = EXCLUDED.download_url,
  patch_url = EXCLUDED.patch_url,
  file_size = EXCLUDED.file_size,
  checksum = EXCLUDED.checksum,
  prerequisites = EXCLUDED.prerequisites,
  superseded_by = EXCLUDED.superseded_by,
  supersedes = EXCLUDED.supersedes,
  reboot_required = EXCLUDED.reboot_required,
  estimated_install_time = EXCLUDED.estimated_install_time,
  patch_priority = EXCLUDED.patch_priority,
  business_impact = EXCLUDED.business_impact,
  rollback_instructions = EXCLUDED.rollback_instructions,
  testing_notes = EXCLUDED.testing_notes,
  deployment_notes = EXCLUDED.deployment_notes,
  updated_at = NOW(),
  "source" = EXCLUDED."source",
  batch_id = COALESCE(EXCLUDED.batch_id, public.patches.batch_id),
  raw_json = EXCLUDED.raw_json;

-- =============================================================================
-- POST-INSERTION ANALYSIS AND REPORTING
-- =============================================================================
DO $$
DECLARE
  patch_count INTEGER;
  vuln_count INTEGER;
  extraction_rate NUMERIC(10,2);
BEGIN
  SELECT COUNT(*) INTO patch_count FROM public.patches;
  SELECT COUNT(*) INTO vuln_count FROM public.vulnerabilities;

  extraction_rate := ROUND((patch_count::DECIMAL / NULLIF(vuln_count, 0)) * 100, 2);

  RAISE NOTICE '=== PATCH EXTRACTION SUMMARY ===';
  RAISE NOTICE 'Total vulnerabilities: %', vuln_count;
  RAISE NOTICE 'Patches extracted: %', patch_count;
  RAISE NOTICE 'Extraction rate: %% %', extraction_rate;
  RAISE NOTICE '================================';
END $$;

-- =============================================================================
-- VALIDATION QUERIES
-- =============================================================================

-- Distribution by priority
SELECT
  patch_priority,
  COUNT(*) AS patch_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM public.patches
GROUP BY patch_priority
ORDER BY CASE patch_priority
  WHEN 'critical' THEN 1
  WHEN 'high' THEN 2
  WHEN 'medium' THEN 3
  WHEN 'low' THEN 4
  ELSE 5 END;

-- Distribution by vendor
SELECT
  COALESCE(raw_json->>'vendor', 'Unknown') AS vendor,
  COUNT(*) AS patch_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM public.patches
GROUP BY COALESCE(raw_json->>'vendor', 'Unknown')
ORDER BY patch_count DESC
LIMIT 10;

-- Distribution by patch type
SELECT
  COALESCE(raw_json->>'patch_type', patch_type) AS patch_type,
  COUNT(*) AS patch_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM public.patches
GROUP BY COALESCE(raw_json->>'patch_type', patch_type)
ORDER BY patch_count DESC;

-- Patches requiring reboot
SELECT
  reboot_required,
  COUNT(*) AS patch_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM public.patches
GROUP BY reboot_required;

-- Sample extracted patches
SELECT
  p.patch_id,
  p.title,
  p.patch_priority,
  p.status,
  p.estimated_install_time,
  p.reboot_required,
  p.raw_json->>'vendor' AS vendor,
  COALESCE(p.raw_json->>'patch_type', p.patch_type) AS patch_type,
  v.plugin_id,
  LEFT(v.solution, 120) || '...' AS solution_excerpt
FROM public.patches p
JOIN public.vulnerabilities v ON p.vulnerability_id = v.id
ORDER BY
  CASE p.patch_priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5 END,
  p.created_at DESC
LIMIT 20;

-- =============================================================================
-- CLEANUP AND OPTIMIZATION
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_patches_vulnerability_id ON public.patches(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_patches_asset_uuid ON public.patches(asset_uuid);
CREATE INDEX IF NOT EXISTS idx_patches_priority ON public.patches(patch_priority);
CREATE INDEX IF NOT EXISTS idx_patches_status ON public.patches(status);
CREATE INDEX IF NOT EXISTS idx_patches_batch_id ON public.patches(batch_id);

ANALYZE public.patches;
ANALYZE public.vulnerabilities;
