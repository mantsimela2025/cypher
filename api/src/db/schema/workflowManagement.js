const { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb, uuid, pgEnum, index, unique } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');
const { users } = require('./users');

// Enums for workflow management
const workflowStatusEnum = pgEnum('enum_workflow_status', ['draft', 'active', 'inactive', 'archived']);
const workflowInstanceStatusEnum = pgEnum('enum_workflow_instance_status', ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused']);
const workflowExecutionStatusEnum = pgEnum('enum_workflow_execution_status', ['pending', 'running', 'completed', 'failed', 'skipped', 'cancelled']);
const triggerTypeEnum = pgEnum('enum_trigger_type', ['manual', 'schedule', 'webhook', 'event', 'api']);

// Main Workflows table
const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  category: varchar('category', { length: 100 }),
  status: workflowStatusEnum('status').default('draft').notNull(),
  isActive: boolean('is_active').default(false),
  isTemplate: boolean('is_template').default(false),
  definition: jsonb('definition').notNull(), // Workflow definition JSON
  configuration: jsonb('configuration').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  tags: text('tags').array(),
  createdBy: integer('created_by').references(() => users.id),
  updatedBy: integer('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  nameIdx: index('idx_workflows_name').on(table.name),
  statusIdx: index('idx_workflows_status').on(table.status),
  categoryIdx: index('idx_workflows_category').on(table.category),
  activeIdx: index('idx_workflows_active').on(table.isActive),
  templateIdx: index('idx_workflows_template').on(table.isTemplate),
  createdByIdx: index('idx_workflows_created_by').on(table.createdBy),
}));

// Workflow Nodes table
const workflowNodes = pgTable('workflow_nodes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 100 }).notNull(),
  nodeType: varchar('node_type', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  position: jsonb('position').default('{}'), // x, y coordinates
  configuration: jsonb('configuration').default('{}'),
  inputSchema: jsonb('input_schema').default('{}'),
  outputSchema: jsonb('output_schema').default('{}'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workflowNodeUnique: unique('unique_workflow_node').on(table.workflowId, table.nodeId),
  workflowIdIdx: index('idx_workflow_nodes_workflow_id').on(table.workflowId),
  nodeTypeIdx: index('idx_workflow_nodes_node_type').on(table.nodeType),
  activeIdx: index('idx_workflow_nodes_active').on(table.isActive),
}));

// Workflow Edges table (connections between nodes)
const workflowEdges = pgTable('workflow_edges', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  edgeId: varchar('edge_id', { length: 100 }).notNull(),
  sourceNodeId: varchar('source_node_id', { length: 100 }).notNull(),
  targetNodeId: varchar('target_node_id', { length: 100 }).notNull(),
  sourcePort: varchar('source_port', { length: 50 }),
  targetPort: varchar('target_port', { length: 50 }),
  condition: jsonb('condition').default('{}'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workflowEdgeUnique: unique('unique_workflow_edge').on(table.workflowId, table.edgeId),
  workflowIdIdx: index('idx_workflow_edges_workflow_id').on(table.workflowId),
  sourceNodeIdx: index('idx_workflow_edges_source_node').on(table.sourceNodeId),
  targetNodeIdx: index('idx_workflow_edges_target_node').on(table.targetNodeId),
  activeIdx: index('idx_workflow_edges_active').on(table.isActive),
}));

// Workflow Instances table (execution instances)
const workflowInstances = pgTable('workflow_instances', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid('workflow_id').references(() => workflows.id),
  name: varchar('name', { length: 255 }),
  status: workflowInstanceStatusEnum('status').default('pending').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'),
  context: jsonb('context').default('{}'),
  input: jsonb('input').default('{}'),
  output: jsonb('output').default('{}'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // milliseconds
  triggeredBy: integer('triggered_by').references(() => users.id),
  parentInstanceId: uuid('parent_instance_id').references(() => workflowInstances.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workflowIdIdx: index('idx_workflow_instances_workflow_id').on(table.workflowId),
  statusIdx: index('idx_workflow_instances_status').on(table.status),
  priorityIdx: index('idx_workflow_instances_priority').on(table.priority),
  triggeredByIdx: index('idx_workflow_instances_triggered_by').on(table.triggeredBy),
  startedAtIdx: index('idx_workflow_instances_started_at').on(table.startedAt),
  parentIdx: index('idx_workflow_instances_parent').on(table.parentInstanceId),
}));

// Workflow Executions table (node execution details)
const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  instanceId: uuid('instance_id').references(() => workflowInstances.id, { onDelete: 'cascade' }),
  nodeId: varchar('node_id', { length: 100 }).notNull(),
  status: workflowExecutionStatusEnum('status').default('pending').notNull(),
  input: jsonb('input').default('{}'),
  output: jsonb('output').default('{}'),
  error: text('error'),
  logs: text('logs'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  duration: integer('duration'), // milliseconds
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  instanceIdIdx: index('idx_workflow_executions_instance_id').on(table.instanceId),
  nodeIdIdx: index('idx_workflow_executions_node_id').on(table.nodeId),
  statusIdx: index('idx_workflow_executions_status').on(table.status),
  startedAtIdx: index('idx_workflow_executions_started_at').on(table.startedAt),
  nextRetryIdx: index('idx_workflow_executions_next_retry').on(table.nextRetryAt),
  instanceNodeIdx: index('idx_workflow_executions_instance_node').on(table.instanceId, table.nodeId),
}));

// Workflow Triggers table
const workflowTriggers = pgTable('workflow_triggers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }),
  triggerType: triggerTypeEnum('trigger_type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  configuration: jsonb('configuration').default('{}'),
  isActive: boolean('is_active').default(true),
  lastTriggered: timestamp('last_triggered', { withTimezone: true }),
  triggerCount: integer('trigger_count').default(0),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  workflowIdIdx: index('idx_workflow_triggers_workflow_id').on(table.workflowId),
  triggerTypeIdx: index('idx_workflow_triggers_trigger_type').on(table.triggerType),
  activeIdx: index('idx_workflow_triggers_active').on(table.isActive),
  lastTriggeredIdx: index('idx_workflow_triggers_last_triggered').on(table.lastTriggered),
}));

module.exports = {
  workflows,
  workflowNodes,
  workflowEdges,
  workflowInstances,
  workflowExecutions,
  workflowTriggers,
  // Export enums
  workflowStatusEnum,
  workflowInstanceStatusEnum,
  workflowExecutionStatusEnum,
  triggerTypeEnum,
};
