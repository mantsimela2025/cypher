const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, numeric, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for AI and NLQ features
const chatStatusEnum = pgEnum('enum_chat_status', ['active', 'archived', 'deleted']);
const queryStatusEnum = pgEnum('enum_query_status', ['pending', 'processing', 'completed', 'failed', 'cancelled']);
const usageTypeEnum = pgEnum('enum_usage_type', ['chat', 'completion', 'embedding', 'fine_tuning', 'moderation']);
const modelTypeEnum = pgEnum('enum_model_type', ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'text-embedding-ada-002', 'whisper-1']);

// NLQ Chat Sessions table
const nlqChatSessions = pgTable('nlq_chat_sessions', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 100 }).notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }),
  status: chatStatusEnum('status').default('active').notNull(),
  context: jsonb('context').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  messageCount: integer('message_count').default(0),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  isShared: boolean('is_shared').default(false),
  sharedWith: text('shared_with').array(), // User IDs or roles
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index('idx_nlq_chat_sessions_session_id').on(table.sessionId),
  userIdIdx: index('idx_nlq_chat_sessions_user_id').on(table.userId),
  statusIdx: index('idx_nlq_chat_sessions_status').on(table.status),
  lastMessageIdx: index('idx_nlq_chat_sessions_last_message').on(table.lastMessageAt),
  sharedIdx: index('idx_nlq_chat_sessions_shared').on(table.isShared),
  createdAtIdx: index('idx_nlq_chat_sessions_created_at').on(table.createdAt),
}));

// NLQ Chat Messages table
const nlqChatMessages = pgTable('nlq_chat_messages', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 100 }).references(() => nlqChatSessions.sessionId, { onDelete: 'cascade' }).notNull(),
  messageId: varchar('message_id', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  rawQuery: text('raw_query'), // Original user query
  generatedSql: text('generated_sql'), // Generated SQL query
  queryResults: jsonb('query_results'), // Results from executed query
  executionTime: integer('execution_time'), // milliseconds
  tokenCount: integer('token_count'),
  model: varchar('model', { length: 50 }),
  temperature: numeric('temperature', { precision: 3, scale: 2 }),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  parentMessageId: varchar('parent_message_id', { length: 100 }),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  sessionMessageUnique: unique('unique_session_message').on(table.sessionId, table.messageId),
  sessionIdIdx: index('idx_nlq_chat_messages_session_id').on(table.sessionId),
  messageIdIdx: index('idx_nlq_chat_messages_message_id').on(table.messageId),
  roleIdx: index('idx_nlq_chat_messages_role').on(table.role),
  createdAtIdx: index('idx_nlq_chat_messages_created_at').on(table.createdAt),
  parentMessageIdx: index('idx_nlq_chat_messages_parent').on(table.parentMessageId),
}));

// NLQ Data Sources table
const nlqDataSources = pgTable('nlq_data_sources', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'table', 'view', 'function', 'api'
  tableName: varchar('table_name', { length: 100 }),
  schemaName: varchar('schema_name', { length: 100 }).default('public'),
  columns: jsonb('columns').notNull(), // Column definitions and metadata
  relationships: jsonb('relationships').default('{}'), // Foreign key relationships
  businessTerms: jsonb('business_terms').default('{}'), // Business-friendly column names
  sampleQueries: text('sample_queries').array(),
  accessLevel: varchar('access_level', { length: 50 }).default('public'), // 'public', 'restricted', 'private'
  allowedRoles: text('allowed_roles').array(),
  isActive: boolean('is_active').default(true),
  lastSynced: timestamp('last_synced', { withTimezone: true }),
  syncFrequency: integer('sync_frequency').default(86400), // seconds
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_nlq_data_sources_name').on(table.name),
  sourceTypeIdx: index('idx_nlq_data_sources_source_type').on(table.sourceType),
  tableNameIdx: index('idx_nlq_data_sources_table_name').on(table.tableName),
  accessLevelIdx: index('idx_nlq_data_sources_access_level').on(table.accessLevel),
  activeIdx: index('idx_nlq_data_sources_active').on(table.isActive),
  lastSyncedIdx: index('idx_nlq_data_sources_last_synced').on(table.lastSynced),
}));

// NLQ Few Shot Examples table
const nlqFewShotExamples = pgTable('nlq_few_shot_examples', {
  id: serial('id').primaryKey(),
  dataSourceId: integer('data_source_id').references(() => nlqDataSources.id),
  question: text('question').notNull(),
  sqlQuery: text('sql_query').notNull(),
  explanation: text('explanation'),
  category: varchar('category', { length: 100 }),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'), // 'easy', 'medium', 'hard'
  tags: text('tags').array(),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  successRate: numeric('success_rate', { precision: 5, scale: 4 }), // 0.0 to 1.0
  lastUsed: timestamp('last_used', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dataSourceIdIdx: index('idx_nlq_few_shot_examples_data_source').on(table.dataSourceId),
  categoryIdx: index('idx_nlq_few_shot_examples_category').on(table.category),
  difficultyIdx: index('idx_nlq_few_shot_examples_difficulty').on(table.difficulty),
  activeIdx: index('idx_nlq_few_shot_examples_active').on(table.isActive),
  usageCountIdx: index('idx_nlq_few_shot_examples_usage_count').on(table.usageCount),
  successRateIdx: index('idx_nlq_few_shot_examples_success_rate').on(table.successRate),
}));

// NLQ Prompt Config table
const nlqPromptConfig = pgTable('nlq_prompt_config', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  promptType: varchar('prompt_type', { length: 50 }).notNull(), // 'system', 'user', 'few_shot', 'context'
  template: text('template').notNull(),
  variables: jsonb('variables').default('{}'),
  model: varchar('model', { length: 50 }),
  temperature: numeric('temperature', { precision: 3, scale: 2 }).default(0.7),
  maxTokens: integer('max_tokens').default(1000),
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  version: varchar('version', { length: 20 }).default('1.0'),
  parentConfigId: integer('parent_config_id').references(() => nlqPromptConfig.id),
  usageCount: integer('usage_count').default(0),
  successRate: numeric('success_rate', { precision: 5, scale: 4 }),
  lastUsed: timestamp('last_used', { withTimezone: true }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_nlq_prompt_config_name').on(table.name),
  promptTypeIdx: index('idx_nlq_prompt_config_prompt_type').on(table.promptType),
  activeIdx: index('idx_nlq_prompt_config_active').on(table.isActive),
  defaultIdx: index('idx_nlq_prompt_config_default').on(table.isDefault),
  parentConfigIdx: index('idx_nlq_prompt_config_parent').on(table.parentConfigId),
  usageCountIdx: index('idx_nlq_prompt_config_usage_count').on(table.usageCount),
}));

// NLQ Query Logs table
const nlqQueryLogs = pgTable('nlq_query_logs', {
  id: serial('id').primaryKey(),
  sessionId: varchar('session_id', { length: 100 }),
  userId: integer('user_id').references(() => users.id),
  queryId: varchar('query_id', { length: 100 }).notNull().unique(),
  naturalLanguageQuery: text('natural_language_query').notNull(),
  generatedSql: text('generated_sql'),
  executedSql: text('executed_sql'), // May be different if modified
  status: queryStatusEnum('status').default('pending').notNull(),
  resultCount: integer('result_count'),
  executionTime: integer('execution_time'), // milliseconds
  errorMessage: text('error_message'),
  promptTokens: integer('prompt_tokens'),
  completionTokens: integer('completion_tokens'),
  totalTokens: integer('total_tokens'),
  model: varchar('model', { length: 50 }),
  temperature: numeric('temperature', { precision: 3, scale: 2 }),
  confidence: numeric('confidence', { precision: 5, scale: 4 }), // AI confidence score
  feedback: varchar('feedback', { length: 20 }), // 'helpful', 'not_helpful', 'incorrect'
  feedbackComment: text('feedback_comment'),
  dataSourcesUsed: text('data_sources_used').array(),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  queryIdIdx: index('idx_nlq_query_logs_query_id').on(table.queryId),
  sessionIdIdx: index('idx_nlq_query_logs_session_id').on(table.sessionId),
  userIdIdx: index('idx_nlq_query_logs_user_id').on(table.userId),
  statusIdx: index('idx_nlq_query_logs_status').on(table.status),
  createdAtIdx: index('idx_nlq_query_logs_created_at').on(table.createdAt),
  feedbackIdx: index('idx_nlq_query_logs_feedback').on(table.feedback),
  modelIdx: index('idx_nlq_query_logs_model').on(table.model),
}));

// OpenAI Usage table
const openaiUsage = pgTable('openai_usage', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  sessionId: varchar('session_id', { length: 100 }),
  requestId: varchar('request_id', { length: 100 }),
  usageType: usageTypeEnum('usage_type').notNull(),
  model: modelTypeEnum('model').notNull(),
  promptTokens: integer('prompt_tokens').default(0),
  completionTokens: integer('completion_tokens').default(0),
  totalTokens: integer('total_tokens').default(0),
  cost: numeric('cost', { precision: 10, scale: 6 }), // Cost in USD
  requestDuration: integer('request_duration'), // milliseconds
  temperature: numeric('temperature', { precision: 3, scale: 2 }),
  maxTokens: integer('max_tokens'),
  topP: numeric('top_p', { precision: 3, scale: 2 }),
  frequencyPenalty: numeric('frequency_penalty', { precision: 3, scale: 2 }),
  presencePenalty: numeric('presence_penalty', { precision: 3, scale: 2 }),
  finishReason: varchar('finish_reason', { length: 50 }),
  errorCode: varchar('error_code', { length: 50 }),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('idx_openai_usage_user_id').on(table.userId),
  sessionIdIdx: index('idx_openai_usage_session_id').on(table.sessionId),
  usageTypeIdx: index('idx_openai_usage_usage_type').on(table.usageType),
  modelIdx: index('idx_openai_usage_model').on(table.model),
  createdAtIdx: index('idx_openai_usage_created_at').on(table.createdAt),
  costIdx: index('idx_openai_usage_cost').on(table.cost),
  totalTokensIdx: index('idx_openai_usage_total_tokens').on(table.totalTokens),
}));

module.exports = {
  nlqChatSessions,
  nlqChatMessages,
  nlqDataSources,
  nlqFewShotExamples,
  nlqPromptConfig,
  nlqQueryLogs,
  openaiUsage,
  // Export enums
  chatStatusEnum,
  queryStatusEnum,
  usageTypeEnum,
  modelTypeEnum,
};
