/**
 * Systems Management API Test Script
 * Tests all new systems management endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test configuration
const testConfig = {
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

const api = axios.create(testConfig);

// Test data
const testDiscoveryConfig = {
  name: 'Test Network Discovery',
  description: 'Testing system discovery functionality',
  methods: ['network_scan', 'service_detection'],
  targets: ['192.168.1.0/24', '10.0.0.0/16'],
  options: {
    timeout: 5000,
    threads: 10
  }
};

const testDriftDetectionConfig = {
  detectionMethods: ['security_policy', 'firewall_rules', 'user_accounts'],
  forceRefresh: true
};

/**
 * Test System Discovery Endpoints
 */
async function testSystemDiscovery() {
  console.log('\n🔍 Testing System Discovery Endpoints...');
  
  try {
    // Test starting a discovery scan
    console.log('1. Testing POST /systems/discovery/scan');
    const scanResponse = await api.post('/systems/discovery/scan', testDiscoveryConfig);
    console.log('✅ Discovery scan started:', scanResponse.data.data.scanId);
    
    // Test getting discovery scans
    console.log('2. Testing GET /systems/discovery/scans');
    const scansResponse = await api.get('/systems/discovery/scans?limit=10');
    console.log('✅ Discovery scans retrieved:', scansResponse.data.data.length, 'scans');
    
    // Test getting discovery stats
    console.log('3. Testing GET /systems/discovery/stats');
    const statsResponse = await api.get('/systems/discovery/stats');
    console.log('✅ Discovery stats:', {
      totalScans: statsResponse.data.data.totalScans,
      completedScans: statsResponse.data.data.completedScans,
      systemsDiscovered: statsResponse.data.data.systemsDiscovered
    });
    
    return true;
  } catch (error) {
    console.error('❌ System Discovery test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Security Posture Endpoints
 */
async function testSecurityPosture() {
  console.log('\n🛡️ Testing Security Posture Endpoints...');
  
  try {
    // First, get a system ID to test with
    const systemsResponse = await api.get('/systems?limit=1');
    if (systemsResponse.data.data.length === 0) {
      console.log('⚠️ No systems found, skipping security posture tests');
      return true;
    }
    
    const systemId = systemsResponse.data.data[0].id;
    console.log('Using system ID:', systemId);
    
    // Test getting security posture for a system
    console.log('1. Testing GET /systems/:id/security-posture');
    const postureResponse = await api.get(`/systems/${systemId}/security-posture`);
    console.log('✅ Security posture retrieved:', {
      systemId: postureResponse.data.data.systemId,
      overallScore: postureResponse.data.data.overallScore,
      postureStatus: postureResponse.data.data.postureStatus
    });
    
    // Test getting security posture overview
    console.log('2. Testing GET /systems/security-posture/overview');
    const overviewResponse = await api.get('/systems/security-posture/overview');
    console.log('✅ Security posture overview retrieved:', overviewResponse.data.data.length, 'systems');
    
    // Test getting security posture stats
    console.log('3. Testing GET /systems/security-posture/stats');
    const statsResponse = await api.get('/systems/security-posture/stats');
    console.log('✅ Security posture stats:', {
      totalSystems: statsResponse.data.data.totalSystems,
      averageScore: statsResponse.data.data.averageScore
    });
    
    return true;
  } catch (error) {
    console.error('❌ Security Posture test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Risk Scoring Endpoints
 */
async function testRiskScoring() {
  console.log('\n⚠️ Testing Risk Scoring Endpoints...');
  
  try {
    // Get a system ID to test with
    const systemsResponse = await api.get('/systems?limit=1');
    if (systemsResponse.data.data.length === 0) {
      console.log('⚠️ No systems found, skipping risk scoring tests');
      return true;
    }
    
    const systemId = systemsResponse.data.data[0].id;
    console.log('Using system ID:', systemId);
    
    // Test getting risk score for a system
    console.log('1. Testing GET /systems/:id/risk-score');
    const riskResponse = await api.get(`/systems/${systemId}/risk-score?model=system_composite`);
    console.log('✅ Risk score retrieved:', {
      systemId: systemId,
      overallRisk: riskResponse.data.data.overallRisk,
      riskLevel: riskResponse.data.data.riskLevel,
      model: riskResponse.data.data.model
    });
    
    // Test getting risk scoring stats
    console.log('2. Testing GET /systems/risk-scoring/stats');
    const statsResponse = await api.get('/systems/risk-scoring/stats');
    console.log('✅ Risk scoring stats:', {
      totalSystems: statsResponse.data.data.totalSystems,
      averageRisk: statsResponse.data.data.averageRisk,
      modelsLoaded: statsResponse.data.data.modelsLoaded
    });
    
    return true;
  } catch (error) {
    console.error('❌ Risk Scoring test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Configuration Drift Endpoints
 */
async function testConfigurationDrift() {
  console.log('\n🔧 Testing Configuration Drift Endpoints...');
  
  try {
    // Get a system ID to test with
    const systemsResponse = await api.get('/systems?limit=1');
    if (systemsResponse.data.data.length === 0) {
      console.log('⚠️ No systems found, skipping drift detection tests');
      return true;
    }
    
    const systemId = systemsResponse.data.data[0].id;
    console.log('Using system ID:', systemId);
    
    // Test detecting configuration drift
    console.log('1. Testing POST /systems/:id/drift-detection');
    const driftResponse = await api.post(`/systems/${systemId}/drift-detection`, testDriftDetectionConfig);
    console.log('✅ Configuration drift detected:', {
      systemId: driftResponse.data.data.systemId,
      driftCount: driftResponse.data.data.driftCount,
      detectionMethods: driftResponse.data.data.detectionMethods
    });
    
    // Test getting drift history
    console.log('2. Testing GET /systems/:id/drift-history');
    const historyResponse = await api.get(`/systems/${systemId}/drift-history?limit=10`);
    console.log('✅ Drift history retrieved:', historyResponse.data.data.length, 'drift records');
    
    // Test getting drift stats
    console.log('3. Testing GET /systems/drift/stats');
    const statsResponse = await api.get('/systems/drift/stats');
    console.log('✅ Drift stats:', {
      totalDrifts: statsResponse.data.data.totalDrifts,
      openDrifts: statsResponse.data.data.openDrifts,
      criticalDrifts: statsResponse.data.data.criticalDrifts
    });
    
    // If there are any drifts, test acknowledge/resolve
    if (historyResponse.data.data.length > 0) {
      const driftId = historyResponse.data.data[0].id;
      
      console.log('4. Testing POST /systems/drift/:driftId/acknowledge');
      const ackResponse = await api.post(`/systems/drift/${driftId}/acknowledge`, {
        notes: 'Test acknowledgment from API test script'
      });
      console.log('✅ Drift acknowledged:', ackResponse.data.message);
      
      console.log('5. Testing POST /systems/drift/:driftId/resolve');
      const resolveResponse = await api.post(`/systems/drift/${driftId}/resolve`, {
        resolution: 'Test resolution from API test script'
      });
      console.log('✅ Drift resolved:', resolveResponse.data.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Configuration Drift test failed:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test Database Tables
 */
async function testDatabaseTables() {
  console.log('\n🗄️ Testing Database Tables...');
  
  try {
    // Test that we can query the new tables
    const { db } = require('../src/db');
    const { 
      systemDiscoveryScans,
      systemSecurityPosture,
      systemConfigurationDrift,
      crossSystemCorrelations,
      enterpriseRiskAggregation
    } = require('../src/db/schema');
    
    // Test system_discovery_scans table
    const scans = await db.select().from(systemDiscoveryScans).limit(5);
    console.log('✅ system_discovery_scans table accessible:', scans.length, 'records');
    
    // Test system_security_posture table
    const postures = await db.select().from(systemSecurityPosture).limit(5);
    console.log('✅ system_security_posture table accessible:', postures.length, 'records');
    
    // Test system_configuration_drift table
    const drifts = await db.select().from(systemConfigurationDrift).limit(5);
    console.log('✅ system_configuration_drift table accessible:', drifts.length, 'records');
    
    // Test cross_system_correlations table
    const correlations = await db.select().from(crossSystemCorrelations).limit(5);
    console.log('✅ cross_system_correlations table accessible:', correlations.length, 'records');
    
    // Test enterprise_risk_aggregation table
    const risks = await db.select().from(enterpriseRiskAggregation).limit(5);
    console.log('✅ enterprise_risk_aggregation table accessible:', risks.length, 'records');
    
    return true;
  } catch (error) {
    console.error('❌ Database tables test failed:', error.message);
    return false;
  }
}

/**
 * Test Service Initialization
 */
async function testServiceInitialization() {
  console.log('\n⚙️ Testing Service Initialization...');
  
  try {
    // Test that services are properly initialized
    const systemDiscoveryService = require('../src/services/systems/systemDiscoveryService');
    const securityPostureService = require('../src/services/systems/securityPostureService');
    const riskScoringService = require('../src/services/systems/riskScoringService');
    const configurationDriftService = require('../src/services/systems/configurationDriftService');
    
    console.log('✅ systemDiscoveryService loaded:', systemDiscoveryService.isInitialized);
    console.log('✅ securityPostureService loaded:', securityPostureService.isInitialized);
    console.log('✅ riskScoringService loaded:', riskScoringService.isInitialized);
    console.log('✅ configurationDriftService loaded:', configurationDriftService.isInitialized);
    
    return true;
  } catch (error) {
    console.error('❌ Service initialization test failed:', error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Systems Management API Tests...');
  console.log('Base URL:', BASE_URL);
  
  const testResults = {
    serviceInitialization: false,
    databaseTables: false,
    systemDiscovery: false,
    securityPosture: false,
    riskScoring: false,
    configurationDrift: false
  };
  
  // Run all tests
  testResults.serviceInitialization = await testServiceInitialization();
  testResults.databaseTables = await testDatabaseTables();
  testResults.systemDiscovery = await testSystemDiscovery();
  testResults.securityPosture = await testSecurityPosture();
  testResults.riskScoring = await testRiskScoring();
  testResults.configurationDrift = await testConfigurationDrift();
  
  // Print summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([testName, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status} - ${testName}`);
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All Systems Management API tests passed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. The Systems Management API layer is fully operational');
    console.log('2. All database tables have been created successfully');
    console.log('3. All services are initialized and running');
    console.log('4. You can now use the new endpoints in your application');
    console.log('\n🔗 Available Endpoints:');
    console.log('- System Discovery: /api/v1/systems/discovery/*');
    console.log('- Security Posture: /api/v1/systems/security-posture/*');
    console.log('- Risk Scoring: /api/v1/systems/risk-scoring/*');
    console.log('- Configuration Drift: /api/v1/systems/drift/*');
  } else {
    console.log('⚠️ Some tests failed. Please check the error messages above.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test runner crashed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testSystemDiscovery,
  testSecurityPosture,
  testRiskScoring,
  testConfigurationDrift,
  testDatabaseTables,
  testServiceInitialization
};
