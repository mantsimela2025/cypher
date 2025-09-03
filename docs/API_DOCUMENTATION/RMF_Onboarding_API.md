# RMF Onboarding API (Proposed)

This document maps the new RMF tables to REST endpoints. It is a design guide to inform backend implementation.

## Entities
- rmf_projects
- rmf_steps
- rmf_tasks
- rmf_questionnaires
- rmf_questionnaire_responses
- rmf_information_types
- rmf_system_information_types
- rmf_categorization_results
- rmf_control_selections
- rmf_step_artifacts
- rmf_assessments
- rmf_authorization_records
- rmf_monitoring_plans
- rmf_step_approvals

## Base URL
- /api/rmf

## 1. Projects
- POST /projects
  - body: { system_id?, title, description?, environment?, sponsor_org?, ao_user_id?, isso_user_id?, issm_user_id?, start_date?, target_authorization_date? }
  - returns: rmf_project
- GET /projects/:id
- GET /projects?status=&current_step=&q=
- PATCH /projects/:id
  - body: partial fields + { current_step?, status? }

## 2. Steps
- GET /projects/:id/steps
- PATCH /projects/:id/steps/:step
  - body: { status, started_at?, completed_at?, blocked_reason?, required_artifacts_json?, metadata_json? }
- POST /projects/:id/steps/:step/approve
  - body: { role: ISSO|ISSM|AO, decision: approved|rejected|needs_changes, comments? }

## 3. Tasks (subtasks per step)
- GET /steps/:stepId/tasks
- POST /steps/:stepId/tasks
  - body: { key, title, description?, assigned_to?, due_date?, order_index? }
- PATCH /tasks/:id
  - body: { status?, assigned_to?, due_date?, completed_at?, validation_errors_json? }

## 4. Questionnaires
- GET /questionnaires
- POST /questionnaires
  - admin-only; body: { code, title, version?, schema_json }
- PUT /questionnaires/:id
- POST /tasks/:taskId/questionnaires/:questionnaireId/responses
  - body: { responses_json, status?: draft|submitted }
- PATCH /questionnaire-responses/:id
  - body: { responses_json?, status?, approved_by?, approved_at? }

## 5. Categorization
- GET /projects/:id/information-types
- POST /projects/:id/information-types
  - body: { information_type_id, confidentiality, integrity, availability, rationale_text?, privacy_risk_level? }
- DELETE /system-information-types/:id
- PUT /projects/:id/categorization
  - body: { overall_confidentiality, overall_integrity, overall_availability, overall_category, determination_method?, determined_by?, determined_at?, notes? }
- GET /projects/:id/categorization

## 6. Control Selection
- PUT /projects/:id/control-selection
  - body: { baseline: low|moderate|high, overlays_json?, tailoring_rationale?, inherited_from_provider? }
- GET /projects/:id/control-selection

## 7. Artifacts linkage
- POST /steps/:stepId/artifacts
  - body: { artifact_id, rmf_task_id?, role?, notes? }
- GET /steps/:stepId/artifacts

## 8. Assessments
- POST /projects/:id/assessments
  - body: { assessment_type, scope_json?, started_at?, assessor_user_id? }
- PATCH /assessments/:id
  - body: { scope_json?, completed_at?, sar_artifact_id?, summary?, status? }
- GET /projects/:id/assessments

## 9. Authorization
- PUT /projects/:id/authorization
  - body: { ato_id?, decision?, decision_status?, decision_date?, expires_at?, conditions_json?, risk_summary? }
- GET /projects/:id/authorization

## 10. Monitoring Plan
- PUT /projects/:id/monitoring-plan
  - body: { control_sampling_plan_json?, scan_frequency?, metrics_json?, escalation_rules_json?, last_reviewed_at?, owner_user_id? }
- GET /projects/:id/monitoring-plan

## 11. Status and Guardrails
- GET /projects/:id/status
  - returns: { current_step, steps: [...], open_tasks, required_artifacts_missing, approvals }
- POST /projects/:id/steps/:step/complete
  - server validates: required questionnaires submitted+approved, required artifacts exist, approvals present

## Notes on Model Mapping
- Most tables use rmf_project_id or rmf_step_id as the primary linkage.
- For control implementation and assessment (RMF-3/4), continue using existing tables (controls, control_compliance_status, control_evidence, control_findings, control_poams) with the new nullable rmf_project_id to scope records.
- Authorization leverages existing authorizations_to_operate and ato_documents; rmf_authorization_records provides the project linkage and decision metadata.
- Artifacts are stored in public.artifacts; rmf_step_artifacts associates them with steps/tasks and roles.

## Security & Roles
- Typical roles: admin, manager, analyst, user plus AO/ISSO/ISSM named users per project.
- Step approval endpoint enforces role-specific approvals before progression to the next step.

## Validation Hints
- Categorize step cannot be completed unless at least one information type is linked and overall categorization is set.
- Authorize cannot be set to approved unless there is a completed assessment and open POA&M items do not violate policy thresholds.
- Monitor requires a monitoring plan.

## Pagination & Filtering
- Standard query params: page, pageSize, sort, filter. Endpoints returning lists should support them consistently.

## Webhooks (optional)
- Consider emitting events: rmf.project.created, rmf.step.completed, rmf.authorization.updated, etc.
