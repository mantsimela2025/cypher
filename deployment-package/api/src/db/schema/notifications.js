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

// Define enums for notification tables
const notificationTypeEnum = pgEnum('enum_notification_type', [
  'info',
  'success',
  'warning',
  'error',
  'alert',
  'reminder',
  'system',
  'security'
]);

const channelTypeEnum = pgEnum('enum_notification_channel_type', [
  'email',
  'sms',
  'push',
  'webhook',
  'slack',
  'teams',
  'discord',
  'in_app'
]);

const deliveryStatusEnum = pgEnum('enum_notification_delivery_status', [
  'pending',
  'sent',
  'delivered',
  'failed',
  'bounced',
  'cancelled'
]);

const templateFormatEnum = pgEnum('enum_notification_template_format', [
  'html',
  'text',
  'markdown',
  'json'
]);

// Notifications table - basic notifications
const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').default('info').notNull(),
  read: boolean('read').default(false).notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  module: varchar('module', { length: 50 }),
  eventType: varchar('event_type', { length: 50 }),
  relatedId: integer('related_id'),
  relatedType: varchar('related_type', { length: 50 }),
  metadata: jsonb('metadata').default('{}'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  priority: integer('priority').default(1), // 1=low, 2=medium, 3=high, 4=urgent
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    userIdIdx: index('notifications_user_id').on(table.userId),
    typeIdx: index('notifications_type').on(table.type),
    readIdx: index('notifications_read').on(table.read),
    moduleIdx: index('notifications_module').on(table.module),
    eventTypeIdx: index('notifications_event_type').on(table.eventType),
    priorityIdx: index('notifications_priority').on(table.priority),
    createdAtIdx: index('notifications_created_at').on(table.createdAt),
    expiresAtIdx: index('notifications_expires_at').on(table.expiresAt),
    relatedIdx: index('notifications_related').on(table.relatedId, table.relatedType),
    // Composite indexes
    userReadIdx: index('notifications_user_read').on(table.userId, table.read),
    userTypeIdx: index('notifications_user_type').on(table.userId, table.type),
    moduleEventIdx: index('notifications_module_event').on(table.module, table.eventType),
    userModuleIdx: index('notifications_user_module').on(table.userId, table.module),
    priorityCreatedIdx: index('notifications_priority_created').on(table.priority, table.createdAt)
  };
});

// Notification Channels table - defines delivery channels
const notificationChannels = pgTable('notification_channels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  channelType: channelTypeEnum('channel_type').notNull(),
  config: jsonb('config').default('{}').notNull(),
  isActive: boolean('is_active').default(true),
  description: text('description'),
  rateLimitPerMinute: integer('rate_limit_per_minute').default(60),
  rateLimitPerHour: integer('rate_limit_per_hour').default(1000),
  retryAttempts: integer('retry_attempts').default(3),
  retryDelay: integer('retry_delay').default(300), // seconds
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    nameIdx: index('notification_channels_name').on(table.name),
    channelTypeIdx: index('notification_channels_type').on(table.channelType),
    activeIdx: index('notification_channels_active').on(table.isActive),
    createdByIdx: index('notification_channels_created_by').on(table.createdBy),
    // Composite indexes
    typeActiveIdx: index('notification_channels_type_active').on(table.channelType, table.isActive),
    nameUnique: unique('notification_channels_name_unique').on(table.name)
  };
});

// Notification Templates table - message templates
const notificationTemplates = pgTable('notification_templates', {
  id: serial('id').primaryKey(),
  module: varchar('module', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  format: templateFormatEnum('format').default('html'),
  isActive: boolean('is_active').default(true),
  variables: jsonb('variables').default('[]'), // Array of variable names
  conditions: jsonb('conditions').default('{}'), // Conditional logic
  version: integer('version').default(1),
  parentId: integer('parent_id').references(() => notificationTemplates.id),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    moduleIdx: index('notification_templates_module').on(table.module),
    eventTypeIdx: index('notification_templates_event_type').on(table.eventType),
    nameIdx: index('notification_templates_name').on(table.name),
    activeIdx: index('notification_templates_active').on(table.isActive),
    versionIdx: index('notification_templates_version').on(table.version),
    parentIdIdx: index('notification_templates_parent_id').on(table.parentId),
    createdByIdx: index('notification_templates_created_by').on(table.createdBy),
    // Composite indexes
    moduleEventIdx: index('notification_templates_module_event').on(table.module, table.eventType),
    moduleActiveIdx: index('notification_templates_module_active').on(table.module, table.isActive),
    eventActiveIdx: index('notification_templates_event_active').on(table.eventType, table.isActive),
    // Unique constraint for module + event_type + version
    moduleEventVersionUnique: unique('notification_templates_module_event_version_unique').on(table.module, table.eventType, table.version)
  };
});

// Notification Subscriptions table - user preferences
const notificationSubscriptions = pgTable('notification_subscriptions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  module: varchar('module', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  channelId: integer('channel_id').notNull().references(() => notificationChannels.id, { onDelete: 'cascade' }),
  isActive: boolean('is_active').default(true),
  preferences: jsonb('preferences').default('{}'), // User-specific preferences
  frequency: varchar('frequency', { length: 20 }).default('immediate'), // immediate, hourly, daily, weekly
  quietHours: jsonb('quiet_hours').default('{}'), // Time ranges when not to send
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    userIdIdx: index('notification_subscriptions_user_id').on(table.userId),
    moduleIdx: index('notification_subscriptions_module').on(table.module),
    eventTypeIdx: index('notification_subscriptions_event_type').on(table.eventType),
    channelIdIdx: index('notification_subscriptions_channel_id').on(table.channelId),
    activeIdx: index('notification_subscriptions_active').on(table.isActive),
    frequencyIdx: index('notification_subscriptions_frequency').on(table.frequency),
    // Composite indexes
    userModuleIdx: index('notification_subscriptions_user_module').on(table.userId, table.module),
    userEventIdx: index('notification_subscriptions_user_event').on(table.userId, table.eventType),
    userChannelIdx: index('notification_subscriptions_user_channel').on(table.userId, table.channelId),
    moduleEventIdx: index('notification_subscriptions_module_event').on(table.module, table.eventType),
    userActiveIdx: index('notification_subscriptions_user_active').on(table.userId, table.isActive),
    // Unique constraint to prevent duplicate subscriptions
    userModuleEventChannelUnique: unique('notification_subscriptions_user_module_event_channel_unique').on(table.userId, table.module, table.eventType, table.channelId)
  };
});

// Notification Deliveries table - delivery tracking
const notificationDeliveries = pgTable('notification_deliveries', {
  id: serial('id').primaryKey(),
  notificationId: integer('notification_id').references(() => notifications.id, { onDelete: 'cascade' }),
  channelId: integer('channel_id').notNull().references(() => notificationChannels.id),
  templateId: integer('template_id').references(() => notificationTemplates.id),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  recipient: jsonb('recipient').default('{}').notNull(),
  content: jsonb('content').default('{}').notNull(),
  status: deliveryStatusEnum('status').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  errorCode: varchar('error_code', { length: 50 }),
  retryCount: integer('retry_count').default(0),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  metadata: jsonb('metadata').default('{}'),
  externalId: varchar('external_id', { length: 255 }), // ID from external service
  cost: integer('cost').default(0), // Cost in cents/smallest currency unit
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    notificationIdIdx: index('notification_deliveries_notification_id').on(table.notificationId),
    channelIdIdx: index('notification_deliveries_channel_id').on(table.channelId),
    templateIdIdx: index('notification_deliveries_template_id').on(table.templateId),
    eventTypeIdx: index('notification_deliveries_event_type').on(table.eventType),
    statusIdx: index('notification_deliveries_status').on(table.status),
    sentAtIdx: index('notification_deliveries_sent_at').on(table.sentAt),
    deliveredAtIdx: index('notification_deliveries_delivered_at').on(table.deliveredAt),
    failedAtIdx: index('notification_deliveries_failed_at').on(table.failedAt),
    retryCountIdx: index('notification_deliveries_retry_count').on(table.retryCount),
    nextRetryAtIdx: index('notification_deliveries_next_retry_at').on(table.nextRetryAt),
    externalIdIdx: index('notification_deliveries_external_id').on(table.externalId),
    createdAtIdx: index('notification_deliveries_created_at').on(table.createdAt),
    // Composite indexes
    channelStatusIdx: index('notification_deliveries_channel_status').on(table.channelId, table.status),
    statusCreatedIdx: index('notification_deliveries_status_created').on(table.status, table.createdAt),
    eventStatusIdx: index('notification_deliveries_event_status').on(table.eventType, table.status),
    retryStatusIdx: index('notification_deliveries_retry_status').on(table.retryCount, table.status),
    channelEventIdx: index('notification_deliveries_channel_event').on(table.channelId, table.eventType)
  };
});

module.exports = {
  notifications,
  notificationChannels,
  notificationTemplates,
  notificationSubscriptions,
  notificationDeliveries,
  notificationTypeEnum,
  channelTypeEnum,
  deliveryStatusEnum,
  templateFormatEnum
};
