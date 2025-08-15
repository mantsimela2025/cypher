const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const EmailService = require('../src/services/emailService');

async function testAWSSES() {
  console.log('🧪 Testing AWS SES Email Service...');
  console.log('=====================================\n');

  try {
    // Check environment configuration
    console.log('📊 Environment Check:');
    console.log(`AWS_SES_REGION: ${process.env.AWS_SES_REGION || 'Not set'}`);
    console.log(`AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set'}`);
    console.log(`AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set'}`);
    console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
    console.log(`EMAIL_FROM_NAME: ${process.env.EMAIL_FROM_NAME || 'Not set'}\n`);

    // Initialize email service
    console.log('🔄 Initializing EmailService...');
    const emailService = require('../src/services/emailService');
    
    console.log(`📧 Email provider selected: ${emailService.provider}`);
    
    if (emailService.provider !== 'aws-ses') {
      console.log('❌ AWS SES is not the selected provider. Check your environment configuration.');
      console.log('💡 Ensure AWS_SES_REGION is set and AWS credentials are available.');
      return;
    }

    // Test email parameters
    const testEmail = {
      to: 'test@example.com', // This would be a real email in production
      subject: 'AWS SES Test Email - Access Request System',
      text: 'This is a test email from the Access Request System using AWS SES.',
      html: `
        <h2>AWS SES Test Email</h2>
        <p>This is a test email from the <strong>Access Request System</strong> using AWS SES.</p>
        <p>If you're receiving this, AWS SES integration is working correctly!</p>
        <hr>
        <p><em>Sent at: ${new Date().toISOString()}</em></p>
      `,
      senderEmail: process.env.EMAIL_FROM || 'noreply@rasdash.com',
      senderName: process.env.EMAIL_FROM_NAME || 'RAS Dashboard'
    };

    console.log('📧 Test Email Details:');
    console.log(`To: ${testEmail.to}`);
    console.log(`Subject: ${testEmail.subject}`);
    console.log(`From: ${testEmail.senderName} <${testEmail.senderEmail}>\n`);

    // Send test email
    console.log('📤 Sending test email...');
    const result = await emailService.sendEmail(testEmail);

    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
      console.log(`Provider: ${result.provider}`);
      console.log('\n🎉 AWS SES integration is working correctly!');
    } else {
      console.log('❌ Email sending failed');
      console.log('Result:', result);
    }

  } catch (error) {
    console.error('❌ Error testing AWS SES:', error.message);
    
    if (error.message.includes('AWS SDK not found')) {
      console.log('\n💡 Solution: Install AWS SDK');
      console.log('Run: npm install @aws-sdk/client-ses');
      console.log('Or: npm install aws-sdk (for v2)');
    } else if (error.message.includes('Unable to locate credentials')) {
      console.log('\n💡 AWS Credentials Help:');
      console.log('1. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
      console.log('2. Or use AWS CLI: aws configure');
      console.log('3. Or use AWS instance profile (if running on EC2)');
    } else if (error.message.includes('Email address not verified')) {
      console.log('\n💡 AWS SES Verification Help:');
      console.log('1. Verify sender email in AWS SES console');
      console.log('2. Or move out of SES sandbox mode');
    }
    
    console.log('\n🔍 Development Fallback:');
    console.log('The system will fall back to MailerSend or console logging in development mode.');
  }
}

// Run the test
testAWSSES().catch(console.error);