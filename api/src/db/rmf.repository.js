const { db } = require('../db');
const { sql, eq, and, desc, asc } = require('drizzle-orm');
const {
  rmfProjects,
  rmfSteps,
  rmfTasks,
  rmfQuestionnaires,
  rmfQuestionnaireResponses,
  rmfInformationTypes,
  rmfSystemInformationTypes,
  rmfCategorizationResults,
  rmfControlSelections,
  rmfStepArtifacts,
  rmfAssessments,
  rmfAuthorizationRecords,
  rmfMonitoringPlans,
  rmfStepApprovals
} = require('./schema/rmf.schema');

// Helper to build dynamic ORDER BY safely
const orderBy = (sortBy = 'created_at', sortOrder = 'desc') => sql`${sql.raw(sortBy)} ${sql.raw(sortOrder === 'asc' ? 'asc' : 'desc')}`;

module.exports = {
  // Projects
  insertProject: async (tx, data) => {
    // Use raw SQL to match actual database schema exactly
    const [row] = await tx.execute(sql`
      INSERT INTO public.rmf_projects (
        system_id, title, description, environment, sponsor_org,
        ao_user_id, isso_user_id, issm_user_id, start_date,
        target_authorization_date, current_step, status, created_by
      )
      VALUES (
        ${data.system_id || null},
        ${data.title},
        ${data.description || null},
        ${data.environment || null},
        ${data.sponsor_org || null},
        ${data.ao_user_id || null},
        ${data.isso_user_id || null},
        ${data.issm_user_id || null},
        ${data.start_date || null},
        ${data.target_authorization_date || null},
        ${data.current_step || 'categorize'},
        ${data.status || 'active'},
        ${data.created_by || null}
      )
      RETURNING *;
    `);
    return row;
  },
  listProjects: async ({ limit, offset, sortBy, sortOrder }) => {
    // Use raw SQL to avoid schema issues
    const rows = await db.execute(sql`
      SELECT * FROM public.rmf_projects
      ORDER BY ${sql.raw(sortBy || 'created_at')} ${sql.raw(sortOrder === 'asc' ? 'ASC' : 'DESC')}
      LIMIT ${limit} OFFSET ${offset};
    `);
    return rows;
  },
  countProjects: async () => {
    const rows = await db.execute(sql`SELECT COUNT(*)::int as count FROM public.rmf_projects;`);
    return rows[0]?.count || 0;
  },
  getProjectById: async (id) => {
    const rows = await db.execute(sql`
      SELECT * FROM public.rmf_projects WHERE id = ${id} LIMIT 1;
    `);
    return rows[0] || null;
  },
  updateProject: async (id, payload) => {
    const fields = [];
    if (payload.title !== undefined) fields.push(sql`title = ${payload.title}`);
    if (payload.description !== undefined) fields.push(sql`description = ${payload.description}`);
    if (payload.status !== undefined) fields.push(sql`status = ${payload.status}`);
    if (payload.current_step !== undefined) fields.push(sql`current_step = ${payload.current_step}`);
    if (payload.environment !== undefined) fields.push(sql`environment = ${payload.environment}`);
    if (fields.length === 0) {
      const rows = await db.execute(sql`SELECT * FROM public.rmf_projects WHERE id = ${id} LIMIT 1;`);
      return rows[0] || null;
    }
    const rows = await db.execute(sql`
      UPDATE public.rmf_projects SET ${sql.join(fields, sql`, `)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *;
    `);
    return rows[0] || null;
  },

  // Steps
  insertStep: async (tx, data) => {
    // Use original database schema
    const [row] = await tx.execute(sql`
      INSERT INTO public.rmf_steps (rmf_project_id, step, status)
      VALUES (${data.rmf_project_id}, ${data.step}, ${data.status || 'not_started'})
      ON CONFLICT (rmf_project_id, step) DO UPDATE SET status = EXCLUDED.status
      RETURNING *;
    `);
    return row;
  },
  getStepsByProject: async (projectId) => {
    const rows = await db.select().from(rmfSteps)
      .where(eq(rmfSteps.rmfProjectId, projectId))
      .orderBy(rmfSteps.id);
    return rows;
  },
  getStepByProjectAndKey: async (projectId, step) => {
    const rows = await db.select().from(rmfSteps)
      .where(and(eq(rmfSteps.rmfProjectId, projectId), eq(rmfSteps.step, step)))
      .limit(1);
    return rows[0] || null;
  },
  updateStep: async (projectId, step, payload) => {
    const fields = [];
    if (payload.status !== undefined) fields.push(sql`status = ${payload.status}`);
    if (payload.started_at !== undefined) fields.push(sql`started_at = ${payload.started_at}`);
    if (payload.completed_at !== undefined) fields.push(sql`completed_at = ${payload.completed_at}`);
    if (payload.blocked_reason !== undefined) fields.push(sql`blocked_reason = ${payload.blocked_reason}`);
    if (payload.required_artifacts_json !== undefined) fields.push(sql`required_artifacts_json = ${payload.required_artifacts_json}`);
    if (payload.metadata_json !== undefined) fields.push(sql`metadata_json = ${payload.metadata_json}`);
    const rows = await db.execute(sql`
      UPDATE public.rmf_steps SET ${sql.join(fields, sql`, `)}, updated_at = now()
      WHERE rmf_project_id = ${projectId} AND step = ${step}
      RETURNING *;
    `);
    return rows[0] || null;
  },
  insertStepApproval: async (data) => {
    // Keep raw SQL to preserve upsert by (rmf_step_id, role)
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_step_approvals (rmf_step_id, role, decision, comments, decided_by, decided_at)
      VALUES (${data.rmf_step_id}, ${data.role}, ${data.decision}, ${data.comments || null}, ${data.decided_by || null}, now())
      ON CONFLICT (rmf_step_id, role) DO UPDATE SET decision = EXCLUDED.decision, comments = EXCLUDED.comments, decided_by = EXCLUDED.decided_by, decided_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },

  // Tasks
  listTasksByStep: async (stepId) => {
    const rows = await db.select().from(rmfTasks)
      .where(eq(rmfTasks.rmfStepId, stepId))
      .orderBy(rmfTasks.orderIndex, rmfTasks.id);
    return rows;
  },
  insertTask: async (data) => {
    const [row] = await db.insert(rmfTasks).values({
      rmfStepId: data.rmf_step_id,
      key: data.key,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'not_started',
      assignedTo: data.assigned_to ?? null,
      dueDate: data.due_date ?? null,
      orderIndex: data.order_index ?? null
    }).returning();
    return row || null;
  },
  updateTask: async (id, payload) => {
    const [row] = await db.update(rmfTasks).set({
      key: payload.key !== undefined ? payload.key : undefined,
      title: payload.title !== undefined ? payload.title : undefined,
      description: payload.description !== undefined ? payload.description : undefined,
      status: payload.status !== undefined ? payload.status : undefined,
      assignedTo: payload.assigned_to !== undefined ? payload.assigned_to : undefined,
      dueDate: payload.due_date !== undefined ? payload.due_date : undefined,
      orderIndex: payload.order_index !== undefined ? payload.order_index : undefined,
      updatedAt: sql`now()`
    }).where(eq(rmfTasks.id, id)).returning();
    return row || null;
  },

  // Questionnaires
  listQuestionnaires: async () => {
    const rows = await db.select().from(rmfQuestionnaires)
      .where(eq(rmfQuestionnaires.isActive, true))
      .orderBy(rmfQuestionnaires.code);
    return rows;
  },
  insertQuestionnaire: async (data) => {
    // Keep raw SQL for ON CONFLICT upsert per current Drizzle version
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_questionnaires (code, title, version, schema_json, is_active, created_by)
      VALUES (${data.code}, ${data.title}, ${data.version || '1.0'}, ${data.schema_json}, ${data.is_active ?? true}, ${data.created_by || null})
      ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title, version = EXCLUDED.version, schema_json = EXCLUDED.schema_json, is_active = EXCLUDED.is_active, updated_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },
  updateQuestionnaire: async (id, data) => {
    const update = {};
    if (data.code !== undefined) update.code = data.code;
    if (data.title !== undefined) update.title = data.title;
    if (data.version !== undefined) update.version = data.version;
    if (data.schema_json !== undefined) update.schemaJson = data.schema_json;
    if (data.is_active !== undefined) update.isActive = data.is_active;
    if (Object.keys(update).length === 0) {
      const rows = await db.select().from(rmfQuestionnaires).where(eq(rmfQuestionnaires.id, id)).limit(1);
      return rows[0] || null;
    }
    const [row] = await db.update(rmfQuestionnaires).set({ ...update, updatedAt: sql`now()` })
      .where(eq(rmfQuestionnaires.id, id)).returning();
    return row || null;
  },

  // Questionnaire responses
  insertQuestionnaireResponse: async (data) => {
    // Keep raw SQL for ON CONFLICT upsert
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_questionnaire_responses (rmf_task_id, questionnaire_id, responder_user_id, responses_json, status, approved_by, approved_at)
      VALUES (${data.rmf_task_id}, ${data.questionnaire_id}, ${data.responder_user_id || null}, ${data.responses_json}, ${data.status || 'draft'}, ${data.approved_by || null}, ${data.approved_at || null})
      ON CONFLICT (rmf_task_id, questionnaire_id) DO UPDATE SET responses_json = EXCLUDED.responses_json, status = EXCLUDED.status, approved_by = EXCLUDED.approved_by, approved_at = EXCLUDED.approved_at, updated_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },
  updateQuestionnaireResponse: async (id, data) => {
    const update = {};
    if (data.responses_json !== undefined) update.responsesJson = data.responses_json;
    if (data.status !== undefined) update.status = data.status;
    if (data.approved_by !== undefined) update.approvedBy = data.approved_by;
    if (data.approved_at !== undefined) update.approvedAt = data.approved_at;
    if (Object.keys(update).length === 0) {
      const rows = await db.select().from(rmfQuestionnaireResponses).where(eq(rmfQuestionnaireResponses.id, id)).limit(1);
      return rows[0] || null;
    }
    const [row] = await db.update(rmfQuestionnaireResponses).set({ ...update, updatedAt: sql`now()` })
      .where(eq(rmfQuestionnaireResponses.id, id)).returning();
    return row || null;
  },

  // Categorization
  listSystemInfoTypes: async (projectId) => {
    const rows = await db.execute(sql`
      SELECT sit.*, it.code, it.title
      FROM public.rmf_system_information_types sit
      JOIN public.rmf_information_types it ON it.id = sit.information_type_id
      WHERE sit.rmf_project_id = ${projectId}
      ORDER BY it.code;
    `);
    return rows;
  },
  insertSystemInfoType: async (data) => {
    // Keep raw SQL for ON CONFLICT upsert
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_system_information_types (rmf_project_id, information_type_id, confidentiality, integrity, availability, rationale_text, privacy_risk_level, inherits_from_project_id)
      VALUES (${data.rmf_project_id}, ${data.information_type_id}, ${data.confidentiality}, ${data.integrity}, ${data.availability}, ${data.rationale_text || null}, ${data.privacy_risk_level || null}, ${data.inherits_from_project_id || null})
      ON CONFLICT (rmf_project_id, information_type_id) DO UPDATE SET confidentiality = EXCLUDED.confidentiality, integrity = EXCLUDED.integrity, availability = EXCLUDED.availability, rationale_text = EXCLUDED.rationale_text, privacy_risk_level = EXCLUDED.privacy_risk_level, updated_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },
  deleteSystemInfoType: async (id) => {
    await db.execute(sql`DELETE FROM public.rmf_system_information_types WHERE id = ${id};`);
    return true;
  },
  upsertCategorization: async (projectId, data) => {
    // Keep raw SQL for ON CONFLICT upsert
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_categorization_results (rmf_project_id, overall_confidentiality, overall_integrity, overall_availability, overall_category, determination_method, determined_by, determined_at, notes)
      VALUES (${projectId}, ${data.overall_confidentiality}, ${data.overall_integrity}, ${data.overall_availability}, ${data.overall_category}, ${data.determination_method || null}, ${data.determined_by || null}, ${data.determined_at || null}, ${data.notes || null})
      ON CONFLICT (rmf_project_id) DO UPDATE SET overall_confidentiality = EXCLUDED.overall_confidentiality, overall_integrity = EXCLUDED.overall_integrity, overall_availability = EXCLUDED.overall_availability, overall_category = EXCLUDED.overall_category, determination_method = EXCLUDED.determination_method, determined_by = EXCLUDED.determined_by, determined_at = EXCLUDED.determined_at, notes = EXCLUDED.notes, updated_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },
  getCategorization: async (projectId) => {
    const rows = await db.select().from(rmfCategorizationResults)
      .where(eq(rmfCategorizationResults.rmfProjectId, projectId))
      .limit(1);
    return rows[0] || null;
  },

  // Control selection
  upsertControlSelection: async (projectId, data) => {
    // Keep raw SQL for ON CONFLICT upsert
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_control_selections (rmf_project_id, baseline, overlays_json, tailoring_rationale, inherited_from_provider)
      VALUES (${projectId}, ${data.baseline}, ${data.overlays_json || null}, ${data.tailoring_rationale || null}, ${data.inherited_from_provider || null})
      ON CONFLICT (rmf_project_id) DO UPDATE SET baseline = EXCLUDED.baseline, overlays_json = EXCLUDED.overlays_json, tailoring_rationale = EXCLUDED.tailoring_rationale, inherited_from_provider = EXCLUDED.inherited_from_provider, updated_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },
  getControlSelection: async (projectId) => {
    const rows = await db.select().from(rmfControlSelections)
      .where(eq(rmfControlSelections.rmfProjectId, projectId))
      .limit(1);
    return rows[0] || null;
  },

  // Assessments
  insertAssessment: async (projectId, data) => {
    const [row] = await db.insert(rmfAssessments).values({
      rmfProjectId: projectId,
      assessmentType: data.assessment_type,
      scopeJson: data.scope_json ?? null,
      startedAt: data.started_at ?? null,
      completedAt: data.completed_at ?? null,
      assessorUserId: data.assessor_user_id ?? null,
      sarArtifactId: data.sar_artifact_id ?? null,
      summary: data.summary ?? null,
      status: data.status ?? 'planned'
    }).returning();
    return row || null;
  },
  updateAssessment: async (assessmentId, data) => {
    const [row] = await db.update(rmfAssessments).set({
      assessmentType: data.assessment_type !== undefined ? data.assessment_type : undefined,
      scopeJson: data.scope_json !== undefined ? data.scope_json : undefined,
      startedAt: data.started_at !== undefined ? data.started_at : undefined,
      completedAt: data.completed_at !== undefined ? data.completed_at : undefined,
      assessorUserId: data.assessor_user_id !== undefined ? data.assessor_user_id : undefined,
      sarArtifactId: data.sar_artifact_id !== undefined ? data.sar_artifact_id : undefined,
      summary: data.summary !== undefined ? data.summary : undefined,
      status: data.status !== undefined ? data.status : undefined,
      updatedAt: sql`now()`
    }).where(eq(rmfAssessments.id, assessmentId)).returning();
    return row || null;
  },
  listAssessmentsByProject: async (projectId) => {
    const rows = await db.select().from(rmfAssessments)
      .where(eq(rmfAssessments.rmfProjectId, projectId))
      .orderBy(rmfAssessments.startedAt, rmfAssessments.id);
    return rows;
  },

  // Authorization
  upsertAuthorizationRecord: async (projectId, data) => {
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_authorization_records (rmf_project_id, ato_id, decision, decision_status, decision_date, expires_at, conditions_json, risk_summary)
      VALUES (${projectId}, ${data.ato_id || null}, ${data.decision || null}, ${data.decision_status || null}, ${data.decision_date || null}, ${data.expires_at || null}, ${data.conditions_json || null}, ${data.risk_summary || null})
      ON CONFLICT (rmf_project_id) DO UPDATE SET ato_id = EXCLUDED.ato_id, decision = EXCLUDED.decision, decision_status = EXCLUDED.decision_status, decision_date = EXCLUDED.decision_date, expires_at = EXCLUDED.expires_at, conditions_json = EXCLUDED.conditions_json, risk_summary = EXCLUDED.risk_summary, updated_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },
  getAuthorizationRecord: async (projectId) => {
    const rows = await db.select().from(rmfAuthorizationRecords)
      .where(eq(rmfAuthorizationRecords.rmfProjectId, projectId)).limit(1);
    return rows[0] || null;
  },

  // Monitoring plan
  upsertMonitoringPlan: async (projectId, data) => {
    const rows = await db.execute(sql`
      INSERT INTO public.rmf_monitoring_plans (rmf_project_id, control_sampling_plan_json, scan_frequency, metrics_json, escalation_rules_json, last_reviewed_at, owner_user_id)
      VALUES (${projectId}, ${data.control_sampling_plan_json || null}, ${data.scan_frequency || null}, ${data.metrics_json || null}, ${data.escalation_rules_json || null}, ${data.last_reviewed_at || null}, ${data.owner_user_id || null})
      ON CONFLICT (rmf_project_id) DO UPDATE SET control_sampling_plan_json = EXCLUDED.control_sampling_plan_json, scan_frequency = EXCLUDED.scan_frequency, metrics_json = EXCLUDED.metrics_json, escalation_rules_json = EXCLUDED.escalation_rules_json, last_reviewed_at = EXCLUDED.last_reviewed_at, owner_user_id = EXCLUDED.owner_user_id, updated_at = now()
      RETURNING *;
    `);
    return rows[0] || null;
  },
  getMonitoringPlan: async (projectId) => {
    const rows = await db.select().from(rmfMonitoringPlans)
      .where(eq(rmfMonitoringPlans.rmfProjectId, projectId)).limit(1);
    return rows[0] || null;
  }
};
