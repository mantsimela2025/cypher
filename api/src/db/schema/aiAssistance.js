const { pgTable, serial, varchar, text, timestamp, integer, boolean, jsonb, pgEnum, decimal } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for AI assistance system
const aiRequestTypeEnum = pgEnum('enum_ai_request_type', [
  'threat_analysis',
  'incident_response',
  'compliance_guidance',
  'policy_generation',
  'risk_assessment',
  'vulnerability_analysis',
  'forensic_analysis',
  'training_content',
  'documentation',
  'code_review',
  'configuration_review',
  'threat_hunting',
  'malware_analysis',
  'network_analysis',
  'log_analysis'
]);

const aiProviderEnum = pgEnum('enum_ai_provider', [
  'openai',
  'anthropic',
  'azure_openai',
  'aws_bedrock',
  'google_vertex',
  'local_model',
  'government_ai'
]);

const aiStatusEnum = pgEnum('enum_ai_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'requires_review',
  'approved',
  'rejected'
]);

const aiConfidenceEnum = pgEnum('enum_ai_confidence', [
  'very_low',
  'low',
  'medium',
  'high',
  'very_high'
]);

// AI Assistance Requests - Core AI interaction tracking
const aiAssistanceRequests = pgTable('ai_assistance_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  requestType: aiRequestTypeEnum('request_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  context: jsonb('context').default('{}'), // Additional context data
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, critical
  
  // AI Processing
  aiProvider: aiProviderEnum('ai_provider'),
  aiModel: varchar('ai_model', { length: 100 }),
  prompt: text('prompt'),
  response: text('response'),
  confidence: aiConfidenceEnum('confidence'),
  processingTime: integer('processing_time'), // milliseconds
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 10, scale: 4 }), // Cost in dollars
  
  // Status and Workflow
  status: aiStatusEnum('status').default('pending'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  
  // Quality and Feedback
  qualityRating: integer('quality_rating'), // 1-5 rating
  userFeedback: text('user_feedback'),
  accuracyScore: decimal('accuracy_score', { precision: 5, scale: 2 }), // 0-100
  usefulness: integer('usefulness'), // 1-5 rating
  
  // Implementation and Results
  implementationStatus: varchar('implementation_status', { length: 50 }), // not_implemented, in_progress, completed, failed
  implementationNotes: text('implementation_notes'),
  results: jsonb('results').default('{}'),
  effectiveness: integer('effectiveness'), // 1-5 rating
  
  // Relationships and References
  relatedRequestId: integer('related_request_id').references(() => aiAssistanceRequests.id),
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // asset, vulnerability, incident, etc.
  relatedEntityId: integer('related_entity_id'),
  
  // Security and Compliance
  classificationLevel: varchar('classification_level', { length: 50 }).default('unclassified'),
  sensitiveData: boolean('sensitive_data').default(false),
  complianceReview: boolean('compliance_review').default(false),
  auditTrail: jsonb('audit_trail').default('[]'),
  
  // Metadata
  tags: text('tags').array().default([]),
  metadata: jsonb('metadata').default('{}'),
  isPublic: boolean('is_public').default(false), // Can be shared with other users
  isTemplate: boolean('is_template').default(false), // Can be used as template
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Knowledge Base - Curated AI-generated knowledge and best practices
const aiKnowledgeBase = pgTable('ai_knowledge_base', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // threat_intelligence, procedures, best_practices, etc.
  subcategory: varchar('subcategory', { length: 100 }),
  content: text('content').notNull(),
  summary: text('summary'),
  
  // AI Generation Info
  generatedBy: aiProviderEnum('generated_by'),
  sourceRequestId: integer('source_request_id').references(() => aiAssistanceRequests.id),
  confidence: aiConfidenceEnum('confidence'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  
  // Quality and Validation
  isValidated: boolean('is_validated').default(false),
  validatedBy: integer('validated_by').references(() => users.id),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }), // 0-100
  relevance: integer('relevance'), // 1-5 rating
  
  // Usage and Analytics
  viewCount: integer('view_count').default(0),
  useCount: integer('use_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }), // Average user rating
  ratingCount: integer('rating_count').default(0),
  
  // Security and Access
  classificationLevel: varchar('classification_level', { length: 50 }).default('unclassified'),
  accessLevel: varchar('access_level', { length: 50 }).default('public'), // public, restricted, classified
  approvedForSharing: boolean('approved_for_sharing').default(false),
  
  // Relationships
  relatedTopics: text('related_topics').array().default([]),
  references: jsonb('references').default('[]'),
  tags: text('tags').array().default([]),
  
  // Metadata
  version: varchar('version', { length: 20 }).default('1.0'),
  language: varchar('language', { length: 10 }).default('en'),
  format: varchar('format', { length: 20 }).default('markdown'), // markdown, html, json
  metadata: jsonb('metadata').default('{}'),
  
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Training Data - Curated training examples and feedback
const aiTrainingData = pgTable('ai_training_data', {
  id: serial('id').primaryKey(),
  dataType: varchar('data_type', { length: 50 }).notNull(), // prompt_response, classification, feedback
  category: varchar('category', { length: 100 }).notNull(),
  
  // Training Content
  input: text('input').notNull(),
  expectedOutput: text('expected_output'),
  actualOutput: text('actual_output'),
  feedback: text('feedback'),
  
  // Quality Metrics
  quality: integer('quality'), // 1-5 rating
  accuracy: decimal('accuracy', { precision: 5, scale: 2 }),
  relevance: integer('relevance'), // 1-5 rating
  
  // Source Information
  sourceType: varchar('source_type', { length: 50 }), // user_feedback, expert_review, automated
  sourceId: integer('source_id'), // Reference to source record
  contributedBy: integer('contributed_by').references(() => users.id),
  
  // Usage and Status
  isApproved: boolean('is_approved').default(false),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  usedInTraining: boolean('used_in_training').default(false),
  trainingDate: timestamp('training_date', { withTimezone: true }),
  
  // Security
  classificationLevel: varchar('classification_level', { length: 50 }).default('unclassified'),
  sanitized: boolean('sanitized').default(false),
  
  // Metadata
  tags: text('tags').array().default([]),
  metadata: jsonb('metadata').default('{}'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Analytics - Performance metrics and usage analytics
const aiAnalytics = pgTable('ai_analytics', {
  id: serial('id').primaryKey(),
  metricType: varchar('metric_type', { length: 50 }).notNull(), // usage, performance, quality, cost
  metricName: varchar('metric_name', { length: 100 }).notNull(),
  
  // Time and Scope
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  timeframe: varchar('timeframe', { length: 20 }).notNull(), // hourly, daily, weekly, monthly
  scope: varchar('scope', { length: 50 }), // global, user, department, request_type
  scopeId: varchar('scope_id', { length: 100 }),
  
  // Metrics
  value: decimal('value', { precision: 15, scale: 4 }).notNull(),
  count: integer('count'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  
  // Additional Data
  breakdown: jsonb('breakdown').default('{}'), // Detailed breakdown of metrics
  metadata: jsonb('metadata').default('{}'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Model Configurations - AI model settings and configurations
const aiModelConfigurations = pgTable('ai_model_configurations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  provider: aiProviderEnum('provider').notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  version: varchar('version', { length: 50 }),
  
  // Configuration
  configuration: jsonb('configuration').default('{}'), // Model-specific settings
  parameters: jsonb('parameters').default('{}'), // Temperature, max_tokens, etc.
  systemPrompt: text('system_prompt'),
  
  // Usage and Limits
  isActive: boolean('is_active').default(true),
  usageLimit: integer('usage_limit'), // Requests per day/hour
  costLimit: decimal('cost_limit', { precision: 10, scale: 4 }), // Cost limit per day

  // Performance
  averageResponseTime: integer('average_response_time'), // milliseconds
  successRate: decimal('success_rate', { precision: 5, scale: 2 }), // 0-100
  averageCost: decimal('average_cost', { precision: 10, scale: 6 }), // Cost per request
  
  // Security and Compliance
  securityLevel: varchar('security_level', { length: 50 }).default('standard'),
  complianceApproved: boolean('compliance_approved').default(false),
  dataRetention: integer('data_retention'), // Days to retain data
  
  // Metadata
  description: text('description'),
  tags: text('tags').array().default([]),
  metadata: jsonb('metadata').default('{}'),
  
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// AI Automation Rules - Rules for automated AI assistance
const aiAutomationRules = pgTable('ai_automation_rules', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Trigger Conditions
  triggerType: varchar('trigger_type', { length: 50 }).notNull(), // event, schedule, manual
  triggerConditions: jsonb('trigger_conditions').default('{}'),
  
  // AI Action
  aiRequestType: aiRequestTypeEnum('ai_request_type').notNull(),
  modelConfigId: integer('model_config_id').references(() => aiModelConfigurations.id),
  promptTemplate: text('prompt_template').notNull(),
  
  // Execution Settings
  isActive: boolean('is_active').default(true),
  requiresApproval: boolean('requires_approval').default(true),
  maxExecutionsPerDay: integer('max_executions_per_day').default(10),
  
  // Results Handling
  autoImplement: boolean('auto_implement').default(false),
  notificationSettings: jsonb('notification_settings').default('{}'),
  
  // Performance
  executionCount: integer('execution_count').default(0),
  successCount: integer('success_count').default(0),
  lastExecuted: timestamp('last_executed', { withTimezone: true }),
  
  // Metadata
  tags: text('tags').array().default([]),
  metadata: jsonb('metadata').default('{}'),
  
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  aiAssistanceRequests,
  aiKnowledgeBase,
  aiTrainingData,
  aiAnalytics,
  aiModelConfigurations,
  aiAutomationRules,
  // Export enums
  aiRequestTypeEnum,
  aiProviderEnum,
  aiStatusEnum,
  aiConfidenceEnum,
};
