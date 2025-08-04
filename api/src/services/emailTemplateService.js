const { db } = require('../db');
const { emailTemplates } = require('../db/schema');
const { eq, and, like, desc, or } = require('drizzle-orm');

/**
 * Email Template Service - Manages database-stored email templates
 */
class EmailTemplateService {
  /**
   * Create a new email template
   */
  async createTemplate(templateData) {
    try {
      const [template] = await db.insert(emailTemplates).values({
        ...templateData,
        variables: templateData.variables || [],
        metadata: templateData.metadata || {},
      }).returning();

      return template;
    } catch (error) {
      console.error('Failed to create email template:', error);
      throw error;
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id) {
    try {
      const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
      return template || null;
    } catch (error) {
      console.error('Failed to get email template:', error);
      throw error;
    }
  }

  /**
   * Get template by name
   */
  async getTemplateByName(name) {
    try {
      const [template] = await db.select().from(emailTemplates)
        .where(and(
          eq(emailTemplates.name, name),
          eq(emailTemplates.status, 'active')
        ));
      return template || null;
    } catch (error) {
      console.error('Failed to get email template by name:', error);
      throw error;
    }
  }

  /**
   * Get all templates with optional filtering
   */
  async getTemplates(filters = {}) {
    try {
      let query = db.select().from(emailTemplates);
      
      if (filters.type) {
        query = query.where(eq(emailTemplates.type, filters.type));
      }
      
      if (filters.status) {
        query = query.where(eq(emailTemplates.status, filters.status));
      }
      
      if (filters.search) {
        query = query.where(
          or(
            like(emailTemplates.name, `%${filters.search}%`),
            like(emailTemplates.description, `%${filters.search}%`),
            like(emailTemplates.subject, `%${filters.search}%`)
          )
        );
      }
      
      return await query.orderBy(desc(emailTemplates.updatedAt));
    } catch (error) {
      console.error('Failed to get email templates:', error);
      throw error;
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id, updateData) {
    try {
      const [template] = await db.update(emailTemplates)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(emailTemplates.id, id))
        .returning();

      return template;
    } catch (error) {
      console.error('Failed to update email template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id) {
    try {
      await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
      return true;
    } catch (error) {
      console.error('Failed to delete email template:', error);
      throw error;
    }
  }

  /**
   * Render template with variables
   */
  renderTemplate(template, variables = {}) {
    try {
      let subject = template.subject;
      let body = template.body;

      // Replace variables in subject and body
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        subject = subject.replace(placeholder, value || '');
        body = body.replace(placeholder, value || '');
      });

      return {
        subject,
        body,
        isHtml: template.isHtml,
        variables: template.variables,
        metadata: template.metadata
      };
    } catch (error) {
      console.error('Failed to render email template:', error);
      throw error;
    }
  }

  /**
   * Get template variables from content
   */
  extractVariables(content) {
    const variableRegex = /{{\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*}}/g;
    const variables = new Set();
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Validate template content
   */
  validateTemplate(templateData) {
    const errors = [];

    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!templateData.subject || templateData.subject.trim().length === 0) {
      errors.push('Template subject is required');
    }

    if (!templateData.body || templateData.body.trim().length === 0) {
      errors.push('Template body is required');
    }

    if (!templateData.type) {
      errors.push('Template type is required');
    }

    // Extract variables from subject and body
    const subjectVars = this.extractVariables(templateData.subject || '');
    const bodyVars = this.extractVariables(templateData.body || '');
    const allVars = [...new Set([...subjectVars, ...bodyVars])];

    return {
      isValid: errors.length === 0,
      errors,
      extractedVariables: allVars
    };
  }

  /**
   * Clone template
   */
  async cloneTemplate(id, newName) {
    try {
      const template = await this.getTemplateById(id);
      if (!template) {
        throw new Error('Template not found');
      }

      const clonedTemplate = {
        ...template,
        name: newName,
        status: 'draft',
        version: '1.0',
        createdBy: template.lastModifiedBy,
        lastModifiedBy: template.lastModifiedBy
      };

      delete clonedTemplate.id;
      delete clonedTemplate.createdAt;
      delete clonedTemplate.updatedAt;

      return await this.createTemplate(clonedTemplate);
    } catch (error) {
      console.error('Failed to clone email template:', error);
      throw error;
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(templateId) {
    try {
      // This would require joining with email_logs table
      // For now, return basic template info
      const template = await this.getTemplateById(templateId);
      
      if (!template) {
        return null;
      }

      // TODO: Add actual usage statistics from email_logs
      return {
        template,
        totalSent: 0, // Would be calculated from email_logs
        lastUsed: null, // Would be calculated from email_logs
        successRate: 0 // Would be calculated from email_logs
      };
    } catch (error) {
      console.error('Failed to get template statistics:', error);
      throw error;
    }
  }

  /**
   * Seed default templates
   */
  async seedDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'welcome_email',
        description: 'Welcome email for new users',
        subject: 'Welcome to {{app_name}}, {{user_name}}!',
        body: `
Hello {{user_name}},

Welcome to {{app_name}}! Your account has been successfully created.

Account Details:
- Username: {{username}}
- Email: {{email}}
- Role: {{role}}

You can now log in to your account and start using the dashboard.

Best regards,
The {{app_name}} Team
        `.trim(),
        type: 'welcome',
        status: 'active',
        variables: ['app_name', 'user_name', 'username', 'email', 'role'],
        isHtml: false,
        version: '1.0',
        metadata: { category: 'user_management' }
      },
      {
        name: 'password_reset',
        description: 'Password reset email',
        subject: 'Password Reset Request - {{app_name}}',
        body: `
Hello {{user_name}},

You have requested to reset your password for your {{app_name}} account.

To reset your password, please click the following link:
{{reset_url}}

This link will expire in {{expiry_time}} for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
The {{app_name}} Team
        `.trim(),
        type: 'password_reset',
        status: 'active',
        variables: ['app_name', 'user_name', 'reset_url', 'expiry_time'],
        isHtml: false,
        version: '1.0',
        metadata: { category: 'security' }
      },
      {
        name: 'access_request_notification',
        description: 'Notification for new access requests',
        subject: 'New Access Request - {{app_name}}',
        body: `
A new access request has been submitted and requires your review.

Request Details:
- Name: {{requester_name}}
- Email: {{requester_email}}
- Reason: {{request_reason}}
- Submitted: {{submission_date}}

Please log in to the admin dashboard to review and process this request.

Best regards,
{{app_name}} System
        `.trim(),
        type: 'notification',
        status: 'active',
        variables: ['app_name', 'requester_name', 'requester_email', 'request_reason', 'submission_date'],
        isHtml: false,
        version: '1.0',
        metadata: { category: 'admin_notifications' }
      }
    ];

    const results = [];
    for (const templateData of defaultTemplates) {
      try {
        // Check if template already exists
        const existing = await this.getTemplateByName(templateData.name);
        if (!existing) {
          const created = await this.createTemplate(templateData);
          results.push({ action: 'created', template: created });
        } else {
          results.push({ action: 'skipped', template: existing, reason: 'already exists' });
        }
      } catch (error) {
        results.push({ action: 'failed', templateName: templateData.name, error: error.message });
      }
    }

    return results;
  }
}

// Create and export singleton instance
const emailTemplateService = new EmailTemplateService();

module.exports = emailTemplateService;
