-- RMF Onboarding Schema Additions
-- This script creates 14 RMF-centric tables and adds minimal FKs to existing tables
-- Assumptions: public schema; existing users table is public.users with id PK; existing artifacts, controls, etc. exist as defined in Cypher.sql

BEGIN;

-- 1) rmf_projects
CREATE TABLE IF NOT EXISTS public.rmf_projects (
  id SERIAL PRIMARY KEY,
  system_id INTEGER NULL, -- FK to a system table if available (assets or systems)
  title TEXT NOT NULL,
  description TEXT NULL,
  environment public.environment_type NULL,
  sponsor_org TEXT NULL,
  ao_user_id INTEGER NULL,
  isso_user_id INTEGER NULL,
  issm_user_id INTEGER NULL,
  start_date DATE NULL,
  target_authorization_date DATE NULL,
  current_step TEXT NOT NULL DEFAULT 'categorize', -- categorize/select/implement/assess/authorize/monitor
  status TEXT NOT NULL DEFAULT 'active', -- draft/active/on_hold/completed/retired
  created_by INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.rmf_projects IS 'Top-level RMF project per onboarded system.';
CREATE INDEX IF NOT EXISTS idx_rmf_projects_current_step ON public.rmf_projects (current_step);
CREATE INDEX IF NOT EXISTS idx_rmf_projects_status ON public.rmf_projects (status);

-- 2) rmf_steps
CREATE TABLE IF NOT EXISTS public.rmf_steps (
  id SERIAL PRIMARY KEY,
  rmf_project_id INTEGER NOT NULL REFERENCES public.rmf_projects(id) ON DELETE CASCADE,
  step TEXT NOT NULL, -- categorize/select/implement/assess/authorize/monitor
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started/in_progress/completed/blocked
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  blocked_reason TEXT NULL,
  required_artifacts_json JSONB NULL,
  metadata_json JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rmf_project_id, step)
);
CREATE INDEX IF NOT EXISTS idx_rmf_steps_project ON public.rmf_steps (rmf_project_id);
CREATE INDEX IF NOT EXISTS idx_rmf_steps_status ON public.rmf_steps (status);

-- 3) rmf_tasks
CREATE TABLE IF NOT EXISTS public.rmf_tasks (
  id SERIAL PRIMARY KEY,
  rmf_step_id INTEGER NOT NULL REFERENCES public.rmf_steps(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NULL,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started/in_progress/completed/needs_review
  assigned_to INTEGER NULL,
  due_date DATE NULL,
  completed_at TIMESTAMPTZ NULL,
  validation_errors_json JSONB NULL,
  order_index INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rmf_step_id, key)
);
CREATE INDEX IF NOT EXISTS idx_rmf_tasks_step ON public.rmf_tasks (rmf_step_id);
CREATE INDEX IF NOT EXISTS idx_rmf_tasks_status ON public.rmf_tasks (status);

-- 4) rmf_questionnaires
CREATE TABLE IF NOT EXISTS public.rmf_questionnaires (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- e.g., HVA, NSS, EXEC_PRIORITY, FISMA_IT
  title TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  schema_json JSONB NOT NULL, -- JSON Schema for questions/validation
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) rmf_questionnaire_responses
CREATE TABLE IF NOT EXISTS public.rmf_questionnaire_responses (
  id SERIAL PRIMARY KEY,
  rmf_task_id INTEGER NOT NULL REFERENCES public.rmf_tasks(id) ON DELETE CASCADE,
  questionnaire_id INTEGER NOT NULL REFERENCES public.rmf_questionnaires(id) ON DELETE RESTRICT,
  responder_user_id INTEGER NULL,
  responses_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft/submitted/approved/rejected
  approved_by INTEGER NULL,
  approved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rmf_task_id, questionnaire_id)
);
CREATE INDEX IF NOT EXISTS idx_rmf_qr_task ON public.rmf_questionnaire_responses (rmf_task_id);
CREATE INDEX IF NOT EXISTS idx_rmf_qr_status ON public.rmf_questionnaire_responses (status);

-- 6) rmf_information_types
CREATE TABLE IF NOT EXISTS public.rmf_information_types (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- e.g., PII, PHI, CUI, PCI
  title TEXT NOT NULL,
  description TEXT NULL,
  source TEXT NULL, -- NIST/CNSSI/Custom
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7) rmf_system_information_types
CREATE TABLE IF NOT EXISTS public.rmf_system_information_types (
  id SERIAL PRIMARY KEY,
  rmf_project_id INTEGER NOT NULL REFERENCES public.rmf_projects(id) ON DELETE CASCADE,
  information_type_id INTEGER NOT NULL REFERENCES public.rmf_information_types(id) ON DELETE RESTRICT,
  confidentiality public.risk_level NOT NULL,
  integrity public.risk_level NOT NULL,
  availability public.risk_level NOT NULL,
  rationale_text TEXT NULL,
  privacy_risk_level TEXT NULL,
  inherits_from_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rmf_project_id, information_type_id)
);
CREATE INDEX IF NOT EXISTS idx_rmf_sys_info_types_project ON public.rmf_system_information_types (rmf_project_id);

-- 8) rmf_categorization_results
CREATE TABLE IF NOT EXISTS public.rmf_categorization_results (
  id SERIAL PRIMARY KEY,
  rmf_project_id INTEGER NOT NULL UNIQUE REFERENCES public.rmf_projects(id) ON DELETE CASCADE,
  overall_confidentiality public.risk_level NOT NULL,
  overall_integrity public.risk_level NOT NULL,
  overall_availability public.risk_level NOT NULL,
  overall_category public.enum_system_security_plans_security_category NOT NULL,
  determination_method TEXT NULL,
  determined_by INTEGER NULL,
  determined_at TIMESTAMPTZ NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9) rmf_control_selections
CREATE TABLE IF NOT EXISTS public.rmf_control_selections (
  id SERIAL PRIMARY KEY,
  rmf_project_id INTEGER NOT NULL REFERENCES public.rmf_projects(id) ON DELETE CASCADE,
  baseline public.enum_system_security_plans_security_category NOT NULL,
  overlays_json JSONB NULL, -- e.g., ["FedRAMP Moderate", "Privacy"]
  tailoring_rationale TEXT NULL,
  inherited_from_provider TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rmf_project_id)
);

-- 10) rmf_step_artifacts
CREATE TABLE IF NOT EXISTS public.rmf_step_artifacts (
  id SERIAL PRIMARY KEY,
  rmf_step_id INTEGER NOT NULL REFERENCES public.rmf_steps(id) ON DELETE CASCADE,
  rmf_task_id INTEGER NULL REFERENCES public.rmf_tasks(id) ON DELETE SET NULL,
  artifact_id INTEGER NOT NULL REFERENCES public.artifacts(id) ON DELETE CASCADE,
  role TEXT NULL, -- boundary_diagram, data_flow, evidence, report, policy, other
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rmf_step_artifacts_step ON public.rmf_step_artifacts (rmf_step_id);

-- 11) rmf_assessments
CREATE TABLE IF NOT EXISTS public.rmf_assessments (
  id SERIAL PRIMARY KEY,
  rmf_project_id INTEGER NOT NULL REFERENCES public.rmf_projects(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL, -- sca, vuln_scan, pentest, config_stig
  scope_json JSONB NULL,
  started_at TIMESTAMPTZ NULL,
  completed_at TIMESTAMPTZ NULL,
  assessor_user_id INTEGER NULL,
  sar_artifact_id INTEGER NULL REFERENCES public.artifacts(id) ON DELETE SET NULL,
  summary TEXT NULL,
  status TEXT NOT NULL DEFAULT 'planned', -- planned/in_progress/completed/cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rmf_assessments_project ON public.rmf_assessments (rmf_project_id);
CREATE INDEX IF NOT EXISTS idx_rmf_assessments_status ON public.rmf_assessments (status);

-- 12) rmf_authorization_records
CREATE TABLE IF NOT EXISTS public.rmf_authorization_records (
  id SERIAL PRIMARY KEY,
  rmf_project_id INTEGER NOT NULL REFERENCES public.rmf_projects(id) ON DELETE CASCADE,
  ato_id INTEGER NULL REFERENCES public.authorizations_to_operate(id) ON DELETE SET NULL,
  decision public.enum_authorizations_to_operate_type NULL,
  decision_status public.enum_authorizations_to_operate_status NULL,
  decision_date DATE NULL,
  expires_at DATE NULL,
  conditions_json JSONB NULL,
  risk_summary TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rmf_project_id)
);

-- 13) rmf_monitoring_plans
CREATE TABLE IF NOT EXISTS public.rmf_monitoring_plans (
  id SERIAL PRIMARY KEY,
  rmf_project_id INTEGER NOT NULL UNIQUE REFERENCES public.rmf_projects(id) ON DELETE CASCADE,
  control_sampling_plan_json JSONB NULL,
  scan_frequency TEXT NULL, -- e.g., monthly/quarterly/custom cron
  metrics_json JSONB NULL,
  escalation_rules_json JSONB NULL,
  last_reviewed_at TIMESTAMPTZ NULL,
  owner_user_id INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14) rmf_step_approvals
CREATE TABLE IF NOT EXISTS public.rmf_step_approvals (
  id SERIAL PRIMARY KEY,
  rmf_step_id INTEGER NOT NULL REFERENCES public.rmf_steps(id) ON DELETE CASCADE,
  role public.enum_ato_workflow_history_approval_role NOT NULL, -- ISSO/ISSM/AO
  decision TEXT NOT NULL, -- approved/rejected/needs_changes
  decided_by INTEGER NULL,
  decided_at TIMESTAMPTZ NULL,
  comments TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rmf_step_id, role)
);
CREATE INDEX IF NOT EXISTS idx_rmf_step_approvals_step ON public.rmf_step_approvals (rmf_step_id);

-- Minimal FKs to existing tables (nullable to avoid backfills)
-- Add rmf_project_id to control-related tables where feasible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='controls' AND column_name='rmf_project_id'
  ) THEN
    ALTER TABLE public.controls ADD COLUMN rmf_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_controls_rmf_project ON public.controls (rmf_project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='control_compliance_status' AND column_name='rmf_project_id'
  ) THEN
    ALTER TABLE public.control_compliance_status ADD COLUMN rmf_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_control_compliance_status_rmf ON public.control_compliance_status (rmf_project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='control_evidence' AND column_name='rmf_project_id'
  ) THEN
    ALTER TABLE public.control_evidence ADD COLUMN rmf_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_control_evidence_rmf ON public.control_evidence (rmf_project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='control_findings' AND column_name='rmf_project_id'
  ) THEN
    ALTER TABLE public.control_findings ADD COLUMN rmf_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_control_findings_rmf ON public.control_findings (rmf_project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='control_poams' AND column_name='rmf_project_id'
  ) THEN
    ALTER TABLE public.control_poams ADD COLUMN rmf_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_control_poams_rmf ON public.control_poams (rmf_project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='system_security_plans' AND column_name='rmf_project_id'
  ) THEN
    ALTER TABLE public.system_security_plans ADD COLUMN rmf_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_system_security_plans_rmf ON public.system_security_plans (rmf_project_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='artifacts' AND column_name='rmf_project_id'
  ) THEN
    ALTER TABLE public.artifacts ADD COLUMN rmf_project_id INTEGER NULL REFERENCES public.rmf_projects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_artifacts_rmf ON public.artifacts (rmf_project_id);
  END IF;
END$$;

COMMIT;
