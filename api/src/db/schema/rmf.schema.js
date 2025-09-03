const { pgTable, serial, varchar, timestamp, integer, text, jsonb, pgEnum, uuid, boolean } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { systems } = require('./systems');

// Define enums for RMF
const rmfStepEnum = pgEnum('rmf_step_enum', ['CATEGORIZE', 'SELECT', 'IMPLEMENT', 'ASSESS', 'AUTHORIZE', 'MONITOR']);
const projectStatusEnum = pgEnum('project_status_enum', ['active', 'pending', 'completed', 'overdue', 'cancelled']);
const impactLevelEnum = pgEnum('impact_level_enum', ['low', 'moderate', 'high']);
const taskStatusEnum = pgEnum('task_status_enum', ['pending', 'in_progress', 'completed', 'blocked']);
const responseTypeEnum = pgEnum('response_type_enum', ['text', 'select', 'multiselect', 'file', 'date']);

// RMF Projects
const rmfProjects = pgTable('rmf_projects', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  systemId: integer('system_id'),
  currentStep: rmfStepEnum('current_step').default('CATEGORIZE'),
  status: projectStatusEnum('status').default('active'),
  dueDate: timestamp('due_date'),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Steps
const rmfSteps = pgTable('rmf_steps', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  stepName: rmfStepEnum('step_name').notNull(),
  status: varchar('status', { length: 50 }).default('pending'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  assignedTo: integer('assigned_to').references(() => users.id),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Tasks
const rmfTasks = pgTable('rmf_tasks', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  stepId: integer('step_id').references(() => rmfSteps.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('pending'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  assignedTo: integer('assigned_to').references(() => users.id),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Questionnaires
const rmfQuestionnaires = pgTable('rmf_questionnaires', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  stepId: integer('step_id').references(() => rmfSteps.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  questions: jsonb('questions'),
  isRequired: boolean('is_required').default(true),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Responses
const rmfResponses = pgTable('rmf_responses', {
  id: serial('id').primaryKey(),
  questionnaireId: integer('questionnaire_id').references(() => rmfQuestionnaires.id, { onDelete: 'cascade' }),
  questionId: varchar('question_id', { length: 100 }),
  responseType: responseTypeEnum('response_type').notNull(),
  responseValue: text('response_value'),
  responseData: jsonb('response_data'),
  respondedBy: integer('responded_by').references(() => users.id),
  respondedAt: timestamp('responded_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF System Categorization
const rmfCategorization = pgTable('rmf_categorization', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  systemName: varchar('system_name', { length: 255 }).notNull(),
  systemDescription: text('system_description'),
  systemType: varchar('system_type', { length: 100 }),
  confidentialityImpact: impactLevelEnum('confidentiality_impact'),
  integrityImpact: impactLevelEnum('integrity_impact'),
  availabilityImpact: impactLevelEnum('availability_impact'),
  overallImpact: impactLevelEnum('overall_impact'),
  systemBoundary: text('system_boundary'),
  systemOwner: varchar('system_owner', { length: 255 }),
  dataTypes: jsonb('data_types'),
  interconnections: text('interconnections'),
  approvalStatus: varchar('approval_status', { length: 50 }).default('draft'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Control Selection
const rmfControlSelection = pgTable('rmf_control_selection', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  controlId: varchar('control_id', { length: 50 }),
  controlTitle: varchar('control_title', { length: 255 }),
  controlFamily: varchar('control_family', { length: 100 }),
  baseline: varchar('baseline', { length: 50 }),
  isSelected: boolean('is_selected').default(false),
  tailoringDecision: varchar('tailoring_decision', { length: 100 }),
  tailoringRationale: text('tailoring_rationale'),
  implementationNotes: text('implementation_notes'),
  selectedBy: integer('selected_by').references(() => users.id),
  selectedAt: timestamp('selected_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Assessments
const rmfAssessments = pgTable('rmf_assessments', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  controlId: varchar('control_id', { length: 50 }),
  assessmentPlan: text('assessment_plan'),
  testingProcedures: jsonb('testing_procedures'),
  assessmentResults: text('assessment_results'),
  effectiveness: varchar('effectiveness', { length: 50 }),
  deficiencies: jsonb('deficiencies'),
  recommendations: text('recommendations'),
  assessedBy: integer('assessed_by').references(() => users.id),
  assessedAt: timestamp('assessed_at'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Authorization
const rmfAuthorization = pgTable('rmf_authorization', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  riskAssessment: jsonb('risk_assessment'),
  riskLevel: varchar('risk_level', { length: 50 }),
  residualRisk: text('residual_risk'),
  riskMitigation: jsonb('risk_mitigation'),
  authorizationDecision: varchar('authorization_decision', { length: 100 }),
  authorizationTerms: text('authorization_terms'),
  atoExpirationDate: timestamp('ato_expiration_date'),
  poamRequired: boolean('poam_required').default(false),
  poamItems: jsonb('poam_items'),
  authorizedBy: integer('authorized_by').references(() => users.id),
  authorizedAt: timestamp('authorized_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// RMF Monitoring
const rmfMonitoring = pgTable('rmf_monitoring', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => rmfProjects.id, { onDelete: 'cascade' }),
  monitoringStrategy: text('monitoring_strategy'),
  monitoringFrequency: varchar('monitoring_frequency', { length: 100 }),
  controlAssessments: jsonb('control_assessments'),
  statusReports: jsonb('status_reports'),
  securityImpacts: jsonb('security_impacts'),
  changeRequests: jsonb('change_requests'),
  lastMonitoringDate: timestamp('last_monitoring_date'),
  nextMonitoringDate: timestamp('next_monitoring_date'),
  monitoringStatus: varchar('monitoring_status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

module.exports = {
  rmfProjects,
  rmfSteps,
  rmfTasks,
  rmfQuestionnaires,
  rmfResponses,
  rmfCategorization,
  rmfControlSelection,
  rmfAssessments,
  rmfAuthorization,
  rmfMonitoring,
  rmfStepEnum,
  projectStatusEnum,
  impactLevelEnum,
  taskStatusEnum,
  responseTypeEnum,
};
