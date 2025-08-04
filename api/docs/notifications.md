# Notification System

Comprehensive guide to the Notification system implemented in the RAS Dashboard API, providing multi-channel delivery, template management, and advanced analytics for complete notification lifecycle management.

## 🎯 Overview

The Notification system provides:
- **Multi-Channel Delivery** - Email, SMS, push, webhook, Slack, Teams, Discord, in-app
- **Template System** - Variable substitution with conditional logic
- **Priority Management** - 4-level priority system with urgency handling
- **Real-time Analytics** - Comprehensive notification statistics and reporting
- **User Preferences** - Subscription management and quiet hours
- **Delivery Tracking** - Complete delivery status and error tracking

## 🏗️ Database Schema

### Core Tables
```sql
-- Notifications: Core notification records
notifications (id, user_id, title, message, type, read, read_at, module, 
               event_type, related_id, related_type, metadata, expires_at, 
               priority, created_at, updated_at)

-- Notification Channels: Multi-channel delivery configuration
notification_channels (id, name, channel_type, config, is_active, description,
                      rate_limit_per_minute, rate_limit_per_hour, retry_attempts,
                      retry_delay, created_by, created_at, updated_at)

-- Notification Templates: Template-based message system
notification_templates (id, module, event_type, name, subject, body, format,
                       is_active, variables, conditions, version, parent_id,
                       created_by, created_at, updated_at)

-- Notification Subscriptions: User preference management
notification_subscriptions (id, user_id, module, event_type, channel_id,
                           is_active, preferences, frequency, quiet_hours,
                           created_at, updated_at)

-- Notification Deliveries: Delivery tracking and analytics
notification_deliveries (id, notification_id, channel_id, template_id, event_type,
                        recipient, content, status, sent_at, delivered_at, failed_at,
                        error_message, error_code, retry_count, next_retry_at,
                        metadata, external_id, cost, created_at, updated_at)
```

### Relationships
```
Users ←→ Notifications (user_id)
Users ←→ NotificationSubscriptions (user_id)
NotificationChannels ←→ NotificationSubscriptions (channel_id)
NotificationChannels ←→ NotificationDeliveries (channel_id)
NotificationTemplates ←→ NotificationDeliveries (template_id)
Notifications ←→ NotificationDeliveries (notification_id)
```

## 📢 Notification Types

### Core Types
```javascript
const NOTIFICATION_TYPES = [
  'info',      // General information and updates
  'success',   // Success confirmations and completions
  'warning',   // Warning messages and alerts
  'error',     // Error notifications and failures
  'alert',     // Important alerts requiring attention
  'reminder',  // Reminders and scheduled notifications
  'system',    // System-related notifications
  'security'   // Security alerts and notifications
];
```

### Priority Levels
```javascript
const PRIORITY_LEVELS = {
  1: 'low',      // Low priority, can be batched
  2: 'medium',   // Normal priority, standard delivery
  3: 'high',     // High priority, expedited delivery
  4: 'urgent'    // Urgent, immediate delivery required
};
```

### Notification Structure
```javascript
const notification = {
  userId: 123,
  title: 'Security Alert: Suspicious Login Detected',
  message: 'A suspicious login attempt was detected on your account.',
  type: 'security',
  module: 'security',
  eventType: 'login_attempt',
  relatedId: 12345,
  relatedType: 'login_attempt',
  metadata: {
    ip_address: '192.168.1.100',
    location: 'New York, NY',
    device: 'Chrome on Windows 10',
    risk_score: 85
  },
  priority: 3, // High priority
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
};
```

## 📡 Channel System

### Channel Types
```javascript
const CHANNEL_TYPES = [
  'email',    // SMTP-based email notifications
  'sms',      // SMS gateway integration
  'push',     // Push notifications for mobile/web
  'webhook',  // HTTP webhook notifications
  'slack',    // Slack channel notifications
  'teams',    // Microsoft Teams notifications
  'discord',  // Discord server notifications
  'in_app'    // In-application notifications
];
```

### Channel Configuration
```javascript
// Email channel example
const emailChannel = {
  name: 'Email Security Alerts',
  channelType: 'email',
  config: {
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: 'alerts@company.com',
    smtp_secure: true,
    from_name: 'Security Team',
    from_email: 'security@company.com'
  },
  rateLimitPerMinute: 30,
  rateLimitPerHour: 500,
  retryAttempts: 3,
  retryDelay: 300,
  isActive: true
};

// Slack channel example
const slackChannel = {
  name: 'Slack Security Channel',
  channelType: 'slack',
  config: {
    webhook_url: 'https://hooks.slack.com/services/...',
    channel: '#security-alerts',
    username: 'SecurityBot',
    icon_emoji: ':warning:'
  },
  rateLimitPerMinute: 60,
  rateLimitPerHour: 1000,
  retryAttempts: 2,
  retryDelay: 180
};
```

### Rate Limiting
```javascript
// Channel rate limiting configuration
const rateLimits = {
  email: {
    perMinute: 30,   // 30 emails per minute
    perHour: 500,    // 500 emails per hour
    burstLimit: 10   // Allow 10 immediate sends
  },
  sms: {
    perMinute: 10,   // 10 SMS per minute
    perHour: 100,    // 100 SMS per hour
    burstLimit: 3    // Allow 3 immediate sends
  }
};
```

## 📝 Template System

### Template Formats
```javascript
const TEMPLATE_FORMATS = [
  'html',      // Rich HTML templates with styling
  'text',      // Plain text templates
  'markdown',  // Markdown format templates
  'json'       // Structured JSON templates
];
```

### Template Structure
```javascript
const template = {
  module: 'security',
  eventType: 'login_attempt',
  name: 'Security Alert - Suspicious Login',
  subject: 'Security Alert: Suspicious login attempt detected',
  body: `
    <html>
    <body>
      <h2>Security Alert</h2>
      <p>Hello {{user_name}},</p>
      <p>We detected a suspicious login attempt on your account:</p>
      <ul>
        <li><strong>Time:</strong> {{timestamp}}</li>
        <li><strong>IP Address:</strong> {{ip_address}}</li>
        <li><strong>Location:</strong> {{location}}</li>
        <li><strong>Device:</strong> {{device}}</li>
      </ul>
      <p>If this was not you, please contact security immediately.</p>
    </body>
    </html>
  `,
  format: 'html',
  variables: ['user_name', 'timestamp', 'ip_address', 'location', 'device'],
  conditions: {
    priority: 'high',
    send_immediately: true
  },
  version: 1,
  isActive: true
};
```

### Variable Substitution
```javascript
// Template variables are replaced with actual values
const variables = {
  user_name: 'John Doe',
  timestamp: '2024-01-15 14:30:00',
  ip_address: '192.168.1.100',
  location: 'New York, NY',
  device: 'Chrome on Windows 10'
};

// Result: "Hello John Doe, we detected..."
```

### Conditional Logic
```javascript
// Templates can include conditional logic
const conditionalTemplate = {
  body: `
    {{#if high_priority}}
      <div style="color: red; font-weight: bold;">URGENT</div>
    {{/if}}
    
    <p>{{message}}</p>
    
    {{#if show_details}}
      <ul>
        {{#each details}}
          <li>{{this}}</li>
        {{/each}}
      </ul>
    {{/if}}
  `,
  conditions: {
    high_priority: '{{priority}} >= 3',
    show_details: '{{user_role}} === "admin"'
  }
};
```

## 👤 User Preferences

### Subscription Management
```javascript
const subscription = {
  userId: 123,
  module: 'security',
  eventType: 'login_attempt',
  channelId: 1, // Email channel
  isActive: true,
  preferences: {
    digest: false,        // Send individual notifications
    priority_filter: 2,   // Only medium priority and above
    keywords: ['critical', 'urgent']
  },
  frequency: 'immediate', // immediate, hourly, daily, weekly
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'America/New_York'
  }
};
```

### Frequency Options
```javascript
const FREQUENCY_OPTIONS = [
  'immediate',  // Send immediately
  'hourly',     // Batch and send hourly
  'daily',      // Daily digest
  'weekly'      // Weekly summary
];
```

## 📊 Delivery Tracking

### Delivery Status
```javascript
const DELIVERY_STATUSES = [
  'pending',    // Queued for delivery
  'sent',       // Sent to channel
  'delivered',  // Confirmed delivery
  'failed',     // Delivery failed
  'bounced',    // Message bounced
  'cancelled'   // Delivery cancelled
];
```

### Delivery Record
```javascript
const delivery = {
  notificationId: 456,
  channelId: 1,
  templateId: 789,
  eventType: 'login_attempt',
  recipient: {
    email: 'user@example.com',
    name: 'John Doe'
  },
  content: {
    subject: 'Security Alert',
    body: 'Rendered template content...',
    format: 'html'
  },
  status: 'delivered',
  sentAt: '2024-01-15T14:30:00Z',
  deliveredAt: '2024-01-15T14:30:05Z',
  retryCount: 0,
  cost: 5, // Cost in cents
  metadata: {
    messageId: 'msg_123456',
    provider: 'sendgrid'
  }
};
```

## 🚀 API Endpoints

### Core Notifications
```javascript
// Basic notification operations
POST   /api/v1/notifications                    // Create notification
GET    /api/v1/notifications                    // Get user notifications
PATCH  /api/v1/notifications/:id/read          // Mark as read
PATCH  /api/v1/notifications/read-all          // Mark all as read
DELETE /api/v1/notifications/:id               // Delete notification
GET    /api/v1/notifications/stats             // Get statistics
```

### Notification Channels
```javascript
// Channel management (admin only)
POST   /api/v1/notifications/channels          // Create channel
GET    /api/v1/notifications/channels          // Get all channels
PUT    /api/v1/notifications/channels/:id      // Update channel
DELETE /api/v1/notifications/channels/:id      // Delete channel
```

### Notification Templates
```javascript
// Template management (admin only)
POST   /api/v1/notifications/templates         // Create template
GET    /api/v1/notifications/templates         // Get all templates
GET    /api/v1/notifications/templates/:module/:event  // Get by module/event
PUT    /api/v1/notifications/templates/:id     // Update template
DELETE /api/v1/notifications/templates/:id     // Delete template
```

## 🛠️ Usage Examples

### Creating a Notification
```javascript
const notificationData = {
  userId: 123,
  title: 'System Maintenance Scheduled',
  message: 'System maintenance is scheduled for tonight from 2:00 AM to 4:00 AM EST.',
  type: 'system',
  module: 'system',
  eventType: 'maintenance',
  priority: 2,
  metadata: {
    maintenance_window: '2024-01-16 02:00:00 - 2024-01-16 04:00:00',
    affected_services: ['dashboard', 'api', 'reports']
  }
};

const notification = await notificationService.createNotification(notificationData);
```

### Setting Up a Channel
```javascript
const channelData = {
  name: 'Emergency SMS Alerts',
  channelType: 'sms',
  config: {
    provider: 'twilio',
    account_sid: 'AC123...',
    auth_token: 'token123...',
    from_number: '+1234567890'
  },
  rateLimitPerMinute: 10,
  rateLimitPerHour: 100,
  retryAttempts: 3,
  retryDelay: 300,
  isActive: true
};

const channel = await notificationService.createChannel(channelData, adminUserId);
```

### Creating a Template
```javascript
const templateData = {
  module: 'system',
  eventType: 'maintenance',
  name: 'System Maintenance Notification',
  subject: 'Scheduled Maintenance: {{service_name}}',
  body: `
    <h2>Scheduled Maintenance Notice</h2>
    <p>Dear {{user_name}},</p>
    <p>We will be performing scheduled maintenance on {{service_name}}:</p>
    <ul>
      <li><strong>Start:</strong> {{start_time}}</li>
      <li><strong>End:</strong> {{end_time}}</li>
      <li><strong>Duration:</strong> {{duration}}</li>
    </ul>
    <p>During this time, the following services may be unavailable:</p>
    <ul>
      {{#each affected_services}}
        <li>{{this}}</li>
      {{/each}}
    </ul>
    <p>We apologize for any inconvenience.</p>
  `,
  format: 'html',
  variables: ['user_name', 'service_name', 'start_time', 'end_time', 'duration', 'affected_services'],
  isActive: true
};

const template = await notificationService.createTemplate(templateData, adminUserId);
```

### Managing User Preferences
```javascript
// Get user notifications with filtering
const notifications = await notificationService.getUserNotifications(userId, {
  type: 'security',
  read: false,
  priority: 3,
  startDate: '2024-01-01',
  endDate: '2024-01-31'
}, {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Mark notifications as read
await notificationService.markAsRead(notificationId, userId);

// Mark all security notifications as read
await notificationService.markAllAsRead(userId, { type: 'security' });
```

### Getting Analytics
```javascript
// Get notification statistics
const stats = await notificationService.getUserNotificationStats(userId);

console.log('Notification Statistics:');
console.log(`Total: ${stats.overview.total}`);
console.log(`Unread: ${stats.overview.unread}`);
console.log(`High Priority: ${stats.overview.highPriority}`);

// Statistics by type
stats.byType.forEach(type => {
  console.log(`${type.type}: ${type.count} (${type.unreadCount} unread)`);
});

// Statistics by module
stats.byModule.forEach(module => {
  console.log(`${module.module}: ${module.count} (${module.unreadCount} unread)`);
});
```
