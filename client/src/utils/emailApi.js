import { apiClient } from './apiClient';

export const emailApi = {
  // ✅ CORRECT: GET SES status
  async getSESStatus() {
    try {
      return await apiClient.get('/email/status');
    } catch (error) {
      console.error('Error fetching SES status:', error);
      throw error;
    }
  },

  // ✅ CORRECT: GET email templates
  async getEmailTemplates() {
    try {
      return await apiClient.get('/email/templates');
    } catch (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }
  },

  // ✅ CORRECT: POST test email
  async sendTestEmail(recipientEmail, senderEmail = null) {
    try {
      const data = {
        recipientEmail,
        ...(senderEmail && { senderEmail })
      };
      return await apiClient.post('/email/test', data);
    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  },

  // ✅ CORRECT: POST notification email
  async sendNotificationEmail(recipientEmail, subject, message, senderEmail = null) {
    try {
      const data = {
        recipientEmail,
        subject,
        message,
        ...(senderEmail && { senderEmail })
      };
      return await apiClient.post('/email/notification', data);
    } catch (error) {
      console.error('Error sending notification email:', error);
      throw error;
    }
  },

  // ✅ CORRECT: POST bulk emails
  async sendBulkEmails(recipients, subject, message, senderEmail = null) {
    try {
      const data = {
        recipients,
        subject,
        message,
        ...(senderEmail && { senderEmail })
      };
      return await apiClient.post('/email/bulk', data);
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  },

  // ✅ CORRECT: Send email using template
  async sendEmailFromTemplate(recipientEmail, templateId, senderEmail = null) {
    try {
      // First get the template
      const templatesResponse = await this.getEmailTemplates();
      if (!templatesResponse.success) {
        throw new Error('Failed to fetch email templates');
      }
      
      const template = templatesResponse.data.find(t => t.id === templateId);
      if (!template) {
        throw new Error(`Template with ID "${templateId}" not found`);
      }

      // Send the email using the template
      return await this.sendNotificationEmail(
        recipientEmail,
        template.subject,
        template.message,
        senderEmail
      );
    } catch (error) {
      console.error('Error sending email from template:', error);
      throw error;
    }
  },

  // ✅ CORRECT: GET email logs with filtering and pagination
  async getEmailLogs(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.status) params.append('status', options.status);
      if (options.category) params.append('category', options.category);
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      
      const queryString = params.toString();
      const url = queryString ? `/email/logs?${queryString}` : '/email/logs';
      
      return await apiClient.get(url);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      throw error;
    }
  },

  // ✅ CORRECT: GET email statistics
  async getEmailStats() {
    try {
      return await apiClient.get('/email/stats');
    } catch (error) {
      console.error('Error fetching email statistics:', error);
      throw error;
    }
  },

  // ✅ CORRECT: POST multiple test emails for logging demonstration
  async sendTestEmails(count = 5, senderEmail = null) {
    try {
      const data = {
        count,
        ...(senderEmail && { senderEmail })
      };
      return await apiClient.post('/email/test-bulk', data);
    } catch (error) {
      console.error('Error sending test emails:', error);
      throw error;
    }
  }
};