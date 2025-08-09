const { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  jsonb, 
  timestamp, 
  decimal,
  pgEnum,
  index,
  unique
} = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for nl_queries table
const nlQueriesStatusEnum = pgEnum('enum_nl_queries_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
]);

const nlQueriesQueryTypeEnum = pgEnum('enum_nl_queries_query_type', [
  'asset_search',
  'cost_analysis',
  'vulnerability_report',
  'compliance_check',
  'lifecycle_planning',
  'operational_metrics',
  'risk_assessment',
  'general_query'
]);

const nlQueriesFeedbackEnum = pgEnum('enum_nl_queries_feedback', [
  'helpful',
  'not_helpful',
  'partially_helpful',
  'incorrect',
  'needs_improvement'
]);

// Natural Language Queries table
const nlQueries = pgTable('nl_queries', {
  id: serial('id').primaryKey(),
  query: text('query').notNull(),
  userId: integer('user_id').notNull().references(() => users.id),
  status: nlQueriesStatusEnum('status').default('pending'),
  queryType: nlQueriesQueryTypeEnum('query_type'),
  intent: varchar('intent', { length: 255 }),
  entities: jsonb('entities').default('{}'),
  sqlQuery: text('sql_query'),
  results: jsonb('results').default('{}'),
  resultCount: integer('result_count'),
  executionTime: decimal('execution_time', { precision: 15, scale: 2 }),
  confidence: decimal('confidence', { precision: 15, scale: 2 }),
  feedback: nlQueriesFeedbackEnum('feedback'),
  feedbackComment: text('feedback_comment'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    // Indexes for performance optimization
    userIdIdx: index('idx_nl_queries_user_id').on(table.userId),
    statusIdx: index('idx_nl_queries_status').on(table.status),
    queryTypeIdx: index('idx_nl_queries_query_type').on(table.queryType),
    intentIdx: index('idx_nl_queries_intent').on(table.intent),
    createdAtIdx: index('idx_nl_queries_created_at').on(table.createdAt),
    confidenceIdx: index('idx_nl_queries_confidence').on(table.confidence),
    feedbackIdx: index('idx_nl_queries_feedback').on(table.feedback),
    executionTimeIdx: index('idx_nl_queries_execution_time').on(table.executionTime),
    // Composite indexes for common query patterns
    userStatusIdx: index('idx_nl_queries_user_status').on(table.userId, table.status),
    statusCreatedIdx: index('idx_nl_queries_status_created').on(table.status, table.createdAt),
    queryTypeStatusIdx: index('idx_nl_queries_query_type_status').on(table.queryType, table.status)
  };
});

// Query Templates table
const queryTemplates = pgTable('query_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  queryText: text('query_text').notNull(),
  category: varchar('category', { length: 50 }),
  parameters: jsonb('parameters').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    // Indexes for performance optimization
    nameIdx: index('idx_query_templates_name').on(table.name),
    categoryIdx: index('idx_query_templates_category').on(table.category),
    createdByIdx: index('idx_query_templates_created_by').on(table.createdBy),
    createdAtIdx: index('idx_query_templates_created_at').on(table.createdAt),
    // Unique constraint on template name
    nameUnique: unique('query_templates_name_unique').on(table.name),
    // Composite indexes for common query patterns
    categoryCreatedIdx: index('idx_query_templates_category_created').on(table.category, table.createdAt),
    createdByNameIdx: index('idx_query_templates_created_by_name').on(table.createdBy, table.name)
  };
});

module.exports = {
  nlQueries,
  queryTemplates,
  nlQueriesStatusEnum,
  nlQueriesQueryTypeEnum,
  nlQueriesFeedbackEnum
};
