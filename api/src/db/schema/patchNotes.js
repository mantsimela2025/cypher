const { pgTable, serial, varchar, text, timestamp, boolean, integer, uuid, pgEnum, jsonb, index } = require('drizzle-orm/pg-core');
const { patches } = require('./patches');
const { patchJobs } = require('./patchJobs');
const { patchSchedules } = require('./patchSchedules');
const { patchApprovals } = require('./patchApprovals');
const { assets } = require('./assets');
const { users } = require('./users');

// Enums for patch notes and audit trails
const noteTypeEnum = pgEnum('note_type', [
  'general',
  'technical',
  'business',
  'risk_assessment',
  'testing_results',
  'rollback_notes',
  'incident_report',
  'compliance_note'
]);

const noteCategoryEnum = pgEnum('note_category', [
  'planning',
  'pre_deployment',
  'deployment', 
  'post_deployment',
  'troubleshooting',
  'rollback',
  'verification',
  'documentation'
]);

const visibilityLevelEnum = pgEnum('visibility_level', [
  'public',
  'internal',
  'restricted',
  'confidential'
]);

const attachmentTypeEnum = pgEnum('attachment_type', [
  'document',
  'image',
  'log_file',
  'script',
  'configuration',
  'evidence',
  'report'
]);

// Main patch notes table - comprehensive audit trail and documentation
const patchNotes = pgTable('patch_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Note classification
  noteType: noteTypeEnum('note_type').notNull(),
  category: noteCategoryEnum('category').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  
  // Related entities - flexible linking to any patch-related entity
  patchId: uuid('patch_id').references(() => patches.id, { onDelete: 'cascade' }),
  jobId: uuid('job_id').references(() => patchJobs.id, { onDelete: 'cascade' }),
  scheduleId: uuid('schedule_id').references(() => patchSchedules.id, { onDelete: 'cascade' }),
  approvalId: uuid('approval_id').references(() => patchApprovals.id, { onDelete: 'cascade' }),
  assetUuid: uuid('asset_uuid').references(() => assets.assetUuid, { onDelete: 'cascade' }),
  
  // Note properties
  priority: varchar('priority', { length: 20 }).default('normal').notNull(), // low, normal, high, critical
  visibilityLevel: visibilityLevelEnum('visibility_level').default('internal').notNull(),
  isSystemGenerated: boolean('is_system_generated').default(false),
  isActionRequired: boolean('is_action_required').default(false),
  actionDueDate: timestamp('action_due_date'),
  
  // Formatting and metadata
  contentFormat: varchar('content_format', { length: 20 }).default('text').notNull(), // text, markdown, html
  tags: text('tags'), // JSON array of tags for categorization
  keywords: text('keywords'), // JSON array for search optimization
  
  // Status tracking
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: uuid('resolved_by').references(() => users.id),
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'),
  
  // Version control
  version: integer('version').default(1),
  parentNoteId: uuid('parent_note_id').references(() => patchNotes.id),
  isLatestVersion: boolean('is_latest_version').default(true),
  
  // Audit information
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    patchIdIdx: index('idx_patch_notes_patch_id').on(table.patchId),
    jobIdIdx: index('idx_patch_notes_job_id').on(table.jobId),
    typeIdx: index('idx_patch_notes_type').on(table.noteType),
    categoryIdx: index('idx_patch_notes_category').on(table.category),
    createdByIdx: index('idx_patch_notes_created_by').on(table.createdBy),
    createdAtIdx: index('idx_patch_notes_created_at').on(table.createdAt),
    actionRequiredIdx: index('idx_patch_notes_action_required').on(table.isActionRequired),
  };
});

// Note attachments - files and documents attached to notes
const noteAttachments = pgTable('note_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').references(() => patchNotes.id, { onDelete: 'cascade' }).notNull(),
  
  // File information
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(), // Bytes
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  attachmentType: attachmentTypeEnum('attachment_type').notNull(),
  
  // Storage information
  storageProvider: varchar('storage_provider', { length: 50 }).default('local').notNull(),
  storagePath: text('storage_path').notNull(),
  storageKey: varchar('storage_key', { length: 255 }),
  
  // Security
  isEncrypted: boolean('is_encrypted').default(false),
  encryptionKey: varchar('encryption_key', { length: 255 }),
  checksumMd5: varchar('checksum_md5', { length: 32 }),
  checksumSha256: varchar('checksum_sha256', { length: 64 }),
  
  // Access control
  visibilityLevel: visibilityLevelEnum('visibility_level').default('internal').notNull(),
  downloadCount: integer('download_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at'),
  
  // Metadata
  description: text('description'),
  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    noteAttachmentIdx: index('idx_note_attachments_note').on(table.noteId),
    typeIdx: index('idx_note_attachments_type').on(table.attachmentType),
  };
});

// Note comments - threaded discussions on notes
const noteComments = pgTable('note_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').references(() => patchNotes.id, { onDelete: 'cascade' }).notNull(),
  parentCommentId: uuid('parent_comment_id').references(() => noteComments.id, { onDelete: 'cascade' }),
  
  content: text('content').notNull(),
  contentFormat: varchar('content_format', { length: 20 }).default('text').notNull(),
  
  // Metadata
  isSystemGenerated: boolean('is_system_generated').default(false),
  isEdited: boolean('is_edited').default(false),
  editedAt: timestamp('edited_at'),
  
  // Status
  isDeleted: boolean('is_deleted').default(false),
  deletedAt: timestamp('deleted_at'),
  deletedBy: uuid('deleted_by').references(() => users.id),
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    noteCommentIdx: index('idx_note_comments_note').on(table.noteId),
    parentCommentIdx: index('idx_note_comments_parent').on(table.parentCommentId),
    createdAtIdx: index('idx_note_comments_created_at').on(table.createdAt),
  };
});

// Activity feed - comprehensive audit trail across all patch activities
const patchActivityFeed = pgTable('patch_activity_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Activity classification
  activityType: varchar('activity_type', { length: 100 }).notNull(), // created, updated, approved, deployed, etc.
  entityType: varchar('entity_type', { length: 50 }).notNull(), // patch, job, schedule, approval, note
  entityId: uuid('entity_id').notNull(),
  
  // Activity details
  summary: varchar('summary', { length: 500 }).notNull(),
  description: text('description'),
  previousState: jsonb('previous_state'),
  newState: jsonb('new_state'),
  changeDetails: jsonb('change_details'),
  
  // Context information
  severity: varchar('severity', { length: 20 }).default('info').notNull(), // debug, info, warning, error, critical
  source: varchar('source', { length: 50 }).default('user').notNull(), // user, system, api, scheduler
  sourceDetails: jsonb('source_details'),
  
  // Related entities for cross-referencing
  relatedPatchId: uuid('related_patch_id').references(() => patches.id),
  relatedJobId: uuid('related_job_id').references(() => patchJobs.id),
  relatedAssetUuid: uuid('related_asset_uuid').references(() => assets.assetUuid),
  
  // User and session information
  userId: uuid('user_id').references(() => users.id),
  sessionId: varchar('session_id', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Timing
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    entityIdx: index('idx_patch_activity_entity').on(table.entityType, table.entityId),
    timestampIdx: index('idx_patch_activity_timestamp').on(table.timestamp),
    userIdx: index('idx_patch_activity_user').on(table.userId),
    patchIdx: index('idx_patch_activity_patch').on(table.relatedPatchId),
    activityTypeIdx: index('idx_patch_activity_type').on(table.activityType),
    severityIdx: index('idx_patch_activity_severity').on(table.severity),
  };
});

// Note templates - reusable note templates for common scenarios
const noteTemplates = pgTable('note_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Template properties
  noteType: noteTypeEnum('note_type').notNull(),
  category: noteCategoryEnum('category').notNull(),
  titleTemplate: varchar('title_template', { length: 500 }).notNull(),
  contentTemplate: text('content_template').notNull(),
  
  // Default settings
  defaultPriority: varchar('default_priority', { length: 20 }).default('normal'),
  defaultVisibilityLevel: visibilityLevelEnum('default_visibility_level').default('internal'),
  defaultTags: text('default_tags'), // JSON array
  
  // Usage tracking
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamp('last_used_at'),
  
  // Template management
  isActive: boolean('is_active').default(true),
  isSystemTemplate: boolean('is_system_template').default(false),
  
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

module.exports = {
  patchNotes,
  noteAttachments,
  noteComments,
  patchActivityFeed,
  noteTemplates,
  noteTypeEnum,
  noteCategoryEnum,
  visibilityLevelEnum,
  attachmentTypeEnum,
};