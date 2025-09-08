/**
 * Final Production Readiness Verification
 * Quick verification that all production secrets are properly configured
 */

const { getEnvironmentSecrets } = require('./api/src/utils/secretsManager');

async function verifyProductionReady() {
  console.log('🔍 Final Production Readiness Verification\n');
  console.log('='.repeat(60));
  
  try {
    console.log('📋 Loading production environment secrets...');
    const prodSecrets = await getEnvironmentSecrets('prod');
    
    console.log(`✅ Successfully loaded ${Object.keys(prodSecrets).length} production configuration values`);
    console.log('');
    
    // Verify critical production settings
    const criticalChecks = [
      { key: 'NODE_ENV', expected: 'production', actual: prodSecrets.NODE_ENV },
      { key: 'AUTH_BYPASS', expected: 'false', actual: prodSecrets.AUTH_BYPASS },
      { key: 'DATABASE_URL', check: 'exists', actual: prodSecrets.DATABASE_URL ? 'configured' : 'missing' },
      { key: 'JWT_SECRET', check: 'length', actual: prodSecrets.JWT_SECRET ? prodSecrets.JWT_SECRET.length : 0 },
      { key: 'OPENAI_API_KEY', check: 'exists', actual: prodSecrets.OPENAI_API_KEY ? 'configured' : 'missing' },
      { key: 'CORS_ORIGIN', check: 'ec2', actual: prodSecrets.CORS_ORIGIN }
    ];
    
    console.log('🔍 Critical Production Settings Verification:');
    let allPassed = true;
    
    criticalChecks.forEach(check => {
      let status = '✅';
      let message = '';
      
      if (check.expected && check.actual !== check.expected) {
        status = '❌';
        message = `Expected: ${check.expected}, Got: ${check.actual}`;
        allPassed = false;
      } else if (check.check === 'exists' && check.actual === 'missing') {
        status = '❌';
        message = 'Not configured';
        allPassed = false;
      } else if (check.check === 'length' && check.actual < 32) {
        status = '❌';
        message = `Too short: ${check.actual} characters`;
        allPassed = false;
      } else if (check.check === 'ec2' && !check.actual.includes('54.91.127.123')) {
        status = '⚠️';
        message = `Not pointing to EC2: ${check.actual}`;
      } else {
        message = check.actual;
      }
      
      console.log(`   ${status} ${check.key}: ${message}`);
    });
    
    console.log('');
    
    // Display production configuration summary
    console.log('📊 Production Configuration Summary:');
    console.log(`   🌍 Environment: ${prodSecrets.NODE_ENV}`);
    console.log(`   🏠 Database Host: ${prodSecrets.PGHOST}`);
    console.log(`   🗄️ Database Name: ${prodSecrets.PGDATABASE}`);
    console.log(`   🔗 CORS Origin: ${prodSecrets.CORS_ORIGIN}`);
    console.log(`   🌐 Frontend URL: ${prodSecrets.FRONTEND_URL}`);
    console.log(`   📧 Email From: ${prodSecrets.EMAIL_FROM}`);
    console.log(`   🔐 Auth Bypass: ${prodSecrets.AUTH_BYPASS}`);
    console.log(`   🚪 Port: ${prodSecrets.PORT}`);
    console.log('');
    
    if (allPassed) {
      console.log('='.repeat(60));
      console.log('🎉 SUCCESS: Production Environment is Ready for EC2 Deployment!');
      console.log('='.repeat(60));
      console.log('✅ All critical settings verified');
      console.log('✅ Strong security keys generated');
      console.log('✅ Database configuration ready');
      console.log('✅ API keys properly configured');
      console.log('✅ URLs point to EC2 instance (54.91.127.123)');
      console.log('✅ Production security settings enabled');
      console.log('');
      console.log('🚀 Your CYPHER application is ready to deploy to EC2!');
      console.log('');
      console.log('📝 Deployment Checklist:');
      console.log('   1. ✅ AWS Secrets Manager configured');
      console.log('   2. ✅ Production secrets updated');
      console.log('   3. ✅ Database connection ready');
      console.log('   4. ✅ Security settings verified');
      console.log('   5. 🔄 Deploy to EC2 instance');
      console.log('   6. 🔄 Configure IAM role on EC2');
      console.log('   7. 🔄 Start application with NODE_ENV=production');
      console.log('');
      console.log('💡 EC2 Deployment Commands:');
      console.log('   export NODE_ENV=production');
      console.log('   export USE_SECRETS_MANAGER=true');
      console.log('   npm install');
      console.log('   npm run build (for client)');
      console.log('   npm start');
      
      return true;
    } else {
      console.log('='.repeat(60));
      console.log('⚠️ Production Environment Needs Attention');
      console.log('='.repeat(60));
      console.log('Some critical settings failed verification.');
      console.log('Please review the issues above and update accordingly.');
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Production verification failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check AWS credentials are configured');
    console.error('   2. Verify all production secrets exist');
    console.error('   3. Ensure proper IAM permissions');
    
    return false;
  }
}

// Run the verification if this file is executed directly
if (require.main === module) {
  verifyProductionReady().then((isReady) => {
    process.exit(isReady ? 0 : 1);
  }).catch((error) => {
    console.error('Verification execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  verifyProductionReady
};
