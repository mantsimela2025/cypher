const { pgTable, serial, varchar, text, timestamp, integer, jsonb, pgEnum, boolean } = require('drizzle-orm/pg-core');
const { users } = require('./users');
const { policies, procedures } = require('./policies');

// Define enums for AI generation
const generationTypeEnum = pgEnum('enum_ai_generation_type', [
  'policy',
  'procedure',
  'policy_update',
  'procedure_update',
  'compliance_check',
  'risk_assessment',
  'gap_analysis',
  'template_generation',
  'content_enhancement',
  'other'
]);

const generationStatusEnum = pgEnum('enum_ai_generation_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'review_required',
  'approved',
  'rejected'
]);

const aiProviderEnum = pgEnum('enum_ai_provider', [
  'openai',
  'anthropic',
  'azure_openai',
  'google_palm',
  'aws_bedrock',
  'huggingface',
  'custom',
  'other'
]);

const generationModeEnum = pgEnum('enum_generation_mode', [
  'full_generation',
  'template_based',
  'enhancement',
  'review_assistance',
  'compliance_mapping',
  'risk_analysis',
  'gap_identification',
  'content_optimization'
]);

// AI Generation Requests table
const aiGenerationRequests = pgTable('ai_generation_requests', {
  id: serial('id').primaryKey(),
  requestType: generationTypeEnum('request_type').notNull(),
  generationMode: generationModeEnum('generation_mode').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  prompt: text('prompt').notNull(),
  context: jsonb('context').default('{}'), // System context, asset info, existing policies, etc.
  parameters: jsonb('parameters').default('{}'), // AI model parameters, temperature, etc.
  aiProvider: aiProviderEnum('ai_provider').notNull(),
  modelName: varchar('model_name', { length: 100 }),
  status: generationStatusEnum('status').default('pending').notNull(),
  generatedContent: text('generated_content'),
  originalContent: text('original_content'), // For updates/enhancements
  reviewNotes: text('review_notes'),
  qualityScore: integer('quality_score'), // 1-100 quality assessment
  tokensUsed: integer('tokens_used'),
  processingTime: integer('processing_time'), // in milliseconds
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default('{}'),
  relatedPolicyId: integer('related_policy_id').references(() => policies.id),
  relatedProcedureId: integer('related_procedure_id').references(() => procedures.id),
  requestedBy: integer('requested_by').notNull().references(() => users.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Generation Templates table
const aiGenerationTemplates = pgTable('ai_generation_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  templateType: generationTypeEnum('template_type').notNull(),
  generationMode: generationModeEnum('generation_mode').notNull(),
  promptTemplate: text('prompt_template').notNull(),
  systemPrompt: text('system_prompt'),
  defaultParameters: jsonb('default_parameters').default('{}'),
  requiredContext: jsonb('required_context').default('{}'), // What context fields are required
  outputFormat: jsonb('output_format').default('{}'), // Expected output structure
  validationRules: jsonb('validation_rules').default('{}'),
  isActive: boolean('is_active').default(true).notNull(),
  isPublic: boolean('is_public').default(false).notNull(), // Can be used by all users
  usageCount: integer('usage_count').default(0),
  averageQualityScore: integer('average_quality_score'),
  tags: text('tags').array().default([]),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Generation Feedback table
const aiGenerationFeedback = pgTable('ai_generation_feedback', {
  id: serial('id').primaryKey(),
  generationRequestId: integer('generation_request_id').notNull().references(() => aiGenerationRequests.id),
  feedbackType: varchar('feedback_type', { length: 50 }).notNull(), // 'quality', 'accuracy', 'completeness', 'relevance'
  rating: integer('rating').notNull(), // 1-5 rating
  comments: text('comments'),
  suggestions: text('suggestions'),
  isUseful: boolean('is_useful'),
  wouldUseAgain: boolean('would_use_again'),
  metadata: jsonb('metadata').default('{}'),
  providedBy: integer('provided_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Model Configurations table
const aiModelConfigurations = pgTable('ai_model_configurations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  provider: aiProviderEnum('provider').notNull(),
  modelName: varchar('model_name', { length: 100 }).notNull(),
  apiEndpoint: varchar('api_endpoint', { length: 500 }),
  defaultParameters: jsonb('default_parameters').default('{}'), // temperature, max_tokens, etc.
  capabilities: jsonb('capabilities').default('{}'), // what this model is good for
  costPerToken: integer('cost_per_token'), // cost in cents per 1000 tokens
  maxTokens: integer('max_tokens'),
  supportedModes: generationModeEnum('supported_modes').array().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  priority: integer('priority').default(0), // for ordering
  rateLimitPerMinute: integer('rate_limit_per_minute'),
  rateLimitPerHour: integer('rate_limit_per_hour'),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Generation Analytics table
const aiGenerationAnalytics = pgTable('ai_generation_analytics', {
  id: serial('id').primaryKey(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  generationType: generationTypeEnum('generation_type').notNull(),
  provider: aiProviderEnum('provider').notNull(),
  modelName: varchar('model_name', { length: 100 }),
  totalRequests: integer('total_requests').default(0),
  successfulRequests: integer('successful_requests').default(0),
  failedRequests: integer('failed_requests').default(0),
  averageProcessingTime: integer('average_processing_time'), // in milliseconds
  totalTokensUsed: integer('total_tokens_used').default(0),
  totalCost: integer('total_cost').default(0), // in cents
  averageQualityScore: integer('average_quality_score'),
  userSatisfactionScore: integer('user_satisfaction_score'), // 1-100
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  aiGenerationRequests,
  aiGenerationTemplates,
  aiGenerationFeedback,
  aiModelConfigurations,
  aiGenerationAnalytics,
  // Export enums
  generationTypeEnum,
  generationStatusEnum,
  aiProviderEnum,
  generationModeEnum,
};
