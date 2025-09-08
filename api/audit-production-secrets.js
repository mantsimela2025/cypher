/**
 * Production Secrets Audit Script
 * Checks if production secrets are properly configured for EC2 deployment
 */

const { getSecret } = require('./src/utils/secretsManager');

async function auditProductionSecrets() {
  console.log('🔍 Auditing Production Secrets for EC2 Deployment\n');
  console.log('='.repeat(70));
  
  const auditResults = {
    database: { status: 'unknown', issues: [] },
    apiKeys: { status: 'unknown', issues: [] },
    email: { status: 'unknown', issues: [] },
    appConfig: { status: 'unknown', issues: [] },
    clientConfig: { status: 'unknown', issues: [] },
    overall: { status: 'unknown', readyForProduction: false }
  };

  try {
    // Audit Database Configuration
    console.log('1️⃣ Auditing Production Database Configuration...');
    try {
      const dbSecret = await getSecret('cypher/prod/database');
      
      // Check for placeholder values
      const dbIssues = [];
      if (dbSecret.username === 'PROD_DB_USER') dbIssues.push('Username is placeholder');
      if (dbSecret.password === 'PROD_DB_PASSWORD') dbIssues.push('Password is placeholder');
      if (dbSecret.host === 'PROD_DB_HOST') dbIssues.push('Host is placeholder');
      if (dbSecret.dbname === 'PROD_DB_NAME') dbIssues.push('Database name is placeholder');
      
      if (dbIssues.length === 0) {
        console.log('   ✅ Database configuration looks ready');
        console.log(`   🏠 Host: ${dbSecret.host}`);
        console.log(`   🗄️ Database: ${dbSecret.dbname}`);
        console.log(`   👤 Username: ${dbSecret.username}`);
        auditResults.database.status = 'ready';
      } else {
        console.log('   ⚠️ Database configuration has placeholder values:');
        dbIssues.forEach(issue => console.log(`      - ${issue}`));
        auditResults.database.status = 'needs_update';
        auditResults.database.issues = dbIssues;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to retrieve database secret: ${error.message}`);
      auditResults.database.status = 'error';
      auditResults.database.issues = [error.message];
    }
    
    console.log('');

    // Audit API Keys
    console.log('2️⃣ Auditing Production API Keys...');
    try {
      const apiSecret = await getSecret('cypher/prod/api-keys');
      
      const apiIssues = [];
      if (apiSecret.OPENAI_API_KEY === 'PROD_OPENAI_KEY') apiIssues.push('OpenAI API key is placeholder');
      if (apiSecret.ANTHROPIC_API_KEY === 'PROD_ANTHROPIC_KEY') apiIssues.push('Anthropic API key is placeholder');
      if (!apiSecret.JWT_SECRET || apiSecret.JWT_SECRET.length < 32) apiIssues.push('JWT secret too short for production');
      if (!apiSecret.ENCRYPTION_KEY || apiSecret.ENCRYPTION_KEY.length < 32) apiIssues.push('Encryption key too short for production');
      
      if (apiIssues.length === 0) {
        console.log('   ✅ API keys configuration looks ready');
        console.log(`   🤖 OpenAI: ${apiSecret.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
        console.log(`   🧠 Anthropic: ${apiSecret.ANTHROPIC_API_KEY ? 'Configured' : 'Missing'}`);
        console.log(`   🔐 JWT Secret: ${apiSecret.JWT_SECRET ? 'Configured' : 'Missing'}`);
        auditResults.apiKeys.status = 'ready';
      } else {
        console.log('   ⚠️ API keys have issues:');
        apiIssues.forEach(issue => console.log(`      - ${issue}`));
        auditResults.apiKeys.status = 'needs_update';
        auditResults.apiKeys.issues = apiIssues;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to retrieve API keys: ${error.message}`);
      auditResults.apiKeys.status = 'error';
      auditResults.apiKeys.issues = [error.message];
    }
    
    console.log('');

    // Audit Email Configuration
    console.log('3️⃣ Auditing Production Email Configuration...');
    try {
      const emailSecret = await getSecret('cypher/prod/email');
      
      const emailIssues = [];
      if (emailSecret.EMAIL_USER === 'prod-email@company.com') emailIssues.push('Email user is placeholder');
      if (emailSecret.EMAIL_PASSWORD === 'PROD_EMAIL_PASSWORD') emailIssues.push('Email password is placeholder');
      if (emailSecret.EMAIL_FROM === 'noreply@company.com') emailIssues.push('From email is placeholder');
      if (emailSecret.ADMIN_EMAIL === 'admin@company.com') emailIssues.push('Admin email is placeholder');
      
      if (emailIssues.length === 0) {
        console.log('   ✅ Email configuration looks ready');
        console.log(`   📧 From: ${emailSecret.EMAIL_FROM}`);
        console.log(`   👨‍💼 Admin: ${emailSecret.ADMIN_EMAIL}`);
        auditResults.email.status = 'ready';
      } else {
        console.log('   ⚠️ Email configuration has placeholder values:');
        emailIssues.forEach(issue => console.log(`      - ${issue}`));
        auditResults.email.status = 'needs_update';
        auditResults.email.issues = emailIssues;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to retrieve email configuration: ${error.message}`);
      auditResults.email.status = 'error';
      auditResults.email.issues = [error.message];
    }
    
    console.log('');

    // Audit Application Configuration
    console.log('4️⃣ Auditing Production Application Configuration...');
    try {
      const appSecret = await getSecret('cypher/prod/app-config');
      
      const appIssues = [];
      if (appSecret.CORS_ORIGIN === 'https://your-domain.com') appIssues.push('CORS origin is placeholder');
      if (appSecret.FRONTEND_URL === 'https://your-domain.com') appIssues.push('Frontend URL is placeholder');
      if (appSecret.NODE_ENV !== 'production') appIssues.push('NODE_ENV should be "production"');
      if (appSecret.AUTH_BYPASS === 'true') appIssues.push('Auth bypass should be disabled in production');
      
      if (appIssues.length === 0) {
        console.log('   ✅ Application configuration looks ready');
        console.log(`   🌍 Environment: ${appSecret.NODE_ENV}`);
        console.log(`   🔗 CORS Origin: ${appSecret.CORS_ORIGIN}`);
        console.log(`   🔐 Auth Bypass: ${appSecret.AUTH_BYPASS}`);
        auditResults.appConfig.status = 'ready';
      } else {
        console.log('   ⚠️ Application configuration has issues:');
        appIssues.forEach(issue => console.log(`      - ${issue}`));
        auditResults.appConfig.status = 'needs_update';
        auditResults.appConfig.issues = appIssues;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to retrieve app configuration: ${error.message}`);
      auditResults.appConfig.status = 'error';
      auditResults.appConfig.issues = [error.message];
    }
    
    console.log('');

    // Audit Client Configuration
    console.log('5️⃣ Auditing Production Client Configuration...');
    try {
      const clientSecret = await getSecret('cypher/prod/client-config');
      
      const clientIssues = [];
      if (clientSecret.VITE_API_BASE_URL === 'https://api.your-domain.com/api/v1') clientIssues.push('API base URL is placeholder');
      if (clientSecret.VITE_ENABLE_DEV_TOOLS === 'true') clientIssues.push('Dev tools should be disabled in production');
      if (clientSecret.VITE_ENABLE_CONSOLE_LOGS === 'true') clientIssues.push('Console logs should be disabled in production');
      
      if (clientIssues.length === 0) {
        console.log('   ✅ Client configuration looks ready');
        console.log(`   🌐 API URL: ${clientSecret.VITE_API_BASE_URL}`);
        console.log(`   🛠️ Dev Tools: ${clientSecret.VITE_ENABLE_DEV_TOOLS}`);
        auditResults.clientConfig.status = 'ready';
      } else {
        console.log('   ⚠️ Client configuration has issues:');
        clientIssues.forEach(issue => console.log(`      - ${issue}`));
        auditResults.clientConfig.status = 'needs_update';
        auditResults.clientConfig.issues = clientIssues;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed to retrieve client configuration: ${error.message}`);
      auditResults.clientConfig.status = 'error';
      auditResults.clientConfig.issues = [error.message];
    }
    
    console.log('');

    // Overall Assessment
    const readyComponents = Object.values(auditResults).filter(r => r.status === 'ready').length - 1; // -1 for overall
    const totalComponents = Object.keys(auditResults).length - 1; // -1 for overall
    const hasErrors = Object.values(auditResults).some(r => r.status === 'error');
    const needsUpdates = Object.values(auditResults).some(r => r.status === 'needs_update');
    
    auditResults.overall.readyForProduction = readyComponents === totalComponents && !hasErrors;
    auditResults.overall.status = auditResults.overall.readyForProduction ? 'ready' : 'needs_work';

    console.log('='.repeat(70));
    console.log('📊 Production Readiness Assessment');
    console.log('='.repeat(70));
    console.log(`🗄️ Database: ${auditResults.database.status.toUpperCase()}`);
    console.log(`🔑 API Keys: ${auditResults.apiKeys.status.toUpperCase()}`);
    console.log(`📧 Email: ${auditResults.email.status.toUpperCase()}`);
    console.log(`⚙️ App Config: ${auditResults.appConfig.status.toUpperCase()}`);
    console.log(`📱 Client Config: ${auditResults.clientConfig.status.toUpperCase()}`);
    console.log('');
    
    if (auditResults.overall.readyForProduction) {
      console.log('🎉 SUCCESS: Your production secrets are ready for EC2 deployment!');
      console.log('');
      console.log('✅ All configurations are properly set');
      console.log('✅ No placeholder values detected');
      console.log('✅ Security settings are production-ready');
      console.log('');
      console.log('🚀 You can safely deploy to your EC2 instance!');
    } else {
      console.log('⚠️ ATTENTION: Production secrets need updates before EC2 deployment');
      console.log('');
      console.log('📝 Issues to resolve:');
      
      Object.entries(auditResults).forEach(([component, result]) => {
        if (result.issues && result.issues.length > 0) {
          console.log(`   ${component.toUpperCase()}:`);
          result.issues.forEach(issue => console.log(`      - ${issue}`));
        }
      });
      
      console.log('');
      console.log('💡 Next steps:');
      console.log('   1. Update placeholder values with real production values');
      console.log('   2. Run this audit again to verify');
      console.log('   3. Deploy to EC2 once all issues are resolved');
    }
    
    return auditResults;
    
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    return { error: error.message, auditResults };
  }
}

// Run the audit if this file is executed directly
if (require.main === module) {
  auditProductionSecrets().then((results) => {
    const isReady = results.overall?.readyForProduction;
    process.exit(isReady ? 0 : 1);
  }).catch((error) => {
    console.error('Audit execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  auditProductionSecrets
};
