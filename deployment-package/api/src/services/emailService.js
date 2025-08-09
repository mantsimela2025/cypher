const nodemailer = require('nodemailer');
const axios = require('axios');
const { db } = require('../db');
const { emailLogs } = require('../db/schema');
const { eq, and, desc } = require('drizzle-orm');

class EmailService {
  constructor() {
    this.provider = this.determineProvider();
    this.transporter = null;
    this.apiKey = null;
    this.fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@rasdash.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'RAS Dashboard';
    
    this.initializeProvider();
  }

  /**
   * Determine which email provider to use based on environment variables
   */
  determineProvider() {
    if (process.env.MAILERSEND_API_KEY) {
      return 'mailersend';
    } else if (process.env.SENDGRID_API_KEY) {
      return 'sendgrid';
    } else if (process.env.MAILGUN_API_KEY) {
      return 'mailgun';
    } else if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      return 'smtp';
    } else {
      throw new Error('No email provider configured. Please set up SMTP or API credentials in .env file.');
    }
  }

  /**
   * Initialize the selected email provider
   */
  initializeProvider() {
    switch (this.provider) {
      case 'smtp':
        this.initializeSMTP();
        break;
      case 'mailersend':
        this.initializeMailerSend();
        break;
      case 'sendgrid':
        this.initializeSendGrid();
        break;
      case 'mailgun':
        this.initializeMailgun();
        break;
      default:
        throw new Error(`Unsupported email provider: ${this.provider}`);
    }
  }

  /**
   * Initialize SMTP transporter
   */
  initializeSMTP() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
      }
    });
  }

  /**
   * Initialize MailerSend API
   */
  initializeMailerSend() {
    this.apiKey = process.env.MAILERSEND_API_KEY;
    this.apiUrl = 'https://api.mailersend.com/v1/email';
  }

  /**
   * Initialize SendGrid API
   */
  initializeSendGrid() {
    this.apiKey = process.env.SENDGRID_API_KEY;
    this.apiUrl = 'https://api.sendgrid.com/v3/mail/send';
  }

  /**
   * Initialize Mailgun API
   */
  initializeMailgun() {
    this.apiKey = process.env.MAILGUN_API_KEY;
    this.domain = process.env.MAILGUN_DOMAIN;
    this.apiUrl = `https://api.mailgun.net/v3/${this.domain}/messages`;
  }

  /**
   * Send email using the configured provider
   * @param {Object} emailData - Email data
   * @param {string} emailData.to - Recipient email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.text - Plain text content
   * @param {string} emailData.html - HTML content
   * @param {string} emailData.from - Sender email (optional)
   * @param {string} emailData.fromName - Sender name (optional)
   * @param {Array} emailData.attachments - Attachments (optional)
   * @param {string} emailData.category - Email category for logging (optional)
   * @param {string} emailData.relatedEntityType - Related entity type (optional)
   * @param {string} emailData.relatedEntityId - Related entity ID (optional)
   */
  async sendEmail(emailData) {
    let logId = null;

    try {
      const { to, subject, text, html, from, fromName, attachments, category, relatedEntityType, relatedEntityId, cc, bcc } = emailData;

      // Validate required fields
      if (!to || !subject || (!text && !html)) {
        throw new Error('Missing required email fields: to, subject, and content (text or html)');
      }

      const senderEmail = from || this.fromEmail;
      const senderName = fromName || this.fromName;

      // Log email attempt
      logId = await this.logEmailAttempt({
        subject,
        from: `${senderName} <${senderEmail}>`,
        to,
        cc: cc || '',
        bcc: bcc || '',
        body: text,
        htmlBody: html,
        status: 'pending',
        category: category || 'general',
        serviceName: this.provider,
        relatedEntityType,
        relatedEntityId
      });

      let result;
      switch (this.provider) {
        case 'smtp':
          result = await this.sendViaSMTP({ to, subject, text, html, senderEmail, senderName, attachments, cc, bcc });
          break;
        case 'mailersend':
          result = await this.sendViaMailerSend({ to, subject, text, html, senderEmail, senderName, attachments, cc, bcc });
          break;
        case 'sendgrid':
          result = await this.sendViaSendGrid({ to, subject, text, html, senderEmail, senderName, attachments, cc, bcc });
          break;
        case 'mailgun':
          result = await this.sendViaMailgun({ to, subject, text, html, senderEmail, senderName, attachments, cc, bcc });
          break;
        default:
          throw new Error(`Unsupported email provider: ${this.provider}`);
      }

      // Update log with success
      if (logId) {
        await this.updateEmailLog(logId, {
          status: 'sent',
          responseMessage: `Email sent successfully via ${this.provider}. Message ID: ${result.messageId}`
        });
      }

      return { ...result, logId };
    } catch (error) {
      // Update log with failure
      if (logId) {
        await this.updateEmailLog(logId, {
          status: 'failed',
          responseMessage: error.message
        });
      }

      console.error('Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Send email via SMTP
   */
  async sendViaSMTP({ to, subject, text, html, senderEmail, senderName, attachments }) {
    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      text,
      html,
      attachments
    };

    const result = await this.transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
      provider: 'smtp'
    };
  }

  /**
   * Send email via MailerSend API
   */
  async sendViaMailerSend({ to, subject, text, html, senderEmail, senderName }) {
    const payload = {
      from: {
        email: senderEmail,
        name: senderName
      },
      to: [
        {
          email: to,
          name: to.split('@')[0] // Use email prefix as name if not provided
        }
      ],
      subject,
      text,
      html
    };

    const response = await axios.post(this.apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      messageId: response.headers['x-message-id'] || response.data.message_id,
      provider: 'mailersend'
    };
  }

  /**
   * Send email via SendGrid API
   */
  async sendViaSendGrid({ to, subject, text, html, senderEmail, senderName }) {
    const payload = {
      personalizations: [
        {
          to: [{ email: to }],
          subject
        }
      ],
      from: {
        email: senderEmail,
        name: senderName
      },
      content: [
        ...(text ? [{ type: 'text/plain', value: text }] : []),
        ...(html ? [{ type: 'text/html', value: html }] : [])
      ]
    };

    const response = await axios.post(this.apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      messageId: response.headers['x-message-id'],
      provider: 'sendgrid'
    };
  }

  /**
   * Send email via Mailgun API
   */
  async sendViaMailgun({ to, subject, text, html, senderEmail, senderName }) {
    const formData = new URLSearchParams();
    formData.append('from', `${senderName} <${senderEmail}>`);
    formData.append('to', to);
    formData.append('subject', subject);
    if (text) formData.append('text', text);
    if (html) formData.append('html', html);

    const response = await axios.post(this.apiUrl, formData, {
      auth: {
        username: 'api',
        password: this.apiKey
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return {
      success: true,
      messageId: response.data.id,
      provider: 'mailgun'
    };
  }

  /**
   * Test email configuration
   */
  async testConnection() {
    try {
      if (this.provider === 'smtp') {
        await this.transporter.verify();
        return { success: true, provider: this.provider, message: 'SMTP connection verified' };
      } else {
        // For API providers, we'll send a test request to validate credentials
        const testResult = await this.sendEmail({
          to: this.fromEmail,
          subject: 'Email Service Test',
          text: 'This is a test email to verify email service configuration.',
          html: '<p>This is a test email to verify email service configuration.</p>'
        });
        return { success: true, provider: this.provider, message: 'API credentials verified', testResult };
      }
    } catch (error) {
      return { success: false, provider: this.provider, error: error.message };
    }
  }

  /**
   * Log email attempt to database
   */
  async logEmailAttempt(emailData) {
    try {
      const [logEntry] = await db.insert(emailLogs).values(emailData).returning({ id: emailLogs.id });
      return logEntry.id;
    } catch (error) {
      console.error('Failed to log email attempt:', error);
      return null;
    }
  }

  /**
   * Update email log status
   */
  async updateEmailLog(logId, updateData) {
    try {
      await db.update(emailLogs)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(emailLogs.id, logId));
    } catch (error) {
      console.error('Failed to update email log:', error);
    }
  }

  /**
   * Get email logs with optional filtering
   */
  async getEmailLogs(filters = {}) {
    try {
      let query = db.select().from(emailLogs);

      if (filters.status) {
        query = query.where(eq(emailLogs.status, filters.status));
      }

      if (filters.category) {
        query = query.where(eq(emailLogs.category, filters.category));
      }

      if (filters.relatedEntityType && filters.relatedEntityId) {
        query = query.where(
          and(
            eq(emailLogs.relatedEntityType, filters.relatedEntityType),
            eq(emailLogs.relatedEntityId, filters.relatedEntityId)
          )
        );
      }

      return await query.orderBy(desc(emailLogs.createdAt)).limit(filters.limit || 100);
    } catch (error) {
      console.error('Failed to get email logs:', error);
      return [];
    }
  }

  /**
   * Get current provider information
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      fromEmail: this.fromEmail,
      fromName: this.fromName,
      configured: true
    };
  }
}

// Create and export a singleton instance
const emailService = new EmailService();

module.exports = emailService;
