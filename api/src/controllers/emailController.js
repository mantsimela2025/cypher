const emailService = require('../services/emailService');
const { validationResult } = require('express-validator');

class EmailController {
  async sendTestEmail(req, res) {
    try {
      // ✅ CORRECT: Validation check
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { recipientEmail, senderEmail } = req.body;
      
      console.log(`🔄 Sending test email to: ${recipientEmail}`);
      const result = await emailService.sendTestEmail(recipientEmail, senderEmail);
      
      // ✅ CORRECT: Structured success response
      res.status(200).json({
        success: true,
        data: result,
        message: 'Test email sent successfully'
      });
    } catch (error) {
      console.error('Error in sendTestEmail:', error);
      
      // ✅ CORRECT: Handle specific SES errors
      if (error.code === 'MessageRejected') {
        return res.status(400).json({
          success: false,
          error: 'Email rejected - check recipient email address or sender verification'
        });
      } else if (error.code === 'SendingPausedException') {
        return res.status(429).json({
          success: false,
          error: 'Email sending is paused for your account'
        });
      } else if (error.code === 'Throttling') {
        return res.status(429).json({
          success: false,
          error: 'Email sending rate limit exceeded'
        });
      }
      
      // ✅ CORRECT: Structured error response
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send test email',
        timestamp: new Date().toISOString()
      });
    }
  }

  async sendNotificationEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { recipientEmail, subject, message, senderEmail } = req.body;
      
      console.log(`🔄 Sending notification email: "${subject}"`);
      const result = await emailService.sendNotificationEmail(recipientEmail, subject, message, senderEmail);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Notification email sent successfully'
      });
    } catch (error) {
      console.error('Error in sendNotificationEmail:', error);
      
      // Handle SES-specific errors
      if (error.code === 'MessageRejected') {
        return res.status(400).json({
          success: false,
          error: 'Email rejected - check recipient email address or sender verification'
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send notification email'
      });
    }
  }

  async getSESStatus(req, res) {
    try {
      console.log('🔄 Fetching SES status...');
      
      const [quota, identities] = await Promise.all([
        emailService.getSESQuota(),
        emailService.getVerifiedIdentities()
      ]);
      
      const status = {
        quota: quota.quota,
        statistics: quota.statistics,
        identities: identities.identities,
        verificationStatus: identities.verificationStatus,
        isConfigured: identities.identities.length > 0,
        lastUpdated: new Date().toISOString()
      };
      
      res.status(200).json({
        success: true,
        data: status,
        message: 'SES status retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getSESStatus:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve SES status'
      });
    }
  }

  async sendBulkEmails(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { recipients, subject, message, senderEmail } = req.body;
      
      // ✅ CORRECT: Input validation
      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Recipients must be a non-empty array'
        });
      }
      
      if (recipients.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send to more than 50 recipients at once'
        });
      }
      
      console.log(`🔄 Sending bulk emails to ${recipients.length} recipients`);
      const result = await emailService.bulkSendEmails(recipients, subject, message, senderEmail);
      
      res.status(200).json({
        success: result.success,
        data: result,
        message: `Bulk email completed. ${result.totalSent} sent, ${result.totalErrors} failed.`
      });
    } catch (error) {
      console.error('Error in sendBulkEmails:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send bulk emails'
      });
    }
  }

  async getEmailTemplates(req, res) {
    try {
      // Predefined email templates for testing
      const templates = {
        'welcome': {
          id: 'welcome',
          name: 'Welcome Email',
          subject: 'Welcome to RAS Dashboard!',
          message: `
            <p>Welcome to the RAS Dashboard!</p>
            <p>Your account has been successfully created and you can now access all the features.</p>
            <ul>
              <li>View vulnerability assessments</li>
              <li>Manage assets and inventory</li>
              <li>Generate reports</li>
            </ul>
            <p>If you have any questions, please contact your administrator.</p>
          `
        },
        'alert': {
          id: 'alert',
          name: 'Security Alert',
          subject: 'Security Alert - Action Required',
          message: `
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px;">
              <h3 style="color: #856404;">⚠️ Security Alert</h3>
              <p>A security event has been detected that requires your attention.</p>
              <p><strong>Event Type:</strong> High-risk vulnerability detected</p>
              <p><strong>Severity:</strong> Critical</p>
              <p>Please log into the dashboard to review the details and take appropriate action.</p>
            </div>
          `
        },
        'report': {
          id: 'report',
          name: 'Weekly Report',
          subject: 'Weekly Security Report',
          message: `
            <h3>📊 Weekly Security Report</h3>
            <p>Here's your weekly security summary:</p>
            <table style="border-collapse: collapse; width: 100%;">
              <tr style="background-color: #f8f9fa;">
                <td style="border: 1px solid #dee2e6; padding: 8px;"><strong>New Vulnerabilities</strong></td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">12</td>
              </tr>
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 8px;"><strong>Critical Issues</strong></td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">3</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="border: 1px solid #dee2e6; padding: 8px;"><strong>Assets Scanned</strong></td>
                <td style="border: 1px solid #dee2e6; padding: 8px;">148</td>
              </tr>
            </table>
            <p>For detailed information, please visit the dashboard.</p>
          `
        }
      };
      
      res.status(200).json({
        success: true,
        data: Object.values(templates),
        message: 'Email templates retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getEmailTemplates:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve email templates'
      });
    }
  }

  async getEmailLogs(req, res) {
    try {
      const { page = 1, limit = 10, status, category, startDate, endDate } = req.query;
      
      console.log('🔄 Fetching email logs...');
      const result = await emailService.getEmailLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        category,
        startDate,
        endDate
      });
      
      res.status(200).json({
        success: true,
        data: result.logs,
        meta: {
          total: result.total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(result.total / parseInt(limit))
        },
        message: 'Email logs retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getEmailLogs:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve email logs'
      });
    }
  }

  async getEmailStats(req, res) {
    try {
      console.log('🔄 Fetching email statistics...');
      const stats = await emailService.getEmailStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Email statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error in getEmailStats:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve email statistics'
      });
    }
  }

  async sendTestEmails(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { count = 5, senderEmail } = req.body;
      
      // Validate count
      if (count > 10) {
        return res.status(400).json({
          success: false,
          error: 'Cannot send more than 10 test emails at once'
        });
      }
      
      console.log(`🔄 Sending ${count} test emails for logging demonstration`);
      
      // Generate test recipients and send emails
      const testEmails = [];
      const templates = ['welcome', 'alert', 'report'];
      
      for (let i = 0; i < count; i++) {
        const template = templates[i % templates.length];
        const testEmail = `test.user${i + 1}@example.com`;
        
        try {
          let result;
          if (template === 'welcome') {
            result = await emailService.sendNotificationEmail(
              testEmail,
              'Welcome to RAS Dashboard!',
              '<p>This is a test welcome email for logging demonstration.</p>',
              senderEmail
            );
          } else if (template === 'alert') {
            result = await emailService.sendNotificationEmail(
              testEmail,
              'Security Alert - Test',
              '<div style="color: #d63384;"><strong>⚠️ This is a test security alert for logging demonstration.</strong></div>',
              senderEmail
            );
          } else {
            result = await emailService.sendNotificationEmail(
              testEmail,
              'Weekly Report - Test',
              '<h3>📊 This is a test report for logging demonstration</h3>',
              senderEmail
            );
          }
          
          testEmails.push({
            recipient: testEmail,
            template,
            status: 'sent',
            messageId: result.messageId
          });
        } catch (emailError) {
          console.warn(`Failed to send test email to ${testEmail}:`, emailError.message);
          testEmails.push({
            recipient: testEmail,
            template,
            status: 'failed',
            error: emailError.message
          });
        }
      }
      
      const successCount = testEmails.filter(e => e.status === 'sent').length;
      const failCount = testEmails.filter(e => e.status === 'failed').length;
      
      res.status(200).json({
        success: true,
        data: {
          sent: successCount,
          failed: failCount,
          emails: testEmails
        },
        message: `Test emails completed. ${successCount} sent, ${failCount} failed.`
      });
    } catch (error) {
      console.error('Error in sendTestEmails:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send test emails'
      });
    }
  }
}

module.exports = new EmailController();