const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for diagram management
const diagramStatusEnum = pgEnum('enum_diagram_status', ['draft', 'review', 'approved', 'published', 'archived']);
const sharePermissionEnum = pgEnum('enum_share_permission', ['view', 'comment', 'edit', 'admin']);
const signatureStatusEnum = pgEnum('enum_signature_status', ['pending', 'signed', 'rejected', 'expired']);

// Main Diagrams table
const diagrams = pgTable('diagrams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'network', 'architecture', 'flow', 'security', etc.
  category: varchar('category', { length: 100 }),
  status: diagramStatusEnum('status').default('draft'),
  content: jsonb('content').notNull(), // Diagram data structure
  metadata: jsonb('metadata').default('{}'),
  settings: jsonb('settings').default('{}'),
  version: varchar('version', { length: 20 }).default('1.0'),
  parentDiagramId: integer('parent_diagram_id').references(() => diagrams.id),
  templateId: integer('template_id'), // References diagram_templates.id
  projectId: integer('project_id'), // References diagram_projects.id
  isTemplate: boolean('is_template').default(false),
  isPublic: boolean('is_public').default(false),
  isLocked: boolean('is_locked').default(false),
  lockReason: text('lock_reason'),
  lockedBy: integer('locked_by').references(() => users.id),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  tags: text('tags').array(),
  lastModified: timestamp('last_modified', { withTimezone: true }).defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
  modifiedBy: integer('modified_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_diagrams_name').on(table.name),
  typeIdx: index('idx_diagrams_type').on(table.type),
  categoryIdx: index('idx_diagrams_category').on(table.category),
  statusIdx: index('idx_diagrams_status').on(table.status),
  parentDiagramIdx: index('idx_diagrams_parent_diagram').on(table.parentDiagramId),
  templateIdIdx: index('idx_diagrams_template_id').on(table.templateId),
  projectIdIdx: index('idx_diagrams_project_id').on(table.projectId),
  templateIdx: index('idx_diagrams_template').on(table.isTemplate),
  publicIdx: index('idx_diagrams_public').on(table.isPublic),
  lockedIdx: index('idx_diagrams_locked').on(table.isLocked),
  lastModifiedIdx: index('idx_diagrams_last_modified').on(table.lastModified),
  createdByIdx: index('idx_diagrams_created_by').on(table.createdBy),
}));

// Diagram Templates table
const diagramTemplates = pgTable('diagram_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  type: varchar('type', { length: 50 }).notNull(),
  templateData: jsonb('template_data').notNull(),
  previewImage: varchar('preview_image', { length: 500 }),
  isPublic: boolean('is_public').default(true),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  rating: integer('rating'), // 1-5 stars
  ratingCount: integer('rating_count').default(0),
  tags: text('tags').array(),
  version: varchar('version', { length: 20 }).default('1.0'),
  minAppVersion: varchar('min_app_version', { length: 20 }),
  maxAppVersion: varchar('max_app_version', { length: 20 }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_diagram_templates_name').on(table.name),
  categoryIdx: index('idx_diagram_templates_category').on(table.category),
  typeIdx: index('idx_diagram_templates_type').on(table.type),
  publicIdx: index('idx_diagram_templates_public').on(table.isPublic),
  activeIdx: index('idx_diagram_templates_active').on(table.isActive),
  usageCountIdx: index('idx_diagram_templates_usage_count').on(table.usageCount),
  ratingIdx: index('idx_diagram_templates_rating').on(table.rating),
  tagsIdx: index('idx_diagram_templates_tags').on(table.tags),
}));

// Diagram Projects table
const diagramProjects = pgTable('diagram_projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'completed', 'archived'
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  deadline: timestamp('deadline', { withTimezone: true }),
  priority: varchar('priority', { length: 20 }).default('medium'),
  budget: integer('budget'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  teamMembers: text('team_members').array(), // User IDs
  stakeholders: text('stakeholders').array(), // User IDs
  tags: text('tags').array(),
  metadata: jsonb('metadata').default('{}'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_diagram_projects_name').on(table.name),
  statusIdx: index('idx_diagram_projects_status').on(table.status),
  priorityIdx: index('idx_diagram_projects_priority').on(table.priority),
  deadlineIdx: index('idx_diagram_projects_deadline').on(table.deadline),
  createdByIdx: index('idx_diagram_projects_created_by').on(table.createdBy),
}));

// Diagram Shared Projects table
const diagramSharedProjects = pgTable('diagram_shared_projects', {
  id: serial('id').primaryKey(),
  projectId: integer('project_id').references(() => diagramProjects.id, { onDelete: 'cascade' }).notNull(),
  sharedWithUserId: integer('shared_with_user_id').references(() => users.id, { onDelete: 'cascade' }),
  sharedWithRole: varchar('shared_with_role', { length: 100 }), // Role name if shared with role
  permission: sharePermissionEnum('permission').default('view').notNull(),
  canReshare: boolean('can_reshare').default(false),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  sharedBy: integer('shared_by').references(() => users.id).notNull(),
  sharedAt: timestamp('shared_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  projectUserUnique: unique('unique_project_user_share').on(table.projectId, table.sharedWithUserId),
  projectRoleUnique: unique('unique_project_role_share').on(table.projectId, table.sharedWithRole),
  projectIdIdx: index('idx_diagram_shared_projects_project_id').on(table.projectId),
  sharedWithUserIdx: index('idx_diagram_shared_projects_shared_with_user').on(table.sharedWithUserId),
  sharedWithRoleIdx: index('idx_diagram_shared_projects_shared_with_role').on(table.sharedWithRole),
  permissionIdx: index('idx_diagram_shared_projects_permission').on(table.permission),
  expiresAtIdx: index('idx_diagram_shared_projects_expires_at').on(table.expiresAt),
}));

// Diagram Versions table
const diagramVersions = pgTable('diagram_versions', {
  id: serial('id').primaryKey(),
  diagramId: integer('diagram_id').references(() => diagrams.id, { onDelete: 'cascade' }).notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  versionName: varchar('version_name', { length: 255 }),
  description: text('description'),
  content: jsonb('content').notNull(),
  changeLog: text('change_log'),
  isActive: boolean('is_active').default(false),
  isMajor: boolean('is_major').default(false),
  parentVersionId: integer('parent_version_id').references(() => diagramVersions.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  diagramVersionUnique: unique('unique_diagram_version').on(table.diagramId, table.version),
  diagramIdIdx: index('idx_diagram_versions_diagram_id').on(table.diagramId),
  versionIdx: index('idx_diagram_versions_version').on(table.version),
  activeIdx: index('idx_diagram_versions_active').on(table.isActive),
  majorIdx: index('idx_diagram_versions_major').on(table.isMajor),
  parentVersionIdx: index('idx_diagram_versions_parent_version').on(table.parentVersionId),
  createdAtIdx: index('idx_diagram_versions_created_at').on(table.createdAt),
}));

// Diagram Node Library table
const diagramNodeLibrary = pgTable('diagram_node_library', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  type: varchar('type', { length: 50 }).notNull(),
  nodeData: jsonb('node_data').notNull(), // Node configuration and properties
  icon: varchar('icon', { length: 500 }), // Icon URL or SVG data
  defaultProperties: jsonb('default_properties').default('{}'),
  customProperties: jsonb('custom_properties').default('{}'),
  isPublic: boolean('is_public').default(true),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0),
  tags: text('tags').array(),
  version: varchar('version', { length: 20 }).default('1.0'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_diagram_node_library_name').on(table.name),
  categoryIdx: index('idx_diagram_node_library_category').on(table.category),
  typeIdx: index('idx_diagram_node_library_type').on(table.type),
  publicIdx: index('idx_diagram_node_library_public').on(table.isPublic),
  activeIdx: index('idx_diagram_node_library_active').on(table.isActive),
  usageCountIdx: index('idx_diagram_node_library_usage_count').on(table.usageCount),
  tagsIdx: index('idx_diagram_node_library_tags').on(table.tags),
}));

// Digital Signatures table
const digitalSignatures = pgTable('digital_signatures', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // 'diagram', 'document', 'policy', etc.
  entityId: integer('entity_id').notNull(),
  signerId: integer('signer_id').references(() => users.id).notNull(),
  signerRole: varchar('signer_role', { length: 100 }),
  signatureType: varchar('signature_type', { length: 50 }).notNull(), // 'approval', 'review', 'acknowledgment'
  status: signatureStatusEnum('status').default('pending').notNull(),
  signatureData: text('signature_data'), // Encrypted signature data
  certificateId: varchar('certificate_id', { length: 255 }),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  metadata: jsonb('metadata').default('{}'),
  requestedBy: integer('requested_by').references(() => users.id),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  entitySignerUnique: unique('unique_entity_signer_signature').on(table.entityType, table.entityId, table.signerId, table.signatureType),
  entityIdx: index('idx_digital_signatures_entity').on(table.entityType, table.entityId),
  signerIdx: index('idx_digital_signatures_signer').on(table.signerId),
  statusIdx: index('idx_digital_signatures_status').on(table.status),
  signatureTypeIdx: index('idx_digital_signatures_signature_type').on(table.signatureType),
  signedAtIdx: index('idx_digital_signatures_signed_at').on(table.signedAt),
  expiresAtIdx: index('idx_digital_signatures_expires_at').on(table.expiresAt),
  requestedByIdx: index('idx_digital_signatures_requested_by').on(table.requestedBy),
}));

module.exports = {
  diagrams,
  diagramTemplates,
  diagramProjects,
  diagramSharedProjects,
  diagramVersions,
  diagramNodeLibrary,
  digitalSignatures,
  // Export enums
  diagramStatusEnum,
  sharePermissionEnum,
  signatureStatusEnum,
};
