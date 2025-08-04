const { pgTable, varchar, text, integer, timestamp, jsonb, boolean, check, index, unique } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');
const { users } = require('./users');

// Folders table
const folders = pgTable('folders', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  parentFolderId: varchar('parent_folder_id'), // Self-referencing
  userId: integer('user_id').references(() => users.id).notNull(),
  folderType: varchar('folder_type').default('general'), // general, shared, secure
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  parentFolderIdIdx: index('idx_folders_parent_folder_id').on(table.parentFolderId),
  userIdIdx: index('idx_folders_user_id').on(table.userId),
  nameIdx: index('idx_folders_name').using('gin', sql`to_tsvector('english', ${table.name})`),
  folderTypeIdx: index('idx_folders_folder_type').on(table.folderType),
}));

// Document shares table
const documentShares = pgTable('document_shares', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  permissionLevel: varchar('permission_level').default('read'), // read, write, admin
  sharedBy: integer('shared_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  documentUserIdx: unique('idx_document_shares_document_user').on(table.documentId, table.userId),
  documentIdIdx: index('idx_document_shares_document_id').on(table.documentId),
  userIdIdx: index('idx_document_shares_user_id').on(table.userId),
  sharedByIdx: index('idx_document_shares_shared_by').on(table.sharedBy),
  permissionLevelIdx: index('idx_document_shares_permission_level').on(table.permissionLevel),
}));

// Document favorites table
const documentFavorites = pgTable('document_favorites', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  documentUserIdx: unique('idx_document_favorites_document_user').on(table.documentId, table.userId),
  documentIdIdx: index('idx_document_favorites_document_id').on(table.documentId),
  userIdIdx: index('idx_document_favorites_user_id').on(table.userId),
}));

// Main documents table
const documents = pgTable('documents', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type').notNull(),
  url: text('url').notNull(),
  objectPath: text('object_path'),
  folderId: varchar('folder_id').references(() => folders.id), // Now properly references folders table
  userId: integer('user_id').references(() => users.id).notNull(),
  tags: text('tags').array().default(sql`'{}'::text[]`),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // For soft delete
  deletedBy: integer('deleted_by').references(() => users.id), // Who deleted it
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  folderIdIdx: index('idx_documents_folder_id').on(table.folderId),
  mimeTypeIdx: index('idx_documents_mime_type').on(table.mimeType),
  nameIdx: index('idx_documents_name').using('gin', sql`to_tsvector('english', ${table.name})`),
  tagsIdx: index('idx_documents_tags').using('gin', table.tags),
  userIdIdx: index('idx_documents_user_id').on(table.userId),
  deletedAtIdx: index('idx_documents_deleted_at').on(table.deletedAt),
  deletedByIdx: index('idx_documents_deleted_by').on(table.deletedBy),
}));

// Document analytics table
const documentAnalytics = pgTable('document_analytics', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action').notNull(),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  actionCheck: check('document_analytics_action_check', sql`${table.action} = ANY(ARRAY['view'::character varying, 'download'::character varying])`),
  actionIdx: index('idx_analytics_action').on(table.action),
  documentIdIdx: index('idx_analytics_document_id').on(table.documentId),
  metadataIdx: index('idx_analytics_metadata').using('gin', table.metadata),
  timestampIdx: index('idx_analytics_timestamp').on(table.timestamp),
  userIdIdx: index('idx_analytics_user_id').on(table.userId),
}));

// Document changes table
const documentChanges = pgTable('document_changes', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionId: varchar('version_id'), // Will reference document_versions
  changeType: varchar('change_type').notNull(),
  changeDescription: text('change_description'),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  changeTypeCheck: check('document_changes_change_type_check', 
    sql`${table.changeType} = ANY(ARRAY['created'::character varying, 'updated'::character varying, 'renamed'::character varying, 'moved'::character varying, 'deleted'::character varying, 'restored'::character varying])`
  ),
  changeTypeIdx: index('idx_changes_change_type').on(table.changeType),
  documentIdIdx: index('idx_changes_document_id').on(table.documentId),
  newValueIdx: index('idx_changes_new_value').using('gin', table.newValue),
  previousValueIdx: index('idx_changes_previous_value').using('gin', table.previousValue),
  timestampIdx: index('idx_changes_timestamp').on(table.timestamp),
  userIdIdx: index('idx_changes_user_id').on(table.userId),
  versionIdIdx: index('idx_changes_version_id').on(table.versionId),
}));

// Document comments table
const documentComments = pgTable('document_comments', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index('idx_comments_created_at').on(table.createdAt),
  documentIdIdx: index('idx_comments_document_id').on(table.documentId),
  userIdIdx: index('idx_comments_user_id').on(table.userId),
}));

// Document templates table
const documentTemplates = pgTable('document_templates', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  category: varchar('category').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  templateUrl: text('template_url').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_templates_category').on(table.category),
  isPublicIdx: index('idx_templates_is_public').on(table.isPublic),
  nameIdx: index('idx_templates_name').using('gin', sql`to_tsvector('english', ${table.name})`),
  userIdIdx: index('idx_templates_user_id').on(table.userId),
}));

// Document versions table
const documentVersions = pgTable('document_versions', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  documentId: varchar('document_id').references(() => documents.id, { onDelete: 'cascade' }).notNull(),
  versionNumber: integer('version_number').notNull(),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type').notNull(),
  url: text('url').notNull(),
  checksum: varchar('checksum'),
  changeType: varchar('change_type').notNull(),
  changeDescription: text('change_description'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  changeTypeCheck: check('document_versions_change_type_check',
    sql`${table.changeType} = ANY(ARRAY['created'::character varying, 'updated'::character varying, 'renamed'::character varying, 'moved'::character varying, 'restored'::character varying])`
  ),
  changeTypeIdx: index('idx_versions_change_type').on(table.changeType),
  createdAtIdx: index('idx_versions_created_at').on(table.createdAt),
  documentIdIdx: index('idx_versions_document_id').on(table.documentId),
  documentVersionIdx: index('idx_versions_document_version').on(table.documentId, table.versionNumber).unique(),
  userIdIdx: index('idx_versions_user_id').on(table.userId),
}));

// Action enums for type safety
const documentActionEnum = ['view', 'download'];
const documentChangeTypeEnum = ['created', 'updated', 'renamed', 'moved', 'deleted', 'restored'];
const documentVersionChangeTypeEnum = ['created', 'updated', 'renamed', 'moved', 'restored'];

// Permission level enums for type safety
const documentPermissionLevelEnum = ['read', 'write', 'admin'];
const folderTypeEnum = ['general', 'shared', 'secure'];

module.exports = {
  folders,
  documents,
  documentShares,
  documentFavorites,
  documentAnalytics,
  documentChanges,
  documentComments,
  documentTemplates,
  documentVersions,
  documentActionEnum,
  documentChangeTypeEnum,
  documentVersionChangeTypeEnum,
  documentPermissionLevelEnum,
  folderTypeEnum,
};