-- Seed initial RMF questionnaires using JSON Schema style structures
-- Note: These are simplified examples to get started; expand as needed
BEGIN;

-- HVA (High Value Asset) Questionnaire
INSERT INTO public.rmf_questionnaires (code, title, version, schema_json)
VALUES (
  'HVA',
  'High Value Asset Questionnaire',
  '1.0',
  '{
    "type": "object",
    "title": "HVA Screener",
    "required": ["is_hva", "mission_dependency", "outage_impact"],
    "properties": {
      "is_hva": {"type": "boolean", "title": "Is the system an HVA?"},
      "hva_category": {"type": "string", "title": "HVA Category", "enum": ["data", "mission", "other"]},
      "mission_dependency": {"type": "string", "title": "Mission/business dependency", "minLength": 1},
      "outage_impact": {"type": "string", "title": "Impact of a 24h outage", "enum": ["low", "moderate", "high", "very_high"]},
      "public_trust_impact": {"type": "string", "title": "Impact to public trust", "enum": ["low", "moderate", "high"]},
      "rationale": {"type": "string", "title": "Rationale", "minLength": 1}
    }
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title, version=EXCLUDED.version, schema_json=EXCLUDED.schema_json;

-- NSS (National Security System) Questionnaire
INSERT INTO public.rmf_questionnaires (code, title, version, schema_json)
VALUES (
  'NSS',
  'National Security System Questionnaire',
  '1.0',
  '{
    "type": "object",
    "title": "NSS Determination",
    "required": ["is_nss"],
    "properties": {
      "is_nss": {"type": "boolean", "title": "Is this a National Security System?"},
      "security_function": {"type": "boolean", "title": "Involves intelligence or cryptologic activity?"},
      "command_control": {"type": "boolean", "title": "Involves command and control of military forces?"},
      "weapons_system": {"type": "boolean", "title": "Part of a weapons system?"},
      "rationale": {"type": "string", "title": "Rationale", "minLength": 1}
    }
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title, version=EXCLUDED.version, schema_json=EXCLUDED.schema_json;

-- Executive Priority Questionnaire
INSERT INTO public.rmf_questionnaires (code, title, version, schema_json)
VALUES (
  'EXEC_PRIORITY',
  'Executive Priority Questionnaire',
  '1.0',
  '{
    "type": "object",
    "title": "Executive Priority",
    "required": ["priority_level", "stakeholders"],
    "properties": {
      "priority_level": {"type": "string", "enum": ["low", "medium", "high", "critical"], "title": "Priority Level"},
      "deadline": {"type": "string", "format": "date", "title": "Key Deadline"},
      "stakeholders": {"type": "array", "title": "Key Stakeholders", "items": {"type": "string"}},
      "funding_source": {"type": "string", "title": "Funding Source"},
      "visibility": {"type": "string", "enum": ["internal", "agency", "external", "congressional"], "title": "Visibility"},
      "notes": {"type": "string", "title": "Notes"}
    }
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title, version=EXCLUDED.version, schema_json=EXCLUDED.schema_json;

-- FISMA IT Asset Questionnaire
INSERT INTO public.rmf_questionnaires (code, title, version, schema_json)
VALUES (
  'FISMA_IT',
  'FISMA IT Asset Questionnaire',
  '1.0',
  '{
    "type": "object",
    "title": "FISMA IT Asset",
    "required": ["owner_org", "system_owner", "environment"],
    "properties": {
      "owner_org": {"type": "string", "title": "Owning Organization"},
      "system_owner": {"type": "string", "title": "System Owner"},
      "isso": {"type": "string", "title": "ISSO"},
      "environment": {"type": "string", "enum": ["on-premises", "cloud", "hybrid"], "title": "Environment"},
      "hosting_provider": {"type": "string", "title": "Hosting Provider (if cloud)"},
      "locations": {"type": "array", "title": "Locations", "items": {"type": "string"}},
      "interconnections": {"type": "array", "title": "External Interconnections", "items": {"type": "string"}},
      "pps": {"type": "array", "title": "Ports/Protocols/Services", "items": {"type": "string"}}
    }
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title, version=EXCLUDED.version, schema_json=EXCLUDED.schema_json;

-- Privacy Risk Screener (PRA)
INSERT INTO public.rmf_questionnaires (code, title, version, schema_json)
VALUES (
  'PRIVACY_PRA',
  'Privacy Risk Screener (PRA)',
  '1.0',
  '{
    "type": "object",
    "title": "Privacy Risk Assessment Screener",
    "required": ["processes_pii", "pii_categories"],
    "properties": {
      "processes_pii": {"type": "boolean", "title": "Does the system process PII?"},
      "pii_categories": {"type": "array", "title": "PII Categories", "items": {"type": "string"}},
      "pra_required": {"type": "boolean", "title": "Is PRA required?"},
      "sorn_refs": {"type": "array", "title": "SORN References", "items": {"type": "string"}},
      "data_minimization": {"type": "string", "title": "Data Minimization Approach"}
    }
  }'::jsonb
) ON CONFLICT (code) DO UPDATE SET title=EXCLUDED.title, version=EXCLUDED.version, schema_json=EXCLUDED.schema_json;

COMMIT;
