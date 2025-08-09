# Email Management Requirements Documentation

## Overview

This document provides comprehensive requirements and specifications for the Email Management system within the RAS DASH platform, accessible at `/admin/email-management`. The system handles all email-related functionality including template management, email logging, SMTP configuration, and API provider management.

## System Architecture

### Core Components
- **Email Service Layer**: Handles email sending, template generation, and logging
- **Template Management**: CRUD operations for email templates with variable support  
- **Email Logging**: Comprehensive tracking of all email activities
- **Provider Configuration**: SMTP and API provider management
- **Admin Interface**: Web-based management dashboard

## Service Layer Requirements

### EmailService (server/services/emailService.ts)

#### Core Email Methods

**1. `sendEmail(options: EmailOptions): Promise<boolean>`**
- **Purpose**: Primary email sending method using MailerSend API
- **Parameters**:
  - `to`: string | string[] - Recipient email addresses
  - `subject`: string - Email subject line
  - `html`: string - HTML email content
  - `text?`: string - Plain text content (optional)
  - `from?`: string - Sender email address
  - `replyTo?`: string - Reply-to address
  - `attachments?`: any[] - File attachments
  - `categories?`: string[] - Email categorization tags
  - `category?`: string - Primary category
  - `relatedEntityType?`: string - Related entity type for tracking
  - `relatedEntityId?`: string - Related entity ID for tracking
- **Returns**: Boolean indicating success/failure
- **Requirements**:
  - Must log all email attempts to database
  - Support multiple recipients
  - Handle attachments up to configured size limits
  - Implement retry logic for failed sends
  - Support HTML and plain text content
  - Validate email addresses before sending

**2. `generateEmailTemplate(options: EmailTemplateOptions): string`**
- **Purpose**: Creates professional HTML email templates
- **Parameters**:
  - `title`: string - Email header title
  - `message`: string - Main email content
  - `callToAction?`: object - Optional CTA button
  - `disclaimer?`: string - Optional disclaimer text
  - `urgency?`: 'normal' | 'high' | 'critical' - Visual urgency level
  - `footer?`: string - Optional footer text
- **Requirements**:
  - Generate responsive HTML templates
  - Support urgency-based color schemes
  - Include professional styling and branding
  - Support call-to-action buttons
  - Implement mobile-responsive design
  - Strip HTML for plain text fallback

**3. `sendVulnerabilityAlert(recipients: string[], vulnerability: object): Promise<boolean>`**
- **Purpose**: Specialized vulnerability notification emails
- **Requirements**:
  - Auto-determine urgency based on severity
  - Include vulnerability details and dashboard links
  - Support severity-based visual styling
  - Track vulnerability-related email metrics

**4. `sendComplianceAlert(recipients: string[], compliance: object): Promise<boolean>`**
- **Purpose**: Compliance-related notification emails
- **Requirements**:
  - Include policy details and remediation steps
  - Support compliance framework context
  - Track compliance-related communications

**5. `sendSystemAlert(recipients: string[], alert: object): Promise<boolean>`**
- **Purpose**: General system alert notifications
- **Requirements**:
  - Configurable urgency and content
  - Support system status and maintenance alerts
  - Include system context and action items

**6. `logEmailAttempt(logData: object): Promise<void>` (Private)**
- **Purpose**: Records all email attempts to database
- **Parameters**:
  - `to`: string - Recipient addresses
  - `subject`: string - Email subject
  - `service`: string - Service provider used
  - `success`: boolean - Send success status
  - `response`: string - Service response message
  - `category`: string - Email category
  - `relatedEntityType?`: string - Related entity type
  - `relatedEntityId?`: string - Related entity ID
- **Requirements**:
  - Log all email attempts regardless of success
  - Include detailed error information for failures
  - Track timing and performance metrics
  - Support audit trail requirements

### EmailTemplatesStorage (server/emailTemplatesStorage.ts)

#### Template Management Methods

**1. `getEmailTemplates(type?, category?, search?, limit, offset): Promise<object>`**
- **Purpose**: Retrieves email templates with filtering and pagination
- **Parameters**:
  - `type?`: string - Template type filter
  - `category?`: string - Template category filter
  - `search?`: string - Text search across name, description, subject
  - `limit`: number - Results limit (default: 50)
  - `offset`: number - Results offset (default: 0)
- **Returns**: Object with templates array and total count
- **Requirements**:
  - Support advanced filtering capabilities
  - Implement full-text search
  - Include parsed variable information
  - Support pagination for large datasets
  - Order by creation date (newest first)

**2. `getEmailTemplateById(id: number): Promise<EmailTemplate | null>`**
- **Purpose**: Fetches specific template by ID
- **Requirements**:
  - Return null if template not found
  - Include all template metadata
  - Parse variable definitions
  - Support template versioning

**3. `getDefaultTemplate(type: string, category?: string): Promise<EmailTemplate | null>`**
- **Purpose**: Retrieves default template for type/category combination
- **Requirements**:
  - Support category-specific defaults
  - Fall back to type-level defaults
  - Handle multiple default resolution
  - Cache frequently accessed defaults

**4. `createEmailTemplate(data: InsertEmailTemplate): Promise<EmailTemplate>`**
- **Purpose**: Creates new email template
- **Requirements**:
  - Validate template structure and variables
  - Handle default template management
  - Support version control
  - Validate HTML and text content
  - Ensure unique naming within type/category

**5. `updateEmailTemplate(id: number, data: Partial<InsertEmailTemplate>): Promise<EmailTemplate | null>`**
- **Purpose**: Updates existing email template
- **Requirements**:
  - Preserve template history
  - Handle default template transitions
  - Validate updated content
  - Support partial updates
  - Maintain version incrementing

**6. `deleteEmailTemplate(id: number): Promise<boolean>`**
- **Purpose**: Removes email template
- **Requirements**:
  - Check for template dependencies
  - Handle default template reassignment
  - Support soft deletion for audit
  - Prevent deletion of system templates

**7. `setTemplateAsDefault(id: number, type: string, category?: string): Promise<boolean>`**
- **Purpose**: Sets template as default for type/category
- **Requirements**:
  - Unset previous default templates
  - Support category-specific defaults
  - Validate template exists and is active
  - Log default changes for audit

## Controller Requirements

### EmailTemplateController

**Route Protection Methods:**
- `emailTemplateRouteProtection` - Authentication and authorization middleware

**CRUD Handlers:**
- `getEmailTemplates` - List templates with filtering
- `getTemplateMetadata` - Return template types, categories, and variables
- `getEmailTemplateById` - Fetch specific template
- `createEmailTemplate` - Create new template with validation
- `updateEmailTemplate` - Update existing template
- `deleteEmailTemplate` - Remove template with dependency checks
- `setTemplateAsDefault` - Set default template for type/category
- `previewTemplate` - Generate template preview with variable substitution

**Requirements:**
- All endpoints must require admin authentication
- Implement comprehensive input validation
- Support audit logging for all operations
- Handle concurrent template modifications
- Provide detailed error responses

### EmailLogController

**Methods:**
- `emailLogRouteProtection` - Authentication middleware
- `getEmailLogs` - Retrieve email logs with advanced filtering
- `getEmailLogById` - Fetch specific email log details
- `getEmailLogStats` - Generate email analytics and statistics
- `deleteOldEmailLogs` - Clean up historical email logs

**Requirements:**
- Support complex filtering by status, date, recipient, category
- Implement efficient pagination for large datasets
- Generate real-time statistics and analytics
- Support log retention policies
- Provide export capabilities for audit purposes

### TestEmailController

**Methods:**
- `testEmailRouteProtection` - Authentication middleware
- `sendTestEmails` - Send test emails for system validation

**Requirements:**
- Limited to development and testing environments
- Support template testing with sample data
- Validate email provider configurations
- Log test email activities separately

## API Route Requirements

### Email Template Routes

**GET `/api/email-templates`**
- List all templates with optional filtering
- Support query parameters: type, category, search, limit, offset
- Return templates with parsed variables
- Include total count for pagination

**GET `/api/email-templates/metadata`**
- Return available template types and categories
- Include default variable definitions
- Provide template usage statistics

**GET `/api/email-templates/:id`**
- Fetch specific template by ID
- Include full template details and variables
- Return 404 if template not found

**POST `/api/email-templates`**
- Create new email template
- Validate all required fields
- Support variable definition validation
- Return created template with ID

**PUT `/api/email-templates/:id`**
- Update existing template
- Support partial updates
- Validate changes before applying
- Handle version control

**DELETE `/api/email-templates/:id`**
- Remove template with dependency checks
- Support soft deletion
- Handle default template reassignment

**POST `/api/email-templates/:id/set-default`**
- Set template as default for type/category
- Unset previous defaults
- Validate template suitability

**POST `/api/email-templates/preview`**
- Generate template preview with variables
- Support real-time preview updates
- Validate variable substitution

### Email Log Routes

**GET `/api/email-logs`**
- List email logs with filtering and pagination
- Support filters: status, date range, recipient, category, service
- Return structured log data with metadata

**GET `/api/email-logs/:id`**
- Fetch specific email log details
- Include full email content and metadata
- Show delivery tracking information

**GET `/api/email-logs/stats`**
- Generate email statistics and analytics
- Group by status, category, service, time period
- Support custom date ranges

**DELETE `/api/email-logs/cleanup`**
- Clean up old email logs based on retention policy
- Support selective cleanup by criteria
- Return cleanup statistics

### Test Email Routes

**POST `/api/test/send-emails`**
- Send test emails for validation
- Support template testing
- Limited to authorized users

**POST `/api/email/test`**
- Alternative test email endpoint
- Support provider configuration testing

## Database Schema Requirements

### 1. email_logs Table

**Purpose**: Comprehensive tracking of all email sending attempts

**PostgreSQL Schema:**
```sql
CREATE TABLE email_logs (
    id INTEGER NOT NULL DEFAULT nextval('email_logs_id_seq'::regclass),
    subject TEXT NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT[] NOT NULL,
    cc_address TEXT[],
    bcc_address TEXT[],
    body TEXT,
    html_body TEXT,
    status TEXT NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
    category TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    response_message TEXT,
    service_name TEXT NOT NULL
);
```

**Drizzle Schema:**
```typescript
// File: shared/email-logs-schema.ts
import { pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  subject: text('subject').notNull(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').array().notNull(),
  ccAddress: text('cc_address').array(),
  bccAddress: text('bcc_address').array(),
  body: text('body'),
  htmlBody: text('html_body'),
  status: varchar('status', { length: 20 }).notNull().default('sent'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  category: text('category'),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: text('related_entity_id'),
  responseMessage: text('response_message'),
  serviceName: text('service_name').notNull()
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
```

**Indexes:**
- `idx_email_logs_status` ON (status)
- `idx_email_logs_category` ON (category)
- `idx_email_logs_sent_at` ON (sent_at)
- `idx_email_logs_to_address` ON (to_address)
- `idx_email_logs_service` ON (service_name)

**Requirements:**
- Support high-volume email logging
- Enable efficient filtering and searching
- Track delivery status and responses
- Support retention policies
- Maintain audit trail capabilities

### 2. email_templates Table

**Purpose**: Reusable email templates with variable support

**PostgreSQL Schema:**
```sql
CREATE TABLE email_templates (
    id INTEGER NOT NULL DEFAULT nextval('email_templates_id_seq'::regclass),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    subject VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    variables TEXT,
    is_default INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Drizzle Schema:**
```typescript
// File: shared/email-templates-schema.ts
import { pgTable, serial, varchar, text, boolean, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 50 }),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content').notNull(),
  variables: text('variables'), // JSON string containing variable definitions
  isDefault: integer('is_default').default(0),
  version: integer('version').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  typeIdx: index('idx_email_templates_type').on(table.type),
  categoryIdx: index('idx_email_templates_category').on(table.category),
  defaultIdx: index('idx_email_templates_default').on(table.isDefault),
  activeIdx: index('idx_email_templates_active').on(table.isActive)
}));

// Zod schemas for validation
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(255),
  type: z.enum(['vulnerability', 'compliance', 'account', 'system', 'report']),
  category: z.string().max(50).optional(),
  htmlContent: z.string().min(1),
  textContent: z.string().min(1),
  variables: z.string().optional(),
  isDefault: z.number().int().min(0).max(1).default(0),
  version: z.number().int().positive().default(1),
  isActive: z.boolean().default(true)
});

export const selectEmailTemplateSchema = createSelectSchema(emailTemplates);

// Type definitions
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// Extended type with parsed variables
export interface EmailTemplateWithVariables extends EmailTemplate {
  parsedVariables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email';
  description?: string;
  required?: boolean;
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Insert schema with validation
export type InsertEmailTemplateValidated = z.infer<typeof insertEmailTemplateSchema>;
export type SelectEmailTemplateValidated = z.infer<typeof selectEmailTemplateSchema>;
```

**Requirements:**
- Support template versioning
- Enable default template management
- Validate variable definitions
- Support rich HTML content
- Maintain template relationships
- Type-safe operations with Drizzle ORM
- Zod validation for all inputs

## User Interface Requirements

### Email Management Dashboard (/admin/email-management)

**Layout Requirements:**
- Tabbed interface with four main sections
- Responsive design for desktop and mobile
- Real-time updates for email logs
- Professional admin interface styling

### Tab 1: Email Logs

**Features Required:**
- Real-time email log display with auto-refresh
- Advanced filtering by status, date, recipient, category, service
- Search functionality across subject and content
- Pagination for large datasets
- Email detail modal with full content display
- Status color coding (sent: green, failed: red, pending: yellow)
- Export capabilities (CSV, JSON)
- Log cleanup tools with confirmation
- Statistics dashboard with charts

**Data Display:**
- Timestamp, recipient, subject, status, service, category
- Success/failure rates
- Volume trends over time
- Category distribution
- Service provider performance

### Tab 2: Email Templates

**Features Required:**
- Template CRUD operations with form validation
- Rich text editor for HTML content
- Variable management with preview
- Template categorization and tagging
- Default template designation
- Template preview with variable substitution
- Version history tracking
- Template duplication functionality
- Import/export capabilities

**Template Editor:**
- WYSIWYG HTML editor
- Variable insertion tools
- Live preview functionality
- Subject line editor with variable support
- Plain text content generation
- Template validation

### Tab 3: SMTP Configuration

**Features Required:**
- SMTP server configuration form
- Connection testing and validation
- Authentication method selection
- SSL/TLS configuration
- Port and host settings
- Test email functionality
- Configuration backup and restore
- Multiple SMTP provider support

**Settings:**
- Host, port, security settings
- Authentication credentials
- From address configuration
- Rate limiting settings
- Retry policies
- Fallback provider configuration

### Tab 4: Email APIs

**Features Required:**
- API provider configuration (MailerSend, SendGrid, etc.)
- API key management with secure storage
- Provider health monitoring
- Usage statistics and rate limits
- Provider switching capabilities
- Webhook configuration for delivery tracking
- Provider-specific settings

**Monitoring:**
- API response times
- Success/failure rates by provider
- Usage quotas and limits
- Error rate tracking
- Provider uptime monitoring

## Integration Requirements

### External Service Integration

**MailerSend API:**
- Primary email service provider
- API key authentication
- Delivery tracking and webhooks
- Template management integration
- Rate limit handling

**SMTP Fallback:**
- Secondary email delivery method
- Traditional SMTP server support
- Authentication and security
- Connection pooling

**Webhook Support:**
- Delivery status callbacks
- Bounce and complaint handling
- Real-time status updates
- Event logging and processing

### System Integration

**Audit Logging:**
- All email management operations logged
- Template changes tracking
- Configuration modifications
- User action attribution

**User Management:**
- Role-based access control
- Admin-only access to email management
- User activity tracking
- Permission validation

**Notification System:**
- Email template usage in notifications
- Alert escalation via email
- System status communications
- User account notifications

## Security Requirements

### Data Protection

**Email Content Security:**
- Encryption of sensitive email content
- Secure template variable handling
- PII protection in logs
- Data retention compliance

**Access Control:**
- Admin-only access to email management
- Role-based template permissions
- API key secure storage
- Audit trail for all operations

**Configuration Security:**
- Encrypted SMTP credentials
- Secure API key management
- Configuration change validation
- Backup and recovery procedures

### Compliance Requirements

**Data Retention:**
- Configurable log retention periods
- Automated cleanup procedures
- Compliance reporting capabilities
- Data export for audits

**Privacy Protection:**
- Email address anonymization options
- Content redaction capabilities
- GDPR compliance features
- Opt-out management

## Performance Requirements

### Scalability

**Email Volume:**
- Support for high-volume email sending
- Queue management for batch operations
- Rate limiting and throttling
- Load balancing across providers

**Database Performance:**
- Efficient indexing for large log tables
- Query optimization for filtering
- Archive strategies for old data
- Connection pooling

### Reliability

**Service Availability:**
- Multiple provider failover
- Retry mechanisms for failed sends
- Health monitoring and alerting
- Graceful degradation

**Data Integrity:**
- Transaction management for template operations
- Consistency checks for default templates
- Backup and recovery procedures
- Data validation and sanitization

## Monitoring and Analytics

### Email Metrics

**Delivery Analytics:**
- Send success rates by provider
- Average delivery times
- Bounce and complaint rates
- Category-based performance

**Usage Statistics:**
- Template utilization rates
- User engagement metrics
- Peak usage periods
- Cost analysis by provider

### System Health

**Performance Monitoring:**
- API response times
- Database query performance
- System resource utilization
- Error rate tracking

**Alerting:**
- Failed email notifications
- System performance alerts
- Configuration change notifications
- Security incident alerts

## Drizzle ORM Integration

### Complete Schema Implementation

**File Structure:**
```
shared/
├── email-templates-schema.ts    # Email templates schema (existing)
├── email-logs-schema.ts         # Email logs schema (to be created)
└── email-schema.ts              # Combined email schemas
```

### Complete Email Templates Schema (shared/email-templates-schema.ts)

**Current Implementation:**
```typescript
// Email templates schema
import { pgTable, serial, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),
  variables: jsonb('variables'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
```

**Enhanced Implementation Required:**
```typescript
// File: shared/email-templates-schema.ts
import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  boolean, 
  timestamp, 
  integer, 
  index,
  uniqueIndex 
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const emailTemplates = pgTable('email_templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  subject: varchar('subject', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  category: varchar('category', { length: 50 }),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content').notNull(),
  variables: text('variables'), // JSON string
  isDefault: integer('is_default').default(0),
  version: integer('version').default(1),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  typeIdx: index('idx_email_templates_type').on(table.type),
  categoryIdx: index('idx_email_templates_category').on(table.category),
  defaultIdx: index('idx_email_templates_default').on(table.isDefault),
  activeIdx: index('idx_email_templates_active').on(table.isActive),
  uniqueNameType: uniqueIndex('unique_email_template_name_type_category')
    .on(table.name, table.type, table.category)
}));

// Validation schemas
export const templateTypeEnum = z.enum([
  'vulnerability', 
  'compliance', 
  'account', 
  'system', 
  'report'
]);

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates, {
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  subject: z.string().min(1).max(255),
  type: templateTypeEnum,
  category: z.string().max(50).optional(),
  htmlContent: z.string().min(1),
  textContent: z.string().min(1),
  variables: z.string().optional(),
  isDefault: z.number().int().min(0).max(1).default(0),
  version: z.number().int().positive().default(1),
  isActive: z.boolean().default(true)
});

export const selectEmailTemplateSchema = createSelectSchema(emailTemplates);

// Types
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type ValidatedInsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// Extended interface with parsed variables
export interface EmailTemplateWithVariables extends EmailTemplate {
  parsedVariables?: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email';
  description?: string;
  required?: boolean;
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}
```

### Email Logs Schema (shared/email-logs-schema.ts)

**Required Implementation:**
```typescript
// File: shared/email-logs-schema.ts
import { 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  varchar,
  index 
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const emailLogs = pgTable('email_logs', {
  id: serial('id').primaryKey(),
  subject: text('subject').notNull(),
  fromAddress: text('from_address').notNull(),
  toAddress: text('to_address').array().notNull(),
  ccAddress: text('cc_address').array(),
  bccAddress: text('bcc_address').array(),
  body: text('body'),
  htmlBody: text('html_body'),
  status: varchar('status', { length: 20 }).notNull().default('sent'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  category: text('category'),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: text('related_entity_id'),
  responseMessage: text('response_message'),
  serviceName: text('service_name').notNull()
}, (table) => ({
  statusIdx: index('idx_email_logs_status').on(table.status),
  categoryIdx: index('idx_email_logs_category').on(table.category),
  sentAtIdx: index('idx_email_logs_sent_at').on(table.sentAt),
  serviceIdx: index('idx_email_logs_service').on(table.serviceName)
}));

// Validation schemas
export const emailStatusEnum = z.enum(['pending', 'sent', 'failed', 'bounced']);

export const insertEmailLogSchema = createInsertSchema(emailLogs, {
  subject: z.string().min(1),
  fromAddress: z.string().email(),
  toAddress: z.array(z.string().email()).min(1),
  ccAddress: z.array(z.string().email()).optional(),
  bccAddress: z.array(z.string().email()).optional(),
  body: z.string().optional(),
  htmlBody: z.string().optional(),
  status: emailStatusEnum.default('sent'),
  category: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  responseMessage: z.string().optional(),
  serviceName: z.string().min(1)
});

export const selectEmailLogSchema = createSelectSchema(emailLogs);

// Types
export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
export type ValidatedInsertEmailLog = z.infer<typeof insertEmailLogSchema>;

// Extended interfaces for API responses
export interface EmailLogWithMetadata extends EmailLog {
  metadata?: Record<string, any>;
}

export interface EmailLogFilter {
  status?: string;
  category?: string;
  serviceName?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy: string;  
  sortOrder: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface EmailLogStats {
  statusCounts: Array<{ status: string; count: number }>;
  categoryCounts: Array<{ category: string; count: number }>;
  serviceCounts: Array<{ serviceName: string; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
}
```

### Combined Email Schema Export (shared/email-schema.ts)

**Consolidated Export File:**
```typescript
// File: shared/email-schema.ts
export * from './email-templates-schema';
export * from './email-logs-schema';

// Re-export commonly used types
export type {
  EmailTemplate,
  InsertEmailTemplate,
  EmailTemplateWithVariables,
  TemplateVariable,
  EmailLog,
  InsertEmailLog,
  EmailLogWithMetadata,
  EmailLogFilter,
  EmailLogStats
} from './email-templates-schema';

export type {
  ValidatedInsertEmailTemplate,
  ValidatedInsertEmailLog
} from './email-logs-schema';
```

### Schema Integration Requirements

**Database Migration:**
- Update existing `email_templates` table to match enhanced schema
- Create missing indexes for performance optimization
- Add proper constraints and validation rules
- Ensure backward compatibility with existing data

**Type Safety:**
- All database operations must use Drizzle-generated types
- Input validation through Zod schemas before database operations
- Compile-time type checking for all email-related queries

**Performance Optimization:**
- Implement proper indexing strategies for large email log tables
- Use query optimization for filtering and pagination
- Consider partitioning for email logs based on date ranges

This comprehensive requirements document provides the complete specification for implementing and maintaining the Email Management system within the RAS DASH platform.