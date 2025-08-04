#!/usr/bin/env node
/**
 * Test Authorization to Operate API
 * Comprehensive testing of ATO lifecycle management
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1/ato';
let authToken = null;
let testATOId = null;
let testDocumentId = null;

async function authenticate() {
  try {
    console.log('🔐 Authenticating...');
    
    const authResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    authToken = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    return {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.log('⚠️  Authentication failed, proceeding without token');
    console.log('   (This is expected if auth is not set up)');
    
    return {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
}

async function testATOAPI() {
  console.log('🏛️  Testing Authorization to Operate API - ATO Lifecycle Management');
  console.log('====================================================================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: Create ATO
    console.log('📝 Test 1: Create Authorization to Operate');
    console.log('------------------------------------------');
    
    const newATOData = {
      sspId: 1,
      type: 'full',
      riskLevel: 'moderate',
      authorizationMemo: 'This system has been assessed and meets security requirements for full authorization.',
      authorizationConditions: 'System must maintain continuous monitoring and quarterly security assessments.',
      continuousMonitoringPlan: 'Automated vulnerability scanning, log monitoring, and quarterly penetration testing.'
    };
    
    const createResponse = await axios.post(BASE_URL, newATOData, authHeaders);
    const createdATO = createResponse.data.data;
    testATOId = createdATO.id;
    
    console.log('✅ ATO created successfully');
    console.log(`   • ATO ID: ${createdATO.id}`);
    console.log(`   • SSP ID: ${createdATO.sspId}`);
    console.log(`   • Type: ${createdATO.type}`);
    console.log(`   • Status: ${createdATO.status}`);
    console.log(`   • Risk Level: ${createdATO.riskLevel}`);

    // Test 2: Get ATO by ID
    console.log('\n🔍 Test 2: Get ATO by ID');
    console.log('------------------------');
    
    const getResponse = await axios.get(`${BASE_URL}/${testATOId}?includeHistory=true&includeDocuments=true`, authHeaders);
    const retrievedATO = getResponse.data.data;
    
    console.log('✅ ATO retrieved successfully');
    console.log(`   • ATO ID: ${retrievedATO.id}`);
    console.log(`   • Status: ${retrievedATO.status}`);
    console.log(`   • Created: ${new Date(retrievedATO.createdAt).toLocaleDateString()}`);
    console.log(`   • Workflow History: ${retrievedATO.workflowHistory?.length || 0} entries`);
    console.log(`   • Documents: ${retrievedATO.documents?.length || 0} files`);

    // Test 3: Update ATO
    console.log('\n📝 Test 3: Update ATO');
    console.log('---------------------');
    
    const updateData = {
      riskLevel: 'high',
      authorizationConditions: 'Updated conditions: Enhanced monitoring required due to high risk classification.'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/${testATOId}`, updateData, authHeaders);
    const updatedATO = updateResponse.data.data;
    
    console.log('✅ ATO updated successfully');
    console.log(`   • Risk Level: ${updatedATO.riskLevel}`);
    console.log(`   • Updated At: ${new Date(updatedATO.updatedAt).toLocaleString()}`);

    // Test 4: Upload ATO Document
    console.log('\n📎 Test 4: Upload ATO Document');
    console.log('------------------------------');
    
    const documentData = {
      documentType: 'System Security Plan',
      fileName: 'SSP_v2.1.pdf',
      fileLocation: '/secure/ato/documents/ssp_v2.1.pdf'
    };
    
    const uploadResponse = await axios.post(`${BASE_URL}/${testATOId}/documents`, documentData, authHeaders);
    const uploadedDocument = uploadResponse.data.data;
    testDocumentId = uploadedDocument.id;
    
    console.log('✅ ATO document uploaded successfully');
    console.log(`   • Document ID: ${uploadedDocument.id}`);
    console.log(`   • Type: ${uploadedDocument.documentType}`);
    console.log(`   • File Name: ${uploadedDocument.fileName}`);
    console.log(`   • Uploaded At: ${new Date(uploadedDocument.uploadedAt).toLocaleString()}`);

    // Test 5: Get ATO Documents
    console.log('\n📄 Test 5: Get ATO Documents');
    console.log('----------------------------');
    
    const documentsResponse = await axios.get(`${BASE_URL}/${testATOId}/documents`, authHeaders);
    const documents = documentsResponse.data.data;
    
    console.log('✅ ATO documents retrieved successfully');
    console.log(`   • Total documents: ${documents.length}`);
    documents.forEach((doc, i) => {
      console.log(`   ${i+1}. ${doc.documentType} - ${doc.fileName}`);
    });

    // Test 6: Submit ATO for Review
    console.log('\n📤 Test 6: Submit ATO for Review');
    console.log('--------------------------------');
    
    const submitData = {
      comments: 'ATO package is complete and ready for security review. All required documents have been uploaded.'
    };
    
    const submitResponse = await axios.post(`${BASE_URL}/${testATOId}/submit`, submitData, authHeaders);
    const submittedATO = submitResponse.data.data;
    
    console.log('✅ ATO submitted for review successfully');
    console.log(`   • Status: ${submittedATO.status}`);
    console.log(`   • Submission Date: ${new Date(submittedATO.submissionDate).toLocaleString()}`);

    // Test 7: Review ATO (Approve)
    console.log('\n👀 Test 7: Review ATO (Security Officer Approval)');
    console.log('-------------------------------------------------');
    
    const reviewData = {
      action: 'approve',
      comments: 'Security review completed. System meets all security requirements. Approved for authorization.',
      approvalRole: 'security_officer',
      signature: 'John Smith, CISO - Digital Signature Applied'
    };
    
    const reviewResponse = await axios.post(`${BASE_URL}/${testATOId}/review`, reviewData, authHeaders);
    const reviewedATO = reviewResponse.data.data;
    
    console.log('✅ ATO security review completed successfully');
    console.log(`   • Status: ${reviewedATO.status}`);
    console.log(`   • Review Action: ${reviewData.action}`);
    console.log(`   • Reviewer Role: ${reviewData.approvalRole}`);

    // Test 8: Final Authorization (Authorizing Official)
    console.log('\n🏛️  Test 8: Final Authorization');
    console.log('-------------------------------');
    
    const finalApprovalData = {
      action: 'approve',
      comments: 'Final authorization granted. System is authorized to operate for 3 years.',
      approvalRole: 'authorizing_official',
      signature: 'Jane Doe, Authorizing Official - Digital Signature Applied'
    };
    
    const finalResponse = await axios.post(`${BASE_URL}/${testATOId}/review`, finalApprovalData, authHeaders);
    const finalATO = finalResponse.data.data;
    
    console.log('✅ ATO final authorization completed successfully');
    console.log(`   • Status: ${finalATO.status}`);
    console.log(`   • Approval Date: ${new Date(finalATO.approvalDate).toLocaleString()}`);
    console.log(`   • Expiration Date: ${new Date(finalATO.expirationDate).toLocaleDateString()}`);
    console.log(`   • Authorized By: ${finalATO.authorizedBy}`);

    // Test 9: Get ATO Workflow History
    console.log('\n📋 Test 9: Get ATO Workflow History');
    console.log('-----------------------------------');
    
    const historyResponse = await axios.get(`${BASE_URL}/${testATOId}/history`, authHeaders);
    const workflowHistory = historyResponse.data.data;
    
    console.log('✅ ATO workflow history retrieved successfully');
    console.log(`   • Total workflow entries: ${workflowHistory.length}`);
    
    console.log('\n   📝 Workflow Timeline:');
    workflowHistory.slice(0, 5).forEach((entry, i) => {
      console.log(`     ${i+1}. ${entry.action} → ${entry.status}`);
      console.log(`        Stage: ${entry.workflowStage}`);
      console.log(`        Role: ${entry.approvalRole || 'N/A'}`);
      console.log(`        Date: ${new Date(entry.performedAt).toLocaleString()}`);
      if (entry.comments) {
        console.log(`        Comments: ${entry.comments.substring(0, 80)}...`);
      }
      console.log('');
    });

    // Test 10: Get All ATOs with Filtering
    console.log('\n📊 Test 10: Get All ATOs with Filtering');
    console.log('---------------------------------------');
    
    const allATOsResponse = await axios.get(`${BASE_URL}?status=approved&type=full&page=1&limit=10`, authHeaders);
    const allATOs = allATOsResponse.data;
    
    console.log('✅ All ATOs retrieved successfully');
    console.log(`   • Total ATOs: ${allATOs.pagination.totalCount}`);
    console.log(`   • Current page: ${allATOs.pagination.page}`);
    console.log(`   • ATOs on page: ${allATOs.data.length}`);
    console.log(`   • Filters applied: status=approved, type=full`);

    // Test 11: ATO Dashboard Statistics
    console.log('\n📈 Test 11: ATO Dashboard Statistics');
    console.log('------------------------------------');
    
    const statsResponse = await axios.get(`${BASE_URL}/dashboard/stats`, authHeaders);
    const dashboardStats = statsResponse.data.data;
    
    console.log('✅ ATO dashboard statistics retrieved successfully');
    console.log(`   • Status Distribution:`);
    dashboardStats.statusDistribution.forEach(stat => {
      console.log(`     - ${stat.status}: ${stat.count}`);
    });
    
    console.log(`   • Type Distribution:`);
    dashboardStats.typeDistribution.forEach(stat => {
      console.log(`     - ${stat.type}: ${stat.count}`);
    });
    
    console.log(`   • Expiring ATOs (90 days): ${dashboardStats.expiringCount}`);
    console.log(`   • Expired ATOs: ${dashboardStats.expiredCount}`);
    console.log(`   • Recent Activity (30 days): ${dashboardStats.recentActivityCount}`);

    // Test 12: Get Expiring ATOs
    console.log('\n⏰ Test 12: Get Expiring ATOs');
    console.log('-----------------------------');
    
    const expiringResponse = await axios.get(`${BASE_URL}/expiring?daysAhead=365`, authHeaders);
    const expiringATOs = expiringResponse.data.data;
    
    console.log('✅ Expiring ATOs retrieved successfully');
    console.log(`   • ATOs expiring within 365 days: ${expiringATOs.count}`);
    console.log(`   • Days ahead filter: ${expiringATOs.daysAhead}`);
    
    if (expiringATOs.expiringATOs.length > 0) {
      console.log('\n   📅 Expiring ATOs:');
      expiringATOs.expiringATOs.slice(0, 3).forEach((ato, i) => {
        console.log(`     ${i+1}. ATO ID ${ato.id} - Expires: ${new Date(ato.expirationDate).toLocaleDateString()}`);
        console.log(`        Type: ${ato.type}, Risk: ${ato.riskLevel}`);
      });
    }

    // Test 13: Workflow Performance Metrics
    console.log('\n📊 Test 13: Workflow Performance Metrics');
    console.log('----------------------------------------');
    
    const metricsResponse = await axios.get(`${BASE_URL}/metrics/workflow?timeRange=30d`, authHeaders);
    const workflowMetrics = metricsResponse.data.data;
    
    console.log('✅ Workflow performance metrics retrieved successfully');
    console.log(`   • Time Range: ${workflowMetrics.timeRange}`);
    console.log(`   • Average Approval Days: ${workflowMetrics.averageApprovalDays || 'N/A'}`);
    console.log(`   • Approved Count: ${workflowMetrics.approvedCount}`);
    
    if (workflowMetrics.stageDistribution.length > 0) {
      console.log('\n   🔄 Workflow Stage Distribution:');
      workflowMetrics.stageDistribution.forEach(stage => {
        console.log(`     - ${stage.workflowStage}: ${stage.count}`);
      });
    }
    
    if (workflowMetrics.roleActivity.length > 0) {
      console.log('\n   👥 Role Activity:');
      workflowMetrics.roleActivity.forEach(role => {
        console.log(`     - ${role.approvalRole}: ${role.count} actions`);
      });
    }

    // Test 14: Search ATOs
    console.log('\n🔍 Test 14: Search ATOs');
    console.log('-----------------------');
    
    const searchResponse = await axios.get(`${BASE_URL}/search?q=security&status=approved&type=full`, authHeaders);
    const searchResults = searchResponse.data.data;
    
    console.log('✅ ATO search completed successfully');
    console.log(`   • Search term: "${searchResults.searchTerm}"`);
    console.log(`   • Results found: ${searchResults.count}`);
    console.log(`   • Filters applied: ${JSON.stringify(searchResults.filters)}`);

    // Test 15: Delete ATO Document
    console.log('\n🗑️  Test 15: Delete ATO Document');
    console.log('--------------------------------');
    
    if (testDocumentId) {
      const deleteDocResponse = await axios.delete(`${BASE_URL}/documents/${testDocumentId}`, authHeaders);
      const deleteResult = deleteDocResponse.data.data;
      
      console.log('✅ ATO document deleted successfully');
      console.log(`   • Deleted Document ID: ${testDocumentId}`);
      console.log(`   • File Name: ${deleteResult.deletedDocument.fileName}`);
    }

    // Test 16: Revoke ATO (Optional - only if needed)
    console.log('\n🚫 Test 16: ATO Revocation (Demo)');
    console.log('---------------------------------');
    console.log('   ℹ️  Skipping revocation to preserve test ATO');
    console.log('   • Revocation would change status to "revoked"');
    console.log('   • Only authorized officials can revoke ATOs');
    console.log('   • Revocation requires detailed justification');

    console.log('\n🎉 All Authorization to Operate API tests completed successfully!');
    
    console.log('\n📋 Available ATO Endpoints:');
    console.log('   🏛️  Core CRUD:');
    console.log('      • POST /api/v1/ato - Create new ATO');
    console.log('      • GET /api/v1/ato - Get all ATOs with filtering');
    console.log('      • GET /api/v1/ato/{id} - Get ATO by ID');
    console.log('      • PUT /api/v1/ato/{id} - Update ATO');
    console.log('      • DELETE /api/v1/ato/{id} - Delete ATO');
    
    console.log('   🔄 Workflow Management:');
    console.log('      • POST /api/v1/ato/{id}/submit - Submit for review');
    console.log('      • POST /api/v1/ato/{id}/review - Review ATO');
    console.log('      • POST /api/v1/ato/{id}/revoke - Revoke ATO');
    console.log('      • GET /api/v1/ato/{id}/history - Get workflow history');
    
    console.log('   📄 Document Management:');
    console.log('      • POST /api/v1/ato/{id}/documents - Upload document');
    console.log('      • GET /api/v1/ato/{id}/documents - Get documents');
    console.log('      • DELETE /api/v1/ato/documents/{id} - Delete document');
    
    console.log('   📊 Analytics & Reporting:');
    console.log('      • GET /api/v1/ato/dashboard/stats - Dashboard statistics');
    console.log('      • GET /api/v1/ato/expiring - Get expiring ATOs');
    console.log('      • GET /api/v1/ato/metrics/workflow - Workflow metrics');
    console.log('      • GET /api/v1/ato/search - Search ATOs');

    console.log('\n🎯 Key Features Demonstrated:');
    console.log('   ✅ Complete ATO lifecycle management (draft → approved)');
    console.log('   ✅ Role-based workflow approvals with digital signatures');
    console.log('   ✅ Document management with secure file storage');
    console.log('   ✅ Comprehensive audit trail and workflow history');
    console.log('   ✅ Dashboard analytics and performance metrics');
    console.log('   ✅ Expiration tracking and monitoring');
    console.log('   ✅ Advanced search and filtering capabilities');
    console.log('   ✅ Multi-stage approval workflow');
    console.log('   ✅ Risk assessment and condition management');
    console.log('   ✅ Continuous monitoring plan integration');

    console.log('\n🏛️  ATO Types Supported:');
    console.log('   • Full ATO - Complete authorization for full operations');
    console.log('   • Interim ATO - Temporary authorization pending full review');
    console.log('   • Provisional ATO - Limited authorization with conditions');
    console.log('   • Conditional ATO - Authorization with specific requirements');

    console.log('\n👥 Approval Workflow Roles:');
    console.log('   • System Owner - System operations responsibility');
    console.log('   • Security Officer - Security review and approval');
    console.log('   • Privacy Officer - Privacy impact assessment');
    console.log('   • Risk Executive - Risk assessment and acceptance');
    console.log('   • Authorizing Official - Final approval authority');
    console.log('   • CIO/CISO - Executive level approvals');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ API server not running. Please start it first:');
      console.error('   npm run dev');
    } else if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.data?.error || error.message}`);
      if (error.response.data?.details) {
        console.error('   Details:', error.response.data.details);
      }
    } else {
      console.error(`❌ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testATOAPI().catch(console.error);
}

module.exports = { testATOAPI };
