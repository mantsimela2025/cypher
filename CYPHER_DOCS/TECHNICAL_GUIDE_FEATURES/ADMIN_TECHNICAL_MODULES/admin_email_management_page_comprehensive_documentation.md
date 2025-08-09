# Admin Email Management Page - Comprehensive Development Documentation

## Overview
This document provides detailed development documentation for the `/admin/email-management` page in the RAS DASH cybersecurity platform. It covers the complete email management ecosystem including email logs tracking, template management, SMTP configuration, and email API integration for enterprise communication systems.

## Page Architecture Overview

### Multi-Tab Email Management System
The admin email management functionality is distributed across multiple specialized tabs and components:

1. **Email Logs Tab** - Real-time email tracking, filtering, and analytics
2. **Email Templates Tab** - Template creation, editing, and management
3. **SMTP Configuration Tab** - SMTP server configuration and testing
4. **Email APIs Tab** - Third-party email service provider configuration

### Related Components and Pages
- **Main Email Management Page** (`/admin/email-management.tsx`) - Unified management interface
- **Email Templates Page** (`/admin/email-templates.tsx`) - Standalone template management
- **Email Logs Page** (`/admin/email-logs.tsx`) - Standalone log viewing
- **Email Log Details Component** (`/components/admin/EmailLogDetails.tsx`) - Detailed log inspection

## Database Schema Architecture

### Email Templates Table (Drizzle Schema)
**Location:** `shared/email-templates-schema.ts`

```typescript
// Drizzle email templates schema
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

### Email Templates Table (Sequelize Model)
**Location:** `server/models/EmailTemplate.ts`

```typescript
// Sequelize EmailTemplate model
export interface EmailTemplateAttributes {
  id: number;
  name: string;
  description?: string;
  subject: string;
  type: string;              // vulnerability, compliance, account, system, report
  htmlContent: string;       // HTML email content
  textContent: string;       // Plain text email content
  createdAt: Date;
  updatedAt: Date;
  variables?: string;        // JSON string of variable definitions
  isDefault: number;         // 0 = not default, 1 = default for this type
  category?: string;         // More specific categorization
  version: number;           // Template version for change tracking
}

// Database table structure with Sequelize DataTypes
const emailTemplatesTable = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'vulnerability, compliance, account, system, report'
  },
  htmlContent: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  textContent: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  variables: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string of variable names and descriptions'
  },
  isDefault: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '0 = not default, 1 = default for this type'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'More specific categorization'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
};

// Database indexes for optimization
indexes: [
  { fields: ['type'] },
  { fields: ['category'] },
  { fields: ['is_default'] },
  { fields: ['name'], unique: true }
]
```

### Email Logs Table (Sequelize Model)
**Location:** `server/models/EmailLog.ts`

```typescript
// Sequelize EmailLog model
export interface EmailLogAttributes {
  id: number;
  to: string;                                    // Recipient email address
  from: string;                                  // Sender email address
  subject: string;                               // Email subject line
  body?: string;                                 // Email body content
  status: 'pending' | 'sent' | 'failed' | 'bounced';  // Email delivery status
  errorMessage?: string;                         // Error details if failed
  sentAt?: Date;                                 // Actual send timestamp
  createdAt: Date;                               // Log creation timestamp
  updatedAt: Date;                               // Last update timestamp
}

// Database table structure
const emailLogsTable = {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  to: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  from: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  subject: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed', 'bounced'),
    allowNull: false,
    defaultValue: 'pending',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: true,
  }
};
```

### Email Configuration Storage
Email configurations (SMTP and API settings) are stored in the `settings` table with specific key patterns:

```typescript
// SMTP Configuration Settings Keys
'email.smtp.host'         // SMTP server host
'email.smtp.port'         // SMTP server port
'email.smtp.secure'       // TLS/SSL enabled
'email.smtp.username'     // SMTP authentication username
'email.smtp.password'     // SMTP authentication password (encrypted)
'email.smtp.from'         // Default sender address
'email.smtp.enabled'      // SMTP service enabled

// Email API Configuration Settings Keys
'email.api.provider'      // Provider name (sendgrid, mailgun, etc.)
'email.api.key'           // API key (encrypted)
'email.api.enabled'       // API service enabled
'email.api.defaultFrom'   // Default sender for API
'email.api.region'        // Provider region if applicable
'email.api.webhook'       // Webhook URL for delivery notifications
```

## Frontend Component Architecture

### Main Email Management Page Structure
**Location:** `src/pages/admin/email-management.tsx`

#### State Management Architecture
```typescript
// Multi-tab state management
const [activeTab, setActiveTab] = useState("logs");

// Email Logs Tab State
const [logFilter, setLogFilter] = useState<EmailLogFilter>({
  status: undefined,
  category: undefined,
  serviceName: undefined,
  search: "",
  fromDate: undefined,
  toDate: undefined,
  sortBy: "sentAt",
  sortOrder: "desc",
  limit: 25,
  offset: 0,
});
const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);

// Email Templates Tab State
const [templateFilter, setTemplateFilter] = useState({
  type: "",
  category: "",
  search: "",
  limit: 10,
  offset: 0,
});
const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
const [isEditing, setIsEditing] = useState(false);
const [isCreating, setIsCreating] = useState(false);
const [previewMode, setPreviewMode] = useState<"html" | "text">("html");
const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});

// SMTP Configuration Tab State
const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
  host: "",
  port: 587,
  secure: false,
  auth: { user: "", pass: "" },
  from: "",
  enabled: false
});
const [isTestingSmtp, setIsTestingSmtp] = useState(false);
const [smtpTestEmail, setSmtpTestEmail] = useState("");

// Email API Configuration Tab State
const [emailApiConfig, setEmailApiConfig] = useState<EmailApiConfig>({
  provider: "sendgrid",
  apiKey: "",
  enabled: false,
  defaultFrom: ""
});
```

#### Comprehensive Type Definitions
```typescript
// Email log interface with comprehensive fields
interface EmailLog {
  id: number;
  subject: string;
  from: string;
  to: string | string[];               // Support multiple recipients
  status: string;                      // sent, failed, pending, bounced
  sentAt: string | Date;               // Send timestamp
  htmlBody?: string;                   // HTML email content
  textBody?: string;                   // Plain text content
  category?: string;                   // Email category classification
  serviceName?: string;                // Email service used (SMTP, SendGrid, etc.)
  metadata?: Record<string, any>;      // Additional email metadata
}

// Email log filtering interface
interface EmailLogFilter {
  status?: string;                     // Filter by delivery status
  category?: string;                   // Filter by email category
  serviceName?: string;                // Filter by email service
  search?: string;                     // Full-text search
  fromDate?: Date;                     // Date range start
  toDate?: Date;                       // Date range end
  sortBy: string;                      // Sort field
  sortOrder: "asc" | "desc";          // Sort direction
  limit: number;                       // Results per page
  offset: number;                      // Pagination offset
}

// Email template interface
interface EmailTemplate {
  id: number;
  name: string;
  type: string;                        // Template type classification
  category: string;                    // Template category
  subject: string;                     // Email subject template
  htmlBody: string;                    // HTML template content
  textBody: string;                    // Text template content
  active: boolean;                     // Template active status
  variables: Record<string, string>;   // Template variable definitions
  createdAt?: string;
  updatedAt?: string;
}

// SMTP configuration interface
interface SmtpConfig {
  host: string;                        // SMTP server hostname
  port: number;                        // SMTP server port
  secure: boolean;                     // Use TLS/SSL
  auth: {
    user: string;                      // SMTP username
    pass: string;                      // SMTP password
  };
  from: string;                        // Default sender address
  enabled: boolean;                    // SMTP service enabled
}

// Email API configuration interface
interface EmailApiConfig {
  provider: string;                    // API provider (sendgrid, mailgun, etc.)
  apiKey: string;                      // Provider API key
  enabled: boolean;                    // API service enabled
  defaultFrom: string;                 // Default sender address
  region?: string;                     // Provider region
  webhook?: string;                    // Delivery webhook URL
}
```

### React Query Integration Architecture

#### Email Logs Data Management
```typescript
// Email logs query with advanced filtering
const {
  data: emailLogsData,
  isLoading: isLoadingEmailLogs,
  refetch: refetchEmailLogs,
} = useQuery<EmailLogsResponse>({
  queryKey: ["/api/email-logs", logFilter],
  queryFn: async () => {
    const queryParams = new URLSearchParams();
    
    // Build comprehensive query parameters
    if (logFilter.status) queryParams.append("status", logFilter.status);
    if (logFilter.category) queryParams.append("category", logFilter.category);
    if (logFilter.serviceName) queryParams.append("serviceName", logFilter.serviceName);
    if (logFilter.search) queryParams.append("search", logFilter.search);
    if (logFilter.fromDate) queryParams.append("fromDate", logFilter.fromDate.toISOString());
    if (logFilter.toDate) queryParams.append("toDate", logFilter.toDate.toISOString());
    if (logFilter.sortBy) queryParams.append("sortBy", logFilter.sortBy);
    if (logFilter.sortOrder) queryParams.append("sortOrder", logFilter.sortOrder);
    if (logFilter.limit) queryParams.append("limit", logFilter.limit.toString());
    if (logFilter.offset) queryParams.append("offset", logFilter.offset.toString());
    
    const response = await fetch(`/api/email-logs?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch email logs");
    }
    return response.json();
  },
});

// Email logs statistics query
const { data: statsData } = useQuery<EmailLogStats>({
  queryKey: ["/api/email-logs/stats"],
  queryFn: async () => {
    const response = await fetch("/api/email-logs/stats");
    if (!response.ok) {
      throw new Error("Failed to fetch email log statistics");
    }
    return response.json();
  },
});
```

#### Email Templates Data Management
```typescript
// Email templates query with filtering
const {
  data: templatesData,
  isLoading: isLoadingTemplates,
  refetch: refetchTemplates,
} = useQuery<EmailTemplatesResponse>({
  queryKey: ["/api/email-templates", templateFilter],
  queryFn: async () => {
    const queryParams = new URLSearchParams();
    if (templateFilter.type) queryParams.append("type", templateFilter.type);
    if (templateFilter.category) queryParams.append("category", templateFilter.category);
    if (templateFilter.search) queryParams.append("search", templateFilter.search);
    queryParams.append("limit", templateFilter.limit.toString());
    queryParams.append("offset", templateFilter.offset.toString());

    const response = await fetch(`/api/email-templates?${queryParams.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch email templates");
    }
    return response.json();
  },
});

// Email template metadata query
const { data: metadata } = useQuery({
  queryKey: ["/api/email-templates/metadata"],
  queryFn: async () => {
    const response = await fetch("/api/email-templates/metadata");
    if (!response.ok) {
      throw new Error("Failed to fetch template metadata");
    }
    return response.json();
  },
});
```

#### Configuration Management Queries
```typescript
// SMTP configuration query
const {
  data: smtpConfigData,
  isLoading: isLoadingSmtpConfig,
  refetch: refetchSmtpConfig
} = useQuery({
  queryKey: ["/api/email/config/smtp"],
  queryFn: async () => {
    try {
      const response = await fetch("/api/email/config/smtp");
      if (!response.ok) {
        return null;
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching SMTP config:", error);
      return null;
    }
  }
});

// Email API configuration query
const {
  data: emailApiConfigData,
  isLoading: isLoadingEmailApiConfig,
  refetch: refetchEmailApiConfig
} = useQuery({
  queryKey: ["/api/email/config/api"],
  queryFn: async () => {
    try {
      const response = await fetch("/api/email/config/api");
      if (!response.ok) {
        return null;
      }
      return response.json();
    } catch (error) {
      console.error("Error fetching Email API config:", error);
      return null;
    }
  }
});
```

### Mutation Architecture for Email Operations

#### Email Log Management Mutations
```typescript
// Delete old email logs mutation
const deleteOldEmailsMutation = useMutation({
  mutationFn: async (days: number) => {
    const response = await fetch("/api/email-logs/cleanup", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ days }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to delete old email logs");
    }
    
    return response.json();
  },
  onSuccess: () => {
    toast({
      title: "Success",
      description: "Old email logs have been deleted successfully",
      variant: "default",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/email-logs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/email-logs/stats"] });
  },
  onError: (error) => {
    toast({
      title: "Error",
      description: `Failed to delete old email logs: ${error.message}`,
      variant: "destructive",
    });
  },
});
```

#### SMTP Configuration Mutations
```typescript
// Save SMTP configuration mutation
const saveSmtpConfigMutation = useMutation({
  mutationFn: async (config: SmtpConfig) => {
    const response = await fetch("/api/email/config/smtp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error("Failed to save SMTP configuration");
    }
    
    return response.json();
  },
  onSuccess: () => {
    toast({
      title: "Success",
      description: "SMTP configuration saved successfully",
      variant: "default",
    });
    refetchSmtpConfig();
  },
  onError: (error) => {
    toast({
      title: "Error",
      description: `Failed to save SMTP configuration: ${error.message}`,
      variant: "destructive",
    });
  },
});

// Test SMTP configuration mutation
const testSmtpConfigMutation = useMutation({
  mutationFn: async ({ config, testEmail }: { config: SmtpConfig, testEmail: string }) => {
    const response = await fetch("/api/email/config/smtp/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config,
        testEmail
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to test SMTP configuration");
    }
    
    return response.json();
  },
  onSuccess: () => {
    toast({
      title: "Success",
      description: "Test email sent successfully",
      variant: "default",
    });
    setIsTestingSmtp(false);
  },
  onError: (error) => {
    toast({
      title: "Error",
      description: `Failed to send test email: ${error.message}`,
      variant: "destructive",
    });
  },
});
```

#### Email API Configuration Mutations
```typescript
// Save Email API configuration mutation
const saveEmailApiConfigMutation = useMutation({
  mutationFn: async (config: EmailApiConfig) => {
    const response = await fetch("/api/email/config/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });
    
    if (!response.ok) {
      throw new Error("Failed to save Email API configuration");
    }
    
    return response.json();
  },
  onSuccess: () => {
    toast({
      title: "Success",
      description: "Email API configuration saved successfully",
      variant: "default",
    });
    refetchEmailApiConfig();
  },
  onError: (error) => {
    toast({
      title: "Error",
      description: `Failed to save Email API configuration: ${error.message}`,
      variant: "destructive",
    });
  },
});
```

## Backend Service Architecture

### Email Service Implementation
**Location:** `server/services/emailService.ts`

#### Core Email Service Class
```typescript
export class EmailService extends BaseService<any> {
  constructor() {
    super(EmailLog);
  }

  /**
   * Send an email using MailerSend
   * @param options Email configuration options
   * @returns Promise resolving to true if email was sent successfully
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      const fromAddress = options.from || DEFAULT_FROM_EMAIL;
      let responseMessage = '';
      let success = false;
      const serviceName = 'mailersend';
      
      // MailerSend integration
      if (!mailerSend) {
        responseMessage = 'Cannot send email: MAILERSEND_API_KEY is not set';
        console.error(responseMessage);
      } else {
        try {
          // Create sender and recipients
          const sender = new Sender(fromAddress, DEFAULT_FROM_NAME);
          const recipients = toArray.map(email => new Recipient(email));
          
          // Prepare attachments if any
          const attachments: Attachment[] = [];
          if (options.attachments && options.attachments.length > 0) {
            for (const attachment of options.attachments) {
              attachments.push(
                new Attachment(
                  attachment.content,
                  attachment.filename,
                  attachment.disposition || 'attachment',
                  attachment.id || attachment.filename
                )
              );
            }
          }
          
          // Create email parameters
          const emailParams = new EmailParams()
            .setFrom(sender)
            .setTo(recipients)
            .setSubject(options.subject)
            .setHtml(options.html)
            .setText(options.text || stripHtml(options.html));
          
          if (options.replyTo) {
            emailParams.setReplyTo(new Recipient(options.replyTo));
          }
          
          if (attachments.length > 0) {
            emailParams.setAttachments(attachments);
          }
          
          // Add tags/categories if provided
          if (options.categories && options.categories.length > 0) {
            emailParams.setTags(options.categories);
          }
          
          // Send email
          const response = await mailerSend.email.send(emailParams);
          
          if (response.status === 202) {
            success = true;
            responseMessage = 'Email sent successfully via MailerSend';
            console.log(`Email sent successfully to ${toArray.join(', ')}`);
          } else {
            responseMessage = `Failed to send email. Status: ${response.status}`;
            console.error(responseMessage);
          }
        } catch (mailerSendError: any) {
          responseMessage = `MailerSend error: ${mailerSendError.message}`;
          console.error('MailerSend error:', mailerSendError);
        }
      }
      
      // Log email attempt
      await this.logEmailAttempt({
        to: toArray.join(', '),
        subject: options.subject,
        service: serviceName,
        success,
        response: responseMessage,
        category: options.category || 'general',
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId
      });
      
      return success;
    } catch (error: any) {
      console.error('Error sending email:', error);
      
      // Log failed attempt
      await this.logEmailAttempt({
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        service: 'mailersend',
        success: false,
        response: `Error: ${error.message}`,
        category: options.category || 'general',
        relatedEntityType: options.relatedEntityType,
        relatedEntityId: options.relatedEntityId
      });
      
      return false;
    }
  }

  /**
   * Log email attempt to database
   */
  private async logEmailAttempt(logData: {
    to: string;
    subject: string;
    service: string;
    success: boolean;
    response: string;
    category: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
  }) {
    try {
      await EmailLog.create({
        toAddress: logData.to,
        subject: logData.subject,
        service: logData.service,
        success: logData.success,
        response: logData.response,
        category: logData.category,
        relatedEntityType: logData.relatedEntityType,
        relatedEntityId: logData.relatedEntityId,
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Error logging email attempt:', error);
    }
  }

  /**
   * Generate professional email template with customizable content
   */
  generateEmailTemplate(options: EmailTemplateOptions): string {
    const urgencyColors = {
      normal: '#007bff',
      high: '#ffc107',
      critical: '#dc3545'
    };
    
    // Professional email template generation logic
    // ...template building code...
  }
}
```

### Email Templates Storage Service
**Location:** `server/emailTemplatesStorage.ts`

#### Comprehensive Template Management
```typescript
export const emailTemplatesStorage = {
  /**
   * Get all email templates with optional filtering and pagination
   */
  async getEmailTemplates(
    type?: string,
    category?: string,
    search?: string,
    limit = 50,
    offset = 0
  ): Promise<{ templates: EmailTemplateWithVariables[], total: number }> {
    try {
      // Build conditions based on filters
      const conditions = [];
      if (type) conditions.push(eq(emailTemplates.type, type));
      if (category) conditions.push(eq(emailTemplates.category, category));
      if (search) {
        conditions.push(
          sql`(${emailTemplates.name} ILIKE ${`%${search}%`} OR ${emailTemplates.description} ILIKE ${`%${search}%`} OR ${emailTemplates.subject} ILIKE ${`%${search}%`})`
        );
      }

      // Count total matching templates
      const countQuery = conditions.length > 0
        ? await db.select({ count: sql<number>`count(*)` }).from(emailTemplates).where(and(...conditions))
        : await db.select({ count: sql<number>`count(*)` }).from(emailTemplates);
      const total = countQuery[0]?.count || 0;

      // Get matching templates with pagination
      const templates = conditions.length > 0
        ? await db.select().from(emailTemplates).where(and(...conditions)).limit(limit).offset(offset).orderBy(desc(emailTemplates.id))
        : await db.select().from(emailTemplates).limit(limit).offset(offset).orderBy(desc(emailTemplates.id));

      // Parse variables field
      const templatesWithParsedVariables = templates.map(template => ({
        ...template,
        parsedVariables: template.variables ? JSON.parse(template.variables) : []
      }));

      return { templates: templatesWithParsedVariables, total };
    } catch (error) {
      console.error('Error getting email templates:', error);
      throw error;
    }
  },

  /**
   * Get the default template for a specific type and optional category
   */
  async getDefaultTemplate(type: string, category?: string): Promise<EmailTemplateWithVariables | null> {
    try {
      const conditions = [eq(emailTemplates.type, type), eq(emailTemplates.isDefault, 1)];
      if (category) {
        conditions.push(eq(emailTemplates.category, category));
      }

      const templates = await db.select().from(emailTemplates).where(and(...conditions)).limit(1);
      
      if (templates.length === 0) {
        // If no category-specific default found, try to get the default for the type
        if (category) {
          const typeDefaults = await db.select().from(emailTemplates)
            .where(and(eq(emailTemplates.type, type), eq(emailTemplates.isDefault, 1)))
            .limit(1);
          
          if (typeDefaults.length > 0) {
            const template = typeDefaults[0];
            return {
              ...template,
              parsedVariables: template.variables ? JSON.parse(template.variables) : []
            };
          }
        }
        
        return null;
      }

      const template = templates[0];
      return {
        ...template,
        parsedVariables: template.variables ? JSON.parse(template.variables) : []
      };
    } catch (error) {
      console.error(`Error getting default template for type ${type}:`, error);
      throw error;
    }
  },

  /**
   * Create a new email template
   */
  async createEmailTemplate(data: InsertEmailTemplate): Promise<EmailTemplate> {
    try {
      // Check if this should be the default for the type/category
      if (data.isDefault === 1) {
        await this.clearDefaultStatus(data.type, data.category || undefined);
      }

      const result = await db.insert(emailTemplates).values(data).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  },

  /**
   * Clear default status for other templates of the same type/category
   */
  async clearDefaultStatus(type: string, category?: string): Promise<void> {
    try {
      const conditions = [eq(emailTemplates.type, type), eq(emailTemplates.isDefault, 1)];
      if (category) {
        conditions.push(eq(emailTemplates.category, category));
      }

      await db.update(emailTemplates)
        .set({ isDefault: 0 })
        .where(and(...conditions));
    } catch (error) {
      console.error(`Error clearing default status for templates of type ${type}:`, error);
      throw error;
    }
  }
};
```

## API Endpoints Architecture

### Email Management API Routes
Expected API endpoints for complete email management functionality:

```typescript
// Email logs endpoints
app.get("/api/email-logs", emailController.getEmailLogs.bind(emailController));
app.get("/api/email-logs/stats", emailController.getEmailLogStats.bind(emailController));
app.delete("/api/email-logs/cleanup", emailController.cleanupEmailLogs.bind(emailController));
app.get("/api/email-logs/:id", emailController.getEmailLog.bind(emailController));

// Email templates endpoints
app.get("/api/email-templates", emailTemplateController.getEmailTemplates.bind(emailTemplateController));
app.get("/api/email-templates/metadata", emailTemplateController.getTemplateMetadata.bind(emailTemplateController));
app.get("/api/email-templates/:id", emailTemplateController.getEmailTemplate.bind(emailTemplateController));
app.post("/api/email-templates", emailTemplateController.createEmailTemplate.bind(emailTemplateController));
app.put("/api/email-templates/:id", emailTemplateController.updateEmailTemplate.bind(emailTemplateController));
app.delete("/api/email-templates/:id", emailTemplateController.deleteEmailTemplate.bind(emailTemplateController));
app.post("/api/email-templates/:id/preview", emailTemplateController.previewTemplate.bind(emailTemplateController));
app.post("/api/email-templates/:id/set-default", emailTemplateController.setAsDefault.bind(emailTemplateController));

// Email configuration endpoints
app.get("/api/email/config/smtp", emailConfigController.getSmtpConfig.bind(emailConfigController));
app.post("/api/email/config/smtp", emailConfigController.saveSmtpConfig.bind(emailConfigController));
app.post("/api/email/config/smtp/test", emailConfigController.testSmtpConfig.bind(emailConfigController));

app.get("/api/email/config/api", emailConfigController.getEmailApiConfig.bind(emailConfigController));
app.post("/api/email/config/api", emailConfigController.saveEmailApiConfig.bind(emailConfigController));
app.post("/api/email/config/api/test", emailConfigController.testEmailApiConfig.bind(emailConfigController));

// Email sending endpoints
app.post("/api/email/send", emailController.sendEmail.bind(emailController));
app.post("/api/email/send-template", emailController.sendTemplateEmail.bind(emailController));
```

### Expected Request/Response Formats

#### Email Logs Response
```typescript
interface EmailLogsResponse {
  logs: Array<{
    id: number;
    subject: string;
    from: string;
    to: string;
    status: string;
    sentAt: string;
    category?: string;
    serviceName?: string;
    errorMessage?: string;
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

#### Email Log Statistics Response
```typescript
interface EmailLogStats {
  statusCounts: Array<{ status: string; count: number }>;
  categoryCounts: Array<{ category: string; count: number }>;
  serviceCounts: Array<{ serviceName: string; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
}
```

#### Email Templates Response
```typescript
interface EmailTemplatesResponse {
  templates: Array<{
    id: number;
    name: string;
    type: string;
    category: string;
    subject: string;
    htmlContent: string;
    textContent: string;
    variables: string;
    isDefault: number;
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
}
```

#### Template Metadata Response
```typescript
interface TemplateMetadata {
  types: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  categories: Record<string, Array<{
    value: string;
    label: string;
  }>>;
  defaultVariables: Record<string, Array<{
    name: string;
    description: string;
    required: boolean;
    example: string;
  }>>;
}
```

## Core UI Components

### Email Status Badge Component
```typescript
function StatusBadge({ status }: { status: string }) {
  switch (status?.toLowerCase()) {
    case "sent":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" /> Sent
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="mr-1 h-3 w-3" /> Failed
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="mr-1 h-3 w-3" /> Pending
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <AlertCircle className="mr-1 h-3 w-3" /> {status || "Unknown"}
        </Badge>
      );
  }
}
```

### Email Logs Table Component
```typescript
// Advanced email logs table with sorting and filtering
<Table>
  <TableHeader>
    <TableRow>
      <TableHead 
        className="cursor-pointer" 
        onClick={() => handleEmailLogSort("subject")}
      >
        Subject {getEmailLogSortIcon("subject")}
      </TableHead>
      <TableHead 
        className="cursor-pointer" 
        onClick={() => handleEmailLogSort("from")}
      >
        From {getEmailLogSortIcon("from")}
      </TableHead>
      <TableHead 
        className="cursor-pointer" 
        onClick={() => handleEmailLogSort("to")}
      >
        To {getEmailLogSortIcon("to")}
      </TableHead>
      <TableHead 
        className="cursor-pointer" 
        onClick={() => handleEmailLogSort("status")}
      >
        Status {getEmailLogSortIcon("status")}
      </TableHead>
      <TableHead 
        className="cursor-pointer" 
        onClick={() => handleEmailLogSort("sentAt")}
      >
        Sent At {getEmailLogSortIcon("sentAt")}
      </TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {emailLogsData?.logs.map((log) => (
      <TableRow key={log.id}>
        <TableCell className="font-medium max-w-xs truncate">
          {log.subject}
        </TableCell>
        <TableCell>{log.from}</TableCell>
        <TableCell>{log.to}</TableCell>
        <TableCell>
          <StatusBadge status={log.status} />
        </TableCell>
        <TableCell>{formatDate(log.sentAt)}</TableCell>
        <TableCell>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedEmailLog(log)}
          >
            <Search className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Advanced Filtering Interface
```typescript
// Comprehensive email log filtering interface
<div className="flex flex-wrap gap-4 mb-6">
  <div className="flex-1 min-w-64">
    <Label htmlFor="search">Search</Label>
    <div className="relative">
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        id="search"
        placeholder="Search emails..."
        value={logFilter.search}
        onChange={handleEmailLogSearch}
        className="pl-8"
      />
    </div>
  </div>
  
  <div className="min-w-40">
    <Label htmlFor="status">Status</Label>
    <Select
      value={logFilter.status || "all"}
      onValueChange={(value) => handleEmailLogFilterChange("status", value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="All Statuses" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Statuses</SelectItem>
        <SelectItem value="sent">Sent</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="bounced">Bounced</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  <div className="min-w-40">
    <Label htmlFor="category">Category</Label>
    <Select
      value={logFilter.category || "all"}
      onValueChange={(value) => handleEmailLogFilterChange("category", value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        <SelectItem value="vulnerability">Vulnerability</SelectItem>
        <SelectItem value="compliance">Compliance</SelectItem>
        <SelectItem value="account">Account</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  </div>
  
  <div className="min-w-40">
    <Label htmlFor="service">Service</Label>
    <Select
      value={logFilter.serviceName || "all"}
      onValueChange={(value) => handleEmailLogFilterChange("serviceName", value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="All Services" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Services</SelectItem>
        <SelectItem value="smtp">SMTP</SelectItem>
        <SelectItem value="sendgrid">SendGrid</SelectItem>
        <SelectItem value="mailersend">MailerSend</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

<div className="flex flex-wrap gap-4 mb-6">
  <div className="min-w-40">
    <Label htmlFor="fromDate">From Date</Label>
    <DatePicker
      selected={logFilter.fromDate}
      onSelect={(date) => handleEmailLogFilterChange("fromDate", date)}
      placeholderText="Select start date"
    />
  </div>
  
  <div className="min-w-40">
    <Label htmlFor="toDate">To Date</Label>
    <DatePicker
      selected={logFilter.toDate}
      onSelect={(date) => handleEmailLogFilterChange("toDate", date)}
      placeholderText="Select end date"
    />
  </div>
  
  <div className="flex items-end">
    <Button 
      variant="outline" 
      onClick={refetchEmailLogs}
      disabled={isLoadingEmailLogs}
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Refresh
    </Button>
  </div>
</div>
```

### SMTP Configuration Interface
```typescript
// Comprehensive SMTP configuration form
<Card>
  <CardHeader>
    <CardTitle>SMTP Server Configuration</CardTitle>
    <CardDescription>
      Configure your SMTP server settings for sending emails
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="smtp-host">SMTP Host</Label>
        <Input
          id="smtp-host"
          placeholder="smtp.gmail.com"
          value={smtpConfig.host}
          onChange={(e) => handleSmtpConfigChange("host", e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="smtp-port">SMTP Port</Label>
        <Input
          id="smtp-port"
          type="number"
          placeholder="587"
          value={smtpConfig.port}
          onChange={(e) => handleSmtpConfigChange("port", parseInt(e.target.value))}
        />
      </div>
    </div>
    
    <div>
      <Label htmlFor="smtp-from">From Address</Label>
      <Input
        id="smtp-from"
        type="email"
        placeholder="noreply@yourcompany.com"
        value={smtpConfig.from}
        onChange={(e) => handleSmtpConfigChange("from", e.target.value)}
      />
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="smtp-username">Username</Label>
        <Input
          id="smtp-username"
          placeholder="your-email@gmail.com"
          value={smtpConfig.auth.user}
          onChange={(e) => handleSmtpConfigChange("auth.user", e.target.value)}
        />
      </div>
      
      <div>
        <Label htmlFor="smtp-password">Password</Label>
        <Input
          id="smtp-password"
          type="password"
          placeholder="Your app password"
          value={smtpConfig.auth.pass}
          onChange={(e) => handleSmtpConfigChange("auth.pass", e.target.value)}
        />
      </div>
    </div>
    
    <div className="flex items-center space-x-2">
      <Switch
        id="smtp-secure"
        checked={smtpConfig.secure}
        onCheckedChange={(checked) => handleSmtpConfigChange("secure", checked)}
      />
      <Label htmlFor="smtp-secure">Use TLS/SSL</Label>
    </div>
    
    <div className="flex items-center space-x-2">
      <Switch
        id="smtp-enabled"
        checked={smtpConfig.enabled}
        onCheckedChange={(checked) => handleSmtpConfigChange("enabled", checked)}
      />
      <Label htmlFor="smtp-enabled">Enable SMTP Service</Label>
    </div>
  </CardContent>
  <CardFooter className="flex justify-between">
    <div className="flex gap-2">
      <Button 
        onClick={handleSaveSmtpConfig}
        disabled={saveSmtpConfigMutation.isPending}
      >
        <Save className="mr-2 h-4 w-4" />
        Save Configuration
      </Button>
      
      <Dialog open={isTestingSmtp} onOpenChange={setIsTestingSmtp}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Send className="mr-2 h-4 w-4" />
            Test Configuration
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test SMTP Configuration</DialogTitle>
            <DialogDescription>
              Send a test email to verify your SMTP settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={smtpTestEmail}
                onChange={(e) => setSmtpTestEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleTestSmtpConfig}
              disabled={testSmtpConfigMutation.isPending}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </CardFooter>
</Card>
```

## Core Functionality Implementation

### Email Log Management Operations
```typescript
// Email log filtering and search
const handleEmailLogSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  setLogFilter({ ...logFilter, search: e.target.value, offset: 0 });
};

const handleEmailLogSort = (field: string) => {
  setLogFilter({
    ...logFilter,
    sortBy: field,
    sortOrder: field === logFilter.sortBy && logFilter.sortOrder === "asc" ? "desc" : "asc",
  });
};

const handleEmailLogFilterChange = (field: string, value: any) => {
  // Convert "all" values to undefined for the filter
  const actualValue = value === "all" ? undefined : value;
  setLogFilter({ ...logFilter, [field]: actualValue, offset: 0 });
};

const handleEmailLogPageChange = (page: number) => {
  setLogFilter({
    ...logFilter,
    offset: (page - 1) * logFilter.limit,
  });
};

const handleDeleteOldEmails = (days: number) => {
  if (window.confirm(`Are you sure you want to delete all email logs older than ${days} days?`)) {
    deleteOldEmailsMutation.mutate(days);
  }
};
```

### Email Template Management Operations
```typescript
// Template filtering and search
const handleTemplateFilterChange = (field: string, value: any) => {
  // Convert "all" values to empty string for the filter
  const actualValue = value === "all" ? "" : value;
  setTemplateFilter({ ...templateFilter, [field]: actualValue, offset: 0 });
};

const handleTemplateSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  setTemplateFilter({ ...templateFilter, search: e.target.value, offset: 0 });
};

const viewTemplate = (template: EmailTemplate) => {
  setSelectedTemplate(template);
  setIsEditing(false);
  setIsCreating(false);
};

const editTemplate = (template: EmailTemplate) => {
  setSelectedTemplate(template);
  setIsEditing(true);
  setIsCreating(false);
};

const createNewTemplate = () => {
  setSelectedTemplate(null);
  setIsEditing(false);
  setIsCreating(true);
};
```

### Configuration Management Operations
```typescript
// SMTP configuration management
const handleSmtpConfigChange = (field: string, value: any) => {
  if (field.startsWith("auth.")) {
    const authField = field.split(".")[1];
    setSmtpConfig({
      ...smtpConfig,
      auth: {
        ...smtpConfig.auth,
        [authField]: value
      }
    });
  } else {
    setSmtpConfig({
      ...smtpConfig,
      [field]: value
    });
  }
};

const handleSaveSmtpConfig = () => {
  saveSmtpConfigMutation.mutate(smtpConfig);
};

const handleTestSmtpConfig = () => {
  if (!smtpTestEmail) {
    toast({
      title: "Error",
      description: "Please enter a test email address",
      variant: "destructive",
    });
    return;
  }
  
  testSmtpConfigMutation.mutate({
    config: smtpConfig,
    testEmail: smtpTestEmail
  });
};

// Email API configuration management
const handleEmailApiConfigChange = (field: string, value: any) => {
  setEmailApiConfig({
    ...emailApiConfig,
    [field]: value
  });
};

const handleSaveEmailApiConfig = () => {
  saveEmailApiConfigMutation.mutate(emailApiConfig);
};
```

## Security and Compliance Features

### Data Protection
- **Email Content Encryption**: Sensitive email content stored with encryption
- **Password Security**: SMTP passwords encrypted in database storage
- **API Key Protection**: Email service API keys encrypted and masked in UI
- **Access Control**: Admin-only access to email configuration and logs

### Audit and Compliance
- **Complete Email Logging**: All email attempts logged with timestamps and results
- **Configuration Audit Trail**: Changes to email configurations tracked
- **Data Retention**: Configurable email log retention with automatic cleanup
- **Error Tracking**: Detailed error logging for failed email deliveries

### Email Security
- **SMTP Authentication**: Secure SMTP authentication with TLS/SSL support
- **Email Validation**: Comprehensive email address validation
- **Rate Limiting**: Protection against email spam and abuse
- **Delivery Monitoring**: Real-time email delivery status tracking

## Performance Optimization Features

### Efficient Data Loading
- **React Query Caching**: Intelligent caching of email logs and templates
- **Pagination**: Efficient pagination for large email log datasets
- **Lazy Loading**: Load email content only when needed
- **Background Sync**: Background refresh of email statistics

### Email Processing Optimization
- **Async Email Sending**: Non-blocking email sending operations
- **Batch Processing**: Efficient batch email operations
- **Queue Management**: Email queue management for high volume
- **Connection Pooling**: Optimized email service connections

### Database Performance
- **Indexed Queries**: Optimized database queries with proper indexing
- **Log Retention**: Automatic cleanup of old email logs
- **Template Caching**: Caching of frequently used email templates
- **Statistics Pre-computation**: Pre-calculated email statistics

## Development Best Practices

### Code Organization
1. **Multi-tab Interface**: Clear separation between email logs, templates, and configuration
2. **Reusable Components**: Shared components for email status, filtering, and display
3. **Service Architecture**: Centralized email service with multiple provider support
4. **Type Safety**: Complete TypeScript coverage with comprehensive interfaces

### Security Implementation
1. **Configuration Protection**: Secure handling of SMTP and API credentials
2. **Input Validation**: Comprehensive validation of email addresses and content
3. **Error Handling**: Graceful error handling with user-friendly messages
4. **Audit Logging**: Complete audit trail for all email operations

### Email Service Integration
1. **Provider Abstraction**: Abstract email service interface supporting multiple providers
2. **Fallback Mechanisms**: Automatic fallback between SMTP and API services
3. **Configuration Testing**: Built-in testing for email configurations
4. **Delivery Tracking**: Real-time tracking of email delivery status

## Testing and Quality Assurance

### Email Log Testing
1. **Filter Testing**: Test all filtering and search functionality
2. **Pagination Testing**: Verify pagination works with large datasets
3. **Sort Testing**: Test sorting on all log columns
4. **Export Testing**: Test email log export functionality

### Template Management Testing
1. **CRUD Operations**: Test create, read, update, delete for templates
2. **Variable Substitution**: Test template variable replacement
3. **Preview Functionality**: Test template preview in HTML and text formats
4. **Default Template Logic**: Test default template assignment and retrieval

### Configuration Testing
1. **SMTP Testing**: Test SMTP configuration save and test functionality
2. **API Configuration**: Test email API provider configuration
3. **Security Testing**: Verify credential encryption and protection
4. **Validation Testing**: Test configuration validation and error handling

### Email Sending Testing
1. **Service Integration**: Test email sending through different providers
2. **Error Handling**: Test handling of email sending failures
3. **Logging Accuracy**: Verify accurate logging of email attempts
4. **Performance Testing**: Test email sending performance under load

## Conclusion

The admin email management page provides a comprehensive, enterprise-grade email management system designed for cybersecurity environments. It offers complete control over email logging, template management, and service configuration while maintaining high security standards and government compliance requirements.

The architecture supports multiple email service providers, detailed audit logging, and flexible template management essential for maintaining effective communication in mission-critical cybersecurity operations for government and DOD deployments.