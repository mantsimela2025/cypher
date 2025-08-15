const AWS = require('aws-sdk');
const { db } = require('../db');
const { users, emailLogs } = require('../db/schema');
const { eq, desc, sql, and, gte, lte } = require('drizzle-orm');

// Configure AWS SES
const ses = new AWS.SES({
  region: process.env.AWS_REGION || 'us-east-1',
});

class EmailService {
  async sendTestEmail(recipientEmail, senderEmail = 'jerome.harrison@redarchsolutions.com') {
    try {
      console.log(`📧 Sending test email from ${senderEmail} to ${recipientEmail}`);
      
      const params = {
        Source: senderEmail,
        Destination: {
          ToAddresses: [recipientEmail],
        },
        Message: {
          Subject: {
            Data: 'Test Email from RAS Dashboard',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <body>
                    <h2>Test Email from RAS Dashboard</h2>
                    <p>Hello!</p>
                    <p>This is a test email sent from the RAS Dashboard application using Amazon SES.</p>
                    <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
                    <hr>
                    <p><small>This email was sent for testing purposes.</small></p>
                  </body>
                </html>
              `,
              Charset: 'UTF-8',
            },
            Text: {
              Data: `
Test Email from RAS Dashboard

Hello!

This is a test email sent from the RAS Dashboard application using Amazon SES.

Sent at: ${new Date().toLocaleString()}

This email was sent for testing purposes.
              `,
              Charset: 'UTF-8',
            },
          },
        },
      };

      const result = await ses.sendEmail(params).promise();
      console.log(`✅ Email sent successfully! Message ID: ${result.MessageId}`);
      
      // ✅ CORRECT: Log email to database
      await this.logEmail({
        messageId: result.MessageId,
        recipientEmail,
        senderEmail,
        subject: 'Test Email from RAS Dashboard',
        category: 'test',
        status: 'sent',
        metadata: {
          emailType: 'test',
          timestamp: new Date().toISOString()
        }
      });
      
      return {
        success: true,
        messageId: result.MessageId,
        recipient: recipientEmail,
        sender: senderEmail,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }
  }

  async sendNotificationEmail(recipientEmail, subject, message, senderEmail = 'jerome.harrison@redarchsolutions.com') {
    try {
      console.log(`📧 Sending notification email: "${subject}"`);
      
      const params = {
        Source: senderEmail,
        Destination: {
          ToAddresses: [recipientEmail],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <body>
                    <h2>${subject}</h2>
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                      ${message}
                    </div>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                      <strong>Sent from:</strong> RAS Dashboard<br>
                      <strong>Time:</strong> ${new Date().toLocaleString()}
                    </p>
                  </body>
                </html>
              `,
              Charset: 'UTF-8',
            },
            Text: {
              Data: `
${subject}

${message.replace(/<[^>]*>/g, '')}

---
Sent from: RAS Dashboard
Time: ${new Date().toLocaleString()}
              `,
              Charset: 'UTF-8',
            },
          },
        },
      };

      const result = await ses.sendEmail(params).promise();
      console.log(`✅ Notification email sent! Message ID: ${result.MessageId}`);
      
      // ✅ CORRECT: Log email to database
      await this.logEmail({
        messageId: result.MessageId,
        recipientEmail,
        senderEmail,
        subject,
        category: 'notification',
        status: 'sent',
        metadata: {
          emailType: 'notification',
          messageLength: message.length,
          timestamp: new Date().toISOString()
        }
      });
      
      return {
        success: true,
        messageId: result.MessageId,
        recipient: recipientEmail,
        subject,
        sentAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error sending notification email:', error);
      throw error;
    }
  }

  async getSESQuota() {
    try {
      const quota = await ses.getSendQuota().promise();
      const statistics = await ses.getSendStatistics().promise();
      
      return {
        quota: {
          max24HourSend: quota.Max24HourSend,
          maxSendRate: quota.MaxSendRate,
          sentLast24Hours: quota.SentLast24Hours,
        },
        statistics: statistics.SendDataPoints || [],
      };
    } catch (error) {
      console.error('❌ Error getting SES quota:', error);
      throw error;
    }
  }

  async getVerifiedIdentities() {
    try {
      const identities = await ses.listIdentities().promise();
      const verificationAttributes = await ses.getIdentityVerificationAttributes({
        Identities: identities.Identities,
      }).promise();

      return {
        identities: identities.Identities,
        verificationStatus: verificationAttributes.VerificationAttributes,
      };
    } catch (error) {
      console.error('❌ Error getting verified identities:', error);
      throw error;
    }
  }

  async bulkSendEmails(recipients, subject, message, senderEmail = 'jerome.harrison@redarchsolutions.com') {
    try {
      console.log(`📧 Sending bulk emails to ${recipients.length} recipients`);
      
      const results = [];
      const errors = [];
      
      for (const recipient of recipients) {
        try {
          const result = await this.sendNotificationEmail(recipient, subject, message, senderEmail);
          results.push(result);
          
          // Add small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds (under 1 email/sec limit)
        } catch (error) {
          console.error(`❌ Failed to send email to ${recipient}:`, error);
          errors.push({
            recipient,
            error: error.message,
          });
        }
      }
      
      return {
        success: errors.length === 0,
        totalSent: results.length,
        totalErrors: errors.length,
        results,
        errors,
      };
    } catch (error) {
      console.error('❌ Error in bulk email send:', error);
      throw error;
    }
  }

  /**
   * Log email to database using existing schema
   * @param {Object} emailData - Email data to log
   */
  async logEmail(emailData) {
    try {
      const {
        messageId,
        recipientEmail,
        senderEmail,
        subject,
        category,
        status,
        body = '',
        htmlBody = '',
        responseMessage = '',
        metadata = {}
      } = emailData;

      console.log('📧 Attempting to log email to database...', {
        subject,
        recipientEmail,
        senderEmail,
        category,
        status
      });
      
      // ✅ CORRECT: Use Drizzle ORM insert method following the guide
      const result = await db.insert(emailLogs)
        .values({
          subject: subject || 'No Subject',
          from: senderEmail || 'noreply@redarchsolutions.com',
          to: recipientEmail,
          body: body,
          htmlBody: htmlBody,
          status: status || 'sent',
          category: category || 'notification',
          serviceName: 'SES',
          responseMessage: responseMessage || messageId || ''
        })
        .returning();
      
      console.log('✅ Email logged to database successfully:', result.length > 0 ? result[0].id : 'No ID');
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('❌ Error logging email:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        detail: error.detail
      });
      // Don't throw here to prevent email sending from failing
      return null;
    }
  }

  /**
   * Get email logs with filtering and pagination
   * @param {Object} options - Query options
   */
  async getEmailLogs(options = {}) {
    try {
      console.log('📊 Fetching email logs with options:', options);
      
      const {
        page = 1,
        limit = 10,
        status,
        category,
        startDate,
        endDate
      } = options;

      // ✅ CORRECT: Use Drizzle ORM select following the guide patterns
      let query = db.select({
        id: emailLogs.id,
        subject: emailLogs.subject,
        sender: emailLogs.from,
        recipient: emailLogs.to,
        status: emailLogs.status,
        category: emailLogs.category,
        serviceName: emailLogs.serviceName,
        responseMessage: emailLogs.responseMessage,
        createdAt: emailLogs.createdAt,
        updatedAt: emailLogs.updatedAt
      }).from(emailLogs);

      // ✅ CORRECT: Build WHERE conditions using Drizzle operators
      const whereConditions = [];
      
      if (status) {
        whereConditions.push(eq(emailLogs.status, status));
      }
      if (category) {
        whereConditions.push(eq(emailLogs.category, category));
      }
      if (startDate) {
        whereConditions.push(gte(emailLogs.createdAt, new Date(startDate)));
      }
      if (endDate) {
        whereConditions.push(lte(emailLogs.createdAt, new Date(endDate)));
      }

      // Apply WHERE conditions if any exist
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }

      // Order by creation date descending
      query = query.orderBy(desc(emailLogs.createdAt));

      // Execute query to get all logs
      const allLogs = await query.execute ? await query.execute() : await query;
      console.log(`📧 Found ${allLogs ? allLogs.length : 0} email logs in database`);
      
      // Handle case where query returns null/undefined
      const logsArray = Array.isArray(allLogs) ? allLogs : [];
      const total = logsArray.length;
      
      // Apply pagination
      const offset = (page - 1) * limit;
      const logs = logsArray.slice(offset, offset + limit);

      return {
        logs,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('❌ Error fetching email logs:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code
      });
      throw error;
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats() {
    try {
      const result = await db.execute(sql`
        SELECT
          COUNT(*) as total_emails,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_emails,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_emails,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_emails,
          COUNT(CASE WHEN category = 'test' THEN 1 END) as test_emails,
          COUNT(CASE WHEN category = 'notification' THEN 1 END) as notification_emails,
          COUNT(CASE WHEN category = 'welcome' THEN 1 END) as welcome_emails,
          COUNT(CASE WHEN category = 'alert' THEN 1 END) as alert_emails,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as emails_last_24h,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as emails_last_7d
        FROM email_logs
      `);

      const stats = (result && result[0]) || {};

      // Convert counts to numbers
      Object.keys(stats).forEach(key => {
        stats[key] = parseInt(stats[key]) || 0;
      });

      return {
        totalEmails: stats.total_emails || 0,
        sentEmails: stats.sent_emails || 0,
        failedEmails: stats.failed_emails || 0,
        deliveredEmails: stats.delivered_emails || 0,
        bouncedEmails: 0, // Not supported by enum
        testEmails: stats.test_emails || 0,
        notificationEmails: stats.notification_emails || 0,
        welcomeEmails: stats.welcome_emails || 0,
        alertEmails: stats.alert_emails || 0,
        emailsLast24h: stats.emails_last_24h || 0,
        emailsLast7d: stats.emails_last_7d || 0,
        successRate: stats.total_emails > 0 ? Math.round((stats.sent_emails / stats.total_emails) * 100) : 0
      };
    } catch (error) {
      console.error('Error fetching email statistics:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
