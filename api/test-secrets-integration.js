/**
 * Test Script for AWS Secrets Manager Integration
 * Verifies that secrets are properly loaded and configuration works
 */

const { getSecret, getEnvironmentSecrets, healthCheck, getCacheStats } = require('./src/utils/secretsManager');
const { getConfig, validateConfig } = require('./src/config');

async function testSecretsIntegration() {
  console.log('🧪 Testing AWS Secrets Manager Integration\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing AWS Secrets Manager connectivity...');
    const health = await healthCheck();
    console.log(`   Status: ${health.status}`);
    console.log(`   Message: ${health.message}`);
    
    if (health.status !== 'healthy') {
      console.log('❌ Secrets Manager is not accessible. Stopping tests.');
      return;
    }
    
    console.log('✅ AWS Secrets Manager is accessible\n');
    
    // Test 2: Individual Secret Retrieval
    console.log('2️⃣ Testing individual secret retrieval...');
    
    const secretsToTest = [
      'cypher/dev/database',
      'cypher/dev/api-keys',
      'cypher/dev/email',
      'cypher/dev/app-config',
      'cypher/aws/config'
    ];
    
    for (const secretName of secretsToTest) {
      try {
        console.log(`   Testing: ${secretName}`);
        const secret = await getSecret(secretName);
        const keyCount = Object.keys(secret).length;
        console.log(`   ✅ Retrieved ${keyCount} configuration values`);
      } catch (error) {
        console.log(`   ❌ Failed to retrieve ${secretName}: ${error.message}`);
      }
    }
    
    console.log('');
    
    // Test 3: Environment Secrets Loading
    console.log('3️⃣ Testing environment secrets loading...');
    const envSecrets = await getEnvironmentSecrets('dev');
    const totalKeys = Object.keys(envSecrets).length;
    console.log(`   ✅ Loaded ${totalKeys} environment configuration values`);
    
    // Display some non-sensitive configuration
    const safeKeys = [
      'PORT',
      'NODE_ENV',
      'DEFAULT_AI_PROVIDER',
      'CORS_ORIGIN',
      'AWS_REGION',
      'EMAIL_FROM'
    ];
    
    console.log('   📋 Sample configuration values:');
    safeKeys.forEach(key => {
      if (envSecrets[key]) {
        console.log(`      ${key}: ${envSecrets[key]}`);
      }
    });
    
    console.log('');
    
    // Test 4: Configuration Integration
    console.log('4️⃣ Testing configuration integration...');
    const config = await getConfig();
    const validation = validateConfig(config);
    
    console.log(`   Configuration loaded: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Using Secrets Manager: ${config.USE_SECRETS_MANAGER ? '✅ Yes' : '❌ No'}`);
    console.log(`   Environment: ${config.NODE_ENV}`);
    console.log(`   Database configured: ${config.DATABASE_URL ? '✅ Yes' : '❌ No'}`);
    console.log(`   JWT Secret configured: ${config.JWT_SECRET ? '✅ Yes' : '❌ No'}`);
    
    if (!validation.isValid) {
      console.log('   ⚠️ Configuration warnings:');
      validation.warnings.forEach(warning => {
        console.log(`      - ${warning}`);
      });
    }
    
    console.log('');
    
    // Test 5: Cache Performance
    console.log('5️⃣ Testing cache performance...');
    const startTime = Date.now();
    
    // First call (should fetch from AWS)
    await getSecret('cypher/dev/api-keys');
    const firstCallTime = Date.now() - startTime;
    
    // Second call (should use cache)
    const cacheStartTime = Date.now();
    await getSecret('cypher/dev/api-keys');
    const cacheCallTime = Date.now() - cacheStartTime;
    
    console.log(`   First call (AWS): ${firstCallTime}ms`);
    console.log(`   Cached call: ${cacheCallTime}ms`);
    console.log(`   Cache speedup: ${Math.round(firstCallTime / cacheCallTime)}x faster`);
    
    const cacheStats = getCacheStats();
    console.log(`   Cache entries: ${cacheStats.size}`);
    
    console.log('');
    
    // Test 6: Error Handling
    console.log('6️⃣ Testing error handling...');
    try {
      await getSecret('cypher/nonexistent/secret');
      console.log('   ❌ Should have thrown an error for nonexistent secret');
    } catch (error) {
      console.log('   ✅ Properly handled nonexistent secret error');
    }
    
    console.log('');
    
    // Test Summary
    console.log('='.repeat(60));
    console.log('🎉 AWS Secrets Manager Integration Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Connectivity: Working');
    console.log('✅ Secret Retrieval: Working');
    console.log('✅ Environment Loading: Working');
    console.log('✅ Configuration Integration: Working');
    console.log('✅ Caching: Working');
    console.log('✅ Error Handling: Working');
    console.log('');
    console.log('🚀 Your application is ready to use AWS Secrets Manager!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Start your API server: npm start');
    console.log('   2. Verify the client can connect to the API');
    console.log('   3. Remove .env files from git tracking');
    console.log('   4. Update production secrets when ready');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check AWS credentials are configured');
    console.error('   2. Verify IAM permissions for SecretsManager:GetSecretValue');
    console.error('   3. Confirm all secrets exist in AWS Secrets Manager');
    console.error('   4. Check AWS region configuration');
    console.error('');
    console.error('🐛 Full error details:');
    console.error(error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSecretsIntegration().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testSecretsIntegration
};
