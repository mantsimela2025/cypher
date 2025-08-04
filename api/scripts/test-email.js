#!/usr/bin/env node

const emailService = require('../src/services/emailService');
const notificationService = require('../src/services/notificationService');

async function testEmailService() {
  console.log('🧪 Testing Email Service Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Get provider information
    const providerInfo = emailService.getProviderInfo();
    console.log('\n📧 Email Provider Information:');
    console.log(`  Provider: ${providerInfo.provider}`);
    console.log(`  From Email: ${providerInfo.fromEmail}`);
    console.log(`  From Name: ${providerInfo.fromName}`);
    console.log(`  Configured: ${providerInfo.configured}`);

    // Test connection
    console.log('\n🔌 Testing Connection...');
    const connectionTest = await emailService.testConnection();
    
    if (connectionTest.success) {
      console.log('  ✅ Connection successful');
      console.log(`  📝 Message: ${connectionTest.message}`);
    } else {
      console.log('  ❌ Connection failed');
      console.log(`  📝 Error: ${connectionTest.error}`);
      return;
    }

    // Test basic email sending
    const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER || process.env.ADMIN_EMAIL;
    
    if (!testEmail) {
      console.log('\n⚠️  No test email configured. Set TEST_EMAIL in .env to test email sending.');
      return;
    }

    console.log(`\n📤 Sending test email to: ${testEmail}`);
    
    const testResult = await emailService.sendEmail({
      to: testEmail,
      subject: 'RAS Dashboard - Email Service Test',
      text: 'This is a test email from the RAS Dashboard email service. If you receive this, the email configuration is working correctly!',
      html: `
        <h2>Email Service Test</h2>
        <p>This is a test email from the RAS Dashboard email service.</p>
        <p>If you receive this, the email configuration is working correctly!</p>
        <hr>
        <p><small>Provider: ${providerInfo.provider}</small></p>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `
    });

    if (testResult.success) {
      console.log('  ✅ Test email sent successfully');
      console.log(`  📝 Message ID: ${testResult.messageId}`);
      console.log(`  📝 Provider: ${testResult.provider}`);
    } else {
      console.log('  ❌ Test email failed');
      console.log(`  📝 Error: ${testResult.error}`);
    }

  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

async function testNotificationTemplates() {
  console.log('\n\n🎨 Testing Email Templates');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const testEmail = process.env.TEST_EMAIL || process.env.EMAIL_USER || process.env.ADMIN_EMAIL;
  
  if (!testEmail) {
    console.log('⚠️  No test email configured. Skipping template tests.');
    return;
  }

  try {
    // Test welcome email template
    console.log('\n📧 Testing Welcome Email Template...');
    const welcomeResult = await notificationService.sendWelcomeEmail({
      email: testEmail,
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });

    if (welcomeResult.success) {
      console.log('  ✅ Welcome email sent successfully');
    } else {
      console.log('  ❌ Welcome email failed');
    }

    // Test access request notification
    console.log('\n📧 Testing Access Request Notification...');
    const accessRequestResult = await notificationService.sendAccessRequestNotification({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      reason: 'Need access for testing purposes',
      createdAt: new Date()
    }, [testEmail]);

    if (accessRequestResult.success) {
      console.log('  ✅ Access request notification sent successfully');
    } else {
      console.log('  ❌ Access request notification failed');
    }

  } catch (error) {
    console.error('❌ Template test failed:', error.message);
  }
}

async function showEmailConfiguration() {
  console.log('\n\n⚙️  Email Configuration Guide');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n📋 Available Providers:');
  console.log('  1. MailerSend API (Currently configured)');
  console.log('     - Set MAILERSEND_API_KEY in .env');
  console.log('     - Fast and reliable');
  console.log('');
  console.log('  2. SMTP (Gmail, Outlook, etc.)');
  console.log('     - Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD');
  console.log('     - Works with any SMTP provider');
  console.log('');
  console.log('  3. SendGrid API');
  console.log('     - Set SENDGRID_API_KEY in .env');
  console.log('     - High deliverability');
  console.log('');
  console.log('  4. Mailgun API');
  console.log('     - Set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env');
  console.log('     - Good for bulk emails');

  console.log('\n🔧 Current Configuration:');
  const hasMailerSend = !!process.env.MAILERSEND_API_KEY;
  const hasSMTP = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
  const hasSendGrid = !!process.env.SENDGRID_API_KEY;
  const hasMailgun = !!(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);

  console.log(`  MailerSend: ${hasMailerSend ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  SMTP: ${hasSMTP ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  SendGrid: ${hasSendGrid ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`  Mailgun: ${hasMailgun ? '✅ Configured' : '❌ Not configured'}`);

  console.log('\n💡 Usage Examples:');
  console.log('  # Test email configuration');
  console.log('  npm run test:email');
  console.log('');
  console.log('  # Test with specific email');
  console.log('  TEST_EMAIL=your@email.com npm run test:email');
  console.log('');
  console.log('  # In your code:');
  console.log('  const notificationService = require("./src/services/notificationService");');
  console.log('  await notificationService.sendWelcomeEmail(userData);');
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🧪 Email Service Test Tool');
    console.log('');
    console.log('Usage: npm run test:email [options]');
    console.log('');
    console.log('Options:');
    console.log('  --config, -c      Show configuration guide');
    console.log('  --templates, -t   Test email templates only');
    console.log('  --help, -h        Show this help');
    console.log('');
    console.log('Environment Variables:');
    console.log('  TEST_EMAIL        Email address to send test emails to');
    console.log('');
    console.log('Examples:');
    console.log('  npm run test:email');
    console.log('  TEST_EMAIL=admin@example.com npm run test:email');
    console.log('  npm run test:email --config');
    return;
  }

  if (args.includes('--config') || args.includes('-c')) {
    showEmailConfiguration();
    return;
  }

  if (args.includes('--templates') || args.includes('-t')) {
    await testNotificationTemplates();
    return;
  }

  // Run all tests
  await testEmailService();
  await testNotificationTemplates();
  showEmailConfiguration();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the tests
main();
