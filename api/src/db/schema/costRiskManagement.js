const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for cost and risk management
const impactLevelEnum = pgEnum('enum_impact_level', ['low', 'medium', 'high', 'critical']);
const riskLevelEnum = pgEnum('enum_risk_level', ['very_low', 'low', 'medium', 'high', 'very_high']);
const costCategoryEnum = pgEnum('enum_cost_category', ['operational', 'capital', 'maintenance', 'security', 'compliance']);
const budgetStatusEnum = pgEnum('enum_budget_status', ['planned', 'approved', 'allocated', 'spent', 'overrun']);

// Budget Impact table
const budgetImpact = pgTable('budget_impact', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // 'vulnerability', 'asset', 'project', etc.
  entityId: integer('entity_id').notNull(),
  impactType: varchar('impact_type', { length: 50 }).notNull(), // 'cost_increase', 'cost_savings', 'budget_allocation'
  category: costCategoryEnum('category').notNull(),
  estimatedCost: numeric('estimated_cost', { precision: 15, scale: 2 }),
  actualCost: numeric('actual_cost', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  impactDate: timestamp('impact_date', { withTimezone: true }),
  description: text('description'),
  justification: text('justification'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  status: budgetStatusEnum('status').default('planned'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('idx_budget_impact_entity').on(table.entityType, table.entityId),
  entityTypeIdx: index('idx_budget_impact_entity_type').on(table.entityType),
  categoryIdx: index('idx_budget_impact_category').on(table.category),
  statusIdx: index('idx_budget_impact_status').on(table.status),
  impactDateIdx: index('idx_budget_impact_impact_date').on(table.impactDate),
  approvedByIdx: index('idx_budget_impact_approved_by').on(table.approvedBy),
}));

// Business Impact Costs table
const businessImpactCosts = pgTable('business_impact_costs', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  impactCategory: varchar('impact_category', { length: 100 }).notNull(), // 'downtime', 'data_breach', 'compliance_violation'
  impactLevel: impactLevelEnum('impact_level').notNull(),
  directCosts: numeric('direct_costs', { precision: 15, scale: 2 }).default(0),
  indirectCosts: numeric('indirect_costs', { precision: 15, scale: 2 }).default(0),
  opportunityCosts: numeric('opportunity_costs', { precision: 15, scale: 2 }).default(0),
  totalCosts: numeric('total_costs', { precision: 15, scale: 2 }).default(0),
  currency: varchar('currency', { length: 3 }).default('USD'),
  timeframe: varchar('timeframe', { length: 50 }), // 'immediate', 'short_term', 'long_term'
  affectedSystems: text('affected_systems').array(),
  affectedUsers: integer('affected_users'),
  downtimeHours: numeric('downtime_hours', { precision: 8, scale: 2 }),
  revenueImpact: numeric('revenue_impact', { precision: 15, scale: 2 }),
  description: text('description'),
  calculationMethod: text('calculation_method'),
  assumptions: text('assumptions'),
  confidence: integer('confidence'), // 1-100 percentage
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entityIdx: index('idx_business_impact_costs_entity').on(table.entityType, table.entityId),
  impactCategoryIdx: index('idx_business_impact_costs_category').on(table.impactCategory),
  impactLevelIdx: index('idx_business_impact_costs_level').on(table.impactLevel),
  totalCostsIdx: index('idx_business_impact_costs_total').on(table.totalCosts),
  lastUpdatedIdx: index('idx_business_impact_costs_updated').on(table.lastUpdated),
}));

// Cost Budgets table
const costBudgets = pgTable('cost_budgets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  budgetYear: integer('budget_year').notNull(),
  department: varchar('department', { length: 100 }),
  category: costCategoryEnum('category').notNull(),
  allocatedAmount: numeric('allocated_amount', { precision: 15, scale: 2 }).notNull(),
  spentAmount: numeric('spent_amount', { precision: 15, scale: 2 }).default(0),
  remainingAmount: numeric('remaining_amount', { precision: 15, scale: 2 }).default(0),
  currency: varchar('currency', { length: 3 }).default('USD'),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  status: budgetStatusEnum('status').default('planned'),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  notes: text('notes'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_cost_budgets_name').on(table.name),
  budgetYearIdx: index('idx_cost_budgets_year').on(table.budgetYear),
  departmentIdx: index('idx_cost_budgets_department').on(table.department),
  categoryIdx: index('idx_cost_budgets_category').on(table.category),
  statusIdx: index('idx_cost_budgets_status').on(table.status),
  dateRangeIdx: index('idx_cost_budgets_date_range').on(table.startDate, table.endDate),
}));

// Cost Centers table
const costCenters = pgTable('cost_centers', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  department: varchar('department', { length: 100 }),
  manager: integer('manager').references(() => users.id),
  parentCostCenterId: integer('parent_cost_center_id').references(() => costCenters.id),
  isActive: boolean('is_active').default(true),
  budgetLimit: numeric('budget_limit', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('idx_cost_centers_code').on(table.code),
  nameIdx: index('idx_cost_centers_name').on(table.name),
  departmentIdx: index('idx_cost_centers_department').on(table.department),
  managerIdx: index('idx_cost_centers_manager').on(table.manager),
  parentIdx: index('idx_cost_centers_parent').on(table.parentCostCenterId),
  activeIdx: index('idx_cost_centers_active').on(table.isActive),
}));

// Risk Adjustment Factors table
const riskAdjustmentFactors = pgTable('risk_adjustment_factors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  factorType: varchar('factor_type', { length: 50 }).notNull(), // 'multiplier', 'additive', 'percentage'
  category: varchar('category', { length: 100 }), // 'environmental', 'technical', 'business'
  baseValue: numeric('base_value', { precision: 10, scale: 4 }).notNull(),
  minValue: numeric('min_value', { precision: 10, scale: 4 }),
  maxValue: numeric('max_value', { precision: 10, scale: 4 }),
  applicableEntityTypes: text('applicable_entity_types').array(),
  conditions: jsonb('conditions').default('{}'),
  isActive: boolean('is_active').default(true),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  expirationDate: timestamp('expiration_date', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_risk_adjustment_factors_name').on(table.name),
  factorTypeIdx: index('idx_risk_adjustment_factors_type').on(table.factorType),
  categoryIdx: index('idx_risk_adjustment_factors_category').on(table.category),
  activeIdx: index('idx_risk_adjustment_factors_active').on(table.isActive),
  effectiveDateIdx: index('idx_risk_adjustment_factors_effective').on(table.effectiveDate),
}));

// Risk Factors table
const riskFactors = pgTable('risk_factors', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  weight: numeric('weight', { precision: 5, scale: 4 }).default(1.0),
  riskLevel: riskLevelEnum('risk_level').notNull(),
  impactScore: integer('impact_score'), // 1-10 scale
  probabilityScore: integer('probability_score'), // 1-10 scale
  calculatedRisk: numeric('calculated_risk', { precision: 8, scale: 4 }),
  mitigationStrategies: text('mitigation_strategies').array(),
  isActive: boolean('is_active').default(true),
  lastAssessed: timestamp('last_assessed', { withTimezone: true }),
  nextAssessment: timestamp('next_assessment', { withTimezone: true }),
  assessedBy: integer('assessed_by').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_risk_factors_name').on(table.name),
  categoryIdx: index('idx_risk_factors_category').on(table.category),
  riskLevelIdx: index('idx_risk_factors_risk_level').on(table.riskLevel),
  activeIdx: index('idx_risk_factors_active').on(table.isActive),
  lastAssessedIdx: index('idx_risk_factors_last_assessed').on(table.lastAssessed),
  nextAssessmentIdx: index('idx_risk_factors_next_assessment').on(table.nextAssessment),
}));

// Risk Models table
const riskModels = pgTable('risk_models', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version: varchar('version', { length: 20 }).default('1.0'),
  modelType: varchar('model_type', { length: 50 }).notNull(), // 'quantitative', 'qualitative', 'hybrid'
  algorithm: varchar('algorithm', { length: 100 }), // 'cvss', 'custom', 'monte_carlo'
  parameters: jsonb('parameters').default('{}'),
  weights: jsonb('weights').default('{}'),
  thresholds: jsonb('thresholds').default('{}'),
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  applicableEntityTypes: text('applicable_entity_types').array(),
  validationResults: jsonb('validation_results').default('{}'),
  accuracy: numeric('accuracy', { precision: 5, scale: 4 }),
  lastValidated: timestamp('last_validated', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_risk_models_name').on(table.name),
  modelTypeIdx: index('idx_risk_models_type').on(table.modelType),
  activeIdx: index('idx_risk_models_active').on(table.isActive),
  defaultIdx: index('idx_risk_models_default').on(table.isDefault),
  lastValidatedIdx: index('idx_risk_models_last_validated').on(table.lastValidated),
}));

// Risk Score History table
const riskScoreHistory = pgTable('risk_score_history', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  riskModelId: integer('risk_model_id').references(() => riskModels.id),
  previousScore: numeric('previous_score', { precision: 8, scale: 4 }),
  newScore: numeric('new_score', { precision: 8, scale: 4 }).notNull(),
  scoreDelta: numeric('score_delta', { precision: 8, scale: 4 }),
  previousLevel: riskLevelEnum('previous_level'),
  newLevel: riskLevelEnum('new_level').notNull(),
  changeReason: varchar('change_reason', { length: 255 }),
  changeDetails: jsonb('change_details').default('{}'),
  calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
  calculatedBy: integer('calculated_by').references(() => users.id),
}, (table) => ({
  entityIdx: index('idx_risk_score_history_entity').on(table.entityType, table.entityId),
  entityTypeIdx: index('idx_risk_score_history_entity_type').on(table.entityType),
  riskModelIdx: index('idx_risk_score_history_model').on(table.riskModelId),
  calculatedAtIdx: index('idx_risk_score_history_calculated_at').on(table.calculatedAt),
  newScoreIdx: index('idx_risk_score_history_new_score').on(table.newScore),
  newLevelIdx: index('idx_risk_score_history_new_level').on(table.newLevel),
}));

module.exports = {
  budgetImpact,
  businessImpactCosts,
  costBudgets,
  costCenters,
  riskAdjustmentFactors,
  riskFactors,
  riskModels,
  riskScoreHistory,
  // Export enums
  impactLevelEnum,
  riskLevelEnum,
  costCategoryEnum,
  budgetStatusEnum,
};
