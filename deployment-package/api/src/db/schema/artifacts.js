const { pgTable, serial, text, integer, timestamp, jsonb } = require('drizzle-orm/pg-core');
const { users } = require('./users');

const artifacts = pgTable('artifacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type'),
  metadata: jsonb('metadata').default('{}'),
  uploadedBy: integer('uploaded_by').references(() => users.id),
  associatedControls: text('associated_controls').array(), // _text array type
  reviewStatus: text('review_status').default('pending').notNull(),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const artifactCategories = pgTable('artifact_categories', {
  id: serial('id').primaryKey(),
  artifactId: integer('artifact_id').references(() => artifacts.id).notNull(),
  categoryId: integer('category_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const artifactReferences = pgTable('artifact_references', {
  id: serial('id').primaryKey(),
  sourceArtifactId: integer('source_artifact_id').references(() => artifacts.id).notNull(),
  targetArtifactId: integer('target_artifact_id').references(() => artifacts.id).notNull(),
  referenceType: text('reference_type'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

const artifactTags = pgTable('artifact_tags', {
  id: serial('id').primaryKey(),
  artifactId: integer('artifact_id').references(() => artifacts.id).notNull(),
  tagId: integer('tag_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

module.exports = {
  artifacts,
  artifactCategories,
  artifactReferences,
  artifactTags,
};
