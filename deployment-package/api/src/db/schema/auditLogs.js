const { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  pgEnum,
  jsonb,
  boolean,
  index,
  unique
} = require('drizzle-orm/pg-core');
const { users } = require('./users');

// Define enums for audit_logs table
const auditLogsActionEnum = pgEnum('enum_audit_logs_action', [
  'create',
  'read',
  'update',
  'delete',
  'login',
  'logout',
  'access',
  'export',
  'import',
  'approve',
  'reject',
  'submit',
  'revoke',
  'upload',
  'download',
  'search',
  'view',
  'modify',
  'execute',
  'configure',
  'backup',
  'restore',
  'sync',
  'migrate',
  'deploy',
  'rollback'
]);

const auditLogsLevelEnum = pgEnum('enum_audit_logs_level', [
  'debug',
  'info',
  'warn',
  'error',
  'critical'
]);

// Audit Logs table
const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: auditLogsActionEnum('action').notNull(),
  resourceType: varchar('resource_type', { length: 255 }).notNull(),
  resourceId: varchar('resource_id', { length: 255 }),
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 255 }),
  userAgent: text('user_agent'),
  level: auditLogsLevelEnum('level').default('info').notNull(),
  oldValues: jsonb('old_values').default('{}'),
  newValues: jsonb('new_values').default('{}'),
  metadata: jsonb('metadata').default('{}'),
  sessionId: varchar('session_id', { length: 255 }),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  duration: integer('duration'), // Duration in milliseconds
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    // Indexes for performance optimization
    userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    resourceTypeIdx: index('idx_audit_logs_resource_type').on(table.resourceType),
    resourceIdIdx: index('idx_audit_logs_resource_id').on(table.resourceId),
    levelIdx: index('idx_audit_logs_level').on(table.level),
    ipAddressIdx: index('idx_audit_logs_ip_address').on(table.ipAddress),
    sessionIdIdx: index('idx_audit_logs_session_id').on(table.sessionId),
    successIdx: index('idx_audit_logs_success').on(table.success),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
    updatedAtIdx: index('idx_audit_logs_updated_at').on(table.updatedAt),
    
    // Composite indexes for common query patterns
    userActionIdx: index('idx_audit_logs_user_action').on(table.userId, table.action),
    resourceTypeActionIdx: index('idx_audit_logs_resource_type_action').on(table.resourceType, table.action),
    resourceTypeIdIdx: index('idx_audit_logs_resource_type_id').on(table.resourceType, table.resourceId),
    userCreatedIdx: index('idx_audit_logs_user_created').on(table.userId, table.createdAt),
    actionCreatedIdx: index('idx_audit_logs_action_created').on(table.action, table.createdAt),
    levelCreatedIdx: index('idx_audit_logs_level_created').on(table.level, table.createdAt),
    successCreatedIdx: index('idx_audit_logs_success_created').on(table.success, table.createdAt),
    
    // Time-based partitioning support indexes
    createdAtYearIdx: index('idx_audit_logs_created_at_year').on(table.createdAt),
    createdAtMonthIdx: index('idx_audit_logs_created_at_month').on(table.createdAt),
    
    // Security and compliance indexes
    ipSessionIdx: index('idx_audit_logs_ip_session').on(table.ipAddress, table.sessionId),
    userSessionIdx: index('idx_audit_logs_user_session').on(table.userId, table.sessionId),
    errorLevelIdx: index('idx_audit_logs_error_level').on(table.success, table.level),
    
    // Resource tracking indexes
    resourceActionTimeIdx: index('idx_audit_logs_resource_action_time').on(table.resourceType, table.action, table.createdAt),
    userResourceIdx: index('idx_audit_logs_user_resource').on(table.userId, table.resourceType),
    
    // Performance monitoring indexes
    durationIdx: index('idx_audit_logs_duration').on(table.duration),
    actionDurationIdx: index('idx_audit_logs_action_duration').on(table.action, table.duration)
  };
});

module.exports = {
  auditLogs,
  auditLogsActionEnum,
  auditLogsLevelEnum
};
