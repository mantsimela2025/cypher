const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Enums for organization tools
const taskStatusEnum = pgEnum('enum_task_status', ['pending', 'in_progress', 'completed', 'cancelled', 'on_hold']);
const taskPriorityEnum = pgEnum('enum_task_priority', ['low', 'medium', 'high', 'urgent']);
const fieldTypeEnum = pgEnum('enum_field_type', ['text', 'number', 'boolean', 'date', 'datetime', 'select', 'multiselect', 'json']);

// Tags table - for tagging various entities
const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color code
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_tags_name').on(table.name),
  slugIdx: index('idx_tags_slug').on(table.slug),
  categoryIdx: index('idx_tags_category').on(table.category),
  activeIdx: index('idx_tags_active').on(table.isActive),
  usageIdx: index('idx_tags_usage').on(table.usageCount),
}));

// Tasks table - for task management and workflows
const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('pending').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  category: varchar('category', { length: 100 }),
  assignedTo: integer('assigned_to').references(() => users.id),
  createdBy: integer('created_by').references(() => users.id).notNull(),
  parentTaskId: integer('parent_task_id').references(() => tasks.id),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  completionPercentage: integer('completion_percentage').default(0),
  dueDate: timestamp('due_date', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
  tags: text('tags').array(), // Array of tag names
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  titleIdx: index('idx_tasks_title').on(table.title),
  statusIdx: index('idx_tasks_status').on(table.status),
  priorityIdx: index('idx_tasks_priority').on(table.priority),
  assignedIdx: index('idx_tasks_assigned').on(table.assignedTo),
  createdByIdx: index('idx_tasks_created_by').on(table.createdBy),
  dueDateIdx: index('idx_tasks_due_date').on(table.dueDate),
  categoryIdx: index('idx_tasks_category').on(table.category),
  parentIdx: index('idx_tasks_parent').on(table.parentTaskId),
  completionIdx: index('idx_tasks_completion').on(table.completionPercentage),
}));

// Saved Filters table - for saving user-defined filters
const savedFilters = pgTable('saved_filters', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // What entity this filter applies to
  filterDefinition: jsonb('filter_definition').notNull(),
  isPublic: boolean('is_public').default(false),
  isDefault: boolean('is_default').default(false),
  usageCount: integer('usage_count').default(0),
  tags: text('tags').array(),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_saved_filters_name').on(table.name),
  entityTypeIdx: index('idx_saved_filters_entity_type').on(table.entityType),
  publicIdx: index('idx_saved_filters_public').on(table.isPublic),
  defaultIdx: index('idx_saved_filters_default').on(table.isDefault),
  createdByIdx: index('idx_saved_filters_created_by').on(table.createdBy),
  usageIdx: index('idx_saved_filters_usage').on(table.usageCount),
}));

// Custom Fields table - for dynamic field definitions
const customFields = pgTable('custom_fields', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  description: text('description'),
  fieldType: fieldTypeEnum('field_type').notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(), // What entity this field applies to
  isRequired: boolean('is_required').default(false),
  isActive: boolean('is_active').default(true),
  defaultValue: text('default_value'),
  validationRules: jsonb('validation_rules').default('{}'),
  options: jsonb('options').default('{}'), // For select/multiselect fields
  sortOrder: integer('sort_order').default(0),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameEntityUnique: unique('unique_custom_field_name_entity').on(table.name, table.entityType),
  nameIdx: index('idx_custom_fields_name').on(table.name),
  entityTypeIdx: index('idx_custom_fields_entity_type').on(table.entityType),
  fieldTypeIdx: index('idx_custom_fields_field_type').on(table.fieldType),
  activeIdx: index('idx_custom_fields_active').on(table.isActive),
  sortOrderIdx: index('idx_custom_fields_sort_order').on(table.sortOrder),
}));

// Custom Field Values table - for storing actual field values
const customFieldValues = pgTable('custom_field_values', {
  id: serial('id').primaryKey(),
  fieldId: integer('field_id').references(() => customFields.id, { onDelete: 'cascade' }).notNull(),
  entityId: integer('entity_id').notNull(), // ID of the entity this value belongs to
  entityType: varchar('entity_type', { length: 100 }).notNull(), // Type of entity
  value: text('value'), // Stored as text, parsed based on field type
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fieldEntityUnique: unique('unique_field_entity_value').on(table.fieldId, table.entityId, table.entityType),
  fieldIdIdx: index('idx_custom_field_values_field_id').on(table.fieldId),
  entityIdx: index('idx_custom_field_values_entity').on(table.entityId, table.entityType),
  entityTypeIdx: index('idx_custom_field_values_entity_type').on(table.entityType),
}));

// Entity Synonyms table - for alternative names/aliases
const entitySynonyms = pgTable('entity_synonyms', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  synonym: varchar('synonym', { length: 255 }).notNull(),
  isPreferred: boolean('is_preferred').default(false),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  synonymIdx: index('idx_entity_synonyms_synonym').on(table.synonym),
  entityIdx: index('idx_entity_synonyms_entity').on(table.entityType, table.entityId),
  entityTypeIdx: index('idx_entity_synonyms_entity_type').on(table.entityType),
  preferredIdx: index('idx_entity_synonyms_preferred').on(table.isPreferred),
}));

// Entity Tags table - for linking tags to entities
const entityTags = pgTable('entity_tags', {
  id: serial('id').primaryKey(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: integer('entity_id').notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tagEntityUnique: unique('unique_tag_entity').on(table.tagId, table.entityType, table.entityId),
  tagIdIdx: index('idx_entity_tags_tag_id').on(table.tagId),
  entityIdx: index('idx_entity_tags_entity').on(table.entityType, table.entityId),
  entityTypeIdx: index('idx_entity_tags_entity_type').on(table.entityType),
}));

module.exports = {
  tags,
  tasks,
  savedFilters,
  customFields,
  customFieldValues,
  entitySynonyms,
  entityTags,
  // Export enums
  taskStatusEnum,
  taskPriorityEnum,
  fieldTypeEnum,
};
