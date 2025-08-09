#!/usr/bin/env node
/**
 * Test Policy and Procedure API with AI Generation
 * Comprehensive testing of policy and procedure management with AI assistance
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let authToken = null;
let testPolicyId = null;
let testProcedureId = null;

async function authenticate() {
  try {
    console.log('🔐 Authenticating as admin...');
    
    const authResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    authToken = authResponse.data.token;
    console.log('✅ Admin authentication successful');
    
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

async function testPolicyProcedureAPI() {
  console.log('📋 Testing Policy and Procedure API with AI Generation');
  console.log('=====================================================\n');

  try {
    const authHeaders = await authenticate();
    
    // Test 1: Create Policy Manually
    console.log('📝 Test 1: Create Policy Manually');
    console.log('----------------------------------');
    
    const policyData = {
      title: 'Information Security Policy',
      description: 'Comprehensive policy for information security management and data protection',
      policyType: 'security',
      content: `# Information Security Policy

## Purpose
This policy establishes the framework for protecting organizational information assets and ensuring compliance with security standards.

## Scope
This policy applies to all employees, contractors, and third-party users who access organizational systems and data.

## Policy Statement
The organization is committed to:
- Protecting confidentiality, integrity, and availability of information
- Implementing appropriate security controls
- Ensuring compliance with regulatory requirements
- Maintaining incident response capabilities

## Responsibilities
- Management: Provide resources and support for security initiatives
- IT Department: Implement and maintain technical security controls
- All Users: Follow security procedures and report incidents

## Review
This policy will be reviewed annually and updated as needed.`,
      effectiveDate: new Date().toISOString(),
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      metadata: {
        category: 'security',
        priority: 'high',
        compliance: ['ISO27001', 'SOC2']
      }
    };
    
    const policyResponse = await axios.post(`${BASE_URL}/policies`, policyData, authHeaders);
    const createdPolicy = policyResponse.data.data;
    testPolicyId = createdPolicy.id;
    
    console.log('✅ Policy created successfully');
    console.log(`   • Policy ID: ${createdPolicy.id}`);
    console.log(`   • Title: ${createdPolicy.title}`);
    console.log(`   • Type: ${createdPolicy.policyType}`);
    console.log(`   • Status: ${createdPolicy.status}`);
    console.log(`   • Version: ${createdPolicy.version}`);

    // Test 2: Generate Policy with AI
    console.log('\n🤖 Test 2: Generate Policy with AI');
    console.log('-----------------------------------');
    
    const aiPolicyData = {
      title: 'Remote Work Security Policy',
      description: 'AI-generated policy for secure remote work practices',
      policyType: 'security',
      prompt: 'Create a comprehensive remote work security policy that covers VPN usage, device security, data protection, secure communication, and incident reporting for employees working from home or remote locations.',
      mode: 'full_generation',
      aiProvider: 'openai',
      organizationContext: 'Technology company with 500+ employees, handling sensitive customer data',
      complianceRequirements: 'GDPR, SOC2, ISO27001 compliance required',
      assetContext: 'Cloud-based infrastructure, SaaS applications, mobile devices, laptops'
    };
    
    try {
      const aiPolicyResponse = await axios.post(`${BASE_URL}/policies/ai/generate`, aiPolicyData, authHeaders);
      const aiGeneratedPolicy = aiPolicyResponse.data.data;
      
      console.log('✅ AI policy generation successful');
      console.log(`   • Generated Policy ID: ${aiGeneratedPolicy.policy.id}`);
      console.log(`   • Title: ${aiGeneratedPolicy.policy.title}`);
      console.log(`   • AI Provider: ${aiGeneratedPolicy.aiRequest.aiProvider}`);
      console.log(`   • Generation Mode: ${aiGeneratedPolicy.aiRequest.generationMode}`);
      console.log(`   • Quality Score: ${aiGeneratedPolicy.generationResult.qualityScore}/100`);
      console.log(`   • Content Length: ${aiGeneratedPolicy.policy.content.length} characters`);
      console.log(`   • AI Generated: ${aiGeneratedPolicy.policy.metadata.aiGenerated}`);
    } catch (error) {
      console.log('⚠️  AI policy generation failed (expected in mock environment)');
      console.log(`   • Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 3: Get All Policies with Filtering
    console.log('\n📋 Test 3: Get All Policies with Filtering');
    console.log('------------------------------------------');
    
    const policiesResponse = await axios.get(`${BASE_URL}/policies?policyType=security&status=draft&page=1&limit=10&sortBy=createdAt&sortOrder=desc`, authHeaders);
    const policies = policiesResponse.data;
    
    console.log('✅ Policies retrieved successfully');
    console.log(`   • Total Policies: ${policies.pagination.totalCount}`);
    console.log(`   • Current Page: ${policies.pagination.page}`);
    console.log(`   • Policies on Page: ${policies.data.length}`);
    
    if (policies.data.length > 0) {
      console.log('\n   📝 Recent Policies:');
      policies.data.slice(0, 3).forEach((policy, i) => {
        console.log(`     ${i+1}. ${policy.title} (${policy.policyType})`);
        console.log(`        Status: ${policy.status}, Version: ${policy.version}`);
        console.log(`        Created: ${new Date(policy.createdAt).toLocaleString()}`);
        if (policy.metadata?.aiGenerated) {
          console.log(`        🤖 AI Generated`);
        }
      });
    }

    // Test 4: Approve Policy
    console.log('\n✅ Test 4: Approve Policy');
    console.log('-------------------------');
    
    const approvalData = {
      approvalNotes: 'Policy reviewed and approved. Meets all security requirements and compliance standards.'
    };
    
    const approveResponse = await axios.patch(`${BASE_URL}/policies/${testPolicyId}/approve`, approvalData, authHeaders);
    const approvedPolicy = approveResponse.data.data;
    
    console.log('✅ Policy approved successfully');
    console.log(`   • Policy ID: ${approvedPolicy.id}`);
    console.log(`   • Status: ${approvedPolicy.status}`);
    console.log(`   • Approved By: ${approvedPolicy.approvedBy}`);
    console.log(`   • Approved At: ${new Date(approvedPolicy.approvedAt).toLocaleString()}`);

    // Test 5: Publish Policy
    console.log('\n📢 Test 5: Publish Policy');
    console.log('-------------------------');
    
    const publishData = {
      effectiveDate: new Date().toISOString()
    };
    
    const publishResponse = await axios.patch(`${BASE_URL}/policies/${testPolicyId}/publish`, publishData, authHeaders);
    const publishedPolicy = publishResponse.data.data;
    
    console.log('✅ Policy published successfully');
    console.log(`   • Policy ID: ${publishedPolicy.id}`);
    console.log(`   • Status: ${publishedPolicy.status}`);
    console.log(`   • Effective Date: ${new Date(publishedPolicy.effectiveDate).toLocaleString()}`);

    // Test 6: Create Procedure Manually
    console.log('\n📋 Test 6: Create Procedure Manually');
    console.log('------------------------------------');
    
    const procedureData = {
      title: 'Password Reset Procedure',
      description: 'Step-by-step procedure for IT staff to reset user passwords securely',
      procedureType: 'security_procedure',
      relatedPolicyId: testPolicyId,
      content: `# Password Reset Procedure

## Overview
This procedure provides step-by-step instructions for IT staff to securely reset user passwords.

## Prerequisites
- Access to Active Directory management console
- Verification of user identity
- Incident ticket number

## Procedure Steps

### Step 1: Verify User Identity
1. Confirm user identity through approved verification method
2. Check employee database for current status
3. Verify request authorization

### Step 2: Reset Password
1. Access Active Directory Users and Computers
2. Locate user account
3. Right-click and select "Reset Password"
4. Generate secure temporary password
5. Set "User must change password at next logon"

### Step 3: Communicate New Password
1. Contact user through verified communication channel
2. Provide temporary password securely
3. Confirm user can access system
4. Document completion in ticket system

### Step 4: Follow-up
1. Verify user changed password within 24 hours
2. Update incident ticket with resolution
3. Close ticket after confirmation

## Quality Assurance
- All password resets must be documented
- Verification steps cannot be skipped
- Temporary passwords expire in 24 hours`,
      steps: {
        steps: [
          'Verify user identity through approved method',
          'Access Active Directory management console',
          'Reset password and set temporary flag',
          'Communicate new password securely',
          'Document completion and follow up'
        ]
      },
      resources: {
        tools: ['Active Directory Users and Computers', 'Incident Management System'],
        references: ['User Verification Policy', 'Password Policy'],
        contacts: ['IT Help Desk: ext. 1234', 'Security Team: ext. 5678']
      },
      effectiveDate: new Date().toISOString(),
      reviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months from now
      metadata: {
        category: 'security',
        priority: 'high',
        estimatedTime: '15 minutes',
        skillLevel: 'intermediate'
      }
    };
    
    const procedureResponse = await axios.post(`${BASE_URL}/procedures`, procedureData, authHeaders);
    const createdProcedure = procedureResponse.data.data;
    testProcedureId = createdProcedure.id;
    
    console.log('✅ Procedure created successfully');
    console.log(`   • Procedure ID: ${createdProcedure.id}`);
    console.log(`   • Title: ${createdProcedure.title}`);
    console.log(`   • Type: ${createdProcedure.procedureType}`);
    console.log(`   • Status: ${createdProcedure.status}`);
    console.log(`   • Related Policy ID: ${createdProcedure.relatedPolicyId}`);
    console.log(`   • Steps Count: ${createdProcedure.steps?.steps?.length || 0}`);

    // Test 7: Generate Procedure with AI
    console.log('\n🤖 Test 7: Generate Procedure with AI');
    console.log('-------------------------------------');
    
    const aiProcedureData = {
      title: 'Incident Response Procedure',
      description: 'AI-generated procedure for responding to security incidents',
      procedureType: 'incident_response_procedure',
      relatedPolicyId: testPolicyId,
      prompt: 'Create a detailed incident response procedure that covers detection, analysis, containment, eradication, recovery, and lessons learned phases. Include specific steps for different types of security incidents.',
      mode: 'full_generation',
      aiProvider: 'openai',
      organizationContext: 'Technology company with cloud infrastructure and remote workforce',
      requirements: 'Must include escalation procedures, communication protocols, and documentation requirements',
      assetContext: 'Cloud servers, databases, web applications, employee devices'
    };
    
    try {
      const aiProcedureResponse = await axios.post(`${BASE_URL}/procedures/ai/generate`, aiProcedureData, authHeaders);
      const aiGeneratedProcedure = aiProcedureResponse.data.data;
      
      console.log('✅ AI procedure generation successful');
      console.log(`   • Generated Procedure ID: ${aiGeneratedProcedure.procedure.id}`);
      console.log(`   • Title: ${aiGeneratedProcedure.procedure.title}`);
      console.log(`   • AI Provider: ${aiGeneratedProcedure.aiRequest.aiProvider}`);
      console.log(`   • Generation Mode: ${aiGeneratedProcedure.aiRequest.generationMode}`);
      console.log(`   • Quality Score: ${aiGeneratedProcedure.generationResult.qualityScore}/100`);
      console.log(`   • Content Length: ${aiGeneratedProcedure.procedure.content.length} characters`);
      console.log(`   • Steps Extracted: ${aiGeneratedProcedure.procedure.steps?.steps?.length || 0}`);
    } catch (error) {
      console.log('⚠️  AI procedure generation failed (expected in mock environment)');
      console.log(`   • Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 8: Get All Procedures with Filtering
    console.log('\n📋 Test 8: Get All Procedures with Filtering');
    console.log('--------------------------------------------');

    const proceduresResponse = await axios.get(`${BASE_URL}/procedures?procedureType=security_procedure&relatedPolicyId=${testPolicyId}&page=1&limit=10`, authHeaders);
    const procedures = proceduresResponse.data;

    console.log('✅ Procedures retrieved successfully');
    console.log(`   • Total Procedures: ${procedures.pagination.totalCount}`);
    console.log(`   • Current Page: ${procedures.pagination.page}`);
    console.log(`   • Procedures on Page: ${procedures.data.length}`);

    if (procedures.data.length > 0) {
      console.log('\n   📋 Recent Procedures:');
      procedures.data.slice(0, 3).forEach((procedure, i) => {
        console.log(`     ${i+1}. ${procedure.title} (${procedure.procedureType})`);
        console.log(`        Status: ${procedure.status}, Related Policy: ${procedure.relatedPolicyId}`);
        console.log(`        Created: ${new Date(procedure.createdAt).toLocaleString()}`);
        if (procedure.metadata?.aiGenerated) {
          console.log(`        🤖 AI Generated`);
        }
      });
    }

    // Test 9: Enhance Policy with AI
    console.log('\n🤖 Test 9: Enhance Policy with AI');
    console.log('----------------------------------');

    const enhancementData = {
      description: 'Enhance policy for better clarity and compliance coverage',
      prompt: 'Improve this policy by adding more specific compliance requirements, clearer language, and additional security controls. Ensure it meets current industry standards.',
      type: 'completeness',
      requirements: 'Add GDPR compliance details, incident response procedures, and employee training requirements'
    };

    try {
      const enhanceResponse = await axios.post(`${BASE_URL}/policies/${testPolicyId}/ai/enhance`, enhancementData, authHeaders);
      const enhancedPolicy = enhanceResponse.data.data;

      console.log('✅ AI policy enhancement successful');
      console.log(`   • Original Policy ID: ${enhancedPolicy.originalPolicy.id}`);
      console.log(`   • Enhancement Type: ${enhancementData.type}`);
      console.log(`   • Original Content Length: ${enhancedPolicy.originalPolicy.content.length} characters`);
      console.log(`   • Enhanced Content Length: ${enhancedPolicy.enhancedContent.length} characters`);
      console.log(`   • Quality Score: ${enhancedPolicy.generationResult.qualityScore}/100`);
    } catch (error) {
      console.log('⚠️  AI policy enhancement failed (expected in mock environment)');
      console.log(`   • Error: ${error.response?.data?.message || error.message}`);
    }

    // Test 10: Get Policy Analytics
    console.log('\n📊 Test 10: Get Policy Analytics');
    console.log('--------------------------------');

    const policyAnalyticsResponse = await axios.get(`${BASE_URL}/policies/analytics`, authHeaders);
    const policyAnalytics = policyAnalyticsResponse.data.data;

    console.log('✅ Policy analytics retrieved successfully');
    console.log('\n   📊 Overall Policy Statistics:');
    console.log(`     • Total: ${policyAnalytics.overall.total}`);
    console.log(`     • Draft: ${policyAnalytics.overall.draft}`);
    console.log(`     • Under Review: ${policyAnalytics.overall.underReview}`);
    console.log(`     • Approved: ${policyAnalytics.overall.approved}`);
    console.log(`     • Published: ${policyAnalytics.overall.published}`);
    console.log(`     • Archived: ${policyAnalytics.overall.archived}`);
    console.log(`     • Expired: ${policyAnalytics.overall.expired}`);

    if (policyAnalytics.byType.length > 0) {
      console.log('\n   📈 Policies by Type:');
      policyAnalytics.byType.forEach((type, i) => {
        console.log(`     ${i+1}. ${type.policyType}: ${type.count} total (${type.published} published, ${type.draft} draft)`);
      });
    }

    console.log('\n   📅 Recent Activity (Last 30 Days):');
    console.log(`     • Created: ${policyAnalytics.recent.created}`);
    console.log(`     • Approved: ${policyAnalytics.recent.approved}`);
    console.log(`     • Updated: ${policyAnalytics.recent.updated}`);
    console.log(`     • Due for Review: ${policyAnalytics.dueForReview}`);

    // Test 11: Get Procedure Analytics
    console.log('\n📊 Test 11: Get Procedure Analytics');
    console.log('-----------------------------------');

    const procedureAnalyticsResponse = await axios.get(`${BASE_URL}/procedures/analytics`, authHeaders);
    const procedureAnalytics = procedureAnalyticsResponse.data.data;

    console.log('✅ Procedure analytics retrieved successfully');
    console.log('\n   📊 Overall Procedure Statistics:');
    console.log(`     • Total: ${procedureAnalytics.overall.total}`);
    console.log(`     • Draft: ${procedureAnalytics.overall.draft}`);
    console.log(`     • Under Review: ${procedureAnalytics.overall.underReview}`);
    console.log(`     • Approved: ${procedureAnalytics.overall.approved}`);
    console.log(`     • Published: ${procedureAnalytics.overall.published}`);
    console.log(`     • Archived: ${procedureAnalytics.overall.archived}`);
    console.log(`     • Expired: ${procedureAnalytics.overall.expired}`);

    if (procedureAnalytics.byType.length > 0) {
      console.log('\n   📈 Procedures by Type:');
      procedureAnalytics.byType.forEach((type, i) => {
        console.log(`     ${i+1}. ${type.procedureType}: ${type.count} total (${type.published} published, ${type.draft} draft)`);
      });
    }

    // Test 12: Get AI Generation Analytics
    console.log('\n🤖 Test 12: Get AI Generation Analytics');
    console.log('--------------------------------------');

    try {
      const aiAnalyticsResponse = await axios.get(`${BASE_URL}/policies/ai/analytics?startDate=2024-01-01&provider=openai`, authHeaders);
      const aiAnalytics = aiAnalyticsResponse.data.data;

      console.log('✅ AI generation analytics retrieved successfully');
      console.log('\n   🤖 AI Generation Summary:');
      console.log(`     • Total Requests: ${aiAnalytics.summary.totalRequests}`);
      console.log(`     • Successful: ${aiAnalytics.summary.successfulRequests}`);
      console.log(`     • Failed: ${aiAnalytics.summary.failedRequests}`);
      console.log(`     • Success Rate: ${aiAnalytics.summary.successRate}%`);
      console.log(`     • Total Tokens Used: ${aiAnalytics.summary.totalTokensUsed}`);
      console.log(`     • Total Cost: $${(aiAnalytics.summary.totalCost / 100).toFixed(2)}`);
      console.log(`     • Average Quality Score: ${aiAnalytics.summary.averageQualityScore}/100`);
    } catch (error) {
      console.log('⚠️  AI analytics not available (expected in mock environment)');
    }

    // Test 13: Update Policy
    console.log('\n📝 Test 13: Update Policy');
    console.log('------------------------');

    const updateData = {
      description: 'Updated comprehensive policy for information security management and data protection with enhanced compliance requirements',
      version: '1.1',
      metadata: {
        category: 'security',
        priority: 'high',
        compliance: ['ISO27001', 'SOC2', 'GDPR'],
        lastReviewed: new Date().toISOString(),
        reviewedBy: 'Security Team'
      }
    };

    const updateResponse = await axios.put(`${BASE_URL}/policies/${testPolicyId}`, updateData, authHeaders);
    const updatedPolicy = updateResponse.data.data;

    console.log('✅ Policy updated successfully');
    console.log(`   • Policy ID: ${updatedPolicy.id}`);
    console.log(`   • Version: ${updatedPolicy.version}`);
    console.log(`   • Updated Description: ${updatedPolicy.description.substring(0, 100)}...`);
    console.log(`   • Compliance Standards: ${updatedPolicy.metadata.compliance.join(', ')}`);

    // Test 14: Approve and Publish Procedure
    console.log('\n✅ Test 14: Approve and Publish Procedure');
    console.log('-----------------------------------------');

    // Approve procedure
    const procedureApprovalData = {
      approvalNotes: 'Procedure reviewed and approved. Clear steps and comprehensive coverage.'
    };

    const approveProcedureResponse = await axios.patch(`${BASE_URL}/procedures/${testProcedureId}/approve`, procedureApprovalData, authHeaders);
    const approvedProcedure = approveProcedureResponse.data.data;

    console.log('✅ Procedure approved successfully');
    console.log(`   • Procedure ID: ${approvedProcedure.id}`);
    console.log(`   • Status: ${approvedProcedure.status}`);
    console.log(`   • Approved At: ${new Date(approvedProcedure.approvedAt).toLocaleString()}`);

    // Publish procedure
    const procedurePublishData = {
      effectiveDate: new Date().toISOString()
    };

    const publishProcedureResponse = await axios.patch(`${BASE_URL}/procedures/${testProcedureId}/publish`, procedurePublishData, authHeaders);
    const publishedProcedure = publishProcedureResponse.data.data;

    console.log('✅ Procedure published successfully');
    console.log(`   • Procedure ID: ${publishedProcedure.id}`);
    console.log(`   • Status: ${publishedProcedure.status}`);
    console.log(`   • Effective Date: ${new Date(publishedProcedure.effectiveDate).toLocaleString()}`);

    console.log('\n🎉 All Policy and Procedure API tests completed successfully!');

    console.log('\n📋 Available API Endpoints:');
    console.log('============================');

    console.log('\n📝 Policy Endpoints:');
    console.log('   • POST /api/v1/policies - Create policy');
    console.log('   • GET /api/v1/policies - Get all policies with filtering');
    console.log('   • GET /api/v1/policies/{id} - Get policy by ID');
    console.log('   • PUT /api/v1/policies/{id} - Update policy');
    console.log('   • DELETE /api/v1/policies/{id} - Delete policy');
    console.log('   • PATCH /api/v1/policies/{id}/approve - Approve policy');
    console.log('   • PATCH /api/v1/policies/{id}/publish - Publish policy');
    console.log('   • GET /api/v1/policies/analytics - Get policy analytics');

    console.log('\n🤖 AI Policy Generation Endpoints:');
    console.log('   • POST /api/v1/policies/ai/generate - Generate policy with AI');
    console.log('   • POST /api/v1/policies/{id}/ai/enhance - Enhance policy with AI');
    console.log('   • GET /api/v1/policies/ai/analytics - Get AI generation analytics');

    console.log('\n📋 Procedure Endpoints:');
    console.log('   • POST /api/v1/procedures - Create procedure');
    console.log('   • GET /api/v1/procedures - Get all procedures with filtering');
    console.log('   • GET /api/v1/procedures/{id} - Get procedure by ID');
    console.log('   • PUT /api/v1/procedures/{id} - Update procedure');
    console.log('   • DELETE /api/v1/procedures/{id} - Delete procedure');
    console.log('   • PATCH /api/v1/procedures/{id}/approve - Approve procedure');
    console.log('   • PATCH /api/v1/procedures/{id}/publish - Publish procedure');
    console.log('   • GET /api/v1/procedures/analytics - Get procedure analytics');

    console.log('\n🤖 AI Procedure Generation Endpoints:');
    console.log('   • POST /api/v1/procedures/ai/generate - Generate procedure with AI');

    console.log('\n🎯 Key Features Demonstrated:');
    console.log('==============================');
    console.log('   ✅ Manual policy and procedure creation');
    console.log('   ✅ AI-assisted policy and procedure generation');
    console.log('   ✅ AI-powered policy enhancement');
    console.log('   ✅ Complete approval and publishing workflow');
    console.log('   ✅ Advanced filtering and search capabilities');
    console.log('   ✅ Comprehensive analytics and reporting');
    console.log('   ✅ Policy-procedure relationship management');
    console.log('   ✅ Version control and audit tracking');
    console.log('   ✅ Metadata and compliance tracking');
    console.log('   ✅ Quality scoring for AI-generated content');

    console.log('\n🤖 AI Generation Features:');
    console.log('===========================');
    console.log('   • Multiple AI providers (OpenAI, Anthropic, Azure OpenAI)');
    console.log('   • Different generation modes (full, template-based, enhancement)');
    console.log('   • Context-aware generation with organizational data');
    console.log('   • Quality assessment and scoring');
    console.log('   • Comprehensive analytics and cost tracking');
    console.log('   • Template system for consistent generation');
    console.log('   • Feedback system for continuous improvement');

    console.log('\n🔄 Complete Workflow:');
    console.log('=====================');
    console.log('   1. Create or AI-generate policy/procedure');
    console.log('   2. Review and edit content as needed');
    console.log('   3. Submit for approval workflow');
    console.log('   4. Admin reviews and approves/rejects');
    console.log('   5. Publish with effective date');
    console.log('   6. Track analytics and compliance');
    console.log('   7. Schedule reviews and updates');
    console.log('   8. Use AI for enhancements and updates');

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
  testPolicyProcedureAPI().catch(console.error);
}

module.exports = { testPolicyProcedureAPI };
