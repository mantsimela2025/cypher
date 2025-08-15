const axios = require('axios');
require('dotenv').config();

async function testMailerSend() {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'noreply@rasdash.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'RAS Dashboard';
  
  console.log('🧪 Testing MailerSend Configuration');
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not provided');
  console.log('From Email:', fromEmail);
  console.log('From Name:', fromName);
  
  if (!apiKey) {
    console.error('❌ MAILERSEND_API_KEY not found in environment');
    return;
  }
  
  try {
    // Test API key validity by getting account info
    console.log('\n📡 Testing API key validity...');
    const response = await axios.get('https://api.mailersend.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Key is valid');
    console.log('Account Info:', {
      name: response.data.data.name,
      email: response.data.data.email
    });
    
    // Test domain verification
    console.log('\n🔍 Checking domain verification...');
    const domainsResponse = await axios.get('https://api.mailersend.com/v1/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const domains = domainsResponse.data.data;
    const fromDomain = fromEmail.split('@')[1];
    const verifiedDomain = domains.find(d => d.name === fromDomain && d.domain_settings?.return_path_tracking === true);
    
    if (verifiedDomain) {
      console.log(`✅ Domain ${fromDomain} is verified and configured`);
      return testEmailSend(apiKey, fromEmail, fromName);
    } else {
      console.log(`⚠️  Domain ${fromDomain} not found or not fully verified`);
      console.log('Available domains:');
      domains.forEach(domain => {
        console.log(`  - ${domain.name} (verified: ${domain.domain_settings?.return_path_tracking ? 'Yes' : 'No'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ MailerSend test failed:', error.response?.data || error.message);
    console.log('\n💡 Possible solutions:');
    console.log('1. Check if API key is correct and active');
    console.log('2. Verify the sender domain in your MailerSend dashboard');
    console.log('3. Ensure the domain DNS records are properly configured');
  }
}

async function testEmailSend(apiKey, fromEmail, fromName) {
  try {
    console.log('\n📧 Testing email sending...');
    const payload = {
      from: {
        email: fromEmail,
        name: fromName
      },
      to: [{
        email: fromEmail, // Send to same email for testing
        name: 'Test Recipient'
      }],
      subject: 'MailerSend Test Email',
      html: '<h2>Test Email</h2><p>This is a test email to verify MailerSend configuration.</p>'
    };
    
    const response = await axios.post('https://api.mailersend.com/v1/email', payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', response.headers['x-message-id'] || 'Not provided');
  } catch (error) {
    console.error('❌ Email sending failed:', error.response?.data || error.message);
  }
}

// Run the test
testMailerSend().catch(console.error);